import { Injectable } from '@angular/core';
import { Rectangle2D } from '../../../shared/classes/graphics';
import { Utility } from '../../../shared/classes/utility';

@Injectable({ providedIn: 'root' })
export class SelectCursorService {
  private static readonly SMALL_SQR = Utility.sqr(3);
  private readonly cursor: Rectangle2D = Rectangle2D.createEmpty();
  private ctx?: CanvasRenderingContext2D;
  private isAnchored: boolean = false;

  public start(ctx: CanvasRenderingContext2D, x: number, y: number): void {
    this.cursor.x0 = x;
    this.cursor.y0 = y;
    this.cursor.width = this.cursor.height = 0;
    this.ctx = ctx;
    this.show();
    this.isAnchored = true;
  }

  public update(x: number, y: number): void {
    if (!this.isAnchored) {
      return;
    }
    this.erase();
    this.cursor.width = x - this.cursor.x0;
    this.cursor.height = y - this.cursor.y0;
    this.show();
  }

  public end(x: number, y: number, selected: Rectangle2D): Rectangle2D | undefined {
    if (!this.isAnchored) {
      return undefined;
    }
    this.erase();
    this.cursor.width = x - this.cursor.x0;
    this.cursor.height = y - this.cursor.y0;
    this.isAnchored = false;
    if (this.cursor.diagonalSqr < SelectCursorService.SMALL_SQR) {
      this.cursor.width = this.cursor.height = 0;
    }
    return this.cursor.copyTo(selected);
  }

  private show() {
    const ctx = this.ctx!;
    const savedStrokeStyle = ctx.strokeStyle;
    const savedLineDash = ctx.getLineDash();

    ctx.strokeStyle = 'blue';
    ctx.setLineDash(this.cursor.width >= 0 ? [] : [4, 4]);

    ctx.beginPath();
    ctx.rect(this.cursor.x0, this.cursor.y0, this.cursor.width, this.cursor.height);
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
