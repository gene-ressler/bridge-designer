import { Injectable } from '@angular/core';
import { EventBrokerService, EventOrigin } from '../../../shared/services/event-broker.service';
import { AnalysisService, AnalysisStatus } from '../../../shared/services/analysis.service';
import { BridgeService } from '../../../shared/services/bridge.service';
import { SelectedElementsService } from '../../drafting/shared/selected-elements-service';
import { ChangeMembersCommand } from '../edit-command/change-members.command';
import { UndoManagerService } from '../../drafting/shared/undo-manager.service';
import { UiStateService } from './ui-state.service';
import { AnalysisValidityService } from './analysis-validity.service';
import { AllowedShapeChangeMask, InventoryService, StockId } from '../../../shared/services/inventory.service';
import { EditEffect } from '../../../shared/classes/editing';
import { Member } from '../../../shared/classes/member.model';

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
      let isValidTestResult = false;
      if (eventInfo.data === AnalysisStatus.UNSTABLE) {
        eventBrokerService.unstableBridgeDialogOpenRequest.next({ origin: EventOrigin.SERVICE });
      } else if (eventInfo.data === AnalysisStatus.FAILS_SLENDERNESS) {
        eventBrokerService.slendernessFailDialogOpenRequest.next({ origin: EventOrigin.SERVICE });
      } else {
        isValidTestResult = true;
      }
      uiStateService.disable(eventBrokerService.analysisReportRequest, !isValidTestResult);
    });

    // Design iterations change.
    eventBrokerService.designIterationChange.subscribe(eventInfo => {
      uiStateService.disable(eventBrokerService.designIterationBackRequest, eventInfo.data.inProgressIndex <= 0);
      uiStateService.disable(
        eventBrokerService.designIterationForwardRequest,
        eventInfo.data.inProgressIndex >= eventInfo.data.iterationCount - 1,
      );
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
        disableMemberSizeIncrementWidgets();
        const selectedMembers = selectedElementsService.selectedElements.selectedMembers;
        eventBrokerService.loadInventorySelectorRequest.next({
          origin: EventOrigin.SERVICE,
          data: bridgeService.getUsefulStockId(selectedMembers),
        });
      }
    });

    // Inventory selection (by user) completion.
    eventBrokerService.inventorySelectionCompletion.subscribe(eventInfo => {
      const selectedMembers = selectedElementsService.selectedElements.selectedMembers;
      if (selectedMembers.size === 0) {
        return;
      }
      // Stock ID can be partial, so merge populated fields with each selected member.
      const stockId: StockId = eventInfo.data.stockId;
      const members = bridgeService.bridge.members;
      const updatedMembers: Member[] = [];
      for (const index of selectedMembers) {
        const member = members[index];
        const { material, shape } = InventoryService.mergeStockId(stockId, member.material, member.shape);
        updatedMembers.push(new Member(member.index, member.a, member.b, material, shape));
      }
      const changeMembersCommand = ChangeMembersCommand.forMemberMaterialsUpdate(members, updatedMembers);
      undoManagerService.do(changeMembersCommand);
    });

    // Load bridge completion.
    eventBrokerService.loadBridgeCompletion.subscribe(_eventInfo => {
      uiStateService.disable(eventBrokerService.undoRequest);
      uiStateService.disable(eventBrokerService.redoRequest);
      eventBrokerService.loadInventorySelectorRequest.next({
        origin: EventOrigin.SERVICE,
        data: bridgeService.getMostCommonStockId(),
      });
    });

    // Member size change requests.
    eventBrokerService.memberSizeDecreaseRequest.subscribe(_eventInfo => handleMemberSizeChangeRequest(-1));
    eventBrokerService.memberSizeIncreaseRequest.subscribe(_eventInfo => handleMemberSizeChangeRequest(+1));

    // Selected elements change.
    eventBrokerService.selectedElementsChange.subscribe(_eventInfo => {
      const selectedMembers = selectedElementsService.selectedElements.selectedMembers;
      const selectedJoints = selectedElementsService.selectedElements.selectedJoints;
      eventBrokerService.loadInventorySelectorRequest.next({
        origin: EventOrigin.SERVICE,
        data: bridgeService.getUsefulStockId(selectedMembers),
      });
      uiStateService.disable(
        eventBrokerService.deleteSelectionRequest,
        selectedMembers.size === 0 && selectedJoints.size === 0,
      );
      disableMemberSizeIncrementWidgets();
    });

    // Session state restoration completion.
    eventBrokerService.sessionStateRestoreCompletion.subscribe(_eventInfo => {
      uiStateService.disable(eventBrokerService.undoRequest, undoManagerService.done.length === 0);
      uiStateService.disable(eventBrokerService.redoRequest, undoManagerService.undone.length === 0);
    });

    /** En/disables member size increment. */
    function disableMemberSizeIncrementWidgets(): void {
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
