import * as THREE from "three";
import { mergeGeometries } from "three/addons/utils/BufferGeometryUtils.js";
function seededRandom(seed = 3819) {
  let state = seed >>> 0;
  return () => {
    state += 1831565813;
    let t = state;
    t = Math.imul(t ^ t >>> 15, t | 1);
    t ^= t + Math.imul(t ^ t >>> 7, t | 61);
    return ((t ^ t >>> 14) >>> 0) / 4294967296;
  };
}
function makeReliefTexture(size = 128, seed = 91) {
  const data = new Uint8Array(size * size * 4);
  const hash = (x, y) => {
    let n = Math.imul(x + seed, 374761393) + Math.imul(y - seed, 668265263);
    n = Math.imul(n ^ n >>> 13, 1274126177);
    return ((n ^ n >>> 16) >>> 0) / 4294967295;
  };
  const noise = (x, y) => {
    const ix = Math.floor(x), iy = Math.floor(y);
    const sx = x - ix, sy = y - iy;
    const a = sx * sx * (3 - 2 * sx), b = sy * sy * (3 - 2 * sy);
    return THREE.MathUtils.lerp(
      THREE.MathUtils.lerp(hash(ix, iy), hash(ix + 1, iy), a),
      THREE.MathUtils.lerp(hash(ix, iy + 1), hash(ix + 1, iy + 1), a),
      b
    );
  };
  for (let y = 0; y < size; y++) for (let x = 0; x < size; x++) {
    const value = 0.56 * noise(x / size * 8, y / size * 8) + 0.28 * noise(x / size * 24, y / size * 24) + 0.16 * noise(x / size * 61, y / size * 61);
    const i = (y * size + x) * 4, v = Math.round(55 + 185 * value);
    data[i] = data[i + 1] = data[i + 2] = v;
    data[i + 3] = 255;
  }
  const texture = new THREE.DataTexture(data, size, size, THREE.RGBAFormat);
  texture.wrapS = texture.wrapT = THREE.RepeatWrapping;
  texture.magFilter = THREE.LinearFilter;
  texture.minFilter = THREE.LinearMipmapLinearFilter;
  texture.generateMipmaps = true;
  texture.needsUpdate = true;
  return texture;
}
function tubeRadiusAt(t, radius, { phase = 0, micro = 0, bulbs = [], roundEnds = false } = {}, angle = 0) {
  let variation = 0.91 + 0.12 * Math.sin(t * Math.PI * 4 + phase) + 0.035 * Math.sin(t * Math.PI * 15 - phase);
  for (const bulb of bulbs) variation += bulb.strength * Math.exp(-(((t - bulb.t) / bulb.width) ** 2));
  let result = radius * variation * (1 + micro * (0.68 * Math.sin(t * TAU * 19 + angle * 3 + phase) + 0.32 * Math.sin(t * TAU * 29 - angle * 5 - phase)));
  if (roundEnds) {
    const edge = Math.min(1, Math.min(t, 1 - t) / 0.04);
    result *= 0.1 + 0.9 * Math.sqrt(Math.max(0, 1 - (1 - edge) ** 2));
  }
  return result;
}
const TAU = Math.PI * 2;
function organicTube(curve, radius = 0.12, {
  segments = 72,
  sides = 9,
  phase = 0,
  flatten = 1,
  cap = true,
  micro = 0,
  bulbs = [],
  roundEnds = false
} = {}) {
  const frames = curve.computeFrenetFrames(segments, false);
  const position = [], uv = [], index = [];
  const p = new THREE.Vector3(), n = new THREE.Vector3();
  for (let i = 0; i <= segments; i++) {
    const t = i / segments;
    curve.getPointAt(t, p);
    for (let j = 0; j <= sides; j++) {
      const angle = 2 * Math.PI * j / sides;
      const r = tubeRadiusAt(t, radius, { phase, micro, bulbs, roundEnds }, angle);
      n.copy(frames.normals[i]).multiplyScalar(Math.cos(angle) * r).addScaledVector(frames.binormals[i], Math.sin(angle) * r * flatten).add(p);
      position.push(n.x, n.y, n.z);
      uv.push(t * curve.getLength() * 0.45, j / sides);
      if (i < segments && j < sides) {
        const a = i * (sides + 1) + j, b = a + sides + 1;
        index.push(a, a + 1, b, a + 1, b + 1, b);
      }
    }
  }
  if (cap) {
    const first = position.length / 3;
    p.copy(curve.getPointAt(0));
    position.push(p.x, p.y, p.z);
    uv.push(0, 0.5);
    const last = position.length / 3;
    p.copy(curve.getPointAt(1));
    position.push(p.x, p.y, p.z);
    uv.push(1, 0.5);
    for (let j = 0; j < sides; j++) {
      index.push(first, j + 1, j);
      const end = segments * (sides + 1) + j;
      index.push(last, end, end + 1);
    }
  }
  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute("position", new THREE.Float32BufferAttribute(position, 3));
  geometry.setAttribute("uv", new THREE.Float32BufferAttribute(uv, 2));
  geometry.setIndex(index);
  geometry.computeVertexNormals();
  const normals = geometry.attributes.normal, seam = new THREE.Vector3(), tail = new THREE.Vector3();
  for (let i = 0; i <= segments; i++) {
    const first = i * (sides + 1), last = first + sides;
    seam.fromBufferAttribute(normals, first).add(tail.fromBufferAttribute(normals, last)).normalize();
    normals.setXYZ(first, seam.x, seam.y, seam.z);
    normals.setXYZ(last, seam.x, seam.y, seam.z);
  }
  return geometry;
}
function merged(geometries) {
  if (!geometries.length) return new THREE.BufferGeometry();
  const geometry = mergeGeometries(geometries, false);
  for (const item of geometries) item.dispose();
  return geometry;
}
function proteinGeometry(detail = 1) {
  const geometry = new THREE.IcosahedronGeometry(1, detail);
  const positions = geometry.attributes.position;
  for (let i = 0; i < positions.count; i++) {
    const x = positions.getX(i), y = positions.getY(i), z = positions.getZ(i);
    const r = 1 + 0.14 * Math.sin(x * 5.3 + y * 3.7) * Math.cos(z * 4.9) + 0.08 * Math.sin(y * 8 - z * 3.2);
    positions.setXYZ(i, x * r, y * r * 0.86, z * r * 0.93);
  }
  const normalSums = /* @__PURE__ */ new Map(), cornerKeys = [], a = new THREE.Vector3(), b = new THREE.Vector3(), c = new THREE.Vector3(), face = new THREE.Vector3();
  for (let i = 0; i < positions.count; i++) cornerKeys.push(`${Math.round(positions.getX(i) * 1e6)},${Math.round(positions.getY(i) * 1e6)},${Math.round(positions.getZ(i) * 1e6)}`);
  for (let i = 0; i < positions.count; i += 3) {
    a.fromBufferAttribute(positions, i);
    b.fromBufferAttribute(positions, i + 1);
    c.fromBufferAttribute(positions, i + 2);
    face.subVectors(b, a).cross(c.sub(a));
    for (let k = 0; k < 3; k++) {
      const key = cornerKeys[i + k];
      if (!normalSums.has(key)) normalSums.set(key, new THREE.Vector3());
      normalSums.get(key).add(face);
    }
  }
  const normals = geometry.attributes.normal;
  for (let i = 0; i < positions.count; i++) {
    const n = normalSums.get(cornerKeys[i]).normalize();
    normals.setXYZ(i, n.x, n.y, n.z);
  }
  return geometry;
}
function gridSurface(columns, rows, pointAt) {
  const positions = [], uv = [], index = [], p = new THREE.Vector3();
  for (let r = 0; r <= rows; r++) for (let c = 0; c <= columns; c++) {
    pointAt(c / columns, r / rows, p);
    positions.push(p.x, p.y, p.z);
    uv.push(c / columns, r / rows);
    if (r < rows && c < columns) {
      const a = r * (columns + 1) + c, b = a + columns + 1;
      index.push(a, b, a + 1, a + 1, b, b + 1);
    }
  }
  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute("position", new THREE.Float32BufferAttribute(positions, 3));
  geometry.setAttribute("uv", new THREE.Float32BufferAttribute(uv, 2));
  geometry.setIndex(index);
  geometry.computeVertexNormals();
  return geometry;
}
export {
  gridSurface,
  makeReliefTexture,
  merged,
  organicTube,
  proteinGeometry,
  seededRandom,
  tubeRadiusAt
};
