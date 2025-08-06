import { MemberLabelPositionService } from './member-label-position.service';
import { BridgeService } from './bridge.service';
import { Member } from '../classes/member.model';
import { projectLocalMatchers } from '../test/jasmine-matchers';

describe('MemberLabelPositionService', () => {
  let service: MemberLabelPositionService;
  const members: Member[] = [];
  let bridgeService: jasmine.SpyObj<BridgeService>;

  function makeMember(ax: number, ay: number, bx: number, by: number): Member {
    return {
      a: { x: ax, y: ay },
      b: { x: bx, y: by },
    } as Member;
  }

  beforeEach(() => {
    jasmine.addMatchers(projectLocalMatchers);
    members.length = 0;
    bridgeService = jasmine.createSpyObj('BridgeService', [], {
      bridge: { members },
    });
    service = new MemberLabelPositionService(bridgeService);
  });

  it('should compute label positions for a square (no overlaps)', () => {
    members.push(
      makeMember(0, 0, 4, 0), // bottom
      makeMember(4, 0, 4, 4), // right
      makeMember(4, 4, 0, 4), // top
      makeMember(0, 4, 0, 0), // left
    );
    const result = service.labelPositions;
    expect(result.subarray(0, 4)).toNearlyEqual(new Float64Array([2, 2, 2, 2]), -5e-1);
    expect(result.subarray(4, 8)).toNearlyEqual(new Float64Array([0, 0, 0, 0]), -5e-2);
  });

  it('should compute label positions for a square with both diagonals', () => {
    members.push(
      makeMember(0, 0, 1, 0), // bottom
      makeMember(1, 0, 1, 1), // right
      makeMember(1, 1, 0, 1), // top
      makeMember(0, 1, 0, 0), // left
      makeMember(0, 0, 1, 1), // diagonal 1
      makeMember(1, 0, 0, 1), // diagonal 2
    );
    const result = service.labelPositions;
    expect(result.subarray(6, 12)).toNearlyEqual(new Float64Array([0, 0, 0, 0, 0, 0]), -5e-2);
  });

  it('should compute label positions for overlapping random segments', () => {
    members.push(
      makeMember(0, 0, 2, 0),
      makeMember(1, -1, 1, 1),
      makeMember(0, 1, 2, 1),
      makeMember(0.5, -0.5, 1.5, 1.5),
      makeMember(0, 0.5, 2, 0.5),
    );
    const result = service.labelPositions;
    expect(result.subarray(6, 12)).toNearlyEqual(new Float64Array([0, 0, 0, 0, 0, 0]), -5e-2);
  });
});
