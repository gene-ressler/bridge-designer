import { BridgeModel } from '../../../shared/classes/bridge.model';
import { EditableUtility, EditCommand, EditEffect } from '../../../shared/classes/editing';
import { Joint } from '../../../shared/classes/joint.model';
import { SelectedElements } from '../../drafting/shared/selected-elements-service';
import { DehydratedEditCommand } from './dehydration-context';
import { EditCommandTag } from './dehydration-context';
import { MemberSplitter, DehydratedMemberSplitter } from './member-splitter';
import { Utility } from '../../../shared/classes/utility';
import {
  ContextElementRef,
  RehydrationContext,
  DehydrationContext,
} from './dehydration-context';

export class AddJointCommand extends EditCommand {
  private constructor(
    private readonly joint: Joint,
    private readonly bridge: BridgeModel,
    private readonly selectedElements: SelectedElements,
    private readonly memberSplitter: MemberSplitter,
  ) {
    super(`Add joint at (${joint.x}, ${joint.y})`);
  }

  public static create(joint: Joint, bridge: BridgeModel, selectedElements: SelectedElements): AddJointCommand {
    return new AddJointCommand(
      joint,
      bridge,
      selectedElements,
      MemberSplitter.create(joint, bridge.members, selectedElements.selectedMembers),
    );
  }

  /** Returns what's affected by this command. Valid only after do(). */
  override get effectsMask(): number {
    return this.memberSplitter.hasSplit ? EditEffect.MEMBERS | EditEffect.JOINTS : EditEffect.JOINTS;
  }

  // TODO: Handle too many joints.
  public override do(): void {
    this.joint.index = this.bridge.joints.length; // Append.
    EditableUtility.merge(this.bridge.joints, [this.joint], this.selectedElements.selectedJoints);
    this.memberSplitter.do();
  }

  public override undo(): void {
    this.memberSplitter!.undo();
    EditableUtility.remove(this.bridge.joints, [this.joint], this.selectedElements.selectedJoints);
  }

  override dehydrate(context: DehydrationContext): State {
    const splitter = Utility.assertNotUndefined(this.memberSplitter);
    return {
      tag: 'add-joint',
      jointRef: context.getJointRef(this.joint),
      splitter: splitter.dehydrate(context),
    };
  }

  static rehydrate(
    context: RehydrationContext,
    rawState: DehydratedEditCommand,
    bridge: BridgeModel,
    selectedElements: SelectedElements,
  ): AddJointCommand {
    const state = rawState as State;
    const joint = context.rehydrateJointRef(state.jointRef);
    return new AddJointCommand(
      joint,
      bridge,
      selectedElements,
      MemberSplitter.rehydrate(context, state.splitter, joint, bridge, selectedElements),
    );
  }
}

type State = {
  tag: EditCommandTag;
  jointRef: ContextElementRef;
  splitter: DehydratedMemberSplitter;
};
