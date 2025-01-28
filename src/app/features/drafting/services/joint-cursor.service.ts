import { Injectable } from '@angular/core';
import { ViewportTransform2D } from '../../../shared/services/viewport-transform.service';
import { Geometry, Point2D, Point2DInterface, Rectangle2D } from '../../../shared/classes/graphics';
import { CoordinateService } from './coordinate.service';
import { Joint } from '../../../shared/classes/joint.model';
import { MemberCursorService } from './member-cursor.service';
import { DesignGrid } from '../../../shared/services/design-grid.service';

/** Grid-restricted retical cursor for joints. Optional member rubberbands for joint moves. */
@Injectable({ providedIn: 'root' })
export class JointCursorService {
  private static readonly TARGET_RADIUS = 8.5;

  private readonly _locationWorld: Point2D = new Point2D();
  private readonly locationGrid: Point2D = new Point2D();
  private readonly locationViewport: Point2D = new Point2D();
  private readonly anchorJointsExtent: Rectangle2D = Rectangle2D.createEmpty();
  /** Precomputed anchor joint info for joint move cursor. Too expensive to compute per pointer move event. */
  private anchorJointsData: { joint: Joint; x: number; y: number }[] = [];
  private grid: DesignGrid | undefined;
  public visible: boolean = false;

  constructor(
    private readonly coordinateService: CoordinateService,
    private readonly viewportTransform: ViewportTransform2D,
  ) {}

  public get locationWorld(): Point2D {
    return this._locationWorld;
  }

  /** Starts the cursor at given viewport coordinates with optional anchor joints. */
  public start(x: number, y: number, options?: { anchorJoints?: Joint[], grid?: DesignGrid }): JointCursorService {
    this.grid = options?.grid;
    this.locateInViewport(x, y);
    this.setAnchorJoints(options?.anchorJoints);
    return this;
  }

  /** Starts the cursor at given world point with optional anchor joints. */
  public startAtWorldPoint(pt: Point2DInterface, options?: { anchorJoints?: Joint[], grid?: DesignGrid }): JointCursorService {
    this.grid = options?.grid;
    this.locateInWorld(pt.x, pt.y);
    this.setAnchorJoints(options?.anchorJoints);
    return this;
  }

  private setAnchorJoints(joints: Joint[] = []): void  {
    this.anchorJointsData = joints.map(joint => ({
      joint: joint,
      x: this.viewportTransform.worldToViewportX(joint.x),
      y: this.viewportTransform.worldToViewportY(joint.y),
    }));
    Geometry.getExtent2D(this.anchorJointsExtent, this.anchorJointsData);
  }

  public show(ctx: CanvasRenderingContext2D): JointCursorService {
    if (this.visible) {
      return this;
    }
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
    if (!this.visible) {
      return this;
    }
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

  /** Moves the visible cursor. If forced, moves invisible cursor and makes it visible. */
  public move(ctx: CanvasRenderingContext2D, x: number, y: number, force: boolean = false): void {
    if (!this.visible && !force) {
      return;
    }
    this.clear(ctx).locateInViewport(x, y).show(ctx);
  }

  public moveToWorldPoint(ctx: CanvasRenderingContext2D, pt: Point2DInterface): void {
    if (!this.visible) {
      return;
    }
    this.clear(ctx).locateInWorld(pt.x, pt.y).show(ctx);
  }

  public end(ctx: CanvasRenderingContext2D): Point2D {
    this.clear(ctx);
    this.anchorJointsData.length = 0;
    return this._locationWorld;
  }

  private locateInViewport(x: number, y: number): JointCursorService {
    this.locationViewport.x = x;
    this.locationViewport.y = y;
    this.viewportTransform.viewportToWorldPoint(this._locationWorld, this.locationViewport);
    this.coordinateService.shiftToNearestValidWorldPoint(this._locationWorld, this.locationGrid, this._locationWorld, this.grid);
    this.viewportTransform.worldToViewportPoint(this.locationViewport, this._locationWorld);
    return this;
  }

  private locateInWorld(x: number, y: number): JointCursorService {
    this._locationWorld.x = x;
    this._locationWorld.y = y;
    this.coordinateService.shiftToNearestValidWorldPoint(this._locationWorld, this.locationGrid, this._locationWorld, this.grid);
    this.viewportTransform.worldToViewportPoint(this.locationViewport, this._locationWorld);
    return this;
  }
}
