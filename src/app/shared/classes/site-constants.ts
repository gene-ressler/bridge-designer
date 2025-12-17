/* Copyright (c) 2025-2026 Gene Ressler
   SPDX-License-Identifier: GPL-3.0-or-later */

import { Point2D, TaggedPoint2D } from "./graphics";


/** Constants describing site geometry and its 2D drawing. */
export const enum PointTag {
  HEIGHT_ADJUSTED
}

export class SiteConstants {
  /** Directed distance from joint to abutment face. Also the x-coordinate. */
  static readonly ABUTMENT_FACE_X: number = 0.25;
  /** Setback from joint to beginning of road in 2d drawings. */
  static readonly ABUTMENT_INTERFACE_SETBACK: number = 1.0;
  /** Directed height of abutment pillow step. */
  static readonly ABUTMENT_STEP_HEIGHT: number = -0.35;
  /** Directed distance from joint to step vertical. Also the x-coordinate. */
  static readonly ABUTMENT_STEP_X: number = -0.45;
  static readonly ACCESS_SLOPE: number = 1.0 / 6.0;
  static readonly ANCHOR_OFFSET = 8;
  static readonly BEAM_HEIGHT: number = 0.9;
  static readonly DECK_CANTILEVER: number = 0.40;
  static readonly DECK_HALF_WIDTH: number = 5.0;
  static readonly DECK_TOP_HEIGHT: number = 0.8;
  static readonly DRAWING_X_MARGIN: number = 3;
  /** Coordinate value "off the drawing," where reasonable views are certainly clipped. */
  static readonly FAR_AWAY: number = 100.0;
  static readonly GAP_DEPTH = 24;
  static readonly GUSSET_THICKNESS = 0.02;
  static readonly GAP_NATURAL_HALF_WIDTH: number = 22.0;
  static readonly INDEX_LEFT_SHORE: number = 25;
  static readonly INDEX_RIGHT_SHORE: number = 16;
  static readonly LEFT_SHORE_INDEX: number = 25;
  static readonly OVERHEAD_CLEARANCE: number = 8.0;
  static readonly RIGHT_SHORE_INDEX: number = 16;
  static readonly TANGENT_OFFSET: number = 8.0;
  static readonly TERRAIN_DASH: number[] = [4, 3];
  static readonly MIN_ROADWAY_CLEARANCE = 4.5;
  static readonly WATER_BELOW_GRADE: number = 26.4;

  static readonly WEAR_SURFACE_X0: number = -this.ABUTMENT_INTERFACE_SETBACK;
  static readonly WEAR_SURFACE_X1: number = this.ABUTMENT_STEP_X;
  static readonly ACCESS_LENGTH: number = this.FAR_AWAY - this.TANGENT_OFFSET;
  static readonly ACCESS_CURVE: Point2D[] = this.createAccessCurve();
  /** Terrain cross-section clockwisepolygon. Between WATER_BELOW_GRADE points is the water cross-section. */
  static readonly ELEVATION_TERRAIN_POINTS: Point2D[] = (
    [
      // #region(collapsed) TABLE
      [this.FAR_AWAY, -this.FAR_AWAY],
      [this.FAR_AWAY, 0.0],
      [25.03, 0.0],
      [24.51, -0.3],
      [22.75, -0.71],
      [21.93, -2.95],
      [21.33, -4.75],
      [20.7, -6.85],
      [19.56, -7.48],
      [19.11, -8.94],
      [18.62, -10.81],
      [17.8, -12.84],
      [16.22, -14.0],
      [14.5, -17.66],
      [12.36, -21.33],
      [10.98, -24.59],
      [9.58, -this.WATER_BELOW_GRADE],
      [8.12, -27.66],
      [6.54, -28.63],
      [5.04, -29.64],
      [4.48, -29.83],
      [0.28, -30.47],
      [-4.18, -29.83],
      [-5.46, -29.19],
      [-6.96, -27.32],
      [-8.24, -this.WATER_BELOW_GRADE],
      [-10.37, -25.6],
      [-12.14, -23.21],
      [-12.48, -21.89],
      [-13.04, -20.14],
      [-14.5, -17.25],
      [-16.04, -15.38],
      [-16.53, -13.88],
      [-18.2, -11.17],
      [-19.9, -7.93],
      [-21.85, -3.07],
      [-22.57, -0.74],
      [-23.92, 0.0],
      [-this.FAR_AWAY, 0.0],
      [-this.FAR_AWAY, -this.FAR_AWAY],
      // #endregion
    ] as [number, number][]
  ).map(pair => new Point2D(...pair));

  static readonly STANDARD_ABUTMENT_POINTS: Point2D[] = (
    [
      // #region(collapsed) TABLE
      [this.WEAR_SURFACE_X0, this.DECK_TOP_HEIGHT],
      [this.WEAR_SURFACE_X1, this.DECK_TOP_HEIGHT],
      [this.ABUTMENT_STEP_X, this.ABUTMENT_STEP_HEIGHT],
      [this.ABUTMENT_FACE_X, this.ABUTMENT_STEP_HEIGHT],
      [this.ABUTMENT_FACE_X, -5.0],
      [0.75, -5.0],
      [0.75, -5.5],
      [-2.0, -5.5],
      [-2.0, -5.0],
      [-this.ABUTMENT_INTERFACE_SETBACK, -5.0],
      // #endregion
    ] as [number, number][]
  ).map(pair => new Point2D(...pair));

  /** Pillow block below supported joints, connected to abutment or pier. */
  static readonly PILLOW_POINTS: Point2D[] = (
    [
      [0, 0],
      [-this.ABUTMENT_FACE_X, this.ABUTMENT_STEP_HEIGHT],
      [this.ABUTMENT_FACE_X, this.ABUTMENT_STEP_HEIGHT],
    ]
  ).map(pair => new Point2D(...pair));

  static readonly ARCH_ABUTMENT_POINTS: TaggedPoint2D<PointTag | undefined>[] = (
    [
      // #region(collapsed) TABLE
      [this.WEAR_SURFACE_X0, this.DECK_TOP_HEIGHT],
      [this.WEAR_SURFACE_X1, this.DECK_TOP_HEIGHT],
      [this.ABUTMENT_STEP_X, this.ABUTMENT_STEP_HEIGHT, PointTag.HEIGHT_ADJUSTED],
      [this.ABUTMENT_FACE_X, this.ABUTMENT_STEP_HEIGHT, PointTag.HEIGHT_ADJUSTED],
      [this.ABUTMENT_FACE_X, -5.0, PointTag.HEIGHT_ADJUSTED],
      [0.75, -5.0, PointTag.HEIGHT_ADJUSTED],
      [0.75, -5.5, PointTag.HEIGHT_ADJUSTED],
      [-2.0, -5.5, PointTag.HEIGHT_ADJUSTED],
      [-2.0, -5.0, PointTag.HEIGHT_ADJUSTED],
      [-this.ABUTMENT_INTERFACE_SETBACK, -5.0, PointTag.HEIGHT_ADJUSTED],
      // #endregion
    ] as [number, number, PointTag | undefined][]
  ).map(triple => new TaggedPoint2D<PointTag | undefined>(...triple));

  static readonly PIER_POINTS: TaggedPoint2D<PointTag | undefined>[] = (
    [
      // #region(collapsed) TABLE
      [0.5, this.ABUTMENT_STEP_HEIGHT],
      [0.5, this.ABUTMENT_STEP_HEIGHT, PointTag.HEIGHT_ADJUSTED],
      [0.75, this.ABUTMENT_STEP_HEIGHT, PointTag.HEIGHT_ADJUSTED],
      [0.75, -7.5, PointTag.HEIGHT_ADJUSTED],
      [1.4, -7.5, PointTag.HEIGHT_ADJUSTED],
      [1.4, -8.0, PointTag.HEIGHT_ADJUSTED],
      [-1.4, -8.0, PointTag.HEIGHT_ADJUSTED],
      [-1.4, -7.5, PointTag.HEIGHT_ADJUSTED],
      [-0.75, -7.5, PointTag.HEIGHT_ADJUSTED],
      [-0.75, this.ABUTMENT_STEP_HEIGHT, PointTag.HEIGHT_ADJUSTED],
      [-0.5, this.ABUTMENT_STEP_HEIGHT, PointTag.HEIGHT_ADJUSTED],
      [-0.5, this.ABUTMENT_STEP_HEIGHT],
      // #endregion
    ] as [number, number, PointTag | undefined][]
  ).map(triple => new TaggedPoint2D<PointTag | undefined>(...triple));

  private static createAccessCurve(): Point2D[] {
    const pointCount = 6;
    const curve = new Array<Point2D>(pointCount);
    const xInc = this.TANGENT_OFFSET / (pointCount - 2);
    const a = (0.5 * this.ACCESS_SLOPE) / this.TANGENT_OFFSET;
    let i = 0;
    for (let x = 0; i < pointCount - 1; i++, x += xInc) {
      curve[i] = new Point2D(x, a * x * x);
    }
    const prev = curve[i - 1];
    curve[i] = new Point2D(prev.x + this.ACCESS_LENGTH, prev.y + this.ACCESS_SLOPE * this.ACCESS_LENGTH);
    return curve;
  }
}