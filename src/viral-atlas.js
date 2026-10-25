import * as THREE from "three";
import { organicTube, merged, proteinGeometry, seededRandom, makeReliefTexture } from "./organic-utils.js";
import { createResponseProduction } from "./response-production.js";
import { VIRAL_RESPONSE_SUBSTEPS, responseTeachingState } from "./response-lesson-data.js";
import { responseOpenMembrane, responseCurvedMembranePatch, nearestGeometryAnchor } from "./response-uptake-context.js";
const TAU = Math.PI * 2, clamp = THREE.MathUtils.clamp;
const smooth = (a, b, p) => THREE.MathUtils.smoothstep(p, a, b);
const window = (p, a, b, c, d) => smooth(a, b, p) * (1 - smooth(c, d, p));
const VIRAL_STAGES = [
  { title: "胞外接近与已内化状态", at: 0, desc: "分段展示通用包膜 RNA 颗粒在胞外与已内化后的状态；中间膜内陷与断颈过程省略，不显示颗粒穿过完整膜。摄取不等于有效感染。" },
  { title: "内体运输与组分分解", at: 0.16, desc: "颗粒在内体系统中运输与组分分解。内体不被直接改称溶酶体；本段不展示 RNA 向胞质漏出。" },
  { title: "胞质 RNA 感知支路（选择性示意）", at: 0.32, desc: "切换独立条件支路：需可识别 RNA 已在胞质。RIG-I 是选定传感器示例，不代表每种 RNA 病毒或唯一识别通路。" },
  { title: "IRF3 入核与 IFNB1 转录", at: 0.49, desc: "省略部分中间反应，示意 MAVS 下游激活 IRF3 并促其入核。IFNB1 转录还需其他协同因子；核内图形为局部教学投影，非基因实测坐标。" },
  { title: "IFN-β 的合成、加工与分泌", at: 0.65, desc: "宿主 mRNA 输出后，依次看 ER 翻译/转位、高尔基腔内处理、分泌载体及开放胞吐孔。局部剖面调整了比例；区室间载体出芽与融合并非实测重建轨迹。" },
  { title: "IFNAR 与抗病毒基因应答", at: 0.83, desc: "胞外 IFN-β 接合 IFNAR2，示意IFNAR1/2在膜上有限靠拢、胞质侧JAK激活及后续STAT入核/ISG；不表示所有病毒均被清除。" }
];
const SOURCES = [
  { title: "Wilmes et al. (2015), J Cell Biol — ligand-induced type-I IFN receptor assembly", url: "https://pmc.ncbi.nlm.nih.gov/articles/PMC4442803/", doi: "10.1083/jcb.201412049", scope: "配体诱导IFNAR1/IFNAR2组装的单分子研究；本作只取有限教学状态，不移用IFN亚型/细胞模型的实测距离、速率或全部反应。" },
  { title: "P1 Martínez-Colón et al. (2022), Science Translational Medicine — human macrophage infection outcomes", url: "https://pmc.ncbi.nlm.nih.gov/articles/PMC9529056/", doi: "10.1126/scitranslmed.abm9151", scope: "人巨噬细胞中病毒成分/感染指标与产生有感染性子代分开判定；不外推所有病毒结局。" },
  { title: "P2 Xia et al. (2015), Nature Communications — RIG-I/MAVS, IRF3 and Ifnb in BMDM", url: "https://pmc.ncbi.nlm.nih.gov/articles/PMC4569712/", doi: "10.1038/ncomms9132", scope: "原代小鼠BMDM的RIG-I/MAVS支路、IRF3与Ifnb读出，不是本动画三维运输轨迹。" },
  { title: "P3 Zhou, Zhao and Perlman (2010), mBio — autocrine interferon priming in macrophages", url: "https://pmc.ncbi.nlm.nih.gov/articles/PMC2957079/", doi: "10.1128/mBio.00219-10", scope: "小鼠巨噬细胞IFN活性、自分泌IFNAR反馈及ISG相关应答；不证明病毒进入或RIG-I特异性。" },
  { title: "P4 Wood et al. (2013), Virology — IFNAR/STAT1 and ISG responses in primary macrophages", url: "https://pmc.ncbi.nlm.nih.gov/articles/PMC3703304/", doi: "10.1016/j.virol.2013.04.036", scope: "DNA病毒MHV68研究，仅支持共同下游IFNAR/pSTAT1/ISG节点，不能用于RNA病毒进入或RIG-I专属性。" },
  { title: "Seth et al. (2005), Cell — identification and characterization of MAVS", url: "https://pubmed.ncbi.nlm.nih.gov/16125763/", doi: "10.1016/j.cell.2005.08.012", scope: "MAVS的线粒体定位与RIG-I下游NF-kappaB/IRF3机制；不是巨噬细胞三维坐标数据。" },
  { title: "Hou et al. (2011), Cell — functional MAVS assemblies", url: "https://pmc.ncbi.nlm.nih.gov/articles/PMC3179916/", doi: "10.1016/j.cell.2011.06.041", scope: "支持MAVS信号组装与下游活化；本作不移用体外纤维长度、亚基数或动力学。" },
  { title: "Liu et al. (2013), eLife — MAVS recruits E3 ligases and downstream kinase complexes", url: "https://elifesciences.org/articles/00785", doi: "10.7554/eLife.00785", scope: "TRAF/NEMO等衔接至TBK1/IRF3；本作的局部TBK1图不表示MAVS直接结合TBK1或唯一激活场所。" },
  { title: "Panne et al. (2004), EMBO J — cooperative IFNB enhancer regulation", url: "https://pmc.ncbi.nlm.nih.gov/articles/PMC526468/", doi: "10.1038/sj.emboj.7600453", scope: "IFNB增强子上IRF3与ATF2/c-Jun等共同调控；教学图形不是基因实测坐标或原子重建。" },
  { title: "Yang et al. (2021), Cellular & Molecular Immunology — IFNβ secretion and Rab1", url: "https://pmc.ncbi.nlm.nih.gov/articles/PMC8167132/", doi:"10.1038/s41423-021-00659-y",scope: "HEK293T中的IFNβ经ER-Golgi途径；细胞类型和刺激影响分泌机制，不能作为巨噬细胞全部载体身份与动力学证据。" },
  { title: "Voorhees et al. (2014), Cell — mammalian ribosome-Sec61 complex", url:"https://pmc.ncbi.nlm.nih.gov/articles/PMC4081569/",doi:"10.1016/j.cell.2014.05.024",scope:"哺乳动物核糖体与Sec61的冷冻电镜结构支持共翻译转位的空间关系；本作不用其原子坐标，也不声称直接重建IFN特异轨迹。" },
  { title: "Molecular imprinting as a signal activation mechanism of RIG-I (2014)",url:"https://pmc.ncbi.nlm.nih.gov/articles/PMC4142144/",scope:"结构和功能实验支持RIG-I CARD与MAVS CARD组装；本作仅表示区域暴露和信号组装，不移用亚基数或测得结构。" },
  { title: "Heuser et al. (1979), J Cell Biol — quick-freezing captures exocytosis",url:"https://pmc.ncbi.nlm.nih.gov/articles/PMC2110310/",doi:"10.1083/jcb.81.2.275",scope:"神经肌肉接头的冷冻断裂电镜显示胞吐形态，仅支持通用开放胞吐孔教学形态；不是巨噬细胞IFN载体专属融合蛋白或动力学证据。" },
  { title: "Platanitis et al. (2019), Nature Communications — macrophage STAT/IRF9 gene regulation", url: "https://pmc.ncbi.nlm.nih.gov/articles/PMC6606597/", doi: "10.1038/s41467-019-10970-y", scope: "巨噬细胞IFN诱导的STAT1/STAT2/IRF9核内基因调控，并支持在DNA上组装的模型；不把所有ISGF3画成胞质预装复合体。" }
];
function createViralAtlas({ whole } = {}) {
  if (!whole?.group || !(whole.organelleLocations instanceof Map) || typeof whole.surfaceRadius !== "function") throw new Error("createViralAtlas requires an actual whole atlas with organelleLocations and surfaceRadius");
  whole.group.updateMatrixWorld(true);
  const group = new THREE.Group();
  group.name = "ConditionalRNARecognitionAndAntiviralResponse";
  group.userData = { teachingOnly: true, description: "包膜 RNA 颗粒识别与抗病毒应答机制示意；摄取与胞质识别是分开条件支路，非完整生命周期。", signalIndicatorMeaning: "发光虚线与脉冲仅指示信号顺序，非实管、实测轨迹或全部中间反应。" };
  const scenarioBindings = new Map();
  const random = seededRandom(77385), materials = /* @__PURE__ */ new Set(), geometries = /* @__PURE__ */ new Set(), displayBindings = /* @__PURE__ */ new Map(), texture = makeReliefTexture(96, 358);
  texture.repeat.set(2, 2);
  const v = new THREE.Vector3(), dummy = new THREE.Object3D(), color = new THREE.Color(), zAxis = new THREE.Vector3(0, 0, 1);
  const anchor = (id, fallback) => {
    const a = whole.organelleLocations.get(id);
    return (a?.position ?? a)?.isVector3 ? (a.position ?? a).clone() : new THREE.Vector3(...fallback);
  };
  const hero = anchor("phagosome", [4.03, 0.02, 1.3]), er = anchor("er", [-0.42, -0.57, 0.7]), golgi = anchor("golgi", [0.4, -2.62, 1.05]);
  const erExportCarrierSite=new THREE.Vector3(.8,-.9,2),golgiExportCarrierSite=new THREE.Vector3(3.15,-1.85,1.3);
  function material(hex, { alpha = 1, glow = 0.1, roughness = 0.51, side = THREE.FrontSide } = {}) {
    const m = new THREE.MeshStandardMaterial({ color: hex, roughness, metalness: 0.025, bumpMap: texture, bumpScale: 0.018, emissive: hex, emissiveIntensity: glow, opacity: alpha, transparent: alpha < 1, depthWrite: alpha >= 1, side });
    m.forceSinglePass = true;
    materials.add(m);
    return m;
  }
  function bindDisplayMaterial(object) {
    const source = Array.isArray(object.material) ? object.material : [object.material];
    const bindings = source.map((base) => {
      const display = base.clone();
      display.transparent = true;
      display.forceSinglePass = true;
      materials.add(display);
      return { base, display };
    });
    object.material = Array.isArray(object.material) ? bindings.map((b) => b.display) : bindings[0].display;
    displayBindings.set(object, bindings);
  }
  function mesh(geometry, mat, name, parent = group) {
    geometries.add(geometry);
    const object = new THREE.Mesh(geometry, mat);
    object.name = name;
    object.userData.teachingOnly = true;
    bindDisplayMaterial(object);
    parent.add(object);
    return object;
  }
  function instances(geometry, mat, count, name, parent = group) {
    geometries.add(geometry);
    const object = new THREE.InstancedMesh(geometry, mat, count);
    object.name = name;
    object.userData.teachingOnly = true;
    object.instanceMatrix.setUsage(THREE.DynamicDrawUsage);
    bindDisplayMaterial(object);
    parent.add(object);
    return object;
  }
  function place(object, i, position, scale, rotation = null, hex = null) {
    dummy.position.copy(position);
    if (typeof scale === "number") dummy.scale.setScalar(scale);
    else dummy.scale.copy(scale);
    dummy.quaternion.identity();
    if (rotation) dummy.quaternion.copy(rotation);
    dummy.updateMatrix();
    object.setMatrixAt(i, dummy.matrix);
    if (hex) {
      color.set(hex);
      object.setColorAt(i, color);
    }
  }
  function visible(object, amount) {
    const weight = clamp(Number.isFinite(amount) ? amount : 0, 0, 1);
    object.visible = weight > 1e-4;
    object.userData.displayWeight = weight;
  }
  function applyDisplayWeights() {
    function visit(object, parentWeight) {
      const weight = parentWeight * (object.userData.displayWeight ?? 1);
      object.userData.effectiveDisplayWeight = weight;
      for (const binding of displayBindings.get(object) ?? []) {
        binding.display.opacity = binding.base.opacity * weight;
        binding.display.depthWrite = binding.base.depthWrite && binding.display.opacity >= 0.99999;
      }
      for (const child of object.children) visit(child, weight);
    }
    visit(group, 1);
  }
  const curve = (points) => new THREE.CatmullRomCurve3(points.map((p) => p.isVector3 ? p.clone() : new THREE.Vector3(...p)), false, "catmullrom", 0.4);
  function sphere(radius, segments = 40, rings = 26) {
    const geometry = new THREE.SphereGeometry(radius, segments, rings), p = geometry.attributes.position;
    for (let i = 0; i < p.count; i++) {
      v.fromBufferAttribute(p, i);
      const k = 1 + 0.035 * Math.sin(v.x * 19 + v.y * 13) * Math.cos(v.z * 17 - v.y * 9);
      p.setXYZ(i, v.x * k, v.y * k, v.z * k);
    }
    geometry.computeVertexNormals();
    return geometry;
  }
  function domains(centers, mat, name, parent = group) {
    const pieces = centers.map(({ p, s }) => {
      const g = proteinGeometry(8);
      g.scale(...s);
      g.translate(...p);
      return g;
    });
    return mesh(merged(pieces), mat, name, parent);
  }
  function strand(points, radius, mat, name, parent = group, segments = 80) {
    return mesh(organicTube(curve(points), radius, { segments, sides: 7, micro: 0.025, roundEnds: true }), mat, name, parent);
  }
  function signal(points, name, hex) {
    const path = curve(points), geometry = new THREE.BufferGeometry().setFromPoints(path.getPoints(64)), mat = new THREE.LineDashedMaterial({ color: hex, transparent: true, opacity: 0.5, dashSize: 0.085, gapSize: 0.13 });
    geometries.add(geometry);
    materials.add(mat);
    const line = new THREE.Line(geometry, mat);
    line.name = name;
    line.userData = { teachingOnly: true, signalOrderIndicator: true, notPhysicalConduit: true };
    line.computeLineDistances();
    bindDisplayMaterial(line);
    group.add(line);
    const pulses = instances(new THREE.SphereGeometry(0.035, 12, 8), material(hex, { glow: 0.28 }), 4, name + "OrderPulses");
    pulses.userData.signalOrderIndicator = true;
    return { set(weight, phase) {
      visible(line, weight);
      visible(pulses, weight);
      for (let i = 0; i < 4; i++) place(pulses, i, path.getPointAt((phase + i * 0.25) % 1), 0.7 + 0.3 * weight);
      pulses.instanceMatrix.needsUpdate = true;
    } };
  }
  const entryDirection = new THREE.Vector3(0.5, -0.22, 0.84).normalize(), entryRadius = whole.surfaceRadius(entryDirection), entrySurface = entryDirection.clone().multiplyScalar(entryRadius), outsideStart = entryDirection.clone().multiplyScalar(entryRadius + 0.95);
  const entryPath = curve([outsideStart, entryDirection.clone().multiplyScalar(entryRadius + 0.45), entryDirection.clone().multiplyScalar(entryRadius - 0.75), hero]);
  // The legacy curve remains a guide-only debug record. No displayed particle
  // traverses its membrane-crossing segment. Omitted local membrane events are
  // an explicit gap between an external state and an already internalized one.
  const externalApproachEnd = entrySurface.clone().addScaledVector(entryDirection, 0.60);
  const uptakeTangent = new THREE.Vector3(1, 0, 0).addScaledVector(entryDirection, -entryDirection.x).normalize();
  const uptakeViewDirection = entryDirection.clone().multiplyScalar(.52).addScaledVector(uptakeTangent, -.80).normalize();
  const uptakeMembrane = new THREE.Group();
  uptakeMembrane.name = 'HostMembraneLocalUptakeStateContext';
  uptakeMembrane.position.copy(entrySurface);
  uptakeMembrane.quaternion.setFromUnitVectors(zAxis, entryDirection);
  group.add(uptakeMembrane);
  const uptakePatch = mesh(responseCurvedMembranePatch(), [
    material('#7f9c9f', {roughness:.75,glow:.015,side:THREE.DoubleSide}),
    material('#9eafa6', {roughness:.76,glow:.015,side:THREE.DoubleSide}),
    material('#c4b697', {roughness:.76,glow:.015,side:THREE.DoubleSide})
  ], 'HostMembraneAtUptakeStateHandoff', uptakeMembrane);
  uptakePatch.userData.classroomAnchorLocal=nearestGeometryAnchor(uptakePatch.geometry,new THREE.Vector3(-.54,-.28,-.06));
  uptakePatch.userData.presentationScope='Curved local host membrane at the actual surface anchor; section edge is an illustration, not a pore or scission event';
  const uptakeMembraneProteins=instances(proteinGeometry(3),material('#777b9d',{roughness:.73,glow:.025}),5,'HostUptakeMembraneEmbeddedProteinDomains',uptakeMembrane);
  for(let i=0;i<5;i++){
    const x=-.48+i*.23,y=(i%2?.21:-.17),r=Math.hypot(x,y);
    place(uptakeMembraneProteins,i,new THREE.Vector3(x,y,-.14*(r/.76)**2),new THREE.Vector3(.038,.052,.12));
  }
  uptakeMembraneProteins.userData.presentationScope='Generic membrane-spanning host domains; no specific uptake receptor or binding mechanism assigned';
  const endosomePath = curve([hero, new THREE.Vector3(1.85, -1.85, 1.35), new THREE.Vector3(1, -2.45, 0.55)]);
  const virus = new THREE.Group();
  virus.name = "EnlargedGenericEnvelopedRNAParticle";
  group.add(virus);
  const viralMembraneMaterial = material("#bb8c73", { roughness:.71,glow:0.025,side:THREE.DoubleSide }), viralCoreMaterial = material("#9576ad", { roughness:0.74,glow:0.025 });
  const viralCutZ=.085;
  const viralEnvelope=mesh(responseOpenMembrane(.305,viralCutZ),viralMembraneMaterial,"IrregularViralEnvelope",virus);
  const viralEnvelopeInner=mesh(responseOpenMembrane(.285,viralCutZ),material('#d4b196',{roughness:.75,glow:.02,side:THREE.DoubleSide}),'ViralEnvelopeLumenFacingSection',virus);
  const viralRim=mesh(new THREE.RingGeometry(Math.sqrt(.285**2-viralCutZ**2),Math.sqrt(.305**2-viralCutZ**2),64),material('#dec7a6',{roughness:.76,glow:.015,side:THREE.DoubleSide}),'ViralEnvelopeSectionRim',virus);
  viralRim.position.z=viralCutZ;
  viralEnvelope.userData.classroomAnchorLocal=nearestGeometryAnchor(viralEnvelope.geometry,new THREE.Vector3(-.23,-.15,.085));
  viralEnvelope.userData.presentationScope='Opaque envelope with an explicitly removed front section; not a membrane fusion pore';
  const core = mesh(proteinGeometry(3), viralCoreMaterial, "NonAtomicGenericViralCore", virus);
  core.scale.set(.13,.145,.11);core.position.z=-.065;
  const spikeMat = material("#d7ad81", { roughness: 0.55, glow: 0.075 }), stalks = instances(new THREE.CylinderGeometry(0.014, 0.019, 0.085, 8), spikeMat, 32, "GenericEnvelopeProteinStalks", virus), heads = instances(proteinGeometry(2), spikeMat, 32, "GenericEnvelopeProteinHeads", virus);
  for (let i = 0; i < 32; i++) {
    const y = 1 - 2 * (i + 0.5) / 32, r = Math.sqrt(1 - y * y), a = i * 2.39996323, direction = new THREE.Vector3(Math.cos(a) * r, y, Math.sin(a) * r), q = new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0, 1, 0), direction);
    // Remove proteins with the illustrative front cap; no floating proteins
    // remain across the opening to obscure the internal components.
    const retained=direction.z<=viralCutZ/.305;
    place(stalks, i, direction.clone().multiplyScalar(0.335),retained?1:0,q);
    place(heads, i, direction.clone().multiplyScalar(0.389),new THREE.Vector3(.04,.037,.038).multiplyScalar(retained?1:0),q);
  }
  const rnaMat = material("#247c84", { roughness: 0.52, glow: 0.14 });
  const takenRNA = strand(Array.from({ length: 20 }, (_, i) => new THREE.Vector3(Math.sin(i * 0.86) * 0.105, (i / 19 - 0.5) * 0.28, Math.cos(i * 1.3) * 0.095)), 0.01, rnaMat, "RNAInsideTakenParticle", virus, 96);
  takenRNA.position.z=.11;
  takenRNA.userData.classroomAnchorLocal=nearestGeometryAnchor(takenRNA.geometry,new THREE.Vector3(.08,.02,.04));
  const endosome = new THREE.Group();
  endosome.name = "UptakeEndosomalCompartmentNotRenamedLysosome";
  group.add(endosome);
  const cutZ=-.11,endosomalOuter=responseOpenMembrane(.56,cutZ),endosomalInner=responseOpenMembrane(.53,cutZ);
  const endosomalMembrane=mesh(endosomalOuter,material('#77a0a8',{roughness:.76,glow:.025,side:THREE.DoubleSide}),'EndosomalSingleMembrane',endosome);
  endosomalMembrane.userData.classroomAnchorLocal=nearestGeometryAnchor(endosomalOuter,new THREE.Vector3(-.48,-.21,-.11));
  mesh(endosomalInner,material('#91aaa9',{roughness:.69,glow:.025,side:THREE.DoubleSide}),'EndosomalLumenFacingMembraneCutaway',endosome);
  const cutRim=mesh(new THREE.RingGeometry(Math.sqrt(.53**2-cutZ**2),Math.sqrt(.56**2-cutZ**2),48),material('#b0beb0',{roughness:.70,glow:.02,side:THREE.DoubleSide}),'EndosomalMembraneCutRim',endosome);cutRim.position.z=cutZ;
  const coat = instances(proteinGeometry(1), material("#8eaaa7", { roughness: 0.68, glow: 0.025 }), 18, "EndosomalMembraneAssociatedDomains", endosome);
  for (let i = 0; i < 18; i++) {
    const z=-.53+(i+.5)/18*.38,r=Math.sqrt(.555**2-z*z),a=i*2.399963;
    place(coat,i,new THREE.Vector3(Math.cos(a)*r,Math.sin(a)*r,z),.025+random()*.012);
  }
  const fragments = instances(proteinGeometry(2), material("#a68b70", { roughness: 0.73, glow: 0.025 }), 12, "InternalViralComponentDecomposition", endosome);
  const fragmentSeeds=Array.from({length:fragments.count},(_,i)=>({direction:new THREE.Vector3(Math.cos(i*2.399963),Math.sin(i*2.399963),0),phase:random()*TAU,radius:.028+random()*.018,spread:.50+.45*random()}));
  const firstMito = whole.components?.mitochondria?.[0];
  const mito = firstMito?.component?.group ?? firstMito?.group;
  const actualOuter = mito?.getObjectByName("MitochondrialClosedOuterMembrane");
  if (!actualOuter) throw new Error("ViralAtlas requires the actual first mitochondrial outer membrane");
  whole.group.updateMatrixWorld(true);
  const mitoCenter = actualOuter.getWorldPosition(new THREE.Vector3());
  const preferredMavs = firstMito.component?.anchors?.mavs?.clone();
  if (preferredMavs) mito.localToWorld(preferredMavs);
  function visibleClipDistances(object, point) {
    const mats = Array.isArray(object.material) ? object.material : [object.material];
    return mats.flatMap((mat) => (mat.clippingPlanes ?? []).map((plane) => plane.distanceToPoint(point)));
  }
  const probeDirections = [new THREE.Vector3(0.45, 0.35, -0.025), new THREE.Vector3(0.6, 0.28, -0.035), new THREE.Vector3(0.25, 0.39, -0.035)];
  for (let i = 0; i < 220; i++) {
    const y = 1 - 2 * (i + 0.5) / 220, r = Math.sqrt(1 - y * y), a = i * 2.399963229728653;
    probeDirections.push(new THREE.Vector3(Math.cos(a) * r, y * 0.42, Math.sin(a) * r * 0.43));
  }
  const mavsCandidates = [], viewGuide = new THREE.Vector3(0.18, 0.25, 1).normalize(), shoulderGuide = new THREE.Vector3(0.8, 0.6, 0).normalize();
  for (const local of probeDirections) {
    const rayDirection = actualOuter.localToWorld(local.clone()).sub(mitoCenter).normalize(), hit = new THREE.Raycaster(mitoCenter.clone().addScaledVector(rayDirection, 4), rayDirection.clone().negate()).intersectObject(actualOuter, false)[0];
    if (!hit) continue;
    const clipDistances = visibleClipDistances(actualOuter, hit.point);
    if (clipDistances.some((distance) => distance < 0.032)) continue;
    const normal = hit.face.normal.clone().applyMatrix3(new THREE.Matrix3().getNormalMatrix(actualOuter.matrixWorld)).normalize();
    if (normal.dot(hit.point.clone().sub(mitoCenter)) < 0) normal.negate();
    const clipMargin = clipDistances.length ? Math.min(...clipDistances) : 0, score = normal.dot(viewGuide) * 1.8 + normal.dot(shoulderGuide) * 0.55 - (preferredMavs ? hit.point.distanceTo(preferredMavs) * 0.15 : 0) - clipMargin * 0.35;
    mavsCandidates.push({ point: hit.point.clone(), normal, clipDistances, score });
  }
  mavsCandidates.sort((a, b) => b.score - a.score);
  const selectedMavs = mavsCandidates[0];
  if (!selectedMavs) throw new Error("No visible retained mitochondrial outer membrane for MAVS; refusing a clipped or center fallback");
  const mavsSite = selectedMavs.point.clone(), mavsNormal = selectedMavs.normal.clone();
  const sensingOrigin = mavsSite.clone().addScaledVector(mavsNormal, 0.74).add(new THREE.Vector3(-0.4, 0, 0.12));
  const sensing = new THREE.Group();
  sensing.name = "IndependentConditionalCytosolicRNASensingBranch";
  group.add(sensing);
  const cytRNA = new THREE.Group();
  cytRNA.name = "IndependentRNAAlreadyInCytosolNotEndosomalEscape";
  cytRNA.position.copy(sensingOrigin).add(new THREE.Vector3(-0.28, 0.03, 0.1));
  sensing.add(cytRNA);
  const hairpin = [];
  for (let i = 0; i <= 28; i++) {
    const t = i / 28;
    hairpin.push(new THREE.Vector3((t - 0.5) * 0.6, 0.075 * Math.sin(t * TAU * 3), 0.045 * Math.cos(t * TAU * 3)));
  }
  strand(hairpin, 0.018, rnaMat, "RecognizableRNAHairpinSchematic", cytRNA, 80);
  strand(hairpin.map((p) => p.clone().add(new THREE.Vector3(0, 0.07, 0.025))), 0.012, rnaMat, "PairedRNARegionSchematic", cytRNA, 80);
  const rig = new THREE.Group();
  rig.name = "CytosolicRIGISelectedSensorExample";
  rig.position.copy(sensingOrigin);
  sensing.add(rig);
  domains([{ p: [-0.1, 0, 0], s: [0.17, 0.2, 0.13] }, { p: [0.13, 0.015, 0], s: [0.15, 0.18, 0.12] }, { p: [0.015, -0.16, 0.04], s: [0.11, 0.085, 0.1] }], material("#9278b8", { roughness: 0.57, glow: 0.1 }), "NonAtomicRIGIProteinDomains", rig);
  const rigCards=domains([{p:[-.04,0,0],s:[.055,.067,.05]},{p:[.045,-.045,.01],s:[.055,.067,.05]}],material('#b79ac8',{roughness:.64,glow:.065}),'RIGICARDExposureTeachingDomains',rig);
  rigCards.userData.identity='RIG-I tandem CARD exposure; non-atomic state schematic';
  const mavs = new THREE.Group();
  mavs.name = "MAVSOnCytosolicFaceOfMitochondrialOuterMembrane";
  mavs.position.copy(mavsSite);
  mavs.quaternion.setFromUnitVectors(zAxis, mavsNormal);
  sensing.add(mavs);
  const mavsMat = material("#d4a472", { roughness: 0.54, glow: 0.11 });
  domains([{ p: [0, 0, 0.045], s: [0.08, 0.07, 0.11] }, { p: [0, 0, 0.21], s: [0.11, 0.095, 0.1] }, { p: [0.075, 0.02, 0.34], s: [0.09, 0.08, 0.085] }], mavsMat, "MembraneAnchoredMAVSAdaptorDomains", mavs);
  strand([[0, 0, -0.07], [0, 0, 0.06], [0.025, 0, 0.17]], 0.026, mavsMat, "MAVSTransmembraneAnchorSchematic", mavs, 24);
  const mavsAssembly=instances(proteinGeometry(1),mavsMat,8,'MAVSCARDSignalingAssemblySchematic',mavs);
  for(let i=0;i<8;i++){const a=i*1.78;place(mavsAssembly,i,new THREE.Vector3(Math.cos(a)*.062,Math.sin(a)*.062,.22+i*.042),new THREE.Vector3(.049,.043,.037));}mavsAssembly.instanceMatrix.needsUpdate=true;
  const downstream=new THREE.Group();downstream.name='MAVSDownstreamKinaseLocalTeachingExcerpt';
  const mavsTangent=new THREE.Vector3(1,0,0).addScaledVector(mavsNormal,-mavsNormal.x).normalize();
  const tbk1Site=mavsSite.clone().addScaledVector(mavsNormal,.73).addScaledVector(mavsTangent,.30);
  downstream.position.copy(tbk1Site);downstream.quaternion.setFromUnitVectors(zAxis,mavsNormal);group.add(downstream);
  const tbk1=domains([{p:[-.08,0,0],s:[.105,.10,.065]},{p:[.08,.015,0],s:[.105,.10,.065]}],material('#8a9b73',{roughness:.65,glow:.055}),'TBK1DownstreamKinaseTeachingDomains',downstream);
  const irfSubstrate=domains([{p:[-.025,0,0],s:[.06,.075,.055]},{p:[.05,.01,0],s:[.055,.069,.052]}],material('#e0b27e',{roughness:.64,glow:.055}),'IRF3SubstrateAtDownstreamKinaseExcerpt',downstream);
  const irfPhosphates=instances(new THREE.SphereGeometry(.021,12,8),material('#df9345',{roughness:.63,glow:.12}),2,'IRF3PhosphorylationStateMarkers_NotFreeCargo',downstream);
  irfPhosphates.userData.stateMarkerNotFreeMolecule=true;
  const rigOrder = signal([sensingOrigin, mavsSite.clone().addScaledVector(mavsNormal, 0.52), mavsSite.clone().addScaledVector(mavsNormal, 0.23)], "RIGIToMAVSSignalOrderOnly", "#6d73b0");
  const vectorFrom = (value) => value?.isVector3 ? value.clone() : new THREE.Vector3(...value);
  const vectorFromSite = (value) => value?.isVector3 ? value.clone() : new THREE.Vector3(...value);
  const actualPores = whole.nuclearPoreSites ?? [];
  const nuclearPlaced = whole.components?.nucleus;
  const nuclearRoot = nuclearPlaced?.component?.group;
  const nuclearEnvelope = nuclearRoot?.getObjectByName("PerforatedDoubleNuclearMembrane");
  const nuclearNPC = nuclearRoot?.getObjectByName("ThirtyTwoEightFoldNPCAssemblies");
  if (!actualPores.length || !nuclearEnvelope) throw new Error("ViralAtlas requires actual perforated nuclear envelope pore sites");
  const nuclearCenter = nuclearRoot.getWorldPosition(new THREE.Vector3());
  const preferredPore = nuclearCenter.clone().add(new THREE.Vector3(1.25, 0.7, 0.7));
  function retainedPoreSite(site) {
    const point = vectorFromSite(site.position), axis = vectorFromSite(site.direction ?? site.normal).normalize(), tangent = new THREE.Vector3(0, 1, 0).cross(axis).normalize(), bitangent = new THREE.Vector3().crossVectors(axis, tangent).normalize(), samples = [point, ...site.outerCenter ? [vectorFromSite(site.outerCenter)] : [], ...site.innerCenter ? [vectorFromSite(site.innerCenter)] : []];
    for (let i = 0; i < 8; i++) {
      const a = i / 8 * TAU;
      samples.push(point.clone().addScaledVector(tangent, Math.cos(a) * 0.12).addScaledVector(bitangent, Math.sin(a) * 0.12));
    }
    return samples.every((p) => visibleClipDistances(nuclearEnvelope, p).every((d) => d >= 0.03) && (!nuclearNPC || visibleClipDistances(nuclearNPC, p).every((d) => d >= 0.03)));
  }
  const visibleSites = actualPores.filter((site) => {
    const p = vectorFromSite(site.position);
    return p.z > 0.25 && p.z < 0.84 && retainedPoreSite(site);
  });
  if (!visibleSites.length) throw new Error("No retained visible nuclear pore for transport; refusing a clipped portal");
  const selectedPore = visibleSites.map((site) => ({ site, position: vectorFromSite(site.position) })).sort((a, b) => a.position.distanceToSquared(preferredPore) - b.position.distanceToSquared(preferredPore))[0];
  const nuclearPore = selectedPore.position.clone(), nuclearPoreDirection = vectorFromSite(selectedPore.site.direction ?? selectedPore.site.normal).normalize();
  const poreMeshes = [nuclearEnvelope, ...nuclearNPC ? [nuclearNPC] : []];
  const poreTangent = new THREE.Vector3(0, 1, 0).cross(nuclearPoreDirection).normalize();
  const poreBitangent = new THREE.Vector3().crossVectors(nuclearPoreDirection, poreTangent).normalize();
  function poreAxisClear(offset) {
    const start = nuclearPore.clone().add(offset).addScaledVector(nuclearPoreDirection, 0.26), end = nuclearPore.clone().add(offset).addScaledVector(nuclearPoreDirection, -0.26), delta = end.sub(start);
    return new THREE.Raycaster(start, delta.clone().normalize(), 1e-6, delta.length()).intersectObjects(poreMeshes, false).length === 0;
  }
  if (!poreAxisClear(new THREE.Vector3())) throw new Error("Selected pore central axis is blocked by actual nuclear mesh");
  let poreClearRadius = Infinity;
  for (let angle = 0; angle < 16; angle++) {
    const a = angle / 16 * TAU, tangent = poreTangent.clone().multiplyScalar(Math.cos(a)).addScaledVector(poreBitangent, Math.sin(a));
    let lo = 0, hi = 0.3;
    for (let step = 0; step < 13; step++) {
      const mid = (lo + hi) * 0.5;
      if (poreAxisClear(tangent.clone().multiplyScalar(mid))) lo = mid;
      else hi = mid;
    }
    poreClearRadius = Math.min(poreClearRadius, lo);
  }
  if (!(poreClearRadius > 0.015)) throw new Error("Nuclear pore clearance is too small for the teaching transport proteins");
  const poreApproach = [0.6, 0.3, 0, -0.3, -0.6].map((distance) => nuclearPore.clone().addScaledVector(nuclearPoreDirection, distance));
  const geneDisplay = nuclearCenter.clone().add(new THREE.Vector3(0.15, 0.25, 0.62));
  const transcription = new THREE.Group();
  transcription.name = "IFNB1NuclearInteriorTeachingProjection";
  transcription.position.copy(geneDisplay);
  transcription.userData.localNuclearTeachingProjection = true;
  group.add(transcription);
  const dnaMat = material("#4a70a4", { roughness: 0.57, glow: 0.12 }), dnaMat2 = material("#bd88b1", { roughness: 0.57, glow: 0.1 }), dnaA = [], dnaB = [], rungs = [];
  for (let i = 0; i <= 40; i++) {
    const t = i / 40, x = (t - 0.5) * 0.82;
    dnaA.push(new THREE.Vector3(x, 0.075 * Math.sin(t * TAU * 2), 0.075 * Math.cos(t * TAU * 2)));
    dnaB.push(new THREE.Vector3(x, -0.075 * Math.sin(t * TAU * 2), -0.075 * Math.cos(t * TAU * 2)));
  }
  strand(dnaA, 0.013, dnaMat, "NuclearDNAExcerptNotGeneCoordinates", transcription, 80);
  strand(dnaB, 0.013, dnaMat2, "NuclearDNASecondStrandExcerpt", transcription, 80);
  for (let i = 0; i <= 14; i++) {
    const t = i / 14, x = (t - 0.5) * 0.82;
    rungs.push(organicTube(curve([[x, 0.075 * Math.sin(t * TAU * 2), 0.075 * Math.cos(t * TAU * 2)], [x, 0, 0], [x, -0.075 * Math.sin(t * TAU * 2), -0.075 * Math.cos(t * TAU * 2)]]), 9e-3, { segments: 4, sides: 5 }));
  }
  mesh(merged(rungs), dnaMat, "SchematicDNAConnectionRungs", transcription);
  const nascentRNA = strand([[0, 0, 0.02], [0.07, 0.16, 0.04], [0.2, 0.24, 0.06], [0.29, 0.32, 0.01], [0.43, 0.36, 0.09]], 0.016, rnaMat, "IFNB1NascentTranscriptTeachingProjection", transcription, 56);
  const polymerase=domains([{p:[0,.015,.11],s:[.11,.10,.095]},{p:[.1,.035,.08],s:[.067,.073,.067]}],material('#718f91',{roughness:.69,glow:.035}),'HostRNApolymeraseIITranscriptionTeachingSymbol',transcription);
  const coFactors=domains([{p:[-.25,.015,.12],s:[.065,.07,.065]},{p:[.26,.005,.12],s:[.068,.06,.065]}],material('#b79875',{roughness:.67,glow:.035}),'IFNB1CooperatingTranscriptionFactorSymbols',transcription);
  coFactors.userData.identity='Cooperating host transcription factors; not exact enhanceosome coordinates';
  const irf = domains([{ p: [-0.045, 0, 0], s: [0.1, 0.13, 0.09] }, { p: [0.09, 0, 0.02], s: [0.11, 0.12, 0.085] }], material("#e0b27e", { roughness: 0.56, glow: 0.12 }), "ActivatedIRF3TeachingDimer");
  const irfUnscaledRadius = Math.max(...Array.from({ length: irf.geometry.attributes.position.count }, (_, i) => new THREE.Vector3().fromBufferAttribute(irf.geometry.attributes.position, i).length()));
  const transportScale = Math.min(0.32, poreClearRadius * 0.68 / irfUnscaledRadius);
  irf.scale.setScalar(transportScale);
  const irfPath = curve([tbk1Site.clone().addScaledVector(mavsNormal,.17), new THREE.Vector3(.8,3.4,2.5), new THREE.Vector3(1.6, 1.5, 2.45), ...poreApproach, nuclearCenter.clone().add(new THREE.Vector3(0.6, 0.3, 0.8))]);
  const irfOrder = signal([mavsSite, new THREE.Vector3(1.6, 1.5, 2.45), nuclearPore], "MAVSDownstreamToNuclearResponseSignalOrderOnly", "#ae752f");
  const hostTranscript = strand(Array.from({ length: 18 }, (_, i) => {
    const t = i / 17;
    return new THREE.Vector3((t - 0.5) * 0.36, 0.02 * Math.sin(t * TAU * 2.5), 0.018 * Math.cos(t * TAU * 2.5));
  }), 8e-3, material("#a96c37", { roughness: 0.56, glow: 0.08 }), "HostIFNB1MessengerRNAExportTeachingPath", group, 64);
  const hostTranscriptScale = Math.min(0.25, poreClearRadius * 0.64 / 0.2);
  hostTranscript.scale.setScalar(hostTranscriptScale);
  const hostTranscriptPath = curve([geneDisplay, ...poreApproach.slice().reverse(), erExportCarrierSite.clone().add(new THREE.Vector3(-.28,0,.17))]);
  const secretion = new THREE.Group();
  secretion.name = "IFNBetaSecretoryProcessingAndRelease";
  group.add(secretion);
  const exportDirection = new THREE.Vector3(0.88, -0.32, 0.35).normalize(), exportSurface = exportDirection.clone().multiplyScalar(whole.surfaceRadius(exportDirection)), outsideIFN = exportSurface.clone().addScaledVector(exportDirection, 0.5);
  const processingPath = curve([er, new THREE.Vector3(0.8, -0.9, 2), new THREE.Vector3(1, -1.6, 2.2), golgi]);
  const releasePath = curve([golgi, new THREE.Vector3(3.15, -1.85, 1.3), exportSurface.clone().addScaledVector(exportDirection, -0.65), exportSurface.clone().addScaledVector(exportDirection, -0.285)]);
  // These are cytoplasmic carrier display states after export, not positions
  // inside ER/Golgi cisternae or evidence for a reconstructed budding/fusion.
  const secretoryCarrierPath=curve([golgiExportCarrierSite,new THREE.Vector3(3.9,-1.6,1.8),exportSurface.clone().addScaledVector(exportDirection,-.70),exportSurface.clone().addScaledVector(exportDirection,-.36)]);
  const vesicle = new THREE.Group();
  vesicle.name = "IFNBetaTransportSecretoryVesicle";
  secretion.add(vesicle);
  mesh(sphere(0.265, 32, 20), material("#bf98b4", { alpha: 0.28, roughness: 0.43, glow: 0.06, side: THREE.DoubleSide }), "SecretoryVesicleSingleMembrane", vesicle);
  const ifnMat = material("#277f83", { roughness: 0.54, glow: 0.13 }), ifnCargo = instances(proteinGeometry(2), ifnMat, 12, "IFNBetaSecretoryCargoDomains", vesicle);
  for (let i = 0; i < 12; i++) {
    const a = i * 2.399963, r = 0.08 + 0.06 * (i % 3) / 2;
    place(ifnCargo, i, new THREE.Vector3(Math.cos(a) * r, Math.sin(a) * r, (i % 4 - 1.5) * 0.065), new THREE.Vector3(0.047, 0.036, 0.041));
  }
  const extracellular = instances(proteinGeometry(3), ifnMat, 8, "ExtracellularReleasedIFNBeta"), releaseSeeds = Array.from({ length: 8 }, (_, i) => new THREE.Vector3(Math.sin(i * 2.4) * 0.18, Math.cos(i * 1.7) * 0.16, Math.sin(i * 1.2) * 0.14));
  const production=createResponseProduction({THREE,group,mesh,instances,place,domains,strand,material,visible,erSite:erExportCarrierSite,golgiSite:golgiExportCarrierSite,exportSurface,exportNormal:exportDirection,entrySurface,entryNormal:entryDirection,includeUptakeContext:false});
  const receptorDirection = new THREE.Vector3(0.99, -0.12, 0.045).normalize(), receptorSite = receptorDirection.clone().multiplyScalar(whole.surfaceRadius(receptorDirection));
  const receptor = new THREE.Group();
  receptor.name = "SurfaceIFNAR1IFNAR2SchematicReceptor";
  receptor.position.copy(receptorSite);
  receptor.quaternion.setFromUnitVectors(zAxis, receptorDirection);
  group.add(receptor);
  // Actual rest-pose membrane neighborhood; no full-shell rays in apply/update.
  const cellShell = whole.group.getObjectByName("ClosedOrganicMembraneWith36Pseudopods");
  if (!cellShell?.isMesh) throw new Error("IFNAR assembly requires actual whole membrane");
  const anchorHit = new THREE.Raycaster(receptorSite.clone().addScaledVector(receptorDirection, 1), receptorDirection.clone().negate(), 0, 2).intersectObject(cellShell, false)[0];
  if (!anchorHit) throw new Error("IFNAR actual membrane anchor ray missed");
  const ifnarSite = anchorHit.point.clone(), ifnarNormal = anchorHit.face.normal.clone().applyMatrix3(new THREE.Matrix3().getNormalMatrix(cellShell.matrixWorld)).normalize();
  if (ifnarNormal.dot(receptorDirection) < 0) ifnarNormal.negate();
  receptor.position.copy(ifnarSite);receptor.quaternion.setFromUnitVectors(zAxis, ifnarNormal);receptor.updateMatrixWorld(true);
  const receptorInverse = receptor.matrixWorld.clone().invert(), receptorWorldQuaternion = receptor.getWorldQuaternion(new THREE.Quaternion()), parentRotationInverse = receptorWorldQuaternion.clone().invert();
  const lateralTangent = new THREE.Vector3(1,0,0).applyQuaternion(receptorWorldQuaternion), patchTriangles = [];
  const cp=cellShell.geometry.attributes.position, ci=cellShell.geometry.index, pa=new THREE.Vector3(),pb=new THREE.Vector3(),pc=new THREE.Vector3();
  for(let k=0;k<ci.count;k+=3){
    pa.fromBufferAttribute(cp,ci.getX(k)).applyMatrix4(cellShell.matrixWorld);pb.fromBufferAttribute(cp,ci.getX(k+1)).applyMatrix4(cellShell.matrixWorld);pc.fromBufferAttribute(cp,ci.getX(k+2)).applyMatrix4(cellShell.matrixWorld);
    if(Math.min(pa.distanceToSquared(ifnarSite),pb.distanceToSquared(ifnarSite),pc.distanceToSquared(ifnarSite)) < .34*.34) patchTriangles.push([pa.clone(),pb.clone(),pc.clone()]);
  }
  const localRay=new THREE.Ray(),localHit=new THREE.Vector3();
  function patchAnchor(offset){
    const guess=ifnarSite.clone().addScaledVector(lateralTangent,offset);localRay.set(guess.clone().addScaledVector(ifnarNormal,.6),ifnarNormal.clone().negate());
    let distance=Infinity,best=null,normal=null;
    for(const tri of patchTriangles){const hit=localRay.intersectTriangle(...tri,false,localHit);if(!hit)continue;const d=hit.distanceTo(localRay.origin);if(d<distance){distance=d;best=hit.clone();normal=tri[1].clone().sub(tri[0]).cross(tri[2].clone().sub(tri[0])).normalize();}}
    if(!best)throw new Error("IFNAR local membrane neighborhood ray missed");if(normal.dot(ifnarNormal)<0)normal.negate();return {point:best,normal};
  }
  const receptorMat = material("#a78bbf", { roughness: 0.52, glow: 0.11 }), receptor2Mat=material("#7f9eb7",{roughness:.52,glow:.11});
  function makeSubunit(id,sign,mat){
    const root=new THREE.Group();root.name=id+"MembraneSubunit";root.userData.ifnarSubunit=id;receptor.add(root);
    const shape=domains([{p:[0,0,.22],s:[.065,.075,.135]},{p:[0,0,-.15],s:[.055,.06,.075]}],mat,id+"ExtracellularAndCytoplasmicDomains",root);
    const n=shape.geometry.attributes.position.count/2;shape.geometry.userData.ifnarRegions={ectodomain:[0,n],cytoplasmic:[n,n*2]};
    mesh(organicTube(curve([[0,0,-.15],[0,0,.02],[0,0,.20]]),.025,{segments:12,sides:7}),mat,id+"TransmembraneStem",root);
    const samples=Array.from({length:16},(_,i)=>patchAnchor(sign*THREE.MathUtils.lerp(.21,.078,i/15)));
    return {id,sign,root,samples};
  }
  const ifnar1=makeSubunit("IFNAR1",-1,receptorMat),ifnar2=makeSubunit("IFNAR2",1,receptor2Mat);
  function positionSubunit(chain,amount){
    const t=clamp(amount,0,1)*15,i=Math.min(14,Math.floor(t)),f=t-i,a=chain.samples[i],b=chain.samples[i+1],point=a.point.clone().lerp(b.point,f),normal=a.normal.clone().lerp(b.normal,f).normalize();
    chain.root.position.copy(point.clone().applyMatrix4(receptorInverse));chain.root.quaternion.copy(parentRotationInverse).multiply(new THREE.Quaternion().setFromUnitVectors(zAxis,normal));
    chain.root.userData.surfaceSite=point.toArray();chain.root.userData.surfaceNormal=normal.toArray();chain.root.userData.lateralOffset=chain.sign*THREE.MathUtils.lerp(.21,.078,amount);
  }
  const boundIFN=mesh(proteinGeometry(3),ifnMat,"SelectedIFNBetaBindingIFNAR2",receptor);boundIFN.scale.set(.055,.050,.050);boundIFN.userData.identity="SelectedSecretedIFNBeta";
  const jakMat=material("#cdad83", { roughness: 0.56, glow: 0.12 });
  const jak = domains([{ p: [-0.11, 0, -0.28], s: [0.1, 0.09, 0.09] }, { p: [0.13, 0, -0.28], s: [0.1, 0.09, 0.09] }],jakMat,"JAK1TYK2CytosolicSideSchematic",receptor);
  const inactiveJAK=new THREE.Color("#cdad83"),activeJAK=new THREE.Color("#bc6c46");
  const statAtReceptor=domains([{p:[-.10,-.01,-.43],s:[.062,.075,.06]},{p:[.11,.01,-.44],s:[.065,.07,.055]}],material('#398c95',{roughness:.64,glow:.055}),'STAT1STAT2ReceptorSideSubstrateTeachingDomains',receptor);
  const statPhosphates=instances(new THREE.SphereGeometry(.019,12,8),material('#df9345',{roughness:.63,glow:.10}),2,'STATPhosphorylationStateMarkers_NotFreeCargo',receptor);
  statPhosphates.userData.stateMarkerNotFreeMolecule=true;
  place(statPhosphates,0,new THREE.Vector3(-.12,-.03,-.40),1);place(statPhosphates,1,new THREE.Vector3(.13,-.03,-.41),1);statPhosphates.instanceMatrix.needsUpdate=true;
  const autocrinePath = curve(Array.from({ length: 12 }, (_, i) => {
    const t = i / 11, d = exportDirection.clone().lerp(receptorDirection, t).normalize();
    return d.multiplyScalar(whole.surfaceRadius(d) + THREE.MathUtils.lerp(0.5, 0.3, t));
  }));
  // Legacy object name retained for visibility/bookmarks. Its two domains now
  // depict STAT1/STAT2 nuclear entry, not a universal preassembled ISGF3.
  const stat = domains([{ p: [-0.1, 0, 0], s: [0.1, 0.13, 0.085] }, { p: [0.1, 0, 0], s: [0.1, 0.13, 0.085] }], material("#267e8d", { roughness: 0.55, glow: 0.15 }), "STAT1STAT2IRF9SelectedComplex");
  stat.userData.identity='STAT1/STAT2 nuclear-entry teaching group; IRF9 participation is shown at nuclear DNA';
  const statUnscaledRadius = Math.max(...Array.from({ length: stat.geometry.attributes.position.count }, (_, i) => new THREE.Vector3().fromBufferAttribute(stat.geometry.attributes.position, i).length()));
  const statTransportScale = Math.min(transportScale, poreClearRadius * 0.68 / statUnscaledRadius);
  stat.scale.setScalar(statTransportScale);
  const statPath = curve([receptorSite.clone().addScaledVector(receptorDirection, -0.45), new THREE.Vector3(4.6,-1.9,1.7), new THREE.Vector3(2.3, 0.8, 2.3), ...poreApproach, nuclearCenter.clone().add(new THREE.Vector3(0.3, 0.3, 0.8))]);
  const statOrder = signal([receptorSite.clone().addScaledVector(receptorDirection, -0.3), new THREE.Vector3(2.3, 0.8, 2.3), nuclearPore], "JAKSTATToISGSignalOrderOnly", "#277e8b");
  const isgTranscription=new THREE.Group();isgTranscription.name='ISGNuclearTranscriptionLocalExcerpt';isgTranscription.position.copy(geneDisplay).add(new THREE.Vector3(0,-.40,.04));group.add(isgTranscription);
  strand(dnaA.map(p=>p.clone().multiplyScalar(.78)),.012,dnaMat,'ISGHostDNAWithISRETeachingExcerpt',isgTranscription,64);
  strand(dnaB.map(p=>p.clone().multiplyScalar(.78)),.012,dnaMat2,'ISGHostDNASecondStrandTeachingExcerpt',isgTranscription,64);
  domains([{p:[-.11,.02,.10],s:[.073,.09,.06]},{p:[.06,.02,.10],s:[.073,.09,.06]}],material('#398c95',{roughness:.64,glow:.05}),'NuclearSTAT1STAT2AtISGRegulatoryDNATeachingDomains',isgTranscription);
  domains([{p:[.19,.02,.095],s:[.065,.075,.055]}],material('#9278b8',{roughness:.65,glow:.05}),'NuclearIRF9ForISGTranscriptionTeachingDomain',isgTranscription);
  const isgRNA=strand([[0,0,.02],[.08,.16,.035],[.23,.19,.07],[.32,.28,.025]],.014,rnaMat,'HostISGTranscriptionNascentRNA',isgTranscription,44);
  const products = instances(proteinGeometry(2), material("#a68b70", { roughness: 0.59, glow: 0.14 }), 30, "InducedISGAntiviralGeneProductsSchematic");
  for (let i = 0; i < 30; i++) {
    let point;
    for (let a = 0; a < 300; a++) {
      point = new THREE.Vector3(Math.sin(i * 2.399 + a), Math.cos(i * 1.37 + a * 0.61), Math.sin(i * 0.71 + a * 1.1)).normalize().multiplyScalar(3.6 + i % 4 * 0.28);
      if (point.distanceTo(nuclearCenter) > 2.7) break;
    }
    place(products, i, point, new THREE.Vector3(0.075, 0.09, 0.07), null, i % 3 === 0 ? "#b099ca" : "#82b9bc");
  }
  // Presentation dependencies describe each existing object or its displayed
  // context. They are not claims that every dependent object is a membrane
  // protein or is biologically contained in all dependency compartments.
  const uptakeParticleDependencies = () => progress >= 0.125
    ? ["viral-particles", "endosome"] : ["viral-particles"];
  function tagScenario(root, role, componentKey, dependencies) {
    root.traverse(object => {
      if (!(object.isMesh || object.isLine || object.isPoints || object.isSprite)) return;
      object.userData.scenarioRole = role;
      object.userData.componentKey = componentKey;
      scenarioBindings.set(object, { object, role, componentKey, dependencies });
    });
  }
  const named = name => group.getObjectByName(name);
  const tagSignal = (name, dependencies) => {
    tagScenario(named(name), "signal-order-indicator-not-conduit", "signal-order", dependencies);
    tagScenario(named(name + "OrderPulses"), "signal-order-indicator-not-conduit", "signal-order", dependencies);
  };
  tagScenario(virus, "external-or-taken-viral-particle-and-components", "viral-particles", uptakeParticleDependencies);
  tagScenario(uptakeMembrane,"host-uptake-membrane-local-context","membrane",["membrane"]);
  tagScenario(uptakeMembraneProteins,"host-uptake-membrane-local-context","membrane-proteins",["membrane","membrane-proteins"]);
  tagScenario(endosome, "uptake-endosomal-compartment-and-associated-domains", "endosome", ["endosome"]);
  tagScenario(fragments, "viral-component-fragments-in-endosomal-lumen", "viral-particles", ["viral-particles", "endosome"]);
  tagScenario(cytRNA, "independent-conditional-cytosolic-viral-RNA", "viral-particles", ["viral-particles", "cytoplasm"]);
  tagScenario(rig, "host-cytosolic-RNA-sensor-example", "cytoplasm", ["cytoplasm"]);
  tagScenario(mavs, "mitochondrial-outer-membrane-adaptor-schematic", "membrane-proteins", ["mitochondria", "membrane-proteins"]);
  tagScenario(downstream,'host-MAVS-downstream-kinase-excerpt','cytoplasm',['cytoplasm','mitochondria']);
  tagSignal("RIGIToMAVSSignalOrderOnly", ["cytoplasm", "mitochondria", "membrane-proteins"]);
  tagScenario(irf, "host-nuclear-transport-schematic", "nuclear-signal", ["nucleus", "pore"]);
  tagSignal("MAVSDownstreamToNuclearResponseSignalOrderOnly", ["mitochondria", "membrane-proteins", "nucleus", "pore"]);
  tagScenario(transcription, "host-nuclear-transcription-teaching-projection", "nucleus", ["nucleus"]);
  tagScenario(hostTranscript, "host-messenger-RNA-export-to-ER-schematic", "nuclear-signal", ["nucleus", "pore", "er"]);
  tagScenario(vesicle, "host-secretory-vesicle-and-IFN-cargo", "transport-vesicles", ["er", "golgi", "transport-vesicles"]);
  for(const record of production.records)tagScenario(record.object,record.role,record.dependencies[0],record.dependencies);
  tagScenario(extracellular, "host-extracellular-released-IFN", "extracellular-signal", ["membrane"]);
  tagScenario(receptor, "host-cell-surface-IFNAR-context", "membrane-proteins", ["membrane", "membrane-proteins"]);
  // JAK is attached on the cytosolic side; its gate follows the receptor
  // context but its semantic role is not transmembrane protein.
  tagScenario(boundIFN, "host-extracellular-IFN-bound-to-receptor-context", "extracellular-signal", ["membrane", "membrane-proteins"]);
  tagScenario(jak, "IFNAR-associated-cytosolic-kinase-schematic", "receptor-associated-signal", ["membrane", "membrane-proteins"]);
  tagScenario(statAtReceptor,'IFNAR-associated-cytosolic-kinase-schematic','receptor-associated-signal',['membrane','membrane-proteins']);
  tagScenario(statPhosphates,'IFNAR-associated-cytosolic-kinase-schematic','receptor-associated-signal',['membrane','membrane-proteins']);
  tagScenario(stat, "host-nuclear-transport-schematic", "nuclear-signal", ["nucleus", "pore"]);
  tagSignal("JAKSTATToISGSignalOrderOnly", ["membrane", "membrane-proteins", "nucleus", "pore"]);
  tagScenario(products, "host-cytosolic-induced-gene-product-schematic", "cytoplasm", ["cytoplasm"]);
  tagScenario(isgTranscription,'host-ISG-nuclear-transcription-excerpt','nucleus',['nucleus']);
  function getObjectVisibilityDependencies(object) {
    const entry = scenarioBindings.get(object);
    if (!entry) return null;
    return [...(typeof entry.dependencies === "function" ? entry.dependencies() : entry.dependencies)];
  }
  function getVisibilityBindings() {
    return [...scenarioBindings.values()].map(entry => ({
      object: entry.object, role: entry.role, componentKey: entry.componentKey,
      dependencies: getObjectVisibilityDependencies(entry.object)
    }));
  }
  function getLabelVisibilityDependencies(key) {
    const dependencies = {
      virus: uptakeParticleDependencies,
      entry: ["membrane", "viral-particles"],
      endosome: ["endosome"],
      "no-leak": ["endosome", "viral-particles"],
      "conditional-rna": ["viral-particles", "cytoplasm"],
      mavs: ["cytoplasm", "mitochondria", "membrane-proteins"],
      irf3: ["nucleus", "pore"],
      ifnb1: ["nucleus"],
      secretion: ["er", "golgi", "transport-vesicles"],
      "signal-meaning": ["golgi"],
      ifnar: ["membrane", "membrane-proteins"],
      isg: ["nucleus", "pore", "cytoplasm"]
    }[key];
    return dependencies == null ? null : [...(typeof dependencies === "function" ? dependencies() : dependencies)];
  }
  const phaseFocus = [entrySurface, hero, sensingOrigin, nuclearPore, golgi, receptorSite];
  let progress = 0, motion = 0, stageIndex = 0, labels = [], disposed = false;
  let ifnarAssembly=0, jakActivation=0, boundLigand=false, ifnarSeparation=.42, ifnarState="waiting-for-extracellular-ligand";
  function apply(p, micro = 0) {
    progress = clamp(Number.isFinite(p) ? p : 0, 0, 1);
    stageIndex = VIRAL_STAGES.reduce((best, s, i) => progress >= s.at ? i : best, 0);
    const entryT = smooth(0, 0.095, progress), transportT = smooth(0.16, 0.31, progress), decomposition = smooth(0.2, 0.31, progress), endosomalPosition = endosomePath.getPointAt(transportT);
    const externalWeight = 1 - smooth(0.08, 0.095, progress), internalWeight = smooth(0.125, 0.16, progress) * (1 - smooth(0.27, 0.315, progress));
    const takenPosition = progress < 0.11 ? outsideStart.clone().lerp(externalApproachEnd, entryT) : endosomalPosition;
    virus.position.copy(takenPosition);
    // Keep the removed cap facing the authored observer. A state handoff,
    // rather than a hidden motion through intact membrane, changes its pose.
    virus.quaternion.setFromUnitVectors(zAxis,progress<.11?uptakeViewDirection:zAxis);
    virus.rotateZ(.08*entryT);
    virus.scale.setScalar(1 - 0.34 * decomposition);
    visible(virus, Math.max(externalWeight, internalWeight));
    viralMembraneMaterial.opacity = 1 - .76 * decomposition;
    viralCoreMaterial.opacity = 1 - .75 * decomposition;
    visible(uptakeMembrane,progress<.14?1:0);
    visible(takenRNA, 1 - smooth(0.285, 0.31, progress));
    endosome.position.copy(endosomalPosition);
    endosome.scale.setScalar(1);
    // Retain the endosomal teaching state through its last interval. The next
    // scene is a separate conditional branch, not content escaping this lumen.
    visible(endosome, window(progress, 0.125, 0.16, 0.32, 0.335));
    visible(fragments, smooth(0.205, 0.255, progress));
    fragmentSeeds.forEach((s, i) => {
      v.copy(s.direction).multiplyScalar((.09+.28*decomposition)*s.spread);
      // All fragments remain inside the .53 lumen; their front-half spacing
      // makes the opaque compartment legible rather than hiding them at back.
      v.z=.18+.045*Math.sin(s.phase);
      v.x+=.008*Math.sin(micro*.4+s.phase);
      place(fragments, i, v, s.radius * (1 - 0.4 * decomposition), null, i % 2 ? "#a582ae" : "#c39372");
    });
    fragments.instanceMatrix.needsUpdate = true;
    // A declared branch cut at .32: its input RNA already exists in cytosol.
    // Fading in after the authored boundary left no focus actor or explanation.
    visible(sensing, progress < 0.32 ? 0 : 1 - smooth(0.57, 0.62, progress));
    cytRNA.scale.setScalar(0.88 + 0.12 * smooth(0.32, 0.39, progress));
    rig.rotation.z = -0.12 + 0.18 * smooth(0.35, 0.43, progress);
    const cardExposure=smooth(.337,.378,progress);rigCards.position.set(.025,-.12-.13*cardExposure,.05+.10*cardExposure);rigCards.rotation.z=-.25*cardExposure;
    mavs.scale.setScalar(0.88 + 0.12 * smooth(0.38, 0.46, progress));
    visible(mavsAssembly,smooth(.386,.427,progress));
    visible(downstream,window(progress,.434,.446,.49,.507));
    const phosphorylation=smooth(.457,.486,progress);irfSubstrate.position.set(.10*(1-phosphorylation),0,.32-.15*phosphorylation);
    for(let i=0;i<2;i++){v.copy(irfSubstrate.position);v.x+=i?.055:-.035;v.y-=.035;v.z+=.035;place(irfPhosphates,i,v,.15+.85*phosphorylation);}irfPhosphates.instanceMatrix.needsUpdate=true;
    visible(irfPhosphates,smooth(.461,.480,progress));
    rigOrder.set(window(progress, 0.37, 0.4, 0.48, 0.52), (progress * 9 + micro * 0.1) % 1);
    const tf = smooth(0.49, 0.615, progress);
    irf.position.copy(irfPath.getPointAt(tf));
    irf.rotation.set(0, tf * 0.8, tf * 0.3);
    visible(irf, window(progress, 0.48, 0.5, 0.615, 0.645));
    irfOrder.set(window(progress, 0.475, 0.5, 0.61, 0.65), (progress * 5.8 + micro * 0.08) % 1);
    visible(transcription, window(progress, 0.55, 0.59, 0.73, 0.77));
    nascentRNA.scale.setScalar(0.1 + 0.9 * smooth(0.565, 0.635, progress));
    transcription.scale.setScalar(0.88 + 0.12 * smooth(0.55, 0.6, progress));
    const hostExport = smooth(0.635, 0.666, progress);
    hostTranscript.position.copy(hostTranscriptPath.getPointAt(hostExport));
    hostTranscript.rotation.set(0, hostExport * 0.35, hostExport * 0.18);
    visible(hostTranscript, window(progress, 0.629, 0.641, 0.667, 0.680));
    visible(secretion, window(progress, 0.65, 0.67, 0.81, 0.85));
    vesicle.position.copy(secretoryCarrierPath.getPointAt(smooth(.733,.782,progress)));
    visible(vesicle,window(progress,.724,.738,.783,.795));
    vesicle.rotation.set(0, progress * 0.9, progress * 0.4);
    production.update(progress);
    // The release state is fully available at .815 while the preceding local
    // open-pore excerpt still exists, so focus never falls back to whole cell.
    visible(extracellular, window(progress, 0.805, 0.815, 0.96, 1.01));
    const auto = smooth(0.835, 0.89, progress), autoPosition = autocrinePath.getPointAt(auto);
    releaseSeeds.forEach((s, i) => {
      const position = (progress < 0.835 ? outsideIFN : autoPosition).clone().addScaledVector(s, (1 - auto) * 0.8 + 0.06);
      place(extracellular, i, position, 0.055 + 0.016 * (i % 3));
    });
    extracellular.instanceMatrix.needsUpdate = true;
    visible(receptor, window(progress, 0.81, 0.835, 1.1, 1.2));
    // The selected ligand docks extracellularly, then both membrane subunits
    // approach over a finite, sampled membrane path. No independent clock.
    ifnarAssembly=smooth(.868,.885,progress);positionSubunit(ifnar1,ifnarAssembly);positionSubunit(ifnar2,ifnarAssembly);
    ifnarSeparation=ifnar1.root.position.distanceTo(ifnar2.root.position);
    receptor.updateMatrixWorld(true);
    const dockingWorld=ifnar2.root.localToWorld(new THREE.Vector3(-.045,0,.27));
    const approachWorld=autocrinePath.getPointAt(smooth(.835,.86,progress)),dock=smooth(.86,.867,progress);
    boundIFN.position.copy(approachWorld.lerp(dockingWorld,dock).applyMatrix4(receptorInverse));
    visible(boundIFN,smooth(.835,.85,progress));
    boundLigand=progress>=.867;jakActivation=smooth(.885,.910,progress);
    ifnarState=progress<.86?"waiting-for-extracellular-ligand":progress<.867?"ligand-approaching-IFNAR2":progress<.868?"ligand-docked-to-IFNAR2":progress<.885?"ligand-induced-subunit-assembly":jakActivation<1?"assembled-JAK-activating":"assembled-JAK-active";
    jak.scale.setScalar(.82+.18*jakActivation);jak.rotation.z=.09*jakActivation;
    jakMat.color.copy(inactiveJAK).lerp(activeJAK,jakActivation);jakMat.emissive.copy(jakMat.color);
    for(const binding of displayBindings.get(jak)??[]){binding.display.color.copy(jakMat.color);binding.display.emissive.copy(jakMat.emissive);}
    visible(statAtReceptor,window(progress,.883,.891,.916,.926));
    visible(statPhosphates,window(progress,.892,.908,.919,.930));

    const st = smooth(0.915, 0.963, progress);
    stat.position.copy(statPath.getPointAt(st));
    stat.rotation.set(0, st * 0.7, st * 0.4);
    visible(stat, window(progress, 0.911, 0.919, 0.962, 0.976));
    statOrder.set(window(progress, 0.88, 0.905, 0.98, 1.03)*smooth(.885,.895,progress), (progress * 6.4 + micro * 0.08) % 1);
    visible(isgTranscription,window(progress,.957,.964,1.01,1.04));
    isgRNA.scale.setScalar(.12+.88*smooth(.962,.984,progress));
    visible(products, smooth(0.979, 0.985, progress));
    products.scale.setScalar(0.65 + 0.35 * smooth(0.981, 1, progress));
    const definitions = [
      [{ id: "virus", text: progress < 0.11 ? "胞外颗粒：摄取不等于感染" : "已内化颗粒状态", position: takenPosition.clone().add(new THREE.Vector3(0, 0.58, 0)), visible: Math.max(externalWeight, internalWeight) > 0.02 }, { id: "entry", text: "关键帧交接：膜内陷与裂分未模拟", position: entrySurface.clone().add(new THREE.Vector3(0.2, 0.45, 0)) }],
      [{ id: "endosome", text: "内体运输与组分分解", position: endosomalPosition.clone().add(new THREE.Vector3(0, 0.7, 0)) }, { id: "no-leak", text: "不表示内体内容物自动漏入胞质", position: endosomalPosition.clone().add(new THREE.Vector3(0.1, -0.62, 0)) }],
      [{ id: "conditional-rna", text: "独立条件支路：RNA 已在胞质", position: sensingOrigin.clone().add(new THREE.Vector3(-0.25, 0.56, 0.05)) }, { id: "mavs", text: "RIG-I → MAVS（外膜胞质侧）", position: mavsSite.clone().addScaledVector(mavsNormal, 0.52) }],
      [{ id: "irf3", text: "IRF3 入核；贯通核孔通道示意", position: nuclearPore.clone().add(new THREE.Vector3(0.3, 0.4, 0.14)) }, { id: "ifnb1", text: "核内 IFNB1 转录（教学投影）", position: geneDisplay.clone().add(new THREE.Vector3(0, 0.5, 0.08)) }],
      [{ id: "secretion", text: responseTeachingState(progress).title, position: (progress<.693?erExportCarrierSite:progress<.728?golgiExportCarrierSite:progress<.785?vesicle.position:exportSurface).clone().add(new THREE.Vector3(0, 0.48, 0.1)) }, { id: "signal-meaning", text: "宿主 IFN-β：腔内合成 → 分泌 → 胞外信号", position: golgi.clone().add(new THREE.Vector3(0.2, -0.52, 0.2)) }],
      [{ id: "ifnar", text: progress<.86?"IFNAR1/2：等待胞外IFN-β":progress<.868?"IFN-β接合IFNAR2":progress<.885?"配体诱导IFNAR1/2靠拢组装":progress<.91?"已结合：胞质侧JAK激活":"稳定结合态 → JAK–STAT", position: receptorSite.clone().add(new THREE.Vector3(-0.4, 0.6, 0.1)) }, { id: "isg", text: "STAT1/STAT2–IRF9 → ISG 应答", position: nuclearPore.clone().add(new THREE.Vector3(0.1, 0.4, 0.1)) }]
    ];
    labels = definitions[stageIndex].map((l) => ({ ...l, visible: l.visible ?? true }));
    applyDisplayWeights();
    group.updateMatrixWorld(true);
  }
  function setProgress(p, { seek: seek2 = false } = {}) {
    if (disposed) return;
    if (seek2) motion = 0;
    apply(p, motion);
  }
  function seek(p) {
    setProgress(p, { seek: true });
  }
  function resetTime(value = 0) {
    if (disposed) return;
    motion = Number.isFinite(value) ? Math.max(0, value) : 0;
    apply(progress, motion);
  }
  function update(_time, dt = 0) {
    if (disposed || !(dt > 0)) return;
    motion += Math.min(dt, 0.1);
    apply(progress, motion);
  }
  function getFocus() {
    return phaseFocus[stageIndex].clone();
  }
  function getLabelState() {
    return labels.map((l) => ({ ...l, position: l.position.clone() }));
  }
  const getTeachingState=()=>responseTeachingState(progress);
  const getTeachingSteps=()=>VIRAL_RESPONSE_SUBSTEPS;
  function getDiagnostics() {
    const teaching=getTeachingState();
    return {
      progress,stageIndex,stageTitle:VIRAL_STAGES[stageIndex].title,durationSeconds:64,motionTime:motion,teachingOnly:true,
      teachingSubstep:teaching.key,teachingSubstepIndex:teaching.index,teachingSubstepCount:teaching.total,
      ifnarState,ifnarSeparation,ifnarAssembly,boundLigand,jakActivation,ifnarSite:ifnarSite.toArray(),ifnarNormal:ifnarNormal.toArray(),ifnarAssemblyDepicted:true,
      ifnarGeometryScope:'Two membrane-bound teaching subunits with finite lateral recruitment; no atomistic coordinates or measured kinetics',
      ifnarAnchorMethod:'One actual full-shell anchor ray, then 16 rest-pose local-triangle samples per subunit; no full-shell ray during apply/update',
      ifnarLocalTriangleCount:patchTriangles.length,ifnarMaxDesignedLateralTravel:.132,
      displayTransition:'Per-renderable opacity multiplied by inherited parent/child weights; independent cloned materials',
      timeSemantics:'setProgress preserves elapsed micro-motion; seek resets it; update advances only with positive dt',
      localUptakeNeckAndScissionDepicted:false,localSecretoryFusionPoreDepicted:true,
      displayedUptake:'External approach then already-internalized keyframe; no displayed membrane-crossing trajectory',
      displayedSecretion:'ER translation/translocation cutaway; Golgi lumen cutaway; cytoplasmic carrier; continuous omega-shaped open exocytosis pore; extracellular IFN',
      legacyGuidePathsNotTraversed:true,secretoryCarrierPathTraversed:true,
      uptakeState:progress<.095?'external':progress<.125?'omitted-membrane-event':'internalized',
      secretoryState:progress<.65?'not-started':progress<.668?'host-mRNA-export':progress<.693?'ER-translation':progress<.728?'Golgi-processing':progress<.785?'Golgi-exported':progress<.815?'open-exocytosis-pore':'released-state',
      production:production.diagnostics(),
      endosomalPresentation:'Opaque cutaway membrane with inner face and closed cut rim; not a transparent nested bubble',
      uptakeViewDirection:uptakeViewDirection.toArray(),endosomalViewDirection:[.06,.08,1],
      uptakeMembranePresentation:'Opaque curved bilayer patch at actual host surface anchor; generic embedded domains; omitted internalization remains an explicit state handoff',
      mavsAssemblySchematic:true,tbk1DownstreamExcerpt:true,tbk1DirectMAVSBindingClaim:false,phosphorylationMarkersAreAttachedStateSymbols:true,
      statTransitIdentity:'STAT1/STAT2 nuclear-entry teaching group; IRF9 is shown at nuclear DNA; no universal preassembled cytosolic ISGF3 claim',
      nuclearTransportScale:transportScale,statTransportScale,hostTranscriptScale,poreClearRadius,poreIndex:selectedPore.site.id,
      nuclearCenter:nuclearCenter.toArray(),geneDisplay:geneDisplay.toArray(),mavsAnchoredByActualRaycast:true,
      mavsRetainedClipDistances:selectedMavs.clipDistances,mavsCandidateCount:mavsCandidates.length,
      nuclearPoreRetainedClipDistances:visibleClipDistances(nuclearEnvelope,nuclearPore),effectiveReplicationShown:false,endosomalEscapeDepicted:false,
      cytosolicRNACondition:'Recognizable RNA is already in cytosol; independent conditional branch',signalIndicatorMeaning:group.userData.signalIndicatorMeaning,
      nuclearTranscriptionIdentity:'Nuclear-interior teaching projection; actual perforated atlas envelope, not a measured molecular transport trajectory',
      nuclearPore:nuclearPore.toArray(),nuclearPoreDirection:nuclearPoreDirection.toArray(),mavsSite:mavsSite.toArray(),mavsNormal:mavsNormal.toArray(),
      tbk1Site:tbk1Site.toArray(),exportSurface:exportSurface.toArray(),exportNormal:exportDirection.toArray(),sources:SOURCES,visibleLabels:labels.filter(l=>l.visible).map(l=>l.id)
    };
  }
  function dispose() {
    if (disposed) return;
    disposed = true;
    for (const g of geometries) g.dispose();
    for (const m of materials) m.dispose();
    texture.dispose();
    displayBindings.clear();
    scenarioBindings.clear();
    group.clear();
  }
  let triangles = 0, meshCalls = 0, lineCalls = 0, instanceCount = 0;
  group.traverse((o) => {
    if (o.isMesh) {
      meshCalls++;
      triangles += (o.geometry.index?.count ?? o.geometry.attributes.position.count) / 3 * (o.isInstancedMesh ? o.count : 1);
      if (o.isInstancedMesh) instanceCount += o.count;
    } else if (o.isLine) lineCalls++;
  });
  const stats = { triangles, meshCalls, lineCalls, instances: instanceCount, durationSeconds: 64, teachingOnly: true, description: "Maximum allocated geometry including hidden stages; single-pass counts exclude renderer/postprocess passes." };
  seek(0);
  return { group, setProgress, seek, resetTime, update, getFocus, getLabelState, getTeachingState, getTeachingSteps, getObjectVisibilityDependencies, getVisibilityBindings, getLabelVisibilityDependencies, getDiagnostics, dispose, stats, debug: { actualOuter, nuclearEnvelope, nuclearNPC, selectedPoreSite: selectedPore.site, entryPath, externalApproachEnd, erExportCarrierSite, golgiExportCarrierSite, irfPath, statPath, processingPath, releasePath, secretoryCarrierPath, autocrinePath, hostTranscriptPath, nuclearPore, nuclearPoreDirection, poreTangent, poreBitangent, poreClearRadius, entrySurface, uptakeViewDirection, endosome, virus, uptakeMembrane, exportSurface, receptorSite, ifnarSite, ifnarNormal, ifnar1:ifnar1.root, ifnar2:ifnar2.root, ifnarBoundLigand:boundIFN, ifnarPatchSamples:[ifnar1.samples,ifnar2.samples], mavsSite, mavsNormal, tbk1Site, geneDisplay } };
}
export {
  VIRAL_STAGES,
  createViralAtlas
};
