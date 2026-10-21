import * as THREE from 'three';
import {createContinuousPhagocyticRoute,A_ROUTE_EVENT} from './a-continuous-route.js';

// Independent, normalized teaching panels. No whole geometry or clock is written.
export const UPTAKE_CASES = Object.freeze([
  Object.freeze({ id:'particle-phagocytosis',title:'大颗粒吞噬',short:'IgG · FcγR',duration:48 }),
  Object.freeze({ id:'mannose-receptor-endocytosis',title:'可溶配体摄取',short:'甘露糖受体',duration:48 }),
  Object.freeze({ id:'viral-antigen-clearance',title:'病毒相关抗原清除',short:'IgG · 非感染性载体',duration:48 })
]);
export const UPTAKE_STAGES = Object.freeze({
  'particle-phagocytosis': Object.freeze([
    {name:'接触',title:'已调理颗粒与膜接触',at:0,desc:'IgG调理的多价非病毒蛋白颗粒接近连续局部膜；Fab朝颗粒，Fc朝外。'},
    {name:'聚集包裹',title:'受体侧移与膜杯生长',at:.08,desc:'FcγR沿真实连续膜侧移至接触区；胞质侧actin伴随膜弯曲包裹。'},
    {name:'收颈',title:'保持连通的薄颈收窄',at:.46,desc:'杯与背景膜仍共用索引，杯腔经真实开口连胞外，颈口逐渐收窄。'},
    {name:'裂分运输',title:'瞬时裂分与封闭运输',at:.62,desc:'有限薄颈处瞬时切换为封闭吞噬体和闭合母膜，随后运输。',omission:'展示瞬时拓扑裂分事件；未模拟裂分蛋白、脂双层叶级过程或真实流体力学。'},
    {name:'处理',title:'封闭腔内处理与残余',at:.82,desc:'大货物留在处理腔，可保留残余；不走受体回收支路。',omission:'后续酶递送与供体融合在此局部仍作状态简化。'}
  ]),
  'mannose-receptor-endocytosis': Object.freeze([
    {name:'结合',title:'可溶糖蛋白与MR',at:0,desc:'具MR活性的细胞，摄取末端甘露糖糖蛋白；不是游离单糖或大颗粒。'},
    {name:'内化',title:'封闭小载体',at:.20,desc:'受体结合域朝载体腔，短尾仍朝胞质。',omission:'出芽、膜颈切断以及随后与内体的融合以阶段交接省略。'},
    {name:'分选',title:'同膜上的分流',at:.38,desc:'MR沿限制膜进入真正连通的回收管；可溶配体留在体部腔内。'},
    {name:'分流',title:'回收膜与处理方向',at:.68,desc:'受体随膜载体回收；配体另处于处理区室。',omission:'回收管颈裂分与配体后续递送省略；前后保留身份与膜侧向。'},
    {name:'归宿',title:'受体回膜，配体处理',at:.86,desc:'左侧MR恢复表面结合朝向，右侧配体留在处理腔。',omission:'回收载体与质膜融合过程省略；不是受体穿过胞质游回去。'}
  ]),
  'viral-antigen-clearance': Object.freeze([
    {name:'接触',title:'IgG调理的抗原载体接触',at:0,desc:'限定为带病毒相关抗原的非感染性教学载体，预先由IgG调理；不是通用病毒颗粒的入侵或感染。'},
    {name:'聚集包裹',title:'FcγR识别IgG-Fc并包裹',at:.08,desc:'FcγR识别载体表面IgG的Fc端，沿膜侧移配对；胞质侧actin伴随共享膜杯包裹。'},
    {name:'收颈',title:'抗原载体杯颈保持连通',at:.46,desc:'膜杯、细颈和背景膜共索引；杯腔仍连胞外。抗原载体未穿膜进入胞质。'},
    {name:'裂分运输',title:'显式裂分与封闭抗原载体',at:.62,desc:'有限薄颈处瞬时切换为封闭吞噬体与母膜，载体留在腔内运输。',omission:'显式瞬时拓扑事件；裂分蛋白、脂双层叶级过程与流体力学未模拟。'},
    {name:'处理',title:'抗原载体的腔内处理',at:.82,desc:'只展示非感染性载体在封闭腔内被处理与残余；不表示病毒复制、逃逸或有效感染。',omission:'后续酶递送仍简化；此路线不通向胞质RNA。病毒应答中的胞质RNA仍是独立条件支路。'}
  ])
});
export const VIRAL_ANTIGEN_UPTAKE_CASE_ID='viral-antigen-clearance';
export function isParticleUptakeCase(id){return id==='particle-phagocytosis'||id===VIRAL_ANTIGEN_UPTAKE_CASE_ID;}
const A=UPTAKE_CASES[0].id, B=UPTAKE_CASES[1].id, C=VIRAL_ANTIGEN_UPTAKE_CASE_ID, TAU=Math.PI*2;
const clamp=x=>THREE.MathUtils.clamp(Number(x)||0,0,1);
const smooth=x=>{x=clamp(x);return x*x*(3-2*x);};
const V=(x=0,y=0,z=0)=>new THREE.Vector3(x,y,z);
const Z=V(0,0,1);
function material(color,roughness=.4,extra={}) {return new THREE.MeshPhysicalMaterial({color,roughness,metalness:0,clearcoat:.28,clearcoatRoughness:.28,side:THREE.DoubleSide,...extra});}
function tubeBetween(a,b,r,sides=6) {
  const d=b.clone().sub(a),g=new THREE.CylinderGeometry(r,r,d.length(),sides,1,false);
  g.applyQuaternion(new THREE.Quaternion().setFromUnitVectors(V(0,1,0),d.normalize()));
  g.translate(...a.clone().add(b).multiplyScalar(.5).toArray());return g;
}
function ellipsoid(x,y,z,sx,sy,sz,n=12) {const g=new THREE.SphereGeometry(1,n,Math.max(6,n/2));g.scale(sx,sy,sz);g.translate(x,y,z);return g;}
function merge(parts) {
  const pos=[],idx=[],regions={};let offset=0;
  for(const {geometry:g,region} of parts){const a=g.getAttribute('position');const start=offset;for(let i=0;i<a.count;i++)pos.push(a.getX(i),a.getY(i),a.getZ(i));const ix=g.getIndex();for(let i=0;i<(ix?ix.count:a.count);i++)idx.push(offset+(ix?ix.getX(i):i));offset+=a.count;if(region)(regions[region]??=[]).push([start,offset]);g.dispose();}
  const g=new THREE.BufferGeometry();g.setAttribute('position',new THREE.Float32BufferAttribute(pos,3));g.setIndex(idx);g.computeVertexNormals();g.computeBoundingSphere();g.userData.regions=regions;return g;
}
function glyph(type,high) {
  const n=high?16:8,p=[];
  const put=(g,r)=>p.push({geometry:g,region:r});
  put(tubeBetween(V(0,0,-.04),V(0,0,.04),.022,high?10:6),'transmembrane');
  put(tubeBetween(V(0,0,.055),V(.022,0,.115),.013,high?8:5),'cytoplasmic');
  if(type==='mr'){
    put(tubeBetween(V(0,0,-.055),V(-.035,0,-.15),.012,high?8:5),'ectodomain');
    for(let i=0;i<3;i++)put(ellipsoid(-.03+.025*Math.sin(i*1.8),0,-.09-i*.042,.044,.029,.032,n),'ectodomain');
  }else{
    put(tubeBetween(V(0,0,-.055),V(0,0,-.115),.012,high?8:5),'ectodomain');
    put(ellipsoid(-.028,0,-.115,.034,.032,.04,n),'ectodomain');
    put(ellipsoid(.028,0,-.135,.034,.032,.04,n),'ectodomain');
  }
  const g=merge(p);g.userData.teachingSymbol=type;return g;
}
function iggGeometry(high) {
  const r=.014,s=high?7:5;
  const g=merge([
    {geometry:tubeBetween(V(),V(0,0,.07),r,s),region:'FcStem'},
    {geometry:tubeBetween(V(0,0,.06),V(-.058,0,.142),r,s),region:'FabLeft'},
    {geometry:tubeBetween(V(0,0,.06),V(.058,0,.142),r,s),region:'FabRight'}
  ]);
  // Reverse IgG polarity: Fab tips bind the particle, Fc stem faces the receptor.
  // Oblique Fab end caps exceed their logical .142 endpoint. Mirror around the
  // actual AABB center to retain the old complete envelope, not just tip span.
  g.computeBoundingBox();const zShift=g.boundingBox.min.z+g.boundingBox.max.z;
  g.scale(1,1,-1);g.translate(0,0,zShift);
  for(let k=0;k<g.index.count;k+=3){const b=g.index.getX(k+1);g.index.setX(k+1,g.index.getX(k+2));g.index.setX(k+2,b);}
  g.computeVertexNormals();g.computeBoundingBox();g.computeBoundingSphere();
  g.userData.iggPolarity={Fab:'particle-facing',Fc:'receptor-facing',localOutwardAxis:[0,0,1],mirrorTranslation:zShift,FabTips:[[-.058,0,zShift-.142],[.058,0,zShift-.142]],FcTip:[0,0,zShift],scope:'Generic IgG topology symbol, not an atomic antibody surface'};
  return g;
}
function ligandGeometry(high) {
  const n=high?18:10;
  return merge([
    {geometry:ellipsoid(0,0,0,.067,.041,.054,n)},
    {geometry:ellipsoid(.032,.025,.025,.028,.026,.027,n)},
    {geometry:tubeBetween(V(.015,.02,.025),V(.029,.065,.035),.008,high?7:5)},
    {geometry:ellipsoid(.029,.067,.035,.017,.016,.017,high?12:8)}
  ]);
}
function orientPositive(g) {
  const a=g.getAttribute('position'),ix=g.getIndex();let vol=0;
  for(let k=0;k<ix.count;k+=3){const i=ix.getX(k),j=ix.getX(k+1),l=ix.getX(k+2);vol+=a.getX(i)*(a.getY(j)*a.getZ(l)-a.getZ(j)*a.getY(l))+a.getY(i)*(a.getZ(j)*a.getX(l)-a.getX(j)*a.getZ(l))+a.getZ(i)*(a.getX(j)*a.getY(l)-a.getY(j)*a.getX(l));}
  if(vol<0)for(let k=0;k<ix.count;k+=3){const t=ix.getX(k+1);ix.setX(k+1,ix.getX(k+2));ix.setX(k+2,t);}
  g.computeVertexNormals();g.computeBoundingSphere();return g;
}
function bowlGeometry(theta,rows,cols) {
  const p=[],ix=[],inner=1.08,outer=1.13;
  // Each side has one pole, then shared rings; both rim loops are joined.
  for(const r of [outer,inner]){
    const base=p.length/3;p.push(0,0,-r);
    for(let u=1;u<=rows;u++){const t=theta*u/rows;for(let j=0;j<cols;j++){const a=j/cols*TAU;p.push(r*Math.sin(t)*Math.cos(a),r*Math.sin(t)*Math.sin(a),-r*Math.cos(t));}}
    const inward=r===inner;
    const tri=(a,b,c)=>inward?ix.push(a,c,b):ix.push(a,b,c);
    for(let j=0;j<cols;j++)tri(base,base+1+(j+1)%cols,base+1+j);
    for(let u=0;u<rows-1;u++)for(let j=0;j<cols;j++){const a=base+1+u*cols+j,b=base+1+u*cols+(j+1)%cols,c=a+cols,d=b+cols;tri(a,b,c);tri(b,d,c);}
  }
  const count=1+rows*cols,a=1+(rows-1)*cols,b=count+a;
  for(let j=0;j<cols;j++){const n=(j+1)%cols;ix.push(a+j,a+n,b+j,a+n,b+n,b+j);}
  const g=new THREE.BufferGeometry();g.setAttribute('position',new THREE.Float32BufferAttribute(p,3));g.setIndex(ix);g.userData={role:'open-cup-material-wall',innerRadius:inner,outerRadius:outer,theta,rows,cols};return orientPositive(g);
}
function sphereWall(radius,thickness,rows,cols) {
  return profileWall(s=>({x:-radius*Math.cos(Math.PI*s),r:radius*Math.sin(Math.PI*s),z:0}),rows,cols,thickness,'sphere');
}
function profilePoint(profile,s,a,offset=0) {
  const q=profile(s),p=V(q.x,q.r*Math.cos(a),q.z+q.r*Math.sin(a));
  if(offset===0)return p;
  const n=profileNormal(profile,s,a);return p.addScaledVector(n,offset);
}
function profileNormal(profile,s,a) {
  if(s<1e-7)return V(-1,0,0);if(s>1-1e-7)return V(1,0,0);
  const h=1e-5,u=profilePoint(profile,Math.max(0,s-h),a),v=profilePoint(profile,Math.min(1,s+h),a);
  const tangent=v.sub(u),q=profile(s),circ=V(0,-q.r*Math.sin(a),q.r*Math.cos(a));
  return circ.cross(tangent).normalize();
}
function profileWall(profile,rows,cols,thickness,role) {
  const p=[],ix=[],boundaries=[],layerCount=2;
  for(let layer=0;layer<layerCount;layer++){
    const base=p.length/3,offset=layer?-thickness:0;
    p.push(...profilePoint(profile,0,0,offset).toArray());
    for(let u=1;u<rows;u++)for(let j=0;j<cols;j++)p.push(...profilePoint(profile,u/rows,j/cols*TAU,offset).toArray());
    const end=p.length/3;p.push(...profilePoint(profile,1,0,offset).toArray());
    const startIndex=ix.length;
    const tri=(a,b,c)=>layer?ix.push(a,c,b):ix.push(a,b,c);
    for(let j=0;j<cols;j++)tri(base,base+1+j,base+1+(j+1)%cols);
    for(let u=0;u<rows-2;u++)for(let j=0;j<cols;j++){const a=base+1+u*cols+j,b=base+1+u*cols+(j+1)%cols,c=a+cols,d=b+cols;tri(a,c,b);tri(b,c,d);}
    const last=base+1+(rows-2)*cols;
    for(let j=0;j<cols;j++)tri(last+j,end,last+(j+1)%cols);
    boundaries.push({layer,startVertex:base,endVertex:end,startIndex,endIndex:ix.length});
  }
  const g=new THREE.BufferGeometry();g.setAttribute('position',new THREE.Float32BufferAttribute(p,3));g.setIndex(ix);g.computeVertexNormals();g.computeBoundingSphere();
  g.userData={role,rows,cols,thickness,boundaries};for(let k=0;k<g.index.count;k+=3){const b=g.index.getX(k+1);g.index.setX(k+1,g.index.getX(k+2));g.index.setX(k+2,b);}g.computeVertexNormals();return g;
}
// One meridional profile, with common rings through body, taper, tube and cap.
// Its outer normal points to cytoplasm; the inner offset bounds a continuous lumen.
function sortProfile(s) {
  const R=.98,join=2.45,x0=-.65-R*Math.cos(join),r0=R*Math.sin(join),tube=.23;
  if(s<=.62){const a=join*s/.62;return {x:-.65-R*Math.cos(a),r:R*Math.sin(a),z:0};}
  if(s<=.78){const t=(s-.62)/.16,h00=2*t**3-3*t*t+1,h10=t**3-2*t*t+t,h01=-2*t**3+3*t*t;
    return {x:x0+.55*t,r:h00*r0+h10*.55*(Math.cos(join)/Math.sin(join))+h01*tube,z:.065*smooth(t)};}
  if(s<=.94){const t=(s-.78)/.16;return {x:x0+.55+1.05*t,r:tube,z:.065+.075*smooth(t)};}
  const t=(s-.94)/.06,a=t*Math.PI*.5;return {x:x0+.55+1.05+tube*Math.sin(a),r:tube*Math.cos(a),z:.14};
}
function slabGeometry(w,h,t) {const g=new THREE.BoxGeometry(w,h,t,1,1,1);g.userData={role:'finite-membrane-patch',thickness:t,artificialPerimeter:true};return g;}

export function createUptakeScenario({whole=null,detail=true}={}) {
  const group=new THREE.Group();group.name='RepresentativeUptakeScenario';
  group.userData={owner:'uptake-scenario',teachingOnly:true,normalized:true};
  const aRoot=new THREE.Group(),bRoot=new THREE.Group();group.add(aRoot,bRoot);
  aRoot.name='ParticlePhagocytosisLocal';bRoot.name='MannoseReceptorEndocytosisLocal';
  const geometrySet=new Set(),materialSet=new Set(),bindings=[],actorRefs=[];
  const localPlane=new THREE.Plane(V(0,0,-1),3),worldPlane=localPlane.clone();
  const matBase=new Map();let caseId=A,progress=0,section=0,stageIndex=0,disposed=false;
  let handoff={active:false,weight:1,at:null};
  const anchors={focus:V(),inside:V(0,-1.7,2.4),insideTarget:V(0,0,-.1)};
  function ownGeo(g){geometrySet.add(g);return g;}
  function ownMat(m){materialSet.add(m);matBase.set(m,{opacity:m.opacity,transparent:m.transparent,depthWrite:m.depthWrite});return m;}
  function m(color,r=.4,extra={}){return ownMat(material(color,r,extra));}
  const aMem=m('#9cbec2',.32,{transmission:.16,thickness:.045}),aCargo=m('#b5a18b',.65),iggMat=m('#ecd69d',.43),fcMat=m('#9b78a4',.4),actinMat=m('#d4a453',.47),enzymeMat=m('#8faaa0',.48);
  const bMem=m('#92b7c2',.32,{transmission:.13,thickness:.045}),mrMat=m('#ab79a4',.39),ligandMat=m('#e3ad63',.45),recycleMat=m('#97b9c3',.34,{transmission:.12,thickness:.045}),processMat=m('#b8a1c5',.35,{transmission:.12,thickness:.045});
  function mesh(g,mat,parent,name,role,keys,cid,identity=null){
    const o=new THREE.Mesh(ownGeo(g),mat);o.name=name;o.userData={owner:'uptake-scenario',caseId:cid,role,identity,componentKey:role};parent.add(o);bindings.push({object:o,role,dependencies:keys});return o;
  }
  function instances(g,mat,count,parent,name,role,keys,cid){
    const o=new THREE.InstancedMesh(ownGeo(g),mat,count);o.name=name;o.instanceMatrix.setUsage(THREE.DynamicDrawUsage);o.userData={owner:'uptake-scenario',caseId:cid,role,componentKey:role,identities:Array.from({length:count},(_,i)=>`${role}-${i+1}`)};parent.add(o);bindings.push({object:o,role,dependencies:keys});return o;
  }
  const q=new THREE.Quaternion(),matrix=new THREE.Matrix4(),scale=V(1,1,1),dummy=new THREE.Object3D();
  function atSurface(o,p,n,size=1,index=null){q.setFromUnitVectors(Z,n);matrix.compose(p,q,scale.setScalar(size));if(index==null){o.position.copy(p);o.quaternion.copy(q);o.scale.setScalar(size);}else o.setMatrixAt(index,matrix);}
  const rows=detail?24:14,cols=detail?40:24;
  const route=createContinuousPhagocyticRoute({detail});
  const cup=mesh(route.preGeometry,aMem,aRoot,'UptakeOpenCupWall','a-cup',['membrane'],A);
  const closed=mesh(route.vesicleGeometry,aMem,aRoot,'UptakeClosedPhagosomeWall','a-closed',['phagosome'],A);
  const mother=mesh(route.motherGeometry,aMem,aRoot,'UptakeSealedMotherMembrane','a-mother',['membrane'],A);
  cup.userData.topologyRole='one-connected-membrane-cup-neck-background';mother.userData.boundaryRole='finite-patch-artificial-perimeter-not-cell-boundary';
  const cargoGeometry=ownGeo(new THREE.SphereGeometry(.77,detail?32:20,detail?20:12));
  const ca=cargoGeometry.getAttribute('position');for(let i=0;i<ca.count;i++){const v=V(ca.getX(i),ca.getY(i),ca.getZ(i)),n=v.clone().normalize(),r=1+.052*Math.sin(n.x*9+n.z*4)*Math.cos(n.y*8)+.023*Math.sin(n.z*15+n.x*3);v.multiplyScalar(r);ca.setXYZ(i,v.x,v.y,v.z);}cargoGeometry.computeVertexNormals();cargoGeometry.computeBoundingSphere();
  const cargo=mesh(cargoGeometry,aCargo,aRoot,'UptakeProteinaceousParticle','a-particle',['uptake-particles'],A,'Particle-01');
  const igg=instances(iggGeometry(detail),iggMat,8,aRoot,'ParticleBoundIgG','a-igg',['uptake-particles'],A);
  const fc=instances(glyph('fc',detail),fcMat,8,aRoot,'CupMembraneFcGammaReceptors','a-fc',['uptake-receptors','membrane-proteins','membrane'],A);
  const actin=instances(new THREE.CylinderGeometry(.014,.014,1,detail?6:5,1,false),actinMat,8*8,aRoot,'CytoplasmicCupActin','a-actin',['actin','membrane'],A);
  const enzymes=instances(ellipsoid(0,0,0,.045,.028,.055,detail?14:10),enzymeMat,10,aRoot,'AlreadyLuminalProcessingEnzymes','a-enzymes',['lysosome'],A);
  for(let i=0;i<10;i++){dummy.position.set(.88*Math.cos(i*2.4),.88*Math.sin(i*2.4),.12*Math.sin(i*.7));dummy.rotation.set(i*.6,i*.9,i*.2);dummy.scale.setScalar(1);dummy.updateMatrix();enzymes.setMatrixAt(i,dummy.matrix);}
  enzymes.instanceMatrix.needsUpdate=true;
  // A remains one local origin. Closed/transport/maturation are representative states.
  const bPanels=Array.from({length:5},(_,i)=>{const o=new THREE.Group();o.name=`MRPanel${i+1}`;bRoot.add(o);return o;});
  const pm1=mesh(slabGeometry(2.8,1.65,.06),bMem,bPanels[0],'MRBindingPlasmaMembrane','b-pm',['membrane'],B);
  const mrGeo=ownGeo(glyph('mr',detail)),ligGeo=ownGeo(ligandGeometry(detail));
  function receptor(parent,name){const o=mesh(mrGeo,mrMat,parent,name,'b-mr',['uptake-receptors','membrane-proteins'],B,'MR-01');actorRefs.push(o);return o;}
  function ligand(parent,name){const o=mesh(ligGeo,ligandMat,parent,name,'b-ligand',['uptake-ligands'],B,'Ligand-01');actorRefs.push(o);return o;}
  const mr1=receptor(bPanels[0],'MRSurfaceBindingSnapshot'),l1=ligand(bPanels[0],'SolubleMannoseGlycoprotein');
  atSurface(mr1,V(0,0,0),V(0,0,-1));l1.position.set(-.03,0,.18);
  const carrier=mesh(sphereWall(.62,.045,detail?22:14,detail?32:20),recycleMat,bPanels[1],'ClosedMRUptakeCarrier','b-internal-carrier',['transport-vesicles'],B);
  const mr2=receptor(bPanels[1],'MRInternalizedSnapshot'),l2=ligand(bPanels[1],'LigandInternalizedSnapshot');
  atSurface(mr2,V(0,0,.62-.0225),Z);l2.position.set(-.03,0,.43);
  const sort=mesh(profileWall(sortProfile,detail?84:52,detail?39:24,.045,'connected-sorting-endosome-recycling-tube'),bMem,bPanels[2],'ContinuousSortingEndosomeAndRecyclingTube','b-sort',['endosome'],B);
  const mr3=receptor(bPanels[2],'MRContinuousMembraneSorting'),l3=ligand(bPanels[2],'LigandRetainedInSortingLumen');
  const returnCarrier=mesh(sphereWall(.44,.045,detail?20:12,detail?28:18),recycleMat,bPanels[3],'ClosedMRRecyclingCarrier','b-recycling-carrier',['transport-vesicles'],B);returnCarrier.position.set(-1.04,0,0);
  const mr4=receptor(bPanels[3],'MRRecyclingMembraneSnapshot');atSurface(mr4,V(-1.04,0,.44-.0225),Z,.8);
  const process=mesh(sphereWall(.72,.045,detail?22:14,detail?32:20),processMat,bPanels[3],'LigandProcessingCompartment','b-processing',['lysosome'],B);process.position.set(1,0,0);
  const l4=ligand(bPanels[3],'LigandProcessingSnapshot');l4.position.copy(process.position);
  const pm5=mesh(slabGeometry(1.8,1.5,.06),bMem,bPanels[4],'RecycledMRPlasmaMembrane','b-pm-final',['membrane'],B);pm5.position.set(-1.12,0,0);
  const mr5=receptor(bPanels[4],'MRReturnedSurfaceSnapshot');atSurface(mr5,V(-1.12,0,0),V(0,0,-1));
  const process5=mesh(sphereWall(.72,.045,detail?22:14,detail?32:20),processMat,bPanels[4],'LigandFinalProcessingCompartment','b-processing-final',['lysosome'],B);process5.position.set(1.08,0,0);
  const l5=ligand(bPanels[4],'LigandFinalResidualSnapshot');l5.position.copy(process5.position);
  // No new clock: positions are pure functions of case and normalized progress.
  const coatAngles=[.38,.73,1.08,1.43,1.78,2.13,2.48,2.83];let boundFcCount=0;
  function updateA(){
    const r=route.update(progress),open=!r.scission;cup.visible=open;closed.visible=!open;mother.visible=!open;closed.position.copy(r.transport);
    const digestion=smooth((progress-.82)/.18),residue=THREE.MathUtils.lerp(1,.35,digestion);cargo.scale.setScalar(residue);cargo.position.copy(r.particleCenter);
    const assembly=smooth((progress-.035)/.08)*(1-smooth((progress-.62)/.12));actin.visible=assembly>1e-5;
    boundFcCount=0;
    for(let i=0;i<8;i++){
      const phi=i/8*TAU+.21,theta=coatAngles[i],n=V(Math.sin(theta)*Math.cos(phi),Math.sin(theta)*Math.sin(phi),-Math.cos(theta));
      const iggPoint=r.particleCenter.clone().addScaledVector(n,.80*residue);atSurface(igg,iggPoint,n,residue,i);
      const targetTheta=Math.min(theta,Math.max(.10,r.theta-.09)),targetRow=route.nc*targetTheta/r.theta,cluster=smooth((progress-(.025+i*.003))/.15),startRow=route.nc*(.70+.005*(i%3));
      const fcPoint=route.sampleMembrane(THREE.MathUtils.lerp(startRow,targetRow,cluster),phi+(1-cluster)*(.17*(i%2?1:-1)));if(!open)fcPoint.point.add(r.transport);
      atSurface(fc,fcPoint.point,fcPoint.normal,1,i);
      const ecd=fcPoint.point.clone().addScaledVector(fcPoint.normal,-.135),fcTip=iggPoint.clone().addScaledVector(n,igg.geometry.userData.iggPolarity.FcTip[2]*residue);
      if(ecd.distanceTo(fcTip)<.14)boundFcCount++;
      for(let j=0;j<8;j++){
        const ta=.10+Math.max(.08,r.theta-.35)*j/8,tb=.10+Math.max(.08,r.theta-.35)*(j+1)/8;
        const sa=route.sampleMembrane(route.nc*ta/r.theta,phi),sb=route.sampleMembrane(route.nc*tb/r.theta,phi);
        const va=sa.point.addScaledVector(sa.normal,.105),vb=sb.point.addScaledVector(sb.normal,.105);if(!open){va.add(r.transport);vb.add(r.transport);}
        const d=vb.clone().sub(va);dummy.position.copy(va).add(vb).multiplyScalar(.5);dummy.quaternion.setFromUnitVectors(V(0,1,0),d.clone().normalize());dummy.scale.set(assembly,Math.max(1e-7,d.length()),assembly);dummy.updateMatrix();actin.setMatrixAt(i*8+j,dummy.matrix);
      }
    }
    for(const o of [fc,igg,actin]){o.instanceMatrix.needsUpdate=true;o.computeBoundingSphere();}
    enzymes.visible=progress>=.82;enzymes.position.copy(r.particleCenter);fc.visible=true;
    anchors.focus.copy(r.particleCenter).multiplyScalar(.65);anchors.inside.copy(r.particleCenter).add(V(0,1.9,1.8));anchors.insideTarget.copy(r.particleCenter);
  }
  function updateB(){
    for(let i=0;i<bPanels.length;i++)bPanels[i].visible=i===stageIndex;
    const t=smooth((progress-.38)/.30),s=THREE.MathUtils.lerp(.29,.88,t),a=-Math.PI/3;
    const p=profilePoint(sortProfile,s,a),n=profileNormal(sortProfile,s,a);
    atSurface(mr3,p.clone().addScaledVector(n,-.0225),n,.8);
    const initial=profilePoint(sortProfile,.29,a,-.18),center=V(-.65,0,0);
    l3.position.copy(initial).lerp(center,smooth((progress-.39)/.14));
    l3.rotation.set(.1*t,.3*t,-.2*t);
    l4.scale.setScalar(THREE.MathUtils.lerp(1,.7,smooth((progress-.68)/.18)));
    l5.scale.setScalar(THREE.MathUtils.lerp(.7,.38,smooth((progress-.86)/.14)));
    anchors.focus.set(stageIndex===2?-.04:0,0,0);anchors.inside.set(stageIndex===2?-.05:0,-1.75,2.25);anchors.insideTarget.copy(anchors.focus);
  }
  function weightAt(p,bounds){let weight=1,at=null;for(const b of bounds){const d=p-b;if(Math.abs(d)<.008){weight=Math.min(weight,smooth(Math.abs(d)/.008));at=b;}}return {active:at!==null,weight,at};}
  function refreshFade(){
    const weight=handoff.weight;
    for(const mat of materialSet){const base=matBase.get(mat);mat.opacity=base.opacity*weight;const transparent=base.transparent||weight<.999999;if(mat.transparent!==transparent){mat.transparent=transparent;mat.needsUpdate=true;}mat.depthWrite=weight<.999999?false:base.depthWrite;}
  }
  function applySection(){
    group.updateWorldMatrix(true,false);localPlane.set(isParticleUptakeCase(caseId)?V(0,-1,0):V(0,0,-1),THREE.MathUtils.lerp(2.6,isParticleUptakeCase(caseId)?-.8:-.08,section));worldPlane.copy(localPlane).applyMatrix4(group.matrixWorld);
    for(const mat of materialSet)mat.clippingPlanes=section>.001?[worldPlane]:[];
  }
  function seek(p=0){
    if(disposed)throw new Error('Uptake scenario disposed');progress=clamp(p);
    const stages=UPTAKE_STAGES[caseId];stageIndex=0;for(let i=1;i<stages.length;i++)if(progress>=stages[i].at)stageIndex=i;
    aRoot.visible=isParticleUptakeCase(caseId);bRoot.visible=caseId===B;
    handoff=isParticleUptakeCase(caseId)?{active:false,weight:1,at:null}:weightAt(progress,[.20,.38,.68,.86]);
    if(isParticleUptakeCase(caseId))updateA();else updateB();refreshFade();applySection();group.updateMatrixWorld(true);
    return getDiagnostics();
  }
  function setCase(id){if(!UPTAKE_CASES.some(x=>x.id===id))throw new RangeError('Unknown uptake case: '+id);caseId=id;return seek(0);}
  function setSection(value){section=clamp(value);applySection();}
  function update(_time,dt){if(disposed)return;if(!Number.isFinite(dt)||dt<0)throw new RangeError('Nonnegative finite dt required');applySection();}
  function getFocus(){return anchors.focus.clone().applyMatrix4(group.matrixWorld);}
  function getInspectionTarget(){group.updateWorldMatrix(true,false);return {id:'uptake-scenario',caseId,stageIndex,representationKind:'independent-normalized-teaching-panel',matrix:group.matrixWorld.clone(),anchors:Object.fromEntries(Object.entries(anchors).map(([k,v])=>[k,v.clone()])),radius:3.15,waterCavity:false,caption:'近距观察膜与受体/货物关系；相机为外部局部视点'};}
  function getObjectVisibilityDependencies(o){
    const entry=bindings.find(x=>x.object===o);if(!entry)return null;
    if(o.userData.caseId!==(caseId===C?A:caseId))return entry.dependencies;
    const r=entry.role;
    if(r==='a-particle'||r==='a-igg')return progress<A_ROUTE_EVENT?['uptake-particles']:['uptake-particles','phagosome'];
    if(r==='a-fc')return ['uptake-receptors','membrane-proteins',progress<A_ROUTE_EVENT?'membrane':'phagosome'];
    if(r==='a-enzymes')return ['phagosome'];
    if(r==='a-actin')return ['actin',progress<A_ROUTE_EVENT?'membrane':'phagosome'];
    if(r==='b-mr')return ['uptake-receptors','membrane-proteins',stageIndex===0||stageIndex===4?'membrane':stageIndex===2?'endosome':'transport-vesicles'];
    if(r==='b-ligand')return ['uptake-ligands',...(stageIndex===0?[]:[stageIndex===1?'transport-vesicles':stageIndex===2?'endosome':'lysosome'])];
    return entry.dependencies;
  }
  function label(id,title,position,keys,visible=true){return {id,title,text:title,position:position.clone().applyMatrix4(group.matrixWorld),visible,dependencies:keys};}
  function getLabelState(){
    group.updateWorldMatrix(true,false);
    const labels=[];
    if(handoff.active)labels.push(label('uptake-handoff','阶段交接：出芽/裂分/融合中间过程省略',V(0,1.25,0),[],true));
    if(isParticleUptakeCase(caseId)){
      labels.push(label('a-cargo',caseId===C?'IgG调理的非感染性抗原载体':'IgG标记的非病毒蛋白颗粒',route.state.particleCenter.clone().add(V(.1,0,.25)),['uptake-particles',...(progress<A_ROUTE_EVENT?[]:['phagosome'])]));
      labels.push(label('a-receptor',caseId===C?'FcγR识别IgG-Fc：结合域朝腔面':'FcγR：结合域朝胞外/腔面',route.state.particleCenter.clone().add(V(-.75,.6,-.35)),['uptake-receptors','membrane-proteins',progress<A_ROUTE_EVENT?'membrane':'phagosome'],progress<.76));
      labels.push(label('a-cytoskeleton','胞质侧局部actin',route.state.particleCenter.clone().add(V(.6,-.8,-.45)),['actin',progress<A_ROUTE_EVENT?'membrane':'phagosome'],progress<.74));
      if(caseId===C)labels.push(label('viral-antigen-boundary','非感染性载体 · 不连接胞质RNA',route.state.particleCenter.clone().add(V(0,1.05,-.15)),['uptake-particles']));
      if(progress>=.82)labels.push(label('a-processing',caseId===C?'抗原载体留在腔内处理':'腔内处理；递送过程省略',route.state.particleCenter.clone().add(V(.72,.35,0)),['phagosome']));
    }else{
      const r=[mr1,mr2,mr3,mr4,mr5][stageIndex],l=[l1,l2,l3,l4,l5][stageIndex];
      labels.push(label('b-receptor',stageIndex===4?'MR-01：已返回表面':'MR-01：始终嵌在膜上',r.position,getObjectVisibilityDependencies(r)));
      labels.push(label('b-ligand',stageIndex>=3?'Ligand-01：留在处理腔':'Ligand-01：可溶糖蛋白',l.position,getObjectVisibilityDependencies(l)));
      if(stageIndex===2)labels.push(label('b-connected-tube','同一限制膜与连通回收管',V(1.1,.22,.15),['endosome']));
      labels.push(label('b-sides',stageIndex===0||stageIndex===4?'MR结合域朝胞外，短尾朝胞质':'MR结合域朝腔面，短尾朝胞质',V(0,-1.05,0),['uptake-receptors','membrane-proteins']));
    }
    return labels;
  }
  function getLabelVisibilityDependencies(id){const l=getLabelState().find(x=>x.id===id);return l?l.dependencies:null;}
  const sourceLocations=whole?.organelleLocations instanceof Map?Object.fromEntries(['membrane','endosome','lysosome','phagosome'].map(id=>[id,whole.organelleLocations.get(id)?.position?.toArray()??null])):null;
  const metadata={teachingOnly:true,normalized:true,notElectronMicroscopySegmentation:true,caseIds:[A,B],secondClock:false,wholeBinding:'read-only representative locations; never writes whole progress or geometry',wholeSourceLocations:sourceLocations,
    actualContinuity:['B sorting body, taper and recycling tube share indexed rings on outer and inner interfaces'],
    omittedProcesses:['A connection to the intact whole atlas membrane; molecular scission machinery, leaflet kinetics and fluid forces (local membrane continuity and finite-neck topological split are shown)','A donor fusion and enzyme delivery in this standalone panel','B uptake budding/scission and carrier-endosome fusion','B recycling-neck fission, later ligand delivery and carrier-plasma-membrane fusion'],
    transitionPolicy:'A: connected shared-index membrane growth then instantaneous finite-neck scission, no opacity handoff. B: original labelled single-state phase handoffs retained',
    dimensions:'Independent normalized teaching units; object scale, duration and speed are not measurements',
    sources:[{id:'Fc-gamma-function',url:'https://pubmed.ncbi.nlm.nih.gov/2139103/'},{id:'actin-Fc',url:'https://pubmed.ncbi.nlm.nih.gov/8760816/'},{id:'MR-recycling',url:'https://pubmed.ncbi.nlm.nih.gov/6766809/'},{id:'MR-ligand-delivery',url:'https://pubmed.ncbi.nlm.nih.gov/6087792/'},{id:'human-MR-conditional',url:'https://pubmed.ncbi.nlm.nih.gov/6298410/'}]};
  const facts=['A选择有吞噬活性的FcγR代表，IgG预置于可降解非病毒蛋白颗粒。','FcγR与MR为有身份的教学符号，不是原子结构表面；普通球状背景分子仍无特定蛋白身份。','MR回收的是跨膜受体及其所在膜，配体保留在内吞系统腔内去处理；不把大颗粒接入该回收支路。','MR结合域朝胞外或腔面，短尾朝胞质；此关系在回收前后保持。','A局部杯与背景膜实际共索引连通、薄颈收窄后瞬时裂分；不模拟裂分蛋白或流体。B静态分选内体与回收管共用索引环；B的裂分、递送及融合中间态按标示省略。','比例、颜色、大小和48秒时长是教学调整，不代表实测pH、速度、反应或所有巨噬细胞表达。'];
  const antigenMetadata={...metadata,caseIds:[A,B,C],caseAlias:{id:C,reusesGeometryOf:A,nonInfectiousAntigenCarrier:true,notGenericVirionEntry:true,cytosolicRNAIsIndependent:true},scope:'Only an IgG-opsonized noninfectious viral-antigen teaching carrier; not a universal viral entry, replication or infection route'};
  const antigenFacts=['限定案例：IgG调理的非感染性病毒相关抗原教学载体，不是可复制病毒或通用virion模型。','FcγR识别载体表面的IgG-Fc；此处不把抗原本身画成FcγR的通用配体。','复用A的共享索引膜杯、实际细颈与有限瞬时裂分；货物始终留在胞外连通杯腔或封闭吞噬体腔。','本摄取分支不连接胞质RNA；病毒应答中的胞质RNA始终是独立条件分支，不能由摄取自动推出。','48秒、比例、符号和处理大小均为教学调整；不展示感染、复制或逃逸。'];
  function getWholeProgress(){return isParticleUptakeCase(caseId)?.38+.62*clamp((progress-A_ROUTE_EVENT)/(1-A_ROUTE_EVENT)):.38;}
  function getDriverState(){return {caseId,progress,wholeProgress:getWholeProgress(),wholePresentation:'caller-driven-safe-legacy-transport-context; continuous cup is shown only in local model',localOnly:true,stageIndex,currentStage:UPTAKE_STAGES[caseId][stageIndex],handoff:{...handoff}};}
  function visibleInTree(o){for(let n=o;n&&n!==group.parent;n=n.parent)if(!n.visible)return false;return true;}
  function getDiagnostics(){
    const currentStage=UPTAKE_STAGES[caseId][stageIndex];
    return {...(caseId===C?{caseAlias:{id:C,reusesGeometryOf:A,nonInfectiousAntigenCarrier:true,FcGammaRecognizes:'IgG-Fc',notGenericVirionEntry:true,cytosolicRNAIsIndependent:true}}:{}),continuousA:isParticleUptakeCase(caseId)?{...route.state,particleCenter:route.state.particleCenter.toArray(),transport:route.state.transport.toArray(),cupCenter:route.state.cupCenter.toArray(),boundReceptorCount:boundFcCount,neckOpeningStillExtracellular:progress<A_ROUTE_EVENT,scissionModel:route.metadata.scissionModel}:null,caseId,progress,stageIndex,currentStage:currentStage.name,stage:currentStage,section,teachingOnly:true,macroClockOwnedByCaller:true,wholeWritten:false,handoff:{...handoff},omission:currentStage.omission??null,representationKind:'independent-normalized-teaching-panel',
      renderEstimate:{logicalRenderables:bindings.filter(e=>visibleInTree(e.object)).length,triangles:bindings.filter(e=>visibleInTree(e.object)).reduce((n,e)=>n+e.object.geometry.index.count/3*(e.object.isInstancedMesh?e.object.count:1),0),scope:'Logical visible meshes; excludes additional transmission/AO/shadow GPU passes'},objects:bindings.map(e=>({name:e.object.name,role:e.role,identity:e.object.userData.identity??null,visible:visibleInTree(e.object),dependencies:getObjectVisibilityDependencies(e.object)})),
      mr:caseId===B?{identity:'MR-01',stage:stageIndex,surfaceParameter:stageIndex===2?THREE.MathUtils.lerp(.29,.88,smooth((progress-.38)/.30)):null,ectodomain:'extracellular-or-luminal',tail:'cytoplasmic'}:null};
  }
  const totalTriangles=()=>bindings.reduce((n,{object:o})=>n+(o.geometry.getIndex()?.count??o.geometry.getAttribute('position').count)/3*(o.isInstancedMesh?o.count:1),0);
  const stats={detail,renderables:bindings.length,totalAllocatedInstanceTriangles:totalTriangles(),uniqueGeometryTriangles:[...geometrySet].reduce((n,g)=>n+g.index.count/3,0),logicalRenderableCount:bindings.length,maxActiveLogicalRenderables:6,drawCallScope:'Logical mesh draw estimate only; transmission, AO, shadow and renderer passes add actual GPU draws',sortingInterfaceRings:detail?84:52,sortingRadialSegments:detail?39:24,sharedIndexedContinuum:true,biologicalUnits:false};
  function dispose(){if(disposed)return;disposed=true;for(const g of geometrySet)g.dispose();for(const m of materialSet)m.dispose();group.removeFromParent();group.clear();}
  seek(0);
  return {group,radius:3.15,anchors,setCase,seek,setProgress:seek,update,setPresentation(mode){if(!['local','whole'].includes(mode))throw new RangeError('Unknown presentation');group.visible=mode==='local';},setSection,getFocus,getInspectionTarget,getLabelState,getWholeProgress,getDriverState,getVisibilityBindings:()=>bindings.map(x=>({...x,dependencies:[...x.dependencies]})),getObjectVisibilityDependencies,getLabelVisibilityDependencies,getDiagnostics,dispose,stats,get metadata(){return caseId===C?antigenMetadata:metadata;},get facts(){return caseId===C?antigenFacts:facts;},debug:{continuousA:route}};
}
