import * as THREE from 'three';
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js';

// Domain envelopes and binding clefts, not fitted atomic/molecular surfaces.
// Detail is built once. Static pieces of one material share one draw call;
// the host moves their parent groups without rewriting their geometry.
const V = (x=0,y=0,z=0) => new THREE.Vector3(x,y,z);
const Y = V(0,1,0);

function envelope(radii, center, {resolution=22, features=[], phase=0}={}) {
  const geometry=new THREE.SphereGeometry(1,resolution,Math.max(10,Math.round(resolution*.68)));
  const position=geometry.attributes.position;
  for(let i=0;i<position.count;i++) {
    const x=position.getX(i),y=position.getY(i),z=position.getZ(i);
    // Broad, bounded domain relief; no purported amino-acid bead decoration.
    let radius=1+.021*Math.sin(5*x+phase)*Math.sin(4*y-2*z)+.012*Math.cos(8*z-3*x+phase);
    for(const feature of features) {
      const [cx,cy,cz,wx,wy,wz,depth]=feature;
      radius+=depth*Math.exp(-(((x-cx)/wx)**2+((y-cy)/wy)**2+((z-cz)/wz)**2));
    }
    position.setXYZ(i,center.x+x*radius*radii.x,center.y+y*radius*radii.y,center.z+z*radius*radii.z);
  }
  geometry.computeVertexNormals();return geometry;
}

function cylinder(a,b,radius,segments=10) {
  const geometry=new THREE.CylinderGeometry(radius,radius,a.distanceTo(b),segments,1);
  const matrix=new THREE.Matrix4().compose(a.clone().add(b).multiplyScalar(.5),
    new THREE.Quaternion().setFromUnitVectors(Y,b.clone().sub(a).normalize()),V(1,1,1));
  return geometry.applyMatrix4(matrix);
}

function path(points,radius,segments=20,sides=6) {
  return new THREE.TubeGeometry(new THREE.CatmullRomCurve3(points),segments,radius,sides,false);
}

function combine(parts) {
  const geometry=mergeGeometries(parts,false);
  for(const part of parts)part.dispose();
  if(!geometry)throw new Error('Protein detail geometry could not be combined');
  geometry.computeBoundingBox();geometry.computeBoundingSphere();return geometry;
}

function add(parent,name,geometry,material) {
  if(!geometry.boundingBox)geometry.computeBoundingBox();
  if(!geometry.boundingSphere)geometry.computeBoundingSphere();
  const object=new THREE.Mesh(geometry,material);object.name=name;
  object.userData={pickThrough:true,teachingOnly:true,domainEnvelopeNotAtomicSurface:true,staticProteinDetail:true};
  parent.add(object);return object;
}

export function addRibosomeDomains(parent,name,largeMaterial,smallMaterial,{active=false}={}) {
  const resolution=active?28:16;
  const large=[envelope(V(.122,.087,.101),V(0,.073,.012),{
    resolution,phase:.4,
    features:[[.42,.72,.55,.37,.33,.5,-.28],[-.5,.2,.7,.3,.6,.35,-.095],[-.42,.72,-.22,.38,.3,.6,.12]]
  })];
  // A peripheral protuberance is part of the same envelope, not a free bead.
  large.push(envelope(V(.045,.038,.038),V(-.096,.125,-.014),{resolution:active?18:12,phase:1.3}));
  const small=[
    envelope(V(.085,.047,.066),V(.043,.177,.046),{resolution:active?24:16,phase:2.1,
      features:[[0,.1,.98,.85,.25,.3,-.19],[-.45,-.65,.5,.5,.4,.55,-.15]]}),
    envelope(V(.046,.038,.046),V(.07,.224,.042),{resolution:active?20:12,phase:3.1,
      features:[[-.6,-.58,.5,.4,.4,.6,-.12]]})
  ];
  add(parent,name+'60SLargeSubunit',combine(large),largeMaterial);
  add(parent,name+'40SHeadBodyAndmRNAChannel',combine(small),smallMaterial);
  parent.userData={...parent.userData,proteinDetail:'Two contoured ribonucleoprotein subunits with inter-subunit cleft and small-subunit head/body',
    ribonucleoproteinNotPureProtein:true,structuralFit:false,staticDomainDrawCalls:2};
}

export function addSec61Domains(parent,name,alphaMaterial,accessoryMaterial) {
  const helices=[];
  // Two five-helix halves flank a central aqueous path. The widened seam at
  // +X denotes the TM2/TM7 lateral-gate relationship; it does not animate a
  // universal iris gate or release this soluble peptide through the lipid.
  const helixNames=['TM2','TM3','TM4','TM5','TM1','TM6','TM10','TM9','TM8','TM7'];
  const centers=[];
  for(let k=0;k<10;k++) {
    const angle=.29+k*(Math.PI*2-.58)/9;
    const x=Math.cos(angle)*.074,z=Math.sin(angle)*.074;
    const geometry=new THREE.CylinderGeometry(.019,.017,.13,10,4);
    const a=geometry.attributes.position;
    for(let i=0;i<a.count;i++) {
      const px=a.getX(i),py=a.getY(i),pz=a.getZ(i),phi=Math.atan2(pz,px);
      const relief=1+.055*Math.sin(py*150+phi);
      a.setXYZ(i,px*relief+x+py*.16*Math.cos(angle),py-.018,pz*relief+z+py*.16*Math.sin(angle));
    }
    geometry.computeVertexNormals();helices.push(geometry);centers.push({name:helixNames[k],position:[x,-.018,z]});
  }
  const channel=add(parent,name+'Sec61AlphaTenHelixChannel',combine(helices),alphaMaterial);
  const accessory=[
    cylinder(V(-.126,-.079,-.018),V(-.12,.055,-.018),.014,8),
    cylinder(V(-.086,-.079,-.099),V(-.08,.042,-.099),.013,8),
    path([V(-.12,.047,-.018),V(-.14,.09,-.012),V(-.09,.112,.012),V(-.057,.095,.015)],.012,16,6)
  ];
  add(parent,name+'Sec61BetaGammaAccessoryTopology',combine(accessory),accessoryMaterial);
  channel.userData={...channel.userData,alphaTransmembraneHelices:10,helixCenters:centers,centralPathRadius:.043,lateralGateBetween:['TM2','TM7']};
  parent.userData={...parent.userData,proteinDetail:'Sec61 alpha 10-TM envelope with TM2/TM7 seam and beta/gamma accessory topology',
    centralPoreNotLipidPenetration:true,lateralGateAnimated:false,staticDomainDrawCalls:2,structuralFit:false};
}

export function addKinesinHeadDomains(parent,name,bodyMaterial,pocketMaterial) {
  const body=envelope(V(.134,.092,.097),V(),{resolution:28,phase:.9,
    features:[[.36,.63,.68,.37,.4,.38,-.29],[-.35,.1,.92,.33,.65,.35,-.075],[0,-.95,0,.8,.25,.8,-.10]]});
  // The lower microtubule-binding face and the upper/front nucleotide pocket
  // are different surfaces. The latter is a shallow recess, never a tunnel.
  const bindingFace=cylinder(V(-.067,-.076,.004),V(.073,-.076,.004),.019,10);
  add(parent,name+'MotorDomainAndTrackBindingFace',combine([body,bindingFace]),bodyMaterial);
  const bowl=new THREE.LatheGeometry([new THREE.Vector2(0,-.024),new THREE.Vector2(.011,-.022),new THREE.Vector2(.023,-.011),new THREE.Vector2(.031,0)],16);
  bowl.applyQuaternion(new THREE.Quaternion().setFromUnitVectors(Y,V(.34,.61,.72).normalize()));
  bowl.translate(.043,.061,.057);
  add(parent,name+'RecessedNucleotidePocket',bowl,pocketMaterial);
  parent.userData={...parent.userData,proteinDetail:'Contoured motor domain, recessed nucleotide pocket, separate lower track-binding face',
    shallowNucleotideRecess:true,pocketNotThroughHole:true,trackBindingFace:'lower Y',staticDomainDrawCalls:2,structuralFit:false};
}

export function addCathepsinDomains(parent,name,bodyMaterial,loopMaterial) {
  const left=envelope(V(.124,.17,.119),V(-.099,.002,0),{resolution:26,phase:.2,
    features:[[.78,.35,.59,.37,.8,.47,-.31],[-.3,.72,.6,.5,.35,.4,-.065]]});
  const right=envelope(V(.118,.146,.116),V(.099,-.015,-.01),{resolution:26,phase:1.4,
    features:[[-.78,.28,.6,.37,.85,.48,-.31],[.4,-.5,.72,.5,.45,.4,-.07]]});
  const base=path([V(-.108,-.114,.003),V(-.02,-.144,-.006),V(.093,-.11,-.003)],.036,18,6);
  add(parent,name+'TwoDomainsWithOpenSubstrateCleft',combine([left,right,base]),bodyMaterial);
  const loop=path([V(.101,.052,.064),V(.076,.107,.102),V(.035,.119,.105),V(.014,.091,.079)],.014,24,6);
  add(parent,name+'UnilateralOccludingLoopEnvelope',loop,loopMaterial);
  parent.userData={...parent.userData,representativeHydrolase:'cathepsin B type',coarseNotPDBReconstruction:true,
    proteinDetail:'Joined domain envelopes with an open substrate cleft and unilateral occluding-loop cue',
    catalyticResidueAssignment:false,staticDomainDrawCalls:2};
}

export function addVAtpaseDomains(parent,name,membraneMaterial,catalyticMaterial) {
  const ring=new THREE.TorusGeometry(.078,.027,7,24);ring.rotateX(Math.PI/2);
  const frame=[ring,cylinder(V(0,-.055,0),V(0,.238,0),.017,10),
    cylinder(V(.114,.015,0),V(.114,.208,0),.014,8),
    cylinder(V(-.088,.015,-.048),V(-.092,.205,-.046),.011,8)];
  add(parent,name+'V0RotorRingAndPeripheralStalks',combine(frame),membraneMaterial);
  const head=[];
  for(let i=0;i<6;i++) {
    const angle=i*Math.PI/3,x=Math.cos(angle)*.076,z=Math.sin(angle)*.076;
    head.push(envelope(V(.047,.067,.047),V(x,.23,z),{resolution:16,phase:i*.7,
      features:[[Math.cos(angle),.1,Math.sin(angle),.65,.6,.65,i%2?-.11:.045]]}));
  }
  add(parent,name+'V1AlternatingCatalyticHeadDomains',combine(head),catalyticMaterial);
  parent.userData={...parent.userData,v1Side:'cytosolic',v0SpansMembrane:true,
    proteinDetail:'Six-domain V1 head separated from membrane V0 ring and peripheral stalks',staticDomainDrawCalls:2,structuralFit:false};
}
