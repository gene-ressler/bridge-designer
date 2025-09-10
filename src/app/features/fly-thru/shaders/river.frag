#version 300 es

precision mediump float;

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

in vec3 vertex;
in vec3 normal;
in vec2 texCoord;
out vec4 fragmentColor;

// Components must be multiples of 1/32 for smooth time wrapping.
const vec2 WATER_VELOCITY = vec2(1.0f / 32.0f, 3.0f / 32.0f);

// TODO: Simplify or finish ripples with fine triangulation of river surface.
void main() {
  vec3 unitNormal = normalize(normal);
  float normalDotLight = dot(unitNormal, light.unitDirection);
  vec3 unitReflection = normalize(2.0f * normalDotLight * unitNormal - light.unitDirection);
  vec3 unitEye = normalize(-vertex);
  float specularIntensity = pow(max(dot(unitReflection, unitEye), 0.0f), 120.0f);
  float diffuseIntensity = (1.0f - light.ambientIntensity) * clamp(normalDotLight, 0.0f, 1.0f);
  // TODO: Remove testing code.
  // if (light.shadowWeight < 1.0f) {
  //   specularIntensity *= 0.1f;
  //   diffuseIntensity *= 0.1f;
  // }
  vec3 specularColor = specularIntensity * light.color;
  // Use fractional parts of terms to avoid float overflow.
  vec3 texColor = texture(water, fract(texCoord) + WATER_VELOCITY * time.clock).rgb;
  vec3 diffuseColor = (diffuseIntensity + light.ambientIntensity) * texColor * light.color * (1.0f - specularIntensity);
  fragmentColor = light.brightness * vec4(specularColor + diffuseColor, 1.0f);
}
