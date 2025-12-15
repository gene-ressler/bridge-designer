u0, v0 = 1, 1
u1, v1 = 2, 0.5
u2, v2 = 2.5, 22
# u3, v3 = 0.5, 3.5

# a = v2 - v3
# b = u2 * v3 + u1 * a
# c = u2 * v3 - u3 * v2
# d = u2 * v3
# e = (u2 - u3) * v1
# f = u1 * u3
# g = u2 * u3
# h = u3 * v2
# i = v1 * v3
# j = v2 * v3
# k = (u3 - u2) * v0
# s = 1 / (b - u3 * v2 + (u3 - u2) * v1)

# # General form for 4 points mapping
# c00 = (u1 * (c + k) + u0 * (h + e - d)) * s
# c01 = (f * v2 - u0 * (b - u2 * v1) - g * v1 - (f - g) * v0) * s
# c02 = u0
# c10 = (v0 * (h - d - u1 * a) + v1 * (c + u0 * a)) * s
# c11 = (u0 * (i - j) + u1 * j - u2 * i + v0 * (h - u1 * v2 + e)) * s
# c12 = v0
# c20 = ((u0 - u1) * a + e + k) * s
# c21 = (u1 * v3 - d + h + u0 * (v1 - v2) - u3 * v1 + (u2 - u1) * v0) * s

# Trapezoid mapping where 4th point is encoded with 3d dof.
t = 1.5
u3 = u2 + (u0 - u1) * t
v3 = v2 + (v0 - v1) * t
print((u3, v3))

s = 1 / t
c00 = u1 - u0
c01 = (u2 - t * u1) * s
c02 = u0
c10 = v1 - v0
c11 = (v2 - t * v1) * s
c12 = v0
c20 = 0
c21 = (1 - t) * s

m = [
    [c00, c01, c02],
    [c10, c11, c12],
    [c20, c21, 1],
]
print(m)

x = [
    [0, 0, 1],
    [1, 0, 1],
    [1, 1, 1],
    [0, 1, 1],
]


def mul(a, x):
    r = [0, 0, 0]
    for i in range(3):
        for j in range(3):
            r[i] += a[i][j] * x[j]
    return r


for j in range(4):
    e = mul(m, x[j])
    s = (e[0] / e[2], e[1] / e[2])
    print(s)
