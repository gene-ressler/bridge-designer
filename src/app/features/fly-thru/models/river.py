# Copyright (c) 2025-2026 Gene Ressler
# SPDX-License-Identifier: GPL-3.0-or-later

import math
import sys
import tkinter as tk
from collections.abc import Callable

type Vec = tuple[float, float]
type Triangle = tuple[Vec, Vec, Vec]
type Box = tuple[float, float, float, float]

# Terrain y (north-south) size.
Y_HALF_SIZE = 192

# First coordinate must be directly north of (0,0).
RIVER_AXIS_NORTH: list[Vec] = [(0, -14), (-4, -50), (22, -130), (80, -Y_HALF_SIZE)]

# First coordinate must be directly south of (0,0).
RIVER_AXIS_SOUTH: list[Vec] = [(0, 16), (15, 40), (-20, 120), (80, Y_HALF_SIZE)]

RIVER_AXIS: list[Vec] = RIVER_AXIS_NORTH[::-1] + RIVER_AXIS_SOUTH

# Meander parameters.
MAJOR_PERIOD = 183.0
MAJOR_MAGNITUDE = 18.0
MINOR_PERIOD = 17.0
MINOR_MAGNITUDE = 7.0

# Number of points required in the perturbed axis.
AXIS_POINT_COUNT = 32

# Half-width of polygon big enough to cover all river meanders.
POLYGON_HALF_WIDTH = 32


def buildPerturbedAxis(axis: list[Vec], size: int) -> list[Vec]:
    """
    Returns a perturbed version of the given polyline axis. Uses a sum of
    sines as offset perpendicular to the unperturbed axis.
    """
    totalLength = 0
    for a, b in zip(axis[1:], axis):
        dx = a[0] - b[0]
        dy = a[1] - b[1]
        totalLength += math.sqrt(dx * dx + dy * dy)

    perturbedAxis = []
    ds = totalLength / (size - 1)
    iSeg = -1
    s = sSegStart = sSegEnd = segLength = 0.0
    v = None
    vp = None
    for count in range(size):
        # Advance to next axis segment as needed.
        if s >= sSegEnd and iSeg + 1 < len(axis) - 1:
            iSeg += 1
            sSegStart = sSegEnd
            d = sub(axis[iSeg + 1], axis[iSeg])
            segLength = length(d)
            sSegEnd += segLength
            v = normalize(d)
            vp = perp(v)
        sSeg = s - sSegStart
        tSeg = sSeg / segLength
        p = add(axis[iSeg], scale(v, sSeg))
        ofs = MAJOR_MAGNITUDE * math.sin(
            s / MAJOR_PERIOD * 2 * math.pi
        ) + MINOR_MAGNITUDE * math.sin(s / MINOR_PERIOD * 2 * math.pi)
        # Reduce offset near segment ends.
        ofs *= math.sin(tSeg * math.pi)
        perturbedAxis.append(add(p, scale(vp, ofs)))
        s += ds
    return perturbedAxis


def buildRiverAxis(halfSize: float = AXIS_POINT_COUNT) -> list[Vec]:
    """
    Perturbs the halves of the axis north and south of the bridge site
    and glues them together.
    """
    north = buildPerturbedAxis(RIVER_AXIS_NORTH, halfSize)
    south = buildPerturbedAxis(RIVER_AXIS_SOUTH, halfSize)
    north.reverse()
    north.extend(south)
    return north


def stretchToBoundary(pts: list[Vec], ip: int, iq: int, toY: float) -> None:
    """
    Linearly stretches or shrinks given endpoints of polyline to given y-coordinate.
    """
    p = pts[ip]
    q = pts[iq]
    t = (toY - q[1]) / (p[1] - q[1])
    pts[ip] = (q[0] + t * (p[0] - q[0]), toY)


def fattenAxis(halfWidth: float = POLYGON_HALF_WIDTH) -> tuple[list[Vec], list[Vec]]:
    """
    Returns a "fat" version of the polyline river axis (centerline).
    """
    axis = RIVER_AXIS
    ofs = normalize(perp(sub(axis[1], axis[0])), halfWidth)
    leftPoints = [add(axis[0], ofs)]
    rightPoints = [add(axis[0], neg(ofs))]
    for a, b, c in zip(axis[2:], axis[1:], axis):
        pab = normalize(perp(sub(a, b)))
        pbc = normalize(perp(sub(b, c)))
        ofs = normalize(add(pab, pbc), halfWidth / math.sqrt(0.5 * (1 + dot(pab, pbc))))
        leftPoints.append(add(b, ofs))
        rightPoints.append(add(b, neg(ofs)))
    ofs = normalize(perp(sub(axis[-1], axis[-2])), halfWidth)
    leftPoints.append(add(axis[-1], ofs))
    rightPoints.append(add(axis[-1], neg(ofs)))
    # Move endpoints linearly to y boundaries. Nicer than clipping.
    stretchToBoundary(leftPoints, 0, 1, -Y_HALF_SIZE)
    stretchToBoundary(leftPoints, -1, -2, Y_HALF_SIZE)
    stretchToBoundary(rightPoints, 0, 1, -Y_HALF_SIZE)
    stretchToBoundary(rightPoints, -1, -2, Y_HALF_SIZE)
    return (leftPoints, rightPoints)


def sqr(x: float) -> float:
    return x * x


def length(v: Vec) -> float:
    return math.sqrt(dot(v, v))


def dot(a: Vec, b: Vec) -> float:
    return a[0] * b[0] + a[1] * b[1]


def normalize(v: Vec, factor: float = 1) -> float:
    return scale(v, factor / length(v))


def scale(a: Vec, s: float) -> Vec:
    return (a[0] * s, a[1] * s)


def add(a: Vec, b: Vec) -> Vec:
    return (a[0] + b[0], a[1] + b[1])


def sub(a: Vec, b: Vec) -> Vec:
    return (a[0] - b[0], a[1] - b[1])


def neg(a: Vec) -> Vec:
    return (-a[0], -a[1])


def perp(a: Vec) -> Vec:
    return (-a[1], a[0])


def emitTypescript() -> None:
    with open("river.ts", "w") as outFile:
        axis = buildRiverAxis()
        print("// This file is generated. Edit river.py.", file=outFile)

        # Axis
        print("// prettier-ignore", file=outFile)
        print("export const RIVER_AXIS = new Float32Array([", file=outFile)
        for i, p in enumerate(axis):
            print(f"  {p[0]:.2f}, {p[1]:.2f}, // {i}", file=outFile)
        print("]);", file=outFile)

        # Polygon
        leftPoints, rightPoints = fattenAxis()
        print("// prettier-ignore", file=outFile)
        print("export const RIVER_MESH_DATA = {", file=outFile)
        print("  positions: new Float32Array([", file=outFile)
        for i, p in enumerate(leftPoints):
            print(f"    {p[0]:.2f}, {p[1]:.2f}, // {i}", file=outFile)
        for i, p in enumerate(rightPoints):
            print(f"    {p[0]:.2f}, {p[1]:.2f}, // {i + len(leftPoints)}", file=outFile)
        print("  ]),", file=outFile)
        print("  indices: new Uint16Array([", file=outFile)
        for i in range(len(leftPoints) - 1):
            se = i
            ne = se + 1
            sw = i + len(leftPoints)
            nw = sw + 1
            print(f"    {sw}, {ne}, {nw},", file=outFile)
            print(f"    {ne}, {sw}, {se},", file=outFile)
        print("  ]),", file=outFile)
        print("};", file=outFile)


def getBoundingBox(pts: list[Vec]) -> Box:
    xMin = xMax = pts[0][0]
    yMin = yMax = pts[0][1]
    for p in pts:
        px = p[0]
        py = p[1]
        if px < xMin:
            xMin = px
        if px > xMax:
            xMax = px
        if py < yMin:
            yMin = py
        if py > yMax:
            yMax = py
    return (xMin, xMax - xMin, yMin, yMax - yMin)


def dist2(a: Vec, b: Vec) -> float:
    return sqr(b[0] - a[0]) + sqr(b[1] - a[1])


# Not currently used.
def clipTriangle(
    t: Triangle, boundaryY: float, isInside: Callable[[float, float], bool]
) -> list[Triangle]:
    def intersect(a, b):
        t = (boundaryY - a[1]) / (b[1] - a[1])
        return (a[0] + t * (b[0] - a[0]), boundaryY)

    # Tally inside points and find an inside and outside point if existent.
    inside = -1
    outside = -1
    insideCount = 0
    for i, p in enumerate(t):
        if isInside(p[1], boundaryY):
            inside = i
            insideCount += 1
        else:
            outside = i
    # Handle cases
    if insideCount == 0:
        return []
    if insideCount == 3:
        return [t]
    if insideCount == 1:  # i is the only inside
        i = inside
        j = (i + 1) % 3
        k = (j + 1) % 3
        return [(t[i], intersect(t[i], t[j]), intersect(t[i], t[k]))]
    else:
        i = outside
        j = (i + 1) % 3
        k = (j + 1) % 3
        jIsect = intersect(t[i], t[j])
        kIsect = intersect(t[i], t[k])
        if dist2(t[j], kIsect) < dist2(t[k], jIsect):
            return [(t[j], kIsect, jIsect), (t[j], t[k], kIsect)]
        else:
            return [(t[k], kIsect, jIsect), (t[k], jIsect, t[j])]


def preview():
    winSize = 1000

    root = tk.Tk()
    root.title("River mesh preview")
    canvas = tk.Canvas(root, width=winSize, height=winSize, bg="white")
    canvas.pack()

    leftPoints, rightPoints = fattenAxis()
    bb = getBoundingBox(leftPoints + rightPoints)
    print(bb)

    margin = 32

    scale = (winSize - 2 * margin) / max(bb[1], bb[3])
    xOfs = -bb[0]
    yOfs = -bb[2]

    def vpX(x):
        return margin + scale * (x + xOfs)

    def vpY(y):
        return winSize - margin - scale * (y + yOfs)

    def vp(p):
        return (vpX(p[0]), vpY(p[1]))

    # Boundaries
    for y in [-Y_HALF_SIZE, Y_HALF_SIZE]:
        yp = vpY(y)  # boundary
        canvas.create_line((0, yp), (1000, yp), fill="red", arrow=tk.LAST)

    # Axis
    axis = buildRiverAxis()
    canvas.create_line(list(map(vp, axis)), fill="green")

    # Triangulated polygon
    triangles = []
    for i in range(len(leftPoints) - 1):
        se = leftPoints[i]
        ne = leftPoints[i + 1]
        sw = rightPoints[i]
        nw = rightPoints[i + 1]
        triangles.extend([(sw, ne, nw), (ne, sw, se)])

    for triangle in triangles:
        canvas.create_polygon(list(map(vp, triangle)), fill="", outline="black")

    root.mainloop()


if __name__ == "__main__":
    if len(sys.argv) > 1 and sys.argv[1] == "--preview":
        preview()
    else:
        emitTypescript()
