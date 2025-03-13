import { BridgeModel } from '../../../shared/classes/bridge.model';
import { EditableUtility, EditCommand, EditEffect } from '../../../shared/classes/editing';
import { Joint } from '../../../shared/classes/joint.model';
import { Member } from '../../../shared/classes/member.model';
import { SelectedElements } from '../../drafting/shared/selected-elements-service';
import {
  ContextElementRef,
  RehydrationContext,
  DehydrationContext,
} from './dehydration-context';
import { DehydratedEditCommand } from './dehydration-context';
import { EditCommandTag } from './dehydration-context';

export class DeleteJointCommand extends EditCommand {
  private readonly joint: Joint[]; // List of one joint.
  private readonly members: Member[];

  constructor(
    joint: Joint,
    private readonly bridge: BridgeModel,
    private readonly selectedElements: SelectedElements,
  ) {
    super(`Delete joint at (${joint.x}, ${joint.y})`);
    this.joint = [joint];
    this.members = bridge.members.filter(member => member.hasJoint(joint));
  }

  override get effectsMask(): number {
    return this.members.length > 0 ? EditEffect.JOINTS | EditEffect.MEMBERS : EditEffect.JOINTS;
  }

  public override do(): void {
    EditableUtility.remove(this.bridge.members, this.members, this.selectedElements.selectedMembers);
    EditableUtility.remove(this.bridge.joints, this.joint, this.selectedElements.selectedJoints);
  }

  public override undo(): void {
    EditableUtility.merge(this.bridge.joints, this.joint, this.selectedElements.selectedJoints);
    EditableUtility.merge(this.bridge.members, this.members, this.selectedElements.selectedMembers);
  }

  override dehydrate(context: DehydrationContext): State {
    return {
      tag: 'delete-joint',
      joint: context.getJointRef(this.joint[0]),
      members: this.members.map(member => context.getMemberRef(member)),
    };
  }

  static rehydrate(
    context: RehydrationContext,
    rawState: DehydratedEditCommand,
    bridge: BridgeModel,
    selectedElements: SelectedElements,
  ): DeleteJointCommand {
    const state = rawState as State;
    const command = new DeleteJointCommand(context.rehydrateJointRef(state.joint), bridge, selectedElements);
    state.members.forEach(member => command.members.push(context.rehydrateMemberRef(member)));
    return command;
  }
}

type State = {
  tag: EditCommandTag;
  joint: ContextElementRef;
  members: ContextElementRef[];
};
