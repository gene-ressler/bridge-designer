#version 300 es

precision mediump float;

layout(std140) uniform LightConfig {
  vec3 unitDirection;
  vec3 color;
  float ambientIntensity;
} light;

uniform sampler2D meshTexture;

in vec3 normal;
in vec2 texCoord;
out vec4 fragmentColor;

void main() {
  vec3 unitNormal = normalize(normal);
  float normalDotLight = dot(unitNormal, light.unitDirection);
  float diffuseIntensity = (1.0f - light.ambientIntensity) * clamp(normalDotLight, 0.0f, 1.0f) + light.ambientIntensity;
  vec3 materialColor = texture(meshTexture, texCoord).rgb;
  fragmentColor = vec4(diffuseIntensity * materialColor * light.color, 1);
  // fragmentColor = texture(meshTexture, texCoord);
}
