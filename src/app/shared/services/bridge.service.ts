import { Injectable } from '@angular/core';
import { BridgeModel } from '../classes/bridge.model';
import { Point2DInterface, Rectangle2D } from '../classes/graphics';
import { Joint } from '../classes/joint.model';
import { Member } from '../classes/member.model';
import { SiteModel } from '../classes/site.model';
import { DesignConditions, DesignConditionsService } from './design-conditions.service';
import { AllowedShapeChangeMask, InventoryService, StockId } from './inventory.service';
import { BridgeSketchModel } from '../classes/bridge-sketch.model';
import { SelectedSet } from '../../features/drafting/shared/selected-elements-service';
import { DraftingPanelState, PersistenceService, SaveSet } from './persistence.service';
import { SessionStateService } from './session-state.service';
import { BridgeSketchService } from './bridge-sketch.service';

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

/** Injectable, mutable container for a bridge model and related site and drafting information. */
@Injectable({ providedIn: 'root' })
export class BridgeService {
  private _bridge: BridgeModel = new BridgeModel(DesignConditionsService.PLACEHOLDER_CONDITIONS);
  private _sketch: BridgeSketchModel = BridgeSketchModel.ABSENT;
  private _siteInfo: SiteModel = new SiteModel(this.bridge.designConditions);
  private _draftingPanelState: DraftingPanelState = DraftingPanelState.createNew();

  constructor(
    private readonly persistenceService: PersistenceService,
    bridgeServiceSessionStateKey: BridgeServiceSessionStateKey,
    private readonly bridgeSketchService: BridgeSketchService,
    sessionStateService: SessionStateService,
  ) {
    sessionStateService.register(
      bridgeServiceSessionStateKey.key,
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

  /** Updates the current bridge and drafting panel state, cancelling the sketch if it doesnt' match. */
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

  public findMembersWithJoint(joint: Joint): Member[] {
    return this.bridge.members.filter(member => member.hasJoint(joint));
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
   * Three cases:
   *  - No members in the bridge: Return a stock generally useful to niave users.
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
        // The member remains after delection. Can't delete its joints.
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

  /** Returns an array of arrays of selected members, Each inner array contains those having the same stock. Sorting is on ascending member number: inner then first element of outer. */
  public partitionSelectedMembersByStock(selectedSet: SelectedSet): Member[][] {
    const membersByStockId = new Map<string, Member[]>();
    for (let memberIndex of selectedSet) {
      const member = this.bridge.members[memberIndex];
      const memberStockId = member.stockId;
      const memberStockIdKey = memberStockId.key;
      const memberList = membersByStockId.get(memberStockIdKey);
      if (memberList === undefined) {
        membersByStockId.set(memberStockIdKey, [member]);
      } else {
        memberList.push(member);
      }
    }
    const result = Array.from(membersByStockId.values());
    for (let inner of result) {
      inner.sort((a, b) => a.index - b.index);
    }
    result.sort((a, b) => a[0].index - b[0].index);
    return result;
  }

  public isPassingSlendernessCheck(): boolean {
    const allowableSlenderness = this.designConditions.allowableSlenderness;
    for (let member of this.bridge.members) {
      if (member.slenderness > allowableSlenderness) {
        return false;
      }
    }
    return true;
  }

  private dehydrate(): State {
    const text = this.persistenceService.getSaveSetAsText(SaveSet.create(this.bridge, this.draftingPanelState));
    return {
      saveSetText: text,
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
