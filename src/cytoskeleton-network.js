import {createMembraneCollisionQueries} from './membrane-collision.js';
import {createCytoskeletonMorphology} from './cytoskeleton-morphology.js';
// Standalone three-network teaching candidate. Host THREE only; no scene mutation.
export const CYTOSKELETON_SOURCES = Object.freeze([
  {title:'Seta et al. 2023 — macrophage microtubule meshwork, edge bundles and astral MTs',url:'https://pmc.ncbi.nlm.nih.gov/articles/PMC9866147/',doi:'10.3390/ijms24021373',scope:'THP-1-derived human macrophages and murine RAW264.7 cells, fixation/confocal and live SiR-tubulin imaging. Coexisting astral and curved peripheral/basal networks inform the selected mixed organisation. The model does not reproduce a specific cell, adhesion state or measured nucleation map; displayed free segment ends are not nucleation labels.'},
  {title:'Correia et al. 1999 — adhesion-dependent macrophage vimentin organisation',url:'https://pmc.ncbi.nlm.nih.gov/articles/PMC2156141/',doi:'10.1083/jcb.146.4.831',scope:'Mouse macrophage cell lines and adhesion-dependent actin/vimentin organisation. Supports showing open cytoplasmic strands and local associations rather than one universal nuclear cage; this model does not reproduce the paper\'s adhesion geometry or assembly dynamics.'},
  {title:'Blocker et al. 1997 — bidirectional phagosome movement',url:'https://pmc.ncbi.nlm.nih.gov/articles/PMC2139871/',doi:'10.1083/jcb.137.1.113',scope:'Microtubule/motor-dependent phagosome movement; the few small carriers here are teaching representatives, not measured trajectories or motor kinetics.'},
  {title:'Jaumouille et al. 2014 — actin constraints on Fc-gamma receptors',url:'https://pmc.ncbi.nlm.nih.gov/articles/PMC4083245/',doi:'10.1016/j.devcel.2014.04.031',scope:'Actin-dependent receptor mobility/clustering; the designated cortical uptake patch is schematic, not a measured receptor or actin map.'},
  {title:'Patteson et al. 2019 — vimentin and nuclear protection',url:'https://pmc.ncbi.nlm.nih.gov/articles/PMC6891099/',doi:'10.1083/jcb.201902046',scope:'Mouse embryonic fibroblasts, not macrophage measurements. The irregular juxtanuclear and peripheral strands depict a morphological support concept only.'},
  {title:'Hartwig & Shevlin 1986 — macrophage peripheral actin architecture',url:'https://pmc.ncbi.nlm.nih.gov/articles/PMC2114287/',doi:'10.1083/jcb.103.3.1007',scope:'Extracted, spread lung macrophage cytoskeletons; branched/cross-linked peripheral architecture, not a native whole-cell segmentation. Not every overlap is an Arp2/3 branch.'},
  {title:'Polarized microtubule remodeling in reactive microglia, 2023',url:'https://www.nature.com/articles/s41467-023-41891-6',doi:'10.1038/s41467-023-41891-6',scope:'Primary murine microglia with and without LPS; curved/buckled peripheral MTs and condition-dependent radial organisation. This teaching network is not an LPS-state or macrophage-specific measurement.'},
  {title:'Zimmet et al. 2020 — human Arp2/3 activation',url:'https://pmc.ncbi.nlm.nih.gov/articles/PMC7274804/',doi:'10.1126/sciadv.aaz7651',scope:'Purified human Arp2/3 cryo-EM and biochemical reconstitution; approximately 70-degree daughter branching informs selected local junctions only, not every cortical crossing.'},
  {title:'Barger et al. 2022 — primary macrophage F-actin organisation',url:'https://pmc.ncbi.nlm.nih.gov/articles/PMC9727803/',doi:'10.1091/mbc.E22-06-0210',scope:'Murine bone-marrow-derived macrophages, Fc-receptor phagocytosis and light-sheet/confocal imaging; organisation depends on target and myosin context and differs from macrophage-like cell lines. Local patches are selected teaching domains, not a universal resting distribution.'},
]);

export function createCytoskeletonNetwork({THREE,whole=null,surfaceRadius=null,nuclearBounds=null,detail=false}={}) {
  if(!THREE?.BufferGeometry)throw new TypeError('Pass the host THREE namespace');
  const V=(x=0,y=0,z=0)=>new THREE.Vector3(x,y,z),TAU=2*Math.PI;
  const group=new THREE.Group();group.name='ThreeCytoskeletalNetworksCandidate';
  group.visible=false; // Explicit replacement/visibility integration must precede activation.
  group.userData={teachingOnly:true,componentKey:'cytoskeleton',coordinateFrame:'whole.group local; attach directly beneath whole.group without a second world transform'};
  const ownedGeometry=new Set(),ownedMaterial=new Set(),levels={},groups={},pickables=[];
  const rejected=[],routeRecords=[],carrierRecords=[];let disposed=false,quality=detail?'high':'low',lastTime=0;
  const ownG=g=>(ownedGeometry.add(g),g),ownM=m=>(ownedMaterial.add(m),m);
  const alive=()=>{if(disposed)throw new Error('Cytoskeleton candidate is disposed');};
  whole?.group?.updateWorldMatrix(true,true);
  const frameInverse=whole?.group?.matrixWorld.clone().invert()??new THREE.Matrix4();
  const legacy=[];
  whole?.group?.traverse(o=>{if(o.isMesh&&['microtubules','actin'].includes(o.userData?.componentKey))legacy.push(o);});
  const shell=whole?.group?.getObjectByName('ClosedOrganicMembraneWith36Pseudopods');
  // Actual local shell triangles; the angular-grid path is a legacy fallback.
  function makeCellSampler() {
    // A folded membrane can cross one ray several times. Keep this existing
    // network inside the origin-connected cytoplasm, before the first exit.
    if(whole?.membraneSurface?.raycast)return direction=>{const hit=whole.membraneSurface.raycast(V(),direction,{farthest:false});return hit?.distance??NaN;};
    if(!shell)return null;
    const g=shell.geometry,p=g.attributes.position,ix=g.index,NU=256,NV=512;
    if(p.count!==(NU+1)*(NV+1)||ix.count!==NU*NV*6)throw new Error('Unsupported canonical whole shell grid');
    const rel=new THREE.Matrix4().multiplyMatrices(frameInverse,shell.matrixWorld),identity=new THREE.Matrix4();
    if(rel.elements.some((v,i)=>Math.abs(v-identity.elements[i])>1e-8))throw new Error('Canonical shell must be identity in whole-local frame');
    const xy=V().fromBufferAttribute(p,NU/4*(NV+1)),xz=V().fromBufferAttribute(p,NU/2*(NV+1)+NV/8),ry=Math.abs(xy.y/xy.x),rz=Math.abs(xz.z/xz.x);
    const a=V(),b=V(),c=V(),d=V(),hit=V(),ray=new THREE.Ray(V(),V(0,0,1));
    return direction=>{
      d.copy(direction).normalize();for(const axis of ['x','y','z'])if(Math.abs(d[axis])<1e-12)d[axis]=0;d.normalize();ray.direction.copy(d);
      const sx=d.x,sy=d.y/ry,sz=d.z/rz,len=Math.hypot(sx,sy,sz),u=Math.min(NU-1,Math.floor(Math.acos(THREE.MathUtils.clamp(sy/len,-1,1))/Math.PI*NU)),v=Math.floor((((Math.atan2(sz,sx)%TAU)+TAU)%TAU)/TAU*NV);
      let r=-Infinity;
      for(let du=-1;du<=1;du++){const row=u+du;if(row<0||row>=NU)continue;for(let dv=-1;dv<=1;dv++){const col=(v+dv+NV)%NV,i=row*(NV+1)+col,j=i+NV+1;
        a.fromBufferAttribute(p,i);b.fromBufferAttribute(p,i+1);c.fromBufferAttribute(p,j);if(ray.intersectTriangle(a,b,c,false,hit))r=Math.max(r,hit.length());
        a.fromBufferAttribute(p,j);b.fromBufferAttribute(p,i+1);c.fromBufferAttribute(p,j+1);if(ray.intersectTriangle(a,b,c,false,hit))r=Math.max(r,hit.length());
      }}
      if(!Number.isFinite(r))throw new Error('Actual cell radial triangle query missed: '+direction.toArray()+' normalized '+d.toArray()+' grid '+u+','+v);return r;
    };
  }
  const actualCellRadius=makeCellSampler()??surfaceRadius;
  if(typeof actualCellRadius!=='function')throw new TypeError('Pass whole with its canonical raw shell, or an exact whole-local surfaceRadius callback');
  const cellCache=new Map();
  const cellRadius=d=>{const k=[d.x,d.y,d.z].map(n=>Math.round(n*1e5)).join(',');if(!cellCache.has(k)){const r=actualCellRadius(d);if(!Number.isFinite(r)||r<=0)throw new Error('Invalid cell radius');cellCache.set(k,r);}return cellCache.get(k);};
  function deriveNuclearBox() {
    if(nuclearBounds?.isBox3)return nuclearBounds.clone();
    if(nuclearBounds?.min&&nuclearBounds?.max)return new THREE.Box3(V().fromArray(nuclearBounds.min.toArray?.()??nuclearBounds.min),V().fromArray(nuclearBounds.max.toArray?.()??nuclearBounds.max));
    const mesh=whole?.components?.nucleus?.component?.group?.getObjectByName('PerforatedDoubleNuclearMembrane');
    if(!mesh)throw new TypeError('Provide nuclearBounds in whole-local coordinates when no actual nuclear membrane is available');
    const box=new THREE.Box3(),p=mesh.geometry.attributes.position,ix=mesh.geometry.index,matrix=new THREE.Matrix4().multiplyMatrices(frameInverse,mesh.matrixWorld),v=V();
    for(const g of mesh.geometry.groups)if(g.materialIndex===0)for(let k=g.start;k<g.start+g.count;k++)box.expandByPoint(v.fromBufferAttribute(p,ix.getX(k)).applyMatrix4(matrix));
    if(box.isEmpty())throw new Error('Actual material-0 nuclear bounds were empty');return box;
  }
  const nucleusBox=deriveNuclearBox(),keepout=nucleusBox.clone().expandByScalar(.045),nucleusCenter=nucleusBox.getCenter(V());
  const membraneQueries=whole?createMembraneCollisionQueries({THREE,whole}):null;
  function safePoint(p,margin=.04) {const r=p.length(),inside=p.x>=keepout.min.x-margin&&p.x<=keepout.max.x+margin&&p.y>=keepout.min.y-margin&&p.y<=keepout.max.y+margin&&p.z>=keepout.min.z-margin&&p.z<=keepout.max.z+margin;return !inside&&r+margin<cellRadius(p.clone().normalize());}
  function validateGeometry(g,name) {const p=g.attributes.position,v=V();for(let i=0;i<p.count;i++)if(!safePoint(v.fromBufferAttribute(p,i),.018)||membraneQueries?.nearSurface(v,.006)){rejected.push({name,reason:'Raw surface vertex failed nucleus-box or actual-cell clearance',vertex:i});return false;}return true;}
  function material(color,extra={}) {return ownM(new THREE.MeshStandardMaterial({color,roughness:.72,metalness:0,side:THREE.DoubleSide,...extra}));}
  const mtMaterial=material('#ffffff',{vertexColors:true}),actinMaterial=material('#8dabb1'),ifMaterial=material('#a18fad'),mtocMaterial=material('#c8b489',{transparent:true,opacity:.12,depthWrite:false});
  function tag(o,key){o.userData={...o.userData,teachingOnly:true,organelleId:'cytoskeleton',componentKey:key};return o;}
  function append(parent,g,m,name,key,validate=true) {
    if(validate&&!validateGeometry(g,name)){g.dispose();return null;}
    ownG(g);const mesh=tag(new THREE.Mesh(g,m),key);mesh.name=name;parent.add(mesh);pickables.push(mesh);return mesh;
  }
  function merge(list) {
    if(!list.length)return null;const pos=[],norm=[],col=[],indices=[];let offset=0;
    for(const g of list){pos.push(...g.attributes.position.array);norm.push(...g.attributes.normal.array);if(g.attributes.color)col.push(...g.attributes.color.array);for(const i of g.index.array)indices.push(i+offset);offset+=g.attributes.position.count;g.dispose();}
    const g=new THREE.BufferGeometry();g.setAttribute('position',new THREE.Float32BufferAttribute(pos,3));g.setAttribute('normal',new THREE.Float32BufferAttribute(norm,3));if(col.length)g.setAttribute('color',new THREE.Float32BufferAttribute(col,3));g.setIndex(indices);g.computeBoundingSphere();return g;
  }
  // A real annular tube wall, including inner surface and annular end rims; no blind disks.
  function hollowTube(curve,segments,sides,outer=.028,inner=.017) {
    const frames=curve.computeFrenetFrames(segments,false),pos=[],color=[],ix=[],p=V(),n=V();
    const colors=[new THREE.Color('#b9a56e'),new THREE.Color('#7f7250')],stride=sides+1,layer=(segments+1)*stride;
    for(let wall=0;wall<2;wall++)for(let u=0;u<=segments;u++)for(let v=0;v<=sides;v++){
      const a=v/sides*TAU,r=wall?inner:outer;curve.getPoint(u/segments,p);n.copy(frames.normals[u]).multiplyScalar(Math.cos(a)*r).addScaledVector(frames.binormals[u],Math.sin(a)*r).add(p);pos.push(n.x,n.y,n.z);color.push(...colors[wall].toArray());
      if(u<segments&&v<sides){const a0=wall*layer+u*stride+v,b=a0+stride;if(wall)ix.push(a0,b,a0+1,a0+1,b,b+1);else ix.push(a0,a0+1,b,a0+1,b+1,b);}
    }
    for(let v=0;v<sides;v++){const a=v,b=segments*stride+v;ix.push(a,a+layer,a+1,a+1,a+layer,a+layer+1,b,b+1,b+layer,b+1,b+layer+1,b+layer);}
    const g=new THREE.BufferGeometry();g.setAttribute('position',new THREE.Float32BufferAttribute(pos,3));g.setAttribute('color',new THREE.Float32BufferAttribute(color,3));g.setIndex(ix);g.computeVertexNormals();g.computeBoundingSphere();g.userData={hollow:true,innerRadius:inner,outerRadius:outer,blindEndDisks:false};return g;
  }
  const trackOrigin=whole?.components?.microtubuleTracks?.length?'existing-whole-metadata':'deterministic-teaching-fallback-no-whole';
  const sourceTracks=whole?.components?.microtubuleTracks??Array.from({length:54},(_,i)=>{
    const a=i/54*TAU,d=V(Math.cos(a),Math.sin(a),-.12).normalize(),end=d.clone().multiplyScalar(cellRadius(d)-.65),start=V(nucleusBox.max.x+.85+.07*Math.cos(a),nucleusCenter.y-.9+.07*Math.sin(a),-.42);
    return [start,start.clone().lerp(end,.54).add(V(0,0,-.25)),end];
  });
  const originalMTOC=sourceTracks.reduce((sum,tr)=>sum.add(tr[0]),V()).multiplyScalar(1/sourceTracks.length),mtoc=originalMTOC.clone();
  if(membraneQueries&&(membraneQueries.containing(mtoc).length||membraneQueries.nearSurface(mtoc,.29))){
    const choices=[V(.45,-.55,2.6),V(.9,-.8,2.75),V(.75,-1.4,2.65),V(.8,-.9,-2.6)];
    const safe=choices.find(p=>safePoint(p,.3)&&!membraneQueries.containing(p).length&&!membraneQueries.nearSurface(p,.29));
    if(!safe)throw new Error('No safe MTOC region outside actual membranes');mtoc.copy(safe);
  }
  function membraneSafeCurve(curve,radius){
    if(!membraneQueries)return true;const previous=curve.getPointAt(0),point=V();
    if(membraneQueries.containing(previous).length)return false;
    const steps=Math.max(32,Math.ceil(curve.getLength()/.04));
    for(let i=0;i<=steps;i++){curve.getPointAt(i/steps,point);if(membraneQueries.nearSurface(point,radius+.025))return false;if(i&&membraneQueries.segmentHits(previous,point,{firstOnly:true}).length)return false;previous.copy(point);}return true;
  }
  const curveSafe=(curve,r=.04)=>{for(let i=0;i<=128;i++)if(!safePoint(curve.getPoint(i/128),r))return false;return true;};
  function corticalPoint(d,inset=.29){d=d.clone().normalize();return d.multiplyScalar(cellRadius(d)-inset);}
  // This conservative support surface only bounds the routes. It is never
  // rendered as a cage, a membrane, or equally spaced latitude/longitude arcs.
  const cageExtent=nucleusBox.getSize(V()).multiplyScalar(.5).addScalar(.20);
  function cagePoint(direction){const d=direction.clone().normalize(),den=(Math.abs(d.x/cageExtent.x)**4+Math.abs(d.y/cageExtent.y)**4+Math.abs(d.z/cageExtent.z)**4),r=(3/den)**.25;return nucleusCenter.clone().addScaledVector(d,r);}
  const morphology=createCytoskeletonMorphology({THREE,cellRadius,corticalPoint,cagePoint,nucleusCenter});
  const routes=sourceTracks.map((points,index)=>{
    const candidates=morphology.microtubuleCandidates(points,index,mtoc,originalMTOC);
    let chosen=null;for(const candidate of candidates){const curve=new THREE.CatmullRomCurve3(candidate.points,false,'centripetal');if(curveSafe(curve)&&membraneSafeCurve(curve,.031)){chosen={curve,index,method:candidate.method};break;}}
    routeRecords.push({index,accepted:!!chosen,method:chosen?.method??'omitted-for-actual-membrane-clearance'});return chosen;
  }).filter(Boolean);
  if(routes.length<8)throw new Error('Too few safe existing MT endpoints for a radial MTOC teaching network');
  // Recover the existing eighty TubeGeometry axes before replacing their batch.
  const oldActin=[];
  for(const object of legacy.filter(o=>o.userData.componentKey==='actin')){
    const p=object.geometry.attributes.position,m=new THREE.Matrix4().multiplyMatrices(frameInverse,object.matrixWorld),chunk=27*5;
    if(p.count%chunk!==0)continue;
    for(let at=0;at<p.count;at+=chunk){const points=[];for(let ring=0;ring<27;ring++){const v=V();for(let side=0;side<4;side++)v.add(V().fromBufferAttribute(p,at+ring*5+side));points.push(v.multiplyScalar(.25).applyMatrix4(m));}oldActin.push(points);}
  }
  if(!whole&&!oldActin.length)for(let i=0;i<80;i++){
    const a=i/80*TAU,span=.24+.31*(.5+.5*Math.sin(i*2.37));oldActin.push(Array.from({length:27},(_,j)=>V(5.4*Math.cos(a+span*j/26),5.4*Math.sin(a+span*j/26),.1)));
  }
  if(oldActin.length!==80)throw new Error('Expected eighty original actin axes; unsupported whole batch layout');
  const actinCurves=morphology.actin,ifCurves=morphology.intermediate;
  function splitOutsideMembranes(entry,radius){
    if(!membraneQueries)return [entry];
    if(curveSafe(entry.curve,radius+.025)&&membraneSafeCurve(entry.curve,radius))return [entry];
    const count=Math.max(64,Math.ceil(entry.curve.getLength()/.035)),runs=[];let begin=-1;
    for(let i=0;i<=count;i++){
      const p=entry.curve.getPointAt(i/count),ok=safePoint(p,radius+.025)&&!membraneQueries.containing(p).length&&!membraneQueries.nearSurface(p,radius+.035);
      if(ok&&begin<0)begin=i;
      if((!ok||i===count)&&begin>=0){const finish=ok&&i===count?i:i-1;if((finish-begin)/count*entry.curve.getLength()>.36){const t0=begin/count,t1=finish/count,base=entry.curve;
        const SubCurve=class extends THREE.Curve{getPoint(t,target=V()){return base.getPointAt(t0+(t1-t0)*t,target);}};
        const curve=new SubCurve();if(membraneSafeCurve(curve,radius))runs.push({...entry,curve,closed:false,trimmedForActualMembraneClearance:true,t0,t1});}
        begin=-1;
      }
    }
    return runs;
  }
  const clippedActin=actinCurves.flatMap(e=>splitOutsideMembranes(e,.014));
  const safeActinCurves=clippedActin.filter(entry=>{
    if(!entry.branchParentId)return true;
    if((entry.t0??0)>1e-5)return false;
    return clippedActin.some(parent=>parent.id===entry.branchParentId&&Array.from({length:97},(_,i)=>parent.curve.getPointAt(i/96)).some(p=>p.distanceTo(entry.branchPoint)<.035));
  }),safeIFCurves=ifCurves.flatMap(e=>splitOutsideMembranes(e,.020));
  const naturalism={...morphology.stats,retainedActinDaughters:safeActinCurves.filter(e=>e.branchParentId).length,retainedIFClosedLoops:safeIFCurves.filter(e=>e.closed).length,microtubuleLengths:routes.map(e=>e.curve.getLength()),microtubuleEndpoints:routes.map(e=>e.curve.getPoint(1).toArray()),displayedMicrotubuleStarts:{centrosomalNeighbourhood:routes.filter(e=>e.curve.getPoint(0).distanceTo(mtoc)<.45).length,distributedSegments:routes.filter(e=>e.curve.getPoint(0).distanceTo(mtoc)>=.45).length,segmentEndsAreNotNucleationMarkers:true},allNetworksIllustrative:true};
  group.userData.naturalism=naturalism;
  function makeClass(key,name){const g=tag(new THREE.Group(),key);g.name=name;group.add(g);groups[key]=g;return g;}
  makeClass('microtubules','MicrotubuleNetworkWithMTOC');makeClass('actin','ActinCortexAndUptakeNeighborhood');makeClass('intermediate-filaments','VimentinLikePerinuclearSupport');
  const carrierRoot=tag(new THREE.Group(),'transport-vesicles');carrierRoot.name='FiniteMicrotubuleMotorCarrierExamples';groups.microtubules.add(carrierRoot);groups['transport-vesicles']=carrierRoot;
  const carrierMaterial=ownM(new THREE.MeshPhysicalMaterial({color:'#d7bd91',roughness:.72,metalness:0,transmission:0,opacity:1,clearcoat:0,thickness:.02,ior:1.25,side:THREE.DoubleSide})),payloadMaterial=material('#9b7469',{roughness:.7}),motorMaterial=material('#a49ca9');
  const acceptedCarrierRoutes=[];
  function carrierPoint(route,u){const t=.74+.18*u,p=route.curve.getPoint(t),tangent=route.curve.getTangent(t).normalize(),side=V().crossVectors(tangent,V(0,1,0));if(side.lengthSq()<.01)side.set(0,0,1);return {point:p.addScaledVector(side.normalize(),.145),tangent};}
  for(const route of routes){let ok=true;for(let i=0;i<=96;i++)if(!safePoint(carrierPoint(route,i/96).point,.14)||membraneQueries?.containing(carrierPoint(route,i/96).point).length||membraneQueries?.nearSurface(carrierPoint(route,i/96).point,.15)){ok=false;break;}if(ok)acceptedCarrierRoutes.push(route);if(acceptedCarrierRoutes.length===3)break;}
  if(!acceptedCarrierRoutes.length)throw new Error('No finite carrier segment passed cell/nuclear clearance');
  for(const level of ['low','high']){
    const high=level==='high',mtLevel=new THREE.Group(),actinLevel=new THREE.Group(),ifLevel=new THREE.Group(),carrierLevel=new THREE.Group();
    groups.microtubules.add(mtLevel);groups.actin.add(actinLevel);groups['intermediate-filaments'].add(ifLevel);carrierRoot.add(carrierLevel);
    levels[level]={microtubules:mtLevel,actin:actinLevel,intermediateFilaments:ifLevel,carriers:carrierLevel,counts:{microtubules:0,actin:0,intermediateFilaments:0,carriers:0}};
    const mtParts=[];for(const [k,route]of routes.entries()){if(!high&&k%2)continue;const g=hollowTube(route.curve,high?40:18,high?12:6);if(validateGeometry(g,'MT '+route.index+' '+level)){mtParts.push(g);levels[level].counts.microtubules++;}else g.dispose();}
    if(mtParts.length){const g=merge(mtParts);g.userData={hollow:true,blindEndDisks:false};append(mtLevel,g,mtMaterial,'HollowMicrotubuleWallBatch_'+level,'microtubules',false);}
    // Two open barrel symbols and diffuse PCM sphere: not atomistic centriole triplets.
    for(let c=0;c<2;c++){
      const dir=c?V(1,0,.25).normalize():V(0,1,.2).normalize(),a=mtoc.clone().addScaledVector(dir,-.19),b=mtoc.clone().addScaledVector(dir,.19),curve=new THREE.LineCurve3(a,b),g=hollowTube(curve,high?8:3,high?18:8,.095,.061);
      append(mtLevel,g,mtMaterial,'SchematicCentrioleBarrel'+c+'_'+level,'microtubules');
    }
    const pcm=ownG(new THREE.SphereGeometry(.235,high?16:8,high?10:5));pcm.translate(mtoc.x,mtoc.y,mtoc.z);append(mtLevel,pcm,mtocMaterial,'PericentriolarMaterialTeachingRegion_'+level,'microtubules');
    const actinParts=[];for(const [k,entry]of safeActinCurves.entries()){if(!high&&k%2)continue;const g=new THREE.TubeGeometry(entry.curve,high?32:14,high?.011:.012,high?5:4,false);if(validateGeometry(g,'actin '+k+' '+level)){actinParts.push(g);levels[level].counts.actin++;}else g.dispose();}
    if(actinParts.length)append(actinLevel,merge(actinParts),actinMaterial,'CorticalFActinArcsAndLocalUptakePatch_'+level,'actin',false);
    const ifParts=[];for(const [k,entry]of safeIFCurves.entries()){if(!high&&k%2)continue;const g=new THREE.TubeGeometry(entry.curve,high?64:24,high?.017:.018,high?6:4,entry.closed);if(validateGeometry(g,'IF '+k+' '+level)){ifParts.push(g);levels[level].counts.intermediateFilaments++;}else g.dispose();}
    if(ifParts.length)append(ifLevel,merge(ifParts),ifMaterial,'VimentinLikeNuclearCageAndCytoplasmicSupports_'+level,'intermediate-filaments',false);
    for(const [i,route]of acceptedCarrierRoutes.entries()){
      if(!high&&i>0)continue;
      const actor=tag(new THREE.Group(),'transport-vesicles');actor.name='MotorAttachedClosedTeachingCarrier'+i+'_'+level;carrierLevel.add(actor);
      const wall=append(actor,new THREE.SphereGeometry(.075,high?16:8,high?10:6),carrierMaterial,'ClosedTransportCarrierWall','transport-vesicles',false);
      const payload=append(actor,new THREE.IcosahedronGeometry(.024,high?1:0),payloadMaterial,'EnclosedGenericCarrierCargo','transport-vesicles',false);
      const stalk=append(actor,new THREE.CylinderGeometry(.009,.009,.05,high?6:4),motorMaterial,'UnspecifiedMotorStalk','microtubules',false);stalk.position.y=-.067;
      const head=append(actor,new THREE.SphereGeometry(.018,high?8:6,high?6:4),motorMaterial,'UnspecifiedMotorHead','microtubules',false);head.position.y=-.090;
      carrierRecords.push({actor,route,index:i,level,wall,payload,stalk,head});levels[level].counts.carriers++;
    }
  }
  function applyActors(t){const up=V(0,1,0);for(const r of carrierRecords){const u=.5-.5*Math.cos(t*.55+r.index*2.1),pose=carrierPoint(r.route,u),axis=pose.point.clone().sub(r.route.curve.getPoint(.74+.18*u)).normalize();r.actor.position.copy(pose.point);r.actor.quaternion.setFromUnitVectors(up,axis);}}
  applyActors(0);
  function setQuality(value){alive();const next=value==='medium'?'low':value;if(!['low','high'].includes(next))throw new RangeError('Quality must be low, medium (low geometry), or high');quality=next;for(const [level,data]of Object.entries(levels))for(const key of ['microtubules','actin','intermediateFilaments','carriers'])data[key].visible=level===quality;applyActors(lastTime);return diagnostics();}
  function update(t,dt=0){alive();if(dt<=0)return;if(!Number.isFinite(t)||!Number.isFinite(dt))throw new TypeError('Finite host time/dt required');lastTime=t;applyActors(t);}
  function budgets(){const out={};for(const [level,data]of Object.entries(levels)){let vertices=0,triangles=0,drawCalls=0;for(const key of ['microtubules','actin','intermediateFilaments','carriers'])data[key].traverse(o=>{if(!o.isMesh)return;vertices+=o.geometry.attributes.position.count;triangles+=(o.geometry.index?.count??o.geometry.attributes.position.count)/3;drawCalls++;});out[level]={...data.counts,vertices,triangles,drawCalls};}return out;}
  function getObjectVisibilityDependencies(object){
    let key=object.userData?.componentKey,carrier=false;for(let p=object;p&&p!==group;p=p.parent)if(p===carrierRoot)carrier=true;
    if(carrier)return ['cytoskeleton','microtubules','transport-vesicles'];
    if(['microtubules','actin','intermediate-filaments'].includes(key))return ['cytoskeleton',key];return null;
  }
  function getVisibilityBindings(){const bindings=[];group.traverse(object=>{if(object.isMesh)bindings.push({object,dependencies:getObjectVisibilityDependencies(object),role:object.userData.componentKey});});return bindings;}
  function getLabelVisibilityDependencies(){return null;}
  function setSectionPlanes(planes=null,{cortexOnly=true}={}){alive();if(planes!==null&&!Array.isArray(planes))throw new TypeError('planes must be host world-space Plane[] or null');for(const m of cortexOnly?[actinMaterial]:ownedMaterial){const old=m.clippingPlanes?.length??0;m.clippingPlanes=planes;if(old!==(planes?.length??0))m.needsUpdate=true;}}
  function diagnostics(){return {quality,disposed,lastTime,initiallyInactiveForReplacement:true,sourceMicrotubuleTracks:sourceTracks.length,trackOrigin,originalMTOC:originalMTOC.toArray(),safeMTOC:mtoc.toArray(),obstacleSnapshotProgress:whole?.group?.userData?.journey?.progress??null,membraneFiltering:!!membraneQueries,sourceIFCurves:ifCurves.length,visibleIFSegments:safeIFCurves.length,recoveredActinAxes:whole?oldActin.length:0,actinOrigin:'heterogeneous-cortical-filaments-and-local-branched-patches',acceptedRoutes:routes.length,routeRecords,rejected:[...rejected],naturalism,budget:budgets(),nuclearBounds:{min:nucleusBox.min.toArray(),max:nucleusBox.max.toArray()},coordinateFrame:'whole.group local; parent group beneath whole.group',clearanceScope:'Actual raw cell, conservative nuclear AABB, and BVH triangle/clearance filtering against actual complete NEER, mitochondrial outer and active vesicle/fusion membranes at construction progress. Temporal/cross-story coexistence requires recheck when membrane geometry moves.',geometryInterpretation:'Unequal curved hollow MTs with MTOC directionality; heterogeneous peripheral F-actin with selected connected daughter branches; unequal open vimentin-like juxtanuclear arcs and extensions, not a latitude/longitude cage or measured macrophage architecture.',bidirectionalCarrierMotion:'Finite cosine traversal on validated .74-.92 MT segments; no modulo teleport or organelle membrane delivery.',ownClock:false,dtZeroFreezes:true,sources:CYTOSKELETON_SOURCES};}
  function dispose(){if(disposed)return;for(const g of ownedGeometry)g.dispose();for(const m of ownedMaterial)m.dispose();ownedGeometry.clear();ownedMaterial.clear();cellCache.clear();membraneQueries?.dispose();const objects=[];group.traverse(o=>objects.push(o));for(const o of objects.reverse())o.clear();pickables.length=0;carrierRecords.length=0;disposed=true;}
  setQuality(quality);
  return {group,groups,pickables,setQuality,update,setSectionPlanes,diagnostics,getVisibilityBindings,getObjectVisibilityDependencies,getLabelVisibilityDependencies,dispose,
    replacementTargets:legacy.map(object=>({object,componentKey:object.userData.componentKey,action:'Hide/remove this old mesh and remove it from active picking before enabling candidate; keep its material owned by old whole.'})),
    anchors:{mtoc:mtoc.clone(),microtubuleEnd:routes[0].curve.getPoint(0),microtubuleEndDirection:routes[0].curve.getTangent(0).normalize(),corticalUptake:corticalPoint(V(1,.05,.2)),nuclearSupport:nucleusCenter.clone()},
    debug:{levels,sourceTracks,routes,actinCurves:safeActinCurves,ifCurves:safeIFCurves,originalIFCurves:ifCurves,carrierRecords,nucleusBox,keepout,actualCellRadius,carrierPoint,membraneQueries},
  };
}
