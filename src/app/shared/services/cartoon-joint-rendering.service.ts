import { Injectable } from '@angular/core';
import { ViewportTransform2D } from './viewport-transform.service';
import { Point2DInterface } from '../classes/graphics';

@Injectable({providedIn: 'root'})
export class CartoonJointRenderingService {
  constructor(private readonly viewportTransform: ViewportTransform2D) { }

  /** Renders cartoon joints in multiple places. */
  public renderJoint(ctx: CanvasRenderingContext2D, joint: Point2DInterface): void {
    const savedStrokeStyle = ctx.strokeStyle;
    const savedFillStyle = ctx.fillStyle;

    const x = this.viewportTransform.worldToViewportX(joint.x);
    const y = this.viewportTransform.worldToViewportY(joint.y);
    ctx.beginPath();
    ctx.arc(x, y, 2, 0, 2 * Math.PI);
    ctx.fillStyle = 'white';
    ctx.fill();
    ctx.strokeStyle = 'black';
    ctx.stroke();

    ctx.fillStyle = savedFillStyle;
    ctx.strokeStyle = savedStrokeStyle;
  }
}
