import { Injectable } from '@angular/core';
import { ConvexHullService } from '../../../shared/services/convex-hull.service';
import { MeshData } from '../rendering/mesh-rendering.service';
import { BridgeService } from '../../../shared/services/bridge.service';
import { Joint } from '../../../shared/classes/joint.model';
import { Geometry, Point2DInterface } from '../../../shared/classes/graphics';
import { Member } from '../../../shared/classes/member.model';
import { SiteConstants } from '../../../shared/classes/site.model';
import { Material } from './materials';
import { mat4, vec3 } from 'gl-matrix';
import { TRUSS_PIN_MESH_DATA } from './truss-pin';
import { SimulationStateService } from '../rendering/simulation-state.service';
import { DesignConditions } from '../../../shared/services/design-conditions.service';

export type GussetMeshData = {
  gussetMeshData: MeshData[];
  pinMeshData: MeshData;
};

/**
 * Geometry of one member adjacent to a given gusset. The coordinate origin as at the
 * gusset joint. Three critical points on the member axis and two vectors.
 * If w/2 = halfWidth, then it looks lke this:
 *   -----^---------------------------------------------------------------------------
 *  |     |uPerp                                  ^                                   |
 *  |     |                                      w/2                                  |
 *  o p0  --O joint o p1                    ---------------           o p2    O Other joint
 *  |       |---u--->                            w/2                                  |
 *  |<-w/2->|<-w/2->|                             v                   |<-w/2->|<-w/2->|
 *   ---------------------------------------------------------------------------------
 */
type MemberGeometry = {
  x0: number;
  y0: number;
  x1: number;
  y1: number;
  x2: number;
  y2: number;
  ux: number;
  uy: number;
  upx: number;
  upy: number;
  halfSizeM: number; // M is for meters.
};

function buildMemberGeometry(gussetJoint: Joint, member: Member): MemberGeometry {
  const otherJoint = member.getOtherJoint(gussetJoint);
  const vx = otherJoint.x - gussetJoint.x;
  const vy = otherJoint.y - gussetJoint.y;
  const halfSizeM = 0.0005 * member.materialSizeMm + SiteConstants.GUSSET_THICKNESS;
  const vScale = halfSizeM / Math.hypot(vx, vy);
  const ux = vx * vScale;
  const uy = vy * vScale;
  const upx = -uy;
  const upy = ux;
  const x0 = -ux;
  const y0 = -uy;
  const x1 = ux;
  const y1 = uy;
  const x2 = vx - ux;
  const y2 = vy - uy;
  return { x0, y0, x1, y1, x2, y2, ux, uy, upx, upy, halfSizeM };
}

type GussetModel = {
  joint: Joint;
  memberGeometries?: MemberGeometry[]; // Temporary accumulator deleted after gusset is complete.
  /** Convex hull with origin at the joint. */
  hull: Point2DInterface[];
  halfDepthM: number;
};

/** Container for logic that builds gussets and pins for the current bridge and converts them to meshes. */
@Injectable({ providedIn: 'root' })
export class GussetsModelService {
  private static readonly PIN_PROTRUSION = 0.08;

  private readonly vTmp = vec3.create();
  private readonly jointLocationsTmp = new Float32Array(2 * DesignConditions.MAX_JOINT_COUNT);

  constructor(
    private readonly bridgeService: BridgeService,
    private readonly convexHullService: ConvexHullService,
    private readonly simlulationStateService: SimulationStateService,
  ) {}

  /** Builds one gusset per joint in the current bridge. */
  // visible-for-testing
  get gussets(): GussetModel[] {
    // Make one gusset per joint.
    const gussets: GussetModel[] = this.bridgeService.bridge.joints.map(joint => {
      return {
        joint,
        memberGeometries: [],
        hull: [],
        halfDepthM: 0,
      };
    });
    // Add member geometries to each gusset.
    for (const member of this.bridgeService.bridge.members) {
      gussets[member.a.index].memberGeometries!.push(buildMemberGeometry(member.a, member));
      gussets[member.b.index].memberGeometries!.push(buildMemberGeometry(member.b, member));
    }
    for (const gusset of gussets) {
      this.convexHullService.clear();
      for (const geometry of gusset.memberGeometries!) {
        // Tally this member's size into the gusset depth.
        if (geometry.halfSizeM > gusset.halfDepthM) {
          gusset.halfDepthM = geometry.halfSizeM;
        }
        // To the hull, add the corners of the box surrounding the joint axis.
        this.convexHullService.add(geometry.x0 + geometry.upx, geometry.y0 + geometry.upy);
        this.convexHullService.add(geometry.x0 - geometry.upx, geometry.y0 - geometry.upy);
        this.convexHullService.add(geometry.x1 + geometry.upx, geometry.y1 + geometry.upy);
        this.convexHullService.add(geometry.x1 - geometry.upx, geometry.y1 - geometry.upy);
        // Add points due to interections of pairs of member edges.
        for (const altGeometry of gusset.memberGeometries!) {
          if (geometry === altGeometry) {
            continue;
          }
          const intersection = Geometry.getSegmentsIntersection(
            geometry.x0 + geometry.upx,
            geometry.y0 + geometry.upy,
            geometry.x2 + geometry.upx,
            geometry.y2 + geometry.upy,
            altGeometry.x0 - altGeometry.upx,
            altGeometry.y0 - altGeometry.upy,
            altGeometry.x2 - altGeometry.upx,
            altGeometry.y2 - altGeometry.upy,
          );
          if (intersection) {
            this.convexHullService.addPoint(intersection);
            this.convexHullService.add(intersection.x - geometry.upx * 2, intersection.y - geometry.upy * 2);
            this.convexHullService.add(intersection.x + altGeometry.upx * 2, intersection.y + altGeometry.upy * 2);
          }
        }
      }
      // Create the hull and delete temporary member geometry.
      this.convexHullService.createHull(gusset.hull);
      delete gusset.memberGeometries;
    }
    this.convexHullService.clear();
    return gussets;
  }

  private buildPinInstanceModelTransforms(out: Float32Array | undefined,  jointLocations: Float32Array, gussets: GussetModel[]): Float32Array {
    const centerOffset = this.bridgeService.trussCenterlineOffset;
    const joints = this.bridgeService.bridge.joints;
    // TODO: Replace with simple loop since it runs for each frame.
    const nonInterferingJointCount = joints.reduce<number>(
      (count, joint) => (BridgeService.isJointClearOfRoadway(joint) ? count + 1 : count),
      0,
    );
    out ||= new Float32Array(nonInterferingJointCount * 16);
    for (let i = 0, offset = 0; i < joints.length; ++i, offset += 16) {
      const gusset = gussets[i];
      if (!BridgeService.isJointClearOfRoadway(gusset.joint)) {
        continue;
      }
      const i2 = 2 * gusset.joint.index;
      const jointX = jointLocations[i2];
      const jointY = jointLocations[i2 + 1];
      const halfLength = centerOffset + gusset.halfDepthM + GussetsModelService.PIN_PROTRUSION;
      const m = out.subarray(offset, offset + 16);
      mat4.fromTranslation(m, vec3.set(this.vTmp, jointX, jointY, 0));
      mat4.scale(m, m, vec3.set(this.vTmp, 0.6, 0.6, halfLength));
    }
    return out;
  }

  /** Builds colored mesh data with two instance positioning matrices, back and front. */
  // visible-for-testing
  buildMeshDataForGusset(gusset: GussetModel, jointLocations: Float32Array): MeshData {
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

  private buildGussetInstanceModelTransforms(out: Float32Array | undefined, gusset: GussetModel, jointLocations: Float32Array): Float32Array {
    out ||= new Float32Array(32);
    const centerOffset = this.bridgeService.trussCenterlineOffset;
    const i2 = 2 * gusset.joint.index;
    const jointX = jointLocations[i2];
    const jointY = jointLocations[i2 + 1];
    const mNegativeZ = out.subarray(0, 16);
    mat4.fromTranslation(mNegativeZ, vec3.set(this.vTmp, jointX, jointY, -centerOffset));
    const mPositiveZ = out.subarray(16, 32);
    mat4.fromTranslation(mPositiveZ, vec3.set(this.vTmp, jointX, jointY, centerOffset));
    return out;
  }

  /** Returns mesh data for gussets and pins of the current bridge. */
  public get meshData(): GussetMeshData {
    const gussets = this.gussets;
    const jointLocations = this.simlulationStateService.interpolator.getAllDisplacedJointLocations(this.jointLocationsTmp);
    return {
      pinMeshData: {
        instanceModelTransforms: this.buildPinInstanceModelTransforms(undefined, jointLocations,  gussets),
        ...TRUSS_PIN_MESH_DATA
      },
      gussetMeshData: gussets.map(gusset => this.buildMeshDataForGusset(gusset, jointLocations))
    }
  }
}
