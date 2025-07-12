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
import { DesignConditions } from '../../../shared/services/design-conditions.service';
import { SimulationStateService } from '../rendering/simulation-state.service';
import { GlService } from '../rendering/gl.service';

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
  private readonly jointLocationsTmp = new Float32Array(2 * DesignConditions.MAX_JOINT_COUNT);

  constructor(
    private readonly bridgeService: BridgeService,
    private readonly glService: GlService,
    private readonly simlulationStateService: SimulationStateService,
  ) {}

  public createForCurrentAnalysis(): BridgeMeshData {
    // TODO: Temporary for testing as colored mesh. Revise instance shader so color refs are per instance.
    const materialRefs = new Uint16Array(this.bridgeService.bridge.members.length);
    materialRefs.fill(Material.CorrogatedMetal);
    const trussOffset = this.bridgeService.trussCenterlineOffset;
    const okForCrossBraces = this.bridgeService.membersNotTransectingRoadwayClearance;
    const jointLocations = this.simlulationStateService.interpolator.getAllDisplacedJointLocations(
      this.jointLocationsTmp,
    );
    const gl = this.glService.gl;
    return {
      memberMeshData: {
        positions: BridgeModelService.MEMBER_POSITIONS,
        normals: BridgeModelService.MEMBER_NORMALS,
        indices: BridgeModelService.MEMBER_INDICES,
        materialRefs,
        instanceModelTransforms: this.buildMemberInstanceTransforms(undefined, jointLocations, trussOffset),
        usage: { instanceModelTransforms: gl.STREAM_DRAW },
      },
      deckBeamMeshData: {
        instanceModelTransforms: this.buildDeckBeamInstanceTransforms(undefined, jointLocations),
        usage: { instanceModelTransforms: gl.STREAM_DRAW },
        ...DECK_BEAM_MESH_DATA,
      },
      deckSlabMeshData: {
        instanceModelTransforms: this.buildDeckSlabInstanceTransforms(undefined, jointLocations),
        usage: { instanceModelTransforms: gl.STREAM_DRAW },
        ...DECK_SLAB_MESH_DATA,
      },
      stiffeningWireData: {
        positions: BridgeModelService.WIRE_POSITIONS,
        directions: BridgeModelService.WIRE_DIRECTIONS,
        indices: BridgeModelService.WIRE_INDICES,
        instanceModelTransforms: this.buildWireInstanceTransforms(
          undefined,
          jointLocations,
          trussOffset,
          okForCrossBraces,
        ),
        usage: { instanceModelTransforms: gl.STREAM_DRAW },
      },
      trussCenterlineOffset: trussOffset,
      membersNotTransectingRoadwayClearance: okForCrossBraces,
    };
  }

  /** Update the model transforms in the given bridge mesh data for current joint positions. */
  public updateForCurrentJointLocations(bridgeMeshData: BridgeMeshData) {
    const jointLocations = this.simlulationStateService.interpolator.getAllDisplacedJointLocations(
      this.jointLocationsTmp,
    );
    this.buildMemberInstanceTransforms(
      bridgeMeshData.memberMeshData.instanceModelTransforms,
      jointLocations,
      bridgeMeshData.trussCenterlineOffset,
    );
    this.buildDeckBeamInstanceTransforms(bridgeMeshData.deckBeamMeshData.instanceModelTransforms, jointLocations);
    this.buildDeckSlabInstanceTransforms(bridgeMeshData.deckSlabMeshData.instanceModelTransforms, jointLocations);
    this.buildWireInstanceTransforms(
      bridgeMeshData.stiffeningWireData.instanceModelTransforms,
      jointLocations,
      bridgeMeshData.trussCenterlineOffset,
      bridgeMeshData.membersNotTransectingRoadwayClearance,
    );
  }

  private buildDeckBeamInstanceTransforms(out: Float32Array | undefined, jointLocations: Float32Array): Float32Array {
    const deckJointCount = this.bridgeService.designConditions.loadedJointCount;
    out ||= new Float32Array(deckJointCount * 16);
    const halfWidth = BridgeModelService.DECK_BEAM_HALF_WIDTH;
    const height = SiteConstants.DECK_TOP_HEIGHT - this.bridgeService.designConditions.deckThickness;
    for (let i = 0, i2 = 0, offset = 0; i < deckJointCount; ++i, i2 += 2, offset += 16) {
      const jointX = jointLocations[i2];
      const jointY = jointLocations[i2 + 1];
      const m = out.subarray(offset, offset + 16);
      mat4.fromTranslation(m, vec3.set(this.vTmp, jointX, jointY, 0));
      mat4.scale(m, m, vec3.set(this.vTmp, halfWidth, height, SiteConstants.DECK_HALF_WIDTH));
    }
    return out;
  }

  public buildDeckSlabInstanceTransforms(out: Float32Array | undefined, jointLocations: Float32Array): Float32Array {
    const slabCount = this.bridgeService.designConditions.panelCount;
    out ||= new Float32Array(slabCount * 16);
    const maxSlabIndex = slabCount - 1;
    const thickness = this.bridgeService.designConditions.deckThickness;
    const heightAboveJoint = SiteConstants.DECK_TOP_HEIGHT - this.bridgeService.designConditions.deckThickness;
    for (let i = 0, i2 = 0, offset = 0; i <= maxSlabIndex; ++i, i2 += 2, offset += 16) {
      const jointAX = jointLocations[i2];
      const jointAY = jointLocations[i2 + 1];
      const jointBX = jointLocations[i2 + 2];
      const jointBY = jointLocations[i2 + 3];
      const dx = jointBX - jointAX;
      const dy = jointBY - jointAY;
      const memberLength = Math.hypot(dx, dy);
      const m = out.subarray(offset, offset + 16);
      const length = i === 0 || i === maxSlabIndex ? memberLength + SiteConstants.DECK_CANTILEVER : memberLength;
      mat4.fromTranslation(m, vec3.set(this.vTmp, jointAX, jointAY + heightAboveJoint, 0));
      Geometry.rotateZ(m, m, dy, dx);
      // Extra shift left for first slab so that extra cantilever rotates around the left joint
      if (i === 0) {
        mat4.translate(m, m, vec3.set(this.vTmp, -SiteConstants.DECK_CANTILEVER, 0, 0));
      }
      mat4.scale(m, m, vec3.set(this.vTmp, length, thickness, SiteConstants.DECK_HALF_WIDTH));
    }
    return out;
  }

  private buildMemberInstanceTransforms(
    out: Float32Array | undefined,
    jointLocations: Float32Array,
    trussCenterlineOffset: number,
  ): Float32Array {
    const members = this.bridgeService.bridge.members;
    out ||= new Float32Array(members.length * 32);
    for (let i = 0, offset = 0; i < members.length; ++i, offset += 32) {
      const member = members[i];
      const i2a = 2 * member.a.index;
      const jointAX = jointLocations[i2a];
      const jointAY = jointLocations[i2a + 1];
      const i2b = 2 * member.b.index;
      const jointBX = jointLocations[i2b];
      const jointBY = jointLocations[i2b + 1];
      const length = Geometry.distance2D(jointAX, jointAY, jointBX, jointBY);
      // All but the z-translation to edge or roadway.
      mat4.fromTranslation(this.mTmp, vec3.set(this.vTmp, jointAX, jointAY, 0));
      Geometry.rotateX(this.mTmp, this.mTmp, jointBY - jointAY, jointBX - jointAX);
      const sizeM = member.materialSizeMm * 0.001;
      mat4.scale(this.mTmp, this.mTmp, vec3.set(this.vTmp, length, sizeM, sizeM));
      // Front instance.
      const mFront = out.subarray(offset, offset + 16);
      mat4.copy(mFront, this.mTmp);
      mFront[14] += trussCenterlineOffset;
      // Rear instance.
      const mRear = out.subarray(offset + 16, offset + 32);
      mat4.copy(mRear, this.mTmp);
      mRear[14] -= trussCenterlineOffset;
    }
    return out;
  }

  private buildWireInstanceTransforms(
    out: Float32Array | undefined,
    jointLocations: Float32Array,
    trussCenterlineOffset: number,
    okMembers: BitVector,
  ): Float32Array {
    const members = this.bridgeService.bridge.members;
    out ||= new Float32Array(members.length * 16);
    for (let i = 0, offset = 0; i < members.length; ++i, offset += 16) {
      if (!okMembers.getBit(i)) {
        continue;
      }
      const member = members[i];
      const i2a = 2 * member.a.index;
      const jointAX = jointLocations[i2a];
      const jointAY = jointLocations[i2a + 1];
      const i2b = 2 * member.b.index;
      const jointBX = jointLocations[i2b];
      const jointBY = jointLocations[i2b + 1];
      const length = Geometry.distance2D(jointAX, jointAY, jointBX, jointBY);
      const m = out.subarray(offset, offset + 16);
      mat4.fromTranslation(m, vec3.set(this.vTmp, jointAX, jointAY, -trussCenterlineOffset));
      Geometry.rotateX(m, m, jointBY - jointAY, jointBX - jointAX);
      mat4.scale(m, m, vec3.set(this.vTmp, length, 1, 2 * trussCenterlineOffset));
    }
    return out;
  }
}
