import { Injectable } from '@angular/core';
import { BridgeService } from '../../shared/services/bridge.service';
import { ViewportTransform2D } from '../../shared/services/viewport-transform.service';
import { DesignGridService } from '../../shared/services/design-grid.service';
import { ImageService, ImagesLoader } from '../../shared/core/image.service';
import { Utility } from '../../shared/classes/utility';
import { EventBrokerService, EventOrigin } from '../../shared/services/event-broker.service';
import { Rectangle2D } from '../../shared/classes/graphics';
import { StandardCursor, WidgetHelper } from '../../shared/classes/widget-helper';

/** Sentinel class allowing a horizontal guide knob to be a hot element. */
export class GuideKnob {
  constructor(public readonly which: 'horizontal' | 'vertical') {}
}

@Injectable({ providedIn: 'root' })
export class GuidesService {
  private static readonly HORIZONTAL_GUIDE_KNOB = 'img/hguideknob.png';
  private static readonly VERTICAL_GUILE_KNOB = 'img/vguideknob.png';
  private static readonly KNOB_THICKNESS = 11;
  private static readonly KNOB_LENGTH = 31;
  private static readonly HOT_VERTICAL_GUIDE = new GuideKnob('vertical');
  private static readonly HOT_HORIZONTAL_GUIDE = new GuideKnob('horizontal');
  private static readonly CURSORS_BY_GUIDE_ORIENTATION = {
    horizontal: StandardCursor.VERTICAL_MOVE,
    vertical: StandardCursor.HORIZONTAL_MOVE,
  };

  private readonly imagesLoader: ImagesLoader;
  private x0World: number = 0;
  private x1World: number = 0;
  private x1Viewport: number = 0;
  private yWorld: number = -100;
  private horizontalGuideKnobRect: Rectangle2D = new Rectangle2D(
    0,
    0,
    GuidesService.KNOB_LENGTH,
    GuidesService.KNOB_THICKNESS,
  );
  private verticalGuideKnobRect: Rectangle2D = new Rectangle2D(
    0,
    0,
    GuidesService.KNOB_THICKNESS,
    GuidesService.KNOB_LENGTH,
  );
  private savedKnobMoveCursor: string = '';
  private isVisible: boolean = false;

  constructor(
    imageService: ImageService,
    private readonly bridgeService: BridgeService,
    private readonly designGridService: DesignGridService,
    private readonly eventBrokerService: EventBrokerService,
    private readonly viewportTransform: ViewportTransform2D,
  ) {
    this.imagesLoader = imageService.createImagesLoader([
      GuidesService.HORIZONTAL_GUIDE_KNOB,
      GuidesService.VERTICAL_GUILE_KNOB,
    ]);
    this.eventBrokerService.draftingPanelInvalidation.subscribe(eventInfo => {
      if (eventInfo.data === 'viewport') {
        this.clampToDesignArea();
      }
    });
    this.eventBrokerService.guidesToggle.subscribe(eventInfo => {
      this.isVisible = eventInfo.data;
      this.eventBrokerService.draftingPanelInvalidation.next({ source: EventOrigin.SERVICE, data: 'graphic' });
    });
  }

  public show(ctx: CanvasRenderingContext2D): GuidesService {
    if (!this.isVisible) {
      return this;
    }
    const savedStrokeStyle = ctx.strokeStyle;

    const xKnob = this.viewportTransform.worldToViewportX(this.x0World);
    const xWire = (this.x1Viewport = this.viewportTransform.worldToViewportX(this.x1World));
    const yKnob = this.viewportTransform.worldToViewportY(this.yWorld);
    ctx.strokeStyle = 'green';
    ctx.beginPath();
    const h = this.viewportTransform.absHeightViewport + 1;
    ctx.moveTo(xKnob, 0);
    ctx.lineTo(xKnob, h);
    ctx.moveTo(xWire, 0);
    ctx.lineTo(xWire, h);
    ctx.moveTo(0, yKnob);
    ctx.lineTo(this.viewportTransform.absWidthViewport + 1, yKnob);
    ctx.stroke();
    this.imagesLoader.invokeAfterLoaded(images => {
      const horzontialKnob = Utility.assertNotUndefined(images.get(GuidesService.HORIZONTAL_GUIDE_KNOB));
      const verticalKnob = Utility.assertNotUndefined(images.get(GuidesService.VERTICAL_GUILE_KNOB));

      const yHorizontalKnob = yKnob - GuidesService.KNOB_THICKNESS * 0.5;
      this.horizontalGuideKnobRect.x0 = 0;
      this.horizontalGuideKnobRect.y0 = yHorizontalKnob;
      ctx.drawImage(horzontialKnob, 0, yHorizontalKnob);

      const xVerticalKnob = xKnob - GuidesService.KNOB_THICKNESS * 0.5;
      const yVerticalKnob = this.viewportTransform.absHeightViewport - GuidesService.KNOB_LENGTH;
      this.verticalGuideKnobRect.x0 = xVerticalKnob;
      this.verticalGuideKnobRect.y0 = yVerticalKnob;
      ctx.drawImage(verticalKnob, xVerticalKnob, yVerticalKnob);
    });

    ctx.strokeStyle = savedStrokeStyle;
    return this;
  }

  public clear(ctx: CanvasRenderingContext2D): GuidesService {
    ctx.clearRect(
      0,
      this.horizontalGuideKnobRect.y0,
      this.viewportTransform.absWidthViewport + 1,
      this.horizontalGuideKnobRect.height,
    );
    ctx.clearRect(
      this.verticalGuideKnobRect.x0,
      0,
      this.verticalGuideKnobRect.width,
      this.viewportTransform.absHeightViewport + 1,
    );
    ctx.clearRect(this.x1Viewport - 1, 0, 3, this.viewportTransform.absHeightViewport + 1);
    return this;
  }

  /** Locates the guide using given knob and viewport coordinate, snapped to nearest valid position. */
  public move(ctx: CanvasRenderingContext2D, guideKnob: GuideKnob, x: number, y: number) {
    this.clear(ctx).locate(guideKnob, x, y).show(ctx);
  }

  /** For the given viewport coordinate, returns the knob that's hot, if any. */
  public getHotGuideKnob(x: number, y: number): GuideKnob | undefined {
    if (this.horizontalGuideKnobRect.contains(x, y)) {
      return GuidesService.HOT_HORIZONTAL_GUIDE;
    }
    if (this.verticalGuideKnobRect.contains(x, y)) {
      return GuidesService.HOT_VERTICAL_GUIDE;
    }
    return undefined;
  }

  public setKnobMoveCursor(ctx: CanvasRenderingContext2D, knob: GuideKnob): void {
    this.savedKnobMoveCursor = WidgetHelper.getPointerCursor(ctx);
    WidgetHelper.setPointerCursor(ctx, GuidesService.CURSORS_BY_GUIDE_ORIENTATION[knob.which]);
  }

  public resetKnobMoveCursor(ctx: CanvasRenderingContext2D): void {
    WidgetHelper.setPointerCursor(ctx, this.savedKnobMoveCursor);
  }

  private locate(guideKnob: GuideKnob, x: number, y: number): GuidesService {
    switch (guideKnob.which) {
      case 'horizontal':
        this.locateHorizontalGuideWorld(this.viewportTransform.viewportToworldY(y));
        break;
      case 'vertical':
        this.locateVerticalGuideWorld(this.viewportTransform.viewportToworldX(x));
        break;
    }
    return this;
  }

  private locateHorizontalGuideWorld(y: number): void {
    const conditions = this.bridgeService.designConditions;
    const grid = this.designGridService.grid;
    const yWorldRaw = Utility.clamp(y, -conditions.underClearance, conditions.overClearance);
    this.yWorld = grid.xformGridToWorld(grid.xformWorldToGrid(yWorldRaw));
  }

  private locateVerticalGuideWorld(x: number): void {
    const conditions = this.bridgeService.designConditions;
    const grid = this.designGridService.grid;
    const x0WorldMax = grid.xformGridToWorld(Math.trunc(grid.xformWorldToGrid(conditions.xRightmostDeckJoint) / 2));
    const x0WorldRaw = Utility.clamp(x, conditions.xLeftmostDeckJoint, x0WorldMax);
    const x1WorldRaw = conditions.xRightmostDeckJoint - (x0WorldRaw - conditions.xLeftmostDeckJoint);
    this.x0World = grid.xformGridToWorld(grid.xformWorldToGrid(x0WorldRaw));
    this.x1World = grid.xformGridToWorld(grid.xformWorldToGrid(x1WorldRaw));
  }

  private clampToDesignArea(): void {
    const conditions = this.bridgeService.designConditions;
    if (this.x0World < conditions.xLeftmostDeckJoint) {
      this.locateVerticalGuideWorld(conditions.xLeftmostDeckJoint);
    } else if (this.x1World > conditions.xRightmostDeckJoint) {
      this.locateVerticalGuideWorld(conditions.xRightmostDeckJoint);
    }
    if (this.yWorld < -conditions.underClearance) {
      this.locateHorizontalGuideWorld(-conditions.underClearance);
    } else if (this.yWorld > conditions.overClearance) {
      this.locateHorizontalGuideWorld(conditions.overClearance);
    }
    this.locateVerticalGuideWorld(this.x0World); // Ensure x1World is valid.
  }
}
