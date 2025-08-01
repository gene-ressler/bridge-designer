import { DesignConditions } from '../services/design-conditions.service';
import { ViewportTransform2D } from '../services/viewport-transform.service';
import { FillStyle, Point2D, Point2DInterface, StrokeStyle } from './graphics';
import { PointTag, SiteConstants, SiteModel } from './site.model';

export const enum AbutmentSide {
  LEFT,
  RIGHT,
}

/** Interface to renderers of site details, normally implemented using methonds of this service. */
export interface SiteDetailRenderers {
  renderStandardAbutment(
    location: Point2DInterface,
    side: AbutmentSide,
    constraintCount: number, // Number of constraints to depict in blueprint views: 1 or 2, i.e. roller or pivot.
    ctx?: CanvasRenderingContext2D,
    viewportTransform?: ViewportTransform2D
  ): void;
  renderArchAbutment(
    location: Point2DInterface,
    side: AbutmentSide,
    archHeight: number,
    ctx?: CanvasRenderingContext2D,
    viewportTransform?: ViewportTransform2D
  ): void;
  renderPier(
    location: Point2DInterface,
    height: number,
    ctx?: CanvasRenderingContext2D,
    viewportTransform?: ViewportTransform2D
  ): void;
}

export type WearSurfaceRenderer = (
  ctx: CanvasRenderingContext2D,
  x0: number,
  x1: number,
  y: number
) => void;

export class SiteRenderingHelper2D {
  /** Fill three arrays with curves describing the earth profile of the site in viewport coords. */
  public static fillEarthProfileInfo(
    // out
    earthProfile: Path2D,
    leftAccess: Point2D[],
    rightAccess: Point2D[],
    // in
    siteInfo: SiteModel,
    viewportTransform: ViewportTransform2D
  ): void {
    // const addPoint(x: number, y: number, list?: number[])
    // Etch-a-sketch coordinates.
    let x: number = 0;
    let y: number = 0;
    // Trace left access from right to left.
    const xBaseLeft =
      siteInfo.xLeftmostDeckJoint - SiteConstants.ABUTMENT_INTERFACE_SETBACK;
    if (siteInfo.designConditions.isAtGrade) {
      x = viewportTransform.worldToViewportX(xBaseLeft);
      y = viewportTransform.worldToViewportY(SiteConstants.DECK_TOP_HEIGHT);
      const pt0 = new Point2D(x, y);
      x = viewportTransform.worldToViewportX(
        xBaseLeft - SiteConstants.TANGENT_OFFSET - SiteConstants.ACCESS_LENGTH
      );
      const pt1 = new Point2D(x, y);
      leftAccess.push(pt0, pt1);
      earthProfile.lineTo(pt0.x, pt0.y);
      earthProfile.lineTo(pt1.x, pt1.y);
    } else {
      for (const curvePt of SiteConstants.ACCESS_CURVE) {
        x = viewportTransform.worldToViewportX(xBaseLeft - curvePt.x);
        y = viewportTransform.worldToViewportY(
          SiteConstants.DECK_TOP_HEIGHT + curvePt.y
        );
        const pt = new Point2D(x, y);
        leftAccess.push(pt);
        earthProfile.lineTo(pt.x, pt.y);
      }
    }
    // Now down deep below the screen.
    y = viewportTransform.worldToViewportY(-SiteConstants.FAR_AWAY);
    earthProfile.lineTo(x, y);
    // Now to far right of right access.
    const xBaseRight =
      siteInfo.xRightmostDeckJoint + SiteConstants.ABUTMENT_INTERFACE_SETBACK;
    x = viewportTransform.worldToViewportX(
      xBaseRight + SiteConstants.TANGENT_OFFSET + SiteConstants.ACCESS_LENGTH
    );
    earthProfile.lineTo(x, y);
    // Now the right access curve from right to left.
    if (siteInfo.designConditions.isAtGrade) {
      y = viewportTransform.worldToViewportY(SiteConstants.DECK_TOP_HEIGHT);
      const pt0 = new Point2D(x, y);
      x = viewportTransform.worldToViewportX(xBaseRight);
      const pt1 = new Point2D(x, y);
      rightAccess.push(pt0, pt1);
      earthProfile.lineTo(pt0.x, pt0.y);
      earthProfile.lineTo(pt1.x, pt1.y);
    } else {
      for (let i = SiteConstants.ACCESS_CURVE.length - 1; i >= 0; --i) {
        const curvePt: Point2D = SiteConstants.ACCESS_CURVE[i];
        x = viewportTransform.worldToViewportX(xBaseRight + curvePt.x);
        y = viewportTransform.worldToViewportY(
          SiteConstants.DECK_TOP_HEIGHT + curvePt.y
        );
        const pt = new Point2D(x, y);
        rightAccess.push(pt);
        earthProfile.lineTo(pt.x, pt.y);
      }
    }
    // Straight down to level of abutment interface vertex.  Must lie behind abutment.
    y = viewportTransform.worldToViewportY(
      SiteConstants.ELEVATION_TERRAIN_POINTS[
        siteInfo.rightAbutmentInterfaceTerrainIndex
      ].y + siteInfo.yGradeLevel
    );
    earthProfile.lineTo(x, y);
    // Now the portion of the elevation terrain between abutments.
    for (
      let i = siteInfo.rightAbutmentInterfaceTerrainIndex;
      i <= siteInfo.leftAbutmentInterfaceTerrainIndex;
      i++
    ) {
      const pt: Point2D = SiteConstants.ELEVATION_TERRAIN_POINTS[i];
      x = viewportTransform.worldToViewportX(pt.x + siteInfo.halfCutGapWidth);
      y = viewportTransform.worldToViewportY(pt.y + siteInfo.yGradeLevel);
      earthProfile.lineTo(x, y);
    }
    // Short segment left so final edge of polygon is vertical and certain to lie behind abutment.
    x = viewportTransform.worldToViewportX(
      siteInfo.xLeftmostDeckJoint - SiteConstants.ABUTMENT_INTERFACE_SETBACK
    );
    earthProfile.lineTo(x, y);
    earthProfile.closePath();
  }

  public static renderAbutmentsAndPier(
    conditions: DesignConditions,
    siteDetailRenderers: SiteDetailRenderers,
    ctx?: CanvasRenderingContext2D,
    viewportTransform?: ViewportTransform2D
  ) {
    const pLeft = conditions.prescribedJoints[0];
    const pRight = conditions.prescribedJoints[conditions.loadedJointCount - 1];
    if (conditions.isArch) {
      const archHeight = -conditions.underClearance;
      siteDetailRenderers.renderArchAbutment(
        pLeft,
        AbutmentSide.LEFT,
        archHeight,
        ctx,
        viewportTransform
      );
      siteDetailRenderers.renderArchAbutment(
        pRight,
        AbutmentSide.RIGHT,
        archHeight,
        ctx,
        viewportTransform
      );
    } else {
      siteDetailRenderers.renderStandardAbutment(
        pLeft,
        AbutmentSide.LEFT,
        conditions.isHiPier ? 1 : 2,
        ctx,
        viewportTransform
      );
      siteDetailRenderers.renderStandardAbutment(
        pRight,
        AbutmentSide.RIGHT,
        1,
        ctx,
        viewportTransform
      );
    }
    if (conditions.isPier) {
      siteDetailRenderers.renderPier(
        conditions.prescribedJoints[conditions.pierJointIndex],
        conditions.pierHeight,
        ctx,
        viewportTransform
      );
    }
  }

  public static renderStandardAbutmentImpl(
    ctx: CanvasRenderingContext2D,
    fillStyle: FillStyle,
    strokeStyle: StrokeStyle,
    location: Point2D,
    mirror: boolean,
    wearSurfaceRenderer: WearSurfaceRenderer,
    viewportTransform: ViewportTransform2D
  ): void {
    const savedStrokeStyle = ctx.strokeStyle;
    const savedFillStyle = ctx.fillStyle;

    ctx.beginPath();
    for (const p of SiteConstants.STANDARD_ABUTMENT_POINTS) {
      const xMirrored = mirror ? -p.x : p.x;
      ctx.lineTo(
        viewportTransform.worldToViewportX(location.x + xMirrored),
        viewportTransform.worldToViewportY(location.y + p.y)
      );
    }
    ctx.closePath();
    ctx.fillStyle = fillStyle;
    ctx.fill();
    ctx.strokeStyle = strokeStyle;
    ctx.stroke();
    this.renderAbutmentWearSurfaceImpl(
      ctx,
      location,
      mirror,
      wearSurfaceRenderer,
      viewportTransform
    );

    ctx.fillStyle = savedFillStyle;
    ctx.strokeStyle = savedStrokeStyle;
  }

  public static renderArchAbutmentImpl(
    ctx: CanvasRenderingContext2D,
    fillStyle: FillStyle,
    strokeStyle: StrokeStyle,
    location: Point2D,
    mirror: boolean,
    archHeight: number,
    wearSurfaceRenderer: WearSurfaceRenderer,
    viewportTransform: ViewportTransform2D
  ): void {
    const savedStrokeStyle = ctx.strokeStyle;
    const savedFillStyle = ctx.fillStyle;

    ctx.beginPath();
    for (const p of SiteConstants.ARCH_ABUTMENT_POINTS) {
      const xMirrored = mirror ? -p.x : p.x;
      const yHeightAdjusted =
        p.tag === PointTag.HEIGHT_ADJUSTED ? p.y + archHeight : p.y;
      ctx.lineTo(
        viewportTransform.worldToViewportX(location.x + xMirrored),
        viewportTransform.worldToViewportY(location.y + yHeightAdjusted)
      );
    }
    ctx.closePath();
    ctx.fillStyle = fillStyle;
    ctx.fill();
    ctx.strokeStyle = strokeStyle;
    ctx.stroke();
    this.renderAbutmentWearSurfaceImpl(
      ctx,
      location,
      mirror,
      wearSurfaceRenderer,
      viewportTransform
    );

    ctx.fillStyle = savedFillStyle;
    ctx.strokeStyle = savedStrokeStyle;
}

  private static renderAbutmentWearSurfaceImpl(
    ctx: CanvasRenderingContext2D,
    location: Point2D,
    mirror: boolean,
    renderWearSurface: WearSurfaceRenderer,
    viewportTransform: ViewportTransform2D
  ): void {
    const x0Mirrored = mirror
      ? -SiteConstants.WEAR_SURFACE_X0
      : SiteConstants.WEAR_SURFACE_X0;
    const x1Mirrored = mirror
      ? -SiteConstants.WEAR_SURFACE_X1
      : SiteConstants.WEAR_SURFACE_X1;
    const x0 = viewportTransform.worldToViewportX(location.x + x0Mirrored);
    const x1 = viewportTransform.worldToViewportX(location.x + x1Mirrored);
    const y = viewportTransform.worldToViewportY(
      location.y + SiteConstants.DECK_TOP_HEIGHT
    );
    // Call the concrete renderer.
    if (x0 < x1) {
      renderWearSurface(ctx, x0, x1, y);
    } else {
      renderWearSurface(ctx, x1, x0, y);
    }
  }

  public static renderPierImpl(
    ctx: CanvasRenderingContext2D,
    fillStyle: FillStyle,
    strokeStyle: StrokeStyle,
    location: Point2D,
    pierHeight: number,
    viewportTransform: ViewportTransform2D
  ): void {
    const savedStrokeStyle = ctx.strokeStyle;
    const savedFillStyle = ctx.fillStyle;

    ctx.beginPath();
    for (const p of SiteConstants.PIER_POINTS) {
      const yHeightAdjusted =
        p.tag === PointTag.HEIGHT_ADJUSTED ? p.y - pierHeight : p.y;
      ctx.lineTo(
        viewportTransform.worldToViewportX(location.x + p.x),
        viewportTransform.worldToViewportY(location.y + yHeightAdjusted)
      );
    }
    ctx.closePath();
    ctx.fillStyle = fillStyle;
    ctx.fill();
    ctx.strokeStyle = strokeStyle;
    ctx.stroke();

    ctx.fillStyle = savedFillStyle;
    ctx.strokeStyle = savedStrokeStyle;
  }
}
