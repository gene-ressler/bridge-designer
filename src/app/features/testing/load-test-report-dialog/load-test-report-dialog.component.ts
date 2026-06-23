/* Copyright (c) 2025-2026 Gene Ressler
   SPDX-License-Identifier: GPL-3.0-or-later */

import { CommonModule } from '@angular/common';
import { AfterViewInit, ChangeDetectionStrategy, ChangeDetectorRef, Component, ViewChild } from '@angular/core';
import { jqxWindowComponent, jqxWindowModule } from 'jqwidgets-ng/jqxwindow';
import { jqxButtonModule } from 'jqwidgets-ng/jqxbuttons';
import { BridgeService } from '../../../shared/services/bridge.service';
import { EventBrokerService, EventOrigin } from '../../../shared/services/event-broker.service';
import jsPDF from 'jspdf';
import { autoTable, HookData } from 'jspdf-autotable';
import { Member } from '../../../shared/classes/member.model';
import { WidgetHelper } from '../../../shared/classes/widget-helper';

@Component({
  selector: 'load-test-report-dialog',
  imports: [CommonModule, jqxWindowModule, jqxButtonModule],
  templateUrl: './load-test-report-dialog.component.html',
  styleUrl: './load-test-report-dialog.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class LoadTestReportDialogComponent implements AfterViewInit{
  @ViewChild('dialog') dialog!: jqxWindowComponent;
  private changeToken: string = '';

  constructor(
    readonly bridgeService: BridgeService,
    private readonly changeDetector: ChangeDetectorRef,
    private readonly eventBrokerService: EventBrokerService,
  ) {}

  async handleCopy(): Promise<void> {
    WidgetHelper.copyToClipboard(
      () => getLoadTestReportText(this.bridgeService.bridge.members),
      this.eventBrokerService,
      EventOrigin.LOAD_TEST_REPORT_DIALOG,
    );
  }

  handleDialogOpen(): void {
    this.changeToken += 'change';
    this.changeDetector.detectChanges();
    this.changeToken = '';
  }

  handlePrint(): void {
    const doc = new jsPDF({ format: 'letter', orientation: 'portrait' });
    autoTable(doc, {
      html: '.test-report-member-table',
      styles: { fontSize: 8 },
      useCss: true,
      didDrawPage: (data: HookData) => {
        doc.setFontSize(8);
        var pageHeight = doc.internal.pageSize.getHeight();
        doc.text(`Page ${data.pageNumber}`, data.settings.margin.left, pageHeight - 10);
      },
    });
    const blob = doc.output('blob');
    const url = URL.createObjectURL(blob);
    window.open(url, '_blank');
  }

  ngAfterViewInit(): void {
    this.eventBrokerService.analysisReportRequest.subscribe(() => this.dialog.open());
  }
}

function getLoadTestReportText(members: Member[]): string {
  const lines: string[] = [
    '#\tMaterial\tCross-section\tSize (mm)\tLength (m)\tSlenderness\tCompression force\t' +
      'Compression strength\tCompression status\tTension force\tTension strength\tTension status',
  ];
  for (const m of members) {
    const line =
      `${m.number}\t${m.materialShortName}\t${m.crossSectionShortName}\t${m.materialSizeMm}\t` +
      `${m.lengthM}\t${m.slenderness}\t${m.maxCompression}\t${m.compressionStrength}\t` +
      `${m.compressionStatus}\t${m.maxTension}\t${m.tensionStrength}\t${m.tensionStatus}`;
    lines.push(line);
  }
  return lines.join('\n');
}
