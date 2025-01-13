import { Injectable } from '@angular/core';
import { SelectedElementsService } from '../../features/drafting/services/selected-elements-service';
import { BridgeService } from './bridge.service';
import { DesignJointRenderingService } from './design-joint-rendering.service';
import { DesignMemberRenderingService } from './design-member-rendering.service';
import { DesignSketchRenderingService } from './design-sketch-rendering.service';

@Injectable({ providedIn: 'root' })
export class DesignBridgeRenderingService {
  constructor(
    private readonly bridgeService: BridgeService,
    private readonly designSketchRenderingService: DesignSketchRenderingService,
    private readonly elementSelectionService: SelectedElementsService,
    private readonly jointRenderingService: DesignJointRenderingService,
    private readonly memberRenderingService: DesignMemberRenderingService,
  ) {}

  /** Render the design bridge using its current selection. */
  public renderDesignBridge(ctx: CanvasRenderingContext2D) {
    this.designSketchRenderingService.renderSketch(ctx);
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
