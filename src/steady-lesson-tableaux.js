import { buildSynthesisLesson } from './steady-synthesis-detail.js';
import { buildTransportLesson } from './steady-transport-detail.js';
import { buildRecyclingLesson } from './steady-recycling-detail.js';
import * as helpers from './steady-lesson-primitives.js';
const { THREE,V,clamp }=helpers;

export const STEADY_TOPICS=[
 {name:'合成与分选',at:0,desc:'沿同一件分泌蛋白货物，观察粗面内质网、运输载体、高尔基体和细胞表面的交接。',color:0x6b9da8},
 {name:'能量与运输',at:.4,desc:'把供能与运动分开看：线粒体参与再生 ATP，马达利用 ATP 水解循环带动载体沿微管前进。',color:0xc9974f},
 {name:'回收与降解',at:.78,desc:'同一次分选有不同去向：膜受体返回表面，选定的腔内货物继续进入降解途径。',color:0x967cab}
];
export const STEADY_GUIDE={
 summary:'三段可逐步播放的局部协作示意。保留可辨认的货物、处理部位和交接方向；彩色虚线箭头只表示教学去向，不是整胞原位坐标或固定连通管道。',
 steps:STEADY_TOPICS.map(t=>({title:t.name,desc:t.desc})),
 notes:['空间位置、观察切口、相对尺寸和时间经过教学重排；当前动作的局部会放大。','本课选择分泌糖蛋白。可观察核糖体—Sec61、COPII 装配与膜颈变化、Golgi 腔内加工和胞吐孔；ERGIC 与进入 Golgi 的融合仍用状态交接，未建立完整融合分子体系。','线粒体不是 ATP 的唯一来源，胞质糖酵解也可产生 ATP。ATP/ADP/Pi 为化学循环符号；没有从线粒体直达马达的专用 ATP 管道。双头换步经过减速，未表示真实尺寸与 ATPase 动力学。','本课选择可回收受体与可降解腔内蛋白的分支。晚期内体开孔与内容混合是粗化拓扑示意；水解酶以组织蛋白酶 B 为例，不是原子模型。'],
 sources:[
  {title:'Barlowe et al. 1994 · COPII vesicle formation',url:'https://pubmed.ncbi.nlm.nih.gov/8004676/'},
  {title:'Schnitzer & Block 1997 · ATP-coupled kinesin stepping',url:'https://www.nature.com/articles/41111'},
  {title:'Dunn et al. 1989 · Recycling / degradative cargo sorting',url:'https://pubmed.ncbi.nlm.nih.gov/2600137/'},
  {title:'Alberts et al. · ER through Golgi',url:'https://www.ncbi.nlm.nih.gov/books/NBK26941/'}
 ]
};
const LESSONS=[
 [
  {key:'er-synthesis',title:'在粗面内质网合成',input:'进入分泌途径的新生肽链',action:'核糖体在膜的胞质侧翻译，所选肽链进入 ER 腔',result:'可继续折叠和加工的腔内蛋白',focus:'er',notes:'蛋白链是粗化示意；本课不表示所有蛋白都在粗面 ER 合成。'},
  {key:'er-export',title:'衣被募集与出芽',input:'ER 腔内的选定蛋白',action:'COPII 衣被募集，芽体膜颈收窄，载体分离后离开',result:'货物留在独立载体腔内',focus:'carrier',notes:'衣被与膜颈为粗化示意；ERGIC 及进入 Golgi 的融合未逐一绘制。'},
  {key:'golgi-processing',title:'高尔基体继续加工',input:'ER 输出的同一类货物',action:'货物进入 Golgi 加工与分选阶段',result:'准备送往选定目的地的货物',focus:'golgi',notes:'本课选择送往细胞表面的分泌通路；不将五个扁囊当成五次固定化学反应。'},
  {key:'secretory-transport',title:'分选后再次运输',input:'Golgi 输出的分泌货物',action:'一件可辨认的货物随膜性载体靠近细胞表面',result:'待交付的分泌载体',focus:'carrier',notes:'方向提示只说明所选目的地；不是细胞器之间的固定导管。'},
  {key:'secretion',title:'开孔并释放到胞外',input:'含分泌货物的载体',action:'膜靠近并打开融合孔，货物在孔扩大后经过孔到达胞外',result:'载体腔与胞外连通',focus:'surface',notes:'SNARE 是通用装配原理示意；不指定巨噬细胞唯一组合。保留 Ω 形膜轮廓观察，后续回平与回收省略。'}
 ],
 [
  {key:'atp-regeneration',title:'先区分供能与运输',input:'ADP、无机磷酸及代谢能量',action:'线粒体氧化磷酸化是 ATP 再生的一条重要途径',result:'可供胞内反应使用的 ATP',focus:'mitochondrion',notes:'胞质糖酵解也可产生 ATP；图中不是从线粒体发出一列运输颗粒。'},
  {key:'motor-binding',title:'马达连接载体与轨道',input:'膜性载体、马达和微管',action:'选定的双头 kinesin 示意一端结合微管，尾部连接货物',result:'轨道—马达—载体形成机械联系',focus:'motor',notes:'采用 kinesin 代表性局部；不代表所有载体只用一种马达。'},
  {key:'motor-cycle',title:'ATP 循环驱动换步',input:'马达结合的 ATP',action:'ATP 结合、水解和产物释放与头部结合状态和构象耦联',result:'两头交替前移，载体随之移动',focus:'motor',notes:'动作减速并放大；没有按屏幕尺寸或节拍表示真实 8 nm 与酶速率。'},
  {key:'cargo-advance',title:'载体沿微管前进',input:'仍被膜包裹的同一件货物',action:'马达持续换步，载体沿选定轨道方向移位',result:'货物在胞质中改变位置',focus:'motor',notes:'微管是轨道，不是内装货物的运输管；马达可调控、停顿或换向。'},
  {key:'transport-result',title:'看清三种不同角色',input:'供能系统、轨道与马达',action:'ATP 提供化学自由能，微管提供结合轨道，马达把化学循环耦联到运动',result:'载体被搬运；它没有变成 ATP',focus:'motor',notes:'终点是所选运输片段的终点，不指定为某一个细胞器的固定交付地址。'}
 ],
 [
  {key:'endosomal-input',title:'受体与货物已进入内体',input:'膜上的受体与腔内货物',action:'从已经内化的状态观察它们的不同位置',result:'绿色受体在膜上，橙色货物在腔内',focus:'endosome',notes:'本段不重复摄取膜内陷；受体和腔内货物不是同一种小球。'},
  {key:'sorting-choice',title:'在内体分开去向',input:'一项可回收受体及可降解货物的教学选择',action:'受体进入回收方向，腔内货物留在处理方向',result:'形成上方回收与下方降解两条支路',focus:'endosome',notes:'这是选定命运组合；部分膜受体也可能被送往降解。'},
  {key:'receptor-recycling',title:'把受体送回表面',input:'回收载体膜上的绿色受体',action:'受体随回收途径返回细胞表面',result:'受体重新位于表面膜，橙色货物没有随行',focus:'recycle',notes:'回收内体及载体膜融合细节作分段交接；不得把全部内体内容倒回胞外。'},
  {key:'degradative-delivery',title:'腔内货物继续被处理',input:'留在降解方向的橙色货物',action:'经内体成熟及与降解区室的交流，货物进入酸性水解环境',result:'可降解货物位于降解腔内',focus:'lysosome',notes:'晚期内体、融合和区室动态在这里压缩表达；不是一根内体直通溶酶体的管。'},
  {key:'degradation',title:'水解酶接触并切断底物',input:'降解腔内的同一件蛋白货物',action:'底物接近水解酶沟槽，肽链连接逐段断开并分离',result:'表面保留回收受体，降解腔内出现小肽片段',focus:'lysosome',notes:'以组织蛋白酶 B 型双叶结构为粗化实例，未重建原子坐标、催化残基或完整反应动力学。'}
 ]
];

export function createSteadyAtlas(){
 const group=new THREE.Group();group.name='SteadyFunctionalRelations';group.userData={teachingOnly:true,relationshipOverlay:true,dedicatedLocalTableau:true,notWholeCellCoordinates:true};
 let selected=0,progress=0,canShow=()=>true,disposed=false;
 const tableaus=[],labels=[],focuses=[],updates=[],builders=[],appliedProgress=[];
 function layer(index){const g=new THREE.Group();g.name='SteadyCausalTableau_'+index;group.add(g);tableaus.push(g);labels[index]=[];focuses[index]={};return g;}
 function label(topic,id,title,description,position,color,when=()=>true){labels[topic].push({id,title,description,position,color,when});}
 function focus(topic,key,position){focuses[topic][key]=position;}
 [buildSynthesisLesson,buildTransportLesson,buildRecyclingLesson].forEach((build,index)=>{
  const g=layer(index),ctx={...helpers,getProgress:()=>progress,
   label:(...args)=>label(index,...args),focus:(...args)=>focus(index,...args)};
  builders[index]=build(g,ctx);updates[index]=builders[index].update;
 });
 function setTopic(index){const next=clamp(Math.floor(Number(index)||0),0,2);if(next!==selected){selected=next;progress=0;}tableaus.forEach((g,i)=>g.visible=i===selected);seek(progress);}
 function applyProgress(){if(disposed||appliedProgress[selected]===progress)return;updates[selected](progress);appliedProgress[selected]=progress;}
 function seek(value){progress=clamp(Number(value)||0,0,1);applyProgress();}
 function setVisibilityFilter(fn){canShow=typeof fn==='function'?fn:()=>true;group.userData.presentationVisibilityFiltered=!canShow('collaboration');}
 function update(){applyProgress();}
 function getTeachingState(){const stages=LESSONS[selected].map((s,i)=>({...s,at:i/5,index:i})),index=Math.min(4,Math.floor(progress*5)),s=stages[index];return{...s,topic:selected,topicName:STEADY_TOPICS[selected].name,index,progress,stageCount:stages.length,stages,duration:40,description:s.action,location:'局部协作示意 · 非整胞原位坐标',boundaryNote:s.notes,motion:builders[selected].motion?.()??null,clock:'Host normalized lesson progress; no independent ambient animation'};}
 function getLabelState(){return labels[selected].map(l=>({id:l.id,title:l.title,description:l.description,position:typeof l.position==='function'?l.position():l.position.clone(),visible:l.when()&&canShow('collaboration'),color:l.color}));}
 function getCameraPose(){return{position:V(0,1.15,13),target:V(0,.15,0),near:.02,far:110,minDistance:5,maxDistance:25};}
 function activityFocus(){const focus=focuses[selected][getTeachingState().focus];return typeof focus==='function'?focus():focus?.clone()??V();}
 function dispose(){if(disposed)return;disposed=true;const geos=new Set(),mats=new Set();group.traverse(o=>{if(o.isInstancedMesh)o.dispose();if(o.geometry)geos.add(o.geometry);for(const m of Array.isArray(o.material)?o.material:[o.material])if(m)mats.add(m);});geos.forEach(g=>g.dispose());mats.forEach(m=>m.dispose());group.clear();}
 setTopic(0);
 return{group,setTopic,seek,setVisibilityFilter,update,dispose,activityFocus,getTeachingState,getLabelState,getCameraPose,duration:40,get selected(){return selected;},diagnostics(){return{topic:selected,progress,stage:getTeachingState().key,dedicatedLocalTableau:true,clock:'Host-controlled normalized progress',causalStages:5,detail:builders[selected].diagnostics?.()??null,notWholeCellCoordinates:true,noPermanentInterorganellePipes:true,transportVesiclesVisible:canShow('collaboration')};},stats:{type:'Three causal local teaching tableaus',topics:3,stagesPerTopic:5,notMeasuredCellCoordinates:true}};
}
