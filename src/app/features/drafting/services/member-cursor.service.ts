import { Injectable } from '@angular/core';
import { Rectangle2D } from '../../../shared/classes/graphics';
import { Joint } from '../../../shared/classes/joint.model';
import { DesignJointRenderingService } from '../../../shared/services/design-joint-rendering.service';
import { ViewportTransform2D } from '../../../shared/services/viewport-transform.service';
import { HotElement } from './hot-element.service';

@Injectable({providedIn: 'root'})
export class MemberCursorService {
  private _anchorJoint: Joint | undefined;
  private anchorX: number = 0;
  private anchorY: number = 0;
  private cursorX: number = 0;
  private cursorY: number = 0;
  private ctx?: CanvasRenderingContext2D;

  constructor(
    private readonly designJointRenderingService: DesignJointRenderingService,
    private readonly viewportTransform: ViewportTransform2D,
  ) { }

  public start(ctx: CanvasRenderingContext2D, x: number, y: number, joint: Joint): void {
    this._anchorJoint = joint;
    this.anchorX = this.viewportTransform.worldToViewportX(this._anchorJoint.x);
    this.anchorY = this.viewportTransform.worldToViewportY(this._anchorJoint.y);
    this.cursorX = x;
    this.cursorY = y;
    this.ctx = ctx;
    this.show(x, y, undefined);
  }

  public update(x: number, y: number, hotElement: HotElement): void {
    if (!this._anchorJoint) {
      return;
    }
    this.erase();
    this.show(x, y, hotElement);
  }

  public end(): Joint | undefined {
    if (!this._anchorJoint) {
      return;
    }
    this.erase();
    const anchor = this._anchorJoint;
    this._anchorJoint = this.ctx = undefined;
    return anchor;
  }

  private show(x: number, y: number, hotElement: HotElement): void {
    const ctx = this.ctx!;
    const savedStrokeStyle = ctx.strokeStyle;
    const savedLineDash = ctx.getLineDash();

    ctx.strokeStyle = 'blue';
    ctx.setLineDash([4, 4, 16, 4]); // centerline dash
    if (hotElement instanceof Joint) {
      this.cursorX = this.viewportTransform.worldToViewportX(hotElement.x);
      this.cursorY = this.viewportTransform.worldToViewportY(hotElement.y);
    } else {
      this.cursorX = x;
      this.cursorY = y;
    }
    ctx.beginPath();
    ctx.moveTo(this.anchorX, this.anchorY);
    ctx.lineTo(this.cursorX, this.cursorY);
    ctx.stroke();
    // Restore joints erased along with rubberband.
    this.designJointRenderingService.renderHot(ctx, this._anchorJoint!, false);
    if (hotElement instanceof Joint) {
      this.designJointRenderingService.renderHot(ctx, hotElement, false);
    }

    ctx.setLineDash(savedLineDash);
    ctx.strokeStyle = savedStrokeStyle;
  }

  private readonly cleared = Rectangle2D.createEmpty();

  private erase(): void {
    const pad = DesignJointRenderingService.JOINT_RADIUS_VIEWPORT;
    this.cleared.setFromDiagonal(this.anchorX, this.anchorY, this.cursorX, this.cursorY).pad(pad, pad);
    this.ctx?.clearRect(this.cleared.x0, this.cleared.y0, this.cleared.width, this.cleared.height);
  }
}
