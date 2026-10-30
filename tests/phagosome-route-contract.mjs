import test from 'node:test';
import assert from 'node:assert/strict';
import {createContinuousPhagocyticRoute,A_ROUTE_EVENT} from '../src/a-continuous-route.js';

const positions=route=>[route.preGeometry,route.vesicleGeometry,route.motherGeometry].map(g=>g.attributes.position.array.slice());
const versions=route=>[route.preGeometry,route.vesicleGeometry,route.motherGeometry].map(g=>[g.attributes.position.version,g.attributes.normal.version]);
const dispose=route=>[route.preGeometry,route.vesicleGeometry,route.motherGeometry].forEach(g=>g.dispose());

for(const detail of [false,true]){
 test(`closed phagosome transport preserves its membrane buffers (detail=${detail})`,()=>{
  const route=createContinuousPhagocyticRoute({detail});
  try{
   route.update(A_ROUTE_EVENT);const before=positions(route),revision=versions(route),count=route.geometryUpdates,start=route.state.transport.clone();
   for(const p of [.63,.68,.70,.79,.82,.90,.98,1]){
    route.update(p);assert.equal(route.state.scission,true);assert.deepEqual(positions(route),before);assert.deepEqual(versions(route),revision);assert.equal(route.geometryUpdates,count);
   }
   assert.ok(route.state.transport.distanceTo(start)>.5,'Transport must continue while closed membrane shape stays unchanged');
  }finally{dispose(route);}
 });
 test(`approach moves cargo and reverse seeking restores cup shape (detail=${detail})`,()=>{
  const route=createContinuousPhagocyticRoute({detail});
  try{
   route.update(.01);const before=positions(route),revision=versions(route),cargo=route.state.particleCenter.clone();route.update(.07);
   assert.deepEqual(positions(route),before);assert.deepEqual(versions(route),revision);assert.ok(route.state.particleCenter.distanceTo(cargo)>.1);
   route.update(.51);const cup=route.preGeometry.attributes.position.array.slice(),theta=route.state.theta;
   route.update(.90);route.update(.51);assert.equal(route.state.scission,false);assert.equal(route.state.theta,theta);assert.deepEqual(route.preGeometry.attributes.position.array,cup);
   for(const g of [route.preGeometry,route.vesicleGeometry,route.motherGeometry])assert.ok(g.attributes.position.array.every(Number.isFinite));
  }finally{dispose(route);}
 });
}
