// Local membrane activity controls. They never write the whole-cell storyline clock.
export function createSurfaceActivityControls({THREE,state,getActive,isNavigating,visibility,setDetailTime,markPlaybackEdit,animatePose,requestRender,syncUI}){
 let disposed=false;
 const host=document.createElement('div');host.id='surface-activity-controls';host.className='surface-activity-controls';
 host.innerHTML='<div class="surface-activity-actions"><button id="surface-bilayer-button" type="button" class="micro-button">观察磷脂头尾</button><button id="surface-replay-button" type="button" class="micro-button">重播膜活动</button><button id="surface-step-button" type="button" class="micro-button">单步</button></div><label class="surface-local-timeline">局部活动 <input id="surface-activity-range" type="range" min="0" max="1000" value="0" aria-label="膜活动局部时间"></label><p id="surface-activity-status" class="guide-note"></p>';
 document.getElementById('surface-motion-button').insertAdjacentElement('afterend',host);
 const $=id=>document.getElementById(id),model=()=>state.view==='detail'&&state.selected==='surface-patch'?getActive():null;
 const allowed=proteins=>!isNavigating()&&visibility.canShowLabel('surface-patch')&&visibility.canShowLabel('microvilli')&&(!proteins||visibility.canShowLabel('membrane-proteins'));
 const scale=m=>(m.group.updateWorldMatrix(true,true),m.group.matrixWorld.getMaxScaleOnAxis());
 function focus(kind){if(disposed)return;
   const m=model();if(!m||!allowed(kind==='lateral'))return false;
   const s=scale(m);let target=m.anchors[kind+'Target'].clone().applyMatrix4(m.group.matrixWorld),position=m.anchors[kind].clone().applyMatrix4(m.group.matrixWorld);
   if(kind==='lateral'){const free=m.group.getObjectByName('SurfaceDiffusionProteinFree'),gold=m.group.getObjectByName('SurfaceDiffusionProteinConfined');target=free.getWorldPosition(new THREE.Vector3()).add(gold.getWorldPosition(new THREE.Vector3())).multiplyScalar(.5);const normal=new THREE.Vector3().fromArray(free.userData.surfaceNormal).applyNormalMatrix(new THREE.Matrix3().getNormalMatrix(m.group.matrixWorld)),tangent=new THREE.Vector3(0,-1,0).transformDirection(m.group.matrixWorld);position=target.clone().addScaledVector(normal,2.65*s).addScaledVector(tangent,.55*s);const inverse=m.group.matrixWorld.clone().invert();m.anchors.lateral.copy(position).applyMatrix4(inverse);m.anchors.lateralTarget.copy(target).applyMatrix4(inverse);}
   if(kind === "bilayer") position.sub(target).multiplyScalar(1.35).add(target);
   m.setObservationMode?.(kind==="bilayer");state.patchSurface=true;state.patchMode=kind;state.micro=false;state.level='inside';state.section=0;m.setSection(0);
   const pose={position,target,near:Math.max(1e-6,.0002*s),far:110,minDistance:.002*s,maxDistance:m.radius*s*5};
   animatePose(position,target,.65,{pose});syncUI();return true;
 }
 function seek(seconds,play=false){if(disposed)return;const m=model();if(!m?.seek||!allowed(true))return;m.seek(seconds);setDetailTime(seconds);state.playing=play;markPlaybackEdit();requestRender();syncUI();}
 $('surface-bilayer-button').addEventListener('click',()=>focus('bilayer'));
 $('surface-replay-button').addEventListener('click',()=>seek(0,true));
 $('surface-step-button').addEventListener('click',()=>{const m=model();if(m)seek(m.motionState().elapsedInput+1/60,false);});
 $('surface-activity-range').addEventListener('input',e=>seek(Number(e.target.value)*8/1000,false));
 function sync(){if(disposed)return;
   const m=model();host.hidden=!m?.seek;if(host.hidden)return;
   $('surface-bilayer-button').disabled=!allowed(false);
   for(const id of ['surface-replay-button','surface-step-button','surface-activity-range'])$(id).disabled=!allowed(true);
   update();
 }
 function update(){if(disposed)return;
   const m=model();if(!m?.motionState||host.hidden)return;
   const d=m.motionState();$('surface-activity-range').value=String(Math.min(1000,Math.round(d.elapsedInput/8*1000)));
   $('surface-activity-status').textContent=d.elapsedInput.toFixed(2)+' 秒 · 紫：自由样活动 · 金：'+(d.actors[1].mode==='confined'?'局部受限':'教学释放后活动');
 }
 function updateLOD(camera,height){if(disposed)return;
   const m=model();if(!m?.updateLOD)return;
   const close=state.micro||state.patchSurface,force=state.quality==='low'?'far':close?'near':undefined;
   const before=m.getLODState();if(force&&before.active===force)return;
   m.updateLOD({camera,viewportHeightCSS:height,force});
 }
 return {sync,update,updateLOD,focusLateral:()=>focus('lateral'),focusBilayer:()=>focus('bilayer'),diagnostics:()=>({visible:!host.hidden,mode:state.patchSurface?state.patchMode:null,motion:model()?.motionState?.(),lod:model()?.getLODState?.()}),dispose:()=>{if(disposed)return;disposed=true;host.remove();}};
}
