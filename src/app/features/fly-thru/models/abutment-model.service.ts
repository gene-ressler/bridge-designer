import { Injectable } from '@angular/core';
import { TerrainModelService } from './terrain-model.service';
import { BridgeService } from '../../../shared/services/bridge.service';
import { SiteConstants } from '../../../shared/classes/site-constants';
import { MeshData } from '../rendering/mesh-rendering.service';
import { Material } from './materials';
import { mat4, vec3 } from 'gl-matrix';

/** A container for the singleton abutment model. */
@Injectable({ providedIn: 'root' })
export class AbutmentModelService {
  private readonly offset = vec3.create();

  constructor(
    private readonly bridgeService: BridgeService,
    private readonly terrainModelService: TerrainModelService,
  ) {}

  public buildAbutment(): { texturedMeshData: MeshData; coloredMeshData: MeshData } {
    // Comments use the default view as reference frame. We're modeling the
    // left abutment. Front and rear are the flanks wrt the eye; front is closer.
    const conditions = this.bridgeService.designConditions;
    const archHeight = conditions.isArch ? conditions.underClearance : 0;
    const halfDepth = this.bridgeService.bridgeHalfWidth;
    const shelfY = SiteConstants.ABUTMENT_STEP_HEIGHT - archHeight;
    // S tex coord values of the edges facing the gap. The coordinates start in the
    // middle of the gap face and wrap in S around each side.
    const frontFaceTexOriginS = halfDepth + SiteConstants.ABUTMENT_FACE_X;
    const rearFaceTexOriginS = -frontFaceTexOriginS;
    const [leftX, leftIndex] = this.terrainModelService.leftAbutmentEndX;
    const faceX = SiteConstants.ABUTMENT_FACE_X;
    const insetX = SiteConstants.ABUTMENT_STEP_X;
    const deckY = SiteConstants.DECK_TOP_HEIGHT;
    const halfGridCount = TerrainModelService.HALF_GRID_COUNT;
    const waterY = this.terrainModelService.getElevationAtIJ(halfGridCount, halfGridCount);

    // Create left and right abutment instance transforms, used by both meshes.
    const instanceModelTransforms = new Float32Array(2 * 16);
    const leftModelTransform = instanceModelTransforms.subarray(0, 16);
    mat4.identity(leftModelTransform);
    const rightModelTransform = instanceModelTransforms.subarray(16, 32);
    mat4.fromTranslation(rightModelTransform, vec3.set(this.offset, conditions.spanLength, 0, 0));
    mat4.rotateY(rightModelTransform, rightModelTransform, Math.PI);

    // Use a closure as a namespace.
    const buildTexturedMesh = (): MeshData => {
      // Textured mesh
      const indices: number[] = [];
      const positions: number[] = [];
      const normals: number[] = [];
      const texCoords: number[] = [];
      const texScale = 0.4;

      // Rear face.
      const addRearFacePoint = (x: number, y: number): void => {
        positions.push(x, y, -halfDepth);
        normals.push(0, 0, -1);
        texCoords.push(texScale * (rearFaceTexOriginS + x), texScale * y);
      };
      // Left bottom of abutment.
      addRearFacePoint(leftX, waterY);
      // Wear surface
      for (let j = leftIndex, x = leftX; j < halfGridCount; ++j, x += TerrainModelService.METERS_PER_GRID) {
        if (x >= insetX) {
          addRearFacePoint(insetX, deckY);
          break;
        }
        const roadElevation = this.terrainModelService.getRoadCenterlinePostAtJ(j).elevation;
        addRearFacePoint(x, roadElevation - TerrainModelService.EPS_PAINT);
      }
      // Left corner of shelf.
      addRearFacePoint(insetX, shelfY);
      // Right corner of shelf.
      addRearFacePoint(faceX, shelfY);
      // Right bottom of abutment.
      addRearFacePoint(faceX, waterY);
      const positionCount1 = positions.length / 3;
      // Indices for a triangle fan with apex at the rear face's left bottom.
      for (let i = 1; i < positionCount1 - 1; ++i) {
        indices.push(0, i, i + 1);
      }
      // Remember size of rear face before any changes.
      const rearFaceLength = positions.length;
      // Front face.
      const addFrontFacePoint = (x: number, y: number): void => {
        positions.push(x, y, halfDepth);
        normals.push(0, 0, 1);
        texCoords.push(texScale * (frontFaceTexOriginS - x), texScale * y);
      };
      // Left bottom of abutment.
      addFrontFacePoint(leftX, waterY);
      // Reverse rest of points (skipping first just added).
      for (let iFrom = rearFaceLength - 3; iFrom >= 3; iFrom -= 3) {
        addFrontFacePoint(positions[iFrom], positions[iFrom + 1]);
      }
      // Indices for a triangle fan with apex at the front face's left bottom.
      for (let i = 1; i < positionCount1 - 1; ++i) {
        indices.push(positionCount1, positionCount1 + i, positionCount1 + i + 1);
      }
      const addRightFacePointPair = (x: number, y: number) => {
        positions.push(x, y, -halfDepth, x, y, halfDepth);
        normals.push(1, 0, 0, 1, 0, 0);
        const texT = texScale * y;
        texCoords.push(texScale * -halfDepth, texT, texScale * halfDepth, texT);
      };
      // Lower right face.
      const positionCount2 = positions.length / 3;
      addRightFacePointPair(faceX, shelfY);
      addRightFacePointPair(faceX, waterY);
      indices.push(positionCount2, positionCount2 + 3, positionCount2 + 2);
      indices.push(positionCount2 + 3, positionCount2, positionCount2 + 1);

      // Upper right face.
      const positionCount3 = positions.length / 3;
      addRightFacePointPair(insetX, deckY);
      addRightFacePointPair(insetX, shelfY);
      indices.push(positionCount3, positionCount3 + 3, positionCount3 + 2);
      indices.push(positionCount3 + 3, positionCount3, positionCount3 + 1);

      // Visible part of shelf.
      const addShelfFacePointPair = (x: number) => {
        positions.push(x, shelfY, -halfDepth, x, shelfY, halfDepth);
        normals.push(0, 1, 0, 0, 1, 0);
        const texT = texScale * (shelfY + x - insetX);
        texCoords.push(texScale * -halfDepth, texT, texScale * halfDepth, texT);
      };

      const positionCount4 = positions.length / 3;
      addShelfFacePointPair(insetX);
      addShelfFacePointPair(-faceX);
      indices.push(positionCount4, positionCount4 + 3, positionCount4 + 2);
      indices.push(positionCount4 + 3, positionCount4, positionCount4 + 1);

      return {
        indices: new Uint16Array(indices),
        positions: new Float32Array(positions),
        normals: new Float32Array(normals),
        texCoords: new Float32Array(texCoords),
        instanceModelTransforms,
      };
    };

    const buildColoredMesh = (): MeshData => {
      const indices: number[] = [];
      const positions: number[] = [];
      const normals: number[] = [];
      const materialRefs: number[] = [];
      const materialRef = Material.PaintedSteel; // Concrete-ish.

      const addPointPair = (x: number, y: number, nx: number, ny: number): void => {
        positions.push(x, y, -halfDepth, x, y, halfDepth);
        normals.push(nx, ny, 0, nx, ny, 0);
        materialRefs.push(materialRef, materialRef);
      };

      // Shoulders of abutment wear surfaces.
      for (let j = leftIndex, x = leftX; j < halfGridCount; ++j, x += TerrainModelService.METERS_PER_GRID) {
        if (x >= insetX) {
          addPointPair(insetX, deckY, 0, 1);
          break;
        }
        const roadPost = this.terrainModelService.getRoadCenterlinePostAtJ(j);
        addPointPair(x, roadPost.elevation - TerrainModelService.EPS_PAINT, roadPost.xNormal, roadPost.yNormal);
      }
      // Triangle pairs, one per quad
      const positionCount1 = positions.length / 3;
      for (let i = 0; i < positionCount1 - 2; i += 2) {
        indices.push(i, i + 3, i + 2, i + 3, i, i + 1);
      }
      // Joint pillow. Two pyramid facess.
      addPointPair(-faceX, shelfY, -Math.SQRT1_2, Math.SQRT1_2);
      addPointPair(0, -archHeight, -Math.SQRT1_2, Math.SQRT1_2);
      indices.push(positionCount1, positionCount1 + 3, positionCount1 + 2);
      indices.push(positionCount1 + 3, positionCount1, positionCount1 + 1);

      const positionCount2 = positions.length / 3;
      addPointPair(0, -archHeight, Math.SQRT1_2, Math.SQRT1_2);
      addPointPair(faceX, shelfY, Math.SQRT1_2, Math.SQRT1_2);
      indices.push(positionCount2, positionCount2 + 3, positionCount2 + 2);
      indices.push(positionCount2 + 3, positionCount2, positionCount2 + 1);

      // Front cap triangle.
      const positionCount3 = positions.length / 3;
      positions.push(-faceX, shelfY, halfDepth);
      positions.push(faceX, shelfY, halfDepth);
      positions.push(0, -archHeight, halfDepth);
      normals.push(0, 0, 1, 0, 0, 1, 0, 0, 1);
      materialRefs.push(materialRef, materialRef, materialRef);
      indices.push(positionCount3, positionCount3 + 1, positionCount3 + 2);

      // Rear cap triangle.
      const positionCount4 = positions.length / 3;
      positions.push(-faceX, shelfY, -halfDepth);
      positions.push(0, -archHeight, -halfDepth);
      positions.push(faceX, shelfY, -halfDepth);
      normals.push(0, 0, -1, 0, 0, -1, 0, 0, -1);
      materialRefs.push(materialRef, materialRef, materialRef);
      indices.push(positionCount4, positionCount4 + 1, positionCount4 + 2);

      return {
        indices: new Uint16Array(indices),
        positions: new Float32Array(positions),
        normals: new Float32Array(normals),
        materialRefs: new Uint16Array(materialRefs),
        instanceModelTransforms,
      };
    };
    return { texturedMeshData: buildTexturedMesh(), coloredMeshData: buildColoredMesh() };
  }
}
