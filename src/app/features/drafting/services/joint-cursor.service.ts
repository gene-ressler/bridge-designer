import { Injectable } from '@angular/core';
import { ViewportTransform2D } from '../../../shared/services/viewport-transform.service';
import { Geometry, Point2D, Rectangle2D } from '../../../shared/classes/graphics';
import { CoordinateService } from './coordinate.service';
import { Joint } from '../../../shared/classes/joint.model';
import { MemberCursorService } from './member-cursor.service';

/** Grid-restricted retical cursor for joints. Optional member rubberbands for joint moves. */
@Injectable({ providedIn: 'root' })
export class JointCursorService {
  private static readonly TARGET_RADIUS = 8.5;

  private readonly _locationWorld: Point2D = new Point2D();
  private readonly locationGrid: Point2D = new Point2D();
  private readonly locationViewport: Point2D = new Point2D();
  private readonly anchorJointsExtent: Rectangle2D = Rectangle2D.createEmpty();
  /** Precomputed anchor joint info for joint move cursor. Too expensive to compute per mouse move event. */
  private anchorJointsData: { joint: Joint; x: number; y: number }[] = [];
  public visible: boolean = false;

  constructor(
    private readonly coordinateService: CoordinateService,
    private readonly viewportTransform: ViewportTransform2D,
  ) {}

  public get locationWorld(): Point2D {
    return this._locationWorld;
  }

  public start(x: number, y: number, anchorJoints?: Joint[]): JointCursorService {
    this.locate(x, y);
    if (anchorJoints) {
      this.anchorJointsData = anchorJoints.map(joint => ({
        joint: joint,
        x: this.viewportTransform.worldToViewportX(joint.x),
        y: this.viewportTransform.worldToViewportY(joint.y),
      }));
      Geometry.getExtent2D(this.anchorJointsExtent, this.anchorJointsData);
    }
    return this;
  }

  public show(ctx: CanvasRenderingContext2D): JointCursorService {
    const savedStrokeStyle = ctx.strokeStyle;
    const savedLineDash = ctx.getLineDash();

    const x = this.locationViewport.x;
    const y = this.locationViewport.y;
    ctx.strokeStyle = 'blue';
    ctx.beginPath();
    ctx.arc(x, y, JointCursorService.TARGET_RADIUS, 0, 2 * Math.PI, true); // circle
    ctx.moveTo(0, y);
    ctx.lineTo(ctx.canvas.width - 1, y);
    ctx.moveTo(x, 0);
    ctx.lineTo(x, ctx.canvas.height - 1);
    ctx.stroke();

    ctx.beginPath();
    ctx.setLineDash(MemberCursorService.CENTERLINE_DASH);
    this.anchorJointsData.forEach(({ x, y }) => {
      ctx.moveTo(this.locationViewport.x, this.locationViewport.y);
      ctx.lineTo(x, y);
    });
    ctx.stroke();
    this.visible = true;

    ctx.setLineDash(savedLineDash);
    ctx.strokeStyle = savedStrokeStyle;
    return this;
  }

  private readonly clearExtent: Rectangle2D = Rectangle2D.createEmpty();

  public clear(ctx: CanvasRenderingContext2D): JointCursorService {
    const x = this.locationViewport.x;
    const y = this.locationViewport.y;
    ctx.clearRect(0, y - JointCursorService.TARGET_RADIUS, ctx.canvas.width, 2 * JointCursorService.TARGET_RADIUS);
    ctx.clearRect(x - JointCursorService.TARGET_RADIUS, 0, 2 * JointCursorService.TARGET_RADIUS, ctx.canvas.height);
    if (this.anchorJointsData.length > 0) {
      const clearExtent = this.anchorJointsExtent.copyTo(this.clearExtent);
      Geometry.addToExtent2D(clearExtent, this.locationViewport).pad(1, 1);
      ctx.clearRect(clearExtent.x0, clearExtent.y0, clearExtent.width, clearExtent.height);
    }
    this.visible = false;
    return this;
  }

  public move(ctx: CanvasRenderingContext2D, x: number, y: number): void {
    if (!this.visible) {
      return;
    }
    this.clear(ctx).locate(x, y).show(ctx);
  }

  public end(ctx: CanvasRenderingContext2D): Point2D {
    this.clear(ctx);
    this.anchorJointsData.length = 0;
    return this._locationWorld;
  }

  private locate(x: number, y: number): JointCursorService {
    this.locationViewport.x = x;
    this.locationViewport.y = y;
    // Snap to grid.
    this.viewportTransform.viewportToWorldPoint(this._locationWorld, this.locationViewport);
    this.coordinateService.shiftToNearestValidWorldPoint(this._locationWorld, this.locationGrid, this._locationWorld);
    this.viewportTransform.worldToViewportPoint(this.locationViewport, this._locationWorld);
    return this;
  }
}
