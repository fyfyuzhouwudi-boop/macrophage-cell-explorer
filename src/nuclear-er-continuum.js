import * as THREE from "three";
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
const TAU = Math.PI * 2, NC = new THREE.Vector3(-2.25, 1.15, -0.05), SCALE = new THREE.Vector3(1.55, 1.83, 1.36);
const V = (x = 0, y = 0, z = 0) => new THREE.Vector3(x, y, z);
function erAngle(layer, t) {
  return THREE.MathUtils.lerp(-2.95 + layer * .057 + .095 * Math.sin(layer * 1.3),
    1.6 - layer * .075 + .11 * Math.sin(layer * 2.1), t);
}
// Shared parametric source for the actual wall and its whole-view ribosomes.
// The rounded terminal interval ends before either intercisternal port row.
function erWorldFrame(layer, t) {
  const angle = erAngle(layer, t), rx = 2.31 + layer * .2, ry = 2.48 + layer * .19;
  const warp = .16 * Math.sin(angle * 5 + layer * .075) + .065 * Math.sin(angle * 9 + layer * .075);
  const center = V(NC.x + (rx + warp) * Math.cos(angle), NC.y + (ry + warp) * Math.sin(angle),
    -.6 + .075 * layer + .16 * Math.sin(angle * 2) + .1 * Math.sin(angle * 5) + .025 * Math.sin(layer * .8));
  const terminalSpan = .065 + .009 * Math.sin(layer * .87);
  const endDistance = Math.min(t, 1 - t), x = THREE.MathUtils.clamp(endDistance / terminalSpan, 0, 1);
  const taper = Math.sqrt(Math.max(0, 1 - (1 - x) ** 2));
  const depth = (.82 + .18 * Math.sin(angle * 3 + .5) + .1 * Math.sin(angle * 5)) * taper;
  const halfWidth = (.044 + .004 * Math.sin(angle * 4 + layer)) * taper;
  // A common inclination keeps adjacent finite-depth cisternae from crossing.
  // Layer-dependent inclination previously intersected their back surfaces.
  const tilt = (.6 + .18 * Math.sin(angle * 3 + .7) + .1 * Math.sin(angle * 7)) * .3;
  return { angle, center, depth, halfWidth, tilt, taper };
}
// The same smooth spatial deformation is used by every membrane face, shared
// port, lumen witness and ribosome. Its monotone radial map varies cisternal
// spacing without changing their order; a following z shear adds broad folds.
// Nuclear projection and reserved organelle corridors remain fixed. This is an
// exhibition morphology field, not a measured reconstruction of one cell.
function shapeERWorldPoint(point2) {
  const point = point2.clone(), dx = point.x - NC.x, dy = point.y - NC.y;
  const radius = Math.hypot(dx / 2.2, dy / 2.36);
  const outsideRectangle = (cx, cy, hx, hy) => Math.hypot(
    Math.max(0, Math.abs(point.x - cx) - hx),
    Math.max(0, Math.abs(point.y - cy) - hy),
  );
  const golgiClearance = THREE.MathUtils.smoothstep(outsideRectangle(.4, -2.62, 1.8, 1.3), 0, .55);
  const uptakeClearance = THREE.MathUtils.smoothstep(outsideRectangle(4.2, 1.2, 2.15, 2.65), 0, .55);
  const apicalSortingClearance = 1 - THREE.MathUtils.smoothstep(point.y, 3.65, 4.1);
  const envelope = THREE.MathUtils.smoothstep(radius, 1.03, 1.6) * golgiClearance * uptakeClearance * apicalSortingClearance;
  if (envelope === 0) return point;
  const angle = Math.atan2(dy / 2.36, dx / 2.2), distance = Math.hypot(dx, dy);
  // A common ordered radial map creates broad crowded and open cisternal
  // domains instead of independent per-layer offsets or random vertex noise.
  const radialShift = envelope * (.038 * Math.sin(radius * 12 + 1.7 * Math.sin(angle * 2 - .4))
    + .013 * Math.sin(radius * 7 - angle * 2));
  const radialScale = 1 + radialShift / radius;
  point.x = NC.x + dx * radialScale;
  point.y = NC.y + dy * radialScale;
  point.z += envelope * (.31 * Math.sin(angle * 3 + distance * 2.1)
    + .13 * Math.sin(angle * 5 - distance * 4.3 + 1.7));
  return point;
}
function confineERWorldPoint(point2) {
  const radius = point2.length();
  if (radius < 1e-9) return point2.clone();
  const d = point2.clone().multiplyScalar(1 / radius);
  const weight = THREE.MathUtils.smoothstep(-d.x, 0.15, 0.4) * (1 - THREE.MathUtils.smoothstep(d.y, 0, 0.32));
  if (weight <= 0) return point2.clone();
  const angle = Math.atan2(d.y / 6.28, d.x / 6.16), phi = Math.acos(THREE.MathUtils.clamp(d.z, -1, 1)), eq = 1 - d.z * d.z;
  const bodyFold = (0.05 * Math.sin(angle * 3 + 0.3) + 0.025 * Math.sin(angle * 7 - phi * 3) + 8e-3 * Math.sin(angle * 2 + phi)) * eq;
  const bodyRadius = (1 + bodyFold) / Math.sqrt((d.x / 6.16) ** 2 + (d.y / 6.28) ** 2 + (d.z / 4.25) ** 2);
  const safeRadius = bodyRadius - 0.3, band = 0.55, start = safeRadius - band;
  if (radius <= start) return point2.clone();
  const contractedRadius = safeRadius - band * Math.exp(-(radius - start) / band);
  return point2.clone().multiplyScalar((radius + weight * (contractedRadius - radius)) / radius);
}
// Bounded radial relief for both the standalone nucleus and the continuous
// nuclear envelope. Smooth 3-D noise has no imposed sinusoidal ridge direction;
// rotating successive octave coordinates reduces visible lattice alignment.
// The multiplier is bounded to +/-0.6% and does not alter pore/neck topology.
function nuclearSurfaceRelief(x, y, z) {
  const hash = (ix, iy, iz) => {
    let h = Math.imul(ix, 374761393) ^ Math.imul(iy, 668265263) ^ Math.imul(iz, 2147483647);
    h = Math.imul(h ^ h >>> 13, 1274126177);
    return ((h ^ h >>> 16) >>> 0) / 4294967295 * 2 - 1;
  };
  const fade = t => t * t * t * (t * (t * 6 - 15) + 10);
  const lerp = (a, b, t) => a + (b - a) * t;
  const valueNoise = (px, py, pz) => {
    const ix = Math.floor(px), iy = Math.floor(py), iz = Math.floor(pz);
    const fx = fade(px - ix), fy = fade(py - iy), fz = fade(pz - iz);
    return lerp(
      lerp(lerp(hash(ix, iy, iz), hash(ix + 1, iy, iz), fx),
        lerp(hash(ix, iy + 1, iz), hash(ix + 1, iy + 1, iz), fx), fy),
      lerp(lerp(hash(ix, iy, iz + 1), hash(ix + 1, iy, iz + 1), fx),
        lerp(hash(ix, iy + 1, iz + 1), hash(ix + 1, iy + 1, iz + 1), fx), fy), fz);
  };
  let px = x * 6.4 + 17.31, py = y * 6.4 - 8.73, pz = z * 6.4 + 24.19;
  let sum = 0;
  for (const weight of [.57, .29, .14]) {
    sum += weight * valueNoise(px, py, pz);
    const nx = .36 * px + .48 * py - .8 * pz;
    const ny = -.8 * px + .6 * py;
    const nz = .48 * px + .64 * py + .6 * pz;
    px = nx * 2.05 + 11.17;
    py = ny * 2.05 - 7.43;
    pz = nz * 2.05 + 3.29;
  }
  return 1 + .006 * sum;
}
function point(u, v, nu, nv, inner = false) {
  const rounded = roundPoreCoordinates(u, v, nu, nv);
  u = rounded.u;
  v = rounded.v;
  const phi = u / nu * Math.PI, a = v / nv * TAU, s = Math.sin(phi), x = Math.cos(a) * s, y = Math.cos(phi), z = Math.sin(a) * s, indent = 1 - 0.25 * Math.exp(-((x - 0.8) ** 2 / 0.14 + y * y / 0.42)), scale = inner ? 0.955 : 1, n = nuclearSurfaceRelief(x, y, z);
  return V(x * 1.34 * indent * n * scale, y * 1.22 * n * scale, z * 1.1 * n * scale);
}
function orientConsistently(indices, positions) {
  const edge = /* @__PURE__ */ new Map(), faces = indices.length / 3;
  for (let f = 0; f < faces; f++) for (let j = 0; j < 3; j++) {
    const a = indices[f * 3 + j], b = indices[f * 3 + (j + 1) % 3], key = a < b ? a + "," + b : b + "," + a;
    if (!edge.has(key)) edge.set(key, []);
    edge.get(key).push({ face: f, sign: a < b ? 1 : -1 });
  }
  const adjacent = Array.from({ length: faces }, () => []);
  for (const list of edge.values()) if (list.length === 2) {
    const [a, b] = list;
    adjacent[a.face].push({ face: b.face, same: a.sign === b.sign });
    adjacent[b.face].push({ face: a.face, same: a.sign === b.sign });
  }
  const flip = new Int8Array(faces).fill(-1);
  for (let seed = 0; seed < faces; seed++) {
    if (flip[seed] !== -1) continue;
    flip[seed] = 0;
    const queue = [seed];
    for (let head = 0; head < queue.length; head++) {
      const f = queue[head];
      for (const next of adjacent[f]) {
        const value = flip[f] ^ (next.same ? 1 : 0);
        if (flip[next.face] === -1) {
          flip[next.face] = value;
          queue.push(next.face);
        } else if (flip[next.face] !== value) throw new Error("Non-orientable NE-ER assembly");
      }
    }
  }
  for (let f = 0; f < faces; f++) if (flip[f]) {
    const a = indices[f * 3 + 1];
    indices[f * 3 + 1] = indices[f * 3 + 2];
    indices[f * 3 + 2] = a;
  }
  let volume6 = 0;
  for (let i = 0; i < indices.length; i += 3) {
    const a = indices[i] * 3, b = indices[i + 1] * 3, c = indices[i + 2] * 3;
    volume6 += positions[a] * (positions[b + 1] * positions[c + 2] - positions[b + 2] * positions[c + 1]) + positions[a + 1] * (positions[b + 2] * positions[c] - positions[b] * positions[c + 2]) + positions[a + 2] * (positions[b] * positions[c + 1] - positions[b + 1] * positions[c]);
  }
  if (volume6 < 0) for (let f = 0; f < faces; f++) {
    const a = indices[f * 3 + 1];
    indices[f * 3 + 1] = indices[f * 3 + 2];
    indices[f * 3 + 2] = a;
  }
  return { signedVolume: Math.abs(volume6) / 6, edgeCount: edge.size };
}
function createNuclearERGeometry({ detail = true } = {}) {
  const nu = detail ? 80 : 40, nv = detail ? 160 : 80, positions = [], uv = [], indices = [], materials = [], add = (p, u = 0, v = 0) => {
    const id = positions.length / 3;
    positions.push(p.x, p.y, p.z);
    uv.push(u, v);
    return id;
  };
  function face(a, b, c, material = 0) {
    const ax = positions[a * 3], ay = positions[a * 3 + 1], az = positions[a * 3 + 2], ux = positions[b * 3] - ax, uy = positions[b * 3 + 1] - ay, uz = positions[b * 3 + 2] - az, vx = positions[c * 3] - ax, vy = positions[c * 3 + 1] - ay, vz = positions[c * 3 + 2] - az;
    if ((uy * vz - uz * vy) ** 2 + (uz * vx - ux * vz) ** 2 + (ux * vy - uy * vx) ** 2 < 1e-18) return;
    indices.push(a, b, c);
    materials.push(material);
  }
  const vertex = (u, v, inner = false) => (inner ? (nu + 1) * nv : 0) + u * nv + (v % nv + nv) % nv;
  const inPort = (u, v, h, sides2) => u >= h.u0 && u < h.u1 && ((v - h.v0) % sides2 + sides2) % sides2 < h.v1 - h.v0;
  function boundary(h, get) {
    const ring = [];
    for (let u = h.u0; u <= h.u1; u++) ring.push(get(u, h.v0));
    for (let v = h.v0 + 1; v <= h.v1; v++) ring.push(get(h.u1, v));
    for (let u = h.u1 - 1; u >= h.u0; u--) ring.push(get(u, h.v1));
    for (let v = h.v1 - 1; v > h.v0; v--) ring.push(get(h.u0, v));
    return ring;
  }
  const pores = [];
  for (let row = 0; row < 4; row++) for (let k = 0; k < 8; k++) {
    const u = Math.round(nu * (0.2 + row * 0.19)), v = Math.round((k + row % 2 * 0.5) / 8 * nv);
    pores.push({ u0: u - 1, u1: u + 1, v0: v + nv - 2, v1: v + nv + 2 });
  }
  const nuclearPort = { u0: Math.round(nu * 0.625) - 1, u1: Math.round(nu * 0.625) + 1, v0: Math.round(nv * 0.5375) + nv - 2, v1: Math.round(nv * 0.5375) + nv + 2 };
  for (const inner of [false, true]) for (let u = 0; u <= nu; u++) for (let v = 0; v < nv; v++) add(point(u, v, nu, nv, inner), v / nv, u / nu);
  for (const inner of [false, true]) for (let u = 0; u < nu; u++) for (let v = 0; v < nv; v++) {
    if (pores.some((h) => inPort(u, v, h, nv)) || !inner && inPort(u, v, nuclearPort, nv)) continue;
    const a = vertex(u, v, inner), b = vertex(u + 1, v, inner), c = vertex(u, v + 1, inner), d = vertex(u + 1, v + 1, inner);
    face(a, b, c);
    face(c, b, d);
  }
  const poreSites = [];
  for (const h of pores) {
    const ring = boundary(h, (u, v) => vertex(u, v));
    for (let j = 0; j < ring.length; j++) {
      const a = ring[j], b = ring[(j + 1) % ring.length], c = a + (nu + 1) * nv, d = b + (nu + 1) * nv;
      face(a, c, b);
      face(b, c, d);
    }
    const outer = point((h.u0 + h.u1) * 0.5, (h.v0 + h.v1) * 0.5, nu, nv), inner = outer.clone().multiplyScalar(0.955);
    poreSites.push({ outer, inner, direction: outer.clone().sub(inner).normalize() });
  }
  const nuclearFaceCount = indices.length / 3, ports = [{ ring: boundary(nuclearPort, (u, v) => vertex(u, v)), refine: 2, name: "ONM" }], rows = detail ? 104 : 52, sides = 36, toLocal = (p) => p.clone().sub(NC).divide(SCALE), angle = erAngle, center = (layer, t) => erWorldFrame(layer, t).center;
  const layers = [], lumenPaths = [], connections = [];
  let erNuclearPort = null;
  for (let layer = 0; layer < 11; layer++) {
    const ringIds = [], holes = [];
    if (layer === 0) {
      const u = detail ? 2 : 2, v = 16;
      holes.push({ u0: u - 1, u1: u + 1, v0: v - 1, v1: v + 1, name: "ER_ONM" });
    }
    for (const t of [0.16, 0.86]) for (const side of [0, 1]) {
      if (side === 0 && layer === 10 || side === 1 && layer === 0) continue;
      const matchingT = side === 0 ? t : (angle(layer - 1, t) - angle(layer, 0)) / (angle(layer, 1) - angle(layer, 0)), u = Math.round(THREE.MathUtils.clamp(matchingT, 0.04, 0.96) * rows), v = side === 0 ? 0 : 18;
      holes.push({ u0: u - 1, u1: u + 1, v0: v - 1 + sides, v1: v + 1 + sides, name: `${side === 0 ? "out" : "in"}_${t}` });
    }
    const path = [];
    for (let u = 0; u <= rows; u++) {
      const t = u / rows, frame = erWorldFrame(layer, t), a = frame.angle, c = frame.center, ring = [];
      path.push(toLocal(c));
      for (let v = 0; v < sides; v++) {
        const chi = v / sides * TAU, rad = frame.halfWidth, d = frame.depth, across = rad * Math.cos(chi) + frame.tilt * d * Math.sin(chi);
        ring.push(add(toLocal(c.clone().add(V(Math.cos(a) * across, Math.sin(a) * across, d * Math.sin(chi)))), t * 3, v / sides));
      }
      ringIds.push(ring);
    }
    for (let u = 0; u < rows; u++) for (let v = 0; v < sides; v++) {
      if (holes.some((h) => inPort(u, v, h, sides))) continue;
      const a = ringIds[u][v], b = ringIds[u + 1][v], c = ringIds[u][(v + 1) % sides], d = ringIds[u + 1][(v + 1) % sides];
      face(a, b, c, 1);
      face(c, b, d, 1);
    }
    for (const end of [0, rows]) {
      const c = add(toLocal(center(layer, end / rows)), end / rows, 0.5);
      for (let v = 0; v < sides; v++) face(c, ringIds[end][v], ringIds[end][(v + 1) % sides], 1);
    }
    const layerPorts = {};
    for (const h of holes) {
      const record = { ring: boundary(h, (u, v) => ringIds[u][(v % sides + sides) % sides]), refine: 3, name: `ER${layer}_${h.name}` };
      ports.push(record);
      layerPorts[h.name] = record;
      if (h.name === "ER_ONM") erNuclearPort = record;
    }
    layers.push(layerPorts);
    lumenPaths.push(path.filter((p, i) => i > 0 && i < rows && i % 13 === 0));
  }
  const edgeSplits = /* @__PURE__ */ new Map();
  for (const record of ports) {
    const refined = [];
    for (let i = 0; i < record.ring.length; i++) {
      const a = record.ring[i], b = record.ring[(i + 1) % record.ring.length], pa = V().fromArray(positions, a * 3), pb = V().fromArray(positions, b * 3), parts = [a];
      refined.push(a);
      for (let j = 1; j < record.refine; j++) {
        const id = add(pa.clone().lerp(pb, j / record.refine));
        parts.push(id);
        refined.push(id);
      }
      parts.push(b);
      edgeSplits.set(a < b ? a + "," + b : b + "," + a, parts);
    }
    record.ring = refined;
  }
  const originalIndices = indices.splice(0), originalMaterials = materials.splice(0);
  for (let f = 0; f < originalIndices.length; f += 3) {
    const ids = originalIndices.slice(f, f + 3), ring = [];
    let split = false;
    for (let e = 0; e < 3; e++) {
      const a = ids[e], b = ids[(e + 1) % 3], parts = edgeSplits.get(a < b ? a + "," + b : b + "," + a);
      if (parts) {
        split = true;
        ring.push(...(parts[0] === a ? parts : parts.slice().reverse()).slice(0, -1));
      } else ring.push(a);
    }
    if (!split) {
      face(...ids, originalMaterials[f / 3]);
      continue;
    }
    const c = add(ids.reduce((p, id) => p.add(V().fromArray(positions, id * 3)), V()).multiplyScalar(1 / 3));
    for (let j = 0; j < ring.length; j++) face(ring[j], ring[(j + 1) % ring.length], c, originalMaterials[f / 3]);
  }
  function ringCenter(ring) {
    return ring.reduce((p, id) => p.add(V().fromArray(positions, id * 3)), V()).multiplyScalar(1 / ring.length);
  }
  function align(a, b) {
    let best = Infinity, result = b;
    for (const reverse of [false, true]) for (let shift = 0; shift < a.length; shift++) {
      const candidate = Array.from({ length: a.length }, (_, i) => b[((reverse ? -i : i) + shift + a.length) % a.length]);
      let score = 0;
      for (let i = 0; i < a.length; i++) score += V().fromArray(positions, a[i] * 3).distanceToSquared(V().fromArray(positions, candidate[i] * 3));
      if (score < best) {
        best = score;
        result = candidate;
      }
    }
    return result;
  }
  function connect(aRecord, bRecord, material = 1) {
    const a = aRecord.ring, b = align(a, bRecord.ring), count = a.length, path = [ringCenter(a)], rings = [a];
    if (count !== b.length) throw new Error("Shared port ring sizes differ");
    let last = a;
    for (let step = 1; step < 8; step++) {
      const t = step / 8, ring = [];
      for (let i = 0; i < count; i++) ring.push(add(V().fromArray(positions, a[i] * 3).lerp(V().fromArray(positions, b[i] * 3), t), t, i / count));
      for (let i = 0; i < count; i++) {
        const n = (i + 1) % count;
        face(last[i], last[n], ring[i], material);
        face(last[n], ring[n], ring[i], material);
      }
      last = ring;
      rings.push(ring);
      path.push(ringCenter(ring));
    }
    for (let i = 0; i < count; i++) {
      const n = (i + 1) % count;
      face(last[i], last[n], b[i], material);
      face(last[n], b[n], b[i], material);
    }
    path.push(ringCenter(b));
    rings.push(b);
    connections.push({ from: aRecord.name, to: bRecord.name, path, rings });
    return path;
  }
  const nuclearPath = connect(ports[0], erNuclearPort, 2);
  for (let layer = 0; layer < 10; layer++) for (const t of [0.16, 0.86]) connect(layers[layer][`out_${t}`], layers[layer + 1][`in_${t}`], 1);
  const compact = [], compactUV = [], lookup = /* @__PURE__ */ new Map(), used = new Set(indices), remap = new Int32Array(positions.length / 3).fill(-1);
  for (let i = 0; i < positions.length; i += 3) {
    if (!used.has(i / 3)) continue;
    const key = [positions[i], positions[i + 1], positions[i + 2]].map((v) => Math.round(v * 1e7)).join(",");
    let id = lookup.get(key);
    if (id === void 0) {
      id = compact.length / 3;
      lookup.set(key, id);
      compact.push(positions[i], positions[i + 1], positions[i + 2]);
      compactUV.push(uv[i / 3 * 2] ?? 0, uv[i / 3 * 2 + 1] ?? 0);
    }
    remap[i / 3] = id;
  }
  for (let i = 0; i < indices.length; i++) indices[i] = remap[indices[i]];
  let confinedVertices = 0, maxConfinementShift = 0;
  for (let i = 0; i < compact.length; i += 3) {
    const world = shapeERWorldPoint(V().fromArray(compact, i).multiply(SCALE).add(NC)), confined = confineERWorldPoint(world);
    if (!world.equals(confined)) {
      maxConfinementShift = Math.max(maxConfinementShift, world.distanceTo(confined));
      confinedVertices++;
    }
    confined.sub(NC).divide(SCALE).toArray(compact, i);
  }
  for (let oldId = 0; oldId < remap.length; oldId++) {
    const id = remap[oldId];
    if (id >= 0) for (let axis = 0; axis < 3; axis++) positions[oldId * 3 + axis] = compact[id * 3 + axis];
  }
  for (const path of lumenPaths) for (const p of path) p.copy(confineERWorldPoint(shapeERWorldPoint(p.clone().multiply(SCALE).add(NC))).sub(NC).divide(SCALE));
  for (const connection2 of connections) for (let i = 0; i < connection2.path.length; i++) connection2.path[i].copy(ringCenter(connection2.rings[i]));
  const orientation = orientConsistently(indices, compact), geometry = new THREE.BufferGeometry();
  geometry.setAttribute("position", new THREE.Float32BufferAttribute(compact, 3));
  geometry.setAttribute("uv", new THREE.Float32BufferAttribute(compactUV, 2));
  geometry.setIndex(indices);
  let groupStart = 0, lastMaterial = materials[0];
  for (let f = 1; f <= materials.length; f++) if (materials[f] !== lastMaterial || f === materials.length) {
    geometry.addGroup(groupStart * 3, (f - groupStart) * 3, lastMaterial);
    groupStart = f;
    lastMaterial = materials[f];
  }
  geometry.computeVertexNormals();
  geometry.computeBoundingSphere();
  geometry.computeBoundingBox();
  geometry.userData.cisternaMorphology = {
    roundedTerminalPoles: true,
    commonTiltMultiplier: .3,
    terminalArcFraction: [.056, .074],
    radialWaveAmplitudes: [.16, .065],
    adjacentLayerPhases: [.075, .075],
    sharedParametricRibosomePlacement: true,
    orderedNonUniformSpacing: true,
    commonSpatialDeformation: true,
    measuredCoordinates: false,
  };
  const portCenter = ringCenter(ports[0].ring), normal = portCenter.clone().multiply(V(1 / 1.34 ** 2, 1 / 1.22 ** 2, 1 / 1.1 ** 2)).normalize(), pnsInterior = portCenter.clone().addScaledVector(normal, -0.025), connection = nuclearPath[4].clone(), erInterior = nuclearPath[nuclearPath.length - 1].clone().lerp(toLocal(confineERWorldPoint(shapeERWorldPoint(center(0, 2 / rows)))), 0.25), viewDirection = V(-0.55, 0.2, 1).normalize();
  return { geometry, poreSites, anchors: { connection, connectionTarget: connection.clone(), connectionCamera: connection.clone().addScaledVector(viewDirection, 2.5), pnsInterior, erInterior, pnsSightTarget: nuclearPath[4].clone() }, metadata: { teachingOnly: true, erShape: { method: "Ordered angularly varying radial map followed by a common z shear", maximumRadialShift: .051, maximumShear: .44, nuclearProjectionUnchanged: true, radialOrderPreserved: true, measuredCoordinates: false }, erConfinement: { confinedVertices, maxWorldShift: maxConfinementShift, safeBodyMargin: 0.3, radialBand: 0.55 }, nuclearPores: 32, nuclearFaceCount, erCisternae: 11, intercisternalSharedNecks: 20, nuclearSharedPorts: 1, sharedPortVertexIds: ports[0].ring.map((id) => remap[id]), pnsERPath: [pnsInterior, ...nuclearPath, erInterior].map((p) => p.toArray()), erLumenPaths: lumenPaths.map((p) => p.map((v) => v.toArray())), erBendPaths: connections.slice(1).map((c) => c.path.map((p) => p.toArray())), ports: ports.map((p) => ({ name: p.name, ids: p.ring.map((id) => remap[id]) })), ...orientation, description: "One indexed membrane bounds PNS and eleven closed ER cisternae; one ONM and twenty intercisternal necks use shared boundary vertex IDs. The inner nuclear membrane remains intact. NPC channels connect nucleoplasm and cytosol separately from the PNS/ER lumen." } };
}
export {
  nuclearSurfaceRelief,
  confineERWorldPoint,
  shapeERWorldPoint,
  erWorldFrame,
  createNuclearERGeometry
};
