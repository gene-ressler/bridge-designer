import { Injectable } from '@angular/core';
import { ToastError } from '../../toast/toast/toast-error';

/** Container for shared WebGL context. Includes current rendering target buffer info. */
@Injectable({ providedIn: 'root' })
export class GlService {
  private _gl: WebGL2RenderingContext | null | undefined;
  private _isDepthBuffer: boolean = false;
  private intTypes: Set<number> | undefined;

  initialize(canvas: HTMLCanvasElement): void {
    const gl = canvas.getContext('webgl2');
    this._gl = gl;
    if (gl) {
      this.intTypes = new Set<number>([
        gl.BYTE,
        gl.UNSIGNED_BYTE,
        gl.SHORT,
        gl.UNSIGNED_SHORT,
        gl.INT,
        gl.UNSIGNED_INT,
      ]);
    }
  }

  public get forDisplayBuffer(): WebGL2RenderingContext {
    this._isDepthBuffer = false;
    return this.gl;
  }

  public get forDepthBuffer(): WebGL2RenderingContext {
    this._isDepthBuffer = true;
    return this.gl;
  }

  public get isRenderingDepth(): boolean {
    return this._isDepthBuffer;
  }

  public get isRenderingDisplay(): boolean {
    return !this._isDepthBuffer;
  }

  public get isWebGL2Supported(): boolean | undefined {
    if (this._gl === undefined) {
      return undefined;
    }
    return this._gl !== null;
  }

  public get gl(): WebGL2RenderingContext {
    if (!this._gl) {
      throw new ToastError('needWebGl2Error');
    }
    return this._gl;
  }

  /**
   * Returns true if the service is initialized, GL2 support exists,
   * and the given type is an integer type.
   */
  public isIntType(glType: number): boolean {
    return this.intTypes !== undefined && this.intTypes.has(glType);
  }
}
