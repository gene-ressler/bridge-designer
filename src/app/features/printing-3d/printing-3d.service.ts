/* Copyright (c) 2025-2026 Gene Ressler
   SPDX-License-Identifier: GPL-3.0-or-later */

import { Injectable } from '@angular/core';
import { ErrorStatus, Manifold, Mesh, Vec3 } from 'manifold-3d';
import { cleanup } from 'manifold-3d/lib/garbage-collector.js';
import { Mat2x3, Print3dModelService } from './print-3d-model.service';

/** Information about a printable model provided to user as feedback. */
export class Print3dModelInfo {
  constructor(
    public printWidth: number = 0,
    public maxWidthPart: string = '<none>',
    public printDepth: number = 0,
    public maxDepthPart: string = '<none>',
    public printHeight: number = 0,
    public maxHeightPart: string = '<none>',
  ) {}

  mergeManifold(manifold: Manifold, part: string): void {
    const bb = manifold.boundingBox();
    this.mergeWidth(bb.max[0] - bb.min[0], part);
    this.mergeDepth(bb.max[1] - bb.min[1], part);
    this.mergeHeight(bb.max[2] - bb.min[2], part);
  }

  /** Returns new info that's this info with a scale factor applied to the sizes. */
  applyScale(scale: number): Print3dModelInfo {
    return new Print3dModelInfo(
      this.printWidth * scale,
      this.maxWidthPart,
      this.printDepth * scale,
      this.maxDepthPart,
      this.printHeight * scale,
      this.maxHeightPart,
    );
  }

  private mergeWidth(width: number, part: string): void {
    if (width > this.printWidth) {
      this.printWidth = width;
      this.maxWidthPart = part;
    }
  }

  private mergeDepth(depth: number, part: string): void {
    if (depth > this.printDepth) {
      this.printDepth = depth;
      this.maxDepthPart = part;
    }
  }

  private mergeHeight(height: number, part: string): void {
    if (height > this.printHeight) {
      this.printHeight = height;
      this.maxHeightPart = part;
    }
  }
}

/**
 * State of the OBJ file formatter `getObjText(mesh)` allowing several of
 * its return values to be concatenated in a single file.
 */
class ObjFileContext {
  normalIndices: { [key: string]: number } = {};
  baseVertexIndex: number = 0;
  nextNormalIndex: number = 0;
}

@Injectable({ providedIn: 'root' })
export class Printing3dService {
  constructor(private readonly print3dModelService: Print3dModelService) {}

  /**
   * Returns model info for the current bridge with a scale factor of 1mm/M.
   * This can be scaled with a true value of `modelMmPerWorldM` to get a close
   * estimates of actual model size.
   */
  public async getUnscaledModelInfo(): Promise<Print3dModelInfo> {
    await this.print3dModelService.initialize();
    const modelMmPerWorldM = 1;
    const gmy = this.print3dModelService.getGeometry(modelMmPerWorldM, 0.1, 0);
    // Compute only objects that could possibly establish the max sizes.
    const xform: Mat2x3 = [modelMmPerWorldM, 0, 0, modelMmPerWorldM, 0, 0];
    const truss = throwIfEmpty(this.print3dModelService.buildTruss(gmy, xform), 'unit truss');
    const info = new Print3dModelInfo();
    info.mergeManifold(truss, 'truss');
    const leftAbutment = throwIfEmpty(this.print3dModelService.buildAbutment(gmy, 0), 'unit abutment');
    info.mergeManifold(leftAbutment, 'abutment');
    if (this.print3dModelService.isPier) {
      const pier = throwIfEmpty(this.print3dModelService.buildPier(gmy, 0), 'unit pier');
      info.mergeManifold(pier, 'pier');
    }
    cleanup(); // Free manifold memory.
    return Promise.resolve(info);
  }

  public async emit3dPrint(
    modelMmPerWorldM: number,
    minFeatureSize: number,
    wiggle: number,
    baseFileName: string,
  ): Promise<void> {
    // Load Manifold.
    await this.print3dModelService.initialize();

    const gmy = this.print3dModelService.getGeometry(modelMmPerWorldM, minFeatureSize, wiggle);

    // ---- Trusses ----

    const trussesText: string[] = [];
    const trussesContext = new ObjFileContext();

    const xform: Mat2x3 = [modelMmPerWorldM, 0, 0, modelMmPerWorldM, 0, 0];
    const frontTruss = throwIfEmpty(this.print3dModelService.buildTruss(gmy, xform), 'front truss');

    this.saveMeshAndFree(frontTruss, 'FrontTruss', trussesText, trussesContext);

    const trussBoundingBox = frontTruss.boundingBox();
    const tBbDx = trussBoundingBox.max[0] - trussBoundingBox.min[0];
    const tBbDy = trussBoundingBox.max[1] - trussBoundingBox.min[1];

    // Place second truss in row or column depending on largest dimension.
    const rearTrussXform: Mat2x3 =
      tBbDx > tBbDy
        ? [modelMmPerWorldM, 0, 0, -modelMmPerWorldM, 0, 2 * trussBoundingBox.min[1] - minFeatureSize]
        : [modelMmPerWorldM, 0, 0, -modelMmPerWorldM, tBbDx + minFeatureSize, trussBoundingBox.min[1]];

    const rearTruss = throwIfEmpty(this.print3dModelService.buildTruss(gmy, rearTrussXform), 'rear truss');

    this.saveMeshAndFree(rearTruss, 'RearTruss', trussesText, trussesContext);
    this.downloadObjFileText(trussesText, baseFileName, 'trusses');

    // ---- Placement control ----

    const gap = 0.5;
    let placementX = 0;
    // Advances the placement x-coordinate by width of given manifold to separate parts.
    const advancePlacementX = (manifold: Manifold): number => {
      const bb = manifold.boundingBox();
      return (placementX += bb.max[0] - bb.min[0] + gap);
    };

    // ---- Abutments ----

    const abutmentsText: string[] = [];
    const abutmentsContext = new ObjFileContext();

    const leftAbutment = throwIfEmpty(
      this.print3dModelService.isLeftAnchorage
        ? this.print3dModelService.buildAbutmentWithAnchorage(gmy, placementX)
        : this.print3dModelService.buildAbutment(gmy, placementX),
      'left abutment',
    );
    advancePlacementX(leftAbutment);
    this.saveMeshAndFree(leftAbutment, 'LeftAbutment', abutmentsText, abutmentsContext);

    const rightAbutment = throwIfEmpty(
      this.print3dModelService.isRightAnchorage
        ? this.print3dModelService.buildAbutmentWithAnchorage(gmy, placementX)
        : this.print3dModelService.buildAbutment(gmy, placementX),
      'right abutment',
    );
    advancePlacementX(rightAbutment);
    this.saveMeshAndFree(rightAbutment, 'RightAbutment', abutmentsText, abutmentsContext);

    // ---- Pier ----

    if (this.print3dModelService.isPier) {
      const pier = throwIfEmpty(this.print3dModelService.buildPier(gmy, placementX), 'pier');
      advancePlacementX(pier);
      this.saveMeshAndFree(pier, 'Pier', abutmentsText, abutmentsContext);
    }
    this.downloadObjFileText(abutmentsText, baseFileName, 'abutments');

    // ---- Cross members

    const crossMembersText: string[] = [];
    const crossMembersContext = new ObjFileContext();
    placementX = 0;
    let placementY = 0;
    const memberIter = this.print3dModelService.crossMemberJointsIterator();
    for (let iteration = memberIter.next(); !iteration.done; iteration = memberIter.next()) {
      const joint = iteration.value;
      const crossMember = throwIfEmpty(
        this.print3dModelService.buildCrossMember(gmy, iteration.value, placementX, placementY),
        `cross-member ${joint.number}`,
      );
      advancePlacementX(crossMember);
      this.saveMeshAndFree(crossMember, `CrossMember_${joint.number}`, crossMembersText, crossMembersContext);
    }

    // ---- Deck panels
    placementX = 0;
    placementY += gmy.modelMmPerWorldM * gmy.bridgeWidth + gap;
    const panelIter = this.print3dModelService.deckPanelJointsIterator();
    const middleJointIndex = this.print3dModelService.deckPanelCount >>> 1;
    for (let iteration = panelIter.next(); !iteration.done; iteration = panelIter.next()) {
      const joint = iteration.value;
      const panel = throwIfEmpty(
        this.print3dModelService.buildDeckPanel(gmy, joint, placementX, placementY),
        `deck panel ${joint.number}`,
      );
      // Place in two rows.
      if (joint.index === middleJointIndex) {
        placementX = 0;
        placementY += gmy.modelMmPerWorldM * gmy.roadwayWidth + gap;
      } else {
        advancePlacementX(panel);
      }
      this.saveMeshAndFree(panel, `DeckPanel_${joint.number}`, crossMembersText, crossMembersContext);
    }
    this.downloadObjFileText(crossMembersText, baseFileName, 'cross-members');
  }

  // TODO: Could make these more descriptive. E.g. add counts.

  public get abutmentsFileContents(): string {
    const rtn = ['abutments'];
    if (this.print3dModelService.isPier) {
      rtn.push('pier');
    }
    switch (+this.print3dModelService.isLeftAnchorage + +this.print3dModelService.isRightAnchorage) {
      case 0:
        break;
      case 1:
        rtn.push('anchorage');
        break;
      case 2:
        rtn.push('anchorages');
        break;
    }
    return rtn.join(', ');
  }

  public get crossMembersFileContents(): string {
    return 'cross-members, deck panels';
  }

  public get trussesFileContents(): string {
    return 'trusses';
  }

  /** Saves OBJ file text for given manifold mesh to given text, then frees all manifolds. */
  private saveMeshAndFree(manifold: Manifold, objectName: string, text: string[], ctx: ObjFileContext): void {
    text.push(...this.getObjText(ctx, objectName, manifold.getMesh()));
    cleanup();
  }

  /**
   * Gets a chunk of text lines constituting an OBJ file object for the given mesh. Multiple chunks
   * may be concatenated (in exact order gotten) for all calls that provided the same context.
   *
   * @param ctx context within a single OBJ file to be emitted
   * @param name desired OBJ file object name
   * @param mesh Manifold Mesh to be used as source data
   * @returns array of text lines
   */
  private getObjText(ctx: ObjFileContext, name: string, mesh: Mesh): string[] {
    const coords = mesh.vertProperties;
    const text: string[] = [`o ${name}\n`];
    for (let i = 0; i < coords.length; i += 3) {
      text.push(`v ${toNice(coords[i])} ${toNice(coords[i + 1])} ${toNice(coords[i + 2])}\n`);
    }
    const indices = mesh.triVerts;
    for (let i = 0; i < indices.length; i += 3) {
      const ia = indices[i];
      const ib = indices[i + 1];
      const ic = indices[i + 2];
      const normal = getTriangleNormal(coords, ia, ib, ic);
      const key = getNormalString(normal);
      let normalIndex = ctx.normalIndices[key];
      if (normalIndex === undefined) {
        text.push(`vn ${key}\n`);
        ctx.normalIndices[key] = normalIndex = ctx.nextNormalIndex++;
      }
      const nn = 1 + normalIndex; // Normal number
      const vnb = 1 + ctx.baseVertexIndex; // Vertex number base
      text.push(`f ${vnb + ia}//${nn} ${vnb + ib}//${nn} ${vnb + ic}//${nn}\n`);
    }
    ctx.baseVertexIndex += coords.length / 3;
    return text;
  }

  /** Downloads an OBJ file containing given text with given base file name, and kind specifier. */
  private downloadObjFileText(text: string[], fileName: string, kind: string): void {
    const blob = new Blob(text, { type: 'model/obj' });
    const anchorElement = window.document.createElement('a');
    const url = window.URL.createObjectURL(blob);
    anchorElement.href = url;
    if (fileName.length > 0 && kind.length > 0) {
      fileName += '-';
    }
    fileName += kind;
    fileName += '.obj';
    anchorElement.download = fileName;
    document.body.appendChild(anchorElement);
    anchorElement.click();
    document.body.removeChild(anchorElement);
    window.URL.revokeObjectURL(anchorElement.href);
  }
}

/** Returns slightly rounded normal coordinates as a string. Rounding reduces file size. */
function getNormalString(n: Vec3): string {
  return `${toNice(n[0])} ${toNice(n[1])} ${toNice(n[2])}`;
}

/** Returns a string representation of given number with 6 digits of precision and superfluous zeros elided. */
function toNice(x: number): string {
  return x.toPrecision(6).replace(/\.0*$|(\.\d*[1-9])0*$/, '$1');
}

/** Returns the unit normal of triangle with given indices. Uses Newell's method. */
function getTriangleNormal(coords: Float32Array, ia: number, ib: number, ic: number): Vec3 {
  const a = coords.slice(ia * 3);
  const b = coords.slice(ib * 3);
  const c = coords.slice(ic * 3);
  let nx = 0;
  let ny = 0;
  let nz = 0;
  nx += (a[1] - b[1]) * (a[2] + b[2]);
  ny += (a[2] - b[2]) * (a[0] + b[0]);
  nz += (a[0] - b[0]) * (a[1] + b[1]);
  nx += (b[1] - c[1]) * (b[2] + c[2]);
  ny += (b[2] - c[2]) * (b[0] + c[0]);
  nz += (b[0] - c[0]) * (b[1] + c[1]);
  nx += (c[1] - a[1]) * (c[2] + a[2]);
  ny += (c[2] - a[2]) * (c[0] + a[0]);
  nz += (c[0] - a[0]) * (c[1] + a[1]);
  const len = Math.hypot(nx, ny, nz);
  return [nx / len, ny / len, nz / len];
}

export class ManifoldError extends Error {
  constructor(
    public readonly part: string,
    errorStatus: ErrorStatus,
  ) {
    super(errorStatus);
    this.name = 'ManifoldError';
  }

  public get summary(): string {
    return `${this.part}: ${this.message}`;
  }
}

function throwIfEmpty(manifold: Manifold, part: string): Manifold {
  if (manifold.isEmpty()) {
    throw new ManifoldError(part, manifold.status());
  }
  return manifold;
}
