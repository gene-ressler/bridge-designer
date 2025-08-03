import { Injectable } from '@angular/core';
import { Deque } from '../../../shared/core/deque';
import { EditCommand, EditCommandPlaceholder } from '../../../shared/classes/editing';
import { EventBrokerService, EventOrigin } from '../../../shared/services/event-broker.service';

export type EditCommandCompletionInfo = {
  kind: 'do' | 'undo' | 'redo';
  effectsMask: number;
  doneCount: number;
  undoneCount: number;
};

export interface UndoStateToken {}

@Injectable({ providedIn: 'root' })
export class UndoManagerService {
  public static readonly NO_EDIT_COMMAND = new EditCommandPlaceholder('[no edit command]');
  private static readonly MAX_DONE_COUNT: number = 1000;

  public readonly done: Deque<EditCommand> = new Deque<EditCommand>();
  public readonly undone: Deque<EditCommand> = new Deque<EditCommand>();

  constructor(private readonly eventBrokerService: EventBrokerService) {
    eventBrokerService.undoRequest.subscribe(eventInfo => this.undo(eventInfo.data));
    eventBrokerService.redoRequest.subscribe(eventInfo => this.redo(eventInfo.data));
    eventBrokerService.loadBridgeRequest.subscribe(() => this.clear());
  }

  /** Does the given command and adds it to the undo buffer. */
  public do(editCommand: EditCommand): void {
    editCommand.do();
    this.done.pushLeft(editCommand);
    while (this.done.length > UndoManagerService.MAX_DONE_COUNT) {
      this.done.popRight(); // In practice, only executes once.
    }
    this.undone.clear();
    this.emitCommandCompletion('do', editCommand.effectsMask);
  }

  /** Returns the command most recently done. Usable as a state token. */
  public get stateToken(): UndoStateToken {
    return this.done.peekLeft() || UndoManagerService.NO_EDIT_COMMAND;
  }

  /** Return an index identifying the given state token in the undo/redo buffer. */
  public findStateTokenIndex(token: UndoStateToken): number | undefined {
    const commands = this.done.copyTo([]);
    const doneIndex = commands.indexOf(token as EditCommand);
    if (doneIndex >= 0) {
      return doneIndex;
    }
    this.undone.copyTo(commands);
    const undoneIndex = commands.indexOf(token as EditCommand);
    if (undoneIndex >= 0) {
      return -1 - undoneIndex;
    }
    return undefined;
  }

  /** Use index from `getStateToken` to fetch the corresponding state token in the current undo/redo buffer. */
  public getStateToken(index: number): UndoStateToken | undefined {
    if (index >= 0) {
      const commands = this.done.copyTo([]);
      return commands[index];
    }
    const commands = this.undone.copyTo([]);
    return commands[-1 - index];
  }

  undo(count: number = 1): void {
    let effectsMask: number = 0;
    while (count-- > 0) {
      const editCommand = this.done.popLeft();
      if (!editCommand) {
        return;
      }
      editCommand.undo();
      effectsMask |= editCommand.effectsMask;
      this.undone.pushLeft(editCommand);
    }
    this.emitCommandCompletion('undo', effectsMask);
  }

  redo(count: number = 1): void {
    let effectsMask: number = 0;
    while (count-- > 0) {
      const editCommand = this.undone.popLeft();
      if (!editCommand) {
        return;
      }
      editCommand.do();
      effectsMask |= editCommand.effectsMask;
      this.done.pushLeft(editCommand);
    }
    this.emitCommandCompletion('redo', effectsMask);
  }

  private emitCommandCompletion(kind: 'do' | 'undo' | 'redo', effectsMask: number): void {
    this.eventBrokerService.editCommandCompletion.next({
      origin: EventOrigin.SERVICE,
      data: {
        kind,
        effectsMask,
        doneCount: this.done.length,
        undoneCount: this.undone.length,
      },
    });
  }

  clear(): void {
    this.done.clear();
    this.undone.clear();
  }
}
