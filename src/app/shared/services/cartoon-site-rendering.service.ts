import { Injectable } from '@angular/core';
import { CartoonOptionMask } from './cartoon-rendering.service';
import { AbutmentSide, SiteRenderingHelper2D } from '../classes/site-rendering-helper-2d';
import { ViewportTransform2D } from './viewport-transform.service';
import { DesignBridgeService } from './design-bridge.service';
import { Colors, Graphics, Point2D, Rectangle2D } from '../classes/graphics';
import { SiteConstants } from '../classes/site-model';
import { FillPatternsService } from './fill-pattern.service';
import { DesignConditions } from './design-conditions.service';
import { Joint } from '../classes/joint.model';

@Injectable({ providedIn: 'root' })
export class CartoonSiteRenderingService {
  constructor(
    private readonly designBridgeService: DesignBridgeService,
    private readonly viewportTransform: ViewportTransform2D,
    private readonly fillPatternService: FillPatternsService,
  ) {}

  public render(ctx: CanvasRenderingContext2D, options: CartoonOptionMask): void {
    if (options & CartoonOptionMask.IN_SITU_TERRAIN) {
      this.renderInSituCrossSection(ctx, options);
    }
    if (options & CartoonOptionMask.EXCAVATED_TERRAIN) {
      this.renderExavatedCrossSection(ctx);
    }
    if (options & CartoonOptionMask.ARCH_LINE) {
      this.renderArchLine(ctx);
    }
    if (options & CartoonOptionMask.ABUTMENTS) {
      SiteRenderingHelper2D.renderAbutmentsAndPier(
        ctx,
        this.designBridgeService.designConditions,
        this,
        this.viewportTransform,
      );
    }
    if (options & CartoonOptionMask.DECK) {
      this.renderDeck(ctx, options);
    }
    if (options & CartoonOptionMask.MEASUREMENTS) {
      this.renderMeasurements(ctx);
    }
  }

  private readonly slab = Rectangle2D.createEmpty();

  private renderDeck(ctx: CanvasRenderingContext2D, options: CartoonOptionMask): void {
    const savedStrokeStyle = ctx.strokeStyle;
    const savedFillStyle = ctx.fillStyle;
    const savedLineWidth = ctx.lineWidth;

    const conditions = this.designBridgeService.designConditions;
    const viewportTransform = this.viewportTransform;
    const ySlabTop = viewportTransform.worldToViewportY(SiteConstants.WEAR_SURFACE_HEIGHT);
    const ySlabBottom = ySlabTop + 2;
    const yBeamBottom = ySlabBottom + 5; //viewportTransform.worldToViewportDistance(beamHeight);
    const xSlabLeft = viewportTransform.worldToViewportX(conditions.xLeftmostDeckJoint - SiteConstants.DECK_CANTILEVER);
    const xSlabRight = viewportTransform.worldToViewportX(
      conditions.xRightmostDeckJoint + SiteConstants.DECK_CANTILEVER,
    );
    // Deck slab.
    this.slab.setFromDiagonal(xSlabLeft, ySlabBottom, xSlabRight, ySlabTop);
    ctx.fillStyle = 'white';
    ctx.fillRect(this.slab.x0, this.slab.y0, this.slab.width, this.slab.height);
    ctx.strokeStyle = 'black';
    ctx.strokeRect(this.slab.x0, this.slab.y0, this.slab.width, this.slab.height);
    // Wear surface.
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(xSlabLeft, ySlabTop);
    ctx.lineTo(xSlabRight + 1, ySlabTop);
    ctx.stroke();

    ctx.lineWidth = savedLineWidth;
    ctx.fillStyle = savedFillStyle;
    ctx.strokeStyle = savedStrokeStyle;

    // Deck beams and associated joints.
    for (var i = 0; i < conditions.loadedJointCount; i++) {
      const joint = conditions.prescribedJoints[i];
      const x = viewportTransform.worldToViewportX(joint.x);
      ctx.beginPath();
      ctx.moveTo(x, ySlabTop);
      ctx.lineTo(x, yBeamBottom);
      ctx.stroke();
      if (options & CartoonOptionMask.JOINTS) {
        renderJoint(ctx, joint);
      }
    }

    // Draw the prescribed joints other than those on the deck.
    if (options & CartoonOptionMask.JOINTS) {
      // Render all (arch and anchorage joints)
      for (var i = conditions.loadedJointCount; i < conditions.prescribedJoints.length; i++) {
        renderJoint(ctx, conditions.prescribedJoints[i]);
      }
    } else {
      // Just the anchorages.
      if (conditions.isLeftAnchorage) {
        renderJoint(ctx, conditions.prescribedJoints[conditions.leftAnchorageJointIndex]);
      }
      if (conditions.isRightAnchorage) {
        renderJoint(ctx, conditions.prescribedJoints[conditions.rightAnchorageJointIndex]);
      }
    }

    function renderJoint(ctx: CanvasRenderingContext2D, joint: Joint): void {
      const savedStrokeStyle = ctx.strokeStyle;
      const savedFillStyle = ctx.fillStyle;

      const x = viewportTransform.worldToViewportX(joint.x);
      const y = viewportTransform.worldToViewportY(joint.y);
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

  private renderExavatedCrossSection(ctx: CanvasRenderingContext2D): void {
    const savedStrokeStyle = ctx.strokeStyle;
    const savedFillStyle = ctx.fillStyle;
    const savedLineWidth = ctx.lineWidth;

    // Set up return values for earth profile.
    const earthProfile: Path2D = new Path2D();
    const leftAccess: Point2D[] = [];
    const rightAccess: Point2D[] = [];
    SiteRenderingHelper2D.fillEarthProfileInfo(
      earthProfile,
      leftAccess,
      rightAccess,
      this.designBridgeService.siteInfo,
      this.viewportTransform,
    );
    ctx.fillStyle = Colors.CARTOON_EARTH;
    ctx.fill(earthProfile);
    ctx.strokeStyle = 'black';
    ctx.stroke(earthProfile);
    ctx.lineWidth = 2;
    ctx.beginPath();
    for (const pt of leftAccess) {
      ctx.lineTo(pt.x, pt.y);
    }
    ctx.stroke();
    ctx.beginPath();
    for (const pt of rightAccess) {
      ctx.lineTo(pt.x, pt.y);
    }
    ctx.stroke();

    ctx.lineWidth = savedLineWidth;
    ctx.fillStyle = savedFillStyle;
    ctx.strokeStyle = savedStrokeStyle;
  }

  private renderInSituCrossSection(ctx: CanvasRenderingContext2D, options: CartoonOptionMask): void {
    const savedFillStyle = ctx.fillStyle;
    const savedStrokeStyle = ctx.strokeStyle;

    const siteInfo = this.designBridgeService.siteInfo;
    const elevation = SiteConstants.ELEVATION_TERRAIN_POINTS;
    ctx.beginPath();
    for (var i = SiteConstants.RIGHT_SHORE_INDEX; i <= SiteConstants.LEFT_SHORE_INDEX; ++i) {
      const x = this.viewportTransform.worldToViewportX(elevation[i].x + siteInfo.halfCutGapWidth);
      const y = this.viewportTransform.worldToViewportY(elevation[i].y + siteInfo.yGradeLevel);
      ctx.lineTo(x, y);
    }
    ctx.fillStyle = Colors.WATER;
    ctx.fill();

    ctx.beginPath();
    for (const pt of elevation) {
      const x = this.viewportTransform.worldToViewportX(pt.x + siteInfo.halfCutGapWidth);
      const y = this.viewportTransform.worldToViewportY(pt.y + siteInfo.yGradeLevel);
      ctx.lineTo(x, y);
    }
    ctx.fillStyle =
      options & CartoonOptionMask.EXCAVATED_TERRAIN
        ? this.fillPatternService.createExcavation(ctx)
        : Colors.CARTOON_EARTH;
    ctx.fill();
    ctx.strokeStyle = 'black';
    ctx.stroke();

    ctx.strokeStyle = savedStrokeStyle;
    ctx.fillStyle = savedFillStyle;
  }

  /**
   * Traces the line of a generic arch. Uses a parabola because the
   * parameter for the proper catenary doesn't have a closed form.
   */
  private renderArchLine(ctx: CanvasRenderingContext2D): void {
    const conditions = this.designBridgeService.designConditions;
    // TODO: ... || sketch
    if (!conditions.isArch) {
      return;
    }

    const savedStrokeStyle = ctx.strokeStyle;

    const iArchJoints = conditions.archJointIndex;
    const p1 = conditions.prescribedJoints[iArchJoints];
    const p2 = conditions.prescribedJoints[Math.trunc(conditions.panelCount / 2)];
    const p3 = conditions.prescribedJoints[iArchJoints + 1];
    const xMid = 0.5 * (p1.x + p3.x);
    const x1 = p1.x - xMid;
    const y1 = p1.y;
    const x2 = p2.x - xMid;
    const y2 = p2.y - 0.1 * (p2.y - p1.y);
    const a = (y2 - y1) / (x2 * x2 - x1 * x1);
    const b = y1 - a * x1 * x1;
    ctx.strokeStyle = 'lightgray';
    ctx.beginPath();
    var xp: number = p1.x;
    var yp: number = p1.y;
    while (true) {
      const vpx = this.viewportTransform.worldToViewportX(xp);
      const vpy = this.viewportTransform.worldToViewportY(yp);
      ctx.lineTo(vpx, vpy);
      if (xp >= p3.x) {
        break;
      }
      xp += 0.5 * DesignConditions.PANEL_SIZE_WORLD;
      const x = xp - xMid;
      yp = a * x * x + b;
    }
    ctx.stroke();

    ctx.strokeStyle = savedStrokeStyle;
  }

  private renderMeasurements(ctx: CanvasRenderingContext2D): void {
    const savedStrokeStyle = ctx.strokeStyle;
    const savedFillStyle = ctx.fillStyle;
    const savedTextAlign = ctx.textAlign;
    const savedTextBaseline = ctx.textBaseline;

    ctx.strokeStyle = ctx.fillStyle = 'gray';
    // Grade line height.
    const siteInfo = this.designBridgeService.siteInfo;
    const yGrade = this.viewportTransform.worldToViewportY(siteInfo.yGradeLevel);
    // Design height of water.
    const yWater = this.viewportTransform.worldToViewportY(siteInfo.yGradeLevel - 24.0);
    // Useful gap x coordinates.
    const xGapLeft = this.viewportTransform.worldToViewportX(siteInfo.leftBankX);
    const xGapRight = this.viewportTransform.worldToViewportX(siteInfo.rightBankX);
    const xGapMiddle = 0.5 * (xGapLeft + xGapRight);
    // Generally useful tick dimension.
    const tickHalfSize = 3;
    // Horizontal dimension line, two ticks on the ends, and a label.
    const yGapDim = yGrade - 20;
    const yTickTop = yGapDim - tickHalfSize;
    const yTickBottom = yGrade + tickHalfSize;
    Graphics.drawDoubleArrow(ctx, xGapLeft, yGapDim, xGapRight, yGapDim);
    ctx.beginPath();
    ctx.moveTo(xGapLeft, yTickTop);
    ctx.lineTo(xGapLeft, yTickBottom);
    ctx.moveTo(xGapRight, yTickTop);
    ctx.lineTo(xGapRight, yTickBottom);
    ctx.stroke();
    ctx.textAlign = 'center';
    ctx.textBaseline = 'bottom';
    ctx.fillText('44 meters', xGapMiddle, yGapDim - 3);
    // Vertical dimension line, long tick on top, short tick on bottom,
    const xGapHeightDim = xGapMiddle - 40;
    Graphics.drawDoubleArrow(ctx, xGapHeightDim, yGrade, xGapHeightDim, yWater);
    const yAir = (yGrade + yWater) / 2;
    ctx.beginPath();
    ctx.moveTo(xGapHeightDim - tickHalfSize, yWater);
    ctx.lineTo(xGapHeightDim + tickHalfSize, yWater);
    ctx.moveTo(xGapLeft - 3, yGrade);
    ctx.lineTo(xGapHeightDim + tickHalfSize, yGrade);
    ctx.stroke();
    ctx.textAlign = 'left';
    ctx.textBaseline = 'middle';
    ctx.fillText('24 meters', xGapHeightDim + 3, yAir);

    // Slope icon
    const xSlopeIcon = xGapMiddle + 70;
    const widthSlopeIcon = 24;
    const heightSlopeIcon = widthSlopeIcon * 2;
    const ySlopeIcon = yAir + heightSlopeIcon / 2;
    const xSlopeIconTop = xSlopeIcon + widthSlopeIcon;
    const ySlopeIconTop = ySlopeIcon - heightSlopeIcon;
    const widthSlopeIconTail = 4;
    ctx.beginPath();
    ctx.moveTo(xSlopeIcon, ySlopeIcon);
    ctx.lineTo(xSlopeIcon, ySlopeIconTop);
    ctx.moveTo(xSlopeIcon, ySlopeIconTop);
    ctx.lineTo(xSlopeIconTop, ySlopeIconTop);
    ctx.moveTo(xSlopeIcon - widthSlopeIconTail, ySlopeIcon + 2 * widthSlopeIconTail);
    ctx.lineTo(xSlopeIconTop + widthSlopeIconTail, ySlopeIconTop - 2 * widthSlopeIconTail);
    ctx.stroke();
    ctx.textAlign = 'right';
    ctx.textBaseline = 'middle';
    ctx.fillText('2', xSlopeIcon - 3, yAir);
    ctx.textAlign = 'center';
    ctx.textBaseline = 'bottom';
    ctx.fillText('1', xSlopeIcon + widthSlopeIcon / 2, ySlopeIconTop - 3);

    ctx.textBaseline = savedTextBaseline;
    ctx.textAlign = savedTextAlign;
    ctx.fillStyle = savedFillStyle;
    ctx.strokeStyle = savedStrokeStyle;
  }

  private wearSurfaceRenderer = (ctx: CanvasRenderingContext2D, x0: number, x1: number, y: number) => {
    const savedLineWidth = ctx.lineWidth;

    ctx.beginPath();
    ctx.lineWidth = 2;
    ctx.moveTo(x0, y);
    ctx.lineTo(x1, y);
    ctx.stroke();

    ctx.lineWidth = savedLineWidth;
  };

  renderStandardAbutment(
    ctx: CanvasRenderingContext2D,
    location: Point2D,
    side: AbutmentSide,
    _constraintCount: number,
    viewportTransform: ViewportTransform2D,
  ): void {
    SiteRenderingHelper2D.renderStandardAbutmentImpl(
      ctx,
      Colors.CONCRETE,
      'black',
      location,
      side == AbutmentSide.RIGHT,
      this.wearSurfaceRenderer,
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
      Colors.CONCRETE,
      'black',
      location,
      side == AbutmentSide.RIGHT,
      archHeight,
      this.wearSurfaceRenderer,
      viewportTransform,
    );
  }

  renderPier(
    ctx: CanvasRenderingContext2D,
    location: Point2D,
    height: number,
    viewportTransform: ViewportTransform2D,
  ): void {
    SiteRenderingHelper2D.renderPierImpl(ctx, Colors.CONCRETE, 'black', location, height, viewportTransform);
  }
}
