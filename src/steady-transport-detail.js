/** Expanded teaching anatomy and mechanics; spatial and temporal scales differ. */
export function buildTransportLesson(g,ctx){
 const {THREE,V,clamp,ease,material,mesh,ball,rod,connect,tube,cavity,chain,label,focus,getProgress}=ctx;
 const amber=0xc18d46,blue=0x789eaa,purple=0x82678f;
 const mitoMat=material(0xb78461),innerMat=material(0xd5a77c),edgeMat=material(0xe1bd93),proteinMat=material(0x73978e),gold=material(0xc3994e);
 const mito=new THREE.Group();mito.name='MitochondrialEnergyLocalExcerpt';mito.position.set(-2.55,1.05,-.25);g.add(mito);
 const shell=(name,r,mat)=>{const m=mesh(mito,name,new THREE.SphereGeometry(r,64,40,Math.PI,Math.PI),mat);m.scale.set(1.38,.64,.56);m.userData={teachingOnly:true,compartmentBoundary:true,observationCut:true};return m;};
 shell('MitochondrialOuterMembraneCutaway',1.04,mitoMat);shell('MitochondrialInnerBoundaryMembrane',.94,innerMat);
 for(const [name,r,mat]of[['OuterMembraneSectionEdge',1.04,edgeMat],['InnerBoundarySectionEdge',.94,innerMat]]){const rim=mesh(mito,name,new THREE.TorusGeometry(r,.025,8,80),mat);rim.scale.set(1.38,.64,1);}
 // Open basal necks join these flattened invaginations to the inner boundary.
 function crista(x,index){
  const h=.68+.055*Math.sin(index*1.4),baseY=-.602*Math.sqrt(Math.max(.05,1-(x/1.297)**2-(.22/.526)**2))+.015,shape=new THREE.Shape();
  shape.moveTo(-.075,0);shape.bezierCurveTo(-.12,h*.55,-.115,h-.04,0,h);shape.bezierCurveTo(.115,h-.04,.12,h*.55,.075,0);
  shape.lineTo(.037,0);shape.bezierCurveTo(.079,h*.55,.075,h-.075,0,h-.065);shape.bezierCurveTo(-.075,h-.075,-.079,h*.55,-.037,0);shape.closePath();
  const geometry=new THREE.ExtrudeGeometry(shape,{depth:.26,bevelEnabled:true,bevelSegments:2,steps:1,bevelSize:.01,bevelThickness:.01,curveSegments:18});
  const fold=mesh(mito,'BroadLamellarCristaMembrane'+index,geometry,innerMat,V(x,baseY,-.27));fold.userData={teachingOnly:true,innerMembraneContinuity:true,openCristaJunction:true};
  for(const dx of[-.055,.055])rod(mito,'CristaJunctionWall'+index,V(x+dx,baseY-.04,-.22),V(x+dx,baseY+.035,-.22),.022,innerMat);
  return{x,y:baseY+h};
 }
 const tips=[-.88,-.45,0,.45,.88].map(crista);
 const synthases=[],catalyticLobes=new THREE.InstancedMesh(new THREE.SphereGeometry(.032,12,8),proteinMat,tips.length*12),lobeTransform=new THREE.Object3D();let lobeIndex=0;
 catalyticLobes.name='MatrixFacingATPSynthaseCatalyticLobes';catalyticLobes.userData={teachingOnly:true,pickThrough:true,matrixFacing:true};mito.add(catalyticLobes);
 for(let i=0;i<tips.length;i++){
  const tip=tips[i];
  for(const side of[-1,1]){
   const s=new THREE.Group();s.name='CristaRimATPSynthase_'+i+'_'+side;s.position.set(tip.x+side*.065,tip.y+.018,-.055);s.rotation.z=-side*.32;mito.add(s);
   const fo=mesh(s,'FoMembraneRotor',new THREE.CylinderGeometry(.045,.045,.065,12),proteinMat);fo.rotation.x=Math.PI/2;
   rod(s,'ATPSynthaseCentralStalk',V(0,0,0),V(side*.025,.12,.04),.015,proteinMat);
   const f1=new THREE.Group();f1.name='MatrixFacingF1CatalyticHead';f1.position.set(side*.025,.16,.04);s.add(f1);
   s.updateMatrix();for(let k=0;k<6;k++){const angle=k*Math.PI/3;lobeTransform.position.set(side*.025+Math.cos(angle)*.043,.16+Math.sin(angle)*.043,.04).applyMatrix4(s.matrix);lobeTransform.rotation.copy(s.rotation);lobeTransform.scale.set(1,1,.72);lobeTransform.updateMatrix();catalyticLobes.setMatrixAt(lobeIndex++,lobeTransform.matrix);}
   rod(s,'PeripheralStator',V(.04,0,0),V(.062,.14,.04),.009,proteinMat);
   const rotor=rod(s,'CentralRotorStateCue',V(0,.07,.04),V(.032,.13,.04),.011,gold);synthases.push({s,rotor});
  }
 }
 catalyticLobes.instanceMatrix.needsUpdate=true;
 // Respiratory complexes are role symbols, not asserted atomic fits.
 for(let i=0;i<4;i++){const pump=new THREE.Group();pump.name='RespiratoryProtonPumpRoleSymbol'+i;pump.position.set(-.68+i*.45,-.2,-.04);mito.add(pump);ball(pump,'MembraneProteinBody',.065,proteinMat,V(),V(.7,1.2,.7));ball(pump,'MatrixDomain',.085,proteinMat,V(.08,-.055,.035),V(1,.6,.6));}
 const protonCues=[];for(let i=0;i<3;i++){const cue=ball(mito,'ProtonReturnThroughSynthaseCue'+i,.025,gold);cue.userData.chemicalRoleSymbol=true;protonCues.push(cue);}
 const chemical=new THREE.Group();chemical.name='ATPRegenerationChemicalSymbolsNotTransportPath';chemical.position.set(-.46,1.65,.16);g.add(chemical);
 ball(chemical,'RegenerationAdenosineSymbol',.13,material(0xd8bd88),V(-.18,0,0),V(1,.7,.65));
 for(let i=0;i<2;i++)ball(chemical,'ADPPhosphateSymbol'+i,.065,gold,V(i*.15,0,0));
 rod(chemical,'ADPBond',V(0,0,0),V(.15,0,0),.017,gold);
 const incomingPi=ball(chemical,'InorganicPhosphateSymbol',.065,gold),formedBond=rod(chemical,'RegeneratedATPPhosphateBond',V(.15,0,0),V(.3,0,0),.017,gold);
 const track=new THREE.Group();track.name='ThirteenProtofilamentTeachingMicrotubule';track.userData={teachingOnly:true,hollowTrack:true,protofilamentCount:13,distinctAlphaBeta:true};g.add(track);
 const tubulinGeo=new THREE.SphereGeometry(.079,12,8),alphaMat=material(0xae934e),betaMat=material(0xc7ad6b),instances=[];
 for(const[part,mat]of[['AlphaTubulin',alphaMat],['BetaTubulin',betaMat]]){const o=new THREE.InstancedMesh(tubulinGeo,mat,13*25);o.name=part+'Lattice';o.userData={teachingOnly:true,pickThrough:true};track.add(o);instances.push(o);}
 const tmp=new THREE.Object3D();for(let j=0;j<13;j++)for(let i=0;i<50;i++){const angle=j/13*Math.PI*2;tmp.position.set(-3.8+i*.155,-1.2+Math.cos(angle)*.22,Math.sin(angle)*.22);tmp.scale.set(1,.83,.83);tmp.updateMatrix();instances[i%2].setMatrixAt(j*25+Math.floor(i/2),tmp.matrix);}instances.forEach(o=>o.instanceMatrix.needsUpdate=true);
 const motor=new THREE.Group();motor.name='ATPDrivenKinesinTeachingMotor';g.add(motor);
 const headMat=material(purple),headAMat=material(0x806092),headBMat=material(0x9b7ba3);
 function motorHead(name,mat){const head=new THREE.Group();head.name=name;motor.add(head);ball(head,name+'MotorDomain',.115,mat,V(),V(1.15,.78,.8));ball(head,name+'NucleotidePocket',.041,material(0x5c486d),V(.045,.068,.045),V(1,.55,1));rod(head,name+'MicrotubuleBindingFace',V(-.06,-.08,.005),V(.075,-.08,.005),.022,mat);return head;}
 const headA=motorHead('KinesinHeadA',headAMat),headB=motorHead('KinesinHeadB',headBMat);
 function flexibleLinker(name){const segments=[];for(let i=0;i<8;i++)segments.push(rod(motor,name+i,V(0,0,0),V(0,.1,0),.024,headMat));return segments;}
 const linkerA=flexibleLinker('KinesinNeckLinkerA'),linkerB=flexibleLinker('KinesinNeckLinkerB');
 const stalk=new THREE.Group();stalk.name='KinesinCoiledCoilCargoCouplingStalk';motor.add(stalk);
 for(let side=0;side<2;side++){const points=[];for(let i=0;i<=24;i++){const t=i/24,angle=t*Math.PI*6+side*Math.PI;points.push(V(Math.cos(angle)*.026,-.34+t*.91,Math.sin(angle)*.026));}tube(stalk,'CoiledCoilStrand'+side,points,.017,headMat);}
 const vesicle=cavity(motor,'MotorCoupledCargoVesicle',V(0,1.05,0),.60,blue),cargo=chain(vesicle,'MotorCarriedLuminalCargo',amber,.20);cargo.position.set(.05,.03,.05);
 const innerRim=mesh(vesicle,'CargoVesicleInnerLeafletSection',new THREE.TorusGeometry(.558,.013,7,64),material(0xa8bdbe));innerRim.position.z=.01;
 for(let i=0;i<12;i++){const angle=i/12*Math.PI*2;rod(vesicle,'VesicleBilayerSectionLipid'+i,V(Math.cos(angle)*.56,Math.sin(angle)*.56,.02),V(Math.cos(angle)*.595,Math.sin(angle)*.595,.02),.009,material(0x557c87));}
 const adaptor=new THREE.Group();adaptor.name='CargoMembraneAdaptorRoleSymbol';adaptor.position.set(0,.49,.045);motor.add(adaptor);ball(adaptor,'MembraneInsertedAdaptor',.062,proteinMat,V(),V(1.3,.55,.85));rod(adaptor,'CytoplasmicMotorBindingDomain',V(0,0,0),V(0,-.12,0),.023,proteinMat);
 // Chemistry is attached to the selected bound head, never to the cargo.
 const nucleotide=new THREE.Group();nucleotide.name='LocalATP_ADP_PiReactionSymbols';motor.add(nucleotide);
 ball(nucleotide,'MotorAdenosineSymbol',.075,material(0xd8bd88),V(-.12,0,0),V(1,.7,.65));
 const phosphate=[];for(let i=0;i<3;i++)phosphate.push(ball(nucleotide,'PhosphateSymbol'+i,.041,gold,V(i*.085,0,0)));
 rod(nucleotide,'NucleotideBond01',V(0,0,0),V(.085,0,0),.012,gold);const bond=rod(nucleotide,'TerminalPhosphateBond',V(.085,0,0),V(.17,0,0),.012,gold);
 const bindingCue=mesh(motor,'AnchoredHeadBindingContactCue',new THREE.TorusGeometry(.10,.012,6,32),material(0x59765c));bindingCue.rotation.x=Math.PI/2;
 const a=V(),b=V();
 function positionLinker(segments,head,side){for(let i=0;i<segments.length;i++){const t=i/segments.length,n=(i+1)/segments.length;a.set(THREE.MathUtils.lerp(head.position.x,0,t)+Math.sin(t*Math.PI)*side*.045,THREE.MathUtils.lerp(head.position.y+.06,-.34,t),THREE.MathUtils.lerp(head.position.z,0,t)+Math.sin(t*Math.PI)*.045);b.set(THREE.MathUtils.lerp(head.position.x,0,n)+Math.sin(n*Math.PI)*side*.045,THREE.MathUtils.lerp(head.position.y+.06,-.34,n),THREE.MathUtils.lerp(head.position.z,0,n)+Math.sin(n*Math.PI)*.045);connect(segments[i],a,b);}}
 let currentStep=0,currentPhase=0,anchoredHead='B',motionState={title:'内膜建立质子驱动力',description:'呼吸链与 ATP 合酶位于内膜；小金点只提示质子返回方向。'};
 function update(p){
  const step=Math.min(4,Math.floor(p*5)),u=clamp(p*5-step,0,1);currentStep=step;
  motor.visible=step>0;chemical.visible=step===0;
  // The anatomical closeup becomes an upper-left locator for motor stages.
  // This teaching layout change prevents it hiding the connected cargo/motor.
  mito.position.set(step===0?-2.55:-3.2,step===0?1.05:1.6,-.25);mito.scale.setScalar(step===0?1:.43);
  const phase=ease(u);incomingPi.position.set(.63-.33*phase,-.21*(1-phase),0);formedBond.visible=u>.72;
  synthases.forEach(({rotor},i)=>rotor.rotation.y=u*Math.PI*8+i*.11);
  protonCues.forEach((cue,i)=>{const t=(u*2.1+i/3)%1,tip=tips[2];cue.visible=step===0;cue.position.set(tip.x+.065,tip.y-.075+t*.26,-.035);});
  // Only the trailing head moves during each interval; its partner is fixed.
  const count=step<2?0:step===2?u*2:step===3?2+u*10:12,n=Math.min(11,Math.floor(count)),raw=count>=12?1:count-n,swing=ease((raw-.18)/.64),spacing=.31;
  const aStart=n%2===0?n:n+1,bStart=n%2===0?n+1:n;
  let ax=aStart*spacing,bx=bStart*spacing;const movingA=n%2===0;if(movingA)ax+=2*spacing*swing;else bx+=2*spacing*swing;
  const centre=(ax+bx)/2,start=-1.83,lift=Math.sin(swing*Math.PI)*.21;motor.position.set(start+centre,0,0);
  headA.position.set(ax-centre,-.86+(movingA?lift:0),.055+(movingA?Math.sin(swing*Math.PI)*.10:0));headB.position.set(bx-centre,-.86+(!movingA?lift:0),.055+(!movingA?Math.sin(swing*Math.PI)*.10:0));
  headA.rotation.z=movingA?-.18*Math.sin(swing*Math.PI):0;headB.rotation.z=!movingA?-.18*Math.sin(swing*Math.PI):0;
  headA.userData.bound=!(movingA&&raw>.18&&raw<.82);headB.userData.bound=!(!movingA&&raw>.18&&raw<.82);anchoredHead=movingA?'B':'A';currentPhase=raw;
  positionLinker(linkerA,headA,-1);positionLinker(linkerB,headB,1);
  const flex=(step===2||step===3)?-.035*Math.sin(raw*Math.PI):0;stalk.rotation.z=flex;vesicle.position.x=-Math.sin(flex)*.91;adaptor.position.x=-Math.sin(flex)*.91;
  const fixed=movingA?headB:headA;nucleotide.position.set(fixed.position.x-.18,fixed.position.y+.26,.24);nucleotide.visible=step===2||step===3;
  const hydrolysed=raw>.70;bond.visible=!hydrolysed;phosphate[2].position.set(.17+(hydrolysed?.09*ease((raw-.7)/.3):0),hydrolysed?-.08*ease((raw-.7)/.3):0,0);
  bindingCue.visible=step===2||step===3;bindingCue.position.set(fixed.position.x,-.974,.055);
  if(step===0)motionState=u<.3?{title:'先看清两层膜与嵴',description:'外膜包围线粒体，内膜向内折成嵴；嵴腔与膜间隙相通。'}:u<.72?{title:'质子经 ATP 合酶返回基质侧',description:'绿色头部朝向基质；金点是流向提示，旋转是功能放大的示意。'}:{title:'ADP＋Pi → ATP',description:'ATP 合成需要质子驱动力；化学符号在此配对，并非一列供运输的货物。'};
  else if(step===1)motionState={title:'把轨道、头部与载体连起来',description:'两个马达头结合微管外表面，颈连接共同柄部，尾部经膜接头连接载体。'};
  else if(step===2||step===3)motionState=raw<.18?{title:'前头结合，等待换步',description:'绿色接触圈标出保持结合的头；另一头仍在后方，局部金色符号表示核苷酸状态。'}:raw<.82?{title:(movingA?'深紫头':'浅紫头')+'越过固定的另一头',description:'前方头保持在同一轨道位点，后头解离并前摆；柔性的颈连接随构象改变。'}:{title:'摆动头重新结合，交替下一步',description:'两头重新形成前后位置；化学产物释放与构象循环耦联，载体随共同柄部前移。'};
  else motionState={title:'同一载体完成这段位移',description:'轨道没有输送腔内货物；ATP、马达、微管和膜载体分别承担供能、运动、导向与包裹。'};
 }
 focus('mitochondrion',()=>mito.getWorldPosition(V()));focus('motor',()=>motor.getWorldPosition(V()).add(V(0,.1,0)));
 const p=()=>getProgress(),step=()=>Math.min(4,Math.floor(p()*5));
 label('mitochondrion','线粒体：双膜与内膜嵴','橙色外膜、浅色内膜和两层切缘可分辨；嵴是内膜连续折叠，不是游离细管。',()=>mito.localToWorld(V(-.9,.25,.04)),'#ae7d55');
 label('crista-synthase','ATP 合酶朝向基质','绿色成对的催化头朝基质侧；嵴腔与膜间隙相通。这里只放大代表性构造，未按原子尺度绘制。',()=>mito.localToWorld(V(0,.52,.08)),'#628c7e',()=>step()===0);
 label('nucleotide-symbol','ATP / ADP＋Pi 化学符号','金色磷酸相连表示 ATP，末端分开提示水解产物；化学状态的节拍是教学化处理。',()=>step()===0?chemical.getWorldPosition(V()):nucleotide.getWorldPosition(V()),'#aa8037',()=>step()===0||step()===2||step()===3);
 label('motor','双头 kinesin：交替换步','深紫与浅紫区分两个头；一步中一头保持轨道位点，后头前摆越过它，随后交换角色。',()=>motor.localToWorld(V(0,-.5,.28)),'#876497',()=>step()>0);
 label('microtubule','α/β 微管蛋白组成的轨道','双色重复表示 α/β 微管蛋白；13 条原纤维围成中空壁。头部沿外表面的结合位点前进。',V(2.85,-1.12,.25),'#a1894b');
 label('transport-cargo','膜接头连接马达与载体','绿色接头跨在载体膜处，胞质端连接马达；橙色货物留在膜腔内，随载体整体移动。',()=>vesicle.localToWorld(V(.1,.2,.4)),'#688e9c',()=>step()>0);
 update(0);
 return{update,motion:()=>motionState,diagnostics:()=>({anatomy:['outer-membrane','inner-boundary-membrane','connected-lamellar-cristae','matrix-facing-ATP-synthase','13-protofilament-alpha-beta-track','double-head-motor','membrane-cargo-adaptor'],headOverHead:true,anchor:anchoredHead,cyclePhase:currentPhase,stage:currentStep,contextualMitochondrion:currentStep>0,chemicalStateIsTeachingSymbol:true,stepNotToPhysicalScale:true,noATPConduit:true})};
}
