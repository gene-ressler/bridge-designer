/* Copyright (c) 2025-2026 Gene Ressler
   SPDX-License-Identifier: GPL-3.0-or-later */

import { Injectable } from '@angular/core';
import { Rectangle2D } from '../../../shared/classes/graphics';
import { Joint } from '../../../shared/classes/joint.model';
import { Utility } from '../../../shared/classes/utility';
import { BridgeService } from '../../../shared/services/bridge.service';
import { EventBrokerService, EventOrigin } from '../../../shared/services/event-broker.service';
import { ViewportTransform2D } from '../../../shared/services/viewport-transform.service';
import { HotElementService } from './hot-element.service';
import { SelectedElementsService } from './selected-elements-service';
import { Member } from '../../../shared/classes/member.model';

export type SelectionStash = { joints: number[]; members: number[] };

/** Algorithms for selecting bridge elements. */
@Injectable({ providedIn: 'root' })
export class ElementSelectorService {
  constructor(
    private readonly selectedElementsService: SelectedElementsService,
    private readonly bridgeService: BridgeService,
    private readonly hotElementService: HotElementService,
    private readonly eventBrokerService: EventBrokerService,
    private readonly viewportTransform: ViewportTransform2D,
  ) {
    eventBrokerService.selectAllRequest.subscribe(_eventInfo => this.selectAllMembers(_eventInfo.data));
    eventBrokerService.selectNoneRequest.subscribe(eventInfo => this.clear(eventInfo.origin));
    // If there was a rehydrated selection, update the UI.
    eventBrokerService.sessionStateRestoreCompletion.subscribe(() => {
      const selectedElements = this.selectedElementsService.selectedElements;
      if (selectedElements.selectedMembers.size + selectedElements.selectedJoints.size > 0) {
        this.sendSelectedElementsChange(EventOrigin.SERVICE);
      }
    });
  }

  private readonly worldCursor = Rectangle2D.createEmpty();

  /** Updates selected elements based on the given cursor rectangle in viewport coordinates. */
  public select(cursor: Rectangle2D, extend: boolean, origin: EventOrigin): void {
    const selectedElements = this.selectedElementsService.selectedElements;
    const selectedJoints = Array.from(selectedElements.selectedJoints);
    const selectedMembers = Array.from(selectedElements.selectedMembers);
    selectedElements.selectedJoints.clear();
    if (!extend) {
      selectedElements.selectedMembers.clear();
    }
    if (cursor.width === 0 && cursor.height === 0) {
      this.doPointSelection(extend);
    } else {
      this.doAreaSelection(cursor);
    }
    if (
      !Utility.setContainsExactly(selectedElements.selectedJoints, selectedJoints) ||
      !Utility.setContainsExactly(selectedElements.selectedMembers, selectedMembers)
    ) {
      this.sendSelectedElementsChange(origin);
    }
  }

  private selectAllMembers(origin: EventOrigin): void {
    const memberCount = this.bridgeService.bridge.members.length;
    const selectedMembers = this.selectedElementsService.selectedElements.selectedMembers;
    if (selectedMembers.size === memberCount) {
      return;
    }
    for (let i = 0; i < memberCount; ++i) {
      selectedMembers.add(i);
    }
    this.sendSelectedElementsChange(origin);
  }

  public clear(origin: EventOrigin): void {
    const selectedElements = this.selectedElementsService.selectedElements;
    if (selectedElements.selectedMembers.size + selectedElements.selectedJoints.size === 0) {
      return;
    }
    selectedElements.selectedMembers.clear();
    selectedElements.selectedJoints.clear();
    this.sendSelectedElementsChange(origin);
  }

  public selectJoint(joint: Joint, origin: EventOrigin): void {
    const selectedElements = this.selectedElementsService.selectedElements;
    if (selectedElements.selectedJoints.has(joint.index)) {
      return;
    }
    selectedElements.selectedJoints.clear();
    selectedElements.selectedJoints.add(joint.index);
    selectedElements.selectedMembers.clear();
    this.sendSelectedElementsChange(origin);
  }

  public setSelectedMembers(indexes: number[], origin: EventOrigin): void {
    this.selectedElementsService.selectedElements.selectedJoints.clear();
    const selectedMembers = this.selectedElementsService.selectedElements.selectedMembers;
    if (indexes.length === selectedMembers.size && indexes.every(index => selectedMembers.has(index))) {
      return;
    }
    selectedMembers.clear();
    indexes.forEach(index => selectedMembers.add(index));
    this.sendSelectedElementsChange(origin);
  }

  /** Returns a representation of the current selection and clears it. */
  public stashSelection(origin: EventOrigin): SelectionStash {
    const wasSelected: SelectionStash = { joints: [], members: [] };
    const selectedElements = this.selectedElementsService.selectedElements;

    wasSelected.joints.push(...selectedElements.selectedJoints);
    wasSelected.members.push(...selectedElements.selectedMembers);

    selectedElements.selectedJoints.clear();
    selectedElements.selectedMembers.clear();

    this.sendSelectedElementsChange(origin);
    return wasSelected;
  }

  /** Restores a formerly stashed selection. */
  public restoreSelection(stash: SelectionStash, origin: EventOrigin): void {
    const selectedElements = this.selectedElementsService.selectedElements;
    selectedElements.selectedJoints.clear();
    selectedElements.selectedMembers.clear();
    stash.joints.forEach(jointIndex => selectedElements.selectedJoints.add(jointIndex));
    stash.members.forEach(memberIndex => selectedElements.selectedMembers.add(memberIndex));
    this.sendSelectedElementsChange(origin);
  }

  /** Sends a notification that selected elements have changed. For e.g. when the selection is deleted. */
  public sendSelectedElementsChange(origin: EventOrigin): void {
    this.eventBrokerService.selectedElementsChange.next({
      origin: origin,
      data: this.selectedElementsService.selectedElements,
    });
  }

  /** Assumes the hot element is set based on point location. Selects or toggles if joint or member. */
  private doPointSelection(toggle: boolean): void {
    const hotElement = this.hotElementService.hotElement;
    const selectedElements = this.selectedElementsService.selectedElements;
    if (hotElement instanceof Joint) {
      this.selectedElementsService.selectJoint(hotElement.index, toggle);
      // Ignores extend flag, but that's reasonable.
      selectedElements.selectedMembers.clear();
    } else if (hotElement instanceof Member) {
      this.selectedElementsService.selectMember(hotElement.index, toggle);
      // Joint selection already clear.
    }
  }

  /** Queries the bridge for new selected members. */
  private doAreaSelection(cursor: Rectangle2D): void {
    this.viewportTransform.viewportToWorldRectangle2D(this.worldCursor, cursor);
    const membersToSelect =
      cursor.width >= 0
        ? this.bridgeService.getMembersInsideRectangle(this.worldCursor)
        : this.bridgeService.getMembersTouchingRectangle(this.worldCursor);
    const selectedElements = this.selectedElementsService.selectedElements;
    if (membersToSelect.length === 0) {
      return;
    }
    // Joint selection already clear.
    membersToSelect.forEach(member => selectedElements.selectedMembers.add(member.index));
  }
}
