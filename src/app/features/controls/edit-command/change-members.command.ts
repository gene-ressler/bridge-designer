import { EditableUtility, EditCommand, EditEffect } from '../../../shared/classes/editing';
import { Member } from '../../../shared/classes/member.model';
import { InventoryService, Material, Shape } from '../../../shared/services/inventory.service';
import { SelectedSet } from '../../drafting/services/selected-elements-service';

export class ChangeMembersCommand extends EditCommand {
  private constructor(
    description: string,
    private readonly members: Member[],
    private readonly updatedMembers: Member[],
  ) {
    super(description);
  }

  override get effectsMask(): number {
    return EditEffect.MEMBERS;
  }

  /** Returns a command that updates selected items of the bridge members list to a new material. */
  public static forMemberMaterialsUpdate(members: Member[], selected: SelectedSet, material: Material, shape: Shape): ChangeMembersCommand {
    const updatedMembers = [];
    for (const index of selected) {
      const member = members[index];
      updatedMembers.push(new Member(member.index, member.a, member.b, material, shape));
    }
    return new ChangeMembersCommand(`Update selected member material`, members, updatedMembers);
  }

  /** Returns a command that in/decrements the sizes of selected items of the bridge members list. */
  public static forMemberSizeIncrement(members: Member[], selected: SelectedSet, increment: number = 1): ChangeMembersCommand {
    const updatedMembers = [];
    for (const index of selected) {
      const member = members[index];
      const newShape = InventoryService.getShapeWithSizeIncrement(member.shape, increment);
      if (newShape !== member.shape) {
        updatedMembers.push(new Member(member.index, member.a, member.b, member.material, newShape));
      }
    }
    return new ChangeMembersCommand(`${increment > 0 ? 'Increment' : 'Decrement'} selected member sizes`, members, updatedMembers);
  }

  public override do(): void {
    EditableUtility.exchangeAll(this.members, this.updatedMembers);
  }

  public override undo(): void {
    EditableUtility.exchangeAll(this.members, this.updatedMembers);
  }
}
