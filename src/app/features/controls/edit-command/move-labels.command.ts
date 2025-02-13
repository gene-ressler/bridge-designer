import { EditCommand, EditEffect } from '../../../shared/classes/editing';
import { DraftingPanelState } from '../../../shared/services/persistence.service';

export class MoveLabelsCommand extends EditCommand {
  constructor(
    private readonly draftingPanelState: DraftingPanelState,
    private readonly yFrom: number,
    private readonly yTo: number,
  ) {
    super(`Move labels to height ${yTo.toFixed(1)}`);
  }

  override get effectsMask(): number {
    return EditEffect.LABELS;
  }

  public override do(): void {
    this.draftingPanelState.yLabels = this.yTo;
  }

  public override undo(): void {
    this.draftingPanelState.yLabels = this.yFrom;
  }
}
