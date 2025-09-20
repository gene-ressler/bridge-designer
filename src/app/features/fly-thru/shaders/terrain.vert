#version 300 es

// build_include "constants.h"

layout(std140) uniform Transforms {
  mat4 modelView;
  mat4 modelViewProjection;
  mat4 depthMapLookup;
} transforms;

// Make VScode happy.
#ifndef IN_POSITION_LOCATION
#define IN_POSITION_LOCATION 0
#define IN_NORMAL_LOCATION 1
#endif

layout(location = IN_POSITION_LOCATION) in vec3 inPosition;
layout(location = IN_NORMAL_LOCATION) in vec3 inNormal;

out vec3 normal;
out vec4 depthMapLookup;
out float yModelNormal;

void main() {
  vec4 inPositionHomogeneous = vec4(inPosition, 1.0f);
  gl_Position = transforms.modelViewProjection * inPositionHomogeneous;
  normal = mat3(transforms.modelView) * inNormal;
  yModelNormal = inNormal.y;
  depthMapLookup = transforms.depthMapLookup * inPositionHomogeneous;
}
