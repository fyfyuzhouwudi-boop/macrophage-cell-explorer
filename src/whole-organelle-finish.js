import {ShaderChunk} from "three";

// Exhibition surface response for the whole-cell view. These static, bounded
// variations change shading only: they do not displace anatomical boundaries,
// create molecular structures, or claim to reproduce an electron micrograph.
export function applyWholeOrganelleFinish(material, {
  contrast = 0.11, relief = 0.004, roughnessVariation = 0.06, scale = 3.1,
  maxSlope = 0.17, seed = 0, softScatter = 0, toneShift = [0, 0, 0],
} = {}) {
  if (!material?.isMeshStandardMaterial || material.userData?.wholeOrganelleFinish) return;
  const previousCompile = material.onBeforeCompile;
  const previousKey = material.customProgramCacheKey.call(material);
  const settings = { contrast, relief, roughnessVariation, scale, maxSlope, seed, softScatter, toneShift: [...toneShift] };
  material.userData.wholeOrganelleFinish = {
    version: 4, ...settings, static: true, vertexDisplacement: false,
    interpretation: 'Illustrative membrane surface response; not EM or atomic data',
  };
  material.onBeforeCompile = function (shader, renderer) {
    previousCompile.call(this, shader, renderer);
    shader.vertexShader = shader.vertexShader
      .replace('#include <common>', '#include <common>\nvarying vec3 vWholeFinishPosition;')
      .replace('#include <begin_vertex>', '#include <begin_vertex>\nvWholeFinishPosition = position;');
    shader.fragmentShader = shader.fragmentShader
      .replace('#include <common>', `#include <common>
varying vec3 vWholeFinishPosition;
uniform vec4 uWholeFinish;
uniform vec2 uWholeFinishScale;
uniform vec4 uWholeTissue;
float wholeFinishHash(vec3 p) {
  p = fract(p * .1031); p += dot(p, p.yzx + 33.33);
  return fract((p.x + p.y) * p.z);
}
float wholeFinishNoise(vec3 p) {
  vec3 i = floor(p), f = fract(p); f = f * f * (3.0 - 2.0 * f);
  return mix(mix(mix(wholeFinishHash(i), wholeFinishHash(i+vec3(1,0,0)), f.x),
                 mix(wholeFinishHash(i+vec3(0,1,0)), wholeFinishHash(i+vec3(1,1,0)), f.x), f.y),
             mix(mix(wholeFinishHash(i+vec3(0,0,1)), wholeFinishHash(i+vec3(1,0,1)), f.x),
                 mix(wholeFinishHash(i+vec3(0,1,1)), wholeFinishHash(i+vec3(1,1,1)), f.x), f.y), f.z);
}
float wholeFinishField(vec3 p) {
  p = p * uWholeFinishScale.x + vec3(uWholeFinishScale.y);
  vec3 warp=vec3(wholeFinishNoise(p*.73),wholeFinishNoise(p*.73+9.7),wholeFinishNoise(p*.73-4.2));
  p += .34 * (warp - .5);
  float grainFootprint=max(length(dFdx(p)),length(dFdy(p)))*15.7;
  float grainVisibility=1.0-smoothstep(.35,1.15,grainFootprint);
  float grain=mix(.5,wholeFinishNoise(p*15.7+8.2),grainVisibility);
  return .36 * wholeFinishNoise(p) + .28 * wholeFinishNoise(p*2.19+4.1)
       + .22 * wholeFinishNoise(p*5.31-2.7) + .14 * grain;
}
// Low-energy, diffuse forward wrap inspired by the official Three.js thin-
// surface scattering example. This is a display approximation, not a fitted
// tissue/thickness model. It adds no transparency or reflective clearcoat.
void wholeSoftDirectScatter(const in IncidentLight directLight, const in vec3 geometryNormal, const in vec3 geometryViewDir, const in vec3 baseColor, const in float field, inout ReflectedLight reflectedLight) {
  vec3 scatteringHalf=normalize(directLight.direction+geometryNormal*.28);
  float forward=pow(saturate(dot(geometryViewDir,-scatteringHalf)),3.0);
  float wrap=pow(saturate((dot(-geometryNormal,directLight.direction)+.42)/1.42),2.0);
  reflectedLight.directDiffuse += baseColor * directLight.color * uWholeTissue.x
       * (.65*forward+.35*wrap) * (.72+.28*field);
}
vec3 wholeFinishNormal(vec3 surfacePosition, vec3 normal, float height) {
  vec3 dx = dFdx(surfacePosition), dy = dFdy(surfacePosition);
  vec3 tangentX = cross(dy, normal), tangentY = cross(normal, dx);
  float determinant = dot(dx, tangentX) * (gl_FrontFacing ? 1.0 : -1.0);
  vec3 gradient = sign(determinant) * (dFdx(height) * tangentX + dFdy(height) * tangentY);
  gradient *= uWholeFinish.y / max(abs(determinant), 1e-10);
  gradient -= normal * dot(gradient, normal);
  gradient *= min(1.0, uWholeFinish.w / max(length(gradient), 1e-6));
  return normalize(normal - gradient);
}`)
      .replace('#include <color_fragment>', `#include <color_fragment>
float wholeSurfaceField = wholeFinishField(vWholeFinishPosition);
diffuseColor.rgb *= 1.0 + (wholeSurfaceField - .5) * uWholeFinish.x * 2.0;
float wholeBroadField=wholeFinishNoise(vWholeFinishPosition*uWholeFinishScale.x*.37+uWholeFinishScale.y);
diffuseColor.rgb *= vec3(1.0)+(wholeBroadField-.5)*uWholeTissue.yzw;`)
      .replace('#include <roughnessmap_fragment>', `#include <roughnessmap_fragment>
roughnessFactor = clamp(roughnessFactor + (wholeSurfaceField - .5) * uWholeFinish.z, .08, 1.0);`)
      .replace('#include <normal_fragment_maps>', `#include <normal_fragment_maps>
normal = wholeFinishNormal(-vViewPosition, normal, wholeSurfaceField);`);
    if (softScatter > 0) {
      const direct='RE_Direct( directLight, geometryPosition, geometryNormal, geometryViewDir, geometryClearcoatNormal, material, reflectedLight );';
      shader.fragmentShader=shader.fragmentShader.replace('#include <lights_fragment_begin>',
        ShaderChunk.lights_fragment_begin.replaceAll(direct,direct+'\nwholeSoftDirectScatter(directLight, geometryNormal, geometryViewDir, diffuseColor.rgb, wholeSurfaceField, reflectedLight);'));
    }
    shader.uniforms.uWholeFinish = { value: [contrast, relief, roughnessVariation, maxSlope] };
    shader.uniforms.uWholeFinishScale = { value: [scale, seed] };
    shader.uniforms.uWholeTissue = { value: [Math.max(0, Math.min(.08, softScatter)), ...toneShift.map(x=>Math.max(-.3, Math.min(.3,x)))] };
  };
  material.customProgramCacheKey = () => previousKey + '|whole-organelle-finish-v4|scatter:'+Number(softScatter>0);
  material.needsUpdate = true;
}
