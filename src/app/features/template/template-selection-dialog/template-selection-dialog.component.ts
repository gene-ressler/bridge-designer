import { AfterViewInit, ChangeDetectionStrategy, Component, ElementRef, ViewChild } from '@angular/core';
import { jqxListBoxComponent, jqxListBoxModule } from 'jqwidgets-ng/jqxlistbox';
import { jqxWindowComponent, jqxWindowModule } from 'jqwidgets-ng/jqxwindow';
import { Graphics } from '../../../shared/classes/graphics';
import { BridgeService, RootBridgeService } from '../../../shared/services/bridge.service';
import { EventBrokerService, EventInfo, EventOrigin } from '../../../shared/services/event-broker.service';
import { ViewportTransform2D } from '../../../shared/services/viewport-transform.service';
import { jqxButtonComponent, jqxButtonModule } from 'jqwidgets-ng/jqxbuttons';
import { BridgeSketchService } from '../../../shared/services/bridge-sketch.service';
import { CartoonJointRenderingService } from '../../../shared/services/cartoon-joint-rendering.service';
import { CartoonOptionMask, CartoonRenderingService } from '../../../shared/services/cartoon-rendering.service';
import { CartoonSiteRenderingService } from '../../../shared/services/cartoon-site-rendering.service';
import { CartoonSketchRenderingService } from '../../../shared/services/cartoon-sketch-rendering.service';
import { BridgeSketchModel } from '../../../shared/classes/bridge-sketch.model';

@Component({
  selector: 'template-selection-dialog',
  standalone: true,
  imports: [jqxListBoxModule, jqxWindowModule, jqxButtonModule],
  /** Component-level injections of stateful services. Root versions are hidden. */
  providers: [
    BridgeService,
    CartoonJointRenderingService,
    CartoonRenderingService,
    CartoonSiteRenderingService,
    CartoonSketchRenderingService, 
    ViewportTransform2D,
  ],
  templateUrl: './template-selection-dialog.component.html',
  styleUrl: './template-selection-dialog.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class TemplateSelectionDialogComponent implements AfterViewInit {
  private templateSketches: BridgeSketchModel[] = [];

  @ViewChild('dialog') dialog!: jqxWindowComponent;
  @ViewChild('templateList') templateList!: jqxListBoxComponent;
  @ViewChild('okButton') okButton!: jqxButtonComponent;
  @ViewChild('preview') preview!: ElementRef<HTMLCanvasElement>;

  constructor(
    private readonly bridgeService: BridgeService,
    private readonly bridgeSketchService: BridgeSketchService,
    private readonly cartoonRenderingService: CartoonRenderingService,
    private readonly eventBrokerService: EventBrokerService,
    private readonly rootBridgeService: RootBridgeService,
    private readonly viewportTransform: ViewportTransform2D,
  ) {
    cartoonRenderingService.options = CartoonOptionMask.STANDARD_OPTIONS;
  }

  renderPreview(): void {
    const selectedIndex = this.templateList.getSelectedIndex();
    if (selectedIndex < 0) {
      return;
    }
    this.bridgeService.sketch = this.templateSketches[selectedIndex];
    this.viewportTransform.setWindow(this.bridgeService.siteInfo.drawingWindow);
    const ctx = Graphics.getContext(this.preview);
    this.cartoonRenderingService.render(ctx);
  }

  okClickHandler(): void {
    this.dialog.close();
    this.eventBrokerService.loadSketchRequest.next({
      origin: EventOrigin.TEMPLATE_DIALOG,
      data: this.bridgeService.sketch,
    });
  }

  dialogOpenHandler(_event: any): void {
    // Transfer design (root injector) bridge to our local instance.
    this.bridgeService.bridge = this.rootBridgeService.instance.bridge;
 
    // Load the right list of sketches and set up the list box if it's changed.
    this.templateSketches = this.bridgeSketchService.getSketchList(this.bridgeService.designConditions);
    if (this.templateList.source() !== this.templateSketches) {
      this.templateList.displayMember('name');
      this.templateList.source(this.templateSketches);
    }

    // Also set the selected template based on the design bridge.
    const designSketchIndex = this.templateSketches.indexOf(this.rootBridgeService.instance.sketch);
    this.templateList.selectedIndex(designSketchIndex >= 0 ? designSketchIndex : 0);

    // Only now is everything set to paint the preview image.
    this.renderPreview();
    this.templateList.focus();
  }

  keyDownHandler(event: KeyboardEvent): void {
    if (event.key === 'Enter') {
      this.okClickHandler();
    }
  }

  selectHandler(_event: any): void {
    this.renderPreview();
  }

  ngAfterViewInit(): void {
    this.eventBrokerService.loadTemplateRequest.subscribe((_eventInfo: EventInfo): void => {
      this.dialog.open();
    });
    const w = this.preview.nativeElement.width;
    const h = this.preview.nativeElement.height;
    this.viewportTransform.setViewport(0, h - 1, w - 1, 1 - h);
    // Monkeypatch jqxlistbox to handle events it doesn't know about by default.
    const sampleListElement = this.templateList.elementRef.nativeElement;
    sampleListElement.addEventListener('keydown', (event: KeyboardEvent) => this.keyDownHandler(event));
    sampleListElement
      .querySelectorAll('jqxlistbox .jqx-listitem-element')
      .forEach((item: Element) => item.addEventListener('dblclick', () => this.okClickHandler()));
  }
}
