import { Injectable } from '@angular/core';
import { GlService } from './gl.service';

@Injectable({ providedIn: 'root' })
export class DepthBufferService {
  constructor(private readonly glService: GlService) {}

  public prepare(): void {
    const gl = this.glService.gl;
    const depthTexture = gl.createTexture();
    const size = 2048;
    gl.bindTexture(gl.TEXTURE_2D, depthTexture);
    gl.texImage2D(
      gl.TEXTURE_2D, // target
      0, // mip level
      gl.DEPTH_COMPONENT32F, // internal format
      size, // width
      size, // height
      0, // border
      gl.DEPTH_COMPONENT, // format
      gl.FLOAT, // type
      null, // data
    );
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
    const depthFramebuffer = gl.createFramebuffer();
    gl.bindFramebuffer(gl.FRAMEBUFFER, depthFramebuffer);
    gl.framebufferTexture2D(
      gl.FRAMEBUFFER, // target
      gl.DEPTH_ATTACHMENT, // attachment point
      gl.TEXTURE_2D, // texture target
      depthTexture, // texture
      0, // mip level
    );
    gl.bindFramebuffer(gl.FRAMEBUFFER, null);
  }
}
