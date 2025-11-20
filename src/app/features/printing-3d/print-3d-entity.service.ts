import { Injectable } from '@angular/core';
import Module, { Manifold, Mat4, SimplePolygon, Vec2 } from 'manifold-3d';
import { garbageCollectManifold } from 'manifold-3d/lib/garbage-collector.js';
import { BridgeService } from '../../shared/services/bridge.service';
import { Gusset, GussetsService } from '../../shared/services/gussets.service';
import { SiteConstants } from '../../shared/classes/site-constants';
import { DesignConditions } from '../../shared/services/design-conditions.service';
import { Utility } from '../../shared/classes/utility';

export type Mat2x3 = [number, number, number, number, number, number];

/**
 * Container of pre-calculated information common to more than one manifold builder.
 * Must be created for the current bridge.
 */
export class Print3dContext {
  public readonly gussets: Gusset[];
  public readonly bridgeWidth: number;
  public readonly shelfY: number;
  public readonly crossPin: [Vec2, Vec2, Vec2, Vec2];
  public readonly crossMemberSize: number;
  constructor(
    gussetsService: GussetsService,
    bridgeService: BridgeService,
    public readonly modelMmPerWorldM: number,
    public readonly minFeatureSize: number,
  ) {
    const minFeatureSizeWorldMm = (minFeatureSize / modelMmPerWorldM) * 1000;
    this.gussets = gussetsService.createGussets(minFeatureSizeWorldMm);
    this.bridgeWidth = modelMmPerWorldM * 2 * bridgeService.bridgeHalfWidth;
    const conditions = bridgeService.designConditions;
    const archHeight = conditions.isArch ? conditions.underClearance : 0;
    this.shelfY = SiteConstants.ABUTMENT_STEP_HEIGHT - archHeight;
    const smallestMember = bridgeService.bridge.members.reduce((prev, curr) =>
      prev.materialSizeMm <= curr.materialSizeMm ? prev : curr,
    );
    this.crossMemberSize = Math.max(minFeatureSize, 0.001 * smallestMember.materialSizeMm * modelMmPerWorldM);
    const d = 0.5 * this.crossMemberSize;
    this.crossPin = [
      [-d, 0],
      [0, -d],
      [d, 0],
      [0, d],
    ];
  }
}

/** Returns whether the given transform reverses the winding order of polygons when applied.*/
function isReverseWinding(a: Mat2x3): boolean {
  return a[0] * a[3] < a[1] * a[2];
}

function transformVec2(a: Mat2x3, x: number, y: number, w: number = 1): Vec2 {
  return [a[0] * x + a[2] * y + a[4] * w, a[1] * x + a[3] * y + a[5] * w];
}

type WasmModule = ReturnType<typeof Module> extends Promise<infer R> ? R : never;
type ManifoldClass = WasmModule['Manifold'];

@Injectable({ providedIn: 'root' })
export class Print3dEntityService {
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
  public getContext(modelMmPerWorldM: number, minFeatureSize: number): Print3dContext {
    return new Print3dContext(this.gussetsService, this.bridgeService, modelMmPerWorldM, minFeatureSize);
  }

  public buildTruss(ctx: Print3dContext, xyTransform: Mat2x3): Manifold {
    let truss!: Manifold;
    const add = (newComponent: Manifold): void => {
      if (truss) {
        truss = truss.add(newComponent);
      } else {
        truss = newComponent;
      }
    };
    const modelMmPerWorldM = Math.abs(xyTransform[0]);
    for (const member of this.bridgeService.bridge.members) {
      const size = Math.max(modelMmPerWorldM * member.materialSizeMm * 0.001, ctx.minFeatureSize);
      const halfsize = size * 0.5;
      const [ax, ay] = transformVec2(xyTransform, member.a.x, member.a.y);
      const [bx, by] = transformVec2(xyTransform, member.b.x, member.b.y);
      let dx = bx - ax;
      let dy = by - ay;
      let len = Math.hypot(dx, dy);
      dx /= len;
      dy /= len;
      // Rotate about to correct angle after shifting down and right by 1/2 member size.
      const tx = ax + halfsize * (dx + dy);
      const ty = ay + halfsize * (dy - dx);
      // prettier-ignore
      const m: Mat4 = [
          dx, dy, 0, 0, // column 0
          -dy, dx, 0, 0, // column 1
          0, 0, 1, 0, // column 2
          tx, ty, 0, 1, // column 3
        ];
      add(this.manifoldClass.cube([len - size, size, size]).transform(m));
    }
    const hole: SimplePolygon = ctx.crossPin.reverse();
    const minFeatureSizeWorldMm = (ctx.minFeatureSize / modelMmPerWorldM) * 1000;
    for (const gusset of this.gussetsService.createGussets(minFeatureSizeWorldMm)) {
      const polygon: SimplePolygon = gusset.hull.map(pt => transformVec2(xyTransform, pt.x, pt.y, 0));
      if (isReverseWinding(xyTransform)) {
        polygon.reverse();
      }
      const [gx, gy] = transformVec2(xyTransform, gusset.joint.x, gusset.joint.y);
      const polygons = BridgeService.isJointClearOfRoadway(gusset.joint) ? [polygon, hole] : [polygon];
      add(this.manifoldClass.extrude(polygons, modelMmPerWorldM * gusset.halfDepthM * 2).translate(gx, gy, 0));
    }
    return truss;
  }

  public buildAbutment(ctx: Print3dContext, xyTransform: Mat2x3): Manifold {
    const faceX = SiteConstants.ABUTMENT_FACE_X;
    const insetX = SiteConstants.ABUTMENT_STEP_X;
    const deckY = SiteConstants.DECK_TOP_HEIGHT;
    // Bottom one panel width below joint shelf.
    // TODO: Factor out bottomY calculation for sharing between this and buildPier.
    const bridgeExtent = this.bridgeService.getWorldExtent();
    const bottomY = Math.min(ctx.shelfY, bridgeExtent.y0) - DesignConditions.PANEL_SIZE_WORLD;
    const leftX = -2 * DesignConditions.PANEL_SIZE_WORLD;
    // Define front face in x-y. Extrude in z. Rotate to correct orientation.
    const points: Vec2[] = [
      [faceX, bottomY],
      [faceX, ctx.shelfY],
      [insetX, ctx.shelfY],
      [insetX, deckY],
      [leftX, deckY],
      [leftX, bottomY],
    ];
    const polygon = points.map(p => transformVec2(xyTransform, ...p));
    if (isReverseWinding(xyTransform)) {
      polygon.reverse();
    }
    const dz = ctx.bridgeWidth;
    const pinX = 0.5 * (polygon[1][0] + polygon[2][0]);
    const pinY0 = -0.25 * dz;
    const pinY1 = 0.25 * dz;
    const pinZ = polygon[2][1];
    const pin1 = this.buildIndexPin(ctx.modelMmPerWorldM, ctx.minFeatureSize).translate(pinX, pinY0, pinZ);
    const pin2 = this.buildIndexPin(ctx.modelMmPerWorldM, ctx.minFeatureSize).translate(pinX, pinY1, pinZ);
    return this.manifoldClass
      .extrude([polygon], dz)
      .translate(0, 0, -0.5 * dz)
      .rotate(90, 0, 0)
      .add(pin1.add(pin2));
  }

  public get isPier(): boolean {
    return this.bridgeService.designConditions.isPier;
  }

  public get isLeftAnchorage(): boolean {
    return this.bridgeService.designConditions.isLeftAnchorage;
  }

  public get isRightAnchorage(): boolean {
    return this.bridgeService.designConditions.isRightAnchorage;
  }

  public buildPier(ctx: Print3dContext, xyTransform: Mat2x3): Manifold {
    const conditions = this.bridgeService.designConditions;
    const pierJointY = conditions.prescribedJoints[conditions.pierJointIndex].y;
    const bridgeExtent = this.bridgeService.getWorldExtent();
    const bottomY = Math.min(ctx.shelfY, bridgeExtent.y0) - DesignConditions.PANEL_SIZE_WORLD;
    const bridgeHalfWidth = this.bridgeService.bridgeHalfWidth;
    const pierHalfWidth = 0.5;
    const cuspWidth = 0.3;
    // Define cross-section in x-y. Extrude in z. This is correct orientation.
    const points: Vec2[] = [
      [pierHalfWidth, bridgeHalfWidth + cuspWidth],
      [0, bridgeHalfWidth],
      [0, -bridgeHalfWidth],
      [pierHalfWidth, -bridgeHalfWidth - cuspWidth],
      [2 * pierHalfWidth, -bridgeHalfWidth],
      [2 * pierHalfWidth, bridgeHalfWidth],
    ];
    const polygon = points.map(p => transformVec2(xyTransform, ...p));
    if (isReverseWinding(xyTransform)) {
      polygon.reverse();
    }
    const dz = ctx.modelMmPerWorldM * (pierJointY + SiteConstants.ABUTMENT_STEP_HEIGHT - bottomY);
    const pinX = polygon[0][0];
    const dy = polygon[2][1] - polygon[1][1];
    const pinY0 = polygon[1][1] + 0.25 * dy;
    const pinY1 = polygon[1][1] + 0.75 * dy;
    const baseZ = ctx.modelMmPerWorldM * bottomY;
    const pinZ = baseZ + dz;
    const pin1 = this.buildIndexPin(ctx.modelMmPerWorldM, ctx.minFeatureSize).translate(pinX, pinY0, pinZ);
    const pin2 = this.buildIndexPin(ctx.modelMmPerWorldM, ctx.minFeatureSize).translate(pinX, pinY1, pinZ);
    return this.manifoldClass.extrude([polygon], dz).translate(0, 0, baseZ).add(pin1.add(pin2));
  }

  public buildAnchorage(ctx: Print3dContext, xyTransform: Mat2x3): Manifold {
    const pillowInterfaceWidth = SiteConstants.ABUTMENT_FACE_X - SiteConstants.ABUTMENT_STEP_X;
    // Bottom one panel width below joint shelf.
    // TODO: Factor out bottomY calculation for sharing between this and buildPier.
    const bridgeExtent = this.bridgeService.getWorldExtent();
    const bottomY = Math.min(ctx.shelfY, bridgeExtent.y0) - DesignConditions.PANEL_SIZE_WORLD;
    const baseWidth = 3;
    const points: Vec2[] = [
      [0, bottomY],
      [baseWidth, bottomY],
      [baseWidth, ctx.shelfY],
      [baseWidth - pillowInterfaceWidth, ctx.shelfY],
    ];
    const polygon = points.map(p => transformVec2(xyTransform, ...p));
    const dz = ctx.bridgeWidth;
    const pinX = 0.5 * (polygon[2][0] + polygon[3][0]);
    const pinY0 = -0.25 * dz;
    const pinY1 = 0.25 * dz;
    const pinZ = polygon[2][1];
    const pin1 = this.buildIndexPin(ctx.modelMmPerWorldM, ctx.minFeatureSize).translate(pinX, pinY0, pinZ);
    const pin2 = this.buildIndexPin(ctx.modelMmPerWorldM, ctx.minFeatureSize).translate(pinX, pinY1, pinZ);
    return this.manifoldClass
      .extrude([polygon], dz)
      .translate(0, 0, -0.5 * dz)
      .rotate(90, 0, 0)
      .add(pin1)
      .add(pin2);
  }

  public buildCrossmembers(ctx: Print3dContext, org: Vec2): Manifold {
    const length = ctx.modelMmPerWorldM * 2 * SiteConstants.DECK_HALF_WIDTH;
    const assembly: Manifold[] = [];
    let x = org[0];
    const center = this.manifoldClass.cube([ctx.crossMemberSize, length, ctx.crossMemberSize], true);
    const pin = this.manifoldClass
      .extrude(ctx.crossPin, ctx.bridgeWidth)
      .translate(0, 0, -0.5 * ctx.bridgeWidth)
      .rotate(90, 0, 0);
    const crossMember = center.add(pin);
    for (const joint of this.bridgeService.bridge.joints) {
      if (!BridgeService.isJointClearOfRoadway(joint)) {
        continue;
      }
      assembly.push(crossMember.translate(x, org[1], 0));
      x += ctx.crossMemberSize + ctx.minFeatureSize;
    }
    return assembly.reduce((prev, curr) => prev.add(curr));
  }

  private buildIndexPin(modelMmPerWorldM: number, minFeatureSize: number): Manifold {
    const radius = Math.max(
      minFeatureSize,
      modelMmPerWorldM * (SiteConstants.ABUTMENT_FACE_X - SiteConstants.ABUTMENT_STEP_X) * 0.2,
    );
    const height = 3 * radius;
    return this.manifoldClass.cylinder(height, radius, radius, 16, true);
  }

  private get manifoldClass(): ManifoldClass {
    return Utility.assertNotUndefined(this._manifoldClass);
  }
}
