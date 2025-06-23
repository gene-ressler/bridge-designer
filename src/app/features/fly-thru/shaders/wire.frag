#version 300 es

precision mediump float;

layout(std140) uniform LightConfig {
  vec3 unitDirection;
  vec3 color;
  float ambientIntensity;
} light;

in vec3 vertex;
in vec3 direction;
out vec4 fragmentColor;

const vec3 WIRE_COLOR = vec3(0.5f, 0.3f, 0.3f);
const float WIRE_SHININESS = 10.0;

void main() {
  vec3 unitDirection = normalize(direction);
  vec3 unitEye = normalize(-vertex);
  vec3 unitNormal = unitEye - dot(unitEye, unitDirection) * unitDirection;
  float normalDotLight = dot(unitNormal, light.unitDirection);
  vec3 unitReflection = normalize(2.0f * normalDotLight * unitNormal - light.unitDirection);
  float specularIntensity = pow(max(dot(unitReflection, unitEye), 0.0f), WIRE_SHININESS);
  vec3 specularColor = specularIntensity * light.color;
  float diffuseIntensity = (1.0f - light.ambientIntensity) * clamp(normalDotLight, 0.0f, 1.0f) + light.ambientIntensity;
  vec3 diffuseColor = diffuseIntensity * WIRE_COLOR * light.color * (1.0 - specularIntensity);
  fragmentColor = vec4(specularColor + diffuseColor, 1.0f);
}