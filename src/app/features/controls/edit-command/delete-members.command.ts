import { BridgeModel } from '../../../shared/classes/bridge.model';
import { EditableUtility, EditCommand, EditEffect } from '../../../shared/classes/editing';
import { Joint } from '../../../shared/classes/joint.model';
import { Member } from '../../../shared/classes/member.model';
import { BridgeService } from '../../../shared/services/bridge.service';
import { SelectedElements } from '../../drafting/shared/selected-elements-service';
import { ContextElementRef, RehydrationContext, DehydrationContext } from './dehydration-context';
import { EditCommandDescription } from './edit-command-description';
import { DehydratedEditCommand } from './dehydration-context';
import { EditCommandTag } from './dehydration-context';

export class DeleteMembersCommand extends EditCommand {
  private constructor(
    private readonly members: Member[],
    private readonly joints: Joint[],
    private readonly bridge: BridgeModel,
    private readonly selectedElements: SelectedElements,
  ) {
    super(EditCommandDescription.formatMemberMessage(members, 'Delete member'));
  }

  public static forMember(
    member: Member,
    bridge: BridgeModel,
    selectedElements: SelectedElements,
  ): DeleteMembersCommand {
    return new DeleteMembersCommand([member], [], bridge, selectedElements);
  }

  public static forSelectedMembers(
    selectedElements: SelectedElements,
    bridgeService: BridgeService,
  ): DeleteMembersCommand {
    const bridge = bridgeService.bridge;
    const members = Array.from(selectedElements.selectedMembers)
      .sort((a, b) => a - b)
      .map(i => bridge.members[i]);
    const joints = bridgeService.getJointsForMembersDeletion(selectedElements.selectedMembers);
    return new DeleteMembersCommand(members, joints, bridge, selectedElements);
  }

  override get effectsMask(): number {
    return this.joints.length > 0 ? EditEffect.MEMBERS | EditEffect.JOINTS : EditEffect.MEMBERS;
  }

  public override do(): void {
    EditableUtility.remove(this.bridge.members, this.members, this.selectedElements.selectedMembers);
    EditableUtility.remove(this.bridge.joints, this.joints, this.selectedElements.selectedJoints);
  }

  public override undo(): void {
    EditableUtility.merge(this.bridge.joints, this.joints, this.selectedElements.selectedJoints);
    EditableUtility.merge(this.bridge.members, this.members, this.selectedElements.selectedMembers);
  }

  override dehydrate(context: DehydrationContext): State {
    return {
      tag: 'delete-members',
      members: this.members.map(member => context.getMemberRef(member)),
      joints: this.joints.map(joint => context.getJointRef(joint)),
    };
  }

  static rehydrate(
    context: RehydrationContext,
    rawState: DehydratedEditCommand,
    bridge: BridgeModel,
    selectedElements: SelectedElements,
  ): DeleteMembersCommand {
    const state = rawState as State;
    const members = state.members.map(member => context.rehydrateMemberRef(member));
    const joints = state.joints.map(joint => context.rehydrateJointRef(joint));
    return new DeleteMembersCommand(members, joints, bridge, selectedElements);
  }
}

type State = {
  tag: EditCommandTag;
  members: ContextElementRef[];
  joints: ContextElementRef[];
};
