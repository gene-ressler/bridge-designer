import { DesignConditions, DesignConditionsService } from '../services/design-conditions.service';
import { Point2D, Rectangle2D, TaggedPoint2D } from './graphics';

/** Immutable container for site geometry and other info that depends only on design conditions. */
export class SiteModel {
  public readonly designConditions: DesignConditions = DesignConditionsService.PLACEHOLDER_CONDITIONS;
  public readonly spanExtent: Rectangle2D = Rectangle2D.createEmpty();
  public readonly drawingWindow: Rectangle2D = Rectangle2D.createEmpty();
  public readonly halfCutGapWidth: number;
  public readonly xLeftmostDeckJoint: number;
  public readonly xRightmostDeckJoint: number;
  public readonly yGradeLevel: number;
  public readonly leftAbutmentInterfaceTerrainIndex: number;
  public readonly rightAbutmentInterfaceTerrainIndex: number;

  constructor(conditions: DesignConditions) {
    this.xLeftmostDeckJoint = conditions.xLeftmostDeckJoint;
    this.xRightmostDeckJoint = conditions.xRightmostDeckJoint;
    this.yGradeLevel = DesignConditions.GAP_DEPTH - conditions.deckElevation + SiteConstants.DECK_HEIGHT;
    this.halfCutGapWidth = 0.5 * (this.xRightmostDeckJoint - this.xLeftmostDeckJoint);

    // Find indices in the terrain profile point array that are hidden by the abutments.  This gives us
    // a way to separate excavation area from remaining bank material.  Note: x coords of the elevation terrain
    // curve are descending (CCW order for the polygon).
    this.leftAbutmentInterfaceTerrainIndex = SiteConstants.ELEVATION_TERRAIN_POINTS.length - 1;
    const leftLimit = this.xLeftmostDeckJoint - SiteConstants.ABUTMENT_INTERFACE_OFFSET;
    while (
      SiteConstants.ELEVATION_TERRAIN_POINTS[this.leftAbutmentInterfaceTerrainIndex].x + this.halfCutGapWidth <
      leftLimit
    ) {
      this.leftAbutmentInterfaceTerrainIndex--;
    }
    this.rightAbutmentInterfaceTerrainIndex = 0;
    const rightLimit = this.xRightmostDeckJoint + SiteConstants.ABUTMENT_INTERFACE_OFFSET;
    while (
      SiteConstants.ELEVATION_TERRAIN_POINTS[this.rightAbutmentInterfaceTerrainIndex].x + this.halfCutGapWidth >
      rightLimit
    ) {
      this.rightAbutmentInterfaceTerrainIndex++;
    }

    // Canonical rectangular span extent.
    this.spanExtent.x0 = this.xLeftmostDeckJoint;
    this.spanExtent.y0 = -conditions.underClearance;
    this.spanExtent.width = conditions.spanLength;
    this.spanExtent.height = conditions.underClearance + conditions.overClearance;

    this.drawingWindow.x0 = this.spanExtent.x0 - SiteConstants.DRAWING_X_MARGIN;
    this.drawingWindow.width = this.spanExtent.width + 2 * SiteConstants.DRAWING_X_MARGIN;
    if (conditions.isLeftAnchorage) {
      this.drawingWindow.x0 -= DesignConditions.ANCHOR_OFFSET;
      this.drawingWindow.width += DesignConditions.ANCHOR_OFFSET;
    }
    if (conditions.isRightAnchorage) {
      this.drawingWindow.width += DesignConditions.ANCHOR_OFFSET;
    }
    // Extra 4 shows bottom of lowest abutment position.
    this.drawingWindow.y0 = this.yGradeLevel - SiteConstants.WATER_BELOW_GRADE - 4;
    this.drawingWindow.height = this.yGradeLevel + SiteConstants.OVERHEAD_CLEARANCE + 1.5 - this.drawingWindow.y0;
    this.designConditions = conditions;
  } 

  public get leftBankX() {
    return this.halfCutGapWidth - SiteConstants.HALF_NATURAL_GAP_WIDTH;
  }

  public get rightBankX() {
    return this.halfCutGapWidth + SiteConstants.HALF_NATURAL_GAP_WIDTH;
  }
}

export const enum PointTag {
  HEIGHT_ADJUSTED,
}

/** Constants describing site geometry and its 2D drawing. */
export class SiteConstants {
  /** Coordinate value "off the drawing," where reasonable views are certainly clipped. */
  static readonly ABUTMENT_FACE_X: number = 0.25;
  static readonly ABUTMENT_INTERFACE_OFFSET: number = 1.0;
  static readonly ABUTMENT_STEP_HEIGHT: number = -0.35;
  static readonly ABUTMENT_STEP_INSET: number = -0.45;
  static readonly ACCESS_SLOPE: number = 1.0 / 6.0;
  static readonly BEAM_HEIGHT: number = 0.9;
  static readonly DECK_CANTILEVER: number = 0.32;
  static readonly DECK_HALF_WIDTH: number = 5.0;
  static readonly DECK_HEIGHT: number = 0.8;
  static readonly DRAWING_X_MARGIN: number = 3;
  static readonly FAR_AWAY: number = 100.0;
  static readonly GUSSET_THICKNESS = 0.02;
  static readonly HALF_NATURAL_GAP_WIDTH: number = 22.0;
  static readonly INDEX_LEFT_SHORE: number = 25;
  static readonly INDEX_RIGHT_SHORE: number = 16;
  static readonly LEFT_SHORE_INDEX: number = 25;
  static readonly OVERHEAD_CLEARANCE: number = 8.0;
  static readonly RIGHT_SHORE_INDEX: number = 16;
  static readonly TANGENT_OFFSET: number = 8.0;
  static readonly TERRAIN_DASH: number[] = [4, 3];
  static readonly WATER_BELOW_GRADE: number = 26.4;

  static readonly WEAR_SURFACE_X0: number = -this.ABUTMENT_INTERFACE_OFFSET;
  static readonly WEAR_SURFACE_X1: number = this.ABUTMENT_STEP_INSET;
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
      [this.WEAR_SURFACE_X0, this.DECK_HEIGHT],
      [this.WEAR_SURFACE_X1, this.DECK_HEIGHT],
      [this.ABUTMENT_STEP_INSET, this.ABUTMENT_STEP_HEIGHT],
      [this.ABUTMENT_FACE_X, this.ABUTMENT_STEP_HEIGHT],
      [this.ABUTMENT_FACE_X, -5.0],
      [0.75, -5.0],
      [0.75, -5.5],
      [-2.0, -5.5],
      [-2.0, -5.0],
      [-this.ABUTMENT_INTERFACE_OFFSET, -5.0],
      // #endregion
    ] as [number, number][]
  ).map(pair => new Point2D(...pair));

  static readonly ARCH_ABUTMENT_POINTS: TaggedPoint2D<PointTag | undefined>[] = (
    [
      // #region(collapsed) TABLE
      [this.WEAR_SURFACE_X0, this.DECK_HEIGHT],
      [this.WEAR_SURFACE_X1, this.DECK_HEIGHT],
      [this.ABUTMENT_STEP_INSET, this.ABUTMENT_STEP_HEIGHT, PointTag.HEIGHT_ADJUSTED],
      [this.ABUTMENT_FACE_X, this.ABUTMENT_STEP_HEIGHT, PointTag.HEIGHT_ADJUSTED],
      [this.ABUTMENT_FACE_X, -5.0, PointTag.HEIGHT_ADJUSTED],
      [0.75, -5.0, PointTag.HEIGHT_ADJUSTED],
      [0.75, -5.5, PointTag.HEIGHT_ADJUSTED],
      [-2.0, -5.5, PointTag.HEIGHT_ADJUSTED],
      [-2.0, -5.0, PointTag.HEIGHT_ADJUSTED],
      [-this.ABUTMENT_INTERFACE_OFFSET, -5.0, PointTag.HEIGHT_ADJUSTED],
      // #endregion
    ] as [number, number, PointTag | undefined][]
  ).map(triple => new TaggedPoint2D<PointTag | undefined>(...triple));

  static readonly PIER_POINTS: TaggedPoint2D<PointTag | undefined>[] = (
    [
      // #region(collapsed) TABLE
      [0.5, -0.2],
      [0.5, -0.2, PointTag.HEIGHT_ADJUSTED],
      [0.75, -0.2, PointTag.HEIGHT_ADJUSTED],
      [0.75, -7.5, PointTag.HEIGHT_ADJUSTED],
      [1.4, -7.5, PointTag.HEIGHT_ADJUSTED],
      [1.4, -8.0, PointTag.HEIGHT_ADJUSTED],
      [-1.4, -8.0, PointTag.HEIGHT_ADJUSTED],
      [-1.4, -7.5, PointTag.HEIGHT_ADJUSTED],
      [-0.75, -7.5, PointTag.HEIGHT_ADJUSTED],
      [-0.75, -0.2, PointTag.HEIGHT_ADJUSTED],
      [-0.5, -0.2, PointTag.HEIGHT_ADJUSTED],
      [-0.5, -0.2],
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
