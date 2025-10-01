import { CommonModule } from '@angular/common';
import { AfterViewInit, ChangeDetectionStrategy, ChangeDetectorRef, Component, ViewChild } from '@angular/core';
import { jqxWindowComponent, jqxWindowModule } from 'jqwidgets-ng/jqxwindow';
import { jqxButtonModule } from 'jqwidgets-ng/jqxbuttons';
import { EventBrokerService } from '../../../shared/services/event-broker.service';
import { BridgeCostService } from '../../../shared/services/bridge-cost.service';
import { BridgeCostModel } from '../../../shared/classes/bridge-cost.model';
import { COUNT_FORMATTER, DOLLARS_FORMATTER, FIXED_FORMATTER } from '../../../shared/classes/utility';
import { BridgeService } from '../../../shared/services/bridge.service';
import { SiteCostsModel } from '../../../shared/services/design-conditions.service';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

@Component({
  selector: 'cost-report-dialog',
  imports: [CommonModule, jqxButtonModule, jqxWindowModule],
  templateUrl: './cost-report-dialog.component.html',
  styleUrl: './cost-report-dialog.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CostReportDialogComponent implements AfterViewInit {
  @ViewChild('dialog') dialog!: jqxWindowComponent;
  bridgeCosts: BridgeCostModel;
  readonly toDollars = DOLLARS_FORMATTER.format;
  readonly toCount = COUNT_FORMATTER.format;
  readonly toFixed = FIXED_FORMATTER.format;

  constructor(
    private readonly bridgeCostService: BridgeCostService,
    private readonly bridgeService: BridgeService,
    private readonly eventBrokerService: EventBrokerService,
    private readonly changeDetector: ChangeDetectorRef,
  ) {
    this.bridgeCosts = this.bridgeCostService.bridgeCostModel;
  }

  get siteCosts(): SiteCostsModel {
    return this.bridgeService.designConditions.siteCosts;
  }

  get totalCost(): number {
    return this.bridgeCosts.totalCost + this.siteCosts.totalFixedCost;
  }

  handleDialogOpen(): void {
    this.bridgeCosts = this.bridgeCostService.bridgeCostModel;
    this.changeDetector.detectChanges();
  }

  handlePrint(): void {
    const doc = new jsPDF({ format: 'letter', orientation: 'landscape' });
    autoTable(doc, {
      html: '.report-table',
      styles: { fontSize: 8 },
      useCss: true,
    });
    const blob = doc.output('blob');
    const url = URL.createObjectURL(blob);
    window.open(url, '_blank');
  }

  ngAfterViewInit(): void {
    this.eventBrokerService.costReportRequest.subscribe(_eventInfo => this.dialog.open());
  }
}
