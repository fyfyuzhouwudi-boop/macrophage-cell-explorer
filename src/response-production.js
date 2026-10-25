// Scale-adjusted, cutaway teaching excerpts for cytokine production. They are
// authored as local states, not reconstructed tracks through intact organelles.
export function createResponseProduction({ THREE, group, mesh, instances, place, domains, strand, material, visible, erSite, golgiSite, exportSurface, exportNormal, entrySurface, entryNormal, includeUptakeContext = true }) {
  const V = THREE.Vector3, smooth = THREE.MathUtils.smoothstep;
  const fade = (p,a,b,c,d) => smooth(p,a,b) * (1-smooth(p,c,d));
  const roots = [], records = [];
  function root(name, position, role, dependencies) {
    const object = new THREE.Group(); object.name=name; object.position.copy(position);
    object.userData.scaleAdjustedLocalTeachingExcerpt=true; group.add(object);
    roots.push(object); records.push({object,role,dependencies}); return object;
  }
  // The slab includes both faces and its cut rim. The central hole is geometry,
  // so the emerging chain does not pass through an intact membrane face.
  const ripple=(x,y,width,depth)=>.016*Math.sin(x*Math.PI*2/width)*Math.cos(y*Math.PI/depth);
  function membraneOutline(width,depth,frontCut=-depth/2){
    const radius=Math.min(.13,(depth/2-frontCut)/4),x=-width/2,y=frontCut,height=depth/2-frontCut,shape=new THREE.Shape();
    shape.moveTo(x+radius,y);shape.lineTo(x+width-radius,y);shape.quadraticCurveTo(x+width,y,x+width,y+radius);
    shape.lineTo(x+width,y+height-radius);shape.quadraticCurveTo(x+width,y+height,x+width-radius,y+height);
    shape.lineTo(x+radius,y+height);shape.quadraticCurveTo(x,y+height,x,y+height-radius);shape.lineTo(x,y+radius);shape.quadraticCurveTo(x,y,x+radius,y);
    return shape;
  }
  function membraneSlab(width,depth,color,name,parent,hole=0,frontCut=-depth/2){
    const shape=membraneOutline(width,depth,frontCut);
    if(hole){const opening=new THREE.Path();opening.absarc(0,0,hole,0,Math.PI*2,true);shape.holes.push(opening);}
    const geometry=new THREE.ExtrudeGeometry(shape,{depth:.035,steps:1,bevelEnabled:true,bevelThickness:.008,bevelSize:.008,bevelSegments:2,curveSegments:16});
    geometry.translate(0,0,-.0175);
    const position=geometry.attributes.position;for(let i=0;i<position.count;i++)position.setZ(i,position.getZ(i)+ripple(position.getX(i),position.getY(i),width,depth));geometry.computeVertexNormals();
    const object=mesh(geometry,material(color,{roughness:.68,glow:.035}),name,parent);
    return object;
  }
  function cisternalWalls(width,depth,frontCut,top,bottom,color,name,parent){
    const points=membraneOutline(width,depth,frontCut).getPoints(12);points.pop();
    const vertices=[],thickness=.035;
    const inner=points.map((point,i)=>{const before=points[(i-1+points.length)%points.length],after=points[(i+1)%points.length],dx=after.x-before.x,dy=after.y-before.y,length=Math.hypot(dx,dy)||1;return new THREE.Vector2(point.x-dy/length*thickness,point.y+dx/length*thickness);});
    const point3=(point,z)=>[point.x,point.y,z+ripple(point.x,point.y,width,depth)];
    const quad=(a,b,c,d)=>vertices.push(...a,...b,...d,...b,...c,...d);
    const skipped=i=>{const a=points[i],b=points[(i+1)%points.length];return Math.abs(a.y-frontCut)<1e-6&&Math.abs(b.y-frontCut)<1e-6;};
    for(let i=0;i<points.length;i++){
      if(skipped(i))continue;const j=(i+1)%points.length,a=points[i],b=points[j],ia=inner[i],ib=inner[j];
      quad(point3(a,top),point3(b,top),point3(b,bottom),point3(a,bottom));
      quad(point3(ib,top),point3(ia,top),point3(ia,bottom),point3(ib,bottom));
      quad(point3(ia,top),point3(ib,top),point3(b,top),point3(a,top));
      quad(point3(a,bottom),point3(b,bottom),point3(ib,bottom),point3(ia,bottom));
      if(skipped((i-1+points.length)%points.length))quad(point3(a,top),point3(a,bottom),point3(ia,bottom),point3(ia,top));
      if(skipped(j))quad(point3(b,bottom),point3(b,top),point3(ib,top),point3(ib,bottom));
    }
    const geometry=new THREE.BufferGeometry();geometry.setAttribute('position',new THREE.Float32BufferAttribute(vertices,3));geometry.computeVertexNormals();
    return mesh(geometry,material(color,{roughness:.72,glow:.025,side:THREE.DoubleSide}),name,parent);
  }
  const uptake=includeUptakeContext?root('HostUptakeMembraneLocalContext',entrySurface,'host-uptake-membrane-local-context',['membrane']):null;
  if(uptake){
    uptake.quaternion.setFromUnitVectors(new V(0,0,1),entryNormal);
    membraneSlab(.88,.70,'#8fa8a4','HostMembraneAtUptakeStateHandoff',uptake);
  }
  const er=root('ERTranslationAndTranslocationLocalExcerpt',erSite,'host-ER-translation-local-excerpt',['er']);
  membraneSlab(1.18,.76,'#799aa0','ERMembraneWithRealTransloconOpening',er,.082,-.14);
  const erLower=membraneSlab(1.18,.76,'#91a9a4','ERLumenLowerMembraneCutaway',er,0,-.14);erLower.position.z=-.52;
  cisternalWalls(1.18,.76,-.14,-.014,-.506,'#799b9c','ERCisternalContinuousSideAndBackMembrane',er);
  const translocon=new THREE.Group();translocon.name='Sec61TeachingTranslocon';er.add(translocon);
  const channelMat=material('#b6a46c',{roughness:.65,glow:.04});
  for(let i=0;i<10;i++){
    const a=i*Math.PI/5,p=[Math.cos(a)*.095,Math.sin(a)*.095,0];
    domains([{p,s:[.025,.025,.085]}],channelMat,'TransloconHelix'+i,translocon);
  }
  domains([{p:[.145,.025,0],s:[.021,.021,.075]},{p:[-.13,-.06,0],s:[.021,.021,.075]}],channelMat,'Sec61AuxiliarySubunitsTeachingHelices',translocon);
  const ribosome=domains([{p:[-.035,0,.24],s:[.18,.14,.13]},{p:[.045,0,.135],s:[.12,.11,.075]}],material('#937a9e',{roughness:.71,glow:.04}),'ERRibosomeTranslatingHostIFNB1',er);
  const mrna=strand([[-.47,-.015,.17],[-.29,.018,.19],[-.10,0,.17],[.13,-.02,.18],[.37,.01,.17]],.012,material('#a96c37',{roughness:.66,glow:.035}),'IFNB1MessengerRNAOnERRibosome',er,42);
  const chain=strand(Array.from({length:32},(_,i)=>{const t=i/31;return new V(.034*Math.sin(t*12)*t,.025*Math.cos(t*15)*t,.15-t*.56);}),.014,material('#277f83',{roughness:.61,glow:.065}),'NascentIFNBetaChainThroughTranslocon',er,60);
  chain.geometry.translate(0,0,-.15);chain.position.z=.15;
  const folded=mesh(new THREE.IcosahedronGeometry(1,2),material('#277f83',{roughness:.63,glow:.065}),'FoldedIFNBetaInsideERLumen',er);
  folded.position.set(.19,-.025,-.28);folded.scale.set(.09,.073,.085);
  // A few lipid heads clarify the two sides without making another noisy cloud.
  const heads=instances(new THREE.SphereGeometry(.018,10,7),material('#bdc9bd',{roughness:.68,glow:.02}),72,'ERSectionLipidHeadRows',er);
  let hi=0;for(const base of [0,-.52])for(const z of [-.025,.025])for(let i=0;i<18;i++){const x=(i/17-.5)*1.02;place(heads,hi++,new V(x,-.14,base+z+ripple(x,-.14,1.18,.76)),1);}heads.instanceMatrix.needsUpdate=true;

  const golgi=root('GolgiProcessingLocalCutawayExcerpt',golgiSite,'host-Golgi-processing-local-excerpt',['golgi']);
  const cisternae=[];
  for(let row=0;row<3;row++){
    const z=(row-1)*.40, width=1.20-row*.11, section=new THREE.Group();section.name=['CisGolgiLumenSection','MedialGolgiLumenSection','TransGolgiLumenSection'][row];golgi.add(section);
    const top=membraneSlab(width,.64,'#b78f88',section.name+'UpperMembrane',section,0,-.11),bottom=membraneSlab(width,.64,'#c29d93',section.name+'LowerMembrane',section,0,-.11);
    top.position.z=z+.105;bottom.position.z=z-.105;
    cisternalWalls(width,.64,-.11,z+.091,z-.091,'#a98079',section.name+'ContinuousBackAndSideMembrane',section);
    const cargo=instances(new THREE.IcosahedronGeometry(1,2),material('#277f83',{roughness:.62,glow:.065}),3,section.name+'IFNBetaLumenCargo',section);
    for(let i=0;i<3;i++)place(cargo,i,new V((i-1)*.24,-.015,z),new V(.065,.05,.055));cargo.instanceMatrix.needsUpdate=true;
    cisternae.push({section,cargo});
  }

  const exocytosis=root('IFNBetaExocytosisOpenPoreLocalExcerpt',exportSurface,'host-IFN-exocytosis-local-excerpt',['membrane','transport-vesicles']);
  exocytosis.quaternion.setFromUnitVectors(new V(0,0,1),exportNormal);
  // One continuous omega profile: vesicle lumen below -> open neck -> surface.
  // This is the open-pore state after membrane fusion, not an invented SNARE
  // identity for this cell's IFN carrier. The front half is sectioned to expose
  // the same lumen/neck/exit plane the camera uses, with closed section rims.
  const omegaStart=Math.PI/2,omegaArc=Math.PI;
  const profileControls=[new THREE.Vector2(0,-.58),new THREE.Vector2(.12,-.56),new THREE.Vector2(.23,-.48),new THREE.Vector2(.27,-.34),new THREE.Vector2(.24,-.20),new THREE.Vector2(.15,-.09),new THREE.Vector2(.125,-.015),new THREE.Vector2(.17,.015),new THREE.Vector2(.28,.022),new THREE.Vector2(.48,.01),new THREE.Vector2(.68,0)];
  const profile=new THREE.SplineCurve(profileControls).getPoints(80).map(point=>new THREE.Vector2(Math.max(0,point.x),point.y));
  const omegaGeometry=new THREE.LatheGeometry(profile,64,omegaStart,omegaArc);omegaGeometry.rotateX(Math.PI/2);
  const omega=mesh(omegaGeometry,material('#92ada7',{roughness:.68,glow:.035,side:THREE.DoubleSide}),'ContinuousHostOmegaMembraneWithOpenExocytosisPore',exocytosis);
  const innerProfile=profile.map((point,index)=>{
    const before=profile[Math.max(0,index-1)],after=profile[Math.min(profile.length-1,index+1)],dr=after.x-before.x,dz=after.y-before.y,length=Math.hypot(dr,dz)||1;
    return new THREE.Vector2(Math.max(0,point.x-dz/length*.018),point.y+dr/length*.018);
  });
  const innerOmega=new THREE.LatheGeometry(innerProfile,64,omegaStart,omegaArc);innerOmega.rotateX(Math.PI/2);
  mesh(innerOmega,material('#a8bbb0',{roughness:.70,glow:.025,side:THREE.DoubleSide}),'OpenExocytosisPoreLumenFacingMembrane',exocytosis);
  const rimVertices=[],rimPoint=(point,angle)=>[point.x*Math.sin(angle),-point.x*Math.cos(angle),point.y];
  const rimQuad=(a,b,c,d)=>rimVertices.push(...a,...b,...d,...b,...c,...d);
  for(const angle of [omegaStart,omegaStart+omegaArc])for(let i=0;i<profile.length-1;i++)rimQuad(rimPoint(profile[i],angle),rimPoint(profile[i+1],angle),rimPoint(innerProfile[i+1],angle),rimPoint(innerProfile[i],angle));
  for(let i=0;i<64;i++){
    const a=omegaStart+i/64*omegaArc,b=omegaStart+(i+1)/64*omegaArc,last=profile.length-1;
    rimQuad(rimPoint(profile[last],a),rimPoint(profile[last],b),rimPoint(innerProfile[last],b),rimPoint(innerProfile[last],a));
  }
  const rimGeometry=new THREE.BufferGeometry();rimGeometry.setAttribute('position',new THREE.Float32BufferAttribute(rimVertices,3));rimGeometry.computeVertexNormals();
  mesh(rimGeometry,material('#b7c3b1',{roughness:.70,glow:.02,side:THREE.DoubleSide}),'OpenExocytosisPoreClosedSectionRims',exocytosis);
  mesh(new THREE.TorusGeometry(.135,.018,8,56,Math.PI),material('#b8c7b1',{roughness:.68,glow:.025}),'OpenExocytosisPoreBilayerRim',exocytosis);
  const released=instances(new THREE.IcosahedronGeometry(1,2),material('#277f83',{roughness:.63,glow:.065}),5,'IFNBetaCargoPassingThroughOpenExocytosisPore',exocytosis);
  const phase=new V(),scale=new V(.042,.034,.038);
  let lastProgress=NaN;
  const updates={ER:0,Golgi:0,exocytosis:0};
  function update(p){
    if(p===lastProgress)return;lastProgress=p;
    if(uptake)visible(uptake,fade(p,0,.012,.129,.145));
    visible(er,fade(p,.659,.668,.692,.702));
    if((er.userData.displayWeight??0)>1e-4){
      updates.ER++;
      const synthesis=smooth(p,.662,.691);chain.scale.z=.25+.75*synthesis;folded.scale.set(.09,.073,.085).multiplyScalar(.2+.8*smooth(p,.679,.692));
      ribosome.rotation.z=.015*Math.sin(synthesis*Math.PI*2);mrna.position.x=-.025*synthesis;
    }
    visible(golgi,fade(p,.689,.699,.727,.738));
    if((golgi.userData.displayWeight??0)>1e-4){updates.Golgi++;for(let i=0;i<cisternae.length;i++)visible(cisternae[i].cargo,.24+.76*smooth(p,.692+i*.009,.703+i*.009));}
    visible(exocytosis,fade(p,.780,.789,.818,.831));
    if((exocytosis.userData.displayWeight??0)<=1e-4)return;
    updates.exocytosis++;
    const release=smooth(p,.785,.818);
    for(let i=0;i<5;i++){
      const t=THREE.MathUtils.clamp(release*1.55-i*.14,0,1),side=Math.sin(i*2.4)*.05;
      // All cargo follows the open lumen; it never crosses the membrane sheet.
      phase.set(side*(.4+t),Math.cos(i*2.1)*.035,-.42+t*.88);place(released,i,phase,scale);
    }
    released.instanceMatrix.needsUpdate=true;
  }
  return {roots,records,update,anchors:{er:er.position,golgi:golgi.position,exocytosis:exocytosis.position},diagnostics:()=>({localExcerpts:true,membraneHoleGeometry:true,exocytosisOpenPore:true,cytokineIdentity:'host IFN-beta',atomicCoordinatesUsed:false,intercompartmentFusionReconstruction:false,geometryRegenerationsPerFrame:0,hiddenExcerptUpdatesSkipped:true,activeUpdates:{...updates},releasePath:'ER/Golgi lumen -> carrier lumen -> open exocytosis pore -> extracellular side'})};
}
