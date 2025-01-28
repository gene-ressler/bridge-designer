import { AfterViewInit, ChangeDetectionStrategy, Component, ElementRef, HostBinding, Input, ViewChild } from '@angular/core';
import { ViewportTransform2D } from '../../../shared/services/viewport-transform.service';
import { CommonModule } from '@angular/common';
import { Graphics } from '../../../shared/classes/graphics';
import { BridgeService } from '../../../shared/services/bridge.service';
import { DesignGridDensity, DesignGridService } from '../../../shared/services/design-grid.service';
import { EventBrokerService } from '../../../shared/services/event-broker.service';

@Component({
  selector: 'ruler',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './ruler.component.html',
  styleUrl: './ruler.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class RulerComponent implements AfterViewInit {
  readonly thickness = 30;
  readonly screenWidth = screen.availWidth;
  readonly screenHeight = screen.availHeight;

  @Input({ required: true }) position!: 'bottom' | 'left';
  @ViewChild('ruler') ruler!: ElementRef<HTMLCanvasElement>;
  @HostBinding('style.display') display: string = 'block';

  constructor(
    private readonly bridgeService: BridgeService,
    private readonly designGridService: DesignGridService,
    private readonly eventBrokerService: EventBrokerService,
    private readonly viewportTransform: ViewportTransform2D,
  ) {}

  public set visible(value: boolean) {
    this.display = value ? 'block' : 'none';
  }

  private get ctx(): CanvasRenderingContext2D {
    return Graphics.getContext(this.ruler);
  }

  private render(ctx: CanvasRenderingContext2D): void {
    const savedFont = ctx.font;
    const savedTextAlign = ctx.textAlign;
    const savedTextBaseline = ctx.textBaseline;

    ctx.clearRect(0, 0, ctx.canvas.width, ctx.canvas.height);
    if (this.position === 'bottom') {
      this.renderBottomRuler(ctx);
    } else {
      this.renderLeftRuler(ctx);
    }

    ctx.textBaseline = savedTextBaseline;
    ctx.textAlign = savedTextAlign;
    ctx.font = savedFont;
  }

  private renderBottomRuler(ctx: CanvasRenderingContext2D) {
    const grid = this.designGridService.grid;
    const extent = this.bridgeService.siteInfo.spanExtent;
    const startGrid = grid.xformWorldToGrid(extent.x0);
    const endGrid = grid.xformWorldToGrid(extent.x1);
    const gridIncrement = grid.snapMultiple;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'top';
    for (let xGrid: number = startGrid; xGrid <= endGrid; xGrid += gridIncrement) {
      this.renderTopTick(ctx, xGrid);
    }
  }

  private renderLeftRuler(ctx: CanvasRenderingContext2D) {
    const grid = this.designGridService.grid;
    const extent = this.bridgeService.siteInfo.spanExtent;
    const startGrid = grid.xformWorldToGrid(extent.y0);
    const endGrid = grid.xformWorldToGrid(extent.y1);
    const gridIncrement = grid.snapMultiple;
    ctx.textAlign = 'right';
    ctx.textBaseline = 'middle';
    for (let yGrid: number = startGrid; yGrid <= endGrid; yGrid += gridIncrement) {
      this.renderRightTick(ctx, yGrid);
    }
  }

  private getTickSize(density: number): number {
    return [8, 6, 3][density] || 0;
  }

  private renderTopTick(ctx: CanvasRenderingContext2D, xGrid: number) {
    const density = DesignGridService.getDensityOfGrid(xGrid);
    const xWorld = this.designGridService.grid.xformGridToWorld(xGrid);
    const xViewport = this.viewportTransform.worldToViewportX(xWorld);
    const yTick = this.getTickSize(density);
    ctx.beginPath();
    ctx.moveTo(xViewport, 0);
    ctx.lineTo(xViewport, yTick);
    ctx.stroke();
    if (density === DesignGridDensity.COARSE) {
      ctx.fillText(xWorld.toFixed(), xViewport, yTick + 2);
    }
  }

  private renderRightTick(ctx: CanvasRenderingContext2D, yGrid: number) {
    const density = DesignGridService.getDensityOfGrid(yGrid);
    const yWorld = this.designGridService.grid.xformGridToWorld(yGrid);
    const yViewport = this.viewportTransform.worldToViewportY(yWorld);
    const xTick = this.thickness - this.getTickSize(density);
    ctx.beginPath();
    ctx.moveTo(this.thickness, yViewport);
    ctx.lineTo(xTick, yViewport);
    ctx.stroke();
    if (density === DesignGridDensity.COARSE) {
      ctx.fillText(yWorld.toFixed(), xTick - 2, yViewport);
    }
  }

  ngAfterViewInit(): void {
    this.render(this.ctx);
    this.eventBrokerService.draftingPanelInvalidation.subscribe(info => {
      if (info.data === 'viewport') {
        // Skip graphic-only invalidations.
        this.render(this.ctx);
      }
    });
    this.eventBrokerService.gridDensityChange.subscribe(() => this.render(this.ctx));
  }
}
