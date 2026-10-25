import * as THREE from 'three';

// Explicit membrane surfaces for the first two host-response views. The front
// is a geometric section, never a transparency trick or a biological hole.
export function responseOpenMembrane(radius, cutZ, segments = 64, rings = 30) {
  const theta = Math.acos(cutZ / radius);
  const geometry = new THREE.SphereGeometry(radius, segments, rings, 0, Math.PI * 2, theta, Math.PI - theta);
  geometry.rotateX(Math.PI / 2);
  return geometry;
}

export function responseCurvedMembranePatch(radius = .76, thickness = .045) {
  const positions = [], indices = [], rings = 12, sectors = 64;
  const height = (r, side) => -.14 * (r / radius) ** 2 + side * thickness / 2;
  for (const side of [1, -1]) for (let ring = 0; ring <= rings; ring++) {
    const r = radius * ring / rings;
    for (let i = 0; i <= sectors; i++) {
      const a = i / sectors * Math.PI * 2;
      positions.push(r * Math.cos(a), r * Math.sin(a), height(r, side));
    }
  }
  const faceCount = (rings + 1) * (sectors + 1);
  for (let side = 0; side < 2; side++) {
    const offset = side * faceCount;
    for (let ring = 0; ring < rings; ring++) for (let i = 0; i < sectors; i++) {
      const a = offset + ring * (sectors + 1) + i, b = a + sectors + 1;
      if (!side) indices.push(a, b, a + 1, a + 1, b, b + 1);
      else indices.push(a, a + 1, b, a + 1, b + 1, b);
    }
  }
  // The two face groups are the opposite faces of ONE bilayer membrane.
  const rimStart = indices.length;
  for (let i = 0; i < sectors; i++) {
    const a = rings * (sectors + 1) + i, b = a + faceCount;
    indices.push(a, a + 1, b, a + 1, b + 1, b);
  }
  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
  geometry.setIndex(indices);
  const singleFaceIndices = rings * sectors * 6;
  geometry.addGroup(0, singleFaceIndices, 0);
  geometry.addGroup(singleFaceIndices, singleFaceIndices, 1);
  geometry.addGroup(rimStart, indices.length - rimStart, 2);
  geometry.computeVertexNormals();
  return geometry;
}

export function nearestGeometryAnchor(geometry, desired) {
  const positions = geometry.attributes.position, sample = new THREE.Vector3();
  let best = Infinity, point = new THREE.Vector3();
  for (let i = 0; i < positions.count; i++) {
    sample.fromBufferAttribute(positions, i);
    const distance = sample.distanceToSquared(desired);
    if (distance < best) { best = distance; point.copy(sample); }
  }
  return point.toArray();
}
