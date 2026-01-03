/* Copyright (c) 2025-2026 Gene Ressler
   SPDX-License-Identifier: GPL-3.0-or-later */

import { Injectable } from '@angular/core';
import { Point2DInterface, Rectangle2D } from '../classes/graphics';

export const enum Justification {
  LEFT = -1,
  RIGHT = 1,
  TOP = -1,
  BOTTOM = 1,
  CENTER = 0,
}

/** Stateful viewport transform. Create instances as needed per component with InjectionToken. */
@Injectable({ providedIn: 'root' })
export class ViewportTransform2D {
  private _xWindow = 0;
  private _yWindow = 0;
  private _widthWindow = 1;
  private _heightWindow = 1;
  private _xViewport = 0;
  private _yViewport = 0;
  private _widthViewport = 1;
  private _heightViewport = 1;
  private _xMargin = 0;
  private _yMargin = 0;
  private _xScaleFactor = 1;
  private _yScaleFactor = 1;
  private _hAlign = Justification.CENTER;
  private _vAlign = Justification.CENTER;

  public get absWidthViewport(): number {
    return Math.abs(this._widthViewport);
  }

  public get absHeightViewport(): number {
    return Math.abs(this._heightViewport);
  }

  public get usedWidthViewport(): number {
    return Math.abs(this._widthViewport - this._xMargin);
  }

  public get usedHeightViewport(): number {
    return Math.abs(this._heightViewport - this._yMargin);
  }

  public setAlignment(horizontal: Justification, vertical: Justification): void {
    this._hAlign = horizontal;
    this._vAlign = vertical;
    this.setScaleFactor();
  }

  public setViewport(x: number, y: number, width: number, height: number): void {
    this._xViewport = x;
    this._yViewport = y;
    this._widthViewport = width;
    this._heightViewport = height;
    this.setScaleFactor();
  }

  public setWindow(window: Rectangle2D): void {
    this._xWindow = window.x0;
    this._yWindow = window.y0;
    this._widthWindow = window.width;
    this._heightWindow = window.height;
    this.setScaleFactor();
  }

  public worldToViewportX(x: number): number {
    return this._xMargin + this._xViewport + (x - this._xWindow) * this._xScaleFactor;
  }

  public worldToViewportY(y: number): number {
    return this._yMargin + this._yViewport + (y - this._yWindow) * this._yScaleFactor;
  }

  public worldToViewportPoint(dst: Point2DInterface, src: Point2DInterface): void {
    dst.x = this.worldToViewportX(src.x);
    dst.y = this.worldToViewportY(src.y);
  }

  public worldToViewportDistance(d: number): number {
    return ViewportTransform2D.copySign(Math.round(d * Math.abs(this._xScaleFactor)), d);
  }

  public viewportToworldX(x: number): number {
    return this._xWindow + (x - this._xMargin - this._xViewport) / this._xScaleFactor;
  }

  public viewportToworldY(y: number): number {
    return this._yWindow + (y - this._yMargin - this._yViewport) / this._yScaleFactor;
  }

  public viewportToWorldPoint(dst: Point2DInterface, src: Point2DInterface): void {
    dst.x = this.viewportToworldX(src.x);
    dst.y = this.viewportToworldY(src.y);
  }

  public viewportToWorldDistance(d: number): number {
    return ViewportTransform2D.copySign(d / this._xScaleFactor, d);
  }

  public viewportToWorldRectangle2D(dst: Rectangle2D, src: Rectangle2D): Rectangle2D {
    dst.x0 = this.viewportToworldX(src.x0);
    dst.y0 = this.viewportToworldY(src.y0);
    dst.width = this.viewportToworldX(src.x1) - dst.x0;
    dst.height = this.viewportToworldY(src.y1) - dst.y0;
    return dst;
  }

  private setScaleFactor(): void {
    if (this._widthWindow === 0 || this._heightWindow === 0) {
      this._xScaleFactor = this._yScaleFactor = 1;
      return;
    }
    const sfX = this._widthViewport / this._widthWindow;
    const sfY = this._heightViewport / this._heightWindow;
    this._xMargin = this._yMargin = 0;
    if (Math.abs(sfX) < Math.abs(sfY)) {
      this._xScaleFactor = sfX;
      this._yScaleFactor = ViewportTransform2D.copySign(sfX, sfY);
      const margin = this._heightViewport - this._heightWindow * this._yScaleFactor;
      switch (this._vAlign) {
        case Justification.TOP:
          this._yMargin = Math.round(margin);
          break;
        case Justification.CENTER:
          this._yMargin = Math.round(0.5 * margin);
          break;
      }
    } else {
      this._yScaleFactor = sfY;
      this._xScaleFactor = ViewportTransform2D.copySign(sfY, sfX);
      const margin = this._widthViewport - this._widthWindow * this._xScaleFactor;
      switch (this._hAlign) {
        case Justification.RIGHT:
          this._xMargin = Math.round(margin);
          break;
        case Justification.CENTER:
          this._xMargin = Math.round(0.5 * margin);
          break;
      }
    }
  }

  private static copySign(x: number, signSource: number): number {
    return (x < 0 && signSource < 0) || (x >= 0 && signSource >= 0) ? x : -x;
  }
}
