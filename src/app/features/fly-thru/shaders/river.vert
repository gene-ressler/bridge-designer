#version 300 es

precision mediump float;

// build_include "constants.h"

layout(std140) uniform Transforms {
  mat4 modelView;
  mat4 modelViewProjection;
  mat4 depthMapLookup;
} transforms;

layout(std140) uniform Time {
  // Time that wraps every 32 seconds to avoid precision problems.
  float clock;
} time;

// Make VScode happy.
#ifndef IN_POSITION_LOCATION
#define IN_POSITION_LOCATION 0
#endif

layout(location = IN_POSITION_LOCATION) in vec2 inPosition;

out vec3 vertex;
out vec3 normal;
out vec4 depthMapLookup;
out vec2 texCoord;

// Smaller scale makes texture appear larger.
const float TEX_SCALE = 0.2;

// Components must be multiples of 1/32 for smooth time wrapping.
const vec2 WATER_VELOCITY = vec2(1.0f / 32.0f, 3.0f / 32.0f);

void main() {
  vec4 inPositionHomogeneous = vec4(inPosition.x, 0.0f, inPosition.y, 1.0f);
  gl_Position = transforms.modelViewProjection * inPositionHomogeneous;
  vertex = vec3(transforms.modelView * inPositionHomogeneous);
  normal = mat3(transforms.modelView) * vec3(0.0f, 1.0f, 0.0f);
  depthMapLookup = transforms.depthMapLookup * inPositionHomogeneous;
  texCoord = TEX_SCALE * inPosition + WATER_VELOCITY * time.clock;
}
