#version 300 es

precision mediump float;
precision mediump sampler2DShadow;

layout(std140) uniform LightConfig {
  vec3 unitDirection;
  float brightness;
  vec3 color;
  float ambientIntensity;
  float shadowWeight;
} light;

uniform sampler2D meshTexture;
uniform sampler2DShadow depthMap;

in vec3 normal;
in vec4 depthMapLookup;
in vec2 texCoord;
out vec4 fragmentColor;

void main() {
  vec3 unitNormal = normalize(normal);
  float normalDotLight = dot(unitNormal, light.unitDirection);
  float diffuseIntensity = (1.0f - light.ambientIntensity) * clamp(normalDotLight, 0.0f, 1.0f) + light.ambientIntensity;
  vec3 materialColor = texture(meshTexture, texCoord).rgb;
  // build_include "shadow_lookup.h"
  // Make VScode happy.
  #ifndef SHADOW
    float shadow = 1.0f;
  #endif
  vec3 color = diffuseIntensity * materialColor * light.color;
  fragmentColor = vec4(light.brightness * color * shadow, 1.0f);
}
