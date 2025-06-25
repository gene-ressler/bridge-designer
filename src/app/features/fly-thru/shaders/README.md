# Shaders

This directory contains shader code, a simple build system, and a service to provide compiled shader programs.

## Shader code

Add a file with suffix `.vert` or `.frag` for a vertex or fragment shader respectively. The build script will find it
and add it to `shaders.ts`.

## Builder

The script `build.py` adds the content of each shader program as a string constant in `shaders.ts`. It also honors
include directives of the form:

```
// build_include "include_file_name"
```

These can be nested up to three deep. Included content is ignored for purposes of OpenGL error line numbers.

The builder by default expands `#defines` and attempts to remove as much whitespace as possible, both with simple text
replacement that won't do the right thing with all possible GLSL syntax. The flags `--no-compress` and
`--no-process-defines` respectively turn off these features.

## Compilation and linking

All the shaders in `shaders.ts` are compiled at once by the service endpoint `compileShaders()` and returned in a map
keyed by the original shader source file name stem.

Vertex/fragment shader pairs are linked into programs by `linkPrograms()` based on a data table defined there.

The public method `buildPrograms()` performs the compile and link steps and caches the results, after which a call to
`getProgram(name)` will work. Otherwise a toast error is thrown.

TODO: This could all be done lazily to save graphic card resources if the animation is never run.

## Checklist for adding a new shader (or deleting one by undoing these steps).

- Add `.vert` and/or `.frag` files in this directory.
- Add a `ProgramSpec` to the table in `shader.service.ts`.
- For new uniform blocks, follow the pattern for existing ones in `uniform.service.ts`.
- If any existing uniform blocks are used by the new shaders, update `uniform.service.ts`:
  - Add a new shader lookup at the top of `prepareUniforms`.
  - Update calls to `setUpUniformBlock`, i.e. the list of affected programs.

## Sky box

The sky box impl was a bit hard to visualize, so some notes.

The box is defined around the origin. For visibility when culling, its triangles must be CCW from the inside. The
"trick" no one states explicitly is that coordinates on the surface of this box are exactly the vectors you need for
OpenGL cube map lookups.

The second part of the trick is that when drawing the box, we can't use the normal MVP transform. We want the sky box to
appear infinitely far away. I.e., the visible swatch of the box's inside surface depends only on view _direction_. Eye
_position_ should have no effect. We get this by translating the normal MVP view frustum apex to the origin. The swatch
is the cube surface inside this frustum. As the viewer turns their head, the frustum swivels around the origin, and the
swatch changes accordingly. As they translate, the swatch stays the same.

With the frustom apex at the origin, the size of the box doesn't matter:

- Scaling with respect to the origin causes no change to the perspective view, and
- We are required to fool the depth check anyway. Either we turn it off completely and draw the sky box first, or we
  fake out the checker by ensuring the z-coordinate of every sky box fragment after perspective division is one, i.e. as
  deep as possible without clipping. This entails copying w of the final vertex position to z (depth). We took the
  latter approach because it allows drawing the box last, when most of it is hidden by other stuff, so the depth check
  saves a lot of work.

How to build this different version of MVP? Firstly, M is always the identity, so it's really VP. Since the frustum
angle is the same as usual, P is also the same as for the rest of the scene. This leaves modifying the view matrix V to
get a new one detrans(V). We could use a normal lookAt matrix builder, setting eye to the origin and translating center
a corresponding amount. But there's a simpler way. We can just remove the translation part of V (hence my name,
detrans()). This is accomplished by forcing three elements to zero: `V[0,3]=V[1,3]=V[2,3]=0`.

Online discussions don't tell the story above very well. They just show as an afterthought that you magically get the
required view by coercing the normal V to a 3x3 and then back to 4x4. Libraries happen to give the right result.

So how to implement in the OpenGL pipeline? The obvious way is to compute `P * detrans(V)` on the host side and send via
uniform to the sky box shader. This is what most impls do. I looked at an alternative: tweaking the normal PV matrix in
the shader. This saves the boilerplate of setting up a new uniform. It entails copying from the uniform and changing 3
elements: setting two to zero and a more elaborate tweak to the third. I finally decided this is too messy and fragile.

# Wire rendering

We get diffuse and specular light reflected from wires using a rough approximation. Each wire segment is modeled as a 1
pixel-wide planar facet at the wire's centerline, always facing the viewer. Mathematically the facet normal is the
projection of the eye vector onto the plane having the wire's direction vector as a normal. Happily, this is a cheap
calculation.

```
vec3 unitNormal = normalize(unitEye - dot(unitEye, unitDirection) * unitDirection)
```

Then the usual Phong specular+diffuse+ambient model gives the fragment color. It works reasonably well. Shininess of 20
gives a pleasant effect.
