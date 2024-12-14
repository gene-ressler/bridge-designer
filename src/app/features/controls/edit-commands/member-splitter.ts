import { EditableUtility } from '../../../shared/classes/editing';
import { Geometry, Point2DInterface } from '../../../shared/classes/graphics';
import { Joint } from '../../../shared/classes/joint.model';
import { Member } from '../../../shared/classes/member.model';
import { DesignConditions } from '../../../shared/services/design-conditions.service';
import { SelectedSet } from '../../drafting/services/selected-elements-service';

/** Helper to handle cases where a new joint or one to be moved transects existing members. */
export class MemberSplitter {
  private readonly mergedMembers: Member[] = [];
  private readonly removedMembers: Member[] = [];

  constructor(pt: Point2DInterface, joint: Joint, members: Member[]) {
    const connectedMemberJointPairs = new Set<string>();
    for (const member of members) {
      if (member.a === joint || member.b === joint) {
        connectedMemberJointPairs.add(member.key);
      }
    }
    var existingMemberCount = members.length;
    for (const member of members) {
      // If the splitting point lies on this member and the member is not connected to the
      // joint we're moving (or inserting, which is never).
      if (
        Geometry.isPointOnSegment(pt, member.a, member.b) &&
        !connectedMemberJointPairs.has(member.key)
      ) {
        this.removedMembers.push(member);
        existingMemberCount--;
        // Re-use the old member index for the first new one to make re-numbering minimially disruptive.
        var index = member.index;
        if (!connectedMemberJointPairs.has(Member.getJointsKey(member.a, joint))) {
          this.mergedMembers.push(
            new Member(index, member.a, joint, member.material, member.shape),
          );
          index = -1; // Second insert, if any, is un-indexed.
          existingMemberCount++;
        }
        if (!connectedMemberJointPairs.has(Member.getJointsKey(joint, member.b))) {
          this.mergedMembers.push(
            new Member(index, joint, member.b, member.material, member.shape),
          );
        }
      }
    }
    // Index un-indexed members at the end, so they're appended.
    var index = existingMemberCount;
    this.mergedMembers.forEach(member => {
      if (member.index < 0) {
        member.index = index++;
      }
    });
  }

  /** Do member splitting in the given list. */
  public do(members: Member[], selectedMembers: SelectedSet): void {
    if (
      members.length + this.mergedMembers.length - this.removedMembers.length >
      DesignConditions.MAX_MEMBER_COUNT
    ) {
      throw new Error('max member count would be exceeded by splitting');
    }
    EditableUtility.remove(members, this.removedMembers, selectedMembers);
    EditableUtility.merge(members, this.mergedMembers, selectedMembers);
  }

  /** Undo member splitting in the given list. */
  public undo(members: Member[], selectedMembers: SelectedSet): void {
    EditableUtility.remove(members, this.mergedMembers, selectedMembers);
    EditableUtility.merge(members, this.removedMembers, selectedMembers);
  }
}
