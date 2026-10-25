import * as THREE from 'three';
import {createUptakeScenario,UPTAKE_CASES,UPTAKE_STAGES,isParticleUptakeCase,VIRAL_ANTIGEN_UPTAKE_CASE_ID} from './uptake-scenario.js';
import {UPTAKE_GUIDES} from './uptake-guide.js';
import {createUptakePresentation} from './uptake-presentation.js';

// Owns only presentation and case snapshots; main owns the single macro clock.
export function createUptakeControls({state,scene,whole,camera,controls,renderer,visibility,configureMaterialGroup,prepareShadows,requestRender,animatePose,cancelTransition,isAnnotationsVisible,isNavigating,frameWhole,syncUI,setupPhases}) {
  const $=id=>document.getElementById(id);
  let model=null,lastProgress=NaN,closeFocus=false,disposed=false,wholeSection=state.section,presentationHome=true,lastCameraStage=null;
  // The local uptake view opens in a longitudinal membrane cutaway. Otherwise
  // the resealed parent membrane hides the cargo immediately after scission.
  const snapshots=new Map(UPTAKE_CASES.map(c=>[c.id,{progress:0,time:0,section:isParticleUptakeCase(c.id)?.74:.72}]));
  state.uptakeCase=UPTAKE_CASES[0].id;
  state.uptakeLocal=false;
  const host=document.createElement('div');host.id='uptake-controls';host.className='uptake-controls';host.hidden=true;
  const selector=document.createElement('div');selector.className='uptake-case-selector';selector.setAttribute('aria-label','物质摄取案例');
  for(const c of UPTAKE_CASES){const b=document.createElement('button');b.type='button';b.dataset.uptakeCase=c.id;const strong=document.createElement('strong'),small=document.createElement('span');strong.textContent=c.title;small.textContent=c.short;b.append(strong,small);b.addEventListener('click',()=>selectCase(c.id));selector.append(b);}
  const note=document.createElement('p');note.className='uptake-scope';note.textContent='退出局部或探索细胞器时暂停，进度保留。';
  const focus=document.createElement('button');focus.id='uptake-inside-button';focus.type='button';focus.className='micro-button';focus.textContent='靠近分子接触区';focus.addEventListener('click',()=>{if(state.view!=='whole'||isNavigating())return;if(!state.uptakeLocal){if(!isParticleUptakeCase(state.uptakeCase))return;state.following=!state.following;if(state.following){const target=whole.organelleLocations.get('phagosome').position.clone(),position=target.clone().add(new THREE.Vector3(0,.75,8.8)),pose={position,target,near:.01,far:110,minDistance:1.5,maxDistance:65};state.cameraHome=false;animatePose(position,target,.55,{pose});}else{cancelTransition();frameWhole();}syncUI();return;}closeFocus=!closeFocus;focusCamera(true);syncUI();});
  const cut=document.createElement('button');cut.id='uptake-section-button';cut.type='button';cut.className='micro-button';cut.textContent='剖面观察膜与杯颈';cut.addEventListener('click',()=>{
    if(!model||!state.uptakeLocal||!isParticleUptakeCase(state.uptakeCase)||isNavigating())return;
    state.section=.74;model.setSection(state.section);closeFocus=false;presentationHome=false;
    const target=model.debug.continuousA.state.particleCenter.clone().add(new THREE.Vector3(0,0,.55)).applyMatrix4(model.group.matrixWorld),direction=new THREE.Vector3(.28,.82,.83).transformDirection(model.group.matrixWorld),position=target.clone().addScaledVector(direction,8.8),pose={position,target,near:.002,far:110,minDistance:.035,maxDistance:30};
    animatePose(position,target,.65,{pose});syncUI();requestRender();
  });
  const omission=document.createElement('p');omission.id='uptake-omission';omission.className='uptake-omission';omission.setAttribute('aria-live','polite');
  host.append(selector,note,focus,cut,omission);$('journey-heading').before(host);
  const presentation=createUptakePresentation({container:$('scene'),camera,measure:()=>({width:renderer.domElement.clientWidth,height:renderer.domElement.clientHeight}),getTeaching:getTeachingState,getLabels:getPresentationLabels});
  const labelRay=new THREE.Raycaster(),instanceMatrix=new THREE.Matrix4();
  let labelSamples=new Map(),labelSampleKey='',labelRowsKey='',labelSampleTime=-Infinity,labelSampleTimer=null;
  function visibleMesh(o){for(let n=o;n;n=n.parent)if(!n.visible)return false;return true;}
  function visibleHit(hit){
    const mat=Array.isArray(hit.object.material)?hit.object.material[hit.face?.materialIndex||0]:hit.object.material;
    return mat?.visible!==false&&(mat?.opacity??1)>.025&&!mat?.clippingPlanes?.some(p=>p.distanceToPoint(hit.point)<-1e-5);
  }
  function sampleVisibleLabels(rows){
    const bindings=model.getVisibilityBindings(),meshes=bindings.map(b=>b.object).filter(visibleMesh);
    const key=[state.progress,state.section,...camera.position.toArray(),...camera.quaternion.toArray(),meshes.map(o=>o.id).join(',')].join('|'),now=performance.now();
    if(key===labelSampleKey)return;
    const rowKey=rows.map(row=>row.id).join('|');
    if(rowKey===labelRowsKey&&now-labelSampleTime<90){
      // A paused seek may be the final render. Schedule its trailing sample
      // instead of leaving anchors at the previous progress indefinitely.
      if(labelSampleTimer===null)labelSampleTimer=setTimeout(()=>{labelSampleTimer=null;if(!disposed){labelSampleTime=-Infinity;requestRender();}},Math.ceil(90-(now-labelSampleTime))+1);
      return;
    }
    if(labelSampleTimer!==null){clearTimeout(labelSampleTimer);labelSampleTimer=null;}
    labelRowsKey=rowKey;labelSampleKey=key;labelSampleTime=now;labelSamples=new Map();
    for(const row of rows){
      if(!row.targetRoles?.length){labelSamples.set(row.id,row.position);continue;}
      const targets=meshes.filter(o=>row.targetRoles.includes(o.userData.role)),points=[];
      for(const o of targets){
        if(o.isInstancedMesh){
          // Sample across the complete ring, not only its front instances.
          const stride=Math.max(1,Math.floor(o.count/16));
          for(let i=0;i<o.count;i+=stride){o.getMatrixAt(i,instanceMatrix);points.push(new THREE.Vector3().setFromMatrixPosition(instanceMatrix).applyMatrix4(o.matrixWorld));}
        }else points.push(o.getWorldPosition(new THREE.Vector3()));
      }
      for(const point of points){
        labelRay.set(camera.position,point.clone().sub(camera.position).normalize());
        const surface=labelRay.intersectObjects(targets,false).find(visibleHit);
        if(!surface)continue;
        labelRay.far=surface.distance+.002;
        const first=labelRay.intersectObjects(meshes,false).find(visibleHit);
        labelRay.far=Infinity;
        if(first&&targets.includes(first.object)){labelSamples.set(row.id,first.point);break;}
      }
    }
  }
  const roles={
    'a-cargo':{title:'颗粒货物',action:'膜包住货物，货物不穿膜',description:'这是被IgG调理的可降解大颗粒；被围在杯腔，封闭后仍留在吞噬体腔内。',color:'#af845b',lane:'top'},
    'a-receptor':{title:'FcγR · 膜上受体',action:'识别抗体 Fc，传入摄取信号',description:'胞外/腔面结合IgG-Fc；跨膜段留在膜中，胞质尾位于胞质侧。受体不是抗体。',color:'#8875a5',lane:'top'},
    'a-igg':{title:'IgG · 调理抗体',action:'Fab 贴颗粒，Fc 与受体配对',description:'Y形符号代表抗体：两个Fab臂识别颗粒抗原，另一侧Fc可被吞噬受体识别。',color:'#b69b5c',lane:'top'},
    'a-membrane':{title:'质膜 → 吞噬体膜',action:'弯曲包裹，闭合后形成腔室',description:'膜一直区分胞质侧与胞外/腔面；剖面去掉朝镜头的一部分，是观察窗口，不是膜漏了。',color:'#6c99a4',lane:'bottom'},
    'a-cytoskeleton':{title:'actin · 胞质侧骨架',action:'在膜杯外侧伴随包裹重排',description:'actin位于胞质侧，不在杯腔或颗粒内部。它参与摄取时局部形变，不是围住货物的第二层膜。',color:'#b48c4f',lane:'bottom'},
    'a-processing':{title:'腔内水解酶',action:'处理货物，产生较小片段',description:'酶性内容物在酸性处理腔内作用。显示的尺寸、数量及切割位置均为教学放大，未作酶动力学计算。',color:'#4d8681',lane:'bottom'},
    'b-receptor':{title:'MR-01 · 甘露糖受体',action:'嵌在膜上，可随膜回收',description:'结合域朝胞外/内体腔，短尾朝胞质。此受体不是甘露糖-6-磷酸受体。',color:'#8875a5'},
    'b-ligand':{title:'Ligand-01 · 可溶糖蛋白',action:'与受体分开后留在处理腔',description:'可溶货物不随受体膜回收；其降解路线与受体返回质膜的路线不同。',color:'#af845b'},
    'b-connected-tube':{title:'回收膜管',action:'受体沿同一膜面进入管部',description:'管腔与内体体部相连；随后载体交接的裂分中间态在此简化。',color:'#6c99a4'},
    'b-sides':{title:'膜两侧保持方向',action:'结合域朝腔 / 外，尾朝胞质',description:'膜内化和回收保持膜拓扑朝向，受体不会先掉入腔里再穿过膜回到表面。',color:'#6c99a4'},
    'uptake-handoff':{title:'分段状态交接',action:'尚未构建的中间态在此省略',description:'关键帧之间不是完整的出芽、裂分或融合模拟；同一受体与货物身份在前后保持。',color:'#a5967c'},
    'viral-antigen-boundary':{title:'非感染性抗原载体',action:'本例只讲清除，不表示感染',description:'这条清除路线不把RNA输送到胞质，不能由被摄取推出病毒成功感染。',color:'#a5967c'}
  };
  function getTeachingState(){
    const list=stages(),index=list.indexOf(stage()),guide=UPTAKE_GUIDES[state.uptakeCase],detail=guide.steps[Math.min(index,guide.steps.length-1)];
    const teaching=model?.getTeachingState?.();
    return{caseId:state.uptakeCase,index,title:stage().title,input:detail.partners.join(' · '),action:detail.desc,result:detail.location,...teaching};
  }
  function getPresentationLabels(){
    if(!model)return[];const handoff=model.getDiagnostics().handoff;
    const entries=model.getLabelState().filter(r=>r.visible&&(!handoff.active||handoff.weight>.08||r.id==='uptake-handoff')&&visibility.canShowScenarioLabel(r.id,model));
    sampleVisibleLabels(entries);
    return entries.flatMap(row=>{const position=labelSamples.get(row.id);if(!position)return[];const role=roles[row.id]??{title:row.title,action:row.action??row.text};return[{...role,...row,title:row.shortTitle??role.title??row.title,action:row.action??role.action,description:row.description??role.description,color:row.color??role.color,position}];});
  }
  function ensure(){if(model)return model;model=createUptakeScenario({whole,detail:true});scene.add(model.group);configureMaterialGroup(model.group);prepareShadows(model.group);model.group.visible=false;visibility.registerScenario(model,{id:'uptake'});model.setCase(state.uptakeCase);model.seek(state.progress);model.setSection(state.section);lastProgress=state.progress;return model;}
  function save(){snapshots.set(state.uptakeCase,{progress:state.progress,time:state.time,section:state.uptakeLocal?state.section:snapshots.get(state.uptakeCase).section});}
  function canEnter(){if(!model)return false;return model.getVisibilityBindings().some(({object:o})=>{for(let n=o;n&&n!==model.group;n=n.parent)if(!n.visible)return false;const keys=model.getObjectVisibilityDependencies(o);return keys?.every(k=>visibility.canShowLabel(k));});}
  function selectCase(id){if(!UPTAKE_CASES.some(c=>c.id===id)||state.view!=='whole'||isNavigating())return;save();if(state.following){state.following=false;cancelTransition();frameWhole();}state.uptakeCase=id;Object.assign(state,snapshots.get(id));if(!state.uptakeLocal)state.section=wholeSection;state.playing=false;closeFocus=false;ensure().setCase(id);model.seek(state.progress);model.setSection(snapshots.get(id).section);lastProgress=state.progress;if(state.uptakeLocal&&!canEnter())setLocal(false);setupPhases();if(state.uptakeLocal)focusCamera(true);syncUI();}
  function enter(){ensure();wholeSection=whole.group.userData.sectionAmount??state.section;const old=snapshots.get(state.uptakeCase);Object.assign(state,old);state.playing=false;closeFocus=false;model.setCase(state.uptakeCase);model.seek(state.progress);model.setSection(state.section);lastProgress=state.progress;state.uptakeLocal=canEnter();if(state.uptakeLocal)focusCamera(true);else{state.section=wholeSection;whole.setSection(wholeSection);}}
  function leave(){if(model&&state.scenario==='clearance')save();cancelTransition();if(state.uptakeLocal){state.section=wholeSection;whole.setSection(wholeSection);}state.uptakeLocal=false;closeFocus=false;if(model)model.group.visible=false;presentation.sync(false);}
  function focusCamera(animated=false){if(!model||!state.uptakeLocal||!canEnter())return;if(!animated)cancelTransition();model.group.visible=true;model.group.updateWorldMatrix(true,true);let position,target;
    if(closeFocus){const receptor=model.getVisibilityBindings().map(x=>x.object).find(o=>{if(o.userData.role!=='b-mr')return false;for(let n=o;n&&n!==model.group;n=n.parent)if(!n.visible)return false;return true;});if(receptor){const p=receptor.getWorldPosition(new THREE.Vector3()),normal=new THREE.Vector3(0,0,1).applyMatrix3(new THREE.Matrix3().getNormalMatrix(receptor.matrixWorld)).normalize(),tangent=new THREE.Vector3(1,0,0).transformDirection(receptor.matrixWorld);const d=model.getDiagnostics();if(d.stageIndex===2&&d.mr.surfaceParameter>.62){const axis=new THREE.Vector3(1,0,0).transformDirection(model.group.matrixWorld);position=p.clone().addScaledVector(normal,-.13).addScaledVector(axis,-.60).addScaledVector(tangent,.04);}else{const standoff=d.stageIndex===3 ? .33 : .50;position=p.clone().addScaledVector(normal,-standoff).addScaledVector(tangent,d.stageIndex===3 ? .14 : .18);}target=p.clone().addScaledVector(normal,-.10);}else{position=model.anchors.inside.clone().applyMatrix4(model.group.matrixWorld);target=model.anchors.insideTarget.clone().applyMatrix4(model.group.matrixWorld);}}else{target=new THREE.Vector3(0,0,0);const supplied=model.getPresentationBounds?.(),bounds=supplied?.clone().applyMatrix4(model.group.matrixWorld)??new THREE.Box3();if(!supplied)model.group.traverseVisible(o=>{if(!o.isMesh)return;const mats=Array.isArray(o.material)?o.material:[o.material];if(mats.every(m=>m.visible===false))return;if(o.isInstancedMesh){o.computeBoundingBox();bounds.union(o.boundingBox.clone().applyMatrix4(o.matrixWorld));}else{if(!o.geometry.boundingBox)o.geometry.computeBoundingBox();bounds.union(o.geometry.boundingBox.clone().applyMatrix4(o.matrixWorld));}});if(!bounds.isEmpty())target=bounds.getCenter(new THREE.Vector3());const size=bounds.isEmpty()?new THREE.Vector3(5,4,3):bounds.getSize(new THREE.Vector3());const direction=(isParticleUptakeCase(state.uptakeCase)?new THREE.Vector3(.28,.82,.83):new THREE.Vector3(.25,.26,1)).normalize(),angle=THREE.MathUtils.degToRad(camera.fov*.5),vertical=Math.max(.34,(renderer.domElement.clientHeight-365)/renderer.domElement.clientHeight),horizontal=Math.max(.6,(renderer.domElement.clientWidth-100)/renderer.domElement.clientWidth),fit=Math.max(size.y/(2*Math.tan(angle)*vertical),size.x/(2*Math.tan(angle)*camera.aspect*horizontal))+size.z*.55;position=target.clone().addScaledVector(direction,Math.max(fit,3.8));}
    presentationHome=true;lastCameraStage=state.uptakeCase+':'+stage().at;
    const pose={position,target,near:.002,far:110,minDistance:.035,maxDistance:Math.max(25,model.radius*9)};state.cameraHome=false;
    if(animated)animatePose(position,target,.55,{pose,arc:true});else{camera.position.copy(position);controls.target.copy(target);camera.near=pose.near;camera.far=pose.far;controls.minDistance=pose.minDistance;controls.maxDistance=pose.maxDistance;camera.updateProjectionMatrix();controls.update();requestRender();}}
  function setLocal(value,{pause=true}={}){if(state.scenario!=='clearance'||state.view!=='whole'||isNavigating())return;ensure();if(value&&!canEnter())return;cancelTransition();if(!value&&pause)state.playing=false;if(value&&!state.uptakeLocal){wholeSection=state.section;state.section=snapshots.get(state.uptakeCase).section;model.setSection(state.section);}else if(!value&&state.uptakeLocal){save();state.section=wholeSection;whole.setSection(wholeSection);}state.uptakeLocal=Boolean(value);state.following=false;closeFocus=false;if(value)focusCamera(true);else frameWhole();syncUI();}
  function getWholeProgress(){return state.scenario==='clearance'&&isParticleUptakeCase(state.uptakeCase) ? .38+.62*THREE.MathUtils.clamp((state.progress-.62)/.38,0,1):.38;}
  function canPlay(){return state.uptakeLocal||isParticleUptakeCase(state.uptakeCase);}
  function stages(){return UPTAKE_STAGES[state.uptakeCase];}
  function stage(){const list=stages();return list.reduce((a,b)=>state.progress>=b.at?b:a,list[0]);}
  function update(){if(disposed)return;const showing=state.scenario==='clearance'&&state.view==='whole'&&state.uptakeLocal;if(state.scenario==='clearance'&&!state.uptakeLocal&&!canPlay())state.playing=false;if(model){model.group.visible=showing;if(state.scenario==='clearance'&&state.progress!==lastProgress){model.seek(state.progress);lastProgress=state.progress;requestRender();}}if(state.scenario==='clearance'&&state.view==='whole')whole.group.visible=!showing;presentation.sync(showing,{annotations:isAnnotationsVisible()});if(showing&&presentationHome&&lastCameraStage!==state.uptakeCase+':'+stage().at)focusCamera(true);}
  function section(value){if(state.scenario!=='clearance'||!state.uptakeLocal||state.view!=='whole')return false;ensure().setSection(value);requestRender();return true;}
  function renderUI(){update();document.body.classList.toggle('uptake-mode',state.scenario==='clearance');const enabled=state.scenario==='clearance',showing=enabled&&state.view==='whole';host.hidden=!showing;if(!enabled){presentation.sync(false);return;}const entry=UPTAKE_CASES.find(c=>c.id===state.uptakeCase),current=stage();note.textContent=state.uptakeCase===VIRAL_ANTIGEN_UPTAKE_CASE_ID?'限定：IgG调理的非感染性病毒相关抗原载体；不代表病毒入侵或感染。':'退出局部或探索细胞器时暂停，进度保留。';for(const b of selector.children){b.setAttribute('aria-pressed',String(b.dataset.uptakeCase===state.uptakeCase));b.disabled=state.view!=='whole'||isNavigating();}cut.hidden=!state.uptakeLocal||!isParticleUptakeCase(state.uptakeCase);cut.disabled=isNavigating()||!canEnter();focus.hidden=!state.uptakeLocal&&!isParticleUptakeCase(state.uptakeCase);focus.textContent=!state.uptakeLocal?(state.following?'返回整胞视角':'跟随整胞吞噬体'):(closeFocus?'返回局部构象总览':'靠近分子接触区');omission.textContent=!state.uptakeLocal?(isParticleUptakeCase(state.uptakeCase)?'整胞显示已封闭后的安全运输、共腔成熟与处理段；局部膜杯及裂分另见放大示意。':'这里仅作整胞位置参照；进入局部过程后播放受体与配体的分流。'):(current.omission||'独立局部教学构象；颜色、比例与时长经过调整。');if(state.uptakeCase===VIRAL_ANTIGEN_UPTAKE_CASE_ID)omission.textContent='此处只演示IgG-Fc介导的抗原载体清除；胞质RNA另属独立条件。'+omission.textContent;$('journey-heading').textContent=state.uptakeCase===UPTAKE_CASES[0].id?'一颗颗粒的旅程':entry.title;$('phase-description').textContent=current.desc;$('follow-button').textContent=state.uptakeLocal?'返回整胞':'跟随颗粒';$('follow-button').disabled=isNavigating()||!state.uptakeLocal&&!canEnter();focus.disabled=isNavigating()||state.uptakeLocal&&!canEnter();$('play-button').disabled=isNavigating()||!canPlay();$('mode-status').textContent='受体、货物与膜各有去向';if(showing){$('subtitle').textContent=state.uptakeLocal?entry.title+(isParticleUptakeCase(state.uptakeCase)&&state.section>.55?' · 膜纵剖，货物保留完整':' · 独立局部放大'):'整胞定位 · '+entry.title;$('view-hint').textContent=state.uptakeLocal?'拖动环视 · 点击标注查看作用 · 进度可倒拖':'拖动旋转 · 点击细胞器放大 · 跟随颗粒观察摄取';$('callouts').hidden=state.uptakeLocal;}update();}
  function updateLabels(){if(!model||!isAnnotationsVisible())return;presentation.update();}
  function pick(e){if(!state.uptakeLocal||!model)return false;const rect=renderer.domElement.getBoundingClientRect(),ray=new THREE.Raycaster();ray.setFromCamera(new THREE.Vector2((e.clientX-rect.left)/rect.width*2-1,-(e.clientY-rect.top)/rect.height*2+1),camera);const hit=ray.intersectObject(model.group,true).find(h=>{for(let o=h.object;o;o=o.parent)if(!o.visible)return false;const m=Array.isArray(h.object.material)?h.object.material[h.face?.materialIndex||0]:h.object.material;return m?.visible!==false&&(m?.opacity??1)>.025&&!m?.clippingPlanes?.some(p=>p.distanceToPoint(h.point)<0);});if(hit){closeFocus=true;focusCamera(true);syncUI();}return true;}
  function beforeHide(canShowAfter){if(!state.uptakeLocal||!model)return;const relevant=model.getLabelState().filter(r=>r.visible).map(r=>model.getLabelVisibilityDependencies(r.id));if(relevant.some(keys=>keys?.some(k=>!canShowAfter(k)))){state.playing=false;setLocal(false);}}
  return {enter,leave,ensure,canEnter,canPlay,getWholeProgress,markUserView(){presentationHome=false;},selectCase,setLocal,focusCamera,stages,stage,section,update,renderUI,updateLabels,pick,beforeHide,get model(){return model;},get duration(){return UPTAKE_CASES.find(c=>c.id===state.uptakeCase).duration;},diagnostics(){return{caseId:state.uptakeCase,local:state.uptakeLocal,closeFocus,canEnter:canEnter(),canPlay:canPlay(),presentationHome,lastCameraStage,appliedWholeProgress:getWholeProgress(),wholeSection,stage:stage(),caseSnapshots:Object.fromEntries(snapshots),teaching:getTeachingState(),presentation:presentation.diagnostics(),model:model?.getDiagnostics()??null};},dispose(){if(disposed)return;disposed=true;if(labelSampleTimer!==null)clearTimeout(labelSampleTimer);host.remove();presentation.dispose();if(model){scene.remove(model.group);model.dispose();}}};
}
