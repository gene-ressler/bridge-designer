#version 300 es

precision mediump float;
precision mediump sampler2DShadow;

uniform sampler2DShadow depthMap;

in vec2 texCoord;
out vec4 fragmentColor;

// A negative power of two to avoid precision problems.
const float increment = 1.0f / 8.0f;

void main() {
  // This kludge seems the only way to render depth from a shadow sampler.
  float intensity = 0.0f;
  for(float f = increment; f <= 1.0f; f += increment) {
    intensity += texture(depthMap, vec3(texCoord, f));
  }
  intensity *= increment;
  fragmentColor = vec4(intensity, intensity, intensity, 1.0f);
}
