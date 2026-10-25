import * as THREE from 'three';
import {mergeGeometries} from 'three/addons/utils/BufferGeometryUtils.js';
import {radialBoundary,endosomeRadius,sortingEndosomeField,phagosomeRadius,phagosomeCargoRadius,lysosomeRadius} from './compartment-boundaries.js';
import {applyWholeOrganelleFinish} from './whole-organelle-finish.js';
import {createMembraneSectionBridge} from './compartment-section-rim.js';

// Selected teaching morphologies, informed by EM/CLEM relationships. These are
// not imported segmentations, a molecular classifier, or measured macrophage EM.
const V=(x=0,y=0,z=0)=>new THREE.Vector3(x,y,z),TAU=Math.PI*2;
const SOURCES={
  sorting:{title:'Franke et al., Traffic 2019',url:'https://pubmed.ncbi.nlm.nih.gov/31206952/',doi:'10.1111/tra.12671',specimen:'HeLa cells; CLEM and electron tomography; not macrophage segmentation'},
  phagosome:{title:'Ramachandra et al., J Immunol Methods 1998',url:'https://pubmed.ncbi.nlm.nih.gov/9671125/',doi:'10.1016/S0022-1759(98)00017-9',specimen:'Mouse peritoneal macrophages with latex-bead phagosomes'},
  maturation:{title:'Levin-Konigsberg et al., Nature Cell Biology 2019',url:'https://pubmed.ncbi.nlm.nih.gov/31570833/',doi:'10.1038/s41556-019-0394-2',specimen:'RAW264.7 mouse macrophages, IgG-coated sheep erythrocytes; late stages after lysosome fusion'},
  cryoET:{title:'McVeigh et al., Nature Communications 2025',url:'https://pubmed.ncbi.nlm.nih.gov/41107240/',doi:'10.1038/s41467-025-64314-0',specimen:'HEK293 enriched endolysosomal compartments and in situ controls; not human macrophage EM'},
  lysosomeCycle:{title:'Bright et al., Current Biology 2016',url:'https://pubmed.ncbi.nlm.nih.gov/27498570/',doi:'10.1016/j.cub.2016.06.046',specimen:'Primarily NRK cells; active endolysosome and terminal storage lysosome distinction'}
};

function tissueMaterial(color,{roughness=.74,side=THREE.FrontSide,vertexColors=false,role='membrane',seed=1,contrast=.16,relief=.0045}={}){
  const material=new THREE.MeshStandardMaterial({color,roughness,metalness:0,envMapIntensity:.36,side,vertexColors,transparent:false,opacity:1,depthWrite:true});
  material.userData.atlasMaterialRole=role;
  material.userData.compartmentTissue={teachingOnly:true,opaque:true,measuredOptics:false,reliefIsShadingOnly:true};
  if(role==='membrane')material.userData.continuousSurfaceV1=true;
  applyWholeOrganelleFinish(material,{contrast,relief,roughnessVariation:.10,scale:11.6,maxSlope:.19,seed,softScatter:.025});
  return material;
}

function surface(parent,name,geometry,material,position=V()){
  const mesh=new THREE.Mesh(geometry,material);mesh.name=name;mesh.position.copy(position);parent.add(mesh);return mesh;
}

function addSingleMembrane(group,detail,ctx,{radiusAt,color,name,thickness=.026}){
  const tubular=radiusAt===endosomeRadius;
  const widthSegments=detail?(tubular?192:112):(tubular?96:56),heightSegments=detail?(tubular?112:72):(tubular?64:36);
  const outerGeometry=radialBoundary(radiusAt,{detail,name:name+'OuterFace',widthSegments,heightSegments});
  const innerGeometry=radialBoundary(radiusAt,{detail,inset:thickness,name:name+'LumenFace',widthSegments,heightSegments});
  const outer=surface(group,name,outerGeometry,tissueMaterial(color,{roughness:.69,seed:3.1,contrast:.18}));
  const inner=surface(group,name+'LumenFace',innerGeometry,tissueMaterial(color,{roughness:.77,side:THREE.BackSide,seed:4.8,contrast:.22,relief:.0055}));
  outer.userData={shell:true,compartmentBoundary:true,limitingMembrane:true,singleMembrane:true};
  inner.userData={shell:true,compartmentBoundary:false,limitingMembrane:true,singleMembrane:true};
  const bridge=createMembraneSectionBridge({outerGeometry,innerGeometry,material:tissueMaterial(color,{roughness:.81,seed:4.2,contrast:.14,relief:.0025}),name:name+'ActualSectionThickness'});
  group.add(bridge.mesh);
  const previousOnSection=ctx.onSection;ctx.onSection=(section,plane)=>{previousOnSection?.(section,plane);bridge.update(section,plane);};
  ctx.shell.push(outer,inner);ctx.radius=1.08;
  ctx.stats.normalizedBoundaryMaximumRadius=outerGeometry.userData.maximumRadius;
  ctx.stats.singleLimitingMembrane=true;
  ctx.metadata={...ctx.metadata,compartmentBoundary:{maximumRadius:outerGeometry.userData.maximumRadius,normalizationLimit:1.08,membraneCount:1,facesRepresentOneBilayer:true}};
  return {outer,inner};
}

function shadeGeometry(geometry,dark,light,seed=0){
  const p=geometry.attributes.position,a=new Float32Array(p.count*3),lo=new THREE.Color(dark),hi=new THREE.Color(light),c=new THREE.Color();
  for(let i=0;i<p.count;i++){
    const x=p.getX(i),y=p.getY(i),z=p.getZ(i);
    const broad=.5+.25*Math.sin(x*8.2+y*4.6+seed)*Math.cos(y*7.1-z*5.3)+.15*Math.sin(z*12.1-x*3.4+seed*.31);
    c.copy(lo).lerp(hi,THREE.MathUtils.clamp(broad,0,1));a[i*3]=c.r;a[i*3+1]=c.g;a[i*3+2]=c.b;
  }
  geometry.setAttribute('color',new THREE.BufferAttribute(a,3));return geometry;
}

function irregularMass({axes=V(1,1,1),detail=true,seed=1,relief=.06,dark='#75625d',light='#b6a18e'}={}){
  const geometry=new THREE.SphereGeometry(1,detail?52:24,detail?36:16),p=geometry.attributes.position;
  for(let i=0;i<p.count;i++){
    const x=p.getX(i),y=p.getY(i),z=p.getZ(i);
    const shape=1+relief*(.57*Math.sin(5*x+3*y-z+seed)*Math.cos(4*y-5*z)+.28*Math.sin(10*z-7*x+seed));
    p.setXYZ(i,x*axes.x*shape,y*axes.y*shape,z*axes.z*shape);
  }
  geometry.computeVertexNormals();return shadeGeometry(geometry,dark,light,seed);
}

// A finite, closed, curved lens of unresolved material, occupying only part of
// the posterior wall region. Its outer face follows the compartment curvature;
// it is neither a free round bead nor a second limiting membrane.
function conformalResidual(detail,variant){
  const geometry=new THREE.SphereGeometry(1,detail?64:28,detail?40:18),p=geometry.attributes.position;
  const axis=V(-.70,-.30,-.64).normalize(),u=V(0,1,0).cross(axis).normalize(),v=axis.clone().cross(u).normalize();
  const extent=variant===1?1.07:variant>=2?.78:1;
  for(let i=0;i<p.count;i++){
    const x=p.getX(i),y=p.getY(i),z=p.getZ(i),a=x*.72*extent,b=y*.56*extent;
    const direction=axis.clone().addScaledVector(u,Math.tan(a)).addScaledVector(v,Math.tan(b)).normalize();
    const radial=.62+z*(variant===1?.13:variant>=2?.075:.11)+.015*Math.sin(6*x+3*y)*Math.cos(4*y-2*z);
    p.setXYZ(i,direction.x*radial,direction.y*radial,direction.z*radial);
  }
  geometry.computeVertexNormals();geometry.userData={conformalPartialResidual:true,notMembrane:true,unresolvedMaterial:true};
  return shadeGeometry(geometry,'#62565c','#a38b86',5);
}

function massGeometry(definitions,detail){
  const geometries=definitions.map((definition,i)=>{
    const g=irregularMass({detail,seed:5+i*2.1,...definition});g.translate(...definition.center);return g;
  });
  const geometry=mergeGeometries(geometries,false);geometries.forEach(g=>g.dispose());
  return geometry;
}

function mergedMasses(parent,name,definitions,detail,material){
  const geometry=massGeometry(definitions,detail);
  const mesh=surface(parent,name,geometry,material);mesh.userData.contentDomain='heterogeneous-unresolved-residual-material';return mesh;
}

// A thin SOLID ribbon curls only partially, with a finite pitch separating turns.
// Its two faces, lateral edges and both ends are closed; it is luminal material,
// not an extra limiting membrane or a universal central onion/crystal.
function curledMembrane({detail=true,radius=.055,pitch=.057,turns=1.45,width=.052,thickness=.004,center=V(),rotation=V()}={}){
  const n=detail?100:44,p=[],ix=[],uv=[];
  for(let i=0;i<=n;i++){
    const u=i/n,angle=u*TAU*turns,r=radius+pitch*angle/TAU+.007*Math.sin(angle*2.3);
    const radial=V(Math.cos(angle),0,Math.sin(angle)),cross=V(0,1,0),c=radial.clone().multiplyScalar(r);c.y=.024*Math.sin(angle*.72)+.012*Math.sin(angle*1.9+.7);
    const halfWidth=width*(.60+.23*Math.sin(angle+1))*(.24+.76*Math.sin(Math.PI*u)**.42);
    for(const [side,face]of[[-1,-1],[1,-1],[1,1],[-1,1]]){
      const edge=side*halfWidth*(.88+.12*Math.sin(angle*1.7+side));
      const q=c.clone().addScaledVector(cross,edge).addScaledVector(radial,face*thickness+.004*Math.sin(angle*2.1+side));
      p.push(q.x,q.y,q.z);uv.push(u,(side+1)*.5);
    }
  }
  for(let i=0;i<n;i++)for(let j=0;j<4;j++){
    const a=i*4+j,b=i*4+(j+1)%4,c=(i+1)*4+j,d=(i+1)*4+(j+1)%4;ix.push(a,c,b,b,c,d);
  }
  ix.push(0,1,2,0,2,3,n*4,n*4+2,n*4+1,n*4,n*4+3,n*4+2);
  const g=new THREE.BufferGeometry();g.setAttribute('position',new THREE.Float32BufferAttribute(p,3));g.setAttribute('uv',new THREE.Float32BufferAttribute(uv,2));g.setIndex(ix);
  const e=new THREE.Euler(rotation.x,rotation.y,rotation.z);g.applyMatrix4(new THREE.Matrix4().makeRotationFromEuler(e));g.translate(center.x,center.y,center.z);g.computeVertexNormals();
  g.userData={closedLuminalMembraneRemnant:true,partialCurl:true,notLimitingMembrane:true,thicknessIsDisplayScale:true};return g;
}

function metadata(group,ctx,stage,description,sources){
  ctx.metadata={...ctx.metadata,representativeStage:stage,morphologyIsNotUnique:true,contentInterpretation:description,sources,measuredGeometry:false};
  group.userData.representativeDomain={teachingOnly:true,representativeStage:stage,contentIdentity:description,morphologyIsNotUnique:true,measuredGeometry:false};
}

function modelGuide(ctx,id,guide){
  ctx.metadata.guide={...guide,features:guide.features.map(feature=>({views:['ordinary'],parts:[id],...feature})),sources:ctx.metadata.sources.map(source=>({...source}))};
}

function contentLandmark(mesh,near,instance=null){
  const p=mesh.geometry.attributes.position,transform=new THREE.Matrix4(),q=V(),best=V();let distance=Infinity;
  if(instance!==null)mesh.getMatrixAt(instance,transform);else transform.compose(mesh.position,mesh.quaternion,mesh.scale);
  for(let i=0;i<p.count;i++){q.fromBufferAttribute(p,i).applyMatrix4(transform);const d=q.distanceToSquared(near);if(d<distance){distance=d;best.copy(q);}}
  return best;
}

// Shared low/high LOD content relationships for the whole-cell representatives
// and the detail view. Coordinates stay well within a unit limiting membrane.
export function createDegradativeLumenGeometry({detail=true,variant=0}={}){
  const definitions=[
    {conformal:true},
    {center:[.02,.29,-.24],axes:V(.13,.11,.14),relief:.13,dark:'#79635f',light:'#b09a84'},
    {center:[.21,-.28,-.28],axes:V(.10,.09,.12),relief:.17,dark:'#6e6562',light:'#a3947f'}
  ];
  if(variant>=2)definitions.splice(2,1);
  const curlDefinitions=[
    {detail,center:V(.27,.005,-.10),rotation:V(.16,.25,-.12),radius:.052,pitch:.060,turns:1.55,width:.070},
    {detail,center:V(-.04,.15,.045),rotation:V(.72,.48,-.2),radius:.033,pitch:.043,turns:1.15,width:.042}
  ];
  if(variant===1)curlDefinitions.splice(1,1);
  const placements=[];
  const residualPieces=definitions.map((definition,i)=>{
    const g=i===0?conformalResidual(detail,variant):irregularMass({detail,seed:5+i*2.1,...definition}),p=g.attributes.position;let envelope=0;
    for(let v=0;v<p.count;v++)envelope=Math.max(envelope,Math.hypot(p.getX(v),p.getY(v),p.getZ(v)));
    const point=i===0?V():V(...definition.center);placements.push({point,envelope,kind:i===0?'conformal-partial-residual-domain':'dense-residual-domain'});g.translate(point.x,point.y,point.z);return g;
  });
  const curls=curlDefinitions.map(definition=>{
    const g=curledMembrane(definition),p=g.attributes.position;let envelope=0;
    for(let v=0;v<p.count;v++)envelope=Math.max(envelope,V().fromBufferAttribute(p,v).distanceTo(definition.center));
    placements.push({point:definition.center.clone(),envelope,kind:'partial-membrane-remnant'});return g;
  });
  const residueGeometry=mergeGeometries(residualPieces,false),remnantGeometry=mergeGeometries(curls,false);
  residualPieces.forEach(g=>g.dispose());curls.forEach(g=>g.dispose());
  residueGeometry.userData={heterogeneousDenseDomains:definitions.length,conformalPartialDomains:1,teachingOnly:true};
  remnantGeometry.userData={closedLuminalMembraneRemnant:true,partialCurl:true,notLimitingMembrane:true,components:curlDefinitions.length};
  return {residueGeometry,remnantGeometry,placements,stats:{denseResidualDomains:definitions.length,conformalPartialDomains:1,partialLuminalMembraneCurls:curlDefinitions.length,hydrolases:0},sources:[SOURCES.cryoET,SOURCES.lysosomeCycle]};
}

export function buildUltrastructureSortingEndosome(group,detail,ctx){
  addSingleMembrane(group,detail,ctx,{radiusAt:endosomeRadius,color:'#71939e',name:'ContinuousTubulovesicularSortingEndosome'});
  const ilvMaterial=tissueMaterial('#b19fa8',{roughness:.77,seed:6.2,contrast:.22}),ilvInner=tissueMaterial('#887c86',{roughness:.82,side:THREE.BackSide,seed:6.2,contrast:.18});
  const ilvs=[{center:V(-.20,-.12,-.12),radius:.077},{center:V(.13,.09,-.16),radius:.094},{center:V(-.10,.22,.005),radius:.063}];
  const unit=new THREE.SphereGeometry(1,detail?40:20,detail?28:14),unitInner=unit.clone();
  for(let i=0;i<ilvs.length;i++){
    const {center,radius}=ilvs[i],outer=surface(group,'EndosomalIntralumenalVesicleMembrane',unit,ilvMaterial,center),inner=surface(group,'IntralumenalVesicleInnerFace',unitInner,ilvInner,center);
    outer.scale.set(radius,radius*.91,radius*1.06);inner.scale.copy(outer.scale).multiplyScalar(1-.012/radius);
    for(const mesh of [outer,inner]){mesh.userData.shell=true;mesh.userData.intraluminalMembrane=true;mesh.userData.contentDomain='intralumenal-vesicle';ctx.shell.push(mesh);}
  }
  const cargoMaterial=tissueMaterial('#ffffff',{roughness:.86,vertexColors:true,role:'cargo',seed:8.2,contrast:.24});
  mergedMasses(group,'SortingVacuolarCargoEnrichment',[
    {center:[-.29,.035,-.20],axes:V(.095,.065,.061),dark:'#8a7768',light:'#b4a28c'},
    {center:[.055,-.23,-.12],axes:V(.060,.040,.045),dark:'#8e8171',light:'#b6a991'}
  ],detail,cargoMaterial);
  const domainGeometry=new THREE.SphereGeometry(1,detail?16:10,detail?10:6),domains=new THREE.InstancedMesh(domainGeometry,tissueMaterial('#9d8d82',{roughness:.84,role:'cargo',seed:9.3}),6),temp=new THREE.Object3D();
  domains.name='MembraneAssociatedSortingDomain_NotNamedMolecules';
  for(let i=0;i<6;i++){
    const direction=V(.82+.017*i,.18+.035*i,-.12+.012*i).normalize(),r=endosomeRadius(direction,.054);
    temp.position.copy(direction).multiplyScalar(r);temp.quaternion.setFromUnitVectors(V(0,0,1),direction);temp.scale.set(.019,.030,.007);temp.updateMatrix();domains.setMatrixAt(i,temp.matrix);
  }
  domains.userData.contentDomain='membrane-associated-sorting-cargo-symbol';group.add(domains);
  ctx.anchors.inside=V(.03,-.08,.35);ctx.anchors.insideTarget=V(-.14,.13,-.17);
  ctx.anchors.sortingCamera=V(.08,.03,2.6);ctx.anchors.sortingTarget=V(.02,.15,0);
  ctx.anchors.tubuleCamera=V(1.12,.8,1.18);ctx.anchors.tubuleTarget=V(.58,.23,.02);
  ctx.anchors.endosomeLumenCamera=V(.08,.12,2.15);ctx.anchors.endosomeLumenTarget=V(0,0,-.05);
  Object.assign(ctx.stats,{intralumenalVesicles:3,continuousSortingTubules:2,contentIdentity:'Early sorting endosome: a connected vacuole, unequal narrow sorting tubules, three individually membraned ILVs and local cargo domains',unidentifiedSortingDomainSymbols:6});
  metadata(group,ctx,'early-sorting-endosome','Selected vacuolar/tubular early sorting domain, not a universal endosome or named Rab5 reconstruction',[SOURCES.sorting]);
  ctx.metadata.secretoryDetails=[
    {id:'sorting-vacuole',title:'分选囊域',camera:'sortingCamera',target:'sortingTarget',section:.8,inside:true,description:'较宽的囊域与细颈小管共用连续膜和同一腔。内容物只作局部富集，不用满腔白球代替分选结构。'},
    {id:'recycling-tubule',title:'连续分选小管',camera:'tubuleCamera',target:'tubuleTarget',section:0,description:'两条长短、粗细不等的小管与囊域连续。细颈处没有封口圆盘；少量膜关联符号不指认某个 Rab 或受体。'},
    {id:'endosome-lumen',title:'腔内小囊泡',camera:'endosomeLumenCamera',target:'endosomeLumenTarget',section:.8,inside:true,description:'三个小囊泡有各自的膜与内部空间，大小略有差异。这里选择早期分选形态，不能代表所有晚期内体。'}
  ];
  ctx.facts=['本例是早期分选内体的代表形态；连续囊域与较细小管共用一个限制膜和相通腔。','少量腔内小囊泡各有自己的膜。局部货物富集和膜关联位置仅为教学示意，不给无标记斑点指定分子身份。','形态关系参考 HeLa 的 CLEM/电子断层研究；尺寸、颜色与颗粒数不是人巨噬细胞原位测量。'];
  modelGuide(ctx,'endosome',{
    title:'早期分选内体 · 连续管囊域',
    function:'在膜围成的腔和膜域中分选内吞货物，使部分成分进入后续降解或回收途径。',
    location:'胞质中的单膜内吞区室；本例选取相通的囊域与分选小管。',
    partners:['细胞膜：提供内吞货物并接收回收成分','后续内体及溶酶体：接续处理待降解货物'],
    features:[
      {name:'连续囊域与小管',function:'较宽囊域与两条不对称小管共用一个限制膜和相通腔，展示分选区室的不同膜域。',visible:true,location:'同一管囊状区室的外周。',note:'内外两面表示同一脂质双层膜；不是多个球体接上封口管。'},
      {name:'少量腔内小囊泡',function:'展示限制膜以内、各自具有包围膜的小囊泡。',visible:true,location:'囊域腔内。',note:'本例数量与尺寸经展示调整；早期内体并非都具有相同囊泡数。'},
      {name:'局部货物富集与膜关联符号',function:'说明货物在囊域与膜域中的分布可不均一。',visible:true,location:'囊域腔内及小管根部附近。',note:'这些未作分子鉴定的形体不能指认为 Rab5、受体或特定酶。'}
    ],
    note:'所选早期分选形态参考 HeLa 的 CLEM/电子断层研究，并非人巨噬细胞原位网格。模型不显示可逐个指认的水解酶，也不代表所有成熟阶段的内体。'
  });
  const ilv=group.getObjectsByProperty('name','EndosomalIntralumenalVesicleMembrane')[1];
  ctx.anchors.ilvContent=contentLandmark(ilv,V(.13,.09,-.06));
  ctx.anchors.endosomeCargo=contentLandmark(group.getObjectByName('SortingVacuolarCargoEnrichment'),V(-.29,.035,-.14));
  ctx.anchors.sortingTubuleWall=contentLandmark(group.getObjectByName('ContinuousTubulovesicularSortingEndosome'),V(.75,.45,.02));
  ctx.metadata.contentLabels=[
    {id:'ilv',anchor:'ilvContent',title:'腔内小囊泡',description:'各自有膜；可将膜关联货物送入内腔，接续降解途径。',color:'#9d8294'},
    {id:'sorting-cargo',anchor:'endosomeCargo',title:'内吞货物 · 局部富集',description:'等待分选的内容示意；未用标记实验鉴定具体分子。',color:'#9a8064'},
    {id:'sorting-tubule',anchor:'sortingTubuleWall',title:'连续分选小管',description:'与囊域共用膜和腔；参与受体等膜成分的分选与回收。',color:'#608b99'}
  ];
  ctx.metadata.contentLesson={title:'分清“囊泡、货物、分选小管”',note:'本例选取早期分选形态；无标记的内容域不逐点指定为某种受体或 Rab 蛋白。'};
}

export function buildUltrastructurePhagosome(group,detail,ctx){
  addSingleMembrane(group,detail,ctx,{radiusAt:phagosomeRadius,color:'#ac9272',name:'CargoConformingPhagosomeMembrane'});
  const cargo=new THREE.Group();cargo.name='EngulfedIrregularCellularParticle';group.add(cargo);
  const geometry=radialBoundary(phagosomeCargoRadius,{detail,name:'LargeEngulfedCargo',widthSegments:detail?112:56,heightSegments:detail?72:36});
  shadeGeometry(geometry,'#7b6e5d','#bbae97',3.2);
  const cargoMaterial=tissueMaterial('#ffffff',{roughness:.88,vertexColors:true,role:'cargo',seed:8.8,contrast:.27,relief:.008});
  const core=surface(cargo,'IrregularEngulfedCargoCore',geometry,cargoMaterial);core.userData.contentDomain='one-large-partly-processed-cellular-cargo';
  const shardGeometry=irregularMass({detail:false,axes:V(.024,.008,.015),relief:.17,dark:'#81725e',light:'#b8a68b'});
  const debris=new THREE.InstancedMesh(shardGeometry,cargoMaterial,8),temp=new THREE.Object3D();debris.name='SparsePhagosomalDegradationFragments';
  for(let i=0;i<8;i++){
    const angle=i*2.399963,direction=V(Math.cos(angle)*.78,Math.sin(angle)*.65,-.44+.1*(i%3)).normalize();
    if(i===0)direction.set(.88,-.18,.43).normalize();
    if(i===1)direction.set(-.68,.5,.48).normalize();
    const radial=(phagosomeRadius(direction,.026)+phagosomeCargoRadius(direction))*.5;
    temp.position.copy(direction).multiplyScalar(radial);temp.rotation.set(i*.87,i*.71,i*.39);temp.scale.setScalar(.78+.05*(i%4));temp.updateMatrix();debris.setMatrixAt(i,temp.matrix);
  }
  debris.userData.contentDomain='few-separated-luminal-cargo-fragments';group.add(debris);
  const lumenDirection=V(.86,.18,.38).normalize();
  ctx.anchors.inside=lumenDirection.clone().multiplyScalar((phagosomeRadius(lumenDirection,.026)+phagosomeCargoRadius(lumenDirection))*.5);
  ctx.anchors.insideTarget=V(.40,-.04,-.16);
  ctx.anchors.cargoCamera=V(.36,.18,2.9);ctx.anchors.cargoTarget=V(0,0,-.05);
  ctx.anchors.phagosomeLumenCamera=V(1.5,.25,1.9);ctx.anchors.phagosomeLumenTarget=V(.57,0,0);
  Object.assign(ctx.stats,{contentIdentity:'One contiguous heterogeneous cellular cargo, direction-dependent lumen and eight small separate residual fragments',largeCargoBodies:1,freeResidualFragments:8,cargoConformingBoundary:true});
  metadata(group,ctx,'large-cargo-containing-maturing-phagosome','Selected partly processed cellular cargo; no universal core and no claim that degradation is intrinsic to a newly closed phagosome',[SOURCES.phagosome,SOURCES.maturation]);
  ctx.metadata.secretoryDetails=[
    {id:'engulfed-cargo',title:'被包裹的大颗粒',camera:'cargoCamera',target:'cargoTarget',section:.82,inside:true,description:'一个连贯的大块细胞性货物占主导，局部凹陷与较暗区域表现内容异质性。它不是吞噬体固定拥有的内部器官。'},
    {id:'phagosome-lumen',title:'膜与货物间的腔隙',camera:'phagosomeLumenCamera',target:'phagosomeLumenTarget',section:.8,inside:true,description:'限制膜顺应货物的总体轮廓，各方向留有宽窄不同的真实腔隙。少量分离残片表示所选成熟阶段，不是全表面铺满小颗粒。'}
  ];
  ctx.facts=['吞噬体的单个限制膜包裹被摄取物，膜轮廓与腔隙随货物和成熟状态改变；不是固定球壳加固定核心。','这里选择一个含部分处理细胞性货物的成熟中代表，显示连贯主体、局部缺损及少量分离残片。','巨噬细胞 EM 支持紧贴货物与较宽腔隙两种状态；明显消化重塑在所引研究中发生于溶酶体融合后，不能泛称新生吞噬体固有结构。'];
  modelGuide(ctx,'phagosome',{
    title:'成熟中的大颗粒吞噬体',
    function:'隔离被摄取的大颗粒，并在与内体及溶酶体交流、融合的成熟过程中处理货物。',
    location:'胞质内、被摄取物周围的一层脂质双层膜区室。',
    partners:['细胞膜：吞噬闭合时形成区室','内体与溶酶体：参与成熟、膜交换和消化能力的获得'],
    features:[
      {name:'适应货物轮廓的单个限制膜',function:'将吞入物与胞质分隔，膜与货物间保留宽窄不同的腔隙。',visible:true,location:'大块货物外周。',note:'两张渲染表面表示同一脂质双层膜的两面。'},
      {name:'连贯的大块细胞性货物',function:'显示一个占主导、具有局部缺损的被摄取物，帮助区分区室和其内容物。',visible:true,location:'限制膜围成的腔内。',note:'货物不是吞噬体固定拥有的核心；此处形态为教学选择。'},
      {name:'少量分离残片',function:'表示所选部分处理状态下从大块货物分离的材料。',visible:true,location:'货物与限制膜之间的腔隙。',note:'消化重塑的研究证据来自溶酶体融合后的晚期过程，不能当作所有新生吞噬体的固有结构。'}
    ],
    note:'膜—货物关系参考小鼠巨噬细胞电镜研究，处理阶段参考 RAW264.7 摄取 IgG 包被羊红细胞的研究。这里没有导入实验分割网格，也没有显示具体水解酶形体。'
  });
  ctx.anchors.phagosomeCargoContent=contentLandmark(core,V(.15,.20,.44));
  ctx.anchors.phagosomeFragment=contentLandmark(debris,V(.65,-.1,.35),0);
  ctx.anchors.phagosomeWall=contentLandmark(group.getObjectByName('CargoConformingPhagosomeMembrane'),V(-.54,-.55,-.04));
  ctx.metadata.contentLabels=[
    {id:'engulfed-material',anchor:'phagosomeCargoContent',title:'被吞入的细胞性大颗粒',description:'待处理的外来货物，局部缺损表示所选消化阶段；不是细胞器核心。',color:'#9b8167'},
    {id:'separated-fragment',anchor:'phagosomeFragment',title:'少量分离的货物残片',description:'表示部分处理后的材料；这些碎片不是水解酶。',color:'#a18b72'},
    {id:'phagosome-boundary',anchor:'phagosomeWall',title:'吞噬体限制膜',description:'将货物和腔液与胞质隔开；成熟中与内体、溶酶体交换组分。',color:'#9a8b6c'}
  ];
  ctx.metadata.contentLesson={title:'吞噬体不是“一袋酶颗粒”',note:'图中只选择一个正在处理的细胞性货物。酸化和水解酶参与成熟，残片的外观不能鉴定酶。'};
}

export function buildUltrastructureLysosome(group,detail,ctx){
  addSingleMembrane(group,detail,ctx,{radiusAt:lysosomeRadius,color:'#8e778f',name:'LysosomalLimitingMembrane'});
  const residualMaterial=tissueMaterial('#ffffff',{roughness:.88,vertexColors:true,role:'cargo',seed:11.8,contrast:.29,relief:.007});
  const content=createDegradativeLumenGeometry({detail});
  const dense=surface(group,'HeterogeneousEndolysosomalDenseResidualDomains',content.residueGeometry,residualMaterial);dense.userData.contentDomain='heterogeneous-unresolved-residual-material';
  const remnantMaterial=tissueMaterial('#ae9298',{roughness:.77,role:'membrane',seed:14.2,contrast:.24,relief:.004});
  const remnant=surface(group,'EccentricPartialLuminalMembraneCurls',content.remnantGeometry,remnantMaterial);
  remnant.userData.contentDomain='selected-luminal-membrane-remnants-not-limiting-membranes';
  remnant.userData.closedLuminalMembraneRemnant=true;
  ctx.anchors.inside=V(.07,-.02,.59);ctx.anchors.insideTarget=V(.06,-.03,-.24);
  ctx.anchors.lysosomeResidualCamera=V(.26,.17,2.5);ctx.anchors.lysosomeResidualTarget=V(-.10,-.01,-.14);
  ctx.anchors.lysosomeMembraneCamera=V(1.15,.32,2);ctx.anchors.lysosomeMembraneTarget=V(.25,.03,-.10);
  Object.assign(ctx.stats,{contentIdentity:'Selected heterogeneous degradative endolysosome: one curved partial residual domain near the wall, two smaller residual domains, two eccentric partial membrane curls and remaining lumen',denseResidualDomains:3,conformalPartialDomains:1,partialLuminalMembraneCurls:2,namedFreeHydrolaseModels:0,electronDensityDoesNotMeasureActivity:true});
  metadata(group,ctx,'heterogeneous-degradative-endolysosome','A selected lysosome/endolysosome morphology with nonconcentric membrane remnants, not universal lysosome architecture or individually identified enzymes',[SOURCES.cryoET,SOURCES.lysosomeCycle]);
  ctx.metadata.secretoryDetails=[
    {id:'lysosome-residual',title:'异质降解残余',camera:'lysosomeResidualCamera',target:'lysosomeResidualTarget',section:.8,inside:true,description:'主要残余域沿后侧局部曲面延展，另有少量分离残余并保留腔隙。它不是第二层膜；深色也不能用于推断酸度、水解酶身份或活性。'},
    {id:'lysosome-membranous-remnants',title:'偏心膜性残留',camera:'lysosomeMembraneCamera',target:'lysosomeMembraneTarget',section:.8,inside:true,description:'两组不完整、偏心的膜性残片具有渐变宽度与起伏边缘，代表所选降解型区室的膜性内容。它们不是外围第二套限制膜，也不是通用同心核。'}
  ];
  ctx.facts=['外面仍是一个脂质双层限制膜；腔内膜性材料不使它变成双膜自噬体。','本例选择异质降解型内体溶酶体的形态，少数残余域与偏心膜卷彼此分开；不把所有溶酶体画成同样的满腔彩色酶球。','内容关系参考 HEK293 cryoET 等研究，未导入人巨噬细胞原位分割或具体水解酶坐标；电子密度也不等于酸性或酶活性。'];
  modelGuide(ctx,'lysosome',{
    title:'溶酶体 · 所选降解型内体溶酶体',
    function:'在适宜的酸性腔内由水解酶处理运来的大分子，并回收分解产物；本例展示一种降解型区室的内容关系。',
    location:'胞质中的单膜降解区室；腔内内容与胞质分隔。',
    partners:['内体与吞噬体：递送货物并在成熟过程中融合','高尔基体及内体分选途径：供应多种溶酶体蛋白'],
    features:[
      {name:'单个限制膜与保留的腔隙',function:'把降解腔与胞质分隔，腔内材料之间仍有空间。',visible:true,location:'区室外周。',note:'内外两面表示同一脂质双层；腔内膜性材料不是第二套外周包膜。'},
      {name:'异质降解残余域',function:'主要残余沿局部曲面延展，另有少量分离残余，表示所选阶段尚在处理的材料。',visible:true,location:'靠后侧壁的局部区域及腔内。',note:'没有逐个建模水解酶；深色不用于判断酸度、酶身份或活性。'},
      {name:'偏心、不完整的膜性残留',function:'展示所选降解型区室中可出现的部分膜卷和膜性内容。',visible:true,location:'腔内局部区域。',note:'它们不是所有溶酶体共有的同心核；也不能仅凭其存在就把区室判为双膜自噬体。'},
      {name:'水解酶与酸化、转运系统',function:'共同参与腔内降解及产物回收。',visible:false,location:'水解酶位于腔内；酸化和转运系统位于限制膜上。',note:'本模型未给这些分子绘制可识别的独立形体，不能把残余域或膜卷称为酶。'}
    ],
    note:'本例选择异质降解型内体溶酶体，内容关系参考 HEK293 cryoET；活跃降解区室与末端储存溶酶体的区分参考以 NRK 为主的研究。它不是所有溶酶体的通用构型，也不是人巨噬细胞原位分割。'
  });
  ctx.anchors.lysosomeDenseContent=contentLandmark(dense,V(-.35,-.22,-.33));
  ctx.anchors.lysosomeMembraneContent=contentLandmark(remnant,V(.25,.03,.04));
  ctx.anchors.lysosomeWall=contentLandmark(group.getObjectByName('LysosomalLimitingMembrane'),V(-.52,-.4,-.02));
  ctx.metadata.contentLabels=[
    {id:'residual-domain',anchor:'lysosomeDenseContent',title:'异质降解残余',description:'尚在处理的货物；深浅颜色不代表酸度或水解酶活性。',color:'#8e7479'},
    {id:'membranous-remnant',anchor:'lysosomeMembraneContent',title:'腔内膜性残片',description:'所选阶段可见的部分膜卷，来源于膜性内容；不是第二层外膜。',color:'#a2858e'},
    {id:'lysosome-boundary',anchor:'lysosomeWall',title:'单个限制膜',description:'酸化与转运系统位于此膜上；具体分子未逐个建模。',color:'#8a7492'}
  ];
  ctx.metadata.contentLesson={title:'把降解材料与水解酶分开辨认',note:'水解酶参与酸性腔内降解；此形态模型没有把每个残余域冒充为一种酶。'};
}
