import * as THREE from 'three';

// Region framing for the TWO existing procedural ER models. No geometry or
// visibility changes: actual added SER vertices, shared port and proximal RER.
const regionCache=new WeakMap();
function localRegion(geometry){
 let cached=regionCache.get(geometry);if(cached)return cached;
 const meta=geometry.userData.smoothER,positions=geometry.attributes.position;
 if(!meta||!positions)throw Error('The selected ER wall has no connected SER region');
 const V=(a)=>new THREE.Vector3().fromArray(a),root=V(meta.roughAnchor),c0=V(meta.paths[0].at(-1)),c1=V(meta.paths[1].at(-1)),c2=V(meta.paths[2].at(-1)),c3=V(meta.paths[3].at(-1));
 const forward=c0.clone().sub(root).normalize(),neckLength=c0.distanceTo(root);
 let portRadius=0;for(const id of meta.sharedTerminalPortIds){const d=new THREE.Vector3().fromBufferAttribute(positions,id).sub(root),axial=d.dot(forward);portRadius=Math.max(portRadius,d.addScaledVector(forward,-axial).length());}
 const ids=new Set(meta.sharedTerminalPortIds);for(let i=meta.oldVertexCount;i<positions.count;i++)ids.add(i);
 let contextVertices=0;
 for(let i=0;i<meta.oldVertexCount;i++){
  const d=new THREE.Vector3().fromBufferAttribute(positions,i).sub(root),axial=d.dot(forward),radial=d.addScaledVector(forward,-axial).length();
  if(axial>=-neckLength*.85&&axial<=neckLength*.12&&radial<=portRadius*1.12){ids.add(i);contextVertices++;}
 }
 cached={points:[...ids].map(i=>new THREE.Vector3().fromBufferAttribute(positions,i)),c0,c1,c2,c3,oldCamera:V(meta.smoothCamera),oldTarget:V(meta.smoothTarget),contextVertices,addedVertices:meta.addedVertices};regionCache.set(geometry,cached);return cached;
}

export function fitSmoothEROverview({mesh,connectedER=false,camera,width,height}={}){
 if(!mesh?.isMesh||!camera?.isPerspectiveCamera||!(width>0&&height>0))throw TypeError('ER mesh, perspective camera and measured viewport required');
 mesh.updateWorldMatrix(true,false);
 const local=localRegion(mesh.geometry),world=v=>v.clone().applyMatrix4(mesh.matrixWorld),points=local.points.map(world),bounds=new THREE.Box3().setFromPoints(points),target=bounds.getCenter(new THREE.Vector3());
 const c0=world(local.c0),c1=world(local.c1),c2=world(local.c2),c3=world(local.c3),direction=new THREE.Vector3().crossVectors(c2.clone().sub(c0),c1.clone().sub(c3)).normalize();
 // Retain the intended construction-plane side, then use the exposed hemisphere
 // validated for each existing model. Ordinary RER masks the old +normal side;
 // the connected NE/RER model masks the opposite side. No camera.up mutation.
 if(direction.dot(world(local.oldCamera).sub(world(local.oldTarget)))<0)direction.negate();
 if(!connectedER)direction.negate();
 const right=new THREE.Vector3().crossVectors(camera.up,direction).normalize();
 if(right.lengthSq()<1e-10)throw Error('SER overview direction is parallel to the camera up axis');
 const up=new THREE.Vector3().crossVectors(direction,right).normalize(),tan=Math.tan(THREE.MathUtils.degToRad(camera.getEffectiveFOV()*.5)),aspect=width/height;
 const verticalFraction=Math.max(.55,(height-150)/height),horizontalFraction=Math.max(.65,(width-100)/width);
 let distance=0;
 for(const point of points){const q=point.clone().sub(target),depth=q.dot(direction);distance=Math.max(distance,depth+Math.abs(q.dot(up))/(tan*verticalFraction),depth+Math.abs(q.dot(right))/(tan*aspect*horizontalFraction));}
 distance*=1.03;
 const position=target.clone().addScaledVector(direction,distance);
 return{position,target,distance,points,diagnostics:{method:'Actual SER wall + shared port + proximal RER vertices; perspective edge inequalities',connectedER,pointCount:points.length,contextVertices:local.contextVertices,addedVertices:local.addedVertices,bounds:{min:bounds.min.toArray(),max:bounds.max.toArray()},target:target.toArray(),direction:direction.toArray(),position:position.toArray(),distance,width,height,effectiveFOV:camera.getEffectiveFOV(),verticalFraction,horizontalFraction}};
}
