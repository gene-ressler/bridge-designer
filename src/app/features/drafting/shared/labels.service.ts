import { Injectable } from '@angular/core';
import { BridgeService } from '../../../shared/services/bridge.service';
import { ViewportTransform2D } from '../../../shared/services/viewport-transform.service';
import { Graphics, Rectangle2D } from '../../../shared/classes/graphics';
import { SiteConstants } from '../../../shared/classes/site.model';
import { StandardCursor } from '../../../shared/classes/widget-helper';
import { DraggableService } from './hot-element-drag.service';
import { Utility } from '../../../shared/classes/utility';
import { UndoManagerService } from './undo-manager.service';
import { MoveLabelsCommand } from '../../controls/edit-command/move-labels.command';

/** Token used when labels are hot draggable elements. See hot-element.service. */
export class Labels {
  constructor(public readonly draggableService: DraggableService) {}
}

@Injectable({ providedIn: 'root' })
export class LabelsService implements DraggableService {
  public static readonly MOVE_CURSOR = StandardCursor.VERTICAL_MOVE;
  private static readonly BEAM_LABEL_TEXT = 'Floor beam';
  private static readonly DECK_LABEL_TEXT = 'Concrete deck';
  private static readonly ROAD_LABEL_TEXT = 'Asphalt road surface';
  private static readonly X_INTER_LABEL_GAP = 100;
  private static readonly X_LABEL_LEADING = 16;
  private static readonly X_LABEL_OFFSET = 32;

  private readonly labels = new Labels(this);
  /** Extent of just the label text. The draggable area. */
  private readonly labelsTextExtent = Rectangle2D.createEmpty();
  /** Extent of labels and arrows to respective graphics. The area to clear for erasure. */
  private readonly extent = Rectangle2D.createEmpty();
  private _yLabelsStart: number = NaN;

  constructor(
    private readonly bridgeService: BridgeService,
    private readonly undoManagerService: UndoManagerService,
    private readonly viewportTransform: ViewportTransform2D,
  ) {}

  public get yLabelStart(): number {
    return this._yLabelsStart;
  }

  public render(ctx: CanvasRenderingContext2D): LabelsService {
    const savedTextBaseline = ctx.textBaseline;

    const conditions = this.bridgeService.designConditions;

    ctx.textBaseline = 'middle';
    const beamLabelMetrics = ctx.measureText(LabelsService.BEAM_LABEL_TEXT);
    const deckLabelMetrics = ctx.measureText(LabelsService.DECK_LABEL_TEXT);
    const roadLabelMetrics = ctx.measureText(LabelsService.ROAD_LABEL_TEXT);

    // Slab geometry calclulations matching design-site-rendering.service.
    const ySlabTop = this.viewportTransform.worldToViewportY(SiteConstants.WEAR_SURFACE_HEIGHT);
    const ySlabBottom = this.viewportTransform.worldToViewportY(
      SiteConstants.WEAR_SURFACE_HEIGHT - conditions.deckThickness,
    );
    const yBeamTop = 2 + ySlabBottom;
    const yText = this.viewportTransform.worldToViewportY(this.bridgeService.draftingPanelState.yLabels);
    const xAnchorBase = this.viewportTransform.worldToViewportX(conditions.prescribedJoints[1].x);
    let xAnchor = xAnchorBase;

    this.drawLabel(ctx, LabelsService.BEAM_LABEL_TEXT, xAnchor, yBeamTop, yText);

    xAnchor += beamLabelMetrics.width + LabelsService.X_INTER_LABEL_GAP;
    this.drawLabel(ctx, LabelsService.DECK_LABEL_TEXT, xAnchor, 0.5 * (ySlabBottom + ySlabTop), yText);

    xAnchor += deckLabelMetrics.width + LabelsService.X_INTER_LABEL_GAP;
    this.drawLabel(ctx, LabelsService.ROAD_LABEL_TEXT, xAnchor, ySlabTop, yText);

    this.labelsTextExtent.x0 = xAnchorBase + LabelsService.X_LABEL_OFFSET + LabelsService.X_LABEL_LEADING;
    this.labelsTextExtent.y0 = yText - beamLabelMetrics.actualBoundingBoxAscent;
    this.labelsTextExtent.width =
      2 * LabelsService.X_INTER_LABEL_GAP + beamLabelMetrics.width + deckLabelMetrics.width + roadLabelMetrics.width;
    this.labelsTextExtent.height = beamLabelMetrics.actualBoundingBoxAscent + beamLabelMetrics.actualBoundingBoxDescent;
    this.labelsTextExtent.pad(4, 6); // For usability.

    this.extent.makeEmpty();
    this.extent.include(xAnchorBase, yBeamTop);
    this.extent.include(this.labelsTextExtent.x1, this.labelsTextExtent.y0);
    this.extent.include(this.labelsTextExtent.x1, this.labelsTextExtent.y1);
    this.extent.pad(Graphics.ARROW_HALF_WIDTH, 2);

    ctx.textBaseline = savedTextBaseline;
    return this;
  }

  public clear(ctx: CanvasRenderingContext2D, end?: boolean): LabelsService {
    ctx.clearRect(this.extent.x0, this.extent.y0, this.extent.width, this.extent.height);
    this.extent.makeEmpty();
    if (end) {
      this.endDrag();
    }
    return this;
  }

  /** Erases, relocates, and re-draws */
  public move(ctx: CanvasRenderingContext2D, _draggable: any, _x: number, y: number, start: boolean): void {
    if (start) {
      this.startDrag();
    }
    this.clear(ctx).locate(y).render(ctx);
  }

  /** Returns canonical labels token if the given coordinate is hot, else undefined. */
  public getHotLabels(x: number, y: number): Labels | undefined {
    return this.labelsTextExtent.contains(x, y) ? this.labels : undefined;
  }

  /** Locates the labels at a new, valid viewport postion.  But doesn't render. */
  private locate(y: number): LabelsService {
    const conditions = this.bridgeService.designConditions;
    const yMin = this.viewportTransform.worldToViewportY(conditions.overClearance);
    const yMax = this.viewportTransform.worldToViewportY(-conditions.underClearance);
    this.bridgeService.draftingPanelState.yLabels = this.viewportTransform.viewportToworldY(
      Utility.clamp(y, yMin, yMax),
    );
    return this;
  }

  /** Render a label with pointer at given location given in viewport coordinates. */
  private drawLabel(ctx: CanvasRenderingContext2D, text: string, xAnchor: number, yAnchor: number, yText: number) {
    Graphics.drawArrow(ctx, xAnchor + LabelsService.X_LABEL_OFFSET, yText, xAnchor, yAnchor);
    const xText = LabelsService.X_LABEL_OFFSET + LabelsService.X_LABEL_LEADING + xAnchor;
    ctx.beginPath();
    ctx.moveTo(xAnchor + LabelsService.X_LABEL_OFFSET, yText);
    ctx.lineTo(xText - 2, yText);
    ctx.stroke();
    ctx.fillText(text, xText, yText);
  }

  /** Starts the drag by recording the location of the labels. */
  private startDrag(): void {
    this._yLabelsStart = this.bridgeService.draftingPanelState.yLabels;
  }

  /** Ends the drag by executing a move labels command in the undo manager.  */
  private endDrag(): void {
    const draftingPanelState = this.bridgeService.draftingPanelState;
    const moveLabelsCommand = new MoveLabelsCommand(
      draftingPanelState, this.yLabelStart, this.bridgeService.draftingPanelState.yLabels,
    );
    this.undoManagerService.do(moveLabelsCommand);
    this._yLabelsStart = NaN;
  }
}
