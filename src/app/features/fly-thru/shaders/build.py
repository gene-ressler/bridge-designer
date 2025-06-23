import os
import re
import sys

"""
Builds shaders.ts and constants.h.

Converts each .vert and .frag file content to a multiline string, processing include directives, 
preserving line numbers of the top level file.
"""


def readFileWithIncludes(file_name, depth=0):
    if depth > 3:
        raise Exception("Recursion too deep")
    with open(file_name, "r") as input:
        lines = input.readlines()
        for index, line in enumerate(lines):
            include_match = re.search(r'build_include\s+"([^"]+)"$', line)
            if include_match:
                lines[index] = (
                    f"{readFileWithIncludes(include_match.group(1), depth + 1)}#line {index + 2}\n"
                )
        return "".join(lines)


def processDefines(text):
    matches = re.findall(r"#define\s+(\w+)\s+(.*)", text)
    text = re.sub(r"#define .*", "", text)
    for token, replacement in matches:
        text = text.replace(token, replacement)
    print(text)
    return text


def main(noCompress, noProcessDefines):
    # Build constants.h from constants.ts. First so shader includes see any changes.
    with open("constants.ts", "r") as input:
        with open("constants.h", "w") as output:
            print("// This file is generated. Edit constants.ts instead.", file=output)
            for line in input.readlines():
                if "build_stop_translation" in line:
                    break
                lineStripped = line.strip()
                if len(lineStripped) == 0 or lineStripped.startswith("//"):
                    continue
                line = re.sub(
                    r"export\s+const\s+(\w+)\s*=\s*([^;]+);", r"#define \1 \2", line
                )
                print(line, end="", file=output)

    shader_files = [f for f in os.listdir(".") if f.endswith((".vert", ".frag"))]
    # Sort key puts vertex before fragment shaders for readability.
    shader_files.sort(key=lambda file: file.replace(".vert", ".VERT"))
    with open("shaders.ts", "w") as output:
        print(
            "// This file is generated. Edit .vert and .frag files instead.",
            file=output,
        )
        file_count = 0
        for file_name in shader_files:
            print(f"{file_name}:")
            file_count += 1
            text = readFileWithIncludes(file_name)
            if not noProcessDefines:
                text = processDefines(text)
            var_name = os.path.splitext(file_name)[0].upper().replace("-", "_")
            if file_name.endswith(".vert"):
                var_name += "_VERTEX_SHADER"
            elif file_name.endswith(".frag"):
                var_name += "_FRAGMENT_SHADER"
            if not noCompress:
                text = re.sub(r"#line.*", "", text)  # elide line directive
                text = re.sub(r"#ifndef[\s\S]*?#endif", "", text)  # assume ifndef false
                text = re.sub(r"//[^\n]*\n", " ", text)  # elide comments
                text = re.sub(r"(#.*)", r"\1@", text)  # protect directive newlines
                text = re.sub(r"\s+", " ", text)  # compress spaces including newlines
                text = re.sub(r"\s?([=,*+\-/{}()])\s?", r"\1", text)  # unneeded spaces
                text = re.sub(r"@", r"\n", text)  # unprotect directives
                text = re.sub(r"^ ", r"", text, flags=re.MULTILINE)  # elide lead space
                text = re.sub(r"; ", ";\n", text)  # add readability break after ;
                text = re.sub(r"{", "{\n", text)  # add readability break after {
            if file_count > 1:
                print(file=output)
            print(f"export const {var_name} = ", file=output)
            print(f"`{text}`;", file=output)

            uniforms = {}
            ins = {}
            if not file_name.endswith(".vert"):
                continue

            matches = re.findall(r"uniform\s+(\w+)\s+(\w+)", text)
            for match in matches:
                uniformType, uniformId = match
                if uniformId in uniforms or uniformId in ins:
                    print(f'  redefinition of "{uniformId}"')
                uniforms[uniformId] = uniformType

            matches = re.findall(
                r"layout\s+\(location\s+=\s+(\d+)\)\s+in\s+(\w+)\s+(\w+)", text
            )
            for match in matches:
                inLocation, inType, inId = match
                if inId in uniforms or inId in ins:
                    print(f' redefinition of "{inId}"')
                ins[inId] = (inLocation, inType)


main("--no-compress" in sys.argv, "--no-process-defines" in sys.argv)
