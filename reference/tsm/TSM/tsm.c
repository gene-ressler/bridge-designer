#include <stdio.h>
#include <math.h>

void trapezoid_to_clip(float xp0, float yp0,
		       float xp1, float yp1,
		       float xp2, float yp2,
		       float xp3, float yp3)
{
  float xa, ya, xc3, yc3, s, xd1, xd2, d, sx, sy, u;
  float m00, m01, m02, m10, m11, m12, m20, m21, m22;

  // This computation of the axis is already
  // done when finding corners of the trapezoid.
  float dx = xp1 - xp0; float dy = yp1 - yp0;
  float len = sqrt(dx * dx + dy * dy);
  xa = -dy / len;
  ya = dx / len;
  // End axis computation.

  m00 = ya; m01 = -xa; m02 =   xa * yp0 - ya * xp0; // (23)
  m10 = xa; m11 =  ya; m12 = -(xa * xp0 + ya * yp0);
  xc3 = m00 * xp3 + m01 * yp3 + m02;                // (24)
  yc3 = m10 * xp3 + m11 * yp3 + m12;
  s = -xc3 / yc3;                                   // (25)
  m00 += s * m10; m01 += s * m11; m02 += s * m12;   // (27)
  xd1 = m00 * xp1 + m01 * yp1 + m02;                // (28)
  xd2 = m00 * xp2 + m01 * yp2 + m02;
  d = yc3 / (xd2 - xd1);               // yd2 = yc3 in (29)
  if (fabs(d) < 1e4) {
    printf("Trapezoid.\n");
    d *= xd1;                                // finish (29)
    m12 += d;
    sx = 2 / xd2; sy = 1 / (yc3 + d);// ye2=yd2=yc3 in (31)
    u = (2 * (sy * d)) / (1 - (sy * d));            // (34)
    m20 = m10 * sy; m21 = m11 * sy; m22 = m12 * sy; // (38)
    m10 = (u + 1) * m20;
    m11 = (u + 1) * m21;
    m12 = (u + 1) * m22 - u;
    m00 = sx * m00 - m20;
    m01 = sx * m01 - m21;
    m02 = sx * m02 - m22;
  }
  else {
    printf("Near rectangle.\n");
    sx = 2 / xd2; sy = 2 / yc3;        // yd2 = yc3 in (41)
    m00 *= sx; m01 *= sx; m02 = m02 * sx - 1;
    m10 *= sy; m11 *= sy; m12 = m12 * sy - 1;
    m20 = 0;   m21 = 0;   m22 = 1;
  }

#define TRANSFORM_AND_PRINT(P) do {\
    float w = (m20 * x##P + m21 * y##P + m22);\
    float x = (m00 * x##P + m01 * y##P + m02) / w;\
    float y = (m10 * x##P + m11 * y##P + m12) / w;\
    printf(#P " -> (%6.3f, %6.3f)\n", x, y);\
  } while (0)

  TRANSFORM_AND_PRINT(p0);
  TRANSFORM_AND_PRINT(p1);
  TRANSFORM_AND_PRINT(p2);
  TRANSFORM_AND_PRINT(p3);
}

int main(void)
{
  trapezoid_to_clip(2, 1,   4, 0,   7, 1,  0, 4.5);
  trapezoid_to_clip(1, 1,   3, 2,   2, 4,  0, 3);
  return 0;
}
