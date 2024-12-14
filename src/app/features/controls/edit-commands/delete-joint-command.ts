import { BridgeModel } from '../../../shared/classes/bridge.model';
import { EditableUtility, EditCommand } from '../../../shared/classes/editing';
import { Joint } from '../../../shared/classes/joint.model';
import { Member } from '../../../shared/classes/member.model';
import {
  SelectedElements,
  SelectableBridge,
} from '../../drafting/services/selected-elements-service';

export class DeleteJointCommand extends EditCommand {
  private readonly joint: Joint[]; // List of one joint.
  private readonly members: Member[];

  constructor(joint: Joint, bridge: BridgeModel, selectedElements: SelectedElements) {
    super(`Delete joint at (${joint.x}, ${joint.y})`, {
      bridge,
      selectedElements,
    });
    this.joint = [joint];
    this.members = bridge.members.filter(member => member.hasJoint(joint));
  }

  public override do(): void {
    const { bridge, selectedElements }: SelectableBridge = this.context;
    EditableUtility.remove(bridge.members, this.members, selectedElements.selectedMembers);
    EditableUtility.remove(bridge.joints, this.joint, selectedElements.selectedJoints);
  }

  public override undo(): void {
    const { bridge, selectedElements }: SelectableBridge = this.context;
    EditableUtility.merge(bridge.joints, this.joint, selectedElements.selectedJoints);
    EditableUtility.merge(bridge.members, this.members, selectedElements.selectedMembers);
  }
}
