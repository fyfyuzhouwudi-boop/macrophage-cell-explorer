// Optional v2: bounded roughness-map contrast plus static normal relief.
// No imports, clock, geometry, texture replacement or scene ownership.
const VERSION = 'atlas-surface-detail-v2';
const OWNERS = new WeakMap();
const MODES = Object.freeze({
  roughnessOnly: Object.freeze({film:[1.7,0,0,0,0],membrane:[2,0,0,0,0]}),
  conservative: Object.freeze({film:[1.7,.0018,.018,.12,.4],membrane:[2,.001,.02,.1,.25]})
});
const TAU = Math.PI * 2;
const smooth = t => t*t*(3-2*t);
function lattice(x,y,period,seed){x=((x%period)+period)%period;y=((y%period)+period)%period;let h=Math.imul(x+1,374761393)^Math.imul(y+1,668265263)^(seed|0);h=Math.imul(h^(h>>>13),1274126177);return((h^(h>>>16))>>>0)/4294967295;}
function noise(u,v,period,seed){const x=u*period,y=v*period,ix=Math.floor(x),iy=Math.floor(y),sx=smooth(x-ix),sy=smooth(y-iy);const a=lattice(ix,iy,period,seed),b=lattice(ix+1,iy,period,seed),c=lattice(ix,iy+1,period,seed),d=lattice(ix+1,iy+1,period,seed);return (a+(b-a)*sx)*(1-sy)+(c+(d-c)*sx)*sy;}
export function sampleSurfaceField(u,v,seed=7319){const broad=noise(u,v,4,seed)-.5,fine=noise(u,v,11,seed+31)-.5,phase=(seed%997)/997;
 const height=.5+.24*Math.sin(TAU*(3*u+v+.18*Math.sin(TAU*(u-v))+phase))+.11*Math.sin(TAU*(7*u-2*v+.13*Math.sin(TAU*(2*u+v))+broad*.12))+.035*Math.sin(TAU*(19*u+7*v+phase))+.04*fine;
 const rough=.5+.45*broad+.1*Math.sin(TAU*(2*u-3*v+phase));return[height,rough];}
export function createSurfaceDetailPixels(size=128,seed=7319){if(![64,128,256].includes(size))throw new RangeError('Surface detail size must be 64, 128 or 256');const data=new Uint8Array(size*size*4);for(let y=0;y<size;y++)for(let x=0;x<size;x++){const[h,r]=sampleSurfaceField((x+.5)/size,(y+.5)/size,seed),at=(y*size+x)*4;data[at]=Math.round(h*255);data[at+1]=Math.round(r*255);data[at+2]=128;data[at+3]=255;}return data;}
function defaultSelect(object,material){if(material.userData?.membraneStaticV1||material.userData?.continuousSurfaceV1)return false;if(object.isInstancedMesh||object.userData?.pickThrough&&/Crowding|Drift/.test(object.name??'')||/FaintCompleteMembraneOutline|AmberCytoplasmBackVolume/.test(object.name??''))return false;
 const role=object.userData?.atlasMaterialRole??material.userData?.atlasMaterialRole??material.userData?.atlasMaterialPreset?.role;
 if(role==='film'||role==='membrane')return role;
 if((material.transmission??0)>0)return'film';
 if(/Membrane|Cisterna|Reticulum|BatchedStaticgolgi/.test(object.name??''))return'membrane';return false;}
const DECL = /* glsl */ `
// atlas-surface-detail-v2: static attached surface coordinates, not displacement.
varying vec3 vASDPosition;
varying vec3 vASDNormal;
uniform sampler2D uASDMap;
uniform float uASDRepeat;
uniform float uASDHeight;
uniform float uASDRoughness;
uniform float uASDMaxSlope;
uniform float uASDCoat;
vec2 asdRead(vec3 p, vec3 localNormal) {
  vec3 w = pow(abs(localNormal), vec3(4.0));
  w /= max(w.x + w.y + w.z, 0.00001);
  p *= uASDRepeat;
  return texture2D(uASDMap, p.yz).rg * w.x
       + texture2D(uASDMap, p.zx).rg * w.y
       + texture2D(uASDMap, p.xy).rg * w.z;
}
vec3 asdRelief(vec3 surfacePosition, vec3 n, float height, float facing, float weight) {
  vec3 px = dFdx(surfacePosition), py = dFdy(surfacePosition);
  vec3 r1 = cross(py,n), r2 = cross(n,px);
  float asdDet = dot(px,r1) * facing;
  vec3 gradient = sign(asdDet) * (dFdx(height)*r1 + dFdy(height)*r2);
  gradient *= uASDHeight * weight / max(abs(asdDet), 0.000000000001);
  gradient -= n * dot(gradient,n);
  gradient *= min(1.0, uASDMaxSlope / max(length(gradient), 0.000001));
  return normalize(n-gradient);
}
`;
const VDECL = 'varying vec3 vASDPosition;\nvarying vec3 vASDNormal;\n';
const TOKENS = {vertex:['#include <common>','#include <displacementmap_vertex>'],fragment:['#include <common>','#include <roughnessmap_fragment>','#include <normal_fragment_maps>','#include <clearcoat_normal_fragment_maps>']};
const restoreProperty=(object,key,descriptor)=>{if(descriptor)Object.defineProperty(object,key,descriptor);else delete object[key];};
function once(source,token){return source.split(token).length===2;}
function inject(shader,uniforms){if(!TOKENS.vertex.every(t=>once(shader.vertexShader,t))||!TOKENS.fragment.every(t=>once(shader.fragmentShader,t)))return false;
 let vertex=shader.vertexShader.replace(TOKENS.vertex[0],TOKENS.vertex[0]+'\n'+VDECL).replace(TOKENS.vertex[1],TOKENS.vertex[1]+'\nvASDPosition = transformed;\nvASDNormal = normalize(objectNormal);\n');
 let fragment=shader.fragmentShader.replace(TOKENS.fragment[0],TOKENS.fragment[0]+'\n'+DECL)
 .replace(TOKENS.fragment[1],TOKENS.fragment[1]+'\n#ifdef USE_ROUGHNESSMAP\n// G remap: roughness * (.8 + .2 * G), keeping host scalar roughness.\nroughnessFactor = mix(roughness, roughnessFactor, .2);\n#endif\nvec2 asdSample = vec2(.5);\nif (uASDHeight > 0.0) {\n  asdSample = asdRead(vASDPosition, normalize(vASDNormal));\n  roughnessFactor = clamp(roughnessFactor + (asdSample.y-.5)*uASDRoughness, .025, 1.0);\n}\n')
 .replace(TOKENS.fragment[2],TOKENS.fragment[2]+'\nif (uASDHeight > 0.0) normal = asdRelief(-vViewPosition, normal, asdSample.x, faceDirection, 1.0);\n')
 .replace(TOKENS.fragment[3],TOKENS.fragment[3]+'\n#ifdef USE_CLEARCOAT\nif (uASDHeight > 0.0) clearcoatNormal = asdRelief(-vViewPosition, clearcoatNormal, asdSample.x, faceDirection, uASDCoat);\n#endif\n');
 shader.vertexShader=vertex;shader.fragmentShader=fragment;Object.assign(shader.uniforms,uniforms);return true;}

/** WebGLRenderer / Three r186 optional overlay. THREE is supplied by the host.
 * Register after other onBeforeCompile extensions. No onBeforeRender or clock.
 * original disables this overlay only; existing original/conservative PBR presets stay owned by host.
 */
export function createAtlasSurfaceDetail({THREE,mode='conservative',size=128,seed=7319,select=defaultSelect,requestRender=()=>{}}={}){
 if(!THREE?.DataTexture)throw new TypeError('Pass the host THREE namespace');
 if(!Number.isInteger(seed))throw new TypeError('Surface detail seed must be an integer');
 if(mode!=='original'&&!Object.hasOwn(MODES,mode))throw new RangeError('Unknown surface detail mode');
 if(typeof select!=='function'||typeof requestRender!=='function')throw new TypeError('select/requestRender must be functions');
 const texture=new THREE.DataTexture(createSurfaceDetailPixels(size,seed),size,size,THREE.RGBAFormat,THREE.UnsignedByteType);
 texture.name=VERSION+'-height-roughness';texture.wrapS=texture.wrapT=THREE.RepeatWrapping;texture.magFilter=THREE.LinearFilter;texture.minFilter=THREE.LinearMipmapLinearFilter;texture.generateMipmaps=true;texture.colorSpace=THREE.NoColorSpace;texture.flipY=false;texture.needsUpdate=true;
 const token={},roots=new Map(),records=new Map(),issues=[];let disposed=false,compileCalls=0,injectedCompiles=0,unsupportedCompiles=0,textureDisposed=false;
 const alive=()=>{if(disposed)throw new Error('Surface detail controller is disposed');};
 function fail(message){issues.push(message);throw new Error(message);}
 function uniformValues(record){const cfg=MODES[mode]?.[record.role];if(!cfg)return;['uASDRepeat','uASDHeight','uASDRoughness','uASDMaxSlope','uASDCoat'].forEach((k,i)=>record.uniforms[k].value=cfg[i]);}
 function disable(record){if(!record.enabled)return;const m=record.material;if(m.onBeforeCompile!==record.hook||m.customProgramCacheKey!==record.key)fail('Surface detail hook ownership changed; restore later wrapper before this overlay: '+(m.name||m.uuid||'material'));
  restoreProperty(m,'onBeforeCompile',record.compileDescriptor);restoreProperty(m,'customProgramCacheKey',record.keyDescriptor);record.enabled=false;m.needsUpdate=true;}
 function enable(record){if(record.enabled){uniformValues(record);return;}const m=record.material;
  if(m.onBeforeCompile!==record.previousCompile||m.customProgramCacheKey!==record.previousKey)fail('Baseline shader hook changed while surface overlay was off; unregister then re-register');
  uniformValues(record);m.onBeforeCompile=record.hook;m.customProgramCacheKey=record.key;record.enabled=true;m.needsUpdate=true;}
 function makeRecord(material,role){if(OWNERS.has(material)&&OWNERS.get(material)!==token)fail('A different surface controller already owns this material');
  const record={material,role,roots:new Set(),enabled:false,previousCompile:material.onBeforeCompile,previousKey:material.customProgramCacheKey,compileDescriptor:Object.getOwnPropertyDescriptor(material,'onBeforeCompile'),keyDescriptor:Object.getOwnPropertyDescriptor(material,'customProgramCacheKey'),uniforms:{uASDMap:{value:texture},uASDRepeat:{value:0},uASDHeight:{value:0},uASDRoughness:{value:0},uASDMaxSlope:{value:0},uASDCoat:{value:0}}};
  // Capture before installing our callback: Three's default cache key stringifies onBeforeCompile.
  const baseKey=String(record.previousKey.call(material));
  record.key=function(){return baseKey+'|'+VERSION;};
  record.hook=function(shader,renderer){record.previousCompile.call(this,shader,renderer);compileCalls++;if(inject(shader,record.uniforms))injectedCompiles++;else{unsupportedCompiles++;issues.push('Unsupported shader chunks; prior shader retained for '+(this.name||this.uuid||'material'));}};
  OWNERS.set(material,token);records.set(material,record);if(mode!=='original')enable(record);return record;}
 function forget(record){disable(record);OWNERS.delete(record.material);records.delete(record.material);}
 // A new inspection has its own shader ownership. Copy the host finish but
 // unwrap this overlay before registering the copy, so GLSL is injected once.
 function cloneMaterial(source){alive();const clone=source.clone(),record=records.get(source);clone.onBeforeCompile=record?.previousCompile??source.onBeforeCompile;clone.customProgramCacheKey=record?.previousKey??source.customProgramCacheKey;return clone;}
 function apply(root){alive();if(typeof root?.traverse!=='function')throw new TypeError('Surface detail root must support traverse');const usage=new Map();
  root.traverse(object=>{if(!object.isMesh)return;for(const material of Array.isArray(object.material)?object.material:[object.material]){if(!material||!material.isMeshStandardMaterial&&!material.isMeshPhysicalMaterial)continue;let item=usage.get(material);if(!item){item={roles:new Set(),blocked:false};usage.set(material,item);}const role=select(object,material);if(role==='film'||role==='membrane')item.roles.add(role);else item.blocked=true;}});
  const next=new Set();let skippedShared=0;for(const[material,item]of usage){if(item.blocked||!item.roles.size){if(item.blocked&&item.roles.size)skippedShared++;continue;}const role=item.roles.has('film')?'film':'membrane';let record=records.get(material);if(!record)record=makeRecord(material,role);record.roots.add(root);next.add(material);}
  const previous=roots.get(root)??new Set();for(const material of previous)if(!next.has(material)){const record=records.get(material);record.roots.delete(root);if(!record.roots.size)forget(record);}roots.set(root,next);requestRender();return{registeredMaterials:next.size,skippedMixedScopeMaterials:skippedShared,...diagnostics()};}
 function setMode(next){alive();if(next!=='original'&&!Object.hasOwn(MODES,next))throw new RangeError('Unknown surface detail mode: '+next);mode=next;for(const record of records.values())if(mode==='original')disable(record);else enable(record);requestRender();return diagnostics();}
 function restore(root){alive();if(root==null)return setMode('original');const materials=roots.get(root);if(!materials)return diagnostics();for(const material of materials){const record=records.get(material);record.roots.delete(root);if(!record.roots.size)forget(record);}roots.delete(root);requestRender();return diagnostics();}
 function diagnostics(){return{version:VERSION,mode,disposed,registeredRoots:roots.size,registeredMaterials:records.size,enabledMaterials:[...records.values()].filter(r=>r.enabled).length,texture:{size,seed,baseBytes:size*size*4,approxMipBytes:Math.ceil(size*size*4*4/3),disposed:textureDisposed},compileCalls,injectedCompiles,unsupportedCompiles,issues:[...new Set(issues)],timeUniform:false,vertexDisplacement:false,changesOpacityOrTransmission:false,ownsAOOrDepth:false,roughnessMapRemapWeight:mode==='original'?null:.2,additionalReliefEnabled:mode==='conservative'};}
 function dispose(){if(disposed)return diagnostics();for(const record of records.values())disable(record);for(const material of records.keys())OWNERS.delete(material);records.clear();roots.clear();texture.dispose();textureDisposed=true;disposed=true;requestRender();return diagnostics();}
 return{apply,setMode,restore,dispose,diagnostics,cloneMaterial};
}

export { createAtlasSurfaceDetail as createAtlasSurfaceDetailV2 };
