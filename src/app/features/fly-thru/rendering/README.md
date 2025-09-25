# Rendering

This directory contains rendering logic for fly-thru animation models.

## Organization

- **Rendering services.** These accept model mesh data and turn them into "meshes", which contain everything needed to
  render once per frame, including OpenGL objects. There is a hierarchical level graph of kinds of meshes:
  - **Top-level.** This is `RenderingService.` It injects a renderer for each kind of scene object and exports functions
    to initialize them and render at the frame rate. It does initializations: one-time (e.g. for the sky box),
    once-per-design-conditions (e.g. terrain), and once per bridge.
  - **Specific.** These are dedicated to a specific scene object type. They are called directly from the top level.
    Examples: abutments, the bridge, UI overlays, river, sky box, truck, utility lines.
  - **General purpose.** These render generic meshes. They may be called by top-level or specific renderers. Examples:
    Included are meshes with simple colors per-facet, meshes painted entirely with a single texture, and collections of
    line segments called "wires."
  - Note that `MeshRenderingService` is a wrapper for nearly all rendering at the lowest level, i.e. OpenGL interaction.
    OpenGL is a state machine. It seems good for all interaction with it to be centralized. The consequence is that this
    service contains both specific and general purpose rendering, e.g river and colored meshes. More complicated
    specific renderers have their own services, which do their work by injecting this class.

    An exception is `OverlayRendering` (with related `OverlayUI`). It stands alone because it's essentially different:
    2D and "hot" for pointer operations.

  - We elected to use only two types to represent all kinds of meshes and underlying mesh data: one for triangles and
    the other for lines. It's up to the caller to call the renderXXX() function only for a mesh prepared as type XXX.
    This isn't checked.
  - Meshes consume OpenGL resources. When they're re-prepared() for rendering, it's important to delete the old one
    using `MeshRenderingService`.

- **View service.** Maintains the view transformation of the eye flying through the rendered view.
- **Viewport.** Maintains the projection transformation. This depends on the window (vieport) size, so it listens for
  changes.
- **Uniform service.** Consolidates all OpenGL uniform handling (i.e. shader global data), which is shared by all
  rendering.
- **Animation.** Triggers frame rendering and manages the animation clock, e.g. pause and resume that cause the
  animation to freeze and restart at user request.
- **Interpolators.** Provides interpolated analyses that lie between the discrete load cases, also second level
  interpolations ("bi-interpolations") between pairs of these. See details below.
- **Simulation state.** Uses the animation clock and interpolators to determine what's going on in the load test
  simulation: applying the dead load, truck materializing as it approaches the bridge, traversing the bridge,
  dematerializing on the other side, or perhaps failing.

## Interpolation

The interpolation service provides the underlying data for the load test animation. These include:

- Joint displacements.
- Member forces. Used to determine color cues.
- The 2d (x, y) contact point of the truck's front tires.
- The z-axis rotation vector for the truck that places all tires on the bridge.
  - Also used as the view vector of a person in the truck cab.

While the idea is simple, implementation has nuances.

### The progress parameter

A single parameter (`t` in the code) gives the position of the truck load's front tire contact point. It is
_approximately_ the x-coordinate of the truck's front tire contact with the pavement. The details are more complicated
because joint displacements can be arbitrarily large in degenerate cases. Exaggeration makes them worse. E.g. if an arch
sways far to the right under dead load, what should the truck do when it reaches the edge of the left abutment?
"Teleport" to the first panel? "Fly" over the gap? What if the bridge sways to the left instead? Should the truck
teleport backward or ignore one of the two overlapping chunks of roadway? If ignore, which?

We chose a "no teleport" policy. The truck should follow the roadway smoothly. Where the abutment gap is large, it
should "fly" across it.

Let L be the x-coordinate of the left edge of the deck (a bit left of the leftmost joint) with only dead load applied
and similarly R the right edge. To achieve the policy:

- Follow the roadway centerline with `t` = x until `t` = L.
- The parameter space from L to R is now used to interpolate among the deck joints and consequently among analysis load
  cases. If there are N of these, then `(t - L) / (R - L)` is the fraction of the deck the truck's front tire has
  traversed.
  - Note however that member force and deflection interpolations continue until the _rear_ tire leaves the deck.
- Upon reaching R, again follow the roadway centerline with x=t.

This logic can result in instantaneous jumps of the truck in the y-direction if deck end and terrain height differ. We
won't worry about that, since major elevation differences wouldn't be practical anyway.

One important effect of this definition of parameter is that a valid analysis is needed to set one. This requires
interpolators to be created "lazily" when an analysis is guaranteed present.

Another detail is how to interpolate the small sections of deck that form cantilevers from the left deck edge to the
leftmost joint - the roadway over the abutment joint pillow - and similarly for the right edge. This is straightforward
for contact points. For member forces and joint deflections, however, we can't do better than to use values
corresponding to the first and last deck joint.

- Truck tire contact points are linear extrapolations of the leftmost and rightmost deck panels.
- Displacements can reasonably be extrapolated from the leftmost and rightmost load case pairs, too, even though this

### Interpolators and their data sources

Interpolation is implemented with two interfaces. A data source interface provides raw data e.g. displaced joint
locations and member forces. Implementations broadly follow an adapter pattern:

- An adapter pattern exposes a bridge analysis as a data source.
- A "bi-source" interpolates between two other data sources _visa vis_ its own parameter.
- A "zero force" source always returns zero forces and displacements.

An interpolator accepts a data source and produces interpolated data similar to what the source provides, but includes
other derivative attributes e.g. about failure of the structure at the current interpolation point.

There are two kinds of interpolator: one that interpolates a single source and another specifically for the bridge
collapse animation.

Withall, there are three interpolators managed by the simulation state machine. Only one is effective at any time.

- The _dead loading phase_ interpolator is a normal source interpolator with a bi-source interpolating between the zero
  load case and the analysis dead load only case.
- The _traversal interpolator_ has the analysis as a data source, so the output is interpolating analysis load cases
  directly.
- The _collapse interpolator_ is an odd duck. It uses a bi-source of two adapters, each connected to its own analysis.
  One is the normal bridge analysis with its parameter frozen at the first value where a member fails. The second is
  computed on the fly. Each failed member from the first analysis is artificially weakened by a large factor, and then
  the analysis is completed. The weakened members cause very large joint displacements that roughly approximate bridge
  failure. Its parameter is frozen at the same value, so the truck is positioned on the distorted bridge. The bi-source
  parameter is varied to go smoothly from the intially failed state to the large displacements of the distorted
  analysis.

  The odd bit is that a normal source analysis interpolator of the bi-source would produce some incorrect results in
  addition to the joint displacements and truck locations needed for the animation. These are the member forces and
  derived failure data. The member forces in the artifically weakened bridge have no useful meaning. We don't want them
  to affect the collapse interpolator's outputs at all. Consequently, there is a custom collapse intepolator
  implementation that is just a wrapper for two others: the bi-source interpolator and also a normal analysis
  iterpolator to the normal analysis. The wrapper delegates to the correct wrapped interpolator for each kind of output.

### Interpolating failure

Without due care, animation frames could skip over failure load cases, causing users to see the truck pass while the
bridge actually fails. To prevent this, the analysis interpolator returns information directly from the left-most failed
load case whenever the progress parameter is past it.
