import { BridgeModel } from '../../../shared/classes/bridge.model';
import { EditableUtility, EditCommand, EditEffect } from '../../../shared/classes/editing';
import { Geometry } from '../../../shared/classes/graphics';
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

export class AddMemberCommand extends EditCommand {
  private members: Member[] = [];
  public override readonly effectsMask: number = EditEffect.MEMBERS;

  /** Constructs an add member command object. Even the description is empty because there are variants. */
  private constructor(
    private readonly bridge: BridgeModel,
    private readonly selectedElements: SelectedElements,
  ) {
    super('');
  }

  public static create(member: Member, bridge: BridgeModel, selectedElements: SelectedElements): AddMemberCommand {
    const command = new AddMemberCommand(bridge, selectedElements);
    const transecting = bridge.joints
      .filter(joint => Geometry.isPointOnSegment(joint, member.a, member.b))
      .sort((x, y) => Geometry.distanceSquared2DPoints(x, member.a) - Geometry.distanceSquared2DPoints(y, member.a));
    // Handle the most common case without copying.
    if (transecting.length === 0) {
      command.description = `Add member, joint ${member.a.number} to ${member.b.number}`;
      command.members.push(member);
      return command;
    }
    command.description = `Add ${transecting.length + 1} members, joint ${member.a.number} to ${member.b.number}`;
    let a: Joint = member.a;
    transecting.forEach(b => {
      if (!bridge.members.some(member => member.hasJoints(a, b))) {
        command.members.push(new Member(-1, a, b, member.material, member.shape));
      }
      a = b;
    });
    command.members.push(new Member(-1, a, member.b, member.material, member.shape));
    return command;
  }

  // TODO: Handle too many members.
  // TODO: Handle member intersecting pier.
  public override do(): void {
    this.members.forEach((member, index) => (member.index = index + this.bridge.members.length));
    EditableUtility.merge(this.bridge.members, this.members, this.selectedElements.selectedMembers);
  }

  public override undo(): void {
    EditableUtility.remove(this.bridge.members, this.members, this.selectedElements.selectedMembers);
  }

  override dehydrate(context: DehydrationContext): State {
    return {
      tag: 'add-member',
      description: this.description,
      members: this.members.map(member => context.getMemberRef(member)),
    };
  }

  static rehydrate(
    context: RehydrationContext,
    rawState: DehydratedEditCommand,
    bridge: BridgeModel,
    selectedElements: SelectedElements,
  ): AddMemberCommand {
    const state = rawState as State;
    const command = new AddMemberCommand(bridge, selectedElements);
    command.description = state.description;
    state.members.forEach(member => command.members.push(context.rehydrateMemberRef(member)));
    return command;
  }
}

type State = {
  tag: EditCommandTag;
  description: string;
  members: ContextElementRef[];
};
