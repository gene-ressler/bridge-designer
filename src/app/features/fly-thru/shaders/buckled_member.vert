#version 300 es

// Special purpose for animating buckling members as red square tubes bent in parabolas.
// build_include "constants.h"

layout(std140) uniform Transforms {
  mat4 modelView;
  mat4 modelViewProjection;
} transforms;

// Make VScode happy.
#ifndef IN_POSITION_LOCATION
#define IN_POSITION_LOCATION 0
#define IN_NORMAL_REF 1
#define IN_INSTANCE_MODEL_TRANSFORM_LOCATION 4
#endif

layout(location = IN_POSITION_LOCATION) in vec3 inPosition;
layout(location = IN_NORMAL_REF) in uint inNormalRef;
layout(location = IN_INSTANCE_MODEL_TRANSFORM_LOCATION) in mat4 inModelTransform;

const mat4 UNIT_SQUARE = mat4(
  0, 0, 0, 1, 
  1, 0, 0, 1, 
  1, 1, 0, 1, 
  0, 1, 0, 1
);

out vec3 vertex;
out vec3 normal;

void main() {
  // Segment transform and pseudo-perspective division that's the segment taper.
  vec4 p = inModelTransform * vec4(inPosition, 1.0f);
  vec4 position = vec4(p.x / p.w, p.y / p.w, p.z, 1.0);
  // Extract the normal vector from the segment matrix. Probably expensive.
  mat4 u = inModelTransform * UNIT_SQUARE;
  vec3 rawNormal = 
    inNormalRef == 0u ? vec3(0, 0, 1) : 
    inNormalRef == 1u ? vec3(0, 0, -1) : 
    inNormalRef == 2u ? vec3(u[2][0] / u[2][3] - u[1][0] / u[1][3], u[2][1] / u[2][3] - u[1][1] / u[1][3], 0) : 
    inNormalRef == 3u ? vec3(u[3][0] / u[3][3] - u[0][0] / u[0][3], u[3][1] / u[3][3] - u[0][1] / u[0][3], 0) : 
    inNormalRef == 4u ? vec3(u[1][0] / u[1][3] - u[2][0] / u[2][3], u[1][1] / u[1][3] - u[2][1] / u[2][3], 0) : 
                        vec3(u[0][0] / u[0][3] - u[3][0] / u[3][3], u[0][1] / u[0][3] - u[3][1] / u[3][3], 0);
  gl_Position = transforms.modelViewProjection * position;
  vertex = vec3(transforms.modelView * position);
  normal = mat3(transforms.modelView) * normalize(rawNormal);
}