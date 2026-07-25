/* Copyright (c) 2025-2026 Gene Ressler
   SPDX-License-Identifier: GPL-3.0-or-later */

import { Injectable } from '@angular/core';
import { BridgeService } from '../../shared/services/bridge.service';
import jsPDF from 'jspdf';
import autoTable, { RowInput, Styles } from 'jspdf-autotable';
import { DRAWING_LINE_WIDTH_MM, DRAWING_MARGIN_MM } from './drawings.service';
import { BridgeCostService } from '../../shared/services/bridge-cost.service';
import { DOLLARS_FORMATTER, Utility } from '../../shared/classes/utility';
import { SaveMarkService } from '../save-load/save-mark.service';
import { AnalysisService } from '../../shared/services/analysis.service';
import { AnalysisValidityService } from '../controls/management/analysis-validity.service';

const ANALYSIS_STATUS_DESCRIPTIONS: string[] = [
  '<none>',
  'member slenderness exceeds maximum',
  'structure unstable',
  'fails load test',
  'passes all tests',
];

@Injectable({ providedIn: 'root' })
export class TitleBlockPdfRenderingService {
  constructor(
    private readonly analysisService: AnalysisService,
    private readonly analysisValidityService: AnalysisValidityService,
    private readonly bridgeCostService: BridgeCostService,
    private readonly bridgeService: BridgeService,
    private readonly saveMarkService: SaveMarkService,
  ) {}

  /** Draws the title block and returns the y-coordinate of its top edge. */
  public draw(doc: jsPDF, sheetName: string = 'Main Truss Elevation (meters)', sheetNumber: number = 1): number {
    const projectName = this.bridgeService.bridge.projectName;
    const designedBy = this.bridgeService.bridge.designedBy;
    const savedFileName = this.saveMarkService.savedFileName;
    const status = this.analysisService.status;
    const body: RowInput[] = [
      /\S/.test(projectName)
        ? [
            {
              content: projectName,
              colSpan: 4,
              styles: { halign: 'center' } satisfies Partial<Styles>,
            },
          ]
        : null,
      [
        {
          content: sheetName,
          colSpan: 3,
        },
        `Sheet: ${sheetNumber}`,
      ],
      [
        {
          content: `Cost: ${DOLLARS_FORMATTER.format(this.bridgeCostService.allCosts)}`,
          colSpan: 2,
        },
        `Date: ${Utility.getStandardDate()}`,
        `Iteration: ${this.bridgeService.bridge.iterationNumber}`,
      ],
      /\S/.test(designedBy)
        ? [
            'Designed by:',
            {
              content: designedBy,
              colSpan: 3,
            },
          ]
        : null,
      [
        'Project ID:',
        {
          content: this.bridgeService.bridge.taggedProjectId,
          colSpan: 3,
        },
      ],
      savedFileName !== undefined
        ? [
            'File:',
            {
              content: savedFileName,
              colSpan: 3,
            },
          ]
        : null,

      [
        'Status:',
        {
          content: this.analysisValidityService.isLastAnalysisValid
            ? ANALYSIS_STATUS_DESCRIPTIONS[status]
            : 'no valid analysis',
          colSpan: 3,
        },
      ],
    ].filter((item): item is NonNullable<typeof item> => item !== null); // remove nulls and adjust type

    const fontSize = 8;
    const horizontalPadding = 0.8;
    const verticalPadding = 0.5;
    const textHeight = doc.getTextDimensions('#MaterialCrossSizeLength0', { fontSize }).h * doc.getLineHeightFactor();
    const rowHeightMm = textHeight + 2 * verticalPadding + DRAWING_LINE_WIDTH_MM;
    const blockHeight = rowHeightMm * body.length;
    const pageSize = doc.internal.pageSize;
    const startY = pageSize.getHeight() - blockHeight - DRAWING_MARGIN_MM;
    const width0 = 18;
    const width1 = 10;
    const width2 = 28;
    const width3 = 20;
    const blockWidth = width0 + width1 + width2 + width3 + 4 * DRAWING_LINE_WIDTH_MM;
    autoTable(doc, {
      startY,
      margin: { left: pageSize.getWidth() - DRAWING_MARGIN_MM - blockWidth, bottom: DRAWING_MARGIN_MM },
      theme: 'plain',
      tableWidth: 'wrap',
      tableLineColor: 'black',
      tableLineWidth: DRAWING_LINE_WIDTH_MM,
      styles: {
        textColor: 'black',
        lineColor: 'black',
        lineWidth: DRAWING_LINE_WIDTH_MM,
        cellPadding: { horizontal: horizontalPadding, vertical: verticalPadding },
        fontSize,
      },
      columnStyles: {
        0: { cellWidth: width0, lineWidth: { bottom: DRAWING_LINE_WIDTH_MM } },
        1: { cellWidth: width1, lineWidth: { bottom: DRAWING_LINE_WIDTH_MM } },
        2: { cellWidth: width2 },
        3: { cellWidth: width3 },
      },
      body,
    });
    return startY;
  }
}
