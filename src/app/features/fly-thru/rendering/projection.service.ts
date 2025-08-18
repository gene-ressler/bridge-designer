import { Injectable } from '@angular/core';
import { mat4, vec3 } from 'gl-matrix';
import { ConvexHullService } from '../../../shared/services/convex-hull.service';
import { Utility } from '../../../shared/classes/utility';
import { Geometry, Point2D, Point2DInterface, Vector2D, Vector2DInterface } from '../../../shared/classes/graphics';
import { TerrainModelService } from '../models/terrain-model.service';

@Injectable({ providedIn: 'root' })
export class ProjectionService {
  // Frustum parameters.
  private left: number = -1;
  private right: number = 1;
  private bottom: number = -1;
  private top: number = 1;
  private near: number = -1;
  private far: number = 1;
  private aspect: number = 1;

  // Allocate all this stuff once so we aren't doing it 60 x per second.
  private readonly frustum = new Pyramid();
  private readonly focusArea = new Pyramid();

  private readonly tmpMatrix = mat4.create();
  private readonly tmpVector = new Vector2D();
  private readonly invModelView = mat4.create();
  private readonly trapezoid = Utility.createArray(() => new Point2D(), 4);
  private readonly unitL = new Vector2D();
  private readonly unitR = new Vector2D();
  // Extra element below is required null sentinel.
  private readonly frustumHull = new Array<Point2DInterface>(7);
  private readonly focusHull = new Array<Point2DInterface>(7);
  private readonly focusProjected = Utility.createArray(() => new Point2D(), 6);
  private readonly axisDirection = new Vector2D();
  private readonly pointQ = new Point2D();

  // Parameters of trapazoid base and top lines wrt unit ray from
  // near plane center point toward far plane center point.  Also
  // parameter of top of focus area frustum.
  private tBase: number = 0;
  private tTop: number = 0;
  private tFocus: number = 0;

  constructor(private readonly convexHullService: ConvexHullService) {}

  public setFrustum(fovy: number, aspect: number, near: number, far: number, focusRatio: number): void {
    this.near = near;
    this.far = far;
    this.top = near * Math.tan((fovy * Math.PI) / 360.0);
    this.bottom = -this.top;
    this.left = aspect * this.bottom;
    this.right = aspect * this.top;
    this.aspect = aspect;

    // Set up the pyramids for the trapazoidal shadow mask algorithm.
    const shadowFar = far * 0.35; // Don't attempt distant shadows to get better resolution close up.
    this.frustum.set(this.left, this.right, this.bottom, this.top, near, shadowFar);
    this.focusArea.set(
      this.left,
      this.right,
      this.bottom,
      this.top,
      near,
      focusRatio * shadowFar + (1 - focusRatio) * near,
    );
  }

  /** Returns a projection matrix representing the current frustom settings. */
  public getPerspectiveProjection(m: mat4): void {
    mat4.frustum(m, this.left, this.right, this.bottom, this.top, this.near, this.far);
  }

  /** Returns a projection matrix affording a reasonable POV from the parallel light source. Not for user view rendering. */
  public getLightProjection(m: mat4): void {
    const halfGridSize = TerrainModelService.HALF_GRID_COUNT * TerrainModelService.METERS_PER_GRID;
    const halfWidth = halfGridSize * 1.1;
    const halfHeight = halfWidth / this.aspect;
    mat4.ortho(m, -halfWidth, halfWidth, -halfHeight, halfHeight, -halfGridSize, halfGridSize);
  }

  public getTrapezoidalProjection(m: mat4, modelView: mat4, lightView: mat4, near: number, far: number): void {
    // Form the matrix that takes a canonical view volume to PPSL.
    mat4.invert(this.invModelView, modelView);
    mat4.multiply(this.tmpMatrix, lightView, this.invModelView);

    // Get the convex hull and axis direction of the main frustum.
    this.frustum.getHull(this.convexHullService, this.frustumHull, this.tmpMatrix);
    this.frustum.getAxis(this.axisDirection);

    // Get the convex hull of the truncated frustum that defines the focus area.
    this.focusArea.getHull(this.convexHullService, this.focusHull, this.tmpMatrix);

    // Project vertices of the frustum hull onto the axis to get
    // top and base distances.
    Geometry.subtract2D(this.tmpVector, this.frustumHull[0], this.frustum.nearCenter);
    this.tBase = this.tTop = Geometry.dot2D(this.axisDirection, this.tmpVector);
    for (let i = 1; i < this.frustumHull.length; i++) {
      Geometry.subtract2D(this.tmpVector, this.frustumHull[i], this.frustum.nearCenter);
      const t = Geometry.dot2D(this.axisDirection, this.tmpVector);
      if (t < this.tTop) {
        this.tTop = t;
      } else if (t > this.tBase) {
        this.tBase = t;
      }
    }

    // Focus distance is just the length of the focus area frustum.
    Geometry.subtract2D(this.tmpVector, this.focusArea.farCenter, this.focusArea.nearCenter);
    this.tFocus = Geometry.dot2D(this.axisDirection, this.tmpVector);

    // Get lambda and delta prime as in the paper.
    const lambda = this.tBase - this.tTop;
    const deltaPrime = this.tFocus - this.tTop;

    // Rename trapazoid points for convenience.
    const p0 = this.trapezoid[0];
    const p1 = this.trapezoid[1];
    const p2 = this.trapezoid[2];
    const p3 = this.trapezoid[3];
    const a = this.axisDirection;

    let xi = -0.6; // the 80% line location
    // Just assume 1024 lines in depth buffer; close enough.
    const xiInc = 2.0 / 1024.0;
    let lastArea = 0.0;
    // Iterate looking for a maximum in area of projected focus hull.
    let m00, m01, m02, m10, m11, m12, m20, m21, m22;
    do {
      // Compute eta as in the paper.
      const eta = (lambda * deltaPrime * (1 + xi)) / (lambda - 2 * deltaPrime - lambda * xi);

      if (eta > lambda * 100) {
        // This happens when the focus area is near the middle of
        // the far plane because the camera is pointing nearly
        // parallel to light. Find the bounding box aligned with the axis.
        let orthoL = 0.0;
        let orthoR = 0.0;
        Geometry.offsetScaled2D(this.pointQ, this.frustum.nearCenter, a, this.tTop);
        for (const h of this.frustumHull) {
          Geometry.subtract2D(this.tmpVector, h, this.pointQ);
          const ortho = Geometry.cross2D(a, this.tmpVector);
          if (ortho > orthoL) {
            orthoL = ortho;
          } else if (ortho < orthoR) {
            orthoR = ortho;
          }
        }
        Geometry.orthoOffsetScaled2D(p0, this.pointQ, a, orthoL);
        Geometry.orthoOffsetScaled2D(p1, this.pointQ, a, orthoR);
        Geometry.offsetScaled2D(this.pointQ, this.frustum.nearCenter, a, this.tBase);
        Geometry.orthoOffsetScaled2D(p2, this.pointQ, a, orthoR);
        Geometry.orthoOffsetScaled2D(p3, this.pointQ, a, orthoL);
      } else {
        // Otherwise we have a normal frustum calculation.
        // Find Q by offset from the near plane center.
        Geometry.offsetScaled2D(this.pointQ, this.frustum.nearCenter, this.axisDirection, this.tTop - eta);

        // Walk around the convex hull to find extreme left and right
        // rays from Q that include all points.  Save unit vectors for these.
        let crossL = 0.0;
        let crossR = 0.0;
        for (const h of this.frustumHull) {
          Geometry.subtract2D(this.tmpVector, h, this.pointQ);
          Geometry.scale2D(this.tmpVector, 1 / Geometry.length2D(this.tmpVector));
          const cross = Geometry.cross2D(this.axisDirection, this.tmpVector);
          if (cross > crossL) {
            crossL = cross;
            this.unitL.copyFrom(this.tmpVector);
          } else if (cross < crossR) {
            crossR = cross;
            this.unitR.copyFrom(this.tmpVector);
          }
        }
        // Now we can compute the trapazoid boundary.
        const dotLi = 1 / Geometry.dot2D(this.axisDirection, this.unitL);
        const dotRi = 1 / Geometry.dot2D(this.axisDirection, this.unitR);
        const tt = eta;
        const tb = eta + lambda;
        Geometry.offsetScaled2D(p0, this.pointQ, this.unitL, tt * dotLi);
        Geometry.offsetScaled2D(p1, this.pointQ, this.unitR, tt * dotRi);
        Geometry.offsetScaled2D(p2, this.pointQ, this.unitR, tb * dotRi);
        Geometry.offsetScaled2D(p3, this.pointQ, this.unitL, tb * dotLi);
      }

      // Build the 3x3 matrix for 2d mapping.
      m00 = a.y;
      m01 = -a.x;
      m02 = a.x * p0.y - a.y * p0.x; // (23)
      m10 = a.x;
      m11 = a.y;
      m12 = -(a.x * p0.x + a.y * p0.y);
      const xc3 = m00 * p3.x + m01 * p3.y + m02; // (24)
      const yc3 = m10 * p3.x + m11 * p3.y + m12;
      const s = -xc3 / yc3; // (25)
      m00 += s * m10;
      m01 += s * m11;
      m02 += s * m12; // (27)
      const xd1 = m00 * p1.x + m01 * p1.y + m02; // (28)
      const xd2 = m00 * p2.x + m01 * p2.y + m02;
      let d = yc3 / (xd2 - xd1); // yd2 = yc3 in (29)
      if (0 <= d && d < 1e4) {
        d *= xd1; // finish (29)
        m12 += d;
        const sx = 2 / xd2;
        const sy = 1 / (yc3 + d); // ye2=yd2=yc3 in (31)
        m20 = m10 * sy;
        m21 = m11 * sy;
        m22 = m12 * sy; // (38)
        const u = (2 * (sy * d)) / (1 - sy * d); // (34)
        const u1 = u + 1;
        m10 = u1 * m20;
        m11 = u1 * m21;
        m12 = u1 * m22 - u;
        m00 = sx * m00 - m20;
        m01 = sx * m01 - m21;
        m02 = sx * m02 - m22;
      } else {
        const sx = 2 / xd2;
        const sy = 2 / yc3; // yd2 = yc3 in (41)
        m00 *= sx;
        m01 *= sx;
        m02 = m02 * sx - 1;
        m10 *= sy;
        m11 *= sy;
        m12 = m12 * sy - 1;
        m20 = 0;
        m21 = 0;
        m22 = 1;
      }
      // Project the focus hull using our new transformation.
      let n = 0;
      for (const h of this.focusHull) {
        const w = m20 * h.x + m21 * h.y + m22;
        this.focusProjected[n].x = (m00 * h.x + m01 * h.y + m02) / w;
        this.focusProjected[n].y = (m10 * h.x + m11 * h.y + m12) / w;
        ++n;
      }
      // Done when this matrix produces a smaller area than the last,
      // which means we're one past peak.
      const area = Geometry.getPolygonArea(this.focusProjected, n);
      if (area < lastArea) {
        break;
      }
      lastArea = area;
      xi += xiInc;
    } while (xi < 1);
    // Matrix m is now a mapping to ndc. Fill in rows of the OpenGL format
    // matrix.  Third row determines front-back clip in depth buffer.
    m[0] = m00;
    m[4] = m01;
    m[8] = 0;
    m[12] = m02;

    m[1] = m10;
    m[5] = m11;
    m[9] = 0;
    m[13] = m12;

    m[2] = 0;
    m[6] = 0;
    m[10] = 2 / (near - far);
    m[14] = (near + far) / (near - far);

    m[3] = m20;
    m[7] = m21;
    m[11] = 0;
    m[15] = m22;
  }
}

/** A view pyramid with TSM features. May be either for the viewer's eye or the light. */
class Pyramid {
  private readonly vCanon = Utility.createArray(vec3.create, 10);
  private readonly vActual = Utility.createArray(() => new Point2D(), 10);

  public set(left: number, right: number, bottom: number, top: number, near: number, far: number): void {
    const zn = -near;
    vec3.set(this.vCanon[0], right, bottom, zn);
    vec3.set(this.vCanon[1], right, top, zn);
    vec3.set(this.vCanon[2], left, top, zn);
    vec3.set(this.vCanon[3], left, bottom, zn);
    const zf = -far;
    const r = zf / zn;
    const farLeft = r * left;
    const farRight = r * right;
    const farBottom = r * bottom;
    const farTop = r * top;
    vec3.set(this.vCanon[4], farRight, farBottom, zf);
    vec3.set(this.vCanon[5], farRight, farTop, zf);
    vec3.set(this.vCanon[6], farLeft, farTop, zf);
    vec3.set(this.vCanon[7], farLeft, farBottom, zf);
    // Points 8 and 9 are at the middle of the near and far planes.
    vec3.set(this.vCanon[8], 0.5 * (right + left), 0.5 * (top + bottom), zn);
    vec3.set(this.vCanon[9], 0.5 * (farRight + farLeft), 0.5 * (farTop + farBottom), zf);
  }

  public getHull(convextHullService: ConvexHullService, hull: Point2DInterface[], xForm: mat4): Point2DInterface[] {
    // Transform the frustum to 2d normalized device coordinates.
    convextHullService.clear();
    for (let i = 0; i < this.vCanon.length; i++) {
      // Hand code 2d parallel mm for a bit of speed.
      this.vActual[i].x =
        xForm[0] * this.vCanon[i][0] +
        xForm[4] * this.vCanon[i][1] +
        xForm[8] * this.vCanon[i][2] +
        xForm[12] * this.vCanon[i][3];
      this.vActual[i].y =
        xForm[1] * this.vCanon[i][0] +
        xForm[5] * this.vCanon[i][1] +
        xForm[9] * this.vCanon[i][2] +
        xForm[13] * this.vCanon[i][3];
      // Perspective division for point light source would go here.
      convextHullService.addPoint(this.vActual[i]);
    }
    return convextHullService.createHull(hull);
  }

  public get nearCenter(): Point2DInterface {
    return this.vActual[8];
  }

  public get farCenter(): Point2DInterface {
    return this.vActual[9];
  }

  public getAxis(axis: Vector2DInterface) {
    Geometry.subtract2D(axis, this.vActual[9], this.vActual[8]);
    let r = 1 / Geometry.length2D(axis);
    if (!Number.isFinite(r)) {
      // Use an edge of the far plane as the axis direction.
      Geometry.subtract2D(axis, this.vActual[5], this.vActual[4]);
      r = 1 / Geometry.length2D(axis);
    }
    return Geometry.scale2D(axis, r);
  }
}
