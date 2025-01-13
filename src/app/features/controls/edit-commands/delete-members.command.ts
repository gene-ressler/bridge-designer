import { BridgeModel } from '../../../shared/classes/bridge.model';
import { EditableUtility, EditCommand } from '../../../shared/classes/editing';
import { Joint } from '../../../shared/classes/joint.model';
import { Member } from '../../../shared/classes/member.model';
import { BridgeService } from '../../../shared/services/bridge.service';
import { SelectedElements } from '../../drafting/services/selected-elements-service';

export class DeleteMembersCommand extends EditCommand {
  private constructor(
    private readonly members: Member[],
    private readonly joints: Joint[],
    private readonly bridge: BridgeModel,
    private readonly selectedElements: SelectedElements,
  ) {
    const description =
      members.length == 1
        ? `Delete member, joint ${members[0].a.number} to ${members[0].b.number}`
        : `Delete ${members.length} members`;
    super(description);
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

  public override do(): void {
    EditableUtility.remove(this.bridge.members, this.members, this.selectedElements.selectedMembers);
    EditableUtility.remove(this.bridge.joints, this.joints, this.selectedElements.selectedJoints);
  }

  public override undo(): void {
    EditableUtility.merge(this.bridge.joints, this.joints, this.selectedElements.selectedJoints);
    EditableUtility.merge(this.bridge.members, this.members, this.selectedElements.selectedMembers);
  }
}
