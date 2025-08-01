import { Injectable } from '@angular/core';
import jsPDF from 'jspdf';
import { BridgeService } from '../../shared/services/bridge.service';
import { autoTable } from 'jspdf-autotable';
import { DRAWING_LINE_WIDTH_MM, DRAWING_MARGIN_MM } from './drawings.service';

const FONT_SIZE = 8;
const TABLE_WIDTH = 62;
const HORIZONTAL_PADDING = 0.8;
const VERTICAL_PADDING = 0.5;
const MIN_X_GAP = 10;

@Injectable({ providedIn: 'root' })
export class MemberTablePdfRenderingService {
  constructor(private readonly bridgeService: BridgeService) {}

  /** Draws member tables in the space remaining on the first drawing sheet below the bridge, returning rows not drawn. */
  public drawFirstSheet(doc: jsPDF, startY: number, endY: number): string[][] {
    const availableWidthMm = doc.internal.pageSize.getWidth() - 2 * DRAWING_MARGIN_MM;
    const maxTableCount = Math.trunc((availableWidthMm - MIN_X_GAP) / (TABLE_WIDTH + MIN_X_GAP));
    const rowHeightMm = this.getRowHeightMm(doc);
    const availableHeightMm = Math.max(0, endY - startY);
    const maxRowCount = Math.trunc(availableHeightMm / rowHeightMm) - 2; // -2 for header rows
    const members = this.bridgeService.bridge.members;
    const tableCount = Math.min(maxTableCount, Math.ceil(members.length / maxRowCount));
    const rowCount = Math.min(maxRowCount, Math.ceil(members.length / tableCount));
    const remainingRows = members.map(member => [
      member.number.toString(),
      member.materialShortName,
      member.crossSectionShortName,
      member.shape.name,
      member.length.toFixed(2),
    ]);
    // Chop off table-sized chunks for the first page.
    const chunks: string[][][] = [];
    for (let i = 0; i < tableCount; ++i) {
      chunks.push(remainingRows.splice(0, rowCount));
    }
    const xGap = (availableWidthMm - tableCount * TABLE_WIDTH) / (tableCount + 1);
    let marginOffsetMm = xGap;
    for (const chunk of chunks) {
      this.drawOneTable(doc, chunk, startY, marginOffsetMm);
      marginOffsetMm += xGap + TABLE_WIDTH;
    }
    return remainingRows;
  }

  /** Draws a continuation sheet containing given table rows, returning those not drawn. */
  public drawContinuationSheet(doc: jsPDF, remainingRows: string[][], titleBlockTopY: number): string[][] {
    const availableWidthMm = doc.internal.pageSize.getWidth() - 2 * DRAWING_MARGIN_MM;
    const maxTableCount = Math.trunc((availableWidthMm - MIN_X_GAP) / (TABLE_WIDTH + MIN_X_GAP));
    const rowHeightMm = this.getRowHeightMm(doc);
    const availableHeightMm = Math.max(0, titleBlockTopY - DRAWING_MARGIN_MM);
    const maxRowCount = Math.trunc(availableHeightMm / rowHeightMm) - 2; // -2 for header rows
    const tableCount = Math.min(maxTableCount, Math.ceil(remainingRows.length / maxRowCount));
    const rowCount = Math.min(maxRowCount, Math.ceil(remainingRows.length / tableCount));
    // Chop off table-sized chunks for the page.
    const chunks: string[][][] = [];
    for (let i = 0; i < tableCount; ++i) {
      chunks.push(remainingRows.splice(0, rowCount));
    }
    let marginOffsetMm = 0;
    for (const chunk of chunks) {
      this.drawOneTable(doc, chunk, DRAWING_MARGIN_MM, marginOffsetMm);
      marginOffsetMm += TABLE_WIDTH + MIN_X_GAP;
    }
    return remainingRows;
  }

  private drawOneTable(doc: jsPDF, chunk: string[][], startY: number, marginOffsetMm: number): void {
    autoTable(doc, {
      startY,
      margin: { left: DRAWING_MARGIN_MM + marginOffsetMm },
      theme: 'plain',
      tableWidth: TABLE_WIDTH,
      tableLineColor: 'black',
      tableLineWidth: DRAWING_LINE_WIDTH_MM,
      styles: {
        textColor: 'black',
        lineColor: 'black',
        lineWidth: DRAWING_LINE_WIDTH_MM,
        cellPadding: { right: HORIZONTAL_PADDING, vertical: VERTICAL_PADDING },
        fontSize: FONT_SIZE,
      },
      headStyles: {
        fillColor: 'white',
        textColor: 'black',
        fontStyle: 'normal',
        valign: 'middle',
        halign: 'center',
        cellPadding: { horizontal: HORIZONTAL_PADDING, vertical: VERTICAL_PADDING },
      },
      columnStyles: {
        0: { halign: 'right' },
        1: { halign: 'center' },
        2: { overflow: 'linebreak', cellWidth: 12, halign: 'center' },
        3: { halign: 'center', cellWidth: 17.5 },
        4: { halign: 'right' },
      },
      head: [['#', 'Material', 'Cross- section', 'Size (mm)', 'Length']],
      body: chunk,
    });
  }

  private getRowHeightMm(doc: jsPDF) {
    const fontSize = FONT_SIZE;
    const textHeight = doc.getTextDimensions('#MaterialCrossSizeLength0', { fontSize }).h * doc.getLineHeightFactor();
    return textHeight + 2 * VERTICAL_PADDING + DRAWING_LINE_WIDTH_MM;
  }
}
