#version 300 es

precision mediump float;
precision mediump sampler2DShadow;

layout(std140) uniform LightConfig {
  vec3 unitDirection;
  float brightness;
  vec3 color;
  float ambientIntensity;
  float shadowWeight;
  float globalAlpha;
} light;

uniform sampler2D water;
uniform sampler2DShadow depthMap;

in vec3 vertex;
in vec3 normal;
in vec4 depthMapLookup;
in vec2 texCoord;
out vec4 fragmentColor;

void main() {
  vec3 texColor = texture(water, texCoord).rgb;

  #define ARG_materialColor texColor
  #define ARG_materialShininess 40.0f
  #define ARG_materialAlpha 1.0f

  // build_include "lighting.h"
}
