import { Injectable } from '@angular/core';
import { Deque } from '../../../shared/classes/deque';
import { EditCommand } from '../../../shared/classes/editing';
import { EventBrokerService, EventInfo, EventOrigin } from '../../../shared/services/event-broker.service';

@Injectable({ providedIn: 'root' })
export class UndoManagerService {
  private static readonly MAX_DONE_COUNT: number = 1000;

  public readonly done: Deque<EditCommand> = new Deque<EditCommand>();
  public readonly undone: Deque<EditCommand> = new Deque<EditCommand>();

  constructor(private readonly eventBrokerService: EventBrokerService) { 
    eventBrokerService.undoRequest.subscribe((eventInfo: EventInfo) => this.undo(eventInfo.data));
    eventBrokerService.redoRequest.subscribe((eventInfo: EventInfo) => this.redo(eventInfo.data));
  }

  public do(editCommand: EditCommand): void {
    editCommand.do();
    this.done.pushLeft(editCommand);
    if (this.done.length > UndoManagerService.MAX_DONE_COUNT) {
      this.done.popRight();
    }
    this.undone.clear();
    this.emitStateChange();
  }

  private undo(count: number = 1): void {
    while (count-- > 0) {
      const editCommand = this.done.popLeft();
      if (!editCommand) {
        return;
      }
      editCommand.undo();
      this.undone.pushLeft(editCommand);
      this.emitStateChange();
    }
  }

  private redo(count: number = 1): void {
    while (count-- > 0) {
      const editCommand = this.undone.popLeft();
      if (!editCommand) {
        return;
      }
      editCommand.do();
      this.done.pushRight(editCommand);
      this.emitStateChange();
    }
  }

  private emitStateChange(): void {
    this.eventBrokerService.undoManagerStateChange.next(
      {
        source: EventOrigin.SERVICE,
        data: {
          doneCount: this.done.length,
          undoneCount: this.undone.length,
        }
      });
  }
}
