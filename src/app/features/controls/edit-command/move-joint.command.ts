import { BridgeModel } from '../../../shared/classes/bridge.model';
import { EditCommand, EditEffect } from '../../../shared/classes/editing';
import { Point2DInterface } from '../../../shared/classes/graphics';
import { Joint } from '../../../shared/classes/joint.model';
import { SelectedElements } from '../../drafting/shared/selected-elements-service';
import {
  ContextElementRef,
  RehydrationContext,
  DehydrationContext,
} from './dehydration-context';
import { MemberSplitter, DehydratedMemberSplitter } from './member-splitter';
import { DehydratedEditCommand } from './dehydration-context';
import { EditCommandTag } from './dehydration-context';

export class MoveJointCommand extends EditCommand {
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
      MemberSplitter.create(joint, bridge.members, selectedElements.selectedMembers),
    );
  }

  override get effectsMask(): number {
    return this.memberSplitter.hasSplit ? EditEffect.MEMBERS | EditEffect.JOINTS : EditEffect.JOINTS;
  }

  // TODO: Handle member intersecting peir.
  public override do(): void {
    this.bridge.joints[this.toJoint.index].swapContents(this.toJoint);
    this.memberSplitter.do();
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
      MemberSplitter.rehydrate(context, state.splitter, toJoint, bridge, selectedElements),
    );
  }
}

type State = {
  tag: EditCommandTag;
  joint: ContextElementRef;
  toJoint: ContextElementRef;
  splitter: DehydratedMemberSplitter;
};
