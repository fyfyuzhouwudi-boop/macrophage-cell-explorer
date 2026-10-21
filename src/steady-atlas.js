import * as THREE from "three";
export const STEADY_TOPICS = [
 {name:"合成与分选",at:0,desc:"核糖体合成蛋白，内质网完成折叠与早期加工，高尔基体继续加工和分选；运输载体连接各区室。",links:[["er","golgi"],["golgi","membrane"]],color:0x81a6b9},
 {name:"能量与运输",at:0.4,desc:"线粒体提供ATP；骨架和马达支持载体定位与运输。能量供应和细胞骨架协作，不表示ATP通过一根专门管道输送。",links:[["mitochondria","cytoskeleton"],["cytoskeleton","golgi"]],color:0xd3a15b},
 {name:"回收与降解",at:0.78,desc:"细胞膜和内体参与摄取物分选及回收，部分组分进入溶酶体降解。返回细胞膜与送往降解是不同分支。",links:[["membrane","endosome"],["endosome","membrane"],["endosome","lysosome"]],color:0x9f8db3}
];
export const STEADY_GUIDE = {
 summary:"细胞器通过加工、分选、运输和能量供应共同维持日常活动。连线仅表示功能协作，不是膜连续管道，也不是实测分子轨迹。",
 steps:STEADY_TOPICS.map(t=>({title:t.name,desc:t.desc})),
 notes:["胞质颗粒的局部扰动与沿微管移动的主动运输分别展示；尺寸与速度为教学设置。","核周隙与ER腔相通；核孔中央连接核质与胞质，是另一条通路。","ER和高尔基体各自围成膜腔，运输载体跨越的是胞质空间。","颗粒数量、尺寸、速度和颜色服务于科普展示，不表示实测浓度或代谢通量。","闭合小载体只在已分开的胞质安全短段显示，两端缩隐后重置，不穿过完整细胞器膜；该代表段不与器官中心线相连，交接过程省略。腔内粗肽链为示意；能量方向符号不是ATP运输管道。"],
 sources:[{title:"Alberts 等｜The Endoplasmic Reticulum",url:"https://www.ncbi.nlm.nih.gov/books/NBK26841/"},{title:"OpenStax｜The Endomembrane System and Proteins",url:"https://openstax.org/books/biology-2e/pages/4-4-the-endomembrane-system-and-proteins"},{title:"Alberts 等｜Mitochondria",url:"https://www.ncbi.nlm.nih.gov/books/NBK26894/"}]
};
export function createSteadyAtlas({whole}) {
 const group=new THREE.Group();group.name="SteadyFunctionalRelations";group.userData={teachingOnly:true,relationshipOverlay:true};
 const sets=[],point=new THREE.Vector3(),tangent=new THREE.Vector3(),normal=new THREE.Vector3(),quat=new THREE.Quaternion(),matrix=new THREE.Matrix4(),unit=new THREE.Vector3(1,1,1),carrierScale=new THREE.Vector3(),zero=new THREE.Vector3(),up=new THREE.Vector3(0,1,0);let canShow=()=>true,selected=0;
 const cargoCurve=new THREE.CatmullRomCurve3([new THREE.Vector3(-.035,0,0),new THREE.Vector3(-.012,.018,.006),new THREE.Vector3(.012,-.014,-.007),new THREE.Vector3(.035,.006,0)]);
 const payloadGeo=new THREE.TubeGeometry(cargoCurve,12,.008,5),vesicleGeo=new THREE.SphereGeometry(.075,14,10),arrowGeo=new THREE.ConeGeometry(.04,.12,6);
 function anchor(id){return whole.organelleLocations.get(id)?.position.clone()??new THREE.Vector3();}
 const tracks=whole.components?.microtubuleTracks??[];
 const track=tracks[0]??null;
 function foregroundSegment(index,i){const y=(-.7+i*.58)*(index===2?-1:1),z=3.04+i*.035;return new THREE.CatmullRomCurve3([new THREE.Vector3(-1.35,y,z),new THREE.Vector3(-.45,y+.11,z+.035),new THREE.Vector3(.45,y-.08,z+.025),new THREE.Vector3(1.35,y,z)],false,"catmullrom",.5);}
 function transportPhase(t,i,j=0){return((t*.065+j*.5+i*.17)%1+1)%1;}
 function transportEnvelope(u){return THREE.MathUtils.smoothstep(u,0,.12)*(1-THREE.MathUtils.smoothstep(u,.88,1));}
 function transportPose(s,i,u,out){const route=s.transportCurves[i];if(!route)return false;const routeT=s.index===1?.8+.14*u:u;out.copy(route.getPoint(routeT));tangent.copy(route.getTangent(routeT)).normalize();if(s.index===1){normal.crossVectors(tangent,up);if(normal.lengthSq()<1e-8)normal.set(0,0,1);normal.normalize();out.addScaledVector(normal,-.15);}return true;}
 for(const[index,topic]of STEADY_TOPICS.entries()){
  const layer=new THREE.Group();layer.name="SteadyTopic_"+index;group.add(layer);const positions=[],curves=[];
  for(const[a,b]of topic.links){const start=anchor(a),end=anchor(b),mid=start.clone().lerp(end,.5);mid.z=Math.min(2.3,Math.max(start.z,end.z)+.5);mid.x+=.35;const curve=new THREE.CatmullRomCurve3([start,mid,end]);curves.push(curve);for(let i=0;i<44;i++)positions.push(...curve.getPoint(i/44).toArray(),...curve.getPoint((i+1)/44).toArray());}
  const geo=new THREE.BufferGeometry();geo.setAttribute("position",new THREE.Float32BufferAttribute(positions,3));const materials=topic.links.map((_,i)=>{geo.addGroup(i*88,88,i);return new THREE.LineBasicMaterial({color:topic.color,transparent:true,opacity:.2,depthWrite:false});});
  const line=new THREE.LineSegments(geo,materials);line.name="FunctionalRelationshipLines";line.userData.pickThrough=true;layer.add(line);
  const arrows=new THREE.InstancedMesh(arrowGeo,new THREE.MeshBasicMaterial({color:topic.color,transparent:true,opacity:.6,depthWrite:false}),curves.length*2);arrows.name="RelationshipDirectionMarkers";arrows.userData.pickThrough=true;layer.add(arrows);
  const vesicles=new THREE.InstancedMesh(vesicleGeo,new THREE.MeshStandardMaterial({color:topic.color,transparent:true,opacity:.28,roughness:.48,depthWrite:false}),curves.length*2);vesicles.name="SteadyClosedTransportVesicles";vesicles.userData={pickThrough:true,transportVesicle:true,teachingOnly:true};layer.add(vesicles);
  const payload=new THREE.InstancedMesh(payloadGeo,new THREE.MeshStandardMaterial({color:topic.color,roughness:.68}),curves.length*2);payload.name="SteadyVesicleContainedGenericCargo";payload.userData={pickThrough:true,transportVesicle:true,teachingOnly:true};layer.add(payload);
  const transportCurves=curves.map((c,i)=>index===1?(i===1&&track?new THREE.CatmullRomCurve3(track.map(p=>p.clone()),false,"catmullrom",.5):null):foregroundSegment(index,i));
  vesicles.userData.transportSegments=transportCurves.map(route=>route?{points:route.points.map(p=>p.toArray()),curveType:"catmullrom",tension:.5,parameterRange:index===1?[.8,.94]:[0,1],maximumOffset:index===1?.15:0,carrierRadius:.075,reset:"smooth size envelope reaches zero before cycle restart; fixed-opacity material"}:null);
  sets.push({index,layer,curves,line,materials,arrows,vesicles,payload,allowed:topic.links.map(()=>true),transportCurves});
 }
 function setTopic(i){selected=Math.max(0,Math.min(2,Number(i)||0));sets.forEach((s,index)=>s.layer.visible=index===selected);}
 function setVisibilityFilter(fn){canShow=typeof fn==='function'?fn:()=>true;for(const s of sets){s.allowed=STEADY_TOPICS[s.index].links.map(([a,b])=>canShow(a)&&canShow(b));s.materials.forEach((m,i)=>m.visible=s.allowed[i]);s.line.visible=s.allowed.some(Boolean);s.arrows.visible=s.allowed.some(Boolean);s.vesicles.visible=s.payload.visible=canShow('transport-vesicles')&&s.allowed.some(Boolean)&&(s.index!==1||canShow('microtubules'));}}
 function update(t){for(const s of sets){if(!s.layer.visible)continue;for(let i=0;i<s.curves.length;i++)for(let j=0;j<2;j++){
  const at=i*2+j,u=transportPhase(t,i,j);point.copy(s.curves[i].getPoint(u));tangent.copy(s.curves[i].getTangent(u)).normalize();quat.setFromUnitVectors(up,tangent);matrix.compose(point,quat,s.allowed[i]?unit:zero);s.arrows.setMatrixAt(at,matrix);
  const show=Boolean(s.transportCurves[i]&&s.allowed[i]&&canShow('transport-vesicles')&&(s.index!==1||canShow('microtubules'))),weight=show?transportEnvelope(u):0;
  if(transportPose(s,i,u,point))quat.setFromUnitVectors(up,tangent);
  carrierScale.setScalar(weight);matrix.compose(point,quat,carrierScale);s.vesicles.setMatrixAt(at,matrix);s.payload.setMatrixAt(at,matrix);
 }s.arrows.instanceMatrix.needsUpdate=s.vesicles.instanceMatrix.needsUpdate=s.payload.instanceMatrix.needsUpdate=true;s.arrows.computeBoundingSphere();s.vesicles.computeBoundingSphere();s.payload.computeBoundingSphere();}}
 function dispose(){const geos=new Set(),mats=new Set();group.traverse(o=>{if(o.geometry)geos.add(o.geometry);for(const m of Array.isArray(o.material)?o.material:[o.material])if(m)mats.add(m);});for(const g of geos)g.dispose();for(const m of mats)m.dispose();group.clear();}
 function activityFocus(t=0){const s=sets[selected];if(!canShow("transport-vesicles")||!canShow("collaboration")||(selected===1&&!canShow("microtubules")))return null;for(let i=0;i<s.transportCurves.length;i++){if(!s.transportCurves[i]||!s.allowed[i])continue;for(let j=0;j<2;j++){const u=transportPhase(t,i,j);if(transportEnvelope(u)<=.05)continue;const p=new THREE.Vector3();if(transportPose(s,i,u,p))return p;}}return null;}
 setTopic(0);setVisibilityFilter();update(0);return{group,setTopic,setVisibilityFilter,update,dispose,activityFocus,get selected(){return selected;},diagnostics(){return{topic:selected,clock:"Independent ambient clock",activeRelations:sets[selected].allowed,normalActivity:sets[selected].index===1?"A representative vesicle moves outside an existing microtubule centerline; ATP arrows are energy-support symbols":"Closed representative carrier vesicles contain generic polypeptide traces; budding, docking and fusion details are omitted",transportVesiclesVisible:canShow('transport-vesicles')&&canShow('collaboration')&&(selected!==1||canShow('microtubules'))&&sets[selected].allowed.some((allowed,i)=>allowed&&sets[selected].transportCurves[i])};},stats:{type:"Functional relationships with representative normal-activity carriers; not measured routes",topics:3,maxVisibleDrawCalls:6}};
}
