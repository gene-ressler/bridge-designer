
export const FACET_MESH_FRAGMENT_SHADER = 
`#version 300 es

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
  vec3 unitReflection = normalize(2.0f * normalDotLight * unitNormal - light.unitDirection);
  vec3 unitEye = normalize(-vertex);
  MaterialSpec materal = material.specs[materialRef];
  float specularIntensity = pow(max(dot(unitReflection, unitEye), 0.0f), materal.SHININESS);
  vec3 specularColor = specularIntensity * light.color;
  float diffuseIntensity = (1.0f - light.ambientIntensity) * clamp(normalDotLight, 0.0f, 1.0f) + light.ambientIntensity;
  vec3 diffuseColor = diffuseIntensity * materal.COLOR * light.color * (1.0 - specularIntensity);
  fragmentColor = vec4(specularColor + diffuseColor, 1.0f);
}`;

export const FACET_MESH_VERTEX_SHADER = 
`#version 300 es

// This file is generated. Edit constants.ts instead.
#define IN_POSITION_LOCATION 0
#define IN_NORMAL_LOCATION 1
#define IN_MATERIAL_REF_LOCATION 2
#define IN_TEX_COORD_LOCATION 3

#define TRANSFORMS_UBO_BINDING_INDEX 0
#define LIGHT_CONFIG_UBO_BINDING_INDEX 1
#define MATERIAL_CONFIG_UBO_BINDING_INDEX 2
#define OVERLAY_UBO_BINDING_INDEX 3
#line 4

layout(std140) uniform Transforms {
  mat4 modelView;
  mat4 modelViewProjection;
} transforms;

// Make VScode happy.
#ifndef IN_POSITION_LOCATION
#define IN_POSITION_LOCATION 0
#define IN_NORMAL_LOCATION 1
#define IN_MATERIAL_REF_LOCATION 2
#endif

layout(location = IN_POSITION_LOCATION) in vec3 inPosition;
layout(location = IN_NORMAL_LOCATION) in vec3 inNormal;
layout(location = IN_MATERIAL_REF_LOCATION) in uint inMaterialRef;

out vec3 vertex;
out vec3 normal;
flat out uint materialRef;

void main() {
  vec4 inPositionHomogeneous = vec4(inPosition, 1.0f);
  gl_Position = transforms.modelViewProjection * inPositionHomogeneous;
  vertex = vec3(transforms.modelView * inPositionHomogeneous);
  normal = mat3(transforms.modelView) * inNormal;
  materialRef = inMaterialRef;
}
`;

export const OVERLAY_FRAGMENT_SHADER = 
`#version 300 es

precision mediump float;

layout(std140) uniform Overlay {
  uniform mat3 projection;
  float alpha;
} overlay;

uniform sampler2D icon;

in vec2 texCoord;
out vec4 fragmentColor;

void main() {
  fragmentColor = texture(icon, texCoord);
  fragmentColor.a *= overlay.alpha;
}
`;

export const OVERLAY_VERTEX_SHADER = 
`#version 300 es

// This file is generated. Edit constants.ts instead.
#define IN_POSITION_LOCATION 0
#define IN_NORMAL_LOCATION 1
#define IN_MATERIAL_REF_LOCATION 2
#define IN_TEX_COORD_LOCATION 3

#define TRANSFORMS_UBO_BINDING_INDEX 0
#define LIGHT_CONFIG_UBO_BINDING_INDEX 1
#define MATERIAL_CONFIG_UBO_BINDING_INDEX 2
#define OVERLAY_UBO_BINDING_INDEX 3
#line 4

precision mediump float;

layout(std140) uniform Overlay {
  uniform mat3 projection;
  float alpha;
} overlay;

// Make VScode happy.
#ifndef IN_TEX_COORD_LOCATION
#define IN_TEX_COORD_LOCATION 3
#endif

// Serves as both tex coord and positions of overlay corners.
layout(location = IN_TEX_COORD_LOCATION) in vec2 inTexCoord;

out vec2 texCoord;

void main() {
  vec2 position2D = (overlay.projection * vec3(inTexCoord, 1)).xy;
  gl_Position = vec4(position2D, 0, 1);
  texCoord = inTexCoord;
}
`;
