import * as THREE from 'three';
const V=(x=0,y=0,z=0)=>new THREE.Vector3(x,y,z),TAU=Math.PI*2;
const cl=x=>THREE.MathUtils.clamp(x,0,1),sm=x=>{x=cl(x);return x*x*(3-2*x);};
const cubic=(a,b,c,d,t)=>(1-t)**3*a+3*(1-t)**2*t*b+3*(1-t)*t*t*c+t**3*d;
export const A_ROUTE_EVENT=.62;
export function createContinuousPhagocyticRoute({detail=true}={}){
  // One lipid bilayer, with two finite material interfaces. Thickness is
  // deliberately exaggerated at this teaching scale; it is not two membranes.
  const radius=1.105,halfThickness=.018,corner=.022,splitShift=.052,cols=detail?36:24;
  const nc=detail?24:16,nl=detail?8:6,nt=4,nf=detail?8:6,nb=detail?10:8,ncap=detail?4:3;
  const finalTheta=Math.PI-Math.asin(.12/radius),cutRow=nc+nl+nt/2;
  const state={progress:0,phase:'open_connected',theta:.22,neckRadius:0,neckInnerRadius:0,scission:false,splitShift,particleCenter:V(),transport:V(),cupCenter:V(),cutZ:0,membraneThickness:halfThickness*2};
  let mid=[],preNormals=[],vesMid=[],motherMid=[];
  function makeMid(p){
    const wrap=sm((p-.08)/.38),close=sm((p-.46)/.16),theta=THREE.MathUtils.lerp(.22,2.58,wrap)+(finalTheta-2.58)*close;
    const lift=.26*Math.sin(Math.PI*sm((p-.08)/.54))+.025*sm((p-.46)/.16),cz=radius*Math.cos(theta)+lift;
    const rj=radius*Math.sin(theta),zj=cz-radius*Math.cos(theta),over=sm((theta-Math.PI*.5)/(finalTheta-Math.PI*.5)),rn=rj*(1-.5*over);
    const zn=theta<=Math.PI*.5?zj+.045:Math.max(zj+.045,cz+Math.sqrt(Math.max(0,radius*radius-rn*rn))+.025*over),pts=[];
    for(let i=0;i<=nc;i++){const t=theta*i/nc;pts.push({r:radius*Math.sin(t),z:cz-radius*Math.cos(t),part:'cup'});}
    const tangentR=Math.cos(theta),tangentZ=Math.sin(theta),L=theta<Math.PI*.5?.13:Math.min(.35,(rj-rn)/Math.max(.05,-tangentR)*.65+.015),p1r=rj+L*tangentR,p1z=Math.min(zj+L*tangentZ,zn-.018);
    for(let i=1;i<=nl;i++){const t=i/nl;pts.push({r:cubic(rj,p1r,rn,rn,t),z:cubic(zj,p1z,zn-.012,zn,t),part:'neck-lower'});}
    for(let i=1;i<=nt;i++)pts.push({r:rn,z:zn+.055*i/nt,part:'neck-throat'});
    const ztop=zn+.055,shoulderZ=ztop+.08;
    for(let i=1;i<=nf;i++){const t=i/nf;pts.push({r:cubic(rn,rn,radius+.20,radius+.42,t),z:cubic(ztop,ztop+.055,shoulderZ,shoulderZ,t),part:'neck-upper'});}
    for(let i=1;i<=nb;i++){const t=i/nb;pts.push({r:radius+.42+(1.95-radius-.42)*t,z:shoulderZ*(1-(6*t**5-15*t**4+10*t**3))-.06*t*t,part:'background'});}
    state.theta=theta;state.neckRadius=rn;state.neckInnerRadius=rn-halfThickness;state.cupCenter.set(0,0,cz);state.cutZ=zn+.0275;return pts;
  }
  function meridianNormals(points,firstSign=-1,lastSign=null){return points.map((q,i)=>{
    if(i===0&&q.r<1e-8)return {nr:0,nz:firstSign};if(i===points.length-1&&q.r<1e-8)return {nr:0,nz:lastSign??1};
    const lo=points[Math.max(0,i-1)],hi=points[Math.min(points.length-1,i+1)],dr=hi.r-lo.r,dz=hi.z-lo.z,l=Math.hypot(dr,dz);if(l<1e-10)throw new Error('Collapsed meridian segment');return {nr:dz/l,nz:-dr/l};
  });}
  function createWall(points,closedEnd,name){
    const normal=meridianNormals(points),positions=[],indices=[],boundaryRanges=[];
    let starts=[];
    for(let layer=0;layer<2;layer++){
      const base=positions.length/3,off=layer===0?halfThickness:-halfThickness,records=[];
      for(let i=0;i<points.length;i++){
        const q=points[i],n=normal[i],r=q.r+n.nr*off,z=q.z+n.nz*off,start=positions.length/3;
        if(q.r<1e-8){positions.push(0,0,z);records.push({start,count:1});}
        else{for(let j=0;j<cols;j++){const a=j/cols*TAU;positions.push(r*Math.cos(a),r*Math.sin(a),z);}records.push({start,count:cols});}
      }
      starts.push(records);const begin=indices.length;
      const tri=(a,b,c)=>layer?indices.push(a,c,b):indices.push(a,b,c);
      for(let i=0;i<records.length-1;i++){const a=records[i],b=records[i+1];
        for(let j=0;j<cols;j++){const next=(j+1)%cols;if(a.count===1)tri(a.start,b.start+next,b.start+j);else if(b.count===1)tri(a.start+j,a.start+next,b.start);else{tri(a.start+j,a.start+next,b.start+j);tri(a.start+next,b.start+next,b.start+j);}}
      }
      boundaryRanges.push({layer,startIndex:begin,endIndex:indices.length,startVertex:base,endVertex:positions.length/3});
    }
    const artificialStart=indices.length;
    if(!closedEnd){const a=starts[0].at(-1),b=starts[1].at(-1);for(let j=0;j<cols;j++){const k=(j+1)%cols;indices.push(a.start+j,a.start+k,b.start+j,a.start+k,b.start+k,b.start+j);}}
    const g=new THREE.BufferGeometry();g.setAttribute('position',new THREE.Float32BufferAttribute(positions,3));g.setIndex(indices);g.computeVertexNormals();g.computeBoundingSphere();
    g.userData={role:name,thickness:halfThickness*2,cols,meridianRows:points.length,boundaryRanges,artificialPerimeter:!closedEnd,boundaryRole:closedEnd?'closed-phagosome-two-material-interfaces':'finite-teaching-patch-artificial-perimeter-not-biological-seal',artificialPerimeterIndexRange:[artificialStart,indices.length],ringStarts:starts};return g;
  }
  function updateWall(g,points,translationZ=0){
    const normals=meridianNormals(points),a=g.attributes.position,records=g.userData.ringStarts;
    for(let layer=0;layer<2;layer++){const off=layer===0?halfThickness:-halfThickness;
      for(let i=0;i<points.length;i++){const q=points[i],n=normals[i],r=q.r+n.nr*off,z=q.z+n.nz*off+translationZ,row=records[layer][i];if(row.count===1)a.setXYZ(row.start,0,0,z);else for(let j=0;j<cols;j++){const angle=j/cols*TAU;a.setXYZ(row.start+j,r*Math.cos(angle),r*Math.sin(angle),z);}}
    }
    a.needsUpdate=true;g.computeVertexNormals();g.computeBoundingSphere();
  }
  function postProfiles(points){
    const cut=points[cutRow],low=points.slice(0,cutRow+1).map(q=>({...q})),up=[];
    for(let i=1;i<=ncap;i++){const a=i/ncap*Math.PI*.5;low.push({r:cut.r-corner+corner*Math.cos(a),z:cut.z+corner*Math.sin(a),part:'scission-vesicle-cap'});}
    for(let i=1;i<=ncap;i++)low.push({r:(cut.r-corner)*(1-i/ncap),z:cut.z+corner,part:'scission-vesicle-cap'});
    for(let i=0;i<=ncap;i++)up.push({r:(cut.r-corner)*i/ncap,z:cut.z-corner,part:'scission-mother-cap'});
    for(let i=1;i<=ncap;i++){const a=i/ncap*Math.PI*.5;up.push({r:cut.r-corner+corner*Math.sin(a),z:cut.z-corner*Math.cos(a),part:'scission-mother-cap'});}
    up.push(...points.slice(cutRow+1).map(q=>({...q})));return {low,up};
  }
  mid=makeMid(A_ROUTE_EVENT);const post=postProfiles(mid);vesMid=post.low;motherMid=post.up;
  const preGeometry=createWall(mid,false,'continuous-connected-cup-neck-background'),vesicleGeometry=createWall(vesMid,true,'post-scission-closed-phagosome'),motherGeometry=createWall(motherMid,false,'post-scission-sealed-mother-patch');
  let preMeshes=null;
  function update(p){
    p=cl(p);state.progress=p;state.scission=p>=A_ROUTE_EVENT;state.phase=p<.08?'contact_on_connected_membrane':p<.46?'open_connected_cup_growth':p<A_ROUTE_EVENT?'open_connected_neck_constriction':'closed_phagosome_transport';
    mid=makeMid(Math.min(p,A_ROUTE_EVENT));preNormals=meridianNormals(mid);
    updateWall(preGeometry,mid);
    if(state.scission){const q=postProfiles(mid);vesMid=q.low;motherMid=q.up;state.transport.set(-.27*sm((p-.62)/.18),-.10*sm((p-.62)/.18),-splitShift-.55*sm((p-.62)/.18));updateWall(vesicleGeometry,vesMid);updateWall(motherGeometry,motherMid);}
    else{state.transport.set(0,0,0);}
    state.particleCenter.copy(state.cupCenter).add(state.transport);state.particleCenter.z+=.28*(1-sm(p/.08));
    return state;
  }
  // Exact barycentric interpolation of the current rendered mid-interface:
  // average paired lipid-side vertices, not an analytic off-mesh point.
  function sampleMembrane(row,phi){
    const g=preGeometry,records=g.userData.ringStarts,positions=g.attributes.position,r=THREE.MathUtils.clamp(row,0,mid.length-1-1e-9),i=Math.floor(r),u=r-i,f=((phi/TAU)%1+1)%1*cols,j=Math.floor(f),v=f-j,k=(j+1)%cols;
    const vertex=(row,col)=>{const a=records[0][row],b=records[1][row],ia=a.start+(a.count===1?0:col),ib=b.start+(b.count===1?0:col);return V().fromBufferAttribute(positions,ia).add(V().fromBufferAttribute(positions,ib)).multiplyScalar(.5);};
    const a=vertex(i,j),b=vertex(i,k),c=vertex(i+1,j),d=vertex(i+1,k);let point,normal;
    if(u+v<=1){point=a.clone().addScaledVector(c.clone().sub(a),u).addScaledVector(b.clone().sub(a),v);normal=b.clone().sub(a).cross(c.clone().sub(a)).normalize();}
    else{point=d.clone().addScaledVector(b.clone().sub(d),1-u).addScaledVector(c.clone().sub(d),1-v);normal=d.clone().sub(b).cross(c.clone().sub(b)).normalize();}
    if(normal.lengthSq()<.5){const n=preNormals[i];normal=V(n.nr*Math.cos(phi),n.nr*Math.sin(phi),n.nz);}
    return {point,normal,row:r,phi};
  }
  function sampleCup(theta,phi){const r=radius,point=V(r*Math.sin(theta)*Math.cos(phi),r*Math.sin(theta)*Math.sin(phi),state.cupCenter.z-r*Math.cos(theta)).add(state.transport),normal=V(Math.sin(theta)*Math.cos(phi),Math.sin(theta)*Math.sin(phi),-Math.cos(theta));return {point,normal};}
  update(0);
  return {getMeridian:()=>({mid:mid.map(p=>({...p})),vesicle:vesMid.map(p=>({...p})),mother:motherMid.map(p=>({...p}))}),preGeometry,vesicleGeometry,motherGeometry,update,sampleMembrane,sampleCup,state,radius,nc,cutRow,cols,totalRows:mid.length-1,event:A_ROUTE_EVENT,metadata:{teachingOnly:true,independentLocalMembrane:true,notWholeMembraneRemeshing:true,sharedIndexedOpenCup:true,scissionModel:'Instantaneous finite-neck topology change; molecular scission machinery and fluid mechanics are not simulated',outerPerimeterRole:'Artificial crop closure of a finite membrane patch',maxCargoReceptorScissionJump:splitShift,capCorner:corner,sourceEvidence:['https://pubmed.ncbi.nlm.nih.gov/24914558/','https://pubmed.ncbi.nlm.nih.gov/8760816/','https://pmc.ncbi.nlm.nih.gov/articles/PMC2984174/']}};
}
