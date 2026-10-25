// Bounded teaching geometry: heterogeneity is spatially organised, not a
// simulation or a sample-derived filament trace. Host validates every route.
export function createCytoskeletonMorphology({THREE,cellRadius,corticalPoint,cagePoint,nucleusCenter}){
  const V=(x=0,y=0,z=0)=>new THREE.Vector3(x,y,z),TAU=Math.PI*2;
  const hash=(i,s=0)=>{const x=Math.sin(i*127.1+s*311.7+19.73)*43758.5453123;return x-Math.floor(x);};
  const curve=points=>new THREE.CatmullRomCurve3(points,false,'centripetal');
  function basis(n){const u=V().crossVectors(Math.abs(n.z)<.8?V(0,0,1):V(0,1,0),n).normalize();return [u,V().crossVectors(n,u).normalize()];}
  function microtubuleCandidates(points,index,mtoc,originalMTOC){
    const start=points[0].clone().sub(originalMTOC).multiplyScalar(.46).add(mtoc),oldEnd=points.at(-1),azimuth=Math.atan2(oldEnd.y,oldEnd.x)+.22*(hash(index,1)-.5)+.11*Math.sin(index*1.37);
    const reach=.56+.43*hash(index,2),xy=Math.hypot(oldEnd.x,oldEnd.y)*reach,end=V(Math.cos(azimuth)*xy,Math.sin(azimuth)*xy,.25+2.5*hash(index,3));
    const radial=end.clone().normalize(),limit=cellRadius(radial)-.52;if(end.length()>limit)end.setLength(limit);
    const side=V().crossVectors(end.clone().sub(start).normalize(),V(0,0,1)).normalize(),bend=(hash(index,4)-.5)*1.12;
    const build=(target,lift,variant)=>{
      const controls=[start.clone()];
      for(const t of [.23,.54,.81]){
        const p=start.clone().lerp(target,t).addScaledVector(side,Math.sin(Math.PI*t)*(bend+.12*variant));
        // Bending is concentrated towards the periphery, not a uniform sine
        // drawn over every long, relatively stiff microtubule.
        if(index%5===1)p.addScaledVector(side,Math.max(0,(t-.5)/.5)**2*(.38+.38*hash(index,15)));
        if(lift!==null)p.z=THREE.MathUtils.lerp(p.z,lift,Math.sin(Math.PI*t)**.65);
        p.y+=.10*Math.sin(Math.PI*t)*Math.sin(index*.87+variant);controls.push(p);
      }
      controls.push(target.clone());return {points:controls,method:lift===null?'centrosomal-outgrowth-with-unequal-peripheral-bend':'individual-smooth-cytoplasmic-detour'};
    };
    const candidates=[build(end,null,0),build(end,2.37+.32*hash(index,5),1),build(end,2.76+.24*hash(index,6),-1)];
    // Alternative endpoints differ in extent and depth per filament. None is
    // forced through an obstacle or onto one global horizontal route plane.
    for(let variant=0;variant<4;variant++){
      const target=end.clone().multiplyScalar(.93-.065*variant);target.z=2.05+.85*hash(index,7+variant);
      const r=cellRadius(target.clone().normalize())-.50;if(target.length()>r)target.setLength(r);
      candidates.push(build(target,2.36+.48*hash(index,12+variant),variant%2?-.65:.65));
    }
    if(index%3===0){
      // Visible peripheral segments need not converge on one centrosome.
      // Their free displayed ends are segment boundaries, not nucleation sites.
      const center=end.clone().normalize();center.z=(hash(index,16)-.5)*.95;center.normalize();
      const [u,v]=basis(center),angle=TAU*hash(index,17),axis=u.multiplyScalar(Math.cos(angle)).addScaledVector(v,Math.sin(angle));
      const lateral=V().crossVectors(center,axis).normalize(),span=.40+.39*hash(index,18);
      const peripheral=[];
      for(const inset of [.50,.74,1.02,1.32]){
        const controls=[];
        for(let j=0;j<=6;j++){
          const t=j/6-.5,d=center.clone().addScaledVector(axis,span*t).addScaledVector(lateral,(.12+.20*hash(index,19))*(t*t-.25));
          controls.push(corticalPoint(d,inset+.08*Math.sin((t+.5)*Math.PI)));
        }
        peripheral.push({points:controls,method:'distributed-curved-peripheral-MT-segment'});
      }
      return [...peripheral,...candidates];
    }
    return candidates;
  }

  const actin=[];
  function corticalArc({id,center,angle,span,bend,inset,local=false,patch=null}){
    const [e1,e2]=basis(center),axis=e1.clone().multiplyScalar(Math.cos(angle)).addScaledVector(e2,Math.sin(angle)),cross=V().crossVectors(center,axis).normalize(),points=[];
    for(let j=0;j<=18;j++){
      const t=j/18-.5,d=center.clone().addScaledVector(axis,span*t).addScaledVector(cross,bend*(t*t-.25)+.018*Math.sin((t+.5)*Math.PI));
      points.push(corticalPoint(d,inset+.025*Math.sin((t+.5)*Math.PI)));
    }
    const entry={id,curve:curve(points),local,patch,kind:local?'local-cortical-mother':'heterogeneous-cortical-filament',inset};actin.push(entry);return entry;
  }
  // Sparse background has an inhomogeneous distribution over the whole cortex;
  // no same-latitude rings or equal angular increments are used.
  for(let i=0;i<48;i++){
    const a=TAU*hash(i,21),z=1.70*hash(i,22)-.85,r=Math.sqrt(1-z*z),center=V(r*Math.cos(a),r*Math.sin(a),z);
    if(hash(i,23)>.58+.30*Math.max(0,center.x))continue;
    corticalArc({id:'cortex-'+i,center,angle:TAU*hash(i,24),span:.065+.22*hash(i,25),bend:(hash(i,26)-.5)*.14,inset:.23+.11*hash(i,27)});
  }
  const patches=[V(1,.05,.2).normalize(),V(-.44,.74,.35).normalize(),V(.40,-.66,-.32).normalize()];
  for(let patch=0;patch<patches.length;patch++)for(let k=0;k<[12,6,3][patch];k++){
    const i=patch*17+k,[u,v]=basis(patches[patch]),offset=.13*Math.sqrt(hash(i,31)),phi=TAU*hash(i,32),center=patches[patch].clone().addScaledVector(u,offset*Math.cos(phi)).addScaledVector(v,offset*Math.sin(phi)).normalize();
    const parent=corticalArc({id:'patch-'+patch+'-mother-'+k,center,angle:TAU*hash(i,33),span:.09+.20*hash(i,34),bend:(hash(i,35)-.5)*.19,inset:.17+.21*hash(i,36),local:true,patch});
    for(let b=0;b<(k%3===0?2:1);b++){
      const t=.25+.40*hash(i,40+b),anchor=parent.curve.getPoint(t),normal=anchor.clone().normalize(),tangent=parent.curve.getTangent(t).normalize();
      // A selected Arp2/3-like daughter branch, not a rule for every cortical
      // intersection. Background overlaps need not be molecular branch sites.
      const angle=(68+4*hash(i,43+b))*Math.PI/180*(b%2?-1:1),direction=tangent.clone().applyAxisAngle(normal,angle).normalize(),length=.32+.62*hash(i,47+b),points=[anchor.clone(),anchor.clone().addScaledVector(direction,.055)];
      for(const f of [.32,.68,1]){
        const q=anchor.clone().addScaledVector(direction,length*f).addScaledVector(normal,-.04*f*f),d=q.clone().normalize();
        points.push(corticalPoint(d,parent.inset+.02*Math.sin(Math.PI*t)+.02*f));
      }
      actin.push({id:parent.id+'-branch-'+b,curve:curve(points),local:true,patch,kind:'selected-Arp2-3-like-daughter',branchParentId:parent.id,branchPoint:anchor,branchAngleDegrees:Math.abs(angle)*180/Math.PI});
    }
  }

  const intermediate=[];
  for(let i=0;i<15;i++){
    const start=TAU*hash(i,61),span=(.45+1.05*hash(i,62))*(i%2?-1:1),latitude=(hash(i,63)-.5)*1.30,drift=(hash(i,64)-.5)*.86,points=[];
    const endDirection=V(Math.cos(start+span),Math.sin(latitude+drift*.6),Math.sin(start+span)).normalize(),periphery=corticalPoint(endDirection,.78+.80*hash(i,70));
    for(let j=0;j<=32;j++){
      const t=j/32,a=start+span*t,lat=latitude+drift*(t-.5)+.13*Math.sin(Math.PI*t+hash(i,65)*TAU),d=V(Math.cos(a)*Math.cos(lat),Math.sin(lat),Math.sin(a)*Math.cos(lat));
      const p=cagePoint(d),outward=p.clone().sub(nucleusCenter).normalize();p.addScaledVector(outward,.045+.34*hash(i,66)+.095*Math.sin(Math.PI*t)**2);
      // Most strands leave the nuclear neighbourhood instead of following a
      // shared support surface all the way around a geometrical cage.
      if(i%3!==0){const q=Math.max(0,(t-.36)/.64);p.lerp(periphery,q*q*(3-2*q));}
      points.push(p);
    }
    intermediate.push({id:'juxtanuclear-'+i,curve:curve(points),closed:false,kind:i%3===0?'short-open-perinuclear-strand':'open-perinuclear-to-cytoplasmic-strand'});
    // A few near-parallel partners depict local bundles, rather than a uniform
    // lattice. They are distinct filaments, not branches of one IF polymer.
    if(i%5===0){const offset=V(.045*(hash(i,67)-.5),.04*(hash(i,68)-.5),.045*(hash(i,69)-.5));intermediate.push({id:'bundle-partner-'+i,curve:curve(points.map(p=>p.clone().add(offset))),closed:false,kind:'local-near-parallel-IF-partner'});}
  }
  for(let i=0;i<17;i++){
    const a=TAU*hash(i,71),d=V(Math.cos(a),Math.sin(a),1.10*(hash(i,72)-.5)).normalize(),start=cagePoint(d),endDirection=d.clone().applyAxisAngle(V(0,0,1),(hash(i,75)-.5)*.9),end=corticalPoint(endDirection,.66+1.2*hash(i,73)),side=V().crossVectors(d,V(0,0,1)).normalize(),points=[];
    if(i%3===1)start.lerp(end,.24+.20*hash(i,76));
    for(const t of [0,.19,.44,.72,1])points.push(start.clone().lerp(end,t).addScaledVector(side,Math.sin(Math.PI*t)*(.18+.42*hash(i,74))).add(V(0,0,(hash(i,77)-.5)*.60*Math.sin(Math.PI*t))));
    intermediate.push({id:'cytoplasmic-'+i,curve:curve(points),closed:false,kind:'dispersed-open-cytoplasmic-extension'});
  }
  return {microtubuleCandidates,actin,intermediate,stats:{seed:'fixed spatial hash, illustrative not measured',actinBackground:actin.filter(e=>!e.local).length,actinMothers:actin.filter(e=>e.kind==='local-cortical-mother').length,actinDaughters:actin.filter(e=>e.branchParentId).length,actinPatches:patches.length,intermediateStrands:intermediate.length,closedIFLoops:0}};
}
