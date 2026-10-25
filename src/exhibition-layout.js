// One anatomy atlas contains organelles and structures; processes have their own route.
// Existing model buttons keep their listeners; only their presentation is moved.
export function createExhibitionLayout({state,onContextChange=()=>{}}) {
  const byId=id=>document.getElementById(id);
  const sidebar=document.querySelector('.sidebar');
  const journey=byId('journey-panel'),detail=byId('detail-panel');
  const library=byId('explore-library'),structureLibrary=byId('structure-library');
  const primary=byId('atlas-primary-navigation'),processNavigation=byId('process-navigation');
  // A focused native control owns Space; do not also trigger the global player.
  const preserveNativeActivation=event=>{if(event.code==='Space'&&event.target?.closest('button,summary'))event.stopPropagation();};
  sidebar.addEventListener('keydown',preserveNativeActivation);
  const reading=document.createElement('div');
  reading.className='sidebar-scroll';reading.setAttribute('aria-label','当前观察内容');
  sidebar.insertBefore(reading,journey);
  const annotations=sidebar.querySelector('.atlas-note-panel');
  if(annotations)reading.append(annotations);
  reading.append(library,processNavigation,journey,detail);
  reading.append(byId('visibility-details'));

  const descriptions={
    nucleus:'核膜与染色质',er:'粗面与光面',golgi:'膜囊与分选',
    mitochondria:'嵴与基质',lysosome:'酸性降解',peroxisome:'氧化代谢',
    ribosome:'大小亚基 · 无膜',endosome:'分选、回收、成熟',phagosome:'包围已摄入的颗粒',
    membrane:'脂质与膜蛋白',cytoskeleton:'三类纤维网络',pore:'核膜运输通道'
  };
  const groups=[['nuclear-grid',['nucleus','pore']],['organelle-grid',['er','golgi','mitochondria','lysosome','peroxisome','ribosome']],['compartment-grid',['endosome','phagosome']],['structure-grid',['membrane','cytoskeleton']]];
  for(const [host,ids] of groups)for(const id of ids){
    const button=document.querySelector('[data-organelle="'+id+'"]');
    if(!button)continue;
    const label=button.lastElementChild;label.className='anatomy-card-label';
    const hint=document.createElement('small');hint.textContent=descriptions[id];label.append(hint);
    button.setAttribute('aria-label',label.firstChild.textContent+'，'+descriptions[id]);
    byId(host).append(button);
  }
  const skeleton=byId('skeleton-network-panel');if(skeleton)byId('structure-network-tools').append(skeleton);
  byId('visibility-details').querySelector('summary').textContent='显示与隐藏';

  // One inspector follows selection, with useful related instances in context.
  const back=byId('back-button');detail.prepend(back);
  byId('detail-title').after(byId('detail-summary'));
  const science=byId('structure-details'),chips=detail.querySelector('.atlas-feature-chips');
  if(chips)science.querySelector('summary').after(chips);
  const tools=byId('detail-observation-tools');
  for(const id of ['structure-focus-panel','bilayer-legend','fusion-controls']){
    const node=byId(id);if(node)byId('detail-summary').after(node);
  }
  const related=document.createElement('section');related.id='detail-related';related.className='detail-related';related.hidden=true;
  related.innerHTML='<h3>相关局部</h3><div id="related-instance-grid" class="related-instance-grid"></div>';
  science.before(related);
  const molecular=byId('molecular-grid'),relatedGrid=byId('related-instance-grid');
  const localButtons=[...molecular.querySelectorAll('[data-organelle]')];
  const membraneLocal=localButtons.find(b=>!['tubulin-structure','ribosome-structure','membrane-patch','snare-fusion','ha-fusion'].includes(b.dataset.organelle))?.dataset.organelle;
  const relatedByParent={er:['membrane-patch'],ribosome:['ribosome-structure'],cytoskeleton:['tubulin-structure'],membrane:[membraneLocal].filter(Boolean),lysosome:['snare-fusion'],phagosome:['snare-fusion'],endosome:['ha-fusion']};

  const scenario=byId('scenario-details'),fusionEntry=byId('fusion-entry-panel');
  if(fusionEntry)scenario.querySelector('summary').after(fusionEntry);
  const uptake=byId('uptake-controls');
  if(uptake){
    const supplementary=document.createElement('details');supplementary.id='uptake-observation-tools';supplementary.className='function-guide observation-tools';
    const summary=document.createElement('summary');summary.textContent='更多案例与过程说明';supplementary.append(summary);
    for(const node of [...uptake.children])if(!node.classList.contains('uptake-case-selector'))supplementary.append(node);
    journey.querySelector('.time-control').after(supplementary);
    supplementary.querySelector('summary').after(uptake);
  }

  const structureIds=new Set(['membrane','cytoskeleton','pore','tubulin-structure','membrane-patch',membraneLocal]);
  const processIds=new Set(['snare-fusion','ha-fusion']);
  let category=state.scenario==='structure'?'anatomy':'processes',requestedCategory=null,lastScenario=state.scenario,lastDetailSelected=null,readingKey='',suppressScenarioRoute=false;
  function closeNote(){if(sidebar.classList.contains('atlas-note-open'))sidebar.querySelector('.atlas-note-close')?.click();}
  function navigateCategory(next){
    category=next;requestedCategory=next;closeNote();
    // Return through application navigation so temporary cameras and clipping reset.
    if(state.view==='detail')back.click();
    if(next!=='processes'&&state.scenario!=='structure'){
      suppressScenarioRoute=true;byId('structure-tab').click();suppressScenarioRoute=false;
    }
    sync();
  }
  const tabs=[...primary.querySelectorAll('[data-atlas-category]')];
  tabs.forEach((button,index)=>{
    button.addEventListener('click',()=>navigateCategory(button.dataset.atlasCategory));
    button.addEventListener('keydown',event=>{
      const next=event.key==='ArrowRight'?(index+1)%tabs.length:event.key==='ArrowLeft'?(index+tabs.length-1)%tabs.length:event.key==='Home'?0:event.key==='End'?tabs.length-1:-1;
      if(next<0)return;event.preventDefault();tabs[next].focus();tabs[next].click();
    });
  });
  // Keep the old programmatic entry point without a second anatomy tab.
  byId('structures-route')?.addEventListener('click',()=>navigateCategory('anatomy'));
  for(const id of ['structure-tab','clearance-tab','virus-tab'])byId(id).addEventListener('click',()=>{
    if(!suppressScenarioRoute){category='processes';closeNote();sync();}
  });
  back.addEventListener('click',()=>{closeNote();sync();});

  function sync(){
    const detailView=state.view==='detail';
    if(state.scenario!==lastScenario){if(!suppressScenarioRoute&&!requestedCategory)category='processes';lastScenario=state.scenario;}
    if(detailView&&state.selected!==lastDetailSelected){
      lastDetailSelected=state.selected;tools.open=false;
      category=processIds.has(state.selected)?'processes':'anatomy';
      for(const b of localButtons)molecular.append(b);
      const ids=relatedByParent[state.selected]??[];
      for(const id of ids){const b=localButtons.find(node=>node.dataset.organelle===id);if(b)relatedGrid.append(b);}
      related.hidden=!relatedGrid.children.length;
    }
    // Reset this on return so revisiting a model restores its contextual route.
    if(!detailView)lastDetailSelected=null;
    if(requestedCategory){category=requestedCategory;if(!detailView&&(category==='processes'||state.scenario==='structure'))requestedCategory=null;}
    const noteOpen=sidebar.classList.contains('atlas-note-open');
    for(const tab of tabs){const active=tab.dataset.atlasCategory===category;tab.setAttribute('aria-selected',String(active));tab.tabIndex=active?0:-1;}
    library.hidden=detailView||noteOpen||category!=='anatomy';
    structureLibrary.hidden=false;
    processNavigation.hidden=detailView||noteOpen||category!=='processes';
    journey.hidden=detailView||noteOpen||category!=='processes';
    const uptakeTools=byId('uptake-observation-tools');if(uptakeTools)uptakeTools.hidden=state.scenario!=='clearance';
    sidebar.dataset.category=category;sidebar.dataset.context=detailView?'detail':category;
    byId('visibility-details').hidden=detailView||noteOpen||(state.scenario==='virus'&&state.viralLesson==='entry');
    const clarity=byId('clear-observation-button');
    if(clarity){
      if(state.skeletonFocus&&category==='anatomy')byId('structure-network-tools').append(clarity);
      else byId('follow-button').after(clarity);
    }
    if(detailView){
      const type=processIds.has(state.selected)?'微观反应':structureIds.has(state.selected)?'细胞结构':['endosome','phagosome'].includes(state.selected)?'内吞与吞噬区室':state.selected==='nucleus'?'细胞核':state.selected==='ribosome'?'无膜细胞器':'细胞器';
      byId('detail-kicker').textContent=type+' · 局部观察';
      back.lastChild.textContent=' 返回整胞';
    }
    document.body.dataset.exhibitionView=detailView?'detail':category;
    const key=[category,state.view,state.selected,noteOpen].join(':');
    if(key!==readingKey){readingKey=key;reading.scrollTop=0;}
    tools.hidden=!Array.from(tools.children).some(node=>node.tagName!=='SUMMARY'&&!node.hidden);
    onContextChange({category,detailView,noteOpen});
  }
  sync();
  return {sync,getCategory:()=>category,dispose(){sidebar.removeEventListener('keydown',preserveNativeActivation);delete document.body.dataset.exhibitionView;}};
}
