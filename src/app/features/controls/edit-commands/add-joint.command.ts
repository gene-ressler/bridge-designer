import { BridgeModel } from '../../../shared/classes/bridge.model';
import { EditableUtility, EditCommand } from '../../../shared/classes/editing';
import { Joint } from '../../../shared/classes/joint.model';
import { SelectedElements, SelectableBridge } from '../../drafting/services/selected-elements-service';
import { MemberSplitter } from './member-splitter';

export class AddJointCommand extends EditCommand {
  private memberSplitter?: MemberSplitter;

  constructor(
    private readonly joint: Joint,
    private readonly bridge: BridgeModel,
    private readonly selectedElements: SelectedElements,
  ) {
    super(`Add joint at (${joint.x}, ${joint.y})`);
  }

  // TODO: Handle too many joints.
  public override do(): void {
    this.joint.index = this.bridge.joints.length; // Append.
    EditableUtility.merge(this.bridge.joints, [this.joint], this.selectedElements.selectedJoints);
    this.memberSplitter ||= new MemberSplitter(
      this.joint,
      this.bridge.members,
      this.selectedElements.selectedMembers,
    );
    this.memberSplitter.do();
  }

  public override undo(): void {
    this.memberSplitter!.undo();
    EditableUtility.remove(this.bridge.joints, [this.joint], this.selectedElements.selectedJoints);
  }
}
