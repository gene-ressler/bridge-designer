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

// Build a rotation for the sky box texture lookup so sun position matches lighting.
// Determined experimentally to match light in rendering/constants.ts.
const float SUN_AZIMUTH = 118.0 * 0.01745329251;
const float S = sin(SUN_AZIMUTH); // 1
const float C = cos(SUN_AZIMUTH); // 0
const mat3 SUN_ROTATION = mat3(
  C, 0, -S, // column 0 
  0, 1, 0,  // column 1 
  S, 0, C   // column 2
);

void main() {
  vec4 homogenousPosition = transforms.viewRotationProjection * vec4(inPosition, 1);
  gl_Position = homogenousPosition.xyww; // Clamp z to 1 after perspective division.
  texCoord = SUN_ROTATION * inPosition;
}
