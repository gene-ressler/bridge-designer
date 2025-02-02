import { Injectable } from '@angular/core';
import { EventBrokerService, EventOrigin } from '../../../shared/services/event-broker.service';
import { AnalysisService, AnalysisStatus } from '../../../shared/services/analysis.service';
import { BridgeService } from '../../../shared/services/bridge.service';
import { SelectedElementsService } from '../../drafting/services/selected-elements-service';
import { ChangeMembersCommand } from '../edit-command/change-members.command';
import { UndoManagerService } from '../../drafting/services/undo-manager.service';
import { UiStateService } from './ui-state.service';
import { AnalysisValidityService } from './analysis-validity.service';
import { AllowedShapeChangeMask } from '../../../shared/services/inventory.service';
import { EditEffect } from '../../../shared/classes/editing';

/**
 * Container for the state of the user's design workflow and associated logic.
 * Mostly handlers of brokered events having no obvious owner.
 */
@Injectable({ providedIn: 'root' })
export class WorkflowManagementService {
  constructor(
    analysisService: AnalysisService,
    analysisValidityService: AnalysisValidityService,
    bridgeService: BridgeService,
    eventBrokerService: EventBrokerService,
    selectedElementsService: SelectedElementsService,
    uiStateService: UiStateService,
    undoManagerService: UndoManagerService,
  ) {
    // Alpha order by subject.

    // Analysis completion.
    eventBrokerService.analysisCompletion.subscribe(eventInfo => {
      uiStateService.disable(eventBrokerService.analysisReportRequest, false);
      const status = eventInfo.data as AnalysisStatus;
      if (status === AnalysisStatus.UNSTABLE) {
        eventBrokerService.unstableBridgeDialogOpenRequest.next({ origin: EventOrigin.SERVICE });
      }
    });

    // Design mode selection: drafting or test.
    // TODO: If animation is disabled, set selector back to design immediately.
    eventBrokerService.designModeSelection.subscribe(eventInfo => {
      if (eventInfo.data === 1) {
        // Test mode.
        analysisService.analyze({ populateBridgeMembers: true });
      }
    });

    // Edit command completion.
    eventBrokerService.editCommandCompletion.subscribe(eventInfo => {
      uiStateService.disable(eventBrokerService.analysisReportRequest, !analysisValidityService.isLastAnalysisValid);
      uiStateService.disable(eventBrokerService.undoRequest, eventInfo.data.doneCount === 0);
      uiStateService.disable(eventBrokerService.redoRequest, eventInfo.data.undoneCount === 0);
      if (eventInfo.data.effectsMask & EditEffect.MEMBERS) {
        handleMemberChanges();
      }
    });

    // Inventory selection (by user) completion.
    eventBrokerService.inventorySelectionCompletion.subscribe(eventInfo => {
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

    // Load bridge completion.
    eventBrokerService.loadBridgeCompletion.subscribe(_eventInfo =>
      eventBrokerService.loadInventorySelectorRequest.next({
        origin: EventOrigin.SERVICE,
        data: bridgeService.getMostCommonStockId(),
      }),
    );

    // Member size change requests.
    eventBrokerService.memberSizeDecreaseRequest.subscribe(_eventInfo => handleMemberSizeChangeRequest(-1));
    eventBrokerService.memberSizeIncreaseRequest.subscribe(_eventInfo => handleMemberSizeChangeRequest(+1));

    // Selected elements change.
    eventBrokerService.selectedElementsChange.subscribe(_eventInfo => {
      const selectedMembers = selectedElementsService.selectedElements.selectedMembers;
      uiStateService.disable(eventBrokerService.deleteSelectionRequest, selectedMembers.size === 0);
      handleMemberChanges();
    });

    /** En/disables member size increment and adjusts the stock ID selector. */
    function handleMemberChanges(): void {
      const selectedMembers = selectedElementsService.selectedElements.selectedMembers;
      const allowedShapeChanges = bridgeService.getAllowedShapeChangeMask(selectedMembers);
      uiStateService.disable(
        eventBrokerService.memberSizeDecreaseRequest,
        (allowedShapeChanges & AllowedShapeChangeMask.DECREASE_SIZE) === 0,
      );
      uiStateService.disable(
        eventBrokerService.memberSizeIncreaseRequest,
        (allowedShapeChanges & AllowedShapeChangeMask.INCREASE_SIZE) === 0,
      );
      eventBrokerService.loadInventorySelectorRequest.next({
        origin: EventOrigin.SERVICE,
        data: bridgeService.getUsefulStockId(selectedMembers),
      });
    }

    /** Executes a member size change command with given increment. */
    function handleMemberSizeChangeRequest(increment: number) {
      const selectedMembers = selectedElementsService.selectedElements.selectedMembers;
      if (selectedMembers.size === 0) {
        return;
      }
      const changeMembersCommand = ChangeMembersCommand.forMemberSizeIncrement(
        bridgeService.bridge.members,
        selectedMembers,
        increment,
      );
      undoManagerService.do(changeMembersCommand);
    }
  }
}
