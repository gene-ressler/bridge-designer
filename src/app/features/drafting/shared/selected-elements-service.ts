/* Copyright (c) 2025-2026 Gene Ressler
   SPDX-License-Identifier: GPL-3.0-or-later */

import { Injectable } from '@angular/core';
import { BridgeModel } from '../../../shared/classes/bridge.model';
import { Joint } from '../../../shared/classes/joint.model';
import { Member } from '../../../shared/classes/member.model';
import { SessionStateService } from '../../session-state/session-state.service';

export type SelectedSet = Set<number>;

export type SelectedElements = {
  selectedJoints: SelectedSet; // Always zero or one joint. The set simplifies undo/redo.
  selectedMembers: SelectedSet;
};

/** Container for session key providable in non-root instances of the service. */
@Injectable({ providedIn: 'root' })
export class SelectedElementsServiceSessionStateKey {
  public readonly key: string | undefined = 'selected-elements.service';
}

/**
 * Container for the drafting panel's element selection and hot element.
 *
 * Selection should not be mutated directly. Use ElementSelectorService.
 */
@Injectable({ providedIn: 'root' })
export class SelectedElementsService {
  public readonly selectedElements: SelectedElements = {
    selectedJoints: new Set<number>(),
    selectedMembers: new Set<number>(),
  };

  constructor(sessionStateKey: SelectedElementsServiceSessionStateKey, sessionStateService: SessionStateService) {
    sessionStateService.register(
      sessionStateKey.key,
      () => this.dehydrate(),
      state => this.rehydrate(state),
    );
  }

  public getSelectedJoint(bridge: BridgeModel): Joint | undefined {
    if (this.selectedElements.selectedJoints.size === 0) {
      return undefined;
    }
    for (const jointIndex of this.selectedElements.selectedJoints) {
      return bridge.joints[jointIndex];
    }
    return undefined; // never reached
  }

  public get isSelectionEmpty(): boolean {
    return this.selectedElements.selectedJoints.size === 0 && this.selectedElements.selectedMembers.size === 0;
  }

  public isJointSelected(joint: Joint): boolean {
    return this.selectedElements.selectedJoints.has(joint.index);
  }

  public isMemberSelected(member: Member): boolean {
    return this.selectedElements.selectedMembers.has(member.index);
  }

  public selectJoint(index: number, toggle: boolean = false) {
    if (!toggle || !this.selectedElements.selectedJoints.delete(index)) {
      this.selectedElements.selectedJoints.add(index);
    }
  }

  public selectMember(index: number, toggle: boolean = false) {
    if (!toggle || !this.selectedElements.selectedMembers.delete(index)) {
      this.selectedElements.selectedMembers.add(index);
    }
  }

  dehydrate(): State {
    const elements = this.selectedElements;
    return {
      selectedJoints: Array.from(elements.selectedJoints),
      selectedMembers: Array.from(elements.selectedMembers),
    };
  }

  rehydrate(state: State): void {
    const elements = this.selectedElements;
    state.selectedJoints.forEach(index => elements.selectedJoints.add(index));
    state.selectedMembers.forEach(index => elements.selectedMembers.add(index));
  }
}

type State = {
  selectedJoints: number[];
  selectedMembers: number[];
};
