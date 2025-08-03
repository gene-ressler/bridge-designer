import { BridgeModel } from '../../../shared/classes/bridge.model';
import { EditCommand, EditEffect } from '../../../shared/classes/editing';
import { Point2DInterface } from '../../../shared/classes/graphics';
import { Joint } from '../../../shared/classes/joint.model';
import { SelectedElements } from '../../drafting/shared/selected-elements-service';
import { ContextElementRef, RehydrationContext, DehydrationContext } from './dehydration-context';
import { MemberSplitter, DehydratedMemberSplitter } from './member-splitter';
import { DehydratedEditCommand } from './dehydration-context';
import { EditCommandTag } from './dehydration-context';

export class MoveJointCommand extends EditCommand {
  private _effectsMask: number = NaN;

  private constructor(
    private readonly joint: Joint,
    private readonly toJoint: Joint,
    private readonly bridge: BridgeModel,
    private readonly memberSplitter: MemberSplitter,
  ) {
    super(`Move joint to (${toJoint.x}, ${toJoint.y})`);
  }

  public static create(
    joint: Joint,
    newLocation: Point2DInterface,
    bridge: BridgeModel,
    selectedElements: SelectedElements,
  ): MoveJointCommand {
    return new MoveJointCommand(
      joint,
      new Joint(joint.index, newLocation.x, newLocation.y, false),
      bridge,
      MemberSplitter.createForMove(bridge.joints, bridge.members, selectedElements.selectedMembers),
    );
  }

  override get effectsMask(): number {
    if (isNaN(this._effectsMask)) {
      this._effectsMask =
        this.memberSplitter.hasSplit || this.bridge.members.some(member => member.hasJoint(this.joint))
          ? EditEffect.JOINTS | EditEffect.MEMBERS | EditEffect.CHANGE
          : EditEffect.JOINTS | EditEffect.CHANGE;
    }
    return this._effectsMask;
  }

  public override do(): void {
    // Move the joint.
    const bridgeJoint = this.bridge.joints[this.toJoint.index];
    const toJoint = this.toJoint;
    bridgeJoint.swapContents(toJoint);
    // Split, but undo the move if splitting fails (e.g. for too many members).
    try {
      this.memberSplitter.do();
    } catch (error) {
      bridgeJoint.swapContents(toJoint);
      throw error;
    }
  }

  public override undo(): void {
    this.memberSplitter.undo();
    this.bridge.joints[this.toJoint.index].swapContents(this.toJoint);
  }

  override dehydrate(context: DehydrationContext): State {
    return {
      tag: 'move-joint',
      joint: context.getJointRef(this.joint),
      toJoint: context.getJointRef(this.toJoint),
      splitter: this.memberSplitter.dehydrate(context),
    };
  }

  static rehydrate(
    context: RehydrationContext,
    rawState: DehydratedEditCommand,
    bridge: BridgeModel,
    selectedElements: SelectedElements,
  ): MoveJointCommand {
    const state = rawState as State;
    const toJoint = context.rehydrateJointRef(state.toJoint);
    return new MoveJointCommand(
      context.rehydrateJointRef(state.joint),
      toJoint,
      bridge,
      MemberSplitter.rehydrate(context, state.splitter, bridge.joints, bridge.members, selectedElements),
    );
  }
}

type State = {
  tag: EditCommandTag;
  joint: ContextElementRef;
  toJoint: ContextElementRef;
  splitter: DehydratedMemberSplitter;
};
