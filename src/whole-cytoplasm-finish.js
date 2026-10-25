// Opaque inward face of the shared whole-cell cutaway boundary. Published
// c871605f used a lit opaque far side. Preserve that depth with a warmer,
// quieter field, retaining the corrected section and AO behavior.
// This is a readable teaching backdrop, not measured cytosolic optical data.
export function createWholeCytoplasmMaterial({ THREE, plane } = {}) {
  if (!THREE?.MeshStandardMaterial) throw new TypeError('A Three.js namespace is required.');
  const material = new THREE.MeshStandardMaterial({
    color: '#aa9a7c', roughness: .84, metalness: 0,
    emissive: '#b6aa90', emissiveIntensity: .035, envMapIntensity: .20,
    side: THREE.BackSide,
    transparent: false, opacity: 1, depthWrite: true,
    clippingPlanes: plane ? [plane] : [],
  });
  material.name = 'OpaqueLitCytoplasmicBacking';
  material.userData = {
    ...material.userData,
    excludeFromAO: false,
    cytoplasmDisplayFinish: {
      version: 3, measuredOptics: false, vertexDisplacement: false,
      opaque: true, worldAnchoredLighting: true, static: true,
      historicalReference: 'published c871605f opaque lit inward face',
      interpretation: 'Warm opaque cutaway backing with actual surface depth; no transparent cytosolic volume',
    },
  };
  material.onBeforeCompile = (shader) => {
    shader.vertexShader = shader.vertexShader
      .replace('#include <common>', `#include <common>
varying vec3 vCytoplasmLocal;`)
      .replace('#include <begin_vertex>', `#include <begin_vertex>
vCytoplasmLocal = position;`);
    shader.fragmentShader = shader.fragmentShader
      .replace('#include <common>', `#include <common>
varying vec3 vCytoplasmLocal;`)
      .replace('#include <color_fragment>', `#include <color_fragment>
// Quiet context behind the active labeled membrane proteins and cargo.
float cytoplasmDepth = smoothstep(-4.1, .9, vCytoplasmLocal.z);
vec3 cytoplasmTint = mix(vec3(.81, .88, .91), vec3(1.0, .98, .91), cytoplasmDepth);
float cytoplasmField = sin(vCytoplasmLocal.x * .63 + .4) * sin(vCytoplasmLocal.y * .54 - vCytoplasmLocal.z * .31);
diffuseColor.rgb *= cytoplasmTint * (.93 + .045 * cytoplasmField);`);
  };
  material.customProgramCacheKey = () => 'whole-cytoplasm-lit-opaque-v3';
  return material;
}
