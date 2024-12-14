import { BridgeModel } from '../../../shared/classes/bridge.model';
import { EditableUtility, EditCommand } from '../../../shared/classes/editing';
import { Joint } from '../../../shared/classes/joint.model';
import {
  SelectedElements,
  SelectableBridge,
} from '../../drafting/services/selected-elements-service';
import { MemberSplitter } from './member-splitter';

export class AddJointCommand extends EditCommand {
  private memberSplitter?: MemberSplitter;

  constructor(
    private readonly joint: Joint,
    bridge: BridgeModel,
    selectedElements: SelectedElements,
  ) {
    super(`Add joint at (${joint.x}, ${joint.y})`, {
      bridge,
      selectedElements,
    });
  }

  public override do(): void {
    const { bridge, selectedElements }: SelectableBridge = this.context;
    this.joint.index = bridge.joints.length; // Append.
    EditableUtility.merge(bridge.joints, [this.joint], selectedElements.selectedJoints);
    this.memberSplitter ||= new MemberSplitter(this.joint, this.joint, bridge.members);
    this.memberSplitter.do(bridge.members, selectedElements.selectedMembers);
  }

  public override undo(): void {
    const { bridge, selectedElements }: SelectableBridge = this.context;
    if (!this.memberSplitter) {
      throw new Error('undo add joint before do');
    }
    this.memberSplitter.undo(bridge.members, selectedElements.selectedMembers);
    EditableUtility.remove(bridge.joints, [this.joint], selectedElements.selectedJoints);
  }
}
