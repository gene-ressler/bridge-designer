#version 300 es

precision mediump float;

layout(std140) uniform LightConfig {
  vec3 unitDirection;
  vec3 color;
  float ambientIntensity;
} light;

in vec3 normal;
in float yModelNormal;
out vec4 fragmentColor;

const vec3 NORMAL_TERRAIN_COLOR = vec3(0.13f, 0.59f, 0.33f);
const vec3 ERODED_TERRAIN_COLOR = vec3(0.87f, 0.78f, 0.52f);
const vec3 EROSION_DIFF = NORMAL_TERRAIN_COLOR - ERODED_TERRAIN_COLOR;

void main() {
  vec3 unitNormal = normalize(normal);
  float normalDotLight = dot(unitNormal, light.unitDirection);
  // Ignoring ambient intensity makes terrain more dramatic.
  float diffuseIntensity = clamp(normalDotLight, 0.0f, 1.0f);
  // Powering up makes the erosion effect more visible.
  float normalTerrainColorWeight = pow(yModelNormal,4.0);
  vec3 color = ERODED_TERRAIN_COLOR + EROSION_DIFF * normalTerrainColorWeight;
  fragmentColor = vec4(diffuseIntensity * color * light.color, 1.0f);
}