import { BridgeModel } from '../../../shared/classes/bridge.model';
import { EditableUtility, EditCommand } from '../../../shared/classes/editing';
import { Geometry } from '../../../shared/classes/graphics';
import { Joint } from '../../../shared/classes/joint.model';
import { Member } from '../../../shared/classes/member.model';
import { SelectedElements } from '../../drafting/services/selected-elements-service';

export class AddMemberCommand extends EditCommand {
  private members: Member[] = [];

  constructor(
    member: Member,
    private readonly bridge: BridgeModel,
    private readonly elementSelection: SelectedElements,
  ) {
    super(`Add member, joint ${member.a.number} to ${member.b.number}`);
    const transecting = bridge.joints
      .filter(joint => Geometry.isPointOnSegment(joint, member.a, member.b))
      .sort((x, y) => Geometry.distanceSquared2DPoints(x, member.a) - Geometry.distanceSquared2DPoints(y, member.a));
    // Handle the most common case without copying.
    if (transecting.length === 0) {
      this.members.push(member);
      return;
    }
    this.description = `Add ${transecting.length + 1} members, joint ${member.a.number} to ${member.b.number}`;
    let a: Joint = member.a;
    transecting.forEach(b => {
      if (!bridge.members.some(member => member.hasJoints(a, b))) {
        this.members.push(new Member(-1, a, b, member.material, member.shape));
      }
      a = b;
    });
    this.members.push(new Member(-1, a, member.b, member.material, member.shape));
  }

  // TODO: Handle too many members.
  // TODO: Handle member intersecting pier.
  public override do(): void {
    this.members.forEach((member, index) => (member.index = index + this.bridge.members.length));
    EditableUtility.merge(this.bridge.members, this.members, this.elementSelection.selectedMembers);
  }

  public override undo(): void {
    EditableUtility.remove(this.bridge.members, this.members, this.elementSelection.selectedMembers);
  }
}
