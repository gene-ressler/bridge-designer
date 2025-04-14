# Fly-Thru Animation

This is a load test animation based on WebGL.

## Top-level concepts

Following is an outline of the implementation. Details come later.

### Scene objects

These are the entities in the animation scene. They correspond to separate graphical models. Some are stored. Others are
programmatically generated.

- Sky box
- Synthetic terrain, adjusted for deck elevation
- Power line poles and wires
- River surface
- Road
- Abutments including wear surface
- Pier (if any)
- Bridge
  - Deck panels including wear surface
  - Joint pins and gussets
  - Members
- Truck
  - Body exterior
  - Wheels
  - Interior cab

### Animated objects

Per-frame variables. Starred (\*) are optional via user toggles:

- Truck position (\* truck may be invisible)
  - Wheel rotation (\* same as above)
- Truck opacity (fade in and out as approaching and departing the bridge)
- Bridge deformation (\* exaggeration may be toggled)
- Member stress coloration (\*)
- Water texture flow

Other variables not per-frame:

- Camera position (\* via user fly-thru controls)
- Soil erosion based on terrain slope (\* may be switched off)
- Smoothing (\* may be switched off) TODO: Consider deleting.

The general idea is to buffer the models initially, including one set of joint offsets per joint corresponding to truck
location. The vertex shaders for joints will accept two offset attributes bound to vectors, plus a uniform interpolation
parameter

## Triangles

Rough estimates of triangles in various parts of the geometry follow.

### Bridge

| Item       | Count   |
| ---------- | ------- |
| Member     | 8       |
| Joint pin  | 32      |
| Joint cap  | 16      |
| Gusset     | 24 avg. |
| Deck beam  | 12      |
| Deck panel | 12      |

Also a crossing set of 2 wires per member.

Maxes:

- 50 joints
- 120 members
- 11 deck panels
- 12 deck beams

Rough worst case per model:

- triangles: `50 * (32 + 16*2 + 24) + 120 * 8 + 11 * 12 + 12 * 12 = 5636`
- lines: 120 \* 2 = 240

To load one model per deck joint:

- triangles: 12 * 5636 = 67,632
- lines: 12 * 240 = 2,880
