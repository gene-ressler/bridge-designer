#version 300 es

precision mediump float;

layout(std140) uniform LightConfig {
  vec3 unitDirection;
  vec3 color;
  float ambientIntensity;
} light;

in vec3 vertex;
in vec3 normal;
out vec4 fragmentColor;

void main() {
  vec3 unitNormal = normalize(normal);
  float normalDotLight = dot(unitNormal, light.unitDirection);
  vec3 unitReflection = normalize(2.0f * normalDotLight * unitNormal - light.unitDirection);
  vec3 unitEye = normalize(-vertex);
  float specularIntensity = pow(max(dot(unitReflection, unitEye), 0.0f), 120.0f);
  vec3 specularColor = specularIntensity * light.color;
  float diffuseIntensity = (1.0f - light.ambientIntensity) * clamp(normalDotLight, 0.0f, 1.0f) + light.ambientIntensity;
  vec3 diffuseColor = diffuseIntensity * vec3(0.0f, 1.0f, 1.0f) * light.color * (1.0f - specularIntensity);
  fragmentColor = vec4(specularColor + diffuseColor, 1.0f);
}
