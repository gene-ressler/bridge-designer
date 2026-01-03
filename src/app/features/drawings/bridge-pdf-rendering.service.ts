/* Copyright (c) 2025-2026 Gene Ressler
   SPDX-License-Identifier: GPL-3.0-or-later */

import { Injectable } from '@angular/core';
import { BridgeService } from '../../shared/services/bridge.service';
import { Member } from '../../shared/classes/member.model';
import jsPDF, { TilingPattern } from 'jspdf';
import { Gusset, GussetsService } from '../../shared/services/gussets.service';
import { DRAWING_LINE_WIDTH_MM, DRAWING_MARGIN_MM } from './drawings.service';
import { AbutmentSide, SiteRenderingHelper2D } from '../../shared/classes/site-rendering-helper-2d';
import { Point2D, Point2DInterface, Rectangle2DInterface } from '../../shared/classes/graphics';
import { DesignConditions } from '../../shared/services/design-conditions.service';
import { MemberLabelPositionService } from '../../shared/services/member-label-position.service';

const DIMENSION_GAP = 4;
const DIMENSION_EXTENSION = 1.5;
const SUPPORT_HALF_WIDTH = 2.5;

/** Renderer for the bridge structure at the top of a PDF page. */
@Injectable({ providedIn: 'root' })
export class BridgePdfRenderingService {
  private scale: number = 1;
  private translateX: number = 0;
  private translateY: number = 0;
  private labelPositions!: Float64Array;

  constructor(
    private readonly bridgeService: BridgeService,
    private readonly memberLabelPositionService: MemberLabelPositionService,
    private readonly gussetsService: GussetsService,
  ) {}

  /**
   * Makes the bridge drawing at the top of the page and returns a y-coordinate for drawing to continue.
   *
   * Drawing coordinates are millimeters on the page, origin upper left (courtesy jsPDF).
   */
  public draw(doc: jsPDF): number {
    // Determine drawing box for bridge and set transformation. Find two scales causing the dimensioned
    // bridge to fill the page width and a fixed fraction of the height. Use the smaller of the two.
    const bridgeExtent = this.bridgeService.getWorldExtent();
    const verticalDimensionCount = bridgeExtent.y0 < 0 && bridgeExtent.y0 + bridgeExtent.height > 0 ? 2 : 1;
    const verticalDimensionMargin = SUPPORT_HALF_WIDTH + verticalDimensionCount * DIMENSION_GAP;
    const pageWidth = doc.internal.pageSize.getWidth();
    const drawingWidthMm = pageWidth - 2 * (DRAWING_MARGIN_MM + verticalDimensionMargin);
    const drawingHeightMm = doc.internal.pageSize.getHeight() * 0.5 - DRAWING_MARGIN_MM;
    this.scale = Math.min(drawingWidthMm / bridgeExtent.width, drawingHeightMm / bridgeExtent.height);
    this.translateX = 0.5 * (pageWidth - this.scale * bridgeExtent.width) - bridgeExtent.x0 * this.scale;
    this.translateY = DRAWING_MARGIN_MM + this.scale * (bridgeExtent.height + bridgeExtent.y0);
    // Set drawing environment.
    doc.setLineWidth(DRAWING_LINE_WIDTH_MM);
    this.setUpTilingPatterns(doc);
    // Get non-overlapping label positions.
    this.labelPositions = this.memberLabelPositionService.labelPositions;
    // Draw. Order matters.
    this.bridgeService.bridge.members.forEach(member => this.drawMember(doc, member));
    const suppportsBottomY = this.drawSupports(doc);
    this.gussetsService.createGussets().forEach(gusset => this.drawJoint(doc, gusset));
    this.bridgeService.bridge.members.forEach(member => this.drawMemberLabel(doc, member));
    const dimensionsY = DIMENSION_GAP + Math.max(this.tY(bridgeExtent.y0), suppportsBottomY);
    this.drawVerticalDimensions(doc, bridgeExtent);
    return DIMENSION_GAP + this.drawHorizontalDimensions(doc, dimensionsY);
  }

  /** Draws the supports of the current bridge, returning bottom-most y-coordinate.*/
  private drawSupports(doc: jsPDF): number {
    let bottomY = 0;
    function accumulateBottomY(y: number): void {
      if (y > bottomY) {
        bottomY = y;
      }
    }
    // Use detail renderers for supports that draw anchor constraint symbols only.
    const renderArchAbutment = (location: Point2DInterface, _side: AbutmentSide, archHeight: number): void => {
      accumulateBottomY(this.drawOneSupport(doc, new Point2D(location.x, location.y + archHeight), 2));
    };
    const renderStandardAbutment = (location: Point2DInterface, _side: AbutmentSide, constraintCount: number): void => {
      accumulateBottomY(this.drawOneSupport(doc, location, constraintCount));
    };
    const renderPier = (location: Point2DInterface, _height: number): void => {
      accumulateBottomY(this.drawOneSupport(doc, location, 2));
    };
    // Invoke detail handlers to draw anchors for abutments and pier, if any.
    SiteRenderingHelper2D.renderAbutmentsAndPier(this.bridgeService.designConditions, {
      renderArchAbutment,
      renderStandardAbutment,
      renderPier,
    });
    // Cable anchorages, if any.
    accumulateBottomY(this.maybeDrawCableAnchorage(doc, this.bridgeService.designConditions.leftAnchorageJointIndex));
    accumulateBottomY(this.maybeDrawCableAnchorage(doc, this.bridgeService.designConditions.rightAnchorageJointIndex));
    return bottomY;
  }

  /** Draws the cable anchorage at the given index if it's valid, returning it's bottom coordinate, else zero. */
  private maybeDrawCableAnchorage(doc: jsPDF, jointIndex: number): number {
    return jointIndex >= 0 ? this.drawOneSupport(doc, this.bridgeService.bridge.joints[jointIndex], 2) : 0;
  }

  /** Draws one joint support with a symbol denoting its constraints, returning bottom y-coordinate. */
  private drawOneSupport(doc: jsPDF, point: Point2DInterface, constraintCount: number): number {
    const halfWidth = 2;
    const height = Math.sqrt(12);
    const x = this.tX(point.x);
    const y = this.tY(point.y);
    const path = [
      { op: 'm', c: [x - halfWidth, y + height] },
      { op: 'l', c: [x + halfWidth, y + height] },
      { op: 'l', c: [x, y] },
      { op: 'h' },
    ];
    doc.setFillColor('white');
    doc.path(path).fillStroke();
    const x0 = x - SUPPORT_HALF_WIDTH;
    const x1 = x + SUPPORT_HALF_WIDTH;
    const y0 = y + height;
    const r = 0.4;
    const hatchHeight = 1.5;
    doc.line(x0, y0, x1, y0);
    switch (constraintCount) {
      case 1:
        const rollersHalfWidth = 1.6875;
        const rollersGap = (2 * rollersHalfWidth) / 3;
        for (let dx = -rollersHalfWidth; dx <= rollersHalfWidth; dx += rollersGap) {
          doc.circle(x + dx, y0 + r, r);
        }
        const y1 = y0 + 2 * r;
        doc.line(x0, y1, x1, y1);
        hatchEarth(y1);
        return y1 + hatchHeight;
      case 2:
        hatchEarth(y0);
        return y0 + hatchHeight;
    }
    throw new Error(`Unexpected constraint count: ${constraintCount}`);

    /** Draws a little rectangle filled with the earth hatch pattern. */
    function hatchEarth(y: number) {
      doc.rect(x0, y, 2 * SUPPORT_HALF_WIDTH, hatchHeight, null).fill({
        key: 'hatch',
        xStep: x0 - 2 * Math.floor(x0 * 0.5), // shift for similar appearance
        yStep: y - 2 * Math.floor(y * 0.5),
      });
    }
  }

  /** Draws a joint as a gusset and pin. */
  private drawJoint(doc: jsPDF, gusset: Gusset): void {
    const joint = gusset.joint;
    // Gusset hull.
    const hullPoints = gusset.hull.map(offset => [this.tX(offset.x + joint.x), this.tY(offset.y + joint.y)]);
    const path = [{ op: 'm', c: hullPoints[0] }, hullPoints.slice(1).map(c => ({ op: 'l', c })), { op: 'h' }].flat();
    doc.setFillColor('white');
    doc.path(path).fillStroke();
    // Pin.
    doc.circle(this.tX(joint.x), this.tY(joint.y), 0.04 * this.scale, 'FD');
  }

  /** Draws a single member as a pair of lines. */
  private drawMember(doc: jsPDF, member: Member): void {
    const length = member.lengthM;
    const halfWidth = member.materialSizeMm * 0.0005;
    const ax = member.a.x;
    const ay = member.a.y;
    const bx = member.b.x;
    const by = member.b.y;
    const ux = (bx - ax) / length;
    const uy = (by - ay) / length;
    const perpDx = -uy * halfWidth;
    const perpDy = ux * halfWidth;

    // Draw box parallel to member axis offset by half width. Fill for appearance of crossing members.
    const path = [
      {op: 'm', c: [this.tX(ax + perpDx), this.tY(ay + perpDy)]},
      {op: 'l', c: [this.tX(bx + perpDx), this.tY(by + perpDy)]},
      {op: 'l', c: [this.tX(bx - perpDx), this.tY(by - perpDy)]},
      {op: 'l', c: [this.tX(ax - perpDx), this.tY(ay - perpDy)]},
      {op: 'h'}
    ];
    doc.setFillColor('white');
    doc.path(path).fillStroke();
  }

  /** Draws a single member number label. */
  private drawMemberLabel(doc: jsPDF, member: Member): void {
    // Label at center in a filled rectangle.
    const length = member.lengthM;
    const ax = member.a.x;
    const ay = member.a.y;
    const ux = (member.b.x - ax) / length;
    const uy = (member.b.y - ay) / length;
    const labelPosition = this.labelPositions[member.index]; // distance from a
    const labelX = ax + ux * labelPosition;
    const labelY = ay + uy * labelPosition;
    const labelText = member.number.toString();
    doc.setFontSize(6);
    const { w, h } = doc.getTextDimensions(labelText);
    const labelWidth = w + 0.8; // 0.4mm margin each side
    const labelHeight = h + 0.6; // 0.3mm margin top and bottom
    doc.setFillColor('white');
    doc.rect(this.tX(labelX) - labelWidth * 0.5, this.tY(labelY) - labelHeight * 0.5, labelWidth, labelHeight, 'FD');
    doc.text(labelText, this.tX(labelX), this.tY(labelY), { align: 'center', baseline: 'middle' });
  }

  /**
   * Draws horizontal dimension lines starting at given y and working downward, returning bottom-most y.
   * ```
   *   /\
   * _/__\__
   * //////   provided bottom of bridge drawing box
   *   |
   *   |  dimension gap
   *   |<------
   *   |
   *   |  dimension gap
   *   |<------
   *
   * ```
   */
  private drawHorizontalDimensions(doc: jsPDF, yMm: number): number {
    const joints = this.bridgeService.bridge.joints;
    // Left and right extents in world and drawing mm coords may be modified later for anchorages.
    let leftX = joints[0].x;
    let rightX = joints[this.bridgeService.designConditions.panelCount].x;
    let leftMm = this.tX(leftX);
    let rightMm = this.tX(rightX);
    const pierJointIndex = this.bridgeService.designConditions.pierJointIndex;
    const spanLength = this.bridgeService.designConditions.panelCount * DesignConditions.PANEL_SIZE_WORLD;
    if (pierJointIndex >= 0) {
      const pierJoint = this.bridgeService.bridge.joints[pierJointIndex];
      const pierXMm = this.tX(pierJoint.x);
      const leftSpanLength = pierJoint.x;
      this.drawHorizontalDimension(doc, leftMm, pierXMm, yMm, leftSpanLength);
      this.drawHorizontalDimension(doc, pierXMm, rightMm, yMm, spanLength - leftSpanLength);
    } else {
      this.drawHorizontalDimension(doc, leftMm, rightMm, yMm, spanLength);
    }
    let dimensionCount = 0;
    const leftAnchorageIndex = this.bridgeService.designConditions.leftAnchorageJointIndex;
    if (leftAnchorageIndex >= 0) {
      const anchorageX = joints[leftAnchorageIndex].x;
      const anchorageXMm = this.tX(anchorageX);
      this.drawHorizontalDimension(doc, anchorageXMm, leftMm, yMm, leftX - anchorageX);
      leftX = anchorageX;
      leftMm = anchorageXMm;
      ++dimensionCount;
    }
    const rightAnchorageIndex = this.bridgeService.designConditions.rightAnchorageJointIndex;
    if (rightAnchorageIndex >= 0) {
      const anchorageX = joints[rightAnchorageIndex].x;
      const anchorageXMm = this.tX(anchorageX);
      this.drawHorizontalDimension(doc, rightMm, anchorageXMm, yMm, anchorageX - rightX);
      rightX = anchorageX;
      rightMm = anchorageXMm;
      ++dimensionCount;
    }
    // Add overall dimension if more than one was drawn above.
    if (dimensionCount > 1) {
      yMm += DIMENSION_GAP;
      this.drawHorizontalDimension(doc, leftMm, rightMm, yMm, rightX - leftX);
    }
    return yMm;
  }

  /** Draws vertical dimension lines left of given bridge extent.  */
  private drawVerticalDimensions(doc: jsPDF, bridgeExtent: Rectangle2DInterface): void {
    let xMm = this.tX(bridgeExtent.x0) - SUPPORT_HALF_WIDTH - DIMENSION_GAP;
    const y1 = bridgeExtent.y0 + bridgeExtent.height;
    let topYMm = this.tY(y1);
    let deckYMm = this.tY(0);
    let bottomYMm = this.tY(bridgeExtent.y0);
    let dimensionCount = 0;
    if (y1 > 0) {
      this.drawVerticalDimension(doc, topYMm, deckYMm, xMm, y1);
      ++dimensionCount;
    }
    if (bridgeExtent.y0 < 0) {
      this.drawVerticalDimension(doc, deckYMm, bottomYMm, xMm, -bridgeExtent.y0);
      ++dimensionCount;
    }
    // Add overall dimension if more than one was drawn above.
    if (dimensionCount > 1) {
      xMm -= DIMENSION_GAP;
      // Position outer label at midpoint between inner ones to prevent overlaps.
      const labelY = 0.25 * (2 * deckYMm + topYMm + bottomYMm);
      this.drawVerticalDimension(doc, topYMm, bottomYMm, xMm, bridgeExtent.height, labelY);
    }
  }

  /** Draws a single horizontal dimension with given millimeter coordinates.  */
  private drawHorizontalDimension(doc: jsPDF, axMm: number, bxMm: number, dimensionY: number, distanceM: number): void {
    this.drawArrowHead(doc, axMm, dimensionY, bxMm, dimensionY);
    this.drawArrowHead(doc, bxMm, dimensionY, axMm, dimensionY);
    doc.line(axMm, dimensionY, bxMm, dimensionY);
    const extensionY0 = dimensionY - DIMENSION_GAP;
    doc.line(axMm, extensionY0, axMm, dimensionY + DIMENSION_EXTENSION);
    doc.line(bxMm, extensionY0, bxMm, dimensionY + DIMENSION_EXTENSION);
    const lengthText = distanceM.toFixed(2);
    doc.setFontSize(6);
    const { w, h } = doc.getTextDimensions(lengthText);
    const labelWidth = w + 0.8; // 0.4mm margin each side
    const labelHeight = h + 0.6; // 0.3mm margin top and bottom
    doc.setFillColor('white');
    const labelX = (axMm + bxMm) * 0.5;
    doc.rect(labelX - labelWidth * 0.5, dimensionY - labelHeight * 0.5, labelWidth, labelHeight, 'F');
    doc.text(lengthText, labelX, dimensionY, { align: 'center', baseline: 'middle' });
  }

  /** Draws a single vertical dimension with given millimeter coordinates. */
  private drawVerticalDimension(
    doc: jsPDF,
    ayMm: number,
    byMm: number,
    dimensionX: number,
    distanceM: number,
    labelY: number = (ayMm + byMm) * 0.5,
  ): void {
    this.drawArrowHead(doc, dimensionX, ayMm, dimensionX, byMm);
    this.drawArrowHead(doc, dimensionX, byMm, dimensionX, ayMm);
    doc.line(dimensionX, ayMm, dimensionX, byMm);
    const extensionX0 = dimensionX + DIMENSION_GAP;
    doc.line(extensionX0, ayMm, dimensionX - DIMENSION_EXTENSION, ayMm);
    doc.line(extensionX0, byMm, dimensionX - DIMENSION_EXTENSION, byMm);
    const lengthText = distanceM.toFixed(2);
    doc.setFontSize(6);
    const { w, h } = doc.getTextDimensions(lengthText);
    const labelWidth = w + 0.8; // 0.4mm margin each side
    const labelHeight = h + 0.6; // 0.3mm margin top and bottom
    doc.setFillColor('white');
    doc.rect(dimensionX - labelWidth * 0.5, labelY - labelHeight * 0.5, labelWidth, labelHeight, 'F');
    doc.text(lengthText, dimensionX, labelY, { align: 'center', baseline: 'middle' });
  }

  /** Draws a filled arrow head at head of given line segment. */
  private drawArrowHead(doc: jsPDF, headX: number, headY: number, tailX: number, tailY: number): void {
    const halfWidth = 0.75;
    const headLength = 3;
    const headInnerLength = 2;
    let dx = headX - tailX;
    let dy = headY - tailY;
    const length = Math.hypot(dx, dy);
    dx /= length;
    dy /= length;
    const perpX = -dy * halfWidth;
    const perpY = dx * halfWidth;
    const baseX = headX - dx * headLength;
    const baseY = headY - dy * headLength;
    const innerBaseX = headX - dx * headInnerLength;
    const innerBaseY = headY - dy * headInnerLength;
    const path = [
      { op: 'm', c: [headX, headY] },
      { op: 'l', c: [baseX + perpX, baseY + perpY] },
      { op: 'l', c: [innerBaseX, innerBaseY] },
      { op: 'l', c: [baseX - perpX, baseY - perpY] },
      { op: 'h' },
    ];
    doc.setFillColor('black');
    doc.path(path).fill();
  }

  /** Attaches useful tiling patterns to the given document. */
  private setUpTilingPatterns(doc: jsPDF): void {
    doc.advancedAPI(ctx => {
      const pattern = new TilingPattern([0, 0, 2, 2], 2, 2);
      ctx.beginTilingPattern(pattern);
      ctx.setLineWidth(DRAWING_LINE_WIDTH_MM);
      const path = [
        { op: 'm', c: [0, 1] },
        { op: 'l', c: [1, 2] },
        { op: 'm', c: [1, 0] },
        { op: 'l', c: [2, 1] },
      ];
      ctx.path(path).stroke();
      ctx.endTilingPattern('hatch', pattern);
    });
  }
  private tX(x: number): number {
    return x * this.scale + this.translateX;
  }

  private tY(y: number): number {
    return y * -this.scale + this.translateY;
  }
}
