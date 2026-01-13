/* Copyright (c) 2025-2026 Gene Ressler
   SPDX-License-Identifier: GPL-3.0-or-later */

import { Injectable } from '@angular/core';
import { UndoManagerService } from './undo-manager.service';
import { SessionStateService } from '../../session-state/session-state.service';
import { EditCommand, EditCommandPlaceholder } from '../../../shared/classes/editing';
import { BridgeService } from '../../../shared/services/bridge.service';
import { AddJointCommand } from '../../controls/edit-command/add-joint.command';
import { DehydratedEditCommand } from '../../controls/edit-command/dehydration-context';
import { SelectedElementsService } from './selected-elements-service';
import { AddMemberCommand } from '../../controls/edit-command/add-member.command';
import { ChangeMembersCommand } from '../../controls/edit-command/change-members.command';
import { DeleteJointCommand } from '../../controls/edit-command/delete-joint.command';
import { MoveJointCommand } from '../../controls/edit-command/move-joint.command';
import { MoveLabelsCommand } from '../../controls/edit-command/move-labels.command';
import { DeleteMembersCommand } from '../../controls/edit-command/delete-members.command';
import {
  DehydratedDehydrationContext,
  DehydrationContext,
  RehydrationContext,
} from '../../controls/edit-command/dehydration-context';
import { InventoryService } from '../../../shared/services/inventory.service';
import { Utility } from '../../../shared/classes/utility';

/** Logic for dehydrating and rehdrating the undo manager. Keeps it free of knowledge about commands and bridges. */
@Injectable({ providedIn: 'root' })
export class UndoManagerSessionStateService {
  constructor(
    private readonly bridgeService: BridgeService,
    private readonly inventoryService: InventoryService,
    private readonly selectedElementsService: SelectedElementsService,
    sessionStateService: SessionStateService,
    /** 
     * The session's undo manager. Rehydrators that need undo manager rehydrated  first can 
     * inject this service and use this attribute rather than injecting undo manager directly.
     */
    public readonly undoManagerService: UndoManagerService,
  ) {
    sessionStateService.register(
      'undoManager.service',
      () => this.dehydrate(),
      state => this.rehydrate(state),
    );
  }

  /** From given dehydrated state, returns a rehydrated edit command. Factory pattern. */
  private rehydrateEditCommand(context: RehydrationContext, editCommand: DehydratedEditCommand): EditCommand {
    switch (editCommand.tag) {
      case 'add-joint':
        return AddJointCommand.rehydrate(
          context,
          editCommand,
          this.bridgeService.bridge,
          this.selectedElementsService.selectedElements,
        );
      case 'add-member':
        return AddMemberCommand.rehydrate(
          context,
          editCommand,
          this.bridgeService.bridge,
          this.selectedElementsService.selectedElements,
        );
      case 'change-members':
        return ChangeMembersCommand.rehydrate(context, editCommand, this.bridgeService.bridge);
      case 'delete-joint':
        return DeleteJointCommand.rehydrate(
          context,
          editCommand,
          this.bridgeService.bridge,
          this.selectedElementsService.selectedElements,
        );
      case 'delete-members':
        return DeleteMembersCommand.rehydrate(
          context,
          editCommand,
          this.bridgeService.bridge,
          this.selectedElementsService.selectedElements,
        );
      case 'move-joint':
        return MoveJointCommand.rehydrate(
          context,
          editCommand,
          this.bridgeService.bridge,
          this.selectedElementsService.selectedElements,
        );
      case 'move-labels':
        return MoveLabelsCommand.rehydrate(editCommand, this.bridgeService.draftingPanelState);
      case 'placeholder':
        return new EditCommandPlaceholder('Cancel');
      default:
        return Utility.assertNever(editCommand.tag);
    }
  }

  dehydrate(): State {
    const dehydrationContext = DehydrationContext.forBridge(this.bridgeService.bridge);
    const done = this.undoManagerService.done.map(command => command.dehydrate(dehydrationContext));
    const undone = this.undoManagerService.undone.map(command => command.dehydrate(dehydrationContext));
    const context = dehydrationContext.dehydrate();
    return { context, done, undone };
  }

  rehydrate(state: State): void {
    const context = RehydrationContext.create(state.context, this.bridgeService.bridge, this.inventoryService);
    const undoManager = this.undoManagerService;
    state.done.forEach(editCommand => undoManager.done.pushRight(this.rehydrateEditCommand(context, editCommand)));
    state.undone.forEach(editCommand => undoManager.undone.pushRight(this.rehydrateEditCommand(context, editCommand)));
  }
}

type State = {
  context: DehydratedDehydrationContext;
  done: DehydratedEditCommand[];
  undone: DehydratedEditCommand[];
};
