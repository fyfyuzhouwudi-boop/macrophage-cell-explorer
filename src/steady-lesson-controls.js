/**
 * Five causal steps and perimeter annotations for the local cooperation lesson.
 * This module owns presentation only: the host owns time, camera and seeking.
 */
export function createSteadyLessonControls({THREE,container,camera,measure,model,onSeekStage}) {
  if(!THREE?.Vector3||!container||!camera||typeof measure!=='function'||!model?.getTeachingState||!model?.getLabelState) {
    throw new TypeError('Steady lesson controls require THREE, a scene container, camera, measure and the steady model.');
  }
  const doc=container.ownerDocument,body=doc.body,svgNS='http://www.w3.org/2000/svg';
  const journey=doc.getElementById('journey-panel'),phases=journey?.querySelector('#phase-list');
  if(!journey||!phases)throw new Error('Steady lesson controls require journey-panel and phase-list.');
  const make=(tag,className,parent)=>{const node=doc.createElement(tag);if(className)node.className=className;parent?.append(node);return node;};
  const text=(value,max=180)=>{const chars=Array.from(String(value??'').replace(/\s+/g,' ').trim());return chars.length>max?chars.slice(0,max-1).join('')+'…':chars.join('');};
  const setText=(node,value,max)=>{const next=text(value,max);if(node.textContent!==next)node.textContent=next;};
  const clamp=(value,min,max)=>Math.max(min,Math.min(max,value));
  const finite=value=>Number.isFinite(Number(value));
  const rect=(x,y,width,height)=>({x,y,left:x,top:y,right:x+width,bottom:y+height,width,height});
  const overlaps=(a,b,gap=0)=>a.left<b.right+gap&&a.right>b.left-gap&&a.top<b.bottom+gap&&a.bottom>b.top-gap;
  const tint=value=>typeof value==='string'&&/^#[\da-f]{3,8}$/i.test(value)?value:'#77949f';

  const panel=make('section','steady-lesson-steps');panel.hidden=true;panel.setAttribute('aria-label','日常协作的五个步骤');
  phases.insertAdjacentElement('afterend',panel);
  const heading=make('div','steady-lesson-step-heading',panel),headingText=make('h3','',heading),counter=make('span','steady-lesson-counter',heading);
  headingText.textContent='逐步看清联系';counter.setAttribute('aria-live','polite');counter.setAttribute('aria-atomic','true');
  const stepList=make('ol','steady-lesson-step-list',panel);
  const stageButtons=Array.from({length:5},(_,index)=>{
    const li=make('li','',stepList),button=make('button','steady-lesson-stage',li);button.type='button';button.dataset.steadyStage=String(index);
    const number=make('span','steady-lesson-stage-number',button),title=make('span','steady-lesson-stage-title',button);
    number.textContent=String(index+1).padStart(2,'0');return{li,button,title};
  });
  const navigation=make('div','steady-lesson-navigation',panel),prev=make('button','',navigation),navHint=make('span','',navigation),next=make('button','',navigation);
  prev.type=next.type='button';prev.dataset.steadyPrev='';next.dataset.steadyNext='';prev.textContent='← 上一步';next.textContent='下一步 →';navHint.textContent='点步骤可暂停观察';

  const host=make('div','steady-lesson-overlay',container);host.hidden=true;host.setAttribute('aria-label','日常协作场景标注');
  const svg=doc.createElementNS(svgNS,'svg');svg.setAttribute('class','steady-lesson-leaders');svg.setAttribute('aria-hidden','true');host.append(svg);
  const rows=Array.from({length:6},()=>{
    const button=make('button','steady-lesson-label',host);button.type='button';button.hidden=true;button.setAttribute('aria-expanded','false');
    const title=make('strong','',button),description=make('span','steady-lesson-label-description',button),affordance=make('span','steady-lesson-label-affordance',button);
    affordance.textContent='＋';affordance.setAttribute('aria-hidden','true');
    const line=doc.createElementNS(svgNS,'path'),dot=doc.createElementNS(svgNS,'circle');
    line.setAttribute('fill','none');line.setAttribute('stroke-width','1');line.setAttribute('stroke-linecap','round');line.setAttribute('stroke-linejoin','round');dot.setAttribute('r','2.7');svg.append(line,dot);
    return{button,title,description,affordance,line,dot,id:null,entry:null};
  });
  const strip=make('section','steady-lesson-causal-strip',host);strip.setAttribute('aria-label','本步的输入、变化与去向');
  const stripCells=['输入','当前变化','去向 / 结果'].map((label,index)=>{
    const cell=make('div','steady-lesson-causal-cell',strip),caption=make('span','steady-lesson-causal-caption',cell),content=make('p','',cell);
    caption.textContent=label;return{cell,caption,content,index};
  });
  const motionTitle=make('strong','steady-lesson-motion-title');
  stripCells[1].content.before(motionTitle);motionTitle.hidden=true;

  let active=false,disposed=false,current=null,signature='',expanded=null,updates=0,projectedFrames=0,modelBounds=null;
  let last={active:false,stage:null,topic:null,labels:[],overlaps:[],modelOverlaps:[]};
  const point=new THREE.Vector3(),projected=new THREE.Vector3(),viewPoint=new THREE.Vector3();
  const localBox=new THREE.Box3(),worldBox=new THREE.Box3(),inverse=new THREE.Matrix4();
  const boxCorners=Array.from({length:8},()=>new THREE.Vector3());
  const hideRow=row=>{row.button.hidden=true;row.line.style.display=row.dot.style.display='none';};
  const stop=event=>event.stopPropagation();
  const preserveNativeKey=event=>{if(event.code==='Space'||event.key==='ArrowLeft'||event.key==='ArrowRight')event.stopPropagation();};
  for(const node of[panel,host]){node.addEventListener('pointerdown',stop);node.addEventListener('wheel',stop,{passive:true});node.addEventListener('keydown',preserveNativeKey);}

  function seek(index){if(active&&!disposed&&typeof onSeekStage==='function')onSeekStage(clamp(Math.trunc(index),0,4));}
  const panelClick=event=>{
    const stage=event.target.closest?.('[data-steady-stage]');
    if(stage&&panel.contains(stage)){seek(Number(stage.dataset.steadyStage));return;}
    if(event.target.closest?.('[data-steady-prev]'))seek((current?.index??0)-1);
    else if(event.target.closest?.('[data-steady-next]'))seek((current?.index??0)+1);
  };
  panel.addEventListener('click',panelClick);
  const labelClick=event=>{
    const button=event.target.closest?.('[data-steady-label]');if(!button||!host.contains(button))return;
    expanded=expanded===button.dataset.steadyLabel?null:button.dataset.steadyLabel;
    for(const row of rows){const open=row.id===expanded;row.button.setAttribute('aria-expanded',String(open));row.affordance.textContent=open?'−':'＋';}
    update();
  };
  host.addEventListener('click',labelClick);
  const escape=event=>{if(event.key==='Escape'&&expanded){event.stopPropagation();expanded=null;for(const row of rows){row.button.setAttribute('aria-expanded','false');row.affordance.textContent='＋';}update();}};
  host.addEventListener('keydown',escape);

  function sampleBounds(){
    // Read actual visible geometry only on a stage/content change. Each frame
    // projects this envelope and the actual anchors; it never rebuilds meshes.
    const group=model.group;if(!group)return null;
    group.updateWorldMatrix(true,true);inverse.copy(group.matrixWorld).invert();localBox.makeEmpty();
    group.traverseVisible(object=>{
      if(!object.isMesh||!object.geometry)return;
      if(!object.geometry.boundingBox)object.geometry.computeBoundingBox();
      if(!object.geometry.boundingBox)return;
      worldBox.copy(object.geometry.boundingBox).applyMatrix4(object.matrixWorld).applyMatrix4(inverse);localBox.union(worldBox);
    });
    if(localBox.isEmpty())return null;
    return localBox.clone().expandByScalar(.16);
  }

  function sync(visible){
    if(disposed)return;
    active=Boolean(visible);body.classList.toggle('steady-lesson-active',active);panel.hidden=host.hidden=!active;
    if(!active){rows.forEach(hideRow);last={active:false,stage:current?.index??null,topic:current?.topic??null,labels:[],overlaps:[],modelOverlaps:[]};return;}
    current=model.getTeachingState();
    const entries=(model.getLabelState()??[]).filter(entry=>entry.visible!==false).slice(0,6);
    const nextSignature=JSON.stringify([current.topic,current.index,current.title,current.input,current.action,current.result,current.stages?.map(stage=>stage.title),entries.map(entry=>[entry.id,entry.title,entry.description,entry.color])]);
    if(nextSignature===signature)return;
    const previousTopic=panel.dataset.steadyCurrentTopic;signature=nextSignature;
    if(previousTopic!==String(current.topic))expanded=null;
    panel.dataset.steadyCurrentTopic=host.dataset.steadyCurrentTopic=String(current.topic);panel.dataset.steadyCurrentStage=host.dataset.steadyCurrentStage=String(current.index);
    setText(counter,`${current.index+1} / ${Math.min(5,current.stageCount??5)}`,20);
    stageButtons.forEach((row,index)=>{
      const stage=current.stages?.[index];row.li.hidden=!stage;row.button.classList.toggle('is-current',index===current.index);row.button.classList.toggle('is-complete',index<current.index);
      if(index===current.index)row.button.setAttribute('aria-current','step');else row.button.removeAttribute('aria-current');
      setText(row.title,stage?.title??'',36);row.button.setAttribute('aria-label',`第 ${index+1} 步：${text(stage?.title,48)}`);
    });
    prev.disabled=current.index<=0;next.disabled=current.index>=4;
    prev.setAttribute('aria-label',prev.disabled?'已到第一步':`上一步：${text(current.stages?.[current.index-1]?.title,48)}`);
    next.setAttribute('aria-label',next.disabled?'已到最后一步':`下一步：${text(current.stages?.[current.index+1]?.title,48)}`);
    [current.input,current.action,current.result].forEach((value,index)=>setText(stripCells[index].content,value,110));
    strip.setAttribute('aria-label',`${text(current.title,45)}：输入、当前变化与去向`);
    entries.forEach((entry,index)=>{
      const row=rows[index];row.entry=entry;row.id=String(entry.id??`steady-label-${index}`);row.button.dataset.steadyLabel=row.id;
      setText(row.title,entry.title,36);setText(row.description,entry.description,150);
      row.button.style.setProperty('--steady-label-color',tint(entry.color));row.button.setAttribute('aria-expanded',String(row.id===expanded));row.affordance.textContent=row.id===expanded?'−':'＋';
      row.line.setAttribute('stroke',tint(entry.color));row.dot.setAttribute('fill',tint(entry.color));
    });
    rows.slice(entries.length).forEach(row=>{row.entry=null;row.id=null;hideRow(row);});
    modelBounds=sampleBounds();
  }

  const preferredSlots={rer:['top',0],golgi:['top',1],surface:['top',2],'secretory-cargo':['bottom',1],mitochondrion:['top',0],motor:['bottom',1],microtubule:['bottom',2],'transport-cargo':['top',2],'nucleotide-symbol':['top',1],'surface-receptor':['top',0],'sorting-endosome':['top',1],'degradative-compartment':['top',2],'selected-branch-carrier':['bottom',1]};
  function reserveProjection(width,height){
    if(!modelBounds)return null;
    let minX=Infinity,minY=Infinity,maxX=-Infinity,maxY=-Infinity;
    for(let index=0;index<8;index++){
      const corner=boxCorners[index].set(index&1?modelBounds.max.x:modelBounds.min.x,index&2?modelBounds.max.y:modelBounds.min.y,index&4?modelBounds.max.z:modelBounds.min.z);
      if(model.group)corner.applyMatrix4(model.group.matrixWorld);corner.project(camera);
      if(corner.z< -1||corner.z>1)continue;
      const x=(corner.x*.5+.5)*width,y=(-corner.y*.5+.5)*height;minX=Math.min(minX,x);maxX=Math.max(maxX,x);minY=Math.min(minY,y);maxY=Math.max(maxY,y);
    }
    return finite(minX)&&finite(maxX)?rect(minX,minY,maxX-minX,maxY-minY):null;
  }

  function update(){
    if(disposed||!active)return;updates++;
    // The host clock controls molecular subactions too. Update only changed
    // text; motion changes must not trigger a full label/bounds rebuild.
    const now=model.getTeachingState(),motion=now.motion;
    motionTitle.hidden=!motion?.title;
    setText(motionTitle,motion?.title??'',55);
    setText(stripCells[1].content,motion?.description??now.action,110);
    const size=measure()??{},width=Number(size.width),height=Number(size.height);
    if(!finite(width)||!finite(height)||width<240||height<320){host.hidden=true;rows.forEach(hideRow);last={active,stage:current?.index??null,topic:current?.topic??null,labels:[],overlaps:[],modelOverlaps:[],unavailableViewport:true};return;}
    projectedFrames++;host.hidden=false;host.style.width=`${width}px`;host.style.height=`${height}px`;host.classList.toggle('is-compact',width<850);
    svg.setAttribute('viewBox',`0 0 ${width} ${height}`);
    camera.updateMatrixWorld();model.group?.updateWorldMatrix(true,false);
    const containerBounds=container.getBoundingClientRect(),masthead=doc.querySelector('.masthead')?.getBoundingClientRect();
    const topSafe=Math.max(102,(masthead?.bottom??88)-containerBounds.top+15),margin=width<760?17:28;
    const stripHeight=strip.offsetHeight||96,stripBottom=height<700?85:91,stripTop=height-stripBottom-stripHeight;
    strip.style.bottom=`${stripBottom}px`;
    const reserve=reserveProjection(width,height),occupied=[],visible=[],hidden=[],labelRows=[];
    const values=new Map((model.getLabelState()??[]).map(entry=>[String(entry.id),entry]));
    const labelWidth=Math.min(width<760?164:186,Math.max(124,(width-2*margin-28)/3));
    for(let index=0;index<rows.length;index++){
      const row=rows[index],entry=row.id&&values.get(row.id);hideRow(row);
      if(!row.entry||!entry||entry.visible===false){if(row.id)hidden.push({id:row.id,reason:'not-active-in-stage'});continue;}
      const p=entry.position;if(!p||![p.x,p.y,p.z].every(finite)){hidden.push({id:row.id,reason:'invalid-anchor'});continue;}
      point.copy(p);if(model.group)point.applyMatrix4(model.group.matrixWorld);projected.copy(point).project(camera);viewPoint.copy(point).applyMatrix4(camera.matrixWorldInverse);
      if(viewPoint.z>=0||projected.z< -1||projected.z>1||Math.abs(projected.x)>1||Math.abs(projected.y)>1){hidden.push({id:row.id,reason:'outside-camera'});continue;}
      const anchor={x:(projected.x*.5+.5)*width,y:(-projected.y*.5+.5)*height};
      row.button.hidden=false;row.button.style.width=`${labelWidth}px`;
      const w=row.button.offsetWidth||labelWidth,h=row.button.offsetHeight||(row.id===expanded?104:52),maxY=stripTop-h-12;
      const preferred=row.id==='nucleotide-symbol'&&current?.topic===1&&current?.index>0?['bottom',0]:preferredSlots[row.id]??[index<3?'top':'bottom',index%3],candidates=[];
      const add=(left,top,lane,column,extra=0)=>{
        const x=clamp(left,margin,width-margin-w),y=clamp(top,topSafe,Math.max(topSafe,maxY)),r=rect(x,y,w,h);
        if(r.bottom>stripTop-10||r.top<topSafe||r.left<margin||r.right>width-margin)return;
        if(reserve&&overlaps(r,reserve,10)||occupied.some(item=>overlaps(r,item.rect,10)))return;
        const ex=clamp(anchor.x,r.left,r.right),ey=clamp(anchor.y,r.top,r.bottom),preference=(lane===preferred[0]?0:90)+Math.abs(column-preferred[1])*35;
        candidates.push({rect:r,lane,score:preference+extra+Math.hypot(anchor.x-ex,anchor.y-ey)*.08});
      };
      const xAt=column=>margin+(width-2*margin-w)*column/2;
      const topY=Math.max(topSafe,Math.min(174,(reserve?.top??240)-h-24)),bottomY=maxY;
      for(let column=0;column<3;column++){
        add(xAt(column),topY,'top',column);add(xAt(column),bottomY,'bottom',column);
        add(xAt(column),topSafe,'top',column,75);
        add(xAt(column),topY+h+12,'top',column,95);
      }
      // Narrow or rotated views can use the outer sides, but never put a
      // floating explanation directly over the projected biological envelope.
      for(let n=0;n<4;n++){
        const y=topSafe+(Math.max(topSafe,maxY)-topSafe)*n/3;
        add(margin,y,'left',0,150);add(width-margin-w,y,'right',2,150);
      }
      candidates.sort((a,b)=>a.score-b.score);
      const chosen=candidates[0];
      if(!chosen){hideRow(row);hidden.push({id:row.id,reason:'no-free-perimeter-space'});continue;}
      const r=chosen.rect;row.button.style.left=`${r.x.toFixed(1)}px`;row.button.style.top=`${r.y.toFixed(1)}px`;
      const edge={x:clamp(anchor.x,r.left+8,r.right-8),y:clamp(anchor.y,r.top+7,r.bottom-7)};
      if(anchor.y<r.top)edge.y=r.top;else if(anchor.y>r.bottom)edge.y=r.bottom;else edge.x=anchor.x<r.left?r.left:r.right;
      const knee={x:edge.x+(anchor.x-edge.x)*.35,y:edge.y};
      row.line.setAttribute('d',`M${anchor.x.toFixed(1)} ${anchor.y.toFixed(1)} L${knee.x.toFixed(1)} ${knee.y.toFixed(1)} L${edge.x.toFixed(1)} ${edge.y.toFixed(1)}`);
      row.dot.setAttribute('cx',anchor.x.toFixed(1));row.dot.setAttribute('cy',anchor.y.toFixed(1));row.line.style.display=row.dot.style.display='';
      occupied.push({id:row.id,rect:r});visible.push(row.id);labelRows.push({id:row.id,visible:true,expanded:row.id===expanded,rect:{x:r.x,y:r.y,width:r.width,height:r.height},anchor,lane:chosen.lane});
    }
    for(const item of hidden)labelRows.push({id:item.id,visible:false,rect:null,reason:item.reason});
    const collisions=[];for(let i=0;i<occupied.length;i++)for(let j=i+1;j<occupied.length;j++)if(overlaps(occupied[i].rect,occupied[j].rect))collisions.push([occupied[i].id,occupied[j].id]);
    const modelOverlaps=reserve?occupied.filter(item=>overlaps(item.rect,reserve)).map(item=>item.id):[];
    last={active:true,stage:current?.index??null,topic:current?.topic??null,motion:motion??null,updates,projectedFrames,labels:labelRows,visibleLabels:visible,hiddenLabels:hidden,overlaps:collisions,modelOverlaps,dimensions:{width,height},modelReserve:reserve,strip:{x:margin,y:stripTop,width:width-2*margin,height:stripHeight},actualModelAnchors:true,hostOwnsTime:true};
  }

  function dispose(){
    if(disposed)return;disposed=true;active=false;body.classList.remove('steady-lesson-active');
    panel.removeEventListener('click',panelClick);host.removeEventListener('click',labelClick);host.removeEventListener('keydown',escape);
    for(const node of[panel,host]){node.removeEventListener('pointerdown',stop);node.removeEventListener('wheel',stop);node.removeEventListener('keydown',preserveNativeKey);}
    panel.remove();host.remove();last={active:false,disposed:true,stage:null,topic:null,labels:[],overlaps:[],modelOverlaps:[]};
  }
  return{sync,update,dispose,diagnostics:()=>JSON.parse(JSON.stringify(last))};
}
