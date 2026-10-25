// Explicit, reversible observation controls. Semantic visibility choices remain owned by the user.
export function createExplorationControls({THREE,state,whole,network,camera,controls,visibility,isNavigating,animatePose,requestRender,syncUI,switchScenario,uptakeControls,viral,reactionFocus}){
 const $=id=>document.getElementById(id);let savedViral=null,disposed=false;
 state.userClearView=false;state.skeletonFocus=null;state.showSkeletonNetwork=true;
 const assist=document.createElement('button');assist.id='clear-observation-button';assist.type='button';assist.className='micro-button';assist.setAttribute('aria-pressed','false');assist.textContent='清晰观察：关';
 $('follow-button').insertAdjacentElement('afterend',assist);
 assist.addEventListener('click',()=>{state.userClearView=!state.userClearView;syncUI();requestRender();});
 const panel=document.createElement('details');panel.id='skeleton-network-panel';panel.className='visibility-details';
 panel.innerHTML='<summary>三类细胞骨架 · 按需显示</summary><label class="network-layer-toggle"><input type="checkbox" id="skeleton-network-visible" aria-label="显示骨架网络">显示骨架网络</label><div class="network-actions"><button type="button" data-skeleton-focus="microtubules">靠近微管</button><button type="button" data-skeleton-focus="actin">靠近膜下肌动蛋白</button><button type="button" data-skeleton-focus="intermediate-filaments">靠近中间丝</button><button type="button" id="skeleton-mtoc-button">观察组织中心</button></div>';
 $('organelle-grid').insertAdjacentElement('afterend',panel);
 $('skeleton-network-visible').addEventListener('change',event=>{state.showSkeletonNetwork=event.target.checked;if(!state.showSkeletonNetwork)state.skeletonFocus=null;syncUI();requestRender();});
 const fit=(center,radius,dir=new THREE.Vector3(.15,.12,1))=>{const distance=radius/Math.sin(THREE.MathUtils.degToRad(camera.fov/2))*.96;return {position:center.clone().addScaledVector(dir.normalize(),distance),target:center,near:Math.max(.0005,Math.min(.02,distance*.003)),far:110,minDistance:.03,maxDistance:65};};
 function focusSkeleton(key){
   if(disposed)return false;
   if(state.view!=='whole'||isNavigating()||!visibility.canShowLabel('cytoskeleton')||key!=='network'&&!visibility.canShowLabel(key==='mtoc'?'microtubules':key))return false;
   if(state.scenario!=='structure')switchScenario('structure');
   reactionFocus.leave('skeleton-view');state.skeletonFocus=key;state.userClearView=true;state.showSkeletonNetwork=true;network.group.visible=true;
   let target,radius;
    if(key==='network'){target=whole.group.localToWorld(new THREE.Vector3(0,0,0));radius=7.4;}
   else if(key==='mtoc'||key==='microtubules'){target=whole.group.localToWorld(network.anchors.mtoc.clone());radius=key==='mtoc'?.62:2.8;}
   else if(key==='intermediate-filaments'){target=whole.group.localToWorld(network.anchors.nuclearSupport.clone());radius=2.6;}
   else{
     const desired=whole.group.localToWorld(network.anchors.corticalUptake.clone());let best=Infinity;
     network.groups.actin.traverse(o=>{if(!o.isMesh)return;const p=o.geometry.attributes.position,mats=Array.isArray(o.material)?o.material:[o.material],v=new THREE.Vector3();for(let i=0;i<p.count;i+=5){v.fromBufferAttribute(p,i).applyMatrix4(o.matrixWorld);if(mats.every(m=>!m.clippingPlanes?.some(pl=>pl.distanceToPoint(v)<0))){const d=v.distanceToSquared(desired);if(d<best){best=d;target=v.clone();}}}});
     if(!target)target=desired;radius=.8;
   }
   const pose=fit(target,radius);animatePose(pose.position,pose.target,.7,{pose});state.cameraHome=false;syncUI();$('status').textContent='已靠近实际骨架网络；需要时开启“清晰观察”暂略遮挡，重置返回整胞。';return true;
 }
 panel.querySelectorAll('[data-skeleton-focus]').forEach(b=>b.addEventListener('click',()=>focusSkeleton(b.dataset.skeletonFocus)));
 $('skeleton-mtoc-button').addEventListener('click',()=>focusSkeleton('mtoc'));
 const bridge=document.createElement('button');bridge.id='viral-clearance-example-button';bridge.type='button';bridge.className='micro-button';bridge.textContent='连续观看抗原载体清除';
 const back=document.createElement('button');back.id='viral-clearance-return-button';back.type='button';back.className='micro-button';back.textContent='返回抗病毒应答';
 $('follow-button').insertAdjacentElement('afterend',bridge);bridge.insertAdjacentElement('afterend',back);
 bridge.addEventListener('click',()=>{
   if(state.view!=='whole'||state.scenario!=='virus'||isNavigating())return;
   savedViral={progress:state.progress,time:state.time,motion:viral.getDiagnostics().motionTime,section:state.section,focused:state.viralFocused};
   switchScenario('clearance');uptakeControls.selectCase('viral-antigen-clearance');uptakeControls.setLocal(true);syncUI();
 });
 back.addEventListener('click',()=>{
   if(!savedViral||isNavigating())return;const previous=savedViral;savedViral=null;
   state.viralLesson='response';switchScenario('virus');state.progress=previous.progress;state.time=previous.time;state.section=previous.section;state.playing=false;viral.seek(previous.progress);viral.resetTime(previous.motion);whole.setSection(state.section);
   if(previous.focused)reactionFocus.focus();syncUI();requestRender();
 });
 function sync(){
   if(disposed)return;
   assist.hidden=state.view!=='whole'||state.scenario==='virus'&&state.viralLesson==='entry'||(!state.viralFocused&&!state.skeletonFocus);assist.disabled=isNavigating();
   assist.textContent='清晰观察：'+(state.userClearView?'开':'关');assist.setAttribute('aria-pressed',String(state.userClearView));assist.title='只在当前近景暂略前景或背景；不修改你的分组隐藏选择。';
   panel.hidden=state.view!=='whole'||state.uptakeLocal;
   $('skeleton-network-visible').checked=state.showSkeletonNetwork;$('skeleton-network-visible').disabled=isNavigating();
   for(const b of panel.querySelectorAll('[data-skeleton-focus]'))b.disabled=isNavigating()||!visibility.canShowLabel(b.dataset.skeletonFocus);
   $('skeleton-mtoc-button').disabled=isNavigating()||!visibility.canShowLabel('microtubules');
   bridge.hidden=state.view!=='whole'||state.scenario!=='virus'||state.viralLesson==='entry'||state.progress>=.16;bridge.disabled=isNavigating();
   back.hidden=state.view!=='whole'||state.scenario!=='clearance'||state.uptakeCase!=='viral-antigen-clearance'||!savedViral;back.disabled=isNavigating();
   if(state.skeletonFocus&&state.view==='whole'){
     $('subtitle').textContent=({'network':'同一细胞中的三类骨架 · 金：微管 / 蓝：F-actin / 紫：中间丝','microtubules':'微管网络','actin':'膜下肌动蛋白','intermediate-filaments':'核周中间丝 · 支撑示意','mtoc':'微管组织中心 · 教学结构'})[state.skeletonFocus];
     $('view-hint').textContent='拖动/滚轮接管 · 清晰观察由你开关 · 重置返回整胞';
   }
 }
 function leaveSkeleton(){if(!disposed&&state.skeletonFocus){state.skeletonFocus=null;syncUI();}}
 return {sync,focusSkeleton,leaveSkeleton,diagnostics:()=>({clearObservation:state.userClearView,skeletonFocus:state.skeletonFocus,viralBridgeActive:Boolean(savedViral)}),dispose:()=>{if(disposed)return;disposed=true;assist.remove();panel.remove();bridge.remove();back.remove();}};
}
