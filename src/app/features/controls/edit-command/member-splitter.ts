import { BridgeModel } from '../../../shared/classes/bridge.model';
import { EditableUtility } from '../../../shared/classes/editing';
import { Geometry } from '../../../shared/classes/graphics';
import { Joint } from '../../../shared/classes/joint.model';
import { Member } from '../../../shared/classes/member.model';
import { DesignConditions } from '../../../shared/services/design-conditions.service';
import { SelectedElements, SelectedSet } from '../../drafting/shared/selected-elements-service';
import { ContextElementRef, RehydrationContext, DehydrationContext } from './dehydration-context';

/** Helper to handle cases where a new joint or one to be moved transects existing members. */
export class MemberSplitter {
  readonly mergedMembers: Member[] = [];
  readonly removedMembers: Member[] = [];
  private isSplitDone = false;

  private constructor(
    private readonly joint: Joint,
    private readonly members: Member[],
    private readonly selectedMembers: SelectedSet,
  ) {}

  public static create(joint: Joint, members: Member[], selectedMembers: SelectedSet) {
    return new MemberSplitter(joint, members, selectedMembers);
  }

  /** Does member splitting in the given list. */
  public do(): void {
    this.isSplitDone ||= this.doSplit();
    const futureMemberCount = this.members.length + this.mergedMembers.length - this.removedMembers.length;
    if (futureMemberCount > DesignConditions.MAX_MEMBER_COUNT) {
      throw new Error(`Opps... That would be too many members. Only ${DesignConditions.MAX_MEMBER_COUNT} allowed.`);
    }
    EditableUtility.remove(this.members, this.removedMembers, this.selectedMembers);
    EditableUtility.merge(this.members, this.mergedMembers, this.selectedMembers);
  }

  /** Undoes member splitting in the given list. */
  public undo(): void {
    EditableUtility.remove(this.members, this.mergedMembers, this.selectedMembers);
    EditableUtility.merge(this.members, this.removedMembers, this.selectedMembers);
  }

  /** Returns whether the splitter has split anything. */
  public get hasSplit(): boolean {
    return this.mergedMembers.length > 0 || this.removedMembers.length > 0;
  }

  /** Determines members to be merged and removed to implement the split. */
  private doSplit(): boolean {
    const sentinelIndex = 10000; // too big to be a real index
    const connectedMemberJointPairs = new Set<string>();
    for (const member of this.members) {
      if (member.hasJoint(this.joint)) {
        connectedMemberJointPairs.add(member.key);
      }
    }
    // Track the number of valid (non-sentinel) indices in the bridge as splitting progresses.
    let validIndexCount = this.members.length;
    for (const member of this.members) {
      // If the added/moved joint on this member and (trivially true for adds) the member isn't connected to the joint...
      if (Geometry.isPointOnSegment(this.joint, member.a, member.b) && !connectedMemberJointPairs.has(member.key)) {
        this.removedMembers.push(member);
        validIndexCount--;
        // Reuse removed index if possible
        let mergeIndex = member.index;
        if (!connectedMemberJointPairs.has(Member.getJointsKey(member.a, this.joint))) {
          this.mergedMembers.push(new Member(mergeIndex, member.a, this.joint, member.material, member.shape));
          validIndexCount++;
          mergeIndex = sentinelIndex;
        }
        if (!connectedMemberJointPairs.has(Member.getJointsKey(this.joint, member.b))) {
          this.mergedMembers.push(new Member(mergeIndex, this.joint, member.b, member.material, member.shape));
          if (mergeIndex !== sentinelIndex) {
            validIndexCount++;
          }
        }
      }
    }
    // Replace the sentinels with real indices and get everything in sorted order for merging.
    for (const member of this.mergedMembers) {
      if (member.index === sentinelIndex) {
        member.index = validIndexCount++;
      }
    }
    // TODO: Remove after tested.
    const expectedValidIndexCount = this.members.length - this.removedMembers.length + this.mergedMembers.length;
    if (validIndexCount !== expectedValidIndexCount) {
      throw new Error(`Member split invariant broke. Expected ${expectedValidIndexCount}. Saw ${validIndexCount}.`);
    }
    this.mergedMembers.sort((a: Member, b: Member) => a.index - b.index);
    return true;
  }

  dehydrate(context: DehydrationContext): DehydratedMemberSplitter {
    return {
      mergedMembers: this.mergedMembers.map(member => context.getMemberRef(member)),
      removedMembers: this.removedMembers.map(member => context.getMemberRef(member)),
    };
  }

  static rehydrate(
    context: RehydrationContext,
    dehydrated: DehydratedMemberSplitter,
    joint: Joint,
    bridge: BridgeModel,
    selectedElements: SelectedElements,
  ): MemberSplitter {
    const splitter = new MemberSplitter(joint, bridge.members, selectedElements.selectedMembers);
    dehydrated.mergedMembers.forEach(member => splitter.mergedMembers.push(context.rehydrateMemberRef(member)));
    dehydrated.removedMembers.forEach(member => splitter.removedMembers.push(context.rehydrateMemberRef(member)));
    splitter.isSplitDone = true;
    return splitter;
  }
}

export type DehydratedMemberSplitter = {
  mergedMembers: ContextElementRef[];
  removedMembers: ContextElementRef[];
};
