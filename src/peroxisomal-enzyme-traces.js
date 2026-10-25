import * as THREE from 'three';
import DATA from './peroxisomal-enzyme-data.js';
import {traceGeometry} from './molecular-models.js';

export function addPeroxisomalEnzymeTraces(group,{detail=true}={}){
 const items=[];
 for(const [id,position,color]of[['catalase',[-.22,.17,-.07],'#4c8586'],['acox1',[.20,-.18,-.07],'#ad8248']]){
  const source=DATA.models[id],raw=atob(source.coordinatesI16LE),view=new DataView(Uint8Array.from(raw,c=>c.charCodeAt(0)).buffer),points=new Float32Array(source.pointCount*3);
  const factor=source.sourceToDisplay.quantumAngstrom*source.sourceToDisplay.localScalePerAngstrom;
  for(let i=0;i<points.length;i++)points[i]=view.getInt16(i*2,true)*factor;
  const built=traceGeometry(source,points,detail),material=new THREE.MeshStandardMaterial({color,vertexColors:false,roughness:.68,metalness:0,envMapIntensity:.3});
  const mesh=new THREE.Mesh(built.geometry,material);mesh.name='Peroxisomal_'+source.pdbId+'_ObservedBiologicalAssemblyBackbone';mesh.position.fromArray(position);
  mesh.userData={contentDomain:'identified-source-derived-enzyme-example',sourcePdb:source.pdbId,backboneTrace:true,teachingEnlargement:true};group.add(mesh);
  // The leader ends at an actual observed trace node near the front, not at an
  // invented active-site location or a decorative dot floating in the matrix.
  let front=0;for(let i=0;i<points.length;i+=3)if(points[i+2]>points[front+2])front=i;
  const anchor=new THREE.Vector3().fromArray(points,front).add(mesh.position);
  items.push({id,anchor,mesh,source:{pdbId:source.pdbId,url:source.recordURL,title:source.citation,species:source.species,resolutionAngstrom:source.resolutionAngstrom,sourceSHA256:source.sourceSHA256,chains:source.chains.length,representation:source.representation}});
 }
 return items;
}
