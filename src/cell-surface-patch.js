import * as THREE from "three";
import { mergeGeometries } from "three/addons/utils/BufferGeometryUtils.js";

const V = (x=0,y=0,z=0) => new THREE.Vector3(x,y,z);
const TAU = Math.PI*2, WALL = .027, FIXED_STEP = 1/60, WALK_STEP = .0085, RELEASE_STEP = 192;
const MAX_SEEK_SECONDS = 3600;
const LIPID_BAND = Object.freeze({x:[-.26,.26],y:[-1.025,-.985],headRadius:.0033,tailLength:.011});
const LOD_THRESHOLDS = Object.freeze({enterNearCSS:620,exitNearCSS:480});
const SOURCES = Object.freeze([
  {title:"Shelton & Orenstein｜CIL:13091，小鼠巨噬细胞的表面褶皱、微绒毛与F-actin",url:"https://www.cellimagelibrary.org/images/13091"},
  {title:"Verdys 等，2024｜Macrophage cortex and ERM proteins",url:"https://link.springer.com/article/10.1038/s44318-024-00173-7"},
  {title:"Sako & Kusumi，1994｜Compartmentalized plasma membrane diffusion（NRK细胞）",url:"https://pubmed.ncbi.nlm.nih.gov/8207056/"}
  ,{title:"Freeman 等，2018｜膜跨膜栅栏与皮层骨架限制巨噬细胞受体活动",url:"https://pmc.ncbi.nlm.nih.gov/articles/PMC5929997/"}
]);
export const CELL_SURFACE_PATCH_ID = "surface-patch";
export const CELL_SURFACE_PATCH_GUIDE = {
  title:"微绒毛与膜活动局部",
  function:"细胞表面的细长圆钝突起与基底质膜连续，肌动蛋白束从胞质侧延入突起。两个通用跨膜符号分别示意自由样侧向活动，以及暂时受限后释放的活动。",
  location:"巨噬细胞表面的代表性有限局部；不是ER，不把微绒毛等同宽片状ruffle，也不是上皮刷状缘。",
  partners:["质膜与胞质侧肌动蛋白","两侧朝向明确的通用跨膜符号"],
  features:[
    {name:"连续膜与微绒毛",function:"三根不同高度、轻微倾斜的圆钝突起与同一局部质膜共用端口；局部裁边用暖色区分。",visible:true,views:["ordinary"],parts:["surface-patch","microvilli"]},
    {name:"胞质侧肌动蛋白芯",function:"成束细丝从膜下胞质延入突起内部；芯所在空间属于胞质，不是脂质膜壁内的水腔。",visible:true,views:["ordinary"],parts:["surface-patch","microvilli","actin"]},
    {name:"自由样与暂受限后释放",function:"两符号使用不同种子、同尺度随机步长；一者在有限观察域活动，另一者先受限于小区域，随后释放。",visible:true,views:["ordinary"],parts:["surface-patch","microvilli","membrane-proteins"]},
    {name:"磷脂头尾双层诊断带",function:"一小段真实头/尾教学几何：两侧头面向水相，尾相向；主动观察磷脂头尾时参照壁半透明，退出观察即恢复。",visible:true,views:["ordinary"],parts:["surface-patch","microvilli"]},
    {name:"基底actin邻域",function:"金色符号旁的胞质侧细丝提供限制范围语境；释放为指定教学状态，未模拟连接分子或真实解离动力学。",visible:true,views:["ordinary"],parts:["surface-patch","microvilli","actin"]}
  ],
  note:"程序化教学形态，未复制或分割原电镜图。微绒毛内部与胞质相通，有限局部的暖色裁边不是生理封口。符号不是已鉴定蛋白，轨迹不是实测扩散或实验测得的D；活动只在播放时推进。所有局部独立放大，不能据此与PDB实例比较真实大小。",
  sources:SOURCES.map(s=>({...s}))
};
const PROJECTIONS = [
  {x:-.88,y:.15,height:1.08,root:.218,stem:.137,lean:[-.11,.065],phase:.3},
  {x:-.02,y:.22,height:1.42,root:.202,stem:.122,lean:[.10,-.045],phase:1.8},
  {x:.84,y:.17,height:.94,root:.210,stem:.132,lean:[.13,.055],phase:3.1}
];
function baseHeight(x,y){return .024*Math.sin(x*1.4+y*.5)+.012*Math.cos(y*2.2-x*.4);}
function basePose(x,y,membrane){
  const outer=membrane.sampleBase(x,y,false),inner=membrane.sampleBase(x,y,true);
  if(!outer||!inner)throw Error("Surface actor left the actual basal membrane triangles");
  const normal=outer.normal,tangent=V(1,0,0).addScaledVector(normal,-normal.x).normalize(),across=V().crossVectors(normal,tangent).normalize();
  return {position:V(x,y,(outer.z+inner.z)*.5),normal,quaternion:new THREE.Quaternion().setFromRotationMatrix(new THREE.Matrix4().makeBasis(tangent,across,normal))};
}
function center(p,z){const q=THREE.MathUtils.clamp(z/p.height,0,1),e=q*q*(3-2*q);return V(p.x+p.lean[0]*e,p.y+p.lean[1]*e,z);}
function roundedBoundary(){
  const points=[],w=1.65,h=1.08,r=.20;
  for(const [cx,cy,start]of [[w-r,h-r,0],[-w+r,h-r,Math.PI/2],[-w+r,-h+r,Math.PI],[w-r,-h+r,Math.PI*1.5]])for(let j=0;j<8;j++){const a=start+j/8*Math.PI/2;points.push(new THREE.Vector2(cx+r*Math.cos(a),cy+r*Math.sin(a)));}
  return points;
}
function buildMembrane(detail){
  const n=detail?48:28,stemSteps=detail?25:15,capSteps=detail?12:8,positions=[],uv=[],indices=[],groups=[],outer=roundedBoundary(),ports=[],basalFaces=[[],[]];
  const add=p=>{const i=positions.length/3;positions.push(...p.toArray());uv.push((p.x+1.65)/3.3,(p.y+1.08)/2.16);return i;};
  const emit=(a,b,c,reverse=false)=>reverse?indices.push(a,c,b):indices.push(a,b,c);
  let borderOuter,borderInner;
  for(const inner of [false,true]){
    const holes=PROJECTIONS.map(p=>Array.from({length:n},(_,i)=>new THREE.Vector2(p.x+(p.root-(inner?WALL:0))*Math.cos(i/n*TAU),p.y+(p.root-(inner?WALL:0))*Math.sin(i/n*TAU))));
    const contour=outer.map(p=>p.clone()),flat=[...contour,...holes.flat()],base=positions.length/3;
    for(const p of flat)add(V(p.x,p.y,baseHeight(p.x,p.y)-(inner?WALL:0)));
    if(inner)borderInner=Array.from({length:outer.length},(_,i)=>base+i);else borderOuter=Array.from({length:outer.length},(_,i)=>base+i);
    const begin=indices.length;
    for(const face of THREE.ShapeUtils.triangulateShape(contour,holes)){
      const [a,b,c]=face.map(i=>base+i),pa=V().fromArray(positions,a*3),pb=V().fromArray(positions,b*3),pc=V().fromArray(positions,c*3);
      const upward=pb.sub(pa).cross(pc.sub(pa)).z>0;emit(a,b,c,inner?upward:!upward);basalFaces[inner?1:0].push([a,b,c]);
    }
    for(let k=0;k<PROJECTIONS.length;k++){
      const p=PROJECTIONS[k],wall=inner?WALL:0,r=p.stem-wall,top=p.height-wall,shoulder=top-r,rootRing=Array.from({length:n},(_,j)=>base+outer.length+k*n+j);
      let previous=rootRing;
      const ring=(z,radius)=>{
        const c=center(p,z),ids=[];
        for(let j=0;j<n;j++){const a=j/n*TAU,xx=c.x+radius*Math.cos(a),yy=c.y+radius*Math.sin(a);ids.push(add(V(xx,yy,baseHeight(xx,yy)+z)));}
        for(let j=0;j<n;j++){const next=(j+1)%n;emit(previous[j],previous[next],ids[j],inner);emit(previous[next],ids[next],ids[j],inner);}
        previous=ids;
      };
      for(let i=1;i<=stemSteps;i++){
        const z=THREE.MathUtils.lerp(inner?-WALL:0,shoulder,i/stemSteps),q=THREE.MathUtils.smoothstep(z+(inner?WALL:0),0,.20),radius=THREE.MathUtils.lerp(p.root-wall,r,q)*(1+.018*Math.sin(z*4.3+p.phase)*q);
        ring(z,radius);
      }
      // The dome is an actual rounded cap; there is one pole, not a stack of isolated cylinders.
      for(let i=1;i<capSteps;i++){const a=i/capSteps*Math.PI/2;ring(shoulder+r*Math.sin(a),r*Math.cos(a));}
      const c=center(p,top),pole=add(V(c.x,c.y,baseHeight(c.x,c.y)+top));
      for(let j=0;j<n;j++)emit(previous[j],previous[(j+1)%n],pole,inner);
      if(!inner)ports.push({projection:k,outerRoot:rootRing});else ports[k].innerRoot=rootRing;
    }
    groups.push({start:begin,count:indices.length-begin,materialIndex:inner?1:0});
  }
  const begin=indices.length;
  for(let j=0;j<outer.length;j++){const next=(j+1)%outer.length;emit(borderOuter[j],borderInner[j],borderOuter[next]);emit(borderOuter[next],borderInner[j],borderInner[next]);}
  groups.push({start:begin,count:indices.length-begin,materialIndex:2});
  const geometry=new THREE.BufferGeometry();geometry.setAttribute("position",new THREE.Float32BufferAttribute(positions,3));geometry.setAttribute("uv",new THREE.Float32BufferAttribute(uv,2));geometry.setIndex(indices);groups.forEach(g=>geometry.addGroup(g.start,g.count,g.materialIndex));geometry.computeVertexNormals();geometry.computeBoundingBox();geometry.computeBoundingSphere();
  function sampleBase(x,y,inner){
    const p=geometry.attributes.position;
    for(const ids of basalFaces[inner?1:0]){
      const a=V().fromBufferAttribute(p,ids[0]),b=V().fromBufferAttribute(p,ids[1]),c=V().fromBufferAttribute(p,ids[2]),det=(b.y-c.y)*(a.x-c.x)+(c.x-b.x)*(a.y-c.y);
      const u=((b.y-c.y)*(x-c.x)+(c.x-b.x)*(y-c.y))/det,v=((c.y-a.y)*(x-c.x)+(a.x-c.x)*(y-c.y))/det,w=1-u-v;
      if(Math.min(u,v,w)<-1e-9)continue;
      const normal=b.clone().sub(a).cross(c.clone().sub(a)).normalize();if(normal.z<0)normal.negate();
      return {z:u*a.z+v*b.z+w*c.z,normal};
    }
    return null;
  }
  return {geometry,ports,sampleBase,outerBoundaryIndices:borderOuter,innerBoundaryIndices:borderInner};
}
function buildActin(detail){
  const pieces=[];
  for(let k=0;k<PROJECTIONS.length;k++){
    const p=PROJECTIONS[k];
    for(let strand=0;strand<5;strand++){
      const points=[];
      for(let i=0;i<=24;i++){
        const z=THREE.MathUtils.lerp(-.22,p.height-.19,i/24),c=center(p,Math.max(0,z)),a=strand/5*TAU+z*2.4+p.phase,r=.044*(1+.06*Math.sin(z*5+strand));
        c.x+=Math.cos(a)*r;c.y+=Math.sin(a)*r;c.z=z+baseHeight(c.x,c.y);points.push(c);
      }
      pieces.push(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(points),detail?48:28,.0095,detail?6:5,false));
    }
  }
  const geometry=mergeGeometries(pieces,false);for(const g of pieces)g.dispose();if(!geometry)throw Error("Actin merge failed");geometry.computeBoundingBox();geometry.computeBoundingSphere();return geometry;
}
function buildCorticalContext(detail,membrane){
  const pieces=[],base=[.59,-.66],radius=.125;
  // A qualitative cortical neighborhood, not an atomistic coupling mechanism.
  // It remains below the complete enlarged protein domains, so a released
  // symbol can cross this projected neighborhood without intersecting actin.
  for(const [start,end] of [[.08,.61],[.77,1.21],[1.42,1.87]]){
    const points=[];
    for(let i=0;i<=24;i++){
      const a=THREE.MathUtils.lerp(start,end,i/24)*Math.PI,x=base[0]+radius*Math.cos(a),y=base[1]+radius*Math.sin(a);
      const face=membrane.sampleBase(x,y,true);if(!face)throw Error("Cortical context left actual basal membrane");
      points.push(V(x,y,face.z-.13));
    }
    pieces.push(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(points),detail?32:14,.0045,detail?6:4,false));
  }
  const cortex=mergeGeometries(pieces,false);for(const g of pieces)g.dispose();
  const bundles=buildActin(detail),geometry=mergeGeometries([bundles,cortex],true);
  bundles.dispose();cortex.dispose();if(!geometry)throw Error("Actin context merge failed");
  geometry.computeBoundingBox();geometry.computeBoundingSphere();return geometry;
}
function buildLipidGlyph(detail){
  // Smooth teaching glyphs. Their curved tails are embedded in the real core;
  // a molecular-scale fluid is not reconstructed by these discrete examples.
  const head=new THREE.SphereGeometry(.0016,detail?16:7,detail?10:5),tails=[];
  head.scale(1.02,.94,.82);
  for(const sign of [-1,1]){
    const curve=new THREE.CatmullRomCurve3([V(sign*.00065,0,-.0006),V(sign*.0011,.00045,-.0026),V(sign*.00038,-.0006,-.0051),V(sign*.00132,.0002,-.0073),V(sign*.00074,.0006,-.0094),V(sign*.00105,.0001,-.0118)]);
    const g=new THREE.TubeGeometry(curve,detail?9:3,.00044,detail?6:4,false);tails.push(g);
  }
  const geometry=mergeGeometries([head,...tails],false),headIndices=head.index.count;
  for(const g of [head,...tails])g.dispose();if(!geometry)throw Error("Lipid glyph merge failed");
  geometry.clearGroups();geometry.addGroup(0,headIndices,0);geometry.addGroup(headIndices,geometry.index.count-headIndices,1);
  geometry.computeBoundingBox();geometry.computeBoundingSphere();return geometry;
}
function lipidPlacements(detail,membrane){
  // Minimum-distance disordered packing avoids the repeated row/column board.
  // A separate seed is used here; it never consumes either actor's motion RNG.
  const rows=[],points=[],target=detail?1150:99,spacing=detail?.00340:.0128,cell=spacing/Math.SQRT2,bins=new Map(),random=rng(detail?0x1f89a31:0x2aa9b31),matrix=new THREE.Matrix4();
  const key=(i,j)=>i+':'+j;
  function accept(x,y){const gx=Math.floor((x-LIPID_BAND.x[0])/cell),gy=Math.floor((y-LIPID_BAND.y[0])/cell);for(let i=gx-2;i<=gx+2;i++)for(let j=gy-2;j<=gy+2;j++)for(const p of bins.get(key(i,j))??[])if((p[0]-x)**2+(p[1]-y)**2<spacing*spacing)return false;const p=[x,y];points.push(p);const k=key(gx,gy);if(!bins.has(k))bins.set(k,[]);bins.get(k).push(p);return true;}
  // The two artificial long cut edges also carry a non-periodic series of heads.
  if(detail)for(const y of LIPID_BAND.y){let x=LIPID_BAND.x[0];while(x<LIPID_BAND.x[1]){accept(x,y);x+=spacing*(1.02+random.next()*.35);}}
  for(let trials=0;points.length<target&&trials<250000;trials++)accept(THREE.MathUtils.lerp(...LIPID_BAND.x,random.next()),THREE.MathUtils.lerp(...LIPID_BAND.y,random.next()));
  if(points.length<target)throw Error('Disordered lipid packing did not converge');
  for(const side of [1,-1])for(let i=0;i<points.length;i++){
    const [px,y]=points[i],x=side<0?-px:px,sample=membrane.sampleBase(x,y,side<0);if(!sample)throw Error("Lipid band left actual basal membrane");
    const spin=random.next()*TAU,size=.96+.07*random.next(),tailScale=.88+.16*random.next(),normal=sample.normal.clone().multiplyScalar(side),along=V(1,0,0).addScaledVector(normal,-normal.x).normalize().applyAxisAngle(normal,spin),across=V().crossVectors(normal,along).normalize();
    matrix.makeBasis(along,across,normal);matrix.scale(V(size,size,tailScale));matrix.setPosition(x,y,sample.z);
    rows.push({matrix:matrix.clone(),side,xy:[x,y],normal:normal.toArray()});
  }
  return rows;
}
function buildLipidCore(detail,membrane){
  // A continuous hydrophobic material volume, not an aqueous inter-leaflet gap.
  // Its two interfaces follow samples of the same real basal wall triangles.
  const nx=detail?64:16,ny=detail?8:2,p=[],ix=[],depth=[],stride=nx+1,layer=stride*(ny+1);
  for(const inner of [false,true])for(let j=0;j<=ny;j++)for(let i=0;i<=nx;i++){
    const x=THREE.MathUtils.lerp(...LIPID_BAND.x,i/nx),y=THREE.MathUtils.lerp(...LIPID_BAND.y,j/ny),s=membrane.sampleBase(x,y,inner);
    if(!s)throw Error("Hydrophobic core left actual membrane");
    const q=V(x,y,s.z).addScaledVector(s.normal,inner?.0035:-.0035);p.push(...q.toArray());depth.push(inner?1:0);
  }
  for(let j=0;j<ny;j++)for(let i=0;i<nx;i++){
    const a=j*stride+i,b=a+1,c=a+stride,d=c+1;ix.push(a,b,c,b,d,c,layer+a,layer+c,layer+b,layer+b,layer+c,layer+d);
  }
  const rim=[];for(let i=0;i<=nx;i++)rim.push(i);for(let j=1;j<=ny;j++)rim.push(j*stride+nx);for(let i=nx-1;i>=0;i--)rim.push(ny*stride+i);for(let j=ny-1;j>0;j--)rim.push(j*stride);
  for(let i=0;i<rim.length;i++){const a=rim[i],b=rim[(i+1)%rim.length];ix.push(a,layer+a,b,b,layer+a,layer+b);}
  const g=new THREE.BufferGeometry();g.setAttribute("position",new THREE.Float32BufferAttribute(p,3));g.setAttribute("coreDepth",new THREE.Float32BufferAttribute(depth,1));g.setIndex(ix);g.computeVertexNormals();g.computeBoundingBox();g.computeBoundingSphere();return g;
}
function symbolGeometry(detail,index){
  const profile=index===0?[[-.084,0],[-.076,.014],[-.058,.029],[-.038,.025],[-.026,.012],[-.018,.011],[.018,.011],[.030,.025],[.050,.031],[.068,.027],[.083,.013],[.090,0]]:[[-.082,0],[-.073,.010],[-.058,.018],[-.036,.013],[-.022,.007],[-.018,.007],[.018,.007],[.035,.020],[.053,.034],[.072,.027],[.091,.012],[.096,0]],sides=detail?36:20,p=[0,0,profile[0][0]],ix=[];
  for(let i=1;i<profile.length-1;i++)for(let j=0;j<sides;j++){const a=j/sides*TAU,[z,r]=profile[i],f=1+(index===0?.20:.10)*Math.cos(a*(index===0?3:2)+z*21+index);p.push(Math.cos(a)*r*f,Math.sin(a)*r*f*.76,z);}
  const end=p.length/3;p.push(0,0,profile.at(-1)[0]);const ring=(i,j)=>1+i*sides+(j+sides)%sides;
  for(let j=0;j<sides;j++){ix.push(0,ring(0,j+1),ring(0,j));for(let i=0;i<profile.length-3;i++){const a=ring(i,j),b=ring(i,j+1),c=ring(i+1,j),d=ring(i+1,j+1);ix.push(a,b,c,b,d,c);}ix.push(ring(profile.length-3,j),ring(profile.length-3,j+1),end);}
  const g=new THREE.BufferGeometry();g.setAttribute("position",new THREE.Float32BufferAttribute(p,3));g.setIndex(ix);g.computeVertexNormals();
  if(index===0){
    const pieces=[g];for(let k=0;k<6;k++){const a=k/6*TAU,h=new THREE.CylinderGeometry(.0031,.0036,.056,detail?8:5,2,false);h.deleteAttribute("uv");h.rotateX(Math.PI/2);h.rotateY(.10*Math.cos(a));h.translate(.014*Math.cos(a),.014*Math.sin(a)*.76,0);pieces.push(h);}
    const bundle=mergeGeometries(pieces,false);for(const piece of pieces)piece.dispose();if(!bundle)throw Error("Transmembrane bundle merge failed");bundle.computeBoundingBox();bundle.computeBoundingSphere();return bundle;
  }
  g.computeBoundingBox();g.computeBoundingSphere();return g;
}
function rng(seed){let value=seed>>>0;return {next(){value^=value<<13;value^=value>>>17;value^=value<<5;return(value>>>0)/4294967296;},get state(){return value>>>0;}};}
function reflect(value,min,max){const length=max-min,period=length*2;let v=((value-min)%period+period)%period;return min+(v<=length?v:period-v);}
export function createCellSurfacePatch({detail=true}={}){
  detail=Boolean(detail);const group=new THREE.Group();group.name="RepresentativeMacrophageMicrovilliPatch";group.userData={organelleId:CELL_SURFACE_PATCH_ID,teachingOnly:true,finitePatch:true,section:0};
  const membraneLODs={near:buildMembrane(true),far:buildMembrane(false)};
  let currentLOD=detail?"near":"far",lodMode="auto",membrane=membraneLODs[currentLOD],lastProjectedCSS=null,lodChanges=0,lodReason="initial-constructor-detail";
  const materials=[
    new THREE.MeshPhysicalMaterial({color:"#9cbdc0",roughness:.34,metalness:0,clearcoat:.30,clearcoatRoughness:.25,transmission:.12,thickness:WALL,ior:1.34,side:THREE.DoubleSide}),
    new THREE.MeshPhysicalMaterial({color:"#afc7bc",roughness:.43,metalness:0,clearcoat:.16,clearcoatRoughness:.34,side:THREE.DoubleSide}),
    new THREE.MeshStandardMaterial({color:"#d3b58d",roughness:.61,metalness:0,side:THREE.DoubleSide})
  ];
  for(const m of materials)m.userData.atlasMaterialRole="membrane";
  const wall=new THREE.Mesh(membrane.geometry,materials);wall.name="ContinuousMicrovilliMembraneWall";wall.userData={organelleId:CELL_SURFACE_PATCH_ID,componentKey:"microvilli",shell:true,boundaryRole:"Single finite membrane wall, outer and cytoplasmic boundary faces with artificial edge cuts",sharedPorts:membrane.ports};group.add(wall);
  const actinLODs={near:buildCorticalContext(true,membraneLODs.near),far:buildCorticalContext(false,membraneLODs.far)};
  const actinMaterials=[new THREE.MeshPhysicalMaterial({color:"#c6a177",roughness:.52,metalness:0,clearcoat:.12,clearcoatRoughness:.38}),new THREE.MeshPhysicalMaterial({color:"#bd9763",roughness:.63,metalness:0,clearcoat:.08})];
  const actin=new THREE.Mesh(actinLODs[currentLOD],actinMaterials);actin.name="CytoplasmicActinBundlesIntoMicrovilli";actin.userData={organelleId:CELL_SURFACE_PATCH_ID,componentKey:"actin",atlasMaterialRole:"protein",identity:"Fifteen teaching core filaments and three basal cortical arcs; no atomic actin or explicit picket/adaptor machinery"};group.add(actin);
  const actors=[
    {name:"SurfaceDiffusionProteinFree",seed:0x2f6e2b1,x:-.70,y:-.67,mode:"free",color:"#b590ad"},
    {name:"SurfaceDiffusionProteinConfined",seed:0x6d8a2f5,x:.59,y:-.66,mode:"confined",color:"#b9a073"}
  ].map((a,i)=>{const geometries={near:symbolGeometry(true,i),far:symbolGeometry(false,i)},mesh=new THREE.Mesh(geometries[currentLOD],new THREE.MeshPhysicalMaterial({color:a.color,roughness:.46,metalness:0,clearcoat:.23,clearcoatRoughness:.30}));mesh.name=a.name;mesh.userData={organelleId:CELL_SURFACE_PATCH_ID,componentKey:"membrane-proteins",atlasMaterialRole:"protein",seed:a.seed,motionMode:a.mode,identity:"Generic transmembrane placement symbol, not a named protein or measured particle"};group.add(mesh);return{...a,base:[a.x,a.y],random:rng(a.seed),mesh,geometries,moves:0,rejections:0};});
  const lipidLODs={near:buildLipidGlyph(true),far:buildLipidGlyph(false)},lipidRows={near:lipidPlacements(true,membraneLODs.near),far:lipidPlacements(false,membraneLODs.far)},coreLODs={near:buildLipidCore(true,membraneLODs.near),far:buildLipidCore(false,membraneLODs.far)};
  const lipidMaterials=[new THREE.MeshPhysicalMaterial({color:"#c0d7d4",roughness:.28,metalness:0,clearcoat:.30,clearcoatRoughness:.22,specularIntensity:.68}),new THREE.MeshPhysicalMaterial({color:"#c9af86",roughness:.38,metalness:0,clearcoat:.12,specularIntensity:.55})];
  const coreMaterial=new THREE.MeshPhysicalMaterial({color:"#ffffff",roughness:.34,metalness:0,clearcoat:.18,clearcoatRoughness:.30,transmission:.24,thickness:.003,ior:1.38,side:THREE.DoubleSide});
  coreMaterial.onBeforeCompile=shader=>{
    shader.vertexShader=shader.vertexShader.replace('#include <common>','#include <common>\nattribute float coreDepth; varying float vCoreDepth;').replace('#include <begin_vertex>','#include <begin_vertex>\nvCoreDepth=coreDepth;');
    shader.fragmentShader=shader.fragmentShader.replace('#include <common>','#include <common>\nvarying float vCoreDepth;').replace('#include <color_fragment>','#include <color_fragment>\nfloat coreInterior=smoothstep(.13,.55,sin(3.14159265*clamp(vCoreDepth,0.,1.))); diffuseColor.rgb*=mix(vec3(.76,.86,.84),vec3(.83,.72,.55),coreInterior);');
  };
  coreMaterial.customProgramCacheKey=()=> 'diagnostic-lipid-core-interface-v2';
  for(const m of [...lipidMaterials,coreMaterial,...actors.map(a=>a.mesh.material)])m.userData.membraneStaticV1=true;
  const core=new THREE.Mesh(coreLODs[currentLOD],coreMaterial);core.name="ContinuousHydrophobicCoreDiagnosticBand";core.userData={organelleId:CELL_SURFACE_PATCH_ID,componentKey:"microvilli",atlasMaterialRole:"membrane",identity:"Continuous teaching hydrophobic material between local leaflet interfaces; not an aqueous lumen",diagnosticOnly:true};group.add(core);
  const lipids=new THREE.InstancedMesh(lipidLODs[currentLOD],lipidMaterials,lipidRows.near.length);
  lipids.name="TwoLeafletHeadTailDiagnosticBand";lipids.userData={organelleId:CELL_SURFACE_PATCH_ID,componentKey:"microvilli",atlasMaterialRole:"membrane",identity:"Small teaching phospholipid head/two-tail band on two actual membrane faces; not a molecular simulation",bilayer:true,headGroup:0,tailGroup:1};group.add(lipids);
  const focus=V(0,.03,.51),p=PROJECTIONS[0],bandMiddle=basePose(0,-1.005,membraneLODs.near),anchors={focus,inside:V(p.x,p.y,baseHeight(p.x,p.y)-.21),insideTarget:V(p.x-.027,p.y+.014,.58),surfaceTarget:V(-.70,-.67,baseHeight(-.70,-.67)),lateral:V(-.02,-1.95,1.265),lateralTarget:V(-.02,-.65,-.035),bilayer:bandMiddle.position.clone().add(V(.035,-.17,.012)),bilayerTarget:bandMiddle.position.clone()};
  const localPlane=new THREE.Plane(V(0,1,0),-1.35),worldPlane=localPlane.clone();let section=0,disposed=false,elapsedInput=0,steps=0,observationMode=false;
  const allMaterials=[...materials,...actinMaterials,...actors.map(a=>a.mesh.material),...lipidMaterials,coreMaterial];
  function applySection(){group.updateWorldMatrix(true,false);worldPlane.copy(localPlane).applyMatrix4(group.matrixWorld);for(const m of allMaterials){const active=section>.002;if(Boolean(m.clippingPlanes?.length)!==active)m.needsUpdate=true;m.clippingPlanes=active?[worldPlane]:null;}}
  function poseActors(){for(const a of actors){const pose=basePose(a.x,a.y,membrane);a.mesh.position.copy(pose.position);a.mesh.quaternion.copy(pose.quaternion);a.mesh.userData.surfaceUV=[a.x,a.y];a.mesh.userData.surfaceNormal=pose.normal.toArray();a.mesh.userData.motionMode=a.mode;a.mesh.userData.motionStep=steps;}actinMaterials[1].color.set(steps<RELEASE_STEP?"#bd9763":"#91a5aa");group.userData.corticalContextPhase=steps<RELEASE_STEP?"constraint-neighborhood":"teaching-release";}
  function oneStep(){
    for(let i=0;i<actors.length;i++){
      const a=actors[i],other=actors[1-i],angle=a.random.next()*TAU;
      let x=a.x+Math.cos(angle)*WALK_STEP,y=a.y+Math.sin(angle)*WALK_STEP;
      if(i===1&&steps<RELEASE_STEP){const dx=x-a.base[0],dy=y-a.base[1],r=Math.hypot(dx,dy),limit=.078;if(r>limit){const reflected=2*limit-r;x=a.base[0]+dx/r*reflected;y=a.base[1]+dy/r*reflected;}a.mode="confined";}else a.mode=i===0?"free":"released";
      x=reflect(x,-1.33,1.33);y=reflect(y,-.91,-.43);
      // A display-only exclusion guard keeps the two enlarged glyphs from interpenetrating.
      // It is not a molecular interaction potential or an aggregation mechanism.
      if(Math.hypot(x-other.x,y-other.y)<.14)a.rejections++;else{a.x=x;a.y=y;a.moves++;}
    }
    steps++;
    actors[1].mode=steps<RELEASE_STEP?"confined":"released";
  }
  function setSection(amount){if(disposed)return;section=THREE.MathUtils.clamp(Number(amount)||0,0,1);localPlane.constant=-THREE.MathUtils.lerp(1.35,-.15,section);group.userData.section=section;applySection();}
  function update(_t,dt=0){if(disposed)return;if(Number.isFinite(dt)&&dt>0){elapsedInput+=dt;const target=Math.floor((elapsedInput+1e-9)/FIXED_STEP);while(steps<target)oneStep();poseActors();}if(section>.002)applySection();}
  function motionState(){return{elapsedInput,completedSteps:steps,fixedStep:FIXED_STEP,nominalStepLength:WALK_STEP,releaseAfterSteps:RELEASE_STEP,releaseAfterSeconds:RELEASE_STEP*FIXED_STEP,corticalContextPhase:group.userData.corticalContextPhase,actors:actors.map(a=>({name:a.name,seed:a.seed,rngState:a.random.state,xy:[a.x,a.y],base:[...a.base],mode:a.mode,moves:a.moves,rejections:a.rejections,surfaceNormal:[...a.mesh.userData.surfaceNormal]}))};}
  function seek(seconds){
    if(disposed)throw Error("Surface patch is disposed");
    if(!Number.isFinite(seconds)||seconds<0||seconds>MAX_SEEK_SECONDS)throw RangeError("seek requires finite seconds in [0,3600]");
    elapsedInput=seconds;steps=0;
    for(const a of actors){a.x=a.base[0];a.y=a.base[1];a.random=rng(a.seed);a.mode=a.name.endsWith("Free")?"free":"confined";a.moves=0;a.rejections=0;}
    const target=Math.floor((seconds+1e-9)/FIXED_STEP);while(steps<target)oneStep();poseActors();if(section>.002)applySection();return motionState();
  }
  function replay(){return seek(0);}
  const stats={detail,microvilli:3,actinFilaments:15,corticalArcs:3,membraneMeshes:1,membraneWallThickness:WALL,artificialPatchEdge:true,randomSeeds:actors.map(a=>a.seed),fixedStepSeconds:FIXED_STEP,nominalStepLength:WALK_STEP,releaseAfterSeconds:RELEASE_STEP*FIXED_STEP};
  function updateStats(){
    stats.activeLOD=currentLOD;stats.lodMode=lodMode;stats.membraneTriangles=wall.geometry.index.count/3;stats.actinTriangles=actin.geometry.index.count/3;
    stats.symbolTriangles=actors.reduce((sum,a)=>sum+a.mesh.geometry.index.count/3,0);stats.lipidGlyphTriangles=lipids.geometry.index.count/3;stats.lipidInstances=lipids.count;
    stats.diagnosticCoreTriangles=core.geometry.index.count/3;stats.diagnosticCoreMeshes=1;stats.lipidExpandedTriangles=stats.lipidGlyphTriangles*lipids.count;stats.triangles=stats.membraneTriangles+stats.actinTriangles+stats.symbolTriangles+stats.lipidExpandedTriangles+stats.diagnosticCoreTriangles;
    stats.drawCalls=wall.geometry.groups.length+actin.geometry.groups.length+actors.length+lipids.geometry.groups.length+1;
  }
  function applyLOD(next,reason){
    const changed=next!==currentLOD;currentLOD=next;membrane=membraneLODs[next];wall.geometry=membrane.geometry;wall.userData.sharedPorts=membrane.ports;
    actin.geometry=actinLODs[next];for(const a of actors)a.mesh.geometry=a.geometries[next];
    core.geometry=coreLODs[next];lipids.geometry=lipidLODs[next];lipids.count=lipidRows[next].length;for(let i=0;i<lipids.count;i++)lipids.setMatrixAt(i,lipidRows[next][i].matrix);
    lipids.instanceMatrix.needsUpdate=true;lipids.computeBoundingBox();lipids.computeBoundingSphere();
    // The near continuum is a translucent location guide, while the diagnostic
    // band is real head/tail geometry. Transparency is not claimed as MD optics.
    for(let i=0;i<materials.length;i++){
      const m=materials[i],near=observationMode,transparent=observationMode;
      if(m.transparent!==transparent)m.needsUpdate=true;m.transparent=transparent;m.opacity=near?[.28,.22,.55][i]:1;m.depthWrite=!near;
      if(m.isMeshPhysicalMaterial)m.transmission=near?0:(i===0?.12:0);
    }
    if(changed)lodChanges++;lodReason=reason;group.userData.renderLOD=next;group.userData.renderLODMode=lodMode;
    poseActors();applySection();updateStats();return getLODState();
  }
  function getLODState(){return{observationMode,mode:lodMode,active:currentLOD,changes:lodChanges,reason:lodReason,projectedDiameterCSS:lastProjectedCSS,thresholds:{...LOD_THRESHOLDS},usesPixelRatio:false,vertices:wall.geometry.attributes.position.count,membraneTriangles:wall.geometry.index.count/3,diagnosticCoreTriangles:core.geometry.index.count/3,lipidGlyphTriangles:lipids.geometry.index.count/3,lipidInstances:lipids.count,expandedTriangles:stats.triangles,drawCalls:stats.drawCalls,geometryUUIDs:{wall:wall.geometry.uuid,actin:actin.geometry.uuid,free:actors[0].mesh.geometry.uuid,confined:actors[1].mesh.geometry.uuid,lipids:lipids.geometry.uuid,core:core.geometry.uuid},intrinsicMotionUnchangedByLOD:true};}
  function setObservationMode(enabled){observationMode=Boolean(enabled);applyLOD(currentLOD,"user-observation-mode");return getLODState();}
  function setRenderLOD(mode){if(disposed)throw Error("Surface patch is disposed");if(!["auto","near","far"].includes(mode))throw RangeError("LOD mode must be auto, near or far");lodMode=mode;return applyLOD(mode==="auto"?currentLOD:mode,"explicit-mode:"+mode);}
  function updateLOD({camera,viewportHeightCSS,force}={}){
    if(disposed)throw Error("Surface patch is disposed");
    if(force!=null){if(!["near","far"].includes(force))throw RangeError("LOD force must be near or far");return applyLOD(force,"explicit-force");}
    if(lodMode!=="auto")return getLODState();
    if(!camera?.isPerspectiveCamera||!Number.isFinite(viewportHeightCSS)||viewportHeightCSS<=0)throw TypeError("Automatic LOD requires a perspective camera and positive CSS viewport height");
    group.updateWorldMatrix(true,false);camera.updateWorldMatrix(true,false);
    const center=V(0,.03,.51).applyMatrix4(group.matrixWorld),distance=Math.max(1e-6,camera.getWorldPosition(V()).distanceTo(center)),scale=group.matrixWorld.getMaxScaleOnAxis();
    lastProjectedCSS=2*1.98*scale*viewportHeightCSS/(2*Math.tan(THREE.MathUtils.degToRad(camera.fov*.5))*distance);
    const next=currentLOD==="near"?(lastProjectedCSS<LOD_THRESHOLDS.exitNearCSS?"far":"near"):(lastProjectedCSS>LOD_THRESHOLDS.enterNearCSS?"near":"far");
    return next===currentLOD?getLODState():applyLOD(next,"projected-css-hysteresis");
  }
  function dispose(){if(disposed)return;disposed=true;const gs=new Set([...Object.values(membraneLODs).map(x=>x.geometry),...Object.values(actinLODs),...Object.values(lipidLODs),...Object.values(coreLODs),...actors.flatMap(a=>Object.values(a.geometries))]),ms=new Set(allMaterials);for(const g of gs)g.dispose();for(const m of ms)m.dispose();lipids.dispose();group.clear();}
  applyLOD(currentLOD,"initial-constructor-detail");setSection(0);group.updateMatrixWorld(true);const bounds=new THREE.Box3().setFromObject(group),sphere=bounds.getBoundingSphere(new THREE.Sphere());
  const facts=["代表性小鼠巨噬细胞表面教学局部，三根微绒毛与同一质膜连续；不是ER、刷状缘或整胞ruffle的替身。","肌动蛋白束从胞质延入突起；这里的内部属于胞质，脂质膜壁不是水腔。","自由样与暂受限后释放符号使用独立种子、同尺度固定随机步；只在播放时前进，轨迹与时间均非实测扩散。","所有局部独立放大，不能与PDB骨架示例比较真实尺寸；有限局部裁边也不是生理封口。"];
  const metadata={teachingOnly:true,sources:SOURCES.map(s=>({...s})),guide:CELL_SURFACE_PATCH_GUIDE,sectionPlaneSpace:"group-local plane transformed once to world",microKind:"cytoplasmic-view-into-microvillus; not lipid-wall water cavity",finitePatchBoundary:"Artificial perimeter cut joins the two membrane-wall faces; the cytoplasmic space remains open below the patch",wallBoundaryMaterialIndices:{outer:0,cytoplasmic:1,artificialCut:2},sharedPorts:membrane.ports,projections:PROJECTIONS.map(a=>({...a,lean:[...a.lean]})),motion:{independentSeeds:true,fixedStepSeconds:FIXED_STEP,nominalStepLength:WALK_STEP,releaseAfterSeconds:RELEASE_STEP*FIXED_STEP,confinedRadius:.078,observationBounds:{x:[-1.33,1.33],y:[-.91,-.43]},notMeasured:true,symbolExclusionRadius:.14},sourceImageReuse:"CIL facts used for morphology scope only; no source pixels, segmentation or image derivatives embedded",notes:["CIL13091 describes mouse macrophage surface folds and microvilli; not a universal human brush border.","The 2024 ERM study supports context-dependent macrophage cortical organization; its quantified microvilli-like SEM panels are progenitors, not evidence that every macrophage needs ERM for microvilli."]};
  facts.push("小段双叶诊断带有真实头部/双尾教学几何；半透明连续壁仅作区室位置参照，不是额外一套双层。","三条基底actin弧给出定性限制邻域；未模拟栅栏/适配分子和真实释放动力学。近远档改变实际几何与实例数。");
  metadata.membraneRepresentation={continuumWall:"Unchanged finite closed material volume; not a water cavity",diagnosticBand:"Two minimum-distance disordered smooth head layers, variable orientation kinked twin tails, and continuous hydrophobic core with thin boundary tint",bandBounds:{x:[...LIPID_BAND.x],y:[...LIPID_BAND.y]},headRadius:.0016,tailLength:LIPID_BAND.tailLength,translucentWallNear:false,userControlledObservation:true,molecularDynamics:false,staticStage1:true,proteinShapes:["Generic multipass bundle/transporter-like symbol","Generic single-pass receptor-like symbol"],anchorsChanged:false,actorMotionsAndSeedsUnchanged:true};
  metadata.motion={...metadata.motion,callerOwnedClock:true,absoluteTDoesNotSeek:true,seekMaximumSeconds:MAX_SEEK_SECONDS,replayResetsPlaying:false,corticalRestriction:"Qualitative neighborhood; no explicit picket or adaptor machinery",releaseState:"Chosen teaching release, not measured actin kinetics"};
  metadata.viewSemantics={inside:"Cytoplasmic view into representative microvillus",lateral:"External oblique comparison of two anchored symbols",bilayer:"External edge view of a phospholipid diagnostic band; not a water lumen"};
  metadata.lod={realGeometry:true,instanceCounts:{near:lipidRows.near.length,far:lipidRows.far.length},thresholds:{...LOD_THRESHOLDS},callerMustUpdateView:true,forceNearForMicroscopicViews:true};
  metadata.guide=CELL_SURFACE_PATCH_GUIDE;
  return{group,radius:sphere.radius,anchors,setSection,update,seek,replay,setObservationMode,setRenderLOD,updateLOD,getLODState,dispose,stats,facts,metadata,motionState};
}
