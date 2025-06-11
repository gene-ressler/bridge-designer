import math

type Vec = tuple[float, float]

# First coordinate must be directly north of (0,0).
RIVER_AXIS_NORTH: list[Vec] = [
    (0, -14),
    (-4, -50),
    (22, -130),
    (80, -190),
]

# First coordinate must be directly south of (0,0).
RIVER_AXIS_SOUTH: list[Vec] = [
    (0, 16),
    (15, 40),
    (-20, 120),
    (80, 180),
]

RIVER_AXIS: list[Vec] = RIVER_AXIS_NORTH[::-1] + RIVER_AXIS_SOUTH
MAJOR_PERIOD = 183.0
MAJOR_MAGNITUDE = 18.0
MINOR_PERIOD = 17.0
MINOR_MAGNITUDE = 7.0

def buildPerturbedAxis(axis: list[Vec], size: int) -> list[Vec]:
    """
    Return a perturbed version of the given polyline axis. Uses a sum of
    sines as offset perpendicular to the unperturbed axis.
    """
    totalLength = 0
    for a, b in zip(axis[1:], axis):
        dx = a[0] - b[0]
        dy = a[1] - b[1]
        totalLength += math.sqrt(dx * dx + dy * dy)

    purturbedAxis = []
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
        purturbedAxis.append(add(p, scale(vp, ofs)))
        s += ds
    return purturbedAxis


def buildRiverAxis(halfSize: float) -> list[Vec]:
    north = buildPerturbedAxis(RIVER_AXIS_NORTH, halfSize)
    south = buildPerturbedAxis(RIVER_AXIS_SOUTH, halfSize)
    north.reverse()
    north.extend(south)
    return north

def fattenAxis(halfWidth: float) -> tuple[list[Vec], list[Vec]]:
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
    return (leftPoints, rightPoints)

def sqr(x: float) -> float:
    return x * x

def length(v: Vec) -> float:
    return math.sqrt(dot(v, v))

def dot(a: Vec, b: Vec) -> float:
    return a[0] * b[0] + a[1] * b[1]

def normalize(v: Vec, factor: float=1) -> float:
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

def main():
    axis = buildRiverAxis(32)
    with open("river.ts", "w") as outFile:
        print("// This file is generated. Edit river.py.", file=outFile)

        # Axis
        print("// prettier-ignore", file=outFile)
        print("export const RIVER_AXIS = new Float32Array([", file=outFile)
        for i, p in enumerate(axis):
            print(f"  {p[0]:.2f}, {p[1]:.2f}, // {i}", file=outFile)
        print("]);", file=outFile)

        # Polygon
        leftPoints, rightPoints = fattenAxis(32)
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

main()
