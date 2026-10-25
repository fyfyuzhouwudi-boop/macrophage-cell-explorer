// Coarse, representative endolysosomal domains for the whole-cell view.
// These are teaching meshes, not a morphology classifier or EM segmentation.
import {createDegradativeLumenGeometry} from './compartment-ultrastructure.js';
import {applyWholeOrganelleFinish} from './whole-organelle-finish.js';
const TAU = Math.PI * 2;
function seeded(seed) { let x = seed >>> 0; return () => ((x = (1664525 * x + 1013904223) >>> 0) / 4294967296); }

// A vacuolar body and a sorting tubule share the SAME neck ring. No intersecting
// closed sphere/tube shells, no membrane disk plugging the shared lumen.
export function createSortingEndosomeGeometry(THREE, { tubuleLength = 1.15, bend = 0.35, neckRadius = 0.24 } = {}) {
  const p = [], uv = [], indices = [], rings = [], n = 28, alpha = Math.asin(neckRadius);
  const put = (v, u, w) => { const i = p.length / 3; p.push(...v); uv.push(u, w); return i; };
  const ring = (center, radius, normal, binormal, u) => {
    const ids = [];
    for (let j = 0; j < n; j++) { const a = j / n * TAU; ids.push(put(center.clone().addScaledVector(normal, Math.cos(a) * radius).addScaledVector(binormal, Math.sin(a) * radius).toArray(), u, j / n)); }
    rings.push(ids);
  };
  const south = put([-1, 0, 0], 0, 0), y = new THREE.Vector3(0, 1, 0), z = new THREE.Vector3(0, 0, 1);
  for (let j = 1; j <= 23; j++) {
    const theta = Math.PI + (alpha - Math.PI) * j / 23;
    ring(new THREE.Vector3(Math.cos(theta), 0, 0), Math.sin(theta), y, z, j / 40);
  }
  const x0 = Math.cos(alpha), centerAt = t => new THREE.Vector3(x0 + tubuleLength * t, bend * t * t, 0.13 * Math.sin(Math.PI * t) ** 2);
  const tangentAt = t => new THREE.Vector3(tubuleLength, 2 * bend * t, 0.13 * Math.PI * Math.sin(TAU * t)).normalize();
  const path = [new THREE.Vector3(0, 0, 0), new THREE.Vector3(x0 * 0.55, 0, 0), centerAt(0)];
  let lastTangent = new THREE.Vector3(1, 0, 0);
  for (let j = 1; j <= 14; j++) {
    const t = j / 14, tangent = tangentAt(t), normal = y.clone().addScaledVector(tangent, -y.dot(tangent)).normalize(), binormal = new THREE.Vector3().crossVectors(tangent, normal).normalize();
    const radius = neckRadius * (0.72 + 0.28 * Math.exp(-t * 7)) * (j === 14 ? 0.60 : j === 13 ? 0.88 : 1);
    ring(centerAt(t), radius, normal, binormal, (23 + j) / 40);
    path.push(centerAt(t)); lastTangent = tangent;
  }
  const north = put(centerAt(1).addScaledVector(lastTangent, neckRadius * 0.46).toArray(), 1, 0);
  for (let j = 0; j < n; j++) indices.push(south, rings[0][j], rings[0][(j + 1) % n]);
  for (let r = 0; r < rings.length - 1; r++) for (let j = 0; j < n; j++) {
    const a = rings[r][j], b = rings[r][(j + 1) % n], c = rings[r + 1][j], d = rings[r + 1][(j + 1) % n]; indices.push(a, c, b, c, d, b);
  }
  for (let j = 0; j < n; j++) indices.push(rings.at(-1)[j], north, rings.at(-1)[(j + 1) % n]);
  let volume6 = 0;
  for (let i = 0; i < indices.length; i += 3) { const a = new THREE.Vector3().fromArray(p, indices[i] * 3), b = new THREE.Vector3().fromArray(p, indices[i + 1] * 3), c = new THREE.Vector3().fromArray(p, indices[i + 2] * 3); volume6 += a.dot(b.cross(c)); }
  if (volume6 < 0) for (let i = 0; i < indices.length; i += 3) [indices[i + 1], indices[i + 2]] = [indices[i + 2], indices[i + 1]];
  const geometry = new THREE.BufferGeometry(); geometry.setAttribute('position', new THREE.Float32BufferAttribute(p, 3)); geometry.setAttribute('uv', new THREE.Float32BufferAttribute(uv, 2)); geometry.setIndex(indices); geometry.computeVertexNormals(); geometry.computeBoundingSphere();
  geometry.userData = { teachingOnly: true, bodyAndTubuleSharePort: true, closedEnd: true, sharedNeckRing: rings[22], sortingPath: path.map(q => q.toArray()), notUniversalMorphology: true };
  return geometry;
}

export function createWholeVesicleDomain({ THREE, id, radius, variant = 0, wallMaterial, cargoMaterial, makeMaterial, shardGeometry }) {
  if (!['endosome', 'lysosome'].includes(id)) throw new RangeError('Unsupported whole-cell vesicle domain: ' + id);
  const rand = seeded((id === 'endosome' ? 7127 : 8191) + variant * 571), lumen = new THREE.Group(), resources = { geometries: [], materials: [] }, placements = [], movers = [];
  let reservedSortingPath = null;
  lumen.name = 'LumenCargoGranules';
  const ownGeo = g => (resources.geometries.push(g), g), ownMat = (color, roughness, options = {}) => { const m = makeMaterial(color, roughness, options); resources.materials.push(m); return m; };
  function mesh(name, geometry, material, position, scale) { const o = new THREE.Mesh(geometry, material); o.name = name; o.position.copy(position); o.scale.copy(scale); o.userData.organelleId = id; o.userData.teachingOnly = true; o.receiveShadow = true; lumen.add(o); return o; }
  function pack(envelope, limit = 0.84) {
    for (let a = 0; a < 2500; a++) {
      const az = rand() * TAU, z = rand() * 2 - 1, d = Math.cbrt(rand()) * (limit * radius - envelope), sn = Math.sqrt(1 - z * z), point = new THREE.Vector3(Math.cos(az) * sn * d, Math.sin(az) * sn * d, z * d);
      if (reservedSortingPath?.some(q => q.distanceTo(point) <= envelope + radius * 0.075)) continue;
      if (placements.every(q => q.point.distanceTo(point) > q.envelope + envelope + radius * 0.018)) { placements.push({ point, envelope }); return point; }
    }
    throw new Error('Could not place representative ' + id + ' lumen content');
  }
  let wallGeometry = null, representativeStage;
  const stats = { teachingOnly: true, measuredGeometry: false, identityBasis: 'Content, compartment domains and process; appearance overlaps between stages', variant, intralumenalVesicles: 0, hydrolases: 0, residuePieces: 0, sortingTubules: 0, movingLumenCargo: 0 };
  if (id === 'endosome') {
    const early = variant === 0, recycling = variant === 2;
    representativeStage = early ? 'sorting-early-endosome' : recycling ? 'tubulovesicular-recycling-domain' : 'multivesicular-late-endosome';
    if (early || recycling) {
      wallGeometry = ownGeo(createSortingEndosomeGeometry(THREE, { tubuleLength: recycling ? 1.6 : 1.05, bend: recycling ? -0.30 : 0.36, neckRadius: recycling ? 0.20 : 0.25 }));
      stats.sortingTubules = 1;
      const path = wallGeometry.userData.sortingPath.map(p => new THREE.Vector3(...p).multiplyScalar(radius)), curve = new THREE.CatmullRomCurve3(path, false, 'centripetal');
      reservedSortingPath = Array.from({ length: 161 }, (_, i) => curve.getPoint(0.06 + 0.76 * i / 160));
      const markerGeometry = ownGeo(new THREE.IcosahedronGeometry(radius * 0.045, 1));
      for (let i = 0; i < 2; i++) { const marker = mesh('EndosomalLumenSortingCargo', markerGeometry, cargoMaterial, curve.getPoint(i * 0.4), new THREE.Vector3(1, 1, 1)); movers.push({ marker, curve, phase: i * 0.43 }); }
      stats.movingLumenCargo = movers.length;
    }
    const count = early ? 2 : recycling ? 1 : 7;
    const ilvGeometry = ownGeo(new THREE.SphereGeometry(1, 14, 10)), ilvMaterial = ownMat('#8ca5b4', 0.33, { transparent: false, transmission: 0.48, thickness: 0.008, side: THREE.DoubleSide, map: null, bumpMap: null, bumpScale: 0, roughnessMap: null });
    ilvMaterial.userData.continuousSurfaceV1 = true;
    // makeMaterial is a physical-material factory supplied by the integration.
    for (let i = 0; i < count; i++) {
      const r = radius * (0.115 + rand() * 0.075), point = pack(r), outer = mesh('EndosomalIntralumenalVesicleMembrane', ilvGeometry, ilvMaterial, point, new THREE.Vector3(r, r, r));
      outer.userData.contentDomain = 'intralumenal-vesicle';
      if (i < 2) mesh('IntralumenalVesicleCargo', ownGeo(new THREE.IcosahedronGeometry(r * 0.36, 0)), cargoMaterial, point, new THREE.Vector3(1, 0.7, 0.9));
    }
    stats.intralumenalVesicles = count;
    stats.note = 'Representative early sorting, multivesicular late and recycling domains; neither tubular shape nor ILVs uniquely identifies an endosome.';
  } else {
    representativeStage = variant === 0 ? 'fusion-competent-heterogeneous-degradative-compartment' : variant === 1 ? 'heterogeneous-partly-digested-residue' : 'selected-degradative-compartment-with-lower-residual-load';
    const content=createDegradativeLumenGeometry({detail:false,variant});
    const residueGeometry=ownGeo(content.residueGeometry.scale(radius,radius,radius)),remnantGeometry=ownGeo(content.remnantGeometry.scale(radius,radius,radius));
    const residueMaterial=ownMat('#ffffff',.88,{vertexColors:true,transparent:false,opacity:1,transmission:0,clearcoat:0,envMapIntensity:.36,map:null,bumpMap:null,bumpScale:0,roughnessMap:null});
    const remnantMaterial=ownMat('#ae9298',.77,{transparent:false,opacity:1,transmission:0,clearcoat:0,envMapIntensity:.36,map:null,bumpMap:null,bumpScale:0,roughnessMap:null,side:THREE.FrontSide});
    residueMaterial.userData.atlasMaterialRole='cargo';remnantMaterial.userData.atlasMaterialRole='membrane';
    const inverseRadius=1/Math.max(.2,radius);
    applyWholeOrganelleFinish(residueMaterial,{contrast:.25,relief:.0038,roughnessVariation:.10,scale:11.2*inverseRadius,maxSlope:.18,seed:11.8,softScatter:.02});
    applyWholeOrganelleFinish(remnantMaterial,{contrast:.18,relief:.0024,roughnessVariation:.09,scale:9.6*inverseRadius,maxSlope:.16,seed:14.2,softScatter:.02});
    const residual=mesh('HeterogeneousEndolysosomalDenseResidualDomains',residueGeometry,residueMaterial,new THREE.Vector3(),new THREE.Vector3(1,1,1));
    residual.userData.contentDomain='heterogeneous-unresolved-residual-material';
    const remnant=mesh('EccentricPartialLuminalMembraneCurls',remnantGeometry,remnantMaterial,new THREE.Vector3(),new THREE.Vector3(1,1,1));
    remnant.userData.contentDomain='selected-luminal-membrane-remnants-not-limiting-membranes';remnant.userData.closedLuminalMembraneRemnant=true;
    for(const placement of content.placements){
      const point=placement.point.clone().multiplyScalar(radius),envelope=placement.envelope*radius;
      if(point.length()+envelope>radius*.84)throw Error('Degradative content exceeds its reserved packing envelope');
      placements.push({point,envelope,kind:placement.kind});
    }
    // Keep a single opaque limiting membrane. Internal membrane remnants are
    // exposed by the existing cutaway and never require a transparent stack.
    wallMaterial.transmission=0;wallMaterial.transparent=false;wallMaterial.opacity=1;wallMaterial.depthWrite=true;
    wallMaterial.roughness=Math.max(.68,wallMaterial.roughness);wallMaterial.clearcoat=0;wallMaterial.envMapIntensity=Math.min(.42,wallMaterial.envMapIntensity);
    wallMaterial.needsUpdate=true;
    stats.residuePieces=content.stats.denseResidualDomains;stats.partialLuminalMembraneCurls=content.stats.partialLuminalMembraneCurls;stats.hydrolases=0;stats.sourceStudies=content.sources;
    stats.contentMeshCount=2;stats.electronDensityDoesNotMeasureActivity=true;
    stats.note='Selected heterogeneous endolysosomal representatives: irregular dense residual domains and eccentric partial membrane remnants. No free enzyme identity is inferred from EM appearance; not all lysosomes contain these remnants. The third variant denotes lower residual load, not enzyme activity.';
  }
  const summary = { ...stats, representativeStage, lumenClearance: Math.min(...placements.map(q => radius - q.point.length() - q.envelope)), largestPackedEnvelope: Math.max(0, ...placements.map(q => q.envelope)), contentCount: placements.length };
  lumen.userData = { ...lumen.userData, organelleId: id, representativeDomain: summary, teachingOnly: true };
  function update(t, dt) { if (!(dt > 0)) return; for (const m of movers) { const u = (t * 0.075 + m.phase) % 1, s = 0.5 - 0.5 * Math.cos(u * TAU); m.marker.position.copy(m.curve.getPoint(0.06 + 0.76 * s)); } }
  return { lumen, wallGeometry, summary, placements, resources, update };
}
