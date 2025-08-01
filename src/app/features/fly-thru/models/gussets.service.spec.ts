import { TestBed } from '@angular/core/testing';
import { GussetsService } from '../../../shared/services/gussets.service';
import { BridgeService } from '../../../shared/services/bridge.service';
import { ConvexHullService } from '../../../shared/services/convex-hull.service';
import { Joint } from '../../../shared/classes/joint.model';
import { Member } from '../../../shared/classes/member.model';
import { Point2DInterface } from '../../../shared/classes/graphics';
import { projectLocalMatchers } from '../../../shared/test/jasmine-matchers';

describe('GussetsService', () => {
  let service: GussetsService;
  let bridgeServiceSpy: jasmine.SpyObj<BridgeService>;

  const jointA = { x: 0, y: 0, index: 0 } as Joint;
  const jointB = { x: 1, y: 1, index: 1 } as Joint;
  const jointC = { x: 2, y: 0, index: 2 } as Joint;
  const memberAB = buildTestMember(jointA, jointB, 100);
  const memberBC = buildTestMember(jointB, jointC, 200);
  const memberCA = buildTestMember(jointC, jointA, 300);
  const expectedHull: Point2DInterface[] = [
    { x: 0.269, y: 0.17 },
    { x: 0.17, y: 0.269 },
    { x: -0.17, y: 0.17 },
    { x: -0.17, y: -0.17 },
    { x: 0.269, y: -0.17 },
  ];
  /* TODO: Move to BridgeModelService test.
  // prettier-ignore
  const expectedMeshPositions = new Float32Array([
    // Outer surface quads
    0.269, -0.17, -0.17,
    0.269, -0.17, 0.17,
    0.269, 0.17, -0.17,
    0.269, 0.17, 0.17,

    0.269, 0.17, -0.17,
    0.269, 0.17, 0.17,
    0.17, 0.269, -0.17,
    0.17, 0.269, 0.17,

    0.17, 0.269, -0.17,
    0.17, 0.269, 0.17,
    -0.17, 0.17, -0.17,
    -0.17, 0.17, 0.17,

    -0.17, 0.17, -0.17,
    -0.17, 0.17, 0.17,
    -0.17, -0.17, -0.17,
    -0.17, -0.17, 0.17,

    -0.17, -0.17, -0.17,
    -0.17, -0.17, 0.17,
    0.269, -0.17, -0.17,
    0.269, -0.17, 0.17,

    // Positive end
    0, 0, 0.17,
    0.269, 0.17, 0.17,
    0.17, 0.269, 0.17,
    -0.17, 0.17, 0.17,
    -0.17, -0.17, 0.17,
    0.269, -0.17, 0.17,

    // Negative end
    0, 0, -0.17,
    0.269, -0.17, -0.17,
    -0.17, -0.17, -0.17,
    -0.17, 0.17, -0.17,
    0.17, 0.269, -0.17,
    0.269, 0.17, -0.17
  ]);

  // prettier-ignore
  const expectedMeshNormals = new Float32Array([
    // Outer surface quads.
     1, 0, 0,
     1, 0, 0,
     1, 0, 0,
     1, 0, 0,

     0.7071, 0.7071, 0,
     0.7071, 0.7071, 0,
     0.7071, 0.7071, 0,
     0.7071, 0.7071, 0,

     -0.2796, 0.9601, 0,
     -0.2796, 0.9601, 0,
     -0.2796, 0.9601, 0,
     -0.2796, 0.9601, 0,

     -1, 0, 0,
     -1, 0, 0,
     -1, 0, 0,
     -1, 0, 0,

     0, -1, 0,
     0, -1, 0,
     0, -1, 0,
     0, -1, 0,

     // Positive end
     0, 0, 1,
     0, 0, 1,
     0, 0, 1,
     0, 0, 1,
     0, 0, 1,
     0, 0, 1,

     // Negative end
     0, 0, -1,
     0, 0, -1,
     0, 0, -1,
     0, 0, -1,
     0, 0, -1,
     0, 0, -1,
  ]);
  // prettier-ignore
  const expectedMeshIndices = new Uint16Array([
    // Outer surface quads
    0, 3, 1,
    3, 0, 2,

    4, 7, 5,
    7, 4, 6,

    8, 11, 9,
    11, 8, 10,

    12, 15, 13,
    15, 12, 14,

    16, 19, 17,
    19, 16, 18,

    // Positive end
    20, 25, 21,
    20, 21, 22,
    20, 22, 23,
    20, 23, 24,
    20, 24, 25,

    // Negative end
    26, 31, 27,
    26, 27, 28,
    26, 28, 29,
    26, 29, 30,
    26, 30, 31
  ]);
  */

  beforeEach(() => {
    jasmine.addMatchers(projectLocalMatchers);
    bridgeServiceSpy = jasmine.createSpyObj('BridgeService', [], {
      bridge: {
        joints: [jointA, jointB, jointC],
        members: [memberAB, memberBC, memberCA],
      },
    });

    TestBed.configureTestingModule({
      providers: [GussetsService, ConvexHullService, { provide: BridgeService, useValue: bridgeServiceSpy }],
    });
    service = TestBed.inject(GussetsService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('should generate gussets for each joint', () => {
    const gussets = service.gussets;
    expect(gussets.length).toBe(3);
    gussets.forEach((gusset, idx) => {
      expect(gusset.joint.index).toBe(idx);
      expect(Array.isArray(gusset.hull)).toBeTrue();
      expect(gusset.halfDepthM).toBeGreaterThan(0.1);
      expect(gusset.hull.length).toBeGreaterThan(0);
    });
  });

  it('should produce expected gusset contents', () => {
    const gusset = service.gussets[0];
    expect(gusset.joint).toEqual(jointA);
    expect(gusset.halfDepthM).toBeCloseTo(0.17);
    expect(gusset.hull).toNearlyEqual(expectedHull, 1e-3);
  });

  /* TODO: Move to BridgeModelService test.
  it('should produce expected mesh for gusset', () => {
    const gusset = service.gussets[0];
    const mesh = service.buildMeshDataForGusset(gusset);
    expect(mesh.positions instanceof Float32Array).toBeTrue();
    expect(mesh.normals instanceof Float32Array).toBeTrue();
    expect(mesh.instanceModelTransforms instanceof Float32Array).toBeTrue();
    expect(mesh.materialRefs instanceof Uint16Array).toBeTrue();
    expect(mesh.indices instanceof Uint16Array).toBeTrue();
    expect(mesh.positions).withContext('positions').toNearlyEqual(expectedMeshPositions, 1e-3);
    expect(mesh.normals).withContext('normals').toNearlyEqual(expectedMeshNormals, 1e-3);
    expect(mesh.indices).withContext('indices').toEqual(expectedMeshIndices);
  });*/

  function buildTestMember(a: Joint, b: Joint, materialSizeMm: number): Member {
    return { a, b, materialSizeMm, getOtherJoint: (j: Joint) => (j === a ? b : a) } as Member;
  }
});
