import { Injectable } from '@angular/core';
import { UndoManagerService } from '../../drafting/shared/undo-manager.service';
import { EventBrokerService } from '../../../shared/services/event-broker.service';

/**
 * Container for logic that determines if the last bridge analysis is still valid for the current bridge.
 * Changes during analysis completion and maybe on edit command completion. Should  not be used in handlers
 * of those events.
 */
@Injectable({ providedIn: 'root' })
export class AnalysisValidityService {
  private currentAnalysisToken: any;

  constructor(
    eventBrokerService: EventBrokerService,
    private readonly undoManagerService: UndoManagerService,
  ) {
    eventBrokerService.analysisCompletion.subscribe(_eventInfo => {
      this.currentAnalysisToken = undoManagerService.mostRecentlyDone;
    });
  }

  public get isLastAnalysisValid(): boolean {
    return this.currentAnalysisToken === this.undoManagerService.mostRecentlyDone;
  }
}
