import { Injectable } from '@angular/core';
import { Graphics, Point2D, Point2DInterface, Rectangle2D } from '../classes/graphics';
import { Member } from '../classes/member.model';
import { DesignJointRenderingService } from './design-joint-rendering.service';
import { InventoryService, Shape } from './inventory.service';
import { ViewportTransform2D } from './viewport-transform.service';
import { EventBrokerService, EventOrigin } from './event-broker.service';

@Injectable({ providedIn: 'root' })
export class DesignMemberRenderingService {
  // Member color arrays are indexed by material.
  public static readonly NORMAL_COLORS: string[] = DesignMemberRenderingService.createColors(0, 0);
  public static readonly SELECTED_COLORS: string[] = DesignMemberRenderingService.createColors(0, 0.9);
  public static readonly HOT_COLORS: string[] = DesignMemberRenderingService.createColors(0.3, 0);
  public static readonly HOT_SELECTED_COLORS: string[] = DesignMemberRenderingService.createColors(0.3, 0.9);

  public static readonly INNER_COLORS: string[] = DesignMemberRenderingService.createInnerColors(0, 0);
  public static readonly SELECTED_INNER_COLORS: string[] = DesignMemberRenderingService.createInnerColors(0, 0.9);
  public static readonly HOT_INNER_COLORS: string[] = DesignMemberRenderingService.createInnerColors(0.3, 0);
  public static readonly HOT_SELECTED_INNER_COLORS: string[] = DesignMemberRenderingService.createInnerColors(0.3, 0.9);

  public static readonly CENTER_LINE_DASH: number[] = [10, 4, 4, 4];

  private readonly lineWidths: { outer: number; inner: number }[];

  private readonly pointA: Point2D = new Point2D();
  private readonly pointB: Point2D = new Point2D();

  private showMemberNumbers = false;

  constructor(
    inventoryService: InventoryService,
    private readonly viewportTransform: ViewportTransform2D,
    eventBrokerService: EventBrokerService,
  ) {
    const shapeCount = inventoryService.getShapeCount(0);
    this.lineWidths = new Array(shapeCount);
    for (var i = 0; i < shapeCount; ++i) {
      // Using section 0 depends on widths being same for all. Else tables would need to be 2d.
      const outerWidth = DesignMemberRenderingService.getShapeStrokeWidth(inventoryService.getShape(0, i));
      // Make sure of some outer color for thin tubes.
      var innerWidth = 0.6 * outerWidth;
      if (outerWidth - innerWidth < 2) {
        innerWidth = Math.max(1, outerWidth - 2);
      }
      this.lineWidths[i] = { outer: outerWidth, inner: innerWidth };
    }
    eventBrokerService.memberNumbersToggle.subscribe(_info => {
      this.showMemberNumbers = !this.showMemberNumbers;
      eventBrokerService.draftingPanelInvalidation.next({ source: EventOrigin.SERVICE });
    });
  }

  public static getShapeStrokeWidth(shape: Shape): number {
    return Math.max(shape.width * 0.07, 4); // min to ensure tube always has an inner color.
  }

  /** Create a set of member colors indexed by material with optional intensity and blueness modifications. */
  private static createColors(intensification: number = 0, blueification: number = 0): string[] {
    return [
      Graphics.computeColor(128, 128, 128, intensification, blueification),
      Graphics.computeColor(64, 64, 64, intensification, blueification),
      Graphics.computeColor(192, 192, 192, intensification, blueification),
    ];
  }

  /** Create a set of colors used for the insides of tube cross-sections, indexed by material with optional intensity and blueness modifications. */
  private static createInnerColors(intensification: number = 0, blueification: number = 0): string[] {
    return [
      Graphics.computeColor(192, 192, 192, intensification, blueification),
      Graphics.computeColor(128, 128, 128, intensification, blueification),
      Graphics.computeColor(224, 224, 224, intensification, blueification),
    ];
  }

  // TODO: Factor common functionality of render and renderHot.
  public render(ctx: CanvasRenderingContext2D, member: Member, isSelected: boolean = false): void {
    const outerColor = this.outerColorsFromSelectionState(isSelected)[member.material.index];
    const innerColor =
      member.shape.section.shortName === 'Tube'
        ? this.innerColorsFromSelectionState(isSelected)[member.shape.section.index]
        : undefined;
    this.renderInWorldCoords(
      ctx,
      member.a,
      member.b,
      member.shape.sizeIndex,
      outerColor,
      innerColor,
      undefined,
      this.showMemberNumbers || isSelected ? member.number : undefined,
    );
  }

  public renderHot(ctx: CanvasRenderingContext2D, member: Member, isSelected: boolean = false): void {
    const outerColor = this.hotOuterColorsFromSelectionState(isSelected)[member.material.index];
    const innerColor =
      member.shape.section.shortName === 'Tube'
        ? this.hotInnerColorsFromSelectionState(isSelected)[member.shape.section.index]
        : undefined;
    this.renderInWorldCoords(
      ctx,
      member.a,
      member.b,
      member.shape.sizeIndex,
      outerColor,
      innerColor,
      undefined,
      this.showMemberNumbers || isSelected ? member.number : undefined,
    );
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
    var widthViewport: number = this.lineWidths[member.shape.sizeIndex].outer;
    if (minWidthViewport && widthViewport < minWidthViewport) {
      widthViewport = minWidthViewport;
    }
    return this.viewportTransform.viewportToWorldDistance(widthViewport);
  }

  private outerColorsFromSelectionState(isSelected: boolean): string[] {
    return isSelected ? DesignMemberRenderingService.SELECTED_COLORS : DesignMemberRenderingService.NORMAL_COLORS;
  }

  private hotOuterColorsFromSelectionState(isSelected: boolean): string[] {
    return isSelected ? DesignMemberRenderingService.HOT_SELECTED_COLORS : DesignMemberRenderingService.HOT_COLORS;
  }

  private innerColorsFromSelectionState(isSelected: boolean): string[] {
    return isSelected ? DesignMemberRenderingService.SELECTED_INNER_COLORS : DesignMemberRenderingService.INNER_COLORS;
  }

  private hotInnerColorsFromSelectionState(isSelected: boolean): string[] {
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
      ctx.strokeStyle = markColor || ''; // TODO: Dummy use. Implement for real.
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

    const x = (a.x + b.x) * 0.5;
    const y = (a.y + b.y) * 0.5;
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

    ctx.fillStyle = savedFillStyle;
    ctx.textBaseline = savedTextBaseline;
    ctx.textAlign = savedTextAlign;
    ctx.font = savedFont;
  }
}
