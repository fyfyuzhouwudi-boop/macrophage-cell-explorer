import * as THREE from 'three';
import {ConvexGeometry} from 'three/addons/geometries/ConvexGeometry.js';

const V=(x=0,y=0,z=0)=>new THREE.Vector3(x,y,z),TAU=2*Math.PI;
const LOCAL_TO_CELL=new THREE.Matrix4().compose(V(-2.25,1.15,-.05),new THREE.Quaternion(),V(1.55,1.83,1.36));

function faceMaterials(g){const a=new Uint16Array(g.index.count/3);for(const r of g.groups)for(let i=r.start/3;i<(r.start+r.count)/3;i++)a[i]=r.materialIndex;return a;}
function terminalPort(g,centerId){
 const ix=g.index.array,edges=[],removed=[];for(let f=0;f<ix.length;f+=3){const tri=[ix[f],ix[f+1],ix[f+2]],k=tri.indexOf(centerId);if(k>=0){removed.push(f/3);edges.push([tri[(k+1)%3],tri[(k+2)%3]]);}}
 if(edges.length<8)throw Error('SER root must be an existing complete terminal cap fan');
 const next=new Map(edges);if(next.size!==edges.length)throw Error('SER cap fan does not have one directed boundary');const ring=[edges[0][0]];for(let i=0;i<edges.length-1;i++){const id=next.get(ring.at(-1));if(id===undefined||ring.includes(id))throw Error('SER terminal cap ring is broken');ring.push(id);}if(next.get(ring.at(-1))!==ring[0])throw Error('SER terminal cap ring is open');return{centerId,ring,removed:new Set(removed)};
}

/**
 * Adds a shared-index SER continuation to ONE existing closed ER terminal cap.
 * This is a coarse teaching membrane boundary, not an EM segmentation or a bilayer.
 * Old vertices and their IDs remain byte-identical. The cap fan is removed;
 * its perimeter IDs become the first ring of the new enclosing wall.
 */
export function attachSmoothERNetwork({geometry,capCenterId,metricMatrix=new THREE.Matrix4(),materialIndex=0,scale=1,sideRotation=0}={}){
 if(!geometry?.index||!geometry.attributes.position)throw TypeError('Indexed ER geometry required');
 const port=terminalPort(geometry,capCenterId),baseP=geometry.attributes.position,baseUV=geometry.attributes.uv,baseF=faceMaterials(geometry),p=Array.from(baseP.array),uv=baseUV?Array.from(baseUV.array):Array(baseP.count*2).fill(0),indices=[],mats=[];
 for(let f=0;f<geometry.index.count/3;f++)if(!port.removed.has(f)){indices.push(geometry.index.getX(f*3),geometry.index.getX(f*3+1),geometry.index.getX(f*3+2));mats.push(baseF[f]);}
 const inverse=metricMatrix.clone().invert(),world=id=>V().fromArray(p,id*3).applyMatrix4(metricMatrix),root=world(capCenterId),ringWorld=port.ring.map(world),forward=V();
 for(let i=0;i<ringWorld.length;i++)forward.add(new THREE.Triangle(root,ringWorld[i],ringWorld[(i+1)%ringWorld.length]).getNormal(V()));forward.normalize();
 let side=V().crossVectors(Math.abs(forward.z)<.8?V(0,0,1):V(0,1,0),forward).normalize();if(sideRotation)side.applyAxisAngle(forward,sideRotation);const up=V().crossVectors(forward,side).normalize(),N=port.ring.length;
 const toWorld=(a,b=0,c=0)=>root.clone().addScaledVector(forward,a*scale).addScaledVector(side,b*scale).addScaledVector(up,c*scale);
 const add=q=>{const id=p.length/3,qLocal=q.clone().applyMatrix4(inverse);p.push(qLocal.x,qLocal.y,qLocal.z);uv.push(0,0);return id;};
 const face=(a,b,c)=>{indices.push(a,b,c);mats.push(materialIndex);};
 const align=(a,b)=>{let best=Infinity,result=b;for(const reverse of[false,true])for(let shift=0;shift<N;shift++){const candidate=Array.from({length:N},(_,i)=>b[((reverse?-i:i)+shift+N)%N]);let score=0;for(let i=0;i<N;i++)score+=world(a[i]).distanceToSquared(world(candidate[i]));if(score<best){best=score;result=candidate;}}return result;};
 function bridge(a,b,steps=12,{bend=V(),taper=false}={}){
  const end=align(a,b),pa=a.map(world),pb=end.map(world),ca=pa.reduce((q,v)=>q.add(v),V()).multiplyScalar(1/N),cb=pb.reduce((q,v)=>q.add(v),V()).multiplyScalar(1/N),axis=cb.clone().sub(ca).normalize(),path=[ca.clone()];let last=a;
  for(let step=1;step<=steps;step++){
   const t=step/steps,s=t*t*(3-2*t),center=ca.clone().lerp(cb,t).addScaledVector(bend,Math.sin(Math.PI*t)**2),tangent=cb.clone().sub(ca).addScaledVector(bend,Math.PI*Math.sin(2*Math.PI*t)).normalize(),rotation=new THREE.Quaternion().setFromUnitVectors(axis,tangent);
   const ring=step===steps?end:pa.map((q,i)=>{
    const da=q.clone().sub(ca),db=pb[i].clone().sub(cb);let offset;
    if(taper){const ra=da.length(),rb=db.length();offset=da.multiplyScalar(1/ra).lerp(db.multiplyScalar(1/rb),s).normalize().multiplyScalar(Math.exp(Math.log(ra)*(1-s)+Math.log(rb)*s));}
    else offset=da.lerp(db,t);
    return add(center.clone().add(offset.applyQuaternion(rotation)));
   });
   for(let i=0;i<N;i++){const j=(i+1)%N;face(last[i],last[j],ring[i]);face(last[j],ring[j],ring[i]);}last=ring;path.push(center);
  }
  return path;
 }
 // Refine only the new junction wall. The existing port rings are fixed, so
 // adjacent tubes and every original RER edge keep their exact shared IDs.
 function roundedJunction(triangles,rings,center,directions,radius){
  const portOf=new Map();rings.forEach((ring,k)=>ring.forEach(id=>portOf.set(id,k)));
  const smoothMin=(a,b,k)=>{const h=Math.max(k-Math.abs(a-b),0)/k;return Math.min(a,b)-k*h*h*.25;};
  function project(id){
   const q=world(id).sub(center),rho=q.length();if(rho<1e-10)return;const d=q.clone().multiplyScalar(1/rho),slopes=directions.map(axis=>Math.sqrt(Math.max(0,1-Math.max(0,d.dot(axis))**2)));
   const sdf=distance=>smoothMin(smoothMin(distance*slopes[0],distance*slopes[1],radius*.65),distance*slopes[2],radius*.65)-radius;
   let lo=0,hi=Math.max(radius*4,rho*2);for(let i=0;i<5&&sdf(hi)<0;i++)hi*=2;
   for(let i=0;i<26;i++){const mid=(lo+hi)*.5;if(sdf(mid)<0)lo=mid;else hi=mid;}
   // The union is trimmed by the original port planes. Keep this radial
   // deformation within its original convex control envelope near those ports.
   const next=center.clone().addScaledVector(d,Math.min(rho,(lo+hi)*.5)).applyMatrix4(inverse);p[id*3]=next.x;p[id*3+1]=next.y;p[id*3+2]=next.z;
  }
  let current=triangles;
  for(let level=0;level<2;level++){
   const mids=new Map(),next=[];
   const mid=(a,b)=>{if(portOf.has(a)&&portOf.get(a)===portOf.get(b))return null;const key=a<b?a+','+b:b+','+a;if(mids.has(key))return mids.get(key);const id=add(world(a).lerp(world(b),.5));project(id);mids.set(key,id);return id;};
   for(const tri of current){const m=[mid(tri[0],tri[1]),mid(tri[1],tri[2]),mid(tri[2],tri[0])],count=m.filter(id=>id!==null).length;
    if(count===0){next.push(tri);continue;}
    if(count===3){const[a,b,c]=tri,[ab,bc,ca]=m;next.push([a,ab,ca],[ab,b,bc],[ca,bc,c],[ab,bc,ca]);continue;}
    if(count===1){const i=m.findIndex(id=>id!==null),a=tri[i],b=tri[(i+1)%3],c=tri[(i+2)%3];next.push([a,m[i],c],[m[i],b,c]);continue;}
    const i=m.findIndex(id=>id===null),a=tri[i],b=tri[(i+1)%3],c=tri[(i+2)%3],bc=m[(i+1)%3],ca=m[(i+2)%3];next.push([c,ca,bc],[a,b,ca],[b,bc,ca]);
   }
   current=next;
  }
  for(const tri of current)face(...tri);
 }
 function circle(center,direction,radius){const x=V().crossVectors(Math.abs(direction.z)<.8?V(0,0,1):V(0,1,0),direction).normalize(),y=V().crossVectors(direction,x).normalize();return Array.from({length:N},(_,i)=>add(center.clone().addScaledVector(x,Math.cos(i/N*TAU)*radius).addScaledVector(y,Math.sin(i/N*TAU)*radius)));}
 const centers=[toWorld(.42,0,.03),toWorld(.86,.35,.04),toWorld(1.22,.01,-.02),toWorld(.84,-.36,.025)],ends=[toWorld(1.02,.77,.12),toWorld(1.67,.08,-.06),toWorld(.98,-.79,.10)],graph=[[0,1],[1,2],[2,3],[3,0]],ports=centers.map(()=>new Map()),r=.040*scale,jr=.094*scale;
 const neighbors=[[root,centers[1],centers[3]],[centers[0],centers[2],ends[0]],[centers[1],centers[3],ends[1]],[centers[2],centers[0],ends[2]]];
 const networkPortRecords=[],cycleCenter=centers.reduce((q,c)=>q.add(c),V()).multiplyScalar(.25);
 for(let node=0;node<4;node++){
  const directions=neighbors[node].map(q=>q.clone().sub(centers[node]).normalize()),rings=directions.map(d=>circle(centers[node].clone().addScaledVector(d,jr),d,r)),all=rings.flat(),junctionTriangles=[],lookup=new Map(all.map(id=>{const q=world(id);return[q.toArray().map(v=>Math.round(v*1e6)).join(','),id];})),hull=new ConvexGeometry(all.map(world)),hp=hull.attributes.position;
  for(let f=0;f<hp.count;f+=3){const tri=[0,1,2].map(j=>V().fromBufferAttribute(hp,f+j));if(directions.some(d=>tri.every(q=>Math.abs(q.clone().sub(centers[node]).dot(d)-jr)<1e-6)))continue;const ids=tri.map(q=>{const key=q.toArray().map(v=>Math.round(v*1e6)).join(',');let id=lookup.get(key);if(id===undefined){id=all.find(candidate=>world(candidate).distanceToSquared(q)<1e-10);if(id===undefined)throw Error('Convex junction vertex is not a port vertex');lookup.set(key,id);}return id;});junctionTriangles.push(ids);}
  hull.dispose();roundedJunction(junctionTriangles,rings,centers[node],directions,r);
  rings.forEach((ring,i)=>{ports[node].set(neighbors[node][i],ring);networkPortRecords.push({node,ids:ring.slice(),center:centers[node].clone().addScaledVector(directions[i],jr).toArray()});});
 }
 const rootBridge=bridge(port.ring,ports[0].get(root),20,{taper:true}),graphPaths=[],terminalPaths=[];
 for(const[a,b]of graph){const bend=centers[a].clone().add(centers[b]).multiplyScalar(.5).sub(cycleCenter);bend.addScaledVector(up,-bend.dot(up)).normalize().multiplyScalar(.028*scale);const path=bridge(ports[a].get(centers[b]),ports[b].get(centers[a]),12,{bend});graphPaths.push([centers[a],...path,centers[b]]);}
 for(let i=0;i<3;i++){
  const node=i+1,dir=ends[i].clone().sub(centers[node]).normalize(),endRadius=r*.88,endRing=circle(ends[i],dir,endRadius),path=bridge(ports[node].get(ends[i]),endRing,12,{bend:up.clone().multiplyScalar((i%2?-1:1)*.018*scale)});let last=endRing;
  for(let k=1;k<3;k++){const angle=k*Math.PI/6,ring=circle(ends[i].clone().addScaledVector(dir,endRadius*Math.sin(angle)),dir,endRadius*Math.cos(angle));for(let j=0;j<N;j++){const n=(j+1)%N;face(last[j],last[n],ring[j]);face(last[n],ring[n],ring[j]);}last=ring;}
  const tip=ends[i].clone().addScaledVector(dir,endRadius),endCenter=add(tip);for(let j=0;j<N;j++)face(last[j],last[(j+1)%N],endCenter);terminalPaths.push([centers[node],...path,tip]);
 }
 // Propagate orientations from the preserved original first face; all old
 // indices must remain as oriented by the existing factory.
 const edge=new Map(),faces=indices.length/3;for(let f=0;f<faces;f++)for(let j=0;j<3;j++){const a=indices[f*3+j],b=indices[f*3+(j+1)%3],key=a<b?a+','+b:b+','+a;const list=edge.get(key)??[];list.push({f,s:a<b?1:-1});edge.set(key,list);}
 const adjacent=Array.from({length:faces},()=>[]);for(const list of edge.values()){if(list.length!==2)throw Error('SER shared-index boundary is nonmanifold: '+JSON.stringify([...edge.entries()].filter(([k,v])=>v.length!==2).slice(0,8).map(([k,v])=>({k,count:v.length}))));const[a,b]=list;adjacent[a.f].push({f:b.f,same:a.s===b.s});adjacent[b.f].push({f:a.f,same:a.s===b.s});}
 const flip=new Int8Array(faces).fill(-1),queue=[0];flip[0]=0;for(let h=0;h<queue.length;h++){const f=queue[h];for(const n of adjacent[f]){const value=flip[f]^(n.same?1:0);if(flip[n.f]<0){flip[n.f]=value;queue.push(n.f);}else if(flip[n.f]!==value)throw Error('SER wall is nonorientable');}}if(queue.length!==faces)throw Error('SER wall is not attached to the old ER component');
 for(let f=0;f<faces;f++)if(flip[f]){const t=indices[f*3+1];indices[f*3+1]=indices[f*3+2];indices[f*3+2]=t;}
 const out=new THREE.BufferGeometry();out.setAttribute('position',new THREE.Float32BufferAttribute(p,3));out.setAttribute('uv',new THREE.Float32BufferAttribute(uv,2));out.setIndex(indices);let start=0,last=mats[0];for(let f=1;f<=mats.length;f++)if(f===mats.length||mats[f]!==last){out.addGroup(start*3,(f-start)*3,last);start=f;last=mats[f];}out.computeVertexNormals();out.computeBoundingBox();out.computeBoundingSphere();
 const rootPath=[root,...rootBridge.slice(1),centers[0]],paths=[rootPath,...graphPaths,...terminalPaths];
 const local=q=>q.clone().applyMatrix4(inverse).toArray();
 const metadata={teachingOnly:true,roundedJunctions:true,junctionMethod:"Two local refinements with fixed port rings, projected onto a smooth union of the three existing tube axes",curvedBridgePeak:.028*scale,rootNeckProfile:"Smoothstep log-radius taper with fixed original root ring",roundedTerminalTips:true,sideRotation,scale,materialIndex,preservedTriangleCount:geometry.index.count/3-port.removed.size,notEMSegmentation:true,ribosomeFree:true,hasTubularNetwork:true,sharedTerminalPortIds:port.ring.slice(),removedCapCenterId:capCenterId,removedCapFaceCount:port.removed.size,oldVertexCount:baseP.count,addedVertices:out.attributes.position.count-baseP.count,addedTriangleCount:out.index.count/3-(geometry.index.count/3-port.removed.size),junctions:4,closedNetworkCycles:1,terminalBranches:3,portRecords:networkPortRecords,paths:paths.map(p=>p.map(q=>local(q))),roughAnchor:local(root),smoothAnchor:local(centers[2]),smoothCamera:local(centers[2].clone().addScaledVector(up,.7*scale).addScaledVector(side,.25*scale)),smoothTarget:local(centers[1]),domainDescription:'Connected ribosome-free tubular ER domain with four coarse three-way junctions and one closed loop; same ER lumen through a shared-index terminal port. Not a fixed universal SER morphology.'};
 out.userData={...geometry.userData,smoothER:metadata};return{geometry:out,metadata};
}

/** Existing NE–ER cap lookup: a cap fan has 36 incident ER triangles. */
export function attachSERToNuclearER(continuum,{scale=.72,sideRotation=Math.PI*.6,materialIndex=3}={}){
 const g=continuum.geometry,ix=g.index.array,mat=faceMaterials(g),degree=new Uint16Array(g.attributes.position.count),notER=new Uint8Array(degree.length);for(let f=0;f<ix.length;f+=3)for(let j=0;j<3;j++){degree[ix[f+j]]++;if(mat[f/3]!==1)notER[ix[f+j]]=1;}
 const candidates=[];for(let i=0;i<degree.length;i++)if(degree[i]===36&&!notER[i]){const q=V().fromBufferAttribute(g.attributes.position,i).applyMatrix4(LOCAL_TO_CELL);candidates.push({id:i,p:q,score:q.x+.9*q.y});}
 // Pick the outermost right/upper closed ER terminal, separated from ONM ports.
 // Rotate the new network 108 degrees around its outward axis: the unrotated
 // lateral branch crosses a neighbouring old cisterna. Old NE/RER vertices stay fixed.
 candidates.sort((a,b)=>b.score-a.score);if(!candidates.length)throw Error('No intact NE–ER terminal cap found');
 const result=attachSmoothERNetwork({geometry:g,capCenterId:candidates[0].id,metricMatrix:LOCAL_TO_CELL,materialIndex,scale,sideRotation});
 return{...continuum,geometry:result.geometry,anchors:{...continuum.anchors,smoothER:V().fromArray(result.metadata.smoothAnchor),smoothERCamera:V().fromArray(result.metadata.smoothCamera),smoothERTarget:V().fromArray(result.metadata.smoothTarget)},metadata:{...continuum.metadata,smoothER:result.metadata}};
}
