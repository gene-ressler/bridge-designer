import { Injectable } from '@angular/core';
import { EventBrokerService } from '../../shared/services/event-broker.service';
import { UndoManagerService } from '../drafting/shared/undo-manager.service';

@Injectable({ providedIn: 'root' })
export class SaveMarkService {
  private savedMark: any;

  constructor(
    eventBrokerService: EventBrokerService,
    private readonly undoManagerService: UndoManagerService,
  ) {
    eventBrokerService.loadBridgeCompletion.subscribe(_eventInfo => this.markSave());
    eventBrokerService.sessionStateRestoreCompletion.subscribe(_eventInfo => this.markSave());
  }

  public get isUnsaved(): boolean {
    return this.undoManagerService.stateToken !== this.savedMark;
  }

  private markSave(): void {
    this.savedMark = this.undoManagerService.stateToken;
  }
}
