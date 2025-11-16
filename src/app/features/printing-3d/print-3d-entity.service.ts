import { Injectable } from '@angular/core';
import Module, { Manifold, Mat4, SimplePolygon, Vec2 } from 'manifold-3d';
import * as ManifoldTypes from 'manifold-3d/manifold-encapsulated-types';
import { BridgeService } from '../../shared/services/bridge.service';
import { GussetsService } from '../../shared/services/gussets.service';
import { SiteConstants } from '../../shared/classes/site-constants';
import { TerrainModelService } from '../fly-thru/models/terrain-model.service';

type Mat2x3 = [number, number, number, number, number, number];

/** Returns whether the given transform reverses the winding order of polygons when applied.*/
function isReverseWinding(a: Mat2x3): boolean {
  return a[0] * a[3] < a[1] * a[2];
}

function transformVec2(a: Mat2x3, x: number, y: number, w: number = 1): Vec2 {
  return [a[0] * x + a[2] * y + a[4] * w, a[1] * x + a[3] * y + a[5] * w];
}

@Injectable({ providedIn: 'root' })
export class Print3dEntityService {
  private manifoldInstance!: typeof ManifoldTypes.Manifold;

  constructor(
    private readonly bridgeService: BridgeService,
    private readonly gussetsService: GussetsService,
    private readonly terrainModelService: TerrainModelService,
  ) {}

  /** Sets up the Manifold library for CSG operations. Multiple calls okay. */
  public async initialize(): Promise<void> {
    if (this.manifoldInstance) {
      return;
    }
    // Assets spec puts manifold.wasm at /wasm.
    const wasm = await Module({ locateFile: () => 'wasm/manifold.wasm' });
    wasm.setup();
    this.manifoldInstance = wasm.Manifold;
  }

  public buildTruss(xyTransform: Mat2x3, minFeatureSize: number): Manifold | undefined {
    let truss!: Manifold;
    const add = (newComponent: Manifold): void => {
      if (truss) {
        const oldTruss = truss;
        truss = truss.add(newComponent);
        oldTruss.delete();
      } else {
        truss = newComponent;
      }
    };
    const modelMmPerWorldM = Math.abs(xyTransform[0]);
    for (const member of this.bridgeService.bridge.members) {
      const size = Math.max(modelMmPerWorldM * member.materialSizeMm * 0.001, minFeatureSize);
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
      const memberAtOrigin = this.manifoldInstance.cube([len - size, size, size]);
      add(memberAtOrigin.transform(m));
      memberAtOrigin.delete();
    }
    const d = 0.5 * minFeatureSize;
    const hole: SimplePolygon = [
      [0, d],
      [d, 0],
      [0, -d],
      [-d, 0],
    ];
    const minFeatureSizeWorldMm = minFeatureSize / modelMmPerWorldM * 1000;
    for (const gusset of this.gussetsService.createGussets(minFeatureSizeWorldMm)) {
      const polygon: SimplePolygon = gusset.hull.map(pt => transformVec2(xyTransform, pt.x, pt.y, 0));
      if (isReverseWinding(xyTransform)) {
        polygon.reverse();
      }
      const hull3d = this.manifoldInstance.extrude([polygon, hole], modelMmPerWorldM * gusset.halfDepthM * 2);
      const [gx, gy] = transformVec2(xyTransform, gusset.joint.x, gusset.joint.y);
      add(hull3d.translate(gx, gy, 0));
      hull3d.delete();
    }
    return truss;
  }

  public buildAbutment(xyTransform: Mat2x3, _minFeatureSize: number): Manifold {
    const conditions = this.bridgeService.designConditions;
    const archHeight = conditions.isArch ? conditions.underClearance : 0;
    const halfDepth = this.bridgeService.bridgeHalfWidth;
    const shelfY = SiteConstants.ABUTMENT_STEP_HEIGHT - archHeight;
    const [leftX, leftIndex] = this.terrainModelService.leftAbutmentEndX;
    const faceX = SiteConstants.ABUTMENT_FACE_X;
    const insetX = SiteConstants.ABUTMENT_STEP_X;
    const deckY = SiteConstants.DECK_TOP_HEIGHT;
    const halfGridCount = TerrainModelService.HALF_GRID_COUNT;
    const waterY = this.terrainModelService.getElevationAtIJ(halfGridCount, halfGridCount);
    const polygon: Vec2[] = [];
    // Left bottom of abutment.
    polygon.push(transformVec2(xyTransform, leftX, waterY));
    // Wear surface
    for (let j = leftIndex, x = leftX; j < halfGridCount; ++j, x += TerrainModelService.METERS_PER_GRID) {
      if (x >= insetX) {
        polygon.push(transformVec2(xyTransform, insetX, deckY));
        break;
      }
      const roadElevation = this.terrainModelService.getRoadCenterlinePostAtJ(j).elevation;
      polygon.push(transformVec2(xyTransform, x, roadElevation - TerrainModelService.EPS_PAINT));
    }
    // Left, right corner of shelf; right bottom of abutment.
    polygon.push(
      transformVec2(xyTransform, insetX, shelfY),
      transformVec2(xyTransform, faceX, shelfY),
      transformVec2(xyTransform, faceX, waterY),
    );
    // Polygon is CW in x-y, so inverse winding check.
    if (!isReverseWinding(xyTransform)) {
      polygon.reverse();
    }
    return this.manifoldInstance.extrude([polygon], 2 * halfDepth).rotate([90, 0, 0]);
  }

  public buildPier(_xyTransform: Mat2x3, _minFeatureSize: number): Manifold {
    throw new Error('Implement me!');
  }

  public buildAnchorage(_xyTransform: Mat2x3, _minFeatureSize: number): Manifold {
    throw new Error('Implement me!');
  }

  public buildPillows(_xyTransform: Mat2x3, _minFeatureSize: number): Manifold {
    throw new Error('Implement me!');
  }
}
