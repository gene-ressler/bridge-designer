import { Injectable } from '@angular/core';
import { SelectedElementsService } from '../../features/drafting/services/selected-elements-service';
import { DesignBridgeService } from './design-bridge.service';
import { DesignJointRenderingService } from './design-joint-rendering.service';
import { DesignMemberRenderingService } from './design-member-rendering.service';

@Injectable({ providedIn: 'root' })
export class DesignBridgeRenderingService {
  constructor(
    private readonly bridgeService: DesignBridgeService,
    private readonly jointRenderingService: DesignJointRenderingService,
    private readonly memberRenderingService: DesignMemberRenderingService,
    private readonly elementSelectionService: SelectedElementsService
  ) {}

  /** Render the design bridge using its current selection. */
  public renderDesignBridge(ctx: CanvasRenderingContext2D) {
    const bridge = this.bridgeService.bridge;
    bridge.members.forEach((member) =>
      this.memberRenderingService.render(
        ctx,
        member,
        this.elementSelectionService.isMemberSelected(member)
      )
    );
    bridge.joints.forEach((joint) =>
      this.jointRenderingService.render(
        ctx,
        joint,
        this.elementSelectionService.isJointSelected(joint)
      )
    );
  }
}
