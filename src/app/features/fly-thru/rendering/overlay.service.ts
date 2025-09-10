import { Injectable } from '@angular/core';
import { ShaderService } from '../shaders/shader.service';
import { GlService } from './gl.service';
import { ViewportService } from './viewport.service';
import { IN_ALPHA_LOCATION, IN_POSITION_LOCATION, IN_TEX_COORD_LOCATION } from '../shaders/constants';
import { ImageService } from '../../../shared/core/image.service';
import { mat3 } from 'gl-matrix';
import { OVERLAY_TEXTURE_UNIT } from './constants';

export type OverlayIcon = {
  /** Upper left corner x-coord of icon in mouse coords. Negative values are wrt right viewport edge. */
  x0: number;
  /** Upper left corner y-coord of icon in mouse coords. Negative values are wrt bottom viewport edge. */
  y0: number;
  /** Rendered width of icon regardless of image widith. */
  width: number;
  /** Rendered height of icon regardless of image widith. */
  height: number;
  /** Initial alpha value for rendering the icon. */
  initialAlpha?: number;
};

export type OverlayDescriptor = {
  imageArrayUrl: string;
  icons: OverlayIcon[];
};

/**
 * Rendering info for an overlay. The input image is a vertically stacked collection of
 * same-size icons for a texture array. A single quad is drawn with one instance per icon.
 * Callers may change icons (perhaps implicitly via viewport a change) and alphas. Setting
 * the corresponding dirty bit true causes them to be re-rendered in the next frame.
 */
export type Overlay = {
  vertexArray: WebGLVertexArrayObject;
  texture?: WebGLTexture;
  textureUniformLocation: WebGLUniformLocation;
  positionBuffer: WebGLBuffer;
  alphaBuffer: WebGLBuffer;
  positions: Float32Array;
  arePositionsDirty: boolean;
  alphas: Float32Array;
  areAlphasDirty: boolean;
  icons: OverlayIcon[];
};

/** Web GL canvas overlay icons with button-like behavior. */
@Injectable({ providedIn: 'root' })
export class OverlayService {
  /** Two triangles for a quad double as texture coordinates. */
  // prettier-ignore
  private static readonly TEX_COORDS = new Float32Array([
    0, 0, 
    1, 0, 
    0, 1, 
    1, 1, 
    0, 1, 
    1, 0,
  ]);
  private readonly tmpMat3 = mat3.create();

  constructor(
    private readonly glService: GlService,
    private readonly imageService: ImageService,
    private readonly shaderService: ShaderService,
    private readonly viewportService: ViewportService,
  ) {}

  /** Prepares (one time) an overlay for rendering using given discriptor. */
  public prepare(descriptor: OverlayDescriptor): Overlay {
    const gl = this.glService.gl;

    const iconCount = descriptor.icons.length;
    const positions = this.buildPositions(undefined, descriptor.icons);
    const alphas = new Float32Array(iconCount).fill(1);
    descriptor.icons.forEach((icon, i) => {
      if (icon.initialAlpha !== undefined) {
        alphas[i] = icon.initialAlpha;
      }
    });

    const vertexArray = gl.createVertexArray()!;
    gl.bindVertexArray(vertexArray);

    // Fixed attribute
    const texCoordBuffer = gl.createBuffer()!;
    gl.bindBuffer(gl.ARRAY_BUFFER, texCoordBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, OverlayService.TEX_COORDS, gl.STATIC_DRAW);
    gl.enableVertexAttribArray(IN_TEX_COORD_LOCATION);
    gl.vertexAttribPointer(IN_TEX_COORD_LOCATION, 2, gl.FLOAT, false, 0, 0);

    // Instanced attributes.
    const positionBuffer = gl.createBuffer()!;
    gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, positions, gl.DYNAMIC_DRAW);
    gl.enableVertexAttribArray(IN_POSITION_LOCATION);
    gl.vertexAttribPointer(IN_POSITION_LOCATION, 4, gl.FLOAT, false, 0, 0);
    gl.vertexAttribDivisor(IN_POSITION_LOCATION, 1);

    const alphaBuffer = gl.createBuffer()!;
    gl.bindBuffer(gl.ARRAY_BUFFER, alphaBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, alphas, gl.DYNAMIC_DRAW);
    gl.enableVertexAttribArray(IN_ALPHA_LOCATION);
    gl.vertexAttribPointer(IN_ALPHA_LOCATION, 1, gl.FLOAT, false, 0, 0);
    gl.vertexAttribDivisor(IN_ALPHA_LOCATION, 1);

    const program = this.shaderService.getProgram('overlay');
    const textureUniformLocation = gl.getUniformLocation(program, 'icons')!;

    const overlay: Overlay = {
      vertexArray,
      positionBuffer,
      alphaBuffer,
      textureUniformLocation,
      positions,
      arePositionsDirty: true,
      alphas,
      areAlphasDirty: true,
      icons: descriptor.icons,
    };

    this.imageService.createImagesLoader([descriptor.imageArrayUrl]).invokeAfterLoaded(imagesByUrl => {
      const image = imagesByUrl[descriptor.imageArrayUrl];
      const texture = gl.createTexture()!;
      gl.bindTexture(gl.TEXTURE_2D_ARRAY, texture);
      gl.texImage3D(
        gl.TEXTURE_2D_ARRAY,
        0,
        gl.RGBA,
        image.width,
        image.height / iconCount,
        iconCount,
        0,
        gl.RGBA,
        gl.UNSIGNED_BYTE,
        image,
      );
      gl.generateMipmap(gl.TEXTURE_2D_ARRAY);
      overlay.texture = texture;
    });
    return overlay;
  }

  /** Attaches a UI to the overlay to make it clickable. Given alpha value determines normal (not rollover) visibility. */
  public attachUi(overlay: Overlay, dimAlpha: number): OverlayUi {
    return new OverlayUi(overlay, dimAlpha, this.viewportService);
  }

  public render(overlay: Overlay): void {
    // Do nothing if async image load is still pending.
    if (!overlay.texture) {
      return;
    }

    const gl = this.glService.gl;
    gl.disable(gl.DEPTH_TEST);
    gl.disable(gl.CULL_FACE);
    gl.enable(gl.BLEND);
    gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);

    gl.useProgram(this.shaderService.getProgram('overlay'));
    gl.bindVertexArray(overlay.vertexArray);

    // TODO: Experiment with doing this once, not once per frame. Possible because we have fewer textures than units?
    gl.uniform1i(overlay.textureUniformLocation, OVERLAY_TEXTURE_UNIT);
    gl.activeTexture(gl.TEXTURE0 + OVERLAY_TEXTURE_UNIT);
    gl.bindTexture(gl.TEXTURE_2D_ARRAY, overlay.texture);

    if (overlay.arePositionsDirty) {
      this.buildPositions(overlay.positions, overlay.icons);
      gl.bindBuffer(gl.ARRAY_BUFFER, overlay.positionBuffer);
      gl.bufferData(gl.ARRAY_BUFFER, overlay.positions, gl.DYNAMIC_DRAW);
      overlay.arePositionsDirty = false;
    }

    if (overlay.areAlphasDirty) {
      gl.bindBuffer(gl.ARRAY_BUFFER, overlay.alphaBuffer);
      gl.bufferData(gl.ARRAY_BUFFER, overlay.alphas, gl.DYNAMIC_DRAW);
      overlay.areAlphasDirty = false;
    }

    gl.drawArraysInstanced(gl.TRIANGLES, 0, OverlayService.TEX_COORDS.length >>> 1, overlay.icons.length);

    gl.bindTexture(gl.TEXTURE_2D_ARRAY, null);
    gl.bindVertexArray(null);
    gl.disable(gl.BLEND);
    gl.enable(gl.DEPTH_TEST);
    gl.enable(gl.CULL_FACE);
  }

  /** Builds or rebuilds position data from icon information in the overlay. */
  private buildPositions(positionsOut: Float32Array | undefined, icons: OverlayIcon[]): Float32Array {
    positionsOut ||= new Float32Array(icons.length * 4);
    const m = this.tmpMat3;
    let offset = 0;
    for (const icon of icons) {
      m[0] = icon.width;
      m[4] = icon.height;
      m[6] = getRelativeIconX0(icon, this.viewportService);
      m[7] = getRelativeIconY0(icon, this.viewportService);
      mat3.multiply(m, this.viewportService.mouseProjection, m);
      positionsOut[offset] = m[6]; // x
      positionsOut[offset + 1] = m[7]; // y
      positionsOut[offset + 2] = m[0]; // xScale
      positionsOut[offset + 3] = m[4]; // yScale
      offset += 4;
    }
    return positionsOut;
  }
}

/** A handler set of an OverlayUi object. There's one of these per icon in the overlay. */
export interface IconHandlerSet {
  handlePointerDown?(): void;
  handlePointerDrag?(dx: number, dy: number): void;
  handlePointerUp?(): void;
}

/**
 * Optional user interface attachable to an overlay to make it clickable. The Web GL canvas 
 * provides the pointer events. Don't create your own. Use the service endpoint.
 */
export class OverlayUi {
  private activeIconIndex: number = -1;
  private isPointerDown: boolean = false;
  private mouseDownX: number = 0;
  private mouseDownY: number = 0;
  private lastFindX: number = 0;
  private lastFindY: number = 0;

  /** Place for users to connect handlers. Indices match icon array. */
  public readonly iconHandlerSets: IconHandlerSet[];

  constructor(
    private readonly overlay: Overlay,
    private readonly dimAlpha: number,
    private readonly viewportService: ViewportService,
  ) {
    this.iconHandlerSets = this.overlay.icons.map(_icon => ({}) as IconHandlerSet);
  }

  /** Update icon alphas given as index/value pairs in sequence. */
  public updateAlphas(...indexAlphas: number[]) {
    for (let i = 0; i < indexAlphas.length; i += 2) {
      this.overlay.alphas[indexAlphas[i]] = indexAlphas[i + 1];
    }
    this.overlay.areAlphasDirty = true;
    // Refresh the active icon to account for alpha changes.
    this.activeIconIndex = this.findIconIndex(this.lastFindX, this.lastFindY);
  }

  /** Accepts a pointer down event from the canvas displaying the overlay. */
  public acceptPointerDown(x: number, y: number): void {
    const clickIconIndex = this.activeIconIndex;
    if (clickIconIndex !== -1) {
      this.activeIconIndex = clickIconIndex;
      this.isPointerDown = true;
      this.mouseDownX = x;
      this.mouseDownY = y;
      this.iconHandlerSets[clickIconIndex].handlePointerDown?.();
    }
  }

  /** Accepts a pointer move event from the canvas displaying the overlay. */
  public acceptPointerMove(x: number, y: number): void {
    if (this.isPointerDown) {
      this.iconHandlerSets[this.activeIconIndex].handlePointerDrag?.(x - this.mouseDownX, this.mouseDownY - y);
      return;
    }
    const foundIconIndex = this.findIconIndex(x, y);
    // Turn down any previously active overlay, then turn up any new one.
    if (this.activeIconIndex !== undefined) {
      this.overlay.alphas[this.activeIconIndex] = this.dimAlpha;
      this.overlay.areAlphasDirty = true;
    }
    if (foundIconIndex !== undefined) {
      this.overlay.alphas[foundIconIndex] = 1;
      this.overlay.areAlphasDirty = true;
    }
    this.activeIconIndex = foundIconIndex;
  }

  /** Accepts a pointer up event from the canvas displaying the overlay. */
  public acceptPointerUp(x: number, y: number): void {
    if (this.isPointerDown) {
      this.iconHandlerSets[this.activeIconIndex].handlePointerDrag?.(0, 0);
      this.isPointerDown = false;
      // Move with pointer up to make alpha consistent.
      this.acceptPointerMove(x, y);
    }
  }

  /** Returns the index of a visible icon containing a mouse coordinate or -1 if none.  */
  private findIconIndex(x: number, y: number): number {
    this.lastFindX = x;
    this.lastFindY = y;
    const icons = this.overlay.icons;
    for (let i = 0; i < icons.length; ++i) {
      const icon = icons[i];
      if (this.overlay.alphas[i] <= 0) continue;
      const x0 = getRelativeIconX0(icon, this.viewportService);
      if (x < x0) continue;
      const y0 = getRelativeIconY0(icon, this.viewportService);
      if (y < y0 || x > x0 + icon.width || y > y0 + icon.height) continue;
      return i;
    }
    return -1;
  }
}

/** Converts possibly right-relative x0 to actual. */
function getRelativeIconX0(icon: OverlayIcon, viewportService: ViewportService): number {
  return icon.x0 < 0 ? viewportService.width + icon.x0 - icon.width : icon.x0;
}

/** Converts possibly bottom-relative y0 to actual. */
function getRelativeIconY0(icon: OverlayIcon, viewportService: ViewportService) {
  return icon.y0 < 0 ? viewportService.height + icon.y0 - icon.height : icon.y0;
}
