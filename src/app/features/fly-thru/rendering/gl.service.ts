import { Injectable } from '@angular/core';
import { ToastError } from '../../toast/toast/toast-error';

/** Container for shared WebGL context. */
@Injectable({ providedIn: 'root' })
export class GlService {
  private _gl: WebGL2RenderingContext | null | undefined;

  initialize (canvas: HTMLCanvasElement): void {
    this._gl = canvas.getContext("webgl2");
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
}
