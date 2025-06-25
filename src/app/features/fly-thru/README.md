# Fly-through load test animation

This document describes how data flows through shaders.

## Overall organization

- **Pane.** The UI component that contains the scene and receives user interactions.
- **Models.** Raw data for items in the scene. Some are static (from OBJ files), others computed.
- **Rendering.** Logic for rendering models, including.
  - **Meshes.** Converting model data into triangle meshes understood by WebGL shaders.
  - **Projections.** Model, view and projection, transformations that orient objects in the scene and the scene for
    viewing, then map it to the pane.
  - **Uniforms.** Management of WebGL uniform (global) data blocks, which are communicate to shaders.
- **Shaders.** GLSL vertex and fragment manipulators.

## Coordinate systems

The "global" world coordinate system has

- Origin at the bridge's leftmost deck joint, center of roadway.
- Roadway running along the x-axis.
- Y-axis "up".
- Right-handed Z. When origin is on left bank, axis is pointing toward viewer.

## Objects in the animation

The animation scene consists of the following:

- Parallel, camera-independent light source (simulated sunlight)
- Terrain
  - Regular grid, auto-generated.
- River
  - Flat surface with animated texture map depicting flowing water
  - TODO: Add surface waves via vertex shader
- Electrical transmission line
  - Tower
  - Wires
- Bridge abutments and optional pier
- Roadway with shoulder
- Bridge structure with deck and wear surface
  - Updates dynamically with animation
- Truck
  - Rotating wheels
  - Constrained to roadway and bridge deck wear surface
  - Fades in on approach to bridge and out on exit.
- Sky box at infinity

## Models

Each object in the animation has an underlying model. These may be stored explicitly or generated programmatically.
Static models don't change during the animation. Dynamic ones change geometry or texture mappings per frame.

| Object                  | Generation   | Kind    | Notes                                                                         |
| ----------------------- | ------------ | ------- | ----------------------------------------------------------------------------- |
| Terrain and roadway     | Programmatic | Static  | Diamond algorithm. Varies with design conditions. Erosion coloring per slope. |
| River                   | Stored       | Dynamic | Animated texture.                                                             |
| Transmission line tower | Stored       | Static  | OBJ file. Four copies.                                                        |
| Transmission like wine  | Programmatic | Static  | Catenary sag.                                                                 |
| Bridge abutments & pier | Programmatic | Static  | Height varies with scenario. Texture-mapped surfaces. Abutment in 2 copies.   |
| Bridge structure        | Programmatic | Dynamic | Joint offsets and color vary per frame.                                       |
| Truck body              | Stored       | Static  | Multiple colors. Translate and rotate.                                        |
| Wheels                  | Programmatic | Dynamic | Rotate and translate in 4 copies. Extra tire for dual rears.                  |

## Transformations

A fairly standard pipeline for everything except the sky box and UI overlays. There are notrs about these in the shaders
README.

### Model coordinates

Model-specific coordinate systems simplify creation logic for computed models and tool usage for static models. Model
transformations reconcile them to global world coordinates.

| Object                  | Origin                        | Orientation                                    |
| ----------------------- | ----------------------------- | ---------------------------------------------- |
| Terrain and roadway     | Center post, natural y        | Same as global.                                |
| River                   | Front left                    | Same as global with y constant.                |
| Transmission line tower | Bottom center of base         | Vertical is y-axis. Arms are along x.          |
| Transmission line wire  | Global base of leftmost tower | In global coords (so N/A).                     |
| Bridge abutments & pier | Supported joint               | Left abutment of bridge extending along x axis |
| Bridge structure        | Leftmost deck joint           | Extending along x-axis                         |
| Truck body              | Axle level bottom middle      | Chasis center line on x-axis, facing right.    |
| Wheels                  | Center                        | Tire in x-y plane. Axle on z-axis.             |

### Model matrix

Per-model, rotate to correct orientation. Move to correct origin. The uniform service mimicks the old OpenGL API's
transformation stack.

### View matrix

Orient so camera points down the negative z-axis.

### Projection matrix

Apply perspective to foreshorten objects by distance from camera and clip, including near/far. Scale to clip boundaries
xyz&nbsp;∈&nbsp;[-1..1].

### Viewport transform

Set initially and on window size change.

## Lighting

Use a simple model to keep load on shaders minimal

- Parallel sunlight
- Ambient lit color is a constant factor of material color
- Specular lit color is always the color of the light
- Standard cos^n Phong specular model

## Vertex shader, common

Used for several models.

### Inputs (coordinate space):

- Position (world)
- Normal (world)
- Material index (int)

### Uniforms/globals:

- Model-View-Projection (MVP) matrix
- Model-View (MV) matrix

### Outputs (cooridnate space):

- Projected vertex position (clip)
- Vertex (view)
- Normal (view)
- Material index (int)

### Calculations:

- outPosition = MVP \* [inPosition, 1]
- outVertex = MV \* inVertex;
- outNormal = vec3(MV \* [inNormal, 0])
- outMaterialIndex = inMaterialIndex

## Fragment shader, common

Used for several models.

### Inputs (coordinate space):

- Vertex (view)
- Normal (view)
- Material index (int)

### Uniforms/globals:

- Materials array
  - Color (RGB)
  - Shininess (float)
- Light
  - Direction (unit; view)
  - Color (RGB)
  - Ambient intensity (float)

### Output

- Fragment color

### Calculations:

- unitInNormal = normalize(inNormal)
- dotNormalLight = dot(unitInNormal, inLight.unitDirection)
- unitReflection = normalize(2 \* dotNormalLight \* unitInNormal - inLight.unitDirection)
- unitEye = normalize(-inVertex)
- material = materials\[inMaterialIndex\]
- specularIntensity = pow(max(dot(unitReflection, unitEye), 0), material.shininess)
- specularColor = specularIntensity \* inLight.color
- diffuseIntensity = clamp(dotNormalLight + inLight.ambientIntensity, 1, 0)
- diffuseColor = material.color \* diffuseIntensity \* inLight.color \* (1 - specularIntensity)
- fragmentColor = specularColor + diffuseColor
