import { Injectable } from '@angular/core';
import { BridgeModel } from '../classes/bridge.model';
import { Point2DInterface, Rectangle2D } from '../classes/graphics';
import { Joint } from '../classes/joint.model';
import { Member } from '../classes/member.model';
import { SiteModel } from '../classes/site-model';
import { DesignConditions, DesignConditionsService } from './design-conditions.service';
import { StockId } from './inventory.service';
import { BridgeSketchModel } from '../classes/bridge-sketch.model';

/** Injectable, mutable container for a bridge model and related site and sketch information. */
@Injectable({ providedIn: 'root' })
export class BridgeService {
  private _bridge: BridgeModel = new BridgeModel(DesignConditionsService.PLACEHOLDER_CONDITIONS);
  private _sketch: BridgeSketchModel = BridgeSketchModel.ABSENT;
  private _siteInfo: SiteModel = new SiteModel(this.bridge.designConditions);
  public id: string[] = [];

  public get bridge(): BridgeModel {
    return this._bridge;
  }

  /** Updates the current bridge, cancelling the sketch if it doesnt' match. */
  public set bridge(value: BridgeModel) {
    if (value.designConditions.tagGeometryOnly !== this.designConditions.tagGeometryOnly) {
      this._sketch = BridgeSketchModel.ABSENT;
    }
    this._bridge = value;
  }

  public get sketch(): BridgeSketchModel {
    return this._sketch;
  }

  /** Sets or clears the sketch. Does nothing if the given sketch doesn't match the bridge. */
  public set sketch(value: BridgeSketchModel) {
    if (
      value == BridgeSketchModel.ABSENT ||
      value.designConditions.tagGeometryOnly === this.designConditions.tagGeometryOnly
    ) {
      this._sketch = value;
    }
  }

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

  /** Gets the stock used for the most members in the bridge. */
  public getMostCommonStockId(): StockId | undefined {
    const countsByStock = new Map<string, [StockId, number]>();
    let mostCommonCount: number = -1;
    let mostCommonStockId: StockId | undefined = undefined;
    for (let member of this.bridge.members) {
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

  /** Returns joints in index order that need deletion along with a set of members. */
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
  public partitionSelectedMembersByStock(selection: Set<number>): Member[][] {
    const membersByStockId = new Map<string, Member[]>();
    for (let memberIndex of selection) {
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
}
