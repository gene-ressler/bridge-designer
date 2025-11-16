"use strict";
var __assign = (this && this.__assign) || function () {
    __assign = Object.assign || function(t) {
        for (var s, i = 1, n = arguments.length; i < n; i++) {
            s = arguments[i];
            for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p))
                t[p] = s[p];
        }
        return t;
    };
    return __assign.apply(this, arguments);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.bi = exports.b = exports.a = void 0;
exports.getTestPolygon = getTestPolygon;
/** Returns [0..8) for polar angle comparisons of vectors. A cheaper alternative to atan2(). */
function getAngleMetric(y, x) {
    var rtn = x >= 0
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
function wrap(i, n) {
    return i < 0 ? i + n : i >= n ? i - n : i;
}
/** Returns a metric that's negative if edge `e` makes a "left turn"  wrt  edge `d` and vice versa. */
function getTurn(d, e) {
    var dex = d.dx;
    var dey = d.dy;
    var dfx = dex + e.dx;
    var dfy = dey + e.dy;
    return dex * dfy - dey * dfx;
}
function isBelowOrLeftOf(a, b) {
    return a[1] < b[1] || (a[1] === b[1] && a[0] < b[0]);
}
/** Returns index of bottom left point of polygon or zero if polygon is empty. */
function findPolygonBottomLeft(polygon) {
    var rtn = 0;
    for (var i = 1; i < polygon.length; ++i) {
        if (isBelowOrLeftOf(polygon[i], polygon[rtn])) {
            rtn = i;
        }
    }
    return rtn;
}
/** Returns an edge representation of the given polygon with given sign. */
function toEdges(polygon, sign) {
    var tag = sign === 1 ? 'a' : 'b';
    var edges = [];
    var iStart = findPolygonBottomLeft(polygon);
    var len = polygon.length;
    for (var i = 0, iq = iStart, ip = wrap(iq + 1, len); i < len; ++i, iq = ip, ip = wrap(ip + 1, len)) {
        var pq = polygon[iq];
        var pp = polygon[ip];
        edges.push({
            tag: tag,
            index: i,
            dx: sign * (pp[0] - pq[0]),
            dy: sign * (pp[1] - pq[1]),
            sign: 1,
            isTurningPoint: false,
            isCavity: false,
        });
    }
    // TODO: Delete after debugging.
    var tmp = setIsCavity(setIsTurningPoint(edges));
    console.log('edges', sign, tmp);
    return tmp;
}
function setIsTurningPoint(edges) {
    if (edges.length >= 3) {
        for (var ir = edges.length - 2, iq = ir + 1, ip = 0; ip < edges.length; ir = iq, iq = ip++) {
            var ep = edges[ip];
            var eq = edges[iq];
            var er = edges[ir];
            // Paper would have this as er, but it's wrong.
            eq.isTurningPoint = getTurn(er, eq) >= 0 !== getTurn(eq, ep) >= 0;
        }
    }
    return edges;
}
/** Return turn metric for (r)--->(q)--->(p). This is (q-r)X(    if (y > y1) {
      y1 = y;
    }
p-q). */
function pointsTurn(r, q, p) {
    var adx = q.x - r.x;
    var ady = q.y - r.y;
    var bdx = p.x - q.x;
    var bdy = p.y - q.y;
    return adx * bdy - ady * bdx;
}
/**
 * Sets the `isCavity` of each given edge in the given list and returns it.
 * It's assumed that the first edge starts at a bottom vertex and the last closes the polygon.
 * This is a customized Graham Scan to find convex hull edges. Others are cavity edges.
 */
function setIsCavity(edges) {
    var x = 0;
    var y = 0;
    var points = [];
    for (var i = 0; i < edges.length - 1; ++i) {
        var e = edges[i];
        x += e.dx;
        y += e.dy;
        points.push({ x: x, y: y, inEdgeIndex: i });
    }
    points.sort(function (a, b) { return getAngleMetric(a.y, a.x) - getAngleMetric(b.y, b.x); });
    var stack = [{ x: 0, y: 0, inEdgeIndex: edges.length - 1 }];
    for (var _i = 0, points_1 = points; _i < points_1.length; _i++) {
        var point = points_1[_i];
        while (stack.length > 1 && pointsTurn(stack[stack.length - 2], stack[stack.length - 1], point) < 0) {
            var top_1 = stack.pop();
            var ia = top_1.inEdgeIndex;
            var ib = wrap(ia + 1, edges.length);
            edges[ia].isCavity = edges[ib].isCavity = true;
        }
        stack.push(point);
    }
    return edges;
}
/** Returns bounding box of edges assuming the first edge starts at the origin. */
function getEdgesExtent(edges) {
    var xMin = 0;
    var yMin = 0;
    var xMax = 0;
    var yMax = 0;
    var x = 0;
    var y = 0;
    var n = edges.length - 1; // Skip last edge because it merely closes the polygon.
    for (var i = 0; i < n; ++i) {
        var e = edges[i];
        x += e.dx;
        y += e.dy;
        if (x < xMin) {
            xMin = x;
        }
        else if (x > xMax) {
            xMax = x;
        }
        if (y < yMin) {
            yMin = y;
        }
        else if (y > yMax) {
            yMax = y;
        }
    }
    return [xMin, yMin, xMax, yMax];
}
function toPolygon(edges, ref) {
    var polygon = [ref];
    var n = edges.length - 1;
    var x = ref[0];
    var y = ref[1];
    for (var i = 0; i < n; ++i) {
        var e = edges[i];
        x += e.dx;
        y += e.dy;
        polygon.push([x, y]);
    }
    return polygon;
}
/** Returns edge merge by angle in [0..2pi] ascending. No structure is shared with the inputs. */
function mergeEdges(a, b) {
    return a.concat(b).sort(function (a, b) { return getAngleMetric(a.dy, a.dx) - getAngleMetric(b.dy, b.dx); });
}
/** Returns the input edge with given sign applied. Original edge isn't affected but may be returned. */
function signEdge(e, sign) {
    return sign >= 0 ? e : __assign(__assign({}, e), { dx: -e.dx, dy: -e.dy, sign: -e.sign });
}
/** Does the Ghosh version of edge merging, which allows polygon `a` to be non-convex. Return may not be simple. */
function getGhoshEdges(a, b) {
    var edges = [];
    var merge = mergeEdges(a, b);
    var p0 = merge.findIndex(function (edge) { return edge.tag === 'a' && edge.index === 0; });
    var p = p0;
    var i = 0;
    var dir = 1;
    do {
        var mp = merge[p];
        if (mp.tag === 'a') {
            if (mp.index === i) {
                edges.push(mp);
                if (mp.isTurningPoint) {
                    dir = -dir;
                }
                i++;
            }
        }
        else {
            edges.push(signEdge(mp, dir));
        }
        p = wrap(p + dir, merge.length);
    } while (p !== p0);
    return edges;
}
function getPolygonExtent(polygon) {
    var xMin = Number.POSITIVE_INFINITY;
    var yMin = Number.POSITIVE_INFINITY;
    var xMax = Number.NEGATIVE_INFINITY;
    var yMax = Number.NEGATIVE_INFINITY;
    for (var _i = 0, polygon_1 = polygon; _i < polygon_1.length; _i++) {
        var _a = polygon_1[_i], x = _a[0], y = _a[1];
        if (x < xMin) {
            xMin = x;
        }
        else if (x > xMax) {
            xMax = x;
        }
        if (y < yMin) {
            yMin = y;
        }
        else if (y > yMax) {
            yMax = y;
        }
    }
    return [xMin, yMin, xMax, yMax];
}
/**
 * Returns a point that, when used as reference for an edge set, induces a polygon that
 * represents a set of offsets that, when applied to polygon 'b', is the path that `b`'s
 * reference point takes when sliding around the boundary of `a`.
 */
function getMinkowskiDiffReferencePoint(edges, a, b) {
    var _a = getEdgesExtent(edges), edgesXMin = _a[0], edgesYMin = _a[1], _edgesXMax = _a[2], _edgesYMax = _a[3];
    var _b = getPolygonExtent(a), aXMin = _b[0], aYMin = _b[1], _aXMax = _b[2], _aYMax = _b[3];
    var _c = getPolygonExtent(b), _bXMin = _c[0], _bYMin = _c[1], bXMax = _c[2], bYMax = _c[3];
    return [aXMin - bXMax - edgesXMin, aYMin - bYMax - edgesYMin];
}
// From paper Fig 6.
exports.a = [
    [0, 0],
    [20, 0],
    [10, 10],
    [20, 27],
    [6, 20],
];
exports.b = [
    [0, 0],
    [13, 0],
    [20, 14],
    [6, 27],
];
exports.bi = [
    [0 + 20, 0 + 27],
    [-13 + 20, 0 + 27],
    [-20 + 20, -14 + 27],
    [-6 + 20, -27 + 27],
];
function getTestPolygon() {
    var aEdges = toEdges(exports.a, +1);
    var bEdges = toEdges(exports.b, -1);
    var g = getGhoshEdges(aEdges, bEdges);
    var ref = getMinkowskiDiffReferencePoint(g, exports.a, exports.b);
    console.log('ghosh', g);
    return toPolygon(g, ref);
}
