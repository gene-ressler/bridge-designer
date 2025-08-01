import { Injectable } from '@angular/core';
import { EventBrokerService } from '../../shared/services/event-broker.service';
import { UndoManagerService } from '../drafting/shared/undo-manager.service';

/** A container for the bit that reflects whether the current design needs saving. */
@Injectable({ providedIn: 'root' })
export class SaveMarkService {
  private savedMark: any = UndoManagerService.NO_EDIT_COMMAND;
  // TODO: Dehydrate/rehydrate the name.
  private _fileName: string | undefined;

  constructor(
    eventBrokerService: EventBrokerService,
    private readonly undoManagerService: UndoManagerService,
  ) {
    const reset = () => {
      this.savedMark = this.undoManagerService.stateToken;
    }
    // Reset the saved bit for current undo state. It's un-set by any edit wrt this one.
    eventBrokerService.loadBridgeCompletion.subscribe(reset);
    // Rehydrate.
    eventBrokerService.sessionStateRestoreCompletion.subscribe(reset);
  }

  /** Returns whether the current design is changed since last save. */
  public get isDesignUnsaved(): boolean {
    return this.undoManagerService.stateToken !== this.savedMark;
  }

  /** Returns file name at last save mark even if the current design is unsaved. */
  public get savedFileName(): string | undefined {
    return this._fileName;
  }

  /** Marks the current bridge design as consitent with a save set file: saved, freshly loaded or new. */
  public markDesignSaved(fileName: string): void {
    this.savedMark = this.undoManagerService.stateToken;
    this._fileName = fileName;
  }
}
