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
  MaterialSpec specs[11];
} material;

in vec3 vertex;
in vec3 normal;
flat in uint materialRef;
out vec4 fragmentColor;

void main() {
  vec3 unitNormal = normalize(normal); // TODO: Verify not needed since not interpolating.
  float normalDotLight = dot(unitNormal, light.unitDirection);
  vec3 unitReflection = normalize(2.0 * normalDotLight * unitNormal - light.unitDirection);
  vec3 unitEye = normalize(-vertex);
  MaterialSpec materal = material.specs[materialRef];
  float specularIntensity = pow(max(dot(unitReflection, unitEye), 0.0), materal.SHININESS);
  vec3 specularColor = specularIntensity * light.color;
  float diffuseIntensity = clamp(normalDotLight + light.ambientIntensity, 0.0, 1.0);
  vec3 diffuseColor = materal.COLOR * diffuseIntensity * light.color * (1.0 - specularIntensity);
  fragmentColor = vec4(specularColor + diffuseColor, 1.0);
}