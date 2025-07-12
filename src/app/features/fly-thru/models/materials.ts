export const MATERIAL_CONFIG = new Float32Array([
  // Global alpha and padding
  1.0, 0, 0, 0,

  // 0: DarkGreenPaintedMetal
  0.2, 0.6, 0.2, // diffuse rgb
  10.0, // shininess

  // 1: Red
  1, 0, 0, // diffuse rgb
  100.0, // shininess

  // 2: Orange
  1, .54, 0, // diffuse rgb
  40.0, // shininess

  // 3: White
  1, 1, 1, // diffuse rgb
  100.0, // shininess

  // 4: DarkGray
  .2, .2, .2, // diffuse rgb
  40.0, // shininess

  // 5: Black
  0, 0, 0, // diffuse rgb
  20.0, // shininess

  // 6: PaintedSteel
  .45, .45, .45, // diffuse rgb
  20, // shininess

  // 7: Aluminum
  .4, .4, .5, // diffuse rgb
  100.0, // shininess

  // 8: CorrogatedMetal
  0.7, 0.7, 0.7, // diffuse rgb
  40.0, // shininess

  // 9: TexturedSteel
  .15, .15, .15, // diffuse rgb
  10.0, // shininess

  // 10: Glass
  .1, .2, .1, // diffuse rgb
  200.0, // shininess
]);

export const enum Material {
  DarkGreenPaintedMetal = 0,
  Red = 1,
  Orange = 2,
  White = 3,
  DarkGray = 4,
  Black = 5,
  PaintedSteel = 6,
  Aluminum = 7,
  CorrogatedMetal = 8,
  TexturedSteel = 9,
  Glass = 10,
};
