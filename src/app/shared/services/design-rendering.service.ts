import { Injectable } from '@angular/core';
import { DesignBridgeRenderingService } from './design-bridge-rendering.service';
import { DesignSiteRenderingService } from './design-site-rendering.service';
import { Graphics } from '../classes/graphics';

@Injectable({ providedIn: 'root' })
export class DesignRenderingService {
  constructor(
    private readonly designBridgeRenderingService: DesignBridgeRenderingService,
    private readonly siteRenderingService: DesignSiteRenderingService,
  ) {}

  public render(ctx: CanvasRenderingContext2D): void {
    Graphics.clearCanvas(ctx);
    this.siteRenderingService.render(ctx);
    this.designBridgeRenderingService.renderDesignBridge(ctx);
  }
}
