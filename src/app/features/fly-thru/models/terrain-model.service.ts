import { Injectable } from '@angular/core';
import { makeRandomGenerator } from '../../../shared/core/random-generator';
import { Utility } from '../../../shared/classes/utility';
import { MeshData } from '../rendering/mesh-rendering.service';
import { DesignConditions } from '../../../shared/services/design-conditions.service';
import { SiteConstants } from '../../../shared/classes/site.model';
import { BridgeService } from '../../../shared/services/bridge.service';
import { RIVER_AXIS } from './river';
import { Geometry } from '../../../shared/classes/graphics';
import { BitVector } from '../../../shared/core/bitvector';

type CenterlinePost = {
  elevation: number;
  xNormal: number;
  yNormal: number;
};

/** Container for singleton terrain model, its generator, and queries. */
@Injectable({ providedIn: 'root' })
export class TerrainModelService {
  /** Separation that ought to allow one polygon to mask another. */
  public static readonly EPS_PAINT = 0.05;
  public static readonly GAP_HALF_WIDTH = 24.0;
  public static readonly HALF_GRID_COUNT = 64;
  public static readonly RIVER_BANK_SLOPE = 2.0;
  public static readonly roadCutSlope = 1;
  public static readonly stoneTextureSize = 0.3;
  public static readonly TERRAIN_HALF_SIZE = 192;
  public static readonly WATER_LEVEL = -26.0;

  public static readonly GRID_COUNT = 2 * TerrainModelService.HALF_GRID_COUNT;
  public static readonly POST_COUNT = TerrainModelService.GRID_COUNT + 1;
  public static readonly METERS_PER_GRID = TerrainModelService.TERRAIN_HALF_SIZE / TerrainModelService.HALF_GRID_COUNT;
  public static readonly blufSetback = TerrainModelService.GAP_HALF_WIDTH * 0.2;
  public static readonly BLUF_TO_RIVER_CENTER_DISTANCE =
    TerrainModelService.GAP_HALF_WIDTH + TerrainModelService.blufSetback;
  public static readonly tInflection = TerrainModelService.GAP_HALF_WIDTH - TerrainModelService.blufSetback;
  public static readonly blufCoeff =
    (-0.5 * TerrainModelService.RIVER_BANK_SLOPE) /
    (TerrainModelService.tInflection - (TerrainModelService.blufSetback + TerrainModelService.GAP_HALF_WIDTH));
  public static readonly GORGE_BOTTOM_HEIGHT =
    -TerrainModelService.GAP_HALF_WIDTH * TerrainModelService.RIVER_BANK_SLOPE;
  public static readonly RIVER_EDGE_TO_CENTER_DISTANCE =
    (TerrainModelService.WATER_LEVEL - TerrainModelService.GORGE_BOTTOM_HEIGHT) / TerrainModelService.RIVER_BANK_SLOPE;

  private readonly random0to1 = makeRandomGenerator(2093415, 3205892098, 239837, 13987483);

  public readonly fractalElevations: Float32Array[];
  public roadCenterLine!: CenterlinePost[];

  constructor(private readonly bridgeService: BridgeService) {
    this.fractalElevations = this.buildFractalTerrain(TerrainModelService.POST_COUNT);
  }

  // Sets up terrain geometry for current bridge.
  public initializeForBridge(): void {
    this.roadCenterLine = this.buildRoadCenterLine();
  }

  /**
   * Creates or re-fills a square array of elevation posts with random fractal terrain
   * using the diamond/square algorithm.
   */
  public buildFractalTerrain(arg: number | Float32Array[]): Float32Array[] {
    // Make the first random() zero so the center of terrain isn't a crazy elevation.
    let randomCount = 0;
    const random = () => (randomCount++ === 0 ? 0 : 2 * this.random0to1() - 1);
    // Create square array or use existing one.
    const y = typeof arg === 'number' ? Utility.createArray(() => new Float32Array(arg), arg) : arg;
    const size = y.length;
    const iMax = size - 1;
    y[0][0] = y[iMax][0] = y[iMax][iMax] = y[0][iMax] = 0;
    const variation = 18;
    let dy = variation;
    // Perturb successively halved subgrids. Example: Initially we have a 1x1 and we perturb
    // the center (in the square phase) and edge midpoints (in the diamond phase).
    const smoothness = 1.8;
    let halfStride = iMax >>> 1;
    for (let stride = iMax; stride > 1; stride = halfStride, halfStride >>>= 1, dy /= smoothness) {
      // Square phase.
      for (let i = 0; i < iMax; i += stride) {
        for (let j = 0; j < iMax; j += stride) {
          const avg = 0.25 * (y[i][j] + y[i + stride][j] + y[i][j + stride] + y[i + stride][j + stride]);
          y[i + halfStride][j + halfStride] = avg + random() * dy;
        }
      }
      // Diamond phase. More cases here because diamonds are partial at terrain edges.
      for (let i = 0; i < size; i += stride) {
        for (let j = halfStride; j < size; j += stride) {
          let e = y[i][j - halfStride] + y[i][j + halfStride];
          const iNorth = i - halfStride;
          const iSouth = i + halfStride;
          let n = 2;
          if (iNorth >= 0) {
            e += y[iNorth][j];
            n++;
          }
          if (iSouth < size) {
            e += y[iSouth][j];
            n++;
          }
          y[i][j] = e / n + random() * dy;
        }
      }
      for (let i = halfStride; i < size; i += stride) {
        for (let j = 0; j < size; j += stride) {
          let e = y[i - halfStride][j] + y[i + halfStride][j];
          const jWest = j - halfStride;
          const jEast = j + halfStride;
          let n = 2;
          if (jWest >= 0) {
            e += y[i][jWest];
            n++;
          }
          if (jEast < size) {
            e += y[i][jEast];
            n++;
          }
          y[i][j] = e / n + random() * dy;
        }
      }
    }
    return y;
  }

  /** Rebuilds the random part of terrain without re-seeding the RNG. */
  public rebuildFractalTerrain() {
    this.buildFractalTerrain(this.fractalElevations);
  }

  public buildRoadCenterLine(): CenterlinePost[] {
    const conditions = this.bridgeService.designConditions;
    const halfSpanLength = 0.5 * conditions.spanLength;
    const gradeHeight = DesignConditions.GAP_DEPTH - conditions.deckElevation;
    const wearSurfaceHeight = gradeHeight + SiteConstants.WEAR_SURFACE_HEIGHT;
    const centerLine: CenterlinePost[] = [];
    const iMax = TerrainModelService.POST_COUNT - 1;
    if (gradeHeight === 0) {
      for (let i = 0; i <= iMax; ++i) {
        centerLine.push({ elevation: gradeHeight, xNormal: 0, yNormal: 1 });
      }
    } else {
      const A = SiteConstants.ACCESS_SLOPE / (2 * SiteConstants.TANGENT_OFFSET);
      // x0 is edge of bridge deck
      const x0 = halfSpanLength;
      // x1 is end of lower parabolic transition, start of linear ramp.
      const x1 = halfSpanLength + SiteConstants.TANGENT_OFFSET;
      // y1 is elevation over edge of deck at end of parabolic transition.
      const y1 = A * SiteConstants.TANGENT_OFFSET * SiteConstants.TANGENT_OFFSET;
      // x2 is end of linear ramp, start of upper parabolic transition.
      const x2 = halfSpanLength + wearSurfaceHeight / SiteConstants.ACCESS_SLOPE;
      // x3 is end of upper parabolic transition, start of level roadway.
      const x3 = x2 + SiteConstants.TANGENT_OFFSET;
      // Loop from span middle, stepping outward in both directions.
      for (
        let x = 0, i = TerrainModelService.HALF_GRID_COUNT, j = TerrainModelService.HALF_GRID_COUNT;
        i < TerrainModelService.POST_COUNT;
        i++, j--
      ) {
        let y = 0;
        if (x <= halfSpanLength) {
          y = SiteConstants.WEAR_SURFACE_HEIGHT;
        } else if (x <= x1) {
          const xp = x - x0;
          y = A * xp * xp + SiteConstants.WEAR_SURFACE_HEIGHT;
        } else if (x <= x2) {
          const xp = x - x1;
          y = y1 + xp * SiteConstants.ACCESS_SLOPE + SiteConstants.WEAR_SURFACE_HEIGHT;
        } else if (x <= x3) {
          const xp = x - x3;
          y = gradeHeight - A * xp * xp;
        } else {
          y = gradeHeight;
        }
        centerLine[i] = { elevation: y, xNormal: 0, yNormal: 0 };
        centerLine[j] = { elevation: y, xNormal: 0, yNormal: 0 };
        x += TerrainModelService.METERS_PER_GRID;
      }
      // Reset normals, which are 2d. Average unit normals of segments
      // west and east of each post.
      for (let i = 1; i < iMax - 1; i++) {
        // Unit vectors along centerline.
        const e0 = centerLine[i].elevation;
        let xw = -TerrainModelService.METERS_PER_GRID;
        let yw = centerLine[i - 1].elevation - e0;
        let xe = TerrainModelService.METERS_PER_GRID;
        let ye = centerLine[i + 1].elevation - e0;
        const rw = 1.0 / Math.sqrt(xw * xw + yw * yw);
        xw *= rw;
        yw *= rw;
        const re = 1.0 / Math.sqrt(xe * xe + ye * ye);
        xe *= re;
        ye *= re;
        // Perpendiculars, which are the normals.
        const xnw = yw;
        const ynw = -xw;
        const xne = -ye;
        const yne = xe;
        // Average and re-normalize to unit length.
        let nx = 0.5 * (xnw + xne);
        let ny = 0.5 * (ynw + yne);
        const rn = 1.0 / Math.sqrt(nx * nx + ny * ny);
        nx *= rn;
        ny *= rn;
        centerLine[i].xNormal = nx;
        centerLine[i].yNormal = ny;
      }
      centerLine[0] = centerLine[1];
      centerLine[iMax] = centerLine[iMax - 1];
    }
    return centerLine;
  }

  /**
   * Synthesizes one elevation by combining random terrain, river, and bridge excavation models.
   *
   * @param i post row grid coordinate
   * @param j post column grid coordinate
   * @param grade grade level
   * @return elevation of this post
   */
  public synthesizeElevation(i: number, j: number, rtn: { elevation: number; isVisible: boolean }): void {
    const conditions = this.bridgeService.designConditions;
    const halfGridCount = TerrainModelService.HALF_GRID_COUNT;
    const metersPerGrid = TerrainModelService.METERS_PER_GRID;
    const x = (j - halfGridCount) * metersPerGrid;
    const z = (i - halfGridCount) * metersPerGrid;
    // Mark the roadway excluding the area between abutments invisible.
    rtn.isVisible = Math.abs(z) > SiteConstants.DECK_HALF_WIDTH || Math.abs(x) < 0.5 * conditions.spanLength;
    // Distance to river center line.
    const tWater = getDistanceToRiver(x, z);
    // Distance to center of road.
    const tRoadway = Math.abs(z);
    // Coefficient varies from 0 at water edge to 1 at the corner of the bluf above the water.
    const tFractalA = Math.min(1, Math.max(0, 0.1 * (tWater - TerrainModelService.RIVER_EDGE_TO_CENTER_DISTANCE)));
    // Coefficient varies from 0 at a point 4 meters outside roadway edge to 1 at cut/fill edge.
    const tFractalB = Math.min(1, Math.max(0, 0.2 * (tRoadway - SiteConstants.DECK_HALF_WIDTH - 4)));
    // Taking min determines how much fractal randomness should affect final elevation.
    const tFractal = Math.min(tFractalA, tFractalB);
    // Basic elevation is a portion of randomness from the fractal.
    let y = this.fractalElevations[i][j] * tFractal;
    // If we're close to the water, we roll off in a parabolic section.
    const tBluf = TerrainModelService.BLUF_TO_RIVER_CENTER_DISTANCE + 0.3 * tFractalB;
    if (tWater <= tBluf) {
      y -= TerrainModelService.blufCoeff * Utility.sqr(tWater - tBluf);
    }
    // Clamp underwater portion.
    if (y < TerrainModelService.WATER_LEVEL) {
      y = TerrainModelService.WATER_LEVEL - 5;
      rtn.isVisible = false;
    }
    // Raise to grade.
    y += DesignConditions.GAP_DEPTH - conditions.deckElevation;

    // Cut or fill for the roadway.
    const tCut = Math.abs(z);
    const yRoad = this.roadCenterLine[j].elevation - TerrainModelService.EPS_PAINT;
    // TODO: Replace deck width with actual abutment width.
    const yRise = (tCut - SiteConstants.DECK_HALF_WIDTH - metersPerGrid) * TerrainModelService.roadCutSlope;

    // Try cut first.
    const yCut = yRise >= 0 ? yRoad + yRise : yRoad;
    if (yCut <= y) {
      y = yCut;
    }
    // Try fill only if we're not close to bridge.
    else if (x < -TerrainModelService.GAP_HALF_WIDTH || x > TerrainModelService.GAP_HALF_WIDTH) {
      const yFill = yRise >= 0 ? yRoad - yRise : yRoad;
      if (yFill >= y) {
        y = yFill;
      }
    }
    /* TODO: Finish me!
    // Make depressions around the anchorages.
    if (this.bridgeService.designConditions.isLeftAnchorage) {
      if (z < -trussCenterOffset) {
        const yAnchorNW = yAnchor(x, z, -anchorOffset - halfSpanLength, -trussCenterOffset);
        if (yAnchorNW < y) {
          y = yAnchorNW;
        }
      }
      if (z > trussCenterOffset) {
        const yAnchorSW = yAnchor(x, z, -anchorOffset - halfSpanLength, trussCenterOffset);
        if (yAnchorSW < y) {
          y = yAnchorSW;
        }
      }
    }
    if (this.bridgeService.designConditions.isRightAnchorage) {
      if (z < -trussCenterOffset) {
        const yAnchorNE = yAnchor(x, z, +anchorOffset + halfSpanLength, -trussCenterOffset);
        if (yAnchorNE < y) {
          y = yAnchorNE;
        }
      }
      if (z > trussCenterOffset) {
        const yAnchorSE = yAnchor(x, z, +anchorOffset + halfSpanLength, trussCenterOffset);
        if (yAnchorSE < y) {
          y = yAnchorSE;
        }
      }
    }
      */
    rtn.elevation = y;
    function getDistanceToRiver(x: number, z: number): number {
      let distance = Number.POSITIVE_INFINITY;
      for (let i = 2; i < RIVER_AXIS.length; i += 2) {
        const ax = RIVER_AXIS[i - 2];
        const ay = RIVER_AXIS[i - 1];
        const bx = RIVER_AXIS[i];
        const by = RIVER_AXIS[i + 1];
        const segmentDistance = Geometry.pointSegmentDistance2D(x, z, ax, ay, bx, by);
        if (segmentDistance < distance) {
          distance = segmentDistance;
        }
      }
      return distance;
    }
  }

  /** Returns a mesh for the current terrain. */
  public get mesh(): MeshData {
    const postCount = TerrainModelService.POST_COUNT;
    const gridFloatCount = 3 * postCount * postCount;
    const positions = new Float32Array(gridFloatCount);
    const normals = new Float32Array(gridFloatCount);
    const gridSquareCount = TerrainModelService.GRID_COUNT * TerrainModelService.GRID_COUNT;
    const indices = new Uint16Array(gridSquareCount * 2 * 3); // Two triangles per grid square.
    // Most negative x- and z-coordinate.
    const xz0 = -TerrainModelService.HALF_GRID_COUNT * TerrainModelService.METERS_PER_GRID;
    const mPerGrid = TerrainModelService.METERS_PER_GRID;

    // Positions from grid x-z and terrain y in column/x-major order.
    // TODO: Have synthesizeElevation return a visibility tag to skip triangles e.g. roadways and river.
    const ijMax = postCount - 1;
    let ip = 0;
    let ibv = 0;
    const post = { elevation: 0, isVisible: true };
    const visibleBits = new BitVector(postCount * postCount);
    for (let j = 0, x = xz0; j <= ijMax; ++j, x += mPerGrid) {
      for (let i = 0, z = xz0; i <= ijMax; ++i, z += mPerGrid) {
        this.synthesizeElevation(i, j, post);
        positions[ip++] = x;
        positions[ip++] = post.elevation;
        positions[ip++] = z;
        visibleBits.setBitValue(ibv++, post.isVisible);
      }
    }
    const getPositionY = (i: number, j: number) => positions[3 * (j * postCount + i) + 1];
    // Normals by averaging unit normals of adjacent faces.
    ip = 0;
    for (let j = 0; j <= ijMax; ++j) {
      for (let i = 0; i <= ijMax; ++i) {
        const y0 = getPositionY(i, j);
        // Adjacent Elevation deltas. Assume off-grid edges are horizontal.
        const da = j < ijMax ? getPositionY(i, j + 1) - y0 : 0;
        const db = i > 0 ? getPositionY(i - 1, j) - y0 : 0;
        const dc = j > 0 ? getPositionY(i, j - 1) - y0 : 0;
        const dd = i < ijMax ? getPositionY(i + 1, j) - y0 : 0;

        // All the normal y-coordinates are the same: pq means ab, bc, cd, or da.
        const pqy = mPerGrid * mPerGrid;

        // Find the raw normals.
        let abx = -mPerGrid * da;
        let aby = pqy;
        let abz = mPerGrid * db;

        let bcx = mPerGrid * dc;
        let bcy = pqy;
        let bcz = abz;

        let cdx = bcx;
        let cdy = pqy;
        let cdz = -mPerGrid * dd;

        let dax = abx;
        let day = pqy;
        let daz = cdz;

        // Scale to unit vectors.
        const pqy2 = pqy * pqy;
        const abScale = 1 / Math.sqrt(abx * abx + pqy2 + abz * abz);
        abx *= abScale;
        aby *= abScale;
        abz *= abScale;

        const bcScale = 1 / Math.sqrt(bcx * bcx + pqy2 + bcz * bcz);
        bcx *= bcScale;
        bcy *= bcScale;
        bcz *= bcScale;

        const cdScale = 1 / Math.sqrt(cdx * cdx + pqy2 + cdz * cdz);
        cdx *= cdScale;
        cdy *= cdScale;
        cdz *= cdScale;

        const daScale = 1 / Math.sqrt(dax * dax + pqy2 + daz * daz);
        dax *= daScale;
        day *= daScale;
        daz *= daScale;

        // Add unit vectors and renormalize.
        let nx = abx + bcx + cdx + dax;
        let ny = aby + bcy + cdy + day;
        let nz = abz + bcz + cdz + daz;
        const nScale = 1 / Math.sqrt(nx * nx + ny * ny + nz * nz);

        normals[ip++] = nScale * nx;
        normals[ip++] = nScale * ny;
        normals[ip++] = nScale * nz;
      }
    }
    /** Indices by tracing a grid as triangles, two per grid square. */
    ip = 0;
    let skipCount = 0;
    for (let j = 0, i0 = 0; j < ijMax; ++j, i0 += postCount) {
      for (let i = 0; i < ijMax; ++i) {
        const nw = i0 + i;
        const sw = nw + 1;
        const ne = nw + postCount;
        const se = ne + 1;
        const isDiagVisible = visibleBits.getBit(se) || visibleBits.getBit(nw);
        if (isDiagVisible || visibleBits.getBit(ne)) {
          indices[ip++] = nw;
          indices[ip++] = se;
          indices[ip++] = ne;
        } else {
          ++skipCount;
        }
        if (isDiagVisible || visibleBits.getBit(sw)) {
          indices[ip++] = se;
          indices[ip++] = nw;
          indices[ip++] = sw;
        } else {
          ++skipCount;
        }
      }
    }
    console.log('skipped triangles:', skipCount);
    return { positions, normals, indices };
  }

  public getElevationAt(_x: number, _z: number): number {
    return -10;
  }
}
