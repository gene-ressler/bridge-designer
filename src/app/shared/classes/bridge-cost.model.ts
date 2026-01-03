/* Copyright (c) 2025-2026 Gene Ressler
   SPDX-License-Identifier: GPL-3.0-or-later */

import { TreeMap } from '../core/tree-map';
import { CrossSection, Material, Shape } from '../services/inventory.service';
import { FIXED_FORMATTER } from './utility';

/** Accumulator for report line denoting a material+section with corresponding total truss weight in kilograms. */
export class MaterialSectionWeight {
  public memberKg: number = 0;
  public readonly sortKey: string;

  constructor(
    public readonly material: Material,
    public readonly section: CrossSection,
  ) {
    this.sortKey = `${material.name.padEnd(32)}|${section.name.padEnd(12)}|${FIXED_FORMATTER.format(this.memberKg).padStart(10)}`;
  }

  public get cost(): number {
    return this.memberKg * this.material.getCostPerKg(this.section) * 2;
  }
}

export class SizeMaterialSectionCount {
  public count: number = 0;
  public readonly sortKey: string;

  constructor(
    public readonly material: Material,
    public readonly shape: Shape,
  ) {
    this.sortKey = `${material.name.padEnd(32)}|${shape.section.name.padEnd(12)}|${shape.sizeIndex.toString().padStart(3)}|${this.count.toString().padStart(3)}`;
  }
}

/** Summary of bridge costs. */
export class BridgeCostModel {
  constructor(
    public readonly weightByMaterialAndSection: TreeMap<string, MaterialSectionWeight>,
    public readonly countBySizeMaterialAndSection: TreeMap<string, SizeMaterialSectionCount>,
    public readonly connectionCount: number,
    public readonly connectionFee: number,
    public readonly productFee: number,
  ) {}

  public get materialCost(): number {
    let cost: number = 0;
    this.weightByMaterialAndSection.forEach(item => cost += item.cost);
    return cost;
  }
  
  public get connectionCost(): number {
    return this.connectionCount * this.connectionFee * 2;
  }

  public get productCost(): number {
    return this.countBySizeMaterialAndSection.size * this.productFee;
  }

  public get totalCost(): number {
    return this.materialCost + this.connectionCost + this.productCost;
  }
}
