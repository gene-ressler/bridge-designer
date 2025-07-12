#version 300 es

precision mediump float;

layout(std140) uniform LightConfig {
  vec3 unitDirection;
  vec3 color;
  float ambientIntensity;
} light;

// Pack struct manually into vec4s to work around known hardware bugs.
struct MaterialSpec {
  #define COLOR spec.xyz
  #define SHININESS spec.w
  vec4 spec;
};

layout(std140) uniform MaterialConfig {
  float globalAlpha;
  MaterialSpec specs[11];
} materialConfig;

in vec3 vertex;
in vec3 normal;
flat in uint materialRef;
out vec4 fragmentColor;

void main() {
  vec3 unitNormal = normalize(normal);
  float normalDotLight = dot(unitNormal, light.unitDirection);
  vec3 unitReflection = normalize(2.0f * normalDotLight * unitNormal - light.unitDirection);
  vec3 unitEye = normalize(-vertex);
  MaterialSpec materialSpec = materialConfig.specs[materialRef];
  float specularIntensity = pow(max(dot(unitReflection, unitEye), 0.0f), materialSpec.SHININESS);
  vec3 specularColor = specularIntensity * light.color;
  float diffuseIntensity = (1.0f - light.ambientIntensity) * clamp(normalDotLight, 0.0f, 1.0f) + light.ambientIntensity;
  vec3 diffuseColor = diffuseIntensity * materialSpec.COLOR * light.color * (1.0f - specularIntensity);
  fragmentColor = vec4(specularColor + diffuseColor, materialConfig.globalAlpha);
}