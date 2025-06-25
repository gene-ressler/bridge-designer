import { AfterViewInit, ChangeDetectionStrategy, Component, HostBinding, ViewChild } from '@angular/core';
import { jqxGridComponent, jqxGridModule } from 'jqwidgets-ng/jqxgrid';
import { BridgeService } from '../../../shared/services/bridge.service';
import { EventBrokerService, EventOrigin } from '../../../shared/services/event-broker.service';
import { EditEffect } from '../../../shared/classes/editing';
import { SelectedElementsService } from '../shared/selected-elements-service';
import { Utility } from '../../../shared/classes/utility';
import { ElementSelectorService } from '../shared/element-selector.service';
import { AnalysisValidityService } from '../../controls/management/analysis-validity.service';

@Component({
    selector: 'member-table',
    imports: [jqxGridModule],
    templateUrl: './member-table.component.html',
    styleUrl: './member-table.component.scss',
    changeDetection: ChangeDetectionStrategy.OnPush
})
export class MemberTableComponent implements AfterViewInit {
  private static readonly MEMBER_DATA_FIELDS = [
    { name: 'number', type: 'number' },
    { name: 'materialShortName', type: 'string' },
    { name: 'crossSectionShortName', type: 'string' },
    { name: 'materialSizeMm', type: 'number' },
    { name: 'length', type: 'number' },
    { name: 'slenderness', type: 'number' },
    { name: 'compressionForceStrengthRatio', type: 'number' },
    { name: 'tensionForceStrengthRatio', type: 'number' },
  ];

  // prettier-ignore
  readonly columns: any[] = [
    { 
      text: '#', 
      datafield: 'number', 
      cellsalign: 'center', 
      width: 30,
      renderer: MemberTableComponent.renderHeader,
    }, {
      text: 'Material type',
      datafield: 'materialShortName',
      cellsalign: 'center', 
      width: 60,
      renderer: MemberTableComponent.renderHeader,
    }, {
      text: 'Cross section',
      datafield: 'crossSectionShortName',
      cellsalign: 'center', 
      width: 60,
      renderer: MemberTableComponent.renderHeader,
    }, { 
      text: 'Size (mm)', 
      datafield: 'materialSizeMm', 
      cellsalign: 'right', 
      cellsformat: 'f0',
      width: 44, 
      renderer: MemberTableComponent.renderHeader
    }, { 
      text: 'Length (m)', 
      datafield: 'length', 
      cellsalign: 'right', 
      cellsformat: 'f2',
      width: 48, 
      renderer: MemberTableComponent.renderHeader
    }, {
      text: 'Slender- ness', 
      datafield: 'slenderness',
      cellsalign: 'right', 
      cellsformat: 'f2',
      width: 66, 
      renderer: MemberTableComponent.renderHeader,
      cellsrenderer: this.renderSlenderness.bind(this),
    }, { 
      text: 'Compression force/strength', 
      datafield: 'compressionForceStrengthRatio',
      cellsalign: 'center', 
      cellsformat: 'f2',
      width: 90, 
      renderer: MemberTableComponent.renderHeader,
      cellsrenderer: this.renderCompressionForceStrengthRatio.bind(this),
    }, { 
      text: 'Tension force/strength', 
      datafield: 'tensionForceStrengthRatio',
      cellsalign: 'center', 
      cellsformat: 'f2',
      width: 90, 
      renderer: MemberTableComponent.renderHeader,
      cellsrenderer: this.renderTensionForceStrengthRatio.bind(this),
    },
  ];

  readonly source: any = {
    localdata: [], // replaced
    datatype: 'array',
    datafields: MemberTableComponent.MEMBER_DATA_FIELDS,
  };
  readonly dataAdapter: any;
  /**
   * Throttled updater coalesces per-item change events for block selections.
   * Prevents redundant drafting panel invalidations.
   */
  private readonly updateSelectedMembersFromGridThrottled: any;
  private static readonly STYLE_MATCH = /style="[^"]*/;
  private isLastAnalysisValid: boolean | undefined;

  @ViewChild('grid') grid!: jqxGridComponent;
  @HostBinding('style.display') display: string = 'block';

  constructor(
    private readonly analysisValidityService: AnalysisValidityService,
    private readonly bridgeService: BridgeService,
    elementSelectorService: ElementSelectorService,
    private readonly eventBrokerService: EventBrokerService,
    private readonly selectedElementsService: SelectedElementsService,
  ) {
    this.source.localdata = bridgeService.bridge.members;
    this.dataAdapter = new jqx.dataAdapter(this.source);
    this.updateSelectedMembersFromGridThrottled = Utility.throttle(
      () => elementSelectorService.setSelectedMembers(this.grid.getselectedrowindexes(), EventOrigin.MEMBER_TABLE),
      60,
    );
  }

  /** Renders multi-line, wrapped, and centered headers. Padding allows room for sort icons. */
  private static renderHeader(header?: string, _alignment?: string, _height?: number): string {
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

  private renderCompressionForceStrengthRatio(
    _row?: number,
    _columnField?: string,
    value?: any,
    defaultHtml?: string,
  ): string {
    return this.renderAnalysisCell(value, defaultHtml!, 'rgb(255,150,150)');
  }

  private renderTensionForceStrengthRatio(
    _row?: number,
    _columnField?: string,
    value?: any,
    defaultHtml?: string,
  ): string {
    return this.renderAnalysisCell(value, defaultHtml!, 'rgb(150,150,255)');
  }

  private renderSlenderness(_row?: number, _columnField?: string, value?: any, defaultHtml?: string): string {
    return value <= this.bridgeService.designConditions.allowableSlenderness
      ? defaultHtml!
      : defaultHtml!.replace(
          MemberTableComponent.STYLE_MATCH,
          'style="padding: 4.5px 8px 3px 0;margin: 0 -4px -1px 0;background-color: magenta;',
        );
  }

  private renderAnalysisCell(value: any, defaultHtml: string, backgroundColor: string) {
    const html = defaultHtml.replace('></div>', '>—</div>');
    if (value <= 1 && this.analysisValidityService.isLastAnalysisValid) {
      return html;
    }
    let styles: string[] = ['style="padding-top: 4.5px;padding-bottom: 3px;margin-bottom: -1px;'];
    if (value !== undefined && value > 1) {
      styles.push('background-color: ', backgroundColor, ';');
    }
    if (!this.isLastAnalysisValid) {
      styles.push('color: gray;');
    }
    return html.replace(MemberTableComponent.STYLE_MATCH, styles.join(''));
  }

  public set visible(value: boolean) {
    this.display = value ? 'block' : 'none';
  }

  private updateGridContent(): void {
    this.isLastAnalysisValid = this.analysisValidityService.isLastAnalysisValid;
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
    this.updateSelectedMembersFromGridThrottled();
  }

  ngAfterViewInit(): void {
    this.eventBrokerService.analysisCompletion.subscribe(_eventInfo => this.updateGridContent());
    this.eventBrokerService.editCommandCompletion.subscribe(eventInfo => {
      if (
        eventInfo.data.effectsMask & EditEffect.MEMBERS ||
        // Analysis validity right now doesn't match last rendered.
        this.analysisValidityService.isLastAnalysisValid !== this.isLastAnalysisValid
      ) {
        this.updateGridContent();
      }
    });
    this.eventBrokerService.loadBridgeCompletion.subscribe(_eventInfo => this.updateGridContent());
    this.eventBrokerService.selectedElementsChange.subscribe(eventInfo => {
      if (eventInfo.origin !== EventOrigin.MEMBER_TABLE) {
        this.updateGridSelection();
      }
    });
  }
}
