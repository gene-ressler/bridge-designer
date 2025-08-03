import { EditCommand, EditEffect } from '../../../shared/classes/editing';
import { DraftingPanelState } from '../../../shared/services/persistence.service';
import { DehydrationContext } from './dehydration-context';
import { DehydratedEditCommand } from './dehydration-context';
import { EditCommandTag } from './dehydration-context';

export class MoveLabelsCommand extends EditCommand {
  public override readonly effectsMask: number = EditEffect.LABELS | EditEffect.CHANGE;

  constructor(
    private readonly draftingPanelState: DraftingPanelState,
    private readonly yFrom: number,
    private readonly yTo: number,
  ) {
    super(`Move labels to height ${yTo.toFixed(2)}`);
  }

  public override do(): void {
    this.draftingPanelState.yLabels = this.yTo;
  }

  public override undo(): void {
    this.draftingPanelState.yLabels = this.yFrom;
  }

  override dehydrate(_context: DehydrationContext): State {
    return {
      tag: 'move-labels',
      yFrom: this.yFrom,
      yTo: this.yTo,
    };
  }

  static rehydrate(rawState: DehydratedEditCommand, draftingPanelState: DraftingPanelState): MoveLabelsCommand {
    const state = rawState as State;
    return new MoveLabelsCommand(draftingPanelState, state.yFrom, state.yTo);
  }
}

type State = {
  tag: EditCommandTag;
  yFrom: number;
  yTo: number;
};
