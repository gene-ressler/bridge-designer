import { EventEmitter, Injectable } from '@angular/core';
import { Joint } from '../../../shared/classes/joint.model';
import { Member } from '../../../shared/classes/member.model';
import { BridgeService } from '../../../shared/services/bridge.service';
import { InventorySelectionService } from '../../../shared/services/inventory-selection.service';
import { HotElementService } from '../services/hot-element.service';
import { MemberCursorService } from '../services/member-cursor.service';

@Injectable({ providedIn: 'root' })
export class MembersModeService {
  private ctx: CanvasRenderingContext2D | undefined;
  private addMemberRequest: EventEmitter<Member> | undefined;
  private readonly existingMemberJointIndices = new Set<number>();

  constructor(
    private readonly hotElementService: HotElementService,
    private readonly memberCursorService: MemberCursorService,
    private readonly inventorySelectionService: InventorySelectionService,
    private readonly bridgeService: BridgeService,
  ) {}

  public initialize(ctx: CanvasRenderingContext2D, addMemberRequest: EventEmitter<Member>): MembersModeService {
    this.ctx = ctx;
    this.addMemberRequest = addMemberRequest;
    return this;
  }

  handleMouseDown(event: MouseEvent): void {
    if (this.ctx && event.buttons === 1 << 0) {
      // Left button down alone to start.
      const hotElement = this.hotElementService.hotElement;
      if (hotElement instanceof Joint) {
        this.existingMemberJointIndices.clear();
        this.bridgeService
          .findMembersWithJoint(hotElement)
          .map(member => member.getOtherJoint(hotElement).index)
          .forEach(i => this.existingMemberJointIndices.add(i));
        this.memberCursorService.start(this.ctx, event.offsetX, event.offsetY, hotElement);
      }
    }
  }

  handleMouseMove(event: MouseEvent): void {
    if (!this.ctx) {
      return;
    }
    this.hotElementService.updateRenderedHotElement(this.ctx, event.offsetX, event.offsetY, {
      considerOnly: [Joint],
      excludedJointIndices: this.existingMemberJointIndices,
    });
    this.memberCursorService.update(event.offsetX, event.offsetY, this.hotElementService.hotElement);
  }

  handleMouseUp(event: MouseEvent): void {
    if (event.button !== 0) {
      // Left up to end.
      return;
    }
    this.existingMemberJointIndices.clear();
    const anchor = this.memberCursorService.end();
    const hotElement = this.hotElementService.hotElement;
    if (!anchor || anchor === hotElement || !(hotElement instanceof Joint)) {
      return;
    }
    this.addMemberRequest?.emit(
      new Member(-1, anchor, hotElement, this.inventorySelectionService.material, this.inventorySelectionService.shape),
    );
  }
}
