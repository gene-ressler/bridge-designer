import { Injectable } from '@angular/core';
import { EventBrokerService, EventOrigin } from '../../../shared/services/event-broker.service';
import { AnalysisService, AnalysisStatus } from '../../../shared/services/analysis.service';
import { BridgeService } from '../../../shared/services/bridge.service';
import { SelectedElementsService } from '../../drafting/shared/selected-elements-service';
import { ChangeMembersCommand } from '../edit-command/change-members.command';
import { UndoManagerService } from '../../drafting/shared/undo-manager.service';
import { UiMode, UiStateService } from './ui-state.service';
import { AnalysisValidityService } from './analysis-validity.service';
import { AllowedShapeChangeMask, InventoryService, StockId } from '../../../shared/services/inventory.service';
import { EditEffect } from '../../../shared/classes/editing';
import { Member } from '../../../shared/classes/member.model';
import { DesignConditionsService } from '../../../shared/services/design-conditions.service';
import { BridgeAutoFixService } from '../../../shared/services/bridge-auto-fix.service';
import { CursorMode } from '../../drafting/cursor-overlay/cursor-overlay.component';
import { InventorySelectionService } from '../../../shared/services/inventory-selection.service';

/**
 * Container for the state of the user's design workflow and associated logic.
 * Mostly handlers of brokered events having no obvious owner.
 */
@Injectable({ providedIn: 'root' })
export class WorkflowManagementService {
  constructor(
    analysisService: AnalysisService,
    analysisValidityService: AnalysisValidityService,
    bridgeAutoFixServicce: BridgeAutoFixService,
    bridgeService: BridgeService,
    eventBrokerService: EventBrokerService,
    inventorySelectionService: InventorySelectionService,
    selectedElementsService: SelectedElementsService,
    uiStateService: UiStateService,
    undoManagerService: UndoManagerService,
  ) {
    let showAnimation: boolean = true;
    let autoFix: boolean = true;

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
      if (isValidTestResult && showAnimation) {
        eventBrokerService.uiModeRequest.next({ origin: EventOrigin.SERVICE, data: 'animation' });
      } else {
        // Toggle the design mode back to the drafting panel with no change to UI mode.
        setTimeout(() => eventBrokerService.designModeSelection.next({ origin: EventOrigin.SERVICE, data: 0 }));
      }
    });

    // Animation option to show or not.
    eventBrokerService.animationToggle.subscribe(eventInfo => {
      showAnimation = eventInfo.data;
    });

    // Auto-fix option to fix or not.
    eventBrokerService.autoCorrectToggle.subscribe(eventInfo => {
      autoFix = eventInfo.data;
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
    eventBrokerService.designModeSelection.subscribe(eventInfo => {
      switch (eventInfo.data) {
        case 0: // drafting
          eventBrokerService.uiModeRequest.next({ origin: EventOrigin.SERVICE, data: 'drafting' });
          break;
        case 1: // test
          if (autoFix) {
            bridgeAutoFixServicce.autoFix();
          }
          analysisService.analyze({ populateBridgeMembers: true });
          break;
      }
    });

    // Edit command completion.
    eventBrokerService.editCommandCompletion.subscribe(eventInfo => {
      uiStateService.disable(eventBrokerService.analysisReportRequest, !analysisValidityService.isLastAnalysisValid);
      uiStateService.disable(eventBrokerService.undoRequest, eventInfo.data.doneCount === 0);
      uiStateService.disable(eventBrokerService.redoRequest, eventInfo.data.undoneCount === 0);
      // Update the inventory selector only if members have been changed (not added).
      const membersChange = EditEffect.MEMBERS | EditEffect.CHANGE;
      if ((eventInfo.data.effectsMask & membersChange) === membersChange) {
        disableMemberSizeIncrementWidgets();
        const selectedMembers = selectedElementsService.selectedElements.selectedMembers;
        eventBrokerService.loadInventorySelectorRequest.next({
          origin: EventOrigin.SERVICE,
          data: bridgeService.getUsefulStockId(selectedMembers),
        });
      }
    });

    // Edit mode change.
    eventBrokerService.editModeChange.subscribe(eventInfo => {
      // Complete the inventory selector if one more more stock selection items are undefined.
      if (eventInfo.data == CursorMode.MEMBERS && !inventorySelectionService.isValid) {
        eventBrokerService.loadInventorySelectorRequest.next({
          origin: EventOrigin.SERVICE,
          data: bridgeService.getMostCommonStockId(),
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
      eventBrokerService.uiModeRequest.next({ origin: EventOrigin.SERVICE, data: 'drafting' });
      eventBrokerService.editModeSelection.next({ origin: EventOrigin.SERVICE, data: CursorMode.JOINTS });
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
      // Let the material selector alone if nothing is selected.
      if (selectedMembers.size > 0) {
        eventBrokerService.loadInventorySelectorRequest.next({
          origin: EventOrigin.SERVICE,
          data: bridgeService.getUsefulStockId(selectedMembers),
        });
      }
      const selectedJoints = selectedElementsService.selectedElements.selectedJoints;
      uiStateService.disable(
        eventBrokerService.deleteSelectionRequest,
        selectedMembers.size === 0 && selectedJoints.size === 0,
      );
      disableMemberSizeIncrementWidgets();
    });

    // Session state restoration completion.
    eventBrokerService.sessionStateRestoreCompletion.subscribe(_eventInfo => {
      const uiMode: UiMode =
        bridgeService.designConditions === DesignConditionsService.PLACEHOLDER_CONDITIONS ? 'initial' : 'drafting';
      eventBrokerService.uiModeRequest.next({
        origin: EventOrigin.APP,
        data: uiMode,
      });
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
