import {
  AfterViewInit,
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  Component,
  ElementRef,
  HostBinding,
  ViewChild,
} from '@angular/core';
import { EventBrokerService } from '../../../shared/services/event-broker.service';
import { Utility } from '../../../shared/classes/utility';
import { AnimatorService } from '../rendering/animator.service';
import { GlService } from '../rendering/gl.service';
import { ViewportService } from '../rendering/viewport.service';
import { OverlayUiService } from '../rendering/overlay-ui.service';

@Component({
  selector: 'fly-thru-pane',
  imports: [],
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
    private readonly animatorService: AnimatorService,
    private readonly changeDetector: ChangeDetectorRef,
    private readonly eventBrokerService: EventBrokerService,
    private readonly glService: GlService,
    private readonly overlayUiService: OverlayUiService,
    private readonly viewportService: ViewportService,
  ) {}

  /** Delegates left button down to UI handler. */
  handlePointerDown(event: PointerEvent): void {
    if (event.button === 0) {
      this.flyThruCanvas.nativeElement.setPointerCapture(event.pointerId)
      this.overlayUiService.handlePointerDown(event.offsetX, event.offsetY);
    }
  }

  handlePointerMove(event: PointerEvent): void {
    this.overlayUiService.handlePointerMove(event.offsetX, event.offsetY);
  }

  handlePointerUp(event: PointerEvent): void {
    if (event.button === 0) {
      this.flyThruCanvas.nativeElement.releasePointerCapture(event.pointerId)
      this.overlayUiService.handlePointerUp(event.offsetX, event.offsetY);
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
      this.animatorService.start();
    } else {
      this.animatorService.stop();
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
