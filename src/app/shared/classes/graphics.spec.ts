import {
  Geometry,
  Graphics,
  Point2D,
  Rectangle2D,
  TaggedPoint2D,
} from './graphics';

describe('Point2D', () => {
  it('should create point with default values', () => {
    const point = new Point2D();
    expect(point.x).toBe(0);
    expect(point.y).toBe(0);
  });

  it('should create point with specified values', () => {
    const point = new Point2D(10, 20);
    expect(point.x).toBe(10);
    expect(point.y).toBe(20);
  });

  it('should set new coordinates', () => {
    const point = new Point2D();
    point.set(30, 40);
    expect(point.x).toBe(30);
    expect(point.y).toBe(40);
  });

  it('should clone correctly', () => {
    const original = new Point2D(50, 60);
    const clone = original.clone();
    expect(clone.x).toBe(50);
    expect(clone.y).toBe(60);
    expect(clone).not.toBe(original);
  });

  it('should convert to string correctly', () => {
    const point = new Point2D(70, 80);
    expect(point.toString()).toBe('Point(70, 80)');
  });
});

describe('TaggedPoint2D', () => {
  it('should create tagged point with values and tag', () => {
    const point = new TaggedPoint2D(10, 20, 'test-tag');
    expect(point.x).toBe(10);
    expect(point.y).toBe(20);
    expect(point.tag).toBe('test-tag');
  });
});

describe('Rectangle2D', () => {
  it('should create empty rectangle', () => {
    const rect = Rectangle2D.createEmpty();
    expect(rect.x0).toBe(0);
    expect(rect.y0).toBe(0);
    expect(rect.width).toBe(0);
    expect(rect.height).toBe(0);
  });

  it('should make canonical rectangle from negative dimensions', () => {
    const rect = new Rectangle2D(10, 10, -20, -30).makeCanonical();
    expect(rect.x0).toBe(-10);
    expect(rect.y0).toBe(-20);
    expect(rect.width).toBe(20);
    expect(rect.height).toBe(30);
  });

  it('should clone correctly', () => {
    const original = new Rectangle2D(10, 20, 30, 40);
    const clone = original.clone();
    expect(clone.x0).toBe(10);
    expect(clone.y0).toBe(20);
    expect(clone.width).toBe(30);
    expect(clone.height).toBe(40);
    expect(clone).not.toBe(original);
  });
});

describe('Geometry', () => {
  it('should detect colocated points', () => {
    const a = new Point2D(0, 0);
    const b = new Point2D(0, 0);
    expect(Geometry.areColocated2D(a, b)).toBe(true);

    const c = new Point2D(1, 1);
    expect(Geometry.areColocated2D(a, c)).toBe(false);
    expect(Geometry.areColocated2D(a, c, 2)).toBe(true);
  });

  it('should calculate distance between points', () => {
    const a = new Point2D(0, 0);
    const b = new Point2D(3, 4);
    expect(Geometry.distance2DPoints(a, b)).toBe(5);
    expect(Geometry.distanceSquared2DPoints(a, b)).toBe(25);
  });

  it('should calculate point to segment distance', () => {
    const p = new Point2D(0, 1);
    const a = new Point2D(-1, 0);
    const b = new Point2D(1, 0);
    expect(Geometry.pointSegmentDistance2DPoints(p, a, b)).toBe(1);
  });

  it('should calculate extent of points', () => {
    const points = [new Point2D(0, 0), new Point2D(10, 0), new Point2D(5, 5)];
    const extent = Geometry.getExtent2D(points);
    expect(extent.x0).toBe(0);
    expect(extent.y0).toBe(0);
    expect(extent.width).toBe(10);
    expect(extent.height).toBe(5);
  });
});

describe('Graphics', () => {
  it('should compute color with intensification and blueification', () => {
    const color = Graphics.computeColor(100, 100, 100, 0.5, 0.5);
    expect(color).toMatch(/^rgb\(\d+,\s*\d+,\s*\d+\)$/);
  });
});
