import { Injectable } from '@angular/core';
import { Utility } from '../../../shared/classes/utility';
import { ShaderService } from '../shaders/shader.service';
import { MATERIAL_CONFIG } from '../models/materials';
import {
  TRANSFORMS_UBO_BINDING_INDEX,
  LIGHT_CONFIG_UBO_BINDING_INDEX,
  MATERIAL_CONFIG_UBO_BINDING_INDEX,
  OVERLAY_UBO_BINDING_INDEX,
  TIME_UBO_BINDING_INDEX,
  SKYBOX_TRANSFORMS_UBO_BINDING_INDEX,
} from '../shaders/constants';
import { mat3, mat4, vec4 } from 'gl-matrix';
import { GlService } from './gl.service';

/** std124 padding. */
const _ = 0;

@Injectable({ providedIn: 'root' })
export class UniformService {
  /** Homogeneous light vector (w == 0). */
  public static UNIT_LIGHT_DIRECTION = vec4.fromValues(0.0572181596, 0.68661791522, 0.72476335496, 0);
  private lightConfigBuffer!: WebGLBuffer;
  private materialConfigBuffer!: WebGLBuffer;
  private overlayBuffer!: WebGLBuffer;
  private skyboxTransformsBuffer!: WebGLBuffer;
  private timeBuffer!: WebGLBuffer;
  private transformsBuffer!: WebGLBuffer;
  private modelTransformStackPointer: number = 0;
  /** Preallocated model transform stack. Typed array creation is slow. */
  private readonly modelTransformStack = [mat4.create(), mat4.create(), mat4.create(), mat4.create()];
  // One backing store buffer matching the uniform block with two matrix views.
  private readonly transformsUniformStore = new ArrayBuffer(128); // 2 each 4x4 floats
  private readonly modelViewMatrix = new Float32Array(this.transformsUniformStore, 0, 16);
  private readonly modelViewProjectionMatrix = new Float32Array(this.transformsUniformStore, 64, 16);
  private readonly skyboxTransformsFloats = new Float32Array(16);
  // prettier-ignore
  private readonly lightConfig = new Float32Array([
    0, 1, 0, // unit light direction (placeholder values)
    _,
    0.9, 0.9, 1.0, // light color
    0.5, // ambient intensity
  ]);
  private readonly lightDirection = new Float32Array(this.lightConfig.buffer, 0, 4);
  // std140 layout w/ mij = i'th row, j'th column of projection:
  // m00 m10 m20 _ m01 m11 m21 _ m02 m12 m22 __ alpha __ __ __
  //  0   1   2  3  4   5   6  7  8   9  10  11   12  13 14 15
  public readonly overlayFloats = new Float32Array(16);
  public readonly timeFloats = new Float32Array(4);

  constructor(
    private readonly glService: GlService,
    private readonly shaderService: ShaderService,
  ) {}

  /**
   * Does uniform setups that need occur only once per animation.
   * Currently includes transformations, lighting config, materials, and overlay icon projection.
   */
  public prepareUniforms(): void {
    const gl = this.glService.gl;
    const facetMeshProgram = this.shaderService.getProgram('colored_mesh');
    const facetMeshInstancesProgram = this.shaderService.getProgram('colored_mesh_instances');
    const overlayProgram = this.shaderService.getProgram('overlay');
    const riverProgram = this.shaderService.getProgram('river');
    const skyProgram = this.shaderService.getProgram('sky');
    const terrainProgram = this.shaderService.getProgram('terrain');
    const texturedMeshProgram = this.shaderService.getProgram('textured_mesh');
    const texturedMeshInstancesProgram = this.shaderService.getProgram('textured_mesh_instances');
    const wireProgram = this.shaderService.getProgram('wire');
    const wireInstancesProgram = this.shaderService.getProgram('wire_instances');

    this.transformsBuffer = this.setUpUniformBlock(
      [
        facetMeshProgram,
        facetMeshInstancesProgram,
        riverProgram,
        terrainProgram,
        texturedMeshProgram,
        texturedMeshInstancesProgram,
        wireProgram,
        wireInstancesProgram,
      ],
      'Transforms',
      TRANSFORMS_UBO_BINDING_INDEX,
    );
    gl.bufferData(gl.UNIFORM_BUFFER, this.transformsUniformStore.byteLength, gl.DYNAMIC_DRAW);

    this.skyboxTransformsBuffer = this.setUpUniformBlock(
      [skyProgram],
      'SkyboxTransforms',
      SKYBOX_TRANSFORMS_UBO_BINDING_INDEX,
    );
    gl.bufferData(gl.UNIFORM_BUFFER, this.skyboxTransformsFloats.buffer.byteLength, gl.DYNAMIC_DRAW);

    this.lightConfigBuffer = this.setUpUniformBlock(
      [
        facetMeshProgram,
        facetMeshInstancesProgram,
        riverProgram,
        terrainProgram,
        texturedMeshProgram,
        texturedMeshInstancesProgram,
        wireProgram,
        wireInstancesProgram,
      ],
      'LightConfig',
      LIGHT_CONFIG_UBO_BINDING_INDEX,
    );
    gl.bufferData(gl.UNIFORM_BUFFER, this.lightConfig.buffer.byteLength, gl.STATIC_DRAW);

    this.materialConfigBuffer = this.setUpUniformBlock(
      [facetMeshProgram, facetMeshInstancesProgram],
      'MaterialConfig',
      MATERIAL_CONFIG_UBO_BINDING_INDEX,
    );
    gl.bufferData(gl.UNIFORM_BUFFER, MATERIAL_CONFIG, gl.STATIC_DRAW);

    this.overlayBuffer = this.setUpUniformBlock([overlayProgram], 'Overlay', OVERLAY_UBO_BINDING_INDEX);
    gl.bufferData(gl.UNIFORM_BUFFER, this.overlayFloats.buffer.byteLength, gl.DYNAMIC_DRAW);

    this.timeBuffer = this.setUpUniformBlock([riverProgram], 'Time', TIME_UBO_BINDING_INDEX);
    gl.bufferData(gl.UNIFORM_BUFFER, this.timeFloats, gl.DYNAMIC_DRAW);
  }

  /** The current model matrix top of stack. */
  public get modelMatrix(): mat4 {
    return this.modelTransformStack[this.modelTransformStackPointer];
  }

  /** Pushes the model matrix stack, copying the old top to the new one and returning it. */
  public pushModelMatrix(): mat4 {
    const stack = this.modelTransformStack;
    const sp = ++this.modelTransformStackPointer;
    if (sp >= stack.length) {
      throw new Error('Model transform stack overflow');
    }
    return mat4.copy(stack[sp], stack[sp - 1]);
  }

  /** Pops the model matrix stack, restoring the value prior to the previous push. */
  public popModelMatrix() {
    if (this.modelTransformStackPointer <= 0) {
      throw new Error('Model transform stack underflow');
    }
    --this.modelTransformStackPointer;
  }

  /** Updates the value of global alpha. gl.BLEND must be enabled. Used e.g. by the colored mesh shader. */
  public updateGlobalAlpha(globalAlpha: number): void {
    const gl = this.glService.gl;
    gl.bindBuffer(gl.UNIFORM_BUFFER, this.materialConfigBuffer);
    MATERIAL_CONFIG[0] = globalAlpha;
    gl.bufferSubData(gl.UNIFORM_BUFFER, 0, MATERIAL_CONFIG, 0, 4);
  }

  /** Updates the shader transforms uniform with current model matrix and given view and projection matrices. */
  public updateTransformsUniform(viewMatrix: mat4, projectionMatrix: mat4): void {
    mat4.multiply(this.modelViewMatrix, viewMatrix, this.modelMatrix);
    mat4.multiply(this.modelViewProjectionMatrix, projectionMatrix, this.modelViewMatrix);
    const gl = this.glService.gl;
    gl.bindBuffer(gl.UNIFORM_BUFFER, this.transformsBuffer);
    gl.bufferSubData(gl.UNIFORM_BUFFER, 0, this.transformsUniformStore);
  }

  /** Transforms the constant light direction with the view matrix and updates the light config uniform. */
  public updateLightDirection(viewMatrix: mat4) {
    vec4.transformMat4(this.lightDirection, UniformService.UNIT_LIGHT_DIRECTION, viewMatrix);
    const gl = this.glService.gl;
    gl.bindBuffer(gl.UNIFORM_BUFFER, this.lightConfigBuffer);
    gl.bufferSubData(gl.UNIFORM_BUFFER, 0, this.lightConfig);
  }

  /** Updates the overlay uniform block contents. */
  public updateOverlayUniform(projection: mat3, alpha: number = 1): void {
    UniformService.copyMat3ToStd140(this.overlayFloats, projection);
    this.overlayFloats[12] = alpha;

    const gl = this.glService.gl;
    gl.bindBuffer(gl.UNIFORM_BUFFER, this.overlayBuffer);
    gl.bufferSubData(gl.UNIFORM_BUFFER, 0, this.overlayFloats.buffer);
  }

  public updateSkyboxTransformsUniform(viewMatrix: mat4, projectionMatrix: mat4) {
    // Use the transform buffer to hold the view rotation initially.
    const viewRotation = this.skyboxTransformsFloats;
    mat4.copy(viewRotation, viewMatrix);
    // Zero out the translation component and left-multiply the projection.
    viewRotation[12] = viewRotation[13] = viewRotation[14] = 0;
    mat4.multiply(this.skyboxTransformsFloats, projectionMatrix, viewRotation);

    const gl = this.glService.gl;
    gl.bindBuffer(gl.UNIFORM_BUFFER, this.skyboxTransformsBuffer);
    gl.bufferSubData(gl.UNIFORM_BUFFER, 0, this.skyboxTransformsFloats.buffer);
  }

  /** Updates time uniform block contents. */
  public updateTimeUniform(clockMillis: number): void {
    // Clock cycles every 32 seconds to match uniform clock usage.
    this.timeFloats[0] = (clockMillis % 32000) * 0.001;

    const gl = this.glService.gl;
    gl.bindBuffer(gl.UNIFORM_BUFFER, this.timeBuffer);
    gl.bufferSubData(gl.UNIFORM_BUFFER, 0, this.timeFloats.buffer);
  }

  /** Does boilerplate setup operations for a uniform block. */
  private setUpUniformBlock(programs: WebGLProgram[], name: string, bindingIndex: number): WebGLBuffer {
    const gl = this.glService.gl;
    const buffer = Utility.assertNotNull(gl.createBuffer());
    gl.bindBufferBase(gl.UNIFORM_BUFFER, bindingIndex, buffer);
    programs.forEach(program => gl.uniformBlockBinding(program, gl.getUniformBlockIndex(program, name), bindingIndex));
    return buffer;
  }

  /** Copies the columns of a given source mat3 to a std140 block of three 4-float chunks. Padding isn't set. */
  private static copyMat3ToStd140(dst: Float32Array, src: mat3) {
    dst[0] = src[0];
    dst[1] = src[1];
    dst[2] = src[2];
    dst[4] = src[3];
    dst[5] = src[4];
    dst[6] = src[5];
    dst[8] = src[6];
    dst[9] = src[7];
    dst[10] = src[8];
  }
}
