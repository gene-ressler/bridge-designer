#version 300 es

precision mediump float;

// TODO: Maybe add brightness control.
uniform samplerCube skybox;

in vec3 texCoord;
out vec4 fragmentColor;

void main() {
  fragmentColor = texture(skybox, texCoord);
}
