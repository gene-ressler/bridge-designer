import { builtinModules } from 'module';

export type Point = [number, number];
export type Polygon = Point[];
type Sign = 1 | -1;
type Edge = {
  tag: string;
  index: number;
  dx: number;
  dy: number;
  sign: Sign;
  isTurningPoint: boolean;
  isCavity: boolean;
};

/** Returns [0..8) for polar angle comparisons of vectors. A cheaper alternative to atan2(). */
function getAngleMetric(y: number, x: number): number {
  const rtn =
    x >= 0
      ? y >= 0
        ? y <= x
          ? y / x // 0 to 1
          : 2 - x / y // 1 to 2
        : -y <= x
          ? 8 + y / x // 7 to 8
          : 6 - x / y // 6 to 7
      : y >= 0
        ? y <= -x
          ? 4 + y / x // 3 to 4
          : 2 - x / y // 2 to 3
        : y >= x //
          ? 4 + y / x // 4 to 5
          : 6 - x / y; // 5 to 6
  return isNaN(rtn) ? 0 : rtn; // Handle 0/0, etc.
}

/** Returns i wrapped back into the space [0..n]. Addition or subtraction of `n` one time must be enough. */
function wrap(i: number, n: number): number {
  return i < 0 ? i + n : i >= n ? i - n : i;
}

/** Returns a metric that's negative if edge `e` makes a "left turn"  wrt  edge `d` and vice versa. */
function getTurn(d: Edge, e: Edge): number {
  const dex = d.dx;
  const dey = d.dy;
  const dfx = dex + e.dx;
  const dfy = dey + e.dy;
  return dex * dfy - dey * dfx;
}

function isBelowOrLeftOf(a: Point, b: Point): boolean {
  return a[1] < b[1] || (a[1] === b[1] && a[0] < b[0]);
}

/** Returns index of bottom left point of polygon or zero if polygon is empty. */
function findPolygonBottomLeft(polygon: Polygon): number {
  let rtn = 0;
  for (let i = 1; i < polygon.length; ++i) {
    if (isBelowOrLeftOf(polygon[i]!, polygon[rtn]!)) {
      rtn = i;
    }
  }
  return rtn;
}

/** Returns an edge representation of the given polygon with given sign. */
function toEdges(polygon: Polygon, sign: Sign): Edge[] {
  const tag = sign === 1 ? 'a' : 'b';
  const edges: Edge[] = [];
  const iStart = findPolygonBottomLeft(polygon);
  const len = polygon.length;
  for (let i = 0, iq = iStart, ip = wrap(iq + 1, len); i < len; ++i, iq = ip, ip = wrap(ip + 1, len)) {
    const pq = polygon[iq]!;
    const pp = polygon[ip]!;
    edges.push({
      tag,
      index: i,
      dx: sign * (pp[0] - pq[0]),
      dy: sign * (pp[1] - pq[1]),
      sign: 1,
      isTurningPoint: false,
      isCavity: false,
    });
  }
  // TODO: Delete after debugging.
  const tmp = setIsCavity(setIsTurningPoint(edges));
  console.log('edges', sign, tmp);
  return tmp;
}

function setIsTurningPoint(edges: Edge[]): Edge[] {
  if (edges.length >= 3) {
    for (let ir = edges.length - 2, iq = ir + 1, ip = 0; ip < edges.length; ir = iq, iq = ip++) {
      const ep = edges[ip]!;
      const eq = edges[iq]!;
      const er = edges[ir]!;
      // Paper would have this as er, but it's wrong.
      eq.isTurningPoint = getTurn(er, eq) >= 0 !== getTurn(eq, ep) >= 0;
    }
  }
  return edges;
}

type HullPoint = { x: number; y: number; inEdgeIndex: number };

/** Return turn metric for (r)--->(q)--->(p). This is (q-r)X(    if (y > y1) {
      y1 = y;
    }
p-q). */
function pointsTurn(r: HullPoint, q: HullPoint, p: HullPoint): number {
  const adx = q.x - r.x;
  const ady = q.y - r.y;
  const bdx = p.x - q.x;
  const bdy = p.y - q.y;
  return adx * bdy - ady * bdx;
}

/**
 * Sets the `isCavity` of each given edge in the given list and returns it.
 * It's assumed that the first edge starts at a bottom vertex and the last closes the polygon.
 * This is a customized Graham Scan to find convex hull edges. Others are cavity edges.
 */
function setIsCavity(edges: Edge[]): Edge[] {
  let x = 0;
  let y = 0;
  const points: HullPoint[] = [];
  for (let i = 0; i < edges.length - 1; ++i) {
    const e = edges[i];
    x += e.dx;
    y += e.dy;
    points.push({ x, y, inEdgeIndex: i });
  }
  points.sort((a, b) => getAngleMetric(a.y, a.x) - getAngleMetric(b.y, b.x));
  const stack: HullPoint[] = [{ x: 0, y: 0, inEdgeIndex: edges.length - 1 }];
  for (const point of points) {
    while (stack.length > 1 && pointsTurn(stack[stack.length - 2], stack[stack.length - 1], point) < 0) {
      const top = stack.pop()!;
      const ia = top.inEdgeIndex;
      const ib = wrap(ia + 1, edges.length);
      edges[ia].isCavity = edges[ib].isCavity = true;
    }
    stack.push(point);
  }
  return edges;
}

/** Returns bounding box of edges assuming the first edge starts at the origin. */
function getEdgesExtent(edges: Edge[]): [number, number, number, number] {
  let xMin = 0;
  let yMin = 0;
  let xMax = 0;
  let yMax = 0;
  let x = 0;
  let y = 0;
  const n = edges.length - 1; // Skip last edge because it merely closes the polygon.
  for (let i = 0; i < n; ++i) {
    const e = edges[i];
    x += e.dx;
    y += e.dy;
    if (x < xMin) {
      xMin = x;
    } else if (x > xMax) {
      xMax = x;
    }
    if (y < yMin) {
      yMin = y;
    } else if (y > yMax) {
      yMax = y;
    }
  }
  return [xMin, yMin, xMax, yMax];
}

function toPolygon(edges: Edge[], ref: Point): Polygon {
  const polygon: Polygon = [ref];
  const n = edges.length - 1;
  let x = ref[0];
  let y = ref[1];
  for (let i = 0; i < n; ++i) {
    const e = edges[i];
    x += e.dx;
    y += e.dy;
    polygon.push([x, y]);
  }
  return polygon;
}

/** Returns edge merge by angle in [0..2pi] ascending. No structure is shared with the inputs. */
function mergeEdges(a: Edge[], b: Edge[]): Edge[] {
  return a.concat(b).sort((a, b) => getAngleMetric(a.dy, a.dx) - getAngleMetric(b.dy, b.dx));
}

/** Returns the input edge with given sign applied. Original edge isn't affected but may be returned. */
function signEdge(e: Edge, sign: Sign): Edge {
  return sign >= 0 ? e : { ...e, dx: -e.dx, dy: -e.dy, sign: -e.sign as Sign };
}

/** Does the Ghosh version of edge merging, which allows polygon `a` to be non-convex. Return may not be simple. */
function getGhoshEdges(a: Edge[], b: Edge[]): Edge[] {
  const edges: Edge[] = [];
  const merge = mergeEdges(a, b);
  const p0 = merge.findIndex(edge => edge.tag === 'a' && edge.index === 0);
  let p = p0;
  let i: number = 0;
  let dir: Sign = 1;
  do {
    const mp = merge[p]!;
    if (mp.tag === 'a') {
      if (mp.index === i) {
        edges.push(mp);
        if (mp.isTurningPoint) {
          dir = -dir as Sign;
        }
        i++;
      }
    } else {
      edges.push(signEdge(mp, dir));
    }
    p = wrap(p + dir, merge.length);
  } while (p !== p0);
  return edges;
}

function getPolygonExtent(polygon: Polygon): [number, number, number, number] {
  let xMin = Number.POSITIVE_INFINITY;
  let yMin = Number.POSITIVE_INFINITY;
  let xMax = Number.NEGATIVE_INFINITY;
  let yMax = Number.NEGATIVE_INFINITY;
  for (const [x, y] of polygon) {
    if (x < xMin) {
      xMin = x;
    } else if (x > xMax) {
      xMax = x;
    }
    if (y < yMin) {
      yMin = y;
    } else if (y > yMax) {
      yMax = y;
    }
  }
  return [xMin, yMin, xMax, yMax];
}

/**
 * Returns a point that, when used as reference for an edge set, induces a polygon consisting 
 * of the offsets that, when applied to polygon 'b', slides it around the boundary of `a`.
 */
function getMinkowskiDiffReferencePoint(edges: Edge[], a: Polygon, b: Polygon): Point {
  const [edgesXMin, edgesYMin, _edgesXMax, _edgesYMax] = getEdgesExtent(edges);
  const [aXMin, aYMin, _aXMax, _aYMax] = getPolygonExtent(a);
  const [_bXMin, _bYMin, bXMax, bYMax] = getPolygonExtent(b);
  return [aXMin - bXMax - edgesXMin, aYMin - bYMax - edgesYMin];
}

// From paper Fig 6.
export const a: Polygon = [
  [0, 0],
  [20, 0],
  [10, 10],
  [20, 27],
  [6, 20],
];

export const b: Polygon = [
  [0, 0],
  [13, 0],
  [20, 14],
  [6, 27],
];

export const bi: Polygon = [
  [0 + 20, 0 + 27],
  [-13 + 20, 0 + 27],
  [-20 + 20, -14 + 27],
  [-6 + 20, -27 + 27],
];

export function getTestPolygon(): Polygon {
  const aEdges = toEdges(a, +1);
  const bEdges = toEdges(b, -1);
  const g = getGhoshEdges(aEdges, bEdges);
  const ref = getMinkowskiDiffReferencePoint(g, a, b);
  console.log('ghosh', g);
  return toPolygon(g, ref);
}
