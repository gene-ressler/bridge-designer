#version 300 es

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
