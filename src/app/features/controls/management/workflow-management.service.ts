import { Injectable } from '@angular/core';
import { EventBrokerService, EventOrigin } from '../../../shared/services/event-broker.service';
import { AnalysisService, AnalysisStatus } from '../../../shared/services/analysis.service';
import { BridgeService } from '../../../shared/services/bridge.service';
import { SelectedElements, SelectedElementsService } from '../../drafting/services/selected-elements-service';
import { ChangeMembersCommand } from '../edit-command/change-members.command';
import { UndoManagerService } from '../../drafting/services/undo-manager.service';

/**
 * Container for the state of the user's design workflow and associated logic.
 * This includes brokered event handlers with no obvious owner otherwise.
 */
@Injectable({ providedIn: 'root' })
export class WorkflowManagementService {
  constructor(
    analysisService: AnalysisService,
    bridgeService: BridgeService,
    eventBrokerService: EventBrokerService,
    selectedElementsService: SelectedElementsService,
    undoManagerService: UndoManagerService,
  ) {
    // Alpha order by subject.
    eventBrokerService.analysisCompletion.subscribe(eventInfo => {
      const status = eventInfo.data as AnalysisStatus;
      if (status === AnalysisStatus.UNSTABLE) {
        eventBrokerService.unstableBridgeDialogOpenRequest.next({origin: EventOrigin.SERVICE});
      }
    });
    // TODO: If animation is disabled, set selector back to design immediately.
    eventBrokerService.designModeSelection.subscribe(eventInfo => {
      if (eventInfo.data === 1) { // Test mode.
        analysisService.analyze({ populateBridgeMembers: true });
      }
    });
    eventBrokerService.inventorySelectionComplete.subscribe(eventInfo => {
      const selectedMembers = selectedElementsService.selectedElements.selectedMembers;
      if (selectedMembers.size === 0) {
        return;
      }
      const changeMembersCommand = ChangeMembersCommand.forMemberMaterialsUpdate(
        bridgeService.bridge.members,
        selectedMembers,
        eventInfo.data.material,
        eventInfo.data.shape,
      );
      undoManagerService.do(changeMembersCommand);
    });
    eventBrokerService.memberSizeChangeRequest.subscribe(eventInfo => {
      const selectedMembers = selectedElementsService.selectedElements.selectedMembers;
      if (selectedMembers.size === 0) {
        return;
      }
      const changeMembersCommand = ChangeMembersCommand.forMemberSizeIncrement(
        bridgeService.bridge.members,
        selectedMembers,
        eventInfo.data
      );
      undoManagerService.do(changeMembersCommand);
    });
    eventBrokerService.selectedElementsChange.subscribe(eventInfo => {
      const selectedIndices = (eventInfo.data as SelectedElements).selectedMembers;
      const memberIndices = selectedIndices.size === 0 ? undefined : selectedIndices;
      eventBrokerService.loadInventorySelectorRequest.next({
        origin: EventOrigin.SERVICE,
        data: bridgeService.getMostCommonStockId(memberIndices),
      });
    });
  }
}
