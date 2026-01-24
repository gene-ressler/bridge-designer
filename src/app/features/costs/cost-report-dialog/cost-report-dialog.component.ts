/* Copyright (c) 2025-2026 Gene Ressler
   SPDX-License-Identifier: GPL-3.0-or-later */

import { CommonModule } from '@angular/common';
import {
  AfterViewInit,
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  Component,
  ElementRef,
  ViewChild,
} from '@angular/core';
import { jqxWindowComponent, jqxWindowModule } from 'jqwidgets-ng/jqxwindow';
import { jqxButtonModule } from 'jqwidgets-ng/jqxbuttons';
import { EventBrokerService, EventOrigin } from '../../../shared/services/event-broker.service';
import { BridgeCostService } from '../../../shared/services/bridge-cost.service';
import { BridgeCostModel } from '../../../shared/classes/bridge-cost.model';
import { COUNT_FORMATTER, DOLLARS_FORMATTER, FIXED_FORMATTER } from '../../../shared/classes/utility';
import { BridgeService } from '../../../shared/services/bridge.service';
import { SiteCostsModel } from '../../../shared/services/design-conditions.service';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { ToastKind } from '../../toast/toast/toast-error';

/** A dialog containing a detailed report of bridge costs. */
@Component({
  selector: 'cost-report-dialog',
  imports: [CommonModule, jqxButtonModule, jqxWindowModule],
  templateUrl: './cost-report-dialog.component.html',
  styleUrl: './cost-report-dialog.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CostReportDialogComponent implements AfterViewInit {
  bridgeCosts: BridgeCostModel;
  readonly toDollars = DOLLARS_FORMATTER.format;
  readonly toCount = COUNT_FORMATTER.format;
  readonly toFixed = FIXED_FORMATTER.format;

  @ViewChild('dialog') dialog!: jqxWindowComponent;
  @ViewChild('costsTable') costsTable!: ElementRef<HTMLTableElement>;

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

  async handleCopy(): Promise<void> {
    try {
      // Extract text from report template table.
      const textContent: string[][] = [];
      const table = this.costsTable.nativeElement;
      const rows = table.rows;
      for (let i = 0; i < rows.length; ++i) {
        const rowContent: string[] = [];
        const cells = rows[i].cells;
        for (let j = 0; j < cells.length; ++j) {
          const cell = cells[j];
          const text = cell.textContent?.trim() || '';
          rowContent.push(text.startsWith('=') ? `'${text}` : text);
          const colSpan = cell.colSpan || 1;
          for (let k = 1; k < colSpan; ++k) {
            rowContent.push('');
          }
        }
        textContent.push(rowContent);
      }
      const text = textContent.map(row => row.join('\t')).join('\n');
      await navigator.clipboard.writeText(text);
      this.toast('copySuccess');
    } catch (err) {
      this.toast('copyFailedError');
    }
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

  private toast(kind: ToastKind): void {
    this.eventBrokerService.toastRequest.next({ origin: EventOrigin.COST_REPORT_DIALOG, data: kind });
  }

  ngAfterViewInit(): void {
    this.eventBrokerService.costReportRequest.subscribe(_eventInfo => this.dialog.open());
  }
}
