import { Injectable } from '@angular/core';
import { Rectangle2D } from '../../../shared/classes/graphics';
import { SelectedElements, SelectedElementsService } from './selected-elements-service';
import { ViewportTransform2D } from '../../../shared/services/viewport-transform.service';
import { Joint } from '../../../shared/classes/joint.model';
import { HotElementService } from './hot-element.service';
import { DesignBridgeService } from '../../../shared/services/design-bridge.service';
import { EventBrokerService, EventOrigin } from '../../../shared/services/event-broker.service';
import { Utility } from '../../../shared/classes/utility';

/** Algorithms for selecting bridge elements. */
@Injectable({ providedIn: 'root' })
export class ElementSelectorService {
  constructor(
    private readonly selectedElementsService: SelectedElementsService,
    private readonly designBridgeService: DesignBridgeService,
    private readonly hotElementService: HotElementService,
    private readonly eventBrokerService: EventBrokerService,
    private readonly viewportTransform: ViewportTransform2D,
  ) {}

  private readonly worldCursor = Rectangle2D.createEmpty();

  /** Updates selected elements based on the given cursor rectangle in viewport coordinates. */
  public select(cursor: Rectangle2D, extend: boolean): void {
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
      this.sendSelectedElementsChange();
    }
  }

  public selectAllMembers(): void {
    const memberCount = this.designBridgeService.bridge.members.length;
    const selectedMembers = this.selectedElementsService.selectedElements.selectedMembers;
    if (selectedMembers.size == memberCount) {
      return;
    }
    for (var i = 0; i < memberCount; ++i) {
      selectedMembers.add(i);
    }
    this.sendSelectedElementsChange();
  }

  public clear(): void {
    const selectedElements = this.selectedElementsService.selectedElements;
    if (selectedElements.selectedMembers.size === 0 && selectedElements.selectedJoints.size === 0) {
      return;
    }
    selectedElements.selectedMembers.clear();
    selectedElements.selectedJoints.clear();
    this.sendSelectedElementsChange();
  }

  public selectJoint(joint: Joint) {
    const selectedElements = this.selectedElementsService.selectedElements;
    if (selectedElements.selectedJoints.has(joint.index)) {
      return;
    }
    selectedElements.selectedJoints.clear();
    selectedElements.selectedJoints.add(joint.index);
    selectedElements.selectedMembers.clear();
    this.sendSelectedElementsChange();
  }

  private sendSelectedElementsChange() {
    this.eventBrokerService.selectedElementsChange.next({
      source: EventOrigin.SERVICE,
      data: this.selectedElementsService.selectedElements,
    });
  }

  /** Assumes the hot element is set based on point location and makes it the selection. */
  private doPointSelection(): void {
    const hotElement = this.hotElementService.hotElement;
    if (!hotElement) {
      return;
    }
    const selectedElements = this.selectedElementsService.selectedElements;
    if (hotElement instanceof Joint) {
      selectedElements.selectedJoints.add(hotElement.index);
    } else {
      selectedElements.selectedMembers.add(hotElement.index);
    }
  }

  /** Queries the bridge for new selected members. */
  private doAreaSelection(cursor: Rectangle2D): void {
    this.viewportTransform.viewportToWorldRectangle2D(this.worldCursor, cursor);
    const membersToSelect =
      cursor.width >= 0
        ? this.designBridgeService.getMembersInsideRectangle(this.worldCursor)
        : this.designBridgeService.getMembersTouchingRectangle(this.worldCursor);
    const selectedMembers = this.selectedElementsService.selectedElements.selectedMembers;
    membersToSelect.forEach(member => selectedMembers.add(member.index));
  }
}
