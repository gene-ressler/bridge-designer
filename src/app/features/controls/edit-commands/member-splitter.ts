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
  private isInitialized = false;

  constructor(
    private readonly joint: Joint,
    private readonly members: Member[],
    private readonly selectedMembers: SelectedSet,
  ) {}

  /** Do member splitting in the given list. */
  public do(): void {
    // Skip redundant initialization during redos.
    if (!this.isInitialized) {
      this.initializeMembers();
      this.isInitialized = true;
    }
    if (
      this.members.length + this.mergedMembers.length - this.removedMembers.length >
      DesignConditions.MAX_MEMBER_COUNT
    ) {
      throw new Error('max member count would be exceeded by splitting');
    }
    EditableUtility.remove(this.members, this.removedMembers, this.selectedMembers);
    EditableUtility.merge(this.members, this.mergedMembers, this.selectedMembers);
  }

  /** Undo member splitting in the given list. */
  public undo(): void {
    EditableUtility.remove(this.members, this.mergedMembers, this.selectedMembers);
    EditableUtility.merge(this.members, this.removedMembers, this.selectedMembers);
  }

  private initializeMembers(): void {
    const connectedMemberJointPairs = new Set<string>();
    for (const member of this.members) {
      if (member.a === this.joint || member.b === this.joint) {
        connectedMemberJointPairs.add(member.key);
      }
    }
    var existingMemberCount = this.members.length;
    for (const member of this.members) {
      // If the splitting point lies on this member and the member is not connected to the
      // joint we're moving (or inserting, which is never).
      if (Geometry.isPointOnSegment(this.joint, member.a, member.b) && !connectedMemberJointPairs.has(member.key)) {
        this.removedMembers.push(member);
        existingMemberCount--;
        // Re-use the old member index for the first new one to make re-numbering minimially disruptive.
        var index = member.index;
        if (!connectedMemberJointPairs.has(Member.getJointsKey(member.a, this.joint))) {
          this.mergedMembers.push(new Member(index, member.a, this.joint, member.material, member.shape));
          index = -1; // Second insert, if any, is un-indexed.
          existingMemberCount++;
        }
        if (!connectedMemberJointPairs.has(Member.getJointsKey(this.joint, member.b))) {
          this.mergedMembers.push(new Member(index, this.joint, member.b, member.material, member.shape));
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
}
