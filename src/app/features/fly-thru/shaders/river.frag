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

layout(std140) uniform Time {
  // Time that wraps every 32 seconds.
  float clock;
} time;

uniform sampler2D water;
uniform sampler2DShadow depthMap;

in vec3 vertex;
in vec3 normal;
in vec4 depthMapLookup;
in vec2 texCoord;
out vec4 fragmentColor;

// Components must be multiples of 1/32 for smooth time wrapping.
const vec2 WATER_VELOCITY = vec2(1.0f / 32.0f, 3.0f / 32.0f);

void main() {
  vec3 unitNormal = normalize(normal);
  float normalDotLight = dot(unitNormal, light.unitDirection); // Actually constant.
  vec3 unitReflection = normalize(2.0f * normalDotLight * unitNormal - light.unitDirection);
  vec3 unitEye = normalize(-vertex);
  float specularIntensity = pow(max(dot(unitReflection, unitEye), 0.0f), 60.0f);
  float diffuseIntensity = mix(light.ambientIntensity, 1.0f, normalDotLight);
  // fract() may avoid losing shift to float precision.
  vec3 texColor = texture(water, fract(texCoord) + WATER_VELOCITY * time.clock).rgb;
  // build_include "shadow_lookup.h"
  // Make VScode happy.
  #ifndef SHADOW
    float shadow = 1.0f;
  #endif
  vec3 color = light.color * (specularIntensity + diffuseIntensity * texColor);
  fragmentColor = vec4(light.brightness * color * shadow, 1.0f);
}
