// Local teaching geometry. Positions and timing are deliberately expanded;
// the shapes distinguish membrane topology, not a measured single cell.
import { addCathepsinDomains, addVAtpaseDomains } from './protein-surface-detail.js';
export function buildRecyclingLesson(g,ctx){
 const {THREE,V,clamp,ease,material,mesh,ball,rod,connect,tube,receptor,guideRoute,membranePanel,label,focus,getProgress}=ctx;
 const blue=0x779ba5,purple=0xa08daf,amber=0xba833e,green=0x438675;
 const stage=p=>Math.min(4,Math.floor(p*5));
 const range=(value,a,b)=>ease(clamp((value-a)/(b-a),0,1));

 // Two opposed surfaces plus a cut-face rim give the membrane a readable
 // thickness. A polar cap can really open before content mixing is shown.
 function shell(parent,name,r,color,{irregular=.035,right=false}={}){
  const root=new THREE.Group();root.name=name;parent.add(root);
  const geometry=new THREE.BufferGeometry(),rows=26,cols=38,count=(rows+1)*(cols+1),pos=new Float32Array(count*6),indices=[];
  const normal=new Float32Array(pos.length),angles=[];
  for(let side=0;side<2;side++)for(let i=0;i<=rows;i++)for(let j=0;j<=cols;j++)angles.push([side,i/rows,j/cols]);
  for(let side=0;side<2;side++)for(let i=0;i<rows;i++)for(let j=0;j<cols;j++){
   const a=side*count+i*(cols+1)+j,b=a+cols+1;
   if(side===0)indices.push(a,b,a+1,b,b+1,a+1);else indices.push(a,a+1,b,b,a+1,b+1);
  }
  geometry.setAttribute('position',new THREE.BufferAttribute(pos,3));geometry.setAttribute('normal',new THREE.BufferAttribute(normal,3));geometry.setIndex(indices);
  const wall=mesh(root,name+'CutawayMembrane',geometry,material(color));wall.userData={teachingOnly:true,pickThrough:true,compartmentBoundary:true,observationCut:true,membraneThickness:true};
  let previous=NaN;
  function setOpening(angle){
   if(angle===previous)return;previous=angle;
   for(let k=0;k<angles.length;k++){
    const [side,u,v]=angles[k],theta=angle+(Math.PI-angle)*u,phi=Math.PI*v;
    const dx=(right?1:-1)*Math.cos(theta),dy=Math.sin(theta)*Math.cos(phi),dz=-Math.sin(theta)*Math.sin(phi);
    const wobble=1+irregular*(Math.sin(theta*3.7+phi*2.1)+.6*Math.cos(theta*5.2-phi*3.4));
    const radius=r*wobble-(side?.034:0),q=k*3;
    pos[q]=radius*dx;pos[q+1]=radius*dy;pos[q+2]=radius*dz;
    normal[q]=dx*(side?-1:1);normal[q+1]=dy*(side?-1:1);normal[q+2]=dz*(side?-1:1);
   }
   geometry.attributes.position.needsUpdate=true;geometry.attributes.normal.needsUpdate=true;geometry.computeBoundingSphere();
  }
  // Static cut rim has the same undulating outline as the outer wall.
  const rimPoints=[];for(let i=0;i<=100;i++){
   const a=i/100*Math.PI*2,x=Math.cos(a),y=Math.sin(a),theta=Math.acos(clamp((right?1:-1)*x,-1,1)),phi=y>=0?0:Math.PI;
   const rr=r*(1+irregular*(Math.sin(theta*3.7+phi*2.1)+.6*Math.cos(theta*5.2-phi*3.4)));
   rimPoints.push(V(rr*x,rr*y,.002));
  }
  const rim=tube(root,name+'ObservationCutRim',rimPoints,.018,material(color));rim.userData.artificialObservationCut=true;
  setOpening(0);
  return{root,wall,rim,setOpening};
 }
 function membraneTubule(parent,name,points,r,color){
  const root=new THREE.Group();root.name=name;parent.add(root);
  const curve=new THREE.CatmullRomCurve3(points),outer=mesh(root,name+'OuterLeaflet',new THREE.TubeGeometry(curve,44,r,12,false),material(color));
  // Visible terminal mouth: dark lumen and a thin annulus rather than a solid rod.
  const end=points.at(-1),direction=curve.getTangent(1).normalize(),ring=mesh(root,name+'OpenMouth',new THREE.TorusGeometry(r,.019,6,24),material(color),end);
  ring.quaternion.setFromUnitVectors(V(0,0,1),direction);
  outer.userData.hollowMembraneTubule=true;return root;
 }
 function pump(parent,name,pos,rotation=0){
  const root=new THREE.Group();root.name=name;root.position.copy(pos);root.rotation.z=rotation;parent.add(root);
  const pumpMat=material(0x5b746e),capMat=material(0xd2b585);
  // +Y is cytoplasm. V1 remains outside and the V0 ring spans the membrane.
  addVAtpaseDomains(root,name,pumpMat,capMat);
  const proton=ball(root,name+'ProtonTeachingSymbol',.041,material(0xc96758),V(0,.14,.14));
  root.userData={...root.userData,v1Side:'cytosolic',v0SpansMembrane:true,protonSymbolNotAtomistic:true};
  return{root,proton};
 }
 function hydrolase(parent,name,pos,scale=1){
  const root=new THREE.Group();root.name=name;root.position.copy(pos);root.scale.setScalar(scale);parent.add(root);
  const active=name==='TrackedCathepsinBTypeHydrolase';
  const mat=material(active?0x2e646a:0xb3a5bf),edge=material(active?0x9ebcb5:0xc4b9ce);
  // Coarse two-lobed cathepsin-B-type protease with a visible substrate cleft.
  // This is NOT a surface reconstructed from PDB coordinates.
  addCathepsinDomains(root,name,mat,edge);
  return root;
 }
 function proteinSegments(parent,name,size){
  const root=new THREE.Group();root.name=name;parent.add(root);const nodes=[],bonds=[],mat=material(amber),bondMat=material(0x94652f),base=[];
  for(let i=0;i<9;i++){
   const p=V(Math.sin(i*1.74)*size*.7,(i-4)*size*.28,Math.cos(i*1.2)*size*.32);base.push(p);
   nodes.push(ball(root,name+'PeptideDomain'+i,size*(.45+.06*(i%3)),mat,p));
   if(i)bonds.push(rod(root,name+'PeptideLink'+(i-1),base[i-1],p,.026,bondMat));
  }
  return{root,nodes,bonds,base};
 }

 const surface=membranePanel(g,'RecyclingSurfaceMembrane',V(-3.35,.08,0));
 // Heads and short hydrocarbon cues are structural context; not free particles.
 const lipidMat=material(0x879d91),tailMat=material(0xada880),temp=new THREE.Object3D();
 const lipidHeads=new THREE.InstancedMesh(new THREE.SphereGeometry(.045,12,8),lipidMat,32),lipidTails=new THREE.InstancedMesh(new THREE.CylinderGeometry(.012,.012,1,6),tailMat,32);
 lipidHeads.name='SurfaceLipidHeads';lipidTails.name='SurfaceAcylPairCues';surface.add(lipidHeads,lipidTails);
 for(const [sideIndex,side]of[-1,1].entries())for(let j=0;j<16;j++){
  const y=-.95+j*.127,index=sideIndex*16+j;temp.position.set(side*.075,y,.36);temp.scale.set(.7,1,.7);temp.quaternion.identity();temp.updateMatrix();lipidHeads.setMatrixAt(index,temp.matrix);
  const a=V(side*.06,y,.35),b=V(0,y+.017,.35);temp.position.copy(a).add(b).multiplyScalar(.5);temp.scale.set(1,a.distanceTo(b),1);temp.quaternion.setFromUnitVectors(V(0,1,0),b.sub(a).normalize());temp.updateMatrix();lipidTails.setMatrixAt(index,temp.matrix);
 }
 lipidHeads.instanceMatrix.needsUpdate=lipidTails.instanceMatrix.needsUpdate=true;
 const early=shell(g,'SortingEndosomeExcerpt',.84,blue,{irregular:.05}),endosome=early.root;endosome.position.set(-.55,.07,0);endosome.scale.set(1,.9,.84);
 const tubulePoints=[V(-.49,.55,-.04),V(-.7,.78,-.02),V(-.94,.92,0),V(-1.11,.94,0)];
 const sortingTubule=membraneTubule(endosome,'SelectedSortingTubule',tubulePoints,.125,blue);
 const sideTubule=membraneTubule(endosome,'SecondaryEndosomalTubule',[V(.48,.56,-.13),V(.66,.7,-.16),V(.75,.96,-.13)],.078,blue);
 const membraneReceptor=receptor(endosome,'SelectedRecyclingMembraneReceptor',green);membraneReceptor.position.set(-.48,.6,.08);membraneReceptor.rotation.z=Math.PI+.55;
 const endoCargo=proteinSegments(endosome,'SelectedDegradableLuminalCargo',.22);endoCargo.root.position.set(.12,-.06,.16);
 const endoPump=pump(endosome,'EndosomalV_ATPase',V(.39,.72,-.04),-.44);
 const endosomalLumenMarker=ball(endosome,'EarlyEndosomeLuminalRemnant',.09,material(0xb9a77f),V(-.28,-.29,-.24),V(1.5,.7,1));
 endosomalLumenMarker.userData.role='untracked lumenal context, not another target';

 const lysosome=shell(g,'DegradativeCompartmentExcerpt',.88,purple,{irregular:.075}),lyso=lysosome.root;lyso.position.set(2.72,-.16,0);
 const lysoPump=pump(lyso,'LysosomalV_ATPase',V(.36,.78,-.07),-.43);
 const hydrolases=[];for(const [i,p]of[V(-.46,-.37,-.14),V(.42,.41,-.16),V(.42,-.44,-.14)].entries())hydrolases.push(hydrolase(lyso,'LuminalHydrolase'+i,p,.48));
 // Few closed ILVs and membrane remnants distinguish endolysosomal content.
 for(let i=0;i<3;i++){
  const v=mesh(lyso,'EndolysosomalIntraluminalVesicle'+i,new THREE.SphereGeometry(.09+i*.012,18,12),material(0xa692ad),V(-.35+i*.31,.27-Math.sin(i)*.1,-.24));v.userData.intraluminalVesicle=true;
 }
 for(let i=0;i<2;i++)tube(lyso,'LuminalMembraneRemnant'+i,[V(-.45+i*.56,-.47,-.2),V(-.36+i*.48,-.59,-.15),V(-.18+i*.43,-.49,-.14)],.025,material(0xab98b1));
 const enzyme=hydrolase(lyso,'TrackedCathepsinBTypeHydrolase',V(-.25,.015,.23),1);
 const cleavage=proteinSegments(lyso,'DeliveredLuminalCargo',.21);cleavage.root.position.set(.18,-.05,.18);

 const recShell=shell(g,'ReceptorRecyclingCarrier',.28,blue,{irregular:.015}),recycling=recShell.root;
 recycling.userData.transportVesicle=true;
 const recycledReceptor=receptor(recycling,'ReceptorInRecyclingCarrierMembrane',green);recycledReceptor.position.set(0,.275,.04);recycledReceptor.rotation.z=Math.PI;
 const neck=rod(g,'RecyclingBudMembraneNeck',V(-1.65,.92,0),V(-1.85,.92,0),.095,material(blue));neck.userData.membraneNeck=true;
 const returned=receptor(surface,'ReturnedSurfaceReceptor',green);returned.position.set(0,.55,.12);returned.rotation.z=Math.PI/2;
 const fusionCue=mesh(g,'RecyclingSurfaceFusionOpening',new THREE.TorusGeometry(.115,.025,8,30),material(green),V(-3.35,.63,.12));fusionCue.rotation.y=Math.PI/2;

 const late=shell(g,'DegradativeCargoCarrierState',.43,0x938baf,{irregular:.045,right:true}),degradative=late.root;
 degradative.userData={lateEndosomeTeachingState:true,notSmallShuttleVesicle:true};
 const delivered=proteinSegments(degradative,'DegradativeCarrierCargo',.16);delivered.root.position.set(0,-.02,.12);
 for(let i=0;i<2;i++){const iv=mesh(degradative,'LateEndosomeIntraluminalVesicle'+i,new THREE.SphereGeometry(.064,16,10),material(0xb0a5bc),V(-.17+i*.25,.18,-.11));iv.userData.intraluminalVesicle=true;}
 const fusionNeck=mesh(g,'EndolysosomalFusionNeck',new THREE.CylinderGeometry(1,1,1,20,1,true,Math.PI/2,Math.PI),material(0x9d87a6));fusionNeck.quaternion.setFromUnitVectors(V(0,1,0),V(1,0,0));fusionNeck.userData={growingFusionPore:true,membraneConnectionNotCargoPipe:true};
 const tetherA=rod(g,'EndolysosomalDockingTetherA',V(),V(.1,0,0),.02,material(0x717c74)),tetherB=rod(g,'EndolysosomalDockingTetherB',V(),V(.1,0,0),.02,material(0x717c74));
 const recyclePath=guideRoute(g,'ReceptorReturnSequenceGuide',[V(-1.8,1.37,.08),V(-2.5,1.72,.08),V(-3.18,1.32,.1)],green);
 const degradePath=guideRoute(g,'CargoDegradationSequenceGuide',[V(.46,-.85,.08),V(1.1,-1.2,.08),V(1.72,-.83,.1)],amber);

 let latest={stage:0,subaction:'输入',pore:0,cleavedLinks:0};
 function update(p){
  const step=stage(p),u=clamp(p*5-step,0,1),sort=step===1?range(u,.12,.9):step>1?1:0;
  // Receptor moves along membrane into the high-area/low-volume tubule. It
  // remains transmembrane and never joins the freely soluble orange protein.
  membraneReceptor.visible=step<2;
  membraneReceptor.position.set(-.48-.60*sort,.6+.34*sort,.08);
  membraneReceptor.rotation.z=Math.PI+.55+.91*sort;
  sortingTubule.visible=step<3;sideTubule.visible=step<3;
  endoCargo.root.visible=step<3;endosome.visible=step<4;
  returned.visible=step>2||(step===2&&u>=.91);
  recycling.visible=step===2&&u<.91;
  // Detached carrier first leaves a constricting membrane neck, then travels.
  const detach=step===2?range(u,0,.25):0,travel=step===2?range(u,.25,.84):0;
  recycling.position.set(-1.74-.31*detach-.98*travel,.92+.15*Math.sin(travel*Math.PI)-.29*travel,.11);
  neck.visible=step===2&&u<.25;neck.scale.x=neck.scale.z=1-.92*detach;
  fusionCue.visible=step===2&&u>.84||step>2;fusionCue.scale.setScalar(step===2?.6+.4*range(u,.84,.96):1);
  // Receptor is inserted by a cutaway state hand-off at docking; not a closed
  // carrier crossing the intact surface. The membrane fusion complex is omitted.
  recShell.rim.visible=!(step===2&&u>.84);recShell.setOpening(step===2?range(u,.84,.91)*.52:0);
  recyclePath.visible=step===1||step===2;degradePath.visible=step===1||step===3;

  degradative.visible=step===3;const approach=range(u,0,.40),pore=step===3?range(u,.48,.73):0,mix=step===3?range(u,.73,1):0;
  degradative.position.set(.62+.715*approach,-.16,.015);
  // Facing polar caps are removed before the cargo enters the shared lumen.
  late.setOpening(pore*.57);lysosome.setOpening(pore*.31);
  late.rim.visible=pore===0;lysosome.rim.visible=pore===0;
  fusionNeck.visible=step===3&&pore>0;fusionNeck.position.set(1.79,-.16,0);
  fusionNeck.scale.set(.035+.21*pore,.2,.035+.21*pore);
  tetherA.visible=tetherB.visible=step===3&&u>.25&&u<.65;
  connect(tetherA,V(degradative.position.x+.36,.01,.08),V(1.9,.12,.08));connect(tetherB,V(degradative.position.x+.38,-.32,.09),V(1.89,-.42,.09));
  delivered.root.position.set(1.565*mix,-.02,.12);delivered.root.visible=step===3;
  for(const child of degradative.children)if(child.userData.intraluminalVesicle)child.visible=mix<.8;
  // A hybrid compartment is implied after content mixing. Its recovery into
  // separate lysosomes is outside this local lesson, not shown as instantaneous.
  // The last step is a visibly enlarged local reaction view. This presentation
  // change does not imply that the biological organelle suddenly grows/moves.
  lyso.position.set(step===4?.12:2.72,step===4?-.03:-.16,0);
  lyso.scale.setScalar(step===4?1.65:1);
  cleavage.root.visible=step===4;
  // Expand the selected peptide as a teaching representation so severed links
  // can be inspected; this is not a claim that cathepsin mechanically unfolds it.
  const binding=step===4?range(u,0,.22):0;
  cleavage.root.position.set(.18*(1-binding),-.05+.13*binding,.18+.05*binding);
  const cleaveProgress=step===4?range(u,.2,.93):0;
  const cleavedLinks=Math.min(4,Math.floor(cleaveProgress*4.999));
  for(let i=0;i<cleavage.nodes.length;i++){
   const part=Math.floor(i/2),released=range(cleaveProgress,part*.17,part*.17+.22),base=cleavage.base[i];
   const extendedX=(i-4)*.084,extendedY=Math.sin(i*1.15)*.018;
   cleavage.nodes[i].position.set(THREE.MathUtils.lerp(base.x,extendedX,binding),THREE.MathUtils.lerp(base.y,extendedY,binding),THREE.MathUtils.lerp(base.z,.025*Math.cos(i),binding));
   cleavage.nodes[i].position.x+=(part-2)*.075*released;
   cleavage.nodes[i].position.y+=Math.sin(part*1.8)*.12*released;
  }
  for(let i=0;i<cleavage.bonds.length;i++){
   const link=cleavage.bonds[i];link.visible=i%2===0||Math.floor(i/2)>=cleavedLinks;
   connect(link,cleavage.nodes[i].position,cleavage.nodes[i+1].position);
  }
  enzyme.position.set(step===4?-.25+.25*binding:-.25,step===4?.015-.095*binding:.015,.23);
  enzyme.rotation.z=step===4?.10*Math.sin(range(u,0,.93)*Math.PI*2):0;
  enzyme.visible=step>=3;
  for(const item of [endoPump,lysoPump]){
   const phase=(u*2+(item===endoPump?.35:0))%1;item.proton.position.set(0,.16-.31*phase,.14);
   item.proton.visible=step===0||step===1||step===4;
  }
  latest={stage:step,subaction:step===0?'区分膜上与腔内':step===1?(u<.5?'受体进入分选管':'货物留在内体腔'):step===2?(u<.25?'膜颈收缩':u<.84?'回收载体移动':'受体回到表面'):step===3?(u<.4?'晚期内体靠近':u<.73?'接触处开孔':'腔内容物混合'):(u<.2?'底物靠近水解酶':'肽链连接依次断开'),pore,cleavedLinks};
 }
 focus('endosome',V(-.55,.1,0));focus('recycle',()=>recycling.position.clone());focus('lysosome',()=>lyso.getWorldPosition(V()));
 label('sorting-endosome','管泡状内体','宽阔腔体留住选定可降解蛋白；细长管的高膜面积/腔体积比有利于膜成分回收。形状依据管泡状组织作教学重建。',V(-.55,.6,.2),'#7099a7',()=>stage(getProgress())<4);
 label('degradative-compartment','内溶酶体降解腔','晚期内体与溶酶体交流形成有水解活性的区室。末步放大局部反应；小泡是内腔囊泡，短片状结构是膜残片，双叶体是水解酶示意。',()=>lyso.localToWorld(V(-.58,.4,.12)),'#8e729e',()=>stage(getProgress())>=3);
 label('recycling-receptor','绿色：回收膜受体','绿色分子始终镶在膜上。结合端朝腔内，回到细胞表面后仍朝胞外；并非全部膜受体都会回收。',()=>{
  const p=getProgress(),s=stage(p),u=clamp(p*5-s,0,1),actor=s<2?membraneReceptor:s===2&&u<.91?recycledReceptor:returned;
  return actor.getWorldPosition(V()).add(V(0,0,.12));
 },'#43836f');
 label('degradative-cargo','橙色：蛋白质货物','保留连锁形状持续追踪。它留在降解方向；末段是肽链连接断开形成的小片段，没有随受体回收。',()=>{
  const s=stage(getProgress()),actor=s<3?endoCargo.root:s===3?delivered.root:cleavage.root;return actor.getWorldPosition(V()).add(V(0,0,.16));
 },'#ab8348');
 label('acidification-pump','V-ATPase：把 H⁺ 泵入腔内','米黄色 V1 催化头朝胞质，深绿色 V0 跨膜；红色 H⁺ 符号向腔内移动。酸化建立水解环境；不代表单一泵决定全部 pH。',()=>{
  const s=stage(getProgress());return(s<3?endoPump.root:lysoPump.root).getWorldPosition(V()).add(V(0,.18,.1));
 },'#8a815c',()=>[0,1,4].includes(stage(getProgress())));
 label('cathepsin-cleft','深青色：水解酶及底物沟槽','深青色双叶体以组织蛋白酶 B 为例：橙色链靠近叶间沟槽，部分连接随后断开。为辨认断键而展开链段，不表示酶在机械展开蛋白。未重现原子坐标、催化残基或完整反应动力学。',()=>enzyme.getWorldPosition(V()).add(V(0,.15,.16)),'#376c70',()=>stage(getProgress())===4);
 // Stage 4: compartment/receptor/cargo/pump/enzyme = five labels. Earlier
 // stages deliberately expose fewer labels instead of a permanent particle key.
 const descriptions={
  '区分膜上与腔内':'绿色受体跨膜，橙色蛋白位于腔内；H⁺ 泵把催化头留在胞质侧。',
  '受体进入分选管':'受体沿连续膜进入细长分选管，蛋白质货物留在宽阔腔体。',
  '货物留在内体腔':'分选改变去向，没有把腔内所有物质一并送回细胞表面。',
  '膜颈收缩':'连接部逐渐变细；绿色受体保留在即将脱离的载体膜上。',
  '回收载体移动':'载体脱离后靠近细胞表面；没有带走橙色降解货物。',
  '受体回到表面':'以融合后的膜连续性状态交接，受体结合端保持胞外朝向。',
  '晚期内体靠近':'成熟步骤被压缩；带内腔囊泡的晚期内体向降解区室接近。',
  '接触处开孔':'两侧朝向接触处的膜面先开孔，再出现连接腔；此处不模拟 Rab/HOPS/SNARE 的原子细节。',
  '腔内容物混合':'橙色蛋白经已开放的连接腔进入降解环境，不穿过完整膜。',
  '底物靠近水解酶':'反应处作局部放大：深青色双叶水解酶接近橙色蛋白；链段展开是为了看清随后的断键。',
  '肽链连接依次断开':'可辨认的橙色连接分段断开，小肽片段分离；这不是凭空出现一群新球。'
 };
 update(0);
 return{update,motion:()=>({title:latest.subaction,description:descriptions[latest.subaction]}),diagnostics:()=>({type:'Tubulovesicular endosome and dense endolysosome',...latest,selectedReceptorRetainsTopology:true,recyclingExcludesSolubleCargo:true,facingMembraneCapsOpenBeforeContentMixing:true,hydrolaseRepresentation:'Coarse cathepsin-B-type two-domain cleft; not atomic/PDB coordinates',v1Side:'cytosolic',continuousIndependentClock:false})};
}
