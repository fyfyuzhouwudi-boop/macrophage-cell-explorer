import * as THREE from 'three';

// The inspection retains the selected compartment in its original local frame.
function selectedGeometry(source, joined) {
  if (joined) return source.clone();
  const indices = [];
  for (const region of source.groups) if (region.materialIndex === 0)
    for (let i = region.start; i < region.start + region.count; i++) indices.push(source.index.getX(i));
  // Unused donor vertices must not enlarge the bounds before fusion.
  const unique = [...new Set(indices)], remap = new Map(unique.map((v, i) => [v, i])), geometry = new THREE.BufferGeometry();
  for (const [name, attribute] of Object.entries(source.attributes)) {
    const values = new attribute.array.constructor(unique.length * attribute.itemSize);
    unique.forEach((old, i) => values.set(attribute.array.subarray(old * attribute.itemSize, (old + 1) * attribute.itemSize), i * attribute.itemSize));
    geometry.setAttribute(name, new THREE.BufferAttribute(values, attribute.itemSize, attribute.normalized));
  }
  geometry.setIndex(indices.map(i => remap.get(i))); geometry.addGroup(0, indices.length, 0);
  geometry.computeBoundingBox(); geometry.computeBoundingSphere(); return geometry;
}
const phaseNames = {
  engulfment_open_cup: '吞噬杯尚未闭合', closed_phagosome_transport: '闭合吞噬体运输中',
  lysosome_docking: '吞噬体与溶酶体对接中', closed_fusion_compartment: '融合后形成共同区室',
  enzymatic_digestion: '吞噬溶酶体正在消化货物'
};

export function createPhagosomeInspection({ phago, fusionWall, cup, dockingContents, enzymeInstances, membraneMaterials, shellPlane, journey, cloneMaterial }) {
  phago.updateWorldMatrix(true, true); dockingContents.updateWorldMatrix(true, true);
  const frozen = structuredClone(journey), joined = Boolean(fusionWall.userData.fusion.joined), open = !frozen.membraneClosed;
  const sourceWorldMatrix = phago.matrixWorld.clone(), inverseSource = sourceWorldMatrix.clone().invert();
  const group = new THREE.Group(), materials = new Map(), geometries = new Set(), instances = new Set(), wallMaterials = new Set();
  group.name = 'Atlas_phagosome_selected_snapshot';
  group.userData = { organelleId: 'phagosome', teachingOnly: true, detail: true, sameWholeInstanceSnapshot: true };
  function materialCopy(source) {
    if (!materials.has(source)) {
      const copy = cloneMaterial ? cloneMaterial(source) : source.clone();
      if (!cloneMaterial) { copy.onBeforeCompile = source.onBeforeCompile; copy.customProgramCacheKey = source.customProgramCacheKey; }
      copy.clippingPlanes = null; materials.set(source, copy);
    }
    return materials.get(source);
  }
  function copyNode(source) {
    const copy = source.clone(false); copy.userData = { ...copy.userData, sourceUUID: source.uuid }; copy.visible = true;
    if (source.geometry) { copy.geometry = source.geometry.clone(); geometries.add(copy.geometry); }
    if (source.material) copy.material = Array.isArray(source.material) ? source.material.map(materialCopy) : materialCopy(source.material);
    if (copy.isInstancedMesh) instances.add(copy);
    for (const child of source.children) copy.add(copyNode(child));
    return copy;
  }
  for (const source of phago.children) {
    if (source.name === 'VesicleMembrane' || source === cup && !open || source === fusionWall && open || source === enzymeInstances && !joined) continue;
    const copy = copyNode(source);
    if (source === fusionWall) {
      geometries.delete(copy.geometry); copy.geometry.dispose();
      copy.geometry = selectedGeometry(source.geometry, joined); geometries.add(copy.geometry);
      copy.material = membraneMaterials.map(materialCopy); copy.material.forEach(m => wallMaterials.add(m));
      copy.userData.compartmentBoundary = true;
    } else if (source === cup) {
      copy.material = materialCopy(membraneMaterials[0]); wallMaterials.add(copy.material); copy.userData.compartmentBoundary = true;
    }
    group.add(copy);
  }
  if (joined) {
    const copy = copyNode(dockingContents); copy.matrixAutoUpdate = false;
    copy.matrix.multiplyMatrices(inverseSource, dockingContents.matrixWorld); group.add(copy);
  }
  group.updateMatrixWorld(true);
  const bounds = new THREE.Box3().setFromObject(group), center = bounds.getCenter(new THREE.Vector3()), size = bounds.getSize(new THREE.Vector3());
  const radius = size.length() * .5;
  const localPlane = shellPlane.clone().applyMatrix4(inverseSource), worldPlane = localPlane.clone(), projections = [];
  for (const x of [bounds.min.x, bounds.max.x]) for (const y of [bounds.min.y, bounds.max.y]) for (const z of [bounds.min.z, bounds.max.z])
    projections.push(-localPlane.normal.dot(new THREE.Vector3(x, y, z)));
  // Preserve even an entrance plane outside the object's bounds (for example
  // after an oblique whole-cell rotation); clamping must not reveal a new face.
  const rangeTop = Math.max(...projections, localPlane.constant) + .05;
  const rangeBottom = Math.min(...projections, localPlane.constant) - .05;
  const initialSection = THREE.MathUtils.clamp((rangeTop - localPlane.constant) / (rangeTop - rangeBottom), 0, 1);
  let section = initialSection, disposed = false;
  function applySection() {
    group.updateWorldMatrix(true, false); worldPlane.copy(localPlane).applyMatrix4(group.matrixWorld);
    for (const material of wallMaterials) {
      const clipped = Boolean(material.clippingPlanes?.length); material.clippingPlanes = section > .002 ? [worldPlane] : null;
      if (clipped !== (section > .002)) material.needsUpdate = true;
    }
  }
  function setSection(amount) {
    section = THREE.MathUtils.clamp(Number(amount) || 0, 0, 1);
    localPlane.constant = THREE.MathUtils.lerp(rangeTop, rangeBottom, section);
    group.userData.section = section; applySection();
  }
  function landmark(object, direction, instance = null) {
    const transform = object.matrixWorld.clone(), im = new THREE.Matrix4(), p = new THREE.Vector3();
    if (instance !== null) { object.getMatrixAt(instance, im); transform.multiply(im); }
    let score = -Infinity, result = new THREE.Vector3();
    for (let i = 0; i < object.geometry.attributes.position.count; i++) {
      p.fromBufferAttribute(object.geometry.attributes.position, i).applyMatrix4(transform);
      if (p.dot(direction) > score) { score = p.dot(direction); result.copy(p); }
    }
    return result;
  }
  const cargo = group.getObjectByName('PhagosomeParticleBody'), fragments = group.getObjectByName('PhagosomeParticulateFragments');
  const wall = group.getObjectByName(open ? cup.name : fusionWall.name);
  const anchors = {
    focus: center.clone(), inside: center.clone().add(new THREE.Vector3(.15, .1, .6)), insideTarget: center.clone(),
    phagosomeCargoContent: landmark(cargo, new THREE.Vector3(.15, .2, 1)),
    phagosomeFragment: landmark(fragments, new THREE.Vector3(.1, -.1, 1), 0),
    phagosomeWall: landmark(wall, new THREE.Vector3(-.6, -.6, -.2))
  };
  const labels = [
    { id: 'engulfed-material', anchor: 'phagosomeCargoContent', title: '被吞入的大颗粒货物', description: '整胞中同一个被摄取物；消化阶段的缩小程度也保持一致。', color: '#9b8167' },
    { id: 'separated-fragment', anchor: 'phagosomeFragment', title: frozen.phase === 'enzymatic_digestion' ? '货物残片' : '随货物显示的碎片', description: '与整胞中的材料位置相同；这些形态示意不用于鉴定酶或具体分子。', color: '#a18b72' },
    { id: 'phagosome-boundary', anchor: 'phagosomeWall', title: open ? '未闭合的吞噬杯膜' : joined ? '融合后的共同限制膜' : '闭合的吞噬体限制膜', description: open ? '膜仍有开口，尚未形成封闭吞噬体。' : joined ? '保留整胞中的融合颈与相连轮廓，腔内组分可在共同区室中交换。' : '将摄入物与胞质分隔；未融合的邻近溶酶体没有被并入。', color: '#9a8b6c' }
  ];
  const title = phaseNames[frozen.phase];
  const metadata = {
    teachingOnly: true,
    sameWholeInstanceSnapshot: { sourceUUID: phago.uuid, sourceWorldMatrix: sourceWorldMatrix.toArray(), progress: frozen.progress, phase: frozen.phase, joined, membraneClosed: frozen.membraneClosed, cargoResidualScale: frozen.cargoResidualScale },
    contentLabels: labels,
    contentLesson: { title, note: '沿用整胞中选中的外壳与内容物，放大时暂停该阶段；剖切仅移除观察侧膜面。' },
    guide: {
      title, function: '显示整胞中选中的同一个吞噬区室，保留当前外形、货物和成熟阶段。',
      location: open ? '细胞表面的摄取位置；此时吞噬杯仍有开口。' : '胞质内的膜性区室；轮廓随摄入物和融合阶段而变化。',
      partners: ['细胞膜', '内体与溶酶体'], features: labels.map(label => ({ name: label.title, function: label.description, visible: true })),
      note: '此处是程序化的摄取与成熟教学案例，并非实验分割模型；吞噬体没有固定核心，也不具有统一的球形或双叶外形。',
      sources: [{ title: 'Levin-Konigsberg et al., Nature Cell Biology 2019', url: 'https://pubmed.ncbi.nlm.nih.gov/31570833/' }]
    }
  };
  const stats = { detail: true, sameSelectedWholeGeometry: true, phase: frozen.phase, joined, meshCount: geometries.size };
  setSection(initialSection);
  return { group, anchors, radius, initialSection, metadata, stats, facts: labels.map(l => l.description), setSection,
    update() { if (!disposed) applySection(); },
    dispose() {
      if (disposed) return; disposed = true;
      instances.forEach(o => o.dispose()); geometries.forEach(g => g.dispose()); materials.forEach(m => m.dispose());
      // Textures remain owned by the source atlas.
      group.clear();
    }
  };
}
