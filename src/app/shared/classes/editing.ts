/* Copyright (c) 2025-2026 Gene Ressler
   SPDX-License-Identifier: GPL-3.0-or-later */

import { DehydratedEditCommand } from '../../features/controls/edit-command/dehydration-context';
import { DehydrationContext as EditCommandDehydrationContext } from '../../features/controls/edit-command/dehydration-context';

export interface Editable {
  index: number;
  swapContents(other: Editable): void;
}

export const enum EditEffect {
  NONE = 0,
  JOINTS = 0x1,
  LABELS = 0x2,
  MEMBERS = 0x4,
  ADD = 0x8,
  CHANGE = 0x10,
}

export abstract class EditCommand {
  constructor(private _description: string) {}

  abstract readonly effectsMask: number;
  abstract dehydrate(context: EditCommandDehydrationContext): DehydratedEditCommand;

  public get description(): string {
    return this._description;
  }

  protected set description(value: string) {
    this._description = value;
  }

  public do(): void {}
  public undo(): void {}
}

export class EditCommandPlaceholder extends EditCommand {
  override readonly effectsMask: number = EditEffect.NONE;
  override dehydrate(_context: EditCommandDehydrationContext): DehydratedEditCommand {
    return { tag: 'placeholder' };
  }
}

/** Operations applicable to editable lists. */
export class EditableUtility {
  /**
   * Merges a list of new Editables into a mutable target list. The list must have indexes in
   * ascending order (not checked). These are used to place the new items. The target is re-indexed.
   * The selected index set is also adjusted to the new numbering. 
   */
  public static merge<T extends Editable>(tgt: T[], src: T[], selected: Set<number>): void {
    let iTgtSrc: number = tgt.length - 1;
    tgt.length += src.length;
    let iTgtDst: number = tgt.length - 1;
    for (let iSrc = src.length - 1; iSrc >= 0; --iSrc) {
      while (iTgtDst > src[iSrc].index) {
        EditableUtility.adjustSelected(selected, iTgtSrc, iTgtDst);
        tgt[iTgtSrc].index = iTgtDst;
        tgt[iTgtDst--] = tgt[iTgtSrc--];
      }
      selected.delete(iTgtDst);
      tgt[iTgtDst--] = src[iSrc];
    }
  }

  /** Removes a given subsequence from a mutable target list of Editables. The target is re-indexed. */
  public static remove<T extends Editable>(tgt: T[], subseq: T[], selected: Set<number>): void {
    let iTgtSrc: number = 0;
    let iTgtDst: number = 0;
    for (let iSubseq = 0; iSubseq < subseq.length; iSubseq++) {
      while (iTgtSrc < subseq[iSubseq].index) {
        EditableUtility.adjustSelected(selected, iTgtSrc, iTgtDst);
        tgt[iTgtSrc].index = iTgtDst;
        tgt[iTgtDst++] = tgt[iTgtSrc++];
      }
      selected.delete(iTgtSrc);
      subseq[iSubseq] = tgt[iTgtSrc++];
    }
    while (iTgtSrc < tgt.length) {
      EditableUtility.adjustSelected(selected, iTgtSrc, iTgtDst);
      tgt[iTgtSrc].index = iTgtDst;
      tgt[iTgtDst++] = tgt[iTgtSrc++];
    }
    tgt.length -= subseq.length;
  }

  private static adjustSelected(selected: Set<number>, iTgtSrc: number, iTgtDst: number): void {
    if (iTgtDst === iTgtSrc) {
      return;
    }
    if (selected.has(iTgtSrc)) {
      selected.delete(iTgtSrc);
      selected.add(iTgtDst);
    }
  }

  /** Swap contents of the given source item and the same-indexed item in the given target vector. */
  public static exchange<T extends Editable>(tgt: T[], src: T): void {
    src.swapContents(tgt[src.index]);
  }

  /** Swap contents of the given source items and the same-indexed items in the given target vector. */
  public static exchangeAll<T extends Editable>(tgt: T[], src: T[]): void {
    src.forEach(item => this.exchange(tgt, item));
  }
}
