import { BridgeModel } from '../../../shared/classes/bridge.model';
import { EditableUtility, EditCommand } from '../../../shared/classes/editing';
import { Geometry } from '../../../shared/classes/graphics';
import { Joint } from '../../../shared/classes/joint.model';
import { Member } from '../../../shared/classes/member.model';
import {
  SelectedElements,
  SelectableBridge,
} from '../../drafting/services/selected-elements-service';

export class AddMemberCommand extends EditCommand {
  private members: Member[] = [];

  constructor(member: Member, bridge: BridgeModel, elementSelection: SelectedElements) {
    const transecting = bridge.joints
      .filter(joint => Geometry.isPointOnSegment(joint, member.a, member.b))
      .sort(
        (x, y) =>
          Geometry.distanceSquared2DPoints(x, member.a) -
          Geometry.distanceSquared2DPoints(y, member.a),
      );
    const context: SelectableBridge = { bridge, selectedElements: elementSelection };
    // Handle the most common case without copying.
    if (transecting.length === 0) {
      super(`Add member, joint ${member.a.number} to ${member.b.number}`, context);
      this.members.push(member);
      return;
    }
    super(
      `Add ${transecting.length + 1} members, joint ${member.a.number} to ${member.b.number}`,
      context,
    );
    var a: Joint = member.a;
    transecting.forEach(b => {
      if (!bridge.members.some(member => member.hasJoints(a, b))) {
        this.members.push(new Member(-1, a, b, member.material, member.shape));
      }
      a = b;
    });
    this.members.push(new Member(-1, a, member.b, member.material, member.shape));
  }

  public override do(): void {
    const { bridge, selectedElements: elementSelection }: SelectableBridge = this.context;
    this.members.forEach((member, index) => (member.index = index + bridge.members.length));
    EditableUtility.merge(bridge.members, this.members, elementSelection.selectedMembers);
  }

  public override undo(): void {
    const { bridge, selectedElements: elementSelection }: SelectableBridge = this.context;
    EditableUtility.remove(bridge.members, this.members, elementSelection.selectedMembers);
  }
}
