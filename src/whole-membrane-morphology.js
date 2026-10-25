// Whole-cell display morphology informed by macrophage SEM surface topology.
// This transforms the existing closed interface; it is not an EM segmentation.
// The map is radial and strictly increasing on every ray. Even return folds
// retain their radial ordering, rather than being flattened into a sphere.
const clamp=(x,a,b)=>Math.max(a,Math.min(b,x));
export function membraneMorphologyRadius(radius,n,bodyRadius){
 const base=bodyRadius+.24,excess=Math.max(0,radius-base);
 // Original large round pseudopods are shortened, not replaced by detached
 // fins. Posterior bumps are restrained so the section reads as a thin film.
 const posterior=clamp((-n.z-.05)/.55,0,1),floor=.46-.17*posterior;
 const mapped=excess*floor+(1-floor)*.19*(1-Math.exp(-excess/.19));
 return radius-excess+mapped;
}
export function refineWholeMembraneGeometry(geometry,bodyRadius,THREE){
 const p=geometry.attributes.position,original=p.array.slice(),v=new THREE.Vector3(),n=v.clone();let maxMoved=0,changed=0;
 for(let i=0;i<p.count;i++){
  v.fromBufferAttribute(p,i);const r=v.length();if(r<1e-9)continue;n.copy(v).multiplyScalar(1/r);
  const next=membraneMorphologyRadius(r,n,bodyRadius(n));maxMoved=Math.max(maxMoved,Math.abs(next-r));if(Math.abs(next-r)>1e-6)changed++;
  v.multiplyScalar(next/r);p.setXYZ(i,v.x,v.y,v.z);
 }
 // Marching-cube welding leaves a few nearly collinear sliver triangles. A
 // nonlinear map can invert their linear interpolant despite its positive
 // continuous Jacobian. Collapse only an exceptionally short edge when the
 // manifold link condition holds; normal sized triangles are never removed.
 const sourceIndex=geometry.index.array,parents=Int32Array.from({length:p.count},(_,i)=>i),repairs=[];
 const a=new THREE.Vector3(),b=a.clone(),c=a.clone(),oa=a.clone(),ob=a.clone(),oc=a.clone(),before=a.clone(),after=a.clone();
 const find=i=>{while(parents[i]!==i)i=parents[i];return i;};
 for(let k=0;k<sourceIndex.length;k+=3){
  const ids=[sourceIndex[k],sourceIndex[k+1],sourceIndex[k+2]];oa.fromArray(original,ids[0]*3);ob.fromArray(original,ids[1]*3);oc.fromArray(original,ids[2]*3);before.crossVectors(ob.clone().sub(oa),oc.clone().sub(oa));
  if(before.length()/2>=1e-7)continue;
  a.fromBufferAttribute(p,ids[0]);b.fromBufferAttribute(p,ids[1]);c.fromBufferAttribute(p,ids[2]);after.crossVectors(b.clone().sub(a),c.clone().sub(a));if(before.dot(after)>=0)continue;
  const originalPoints=[oa,ob,oc],lengths=originalPoints.map((point,j)=>point.distanceTo(originalPoints[(j+1)%3])),edge=lengths.indexOf(Math.min(...lengths));if(lengths[edge]>.002)continue;
  const u=find(ids[edge]),w=find(ids[(edge+1)%3]),neighborsU=new Set(),neighborsW=new Set();let incident=0;
  for(let j=0;j<sourceIndex.length;j+=3){const face=[find(sourceIndex[j]),find(sourceIndex[j+1]),find(sourceIndex[j+2])];if(face.includes(u))for(const id of face)if(id!==u)neighborsU.add(id);if(face.includes(w))for(const id of face)if(id!==w)neighborsW.add(id);if(face.includes(u)&&face.includes(w))incident++;}
  if(incident!==2||[...neighborsU].filter(id=>neighborsW.has(id)).length!==2)continue;
  const keep=Math.min(u,w),remove=Math.max(u,w);parents[remove]=keep;repairs.push({keepOriginalVertex:keep,removedOriginalVertex:remove,originalEdgeLength:lengths[edge],originalSliverArea:before.length()/2,positionAfterMapping:[p.getX(keep),p.getY(keep),p.getZ(keep)]});
 }
 if(repairs.length){
  const indices=[],used=new Map(),positions=[];for(let k=0;k<sourceIndex.length;k+=3){const ids=[find(sourceIndex[k]),find(sourceIndex[k+1]),find(sourceIndex[k+2])];if(new Set(ids).size<3)continue;for(const id of ids){if(!used.has(id)){used.set(id,positions.length/3);positions.push(p.getX(id),p.getY(id),p.getZ(id));}indices.push(used.get(id));}}
  geometry.setAttribute('position',new THREE.Float32BufferAttribute(positions,3));geometry.setIndex(new THREE.Uint32BufferAttribute(indices,1));geometry.clearGroups();geometry.addGroup(0,indices.length,0);
 }
 geometry.attributes.position.needsUpdate=true;geometry.deleteAttribute('normal');geometry.computeVertexNormals();geometry.computeBoundingBox();geometry.computeBoundingSphere();
 geometry.userData={...geometry.userData,semInformedRadialRefinement:true,measuredEMSegmentation:false};
 return {version:3,fineFoldFinishIsShaderOnly:true,changedVertices:changed,maxVertexDisplacement:maxMoved,positiveRadialDerivativeLowerBound:.29,bodyEnvelopePreserved:true,queryUsesSameGeometry:true,newDetachedMeshes:false,sliverEdgeRepairs:repairs};
}
