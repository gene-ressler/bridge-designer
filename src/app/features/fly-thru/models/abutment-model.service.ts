import { Injectable } from '@angular/core';
import { TerrainModelService } from './terrain-model.service';
import { BridgeService } from '../../../shared/services/bridge.service';
import { SiteConstants } from '../../../shared/classes/site.model';
import { MeshData } from '../rendering/mesh-rendering.service';
import { Material } from './materials';
import { mat4, vec3 } from 'gl-matrix';

/** A container for the singleton abutment model. */
@Injectable({ providedIn: 'root' })
export class AbutmentModelService {
  /*
  private static readonly abutmentStepHeight = BridgeView.abutmentStepHeight;
  private static readonly abutmentStepInset = BridgeView.abutmentStepInset;
  private static readonly abutmentStepWidth = BridgeView.abutmentStepWidth;
  private static readonly accessSlope = BridgeView.accessSlope;
  private static readonly anchorOffset = DesignConditions.anchorOffset;
  private static readonly bankSlope = 2.0;
  private static readonly blufCoeff = (-0.5 * bankSlope) / (tInflection - (blufSetback + halfGapWidth));
  private static readonly blufSetback = TerrainModelService.GAP_HALF_WIDTH * 0.2;
  private static readonly deckHalfWidth = Animation.deckHalfWidth;
  private static readonly epsPaint = 0.05;
  private static readonly halfGapWidth = 24.0;
  private static readonly halfTerrainSize = 192;
  private static readonly roadCutSlope = 1;
  private static readonly stoneTextureSize = 0.3;
  private static readonly tangentOffset = BridgeView.tangentOffset;
  private static readonly tBlufAtBridge = halfGapWidth + blufSetback;
  private static readonly tInflection = halfGapWidth - blufSetback;
  private static readonly tWaterEdge = (waterLevel - yGorgeBottom) / bankSlope;
  private static readonly waterLevel = -26.0;
  private static readonly wearSurfaceHeight = BridgeView.wearSurfaceHeight;
  private static readonly yGorgeBottom = -halfGapWidth * bankSlope;
*/
  private readonly offset = vec3.create();

  constructor(
    private readonly bridgeService: BridgeService,
    private readonly terrainModelService: TerrainModelService,
  ) {}

  public buildAbutmentForDesignConditions(): { texturedMeshData: MeshData; coloredMeshData: MeshData } {
    // Comments use the default view as reference frame. We're modeling the
    // left abutment. Front and rear are the flanks wrt the eye; front is closer.

    const conditions = this.bridgeService.designConditions;
    const archHeight = conditions.isArch ? conditions.underClearance : 0;
    const halfWidth = this.bridgeService.bridgeHalfWidth;
    const shelfY = SiteConstants.ABUTMENT_STEP_HEIGHT - archHeight;
    // S tex coord values of the edges facing the gap. The coordinates start in the
    // middle of the gap face and wrap in S around each side.
    const frontFaceTexOriginS = halfWidth + SiteConstants.ABUTMENT_FACE_X;
    const rearFaceTexOriginS = -frontFaceTexOriginS;
    const [leftX, leftIndex] = this.terrainModelService.leftAbutmentEndX;
    const faceX = SiteConstants.ABUTMENT_FACE_X;
    const insetX = SiteConstants.ABUTMENT_STEP_INSET;
    const deckY = SiteConstants.DECK_HEIGHT;
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
        positions.push(x, y, -halfWidth);
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
        const roadElevation = this.terrainModelService.roadCenterLine[j].elevation;
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
        positions.push(x, y, halfWidth);
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
        positions.push(x, y, -halfWidth, x, y, halfWidth);
        normals.push(1, 0, 0, 1, 0, 0);
        const texT = texScale * y;
        texCoords.push(texScale * -halfWidth, texT, texScale * halfWidth, texT);
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
        positions.push(x, shelfY, -halfWidth, x, shelfY, halfWidth);
        normals.push(0, 1, 0, 0, 1, 0);
        const texT = texScale * (shelfY + x - insetX);
        texCoords.push(texScale * -halfWidth, texT, texScale * halfWidth, texT);
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
      const materialRef = Material.Aluminum; // Concrete-ish.

      const addPointPair = (x: number, y: number, nx: number, ny: number): void => {
        positions.push(x, y, -halfWidth, x, y, halfWidth);
        normals.push(nx, ny, 0, nx, ny, 0);
        materialRefs.push(materialRef, materialRef);
      };

      // Shoulders of abutment wear surfaces.
      for (let j = leftIndex, x = leftX; j < halfGridCount; ++j, x += TerrainModelService.METERS_PER_GRID) {
        if (x >= insetX) {
          addPointPair(insetX, deckY, 0, 1);
          break;
        }
        const roadPost = this.terrainModelService.roadCenterLine[j];
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
      positions.push(-faceX, shelfY, halfWidth);
      positions.push(faceX, shelfY, halfWidth);
      positions.push(0, -archHeight, halfWidth);
      normals.push(0, 0, 1, 0, 0, 1, 0, 0, 1);
      materialRefs.push(materialRef, materialRef, materialRef);
      indices.push(positionCount3, positionCount3 + 1, positionCount3 + 2);

      // Rear cap triangle.
      const positionCount4 = positions.length / 3;
      positions.push(-faceX, shelfY, -halfWidth);
      positions.push(0, -archHeight, -halfWidth);
      positions.push(faceX, shelfY, -halfWidth);
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

  /*

    private void initializeAbutment(float archHeight, float halfWidth) {

        abutmentFaceNormals = new float [] {
            1, 0, 0,
            0, 1, 0,
            1, 0, 0,
        };
        abutmentRearFace = new float[abutmentFaceNormals.length + 3];
        abutmentFrontFace = new float[abutmentFaceNormals.length + 3];

        int iFace = 0;
        int iFlank = 0;
        int iPillow = 0;

        abutmentRearFace[iFace + 0] = abutmentFrontFace[iFace + 0] = abutmentStepInset;
        abutmentRearFace[iFace + 1] = abutmentFrontFace[iFace + 1] = wearSurfaceHeight;
        abutmentRearFace[iFace + 2] = -halfWidth;
        abutmentFrontFace[iFace + 2] = halfWidth;
        iFace += 3;

        // Allocate oversize buffer and copy to final ones later.
        float flank [] = new float [3 * (postCount + 4)];

        // Search for j grid coordinate of left edge of abutment.
        int jAbutmentLeft;
        for (jAbutmentLeft = halfGridCount; jAbutmentLeft > 1; jAbutmentLeft--) {
            if (roadCenterline[jAbutmentLeft].elevation - posts[halfGridCount][jAbutmentLeft].elevation <= 2 * epsPaint) {
                break;
            }
        }
        --jAbutmentLeft;
        float xAbutmentLeft = xGridToWorld(jAbutmentLeft);

        // Inner corner of abutment step.
        abutmentRearFace[iFace + 0] = abutmentFrontFace[iFace + 0] = flank[iFlank + 0] =
            pillowRearFace[iPillow + 0] = pillowFrontFace[iPillow + 0] = abutmentStepInset;
        abutmentRearFace[iFace + 1] = abutmentFrontFace[iFace + 1] = flank[iFlank + 1] =
            pillowRearFace[iPillow + 1] = pillowFrontFace[iPillow + 1] = abutmentStepHeight - archHeight;
        flank[iFlank + 2] = -halfWidth;
        abutmentRearFace[iFace + 2] = pillowRearFace[iPillow + 2] = -halfWidth;
        abutmentFrontFace[iFace + 2] = pillowFrontFace[iPillow + 2] = halfWidth;
        iFace += 3;
        iFlank += 3;
        iPillow += 3;

        // Peak of pillow.
        pillowRearFace[iPillow + 0] = pillowFrontFace[iPillow + 0] = 0.5 * (abutmentStepInset + abutmentStepWidth);
        pillowRearFace[iPillow + 1] = pillowFrontFace[iPillow + 1] = -archHeight;
        pillowRearFace[iPillow + 2] = -halfWidth;
        pillowFrontFace[iPillow + 2] = halfWidth;
        iPillow += 3;

        // Step.
        abutmentRearFace[iFace + 0] = abutmentFrontFace[iFace + 0] = flank[iFlank + 0] =
            pillowRearFace[iPillow + 0] = pillowFrontFace[iPillow + 0] = abutmentStepWidth;
        abutmentRearFace[iFace + 1] = abutmentFrontFace[iFace + 1] = flank[iFlank + 1] =
            pillowRearFace[iPillow + 1] = pillowFrontFace[iPillow + 1] = abutmentStepHeight - archHeight;
        flank[iFlank + 2] = -halfWidth;
        abutmentRearFace[iFace + 2] = pillowRearFace[iPillow + 2] = -halfWidth;
        abutmentFrontFace[iFace + 2] = pillowFrontFace[iPillow + 2] = halfWidth;
        iFlank += 3;
        iFace += 3;

        // Base of face.
        abutmentRearFace[iFace + 0] = abutmentFrontFace[iFace + 0] = flank[iFlank + 0] = abutmentStepWidth;
        abutmentRearFace[iFace + 1] = abutmentFrontFace[iFace + 1] = flank[iFlank + 1] = yWater;
        flank[iFlank + 2] = -halfWidth;
        abutmentRearFace[iFace + 2] = -halfWidth;
        abutmentFrontFace[iFace + 2] = halfWidth;
        iFlank += 3;
        iFace += 3;

        // Base rear.
        flank[iFlank + 0] = xAbutmentLeft;
        flank[iFlank + 1] = yWater;
        flank[iFlank + 2] = -halfWidth;
        iFlank += 3;

        // Add points for wear surface left to right.
        int iTop = iFlank;
        float x = xAbutmentLeft;
        for (int j = jAbutmentLeft; j < postCount; j++) {
            if (x >= abutmentStepInset) {
                // Rightmost wear surface point.
                flank[iFlank + 0] = abutmentStepInset;
                flank[iFlank + 1] = wearSurfaceHeight;
                flank[iFlank + 2] = -halfWidth;
                iFlank += 3;
                break;
            }
            else {
                flank[iFlank + 0] = x;
                flank[iFlank + 1] = roadCenterline[j].elevation - 0.03;
                flank[iFlank + 2] = -halfWidth;
                iFlank += 3;
            }
            x += metersPerGrid;
        }

        abutmentFrontTop = new float [iFlank - iTop];
        abutmentRearTop = new float [iFlank - iTop];
        for (int i = 0; i < abutmentFrontTop.length; i += 3) {
            abutmentRearTop[i + 0] = abutmentFrontTop[i + 0] = flank[iTop + i + 0];
            abutmentRearTop[i + 1] = abutmentFrontTop[i + 1] = flank[iTop + i + 1];
            abutmentRearTop[i + 2] = flank[iTop + i + 2];
            abutmentFrontTop[i + 2] = -flank[iTop + i + 2];
        }
        abutmentFrontFlank = new float[iFlank];
        abutmentRearFlank = new float[iFlank];

        // Copy points in forward order for rear flank polygon and in reverse order for front.
        System.arraycopy(flank, 0, abutmentRearFlank, 0, iFlank);

        abutmentFrontFlank[0] =  abutmentRearFlank[0];
        abutmentFrontFlank[1] =  abutmentRearFlank[1];
        abutmentFrontFlank[2] = -abutmentRearFlank[2];
        int j = abutmentRearFlank.length - 3;
        for (int i = 1 * 3; i < iFlank; i += 3, j -= 3) {
            abutmentFrontFlank[i + 0] =  abutmentRearFlank[j + 0];
            abutmentFrontFlank[i + 1] =  abutmentRearFlank[j + 1];
            abutmentFrontFlank[i + 2] = -abutmentRearFlank[j + 2];
        }

        abutmentFrontFaceTexture = new float [abutmentFrontFace.length * 2 / 3];
        abutmentRearFaceTexture = new float [abutmentFrontFace.length * 2 / 3];
        int i3 = 0;
        for (int i2 = 0; i2 < abutmentFrontFaceTexture.length; i2 += 2, i3 += 3) {
            abutmentFrontFaceTexture[i2] = stoneTextureSize * abutmentFrontFace[i3 + 2];
            abutmentRearFaceTexture[i2] = stoneTextureSize * abutmentRearFace[i3 + 2];
            abutmentFrontFaceTexture[i2 + 1] = abutmentRearFaceTexture[i2 + 1] = stoneTextureSize * abutmentFrontFace[i3 + 1];
        }
        abutmentFrontFlankTexture = new float [abutmentFrontFlank.length * 2 / 3];
        abutmentRearFlankTexture = new float [abutmentFrontFlank.length * 2 / 3];
        j = 0;
        for (int i = 0; i < abutmentFrontFlankTexture.length; i += 2, j += 3) {
            abutmentFrontFlankTexture[i] = stoneTextureSize * abutmentFrontFlank[j];
            abutmentFrontFlankTexture[i + 1] = stoneTextureSize * abutmentFrontFlank[j + 1];
            abutmentRearFlankTexture[i] = stoneTextureSize * abutmentRearFlank[j];
            abutmentRearFlankTexture[i + 1] = stoneTextureSize * abutmentRearFlank[j + 1];
        }
    }

    protected void setToTerrainY(float [] v, int i, float dy) {
        v[i+1] = getElevationAt(v[i+0], v[i+2]) + dy;
    }
*/
  /* 
        gl.glColor3vf(abutmentMaterial, 0);
        gl.glActiveTexture(GL2.GL_TEXTURE0);
        pierTexture.enable(gl);
        pierTexture.bind(gl);
        
        gl.glBegin(GL2.GL_TRIANGLE_FAN);
        gl.glNormal3f(0, 0, 1);
        int i2 = 0;
        for (int i3 = 0; i3 < abutmentFrontFlank.length; i3 += 3, i2 += 2) {
            gl.glTexCoord2fv(abutmentFrontFlankTexture, i2);
            gl.glVertex3fv(abutmentFrontFlank, i3);
        }
        gl.glEnd();

        gl.glBegin(GL2.GL_TRIANGLE_FAN);
        gl.glNormal3f(0, 0, -1);
        i2 = 0;
        for (int i3 = 0; i3 < abutmentRearFlank.length; i3 += 3, i2 += 2) {
            gl.glTexCoord2fv(abutmentRearFlankTexture, i2);
            gl.glVertex3fv(abutmentRearFlank, i3);            
        }
        gl.glEnd();
        
        gl.glBegin(GL2.GL_QUADS);
        i2 = 0;
        for (int i3 = 0; i3 < abutmentFaceNormals.length; i3 += 3, i2 += 2) {
            gl.glNormal3fv(abutmentFaceNormals, i3);
            
            gl.glTexCoord2fv(abutmentRearFaceTexture, i2);
            gl.glVertex3fv(abutmentRearFace, i3);
            
            gl.glTexCoord2fv(abutmentFrontFaceTexture, i2);
            gl.glVertex3fv(abutmentFrontFace, i3);
            
            gl.glTexCoord2fv(abutmentFrontFaceTexture, i2 + 2);
            gl.glVertex3fv(abutmentFrontFace, i3 + 3);
            
            gl.glTexCoord2fv(abutmentRearFaceTexture, i2 + 2);
            gl.glVertex3fv(abutmentRearFace, i3 + 3);
        }
        gl.glEnd();
        pierTexture.disable(gl);
        
        // Top shoulder.
        gl.glColor3fv(flatTerrainMaterial, 0);
        gl.glBegin(GL2.GL_QUAD_STRIP);
        gl.glNormal3f(0f, 1f, 0f);
        for (int i = 0; i < abutmentFrontTop.length; i += 3) {
            gl.glVertex3fv(abutmentRearTop, i);
            gl.glVertex3fv(abutmentFrontTop, i);
        }
        gl.glEnd();
        
        // Pillow
        gl.glColor3fv(pillowMaterial, 0);
        gl.glBegin(GL2.GL_TRIANGLES);
        gl.glNormal3f(0f, 0f, 1f);
        for (int i = pillowFrontFace.length - 3; i >= 0; i -= 3) {
            gl.glVertex3fv(pillowFrontFace, i);
        }
        gl.glNormal3f(0f, 0f, -1f);
        for (int i = 0; i < pillowRearFace.length; i += 3) {
            gl.glVertex3fv(pillowRearFace, i);
        }
        gl.glEnd();
        gl.glBegin(GL2.GL_QUADS);
        int j = 0;
        for (int i = 3; i < pillowFrontFace.length; j = i, i += 3) {
            final float dx = pillowFrontFace[i + 0] - pillowFrontFace[j + 0];
            final float dy = pillowFrontFace[i + 1] - pillowFrontFace[j + 1];
            gl.glNormal3f(-dy, dx, 0f);
            gl.glVertex3fv(pillowRearFace, j);
            gl.glVertex3fv(pillowFrontFace, j);
            gl.glVertex3fv(pillowFrontFace, i);
            gl.glVertex3fv(pillowRearFace, i);
        }
        gl.glEnd();        
  */
}
