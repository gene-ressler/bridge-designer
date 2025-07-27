import { Injectable } from '@angular/core';
import { mat3, mat4, vec2, vec3 } from 'gl-matrix';
import { Geometry } from '../../../shared/classes/graphics';
import { Member } from '../../../shared/classes/member.model';
import { MeshData } from '../rendering/mesh-rendering.service';
import { BUCKLED_MEMBER_MESH_DATA } from './buckled-member';
import { GlService } from '../rendering/gl.service';
import { TORN_MEMBER_MESH_DATA } from './torn-member';
import { SimulationStateService } from '../rendering/simulation-state.service';
import { Utility } from '../../../shared/classes/utility';

export type BuckledMemberMeshData = {
  meshData: MeshData;
  members: Member[];
  jointLocations: Float32Array;
  trussCenterlineOffset: number;
};

export type TornMemberMeshData = {
  meshData: MeshData;
  members: Member[];
  jointLocations: Float32Array;
  trussCenterlineOffset: number;
};

@Injectable({ providedIn: 'root' })
export class FailedMemberModelService {
  /** Number of points used to approximate the appearance of buckled members. Must be odd. */
  private static readonly PARABOLA_POINT_COUNT = 33;
  /** Number of floats in a segment (instance) transform for updating transform backing arrays.  */
  public static readonly SEGMENT_TRANSFORM_FLOAT_COUNT = 32 * (FailedMemberModelService.PARABOLA_POINT_COUNT - 1);
  /** Widths of parabolas with unit arc length, where corresponding element of PARABOLA_HEIGHT gives the height. */
  private static readonly PARABOLA_WIDTHS = [
    0.0, 0.0625, 0.125, 0.15625, 0.1875, 0.21875, 0.25, 0.28125, 0.3125, 0.34375, 0.375, 0.40625, 0.4375, 0.46875, 0.5,
    0.53125, 0.5625, 0.59375, 0.625, 0.65625, 0.6875, 0.71875, 0.75, 0.78125, 0.8125, 0.84375, 0.875, 0.90625, 0.9375,
    0.96875, 0.984375, 0.992188, 1.0,
  ];
  /** Hieghts of parabolas with unit arc length, where corresponding element of PARABOLA_WIDTH gives the width. */
  private static readonly PARABOLA_HEIGHTS = [
    0.5, 0.497717, 0.492161, 0.488378, 0.483979, 0.478991, 0.473431, 0.46731, 0.460633, 0.453402, 0.445614, 0.437259,
    0.428326, 0.418797, 0.40865, 0.397857, 0.386383, 0.374182, 0.361201, 0.347371, 0.332606, 0.316796, 0.299798,
    0.28142, 0.261396, 0.239344, 0.214672, 0.186382, 0.152526, 0.108068, 0.076484, 0.054105, 0.0,
  ];
  // Typed array allocation is known to be slow wrt 60 fps, so do these once and reuse.
  private readonly outer = vec2.create();
  private readonly inner = vec2.create();
  private readonly prevOuterLeft = vec2.create();
  private readonly prevInnerLeft = vec2.create();
  private readonly prevOuterRight = vec2.create();
  private readonly prevInnerRight = vec2.create();
  private readonly tmpM31 = mat3.create();
  private readonly tmpM32 = mat3.create();
  private readonly tmpV2 = vec2.create();
  private readonly tmpV3 = vec3.create();

  constructor(
    private readonly glService: GlService,
    private readonly simulationStateService: SimulationStateService,
  ) {}

  /**
   * Builds mesh data for a list of buckled members. Assumes the given displaced joint locations make the member shorter
   * than its no-load length.
   */
  public buildMeshDataForBuckledMembers(
    members: Member[],
    jointLocations: Float32Array,
    trussCenterlineOffset: number,
  ): BuckledMemberMeshData {
    const segmentTransforms = new Float32Array(members.length * FailedMemberModelService.SEGMENT_TRANSFORM_FLOAT_COUNT);
    let offset = 0;
    for (const member of members) {
      this.buildSegmentTransformsForBuckledMember(
        segmentTransforms,
        member,
        jointLocations,
        trussCenterlineOffset,
        offset,
      );
      offset += FailedMemberModelService.SEGMENT_TRANSFORM_FLOAT_COUNT;
    }
    const gl = this.glService.gl;
    const meshData: MeshData = {
      instanceModelTransforms: segmentTransforms,
      usage: { instanceModelTransforms: gl.STREAM_DRAW },
      ...BUCKLED_MEMBER_MESH_DATA,
    };
    return {
      meshData,
      members,
      jointLocations,
      trussCenterlineOffset,
    };
  }

  /** Builds mesh data depicting the ends of members torn by failure in tension. */
  public buildMeshDataForTornMembers(
    members: Member[],
    jointLocations: Float32Array,
    trussCenterlineOffset: number,
  ): TornMemberMeshData {
    const instanceModelTransforms = new Float32Array(members.length * 64); // Four mat4's per 2d member.
    let offset = 0;
    for (const member of members) {
      this.buildModelInstanceTransformsForTornMember(
        instanceModelTransforms,
        member,
        jointLocations,
        trussCenterlineOffset,
        offset,
      );
      offset += 64;
    }
    const gl = this.glService.gl;
    const meshData: MeshData = {
      instanceModelTransforms,
      usage: { instanceModelTransforms: gl.STREAM_DRAW },
      ...TORN_MEMBER_MESH_DATA,
    };
    return {
      meshData,
      members,
      jointLocations,
      trussCenterlineOffset,
    };
  }

  /** Builds instance transformations for the ends of members torn by failure in tension. */
  public buildModelInstanceTransformsForTornMember(
    transformsOut: Float32Array,
    member: Member,
    jointLocations: Float32Array,
    trussCenterlineOffset: number,
    offset: number,
  ): void {
    // Splay the broken member ends by rotating at joints.
    // Not too much, else occulsion of/by other members is a problem.
    const rotationRate = 0.005; // radians per milli
    const rotationMax = 0.4; // radians
    const rotation = Math.min(rotationRate * this.simulationStateService.phaseClockMillis, rotationMax);
    const aIndex = 2 * member.a.index;
    const bIndex = 2 * member.b.index;
    const aX = jointLocations[aIndex];
    const aY = jointLocations[aIndex + 1];
    const bX = jointLocations[bIndex];
    const bY = jointLocations[bIndex + 1];
    const dx = bX - aX;
    const dy = bY - aY;
    const theta = Math.atan2(dy, dx);
    const halfLength = 0.5 * member.length;
    const size = member.materialSizeMm * 0.001;

    // Joint A, front
    const mAFront = transformsOut.subarray(offset, offset + 16);
    mat4.fromTranslation(mAFront, vec3.set(this.tmpV3, aX, aY, trussCenterlineOffset));
    mat4.rotateZ(mAFront, mAFront, theta + rotation);
    mat4.scale(mAFront, mAFront, vec3.set(this.tmpV3, halfLength, size, size));

    // Joint B, front
    offset += 16;
    const mBFront = transformsOut.subarray(offset, offset + 16);
    mat4.fromTranslation(mBFront, vec3.set(this.tmpV3, bX, bY, trussCenterlineOffset));
    mat4.rotateZ(mBFront, mBFront, Math.PI + theta + rotation);
    mat4.scale(mBFront, mBFront, vec3.set(this.tmpV3, halfLength, size, size));

    // Joint A, back
    offset += 16;
    const mABack = transformsOut.subarray(offset, offset + 16);
    mat4.fromTranslation(mABack, vec3.set(this.tmpV3, aX, aY, -trussCenterlineOffset));
    mat4.rotateZ(mABack, mABack, theta - rotation);
    mat4.scale(mABack, mABack, vec3.set(this.tmpV3, halfLength, size, size));

    // Joint B, back
    offset += 16;
    const mBBack = transformsOut.subarray(offset, offset + 16);
    mat4.fromTranslation(mBBack, vec3.set(this.tmpV3, bX, bY, -trussCenterlineOffset));
    mat4.rotateZ(mBBack, mBBack, Math.PI + theta - rotation);
    mat4.scale(mBBack, mBBack, vec3.set(this.tmpV3, halfLength, size, size));
  }

  /**
   * Builds transforms in the given array to represent the given member in the buckled state in both front
   * and back trusses of the bridge. Each transform takes a prototypical unit cube to a trapezoidal prism
   * along the axis of a parabola. A dedicated shader extracts normals and also transforms the unit cube.
   */
  public buildSegmentTransformsForBuckledMember(
    transformsOut: Float32Array,
    member: Member,
    jointLocations: Float32Array,
    trussCenterlineOffset: number,
    offset: number = 0,
  ): Float32Array {
    const aIndex = 2 * member.a.index;
    const bIndex = 2 * member.b.index;
    const aX = jointLocations[aIndex];
    const aY = jointLocations[aIndex + 1];
    const bX = jointLocations[bIndex];
    const bY = jointLocations[bIndex + 1];
    const dx = bX - aX;
    const dy = bY - aY;
    const buckledLength = Math.hypot(dx, dy);
    const height = FailedMemberModelService.getParabolaHeight(member.length, buckledLength);
    const halfSize = member.materialSizeMm * 0.0005;
    const size = halfSize * 2;
    const pointCount = FailedMemberModelService.PARABOLA_POINT_COUNT;
    const pointsGenerator = parabolaPoints(this.outer, this.inner, buckledLength, height, halfSize, pointCount);
    const modelTransform = this.tmpM32;
    mat3.fromTranslation(modelTransform, vec2.set(this.tmpV2, aX, aY));
    Geometry.rotate(modelTransform, modelTransform, dy, dx);

    pointsGenerator.next();
    vec2.copy(this.prevOuterLeft, this.outer);
    vec2.copy(this.prevInnerLeft, this.inner);
    vec2.copy(this.prevOuterRight, this.outer);
    vec2.copy(this.prevInnerRight, this.inner);
    while (!pointsGenerator.next().done) {
      // Make space for the left front and back transform materices.
      const mLeftFront = transformsOut.subarray(offset, offset + 16);
      offset += 16;
      const mLeftBack = transformsOut.subarray(offset, offset + 16);
      offset += 16;

      // The left trapezoid is now (prevOuter, outer, inner, prevInner).
      const segmentTransform = this.tmpM31;
      this.buildSegmentTransform(segmentTransform, this.prevOuterLeft, this.outer, this.inner, this.prevInnerLeft);
      mat3.multiply(segmentTransform, modelTransform, segmentTransform);
      addDimensionZ(mLeftFront, segmentTransform, size, trussCenterlineOffset);
      addDimensionZ(mLeftBack, segmentTransform, size, -trussCenterlineOffset);

      // Prepare for next left segment.
      vec2.copy(this.prevInnerLeft, this.inner);
      vec2.copy(this.prevOuterLeft, this.outer);

      // Advance to right point pair.
      pointsGenerator.next();

      // Make space for the front and back transform materices.
      const mRightFront = transformsOut.subarray(offset, offset + 16);
      offset += 16;
      const mRightBack = transformsOut.subarray(offset, offset + 16);
      offset += 16;

      // The right trapezoid is now (outer, prevOuter, prevInner, inner.)
      this.buildSegmentTransform(segmentTransform, this.outer, this.prevOuterRight, this.prevInnerRight, this.inner);
      mat3.multiply(segmentTransform, modelTransform, segmentTransform);
      addDimensionZ(mRightFront, segmentTransform, size, trussCenterlineOffset);
      addDimensionZ(mRightBack, segmentTransform, size, -trussCenterlineOffset);

      // Prepare for next right segment.
      vec2.copy(this.prevInnerRight, this.inner);
      vec2.copy(this.prevOuterRight, this.outer);
    }
    return transformsOut;
  }

  /**
   * Returns a 3x3 matrix that takes a 2d unit square to the given arbitrary trapezoid via "perspective" division:
   * ```
   * (0,1)   (1,1)                p2+t(p0-p1)         p2
   *    o----o                    o-------------------o
   *    |    |       >===>       /                     \
   *    o ---o                  o-----------------------o
   * (0,0)   (1,0)              p0                      p1
   * ```
   * As shown, the fourth point is defined by parameter `t` and the other three points. It's calculated
   * from furnished `p3 `as:
   * ```
   *      /  (x3 - x2) / (x0 - x1)   if |x0-x1| > |y0-y1|,
   * t = <
   *      \  (y3 - y2) / (y0 - y1)   otherwise
   * ```
   * If `p3` doesn't actually complete a parallelogram, the transform will still produce one in this manner.
   *
   * If `p0` == `p1`, there is no solution; the matrix will contain NaN. A workaround if `p0` != `p1` is to "rotate the"
   * input points two places: `p0` => `p2`, `p1`=> `p3`, , `p2` => `p0`, `p3` => `p1`. This will cause `t` == 0. Unfortunately,
   * we'd end up with w == 0 values in results and perspective division would fail. Consequently, when `t` is less than 0.001,
   * it's artificially forced there, leading to an approximate triangle.
   *
   * Notes:
   * Math is based on the general technique of this OpenCV method. We thank the author(s):
   *
   * https://github.com/opencv/opencv/blob/11b020b9f9e111bddd40bffe3b1759aa02d966f0/modules/imgproc/src/imgwarp.cpp#L3001
   *
   * Code below is from expanding the linear system with (xi,yi) of the unit square, then solving symbolically with
   * wxmaxima. I'm sure there's an elegant way to get it by hand.
   */
  // visible-for-testing
  buildSegmentTransform(out: mat3, p0: vec2, p1: vec2, p2: vec2, p3: vec2): mat3 {
    const dx = p0[0] - p1[0];
    const dy = p0[1] - p1[1];
    const u0 = p0[0];
    const v0 = p0[1];
    const u1 = p1[0];
    const v1 = p1[1];
    const u2 = p2[0];
    const v2 = p2[1];
    let t = Math.max(1e-3, Math.abs(dx) > Math.abs(dy) ? (p3[0] - p2[0]) / dx : (p3[1] - p2[1]) / dy);
    const s = 1 / t;

    // prettier-ignore
    return mat3.set(
      out, 
      u1 - u0,           v1 - v0,           0,           // column 0
      (u2 - t * u1) * s, (v2 - t * v1) * s, (1 - t) * s, // column 1
      u0,                v0,                1,           // column 2
    );
  }

  // visible-for-testing
  static getParabolaHeight(unloadedLength: number, buckledLength: number): number {
    if (unloadedLength === 0) {
      return 0;
    }
    const widths = FailedMemberModelService.PARABOLA_WIDTHS;
    const heights = FailedMemberModelService.PARABOLA_HEIGHTS;
    const unitArcWidth = Math.min(buckledLength / unloadedLength, 1);
    // Invariant a[lo] < x <= a[hi].
    const index = FailedMemberModelService.searchFloor(unitArcWidth, widths);
    // Handle case where floor is at top of width range.
    if (index === widths.length - 1) {
      return 0;
    }
    // Interpolate
    const t = (unitArcWidth - widths[index]) / (widths[index + 1] - widths[index]);
    const h0 = heights[index];
    const h1 = heights[index + 1];
    return unloadedLength * (h0 + (h1 - h0) * t);
  }

  /**
   * Returns the index of the greatest element of `a` not greater than `x`.
   * Assumes that `a` is sorted and `x` in the range of `a`.
   */
  // visible-for-testing
  static searchFloor(x: number, a: number[]): number {
    let lo = 0;
    let hi = a.length - 1;
    // Find two adjacent elements that must include the search value.
    while (hi - lo > 1) {
      const mid = (hi + lo) >>> 1;
      const aMid = a[mid];
      if (x > aMid) {
        lo = mid;
      } else if (x < aMid) {
        hi = mid;
      } else {
        return mid;
      }
    }
    // Determine which of the bracket ends is the answer.
    return a[hi] === x ? hi : lo;
  }
}

/** Spreads the 3x3 model-transformed segment matrix into a 4x4 with z scale and translation. */
function addDimensionZ(out: mat4, a: mat3, zSize: number, zOffset: number): mat4 {
  // prettier-ignore
  mat4.set(out, 
        a[0], a[1], 0, a[2],
        a[3], a[4], 0, a[5],
        0,    0,    zSize, 0,
        a[6], a[7], zOffset, a[8],
      )
  return out;
}

/**
 * Returns point pairs at fixed offset `halfSize` outside and inside a parabolic axis having
 * end points (0,0), (`width`, 0) and apex at (`width`/2, `height`). First pair is at the apex
 * followed by successsive pairs left then right.  The geneator returns the top point of 
 * each pair, but it's expected to be ignored. Instead, users copy from the `vec2` buffers 
 * furnished when the generator is created.
 *
 * The points are distributed such that the parabola's tangent changes angle by the same 
 * amount at each. Requires some trig, but makes for smooth rendering.
 */
// visible-for-testing
export function* parabolaPoints(
  aOut: vec2,
  bOut: vec2,
  width: number,
  height: number,
  halfSize: number,
  pointCount: number,
): Generator<vec2, undefined, boolean> {
  const halfWidth = 0.5 * width;
  const twiceHeight = 2 * height;
  yield setOutputs(0);
  const pairCount = pointCount >>> 1;
  // Clamping manages degeneracies for straight and doubled over cases.
  const c = Utility.clamp(halfWidth / (2 * height), 0.001, 1000.0);
  const thetaMax = Math.atan(1 / c);
  const dTheta = thetaMax / pairCount;
  for (let i = 0, theta = dTheta; i < pairCount; ++i, theta += dTheta) {
    const t = c * Math.tan(theta);
    yield setOutputs(-t);
    yield setOutputs(t);
  }
  function setOutputs(t: number): vec2 {
    const x = (t + 1) * halfWidth;
    const y = (1 - t * t) * height;
    let nx = twiceHeight * t;
    let ny = halfWidth;
    const nScale = halfSize / Math.hypot(nx, ny);
    nx *= nScale;
    ny *= nScale;
    vec2.set(bOut, x - nx, y - ny);
    return vec2.set(aOut, x + nx, y + ny);
  }
}
