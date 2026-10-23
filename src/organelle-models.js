import * as THREE from "three";
import { buildPlasmaMembraneDetail } from "./plasma-membrane-detail.js";
import { createContinuousMitoCore } from "./atlas-geometry.js";
import { createNuclearERGeometry } from "./nuclear-er-continuum.js";
import { attachSmoothERNetwork, attachSERToNuclearER } from "./er-smooth-network.js";
import { createTransGolgiNetwork } from "./secretory-golgi-network.js";
import MICRO_TEXTURES from "./micro-texture-data.js";
import ER_PLACEMENTS from "./er-placement-data.js";
import MITO_PLACEMENTS from "./mito-placement-data.js";
const decodedMicro = /* @__PURE__ */ new Map();
let buildTexturePool = null;
function microTexture(kind = "membrane", repeat = 1.4) {
  const key = kind + ":" + repeat;
  if (buildTexturePool?.has(key)) return buildTexturePool.get(key);
  let data = decodedMicro.get(kind);
  if (!data) {
    const bytes = atob(MICRO_TEXTURES[kind] ?? MICRO_TEXTURES.membrane);
    data = new Uint8Array(bytes.length);
    for (let i = 0; i < bytes.length; i++) data[i] = bytes.charCodeAt(i);
    decodedMicro.set(kind, data);
  }
  const texture = new THREE.DataTexture(data, 256, 256, THREE.RGBAFormat);
  texture.wrapS = texture.wrapT = THREE.RepeatWrapping;
  texture.repeat.set(repeat, repeat);
  texture.minFilter = THREE.LinearMipmapLinearFilter;
  texture.magFilter = THREE.LinearFilter;
  texture.generateMipmaps = true;
  texture.anisotropy = 4;
  texture.needsUpdate = true;
  if (buildTexturePool) buildTexturePool.set(key, texture);
  return texture;
}
function softAlbedo(grain, strength = 0.58) {
  const key = grain.uuid + ":albedo:" + strength;
  if (buildTexturePool?.has(key)) return buildTexturePool.get(key);
  const source = grain.image.data, bytes = new Uint8Array(source.length);
  for (let i = 0; i < bytes.length; i += 4) {
    bytes[i] = Math.round(255 + (source[i] - 255) * strength);
    bytes[i + 1] = Math.round(255 + (source[i + 1] - 255) * strength);
    bytes[i + 2] = Math.round(255 + (source[i + 2] - 255) * strength);
    bytes[i + 3] = 255;
  }
  const texture = new THREE.DataTexture(bytes, grain.image.width, grain.image.height, THREE.RGBAFormat);
  texture.wrapS = texture.wrapT = THREE.RepeatWrapping;
  texture.repeat.copy(grain.repeat);
  texture.generateMipmaps = true;
  texture.minFilter = THREE.LinearMipmapLinearFilter;
  texture.anisotropy = 4;
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.needsUpdate = true;
  if (buildTexturePool) buildTexturePool.set(key, texture);
  return texture;
}
const poreCoordinateCenters = /* @__PURE__ */ new Map();
function roundPoreCoordinates(u, v, nu, nv) {
  const key = nu + ":" + nv;
  let centers = poreCoordinateCenters.get(key);
  if (!centers) {
    centers = [];
    for (let row = 0; row < 4; row++) for (let k = 0; k < 8; k++) centers.push([Math.round(nu * (0.2 + row * 0.19)), Math.round((k + row % 2 * 0.5) / 8 * nv)]);
    poreCoordinateCenters.set(key, centers);
  }
  for (const [cu, cv] of centers) {
    const du = u - cu, dv = ((v - cv + nv * 0.5) % nv + nv) % nv - nv * 0.5, nx = du, ny = dv * 0.5, r = Math.max(Math.abs(nx), Math.abs(ny));
    if (r < 1e-9 || r >= 2.25) continue;
    const qx = nx / r, qy = ny / r, factor = 1 / Math.hypot(qx, qy), raw = Math.min(1, (2.25 - r) / 1.25), weight = raw * raw * (3 - 2 * raw);
    return { u: u + du / r * (factor - 1) * weight, v: v + dv / r * (factor - 1) * weight };
  }
  return { u, v };
}
const TAU = Math.PI * 2, clamp = THREE.MathUtils.clamp;
const V = (x = 0, y = 0, z = 0) => new THREE.Vector3(x, y, z);
const noise = (x, y, z) => Math.sin(x * 13.1 + y * 7.7 + z * 9.3) * 0.48 + Math.sin(x * 29.7 - y * 17.3 + z * 22.1) * 0.27 + Math.sin(x * 61.3 + y * 43.1 - z * 37.7) * 0.15;
function rng(seed) {
  return () => {
    seed = seed * 1664525 + 1013904223 >>> 0;
    return seed / 4294967296;
  };
}
function pointsInBall(count, random, radius = 1) {
  const a = [];
  while (a.length < count) {
    const p = V((random() * 2 - 1) * radius, (random() * 2 - 1) * radius, (random() * 2 - 1) * radius);
    if (p.length() < radius) a.push(p);
  }
  return a;
}
function physical(color, extra = {}) {
  const grain = microTexture("membrane", 1.8), albedo = softAlbedo(grain, 0.62);
  return new THREE.MeshPhysicalMaterial({ color, roughness: 0.48, metalness: 8e-3, clearcoat: 0.38, clearcoatRoughness: 0.29, side: THREE.DoubleSide, envMapIntensity: 0.85, map: albedo, bumpMap: grain, bumpScale: 26e-4, roughnessMap: grain, ...extra });
}
// Keep existing membrane shape and color; repeated art samples are not anatomy.
function continuousMembrane(color, extra = {}) {
  const material = physical(color, { roughness: 0.46, clearcoat: 0.2, clearcoatRoughness: 0.4, map: null, bumpMap: null, bumpScale: 0, roughnessMap: null, ...extra });
  material.userData.atlasMaterialRole = "membrane";
  material.userData.continuousSurfaceV1 = true;
  return material;
}
function relief(seed = 1, size = 128) {
  return microTexture(seed === 3 ? "nuclear" : seed === 8 || seed === 17 ? "reticulum" : seed === 9 ? "cargo" : "membrane", seed === 3 ? 1.4 : 1.8);
}
function geoData(p, idx, uv = []) {
  const g = new THREE.BufferGeometry();
  g.setAttribute("position", new THREE.Float32BufferAttribute(p, 3));
  if (uv.length) g.setAttribute("uv", new THREE.Float32BufferAttribute(uv, 2));
  const clean = [];
  for (let i = 0; i < idx.length; i += 3) {
    const a = idx[i] * 3, b = idx[i + 1] * 3, c = idx[i + 2] * 3, ux = p[b] - p[a], uy = p[b + 1] - p[a + 1], uz = p[b + 2] - p[a + 2], vx = p[c] - p[a], vy = p[c + 1] - p[a + 1], vz = p[c + 2] - p[a + 2], cx = uy * vz - uz * vy, cy = uz * vx - ux * vz, cz = ux * vy - uy * vx;
    if (cx * cx + cy * cy + cz * cz > 1e-18) clean.push(idx[i], idx[i + 1], idx[i + 2]);
  }
  g.setIndex(clean);
  g.computeVertexNormals();
  g.computeBoundingSphere();
  return g;
}
function organicSphere(radius = 1, segments = 48, amplitude = 0.025, seed = 0, axes = V(1, 1, 1)) {
  const g = new THREE.SphereGeometry(radius, segments, Math.round(segments * 0.65)), p = g.attributes.position;
  for (let i = 0; i < p.count; i++) {
    const x = p.getX(i), y = p.getY(i), z = p.getZ(i), n = 1 + amplitude * noise(x * 1.8 + seed, y * 1.8, z * 1.8);
    p.setXYZ(i, x * n * axes.x, y * n * axes.y, z * n * axes.z);
  }
  g.computeVertexNormals();
  return g;
}
function sphere(parent, geometry, material, position = V(), scale = V(1, 1, 1), name = "") {
  const mesh = new THREE.Mesh(geometry, material);
  mesh.position.copy(position);
  mesh.scale.copy(scale);
  mesh.name = name;
  parent.add(mesh);
  return mesh;
}
function tube(parent, points, radius, material, { segments = 64, sides = 8, closed = false, name = "" } = {}) {
  const curve = new THREE.CatmullRomCurve3(points, closed, "centripetal"), g = new THREE.TubeGeometry(curve, segments, radius, sides, closed), m = new THREE.Mesh(g, material);
  m.name = name;
  parent.add(m);
  return m;
}
function beads(parent, points, radius, material, { segments = 8, scales = null, colors = null, orient = true, organic = true, name = "" } = {}) {
  const geo = organic ? organicSphere(radius, segments, 0.045, 2) : new THREE.SphereGeometry(radius, segments, Math.max(4, segments >> 1)), mesh = new THREE.InstancedMesh(geo, material, points.length), o = new THREE.Object3D();
  points.forEach((p, i) => {
    o.position.copy(p);
    o.scale.copy(scales?.[i] ?? V(1, 1, 1));
    o.rotation.set(orient ? i * 0.37 : 0, orient ? i * 0.71 : 0, orient ? i * 0.53 : 0);
    o.updateMatrix();
    mesh.setMatrixAt(i, o.matrix);
    if (colors) mesh.setColorAt(i, new THREE.Color(colors[i]));
  });
  mesh.name = name;
  mesh.instanceMatrix.needsUpdate = true;
  parent.add(mesh);
  return mesh;
}
function cylinderBetween(parent, a, b, radius, material, sides = 10) {
  const d = b.clone().sub(a), m = new THREE.Mesh(new THREE.CylinderGeometry(radius, radius, d.length(), sides, 1, true), material);
  m.position.copy(a).add(b).multiplyScalar(0.5);
  m.quaternion.setFromUnitVectors(V(0, 1, 0), d.normalize());
  parent.add(m);
  return m;
}
function membraneSurface(parent, color, detail, { radius = 1, axes = V(1, 1, 1), seed = 1, thickness = 0.026, continuous = false } = {}) {
  const map = relief(seed), mat = continuous ? continuousMembrane(color, { roughness: 0.43, clearcoat: 0.24 }) : physical(color, { bumpMap: map, bumpScale: detail ? 6e-3 : 5e-3, roughness: 0.32, clearcoat: 0.55 }), outer = sphere(parent, organicSphere(radius, detail ? 96 : 36, 0.014, seed, axes), mat);
  outer.userData.shell = true;
  const innerMat = continuous ? continuousMembrane(color, { roughness: 0.54, clearcoat: 0.12 }) : physical(color, { roughness: 0.48, bumpMap: map, bumpScale: 8e-3 }), inner = sphere(parent, organicSphere(radius - thickness, detail ? 80 : 30, 0.013, seed, axes), innerMat);
  inner.userData.shell = true;
  return { outer, inner, mat, innerMat, map };
}
function cisterna(width, depth, thickness, level, phase = 0, detail = true) {
  const p = [], idx = [], uv = [], nu = detail ? 32 : 14, nv = detail ? 112 : 48;
  for (let i = 0; i <= nu; i++) {
    const phi = i / nu * Math.PI, r = Math.sin(phi), sy = Math.cos(phi);
    for (let j = 0; j <= nv; j++) {
      const a = j / nv * TAU, rim = 1 + 0.047 * Math.sin(a * 5 + phase) + 0.023 * Math.sin(a * 9 - phase), x = width * r * Math.cos(a) * rim, z = depth * r * Math.sin(a) * rim, y = level + thickness * sy + 0.23 * (r * r) + 0.035 * Math.sin(a * 3 + phase) * r * r + 0.018 * noise(x, ySafe(level), z) * r;
      p.push(x, y, z);
      uv.push(j / nv, i / nu);
      if (i < nu && j < nv) {
        const s = i * (nv + 1) + j;
        idx.push(s, s + 1, s + nv + 1, s + 1, s + nv + 2, s + nv + 1);
      }
    }
  }
  return geoData(p, idx, uv);
}
function ySafe(v) {
  return Number.isFinite(v) ? v : 0;
}
function foldedReticulum(detail, material) {
  const guides = [], levels = detail ? 7 : 5;
  for (let k = 0; k < levels; k++) {
    const reverse = k % 2 === 1;
    for (let j = 0; j < 18; j++) {
      const q = reverse ? 1 - j / 17 : j / 17, a = (0.16 + q * 1.68) * Math.PI, r = 0.93 + 0.055 * Math.sin(a * 3 + k * 0.4);
      guides.push(V(Math.cos(a) * r, -0.87 + k * 0.255 + 0.035 * Math.cos(a * 2 + k), Math.sin(a) * r * 0.69));
    }
  }
  const curve = new THREE.CatmullRomCurve3(guides, false, "centripetal"), nu = detail ? 700 : 280, nv = detail ? 24 : 12, p = [], uv = [], idx = [];
  let prev = V(1, 0, 0);
  for (let i = 0; i <= nu; i++) {
    const t = i / nu, c = curve.getPoint(t), tangent = curve.getTangent(t).normalize();
    let radial = V().crossVectors(V(0, 1, 0), tangent);
    if (radial.length() < 0.1) radial.copy(prev);
    radial.normalize();
    if (radial.dot(prev) < 0) radial.negate();
    prev.copy(radial);
    const up = V().crossVectors(tangent, radial).normalize(), width = 0.34 + 0.045 * Math.sin(t * 31), height = 0.042 + 8e-3 * Math.sin(t * 47);
    for (let j = 0; j < nv; j++) {
      const a = j / nv * TAU, v = c.clone().addScaledVector(radial, Math.cos(a) * width).addScaledVector(up, Math.sin(a) * height);
      p.push(v.x, v.y, v.z);
      uv.push(j / nv, t * 8);
      if (i < nu) {
        const a0 = i * nv + j, b = i * nv + (j + 1) % nv, c0 = a0 + nv, d = b + nv;
        idx.push(a0, c0, b, b, c0, d);
      }
    }
  }
  for (const end of [0, nu]) {
    const center = p.length / 3, c = curve.getPoint(end / nu);
    p.push(c.x, c.y, c.z);
    uv.push(0.5, end / nu);
    for (let j = 0; j < nv; j++) {
      const a = end * nv + j, b = end * nv + (j + 1) % nv;
      end === 0 ? idx.push(center, a, b) : idx.push(center, b, a);
    }
  }
  for (let i = 0; i < idx.length; i += 3) {
    const hold = idx[i + 1];
    idx[i + 1] = idx[i + 2];
    idx[i + 2] = hold;
  }
  const mesh = new THREE.Mesh(geoData(p, idx, uv), material);
  mesh.name = "OneContinuousFoldedERMembrane";
  mesh.userData.shell = true;
  return { mesh, curve, levels };
}
function nuclearPoint(u, v, nu, nv, inner = false) {
  const rounded = roundPoreCoordinates(u, v, nu, nv);
  u = rounded.u;
  v = rounded.v;
  const phi = u / nu * Math.PI, a = v / nv * TAU, s = Math.sin(phi), x = Math.cos(a) * s, y = Math.cos(phi), z = Math.sin(a) * s, indent = 1 - 0.25 * Math.exp(-((x - 0.8) ** 2 / 0.14 + y * y / 0.42)), scale = inner ? 0.955 : 1, n = 1 + 9e-3 * noise(x * 3, y * 3, z * 3);
  return V(x * 1.34 * indent * n * scale, y * 1.22 * n * scale, z * 1.1 * n * scale);
}
function perforatedNucleus(detail) {
  const nu = detail ? 80 : 40, nv = detail ? 160 : 80, ports = [];
  for (let row = 0; row < 4; row++) for (let k = 0; k < 8; k++) {
    const uc = Math.round(nu * (0.2 + row * 0.19)), vc = Math.round((k + row % 2 * 0.5) / 8 * nv);
    ports.push({ u0: uc - 1, u1: uc + 1, v0: vc + nv - 2, v1: vc + nv + 2 });
  }
  const p = [], uv = [], idx = [];
  const vertex = (u, v, inner) => (inner ? (nu + 1) * nv : 0) + u * nv + (v % nv + nv) % nv;
  for (const inner of [false, true]) for (let u = 0; u <= nu; u++) for (let v = 0; v < nv; v++) {
    const q = nuclearPoint(u, v, nu, nv, inner);
    p.push(q.x, q.y, q.z);
    uv.push(v / nv, u / nu);
  }
  for (const inner of [false, true]) for (let u = 0; u < nu; u++) for (let v = 0; v < nv; v++) {
    const skip = ports.some((h) => u >= h.u0 && u < h.u1 && ((v - h.v0) % nv + nv) % nv < h.v1 - h.v0);
    if (skip) continue;
    const a = vertex(u, v, inner), b = vertex(u + 1, v, inner), c = vertex(u, v + 1, inner), d = vertex(u + 1, v + 1, inner);
    inner ? idx.push(a, b, c, c, b, d) : idx.push(a, c, b, c, d, b);
  }
  const poreSites = [];
  for (const h of ports) {
    const ring = [];
    for (let u = h.u0; u <= h.u1; u++) ring.push([u, h.v0]);
    for (let v = h.v0 + 1; v <= h.v1; v++) ring.push([h.u1, v]);
    for (let u = h.u1 - 1; u >= h.u0; u--) ring.push([u, h.v1]);
    for (let v = h.v1 - 1; v > h.v0; v--) ring.push([h.u0, v]);
    for (let k = 0; k < ring.length; k++) {
      const [u, v] = ring[k], [un, vn] = ring[(k + 1) % ring.length], a = vertex(u, v, false), b = vertex(un, vn, false), c = vertex(u, v, true), d = vertex(un, vn, true);
      idx.push(a, c, b, b, c, d);
    }
    const center = nuclearPoint((h.u0 + h.u1) * 0.5, (h.v0 + h.v1) * 0.5, nu, nv), normal = center.clone().multiply(V(1 / 1.34 ** 2, 1 / 1.22 ** 2, 1 / 1.1 ** 2)).normalize();
    poreSites.push({ position: center, normal });
  }
  return { geometry: geoData(p, idx, uv), poreSites };
}
function poreComplex(detail, { scale = 1, color = "#8e7b99", membrane = true } = {}) {
  const group = new THREE.Group(), mat = physical(color, { roughness: 0.4 }), beadMat = physical("#a79aaf", { roughness: 0.48 });
  if (membrane) {
    const s = new THREE.Shape();
    s.absarc(0, 0, 1.22, 0, TAU, false);
    const h = new THREE.Path();
    h.absarc(0, 0, 0.57, 0, TAU, true);
    s.holes.push(h);
    const g = new THREE.ExtrudeGeometry(s, { depth: 0.13, bevelEnabled: true, bevelSegments: 3, steps: 1, bevelSize: 0.035, bevelThickness: 0.025, curveSegments: 80 });
    g.translate(0, 0, -0.065);
    const patch = new THREE.Mesh(g, continuousMembrane("#8e82ac", { roughness: 0.46, clearcoat: 0.2 }));
    patch.userData.shell = true;
    group.add(patch);
  }
  const points = [], scales = [];
  for (let level = 0; level < 3; level++) for (let i = 0; i < 8; i++) {
    const a = i / 8 * TAU, r = 0.55;
    for (let n = 0; n < (detail ? 5 : 2); n++) {
      const q = a + (n - 2) * 0.055;
      points.push(V(Math.cos(q) * r, Math.sin(q) * r, (level - 1) * 0.23 + 0.02 * Math.sin(n * 3)));
      scales.push(V(0.11, 0.075, 0.08));
    }
  }
  beads(group, points, 1, beadMat, { segments: detail ? 24 : 6, scales, name: "EightFoldNPCProteinDomains" });
  for (let i = 0; i < 8; i++) {
    const a = i / 8 * TAU, x = Math.cos(a), y = Math.sin(a);
    tube(group, [V(x * 0.53, y * 0.53, -0.28), V(x * 0.38, y * 0.38, -0.65), V(x * 0.15, y * 0.15, -0.84)], 0.014, mat, { segments: 22, sides: 5, name: "NPCNuclearBasketFilament" });
    tube(group, [V(x * 0.56, y * 0.56, 0.26), V(x * 0.65, y * 0.65, 0.48), V(x * 0.77, y * 0.77, 0.6)], 0.012, mat, { segments: 20, sides: 5, name: "NPCCytoplasmicFilament" });
  }
  const basketRim = new THREE.Mesh(new THREE.TorusGeometry(0.155, 0.016, 6, 48), mat);
  basketRim.position.z = -0.84;
  group.add(basketRim);
  group.scale.setScalar(scale);
  return group;
}
function buildNucleus(group, detail, ctx) {
  const { geometry, poreSites } = perforatedNucleus(detail), map = relief(3), material = continuousMembrane("#8872aa", { roughness: 0.46, clearcoat: 0.2 }), envelope = new THREE.Mesh(geometry, material);
  envelope.userData.shell = true;
  envelope.name = "PerforatedDoubleNuclearMembrane";
  group.add(envelope);
  ctx.textures.add(map);
  ctx.shell.push(envelope);
  const npcPoints = [], npcScales = [], npcQuaternion = [], npcr = detail ? 0.12 : 0.1;
  for (const site of poreSites) {
    const quaternion = new THREE.Quaternion().setFromUnitVectors(V(0, 0, 1), site.normal);
    for (let layer = 0; layer < 3; layer++) for (let i = 0; i < 8; i++) {
      const a = i / 8 * TAU;
      for (let part = 0; part < 3; part++) {
        const q = a + (part - 1) * 0.08;
        const point = V(Math.cos(q) * 0.55, Math.sin(q) * 0.55, (layer - 1) * 0.23).multiplyScalar(npcr).applyQuaternion(quaternion).add(site.position);
        npcPoints.push(point);
        npcScales.push(V(0.013, 0.01, 0.01));
        npcQuaternion.push(quaternion);
      }
    }
  }
  const npc = beads(group, npcPoints, 1, physical("#94839f", { roughness: 0.46 }), { scales: npcScales, segments: detail ? 24 : 6, name: "ThirtyTwoEightFoldNPCAssemblies" });
  npc.userData.shell = true;
  ctx.shell.push(npc);
  const random = rng(213), chromatinMat = physical("#8d71a2", { roughness: 0.65 }), filamentMat = physical("#b699c4", { roughness: 0.55 }), nucleolusMat = physical("#674d87", { bumpMap: map, bumpScale: 0.022, roughness: 0.55 });
  sphere(group, organicSphere(0.38, detail ? 64 : 24, 0.09, 3), nucleolusMat, V(-0.35, -0.05, -0.17), V(1.1, 0.83, 0.92), "DenseNucleolus");
  sphere(group, organicSphere(0.23, detail ? 40 : 16, 0.06, 2), nucleolusMat, V(0.29, 0.3, -0.22), V(0.9, 1.1, 1), "SecondaryNucleolus");
  const beadsPoints = [], scales = [];
  for (let k = 0; k < (detail ? 72 : 15); k++) {
    const pts = [];
    let p = pointsInBall(1, random, 0.9)[0];
    for (let j = 0; j < 15; j++) {
      p.add(V((random() - 0.5) * 0.21, (random() - 0.5) * 0.21, (random() - 0.5) * 0.21));
      if (p.length() > 0.91) p.normalize().multiplyScalar(0.85);
      const q = p.clone().multiply(V(1.22, 1.1, 0.96));
      pts.push(q);
      beadsPoints.push(q);
      scales.push(V(0.8 + random() * 0.4, 0.8 + random() * 0.4, 0.8 + random() * 0.4));
    }
    tube(group, pts, detail ? 8e-3 : 0.017, filamentMat, { segments: detail ? 80 : 30, sides: 5, name: "ChromatinFibre" });
  }
  beads(group, beadsPoints, detail ? 0.015 : 0.035, chromatinMat, { scales, segments: detail ? 24 : 6, name: "ChromatinNucleosomeBeads" });
  if (detail) {
    const nucleolar = pointsInBall(450, random, 0.36).map((p) => p.add(V(-0.35, -0.05, -0.17)));
    beads(group, nucleolar, 0.016, physical("#bd8ba9", { roughness: 0.6 }), { segments: 6, name: "NucleolarGranularComponents" });
  }
  ctx.radius = 1.5;
  ctx.anchors.inside = V(0.4, 0.12, 0.42);
  ctx.anchors.insideTarget = V(-0.28, 0.1, -0.16);
  ctx.facts = ["核膜由内外两层膜组成，核孔贯通核质与胞质。", "核膜间隙与内质网腔连续；核孔不是内质网腔的入口。", "内部可观察染色质的空间分布与致密的核仁。"];
  ctx.stats.poreCount = poreSites.length;
  ctx.stats.realOpenPores = true;
}
function buildNuclearER(group, detail, ctx, id) {
  buildNucleus(group, detail, ctx);
  const continuum = attachSERToNuclearER(createNuclearERGeometry({ detail })), envelope = group.getObjectByName("PerforatedDoubleNuclearMembrane"), nuclearMaterial = envelope.material, erMaterial = continuousMembrane("#7198a7", { roughness: 0.45, clearcoat: 0.22 }), neckMaterial = continuousMembrane("#96b6c1", { roughness: 0.48, clearcoat: 0.18 }), smoothERMaterial = continuousMembrane("#95b8b0", { roughness: 0.49, clearcoat: 0.2 });
  envelope.geometry.dispose();
  envelope.geometry = continuum.geometry;
  envelope.material = [nuclearMaterial, erMaterial, neckMaterial, smoothERMaterial];
  envelope.userData.organelleByMaterial = { 0: "nucleus", 1: "er", 2: "er", 3: "er" };
  envelope.userData.secretoryDomainByMaterial = { 0: "nuclear-envelope", 1: "rough-er", 2: "nuclear-er-connection", 3: "smooth-er" };
  envelope.userData.continuousPNSER = true;
  ctx.shell = ctx.shell.filter((o) => o !== envelope);
  ctx.explicitShellMaterials.add(nuclearMaterial);
  ctx.explicitShellMaterials.add(neckMaterial);
  if (id === "er") {
    ctx.explicitShellMaterials.add(erMaterial);
    ctx.explicitShellMaterials.add(smoothERMaterial);
  }
  Object.assign(ctx.anchors, continuum.anchors);
  // Aim at exposed rough ER, not through the near nuclear envelope.
  ctx.anchors.roughER = V(1.662932, .081858, .299937);
  ctx.anchors.roughERTarget = ctx.anchors.roughER.clone();
  ctx.anchors.roughERCamera = ctx.anchors.roughER.clone().add(V(.21, .63, 2.03));
  ctx.anchors.inside.copy(continuum.anchors.pnsInterior);
  ctx.anchors.insideTarget.copy(continuum.anchors.pnsSightTarget);
  ctx.metadata = continuum.metadata;
  ctx.metadata.secretoryDetails = erDetailDescriptors(true);
  ctx.stats = { ...ctx.stats, continuousNuclearER: true, smoothERTubularDomain: true, smoothERSharedPort: true, sharedNuclearPorts: 1, sharedIntercisternalNecks: 20, erCisternae: 11, continuumTriangles: continuum.geometry.index.count / 3 };
  ctx.sectionRadius = 1.5;
  if (id === "er") {
    ctx.radius = 1.25;
    ctx.anchors.focus.copy(continuum.anchors.connection);
    ctx.sectionNormal = V(-0.55, 0.2, 1).normalize().negate();
    ctx.sectionFocus = continuum.anchors.connection.clone();
    ctx.facts = ["核外膜经接头与内质网膜连续，核周隙通向内质网腔。", "核孔连接核质与胞质，与核周隙—内质网腔属于不同通路。", "紫色为核膜，蓝色为ER膜与连接颈。剖切后可观察内外核膜、核周隙及进入ER腔的连续关系。"];
    const geometry = continuum.geometry, indices = geometry.index.array, position = geometry.attributes.position, normals = geometry.attributes.normal, candidates = [];
    for (const section of geometry.groups) if (section.materialIndex === 1) for (let face = section.start; face < section.start + section.count; face += 3) candidates.push(face);
    const random = rng(340), points = [], surface = [], scales = [];
    for (let i = 0; i < (detail ? 850 : 180); i++) {
      const face = candidates[Math.floor(random() * candidates.length)], ids = [indices[face], indices[face + 1], indices[face + 2]], point = ids.reduce((p, index) => p.add(V().fromBufferAttribute(position, index)), V()).multiplyScalar(1 / 3), normal = ids.reduce((p, index) => p.add(V().fromBufferAttribute(normals, index)), V()).normalize();
      surface.push(point);
      points.push(point.clone().addScaledVector(normal, 0.018));
      scales.push(V(0.8 + random() * 0.4, 0.75 + random() * 0.3, 0.85 + random() * 0.3));
    }
    const ribosomes = beads(group, points, 0.024, physical("#ad80ad", { roughness: 0.55 }), { scales, segments: detail ? 24 : 6, name: "ContinuumERBoundRibosomes" });
    ribosomes.userData.secretoryDomain = "rough-er";
    ctx.shell.push(ribosomes);
    bindToSection(ctx, ribosomes, surface);
  } else {
    ctx.radius = 3.65;
    ctx.facts = ["双层核膜与32个贯通核孔围成细胞核，内部展示染色质与核仁。", "核外膜经真实共享端口接入11个ER膜囊；核周隙与ER腔相通，核内膜保持完整。", "核孔连接核质与胞质，和核周隙—ER腔通路分开；模型比例为展览观察而调整。"];
  }
}
function erPlacementQueries(geometry) {
  const position = geometry.attributes.position, indices = geometry.index, triangles = [];
  for (let i = 0; i < indices.count; i += 3) {
    const a = V().fromBufferAttribute(position, indices.getX(i)), b = V().fromBufferAttribute(position, indices.getX(i + 1)), c = V().fromBufferAttribute(position, indices.getX(i + 2));
    triangles.push({ triangle: new THREE.Triangle(a, b, c), box: new THREE.Box3().setFromPoints([a, b, c]), center: a.clone().add(b).add(c).multiplyScalar(1 / 3) });
  }
  function split(ids) {
    const box = new THREE.Box3();
    for (const id of ids) box.union(triangles[id].box);
    if (ids.length <= 12) return { box, ids };
    const size = box.getSize(V()), axis = size.x >= size.y && size.x >= size.z ? "x" : size.y >= size.z ? "y" : "z";
    ids.sort((a, b) => triangles[a].center[axis] - triangles[b].center[axis]);
    const middle = ids.length >> 1;
    return { box, left: split(ids.slice(0, middle)), right: split(ids.slice(middle)) };
  }
  const root = split(triangles.map((_, i) => i)), ray = new THREE.Ray(), hit = V(), closest = V(), direction = V(0.779, 0.331, 0.528).normalize();
  return {
    nearest(point) {
      let best = Infinity;
      const stack = [root];
      while (stack.length) {
        const node = stack.pop(), distance = node.box.distanceToPoint(point);
        if (distance * distance > best) continue;
        if (node.ids) for (const id of node.ids) {
          triangles[id].triangle.closestPointToPoint(point, closest);
          best = Math.min(best, closest.distanceToSquared(point));
        }
        else {
          const left = node.left.box.distanceToPoint(point), right = node.right.box.distanceToPoint(point);
          if (left < right) stack.push(node.right, node.left);
          else stack.push(node.left, node.right);
        }
      }
      return Math.sqrt(best);
    },
    outside(point) {
      ray.origin.copy(point);
      ray.direction.copy(direction);
      const stack = [root], distances = [];
      while (stack.length) {
        const node = stack.pop();
        if (!ray.intersectBox(node.box, hit)) continue;
        if (node.ids) for (const id of node.ids) {
          const t = triangles[id].triangle;
          if (ray.intersectTriangle(t.a, t.b, t.c, false, hit)) distances.push(point.distanceTo(hit));
        }
        else stack.push(node.left, node.right);
      }
      distances.sort((a, b) => a - b);
      let count = 0, last = -1;
      for (const distance of distances) if (distance - last > 1e-8) {
        count++;
        last = distance;
      }
      return count % 2 === 0;
    }
  };
}
const decodedERPlacements = /* @__PURE__ */ new Map();
function erPlacementFingerprint(arrays) {
  let first = 2166136261, second = 2654435769;
  for (const array of arrays) {
    first = Math.imul(first ^ array.byteLength, 16777619);
    second = Math.imul(second ^ array.byteLength, 2246822507);
    const words = new Uint32Array(array.buffer, array.byteOffset, Math.floor(array.byteLength / 4));
    for (const word of words) {
      first = Math.imul(first ^ word, 16777619);
      second = Math.imul(second ^ word, 2246822507);
    }
    const remainder = new Uint8Array(array.buffer, array.byteOffset + words.byteLength, array.byteLength - words.byteLength);
    for (const byte of remainder) {
      first = Math.imul(first ^ byte, 16777619);
      second = Math.imul(second ^ byte, 2246822507);
    }
  }
  return (first >>> 0).toString(16).padStart(8, "0") + (second >>> 0).toString(16).padStart(8, "0");
}
function erPlacementInput(geometry, ribosomes, anchors) {
  const anchorData = new Float32Array(anchors.length * 3);
  anchors.forEach((point, i) => point.toArray(anchorData, i * 3));
  const counts = { membraneVertices: geometry.attributes.position.count, membraneIndexElements: geometry.index.count, ribosomeVertices: ribosomes.geometry.attributes.position.count, ribosomeInstances: ribosomes.count, anchorElements: anchorData.length };
  const signature = erPlacementFingerprint([geometry.attributes.position.array, geometry.attributes.normal.array, geometry.index.array, ribosomes.geometry.attributes.position.array, ribosomes.instanceMatrix.array, anchorData]);
  return { counts, signature };
}
function decodeERFloat32(base64, elements) {
  const binary = atob(base64);
  if (binary.length !== elements * 4) throw new Error("ER baked Float32 payload length mismatch; regenerate placements");
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
  const values = new Float32Array(elements), view = new DataView(bytes.buffer);
  for (let i = 0; i < elements; i++) {
    values[i] = view.getFloat32(i * 4, true);
    if (!Number.isFinite(values[i])) throw new Error("Nonfinite ER baked placement value");
  }
  return values;
}
function applyBakedERPlacement(detail, ribosomes, anchors, input) {
  const key = detail ? "detail" : "overview", entry = ER_PLACEMENTS.variants[key];
  if (ER_PLACEMENTS.format !== "macrophage-er-placements-v1" || !entry || entry.inputSignature !== input.signature || JSON.stringify(entry.counts) !== JSON.stringify(input.counts)) throw new Error("ER placement data does not match current raw geometry/seed; run node tools/generate-er-placement.mjs");
  let decoded = decodedERPlacements.get(key);
  if (!decoded) {
    decoded = { matrices: decodeERFloat32(entry.matricesF32LE, ribosomes.count * 16), anchors: decodeERFloat32(entry.anchorsF32LE, anchors.length * 3) };
    if (erPlacementFingerprint([decoded.matrices, decoded.anchors]) !== entry.outputSignature) throw new Error("ER baked placement checksum mismatch");
    decodedERPlacements.set(key, decoded);
  }
  ribosomes.instanceMatrix.array.set(decoded.matrices);
  anchors.forEach((point, i) => point.fromArray(decoded.anchors, i * 3));
  ribosomes.instanceMatrix.needsUpdate = true;
  return { ...entry.stats };
}
function buildER(group, detail, ctx) {
  const map = relief(8), material = continuousMembrane("#8babb4", { roughness: 0.43, clearcoat: 0.24 }), folded = foldedReticulum(detail, material);
  group.add(folded.mesh);
  ctx.shell.push(folded.mesh);
  ctx.textures.add(map);
  const random = rng(95), points = [], scales = [], surfaceAnchors = [], surfaceNormals = [], surfaceVertices = [], position = folded.mesh.geometry.attributes.position, normals = folded.mesh.geometry.attributes.normal, ringSides = detail ? 24 : 12, rows = detail ? 700 : 280;
  for (let i = 0; i < (detail ? 1250 : 260); i++) {
    const row = 1 + Math.floor(random() * (rows - 2)), side = random() < 0.5 ? 1 : 3, j = Math.round(ringSides * side / 4) + (random() < 0.5 ? -1 : 1), vertex = row * ringSides + (j + ringSides) % ringSides, base = V().fromBufferAttribute(position, vertex), normal = V().fromBufferAttribute(normals, vertex).normalize(), factor = 0.75 + random() * 0.5, scale = V(1, 0.8, 0.9).multiplyScalar(factor), point = base.clone().addScaledVector(normal, (detail ? 0.025 : 0.032) * factor * 0.73);
    surfaceAnchors.push(base);
    surfaceNormals.push(normal);
    surfaceVertices.push(vertex);
    points.push(point);
    scales.push(scale);
  }
  const ribo = beads(group, points, detail ? 0.025 : 0.032, physical("#b77d9c", { roughness: 0.63 }), { scales, segments: detail ? 24 : 6, name: "CytosolicBoundRibosomes" });
  const placementInput = erPlacementInput(folded.mesh.geometry, ribo, surfaceAnchors);
  if (ctx.rebuildERPlacements) {
    const queries = erPlacementQueries(folded.mesh.geometry), ribosomeMatrix = new THREE.Matrix4(), ribosomeLinear = new THREE.Matrix3(), ribosomeVertex = V(), ribosomeCenter = V(), ribosomePositions = ribo.geometry.attributes.position;
    let shiftedRibosomes = 0, rescaledRibosomes = 0, relocatedRibosomes = 0, maximumRibosomeShift = 0, maximumSurfaceRelocation = 0, minimumRibosomeScale = 1;
    for (let i = 0; i < ribo.count; i++) {
      ribo.getMatrixAt(i, ribosomeMatrix);
      ribosomeLinear.setFromMatrix4(ribosomeMatrix);
      ribosomeCenter.setFromMatrixPosition(ribosomeMatrix);
      const originalCenter = ribosomeCenter.clone(), normal = surfaceNormals[i], base = surfaceAnchors[i], originalVertex = surfaceVertices[i], row = Math.floor(originalVertex / ringSides), side = originalVertex % ringSides, candidates = [];
      let radius = 0;
      for (let vertex = 0; vertex < ribosomePositions.count; vertex++) radius = Math.max(radius, ribosomeVertex.fromBufferAttribute(ribosomePositions, vertex).applyMatrix3(ribosomeLinear).length());
      for (const rowOffset of [0, -1, 1, -2, 2, -3, 3, -4, 4, -6, 6, -8, 8, -12, 12, -16, 16, -20, 20, -24, 24, -28, 28, -32, 32]) for (const sideOffset of [0, -1, 1, -2, 2, -3, 3]) {
        const candidateRow = row + rowOffset;
        if (candidateRow <= 0 || candidateRow >= rows) continue;
        const id = candidateRow * ringSides + (side + sideOffset + ringSides) % ringSides, anchor = V().fromBufferAttribute(position, id), outward = V().fromBufferAttribute(normals, id).normalize(), distance = anchor.distanceTo(base);
        if (distance > 0.18 || outward.dot(normal) < 0.7) continue;
        for (const scale of [1, 0.9, 0.8]) candidates.push({ anchor, outward, scale, distance, cost: distance + (1 - scale) * 0.15 });
      }
      candidates.sort((a, b) => a.cost - b.cost);
      let fit = null;
      for (const candidate of candidates) {
        for (const margin of detail ? [15e-4, 25e-4] : [15e-4, 25e-4, 45e-4, 65e-4]) {
          const candidateRadius = radius * candidate.scale, center = candidate.anchor.clone().addScaledVector(candidate.outward, candidateRadius + margin);
          if (queries.nearest(center) < candidateRadius + 4e-4 || !queries.outside(center)) continue;
          fit = { ...candidate, center };
          break;
        }
        if (fit) break;
      }
      if (!fit) throw new Error("No exposed same-side ER surface can fit bound ribosome " + i);
      for (const column of [0, 4, 8]) for (let axis = 0; axis < 3; axis++) ribosomeMatrix.elements[column + axis] *= fit.scale;
      ribosomeMatrix.setPosition(fit.center);
      ribo.setMatrixAt(i, ribosomeMatrix);
      surfaceAnchors[i] = fit.anchor.clone();
      const shift = fit.center.distanceTo(originalCenter);
      shiftedRibosomes += Number(shift > 1e-8);
      rescaledRibosomes += Number(fit.scale < 1);
      relocatedRibosomes += Number(fit.distance > 1e-8);
      maximumRibosomeShift = Math.max(maximumRibosomeShift, shift);
      maximumSurfaceRelocation = Math.max(maximumSurfaceRelocation, fit.distance);
      minimumRibosomeScale = Math.min(minimumRibosomeScale, fit.scale);
    }
    ribo.instanceMatrix.needsUpdate = true;
    ctx.stats.boundRibosomeEnvelope = { shiftedRibosomes, rescaledRibosomes, relocatedRibosomes, maximumRibosomeShift, maximumSurfaceRelocation, minimumRibosomeScale, minimumBoundingSphereClearance: 4e-4 };
    const matrices = ribo.instanceMatrix.array.slice(), anchors = new Float32Array(surfaceAnchors.length * 3);
    surfaceAnchors.forEach((point, i) => point.toArray(anchors, i * 3));
    ctx.erPlacementBake = { counts: placementInput.counts, inputSignature: placementInput.signature, outputSignature: erPlacementFingerprint([matrices, anchors]), matrices, anchors, stats: { ...ctx.stats.boundRibosomeEnvelope } };
  } else {
    ctx.stats.boundRibosomeEnvelope = applyBakedERPlacement(detail, ribo, surfaceAnchors, placementInput);
  }
  ribo.userData.shell = true;
  ribo.userData.secretoryDomain = "rough-er";
  ctx.shell.push(ribo);
  bindToSection(ctx, ribo, surfaceAnchors);
  if (detail) {
    const nascent = [], folding = [], foldingScales = [];
    for (let i = 0; i < 220; i++) {
      const q = folded.curve.getPoint((i + 0.45) / 220);
      if (q.distanceTo(folded.curve.getPoint(0.37)) < 0.13) continue;
      nascent.push(q);
      for (let j = 0; j < 4; j++) {
        const a = j / 4 * TAU;
        folding.push(q.clone().add(V(Math.cos(a) * 0.014, Math.sin(a) * 0.011, 0.01 * Math.sin(j * 2 + i))));
        foldingScales.push(V(9e-3, 8e-3, 0.01));
      }
    }
    const products = beads(group, nascent, 0.012, physical("#d4b377", { roughness: 0.55 }), { segments: 24, name: "LumenalProteinProducts" }), foldingDomains = beads(group, folding, 1, physical("#9fbca6", { roughness: 0.58 }), { scales: foldingScales, segments: 24, name: "LumenalFoldingProteinDomains" });
    ctx.shell.push(products, foldingDomains);
    bindToSection(ctx, products, nascent);
    bindToSection(ctx, foldingDomains, folding);
  }
  ctx.radius = 1.6;
  ctx.anchors.inside = folded.curve.getPoint(0.37).add(V(0, 6e-3, 0));
  ctx.anchors.insideTarget = folded.curve.getPoint(0.371);
  ctx.anchors.roughER = V(-.594324, .415161, .559818);
  ctx.anchors.roughERTarget = ctx.anchors.roughER.clone();
  ctx.anchors.roughERCamera = ctx.anchors.roughER.clone().add(V(.21, .63, 2.03));
  ctx.facts = ["粗面内质网由相通的扁囊与管道组成，核糖体位于胞质侧。", "扁囊与管状连接共同围成内质网腔。", "相机进入的是内质网腔；蛋白折叠与分泌起始过程在此发生。"];
  ctx.stats.continuousLumen = true;
  ctx.stats.cisternae = folded.levels;
  // Attach only AFTER the unchanged baked ribosome placement was checked.
  // The original positions/IDs stay intact; the new domain receives no ribosomes.
  const originalERGeometry = folded.mesh.geometry;
  const smoothER = attachSmoothERNetwork({ geometry: originalERGeometry, capCenterId: originalERGeometry.attributes.position.count - 1, scale: 0.8, materialIndex: 1 });
  folded.mesh.geometry = smoothER.geometry;
  folded.mesh.material = [material, continuousMembrane("#95b8b0", { roughness: 0.49, clearcoat: 0.2 })];
  folded.mesh.userData.secretoryDomainByMaterial = { 0: "rough-er", 1: "smooth-er" };
  originalERGeometry.dispose();
  ctx.anchors.smoothER = V().fromArray(smoothER.metadata.smoothAnchor);
  ctx.anchors.smoothERCamera = V().fromArray(smoothER.metadata.smoothCamera);
  ctx.anchors.smoothERTarget = V().fromArray(smoothER.metadata.smoothTarget);
  ctx.metadata = { ...ctx.metadata, smoothER: smoothER.metadata, secretoryDetails: erDetailDescriptors(false) };
  ctx.stats.smoothERTubularDomain = true;
  ctx.stats.smoothERSharedPort = true;
  ctx.radius = 2;
  ctx.facts = ["粗面域以扁囊为主，胞质侧附着核糖体；平滑域是无附着核糖体的分支管网。", "两域经同一组边界顶点连续，内部为共同的 ER 腔；不是两个彼此贴近的器官。", "管网、片层比例和颜色用于展示；脂质代谢及钙调控仅作功能说明，未展示专门酶或钙浓度场。"];
}
function erDetailDescriptors(connected) {
  return [
    { id: "rough-er", title: "粗面内质网 · RER", anchor: "roughER", camera: "roughERCamera", target: "roughERTarget", section: 0, guideFeatureId: "rough-er" },
    { id: "smooth-er", title: "光面内质网 · SER", anchor: "smoothER", camera: "smoothERCamera", target: "smoothERTarget", section: 0, guideFeatureId: "smooth-er" },
    { id: "er-lumen", title: connected ? "核周隙—ER 连续腔" : "进入 ER 水性腔", camera: "inside", target: "insideTarget", section: .73, inside: true, guideFeatureId: connected ? "nuclear-er-connection" : "er-lumen" }
  ];
}
function buildGolgi(group, detail, ctx) {
  const stack = 7, random = rng(717), levels = [], palettes = ["#dea8a0", "#df9d96", "#d78a83"];
  const zoneNames = ["cis", "cis", "medial", "medial", "medial", "trans", "trans"];
  for (let k = 0; k < stack; k++) {
    const level = -.73 + k * .205, width = 1.18 - Math.abs(k - 3) * .055, depth = .69 + .04 * Math.sin(k), phase = k * .81, zone = zoneNames[k];
    const g = cisterna(width, depth, detail ? .033 : .042, level, phase, detail);
    const color = palettes[zone === "cis" ? 0 : zone === "medial" ? 1 : 2];
    const m = new THREE.Mesh(g, continuousMembrane(color, { roughness: .43, clearcoat: .25 }));
    m.name = `GolgiClosedFlattenedCisterna${k + 1}`;
    m.rotation.y = (k - 3) * 0.025;
    m.userData.shell = true;
    m.userData.secretoryDomain = zone;
    levels.push({ index: k, zone, level, width, depth });
    group.add(m);
    ctx.shell.push(m);
    if (detail) {
      const dots = [];
      for (let j = 0; j < 95; j++) {
        const a = random() * TAU, r = Math.sqrt(random()) * 0.83;
        const rim = 1 + .047 * Math.sin(a * 5 + phase) + .023 * Math.sin(a * 9 - phase);
        const x = Math.cos(a) * r * width * rim, z = Math.sin(a) * r * depth * rim;
        const y = level + .23 * r * r + .035 * Math.sin(a * 3 + phase) * r * r + .018 * noise(x, ySafe(level), z) * r;
        dots.push(V(x, y, z));
      }
      const cargo = beads(group, dots, .009, physical("#d9b97d", { roughness: .65 }), { segments: 12, name: "GolgiLumenCargo" });
      cargo.rotation.y = m.rotation.y;
      cargo.userData.secretoryDomain = zone;
      ctx.shell.push(cargo);
    }
  }
  const network = createTransGolgiNetwork({ detail });
  const tgn = new THREE.Mesh(network.geometry, continuousMembrane("#ce837d", { roughness: .44, clearcoat: .24 }));
  tgn.name = "GolgiTransTubulocisternalNetwork";
  tgn.userData = { shell: true, secretoryDomain: "tgn", continuousLumen: true };
  group.add(tgn);
  ctx.shell.push(tgn);
  for (let i = 0; i < (detail ? 28 : 12); i++) {
    const k = i % stack, a = i * 2.399 + 0.13, pos = V(Math.cos(a) * (1.18 + random() * 0.32), -0.75 + k * 0.21 + random() * 0.08, Math.sin(a) * (0.77 + random() * 0.24)), r = 0.07 + random() * 0.07;
    const m = sphere(group, organicSphere(r, detail ? 24 : 12, 0.035, i), physical(i % 2 ? "#dfa2a0" : "#efb5a7", { roughness: 0.31 }), pos);
    m.name="GolgiTransportVesicleMembrane";
    m.userData.shell = true;
    m.userData.secretoryDomain = "carriers";
    ctx.shell.push(m);
    if (detail) {
      sphere(group, organicSphere(r * 0.67, 16, 0.04, i), physical("#d4ae78", { roughness: 0.65 }), pos).name="GolgiTransportVesicleCargo";
    }
  }
  ctx.radius = 1.8;
  // The centre of cisterna 4 is inside its lumen, rather than in the
  // cytosolic gap between two cisternae. This also leaves room to orbit.
  ctx.anchors.inside = V(0, levels[3].level, 0);
  ctx.anchors.insideTarget = V(-.20, levels[3].level + .008, -.07);
  const domains = [
    ["golgiCis", "cis", "顺面 · cis", V(-.52, levels[1].level + .12, .37), V(.65, -1.35, 2.1)],
    ["golgiMedial", "medial", "中间囊 · medial", V(-.32, levels[3].level + .08, .43), V(1.4, .55, 2.15)],
    ["golgiTrans", "trans", "反面 · trans", V(.30, levels[6].level + .09, .37), V(1.15, 1.65, 1.95)],
    ["golgiTGN", "tgn", "反面管网 · TGN", V(.42, .97, -.12), V(.9, 2.15, 1.5)]
  ];
  const secretoryDetails = domains.map(([key, id, title, target, camera]) => {
    ctx.anchors[key] = target;
    ctx.anchors[key + "Target"] = target.clone();
    ctx.anchors[key + "Camera"] = camera;
    return { id, title, anchor: key, camera: key + "Camera", target: key + "Target", section: 0, guideFeatureId: "golgi-" + id };
  });
  secretoryDetails.push({ id: "golgi-lumen", title: "进入中间囊腔", camera: "inside", target: "insideTarget", section: .73, inside: true, guideFeatureId: "golgi-lumen" });
  ctx.metadata = { ...ctx.metadata, secretoryDetails, golgi: { zones: levels, tgn: network.metadata, measuredSegmentation: false } };
  ctx.facts = ["顺面接收来自 ER—ERGIC 途径的货物，中间囊与反面承担连续加工步骤。", "反面管网 TGN 是独立显示的分支管囊区；其囊与管连续，相邻堆叠囊腔没有被错误合并。", "七层及颜色只作区域定位：真实囊数、酶分布和囊间连接会随细胞类型与状态变化。"];
  ctx.stats.cisternae = stack;
  ctx.stats.golgiZones = ["cis", "medial", "trans", "tgn"];
  ctx.stats.continuousTGN = true;
}
const decodedMitoPlacements = /* @__PURE__ */ new Map();
function mitoPlacementInput(core, innerMesh) {
  const arrays = [], meshCounts = [];
  core.group.traverse((mesh) => {
    if (!mesh.isMesh) return;
    arrays.push(mesh.geometry.attributes.position.array, mesh.geometry.attributes.normal.array, mesh.geometry.index.array);
    meshCounts.push(mesh.geometry.attributes.position.count, mesh.geometry.index.count);
  });
  arrays.push(new Float64Array(innerMesh.matrixWorld.elements), new Uint32Array(core.metadata.cristae.flatMap((crista) => crista.allRingIndices.flat())));
  return { signature: erPlacementFingerprint(arrays), counts: { coreMeshCounts: meshCounts, cristae: core.metadata.cristae.length } };
}
function decodeMitoArray(base64, type, elements) {
  const binary = atob(base64), size = type === "f64" ? 8 : type === "f32" ? 4 : 1;
  if (binary.length !== elements * size) throw new Error("Mito baked placement payload length mismatch");
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
  if (type === "u8") return bytes;
  const view = new DataView(bytes.buffer), out = type === "f64" ? new Float64Array(elements) : new Float32Array(elements);
  for (let i = 0; i < elements; i++) {
    out[i] = type === "f64" ? view.getFloat64(i * 8, true) : view.getFloat32(i * 4, true);
    if (!Number.isFinite(out[i])) throw new Error("Nonfinite Mito baked placement value");
  }
  return out;
}
function loadMitoPlacement(detail, input) {
  const key = detail ? "detail" : "overview", entry = MITO_PLACEMENTS.variants[key];
  if (MITO_PLACEMENTS.format !== "macrophage-mito-placements-v2" || !entry || entry.inputSignature !== input.signature || JSON.stringify(entry.counts) !== JSON.stringify(input.counts)) throw new Error("Mito placement data does not match current raw geometry; run node tools/generate-mito-placement.mjs");
  let decoded = decodedMitoPlacements.get(key);
  if (!decoded) {
    decoded = { queries: decodeMitoArray(entry.queryPointsF64LE, "f64", entry.queryCount * 3), answers: decodeMitoArray(entry.queryAnswersU8, "u8", entry.queryCount), scales: decodeMitoArray(entry.scalesF64LE, "f64", entry.granuleCount * 3), matrices: decodeMitoArray(entry.preAnchorMatricesF32LE, "f32", entry.granuleCount * 16), finalMatrices: decodeMitoArray(entry.matricesF32LE, "f32", entry.granuleCount * 16) };
    if (erPlacementFingerprint([decoded.queries, decoded.answers, decoded.scales, decoded.matrices, decoded.finalMatrices, new Float64Array([entry.queryClearanceMinimum])]) !== entry.outputSignature) throw new Error("Mito baked placement checksum mismatch");
    if (!Number.isFinite(entry.queryClearanceMinimum) || entry.queryClearanceMinimum <= 1e-9) throw new Error("Invalid Mito baked raw-membrane query clearance");
    if (decoded.answers.some((answer) => answer !== 0 && answer !== 1)) throw new Error("Invalid Mito baked query answer");
    decodedMitoPlacements.set(key, decoded);
  }
  return { entry, decoded };
}
function buildMito(group, detail, ctx) {
  const core = createContinuousMitoCore({ index: 3 }), container = core.group;
  container.name = "TwelveCristaContinuousMitochondrion";
  container.scale.setScalar(1.55);
  group.add(container);
  core.setCutaway(true);
  container.traverse((o) => {
    if (o.isMesh) {
      if (o.name.includes("Rim")) o.visible = false;
      else {
        o.visible = true;
        o.userData.shell = true;
        const mats = Array.isArray(o.material) ? o.material : [o.material];
        if (o.name.includes("ClosedOuter")) ctx.shell.push(o);
        else if (o.name.includes("ContinuousInner")) ctx.explicitShellMaterials.add(mats[0]);
        for (const mat of mats) {
          mat.clippingPlanes = null;
          const grain = microTexture("reticulum", 2.1), albedo = softAlbedo(grain, 0.13);
          mat.map = albedo;
          mat.bumpMap = grain;
          mat.bumpScale = 18e-4;
          mat.roughnessMap = grain;
          mat.roughness = 0.43;
          mat.metalness = 5e-3;
          mat.envMapIntensity = 0.7;
          mat.color.set(o.name.includes("ClosedOuter") ? "#bf6d3f" : mat === mats[0] ? "#d88a52" : "#e49a61");
          mat.emissiveIntensity = 0.012;
          mat.needsUpdate = true;
        }
      }
    }
  });
  const innerMesh = container.getObjectByName("MitochondrialContinuousInnerMembrane");
  container.updateWorldMatrix(true, true);
  const placementInput = mitoPlacementInput(core, innerMesh), baked = ctx.rebuildMitoPlacements ? null : loadMitoPlacement(detail, placementInput), queryPoints = [], queryAnswers = [];
  let queryCursor = 0;
  const matrixRay = ctx.rebuildMitoPlacements ? new THREE.Raycaster() : null, rayDirection = V(0.941, 0.227, 0.249).normalize();
  function inMatrix(point) {
    if (baked) {
      const offset = queryCursor * 3, expected = baked.decoded.queries;
      const tolerance = 1e-12, distance = Math.hypot(point.x - expected[offset], point.y - expected[offset + 1], point.z - expected[offset + 2]);
      if (queryCursor >= baked.entry.queryCount || !Number.isFinite(distance) || distance > tolerance || distance * 16 >= baked.entry.queryClearanceMinimum) {
        const actual = point.toArray(), reference = Array.from(expected.slice(offset, offset + 3)), difference = actual.map((value, i) => value - reference[i]);
        throw new Error("Mito baked query point drift; regenerate placements; " + JSON.stringify({ index: queryCursor, detail, expected: reference, actual, difference, distance, tolerance, minimumRawMembraneClearance: baked.entry.queryClearanceMinimum, inputSignature: placementInput.signature }));
      }
      return baked.decoded.answers[queryCursor++] === 1;
    }
    queryPoints.push(point.x, point.y, point.z);
    matrixRay.set(point, rayDirection);
    const intersections = matrixRay.intersectObject(innerMesh, false);
    let unique = 0, lastDistance = -1;
    for (const hit of intersections) if (Math.abs(hit.distance - lastDistance) > 1e-6) {
      unique++;
      lastDistance = hit.distance;
    }
    const result = unique % 2 === 1;
    queryAnswers.push(result ? 1 : 0);
    return result;
  }
  const random = rng(103), points = [], scales = [];
  let rejected = 0, attempts = 0;
  while (points.length < (detail ? 410 : 75) && attempts++ < 6e3) {
    let point;
    do {
      point = V((random() * 2 - 1) * 1.33, (random() * 2 - 1) * 0.39, (random() * 2 - 1) * 0.35);
    } while ((point.x / 1.33) ** 2 + (point.y / 0.39) ** 2 + (point.z / 0.35) ** 2 > 1);
    if (!inMatrix(point)) {
      rejected++;
      continue;
    }
    points.push(point);
    scales.push(V(0.7 + random() * 0.6, 0.7 + random() * 0.6, 0.7 + random() * 0.6));
  }
  const particleRadius = detail ? 0.012 : 0.02, probe = organicSphere(particleRadius, detail ? 24 : 6, 0.045, 2), probePositions = probe.attributes.position;
  let baseRadius = 0;
  for (let i = 0; i < probePositions.count; i++) baseRadius = Math.max(baseRadius, Math.hypot(probePositions.getX(i), probePositions.getY(i), probePositions.getZ(i)));
  probe.dispose();
  const granuleInputSignature = erPlacementFingerprint([probePositions.array, new Float64Array(points.flatMap((point) => point.toArray())), new Float64Array(scales.flatMap((scale) => scale.toArray()))]);
  const margin = 0.65;
  let shrunken = 0;
  if (baked) {
    if (baked.entry.granuleInputSignature !== granuleInputSignature || baked.entry.granuleCount !== points.length || baked.entry.margin !== margin) throw new Error("Mito baked granule inputs drift; regenerate placements");
    scales.forEach((scale, i) => scale.fromArray(baked.decoded.scales, i * 3));
    shrunken = baked.entry.shrunken;
  } else {
    const membranePositions = innerMesh.geometry.attributes.position, membraneIndices = innerMesh.geometry.index.array, triangles = new Float32Array(membraneIndices.length / 3 * 15);
    for (let i = 0; i < membraneIndices.length; i += 3) {
      const offset = i / 3 * 15;
      for (let vertex = 0; vertex < 3; vertex++) {
        const source = membraneIndices[i + vertex];
        triangles[offset + vertex * 3] = membranePositions.getX(source) * 1.55;
        triangles[offset + vertex * 3 + 1] = membranePositions.getY(source) * 1.55;
        triangles[offset + vertex * 3 + 2] = membranePositions.getZ(source) * 1.55;
      }
      for (let axis = 0; axis < 3; axis++) {
        triangles[offset + 9 + axis] = Math.min(triangles[offset + axis], triangles[offset + 3 + axis], triangles[offset + 6 + axis]);
        triangles[offset + 12 + axis] = Math.max(triangles[offset + axis], triangles[offset + 3 + axis], triangles[offset + 6 + axis]);
      }
    }
    const triangle = new THREE.Triangle(), closest = V();
    for (let i = 0; i < points.length; i++) {
      const point = points[i], maximumRadius = baseRadius * Math.max(scales[i].x, scales[i].y, scales[i].z);
      let distanceSquared = (maximumRadius / margin) ** 2;
      for (let j = 0; j < triangles.length; j += 15) {
        const dx = Math.max(triangles[j + 9] - point.x, 0, point.x - triangles[j + 12]), dy = Math.max(triangles[j + 10] - point.y, 0, point.y - triangles[j + 13]), dz = Math.max(triangles[j + 11] - point.z, 0, point.z - triangles[j + 14]);
        if (dx * dx + dy * dy + dz * dz >= distanceSquared) continue;
        triangle.a.fromArray(triangles, j);
        triangle.b.fromArray(triangles, j + 3);
        triangle.c.fromArray(triangles, j + 6);
        triangle.closestPointToPoint(point, closest);
        distanceSquared = Math.min(distanceSquared, closest.distanceToSquared(point));
      }
      const safeRadius = Math.sqrt(distanceSquared) * margin;
      if (safeRadius < maximumRadius * 0.999999) {
        scales[i].multiplyScalar(safeRadius / maximumRadius);
        shrunken++;
      }
    }
  }
  const granules = beads(group, points, particleRadius, physical("#b9855e", { roughness: 0.62 }), { scales, segments: detail ? 24 : 6, name: "MatrixEnzymeAndMitoribosomeGranules" });
  if (baked) {
    granules.instanceMatrix.array.set(baked.decoded.matrices);
    granules.instanceMatrix.needsUpdate = true;
    ctx.mitoExpectedMatrices = baked.decoded.finalMatrices;
  }
  ctx.stats.matrixGranules = points.length;
  ctx.stats.matrixGranulesShrunk = shrunken;
  ctx.stats.matrixGranuleRadiusMargin = margin;
  ctx.stats.matrixGranuleClearanceMethod = "Exact nearest point on the actual inner-membrane triangles, with AABB broad-phase pruning";
  ctx.stats.excludedCristaLumenSamples = rejected;
  if (detail) {
    const position = innerMesh.geometry.attributes.position, normal = innerMesh.geometry.attributes.normal, bounds = core.metadata.cristae.map((crista) => {
      const box = new THREE.Box3();
      for (const ring of crista.allRingIndices) for (const id of ring) box.expandByPoint(V().fromBufferAttribute(position, id));
      return box;
    });
    for (const gap of [2, 5, 8]) {
      const x = (bounds[gap].max.x + bounds[gap + 1].min.x) * 0.5 * 1.55, pts = [];
      for (let j = 0; j < 100; j++) {
        const angle = j / 100 * TAU;
        pts.push(V(x, 0.015 + Math.sin(angle) * 0.1, 0.085 + Math.cos(angle) * 0.1));
      }
      if (pts.every(inMatrix)) tube(group, pts, 55e-4, physical("#a2829c", { roughness: 0.53 }), { segments: 120, sides: 7, closed: true, name: "MatrixMitochondrialDNALoop" });
    }
    const synthase = [], synthScale = [], stalks = [], indices = [0, 5, 11, 18, 24, 30];
    for (const crista of core.metadata.cristae) {
      const ring = crista.allRingIndices[24];
      for (const j of indices) {
        const vertex = ring[j % ring.length], base = V().fromBufferAttribute(position, vertex).multiplyScalar(1.55), matrixNormal = V().fromBufferAttribute(normal, vertex).normalize().negate(), head = base.clone().addScaledVector(matrixNormal, 0.032);
        if (!inMatrix(head)) continue;
        synthase.push(head);
        synthScale.push(V(0.015, 0.017, 0.014));
        stalks.push({ base, head });
      }
    }
    beads(group, synthase, 1, physical("#ddc795", { roughness: 0.46, bumpScale: 1e-3 }), { scales: synthScale, segments: 24, name: "ATPSynthaseMatrixHeads" });
    const stalkGeometry = new THREE.CylinderGeometry(1, 1, 1, 8, 1, true), stalkMaterial = physical("#bc9d70", { roughness: 0.49, bumpScale: 1e-3 }), stalkMesh = new THREE.InstancedMesh(stalkGeometry, stalkMaterial, stalks.length), temp = new THREE.Object3D();
    stalks.forEach(({ base, head }, i) => {
      const axis = head.clone().sub(base);
      temp.position.copy(base).add(head).multiplyScalar(0.5);
      temp.scale.set(35e-4, axis.length(), 35e-4);
      temp.quaternion.setFromUnitVectors(V(0, 1, 0), axis.normalize());
      temp.updateMatrix();
      stalkMesh.setMatrixAt(i, temp.matrix);
    });
    stalkMesh.name = "ATPSynthaseMembraneAnchoredStalks";
    group.add(stalkMesh);
    ctx.stats.membraneAnchoredATPSynthase = stalks.length;
    ctx.stats.matrixCompartmentChecked = true;
  }
  if (baked) {
    if (queryCursor !== baked.entry.queryCount) throw new Error("Mito baked query count drift; regenerate placements");
  } else {
    const queries = new Float64Array(queryPoints), answers = new Uint8Array(queryAnswers), finalScales = new Float64Array(scales.flatMap((scale) => scale.toArray())), matrices = granules.instanceMatrix.array.slice();
    const clearanceQueries = erPlacementQueries(innerMesh.geometry), inverse = innerMesh.matrixWorld.clone().invert(), uniformScale = innerMesh.matrixWorld.getMaxScaleOnAxis(), localQuery = V();
    let nearestRawMembrane = Infinity;
    for (let i = 0; i < queries.length; i += 3) nearestRawMembrane = Math.min(nearestRawMembrane, clearanceQueries.nearest(localQuery.fromArray(queries, i).applyMatrix4(inverse)) * uniformScale);
    const queryClearanceMinimum = Math.max(0, nearestRawMembrane * (1 - 1e-10) - 1e-12);
    ctx.mitoPlacementBake = { counts: placementInput.counts, inputSignature: placementInput.signature, granuleInputSignature, granuleCount: points.length, queryCount: queryAnswers.length, shrunken, margin, queries, answers, scales: finalScales, matrices, queryClearanceMinimum, outputSignature: erPlacementFingerprint([queries, answers, finalScales, matrices]) };
  }
  ctx.radius = 1.7;
  ctx.anchors.inside = V(0.2218, 0.1, 0.37);
  ctx.anchors.insideTarget = V(0.2218, 0.1, -0.12);
  ctx.anchors.mavs = V().fromArray(core.metadata.mavsSite).multiplyScalar(1.55);
  ctx.anchors.mavsNormal = V().fromArray(core.metadata.mavsNormal).normalize();
  ctx.facts = ["外膜封闭包围线粒体，内膜形成连续的嵴与嵴颈。", "嵴腔与膜间隙相通；基质位于内膜另一侧。", "基质中可见颗粒与 mtDNA；ATP 合酶嵌于内膜，其催化头部朝向基质。"];
  ctx.stats.cristae = 12;
  ctx.stats.continuousInnerMembrane = true;
}
function proteinShape(radius = 0.1, detail = true, seed = 0) {
  const g = organicSphere(radius, detail ? 36 : 16, 0.075, seed), p = g.attributes.position;
  for (let i = 0; i < p.count; i++) {
    const x = p.getX(i), y = p.getY(i), z = p.getZ(i), r = Math.hypot(x, y, z), theta = Math.atan2(z, x), f = 1 + 0.27 * Math.sin(theta * 3 + seed) * Math.max(0, 1 - (y / r) ** 2) + 0.16 * Math.cos(y / r * 5 + seed * 0.7);
    p.setXYZ(i, x * f, y * f, z * f);
  }
  g.computeVertexNormals();
  return g;
}
function fragmentInstances(parent, points, radius, material, random, detail = true) {
  const geometry = organicSphere(radius, detail ? 32 : 14, 0.21, 7), position = geometry.attributes.position;
  for (let i = 0; i < position.count; i++) {
    const x = position.getX(i), y = position.getY(i), z = position.getZ(i), factor = 1 + 0.18 * noise(x / radius, y / radius, z / radius);
    position.setXYZ(i, x * factor, y * factor * 0.28 + 0.08 * radius * Math.sin(x / radius * 2), z * factor * 0.8);
  }
  geometry.computeVertexNormals();
  const object = new THREE.InstancedMesh(geometry, material, points.length), temp = new THREE.Object3D();
  points.forEach((point, i) => {
    temp.position.copy(point);
    temp.rotation.set(random() * TAU, random() * TAU, random() * TAU);
    temp.scale.set(0.55 + random() * 0.9, 0.7 + random() * 0.7, 0.6 + random() * 0.8);
    temp.updateMatrix();
    object.setMatrixAt(i, temp.matrix);
    const color = new THREE.Color("#c7b79f").lerp(new THREE.Color("#8e7961"), random() * 0.6);
    object.setColorAt(i, color);
  });
  parent.add(object);
  return object;
}
function buildVesicle(group, detail, ctx, id) {
  const palette = { lysosome: "#997ba9", endosome: "#91adb3", phagosome: "#bd996c", peroxisome: "#91a285" }, shell = membraneSurface(group, palette[id], detail, { radius: 1.08, seed: id.length, continuous: id === "lysosome" || id === "endosome" });
  ctx.shell.push(shell.outer, shell.inner);
  ctx.textures.add(shell.map);
  const random = rng(id.length * 181);
  const sparse = pointsInBall(detail ? 110 : 35, random, 0.87);
  beads(group, sparse, detail ? 0.01 : 0.022, physical(id === "lysosome" ? "#b691a1" : id === "peroxisome" ? "#a0ac8d" : "#c7b284", { roughness: 0.62, bumpScale: 1e-3 }), { segments: detail ? 24 : 6, name: "FineSolubleLumenGranules" });
  if (id === "endosome") {
    const cargoMaterial = physical("#b796a6", { roughness: 0.58, bumpScale: 1e-3 }), packingRandom = rng(detail ? 8723 : 8724), lumenQueries = erPlacementQueries(shell.inner.geometry), packed = [];
    let relocatedVesicles = 0, rejectionAttempts = 0, minimumEnvelopeGap = Infinity, minimumLimitingMembraneGap = Infinity;
    for (let i = 0; i < (detail ? 22 : 10); i++) {
      const initialPoint = pointsInBall(1, random, 0.72)[0], radius = 0.1 + random() * 0.12, outerGeometry = organicSphere(radius, detail ? 40 : 16, 0.018, i), vertexPositions = outerGeometry.attributes.position;
      let envelopeRadius = 0;
      for (let vertex = 0; vertex < vertexPositions.count; vertex++) envelopeRadius = Math.max(envelopeRadius, V().fromBufferAttribute(vertexPositions, vertex).length());
      let point = initialPoint.clone(), accepted = false;
      for (let attempt = 0; attempt < 12e3; attempt++) {
        if (attempt > 0) {
          point = pointsInBall(1, packingRandom, 0.78)[0];
          rejectionAttempts++;
        }
        if (packed.some((other) => point.distanceTo(other.point) < envelopeRadius + other.radius + 0.012)) continue;
        if (lumenQueries.nearest(point) < envelopeRadius + 0.012 || lumenQueries.outside(point)) continue;
        accepted = true;
        break;
      }
      if (!accepted) throw new Error("No nonintersecting endosomal lumen position for ILV " + i);
      relocatedVesicles += Number(point.distanceToSquared(initialPoint) > 1e-12);
      for (const other of packed) minimumEnvelopeGap = Math.min(minimumEnvelopeGap, point.distanceTo(other.point) - envelopeRadius - other.radius);
      minimumLimitingMembraneGap = Math.min(minimumLimitingMembraneGap, lumenQueries.nearest(point) - envelopeRadius);
      packed.push({ point: point.clone(), radius: envelopeRadius });
      const membraneMaterial = continuousMembrane(i % 2 ? "#c4b4be" : "#9eb5b9", { roughness: 0.42, clearcoat: 0.24 }), outer = sphere(group, outerGeometry, membraneMaterial, point, V(1, 1, 1), "EndosomalIntralumenalVesicleMembrane"), inner = sphere(group, organicSphere(radius - 0.012, detail ? 36 : 14, 0.018, i), membraneMaterial, point, V(1, 1, 1), "IntralumenalVesicleInnerFace");
      outer.userData.shell = inner.userData.shell = true;
      ctx.shell.push(outer, inner);
      if (detail && i % 2 === 0) {
        const domains = pointsInBall(5, random, radius * 0.55).map((q) => q.add(point));
        beads(group, domains, 0.014, cargoMaterial, { segments: 12, name: "IntralumenalVesicleCargo" });
      }
    }
    ctx.stats.intralumenalVesicles = detail ? 22 : 10;
    ctx.stats.intralumenalPacking = { relocatedVesicles, rejectionAttempts, minimumEnvelopeGap, minimumLimitingMembraneGap, envelopeBasis: "Maximum actual outer-membrane vertex radius; raw limiting membrane closest triangles" };
  }
  if (id === "lysosome") {
    const enzymeColors = ["#8b709e", "#b98391", "#c9a063", "#8eaa94"];
    for (let i = 0; i < (detail ? 26 : 11); i++) {
      const point = pointsInBall(1, random, 0.78)[0], mesh = sphere(group, proteinShape(0.065 + random() * 0.055, detail, i), physical(enzymeColors[i % 4], { roughness: 0.51, bumpScale: 23e-4 }), point, V(1.35, 0.8, 1), "LysosomalLobedHydrolase");
      ctx.moving.push({ object: mesh, base: point.clone(), amplitude: 0.014, speed: 0.22 + i * 7e-3 });
    }
    const fragments = pointsInBall(detail ? 105 : 28, random, 0.76);
    fragmentInstances(group, fragments, detail ? 0.065 : 0.079, physical("#b69b7d", { roughness: 0.76, clearcoat: 0.08 }), random, detail);
    ctx.stats.contentIdentity = "Lobed soluble enzymes and irregular partly digested fragments";
  }
  if (id === "phagosome") {
    const cargo = new THREE.Group();
    cargo.position.set(0.02, -0.08, -0.06);
    group.add(cargo);
    const cargoTexture = microTexture("cargo", 1.25), cargoAlbedo = cargoTexture.clone();
    cargoAlbedo.colorSpace = THREE.SRGBColorSpace;
    cargoAlbedo.needsUpdate = true;
    const cargoMaterial = physical("#beaa8d", { roughness: 0.83, clearcoat: 0.06, map: cargoAlbedo, bumpMap: cargoTexture, bumpScale: 0.032 }), core = sphere(cargo, organicSphere(0.52, detail ? 96 : 32, 0.19, 12), cargoMaterial, V(), V(1, 0.76, 0.88), "IrregularEngulfedCargoCore");
    const surface = [];
    for (let i = 0; i < (detail ? 440 : 90); i++) {
      const a = random() * TAU, b = Math.acos(random() * 2 - 1), r = 0.47 + random() * 0.12;
      surface.push(V(Math.sin(b) * Math.cos(a) * r, Math.cos(b) * r * 0.77, Math.sin(b) * Math.sin(a) * r * 0.89));
    }
    fragmentInstances(cargo, surface, detail ? 0.054 : 0.072, cargoMaterial, random, detail);
    const loose = pointsInBall(detail ? 55 : 18, random, 0.84).filter((q) => q.length() > 0.62);
    fragmentInstances(group, loose, 0.057, cargoMaterial, random, detail);
    ctx.stats.contentIdentity = "Rough engulfed core, layered surface flakes and loose surrounding debris";
  }
  if (id === "peroxisome") {
    const enzymeMatrix = physical("#a3af89", { roughness: 0.58, bumpScale: 15e-4 }), corePoints = pointsInBall(detail ? 700 : 100, random, 0.6).map((q) => q.multiply(V(0.86, 1, 0.86)).add(V(0.04, -0.03, -0.04)));
    beads(group, corePoints, detail ? 0.025 : 0.038, enzymeMatrix, { segments: detail ? 24 : 7, scales: corePoints.map(() => V(0.7 + random() * 0.5, 0.8 + random() * 0.6, 0.7 + random() * 0.5)), name: "DensePeroxisomalEnzymeMatrix" });
    for (let i = 0; i < (detail ? 12 : 4); i++) {
      const point = pointsInBall(1, random, 0.72)[0];
      sphere(group, proteinShape(0.065, detail, i), physical("#b4ba94", { roughness: 0.55, bumpScale: 15e-4 }), point, V(0.8, 1.2, 0.9), "PeroxisomalOxidativeEnzymeDomain");
    }
    ctx.stats.contentIdentity = "Dense granular enzyme matrix without universal crystalline core";
  }
  ctx.radius = 1.2;
  ctx.anchors.inside = id === "phagosome" ? V(0.5, 0.3, 0.72) : V(0.12, 0.06, 0.7);
  ctx.anchors.insideTarget = V(0, -0.1, -0.35);
  ctx.facts = id === "lysosome" ? ["溶酶体由单层膜包围，酸性腔内含多种水解酶。", "腔内有多种水解酶与不同阶段的降解材料。", "材料在酸性腔内逐步分解，产物可回收进入细胞代谢。"] : id === "endosome" ? ["内体是内吞货物分选与成熟的膜性区室。", "内部展示有薄膜围成的腔内小囊泡及其内容物，表现多囊泡内体特征。", "内体与溶酶体属于不同区室，不能仅凭球形外观互换名称。"] : id === "phagosome" ? ["吞噬体将被摄取的颗粒封闭在单层膜腔室中。", "成熟过程中与内体、溶酶体系统交换物质，并逐步酸化。", "内容物由粗糙核心、层状碎片和游离碎屑组成，可从不同方向观察包裹关系。"] : ["过氧化物酶体由单层膜包围，内含氧化代谢相关酶。", "内部是密集的颗粒状酶基质，分布与水解酶丰富的溶酶体有所区别。", "基质以酶性颗粒表示，结晶核心并非所有细胞类型共有。"];
}
function buildMembrane(group, detail, ctx) {
  return buildPlasmaMembraneDetail(group, detail, ctx);
}
function buildCytoskeleton(group, detail, ctx) {
  const wall = physical("#d6b26e", { roughness: 0.4 }), head = physical("#9b87b2", { roughness: 0.45 }), points = [], scales = [];
  const n = detail ? 70 : 28;
  for (let j = 0; j < n; j++) for (let proto = 0; proto < 13; proto++) {
    const a = proto / 13 * TAU, x = (j / (n - 1) - 0.5) * 3.2, y = Math.cos(a) * 0.23, z = Math.sin(a) * 0.23;
    points.push(V(x, y, z));
    scales.push(V(0.047, 0.045, 0.045));
  }
  const micro = beads(group, points, 1, wall, { scales, segments: detail ? 12 : 7, name: "ThirteenProtofilamentHollowMicrotubule" });
  micro.userData.shell = true;
  ctx.shell.push(micro);
  for (let k = 0; k < 4; k++) {
    const x = -1.2 + k * 0.78;
    const p = V(x, 0.31, 0.12);
    sphere(group, organicSphere(0.1, 20, 0.05, k), head, p, V(1, 0.68, 1), "MotorProteinHead");
    tube(group, [p, V(x + 0.08, 0.5, 0.12), V(x + 0.22, 0.7, 0.1)], 0.026, head, { segments: 30, sides: 8, name: "MotorProteinStalk" });
    sphere(group, organicSphere(0.15, 22, 0.035, k), physical("#b4bec1", { roughness: 0.32 }), V(x + 0.22, 0.84, 0.1), V(1, 0.85, 1), "TransportCargoVesicle");
  }
  const actin = physical("#b4c4bd", { roughness: 0.43 });
  for (let j = 0; j < (detail ? 96 : 36); j++) {
    const x = (j / (detail ? 95 : 35) - 0.5) * 3.3, a = j * 0.65;
    sphere(group, new THREE.SphereGeometry(detail ? 0.045 : 0.058, 8, 6), actin, V(x, -0.65 + Math.cos(a) * 0.07, Math.sin(a) * 0.07), V(1, 1, 1), "ActinHelicalMonomer");
  }
  ctx.radius = 1.85;
  ctx.anchors.inside = V(0.7, 0, 0.02);
  ctx.anchors.insideTarget = V(-0.9, 0, 0);
  ctx.facts = ["微管由原纤维围成空心管，模型采用常见的 13 原纤维形式。", "马达蛋白沿微管运输货物；另展示肌动蛋白的螺旋聚合结构。", "可以进入微管中央腔，从内部观察管壁排列。"];
  ctx.stats.hollowMicrotubule = true;
}
function buildRibosome(group, detail, ctx) {
  const random = rng(1013), large = physical("#b994b1", { roughness: 0.6 }), small = physical("#c5b4c8", { roughness: 0.58 }), a = sphere(group, organicSphere(0.92, detail ? 80 : 28, 0.09, 5), large, V(-0.08, 0.2, -0.03), V(1.2, 0.75, 0.88), "LargeRibosomalSubunit"), b = sphere(group, organicSphere(0.67, detail ? 64 : 24, 0.08, 7), small, V(0.05, -0.52, 0.11), V(1.35, 0.42, 0.82), "SmallRibosomalSubunit");
  a.userData.shell = b.userData.shell = true;
  ctx.shell.push(a, b);
  if (detail) {
    const pts = pointsInBall(650, random, 0.86).map((p) => p.multiply(V(1, 0.65, 0.82)).add(V(-0.08, 0.2, -0.03)));
    beads(group, pts, 0.035, physical("#cba6bc", { roughness: 0.6 }), { segments: 6, name: "RibosomalProteinDomains" });
    for (let i = 0; i < 7; i++) {
      const pts2 = [];
      for (let j = 0; j < 40; j++) {
        const t = j / 39 * TAU;
        pts2.push(V(Math.cos(t) * (0.47 + i * 0.026), 0.17 + Math.sin(t * 3 + i) * 0.28, Math.sin(t) * 0.53));
      }
      tube(group, pts2, 0.017, physical("#9d82ac", { roughness: 0.55 }), { segments: 90, sides: 6, closed: true, name: "RibosomalRNATeachingFold" });
    }
  }
  const messenger = [];
  for (let i = 0; i < 60; i++) {
    const t = i / 59;
    messenger.push(V(-1.4 + t * 2.8, -0.31 + Math.sin(t * TAU) * 0.045, 0.48));
  }
  tube(group, messenger, 0.022, physical("#cfb77b", { roughness: 0.55 }), { segments: 100, sides: 7, name: "MessengerRNA" });
  const chain = [];
  for (let i = 0; i < 20; i++) chain.push(V(0.22 + Math.sin(i * 0.66) * 0.07, 0.48 + i * 0.048, 0.19 + Math.cos(i * 0.81) * 0.07));
  tube(group, chain, 0.02, physical("#9eafa0", { roughness: 0.53 }), { segments: 90, sides: 7, name: "NascentPolypeptide" });
  ctx.radius = 1.5;
  ctx.anchors.inside = V(1.6, -0.9, 3);
  ctx.anchors.insideTarget = V(0, -0.15, 0.15);
  ctx.facts = ["核糖体由大、小亚基组成，含核糖体 RNA 与多种蛋白质。", "mRNA 位于两亚基接合区域，肽链由大亚基侧伸出。", "内部 RNA 与蛋白质域呈现教学构象，重点是亚基界面与翻译路径。"];
}
function bindToSection(ctx, mesh, points) {
  const matrices = [];
  for (let i = 0; i < mesh.count; i++) {
    const matrix = new THREE.Matrix4();
    mesh.getMatrixAt(i, matrix);
    matrices.push(matrix);
  }
  ctx.sectionBindings.push({ mesh, points, matrices });
}
const ORGANELLE_IDS = ["nucleus", "er", "golgi", "mitochondria", "lysosome", "endosome", "membrane", "cytoskeleton", "pore", "phagosome", "peroxisome", "ribosome"];
function createOrganelle(id, { detail = true, connectedER = false, rebuildERPlacements = false, rebuildMitoPlacements = false } = {}) {
  if (!ORGANELLE_IDS.includes(id)) throw new Error(`Unknown organelle: ${id}`);
  const group = new THREE.Group();
  group.name = `Atlas_${id}_${detail ? "detail" : "overview"}`;
  group.userData = { organelleId: id, teachingOnly: true, detail };
  const ctx = { rebuildERPlacements: Boolean(rebuildERPlacements), rebuildMitoPlacements: Boolean(rebuildMitoPlacements), shell: [], sectionBindings: [], explicitShellMaterials: /* @__PURE__ */ new Set(), textures: /* @__PURE__ */ new Set(), moving: [], radius: 1.5, anchors: { focus: V(), inside: V(0, 0.1, 0.42), insideTarget: V(0, 0, -0.35) }, facts: [], stats: { detail } };
  const previousPool = buildTexturePool;
  buildTexturePool = /* @__PURE__ */ new Map();
  try {
    if (connectedER && (id === "nucleus" || id === "er")) buildNuclearER(group, detail, ctx, id);
    else if (id === "nucleus") buildNucleus(group, detail, ctx);
    else if (id === "er") buildER(group, detail, ctx);
    else if (id === "golgi") buildGolgi(group, detail, ctx);
    else if (id === "mitochondria") buildMito(group, detail, ctx);
    else if (["lysosome", "endosome", "phagosome", "peroxisome"].includes(id)) buildVesicle(group, detail, ctx, id);
    else if (id === "membrane") buildMembrane(group, detail, ctx);
    else if (id === "cytoskeleton") buildCytoskeleton(group, detail, ctx);
    else if (id === "ribosome") buildRibosome(group, detail, ctx);
    else if (id === "pore") {
      const npc = poreComplex(detail);
      group.add(npc);
      npc.traverse((o) => {
        if (o.isMesh && o.userData.shell) ctx.shell.push(o);
      });
      ctx.radius = 1.5;
      ctx.anchors.inside = V(0.02, 0.02, 0.18);
      ctx.anchors.insideTarget = V(0, 0, -0.85);
      ctx.facts = ["核孔复合体具有八重旋转对称的总体支架。", "中央通道连接胞质与核质；支架两侧有胞质纤维和核篮。", "孔道中的选择性屏障控制分子通行；此视图突出支架与通道轮廓。"];
      ctx.stats.realOpenChannel = true;
    }
  } finally {
    buildTexturePool = previousPool;
  }
  if (detail && !["membrane", "cytoskeleton", "pore"].includes(id)) {
    const instance = new THREE.Matrix4(), point = V(), parentInverse = new THREE.Matrix4();
    group.updateMatrixWorld(true);
    group.traverse((o) => {
      if (!o.isInstancedMesh) return;
      for (let i = 0; i < o.count; i++) {
        o.getMatrixAt(i, instance);
        point.setFromMatrixPosition(instance).applyMatrix4(o.matrixWorld);
        group.worldToLocal(point);
        if (point.distanceTo(ctx.anchors.inside) < 0.105) {
          const pos = new THREE.Vector3(), rot = new THREE.Quaternion(), scale = new THREE.Vector3();
          instance.decompose(pos, rot, scale);
          scale.multiplyScalar(0.015);
          instance.compose(pos, rot, scale);
          o.setMatrixAt(i, instance);
        }
      }
      o.instanceMatrix.needsUpdate = true;
    });
  }
  const shellMaterials = new Set(ctx.explicitShellMaterials);
  for (const object of ctx.shell) object.traverse((o) => {
    if (o.isMesh) for (const mat of Array.isArray(o.material) ? o.material : [o.material]) shellMaterials.add(mat);
  });
  const plane = new THREE.Plane(ctx.sectionNormal ?? V(0, 0, -1), (ctx.sectionRadius ?? ctx.radius) * 1.2), worldPlane = plane.clone();
  let section = 0, disposed = false;
  function applySection() {
    group.updateWorldMatrix(true, false);
    worldPlane.copy(plane).applyMatrix4(group.matrixWorld);
    for (const mat of shellMaterials) {
      const before = Boolean(mat.clippingPlanes?.length);
      mat.clippingPlanes = section > 2e-3 ? [worldPlane] : null;
      if (before !== section > 2e-3) mat.needsUpdate = true;
    }
    ctx.onWorldSection?.(section, plane, group.matrixWorld);
  }
  function setSection(amount) {
    section = clamp(Number(amount) || 0, 0, 1);
    plane.constant = ctx.sectionFocus ? -plane.normal.dot(ctx.sectionFocus) + (0.78 - section) * 0.7 : THREE.MathUtils.lerp((ctx.sectionRadius ?? ctx.radius) * 1.16, -(ctx.sectionRadius ?? ctx.radius) * 0.32, section);
    group.userData.section = section;
    ctx.onSection?.(section, plane);
    for (const binding of ctx.sectionBindings) {
      for (let i = 0; i < binding.mesh.count; i++) {
        const matrix = binding.matrices[i].clone();
        if (section > 2e-3 && plane.distanceToPoint(binding.points[i]) < 1e-4) matrix.scale(V(1e-5, 1e-5, 1e-5));
        binding.mesh.setMatrixAt(i, matrix);
      }
      binding.mesh.instanceMatrix.needsUpdate = true;
    }
    applySection();
  }
  function update(t, dt = 0) {
    if (disposed) return;
    if (section > 2e-3) applySection();
    ctx.onUpdate?.(t,dt);
    for (const motion of ctx.moving) {
      const o = motion.object;
      o.position.copy(motion.base).add(V(Math.sin(t * motion.speed) * motion.amplitude, Math.cos(t * motion.speed * 0.8) * motion.amplitude, Math.sin(t * motion.speed * 1.3) * motion.amplitude));
      o.rotation.y += Math.min(dt, 0.05) * 0.035;
    }
  }
  group.traverse((o) => {
    if (o.isMesh) {
      o.userData.organelleId = id;
      o.userData.teachingOnly = true;
      ctx.stats.meshes = (ctx.stats.meshes ?? 0) + 1;
      ctx.stats.instances = (ctx.stats.instances ?? 0) + (o.isInstancedMesh ? o.count : 0);
      ctx.stats.triangles = (ctx.stats.triangles ?? 0) + (o.geometry.index?.count ?? o.geometry.attributes.position.count) / 3 * (o.isInstancedMesh ? o.count : 1);
    }
  });
  function dispose() {
    if (disposed) return;
    disposed = true;
    ctx.onDispose?.();
    const geometries = /* @__PURE__ */ new Set(), materials = /* @__PURE__ */ new Set(), textures = new Set(ctx.textures);
    group.traverse((o) => {
      if (o.isMesh) {
        if (o.isInstancedMesh) o.dispose();
        geometries.add(o.geometry);
        for (const m of Array.isArray(o.material) ? o.material : [o.material]) {
          materials.add(m);
          for (const value of Object.values(m)) if (value?.isTexture) textures.add(value);
        }
      }
    });
    for (const g of geometries) g.dispose();
    for (const m of materials) m.dispose();
    for (const t of textures) t.dispose();
    group.clear();
  }
  setSection(0);
  if (ctx.mitoPlacementBake) {
    const bake = ctx.mitoPlacementBake;
    bake.preAnchorMatrices = bake.matrices;
    bake.matrices = group.getObjectByName("MatrixEnzymeAndMitoribosomeGranules").instanceMatrix.array.slice();
    bake.outputSignature = erPlacementFingerprint([bake.queries, bake.answers, bake.scales, bake.preAnchorMatrices, bake.matrices, new Float64Array([bake.queryClearanceMinimum])]);
  } else if (ctx.mitoExpectedMatrices) {
    const actual = group.getObjectByName("MatrixEnzymeAndMitoribosomeGranules").instanceMatrix.array;
    if (actual.length !== ctx.mitoExpectedMatrices.length || actual.some((value, i) => !Object.is(value, ctx.mitoExpectedMatrices[i]))) throw new Error("Mito final instance matrix drift; regenerate placements");
  }
  ctx.stats.shellMaterials = shellMaterials.size;
  ctx.stats.modelIdentity = "Procedural teaching anatomy, not measured EM or atomic reconstruction";
  return { group, anchors: ctx.anchors, radius: ctx.radius, setSection, update, dispose, facts: ctx.facts, stats: ctx.stats, metadata: ctx.metadata ?? null, ...ctx.erPlacementBake ? { erPlacementBake: ctx.erPlacementBake } : {}, ...ctx.mitoPlacementBake ? { mitoPlacementBake: ctx.mitoPlacementBake } : {} };
}
export {
  ORGANELLE_IDS,
  createOrganelle
};
