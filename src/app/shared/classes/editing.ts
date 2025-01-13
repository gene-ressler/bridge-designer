export interface Editable {
  index: number;
  swapContents(other: Editable): void;
}

export class EditCommand {
  constructor(private _description: string) {}

  public get description(): string {
    return this._description;
  }

  protected set description(value: string) {
    this._description = value;
  }

  public do(): void {}
  public undo(): void {}
}

export class EditableUtility {
  /**
   * Merges a list of new Editables into a mutable target list. The list must have indexes in
   * ascending order (not checked). These are used to place the new items. The target is re-indexed.
   * The selected index set, if given, is also adjusted to the new numbering. (It can be safely omitted
   * if merging at the end of the target.)
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

  /** Swap the contents of the given item with the contents of the same-index item in the given vector. */
  public static exchange<T extends Editable>(tgt: T[], src: T): void {
    src.swapContents(tgt[src.index]);
  }

  /** Swap the contents of the given items with the contents of the same-index items in the given vector. */
  public static exchangeAll<T extends Editable>(tgt: T[], src: T[]): void {
    src.forEach(item => this.exchange(tgt, item));
  }
}
