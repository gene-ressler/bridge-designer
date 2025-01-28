import { AfterViewInit, ChangeDetectionStrategy, Component, HostBinding, ViewChild } from '@angular/core';
import { jqxGridComponent, jqxGridModule } from 'jqwidgets-ng/jqxgrid';
import { BridgeService } from '../../../shared/services/bridge.service';
import { EventBrokerService, EventOrigin } from '../../../shared/services/event-broker.service';
import { EditEffect } from '../../../shared/classes/editing';
import { SelectedElementsService } from '../services/selected-elements-service';
import { Utility } from '../../../shared/classes/utility';
import { ElementSelectorService } from '../services/element-selector.service';

@Component({
  selector: 'member-table',
  standalone: true,
  imports: [jqxGridModule],
  templateUrl: './member-table.component.html',
  styleUrl: './member-table.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class MemberTableComponent implements AfterViewInit {
  private static readonly MEMBER_DATA_FIELDS = [
    { name: 'number', type: 'number' },
    { name: 'materialShortName', type: 'string' },
    { name: 'crossSectionShortName', type: 'string' },
    { name: 'materialSize', type: 'number' },
    { name: 'length', type: 'number' },
    { name: 'slenderness', type: 'number' },
    { name: 'compression', type: 'string' },
    { name: 'tension', type: 'string' },
  ];

  // prettier-ignore
  private static readonly GRID_COLUMNS = 
   [
    { text: '#', 
      datafield: 'number', 
      cellsalign: 'center', 
      width: 30,
      renderer: MemberTableComponent.headerRenderer,
    }, {
      text: 'Material type',
      datafield: 'materialShortName',
      cellsalign: 'center', 
      width: 60,
      renderer: MemberTableComponent.headerRenderer,
    }, {
      text: 'Cross section',
      datafield: 'crossSectionShortName',
      cellsalign: 'center', 
      width: 60,
      renderer: MemberTableComponent.headerRenderer,
    }, { 
      text: 'Size (mm)', 
      datafield: 'materialSize', 
      cellsalign: 'right', 
      cellsformat: 'f0',
      width: 44, 
      renderer: MemberTableComponent.headerRenderer
    }, { 
      text: 'Length (m)', 
      datafield: 'length', 
      cellsalign: 'right', 
      cellsformat: 'f2',
      width: 48, 
      renderer: MemberTableComponent.headerRenderer
    }, {
      text: 'Slender- ness', 
      datafield: 'slenderness',
      cellsalign: 'right', 
      cellsformat: 'f1',
      width: 66, 
      renderer: MemberTableComponent.headerRenderer
    }, { 
      text: 'Compression force/strength', 
      datafield: 'compression',
      cellsalign: 'center', 
      width: 90, 
      renderer: MemberTableComponent.headerRenderer
    }, { 
      text: 'Tension force/strength', 
      datafield: 'tension',
      cellsalign: 'center', 
      width: 90, 
      renderer: MemberTableComponent.headerRenderer
    },
  ];

  readonly columns = MemberTableComponent.GRID_COLUMNS;
  readonly source: any = {
    localdata: [],
    datatype: 'array',
    datafields: MemberTableComponent.MEMBER_DATA_FIELDS,
  };
  readonly dataAdapter: any;
  readonly throttledSelectionUpdater: any;

  @ViewChild('grid') grid!: jqxGridComponent;
  @HostBinding('style.display') display: string = 'block';

  constructor(
    private readonly bridgeService: BridgeService,
    elementSelectorService: ElementSelectorService,
    private readonly selectedElementsService: SelectedElementsService,
    private readonly eventBrokerService: EventBrokerService,
  ) {
    this.source.localdata = bridgeService.bridge.members;
    this.dataAdapter = new jqx.dataAdapter(this.source);
    this.throttledSelectionUpdater = Utility.throttle(
      () => elementSelectorService.setSelectedMembers(this.grid.getselectedrowindexes(), EventOrigin.MEMBER_TABLE),
      100,
    );
  }

  /** Renders multi-line, wrapped, and centered headers. Padding allows room for sort icons. */
  private static headerRenderer(header?: string, _alignment?: string, _height?: number): string {
    return `<div style="
      height: 100%; 
      width: 100%;
      text-wrap: wrap; 
      display: table;">
      <div style="
        font-size: 9.5px;
        padding-right: 8px;
        display: table-cell; 
        vertical-align: middle; 
        text-align: center;">${header}</div>
    </div>`;
  }

  public set visible(value: boolean) {
    this.display = value ? 'block' : 'none';
  }

  private updateGridContent(): void {
    this.source.localdata = this.bridgeService.bridge.members;
    this.grid.source(this.dataAdapter);
    this.grid.updatebounddata('cells');
  }

  /** Adjust the grid row selection to match selected members (i.e. those selected graphically). */
  private updateGridSelection(): void {
    const selectedMembers = this.selectedElementsService.selectedElements.selectedMembers;
    const selectedRows = new Set(this.grid.getselectedrowindexes());
    Utility.applyToSetDifference(index => this.grid.selectrow(index), selectedMembers, selectedRows);
    Utility.applyToSetDifference(index => this.grid.unselectrow(index), selectedRows, selectedMembers);
  }

  updateSelectionFromGrid(): void {
    this.throttledSelectionUpdater();
  }

  ngAfterViewInit(): void {
    this.eventBrokerService.selectedElementsChange.subscribe(eventInfo => {
      if (eventInfo.source !== EventOrigin.MEMBER_TABLE) {
        this.updateGridSelection();
      }
    });
    this.eventBrokerService.editCommandCompletion.subscribe(eventInfo => {
      if (eventInfo.data.effectsMask & EditEffect.MEMBERS) {
        this.updateGridContent();
      }
    });
    this.eventBrokerService.loadBridgeCompletion.subscribe(_eventInfo => this.updateGridContent());
    this.eventBrokerService.analysisCompletion.subscribe(_eventInfo => this.updateGridContent());
  }
}
