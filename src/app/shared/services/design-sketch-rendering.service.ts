import { Injectable } from '@angular/core';
import { BridgeService } from './bridge.service';
import { ViewportTransform2D } from './viewport-transform.service';
import { BridgeSketchModel } from '../classes/bridge-sketch.model';
import { DesignJointRenderingService } from './design-joint-rendering.service';

@Injectable({ providedIn: 'root' })
export class DesignSketchRenderingService {
  constructor(
    private readonly bridgeService: BridgeService,
    private readonly viewportTransform: ViewportTransform2D,
  ) {}

  public renderSketch(ctx: CanvasRenderingContext2D): void {
    const sketch = this.bridgeService.sketch;
    if (sketch === BridgeSketchModel.ABSENT) {
      return;
    }
    const savedStrokeStyle = ctx.strokeStyle;
    const savedFillStyle = ctx.fillStyle;

    ctx.beginPath();
    ctx.strokeStyle = 'lightgray';
    for (const member of sketch.members) {
      const xa = this.viewportTransform.worldToViewportX(member.a.x);
      const ya = this.viewportTransform.worldToViewportY(member.a.y);
      ctx.moveTo(xa, ya);
      const xb = this.viewportTransform.worldToViewportX(member.b.x);
      const yb = this.viewportTransform.worldToViewportY(member.b.y);
      ctx.lineTo(xb, yb);
    }
    ctx.stroke();

    ctx.fillStyle = 'white';
    for (const joint of sketch.joints) {
      const x = this.viewportTransform.worldToViewportX(joint.x);
      const y = this.viewportTransform.worldToViewportY(joint.y);
      ctx.beginPath();
      ctx.arc(x, y, DesignJointRenderingService.JOINT_RADIUS_VIEWPORT, 0, 2 * Math.PI);
      ctx.fill();
      ctx.stroke();
    }

    ctx.fillStyle = savedFillStyle;
    ctx.strokeStyle = savedStrokeStyle;
  }
}
