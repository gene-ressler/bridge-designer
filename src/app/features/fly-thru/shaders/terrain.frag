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

uniform sampler2DShadow depthMap;

in vec3 normal;
in vec4 depthMapLookup;
in float yModelNormal;
out vec4 fragmentColor;

const vec3 NORMAL_TERRAIN_COLOR = 0.6f * vec3(0.13f, 0.4f, 0.33f);
const vec3 ERODED_TERRAIN_COLOR = 0.6f * vec3(0.87f, 0.78f, 0.52f);
const vec3 EROSION_DIFF = NORMAL_TERRAIN_COLOR - ERODED_TERRAIN_COLOR;

void main() {
  vec3 unitNormal = normalize(normal);
  float normalDotLight = dot(unitNormal, light.unitDirection);
  // Adjusting ambient intensity makes terrain more dramatic.
  float adjustedAmbientIntensity = light.ambientIntensity * 0.2f;
  float diffuseIntensity = (1.0f - adjustedAmbientIntensity) * clamp(normalDotLight, 0.0f, 1.0f) + adjustedAmbientIntensity;
  // Powering up makes the erosion effect more visible.
  float normalTerrainColorWeight = pow(yModelNormal, 6.0f);
  vec3 color = ERODED_TERRAIN_COLOR + EROSION_DIFF * normalTerrainColorWeight;
  fragmentColor = light.brightness * vec4(diffuseIntensity * color * light.color, 1.0f);
  if(light.shadowWeight < 1.0f) {
    float shadow = /*light.shadowWeight + (1.0 - light.shadowWeight) * */textureProj(depthMap, depthMapLookup);
    fragmentColor *= shadow;
  }
}
