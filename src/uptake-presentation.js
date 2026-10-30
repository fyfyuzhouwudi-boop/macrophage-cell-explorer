import * as THREE from 'three';

// Presentation reads the local model and the host clock. It never invents an
// extra transport route or advances the mechanism independently.
export function createUptakePresentation({container,camera,measure,getTeaching,getLabels}) {
  const doc=container.ownerDocument,NS='http://www.w3.org/2000/svg';
  const make=(tag,css,parent)=>{const e=doc.createElement(tag);if(css)e.className=css;parent?.append(e);return e;};
  const host=make('div','uptake-presentation',container);host.hidden=true;host.setAttribute('aria-label','摄取过程图上讲解');
  const svg=doc.createElementNS(NS,'svg');svg.classList.add('uptake-leaders');svg.setAttribute('aria-hidden','true');host.append(svg);
  const rows=Array.from({length:6},()=>{
    const button=make('button','uptake-label',host);button.type='button';button.hidden=true;button.setAttribute('aria-expanded','false');
    const title=make('strong','',button),description=make('span','uptake-label-description',button),plus=make('span','uptake-label-plus',button);plus.textContent='＋';plus.setAttribute('aria-hidden','true');
    const line=doc.createElementNS(NS,'path'),dot=doc.createElementNS(NS,'circle');dot.setAttribute('r','2.8');line.setAttribute('fill','none');svg.append(line,dot);
    return{button,title,description,plus,line,dot,id:null,size:{dirty:true}};
  });
  const strip=make('section','uptake-causal-strip',host);strip.setAttribute('aria-label','本步输入、变化与结果');
  const cells=['看谁','正在发生','结果 / 下一步'].map(text=>{const cell=make('div','uptake-causal-cell',strip),caption=make('span','uptake-causal-caption',cell),p=make('p','',cell);caption.textContent=text;return{cell,p};});
  const motionTitle=make('strong','uptake-motion-title');cells[1].p.before(motionTitle);
  const chapter=make('div','uptake-chapter',host);chapter.setAttribute('aria-label','摄取的三个连续环节');
  const chapterNames=['吞噬','成熟','降解'],chapterNodes=chapterNames.map((text,i)=>{const s=make('span','',chapter);s.textContent=String(i+1).padStart(2,'0')+'  '+text;return s;});
  let active=false,annotationsVisible=true,expanded=null,last={active:false,labels:[]},signature='',disposed=false,updates=0,layoutMeasurements=0,layoutCacheHits=0,layoutEpoch=0,layoutRefresh=null;
  const stripSize={dirty:true},view=doc.defaultView;
  const style=(el,key,value)=>{if(el.style[key]!==value)el.style[key]=value;};
  const invalidateLayout=()=>{if(disposed)return;layoutEpoch++;stripSize.dirty=true;rows.forEach(row=>row.size.dirty=true);};
  const requestLayoutRefresh=()=>{if(disposed||host.hidden||layoutRefresh!==null||typeof view?.requestAnimationFrame!=='function')return;layoutRefresh=view.requestAnimationFrame(()=>{layoutRefresh=null;if(!disposed&&!host.hidden)update();});};
  const fontChanged=()=>{invalidateLayout();requestLayoutRefresh();};
  const cacheKey=(width,height)=>[width,height,view?.innerWidth,view?.innerHeight,view?.devicePixelRatio,layoutEpoch].join(':');
  function measuredBox(el,cache,key,fallbackWidth,fallbackHeight,heightOnly=false){
    if(cache.dirty||cache.key!==key){
      if(el.hidden)el.hidden=false;
      const width=heightOnly?Math.round(fallbackWidth):el.offsetWidth,height=el.offsetHeight;layoutMeasurements+=heightOnly?1:2;
      Object.assign(cache,{width:width||fallbackWidth,height:height||fallbackHeight,key,dirty:false});
    }else layoutCacheHits++;
    return cache;
  }
  const observed=new Map([[strip,stripSize],...rows.map(row=>[row.button,row.size])]);
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
  const projected=new THREE.Vector3(),viewPoint=new THREE.Vector3();
  const clamp=(n,a,b)=>Math.max(a,Math.min(b,n));
  const setText=(e,t)=>{t=String(t??'');if(e.textContent!==t)e.textContent=t;};
  const attribute=(el,key,value)=>{const next=String(value);if(el.getAttribute(key)!==next)el.setAttribute(key,next);};
  const overlap=(a,b,gap=0)=>a.x<b.x+b.width+gap&&a.x+a.width>b.x-gap&&a.y<b.y+b.height+gap&&a.y+a.height>b.y-gap;
  const hide=(r,reason='inactive')=>{if(!r.button.hidden)r.button.hidden=true;if(r.line.style.display!=='none')r.line.style.display='none';if(r.dot.style.display!=='none')r.dot.style.display='none';if(reason!=='no-space')r.size.dirty=true;};
  const stop=e=>e.stopPropagation();host.addEventListener('pointerdown',stop);host.addEventListener('wheel',stop,{passive:true});
  const key=e=>{if(e.key==='Escape'){expanded=null;update();}if(e.code==='Space'||e.key.startsWith('Arrow'))e.stopPropagation();};host.addEventListener('keydown',key);
  const click=e=>{const b=e.target.closest?.('[data-uptake-label]');if(!b||!host.contains(b))return;expanded=expanded===b.dataset.uptakeLabel?null:b.dataset.uptakeLabel;update();};host.addEventListener('click',click);
  function sync(show,{annotations=true}={}){const visible=!!show&&!!annotations,wasActive=active;if(visible!==!host.hidden)invalidateLayout();active=!!show;annotationsVisible=!!annotations;if(host.hidden!==!visible)host.hidden=!visible;if(wasActive!==active)doc.body.classList.toggle('uptake-lesson-active',active);if(!visible){rows.forEach(hide);last={active,annotationsVisible,updates,layoutMeasurements,layoutCacheHits,labels:[]};}}
  function update(){
    if(disposed||!active||!annotationsVisible)return;updates++;const teaching=getTeaching();
    const {width,height}=measure()??{};
    if(!teaching||!Number.isFinite(width)||!Number.isFinite(height)||width<1||height<1){host.hidden=true;rows.forEach(hide);last={active:false,updates,layoutMeasurements,layoutCacheHits,labels:[]};return;}
    if(host.hidden){host.hidden=false;invalidateLayout();}
    const compact=width<850,layoutKey=cacheKey(width,height);
    style(host,'width',width+'px');style(host,'height',height+'px');host.classList.toggle('is-compact',compact);attribute(svg,'viewBox',`0 0 ${width} ${height}`);
    const nextSignature=teaching.caseId+':'+teaching.index;if(nextSignature!==signature){signature=nextSignature;expanded=null;}
    const chapterIndex=teaching.chapterIndex??(teaching.index<3?0:teaching.index===3?1:2);
    const hideChapter=teaching.caseId==='mannose-receptor-endocytosis';if(chapter.hidden!==hideChapter)chapter.hidden=hideChapter;chapterNodes.forEach((n,i)=>{n.classList.toggle('is-current',i===chapterIndex);if(i===chapterIndex)attribute(n,'aria-current','step');else if(n.getAttribute('aria-current')!==null)n.removeAttribute('aria-current');});
    setText(cells[0].p,teaching.input);setText(cells[1].p,teaching.motion?.description??teaching.action);setText(cells[2].p,teaching.result);setText(motionTitle,teaching.motion?.title??teaching.title);
    const margin=compact?18:28,labelWidth=compact?154:182,top=126,stripBottom=height<800?84:91;
    style(strip,'bottom',stripBottom+'px');style(chapter,'top','97px');
    const stripBox=measuredBox(strip,stripSize,[layoutKey,compact,cells[0].p.textContent,cells[1].p.textContent,cells[2].p.textContent,motionTitle.textContent].join('|'),width-margin*2,100,true);
    const stripHeight=stripBox.height,stripTop=height-stripBottom-stripHeight;
    camera.updateMatrixWorld();const entries=getLabels().slice(0,6),occupied=[],labels=[],hidden=[];
    for(let i=0;i<rows.length;i++){
      const r=rows[i],entry=entries[i];if(!entry?.position){hide(r,'no-label');continue;}r.id=entry.id;
      if(![entry.position.x,entry.position.y,entry.position.z].every(Number.isFinite)){hide(r,'invalid-anchor');hidden.push({id:entry.id,reason:'invalid-anchor'});continue;}
      projected.copy(entry.position).project(camera);viewPoint.copy(entry.position).applyMatrix4(camera.matrixWorldInverse);
      if(viewPoint.z>=0||projected.z< -1||projected.z>1||Math.abs(projected.x)>1||Math.abs(projected.y)>1){hide(r,'outside-camera');hidden.push({id:entry.id,reason:'outside-camera'});continue;}
      const anchor={x:(projected.x*.5+.5)*width,y:(-projected.y*.5+.5)*height};
      if(r.button.dataset.uptakeLabel!==entry.id)r.button.dataset.uptakeLabel=entry.id;
      attribute(r.button,'aria-expanded',String(expanded===entry.id));
      const tint=entry.color??'#6e939b';if(r.tint!==tint){r.tint=tint;r.button.style.setProperty('--uptake-label-color',tint);r.line.style.stroke=r.dot.style.stroke=tint;r.dot.style.fill='#fff';}
      style(r.button,'width',labelWidth+'px');
      setText(r.title,entry.title);setText(r.description,expanded===entry.id?(entry.description??entry.action):entry.action??entry.description);setText(r.plus,expanded===entry.id?'−':'＋');
      const box=measuredBox(r.button,r.size,[layoutKey,entry.id,expanded===entry.id,r.title.textContent,r.description.textContent,labelWidth].join('|'),labelWidth,58);
      const h=box.height,w=box.width,bottom=stripTop-h-14;
      const preferred=entry.lane??(i<3?'top':'bottom'),candidates=[];
      const add=(x,y,lane,column)=>{x=clamp(x,margin,width-margin-w);y=clamp(y,top,Math.max(top,bottom));const rect={x,y,width:w,height:h};if(occupied.some(p=>overlap(p,rect,10)))return;const dx=clamp(anchor.x,x,x+w),dy=clamp(anchor.y,y,y+h);candidates.push({rect,lane,score:(lane===preferred?0:85)+Math.abs(column-(i%3))*22+Math.hypot(anchor.x-dx,anchor.y-dy)*.10});};
      for(let col=0;col<3;col++){const x=margin+(width-2*margin-w)*col/2;add(x,top,'top',col);add(x,bottom,'bottom',col);}
      candidates.sort((a,b)=>a.score-b.score);const chosen=candidates[0];if(!chosen){hide(r,'no-space');hidden.push({id:entry.id,reason:'no-free-space'});continue;}
      const p=chosen.rect;if(r.button.hidden)r.button.hidden=false;style(r.button,'left',p.x+'px');style(r.button,'top',p.y+'px');
      const edge={x:clamp(anchor.x,p.x+8,p.x+w-8),y:anchor.y<p.y?p.y:anchor.y>p.y+h?p.y+h:clamp(anchor.y,p.y+6,p.y+h-6)};
      if(anchor.y>=p.y&&anchor.y<=p.y+h)edge.x=anchor.x<p.x?p.x:p.x+w;
      attribute(r.line,'d',`M${anchor.x} ${anchor.y} L${edge.x+(anchor.x-edge.x)*.22} ${edge.y} L${edge.x} ${edge.y}`);attribute(r.dot,'cx',anchor.x);attribute(r.dot,'cy',anchor.y);style(r.line,'display','');style(r.dot,'display','');
      occupied.push(p);labels.push({id:entry.id,rect:p,anchor,expanded:expanded===entry.id,lane:chosen.lane});
    }
    const collisions=[];for(let i=0;i<labels.length;i++)for(let j=i+1;j<labels.length;j++)if(overlap(labels[i].rect,labels[j].rect))collisions.push([labels[i].id,labels[j].id]);
    last={active:true,updates,layoutMeasurements,layoutCacheHits,caseId:teaching.caseId,index:teaching.index,chapterIndex,motion:teaching.motion,labels,hidden,collisions,strip:{x:margin,y:stripTop,width:width-margin*2,height:stripHeight},labelsWithinCanvas:labels.every(({rect:r})=>r.x>=0&&r.y>=0&&r.x+r.width<=width&&r.y+r.height<=height),actualModelAnchors:true,hostOwnsTime:true};
  }
  return{sync,update,diagnostics:()=>structuredClone(last),dispose(){disposed=true;resizeObserver?.disconnect();if(layoutRefresh!==null)view?.cancelAnimationFrame?.(layoutRefresh);doc.fonts?.removeEventListener?.('loadingdone',fontChanged);doc.fonts?.removeEventListener?.('loadingerror',fontChanged);host.removeEventListener('pointerdown',stop);host.removeEventListener('wheel',stop);host.removeEventListener('keydown',key);host.removeEventListener('click',click);host.remove();doc.body.classList.remove('uptake-lesson-active');}};
}
