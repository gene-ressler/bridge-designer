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

// Pack struct manually into vec4s to work around known hardware bugs.
struct MaterialSpec {
  #define COLOR spec.xyz
  #define SHININESS spec.w
  vec4 spec;
};

layout(std140) uniform MaterialConfig {
  float globalAlpha;
  MaterialSpec specs[12];
} materialConfig;

uniform sampler2DShadow depthMap;

in vec3 vertex;
in vec3 normal;
in vec4 depthMapLookup;
flat in uint materialRef;
out vec4 fragmentColor;

void main() {
  vec3 unitNormal = normalize(normal);
  float normalDotLight = dot(unitNormal, light.unitDirection);
  vec3 unitReflection = normalize(2.0f * normalDotLight * unitNormal - light.unitDirection);
  vec3 unitEye = normalize(-vertex);
  MaterialSpec materialSpec = materialConfig.specs[materialRef];
  float specularIntensity = pow(max(dot(unitReflection, unitEye), 0.0f), materialSpec.SHININESS);
  float diffuseIntensity = mix(light.ambientIntensity, 1.0f, normalDotLight);
  // build_include "shadow_lookup.h"
  // Make VScode happy.
  #ifndef SHADOW
    float shadow = 1.0f;
  #endif
  vec3 color = light.color * (specularIntensity + diffuseIntensity * materialSpec.COLOR);
  fragmentColor = vec4(light.brightness * color * shadow, materialConfig.globalAlpha);
}