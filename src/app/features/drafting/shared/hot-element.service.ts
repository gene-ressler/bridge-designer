import { Injectable } from '@angular/core';
import { Geometry } from '../../../shared/classes/graphics';
import { Joint } from '../../../shared/classes/joint.model';
import { Utility } from '../../../shared/classes/utility';
import { DesignJointRenderingService } from '../../../shared/services/design-joint-rendering.service';
import { SelectedElementsService } from './selected-elements-service';
import { BridgeService } from '../../../shared/services/bridge.service';
import { DesignMemberRenderingService } from '../../../shared/services/design-member-rendering.service';
import { ViewportTransform2D } from '../../../shared/services/viewport-transform.service';
import { Member } from '../../../shared/classes/member.model';
import { GuideKnob, GuidesService } from './guides.service';
import { Labels, LabelsService } from './labels.service';
import { CustomCursor, StandardCursor, WidgetHelper } from '../../../shared/classes/widget-helper';

export type HotElement = GuideKnob | Joint | Labels | Member | undefined;
export type HotElementClass = typeof GuideKnob | typeof Joint | typeof Labels | typeof Member;

/** Manages graphic elements that "light up" on mouse rollover, optionally be dragged by the pointer. */
@Injectable({ providedIn: 'root' })
export class HotElementService {
  private _hotElement: HotElement;
  public defaultCursor: StandardCursor | CustomCursor | undefined;

  constructor(
    private readonly bridgeService: BridgeService,
    private readonly designJointRenderingService: DesignJointRenderingService,
    private readonly designMemberRenderingService: DesignMemberRenderingService,
    private readonly elementSelectionService: SelectedElementsService,
    private readonly guidesService: GuidesService,
    private readonly labelsService: LabelsService,
    private readonly viewportTransform: ViewportTransform2D,
  ) {}

  public get hotElement(): HotElement {
    return this._hotElement;
  }

  /**
   * Chooses a new hot element based on given cursor location. Also manages the pointer (mouse) cursor.
   * May be restricted to joints (optionally non-fixed only), members, guide, and/or element labels.
   */
  public updateRenderedHotElement(
    ctx: CanvasRenderingContext2D,
    x: number,
    y: number,
    options: {
      considerOnly?: HotElementClass[];
      excludeFixedJoints?: boolean;
      excludedJointIndices?: Set<number>;
    } = {},
  ): void {
    const xWorld = this.viewportTransform.viewportToworldX(x);
    const yWorld = this.viewportTransform.viewportToworldY(y);
    const bridge = this.bridgeService.bridge;
    let hotElement: HotElement = undefined;
    let pointerCursor: StandardCursor | CustomCursor | undefined = this.defaultCursor;
    const jointRadiusWorld = this.viewportTransform.viewportToWorldDistance(
      DesignJointRenderingService.JOINT_RADIUS_VIEWPORT,
    );

    // Following ifs are "last wins" for setting hotElement;
    if (!options.considerOnly || options.considerOnly.includes(Joint)) {
      // Could stop at the first joint, but look for minimum in case the screen is small enough for joints to overlap.
      let minDistanceSquared: number = Number.MAX_VALUE;
      let minDistanceJoint: Joint | undefined = undefined;
      const pickRadiusSquared = Utility.sqr(3 * jointRadiusWorld);
      for (const joint of bridge.joints) {
        if (
          (options.excludeFixedJoints && joint.isFixed) ||
          (options.excludedJointIndices && options.excludedJointIndices.has(joint.index))
        ) {
          continue;
        }
        const distanceSquared = Geometry.distanceSquared2D(xWorld, yWorld, joint.x, joint.y);
        if (distanceSquared < minDistanceSquared) {
          minDistanceJoint = joint;
          minDistanceSquared = distanceSquared;
        }
      }
      if (minDistanceSquared <= pickRadiusSquared) {
        hotElement = minDistanceJoint;
      }
    }
    if (!options.considerOnly || options.considerOnly.includes(Member)) {
      for (const member of bridge.members) {
        // Min pixel width eases selection of very narrow members.
        const width = this.designMemberRenderingService.getMemberWidthWorld(member, 10);
        if (
          Geometry.isInNonAxisAlignedRectangle(
            xWorld,
            yWorld,
            member.a.x,
            member.a.y,
            member.b.x,
            member.b.y,
            width,
            jointRadiusWorld,
          )
        ) {
          hotElement = member;
          break;
        }
      }
    }
    if (!options.considerOnly || options.considerOnly.includes(GuideKnob)) {
      const hotGuideKnob = this.guidesService.getHotGuideKnob(x, y);
      if (hotGuideKnob) {
        hotElement = hotGuideKnob;
        pointerCursor = this.guidesService.getKnobMoveCursor(hotGuideKnob);
      }
    }
    if (!options.considerOnly || options.considerOnly.includes(Labels)) {
      const hotLabels = this.labelsService.getHotLabels(x, y);
      if (hotLabels) {
        hotElement = hotLabels;
        pointerCursor = LabelsService.MOVE_CURSOR;
      }
    }
    if (hotElement !== this._hotElement) {
      this.erase(ctx, this._hotElement);
      this._hotElement = hotElement;
      this.render(ctx, this._hotElement);
    }
    // TODO: If this is too expensive, track current setting to avoid redundant per-move-event setting.
    WidgetHelper.setPointerCursor(ctx, pointerCursor);
  }

  public clearRenderedHotElement(ctx: CanvasRenderingContext2D): void {
    this.erase(ctx, this._hotElement);
    this._hotElement = undefined;
  }

  /** Renders (usually re-renders) the current hot element. */
  public invalidate(ctx: CanvasRenderingContext2D): void {
    this.render(ctx, this.hotElement);
  }

  private render(ctx: CanvasRenderingContext2D, element: HotElement): void {
    if (element === undefined) {
      return; // nothing to render
    }
    if (element instanceof Joint) {
      this.designJointRenderingService.renderHot(ctx, element, this.elementSelectionService.isJointSelected(element));
    } else if (element instanceof Member) {
      const member: Member = element;
      const isSelected = this.elementSelectionService.isMemberSelected(member);
      const isTooSlender = !this.bridgeService.isMemberPassingSlendernessCheck(member);
      this.designMemberRenderingService.renderHot(ctx, member, isSelected, isTooSlender);
      this.designJointRenderingService.render(ctx, member.a, this.elementSelectionService.isJointSelected(member.a));
      this.designJointRenderingService.render(ctx, member.b, this.elementSelectionService.isJointSelected(member.b));
    }
  }

  private erase(ctx: CanvasRenderingContext2D, element: HotElement): void {
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
