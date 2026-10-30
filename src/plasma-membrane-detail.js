import * as THREE from 'three';
import {mergeGeometries} from 'three/addons/utils/BufferGeometryUtils.js';
const V=(x=0,y=0,z=0)=>new THREE.Vector3(x,y,z),TAU=Math.PI*2;
const rand32=seed=>{let x=seed>>>0;return()=>((x=Math.imul(x,1664525)+1013904223>>>0)/4294967296);};
const clamp=THREE.MathUtils.clamp;
function meshGeometry(positions,indices,colors=null){const g=new THREE.BufferGeometry();g.setAttribute('position',new THREE.Float32BufferAttribute(positions,3));if(colors)g.setAttribute('color',new THREE.Float32BufferAttribute(colors,3));const uv=[];for(let i=0;i<positions.length;i+=3)uv.push(positions[i],positions[i+1]);g.setAttribute('uv',new THREE.Float32BufferAttribute(uv,2));g.setIndex(indices);g.computeVertexNormals();g.computeBoundingBox();g.computeBoundingSphere();return g;}
function matte(color,extra={}){const m=new THREE.MeshPhysicalMaterial({color,roughness:.69,metalness:0,clearcoat:.018,clearcoatRoughness:.76,specularIntensity:.38,envMapIntensity:.46,side:THREE.DoubleSide,...extra});m.userData.membraneStaticV1=true;return m;}
function reliefTexture(){const n=128,a=new Uint8Array(n*n*4);for(let y=0;y<n;y++)for(let x=0;x<n;x++){const t=.46*Math.sin(x*.53+Math.sin(y*.23))+.31*Math.sin(y*.71+x*.18)+.18*Math.cos(x*1.77-y*1.31),k=(y*n+x)*4;a[k]=a[k+1]=a[k+2]=Math.round(195+16*t);a[k+3]=255;}const t=new THREE.DataTexture(a,n,n);t.wrapS=t.wrapT=THREE.RepeatWrapping;t.repeat.set(4,3);t.generateMipmaps=true;t.minFilter=THREE.LinearMipmapLinearFilter;t.needsUpdate=true;return t;}
function planarDomain(bounds,holes,detail,cornerRadius=0){const [x0,x1]=bounds.x,[y0,y1]=bounds.y,r=Math.min(cornerRadius,(x1-x0)/2,(y1-y0)/2),contour=r>0?[[x1-r,y0+r,-Math.PI/2],[x1-r,y1-r,0],[x0+r,y1-r,Math.PI/2],[x0+r,y0+r,Math.PI]].flatMap(([x,y,start])=>Array.from({length:detail?7:5},(_,i)=>{const a=start+i/(detail?6:4)*Math.PI/2;return new THREE.Vector2(x+r*Math.cos(a),y+r*Math.sin(a));})):[new THREE.Vector2(x0,y0),new THREE.Vector2(x1,y0),new THREE.Vector2(x1,y1),new THREE.Vector2(x0,y1)],outerN=contour.length,circleN=detail?40:24,circles=holes.map(h=>Array.from({length:circleN},(_,j)=>new THREE.Vector2(h.x+h.radius*Math.cos(j/circleN*TAU),h.y+h.radius*Math.sin(j/circleN*TAU)))),xy=[...contour,...circles.flat()].map(p=>[p.x,p.y]);let tris=THREE.ShapeUtils.triangulateShape(contour,circles);const loops=[Array.from({length:outerN},(_,i)=>i),...holes.map((_,k)=>Array.from({length:circleN},(_,j)=>outerN+k*circleN+j))];
 for(let level=0;level<(detail?3:2);level++){const cache=new Map(),mid=(a,b)=>{const key=a<b?a+':'+b:b+':'+a;if(cache.has(key))return cache.get(key);const id=xy.length;xy.push([(xy[a][0]+xy[b][0])*.5,(xy[a][1]+xy[b][1])*.5]);cache.set(key,id);return id;},next=[];for(const [a,b,c]of tris){const ab=mid(a,b),bc=mid(b,c),ca=mid(c,a);next.push([a,ab,ca],[ab,b,bc],[ca,bc,c],[ab,bc,ca]);}for(let k=0;k<loops.length;k++){const old=loops[k],l=[];for(let j=0;j<old.length;j++)l.push(old[j],mid(old[j],old[(j+1)%old.length]));loops[k]=l;}tris=next;}
 tris=tris.map(t=>{const a=xy[t[0]],b=xy[t[1]],c=xy[t[2]];return((b[0]-a[0])*(c[1]-a[1])-(b[1]-a[1])*(c[0]-a[0]))>0?t:[t[0],t[2],t[1]];});return{xy,tris,loops};}
// A geometric solid bounded by two actual offset faces and shared indexed side walls.
function slab(domain,surface,normalAt,lo,hi,color){const {xy,tris,loops}=domain,p=[],ix=[],col=[],baseColor=new THREE.Color(color);for(const off of [hi,lo])for(const [x,y]of xy){const a=surface(x,y).clone().addScaledVector(normalAt(x,y),off);p.push(...a.toArray());const k=1+.022*Math.sin(x*13.1+y*7.3)+.012*Math.sin(y*31-x*11);col.push(k,k,k);}const n=xy.length;for(const [a,b,c]of tris){ix.push(a,b,c,a+n,c+n,b+n);}for(let l=0;l<loops.length;l++){const loop=loops[l],area=loop.reduce((s,a,j)=>{const b=loop[(j+1)%loop.length];return s+xy[a][0]*xy[b][1]-xy[b][0]*xy[a][1];},0),ordered=(l===0?area>0:area<0)?loop:[...loop].reverse();for(let j=0;j<ordered.length;j++){const a=ordered[j],b=ordered[(j+1)%ordered.length];ix.push(a,b+n,b,a,a+n,b+n);}}const g=meshGeometry(p,ix,col);g.userData={layerInterval:[lo,hi],closedMaterialVolume:true,artificialOuterPerimeter:true,proteinApertures:loops.length-1};return g;}
function tailGeometry(thickness,detail){
 const positions=[],indices=[],sides=detail?8:6,rows=detail?12:9,radius=thickness*.041,length=thickness*.285;
 // The two acyl roots meet the same glycerol/head region. One chain is drawn
 // relatively extended and the other has a representative cis-unsaturation
 // bend. This is a readable molecular envelope, not one lipid species imposed
 // on the measured composition of a macrophage membrane.
 const centre=(u,side)=>{
  const fork=THREE.MathUtils.smoothstep(u,0,.22),bend=side>0?THREE.MathUtils.smoothstep(u,.40,.78):0;
  return V(side*thickness*(.046+.036*fork)+thickness*(.006*Math.sin(u*5.3+side)+.063*bend),thickness*(.007*Math.sin(u*4.1+side)+.020*bend),-u*length);
 };
 for(const side of[-1,1]){
  const base=positions.length/3;
  for(let i=0;i<=rows;i++){const u=i/rows,c=centre(u,side),r=radius*(1-.28*u);for(let j=0;j<sides;j++){const a=j/sides*TAU;positions.push(c.x+r*Math.cos(a),c.y+r*Math.sin(a),c.z);}}
  for(let i=0;i<rows;i++)for(let j=0;j<sides;j++){const k=(j+1)%sides,a=base+i*sides+j,b=base+i*sides+k,c=base+(i+1)*sides+j,d=base+(i+1)*sides+k;indices.push(a,b,c,b,d,c);}
  const first=positions.length/3;positions.push(...centre(0,side).toArray());const last=positions.length/3;positions.push(...centre(1,side).toArray());
  for(let j=0;j<sides;j++){const k=(j+1)%sides;indices.push(first,base+k,base+j,last,base+rows*sides+j,base+rows*sides+k);}
 }
 for(let i=0;i<indices.length;i+=3)[indices[i+1],indices[i+2]]=[indices[i+2],indices[i+1]];
 const geometry=meshGeometry(positions,indices);geometry.userData={twoClosedTailChains:true,axis:'local -Z toward bilayer interior',localRootNormalOffset:0,localTipNormalOffset:-length,nominalRadius:radius,nominalRootHalfSeparation:thickness*.046,glycerolForkEnvelope:true,representativeCisBend:true,notLipidomicComposition:true,chainRepresentation:'Two coarse acyl envelopes sharing a head region; one extended and one bent. No atoms, double-bond positions, species proportions or measured packing are implied.'};return geometry;
}
const sectionBounds=new WeakMap();
const sectionWork={calls:0,boundsRejected:0,trianglesVisited:0,trianglesRejected:0};
function sourceSectionBounds(source){
 const position=source.attributes.position,index=source.index;let cached=sectionBounds.get(source);
 if(!cached||cached.position!==position||cached.index!==index){cached={position,index,version:-1,vertices:Uint32Array.from(new Set(index.array)),box:new THREE.Box3()};sectionBounds.set(source,cached);}
 if(cached.version!==position.version){const b=cached.box;b.makeEmpty();for(const i of cached.vertices){const x=position.getX(i),y=position.getY(i),z=position.getZ(i);b.min.x=Math.min(b.min.x,x);b.min.y=Math.min(b.min.y,y);b.min.z=Math.min(b.min.z,z);b.max.x=Math.max(b.max.x,x);b.max.y=Math.max(b.max.y,y);b.max.z=Math.max(b.max.z,z);}cached.version=position.version;}
 return cached.box;
}
function capGeometry(source,plane){
 const a=source.attributes.position,ix=source.index,segments=[],tmp=[V(),V(),V()],eps=1e-8;sectionWork.calls++;
 // Reject only when a conservative indexed-part AABB cannot meet the plane.
 // Far extracellular domains do not need a new triangle intersection each frame.
 const bounds=sourceSectionBounds(source),n=plane.normal,c=plane.constant;
 const cx=(bounds.min.x+bounds.max.x)*.5,cy=(bounds.min.y+bounds.max.y)*.5,cz=(bounds.min.z+bounds.max.z)*.5;
 const radius=Math.abs(n.x)*(bounds.max.x-bounds.min.x)*.5+Math.abs(n.y)*(bounds.max.y-bounds.min.y)*.5+Math.abs(n.z)*(bounds.max.z-bounds.min.z)*.5;
 if(bounds.isEmpty()||Math.abs(n.x*cx+n.y*cy+n.z*cz+c)>radius+eps){sectionWork.boundsRejected++;return meshGeometry([],[]);}
 for(let k=0;k<ix.count;k+=3){
  sectionWork.trianglesVisited++;const i0=ix.getX(k),i1=ix.getX(k+1),i2=ix.getX(k+2);
  const d0=n.x*a.getX(i0)+n.y*a.getY(i0)+n.z*a.getZ(i0)+c,d1=n.x*a.getX(i1)+n.y*a.getY(i1)+n.z*a.getZ(i1)+c,d2=n.x*a.getX(i2)+n.y*a.getY(i2)+n.z*a.getZ(i2)+c;
  if(d0>eps&&d1>eps&&d2>eps||d0< -eps&&d1< -eps&&d2< -eps){sectionWork.trianglesRejected++;continue;}
  tmp[0].fromBufferAttribute(a,i0);tmp[1].fromBufferAttribute(a,i1);tmp[2].fromBufferAttribute(a,i2);
  const d=[d0,d1,d2],hits=[];for(let j=0;j<3;j++){const q=(j+1)%3;if((d[j]>eps&&d[q]<-eps)||(d[j]<-eps&&d[q]>eps))hits.push(tmp[j].clone().lerp(tmp[q],d[j]/(d[j]-d[q])));else if(Math.abs(d[j])<=eps)hits.push(tmp[j].clone());}const unique=hits.filter((p,i)=>hits.findIndex(q=>q.distanceToSquared(p)<1e-16)===i);if(unique.length===2&&unique[0].distanceToSquared(unique[1])>1e-16)segments.push(unique);
 }
 if(!segments.length)return meshGeometry([],[]);const tangent=Math.abs(plane.normal.z)<.8?V(0,0,1).cross(plane.normal).normalize():V(1,0,0).cross(plane.normal).normalize(),across=plane.normal.clone().cross(tangent).normalize(),nodes=[],map=new Map(),adj=[];const id=p=>{const coordinates=p.toArray(),cell=coordinates.map(v=>Math.round(v*1e6)),key=cell.join(',');if(map.has(key))return map.get(key);const nearby=coordinates.map((v,i)=>{const delta=v*1e6-cell[i];return Math.abs(Math.abs(delta)-.5)<=.001?[cell[i],cell[i]+Math.sign(delta)]:[cell[i]];});for(const x of nearby[0])for(const y of nearby[1])for(const z of nearby[2]){const existing=map.get(x+','+y+','+z);if(existing!==undefined&&nodes[existing].distanceToSquared(p)<=1e-18){map.set(key,existing);return existing;}}const index=nodes.length;map.set(key,index);nodes.push(p);adj.push([]);return index;};for(const [p,q]of segments){const a=id(p),b=id(q);if(a===b)continue;adj[a].push(b);adj[b].push(a);}const used=new Set(),loops=[];for(let start=0;start<nodes.length;start++){if(used.has(start)||adj[start].length!==2)continue;const loop=[];let cur=start,prev=-1;for(let guard=0;guard<nodes.length+2;guard++){const neighbours=adj[cur];if(used.has(cur)||!neighbours)break;used.add(cur);loop.push(cur);const next=neighbours.find(x=>x!==prev);if(next===undefined)break;prev=cur;cur=next;if(cur===start)break;}if(cur===start&&loop.length>=3)loops.push(loop);}
 const flat=loops.map(ids=>ids.map(i=>new THREE.Vector2(nodes[i].dot(tangent),nodes[i].dot(across)))),inside=(p,poly)=>{let c=false;for(let i=0,j=poly.length-1;i<poly.length;j=i++)if((poly[i].y>p.y)!==(poly[j].y>p.y)&&p.x<(poly[j].x-poly[i].x)*(p.y-poly[i].y)/(poly[j].y-poly[i].y)+poly[i].x)c=!c;return c;},areas=flat.map(poly=>Math.abs(THREE.ShapeUtils.area(poly))),parent=flat.map((poly,i)=>{let p=-1,area=Infinity;for(let j=0;j<flat.length;j++)if(areas[j]>areas[i]&&areas[j]<area&&inside(poly[0],flat[j])){p=j;area=areas[j];}return p;}),depth=parent.map((_,i)=>{let d=0,j=parent[i];while(j>=0){d++;j=parent[j];}return d;}),positions=[],indices=[];
 for(let i=0;i<loops.length;i++){if(depth[i]%2)continue;const children=loops.map((_,j)=>j).filter(j=>parent[j]===i&&depth[j]%2),all=[i,...children],base=positions.length/3;for(const l of all)for(const n of loops[l])positions.push(...nodes[n].clone().addScaledVector(plane.normal,.00002).toArray());const tris=THREE.ShapeUtils.triangulateShape(flat[i].map(p=>p.clone()),children.map(j=>flat[j].map(p=>p.clone())));for(const t of tris)indices.push(base+t[0],base+t[2],base+t[1]);}const f32=new Float32Array(positions),clean=[],pa=V(),pb=V(),pc=V();for(let k=0;k<indices.length;k+=3){const a=indices[k],b=indices[k+1],c=indices[k+2];pa.fromArray(f32,a*3);pb.fromArray(f32,b*3);pc.fromArray(f32,c*3);const cross=pb.sub(pa).cross(pc.sub(pa));if(cross.lengthSq()<1e-20)continue;if(cross.dot(plane.normal)<0)clean.push(a,b,c);else clean.push(a,c,b);}const colors=new Float32Array(f32.length);colors.fill(1);return meshGeometry(f32,clean,colors);}
// Material section faces of the actual molecular instances. These are not
// projected symbols: each contour comes from the source triangles in its true frame.
function instanceSectionGeometry(instanced,plane){
 const positions=[],indices=[],colors=[],g=instanced.geometry,p=g.attributes.position,mat=new THREE.Matrix4(),centre=V(),v=V(),c=new THREE.Color();g.computeBoundingSphere();let intersected=0;
 for(let i=0;i<instanced.count;i++){
  instanced.getMatrixAt(i,mat);centre.copy(g.boundingSphere.center).applyMatrix4(mat);const radius=g.boundingSphere.radius*mat.getMaxScaleOnAxis();if(Math.abs(plane.distanceToPoint(centre))>radius+1e-7)continue;
  const transformed=new Float32Array(p.count*3);for(let j=0;j<p.count;j++)v.fromBufferAttribute(p,j).applyMatrix4(mat).toArray(transformed,j*3);
  const section=capGeometry({attributes:{position:new THREE.BufferAttribute(transformed,3)},index:g.index},plane),a=section.attributes.position,ix=section.index;if(!ix.count){section.dispose();continue;}intersected++;
  if(instanced.instanceColor)instanced.getColorAt(i,c);else c.setRGB(1,1,1);const base=positions.length/3;
  for(let j=0;j<a.count;j++){v.fromBufferAttribute(a,j).addScaledVector(plane.normal,-.00001);positions.push(...v.toArray());colors.push(c.r,c.g,c.b);}
  for(let j=0;j<ix.count;j++)indices.push(base+ix.getX(j));section.dispose();
 }
 const result=meshGeometry(positions,indices,colors);result.userData={actualInstanceTrianglePlaneIntersection:true,intersectedInstances:intersected,displayPlaneOffset:.00001};return result;
}
function softenHeadGeometry(g){
 const p=g.attributes.position;
 for(let i=0;i<p.count;i++){const x=p.getX(i),y=p.getY(i),z=p.getZ(i),k=1+.015*Math.sin(x*3.1+y*2.3+z*2.2)+.008*Math.sin(y*4.2-x*2.2);p.setXYZ(i,x*k,y*k,z*k);}
 g.computeVertexNormals();g.computeBoundingBox();g.computeBoundingSphere();g.userData={roundedHydrophilicHead:true,notAnAtomicSurface:true,unitShape:'Near-spherical; normal radius comes from each 3D instance, not a flattened disc'};return g;
}
export function createDenseLipidPatch({surface=(x,y)=>V(x,y,.105*x*x+.058*y*y+.052*Math.sin(x*1.5+y*.55)+.025*Math.sin(y*2.6-x*.65)),normal=null,bounds={x:[-1.55,1.55],y:[-1.12,1.12]},thickness=.12,detail=true,holes=[],seed=7319,spacing=detail?.059:.100,sectionSampleY=null,cornerRadius=0}={}){
 if(!(thickness>0))throw Error('Positive bilayer thickness required');const normalAt=normal??((x,y)=>{const e=1e-4,dx=surface(x+e,y).clone().sub(surface(x-e,y)),dy=surface(x,y+e).clone().sub(surface(x,y-e));return dx.cross(dy).normalize();}),domain=planarDomain(bounds,holes,detail,cornerRadius),half=thickness/2,coreHalf=thickness*.305,group=new THREE.Group();group.name='ContinuousDensePlasmaBilayer';const map=reliefTexture(),headMat=matte('#9bbec6',{vertexColors:true,bumpMap:map,bumpScale:.00030}),innerMat=matte('#c4a59d',{vertexColors:true,bumpMap:map,bumpScale:.00028}),coreMat=matte('#cdb991',{vertexColors:true,roughness:.76,clearcoat:0,transmission:0,thickness:.010,ior:1.34,bumpMap:map,bumpScale:.00020});for(const m of [headMat,innerMat,coreMat])m.userData.atlasMaterialRole='membrane';
 const random=rand32(seed),headRows=[],tailRows=[],sectionSampleIndices=[],[x0,x1]=bounds.x,[y0,y1]=bounds.y,packingBySide=new Map(),cellSize=spacing*.80;
 const key=(x,y)=>Math.floor((x-x0)/cellSize)+','+Math.floor((y-y0)/cellSize);
 const excluded=(x,y,r)=>x-r<x0||x+r>x1||y-r<y0||y+r>y1||cornerRadius>0&&Math.hypot(x-clamp(x,x0+cornerRadius,x1-cornerRadius),y-clamp(y,y0+cornerRadius,y1-cornerRadius))>cornerRadius-r||holes.some(h=>Math.hypot(x-h.x,y-h.y)<h.radius+r+.010);
 function near(packing,x,y){const gx=Math.floor((x-x0)/cellSize),gy=Math.floor((y-y0)/cellSize);for(let i=-1;i<=1;i++)for(let j=-1;j<=1;j++)for(const item of packing.get((gx+i)+','+(gy+j))??[]){const d=spacing*.80;if((x-item.xy[0])**2+(y-item.xy[1])**2<d*d)return true;}return false;}
 function place(x,y,side,pick,sectionSample,packing){
  const r=Math.min(spacing*(.34+.055*pick()),thickness*.245);if(excluded(x,y,r)||near(packing,x,y))return false;
  const n=normalAt(x,y).clone().multiplyScalar(side),normalRadius=Math.min(r*(.84+.08*pick()),thickness*.205),normalOffset=coreHalf+normalRadius*(.56+.10*pick())+(pick()-.5)*thickness*.010,base=surface(x,y).clone(),point=base.clone().addScaledVector(n,normalOffset),basis=new THREE.Quaternion().setFromUnitVectors(V(0,0,1),n),roll=pick()*TAU,tilt=(pick()-.5)*.24,axis=V(Math.cos(roll),Math.sin(roll),0),rotation=basis.clone().multiply(new THREE.Quaternion().setFromAxisAngle(axis,tilt)).multiply(new THREE.Quaternion().setFromAxisAngle(V(0,0,1),roll)),aspect=.94+pick()*.12;
  const matrix=new THREE.Matrix4().compose(point,rotation,V(r,r*aspect,normalRadius)),tailBaseOffset=Math.min(coreHalf-thickness*.012,normalOffset-normalRadius*.86)+(pick()-.5)*thickness*.002,tailRotation=basis.clone().multiply(new THREE.Quaternion().setFromAxisAngle(axis,(pick()-.5)*.16)).multiply(new THREE.Quaternion().setFromAxisAngle(V(0,0,1),pick()*TAU)),tailScale=V(.94+pick()*.10,.94+pick()*.10,.96+pick()*.07),tailPoint=base.clone().addScaledVector(n,tailBaseOffset),row={matrix,color:new THREE.Color(side>0?'#a8d3df':'#dfa99e').multiplyScalar(.975+pick()*.05),xy:[x,y],side,r,normalRadius,normalOffset,tailBaseOffset,sectionSample};
  if(sectionSample)sectionSampleIndices.push(headRows.length);headRows.push(row);tailRows.push(new THREE.Matrix4().compose(tailPoint,tailRotation,tailScale));const k=key(x,y),items=packing.get(k)??[];items.push(row);packing.set(k,items);return true;
 }
 const perLeafLimit=Math.floor((x1-x0)*(y1-y0)/(spacing*spacing*1.05));
 for(const side of[1,-1]){
  const packing=new Map();packingBySide.set(side,packing);const start=headRows.length;
  // These are actual heterogeneous samples, not a line of centre-cut coins.
  // Each leaflet has independent x positions, depth through the cut and tilt.
  if(sectionSampleY!==null){const pick=rand32(seed+(side>0?7117:19493));for(let x=x0+spacing*.85;x<x1-spacing*.85;x+=spacing*(1.08+.46*pick()))place(x+(pick()-.5)*spacing*.26,sectionSampleY+(pick()-.5)*spacing*.48,side,pick,true,packing);}
  // Bounded random sequential packing removes the hexagonal row lattice.
  // The existing resolution sets an upper count; this never adds molecules
  // merely to conceal a scale/shape problem.
  for(let attempt=0;attempt<perLeafLimit*36&&headRows.length-start<perLeafLimit;attempt++)place(x0+random()*(x1-x0),y0+random()*(y1-y0),side,random,false,packing);
 }
 // Reorient a subset of existing section samples, never add or clone molecules.
 // These actual source instances sit just behind the default material cut so
 // both inward chains can be seen through its separately translucent cap.
 const tailGeo=tailGeometry(thickness,detail),representativeSectionIndices=[],referencePlane=sectionSampleY===null?null:new THREE.Plane(V(0,1,0),-sectionSampleY);
 if(referencePlane){
  const originalScale=V(),oldPoint=V(),oldRotation=new THREE.Quaternion(),oldTailRotation=new THREE.Quaternion(),tailScale=V(),vertex=V(),minimumSeparation=spacing*.80;
  for(const index of sectionSampleIndices){
   const row=headRows[index],[oldX,oldY]=row.xy,oldNormal=normalAt(oldX,oldY).clone().multiplyScalar(row.side),oldBasis=new THREE.Quaternion().setFromUnitVectors(V(0,0,1),oldNormal);
   row.matrix.decompose(oldPoint,oldRotation,originalScale);tailRows[index].decompose(oldPoint,oldTailRotation,tailScale);let placed=false;
   for(const depth of [.11,.14,.085,.17])for(const dx of [0,-.12,.12,-.22,.22]){
    if(placed)continue;const x=oldX+dx*spacing,y=sectionSampleY+thickness*depth;
    if(Math.hypot(x-oldX,y-oldY)>spacing*.53||excluded(x,y,row.r)||headRows.some((other,j)=>j!==index&&other.side===row.side&&(x-other.xy[0])**2+(y-other.xy[1])**2<minimumSeparation**2-1e-12))continue;
    const n=normalAt(x,y).clone().multiplyScalar(row.side),base=surface(x,y),basis=new THREE.Quaternion().setFromUnitVectors(V(0,0,1),n),headRotation=basis.clone().multiply(oldBasis.clone().invert()).multiply(oldRotation),tangent=V(1,0,0).addScaledVector(n,-n.x).normalize(),across=n.clone().cross(tangent).normalize(),tailRotation=new THREE.Quaternion().setFromRotationMatrix(new THREE.Matrix4().makeBasis(tangent,across,n)).multiply(new THREE.Quaternion().setFromAxisAngle(V(0,1,0),.035*Math.sin(index*1.7))).multiply(new THREE.Quaternion().setFromAxisAngle(V(0,0,1),.045*Math.sin(index*2.3))),tailPoint=base.clone().addScaledVector(n,row.tailBaseOffset),tailMatrix=new THREE.Matrix4().compose(tailPoint,tailRotation,tailScale);
    let minDistance=Infinity;for(let j=0;j<tailGeo.attributes.position.count;j++){vertex.fromBufferAttribute(tailGeo.attributes.position,j).applyMatrix4(tailMatrix);minDistance=Math.min(minDistance,referencePlane.distanceToPoint(vertex));}
    if(minDistance<thickness*.008)continue;
    row.xy=[x,y];row.matrix.compose(base.clone().addScaledVector(n,row.normalOffset),headRotation,originalScale);row.sectionRepresentative=true;row.minimumTailRetainedDistance=minDistance;tailRows[index].copy(tailMatrix);representativeSectionIndices.push(index);placed=true;
   }
  }
  for(const packing of packingBySide.values())packing.clear();for(const row of headRows){const packing=packingBySide.get(row.side),k=key(...row.xy),items=packing.get(k)??[];items.push(row);packing.set(k,items);}
 }
 const slabSpecs=[{name:'ContinuousOuterHydrophilicLeaflet',lo:coreHalf,hi:half,mat:headMat,color:'#c2dce1',side:1},{name:'ContinuousHydrophobicCore',lo:-coreHalf,hi:coreHalf,mat:coreMat,color:'#dfcda9',side:0},{name:'ContinuousInnerHydrophilicLeaflet',lo:-half,hi:-coreHalf,mat:innerMat,color:'#dfbbb2',side:-1}],boundaryIds=new Set(domain.loops.flat());
 function waterFaceOffset(x,y,side){
  const gx=Math.floor((x-x0)/cellSize),gy=Math.floor((y-y0)/cellSize),packing=packingBySide.get(side);let weight=0;
  for(let i=-1;i<=1;i++)for(let j=-1;j<=1;j++)for(const item of packing.get((gx+i)+','+(gy+j))??[]){const d2=(x-item.xy[0])**2+(y-item.xy[1])**2;weight=Math.max(weight,Math.exp(-d2/(item.r*item.r*1.65)));}
  const band=half-coreHalf,body=coreHalf+band*(.32+.32*weight+.025*Math.sin(x*7.1+y*5.3));let rim=Math.min(x-x0,x1-x,y-y0,y1-y);if(cornerRadius>0)rim=Math.min(rim,cornerRadius-Math.hypot(x-clamp(x,x0+cornerRadius,x1-cornerRadius),y-clamp(y,y0+cornerRadius,y1-cornerRadius)));for(const h of holes)rim=Math.min(rim,Math.hypot(x-h.x,y-h.y)-h.radius);const blend=THREE.MathUtils.smoothstep(rim,0,spacing*.8);return THREE.MathUtils.lerp(half,body,blend);
 }
 const slabs=slabSpecs.map(data=>{
  const geometry=slab(domain,surface,normalAt,data.lo,data.hi,data.color),positions=geometry.attributes.position,n=domain.xy.length;let actualLo=data.lo,actualHi=data.hi,waterMin=Infinity,waterMax=-Infinity;
  if(data.side){const first=data.side>0?0:n;for(let i=0;i<n;i++){const[x,y]=domain.xy[i],magnitude=boundaryIds.has(i)?half:waterFaceOffset(x,y,data.side),offset=data.side*magnitude,q=surface(x,y).clone().addScaledVector(normalAt(x,y),offset);positions.setXYZ(first+i,q.x,q.y,q.z);waterMin=Math.min(waterMin,offset);waterMax=Math.max(waterMax,offset);}actualLo=data.side>0?coreHalf:waterMin;actualHi=data.side>0?waterMax:-coreHalf;geometry.computeVertexNormals();geometry.computeBoundingBox();geometry.computeBoundingSphere();}
  geometry.userData={...geometry.userData,layerInterval:[data.lo,data.hi],nominalLayerInterval:[data.lo,data.hi],actualNormalOffsetRange:[actualLo,actualHi],sharedCoreInterface:data.side?data.side*coreHalf:null,waterFaceOffsetRange:data.side?[waterMin,waterMax]:null,waterFaceCorrugated:Boolean(data.side),proteinRimOffsetsUnchanged:true,intervalMeaning:'Nominal material interval; shared core interfaces and protein rims remain exact. Only the water-facing hydrophilic face recedes within this interval. Molecular head envelopes extend into water.'};
  const mesh=new THREE.Mesh(geometry,data.mat);mesh.name=data.name;mesh.userData={organelleId:'membrane',componentKey:'membrane',shell:true,teachingOnly:true,materialVolume:data.name};group.add(mesh);return mesh;
 });
 const headGeometry=softenHeadGeometry(new THREE.SphereGeometry(1,detail?18:12,detail?12:8)),headGlyphMaterial=matte('#ffffff',{roughness:.73,clearcoat:.015,clearcoatRoughness:.76}),tailMaterial=matte('#b49a6d',{roughness:.72,clearcoat:0}),heads=new THREE.InstancedMesh(headGeometry,headGlyphMaterial,headRows.length),tails=new THREE.InstancedMesh(tailGeo,tailMaterial,tailRows.length);heads.name='TwoPhospholipidHeadLeaflets';tails.name='HydrophobicFattyAcidTails';for(let i=0;i<headRows.length;i++){heads.setMatrixAt(i,headRows[i].matrix);heads.setColorAt(i,headRows[i].color);tails.setMatrixAt(i,tailRows[i]);}for(const o of [heads,tails]){o.instanceMatrix.needsUpdate=true;o.userData={organelleId:'membrane',componentKey:'membrane',shell:true,teachingOnly:true};o.computeBoundingBox();o.computeBoundingSphere();group.add(o);}
 // Transparency belongs to the artificial cut face only; its source solid
 // keeps the same material, thickness, protein apertures and closed triangles.
 const coreSectionMaterial=coreMat.clone();coreSectionMaterial.transparent=true;coreSectionMaterial.opacity=.24;coreSectionMaterial.transmission=0;coreSectionMaterial.depthWrite=false;coreSectionMaterial.depthTest=true;coreSectionMaterial.forceSinglePass=true;coreSectionMaterial.userData={...coreMat.userData,artificialCutTransparency:true,sourceSolidUnchanged:true};
 const caps=slabs.map(o=>{const cap=new THREE.Mesh(meshGeometry([],[]),o===slabs[1]?coreSectionMaterial:o.material);cap.name=o.name+'SectionCap';cap.visible=false;cap.userData={organelleId:'membrane',componentKey:'membrane',shell:true,artificialCut:true};group.add(cap);return{source:o,cap};});
 const sectionHeadMaterial=headGlyphMaterial.clone();sectionHeadMaterial.vertexColors=true;sectionHeadMaterial.userData.membraneStaticV1=true;sectionHeadMaterial.roughness=.52;sectionHeadMaterial.clearcoat=.04;sectionHeadMaterial.emissive.set('#90bbc2');sectionHeadMaterial.emissiveIntensity=.04;const sectionTailMaterial=tailMaterial.clone();sectionTailMaterial.roughness=.54;sectionTailMaterial.clearcoat=.02;for(const material of [sectionHeadMaterial,sectionTailMaterial]){material.polygonOffset=true;material.polygonOffsetFactor=-1;material.polygonOffsetUnits=-2;material.userData.membraneStaticV1=true;}
 const lipidCaps=[{source:heads,material:sectionHeadMaterial,name:'ActualPhospholipidHeadSectionFaces'},{source:tails,material:sectionTailMaterial,name:'ActualInwardDoubleTailSectionFaces'}].map(data=>{const cap=new THREE.Mesh(meshGeometry([],[],[]),data.material);cap.name=data.name;cap.visible=false;cap.userData={organelleId:'membrane',componentKey:'membrane',shell:true,artificialCut:true,actualMolecularSection:true};group.add(cap);return{source:data.source,cap};});
 const boundary=(index,off=0)=>domain.loops[index+1].map(i=>{const [x,y]=domain.xy[i];return surface(x,y).clone().addScaledVector(normalAt(x,y),off);});
 function onSection(amount,plane){for(const {source,cap}of caps){cap.visible=amount>.002;if(amount<=.002)continue;const next=capGeometry(source.geometry,plane);cap.geometry.dispose();cap.geometry=next;}for(const {source,cap}of lipidCaps){cap.visible=amount>.002;if(amount<=.002)continue;const next=instanceSectionGeometry(source,plane);cap.geometry.dispose();cap.geometry=next;}}
 return{group,surface,normalAt,layerIntervals:slabSpecs.map(s=>[s.lo,s.hi]),bounds,thickness,half,coreHalf,holes,domain,holeBoundary:boundary,headRows,membraneMeshes:slabs,heads,tails,caps,lipidCaps,sectionSampleIndices,representativeSectionIndices,onSection,materials:[headMat,innerMat,coreMat,coreSectionMaterial,headGlyphMaterial,tailMaterial,sectionHeadMaterial,sectionTailMaterial],stats:{dense:true,denseDetail:Boolean(detail),headInstances:headRows.length,twoTailMolecules:tailRows.length,continuumLayers:3,nominalFullThickness:thickness,hydrophobicCoreThickness:2*coreHalf,disorderedSampling:'Bounded random sequential packing; independently staggered leaflets and heterogeneous real section samples; not a measured molecular configuration',actualProteinApertures:holes.length,selectedSectionLipidExamples:sectionSampleIndices.length,selectedSectionY:sectionSampleY,retainedSectionRepresentativeMolecules:representativeSectionIndices.length,coreArtificialSectionOpacity:.24,representativeSourceInstancesOnly:true,headEnvelopeOutsideNominalWaterFace:true,nominalIntervalsHaveCorrugatedWaterFaces:true,molecularSectionRepresentation:'Actual instance triangle-plane intersection faces embedded in the filled continuous matrix'},dispose(){const gs=new Set(),ms=new Set(),ts=new Set();group.traverse(o=>{if(o.isInstancedMesh)o.dispose();if(o.geometry)gs.add(o.geometry);for(const m of [o.material].flat())if(m){ms.add(m);for(const v of Object.values(m))if(v?.isTexture)ts.add(v);}});gs.forEach(g=>g.dispose());ms.forEach(m=>m.dispose());ts.forEach(t=>t.dispose());group.clear();}};
}
// Smooth only the solvent-exposed domains; the entire actual core remains a
// constant matched aperture, including every inserted longitudinal ring.
function smoothProteinProfile(rows,half,sub=4){
 const out=[];for(let i=0;i<rows.length-1;i++)for(let j=0;j<sub;j++){
  const u=j/sub,[za,ra]=rows[i],[zb,rb]=rows[i+1],z=THREE.MathUtils.lerp(za,zb,u),r0=rows[Math.max(0,i-1)][1],r3=rows[Math.min(rows.length-1,i+2)][1],m0=(rb-r0)*.5,m1=(r3-ra)*.5,u2=u*u,u3=u2*u;
  const r=Math.abs(z)<=half+1e-10?1:Math.max(0,(2*u3-3*u2+1)*ra+(u3-2*u2+u)*m0+(-2*u3+3*u2)*rb+(u3-u2)*m1);out.push([z,r]);
 }out.push(rows.at(-1));return out;
}
// Chosen coarse structural envelopes; no sequence, atom or stoichiometry data.
function proteinVertexColors(positions){const colors=[];for(let i=0;i<positions.length;i+=3){const q=.98+.022*Math.sin(positions[i]*11+positions[i+1]*6+positions[i+2]*9);colors.push(q,q,q);}return colors;}
function receptorPartGeometry(patch,index,lo,hi){
 const h=patch.holes[index],half=patch.half,whole=smoothProteinProfile([[-.30,0],[-.28,.65],[-.23,1.35],[-.17,1.65],[-.11,1.0],[-half,1],[0,1],[half,1],[.10,.88],[.16,1.45],[.23,1.40],[.30,1.20],[.35,1.0],[.40,1.18],[.47,1.35],[.54,.95],[.58,0]],half),profile=whole.filter(r=>r[0]>=lo-1e-9&&r[0]<=hi+1e-9),n=patch.domain.loops[index+1].length,p=[],ix=[],records=[];
 for(const [z,scale]of profile){const outside=Math.max(0,Math.abs(z)-half),bend=z>half?.045*Math.sin((z-half)*4.2):z< -half?-.045*Math.sin((-z-half)*6):0,lean=z>half?.018*Math.sin((z-half)*6.2):0,begin=p.length/3;
  if(scale===0){p.push(...patch.surface(h.x+bend,h.y+lean).clone().addScaledVector(patch.normalAt(h.x+bend,h.y+lean),z).toArray());records.push({start:begin,count:1});}
  else{for(let j=0;j<n;j++){const xy=patch.domain.xy[patch.domain.loops[index+1][j]],a=Math.atan2(xy[1]-h.y,xy[0]-h.x),domain=z>=.10&&z<=.58,local=domain?(z<.35?(z-.10)/.25:(z-.35)/.23):0,face=domain?Math.sin(Math.PI*local)**2:0,lobe=domain?1+.022*face*Math.cos(2*a):1+Math.min(.12,outside*.7)*Math.cos(3*a+z*7),ecc=Math.min(.14,outside*.8),x=h.x+(xy[0]-h.x)*scale*lobe*(1+ecc+.12*face)+bend,y=h.y+(xy[1]-h.y)*scale*lobe*(1-ecc*.55-.30*face)+lean,v=patch.surface(x,y).clone().addScaledVector(patch.normalAt(x,y),z);p.push(...v.toArray());}records.push({start:begin,count:n});}
 }
 for(let k=0;k<records.length-1;k++)for(let j=0;j<n;j++){const next=(j+1)%n,a=records[k],b=records[k+1];if(a.count===1)ix.push(a.start,b.start+next,b.start+j);else if(b.count===1)ix.push(a.start+j,a.start+next,b.start);else ix.push(a.start+j,a.start+next,b.start+j,a.start+next,b.start+next,b.start+j);}
 for(const [k,sign]of [[0,-1],[records.length-1,1]]){const r=records[k];if(r.count===1)continue;const centre=V();for(let j=0;j<n;j++)centre.add(V().fromArray(p,(r.start+j)*3));centre.divideScalar(n);const c=p.length/3;p.push(...centre.toArray());for(let j=0;j<n;j++){const a=r.start+j,b=r.start+(j+1)%n;if(sign<0)ix.push(c,b,a);else ix.push(c,a,b);}}
 const g=meshGeometry(p,ix,proteinVertexColors(p));g.userData={closedCoarseEnvelope:true,normalInterval:[lo,hi],lipidMatchedHole:index};if(lo===-half&&hi===half)g.userData.incoreVertexStarts=[-half,0,half].map(z=>records[profile.findIndex(r=>Math.abs(r[0]-z)<1e-9)].start);return g;
}
// Named topology teaching models. Geometry is procedural; no atomic coordinates.
function mappedGeometry(geometry,patch,offset=V(),scale=V(1,1,1)){
 const a=geometry.attributes.position,p=V();for(let i=0;i<a.count;i++){p.fromBufferAttribute(a,i).multiply(scale).add(offset);const q=patch.surface(p.x,p.y).addScaledVector(patch.normalAt(p.x,p.y),p.z);a.setXYZ(i,q.x,q.y,q.z);}geometry.computeVertexNormals();geometry.computeBoundingBox();geometry.computeBoundingSphere();geometry.setAttribute('color',new THREE.Float32BufferAttribute(new Float32Array(a.count*3).fill(1),3));return geometry;
}
function ellipsoid(patch,centre,radii,detail){return mappedGeometry(new THREE.SphereGeometry(1,detail?20:12,detail?14:8),patch,centre,radii);}
// Broad paired faces suggest an Ig beta-sandwich domain. These are coarse
// domain volumes, not invented atom positions or an interpolated PDB surface.
function igDomain(patch,centre,radii,detail,rotation=null,tint=1){
 const g=new THREE.SphereGeometry(1,detail?24:16,detail?16:10),a=g.attributes.position,p=V();
 for(let i=0;i<a.count;i++){
  p.fromBufferAttribute(a,i);p.y=Math.sign(p.y)*Math.pow(Math.abs(p.y),.70);p.x+=.065*p.z*(1-p.z*p.z);p.multiply(radii);if(rotation)p.applyQuaternion(rotation);p.add(centre);a.setXYZ(i,p.x,p.y,p.z);
 }
 mappedGeometry(g,patch);if(tint!==1){const c=g.attributes.color;for(let i=0;i<c.count;i++)c.setXYZ(i,tint,tint,tint);}
 return g;
}
function combineProteinDomains(parts){const g=mergeGeometries(parts,false);if(!g)throw Error('Protein domain attributes differ');parts.forEach(p=>p.dispose());g.computeBoundingBox();g.computeBoundingSphere();return g;}
function iggFcGeometry(patch,fc,detail){
 const parts=[];
 for(const side of[-1,1]){
  // CH2 is adjacent to the lower hinge/receptor-binding region; the paired
  // CH3 domains are farther from the Fab arms. The solvent cleft stays open.
  const tint=side<0?.94:1.04;
  parts.push(igDomain(patch,fc.clone().add(V(-.003,side*.027,.025)),V(.066,.024,.055),detail,null,tint));
  parts.push(igDomain(patch,fc.clone().add(V(.008,side*.024,-.055)),V(.045,.022,.040),detail,null,tint));
  parts.push(parameterTube(patch,[fc.clone().add(V(.006,side*.025,-.029)),fc.clone().add(V(.002,side*.028,-.003))],.013,detail));
 }
 return combineProteinDomains(parts);
}
function iggFabGeometry(patch,fc,side,detail){
 const start=fc.clone().add(V(.03,0,.04)),end=fc.clone().add(V(.15,side*.105,.20)),axis=end.clone().sub(start).normalize(),rotation=new THREE.Quaternion().setFromUnitVectors(V(0,0,1),axis),cross=V(1,0,0).applyQuaternion(rotation),parts=[];
 for(const t of[.32,.76])for(const chain of[-1,1]){
  const centre=start.clone().lerp(end,t).addScaledVector(cross,chain*.018);
  parts.push(igDomain(patch,centre,V(.022,.028,.050),detail,rotation,chain<0?.95:1.04));
 }
 parts.push(parameterTube(patch,[fc.clone().add(V(0,side*.027,.050)),start,start.clone().lerp(end,.35)],.014,detail));
 return combineProteinDomains(parts);
}
function closedTube(points,radius,detail){
 const curve=new THREE.CatmullRomCurve3(points,false,'centripetal'),rows=detail?32:20,sides=detail?10:8,frames=curve.computeFrenetFrames(rows,false),p=[],ix=[];
 for(let i=0;i<=rows;i++){const c=curve.getPointAt(i/rows);for(let j=0;j<sides;j++){const a=j/sides*TAU,q=c.clone().addScaledVector(frames.normals[i],radius*Math.cos(a)).addScaledVector(frames.binormals[i],radius*Math.sin(a));p.push(...q.toArray());}}
 for(let i=0;i<rows;i++)for(let j=0;j<sides;j++){const k=(j+1)%sides,a=i*sides+j,b=i*sides+k,c=(i+1)*sides+j,d=(i+1)*sides+k;ix.push(a,b,c,b,d,c);}
 for(const [row,sign]of[[0,-1],[rows,1]]){const c=p.length/3;p.push(...curve.getPointAt(row/rows).toArray());for(let j=0;j<sides;j++){const a=row*sides+j,b=row*sides+(j+1)%sides;if(sign<0)ix.push(c,b,a);else ix.push(c,a,b);}}
 // Frenet normal/binormal pair gives the opposite tube side winding above.
 let volume=0;for(let i=0;i<ix.length;i+=3){const [a,b,c]=[ix[i],ix[i+1],ix[i+2]].map(n=>V().fromArray(p,n*3));volume+=a.dot(b.cross(c))/6;}if(volume<0)for(let i=0;i<ix.length;i+=3)[ix[i+1],ix[i+2]]=[ix[i+2],ix[i+1]];
 return meshGeometry(p,ix,proteinVertexColors(p));
}
function parameterTube(patch,points,radius,detail){return mappedGeometry(closedTube(points,radius,detail),patch);}
function mergeNamed(parts,name,metadata={}){
 const geometry=mergeGeometries(parts.map(p=>p.geometry),true);if(!geometry)throw Error('Named protein merge failed');geometry.computeBoundingBox();geometry.computeBoundingSphere();if(metadata.namedProtein==='FCGR2A')smoothCoincidentNormals(geometry);const materials=parts.map(p=>{const m=matte(p.color,{vertexColors:true,roughness:.62,clearcoat:.025});m.userData={...m.userData,coarseEnvelopeRole:p.role,notAtomic:true,namedProtein:true};return m;});const mesh=new THREE.Mesh(geometry,materials);mesh.name=name;mesh.userData={componentKey:'membrane-proteins',teachingOnly:true,namedProtein:true,proceduralTopologyModel:true,...metadata};let vertexOffset=0;const descriptors=[];
 for(let i=0;i<parts.length;i++){const part=parts[i],g=part.geometry,region=geometry.groups[i];if(g.userData.incoreVertexStarts)geometry.userData.incoreVertexStarts=g.userData.incoreVertexStarts.map(x=>x+vertexOffset);if(g.userData.apertureSamples){geometry.userData.apertureSamples??=[];geometry.userData.apertureSamples.push(...g.userData.apertureSamples.map(a=>({boundaryIndex:a.boundaryIndex,vertices:a.vertices.map(x=>x+vertexOffset)})));}descriptors.push({mesh,geometry:{attributes:geometry.attributes,index:new THREE.BufferAttribute(geometry.index.array.subarray(region.start,region.start+region.count),1)},material:materials[i],id:part.id,role:part.role,sourceGroup:i});vertexOffset+=g.attributes.position.count;g.dispose();}
 return{mesh,parts:descriptors};
}
// Each biological subunit has one peripheral TM1 envelope and one pore-lining
// TM2 envelope. These are deliberately coarse packing volumes, not helix atoms.
// A common smooth envelope is sampled on both sides of each domain join.
// The three lobes follow the existing trimer; no new molecular identity is added.
function profileValue(rows,z,column){
 if(z<=rows[0][0])return rows[0][column];if(z>=rows.at(-1)[0])return rows.at(-1)[column];let i=0;while(rows[i+1][0]<z)i++;const a=rows[i],b=rows[i+1],h=b[0]-a[0],u=(z-a[0])/h,u2=u*u,u3=u2*u,lo=rows[Math.max(0,i-1)],hi=rows[Math.min(rows.length-1,i+2)],m0=i?(b[column]-lo[column])/(b[0]-lo[0]):0,m1=i+1<rows.length-1?(hi[column]-a[column])/(hi[0]-a[0]):0;return(2*u3-3*u2+1)*a[column]+(u3-2*u2+u)*h*m0+(-2*u3+3*u2)*b[column]+(u3-u2)*h*m1;
}
const p2xEnvelopeProfiles=new WeakMap();
function p2xProfileRows(patch){let rows=p2xEnvelopeProfiles.get(patch);if(!rows){const half=patch.half;rows=[[-.42,.45,.06,.046],[-.39,.70,.12,.055],[-.33,.85,.20,.062],[-.23,1.00,.22,.065],[-.13,1.06,.07,.061],[-.10,1,.025,.061],[-half,1,0,.061],[half,1,0,.061],[.10,1.03,.025,.062],[.13,1.10,.06,.064],[.22,1.10,.28,.068],[.35,1.10,.30,.073],[.47,.95,.28,.065],[.56,.72,.12,.048],[.61,.42,.04,.026]];p2xEnvelopeProfiles.set(patch,rows);}return rows;}
function p2xEnvelope(patch,index,z,angle,opening,role,radialSide){
 const h=patch.holes[index],half=patch.half,rows=p2xProfileRows(patch),inCore=Math.abs(z)<=half+1e-10,lobe=inCore?0:profileValue(rows,z,2),scale=inCore?1:profileValue(rows,z,1),angleStep=TAU/(patch.stats.denseDetail?40:24),edgeAngle=(Math.floor(angle/angleStep)+.5)*angleStep,boundaryRadius=h.radius*Math.cos(angleStep*.5)/Math.cos(angle-edgeAngle),outer=boundaryRadius*scale*(1-lobe*Math.cos(3*angle)),baseInner=inCore?.061:profileValue(rows,z,3),inner=baseInner-(inCore?(1-opening)*.057*Math.exp(-(((z+.008)/.022)**2)):0),split=THREE.MathUtils.lerp(inner,outer,.56),radius=role==='TM2-pore-lining'?(radialSide===0?inner:split):(radialSide===0?split:outer),x=h.x+radius*Math.cos(angle),y=h.y+radius*Math.sin(angle);
 return patch.surface(x,y).addScaledVector(patch.normalAt(x,y),z);
}
function p2xCorePart(patch,index,subunit,role,opening,range=[-.13,.13]){
 const h=patch.holes[index],loop=patch.domain.loops[index+1],n=loop.length,start=Math.round(subunit*n/3),end=Math.round((subunit+1)*n/3),columns=end-start+1,keys=[range[0],range[1],-.39,-.33,-.23,-.13,-.10,-patch.half,-.025,-.008,0,.025,patch.half,.10,.13,.22,.35,.47,.56],steps=Math.max(5,Math.ceil((range[1]-range[0])/(patch.stats.denseDetail?.020:.032))),zs=[...new Set([...keys.filter(z=>z>=range[0]&&z<=range[1]),...Array.from({length:steps+1},(_,i)=>THREE.MathUtils.lerp(...range,i/steps))].map(z=>Math.round(z*1e10)/1e10))].sort((a,b)=>a-b),p=[],ix=[],id=(r,k,j)=>r*zs.length*columns+k*columns+j,angles=[];
 for(let j=0;j<columns;j++){const xy=patch.domain.xy[loop[(start+j)%n]];angles.push(Math.atan2(xy[1]-h.y,xy[0]-h.x));}
 for(let r=0;r<2;r++)for(let k=0;k<zs.length;k++)for(let j=0;j<columns;j++){
  const z=zs[k],q=p2xEnvelope(patch,index,z,angles[j],opening,role,r);if(role==='TM1-peripheral'&&r===1&&Math.abs(z)<=patch.half+1e-10){const xy=patch.domain.xy[loop[(start+j)%n]];q.copy(patch.surface(...xy)).addScaledVector(patch.normalAt(...xy),z);}p.push(...q.toArray());
 }
 for(let k=0;k<zs.length-1;k++)for(let j=0;j<columns-1;j++){let a=id(1,k,j),b=id(1,k,j+1),c=id(1,k+1,j),d=id(1,k+1,j+1);ix.push(a,b,c,b,d,c);a=id(0,k,j);b=id(0,k,j+1);c=id(0,k+1,j);d=id(0,k+1,j+1);ix.push(a,c,b,b,c,d);}
 for(const [j,sign]of[[0,-1],[columns-1,1]])for(let k=0;k<zs.length-1;k++){const a=id(0,k,j),b=id(1,k,j),c=id(0,k+1,j),d=id(1,k+1,j);if(sign<0)ix.push(a,b,c,b,d,c);else ix.push(a,c,b,b,c,d);}
 for(const [k,sign]of[[0,-1],[zs.length-1,1]])for(let j=0;j<columns-1;j++){const a=id(0,k,j),b=id(1,k,j),c=id(0,k,j+1),d=id(1,k,j+1);if(sign<0)ix.push(a,c,b,b,c,d);else ix.push(a,b,c,b,d,c);}
 const geometry=meshGeometry(p,ix,proteinVertexColors(p)),normals=geometry.attributes.normal,eps=1e-5;
 // Override surface normals using the common unsplit envelope. End faces are
 // internal at domain joins; they must not bevel or break the exposed surface.
 for(let r=0;r<2;r++)for(let k=0;k<zs.length;k++)for(let j=0;j<columns;j++){const z=zs[k],a=angles[j],da=p2xEnvelope(patch,index,z,a+eps,opening,role,r).sub(p2xEnvelope(patch,index,z,a-eps,opening,role,r)),dz=p2xEnvelope(patch,index,Math.min(.61,z+eps),a,opening,role,r).sub(p2xEnvelope(patch,index,Math.max(-.42,z-eps),a,opening,role,r)),normal=da.cross(dz).normalize().multiplyScalar(r?1:-1);normals.setXYZ(id(r,k,j),normal.x,normal.y,normal.z);}
 geometry.userData={closedCoarseEnvelope:true,biologicalSubunit:subunit,transmembraneHelix:role,nominalClosedGateRadius:.004,nominalOpenGateRadius:.061,opening,teachingScale:true,domainRange:range,continuousSharedEnvelope:true};if(role==='TM1-peripheral'&&range[0]<0&&range[1]>0)geometry.userData.apertureSamples=Array.from({length:columns},(_,j)=>({boundaryIndex:(start+j)%n,vertices:[-patch.half,0,patch.half].map(z=>id(1,zs.findIndex(q=>Math.abs(q-z)<1e-9),j))}));return geometry;
}
// The annular packing is restricted to the membrane/short root neck. Away
// from the membrane each biological subunit becomes a separate curved body.
function buildP2X7SubunitDomain(patch,index,subunit,side){
 const h=patch.holes[index],rootZ=side>0?.13:-.13,tipZ=side>0?.61:-.42,loop=patch.domain.loops[index+1],n=loop.length,start=Math.round(subunit*n/3),end=Math.round((subunit+1)*n/3),angles=[];for(let j=start;j<=end;j++){const xy=patch.domain.xy[loop[j%n]];angles.push(Math.atan2(xy[1]-h.y,xy[0]-h.x));}
 const rootRows=p2xProfileRows(patch),inner=profileValue(rootRows,rootZ,3),centralAngle=(subunit+.5)*TAU/3,outerAtCentre=h.radius*profileValue(rootRows,rootZ,1)*(1+profileValue(rootRows,rootZ,2)),centreR=(inner+outerAtCentre)*.5,tangentR=outerAtCentre*.80,radialR=(outerAtCentre-inner)*.52,descriptors=[...angles.map(angle=>({angle,kind:'outer'})),{angle:angles.at(-1),kind:'split'},...angles.slice().reverse().map(angle=>({angle,kind:'inner'})),{angle:angles[0],kind:'split'}],rootPoint=(d,z)=>p2xEnvelope(patch,index,z,d.angle,0,d.kind==='outer'?'TM1-peripheral':'TM2-pore-lining',d.kind==='inner'?0:1),rootBase=descriptors.map(d=>rootPoint(d,rootZ)),root2d=[],phis=[];
 for(let j=0;j<descriptors.length;j++){const d=descriptors[j],step=TAU/(patch.stats.denseDetail?40:24),edge=(Math.floor(d.angle/step)+.5)*step,boundary=h.radius*Math.cos(step*.5)/Math.cos(d.angle-edge),outer=boundary*profileValue(rootRows,rootZ,1)*(1-profileValue(rootRows,rootZ,2)*Math.cos(3*d.angle)),radius=d.kind==='inner'?inner:d.kind==='outer'?outer:THREE.MathUtils.lerp(inner,outer,.56),relative=d.angle-centralAngle,x=radius*Math.cos(relative)-centreR,y=radius*Math.sin(relative);root2d.push(new THREE.Vector2(radius*Math.cos(d.angle),radius*Math.sin(d.angle)));phis.push(Math.atan2(y/tangentR,x/radialR));}
 const rows=patch.stats.denseDetail?28:18,columns=descriptors.length,p=[],ix=[],normal=V(),project=(x,y,z)=>patch.surface(x,y).addScaledVector(patch.normalAt(x,y),z),body=(u,phi)=>{const arc=Math.sin(Math.PI*u),roundTip=Math.sqrt(Math.max(0,1-u*u)),centre=centreR+(side>0?.035*arc-.025*u:-.025*arc-.015*u),bend=side>0?.16*arc-.06*u:-.20*arc+.09*u,angle=centralAngle+bend,rr=(side>0?.100+.008*arc:.096+.006*arc)*roundTip,tr=(side>0?.136-.010*u:.128-.008*u)*roundTip,radial=rr*Math.cos(phi),tangent=tr*Math.sin(phi),x=h.x+(centre+radial)*Math.cos(angle)-tangent*Math.sin(angle),y=h.y+(centre+radial)*Math.sin(angle)+tangent*Math.cos(angle),z=THREE.MathUtils.lerp(rootZ,tipZ,u);return project(x,y,z);};
 for(let i=0;i<rows;i++){const u=i/rows,z=THREE.MathUtils.lerp(rootZ,tipZ,u),weight=smooth01(u/.22);for(let j=0;j<columns;j++){const q=i===0?rootBase[j].clone():weight>=1?body(u,phis[j]):rootPoint(descriptors[j],z).lerp(body(u,phis[j]),weight);p.push(...q.toArray());}}
 const pole=p.length/3;p.push(...body(1,0).toArray());for(let i=0;i<rows-1;i++)for(let j=0;j<columns;j++){const k=(j+1)%columns,a=i*columns+j,b=i*columns+k,c=(i+1)*columns+j,d=(i+1)*columns+k;ix.push(a,b,c,b,d,c);}for(let j=0;j<columns;j++)ix.push((rows-1)*columns+j,(rows-1)*columns+(j+1)%columns,pole);for(const tri of THREE.ShapeUtils.triangulateShape(root2d.map(q=>q.clone()),[]))ix.push(tri[0],tri[2],tri[1]);if(side<0)for(let i=0;i<ix.length;i+=3)[ix[i+1],ix[i+2]]=[ix[i+2],ix[i+1]];
 const geometry=meshGeometry(p,ix,proteinVertexColors(p)),normals=geometry.attributes.normal,eps=1e-5;
 for(let j=0;j<columns;j++){const d=descriptors[j];if(d.kind==='split')continue;const role=d.kind==='outer'?'TM1-peripheral':'TM2-pore-lining',r=d.kind==='outer'?1:0,da=p2xEnvelope(patch,index,rootZ,d.angle+eps,0,role,r).sub(p2xEnvelope(patch,index,rootZ,d.angle-eps,0,role,r)),dz=p2xEnvelope(patch,index,rootZ+eps,d.angle,0,role,r).sub(p2xEnvelope(patch,index,rootZ-eps,d.angle,0,role,r));normal.copy(da.cross(dz)).normalize().multiplyScalar(r?1:-1);normals.setXYZ(j,normal.x,normal.y,normal.z);}
 geometry.userData={biologicalSubunit:subunit,domainSide:side>0?'extracellular':'cytoplasmic',independentCurvedBody:true,sharedRoot:true,roundedSinglePoleTip:true,bodyCrossSection:'Rounded radial/tangential envelope, nominal aspect 1.2-1.4 away from shared root',rootZ,tipZ};return geometry;
}


function smoothCoincidentNormals(geometry){
 const p=geometry.attributes.position,n=geometry.attributes.normal,map=new Map();for(let i=0;i<p.count;i++){const key=[p.getX(i),p.getY(i),p.getZ(i)].map(x=>Math.round(x*1e7)).join(','),row=map.get(key)??{ids:[],normal:V()};row.ids.push(i);row.normal.add(V().fromBufferAttribute(n,i));map.set(key,row);}for(const row of map.values())if(row.ids.length>1&&row.normal.lengthSq()>1e-10){row.normal.normalize();for(const i of row.ids)n.setXYZ(i,row.normal.x,row.normal.y,row.normal.z);}
}


function colorProteinCap(geometry){const p=geometry.attributes.position,c=[];for(let i=0;i<p.count;i++){const s=.98+.038*Math.sin(p.getX(i)*6+p.getZ(i)*5+p.getY(i)*3);c.push(s,s,s);}geometry.setAttribute('color',new THREE.Float32BufferAttribute(c,3));return geometry;}
function capMaterial(source){const m=source.material.clone();m.color.multiplyScalar(1.10);m.roughness=.56;m.clearcoat=.025;m.emissive.copy(m.color);m.emissiveIntensity=.045;m.vertexColors=true;m.userData={...m.userData,teachingSectionCoding:true,notObservedInteriorDensity:true};return m;}
function fullyVisible(object){for(let o=object;o;o=o.parent)if(o.visible===false)return false;return true;}
function smooth01(v){const x=clamp(v,0,1);return x*x*(3-2*x);}
function ligandTravel(s){return s<2?1-smooth01(s/2):s<8?0:s<10?smooth01((s-8)/2):1;}
function setTranslated(mesh,base,offset){const p=mesh.geometry.attributes.position;for(let i=0;i<p.count;i++)p.setXYZ(i,base[i*3]+offset.x,base[i*3+1]+offset.y,base[i*3+2]+offset.z);p.needsUpdate=true;mesh.geometry.computeBoundingBox();mesh.geometry.computeBoundingSphere();}
// A local material window is the intersection of the front half-space and
// a short Z band. The original triangle/plane intersection stays unchanged;
// each real section is clipped to the other window boundaries, then all three
// boundaries are capped. Distant domains keep their complete surface volume.
function boundedProteinSection(section,plane,keepPlanes,displayOffset){
 const p=section.attributes.position,ix=section.index,color=section.attributes.color,positions=[],indices=[],colors=[],eps=1e-10;
 function point(i){return{p:V().fromBufferAttribute(p,i).addScaledVector(plane.normal,-displayOffset),c:color?V().fromBufferAttribute(color,i):V(1,1,1)};}
 for(let i=0;i<ix.count;i+=3){
  let polygon=[point(ix.getX(i)),point(ix.getX(i+1)),point(ix.getX(i+2))];
  for(const keep of keepPlanes){const next=[];for(let j=0;j<polygon.length;j++){const a=polygon[j],b=polygon[(j+1)%polygon.length],da=keep.distanceToPoint(a.p),db=keep.distanceToPoint(b.p),insideA=da>=-eps,insideB=db>=-eps;if(insideA)next.push(a);if(insideA!==insideB){const t=da/(da-db);next.push({p:a.p.clone().lerp(b.p,t),c:a.c.clone().lerp(b.c,t)});}}polygon=next;if(polygon.length<3)break;}
  for(let j=1;j<polygon.length-1;j++){const triangle=[polygon[0],polygon[j],polygon[j+1]],rounded=triangle.map(v=>V(Math.fround(v.p.x),Math.fround(v.p.y),Math.fround(v.p.z))),cross=rounded[1].clone().sub(rounded[0]).cross(rounded[2].clone().sub(rounded[0]));if(cross.lengthSq()<1e-20)continue;const start=positions.length/3;for(let k=0;k<3;k++){positions.push(...rounded[k].toArray());colors.push(...triangle[k].c.toArray());}indices.push(start,start+1,start+2);}
 }
 const result=meshGeometry(positions,indices,colors);result.userData={actualSourceTriangleSection:true,allWindowBoundariesCapped:true,displayPlaneOffset:0};return result;
}
function createProteinLocalWindow(group,proteins,ions,centreZ,halfZ){
 const localPlanes=[new THREE.Plane(V(0,1,0),.23),new THREE.Plane(V(0,0,-1),centreZ-halfZ),new THREE.Plane(V(0,0,1),-centreZ-halfZ)],worldPlanes=localPlanes.map(p=>p.clone()),capParent=new THREE.Group();
 capParent.name='MembraneProteinActualLocalWindowCaps';capParent.userData={organelleId:'membrane',componentKey:'membrane-proteins',localMaterialWindow:true};group.add(capParent);
 const materials=new Set(proteins.flatMap(p=>[p.mesh.material].flat()));materials.add(ions.material);const sources=proteins.flatMap(p=>p.parts),ionSource={mesh:ions,material:ions.material,id:'actual-cation-instances',role:'symbolic-cation-instance-volume',instanceSource:true};sources.push(ionSource);
 const caps=sources.flatMap(source=>localPlanes.map((plane,face)=>{const cap=new THREE.Mesh(meshGeometry([],[],[]),capMaterial(source));cap.name=source.mesh.name+'LocalWindow_'+['Y','Zmin','Zmax'][face]+'_'+source.id;cap.visible=false;cap.userData={organelleId:'membrane',componentKey:'membrane-proteins',artificialCut:true,teachingConstituentSection:true,coarseEnvelopeRole:source.role,localWindowFace:['Y','Zmin','Zmax'][face],actualSourceTriangleSection:true};capParent.add(cap);return{source,cap,face,plane};}));
 let amount=0,ionsActive=false,lastWorldActive=false;
 function refresh(onlyMeshes=null){
  const active=amount>.002,frontKeep=localPlanes[0].clone().negate(),zKeeps=[localPlanes[1].clone().negate(),localPlanes[2].clone().negate()];
  for(const {source,cap,face,plane}of caps){cap.visible=active&&(!source.instanceSource||ionsActive);if(!active||source.instanceSource&&!ionsActive||onlyMeshes&&!onlyMeshes.has(source.mesh))continue;const section=source.instanceSource?instanceSectionGeometry(source.mesh,plane):colorProteinCap(capGeometry(source.geometry,plane)),next=boundedProteinSection(section,plane,face===0?zKeeps:[frontKeep],source.instanceSource?.00001:.00002);section.dispose();cap.geometry.dispose();cap.geometry=next;}
 }
 function setSection(value,plane){amount=value;localPlanes[0].copy(plane);refresh();}
 function setIonActive(value){ionsActive=value;for(const entry of caps)if(entry.source.instanceSource)entry.cap.visible=amount>.002&&ionsActive;}
 function setWorldSection(value,plane,matrix){
  const active=value>.002;localPlanes[0].copy(plane);for(let i=0;i<3;i++)worldPlanes[i].copy(localPlanes[i]).applyMatrix4(matrix);
  // The factory first applies its shared plane to shell materials. Restore
  // this protein-only intersection afterwards without recompiling per frame.
  for(const material of materials){material.clippingPlanes=active?worldPlanes:null;material.clipIntersection=active;material.clipShadows=true;if(active!==lastWorldActive)material.needsUpdate=true;}lastWorldActive=active;
 }
 const metadata={mode:'front-Y-halfspace-intersect-finite-local-Z-band',centreZ,halfZ,zMin:centreZ-halfZ,zMax:centreZ+halfZ,windowFaces:['Y','Zmin','Zmax'],distantDomainsRemainWhole:true,allActualBoundariesCapped:true,slider:'Existing section slider moves only the Y plane',requiresFactoryWorldSection:true};group.userData.membraneProteinWindow=metadata;
 return{caps,capParent,materials,localPlanes,worldPlanes,metadata,refresh,setSection,setIonActive,setWorldSection};
}

// Sparse glycolipid-linked glycan examples identify the extracellular side.
// They are attached to existing outer-leaflet head envelopes, not a separate
// membrane or a universal measured glycocalyx mesh.
function buildOuterLeafletGlycans(patch,detail){
 const parts=[],anchors=[],used=new Set(),targets=[[-1.04,.43],[-.43,.59],[.04,.46],[.39,.61],[.92,.51],[1.04,.02]];
 for(let i=0;i<targets.length;i++){
  const[x,y]=targets[i];let index=-1,best=Infinity;
  for(let j=0;j<patch.headRows.length;j++){const row=patch.headRows[j];if(row.side!==1||used.has(j))continue;const d=(row.xy[0]-x)**2+(row.xy[1]-y)**2;if(d<best){best=d;index=j;}}
  if(index<0)continue;used.add(index);const row=patch.headRows[index],[rx,ry]=row.xy,z=row.normalOffset+row.normalRadius*.70,sign=i%2?1:-1,height=.13+.018*(i%3),base=V(rx,ry,z),fork=base.clone().add(V(sign*.028,.012,height*.55)),tip=base.clone().add(V(sign*.035,-.008,height));
  const branches=[[base,base.clone().lerp(fork,.45).add(V(-sign*.012,.009,0)),fork,tip],
   [fork,fork.clone().add(V(-sign*.035,.012,height*.18)),fork.clone().add(V(-sign*.060,.02,height*.41))]];
  for(const branch of branches)parts.push(parameterTube(patch,branch,.0085,detail));
  for(const point of[tip,branches[1].at(-1)])parts.push(ellipsoid(patch,point,V(.014,.014,.016),detail));
  const world=patch.surface(rx,ry).addScaledVector(patch.normalAt(rx,ry),z);anchors.push({headInstance:index,side:1,localRoot:world.toArray(),xy:[rx,ry],normalOffset:z,exampleHeight:height});
 }
 const geometry=mergeGeometries(parts,false);parts.forEach(g=>g.dispose());const material=matte('#b59480',{roughness:.76,clearcoat:0}),mesh=new THREE.Mesh(geometry,material);mesh.name='OuterLeafletGlycolipidGlycanExamples';mesh.userData={organelleId:'membrane',componentKey:'membrane',shell:true,teachingOnly:true,glycanExamples:true,attachedToExistingOuterHeadInstances:true,notACompleteGlycocalyx:true,notASequenceOrSugarIdentityModel:true};
 return{mesh,anchors,metadata:{count:anchors.length,membraneSide:'extracellular only',rootAnchors:anchors,representation:'Selected short branched glycolipid glycan envelopes; not a measured macrophage glycocalyx, exact glycan sequence, or universal density',source:'https://pmc.ncbi.nlm.nih.gov/articles/PMC6675415/'}};
}

export function buildPlasmaMembraneDetail(group,detail,ctx){
 const holes=[{x:-.61,y:.19,radius:.072,id:'FcGRIIA-single-TM'},{x:.59,y:-.23,radius:.215,id:'P2X7-trimer-2TM-per-subunit'}],patch=createDenseLipidPatch({detail:Boolean(detail),holes,thickness:.096,sectionSampleY:-.23,bounds:{x:[-1.27,1.27],y:[-.62,.76]},cornerRadius:.17});group.add(patch.group);
 const glycans=buildOuterLeafletGlycans(patch,Boolean(detail));group.add(glycans.mesh);
 const receptorParent=new THREE.Group();receptorParent.name='FcGammaRIIARepresentative';receptorParent.userData={organelleId:'membrane',componentKey:'membrane-proteins',namedProtein:'FCGR2A',species:'human'};group.add(receptorParent);const rh=holes[0];
 const receptorParts=[
  {id:'single-TM',role:'single-transmembrane-helix-envelope',color:'#80678e',geometry:receptorPartGeometry(patch,0,-patch.half,patch.half)},
  {id:'membrane-proximal-Ig-D2',role:'extracellular-Ig-D2-Fc-binding-domain',color:'#aa8eac',geometry:receptorPartGeometry(patch,0,.10,.35)},
  {id:'membrane-distal-Ig-D1',role:'extracellular-Ig-D1-domain',color:'#bc9bbe',geometry:receptorPartGeometry(patch,0,.35,.58)},
  {id:'stalk',role:'extracellular-linker',color:'#a48aa6',geometry:receptorPartGeometry(patch,0,patch.half,.10)},
  {id:'cytoplasmic-tail',role:'cytoplasmic-ITAM-containing-tail-unphosphorylated',color:'#92719a',geometry:parameterTube(patch,[V(rh.x,rh.y,-.055),V(rh.x-.028,rh.y+.018,-.12),V(rh.x+.015,rh.y+.035,-.21),V(rh.x-.04,rh.y+.04,-.34)],.019,detail)},
  ...[-.18,-.28].map((z,i)=>({id:'ITAM-tyrosine-'+(i+1),role:'unphosphorylated-ITAM-site-symbol',color:'#ca9bc5',geometry:ellipsoid(patch,V(rh.x+(i?-.015:.008),rh.y+.035,z),V(.029,.028,.027),detail)}))
 ];const receptor=mergeNamed(receptorParts,'HumanFcGammaRIIA_1TM_2ExtracellularIgDomains',{namedProtein:'FCGR2A',transmembraneHelices:1,extracellularIgDomains:2,domainEnvelope:'two flattened Ig beta-sandwich teaching volumes; no atomic surface claim',cytoplasmicMotif:'own ITAM; unphosphorylated in this binding-only example',notCrosslinked:true});receptorParent.add(receptor.mesh);
 // IgG Fc contacts the membrane-proximal D2 face. Fab arms point away from Fc.
 const fc=V(rh.x+.205,rh.y-.008,.32),iggParts=[{id:'Fc',role:'paired-heavy-chain-CH2-CH3-Fc-binding-region',color:'#e4ad65',geometry:iggFcGeometry(patch,fc,detail)},...[-1,1].map((s,i)=>({id:'Fab-'+i,role:'paired-variable-and-constant-Fab-domains',color:'#e7bd84',geometry:iggFabGeometry(patch,fc,s,detail)}))],igg=mergeNamed(iggParts,'IgG_BindingAndDissociationOnly',{ligand:'IgG',fcHeavyChainDomains:4,fabIgDomainsPerArm:4,displayGeometry:'coarse domain envelopes, no atomic coordinates',noActivationOrPhagocytosisClaim:true});receptorParent.add(igg.mesh);
 const channelParent=new THREE.Group();channelParent.name='P2X7RepresentativeTrimer';channelParent.userData={organelleId:'membrane',componentKey:'membrane-proteins',namedProtein:'P2RX7',biologicalSubunitCount:3,topologyReferenceSpecies:'rat',humanMacrophageContext:true};group.add(channelParent);const ch=holes[1],palette=['#6395a5','#bd907e','#91a187'],coreParts=[],openGeometries=[];
 for(let s=0;s<3;s++)for(const role of['TM2-pore-lining','TM1-peripheral']){coreParts.push({id:'subunit-'+(s+1)+'-'+role,role,color:new THREE.Color(palette[s]).multiplyScalar(role==='TM2-pore-lining'?1.13:.88),geometry:p2xCorePart(patch,1,s,role,0)});openGeometries.push(p2xCorePart(patch,1,s,role,1));}
 const openMerged=mergeGeometries(openGeometries,false),coreOpen=openMerged.attributes.position.array.slice(),coreOpenNormals=openMerged.attributes.normal.array.slice();openMerged.dispose();openGeometries.forEach(g=>g.dispose());const channel=mergeNamed(coreParts,'P2X7_ThreeSubunits_SixTransmembraneEnvelopes',{namedProtein:'P2RX7',biologicalSubunitCount:3,transmembraneHelicesPerSubunit:2,transmembraneHelicesTotal:6,aqueousPore:true,closedGateIsConstriction:true});channelParent.add(channel.mesh);const coreClosed=channel.mesh.geometry.attributes.position.array.slice(),coreClosedNormals=channel.mesh.geometry.attributes.normal.array.slice();
 const externalParts=[],cytoParts=[];for(let subunit=0;subunit<3;subunit++){externalParts.push({id:'extracellular-subunit-'+(subunit+1),role:'ATP-binding-extracellular-subunit-domain',color:palette[subunit],geometry:buildP2X7SubunitDomain(patch,1,subunit,1)});cytoParts.push({id:'cytoplasmic-subunit-'+(subunit+1),role:'cytoplasmic-ballast-envelope',color:new THREE.Color(palette[subunit]).multiplyScalar(.90),geometry:buildP2X7SubunitDomain(patch,1,subunit,-1)});}
 const external=mergeNamed(externalParts,'P2X7_ThreeExtracellularATPBindingDomains',{namedProtein:'P2RX7',biologicalSubunitCount:3,domainSide:'extracellular'}),cyto=mergeNamed(cytoParts,'P2X7_ThreeCytoplasmicBallastDomains',{namedProtein:'P2RX7',domainSide:'cytoplasmic'});channelParent.add(external.mesh,cyto.mesh);
 const atps=[];for(let s=0;s<3;s++){const angle=(s+1)*TAU/3,site=V(ch.x+.188*Math.cos(angle),ch.y+.188*Math.sin(angle),.33),parts=[{id:'adenosine',role:'ATP-adenosine-symbol',color:'#d6a348',geometry:ellipsoid(patch,site,V(.030,.024,.022),detail)},...[0,1,2].map(j=>({id:'phosphate-'+(j+1),role:'ATP-phosphate-symbol',color:'#e0b663',geometry:ellipsoid(patch,site.clone().add(V(.025+j*.017,.003*j,.002)),V(.013,.013,.013),detail)}))],model=mergeNamed(parts,'ATP_ExtracellularInterface_'+(s+1),{ligand:'ATP',bindingSide:'extracellular',subunitInterface:s,chemicalScale:'symbolic'});channelParent.add(model.mesh);atps.push({...model,base:model.mesh.geometry.attributes.position.array.slice(),away:patch.normalAt(site.x,site.y).multiplyScalar(.40).add(V(.25*Math.cos(angle),.25*Math.sin(angle),0))});}
 const ionGeometry=new THREE.SphereGeometry(1,detail?10:8,detail?7:5),ionMaterial=matte('#ffffff',{roughness:.36,vertexColors:false}),ions=new THREE.InstancedMesh(ionGeometry,ionMaterial,8),dummy=new THREE.Object3D(),ionColour=new THREE.Color();ions.name='P2X7_OpenStateCationPassageSymbols';ions.userData={componentKey:'membrane-proteins',teachingOnly:true,species:['Na+ inward','K+ outward'],notMeasuredFlux:true,notVirusSpecific:true};for(let i=0;i<8;i++){ionColour.set(i<5?'#c9a455':'#83aeb1');ions.setColorAt(i,ionColour);}ions.visible=false;channelParent.add(ions);
 const proteins=[receptor,igg,channel,external,cyto,...atps],proteinWindow=createProteinLocalWindow(group,proteins,ions,patch.surface(ch.x,ch.y).z,.13),proteinCaps=proteinWindow.caps;
 for(const object of[patch.group,receptorParent,channelParent,glycans.mesh])ctx.shell.push(object);ctx.sectionNormal=V(0,1,0);ctx.sectionFocus=V(0,-.23,0);ctx.sectionRadius=1.7;ctx.radius=1.65;ctx.anchors.focus=V(0,0,.02);
 // Separate the channel cutaway from the phospholipid section close-up.
 // Both cameras remain in the water phase outside the clipped material.
 ctx.anchors.conformationCamera=V(1.024,-2.568,.82);ctx.anchors.conformationTarget=V(.59,-.23,.12);
 ctx.anchors.inside=V(-.44,-1.72,.21);ctx.anchors.insideTarget=V(-.44,-.23,.035);ctx.anchors.micro=ctx.anchors.inside.clone();ctx.anchors.microTarget=ctx.anchors.insideTarget.clone();
 let sectionAmount=0,sectionPlane=new THREE.Plane(V(0,1,0),.23),elapsed=0,disposed=false,lastOpening=-1,lastTravel=-1,lastFcTravel=-1;const fcPeriod=9.6,fcInitialPhase=1.3,iggBase=igg.mesh.geometry.attributes.position.array.slice(),iggAway=patch.normalAt(fc.x,fc.y).multiplyScalar(.32).add(V(.32,-.12,.12));
 function refreshCaps(onlyMeshes=null){proteinWindow.refresh(onlyMeshes);}
 const state={elapsed:0,cycleSeconds:12,ATPPeriod:12,ATP:'free',FcGammaRIIAPeriod:fcPeriod,FcGammaRIIAInitialPhase:fcInitialPhase,FcGammaRIIA:'IgG unbound',P2X7:'closed',opening:0,ionPassage:false,source:'Independent illustrative representative-protein loops; no common signalling event or viral trigger'};group.userData.membraneFunctionalState=state;
 function applyPhase(){const s=elapsed%12,travel=ligandTravel(s),fcPhase=(elapsed+fcInitialPhase)%fcPeriod,fcTravel=ligandTravel(fcPhase/fcPeriod*12),opening=smooth01((s-2.10)/.8)*(1-smooth01((s-8.02)/.8)),changed=new Set();
  if(Math.abs(opening-lastOpening)>1e-6){const p=channel.mesh.geometry.attributes.position;for(let i=0;i<p.array.length;i++)p.array[i]=THREE.MathUtils.lerp(coreClosed[i],coreOpen[i],opening);p.needsUpdate=true;const normal=channel.mesh.geometry.attributes.normal;for(let i=0;i<normal.count;i++){const j=i*3,x=THREE.MathUtils.lerp(coreClosedNormals[j],coreOpenNormals[j],opening),y=THREE.MathUtils.lerp(coreClosedNormals[j+1],coreOpenNormals[j+1],opening),z=THREE.MathUtils.lerp(coreClosedNormals[j+2],coreOpenNormals[j+2],opening),length=Math.hypot(x,y,z)||1;normal.setXYZ(i,x/length,y/length,z/length);}normal.needsUpdate=true;channel.mesh.geometry.computeBoundingBox();channel.mesh.geometry.computeBoundingSphere();channel.mesh.geometry.userData.opening=opening;changed.add(channel.mesh);lastOpening=opening;}
  if(Math.abs(fcTravel-lastFcTravel)>1e-6){setTranslated(igg.mesh,iggBase,iggAway.clone().multiplyScalar(fcTravel));changed.add(igg.mesh);lastFcTravel=fcTravel;}
  if(Math.abs(travel-lastTravel)>1e-6){for(const atp of atps){setTranslated(atp.mesh,atp.base,atp.away.clone().multiplyScalar(travel));changed.add(atp.mesh);}lastTravel=travel;}
  const conduct=opening>.92&&s<8.8;ions.visible=conduct;proteinWindow.setIonActive(conduct);if(conduct){const u=(s-2.8)*.72;for(let i=0;i<8;i++){const fraction=((u+i/8)%1+1)%1,z=(i<5?1:-1)*THREE.MathUtils.lerp(.23,-.23,fraction),a=i*2.39996,r=.018;dummy.position.copy(patch.surface(ch.x+r*Math.cos(a),ch.y+r*Math.sin(a))).addScaledVector(patch.normalAt(ch.x,ch.y),z);dummy.scale.setScalar(.009);dummy.updateMatrix();ions.setMatrixAt(i,dummy.matrix);}ions.instanceMatrix.needsUpdate=true;ions.computeBoundingBox();ions.computeBoundingSphere();changed.add(ions);}
  Object.assign(state,{elapsed,phase:s,ATPPhase:s,ATPTravel:travel,FcGammaRIIAPhase:fcPhase,FcGammaRIIATravel:fcTravel,ATP:travel<.015?'bound at three extracellular interfaces':travel>.985?'free':s<2?'approaching':'dissociating',FcGammaRIIA:fcTravel<.015?'IgG Fc bound; no crosslink/activation claim':fcTravel>.985?'IgG unbound':fcPhase<fcPeriod/6?'IgG approaching':'IgG dissociating',P2X7:opening>.92?'open':opening<.02?'closed':'gating',opening,ionPassage:conduct});if(changed.size)refreshCaps(changed);
 }
 const previousSection=ctx.onSection;ctx.onSection=(amount,plane)=>{previousSection?.(amount,plane);sectionAmount=amount;sectionPlane.copy(plane);patch.onSection(amount,plane);proteinWindow.setSection(amount,plane);};
 const previousWorldSection=ctx.onWorldSection;ctx.onWorldSection=(amount,plane,matrix)=>{previousWorldSection?.(amount,plane,matrix);proteinWindow.setWorldSection(amount,plane,matrix);};
 const previousUpdate=ctx.onUpdate;ctx.onUpdate=(t,dt)=>{previousUpdate?.(t,dt);if(disposed||!Number.isFinite(dt)||!(dt>0)||!fullyVisible(receptor.mesh)&&!fullyVisible(channel.mesh))return;elapsed+=dt;applyPhase();};const previousDispose=ctx.onDispose;ctx.onDispose=()=>{if(disposed)return;disposed=true;previousDispose?.();};
 ctx.facts=['脂质双层沿平面剖开；膜蛋白只在靠膜位置开局部窗口，远端结构保留完整。','脂质双层两侧是水相；蓝色亲水头朝外，疏水尾相向，蛋白嵌入匹配孔口。','紫色 FcγRIIA 以人受体为代表：两个胞外 Ig 域、单次跨膜和含自身 ITAM 的胞质尾。IgG Fc 接触靠膜的 D2 区域。','IgG 的接近、结合和离开仅演示结合；这里没有多个受体交联，也不据此声称已激活完整吞噬。','蓝灰色 P2X7 是三聚体，每个亚基有两个跨膜区；胞外 ATP 结合亚基间位点，TM2 形成中央门控孔。','ATP 结合后示意门控开放，Na+ 向内、K+ 向外的运动表示典型电化学条件下的阳离子通行；不是流量或时间的实测值。','两个代表蛋白的循环互相独立。结构包络、尺度和配体符号为教学简化；P2X7 开闭参考大鼠结构，不能当人巨噬细胞原子重建。'];
 ctx.facts[1]='细胞膜是一套磷脂双分子层：蓝色亲水头面向胞外水相，玫瑰色亲水头面向胞质水相；两侧琥珀色双尾相向伸入疏水核心，膜蛋白贯穿连续双层。颜色用于分辨两叶，不代表实物颜色。';
 ctx.facts.push('分子特写把每个磷脂画为同一头部连接的两条疏水尾，其中一条显示代表性弯折。真实膜含多种脂质，两叶的组成、尾链不饱和度和运动性不相同；此处不表示巨噬细胞的实测比例。');
 ctx.facts.push('受体结合、离子通道开闭与膜融合是不同过程。FcγRIIA 和 P2X7 展示识别和门控；它们不会在这个视图中被画成拉拢两层膜的融合蛋白。');
 ctx.facts.push('胞外叶上的少量分支链表示糖脂所连糖链，帮助辨认膜的朝向；它们不是完整糖萼，也不是具体糖序列或巨噬细胞糖萼厚度的重建。两叶共同组成同一脂质双层，中央并非另一层膜。');
 ctx.anchors.extracellularLeaflet=patch.surface(-.44,-.23).addScaledVector(patch.normalAt(-.44,-.23),patch.half);
 ctx.anchors.cytoplasmicLeaflet=patch.surface(-.44,-.23).addScaledVector(patch.normalAt(-.44,-.23),-patch.half);
 ctx.anchors.hydrophobicCore=patch.surface(-.16,-.23);
 ctx.anchors.extracellularGlycans=V().fromArray(glycans.anchors[2].localRoot);
 ctx.metadata={...ctx.metadata,contentLesson:{title:'同一张膜的两个脂质叶',note:'蓝侧朝胞外，玫瑰侧朝胞质；琥珀色双尾相向。标签锚定实际剖面，随遮挡隐藏。'},contentLabels:[
  {id:'outer-leaflet',anchor:'extracellularLeaflet',title:'胞外叶 · 亲水头',description:'蓝色头部面向胞外水相；两叶共同组成同一脂质双层。',color:'#72a5b1'},
  {id:'inner-leaflet',anchor:'cytoplasmicLeaflet',title:'胞质叶 · 亲水头',description:'玫瑰色头部面向胞质水相，疏水尾朝向核心。',color:'#b8827b'},
  {id:'lipid-core',anchor:'hydrophobicCore',title:'相向双尾 · 疏水核心',description:'每个所选磷脂的两条尾链朝内；这里不是水性腔室。',color:'#b88c45'}
 ]};
 group.userData.membraneGlycanExamples=glycans.metadata;
 group.userData.membranePresentation={version:2,selectedCurvedPatch:true,roundedArtificialBoundary:true,opaqueMaterialBody:true,artificialCoreSectionOpacity:.24,lipidHeadsPartlyEmbedded:true,notWholeCellShape:true,bounds:patch.bounds,scope:'Local membrane patch with preserved bilayer/core/protein aperture topology; rounded outer edge is an illustration crop, not a free biological membrane edge'};
 group.userData.membraneLeafletLegend={outer:{label:'胞外叶 · 亲水头',colour:'#a8d3df',normalSign:1},inner:{label:'胞质叶 · 亲水头',colour:'#dfa99e',normalSign:-1},core:{label:'相向双尾 · 疏水核心',colour:'#c4954d'},nominalThicknessModelUnits:patch.thickness,colourMeaning:'Teaching colours distinguish sides; not natural colour or lipid species',motionMeaning:'Protein binding/gating is animated; leaflet packing is a frozen illustrative configuration, not molecular dynamics',source:'https://doi.org/10.1038/s41589-020-0529-6'};
 Object.assign(patch.stats,{leafletColourCoding:true,sharedHeadDoubleTailFork:true,representativeCisTailBend:true,lipidCompositionMeasured:false});

 Object.assign(ctx.stats,{twoLeaflets:true,continuousHydrophobicCore:true,staticOnly:false,lipidInstances:patch.stats.headInstances,lipidTailPairs:patch.stats.twoTailMolecules,proteinTypes:['human-FcGammaRIIA','P2X7-trimer-topology'],nominalBilayerThickness:patch.thickness,coreThickness:patch.coreHalf*2,newMotion:true,receptorTransmembraneCount:1,receptorExtracellularIgDomains:2,channelBiologicalSubunits:3,channelTransmembraneHelicesPerSubunit:2,channelTransmembraneHelicesTotal:6,channelGating:true,ATPBindingInterfaces:3,IgGBindingOnly:true,requiresFactoryOnUpdate:true,requiresFactoryWorldSection:true,proteinSectionWindow:proteinWindow.metadata,motionPhase:state,proteinRepresentation:'Named procedural topology envelopes and symbolic ligands; no atomic coordinate import',notVirusRequiredPathway:true});
 group.userData.membraneViewDirections={surface:[0,-.95,1.55],section:[0,-1.8,.72],inside:[0,-1.8,.72]};group.userData.membraneDetail={teachingOnly:true,staticOnly:false,lipidPacking:patch.stats.disorderedSampling,proteinCoordinates:'Procedural; human FcGRIIA ectodomain topology and rat P2X7 trimer topology only, no imported atoms',channelBiologicalSubunitCount:3,channelTMPerSubunit:2,receptorExtracellularIgDomains:2,sectionCapRequiresFactoryCallback:'ctx.onSection(section,localPlane) and ctx.onWorldSection(section,localPlane,group.matrixWorld); actual Y/Zmin/Zmax boundary caps refresh from live source triangles',proteinSectionWindow:proteinWindow.metadata,sources:['https://doi.org/10.1038/s41589-020-0529-6','https://www.rcsb.org/structure/1FCG','https://www.uniprot.org/uniprotkb/P12318/entry','https://pmc.ncbi.nlm.nih.gov/articles/PMC4151227/','https://www.rcsb.org/structure/6U9V','https://www.rcsb.org/structure/6U9W','https://doi.org/10.1016/j.cell.2019.09.017','https://pmc.ncbi.nlm.nih.gov/articles/PMC6352910/','https://pmc.ncbi.nlm.nih.gov/articles/PMC6675415/']};
 group.userData.membraneDetail.sources.push('https://doi.org/10.1038/s41467-025-56045-z','https://doi.org/10.1073/pnas.2002200117');
 applyPhase();return{patch,glycans,receptorParent,channelParent,proteinCaps,proteinWindow,receptor,channel,external,cyto,igg,atps,ions,section:ctx.onSection,update:ctx.onUpdate,state,getElapsed:()=>elapsed,isDisposed:()=>disposed};
}



