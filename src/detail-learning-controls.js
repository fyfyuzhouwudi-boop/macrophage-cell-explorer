// Native controls for structure-focused views and independently timed fusion examples.
// The application owns navigation and playback; this module owns only its controls.
export function createDetailLearningControls({state,getActive,getGuide,isNavigating,focusAnchor,viewModel,requestRender,syncUI,onPlaybackEdit,fusionIds}) {
  const $=id=>document.getElementById(id);
  const structure=document.createElement('section');
  structure.id='structure-focus-panel';structure.className='structure-focus-panel';structure.hidden=true;
  structure.innerHTML='<h3>放大查看构造</h3><div class="structure-focus-buttons"></div><p class="structure-focus-description" aria-live="polite"></p>';
  $('back-button').insertAdjacentElement('beforebegin',structure);
  const legend=document.createElement('div');legend.id='bilayer-legend';legend.className='bilayer-legend';legend.hidden=true;
  legend.innerHTML='<span><i class="leaflet-out"></i>胞外叶 · 亲水头</span><span><i class="leaflet-in"></i>胞质叶 · 亲水头</span><span><i class="leaflet-tail"></i>相向双尾 · 疏水区</span><p>蛋白跨膜段位于双层中；两端结构域伸向水相。颜色区分膜两侧。</p>';
  structure.insertAdjacentElement('beforebegin',legend);
  const panel=document.createElement('section');panel.id='fusion-controls';panel.className='fusion-controls';panel.hidden=true;
  panel.innerHTML='<div class="eyebrow">微观过程 · 可逐步观察</div><div class="fusion-stages"></div><p class="fusion-stage-description" aria-live="polite"></p><label for="fusion-progress">反应进度 <output id="fusion-progress-value">0%</output></label><input id="fusion-progress" type="range" min="0" max="1000" value="0" aria-label="膜融合反应进度"><button id="fusion-replay" class="micro-button" type="button">从头播放融合过程</button><p class="fusion-topology-note"></p>';
  $('back-button').insertAdjacentElement('beforebegin',panel);
  const poreButton=document.createElement('button');poreButton.id='fusion-pore-view';poreButton.type='button';poreButton.className='micro-button';poreButton.textContent='沿融合孔向内看';panel.append(poreButton);
  poreButton.addEventListener('click',()=>focusAnchor({id:'fusion-pore',title:'沿水性融合孔观察',camera:'poreCamera',target:'poreTarget',section:0}));
  const compartment=document.createElement('aside');compartment.id='fusion-compartments';compartment.className='fusion-compartments';compartment.hidden=true;document.querySelector('.atlas').append(compartment);
  const links=document.createElement('section');links.id='fusion-entry-panel';links.className='fusion-entry-panel';
  links.innerHTML='<h3>进入膜融合微观现场</h3><button class="micro-button" data-fusion-entry="snare-fusion">囊泡融合 · SNARE 拉链</button><button class="micro-button" data-fusion-entry="ha-fusion">病毒包膜融合 · 流感 HA</button><p>吞噬先包裹外物；膜融合发生在两个脂质双层之间。两个案例分别观察。</p>';
  $('scenario-details').insertAdjacentElement('beforebegin',links);
  for(const b of links.querySelectorAll('[data-fusion-entry]'))b.addEventListener('click',()=>viewModel(b.dataset.fusionEntry));
  let key='',stageKey='',lastStage=-1,selectedFocus=null;
  function modelState(){const model=getActive();return model?.getState?.()??model?.getDiagnostics?.()??{};}
  function seek(progress){if(isNavigating()||!fusionIds.includes(state.selected))return;getActive()?.seek(progress);state.playing=false;onPlaybackEdit();syncUI();requestRender();}
  $('fusion-progress').addEventListener('input',e=>seek(Number(e.target.value)/1000));
  $('fusion-replay').addEventListener('click',()=>{if(isNavigating())return;getActive()?.seek(0);state.playing=true;onPlaybackEdit();syncUI();requestRender();});
  function focus(entry){if(isNavigating())return;selectedFocus=entry.key??entry.id;focusAnchor(entry);const feature=getGuide()?.features?.find(f=>f.id===entry.guideFeatureId);structure.querySelector('.structure-focus-description').textContent=entry.description??entry.desc??feature?.function??entry.title;for(const b of structure.querySelectorAll('button'))b.setAttribute('aria-pressed',String(b.dataset.focusKey===selectedFocus));}
  function sync(){
    const detail=state.view==='detail',model=getActive(),isFusion=detail&&fusionIds.includes(state.selected);
    links.hidden=detail||state.scenario==='structure';
    links.querySelectorAll('button').forEach(b=>b.disabled=isNavigating());
    legend.hidden=!detail||state.selected!=='membrane';
    const entries=model?.metadata?.secretoryDetails??[];
    structure.hidden=!detail||!entries.length;
    const nextKey=detail?state.selected+':'+state.connectedER:'';
    if(key!==nextKey){key=nextKey;selectedFocus=null;structure.querySelector('.structure-focus-buttons').replaceChildren();structure.querySelector('.structure-focus-description').textContent='选择一处，靠近查看它的形态、朝向和功能。';
      for(const entry of entries){const b=document.createElement('button');b.type='button';b.dataset.focusKey=entry.key??entry.id;b.textContent=entry.label??entry.title;b.setAttribute('aria-pressed','false');b.addEventListener('click',()=>focus(entry));structure.querySelector('.structure-focus-buttons').append(b);}}
    structure.querySelectorAll('button').forEach(b=>b.disabled=isNavigating());
    panel.hidden=!isFusion;
    compartment.hidden=!isFusion;
    if(isFusion){const current=modelState(),stages=model.stages??model.metadata?.stages??current.stages??[];
      const ha=state.selected==='ha-fusion';compartment.innerHTML=ha?'<strong>流感 HA · 内体中的局部</strong><span>上方：病毒内部</span><span>膜间：内体腔 · HA 伸展与折返</span><span>下方：细胞质</span><small>孔开放后：病毒内部 ↔ 细胞质</small>':'<strong>SNARE · 两个胞内膜室</strong><span>上、下：各自的水性腔</span><span>膜间：胞质 · 四螺旋装配</span><small>STX7 / VTI1B / STX8 + VAMP7</small><small>孔开放后：两侧腔室相通</small>';
      if(stageKey!==state.selected){stageKey=state.selected;lastStage=-1;panel.querySelector('.fusion-stages').replaceChildren();
        for(const [i,stage]of stages.entries()){const b=document.createElement('button');b.type='button';b.dataset.stage=String(i);b.textContent=`${i+1} ${stage.title??stage.name}`;b.addEventListener('click',()=>seek(stage.at));panel.querySelector('.fusion-stages').append(b);}}
      panel.querySelectorAll('button,input').forEach(b=>b.disabled=isNavigating());
      panel.querySelector('.fusion-topology-note').textContent=model.metadata?.timelineNote??'论文约束的教学关键构象；进度与速度用于说明动作顺序。';
      update();
    }
  }
  function update(){if(state.view!=='detail'||!fusionIds.includes(state.selected))return;const model=getActive(),s=modelState(),stages=model.stages??model.metadata?.stages??s.stages??[],p=s.progress??0,index=s.stageIndex??Math.max(0,stages.findLastIndex(x=>p>=x.at));
    $('fusion-progress').value=String(Math.round(p*1000));$('fusion-progress-value').textContent=Math.round(p*100)+'%';
    poreButton.hidden=p<.78;
    if(index!==lastStage){lastStage=index;panel.querySelectorAll('[data-stage]').forEach(b=>b.setAttribute('aria-pressed',String(Number(b.dataset.stage)===index)));panel.querySelector('.fusion-stage-description').textContent=stages[index]?.desc??stages[index]?.description??'';}
    if(p>=1&&state.playing){state.playing=false;syncUI();}
  }
  function focusById(id){const entry=getActive()?.metadata?.secretoryDetails?.find(e=>(e.key??e.id)===id);if(!entry)return false;focus(entry);return true;}
  return{sync,update,seek,focusById,dispose(){structure.remove();legend.remove();panel.remove();links.remove();compartment.remove();}};
}
