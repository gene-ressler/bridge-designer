import { Injectable } from '@angular/core';
import { Point2DInterface } from '../classes/graphics';

// IMPORTANT: UI assumes enum values match density selector widget indices.

export const enum DesignGridDensity {
  ERROR = -1, // Result of failed conversions.
  COARSE = 0,
  MEDIUM = 1,
  FINE = 2,
}

export class DesignGrid {
  /** Size if fine grid in world coordinates. */
  public static readonly FINE_GRID_SIZE = 0.25;
  /** Allowable snap grid densities expressed in grid coordinate units, indexed on density. Invariant: multiple == 2^density. */
  static readonly SNAP_MULTIPLES = [4, 2, 1];
  /** Max allowed (coarsest) snap multiple. */
  static readonly MAX_SNAP_MULTIPLE = DesignGrid.SNAP_MULTIPLES[DesignGridDensity.COARSE];
  /** Fine grid size in world coordinate meters. */

  private _snapMultiple: number = DesignGrid.MAX_SNAP_MULTIPLE;

  constructor(density?: DesignGridDensity) {
    if (density !== undefined) {
      this._snapMultiple = DesignGrid.SNAP_MULTIPLES[density];
    }
  }

  public set snapMultiple(theSnapMultiple: number) {
    if (DesignGridService.getDensityFromSnapMultiple(theSnapMultiple) === DesignGridDensity.ERROR) {
      throw new Error('Bad snap multiple: ' + theSnapMultiple);
    }
    this._snapMultiple == theSnapMultiple;
  }

  public get snapMultiple(): number {
    return this._snapMultiple;
  }

  public set density(theDensity: DesignGridDensity) {
    this._snapMultiple = DesignGrid.SNAP_MULTIPLES[theDensity];
  }

  public get density(): DesignGridDensity {
    return DesignGridService.getDensityFromSnapMultiple(this._snapMultiple);
  }

  public isCoarser(density: DesignGridDensity) {
    return DesignGrid.SNAP_MULTIPLES[density] < this._snapMultiple;
  }

  public xformWorldToGrid(coord: number): number {
    return this.snapMultiple * Math.round(coord / (DesignGrid.FINE_GRID_SIZE * this.snapMultiple));
  }

  public xformGridToWorld(coord: number): number {
    return coord * DesignGrid.FINE_GRID_SIZE;
  }

  public xformWorldToGridPoint(dst: Point2DInterface, src: Point2DInterface): void {
    dst.x = this.xformWorldToGrid(src.x);
    dst.y = this.xformWorldToGrid(src.y);
  }

  public xformGridToWorldPoint(dst: Point2DInterface, src: Point2DInterface): void {
    dst.x = this.xformGridToWorld(src.x);
    dst.y = this.xformGridToWorld(src.y);
  }
}

@Injectable({ providedIn: 'root' })
export class DesignGridService {
  /** Mutable grid. */
  public readonly grid = new DesignGrid();

  /** Alternate finest grid.  */
  public static readonly FINEST_GRID: DesignGrid = new DesignGrid(DesignGridDensity.FINE);

  public static getDensityFromSnapMultiple(snapMultiple: number): DesignGridDensity {
    return DesignGrid.SNAP_MULTIPLES.findIndex(value => value === snapMultiple);
  }

  public static getSnapMultipleOfGrid(coord: number): number {
    const lsb = coord & ~(coord - 1);
    return lsb == 0 || lsb > DesignGrid.MAX_SNAP_MULTIPLE ? DesignGrid.MAX_SNAP_MULTIPLE : lsb;
  }

  public static getSnapMultipleOfWorld(coord: number): number {
    return this.getSnapMultipleOfGrid(Math.round(coord / DesignGrid.FINE_GRID_SIZE));
  }

  /** Returns the coarsest grid density that includes the given integer grid coordinate. */
  public static getDensityOfGrid(coord: number): DesignGridDensity {
    return this.getDensityFromSnapMultiple(this.getSnapMultipleOfGrid(coord));
  }

  /** Returns the coarsest grid density the includes the given world coordinate. */
  public static getDensityOfWorld(coord: number): DesignGridDensity {
    return this.getDensityFromSnapMultiple(this.getSnapMultipleOfWorld(coord));
  }

  /** Returns the coarsest grid density that includes all the given world points. */
  public static getDensityOfWorldPoints(pts: Point2DInterface[]): DesignGridDensity {
    let density = DesignGridDensity.COARSE;
    for (let pt of pts) {
      const xDensity = this.getDensityOfWorld(pt.x);
      if (xDensity > density) {
        density = xDensity;
      }
      const yDensity = this.getDensityOfWorld(pt.y);
      if (yDensity > density) {
        density = yDensity;
      }
    }
    return density;
  }
}
