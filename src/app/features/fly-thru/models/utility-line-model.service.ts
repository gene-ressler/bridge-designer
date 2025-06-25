import { Injectable } from '@angular/core';
import { mat4, vec3 } from 'gl-matrix';
import { WireData } from '../rendering/wire-rendering.service';
import { TerrainModelService } from './terrain-model.service';
import { Geometry } from '../../../shared/classes/graphics';

@Injectable({ providedIn: 'root' })
export class UtilityLineModelService {
  private static readonly X_WEST_TOWER = -116;
  private static readonly Z_WEST_TOWER = -102;
  private static readonly DX_TOWER = 90;
  private static readonly DZ_TOWER = 70;
  private static readonly TOWER_DISTANCE = Geometry.vectorLength2D(
    UtilityLineModelService.DX_TOWER,
    UtilityLineModelService.DZ_TOWER,
  );
  private static readonly X_UNIT_PERP_TOWER =
    -UtilityLineModelService.DZ_TOWER / UtilityLineModelService.TOWER_DISTANCE;
  private static readonly Z_UNIT_PERP_TOWER = UtilityLineModelService.DX_TOWER / UtilityLineModelService.TOWER_DISTANCE;
  private static readonly THETA_TOWER = -Math.atan2(UtilityLineModelService.DZ_TOWER, UtilityLineModelService.DX_TOWER);
  private static readonly TOWER_COUNT = 4;
  private static readonly WIRE_POST_COUNT_PER_TOWER = 20;
  private static readonly DROOP_SLOPE = -1 / 10;
  // prettier-ignore
  /** X-Y offsets of tower support arms from base center. Must match tower.obj. */
  public static readonly SUPPORT_ARM_OFFSETS = new Float32Array([
    -2.48, 10.9,    
    -2.48, 10.9 + 1.5,
    -2.48, 10.9 + 1.5 * 2,
     2.48, 10.9,
     2.48, 10.9 + 1.5,
     2.48, 10.9 + 1.5 * 2,
  ]);

  private readonly offset = vec3.create();

  constructor(private readonly terrainModelService: TerrainModelService) {}

  /** Fill model data structures for the current terrain model. */
  public buildModel(): [Float32Array, WireData] {
    const transforms = UtilityLineModelService.createTowerModelTransforms();
    const wireData = UtilityLineModelService.createWireData();
    const positions = wireData.positions;
    const directions = wireData.directions;
    const indices = wireData.indices;
    const instanceModelTransforms = wireData.instanceModelTransforms!;
    let x0, y0, z0, ip, ii;
    ip = ii = 0;
    for (
      let iTower = 0, transformOffset = 0;
      iTower < UtilityLineModelService.TOWER_COUNT;
      ++iTower, transformOffset += 16
    ) {
      // Tower instance transformations
      const x1 = UtilityLineModelService.X_WEST_TOWER + iTower * UtilityLineModelService.DX_TOWER;
      const z1 = UtilityLineModelService.Z_WEST_TOWER + iTower * UtilityLineModelService.DZ_TOWER;
      // Make bottom just below surface elevation to avoid gaps on steep terrain.
      const y1 = this.terrainModelService.getElevationAtXZ(x1, z1) - 0.2;
      const m = transforms.subarray(transformOffset, transformOffset + 16);
      mat4.fromTranslation(m, vec3.set(this.offset, x1, y1, z1));
      mat4.rotateY(m, m, UtilityLineModelService.THETA_TOWER);

      // Power wire between tower pairs. Parabolas because catenaries are nearly
      // identical and harder. Coordinates are wrt bottom center of tower.
      // An instance is translated to the end of each support arm.
      if (iTower > 0) {
        const dx = x1 - x0!;
        const dy = y1 - y0!;
        const dz = z1 - z0!;
        const du = Geometry.vectorLength2D(dx, dz);
        const m = dy / du + UtilityLineModelService.DROOP_SLOPE;
        const a = (dy - m * du) / (du * du);
        // d0 is second previous segment direction, and d1 is the current wrt iWire.
        // So iWire=0 has no previous, and iWire=post count has no current.
        let dx0, dy0, dz0, dx1, dy1, dz1;
        for (let iWire = 0; iWire <= UtilityLineModelService.WIRE_POST_COUNT_PER_TOWER; iWire++) {
          // Wire positions.
          const t = iWire / UtilityLineModelService.WIRE_POST_COUNT_PER_TOWER;
          const u = du * t;
          positions[ip] = x0! + dx * t;
          positions[ip + 1] = y0! + (a * u + m) * u;
          positions[ip + 2] = z0! + dz * t;
          // Wire directions. Current direction is at previous position.
          if (iWire > 0) {
            // Unit vector pointing in direction of wire segment ending at current position.
            dx1 = positions[ip] - positions[ip - 3];
            dy1 = positions[ip + 1] - positions[ip - 2];
            dz1 = positions[ip + 2] - positions[ip - 1];
            const s = 1.0 / Math.sqrt(dx1 * dx1 + dy1 * dy1 + dz1 * dz1);
            dx1 *= s;
            dy1 *= s;
            dz1 *= s;
            // Ends get direction of resp wire segment. Middle posts get average of two.
            let dirX = dx1,
              dirY = dy1,
              dirZ = dz1;
            if (dx0 !== undefined) {
              dirX += dx0!;
              dirY += dy0!;
              dirZ += dz0!;
              const s = 1.0 / Math.sqrt(dirX * dirX + dirY * dirY + dirZ * dirZ);
              dirX *= s;
              dirY *= s;
              dirZ *= s;
            }
            directions[ip - 3] = dirX;
            directions[ip - 2] = dirY;
            directions[ip - 1] = dirZ;
            dx0 = dx1;
            dy0 = dy1;
            dz0 = dz1;
          }
          ip += 3;
        }
        // Fill in final direction, since no iteration had it as previous.
        directions[ip - 3] = dx1!;
        directions[ip - 2] = dy1!;
        directions[ip - 1] = dz1!;
      }
      x0 = x1;
      y0 = y1;
      z0 = z1;
    }
    // Wire line indices.
    // Each wire section between towers has countPerTower+1 vertices.
    // Each wire segment gets two indices.
    const wireSpanCount = UtilityLineModelService.TOWER_COUNT - 1;
    for (let iTower = 0; iTower < wireSpanCount; ++iTower) {
      for (let iWire = 0; iWire < UtilityLineModelService.WIRE_POST_COUNT_PER_TOWER; iWire++) {
        const segStartVertexIndex = iTower * (UtilityLineModelService.WIRE_POST_COUNT_PER_TOWER + 1) + iWire;
        indices[ii++] = segStartVertexIndex;
        indices[ii++] = segStartVertexIndex + 1;
      }
    }
    // Wire instance transformations.
    for (
      let iWireOffset = 0, transformOffset = 0;
      iWireOffset < UtilityLineModelService.SUPPORT_ARM_OFFSETS.length;
      iWireOffset += 2, transformOffset += 16
    ) {
      const xOfs = UtilityLineModelService.X_UNIT_PERP_TOWER * UtilityLineModelService.SUPPORT_ARM_OFFSETS[iWireOffset];
      const yOfs = UtilityLineModelService.SUPPORT_ARM_OFFSETS[iWireOffset + 1];
      const zOfs = UtilityLineModelService.Z_UNIT_PERP_TOWER * UtilityLineModelService.SUPPORT_ARM_OFFSETS[iWireOffset];
      const m = instanceModelTransforms.subarray(transformOffset, transformOffset + 16);
      mat4.fromTranslation(m, vec3.set(this.offset, xOfs, yOfs, zOfs));
    }
    return [transforms, wireData];
  }

  private static createTowerModelTransforms(): Float32Array {
    return new Float32Array(16 * UtilityLineModelService.TOWER_COUNT);
  }

  private static createWireData(): WireData {
    const positionCount =
      (UtilityLineModelService.WIRE_POST_COUNT_PER_TOWER + 1) * (UtilityLineModelService.TOWER_COUNT - 1);
    const lineCount = UtilityLineModelService.WIRE_POST_COUNT_PER_TOWER * (UtilityLineModelService.TOWER_COUNT - 1);
    return {
      positions: new Float32Array(positionCount * 3),
      directions: new Float32Array(positionCount * 3),
      indices: new Uint16Array(lineCount * 2),
      instanceModelTransforms: new Float32Array(UtilityLineModelService.SUPPORT_ARM_OFFSETS.length * 16),
    };
  }
}
