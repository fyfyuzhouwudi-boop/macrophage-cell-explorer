import * as THREE from "three";
import DATA from "./molecular-structure-data.js";
export const MOLECULAR_IDS = Object.freeze(["tubulin-structure", "ribosome-structure"]);
export const MOLECULAR_CATALOG = Object.freeze({
  "tubulin-structure": Object.freeze({name:"α/β 微管蛋白 · 牛同源结构",color:"#83a7bd",summary:"由 PDB 1JFF 的 A/B 链 Cα 坐标派生的折叠骨架。牛同源示例；缺失区段保持断开。",pdbId:"1JFF",species:"Bos taurus",microLabel:"观察蛋白骨架局部",representation:"Cα 轨迹，不是原子表面或二级结构丝带"}),
  "ribosome-structure": Object.freeze({name:"人 80S 核糖体 · 坐标骨架",color:"#b6a3bf",summary:"由 PDB 4UG0 的蛋白 Cα 与 RNA P 坐标派生，按链及亚基着色。显示已有坐标，不补缺失环。",pdbId:"4UG0",species:"Homo sapiens",microLabel:"观察 RNA / 蛋白骨架局部",representation:"Cα/P 轨迹，不是原子表面或二级结构丝带"})
});
export const catalog = MOLECULAR_CATALOG;
const decoded = new Map();
function decode(id) {
  if (decoded.has(id)) return decoded.get(id);
  if (DATA.format !== "atlas-molecular-backbone-v1") throw new Error("Unsupported molecular trace data format");
  const source = DATA.models[id];
  if (!source || source.pointCount > 20000) throw new Error("Invalid molecular coordinate source");
  const binary = atob(source.coordinatesI16LE);
  if (binary.length !== source.pointCount * 6) throw new Error("Molecular coordinate payload length mismatch");
  const bytes = new Uint8Array(binary.length);
  for (let i=0;i<binary.length;i++) bytes[i]=binary.charCodeAt(i);
  const view = new DataView(bytes.buffer), points = new Float32Array(source.pointCount * 3), factor=source.sourceToDisplay.quantumAngstrom*source.sourceToDisplay.localScalePerAngstrom;
  for (let i=0;i<points.length;i++) points[i]=view.getInt16(i*2,true)*factor;
  for (const segment of source.segments) if (!Number.isInteger(segment.start)||!Number.isInteger(segment.count)||segment.start<0||segment.count<1||segment.start+segment.count>source.pointCount||!source.chains[segment.chain]) throw new Error("Invalid molecular trace segment");
  const result={source,points};decoded.set(id,result);return result;
}
function colorFor(chain,index) {
  let hex;
  if(chain.group==="alpha")hex="#73a9bd";
  else if(chain.group==="beta")hex="#b986ad";
  else if(chain.group==="tRNA")hex="#6fbaa8";
  else if(chain.kind==="RNA")hex=chain.group==="60S"?"#d3ad69":"#ad91bc";
  else hex=chain.group==="60S"?"#85a7ba":"#d49a83";
  return new THREE.Color(hex).offsetHSL(((index*7)%11-5)*.006,0,((index*3)%7-3)*.012);
}
function traceGeometry(source,points,detail) {
  const positions=[],normals=[],colors=[],indices=[],sides=detail?6:4,step=detail?source.lod.detailStep:source.lod.overviewStep;
  const center=new THREE.Vector3(),previous=new THREE.Vector3(),next=new THREE.Vector3(),tangent=new THREE.Vector3(),normal=new THREE.Vector3(),binormal=new THREE.Vector3(),radial=new THREE.Vector3(),oldNormal=new THREE.Vector3(),reference=new THREE.Vector3();
  let renderedPoints=0,renderedEdges=0,isolatedPoints=0;
  const read=(id,out)=>out.fromArray(points,id*3);
  function append(point,n,color){const at=positions.length/3;positions.push(point.x,point.y,point.z);normals.push(n.x,n.y,n.z);colors.push(color.r,color.g,color.b);return at;}
  for (const segment of source.segments) {
    const chain=source.chains[segment.chain],kept=[];
    for(let i=0;i<segment.count;i++)if(i%step===0||i===segment.count-1)kept.push(segment.start+i);
    renderedPoints+=kept.length;
    if(kept.length<2){isolatedPoints+=kept.length;continue;}
    const color=colorFor(chain,segment.chain),radiusAngstrom=chain.kind==="RNA"?.95:.66,radius=radiusAngstrom*source.sourceToDisplay.localScalePerAngstrom*(detail?1:1.2),first=positions.length/3;
    oldNormal.set(0,0,0);const tangents=[];
    for(let i=0;i<kept.length;i++){
      read(kept[i],center);read(kept[Math.max(0,i-1)],previous);read(kept[Math.min(kept.length-1,i+1)],next);tangent.subVectors(next,previous);
      if(tangent.lengthSq()<1e-14){if(i+1<kept.length)tangent.subVectors(next,center);else tangent.subVectors(center,previous);}
      if(tangent.lengthSq()<1e-14)throw new Error("Coincident consecutive molecular trace nodes");tangent.normalize();tangents.push(tangent.clone());
      normal.copy(oldNormal).addScaledVector(tangent,-oldNormal.dot(tangent));
      if(normal.lengthSq()<1e-10){reference.set(Math.abs(tangent.x)<.8?1:0,Math.abs(tangent.x)<.8?0:1,0);normal.crossVectors(tangent,reference);}
      normal.normalize();binormal.crossVectors(tangent,normal).normalize();oldNormal.copy(normal);
      for(let side=0;side<sides;side++){const angle=side/sides*Math.PI*2;radial.copy(normal).multiplyScalar(Math.cos(angle)).addScaledVector(binormal,Math.sin(angle));append(center.clone().addScaledVector(radial,radius),radial,color);}
    }
    for(let i=0;i<kept.length-1;i++)for(let side=0;side<sides;side++){const a=first+i*sides+side,b=first+(i+1)*sides+side,c=first+i*sides+(side+1)%sides,d=first+(i+1)*sides+(side+1)%sides;indices.push(a,c,b,b,c,d);}
    // Endpoint caps close the display tube only; an unobserved backbone gap
    // remains a gap because no triangles are emitted between segments.
    const startCenter=append(read(kept[0],center),tangents[0].clone().negate(),color),endCenter=append(read(kept.at(-1),center),tangents.at(-1),color);
    for(let side=0;side<sides;side++){indices.push(startCenter,first+(side+1)%sides,first+side);const last=first+(kept.length-1)*sides;indices.push(endCenter,last+side,last+(side+1)%sides);}
    renderedEdges+=kept.length-1;
  }
  const geometry=new THREE.BufferGeometry();geometry.setAttribute("position",new THREE.Float32BufferAttribute(positions,3));geometry.setAttribute("normal",new THREE.Float32BufferAttribute(normals,3));geometry.setAttribute("color",new THREE.Float32BufferAttribute(colors,3));geometry.setIndex(indices);geometry.computeBoundingBox();geometry.computeBoundingSphere();
  return{geometry,renderedPoints,renderedEdges,isolatedPoints,sides};
}
export function createMolecularModel(id,{detail=true}={}) {
  if(!MOLECULAR_IDS.includes(id))throw new RangeError("Unknown molecular representative: "+id);
  const{source,points}=decode(id),built=traceGeometry(source,points,Boolean(detail)),group=new THREE.Group();group.name="SourceDerivedBackbone_"+source.pdbId;
  group.userData={organelleId:id,molecularSourceId:source.pdbId,teachingOnly:true,representation:source.representation,section:0};
  const material=new THREE.MeshPhysicalMaterial({color:"#ffffff",vertexColors:true,roughness:.42,metalness:.015,clearcoat:.3,clearcoatRoughness:.24,side:THREE.DoubleSide});
  const mesh=new THREE.Mesh(built.geometry,material);mesh.name=source.pdbId+"_Observed_Backbone_Trace";mesh.userData={...group.userData,backboneTrace:true};mesh.castShadow=true;mesh.receiveShadow=true;group.add(mesh);
  const radius=Math.max(1.5,built.geometry.boundingSphere.radius),focus=built.geometry.boundingBox.getCenter(new THREE.Vector3());
  let target=new THREE.Vector3();let highest=-Infinity;
  for(let i=0;i<points.length;i+=3)if(Math.abs(points[i]-focus.x)<.5&&points[i+2]>highest){highest=points[i+2];target.fromArray(points,i);}
  if(!Number.isFinite(highest))target.copy(focus);
  const camera=target.clone().addScaledVector(new THREE.Vector3(.2,.12,1).normalize(),radius*1.15);
  if(camera.distanceTo(focus)<radius+.15)camera.sub(focus).normalize().multiplyScalar(radius+.4).add(focus);
  const anchors={focus,inside:camera,insideTarget:target},localPlane=new THREE.Plane(new THREE.Vector3(0,0,-1),radius*1.2),worldPlane=localPlane.clone();
  let section=0,disposed=false;
  function refreshPlane(){group.updateWorldMatrix(true,false);worldPlane.copy(localPlane).applyMatrix4(group.matrixWorld);material.clippingPlanes=section>.002?[worldPlane]:null;}
  function setSection(amount){section=THREE.MathUtils.clamp(Number(amount)||0,0,1);const before=Boolean(material.clippingPlanes?.length);localPlane.constant=THREE.MathUtils.lerp(radius*1.16,-radius*.32,section);group.userData.section=section;refreshPlane();if(before!==Boolean(material.clippingPlanes?.length))material.needsUpdate=true;}
  function update(){if(!disposed&&section>.002)refreshPlane();}
  function dispose(){if(disposed)return;disposed=true;built.geometry.dispose();material.dispose();group.clear();}
  const facts=id==="tubulin-structure"?["PDB 1JFF 的牛 α/β 微管蛋白 Cα 坐标示例；不是人巨噬细胞的实测蛋白。","显示已有坐标的折叠骨架；缺失环与末端保持断开。","管线粗细和颜色用于辨认两链，不是原子表面、真实化学键或二级结构丝带。"]:["PDB 4UG0 的人 80S 核糖体坐标骨架，包括蛋白 Cα 与 RNA P 轨迹。","按链和 60S/40S 位置着色；所含 tRNA 不等于添加了实验中未给出的 mRNA。","缺失区段不补全；局部相机从外侧观察 RNA/蛋白折叠关系，没有包膜水腔。"];
  const stats={detail:Boolean(detail),sourcePdb:source.pdbId,sourceSpecies:source.species,sourceResolutionAngstrom:source.resolutionAngstrom,sourceAtomCount:source.sourceAtomCount,sourceTracePoints:source.pointCount,tracePoints:built.renderedPoints,traceEdges:built.renderedEdges,isolatedTracePoints:built.isolatedPoints,polymerChains:source.chains.length,RNAChains:source.chains.filter(c=>c.kind==="RNA").length,segments:source.segments.length,radialSides:built.sides,meshes:1,instances:0,triangles:built.geometry.index.count/3,shellMaterials:1,representation:source.representation,modelIdentity:"Observed-source CA/P trace with display thickness; not atoms, measured surface or assigned secondary structure"};
  setSection(0);
  return{group,radius,anchors,setSection,update,dispose,stats,facts,metadata:{pdbId:source.pdbId,recordURL:source.recordURL,sourceSHA256:source.sourceSHA256,sourceSpecies:source.species,sourceResolutionAngstrom:source.resolutionAngstrom,sourceRepresentation:source.representation,sourceToDisplay:{...source.sourceToDisplay,rotationRows:source.sourceToDisplay.rotationRows.map(row=>[...row]),rotatedCenterAngstrom:[...source.sourceToDisplay.rotatedCenterAngstrom]},LOD:{...source.lod},missingCoordinates:"No links across sequence gaps or long discontinuities; missing parts are not reconstructed.",microKind:"external-backbone-view",license:source.license,citation:source.citation,chainMapping:source.chains.map(chain=>({...chain}))}};
}
