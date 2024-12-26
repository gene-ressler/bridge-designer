import { Injectable } from '@angular/core';
import { CartoonSiteRenderingService } from './cartoon-site-rendering.service';
import { Colors } from '../classes/graphics';

export const enum CartoonOptionMask {
  ABUTMENTS = 1,
  ARCH_LINE = 2,
  BRIDGE = 4,
  DECK = 8,
  JOINTS = 16,
  MEASUREMENTS = 32,
  SKETCH = 64,
  TERRAIN = 128,
  TITLE_BLOCK = 256,
  STANDARD_ITEMS = ABUTMENTS | ARCH_LINE | BRIDGE | DECK | TERRAIN,
  ALL = 511,
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
  }
}
