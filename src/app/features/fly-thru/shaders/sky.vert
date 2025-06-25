#version 300 es

precision mediump float;

// build_include "constants.h"

layout(std140) uniform SkyboxTransforms {
  mat4 viewRotationProjection;
} transforms;

// Make VScode happy.
#ifndef IN_POSITION_LOCATION
#define IN_POSITION_LOCATION 0
#endif

layout(location = IN_POSITION_LOCATION) in vec3 inPosition;

out vec3 texCoord;

void main() {
  vec4 homogenousPosition = transforms.viewRotationProjection * vec4(inPosition, 1);
  gl_Position = homogenousPosition.xyww; // Clamp z to 1 after perspective division.
  texCoord = vec3(-inPosition.x, inPosition.y, -inPosition.z);
}