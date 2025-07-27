import { Injectable } from '@angular/core';
import { Overlay, OverlayDescriptor, OverlayService, OverlayUi } from './overlay.service';
import { EventBrokerService } from '../../../shared/services/event-broker.service';
import { ViewService } from './view.service';

/** Icons in overlay texture array image 'img/overlay.png', top to bottom. The enum numeric value matters. */
export enum OverlayIcon {
  HAND,
  HEAD,
  HOME,
  PAUSE,
  PLAY,
  REPLAY,
  SETTINGS,
  TRUCK,
  WALK,
}

/** Bottom to top order, as y9's are negative offsets from screen bottom. */
enum Order {
  SETTINGS,
  PAUSE_PLAY_REPLAY,
  TRUCK,
  HOME,
  HEAD,
  HAND,
  WALK,
}

const X0 = 150;
const Y0 = -100;
const DY = -64;
const WIDTH = 48;
const HEIGHT = 48;
const DIM_ALPHA = 0.2;
const FLY_THRU_OVERLAY_DESCRIPTOR: OverlayDescriptor = {
  imageArrayUrl: 'img/overlay.png',
  icons: [
    {
      x0: X0,
      y0: Y0 + DY * Order.HAND,
      width: WIDTH,
      height: HEIGHT,
      initialAlpha: DIM_ALPHA,
    },
    {
      x0: X0,
      y0: Y0 + DY * Order.HEAD,
      width: WIDTH,
      height: HEIGHT,
      initialAlpha: DIM_ALPHA,
    },
    {
      x0: X0,
      y0: Y0 + DY * Order.HOME,
      width: WIDTH,
      height: HEIGHT,
      initialAlpha: DIM_ALPHA,
    },
    {
      x0: X0,
      y0: Y0 + DY * Order.PAUSE_PLAY_REPLAY,
      width: WIDTH,
      height: HEIGHT,
      initialAlpha: DIM_ALPHA,
    },
    {
      x0: X0,
      y0: Y0 + DY * Order.PAUSE_PLAY_REPLAY,
      width: WIDTH,
      height: HEIGHT,
      initialAlpha: 0,
    },
    {
      x0: X0,
      y0: Y0 + DY * Order.PAUSE_PLAY_REPLAY,
      width: WIDTH,
      height: HEIGHT,
      initialAlpha: 0,
    },
    {
      x0: X0,
      y0: Y0 + DY * Order.SETTINGS,
      width: WIDTH,
      height: HEIGHT,
      initialAlpha: DIM_ALPHA,
    },
    {
      x0: X0,
      y0: Y0 + DY * Order.TRUCK,
      width: WIDTH,
      height: HEIGHT,
      initialAlpha: DIM_ALPHA,
    },
    {
      x0: X0,
      y0: Y0 + DY * Order.WALK,
      width: WIDTH,
      height: HEIGHT,
      initialAlpha: DIM_ALPHA,
    },
  ],
};

/**
 * Injectable container for the animation controls overlay of the fly-thru animation.
 *
 * It's set up and used in at least three other services.
 * - FlyThruPane provides pointer events.
 * - ViewService provides the UI handlers.
 * - RenderService prepares and renders the overlay.
 */
@Injectable({ providedIn: 'root' })
export class AnimationControlsOverlayService {
  private overlay!: Overlay;
  public overlayUi!: OverlayUi;

  constructor(
    eventBrokerService: EventBrokerService,
    private readonly overlayService: OverlayService,
    private readonly viewService: ViewService,
  ) {
    // Cause next render to re-compute and push icon positions because they're bottom relative.
    eventBrokerService.flyThruViewportChange.subscribe(_data => {
      this.overlay.arePositionsDirty = true;
    });
  }

  public prepare() {
    this.overlay = this.overlayService.prepare(FLY_THRU_OVERLAY_DESCRIPTOR);
    this.overlayUi = this.overlayService.attachUi(this.overlay, DIM_ALPHA);
    this.viewService.provideUiHandlers(this.overlayUi);
  }

  public render() {
    this.overlayService.render(this.overlay);
  }
}
