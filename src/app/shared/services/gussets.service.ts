import { Injectable } from '@angular/core';
import { ConvexHullService } from './convex-hull.service';
import { BridgeService } from './bridge.service';
import { Joint } from '../classes/joint.model';
import { Geometry, Point2DInterface } from '../classes/graphics';
import { Member } from '../classes/member.model';
import { SiteConstants } from '../classes/site-constants';

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

/** Builds a gusset member geometry for an adjacent member. */
function buildMemberGeometry(gussetJoint: Joint, member: Member, minMemberSizeMm: number): MemberGeometry {
  const otherJoint = member.getOtherJoint(gussetJoint);
  const vx = otherJoint.x - gussetJoint.x;
  const vy = otherJoint.y - gussetJoint.y;
  // Note adding GUSSET_THICKNESS artificially "thickens" the member so the gusset
  // is a bit bigger. This pecludes dueling polygons while rendering and other problems.
  // Looks cool, too.
  const halfSizeM = 0.0005 * Math.max(minMemberSizeMm, member.materialSizeMm) + SiteConstants.GUSSET_THICKNESS;
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

/** A gusset covering the intersection of members at a joint. */
export type Gusset = {
  joint: Joint;
  memberGeometries?: MemberGeometry[]; // Temporary accumulator deleted after gusset is complete.
  /** Convex hull with origin at the joint. */
  hull: Point2DInterface[];
  halfDepthM: number;
};

/** Container for logic that builds gussets and pins for the current bridge and converts them to meshes. */
@Injectable({ providedIn: 'root' })
export class GussetsService {
  constructor(
    private readonly bridgeService: BridgeService,
    private readonly convexHullService: ConvexHullService,
  ) {}

  /**
   * Builds one gusset per joint in the current bridge.
   * 
   * @param minMemberSizeMm optional forced minimum member size (e.g. for 3d printing)
   */
  public createGussets(minMemberSizeMm: number = 0): Gusset[] {
    // Make one gusset per joint.
    const gussets: Gusset[] = this.bridgeService.bridge.joints.map(joint => {
      return {
        joint,
        memberGeometries: [],
        hull: [],
        halfDepthM: 0,
      };
    });
    // Add member geometries to each gusset.
    for (const member of this.bridgeService.bridge.members) {
      gussets[member.a.index].memberGeometries!.push(buildMemberGeometry(member.a, member, minMemberSizeMm));
      gussets[member.b.index].memberGeometries!.push(buildMemberGeometry(member.b, member, minMemberSizeMm));
    }
    // Use the member geometries to compute potential gusset vertices.
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
            // Points opposite the intersection on each member, perpendicular to the resp. member axis.
            this.convexHullService.add(intersection.x - geometry.upx * 2, intersection.y - geometry.upy * 2);
            this.convexHullService.add(intersection.x + altGeometry.upx * 2, intersection.y + altGeometry.upy * 2);
          }
        }
      }
      // Create a hull around all points to determine gusset vertices. Delete member geometries no longer needed.
      this.convexHullService.createHull(gusset.hull);
      delete gusset.memberGeometries;
    }
    this.convexHullService.clear();
    return gussets;
  }
}
