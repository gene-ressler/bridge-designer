import { ElementRef } from '@angular/core';
import { Utility } from './utility';

/** Colors meant to be consistent across the application. */
export class Colors {
  public static readonly CONCRETE = 'rgb(128, 128, 0)';
  public static readonly CARTOON_EARTH = 'rgb(220, 208, 188)';
  public static readonly EARTH = 'rgb(128, 64, 64)';
  public static readonly EXCAVATION = 'rgb(128, 64, 64)';
  public static readonly SKY = 'rgb(192, 255, 255)';
  public static readonly STEEL = 'gray';
  public static readonly WATER = 'blue';
  public static readonly GL_CONCRETE = new Uint8Array([128, 128, 128, 255])
  public static readonly GL_WATER = new Uint8Array([11, 104, 158, 255]);
  public static readonly GL_SKY = new Uint8Array([135, 206, 235, 255]);
}

/** Acceptable values for lineStule and fillStyle in canvas drawing congtext. */
export type FillStyle = string | CanvasGradient | CanvasPattern;
export type StrokeStyle = string | CanvasGradient | CanvasPattern;

/** A vector is a 2-dimensional Cartesian space. */
export interface Vector2DInterface {
  x: number;
  y: number;
}

/** A point is a vector plus an origin. */
export interface Point2DInterface extends Vector2DInterface {}

class Vector2DImpl {
  constructor(
    public x: number = 0,
    public y: number = 0,
  ) {}

  public set(x: number, y: number): void {
    this.x = x;
    this.y = y;
  }

  public copyFrom(v: Vector2DInterface) {
    this.x = v.x;
    this.y = v.y;
  }

  public clone(): Point2D {
    return new Point2D(this.x, this.y);
  }
}

export class Point2D extends Vector2DImpl implements Point2DInterface {
  public override toString(): string {
    return `Point(${this.x}, ${this.y})`;
  }
}

export class Vector2D extends Vector2DImpl implements Point2DInterface {
  public override toString(): string {
    return `Vector(${this.x}, ${this.y})`;
  }
}

export class TaggedPoint2D<T> extends Point2D {
  constructor(
    x: number,
    y: number,
    public tag: T,
  ) {
    super(x, y);
  }
}

export interface Rectangle2DInterface {
  x0: number;
  y0: number;
  width: number;
  height: number;
}

const enum OutCode {
  LEFT = 1,
  RIGHT = 2,
  TOP = 4,
  BOTTOM = 8,
}

export class Rectangle2D implements Rectangle2DInterface {
  constructor(
    public x0: number,
    public y0: number,
    public width: number,
    public height: number,
  ) {}

  /** Construct a canonical empty rectangle. */
  public static createEmpty(): Rectangle2D {
    return new Rectangle2D(0, 0, 0, 0);
  }

  public static fromDiagonal(ax: number, ay: number, bx: number, by: number): Rectangle2D {
    return new Rectangle2D(ax, ay, bx - ax, by - ay);
  }

  public static fromDiagonalPoints(a: Point2D, b: Point2D): Rectangle2D {
    return this.fromDiagonal(a.x, a.y, b.x, b.y);
  }

  /** Returns the length of the diagonal squared. */
  public get diagonalSqr(): number {
    return Utility.sqr(this.width) + Utility.sqr(this.height);
  }

  public clone(): Rectangle2D {
    return new Rectangle2D(this.x0, this.y0, this.width, this.height);
  }

  public get x1(): number {
    return this.x0 + this.width;
  }

  public get y1(): number {
    return this.y0 + this.height;
  }

  public contains(x: number, y: number): boolean {
    return Utility.inRange(x, this.x0, this.x1) && Utility.inRange(y, this.y0, this.y1);
  }

  /** Returns Cohen-Sutherland clipping code for given point. */
  private getOutCode(p: Point2DInterface) {
    let code: number = 0;
    if (p.x < this.x0) {
      code |= OutCode.LEFT;
    }
    if (p.x > this.x1) {
      code |= OutCode.RIGHT;
    }
    if (p.y < this.y0) {
      code |= OutCode.TOP;
    }
    if (p.y > this.y1) {
      code |= OutCode.BOTTOM;
    }
    return code;
  }

  /** Returns whether this rectangle (which must be canonical) touches a given line segment. */
  public touchesLineSegment(a: Point2DInterface, b: Point2DInterface): boolean {
    const codeA = this.getOutCode(a);
    const codeB = this.getOutCode(b);
    if (codeA === 0 || codeB === 0) {
      return true; // endpoint inside
    }
    const and = codeA & codeB;
    if (and) {
      return false; // entirely above, below, left, or right
    }
    const or = codeA | codeB;
    if (or === (OutCode.TOP | OutCode.BOTTOM) || or === (OutCode.LEFT | OutCode.RIGHT)) {
      return true; // piercing vertically or horizontally
    }
    const m = (b.y - a.y) / (b.x - a.x);
    if (
      // otherwise maybe piercing 2 edges, so only need to check 3
      Utility.inRange((this.x0 - a.x) * m + a.y, this.y0, this.y1) ||
      Utility.inRange((this.x1 - a.x) * m + a.y, this.y0, this.y1) ||
      Utility.inRange((this.y0 - a.y) / m + a.x, this.x0, this.x1)
    ) {
      return true;
    }
    return false;
  }

  public containsPoint(p: Point2DInterface): boolean {
    return this.contains(p.x, p.y);
  }

  public copyTo(dst: Rectangle2D): Rectangle2D {
    dst.x0 = this.x0;
    dst.y0 = this.y0;
    dst.width = this.width;
    dst.height = this.height;
    return dst;
  }

  /** Sets the this rectangle to exactly contain all the given points. */
  public setToExtent(pts: Point2DInterface[]): Rectangle2D {
    if (pts.length === 0) {
      return this;
    }
    this.setFromDiagonal(pts[0].x, pts[0].y, pts[0].x, pts[0].y);
    for (let i = 1; i < pts.length; ++i) {
      const x = pts[i].x;
      const y = pts[i].y;
      if (x < this.x0) {
        this.x0 = x;
      }
      if (x > this.x1) {
        this.width = x - this.x0;
      }
      if (y < this.y0) {
        this.y0 = y;
      }
      if (y > this.y1) {
        this.height = y - this.y0;
      }
    }
    return this;
  }

  public setFromDiagonal(ax: number, ay: number, bx: number, by: number): Rectangle2D {
    this.x0 = ax;
    this.y0 = ay;
    this.width = bx - ax;
    this.height = by - ay;
    return this;
  }

  public makeEmpty(): Rectangle2D {
    this.x0 = this.y0 = this.width = this.height = 0;
    return this;
  }

  public makeCanonical(): Rectangle2D {
    if (this.width < 0) {
      this.x0 += this.width;
      this.width = -this.width;
    }
    if (this.height < 0) {
      this.y0 += this.height;
      this.height = -this.height;
    }
    return this;
  }

  public pad(dx: number, dy: number): Rectangle2D {
    this.makeCanonical();
    this.x0 -= dx;
    this.width += dx + dx;
    this.y0 -= dy;
    this.height += dy + dy;
    return this;
  }

  /** Enlarges rectangle, which must be canonical, to include given point. */
  public include(x: number, y: number) {
    if (x < this.x0) {
      this.width += this.x0 - x;
      this.x0 = x;
    } else if (x > this.x1) {
      this.width = x - this.x0;
    }
    if (y < this.y0) {
      this.height += this.y0 - y;
      this.y0 = y;
    } else if (y > this.y1) {
      this.height = y - this.y0;
    }
  }
}

export class Geometry {
  public static readonly SMALL = 0.01; // A world centimeter.
  public static readonly SMALL_SQUARED = this.SMALL * this.SMALL;

  public static add2D<R extends Point2DInterface, T extends Vector2DInterface>(result: R, a: R, b: T): void {
    result.x = a.x + b.x;
    result.y = a.y + b.y;
  }

  public static subtract2D<R extends Point2DInterface, T extends Vector2DInterface>(result: R, a: R, b: T): void;
  public static subtract2D(result: Vector2DInterface, a: Point2DInterface, b: Point2DInterface): void {
    result.x = a.x - b.x;
    result.y = a.y - b.y;
  }

  public static scale2D(result: Vector2DInterface, s: number): void {
    result.x *= s;
    result.y *= s;
  }

  public static offsetScaled2D(result: Point2DInterface, p: Point2DInterface, v: Vector2DInterface, s: number): void {
    result.x = p.x + v.x * s;
    result.y = p.y + v.y * s;
  }

  public static orthoOffsetScaled2D(
    result: Point2DInterface,
    p: Point2DInterface,
    v: Vector2DInterface,
    s: number,
  ): void {
    result.x = p.x - v.y * s;
    result.y = p.y + v.x * s;
  }

  public static dot2D(a: Vector2DInterface, b: Vector2DInterface): number {
    return a.x * b.x + a.y * b.y;
  }

  /** Returns the z-component of the 3D cross product [a, ?]X[b, ?]. */
  public static cross2D(a: Vector2DInterface, b: Vector2DInterface): number {
    return a.x * b.y - a.y * b.x;
  }

  public static length2D(v: Vector2DInterface): number {
    return Math.sqrt(Geometry.dot2D(v, v));
  }

  public static areColocated2D(a: Point2DInterface, b: Point2DInterface, toleranceSquared: number = 0): boolean {
    return this.distanceSquared2DPoints(a, b) <= toleranceSquared;
  }

  /** Return the distance squared between a couple of 2d points. */
  public static distanceSquared2DPoints(a: Point2DInterface, b: Point2DInterface): number {
    return this.distanceSquared2D(a.x, a.y, b.x, b.y);
  }

  public static distanceSquared2D(ax: number, ay: number, bx: number, by: number): number {
    const dx = ax - bx;
    const dy = ay - by;
    return dx * dx + dy * dy;
  }

  public static distance2DPoints(a: Point2DInterface, b: Point2DInterface): number {
    return Math.sqrt(this.distanceSquared2DPoints(a, b));
  }

  public static distance2D(ax: number, ay: number, bx: number, by: number): number {
    return Math.sqrt(this.distanceSquared2D(ax, ay, bx, by));
  }

  public static vectorLength2D(dx: number, dy: number): number {
    return Math.sqrt(dx * dx + dy * dy);
  }

  public static pointSegmentDistance2DPoints(p: Point2DInterface, a: Point2DInterface, b: Point2DInterface): number {
    return this.pointSegmentDistance2D(p.x, p.y, a.x, a.y, b.x, b.y);
  }

  public static pointSegmentDistance2D(px: number, py: number, ax: number, ay: number, bx: number, by: number): number {
    const vx = bx - ax;
    const vy = by - ay;
    const vDotV = vx * vx + vy * vy;
    if (vDotV < this.SMALL_SQUARED) {
      return this.distance2D(px, py, ax, ay);
    }
    const ux = px - ax;
    const uy = py - ay;
    if (ux * vx + uy * vy <= 0) {
      return Math.sqrt(ux * ux + uy * uy);
    }
    const wx = px - bx;
    const wy = py - by;
    if (wx * vx + wy * vy >= 0) {
      return Math.sqrt(wx * wx + wy * wy);
    }
    return Math.abs(uy * vx - ux * vy) / Math.sqrt(vDotV);
  }

  /** Return the area of a simple polygon with given array of vertex points. */
  public static getPolygonArea(p: Point2DInterface[], n: number = p.length): number {
    let detSum = 0;
    let j = n - 1;
    for (let i = 0; i < n; j = i++) {
      detSum += p[j].x * p[i].y - p[j].y * p[i].x;
    }
    return 0.5 * detSum;
  }

  /** Returns whether the given point P is in the rectangle with centerline segment A-B of given width. */
  public static isInNonAxisAlignedRectangle(
    px: number,
    py: number,
    ax: number,
    ay: number,
    bx: number,
    by: number,
    width: number,
    shortening: number = 0,
  ): boolean {
    const vx = bx - ax;
    const vy = by - ay;
    const vDotV = vx * vx + vy * vy;
    if (shortening > 0) {
      const t = Math.min(Math.sqrt((shortening * shortening) / vDotV), 0.5);
      return this.isInNonAxisAlignedRectangle(px, py, ax + t * vx, ay + t * vy, bx - t * vx, by - t * vy, width);
    }
    if (vDotV < this.SMALL_SQUARED) {
      return this.distance2D(px, by, ax, ay) < 0.5 * width;
    }
    const ux = px - ax;
    const uy = py - ay;
    if (ux * vx + uy * vy <= 0) {
      return false;
    }
    const wx = px - bx;
    const wy = py - by;
    if (wx * vx + wy * vy >= 0) {
      return false;
    }
    return Math.abs(uy * vx - ux * vy) / Math.sqrt(vDotV) < 0.5 * width;
  }

  public static isInNonAxisAlignedRectanglePoints(
    p: Point2DInterface,
    a: Point2DInterface,
    b: Point2DInterface,
    width: number,
    shortening: number = 0,
  ): boolean {
    return this.isInNonAxisAlignedRectangle(p.x, p.y, a.x, a.y, b.x, b.y, width, shortening);
  }

  /** Returns a canonical rectangle that exactly includes a list of 2d points or null if the list is empty. */
  public static getExtent2D(dst: Rectangle2D, pointList: Point2DInterface[]): Rectangle2D {
    if (pointList.length === 0) {
      dst.makeEmpty();
      return dst;
    }
    const p0 = pointList[0];
    let x0 = p0.x;
    let y0 = p0.y;
    let x1 = p0.x;
    let y1 = p0.y;
    for (const p of pointList) {
      if (p.x < x0) {
        x0 = p.x;
      }
      if (p.y < y0) {
        y0 = p.y;
      }
      if (p.x > x1) {
        x1 = p.x;
      }
      if (p.y > y1) {
        y1 = p.y;
      }
    }
    return dst.setFromDiagonal(x0, y0, x1, y1).makeCanonical();
  }

  /** Minimally expands the given rectangle to include the given point; returns the rectangle in canonical form. */
  public static addToExtent2D(dst: Rectangle2D, p: Point2DInterface): Rectangle2D {
    let x0 = dst.x0;
    let y0 = dst.y0;
    let x1 = dst.x1;
    let y1 = dst.y1;
    if (p.x < x0) {
      x0 = p.x;
    }
    if (p.y < y0) {
      y0 = p.y;
    }
    if (p.x > x1) {
      x1 = p.x;
    }
    if (p.y > y1) {
      y1 = p.y;
    }
    return dst.setFromDiagonal(x0, y0, x1, y1).makeCanonical();
  }

  /** Returns whether point p is on open segment a--b. */
  public static isPointOnSegment(p: Point2DInterface, a: Point2DInterface, b: Point2DInterface): boolean {
    return (
      !this.areColocated2D(p, a) &&
      !this.areColocated2D(p, b) &&
      ((a.x <= p.x && p.x <= b.x) || (b.x <= p.x && p.x <= a.x)) &&
      ((a.y <= p.y && p.y <= b.y) || (b.y <= p.y && p.y <= a.y)) &&
      Math.abs((p.x - a.x) * (b.y - a.y) - (p.y - a.y) * (b.x - a.x)) < Geometry.SMALL_SQUARED
    );
  }

  /** Sets p to the intersection of segments A-B and C-D and returns true if one exists; else returns false. */
  public static getSegmentsIntersection(
    p: Point2DInterface,
    ax: number,
    ay: number,
    bx: number,
    by: number,
    cx: number,
    cy: number,
    dx: number,
    dy: number,
  ): boolean {
    const dxab = bx - ax;
    const dyab = by - ay;
    const dxcd = dx - cx;
    const dycd = dy - cy;
    const d = dycd * dxab - dxcd * dyab;
    if (d === 0) {
      return false;
    }
    const dxca = ax - cx;
    const dyca = ay - cy;
    const uan = dxcd * dyca - dycd * dxca;
    const ubn = dxab * dyca - dyab * dxca;
    const ua = uan / d;
    const ub = ubn / d;
    if (ua < 0 || ua > 1 || ub < 0 || ub > 1) {
      return false;
    }
    p.x = ax + ua * dxab;
    p.y = ay + ua * dyab;
    return true;
  }

  public static isPointInCanonicalRectangle(x: number, y: number, rect: Rectangle2DInterface) {
    return rect.x0 <= x && x <= rect.x0 + rect.width && rect.y0 <= y && y <= rect.y0 + rect.height;
  }
}

export class Graphics {
  public static readonly ARROW_HALF_WIDTH = 3;
  public static readonly ARROW_LENGTH = 8;

  /** Clears canvas: rgbg => 0. */
  public static clearCanvas(ctx: CanvasRenderingContext2D) {
    const savedTransform = ctx.getTransform();
    ctx.resetTransform();
    ctx.clearRect(0, 0, ctx.canvas.width - 1, ctx.canvas.height - 1);
    ctx.setTransform(savedTransform);
  }

  /** Compute a color with options to modify intensity and blueness of the result. */
  public static computeColor(
    r: number,
    g: number,
    b: number,
    intensification: number = 0,
    blueification: number = 0,
  ): string {
    r += intensification * (255 - r) - 0.25 * blueification * r;
    g += intensification * (255 - g) - 0.25 * blueification * g;
    b += intensification * (255 - b) + blueification * (255 - b);
    return `rgb(${Math.trunc(r)}, ${Math.trunc(g)}, ${Math.trunc(b)})`;
  }

  /** Sets up lineDashOffset and lineDash in given context with offset that assures a good look. */
  public static setTickLineDash(ctx: CanvasRenderingContext2D, length: number, dash: [number, number]): void {
    const [dashLength, spaceLength] = dash;
    const cycleLength = dashLength + spaceLength;
    const dashFraction = dashLength / cycleLength;
    const cycles = length / cycleLength;
    const wholeCyclesWithExtraDash = Math.ceil(cycles + dashFraction) - 1;
    let lineDashOffset = (1 - cycles + wholeCyclesWithExtraDash + dashFraction) * 0.5 * cycleLength;
    const shift = cycleLength / 2; // Optional shift away from endpoints.
    ctx.lineDashOffset = lineDashOffset + shift < spaceLength ? lineDashOffset + shift : lineDashOffset;
    ctx.setLineDash(dash);
    ctx.lineCap = 'butt';
  }

  public static getContext(canvasRef: ElementRef<HTMLCanvasElement>): CanvasRenderingContext2D {
    return Utility.assertNotNull(canvasRef.nativeElement.getContext('2d'));
  }

  /**
   * Draw an arrowhead that aligns with the given segment.
   * No join style is set. Default miter and limit give a sharp tip.
   */
  public static drawArrowhead(
    ctx: CanvasRenderingContext2D,
    x0: number,
    y0: number,
    x1: number,
    y1: number,
    halfWidth: number = Graphics.ARROW_HALF_WIDTH,
    length: number = Graphics.ARROW_LENGTH,
  ): void {
    const dx = x1 - x0;
    const dy = y1 - y0;
    if (dx === 0 && dy === 0) {
      return;
    }
    const len = Math.sqrt(dx * dx + dy * dy);
    const ux = dx / len;
    const uy = dy / len;
    const bx = x1 - ux * length;
    const by = y1 - uy * length;
    const dhx = -uy * halfWidth;
    const dhy = ux * halfWidth;
    ctx.beginPath();
    ctx.moveTo(bx + dhx, by + dhy);
    ctx.lineTo(x1, y1);
    ctx.lineTo(bx - dhx, by - dhy);
    ctx.stroke();
  }

  public static drawArrow(
    ctx: CanvasRenderingContext2D,
    x0: number,
    y0: number,
    x1: number,
    y1: number,
    halfWidth: number = Graphics.ARROW_HALF_WIDTH,
    length: number = Graphics.ARROW_LENGTH,
  ): void {
    ctx.beginPath();
    ctx.moveTo(x0, y0);
    ctx.lineTo(x1, y1);
    ctx.stroke();
    Graphics.drawArrowhead(ctx, x0, y0, x1, y1, halfWidth, length);
  }

  public static drawDoubleArrow(
    ctx: CanvasRenderingContext2D,
    x0: number,
    y0: number,
    x1: number,
    y1: number,
    halfWidth: number = Graphics.ARROW_HALF_WIDTH,
    length: number = Graphics.ARROW_LENGTH,
  ): void {
    Graphics.drawArrow(ctx, x0, y0, x1, y1, halfWidth, length);
    Graphics.drawArrowhead(ctx, x1, y1, x0, y0, halfWidth, length);
  }
}
