/* Copyright (c) 2025-2026 Gene Ressler
   SPDX-License-Identifier: GPL-3.0-or-later */

import { Injectable } from '@angular/core';
import { UndoManagerService } from '../../drafting/shared/undo-manager.service';
import { EventBrokerService } from '../../../shared/services/event-broker.service';
import { AnalysisService } from '../../../shared/services/analysis.service';
import { SessionStateService } from '../../session-state/session-state.service';
import { UndoManagerSessionStateService } from '../../drafting/shared/undo-manager-session-state.service';

/**
 * Container for logic that determines if the last bridge analysis is still valid for the current bridge.
 * The value changes during analysis completion and on edit command completion, so don't use this in
 * handlers of those events. Rehydration causes an analysis if the dehydrated one was valid. We ignore
 * the invalid analysis case, i.e. where there was an analysis for some other undo state.
 */
@Injectable({ providedIn: 'root' })
export class AnalysisValidityService {
  private currentAnalysisToken: any;
  private readonly undoManagerService: UndoManagerService;

  constructor(
    private readonly analysisService: AnalysisService,
    eventBrokerService: EventBrokerService,
    sessionStateService: SessionStateService,
    // Injected to ensure undo manager is already rehydrated.
    undoManagerSessionStateService: UndoManagerSessionStateService,
  ) {
    this.undoManagerService = undoManagerSessionStateService.undoManagerService;
    eventBrokerService.analysisCompletion.subscribe(() => this.recordAnalysisCompletion());
    eventBrokerService.loadBridgeRequest.subscribe(() => {
      this.currentAnalysisToken = undefined;
    });
    // Must follow subscription above for rehydration.
    sessionStateService.register(
      'analysisValidity.service',
      () => this.dehydrate(),
      state => this.rehydrate(state),
    );
  }

  public get isLastAnalysisValid(): boolean {
    return this.currentAnalysisToken === this.undoManagerService.stateToken;
  }

  /** Called just after analysis, records that current edit state of the bridge corresponds. */
  private recordAnalysisCompletion(): void {
    this.currentAnalysisToken = this.undoManagerService.stateToken;
  }

  private dehydrate(): State {
    return { isLastAnalysisValid: this.isLastAnalysisValid };
  }

  private rehydrate(state: State) {
    if (state.isLastAnalysisValid) {
      // Skip notify because it's too early for all handlers to work correctly.
      this.analysisService.analyzeQuietly({ populateBridgeMembers: true });
      this.recordAnalysisCompletion();
    }
  }
}

type State = { isLastAnalysisValid: boolean };
