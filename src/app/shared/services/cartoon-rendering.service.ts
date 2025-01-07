import { Injectable } from '@angular/core';
import { CartoonSiteRenderingService } from './cartoon-site-rendering.service';
import { Colors } from '../classes/graphics';

export const enum CartoonOptionMask {
  NONE = 0,
  ABUTMENTS = 0x1,
  ARCH_LINE = 0x2,
  DECK = 0x4,
  EXCAVATED_TERRAIN = 0x8,
  IN_SITU_TERRAIN = 0x10,
  JOINTS = 0x20,
  MEASUREMENTS = 0x40,
  SKETCH = 0x80,
  TITLE_BLOCK = 0x100,
  ALL = 0x200 - 1,
  STANDARD_OPTIONS = ABUTMENTS | ARCH_LINE | DECK | EXCAVATED_TERRAIN | IN_SITU_TERRAIN,
  SITE_ONLY = IN_SITU_TERRAIN | MEASUREMENTS,
}

@Injectable({ providedIn: 'root' })
export class CartoonRenderingService {
  public options: number = CartoonOptionMask.ALL;

  constructor(private cartoonSiteRenderingService: CartoonSiteRenderingService) {}

  public render(ctx: CanvasRenderingContext2D) {
    const savedFillStyle = ctx.fillStyle;
    ctx.fillStyle = Colors.SKY;
    ctx.fillRect(0, 0, ctx.canvas.width, ctx.canvas.height);
    ctx.fillStyle = savedFillStyle;

    this.cartoonSiteRenderingService.render(ctx, this.options);

    if (this.options & CartoonOptionMask.TITLE_BLOCK) {
      this.renderTitleBlock(ctx);
    }
  }

  private renderTitleBlock(ctx: CanvasRenderingContext2D) {
    const savedTextAlign = ctx.textAlign;
    const savedTextBaseline = ctx.textBaseline;
    const savedStrokeStyle = ctx.strokeStyle;
    const savedFillStyle = ctx.fillStyle;
    const savedFont = ctx.font;

    const text = 'Title box';
    ctx.textAlign = 'right';
    ctx.textBaseline = 'bottom';
    ctx.font = 'italic 14px sans-serif';
    const textMetrics = ctx.measureText(text);
    const margin = 8;
    const height = margin + textMetrics.actualBoundingBoxAscent + margin;
    const width = margin + textMetrics.actualBoundingBoxLeft + margin;
    const x1 = ctx.canvas.width;
    const y1 = ctx.canvas.height;
    const x0 = x1 - width;
    const y0 = y1 - height;
    ctx.fillStyle = 'white';
    ctx.fillRect(x0, y0, width, height);
    const gap = 3;
    ctx.strokeStyle = 'gray';
    ctx.strokeRect(x0 + gap, y0 + gap, width - gap - gap, height - gap - gap)
    ctx.strokeRect(x0, y0, width, height);
    ctx.fillStyle = 'black';
    ctx.fillText(text, x1 - margin, y1 - margin);

    ctx.font = savedFont;
    ctx.fillStyle = savedFillStyle;
    ctx.strokeStyle = savedStrokeStyle;
    ctx.textBaseline = savedTextBaseline;
    ctx.textAlign = savedTextAlign;
  }
}
