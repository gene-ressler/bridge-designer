export const IN_POSITION_LOCATION = 0;
export const IN_NORMAL_LOCATION = 1;
// Normal reference is alias for normal.
export const IN_NORMAL_REF_LOCATION = 1;
// Direction is alias for normal.
export const IN_DIRECTION_LOCATION = 1;
export const IN_MATERIAL_REF_LOCATION = 2;
// Color is alias for material ref.
export const IN_INSTANCE_COLOR_LOCATION = 2;
export const IN_TEX_COORD_LOCATION = 3;
export const IN_INSTANCE_MODEL_TRANSFORM_LOCATION = 4;
// Above uses 5,6,7 implicitly.

// build_stop_translation

export const TRANSFORMS_UBO_BINDING_INDEX = 0;
export const LIGHT_CONFIG_UBO_BINDING_INDEX = 1;
export const MATERIAL_CONFIG_UBO_BINDING_INDEX = 2;
export const OVERLAY_UBO_BINDING_INDEX = 3;
export const TIME_UBO_BINDING_INDEX = 4;
export const SKYBOX_TRANSFORMS_UBO_BINDING_INDEX = 5;