import { Injectable } from '@angular/core';
import { Colors, Point2D } from '../classes/graphics';
import { SiteConstants } from '../classes/site-model';
import { AbutmentSide, SiteDetailRenderers, SiteRenderingHelper2D } from '../classes/site-rendering-helper-2d';
import { DesignBridgeService } from './design-bridge.service';
import { FillPatternsService as FillPatternService } from './fill-pattern.service';
import { ViewportTransform2D } from './viewport-transform.service';

@Injectable({ providedIn: 'root' })
export class DesignSiteRenderingService implements SiteDetailRenderers {
  constructor(
    private readonly designBridgeService: DesignBridgeService,
    private readonly fillPatternService: FillPatternService,
    private readonly viewportTransform: ViewportTransform2D,
  ) {}

  public render(ctx: CanvasRenderingContext2D) {
    this.renderDeck(ctx);
    this.renderExcavatedCrossSection(ctx);
    this.renderInSituCrossSection(ctx);
    SiteRenderingHelper2D.renderAbutmentsAndPier(
      ctx,
      this.designBridgeService.designConditions,
      this,
      this.viewportTransform,
    );
  }

  /**
   * Render the bridge deck.
   *
   * Logically part of the site because it never changes and isn't selectable.
   */
  private renderDeck(ctx: CanvasRenderingContext2D) {
    const savedStrokeStyle = ctx.strokeStyle;
    const savedFillStyle = ctx.fillStyle;
    const savedLineWidth = ctx.lineWidth;

    const conditions = this.designBridgeService.designConditions;

    // Calculate deck beam dimensions in viewport pixel coordinates.
    const halfBeamFlangeWidth = this.viewportTransform.worldToViewportDistance(0.18);
    const ySlabTop = this.viewportTransform.worldToViewportY(SiteConstants.WEAR_SURFACE_HEIGHT);
    const ySlabBottom = this.viewportTransform.worldToViewportY(
      SiteConstants.WEAR_SURFACE_HEIGHT - conditions.deckThickness,
    );
    const yBeamTop = ySlabBottom + 2;
    const yBeamBottom = yBeamTop + this.viewportTransform.worldToViewportDistance(SiteConstants.BEAM_HEIGHT);

    const xSlabLeft = this.viewportTransform.worldToViewportX(
      conditions.xLeftmostDeckJoint - SiteConstants.DECK_CANTILEVER,
    );
    const xSlabRight = this.viewportTransform.worldToViewportX(
      conditions.xRightmostDeckJoint + SiteConstants.DECK_CANTILEVER,
    );

    // Draw the deck slab as a single polygon.
    ctx.fillStyle = this.fillPatternService.createConcrete(ctx);
    ctx.fillRect(xSlabLeft, ySlabTop, xSlabRight - xSlabLeft, ySlabBottom - ySlabTop);
    ctx.strokeStyle = Colors.CONCRETE;
    ctx.strokeRect(xSlabLeft, ySlabTop, xSlabRight - xSlabLeft, ySlabBottom - ySlabTop);

    ctx.lineWidth = 3;
    ctx.strokeStyle = Colors.CONCRETE;
    ctx.beginPath();
    ctx.moveTo(xSlabLeft, ySlabTop);
    ctx.lineTo(xSlabRight + 1, ySlabTop);
    ctx.stroke();

    // Draw the deck beams and also the deck slab joints.
    for (var i = 0; i < conditions.loadedJointCount; i++) {
      const x = this.viewportTransform.worldToViewportX(conditions.prescribedJoints[i].x);
      ctx.lineWidth = 3;
      ctx.strokeStyle = Colors.STEEL;
      ctx.beginPath();
      ctx.moveTo(x - halfBeamFlangeWidth + 1, yBeamTop);
      ctx.lineTo(x + halfBeamFlangeWidth, yBeamTop);
      ctx.moveTo(x - halfBeamFlangeWidth + 1, yBeamBottom);
      ctx.lineTo(x + halfBeamFlangeWidth, yBeamBottom);
      ctx.moveTo(x, yBeamTop);
      ctx.lineTo(x, yBeamBottom);
      ctx.stroke();
      // Draw concrete joints.
      if (i != 0 && i != conditions.loadedJointCount - 1) {
        ctx.beginPath();
        ctx.strokeStyle = Colors.CONCRETE;
        ctx.lineWidth = 1;
        ctx.moveTo(x, ySlabTop);
        ctx.lineTo(x, ySlabBottom);
        ctx.stroke();
      }
    }
    ctx.lineWidth = savedLineWidth;
    ctx.fillStyle = savedFillStyle;
    ctx.strokeStyle = savedStrokeStyle;
  }

  private renderExcavatedCrossSection(ctx: CanvasRenderingContext2D) {
    const savedFillStyle = ctx.fillStyle;
    const savedStrokeStyle = ctx.strokeStyle;
    const savedLineWidth = ctx.lineWidth;
    const siteInfo = this.designBridgeService.siteInfo;

    // Set up return values for earth profile.
    const earthProfile: Path2D = new Path2D();
    const leftAccess: Point2D[] = [];
    const rightAccess: Point2D[] = [];
    SiteRenderingHelper2D.fillEarthProfileInfo(earthProfile, leftAccess, rightAccess, siteInfo, this.viewportTransform);
    ctx.fillStyle = this.fillPatternService.createEarth(ctx);
    ctx.fill(earthProfile);

    // Now stroke the edge of the portion of the elevation terrain between abutments.
    ctx.strokeStyle = Colors.EARTH;
    ctx.beginPath();
    for (var i = siteInfo.rightAbutmentInterfaceTerrainIndex; i <= siteInfo.leftAbutmentInterfaceTerrainIndex; i++) {
      const x = this.viewportTransform.worldToViewportX(
        SiteConstants.ELEVATION_TERRAIN_POINTS[i].x + siteInfo.halfCutGapWidth,
      );
      const y = this.viewportTransform.worldToViewportY(
        SiteConstants.ELEVATION_TERRAIN_POINTS[i].y + siteInfo.yGradeLevel,
      );
      ctx.lineTo(x, y);
    }
    ctx.stroke();

    // Now the polygon for the subgrade and thick line for wear surface of the access roads. Right bank first.
    const subgradeHeight = this.viewportTransform.worldToViewportDistance(0.3);
    ctx.beginPath();
    for (const pt of rightAccess) {
      ctx.lineTo(pt.x, pt.y);
    }
    for (var i = rightAccess.length - 1; i >= 0; --i) {
      const pt: Point2D = rightAccess[i];
      ctx.lineTo(pt.x, pt.y + subgradeHeight);
    }
    ctx.closePath();
    ctx.fillStyle = this.fillPatternService.createSubgrade(ctx);
    ctx.fill();
    ctx.stroke();

    ctx.lineWidth = 3;
    ctx.strokeStyle = Colors.CONCRETE;
    ctx.beginPath();
    for (const pt of rightAccess) {
      ctx.lineTo(pt.x, pt.y);
    }
    ctx.stroke();

    // Left bank.
    ctx.beginPath();
    for (const pt of leftAccess) {
      ctx.lineTo(pt.x, pt.y);
    }
    for (var i = leftAccess.length - 1; i >= 0; --i) {
      const pt: Point2D = leftAccess[i];
      ctx.lineTo(pt.x, pt.y + subgradeHeight);
    }
    ctx.closePath();
    ctx.fillStyle = this.fillPatternService.createSubgrade(ctx);
    ctx.fill();
    ctx.stroke();

    ctx.lineWidth = 3;
    ctx.strokeStyle = Colors.CONCRETE;
    ctx.beginPath();
    for (const pt of leftAccess) {
      ctx.lineTo(pt.x, pt.y);
    }
    ctx.stroke();

    ctx.lineWidth = savedLineWidth;
    ctx.strokeStyle = savedStrokeStyle;
    ctx.fillStyle = savedFillStyle;
  }

  /** Traces the profile of the terrain before excavation as a dotted line. */
  private renderInSituCrossSection(ctx: CanvasRenderingContext2D) {
    const savedStrokeStyle = ctx.strokeStyle;
    const savedLineDash = ctx.getLineDash();
    const siteInfo = this.designBridgeService.siteInfo;

    // Draw the high water mark.
    ctx.strokeStyle = Colors.WATER;
    const leftShore: Point2D = SiteConstants.ELEVATION_TERRAIN_POINTS[SiteConstants.LEFT_SHORE_INDEX];
    const rightShore: Point2D = SiteConstants.ELEVATION_TERRAIN_POINTS[SiteConstants.RIGHT_SHORE_INDEX];
    var x0 = this.viewportTransform.worldToViewportX(leftShore.x + siteInfo.halfCutGapWidth);
    var y0 = this.viewportTransform.worldToViewportY(leftShore.y + siteInfo.yGradeLevel);
    var x1 = this.viewportTransform.worldToViewportX(rightShore.x + siteInfo.halfCutGapWidth);
    var y1 = this.viewportTransform.worldToViewportY(rightShore.y + siteInfo.yGradeLevel);
    ctx.beginPath();
    for (var i = 0; i < 3; i++) {
      ctx.moveTo(x0, y0);
      ctx.lineTo(x1, y1);
      x0 += 30;
      x1 -= 30;
      y0 += 4;
      y1 += 4;
    }
    ctx.stroke();

    // Set up earth color and dotted line stroke.
    ctx.strokeStyle = Colors.EARTH;
    ctx.setLineDash(SiteConstants.TERRAIN_DASH);

    // Draw right bank profile up to right abutment. Skip [0] and [length-1] because they're
    // the lower left and lower right polygon points, which we don't need here.
    ctx.beginPath();
    for (var i = 1; i <= siteInfo.rightAbutmentInterfaceTerrainIndex; i++) {
      const pi = SiteConstants.ELEVATION_TERRAIN_POINTS[i];
      const x = this.viewportTransform.worldToViewportX(pi.x + siteInfo.halfCutGapWidth);
      const y = this.viewportTransform.worldToViewportY(pi.y + siteInfo.yGradeLevel);
      ctx.lineTo(x, y);
    }
    ctx.stroke();

    // Draw left bank profile starting with left abutment.
    ctx.beginPath();
    for (
      var i = siteInfo.leftAbutmentInterfaceTerrainIndex;
      i < SiteConstants.ELEVATION_TERRAIN_POINTS.length - 1;
      i++
    ) {
      const pi = SiteConstants.ELEVATION_TERRAIN_POINTS[i];
      const x = this.viewportTransform.worldToViewportX(pi.x + siteInfo.halfCutGapWidth);
      const y = this.viewportTransform.worldToViewportY(pi.y + siteInfo.yGradeLevel);
      ctx.lineTo(x, y);
    }
    ctx.stroke();

    ctx.strokeStyle = savedStrokeStyle;
    ctx.setLineDash(savedLineDash);
  }

  renderStandardAbutment(
    ctx: CanvasRenderingContext2D,
    location: Point2D,
    side: AbutmentSide,
    _constraintCount: number,
    viewportTransform: ViewportTransform2D,
  ): void {
    SiteRenderingHelper2D.renderStandardAbutmentImpl(
      ctx,
      this.fillPatternService.createConcrete(ctx),
      Colors.CONCRETE,
      location,
      side == AbutmentSide.RIGHT,
      DesignSiteRenderingService.renderAbutmentWearSurface,
      viewportTransform,
    );
  }

  renderArchAbutment(
    ctx: CanvasRenderingContext2D,
    location: Point2D,
    side: AbutmentSide,
    archHeight: number,
    viewportTransform: ViewportTransform2D,
  ): void {
    SiteRenderingHelper2D.renderArchAbutmentImpl(
      ctx,
      this.fillPatternService.createConcrete(ctx),
      Colors.CONCRETE,
      location,
      side == AbutmentSide.RIGHT,
      archHeight,
      DesignSiteRenderingService.renderAbutmentWearSurface,
      viewportTransform,
    );
  }

  renderPier(
    ctx: CanvasRenderingContext2D,
    location: Point2D,
    height: number,
    viewportTransform: ViewportTransform2D,
  ): void {
    SiteRenderingHelper2D.renderPierImpl(
      ctx,
      this.fillPatternService.createConcrete(ctx),
      Colors.CONCRETE,
      location,
      height,
      viewportTransform,
    );
  }

  private static renderAbutmentWearSurface(ctx: CanvasRenderingContext2D, x0: number, x1: number, y: number): void {
    const savedLineWidth = ctx.lineWidth;
    const savedStrokeStyle = ctx.strokeStyle;
    const savedLineCap = ctx.lineCap;

    ctx.lineWidth = 3;
    ctx.strokeStyle = Colors.CONCRETE;
    ctx.lineCap = 'square';
    ctx.beginPath();
    ctx.moveTo(x0, y);
    ctx.lineTo(x1, y);
    ctx.stroke();

    ctx.lineCap = savedLineCap;
    ctx.strokeStyle = savedStrokeStyle;
    ctx.lineWidth = savedLineWidth;
  }
}
