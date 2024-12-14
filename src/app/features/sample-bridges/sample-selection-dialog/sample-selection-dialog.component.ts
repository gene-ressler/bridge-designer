import { AfterViewInit, ChangeDetectionStrategy, Component, ElementRef, ViewChild } from '@angular/core';
import { jqxListBoxComponent, jqxListBoxModule } from 'jqwidgets-ng/jqxlistbox';
import { jqxWindowComponent, jqxWindowModule } from 'jqwidgets-ng/jqxwindow';
import { Graphics } from '../../../shared/classes/graphics';
import { DesignBridgeRenderingService } from '../../../shared/services/design-bridge-rendering.service';
import { DesignBridgeService } from '../../../shared/services/design-bridge.service';
import { DesignJointRenderingService } from '../../../shared/services/design-joint-rendering.service';
import { DesignMemberRenderingService } from '../../../shared/services/design-member-rendering.service';
import { DesignRenderingService } from '../../../shared/services/design-rendering.service';
import { DesignSiteRenderingService } from '../../../shared/services/design-site-rendering.service';
import { EventBrokerService, EventInfo, EventOrigin } from '../../../shared/services/event-broker.service';
import { SAMPLE_BRIDGES, SampleService } from '../../../shared/services/sample.service';
import { ViewportTransform2D } from '../../../shared/services/viewport-transform.service';
import { SelectedElementsService } from '../../drafting/services/selected-elements-service';
import { jqxButtonComponent, jqxButtonModule } from 'jqwidgets-ng/jqxbuttons';

@Component({
  selector: 'sample-selection-dialog',
  standalone: true,
  imports: [jqxListBoxModule, jqxWindowModule, jqxButtonModule],
  /** Component-level injections of stateful services. Root versions are hidden. */
  providers: [
    DesignBridgeRenderingService,
    DesignBridgeService,
    DesignJointRenderingService,
    DesignMemberRenderingService,
    DesignRenderingService,
    DesignSiteRenderingService,
    SelectedElementsService,
    ViewportTransform2D,
  ],
  templateUrl: './sample-selection-dialog.component.html',
  styleUrl: './sample-selection-dialog.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SampleSelectionDialogComponent implements AfterViewInit {
  private static readonly PREVIEW_SCALE: number = 0.5;

  @ViewChild('dialog') dialog!: jqxWindowComponent;
  @ViewChild('sampleList') sampleList!: jqxListBoxComponent;
  @ViewChild('okButton') okButton!: jqxButtonComponent;
  @ViewChild('preview') preview!: ElementRef<HTMLCanvasElement>;

  constructor(
    private readonly eventBrokerService: EventBrokerService,
    private readonly sampleService: SampleService,
    private readonly designRenderingService: DesignRenderingService,
    private readonly designBridgeService: DesignBridgeService,
    private readonly viewportTransform: ViewportTransform2D,
  ) {}

  renderPreview(): void {
    const selectedIndex = this.sampleList.getSelectedIndex();
    if (selectedIndex < 0) {
      return;
    }
    this.designBridgeService.bridge = this.sampleService.getSampleBridge(selectedIndex);
    this.viewportTransform.setWindow(this.designBridgeService.siteInfo.drawingWindow);
    const ctx = Graphics.getContext(this.preview);
    ctx.resetTransform();
    ctx.scale(SampleSelectionDialogComponent.PREVIEW_SCALE, SampleSelectionDialogComponent.PREVIEW_SCALE);
    this.designRenderingService.render(ctx);
  }

  okClickHandler(): void {
    this.dialog.close();
    this.eventBrokerService.loadBridgeRequest.next({
      source: EventOrigin.SAMPLE_DIALOG,
      data: this.designBridgeService.bridge,
    });
  }

  dialogOpenHandler(_event: any): void {
    this.renderPreview();
    this.sampleList.focus();
  }

  keyDownHandler(event: KeyboardEvent): void {
    if (event.key === 'Enter') {
      this.okClickHandler();
    }
  }

  selectHandler(_event: any): void {
    this.renderPreview();
  }

  source: any[] = SAMPLE_BRIDGES;

  ngAfterViewInit(): void {
    this.eventBrokerService.loadSampleRequest.subscribe((_eventInfo: EventInfo): void => {
      this.dialog.open();
    });
    const w = this.preview.nativeElement.width / SampleSelectionDialogComponent.PREVIEW_SCALE;
    const h = this.preview.nativeElement.height / SampleSelectionDialogComponent.PREVIEW_SCALE;
    this.viewportTransform.setViewport(0, h - 1, w - 1, 1 - h);
    // Monkeypatch jqxlistbox to handle events it doesn't know about by default.
    const sampleListElement = this.sampleList.elementRef.nativeElement;
    sampleListElement.addEventListener('keydown', (event: KeyboardEvent) => this.keyDownHandler(event));
    sampleListElement
      .querySelectorAll('jqxlistbox .jqx-listitem-element')
      .forEach((item: Element) => item.addEventListener('dblclick', () => this.okClickHandler()));
  }
}
