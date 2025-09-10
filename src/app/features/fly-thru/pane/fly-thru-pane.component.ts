import {
  AfterViewInit,
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  Component,
  ElementRef,
  HostBinding,
  HostListener,
  ViewChild,
} from '@angular/core';
import { EventBrokerService } from '../../../shared/services/event-broker.service';
import { Utility } from '../../../shared/classes/utility';
import { AnimationService } from '../rendering/animation.service';
import { GlService } from '../rendering/gl.service';
import { ViewportService } from '../rendering/viewport.service';
import { AnimationControlsOverlayService } from '../rendering/animation-controls-overlay.service';
import { FlyThruSettingsDialogComponent } from '../fly-thru-settings-dialog/fly-thru-settings-dialog.component';
import { KeyboardService } from './keyboard.service';

@Component({
  selector: 'fly-thru-pane',
  imports: [FlyThruSettingsDialogComponent],
  templateUrl: './fly-thru-pane.component.html',
  styleUrl: './fly-thru-pane.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class FlyThruPaneComponent implements AfterViewInit {
  @HostBinding('style.display') display: string = 'none';
  @ViewChild('wrapper') wrapper!: ElementRef<HTMLDivElement>;
  @ViewChild('flyThruCanvas') flyThruCanvas!: ElementRef<HTMLCanvasElement>;

  // TODO: On retina and other displays w/ devicePixelRatio > 1, how does this look?
  width: number = screen.availWidth;
  height: number = screen.availHeight;

  constructor(
    private readonly animationControlsOverlayService: AnimationControlsOverlayService,
    private readonly animationService: AnimationService,
    private readonly changeDetector: ChangeDetectorRef,
    private readonly eventBrokerService: EventBrokerService,
    private readonly glService: GlService,
    private readonly keyBoardService: KeyboardService,
    private readonly viewportService: ViewportService,
  ) {}

  /** Delegates left button down to UI handler. */
  handlePointerDown(event: PointerEvent): void {
    if (event.button === 0) {
      this.flyThruCanvas.nativeElement.setPointerCapture(event.pointerId);
      this.animationControlsOverlayService.overlayUi.acceptPointerDown(event.offsetX, event.offsetY);
    }
  }

  /** Delegates pointer move to UI handler. */
  handlePointerMove(event: PointerEvent): void {
    this.animationControlsOverlayService.overlayUi.acceptPointerMove(event.offsetX, event.offsetY);
  }

  /** Delegates left button up to UI handler. */
  handlePointerUp(event: PointerEvent): void {
    if (event.button === 0) {
      this.flyThruCanvas.nativeElement.releasePointerCapture(event.pointerId);
      this.animationControlsOverlayService.overlayUi.acceptPointerUp(event.offsetX, event.offsetY);
    }
  }

  /** Delegates document key down to the handler service if the pane is visible. */
  @HostListener('document:keydown', ['$event'])
  handleKeyDown(event: KeyboardEvent) {
    if (this.display !== 'none') {
      this.keyBoardService.handleKey(event.key);
    }
  }

  /** Suppresses context menu. */
  ignore(): boolean {
    return false;
  }

  private set isVisible(value: boolean) {
    this.display = value ? 'block' : 'none';
    this.changeDetector.detectChanges();
    if (value) {
      this.animationService.start();
    } else {
      this.animationService.stop();
    }
  }

  private handleResize(): void {
    const parent = Utility.assertNotNull(this.flyThruCanvas.nativeElement.parentElement);
    // Do nothing if canvas not yet visible.
    if (parent.clientWidth === 0) {
      return;
    }
    this.viewportService.setViewport(this.width, this.height, parent.clientWidth, parent.clientHeight);
  }

  ngAfterViewInit(): void {
    new ResizeObserver(() => this.handleResize()).observe(this.wrapper.nativeElement);
    this.glService.initialize(this.flyThruCanvas.nativeElement);
    this.eventBrokerService.uiModeRequest.subscribe(eventInfo => {
      this.isVisible = eventInfo.data === 'animation';
    });
  }
}
