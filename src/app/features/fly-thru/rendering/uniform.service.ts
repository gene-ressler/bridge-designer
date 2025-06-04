import { Injectable } from '@angular/core';
import { Utility } from '../../../shared/classes/utility';
import { ShaderService } from '../shaders/shader.service';
import { MATERIAL_CONFIG } from '../models/materials';
import {
  TRANSFORMS_UBO_BINDING_INDEX,
  LIGHT_CONFIG_UBO_BINDING_INDEX,
  MATERIAL_CONFIG_UBO_BINDING_INDEX,
  OVERLAY_UBO_BINDING_INDEX,
} from '../shaders/constants';
import { mat3, mat4, vec4 } from 'gl-matrix';
import { GlService } from './gl.service';

/** std124 padding. */
const _ = 0;

@Injectable({ providedIn: 'root' })
export class UniformService {
  public static UNIT_LIGHT_DIRECTION = vec4.fromValues(0.0572181596, 0.68661791522, 0.72476335496, 0);
  private transformsBuffer!: WebGLBuffer;
  private lightConfigBuffer!: WebGLBuffer;
  private overlayBuffer!: WebGLBuffer;
  private modelTransformStackPointer: number = 0;
  private readonly modelTransformStack = (() => {
    const stack = [];
    for (let i = 0; i < 5; ++i) {
      stack.push(mat4.create());
    }
    return stack;
  })();
  // One backing store buffer matching the uniform block with two matrix views.
  private readonly transformsUniformStore = new ArrayBuffer(128); // 2 each 4x4 floats
  private readonly modelViewMatrix = new Float32Array(this.transformsUniformStore, 0, 16);
  private readonly modelViewProjectionMatrix = new Float32Array(this.transformsUniformStore, 64, 16);
  // prettier-ignore
  private readonly lightConfig = new Float32Array([
    1, 0, 0, // unit light direction (placeholder values)
    _,
    0.9, 0.9, 1.0, // light color
    0.25, // ambient intensity
  ]);
  public readonly overlayStore = new ArrayBuffer(16 * 4);
  // std140 layout:
  // m00 m10 m20 _ m01 m11 m21 _ m02 m12 m22 __ alpha __ __ __
  //  0   1   2  3  4   5   6  7  8   9  10  11   12  13 14 15
  public readonly overlayFloats = new Float32Array(this.overlayStore, 0, 16);

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
    const program = this.shaderService.getProgram('facet_mesh');

    this.transformsBuffer = this.setUpUniformBlock(program, 'Transforms', TRANSFORMS_UBO_BINDING_INDEX);
    gl.bufferData(gl.UNIFORM_BUFFER, this.transformsUniformStore.byteLength, gl.DYNAMIC_DRAW);

    this.lightConfigBuffer = this.setUpUniformBlock(program, 'LightConfig', LIGHT_CONFIG_UBO_BINDING_INDEX);
    gl.bufferData(gl.UNIFORM_BUFFER, this.lightConfig.buffer.byteLength, gl.STATIC_DRAW);

    this.setUpUniformBlock(program, 'MaterialConfig', MATERIAL_CONFIG_UBO_BINDING_INDEX);
    gl.bufferData(gl.UNIFORM_BUFFER, MATERIAL_CONFIG, gl.STATIC_DRAW);

    const overlayProgram = this.shaderService.getProgram('overlay');
    this.overlayBuffer = this.setUpUniformBlock(overlayProgram, 'Overlay', OVERLAY_UBO_BINDING_INDEX);
    gl.bufferData(gl.UNIFORM_BUFFER, this.overlayStore.byteLength, gl.STREAM_DRAW);
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
  public popModelMatrixStack() {
    if (this.modelTransformStackPointer <= 0) {
      throw new Error('Model transform stack underflow');
    }
    --this.modelTransformStackPointer;
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
    vec4.transformMat4(this.lightConfig, UniformService.UNIT_LIGHT_DIRECTION, viewMatrix);
    const gl = this.glService.gl;
    gl.bindBuffer(gl.UNIFORM_BUFFER, this.lightConfigBuffer);
    gl.bufferSubData(gl.UNIFORM_BUFFER, 0, this.lightConfig);
  }

  public updateOverlayUniform(projection: mat3, alpha: number = 1): void {
    UniformService.copyMat3ToStd140(this.overlayFloats, projection);
    this.overlayFloats[12] = alpha;

    const gl = this.glService.gl;
    gl.bindBuffer(gl.UNIFORM_BUFFER, this.overlayBuffer);
    gl.bufferSubData(gl.UNIFORM_BUFFER, 0, this.overlayStore);
  }

  private setUpUniformBlock(program: WebGLProgram, name: string, bindingIndex: number): WebGLBuffer {
    const gl = this.glService.gl;
    const blockIndex = gl.getUniformBlockIndex(program, name);
    const buffer = Utility.assertNotNull(gl.createBuffer());
    gl.uniformBlockBinding(program, blockIndex, bindingIndex);
    gl.bindBufferBase(gl.UNIFORM_BUFFER, bindingIndex, buffer);
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
