import { AfterViewInit, ChangeDetectionStrategy, Component, ViewChild } from '@angular/core';
import { jqxWindowComponent, jqxWindowModule } from 'jqwidgets-ng/jqxwindow';
import { jqxGridComponent, jqxGridModule } from 'jqwidgets-ng/jqxgrid';
import { jqxButtonModule } from 'jqwidgets-ng/jqxbuttons';
import { BridgeService } from '../../../shared/services/bridge.service';
import { EventBrokerService } from '../../../shared/services/event-broker.service';

@Component({
  selector: 'load-test-report-dialog',
  standalone: true,
  imports: [jqxButtonModule, jqxGridModule, jqxWindowModule],
  templateUrl: './load-test-report-dialog.component.html',
  styleUrl: './load-test-report-dialog.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class LoadTestReportDialogComponent implements AfterViewInit {
  private static readonly MEMBER_DATA_FIELDS = [
    { name: 'number', type: 'number' },
    { name: 'materialShortName', type: 'string' },
    { name: 'crossSectionShortName', type: 'string' },
    { name: 'materialSize', type: 'number' },
    { name: 'length', type: 'number' },
    { name: 'slenderness', type: 'number' },
    { name: 'maxCompression', type: 'number' },
    { name: 'compressionStrength', type: 'number' },
    { name: 'compressionStatus', type: 'string' },
    { name: 'maxTension', type: 'number' },
    { name: 'tensionStrength', type: 'number' },
    { name: 'tensionStatus', type: 'string' },
  ];

  // prettier-ignore
  readonly columns = 
    [
     { text: '#', 
       datafield: 'number', 
       cellsalign: 'center', 
       width: 30,
       renderer: LoadTestReportDialogComponent.renderHeader,
     }, {
       text: 'Material type',
       datafield: 'materialShortName',
       cellsalign: 'center', 
       width: 60,
       renderer: LoadTestReportDialogComponent.renderHeader,
     }, {
       text: 'Cross section',
       datafield: 'crossSectionShortName',
       cellsalign: 'center', 
       width: 60,
       renderer: LoadTestReportDialogComponent.renderHeader,
     }, { 
       text: 'Size (mm)', 
       datafield: 'materialSize', 
       cellsalign: 'right', 
       cellsformat: 'f0',
       width: 44, 
       renderer: LoadTestReportDialogComponent.renderHeader
     }, { 
       text: 'Length (m)', 
       datafield: 'length', 
       cellsalign: 'right', 
       cellsformat: 'f2',
       width: 48, 
       renderer: LoadTestReportDialogComponent.renderHeader
     }, {
       text: 'Slender- ness', 
       datafield: 'slenderness',
       cellsalign: 'right', 
       cellsformat: 'f2',
       width: 66, 
       renderer: LoadTestReportDialogComponent.renderHeader
     }, { 
      text: 'Compression force', 
      datafield: 'maxCompression',
      cellsalign: 'right', 
      cellsformat: 'f2',
      width: 86, 
      renderer: LoadTestReportDialogComponent.renderHeader
    }, { 
      text: 'Compression strength', 
      datafield: 'compressionStrength',
      cellsalign: 'right', 
      cellsformat: 'f2',
      width: 86, 
      renderer: LoadTestReportDialogComponent.renderHeader
    }, { 
      text: 'Compression status', 
      datafield: 'compressionStatus',
      cellsalign: 'center', 
      width: 68, 
      renderer: LoadTestReportDialogComponent.renderHeader
    }, { 
       text: 'Tension force', 
       datafield: 'maxTension',
       cellsalign: 'right', 
       cellsformat: 'f2',
       width: 86, 
       renderer: LoadTestReportDialogComponent.renderHeader,
     }, { 
      text: 'Tension strength', 
      datafield: 'tensionStrength',
      cellsalign: 'right', 
      cellsformat: 'f2',
      width: 86, 
      renderer: LoadTestReportDialogComponent.renderHeader,
    }, { 
      text: 'Tension status', 
      datafield: 'tensionStatus',
      cellsalign: 'center', 
      width: 68, 
      renderer: LoadTestReportDialogComponent.renderHeader
    },
   ];

  readonly source: any = {
    localdata: [],
    datatype: 'array',
    datafields: LoadTestReportDialogComponent.MEMBER_DATA_FIELDS,
  };
  readonly dataAdapter: any;

  @ViewChild('dialog') dialog!: jqxWindowComponent;
  @ViewChild('grid') grid!: jqxGridComponent;

  constructor(private readonly bridgeService: BridgeService,
    private readonly eventBrokerService: EventBrokerService,
  ) {
    this.source.localdata = bridgeService.bridge.members;
    this.dataAdapter = new jqx.dataAdapter(this.source);
  }

  dialogOpenHandler(): void {
    this.source.localdata =  this.bridgeService.bridge.members;
    this.grid.source(this.dataAdapter);
    this.grid.updatebounddata('cells');
  }

  /** Renders multi-line, wrapped, and centered headers.  */
  private static renderHeader(header?: string, _alignment?: string, _height?: number): string {
    return `<div style="
        height: 100%; 
        width: 100%;
        text-wrap: wrap; 
        display: table;">
        <div style="
          font-size: 11px;
          display: table-cell; 
          vertical-align: middle; 
          text-align: center;">${header}</div>
      </div>`;
  }

  ngAfterViewInit(): void {
    this.eventBrokerService.analysisReportRequest.subscribe(_eventInfo => this.dialog.open());
  }
}
