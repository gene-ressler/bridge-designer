import { Injectable } from '@angular/core';
import { ShaderService } from '../shaders/shader.service';
import { ImagesLoader } from '../../../shared/core/image.service';
import { Utility } from '../../../shared/classes/utility';
import { IN_TEX_COORD_LOCATION } from '../shaders/constants';
import { mat3 } from 'gl-matrix';
import { GlService } from './gl.service';
import { ViewportService } from './viewport.service';
import { UniformService } from './uniform.service';

export type Overlay = {
  tex: WebGLTexture;
  alpha: number;
  x0: number;
  y0: number;
  width: number;
  height: number;
  locationTransform?: mat3;
  /** Handles a pointer down event, optionally using provided click location. */
  handlePointerDown?: () => void;
  /** Handles a pointer drag event, optionally using provided drag information. */
  handlePointerDrag?: (dx?: number, dy?: number) => void;
};

export type OverlaysByUrl = { [url: string]: Overlay };

export type OverlayContext = {
  vertexArray: WebGLVertexArrayObject;
  program: WebGLProgram;
  textureUniformLocation: WebGLUniformLocation;
  overlaysByUrl: OverlaysByUrl;
};

/** Clickable overlay icons as a service. */
@Injectable({ providedIn: 'root' })
export class OverlayRenderingService {
  private static readonly ICON_TEX_COORDS = new Float32Array([0, 0, 1, 0, 0, 1, 1, 1, 0, 1, 1, 0]);
  private readonly iconTransform: mat3 = mat3.create();

  constructor(
    private readonly glService: GlService,
    private readonly shaderService: ShaderService,
    private readonly uniformService: UniformService,
    private readonly viewportService: ViewportService,
  ) {}

  /**
   * Returns a context containing set of prepared overlays for the icons in the given images loader.
   * By default these will be drawn with unit alpha, native size and upper left corner at the origin
   * in mouse coordinate space. Change this with an optional setter that edits alpha x, y, width,
   * height of respective overlay object.
   */
  public prepareIconOverlay(
    imagesLoader: ImagesLoader,
    setter: (overlaysByUrl: OverlaysByUrl) => void = _overlays => {},
  ): OverlayContext {
    const gl = this.glService.gl;

    const vertexArray = Utility.assertNotNull(gl.createVertexArray());
    gl.bindVertexArray(vertexArray);

    const texCoordBuffer = Utility.assertNotNull(gl.createBuffer());
    gl.bindBuffer(gl.ARRAY_BUFFER, texCoordBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, OverlayRenderingService.ICON_TEX_COORDS, gl.STATIC_DRAW);
    gl.enableVertexAttribArray(IN_TEX_COORD_LOCATION);
    gl.vertexAttribPointer(IN_TEX_COORD_LOCATION, 2, gl.FLOAT, false, 0, 0);

    const overlaysByUrl: OverlaysByUrl = {};

    imagesLoader.invokeAfterLoaded(images => {
      for (const [url, image] of Object.entries(images)) {
        const tex = Utility.assertNotNull(gl.createTexture());
        gl.bindTexture(gl.TEXTURE_2D, tex);
        gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, image);
        // TODO: Check if needed. Probably not.
        gl.generateMipmap(gl.TEXTURE_2D);
        overlaysByUrl[url] = {
          tex,
          alpha: 1,
          x0: 0,
          y0: 0,
          width: image.width,
          height: image.height,
        };
      }
      setter(overlaysByUrl);
    });
    gl.bindTexture(gl.TEXTURE_2D, null);
    gl.bindVertexArray(null);
    const program = this.shaderService.getProgram('overlay');
    const textureUniformLocation = gl.getUniformLocation(program, 'icon')!;
    return { vertexArray, textureUniformLocation, program, overlaysByUrl };
  }

  /** Draws the given set of overlays. */
  public drawIconOverlays(overlayContext: OverlayContext) {
    const gl = this.glService.gl;
    gl.disable(gl.DEPTH_TEST);
    gl.enable(gl.BLEND);
    gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);

    gl.useProgram(this.shaderService.getProgram('overlay'));
    gl.bindVertexArray(overlayContext.vertexArray);
    // TODO: Probably move texture unit management to UniformService after we understand it.
    const textureUnit = 0;
    gl.uniform1i(overlayContext.textureUniformLocation, textureUnit);
    gl.activeTexture(gl.TEXTURE0 + textureUnit);
    gl.bindVertexArray(overlayContext.vertexArray);
    for (const overlay of Object.values(overlayContext.overlaysByUrl)) {
      if (!overlay.tex) {
        continue;
      }
      gl.bindTexture(gl.TEXTURE_2D, overlay.tex);
      if (!overlay.locationTransform) {
        const m = mat3.create();
        // Scale then translate.
        m[0] = overlay.width;
        m[4] = overlay.height;
        m[6] = overlay.x0;
        m[7] = overlay.y0;
        overlay.locationTransform = m;
      }
      mat3.multiply(this.iconTransform, this.viewportService.mouseProjection, overlay.locationTransform);
      this.uniformService.updateOverlayUniform(this.iconTransform, overlay.alpha);
      gl.drawArrays(gl.TRIANGLES, 0, OverlayRenderingService.ICON_TEX_COORDS.length / 2);
    }

    gl.disable(gl.BLEND);
    gl.enable(gl.DEPTH_TEST);
  }
}
