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
import { mat3, mat4 } from 'gl-matrix';
import { GlService } from './gl.service';

/** std124 padding. */
const _ = 0;

type Transforms = {
  modelMatrix: mat4;
  modelViewMatrix: Float32Array;
  modelViewProjectionMatrix: Float32Array;
  store: ArrayBuffer;
};

/** Builds a stack of buffers shaped to fit the transforms uniform. */
function buildTransformStack(size: number): Transforms[] {
  const transforms = [];
  for (let i = 0; i < size; ++i) {
    const modelMatrix = mat4.create();
    const store = new ArrayBuffer(128); // 2 each 4x4 floats
    const modelViewMatrix = new Float32Array(store, 0, 16);
    const modelViewProjectionMatrix = new Float32Array(store, 64, 16);
    transforms.push({ modelMatrix, modelViewMatrix, modelViewProjectionMatrix, store });
  }
  return transforms;
}

@Injectable({ providedIn: 'root' })
export class UniformService {
  // prettier-ignore
  private static readonly LIGHT_CONFIG = new Float32Array([
    0.0572181596, 0.68661791522, 0.72476335496, // unit light direction
    _,
    0.8, 0.8, 1.0, // light color
    0.08, // ambient intensity
  ]);
  private transformsBuffer!: WebGLBuffer;
  private overlayBuffer!: WebGLBuffer;
  private transformsStack: Transforms[] = buildTransformStack(4);
  private transformStackPointer: number = 0;
  public readonly overlayStore = new ArrayBuffer(16 * 4);
  // Format:
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
    gl.bufferData(gl.UNIFORM_BUFFER, this.transformsStack[0].store.byteLength, gl.DYNAMIC_DRAW);

    this.setUpUniformBlock(program, 'LightConfig', LIGHT_CONFIG_UBO_BINDING_INDEX);
    gl.bufferData(gl.UNIFORM_BUFFER, UniformService.LIGHT_CONFIG as Float32Array, gl.STATIC_DRAW);

    this.setUpUniformBlock(program, 'MaterialConfig', MATERIAL_CONFIG_UBO_BINDING_INDEX);
    gl.bufferData(gl.UNIFORM_BUFFER, MATERIAL_CONFIG, gl.STATIC_DRAW);

    const overlayProgram = this.shaderService.getProgram('overlay');
    this.overlayBuffer = this.setUpUniformBlock(overlayProgram, 'Overlay', OVERLAY_UBO_BINDING_INDEX);
    gl.bufferData(gl.UNIFORM_BUFFER, this.overlayStore.byteLength, gl.STREAM_DRAW);
  }

  /** Clears the stack and sets initial transform to given ones. Model transform is identity. */
  public initializeTransformStack(viewMatrix: mat4, projectionMatrix: mat4) {
    this.transformStackPointer = 0;
    const stackBase = this.transformsStack[0];
    mat4.copy(stackBase.modelViewMatrix, viewMatrix);
    mat4.multiply(stackBase.modelViewProjectionMatrix, projectionMatrix, viewMatrix);
    this.updateTransformsUniform(stackBase);
  }

  /** Append a new modeling transformation onto the stack. */
  public pushModelTransform(transform: (dst: mat4, src: mat4) => void) {
    const sp = ++this.transformStackPointer;
    if (sp >= this.transformsStack.length) {
      throw new Error('Transform stack overflow');
    }
    const stack = this.transformsStack;
    const newModelMatrix = stack[sp].modelMatrix;
    transform(newModelMatrix, stack[sp - 1].modelMatrix);
    // The stack base matrices are V and PV, so post-multiply by M to get VM and PVM.
    mat4.multiply(stack[sp].modelViewMatrix, stack[0].modelViewMatrix, newModelMatrix);
    mat4.multiply(stack[sp].modelViewProjectionMatrix, stack[0].modelViewProjectionMatrix, newModelMatrix);
    this.updateTransformsUniform(stack[sp]);
  }

  /** Remove most recent appended modeling transform from the stack. */
  public popPopTransform() {
    const sp = --this.transformStackPointer;
    if (sp < 0) {
      throw new Error('Transform stack underflow');
    }
    const stack = this.transformsStack;
    this.updateTransformsUniform(stack[sp]);
  }

  public updateTransformsUniform(transforms: Transforms): void {
    const gl = this.glService.gl;
    gl.bindBuffer(gl.UNIFORM_BUFFER, this.transformsBuffer);
    gl.bufferSubData(gl.UNIFORM_BUFFER, 0, transforms.store);
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
