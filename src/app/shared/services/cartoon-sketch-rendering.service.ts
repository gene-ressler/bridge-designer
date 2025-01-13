import { Injectable } from '@angular/core';
import { BridgeService } from './bridge.service';
import { ViewportTransform2D } from './viewport-transform.service';
import { CartoonJointRenderingService } from './cartoon-joint-rendering.service';
import { BridgeSketchModel } from '../classes/bridge-sketch.model';

@Injectable({ providedIn: 'root' })
export class CartoonSketchRenderingService {
  constructor(
    private readonly bridgeService: BridgeService,
    private readonly cartoonJointRenderingService: CartoonJointRenderingService,
    private readonly viewportTransform: ViewportTransform2D,
  ) {}

  public renderSketch(ctx: CanvasRenderingContext2D): void {
    const sketch = this.bridgeService.sketch;
    if (sketch === BridgeSketchModel.ABSENT) {
      return;
    }
    const savedStrokeStyle = ctx.strokeStyle;

    ctx.beginPath();
    ctx.strokeStyle = 'gray';
    for (const member of sketch.members) {
      const xa = this.viewportTransform.worldToViewportX(member.a.x);
      const ya = this.viewportTransform.worldToViewportY(member.a.y);
      ctx.moveTo(xa, ya);
      const xb = this.viewportTransform.worldToViewportX(member.b.x);
      const yb = this.viewportTransform.worldToViewportY(member.b.y);
      ctx.lineTo(xb, yb);
    }
    ctx.stroke();

    ctx.strokeStyle = savedStrokeStyle;

    for (const joint of sketch.joints) {
      this.cartoonJointRenderingService.renderJoint(ctx, joint)
    }
  }
}
