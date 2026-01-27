/* Copyright (c) 2025-2026 Gene Ressler
   SPDX-License-Identifier: GPL-3.0-or-later */

import { AfterViewInit, ChangeDetectionStrategy, Component, ElementRef, ViewChild } from '@angular/core';
import { jqxGridModule, jqxGridComponent } from 'jqwidgets-ng/jqxgrid';
import { jqxListBoxModule } from 'jqwidgets-ng/jqxlistbox';
import { jqxTabsComponent, jqxTabsModule } from 'jqwidgets-ng/jqxtabs';
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
import {
  SelectedElementsService,
  SelectedElementsServiceSessionStateKey,
} from '../../drafting/shared/selected-elements-service';
import { DesignIterationService } from '../design-iteration.service';
import { AnalysisService } from '../../../shared/services/analysis.service';
import { Graphics } from '../../../shared/classes/graphics';
import { DraftingPanelState } from '../../../shared/services/persistence.service';
import { DesignSketchRenderingService } from '../../../shared/services/design-sketch-rendering.service';

@Component({
  selector: 'design-iteration-dialog',
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
    DesignSketchRenderingService,
    SelectedElementsService,
    { provide: SelectedElementsServiceSessionStateKey, useValue: { key: undefined } },
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
    { name: 'expanded', type: 'boolean' },
    { name: 'index', type: 'number' },
    { name: 'iterationNumber', type: 'number' },
    { name: 'parentIndex', type: 'number' },
    { name: 'projectId', type: 'string' },
    { name: 'status', type: 'number' },
  ];
  // prettier-ignore
  private static readonly COLUMNS_TEMPLATE: jqwidgets.GridColumn[] = [
      { 
        text: 'Status',
        datafield: 'status',
        align: 'left',
        width: 80,
      }, {
        text: 'Iteration',
        datafield: 'iterationNumber',
        align: 'center',
        cellsalign: 'center',
        width: 64,
        cellsformat: 'd',
      }, {
        text: 'Cost',
        datafield: 'cost',
        align: 'center',
        cellsalign: 'right',
        width: 100,
        cellsformat: 'c2',
      }, {
        text: 'Project ID',
        datafield: 'projectId',
        align: 'center',
        width: 250,
      }
  ];

  /** Constructs standard columns with small renderer customizations. */
  private static makeColumns(spanStyle: string): jqwidgets.GridColumn[] {
    // Shallow copy.
    const columns = DesignIterationDialogComponent.COLUMNS_TEMPLATE.slice();
    // Replace the first item with a record having a cells renderer.
    columns[0] = {
      cellsrenderer: (
        _row?: number | undefined,
        _columnfield?: string | undefined,
        value?: any,
        _defaulthtml?: string | undefined,
        _columnproperties?: any,
        _rowdata?: any,
      ): string => {
        const { src, title } = AnalysisService.getStatusIcon(value, true);
        // Image size mandatory for correct scroll height calculation.
        return `<span style="display:inline-block;${spanStyle}"><img src="${src}" title="${title}" style="width:16px;height:16px;"></span>`;
      },
      ...columns[0],
    };
    return columns;
  }

  readonly treeColumns = DesignIterationDialogComponent.makeColumns('margin-top:4px;');
  readonly gridColumns = DesignIterationDialogComponent.makeColumns('margin-top:4px;margin-left:22px;');

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

  @ViewChild('dialog') dialog!: jqxWindowComponent;
  @ViewChild('grid') grid!: jqxGridComponent;
  @ViewChild('preview') preview!: ElementRef<HTMLCanvasElement>;
  @ViewChild('tabs') tabs!: jqxTabsComponent;
  @ViewChild('tree') tree!: jqxTreeGridComponent;
  @ViewChild('okButton') okButton!: jqxButtonComponent;

  /** Current selection index in the visible tab. */
  private selectedIndex: number = -1;

  constructor(
    private readonly bridgeService: BridgeService,
    private readonly designIterationService: DesignIterationService,
    private readonly designRenderingService: DesignRenderingService,
    private readonly eventBrokerService: EventBrokerService,
    private readonly viewportTransform: ViewportTransform2D,
  ) {
    this.dataAdapter = new jqx.dataAdapter(this.source);
  }

  renderPreview(): void {
    if (this.selectedIndex < 0) {
      return;
    }
    const bridge = this.designIterationService.iterations[this.selectedIndex].bridge;
    this.bridgeService.setBridge(bridge, DraftingPanelState.createNew());
    this.viewportTransform.setWindow(this.bridgeService.siteInfo.drawingWindow);
    const ctx = Graphics.getContext(this.preview);
    ctx.resetTransform();
    ctx.scale(DesignIterationDialogComponent.PREVIEW_SCALE, DesignIterationDialogComponent.PREVIEW_SCALE);
    this.designRenderingService.render(ctx);
  }

  handleGridRowSelect(event: any) {
    this.selectedIndex = event.args.rowindex;
    this.renderPreview();
  }

  handleTreeRowSelect(event: any) {
    this.selectedIndex = event.args.boundIndex;
    this.renderPreview();
  }

  handleDialogOpen(_event: any): void {
    // Make sure the service's current iteration data (e.g. cost) is current.
    this.designIterationService.refreshInProgress();
    this.selectedIndex = this.designIterationService.inProgressIndex;
    this.refreshView(this.tabs.selectedItem());
  }

  private refreshView(item: number): void {
    if (item !== 0 && item !== 1) {
      return;
    }
    this.source.localdata = this.designIterationService.iterations;
    // Why on earth does jqWidgets mix lower and camel case?
    if (item === 1) {
      const listView = this.grid;
      listView.focus();
      listView.updatebounddata();
      listView.selectrow(this.selectedIndex);
      // Without the delay, the list scrolls to the selected row then immediately
      // back to row 0. Delay 0 no different. Tree is fine. Not related to async
      // image load. ¯\_(ツ)_/¯
      setTimeout(() => listView.ensurerowvisible(this.selectedIndex), 200);
    } else {
      const treeView = this.tree;
      treeView.focus();
      treeView.updateBoundData();
      treeView.selectRow(this.selectedIndex);
      treeView.ensureRowVisible(this.selectedIndex);
    }
    this.renderPreview();
  }

  handleOkClick(): void {
    if (this.selectedIndex >= 0) {
      this.designIterationService.choose(this.selectedIndex);
    }
    this.dialog.close();
  }

  handleRowDoubleClick(_event: any): void {
    this.handleOkClick();
  }

  handleTabSelected(event: any): void {
    this.refreshView(event.args.item);
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
