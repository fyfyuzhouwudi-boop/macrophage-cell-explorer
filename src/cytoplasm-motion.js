// Bounded shared spatial perturbations, not a fluid solver or measured trajectories.
export const CYTOPLASM_MOTION_SOURCE={title:'Guo et al., Cell 2014',url:'https://pmc.ncbi.nlm.nih.gov/articles/PMC4183065/',scope:'Active cytoplasmic fluctuations in studied mammalian cell models; no macrophage velocities or force parameters are copied.'};
export function createCytoplasmMotion({THREE,whole,membraneQueries}={}){
 if(!whole?.membraneSurface||!membraneQueries)throw new TypeError('Actual whole surface and obstacle queries are required');
 const mesh=whole.group.getObjectByName('PrescribedCytoplasmicMolecularDrift'),cortex=whole.group.getObjectByName('CorticalMolecularCrowding');if(!mesh?.isInstancedMesh)throw Error('Existing cytoplasmic crowd missing');
 const V=(x=0,y=0,z=0)=>new THREE.Vector3(x,y,z),matrix=new THREE.Matrix4(),point=V(),scale=V(),rotation=new THREE.Quaternion(),delta=V(),records=[],originalCount=mesh.count,originalCortexCount=cortex?.count??0,rejected={cell:0,organelles:0,journey:0,golgi:0};
 const originalMatrices=mesh.instanceMatrix.array.slice(),originalColors=mesh.instanceColor?.array.slice(),originalUserData=mesh.userData,oldOwnership=whole.group.userData.sharedCytoplasmMotion;
 const maxDisplacement=.20;let time=0,disposed=false,quality='high',updates=0,flowEnabled=true;
 mesh.geometry.computeBoundingSphere();const radius=mesh.geometry.boundingSphere.radius+mesh.geometry.boundingSphere.center.length();
 const A=V(4.03,.02,1.3),B=V(6.48,.30,1.3),D=V(3.15,2.18,.88),segment=new THREE.Line3(A,B),dockSegment=new THREE.Line3(D,A),closest=V(),golgi=whole.organelleLocations.get('golgi');
 for(let i=0;i<originalCount;i++){
  mesh.getMatrixAt(i,matrix);matrix.decompose(point,rotation,scale);const bound=radius*Math.max(scale.x,scale.y,scale.z)+maxDisplacement+.02;
  if(!whole.plasmaMembrane.containsPoint(point)||whole.membraneSurface.closestPoint(point,{maxDistance:bound})){rejected.cell++;continue;}
  segment.closestPointToPoint(point,true,closest);const swept=point.distanceTo(closest);dockSegment.closestPointToPoint(point,true,closest);if(swept<1.28+bound||point.distanceTo(closest)<.78+bound){rejected.journey++;continue;}
  if(golgi&&point.distanceTo(golgi.position)<(whole.components.golgi?.radiusFromLocation??2.32)+bound){rejected.golgi++;continue;}
  if(membraneQueries.containing(point).length||membraneQueries.nearSurface(point,bound)){rejected.organelles++;continue;}
  records.push({base:point.clone(),rotation:rotation.clone(),scale:scale.clone(),bound,sourceIndex:i,color:mesh.instanceColor?new THREE.Color().fromArray(mesh.instanceColor.array,i*3):null});
  if(records.length===540)break;
 }
 if(!records.length)throw Error('No clear cytoplasmic perturbation examples');
 const trailSamples=9,trailCount=Math.min(100,records.length),trailGeometry=new THREE.BufferGeometry();
 const trailPositions=new Float32Array(trailCount*(trailSamples-1)*6);
 trailGeometry.setAttribute('position',new THREE.BufferAttribute(trailPositions,3).setUsage(THREE.DynamicDrawUsage));
 const trailMaterial=new THREE.LineBasicMaterial({color:0x86aab2,transparent:true,opacity:.20,depthWrite:false});
 const trails=new THREE.LineSegments(trailGeometry,trailMaterial);trails.name='CytoplasmicLocalMotionTrails';
 trails.userData={organelleId:'cytoplasm',pickThrough:true,teachingOnly:true,notFluidStreamlines:true};trails.frustumCulled=false;whole.group.add(trails);
 const trailPoint=V(),trailDelta=V();
 function displacement(base,t,index,out=V()){
  // Local, confined loops in differently tilted planes; no bulk cell-wide vortex.
  // Orthogonal basis bounds: sqrt(.14^2 + .09^2) + sqrt(3)*.012 < .188.
  const phase=index*1.781,angle=Math.atan2(base.y+.25,base.x+1.4),tilt=.25*Math.sin(index*.83);
  const u=.07*(Math.sin(.45*t+phase)-Math.sin(phase)),v=.045*(Math.cos(.45*t+phase)-Math.cos(phase));
  const c=Math.cos(angle),s=Math.sin(angle),ct=Math.cos(tilt),st=Math.sin(tilt);
  return out.set(-s*u+c*ct*v+.006*(Math.sin(1.7*t+phase)-Math.sin(phase)),c*u+s*ct*v+.006*(Math.sin(1.3*t+phase*.71)-Math.sin(phase*.71)),st*v+.006*(Math.sin(1.9*t+phase*.37)-Math.sin(phase*.37)));
 }
 function apply(){for(let i=0;i<mesh.count;i++){const r=records[i];point.copy(r.base).add(displacement(r.base,time,r.sourceIndex,delta));matrix.compose(point,r.rotation,r.scale);mesh.setMatrixAt(i,matrix);if(r.color)mesh.setColorAt(i,r.color);}mesh.instanceMatrix.needsUpdate=true;if(mesh.instanceColor)mesh.instanceColor.needsUpdate=true;mesh.computeBoundingSphere();
  let k=0;const count=Math.min(trailCount,mesh.count);for(let i=0;i<count;i++){const r=records[Math.floor(i*mesh.count/count)];for(let j=0;j<trailSamples-1;j++)for(let end=0;end<2;end++){const t=Math.max(0,time-(trailSamples-1-j-end)*.4);trailPoint.copy(r.base).add(displacement(r.base,t,r.sourceIndex,trailDelta));trailPositions[k++]=trailPoint.x;trailPositions[k++]=trailPoint.y;trailPositions[k++]=trailPoint.z;}}
  trailGeometry.setDrawRange(0,k/3);trailGeometry.attributes.position.needsUpdate=true;
 }
 function setQuality(value){quality=['low','balanced'].includes(value)?value:'high';mesh.count=Math.min(records.length,{high:540,balanced:340,low:160}[quality]);if(cortex)cortex.count=Math.min(originalCortexCount,{high:160,balanced:100,low:55}[quality]);apply();}
 function update(hostTime,dt=0){trails.visible=flowEnabled&&mesh.visible;const mat=Array.isArray(mesh.material)?mesh.material[0]:mesh.material;trailMaterial.clippingPlanes=mat.clippingPlanes;if(disposed||!flowEnabled||dt<=0||!mesh.visible)return;if(!Number.isFinite(hostTime)||!Number.isFinite(dt))throw new TypeError('Finite host clock required');time+=dt;updates++;apply();}
 function setEnabled(value){flowEnabled=Boolean(value);trails.visible=flowEnabled&&mesh.visible;}
 function seek(value){if(disposed)return;if(!Number.isFinite(value)||value<0)throw new RangeError('Nonnegative time required');time=value;apply();}
 whole.group.userData.sharedCytoplasmMotion=true;mesh.userData={...mesh.userData,componentKey:'cytoplasm',sharedSpatialPerturbations:true,teachingOnly:true,notFluidSolver:true};setQuality('high');
 return{update,seek,setQuality,setEnabled,diagnostics:()=>({available:records.length,visible:mesh.count,corticalVisible:cortex?.count??0,sourceCount:originalCount,quality,time,updates,rejected,maxDisplacement,theoreticalDisplacementBound:Math.hypot(.14,.09)+Math.sqrt(3)*.012,flowEnabled,trails:trailCount,sharedSpatialField:true,clock:'Accumulates the host speed-scaled dt without a second clamp; pause and hidden periods excluded',ownWallClock:false,dtZeroFreezes:true,scope:'Confined local motion with faint recent-position trails; not a measured macrophage circulation or fluid solver. Swept spheres clear static queried membranes, with conservative reservations for Golgi and phagosome paths.',source:CYTOPLASM_MOTION_SOURCE}),debug:{records,displacement,mesh,trails,maxDisplacement},dispose(){if(disposed)return;disposed=true;trails.removeFromParent();trailGeometry.dispose();trailMaterial.dispose();if(oldOwnership===undefined)delete whole.group.userData.sharedCytoplasmMotion;else whole.group.userData.sharedCytoplasmMotion=oldOwnership;mesh.userData=originalUserData;mesh.instanceMatrix.array.set(originalMatrices);mesh.instanceMatrix.needsUpdate=true;if(originalColors){mesh.instanceColor.array.set(originalColors);mesh.instanceColor.needsUpdate=true;}mesh.count=originalCount;if(cortex)cortex.count=originalCortexCount;mesh.computeBoundingSphere();records.length=0;}};
}
