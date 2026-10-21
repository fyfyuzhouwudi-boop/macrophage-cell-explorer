import {createMembraneSurfaceQuery} from './membrane-surface-query.js';
import {createImplicitMembraneGeometry,IMPLICIT_MEMBRANE_METADATA} from './whole-membrane-implicit-v9-data.js';

// Static stage-1 plasma-membrane candidate. One welded closed control surface;
// ruffles are folds of that surface, not attached fins or a radial height overlay.
export function createWholeMembraneStatic({THREE,plane=null,tag=null,add=null,detail=true}={}){
 if(!THREE?.BufferGeometry)throw new TypeError('Host THREE namespace required');
 const V=(x=0,y=0,z=0)=>new THREE.Vector3(x,y,z),TAU=Math.PI*2;
 let disposed=false,sectionZ=.704,sectionEnabled=true,lastTransform='';
 const group=new THREE.Group();group.name='StaticFoldedPlasmaMembrane';
 group.userData={organelleId:'membrane',componentKey:'membrane',static:true,teachingOnly:true};
 const localPlane=new THREE.Plane(V(0,0,-1),sectionZ),worldPlane=plane??localPlane.clone(),ownedGeometry=new Set(),ownedMaterials=new Set();
 const oldBodyRadius=d=>{const angle=Math.atan2(d.y/6.28,d.x/6.8),phi=Math.acos(THREE.MathUtils.clamp(d.z,-1,1)),w=1-d.z*d.z;return(1+(.05*Math.sin(angle*3+.3)+.025*Math.sin(angle*7-phi*3)+.008*Math.sin(angle*2+phi))*w)/Math.sqrt((d.x/6.8)**2+(d.y/6.28)**2+(d.z/4.25)**2);};
 const geometry=createImplicitMembraneGeometry(THREE);ownedGeometry.add(geometry);
 const frames=IMPLICIT_MEMBRANE_METADATA.queryFrames.map(f=>({...f,n:V().fromArray(f.n),broad:V().fromArray(f.broad),thin:V().fromArray(f.thin)})),dirs=[];
 const p=geometry.attributes.position,colors=new Float32Array(p.count*3),folds=new Float32Array(p.count),vertex=V(),direction=V(),coolA=new THREE.Color('#bccfd4'),coolB=new THREE.Color('#dbe5e5'),foldCool=new THREE.Color('#a6c4cf'),warm=new THREE.Color('#cfc3a9'),color=new THREE.Color();
 for(let i=0;i<p.count;i++){vertex.fromBufferAttribute(p,i);direction.copy(vertex).normalize();const relief=vertex.length()-oldBodyRadius(direction)-.24,fold=THREE.MathUtils.smoothstep(relief,.04,.65),mix=.5+.5*Math.sin(vertex.x*.9+vertex.y*.7+vertex.z*.6);folds[i]=fold;color.copy(coolA).lerp(coolB,mix).lerp(foldCool,fold*.45).lerp(warm,fold*.22*(.5+.5*Math.sin(vertex.x*1.6-vertex.y*1.4)));color.toArray(colors,i*3);}
 geometry.setAttribute('color',new THREE.BufferAttribute(colors,3));geometry.setAttribute('membraneFold',new THREE.BufferAttribute(folds,1));geometry.userData={implicitSolid:true,bodyEnvelopeMargin:.24,cytoplasmExtendsIntoProcesses:true,oneExtractedWeldedInterface:true,nonRadialReturnFolds:true,leafletResolved:false,teachingOnly:true};
 // Keep the near-side thin interface, with an opaque far-side interior
 // backdrop for cytoplasm readability. Geometry and queries remain unchanged.
 const material=new THREE.MeshPhysicalMaterial({color:'#86acb8',vertexColors:true,metalness:0,roughness:.29,clearcoat:.18,clearcoatRoughness:.28,specularIntensity:.72,envMapIntensity:1.05,transmission:0,thickness:.002,ior:1.34,opacity:1,transparent:true,depthWrite:false,side:THREE.DoubleSide,clippingPlanes:[worldPlane]});
 material.userData={membraneStaticV1:true,atlasMaterialRole:'film',staticPlasmaMembrane:true,displayThicknessIsNotBilayerMeasurement:true};
 // A bounded, broad variation in surface response; not a granular EM texture.
 const priorCompile=material.onBeforeCompile;
 material.onBeforeCompile=function(shader,renderer){priorCompile.call(this,shader,renderer);
  shader.vertexShader=shader.vertexShader.replace('#include <common>','#include <common>\nattribute float membraneFold; varying float vMembraneFold; varying vec3 vMembraneLocal;').replace('#include <begin_vertex>','#include <begin_vertex>\nvMembraneFold=membraneFold; vMembraneLocal=position;');
  shader.fragmentShader=shader.fragmentShader.replace('#include <common>','#include <common>\nvarying float vMembraneFold; varying vec3 vMembraneLocal;').replace('#include <roughnessmap_fragment>','#include <roughnessmap_fragment>\nfloat membraneResponse=.5+.24*sin(vMembraneLocal.x*1.9+vMembraneLocal.y*.8)*sin(vMembraneLocal.z*2.1-vMembraneLocal.y); roughnessFactor=clamp(roughnessFactor+.035*(membraneResponse-.5)-.025*vMembraneFold,.24,.34);').replace('#include <alphatest_fragment>','#include <alphatest_fragment>\nfloat thinMembraneEdge=pow(1.0-abs(dot(normalize(vViewPosition),normalize(vNormal))),2.1); if(gl_FrontFacing) diffuseColor.a*=.32+.58*thinMembraneEdge;').replace('#include <opaque_fragment>','outgoingLight*=.45;\n#include <opaque_fragment>');
 };
 material.customProgramCacheKey=()=> 'continuous-thin-plasma-film-v12-interior-opacity';ownedMaterials.add(material);
 const shell=new THREE.Mesh(geometry,[material]);shell.name='ClosedOrganicMembraneWith36Pseudopods';shell.userData={organelleId:'membrane',componentKey:'membrane',teachingOnly:true,canonicalMembrane:true,legacyNameCompatibilityOnly:true,not36Pseudopods:true,atlasMaterialRole:'film'};shell.castShadow=false;shell.receiveShadow=true;group.add(shell);tag?.(shell,'membrane');
 const edgeMaterial=new THREE.LineBasicMaterial({color:'#99adb3',transparent:true,opacity:.42,depthWrite:false});edgeMaterial.userData={membraneStaticV1:true,staticPlasmaMembrane:true};ownedMaterials.add(edgeMaterial);
 const edge=new THREE.LineSegments(new THREE.BufferGeometry(),edgeMaterial);edge.name='ActualMembraneSectionIntersection';edge.userData={organelleId:'membrane',componentKey:'membrane',pickThrough:true,actualTrianglePlaneIntersection:true};edge.renderOrder=3;group.add(edge);ownedGeometry.add(edge.geometry);
 const membraneSurface=createMembraneSurfaceQuery(geometry),scratch=[V(),V(),V()],linePoints=[],edgeEnds=[];
 function syncPlane(){group.updateWorldMatrix(true,false);const key=group.matrixWorld.elements.join(',');if(key!==lastTransform){worldPlane.copy(localPlane).applyMatrix4(group.matrixWorld);lastTransform=key;}}
 function rebuildSection(){
  linePoints.length=0;edgeEnds.length=0;const p=geometry.attributes.position,ix=geometry.index;
  if(sectionEnabled)for(let f=0;f<ix.count;f+=3){for(let j=0;j<3;j++)scratch[j].fromBufferAttribute(p,ix.getX(f+j));const hits=[];
   for(let j=0;j<3;j++){const a=scratch[j],b=scratch[(j+1)%3],da=a.z-sectionZ,db=b.z-sectionZ;if((da<0&&db>=0)||(db<0&&da>=0)){const t=da/(da-db);hits.push(a.clone().lerp(b,t));}}
   if(hits.length===2&&hits[0].distanceToSquared(hits[1])>1e-18){linePoints.push(...hits[0].toArray(),...hits[1].toArray());edgeEnds.push(hits.map(q=>q.toArray()));}
  }
  const old=edge.geometry;edge.geometry=new THREE.BufferGeometry();edge.geometry.setAttribute('position',new THREE.Float32BufferAttribute(linePoints,3));edge.geometry.computeBoundingSphere();ownedGeometry.delete(old);old.dispose();ownedGeometry.add(edge.geometry);edge.visible=sectionEnabled&&linePoints.length>0;
 }
 function setSection(z=.704){if(disposed)return;sectionEnabled=z!==null&&Number.isFinite(Number(z));if(sectionEnabled){sectionZ=Number(z);localPlane.constant=sectionZ;}material.clippingPlanes=sectionEnabled?[worldPlane]:null;material.needsUpdate=true;lastTransform='';syncPlane();rebuildSection();}
 function surfaceRadius(direction){return membraneSurface.radiusAlong(direction);}
 function sampleSurface(direction,{farthest=true}={}){const hit=membraneSurface.raycast(V(),direction,{farthest});if(!hit)return null;const index=geometry.index,p=geometry.attributes.position,normal=geometry.attributes.normal,f=hit.faceIndex,ids=[0,1,2].map(j=>index.getX(f*3+j)),a=V().fromBufferAttribute(p,ids[0]),b=V().fromBufferAttribute(p,ids[1]),c=V().fromBufferAttribute(p,ids[2]),weights=THREE.Triangle.getBarycoord(hit.point,a,b,c,V()),n=V();for(let j=0;j<3;j++)n.addScaledVector(V().fromBufferAttribute(normal,ids[j]),weights.getComponent(j));return {...hit,normal:n.normalize(),barycentric:weights,coordinateSpace:'whole local'};}
 function containsPoint(point){const d=V(1,.37419,.52731).normalize();let origin=point.clone(),count=0;for(let i=0;i<100;i++){const hit=membraneSurface.raycast(origin,d);if(!hit)break;count++;origin=hit.point.clone().addScaledVector(d,1e-6);}return count%2===1;}
 function update(){if(!disposed)syncPlane();} // No host clock or geometry motion.
 function diagnostics(){return{static:true,disposed,vertices:geometry.attributes.position.count,triangles:geometry.index.count/3,foldPatches:frames.length,radialParameterization:false,sectionEnabled,sectionZ,sectionSegments:linePoints.length/6,geometryInterpretation:'One welded interface extracted from a continuous implicit body with smooth-union curved rounded pseudopods and filled lamellar ruffles; cytoplasm extends into each projection. No measured bilayer thickness at whole scale.',implicitBake:{version:IMPLICIT_MEMBRANE_METADATA.version,resolution:IMPLICIT_MEMBRANE_METADATA.resolution,primitiveCount:IMPLICIT_MEMBRANE_METADATA.primitiveCount,pseudopods:IMPLICIT_MEMBRANE_METADATA.pseudopods,lamellae:IMPLICIT_MEMBRANE_METADATA.lamellae},bounds:membraneSurface.bounds?{min:membraneSurface.bounds.min.toArray(),max:membraneSurface.bounds.max.toArray()}:null,query:membraneSurface.diagnostics(),resources:{geometries:ownedGeometry.size,materials:ownedMaterials.size,textures:0}};}
 function dispose(){if(disposed)return;disposed=true;membraneSurface.dispose();for(const g of ownedGeometry)g.dispose();for(const m of ownedMaterials)m.dispose();ownedGeometry.clear();ownedMaterials.clear();group.clear();}
 setSection(sectionZ);
 return{group,shell,edge,plane:worldPlane,membraneSurface,setSection,surfaceRadius,sampleSurface,surfacePointNormal:sampleSurface,containsPoint,update,dispose,diagnostics,resources:()=>diagnostics().resources,debug:{frames,controlDirections:dirs,oldBodyRadius,sectionSegments:edgeEnds}};
}
