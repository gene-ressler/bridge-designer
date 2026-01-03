/* Copyright (c) 2025-2026 Gene Ressler
   SPDX-License-Identifier: GPL-3.0-or-later */

import { Injectable } from '@angular/core';
import { BridgeService } from './bridge.service';
import { BridgeCostModel, MaterialSectionWeight, SizeMaterialSectionCount } from '../classes/bridge-cost.model';
import { TreeMap } from '../core/tree-map';
import { DesignConditionsService } from './design-conditions.service';
import { Member } from '../classes/member.model';

/** Container for logic that tabulates bridge cost information. */
@Injectable({ providedIn: 'root' })
export class BridgeCostService {
  private static readonly CONNECTION_FEE = 400.0;
  private static readonly PRODUCT_FEE = 1000.0;

  constructor(private readonly bridgeService: BridgeService) {}

  /** Returns member cost including instances in both trusses. */
  public static getMemberTotalCost(member: Member): number {
    return member.lengthM * getMemberWeightKgPerM(member) * member.material.getCostPerKg(member.shape.section) * 2;
  }

  /** Returns cost per meter for the member's material. Does not include both trusses. */
  public static getMemberCostPerM(member: Member): number {
    return getMemberWeightKgPerM(member) * member.material.getCostPerKg(member.shape.section);
  }
  
  public get bridgeCostModel(): BridgeCostModel {
    const bridge = this.bridgeService.bridge;
    const weightByMaterialAndSection = new TreeMap<string, MaterialSectionWeight>(
      (a, b) => a.localeCompare(b),
      o => o.sortKey,
    );
    const countBySizeMaterialAndSection = new TreeMap<string, SizeMaterialSectionCount>(
      (a, b) => a.localeCompare(b),
      o => o.sortKey,
    );
    for (const member of bridge.members) {
      const newWeightTableRow = new MaterialSectionWeight(member.material, member.shape.section);
      const weightTableRow = weightByMaterialAndSection.insert(newWeightTableRow) || newWeightTableRow;
      weightTableRow.memberKg += member.lengthM * getMemberWeightKgPerM(member);

      const newCountTableRow = new SizeMaterialSectionCount(member.material, member.shape);
      const countTableRow = countBySizeMaterialAndSection.insert(newCountTableRow) || newCountTableRow;
      countTableRow.count++;
    }
    return new BridgeCostModel(
      weightByMaterialAndSection,
      countBySizeMaterialAndSection,
      bridge.joints.length,
      BridgeCostService.CONNECTION_FEE,
      BridgeCostService.PRODUCT_FEE,
    );
  }

  public get allCosts(): number {
    return this.bridgeService.designConditions !== DesignConditionsService.PLACEHOLDER_CONDITIONS
      ? this.bridgeCostModel.totalCost + this.bridgeService.bridge.designConditions.siteCosts.totalFixedCost
      : 0;
  }
}

function getMemberWeightKgPerM(member: Member): number {
  return member.shape.area * member.material.density
}
