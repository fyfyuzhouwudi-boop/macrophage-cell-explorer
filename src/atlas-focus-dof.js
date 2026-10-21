// Optional screen-space focus cue. Host-owned AO depth; no extra scene/depth pass.
const VERSION = 'atlas-focus-dof-v1';
const vertexShader = /* glsl */ `
varying vec2 vUv;
void main() {
  vUv = uv;
  gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
}
`;
const fragmentShader = /* glsl */ `
varying vec2 vUv;
uniform sampler2D tDiffuse;
uniform sampler2D tDepth;
uniform vec2 cameraNearFar;
uniform vec2 inverseResolution;
uniform float pixelRatio;
uniform float focusDistance;
uniform float focusRange;
uniform float focusFalloff;
uniform float maxBlurCSS;
uniform float depthGateAbsolute;
uniform float depthGateRelative;
float viewDepth(float d) {
  return cameraNearFar.x * cameraNearFar.y /
    (cameraNearFar.y - (cameraNearFar.y - cameraNearFar.x) * d);
}
void accumulate(vec2 direction, float spatialWeight, vec2 radiusUV, float centerDepth,
                inout vec3 colorSum, inout float weightSum) {
  vec2 uv = clamp(vUv + direction * radiusUV, inverseResolution * .5,
                  vec2(1.0) - inverseResolution * .5);
  float d = texture2D(tDepth, uv).r;
  float sampleDepth = viewDepth(d);
  float tolerance = max(depthGateAbsolute, depthGateRelative * min(centerDepth, sampleDepth));
  float gate = (1.0 - smoothstep(tolerance, tolerance * 2.5, abs(sampleDepth - centerDepth)))
               * (1.0 - step(.999999, d));
  float weight = spatialWeight * gate;
  colorSum += texture2D(tDiffuse, uv).rgb * weight;
  weightSum += weight;
}
void main() {
  vec4 center = texture2D(tDiffuse, vUv);
  float depth = texture2D(tDepth, vUv).r;
  // No opaque AO depth: preserve the original pixel, including transparent-color context.
  if (depth >= .999999 || depth < 0.0) { gl_FragColor = center; return; }
  float centerDepth = viewDepth(depth);
  float unfocused = clamp((abs(centerDepth - focusDistance) - focusRange) / max(focusFalloff, .00001), 0.0, 1.0);
  float radiusCSS = min(max(maxBlurCSS, 0.0), 8.0) * smoothstep(0.0, 1.0, unfocused);
  if (radiusCSS < .1) { gl_FragColor = center; return; }
  vec2 radiusUV = inverseResolution * pixelRatio * radiusCSS;
  vec3 colorSum = center.rgb * 2.0;
  float weightSum = 2.0;
  accumulate(vec2( .45, 0.0), .85, radiusUV, centerDepth, colorSum, weightSum);
  accumulate(vec2(-.45, 0.0), .85, radiusUV, centerDepth, colorSum, weightSum);
  accumulate(vec2(0.0,  .45), .85, radiusUV, centerDepth, colorSum, weightSum);
  accumulate(vec2(0.0, -.45), .85, radiusUV, centerDepth, colorSum, weightSum);
  accumulate(vec2( 1.0, 0.0), .60, radiusUV, centerDepth, colorSum, weightSum);
  accumulate(vec2(-1.0, 0.0), .60, radiusUV, centerDepth, colorSum, weightSum);
  accumulate(vec2(0.0,  1.0), .60, radiusUV, centerDepth, colorSum, weightSum);
  accumulate(vec2(0.0, -1.0), .60, radiusUV, centerDepth, colorSum, weightSum);
  accumulate(vec2( .70710678,  .70710678), .60, radiusUV, centerDepth, colorSum, weightSum);
  accumulate(vec2(-.70710678,  .70710678), .60, radiusUV, centerDepth, colorSum, weightSum);
  accumulate(vec2( .70710678, -.70710678), .60, radiusUV, centerDepth, colorSum, weightSum);
  accumulate(vec2(-.70710678, -.70710678), .60, radiusUV, centerDepth, colorSum, weightSum);
  gl_FragColor = vec4(colorSum / max(weightSum, .00001), center.a);
}
`;

/** create after AO and insert BEFORE OutputPass; standard perspective depth only.
 * This is a bounded bilateral focus cue, not physical transparent-body DOF.
 * No timer, render call, scene traversal or host depth disposal is installed.
 */
export function createAtlasFocusDOF({THREE, ShaderPass, depthTexture = null} = {}) {
  if (!THREE?.Vector2 || typeof ShaderPass !== 'function') throw new TypeError('Pass host THREE and ShaderPass');
  if (depthTexture !== null && !depthTexture?.isDepthTexture) throw new TypeError('depthTexture must be the host DepthTexture or null');
  const pass = new ShaderPass({
    name: VERSION,
    uniforms: {
      tDiffuse: {value:null}, tDepth: {value:null},
      cameraNearFar: {value:new THREE.Vector2(.025, 100)},
      inverseResolution: {value:new THREE.Vector2(1, 1)}, pixelRatio:{value:1},
      focusDistance:{value:1},focusRange:{value:.12},focusFalloff:{value:.6},
      maxBlurCSS:{value:6},depthGateAbsolute:{value:.06},depthGateRelative:{value:.02},
    },vertexShader,fragmentShader,
  });
  pass.enabled = false;
  pass.material.depthTest = false;
  pass.material.depthWrite = false;
  pass.material.toneMapped = false;
  const uniforms = pass.uniforms;
  let disposed = false, requestedEnabled = false, borrowedDepth = null;
  let cssWidth = 1, cssHeight = 1, dpr = 1;
  const alive = () => { if (disposed) throw new Error('Atlas focus pass is disposed'); };
  const finite = (value, name, min = 0) => {
    if (!Number.isFinite(value) || value < min) throw new RangeError(name + ' must be finite and >= ' + min);
    return value;
  };
  function setFocus(options = {}) {
    alive();
    const near = options.cameraNear ?? uniforms.cameraNearFar.value.x;
    const far = options.cameraFar ?? uniforms.cameraNearFar.value.y;
    finite(near,'cameraNear',.000001); finite(far,'cameraFar',.000001);
    if (far <= near) throw new RangeError('cameraFar must exceed cameraNear');
    const focus = options.focusDistance ?? uniforms.focusDistance.value;
    finite(focus,'focusDistance',0);
    // Validate atomically before changing uniforms or the external depth reference.
    const numbers = {};
    for (const key of ['focusRange','focusFalloff','maxBlurCSS','depthGateAbsolute','depthGateRelative']) {
      const min = key === 'focusFalloff' || key === 'depthGateAbsolute' ? .000001 : 0;
      numbers[key] = finite(options[key] ?? uniforms[key].value,key,min);
    }
    if ('depthTexture' in options && options.depthTexture !== null && !options.depthTexture?.isDepthTexture)
      throw new TypeError('depthTexture must be the host DepthTexture or null');
    uniforms.cameraNearFar.value.set(near,far);
    uniforms.focusDistance.value = Math.max(near,Math.min(far,focus));
    for (const [key,value] of Object.entries(numbers)) uniforms[key].value = key === 'maxBlurCSS' ? Math.min(8,value) : value;
    if ('depthTexture' in options) borrowedDepth = options.depthTexture;
    uniforms.tDepth.value = borrowedDepth; // exact identity: never UniformsUtils-clone the depth input
    if ('enabled' in options) requestedEnabled = Boolean(options.enabled);
    pass.enabled = requestedEnabled && borrowedDepth !== null;
    return diagnostics();
  }
  function resize(width,height,pixelRatio = dpr) {
    alive();finite(width,'cssWidth',.000001);finite(height,'cssHeight',.000001);finite(pixelRatio,'pixelRatio',.000001);
    cssWidth = width;cssHeight = height;dpr = pixelRatio;
    uniforms.pixelRatio.value = dpr;
    uniforms.inverseResolution.value.set(1 / (width * dpr), 1 / (height * dpr));
    return diagnostics();
  }
  // EffectComposer gives setSize physical render-target dimensions; keep CSS cap separate.
  pass.setSize = (width,height) => {
    alive();finite(width,'bufferWidth',.000001);finite(height,'bufferHeight',.000001);
    cssWidth = width / dpr;cssHeight = height / dpr;
    uniforms.inverseResolution.value.set(1/width,1/height);
  };
  function diagnostics() {
    return {version:VERSION,enabled:pass.enabled,requestedEnabled,disposed,
      depthBorrowed:borrowedDepth !== null,depthTextureUUID:borrowedDepth?.uuid??null,
      cameraNearFar:uniforms.cameraNearFar.value.toArray(),focusDistance:uniforms.focusDistance.value,
      focusRange:uniforms.focusRange.value,focusFalloff:uniforms.focusFalloff.value,
      maxBlurCSS:uniforms.maxBlurCSS.value,inverseResolution:uniforms.inverseResolution.value.toArray(),
      cssResolution:[cssWidth,cssHeight],pixelRatio:dpr,depthGateAbsolute:uniforms.depthGateAbsolute.value,
      depthGateRelative:uniforms.depthGateRelative.value,taps:13,maximumColorSamples:13,maximumDepthSamples:13,
      newSceneDepthRenders:0,ownsInputDepth:false,installsAnimationLoop:false,physicalTransparentDOF:false,
      scope:'Screen-space bilateral focus cue from existing opaque-only AO depth; host must enable only for IFNAR closeup, non-micro, current-frame AO enabled. Standard non-log, non-reversed perspective depth.'};
  }
  function dispose() {
    if (disposed) return diagnostics();
    pass.enabled = false;
    uniforms.tDepth.value = null;borrowedDepth = null;
    pass.dispose();disposed = true;
    return diagnostics();
  }
  setFocus({depthTexture});
  return {pass,setFocus,resize,diagnostics,dispose};
}
