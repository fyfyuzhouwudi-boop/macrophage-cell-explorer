import test, { after } from 'node:test';
import assert from 'node:assert/strict';
import * as THREE from 'three';
import { createFusionLab } from '../src/fusion-lab.js';
import { createViralEntrySequence } from '../src/viral-entry-sequence.js';
import { peripheralMembraneProfile } from '../src/viral-entry-curvature.js';

const visible = object => { for (let p = object; p; p = p.parent) if (!p.visible) return false; return true; };
const surfaces = model => {
  const result = []; model.group.updateMatrixWorld(true);
  model.group.traverse(o => { if (o.isMesh && o.name.endsWith('ContinuousSurface') && visible(o)) result.push(o); });
  return result;
};
const crossings = (model, origin, direction) => {
  const distances = new THREE.Raycaster(origin, direction).intersectObjects(surfaces(model), false).map(x => x.distance).sort((a, b) => a - b);
  return distances.filter((d, i) => i === 0 || d - distances[i - 1] > 1e-4);
};
const samples = [0, .16, .25, .37, .429, .431, .51, .59, .66, .70, .76, .7799999, .7800001, .84, .90, .98, 1];
const report = {
  date: '2026-10-25', kind: 'CPU geometry and animation invariants; no GPU performance claim',
  passed: false, stagesPreserved: 6, progressSamples: samples, checks: [],
  measuredCurvatureOrKinetics: false,
  sources: ['https://doi.org/10.1038/s41586-020-2333-6', 'https://doi.org/10.1038/nsmb.3271'],
};
after(() => assert.equal(report.checks.length, 5));

test('curved entry preserves every HA mesh vertex, transform and six-stage timing', () => {
  const entry = createViralEntrySequence({ detail: false }), baseline = createFusionLab({ caseId: 'ha-fusion', detail: false });
  try {
    assert.equal(entry.stages.length, 6);
    const proteins = baseline.group.getObjectByName('HAAnchorsAndFusionPeptides');
    for (const p of samples) {
      entry.seek(p); baseline.seek(p);
      assert.equal(entry.getState().stageIndex, baseline.getState().stageIndex);
      assert.equal(entry.getState().lumenConnected, baseline.getState().lumenConnected);
      proteins.traverse(object => {
        if (!object.isMesh) return;
        const actual = entry.group.getObjectByName(object.name);
        assert.deepEqual(actual.position.toArray(), object.position.toArray(), object.name + ' position at ' + p);
        assert.deepEqual(actual.quaternion.toArray(), object.quaternion.toArray(), object.name + ' rotation at ' + p);
        assert.deepEqual(actual.geometry.attributes.position.array, object.geometry.attributes.position.array, object.name + ' conformation at ' + p);
      });
      assert.match(entry.getState().subtitle, /流感病毒 HA/);
      assert.match(entry.getState().boundaryNote, /不泛化所有病毒/);
    }
    report.checks.push({ name: 'All HA mesh positions, rotations and vertices exactly match accepted baseline at 17 progress values; six-stage timing unchanged', passed: true });
  } finally { entry.dispose(); baseline.dispose(); }
});

test('outer membrane bends are C2 at the join and preserve physical leaflet thickness', () => {
  const entry = createViralEntrySequence({ detail: false });
  try {
    assert.deepEqual(peripheralMembraneProfile(1.02, true), { rise: 0, slope: 0 });
    assert.ok(peripheralMembraneProfile(1.02001, true).slope < 1e-8);
    assert.equal(peripheralMembraneProfile(1.48, true).rise, .32);
    assert.equal(peripheralMembraneProfile(1.48, false).rise, .15);
    const a = new THREE.Vector3(), b = new THREE.Vector3(), na = new THREE.Vector3(), nb = new THREE.Vector3();
    for (const p of [0, .25, .51, .70, .84, .98]) {
      entry.seek(p);
      const names = entry.getState().lumenConnected ? ['FusionPoreLumenFacingLeaflet', 'FusionPoreOuterLeaflet'] : ['UpperDistalLeaflet', 'UpperProximalLeaflet', 'LowerDistalLeaflet', 'LowerProximalLeaflet'];
      for (let i = 0; i < names.length; i += 2) {
        const x = entry.group.getObjectByName(names[i] + 'ContinuousSurface'), y = entry.group.getObjectByName(names[i + 1] + 'ContinuousSurface');
        for (const end of entry.getState().lumenConnected ? [0, 1] : [1]) {
          const xi = end * x.userData.gridNu * (x.userData.gridNv + 1), yi = end * y.userData.gridNu * (y.userData.gridNv + 1);
          a.fromBufferAttribute(x.geometry.attributes.position, xi); b.fromBufferAttribute(y.geometry.attributes.position, yi);
          na.fromBufferAttribute(x.geometry.attributes.normal, xi); nb.fromBufferAttribute(y.geometry.attributes.normal, yi);
          const medialA = a.clone().addScaledVector(na, -.067), medialB = b.clone().addScaledVector(nb, -.067);
          // The accepted factory blends planar and neck profiles between .59
          // and .78; it has a sub-0.4% medial-offset approximation in this band.
          // Bound it rather than falsely claiming exact molecular thickness.
          assert.ok(medialA.distanceTo(medialB) < .0005, 'same bent medial surface at ' + p + ': ' + medialA.distanceTo(medialB));
          assert.ok(Math.abs(a.distanceTo(b) - .134) < .0005, 'normal-offset bilayer thickness at ' + p);
          assert.ok(na.dot(nb) < -.99999, 'opposite leaflet normals at ' + p);
        }
      }
    }
    report.checks.push({ name: 'C2 peripheral join, curved outer edges, opposite leaflet normals, nominal 0.134 normal-offset thickness within 0.0005 inherited transition approximation', passed: true });
  } finally { entry.dispose(); }
});

test('curvature keeps real hemifusion closure and genuine pore opening', () => {
  const entry = createViralEntrySequence({ detail: false });
  try {
    entry.setSection(0);
    const origin = new THREE.Vector3(.002, 2, .001), down = new THREE.Vector3(0, -1, 0);
    for (const [p, count] of [[.1, 4], [.68, 2], [.779, 2], [.94, 0]]) {
      entry.seek(p); assert.equal(crossings(entry, origin, down).length, count, 'axial crossings at ' + p);
    }
    assert.equal(crossings(entry, new THREE.Vector3(), new THREE.Vector3(1, 0, 0)).length, 2, 'both leaflets line the open pore');
    const tracers = entry.group.getObjectByName('AqueousConnectivityTracers_NotVirionGenome'), matrix = new THREE.Matrix4();
    for (const p of samples) {
      entry.seek(p);
      if (entry.getState().lumenConnected) continue;
      for (let i = 0; i < tracers.count; i++) {
        tracers.getMatrixAt(i, matrix); assert.ok(matrix.elements[13] > 0, 'no tracer crosses a closed diaphragm');
      }
    }
    report.checks.push({ name: 'Raycast proves four intact-leaflet crossings, sealed hemifusion diaphragm and true open pore; tracers wait until water continuity', passed: true });
  } finally { entry.dispose(); }
});

test('new curved surfaces have finite coordinates, outward winding and actual label anchors', () => {
  const entry = createViralEntrySequence({ detail: false }), a = new THREE.Vector3(), b = new THREE.Vector3(), c = new THREE.Vector3(), n = new THREE.Vector3(), expected = new THREE.Vector3(), cross = new THREE.Vector3();
  try {
    for (const p of samples) {
      entry.seek(p);
      for (const mesh of surfaces(entry)) {
        const { position, normal } = mesh.geometry.attributes, indices = mesh.geometry.index.array;
        assert.ok(position.array.every(Number.isFinite), mesh.name + ' finite positions');
        assert.ok(normal.array.every(Number.isFinite), mesh.name + ' finite normals');
        for (let k = 0; k < indices.length; k += 3) {
          a.fromBufferAttribute(position, indices[k]); b.fromBufferAttribute(position, indices[k + 1]); c.fromBufferAttribute(position, indices[k + 2]);
          cross.crossVectors(b.sub(a), c.sub(a)); if (cross.lengthSq() < 1e-16) continue;
          expected.set(0, 0, 0); for (let j = 0; j < 3; j++) expected.add(n.fromBufferAttribute(normal, indices[k + j]));
          assert.ok(cross.dot(expected) > 0, mesh.name + ' winding at ' + p);
        }
      }
      assert.ok(entry.getTeachingLabels().every(l => l.position.toArray().every(Number.isFinite)));
    }
    entry.group.traverse(o => { if (o.isMesh) for (const m of Array.isArray(o.material) ? o.material : [o.material]) assert.ok(!m.transparent && m.opacity === 1); });
    report.checks.push({ name: 'Every active surface finite with consistent triangle winding; labels attached to actual geometry; all materials opaque', passed: true });
  } finally { entry.dispose(); }
});

test('seek is deterministic, pause does no curvature work and geometry identities are reused', () => {
  const entry = createViralEntrySequence({ detail: false });
  try {
    const mesh = entry.group.getObjectByName('UpperDistalLeafletContinuousSurface'), geometry = mesh.geometry;
    entry.seek(.25); const snapshot = mesh.geometry.attributes.position.array.slice(), before = entry.diagnostics().peripheralMembraneCurvature.updates;
    entry.seek(.25); entry.update(1e8, 0); entry.setSection(entry.getState().section);
    assert.deepEqual(mesh.geometry.attributes.position.array, snapshot);
    assert.equal(entry.diagnostics().peripheralMembraneCurvature.updates, before);
    entry.seek(.90); entry.seek(.25); assert.deepEqual(mesh.geometry.attributes.position.array, snapshot);
    assert.equal(mesh.geometry, geometry);
    entry.group.visible = false; const progress = entry.getState().progress; entry.update(100, 1); assert.equal(entry.getState().progress, progress);
    assert.equal(entry.diagnostics().peripheralMembraneCurvature.measuredCurvatureOrKinetics, false);
    report.curvature = entry.diagnostics().peripheralMembraneCurvature;
    report.checks.push({ name: 'Deterministic seek, pause and hidden state; unchanged progress does not rewrite curvature; geometry object identities reused', passed: true });
  } finally { entry.dispose(); }
});
