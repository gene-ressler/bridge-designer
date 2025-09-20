#version 300 es

// build_include "constants.h"

precision mediump float;

// Make VScode happy.
#ifndef IN_POSITION_LOCATION
#define IN_POSITION_LOCATION 0
#endif

// Use location 0. Some graphics cards don't like starting higher.
layout(location = IN_POSITION_LOCATION) in vec2 inTexCoord;

out vec2 texCoord;

void main() {
  texCoord = inTexCoord;
  gl_Position = vec4(inTexCoord * 2.0f - 1.0f, 0, 1.0f);
}