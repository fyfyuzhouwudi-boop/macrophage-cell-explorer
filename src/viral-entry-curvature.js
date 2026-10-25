import * as THREE from 'three';

// Preserve the accepted HA/contact/pore movie exactly inside this radius. The
// peripheral continuation supplies organelle-scale curvature, not an atomic
// reconstruction or a change to the measured HA structures.
const CONTACT_RADIUS = 1.02, PATCH_RADIUS = 1.48, HALF_BILAYER = .067;
const VIRAL_RISE = .32, ENDOSOME_RISE = .15;
const SOURCE_IDS = ['benton2020', 'calder2016'];
const FACE_NAMES = [
  'UpperDistalLeaflet', 'UpperProximalLeaflet',
  'LowerDistalLeaflet', 'LowerProximalLeaflet',
  'FusionPoreLumenFacingLeaflet', 'FusionPoreOuterLeaflet',
];

// h(t)=t³(2-t) has zero slope and second derivative at the contact-zone join.
// Its nonnegative curvature makes this a smooth bowl continuation. The virus
// has the stronger curve; the inner surface of the larger endosome curves in
// the same direction here. Opposing hemispheres would show an external
// virus/liposome contact rather than the selected intra-endosomal example.
export function peripheralMembraneProfile(radius, upper, target = {}) {
  const t = Math.max(0, Math.min(1, (radius - CONTACT_RADIUS) / (PATCH_RADIUS - CONTACT_RADIUS)));
  const height = upper ? VIRAL_RISE : ENDOSOME_RISE;
  target.rise = height * t * t * t * (2 - t);
  target.slope = height / (PATCH_RADIUS - CONTACT_RADIUS) * (6 * t * t - 4 * t * t * t);
  return target;
}

const active = object => { for (let p = object; p; p = p.parent) if (!p.visible) return false; return true; };

export function createViralEntryCurvature(model) {
  const faces = FACE_NAMES.map(name => {
    const face = model.group.getObjectByName(name + 'ContinuousSurface');
    const heads = model.group.getObjectByName(name + 'PolarHeads');
    const tails = model.group.getObjectByName(name + 'PairedAcylTails');
    if (!face || !heads || !tails) throw new Error('Missing HA membrane geometry: ' + name);
    // One source meridian is enough for the rotationally symmetric cutaway.
    // Reuse these arrays when its section angle or the fusion progress changes.
    return { face, heads, tails, meridian: new Float64Array((face.userData.gridNu + 1) * 4) };
  });
  const caps = [];
  model.group.traverse(object => {
    if (object.isMesh && /^(Membrane\d(?:SectionEdge\d|PatchBoundary)|FusedMembraneSectionEdge\d|FusedPatchOuterBoundary\d)$/.test(object.name)) caps.push(object);
  });
  const normal = new THREE.Vector3(), newNormal = new THREE.Vector3(), point = new THREE.Vector3();
  const center = new THREE.Vector3(), sourceCenter = new THREE.Vector3(), offset = new THREE.Vector3();
  const rotation = new THREE.Quaternion(), axis = new THREE.Vector3();
  const profileScratch = { rise: 0, slope: 0 };
  let appliedRevision = -1, updates = 0;

  function bend(source, sourceNormal, distance, target, targetNormal) {
    sourceCenter.copy(source).addScaledVector(sourceNormal, -distance);
    const radius = Math.hypot(sourceCenter.x, sourceCenter.z);
    if (radius <= CONTACT_RADIUS) {
      target.copy(source); targetNormal.copy(sourceNormal); return false;
    }
    const profile = peripheralMembraneProfile(radius, sourceCenter.y >= 0, profileScratch);
    // Inverse-transpose of the radial height-map Jacobian. Offset the two
    // leaflets along this new normal, so their physical thickness stays 0.134
    // instead of being compressed by a vertical shear.
    targetNormal.set(
      sourceNormal.x - sourceNormal.y * profile.slope * sourceCenter.x / radius,
      sourceNormal.y,
      sourceNormal.z - sourceNormal.y * profile.slope * sourceCenter.z / radius,
    ).normalize();
    target.copy(sourceCenter); target.y += profile.rise;
    target.addScaledVector(targetNormal, distance);
    return true;
  }

  function cacheMeridian(entry) {
    const pa = entry.face.geometry.attributes.position, na = entry.face.geometry.attributes.normal;
    const stride = entry.face.userData.gridNv + 1;
    for (let u = 0; u <= entry.face.userData.gridNu; u++) {
      const i = u * stride, x = pa.getX(i), z = pa.getZ(i), r = Math.hypot(x, z), k = u * 4;
      entry.meridian[k] = r; entry.meridian[k + 1] = pa.getY(i);
      entry.meridian[k + 2] = r > 1e-8 ? (na.getX(i) * x + na.getZ(i) * z) / r : 0;
      entry.meridian[k + 3] = na.getY(i);
    }
  }

  function bendFace({ face }) {
    const pa = face.geometry.attributes.position, na = face.geometry.attributes.normal;
    for (let i = 0; i < pa.count; i++) {
      point.fromBufferAttribute(pa, i); normal.fromBufferAttribute(na, i);
      if (bend(point, normal, HALF_BILAYER, center, newNormal)) {
        pa.setXYZ(i, center.x, center.y, center.z); na.setXYZ(i, newNormal.x, newNormal.y, newNormal.z);
      }
    }
    pa.needsUpdate = true; na.needsUpdate = true;
    face.geometry.boundingSphere = null; face.geometry.boundingBox = null;
  }

  function rotateLipidInstance(array, index, oldCenter, newCenter) {
    const k = index * 16;
    for (let col = 0; col < 3; col++) {
      const j = k + col * 4;
      axis.set(array[j], array[j + 1], array[j + 2]).applyQuaternion(rotation);
      array[j] = axis.x; array[j + 1] = axis.y; array[j + 2] = axis.z;
    }
    offset.set(array[k + 12], array[k + 13], array[k + 14]).sub(oldCenter).applyQuaternion(rotation).add(newCenter);
    array[k + 12] = offset.x; array[k + 13] = offset.y; array[k + 14] = offset.z;
  }

  function bendLipids({ heads, tails }) {
    const headArray = heads.instanceMatrix.array, tailArray = tails.instanceMatrix.array;
    for (let i = 0; i < heads.count; i++) {
      const k = i * 16;
      point.set(headArray[k + 12], headArray[k + 13], headArray[k + 14]);
      normal.set(headArray[k + 4], headArray[k + 5], headArray[k + 6]).normalize();
      if (!bend(point, normal, HALF_BILAYER + .009, center, newNormal)) continue;
      // Move each whole lipid rigidly with its local membrane normal. Paired
      // tails keep their length and attachment to their own head group.
      rotation.setFromUnitVectors(normal, newNormal);
      rotateLipidInstance(tailArray, i * 2, point, center);
      rotateLipidInstance(tailArray, i * 2 + 1, point, center);
      rotateLipidInstance(headArray, i, point, center);
    }
    heads.instanceMatrix.needsUpdate = true; tails.instanceMatrix.needsUpdate = true;
  }

  function capNormal(radius, y, angle, entries) {
    let best = Infinity, nr = 0, ny = 1;
    for (const { meridian } of entries) for (let k = 0; k < meridian.length - 4; k += 4) {
      const dr = meridian[k + 4] - meridian[k], dy = meridian[k + 5] - meridian[k + 1];
      const t = THREE.MathUtils.clamp(((radius - meridian[k]) * dr + (y - meridian[k + 1]) * dy) / Math.max(1e-18, dr * dr + dy * dy), 0, 1);
      const d = (radius - meridian[k] - t * dr) ** 2 + (y - meridian[k + 1] - t * dy) ** 2;
      if (d < best) {
        best = d; nr = THREE.MathUtils.lerp(meridian[k + 2], meridian[k + 6], t); ny = THREE.MathUtils.lerp(meridian[k + 3], meridian[k + 7], t);
      }
    }
    return normal.set(nr * Math.cos(angle), ny, nr * Math.sin(angle)).normalize();
  }

  function bendCap(cap, entries) {
    const pa = cap.geometry.attributes.position;
    for (let i = 0; i < pa.count; i++) {
      point.fromBufferAttribute(pa, i);
      const radius = Math.hypot(point.x, point.z);
      if (radius < CONTACT_RADIUS - HALF_BILAYER) continue;
      capNormal(radius, point.y, Math.atan2(point.z, point.x), entries);
      if (bend(point, normal, HALF_BILAYER, center, newNormal)) pa.setXYZ(i, center.x, center.y, center.z);
    }
    pa.needsUpdate = true; cap.geometry.computeVertexNormals();
    cap.geometry.boundingSphere = null; cap.geometry.boundingBox = null;
  }

  function apply() {
    const revision = model.getDiagnostics().geometryUpdates;
    if (revision === appliedRevision) return;
    const entries = faces.filter(({ face }) => active(face));
    entries.forEach(cacheMeridian);
    entries.forEach(bendFace);
    entries.forEach(bendLipids);
    for (const cap of caps) if (active(cap)) bendCap(cap, entries);
    appliedRevision = revision; updates++;
  }

  function diagnostics() {
    return {
      enabled: true, updates, sourceGeometryRevision: appliedRevision,
      contactGeometryAndHAUnchangedInsideRadius: CONTACT_RADIUS,
      patchRadius: PATCH_RADIUS, bilayerThickness: HALF_BILAYER * 2,
      viralOuterRise: VIRAL_RISE, endosomeOuterRise: ENDOSOME_RISE,
      viralOuterSlopeDegrees: THREE.MathUtils.radToDeg(Math.atan(peripheralMembraneProfile(PATCH_RADIUS, true).slope)),
      endosomeOuterSlopeDegrees: THREE.MathUtils.radToDeg(Math.atan(peripheralMembraneProfile(PATCH_RADIUS, false).slope)),
      interpretation: 'Curved peripheral membrane continuation around the unchanged HA/contact movie; intra-endosomal orientation, illustrative dimensions.',
      leafletConstruction: 'normal offsets from a smoothly bent medial surface; representative lipids rotate rigidly with the local surface normal',
      atomicCoordinatesUsed: false, measuredCurvatureOrKinetics: false,
      sources: SOURCE_IDS,
      sourceUrls: ['https://doi.org/10.1038/s41586-020-2333-6', 'https://doi.org/10.1038/nsmb.3271'],
    };
  }

  return { apply, diagnostics };
}
