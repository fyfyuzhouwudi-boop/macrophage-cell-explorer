import * as THREE from 'three';

// These are schematic membrane-domain models, not interpolated atomic structures.
// All animation is evaluated from the host's dt or explicit seek, never wall time.
export const FUSION_IDS = Object.freeze(['snare-fusion', 'ha-fusion']);
export const FUSION_SOURCES = Object.freeze({
  macrophage: { title: 'Ward et al., 2000 · 肺泡巨噬细胞的 STX7 / VAMP7 融合实验', url: 'https://pmc.ncbi.nlm.nih.gov/articles/PMC14922/' },
  endosome: { title: 'Pryor et al., 2004 · 晚期内体–溶酶体 SNARE 配对', url: 'https://pmc.ncbi.nlm.nih.gov/articles/PMC1299070/' },
  snareTopology: { title: 'Sharma & Lindau, 2018 · SNARE 融合孔的分子模拟', url: 'https://pmc.ncbi.nlm.nih.gov/articles/PMC6294955/' },
  ha: { title: 'Benton et al., 2020 · HA 低 pH 构象的冷冻电镜', url: 'https://www.nature.com/articles/s41586-020-2333-6' },
  haTomography: { title: 'Calder & Rosenthal, 2016 · 流感膜融合的冷冻电镜断层', url: 'https://pmc.ncbi.nlm.nih.gov/articles/PMC6485592/' },
  haCoordinates: { title: 'PDB 6Y5H · HA 实验结构与关联状态', url: 'https://www.rcsb.org/structure/6Y5H' },
});

const SNARE_STAGES = Object.freeze([
  { at: 0, title: '识别与靠近', desc: '两层独立的脂质双层仍分隔各自腔室。系留与调控因子未逐一绘制；放大展示跨膜锚和胞质侧 SNARE。' },
  { at: .16, title: '从 N 端开始拉链化', desc: 'STX7、VTI1B、STX8 与 VAMP7 的 SNARE 基序配对成四螺旋束，装配向膜近端推进。蛋白质的跨膜段仍锚定原膜。' },
  { at: .43, title: '近端单层形成融合柄', desc: '相向的两片胞质侧单层建立连续连接。远端单层尚未开孔，腔内容物不能通过。几何切换表示拓扑事件，不是逐原子的实测轨迹。' },
  { at: .59, title: '半融合隔膜', desc: '接触区扩大：近端单层已经相连，两个远端单层构成仍然封闭的隔膜。此处采用一种常用融合路径，并非所有事件都可分辨出长寿命隔膜。' },
  { at: .78, title: '水性融合孔开放', desc: '隔膜中央出现真实几何开口，双层沿孔缘连续转弯。只有孔打开后，腔内示踪颗粒才穿过；颜色代表来源，非永久不混合边界。' },
  { at: .91, title: '孔扩张与腔室连通', desc: '孔径扩张，两侧腔室相通。演示到此停止；SNARE 的 NSF / α-SNAP 解离回收和后续形态变化未纳入本段。' },
]);
const HA_STAGES = Object.freeze([
  { at: 0, title: '内化后的病毒包膜', desc: '本段从已进入内体的流感样包膜颗粒开始。上方为病毒包膜，下方为内体限制膜，中间间隙为内体腔；并非细胞表面的吞噬杯。' },
  { at: .16, title: '低 pH 激活与伸展', desc: '合适的酸化条件触发已经成熟的 HA 三聚体重排。HA2 的融合肽暴露并插入靶膜的内体腔侧单层；HA 跨膜段仍留在病毒包膜。' },
  { at: .43, title: 'HA2 折返并拉近双膜', desc: 'HA2 向折返构象重排，让融合肽和跨膜锚接近。被拉近的是病毒包膜与内体限制膜；结合、内化和融合是不同步骤。' },
  { at: .59, title: '融合柄与半融合', desc: '近端单层形成连续膜结构，远端单层仍分隔病毒内部与细胞质。采用冷冻电镜支持的一类中间态示意，未把它当作唯一必经轨迹。' },
  { at: .78, title: '融合孔连通', desc: '开口连通病毒内部与细胞质，孔缘为连续脂质双层。小粒子仅标示水性连通，不代表真实病毒核糖核蛋白的解包或穿孔动力学。' },
  { at: .91, title: '融合后的条件性通路', desc: '膜融合不等于成功复制。本段不预测巨噬细胞是否支持某种流感毒株的生产性感染，也不把 HA 机制泛化到所有病毒。' },
]);

export const FUSION_CATALOG = Object.freeze({
  'snare-fusion': {
    name: 'SNARE 膜融合', short: '宿主囊泡融合', en: 'Endolysosomal SNARE fusion', color: '#eea14d', duration: 24,
    summary: '观察晚期内体–溶酶体的代表性 SNARE 配对、双膜接近、半融合与真实水性孔。',
    stages: SNARE_STAGES,
    guide: {
      title: '宿主膜融合 · 从蛋白装配到水性开孔',
      function: '晚期内体与溶酶体之间的受调控膜融合，让两个膜包围腔室交换内容物。',
      location: '上、下膜外侧分别是两个腔室；相向的膜面和 SNARE 基序位于胞质侧。',
      partners: ['STX7（Qa）', 'VTI1B（Qb）', 'STX8（Qc）', 'VAMP7（R）'],
      features: [
        { name: '双层与膜锚', function: '每个膜片有两片亲水头基层，疏水尾部位于两者之间；跨膜锚贯穿双层。', visible: true, views: ['ordinary'], parts: ['snare-fusion'] },
        { name: 'SNARE 四螺旋束', function: '四条 SNARE 螺旋在胞质侧从 N 端向膜近端装配。', visible: true, views: ['ordinary'], parts: ['snare-fusion'] },
        { name: '融合柄与水性孔', function: '融合柄、封闭半融合隔膜和开放水性孔使用不同的实际表面拓扑。', visible: true, views: ['ordinary'], parts: ['snare-fusion'] },
        { name: '内化后的融合', function: '吞噬首先由质膜包裹颗粒；这里展示内化之后的膜融合机制。', visible: true, views: ['ordinary'], parts: ['snare-fusion'] },
      ],
      sources: [FUSION_SOURCES.macrophage, FUSION_SOURCES.endosome, FUSION_SOURCES.snareTopology],
      note: '模型依据实验支持的蛋白配对及膜拓扑绘制；蛋白轮廓、数量、速度和尺寸经过教学处理，非原子坐标或某一次细胞事件重建。SNARE 拉链的详细轨迹借鉴通用机制，未宣称是该组合的实测运动。',
    },
  },
  'ha-fusion': {
    name: 'HA 病毒膜融合', short: '流感 HA 构象', en: 'Influenza HA-mediated fusion', color: '#ba8dd6', duration: 25,
    summary: '观察已内化的流感样包膜颗粒，在合适酸化条件下由 HA 伸展和折返促进膜融合。',
    stages: HA_STAGES,
    guide: {
      title: '包膜病毒案例 · 流感 HA 的伸展与折返',
      function: '成熟 HA 在合适的低 pH 条件下重排，将病毒包膜与内体限制膜拉近并促进融合。',
      location: '上方病毒内部、下方细胞质；双膜之间是内体腔，HA 作用在这个腔侧。',
      partners: ['HA1 头部', 'HA2 螺旋骨架', '融合肽', '病毒膜内的跨膜锚'],
      features: [
        { name: 'HA 三聚体', function: '三条 HA2 链和三个 HA1 头部以分色轮廓表现。', visible: true, views: ['ordinary'], parts: ['ha-fusion'] },
        { name: '融合肽与跨膜锚', function: '融合肽插入靶膜时，跨膜锚仍位于病毒包膜。', visible: true, views: ['ordinary'], parts: ['ha-fusion'] },
        { name: '构象与膜拓扑', function: '伸展、折返、半融合及开放孔各有可拖动的时间阶段。', visible: true, views: ['ordinary'], parts: ['ha-fusion'] },
        { name: '条件性通路', function: '模型只展示条件满足后的流感 HA 膜融合，不等同于吞噬或病毒复制。', visible: true, views: ['ordinary'], parts: ['ha-fusion'] },
      ],
      sources: [FUSION_SOURCES.ha, FUSION_SOURCES.haTomography, FUSION_SOURCES.haCoordinates],
      note: '参考冷冻电镜构象与断层膜轮廓绘制，未下载或插值实验原子坐标。HA1 头部运动和中间态间的连接是教学插值；该路径并非所有包膜病毒共有。',
    },
  },
});

const V = (x = 0, y = 0, z = 0) => new THREE.Vector3(x, y, z);
const TAU = Math.PI * 2;
const clamp = (x, lo = 0, hi = 1) => Math.max(lo, Math.min(hi, Number(x) || 0));
const smooth = x => { const t = clamp(x); return t * t * (3 - 2 * t); };
const span = (p, a, b) => smooth((p - a) / (b - a));
const lerp = THREE.MathUtils.lerp;
const PATCH_RADIUS = 1.48, HALF_BILAYER = .067;

function poreProfile(s, height) {
  // This profile keeps the medial throat's minimum curvature radius above
  // 0.10 scene units across the timeline (> half-thickness 0.067). A flatter
  // tanh neck caused the normal-offset outer leaflet to fold back on itself.
  const shape = .1, denominator = Math.sqrt(shape + (1 - shape) * s * s);
  return { y: height * s / denominator, dy: height * shape / denominator ** 3 };
}

function material(color, extra = {}) {
  return new THREE.MeshPhysicalMaterial({ color, roughness: .42, metalness: 0, clearcoat: .22, clearcoatRoughness: .38, side: THREE.DoubleSide, ...extra });
}

function indexedGrid(nu, nv) {
  const geometry = new THREE.BufferGeometry(), index = [];
  geometry.setAttribute('position', new THREE.BufferAttribute(new Float32Array((nu + 1) * (nv + 1) * 3), 3).setUsage(THREE.DynamicDrawUsage));
  geometry.setAttribute('normal', new THREE.BufferAttribute(new Float32Array((nu + 1) * (nv + 1) * 3), 3).setUsage(THREE.DynamicDrawUsage));
  for (let u = 0; u < nu; u++) for (let v = 0; v < nv; v++) {
    const a = u * (nv + 1) + v, b = a + nv + 1;
    index.push(a, b, a + 1, a + 1, b, b + 1);
  }
  geometry.setIndex(index);
  return geometry;
}

// A radial surface has real polar-head positions and paired inward tails.  The
// section is constructed geometrically, including the boundary strips: it does
// not depend on transparency, depth tricks, screen masks, or a black hole decal.
function makeLeaflet(parent, name, color, detail, geometries, materials) {
  const nu = detail ? 28 : 18, nv = detail ? 64 : 40;
  const geometry = indexedGrid(nu, nv), faceMaterial = material(color, { roughness: .55 });
  const face = new THREE.Mesh(geometry, faceMaterial); face.name = name + 'ContinuousSurface';
  face.frustumCulled = false; parent.add(face); geometries.add(geometry); materials.add(faceMaterial);
  const rows = detail ? 13 : 9, sites = [];
  for (let row = 0; row < rows; row++) {
    const u = (row + .55) / rows, n = Math.round(11 + u * (detail ? 42 : 28));
    for (let col = 0; col < n; col++) sites.push({ u: clamp(u + .009 * Math.sin(col * 3.1 + row * 1.7), .01, .99), a: (col + .5 + .18 * Math.sin(row * 2.4 + col)) / n, seed: col + row * 71 });
    // Representative molecules at both cut edges make the paired tails readable
    // against the hydrophobic cross-section; these are not additional leaflets.
    sites.push({ u, a: 0, edge: -1, seed: row * 71 + 67 }, { u, a: 1, edge: 1, seed: row * 71 + 68 });
  }
  const headGeometry = new THREE.SphereGeometry(.027, 12, 8), tailGeometry = new THREE.CylinderGeometry(.0075, .006, 1, 5, 1);
  const headMaterial = material(color), tailMaterial = material(color, { color: new THREE.Color(color).multiplyScalar(.60), roughness: .68 });
  const heads = new THREE.InstancedMesh(headGeometry, headMaterial, sites.length);
  const tails = new THREE.InstancedMesh(tailGeometry, tailMaterial, sites.length * 2);
  heads.name = name + 'PolarHeads'; tails.name = name + 'PairedAcylTails';
  for (const m of [heads, tails]) { m.instanceMatrix.setUsage(THREE.DynamicDrawUsage); m.frustumCulled = false; parent.add(m); }
  geometries.add(headGeometry); geometries.add(tailGeometry); materials.add(headMaterial); materials.add(tailMaterial);
  const object = new THREE.Object3D(), axis = V(0, 1, 0), position = V(), normal = V(), tangent = V(), end = V(), delta = V();
  function update(evaluate, section, time, tailLength = HALF_BILAYER * .87) {
    const cut = section * Math.PI * .86, start = Math.PI / 2 + cut / 2, sweep = TAU - cut;
    const pa = geometry.attributes.position, na = geometry.attributes.normal;
    for (let u = 0; u <= nu; u++) {
      const point = evaluate(u / nu);
      for (let v = 0; v <= nv; v++) {
        const theta = start + sweep * v / nv, c = Math.cos(theta), s = Math.sin(theta), i = u * (nv + 1) + v;
        pa.setXYZ(i, point.r * c, point.y, point.r * s);
        na.setXYZ(i, point.nr * c, point.ny, point.nr * s);
      }
    }
    pa.needsUpdate = true; na.needsUpdate = true;
    for (let i = 0; i < sites.length; i++) {
      const site = sites[i], p = evaluate(site.u), edgeOffset = site.edge && section > .001 ? site.edge * .009 : 0;
      const theta = start + sweep * site.a + (site.edge ? edgeOffset : .004 * Math.sin(time * .7 + site.seed)), c = Math.cos(theta), s = Math.sin(theta);
      normal.set(p.nr * c, p.ny, p.nr * s).normalize(); tangent.set(-s, 0, c);
      position.set(p.r * c, p.y, p.r * s).addScaledVector(normal, .009);
      object.position.copy(position); object.quaternion.setFromUnitVectors(axis, normal); object.scale.set(1, .76, 1); object.updateMatrix(); heads.setMatrixAt(i, object.matrix);
      for (let tail = 0; tail < 2; tail++) {
        const offset = (tail ? 1 : -1) * .010;
        end.copy(position).addScaledVector(tangent, offset).addScaledVector(normal, -tailLength);
        end.addScaledVector(tangent, (tail ? -.007 : .007) * Math.sin(site.seed * 1.7));
        delta.copy(end).sub(position).addScaledVector(tangent, -offset);
        object.position.copy(position).addScaledVector(tangent, offset).addScaledVector(delta, .5);
        object.quaternion.setFromUnitVectors(axis, delta.clone().normalize()); object.scale.set(1, delta.length(), 1); object.updateMatrix(); tails.setMatrixAt(i * 2 + tail, object.matrix);
      }
    }
    heads.instanceMatrix.needsUpdate = true; tails.instanceMatrix.needsUpdate = true;
  }
  return { face, heads, tails, update, sites: sites.length };
}

function meridian(evalPosition, u, outward = 1) {
  const p = evalPosition(u), a = evalPosition(Math.max(0, u - .0005)), b = evalPosition(Math.min(1, u + .0005));
  const dr = b.r - a.r, dy = b.y - a.y, length = Math.hypot(dr, dy) || 1;
  return { ...p, nr: -dy / length * outward, ny: dr / length * outward };
}

function makeCap(parent, name, color, geometries, materials, segments = 28) {
  const geometry = indexedGrid(segments, 1), capMaterial = material(color, { roughness: .65 });
  const mesh = new THREE.Mesh(geometry, capMaterial); mesh.name = name; mesh.frustumCulled = false; parent.add(mesh);
  geometries.add(geometry); materials.add(capMaterial);
  return {
    mesh,
    update(a, b, theta, radial = false, section = 0) {
      mesh.visible = radial || section > .001;
      const p = geometry.attributes.position;
      for (let i = 0; i <= segments; i++) {
        const u = i / segments, angle = radial ? Math.PI / 2 + section * Math.PI * .43 + (TAU - section * Math.PI * .86) * u : theta;
        for (let j = 0; j < 2; j++) {
          const v = (j ? b : a)(radial ? 1 : u);
          p.setXYZ(i * 2 + j, v.r * Math.cos(angle), v.y, v.r * Math.sin(angle));
        }
      }
      p.needsUpdate = true; geometry.computeVertexNormals();
    },
  };
}

function makeDynamicTube(parent, name, color, radius, geometries, materials, segments = 44) {
  const sides = 7, geometry = indexedGrid(segments, sides), mat = material(color, { roughness: .38 });
  const mesh = new THREE.Mesh(geometry, mat); mesh.name = name; mesh.frustumCulled = false; parent.add(mesh);
  geometries.add(geometry); materials.add(mat);
  const tangent = V(), n = V(), b = V(), reference = V(0, 0, 1);
  return {
    mesh,
    update(fn) {
      const pa = geometry.attributes.position, na = geometry.attributes.normal;
      for (let i = 0; i <= segments; i++) {
        const u = i / segments, p = fn(u);
        tangent.copy(fn(Math.min(1, u + .001))).sub(fn(Math.max(0, u - .001))).normalize();
        if (tangent.lengthSq() < .5) tangent.set(0, 1, 0);
        reference.set(Math.abs(tangent.z) > .9 ? 1 : 0, 0, Math.abs(tangent.z) > .9 ? 0 : 1);
        n.crossVectors(tangent, reference).normalize(); b.crossVectors(tangent, n).normalize();
        for (let j = 0; j <= sides; j++) {
          const angle = TAU * j / sides, nx = n.x * Math.cos(angle) + b.x * Math.sin(angle), ny = n.y * Math.cos(angle) + b.y * Math.sin(angle), nz = n.z * Math.cos(angle) + b.z * Math.sin(angle), k = i * (sides + 1) + j;
          pa.setXYZ(k, p.x + radius * nx, p.y + radius * ny, p.z + radius * nz); na.setXYZ(k, nx, ny, nz);
        }
      }
      pa.needsUpdate = true; na.needsUpdate = true;
    },
  };
}

export function createFusionLab({ caseId = 'snare-fusion', detail = true } = {}) {
  if (!FUSION_IDS.includes(caseId)) throw new Error('Unknown membrane-fusion case: ' + caseId);
  const catalog = FUSION_CATALOG[caseId], isHA = caseId === 'ha-fusion';
  const group = new THREE.Group(); group.name = isHA ? 'InfluenzaHAFusionLab' : 'EndolysosomalSNAREFusionLab';
  const geometries = new Set(), materials = new Set(), patches = new THREE.Group(), pore = new THREE.Group(), proteins = new THREE.Group();
  patches.name = 'SeparateOrHemifusedBilayers'; pore.name = 'ConnectedBilayerWithActualAqueousPore'; proteins.name = isHA ? 'HAAnchorsAndFusionPeptides' : 'TransmembraneSNAREAssembly';
  group.add(patches, pore, proteins);
  const leaves = [
    makeLeaflet(patches, 'UpperDistalLeaflet', '#e3aa6a', detail, geometries, materials),
    makeLeaflet(patches, 'UpperProximalLeaflet', '#ecc591', detail, geometries, materials),
    makeLeaflet(patches, 'LowerDistalLeaflet', '#5f9cb5', detail, geometries, materials),
    makeLeaflet(patches, 'LowerProximalLeaflet', '#8bc1ce', detail, geometries, materials),
  ];
  const fused = [makeLeaflet(pore, 'FusionPoreLumenFacingLeaflet', '#d9b88a', detail, geometries, materials), makeLeaflet(pore, 'FusionPoreOuterLeaflet', '#8ebbc0', detail, geometries, materials)];
  const cutCaps = [], outerCaps = [];
  for (let i = 0; i < 2; i++) {
    cutCaps.push([0, 1].map(j => makeCap(patches, `Membrane${i}SectionEdge${j}`, i ? '#698e99' : '#ab8055', geometries, materials)));
    outerCaps.push(makeCap(patches, `Membrane${i}PatchBoundary`, i ? '#698e99' : '#ab8055', geometries, materials, 64));
  }
  const poreCaps = [0, 1].map(i => makeCap(pore, 'FusedMembraneSectionEdge' + i, '#a49879', geometries, materials, 56));
  const poreEnds = [0, 1].map(i => makeCap(pore, 'FusedPatchOuterBoundary' + i, i ? '#698e99' : '#ab8055', geometries, materials, 64));
  const colors = isHA ? ['#ba85c6', '#cf91ad', '#8c9cce'] : ['#a57bc1', '#58a9b2', '#d9966f', '#e4bc5c'];
  const complexes = [];
  const sphereGeometry = new THREE.SphereGeometry(1, 14, 10), anchorGeometry = new THREE.CylinderGeometry(.026, .026, .19, 9);
  geometries.add(sphereGeometry); geometries.add(anchorGeometry);
  for (let c = 0; c < 3; c++) {
    const angle = Math.PI * (.94 + c * .56), complex = { angle, chains: [], anchors: [], tips: [], heads: [] };
    for (let i = 0; i < colors.length; i++) {
      const role = isHA ? 'HA2Chain' + (i + 1) : ['STX7_Qa', 'VTI1B_Qb', 'STX8_Qc', 'VAMP7_R'][i];
      complex.chains.push(makeDynamicTube(proteins, `${role}_Assembly${c + 1}`, colors[i], isHA ? .022 : .019, geometries, materials));
      const mat = material(colors[i]); materials.add(mat);
      const anchor = new THREE.Mesh(anchorGeometry, mat); anchor.name = role + '_TransmembraneAnchor' + c; proteins.add(anchor); complex.anchors.push(anchor);
      if (isHA) {
        const tipMat = material('#f4cc5e'); materials.add(tipMat);
        const tip = new THREE.Mesh(sphereGeometry, tipMat); tip.scale.set(.034, .016, .072); tip.name = `HA2FusionPeptide_${c}_${i}`; proteins.add(tip); complex.tips.push(tip);
        const head = new THREE.Mesh(sphereGeometry, mat); head.scale.set(.075, .092, .068); head.name = `HA1Head_${c}_${i}`; proteins.add(head); complex.heads.push(head);
      }
    }
    complexes.push(complex);
  }
  const tracerMaterial = material('#f0cf79', { emissive: '#72510e', emissiveIntensity: .09 }); materials.add(tracerMaterial);
  const tracers = new THREE.InstancedMesh(sphereGeometry, tracerMaterial, 12); tracers.name = 'AqueousConnectivityTracers_NotVirionGenome'; tracers.frustumCulled = false; group.add(tracers);
  const traceObject = new THREE.Object3D();
  let progress = 0, localTime = 0, section = .78, disposed = false, topology = 'separate', poreRadius = 0, halfHeight = .6, waist = 0, poreHeight = .17;
  const stageIndex = () => { let index = 0; catalog.stages.forEach((s, i) => { if (progress >= s.at) index = i; }); return index; };

  function updateMembranes() {
    const dock = span(progress, .10, .45), hemi = progress >= .43 && progress < .78;
    topology = progress >= .78 ? 'open-pore' : hemi ? progress < .59 ? 'stalk' : 'hemifusion-diaphragm' : 'separate';
    halfHeight = lerp(isHA ? .65 : .57, .25, dock);
    waist = hemi ? lerp(.055, .31, span(progress, .43, .77)) : 0;
    poreRadius = progress >= .78 ? lerp(.045, .48, span(progress, .78, 1)) : 0;
    poreHeight = lerp(.17, .25, span(progress, .78, .93));
    patches.visible = topology !== 'open-pore'; pore.visible = !patches.visible;
    if (patches.visible) {
      const evals = [];
      for (const sign of [1, -1]) {
        const distal = u => {
          const r = PATCH_RADIUS * u;
          const f = hemi ? smooth((r - waist) / .55) : 0;
          return { r, y: sign * (hemi ? HALF_BILAYER + halfHeight * f : halfHeight + HALF_BILAYER) };
        };
        const proximal = u => {
          const r = hemi ? waist + (PATCH_RADIUS - waist) * u : PATCH_RADIUS * u;
          const f = hemi ? smooth((r - waist) / .55) : 0;
          return { r, y: sign * (hemi ? (halfHeight - HALF_BILAYER) * f : halfHeight - HALF_BILAYER) };
        };
        evals.push(u => meridian(distal, u, sign), u => meridian(proximal, u, -sign));
      }
      evals.forEach((e, i) => leaves[i].update(e, section, localTime));
      const start = Math.PI / 2 + section * Math.PI * .43, end = Math.PI / 2 + TAU - section * Math.PI * .43;
      for (let i = 0; i < 2; i++) {
        // Match the same physical radius on each side of the cross-section.
        // The interval inside the waist is the intact hemifusion diaphragm.
        const top = u => evals[i * 2](u), bottom = u => {
          const r = PATCH_RADIUS * u;
          if (hemi && r < waist) return { r, y: 0 };
          return evals[i * 2 + 1](hemi ? (r - waist) / (PATCH_RADIUS - waist) : u);
        };
        cutCaps[i][0].update(top, bottom, start, false, section); cutCaps[i][1].update(top, bottom, end, false, section);
        outerCaps[i].update(top, bottom, 0, true, section);
      }
    } else {
      // The bilayer is one continuous hourglass-shaped surface. Offset leaves
      // enclose hydrophobic material; the central r < poreRadius is aqueous.
      const throat = poreRadius + HALF_BILAYER;
      const medial = u => { const s = u * 2 - 1; return { r: throat + (PATCH_RADIUS - throat) * s * s, y: poreProfile(s, poreHeight).y }; };
      const evaluate = side => u => {
        const p = meridian(medial, u), nr = -p.nr, ny = -p.ny;
        return { r: p.r + side * HALF_BILAYER * nr, y: p.y + side * HALF_BILAYER * ny, nr: side * nr, ny: side * ny };
      };
      const inner = evaluate(-1), outer = evaluate(1);
      fused[0].update(inner, section, localTime); fused[1].update(outer, section, localTime);
      const start = Math.PI / 2 + section * Math.PI * .43, end = Math.PI / 2 + TAU - section * Math.PI * .43;
      poreCaps[0].update(inner, outer, start, false, section); poreCaps[1].update(inner, outer, end, false, section);
      for (let i = 0; i < 2; i++) poreEnds[i].update(() => inner(i), () => outer(i), 0, true, section);
    }
  }

  function updateProteins() {
    const zip = span(progress, .16, .59), extend = span(progress, .16, .37), fold = span(progress, .37, .69), open = topology === 'open-pore';
    const baseRadius = open ? lerp(.60, poreRadius + .47, span(progress, .78, .90)) : lerp(.70, .60, zip);
    // Derive anchors from the membrane currently on screen. Keeping a constant
    // y coordinate while the hemifusion diaphragm bends would detach proteins.
    const membraneSite = (r, sign, angle) => {
      let y, slope;
      if (open) {
        const throat = poreRadius + HALF_BILAYER;
        const s = Math.sqrt(clamp((r - throat) / (PATCH_RADIUS - throat)));
        const profile = poreProfile(s, poreHeight);
        y = sign * profile.y;
        slope = sign * profile.dy / Math.max(.0001, 2 * s * (PATCH_RADIUS - throat));
      } else if (topology !== 'separate') {
        const u = clamp((r - waist) / .55), f = smooth(u);
        y = sign * (HALF_BILAYER * .5 + (halfHeight - HALF_BILAYER * .5) * f);
        slope = sign * (halfHeight - HALF_BILAYER * .5) * 6 * u * (1 - u) / .55;
      } else { y = sign * halfHeight; slope = 0; }
      const n = V(-slope * Math.cos(angle), 1, -slope * Math.sin(angle)).multiplyScalar(sign).normalize();
      return { point: V(r * Math.cos(angle), y, r * Math.sin(angle)), normal: n };
    };
    const fusedSite = (s, angle) => {
      const throat = poreRadius + HALF_BILAYER, r = throat + (PATCH_RADIUS - throat) * s * s;
      const { y, dy } = poreProfile(s, poreHeight), dr = 2 * (PATCH_RADIUS - throat) * s;
      const n = V(-dy * Math.cos(angle), dr, -dy * Math.sin(angle)).normalize();
      return { point: V(r * Math.cos(angle), y, r * Math.sin(angle)), normal: n };
    };
    const axis = V(0, 1, 0);
    for (const complex of complexes) {
      const ca = Math.cos(complex.angle), sa = Math.sin(complex.angle), tangent = V(-sa, 0, ca), radial = V(ca, 0, sa);
      for (let i = 0; i < complex.chains.length; i++) {
        const phase = TAU * i / complex.chains.length, sideways = Math.cos(phase) * .045;
        const fromUpper = isHA || i === 3, sign = fromUpper ? 1 : -1;
        const site = membraneSite(baseRadius, sign, complex.angle), anchor = site.point.clone().addScaledVector(tangent, sideways);
        complex.anchors[i].position.copy(anchor); complex.anchors[i].quaternion.setFromUnitVectors(axis, site.normal);
        if (isHA) {
          let target = membraneSite(baseRadius, -1, complex.angle);
          if (open) {
            // Follow the continuous rim during the final foldback. This is a
            // teaching interpolation: it leaves the fusion peptide in the same
            // continuous membrane and brings FP/TM to the hairpin's same end.
            const throat = poreRadius + HALF_BILAYER;
            const s = Math.sqrt(clamp((baseRadius - throat) / (PATCH_RADIUS - throat)));
            target = fusedSite(lerp(-s, s, span(progress, .85, 1)), complex.angle);
          }
          const insertedTip = target.point.clone().addScaledVector(target.normal, -HALF_BILAYER * .65).addScaledVector(tangent, sideways);
          const buriedTip = anchor.clone().addScaledVector(site.normal, -.23);
          const tip = buriedTip.lerp(insertedTip, extend);
          complex.tips[i].position.copy(tip); complex.tips[i].quaternion.setFromUnitVectors(axis, target.normal);
          complex.tips[i].visible = progress >= .16;
          const a = anchor.clone().addScaledVector(site.normal, -HALF_BILAYER), b = tip.clone();
          complex.chains[i].update(u => {
            const point = a.clone().lerp(b, u);
            const arc = Math.sin(Math.PI * u), turn = phase + u * TAU * 2.8;
            point.addScaledVector(radial, arc * (.035 + fold * .31) + Math.cos(turn) * .023);
            point.addScaledVector(tangent, Math.sin(turn) * .023);
            return point;
          });
          // A genuine threefold arrangement: cos alone made chains 2/3 occupy
          // identical lobe positions and produced coincident colored surfaces.
          const head = a.clone().lerp(b, .45).addScaledVector(tangent, -sideways)
            .addScaledVector(radial, .09 + extend * .13 + fold * .13 + Math.cos(phase) * .095)
            .addScaledVector(tangent, Math.sin(phase) * .095);
          complex.heads[i].position.copy(head); complex.heads[i].rotation.z = (i - 1) * .3;
        } else {
          const nRadius = baseRadius + .27, cPoint = anchor.clone().addScaledVector(site.normal, -HALF_BILAYER);
          const cRadius = Math.hypot(cPoint.x, cPoint.z);
          complex.chains[i].update(u => {
            const branching = smooth((u - zip * .86) / Math.max(.14, 1 - zip * .86));
            const y = cPoint.y * branching;
            const r = lerp(nRadius, cRadius, u), turn = phase + u * TAU * 3.1;
            return V(ca * r, y + Math.sin(turn) * .024 * (1 - u), sa * r).addScaledVector(tangent, Math.cos(turn) * .026 + sideways * u);
          });
        }
      }
    }
  }

  function updateTracers() {
    // Before opening, every tracer remains in the upper lumen. The passage is
    // diagnostic of topology; its speed/particle sizes are not experimental data.
    const opened = span(progress, .80, 1);
    for (let i = 0; i < tracers.count; i++) {
      const a = i * 2.39996, radial = .032 + .021 * (i % 3), phase = clamp(opened * 1.7 - i * .055);
      const initialY = halfHeight + HALF_BILAYER + .11 + .024 * (i % 4);
      traceObject.position.set(Math.cos(a) * radial, lerp(initialY, -.59 - .04 * (i % 3), phase), Math.sin(a) * radial);
      traceObject.quaternion.identity(); traceObject.scale.setScalar(.017 + .003 * (i % 3)); traceObject.updateMatrix(); tracers.setMatrixAt(i, traceObject.matrix);
    }
    tracers.instanceMatrix.needsUpdate = true;
  }

  function render() {
    if (disposed) return;
    updateMembranes(); updateProteins(); updateTracers();
    group.userData.section = section; group.userData.fusionProgress = progress; group.userData.fusionTopology = topology;
  }
  function seek(value) { progress = clamp(value); localTime = progress * catalog.duration; render(); return getState(); }
  function update(_hostTime, dt = 0) {
    if (disposed || progress >= 1 || !(dt > 0) || !Number.isFinite(dt)) return;
    for (let owner = group; owner; owner = owner.parent) if (!owner.visible) return;
    localTime += dt;
    // Hold the final state rather than play an unphysical reverse-fusion jump.
    progress = Math.min(1, progress + dt / catalog.duration); render();
  }
  function setSection(value) { section = clamp(value); render(); }
  function getState() {
    const index = stageIndex();
    return { caseId, progress, duration: catalog.duration, time: localTime, stageIndex: index, stage: catalog.stages[index], stages: catalog.stages, topology, complete: progress >= 1, section, poreRadius, lumenConnected: topology === 'open-pore', coordinateConvention: isHA ? 'upper=viral interior; gap=endosome lumen; lower=cytosol' : 'upper/lower=organelle lumens; gap=cytosol' };
  }
  function getDiagnostics() {
    return { ...getState(), pausedWithoutDt: true, realGeometryPore: true, isolatedLipidsPerLeaflet: leaves[0].sites, representedSNAREComplexes: isHA ? 0 : 3, representedHATrimers: isHA ? 3 : 0, physiologicalStoichiometryClaim: false, bilayerThickness: HALF_BILAYER * 2, atomicCoordinatesUsed: false, measuredTrajectory: false, membraneFadingUsed: false, alphaMaterials: [...materials].filter(m => m.transparent || m.opacity < 1).length };
  }
  function dispose() { if (disposed) return; disposed = true; geometries.forEach(g => g.dispose()); materials.forEach(m => m.dispose()); group.clear(); }
  const anchors = {
    focus: V(0, 0, 0), inside: V(.30, .12, 1.1), insideTarget: V(0, 0, -.08),
    overviewCamera: V(2.65, 1.8, 4.1), overviewTarget: V(0, 0, 0),
    conformationCamera: V(.55, .35, 2.7), conformationTarget: V(0, 0, 0),
    poreCamera: V(.02,2.4,.3), poreTarget: V(0,0,0),
    upperMembrane: V(-1.05, .4, -.15), lowerMembrane: V(-1.05, -.4, -.15), fusionPore: V(),
  };
  const facts = [catalog.guide.function, catalog.guide.location, catalog.guide.partners.join('、'), catalog.guide.note];
  const stats = { realOpenChannel: true, bilayerLeaflets: 4, dynamicTopology: true, teachingOnly: true, sources: catalog.guide.sources };
  group.userData.organelleId = caseId; group.userData.teachingOnly = true;
  group.traverse(o => { if (o.isMesh) { o.userData.organelleId = caseId; o.userData.teachingOnly = true; } });
  render();
  return { group, radius: 1.7, anchors, facts, stats, stages: catalog.stages, metadata: { guide: catalog.guide, stages: catalog.stages }, setSection, seek, update, getState, getDiagnostics, dispose };
}
