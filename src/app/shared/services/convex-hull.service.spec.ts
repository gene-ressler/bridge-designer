import { Point2D } from '../classes/graphics';
import { ConvexHullService } from './convex-hull.service';

describe('ConvexHullService', () => {
  const service = new ConvexHullService();

  beforeEach(() => service.clear());

  it('should return input for 2 points', () => {
    service.add(0, 0);
    service.add(1, 1);
    const hull = service.createHull();
    expect(hull).toEqual([new Point2D(0, 0), new Point2D(1, 1)]);
  });

  it('should return a hull for 3 points', () => {
    service.add(0, 0);
    service.add(1, 1);
    service.add(2, 0);
    const hull = service.createHull();
    expect(hull).toEqual([ new Point2D(2, 0), new Point2D(1, 1), new Point2D(0, 0)]);
  });

  it('should drop point in top edge of quadrilateral', () => {
    service.add(1, 4);
    service.add(0.5, 0.5);
    service.add(-4, 1);
    service.add(-1, -4);
    service.add(4, -1);
    const hull = service.createHull();
    expect(hull).toEqual([new Point2D(4, -1), new Point2D(1, 4), new Point2D(-4, 1), new Point2D(-1, -4)]);
  });

  it('should drop point in right edge of quadrilateral', () => {
    service.add(1, 4);
    service.add(-4, 1);
    service.add(-1, -4);
    service.add(4, -1);
    service.add(0.5, 0.5);
    const hull = service.createHull();
    expect(hull).toEqual([new Point2D(4, -1), new Point2D(1, 4), new Point2D(-4, 1), new Point2D(-1, -4)]);
  });

  it('should drop point in bottom edge of quadrilateral', () => {
    service.add(1, 4);
    service.add(-4, 1);
    service.add(-1, -4);
    service.add(0.5, 0.5);
    service.add(4, -1);
    const hull = service.createHull();
    expect(hull).toEqual([new Point2D(4, -1), new Point2D(1, 4), new Point2D(-4, 1), new Point2D(-1, -4)]);
  });

  it('should drop point in bottom edge of quadrilateral', () => {
    service.add(1, 4);
    service.add(-4, 1);
    service.add(0.5, 0.5);
    service.add(-1, -4);
    service.add(4, -1);
    const hull = service.createHull();
    expect(hull).toEqual([new Point2D(4, -1), new Point2D(1, 4), new Point2D(-4, 1), new Point2D(-1, -4)]);
  });

  it('should drop multiple points', () => {
    service.add(1, 4);
    service.add(-0.5, 0.5);
    service.add(-4, 1);
    service.add(0.5, 0.5);
    service.add(-1, -4);
    service.add(-0.5, -0.5);
    service.add(4, -1);
    service.add(0.5, -0.5);
    const hull = service.createHull();
    expect(hull).toEqual([new Point2D(4, -1), new Point2D(1, 4), new Point2D(-4, 1), new Point2D(-1, -4)]);
  });
});
