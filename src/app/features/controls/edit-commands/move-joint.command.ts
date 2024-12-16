import { BridgeModel } from '../../../shared/classes/bridge.model';
import { EditCommand } from '../../../shared/classes/editing';
import { Point2DInterface } from '../../../shared/classes/graphics';
import { Joint } from '../../../shared/classes/joint.model';
import { SelectedElements } from '../../drafting/services/selected-elements-service';
import { MemberSplitter } from './member-splitter';

export class MoveJointCommand extends EditCommand {
  private memberSplitter: MemberSplitter;
  private readonly toJoint: Joint;

  constructor(
    private readonly joint: Joint,
    toLocation: Point2DInterface,
    private readonly bridge: BridgeModel,
    private readonly selectedElements: SelectedElements,
  ) {
    super(`Move joint to (${joint.x}, ${joint.y})`);
    this.toJoint = new Joint(joint.index, toLocation.x, toLocation.y, false);
    this.memberSplitter= new MemberSplitter(
      this.joint,
      this.bridge.members,
      this.selectedElements.selectedMembers,
    );
  }

  public override do(): void {
    this.bridge.joints[this.toJoint.index].swapContents(this.toJoint);
    this.memberSplitter.do();
  }

  public override undo(): void {
    this.memberSplitter.undo();
  }
}
