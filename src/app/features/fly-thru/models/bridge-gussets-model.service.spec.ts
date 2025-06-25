import { TestBed } from '@angular/core/testing';
import { BridgeGussetsModelService } from './bridge-gussets-model.service';
import { BridgeService } from '../../../shared/services/bridge.service';
import { ConvexHullService } from '../../../shared/services/convex-hull.service';
import { Joint } from '../../../shared/classes/joint.model';
import { Member } from '../../../shared/classes/member.model';

describe('BridgeGussetsModelService', () => {
  let service: BridgeGussetsModelService;
  let bridgeServiceSpy: jasmine.SpyObj<BridgeService>;

  beforeEach(() => {
    const jointA = { x: 0, y: 0, index: 0 } as Joint;
    const jointB = { x: 1, y: 1, index: 1 } as Joint;
    const jointC = { x: 2, y: 0, index: 2 } as Joint;
    const memberAB = buildMember(jointA, jointB, 10);
    const memberBC = buildMember(jointB, jointC, 20);
    const memberCA = buildMember(jointC, jointA, 30);

    bridgeServiceSpy = jasmine.createSpyObj('BridgeService', [], {
      bridge: {
        joints: [jointA, jointB, jointC],
        members: [memberAB, memberBC, memberCA],
      },
    });

    TestBed.configureTestingModule({
      providers: [BridgeGussetsModelService, ConvexHullService, { provide: BridgeService, useValue: bridgeServiceSpy }],
    });
    service = TestBed.inject(BridgeGussetsModelService);
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
      expect(gusset.halfDepthM).toBeGreaterThan(0.10);
      expect(gusset.hull.length).toBeGreaterThan(0);
    });
  });

  it('should return an array from meshData getter', () => {
    const meshData = service.meshData;
    expect(Array.isArray(meshData)).toBeTrue();
  });

  function buildMember(a: Joint, b: Joint, materialSizeCm: number): Member {
    return { a, b, materialSizeMm, getOtherJoint: (j: Joint) => (j === a ? b : a) } as Member;
  }
});
