import { Injectable } from '@angular/core';
import { Geometry, Graphics, Point2D, Point2DInterface, Rectangle2D } from '../classes/graphics';
import { Member } from '../classes/member.model';
import { DesignJointRenderingService } from './design-joint-rendering.service';
import { InventoryService, Shape } from './inventory.service';
import { ViewportTransform2D } from './viewport-transform.service';
import { EventBrokerService, EventOrigin } from './event-broker.service';
import { AnalysisValidityService } from '../../features/controls/management/analysis-validity.service';

const enum Failure {
  NONE,
  TENSION,
  COMPRESSION,
}

const FAILURE_COLOR_TRANSFORMS = [
  [1, 0],
  [1, 1],
  [-1, -0.5],
];

@Injectable({ providedIn: 'root' })
export class DesignMemberRenderingService {
  // Member color arrays are indexed by failure type, then material.
  public static readonly NORMAL_COLORS: string[][] = DesignMemberRenderingService.createColors(0, 0);
  public static readonly SELECTED_COLORS: string[][] = DesignMemberRenderingService.createColors(0, 0.9);
  public static readonly HOT_COLORS: string[][] = DesignMemberRenderingService.createColors(0.3, 0);
  public static readonly HOT_SELECTED_COLORS: string[][] = DesignMemberRenderingService.createColors(0.3, 0.9);

  public static readonly INNER_COLORS: string[][] = DesignMemberRenderingService.createInnerColors(0, 0);
  public static readonly SELECTED_INNER_COLORS: string[][] = DesignMemberRenderingService.createInnerColors(0, 0.9);
  public static readonly HOT_INNER_COLORS: string[][] = DesignMemberRenderingService.createInnerColors(0.3, 0);
  // prettier-ignore
  public static readonly HOT_SELECTED_INNER_COLORS: string[][] = DesignMemberRenderingService.createInnerColors(0.3, 0.9);
  public static readonly SLENDERNESS_FAIL_MARK: string = 'magenta';

  public static readonly CENTER_LINE_DASH: number[] = [10, 4, 4, 4];

  private readonly lineWidths: { outer: number; inner: number }[];

  private readonly pointA: Point2D = new Point2D();
  private readonly pointB: Point2D = new Point2D();

  private showMemberNumbers = false;

  constructor(
    private readonly analysisValidityService: AnalysisValidityService,
    inventoryService: InventoryService,
    private readonly viewportTransform: ViewportTransform2D,
    eventBrokerService: EventBrokerService,
  ) {
    const shapeCount = inventoryService.getShapeCount(0);
    this.lineWidths = new Array(shapeCount);
    for (let i = 0; i < shapeCount; ++i) {
      // Using section 0 depends on widths being same for all. Else tables would need to be 2d.
      const outerWidth = DesignMemberRenderingService.getShapeStrokeWidth(inventoryService.getShape(0, i));
      // Make sure of some outer color for thin tubes.
      let innerWidth = 0.6 * outerWidth;
      if (outerWidth - innerWidth < 2) {
        innerWidth = Math.max(1, outerWidth - 2);
      }
      this.lineWidths[i] = { outer: outerWidth, inner: innerWidth };
    }
    eventBrokerService.memberNumbersToggle.subscribe(_info => {
      this.showMemberNumbers = !this.showMemberNumbers;
      eventBrokerService.draftingPanelInvalidation.next({ origin: EventOrigin.SERVICE, data: 'graphic' });
    });
  }

  public static getShapeStrokeWidth(shape: Shape): number {
    return Math.max(shape.width * 0.07, 4); // min to ensure tube always has an inner color.
  }

  /** Create a set of member colors indexed by material with optional intensity and blueness modifications. */
  private static createColors(intensification: number = 0, blueification: number = 0): string[][] {
    // Extra tints correspond to FailureType.
    return FAILURE_COLOR_TRANSFORMS.map(([a, b]) => [
      Graphics.computeColor(96, 96, 96, intensification, a * blueification + b),
      Graphics.computeColor(64, 64, 64, intensification, a * blueification + b),
      Graphics.computeColor(192, 192, 192, intensification, a * blueification + b),
    ]);
  }

  /** Create a set of colors used for the insides of tube cross-sections, indexed by material with optional intensity and blueness modifications. */
  private static createInnerColors(intensification: number = 0, blueification: number = 0): string[][] {
    // Extra tints correspond to FailureType.
    return FAILURE_COLOR_TRANSFORMS.map(([a, b]) => [
      Graphics.computeColor(192, 192, 192, intensification, a * blueification + b),
      Graphics.computeColor(128, 128, 128, intensification, a * blueification + b),
      Graphics.computeColor(224, 224, 224, intensification, a * blueification + b),
    ]);
  }

  // TODO: Factor common functionality of render and renderHot.
  public render(ctx: CanvasRenderingContext2D, member: Member, isSelected: boolean, isMarked: boolean): void {
    let failure = this.getFailure(member);
    const outerColor = this.outerColorsFromSelectionState(isSelected)[failure][member.material.index];
    const innerColor =
      member.shape.section.shortName === 'Tube'
        ? this.innerColorsFromSelectionState(isSelected)[failure][member.shape.section.index]
        : undefined;
    this.renderInWorldCoords(
      ctx,
      member.a,
      member.b,
      member.shape.sizeIndex,
      outerColor,
      innerColor,
      isMarked ? DesignMemberRenderingService.SLENDERNESS_FAIL_MARK : undefined,
      this.showMemberNumbers || isSelected ? member.number : undefined,
    );
  }

  public renderHot(ctx: CanvasRenderingContext2D, member: Member, isSelected: boolean, isMarked: boolean): void {
    let failure = this.getFailure(member);
    const outerColor = this.hotOuterColorsFromSelectionState(isSelected)[failure][member.material.index];
    const innerColor =
      member.shape.section.shortName === 'Tube'
        ? this.hotInnerColorsFromSelectionState(isSelected)[failure][member.shape.section.index]
        : undefined;
    this.renderInWorldCoords(
      ctx,
      member.a,
      member.b,
      member.shape.sizeIndex,
      outerColor,
      innerColor,
      isMarked ? DesignMemberRenderingService.SLENDERNESS_FAIL_MARK : undefined,
      this.showMemberNumbers || isSelected ? member.number : undefined,
    );
  }

  /** Returns the failure status of a given member or NONE if there's no valid analysis no failure occurred. */
  private getFailure(member: Member): Failure {
    if (!this.analysisValidityService.isLastAnalysisValid) {
      return Failure.NONE;
    }
    if (member.tensionForceStrengthRatio > 1) {
      return Failure.TENSION;
    }
    if (member.compressionForceStrengthRatio > 1) {
      return Failure.COMPRESSION;
    }
    return Failure.NONE;
  }

  public clear(ctx: CanvasRenderingContext2D, member: Member): void {
    this.viewportTransform.worldToViewportPoint(this.pointA, member.a);
    this.viewportTransform.worldToViewportPoint(this.pointB, member.b);
    const pad =
      2 *
      Math.max(
        DesignMemberRenderingService.getShapeStrokeWidth(member.shape),
        DesignJointRenderingService.JOINT_RADIUS_VIEWPORT,
      );
    const toClear = Rectangle2D.fromDiagonalPoints(this.pointA, this.pointB).pad(pad, pad);
    ctx.clearRect(toClear.x0, toClear.y0, toClear.width, toClear.height);
  }

  public getMemberWidthWorld(member: Member, minWidthViewport?: number): number {
    let widthViewport: number = this.lineWidths[member.shape.sizeIndex].outer;
    if (minWidthViewport && widthViewport < minWidthViewport) {
      widthViewport = minWidthViewport;
    }
    return this.viewportTransform.viewportToWorldDistance(widthViewport);
  }

  private outerColorsFromSelectionState(isSelected: boolean): string[][] {
    return isSelected ? DesignMemberRenderingService.SELECTED_COLORS : DesignMemberRenderingService.NORMAL_COLORS;
  }

  private hotOuterColorsFromSelectionState(isSelected: boolean): string[][] {
    return isSelected ? DesignMemberRenderingService.HOT_SELECTED_COLORS : DesignMemberRenderingService.HOT_COLORS;
  }

  private innerColorsFromSelectionState(isSelected: boolean): string[][] {
    return isSelected ? DesignMemberRenderingService.SELECTED_INNER_COLORS : DesignMemberRenderingService.INNER_COLORS;
  }

  private hotInnerColorsFromSelectionState(isSelected: boolean): string[][] {
    return isSelected
      ? DesignMemberRenderingService.HOT_SELECTED_INNER_COLORS
      : DesignMemberRenderingService.HOT_INNER_COLORS;
  }

  private renderInWorldCoords(
    ctx: CanvasRenderingContext2D,
    a: Point2DInterface,
    b: Point2DInterface,
    sizeIndex: number,
    color: string,
    innerColor?: string,
    markColor?: string,
    memberNumber?: number,
  ): void {
    this.viewportTransform.worldToViewportPoint(this.pointA, a);
    this.viewportTransform.worldToViewportPoint(this.pointB, b);

    this.renderInViewportCoords(ctx, this.pointA, this.pointB, sizeIndex, color, innerColor, markColor, memberNumber);
  }

  private readonly labelRectangle = Rectangle2D.createEmpty();

  private renderInViewportCoords(
    ctx: CanvasRenderingContext2D,
    a: Point2DInterface,
    b: Point2DInterface,
    sizeIndex: number,
    color: string,
    innerColor?: string,
    markColor?: string,
    memberNumber?: number,
  ): void {
    const savedStrokeStyle = ctx.strokeStyle;
    const savedLineWidth = ctx.lineWidth;
    const savedLineCap = ctx.lineCap;

    ctx.strokeStyle = color;
    const lineWidths = this.lineWidths[sizeIndex];
    ctx.lineWidth = lineWidths.outer;
    ctx.lineCap = 'round';
    ctx.beginPath();
    ctx.moveTo(a.x, a.y);
    ctx.lineTo(b.x, b.y);
    ctx.stroke();
    if (innerColor) {
      ctx.strokeStyle = innerColor;
      ctx.lineWidth = lineWidths.inner;
      ctx.beginPath();
      ctx.moveTo(a.x, a.y);
      ctx.lineTo(b.x, b.y);
      ctx.stroke();
    }
    if (markColor) {
      const savedLineDash = ctx.getLineDash();
      Graphics.setTickLineDash(ctx, Geometry.distance2DPoints(a, b), [2, 10]);
      ctx.strokeStyle = markColor;
      ctx.lineWidth = lineWidths.outer + 4;
      ctx.beginPath();
      ctx.moveTo(a.x, a.y);
      ctx.lineTo(b.x, b.y);
      ctx.stroke();
      ctx.setLineDash(savedLineDash);
    }
    ctx.lineCap = savedLineCap;
    ctx.lineWidth = savedLineWidth;
    ctx.strokeStyle = savedStrokeStyle;

    if (memberNumber) {
      this.renderMemberNumber(ctx, a, b, memberNumber, color);
    }
  }

  private renderMemberNumber(
    ctx: CanvasRenderingContext2D,
    a: Point2DInterface,
    b: Point2DInterface,
    memberNumber: number,
    borderColor: string,
  ) {
    const savedFont = ctx.font;
    const savedTextAlign = ctx.textAlign;
    const savedTextBaseline = ctx.textBaseline;
    const savedFillStyle = ctx.fillStyle;
    const savedStrokeStyle = ctx.strokeStyle;

    const x = (a.x + b.x) * 0.5;
    const y = (a.y + b.y) * 0.5 + 1; // +1 centers on horizontal-ish members.
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.font = '9px';
    const number = memberNumber.toString();
    const metrics = ctx.measureText(number);
    this.labelRectangle.x0 = x - metrics.actualBoundingBoxLeft;
    this.labelRectangle.width = metrics.width;
    this.labelRectangle.y0 = y - metrics.actualBoundingBoxAscent;
    this.labelRectangle.height = metrics.actualBoundingBoxAscent + metrics.actualBoundingBoxDescent;
    this.labelRectangle.pad(2, 2);
    ctx.beginPath();
    ctx.strokeStyle = borderColor;
    ctx.rect(this.labelRectangle.x0, this.labelRectangle.y0, this.labelRectangle.width, this.labelRectangle.height);
    ctx.fillStyle = 'yellow';
    ctx.fill();
    ctx.stroke();
    ctx.fillStyle = 'black';
    ctx.fillText(number, x, y);

    ctx.strokeStyle = savedStrokeStyle;
    ctx.fillStyle = savedFillStyle;
    ctx.textBaseline = savedTextBaseline;
    ctx.textAlign = savedTextAlign;
    ctx.font = savedFont;
  }
}
