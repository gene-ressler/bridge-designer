#version 300 es

precision mediump float;
precision mediump sampler2DArray;

uniform sampler2DArray icons;

in vec3 texCoord;
in float alpha;
out vec4 fragmentColor;

void main() {
  if (alpha < 0.01) {
    discard;
  }
  fragmentColor = texture(icons, texCoord);
  fragmentColor.a *= alpha;
  // fragmentColor = vec4(1.0, 0.0, 0.0, 1.0);
}
