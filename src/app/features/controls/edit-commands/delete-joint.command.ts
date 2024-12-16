import { BridgeModel } from '../../../shared/classes/bridge.model';
import { EditableUtility, EditCommand } from '../../../shared/classes/editing';
import { Joint } from '../../../shared/classes/joint.model';
import { Member } from '../../../shared/classes/member.model';
import { SelectedElements } from '../../drafting/services/selected-elements-service';

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

  public override do(): void {
    EditableUtility.remove(this.bridge.members, this.members, this.selectedElements.selectedMembers);
    EditableUtility.remove(this.bridge.joints, this.joint, this.selectedElements.selectedJoints);
  }

  public override undo(): void {
    EditableUtility.merge(this.bridge.joints, this.joint, this.selectedElements.selectedJoints);
    EditableUtility.merge(this.bridge.members, this.members, this.selectedElements.selectedMembers);
  }
}
