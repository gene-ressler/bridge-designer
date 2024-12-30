import { Injectable } from '@angular/core';
import { CartoonSiteRenderingService } from './cartoon-site-rendering.service';
import { Colors } from '../classes/graphics';

export const enum CartoonOptionMask {
  ABUTMENTS = 0x1,
  ARCH_LINE = 0x2,
  BRIDGE = 0x4,
  DECK = 0x8,
  JOINTS = 0x10,
  MEASUREMENTS = 0x20,
  SKETCH = 0x40,
  TERRAIN = 0x80,
  TITLE_BLOCK = 0x100,
  ALL = 0x200 - 1,
  STANDARD_ITEMS = ABUTMENTS | ARCH_LINE | BRIDGE | DECK | TERRAIN,
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
