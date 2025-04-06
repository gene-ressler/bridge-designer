import { EditableUtility } from '../../../shared/classes/editing';
import { Geometry } from '../../../shared/classes/graphics';
import { Joint } from '../../../shared/classes/joint.model';
import { Member } from '../../../shared/classes/member.model';
import { Deque } from '../../../shared/core/deque';
import { DesignConditions } from '../../../shared/services/design-conditions.service';
import { SelectedElements, SelectedSet } from '../../drafting/shared/selected-elements-service';
import { ToastError } from '../../toast/toast/toast-error';
import { ContextElementRef, RehydrationContext, DehydrationContext } from './dehydration-context';

/** Helper to handle cases where a new joint or one to be moved transects existing members. */
export class MemberSplitter {
  readonly mergedMembers: Member[] = [];
  readonly removedMembers: Member[] = [];
  private isSplitDone = false;

  private constructor(
    /** Joint to be added or else all joints with conflicts to resolve. */
    private readonly joints: Joint | Joint[],
    private readonly members: Member[],
    private readonly selectedMembers: SelectedSet,
  ) {}

  public static createForAdd(joint: Joint, members: Member[], selectedMembers: SelectedSet) {
    return new MemberSplitter(joint, members, selectedMembers);
  }

  public static createForMove(joints: Joint[], members: Member[], selectedMembers: SelectedSet) {
    return new MemberSplitter(joints, members, selectedMembers);
  }

  /** Does member splitting in the given list. */
  public do(): void {
    this.isSplitDone ||= this.doSplit();
    const futureMemberCount = this.members.length + this.mergedMembers.length - this.removedMembers.length;
    if (futureMemberCount > DesignConditions.MAX_MEMBER_COUNT) {
      throw new ToastError('tooManyMembersError');
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
    if (this.joints instanceof Joint) {
      this.doSplitForAdd(this.joints);
    } else {
      this.doSplitForMove(this.joints);
    }
    return true;
  }

  private doSplitForAdd(joint: Joint): void {
    let nextIndex = this.members.length;
    for (const member of this.members) {
      if (Geometry.isPointOnSegment(joint, member.a, member.b)) {
        this.removedMembers.push(member);
        this.mergedMembers.push(new Member(member.index, member.a, joint, member.material, member.shape));
        this.mergedMembers.push(new Member(nextIndex++, joint, member.b, member.material, member.shape));
      }
    }
    this.mergedMembers.sort((a, b) => a.index - b.index);
  }

  /** 
   * Resolves arbitrary joint-on-member conflicts. 
   * 
   * Uses the trivial algorithm because there can be only 6000 pairs.
   * Tries to minimize churn in member numbers.
   */
  private doSplitForMove(joints: Joint[]) {
    let memberKeys = new Set<string>();
    this.members.forEach(member => memberKeys.add(member.key));
    const indicesToReuse = new Deque<number>();
    const mergedMembers = this.mergedMembers;
    for (const member of this.members) {
      const transecting = joints
        .filter(joint => Geometry.isPointOnSegment(joint, member.a, member.b))
        .sort((x, y) => Geometry.distanceSquared2DPoints(x, member.a) - Geometry.distanceSquared2DPoints(y, member.a));
      if (transecting.length === 0) {
        continue;
      }
      this.removedMembers.push(member);
      indicesToReuse.pushLeft(member.index);
      let a: Joint = member.a;
      transecting.forEach(b => {
        maybeMergeMember(a, b);
        a = b;
      });
      maybeMergeMember(a, member.b);

      function maybeMergeMember(a: Joint, b: Joint) {
        if (!memberKeys.has(Member.getJointsKey(a, b))) {
          const newMember = new Member(-1, a, b, member.material, member.shape);
          mergedMembers.push(newMember);
          memberKeys.add(newMember.key);
        }
      }
    }
    let nextIndex = this.members.length;
    this.mergedMembers.forEach(member => {
      if (member.index === -1) {
        member.index = indicesToReuse.length === 0 ? nextIndex++ : indicesToReuse.popRight()!;
      }
    });
    this.mergedMembers.sort((a, b) => a.index - b.index);
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
    joints: Joint | Joint[],
    members: Member[],
    selectedElements: SelectedElements,
  ): MemberSplitter {
    const splitter = new MemberSplitter(joints, members, selectedElements.selectedMembers);
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
