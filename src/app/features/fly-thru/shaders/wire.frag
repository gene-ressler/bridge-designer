#version 300 es

precision mediump float;

layout(std140) uniform LightConfig {
  vec3 unitDirection;
  float brightness;
  vec3 color;
  float ambientIntensity;
} light;

in vec3 vertex;
in vec3 direction;
out vec4 fragmentColor;

const vec3 WIRE_COLOR = vec3(0.3f, 0.2f, 0.2f); // coppery
const float WIRE_SHININESS = 30.0;

void main() {
  vec3 unitDirection = normalize(direction);
  vec3 unitEye = normalize(-vertex);
  vec3 unitNormal = normalize(unitEye - dot(unitEye, unitDirection) * unitDirection);
  float normalDotLight = dot(unitNormal, light.unitDirection);
  vec3 unitReflection = normalize(2.0f * normalDotLight * unitNormal - light.unitDirection);
  float specularIntensity = pow(max(dot(unitReflection, unitEye), 0.0f), WIRE_SHININESS);
  float diffuseIntensity = mix(light.ambientIntensity, 1.0f, normalDotLight);
  vec3 color = light.color * (specularIntensity + diffuseIntensity * WIRE_COLOR);
  // TODO: Could add shadows on wires.
  fragmentColor = vec4(light.brightness * color, 1.0f);
}