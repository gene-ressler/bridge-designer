import { Injectable } from '@angular/core';
import { BridgeService } from '../../../shared/services/bridge.service';
import { MeshData } from '../rendering/mesh-rendering.service';
import { Geometry } from '../../../shared/classes/graphics';
import { Material } from './materials';
import { SiteConstants } from '../../../shared/classes/site.model';
import { TerrainModelService } from './terrain-model.service';

@Injectable({ providedIn: 'root' })
export class PierModelService {
  private static readonly BASE_HEIGHT = 1.4;
  private static readonly BASE_TAPER = 1.1;
  private static readonly PIER_BASE_SHOULDER = 0.5;
  private static readonly PIER_CUSP_WIDTH = 0.3;
  private static readonly PIER_HALF_WIDTH = 0.5;
  /** Pier base/top size ratio. Looks cool, but too-large values distort texture. */
  private static readonly PIER_TAPER = 1.1;
  private static readonly PILLOW_HEIGHT = 0.4;
  /**
   * The maximum tex-S value. Integer to avoid a seam. The tex-S coord is the 
   * counter-clockwise scaled perimeter distance from the rear (negative z) edge.
   */
  private static readonly TEX_S_MAX = 12;

  constructor(private readonly bridgeService: BridgeService) {}

  /** Build mesh data for the pier of the current bridge, if any. Model origin center of pier top. */
  public buildMeshDataForPier(): { texturedMeshData: MeshData; coloredMeshData: MeshData } {
    const buildTexturedMesh = () => {
      let ip = 0,
        ii = 0,
        it = 0;
      const positions = new Float32Array(186);
      const normals = new Float32Array(186);
      const texCoords = new Float32Array(124);
      const indices = new Uint16Array(108);

      const addPrism = (y: number, w: number, h: number, d: number, c: number, taper: number): void => {
        // top polygon as triangle fan counter-clockwise from the top
        const topPolygonCenterVertexIndex = ip / 3;
        positions[ip] = positions[ip + 2] = 0;
        positions[ip + 1] = y;
        normals[ip + 1] = 1;
        ip += 3;
        texCoords[it] = texCoords[it + 1] = 0;
        it += 2;
        // prettier-ignore
        { 
        positions[ip +  0] = 0; positions[ip +  1] = y; positions[ip +  2] =-(d + c); // 0
        positions[ip +  3] =-w; positions[ip +  4] = y; positions[ip +  5] =-d;       // 1
        positions[ip +  6] =-w; positions[ip +  7] = y; positions[ip +  8] = d;       // 2
        positions[ip +  9] = 0; positions[ip + 10] = y; positions[ip + 11] = d + c;   // 3
        positions[ip + 12] = w; positions[ip + 13] = y; positions[ip + 14] = d;       // 4
        positions[ip + 15] = w; positions[ip + 16] = y; positions[ip + 17] =-d;       // 5
      }
        // Accumulate perimeter lengths of top polygon. For this we need only two edge lengths.
        const d0 = Geometry.distance2D(positions[ip + 0], positions[ip + 2], positions[ip + 3], positions[ip + 5]);
        const d1 = Geometry.distance2D(positions[ip + 3], positions[ip + 5], positions[ip + 6], positions[ip + 8]);
        // This contains the full perimeter of arc lengths with 0 and TEX_S_MAX both assigned to the
        // same point, which is where the tex-s coordinates start and end.
        const arcLengths = [0, d0, d1, d0, d0, d1, d0];
        arcLengths.reduce((prev, current, i, a) => (a[i] = prev + current));
        const arcScale = PierModelService.TEX_S_MAX / arcLengths[arcLengths.length - 1];
        for (let i = 0; i < arcLengths.length; ++i) {
          arcLengths[i] *= arcScale;
        }

        // Add the normals and texCoords for positions above.
        const topPolygonVertexCount = 6;
        for (let i = 0, i2 = 0, i3 = 0; i < topPolygonVertexCount; ++i, i2 += 2, i3 += 3) {
          normals[ip + i3 + 1] = 1;
          // Tex coords are x-z rotated pi/2 to better match the the wide faces.
          texCoords[it + i2 + 0] = -positions[ip + i3 + 2] * arcScale;
          texCoords[it + i2 + 1] = positions[ip + i3 + 0] * arcScale;
        }

        // side quads counter-clockwise from the top
        // In variable names, p connotes "leading," q "trailing" in traversal around CCW polygons.
        // The loop builds the q-->p quad 5-->0 quad first, which needs arc length indices qa-->pa
        // of 5-->6. Successive quads are normal: 0-->1, 1--2, ... 4-->5.
        const topPolygonIp = ip;
        ip += topPolygonVertexCount * 3;
        it += topPolygonVertexCount * 2;
        const sideQuadsVertexIndex = ip / 3;
        for (
          let i = 0, q = (topPolygonVertexCount - 1) * 3, p = 0, pa = topPolygonVertexCount, qa = pa - 1;
          i < topPolygonVertexCount;
          ++i, q = p, p += 3, pa = (pa + 1) % topPolygonVertexCount, qa = pa - 1
        ) {
          // trailing top
          const qtx = positions[topPolygonIp + q + 0];
          const qty = positions[topPolygonIp + q + 1];
          const qtz = positions[topPolygonIp + q + 2];
          // leading top
          const ptx = positions[topPolygonIp + p + 0];
          const pty = positions[topPolygonIp + p + 1];
          const ptz = positions[topPolygonIp + p + 2];
          // trailing bottom
          const qbx = taper * qtx;
          const qby = y - h;
          const qbz = taper * qtz;
          // leading bottom
          const pbx = taper * ptx;
          const pby = y - h;
          const pbz = taper * ptz;
          // trailing and leading s-tex coord
          const qsTex = arcLengths[qa];
          const psTex = arcLengths[pa];
          const tTopTex = qty * arcScale;
          const tBottomTex = qby * arcScale;

          // add quad of vertices in counter-clockwise order
          positions[ip + 0] = qtx;
          positions[ip + 1] = qty;
          positions[ip + 2] = qtz;

          positions[ip + 3] = qbx;
          positions[ip + 4] = qby;
          positions[ip + 5] = qbz;

          positions[ip + 6] = pbx;
          positions[ip + 7] = pby;
          positions[ip + 8] = pbz;

          positions[ip + 9] = ptx;
          positions[ip + 10] = pty;
          positions[ip + 11] = ptz;

          texCoords[it + 0] = qsTex;
          texCoords[it + 1] = tTopTex;

          texCoords[it + 2] = qsTex;
          texCoords[it + 3] = tBottomTex;

          texCoords[it + 4] = psTex;
          texCoords[it + 5] = tBottomTex;

          texCoords[it + 6] = psTex;
          texCoords[it + 7] = tTopTex;

          // For normal, arbitrarily choose normalize((pt - qt) X (pb - qt)).
          // (pb - qt)
          const btx = qtx - pbx;
          const bty = qty - pby;
          const btz = qtz - pbz;
          // (pt - qt)
          const ttx = ptx - qtx;
          const tty = pty - qty;
          const ttz = ptz - qtz;
          // cross
          let nx = btz * tty - bty * ttz;
          let ny = btx * ttz - btz * ttx;
          let nz = bty * ttx - btx * tty;
          // scale
          const s = 1 / Math.hypot(nx, ny, nz);
          nx *= s;
          ny *= s;
          nz *= s;
          // Set all vertices of the quad.
          for (let i = 0; i < 12; i += 3) {
            normals[ip + i + 0] = nx;
            normals[ip + i + 1] = ny;
            normals[ip + i + 2] = nz;
          }
          ip += 12;
          it += 8;
        }
        // Indicies for top triangle fan
        for (let i = 0, q = topPolygonVertexCount, p = 1; i < topPolygonVertexCount; ++i, q = p++) {
          indices[ii++] = topPolygonCenterVertexIndex;
          indices[ii++] = topPolygonCenterVertexIndex + q;
          indices[ii++] = topPolygonCenterVertexIndex + p;
        }
        // Outer surface quads, two triangles each.
        for (let i = 0, p = 0; i < topPolygonVertexCount; ++i, p += 4) {
          indices[ii++] = sideQuadsVertexIndex + p;
          indices[ii++] = sideQuadsVertexIndex + p + 2;
          indices[ii++] = sideQuadsVertexIndex + p + 3;
          indices[ii++] = sideQuadsVertexIndex + p + 2;
          indices[ii++] = sideQuadsVertexIndex + p;
          indices[ii++] = sideQuadsVertexIndex + p + 1;
        }
      };
      // Stack the two prisms.
      const halfDepth = this.bridgeService.bridgeHalfWidth;
      const pierHeight = this.bridgeService.designConditions.pierHeight - SiteConstants.GAP_DEPTH - TerrainModelService.WATER_LEVEL;
      addPrism(
        -PierModelService.PILLOW_HEIGHT,
        PierModelService.PIER_HALF_WIDTH,
        pierHeight - PierModelService.BASE_HEIGHT - PierModelService.PILLOW_HEIGHT,
        halfDepth,
        PierModelService.PIER_CUSP_WIDTH,
        PierModelService.PIER_TAPER,
      );
      addPrism(
        PierModelService.BASE_HEIGHT - pierHeight,
        PierModelService.PIER_HALF_WIDTH * PierModelService.PIER_TAPER + PierModelService.PIER_BASE_SHOULDER,
        PierModelService.BASE_HEIGHT,
        halfDepth * PierModelService.PIER_TAPER + PierModelService.PIER_BASE_SHOULDER * 0.5,
        PierModelService.PIER_CUSP_WIDTH * PierModelService.PIER_TAPER + PierModelService.PIER_BASE_SHOULDER * 0.5,
        PierModelService.BASE_TAPER,
      );
      return { positions, normals, texCoords, indices };
    };

    const buildColoredMesh = (): MeshData => {
      const halfDepth = this.bridgeService.bridgeHalfWidth;
      const indices = new Uint16Array(18);
      const positions = new Float32Array(42);
      const normals = new Float32Array(42);
      const materialRefs = new Uint16Array(14).fill(Material.PaintedSteel);
      const halfWidth = PierModelService.PILLOW_HEIGHT;
      let ip = 0,
        ii = 0;

      const addPoint = (x: number, y: number, z: number, nx: number, ny: number, nz: number = 0): void => {
        positions[ip] = x;
        positions[ip + 1] = y;
        positions[ip + 2] = z;
        normals[ip] = nx;
        normals[ip + 1] = ny;
        normals[ip + 2] = nz;
        ip += 3;
      };

      const addPointPair = (x: number, y: number, nx: number, ny: number): void => {
        addPoint(x, y, -halfDepth, nx, ny);
        addPoint(x, y, halfDepth, nx, ny);
      };

      const addTriangleIndices = (a: number, b: number, c: number) => {
        indices[ii++] = a;
        indices[ii++] = b;
        indices[ii++] = c;
      };

      // Joint pillow. Two pyramid facess.
      addPointPair(-halfWidth, -halfWidth, -Math.SQRT1_2, Math.SQRT1_2);
      addPointPair(0, 0, -Math.SQRT1_2, Math.SQRT1_2);
      addTriangleIndices(0, 3, 2);
      addTriangleIndices(3, 0, 1);

      const positionCount1 = ip / 3;
      addPointPair(0, 0, Math.SQRT1_2, Math.SQRT1_2);
      addPointPair(halfWidth, -halfWidth, Math.SQRT1_2, Math.SQRT1_2);
      addTriangleIndices(positionCount1, positionCount1 + 3, positionCount1 + 2);
      addTriangleIndices(positionCount1 + 3, positionCount1, positionCount1 + 1);

      // Front cap triangle.
      const positionCount2 = ip / 3;
      addPoint(-halfWidth, -halfWidth, halfDepth, 0, 0, 1);
      addPoint(halfWidth, -halfWidth, halfDepth, 0, 0, 1);
      addPoint(0, 0, halfDepth, 0, 0, 1);
      addTriangleIndices(positionCount2, positionCount2 + 1, positionCount2 + 2);

      // Rear cap triangle.
      const positionCount3 = ip / 3;
      addPoint(-halfWidth, -halfWidth, -halfDepth, 0, 0, -1);
      addPoint(0, 0, -halfDepth, 0, 0, -1);
      addPoint(halfWidth, -halfWidth, -halfDepth, 0, 0, -1);
      addTriangleIndices(positionCount3, positionCount3 + 1, positionCount3 + 2);

      return { positions, normals, materialRefs, indices };
    };
    return { texturedMeshData: buildTexturedMesh(), coloredMeshData: buildColoredMesh() };
  }
}
