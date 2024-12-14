import { Injectable } from '@angular/core';
import { Geometry, Point2D, Point2DInterface } from '../../../shared/classes/graphics';
import { DesignBridgeService } from '../../../shared/services/design-bridge.service';
import { DesignGrid, DesignGridService } from '../../../shared/services/design-grid.service';

@Injectable({ providedIn: 'root' })
export class CoordinateService {
  constructor(
    private readonly bridgeService: DesignBridgeService,
    private readonly gridService: DesignGridService,
  ) {}

  private static readonly ABUTMENT_CLEARANCE: number = 1.0;
  private static readonly PIER_CLEARANCE: number = 1.0;

  /**
   * When getting nearby point, check for all possibilities up to this fixed number
   * of meters away.  Should be multiple of LCM of possible snap multiples.  Must
   * be big enough to get past high pier.
   */
  private static readonly SEARCH_RADIUS_METERS: number = 8;

  /**
   * Search the grid in the direction [dx,dy] for the valid point nearest the source that is not already
   * occupied by a joint. Valid means it's inside the river banks and not on a high pier.  If the search fails,
   * the destination is set equal to the source.
   *
   * @param dst search result
   * @param src original point
   * @param dx x-component of search direction
   * @param dy y-component of source direction
   */
  getNearbyPointOnGrid(
    dst: Point2DInterface,
    src: Point2DInterface,
    dx: number,
    dy: number,
    grid: DesignGrid = this.gridService.grid,
  ): void {
    var tryDx: number = dx;
    var tryDy: number = dy;
    const snapMultiple = this.gridService.grid.snapMultiple;
    const nSearchSteps = Math.trunc(CoordinateService.SEARCH_RADIUS_METERS / snapMultiple);
    const dstGrid = new Point2D();
    for (var i = 0; i < nSearchSteps; i++) {
      dst.x = src.x + tryDx * snapMultiple * DesignGrid.FINE_GRID_SIZE;
      dst.y = src.y + tryDy * snapMultiple * DesignGrid.FINE_GRID_SIZE;
      this.shiftToNearestValidWorldPoint(dst, dstGrid, dst, grid);
      // If the new point is not the same as the starting point and there is no joint there, we're done.
      if (!Geometry.areColocated2D(dst, src) && !this.bridgeService.findJointAt(dst)) {
        return;
      }
      tryDx += dx;
      tryDy += dy;
    }
    dst.x = src.x;
    dst.y = src.y;
  }

  /**
   * Set the destination point to be the grid point closest to a given source point that is valid.
   * Valid means within the design space including river banks and not interfering with
   * abutments or the high pier, if any.
   *
   * @param dst destination point in world coordinates
   * @param dstGrid destination point in grid coordinates
   * @param src source point in world coordinates
   */
  public shiftToNearestValidWorldPoint(
    dst: Point2DInterface,
    dstGrid: Point2DInterface,
    src: Point2DInterface,
    grid: DesignGrid = this.gridService.grid,
  ): void {
    var x: number = src.x;
    var y: number = src.y;

    const spanExtent = this.bridgeService.siteInfo.spanExtent;
    var yTop: number = spanExtent.y0 + spanExtent.height;
    var yBottom: number = spanExtent.y0;
    var xLeft: number = spanExtent.x0;
    var xRight: number = spanExtent.x0 + spanExtent.width;

    // Be safe about testing which world zone we're in.
    const tol = 0.5 * DesignGrid.FINE_GRID_SIZE;
    const siteModel = this.bridgeService.siteInfo;
    const conditions = this.bridgeService.designConditions;
    // Adjust for abutments and slope. No worries for arches.
    if (y <= tol && !conditions.isArch) {
      xLeft += CoordinateService.ABUTMENT_CLEARANCE;
      xRight -= CoordinateService.ABUTMENT_CLEARANCE;
      const dy = siteModel.yGradeLevel - y;
      const xLeftSlope = siteModel.leftBankX + 0.5 * dy - 0.5;
      if (xLeftSlope > xLeft) {
        xLeft = xLeftSlope;
      }
      const xRightSlope = siteModel.rightBankX - 0.5 * dy + 0.5;
      if (xRightSlope < xRight) {
        xRight = xRightSlope;
      }
    }

    // Move off high pier.
    if (conditions.isHiPier) {
      const pierLocation = conditions.prescribedJoints[conditions.pierJointIndex];
      if (y <= pierLocation.y + tol) {
        const clearance = CoordinateService.PIER_CLEARANCE;
        if (pierLocation.x - clearance <= x && x <= pierLocation.x + clearance) {
          x = x < pierLocation.x ? pierLocation.x - clearance : pierLocation.x + clearance;
        }
      }
    }
    dst.x = x < xLeft ? xLeft : x > xRight ? xRight : x;
    dst.y = y < yBottom ? yBottom : y > yTop ? yTop : y;

    // Snap
    grid.xformWorldToGridPoint(dstGrid, dst);
    grid.xformGridToWorldPoint(dst, dstGrid);

    // If snapping took us out of bounds, move one grid and reconvert.
    if (dst.x < xLeft) {
      dstGrid.x += grid.snapMultiple;
      grid.xformGridToWorldPoint(dst, dstGrid);
    } else if (dst.x > xRight) {
      dstGrid.x -= grid.snapMultiple;
      grid.xformGridToWorldPoint(dst, dstGrid);
    }
  }
}
