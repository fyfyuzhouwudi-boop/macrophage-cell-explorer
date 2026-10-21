import * as THREE from "three";
function makeReliefTexture(size = 96, seed = 1) {
  const data = new Uint8Array(size * size * 4);
  for (let y = 0; y < size; y++) for (let x = 0; x < size; x++) {
    const q = Math.sin(x * 1.7 + y * 3.1 + seed) * 43758.5453 % 1, v = Math.round(150 + Math.sin(x * 0.27) * Math.sin(y * 0.33) * 25 + Math.abs(q) * 50), i = (y * size + x) * 4;
    data[i] = data[i + 1] = data[i + 2] = v;
    data[i + 3] = 255;
  }
  const texture = new THREE.DataTexture(data, size, size);
  texture.needsUpdate = true;
  texture.wrapS = texture.wrapT = THREE.RepeatWrapping;
  return texture;
}
const TAU = Math.PI * 2;
const OUTER = new THREE.Vector3(1, 0.42, 0.43), INNER = new THREE.Vector3(0.925, 0.345, 0.352);
const clamp = THREE.MathUtils.clamp;
const quintic = (x) => {
  const t = clamp(x, 0, 1);
  return t * t * t * (10 + t * (-15 + 6 * t));
};
function modulation(direction, index, inner = false) {
  return 1 + (inner ? 6e-3 : 0.012) * Math.sin(direction.x * 8 + direction.z * 5 + index * 0.37) * Math.cos(direction.y * 7 - direction.z * 3) + (inner ? 2e-3 : 4e-3) * Math.sin(direction.x * 23 - direction.y * 11 + direction.z * 17 + index);
}
function radiusAt(direction, axes, index, inner = false) {
  return modulation(direction, index, inner) / Math.sqrt((direction.x / axes.x) ** 2 + (direction.y / axes.y) ** 2 + (direction.z / axes.z) ** 2);
}
function lathePoint(u, v, nu, nv, axes, index, inner = false) {
  const phi = u / nu * Math.PI, theta = v / nv * TAU, p = new THREE.Vector3(-axes.x * Math.cos(phi), axes.y * Math.sin(phi) * Math.cos(theta), axes.z * Math.sin(phi) * Math.sin(theta));
  return p.multiplyScalar(modulation(p.clone().normalize(), index, inner));
}
function lathe(nu, nv, axes, index, ports = []) {
  const positions = [], uv = [], indices = [];
  const point = (u, v) => lathePoint(u, v, nu, nv, axes, index, ports.length > 0);
  const add = (p, u, v) => {
    const id = positions.length / 3;
    positions.push(p.x, p.y, p.z);
    uv.push(u, v);
    return id;
  };
  const first = add(point(0, 0), 0, 0.5);
  for (let u = 1; u < nu; u++) for (let v = 0; v < nv; v++) add(point(u, v), u / nu, v / nv);
  const last = add(point(nu, 0), 1, 0.5);
  const vertex = (u, v) => u === 0 ? first : u === nu ? last : 1 + (u - 1) * nv + (v % nv + nv) % nv;
  for (let v = 0; v < nv; v++) indices.push(first, vertex(1, v + 1), vertex(1, v));
  for (let u = 1; u < nu - 1; u++) for (let v = 0; v < nv; v++) {
    if (ports.some((port) => u >= port.u0 && u < port.u1 && v >= port.v0 && v < port.v1)) continue;
    const a = vertex(u, v), b = vertex(u + 1, v), c = vertex(u, v + 1), d = vertex(u + 1, v + 1);
    indices.push(a, c, b, c, d, b);
  }
  for (let v = 0; v < nv; v++) indices.push(vertex(nu - 1, v), vertex(nu - 1, v + 1), last);
  return { positions, uv, indices, vertex };
}
function geometryFrom(data) {
  const g = new THREE.BufferGeometry();
  g.setAttribute("position", new THREE.Float32BufferAttribute(data.positions, 3));
  g.setAttribute("uv", new THREE.Float32BufferAttribute(data.uv, 2));
  g.setIndex(data.indices);
  g.computeVertexNormals();
  g.computeBoundingSphere();
  g.computeBoundingBox();
  return g;
}
function createContinuousMitoCore({ index = 0, surfaceTexture = null } = {}) {
  const group = new THREE.Group();
  group.name = "ContinuousMembraneMitochondrion";
  group.userData = { organelleId: "mitochondria", teachingOnly: true };
  const texture = surfaceTexture ? surfaceTexture.clone() : makeReliefTexture(96, 475 + index);
  texture.wrapS = texture.wrapT = THREE.RepeatWrapping;
  texture.repeat.set(3, 2);
  texture.needsUpdate = true;
  const outerMat = new THREE.MeshStandardMaterial({ color: "#b97650", roughness: 0.44, metalness: 0.015, bumpMap: texture, bumpScale: 6e-3, emissive: "#88675f", emissiveIntensity: 0.045, side: THREE.DoubleSide });
  const boundaryMat = new THREE.MeshStandardMaterial({ color: "#cb8652", roughness: 0.43, metalness: 0.015, bumpMap: texture, bumpScale: 4e-3, emissive: "#b47c54", emissiveIntensity: 0.045, side: THREE.DoubleSide });
  const cristaMat = new THREE.MeshStandardMaterial({ color: "#dfa06a", roughness: 0.39, metalness: 0.015, bumpMap: texture, bumpScale: 4e-3, emissive: "#c88e59", emissiveIntensity: 0.055, side: THREE.DoubleSide });
  const outerData = lathe(48, 40, OUTER, index), outerGeometry = geometryFrom(outerData), outer = new THREE.Mesh(outerGeometry, outerMat);
  outer.name = "MitochondrialClosedOuterMembrane";
  outer.userData = { organelleId: "mitochondria", identity: "outer_membrane", teachingOnly: true };
  group.add(outer);
  const nu = 128, nv = 64, centers = [24, 34, 42, 49, 55, 61, 67, 73, 79, 86, 94, 104], ports = centers.map((u, i) => ({ id: i, u0: u - 1, u1: u + 1, v0: 46, v1: 50 }));
  const data = lathe(nu, nv, INNER, index, ports), cristae = [];
  const edgeSplits = /* @__PURE__ */ new Map(), portBoundaries = [];
  for (const port of ports) {
    const coarse = [];
    for (let u = port.u0; u <= port.u1; u++) coarse.push(data.vertex(u, port.v0));
    for (let v = port.v0 + 1; v <= port.v1; v++) coarse.push(data.vertex(port.u1, v));
    for (let u = port.u1 - 1; u >= port.u0; u--) coarse.push(data.vertex(u, port.v1));
    for (let v = port.v1 - 1; v > port.v0; v--) coarse.push(data.vertex(port.u0, v));
    const refined = [];
    for (let j = 0; j < coarse.length; j++) {
      const a = coarse[j], b = coarse[(j + 1) % coarse.length], split = [a];
      refined.push(a);
      for (let part = 1; part < 3; part++) {
        const t = part / 3, id = data.positions.length / 3;
        for (let axis = 0; axis < 3; axis++) data.positions.push(THREE.MathUtils.lerp(data.positions[a * 3 + axis], data.positions[b * 3 + axis], t));
        data.uv.push(THREE.MathUtils.lerp(data.uv[a * 2], data.uv[b * 2], t), THREE.MathUtils.lerp(data.uv[a * 2 + 1], data.uv[b * 2 + 1], t));
        split.push(id);
        refined.push(id);
      }
      split.push(b);
      edgeSplits.set(a < b ? a + "," + b : b + "," + a, split);
    }
    portBoundaries.push(refined);
  }
  const motherFaces = [];
  for (let face = 0; face < data.indices.length; face += 3) {
    const ids = data.indices.slice(face, face + 3), splitEdges = [];
    for (let e = 0; e < 3; e++) {
      const a = ids[e], b = ids[(e + 1) % 3], parts = edgeSplits.get(a < b ? a + "," + b : b + "," + a);
      if (parts) splitEdges.push({ edge: e, parts: parts[0] === a ? parts : parts.slice().reverse() });
    }
    if (splitEdges.length === 0) {
      motherFaces.push(...ids);
      continue;
    }
    if (splitEdges.length === 1) {
      const { edge, parts } = splitEdges[0], opposite = ids[(edge + 2) % 3];
      for (let i = 0; i < parts.length - 1; i++) motherFaces.push(parts[i], parts[i + 1], opposite);
      continue;
    }
    const ring = [];
    for (let e = 0; e < 3; e++) {
      const split = splitEdges.find((s) => s.edge === e);
      ring.push(...split ? split.parts.slice(0, -1) : [ids[e]]);
    }
    const center = data.positions.length / 3;
    for (let axis = 0; axis < 3; axis++) data.positions.push(ids.reduce((sum, id) => sum + data.positions[id * 3 + axis], 0) / 3);
    for (let axis = 0; axis < 2; axis++) data.uv.push(ids.reduce((sum, id) => sum + data.uv[id * 2 + axis], 0) / 3);
    for (let j = 0; j < ring.length; j++) motherFaces.push(ring[j], ring[(j + 1) % ring.length], center);
  }
  data.indices = motherFaces;
  const motherIndexCount = data.indices.length;
  const motherNormals = new Float64Array(data.positions.length), ma = new THREE.Vector3(), mb = new THREE.Vector3(), mc = new THREE.Vector3(), mn = new THREE.Vector3();
  for (let i = 0; i < motherIndexCount; i += 3) {
    const ids = data.indices.slice(i, i + 3);
    ma.fromArray(data.positions, ids[0] * 3);
    mb.fromArray(data.positions, ids[1] * 3);
    mc.fromArray(data.positions, ids[2] * 3);
    mn.subVectors(mb, ma).cross(mc.sub(ma));
    for (const id of ids) for (let axis = 0; axis < 3; axis++) motherNormals[id * 3 + axis] += mn.getComponent(axis);
  }
  for (const port of ports) {
    const boundary = portBoundaries[port.id];
    const roots = boundary.map((id) => new THREE.Vector3(...data.positions.slice(id * 3, id * 3 + 3))), base = roots.reduce((sum, p) => sum.add(p), new THREE.Vector3()).multiplyScalar(1 / roots.length);
    const rx = Math.max(...roots.map((p) => Math.abs(p.x - base.x))), ry = Math.max(...roots.map((p) => Math.abs(p.y - base.y))), rho = Math.sin((port.u0 + 1) / nu * Math.PI);
    const angles = roots.map((p) => Math.atan2((p.y - base.y) / ry, (p.x - base.x) / rx));
    const directed = /* @__PURE__ */ new Map();
    for (let i = 0; i < motherIndexCount; i += 3) for (let edge = 0; edge < 3; edge++) {
      const a = data.indices[i + edge], b = data.indices[i + (edge + 1) % 3];
      if (boundary.includes(a) && boundary.includes(b)) directed.set(a + "," + b, true);
    }
    const reverse = directed.has(boundary[0] + "," + boundary[1]);
    const addTriangle = (a, b, c) => {
      if (reverse) data.indices.push(a, c, b);
      else data.indices.push(a, b, c);
    };
    const faceStart = data.indices.length, firstNewVertex = data.positions.length / 3, lumenCenterline = [base.toArray()], rings = [boundary];
    const ringCount = 28, neckRX = Math.min(0.026 + port.id * 4e-4, rx * 0.64), neckRY = Math.min(0.04 * rho, ry * 0.64), neckZ = base.z + 0.095 * rho, frontZ = [0.247, 0.203, 0.261, 0.183, 0.228, 0.215, 0.243, 0.194, 0.257, 0.222, 0.204, 0.236][port.id] * rho, bagWidth = [0.251, 0.237, 0.261, 0.239, 0.254, 0.242, 0.258, 0.231, 0.248, 0.263, 0.234, 0.245][port.id] * rho, bagThickness = [0.043, 0.039, 0.046, 0.041, 0.047, 0.04, 0.045, 0.042, 0.039, 0.046, 0.041, 0.044][port.id], tilt = [-0.06, 0.04, -0.05, 0.06, -0.04, 0.05, 0.04, -0.06, 0.05, -0.04, 0.06, -0.05][port.id];
    for (let layer = 1; layer <= ringCount; layer++) {
      const s = layer <= 8 ? 0.18 * (layer / 8) ** 1.7 : 0.18 + 0.82 * (1 - (1 - (layer - 8) / 21) ** 1.35), ring = [], t = clamp((s - 0.18) / 0.82, 0, 1), flare = quintic(t / 0.28), cap = t > 0.67 ? Math.sqrt(Math.max(0, 1 - ((t - 0.67) / 0.33) ** 2)) : 1;
      const centerX = base.x + 9e-3 * rho * Math.sin(t * 5 + index * 0.3 + port.id) * Math.sin(Math.PI * t), centerY = base.y + 0.014 * rho * Math.sin(t * 4 + port.id * 0.8) * Math.sin(Math.PI * t);
      const z = s < 0.18 ? THREE.MathUtils.lerp(base.z, neckZ, s / 0.18) : THREE.MathUtils.lerp(neckZ, frontZ, t);
      if (layer === 4 || layer === 12 || layer === 21 || layer === 28) lumenCenterline.push([centerX, centerY, z]);
      for (let j = 0; j < boundary.length; j++) {
        const angle = angles[j];
        let x, y, pz;
        if (s < 0.18) {
          const q = s / 0.18, arc = Math.sin(q * Math.PI * 0.5), rise = 1 - Math.cos(q * Math.PI * 0.5), targetX = base.x + neckRX * Math.cos(angle), targetY = base.y + neckRY * Math.sin(angle), dx = targetX - roots[j].x, dy = targetY - roots[j].y, normal = new THREE.Vector3().fromArray(motherNormals, boundary[j] * 3).normalize(), tangentZ = -(normal.x * dx + normal.y * dy) / normal.z;
          x = roots[j].x + dx * arc;
          y = roots[j].y + dy * arc;
          pz = roots[j].z + tangentZ * arc * (1 - q) ** 2 + (neckZ - roots[j].z) * rise;
        } else {
          const xRadius = THREE.MathUtils.lerp(neckRX, bagThickness, flare) * cap, yRadius = THREE.MathUtils.lerp(neckRY, bagWidth, flare) * cap, cos = Math.cos(angle), sin = Math.sin(angle), roundedCos = Math.sign(cos) * Math.abs(cos) ** 0.8, lateral = yRadius * sin;
          x = centerX + xRadius * roundedCos + tilt * lateral * flare + 0.018 * rho * Math.sin(lateral * 12 + 0.4) * Math.sin(Math.PI * t) + 3e-3 * rho * Math.sin(port.id) * Math.sin(Math.PI * t);
          y = centerY + lateral + 0.014 * rho * Math.sin(t * 6 + port.id * 0.7) * Math.sin(Math.PI * t);
          pz = z + 0.021 * rho * Math.sin(angle * 2 + port.id * 0.6) * Math.sin(Math.PI * t) + 8e-3 * rho * Math.sin(lateral * 21) * Math.sin(Math.PI * t);
        }
        ring.push(data.positions.length / 3);
        data.positions.push(x, y, pz);
        data.uv.push((port.id + s) / 12, j / boundary.length);
      }
      const previous = rings[rings.length - 1];
      for (let j = 0; j < boundary.length; j++) {
        const next = (j + 1) % boundary.length, a = previous[j], b = previous[next], c = ring[j], d = ring[next];
        addTriangle(a, b, c);
        addTriangle(b, d, c);
      }
      rings.push(ring);
    }
    const capVertex = data.positions.length / 3;
    data.positions.push(base.x, base.y, frontZ);
    data.uv.push((port.id + 1) / 12, 0.5);
    const last = rings[rings.length - 1];
    for (let j = 0; j < boundary.length; j++) addTriangle(last[j], last[(j + 1) % last.length], capVertex);
    lumenCenterline.push([base.x, base.y, frontZ - 0.012 * rho]);
    cristae.push({ id: port.id, basePoint: base.toArray(), portBoundaryIndices: boundary, neckRingIndices: rings[8], allRingIndices: rings, firstNewVertex, capVertex, faceStart, faceIndexCount: data.indices.length - faceStart, lumenCenterline, neckRX, neckRY, expectedCentralLumenThicknessX: bagThickness * 2, rootRefinement: 3, bagTilt: tilt });
  }
  const used = new Set(data.indices), remap = new Int32Array(data.positions.length / 3).fill(-1), compactPositions = [], compactUV = [];
  for (let old = 0; old < remap.length; old++) if (used.has(old)) {
    remap[old] = compactPositions.length / 3;
    compactPositions.push(...data.positions.slice(old * 3, old * 3 + 3));
    compactUV.push(...data.uv.slice(old * 2, old * 2 + 2));
  }
  data.positions = compactPositions;
  data.uv = compactUV;
  data.indices = data.indices.map((id) => remap[id]);
  for (const crista of cristae) {
    crista.portBoundaryIndices = crista.portBoundaryIndices.map((id) => remap[id]);
    crista.neckRingIndices = crista.neckRingIndices.map((id) => remap[id]);
    crista.allRingIndices = crista.allRingIndices.map((r) => r.map((id) => remap[id]));
    crista.firstNewVertex = remap[crista.firstNewVertex];
    crista.capVertex = remap[crista.capVertex];
  }
  const innerGeometry = geometryFrom(data);
  innerGeometry.addGroup(0, motherIndexCount, 0);
  innerGeometry.addGroup(motherIndexCount, data.indices.length - motherIndexCount, 1);
  const inner = new THREE.Mesh(innerGeometry, [boundaryMat, cristaMat]);
  inner.name = "MitochondrialContinuousInnerMembrane";
  inner.userData = { organelleId: "mitochondria", identity: "inner_boundary_and_crista_membrane", teachingOnly: true, motherIndexCount, cristae: cristae.map((c) => ({ id: c.id, faceStart: c.faceStart, faceIndexCount: c.faceIndexCount, portBoundaryIndices: c.portBoundaryIndices })) };
  group.add(inner);
  const preferred = new THREE.Vector3(0.4, 0.375, 0.15), rayDirection = preferred.clone().normalize(), ray = new THREE.Raycaster(rayDirection.clone().multiplyScalar(2), rayDirection.clone().negate());
  outer.updateMatrixWorld(true);
  const hit = ray.intersectObject(outer, false)[0];
  const mavsSite = hit ? hit.point.clone() : rayDirection.clone().multiplyScalar(radiusAt(rayDirection, OUTER, index));
  const mavsNormal = hit?.normal?.clone() ?? new THREE.Vector3(mavsSite.x, mavsSite.y / (0.42 * 0.42), mavsSite.z / (0.43 * 0.43)).normalize();
  if (mavsNormal.dot(mavsSite) < 0) mavsNormal.negate();
  mavsNormal.normalize();
  const rimPoints = [];
  for (let i = 0; i < 112; i++) {
    const angle = i / 112 * TAU, z = 0.1;
    let lo = 0, hi = 1.25;
    for (let step = 0; step < 36; step++) {
      const r2 = (lo + hi) * 0.5, p = new THREE.Vector3(Math.cos(angle) * r2, 0.42 * Math.sin(angle) * r2, z), d = p.clone().normalize();
      if (p.length() > radiusAt(d, OUTER, index)) hi = r2;
      else lo = r2;
    }
    const r = (lo + hi) * 0.5;
    rimPoints.push(new THREE.Vector3(Math.cos(angle) * r, 0.42 * Math.sin(angle) * r, z));
  }
  const rimGeometry = new THREE.TubeGeometry(new THREE.CatmullRomCurve3(rimPoints, true, "catmullrom", 0.4), 112, 7e-3, 6, true), rimMat = new THREE.MeshStandardMaterial({ color: "#c8a094", roughness: 0.53, metalness: 0.02, emissive: "#ad8371", emissiveIntensity: 0.045, side: THREE.DoubleSide }), rim = new THREE.Mesh(rimGeometry, rimMat);
  rim.name = "MitochondrialCutawayOuterMembraneRim";
  rim.userData = { organelleId: "mitochondria", identity: "cutaway_rim_decoration", teachingOnly: true };
  group.add(rim);
  const outerCut = new THREE.Plane(new THREE.Vector3(0, 0, -1), 0.1), innerCut = new THREE.Plane(new THREE.Vector3(0, 0, -1), 0.155), cristaCut = new THREE.Plane(new THREE.Vector3(0, 0, -1), 0.185);
  const worldOuterCut = outerCut.clone(), worldInnerCut = innerCut.clone(), worldCristaCut = cristaCut.clone();
  let cutaway = false;
  function setCutaway(value) {
    cutaway = Boolean(value);
    group.updateWorldMatrix(true, false);
    worldOuterCut.copy(outerCut).applyMatrix4(group.matrixWorld);
    worldInnerCut.copy(innerCut).applyMatrix4(group.matrixWorld);
    worldCristaCut.copy(cristaCut).applyMatrix4(group.matrixWorld);
    outerMat.clippingPlanes = cutaway ? [worldOuterCut] : null;
    boundaryMat.clippingPlanes = cutaway ? [worldInnerCut] : null;
    cristaMat.clippingPlanes = cutaway ? [worldCristaCut] : null;
    inner.visible = cutaway;
    rim.visible = cutaway;
    for (const m of [outerMat, boundaryMat, cristaMat]) m.needsUpdate = true;
    group.userData.cutaway = cutaway;
  }
  function dispose() {
    outerGeometry.dispose();
    innerGeometry.dispose();
    rimGeometry.dispose();
    outerMat.dispose();
    boundaryMat.dispose();
    cristaMat.dispose();
    rimMat.dispose();
    texture.dispose();
    group.clear();
  }
  const stats = { triangles: (outerGeometry.index.count + innerGeometry.index.count + rimGeometry.index.count) / 3, outerTriangles: outerGeometry.index.count / 3, innerTriangles: innerGeometry.index.count / 3, cristae: cristae.length, cutawayRimTriangles: rimGeometry.index.count / 3, meshCount: 3, allocatedMaterialCalls: 4, normalVisibleCalls: 1, cutawayVisibleCalls: 4 };
  const metadata = { teachingOnly: true, visualRefinement: "36 shared root vertices with synchronized mother-face edge splits, 28 longitudinal rings including 8 tangent-following rounded neck rings, softly rounded sacs with modest individual tilt/width/depth variation", description: "闭合外膜与一张连续的内边界膜/嵴膜中面；十二个不等形扁囊通过共享端口顶点的嵴颈与膜间隙相通。非EM或原子坐标。", membraneRepresentation: "Closed mathematical mid-surfaces; the lipid bilayer itself has no resolved wall thickness. Crista sacs have positive enclosed lumen thickness; separate outer and inner surfaces leave an explicit intermembrane gap.", inspectionTarget: { position: [0, 0, -0.035], direction: [0.07, 0.1, 1], distance: 2.6 }, outerAxes: OUTER.toArray(), innerBoundaryAxes: INNER.toArray(), mavsSite: mavsSite.toArray(), mavsNormal: mavsNormal.toArray(), cristae, motherIndexCount, cutawayDescription: "Material clipping creates visible display boundaries; raw indexed meshes stay closed and unmodified. No polygonal cap is baked at the clipping planes.", sources: [{ title: "Perkins et al. 1997, electron tomography of neuronal mitochondria", url: "https://doi.org/10.1006/jsbi.1997.3885" }, { title: "Perkins et al. 1998, brown adipose tissue mitochondrial tomography", url: "https://doi.org/10.1023/A:1020586012561" }] };
  setCutaway(false);
  group.updateMatrixWorld(true);
  return { group, pickables: [outer, inner, rim], stats, metadata, setCutaway, dispose };
}
export {
  createContinuousMitoCore
};
