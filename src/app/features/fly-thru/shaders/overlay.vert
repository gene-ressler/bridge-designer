#version 300 es

// build_include "constants.h"

precision mediump float;

layout(std140) uniform Overlay {
  uniform mat3 projection;
  float alpha;
} overlay;

// Make VScode happy.
#ifndef IN_TEX_COORD_LOCATION
#define IN_TEX_COORD_LOCATION 3
#endif

// Serves as both tex coord and positions of overlay corners.
layout(location = IN_TEX_COORD_LOCATION) in vec2 inTexCoord;

out vec2 texCoord;

void main() {
  vec2 position2D = (overlay.projection * vec3(inTexCoord, 1)).xy;
  gl_Position = vec4(position2D, 0, 1);
  texCoord = inTexCoord;
}
