import * as THREE from 'three';
import { radialBoundary, endosomeRadius, sortingEndosomeField, phagosomeRadius, peroxisomeRadius } from './compartment-boundaries.js';
import { applyWholeOrganelleFinish } from './whole-organelle-finish.js';
import {addPeroxisomalEnzymeTraces} from './peroxisomal-enzyme-traces.js';
import {createMembraneSectionBridge} from './compartment-section-rim.js';

const V=(x=0,y=0,z=0)=>new THREE.Vector3(x,y,z);
const TAU=Math.PI*2;
function randomSource(seed){return()=>{seed=(seed*1664525+1013904223)>>>0;return seed/4294967296;};}
function ballPoint(random,radius=1){const p=V();do{p.set(random()*2-1,random()*2-1,random()*2-1);}while(p.lengthSq()>1);return p.multiplyScalar(radius);}

function addSingleMembrane(group,detail,ctx,api,{radiusAt,color,name,thickness=.026}){
  const outerGeometry=radialBoundary(radiusAt,{detail,name:name+'OuterFace'});
  const innerGeometry=radialBoundary(radiusAt,{detail,inset:thickness,name:name+'LumenFace'});
  const outer=new THREE.Mesh(outerGeometry,api.continuousMembrane(color,{roughness:.59,clearcoat:.045,side:THREE.DoubleSide}));
  const inner=new THREE.Mesh(innerGeometry,api.continuousMembrane(color,{roughness:.64,clearcoat:.02,side:THREE.BackSide}));
  for(const material of [outer.material,inner.material])applyWholeOrganelleFinish(material,{contrast:.10,relief:.0035,roughnessVariation:.08,scale:7.2,maxSlope:.14,seed:3.7});
  outer.name=name;inner.name=name+'LumenFace';
  outer.userData={shell:true,compartmentBoundary:true,limitingMembrane:true,singleMembrane:true};
  inner.userData={shell:true,compartmentBoundary:false,limitingMembrane:true,singleMembrane:true};
  // Two faces delimit one lipid bilayer; they are not two organelle membranes.
  group.add(outer,inner);ctx.shell.push(outer,inner);
  const bridge=createMembraneSectionBridge({outerGeometry,innerGeometry,material:api.continuousMembrane(color,{roughness:.82,clearcoat:0}),name:name+'ActualSectionThickness'});
  group.add(bridge.mesh);const onSection=ctx.onSection;ctx.onSection=(section,plane)=>{onSection?.(section,plane);bridge.update(section,plane);};
  ctx.radius=1.08;
  ctx.stats.normalizedBoundaryMaximumRadius=outerGeometry.userData.maximumRadius;
  ctx.stats.singleLimitingMembrane=true;
  ctx.metadata={...ctx.metadata,compartmentBoundary:{maximumRadius:outerGeometry.userData.maximumRadius,normalizationLimit:1.08,membraneCount:1,facesRepresentOneBilayer:true}};
  return {outer,inner};
}

function addInspectionDetails(ctx,details){
  ctx.metadata={...ctx.metadata,secretoryDetails:details};
}

export function buildSortingEndosome(group,detail,ctx,api){
  const {sphere,organicSphere,continuousMembrane,physical,beads}=api;
  addSingleMembrane(group,detail,ctx,api,{radiusAt:endosomeRadius,color:'#779eab',name:'ContinuousTubulovesicularSortingEndosome'});
  const random=randomSource(80329),accepted=[],vesicleCount=detail?5:4;
  // A sorting-stage representative: a few free ILVs, rather than filling every
  // endosome with the many ILVs typical of a later multivesicular compartment.
  for(let i=0;i<vesicleCount;i++){
    const radius=.064+i*.009;
    let point;
    for(let attempt=0;attempt<5000;attempt++){
      point=ballPoint(random,.42).multiply(V(1,.72,.75));
      if(sortingEndosomeField(point)>-radius-.05)continue;
      if(accepted.some(other=>point.distanceTo(other.point)<radius+other.radius+.035))continue;
      break;
    }
    if(!point||accepted.some(other=>point.distanceTo(other.point)<radius+other.radius+.035))throw Error('Endosomal ILV packing failed');
    accepted.push({point,radius});
    const material=continuousMembrane('#c7b3b2',{roughness:.61,clearcoat:.035});
    const outer=sphere(group,organicSphere(radius,detail?32:16,.007,i),material,point,V(1,1,1),'EndosomalIntralumenalVesicleMembrane');
    const inner=sphere(group,organicSphere(radius-.012,detail?32:16,.007,i),material,point,V(1,1,1),'IntralumenalVesicleInnerFace');
    outer.userData.shell=inner.userData.shell=true;ctx.shell.push(outer,inner);
  }
  const cargoPoints=[];
  for(let i=0;i<(detail?48:14);i++){
    let point;do{point=ballPoint(random,.39).multiply(V(1,.75,.7));}while(accepted.some(other=>point.distanceTo(other.point)<other.radius+.035));
    cargoPoints.push(point);
  }
  beads(group,cargoPoints,detail?.009:.015,physical('#cbb68f',{roughness:.66,bumpScale:.001}),{segments:detail?12:6,name:'SparseSortingEndosomeSolubleCargo'});
  ctx.anchors.inside=V(.03,-.08,.405);ctx.anchors.insideTarget=V(-.14,.16,-.17);
  ctx.anchors.sortingCamera=V(.08,.03,2.6);ctx.anchors.sortingTarget=V(.02,.15,0);
  ctx.anchors.tubuleCamera=V(1.12,.8,1.18);ctx.anchors.tubuleTarget=V(.58,.23,.02);
  ctx.anchors.endosomeLumenCamera=V(.08,.12,2.15);ctx.anchors.endosomeLumenTarget=V(0,0,-.05);
  ctx.stats.intralumenalVesicles=vesicleCount;
  ctx.stats.contentIdentity='Early sorting endosome: one connected vacuolar lumen with two membrane tubules and a few ILVs';
  ctx.stats.continuousSortingTubules=2;
  ctx.metadata.representativeStage='early-sorting-endosome';
  ctx.metadata.morphologyIsNotUnique=true;
  addInspectionDetails(ctx,[
    {id:'sorting-vacuole',title:'分选囊域',camera:'sortingCamera',target:'sortingTarget',section:.8,inside:true,description:'较宽的囊域保留可溶性货物；本例只放置少量腔内小囊泡。'},
    {id:'recycling-tubule',title:'连续分选小管',camera:'tubuleCamera',target:'tubuleTarget',section:0,description:'小管与囊域是同一层连续膜、同一个相通腔，不是贴在球面上的实心杆。'},
    {id:'endosome-lumen',title:'腔内小囊泡',camera:'endosomeLumenCamera',target:'endosomeLumenTarget',section:.8,inside:true,description:'游离小囊泡各有自己的膜。成熟内体常积累更多此类小囊泡，不能用这个早期分选示例代替所有阶段。'}
  ]);
  ctx.facts=['内体是内吞途径中的膜性区室；这里选择早期分选内体作为形态示例。','同一膜连续围成囊状分选域与细长小管；小管可参与膜成分和受体的分选回收。','晚期内体通常有更多腔内小囊泡。模型不把所有内体归成同一种满腔小球的结构。'];
  group.userData.representativeDomain={teachingOnly:true,representativeStage:ctx.metadata.representativeStage,morphologyIsNotUnique:true};
}

export function buildPhagosome(group,detail,ctx,api){
  const {sphere,physical,fragmentInstances}=api;
  addSingleMembrane(group,detail,ctx,api,{radiusAt:phagosomeRadius,color:'#c1a27b',name:'CargoConformingPhagosomeMembrane',thickness:.026});
  const random=randomSource(78403),cargo=new THREE.Group();cargo.name='EngulfedIrregularCellularParticle';group.add(cargo);
  const cargoRadius=d=>phagosomeRadius(d)*(.70+.055*Math.sin(8*d.x-5*d.y+3*d.z)+.035*Math.sin(15*d.x+7*d.z)*Math.cos(13*d.y-4*d.x));
  const geometry=radialBoundary(cargoRadius,{detail,name:'LargeEngulfedCargo'});
  const cargoMaterial=physical('#b7a28a',{roughness:.83,clearcoat:.06,bumpScale:.014});
  sphere(cargo,geometry,cargoMaterial,V(),V(1,1,1),'IrregularEngulfedCargoCore');
  const flakes=[];
  for(let i=0;i<(detail?120:34);i++){
    const d=ballPoint(random).normalize(),r=cargoRadius(d)*.994;
    flakes.push(d.multiplyScalar(r));
  }
  fragmentInstances(cargo,flakes,detail?.032:.042,cargoMaterial,random,detail).name='LayeredEngulfedParticleSurfaceFragments';
  const debris=[];
  for(let i=0;i<(detail?28:8);i++){
    const d=ballPoint(random).normalize(),r=phagosomeRadius(d)*(.82+random()*.05);
    debris.push(d.multiplyScalar(r));
  }
  fragmentInstances(group,debris,.018,cargoMaterial,random,detail).name='SparsePhagosomalDegradationFragments';
  ctx.anchors.inside=V(.64,.15,.29);ctx.anchors.insideTarget=V(.17,-.11,-.15);
  ctx.anchors.cargoCamera=V(.36,.18,2.9);ctx.anchors.cargoTarget=V(0,0,-.05);
  ctx.anchors.phagosomeLumenCamera=V(1.5,.25,1.9);ctx.anchors.phagosomeLumenTarget=V(.52,0,0);
  ctx.stats.contentIdentity='One large irregular engulfed cellular particle, a surrounding lumen and sparse degradation fragments';
  ctx.metadata.representativeStage='large-particle-phagosome';
  ctx.metadata.morphologyIsNotUnique=true;
  addInspectionDetails(ctx,[
    {id:'engulfed-cargo',title:'被包裹的大颗粒',camera:'cargoCamera',target:'cargoTarget',section:.82,inside:true,description:'大块摄取物占据主要空间；此处选用不规则细胞性颗粒，外形不是吞噬体固定的内部构件。'},
    {id:'phagosome-lumen',title:'膜与货物间的腔隙',camera:'phagosomeLumenCamera',target:'phagosomeLumenTarget',section:.8,inside:true,description:'包裹膜与货物之间有连续腔隙。腔隙宽度和内容随货物与成熟阶段变化。'}
  ]);
  ctx.facts=['吞噬体是吞噬过程中形成的单膜区室，可视为动态膜性细胞器。','轮廓受被包裹的大颗粒影响。膜围成的腔与货物分开建模，可观察包裹关系。','本例表示大颗粒吞噬体；酸化、与溶酶体融合及消化会继续改变其内容物和形态。'];
  group.userData.representativeDomain={teachingOnly:true,representativeStage:ctx.metadata.representativeStage,morphologyIsNotUnique:true};
}

export function buildPeroxisome(group,detail,ctx,api){
  const {sphere,physical,proteinShape,beads}=api;
  addSingleMembrane(group,detail,ctx,api,{radiusAt:peroxisomeRadius,color:'#95aa83',name:'OblongPeroxisomalSingleMembrane',thickness:.022});
  const random=randomSource(79217),matrixPoints=[],scales=[];
  for(let i=0;i<(detail?540:120);i++){
    const point=ballPoint(random,.91).multiply(V(.65,.93,.59));
    matrixPoints.push(point);scales.push(V(.7+random()*.5,.7+random()*.5,.7+random()*.5));
  }
  beads(group,matrixPoints,detail?.012:.019,physical('#a3a87d',{roughness:.81,clearcoat:0,bumpScale:.001}),{segments:detail?8:6,scales,name:'DistributedFinePeroxisomalEnzymeMatrix'});
  const enzymeExamples=addPeroxisomalEnzymeTraces(group,{detail});
  enzymeExamples.forEach(item=>ctx.anchors[item.id+'Trace']=item.anchor);
  const matrixMesh=group.getObjectByName('DistributedFinePeroxisomalEnzymeMatrix'),point=V(),transform=new THREE.Matrix4();
  let nearest=Infinity,matrixIndex=0;for(let i=0;i<matrixMesh.count;i++){matrixMesh.getMatrixAt(i,transform);point.setFromMatrixPosition(transform);const d=point.distanceToSquared(V(-.04,-.24,.16));if(d<nearest){nearest=d;matrixIndex=i;}}
  matrixMesh.getMatrixAt(matrixIndex,transform);ctx.anchors.peroxisomeMatrix=V().fromBufferAttribute(matrixMesh.geometry.attributes.position,0).applyMatrix4(transform);
  const wall=group.getObjectByName('OblongPeroxisomalSingleMembrane'),vertices=wall.geometry.attributes.position;nearest=Infinity;
  for(let i=0;i<vertices.count;i++){point.fromBufferAttribute(vertices,i);const d=point.distanceToSquared(V(-.48,-.37,-.01));if(d<nearest){nearest=d;ctx.anchors.peroxisomeWall=point.clone();}}
  ctx.anchors.inside=V(.08,.1,.49);ctx.anchors.insideTarget=V(0,0,-.21);
  ctx.anchors.matrixCamera=V(.38,.25,2.6);ctx.anchors.matrixTarget=V(0,.03,-.06);
  ctx.anchors.peroxisomeMembraneCamera=V(.8,.65,2.2);ctx.anchors.peroxisomeMembraneTarget=V(0,0,0);
  ctx.stats.contentIdentity='Finely granular enzyme matrix distributed through an oblong single-membrane compartment';
  ctx.stats.universalCrystalCore=false;
  ctx.metadata.representativeStage='ordinary-matrix-containing-peroxisome';
  ctx.metadata.morphologyIsNotUnique=true;
  ctx.metadata.enzymeExamples=enzymeExamples.map(item=>({id:item.id,...item.source,displayRadius:.17,independentlyEnlarged:true,ligandsShown:false}));
  ctx.metadata.contentLabels=[
    {id:'catalase',anchor:'catalaseTrace',title:'过氧化氢酶 · CAT',description:'分解 H₂O₂，生成水和氧。人 1DGF 四聚体坐标骨架，放大展示。',color:'#4c8586'},
    {id:'acox1',anchor:'acox1Trace',title:'脂酰辅酶 A 氧化酶 · ACOX1',description:'催化脂肪酸 β 氧化第一步，并生成 H₂O₂。人 7Q86 二聚体骨架。',color:'#ad8248'},
    {id:'enzyme-matrix',anchor:'peroxisomeMatrix',title:'酶基质 · 分布式背景',description:'细点概括其余酶性内容；不能逐点指认为某一种蛋白。',color:'#879766'},
    {id:'peroxisome-wall',anchor:'peroxisomeWall',title:'单个限制膜',description:'一层脂质双层围成基质空间，分隔胞质；不是线粒体式嵴。',color:'#779366'}
  ];
  ctx.metadata.contentLesson={title:'氧化与过氧化氢处理',note:'两种酶独立放大，以公开晶体结构的 Cα 骨架帮助辨认；位置、数量与大小并非原位测量。辅因子未显示。'};
  addInspectionDetails(ctx,[
    {id:'peroxisomal-matrix',title:'酶基质与两种酶实例',camera:'matrixCamera',target:'matrixTarget',section:.82,inside:true,description:'细点概括酶性背景；蓝绿的 CAT 和棕金的 ACOX1 是公开人蛋白坐标派生的放大骨架实例，分别参与 H₂O₂ 处理与脂肪酸氧化。'},
    {id:'peroxisomal-membrane',title:'单层界膜',camera:'peroxisomeMembraneCamera',target:'peroxisomeMembraneTarget',section:.7,description:'一个脂质双层包围酶基质；不含线粒体式嵴，也不设置普遍存在的中央晶体。'}
  ]);
  ctx.facts=['过氧化物酶体是单膜细胞器，参与脂肪酸等氧化代谢及过氧化氢处理。','本例采用椭球轮廓和分布式细颗粒酶基质；实际形状可包括球形或延长形。','没有把其他物种或组织的尿酸氧化酶晶核套用于人巨噬细胞；也不包含 DNA 或线粒体嵴。'];
  ctx.metadata.guide={title:'过氧化物酶体 · 酶基质',function:'酶基质进行脂肪酸等氧化代谢；ACOX1 反应产生过氧化氢，CAT 可将其分解为水与氧。',location:'胞质中的单膜细胞器；膜内为酶性基质。',partners:['胞质：供应导入蛋白与代谢物','线粒体及其他代谢途径：共同参与细胞脂质代谢'],features:[
   {name:'单个限制膜',function:'围成酶性基质并分隔胞质；不是线粒体式嵴。',visible:true,views:['ordinary'],parts:['peroxisome']},
   {name:'CAT 与 ACOX1 坐标骨架实例',function:'CAT 分解过氧化氢；ACOX1 参与脂肪酸 β 氧化的第一步。',visible:true,views:['ordinary'],parts:['peroxisome'],note:'来自人纯化蛋白晶体结构 1DGF / 7Q86；独立放大，不是该细胞的原位分布或原子表面。'},
   {name:'其余分布式酶性基质',function:'细点只概括剩余酶性内容，不逐点指认分子。',visible:true,views:['ordinary'],parts:['peroxisome']}
  ],note:ctx.metadata.contentLesson.note,sources:enzymeExamples.map(item=>({...item.source})).concat([{title:'Geric et al., Immunology 2018 · 小鼠 BMDM 过氧化物酶体 β 氧化',url:'https://pubmed.ncbi.nlm.nih.gov/28940384/',doi:'10.1111/imm.12844'}])};
  group.userData.representativeDomain={teachingOnly:true,representativeStage:ctx.metadata.representativeStage,morphologyIsNotUnique:true};
}
