import { Injectable } from '@angular/core';
import { BridgeService } from '../../../shared/services/bridge.service';
import { MeshData, WireData } from '../rendering/mesh-rendering.service';
import { mat4, vec3 } from 'gl-matrix';
import { Geometry } from '../../../shared/classes/graphics';
import { Material } from './materials';
import { BitVector } from '../../../shared/core/bitvector';
import { SiteConstants } from '../../../shared/classes/site-constants';
import { DECK_BEAM_MESH_DATA } from './deck-beam';
import { DECK_SLAB_MESH_DATA } from './deck-slab';
import { SimulationStateService } from '../rendering/simulation-state.service';
import { GlService } from '../rendering/gl.service';
import { Gusset, GussetsService } from '../../../shared/services/gussets.service';
import { TRUSS_PIN_MESH_DATA } from './truss-pin';
import { MEMBER_MESH_DATA } from './member';
import { FlyThruSettingsService } from '../rendering/fly-thru-settings.service';

// TODO: We could probably do with something lighter weight than full gussets.
export type BridgeMeshData = {
  memberMeshData: MeshData;
  deckBeamMeshData: MeshData;
  deckSlabMeshData: MeshData;
  gussetMeshData: MeshData[];
  pinMeshData: MeshData;
  stiffeningWireData: WireData;
  gussets: Gusset[];
  trussCenterlineOffset: number;
  membersNotTransectingRoadwayClearance: BitVector;
};

/** Container for the graphical model of the current bridge and its creation logic. */
@Injectable({ providedIn: 'root' })
export class BridgeModelService {
  private static readonly DECK_BEAM_HALF_WIDTH = 0.1;
  private static readonly PIN_PROTRUSION = 0.08;

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

  constructor(
    private readonly bridgeService: BridgeService,
    private readonly flyThruSettingsService: FlyThruSettingsService,
    private readonly glService: GlService,
    private readonly gussetService: GussetsService,
    private readonly simulationStateService: SimulationStateService,
  ) {}

  /** Creates mesh data for the current bridge with given, possibly displaced joint locations. */
  public createForCurrentBridge(jointLocations: Float32Array): BridgeMeshData {
    const trussCenterlineOffset = this.bridgeService.trussCenterlineOffset;
    const membersNotTransectingRoadwayClearance = this.bridgeService.membersNotTransectingRoadwayClearance;
    const gussets = this.gussetService.createGussets();
    const gl = this.glService.gl;
    return {
      memberMeshData: {
        instanceModelTransforms: this.buildMemberInstanceTransforms(undefined, jointLocations, trussCenterlineOffset),
        instanceColors: this.buildMemberInstanceColors(undefined),
        usage: { instanceModelTransforms: gl.STREAM_DRAW, instanceColors: gl.STREAM_DRAW },
        ...MEMBER_MESH_DATA,
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
          trussCenterlineOffset,
          membersNotTransectingRoadwayClearance,
        ),
        usage: { instanceModelTransforms: gl.STREAM_DRAW },
      },
      gussetMeshData: gussets.map(gusset => this.buildMeshDataForGusset(gusset, jointLocations)),
      pinMeshData: {
        instanceModelTransforms: this.buildPinInstanceModelTransforms(undefined, jointLocations, gussets),
        ...TRUSS_PIN_MESH_DATA,
      },
      gussets,
      trussCenterlineOffset,
      membersNotTransectingRoadwayClearance,
    };
  }

  public buildMemberInstanceTransforms(
    transformsOut: Float32Array | undefined,
    jointLocations: Float32Array,
    trussCenterlineOffset: number,
  ): Float32Array {
    const members = this.bridgeService.bridge.members;
    const failed = this.simulationStateService.interpolator.failedMemberKinds;
    transformsOut ||= new Float32Array(members.length * 32);
    let offset = 0;
    for (let i = 0; i < members.length; ++i) {
      if (failed[i]) {
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
      // All but the z-translation to edge or roadway.
      mat4.fromTranslation(this.mTmp, vec3.set(this.vTmp, jointAX, jointAY, 0));
      Geometry.rotateX(this.mTmp, this.mTmp, jointBY - jointAY, jointBX - jointAX);
      const sizeM = member.materialSizeMm * 0.001;
      mat4.scale(this.mTmp, this.mTmp, vec3.set(this.vTmp, length, sizeM, sizeM));
      // Front instance.
      const mFront = transformsOut.subarray(offset, offset + 16);
      mat4.copy(mFront, this.mTmp);
      mFront[14] += trussCenterlineOffset;
      // Rear instance.
      const mRear = transformsOut.subarray(offset + 16, offset + 32);
      mat4.copy(mRear, this.mTmp);
      mRear[14] -= trussCenterlineOffset;
      offset += 32;
    }
    return transformsOut;
  }

  /**
   * Builds colors representing interpolated member force strength ratios. Red is compression.
   * Blue is tension. Neutral gray is zero force. Bright color means failure is close.
   */
  public buildMemberInstanceColors(colorsOut: Float32Array | undefined): Float32Array {
    const members = this.bridgeService.bridge.members;
    colorsOut ||= new Float32Array(members.length * 6);
    if (this.flyThruSettingsService.settings.noMemberColors) {
      return colorsOut.fill(0.5);
    }
    const failed = this.simulationStateService.interpolator.failedMemberKinds;
    const forceStrengthRatios = this.simulationStateService.interpolator.memberForceStrengthRatios;
    for (let i = 0, ofs = 0; i < members.length; ++i) {
      if (failed[i]) {
        continue;
      }
      const ratio = forceStrengthRatios[i];
      if (ratio < 0) {
        // compression: interpolate between neutral gray and pure red
        const clampedRatio = 0.5 * Math.min(1, -ratio);
        colorsOut[ofs + 0] = colorsOut[ofs + 3] = 0.5 + clampedRatio;
        colorsOut[ofs + 1] = colorsOut[ofs + 4] = colorsOut[ofs + 2] = colorsOut[ofs + 5] = 0.5 - clampedRatio;
      } else {
        // tension; interpolate between neutral gray and pure blue
        const clampedRatio = 0.5 * Math.min(1, ratio);
        colorsOut[ofs + 2] = colorsOut[ofs + 5] = 0.5 + clampedRatio;
        colorsOut[ofs] = colorsOut[ofs + 3] = colorsOut[ofs + 1] = colorsOut[ofs + 4] = 0.5 - clampedRatio;
      }
      ofs += 6;
    }
    return colorsOut;
  }

  public buildDeckBeamInstanceTransforms(
    transformsOut: Float32Array | undefined,
    jointLocations: Float32Array,
  ): Float32Array {
    const deckJointCount = this.bridgeService.designConditions.loadedJointCount;
    transformsOut ||= new Float32Array(deckJointCount * 16);
    const halfWidth = BridgeModelService.DECK_BEAM_HALF_WIDTH;
    const height = SiteConstants.DECK_TOP_HEIGHT - this.bridgeService.designConditions.deckThickness;
    for (let i = 0, i2 = 0, offset = 0; i < deckJointCount; ++i, i2 += 2, offset += 16) {
      // Average deck panel axis vectors for z-rotation.
      const jointX = jointLocations[i2];
      const jointY = jointLocations[i2 + 1];
      const m = transformsOut.subarray(offset, offset + 16);
      let rotationDx = 0;
      let rotationDy = 0;
      if (i > 0) {
        const dx = jointX - jointLocations[i2 - 2];
        const dy = jointY - jointLocations[i2 - 1];
        const s = 1 / Math.hypot(dx, dy);
        rotationDx += dx * s;
        rotationDy += dy * s;
      }
      if (i < deckJointCount - 1) {
        const dx = jointLocations[i2 + 2] - jointX;
        const dy = jointLocations[i2 + 3] - jointY;
        const s = 1 / Math.hypot(dx, dy);
        rotationDx += dx * s;
        rotationDy += dy * s;
      }
      // Scale, rotate about joint to deck perpendicular, translate.
      mat4.fromTranslation(m, vec3.set(this.vTmp, jointX, jointY, 0));
      Geometry.rotateZ(m, m, rotationDy, rotationDx);
      mat4.scale(m, m, vec3.set(this.vTmp, halfWidth, height, SiteConstants.DECK_HALF_WIDTH));
    }
    return transformsOut;
  }

  public buildDeckSlabInstanceTransforms(
    transformsOut: Float32Array | undefined,
    jointLocations: Float32Array,
  ): Float32Array {
    const slabCount = this.bridgeService.designConditions.panelCount;
    transformsOut ||= new Float32Array(slabCount * 16);
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
      const m = transformsOut.subarray(offset, offset + 16);
      const length = i === 0 || i === maxSlabIndex ? memberLength + SiteConstants.DECK_CANTILEVER : memberLength;
      // Scale, translate up by deck height and left for first panel cantilever, rotate, translate to joint location.
      mat4.fromTranslation(m, vec3.set(this.vTmp, jointAX, jointAY, 0));
      Geometry.rotateZ(m, m, dy, dx);
      mat4.translate(m, m, vec3.set(this.vTmp, i === 0 ? -SiteConstants.DECK_CANTILEVER : 0, heightAboveJoint, 0));
      mat4.scale(m, m, vec3.set(this.vTmp, length, thickness, SiteConstants.DECK_HALF_WIDTH));
    }
    return transformsOut;
  }

  public buildWireInstanceTransforms(
    transformsOut: Float32Array | undefined,
    jointLocations: Float32Array,
    trussCenterlineOffset: number,
    okMembers: BitVector,
  ): Float32Array {
    const members = this.bridgeService.bridge.members;
    // Allocate a buffer ignoring okMembers and return a subarray.
    const out = transformsOut || new Float32Array(members.length * 16);
    let offset = 0;
    for (let i = 0; i < members.length; ++i) {
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
      offset += 16;
    }
    return transformsOut ?? out.subarray(0, offset);
  }

  public buildPinInstanceModelTransforms(
    outTransforms: Float32Array | undefined,
    jointLocations: Float32Array,
    gussets: Gusset[],
  ): Float32Array {
    const centerOffset = this.bridgeService.trussCenterlineOffset;
    const joints = this.bridgeService.bridge.joints;
    // Allocate a buffer ignoring roadway clearance and return a subarray.
    const out = outTransforms || new Float32Array(joints.length * 16);
    let offset = 0;
    for (let i = 0; i < joints.length; ++i) {
      const gusset = gussets[i];
      if (!BridgeService.isJointClearOfRoadway(gusset.joint)) {
        continue;
      }
      const i2 = 2 * gusset.joint.index;
      const jointX = jointLocations[i2];
      const jointY = jointLocations[i2 + 1];
      const halfLength = centerOffset + gusset.halfDepthM + BridgeModelService.PIN_PROTRUSION;
      const m = out.subarray(offset, offset + 16);
      offset += 16;
      mat4.fromTranslation(m, vec3.set(this.vTmp, jointX, jointY, 0));
      mat4.scale(m, m, vec3.set(this.vTmp, 0.6, 0.6, halfLength));
    }
    return outTransforms || out.subarray(0, offset);
  }

  public buildGussetInstanceModelTransforms(
    transformsOut: Float32Array | undefined,
    gusset: Gusset,
    jointLocations: Float32Array,
  ): Float32Array {
    transformsOut ||= new Float32Array(32);
    const centerOffset = this.bridgeService.trussCenterlineOffset;
    const i2 = 2 * gusset.joint.index;
    const jointX = jointLocations[i2];
    const jointY = jointLocations[i2 + 1];
    const mNegativeZ = transformsOut.subarray(0, 16);
    mat4.fromTranslation(mNegativeZ, vec3.set(this.vTmp, jointX, jointY, -centerOffset));
    const mPositiveZ = transformsOut.subarray(16, 32);
    mat4.fromTranslation(mPositiveZ, vec3.set(this.vTmp, jointX, jointY, centerOffset));
    return transformsOut;
  }

  /** Builds colored mesh data with two instance positioning matrices, back and front. */
  // visible-for-testing
  buildMeshDataForGusset(gusset: Gusset, jointLocations: Float32Array): MeshData {
    const hullLength = gusset.hull.length;
    const positionCount = 6 * hullLength + 2;
    const positions = new Float32Array(positionCount * 3);
    const normals = new Float32Array(positions.length);
    const materialRefs = new Uint16Array(positionCount).fill(Material.PaintedSteel);
    // For each outer facet, two triangles there and two in the end cap.
    const triangleCount = 4 * hullLength;
    const indices = new Uint16Array(triangleCount * 3);
    let ip = 0;
    // Outer surface. Each facet has its own normal, so points are repeated.
    // p is the lead pointer, q is the trail.
    for (let q = hullLength - 1, p = 0; p < hullLength; q = p++) {
      const pq = gusset.hull[q];
      const pp = gusset.hull[p];
      // Negative perp of hull edge vector.
      let dx = pp.y - pq.y;
      let dy = pq.x - pp.x;
      const s = 1 / Math.hypot(dx, dy);
      dx *= s;
      dy *= s;
      // Quad between previous and current hull point.
      positions[ip] = pq.x;
      positions[ip + 1] = pq.y;
      positions[ip + 2] = -gusset.halfDepthM;
      normals[ip] = dx;
      normals[ip + 1] = dy;

      positions[ip + 3] = pq.x;
      positions[ip + 4] = pq.y;
      positions[ip + 5] = gusset.halfDepthM;
      normals[ip + 3] = dx;
      normals[ip + 4] = dy;

      positions[ip + 6] = pp.x;
      positions[ip + 7] = pp.y;
      positions[ip + 8] = -gusset.halfDepthM;
      normals[ip + 6] = dx;
      normals[ip + 7] = dy;

      positions[ip + 9] = pp.x;
      positions[ip + 10] = pp.y;
      positions[ip + 11] = gusset.halfDepthM;
      normals[ip + 9] = dx;
      normals[ip + 10] = dy;

      ip += 12;
    }
    // Positive z end. Start with center.
    const positiveZCenterIndex = ip / 3;
    positions[ip + 2] = gusset.halfDepthM;
    normals[ip + 2] = 1;
    ip += 3;
    for (const point of gusset.hull) {
      positions[ip] = point.x;
      positions[ip + 1] = point.y;
      positions[ip + 2] = gusset.halfDepthM;
      normals[ip + 2] = 1;
      ip += 3;
    }
    // Negative z end. Start with center.
    const negativeZCenterIndex = ip / 3;
    positions[ip + 2] = -gusset.halfDepthM;
    normals[ip + 2] = -1;
    ip += 3;
    for (let i = hullLength - 1; i >= 0; --i) {
      const point = gusset.hull[i];
      positions[ip] = point.x;
      positions[ip + 1] = point.y;
      positions[ip + 2] = -gusset.halfDepthM;
      normals[ip + 2] = -1;
      ip += 3;
    }
    let ii = 0;
    // Outer surface triangles.
    for (let i = 0, p = 0; i < hullLength; ++i, p += 4) {
      indices[ii++] = p;
      indices[ii++] = p + 3;
      indices[ii++] = p + 1;
      indices[ii++] = p + 3;
      indices[ii++] = p;
      indices[ii++] = p + 2;
    }
    // Triangle fan for posiitive z end.
    for (let i = 0, q = hullLength, p = 1; i < hullLength; ++i, q = p++) {
      indices[ii++] = positiveZCenterIndex;
      indices[ii++] = positiveZCenterIndex + q;
      indices[ii++] = positiveZCenterIndex + p;
    }
    // Triangle fan for negative z end.
    for (let i = 0, q = hullLength, p = 1; i < hullLength; ++i, q = p++) {
      indices[ii++] = negativeZCenterIndex;
      indices[ii++] = negativeZCenterIndex + q;
      indices[ii++] = negativeZCenterIndex + p;
    }
    const instanceModelTransforms = this.buildGussetInstanceModelTransforms(undefined, gusset, jointLocations);
    return { positions, normals, materialRefs, instanceModelTransforms, indices };
  }
}
