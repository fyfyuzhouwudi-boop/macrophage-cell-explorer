// Camera guidance uses the visible actors; the host retains ownership of time and rendering.
export function createReactionFocus({THREE,state,viral,whole,camera,controls,canShow=()=>true,canUseActor=object=>object.visible!==false,isNavigating=()=>false,isTransitioning=()=>false,animate,cancelTransition,requestRender,onChange=()=>{}}){
  const rows=viral.getVisibilityBindings(),V=THREE.Vector3;
  let requested=false,current=null,lastCenter=null,dragPending=false,manual=false,reason="initial",sideOverride=null,notification="",productIndex=null;
  const valid=(r,filter=canShow)=>{
    if(!viral.getObjectVisibilityDependencies(r.object)?.every(filter))return false;
    if(!canUseActor(r.object))return false;
    for(let n=r.object.parent;n;n=n.parent)if(!n.visible)return false;
    return (Array.isArray(r.object.material)?r.object.material:[r.object.material]).some(m=>m&&m.visible!==false&&(m.opacity??1)>.025);
  };
  const select=(role,name)=>rows.filter(r=>(!role||r.role===role)&&(!name||r.object.name===name)&&valid(r));
  function target(){
    const p=state.progress,d=viral.getDiagnostics();
    let key,labelId,actors=[],radius=.1,normal=null,inside=false,viewDirection=null,contextState=null;
    if(p<.16){key="particle";labelId="virus";radius=.16;contextState=p<.14?'external':'internal';viewDirection=new V().fromArray(p<.14?d.uptakeViewDirection:d.endosomalViewDirection);actors=p<.14?[...select('host-uptake-membrane-local-context'),...(p<.11?select('external-or-taken-viral-particle-and-components'):[])]:[...select('external-or-taken-viral-particle-and-components'),...select('uptake-endosomal-compartment-and-associated-domains')];}
    else if(p<.32){key="endosomal-processing";labelId="endosome";radius=.15;viewDirection=new V().fromArray(d.endosomalViewDirection);actors=[...select("uptake-endosomal-compartment-and-associated-domains"),...select('external-or-taken-viral-particle-and-components'),...select("viral-component-fragments-in-endosomal-lumen")];}
    else if(p<.38){key="cytosolic-recognition";labelId="conditional-rna";radius=.18;actors=[...select("independent-conditional-cytosolic-viral-RNA"),...select("host-cytosolic-RNA-sensor-example")];}
    else if(p<.445){key="MAVS";labelId="mavs";radius=.12;normal=new V().fromArray(d.mavsNormal);actors=select("mitochondrial-outer-membrane-adaptor-schematic");}
    else if(p<.49){key='TBK1-activation';labelId='mavs';radius=.12;actors=select('host-MAVS-downstream-kinase-excerpt');}
    else if(p<.616){key="IRF3-transport";labelId="irf3";radius=.055;actors=select(null,"ActivatedIRF3TeachingDimer");}
    else if(p<.65){key="nuclear-transcription";labelId="ifnb1";radius=.20;actors=select("host-nuclear-transcription-teaching-projection");}
    else if(p<.668){key='mRNA-to-ER';labelId='secretion';radius=.07;actors=select('host-messenger-RNA-export-to-ER-schematic');}
    else if(p<.693){key='ER-translation';labelId='secretion';radius=.15;actors=select('host-ER-translation-local-excerpt');viewDirection=new V(.12,-1,.27);}
    else if(p<.728){key='Golgi-processing';labelId='secretion';radius=.15;actors=select('host-Golgi-processing-local-excerpt');viewDirection=new V(.10,-1,.18);}
    else if(p<.785){key='secretory-carrier';labelId='secretion';radius=.16;actors=select('host-secretory-vesicle-and-IFN-cargo');}
    else if(p<.815){key='exocytosis';labelId='secretion';radius=.14;actors=select('host-IFN-exocytosis-local-excerpt');viewDirection=new V(0,-1,.40).applyQuaternion(new THREE.Quaternion().setFromUnitVectors(new V(0,0,1),new V().fromArray(d.exportNormal)));}
    else if(p<.845){key='released-IFN';labelId='secretion';radius=.1;actors=select('host-extracellular-released-IFN');}
    else if(p<.86){key="approaching-IFN";labelId="ifnar";radius=.12;actors=select(null,"SelectedIFNBetaBindingIFNAR2");}
    else if(p<.915){
      inside=sideOverride==="inside"||(!sideOverride&&p>=.885);
      key=inside?"IFNAR-cytosolic-JAK":"IFNAR-extracellular-assembly";labelId="ifnar";normal=new V().fromArray(d.ifnarNormal);
      radius=inside?.14:.20;
      actors=inside?select("IFNAR-associated-cytosolic-kinase-schematic"):[...select("host-cell-surface-IFNAR-context"),...select("host-extracellular-IFN-bound-to-receptor-context")];
    }else if(p<.963){key="STAT-transport";labelId="isg";radius=.055;actors=select(null,"STAT1STAT2IRF9SelectedComplex");}
    else if(p<.985){key='ISG-transcription';labelId='isg';radius=.16;actors=select('host-ISG-nuclear-transcription-excerpt');}
    else{key="induced-products";labelId="isg";radius=.085;actors=select("host-cytosolic-induced-gene-product-schematic").map(r=>{
      if(productIndex===null){const m=new THREE.Matrix4(),q=new V(),desired=new V(1.8,-1.8,2.7);let best=Infinity;for(let i=0;i<r.object.count;i++){r.object.getMatrixAt(i,m);q.setFromMatrixPosition(m);const score=q.distanceToSquared(desired)+(q.z<.5?20:0);if(score<best){best=score;productIndex=i;}}}
      return {...r,instanceIds:[productIndex],representative:true};
    });}
    return actors.length?{key,labelId,actors,radius,normal,inside,viewDirection,contextState,p}:null;
  }
  function bounds(t){
    const box=new THREE.Box3(),point=new V(),matrix=new THREE.Matrix4(),instance=new THREE.Matrix4();
    viral.group.updateWorldMatrix(true,true);
    for(const r of t.actors){
      const o=r.object,a=o.geometry?.attributes.position;if(!a)continue;
      const ids=r.instanceIds??Array.from({length:o.isInstancedMesh?o.count:1},(_,i)=>i);
      const materials=Array.isArray(o.material)?o.material:[o.material];
      for(const k of ids){
        matrix.copy(o.matrixWorld);if(o.isInstancedMesh){o.getMatrixAt(k,instance);matrix.multiply(instance);}
        for(let j=0;j<a.count;j++){
          point.fromBufferAttribute(a,j).applyMatrix4(matrix);
          if(materials.every(m=>!m?.clippingPlanes?.length||m.clippingPlanes.every(pl=>pl.distanceToPoint(point)>=0)))box.expandByPoint(point);
        }
      }
    }
    if(box.isEmpty())return null;
    const center=box.getCenter(new V()),size=box.getSize(new V());
    box.expandByPoint(center.clone().addScalar(t.radius));box.expandByPoint(center.clone().addScalar(-t.radius));
    const pore=new V().fromArray(viral.getDiagnostics().nuclearPore);
    if(/IRF3|STAT/.test(t.key)&&center.distanceTo(pore)<.42){
      box.expandByPoint(pore.clone().addScalar(.13));box.expandByPoint(pore.clone().addScalar(-.13));
    }
    return {box,center,size};
  }
  function pose(t,b){
    let dir=t.viewDirection?.clone()??new V(.12,.18,1);
    if(t.normal){
      const tangent=new V(0,0,1).addScaledVector(t.normal,-t.normal.z).normalize();
      dir=t.normal.clone().multiplyScalar(t.inside?-.85:.58).addScaledVector(tangent,t.inside?.5:.8).add(new V(0,.1,0)).normalize();
    }
    if(/IRF3|STAT/.test(t.key)){
      const d=viral.getDiagnostics(),pore=new V().fromArray(d.nuclearPore);
      if(b.center.distanceTo(pore)<.42)dir=new V().fromArray(d.nuclearPoreDirection).multiplyScalar(.40).add(new V(0,.12,.9)).normalize();
    }
    dir.normalize();const right=new V().crossVectors(new V(0,1,0),dir).normalize(),up=new V().crossVectors(dir,right).normalize();
    const tan=Math.tan(THREE.MathUtils.degToRad(camera.fov/2));let distance=.18;
    for(const x of [b.box.min.x,b.box.max.x])for(const y of [b.box.min.y,b.box.max.y])for(const z of [b.box.min.z,b.box.max.z]){
      const q=new V(x,y,z).sub(b.center),depth=q.dot(dir);
      distance=Math.max(distance,depth+Math.abs(q.dot(up))/(tan*.62),depth+Math.abs(q.dot(right))/(tan*camera.aspect*.49));
    }
    distance*=1.08;
    const target=b.center.clone().addScaledVector(right,-distance*tan*camera.aspect*.26);
    return {position:target.clone().addScaledVector(dir,distance),target,near:Math.max(.00005,Math.min(.008,distance*.004)),far:110,minDistance:Math.max(.015,distance*.08),maxDistance:65};
  }
  const flags=()=>{state.viralFocused=Boolean(current);state.viralFocusLabelId=current?.labelId??null;state.viralFocusKind=current?.key??null;state.viralSurfaceSide=current?.key.startsWith("IFNAR-")?(current.inside?"inside":"outside"):null;state.viralFocusRequested=requested;};
  function notify(){
    flags();const text=[requested,current?.key??"",current?.inside??"",reason].join("|");
    if(text!==notification){notification=text;onChange();}
  }
  function clear(){current=null;lastCenter=null;flags();}
  function leave(why="leave"){requested=false;manual=false;sideOverride=null;reason=why;clear();notify();}
  function approach(t,b,force=false){
    const change=!current||current.key!==t.key||current.contextState!==t.contextState;
    if(change||force){const p=pose(t,b);const arc=current?.key.startsWith("IFNAR-")&&t.key.startsWith("IFNAR-");current=t;lastCenter=b.center.clone();animate(p,{duration:.65,arc});notify();requestRender();return;}
    current=t;
  }
  function update(dt){
    if(!requested||manual||dragPending||state.scenario!=="virus"||state.view!=="whole"||isNavigating())return;
    const next=target();
    if(!next){if(current){cancelTransition();reason="no-visible-actor";clear();notify();}return;}
    const b=bounds(next);if(!b){cancelTransition();reason="no-retained-actor-vertices";clear();notify();return;}
    if(!current||current.key!==next.key||current.contextState!==next.contextState){approach(next,b);return;}
    current=next;flags();
    if(isTransitioning())return;
    // Move by the actor displacement without changing the user's angular view.
    const delta=b.center.clone().sub(lastCenter??b.center);camera.position.add(delta);controls.target.add(delta);lastCenter=b.center.clone();
    if(dt>0){
      const desired=pose(next,b).position.distanceTo(b.center),offset=camera.position.clone().sub(controls.target),length=offset.length();
      if(length>0)camera.position.copy(controls.target).add(offset.multiplyScalar((length+(desired-length)*(1-Math.exp(-dt*7)))/length));
    }
    if(delta.lengthSq()>1e-14||dt>0){controls.update();requestRender();}
  }
  function focus(){if(state.scenario!=="virus"||state.view!=="whole"||isNavigating())return false;const t=target(),b=t&&bounds(t);if(!b)return false;requested=true;manual=false;dragPending=false;reason="focus";approach(t,b,true);return true;}
  function timelineChanged(why){if(requested&&!manual)cancelTransition();reason=why;sideOverride=null;clear();if(requested&&!manual){viral.setProgress(state.progress);const t=target(),b=t&&bounds(t);if(b)approach(t,b,true);}notify();}
  function manualInterrupt(why="manual"){cancelTransition();requested=false;manual=true;dragPending=false;sideOverride=null;reason=why;clear();notify();}
  function pointerStart(){dragPending=true;cancelTransition();}
  function pointerEnd(){dragPending=false;}
  function toggleSide(){if(!current?.key.startsWith("IFNAR-"))return focus();sideOverride=current.inside?"outside":"inside";reason="side-switch";const t=target(),b=t&&bounds(t);if(b)approach(t,b,true);return true;}
  function isCurrentValid(filter=canShow){return Boolean(current?.actors.length&&current.actors.every(r=>valid(r,filter)));}
  return {focus,timelineChanged,manualInterrupt,pointerStart,pointerEnd,toggleSide,leave,update,
    canFocus:()=>Boolean(target()),isReceptor:()=>Boolean(requested&&current?.labelId==="ifnar"&&state.view==="whole"&&state.scenario==="virus"&&isCurrentValid()),
    isActive:()=>Boolean(requested&&current&&state.view==="whole"&&state.scenario==="virus"&&isCurrentValid()),
    isCurrentValid,focusPoint:()=>lastCenter?.clone()??null,
    shouldHoldTimeline:()=>Boolean(requested&&!manual&&!dragPending&&isTransitioning()&&state.view==="whole"&&state.scenario==="virus"),
    diagnostics:()=>({requested,manual,pointerPending:dragPending,reason,key:current?.key??null,labelId:current?.labelId??null,side:current?.inside?"inside":"outside",actors:current?.actors.map(r=>r.object.name+(r.instanceIds?" [instance "+r.instanceIds.join(",")+"]":""))??[],representativeInstance:current?.actors.find(r=>r.representative)?.instanceIds?.[0]??null,bounds:current?(()=>{const b=bounds(current);return b?{min:b.box.min.toArray(),max:b.box.max.toArray(),center:b.center.toArray()}:null;})():null,clockOwnedByHost:true}),
    dispose:()=>leave("dispose")};
}
