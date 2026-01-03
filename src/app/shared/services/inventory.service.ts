/* Copyright (c) 2025-2026 Gene Ressler
   SPDX-License-Identifier: GPL-3.0-or-later */

import { Injectable } from '@angular/core';
import { Utility } from '../classes/utility';

export class Material {
  constructor(
    readonly index: number,
    readonly name: string,
    readonly shortName: string,
    readonly e: number,
    readonly fy: number,
    readonly density: number,
    readonly cost: number[],
  ) {}

  public getCostPerKg(crossSection: CrossSection): number {
    return this.cost[crossSection.index];
  }
}

type SectionShortName = 'Tube' | 'Bar';

export abstract class CrossSection {
  // prettier-ignore
  protected static readonly WIDTHS: number[] = [
    30, 35, 40, 45, 50, 55, 60, 65, 70, 75, 80,                // 0 to 10 
    90, 100, 110, 120, 130, 140, 150, 160, 170, 180, 190, 200, // 11 to 22 
    220, 240, 260, 280, 300,                                   // 23 to 27 
    320, 340, 360, 400, 500                                    // 28 to 32 
  ];

  constructor(
    readonly index: number,
    readonly name: string,
    readonly shortName: SectionShortName,
  ) {}

  public abstract createShapes(): Shape[];

  public getNSizes(): number {
    return CrossSection.WIDTHS.length;
  }

  public toString(): string {
    return this.shortName;
  }
}

class BarCrossSection extends CrossSection {
  constructor() {
    super(0, 'Solid Bar', 'Bar');
  }

  public override createShapes(): Shape[] {
    return Array.from({ length: CrossSection.WIDTHS.length }, (_, sizeIndex) => {
      const width = CrossSection.WIDTHS[sizeIndex];
      const area = Utility.sqr(width) * 1e-6;
      const moment = (Utility.p4(width) / 12) * 1e-12;
      return Shape.createSolidBar(this, sizeIndex, `${width}×${width}`, width, area, moment);
    });
  }
}

class TubeCrossSection extends CrossSection {
  constructor() {
    super(1, 'Hollow Tube', 'Tube');
  }

  public override createShapes(): Shape[] {
    return Array.from({ length: CrossSection.WIDTHS.length }, (_, sizeIndex) => {
      const width = CrossSection.WIDTHS[sizeIndex];
      const thickness = Math.max(Math.trunc(width / 20), 2);
      const area = (Utility.sqr(width) - Utility.sqr(width - 2 * thickness)) * 1e-6;
      const moment = ((Utility.p4(width) - Utility.p4(width - 2 * thickness)) / 12) * 1e-12;
      return Shape.createHollowTube(this, sizeIndex, `${width}×${width}×${thickness}`, width, area, moment, thickness);
    });
  }
}

export class Shape {
  readonly inverseRadiusOfGyration: number;

  private constructor(
    readonly section: CrossSection,
    readonly sizeIndex: number,
    readonly name: string,
    readonly width: number,
    readonly area: number,
    readonly moment: number,
    readonly thickness: number,
  ) {
    this.inverseRadiusOfGyration = Math.sqrt(area / moment);
  }

  public static createSolidBar(
    section: CrossSection,
    sizeIndex: number,
    name: string,
    width: number,
    area: number,
    moment: number,
  ): Shape {
    return new Shape(section, sizeIndex, name, width, area, moment, width);
  }

  public static createHollowTube(
    section: CrossSection,
    sizeIndex: number,
    name: string,
    width: number,
    area: number,
    moment: number,
    thickness: number,
  ): Shape {
    return new Shape(section, sizeIndex, name, width, area, moment, thickness);
  }

  public toString(): string {
    return `${this.name}mm ${this.section.name.toLowerCase()}`
  }
}

class Inventory {
  static readonly CROSS_SECTIONS: CrossSection[] = [new BarCrossSection(), new TubeCrossSection()];

  static readonly MATERIALS: Material[] = [
    new Material(0, 'Carbon steel', 'CS', 200000000, 250000, 7850, [4.3, 6.3]),
    new Material(1, 'High-strength low-alloy steel', 'HSS', 200000000, 345000, 7850, [5.6, 7.0]),
    new Material(2, 'Quenched & tempered steel', 'QTS', 200000000, 485000, 7850, [6.0, 7.7]),
  ];

  static readonly SHAPES: Shape[][] = Inventory.CROSS_SECTIONS.map(cs => cs.createShapes());
}

/** An identifier for a Material/Size/Section triple. Indices are -1 for nothing selected. */
export class StockId {
  public static readonly EMPTY = new StockId(-1, -1, -1);

  constructor(
    public materialIndex: number,
    public sectionIndex: number,
    public sizeIndex: number,
  ) {}

  /** Converts this ID into the material and shape it represents or undefined if none. */
  public toMaterialAndShape(): { material: Material; shape: Shape } | undefined {
    return this.materialIndex < 0 || this.sectionIndex < 0 || this.sizeIndex < 0
      ? undefined
      : {
          material: Inventory.MATERIALS[this.materialIndex],
          shape: Inventory.SHAPES[this.sectionIndex][this.sizeIndex],
        };
  }

  /** Returns a key for sorting and grouping stock canonically. */
  public get key(): string {
    // Only sizes have indices more than 9.
    return `StockId:${this.materialIndex}.${this.sectionIndex}.${String(this.sizeIndex).padStart(2, '0')}`;
  }
}

export const enum AllowedShapeChangeMask {
  DECREASE_SIZE = 0x1,
  INCREASE_SIZE = 0x2,
  ALL = 0x4 - 1,
}

@Injectable({ providedIn: 'root' })
export class InventoryService {
  /** Stock a niave user can employ to get a first successful bridge in many cases. */
  public static readonly USEFUL_STOCK: StockId = new StockId(0, 0, 22); // 200mm CSS solid bar

  private static readonly COMPRESSION_RESISTANCE_FACTOR: number = 0.9;
  private static readonly TENSION_RESISTANCE_FACTOR: number = 0.95;

  public get materials(): Material[] {
    return Inventory.MATERIALS;
  }

  public get crossSections(): CrossSection[] {
    return Inventory.CROSS_SECTIONS;
  }

  public getShapes(sectionIndex: number): Shape[] {
    return Inventory.SHAPES[sectionIndex];
  }

  public getShapeCount(sectionIndex: number): number {
    return Inventory.SHAPES[sectionIndex].length;
  }

  /** Returns shape for given indices or undefined if either is out of bounds. */
  public getShape(sectionIndex: number, sizeIndex: number): Shape {
    return Inventory.SHAPES[sectionIndex]?.[sizeIndex];
  }

  /** Returns a shape incremented in size wrt a given one, if available. */
  public static getShapeWithSizeIncrement(shape: Shape, increment: number): Shape {
    const shapes = Inventory.SHAPES[shape.section.index];
    return shapes[Utility.clamp(shape.sizeIndex + increment, 0, shapes.length - 1)];
  }

  public static mergeStockId(stockId: StockId, material: Material, shape: Shape): { material: Material; shape: Shape } {
    const materialIndex = stockId.materialIndex < 0 ? material.index : stockId.materialIndex;
    const sectionIndex = stockId.sectionIndex < 0 ? shape.section.index : stockId.sectionIndex;
    const sizeIndex = stockId.sizeIndex < 0 ? shape.sizeIndex : stockId.sizeIndex;
    return { material: Inventory.MATERIALS[materialIndex], shape: Inventory.SHAPES[sectionIndex][sizeIndex] };
  }

  public static compressiveStrength(material: Material, shape: Shape, length: number): number {
    const fy = material.fy;
    const area = shape.area;
    const e = material.e;
    const moment = shape.moment;
    const lambda = (length * length * fy * area) / (9.8696044 * e * moment);
    return lambda <= 2.25
      ? InventoryService.COMPRESSION_RESISTANCE_FACTOR * Math.pow(0.66, lambda) * fy * area
      : (InventoryService.COMPRESSION_RESISTANCE_FACTOR * 0.88 * fy * area) / lambda;
  }

  public static tensileStrength(material: Material, shape: Shape): number {
    return InventoryService.TENSION_RESISTANCE_FACTOR * material.fy * shape.area;
  }

  public static getAllowedShapeChangeMask(shape: Shape): number {
    let mask: number = 0;
    if (shape.sizeIndex > 0) {
      mask |= AllowedShapeChangeMask.DECREASE_SIZE;
    }
    if (shape.sizeIndex < Inventory.SHAPES[shape.section.index].length - 1) {
      mask |= AllowedShapeChangeMask.INCREASE_SIZE;
    }
    return mask;
  }
}
