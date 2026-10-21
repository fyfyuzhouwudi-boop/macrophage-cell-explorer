import * as THREE from 'three';

// Static mesh queries use the actual indexed envelope, without angular-grid assumptions.
export function createMembraneSurfaceQuery(geometry) {
  const position=geometry.attributes.position, index=geometry.index;
  if(!position||!index)throw new TypeError('An indexed membrane surface is required');
  const faceCount=index.count/3, faces=Array.from({length:faceCount},(_,i)=>i);
  const bounds=new Float64Array(faceCount*6),centers=new Float64Array(faceCount*3);
  const a=new THREE.Vector3(),b=a.clone(),c=a.clone(),hit=a.clone(),closest=a.clone(),normal=a.clone();
  for(let f=0;f<faceCount;f++){
    a.fromBufferAttribute(position,index.getX(f*3));b.fromBufferAttribute(position,index.getX(f*3+1));c.fromBufferAttribute(position,index.getX(f*3+2));
    for(let k=0;k<3;k++){const key=['x','y','z'][k];bounds[f*6+k]=Math.min(a[key],b[key],c[key]);bounds[f*6+k+3]=Math.max(a[key],b[key],c[key]);centers[f*3+k]=(a[key]+b[key]+c[key])/3;}
  }
  const nodes=[];
  function build(ids){
    const box=new THREE.Box3(),min=new THREE.Vector3(Infinity,Infinity,Infinity),max=min.clone().negate();
    for(const f of ids)for(let k=0;k<3;k++){min.setComponent(k,Math.min(min.getComponent(k),bounds[f*6+k]));max.setComponent(k,Math.max(max.getComponent(k),bounds[f*6+k+3]));}box.set(min,max);
    const node={box,faces:null,left:null,right:null};nodes.push(node);
    if(ids.length<=20){node.faces=ids;return node;}
    const size=box.getSize(new THREE.Vector3()),axis=size.x>=size.y&&size.x>=size.z?0:size.y>=size.z?1:2;
    ids.sort((x,y)=>centers[x*3+axis]-centers[y*3+axis]);const mid=Math.floor(ids.length/2);
    node.left=build(ids.slice(0,mid));node.right=build(ids.slice(mid));return node;
  }
  const root=build(faces),triangle=new THREE.Triangle();let disposed=false;
  function load(f){a.fromBufferAttribute(position,index.getX(f*3));b.fromBufferAttribute(position,index.getX(f*3+1));c.fromBufferAttribute(position,index.getX(f*3+2));}
  function raycast(origin,direction,{farthest=false,maxDistance=Infinity}={}){
    if(disposed)return null;const ray=new THREE.Ray(origin,direction.clone().normalize()),stack=[root];let best=farthest?-Infinity:Infinity,result=null;
    while(stack.length){const node=stack.pop();if(!ray.intersectsBox(node.box))continue;if(node.faces){for(const f of node.faces){load(f);if(!ray.intersectTriangle(a,b,c,false,hit))continue;const d=origin.distanceTo(hit);if(d>maxDistance||!(farthest?d>best:d<best))continue;best=d;normal.crossVectors(b.clone().sub(a),c.clone().sub(a)).normalize();result={point:hit.clone(),normal:normal.clone(),distance:d,faceIndex:f};}}else stack.push(node.left,node.right);}
    return result;
  }
  function closestPoint(point,{maxDistance=Infinity}={}){
    if(disposed)return null;let best=maxDistance*maxDistance,result=null;const stack=[root];
    while(stack.length){const node=stack.pop();const d=node.box.distanceToPoint(point);if(d*d>best)continue;if(node.faces){for(const f of node.faces){load(f);triangle.set(a,b,c).closestPointToPoint(point,closest);const sq=point.distanceToSquared(closest);if(sq>=best)continue;best=sq;normal.crossVectors(b.clone().sub(a),c.clone().sub(a)).normalize();result={point:closest.clone(),normal:normal.clone(),distance:Math.sqrt(sq),faceIndex:f};}}else stack.push(node.left,node.right);}
    return result;
  }
  function radiusAlong(direction){const result=raycast(new THREE.Vector3(),direction,{farthest:true});return result?result.point.length():NaN;}
  return {raycast,closestPoint,radiusAlong,bounds:root.box.clone(),diagnostics:()=>({faces:faceCount,bvhNodes:nodes.length,static:true,method:'Actual indexed triangles; BVH boxes prune only'}),dispose:()=>{disposed=true;faces.length=0;nodes.length=0;}};
}
