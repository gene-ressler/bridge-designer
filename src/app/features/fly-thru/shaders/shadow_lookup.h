  // Common shadow depth map lookup.
  #define SHADOW 1
  float shadow = light.shadowWeight < 1.0f 
    ? mix(light.shadowWeight, 1.0f, textureProj(depthMap, depthMapLookup))
    : 1.0f;
