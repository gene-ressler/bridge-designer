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
import { Material } from './materials';

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
  public static readonly ROAD_CUT_SLOPE = 1;
  public static readonly TERRAIN_HALF_SIZE = 192;
  public static readonly WATER_LEVEL = -26.0;

  public static readonly GRID_COUNT = 2 * TerrainModelService.HALF_GRID_COUNT;
  public static readonly POST_COUNT = TerrainModelService.GRID_COUNT + 1;
  public static readonly METERS_PER_GRID = TerrainModelService.TERRAIN_HALF_SIZE / TerrainModelService.HALF_GRID_COUNT;
  public static readonly BLUF_SETBACK = TerrainModelService.GAP_HALF_WIDTH * 0.2;
  public static readonly BLUF_TO_RIVER_CENTER_DISTANCE =
    TerrainModelService.GAP_HALF_WIDTH + TerrainModelService.BLUF_SETBACK;
  public static readonly T_INFLECTION = TerrainModelService.GAP_HALF_WIDTH - TerrainModelService.BLUF_SETBACK;
  public static readonly BLUF_COEFF =
    (-0.5 * TerrainModelService.RIVER_BANK_SLOPE) /
    (TerrainModelService.T_INFLECTION - (TerrainModelService.BLUF_SETBACK + TerrainModelService.GAP_HALF_WIDTH));
  public static readonly GORGE_BOTTOM_HEIGHT =
    -TerrainModelService.GAP_HALF_WIDTH * TerrainModelService.RIVER_BANK_SLOPE;
  public static readonly RIVER_EDGE_TO_CENTER_DISTANCE =
    (TerrainModelService.WATER_LEVEL - TerrainModelService.GORGE_BOTTOM_HEIGHT) / TerrainModelService.RIVER_BANK_SLOPE;
  /** Distance from gap center to line where terrain along the roadway ends, and abutment begins. */
  public static readonly TERRAIN_GAP_SETBACK = TerrainModelService.GAP_HALF_WIDTH;

  private readonly random0to1 = makeRandomGenerator(2093415, 3205892098, 239837, 13987483);

  public readonly fractalElevations: Float32Array[];
  public roadCenterLine: CenterlinePost[];
  public terrainMeshData: MeshData;

  constructor(private readonly bridgeService: BridgeService) {
    this.fractalElevations = this.buildFractalTerrain(TerrainModelService.POST_COUNT);
    this.roadCenterLine = this.buildRoadCenterLine();
    this.terrainMeshData = this.buildTerrainMeshData();
  }

  // Sets up terrain geometry for current bridge.
  public initializeForBridge(): void {
    this.roadCenterLine = this.buildRoadCenterLine();
    this.terrainMeshData = this.buildTerrainMeshData();
  }

  /** Resets the terrain with a new random component. */
  public refreshFractalTerrain() {
    this.buildFractalTerrain(this.fractalElevations);
    this.terrainMeshData = this.buildTerrainMeshData();
  }

  /**
   * Creates or re-fills a square array of elevation posts with random fractal terrain
   * using the diamond/square algorithm.
   */
  private buildFractalTerrain(arg: number | Float32Array[]): Float32Array[] {
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

  /**
   * Builds the y-axis profile of the road centerline. It's two straight ramps with
   * parabolic blending to he bridge deck wear surface.
   */
  private buildRoadCenterLine(): CenterlinePost[] {
    const conditions = this.bridgeService.designConditions;
    const halfSpanLength = 0.5 * conditions.spanLength;
    const yDeckJoints = DesignConditions.GAP_DEPTH - conditions.deckElevation;
    const yWearSurface = yDeckJoints + SiteConstants.DECK_HEIGHT;
    const centerLine: CenterlinePost[] = [];
    const iMax = TerrainModelService.POST_COUNT - 1;
    if (yDeckJoints === 0) {
      for (let i = 0; i <= iMax; ++i) {
        centerLine.push({ elevation: yWearSurface, xNormal: 0, yNormal: 1 });
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
      const x2 = halfSpanLength + yWearSurface / SiteConstants.ACCESS_SLOPE;
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
          y = SiteConstants.DECK_HEIGHT;
        } else if (x <= x1) {
          const xp = x - x0;
          y = A * xp * xp + SiteConstants.DECK_HEIGHT;
        } else if (x <= x2) {
          const xp = x - x1;
          y = y1 + xp * SiteConstants.ACCESS_SLOPE + SiteConstants.DECK_HEIGHT;
        } else if (x <= x3) {
          const xp = x - x3;
          y = yWearSurface - A * xp * xp;
        } else {
          y = yWearSurface;
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
   * Synthesizes one terrain elevation by combining models: random, river, and bridge excavation.
   * Includes a flag saying whether the post elevation is under the river surface.
   *
   * @param i post row grid coordinate
   * @param j post column grid coordinate
   * @param rtn a reference to a container for return values
   */
  private synthesizeElevation(i: number, j: number, rtn?: { elevation: number; isVisible: boolean }): number {
    const conditions = this.bridgeService.designConditions;
    const halfGridCount = TerrainModelService.HALF_GRID_COUNT;
    const metersPerGrid = TerrainModelService.METERS_PER_GRID;
    const x = (j - halfGridCount) * metersPerGrid;
    const z = (i - halfGridCount) * metersPerGrid;
    // Mark the roadway excluding the area between abutments invisible.
    let isVisible = Math.abs(z) > SiteConstants.DECK_HALF_WIDTH || Math.abs(x) < 0.5 * conditions.spanLength;
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
      y -= TerrainModelService.BLUF_COEFF * Utility.sqr(tWater - tBluf);
    }
    // Clamp underwater portion. Assumes only the river valley is lower than water level.
    if (y < TerrainModelService.WATER_LEVEL) {
      y = TerrainModelService.WATER_LEVEL - 5;
      isVisible = false;
    }
    // Raise to grade.
    y += DesignConditions.GAP_DEPTH - conditions.deckElevation;

    // Cut or fill for the roadway.
    const tCut = Math.abs(z);
    // A bit lower than road elevation so actual road can't be hidden.
    const yRoad = this.roadCenterLine[j].elevation - TerrainModelService.EPS_PAINT;
    // TODO: Replace deck width with actual abutment width.
    // The y of a cut bank. Zero at road level, one grid distance from roadway edge and rising thereafter.
    const yRise = (tCut - SiteConstants.DECK_HALF_WIDTH - metersPerGrid) * TerrainModelService.ROAD_CUT_SLOPE;

    // Try cut first. See what the cut elevation would be and use it if less than actual.
    const yCut = yRise >= 0 ? yRoad + yRise : yRoad;
    if (yCut <= y) {
      y = yCut;
    }
    // Try fill only if we're outside the abutments.
    else {
      if (x < -TerrainModelService.TERRAIN_GAP_SETBACK || x > TerrainModelService.TERRAIN_GAP_SETBACK) {
        const yFill = yRise >= 0 ? yRoad - yRise : yRoad;
        if (yFill >= y) {
          y = yFill;
        }
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
    if (rtn) {
      rtn.isVisible = isVisible;
      rtn.elevation = y;
    }
    return y;

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

  /** Returns mesh data for the current terrain. */
  private buildTerrainMeshData(): MeshData {
    const postCount = TerrainModelService.POST_COUNT;
    const gridFloatCount = 3 * postCount * postCount;
    const positions = new Float32Array(gridFloatCount);
    const normals = new Float32Array(gridFloatCount);
    const gridSquareCount = TerrainModelService.GRID_COUNT * TerrainModelService.GRID_COUNT;
    const indices = new Uint16Array(gridSquareCount * 2 * 3); // Two triangles per grid square.
    // Most negative x- and z-coordinate.
    const z0 = -TerrainModelService.HALF_GRID_COUNT * TerrainModelService.METERS_PER_GRID;
    const x0 = z0 + 0.5 * this.bridgeService.designConditions.spanLength;
    const mPerGrid = TerrainModelService.METERS_PER_GRID;

    // Positions from grid x-z and terrain y in column/x-major order.
    const ijMax = postCount - 1;
    let ip = 0;
    let ibv = 0;
    const post = { elevation: 0, isVisible: true };
    const visibleBits = new BitVector(postCount * postCount);
    for (let j = 0, x = x0; j <= ijMax; ++j, x += mPerGrid) {
      for (let i = 0, z = z0; i <= ijMax; ++i, z += mPerGrid) {
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
    // Indices by tracing a grid as triangles, two per grid square.
    // About 3.3k triangles are skipped by the visibility logic.
    ip = 0;
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
        }
        if (isDiagVisible || visibleBits.getBit(sw)) {
          indices[ip++] = se;
          indices[ip++] = nw;
          indices[ip++] = sw;
        }
      }
    }
    return { positions, normals, indices };
  }

  public getElevationAtIJ(i: number, j: number): number {
    i = Utility.clamp(i, 0, TerrainModelService.GRID_COUNT);
    j = Utility.clamp(j, 0, TerrainModelService.GRID_COUNT);
    const xyzIndex = j * TerrainModelService.POST_COUNT + i;
    return this.terrainMeshData.positions[xyzIndex * 3 + 1]; // y-coordinate
  }

  /**
   * Starting at gap center, moving left, finds the first post where the
   * road centerline joins the terrain and returns the x-coordinate.
   */
  public get leftAbutmentEndX(): [number, number] {
    // Search from gap center left along road to find post where road rises to terrain.
    let j = TerrainModelService.HALF_GRID_COUNT;
    for (; j > 0; --j) {
      if (
        Utility.areNearlyEqual(
          this.roadCenterLine[j].elevation,
          this.getElevationAtIJ(TerrainModelService.HALF_GRID_COUNT, j),
          2 * TerrainModelService.EPS_PAINT,
        )
      ) {
        break;
      }
    }
    return [this.gridColumnToWorldX(j), j];
  }

  /** Returns the terrain model elevation at the given x-z point. */
  public getElevationAtXZ(x: number, z: number): number {
    const conditions = this.bridgeService.designConditions;
    const metersPerGrid = TerrainModelService.METERS_PER_GRID;
    const terrainHalfSize = TerrainModelService.TERRAIN_HALF_SIZE;
    const i0f = (z + terrainHalfSize) / metersPerGrid;
    const i0 = Math.trunc(i0f);
    const ti = i0f - i0;
    const j0f = (x - 0.5 * conditions.spanLength + terrainHalfSize) / metersPerGrid;
    const j0 = Math.trunc(j0f);
    const tj = j0f - j0;
    const e00 = this.getElevationAtIJ(i0, j0);
    const e01 = this.getElevationAtIJ(i0, j0 + 1);
    const et0 = e00 * (1 - tj) + e01 * tj;
    const e10 = this.getElevationAtIJ(i0 + 1, j0);
    const e11 = this.getElevationAtIJ(i0 + 1, j0 + 1);
    const et1 = e10 * (1 - tj) + e11 * tj;
    const yWater = TerrainModelService.WATER_LEVEL + DesignConditions.GAP_DEPTH - conditions.deckElevation;
    return Math.max(yWater, et0 * (1 - ti) + et1 * ti);
  }

  /** Returns a faceted mesh for the roadway sections to the bridge. */
  public get roadwayMeshData(): MeshData {
    const abutmentStepInset = SiteConstants.ABUTMENT_STEP_INSET;
    const deckHalfWidth = SiteConstants.DECK_HALF_WIDTH;
    const gridCount = TerrainModelService.GRID_COUNT;
    const metersPerGrid = TerrainModelService.METERS_PER_GRID;
    const wearSurfaceHeight = SiteConstants.DECK_HEIGHT;
    const positionsList = [];
    // Left positions.
    for (let j = 0, x = this.gridColumnToWorldX(j); ; ++j, x += metersPerGrid) {
      const centerlinePost = this.roadCenterLine[j];
      if (x >= abutmentStepInset) {
        positionsList.push(abutmentStepInset, wearSurfaceHeight, -deckHalfWidth);
        positionsList.push(abutmentStepInset, wearSurfaceHeight, +deckHalfWidth);
        break;
      } else {
        positionsList.push(x, centerlinePost.elevation, -deckHalfWidth);
        positionsList.push(x, centerlinePost.elevation, +deckHalfWidth);
      }
    }
    const leftLength = positionsList.length;
    // Right positions.
    const xDeckRight = this.bridgeService.designConditions.spanLength - abutmentStepInset;
    for (let j = gridCount, x = this.gridColumnToWorldX(j); ; --j, x -= metersPerGrid) {
      const centerlinePost = this.roadCenterLine[j];
      if (x <= xDeckRight) {
        positionsList.push(xDeckRight, wearSurfaceHeight, -deckHalfWidth);
        positionsList.push(xDeckRight, wearSurfaceHeight, +deckHalfWidth);
        break;
      } else {
        positionsList.push(x, centerlinePost.elevation, -deckHalfWidth);
        positionsList.push(x, centerlinePost.elevation, +deckHalfWidth);
      }
    }
    const positions = new Float32Array(positionsList);
    // Left and right normals.
    const normals = new Float32Array(positions.length);
    for (let j = 0, i = 0; i < leftLength; ++j, i += 6) {
      const centerlinePost = this.roadCenterLine[j];
      normals[i] = normals[i + 3] = centerlinePost.xNormal;
      normals[i + 1] = normals[i + 4] = centerlinePost.yNormal;
    }
    for (let j = gridCount, i = leftLength; i < normals.length; --j, i += 6) {
      const centerlinePost = this.roadCenterLine[j];
      normals[i] = normals[i + 3] = centerlinePost.xNormal;
      normals[i + 1] = normals[i + 4] = centerlinePost.yNormal;
    }
    // Materials: all identical.
    const materialRefs = new Uint16Array(positions.length / 3).fill(Material.DarkGray);
    // Indices: two disconnected strips of triangles.
    const quadCount = positions.length / 6 - 2;
    const indices = new Uint16Array(6 * quadCount);
    let ip = 0;
    const leftIndexCount = leftLength - 6;
    for (let i = 0; ip < leftIndexCount; i += 2) {
      indices[ip++] = i + 3;
      indices[ip++] = i;
      indices[ip++] = i + 1;
      indices[ip++] = i;
      indices[ip++] = i + 3;
      indices[ip++] = i + 2;
    }
    for (let i = leftLength / 3; ip < indices.length; i += 2) {
      indices[ip++] = i + 1;
      indices[ip++] = i;
      indices[ip++] = i + 3;
      indices[ip++] = i + 2;
      indices[ip++] = i + 3;
      indices[ip++] = i;
    }
    return { positions, normals, materialRefs, indices };
  }

  private gridColumnToWorldX(j: number): number {
    const halfGridCount = TerrainModelService.HALF_GRID_COUNT;
    const metersPerGrid = TerrainModelService.METERS_PER_GRID;
    const halfSpanLength = 0.5 * this.bridgeService.designConditions.spanLength;
    return (j - halfGridCount) * metersPerGrid + halfSpanLength;
  }

  /* TODO: Remove if unused.
  private gridRowToWorldZ(i: number) {
    const halfGridCount = TerrainModelService.HALF_GRID_COUNT;
    const metersPerGrid = TerrainModelService.METERS_PER_GRID;
    return (i - halfGridCount) * metersPerGrid;
  }*/
}
