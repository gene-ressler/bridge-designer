#version 300 es

// build_include "constants.h"

precision mediump float;

layout(std140) uniform Overlay {
  uniform mat3 projection;
  float alpha;
} overlay;

// Make VScode happy.
#ifndef IN_POSITION_LOCATION
#define IN_POSITION_LOCATION 3
#endif

// Serves as both tex coord and positions of overlay corners.
layout(location = IN_POSITION_LOCATION) in vec2 inPosition;

out vec2 texCoord;

void main() {
  vec2 position2D = (overlay.projection * vec3(inPosition, 1)).xy;
  gl_Position = vec4(position2D, 0, 1);
  texCoord = inPosition;
}
