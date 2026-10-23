import { confineERWorldPoint } from "./nuclear-er-continuum.js";
import * as THREE from "three";
import { createWholeMembraneStatic } from "./whole-membrane-static.js";
import { createWholeVesicleDomain } from "./whole-vesicle-domains.js";
import { mergeGeometries, mergeVertices } from "three/addons/utils/BufferGeometryUtils.js";
const TAU = Math.PI * 2;
const LABELS = { nucleus: "细胞核", er: "内质网", golgi: "高尔基体", mitochondria: "线粒体", lysosome: "溶酶体", endosome: "内体", membrane: "细胞膜", cytoskeleton: "细胞骨架", pore: "核孔", phagosome: "吞噬体", peroxisome: "过氧化物酶体", ribosome: "核糖体" };
function random(seed = 4817) {
  let x = seed >>> 0;
  return () => (x = 1664525 * x + 1013904223 >>> 0) / 4294967296;
}
function relief(size = 128) {
  const data = new Uint8Array(size * size * 4), rand = random(7283);
  for (let y = 0; y < size; y++) for (let x = 0; x < size; x++) {
    const i = (y * size + x) * 4, v = 140 + 55 * rand() + 24 * Math.sin(x * 0.31) * Math.sin(y * 0.29) + 18 * Math.sin(x * 0.83 + y * 0.67);
    data[i] = data[i + 1] = data[i + 2] = Math.max(0, Math.min(255, v));
    data[i + 3] = 255;
  }
  const t = new THREE.DataTexture(data, size, size);
  t.wrapS = t.wrapT = THREE.RepeatWrapping;
  t.repeat.set(4, 4);
  t.needsUpdate = true;
  return t;
}
function geometry(positions, indices, uv) {
  const g = new THREE.BufferGeometry();
  g.setAttribute("position", new THREE.Float32BufferAttribute(positions, 3));
  if (uv) g.setAttribute("uv", new THREE.Float32BufferAttribute(uv, 2));
  g.setIndex(indices);
  g.computeVertexNormals();
  g.computeBoundingSphere();
  return g;
}
function surface(nu, nv, fn, closedU = false) {
  const p = [], uv = [], ix = [];
  for (let u = 0; u <= nu; u++) for (let v = 0; v <= nv; v++) {
    const q = fn(u / nu, v / nv);
    p.push(q.x, q.y, q.z);
    uv.push(u / nu, v / nv);
  }
  for (let u = 0; u < nu; u++) for (let v = 0; v < nv; v++) {
    const a = u * (nv + 1) + v, b = a + nv + 1;
    ix.push(a, b, a + 1, b, b + 1, a + 1);
  }
  return geometry(p, ix, uv);
}
function outward(g) {
  const ix = g.index.array;
  for (let i = 0; i < ix.length; i += 3) {
    const a = ix[i + 1];
    ix[i + 1] = ix[i + 2];
    ix[i + 2] = a;
  }
  g.index.needsUpdate = true;
  g.computeVertexNormals();
  return g;
}
function curveMesh(points, radius, material, tubularSegments = 72, radialSegments = 7, closed = false) {
  return new THREE.Mesh(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(points, closed, "catmullrom", 0.5), tubularSegments, radius, radialSegments, closed), material);
}
function deformedBall(radius = 1, detail = 2) {
  const g = new THREE.IcosahedronGeometry(radius, detail), p = g.getAttribute("position");
  for (let i = 0; i < p.count; i++) {
    const x = p.getX(i), y = p.getY(i), z = p.getZ(i), f = 1 + 0.065 * Math.sin(x * 11 + y * 5) * Math.cos(y * 12 - z * 9) + 0.035 * Math.sin(z * 23 + x * 7);
    p.setXYZ(i, x * f, y * f, z * f);
  }
  g.computeVertexNormals();
  return g;
}
function roughFragmentMass(radius = 0.59, detail = 24) {
  const g = new THREE.IcosahedronGeometry(radius, detail), p = g.attributes.position;
  for (let i = 0; i < p.count; i++) {
    const x = p.getX(i) / radius, y = p.getY(i) / radius, z = p.getZ(i) / radius;
    const broad = Math.sin(x * 5.3 + z * 2.1) * Math.cos(y * 5.7 - x * 1.3), middle = Math.sin(x * 14.1 + y * 7.2 + Math.sin(z * 9)) * Math.cos(z * 12.3 - y * 4.7), fine = Math.sin(x * 37.1 - y * 21.7 + z * 29.3) * Math.cos(y * 31.1 + z * 17.9), crease = Math.pow(Math.max(0, Math.cos(x * 11.3 + Math.sin(y * 6.1) + z * 4.3)), 12);
    const r = radius * THREE.MathUtils.clamp(0.8 + 0.105 * broad + 0.065 * middle + 0.027 * fine - 0.075 * crease, 0.5, 0.995);
    p.setXYZ(i, x * r, y * r, z * r);
  }
  g.computeVertexNormals();
  g.computeBoundingSphere();
  return g;
}
function lamellarShard() {
  const parts = [];
  for (let layer = 0; layer < 3; layer++) {
    const g = new THREE.IcosahedronGeometry(1, 2), p2 = g.attributes.position;
    for (let i = 0; i < p2.count; i++) {
      const x = p2.getX(i), y = p2.getY(i), z = p2.getZ(i), f = 0.83 + 0.095 * Math.sin(x * 4.7 + y * 2.3 + layer) * Math.cos(z * 5.1) + 0.04 * Math.sin(x * 13.1 - y * 11.3);
      p2.setXYZ(i, x * f * (1 - 0.065 * layer) + 0.035 * Math.sin(layer * 2.3), y * f * 0.68 + 0.035 * Math.cos(layer * 1.8), z * f * 0.14 + 0.115 * Math.sin(x * 4.1 + y * 3.3 + layer * 0.9) + (layer - 1) * 0.12);
    }
    g.rotateY((layer - 1) * 0.18);
    g.rotateZ((layer - 1) * 0.27);
    parts.push(g);
  }
  const merged = mergeGeometries(parts, false);
  for (const g of parts) g.dispose();
  const p = merged.attributes.position;
  let radius = 0;
  for (let i = 0; i < p.count; i++) radius = Math.max(radius, Math.hypot(p.getX(i), p.getY(i), p.getZ(i)));
  merged.scale(0.985 / radius, 0.985 / radius, 0.985 / radius);
  merged.computeVertexNormals();
  merged.computeBoundingSphere();
  return merged;
}
function smoothShared(g) {
  g.deleteAttribute("normal");
  const welded = mergeVertices(g, 1e-5);
  g.dispose();
  welded.computeVertexNormals();
  welded.computeBoundingSphere();
  return welded;
}
function proteinCluster(detail = 1) {
  const parts = [], centers = [[0, 0, 0], [0.66, 0.16, 0.08], [-0.44, 0.46, 0.18], [-0.18, -0.52, -0.13], [0.22, 0.02, 0.62]];
  for (let i = 0; i < centers.length; i++) {
    const g = deformedBall(0.63 + i * 0.035, detail);
    g.translate(...centers[i]);
    parts.push(g);
  }
  const merged = mergeGeometries(parts, false);
  for (const g of parts) g.dispose();
  return smoothShared(merged);
}
function tag(object, id, pickables) {
  object.userData.organelleId = id;
  object.userData.teachingOnly = true;
  if (object.isMesh) pickables.push(object);
  return object;
}
function createWholeAtlas({ createOrganelle, surfaceTextures = {} } = {}) {
  const group = new THREE.Group();
  group.name = "MacrophageWholeAtlas";
  const pickables = [], organelleLocations = /* @__PURE__ */ new Map(), ownedComponents = [], nuclearPoreSites = [], mitochondria = [], textures = [], materials = [], geometries = [];
  const tex = relief();
  textures.push(tex);
  surfaceTextures = Object.fromEntries(Object.entries(surfaceTextures ?? {}).filter(([key, texture]) => ["membrane", "er", "nuclear", "cargo"].includes(key) && texture?.isTexture).map(([key, texture]) => [key, texture.clone()]));
  const rand = random(3912), v = new THREE.Vector3(), q = new THREE.Quaternion(), s = new THREE.Vector3(), mat4 = new THREE.Matrix4();
  function standard(color, roughness = 0.43, options = {}) {
    const m = new THREE.MeshStandardMaterial({ color, roughness, metalness: 0.015, bumpMap: tex, bumpScale: 0.012, side: THREE.DoubleSide, ...options });
    materials.push(m);
    return m;
  }
  function physical(color, options = {}) {
    const m = new THREE.MeshPhysicalMaterial({ color, roughness: 0.24, metalness: 0.01, side: THREE.DoubleSide, bumpMap: tex, bumpScale: 9e-3, ...options });
    if (m.transparent && m.opacity < 1) {
      m.onBeforeCompile = (shader) => {
        shader.fragmentShader = shader.fragmentShader.replace("#include <alphatest_fragment>", "float membraneFresnel = pow(1.0 - abs(dot(normalize(vViewPosition), normalize(vNormal))), 2.6); diffuseColor.a *= mix(0.24, 1.0, membraneFresnel);\n#include <alphatest_fragment>");
      };
      m.customProgramCacheKey = () => "whole-soft-fresnel-v1";
    }
    materials.push(m);
    return m;
  }
  function add(mesh, id, parent = group) {
    tag(mesh, id, pickables);
    const ms = Array.isArray(mesh.material) ? mesh.material : [mesh.material];
    mesh.castShadow = !mesh.isInstancedMesh && ms.every((m) => !m.transparent);
    mesh.receiveShadow = true;
    parent.add(mesh);
    return mesh;
  }
  function location(id, position, radius) {
    organelleLocations.set(id, { position: new THREE.Vector3(...position), radius, label: LABELS[id] });
  }
  function instance(id, g, m, items, parent = group) {
    const obj = new THREE.InstancedMesh(g, m, items.length);
    items.forEach((item, i) => {
      v.fromArray(item.p);
      s.setScalar(item.r ?? 1);
      if (item.s) s.fromArray(item.s);
      q.setFromEuler(new THREE.Euler(...item.rot ?? [0, 0, 0]));
      mat4.compose(v, q, s);
      obj.setMatrixAt(i, mat4);
      if (item.c) obj.setColorAt(i, new THREE.Color(item.c));
    });
    obj.instanceMatrix.needsUpdate = true;
    add(obj, id, parent);
    return obj;
  }
  const shellPlane = new THREE.Plane(new THREE.Vector3(0, 0, -1), 0.55);
  // Preserve the previous non-membrane random stream; new membrane has its own deterministic control net.
  for (let i = 0; i < 108; i++) rand();
  const plasmaMembrane = createWholeMembraneStatic({ THREE, plane: shellPlane });
  group.add(plasmaMembrane.group);
  const shell = plasmaMembrane.shell;
  tag(shell, "membrane", pickables);
  plasmaMembrane.edge.userData.organelleId = "membrane";
  location("membrane", [-5.75, -2.7, 0.6], 1.2);
  const nc = new THREE.Vector3(-2.25, 1.15, -0.05), nuclearPlaced = component("nucleus", nc.toArray(), 1, [0, 0, 0], 0.48, true);
  let preferredPore = new THREE.Vector3(-3.05, 2.9, 0.6);
  if (nuclearPlaced) {
    nuclearPlaced.holder.scale.set(1.55, 1.83, 1.36);
    nuclearPlaced.holder.updateWorldMatrix(true, true);
    nuclearPlaced.component.setSection(0.48);
    const npc = nuclearPlaced.component.group.getObjectByName("ThirtyTwoEightFoldNPCAssemblies");
    if (npc) {
      npc.userData.organelleId = "pore";
      const matrix = new THREE.Matrix4(), center = new THREE.Vector3(), firstLayer = new THREE.Vector3(), lastLayer = new THREE.Vector3(), candidate = new THREE.Vector3(), target = new THREE.Vector3(-3.05, 2.9, 0.6);
      let best = Infinity;
      for (let pore = 0; pore < 32; pore++) {
        center.set(0, 0, 0);
        firstLayer.set(0, 0, 0);
        lastLayer.set(0, 0, 0);
        for (let i = 0; i < 72; i++) {
          npc.getMatrixAt(pore * 72 + i, matrix);
          candidate.setFromMatrixPosition(matrix);
          center.add(candidate);
          if (i < 24) firstLayer.add(candidate);
          if (i >= 48) lastLayer.add(candidate);
        }
        center.multiplyScalar(1 / 72);
        firstLayer.multiplyScalar(1 / 24);
        lastLayer.multiplyScalar(1 / 24);
        npc.localToWorld(center);
        npc.localToWorld(firstLayer);
        npc.localToWorld(lastLayer);
        const outerCenter = center.clone(), innerCenter = nc.clone().addScaledVector(center.clone().sub(nc), 0.955), npcAxis = lastLayer.clone().sub(firstLayer).normalize();
        nuclearPoreSites.push({ id: pore, position: outerCenter.clone().lerp(innerCenter, 0.5), outerCenter, innerCenter, direction: outerCenter.clone().sub(innerCenter).normalize(), npcAxis, clearRadiusWorld: 0.038, clearanceBasis: "Conservative estimate; selected-pore geometry rays must verify transport clearance.", teachingOnly: true });
        if (center.z > 0.83) continue;
        const score = center.distanceToSquared(target);
        if (score < best) {
          best = score;
          preferredPore.copy(center);
        }
      }
    }
  }
  if (nuclearPlaced) {
    const nucleusRoot = nuclearPlaced.component.group;
    nucleusRoot.traverse((object) => {
      if (object.name === "PerforatedDoubleNuclearMembrane") {
        const list = Array.isArray(object.material) ? object.material : [object.material];
        for (let index = 0; index < list.length; index++) {
          const material = list[index];
          material.color.set(index === 0 ? "#73568f" : index === 1 ? "#7198a7" : "#96b6c1");
          material.roughness = index === 0 ? 0.46 : index === 1 ? 0.45 : 0.48;
          // Every material here belongs to the continuous NE/ER wall.
          // Preserve chromatin/NPC protein maps on their separate meshes.
          material.map = material.bumpMap = material.roughnessMap = null;
          material.bumpScale = 0;
          material.userData.continuousSurfaceV1 = true;
          material.needsUpdate = true;
        }
      }
    });
    const territories = [[-0.56, 0.42, -0.14, 0.42], [0.38, 0.48, -0.17, 0.45], [-0.65, -0.37, -0.21, 0.39], [0.37, -0.42, 0.05, 0.45], [0.05, 0, -0.57, 0.39], [0.67, 0.02, -0.25, 0.3]], chromatin = [];
    for (let i = 0; i < 1700; i++) {
      const territory = territories[i % territories.length];
      let p;
      for (let attempt = 0; attempt < 50; attempt++) {
        p = new THREE.Vector3(territory[0] + (rand() * 2 - 1) * territory[3], territory[1] + (rand() * 2 - 1) * territory[3], territory[2] + (rand() * 2 - 1) * territory[3] * 0.8);
        const localDistance = ((p.x - territory[0]) / territory[3]) ** 2 + ((p.y - territory[1]) / territory[3]) ** 2 + ((p.z - territory[2]) / (territory[3] * 0.8)) ** 2;
        if (localDistance > 1 || p.z > 0.55 || (p.x / 1.16) ** 2 + (p.y / 1.04) ** 2 + (p.z / 0.9) ** 2 > 0.79 || p.distanceTo(new THREE.Vector3(-0.35, -0.05, -0.17)) < 0.4 || p.distanceTo(new THREE.Vector3(0.29, 0.3, -0.22)) < 0.25) continue;
        break;
      }
      chromatin.push({ p: p.toArray(), s: [0.023 + rand() * 0.026, 0.024 + rand() * 0.028, 0.022 + rand() * 0.023], rot: [rand() * 6, rand() * 6, rand() * 6], c: i % 7 === 0 ? "#b391c8" : i % 3 ? "#8c6aa6" : "#705184" });
    }
    instance("nucleus", proteinCluster(0), standard("#ffffff", 0.61, { bumpMap: surfaceTextures.nuclear ?? tex.clone(), bumpScale: 0.018 }), chromatin, nucleusRoot);
  }
  location("nucleus", nc.toArray(), 2.3);
  location("pore", preferredPore.toArray(), 0.55);
  const erGroup = new THREE.Group();
  erGroup.name = "ConnectedERBoundRibosomes";
  group.add(erGroup);
  const erDepth = (a) => 0.82 + 0.18 * Math.sin(a * 3 + 0.5) + 0.1 * Math.sin(a * 5), erTilt = (a) => 0.6 + 0.18 * Math.sin(a * 3 + 0.7) + 0.1 * Math.sin(a * 7);
  const erAngle = (j, t) => THREE.MathUtils.lerp(-2.95 + j * 0.057 + 0.095 * Math.sin(j * 1.3), 1.6 - j * 0.075 + 0.11 * Math.sin(j * 2.1), t);
  function erCenter(j, t) {
    const a = erAngle(j, t), rx = 2.31 + j * 0.2, ry = 2.48 + j * 0.19, warp = 0.16 * Math.sin(a * 5 + j * 0.075) + 0.065 * Math.sin(a * 9 + j * 0.075);
    return new THREE.Vector3(nc.x + (rx + warp) * Math.cos(a), nc.y + (ry + warp) * Math.sin(a), -0.6 + 0.075 * j + 0.16 * Math.sin(a * 2) + 0.1 * Math.sin(a * 5) + 0.025 * Math.sin(j * 0.8));
  }
  const riboMat = standard("#ad80ad", 0.57, { bumpScale: 5e-3 }), ribos = [];
  for (let i = 0; i < 780; i++) {
    const j = Math.floor(rand() * 11), t = 0.025 + rand() * 0.95, a = erAngle(j, t), c = erCenter(j, t);
    c.z += erDepth(a) + 0.025 + rand() * 0.025;
    c.x += Math.cos(a) * (erTilt(a) * Math.min(1, 0.3 + j * 0.33) * erDepth(a) + 0.018 + (rand() - 0.5) * 0.04);
    c.y += Math.sin(a) * (erTilt(a) * Math.min(1, 0.3 + j * 0.33) * erDepth(a) + 0.018 + (rand() - 0.5) * 0.04);
    c.copy(confineERWorldPoint(c));
    ribos.push({ p: c.toArray(), r: 0.03 + rand() * 0.028, s: [0.045 + rand() * 0.027, 0.035 + rand() * 0.02, 0.045 + rand() * 0.02], rot: [rand() * 3, rand() * 3, rand() * 3] });
  }
  instance("ribosome", smoothShared(deformedBall(1, 2)), riboMat, ribos, erGroup);
  location("er", confineERWorldPoint(new THREE.Vector3(-0.42, -0.17, 0.7)).toArray(), 1.5);
  location("ribosome", confineERWorldPoint(new THREE.Vector3(-2.67, -1.48, 0.8)).toArray(), 0.6);
  // Preserve the shared random sequence consumed by the former 42 Golgi
  // carrier placements (five draws each). Other organelles stay byte-identical.
  for (let i = 0; i < 42 * 5; i++) rand();
  // Move the new complete stack forward to avoid the existing ER envelope;
  // uniform scale preserves the TGN tubes' cross-sections and shared lumen.
  const golgiCenter = new THREE.Vector3(0.4, -2.62, 1.85);
  const golgiPlaced = component("golgi", golgiCenter.toArray(), 1.1, [0, 0, 0], 0, false);
  const golgiGroup = golgiPlaced?.holder ?? new THREE.Group();
  golgiGroup.name = "WholeGolgiSevenCisternaeAndTGN";
  if (golgiPlaced) {
    golgiPlaced.component.group.traverse((object) => {
      if (!object.isMesh) return;
      // The collision query recognizes each actual closed boundary, including
      // the new TGN; carrier visibility remains independent of Golgi cisternae.
      object.userData.compartmentBoundary = object.userData.shell === true;
      if (object.userData.secretoryDomain === "carriers") object.userData.componentKey = "transport-vesicles";
    });
    golgiGroup.updateWorldMatrix(true, true);
    const box = new THREE.Box3().setFromObject(golgiGroup), vertex = new THREE.Vector3();
    let radiusFromLocation = 0;
    golgiGroup.traverse((object) => {
      if (!object.isMesh) return;
      const position = object.geometry.attributes.position;
      for (let i = 0; i < position.count; i++) {
        vertex.fromBufferAttribute(position, i).applyMatrix4(object.matrixWorld);
        radiusFromLocation = Math.max(radiusFromLocation, vertex.distanceTo(golgiCenter));
      }
    });
    golgiPlaced.boundsLocal = box;
    golgiPlaced.radiusFromLocation = radiusFromLocation;
    golgiPlaced.boundsCoordinateSpace = "whole-local";
  }
  location("golgi", golgiCenter.toArray(), golgiPlaced?.radiusFromLocation ?? 1.8);
  function component(id, position, scale = 1, rotation = [0, 0, 0], section = 0.72, detail = false) {
    if (typeof createOrganelle !== "function") return null;
    const c = createOrganelle(id, { detail, connectedER: id === "nucleus" });
    if (!c?.group) return null;
    const holder = new THREE.Group();
    holder.position.set(...position);
    holder.scale.setScalar(scale);
    holder.rotation.set(...rotation);
    holder.add(c.group);
    group.add(holder);
    holder.updateWorldMatrix(true, true);
    c.setSection?.(section);
    c.group.traverse((obj) => {
      if (obj.isMesh) {
        tag(obj, id, pickables);
        obj.receiveShadow = true;
        obj.castShadow = !obj.isInstancedMesh;
      }
    });
    ownedComponents.push(c);
    return { component: c, holder };
  }
  const mitoSites = [{ p: [1.5, 3.35, 0.8], scale: 0.96, rot: [0.17, 0.4, -0.48] }, { p: [1.48, -0.38, 1.52], scale: 0.84, rot: [0.13, -0.42, -0.57] }, { p: [-3.5, -3.35, 0.82], scale: 0.83, rot: [0.2, 0.36, -0.42] }, { p: [4.27, -2.45, 0.12], scale: 0.57, rot: [0.1, 0.28, 0.55] }, { p: [3.1, 3.15, -1.8], scale: 0.54, rot: [0.12, 0.1, -0.55] }];
  for (const site of mitoSites) {
    const placed = component("mitochondria", site.p, site.scale, site.rot, 0.78);
    if (placed) mitochondria.push(placed);
  }
  location("mitochondria", mitoSites[0].p, 1.6);
  const lysMat = physical("#b9a0c6", { roughness: 0.12, transparent: false, opacity: 1, transmission: 0.77, thickness: 0.055, ior: 1.35, bumpScale: 3e-3, clearcoat: 1, attenuationColor: new THREE.Color("#cfb6d5"), attenuationDistance: 0.85, depthWrite: true }), lysCargoMat = standard("#8d6c9d", 0.57, { bumpScale: 0.025 }), endoMat = physical("#e9c17f", { roughness: 0.12, transparent: false, opacity: 1, transmission: 0.78, thickness: 0.05, ior: 1.35, bumpScale: 3e-3, clearcoat: 1, depthWrite: true }), peroxiMat = physical("#a4c6b9", { roughness: 0.13, transparent: false, opacity: 1, transmission: 0.76, thickness: 0.055, ior: 1.35, bumpScale: 3e-3, clearcoat: 1, depthWrite: true });
  for (const material of [lysMat, endoMat]) {
    material.bumpMap = null;
    material.bumpScale = 0;
    material.userData.continuousSurfaceV1 = true;
  }
  const vesicleGeo = new THREE.SphereGeometry(1, 36, 26), cargoGeo = deformedBall(1, 2), phagocyticShardGeo = lamellarShard();
  function filledVesicle(id, position, radius, membraneMat, cargoMat, count = 20, variant = 0) {
    const vesicle = new THREE.Group();
    vesicle.position.set(...position);
    group.add(vesicle);
    const wall = add(new THREE.Mesh(vesicleGeo, membraneMat), id, vesicle);
    wall.name = "VesicleMembrane";
    wall.userData.compartmentBoundary = true;
    wall.scale.setScalar(radius);
    const items = [];
    for (let i = 0; i < count; i++) {
      const a = rand() * TAU, z = rand() * 2 - 1, r = Math.cbrt(rand()) * 0.7, sn = Math.sqrt(1 - z * z);
      items.push({ p: [Math.cos(a) * r * sn * radius, Math.sin(a) * r * sn * radius, z * r * radius], r: radius * (0.1 + rand() * 0.11), c: id === "lysosome" ? i % 3 ? "#9a79ad" : "#d9bbcd" : id === "endosome" ? i % 3 ? "#d3a15d" : "#edcb81" : id === "phagosome" ? i % 3 ? "#c4c0b8" : "#e0ddd5" : "#8dad9d" });
    }
    if (id === "phagosome") for (let i = 0; i < items.length; i++) items[i].rot = [i * 1.37, i * 0.71, i * 2.39];
    if (id === "endosome" || id === "lysosome") {
      const domain = createWholeVesicleDomain({ THREE, id, radius, variant, wallMaterial: membraneMat, cargoMaterial: cargoMat, makeMaterial: (color, roughness, options) => physical(color, { roughness, ...options }), shardGeometry: phagocyticShardGeo });
      if (domain.wallGeometry) wall.geometry = domain.wallGeometry;
      vesicle.add(domain.lumen);
      domain.lumen.traverse(object => { if (object.isMesh) tag(object, id, pickables); });
      vesicle.userData.representativeDomain = domain.summary;
      ownedComponents.push({ update: domain.update });
    } else {
      const contents = instance(id, id === "phagosome" ? phagocyticShardGeo : cargoGeo, cargoMat, items, vesicle);
      contents.name = "LumenCargoGranules";
    }
    if (id === "phagosome") vesicle.userData.representativeDomain = { teachingOnly: true, representativeStage: "large-particle-phagosome-to-phagolysosome", contentIdentity: "Large engulfed core plus layered fragments; existing closure, transport, fusion and digestion sequence retained", morphologyIsNotUnique: true };
    return vesicle;
  }
  const lysosomes = [];
  const lysSites = [[3.15, 2.18, 0.88, 0.61], [2.85, -2.7, 1.3, 0.55], [-0.95, -4.32, 0.62, 0.52], [4.4, 1.7, -1.8, 0.45], [-4.78, 0.35, -0.3, 0.42], [0.95, 1.44, 0.2, 0.35]];
  for (let site = 0; site < lysSites.length; site++) {
    const [x, y, z, r] = lysSites[site];
    // Retain docking [0] and fallback [1]; consume the old downstream random
    // stream even when a redundant whole-view teaching instance is removed.
    if (site >= 3) { for (let i = 0; i < 34 * 4; i++) rand(); continue; }
    const vesicle = filledVesicle("lysosome", [x, y, z], r, lysMat, lysCargoMat, 34, site);
    lysosomes.push({ group: vesicle, base: new THREE.Vector3(x, y, z), radius: r });
  }
  location("lysosome", lysSites[0].slice(0, 3), 0.7);
  const endosomeSites = [[3.92, 3.1, 0.24, 0.42], [2.55, 1.08, 0.83, 0.35], [0.36, 4.6, -0.12, 0.34], [2.85, -4.37, 0.38, 0.35], [-4.8, -2.5, 0.2, 0.28], [4.45, -1.25, -1.8, 0.32], [0.04, -4.9, 0.2, 0.31]];
  for (let site = 0; site < endosomeSites.length; site++) {
    const [x, y, z, r] = endosomeSites[site];
    if (site >= 3) { for (let i = 0; i < 12 * 4; i++) rand(); continue; }
    filledVesicle("endosome", [x, y, z], r, endoMat, standard("#d9bc78", 0.53), 12, site);
  }
  location("endosome", [2.55, 1.08, 0.83], 0.5);
  for (const [x, y, z, r] of [[-0.44, -4.22, 1.15, 0.3], [4.05, -1.49, 0.8, 0.3], [-5, 1.5, -0.1, 0.29]]) filledVesicle("peroxisome", [x, y, z], r, peroxiMat, standard("#8ba395", 0.5), 23);
  location("peroxisome", [-0.44, -4.22, 1.15], 0.4);
  const phagoCenter = new THREE.Vector3(4.03, 0.02, 1.3), phagoMat = physical("#f4e3bd", { roughness: 0.05, transparent: false, opacity: 1, transmission: 0.96, thickness: 0.035, ior: 1.2, bumpScale: 4e-3, clearcoat: 1, attenuationColor: new THREE.Color("#fff8ec"), attenuationDistance: 5, depthWrite: true }), phago = filledVesicle("phagosome", phagoCenter.toArray(), 1, phagoMat, standard("#ffffff", 0.82, { bumpScale: 0.025 }), 8);
  const cargo = add(new THREE.Mesh(roughFragmentMass(0.59, 24), standard("#c5c1b8", 0.86, { bumpMap: surfaceTextures.cargo ?? tex, bumpScale: 0.05 })), "phagosome", phago);
  cargo.scale.set(1.04, 1.03, 0.85);
  cargo.name = "PhagosomeParticleBody";
  const fragments = [];
  for (let i = 0; i < 185; i++) {
    const a = rand() * TAU, z = rand() * 2 - 1, r = 0.46 + 0.16 * rand(), sn = Math.sqrt(1 - z * z);
    fragments.push({ p: [Math.cos(a) * r * sn, Math.sin(a) * r * sn, z * r * 0.85], r: 0.035 + rand() * 0.075, rot: [i * 2.399, i * 0.713, i * 1.721], c: i % 7 === 0 ? "#e1ded5" : i % 3 ? "#c7c2b8" : "#a6a197" });
  }
  const phagoFragments = instance("phagosome", phagocyticShardGeo, standard("#ffffff", 0.86, { bumpMap: surfaceTextures.cargo ?? tex, bumpScale: 0.018 }), fragments, phago);
  phagoFragments.name = "PhagosomeParticulateFragments";
  location("phagosome", phagoCenter.toArray(), 1.1);
  const phagoWall = phago.getObjectByName("VesicleMembrane"), dockingLysosome = lysosomes[0], progressPosition = phagoCenter.clone();
  const cupGeometry = surface(42, 64, (u, v2) => {
    const a = u * Math.PI * 0.5, b = v2 * TAU;
    return new THREE.Vector3(-Math.cos(a), Math.sin(a) * Math.cos(b), Math.sin(a) * Math.sin(b));
  });
  const cup = add(new THREE.Mesh(cupGeometry, phagoMat), "phagosome", phago);
  cup.name = "OpenEngulfmentMembraneCup";
  const fusionNV = 56, firstIntervals = 56, secondIntervals = 32;
  const aFar = 0, aRing = (u, w) => 1 + (u - 1) * fusionNV + (w % fusionNV + fusionNV) % fusionNV;
  const aTouch = 1 + (firstIntervals - 1) * fusionNV, bTouch = aTouch + 1;
  const bRing = (u, w) => bTouch + 1 + (u - 1) * fusionNV + (w % fusionNV + fusionNV) % fusionNV;
  const bFar = bTouch + 1 + (secondIntervals - 1) * fusionNV, neck = (w) => bFar + 1 + (w % fusionNV + fusionNV) % fusionNV;
  const vertexCount = bFar + 1 + fusionNV, fusionPositions = new Float32Array(vertexCount * 3), fusionUV = new Float32Array(vertexCount * 2);
  function cap(indices, pole, ring, first) {
    for (let w = 0; w < fusionNV; w++) first ? indices.push(pole, ring(w + 1), ring(w)) : indices.push(ring(w), ring(w + 1), pole);
  }
  function strip(indices, first, second) {
    for (let w = 0; w < fusionNV; w++) {
      const a = first(w), b = second(w), c = first(w + 1), d = second(w + 1);
      indices.push(a, c, b, c, d, b);
    }
  }
  const separateA = [], separateB = [], joinedA = [], joinedB = [];
  for (const ix of [separateA, joinedA]) {
    cap(ix, aFar, (w) => aRing(1, w), true);
    for (let u = 1; u < firstIntervals - 1; u++) strip(ix, (w) => aRing(u, w), (w) => aRing(u + 1, w));
  }
  cap(separateA, aTouch, (w) => aRing(firstIntervals - 1, w), false);
  strip(joinedA, (w) => aRing(firstIntervals - 1, w), neck);
  cap(separateB, bTouch, (w) => bRing(1, w), true);
  strip(joinedB, neck, (w) => bRing(1, w));
  for (const ix of [separateB, joinedB]) {
    for (let u = 1; u < secondIntervals - 1; u++) strip(ix, (w) => bRing(u, w), (w) => bRing(u + 1, w));
    cap(ix, bFar, (w) => bRing(secondIntervals - 1, w), false);
  }
  const fusionGeometry = geometry(fusionPositions, [...separateA, ...separateB], fusionUV);
  const fusionLysMat = lysMat.clone();
  materials.push(fusionLysMat);
  const fusionWall = add(new THREE.Mesh(fusionGeometry, [phagoMat, fusionLysMat]), "phagosome", phago);
  fusionWall.name = "ClosedContinuousPhagolysosomeFusionMembrane";
  fusionWall.userData.organelleByMaterial = { 0: "phagosome", 1: "lysosome" };
  const fusionAxis = new THREE.Vector3(-0.87, 0.493, 0).normalize(), fusionAngle = Math.atan2(fusionAxis.y, fusionAxis.x);
  fusionWall.rotation.z = fusionAngle;
  const cosFusion = Math.cos(fusionAngle), sinFusion = Math.sin(fusionAngle), lysRadius = dockingLysosome.radius;
  const dockingWall = dockingLysosome.group.getObjectByName("VesicleMembrane"), dockingContents = dockingLysosome.group.getObjectByName("LumenCargoGranules");
  dockingWall.visible = false;
  const enzymeSeeds = Array.from({ length: 44 }, (_, i) => ({ sx: (rand() - 0.5) * 0.2, y: (rand() - 0.5) * 0.25, z: (rand() - 0.5) * 0.22, tx: -0.55 + rand() * 1, ty: (rand() - 0.5) * 0.67, tz: (rand() - 0.5) * 0.54, scale: 0.035 + rand() * 0.025, phase: i * 0.61 }));
  const enzymeMaterial = standard("#a58aa6", 0.52), enzymeGeometry = proteinCluster(0), enzymeInstances = new THREE.InstancedMesh(enzymeGeometry, enzymeMaterial, enzymeSeeds.length);
  enzymeInstances.name = "HydrolasesEnteringClosedPhagolysosome";
  add(enzymeInstances, "phagosome", phago);
  enzymeInstances.rotation.z = fusionAngle;
  let progress = NaN, fusionJoined = null;
  const smooth = (x) => {
    const c = THREE.MathUtils.clamp(x, 0, 1);
    return c * c * (3 - 2 * c);
  };
  function updateCup(closure) {
    const p = cupGeometry.attributes.position;
    for (let u = 0; u <= 42; u++) for (let w = 0; w <= 64; w++) {
      const a = u / 42 * THREE.MathUtils.lerp(Math.PI * 0.48, Math.PI, closure), b = w / 64 * TAU, at = u * 65 + w;
      p.setXYZ(at, -Math.cos(a), Math.sin(a) * Math.cos(b), Math.sin(a) * Math.sin(b));
    }
    p.needsUpdate = true;
    cupGeometry.computeVertexNormals();
  }
  function updateFusion(shape, center, joined) {
    if (joined !== fusionJoined) {
      const first = joined ? joinedA : separateA, second = joined ? joinedB : separateB;
      fusionGeometry.setIndex([...first, ...second]);
      fusionGeometry.clearGroups();
      fusionGeometry.addGroup(0, first.length, 0);
      fusionGeometry.addGroup(first.length, second.length, 1);
      fusionJoined = joined;
    }
    const secondRadius = lysRadius - 0.1 * shape, distance = joined ? 1 + secondRadius - 0.49 * shape : center.x, p = fusionGeometry.attributes.position;
    const seamX = joined ? (1 - secondRadius * secondRadius + distance * distance) / (2 * distance) : 1;
    const firstEnd = Math.acos(THREE.MathUtils.clamp(-seamX, -1, 1)), secondStart = joined ? Math.acos(THREE.MathUtils.clamp((distance - seamX) / secondRadius, -1, 1)) : 0;
    const fillet = 0.045 * shape;
    function profile(x) {
      const qa = 1 - x * x, qb = secondRadius * secondRadius - (x - distance) ** 2;
      return Math.sqrt(Math.max(0, Math.max(qa, qb) + (fillet > 0 ? fillet * Math.log1p(Math.exp(-Math.abs(qa - qb) / fillet)) : 0)));
    }
    function circle(at, x, r, dy = 0, dz = 0) {
      for (let w = 0; w < fusionNV; w++) {
        const angle = w / fusionNV * TAU, id = at(w);
        p.setXYZ(id, x, dy + r * Math.cos(angle), dz + r * Math.sin(angle));
        fusionUV[id * 2] = (x + 1) / (distance + secondRadius + 1);
        fusionUV[id * 2 + 1] = w / fusionNV;
      }
    }
    p.setXYZ(aFar, -1, 0, 0);
    p.setXYZ(aTouch, 1, 0, 0);
    for (let u = 1; u < firstIntervals; u++) {
      const theta = (joined ? firstEnd : Math.PI) * u / firstIntervals, x = -Math.cos(theta);
      circle((w) => aRing(u, w), x, joined ? profile(x) : Math.sin(theta));
    }
    const offsetY = joined ? 0 : center.y, offsetZ = joined ? 0 : center.z;
    p.setXYZ(bTouch, distance - secondRadius, offsetY, offsetZ);
    p.setXYZ(bFar, distance + secondRadius, offsetY, offsetZ);
    for (let u = 1; u < secondIntervals; u++) {
      const theta = THREE.MathUtils.lerp(secondStart, Math.PI, u / secondIntervals), x = distance - secondRadius * Math.cos(theta);
      circle((w) => bRing(u, w), x, joined ? profile(x) : secondRadius * Math.sin(theta), offsetY, offsetZ);
    }
    circle(neck, seamX, joined ? profile(seamX) : 0);
    p.needsUpdate = true;
    fusionGeometry.attributes.uv.needsUpdate = true;
    fusionGeometry.computeVertexNormals();
    fusionGeometry.computeBoundingSphere();
    fusionGeometry.setDrawRange(progress < 0.18 ? separateA.length : 0, progress < 0.18 ? separateB.length : Infinity);
    fusionWall.userData.fusion = { joined, neckRadius: joined ? profile(seamX) : 0, contactAt: 0.63, centerDistance: joined ? distance : center.length(), secondRadius, firstIntervals, secondIntervals, circumferentialSegments: fusionNV };
    return { distance, secondRadius };
  }
  const enzymeMatrix = new THREE.Matrix4(), enzymePosition = new THREE.Vector3(), enzymeScale = new THREE.Vector3(), enzymeQuaternion = new THREE.Quaternion(), localLysCenter = new THREE.Vector3(), worldLysCenter = new THREE.Vector3();
  function setProgress(value = 0.44) {
    const next = THREE.MathUtils.clamp(Number(value) || 0, 0, 1);
    if (next === progress) return;
    progress = next;
    const transport = smooth(progress / 0.48), entry = new THREE.Vector3(6.48, 0.3, 1.3);
    progressPosition.copy(entry).lerp(phagoCenter, transport);
    phago.position.copy(progressPosition);
    const closure = smooth(progress / 0.18), docking = smooth((progress - 0.45) / 0.18), joined = progress >= 0.63, fusion = smooth((progress - 0.63) / 0.2), digestion = smooth((progress - 0.72) / 0.28);
    cup.visible = progress < 0.18;
    phagoWall.visible = false;
    if (cup.visible) updateCup(closure);
    worldLysCenter.copy(dockingLysosome.base).lerp(progressPosition.clone().addScaledVector(fusionAxis, 1 + lysRadius), docking);
    const dx = worldLysCenter.x - progressPosition.x, dy = worldLysCenter.y - progressPosition.y;
    localLysCenter.set(cosFusion * dx + sinFusion * dy, -sinFusion * dx + cosFusion * dy, worldLysCenter.z - progressPosition.z);
    const shape = updateFusion(fusion, localLysCenter, joined);
    if (joined) {
      localLysCenter.set(shape.distance, 0, 0);
      worldLysCenter.copy(progressPosition).addScaledVector(fusionAxis, shape.distance);
    }
    dockingLysosome.group.visible = true;
    dockingLysosome.group.position.copy(worldLysCenter);
    dockingContents.scale.setScalar(shape.secondRadius / lysRadius);
    const residue = THREE.MathUtils.lerp(1, 0.29, digestion);
    cargo.scale.set(1.04 * residue, 1.03 * residue, 0.85 * residue);
    phagoFragments.scale.setScalar(residue);
    const preexistingCargo = phago.getObjectByName("LumenCargoGranules");
    preexistingCargo.scale.setScalar(residue);
    let transferred = 0;
    for (let i = 0; i < enzymeSeeds.length; i++) {
      const e = enzymeSeeds[i], travel = smooth((progress - (0.685 + i / enzymeSeeds.length * 0.065)) / 0.235), sourceScale = shape.secondRadius / lysRadius;
      enzymePosition.set(THREE.MathUtils.lerp(localLysCenter.x + e.sx * sourceScale, e.tx, travel), THREE.MathUtils.lerp(localLysCenter.y + e.y * sourceScale, e.ty, travel), THREE.MathUtils.lerp(localLysCenter.z + e.z * sourceScale, e.tz, travel));
      enzymeScale.setScalar(e.scale);
      enzymeQuaternion.setFromEuler(new THREE.Euler(e.phase, e.phase * 0.7, e.phase * 0.3));
      enzymeMatrix.compose(enzymePosition, enzymeQuaternion, enzymeScale);
      enzymeInstances.setMatrixAt(i, enzymeMatrix);
      if (travel > 0.95) transferred++;
    }
    enzymeInstances.instanceMatrix.needsUpdate = true;
    organelleLocations.get("phagosome").position.copy(progressPosition);
    organelleLocations.get("lysosome").position.copy(joined ? lysosomes[1].base : worldLysCenter);
    group.userData.journey = { progress, phase: progress < 0.18 ? "engulfment_open_cup" : progress < 0.45 ? "closed_phagosome_transport" : progress < 0.63 ? "lysosome_docking" : progress < 0.72 ? "closed_fusion_compartment" : "enzymatic_digestion", membraneClosed: progress >= 0.18, cargoResidualScale: residue, enzymesInsideClosedCompartment: true, transferredHydrolases: transferred, totalHydrolases: enzymeSeeds.length };
  }
  setProgress(0.44);
  const goldTrack = standard("#c5ad76", 0.46, { transparent: true, opacity: 0.71 }), blueTrack = standard("#9ebcc3", 0.49, { transparent: true, opacity: 0.6 }), filamentMat = standard("#a7bdc0", 0.62, { transparent: true, opacity: 0.47 });
  const microtubuleTracks = [];
  for (let k = 0; k < 54; k++) {
    const a = k / 54 * TAU + rand() * 0.2, end = new THREE.Vector3(Math.cos(a) * (5.2 + rand() * 0.7), Math.sin(a) * (5.3 + rand() * 0.6), -0.9 + rand() * 0.7), start = new THREE.Vector3(0.25 + rand() * 0.3, -0.72 + rand() * 0.4, -0.42), middle = start.clone().lerp(end, 0.56).add(new THREE.Vector3(0.3 * Math.sin(k), 0.25 * Math.cos(k), -0.3));
    microtubuleTracks.push([start.clone(), middle.clone(), end.clone()]);
    const line = curveMesh([start, middle, end], k % 5 === 0 ? 0.024 : 0.014, k % 3 === 0 ? blueTrack : goldTrack, 58, 5);
    line.userData.componentKey = "microtubules";
    add(line, "cytoskeleton");
  }
  for (let k = 0; k < 80; k++) {
    const a = rand() * TAU, b = a + 0.18 + rand() * 0.55, r = 5.4 + rand() * 0.3, pts = [];
    for (let i = 0; i < 9; i++) {
      const t = i / 8, ang = THREE.MathUtils.lerp(a, b, t);
      pts.push(new THREE.Vector3(Math.cos(ang) * r, Math.sin(ang) * r, 0.1 + 0.3 * Math.sin(t * Math.PI + k)));
    }
    const line = curveMesh(pts, 9e-3, filamentMat, 26, 4);
    line.userData.componentKey = "actin";
    add(line, "cytoskeleton");
  }
  location("cytoskeleton", [3.45, -3.6, 0.5], 1.3);
  const granuleMat = standard("#ffffff", 0.57, { bumpScale: 5e-3 }), granuleGeo = proteinCluster(), grains = [], colors = ["#8fafc2", "#bba4ce", "#d7bba4", "#87a8b2", "#bd98bb", "#d8c58f", "#bdc9d0"];
  for (let i = 0; i < 1800; i++) {
    let x, y, z;
    for (let tries = 0; tries < 60; tries++) {
      x = (rand() * 2 - 1) * 5.7;
      y = (rand() * 2 - 1) * 5.8;
      z = -1.85 + rand() * 2.55;
      if ((x / 5.7) ** 2 + (y / 5.8) ** 2 + (z / 3.9) ** 2 > 0.9) continue;
      if (((x - nc.x) / 2.45) ** 2 + ((y - nc.y) / 2.65) ** 2 + ((z - nc.z) / 1.7) ** 2 < 1) continue;
      break;
    }
    grains.push({ p: [x, y, z], s: [0.04 + rand() * 0.038, 0.04 + rand() * 0.037, 0.04 + rand() * 0.025], rot: [rand() * 6, rand() * 6, rand() * 6], c: colors[i % colors.length] });
  }
  const molecularCrowd = instance("ribosome", granuleGeo, granuleMat, grains);
  molecularCrowd.name = "PrescribedCytoplasmicMolecularDrift";
  molecularCrowd.userData.organelleId = "cytoplasm";
  molecularCrowd.userData.pickThrough = true;
  pickables.splice(pickables.indexOf(molecularCrowd), 1);
  const driftBases = grains.map((grain, i) => {
    const base = new THREE.Vector3(...grain.p), cellQ = (base.x / 5.7) ** 2 + (base.y / 5.8) ** 2 + (base.z / 3.9) ** 2, nuclearQ = ((base.x - nc.x) / 2.45) ** 2 + ((base.y - nc.y) / 2.65) ** 2 + ((base.z - nc.z) / 1.7) ** 2;
    let fade = THREE.MathUtils.clamp((0.9 - cellQ) / 0.2, 0, 1) * THREE.MathUtils.clamp((nuclearQ - 1) / 0.3, 0, 1);
    for (const vesicle of lysosomes) fade *= THREE.MathUtils.clamp((base.distanceTo(vesicle.base) - vesicle.radius - 0.15) / 0.25, 0, 1);
    const segmentX = THREE.MathUtils.clamp(base.x, phagoCenter.x, 6.48), journeyDistance = base.distanceTo(new THREE.Vector3(segmentX, 0.02 + (segmentX - phagoCenter.x) / 2.45 * 0.28, 1.3));
    fade *= THREE.MathUtils.clamp((journeyDistance - 1.15) / 0.25, 0, 1);
    return { base, scale: new THREE.Vector3(...grain.s), rotation: new THREE.Quaternion().setFromEuler(new THREE.Euler(...grain.rot)), amplitude: 0.027 * fade, phase: i * 1.781 };
  });
  const corticalMolecules = [];
  for (let i = 0; i < 470; i++) {
    const a = rand() * TAU, r = 5.45 + rand() * 0.3;
    corticalMolecules.push({ p: [Math.cos(a) * r, Math.sin(a) * r, -1.25 + rand() * 2], r: 0.034 + rand() * 0.045, c: colors[i % colors.length] });
  }
  const corticalCrowd = instance("membrane", granuleGeo, standard("#ffffff", 0.49, { bumpScale: 5e-3 }), corticalMolecules);
  corticalCrowd.name = "CorticalMolecularCrowding";
  corticalCrowd.userData.pickThrough = true;
  corticalCrowd.userData.organelleId = "cytoplasm";
  pickables.splice(pickables.indexOf(corticalCrowd), 1);
  function batchStatic(parent, id, filter = () => true) {
    parent.updateWorldMatrix(true, true);
    const buckets = /* @__PURE__ */ new Map();
    for (const object of [...parent.children]) if (object.isMesh && !object.isInstancedMesh && filter(object)) {
      const key = object.material;
      if (!buckets.has(key)) buckets.set(key, new Map());
      const byComponent = buckets.get(key), componentKey = object.userData.componentKey ?? "";
      if (!byComponent.has(componentKey)) byComponent.set(componentKey, []);
      byComponent.get(componentKey).push(object);
    }
    for (const [material, byComponent] of buckets) for (const [componentKey, objects] of byComponent) {
      if (objects.length < 2) continue;
      const copies = objects.map((object) => object.geometry.clone().applyMatrix4(object.matrix));
      const merged = mergeGeometries(copies, false);
      for (const copy of copies) copy.dispose();
      if (!merged) continue;
      for (const object of objects) {
        parent.remove(object);
        const i = pickables.indexOf(object);
        if (i >= 0) pickables.splice(i, 1);
        object.geometry.dispose();
      }
      const mesh = add(new THREE.Mesh(merged, material), id, parent);
      mesh.name = "BatchedStatic" + id;
      if (componentKey) mesh.userData.componentKey = componentKey;
    }
  }
  batchStatic(erGroup, "er");
  batchStatic(golgiGroup, "golgi");
  batchStatic(group, "cytoskeleton", (object) => object.userData.organelleId === "cytoskeleton");
  let sectionAmount = 0.71, disposed = false;
  function setSection(amount = 0.71) {
    sectionAmount = THREE.MathUtils.clamp(Number(amount) || 0, 0, 1);
    const z = THREE.MathUtils.lerp(5.6, -1.2, sectionAmount);
    plasmaMembrane.setSection(z);
    group.userData.sectionAmount = sectionAmount;
  }
  function surfaceRadius(direction) {
    const d = direction.clone().normalize();
    if (!Number.isFinite(d.x + d.y + d.z) || d.lengthSq() < 0.5) return NaN;
    group.updateWorldMatrix(true, true);
    const center = group.getWorldPosition(new THREE.Vector3()), ray = new THREE.Raycaster(center.clone().addScaledVector(d, 12), d.clone().negate(), 0, 24), hit = ray.intersectObject(shell, false)[0];
    return hit ? hit.point.distanceTo(center) : NaN;
  }
  function update(t, dt = 0) {
    if (disposed || dt <= 0) return;
    plasmaMembrane.update();
    if(!group.userData.sharedCytoplasmMotion) for (let i = 0; i < driftBases.length; i++) {
      const d = driftBases[i], a = d.amplitude, phase = d.phase;
      v.copy(d.base);
      v.x += a * (Math.sin(t * 0.43 + phase) - Math.sin(phase));
      v.y += a * (Math.sin(t * 0.57 + phase * 0.71) - Math.sin(phase * 0.71));
      v.z += a * 0.65 * (Math.sin(t * 0.39 + phase * 0.37) - Math.sin(phase * 0.37));
      mat4.compose(v, d.rotation, d.scale);
      molecularCrowd.setMatrixAt(i, mat4);
    }
    molecularCrowd.instanceMatrix.needsUpdate = true;
    for (const c of ownedComponents) c.update?.(t, dt);
  }
  function dispose() {
    if (disposed) return;
    disposed = true;
    plasmaMembrane.dispose();
    for (const c of ownedComponents) c.dispose?.();
    const gs = /* @__PURE__ */ new Set(), ms = /* @__PURE__ */ new Set(), ts = new Set(textures);
    group.traverse((obj) => {
      if (obj.isInstancedMesh) obj.dispose();
      if (obj.geometry) gs.add(obj.geometry);
      for (const m of Array.isArray(obj.material) ? obj.material : [obj.material]) if (m) {
        ms.add(m);
        for (const value of Object.values(m)) if (value?.isTexture) ts.add(value);
      }
    });
    for (const g of gs) g.dispose();
    for (const m of ms) m.dispose();
    for (const t of ts) t.dispose();
    group.clear();
  }
  group.userData = { ...group.userData, teachingOnly: true, description: "Reference-directed 3D macrophage cutaway; enlarged organelle and molecular proportions for exhibition. All surfaces are meshes, not a raster backdrop.", sectionAmount, foldPatches: plasmaMembrane.diagnostics().foldPatches };
  group.updateWorldMatrix(true, true);
  return { group, pickables, organelleLocations, setSection, setProgress, surfaceRadius, membraneSurface: plasmaMembrane.membraneSurface, plasmaMembrane, update, dispose, radius: 7.8, components: { nucleus: nuclearPlaced, golgi: golgiPlaced, mitochondria, lysosomes, microtubuleTracks }, nuclearPoreSites, metadata: { teachingOnly: true, organelleCount: organelleLocations.size, foldPatches: plasmaMembrane.diagnostics().foldPatches, representativeVesicleCounts: { lysosome: 3, endosome: 3, phagosome: 1, peroxisome: 3 }, vesicleTeachingScope: "Representative stages and content domains; shapes overlap and displayed counts are not an abundance measurement", erCisternae: 11, erIntercisternalSharedNecks: 20, continuousNuclearER: true, nuclearSharedPorts: 1, nuclearPores: 32, golgiCisternae: golgiPlaced?.component.stats.cisternae ?? 0, golgiTGN: Boolean(golgiPlaced?.component.stats.continuousTGN), mitochondria: mitoSites.length } };
}
export {
  createWholeAtlas
};
