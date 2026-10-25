import * as THREE from 'three';

const V = (x=0,y=0,z=0) => new THREE.Vector3(x,y,z);
const clamp = THREE.MathUtils.clamp;

// Each radial surface is a single closed membrane face. The endosomal tubules
// are part of the same zero-set as the vacuole, with no internal caps or seams.
// All component fields contain the origin, so a ray has one exterior crossing.
function smoothMin(a,b,k) {
  const h=clamp(.5+.5*(b-a)/k,0,1);
  return THREE.MathUtils.lerp(b,a,h)-k*h*(1-h);
}
function ellipsoidField(p,axes) {
  const k0=Math.hypot(p.x/axes.x,p.y/axes.y,p.z/axes.z);
  const k1=Math.hypot(p.x/(axes.x*axes.x),p.y/(axes.y*axes.y),p.z/(axes.z*axes.z));
  return k1<1e-8 ? -Math.min(axes.x,axes.y,axes.z) : k0*(k0-1)/k1;
}
function capsuleField(p,end,radius) {
  const h=clamp(p.dot(end)/end.lengthSq(),0,1);
  return Math.hypot(p.x-end.x*h,p.y-end.y*h,p.z-end.z*h)-radius;
}

export const ENDOSOME_TUBULES = [
  { end:V(.93,.25,-.06), radius:.076 },
  { end:V(-.53,.75,-.025), radius:.065 }
];
export function sortingEndosomeField(p) {
  let d=ellipsoidField(p,V(.59,.46,.43));
  for(const branch of ENDOSOME_TUBULES)d=smoothMin(d,capsuleField(p,branch.end,branch.radius),.095);
  return d;
}

export function endosomeRadius(direction,inset=0) {
  let low=0,high=1.07;
  const p=V();
  for(let i=0;i<32;i++) {
    const mid=(low+high)*.5;
    p.copy(direction).multiplyScalar(mid);
    if(sortingEndosomeField(p)<-inset)low=mid;else high=mid;
  }
  return (low+high)*.5;
}

export function phagosomeRadius(direction,inset=0) {
  const {x,y,z}=direction;
  const ellipsoid=1/Math.hypot(x/.94,y/.77,z/.73);
  const broadShape=1+.043*Math.sin(3.3*x+1.2*y-.7*z)+.032*Math.sin(5*y-2.3*z+.6)+.018*Math.sin(6*x-5*y+2*z);
  return ellipsoid*broadShape-inset;
}

// A selected irregular cellular cargo, separated from the enclosing membrane
// by a variable but positive lumen. The shape is not a universal phagosome core.
export function phagosomeCargoRadius(direction) {
  const {x,y,z}=direction;
  const gap=.098+.037*(.5+.5*Math.sin(4*x-3*y+2*z));
  const surface=.018*Math.sin(11*x+6*y-4*z)*Math.cos(8*y+7*z);
  const localLoss=.045*Math.exp(-((x-.42)**2+(y+.28)**2+(z-.82)**2)/.15);
  return phagosomeRadius(direction,.026)-gap+surface-localLoss;
}

export function lysosomeRadius(direction,inset=0) {
  const {x,y,z}=direction;
  const shape=1+.032*Math.sin(4*x+2*y-z)+.021*Math.sin(3*y-5*z+.8);
  return shape/Math.hypot(x/.92,y/.81,z/.86)-inset;
}

export function peroxisomeRadius(direction,inset=0) {
  const {x,y,z}=direction;
  return (1+.014*Math.sin(4*x+2.7*y-1.3*z))/Math.hypot(x/.65,y/.93,z/.59)-inset;
}

export function radialBoundary(radiusAt,{detail=true,inset=0,name='CompartmentBoundary',widthSegments=null,heightSegments=null}={}) {
  const tubular=radiusAt===endosomeRadius;
  const geometry=new THREE.SphereGeometry(1,widthSegments??(detail?(tubular?256:128):64),heightSegments??(detail?(tubular?160:80):40));
  const positions=geometry.attributes.position,direction=V();
  let maximumRadius=0,minimumRadius=Infinity;
  for(let i=0;i<positions.count;i++) {
    direction.fromBufferAttribute(positions,i).normalize();
    const radius=radiusAt(direction,inset);
    positions.setXYZ(i,direction.x*radius,direction.y*radius,direction.z*radius);
    maximumRadius=Math.max(maximumRadius,radius);
    minimumRadius=Math.min(minimumRadius,radius);
  }
  geometry.computeVertexNormals();
  geometry.computeBoundingBox();
  geometry.computeBoundingSphere();
  geometry.name=name;
  geometry.userData={radialClosedBoundary:true,maximumRadius,minimumRadius,inset,detail};
  return geometry;
}
