import { Joint } from '../../../shared/classes/joint.model';
import { Member } from '../../../shared/classes/member.model';
import { projectLocalMatchers } from '../../../shared/test/jasmine-matchers';
import { FailedMemberModelService, parabolaPoints } from './failed-member-model.service';
import { mat3, vec2, vec3 } from 'gl-matrix';

describe('FailedMemberModelService', () => {
  let service: FailedMemberModelService;
  const s0 = vec2.fromValues(0, 0);
  const s1 = vec2.fromValues(1, 0);
  const s2 = vec2.fromValues(1, 1);
  const s3 = vec2.fromValues(0, 1);
  const searchData = [
    0.0, 0.0625, 0.125, 0.15625, 0.1875, 0.21875, 0.25, 0.28125, 0.3125, 0.34375, 0.375, 0.40625, 0.4375, 0.46875, 0.5,
    0.53125, 0.5625, 0.59375, 0.625, 0.65625, 0.6875, 0.71875, 0.75, 0.78125, 0.8125, 0.84375, 0.875, 0.90625, 0.9375,
    0.96875, 0.984375, 0.992188, 1.0,
  ];
  const jointA = { index: 0 } as Joint;
  const jointB = { index: 1 } as Joint;
  const member = { a: jointA, b: jointB, materialSizeMm: 800, length: 14 } as Member;
  const jointLocations = new Float32Array([1, 1, 7, 9]);

  beforeEach(() => {
    jasmine.addMatchers(projectLocalMatchers);
    service = new FailedMemberModelService();
  });

  it('creates a valid segment transform matrix for a random trapezoid', () => {
    const p0 = vec2.fromValues(1, 1);
    const p1 = vec2.fromValues(2, 0.5);
    const p2 = vec2.fromValues(2.5, 22);
    const t = 1.5;
    const p3 = vec2.scaleAndAdd(vec2.create(), p2, vec2.sub(vec2.create(), p0, p1), t);

    const segmentTransform = service.buildSegmentTransform(mat3.create(), p0, p1, p2, p3);

    const r0 = transform(segmentTransform, s0);
    const r1 = transform(segmentTransform, s1);
    const r2 = transform(segmentTransform, s2);
    const r3 = transform(segmentTransform, s3);

    expect(r0).toNearlyEqual(p0, 1e-6);
    expect(r1).toNearlyEqual(p1, 1e-6);
    expect(r2).toNearlyEqual(p2, 1e-6);
    expect(r3).toNearlyEqual(p3, 1e-6);
  });

  it('admits model transformations of the segment transform', () => {
    const p0 = vec2.fromValues(1, 1);
    const p1 = vec2.fromValues(4, 3);
    const p2 = vec2.fromValues(3, 5);
    const t = 0.75;
    const p3 = vec2.scaleAndAdd(vec2.create(), p2, vec2.sub(vec2.create(), p0, p1), t);

    const segmentTransform = service.buildSegmentTransform(mat3.create(), p0, p1, p2, p3);

    const modelTransform = mat3.fromTranslation(mat3.create(), vec2.fromValues(3, 7));
    mat3.rotate(modelTransform, modelTransform, Math.PI * 0.2);
    mat3.multiply(segmentTransform, modelTransform, segmentTransform);

    const r0 = transform(segmentTransform, s0);
    const r1 = transform(segmentTransform, s1);
    const r2 = transform(segmentTransform, s2);
    const r3 = transform(segmentTransform, s3);

    const x0 = vec2.transformMat3(vec2.create(), p0, modelTransform);
    const x1 = vec2.transformMat3(vec2.create(), p1, modelTransform);
    const x2 = vec2.transformMat3(vec2.create(), p2, modelTransform);
    const x3 = vec2.transformMat3(vec2.create(), p3, modelTransform);

    expect(r0).toNearlyEqual(x0, 1e-5);
    expect(r1).toNearlyEqual(x1, 1e-5);
    expect(r2).toNearlyEqual(x2, 1e-5);
    expect(r3).toNearlyEqual(x3, 1e-5);
  });

  function transform(m: mat3, xy: vec2): vec2 {
    const x3 = vec3.fromValues(xy[0], xy[1], 1);
    const r = vec3.transformMat3(vec3.create(), x3, m);
    // Do the same special transform as the shader will.
    return vec2.fromValues(r[0] / r[3], r[1] / r[3]);
  }

  it('encodes normals', () => {
    const p0 = vec2.fromValues(-3, -1);
    const p1 = vec2.fromValues(3, -1);
    const p2 = vec2.fromValues(1.5, 1);
    const t = 1 / 3; // (-1, 1)
    const p3 = vec2.scaleAndAdd(vec2.create(), p2, vec2.sub(vec2.create(), p0, p1), t);

    const segmentTransform = service.buildSegmentTransform(mat3.create(), p0, p1, p2, p3);

    const [n0, n1] = extractNormals(segmentTransform);

    const expectedN0 = vec2.sub(vec2.create(), p0, p3);
    const expectedN1 = vec2.sub(vec2.create(), p1, p2);

    expect(n0).toNearlyEqual(expectedN0, 1e-5);
    expect(n1).toNearlyEqual(expectedN1, 1e-5);
  });

  it('encodes normals after model transform', () => {
    const p0 = vec2.fromValues(-3, -1);
    const p1 = vec2.fromValues(3, -1.2);
    const p2 = vec2.fromValues(1.5, 1);
    const t = 0.5;
    const p3 = vec2.scaleAndAdd(vec2.create(), p2, vec2.sub(vec2.create(), p0, p1), t);

    const segmentTransform = service.buildSegmentTransform(mat3.create(), p0, p1, p2, p3);
    const modelTransform = mat3.fromTranslation(mat3.create(), vec2.fromValues(3, 7));
    mat3.rotate(modelTransform, modelTransform, Math.PI * 0.2);
    mat3.multiply(segmentTransform, modelTransform, segmentTransform);

    const [n0, n1] = extractNormals(segmentTransform);

    const d03 = vec2.sub(vec2.create(), p0, p3);
    const d12 = vec2.sub(vec2.create(), p1, p2);

    const expectedN0 = vec3.transformMat3(vec3.create(), vec3.fromValues(d03[0], d03[1], 0), modelTransform);
    const expectedN1 = vec3.transformMat3(vec3.create(), vec3.fromValues(d12[0], d12[1], 0), modelTransform);

    expect(vec3.fromValues(n0[0], n0[1], 0)).toNearlyEqual(expectedN0, 1e-5);
    expect(vec3.fromValues(n1[0], n1[1], 0)).toNearlyEqual(expectedN1, 1e-5);
  });

  /** Extracts face normals from segment matrix. */
  function extractNormals(sm: mat3): [vec2, vec2] {
    // prettier-ignore
    const p = [
      vec3.fromValues(0,0,1),
      vec3.fromValues(1,0,1),
      vec3.fromValues(1,1,1),
      vec3.fromValues(0,1,1)
    ];
    p.forEach(v => vec3.transformMat3(v, v, sm));
    return [
      vec2.fromValues(p[0][0] / p[0][2] - p[3][0] / p[3][2], p[0][1] / p[0][2] - p[3][1] / p[3][2]),
      vec2.fromValues(p[1][0] / p[1][2] - p[2][0] / p[2][2], p[1][1] / p[0][2] - p[2][1] / p[2][2]),
    ];
  }

  it('builds expected buckled member mesh data for member', () => {
    const members = [member];
    const trussCenterlineOffset = 4;
    const buckledMemberMeshData = service.buildMeshDataForBuckledMembers(members, jointLocations, trussCenterlineOffset);
    const transforms = buckledMemberMeshData.meshData.instanceModelTransforms!;
    expect(transforms[transform.length - 1]).not.toBe(0);
    expect(buckledMemberMeshData.jointLocations).toBe(jointLocations);
    expect(buckledMemberMeshData.trussCenterlineOffset).toBe(trussCenterlineOffset);
  });

  it('searches data values correctly', () => {
    for (const x of searchData) {
      const index = FailedMemberModelService.searchFloor(x, searchData);
      expect(index).toBeGreaterThanOrEqual(0);
      expect(index).toBeLessThan(searchData.length);
      expect(searchData[index]).toBeLessThanOrEqual(x);
      if (index !== searchData.length - 1) {
        expect(searchData[index + 1]).toBeGreaterThan(x);
      }
    }
  });

  it('searches non-data values correctly', () => {
    for (let x = 0; x <= 1; x += 1 / 1024) {
      const index = FailedMemberModelService.searchFloor(x, searchData);
      expect(index).toBeGreaterThanOrEqual(0);
      expect(index).toBeLessThan(searchData.length);
      expect(searchData[index]).toBeLessThanOrEqual(x);
      if (index !== searchData.length - 1) {
        expect(searchData[index + 1]).toBeGreaterThan(x);
      }
    }
  });

  it('has buckled height zero if no actual buckling', () => {
    const height = FailedMemberModelService.getParabolaHeight(42, 42);
    expect(height).toBe(0);
  });

  it('has height equal to half of length if completely bucked', () => {
    const height = FailedMemberModelService.getParabolaHeight(42, 0);
    expect(height).toBe(21);
  });

  it('looks up a reasonable height', () => {
    const height = FailedMemberModelService.getParabolaHeight(42, 21);
    expect(height).toBeCloseTo(17.1633, 1e-4);
  });

  it('generates correct parabola points', () => {
    const length = 20;
    const buckledLength = 10;
    const height = FailedMemberModelService.getParabolaHeight(length, buckledLength);
    const outer = vec2.create();
    const inner = vec2.create();
    const generator = parabolaPoints(outer, inner, buckledLength, height, 0.5, 33);
    const points: { outer: vec2; inner: vec2 }[] = [];
    generator.next();
    points.push({ outer: vec2.clone(outer), inner: vec2.clone(inner) });
    while (!generator.next().done) {
      points.push({ outer: vec2.clone(outer), inner: vec2.clone(inner) });
    }
    expect(points.length).toBe(33);
    // apex points
    expect(points[0].outer[0]).toBeCloseTo(buckledLength / 2);
    expect(points[0].outer[1]).toBeCloseTo(height + 0.5);
    expect(points[0].inner[0]).toBeCloseTo(buckledLength / 2);
    expect(points[0].inner[1]).toBeCloseTo(height - 0.5);
    // finish point, right
    const lastRight = points.length - 1;
    expect(vec2.dist(points[lastRight].outer, points[lastRight].inner)).toBeCloseTo(1);
    expect(vec2.lerp(vec2.create(), points[lastRight].outer, points[lastRight].inner, 0.5)).toNearlyEqual(
      vec2.fromValues(10, 0),
    );
    // finish point, right
    const lastLeft = points.length - 2;
    expect(vec2.dist(points[lastLeft].outer, points[lastLeft].inner)).toBeCloseTo(1);
    expect(vec2.lerp(vec2.create(), points[lastLeft].outer, points[lastLeft].inner, 0.5)).toNearlyEqual(
      vec2.fromValues(0, 0),
    );
  });
});
