import { VIRAL_RESPONSE_SUBSTEPS, responseTeachingState } from './response-lesson-data.js';
// Teaching text follows the existing response actors. It never moves a model,
// creates a trajectory, or assigns a molecular identity to background particles.
const PHASES = [
  { at: 0, title: '摄取与隔离', subtitle: '内吞途径中的包膜颗粒', location: '胞外与内体' },
  { at: .16, title: '内体内处理', subtitle: '颗粒组分逐步分解', location: '内体腔' },
  { at: .32, title: '识别胞质 RNA', subtitle: '独立条件性 RIG-I 支路', location: '胞质与线粒体外膜胞质侧' },
  { at: .49, title: '启动干扰素表达', subtitle: 'IRF3 入核与 IFNB1 转录', location: '核孔与细胞核' },
  { at: .65, title: '加工与分泌', subtitle: '宿主 IFN-β 进入分泌途径', location: '内质网、高尔基体与胞外' },
  { at: .83, title: '建立抗病毒应答', subtitle: 'IFNAR—JAK—STAT—ISG', location: '细胞膜、胞质与细胞核' }
];

const RULES = {
  particle: {
    subtitle: '被摄取不等于成功感染',
    instruction: '看清病毒包膜与宿主内体膜：两张膜把颗粒内部、内体腔和胞质分隔。',
    boundaryNote: '本段用胞外与已内化状态交接；内吞剪切和膜融合未在此演示。',
    labels: [
      { id: 'response-particle', title: '病毒包膜 · 教学剖面', action: '实心膜围住内部组分；前侧移除部分是剖切', name: 'IrregularViralEnvelope', color: '#cb9272' },
      { id: 'response-envelope-protein', title: '通用包膜蛋白示意', action: '表面蛋白未指定为某种病毒的 HA', name: 'GenericEnvelopeProteinHeads', color: '#d7ad81' },
      { id: 'response-endosomal-membrane', title: '宿主内体膜', action: '把已内化颗粒与胞质隔开', name: 'EndosomalSingleMembrane', color: '#77a8b8' },
      { id: 'response-particle-rna', title: '颗粒内 RNA 示意', action: '仍被颗粒包围；没有进入胞质', name: 'RNAInsideTakenParticle', color: '#247c84' }
    ]
  },
  'endosomal-processing': {
    instruction: '观察内体内颗粒被处理。小碎片表示组分分解，不表示新的病毒产生。',
    boundaryNote: '内体不等于溶酶体；本段没有显示病毒 RNA 进入胞质。',
    labels: [
      { id: 'response-endosome', title: '宿主内体限制膜', action: '持续隔开内体腔与胞质；前方是教学剖切', name: 'EndosomalSingleMembrane', color: '#77a8b8' },
      { id: 'response-retained-particle', title: '仍在内体腔中的包膜颗粒', action: '逐步拆分；不与胞质 RNA 支路直接相接', name: 'IrregularViralEnvelope', color: '#cb9272' },
      { id: 'response-fragments', title: '颗粒分解片段', action: '原颗粒组分被处理，不是子代病毒', name: 'InternalViralComponentDecomposition', color: '#a68b70' }
    ]
  },
  'cytosolic-recognition': {
    instruction: '本支路从“可识别 RNA 已在胞质”出发。RIG-I 是选定的感知蛋白示例。',
    boundaryNote: '不是前段内体自动泄漏；其他病毒也可使用不同感知支路。',
    labels: [
      { id: 'response-cytosolic-rna', title: '条件性胞质 RNA', action: '已在胞质，是本支路的输入条件', name: 'RecognizableRNAHairpinSchematic', color: '#247c84' },
      { id: 'response-rigi', title: '宿主 RIG-I', action: '参与识别合适的胞质 RNA', name: 'NonAtomicRIGIProteinDomains', color: '#9278b8' }
    ]
  },
  MAVS: {
    subtitle: '在线粒体外膜上传递信号', location: '线粒体外膜的胞质侧',
    instruction: 'RIG-I 相关信号传向 MAVS。MAVS 位于线粒体外膜胞质侧，并非线粒体内部颗粒。',
    boundaryNote: '发光虚线与脉冲只提示反应顺序，不是真实管道或某种运输分子。',
    labels: [
      { id: 'response-mavs', title: '宿主 MAVS', action: '在线粒体外膜胞质侧衔接信号', name: 'MembraneAnchoredMAVSAdaptorDomains', color: '#d4a472' },
      { id: 'response-rigi-order', title: '反应顺序提示', action: '说明信号先后，不代表运输颗粒', name: 'RIGIToMAVSSignalOrderOnlyOrderPulses', color: '#6d73b0' }
    ]
  },
  'IRF3-transport': {
    subtitle: '宿主调控蛋白经核孔入核', location: '胞质、核孔与核内',
    instruction: '跟随活化 IRF3 经核孔进入细胞核。它是宿主转录调控蛋白，不是病毒 RNA 或 IFN-β。',
    boundaryNote: '中间信号反应有所省略；运动是教学路径，不是实测分子轨迹。',
    labels: [
      { id: 'response-irf3', title: '活化 IRF3', action: '经核孔入核，参与宿主基因调控', name: 'ActivatedIRF3TeachingDimer', color: '#e0b27e' },
      { id: 'response-irf3-order', title: '下游反应顺序', action: '脉冲提示顺序，不是物质运输', name: 'MAVSDownstreamToNuclearResponseSignalOrderOnlyOrderPulses', color: '#ae752f' }
    ]
  },
  'nuclear-transcription': {
    subtitle: '产生宿主 IFNB1 转录本', location: '细胞核内',
    instruction: 'IRF3 与其他因子共同参与 IFNB1 表达。新生 RNA 是宿主转录本，随后可用于合成 IFN-β。',
    boundaryNote: '核内图形是局部教学投影，不是真实基因坐标；IRF3 不是唯一必需因子。',
    labels: [
      { id: 'response-ifnb1-dna', title: '宿主 DNA 片段', action: '表达 IFNB1 基因所在核内环境', name: 'NuclearDNAExcerptNotGeneCoordinates', color: '#4a70a4' },
      { id: 'response-ifnb1-rna', title: '新生 IFNB1 RNA', action: '宿主转录产物，不是病毒 RNA', name: 'IFNB1NascentTranscriptTeachingProjection', color: '#247c84' },
      { id: 'response-host-mrna', title: '宿主 IFNB1 mRNA', action: '输出后供翻译使用', name: 'HostIFNB1MessengerRNAExportTeachingPath', color: '#a96c37' }
    ]
  },
  'secretory-carrier': {
    instruction: '载体中的小颗粒代表宿主 IFN-β。先看内质网输出状态，再看高尔基体输出状态。',
    boundaryNote: '这里是分段状态；载体出芽、室间膜融合及胞吐的中间态未模拟。',
    labels: [
      { id: 'response-carrier', title: '分泌运输载体', action: '膜内携带宿主信号蛋白 IFN-β', name: 'SecretoryVesicleSingleMembrane', color: '#bf98b4' },
      { id: 'response-ifn-cargo', title: '载体内 IFN-β', action: '宿主蛋白，既不是病毒也不是抗体', name: 'IFNBetaSecretoryCargoDomains', color: '#277f83' }
    ]
  },
  'released-IFN': {
    subtitle: '宿主信号蛋白已在胞外', location: '细胞外',
    instruction: '胞外小颗粒代表已释放的 IFN-β。它们是宿主信号蛋白，可作用于细胞表面受体。',
    boundaryNote: '仅展示已释放状态；没有把 IFN-β 画成病毒、抗体或膜融合蛋白。',
    labels: [
      { id: 'response-released-ifn', title: '胞外 IFN-β', action: '传递信号，不是病毒颗粒', name: 'ExtracellularReleasedIFNBeta', color: '#277f83' }
    ]
  },
  'approaching-IFN': {
    subtitle: 'IFN-β 接近细胞表面受体', location: '细胞膜的胞外侧',
    instruction: '跟随一个宿主 IFN-β 接近 IFNAR。配体在胞外结合，随后触发胞质侧信号。',
    boundaryNote: '这是宿主细胞间信号机制，不是病毒与细胞膜融合。',
    labels: [
      { id: 'response-approaching-ifn', title: '宿主 IFN-β', action: '从胞外接近 IFNAR2', name: 'SelectedIFNBetaBindingIFNAR2', color: '#277f83' },
      { id: 'response-waiting-ifnar', title: '膜上 IFNAR2', action: '胞外区域参与配体结合', name: 'IFNAR2ExtracellularAndCytoplasmicDomains', color: '#7f9eb7' }
    ]
  },
  'IFNAR-extracellular-assembly': {
    subtitle: '胞外配体促进受体复合体组装', location: '细胞膜的胞外侧',
    instruction: 'IFN-β 与 IFNAR 结合，促进 IFNAR1/2 组成信号复合体。受体保持嵌在细胞膜中。',
    boundaryNote: '横向靠拢为有限范围教学示意；不是原子结构或真实结合速度。',
    labels: [
      { id: 'response-bound-ifn', title: '受体结合的 IFN-β', action: '胞外配体促进受体组装', name: 'SelectedIFNBetaBindingIFNAR2', color: '#277f83' },
      { id: 'response-ifnar1', title: 'IFNAR1 亚基', action: '与 IFNAR2 共同形成信号复合体', name: 'IFNAR1ExtracellularAndCytoplasmicDomains', color: '#a78bbf' },
      { id: 'response-ifnar2', title: 'IFNAR2 亚基', action: '参与 IFN-β 结合与信号启动', name: 'IFNAR2ExtracellularAndCytoplasmicDomains', color: '#7f9eb7' }
    ]
  },
  'IFNAR-cytosolic-JAK': {
    subtitle: '从胞质侧看受体相关激酶', location: '细胞膜的胞质侧',
    instruction: '转到胞质侧，观察受体相关 JAK1/TYK2 的活化标记。胞外结合被转换成胞内信号。',
    boundaryNote: '颜色变化表示活化状态；脉冲只表示信号顺序，不是进入细胞的病毒。',
    labels: [
      { id: 'response-jak', title: 'JAK1 / TYK2 示意', action: '在胞质侧参与受体下游信号', name: 'JAK1TYK2CytosolicSideSchematic', color: '#bc6c46' },
      { id: 'response-jak-order', title: 'JAK–STAT 反应顺序', action: '提示后续信号，不是分子轨迹', name: 'JAKSTATToISGSignalOrderOnlyOrderPulses', color: '#277e8b' }
    ]
  },
  'STAT-transport': {
    subtitle: '宿主调控复合体经核孔入核', location: '胞质、核孔与核内',
    instruction: '跟随 STAT1/STAT2–IRF9 示意复合体入核，了解信号如何接到宿主抗病毒基因表达。',
    boundaryNote: '复合体形状和路径是教学表达；不是囊泡、病毒或实测逐分子运动。',
    labels: [
      { id: 'response-stat', title: 'STAT1/STAT2–IRF9', action: '宿主调控复合体参与 ISG 表达', name: 'STAT1STAT2IRF9SelectedComplex', color: '#267e8d' },
      { id: 'response-stat-order', title: '反应顺序提示', action: '不是通道或真实运输颗粒', name: 'JAKSTATToISGSignalOrderOnlyOrderPulses', color: '#277e8b' }
    ]
  },
  'induced-products': {
    subtitle: '一个代表符号，解释一类宿主产物', location: '胞质中的局部教学窗口',
    instruction: '放大一个实际产物符号，代表宿主多种 ISG 产物。其余产物暂略，避免遮挡；它不是子代病毒。',
    boundaryNote: '符号不指定某一种蛋白或真实分子形状；出现 ISG 不等于保证清除所有病毒。',
    labels: [
      { id: 'response-isg-products', title: 'ISG 产物 · 代表符号', action: '代表宿主应答产物，不是子代病毒', name: 'InducedISGAntiviralGeneProductsSchematic', color: '#348b90', representative: true }
    ]
  }
};

const finiteVector = point => point && [point.x, point.y, point.z].every(Number.isFinite);
const definition=(id,title,action,name,color)=>({id:'response-'+id,title,action,name,color});
Object.assign(RULES,{
  'TBK1-activation':{labels:[
    definition('tbk1','下游激酶 TBK1 · 示意','下游网络中的 IRF3 激酶节点；不是 MAVS 直接结合实景','TBK1DownstreamKinaseTeachingDomains','#8a9b73'),
    definition('irf3-substrate','宿主 IRF3 底物','状态改变后可参与核内 IFNB1 调控','IRF3SubstrateAtDownstreamKinaseExcerpt','#e0b27e'),
    definition('irf3-phosphate','磷酸化状态标记','附着小点表示状态变化，不是自由运输货物','IRF3PhosphorylationStateMarkers_NotFreeCargo','#df9345')
  ]},
  'mRNA-to-ER':{labels:[definition('host-mrna','宿主 IFNB1 mRNA','输出后留在胞质侧，供内质网相关翻译使用','HostIFNB1MessengerRNAExportTeachingPath','#a96c37')]},
  'ER-translation':{labels:[
    definition('er-ribosome','宿主核糖体','在 ER 的胞质侧读取宿主 mRNA','ERRibosomeTranslatingHostIFNB1','#937a9e'),
    definition('er-channel','膜上的转位通道','ER 膜中的真实几何孔供新生肽链通过','TransloconHelix0','#b6a46c'),
    definition('er-chain','新生 IFN-β 肽链','通过转位通道进入内质网腔','NascentIFNBetaChainThroughTranslocon','#277f83'),
    definition('er-ifn','ER 腔内 IFN-β','宿主分泌蛋白，后续进入分泌途径','FoldedIFNBetaInsideERLumen','#277f83')
  ]},
  'Golgi-processing':{labels:[
    definition('golgi-cis','顺面腔内货物','青色符号表示宿主 IFN-β 的顺序状态','CisGolgiLumenSectionIFNBetaLumenCargo','#277f83'),
    definition('golgi-membrane','高尔基膜与腔隙','膜片之间为腔内空间；前侧已剖切','MedialGolgiLumenSectionLowerMembrane','#b78f88'),
    definition('golgi-trans','反面腔内货物','处理、分选后进入后高尔基分泌载体','TransGolgiLumenSectionIFNBetaLumenCargo','#277f83')
  ]},
  exocytosis:{labels:[
    definition('exocytosis-membrane','连续的 omega 形宿主膜','载体膜与细胞表面构成开放胞吐孔状态','ContinuousHostOmegaMembraneWithOpenExocytosisPore','#92ada7'),
    definition('exocytosis-pore','开放胞吐孔','载体腔现在可与胞外连通','OpenExocytosisPoreBilayerRim','#b8c7b1'),
    definition('exocytosis-cargo','正在释放的宿主 IFN-β','沿开放孔离开载体腔，不穿过完整膜面','IFNBetaCargoPassingThroughOpenExocytosisPore','#277f83')
  ]},
  'ISG-transcription':{labels:[
    definition('isg-dna','宿主调控 DNA · ISRE 示意','核内表达调控位置的局部教学图','ISGHostDNAWithISRETeachingExcerpt','#4a70a4'),
    definition('irf9','核内 IRF9 示意','与 STAT1/STAT2 一起参与 ISG 调控','NuclearIRF9ForISGTranscriptionTeachingDomain','#9278b8'),
    definition('isg-rna','新生宿主 ISG RNA','后续翻译可产生多种宿主防御产物','HostISGTranscriptionNascentRNA','#247c84')
  ]}
});
RULES['cytosolic-recognition'].labels.push(definition('rigi-card','露出的 CARD 信号区','构象状态改变，具备启动下游信号的条件','RIGICARDExposureTeachingDomains','#b79ac8'));
RULES.particle.labels.push(definition('uptake-membrane','宿主膜 · 局部定位图','当前膜事件以状态交接省略；不显示颗粒穿过完整膜','HostMembraneAtUptakeStateHandoff','#8fa8a4'));
RULES.MAVS.labels=[definition('mavs-anchor','MAVS 膜锚定区','在线粒体外膜胞质侧保持定位','MAVSTransmembraneAnchorSchematic','#d4a472'),definition('mavs-assembly','MAVS 信号组装示意','局部蛋白域组装可放大信号；不是运输颗粒','MAVSCARDSignalingAssemblySchematic','#d4a472')];
RULES['nuclear-transcription'].labels[2]=definition('polymerase','转录机器 · RNA Pol II 示意','读取宿主 DNA 模板，合成宿主 RNA','HostRNApolymeraseIITranscriptionTeachingSymbol','#718f91');
RULES['IFNAR-cytosolic-JAK'].labels=[
  definition('jak','JAK1 / TYK2 示意','受体相关胞质侧激酶参与下游活化','JAK1TYK2CytosolicSideSchematic','#bc6c46'),
  definition('stat-substrate','STAT1 / STAT2 示意','胞质侧宿主信号蛋白改变活化状态','STAT1STAT2ReceptorSideSubstrateTeachingDomains','#398c95'),
  definition('stat-phosphate','磷酸化状态标记','附着小点说明状态变化，不是自由颗粒','STATPhosphorylationStateMarkers_NotFreeCargo','#df9345')
];
RULES['STAT-transport'].labels=[definition('stat','STAT1 / STAT2 入核示意','经核孔入核，与 IRF9 参与后续核内调控','STAT1STAT2IRF9SelectedComplex','#267e8d')];
RULES['endosomal-processing'].labels[0].action='不透明膜边界围住内体腔；开口是教学剖切';

function visible(object) {
  if (!object) return false;
  for (let node = object; node; node = node.parent) if (!node.visible) return false;
  const materials = Array.isArray(object.material) ? object.material : [object.material];
  return materials.some(material => material && material.visible !== false && (material.opacity ?? 1) > .025);
}

function actorCenter(THREE, object, instanceIndex = 0) {
  object.updateWorldMatrix(true, false);
  const point = new THREE.Vector3();
  if(Array.isArray(object.userData.classroomAnchorLocal))point.fromArray(object.userData.classroomAnchorLocal);
  else if (object.geometry) {
    if (!object.geometry.boundingBox) object.geometry.computeBoundingBox();
    if (object.geometry.boundingBox && !object.geometry.boundingBox.isEmpty()) object.geometry.boundingBox.getCenter(point);
  }
  if (object.isInstancedMesh) {
    if (!(object.count > 0)) return null;
    const index = Math.max(0, Math.min(object.count - 1, Math.trunc(instanceIndex)));
    const matrix = new THREE.Matrix4();
    object.getMatrixAt(index, matrix);
    point.applyMatrix4(matrix);
  }
  point.applyMatrix4(object.matrixWorld);
  return finiteVector(point) ? point : null;
}

export function getResponseLesson({ THREE, state, viral, reactionFocus, stages }) {
  const teaching=viral.getTeachingState?.()??responseTeachingState(state.progress);
  const progress = Number.isFinite(state.progress) ? Math.min(1, Math.max(0, state.progress)) : 0;
  const focus = reactionFocus?.diagnostics?.() ?? {};
  const aliases = { 'IFNAR-extracellular': 'IFNAR-extracellular-assembly', 'IFNAR-cytosolic': 'IFNAR-cytosolic-JAK' };
  const focusKey = aliases[focus.key] ?? focus.key;
  const key = RULES[focusKey] ? focusKey : teaching.key;
  const rule = RULES[key];
  const step=VIRAL_RESPONSE_SUBSTEPS.find(item=>item.key===key)??teaching;
  const phaseStages = PHASES.map((phase, index) => ({ ...phase, at: Number.isFinite(stages?.[index]?.at) ? stages[index].at : phase.at }));
  let index = 0;
  for (let i = 1; i < phaseStages.length; i++) if (progress >= phaseStages[i].at) index = i;
  viral.group.updateWorldMatrix(true, true);
  const bindings = viral.getVisibilityBindings().filter(binding => visible(binding.object));
  const labels = [];
  for (const definition of rule.labels) {
    if(labels.length>=4)break;
    const binding = bindings.find(row => row.object.name === definition.name);
    if (!binding) continue;
    let position;
    if (definition.representative && focusKey === key && finiteVector(reactionFocus?.focusPoint?.())) {
      position = reactionFocus.focusPoint().clone();
    } else {
      const instance = definition.representative && Number.isInteger(focus.representativeInstance) ? focus.representativeInstance : 0;
      position = actorCenter(THREE, binding.object, instance);
    }
    if (!finiteVector(position)) continue;
    labels.push({ id: definition.id, title: definition.title, action: definition.action, position, color: definition.color });
  }
  return {
    key: 'response', index, total: phaseStages.length, title: step.title,
    subtitle: step.input+' → '+step.result, location:step.location,
    instruction:'输入：'+step.input+'。'+step.action+'；结果：'+step.result+'。',boundaryNote:step.condition,labels,stages:phaseStages,
    substepKey:key,substepIndex:teaching.index,substepTotal:teaching.total,substeps:VIRAL_RESPONSE_SUBSTEPS,
    input:step.input,action:step.action,result:step.result,condition:step.condition
  };
}
