/* Copyright (c) 2025-2026 Gene Ressler
   SPDX-License-Identifier: GPL-3.0-or-later */

import { Injectable } from '@angular/core';
import Module, { Manifold, Mat4, Polygons, SimplePolygon, Vec2 } from 'manifold-3d';
import { garbageCollectManifold } from 'manifold-3d/lib/garbage-collector.js';
import { BridgeService } from '../../shared/services/bridge.service';
import { GussetsService } from '../../shared/services/gussets.service';
import { Utility } from '../../shared/classes/utility';
import { Print3dGeometry } from './geometry';
import { Joint } from '../../shared/classes/joint.model';

export type Mat2x3 = [number, number, number, number, number, number];

type WasmModule = ReturnType<typeof Module> extends Promise<infer R> ? R : never;
type ManifoldClass = WasmModule['Manifold'];

/** Small offset in millimeters to prevent slivers when subtracting manifolds. */
const FUDGE = 0.001;

@Injectable({ providedIn: 'root' })
export class Print3dModelService {
  private _manifoldClass: ManifoldClass | undefined;

  constructor(
    private readonly bridgeService: BridgeService,
    private readonly gussetsService: GussetsService,
  ) {}

  /**
   * Sets up the Manifold library for CSG operations. Multiple calls okay.
   * Enables GC, so manifolds computed in one builder call may be gone in the next.
   */
  public async initialize(): Promise<void> {
    if (this._manifoldClass) {
      return;
    }
    // Assets spec puts manifold.wasm at /wasm.
    const wasm = await Module({ locateFile: () => 'wasm/manifold.wasm' });
    wasm.setup();
    garbageCollectManifold(wasm); // cleanup() frees all previously built manifolds
    this._manifoldClass = wasm.Manifold;
  }

  /** Returns a container of calculated info common to several manifold builds. */
  public getGeometry(modelMmPerWorldM: number, minFeatureSize: number, wiggle: number): Print3dGeometry {
    return new Print3dGeometry(this.gussetsService, this.bridgeService, modelMmPerWorldM, minFeatureSize, wiggle);
  }

  /** Returns whether the current bridge has a pier to print. */
  public get isPier(): boolean {
    return this.bridgeService.designConditions.isPier;
  }

  /** Returns a list of text IDs for anchorages present in the current bridge. */
  public get anchorages(): string[] {
    const conditions = this.bridgeService.designConditions;
    const rtn = [];
    if (conditions.isLeftAnchorage) rtn.push('Left');
    if (conditions.isRightAnchorage) rtn.push('Right');
    return rtn;
  }

  public get deckPanelCount(): number {
    return this.bridgeService.designConditions.panelCount;
  }

  /** Returns an iterator over bridge joints that have cross members. */
  public *crossMemberJointsIterator(): Generator<Joint, void, void> {
    for (const joint of this.bridgeService.bridge.joints) {
      if (BridgeService.isJointClearOfRoadway(joint)) yield joint;
    }
  }

  /** Returns an iterator over bridge joints that have deck panels. */
  public *deckPanelJointsIterator(): Generator<Joint, void, void> {
    const loadedJointCount = this.bridgeService.designConditions.loadedJointCount;
    const joints = this.bridgeService.bridge.joints;
    for (let i = 0; i < loadedJointCount; ++i) yield joints[i];
  }

  /** Returns a truss as a single manifold with x-y orientation determined by given affine transform. */
  public buildTruss(gmy: Print3dGeometry, xyTransform: Mat2x3): Manifold {
    let truss!: Manifold;
    const add = (newComponent: Manifold): void => {
      truss = truss ? truss.add(newComponent) : newComponent;
    };
    const modelMmPerWorldM = gmy.modelMmPerWorldM;
    const pinHoleSize = gmy.pinHoleSize * modelMmPerWorldM;
    const halfPinHoleSize = 0.5 * pinHoleSize;
    for (const member of this.bridgeService.bridge.members) {
      // Account for all pin joint wiggle here so the pin doesn't shrink.
      const size = Math.max(modelMmPerWorldM * member.materialSizeMm * 0.001, gmy.minFeatureSize + 2 * gmy.wiggle);
      const halfsize = size * 0.5;
      const [ax, ay] = transformVec2(xyTransform, member.a.x, member.a.y);
      const [bx, by] = transformVec2(xyTransform, member.b.x, member.b.y);
      let dx = bx - ax;
      let dy = by - ay;
      let len = Math.hypot(dx, dy);
      dx /= len;
      dy /= len;
      // Rotate to correct angle after shifting down by half member size
      // and right by half pin size with wiggle, then translate to a.
      const tx = ax + halfPinHoleSize * dx + halfsize * dy;
      const ty = ay + halfPinHoleSize * dy - halfsize * dx;
      // prettier-ignore
      const m: Mat4 = [
          dx, dy, 0, 0, // column 0
          -dy, dx, 0, 0, // column 1
          0, 0, 1, 0, // column 2
          tx, ty, 0, 1, // column 3
        ];
      add(this.manifoldClass.cube([len - pinHoleSize, size, size]).transform(m));
    }
    const hole: SimplePolygon = gmy.pinHole.map(v => [modelMmPerWorldM * v[0], modelMmPerWorldM * v[1]] as Vec2);
    // Pad gusset min member size by a few percent to make things easier for slicers.
    for (const gusset of this.gussetsService.createGussets(gmy.pinHoleSize * 1100)) {
      const polygon: SimplePolygon = gusset.hull.map(pt => transformVec2(xyTransform, pt.x, pt.y, 0));
      if (isReverseWinding(xyTransform)) polygon.reverse();
      const [gx, gy] = transformVec2(xyTransform, gusset.joint.x, gusset.joint.y);
      const polygons = BridgeService.isJointClearOfRoadway(gusset.joint) ? [polygon, hole] : [polygon];
      add(this.manifoldClass.extrude(polygons, modelMmPerWorldM * gusset.halfDepthM * 2).translate(gx, gy, 0));
    }
    return truss;
  }

  public buildAbutment(gmy: Print3dGeometry, x: number): Manifold {
    const tab = this.extrudeCentered(gmy.tab, 2 * gmy.tabThickness).translate(
      gmy.abutmentXOffset,
      0,
      gmy.abutmentShelfZ,
    );
    const depth = gmy.bridgeWidth;
    return this.manifoldClass
      .extrude([gmy.abutment], depth)
      .translate(gmy.abutmentXOffset, 0, -0.5 * depth)
      .rotate(90, 0, 0) // Rotate y axis to z.
      .add(tab)
      .scale(gmy.modelMmPerWorldM)
      .translate(x, 0, 0);
  }

  public buildPier(gmy: Print3dGeometry, x: number): Manifold {
    const tab = this.extrudeCentered(gmy.tab, 2 * gmy.tabThickness).translate(gmy.pierXOffset, 0, gmy.pierTopZ);
    return this.manifoldClass
      .extrude(gmy.pier, gmy.pierHeight, undefined, undefined, [gmy.pierTaperX, 1.2])
      .rotate(180, 0, 0) // Flip taper.
      .translate(gmy.pierXOffset, 0, gmy.pierTopZ)
      .add(tab)
      .scale(gmy.modelMmPerWorldM)
      .translate(x, 0, 0);
  }

  public buildAnchorage(gmy: Print3dGeometry, x: number): Manifold {
    const tab = this.extrudeCentered(gmy.tab, 2 * gmy.tabThickness).translate(
      gmy.anchorageXOffset,
      0,
      gmy.anchorageTopZ,
    );
    const depth = gmy.bridgeWidth;
    return this.manifoldClass
      .extrude([gmy.anchorage], depth)
      .translate(gmy.anchorageXOffset, 0, -0.5 * depth)
      .rotate(90, 0, 0) // Rotate y axis to z.
      .add(tab)
      .scale(gmy.modelMmPerWorldM)
      .translate(x, 0, 0);
  }

  /** Returns pinned cross member for given cross-membered joint, */
  public buildCrossMember(gmy: Print3dGeometry, joint: Joint, x: number, y: number): Manifold {
    const pinMember = this.buildPinMember(gmy);
    return this.isPillowJoint(joint)
      ? pinMember
          .add(this.buildPillow(gmy))
          .translate(gmy.pillowXOffset, gmy.pinMemberYOffset, gmy.pinMemberXOffset)
          .scale(gmy.modelMmPerWorldM)
          .translate(x, y, 0)
      : pinMember
          .translate(gmy.pinMemberXOffset, gmy.pinMemberYOffset, gmy.pinMemberXOffset)
          .scale(gmy.modelMmPerWorldM)
          .translate(x, y, 0);
  }

  /** Returns a deck panel for the given deck joint. */
  public buildDeckPanel(gmy: Print3dGeometry, joint: Joint, x: number, y: number): Manifold {
    const index = joint.index;
    const panelCount = this.bridgeService.designConditions.panelCount;
    // prettier-ignore
    const panel =  
     index === 0 || index === panelCount ? this.buildEndPanel(gmy) : 
     index === panelCount >>> 1 ? this.buildCenterBeam(gmy) :
     this.buildStandardPanel(gmy);
    return panel.scale(gmy.modelMmPerWorldM).translate(x, y, 0);
  }

  /** Returns a standard (not end or center) deck panel with given geometry. Has male and female zippers. */
  private buildStandardPanel(gmy: Print3dGeometry): Manifold {
    const zipper = this.manifoldClass.extrude(gmy.zipper, gmy.zipperThickness).rotate(0, 90, 0);
    const zipperHole = this.manifoldClass.extrude(gmy.zipperHole, gmy.zipperThickness).rotate(0, 90, 0);
    const zipperZ = gmy.deckPanelZOffset - 0.001; // fudge to prevent sliver from subtract
    return this.extrudeCentered(gmy.standardDeckPanel, gmy.roadwayWidth)
      .add(zipper.translate(gmy.deckPanelZipperX, zipperZ, 0))
      .subtract(zipperHole.translate(-gmy.deckBeamHalfWidth - FUDGE, zipperZ))
      .rotate(-90, 0, 0)
      .translate(gmy.standardDeckPanelXOffset, gmy.deckPanelYOffset, gmy.deckPanelZOffset);
  }

  /** Returns a deck beam (no panel) with given geometry. Has two female zippers to join panels on both sides sides. */
  private buildCenterBeam(gmy: Print3dGeometry): Manifold {
    const zipper = this.manifoldClass.extrude(gmy.zipperHole, gmy.zipperThickness).rotate(0, 90, 0);
    const zipperZ = gmy.deckPanelZOffset + 0.001; // fudge to prevent sliver from subtract
    return this.extrudeCentered(gmy.centerDeckBeam, gmy.roadwayWidth)
      .subtract(zipper.translate(-gmy.deckBeamHalfWidth - FUDGE, zipperZ))
      .subtract(zipper.translate(gmy.deckBeamHalfWidth - gmy.zipperThickness + FUDGE, zipperZ))
      .rotate(-90, 0, 0)
      .translate(gmy.centerDeckBeamXOffset, gmy.deckPanelYOffset, gmy.deckPanelZOffset);
  }

  /** Returns end end deck panel with given geometry. Has only a male zipper. */
  private buildEndPanel(gmy: Print3dGeometry): Manifold {
    const zipper = this.manifoldClass.extrude(gmy.zipper, gmy.zipperThickness).rotate(0, 90, 0);
    const zipperZ = gmy.deckPanelZOffset + 0.001; // fudge to prevent sliver from subtract
    return this.extrudeCentered(gmy.endDeckPanel, gmy.roadwayWidth)
      .add(zipper.translate(gmy.deckPanelZipperX, zipperZ, 0))
      .rotate(-90, 0, 0)
      .translate(gmy.endDeckPanelXOffset, gmy.deckPanelYOffset, gmy.deckPanelZOffset);
  }

  /** Returns pin cross-member in world coords centered on the origin. */
  private buildPinMember(gmy: Print3dGeometry): Manifold {
    const pin = this.extrudeCentered(gmy.pin, gmy.bridgeWidth);
    const member = this.extrudeCentered(gmy.pinMember, gmy.roadwayWidth);
    return member.add(pin).rotate(90, 0, 0); // Rotate z axis to y.
  }

  /** Returns a support pillow with given geometry. */
  private buildPillow(gmy: Print3dGeometry): Manifold {
    const pillow = this.extrudeCentered(gmy.pillow, gmy.roadwayWidth);
    const tabHole = this.extrudeCentered(gmy.tabHole, 2 * gmy.tabThickness)
      .rotate(-90, 0, 0)
      .translate(0, -gmy.pillowHeight, 0);
    return pillow.subtract(tabHole).rotate(-90, 0, 0);
  }

  private isPillowJoint(joint: Joint): boolean {
    const conditions = this.bridgeService.designConditions;
    return (
      conditions.abutmentJointIndices.findIndex(abutmentJointIndex => joint.index === abutmentJointIndex) >= 0 ||
      joint.index === conditions.leftAnchorageJointIndex ||
      joint.index === conditions.rightAnchorageJointIndex
    );
  }

  /** Convenience method invoking the manifold extrude function with z-axis centering. */
  private extrudeCentered(polygon: Polygons, dz: number) {
    const _ = undefined;
    return this.manifoldClass.extrude(polygon, dz, _, _, _, true);
  }

  private get manifoldClass(): ManifoldClass {
    return Utility.assertNotUndefined(this._manifoldClass);
  }
}

/** Returns whether the given transform reverses the winding order of polygons when applied.*/
function isReverseWinding(a: Mat2x3): boolean {
  return a[0] * a[3] < a[1] * a[2];
}

/** Returns given 3d vector transformed with given affine matrix. */
function transformVec2(a: Mat2x3, x: number, y: number, w: number = 1): Vec2 {
  return [a[0] * x + a[2] * y + a[4] * w, a[1] * x + a[3] * y + a[5] * w];
}
