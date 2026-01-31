/* Copyright (c) 2025-2026 Gene Ressler
   SPDX-License-Identifier: GPL-3.0-or-later */

import { Injectable } from '@angular/core';
import { Rectangle2D } from '../../../shared/classes/graphics';
import { Utility } from '../../../shared/classes/utility';

@Injectable({ providedIn: 'root' })
export class SelectCursorService {
  private static readonly SMALL_SQR = Utility.sqr(3);
  private readonly cursor: Rectangle2D = Rectangle2D.createEmpty();
  private ctx?: CanvasRenderingContext2D;
  private _isAnchored: boolean = false;

  public start(ctx: CanvasRenderingContext2D, x: number, y: number): void {
    ctx.canvas.focus();
    this.cursor.x0 = x;
    this.cursor.y0 = y;
    this.cursor.width = this.cursor.height = 0;
    this.ctx = ctx;
    this.show();
    this._isAnchored = true;
  }

  public update(x: number, y: number): void {
    if (!this._isAnchored) {
      return;
    }
    this.erase();
    this.cursor.width = x - this.cursor.x0;
    this.cursor.height = y - this.cursor.y0;
    this.show();
  }

  public end(x: number, y: number, selected: Rectangle2D): Rectangle2D | undefined {
    if (!this._isAnchored) {
      return undefined;
    }
    this.erase();
    this._isAnchored = false;
    this.cursor.width = x - this.cursor.x0;
    this.cursor.height = y - this.cursor.y0;
    if (this.cursor.diagonalSqr < SelectCursorService.SMALL_SQR) {
      this.cursor.width = this.cursor.height = 0;
    }
    return this.cursor.copyTo(selected);
  }

  public abort(): void {
    if (!this._isAnchored) {
      return undefined;
    }
    this.erase();
    this._isAnchored = false;
  }

  public get isAnchored(): boolean {
    return this._isAnchored;
  }

  public get diagonalSqr(): number {
    return this.cursor.diagonalSqr;
  }

  private show() {
    const ctx = this.ctx!;
    const savedStrokeStyle = ctx.strokeStyle;
    const savedLineDash = ctx.getLineDash();
    
    const cursor = this.cursor;
    ctx.strokeStyle = 'blue';
    ctx.setLineDash(cursor.width >= 0 ? [] : [4, 4]);

    ctx.beginPath();
    ctx.rect(cursor.x0, cursor.y0, cursor.width, cursor.height);
    ctx.stroke();

    ctx.setLineDash(savedLineDash);
    ctx.strokeStyle = savedStrokeStyle;
  }

  private readonly cleared = Rectangle2D.createEmpty();

  private erase() {
    this.cursor.copyTo(this.cleared).pad(1, 1);
    this.ctx?.clearRect(this.cleared.x0, this.cleared.y0, this.cleared.width, this.cleared.height);
  }
}
