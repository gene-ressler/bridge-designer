import { Injectable } from '@angular/core';
import { GlService } from './gl.service';
import { DEPTH_TEXTURE_UNIT } from './constants';
import { ShaderService } from '../shaders/shader.service';
import { IN_POSITION_LOCATION } from '../shaders/constants';

const DEPTH_BUFFER_SIZE = 2048;
const TEX_COORDS = new Float32Array([0, 0, 1, 0, 0, 1, 1, 1, 0, 1, 1, 0]);

@Injectable({ providedIn: 'root' })
export class DepthBufferService {
  private depthFrameBuffer!: WebGLFramebuffer;
  private depthTexture!: WebGLTexture;
  private vertexArray!: WebGLVertexArrayObject;

  constructor(
    private readonly glService: GlService,
    private readonly shaderService: ShaderService,
  ) {}

  public prepare(): void {
    const gl = this.glService.gl;
    this.depthTexture = gl.createTexture();

    gl.bindTexture(gl.TEXTURE_2D, this.depthTexture);
    gl.texImage2D(
      gl.TEXTURE_2D, // target
      0, // mip level
      gl.DEPTH_COMPONENT24, // internal format
      DEPTH_BUFFER_SIZE, // width
      DEPTH_BUFFER_SIZE, // height
      0, // border
      gl.DEPTH_COMPONENT, // format
      gl.UNSIGNED_INT, // type
      null, // data
    );
    // Percentage closer filtering setup.
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_COMPARE_MODE, gl.COMPARE_REF_TO_TEXTURE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_COMPARE_FUNC, gl.LEQUAL);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
    // WebGL doesn't support CLAMP_TO_BORDER. Use bounds checking in shader.
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
    this.depthFrameBuffer = gl.createFramebuffer();
    gl.bindFramebuffer(gl.FRAMEBUFFER, this.depthFrameBuffer);
    gl.framebufferTexture2D(
      gl.FRAMEBUFFER, // target
      gl.DEPTH_ATTACHMENT, // attachment point
      gl.TEXTURE_2D, // texture target
      this.depthTexture, // texture
      0, // mip level
    );
    gl.bindFramebuffer(gl.FRAMEBUFFER, null);
  }

  /**
   * Binds the depth buffer and sets the GL viewport to its extent. Not save/restoring
   * viewport here because Int32Array may be allocated for each frame, which is expensive.
   */
  public bindAndSetViewport(): void {
    const gl = this.glService.gl;
    gl.bindFramebuffer(gl.FRAMEBUFFER, this.depthFrameBuffer);
    gl.viewport(0, 0, DEPTH_BUFFER_SIZE, DEPTH_BUFFER_SIZE);
  }

  /**
   * Unbinds the depth buffer (reverting to display).
   * Caller is responsible for restoring viewport.
   */
  public unbind(): void {
    const gl = this.glService.gl;
    gl.bindFramebuffer(gl.FRAMEBUFFER, null);
  }

  /** Binds the depth texture in given shader program if we're not rendering for depth only. */
  public bindDepthTexture(program: WebGLProgram): void {
    if (this.glService.isRenderingDepth) {
      return;
    }
    const gl = this.glService.gl;
    const location = gl.getUniformLocation(program, 'depthMap')!;
    gl.uniform1i(location, DEPTH_TEXTURE_UNIT);
    gl.activeTexture(gl.TEXTURE0 + DEPTH_TEXTURE_UNIT);
    gl.bindTexture(gl.TEXTURE_2D, this.depthTexture);
  }

  /** Prepares a texture coordinate buffer for drawing the depth texture to the screen. */
  public pepareRenderToDisplay(): void {
    const gl = this.glService.gl;
    const vertexArray = gl.createVertexArray();
    gl.bindVertexArray(vertexArray);
    const texCoordBuffer = gl.createBuffer()!;
    gl.bindBuffer(gl.ARRAY_BUFFER, texCoordBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, TEX_COORDS, gl.STATIC_DRAW);
    gl.enableVertexAttribArray(IN_POSITION_LOCATION);
    gl.vertexAttribPointer(IN_POSITION_LOCATION, 2, gl.FLOAT, false, 0, 0);
    this.vertexArray = vertexArray;
  }

  public renderToDisplay(): void {
    const gl = this.glService.gl;
    gl.disable(gl.DEPTH_TEST);
    gl.disable(gl.CULL_FACE);

    const program = this.shaderService.getProgram('depth_texture');
    gl.useProgram(program);
    this.bindDepthTexture(program);
    gl.bindVertexArray(this.vertexArray);

    gl.drawArrays(gl.TRIANGLES, 0, TEX_COORDS.length >>> 1);

    gl.enable(gl.DEPTH_TEST);
    gl.enable(gl.CULL_FACE);
  }
}
