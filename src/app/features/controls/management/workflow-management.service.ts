import { Injectable } from '@angular/core';
import { EventBrokerService } from '../../../shared/services/event-broker.service';
import { AnalysisService } from '../../../shared/services/analysis.service';

/** Container for the state of the user's design workflow and associated logic. */
@Injectable({ providedIn: 'root' })
export class WorkflowManagementService {
  constructor(analysisService: AnalysisService, eventBrokerService: EventBrokerService) {
    eventBrokerService.designModeSelection.subscribe(eventInfo => {
      if (eventInfo.data === 1) {
        // Analysis mode/animation
        analysisService.analyze({ populateBridgeMembers: true });
      }
    });
  }
}
