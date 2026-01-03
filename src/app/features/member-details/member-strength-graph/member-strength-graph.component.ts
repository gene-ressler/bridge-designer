import {
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  Input,
  OnChanges,
  SimpleChanges,
  ViewChild,
} from '@angular/core';
import { Member } from '../../../shared/classes/member.model';
import { Graphics } from '../../../shared/classes/graphics';
import { InventoryService } from '../../../shared/services/inventory.service';
import { COUNT_FORMATTER, FIXED_FORMATTER } from '../../../shared/classes/utility';
import { AnalysisService, AnalysisStatus } from '../../../shared/services/analysis.service';
import { BridgeService } from '../../../shared/services/bridge.service';

type Geometry = {
  originX: number;
  originY: number;
  xAxisDivisionCount: number;
  xAxisDivisionSize: number;
  xAxisLength: number;
  xLabelY: number;
  xTitleX: number;
  xTitleY: number;
  yAxisDivisionCount: number;
  yAxisDivisionSize: number;
  yAxisLength: number;
  yLabelX: number;
  yTitleX: number;
  yTitleY: number;
};

function lengthToPixel(gmy: Geometry, length: number): number {
  const maxX = gmy.xAxisDivisionCount * gmy.xAxisDivisionSize;
  return gmy.originX + (length / maxX) * gmy.xAxisLength;
}

function strengthToPixel(gmy: Geometry, strength: number): number {
  const maxY = gmy.yAxisDivisionCount * gmy.yAxisDivisionSize;
  return gmy.originY - (strength / maxY) * gmy.yAxisLength;
}

const DYNAMIC_INPUTS = ['member', 'membersPartitionedByStock', 'zoom'];
const GAP = 3;
const MEMBER_TAG_PADDING = 2;
const PADDING_HEIGHT = 4;
const PADDING_WIDTH = 8;
const PALE_BLUE = 'rgb(180,180,255)';
const PALE_RED = 'rgb(255,180,180)';
const TICK_SIZE = 3;
const TITLE_TEXT_X = 'Member length (meters)';
const TITLE_TEXT_Y = 'Strength (kilonewtons)';

@Component({
  selector: 'member-strength-graph',
  imports: [],
  templateUrl: './member-strength-graph.component.html',
  styleUrl: './member-strength-graph.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class MemberStrengthGraphComponet implements OnChanges {
  @Input() width: number = 400;
  @Input() height: number = 400;
  @Input() zoom: boolean = true;
  @Input() membersPartitionedByStock!: Member[][];
  @Input() selectedMembers: Member[] | undefined = [];
  @Input() member: Member | undefined;

  @ViewChild('canvas') canvas!: ElementRef<HTMLCanvasElement>;

  private geometry!: Geometry;

  constructor(
    private readonly analysisService: AnalysisService,
    private readonly bridgeService: BridgeService,
  ) {}

  ngOnChanges(changes: SimpleChanges): void {
    if (this.canvas && DYNAMIC_INPUTS.find(name => changes[name]?.currentValue !== undefined)) {
      this.renderAll();
    }
  }

  private renderAll(): void {
    const ctx = Graphics.getContext(this.canvas);
    Graphics.clearCanvas(ctx);
    const savedFont = ctx.font;

    // Use slightly bigger than default font.
    ctx.font = '12px sans-serif';
    this.geometry = this.getGeometry(ctx);

    // Back to front order.
    this.renderGrid(ctx);
    this.renderCurves(ctx);
    this.renderMemberData(ctx);
    this.renderAxes(ctx);
    this.renderForces(ctx);

    ctx.font = savedFont;
  }

  /** Returns an object describing the layout geometry of the curves widget for current input values. */
  private getGeometry(ctx: CanvasRenderingContext2D): Geometry {
    const yLabelMetrics = ctx.measureText(TITLE_TEXT_Y);
    const fourDigitsMetrics = ctx.measureText('8,888');
    const twoDigitsMetrics = ctx.measureText('88');
    const numberTextHeight = twoDigitsMetrics.actualBoundingBoxAscent + twoDigitsMetrics.actualBoundingBoxDescent;
    const yTitleX = PADDING_WIDTH + yLabelMetrics.actualBoundingBoxDescent;
    const yLabelX = yTitleX + numberTextHeight + GAP + fourDigitsMetrics.width;
    const originX = yLabelX + GAP + TICK_SIZE;
    const xAxisRight = this.width - PADDING_WIDTH - 0.5 * twoDigitsMetrics.width;
    const xAxisLength = xAxisRight - originX;
    const xTitleX = originX + 0.5 * xAxisLength;
    const xLabelMetrics = ctx.measureText(TITLE_TEXT_X);
    const xTitleY = this.height - PADDING_HEIGHT - xLabelMetrics.actualBoundingBoxDescent;
    const xLabelY = xTitleY - xLabelMetrics.actualBoundingBoxAscent - GAP;
    const originY = xLabelY - numberTextHeight - GAP - TICK_SIZE;
    const yAxisTop = PADDING_HEIGHT + MEMBER_TAG_PADDING + numberTextHeight + MEMBER_TAG_PADDING + PADDING_HEIGHT;
    const yAxisLength = originY - yAxisTop;
    const yTitleY = originY - 0.5 * yAxisLength;
    const members = this.zoom && this.selectedMembers ? this.selectedMembers : this.membersPartitionedByStock.flat();
    const maxMemberLength = members.reduce((max, member) => Math.max(max, member.lengthM), 0);
    // Divisions are a multiple of label width.
    const xAxisDivisionSize = getDivisionSize(maxMemberLength, xAxisLength / (3 * twoDigitsMetrics.width));
    const xAxisDivisionCount = Math.ceil(maxMemberLength / xAxisDivisionSize);
    const strength = InventoryService.tensileStrength;
    const maxStrength = members.reduce((max, member) => Math.max(max, strength(member.material, member.shape)), 0);
    // Divisions are a multiple of label height.
    const yAxisDivisionSize = getDivisionSize(maxStrength, yAxisLength / (4 * numberTextHeight));
    const yAxisDivisionCount = Math.ceil(maxStrength / yAxisDivisionSize);
    return {
      originX,
      originY,
      xAxisDivisionCount,
      xAxisDivisionSize,
      xAxisLength,
      xLabelY,
      xTitleX,
      xTitleY,
      yAxisDivisionCount,
      yAxisDivisionSize,
      yAxisLength,
      yLabelX,
      yTitleX,
      yTitleY,
    };
  }

  // Renderers in alpha order.

  /** Renders axes with ticks and labels. */
  private renderAxes(ctx: CanvasRenderingContext2D): void {
    const savedTextAlign = ctx.textAlign;
    const savedTextBaseline = ctx.textBaseline;

    const gmy = this.geometry;

    // Axes and ticks as one path.
    ctx.beginPath();
    // x
    ctx.moveTo(gmy.originX - TICK_SIZE, gmy.originY);
    ctx.lineTo(gmy.originX + gmy.xAxisLength, gmy.originY);
    for (let length = 0, i = 0; i <= gmy.xAxisDivisionCount; ++i, length += gmy.xAxisDivisionSize) {
      const x = lengthToPixel(gmy, length);
      ctx.moveTo(x, gmy.originY + TICK_SIZE);
      ctx.lineTo(x, gmy.originY);
    }
    // y
    ctx.moveTo(gmy.originX, gmy.originY + TICK_SIZE);
    ctx.lineTo(gmy.originX, gmy.originY - gmy.yAxisLength);
    for (let strength = 0, i = 0; i <= gmy.yAxisDivisionCount; ++i, strength += gmy.yAxisDivisionSize) {
      const y = strengthToPixel(gmy, strength);
      ctx.moveTo(gmy.originX - TICK_SIZE, y);
      ctx.lineTo(gmy.originX, y);
    }
    ctx.stroke();

    // Titles.
    ctx.textAlign = 'center';
    fillRotatedText(ctx, TITLE_TEXT_Y, 0.5 * Math.PI, gmy.yTitleX, gmy.yTitleY);
    ctx.fillText(TITLE_TEXT_X, gmy.xTitleX, gmy.xTitleY);

    // Labels.
    for (let length = 0, i = 0; i <= gmy.xAxisDivisionCount; ++i, length += gmy.xAxisDivisionSize) {
      ctx.fillText(FIXED_FORMATTER.format(length), lengthToPixel(gmy, length), gmy.xLabelY);
    }
    ctx.textAlign = 'right';
    ctx.textBaseline = 'middle';
    for (let strength = 0, i = 0; i <= gmy.yAxisDivisionCount; ++i, strength += gmy.yAxisDivisionSize) {
      ctx.fillText(COUNT_FORMATTER.format(strength), gmy.yLabelX, strengthToPixel(gmy, strength));
    }

    ctx.textBaseline = savedTextBaseline;
    ctx.textAlign = savedTextAlign;
  }

  /** Strokes curves for members listed in `this.geometry`. Highlights `this.member`. */
  private renderCurves(ctx: CanvasRenderingContext2D): void {
    const savedStrokeStyle = ctx.strokeStyle;

    const gmy = this.geometry;
    const plotPointCount = 30;
    const members =
      this.zoom && this.selectedMembers
        ? this.selectedMembers
        : this.membersPartitionedByStock.map(partition => partition[0]);

    const dLength = (gmy.xAxisDivisionSize * gmy.xAxisDivisionCount) / plotPointCount;

    // All compression curves in pale red.
    ctx.strokeStyle = PALE_RED;
    ctx.beginPath();
    for (const member of members) {
      addCompressionCurveToPath(member);
    }
    ctx.stroke();

    // All tension curvers in pale blue.
    ctx.strokeStyle = PALE_BLUE;
    ctx.beginPath();
    const x0 = lengthToPixel(gmy, 0);
    const x1 = lengthToPixel(gmy, gmy.xAxisDivisionCount * gmy.xAxisDivisionSize);
    for (const member of members) {
      addTensionCurveToPath(member);
    }
    ctx.stroke();

    // One highlighted curve for chosen member, if any. Overwrites pale drawing.
    if (this.member) {
      ctx.strokeStyle = 'red';
      ctx.beginPath();
      addCompressionCurveToPath(this.member);
      ctx.stroke();
      ctx.strokeStyle = 'blue';
      ctx.beginPath();
      addTensionCurveToPath(this.member);
      ctx.stroke();
    }

    ctx.strokeStyle = savedStrokeStyle;

    function addCompressionCurveToPath(member: Member) {
      const zeroLengthStrength = InventoryService.compressiveStrength(member.material, member.shape, 0);
      ctx.moveTo(lengthToPixel(gmy, 0), strengthToPixel(gmy, zeroLengthStrength));
      for (let length = dLength, i = 0; i < plotPointCount; ++i, length += dLength) {
        const strength = InventoryService.compressiveStrength(member.material, member.shape, length);
        ctx.lineTo(lengthToPixel(gmy, length), strengthToPixel(gmy, strength));
      }
    }

    function addTensionCurveToPath(member: Member) {
      const strength = InventoryService.tensileStrength(member.material, member.shape);
      const y = strengthToPixel(gmy, strength);
      ctx.moveTo(x0, y);
      ctx.lineTo(x1, y);
    }
  }

  /** Renders plot area grid lines. */
  private renderGrid(ctx: CanvasRenderingContext2D): void {
    const gmy = this.geometry;
    const savedLineDash = ctx.getLineDash();

    ctx.setLineDash([1, 4]);
    ctx.beginPath();

    // vertical lines
    const topY = gmy.originY - gmy.yAxisLength;
    for (let length = gmy.xAxisDivisionSize, i = 0; i < gmy.xAxisDivisionCount; ++i, length += gmy.xAxisDivisionSize) {
      const x = lengthToPixel(gmy, length);
      ctx.moveTo(x, gmy.originY);
      ctx.lineTo(x, topY);
    }

    // horizontal lines
    const rightX = gmy.originX + gmy.xAxisLength;
    for (
      let strength = gmy.yAxisDivisionSize, i = 0;
      i < gmy.yAxisDivisionCount;
      ++i, strength += gmy.yAxisDivisionSize
    ) {
      const y = strengthToPixel(gmy, strength);
      ctx.moveTo(gmy.originX, y);
      ctx.lineTo(rightX, y);
    }
    ctx.stroke();

    ctx.setLineDash(savedLineDash);
  }

  /** Renders a "paddle" dennoting information about the current member, if any. */
  private renderMemberData(ctx: CanvasRenderingContext2D): void {
    const savedFillStyle = ctx.fillStyle;
    const savedTextAlign = ctx.textAlign;
    const savedTextBaseline = ctx.textBaseline;

    const member = this.member;
    if (!member) {
      return;
    }
    const gmy = this.geometry;
    const x = lengthToPixel(gmy, member.lengthM);

    // Member tag.
    const memberNumberText = member.number.toString();
    const numberTextMetrics = ctx.measureText(memberNumberText);
    const paddleHeight = numberTextMetrics.actualBoundingBoxAscent + 2 * MEMBER_TAG_PADDING;

    // length vertical
    ctx.fillStyle = 'darkgray';
    fillVerticalRectCentered(ctx, x, PADDING_HEIGHT + paddleHeight, gmy.originY);

    // paddle
    ctx.strokeStyle = 'black';
    ctx.beginPath();
    ctx.rect(
      x - 0.5 * numberTextMetrics.width - MEMBER_TAG_PADDING,
      PADDING_HEIGHT,
      numberTextMetrics.width + 2 * MEMBER_TAG_PADDING,
      paddleHeight,
    );
    ctx.fillStyle = 'yellow';
    ctx.fill();
    ctx.stroke();
    ctx.textAlign = 'center';
    ctx.textBaseline = 'top';
    ctx.fillStyle = 'black';
    ctx.fillText(memberNumberText, x, PADDING_HEIGHT + MEMBER_TAG_PADDING);

    ctx.textBaseline = savedTextBaseline;
    ctx.textAlign = savedTextAlign;
    ctx.fillStyle = savedFillStyle;
  }

  /** Renders force/strength brackets. */
  private renderForces(ctx: CanvasRenderingContext2D): void {
    const analysisService = this.analysisService;
    const analysisStatus = analysisService.status;
    if (analysisStatus === AnalysisStatus.NONE || analysisStatus === AnalysisStatus.UNSTABLE) {
      return;
    }
    if (this.selectedMembers) {
      for (const member of this.selectedMembers) {
        this.renderBracket(ctx, member, false);
      }
    }
    if (this.member) {
      this.renderBracket(ctx, this.member, true);
    }
  }

  private renderBracket(ctx: CanvasRenderingContext2D, member: Member, highlight: boolean): void {
    const savedFillStyle = ctx.fillStyle;

    // Compression and tension force ranges.
    let minCompression, maxCompression, minTension, maxTension;
    const loadCaseCount = this.bridgeService.designConditions.loadedJointCount;
    for (let ilc = 0; ilc < loadCaseCount; ++ilc) {
      let force = this.analysisService.getMemberForce(ilc, member.index);
      if (force < 0) {
        force = -force;
        if (minCompression === undefined || force < minCompression) {
          minCompression = force;
        }
        if (maxCompression === undefined || force > maxCompression) {
          maxCompression = force;
        }
      } else {
        if (minTension === undefined || force < minTension) {
          minTension = force;
        }
        if (maxTension === undefined || force > maxTension) {
          maxTension = force;
        }
      }
    }
    minCompression ||= 0;
    maxCompression ||= 0;
    minTension ||= 0;
    maxTension ||= 0;

    const compressiveStrength = InventoryService.compressiveStrength(member.material, member.shape, member.lengthM);
    const tensileStrength = InventoryService.tensileStrength(member.material, member.shape);

    const gmy = this.geometry;
    const x = lengthToPixel(gmy, member.lengthM);
    const strengthTickWidth = 4;
    const strengthTickHalfHeight = 2;

    ctx.fillStyle = highlight ? 'red' : PALE_RED;
    fillVerticalRectLeft(ctx, x, strengthToPixel(gmy, maxCompression), strengthToPixel(gmy, minCompression));
    const compressiveStrengthY = strengthToPixel(gmy, compressiveStrength);
    fillVerticalRectLeft(
      ctx,
      x,
      compressiveStrengthY - strengthTickHalfHeight,
      compressiveStrengthY + strengthTickHalfHeight,
      strengthTickWidth,
    );

    ctx.fillStyle = highlight ? 'blue' : PALE_BLUE;
    fillVerticalRectRight(ctx, x, strengthToPixel(gmy, maxTension), strengthToPixel(gmy, minTension));
    const tensileStrengthY = strengthToPixel(gmy, tensileStrength);
    fillVerticalRectRight(
      ctx,
      x,
      tensileStrengthY - strengthTickHalfHeight,
      tensileStrengthY + strengthTickHalfHeight,
      strengthTickWidth,
    );

    ctx.fillStyle = savedFillStyle;
  }
}

const MULTIPLIERS = [2, 4, 5, 10];

/**
 * Returns a pleasing size of axis division for range `[0..maxValue]`
 * Tries successive fractions 1/2, 1/4, 1/5, 1/10, 1/20, 1/40, 1/50, 1/100,...
 * of furnished value, rounded up to next power of 10. First fraction yielding at
 * least the desired division count wins. Needs about `4 * log_10(divisionCount)`
 * iterations, so very quick. Typically you'll set
 * `divisionCount = pixelsAvailable / minPixelsBetweenLabels`.
 */
function getDivisionSize(maxValue: number, divisionCount: number): number {
  // Round up to the next power of 10 over max value as initial division size.
  let size = Math.pow(10.0, Math.ceil(Math.log10(maxValue)));
  let newSize = 1.0;
  for (;;) {
    for (const multiplier of MULTIPLIERS) {
      newSize = size / multiplier;
      if (newSize * divisionCount <= maxValue) {
        return newSize;
      }
    }
    size = newSize;
  }
}

/** Fills the furnished text after rotating it about its base position. */
function fillRotatedText(ctx: CanvasRenderingContext2D, text: string, angle: number, x: number, y: number): void {
  const transform = ctx.getTransform();
  ctx.translate(x, y);
  ctx.rotate(angle);
  ctx.fillText(text, 0, 0);
  ctx.setTransform(transform);
}

function fillVerticalRectCentered(
  ctx: CanvasRenderingContext2D,
  x: number,
  y0: number,
  y1: number,
  halfWidth: number = 2,
): void {
  ctx.fillRect(x - halfWidth, y0, 2 * halfWidth, y1 - y0);
}

function fillVerticalRectLeft(
  ctx: CanvasRenderingContext2D,
  x: number,
  y0: number,
  y1: number,
  width: number = 2,
): void {
  ctx.fillRect(x - width, y0 - 1, width, y1 - y0 + 2);
}

function fillVerticalRectRight(
  ctx: CanvasRenderingContext2D,
  x: number,
  y0: number,
  y1: number,
  width: number = 2,
): void {
  ctx.fillRect(x, y0 - 1, width, y1 - y0 + 2);
}
