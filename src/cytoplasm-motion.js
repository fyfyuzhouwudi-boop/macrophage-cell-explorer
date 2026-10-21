// Bounded shared spatial perturbations, not a fluid solver or measured trajectories.
export const CYTOPLASM_MOTION_SOURCE={title:'Guo et al., Cell 2014',url:'https://pmc.ncbi.nlm.nih.gov/articles/PMC4183065/',scope:'Active cytoplasmic fluctuations in studied mammalian cell models; no macrophage velocities or force parameters are copied.'};
export function createCytoplasmMotion({THREE,whole,membraneQueries}={}){
 if(!whole?.membraneSurface||!membraneQueries)throw new TypeError('Actual whole surface and obstacle queries are required');
 const mesh=whole.group.getObjectByName('PrescribedCytoplasmicMolecularDrift'),cortex=whole.group.getObjectByName('CorticalMolecularCrowding');if(!mesh?.isInstancedMesh)throw Error('Existing cytoplasmic crowd missing');
 const V=(x=0,y=0,z=0)=>new THREE.Vector3(x,y,z),matrix=new THREE.Matrix4(),point=V(),scale=V(),rotation=new THREE.Quaternion(),delta=V(),records=[],originalCount=mesh.count,originalCortexCount=cortex?.count??0,rejected={cell:0,organelles:0,journey:0,golgi:0};
 const originalMatrices=mesh.instanceMatrix.array.slice(),originalColors=mesh.instanceColor?.array.slice(),originalUserData=mesh.userData,oldOwnership=whole.group.userData.sharedCytoplasmMotion;
 const maxDisplacement=.20;let time=0,disposed=false,quality='high',updates=0;
 mesh.geometry.computeBoundingSphere();const radius=mesh.geometry.boundingSphere.radius+mesh.geometry.boundingSphere.center.length();
 const A=V(4.03,.02,1.3),B=V(6.48,.30,1.3),D=V(3.15,2.18,.88),segment=new THREE.Line3(A,B),dockSegment=new THREE.Line3(D,A),closest=V(),golgi=whole.organelleLocations.get('golgi');
 for(let i=0;i<originalCount;i++){
  mesh.getMatrixAt(i,matrix);matrix.decompose(point,rotation,scale);const bound=radius*Math.max(scale.x,scale.y,scale.z)+maxDisplacement+.02;
  if(!whole.plasmaMembrane.containsPoint(point)||whole.membraneSurface.closestPoint(point,{maxDistance:bound})){rejected.cell++;continue;}
  segment.closestPointToPoint(point,true,closest);const swept=point.distanceTo(closest);dockSegment.closestPointToPoint(point,true,closest);if(swept<1.28+bound||point.distanceTo(closest)<.78+bound){rejected.journey++;continue;}
  if(golgi&&point.distanceTo(golgi.position)<2.1+bound){rejected.golgi++;continue;}
  if(membraneQueries.containing(point).length||membraneQueries.nearSurface(point,bound)){rejected.organelles++;continue;}
  records.push({base:point.clone(),rotation:rotation.clone(),scale:scale.clone(),bound,sourceIndex:i,color:mesh.instanceColor?new THREE.Color().fromArray(mesh.instanceColor.array,i*3):null});
  if(records.length===540)break;
 }
 if(!records.length)throw Error('No clear cytoplasmic perturbation examples');
 function displacement(base,t,index,out=V()){
  const px=.37*base.y+.41*base.z+.29,py=.31*base.x-.23*base.z+1.7,pz=.28*base.x+.39*base.y+.9,j=index*1.781;
  return out.set(.06*(Math.sin(.50*t+px)-Math.sin(px))+.006*(Math.sin(1.7*t+j)-Math.sin(j)),.045*(Math.sin(.43*t+py)-Math.sin(py))+.006*(Math.sin(1.3*t+j*.71)-Math.sin(j*.71)),.035*(Math.sin(.39*t+pz)-Math.sin(pz))+.005*(Math.sin(1.9*t+j*.37)-Math.sin(j*.37)));
 }
 function apply(){for(let i=0;i<mesh.count;i++){const r=records[i];point.copy(r.base).add(displacement(r.base,time,r.sourceIndex,delta));matrix.compose(point,r.rotation,r.scale);mesh.setMatrixAt(i,matrix);if(r.color)mesh.setColorAt(i,r.color);}mesh.instanceMatrix.needsUpdate=true;if(mesh.instanceColor)mesh.instanceColor.needsUpdate=true;mesh.computeBoundingSphere();}
 function setQuality(value){quality=['low','balanced'].includes(value)?value:'high';mesh.count=Math.min(records.length,{high:540,balanced:340,low:160}[quality]);if(cortex)cortex.count=Math.min(originalCortexCount,{high:160,balanced:100,low:55}[quality]);apply();}
 function update(hostTime,dt=0){if(disposed||dt<=0||!mesh.visible)return;if(!Number.isFinite(hostTime)||!Number.isFinite(dt))throw new TypeError('Finite host clock required');time+=dt;updates++;apply();}
 function seek(value){if(disposed)return;if(!Number.isFinite(value)||value<0)throw new RangeError('Nonnegative time required');time=value;apply();}
 whole.group.userData.sharedCytoplasmMotion=true;mesh.userData={...mesh.userData,componentKey:'cytoplasm',sharedSpatialPerturbations:true,teachingOnly:true,notFluidSolver:true};setQuality('high');
 return{update,seek,setQuality,diagnostics:()=>({available:records.length,visible:mesh.count,corticalVisible:cortex?.count??0,sourceCount:originalCount,quality,time,updates,rejected,maxDisplacement,theoreticalDisplacementBound:Math.hypot(.132,.102,.080),sharedSpatialField:true,clock:'Accumulates the host speed-scaled dt without a second clamp; pause and hidden periods excluded',ownWallClock:false,dtZeroFreezes:true,scope:'Swept spheres clear actual static cell/queried organelle membranes; conservative reservations for Golgi and existing whole phagosome/docking paths. Not a fluid solver, diffusion measurement or collision proof for future overlays.',source:CYTOPLASM_MOTION_SOURCE}),debug:{records,displacement,mesh,maxDisplacement},dispose(){if(disposed)return;disposed=true;if(oldOwnership===undefined)delete whole.group.userData.sharedCytoplasmMotion;else whole.group.userData.sharedCytoplasmMotion=oldOwnership;mesh.userData=originalUserData;mesh.instanceMatrix.array.set(originalMatrices);mesh.instanceMatrix.needsUpdate=true;if(originalColors){mesh.instanceColor.array.set(originalColors);mesh.instanceColor.needsUpdate=true;}mesh.count=originalCount;if(cortex)cortex.count=originalCortexCount;mesh.computeBoundingSphere();records.length=0;}};
}
