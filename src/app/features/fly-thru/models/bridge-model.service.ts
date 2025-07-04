import { Injectable } from '@angular/core';
import { BridgeService } from '../../../shared/services/bridge.service';
import { MeshData, WireData } from '../rendering/mesh-rendering.service';
import { mat4, vec3 } from 'gl-matrix';
import { Geometry } from '../../../shared/classes/graphics';
import { Material } from './materials';
import { BitVector } from '../../../shared/core/bitvector';
import { SiteConstants } from '../../../shared/classes/site.model';
import { DECK_BEAM_MESH_DATA } from './deck-beam';
import { DECK_SLAB_MESH_DATA } from './deck-slab';

export type BridgeMeshData = {
  memberMeshData: MeshData;
  deckBeamMeshData: MeshData;
  deckSlabMeshData: MeshData;
  stiffeningWireData: WireData;
  trussCenterlineOffset: number;
  membersNotTransectingRoadwayClearance: BitVector;
};

/** Container for the graphical model of the current bridge and its creation logic. */
@Injectable({ providedIn: 'root' })
export class BridgeModelService {
  private static readonly DECK_BEAM_HALF_WIDTH = 0.1;

  // Canonical member model.
  // prettier-ignore
  private static readonly MEMBER_POSITIONS = new Float32Array([
    // front
    0,  0.5,  0.5,  // 0
    0, -0.5,  0.5,  // 1
    1, -0.5,  0.5,  // 2
    1,  0.5,  0.5,  // 3
    // back
    0,  0.5, -0.5,  // 4
    1,  0.5, -0.5,  // 5
    1, -0.5, -0.5,  // 6
    0, -0.5, -0.5,  // 7
    // top
    0,  0.5,  0.5,  // 8
    1,  0.5,  0.5,  // 9
    1,  0.5, -0.5,  // 10
    0,  0.5, -0.5,  // 11
    // bottom
    0, -0.5,  0.5,  // 12
    0, -0.5, -0.5,  // 13
    1, -0.5, -0.5,  // 14
    1, -0.5,  0.5,  // 15
  ]);

  // prettier-ignore
  private static readonly MEMBER_NORMALS = new Float32Array([
    // front
    0, 0, 1,
    0, 0, 1,
    0, 0, 1,
    0, 0, 1,
    // back
    0, 0, -1,
    0, 0, -1,
    0, 0, -1,
    0, 0, -1,
    // top
    0, 1, 0,
    0, 1, 0,
    0, 1, 0,
    0, 1, 0,
    // bottom
    0, -1, 0,
    0, -1, 0,
    0, -1, 0,
    0, -1, 0,
  ]);

  // prettier-ignore
  private static readonly MEMBER_INDICES = new Uint16Array([
    // front
    0, 2, 3,
    2, 0, 1,
    // back
    4, 6, 7,
    6, 4, 5,
    // top
    8, 10, 11,
    10, 8, 9,
    // bottom
    12, 14, 15,
    14, 12, 13,
  ]);

  // prettier-ignore
  private static readonly WIRE_POSITIONS = new Float32Array([
    // one
    0, 0, 0,
    1, 0, 1,
    // two
    1, 0, 0,
    0, 0, 1,
  ]);

  // prettier-ignore
  private static readonly WIRE_DIRECTIONS = new Float32Array([
    // one
    1, 0, 1, 1, 0, 1,
    // two
    -1, 0, 1, -1, 0, 1,
  ]);

  // prettier-ignore
  private static readonly WIRE_INDICES = new Uint16Array([
    // one
    0, 1,
    // two
    2, 3,
  ]);

  private readonly vTmp = vec3.create();
  private readonly mTmp = mat4.create();

  constructor(private readonly bridgeService: BridgeService) {}

  public buildForCurrentAnalysis(): BridgeMeshData {
    // TODO: Temporary for testing as colored mesh. Remove for impl with dedicated shader.
    const materialRefs = new Uint16Array(this.bridgeService.bridge.members.length);
    materialRefs.fill(Material.CorrogatedMetal);
    const trussOffset = this.bridgeService.trussCenterlineOffset;
    const okForCrossBraceMembers = this.bridgeService.membersNotTransectingRoadwayClearance;
    return {
      memberMeshData: {
        positions: BridgeModelService.MEMBER_POSITIONS,
        normals: BridgeModelService.MEMBER_NORMALS,
        indices: BridgeModelService.MEMBER_INDICES,
        materialRefs,
        instanceModelTransforms: this.getMemberInstanceModelTransforms(trussOffset),
      },
      deckBeamMeshData: {
        instanceModelTransforms: this.getDeckBeamInstanceModelTransforms(),
        ...DECK_BEAM_MESH_DATA,
      },
      deckSlabMeshData: {
        instanceModelTransforms: this.getDeckSlabInstanceModelTransforms(),
        ...DECK_SLAB_MESH_DATA,
      },
      stiffeningWireData: {
        positions: BridgeModelService.WIRE_POSITIONS,
        directions: BridgeModelService.WIRE_DIRECTIONS,
        indices: BridgeModelService.WIRE_INDICES,
        instanceModelTransforms: this.getWireInstanceModelTransforms(trussOffset, okForCrossBraceMembers),
      },
      trussCenterlineOffset: trussOffset,
      membersNotTransectingRoadwayClearance: okForCrossBraceMembers,
    };
  }

  /**
   * Updates the given mesh data to reflect changed state of bridge.
   * Called once per frame to change the truss shape and color.
   */
  public refreshLoadingDependentData(meshData: BridgeMeshData): void {
    meshData.memberMeshData.instanceModelTransforms = this.getMemberInstanceModelTransforms(
      meshData.trussCenterlineOffset,
    );
    meshData.stiffeningWireData.instanceModelTransforms = this.getWireInstanceModelTransforms(
      meshData.trussCenterlineOffset,
      this.bridgeService.membersNotTransectingRoadwayClearance,
    );
  }

  private getDeckBeamInstanceModelTransforms(): Float32Array {
    const joints = this.bridgeService.bridge.joints;
    const deckJointCount = this.bridgeService.designConditions.loadedJointCount;
    const modelTransforms = new Float32Array(deckJointCount * 16);
    const halfWidth = BridgeModelService.DECK_BEAM_HALF_WIDTH;
    const height = SiteConstants.DECK_TOP_HEIGHT - this.bridgeService.designConditions.deckThickness;
    for (let i = 0, offset = 0; i < deckJointCount; ++i, offset += 16) {
      const joint = joints[i];
      const m = modelTransforms.subarray(offset, offset + 16);
      mat4.fromTranslation(m, vec3.set(this.vTmp, joint.x, joint.y, 0));
      mat4.scale(m, m, vec3.set(this.vTmp, halfWidth, height, SiteConstants.DECK_HALF_WIDTH));
    }
    return modelTransforms;
  }

  private getDeckSlabInstanceModelTransforms(): Float32Array {
    const joints = this.bridgeService.bridge.joints;
    const slabCount = this.bridgeService.designConditions.panelCount;
    const modelTransforms = new Float32Array(slabCount * 16);
    const maxSlabIndex = slabCount - 1;
    const thickness = this.bridgeService.designConditions.deckThickness;
    const heightAboveJoint = SiteConstants.DECK_TOP_HEIGHT - this.bridgeService.designConditions.deckThickness;
    for (let i = 0, offset = 0; i <= maxSlabIndex; ++i, offset += 16) {
      const jointA = joints[i];
      const jointB = joints[i + 1];
      const memberLength = Geometry.distance2DPoints(jointA, jointB);
      const dx = jointB.x - jointA.x;
      const dy = jointB.y - jointA.y;
      const m = modelTransforms.subarray(offset, offset + 16);
      const length = i === 0 || i === maxSlabIndex ? memberLength + SiteConstants.DECK_CANTILEVER : memberLength;
      mat4.fromTranslation(m, vec3.set(this.vTmp, jointA.x, jointA.y + heightAboveJoint, 0));
      Geometry.rotateZ(m, m, dy, dx);
      // Extra shift left for first slab so that extra length rotates around the left joint
      if (i === 0) {
        mat4.translate(m, m, vec3.set(this.vTmp, -SiteConstants.DECK_CANTILEVER, 0, 0));
      }
      mat4.scale(m, m, vec3.set(this.vTmp, length, thickness, SiteConstants.DECK_HALF_WIDTH));
    }
    return modelTransforms;
  }

  private getMemberInstanceModelTransforms(trussCenterlineOffset: number): Float32Array {
    const members = this.bridgeService.bridge.members;
    const modelTransforms = new Float32Array(members.length * 32);
    for (let i = 0, offset = 0; i < members.length; ++i, offset += 32) {
      const member = members[i];
      // All but the z-translation to edge or roadway.
      mat4.fromTranslation(this.mTmp, vec3.set(this.vTmp, member.a.x, member.a.y, 0));
      Geometry.rotateX(this.mTmp, this.mTmp, member.b.y - member.a.y, member.b.x - member.a.x);
      const sizeM = member.materialSizeMm * 0.001;
      mat4.scale(this.mTmp, this.mTmp, vec3.set(this.vTmp, member.length, sizeM, sizeM));
      // Front instance.
      const mFront = modelTransforms.subarray(offset, offset + 16);
      mat4.copy(mFront, this.mTmp);
      mFront[14] += trussCenterlineOffset;
      // Rear instance.
      const mRear = modelTransforms.subarray(offset + 16, offset + 32);
      mat4.copy(mRear, this.mTmp);
      mRear[14] -= trussCenterlineOffset;
    }
    return modelTransforms;
  }

  private getWireInstanceModelTransforms(trussCenterlineOffset: number, okMembers: BitVector): Float32Array {
    const members = this.bridgeService.bridge.members;
    const modelTransforms = new Float32Array(members.length * 16);
    for (let i = 0, offset = 0; i < members.length; ++i, offset += 16) {
      if (!okMembers.getBit(i)) {
        continue;
      }
      const member = members[i];
      const m = modelTransforms.subarray(offset, offset + 16);
      mat4.fromTranslation(m, vec3.set(this.vTmp, member.a.x, member.a.y, -trussCenterlineOffset));
      Geometry.rotateX(m, m, member.b.y - member.a.y, member.b.x - member.a.x);
      mat4.scale(m, m, vec3.set(this.vTmp, member.length, 1, 2 * trussCenterlineOffset));
    }
    return modelTransforms;
  }
}
