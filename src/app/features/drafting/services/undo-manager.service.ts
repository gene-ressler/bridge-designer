import { Injectable } from '@angular/core';
import { Deque } from '../../../shared/core/deque';
import { EditCommand } from '../../../shared/classes/editing';
import { EventBrokerService, EventOrigin } from '../../../shared/services/event-broker.service';

@Injectable({ providedIn: 'root' })
export class UndoManagerService {
  private static readonly MAX_DONE_COUNT: number = 1000;

  public readonly done: Deque<EditCommand> = new Deque<EditCommand>();
  public readonly undone: Deque<EditCommand> = new Deque<EditCommand>();

  constructor(private readonly eventBrokerService: EventBrokerService) {
    eventBrokerService.undoRequest.subscribe(info => this.undo(info.data));
    eventBrokerService.redoRequest.subscribe(info => this.redo(info.data));
    eventBrokerService.loadBridgeRequest.subscribe(_info => this.clear());
  }

  public do(editCommand: EditCommand): void {
    editCommand.do();
    this.done.pushLeft(editCommand);
    while (this.done.length > UndoManagerService.MAX_DONE_COUNT) {
      this.done.popRight(); // In practice, only executes once.
    }
    this.undone.clear();
    this.emitCommandCompletion(editCommand.effectsMask);
  }

  /** Returns the command most recently done. Usable as a state token. */
  public get mostRecentlyDone(): EditCommand | undefined {
    return this.done.peekLeft();
  }

  private undo(count: number = 1): void {
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
    this.emitCommandCompletion(effectsMask);
  }

  private redo(count: number = 1): void {
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
    this.emitCommandCompletion(effectsMask);
  }

  private emitCommandCompletion(effectsMask: number): void {
    this.eventBrokerService.editCommandCompletion.next({
      origin: EventOrigin.SERVICE,
      data: {
        effectsMask,
        doneCount: this.done.length,
        undoneCount: this.undone.length,
      },
    });
  }

  private clear(): void {
    this.done.clear();
    this.undone.clear();
  }
}
