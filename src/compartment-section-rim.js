import * as THREE from 'three';

// Fill the actual wall thickness exposed by a cut, using intersections with
// both rendered membrane faces. This is a planar annulus, not a drawn outline.
function intersections(geometry,plane){
  const p=geometry.attributes.position,index=geometry.index?.array,segments=[],nodes=[],keys=new Map(),edges=new Set();
  const points=[new THREE.Vector3(),new THREE.Vector3(),new THREE.Vector3()],distance=[],eps=1e-9;
  function node(point){
    const key=point.toArray().map(v=>Math.round(v*1e7)).join(',');
    if(!keys.has(key)){keys.set(key,nodes.length);nodes.push({point:point.clone(),neighbours:[]});}return keys.get(key);
  }
  const count=index?.length??p.count;
  for(let i=0;i<count;i+=3){
    for(let j=0;j<3;j++){points[j].fromBufferAttribute(p,index?index[i+j]:i+j);distance[j]=plane.distanceToPoint(points[j]);}
    if(distance.every(d=>d>eps)||distance.every(d=>d< -eps))continue;
    const hits=[];
    for(let j=0;j<3;j++){
      const k=(j+1)%3,a=distance[j],b=distance[k];
      if(Math.abs(a)<eps)hits.push(points[j].clone());
      if(a*b< -eps*eps)hits.push(points[j].clone().lerp(points[k],a/(a-b)));
    }
    const unique=hits.filter((q,j)=>hits.findIndex(r=>r.distanceToSquared(q)<1e-16)===j);
    if(unique.length!==2||unique[0].distanceToSquared(unique[1])<1e-18)continue;
    const a=node(unique[0]),b=node(unique[1]),key=Math.min(a,b)+':'+Math.max(a,b);if(edges.has(key))continue;
    edges.add(key);nodes[a].neighbours.push(b);nodes[b].neighbours.push(a);segments.push([a,b]);
  }
  const used=new Set(),loops=[];
  for(const [start,next]of segments){
    const firstKey=Math.min(start,next)+':'+Math.max(start,next);if(used.has(firstKey))continue;
    const ids=[start];let previous=start,current=next,closed=false;
    used.add(firstKey);
    for(let step=0;step<=segments.length;step++){
      if(current===start){closed=true;break;}ids.push(current);
      const candidate=nodes[current].neighbours.find(v=>v!==previous&&!used.has(Math.min(current,v)+':'+Math.max(current,v)));
      if(candidate===undefined)break;
      used.add(Math.min(current,candidate)+':'+Math.max(current,candidate));previous=current;current=candidate;
    }
    if(closed&&ids.length>=3)loops.push(ids.map(i=>nodes[i].point));
  }
  return {loops,segments:segments.length,openVertices:nodes.filter(n=>n.neighbours.length!==2).length};
}

function inside(point,polygon){let odd=false;for(let i=0,j=polygon.length-1;i<polygon.length;j=i++)if((polygon[i].y>point.y)!==(polygon[j].y>point.y)&&point.x<(polygon[j].x-polygon[i].x)*(point.y-polygon[i].y)/(polygon[j].y-polygon[i].y)+polygon[i].x)odd=!odd;return odd;}

export function createMembraneSectionBridge({outerGeometry,innerGeometry,material,name='ActualMembraneSectionBridge'}){
  const empty=()=>{const g=new THREE.BufferGeometry();g.setAttribute('position',new THREE.Float32BufferAttribute([],3));return g;};
  const mesh=new THREE.Mesh(empty(),material);mesh.name=name;mesh.visible=false;
  mesh.userData={limitingMembrane:true,actualSectionBridge:true,fromRenderedTriangleIntersections:true,notAnOutline:true};
  let previousPlane='';
  function update(section,plane){
    if(section<=2e-3){mesh.visible=false;previousPlane='';return;}
    const signature=plane.normal.toArray().concat(plane.constant).join(',');if(signature===previousPlane)return;previousPlane=signature;
    const outer=intersections(outerGeometry,plane),inner=intersections(innerGeometry,plane),normal=plane.normal.clone().negate();
    const u=new THREE.Vector3().crossVectors(Math.abs(normal.z)<.8?new THREE.Vector3(0,0,1):new THREE.Vector3(0,1,0),normal).normalize(),v=new THREE.Vector3().crossVectors(normal,u).normalize(),origin=plane.coplanarPoint(new THREE.Vector3());
    const project=loop=>loop.map(p=>new THREE.Vector2(p.clone().sub(origin).dot(u),p.clone().sub(origin).dot(v))),outer2=outer.loops.map(project),inner2=inner.loops.map(project),positions=[],normals=[];
    for(let i=0;i<outer2.length;i++){
      const holes=inner2.filter(h=>inside(h[0],outer2[i])),all=outer2[i].concat(...holes),triangles=THREE.ShapeUtils.triangulateShape(outer2[i],holes);
      for(const triangle of triangles){
        const [a,b,c]=triangle.map(k=>all[k]);if((b.x-a.x)*(c.y-a.y)-(b.y-a.y)*(c.x-a.x)<0)triangle.reverse();
        for(const k of triangle){const p=origin.clone().addScaledVector(u,all[k].x).addScaledVector(v,all[k].y);positions.push(p.x,p.y,p.z);normals.push(normal.x,normal.y,normal.z);}
      }
    }
    const geometry=new THREE.BufferGeometry();geometry.setAttribute('position',new THREE.Float32BufferAttribute(positions,3));geometry.setAttribute('normal',new THREE.Float32BufferAttribute(normals,3));geometry.computeBoundingSphere();
    geometry.userData={sectionPlane:plane.normal.toArray().concat(plane.constant),outerContours:outer.loops.length,innerContours:inner.loops.length,openIntersectionVertices:outer.openVertices+inner.openVertices,actualMembraneThickness:true};
    mesh.geometry.dispose();mesh.geometry=geometry;mesh.visible=positions.length>0;
    mesh.userData.sectionBridge=geometry.userData;
  }
  return {mesh,update};
}
