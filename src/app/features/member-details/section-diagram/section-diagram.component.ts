import { ChangeDetectionStrategy, Component, ElementRef, Input, ViewChild } from '@angular/core';
import { Member } from '../../../shared/classes/member.model';
import { Graphics, Rectangle2D, Rectangle2DInterface } from '../../../shared/classes/graphics';

@Component({
  selector: 'section-diagram',
  imports: [],
  templateUrl: './section-diagram.component.html',
  styleUrl: './section-diagram.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SectionDiagramComponent {
  @Input() width: number = 100;
  @Input() height: number = 100;

  private _member: Member | undefined;

  @ViewChild('canvas') canvas!: ElementRef<HTMLCanvasElement>;

  @Input() set member(value: Member | undefined) {
    this._member = value;
    if (this.canvas) {
      this.render(Graphics.getContext(this.canvas));
    }
  }
  get member(): Member | undefined {
    return this._member;
  }

  private render(ctx: CanvasRenderingContext2D): void {
    Graphics.clearCanvas(ctx);
    if (!this._member) {
      return;
    }
    const savedlineWidth = ctx.lineWidth;
    const savedStrokeStyle = ctx.strokeStyle;
    const savedFillStyle = ctx.fillStyle;
    const savedTextAlign = ctx.textAlign;
    const savedTextBaseline = ctx.textBaseline;

    // Geometry
    const padding = 8;
    const gap = 4;
    const sectionName = this._member.shape.section.shortName;
    const textMetrics = ctx.measureText('500'); // largest possible so cartoon doesn't jump

    const insetX = padding + textMetrics.width + gap;
    const maxSectionWidth = this.width - 2 * insetX;
    const maxSectionHeight = this.height - 2 * padding - textMetrics.fontBoundingBoxAscent - gap;
    const sectionSize = Math.min(maxSectionWidth, maxSectionHeight);
    const lineWidth =
      sectionName === 'Tube' ? sectionSize * (this._member.shape.thickness / this._member.materialSizeMm) : 1;
    // Outer edge location.
    const sectionX = 0.5 * (this.width - sectionSize);
    const sectionY = 0.5 *(this.height - sectionSize - gap - textMetrics.actualBoundingBoxAscent);
    ctx.lineWidth = lineWidth;
    ctx.strokeStyle = ctx.fillStyle = 'darkgray';

    // Cross-section cartoon.
    ctx.beginPath();
    Graphics.drawRoundRect(
      ctx,
      sectionX + 0.5 * lineWidth,
      sectionY + 0.5 * lineWidth,
      sectionSize - lineWidth,
      sectionSize - lineWidth,
      4,
    );
    if (sectionName === 'Tube') {
      ctx.stroke();
    } else {
      ctx.fill();
    }

    // Dimension lines.
    ctx.lineWidth = 1;
    ctx.strokeStyle = ctx.fillStyle = 'black';
    const leftDimX = sectionX - 2 * gap;
    const arrowHalfWidth = 2;
    const arrowLength = 7;
    Graphics.drawDoubleArrow(ctx, leftDimX, sectionY, leftDimX, sectionY + sectionSize, arrowHalfWidth, arrowLength);
    const bottomDimY = sectionY + sectionSize + 2 * gap;
    Graphics.drawDoubleArrow(ctx, sectionX, bottomDimY, sectionX + sectionSize, bottomDimY, arrowHalfWidth, arrowLength);

    // Outer dimensions.
    ctx.textAlign = 'center';
    ctx.textBaseline = 'top';
    const sizeText = this._member.materialSizeMm.toString();
    const midSectionY = sectionY + 0.5 * sectionSize;
    clearThenFillText(ctx, sizeText, sectionX + 0.5 * sectionSize, sectionY + sectionSize + gap);
    ctx.textAlign = 'right';
    ctx.textBaseline = 'middle';
    clearThenFillText(ctx, sizeText, sectionX - gap, midSectionY);

    // Thickness dimension.
    if (sectionName === 'Tube') {
      const thicknessText = this._member.shape.thickness.toString();
      ctx.textAlign = 'left';
      const rect = Rectangle2D.createEmpty();
      const outerX = sectionX + sectionSize;
      clearThenFillText(ctx, thicknessText, outerX + arrowLength + 2, midSectionY, rect);
      const arrowShaftLength = 12;
      const dimY = rect.y0 + rect.height + 1;
      Graphics.drawArrow(ctx, outerX + arrowShaftLength, dimY, outerX, dimY, arrowHalfWidth, arrowLength);
      const innerX = sectionX + sectionSize - lineWidth;
      Graphics.drawArrow(ctx, innerX - arrowShaftLength, dimY, innerX, dimY, arrowHalfWidth, arrowLength);
    }

    ctx.textBaseline = savedTextBaseline;
    ctx.textAlign = savedTextAlign;
    ctx.fillStyle = savedFillStyle;
    ctx.strokeStyle = savedStrokeStyle;
    ctx.lineWidth = savedlineWidth;

    function clearThenFillText(
      ctx: CanvasRenderingContext2D,
      text: string,
      x: number,
      y: number,
      rect?: Rectangle2DInterface,
    ): void {
      Graphics.clearTextBox(ctx, text, x, y, rect);
      ctx.fillText(text, x, y);
    }
  }
}
