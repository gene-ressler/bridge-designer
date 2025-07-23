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
                        if len(quad) != 4:
                            print(f"triangles required: {line}")
                            return
                        quad_index = self.quad_index.get(quad)
                        if quad_index == None:
                            self.quad_index[quad] = len(self.quads)
                            self.quads.append(quad)
                    self.faces.append(face)
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


def main():
    obj_files = [f for f in os.listdir(".") if f.endswith(".obj")]
    for obj_file in obj_files:
        with open(obj_file, "r") as in_file:
            path = Path(obj_file).with_suffix(".ts")
            with open(path, "w") as out_file:
                Processor().process(in_file, out_file)


main()
