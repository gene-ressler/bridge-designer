import { Injectable } from '@angular/core';
import { Geometry } from '../../../shared/classes/graphics';
import { Joint } from '../../../shared/classes/joint.model';
import { Utility } from '../../../shared/classes/utility';
import { DesignJointRenderingService } from '../../../shared/services/design-joint-rendering.service';
import { SelectedElementsService } from './selected-elements-service';
import { DesignBridgeService } from '../../../shared/services/design-bridge.service';
import { DesignMemberRenderingService } from '../../../shared/services/design-member-rendering.service';
import { ViewportTransform2D } from '../../../shared/services/viewport-transform.service';
import { Member } from '../../../shared/classes/member.model';

export type HotElement = Joint | Member | undefined;
export type HotElementClass = typeof Joint | typeof Member;

@Injectable({ providedIn: 'root' })
export class HotElementService {
  constructor(
    private readonly designBridgeService: DesignBridgeService,
    private readonly designJointRenderingService: DesignJointRenderingService,
    private readonly designMemberRenderingService: DesignMemberRenderingService,
    private readonly elementSelectionService: SelectedElementsService,
    private readonly viewportTransform: ViewportTransform2D,
  ) {}

  private _hotElement: HotElement;

  public get hotElement(): HotElement {
    return this._hotElement;
  }

  public updateRenderedHotElement(
    ctx: CanvasRenderingContext2D,
    x: number,
    y: number,
    considerOnly?: HotElementClass[],
  ): void {
    const xWorld = this.viewportTransform.viewportToworldX(x);
    const yWorld = this.viewportTransform.viewportToworldY(y);
    const bridge = this.designBridgeService.bridge;
    var hotElement: HotElement = undefined;
    if (!considerOnly || considerOnly.includes(Joint)) {
      const jointRadiusWorldSquared = Utility.sqr(
        3 *
          this.viewportTransform.viewportToWorldDistance(
            DesignJointRenderingService.JOINT_RADIUS_VIEWPORT,
          ),
      );
      // Could stop at the first joint, but look for minimum in case the screen is small enough for joints to overlap.
      var minDistanceSquared: number = Number.MAX_VALUE;
      var minDistanceJoint: Joint | undefined = undefined;
      bridge.joints.forEach(joint => {
        const distanceSquared = Geometry.distanceSquared2D(xWorld, yWorld, joint.x, joint.y);
        if (distanceSquared < minDistanceSquared) {
          minDistanceJoint = joint;
          minDistanceSquared = distanceSquared;
        }
      });
      if (minDistanceSquared <= jointRadiusWorldSquared) {
        hotElement = minDistanceJoint;
      }
    }
    if (!considerOnly || considerOnly.includes(Member)) {
      bridge.members.forEach(member => {
        const width = this.designMemberRenderingService.getMemberWidthWorld(member);
        if (
          Geometry.isInNonAxisAlignedRectangle(
            xWorld,
            yWorld,
            member.a.x,
            member.a.y,
            member.b.x,
            member.b.y,
            width,
          )
        ) {
          hotElement = member;
          return; // break forEach()
        }
      });
    }
    // TODO: Hot bridge labels.
    if (hotElement !== this._hotElement) {
      this.erase(ctx, this._hotElement);
      this._hotElement = hotElement;
      this.render(ctx, this._hotElement);
    }
  }

  public clearRenderedHotElement(ctx: CanvasRenderingContext2D): void {
    this.erase(ctx, this._hotElement);
    this._hotElement = undefined;
  }

  /** Renders the current hot element. Useful when the hot element state has changed, e.g. it was (un)selected. */
  public invalidate(ctx: CanvasRenderingContext2D): void {
    this.render(ctx, this.hotElement);
  }

  private render(ctx: CanvasRenderingContext2D, element: Joint | Member | undefined): void {
    if (element === undefined) {
      return; // nothing to rendder
    }
    if (element instanceof Joint) {
      this.designJointRenderingService.renderHot(
        ctx,
        element,
        this.elementSelectionService.isJointSelected(element),
      );
    } else if (element instanceof Member) {
      const member: Member = element;
      this.designMemberRenderingService.renderHot(
        ctx,
        member,
        this.elementSelectionService.isMemberSelected(member),
      );
      this.designJointRenderingService.render(
        ctx,
        member.a,
        this.elementSelectionService.isJointSelected(member.a),
      );
      this.designJointRenderingService.render(
        ctx,
        member.b,
        this.elementSelectionService.isJointSelected(member.b),
      );
    }
  }

  private erase(ctx: CanvasRenderingContext2D, element: Joint | Member | undefined): void {
    if (element === undefined) {
      return; // nothing to erase
    }
    if (element instanceof Joint) {
      this.designJointRenderingService.clear(ctx, element);
    } else if (element instanceof Member) {
      this.designMemberRenderingService.clear(ctx, element);
    }
  }
}
