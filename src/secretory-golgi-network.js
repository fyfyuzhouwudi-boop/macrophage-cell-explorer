import * as THREE from "three";
import { attachSmoothERNetwork } from "./er-smooth-network.js";

/**
 * A coarse trans-Golgi tubulocisternal domain, informed by Ladinsky et al.
 * (1994, 1999). The reusable mesh builder supplies topology only: this mesh
 * has no ER identity. Its reservoir and branched tubes share vertex IDs and
 * enclose one lumen, independently of the other Golgi cisternae.
 */
export function createTransGolgiNetwork({ detail = true, level = .97 } = {}) {
  const sides = detail ? 24 : 12;
  const rings = detail ? 28 : 16;
  const p = [], uv = [], indices = [];
  // The reservoir narrows into a circular terminal port. No intersecting
  // closed spheres are used to suggest a connection that is not present.
  for (let k = 0; k <= rings; k++) {
    const t = k / rings;
    const x = -.9 + .98 * t;
    const profile = Math.sin(Math.PI * t) ** .7;
    const ry = .027 + .027 * profile;
    const rz = .027 + .35 * profile;
    for (let j = 0; j < sides; j++) {
      const a = j / sides * Math.PI * 2;
      p.push(x, level + Math.cos(a) * ry, -.12 + Math.sin(a) * rz);
      uv.push(t, j / sides);
      if (k < rings) {
        const a0 = k * sides + j, b = k * sides + (j + 1) % sides;
        indices.push(a0, b, a0 + sides, b, b + sides, a0 + sides);
      }
    }
  }
  for (const k of [0, rings]) {
    const center = p.length / 3;
    p.push(k === 0 ? -.9 : .08, level, -.12);
    uv.push(k / rings, .5);
    for (let j = 0; j < sides; j++) {
      const a = k * sides + j, b = k * sides + (j + 1) % sides;
      if (k === 0) indices.push(center, b, a);
      else indices.push(center, a, b);
    }
  }
  const seed = new THREE.BufferGeometry();
  seed.setAttribute("position", new THREE.Float32BufferAttribute(p, 3));
  seed.setAttribute("uv", new THREE.Float32BufferAttribute(uv, 2));
  seed.setIndex(indices);
  seed.addGroup(0, indices.length, 0);
  seed.computeVertexNormals();
  const result = attachSmoothERNetwork({ geometry: seed, capCenterId: p.length / 3 - 1, scale: .69, sideRotation: Math.PI / 2, materialIndex: 0 });
  seed.dispose();
  const metadata = {
    teachingOnly: true,
    source: "https://pmc.ncbi.nlm.nih.gov/articles/PMC2150572/",
    independentFromStackLumen: true,
    continuousReservoirAndTubules: true,
    sharedPortVertexCount: sides,
    junctions: result.metadata.junctions,
    closedCycles: result.metadata.closedNetworkCycles,
    terminalBranches: result.metadata.terminalBranches,
    paths: result.metadata.paths,
    description: "One schematic TGN reservoir with a branched tubular extension. Not a reconstruction of a macrophage or all trans-cisternal connections."
  };
  result.geometry.userData = { secretoryDomain: "tgn", metadata };
  return { geometry: result.geometry, metadata };
}
