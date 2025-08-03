import { Injectable } from '@angular/core';
import { EventBrokerService } from '../../shared/services/event-broker.service';
import { UndoManagerService, UndoStateToken } from '../drafting/shared/undo-manager.service';
import { SessionStateService } from '../../shared/services/session-state.service';
import { UndoManagerSessionStateService } from '../drafting/shared/undo-manager-session-state.service';

/** A container for the bit that reflects whether the current design needs saving. */
@Injectable({ providedIn: 'root' })
export class SaveMarkService {
  private savedMark: UndoStateToken = UndoManagerService.NO_EDIT_COMMAND;
  private _fileName: string | undefined;
  private readonly undoManagerService;

  constructor(
    eventBrokerService: EventBrokerService,
    sessionStateService: SessionStateService,
    // Injected to ensure undo manager is already rehydrated.
    undoManagerSessionStateService: UndoManagerSessionStateService,
  ) {
    this.undoManagerService = undoManagerSessionStateService.undoManagerService;
    eventBrokerService.loadBridgeCompletion.subscribe(() => {
      this.savedMark = UndoManagerService.NO_EDIT_COMMAND;
      this._fileName = undefined;
    });
    sessionStateService.register(
      'savemark.service',
      () => this.dehydrate(),
      state => this.rehydrate(state),
    );
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
    document.title = fileName.replace(/\.bdc$/, '');
  }

  dehydrate(): State {
    return {
      stateTokenIndex: this.undoManagerService.findStateTokenIndex(this.savedMark),
      fileName: this._fileName,
    };
  }

  rehydrate(state: State): void {
    if (state.stateTokenIndex !== undefined) {
      const token = this.undoManagerService.getStateToken(state.stateTokenIndex);
      this.savedMark = token ?? UndoManagerService.NO_EDIT_COMMAND;
    }
    this._fileName = state.fileName;
    if (state.fileName !== undefined) {
      document.title = state.fileName;
    }
  }
}

type State = {
  stateTokenIndex: number | undefined;
  fileName: string | undefined;
};
