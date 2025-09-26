// This file is generated. Edit .vert and .frag files instead.
export const BUCKLED_MEMBER_VERTEX_SHADER = 
`#version 300 es
precision mediump float;
layout(std140)uniform Transforms{
mat4 modelView;
mat4 modelViewProjection;
mat4 depthMapLookup;}transforms;
layout(location=0)in vec3 inPosition;
layout(location=1)in uint inNormalRef;
layout(location=4)in mat4 inModelTransform;
const mat4 UNIT_SQUARE=mat4(0,0,0,1,1,0,0,1,1,1,0,1,0,1,0,1);
out vec3 vertex;
out vec3 normal;
out vec4 depthMapLookup;
void main(){
vec4 p=inModelTransform*vec4(inPosition,1.0f);
vec4 position=vec4(p.x/p.w,p.y/p.w,p.z,1.0f);
mat4 u=inModelTransform*UNIT_SQUARE;
vec3 rawNormal=inNormalRef==0u ? vec3(0,0,1): inNormalRef==1u ? vec3(0,0,-1): inNormalRef==2u ? vec3(u[2][0]/u[2][3]-u[1][0]/u[1][3],u[2][1]/u[2][3]-u[1][1]/u[1][3],0): inNormalRef==3u ? vec3(u[3][0]/u[3][3]-u[0][0]/u[0][3],u[3][1]/u[3][3]-u[0][1]/u[0][3],0): inNormalRef==4u ? vec3(u[1][0]/u[1][3]-u[2][0]/u[2][3],u[1][1]/u[1][3]-u[2][1]/u[2][3],0): vec3(u[0][0]/u[0][3]-u[3][0]/u[3][3],u[0][1]/u[0][3]-u[3][1]/u[3][3],0);
gl_Position=transforms.modelViewProjection*position;
vertex=vec3(transforms.modelView*position);
normal=mat3(transforms.modelView)*normalize(rawNormal);
depthMapLookup=transforms.depthMapLookup*position;}`;

export const BUCKLED_MEMBER_FRAGMENT_SHADER = 
`#version 300 es
precision mediump float;
precision mediump sampler2DShadow;
layout(std140)uniform LightConfig{
vec3 unitDirection;
float brightness;
vec3 color;
float ambientIntensity;
float shadowWeight;}light;
uniform sampler2DShadow depthMap;
in vec3 vertex;
in vec3 normal;
in vec4 depthMapLookup;
out vec4 fragmentColor;
const vec3 COLOR=vec3(1.0,0.0,0.0);
const float SHININESS=20.0;
void main(){
vec3 unitNormal=normalize(normal);
float normalDotLight=dot(unitNormal,light.unitDirection);
vec3 unitReflection=normalize(2.0f*normalDotLight*unitNormal-light.unitDirection);
vec3 unitEye=normalize(-vertex);
float shadow=light.shadowWeight < 1.0f ? mix(light.shadowWeight,1.0f,textureProj(depthMap,depthMapLookup)): 1.0f;
float specularIntensity=pow(shadow*max(dot(unitReflection,unitEye),0.0f),SHININESS);
float diffuseIntensity=mix(light.ambientIntensity,1.0f,shadow*max(0.0f,normalDotLight));
vec3 color=light.color*(specularIntensity+diffuseIntensity*COLOR);
fragmentColor=vec4(light.brightness*color,1.0f);}`;

export const COLORED_MESH_VERTEX_SHADER = 
`#version 300 es
precision mediump float;
layout(std140)uniform Transforms{
mat4 modelView;
mat4 modelViewProjection;
mat4 depthMapLookup;}transforms;
layout(location=0)in vec3 inPosition;
layout(location=1)in vec3 inNormal;
layout(location=2)in uint inMaterialRef;
out vec3 vertex;
out vec3 normal;
out vec4 depthMapLookup;
flat out uint materialRef;
void main(){
vec4 inPositionHomogeneous=vec4(inPosition,1.0f);
gl_Position=transforms.modelViewProjection*inPositionHomogeneous;
vertex=vec3(transforms.modelView*inPositionHomogeneous);
depthMapLookup=transforms.depthMapLookup*inPositionHomogeneous;
normal=mat3(transforms.modelView)*inNormal;
materialRef=inMaterialRef;}`;

export const COLORED_MESH_FRAGMENT_SHADER = 
`#version 300 es
precision mediump float;
precision mediump sampler2DShadow;
layout(std140)uniform LightConfig{
vec3 unitDirection;
float brightness;
vec3 color;
float ambientIntensity;
float shadowWeight;}light;
struct MaterialSpec{
vec4 spec;};
layout(std140)uniform MaterialConfig{
float globalAlpha;
MaterialSpec specs[12];}materialConfig;
uniform sampler2DShadow depthMap;
in vec3 vertex;
in vec3 normal;
in vec4 depthMapLookup;
flat in uint materialRef;
out vec4 fragmentColor;
void main(){
MaterialSpec materialSpec=materialConfig.specs[materialRef];
vec3 unitNormal=normalize(normal);
float normalDotLight=dot(unitNormal,light.unitDirection);
vec3 unitReflection=normalize(2.0f*normalDotLight*unitNormal-light.unitDirection);
vec3 unitEye=normalize(-vertex);
float shadow=light.shadowWeight < 1.0f ? mix(light.shadowWeight,1.0f,textureProj(depthMap,depthMapLookup)): 1.0f;
float specularIntensity=pow(shadow*max(dot(unitReflection,unitEye),0.0f),materialSpec.spec.w);
float diffuseIntensity=mix(light.ambientIntensity,1.0f,shadow*max(0.0f,normalDotLight));
vec3 color=light.color*(specularIntensity+diffuseIntensity*materialSpec.spec.xyz);
fragmentColor=vec4(light.brightness*color,materialConfig.globalAlpha);}`;

export const COLORED_MESH_INSTANCES_VERTEX_SHADER = 
`#version 300 es
precision mediump float;
layout(std140)uniform Transforms{
mat4 modelView;
mat4 modelViewProjection;
mat4 depthMapLookup;}transforms;
layout(location=0)in vec3 inPosition;
layout(location=1)in vec3 inNormal;
layout(location=2)in uint inMaterialRef;
layout(location=4)in mat4 inModelTransform;
out vec3 vertex;
out vec3 normal;
out vec4 depthMapLookup;
flat out uint materialRef;
void main(){
vec4 inPositionHomogeneous=inModelTransform*vec4(inPosition,1.0f);
gl_Position=transforms.modelViewProjection*inPositionHomogeneous;
vertex=vec3(transforms.modelView*inPositionHomogeneous);
normal=mat3(transforms.modelView)*mat3(inModelTransform)*inNormal;
depthMapLookup=transforms.depthMapLookup*inPositionHomogeneous;
materialRef=inMaterialRef;}`;

export const DEPTH_TEXTURE_VERTEX_SHADER = 
`#version 300 es
precision mediump float;
layout(location=0)in vec2 inTexCoord;
out vec2 texCoord;
void main(){
texCoord=inTexCoord;
gl_Position=vec4(inTexCoord*2.0f-1.0f,0,1.0f);}`;

export const DEPTH_TEXTURE_FRAGMENT_SHADER = 
`#version 300 es
precision mediump float;
precision mediump sampler2DShadow;
uniform sampler2DShadow depthMap;
in vec2 texCoord;
out vec4 fragmentColor;
const float increment=1.0f/8.0f;
void main(){
float intensity=0.0f;
for(float f=increment;
f <=1.0f;
f+=increment){
intensity+=texture(depthMap,vec3(texCoord,f));}intensity*=increment;
fragmentColor=vec4(intensity,intensity,intensity,1.0f);}`;

export const EMPTY_FRAGMENT_SHADER = 
`#version 300 es
void main(){
}`;

export const INSTANCE_COLORED_MESH_VERTEX_SHADER = 
`#version 300 es
layout(std140)uniform Transforms{
mat4 modelView;
mat4 modelViewProjection;
mat4 depthMapLookup;}transforms;
layout(location=0)in vec3 inPosition;
layout(location=1)in vec3 inNormal;
layout(location=2)in vec3 inColor;
layout(location=4)in mat4 inModelTransform;
out vec3 vertex;
out vec3 normal;
out vec4 depthMapLookup;
out vec3 materialColor;
void main(){
vec4 inPositionHomogeneous=inModelTransform*vec4(inPosition,1.0f);
gl_Position=transforms.modelViewProjection*inPositionHomogeneous;
vertex=vec3(transforms.modelView*inPositionHomogeneous);
normal=mat3(transforms.modelView)*mat3(inModelTransform)*inNormal;
depthMapLookup=transforms.depthMapLookup*inPositionHomogeneous;
materialColor=inColor;}`;

export const INSTANCE_COLORED_MESH_FRAGMENT_SHADER = 
`#version 300 es
precision mediump float;
precision mediump sampler2DShadow;
layout(std140)uniform LightConfig{
vec3 unitDirection;
float brightness;
vec3 color;
float ambientIntensity;
float shadowWeight;}light;
uniform sampler2DShadow depthMap;
in vec3 vertex;
in vec3 normal;
in vec4 depthMapLookup;
in vec3 materialColor;
out vec4 fragmentColor;
const float MEMBER_SHININESS=20.0;
void main(){
vec3 unitNormal=normalize(normal);
float normalDotLight=dot(unitNormal,light.unitDirection);
vec3 unitReflection=normalize(2.0f*normalDotLight*unitNormal-light.unitDirection);
vec3 unitEye=normalize(-vertex);
float shadow=light.shadowWeight < 1.0f ? mix(light.shadowWeight,1.0f,textureProj(depthMap,depthMapLookup)): 1.0f;
float specularIntensity=pow(shadow*max(dot(unitReflection,unitEye),0.0f),MEMBER_SHININESS);
float diffuseIntensity=mix(light.ambientIntensity,1.0f,shadow*max(0.0f,normalDotLight));
vec3 color=light.color*(specularIntensity+diffuseIntensity*materialColor);
fragmentColor=vec4(light.brightness*color,1.0f);}`;

export const OVERLAY_VERTEX_SHADER = 
`#version 300 es
precision mediump float;
layout(location=0)in vec4 inPosition;
layout(location=2)in float inAlpha;
layout(location=3)in vec2 inTexCoord;
out vec3 texCoord;
out float alpha;
void main(){
float xScale=inPosition[2];
float yScale=inPosition[3];
gl_Position=vec4(inTexCoord.x*xScale+inPosition.x,inTexCoord.y*yScale+inPosition.y,0,1);
texCoord=vec3(inTexCoord,gl_InstanceID);
alpha=inAlpha;}`;

export const OVERLAY_FRAGMENT_SHADER = 
`#version 300 es
precision mediump float;
precision mediump sampler2DArray;
uniform sampler2DArray icons;
in vec3 texCoord;
in float alpha;
out vec4 fragmentColor;
void main(){
if(alpha < 0.01){
discard;}fragmentColor=texture(icons,texCoord);
fragmentColor.a*=alpha;}`;

export const RIVER_VERTEX_SHADER = 
`#version 300 es
precision mediump float;
layout(std140)uniform Transforms{
mat4 modelView;
mat4 modelViewProjection;
mat4 depthMapLookup;}transforms;
layout(location=0)in vec2 inPosition;
out vec3 vertex;
out vec3 normal;
out vec4 depthMapLookup;
out vec2 texCoord;
const float TEX_SCALE=0.2;
void main(){
vec4 inPositionHomogeneous=vec4(inPosition.x,0.0f,inPosition.y,1.0f);
gl_Position=transforms.modelViewProjection*inPositionHomogeneous;
vertex=vec3(transforms.modelView*inPositionHomogeneous);
normal=mat3(transforms.modelView)*vec3(0.0f,1.0f,0.0f);
depthMapLookup=transforms.depthMapLookup*inPositionHomogeneous;
texCoord=TEX_SCALE*inPosition;}`;

export const RIVER_FRAGMENT_SHADER = 
`#version 300 es
precision mediump float;
precision mediump sampler2DShadow;
layout(std140)uniform LightConfig{
vec3 unitDirection;
float brightness;
vec3 color;
float ambientIntensity;
float shadowWeight;}light;
layout(std140)uniform Time{
float clock;}time;
uniform sampler2D water;
uniform sampler2DShadow depthMap;
in vec3 vertex;
in vec3 normal;
in vec4 depthMapLookup;
in vec2 texCoord;
out vec4 fragmentColor;
const vec2 WATER_VELOCITY=vec2(1.0f/32.0f,3.0f/32.0f);
void main(){
vec3 texColor=texture(water,fract(texCoord)+WATER_VELOCITY*time.clock).rgb;
vec3 unitNormal=normalize(normal);
float normalDotLight=dot(unitNormal,light.unitDirection);
vec3 unitReflection=normalize(2.0f*normalDotLight*unitNormal-light.unitDirection);
vec3 unitEye=normalize(-vertex);
float shadow=light.shadowWeight < 1.0f ? mix(light.shadowWeight,1.0f,textureProj(depthMap,depthMapLookup)): 1.0f;
float specularIntensity=pow(shadow*max(dot(unitReflection,unitEye),0.0f),40.0f);
float diffuseIntensity=mix(light.ambientIntensity,1.0f,shadow*max(0.0f,normalDotLight));
vec3 color=light.color*(specularIntensity+diffuseIntensity*texColor);
fragmentColor=vec4(light.brightness*color,1.0f);}`;

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
mat4 modelViewProjection;
mat4 depthMapLookup;}transforms;
layout(location=0)in vec3 inPosition;
layout(location=1)in vec3 inNormal;
out vec3 normal;
out vec4 depthMapLookup;
out float yModelNormal;
void main(){
vec4 inPositionHomogeneous=vec4(inPosition,1.0f);
gl_Position=transforms.modelViewProjection*inPositionHomogeneous;
normal=mat3(transforms.modelView)*inNormal;
yModelNormal=inNormal.y;
depthMapLookup=transforms.depthMapLookup*inPositionHomogeneous;}`;

export const TERRAIN_FRAGMENT_SHADER = 
`#version 300 es
precision mediump float;
precision mediump sampler2DShadow;
layout(std140)uniform LightConfig{
vec3 unitDirection;
float brightness;
vec3 color;
float ambientIntensity;
float shadowWeight;}light;
uniform sampler2DShadow depthMap;
in vec3 normal;
in vec4 depthMapLookup;
in float yModelNormal;
out vec4 fragmentColor;
const vec3 NORMAL_TERRAIN_COLOR=0.6f*vec3(0.13f,0.4f,0.33f);
const vec3 ERODED_TERRAIN_COLOR=0.6f*vec3(0.87f,0.78f,0.52f);
const vec3 EROSION_DIFF=NORMAL_TERRAIN_COLOR-ERODED_TERRAIN_COLOR;
void main(){
vec3 unitNormal=normalize(normal);
float normalDotLight=dot(unitNormal,light.unitDirection);
float shadow=light.shadowWeight < 1.0f ? mix(light.shadowWeight,1.0f,textureProj(depthMap,depthMapLookup)): 1.0f;
float diffuseIntensity=mix(light.ambientIntensity*0.2f,1.0f,shadow*max(0.0f,normalDotLight));
float normalTerrainColorWeight=pow(yModelNormal,6.0f);
vec3 terrainColor=ERODED_TERRAIN_COLOR+EROSION_DIFF*normalTerrainColorWeight;
vec3 color=diffuseIntensity*light.color*terrainColor;
fragmentColor=vec4(light.brightness*color,1.0f);}`;

export const TEXTURED_MESH_VERTEX_SHADER = 
`#version 300 es
layout(std140)uniform Transforms{
mat4 modelView;
mat4 modelViewProjection;
mat4 depthMapLookup;}transforms;
layout(location=0)in vec3 inPosition;
layout(location=1)in vec3 inNormal;
layout(location=3)in vec2 inTexCoord;
out vec3 normal;
out vec4 depthMapLookup;
out vec2 texCoord;
void main(){
vec4 inPositionHomogeneous=vec4(inPosition,1.0f);
gl_Position=transforms.modelViewProjection*inPositionHomogeneous;
normal=mat3(transforms.modelView)*inNormal;
depthMapLookup=transforms.depthMapLookup*inPositionHomogeneous;
texCoord=inTexCoord;}`;

export const TEXTURED_MESH_FRAGMENT_SHADER = 
`#version 300 es
precision mediump float;
precision mediump sampler2DShadow;
layout(std140)uniform LightConfig{
vec3 unitDirection;
float brightness;
vec3 color;
float ambientIntensity;
float shadowWeight;}light;
uniform sampler2D meshTexture;
uniform sampler2DShadow depthMap;
in vec3 normal;
in vec4 depthMapLookup;
in vec2 texCoord;
out vec4 fragmentColor;
void main(){
vec3 unitNormal=normalize(normal);
float normalDotLight=dot(unitNormal,light.unitDirection);
float shadow=light.shadowWeight < 1.0f ? mix(light.shadowWeight,1.0f,textureProj(depthMap,depthMapLookup)): 1.0f;
float diffuseIntensity=mix(light.ambientIntensity,1.0f,shadow*max(0.0f,normalDotLight));
vec3 materialColor=texture(meshTexture,texCoord).rgb;
vec3 color=diffuseIntensity*materialColor*light.color;
fragmentColor=vec4(light.brightness*color,1.0f);}`;

export const TEXTURED_MESH_INSTANCES_VERTEX_SHADER = 
`#version 300 es
layout(std140)uniform Transforms{
mat4 modelView;
mat4 modelViewProjection;
mat4 depthMapLookup;}transforms;
layout(location=0)in vec3 inPosition;
layout(location=1)in vec3 inNormal;
layout(location=3)in vec2 inTexCoord;
layout(location=4)in mat4 inModelTransform;
out vec3 normal;
out vec4 depthMapLookup;
out vec2 texCoord;
void main(){
vec4 inPositionHomogeneous=inModelTransform*vec4(inPosition,1.0f);
gl_Position=transforms.modelViewProjection*inPositionHomogeneous;
normal=mat3(transforms.modelView)*mat3(inModelTransform)*inNormal;
depthMapLookup=transforms.depthMapLookup*inPositionHomogeneous;
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
float brightness;
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
float diffuseIntensity=mix(light.ambientIntensity,1.0f,max(0.0f,normalDotLight));
vec3 color=light.color*(specularIntensity+diffuseIntensity*WIRE_COLOR);
fragmentColor=vec4(light.brightness*color,1.0f);}`;

export const WIRE_INSTANCES_VERTEX_SHADER = 
`#version 300 es
layout(std140)uniform Transforms{
mat4 modelView;
mat4 modelViewProjection;}transforms;
layout(location=0)in vec3 inPosition;
layout(location=1)in vec3 inDirection;
layout(location=4)in mat4 inModelTransform;
out vec3 vertex;
out vec3 direction;
void main(){
vec4 position=inModelTransform*vec4(inPosition,1.0f);
gl_Position=transforms.modelViewProjection*position;
vertex=vec3(transforms.modelView*position);
direction=mat3(transforms.modelView)*mat3(inModelTransform)*inDirection;}`;
