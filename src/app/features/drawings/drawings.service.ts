import { Injectable } from '@angular/core';
import { jsPDF } from 'jspdf';
import { EventBrokerService } from '../../shared/services/event-broker.service';
import { BridgePdfRenderingService } from './bridge-pdf-rendering.service';
import { MemberTablePdfRenderingService } from './member-table-pdf-rendering.service';
import { TitleBlockPdfRenderingService } from './title-block-pdf-rendering.service';

export const DRAWING_MARGIN_MM = 25.4 * 0.5;
export const DRAWING_LINE_WIDTH_MM = 0.1;
const DRAWING_SEPARATION = 25.4 * 0.3;

@Injectable({ providedIn: 'root' })
export class DrawingsService {
  constructor(
    private readonly bridgePdfRenderingService: BridgePdfRenderingService,
    eventBrokerService: EventBrokerService,
    private readonly memberTablePdfRenderingService: MemberTablePdfRenderingService,
    private readonly titleBlockPdfRenderingService: TitleBlockPdfRenderingService,
  ) {
    eventBrokerService.printRequest.subscribe(() => {
      this.createPDF();
    });
  }

  public createPDF(): jsPDF {
    const doc = new jsPDF({ format: 'letter', orientation: 'landscape' });
    // Becomes title of PDF preview window.
    doc.setProperties({title: 'Bridge Drawing'});

    // Render the first sheet.
    const drawingBottomY = this.bridgePdfRenderingService.draw(doc);
    const titleBlockTopY = this.titleBlockPdfRenderingService.draw(doc);
    let remainingRows = this.memberTablePdfRenderingService.drawFirstSheet(doc, drawingBottomY + DRAWING_SEPARATION, titleBlockTopY);

    // Render continuations of the member table while data still remains.
    let sheetNumber = 2;
    while (remainingRows.length > 0) {
      doc.addPage();
      const titleBlockTopY = this.titleBlockPdfRenderingService.draw(doc, "Main Truss Elevation (meters), continued", sheetNumber)
      remainingRows = this.memberTablePdfRenderingService.drawContinuationSheet(doc, remainingRows, titleBlockTopY);
    }

    // Build a PDF file and preview it. Assumes the browser has a PDF viewer linked to the MIME type.
    const blob = doc.output('blob');
    // This makes a funky random string. Specifying the name requires a hack that doesn't look robust.
    const url = URL.createObjectURL(blob);
    window.open(url, '_blank');
    return doc;
  }
}
