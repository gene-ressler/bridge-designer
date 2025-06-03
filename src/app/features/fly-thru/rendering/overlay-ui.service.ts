import { Injectable } from '@angular/core';
import { Overlay, OverlaysByUrl } from './overlay-rendering.service';
import { Geometry } from '../../../shared/classes/graphics';

export interface OverlayHandlers {
  handlePointerDown?: () => void;
  handlePointerDrag?: (dx: number, dy: number) => void;
}

export type OverlayHandlersByUrl = { [url: string]: OverlayHandlers };

/** Manages hot element and click-drag behavior of overlays. */
@Injectable({ providedIn: 'root' })
export class OverlayUiService {
  private static readonly DIM_ALPHA = 0.3;

  private readonly overlaysByUrl: OverlaysByUrl = {};
  private activeOverlay: Overlay | undefined;
  private isPointerDown: boolean = false;
  private xBase: number = 0;
  private yBase: number = 0;

  constructor() {}

  public registerOverlays(overlaysByUrl: OverlaysByUrl) {
    for (const overlay of Object.values(overlaysByUrl)) {
      overlay.alpha = OverlayUiService.DIM_ALPHA;
    }
    Object.assign(this.overlaysByUrl, overlaysByUrl);
  }

  public handlePointerDown(x: number, y: number): void {
    const overlay = this.find(x, y);
    if (overlay) {
      this.activeOverlay = overlay;
      this.isPointerDown = true;
      this.activeOverlay.alpha = 1;
      this.xBase = x;
      this.yBase = y;
      overlay.handlePointerDown?.();
    }
  }

  public handlePointerMove(x: number, y: number): void {
    if (this.isPointerDown) {
      this.activeOverlay?.handlePointerDrag?.(x - this.xBase, this.yBase - y);
      return;
    }
    const foundOverlay = this.find(x, y);
    // Turn down any previously active overlay, then turn up any new one.
    if (this.activeOverlay) {
      this.activeOverlay.alpha = OverlayUiService.DIM_ALPHA;
    }
    if (foundOverlay) {
      foundOverlay.alpha = 1;
    }
    this.activeOverlay = foundOverlay;
  }

  public handlePointerUp(x: number, y:number): void {
    if (this.isPointerDown) {
      this.activeOverlay?.handlePointerDrag?.(0, 0);
      this.isPointerDown = false;
      this.handlePointerMove(x, y);
    }
  }

  private find(x: number, y: number): Overlay | undefined {
    return Object.values(this.overlaysByUrl).find(overlay => Geometry.isPointInCanonicalRectangle(x, y, overlay));
  }
}
