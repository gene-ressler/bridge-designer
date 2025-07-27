#version 300 es

// build_include "constants.h"

precision mediump float;

// Make VScode happy.
#ifndef IN_POSITION_LOCATION
#define IN_POSITION_LOCATION 0
#define IN_ALPHA_LOCATION 2
#define IN_TEX_COORD_LOCATION 3
#endif

// Per instance
layout(location = IN_POSITION_LOCATION) in vec4 inPosition; // (x, y, xScale, yScale)
layout(location = IN_ALPHA_LOCATION) in float inAlpha; // (depthIndex, alpha)

// Fixed
layout(location = IN_TEX_COORD_LOCATION) in vec2 inTexCoord; 

out vec3 texCoord;
out float alpha;

void main() {
  float xScale = inPosition[2];
  float yScale = inPosition[3];
  gl_Position = vec4(inTexCoord.x * xScale + inPosition.x, inTexCoord.y * yScale + inPosition.y, 0, 1);
  texCoord = vec3(inTexCoord, gl_InstanceID);
  alpha = inAlpha;
}
