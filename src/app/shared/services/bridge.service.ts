/* Copyright (c) 2025-2026 Gene Ressler
   SPDX-License-Identifier: GPL-3.0-or-later */

import { Injectable } from '@angular/core';
import { BridgeModel } from '../classes/bridge.model';
import { Point2DInterface, Rectangle2D } from '../classes/graphics';
import { Joint } from '../classes/joint.model';
import { Member } from '../classes/member.model';
import { SiteModel } from '../classes/site.model';
import { SiteConstants } from '../classes/site-constants';
import { DesignConditions, DesignConditionsService } from './design-conditions.service';
import { AllowedShapeChangeMask, InventoryService, StockId } from './inventory.service';
import { BridgeSketchModel } from '../classes/bridge-sketch.model';
import { DraftingPanelState, PersistenceService, SaveSet } from './persistence.service';
import { SessionStateService } from '../../features/session-state/session-state.service';
import { BridgeSketchService } from './bridge-sketch.service';
import { BitVector } from '../core/bitvector';

/**
 * Injectable accessor of the bridge service in the root injector. Useful in components that
 * provide their own BridgeService, but also need access to the root instance.
 */
@Injectable({ providedIn: 'root' })
export class RootBridgeService {
  constructor(public readonly instance: BridgeService) {}
}

/** Container for session key providable in non-root instances of the service. */
@Injectable({ providedIn: 'root' })
export class BridgeServiceSessionStateKey {
  public readonly key: string | undefined = 'bridge.service';
}

/** Injectable, mutable container for a bridge model, related site and drafting information, and queries on these. */
@Injectable({ providedIn: 'root' })
export class BridgeService {
  private _bridge: BridgeModel = new BridgeModel(DesignConditionsService.PLACEHOLDER_CONDITIONS);
  private _sketch: BridgeSketchModel = BridgeSketchModel.ABSENT;
  private _siteInfo: SiteModel = new SiteModel(this.bridge.designConditions);
  private _draftingPanelState: DraftingPanelState = DraftingPanelState.createNew();

  constructor(
    private readonly persistenceService: PersistenceService,
    sessionStateKey: BridgeServiceSessionStateKey,
    private readonly bridgeSketchService: BridgeSketchService,
    sessionStateService: SessionStateService,
  ) {
    sessionStateService.register(
      sessionStateKey.key,
      () => this.dehydrate(),
      state => this.rehydrate(state),
    );
  }

  public get bridge(): BridgeModel {
    return this._bridge;
  }

  public get draftingPanelState(): DraftingPanelState {
    return this._draftingPanelState;
  }

  /** Updates the current bridge and drafting panel state, cancelling the sketch if it doesn't match. */
  public setBridge(value: BridgeModel, draftingPanelState: DraftingPanelState) {
    if (value.designConditions.tagGeometryOnly !== this.designConditions.tagGeometryOnly) {
      this._sketch = BridgeSketchModel.ABSENT;
    }
    this._bridge = value;
    this._draftingPanelState = draftingPanelState;
  }

  public get sketch(): BridgeSketchModel {
    return this._sketch;
  }

  /** Sets or clears the sketch. Does nothing if the given sketch doesn't match the bridge. */
  public set sketch(value: BridgeSketchModel) {
    if (
      value === BridgeSketchModel.ABSENT ||
      value.designConditions.tagGeometryOnly === this.designConditions.tagGeometryOnly
    ) {
      this._sketch = value;
    }
  }

  /** Convenience function that returns the bridge's design conditions.  */
  public get designConditions(): DesignConditions {
    return this.bridge.designConditions;
  }

  /** Returns site rendering info that's in sync with the bridge. */
  public get siteInfo(): SiteModel {
    if (this._siteInfo.designConditions !== this.designConditions) {
      this._siteInfo = new SiteModel(this.bridge.designConditions);
    }
    return this._siteInfo;
  }

  /** Gets the joint at given world point. */
  public findJointAt(p: Point2DInterface): Joint | undefined {
    for (const joint of this.bridge.joints) {
      if (joint.isAt(p)) {
        return joint;
      }
    }
    return undefined;
  }

  /**  */
  public findMembersWithJoint(joint: Joint): Member[] {
    return this.bridge.members.filter(member => member.hasJoint(joint));
  }

  /** Returns joints adjacent via members to the one given. */
  public findConnectedJoints(joint: Joint): Joint[] {
    return this.findMembersWithJoint(joint).map(member => member.getOtherJoint(joint));
  }

  public hasAnyMembers(joint: Joint): boolean {
    return this.bridge.members.some(member => member.hasJoint(joint));
  }

  /** Get the member with given joints if it exists. */
  public getMemberWithJoints(a: Joint, b: Joint): Member | undefined {
    return this.bridge.members.find(member => member.hasJoints(a, b));
  }

  /** Gets a rectangle exactly containing all the bridge's joints. */
  public getWorldExtent(extent: Rectangle2D = Rectangle2D.createEmpty()): Rectangle2D {
    return extent.setToExtent(this.bridge.joints);
  }

  /** Returns the stock (or one of them if more than one) used for the most members in the bridge, else EMPTY if none. */
  public getMostCommonStockId(): StockId {
    const countsByStock = new Map<string, [StockId, number]>();
    let mostCommonCount: number = -1;
    let mostCommonStockId: StockId = InventoryService.USEFUL_STOCK; // Fall back to something reasonable for new users.
    for (const member of this.bridge.members) {
      const memberStockId = member.stockId;
      const memberStockIdKey = memberStockId.key;
      const pair = countsByStock.get(memberStockIdKey);
      let updatedCount: number;
      if (pair === undefined) {
        countsByStock.set(memberStockIdKey, [memberStockId, 1]);
        updatedCount = 1;
      } else {
        updatedCount = ++pair[1];
      }
      if (updatedCount > mostCommonCount) {
        mostCommonCount = updatedCount;
        mostCommonStockId = memberStockId;
      }
    }
    return mostCommonStockId;
  }

  /**
   * Returns a stock heuristically likely to be one the user will want to use next.
   *
   * Three cases:
   *  - No members in the bridge: Return a stock generally useful to naive users.
   *  - Empty member index list: returns the most common stock in the bridge, else EMPTY if no members.
   *  - Otherwise: returns stock attributes shared by all given members.
   */
  public getUsefulStockId(indices: Iterable<number>): StockId {
    const members = this.bridge.members;
    if (members.length === 0) {
      return InventoryService.USEFUL_STOCK;
    }
    const indexList = Array.from(indices);
    if (indexList.length === 0) {
      return this.getMostCommonStockId();
    }
    const firstMember = members[indexList[0]];
    let materialIndex: number = firstMember.material.index;
    let sectionIndex: number = firstMember.shape.section.index;
    let sizeIndex: number = firstMember.shape.sizeIndex;
    for (let i: number = 1; i < indexList.length; ++i) {
      const member = members[indexList[i]];
      if (member.material.index !== materialIndex) {
        materialIndex = -1;
      }
      if (member.shape.section.index !== sectionIndex) {
        sectionIndex = -1;
      }
      if (member.shape.sizeIndex !== sizeIndex) {
        sizeIndex = -1;
      }
    }
    return materialIndex === undefined
      ? this.getMostCommonStockId()
      : new StockId(materialIndex, sectionIndex, sizeIndex);
  }

  /** Returns an array of member sizes in millimeters sorted smallest to largest. */
  public getMemberSizesMmSorted(): number[] {
    return this.bridge.members.map(member => member.materialSizeMm).sort((a, b) => a - b);
  }

  /** Returns whether the given members can be increased or decreased (or both) in size. */
  public getAllowedShapeChangeMask(indices: Iterable<number>): number {
    let mask = 0;
    const members = this.bridge.members;
    for (const index of indices) {
      mask |= InventoryService.getAllowedShapeChangeMask(members[index].shape);
      if (mask === AllowedShapeChangeMask.ALL) {
        break;
      }
    }
    return mask;
  }

  /** Returns joints orphaned (no incident members remaining) by deletion of the given members . */
  public getJointsForMembersDeletion(deletedMemberIndices: Set<number>): Joint[] {
    const members = this.bridge.members;
    // Consider for deletion non-fixed joints touched by the deleted members.
    const deletedJointIndices = new Set<number>();
    deletedMemberIndices.forEach(i => {
      const a = members[i].a;
      if (!a.isFixed) {
        deletedJointIndices.add(a.index);
      }
      const b = members[i].b;
      if (!b.isFixed) {
        deletedJointIndices.add(b.index);
      }
    });
    // Remove from consideration all joints touched by some non-deleted member.
    this.bridge.members.forEach(member => {
      if (!deletedMemberIndices.has(member.index)) {
        // The member remains after deletion. Can't delete its joints.
        deletedJointIndices.delete(member.a.index);
        deletedJointIndices.delete(member.b.index);
      }
    });
    return Array.from(deletedJointIndices)
      .sort((a, b) => a - b)
      .map(i => this.bridge.joints[i]);
  }

  private readonly canonicalCursorRect = Rectangle2D.createEmpty();

  /** Returns members inside or partially inside a given world rectangle.  */
  public getMembersTouchingRectangle(rectangle: Rectangle2D): Member[] {
    rectangle.copyTo(this.canonicalCursorRect).makeCanonical();
    return this.bridge.members.filter(member => this.canonicalCursorRect.touchesLineSegment(member.a, member.b));
  }

  /** Returns members fully inside a given world rectangle. */
  public getMembersInsideRectangle(rectangle: Rectangle2D): Member[] {
    return this.bridge.members.filter(member => rectangle.containsPoint(member.a) && rectangle.containsPoint(member.b));
  }

  /** Returns all members grouped by material, section, size in a canonical order. Inner member lists in index order. */
  public partitionMembersByStock(): Member[][] {
    const membersByStockId: {[key: string]: Member[]} = {};
    for (const member of this.bridge.members) {
      const key = member.stockId.key;
      membersByStockId[key] ||= [];
      membersByStockId[key].push(member);
    }
    const entries = Object.entries(membersByStockId);
    for (const pair of entries) {
      pair[1].sort((a, b) => a.index - b.index);
    }
    return  entries.sort((a, b) => a[0].localeCompare(b[0], 'en-US')).map(pair => pair[1]);
  }

  /** Returns whether a member with given end points would intersect the high pier, if the conditions have one. */
  public isMemberIntersectingHighPier(a: Point2DInterface, b: Point2DInterface): boolean {
    if (!this.designConditions.isHiPier || a.x === b.x) {
      return false;
    }
    const pierTop = this.bridge.joints[this.designConditions.pierJointIndex];
    if ((a.x < pierTop.x && b.x < pierTop.x) || (a.x > pierTop.x && b.x > pierTop.x)) {
      return false;
    }
    const m = (b.y - a.y) / (b.x - a.x);
    const yIntersect = a.y + m * (pierTop.x - a.x);
    return yIntersect < pierTop.y - 0.01; // 1cm grace
  }

  /** Returns whether any member connected to a joint about to be moved would intersect the high pier. */
  public isMovedJointIntersectingHighPier(joint: Joint, newLocation: Point2DInterface): boolean {
    return this.findMembersWithJoint(joint)
      .map(member => member.getOtherJoint(joint))
      .some(otherJoint => this.isMemberIntersectingHighPier(newLocation, otherJoint));
  }

  /** Returns whether the given member passes the slenderness check. */
  public isMemberPassingSlendernessCheck(member: Member): boolean {
    return member.slenderness <= this.designConditions.allowableSlenderness;
  }

  public get isPassingSlendernessCheck(): boolean {
    const allowableSlenderness = this.designConditions.allowableSlenderness;
    for (let member of this.bridge.members) {
      if (member.slenderness > allowableSlenderness) {
        return false;
      }
    }
    return true;
  }

  private get maxDeckMemberSizeMm(): number {
    let max = 0;
    for (const member of this.bridge.members) {
      // prettier-ignore
      if ((member.materialSizeMm <= max) || 
        // Ignore the member if it doesn't transect the deck.
        (member.a.y > 0 && member.b.y > 0) ||
        (member.a.y < 0 && member.b.y < 0) ||
        (member.a.index === this.designConditions.leftAnchorageJointIndex) ||
        (member.b.index === this.designConditions.leftAnchorageJointIndex) ||
        (member.a.index === this.designConditions.rightAnchorageJointIndex) ||
        (member.b.index === this.designConditions.rightAnchorageJointIndex)) {
        continue;
      }
      max = member.materialSizeMm;
    }
    return max;
  }

  /**
   * Return bridge half-width, including the widest members that transect the deck.
   * Useful for piers and abutments.
   */
  public get bridgeHalfWidth(): number {
    return SiteConstants.DECK_HALF_WIDTH + this.maxDeckMemberSizeMm * 0.001 + 2 * SiteConstants.GUSSET_THICKNESS;
  }

  /**
   * Return the offset from the roadway centerline to the center plane of the truss.
   * Useful for drawing the truss in three dimensions.
   */
  public get trussCenterlineOffset(): number {
    return SiteConstants.DECK_HALF_WIDTH + this.maxDeckMemberSizeMm * 0.0005 + SiteConstants.GUSSET_THICKNESS;
  }

  public static isJointClearOfRoadway(joint: Point2DInterface) {
    return joint.y <= 0 || joint.y >= SiteConstants.MIN_ROADWAY_CLEARANCE;
  }

  public get membersNotTransectingRoadwayClearance(): BitVector {
    const bits = new BitVector(this.bridge.members.length);
    const minClearance = SiteConstants.MIN_ROADWAY_CLEARANCE;
    for (const member of this.bridge.members) {
      if ((member.a.y >= minClearance && member.b.y >= minClearance) || (member.a.y <= 0 && member.b.y <= 0)) {
        bits.setBit(member.index);
      }
    }
    return bits;
  }

  public get saveSet(): SaveSet {
    return SaveSet.create(this.bridge, this.draftingPanelState);
  }

  public get saveSetText(): string {
    return this.persistenceService.getSaveSetAsText(this.saveSet);
  }

  private dehydrate(): State {
    return {
      saveSetText: this.saveSetText,
      sketchName: this.sketch.name,
    };
  }

  private rehydrate(savedState: State) {
    const saveSet = SaveSet.createNew();
    this.persistenceService.parseSaveSetText(savedState.saveSetText, saveSet);
    this.setBridge(saveSet.bridge, saveSet.draftingPanelState);
    this.sketch = this.bridgeSketchService.getSketch(this.designConditions, savedState.sketchName);
  }
}

type State = {
  saveSetText: string;
  sketchName: string;
};
