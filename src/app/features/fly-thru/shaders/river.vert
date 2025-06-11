#version 300 es

// build_include "constants.h"

layout(std140) uniform Transforms {
  mat4 modelView;
  mat4 modelViewProjection;
} transforms;

// Make VScode happy.
#ifndef IN_POSITION_LOCATION
#define IN_POSITION_LOCATION 0
#endif

layout(location = IN_POSITION_LOCATION) in vec2 inPosition;

out vec3 vertex;
out vec3 normal;

void main() {
  // TODO: Add ripples.
  vec4 inPositionHomogeneous = vec4(inPosition.x, 0.0f, inPosition.y, 1.0f);
  gl_Position = transforms.modelViewProjection * inPositionHomogeneous;
  vertex = vec3(transforms.modelView * inPositionHomogeneous);
  normal = mat3(transforms.modelView) * vec3(0.0f, 1.0f, 0.0f);
}
