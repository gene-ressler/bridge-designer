#version 300 es

precision mediump float;

uniform samplerCube skybox;

in vec3 texCoord;
out vec4 fragmentColor;

void main() {
  fragmentColor = texture(skybox, texCoord);
}
