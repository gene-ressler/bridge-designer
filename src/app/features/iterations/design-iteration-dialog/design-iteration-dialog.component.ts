import { AfterViewInit, ChangeDetectionStrategy, Component, ElementRef, ViewChild } from '@angular/core';
import { jqxGridModule, jqxGridComponent } from 'jqwidgets-ng/jqxgrid';
import { jqxListBoxModule } from 'jqwidgets-ng/jqxlistbox';
import { jqxTabsModule } from 'jqwidgets-ng/jqxtabs';
import { jqxTreeGridComponent, jqxTreeGridModule } from 'jqwidgets-ng/jqxtreegrid';
import { jqxWindowComponent, jqxWindowModule } from 'jqwidgets-ng/jqxwindow';
import { jqxButtonComponent, jqxButtonModule } from 'jqwidgets-ng/jqxbuttons';
import { EventBrokerService, EventInfo } from '../../../shared/services/event-broker.service';
import { BridgeService, BridgeServiceSessionStateKey } from '../../../shared/services/bridge.service';
import { DesignBridgeRenderingService } from '../../../shared/services/design-bridge-rendering.service';
import { DesignJointRenderingService } from '../../../shared/services/design-joint-rendering.service';
import { DesignMemberRenderingService } from '../../../shared/services/design-member-rendering.service';
import { DesignRenderingService } from '../../../shared/services/design-rendering.service';
import { DesignSiteRenderingService } from '../../../shared/services/design-site-rendering.service';
import { ViewportTransform2D } from '../../../shared/services/viewport-transform.service';
import { SelectedElementsService } from '../../drafting/shared/selected-elements-service';
import { DesignIterationService } from '../design-iteration.service';
import { AnalysisService } from '../../../shared/services/analysis.service';
import { WidgetHelper } from '../../../shared/classes/widget-helper';
import { Graphics } from '../../../shared/classes/graphics';
import { DraftingPanelState } from '../../../shared/services/persistence.service';

@Component({
  selector: 'design-iteration-dialog',
  standalone: true,
  imports: [jqxButtonModule, jqxGridModule, jqxListBoxModule, jqxTabsModule, jqxTreeGridModule, jqxWindowModule],
  /** Component-level injections of stateful services. Root versions are hidden. */
  providers: [
    DesignBridgeRenderingService,
    BridgeService,
    { provide: BridgeServiceSessionStateKey, useValue: { key: undefined } },
    DesignJointRenderingService,
    DesignMemberRenderingService,
    DesignRenderingService,
    DesignSiteRenderingService,
    SelectedElementsService,
    ViewportTransform2D,
  ],
  templateUrl: './design-iteration-dialog.component.html',
  styleUrl: './design-iteration-dialog.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class DesignIterationDialogComponent implements AfterViewInit {
  private static readonly PREVIEW_SCALE = 0.5;
  private static readonly ITERATION_DATA_FIELDS = [
    { name: 'cost', type: 'number' },
    { name: 'expanded', type: 'boolean'},
    { name: 'index', type: 'number' },
    { name: 'iterationNumber', type: 'number' },
    { name: 'parentIndex', type: 'number' },
    { name: 'projectId', type: 'string' },
    { name: 'status', type: 'number' },
  ];

  // prettier-ignore
  readonly columns: any[] = [
    { 
      text: 'Status',
      datafield: 'status',
      align: 'left',
      width: 80,
      cellsRenderer: (_row: string, _column: string, value: number, _rowData: any) => {
        const {src, title} = AnalysisService.getStatusIcon(value, true)
        return `<span style="display: inline-block; margin-top: 4px;"><img src="${src}" title="${title}"/><span>`;
      },
    }, {
      text: 'Iteration',
      datafield: 'iterationNumber',
      align: 'center',
      cellsalign: 'center',
      width: 64,
      cellsFormat: 'd',
    }, {
      text: 'Cost',
      datafield: 'cost',
      align: 'center',
      cellsalign: 'right',
      width: 100,
      cellsFormat: 'c2',
    }, {
      text: 'Project ID',
      datafield: 'projectId',
      align: 'center',
      width: 250,
    }
  ];

  // TODO: The tree grid widget alone can't depict the case where a parent has more than one run of
  // contiguous descendants. We could do this with a special icon or leading graphic character for
  // the first child of every run. Or add a column of icons evoking tree branches.
  readonly source: any = {
    localdata: [],
    datatype: 'array',
    datafields: DesignIterationDialogComponent.ITERATION_DATA_FIELDS,
    hierarchy: {
      keyDataField: { name: 'index' },
      parentDataField: { name: 'parentIndex' },
    },
    id: 'index',
  };
  readonly dataAdapter: any;
  readonly handleGridRowSelect: (event: any) => void;
  readonly handleTreeRowSelect: (event: any) => void;

  @ViewChild('dialog') dialog!: jqxWindowComponent;
  @ViewChild('grid') grid!: jqxGridComponent;
  @ViewChild('preview') preview!: ElementRef<HTMLCanvasElement>;
  @ViewChild('tree') tree!: jqxTreeGridComponent;
  @ViewChild('okButton') okButton!: jqxButtonComponent;

  constructor(
    private readonly bridgeService: BridgeService,
    private readonly designIterationService: DesignIterationService,
    private readonly designRenderingService: DesignRenderingService,
    private readonly eventBrokerService: EventBrokerService,
    private readonly viewportTransform: ViewportTransform2D,
  ) {
    this.dataAdapter = new jqx.dataAdapter(this.source);
    [this.handleGridRowSelect, this.handleTreeRowSelect] = WidgetHelper.createMutexHandlerGroup(
      (event: any) => {
        this.tree.selectRow(event.args.rowindex);
        this.renderPreview();
      },
      (event: any) => {
        this.grid.selectedrowindex(event.args.boundIndex);
        this.renderPreview();
      },
    );
  }

  renderPreview(): void {
    const selection = this.tree.getSelection()[0];
    if (!selection) {
      return;
    }
    const bridge = this.designIterationService.iterations[selection.index].bridge;
    this.bridgeService.setBridge(bridge, DraftingPanelState.createNew());
    this.viewportTransform.setWindow(this.bridgeService.siteInfo.drawingWindow);
    const ctx = Graphics.getContext(this.preview);
    ctx.resetTransform();
    ctx.scale(DesignIterationDialogComponent.PREVIEW_SCALE, DesignIterationDialogComponent.PREVIEW_SCALE);
    this.designRenderingService.render(ctx);
  }

  handleDialogOpen(_event: any): void {
    this.designIterationService.refreshInProgress();
    this.source.localdata = this.designIterationService.iterations;
    this.tree.updateBoundData();
    const inProgressIndex = this.designIterationService.inProgressIndex;
    this.tree.selectRow(inProgressIndex);
    this.tree.ensureRowVisible(inProgressIndex);
    this.renderPreview();
    this.tree.focus();
  }

  handleOkClick(): void {
    const selected = this.tree.getSelection()[0];
    if (selected) {
      this.designIterationService.choose(selected.index);
    }
    this.dialog.close();
  }

  handleRowDoubleClick(_event: any): void {
    this.handleOkClick();
  }

  /** Sets the keyboard focus to iteration widgets when tabs are clicked. */
  handleTabSelected(event: any): void {
    (event.args.item === 1 ? this.grid : this.tree).focus();
  }

  handleKeyDown(event: KeyboardEvent): void {
    if (event.key === 'Enter') {
      this.handleOkClick();
    }
  }

  ngAfterViewInit(): void {
    this.eventBrokerService.loadDesignIterationRequest.subscribe((_eventInfo: EventInfo): void => {
      this.dialog.open();
    });
    const w = this.preview.nativeElement.width / DesignIterationDialogComponent.PREVIEW_SCALE;
    const h = this.preview.nativeElement.height / DesignIterationDialogComponent.PREVIEW_SCALE;
    this.viewportTransform.setViewport(0, h - 1, w - 1, 1 - h);
    const keyListener = (event: KeyboardEvent) => this.handleKeyDown(event);
    this.tree.elementRef.nativeElement.addEventListener('keydown', keyListener);
    this.grid.elementRef.nativeElement.addEventListener('keydown', keyListener);
  }
}
