import { Injectable } from '@angular/core';
import { Utility } from '../../../shared/classes/utility';
import { ShaderService } from '../shaders/shader.service';
import { MATERIAL_CONFIG } from '../models/materials';
import {
  TRANSFORMS_UBO_BINDING_INDEX,
  LIGHT_CONFIG_UBO_BINDING_INDEX,
  MATERIAL_CONFIG_UBO_BINDING_INDEX,
  TIME_UBO_BINDING_INDEX,
  SKYBOX_TRANSFORMS_UBO_BINDING_INDEX,
} from '../shaders/constants';
import { mat4 } from 'gl-matrix';
import { GlService } from './gl.service';
import { UNIT_LIGHT_DIRECTION } from './constants';

/** Source matrices needed to populate shader transforms. */
export type DisplayMatrices = {
  view: mat4;
  projection: mat4;
  lightView: mat4;
  trapezoidalProjection: mat4;
};
/** Matrix for shifting canonical post-projection coordinates to texture space. */
// prettier-ignore
const CANON_TO_TEX = mat4.fromValues(
  0.5, 0,   0,   0,
  0,   0.5, 0,   0,
  0,   0,   0.5, 0,
  0.5, 0.5, 0.5, 1,
);
@Injectable({ providedIn: 'root' })
export class UniformService {
  /** Homogeneous light vector (w == 0). */
  private lightConfigBuffer!: WebGLBuffer;
  private materialConfigBuffer!: WebGLBuffer;
  private skyboxTransformsBuffer!: WebGLBuffer;
  private timeBuffer!: WebGLBuffer;
  private transformsBuffer!: WebGLBuffer;
  private modelTransformStackPointer: number = 0;
  /** Preallocated model transform stack. Typed array creation is slow. */
  private readonly modelTransformStack = [mat4.create(), mat4.create(), mat4.create(), mat4.create()];
  // One backing store buffer matching the uniform block with two matrix views.
  private readonly transformsUniformStore = new ArrayBuffer(192); // 3 each 4x4 floats
  private readonly modelViewMatrix = new Float32Array(this.transformsUniformStore, 0, 16);
  private readonly modelViewProjectionMatrix = new Float32Array(this.transformsUniformStore, 64, 16);
  private readonly depthMapLookupMatrix = new Float32Array(this.transformsUniformStore, 128, 16);
  private readonly skyboxTransformsFloats = new Float32Array(16);
  // prettier-ignore
  private readonly lightConfig = new Float32Array([
      0, 1, 0, // unit light direction (placeholder values)
      0.5, // brightness
      0.9, 0.9, 1.0, // light color
      0.3, // ambient intensity
      1.0, // shadow multiplier
      0, 0, 0, // padding
  ]);
  // Last 3 of chunk aren't currently used.
  public readonly time = new Float32Array(4);

  constructor(
    private readonly glService: GlService,
    private readonly shaderService: ShaderService,
  ) {}

  /** Sets up all uniforms except textures. */
  public prepareUniforms(): void {
    const gl = this.glService.gl;
    const bucklingMemberProgram = this.shaderService.getProgram('buckling_member');
    const facetMeshProgram = this.shaderService.getProgram('colored_mesh');
    const facetMeshInstancesProgram = this.shaderService.getProgram('colored_mesh_instances');
    const instanceColoredMeshProgram = this.shaderService.getProgram('instance_colored_mesh');
    const riverProgram = this.shaderService.getProgram('river');
    const skyProgram = this.shaderService.getProgram('sky');
    const terrainProgram = this.shaderService.getProgram('terrain');
    const texturedMeshProgram = this.shaderService.getProgram('textured_mesh');
    const texturedMeshInstancesProgram = this.shaderService.getProgram('textured_mesh_instances');
    const wireProgram = this.shaderService.getProgram('wire');
    const wireInstancesProgram = this.shaderService.getProgram('wire_instances');

    this.transformsBuffer = this.setUpUniformBlock(
      [
        bucklingMemberProgram,
        facetMeshProgram,
        facetMeshInstancesProgram,
        instanceColoredMeshProgram,
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
        bucklingMemberProgram,
        facetMeshProgram,
        facetMeshInstancesProgram,
        instanceColoredMeshProgram,
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
    gl.bufferData(gl.UNIFORM_BUFFER, this.lightConfig.byteLength, gl.STATIC_DRAW);

    this.materialConfigBuffer = this.setUpUniformBlock(
      [facetMeshProgram, facetMeshInstancesProgram],
      'MaterialConfig',
      MATERIAL_CONFIG_UBO_BINDING_INDEX,
    );
    gl.bufferData(gl.UNIFORM_BUFFER, MATERIAL_CONFIG, gl.STATIC_DRAW);

    this.timeBuffer = this.setUpUniformBlock([riverProgram], 'Time', TIME_UBO_BINDING_INDEX);
    gl.bufferData(gl.UNIFORM_BUFFER, this.time, gl.DYNAMIC_DRAW);
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
  public updateTransformsUniform(matrices: DisplayMatrices): void {
    mat4.multiply(this.modelViewMatrix, matrices.view, this.modelMatrix);
    mat4.multiply(this.modelViewProjectionMatrix, matrices.projection, this.modelViewMatrix);
    mat4.multiply(this.depthMapLookupMatrix, matrices.lightView, this.modelMatrix);
    mat4.multiply(this.depthMapLookupMatrix, matrices.trapezoidalProjection, this.depthMapLookupMatrix);
    mat4.multiply(this.depthMapLookupMatrix, CANON_TO_TEX, this.depthMapLookupMatrix);
    const gl = this.glService.gl;
    gl.bindBuffer(gl.UNIFORM_BUFFER, this.transformsBuffer);
    gl.bufferSubData(gl.UNIFORM_BUFFER, 0, this.transformsUniformStore);
  }

  /** Transforms the constant light direction with the view matrix and updates the light config uniform. */
  public updateLight(viewMatrix: mat4, brightness: number, shadowWeight: number) {
    const u = UNIT_LIGHT_DIRECTION;
    const c = this.lightConfig;
    // gl-matrix doesn't do vector operaions.
    c[0] = viewMatrix[0] * u[0] + viewMatrix[4] * u[1] + viewMatrix[8] * u[2];
    c[1] = viewMatrix[1] * u[0] + viewMatrix[5] * u[1] + viewMatrix[9] * u[2];
    c[2] = viewMatrix[2] * u[0] + viewMatrix[6] * u[1] + viewMatrix[10] * u[2];
    c[3] = brightness;
    c[8] = shadowWeight;
    const gl = this.glService.gl;
    gl.bindBuffer(gl.UNIFORM_BUFFER, this.lightConfigBuffer);
    gl.bufferSubData(gl.UNIFORM_BUFFER, 0, this.lightConfig.buffer);
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
    this.time[0] = (clockMillis % 32000) * 0.001;

    const gl = this.glService.gl;
    gl.bindBuffer(gl.UNIFORM_BUFFER, this.timeBuffer);
    gl.bufferSubData(gl.UNIFORM_BUFFER, 0, this.time.buffer);
  }

  /** Does boilerplate setup operations for a uniform block. */
  private setUpUniformBlock(programs: WebGLProgram[], name: string, bindingIndex: number): WebGLBuffer {
    const gl = this.glService.gl;
    const buffer = Utility.assertNotNull(gl.createBuffer());
    gl.bindBufferBase(gl.UNIFORM_BUFFER, bindingIndex, buffer);
    programs.forEach(program => gl.uniformBlockBinding(program, gl.getUniformBlockIndex(program, name), bindingIndex));
    return buffer;
  }
}
