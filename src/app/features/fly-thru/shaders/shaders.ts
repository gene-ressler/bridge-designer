// This file is generated. Edit .vert and .frag files instead.
export const COLORED_MESH_VERTEX_SHADER = 
`#version 300 es
layout(std140)uniform Transforms{
mat4 modelView;
mat4 modelViewProjection;}transforms;
layout(location=0)in vec3 inPosition;
layout(location=1)in vec3 inNormal;
layout(location=2)in uint inMaterialRef;
out vec3 vertex;
out vec3 normal;
flat out uint materialRef;
void main(){
vec4 inPositionHomogeneous=vec4(inPosition,1.0f);
gl_Position=transforms.modelViewProjection*inPositionHomogeneous;
vertex=vec3(transforms.modelView*inPositionHomogeneous);
normal=mat3(transforms.modelView)*inNormal;
materialRef=inMaterialRef;}`;

export const COLORED_MESH_FRAGMENT_SHADER = 
`#version 300 es
precision mediump float;
layout(std140)uniform LightConfig{
vec3 unitDirection;
vec3 color;
float ambientIntensity;}light;
struct MaterialSpec{
vec4 spec;};
layout(std140)uniform MaterialConfig{
float globalAlpha;
MaterialSpec specs[11];}materialConfig;
in vec3 vertex;
in vec3 normal;
flat in uint materialRef;
out vec4 fragmentColor;
void main(){
vec3 unitNormal=normalize(normal);
float normalDotLight=dot(unitNormal,light.unitDirection);
vec3 unitReflection=normalize(2.0f*normalDotLight*unitNormal-light.unitDirection);
vec3 unitEye=normalize(-vertex);
MaterialSpec materialSpec=materialConfig.specs[materialRef];
float specularIntensity=pow(max(dot(unitReflection,unitEye),0.0f),materialSpec.spec.w);
vec3 specularColor=specularIntensity*light.color;
float diffuseIntensity=(1.0f-light.ambientIntensity)*clamp(normalDotLight,0.0f,1.0f)+light.ambientIntensity;
vec3 diffuseColor=diffuseIntensity*materialSpec.spec.xyz*light.color*(1.0f-specularIntensity);
fragmentColor=vec4(specularColor+diffuseColor,materialConfig.globalAlpha);}`;

export const COLORED_MESH_INSTANCES_VERTEX_SHADER = 
`#version 300 es
layout(std140)uniform Transforms{
mat4 modelView;
mat4 modelViewProjection;}transforms;
layout(location=0)in vec3 inPosition;
layout(location=1)in vec3 inNormal;
layout(location=2)in uint inMaterialRef;
layout(location=4)in mat4x4 inModelTransform;
out vec3 vertex;
out vec3 normal;
flat out uint materialRef;
void main(){
vec4 position=inModelTransform*vec4(inPosition,1.0f);
gl_Position=transforms.modelViewProjection*position;
vertex=vec3(transforms.modelView*position);
normal=mat3(transforms.modelView)*mat3(inModelTransform)*inNormal;
materialRef=inMaterialRef;}`;

export const OVERLAY_VERTEX_SHADER = 
`#version 300 es
precision mediump float;
layout(std140)uniform Overlay{
uniform mat3 projection;
float alpha;}overlay;
layout(location=0)in vec2 inPosition;
out vec2 texCoord;
void main(){
vec2 position2D=(overlay.projection*vec3(inPosition,1)).xy;
gl_Position=vec4(position2D,0,1);
texCoord=inPosition;}`;

export const OVERLAY_FRAGMENT_SHADER = 
`#version 300 es
precision mediump float;
layout(std140)uniform Overlay{
uniform mat3 projection;
float alpha;}overlay;
uniform sampler2D icon;
in vec2 texCoord;
out vec4 fragmentColor;
void main(){
fragmentColor=texture(icon,texCoord);
fragmentColor.a*=overlay.alpha;}`;

export const RIVER_VERTEX_SHADER = 
`#version 300 es
precision mediump float;
layout(std140)uniform Transforms{
mat4 modelView;
mat4 modelViewProjection;}transforms;
layout(location=0)in vec2 inPosition;
out vec3 vertex;
out vec3 normal;
out vec2 texCoord;
const float TEX_SCALE=0.2;
void main(){
vec4 inPositionHomogeneous=vec4(inPosition.x,0.0f,inPosition.y,1.0f);
gl_Position=transforms.modelViewProjection*inPositionHomogeneous;
vertex=vec3(transforms.modelView*inPositionHomogeneous);
normal=mat3(transforms.modelView)*vec3(0.0f,1.0f,0.0f);
texCoord=TEX_SCALE*inPosition;}`;

export const RIVER_FRAGMENT_SHADER = 
`#version 300 es
precision mediump float;
layout(std140)uniform LightConfig{
vec3 unitDirection;
vec3 color;
float ambientIntensity;}light;
layout(std140)uniform Time{
float clock;}time;
uniform sampler2D water;
in vec3 vertex;
in vec3 normal;
in vec2 texCoord;
out vec4 fragmentColor;
const vec2 WATER_VELOCITY=vec2(1.0/32.0f,3.0/32.0);
void main(){
vec3 unitNormal=normalize(normal);
float normalDotLight=dot(unitNormal,light.unitDirection);
vec3 unitReflection=normalize(2.0f*normalDotLight*unitNormal-light.unitDirection);
vec3 unitEye=normalize(-vertex);
float specularIntensity=pow(max(dot(unitReflection,unitEye),0.0f),120.0f);
vec3 specularColor=specularIntensity*light.color;
float diffuseIntensity=(1.0f-light.ambientIntensity)*clamp(normalDotLight,0.0f,1.0f)+light.ambientIntensity;
vec3 texColor=texture(water,fract(texCoord)+WATER_VELOCITY*time.clock).rgb;
vec3 diffuseColor=diffuseIntensity*texColor*light.color*(1.0f-specularIntensity);
fragmentColor=vec4(specularColor+diffuseColor,1.0f);}`;

export const SKY_VERTEX_SHADER = 
`#version 300 es
precision mediump float;
layout(std140)uniform SkyboxTransforms{
mat4 viewRotationProjection;}transforms;
layout(location=0)in vec3 inPosition;
out vec3 texCoord;
void main(){
vec4 homogenousPosition=transforms.viewRotationProjection*vec4(inPosition,1);
gl_Position=homogenousPosition.xyww;
texCoord=vec3(-inPosition.x,inPosition.y,-inPosition.z);}`;

export const SKY_FRAGMENT_SHADER = 
`#version 300 es
precision mediump float;
uniform samplerCube skybox;
in vec3 texCoord;
out vec4 fragmentColor;
void main(){
fragmentColor=texture(skybox,texCoord);}`;

export const TERRAIN_VERTEX_SHADER = 
`#version 300 es
layout(std140)uniform Transforms{
mat4 modelView;
mat4 modelViewProjection;}transforms;
layout(location=0)in vec3 inPosition;
layout(location=1)in vec3 inNormal;
out vec3 normal;
out float yModelNormal;
void main(){
gl_Position=transforms.modelViewProjection*vec4(inPosition,1.0f);
normal=mat3(transforms.modelView)*inNormal;
yModelNormal=inNormal.y;}`;

export const TERRAIN_FRAGMENT_SHADER = 
`#version 300 es
precision mediump float;
layout(std140)uniform LightConfig{
vec3 unitDirection;
vec3 color;
float ambientIntensity;}light;
in vec3 normal;
in float yModelNormal;
out vec4 fragmentColor;
const vec3 NORMAL_TERRAIN_COLOR=0.6f*vec3(0.13f,0.4f,0.33f);
const vec3 ERODED_TERRAIN_COLOR=0.6f*vec3(0.87f,0.78f,0.52f);
const vec3 EROSION_DIFF=NORMAL_TERRAIN_COLOR-ERODED_TERRAIN_COLOR;
void main(){
vec3 unitNormal=normalize(normal);
float normalDotLight=dot(unitNormal,light.unitDirection);
float adjustedAmbientIntensity=light.ambientIntensity*0.2f;
float diffuseIntensity=(1.0f-adjustedAmbientIntensity)*clamp(normalDotLight,0.0f,1.0f)+adjustedAmbientIntensity;
float normalTerrainColorWeight=pow(yModelNormal,6.0f);
vec3 color=ERODED_TERRAIN_COLOR+EROSION_DIFF*normalTerrainColorWeight;
fragmentColor=vec4(diffuseIntensity*color*light.color,1.0f);}`;

export const TEXTURED_MESH_VERTEX_SHADER = 
`#version 300 es
layout(std140)uniform Transforms{
mat4 modelView;
mat4 modelViewProjection;}transforms;
layout(location=0)in vec3 inPosition;
layout(location=1)in vec3 inNormal;
layout(location=3)in vec2 inTexCoord;
out vec3 normal;
out vec2 texCoord;
void main(){
vec4 inPositionHomogeneous=vec4(inPosition,1.0f);
gl_Position=transforms.modelViewProjection*inPositionHomogeneous;
normal=mat3(transforms.modelView)*inNormal;
texCoord=inTexCoord;}`;

export const TEXTURED_MESH_FRAGMENT_SHADER = 
`#version 300 es
precision mediump float;
layout(std140)uniform LightConfig{
vec3 unitDirection;
vec3 color;
float ambientIntensity;}light;
uniform sampler2D meshTexture;
in vec3 normal;
in vec2 texCoord;
out vec4 fragmentColor;
void main(){
vec3 unitNormal=normalize(normal);
float normalDotLight=dot(unitNormal,light.unitDirection);
float diffuseIntensity=(1.0f-light.ambientIntensity)*clamp(normalDotLight,0.0f,1.0f)+light.ambientIntensity;
vec3 materialColor=texture(meshTexture,texCoord).rgb;
fragmentColor=vec4(diffuseIntensity*materialColor*light.color,1);}`;

export const TEXTURED_MESH_INSTANCES_VERTEX_SHADER = 
`#version 300 es
layout(std140)uniform Transforms{
mat4 modelView;
mat4 modelViewProjection;}transforms;
layout(location=0)in vec3 inPosition;
layout(location=1)in vec3 inNormal;
layout(location=3)in vec2 inTexCoord;
layout(location=4)in mat4x4 inModelTransform;
out vec3 normal;
out vec2 texCoord;
void main(){
vec4 position=inModelTransform*vec4(inPosition,1.0f);
gl_Position=transforms.modelViewProjection*position;
normal=mat3(transforms.modelView)*mat3(inModelTransform)*inNormal;
texCoord=inTexCoord;}`;

export const WIRE_VERTEX_SHADER = 
`#version 300 es
layout(std140)uniform Transforms{
mat4 modelView;
mat4 modelViewProjection;}transforms;
layout(location=0)in vec3 inPosition;
layout(location=1)in vec3 inDirection;
out vec3 vertex;
out vec3 direction;
void main(){
vec4 inPositionHomogeneous=vec4(inPosition,1.0f);
gl_Position=transforms.modelViewProjection*inPositionHomogeneous;
vertex=vec3(transforms.modelView*inPositionHomogeneous);
direction=mat3(transforms.modelView)*inDirection;}`;

export const WIRE_FRAGMENT_SHADER = 
`#version 300 es
precision mediump float;
layout(std140)uniform LightConfig{
vec3 unitDirection;
vec3 color;
float ambientIntensity;}light;
in vec3 vertex;
in vec3 direction;
out vec4 fragmentColor;
const vec3 WIRE_COLOR=vec3(0.3f,0.2f,0.2f);
const float WIRE_SHININESS=30.0;
void main(){
vec3 unitDirection=normalize(direction);
vec3 unitEye=normalize(-vertex);
vec3 unitNormal=normalize(unitEye-dot(unitEye,unitDirection)*unitDirection);
float normalDotLight=dot(unitNormal,light.unitDirection);
vec3 unitReflection=normalize(2.0f*normalDotLight*unitNormal-light.unitDirection);
float specularIntensity=pow(max(dot(unitReflection,unitEye),0.0f),WIRE_SHININESS);
vec3 specularColor=specularIntensity*light.color;
float diffuseIntensity=(1.0f-light.ambientIntensity)*clamp(normalDotLight,0.0f,1.0f)+light.ambientIntensity;
vec3 diffuseColor=diffuseIntensity*WIRE_COLOR*light.color*(1.0-specularIntensity);
fragmentColor=vec4(specularColor+diffuseColor,1.0f);}`;

export const WIRE_INSTANCES_VERTEX_SHADER = 
`#version 300 es
layout(std140)uniform Transforms{
mat4 modelView;
mat4 modelViewProjection;}transforms;
layout(location=0)in vec3 inPosition;
layout(location=1)in vec3 inDirection;
layout(location=4)in mat4x4 inModelTransform;
out vec3 vertex;
out vec3 direction;
void main(){
vec4 position=inModelTransform*vec4(inPosition,1.0f);
gl_Position=transforms.modelViewProjection*position;
vertex=vec3(transforms.modelView*position);
direction=mat3(transforms.modelView)*mat3(inModelTransform)*inDirection;}`;
