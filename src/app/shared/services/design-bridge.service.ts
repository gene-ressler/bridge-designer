import { Injectable } from '@angular/core';
import { BridgeModel } from '../classes/bridge.model';
import { Geometry, Point2DInterface, Rectangle2D } from '../classes/graphics';
import { Joint } from '../classes/joint.model';
import { Member } from '../classes/member.model';
import { SiteModel } from '../classes/site-model';
import {
  DesignConditions,
  DesignConditionsService,
} from './design-conditions.service';
import { StockId } from './inventory.service';

/** Injectable, mutable container for a bridge model and related site information. */
@Injectable({ providedIn: 'root' })
export class DesignBridgeService {
  public bridge: BridgeModel = new BridgeModel(
    DesignConditionsService.PLACEHOLDER_CONDITIONS
  );
  private _siteInfo: SiteModel = new SiteModel(this.bridge.designConditions);

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
    return this.bridge.members.filter((member) => member);
  }

  /** Returns the geometric extent of the bridge. */
  get extent(): Rectangle2D {
    return Geometry.getExtent2D(this.bridge.joints);
  }

  /** Gets the stock used for the most members in the bridge. */
  public getMostCommonStockId(): StockId | undefined {
    const countsByStock = new Map<string, [StockId, number]>();
    var mostCommonCount: number = -1;
    var mostCommonStockId: StockId | undefined = undefined;
    for (let member of this.bridge.members) {
      const memberStockId = member.stockId;
      const memberStockIdKey = memberStockId.key;
      const pair = countsByStock.get(memberStockIdKey);
      var updatedCount: number;
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
  public getJointsForMembersDeletion(
    deletedMemberIndices: Set<number>
  ): Joint[] {
    const deletedJointIndices = new Set<number>(
      this.bridge.joints
        .filter((joint) => !joint.isFixed)
        .map((joint) => joint.index)
    );
    this.bridge.members.forEach((member) => {
      if (deletedMemberIndices.has(member.index)) {
        return; // Break forEach for deleted members.
      }
      // The member remains after delection. Can't delete its joints.
      deletedJointIndices.delete(member.a.index);
      deletedJointIndices.delete(member.b.index);
    });
    return Array.from(deletedJointIndices)
      .sort((a, b) => a - b)
      .map((i) => this.bridge.joints[i]);
  }

  /** Returns members inside or partially inside a given world rectangle.  */
  public getMembersTouchingRectangle(rectangle: Rectangle2D): Member[] {
    return this.bridge.members.filter(member => rectangle.touchesLineSegment(member.a, member.b))
  }

  /** Returns members fully inside a given world rectangle. */
  public getMembersInsideRectangle(rectangle: Rectangle2D): Member[] {
    return this.bridge.members.filter(
      (member) =>
        rectangle.containsPoint(member.a) && rectangle.containsPoint(member.b)
    );
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
