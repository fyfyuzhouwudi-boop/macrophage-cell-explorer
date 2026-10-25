// Names and functions attached to model-owned anatomical landmarks. The labels
// never invent molecular identities for unmarked EM-like residual material.
export function createOrganelleContentOverlay({THREE,container,camera,measure,getContext}){
 const ns='http://www.w3.org/2000/svg',host=document.createElement('div');host.className='organelle-content-overlay';host.hidden=true;container.append(host);
 const svg=document.createElementNS(ns,'svg');svg.setAttribute('class','content-leaders');host.append(svg);
 const note=document.createElement('div');note.className='content-reading-note';host.append(note);
 const rows=Array.from({length:4},()=>{
  const box=document.createElement('div');box.className='content-label';const title=document.createElement('strong'),description=document.createElement('span');box.append(title,description);host.append(box);
  const line=document.createElementNS(ns,'path'),dot=document.createElementNS(ns,'circle');dot.setAttribute('r','2.8');svg.append(line,dot);return{box,title,description,line,dot};
 });
 const projected=new THREE.Vector3(),point=new THREE.Vector3(),origin=new THREE.Vector3(),direction=new THREE.Vector3(),raycaster=new THREE.Raycaster();let last={active:false,labels:[],hidden:[],collisions:[]},disposed=false,lastOcclusionKey='',occlusion=new Map();
 function isOccluded(model,anchor,id){
  const worldScale=model.group.matrixWorld.getMaxScaleOnAxis(),distance=origin.distanceTo(anchor),tolerance=.022*worldScale;
  if(occlusion.has(id))return occlusion.get(id);
  direction.subVectors(anchor,origin).normalize();raycaster.set(origin,direction);raycaster.near=0;raycaster.far=Math.max(0,distance-tolerance);
  const hits=raycaster.intersectObject(model.group,true);let blocked=false;
  for(const hit of hits){let visible=true;for(let o=hit.object;o;o=o.parent)if(!o.visible){visible=false;break;}if(!visible||hit.object.userData.pickThrough)continue;
   const m=Array.isArray(hit.object.material)?hit.object.material[hit.face?.materialIndex??0]:hit.object.material;
   if(!m||m.visible===false||(m.opacity??1)<.95||m.clippingPlanes?.some(plane=>plane.distanceToPoint(hit.point)<-1e-5))continue;
   blocked=true;break;
  }
  occlusion.set(id,blocked);return blocked;
 }
 const overlap=(a,b)=>a.left<b.right+7&&a.right>b.left-7&&a.top<b.bottom+7&&a.bottom>b.top-7;
 function update(){
  if(disposed)return;const context=getContext(),model=context?.model,labels=model?.metadata?.contentLabels;
  if(!context?.visible||!labels?.length){host.hidden=true;container.classList.remove('content-reading-active');last={active:false,labels:[],hidden:[],collisions:[]};return;}
  const{width,height}=measure();if(width<500||height<440){host.hidden=true;container.classList.remove('content-reading-active');last={active:false,narrowViewport:true,labels:[],hidden:[],collisions:[]};return;}
  host.hidden=false;container.classList.add('content-reading-active');host.style.width=width+'px';host.style.height=height+'px';svg.setAttribute('viewBox',`0 0 ${width} ${height}`);
  camera.getWorldPosition(origin);const occlusionKey=[model.group.uuid,model.group.userData.section,...camera.matrixWorld.elements,...model.group.matrixWorld.elements].join(',');if(occlusionKey!==lastOcclusionKey){lastOcclusionKey=occlusionKey;occlusion.clear();}
  const lesson=model.metadata.contentLesson;note.textContent=(lesson?.title??'本图内容')+'｜'+(lesson?.note??'颜色与大小用于教学辨认。');
  const top=Math.max(128,(container.querySelector('.heading')?.getBoundingClientRect().bottom??100)-container.getBoundingClientRect().top+20),bottom=height-160,labelWidth=Math.min(205,width*.225),occupied=[],visible=[],hidden=[];
  const sideCount=[0,0];
  for(let i=0;i<rows.length;i++){
   const row=rows[i],entry=labels[i],anchor=entry&&model.anchors[entry.anchor];
   const show=Boolean(anchor)&&Number(model.group.userData.section??0)>.18;
   if(!show){row.box.hidden=true;row.line.style.display=row.dot.style.display='none';if(entry)hidden.push({id:entry.id,reason:'closed-or-no-landmark'});continue;}
   point.copy(anchor).applyMatrix4(model.group.matrixWorld);projected.copy(point).project(camera);
   if(isOccluded(model,point,entry.id)){row.box.hidden=true;row.line.style.display=row.dot.style.display='none';hidden.push({id:entry.id,reason:'landmark-occluded-by-model'});continue;}
   if(projected.z<-1||projected.z>1||Math.abs(projected.x)>1||Math.abs(projected.y)>1){row.box.hidden=true;row.line.style.display=row.dot.style.display='none';hidden.push({id:entry.id,reason:'landmark-outside-view'});continue;}
   row.box.hidden=false;row.title.textContent=entry.title;row.description.textContent=entry.description;row.box.style.width=labelWidth+'px';row.box.style.setProperty('--content-color',entry.color);
   const x=(projected.x*.5+.5)*width,y=(-projected.y*.5+.5)*height;
   let side=x<width*.50?0:1;if(sideCount[side]>=2&&sideCount[1-side]<2)side=1-side;
   const n=sideCount[side]++,h=row.box.offsetHeight,left=side===0?20:width-labelWidth-20;
   const ideal=n===0?top+32:bottom-h-10;
   let ty=Math.max(top,Math.min(bottom-h,ideal));
   const bounds={left,top:ty,right:left+labelWidth,bottom:ty+h};
   for(const prior of occupied)if(overlap(bounds,prior)){ty=prior.bottom+12;bounds.top=ty;bounds.bottom=ty+h;}
   row.box.style.left=left+'px';row.box.style.top=ty+'px';occupied.push(bounds);
   const endX=side===0?left+labelWidth:left,endY=ty+h*.5,elbow=endX+(side===0?12:-12);
   row.line.style.display=row.dot.style.display='';row.line.setAttribute('d',`M${x.toFixed(1)} ${y.toFixed(1)} L${elbow.toFixed(1)} ${endY.toFixed(1)} L${endX.toFixed(1)} ${endY.toFixed(1)}`);row.line.setAttribute('stroke',entry.color);row.dot.setAttribute('fill',entry.color);row.dot.setAttribute('cx',x);row.dot.setAttribute('cy',y);
   visible.push({id:entry.id,title:entry.title,description:entry.description,anchor:entry.anchor,world:point.toArray(),screen:[x,y],bounds});
  }
  const collisions=[];for(let i=0;i<occupied.length;i++)for(let j=i+1;j<occupied.length;j++)if(overlap(occupied[i],occupied[j]))collisions.push([i,j]);
  if(hidden.length)note.textContent+=' 部分标注随遮挡隐藏，可旋转或剖切观察。';
  last={active:true,model:model.group.userData.organelleId,labels:visible,hidden,collisions,allOnCanvas:occupied.every(b=>b.left>=0&&b.right<=width&&b.top>=top&&b.bottom<height-110),teachingNote:note.textContent,anchorsFromActualModel:true,occlusionAware:true};
 }
 return{update,diagnostics:()=>structuredClone(last),dispose(){disposed=true;container.classList.remove('content-reading-active');host.remove();}};
}
