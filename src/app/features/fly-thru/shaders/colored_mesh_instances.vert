#version 300 es

// build_include "constants.h"

layout(std140) uniform Transforms {
  mat4 modelView;
  mat4 modelViewProjection;
} transforms;

// Make VScode happy.
#ifndef IN_POSITION_LOCATION
#define IN_POSITION_LOCATION 0
#define IN_NORMAL_LOCATION 1
#define IN_MATERIAL_REF_LOCATION 2
#define IN_INSTANCE_MODEL_TRANSFORM_LOCATION 4
#endif

layout(location = IN_POSITION_LOCATION) in vec3 inPosition;
layout(location = IN_NORMAL_LOCATION) in vec3 inNormal;
layout(location = IN_MATERIAL_REF_LOCATION) in uint inMaterialRef;
layout(location = IN_INSTANCE_MODEL_TRANSFORM_LOCATION) in mat4 inModelTransform;

out vec3 vertex;
out vec3 normal;
flat out uint materialRef;

void main() {
  vec4 position = inModelTransform * vec4(inPosition, 1.0f);
  gl_Position = transforms.modelViewProjection * position;
  vertex = vec3(transforms.modelView * position);
  normal = mat3(transforms.modelView) * mat3(inModelTransform) * inNormal;
  materialRef = inMaterialRef;
}
