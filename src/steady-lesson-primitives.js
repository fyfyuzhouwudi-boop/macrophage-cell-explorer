import * as THREE from 'three';
export { THREE };
export const V=(x=0,y=0,z=0)=>new THREE.Vector3(x,y,z),clamp=THREE.MathUtils.clamp;
export const ease=x=>{const t=clamp(x,0,1);return t*t*(3-2*t);};
export function material(color,extra={}){return new THREE.MeshStandardMaterial({color,roughness:.78,metalness:0,envMapIntensity:.3,side:THREE.DoubleSide,...extra});}
export function mesh(parent,name,geometry,mat,position=V()){const o=new THREE.Mesh(geometry,mat);o.name=name;o.position.copy(position);o.userData={pickThrough:true,teachingOnly:true};parent.add(o);return o;}
export function ball(parent,name,r,mat,pos=V(),scale=V(1,1,1)){const o=mesh(parent,name,new THREE.SphereGeometry(r,28,18),mat,pos);o.scale.copy(scale);return o;}
export function rod(parent,name,a,b,r,mat){const o=mesh(parent,name,new THREE.CylinderGeometry(r,r,1,10),mat);connect(o,a,b);return o;}
export function connect(o,a,b){o.position.copy(a).add(b).multiplyScalar(.5);o.scale.y=a.distanceTo(b);o.quaternion.setFromUnitVectors(V(0,1,0),b.clone().sub(a).normalize());}
export function tube(parent,name,points,r,mat){return mesh(parent,name,new THREE.TubeGeometry(new THREE.CatmullRomCurve3(points),44,r,9),mat);}
export function cavity(parent,name,pos,r,color,scale=V(1,1,1)){
 const g=new THREE.Group();g.name=name;g.position.copy(pos);g.scale.copy(scale);parent.add(g);
 const mat=material(color),wall=mesh(g,name+'CutawayMembrane',new THREE.SphereGeometry(r,56,36,Math.PI,Math.PI),mat);
 wall.userData.compartmentBoundary=true;wall.userData.observationCut=true;
 mesh(g,name+'CutEdge',new THREE.TorusGeometry(r,.022,6,72),material(color));
 return g;
}
export function chain(parent,name,color,size=.22){
 const g=new THREE.Group();g.name=name;parent.add(g);const mat=material(color);
 for(let i=0;i<7;i++)ball(g,name+'Domain'+i,size*(.64+(i%3)*.1),mat,V(Math.sin(i*1.81)*size*.7,(i-3)*size*.34,Math.cos(i*1.3)*size*.35));
 return g;
}
export function receptor(parent,name,color=0x427f72){
 const g=new THREE.Group();g.name=name;parent.add(g);const mat=material(color);
 rod(g,name+'TransmembraneStem',V(0,-.17,0),V(0,.18,0),.045,mat);
 rod(g,name+'BindingArms',V(-.15,.23,0),V(.15,.23,0),.065,mat);
 ball(g,name+'CytosolicTail',.06,mat,V(0,-.24,0));return g;
}
export function carrier(parent,name,color){const g=cavity(parent,name,V(),.34,color);g.userData.transportVesicle=true;return g;}
export function guideRoute(parent,name,points,color){
 // Short separated solid marks remain readable on a light canvas. They are
 // sequence annotations, never a continuous membrane/transport conduit.
 const curve=new THREE.CatmullRomCurve3(points),length=curve.getLength(),o=new THREE.Group();
 o.name=name;o.userData={pickThrough:true,teachingOnly:true,sequenceGuideNotTube:true,dashedDirectionAnnotation:true};parent.add(o);
 // Preserve the caller's semantic hue when themes change. Matching literal
 // swatches made unrelated recycling/degradation routes fall back to red.
 const ink=new THREE.Color(color).multiplyScalar(.67);
 const mat=new THREE.MeshBasicMaterial({color:ink,toneMapped:false});
 const terminalGap=.19,dash=.15,pitch=.26;
 for(let distance=0,index=0;distance<length-terminalGap-.025;distance+=pitch,index++){
  const a=curve.getPointAt(distance/length),b=curve.getPointAt(Math.min(distance+dash,length-terminalGap)/length);
  const segment=rod(o,name+'Dash'+index,a,b,.024,mat);segment.userData.sequenceGuideNotTube=true;
 }
 const tip=curve.getPointAt(.99),direction=curve.getTangentAt(.99).normalize(),headLength=.19;
 const arrow=mesh(o,name+'DirectionArrowhead',new THREE.ConeGeometry(.088,headLength,10),mat,tip.clone().addScaledVector(direction,-headLength/2));
 arrow.quaternion.setFromUnitVectors(V(0,1,0),direction);arrow.userData.sequenceGuideNotTube=true;
 return o;
}
export function membranePanel(parent,name,pos,color=0x91aaa9){
 const group=new THREE.Group();group.name=name;group.position.copy(pos);parent.add(group);
 const mat=material(color);for(const x of[-.065,.065])mesh(group,name+'LipidLeaflet',new THREE.BoxGeometry(.04,2.1,.65),mat,V(x,0,0));
 return group;
}
