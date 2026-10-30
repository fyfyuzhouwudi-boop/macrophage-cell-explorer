/**
 * Project short teaching annotations onto the actual scene, beside a measured
 * explanation card. This layer never changes the camera or the biological model.
 */
export function createClassroomOverlay({THREE,container,camera,measure,getLesson,onSeekStage,onSeekSubstep}) {
  if (!container || !camera || typeof measure !== 'function' || typeof getLesson !== 'function') {
    throw new TypeError('Classroom overlay requires a container, camera, measure and getLesson.');
  }
  const doc=container.ownerDocument,svgNS='http://www.w3.org/2000/svg';
  const make=(tag,className,parent)=>{const el=doc.createElement(tag);if(className)el.className=className;parent?.append(el);return el;};
  const host=make('div','classroom-overlay',container);
  Object.assign(host.style,{position:'absolute',left:'0',top:'0',pointerEvents:'none'});
  host.hidden=true;
  host.setAttribute('aria-label','本轮课堂讲解');
  const leaders=doc.createElementNS(svgNS,'svg');
  leaders.setAttribute('class','classroom-leaders');leaders.setAttribute('aria-hidden','true');
  Object.assign(leaders.style,{position:'absolute',inset:'0',width:'100%',height:'100%',overflow:'hidden',pointerEvents:'none'});
  host.append(leaders);
  const card=make('section','classroom-card',host);
  Object.assign(card.style,{position:'absolute',pointerEvents:'auto',boxSizing:'border-box'});
  const eyebrow=make('div','classroom-eyebrow',card),title=make('h2','',card);
  const subtitle=make('p','classroom-subtitle',card),location=make('p','classroom-location',card);
  const instruction=make('p','classroom-instruction',card),boundary=make('p','classroom-boundary',card);
  const navigation=make('div','classroom-navigation',card),prev=make('button','',navigation);
  prev.type='button';prev.dataset.classroomPrev='';prev.textContent='上一阶段';
  const counter=make('span','classroom-counter',navigation),next=make('button','',navigation);
  next.type='button';next.dataset.classroomNext='';next.textContent='下一阶段';
  counter.setAttribute('aria-live','polite');counter.setAttribute('aria-atomic','true');
  const stopPropagation=event=>event.stopPropagation();
  card.addEventListener('pointerdown',stopPropagation);
  card.addEventListener('wheel',stopPropagation,{passive:true});
  const nativeButtonKey=event=>{if(event.code==='Space')event.stopPropagation();};
  card.addEventListener('keydown',nativeButtonKey);
  const rows=Array.from({length:5},()=>{
    const el=make('div','classroom-label',host),strong=make('strong','',el),small=make('small','',el);
    Object.assign(el.style,{position:'absolute',boxSizing:'border-box',transform:'none',pointerEvents:'none'});
    el.setAttribute('role','note');el.hidden=true;
    const line=doc.createElementNS(svgNS,'path'),dot=doc.createElementNS(svgNS,'circle');
    line.setAttribute('fill','none');line.setAttribute('stroke-width','1.2');
    line.setAttribute('stroke-linecap','round');line.setAttribute('stroke-linejoin','round');
    dot.setAttribute('r','3.1');leaders.append(line,dot);
    return {el,strong,small,line,dot,size:{dirty:true}};
  });
  const projected=new THREE.Vector3(),cameraSpace=new THREE.Vector3();
  const clamp=(n,a,b)=>Math.min(Math.max(n,a),Math.max(a,b));
  const finite=n=>typeof n==='number'&&Number.isFinite(n);
  const text=(value,max=100)=>{const chars=Array.from(String(value??'').replace(/\s+/g,' ').trim());return chars.length>max?chars.slice(0,max-1).join('')+'…':chars.join('');};
  const setText=(el,value,max)=>{const nextText=text(value,max);if(el.textContent!==nextText)el.textContent=nextText;if(el.hidden!==!nextText)el.hidden=!nextText;};
  const attribute=(el,key,value)=>{const next=String(value);if(el.getAttribute(key)!==next)el.setAttribute(key,next);};
  const rect=(left,top,width,height)=>({left,top,right:left+width,bottom:top+height,width,height});
  const intersects=(a,b,gap=0)=>a.left<b.right+gap&&a.right>b.left-gap&&a.top<b.bottom+gap&&a.bottom>b.top-gap;
  const inside=(r,width,height)=>r.left>=0&&r.top>=0&&r.right<=width+.5&&r.bottom<=height+.5;
  const color=value=>{
    if(typeof value==='string'&&/^#[\da-f]{3,8}$/i.test(value))return value;
    if(typeof value==='number'||value?.isColor){try{return new THREE.Color(value).getStyle();}catch{return '#517b87';}}
    return '#517b87';
  };
  const hideRow=(row,reason='inactive')=>{if(!row.el.hidden)row.el.hidden=true;if(row.line.style.display!=='none')row.line.style.display='none';if(row.dot.style.display!=='none')row.dot.style.display='none';if(reason!=='no-space')row.size.dirty=true;};
  let current=null,stageSignature='',disposed=false,updates=0,layoutMeasurements=0,layoutCacheHits=0,layoutEpoch=0,layoutRefresh=null;
  const cardSize={dirty:true},view=doc.defaultView;
  const style=(el,key,value)=>{if(el.style[key]!==value)el.style[key]=value;};
  const invalidateLayout=()=>{if(disposed)return;layoutEpoch++;cardSize.dirty=true;rows.forEach(row=>row.size.dirty=true);};
  // A paused WebGL scene need not render again just because a font loaded.
  // Refresh only this DOM layout once; this does not advance the host clock.
  const requestLayoutRefresh=()=>{if(disposed||host.hidden||layoutRefresh!==null||typeof view?.requestAnimationFrame!=='function')return;layoutRefresh=view.requestAnimationFrame(()=>{layoutRefresh=null;if(!disposed&&!host.hidden)update();});};
  const fontChanged=()=>{invalidateLayout();requestLayoutRefresh();};
  const cacheKey=(width,height)=>[width,height,view?.innerWidth,view?.innerHeight,view?.devicePixelRatio,layoutEpoch].join(':');
  function measuredBox(el,cache,key,fallbackWidth,fallbackHeight){
    if(cache.dirty||cache.key!==key){
      if(el.hidden)el.hidden=false;
      const width=el.offsetWidth,height=el.offsetHeight;layoutMeasurements+=2;
      Object.assign(cache,{width:width||fallbackWidth,height:height||fallbackHeight,key,dirty:false});
    }else layoutCacheHits++;
    return cache;
  }
  const observed=new Map([[card,cardSize],...rows.map(row=>[row.el,row.size])]);
  const ResizeObserverClass=view?.ResizeObserver;
  const resizeObserver=typeof ResizeObserverClass==='function'?new ResizeObserverClass(entries=>{
    for(const entry of entries){
      const cache=observed.get(entry.target);if(!cache)continue;
      const box=entry.borderBoxSize?.[0]??entry.borderBoxSize;
      if(box&&box.inlineSize>0&&box.blockSize>0){
        if(cache.width!==Math.round(box.inlineSize)||cache.height!==Math.round(box.blockSize))cache.dirty=true;
      }else if(!entry.target.hidden)cache.dirty=true;
      if(cache.dirty)requestLayoutRefresh();
    }
  }):null;
  observed.forEach((_,el)=>resizeObserver?.observe(el));
  doc.fonts?.addEventListener?.('loadingdone',fontChanged);doc.fonts?.addEventListener?.('loadingerror',fontChanged);
  doc.fonts?.ready?.then(fontChanged);
  let last={active:false,labels:[],hiddenLabels:[],collisions:[],allVisibleLabelsOnCanvas:true};
  function seek(delta){
    if(!current)return;
    if(current.key==='response'&&current.substeps?.length&&typeof onSeekSubstep==='function'){
      const index=clamp(current.substepIndex+delta,0,current.substeps.length-1);if(index!==current.substepIndex)onSeekSubstep(index);return;
    }
    const total=Math.max(1,Number(current.total)||current.stages?.length||1);
    const index=clamp(Math.trunc(Number(current.index)||0)+delta,0,total-1);
    if(index!==current.index&&typeof onSeekStage==='function')onSeekStage(index);
  }
  const previousClick=()=>seek(-1),nextClick=()=>seek(1);
  prev.addEventListener('click',previousClick);next.addEventListener('click',nextClick);

  function update(){
    if(disposed)return;
    updates++;
    const lesson=getLesson(),size=measure()??{};
    const width=Number(size.width),height=Number(size.height);
    if(!lesson||!finite(width)||!finite(height)||width<1||height<1){
      current=null;host.hidden=true;rows.forEach(hideRow);
      last={active:false,updates,layoutMeasurements,layoutCacheHits,labels:[],hiddenLabels:[],collisions:[],allVisibleLabelsOnCanvas:true};
      return;
    }
    current=lesson;if(host.hidden){host.hidden=false;invalidateLayout();}
    style(host,'width',`${width}px`);style(host,'height',`${height}px`);
    attribute(leaders,'viewBox',`0 0 ${width} ${height}`);
    const detailed=lesson.key==='response'&&lesson.substeps?.length;
    const total=detailed?lesson.substeps.length:Math.max(1,Math.trunc(Number(lesson.total)||lesson.stages?.length||1));
    const index=clamp(Math.trunc(Number(detailed?lesson.substepIndex:lesson.index)||0),0,total-1);
    const stages=detailed?lesson.substeps:lesson.stages;
    const signature=[lesson.key,index,total,lesson.title,lesson.subtitle,lesson.location,lesson.instruction,lesson.boundaryNote].join('|');
    if(signature!==stageSignature){
      stageSignature=signature;host.dataset.classroomLesson=String(lesson.key??'');host.dataset.classroomStage=String(index);
      setText(eyebrow,`${lesson.key==='response'?'细胞响应':'膜上微观过程'} · ${index+1} / ${total}`,50);
      setText(title,lesson.title,38);setText(subtitle,lesson.subtitle,70);
      setText(location,lesson.location?`发生位置 · ${lesson.location}`:'',62);
      setText(instruction,lesson.instruction,115);setText(boundary,lesson.boundaryNote,110);
      counter.textContent=`${index+1} / ${total}`;
      prev.disabled=index===0;next.disabled=index===total-1;
      prev.setAttribute('aria-label',index>0?`上一环节：${text(stages?.[index-1]?.title??'',45)}`:'已到第一环节');
      next.setAttribute('aria-label',index<total-1?`下一环节：${text(stages?.[index+1]?.title??'',45)}`:'已到最后环节');
      prev.textContent=detailed?'上一环节':'上一阶段';next.textContent=detailed?'下一环节':'下一阶段';
    }
    const cardLeft=width<640?16:30,cardTop=height<580?92:115;
    const cardWidth=Math.min(width<760?240:280,Math.max(180,width-32));
    const maxCardHeight=Math.max(130,height-cardTop-120),layoutKey=cacheKey(width,height);
    for(const [key,value]of Object.entries({left:`${cardLeft}px`,top:`${cardTop}px`,width:`${cardWidth}px`,maxHeight:`${maxCardHeight}px`,overflow:'auto'}))style(card,key,value);
    const cardBox=measuredBox(card,cardSize,[layoutKey,stageSignature,cardWidth,maxCardHeight].join('|'),cardWidth,260);
    const cardRect=rect(cardLeft,cardTop,cardBox.width,cardBox.height);
    const safe=rect(16,Math.min(112,Math.max(16,height*.17)),Math.max(1,width-32),Math.max(1,height-116-Math.min(112,Math.max(16,height*.17))));
    const entry=lesson.key==='entry';
    // Text must not sit on the protein/neck/pore merely because a leader is
    // short. Reserve the biology's central presentation area; entry labels
    // use fixed perimeter lanes, while response labels strongly prefer them.
    const modelLeft=Math.max(cardRect.right+40,350),modelTop=entry?300:270;
    const modelBottom=height-(entry?250:150);
    const modelReserve=rect(modelLeft,modelTop,Math.max(0,width-80-modelLeft),Math.max(0,modelBottom-modelTop));
    const occupied=[{id:'card',rect:cardRect}],visible=[],hidden=[];
    const inputs=Array.isArray(lesson.labels)?lesson.labels.slice(0,5):[];
    camera.updateMatrixWorld();
    for(let i=0;i<rows.length;i++){
      const row=rows[i],label=inputs[i];
      if(!label){hideRow(row,'no-label');continue;}
      const id=String(label.id??`label-${i+1}`),p=label.position;
      if(!p||![p.x,p.y,p.z].every(finite)){hideRow(row,'invalid-anchor');hidden.push({id,reason:'invalid-anchor'});continue;}
      projected.copy(p).project(camera);cameraSpace.copy(p).applyMatrix4(camera.matrixWorldInverse);
      if(cameraSpace.z>=0||projected.z< -1||projected.z>1||Math.abs(projected.x)>1||Math.abs(projected.y)>1){
        hideRow(row,'outside-camera');hidden.push({id,reason:'outside-camera'});continue;
      }
      const anchor={x:(projected.x*.5+.5)*width,y:(-.5*projected.y+.5)*height,z:projected.z};
      const tint=color(label.color);
      setText(row.strong,label.title,30);setText(row.small,label.action,28);
      if(row.el.dataset.classroomLabel!==id)row.el.dataset.classroomLabel=id;
      if(row.tint!==tint){row.tint=tint;row.el.style.setProperty('--label-color',tint);row.line.setAttribute('stroke',tint);row.dot.setAttribute('fill',tint);}
      const preferredWidth=width<760?155:180;
      const labelWidth=Math.min(preferredWidth,Math.max(115,width-cardRect.right-38));
      style(row.el,'width',`${labelWidth}px`);
      const box=measuredBox(row.el,row.size,[layoutKey,id,row.strong.textContent,row.small.textContent,labelWidth].join('|'),preferredWidth,58);
      const w=box.width,h=box.height;
      const minLeft=safe.left,maxLeft=Math.max(minLeft,safe.right-w),minTop=safe.top,maxTop=Math.max(minTop,safe.bottom-h);
      const candidates=[];
      const add=(left,top,preference,zone='near-anchor')=>{
        const x=clamp(left,minLeft,maxLeft),y=clamp(top,minTop,maxTop),r=rect(x,y,w,h);
        if(!inside(r,width,height)||occupied.some(item=>intersects(r,item.rect,10)))return;
        const onModel=modelReserve.width>0&&modelReserve.height>0&&intersects(r,modelReserve,12);
        if(entry&&onModel)return;
        const ex=clamp(anchor.x,r.left,r.right),ey=clamp(anchor.y,r.top,r.bottom);
        const modelSidePenalty=r.left<cardRect.right+18?80:0;
        candidates.push({rect:r,zone,score:Math.hypot(anchor.x-ex,anchor.y-ey)*(entry?.08:1)+preference+modelSidePenalty+(onModel?2000:0)});
      };
      const gridLeft=Math.max(safe.left,cardRect.right+20),gridRight=Math.max(gridLeft,maxLeft);
      const columns=Math.max(1,Math.floor((safe.right-gridLeft+10)/(w+12)));
      const slotX=(column,count)=>count===1?(gridLeft+gridRight)*.5:gridLeft+(gridRight-gridLeft)*column/(count-1);
      const topY=Math.max(safe.top+14,126),topLimit=Math.min(275,modelTop-18);
      const bottomY=Math.max(modelBottom+18,height-224);
      const topColumns=Math.min(3,columns),bottomColumns=Math.min(2,columns);
      // Membrane origins get opposite margins; HA and its contact/peptide stay
      // above, and the connectivity tracer stays below. This is stable across
      // stage changes, not an anchor-distance race between several labels.
      const entrySlot=({'viral-envelope':['top',0],'endosome-membrane':['bottom',0],'ha-protein':['top',2],'fusion-peptide':['top',1],'fusion-contact':['top',1],'aqueous-tracer':['bottom',1]})[id]??[['top',0],['bottom',0],['top',2],['top',1],['bottom',1]][i];
      for(let c=0;c<topColumns;c++){
        const preferred=entry&&entrySlot[0]==='top'&&c===Math.min(entrySlot[1],topColumns-1);
        add(slotX(c,topColumns),topY,entry?(preferred?0:400+c*10):20+c*.1,'top');
      }
      for(let c=0;c<bottomColumns;c++){
        const preferred=entry&&entrySlot[0]==='bottom'&&c===Math.min(entrySlot[1],bottomColumns-1);
        add(slotX(c,bottomColumns),bottomY,entry?(preferred?0:450+c*10):35+c*.1,'bottom');
      }
      // A second top row is a fallback for narrow canvases or unusually tall
      // labels. Its bottom edge still stops above the reserved model area.
      if(topY+h*2+12<=topLimit)for(let c=0;c<topColumns;c++)add(slotX(c,topColumns),topY+h+12,entry?700+c*10:55+c*.1,'top-second-row');
      if(!entry){
        const offsets=[[38,-h-28],[-w-38,-h-28],[42,30],[-w-42,30],[-w*.5,-h-65],[-w*.5,65],[80,-h*.5],[-w-80,-h*.5]];
        offsets.forEach(([dx,dy],n)=>add(anchor.x+dx,anchor.y+dy,60+n*3));
        const rowCount=Math.max(1,Math.floor((safe.bottom-safe.top+10)/(h+12)));
        for(let r=0;r<rowCount;r++)for(let c=0;c<columns;c++)add(slotX(c,columns),rowCount===1?minTop:minTop+(maxTop-minTop)*r/(rowCount-1),90+r*.1+c*.1,'perimeter-grid');
      }
      // The quiet column below the card is a last resort, never the pore area.
      for(let y=cardRect.bottom+18;y<=maxTop;y+=h+14)add(safe.left,y,entry?1200:180,'below-card');
      candidates.sort((a,b)=>a.score-b.score);
      const chosen=candidates[0];
      if(!chosen){hideRow(row,'no-space');hidden.push({id,reason:'no-collision-free-space'});continue;}
      const r=chosen.rect;
      if(row.el.hidden)row.el.hidden=false;
      style(row.el,'left',`${r.left.toFixed(2)}px`);style(row.el,'top',`${r.top.toFixed(2)}px`);
      const edge={x:clamp(anchor.x,r.left+8,r.right-8),y:clamp(anchor.y,r.top+8,r.bottom-8)};
      if(anchor.x<r.left)edge.x=r.left;else if(anchor.x>r.right)edge.x=r.right;
      else if(anchor.y<r.top)edge.y=r.top;else edge.y=r.bottom;
      const knee={x:edge.x+(anchor.x-edge.x)*.42,y:edge.y};
      attribute(row.line,'d',`M ${anchor.x.toFixed(2)} ${anchor.y.toFixed(2)} L ${knee.x.toFixed(2)} ${knee.y.toFixed(2)} L ${edge.x.toFixed(2)} ${edge.y.toFixed(2)}`);
      style(row.line,'display','');
      attribute(row.dot,'cx',anchor.x.toFixed(2));attribute(row.dot,'cy',anchor.y.toFixed(2));style(row.dot,'display','');
      occupied.push({id,rect:r});visible.push({id,title:row.strong.textContent,action:row.small.textContent,color:tint,anchor,rect:r,zone:chosen.zone,visible:true});
    }
    const collisions=[];
    for(let i=0;i<occupied.length;i++)for(let j=i+1;j<occupied.length;j++)if(intersects(occupied[i].rect,occupied[j].rect))collisions.push({first:occupied[i].id,second:occupied[j].id});
    const labelModelOverlaps=visible.filter(item=>modelReserve.width>0&&modelReserve.height>0&&intersects(item.rect,modelReserve)).map(item=>item.id);
    last={active:true,updates,layoutMeasurements,layoutCacheHits,key:lesson.key,index,total,title:title.textContent,dimensions:{width,height},card:cardRect,safeRect:safe,modelReserve,labels:visible,hiddenLabels:hidden,omittedAboveLimit:Math.max(0,(lesson.labels?.length||0)-5),collisions,labelModelOverlaps,allVisibleLabelsOnCanvas:visible.every(item=>inside(item.rect,width,height)),cardInsideCanvas:inside(cardRect,width,height)};
  }
  function diagnostics(){return JSON.parse(JSON.stringify(last));}
  function dispose(){
    if(disposed)return;
    disposed=true;current=null;
    prev.removeEventListener('click',previousClick);next.removeEventListener('click',nextClick);
    card.removeEventListener('pointerdown',stopPropagation);card.removeEventListener('wheel',stopPropagation);card.removeEventListener('keydown',nativeButtonKey);
    resizeObserver?.disconnect();if(layoutRefresh!==null)view?.cancelAnimationFrame?.(layoutRefresh);doc.fonts?.removeEventListener?.('loadingdone',fontChanged);doc.fonts?.removeEventListener?.('loadingerror',fontChanged);
    host.remove();last={active:false,disposed:true,labels:[],hiddenLabels:[],collisions:[],allVisibleLabelsOnCanvas:true};
  }
  return {update,diagnostics,dispose};
}
