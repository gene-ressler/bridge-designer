import { Injectable } from '@angular/core';
import { Point2D, Point2DInterface } from '../classes/graphics';
import { Deque } from '../core/deque';

@Injectable({ providedIn: 'root' })
export class ConvexHullService {
  private readonly pts: Point2DInterface[] = [];
  private readonly orderedPts = new Deque<Point2DInterface>();

  /** Adds given coordinates as a new point for consideration as part of the hull. */
  public add(x: number, y: number) {
    this.addPoint(new Point2D(x, y));
  }

  /** Adds the given point (without copying) for consideration as part of the hull. */
  public addPoint(pt: Point2DInterface) {
    this.pts.push(pt);
  }

  /** Empties the points buffer. */
  public clear(): void {
    this.pts.length = 0;
    this.orderedPts.clear();
  }

  /** Creates the hull, an improper subset of added points. */
  public createHull(hull: Point2DInterface[] = []): Point2DInterface[] {
    this.orderedPts.clear();
    hull.length = 0;
    if (this.pts.length <= 2) {
      hull.push(...this.pts);
      return hull;
    }
    this.pts.sort((a, b) => a.x - b.x || a.y - b.y);
    const leftmost = this.pts[0];
    const rightmost = this.pts[this.pts.length - 1];
    const dx = rightmost.x - leftmost.x;
    const dy = rightmost.y - leftmost.y;
    for (const p of this.pts) {
      if (p === rightmost) {
        this.orderedPts.pushLeft(p);
        continue;
      }
      const pdx = p.x - leftmost.x;
      const pdy = p.y - leftmost.y;
      if (dx * pdy - dy * pdx > 0) {
        this.orderedPts.pushLeft(p);
      } else {
        this.orderedPts.pushRight(p);
      }
    }
    for (const p0 of this.orderedPts) {
      makeHullConvex(p0);
      hull.push(p0);
    }
    makeHullConvex(this.orderedPts.peekLeft()!);
    return hull;

    function makeHullConvex(p0: Point2DInterface) {
      while (hull.length >= 2) {
        const p1 = hull[hull.length - 1];
        const p2 = hull[hull.length - 2];
        if ((p1.x - p2.x) * (p0.y - p1.y) - (p1.y - p2.y) * (p0.x - p1.x) > 0) {
          break;
        }
        hull.pop();
      }
    }
  }
}
