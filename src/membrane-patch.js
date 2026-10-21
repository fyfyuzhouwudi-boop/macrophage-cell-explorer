import * as THREE from "three";

const V = (x = 0, y = 0, z = 0) => new THREE.Vector3(x, y, z);
const TAU = Math.PI * 2;
const AXIS_Y = V(0, 1, 0);
const clamp = THREE.MathUtils.clamp;

// One continuous, flattened, folded cisterna. The wall has two closed boundary
// components: outer face and lumen-facing inner face. They do not share poles.
function makeSheet(detail) {
  const curve = new THREE.CatmullRomCurve3([
    V(-1.42, 0, -0.54), V(-0.65, 0, -0.55), V(0.35, 0, -0.53),
    V(1.20, 0, -0.52), V(1.48, 0, -0.41), V(1.56, 0, -0.27),
    V(1.46, 0, -0.10), V(1.20, 0, 0), V(0.30, 0, 0.015),
    V(-0.66, 0, 0.025), V(-1.10, 0, 0.04), V(-1.39, 0, 0.16),
    V(-1.43, 0, 0.30), V(-1.33, 0, 0.46), V(-1.08, 0, 0.57),
    V(-0.25, 0, 0.59), V(0.55, 0, 0.60), V(1.17, 0, 0.62),
  ], false, "centripetal", 0.5);
  curve.arcLengthDivisions = 2048;
  curve.updateArcLengths();
  const cap = (u) => Math.sin(Math.min(1, Math.max(0, Math.min(u, 1 - u) / 0.038)) * Math.PI / 2);
  function frame(u) {
    const c = curve.getPointAt(u);
    const tangent = curve.getTangentAt(u).normalize();
    const normal = tangent.clone().cross(AXIS_Y).normalize();
    return { c, tangent, normal };
  }
  const width = (u) => 0.92 * (1 + 0.14 * Math.sin(u * TAU * 1.7 - 0.3)
    + 0.045 * Math.sin(u * TAU * 4.1 + 0.8));
  function midHeight(u, y, tangentX) {
    const ratio = y / width(u);
    // The middle of each broad face bends as well as its edge. Independent,
    // unequal wavelengths avoid a stack of flat, uniformly wavy ribbons.
    // Strong corrugation fades at the tight hairpins so the offset surfaces
    // retain positive separation around each turn.
    const tx = tangentX ?? curve.getTangentAt(u).x;
    const s = clamp((Math.abs(tx) - 0.35) / 0.60, 0, 1);
    const straight = s * s * (3 - 2 * s);
    const broad = 0.045 * Math.sin(u * TAU * 2.15 + 0.2);
    const crossFold = 0.075 * Math.sin(ratio * 3.1 + u * 7.3 + 0.6)
      * (0.65 + 0.35 * ratio * ratio);
    const edgeFold = 0.038 * Math.sin(ratio * 6.4 - u * 10.4 + 0.9)
      * (0.30 + 0.70 * ratio * ratio);
    const twist = 0.025 * ratio * Math.cos(u * TAU * 3.2 - 0.7);
    return cap(u) * (broad + straight * (crossFold + edgeFold + twist));
  }
  function point(u, theta, inner = false, local = u) {
    const f = frame(u), outerCap = cap(u), innerCap = inner ? cap(local) : 1;
    const y = width(u) * outerCap * innerCap * (inner ? 0.979 : 1) * Math.cos(theta);
    const h = (inner ? 0.027 : 0.043) * outerCap * innerCap;
    return f.c.addScaledVector(AXIS_Y, y).addScaledVector(f.normal, midHeight(u, y, f.tangent.x) + h * Math.sin(theta));
  }
  // Exposed upper membrane face, used for constrained tangential positions.
  function top(u, v, inner = false) {
    const f = frame(u), y = v * width(u) * cap(u);
    const innerV = v / 0.979;
    const h = (inner ? 0.027 * Math.sqrt(Math.max(0, 1 - innerV * innerV)) : 0.043 * Math.sqrt(Math.max(0, 1 - v * v))) * cap(u);
    return f.c.addScaledVector(AXIS_Y, y).addScaledVector(f.normal, midHeight(u, y, f.tangent.x) + h);
  }
  function surfacePose(u, v) {
    const h = 1e-5, p = top(u, v);
    const along = top(u + h, v).sub(top(u - h, v)).normalize();
    const across = top(u, v + h).sub(top(u, v - h)).normalize();
    const normal = along.clone().cross(across).normalize();
    const second = normal.clone().cross(along).normalize();
    const basis = new THREE.Matrix4().makeBasis(along, second, normal);
    return { position: p, normal, tangent: along, quaternion: new THREE.Quaternion().setFromRotationMatrix(basis) };
  }
  const nu = detail ? 240 : 120, nv = detail ? 64 : 32;
  const positions = [], uvs = [], indices = [], ranges = [];
  function surface(inner) {
    const startIndex = indices.length, startVertex = positions.length / 3;
    const begin = inner ? 0.006 : 0, finish = inner ? 0.994 : 1;
    const firstFrame = frame(begin), first = firstFrame.c.addScaledVector(firstFrame.normal, midHeight(begin, 0, firstFrame.tangent.x));
    positions.push(first.x, first.y, first.z); uvs.push(0, 0.5);
    for (let i = 1; i < nu; i++) {
      const q = i / nu;
      // Match interior cross-section parameters on both boundaries. Only the
      // short end-cap regions retract to independent inner poles; otherwise
      // coarse, phase-shifted samples of a bent face can cross each other.
      const endEase = (x) => { const t = clamp(x / 0.05, 0, 1); return 1 - t * t * (3 - 2 * t); };
      const u = inner ? q + 0.006 * endEase(q) - 0.006 * endEase(1 - q) : q;
      const f = frame(u), outerCap = cap(u), innerCap = inner ? cap(q) : 1;
      for (let j = 0; j < nv; j++) {
        const a = j / nv * TAU, y = width(u) * outerCap * innerCap * (inner ? 0.979 : 1) * Math.cos(a);
        const height = (inner ? 0.027 : 0.043) * outerCap * innerCap;
        const p = f.c.clone().addScaledVector(AXIS_Y, y).addScaledVector(f.normal, midHeight(u, y, f.tangent.x) + height * Math.sin(a));
        positions.push(p.x, p.y, p.z); uvs.push(q * 2.6, j / nv);
      }
    }
    const lastFrame = frame(finish), last = lastFrame.c.addScaledVector(lastFrame.normal, midHeight(finish, 0, lastFrame.tangent.x)), lastIndex = positions.length / 3;
    positions.push(last.x, last.y, last.z); uvs.push(1, 0.5);
    const ring = (i, j) => startVertex + 1 + i * nv + (j + nv) % nv;
    const tri = (a, b, c) => inner ? indices.push(a, c, b) : indices.push(a, b, c);
    for (let j = 0; j < nv; j++) {
      tri(startVertex, ring(0, j + 1), ring(0, j));
      for (let i = 0; i < nu - 2; i++) {
        const a = ring(i, j), b = ring(i, j + 1), c = ring(i + 1, j), d = ring(i + 1, j + 1);
        tri(a, b, c); tri(b, d, c);
      }
      tri(ring(nu - 2, j), ring(nu - 2, j + 1), lastIndex);
    }
    ranges.push({ start: startIndex, count: indices.length - startIndex, materialIndex: inner ? 1 : 0, startVertex, vertexCount: positions.length / 3 - startVertex, boundary: inner ? "lumen-facing" : "cytosol-facing" });
  }
  surface(false); surface(true);
  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute("position", new THREE.Float32BufferAttribute(positions, 3));
  geometry.setAttribute("uv", new THREE.Float32BufferAttribute(uvs, 2));
  geometry.setIndex(indices);
  ranges.forEach((r) => geometry.addGroup(r.start, r.count, r.materialIndex));
  geometry.computeVertexNormals(); geometry.computeBoundingBox(); geometry.computeBoundingSphere();
  return { geometry, ranges, frame, top, surfacePose, midHeight, width, curve, nu, nv, point };
}

function microGrain() {
  const n = 96, data = new Uint8Array(n * n * 4);
  for (let y = 0; y < n; y++) for (let x = 0; x < n; x++) {
    const value = Math.round(222 + 11 * Math.sin(x * 1.31 + Math.sin(y * 0.7) * 2) + 8 * Math.sin(y * 1.83 + x * 0.59));
    const i = (y * n + x) * 4;
    data[i] = data[i + 1] = data[i + 2] = value; data[i + 3] = 255;
  }
  const texture = new THREE.DataTexture(data, n, n, THREE.RGBAFormat);
  texture.wrapS = texture.wrapT = THREE.RepeatWrapping;
  texture.repeat.set(2, 1);
  texture.generateMipmaps = true;
  texture.minFilter = THREE.LinearMipmapLinearFilter;
  texture.needsUpdate = true;
  texture.userData.teachingTexture = "Procedural surface grain; not electron microscopy data";
  return texture;
}

function proteinSymbol(detail) {
  const controlProfile = [[-0.034, 0], [-0.031, 0.017], [-0.025, 0.023], [-0.018, 0.016],
    [-0.013, 0.012], [0, 0.012], [0.008, 0.021], [0.023, 0.040], [0.043, 0.038], [0.062, 0.024], [0.070, 0]];
  const profile = new THREE.CatmullRomCurve3(controlProfile.map(([z,r])=>V(z,r,0)),false,"centripetal",0.5).getPoints(detail?64:24).map(p=>[p.x,Math.max(0,p.y)]);
  const sides = detail ? 32 : 16, p = [], ix = [];
  p.push(0, 0, profile[0][0]);
  for (let i = 1; i < profile.length - 1; i++) for (let j = 0; j < sides; j++) {
    const a = j / sides * TAU, [z, r] = profile[i], shape = 1 + 0.13 * Math.cos(a * 3 + z * 15) + 0.045 * Math.sin(a);
    p.push(Math.cos(a) * r * shape, Math.sin(a) * r * shape * 0.72, z);
  }
  const end = p.length / 3;
  p.push(0, 0, profile.at(-1)[0]);
  const ring = (i, j) => 1 + i * sides + (j + sides) % sides;
  for (let j = 0; j < sides; j++) {
    ix.push(0, ring(0, j + 1), ring(0, j));
    for (let i = 0; i < profile.length - 3; i++) {
      const a = ring(i, j), b = ring(i, j + 1), c = ring(i + 1, j), d = ring(i + 1, j + 1);
      ix.push(a, b, c, b, d, c);
    }
    ix.push(ring(profile.length - 3, j), ring(profile.length - 3, j + 1), end);
  }
  const g = new THREE.BufferGeometry();
  g.setAttribute("position", new THREE.Float32BufferAttribute(p, 3)); g.setIndex(ix);
  g.computeVertexNormals(); g.computeBoundingSphere();
  return g;
}

export function createMembranePatch({ detail = true } = {}) {
  const sheet = makeSheet(Boolean(detail)), group = new THREE.Group();
  group.name = "FoldedThinCisternaPatch";
  group.userData = { teachingOnly: true, representativePatch: true, organelleId: "er", section: 0, boundaryIdentity: "Two boundary surfaces of one membrane wall around one aqueous lumen", motionIdentity: "Illustrative bounded surface motion, not measured diffusion" };
  const grain = microGrain();
  const makeMaterial = (color, role = "membrane") => {
    const m = new THREE.MeshPhysicalMaterial({ color, roughness: role === "protein" ? 0.66 : 0.49, metalness: 0, clearcoat: 0.13, clearcoatRoughness: 0.42, envMapIntensity: 0.7, bumpMap: grain, bumpScale: 0.0018, side: THREE.DoubleSide });
    m.userData.atlasMaterialRole = role; return m;
  };
  const outerMaterial = makeMaterial("#9cb7bd"), innerMaterial = makeMaterial("#bdcabe");
  const wall = new THREE.Mesh(sheet.geometry, [outerMaterial, innerMaterial]);
  wall.name = "ClosedThinCisternaMembraneWall";
  wall.userData = { shell: true, organelleId: "er", teachingOnly: true, atlasMaterialRole: "membrane", boundaryRanges: sheet.ranges };
  group.add(wall);
  const actors = [
    { u: 0.82, v: -0.16, phase: 0.35, frequency: 0.47, du: 0.0011, dv: 0.006, color: "#b596ae" },
    { u: 0.92, v: 0.32, phase: 2.10, frequency: 0.63, du: 0.0009, dv: 0.005, color: "#b8aa80" },
  ].map((data, index) => {
    const mesh = new THREE.Mesh(proteinSymbol(Boolean(detail)), makeMaterial(data.color, "protein"));
    mesh.name = "GenericTransmembranePositionSymbol" + (index + 1);
    mesh.userData = { teachingOnly: true, organelleId: "membrane", identity: "Generic transmembrane placement symbol, not a named protein or atomic structure", cytosolicDirection: "+localZ", luminalDirection: "-localZ" };
    group.add(mesh);
    return { ...data, mesh, baseU: data.u, baseV: data.v };
  });
  const focus = V(0, 0, 0.03), insideU = 0.828, insideV = -0.12;
  const lumenCenter = (u, v) => {
    const f = sheet.frame(u), y = sheet.width(u) * v;
    return f.c.addScaledVector(AXIS_Y, y).addScaledVector(f.normal, sheet.midHeight(u, y));
  };
  const firstActor = actors[0];
  const initialActorPose = sheet.surfacePose(firstActor.baseU + firstActor.du * Math.sin(firstActor.phase), firstActor.baseV + firstActor.dv * Math.sin(firstActor.phase * 1.63));
  const anchors = {
    focus,
    inside: lumenCenter(insideU, insideV),
    insideTarget: initialActorPose.position.clone().addScaledVector(initialActorPose.normal, -0.028),
    micro: V(2.75, 2.05, 2.25),
    microTarget: V(0.15, 0, 0.04),
  };
  const plane = new THREE.Plane(V(0, -1, 0), 2), worldPlane = plane.clone();
  let elapsed = 0, section = 0, disposed = false;
  function applySection() {
    group.updateWorldMatrix(true, false);
    worldPlane.copy(plane).applyMatrix4(group.matrixWorld);
    for (const m of [outerMaterial, innerMaterial, ...actors.map((a) => a.mesh.material)]) {
      const wanted = section > 0.002;
      if (Boolean(m.clippingPlanes?.length) !== wanted) m.needsUpdate = true;
      m.clippingPlanes = wanted ? [worldPlane] : null;
    }
  }
  function poseActors() {
    for (const a of actors) {
      const u = a.baseU + a.du * Math.sin(elapsed * a.frequency + a.phase);
      const v = a.baseV + a.dv * Math.sin(elapsed * a.frequency * 0.79 + a.phase * 1.63);
      const pose = sheet.surfacePose(u, v);
      a.mesh.position.copy(pose.position); a.mesh.quaternion.copy(pose.quaternion);
      a.mesh.userData.surfaceUV = [u, v];
      a.mesh.userData.surfaceNormal = pose.normal.toArray();
      a.mesh.userData.motionElapsed = elapsed;
    }
  }
  function setSection(value) {
    if (disposed) return;
    section = clamp(Number(value) || 0, 0, 1);
    plane.constant = THREE.MathUtils.lerp(1.15, -0.22, section);
    group.userData.section = section;
    applySection();
  }
  function update(_t, dt = 0) {
    if (disposed) return;
    if (Number.isFinite(dt) && dt > 0) { elapsed += dt; poseActors(); }
    if (section > 0.002) applySection();
  }
  function dispose() {
    if (disposed) return;
    disposed = true;
    const geometries = new Set(), materials = new Set();
    group.traverse((o) => { if (o.isMesh) { geometries.add(o.geometry); for (const m of Array.isArray(o.material) ? o.material : [o.material]) materials.add(m); } });
    for (const g of geometries) g.dispose();
    for (const m of materials) m.dispose();
    grain.dispose(); group.clear();
  }
  poseActors(); setSection(0);
  const radius = sheet.geometry.boundingSphere.radius + 0.10;
  const stats = { detail: Boolean(detail), modelIdentity: "Representative folded thin cisterna; not a complete ER network, measured reconstruction or lipid-level model", wallMeshes: 1, boundarySurfaces: 2, expectedBoundaryComponents: 2, aqueousLumenComponents: 1, foldTurns: 2, broadSheetRuns: 3, maximumFullOuterThickness: 0.086, nominalWaterGap: 0.054, nominalWallFaceThickness: 0.016, wallVertices: sheet.geometry.attributes.position.count, wallTriangles: sheet.geometry.index.count / 3, genericTransmembraneSymbols: 2, motionIdentity: "Bounded different-phase tangential placement; no measured diffusion coefficients", geometryRanges: sheet.ranges };
  const facts = ["A single folded thin cisterna encloses one aqueous lumen; its outer and inner boundary surfaces describe one membrane wall.", "The small lumen camera lies inside the water compartment; the membrane-wall thickness is not a water cavity.", "Two non-spherical symbols illustrate transmembrane position and sidedness. Their bounded lateral motion is not a named protein or measured molecular diffusion.", "The optional micro anchor is an external oblique view of the folded sheets, not an intraluminal camera."];
  return { group, radius, anchors, setSection, update, dispose, stats, facts, metadata: { teachingOnly: true, sectionPlaneSpace: "group-local plane transformed to world", innerMaterialIndex: 1, outerMaterialIndex: 0 } };
}
