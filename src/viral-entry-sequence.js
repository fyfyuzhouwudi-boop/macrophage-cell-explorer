import * as THREE from 'three';
import { createFusionLab, FUSION_CATALOG } from './fusion-lab.js';
import { createViralEntryCurvature } from './viral-entry-curvature.js';

// A classroom presentation of the existing HA model, not another fusion model.
// It starts AFTER endocytosis. Host-cell uptake, actual vRNP unpacking, and
// productive infection are not inferred from a membrane opening.
const STAGE_ACTIONS = [
  '先辨认上下两层脂双层。HA 留在病毒包膜上，两侧水相尚不连通。',
  '观察 HA2 伸展：黄色融合肽进入下方靶膜，跨膜锚仍留在上方病毒包膜。',
  '观察 HA2 折返，把两层膜拉近；紫、粉、蓝是 HA 三聚体的三条链。',
  '观察融合柄和半融合隔膜。膜已部分相连，但病毒内部和胞质仍未连通。',
  '观察真正开放的水性孔。青绿色示踪球只有此时才可从上方到下方。',
  '观察孔扩大；示踪球展示连通性，不代表病毒 RNA 或成功感染。',
];
const PROTEIN_ACTIONS = [
  'HA1 头部与 HA2 构成三聚体；此处尚未触发低 pH 重排。',
  '低 pH 条件触发 HA 重排，HA2 伸展并暴露融合肽。',
  'HA2 折返，融合肽与病毒膜中的跨膜锚逐渐靠近。',
  'HA 的重排帮助局部膜接近；半融合不等于水相连通。',
  'HA 保持膜连接构象；中央孔由连续脂双层围成。',
  '折返后的蛋白与膜共同留在融合区域；本段不演示蛋白回收。',
];

export const VIRAL_ENTRY_STAGES = Object.freeze(FUSION_CATALOG['ha-fusion'].stages.map((stage, index) => Object.freeze({
  ...stage,
  key: ['bilayers', 'ha-extension', 'ha-foldback', 'hemifusion', 'fusion-pore', 'pore-expansion'][index],
  instruction: STAGE_ACTIONS[index],
})));

export function createViralEntrySequence({ detail = true } = {}) {
  const model = createFusionLab({ caseId: 'ha-fusion', detail });
  const curvature = createViralEntryCurvature(model);
  curvature.apply();
  const group = model.group;
  group.name = 'ClassroomInfluenzaHAEntryCutaway';
  group.userData = {
    ...group.userData, classroomEntryLesson: true,
    startsAfterEndocytosis: true, impliesProductiveInfection: false,
    preservesExistingFusionGeometry: true,
    curvedMembranePeriphery: true,
  };
  const find = name => {
    const object = group.getObjectByName(name);
    if (!object) throw new Error('HA teaching anchor is missing: ' + name);
    return object;
  };
  const objects = {
    upper: find('UpperDistalLeafletContinuousSurface'),
    lower: find('LowerDistalLeafletContinuousSurface'),
    fused: find('FusionPoreLumenFacingLeafletContinuousSurface'),
    head: find('HA1Head_2_1'),
    peptide: find('HA2FusionPeptide_2_1'),
    anchor: find('HA2Chain2_TransmembraneAnchor2'),
    tracers: find('AqueousConnectivityTracers_NotVirionGenome'),
  };
  // Use a distinct color and shape for tracer spheres: the small yellow HA2
  // fusion peptides must not be confused with particles passing through a pore.
  objects.tracers.material.color.set('#189d94');
  objects.tracers.material.emissive.set('#0f4541');
  objects.tracers.material.emissiveIntensity = .04;
  objects.tracers.userData.classroomRole = 'water-connectivity-tracer-not-genome';
  const matrix = new THREE.Matrix4(), tracerPoint = new THREE.Vector3();
  let disposed = false;

  function state() {
    const value = model.getState();
    return {
      ...value, stage: VIRAL_ENTRY_STAGES[value.stageIndex], stages: VIRAL_ENTRY_STAGES,
      lesson: 'influenza-ha-entry', title: '包膜病毒的膜融合',
      subtitle: '具体示例：低 pH 触发的流感病毒 HA',
      generalPrinciple: '融合蛋白在相应触发条件下重排，帮助病毒包膜与宿主膜连接并形成融合孔；受体、触发条件和作用位置因病毒而异。',
      instruction: STAGE_ACTIONS[value.stageIndex],
      location: '内体膜接触区的弧面剖视；中央为 HA 与膜融合过程',
      coordinateConvention: '上方＝病毒内部；双膜间隙＝内体腔；下方＝胞质',
      boundaryNote: '低 pH HA 条件性教学例；不泛化所有病毒。青绿色球为水相连通示踪，不是病毒 RNA。',
    };
  }
  function pointOnLeaflet(mesh, u, angleFraction = .018) {
    // The factory's indexed grids retain their row/column layout while moving.
    const nu = mesh.userData.gridNu, nv = mesh.userData.gridNv;
    const index = Math.round(u * nu) * (nv + 1) + Math.round(angleFraction * nv);
    return mesh.localToWorld(new THREE.Vector3().fromBufferAttribute(mesh.geometry.attributes.position, index));
  }
  const centerOf = object => object.getWorldPosition(new THREE.Vector3());
  function getTeachingLabels() {
    if (disposed) return [];
    group.updateWorldMatrix(true, true);
    const s = state(), opened = s.lumenConnected, step = s.stageIndex;
    const upper = opened ? pointOnLeaflet(objects.fused, .94) : pointOnLeaflet(objects.upper, .79);
    const lower = opened ? pointOnLeaflet(objects.fused, .06) : pointOnLeaflet(objects.lower, .79);
    const labels = [
      { id: 'viral-envelope', title: opened ? '病毒来源膜区' : '病毒包膜', action: opened ? '原病毒膜已与靶膜形成连续脂双层。' : '上方较弯的双层围住病毒内部；HA 跨膜锚留在该膜中。', position: upper, color: '#bd8242', role: 'membrane' },
      { id: 'endosome-membrane', title: opened ? '内体来源膜区' : '内体限制膜', action: opened ? '原内体膜沿孔缘与病毒来源膜连续。颜色只标来源。' : '下方较缓的弧面分隔内体腔与胞质；融合肽插入腔侧膜面。', position: lower, color: '#4a8fa8', role: 'membrane' },
      { id: 'ha-protein', title: step === 0 ? 'HA 三聚体' : step < 3 ? 'HA2 构象变化' : 'HA 蛋白', action: PROTEIN_ACTIONS[step], position: centerOf(objects.head), color: '#9b68ba', role: 'protein' },
    ];
    if (step > 0 && step < 3) labels.push({
      id: 'fusion-peptide', title: '黄色短片：融合肽', action: 'HA2 的一段，插入靶膜；不是游离颗粒。HA 跨膜锚仍连着病毒来源膜。',
      position: centerOf(objects.peptide), color: '#b58d20', role: 'protein-segment',
    });
    if (step === 3 || step >= 4) labels.push({
      id: 'fusion-contact', title: opened ? '水性融合孔' : '封闭的半融合隔膜',
      action: opened ? '真实几何开口连通上方病毒内部与下方胞质。' : '接触区仍有膜隔开两侧；此时示踪球不能穿过。',
      position: group.localToWorld(new THREE.Vector3(0, 0, 0)), color: '#bb7f3e', role: 'topology',
    });
    // Follow an actually rendered instance. No independent label-only trajectory.
    objects.tracers.getMatrixAt(opened ? 0 : 2, matrix);
    tracerPoint.setFromMatrixPosition(matrix);
    labels.push({
      id: 'aqueous-tracer', title: '青绿球：水相示踪',
      action: opened ? '开孔后穿过，证明两侧水相连通；不是病毒 RNA 或 vRNP。' : '暂留上方水相，不能穿过封闭双膜；不是病毒基因组。',
      position: objects.tracers.localToWorld(tracerPoint.clone()), color: '#12867e', role: 'connectivity-tracer',
    });
    return labels.map(label => ({ ...label, coordinateSpace: 'world' }));
  }
  function getCameraPose() {
    group.updateWorldMatrix(true, false);
    // A side/front cutaway keeps both membranes, the intermembrane protein and
    // the pore in view. The user is never forced into a top-down pore view.
    const position = group.localToWorld(new THREE.Vector3(1.85, .82, 4.35));
    const target = group.localToWorld(new THREE.Vector3(0, .01, 0));
    return { position, target, near: .012, far: 110, minDistance: 1.7, maxDistance: 12 };
  }
  function seek(progress) { if (!disposed) { model.seek(progress); curvature.apply(); } return state(); }
  function update(time, dt = 0) { if (!disposed) { model.update(time, dt); curvature.apply(); } }
  function setSection(value) { if (!disposed) { model.setSection(value); curvature.apply(); } }
  function diagnostics() {
    return { ...model.getDiagnostics(), lesson: 'influenza-ha-entry', disposed,
      geometryReusedFrom: 'createFusionLab(ha-fusion)', measuredMacrophageKinetics: false,
      startsAfterEndocytosis: true, tracerIsGenome: false,
      peripheralMembraneCurvature: curvature.diagnostics(),
      teachingLabels: getTeachingLabels().map(({ id, title, action, role, position }) => ({ id, title, action, role, position: position.toArray() })),
    };
  }
  function dispose() { if (disposed) return; disposed = true; model.dispose(); }
  return { group, stages: VIRAL_ENTRY_STAGES, duration: FUSION_CATALOG['ha-fusion'].duration,
    anchors: model.anchors, radius: model.radius,
    seek, update, setSection, getState: state, getTeachingLabels, getCameraPose,
    diagnostics, getDiagnostics: diagnostics, dispose,
  };
}
