/* Copyright (c) 2025-2026 Gene Ressler
   SPDX-License-Identifier: GPL-3.0-or-later */

import { Injectable } from '@angular/core';
import { ToastError } from '../../toast/toast/toast-error';

/** Container for shared WebGL context. Includes current rendering target buffer info. */
@Injectable({ providedIn: 'root' })
export class GlService {
  private _gl: WebGL2RenderingContext | null | undefined;
  private _isDepthBuffer: boolean = false;
  initialize(canvas: HTMLCanvasElement): void {
    const gl = canvas.getContext('webgl2');
    this._gl = gl;
  }

  public get setForDisplayBuffer(): WebGL2RenderingContext {
    this._isDepthBuffer = false;
    return this.gl;
  }

  public get setForDepthBuffer(): WebGL2RenderingContext {
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
}
