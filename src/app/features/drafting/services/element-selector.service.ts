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
    eventBrokerService.loadBridgeRequest.subscribe(eventInfo => this.clear(eventInfo.source));
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
      this.doPointSelection();
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
    if (selectedMembers.size == memberCount) {
      return;
    }
    for (let i = 0; i < memberCount; ++i) {
      selectedMembers.add(i);
    }
    this.sendSelectedElementsChange(origin);
  }

  public clear(origin: EventOrigin): void {
    const selectedElements = this.selectedElementsService.selectedElements;
    if (selectedElements.selectedMembers.size === 0 && selectedElements.selectedJoints.size === 0) {
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

  private sendSelectedElementsChange(origin: EventOrigin): void {
    this.eventBrokerService.selectedElementsChange.next({
      source: origin,
      data: this.selectedElementsService.selectedElements,
    });
  }

  /** Assumes the hot element is set based on point location. Selects if joint or member. */
  private doPointSelection(): void {
    const hotElement = this.hotElementService.hotElement;
    const selectedElements = this.selectedElementsService.selectedElements;
    if (hotElement instanceof Joint) {
      selectedElements.selectedJoints.add(hotElement.index);
      selectedElements.selectedMembers.clear(); // Ignores extend flag.
    } else if (hotElement instanceof Member) {
      // Joint selection already clear.
      selectedElements.selectedMembers.add(hotElement.index);
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
