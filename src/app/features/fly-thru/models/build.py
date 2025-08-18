from pathlib import Path
import math
import os
import re
import sys


class MaterialsLibrary:
    def __init__(self, mtl_file_name):
        print(f"{mtl_file_name}:")
        self.file_name = mtl_file_name
        self.materials = {}
        self.name = "<no name>"
        self.index = 0
        with open(mtl_file_name, "r") as in_file:
            for line in in_file:
                line = re.sub("#.*$", "", line)
                parts = line.split()
                if len(parts) == 0:
                    continue
                match parts:
                    case ["newmtl", name]:
                        self.name = name
                    case ["Kd", x, y, z]:
                        self.add("kd", (x, y, z))
                    case ["Ka", x, y, z]:
                        self.add("ka", (x, y, z))
                    case ["Ks", x, y, z]:
                        self.add("ks", (x, y, z))
                    case ["Ns", value]:
                        self.add("ns", value)
                    case ["Ts", value]:
                        self.add("ts", value)
                    case _:
                        print(f"unknown value: {line}", file=sys.stderr, end="")
                        continue

    def add(self, tag, value):
        if self.name in self.materials:
            self.materials[self.name][tag] = value
        else:
            self.materials[self.name] = {tag: value, "index": self.index}
            self.index += 1

    def get(self, name):
        return self.materials[name]

    def emit(self):
        with open(Path(self.file_name).with_suffix(".ts").name, "w") as out_file:
            print("export const MATERIAL_CONFIG = new Float32Array([", file=out_file)
            print("  // Global alpha and padding", file=out_file)
            print("  1.0, 0, 0, 0,", file=out_file)
            for name, material in self.materials.items():
                kd = material["kd"]
                ns = material["ns"]
                print(f"\n  // {material["index"]}: {name}", file=out_file)
                print(f"  {kd[0]}, {kd[1]}, {kd[2]}, // diffuse rgb", file=out_file)
                print(f"  {ns}, // shininess", file=out_file)
            print("]);", file=out_file)
            print("\nexport const enum Material {", file=out_file)
            for name, material in self.materials.items():
                print(f"  {name} = {material["index"]},", file=out_file)
            print("};", file=out_file)


def unitNormal(polygon):
    normal = [0, 0, 0]
    if len(polygon) < 3:
        return normal
    vq = polygon[-1]
    for vp in polygon:
        normal[0] += (vq[1] - vp[1]) * (vq[2] + vp[2])
        normal[1] += (vq[2] - vp[2]) * (vq[0] + vp[0])
        normal[2] += (vq[0] - vp[0]) * (vq[1] + vp[1])
        vq = vp
    normalLen = math.sqrt(normal[0] ** 2 + normal[1] ** 2 + normal[2] ** 2)
    return tuple(c / normalLen for c in normal)


def buildFlattenToXyMatrix(n):
    nx = n[0]
    ny = n[1]
    nz = n[2]
    d = math.sqrt(ny**2 + nz**2)
    if abs(d) < 1e-5:
        return (
            (0, 0, -nx),
            (0, 1, 0),
            (nx, 0, 0),
        )
    return (
        (d, -nx * ny / d, -nx * nz / d),
        (0, nz / d, -ny / d),
        (nx, ny, nz),
    )


def dot(a, b):
    return a[0] * b[0] + a[1] * b[1] + a[2] * b[2]


def mulVec(a, x):
    return (dot(a[0], x), dot(a[1], x), dot(a[2], x))


def isLeftTurn(ax, ay, bx, by):
    return ax * by - ay * bx >= 0


def areSegmentsLeftTurn(r, q, p):
    return isLeftTurn(q[0] - r[0], q[1] - r[1], p[0] - q[0], p[1] - q[1])


def isPointInTriangle(p, t0, t1, t2):
    return (
        areSegmentsLeftTurn(t0, t1, p)
        and areSegmentsLeftTurn(t1, t2, p)
        and areSegmentsLeftTurn(t2, t0, p)
    )


class Processor:
    def __init__(self):
        self.vertices = [()]
        self.texcoords = [()]
        self.normals = [()]
        # A quad consists of indices: (vertex, texcoord, normal, material).
        self.quads = [()]
        self.quad_index = {}
        self.faces = [()]
        self.material_lib = None
        self.options = {}

    def get_material(self, name):
        return self.material_lib and self.material_lib.get(name)

    def triangulate(self, face):
        if len(face) <= 3:
            return [face]
        triangles = []
        vertices = tuple(self.vertices[quad[0]] for quad in face)
        n = unitNormal(vertices)
        # Flatten to 2d in the x-y plane
        m = buildFlattenToXyMatrix(n)
        flat_vertices = [(mulVec(m, v)[0:2], i) for i, v in enumerate(vertices)]
        while len(flat_vertices) >= 3:
            # Find an ear. Assumes no holes or self-crossings.
            r, q = flat_vertices[-2], flat_vertices[-1]
            for p in flat_vertices:
                if areSegmentsLeftTurn(r[0], q[0], p[0]) and not any(
                    isPointInTriangle(x[0], r[0], q[0], p[0])
                    for x in flat_vertices
                    if x != q and x != r and x != p
                ):
                    # r, q, p is a left turn, so q is an ear
                    triangles.append([face[r[1]], face[q[1]], face[p[1]]])
                    flat_vertices.remove(q)
                    break
                r, q = q, p
        return triangles

    def process(self, in_file, out_file, ignore_tex_coords=True):
        print(f"{in_file.name} -> {out_file.name}:")
        material = {}
        for line in in_file:
            option_match = re.match(r"#\s*option:\s*(\w+)\s*=\s*(\w+)", line)
            if option_match:
                self.options[option_match.group(1)] = option_match.group(2)
            line = re.sub(r"#.*$", "", line)
            parts = line.split()
            if len(parts) == 0:
                continue
            match parts[0]:
                case "v":
                    self.vertices.append(tuple(float(x) for x in parts[1:]))
                case "vn":
                    self.normals.append(tuple(float(x) for x in parts[1:]))
                case "vt":
                    if not ignore_tex_coords:
                        self.texcoords.append(tuple(float(x) for x in parts[1:]))
                case "f":
                    face = []
                    for vertex_spec in parts[1:]:
                        quad = tuple(
                            int(i) if len(i) > 0 else None
                            for i in vertex_spec.split("/")
                        ) + (bool(material) and material["index"],)
                        face.append(quad)
                        quad_index = self.quad_index.get(quad)
                        if quad_index == None:
                            self.quad_index[quad] = len(self.quads)
                            self.quads.append(quad)
                    triangles = self.triangulate(face)
                    self.faces.extend(triangles)
                case "s":
                    if parts[1] != "off":
                        print(f"unknown smooth: {line}", file=sys.stderr)
                    continue
                case "mtllib":
                    if self.material_lib:
                        raise Exception(
                            f"One material lib allowed. Found second: {parts[1]}"
                        )
                    self.material_lib = MaterialsLibrary(parts[1])
                case "usemtl":
                    material = self.get_material(parts[1])
                case "g":
                    print(f"ignore: {line}", end='')
                case _:
                    print(f"unknown command: {line}", file=sys.stderr)
                    continue
        populated = [False, False, False, False]
        for key in self.quad_index.keys():
            for i, index in enumerate(key):
                populated[i] = populated[i] or index != None
        print(f"// Source: {in_file.name}", file=out_file)
        print("// prettier-ignore", file=out_file)
        prefix = Path(in_file.name).stem.replace("-", "_").upper()
        print(f"export const {prefix}_MESH_DATA = {{", file=out_file)
        if populated[0]:
            print(f"  positions: new Float32Array([", file=out_file)
            for index, quad in enumerate(self.quad_index.keys()):
                p = self.vertices[quad[0]]
                print(
                    f"    {p[0]:.3f}, {p[1]:.3f}, {p[2]:.3f}, // {index}", file=out_file
                )
            print("  ]),", file=out_file)
        if populated[1] and not ignore_tex_coords:
            print(f"  texCoords: new Float32Array([", file=out_file)
            for index, quad in enumerate(self.quad_index.keys()):
                p = self.texcoords[quad[1]]
                print(f"    {p[0]:.4f}, {p[1]:.4f}, // {index}", file=out_file)
            print("  ]),", file=out_file)
        if populated[2]:
            if self.options.get("normals", "").lower() == "index":
                print(f"  normalRefs: new Uint16Array([", file=out_file)
                for index, quad in enumerate(self.quad_index.keys()):
                    p = self.normals[quad[2]]
                    print(
                        f"    {quad[2] - 1},  // {index}: {p[0]:.4g}, {p[1]:.4g}, {p[2]:.4g}",
                        file=out_file,
                    )
                print("  ]),", file=out_file)
            else:
                print(f"  normals: new Float32Array([", file=out_file)
                for index, quad in enumerate(self.quad_index.keys()):
                    p = normalize(self.normals[quad[2]])
                    print(
                        f"    {p[0]:.4g}, {p[1]:.4g}, {p[2]:.4g}, // {index}",
                        file=out_file,
                    )
                print("  ]),", file=out_file)
        if populated[3] and self.options.get("materialRefs", "").lower() != "no":
            print(
                f"  materialRefs: new Uint16Array([",
                file=out_file,
            )
            for index, quad in enumerate(self.quad_index.keys()):
                print(f"    {quad[3]}, // {index}", file=out_file)
            print("  ]),", file=out_file)
        print(f"  indices: new Uint16Array([", file=out_file)
        for face in self.faces[1:]:
            i = tuple(self.quad_index.get(f) - 1 for f in face)
            print(f"    {i[0]}, {i[1]}, {i[2]},", file=out_file)
        print("  ]),", file=out_file)
        print("};", file=out_file)
        if self.material_lib:
            self.material_lib.emit()


def normalize(v):
    len = math.sqrt(v[0] ** 2 + v[1] ** 2 + v[2] ** 2)
    return tuple(x / len for x in v)


def main(obj_files=[]):
    if len(obj_files) == 0:
        obj_files = [f for f in os.listdir(".") if f.endswith(".obj")]
    for obj_file in obj_files:
        with open(obj_file, "r") as in_file:
            path = Path(obj_file).with_suffix(".ts")
            with open(path, "w") as out_file:
                Processor().process(in_file, out_file)


main(sys.argv[1:])
