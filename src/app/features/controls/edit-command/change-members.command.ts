import { BridgeModel } from '../../../shared/classes/bridge.model';
import { EditableUtility, EditCommand, EditEffect } from '../../../shared/classes/editing';
import { Member } from '../../../shared/classes/member.model';
import { InventoryService } from '../../../shared/services/inventory.service';
import { SelectedSet } from '../../drafting/shared/selected-elements-service';
import {
  ContextElementRef,
  RehydrationContext,
  DehydrationContext,
} from './dehydration-context';
import { EditCommandDescription } from './edit-command-description';
import { DehydratedEditCommand } from './dehydration-context';
import { EditCommandTag } from './dehydration-context';

export class ChangeMembersCommand extends EditCommand {
  public override readonly effectsMask: number = EditEffect.MEMBERS | EditEffect.CHANGE;

  private constructor(
    description: string,
    private readonly members: Member[],
    private readonly updatedMembers: Member[],
  ) {
    super(description);
  }

  /** Returns a command that updates selected items of the bridge members list to a new material. */
  public static forMemberMaterialsUpdate(members: Member[], updatedMembers: Member[]): ChangeMembersCommand {
    const description = EditCommandDescription.formatMemberMessage(members, 'Update material for member');
    return new ChangeMembersCommand(description, members, updatedMembers);
  }

  /** Returns a command that in/decrements the sizes of selected items of the bridge members list. */
  public static forMemberSizeIncrement(
    members: Member[],
    selected: SelectedSet,
    increment: number = 1,
  ): ChangeMembersCommand {
    const updatedMembers = [];
    for (const index of selected) {
      const member = members[index];
      const newShape = InventoryService.getShapeWithSizeIncrement(member.shape, increment);
      if (newShape !== member.shape) {
        updatedMembers.push(new Member(member.index, member.a, member.b, member.material, newShape));
      }
    }
    const action = increment > 0 ? 'Up' : 'Down';
    const description = EditCommandDescription.formatMemberMessage(members, `${action}-size member`);
    return new ChangeMembersCommand(description, members, updatedMembers);
  }

  public override do(): void {
    EditableUtility.exchangeAll(this.members, this.updatedMembers);
  }

  public override undo(): void {
    EditableUtility.exchangeAll(this.members, this.updatedMembers);
  }

  override dehydrate(context: DehydrationContext): State {
    return {
      tag: 'change-members',
      description: this.description,
      updatedMembers: this.updatedMembers.map(member => context.getMemberRef(member)),
    };
  }

  static rehydrate(
    context: RehydrationContext,
    rawState: DehydratedEditCommand,
    bridge: BridgeModel,
  ): ChangeMembersCommand {
    const state = rawState as State;
    return new ChangeMembersCommand(
      state.description,
      bridge.members,
      state.updatedMembers.map(member => context.rehydrateMemberRef(member)),
    );
  }
}

type State = {
  tag: EditCommandTag;
  description: string;
  updatedMembers: ContextElementRef[];
};
