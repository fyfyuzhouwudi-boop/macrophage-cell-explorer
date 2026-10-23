import test from 'node:test';
import assert from 'node:assert/strict';
import * as THREE from 'three';
import { createFusionLab, FUSION_IDS } from '../src/fusion-lab.js';

// CPU-only public behavior checks. Run: node --test qa/fusion-model-contract.mjs
// This file can also live in tests/ without changing its source import.
function visible(object) {
  for (let node = object; node; node = node.parent) if (!node.visible) return false;
  return true;
}

function membraneSurfaces(model) {
  const surfaces = [];
  model.group.updateMatrixWorld(true);
  model.group.traverse(object => {
    if (object.isMesh && object.name.endsWith('ContinuousSurface') && visible(object)) surfaces.push(object);
  });
  assert.ok(surfaces.length >= 2, 'the active state must expose actual leaflet surfaces');
  return surfaces;
}

function crossings(model, origin, direction) {
  const ray = new THREE.Raycaster(origin, direction.clone().normalize());
  const distances = ray.intersectObjects(membraneSurfaces(model), false).map(hit => hit.distance).sort((a, b) => a - b);
  // Adjacent triangles can report the same geometric crossing along a grid edge.
  return distances.filter((distance, index) => index === 0 || distance - distances[index - 1] > 1e-4);
}

function poseSnapshot(model) {
  const pose = [];
  model.group.updateMatrixWorld(true);
  model.group.traverse(object => {
    if (!object.isMesh || !visible(object)) return;
    pose.push({
      name: object.name,
      visible: object.visible,
      matrix: object.matrix.toArray(),
      vertices: object.geometry.attributes.position.array.slice(),
      instances: object.isInstancedMesh ? object.instanceMatrix.array.slice() : null,
    });
  });
  return pose;
}

for (const caseId of FUSION_IDS) {
  test(`${caseId}: two sealed bilayers become an open, membrane-lined pore`, () => {
    const model = createFusionLab({ caseId, detail: false });
    try {
      model.setSection(0); // Check biology, not the artificial viewing cutaway.
      const above = new THREE.Vector3(.002, 2, .001), down = new THREE.Vector3(0, -1, 0);
      model.seek(.1);
      assert.equal(crossings(model, above, down).length, 4, 'two intact bilayers must have four leaflet crossings');
      model.seek(.68);
      assert.equal(crossings(model, above, down).length, 2, 'a hemifusion diaphragm must still seal the axial path');
      model.seek(.94);
      assert.equal(crossings(model, above, down).length, 0, 'the open pore must provide a real axial water path');
      const radial = crossings(model, new THREE.Vector3(0, 0, 0), new THREE.Vector3(1, 0, 0));
      assert.equal(radial.length, 2, 'removing the diaphragm must preserve both leaflets around the pore wall');
      assert.ok(radial[0] > .05, 'the pore must have a nonzero aqueous radius');
      assert.ok(radial[1] - radial[0] > .05 && radial[1] - radial[0] < .25, 'the two pore-wall leaflets must bound finite membrane thickness');
    } finally { model.dispose(); }
  });

  test(`${caseId}: host dt controls animation and hidden ancestors freeze it`, () => {
    const model = createFusionLab({ caseId, detail: false });
    try {
      model.seek(.3);
      const state = model.getState(), pose = poseSnapshot(model);
      model.update(1e6, 0);
      assert.deepEqual(model.getState(), state, 'host wall time alone must not advance animation');
      assert.deepEqual(poseSnapshot(model), pose, 'pause must freeze rendered geometry as well as the progress label');
      model.update(1e6 + 1, .5);
      assert.ok(Math.abs(model.getState().progress - (state.progress + .5 / state.duration)) < 1e-10, 'elapsed dt must advance the local timeline');
      assert.notDeepEqual(poseSnapshot(model), pose, 'positive dt must move actual model geometry');
      const parent = new THREE.Group(); parent.add(model.group); parent.visible = false;
      const hiddenState = model.getState(), hiddenPose = poseSnapshot(model);
      model.update(2e6, 3);
      assert.deepEqual(model.getState(), hiddenState, 'a hidden ancestor must freeze local time');
      assert.deepEqual(poseSnapshot(model), hiddenPose, 'a hidden ancestor must freeze model geometry');
    } finally { model.dispose(); }
  });

  test(`${caseId}: reverse and forward seeks reproduce the same visible pose`, () => {
    const model = createFusionLab({ caseId, detail: false });
    try {
      model.setSection(.78);
      model.seek(.66);
      const state = model.getState(), pose = poseSnapshot(model);
      model.seek(.95); model.seek(.09); model.seek(.66);
      assert.deepEqual(model.getState(), state);
      assert.deepEqual(poseSnapshot(model), pose, 'seeking must not leave historical protein or leaflet positions behind');
    } finally { model.dispose(); }
  });

  test(`${caseId}: pre-fusion tracers remain in the upper aqueous compartment`, () => {
    const model = createFusionLab({ caseId, detail: false });
    try {
      model.setSection(0);
      const tracer = model.group.getObjectByName('AqueousConnectivityTracers_NotVirionGenome');
      assert.ok(tracer?.isInstancedMesh && tracer.count > 0, 'the teaching scene must contain its aqueous tracers');
      const matrix = new THREE.Matrix4(), center = new THREE.Vector3(), scale = new THREE.Vector3();
      const down = new THREE.Vector3(0, -1, 0), up = new THREE.Vector3(0, 1, 0);
      for (const progress of [0, .2, .42, .55, .76]) {
        model.seek(progress);
        for (let index = 0; index < tracer.count; index++) {
          tracer.getMatrixAt(index, matrix);
          center.setFromMatrixPosition(matrix); scale.setFromMatrixScale(matrix);
          const below = crossings(model, center, down), above = crossings(model, center, up);
          assert.ok(below.length >= 2, `tracer ${index} at ${progress} must have the sealed membranes below it`);
          assert.equal(above.length, 0, `tracer ${index} at ${progress} must not start within or below a membrane`);
          assert.ok(below[0] > Math.max(scale.x, scale.y, scale.z) + .015, `tracer ${index} at ${progress} must clear the upper leaflet by its radius`);
        }
      }
    } finally { model.dispose(); }
  });
}
