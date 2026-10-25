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
    return{button,title,description,plus,line,dot,id:null};
  });
  const strip=make('section','uptake-causal-strip',host);strip.setAttribute('aria-label','本步输入、变化与结果');
  const cells=['看谁','正在发生','结果 / 下一步'].map(text=>{const cell=make('div','uptake-causal-cell',strip),caption=make('span','uptake-causal-caption',cell),p=make('p','',cell);caption.textContent=text;return{cell,p};});
  const motionTitle=make('strong','uptake-motion-title');cells[1].p.before(motionTitle);
  const chapter=make('div','uptake-chapter',host);chapter.setAttribute('aria-label','摄取的三个连续环节');
  const chapterNames=['吞噬','成熟','降解'],chapterNodes=chapterNames.map((text,i)=>{const s=make('span','',chapter);s.textContent=String(i+1).padStart(2,'0')+'  '+text;return s;});
  let active=false,annotationsVisible=true,expanded=null,last={active:false,labels:[]},signature='';
  const projected=new THREE.Vector3(),viewPoint=new THREE.Vector3();
  const clamp=(n,a,b)=>Math.max(a,Math.min(b,n));
  const setText=(e,t)=>{t=String(t??'');if(e.textContent!==t)e.textContent=t;};
  const overlap=(a,b,gap=0)=>a.x<b.x+b.width+gap&&a.x+a.width>b.x-gap&&a.y<b.y+b.height+gap&&a.y+a.height>b.y-gap;
  const hide=r=>{r.button.hidden=true;r.line.style.display=r.dot.style.display='none';};
  const stop=e=>e.stopPropagation();host.addEventListener('pointerdown',stop);host.addEventListener('wheel',stop,{passive:true});
  const key=e=>{if(e.key==='Escape'){expanded=null;update();}if(e.code==='Space'||e.key.startsWith('Arrow'))e.stopPropagation();};host.addEventListener('keydown',key);
  const click=e=>{const b=e.target.closest?.('[data-uptake-label]');if(!b||!host.contains(b))return;expanded=expanded===b.dataset.uptakeLabel?null:b.dataset.uptakeLabel;update();};host.addEventListener('click',click);
  function sync(show,{annotations=true}={}){active=!!show;annotationsVisible=!!annotations;host.hidden=!active||!annotationsVisible;doc.body.classList.toggle('uptake-lesson-active',active);if(!active||!annotationsVisible){rows.forEach(hide);last={active,annotationsVisible,labels:[]};}}
  function update(){
    if(!active||!annotationsVisible)return;const teaching=getTeaching();if(!teaching)return;
    const {width,height}=measure(),compact=width<850;
    host.style.width=width+'px';host.style.height=height+'px';host.classList.toggle('is-compact',compact);svg.setAttribute('viewBox',`0 0 ${width} ${height}`);
    const nextSignature=teaching.caseId+':'+teaching.index;if(nextSignature!==signature){signature=nextSignature;expanded=null;}
    const chapterIndex=teaching.chapterIndex??(teaching.index<3?0:teaching.index===3?1:2);
    chapter.hidden=teaching.caseId==='mannose-receptor-endocytosis';chapterNodes.forEach((n,i)=>{n.classList.toggle('is-current',i===chapterIndex);if(i===chapterIndex)n.setAttribute('aria-current','step');else n.removeAttribute('aria-current');});
    setText(cells[0].p,teaching.input);setText(cells[1].p,teaching.motion?.description??teaching.action);setText(cells[2].p,teaching.result);setText(motionTitle,teaching.motion?.title??teaching.title);
    const margin=compact?18:28,labelWidth=compact?154:182,top=126,stripHeight=strip.offsetHeight||100,stripBottom=height<800?84:91,stripTop=height-stripBottom-stripHeight;
    strip.style.bottom=stripBottom+'px';chapter.style.top='97px';
    camera.updateMatrixWorld();const entries=getLabels().slice(0,6),occupied=[],labels=[],hidden=[];
    for(let i=0;i<rows.length;i++){
      const r=rows[i],entry=entries[i];hide(r);if(!entry?.position)continue;r.id=entry.id;
      projected.copy(entry.position).project(camera);viewPoint.copy(entry.position).applyMatrix4(camera.matrixWorldInverse);
      if(viewPoint.z>=0||projected.z< -1||projected.z>1||Math.abs(projected.x)>1||Math.abs(projected.y)>1){hidden.push({id:entry.id,reason:'outside-camera'});continue;}
      const anchor={x:(projected.x*.5+.5)*width,y:(-projected.y*.5+.5)*height};
      r.button.hidden=false;r.button.dataset.uptakeLabel=entry.id;r.button.setAttribute('aria-expanded',String(expanded===entry.id));r.button.style.setProperty('--uptake-label-color',entry.color??'#6e939b');r.button.style.width=labelWidth+'px';
      setText(r.title,entry.title);setText(r.description,expanded===entry.id?(entry.description??entry.action):entry.action??entry.description);r.plus.textContent=expanded===entry.id?'−':'＋';
      const h=r.button.offsetHeight||58,w=r.button.offsetWidth||labelWidth,bottom=stripTop-h-14;
      const preferred=entry.lane??(i<3?'top':'bottom'),candidates=[];
      const add=(x,y,lane,column)=>{x=clamp(x,margin,width-margin-w);y=clamp(y,top,Math.max(top,bottom));const rect={x,y,width:w,height:h};if(occupied.some(p=>overlap(p,rect,10)))return;const dx=clamp(anchor.x,x,x+w),dy=clamp(anchor.y,y,y+h);candidates.push({rect,lane,score:(lane===preferred?0:85)+Math.abs(column-(i%3))*22+Math.hypot(anchor.x-dx,anchor.y-dy)*.10});};
      for(let col=0;col<3;col++){const x=margin+(width-2*margin-w)*col/2;add(x,top,'top',col);add(x,bottom,'bottom',col);}
      candidates.sort((a,b)=>a.score-b.score);const chosen=candidates[0];if(!chosen){hide(r);hidden.push({id:entry.id,reason:'no-free-space'});continue;}
      const p=chosen.rect;r.button.style.left=p.x+'px';r.button.style.top=p.y+'px';
      const edge={x:clamp(anchor.x,p.x+8,p.x+w-8),y:anchor.y<p.y?p.y:anchor.y>p.y+h?p.y+h:clamp(anchor.y,p.y+6,p.y+h-6)};
      if(anchor.y>=p.y&&anchor.y<=p.y+h)edge.x=anchor.x<p.x?p.x:p.x+w;
      r.line.setAttribute('d',`M${anchor.x} ${anchor.y} L${edge.x+(anchor.x-edge.x)*.22} ${edge.y} L${edge.x} ${edge.y}`);r.line.style.stroke=r.dot.style.stroke=entry.color??'#6e939b';r.dot.setAttribute('cx',anchor.x);r.dot.setAttribute('cy',anchor.y);r.dot.style.fill='#fff';r.line.style.display=r.dot.style.display='';
      occupied.push(p);labels.push({id:entry.id,rect:p,anchor,expanded:expanded===entry.id,lane:chosen.lane});
    }
    const collisions=[];for(let i=0;i<labels.length;i++)for(let j=i+1;j<labels.length;j++)if(overlap(labels[i].rect,labels[j].rect))collisions.push([labels[i].id,labels[j].id]);
    last={active:true,caseId:teaching.caseId,index:teaching.index,chapterIndex,motion:teaching.motion,labels,hidden,collisions,strip:{x:margin,y:stripTop,width:width-margin*2,height:stripHeight},labelsWithinCanvas:labels.every(({rect:r})=>r.x>=0&&r.y>=0&&r.x+r.width<=width&&r.y+r.height<=height),actualModelAnchors:true,hostOwnsTime:true};
  }
  return{sync,update,diagnostics:()=>structuredClone(last),dispose(){host.removeEventListener('pointerdown',stop);host.removeEventListener('wheel',stop);host.removeEventListener('keydown',key);host.removeEventListener('click',click);host.remove();doc.body.classList.remove('uptake-lesson-active');}};
}
