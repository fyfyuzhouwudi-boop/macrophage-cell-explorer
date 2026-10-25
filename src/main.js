import * as THREE from "three";
import { OrbitControls } from "three/addons/controls/OrbitControls.js";
import { RoomEnvironment } from "three/addons/environments/RoomEnvironment.js";
import { EffectComposer } from "three/addons/postprocessing/EffectComposer.js";
import { RenderPass } from "three/addons/postprocessing/RenderPass.js";
import { AnatomyAOPass } from "./atlas-ao.js";
import { OutputPass } from "three/addons/postprocessing/OutputPass.js";
import { SavePass } from "three/addons/postprocessing/SavePass.js";
import { ShaderPass } from "three/addons/postprocessing/ShaderPass.js";
import { createOrganelle, ORGANELLE_IDS } from "./organelle-models.js";
import { createFusionLab, FUSION_IDS, FUSION_CATALOG } from "./fusion-lab.js";
import { createDetailLearningControls } from "./detail-learning-controls.js";
import { createExhibitionLayout } from "./exhibition-layout.js";
import { createMolecularModel, MOLECULAR_IDS, MOLECULAR_CATALOG } from "./molecular-models.js";
import { createMembranePatch } from "./membrane-patch.js";
import {createCellSurfacePatch,CELL_SURFACE_PATCH_ID,CELL_SURFACE_PATCH_GUIDE} from "./cell-surface-patch.js";
import { STRUCTURE_GUIDE as LEGACY_STRUCTURE_GUIDE, SCENARIO_GUIDE as LEGACY_SCENARIO_GUIDE } from "./structure-guide.js";
import { createSteadyAtlas, STEADY_TOPICS, STEADY_GUIDE } from "./steady-atlas.js";
import { createSteadyLessonControls } from "./steady-lesson-controls.js";
const SCENARIO_GUIDE={...LEGACY_SCENARIO_GUIDE,structure:STEADY_GUIDE,get clearance(){return UPTAKE_GUIDES[state.uptakeCase??"particle-phagocytosis"];},get virus(){return {...LEGACY_SCENARIO_GUIDE.virus,steps:viralPhases.map(({name,desc})=>({title:name,desc}))};}};
const STRUCTURE_GUIDE={...LEGACY_STRUCTURE_GUIDE,
[CELL_SURFACE_PATCH_ID]:CELL_SURFACE_PATCH_GUIDE,
"membrane-patch":{title:"柔软膜褶皱局部",function:"一个连续折返的薄扁囊围成水性腔室，膜壁把腔内与外侧胞质分开。两个通用跨膜位置符号展示内外朝向及受限横向活动。",location:"作为内质网膜局部的教学放大，不是整个ER网络，也不是细胞表面的微绒毛。",partners:["内质网薄腔","膜蛋白的两侧结构域"],features:[{name:"连续薄膜与折返",parts:["membrane-patch"],function:"三段宽薄面由弯曲边缘接成同一扁囊，内外边界面围成一层有厚度的膜壁。",visible:true,views:["ordinary"],location:"膜壁分隔胞质侧与腔侧水相。",partners:["水性薄腔"]},{name:"通用跨膜位置符号",parts:["membrane-patch","membrane-proteins"],function:"非球形示意保持嵌膜与两侧朝向，播放后可见不同相位的受限横向活动。",visible:true,views:["ordinary"],location:"薄膜表面，沿曲面切向移动。",partners:["局部膜面"],note:"不指认某个特定蛋白，不是原子结构或实测扩散轨迹。"}],note:"程序化连续薄膜构象，色彩、形状和速度为教学放大；薄腔与疏水膜壁不是同一空间。",sources:[{title:"Alberts 等｜The Endoplasmic Reticulum",url:"https://www.ncbi.nlm.nih.gov/books/NBK26841/"},{title:"Cooper｜The Endoplasmic Reticulum",url:"https://www.ncbi.nlm.nih.gov/books/NBK9889/"}]},
 "tubulin-structure":{title:"α/β 微管蛋白 · 1JFF",function:"α/β微管蛋白异二聚体是微管的组成单元。本例观察两条蛋白链的坐标派生粗化Cα折叠骨架。",location:"对应微管管壁的蛋白单元；本坐标来自牛同源样品，不是该巨噬细胞的原位观测。",partners:["微管聚合体","与微管协作的马达与调控蛋白"],features:[{name:"α/β 两链骨架",function:"两种颜色区分已有坐标的Cα轨迹。",location:"PDB 1JFF的A/B链。",partners:["α链与β链"],visible:true,views:["ordinary"]},{name:"未解析区段与展示分段",function:"未解析的区段不补全；编号跳变或坐标距离过大时也分段显示，编号不连续本身不等于实际缺失。",visible:false,views:["ordinary"]}],note:"来源为锌诱导、紫杉醇稳定片层的电子晶体学结构（3.5Å），不是完整天然微管格。粗管表示Cα轨迹的显示厚度，不是原子表面或二级结构丝带；核苷酸、离子、紫杉醇等配体未显示。此实例独立归一化放大，不能按同屏大小比较真实尺寸。",sources:[{title:"PDB 1JFF · Tubulin",url:"https://www.rcsb.org/structure/1JFF"},{title:"RCSB PDB data policies · CC0",url:"https://www.rcsb.org/pages/policies"}]},
 "ribosome-structure":{title:"人80S核糖体 · 4UG0",function:"由核糖体RNA及蛋白质组成的翻译复合体；本例观察人80S公开坐标中的RNA/蛋白骨架。",location:"胞质中的核糖体结构实例；不是整胞内每颗示意核糖体的测量。",partners:["核糖体RNA","核糖体蛋白","本结构包含的tRNA"],features:[{name:"蛋白Cα与RNA P轨迹",function:"按链及亚基着色，显示不同成分的空间折叠与交错。",location:"4UG0观测坐标中的蛋白与RNA链。",partners:["60S与40S亚基","tRNA"],visible:true,views:["ordinary"]},{name:"未解析区段",function:"缺少的环及末端不补全，也不添加原结构没有提供的mRNA。",visible:false,views:["ordinary"]}],note:"人80S冷冻电镜平均分辨率3.6Å，EMD-2938。显示经过量化和LOD简化的骨架轨迹，不是原子表面、化学键或该巨噬细胞原位电镜重建。此实例独立归一化放大，不能按同屏大小比较真实尺寸。",sources:[{title:"PDB 4UG0 · Human 80S ribosome",url:"https://www.rcsb.org/structure/4UG0"},{title:"EMDB EMD-2938",url:"https://www.ebi.ac.uk/emdb/EMD-2938"}]}
};
import { createAtlasAnnotations } from "./atlas-annotations.js";
import { createAtlasVisibility } from "./atlas-visibility.js";
import { applyAtlasMaterials, restoreAtlasMaterials, ATLAS_MATERIAL_PRESETS } from "./atlas-materials.js";
import {createAtlasSurfaceDetail} from "./atlas-surface-detail.js";
import {createAtlasFocusDOF} from "./atlas-focus-dof.js";
import {createReactionFocus} from "./reaction-focus.js";
import {createSurfaceActivityControls} from "./surface-activity-controls.js";
import {createCytoskeletonNetwork,CYTOSKELETON_SOURCES} from "./cytoskeleton-network.js";
import {createCytoplasmMotion} from "./cytoplasm-motion.js";
import {fitSmoothEROverview} from "./ser-overview-framing.js";
import {createExplorationControls} from "./exploration-controls.js";
import { createWholeAtlas } from "./whole-atlas.js";
import { createViralAtlas, VIRAL_STAGES } from "./viral-atlas.js";
import { createViralEntrySequence } from "./viral-entry-sequence.js";
import { createClassroomOverlay } from "./classroom-overlay.js";
import {createOrganelleContentOverlay} from './organelle-content-overlay.js';
import { getResponseLesson } from "./classroom-response.js";
import {createUptakeControls} from "./uptake-controls.js";
import {UPTAKE_GUIDES} from "./uptake-guide.js";
import membraneURL from "../assets/membrane-height.png";
import erURL from "../assets/er-albedo.png";
import nuclearURL from "../assets/nuclear-albedo.png";
import cargoURL from "../assets/cargo-albedo.png";
import playIcon from "@phosphor-icons/core/assets/regular/play.svg";
import pauseIcon from "@phosphor-icons/core/assets/regular/pause.svg";
import arrowIcon from "@phosphor-icons/core/assets/regular/caret-right.svg";
import backIcon from "@phosphor-icons/core/assets/regular/arrow-left.svg";
import resetIcon from "@phosphor-icons/core/assets/regular/arrow-counter-clockwise.svg";
import helpIcon from "@phosphor-icons/core/assets/regular/question.svg";
import expandIcon from "@phosphor-icons/core/assets/regular/corners-out.svg";
import closeIcon from "@phosphor-icons/core/assets/regular/x.svg";
const $ = (id) => document.getElementById(id), icons = { play: playIcon, pause: pauseIcon, arrow: arrowIcon, back: backIcon, reset: resetIcon, help: helpIcon, expand: expandIcon, close: closeIcon };
const icon = (id) => (icons[id] ?? icons.play).replace("<svg ", '<svg aria-hidden="true" focusable="false" ');
document.querySelectorAll("[data-icon]").forEach((el) => el.innerHTML = icon(el.dataset.icon));
const catalog = {
  nucleus: { name: "细胞核", color: "#8572a9", summary: "双层核膜围成的遗传信息中心。打开剖面，观察核孔、染色质与核仁。" },
  er: { name: "内质网", color: "#72a2b7", summary: "粗面片层附有核糖体，光面分支管网不附核糖体。两域共用连续的内质网腔。" },
  golgi: { name: "高尔基体", color: "#e2a09b", summary: "层叠扁囊中的加工与分选站。剖开薄囊，观察出芽与运输囊泡。" },
  mitochondria: { name: "线粒体", color: "#d69262", summary: "双层膜包围的能量转换系统。进入基质，观察嵴膜和嵴颈。" },
  lysosome: { name: "溶酶体", color: "#a687b7", summary: "膜围成的降解腔。内部含水解酶和不同阶段的异质残余；形态可与成熟内体重叠。" },
  endosome: { name: "内体", color: "#779eab", summary: "内吞货物的分选区室。本例展示囊域与连续分选小管，腔内保留少量小囊泡。" },
  membrane: { name: "细胞膜", color: "#a0bcc8", summary: "磷脂双层边界。放大观察 FcγRIIA 结合和 P2X7 的 ATP 门控代表示例。" },
  cytoskeleton: { name: "细胞骨架", color: "#c8b688", summary: "微管、肌动蛋白与马达组成的动态网络。沿空心微管进入局部结构。" },
  pore: { name: "核孔复合体", color: "#998cba", summary: "贯通核内外的蛋白质通道。观察八重复支架与孔道的空间结构。" },
  phagosome: { name: "吞噬体", color: "#e3aa56", summary: "细胞膜包围摄取物形成的独立膜室。进入腔内，观察颗粒与成熟过程。" },
  peroxisome: { name: "过氧化物酶体", color: "#95aa83", summary: "参与氧化代谢的单膜细胞器。椭球内分布细颗粒酶基质，不设通用晶核。" },
  ribosome: { name: "核糖体", color: "#c6a2a7", summary: "没有膜包围的翻译复合体。探索大、小亚基之间的空间与RNA链。" }
};
Object.assign(catalog,MOLECULAR_CATALOG);
Object.assign(catalog,FUSION_CATALOG);
catalog["membrane-patch"]={name:"柔软膜褶皱局部",color:"#9cb7bd",summary:STRUCTURE_GUIDE["membrane-patch"].function};
catalog[CELL_SURFACE_PATCH_ID]={name:"微绒毛与膜活动",color:"#8eafb5",summary:CELL_SURFACE_PATCH_GUIDE.function};
const LOCAL_IDS=[...MOLECULAR_IDS,...FUSION_IDS,"membrane-patch",CELL_SURFACE_PATCH_ID];
const EXPLORABLE_IDS=[...ORGANELLE_IDS,...LOCAL_IDS];
STRUCTURE_GUIDE.cytoskeleton={...STRUCTURE_GUIDE.cytoskeleton,sources:CYTOSKELETON_SOURCES};
const phases = [{ name: "吞噬", at: 0, desc: "细胞膜包围颗粒，形成独立的吞噬体。" }, { name: "成熟", at: 0.38, desc: "吞噬体向细胞内部运输，与内体和溶酶体交换组分。" }, { name: "降解", at: 0.78, desc: "在膜围成的腔内，材料逐渐被水解酶分解。" }];
const viralPhases = VIRAL_STAGES.map((stage,index) => ({ name: index===5?"自分泌 IFN 与基因应答":stage.title, at: stage.at, desc: index===5?"此例选择本细胞分泌的胞外 IFN-β 返回同一细胞：接合 IFNAR2，招募 IFNAR1 形成有限组装教学状态，再显示胞质 JAK 激活及 STAT / ISG 应答。距离与速度为教学放大，不表示所有病毒均被清除。":stage.desc }));
const state = { view: "whole", selected: null, level: "whole", playing: false, speed: 1, section: 0.60, progress: 0, scenario: "structure", steadyTopic:0,steadyOverview:false, viralLesson:"entry", quality: "high", ambientTime:0, micro: false, patchSurface: false, following: false, viralFocused:false, viralFocusLabelId:null, connectedER: false, cameraHome: true, ready: false, time: 0 };
let visibility=null,uptakeControls=null,reactionFocus=null,surfaceActivity=null,cytoskeletonNetwork=null,cytoplasmMotion=null,explorationControls=null,learningControls=null,exhibitionLayout=null,classroomOverlay=null,contentOverlay=null,steadyControls=null;
let steadyLessonActive=false,steadyWholePose=null;
const viralBoundaryNote=document.createElement("p");viralBoundaryNote.id="viral-boundary-note";viralBoundaryNote.className="process-boundary-note uptake-omission";viralBoundaryNote.hidden=true;$("phase-list").insertAdjacentElement("afterend",viralBoundaryNote);
const viralBoundaryText=["胞外与已内化为分段状态；内陷与裂分省略。","内体腔内处理；此处不连接到胞质RNA。","独立条件：可识别RNA已经位于胞质；随后示意 MAVS / 下游激酶激活。","宿主 IRF3 经核孔入核，参与 IFNB1 转录；不运输病毒颗粒。","观察 mRNA 输出、ER 翻译、Golgi 腔内货物、运输与胞吐的局部教学视图；室间出芽与融合仍有省略。","自分泌示例：IFNAR 组装 → JAK / STAT 激活 → STAT 入核 → ISG 转录与产物。"];
const visibilityReturnWaiters=[];
let materialPreset = "exhibition", surfaceDetail=null;
function configureMaterialGroup(group) {
  const result=materialPreset === "original" ? restoreAtlasMaterials(group) : applyAtlasMaterials(group, { preset: materialPreset });
  surfaceDetail?.apply(group);
  return result;
}
function setMaterialPreset(preset) {
  if (preset !== "original" && !Object.hasOwn(ATLAS_MATERIAL_PRESETS, preset)) throw new RangeError("Unknown material preset");
  materialPreset = preset;
  for (const group of [whole.group, viral.group, ...(uptakeControls?.model?[uptakeControls.model.group]:[]), ...Array.from(detailCache.values(), (model) => model.group)]) configureMaterialGroup(group);
  requestRender();
}
let needsRender = true, renderedFrames = 0, skippedFrames = 0, lastRenderAt = 0;
function requestRender() {
  needsRender = true;
}
const errors = [];
window.addEventListener("error", (e) => errors.push(e.message));
window.addEventListener("unhandledrejection", (e) => errors.push(String(e.reason)));
const scene = new THREE.Scene();
scene.background = new THREE.Color(3.9, 4.05, 4.3);
function createRenderer() {
  try {
    return new THREE.WebGLRenderer({ antialias: true, alpha: false, powerPreference: "high-performance" });
  } catch (error) {
    $("loader").replaceChildren();
    const title = document.createElement("h2"), note = document.createElement("p");
    title.textContent = "三维画面未能启动";
    note.textContent = "此浏览器的 WebGL 未启用。请在支持硬件加速的 Edge 或 Chrome 中重新打开此文件。";
    $("loader").append(title, note);
    throw error;
  }
}
const renderer = createRenderer();
renderer.setClearColor("#f8f9fc");
renderer.setPixelRatio(Math.min(devicePixelRatio, 1.5));
renderer.localClippingEnabled = true;
renderer.outputColorSpace = THREE.SRGBColorSpace;
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 0.98;
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFShadowMap;
$("scene").append(renderer.domElement);
renderer.domElement.addEventListener("webglcontextrestored", requestRender);
const camera = new THREE.PerspectiveCamera(36, 1, 0.03, 100);
const controls = new OrbitControls(camera, renderer.domElement);
controls.enableDamping = true;
controls.dampingFactor = 0.1;
controls.enablePan = false;
controls.maxDistance = 65;
controls.addEventListener("change", requestRender);
const pmrem = new THREE.PMREMGenerator(renderer), room = new RoomEnvironment();
scene.environment = pmrem.fromScene(room, 0.06).texture;
scene.environmentIntensity = 0.42;
room.dispose();
pmrem.dispose();
scene.add(new THREE.HemisphereLight("#ffffff", "#c0cdd5", 0.58));
const key = new THREE.DirectionalLight("#fff8ef", 2.6);
key.position.set(-8, 13, 14);
key.castShadow = true;
key.shadow.mapSize.set(2048, 2048);
Object.assign(key.shadow.camera, { left: -9, right: 9, top: 10, bottom: -10, near: 0.1, far: 55 });
key.shadow.bias = -2e-4;
key.shadow.normalBias = 8e-3;
key.shadow.radius = 3;
scene.add(key);
const fill = new THREE.DirectionalLight("#dcecf7", 0.65);
fill.position.set(9, 4, 8);
scene.add(fill);
const rim = new THREE.DirectionalLight("#ffdfbe", 0.85);
rim.position.set(4, -3, -7);
scene.add(rim);
const loader = new THREE.TextureLoader(), surfaceTextures = {}, textureReadiness = [];
for (const [key2, url] of Object.entries({ membrane: membraneURL, er: erURL, nuclear: nuclearURL, cargo: cargoURL })) {
  let texture;
  const ready = new Promise((resolve, reject) => {
    texture = loader.load(url, async (loaded) => {
      try {
        if (typeof loaded.image?.decode === "function") await loaded.image.decode();
        requestRender();
        resolve(loaded);
      } catch (error) {
        reject(error);
      }
    }, void 0, reject);
  });
  texture.colorSpace = THREE.NoColorSpace;
  texture.wrapS = texture.wrapT = THREE.RepeatWrapping;
  surfaceTextures[key2] = texture;
  textureReadiness.push({ key: key2, texture, ready });
}
const whole = createWholeAtlas({ createOrganelle, surfaceTextures });
scene.add(whole.group);
whole.group.updateWorldMatrix(true, true);
const boundaryMesh = whole.group.getObjectByName("ClosedOrganicMembraneWith36Pseudopods"), boundaryPositions = boundaryMesh.geometry.attributes.position, boundaryPoint = new THREE.Vector3();
let wholeFitRadius = 0;
for (let i = 0; i < boundaryPositions.count; i++) {
  boundaryPoint.fromBufferAttribute(boundaryPositions, i).applyMatrix4(boundaryMesh.matrixWorld);
  wholeFitRadius = Math.max(wholeFitRadius, boundaryPoint.length());
}
wholeFitRadius += 0.035;
whole.setSection(state.section);
function prepareShadows(group) {
  group.traverse((o) => {
    if (!o.isMesh) return;
    const mats = Array.isArray(o.material) ? o.material : [o.material];
    o.castShadow = mats.every((m) => m.userData?.castsAnatomyShadow !== false && (!m.transparent || m.opacity > 0.95) && (m.transmission ?? 0) < 0.1);
    o.receiveShadow = true;
    for (const m of mats) m.clipShadows = true;
  });
}
configureMaterialGroup(whole.group);
prepareShadows(whole.group);
whole.setProgress(0.38);
const steady=createSteadyAtlas({whole});
scene.add(steady.group);
for(const [id,parentId] of [["tubulin-structure","cytoskeleton"],["ribosome-structure","ribosome"],["membrane-patch","er"],[CELL_SURFACE_PATCH_ID,"membrane"],["snare-fusion","lysosome"],["ha-fusion","endosome"]]){const site=whole.organelleLocations.get(parentId);whole.organelleLocations.set(id,{position:site.position.clone(),radius:.35,label:catalog[id].name});}
const viral = createViralAtlas({ whole });
configureMaterialGroup(viral.group);
scene.add(viral.group);
viral.group.visible = false;
const viralEntry=createViralEntrySequence();
prepareShadows(viralEntry.group);
scene.add(viralEntry.group);
viralEntry.group.visible=false;
const isEntryLesson=()=>state.scenario==="virus"&&state.viralLesson==="entry"&&state.view==="whole";
const viralLessonSnapshots={entry:{progress:0,time:0,section:.78},response:{progress:0,time:0,section:.60}};
const isgPresentation={object:viral.group.getObjectByName("InducedISGAntiviralGeneProductsSchematic"),saved:null,planes:[new THREE.Plane(),new THREE.Plane(),new THREE.Plane(),new THREE.Plane(),new THREE.Plane(),new THREE.Plane()]};
function updateClassroomISGWindow(){
  const eligible=state.scenario==="virus"&&state.viralLesson==="response"&&state.view==="whole"&&state.userClearView&&state.viralFocusKind==="induced-products";
  const d=eligible?reactionFocus?.diagnostics():null,show=eligible&&reactionFocus?.isActive()&&d?.key==="induced-products";
  const object=isgPresentation.object,mats=Array.isArray(object.material)?object.material:[object.material];
  if(show){
    if(!isgPresentation.saved){isgPresentation.saved=mats.map(m=>m.clippingPlanes);for(const m of mats){m.clippingPlanes=isgPresentation.planes;m.needsUpdate=true;}}
    const matrix=new THREE.Matrix4(),center=new THREE.Vector3();
    object.getMatrixAt(d.representativeInstance,matrix);object.updateWorldMatrix(true,false);
    center.setFromMatrixPosition(matrix).applyMatrix4(object.matrixWorld);
    const r=.24,axes=[[1,0,0],[-1,0,0],[0,1,0],[0,-1,0],[0,0,1],[0,0,-1]];
    isgPresentation.planes.forEach((plane,i)=>{plane.normal.fromArray(axes[i]);plane.constant=r-plane.normal.dot(center);});
  }else if(isgPresentation.saved){mats.forEach((m,i)=>{m.clippingPlanes=isgPresentation.saved[i];m.needsUpdate=true;});isgPresentation.saved=null;}
}
const ground = new THREE.Mesh(new THREE.PlaneGeometry(70, 70), new THREE.ShadowMaterial({ opacity: 0.13, depthWrite: false }));
ground.name = "ExhibitionSoftShadow";
ground.rotation.x = -Math.PI / 2;
ground.position.y = -7.85;
ground.receiveShadow = true;
scene.add(ground);
const detailRoot = new THREE.Group();
detailRoot.visible = false;
detailRoot.name = "AtlasDetailWorldFrame";
scene.add(detailRoot);
let appliedWholeProgress = -1, appliedViralProgress = -1, active = null, activeId = null, transition = null, last = performance.now(), fpsWindow = [], phaseIndex = -1, hovered = null;
const detailCache = /* @__PURE__ */ new Map();
const detailBounds = /* @__PURE__ */ new WeakMap();
let navigation = null, inspection = null, pendingCommand = null, detailTime = 0, inspectionPlayChanged = false;
let navigationLast = { phase: "whole-idle" }, capturePass = null, blendPass = null, afterHandoffRender = null, pendingCaptureSize = null;
const textureScales = /* @__PURE__ */ new WeakMap();
function microTextureScale(enter) {
  if (!active) return;
  const seen = /* @__PURE__ */ new Set();
  active.group.traverse((o) => {
    for (const material of Array.isArray(o.material) ? o.material : [o.material]) {
      if (!material || material.userData?.membraneStaticV1) continue;
      for (const key2 of ["map", "bumpMap", "roughnessMap"]) {
        const tex = material[key2];
        if (!tex || seen.has(tex)) continue;
        seen.add(tex);
        if (!textureScales.has(tex)) textureScales.set(tex, tex.repeat.clone());
        tex.repeat.copy(textureScales.get(tex)).multiplyScalar(enter ? typeof enter === "number" ? enter : 28 : 1);
      }
    }
  });
}
const composer = new EffectComposer(renderer);
const beauty = new RenderPass(scene, camera);
composer.addPass(beauty);
const ao = new AnatomyAOPass(scene, camera, 1, 1, 24);
ao.kernelRadius = 0.62;
ao.minDistance = 15e-4;
ao.maxDistance = 0.25;
ao.enabled = true;
composer.addPass(ao);
const focusDOF=createAtlasFocusDOF({THREE:{Vector2:THREE.Vector2},ShaderPass,depthTexture:ao.normalRenderTarget.depthTexture});
composer.addPass(focusDOF.pass);
composer.addPass(new OutputPass());
const raycaster = new THREE.Raycaster(), mouse = new THREE.Vector2();
function measure() {
  const b = $("scene").getBoundingClientRect();
  return { width: b.width, height: b.height };
}
function clearOrbitMomentum() {
  const damping = controls.enableDamping;
  const position = camera.position.clone(), target = controls.target.clone(), zoom = camera.zoom;
  controls.enableDamping = false;
  controls.update();
  camera.position.copy(position);
  controls.target.copy(target);
  camera.zoom = zoom;
  camera.updateProjectionMatrix();
  controls.update();
  controls.enableDamping = damping;
}
function wholePose() {
  const {width,height}=measure(),direction=new THREE.Vector3(.22,-.32,1).normalize(),target=new THREE.Vector3(0,-.08,0);
  const right=new THREE.Vector3().crossVectors(new THREE.Vector3(0,1,0),direction).normalize(),up=new THREE.Vector3().crossVectors(direction,right),p=new THREE.Vector3();
  const tan=Math.tan(THREE.MathUtils.degToRad(camera.fov*.5)),side=Math.max(.5,1-54/width),top=Math.max(.45,1-218/height),bottom=Math.max(.50,1-216/height);
  let fit=0;
  boundaryMesh.updateWorldMatrix(true,false);
  for(let i=0;i<boundaryPositions.count;i++){
    p.fromBufferAttribute(boundaryPositions,i).applyMatrix4(boundaryMesh.matrixWorld).sub(target);
    const depth=p.dot(direction),vertical=p.dot(up);
    fit=Math.max(fit,depth+Math.abs(p.dot(right))/(tan*(width/height)*side),depth+Math.abs(vertical)/(tan*(vertical>=0?top:bottom)));
  }
  fit*=1.015;
  return {position:target.clone().addScaledVector(direction,fit),target,near:.04,far:110,minDistance:9,maxDistance:fit*2};
}
function currentPose() {
  return { position: camera.position.clone(), target: controls.target.clone(), near: camera.near, far: camera.far, minDistance: controls.minDistance, maxDistance: controls.maxDistance };
}
function poseSettings(pose) {
  camera.near = pose.near;
  camera.far = pose.far;
  controls.minDistance = pose.minDistance;
  controls.maxDistance = pose.maxDistance;
  camera.updateProjectionMatrix();
}
function applyPose(pose) {
  clearOrbitMomentum();
  poseSettings(pose);
  camera.position.copy(pose.position);
  controls.target.copy(pose.target);
  controls.update();
  requestRender();
}
function frameWhole() {
  state.cameraHome = true;
  applyPose(wholePose());
}
function activeScale() {
  active?.group.updateWorldMatrix(true, true);
  return active ? active.group.matrixWorld.getMaxScaleOnAxis() : 1;
}
function worldAnchor(key2) {
  active.group.updateWorldMatrix(true, true);
  return active.anchors[key2].clone().applyMatrix4(active.group.matrixWorld);
}
function computeDetailPose(direction = new THREE.Vector3(0.18, 0.13, 1)) {
  if(FUSION_IDS.includes(activeId)){
    const inside=state.level==="inside",position=worldAnchor(inside?"conformationCamera":"overviewCamera"),target=worldAnchor(inside?"conformationTarget":"overviewTarget"),scale=activeScale();
    return{position,target,near:Math.max(1e-5,.002*scale),far:110,minDistance:.12*scale,maxDistance:active.radius*scale*5};
  }
  if(activeId==="membrane"&&state.level==="inside"&&active.anchors.conformationCamera){
    const position=worldAnchor("conformationCamera"),target=worldAnchor("conformationTarget"),scale=activeScale(),distance=position.distanceTo(target);
    return{position,target,near:Math.max(1e-5,.002*scale),far:110,minDistance:distance*.06,maxDistance:active.radius*scale*4};
  }
  if(activeId === "membrane") direction=new THREE.Vector3().fromArray(active.group.userData.membraneViewDirections?.[state.level] ?? [0,-1.8,.95]);
  if(activeId === "membrane-patch") direction=new THREE.Vector3(1.3,1.6,1.5);
  if(activeId === CELL_SURFACE_PATCH_ID)direction=new THREE.Vector3(.75,-1.6,1.1);
  const scale = activeScale();
  if (state.connectedER && (state.erConnectionFocus || state.level === "inside")) {
    const focus=state.erConnectionFocus?"connection":"lumen";
    return {position:worldAnchor(focus+"Camera"),target:worldAnchor(focus+"Target"),near:Math.max(1e-5,1e-3*scale),far:110,minDistance:.025*scale,maxDistance:8*scale};
  }
  const bounds = new THREE.Box3().setFromObject(active.group), center = bounds.getCenter(new THREE.Vector3()), dir = direction.clone().transformDirection(active.group.matrixWorld), right = new THREE.Vector3().crossVectors(new THREE.Vector3(0, 1, 0), dir).normalize(), up = new THREE.Vector3().crossVectors(dir, right), { width, height } = measure();
  const verticalFraction = Math.max(0.55, (height - 150) / height), horizontalFraction = Math.max(0.65, (width - 100) / width), tan = Math.tan(THREE.MathUtils.degToRad(camera.fov * 0.5));
  // Perspective edge inequalities are linear in each vertex. Use the actual
  // transformed surface instead of a second world-axis-aligned box around it.
  // Small repeated instances use their conservative eight-corner bounds.
  let distance = 0;
  const point=new THREE.Vector3(),instance=new THREE.Matrix4(),world=new THREE.Matrix4();
  const include=()=>{point.sub(center);const depth=point.dot(dir);distance=Math.max(distance,depth+Math.abs(point.dot(up))/(tan*verticalFraction),depth+Math.abs(point.dot(right))/(tan*camera.aspect*horizontalFraction));};
  active.group.updateWorldMatrix(true,true);
  active.group.traverse(object=>{
    const positions=object.geometry?.attributes?.position;if(!positions)return;
    if(object.isInstancedMesh){
      object.geometry.computeBoundingBox();const box=object.geometry.boundingBox;
      for(let i=0;i<object.count;i++){object.getMatrixAt(i,instance);world.multiplyMatrices(object.matrixWorld,instance);for(const x of [box.min.x,box.max.x])for(const y of [box.min.y,box.max.y])for(const z of [box.min.z,box.max.z]){point.set(x,y,z).applyMatrix4(world);include();}}
    }else for(let i=0;i<positions.count;i++){point.fromBufferAttribute(positions,i).applyMatrix4(object.matrixWorld);include();}
  });
  distance *= 1.025;
  return { position: center.clone().addScaledVector(dir, distance), target: center, near: Math.max(1e-5, 4e-3 * scale), far: 110, minDistance: active.radius * scale * 0.15, maxDistance: Math.max(distance * 3, active.radius * scale * 8) };
}
function fitDetail(direction = new THREE.Vector3(0.18, 0.13, 1), animated = false) {
  if (!active) return;
  if (state.connectedER && state.level !== "surface") microTextureScale(6);
  const pose = computeDetailPose(direction);
  if (animated) animatePose(pose.position, pose.target, 0.65, { pose, arc: true });
  else applyPose(pose);
}
function resize() {
  requestRender();
  const { width, height } = measure();
  renderer.setSize(width, height);
  composer.setSize(width, height);
  focusDOF.resize(width,height,renderer.getPixelRatio());
  camera.aspect = width / height;
  camera.updateProjectionMatrix();
  if(steadyLessonActive)frameSteadyLesson();
  else if (isEntryLesson())applyPose(entryLessonPose());
  else if (state.view === "whole" && state.cameraHome) frameWhole();
}
function animatePose(position, target, duration = 0.95, options = {}) {
  clearOrbitMomentum();
  const from = currentPose(), destination = options.pose ?? { ...from, position: position.clone(), target: target.clone() };
  const offset = from.position.clone().sub(from.target), nextOffset = position.clone().sub(target);
  transition = { from: from.position, to: position.clone(), targetFrom: from.target, targetTo: target.clone(), elapsed: 0, duration, fromPose: from, destination, options, offset, nextOffset, rotation: new THREE.Quaternion().setFromUnitVectors(offset.clone().normalize(), nextOffset.clone().normalize()) };
  controls.minDistance = Math.min(from.minDistance, destination.minDistance, offset.length() * 0.01, nextOffset.length() * 0.01);
  controls.maxDistance = Math.max(from.maxDistance, destination.maxDistance, offset.length() * 2, nextOffset.length() * 2);
  state.cameraHome = false;
  requestRender();
}
function descendant(object, parent) {
  for (let node = object; node; node = node.parent) if (node === parent) return true;
  return false;
}
function loadDetail(id, connected) {
  const key2 = connected ? "er-connection" : id;
  let model = detailCache.get(key2);
  if (id === 'phagosome' && model) {
    surfaceDetail?.restore(model.group);
    visibility?.unregisterDetail(model);
    detailRoot.remove(model.group); detailBounds.delete(model); model.dispose();
    detailCache.delete(key2); model = null;
  }
  if (!model) {
    model = id === 'phagosome' ? whole.components.phagosome.createInspection({cloneMaterial:surfaceDetail?.cloneMaterial}) : FUSION_IDS.includes(id) ? createFusionLab({caseId:id,detail:true}) : id === CELL_SURFACE_PATCH_ID ? createCellSurfacePatch({detail:true}) : id === "membrane-patch" ? createMembranePatch({detail:true}) : MOLECULAR_IDS.includes(id) ? createMolecularModel(id,{detail:true}) : createOrganelle(id, { detail: true, connectedER: connected });
    if (connected) model.group.traverse((o) => {
      if (/Chromatin|Nucleolus|Nucleolar/.test(o.name)) o.visible = false;
    });
    model.group.updateMatrixWorld(true);
    detailBounds.set(model, new THREE.Box3().setFromObject(model.group));
    if(model.metadata?.guide){STRUCTURE_GUIDE[id]=model.metadata.guide;displayedGuide=null;}
    detailCache.set(key2, model);
    visibility?.registerDetail(model,{id,connectedER:connected});
    detailRoot.add(model.group);
    configureMaterialGroup(model.group);
    prepareShadows(model.group);
  }
  model.setObservationMode?.(false);
  model.setObservationFocus?.(null);
  for (const [name, item] of detailCache) item.group.visible = name === key2;
  return model;
}
function resolveWholeSource(id, hit, model, connected) {
  whole.group.updateWorldMatrix(true, true);
  const location = whole.organelleLocations.get(id), localBounds = detailBounds.get(model), localCenter = localBounds.getCenter(new THREE.Vector3()), localRadius = localBounds.getSize(new THREE.Vector3()).length() * 0.5;
  let carrier = null, matrix = new THREE.Matrix4(), sourceWorldMatrix = null, poreIndex = null, materialDomain = null, focus = location.position.clone(), radius = location.radius, kind = hit ? "semantic-world-frame" : "representative-world-frame", initialSection = 0;
  const rawHitMatrix = hit ? hit.object.matrixWorld.clone() : null;
  if (hit?.object.isInstancedMesh && Number.isInteger(hit.instanceId)) {
    const instance = new THREE.Matrix4();
    hit.object.getMatrixAt(hit.instanceId, instance);
    rawHitMatrix.multiply(instance);
  }
  if (id === 'phagosome' && model.metadata?.sameWholeInstanceSnapshot) {
    carrier = whole.components.phagosome.group;
    sourceWorldMatrix = carrier.matrixWorld.clone(); matrix.copy(sourceWorldMatrix);
    focus.copy(localCenter).applyMatrix4(matrix);
    radius = localRadius * matrix.getMaxScaleOnAxis();
    initialSection = model.initialSection;
    kind = 'actual-phagosome-snapshot';
  } else if (id === "pore") {
    let assembly = function(index) {
      const first = new THREE.Vector3(), middle = new THREE.Vector3(), last2 = new THREE.Vector3(), spoke = new THREE.Vector3(), all = [];
      let beadRadius = 0;
      for (let i = 0; i < 72; i++) {
        npc.getMatrixAt(index * 72 + i, instance);
        point.setFromMatrixPosition(instance);
        all.push(point.clone());
        beadRadius = Math.max(beadRadius, npc.geometry.boundingSphere.radius * instance.getMaxScaleOnAxis());
        if (i < 24) first.add(point);
        else if (i < 48) middle.add(point);
        else last2.add(point);
        if (i >= 24 && i < 27) spoke.add(point);
      }
      first.multiplyScalar(1 / 24);
      middle.multiplyScalar(1 / 24);
      last2.multiplyScalar(1 / 24);
      spoke.multiplyScalar(1 / 3);
      const center = first.clone().add(middle).add(last2).multiplyScalar(1 / 3), z = last2.clone().sub(first).normalize(), radialDirection = spoke.clone().sub(middle), x = radialDirection.addScaledVector(z, -radialDirection.dot(z)).normalize(), y = new THREE.Vector3().crossVectors(z, x).normalize();
      x.crossVectors(y, z).normalize();
      const local = new THREE.Matrix4().makeBasis(x, y, z);
      local.setPosition(center);
      let radial = 0;
      for (const p of all) {
        const offset = p.clone().sub(center);
        radial = Math.max(radial, offset.addScaledVector(z, -offset.dot(z)).length());
      }
      radial += beadRadius;
      return { local, center, radial, worldCenter: center.clone().applyMatrix4(npc.matrixWorld) };
    };
    const npc = whole.components.nucleus.component.group.getObjectByName("ThirtyTwoEightFoldNPCAssemblies"), instance = new THREE.Matrix4(), point = new THREE.Vector3();
    npc.updateWorldMatrix(true, false);
    npc.geometry.computeBoundingSphere();
    if (hit?.object === npc && Number.isInteger(hit.instanceId)) poreIndex = Math.floor(hit.instanceId / 72);
    else {
      let best = Infinity;
      for (let i = 0; i < 32; i++) {
        const distance = assembly(i).worldCenter.distanceToSquared(focus);
        if (distance < best) {
          best = distance;
          poreIndex = i;
        }
      }
    }
    const actual = assembly(poreIndex), localSize = localBounds.getSize(new THREE.Vector3()), factor = actual.radial / (Math.max(localSize.x, localSize.y) * 0.5);
    sourceWorldMatrix = npc.matrixWorld.clone().multiply(actual.local);
    matrix.copy(sourceWorldMatrix).multiply(new THREE.Matrix4().makeScale(factor, factor, factor));
    focus.copy(actual.worldCenter);
    radius = Math.max(0.04, actual.radial * npc.matrixWorld.getMaxScaleOnAxis() * 1.3);
    carrier = npc;
    kind = "actual-nuclear-pore";
  } else if (id === "nucleus" || id === "er" && connected) {
    carrier = whole.components.nucleus.holder;
    matrix.copy(carrier.matrixWorld);
    focus.copy(id === "er" ? hit ? hit.point : model.anchors.connection.clone().applyMatrix4(matrix) : carrier.getWorldPosition(new THREE.Vector3()));
    radius = (id === "nucleus" ? 1.5 : 0.85) * matrix.getMaxScaleOnAxis();
    initialSection = id === "nucleus" ? whole.components.nucleus.component.group.userData.section : 0;
    kind = "actual-component-frame";
  } else if (id === "mitochondria") {
    const candidates = whole.components.mitochondria, selected = candidates.find((c) => hit && descendant(hit.object, c.holder)) ?? candidates.reduce((best, c) => c.holder.getWorldPosition(new THREE.Vector3()).distanceToSquared(focus) < best.holder.getWorldPosition(new THREE.Vector3()).distanceToSquared(focus) ? c : best);
    carrier = selected.holder;
    matrix.copy(carrier.matrixWorld);
    focus.copy(carrier.getWorldPosition(new THREE.Vector3()));
    radius = model.radius * matrix.getMaxScaleOnAxis();
    initialSection = selected.component.group.userData.section;
    kind = "actual-component-frame";
  } else if (hit?.object.name === "ClosedContinuousPhagolysosomeFusionMembrane") {
    carrier = hit.object;
    sourceWorldMatrix = carrier.matrixWorld.clone();
    const geometry = carrier.geometry, position = geometry.attributes.position, indices = geometry.index, materialIndex = hit.face.materialIndex, bounds = new THREE.Box3(), point = new THREE.Vector3();
    for (const region of geometry.groups) if (region.materialIndex === materialIndex) for (let i = region.start; i < region.start + region.count; i++) bounds.expandByPoint(point.fromBufferAttribute(position, indices.getX(i)));
    if (bounds.isEmpty()) throw new Error("Selected fusion membrane material domain is empty");
    const center = bounds.getCenter(new THREE.Vector3()), localRadius2 = Math.max(...bounds.getSize(new THREE.Vector3()).toArray()) * 0.5;
    matrix.copy(sourceWorldMatrix).multiply(new THREE.Matrix4().makeTranslation(center.x, center.y, center.z)).multiply(new THREE.Matrix4().makeScale(localRadius2 / 1.08, localRadius2 / 1.08, localRadius2 / 1.08));
    focus.copy(center).applyMatrix4(sourceWorldMatrix);
    radius = localRadius2 * sourceWorldMatrix.getMaxScaleOnAxis();
    materialDomain = { materialIndex, localMin: bounds.min.toArray(), localMax: bounds.max.toArray(), localCenter: center.toArray() };
    kind = "actual-shared-fusion-domain";
  } else {
    let vesicle = null;
    for (let node = hit?.object; node && node !== whole.group; node = node.parent) if (node.isGroup && node.children.some((o) => o.name === "VesicleMembrane" && o.userData.organelleId === id)) {
      vesicle = node;
      break;
    }
    if (!vesicle && ["lysosome", "endosome", "peroxisome", "phagosome"].includes(id)) vesicle = whole.group.children.filter((o) => o.isGroup && o.children.some((m) => m.name === "VesicleMembrane" && m.userData.organelleId === id)).sort((a, b) => a.getWorldPosition(new THREE.Vector3()).distanceToSquared(focus) - b.getWorldPosition(new THREE.Vector3()).distanceToSquared(focus))[0];
    if (vesicle) {
      carrier = vesicle;
      const wall = vesicle.getObjectByName("VesicleMembrane");
      matrix.copy(vesicle.matrixWorld).multiply(new THREE.Matrix4().makeScale(wall.scale.x / 1.08, wall.scale.y / 1.08, wall.scale.z / 1.08));
      focus.copy(vesicle.getWorldPosition(new THREE.Vector3()));
      radius = wall.scale.x * vesicle.matrixWorld.getMaxScaleOnAxis();
      kind = "actual-vesicle-frame";
    } else if (id === "ribosome" && hit?.object.isInstancedMesh) {
      carrier = hit.object;
      hit.object.geometry.computeBoundingSphere();
      const normalization = hit.object.geometry.boundingSphere.radius / localRadius;
      matrix.copy(rawHitMatrix).multiply(new THREE.Matrix4().makeScale(normalization, normalization, normalization)).multiply(new THREE.Matrix4().makeTranslation(-localCenter.x, -localCenter.y, -localCenter.z));
      focus.setFromMatrixPosition(rawHitMatrix);
      radius = hit.object.geometry.boundingSphere.radius * rawHitMatrix.getMaxScaleOnAxis();
      kind = "actual-instance-frame";
    } else if (id === "golgi") {
      if(whole.components.golgi?.holder){
        carrier=whole.components.golgi.holder;matrix.copy(carrier.matrixWorld);focus.copy(carrier.getWorldPosition(new THREE.Vector3()));radius=model.radius*matrix.getMaxScaleOnAxis();kind="actual-component-frame";
      }else{
      carrier = hit?.object;
      while (carrier?.parent && carrier.parent !== whole.group) carrier = carrier.parent;
      if (!carrier || carrier === whole.group) carrier = whole.group.children.find((o) => o.isGroup && o.children.some((c) => c.userData.organelleId === "golgi"));
      const bounds = new THREE.Box3().setFromObject(carrier);
      focus.copy(bounds.getCenter(new THREE.Vector3()));
      radius = bounds.getSize(new THREE.Vector3()).length() * 0.5;
      const orientation = carrier.getWorldQuaternion(new THREE.Quaternion());
      matrix.compose(focus, orientation, new THREE.Vector3().setScalar(radius / localRadius)).multiply(new THREE.Matrix4().makeTranslation(-localCenter.x, -localCenter.y, -localCenter.z));
      kind = "actual-semantic-carrier";
      }
    } else {
      carrier = hit?.object ?? null;
      if (hit) focus.copy(hit.point);
      let normal = hit?.face?.normal ? hit.face.normal.clone().applyNormalMatrix(new THREE.Matrix3().getNormalMatrix(hit.object.matrixWorld)).normalize() : focus.clone().normalize();
      if (id === "membrane" && !hit && whole.membraneSurface?.closestPoint) {
        const localFocus = focus.clone().applyMatrix4(whole.group.matrixWorld.clone().invert());
        const membraneHit = whole.membraneSurface.closestPoint(localFocus);
        if (!membraneHit) throw new Error("Membrane detail could not register to actual surface");
        focus.copy(membraneHit.point).applyMatrix4(whole.group.matrixWorld);
        normal.copy(membraneHit.normal).applyNormalMatrix(new THREE.Matrix3().getNormalMatrix(whole.group.matrixWorld)).normalize();
      }
      const rotation = FUSION_IDS.includes(id)?new THREE.Quaternion():new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0, 0, 1), normal.lengthSq() > 0 ? normal : new THREE.Vector3(0, 0, 1));
      if (id === "membrane") {
        const tangent = new THREE.Vector3(0,1,0).cross(normal);
        if (tangent.lengthSq() > 1e-8) {
          tangent.normalize();
          const bitangent = normal.clone().cross(tangent).normalize();
          rotation.setFromRotationMatrix(new THREE.Matrix4().makeBasis(tangent,bitangent,normal));
        }
      }
      matrix.compose(focus, rotation, new THREE.Vector3().setScalar(radius / localRadius)).multiply(new THREE.Matrix4().makeTranslation(-localCenter.x, -localCenter.y, -localCenter.z));
      kind = hit ? "actual-surface-patch" : "representative-local-detail";
    }
  }
  return { id, kind, carrier, matrix, focus, radius: Math.max(radius, 0.04), initialSection: Number(initialSection) || 0, diagnostic: { kind, hitObjectUUID: hit?.object.uuid ?? null, hitObjectName: hit?.object.name ?? null, instanceId: hit?.instanceId ?? null, materialIndex: hit?.face?.materialIndex ?? null, faceIndex: hit?.faceIndex ?? null, faceVertexIndices: hit?.face ? [hit.face.a, hit.face.b, hit.face.c] : null, poreIndex, materialDomain, hitWorldMatrix: rawHitMatrix?.toArray() ?? null, clickedPoint: hit?.point.toArray() ?? null, carrierUUID: carrier?.uuid ?? null, worldMatrix: (sourceWorldMatrix ?? (kind === "actual-instance-frame" ? rawHitMatrix : carrier?.matrixWorld ?? matrix)).toArray(), focus: focus.toArray(), radius: Math.max(radius, 0.04), matchedDetailMatrix: matrix.toArray() } };
}
function ensureHandoffPasses() {
  if (capturePass) return;
  capturePass = new SavePass();
  capturePass.enabled = false;
  blendPass = new ShaderPass({ name: "OrganelleWorldHandoff", uniforms: { tDiffuse: { value: null }, tPrevious: { value: null }, amount: { value: 0 } }, vertexShader: "varying vec2 vUv; void main(){vUv=uv;gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.0);}", fragmentShader: "uniform sampler2D tDiffuse; uniform sampler2D tPrevious; uniform float amount; varying vec2 vUv; void main(){gl_FragColor=mix(texture2D(tPrevious,vUv),texture2D(tDiffuse,vUv),amount);}" });
  blendPass.uniforms.tPrevious.value = capturePass.renderTarget.texture;
  blendPass.enabled = false;
  blendPass.material.depthTest = false;
  blendPass.material.depthWrite = false;
  const resizeCapture = capturePass.setSize.bind(capturePass);
  capturePass.setSize = (width, height) => {
    if (blendPass.enabled) pendingCaptureSize = { width, height };
    else resizeCapture(width, height);
  };
  capturePass.finishResize = () => {
    if (pendingCaptureSize) {
      resizeCapture(pendingCaptureSize.width, pendingCaptureSize.height);
      pendingCaptureSize = null;
    }
  };
  composer.insertPass(capturePass, composer.passes.length - 1);
  composer.insertPass(blendPass, composer.passes.length - 1);
}
function navigationPhase(phase) {
  if (navigation) {
    navigation.phase = phase;
    navigation.elapsed = 0;
  }
  requestRender();
}
function runPending() {
  const command = pendingCommand;
  pendingCommand = null;
  if (!command) return;
  queueMicrotask(() => {
    if (command.type === "view") viewModel(command.id, command.options);
    else if (command.type === "level") setLevel(command.level);
    else if (command.type === "micro") toggleMicro();
    else if (command.type === "scenario") switchScenario(command.mode);
    else if (command.type === "reset") reset();
    else returnWhole();
  });
}
function navigationDone(phase) {
  navigationLast = { phase, source: inspection?.source.diagnostic ?? navigation?.source?.diagnostic ?? null, returnWhole: inspection?.returnWhole ?? null };
  navigation = null;
  controls.enabled = true;
  syncUI();
  requestRender();
  if(phase === "whole-idle")for(const resolve of visibilityReturnWaiters.splice(0))resolve();
  runPending();
}
function navigationFailure(error) {
  microTextureScale(false);
  errors.push("Navigation: " + error.message);
  afterHandoffRender = null;
  if (capturePass) capturePass.enabled = false;
  if (blendPass) blendPass.enabled = false;
  transition = null;
  navigation = null;
  pendingCommand = null;
  state.view = "whole";
  state.selected = null;
  state.level = "whole";
  state.micro = false;
  state.connectedER = false;
  state.playing = false;
  detailRoot.visible = false;
  whole.group.visible = true;
  active = null;
  activeId = null;
  controls.enabled = true;
  state.section = inspection?.section ?? 0.72;
  whole.setSection(state.section);
  applyPose(inspection?.entry ?? wholePose());
  state.cameraHome = inspection?.cameraHome ?? true;
  inspection = null;
  syncUI();
  $("status").textContent = "已安全返回整胞，可重新选择结构。";
  for(const resolve of visibilityReturnWaiters.splice(0))resolve();
}
function captureHandoff(entering, onComplete) {
  ensureHandoffPasses();
  navigationPhase(entering ? "capture-in" : "capture-out");
  capturePass.enabled = true;
  blendPass.enabled = false;
  afterHandoffRender = () => {
    try {
      capturePass.enabled = false;
      blendPass.enabled = true;
      blendPass.uniforms.amount.value = 0;
      whole.group.visible = !entering;
      detailRoot.visible = entering;
      state.view = entering ? "detail" : "whole";
      state.section = entering ? inspection.source.initialSection : inspection.section;
      navigation.fadeComplete = onComplete;
      navigationPhase(entering ? "fade-in" : "fade-out");
      syncUI();
    } catch (error) {
      navigationFailure(error);
    }
  };
}
function viewModel(id, { connected = id === "er", hit = null } = {}) {
  // The ER index and the actual surface now enter the same continuous
  // nuclear-envelope/ER assembly; local views move the camera within it.
  if(id === "er")connected=true;
  if (!catalog[id] || visibility && !visibility.canInspect(id)) return;
  if(isEntryLesson())setViralLesson("response",{focus:false});
  if(id==='cytoskeleton'&&state.view==='whole'&&!navigation){
    const key=['microtubules','actin','intermediate-filaments'].find(key=>visibility?.canShowLabel(key));
    if(key){explorationControls?.focusSkeleton('network');return;}
  }
  explorationControls?.leaveSkeleton();
  if(state.uptakeLocal&&!navigation)uptakeControls.setLocal(false);
  if (navigation) {
    pendingCommand = { type: "view", id, options: { connected, hit } };
    return;
  }
  if (state.view === "detail") {
    if (state.selected === id && state.connectedER === connected && !hit) {
      setLevel("section");
      return;
    }
    pendingCommand = { type: "view", id, options: { connected, hit } };
    returnWhole();
    return;
  }
  try {
    microTextureScale(false);
    clearOrbitMomentum();
    transition = null;
    const entry = currentPose(), entryPlaying = state.playing, entrySection = state.section, cameraHome = state.cameraHome, entryViralFocus=state.viralFocused?state.viralFocusLabelId:null;
    state.viralFocused=false;state.viralFocusLabelId=null;
    state.playing = false;
    state.following = false;
    state.cameraHome = false;
    const useConnection = id === "er" && (connected || Boolean(hit));
    state.erConnectionFocus=false;
    active = loadDetail(id, useConnection);
    activeId = id;
    const source = resolveWholeSource(id, hit, active, useConnection);
    inspection = { entry, aspect: camera.aspect, playing: entryPlaying, section: entrySection, cameraHome, progress: state.progress, source, handoff: null, viralFocusLabelId:entryViralFocus };
    detailTime = state.time;
    inspectionPlayChanged = false;
    state.selected = id;
    state.connectedER = useConnection;
    state.level = MOLECULAR_IDS.includes(id)?"surface":"section";
    state.micro = false;
    state.patchSurface=false;
    detailRoot.matrixAutoUpdate = false;
    detailRoot.matrix.copy(source.matrix);
    detailRoot.updateWorldMatrix(true, true);
    active.setSection(source.initialSection);
    detailRoot.visible = false;
    whole.group.visible = true;
    const direction = camera.position.clone().sub(source.focus).normalize(), distance = Math.max(source.radius * 1.6, Math.min(source.radius / Math.sin(THREE.MathUtils.degToRad(camera.fov * 0.5)) * 1.08, camera.position.distanceTo(source.focus)));
    const handoff = { position: source.focus.clone().addScaledVector(direction, distance), target: source.focus.clone(), near: Math.min(0.04, source.radius * 0.04), far: 110, minDistance: source.radius * 0.02, maxDistance: 110 };
    inspection.handoff = handoff;
    navigation = { direction: "enter", selected: id, phase: "approach", elapsed: 0, source };
    controls.enabled = false;
    syncUI();
    $("status").textContent = "正在靠近" + catalog[id].name + (hit ? "的实际位置…" : "的代表位置，接续放大层级…");
    animatePose(handoff.position, handoff.target, 0.55, { pose: handoff, onComplete() {
      captureHandoff(true, () => {
        navigationPhase("detail-focus");
        const fromSection = source.initialSection;
        state.section = id === 'phagosome' ? source.initialSection : MOLECULAR_IDS.includes(id)||state.connectedER?0:0.78;
        if(state.connectedER)state.level="surface";
        if (state.connectedER) microTextureScale(6);
        const pose = computeDetailPose();
        syncUI();
        animatePose(pose.position, pose.target, 0.45, { pose, arc: true, sectionFrom: fromSection, sectionTo: state.section, onComplete() {
          $("status").textContent = LOCAL_IDS.includes(id) ? "已放大" + catalog[id].name + "的代表性实例，可继续观察局部构象。" : "已放大" + catalog[id].name + "，可拖动旋转并调整剖切。";
          navigationDone("detail-idle");
        } });
      });
    } });
  } catch (error) {
    navigationFailure(error);
  }
}
function setLevel(level) {
  if (navigation) {
    pendingCommand = { type: "level", level };
    return;
  }
  if (!active || !["surface", "section", "inside"].includes(level)) return;
  try {
    active.setObservationMode?.(false);
    const fromSection = active.group.userData.section ?? state.section;
    microTextureScale(false);
    state.micro = false;
    state.patchSurface=false;
    state.level = level;
    state.erConnectionFocus=false;
    state.view = "detail";
    state.section = level === "surface" ? 0 : level === "section" || state.selected === "membrane" ? 0.78 : MOLECULAR_IDS.includes(state.selected)?0:0.8;
    active.setObservationFocus?.(state.connectedER && level === "inside" ? "er-lumen" : null);
    if (state.connectedER && level === "inside") state.section = .78;
    if (state.connectedER && level !== "surface") microTextureScale(6);
    const pose = computeDetailPose(level === "inside" ? new THREE.Vector3(0.36, 0.2, 1) : new THREE.Vector3(0.18, 0.13, 1));
    animatePose(pose.position, pose.target, 0.65, { pose, arc: true, sectionFrom: fromSection, sectionTo: state.section });
    syncUI();
  } catch (error) {
    navigationFailure(error);
  }
}
// Evaluate against the same effective dependency mask as the visibility transaction.
function microTargetVisible(canShow = id => visibility?.canShowLabel(id) ?? true) {
  if (!active || !canShow(state.selected)) return false;
  if (state.selected === "cytoskeleton") return canShow("microtubules");
  if (state.selected === "membrane-patch") return canShow("membrane-proteins");
  if (state.selected === CELL_SURFACE_PATCH_ID) return canShow("actin") && canShow("microvilli");
  return true;
}
function surfaceTargetVisible(canShow = id => visibility?.canShowLabel(id) ?? true) {
  return Boolean(active) && ["membrane-patch", CELL_SURFACE_PATCH_ID].includes(state.selected) &&
    canShow(state.selected) && canShow("membrane-proteins") &&
    (state.selected !== CELL_SURFACE_PATCH_ID || canShow("microvilli"));
}
function activeFocusWillHide(canShowAfter) {
  if (state.view !== "detail") return false;
  return state.micro && !microTargetVisible(canShowAfter) ||
    state.patchSurface && (state.patchMode==="bilayer"?!(canShowAfter(CELL_SURFACE_PATCH_ID)&&canShowAfter("microvilli")):!surfaceTargetVisible(canShowAfter));
}
function toggleMicro() {
  if (navigation) {
    pendingCommand = { type: "micro" };
    return;
  }
  if (!active || state.level !== "inside") return;
  if (state.connectedER) { setLevel("inside"); return; }
  if(!state.micro && !microTargetVisible())return;
  if (state.micro) {
    setLevel("inside");
    return;
  }
  try {
    const fromSection = active.group.userData.section ?? state.section;
    state.micro = true;
    state.patchSurface = false;
    state.section = activeId === "membrane" ? .78 : 0;
    microTextureScale(true);
    const position = worldAnchor("inside"), target = worldAnchor("insideTarget"), distance = position.distanceTo(target), scale = activeScale();
    const pose = { position, target, near: Math.max(1e-6, Math.min(4e-3 * scale, distance * 0.025)), far: 110, minDistance: Math.max(1e-6, distance * 0.06), maxDistance: active.radius * scale * 4 };
    animatePose(position, target, 0.95, { pose, sectionFrom: fromSection, sectionTo: state.section, closeLate: true });
    syncUI();
  } catch (error) {
    navigationFailure(error);
  }
}
function returnWhole() {
  if (navigation) {
    pendingCommand = { type: "return" };
    return;
  }
  if (state.view !== "detail" || !inspection || !active) {
    transition = null;
    state.view = "whole";
    state.level = "whole";
    state.micro = false;
    state.patchSurface = false;
    state.selected = null;
    state.connectedER = false;
    active = null;
    activeId = null;
    detailRoot.visible = false;
    whole.group.visible = true;
    state.section = 0.72;
    whole.setSection(state.section);
    frameWhole();
    syncUI();
    return;
  }
  try {
    microTextureScale(false);
    state.following = false;
    const desiredPlaying = inspectionPlayChanged ? state.playing : inspection.playing;
    state.playing = false;
    navigation = { direction: "return", selected: activeId, phase: "retreat", elapsed: 0, source: inspection.source };
    controls.enabled = false;
    syncUI();
    const handoff = inspection.handoff, fromSection = active.group.userData.section ?? state.section;
    animatePose(handoff.position, handoff.target, 0.65, { pose: handoff, sectionFrom: fromSection, sectionTo: inspection.source.initialSection, openDuringRetreat: true, onComplete() {
      active.setSection(inspection.source.initialSection);
      state.micro = false;
      state.patchSurface = false;
      captureHandoff(false, () => {
        navigationPhase("restore");
        state.section = inspection.section;
        whole.setSection(state.section);
        const aspectChanged = inspection.aspect !== camera.aspect, refitHome = inspection.cameraHome && aspectChanged;
        const restoreViralFocus=inspection.viralFocusLabelId&&presentedViralLabels().some(l=>l.id===inspection.viralFocusLabelId&&l.visible&&l.allowed);
        inspection.reframeHiddenViralFocus=Boolean(inspection.viralFocusLabelId&&!restoreViralFocus);inspection.resumeViralFocusLabelId=restoreViralFocus?inspection.viralFocusLabelId:null;
        const entry = refitHome||inspection.reframeHiddenViralFocus ? wholePose() : inspection.entry;
        inspection.returnWhole = { policy: inspection.reframeHiddenViralFocus ? "refit-home-for-hidden-viral-target" : refitHome ? "refit-home-for-viewport" : "restore-entry-world-pose", entryCameraHome: inspection.cameraHome, entryAspect: inspection.aspect, returnAspect: camera.aspect, aspectChanged, destination: { camera: entry.position.toArray(), target: entry.target.toArray(), near: entry.near, far: entry.far, minDistance: entry.minDistance, maxDistance: entry.maxDistance } };
        animatePose(entry.position, entry.target, 0.75, { pose: entry, onComplete() {
          state.view = "whole";
          state.level = "whole";
          state.micro = false;
          state.patchSurface = false;
          state.selected = null;
          state.connectedER = false;
          state.playing = desiredPlaying;
          state.cameraHome = inspection.reframeHiddenViralFocus?true:inspection.cameraHome;
          state.viralFocused=Boolean(inspection.resumeViralFocusLabelId);state.viralFocusLabelId=inspection.resumeViralFocusLabelId;
          if(inspection.reframeHiddenViralFocus)reactionFocus?.leave("hidden-during-inspection");
          active = null;
          activeId = null;
          detailRoot.visible = false;
          whole.group.visible = true;
          navigationDone("whole-idle");
          inspection = null;
        } });
      });
    } });
  } catch (error) {
    navigationFailure(error);
  }
}
function reset() {
  if(steadyLessonActive&&!navigation){transition=null;frameSteadyLesson();syncUI();return;}
  explorationControls?.leaveSkeleton();
  if(isEntryLesson()&&!navigation){transition=null;applyPose(entryLessonPose());syncUI();return;}
  if(state.scenario==="clearance"&&state.uptakeLocal&&!navigation&&state.view==="whole"){uptakeControls.focusCamera(false);syncUI();return;}
  if (navigation) {
    pendingCommand = { type: "reset" };
    return;
  }
  reactionFocus?.leave("reset");state.following = false;state.viralFocused=false;state.viralFocusLabelId=null;
  if (state.view === "whole") {
    transition = null;
    frameWhole();
  } else if (state.level === "inside") setLevel("inside");
  else fitDetail(new THREE.Vector3(0.18, 0.13, 1), true);
  syncUI();
}
let annotations = null;
let displayedGuide = null;
function guideText(host, text, className = "") {
  if (!text) return;
  const p = document.createElement("p");
  p.textContent = text;
  p.className = className;
  host.append(p);
}
function guideSources(host, sources = []) {
  const links = document.createElement("p");
  links.className = "guide-sources";
  links.append("资料：");
  for (const [i, source] of sources.entries()) {
    if (!source?.url?.startsWith("https://")) continue;
    if (i) links.append(" · ");
    const link = document.createElement("a");
    link.textContent = source.title;
    link.href = source.url;
    link.target = "_blank";
    link.rel = "noopener noreferrer";
    links.append(link);
  }
  if (sources.length) host.append(links);
}
function renderStructureGuide(id, connected = false) {
  const guide = STRUCTURE_GUIDE[id], mode = connected ? "connection" : "ordinary", key2 = id + ":" + mode + ":" + state.scenario;
  if (!guide || key2 === displayedGuide) return;
  displayedGuide = key2;
  const host = $("structure-guide-content");
  host.replaceChildren();
  $("structure-details").open = false;
  const list = document.createElement("dl");
  list.className = "guide-features";
  for (const feature of guide.features.filter((feature2) => !feature2.views || feature2.views.includes(mode))) {
    const name = document.createElement("dt");
    name.textContent = feature.name + (feature.visible ? "" : " · 背景知识");
    const description = document.createElement("dd");
    description.textContent = feature.function + (feature.visible ? "" : "（本模型未单独建出。）") + (feature.note ? " " + feature.note : "");
    if(feature.location)guideText(description,"位置："+feature.location,"feature-location");
    list.append(name, description);
  }
  host.append(list);
  guideText(host, guide.note, "guide-note");
  guideSources(host, guide.sources);
}
function renderScenarioGuide() {
  const guide = state.scenario==="virus"&&state.viralLesson==="entry"?{
    summary:viralEntry.getState().generalPrinciple,
    steps:viralEntry.stages,
    notes:["本例从病毒已经位于内体腔内开始。HA 和低 pH 触发仅对应流感病毒示例；其他包膜病毒的受体、触发与融合位置可不同。","上方为病毒内部，两层膜之间为内体腔，下方为胞质。青绿球只是水相连通示踪，不是病毒 RNA；融合不等于有效感染。"],
    sources:[{title:"Benton et al. 2020 · HA 构象中间态",url:"https://www.nature.com/articles/s41586-020-2333-6"},{title:"Calder & Rosenthal · 膜融合电镜",url:"https://pmc.ncbi.nlm.nih.gov/articles/PMC6485592/"}]
  }:SCENARIO_GUIDE[state.scenario], host = $("scenario-guide-content");
  host.replaceChildren();
  $("scenario-details").open = false;
  if (!guide) return;
  guideText(host, guide.summary);
  const list = document.createElement("dl");
  list.className = "guide-features";
  for (const step of guide.steps) {
    const name = document.createElement("dt"), desc = document.createElement("dd");
    name.textContent = step.title;
    desc.textContent = step.desc+(step.location?" 所在位置："+step.location+"。":"")+(step.partners?.length?" 协作："+step.partners.join("、")+"。":"");
    list.append(name, desc);
  }
  host.append(list);
  for (const note of guide.notes) guideText(host, note, "guide-note");
  guideSources(host, guide.sources);
}
const viralDisplayRoles={virus:['external-or-taken-viral-particle-and-components'],endosome:['uptake-endosomal-compartment-and-associated-domains'],'conditional-rna':['independent-conditional-cytosolic-viral-RNA'],mavs:['host-cytosolic-RNA-sensor-example','mitochondrial-outer-membrane-adaptor-schematic'],irf3:['host-nuclear-transport-schematic'],ifnb1:['host-nuclear-transcription-teaching-projection'],secretion:['host-secretory-vesicle-and-IFN-cargo'],ifnar:['host-cell-surface-IFNAR-context'],isg:['host-nuclear-transport-schematic','host-cytosolic-induced-gene-product-schematic']};
const viralDisplayBindings=viral.getVisibilityBindings();
function viralActorVisible(binding,canShow){
  if(!viral.getObjectVisibilityDependencies(binding.object)?.every(canShow))return false;
  for(let n=binding.object;n;n=n.parent)if(!n.visible)return false;
  const mats=Array.isArray(binding.object.material)?binding.object.material:[binding.object.material];
  return mats.some(m=>m?.visible!==false&&(m?.opacity??1)>.025);
}
function presentedViralLabels(canShow=id=>visibility?.canShowLabel(id)??true){
  const d=viral.getDiagnostics();
  return viral.getLabelState().map(item=>{
    const out={...item,dependencies:viral.getLabelVisibilityDependencies(item.id)};
    let roles=viralDisplayRoles[item.id];
    if(item.id==='secretion'&&d.secretoryState==='released-state'){
      roles=['host-extracellular-released-IFN'];out.dependencies=['membrane'];out.shortText='胞外 IFN-β';
      const actor=viralDisplayBindings.find(b=>b.role===roles[0])?.object;
      if(actor){const center=new THREE.Vector3(),matrix=new THREE.Matrix4(),point=new THREE.Vector3();for(let i=0;i<actor.count;i++){actor.getMatrixAt(i,matrix);center.add(point.setFromMatrixPosition(matrix).applyMatrix4(actor.matrixWorld));}out.position=center.multiplyScalar(1/actor.count).add(new THREE.Vector3(0,.4,0));}
    }else if(item.id==='secretion')out.shortText=d.secretoryState==='ER-exported'?'ER 输出后 IFN 载体':'高尔基输出后 IFN 载体';
    if(item.id==='ifnar')out.shortText=({'waiting-for-extracellular-ligand':'IFNAR · 未结合','ligand-approaching-IFNAR2':'IFN-β 接近 IFNAR2','ligand-docked-to-IFNAR2':'IFN-β 接合 IFNAR2','ligand-induced-subunit-assembly':'IFNAR1/2 靠拢组装','assembled-JAK-activating':'IFNAR · 胞质 JAK 激活','assembled-JAK-active':'IFNAR · JAK–STAT 应答'})[d.ifnarState]??'IFNAR';
    if(roles)out.visible=out.visible&&viralDisplayBindings.some(b=>roles.includes(b.role)&&viralActorVisible(b,canShow));
    out.allowed=out.dependencies?.every(canShow)??false;
    return out;
  });
}
function isReceptorFocus(){return reactionFocus?.isReceptor()??false;}
function viralFocusedTargetVisible(canShow=id=>visibility?.canShowLabel(id)??true){return reactionFocus?.isCurrentValid(canShow)??false;}
function updateMembraneActivityStatus(){
  const element=$("membrane-activity-status"),s=active?.group.userData.membraneFunctionalState;
  const show=state.view==="detail"&&activeId==="membrane"&&Boolean(s);element.hidden=!show;if(!show)return;
  const fc=s.FcGammaRIIA.includes("unbound")?"未结合":s.FcGammaRIIA.includes("approaching")?"Fc 接近":s.FcGammaRIIA.includes("dissociating")?"Fc 离开":"Fc 结合";
  const pore=s.P2X7==="open"?"开孔通行":s.P2X7==="closed"?"关闭":"开闭转换";
  const text="FcγRIIA："+fc+" · P2X7："+pore;if(element.textContent!==text)element.textContent=text;
}
function syncUI() {
  requestRender();
  $("follow-button").innerHTML = (state.scenario === "structure" ? "观察协作运输" : state.scenario === "virus" ? "靠近当前反应" : state.following ? "返回整胞视角" : "跟随颗粒") + icon(state.following ? "back" : "arrow");
  const detail = state.view === "detail";
  const entry=isEntryLesson();
  $("particle-key").hidden=detail||state.scenario==="virus"||Boolean(state.uptakeLocal)||Boolean(state.skeletonFocus);
  updateMembraneActivityStatus();
  $("play-button").disabled = Boolean(navigation);
  $("time-range").disabled = Boolean(navigation) || detail;
  $("section-range").disabled = Boolean(navigation);
  $("speed-select").disabled = Boolean(navigation);
  $("connection-button").disabled = Boolean(navigation);
  $("smooth-er-button").hidden=!detail||activeId!=="er"||!active?.anchors.smoothERCamera;
  $("smooth-er-button").disabled=Boolean(navigation);

  $("micro-button").disabled = Boolean(navigation)||!microTargetVisible();
  $("micro-button").title=microTargetVisible()?"":"恢复显示对应微管、肌动蛋白芯或膜蛋白示意后观察此局部";
  $("surface-motion-button").disabled = Boolean(navigation) || !surfaceTargetVisible();
  $("surface-motion-button").title = surfaceTargetVisible() ? "" : "恢复显示局部膜和膜蛋白示意后观察";

  ground.visible = !detail&&!entry&&!state.uptakeLocal;
  viral.group.visible = !detail && state.scenario === "virus"&&!entry;
  viralEntry.group.visible=entry;
  if(state.view==="whole"&&!navigation&&!state.uptakeLocal)whole.group.visible=!entry;
  viralBoundaryNote.hidden=detail||state.scenario!=="virus"||entry;
  $("viral-lesson-selector").hidden=detail||state.scenario!=="virus";
  document.querySelectorAll("[data-viral-lesson]").forEach(b=>{b.setAttribute("aria-pressed",String(b.dataset.viralLesson===state.viralLesson));b.disabled=Boolean(navigation);});
  document.body.classList.toggle("virus-mode", state.scenario === "virus");
  document.body.classList.toggle("structure-mode",state.scenario === "structure");
  steady.group.visible=false;
  if(cytoskeletonNetwork){
    cytoskeletonNetwork.group.visible=Boolean(state.showSkeletonNetwork)&&!detail&&!state.uptakeLocal&&state.scenario!=="clearance"&&!entry;
    const focused=Boolean(state.skeletonFocus),materials=new Set();
    cytoskeletonNetwork.group.traverse(o=>{if(!o.isMesh)return;o.userData.exhibitionCastShadow??=o.castShadow;o.castShadow=focused?o.userData.exhibitionCastShadow:false;for(const m of Array.isArray(o.material)?o.material:[o.material])materials.add(m);});
    for(const m of materials){m.userData.exhibitionOpacity??={opacity:m.opacity,transparent:m.transparent,depthWrite:m.depthWrite};const base=m.userData.exhibitionOpacity;
      // Four visible walls can accumulate alpha in a hollow, double-sided tube.
      // Keep the overview network quiet; a focused view restores its solid form.
      m.opacity=focused?base.opacity:base.opacity*.05;m.transparent=focused?base.transparent:true;m.depthWrite=focused?base.depthWrite:false;
    }
  }
  $("structure-tab").setAttribute("aria-pressed",String(state.scenario === "structure"));
  $("mode-status").textContent=state.scenario === "structure" ? "结构 · 功能 · 日常协作" : state.scenario === "clearance" ? "摄取 · 成熟 · 处理的概念演示" : "条件性应答示意 · 摄取不等于感染";
  $("follow-button").hidden=false;
  document.querySelector(".time-control").hidden=state.scenario === "structure";
  $("relationship-note").hidden=state.scenario !== "structure";
  $("steady-description").hidden=state.scenario !== "structure";
  document.body.classList.toggle("detail-mode", detail);
  document.body.classList.toggle("inside-mode", state.level === "inside");
  document.body.classList.toggle("micro-mode", state.micro);
  document.body.classList.toggle("molecular-mode",MOLECULAR_IDS.includes(state.selected));
  document.body.classList.toggle("connection-mode", state.connectedER);
  document.body.classList.toggle("receptor-focus-mode",isReceptorFocus());
  document.body.classList.toggle("reaction-focus-mode",reactionFocus?.isActive()??false);
  document.body.classList.toggle("skeleton-focus-mode",Boolean(state.skeletonFocus));
  $("detail-panel").hidden = !detail;
  $("journey-panel").hidden = detail;
  $("callouts").hidden = detail && !state.connectedER;
  $("section-range").value = Math.round(state.section * 100);
  $("section-range").style.setProperty("--value", `${state.section * 100}%`);
  $("play-button").innerHTML = icon(state.playing ? "pause" : "play");
  $("play-button").setAttribute("aria-label", state.playing ? "暂停" : "播放");
  $("play-button").setAttribute("aria-pressed", String(state.playing));
  $("speed-select").value = String(state.speed);
  $("clearance-tab").setAttribute("aria-pressed", String(state.scenario === "clearance"));
  $("virus-tab").setAttribute("aria-pressed", String(state.scenario === "virus"));
  $("subtitle").textContent = detail ? `${catalog[state.selected].name} · 局部观察` : "旋转整颗细胞，发现生命内部的联系";
  $("view-hint").textContent = detail ? "拖动旋转 · 滚轮缩放 · 调整剖切 · Esc 返回整胞" : "拖动旋转 · 滚轮缩放 · 点击细胞器探索";
  for (const el of document.querySelectorAll(".organelle-button")) el.classList.toggle("active", el.dataset.organelle === state.selected);
  $("surface-motion-button").hidden=!detail||!["membrane-patch",CELL_SURFACE_PATCH_ID].includes(state.selected);
  $("surface-patch-button").hidden=!detail||state.selected!=="membrane";
  $("surface-patch-button").disabled=Boolean(navigation)||!(visibility?.canInspect(CELL_SURFACE_PATCH_ID)??true);
  if (detail) {
    const c = catalog[state.selected];
    $("detail-title").textContent = state.connectedER ? "核膜与内质网" : c.name;
    $("connection-button").hidden = state.selected !== "er";
    $("connection-button").textContent = state.erConnectionFocus ? "返回内质网全貌" : "观察核膜连接";
    $("detail-summary").textContent = STRUCTURE_GUIDE[state.selected]?.function ?? c.summary;
    renderStructureGuide(state.selected, state.connectedER);
    $("detail-kicker").textContent = state.connectedER ? "核膜与内质网 · 连续膜腔" : "细胞器 · 局部观察";
    $("fact-list").replaceChildren();
    const guide = STRUCTURE_GUIDE[state.selected];
    const quickFacts = guide ? ["位置：" + guide.location, "协作：" + guide.partners.join("、")] : active.facts.slice(0, 3);
    for (const fact of quickFacts) {
      const li = document.createElement("li");
      li.textContent = fact;
      $("fact-list").append(li);
    }


    $("micro-button").hidden = state.level !== "inside" || state.connectedER || !["membrane","pore","cytoskeleton","ribosome","membrane-patch",CELL_SURFACE_PATCH_ID,...MOLECULAR_IDS,...FUSION_IDS].includes(state.selected);
    $("micro-button").textContent = state.micro ? "返回构象总览" : MOLECULAR_IDS.includes(state.selected) ? catalog[state.selected].microLabel : state.selected === CELL_SURFACE_PATCH_ID ? "观察微绒毛胞质侧与芯" : state.selected === "ribosome" ? "观察亚基界面" : state.selected === "cytoskeleton" ? "深入微管局部" : state.selected === "membrane" ? "观察双层局部" : state.selected === "pore" ? "进入核孔通道" : "进入腔内漫游";
    $("surface-motion-button").hidden=!["membrane-patch",CELL_SURFACE_PATCH_ID].includes(state.selected);
    $("inside-note").hidden = state.level !== "inside";
    $("inside-note").textContent = state.selected === CELL_SURFACE_PATCH_ID ? "从胞质侧观察膜突起及肌动蛋白芯；这里不是脂质膜壁内的水腔。活动符号独立归一化放大，不能与分子实例比较真实大小。" : MOLECULAR_IDS.includes(state.selected) ? "从外侧观察公开坐标的粗化骨架局部。不是膜腔，也不填补原数据缺失的环或末端。" : state.selected === "er" || state.selected === "golgi" ? state.micro ? "真实薄腔的视野狭窄，可返回构象总览观察膜的折叠关系。" : "展开膜囊观察内部关系；选择腔内漫游可进入实际薄腔。" : state.selected === "ribosome" ? "核糖体没有膜包围的腔室，此处放大亚基之间的局部构象。" : state.selected === "cytoskeleton" ? "局部构象展示微管与马达，不代表封闭的细胞器腔室。" : state.selected === "membrane" ? "这里展示磷脂与跨膜蛋白的局部排列，膜内疏水区域并非水性腔室。" : "内部构象为教学展示，比例和细节密度经过调整。";
  }
  if (detail && state.selected === "membrane" && active.group.userData.membraneProteinWindow) {
    if (state.micro) {
      $("subtitle").textContent = "细胞膜 · 脂质双层局部剖面";
      $("inside-note").textContent = "亲水头朝向两侧水相，双尾朝向疏水核心；此处为脂质局部剖面。";
    } else if (state.level !== "surface") {
      $("subtitle").textContent = "细胞膜 · 膜壁纵剖与蛋白局部开窗";
      $("inside-note").textContent = "仅剖开蛋白的跨膜邻近区域，远端结构域保留完整体积。中央水性孔道与周围脂质疏水区不同。";
    }
  }
  if(detail && state.patchSurface){
    $("subtitle").textContent=catalog[state.selected].name+" · 膜表面观察";
    $("view-hint").textContent=state.selected===CELL_SURFACE_PATCH_ID?(state.patchMode==="bilayer"?"亲水头朝两侧水相 · 疏水尾相向 · 外部侧视":"紫：自由样随机游走 · 金：暂受限后释放 · 播放比较"):"通用跨膜位置示意 · 播放观察受限侧向活动 · 拖动环视";
  }
  if(detail && state.selected === "membrane-patch" && state.micro){
    $("subtitle").textContent="内质网膜局部 · 水性薄腔";
    $("view-hint").textContent="薄腔水相内 · 前方为通用跨膜符号的腔侧端 · 拖动环视";
  }
  if(detail&&FUSION_IDS.includes(state.selected)){
    $("detail-kicker").textContent="膜融合 · 独立微观案例";
    $("micro-button").textContent=state.micro?"返回融合总览":"靠近膜接触区";
    $("inside-note").textContent="两张膜各有两个脂质叶。观察蛋白如何拉近膜，再逐步查看接触、半融合与水性孔。";
    $("view-hint").textContent="选择阶段或拖动进度 · 空格播放/暂停 · 拖动环视";
  }
  learningControls?.sync();
  syncPhase();
  $("follow-button").disabled=Boolean(navigation);
  uptakeControls?.renderUI();
  if(state.scenario === "virus"){$("follow-button").disabled=Boolean(navigation)||(!entry&&!reactionFocus?.canFocus());if(entry)$("follow-button").innerHTML="重置融合视角"+icon("reset");else if(isReceptorFocus()&&state.viralFocusKind?.startsWith("IFNAR-"))$("follow-button").innerHTML=(state.viralSurfaceSide==="inside"?"查看膜外结合面":"查看胞质侧激活")+icon("arrow");}
  visibility?.setContext({view:state.view,selected:state.selected,connectedER:state.connectedER,surfaceReceptorFocus:state.userClearView&&isReceptorFocus(),reactionCloseup:Boolean(state.userClearView&&reactionFocus?.isActive()),reactionKey:state.viralFocusKind,skeletonFocus:state.userClearView?state.skeletonFocus:null});
  if(reactionFocus?.isActive()){const names={"particle":"摄取颗粒","endosomal-processing":"内体腔内处理","cytosolic-recognition":"胞质 RNA 与 RIG-I","MAVS":"线粒体外膜 · MAVS","IRF3-transport":"IRF3 · 经核孔入核","nuclear-transcription":"核内 IFNB1 转录","secretory-carrier":"IFN-β 分泌载体","released-IFN":"释放后的 IFN-β","approaching-IFN":"IFN-β · 接近细胞表面","STAT-transport":"STAT · 经核孔入核","induced-products":"胞质 · 一个代表性 ISG 产物"};$("subtitle").textContent=isReceptorFocus()?(state.viralSurfaceSide==="inside"?"IFNAR · 胞质侧 JAK 激活":"IFNAR · 膜外配体结合"):(names[state.viralFocusKind]??"当前反应 · 跟随观察");$("view-hint").textContent="随实际对象移动 · "+(state.userClearView?"清晰观察已开 · ":"")+"拖动/滚轮接管 · 重置返回整胞";}
  for(const b of document.querySelectorAll("[data-organelle]"))b.disabled=Boolean(visibility&&!visibility.canInspect(b.dataset.organelle));
  if(state.viralFocused){const names={'TBK1-activation':'胞质侧 · TBK1 与 IRF3 活化','mRNA-to-ER':'IFNB1 mRNA · 输出与接入翻译','ER-translation':'粗面内质网 · 合成 IFN-β','Golgi-processing':'高尔基体 · 腔内处理与分选',exocytosis:'宿主分泌 · 开放胞吐孔','ISG-transcription':'细胞核 · 宿主 ISG 转录'};if(names[state.viralFocusKind])$('subtitle').textContent=names[state.viralFocusKind];}
  if(state.selected === "er" && visibility?.isHidden("nucleus")){$("connection-button").disabled=true;$("connection-button").title="恢复显示细胞核后观察连接";}
  surfaceActivity?.sync();explorationControls?.sync();
  annotations?.update({ view: state.view, selected: state.selected, connectedER: state.connectedER, scenario: state.scenario });
  if (annotations && !annotations.visible) $("callouts").hidden = true;
  if(state.scenario==="virus"&&!detail)$("callouts").hidden=true;
  document.body.classList.toggle("entry-lesson-mode",entry);
  if(entry){$("subtitle").textContent="包膜病毒的一般融合原理 · 以流感病毒 HA 为例";$("view-hint").textContent="上：病毒内部 · 间隙：内体腔 · 下：胞质｜选择阶段看蛋白重排与开孔";}
  classroomOverlay?.update();
  exhibitionLayout?.sync();
}
function frameSteadyLesson(){
  const pose=steady.getCameraPose(),offset=pose.position.clone().sub(pose.target);
  // Leave room for annotation rails while fitting the teaching excerpt on a laptop.
  pose.position.copy(pose.target).addScaledVector(offset,Math.max(1,1.22/Math.max(.5,camera.aspect)));
  applyPose(pose);state.cameraHome=false;
}
function syncSteadyContext({category,detailView}){
  const activeLesson=category==='processes'&&state.scenario==='structure'&&!detailView&&!state.steadyOverview&&!navigation;
  if(activeLesson&&!steadyLessonActive){
    steadyWholePose=currentPose();transition=null;clearOrbitMomentum();
    steadyLessonActive=true;steady.setTopic(state.steadyTopic);steady.seek(state.progress);frameSteadyLesson();
  }else if(!activeLesson&&steadyLessonActive){
    steadyLessonActive=false;transition=null;
    if(state.view==='whole'&&state.scenario==='structure'){
      if(steadyWholePose)applyPose(steadyWholePose);else frameWhole();
      whole.group.visible=true;ground.visible=true;
      if(cytoskeletonNetwork)cytoskeletonNetwork.group.visible=Boolean(state.showSkeletonNetwork);
      $("callouts").hidden=Boolean(annotations&&!annotations.visible);
    }
    steadyWholePose=null;
  }
  steady.group.visible=activeLesson&&Boolean(visibility?.canShowLabel('collaboration')??true);
  if(activeLesson){
    $("visibility-details").hidden=true;
    whole.group.visible=false;ground.visible=false;viral.group.visible=false;viralEntry.group.visible=false;
    if(cytoskeletonNetwork)cytoskeletonNetwork.group.visible=false;
    $("callouts").hidden=true;$("particle-key").hidden=true;
    $("subtitle").textContent=STEADY_TOPICS[state.steadyTopic].name+' · 局部教学展开 · '+['追踪橙色分泌货物','看清轨道、马达与载体','区分膜受体和腔内货物'][state.steadyTopic];
    $("view-hint").textContent='局部协作示意 · 空间与尺度为教学展开｜选择步骤或播放 · 拖动环视';
    $("section-range").disabled=true;
  }
  if(state.scenario==='structure'&&!detailView){
    $("follow-button").innerHTML=(state.steadyOverview?'返回协作演示':'查看整胞位置')+icon(state.steadyOverview?'back':'arrow');
    document.querySelector('.time-control').hidden=!activeLesson;
    $("relationship-note").hidden=activeLesson;
  }
  document.body.classList.toggle('steady-lesson-active',activeLesson);
  steadyControls?.sync(activeLesson);requestRender();
}
function seekSteadyStep(index){
  if(navigation||!steadyLessonActive)return;
  const i=THREE.MathUtils.clamp(index,0,4);seekTeachingProgress((i+.5)/5);
}
function entryLessonPose(){
  const pose=viralEntry.getCameraPose(),offset=pose.position.clone().sub(pose.target);
  const right=new THREE.Vector3().crossVectors(camera.up,offset).normalize();
  pose.target.addScaledVector(right,-.62);
  pose.position.copy(pose.target).addScaledVector(offset,1.42);
  return pose;
}
function seekTeachingProgress(progress,{focus=true}={}){
  state.progress=THREE.MathUtils.clamp(progress,0,1);state.playing=false;
  if(state.scenario==='structure')steady.seek(state.progress);
  if(state.scenario==="virus"){
    if(state.viralLesson==="entry")viralEntry.seek(state.progress);
    else {viral.seek(state.progress);reactionFocus?.timelineChanged("seek");if(focus)reactionFocus?.focus();}
  }
  syncUI();
}
function seekTeachingStage(index){
  const list=presentationPhases(),i=THREE.MathUtils.clamp(index,0,list.length-1),p=list[i];
  if(state.scenario==='structure'){
    state.steadyTopic=i;state.steadyOverview=false;steady.setTopic(i);phaseIndex=-1;
    seekTeachingProgress(0);return;
  }
  const progress=state.scenario==="virus"&&state.viralLesson==="response"&&i===5?.855:p.at+((list[i+1]?.at??1)-p.at)*.45;
  seekTeachingProgress(progress);
}
function setViralLesson(lesson,{focus=true}={}){
  if(!["entry","response"].includes(lesson)||navigation||state.view!=="whole")return;
  viralLessonSnapshots[state.viralLesson]={progress:state.progress,time:state.time,section:state.section};
  reactionFocus?.leave("lesson-change");transition=null;clearOrbitMomentum();
  state.viralLesson=lesson;Object.assign(state,viralLessonSnapshots[lesson]);state.playing=false;state.following=false;
  // Restore the selected lesson's actor visibility before the focus controller
  // validates actual rendered objects.
  syncUI();
  if(lesson==="entry"){viralEntry.seek(state.progress);viralEntry.setSection(state.section);applyPose(entryLessonPose());}
  else {state.userClearView=true;whole.setSection(state.section);viral.seek(state.progress);if(!focus||!reactionFocus?.focus())frameWhole();}
  setupPhases();
}
function classroomLesson(){
  if(state.scenario!=="virus"||state.view!=="whole"||navigation||annotations&&!annotations.visible)return null;
  if(state.viralLesson==="entry"){
    const s=viralEntry.getState();
    return {key:"entry",index:s.stageIndex,total:viralEntry.stages.length,title:s.stage.title,subtitle:s.subtitle,location:s.location,instruction:s.instruction,boundaryNote:"上：病毒内部 · 间隙：内体腔 · 下：胞质。青绿球仅示踪水相；低 pH 为本例触发条件。",labels:viralEntry.getTeachingLabels(),stages:viralEntry.stages};
  }
  return getResponseLesson({THREE,state,viral,reactionFocus,stages:viralPhases});
}
function presentationPhases() {
  if(state.scenario === "structure")return STEADY_TOPICS;
  if(state.scenario === "virus")return state.viralLesson==="entry"?viralEntry.stages.map(s=>({...s,name:s.title})):viralPhases;
  return uptakeControls?.stages()??phases;
}
function syncPhase() {
  if(state.scenario==='structure')steady.seek(state.progress);
  $("time-range").value = Math.round(state.progress * 1e3);
  $("time-value").textContent = Math.round(state.progress * 100) + "%";
  const list = presentationPhases(), index = state.scenario==='structure'?state.steadyTopic:list.reduce((a, v, i) => state.progress >= v.at ? i : a, 0);
  if (index !== phaseIndex) {
    phaseIndex = index;
    if (annotations?.diagnostics().note?.kind === "scenario") annotations.close();
    document.querySelectorAll("[data-phase]").forEach((el, i) => {
      el.classList.toggle("active", i === index);
      el.setAttribute("aria-current", i === index ? "step" : "false");
    });
    $("phase-description").textContent = list[index].desc;
    if(state.scenario === "virus"&&state.viralLesson!=="entry")viralBoundaryNote.textContent=viralBoundaryText[index];
    if(state.scenario === "structure"){steady.setTopic(index);steady.seek(state.progress);$("steady-description").textContent=list[index].desc;}
    if(state.scenario === "clearance")uptakeControls?.renderUI();
  }
  if(state.scenario==='structure')steadyControls?.sync(steadyLessonActive);
}
function setupPhases() {
  renderScenarioGuide();
  phaseIndex = -1;
  $("phase-list").replaceChildren();
  const list = presentationPhases();
  $("journey-heading").textContent = state.scenario === "structure" ? "日常协作的细胞" : state.scenario === "virus" ? state.viralLesson==="entry"?"包膜病毒的膜融合":"细胞的抗病毒应答" : "一颗颗粒的旅程";
  $("follow-button").innerHTML = (state.scenario === "structure" ? "观察协作运输" : state.scenario === "virus" ? "靠近当前反应" : state.following ? "返回整胞视角" : "跟随颗粒") + icon(state.following ? "back" : "arrow");
  for (const [i, p] of list.entries()) {
    const b = document.createElement("button");
    b.className = "phase-button";
    b.dataset.phase = i;
    b.dataset.stepNumber = String(i+1).padStart(2,'0');
    b.innerHTML = '<span class="phase-node" aria-hidden="true"></span><span></span>';
    b.children[1].textContent = p.name;
    b.addEventListener("click", () => {
      if (navigation || state.view === "detail") return;
      seekTeachingStage(i);
    });
    $("phase-list").append(b);
  }
  syncUI();
}
function switchScenario(mode) {
  explorationControls?.leaveSkeleton();
  if (navigation) {
    pendingCommand = { type: "scenario", mode };
    return;
  }
  if (state.view === "detail") {
    pendingCommand = { type: "scenario", mode };
    returnWhole();
    return;
  }
  if(state.scenario === "clearance")uptakeControls?.leave();
  reactionFocus?.leave("scenario");state.viralFocused=false;state.viralFocusLabelId=null;
  state.scenario = mode;
  if(mode==='structure'){state.steadyOverview=false;steady.setTopic(state.steadyTopic);steady.seek(0);}
  state.progress = mode === "structure" || mode === "virus" ? 0 : 0.38;
  state.playing = false;
  viral.seek?.(0);
  viral.resetTime?.(0);
  returnWhole();
  if(mode === "clearance"){
    uptakeControls?.enter();
  }
  setupPhases();
  if(mode==="virus"){
    state.section=viralLessonSnapshots[state.viralLesson].section;
    if(state.viralLesson==="entry"){viralEntry.seek(0);viralEntry.setSection(state.section);applyPose(entryLessonPose());}
    else {state.userClearView=true;whole.setSection(state.section);reactionFocus?.focus();}
    syncUI();
  }
}
for (const id of EXPLORABLE_IDS) {
  const c = catalog[id], b = document.createElement("button");
  b.className = "organelle-button";
  b.dataset.organelle = id;
  b.innerHTML = '<span class="organelle-dot" aria-hidden="true"></span><span></span>';
  b.firstChild.style.background = c.color;
  b.lastChild.textContent = id === "tubulin-structure" ? "微管蛋白 · 1JFF" : id === "ribosome-structure" ? "人80S · 4UG0" : c.name;
  b.addEventListener("click", () => viewModel(id));
  $(LOCAL_IDS.includes(id)?"molecular-grid":"organelle-grid").append(b);
}
for (const id of ["nucleus", "phagosome"]) {
  const anchor = document.createElement("div");
  anchor.className = "callout";
  anchor.dataset.callout = id;
  anchor.innerHTML = '<span class="callout-point"></span><span class="callout-line"></span><button class="callout-name"></button>';
  anchor.lastChild.textContent = catalog[id].name;
  anchor.lastChild.dataset.annotationId = id;
  $("callouts").append(anchor);
}
const viralCallouts = Array.from({ length: 2 }, () => {
  const label = document.createElement("button");
  label.type = "button";
  label.className = "viral-callout";
  label.hidden = true;
  $("callouts").append(label);
  return label;
});
const connectionCallouts = [["pnsInterior", "核周隙", 140, -140], ["erInterior", "内质网腔", -150, 100], ["connection", "核外膜接头", -155, -100]].map(([key2, name, dx, dy]) => {
  const el = document.createElement("div");
  el.className = "callout connection-callout";
  el.innerHTML = '<span class="callout-point"></span><span class="callout-line"></span><button class="callout-name"></button>';
  el.lastChild.textContent = name;
  el.hidden = true;
  $("callouts").append(el);
  return { el, key: key2, dx, dy };
});
function placeCallout(el, x, y, dx, dy, width, height, occupied) {
  const label = el.lastChild, w = Math.max(64, label.offsetWidth), h = Math.max(26, label.offsetHeight), half = w / 2, top = Math.max(80, $("subtitle").getBoundingClientRect().bottom + 10), bottom = height - 44;
  const overlap = (a, b) => a.left < b.right + 8 && a.right > b.left - 8 && a.top < b.bottom + 8 && a.bottom > b.top - 8;
  const candidates = [[dx, dy], [-dx, dy], [dx, -dy], [-dx, -dy], [0, -110], [0, 110]].map(([ox, oy], i) => {
    const px = THREE.MathUtils.clamp(x + ox, half + 10, width - half - 10), py = THREE.MathUtils.clamp(y + oy, top + h / 2, bottom - h / 2), rect = { left: px - half, right: px + half, top: py - h / 2, bottom: py + h / 2 };
    return { px, py, rect, score: occupied.filter((r) => overlap(rect, r)).length * 1e5 + i * 5 + Math.hypot(px - x - dx, py - y - dy) };
  }).sort((a, b) => a.score - b.score);
  const chosen = candidates[0];
  occupied.push(chosen.rect);
  el.style.left = `${x}px`;
  el.style.top = `${y}px`;
  label.style.left = `${chosen.px - x}px`;
  label.style.top = `${chosen.py - y - h / 2}px`;
  const line = el.querySelector(".callout-line"), lx = chosen.px - x, ly = chosen.py - y;
  line.style.width = `${Math.hypot(lx, ly)}px`;
  line.style.transform = `rotate(${Math.atan2(ly, lx)}rad)`;
}
function updateCallouts() {
  uptakeControls?.updateLabels();
  const { width, height } = measure(), occupied = [];
  if (annotations && !annotations.visible) {
    $("callouts").hidden = true;
    return;
  }
  for (const { el, key: key2, dx, dy } of connectionCallouts) {
    el.hidden = state.view !== "detail" || !state.connectedER || state.micro || state.level === "surface" || Boolean(visibility&&!visibility.canShowLabel("er"));
    if (el.hidden) continue;
    const p = worldAnchor(key2).project(camera);
    el.hidden = p.z > 1 || Math.abs(p.x) > 1 || Math.abs(p.y) > 1;
    if (el.hidden) continue;
    placeCallout(el, (p.x * 0.5 + 0.5) * width, (-p.y * 0.5 + 0.5) * height, dx, dy, width, height, occupied);
  }
  if (state.view !== "whole") {
    for (const el of document.querySelectorAll("[data-callout],.viral-callout")) el.hidden = true;
    return;
  }
  const viralLabels = state.scenario === "virus" ? presentedViralLabels() : [];
  let previous = null;
  for (const [i, label] of viralCallouts.entries()) {
    const item = viralLabels[i];
    label.hidden = !item?.visible || !item.allowed;
    if (label.hidden) continue;
    const p = item.position.clone().project(camera);
    label.hidden = p.z > 1 || Math.abs(p.x) > 1.04 || Math.abs(p.y) > 1.04;
    if (label.hidden) continue;
    const shortNames = { virus: "包膜颗粒", entry: "膜内陷/裂分省略", endosome: "内体", "no-leak": "内体腔", "conditional-rna": "条件支路：胞质RNA", mavs: "RIG-I · MAVS", irf3: "IRF3 · 核孔", ifnb1: "IFNB1 转录", secretion: "IFN 加工/分泌状态", "signal-meaning": "出芽/融合中间态省略", ifnar: "IFNAR", isg: "ISG 应答" };
    label.textContent = item.id === "virus" ? (viral.getDiagnostics().uptakeState === "external" ? "胞外包膜颗粒" : "已内化颗粒") : item.shortText ?? shortNames[item.id] ?? item.text;
    const step = String(Math.max(0, phaseIndex));
    if (label.dataset.scenarioStep !== step) {
      label.dataset.scenarioStep = step;
      annotations?.bindLabel(label, { scenarioIndex: Number(step) });
    }
    const x = THREE.MathUtils.clamp((p.x * 0.5 + 0.5) * width, 150, width - 150);
    let y = THREE.MathUtils.clamp((-p.y * 0.5 + 0.5) * height, 80, height - 54);
    if (previous && Math.abs(x - previous.x) < 270 && Math.abs(y - previous.y) < 48) y = Math.min(height - 54, previous.y + 52);
    label.style.left = `${x}px`;
    label.style.top = `${y}px`;
    previous = { x, y };
  }
  for (const b of document.querySelectorAll("[data-callout]")) {
    if (state.scenario === "virus" || state.section === 0 && (visibility?.canShowLabel("membrane") ?? true) || state.userClearView&&state.skeletonFocus || visibility&&!visibility.canShowLabel(b.dataset.callout)) {
      b.hidden = true;
      continue;
    }
    const item = whole.organelleLocations instanceof Map ? whole.organelleLocations.get(b.dataset.callout) : whole.organelleLocations[b.dataset.callout];
    if (!item) {
      b.hidden = true;
      continue;
    }
    const p = item.position.clone().project(camera);
    b.hidden = p.z > 1 || Math.abs(p.x) > 0.9 || Math.abs(p.y) > 0.9;
    if (b.hidden) continue;
    const dx = b.dataset.callout === "nucleus" ? -150 : 108, dy = b.dataset.callout === "nucleus" ? -136 : -92;
    placeCallout(b, (p.x * 0.5 + 0.5) * width, (-p.y * 0.5 + 0.5) * height, dx, dy, width, height, occupied);
  }
}
visibility=createAtlasVisibility({container:$("visibility-host"),whole,onBeforeHide:async({keys,hidesCurrent,canShowAfter})=>{uptakeControls?.beforeHide(canShowAfter);if(state.scenario==="virus"&&state.view==="whole"&&!navigation&&state.viralFocused&&!viralFocusedTargetVisible(canShowAfter)){transition=null;clearOrbitMomentum();reactionFocus?.leave("hidden");state.viralFocused=false;state.viralFocusLabelId=null;frameWhole();}if(hidesCurrent || activeFocusWillHide(canShowAfter) || state.connectedER&&(keys.includes("nucleus")||keys.includes("er"))){await new Promise(resolve=>{visibilityReturnWaiters.push(resolve);returnWhole();});}annotations?.close();},onChange:()=>{steady.setVisibilityFilter?.(id=>visibility.canShowLabel(id));syncUI();},onError:error=>{errors.push("Visibility: "+error.message);$("status").textContent="隐藏操作未完成，可重试或恢复全部。";}});
cytoskeletonNetwork=createCytoskeletonNetwork({THREE,whole,detail:true});
cytoplasmMotion=createCytoplasmMotion({THREE,whole,membraneQueries:cytoskeletonNetwork.debug.membraneQueries});
const motionControl=document.createElement("label");motionControl.className="cytoplasm-motion-control";
motionControl.innerHTML='<input id="cytoplasm-motion-toggle" type="checkbox" checked>淡淡胞质微动 · 随播放显示';
motionControl.title="局部缓慢回旋与扰动的教学表现，不是整颗巨噬细胞的统一环流。";
$("relationship-note").insertAdjacentElement("afterend",motionControl);
$("cytoplasm-motion-toggle").addEventListener("change",e=>{cytoplasmMotion.setEnabled(e.target.checked);requestRender();});
const legacySkeletonArchive=new THREE.Group();legacySkeletonArchive.name="LegacyCytoskeletonArchive";legacySkeletonArchive.visible=false;whole.group.add(legacySkeletonArchive);
for(const {object}of cytoskeletonNetwork.replacementTargets)legacySkeletonArchive.add(object);
whole.group.add(cytoskeletonNetwork.group);cytoskeletonNetwork.group.visible=true;
configureMaterialGroup(cytoskeletonNetwork.group);prepareShadows(cytoskeletonNetwork.group);
cytoskeletonNetwork.setSectionPlanes(whole.group.getObjectByName("ClosedOrganicMembraneWith36Pseudopods").material[0].clippingPlanes);
visibility.registerScenario(cytoskeletonNetwork,{id:"cytoskeleton-network"});
visibility.registerExternal(steady.group,{key:"collaboration"});
visibility.registerScenario(viral);
surfaceDetail=createAtlasSurfaceDetail({THREE:{DataTexture:THREE.DataTexture,RGBAFormat:THREE.RGBAFormat,UnsignedByteType:THREE.UnsignedByteType,RepeatWrapping:THREE.RepeatWrapping,LinearFilter:THREE.LinearFilter,LinearMipmapLinearFilter:THREE.LinearMipmapLinearFilter,NoColorSpace:THREE.NoColorSpace},mode:"conservative",requestRender});
surfaceDetail.apply(whole.group);surfaceDetail.apply(viral.group);
uptakeControls=createUptakeControls({state,scene,whole,camera,controls,renderer,visibility,configureMaterialGroup,prepareShadows,requestRender,animatePose,cancelTransition:()=>{transition=null;clearOrbitMomentum();},isAnnotationsVisible:()=>annotations?.visible??true,isNavigating:()=>Boolean(navigation),frameWhole,syncUI,setupPhases});
const originalWholeSetSection=whole.setSection;
whole.setSection=(...args)=>{const result=originalWholeSetSection(...args);visibility.refreshWhole();return result;};
reactionFocus=createReactionFocus({THREE,state,viral,whole,camera,controls,canShow:id=>visibility.canShowLabel(id),canUseActor:object=>visibility.canUseForFocus(object),isNavigating:()=>Boolean(navigation),isTransitioning:()=>Boolean(transition),animate:(pose,options)=>animatePose(pose.position,pose.target,options.duration,{pose,arc:options.arc}),cancelTransition:()=>{transition=null;clearOrbitMomentum();},requestRender,onChange:()=>syncUI()});
classroomOverlay=createClassroomOverlay({THREE,container:document.querySelector(".atlas"),camera,measure,getLesson:classroomLesson,onSeekStage:seekTeachingStage,onSeekSubstep:index=>{const steps=viral.getTeachingSteps(),step=steps[index];if(step)seekTeachingProgress(step.at+((steps[index+1]?.at??1)-step.at)*.45);}});
contentOverlay=createOrganelleContentOverlay({THREE,container:document.querySelector('.atlas'),camera,measure,getContext:()=>({model:active,visible:state.view==='detail'&&!navigation&&(!state.micro||state.selected==='membrane')&&(annotations?.visible??true)})});
$("journey-heading").before($("viral-lesson-selector"));
document.querySelectorAll("[data-viral-lesson]").forEach(b=>b.addEventListener("click",()=>setViralLesson(b.dataset.viralLesson)));
annotations = createAtlasAnnotations({ sidebar: document.querySelector(".sidebar"), footer: document.querySelector(".sidebar-footer"), guides: STRUCTURE_GUIDE, scenarios: SCENARIO_GUIDE, canShowPart: id => visibility?.canShowLabel(id) ?? true, onInspect: (id) => viewModel(id), onChange: () => syncUI() });
for (const button of document.querySelectorAll("[data-annotation-id]")) button.addEventListener("click",()=>viewModel(button.dataset.annotationId));
const connectionFeatureIndex = STRUCTURE_GUIDE.er.features.findIndex((feature) => feature.name.includes("核周隙"));
for (const { el } of connectionCallouts) annotations.bindLabel(el.lastChild, { id: "er", featureIndex: connectionFeatureIndex });
$("connection-button").addEventListener("click", () => {
  if(navigation||activeId!=="er")return;
  state.erConnectionFocus=!state.erConnectionFocus;state.level="surface";state.micro=false;state.section=0;active.setObservationFocus?.(null);active.setSection(0);microTextureScale(false);
  fitDetail(new THREE.Vector3(.18,.13,1),true);syncUI();
});
$("smooth-er-button").addEventListener("click",()=>{
  if(navigation||activeId!=="er"||!active?.anchors.smoothERCamera)return;
  active.setObservationMode?.(false);active.setObservationFocus?.(null);state.erConnectionFocus=false;microTextureScale(false);const fromSection=active.group.userData.section??state.section;
  state.level="surface";state.micro=false;state.patchSurface=false;state.section=0;
  const wall=active.group.getObjectByName(state.connectedER?"PerforatedDoubleNuclearMembrane":"OneContinuousFoldedERMembrane");
  const {width,height}=measure(),framing=fitSmoothEROverview({mesh:wall,connectedER:state.connectedER,camera,width,height});
  const {position,target,distance}=framing,scale=activeScale();
  active.group.userData.smoothERFraming=framing.diagnostics;
  const pose={position,target,near:Math.max(1e-5,.002*scale),far:110,minDistance:Math.max(.02*scale,distance*.10),maxDistance:Math.max(distance*4,active.radius*scale*8)};
  animatePose(position,target,.65,{pose,arc:true,sectionFrom:fromSection,sectionTo:0});syncUI();
  $("status").textContent="观察无附着核糖体的光面内质网管网；与粗面域共用连续腔。";
});

$("back-button").addEventListener("click", returnWhole);
$("micro-button").addEventListener("click", toggleMicro);
$("surface-patch-button").addEventListener("click",()=>viewModel(CELL_SURFACE_PATCH_ID));
explorationControls=createExplorationControls({THREE,state,whole,network:cytoskeletonNetwork,camera,controls,visibility,isNavigating:()=>Boolean(navigation),animatePose,requestRender,syncUI,switchScenario,uptakeControls,viral,reactionFocus});
learningControls=createDetailLearningControls({state,getActive:()=>active,getGuide:()=>STRUCTURE_GUIDE[state.selected],isNavigating:()=>Boolean(navigation),viewModel,requestRender,syncUI,onPlaybackEdit:()=>inspectionPlayChanged=true,fusionIds:FUSION_IDS,onMembraneView(mode){
  if(navigation||state.view!=='detail'||state.selected!=='membrane')return;
  if(mode==='bilayer'){state.level='inside';state.micro=false;toggleMicro();}
  else setLevel(mode);
},focusAnchor(entry){
  if(!active||navigation)return;
  if(entry.id==="smooth-er"){$("smooth-er-button").click();return;}
  if(!active.anchors[entry.camera]||!active.anchors[entry.target])return;
  active.setObservationMode?.(false);active.setObservationFocus?.(entry.id);state.erConnectionFocus=false;const fromSection=active.group.userData.section??state.section;
  state.level=entry.inside?"inside":"surface";state.micro=entry.micro??Boolean(entry.inside);state.patchSurface=false;state.section=entry.section??0;microTextureScale(state.micro);
  const position=worldAnchor(entry.camera),target=worldAnchor(entry.target),scale=activeScale(),distance=position.distanceTo(target);
  const pose={position,target,near:Math.max(1e-6,Math.min(.002*scale,distance*.015)),far:110,minDistance:Math.max(1e-6,distance*.06),maxDistance:active.radius*scale*5};
  animatePose(position,target,.75,{pose,arc:!entry.inside,sectionFrom:fromSection,sectionTo:state.section,closeLate:Boolean(entry.inside)});syncUI();$("subtitle").textContent=catalog[state.selected].name+" · "+entry.title;
}});
surfaceActivity=createSurfaceActivityControls({THREE,state,getActive:()=>active,isNavigating:()=>Boolean(navigation),visibility,setDetailTime:v=>detailTime=v,markPlaybackEdit:()=>inspectionPlayChanged=true,animatePose,requestRender,syncUI});
steadyControls=createSteadyLessonControls({THREE,container:document.querySelector('.atlas'),camera,measure,model:steady,onSeekStage:seekSteadyStep});
exhibitionLayout=createExhibitionLayout({state,onContextChange:syncSteadyContext});
$("surface-motion-button").addEventListener("click",()=>{
 if (navigation || !surfaceTargetVisible()) return;
 const isSurface=state.selected===CELL_SURFACE_PATCH_ID;
 if(isSurface&&active.updateLOD){surfaceActivity.focusLateral();return;}
 const actor=active.group.getObjectByName(isSurface?"SurfaceDiffusionProteinFree":"GenericTransmembranePositionSymbol1");if(!actor)return;
 active.group.updateWorldMatrix(true,true);
 const target=actor.getWorldPosition(new THREE.Vector3());
 const normal=new THREE.Vector3().fromArray(actor.userData.surfaceNormal).applyNormalMatrix(new THREE.Matrix3().getNormalMatrix(active.group.matrixWorld)).normalize();
 if(isSurface){const other=active.group.getObjectByName("SurfaceDiffusionProteinConfined");if(other)target.add(other.getWorldPosition(new THREE.Vector3())).multiplyScalar(.5);}
 const tangent=(isSurface?new THREE.Vector3(0,-1,0):new THREE.Vector3(1,.2,.1)).transformDirection(active.group.matrixWorld),scale=activeScale();
 const position=target.clone().addScaledVector(normal,(isSurface?2.2:.43)*scale).addScaledVector(tangent,(isSurface ? 0.45 : 0.19)*scale);
 state.patchSurface=true;state.micro=false;state.level="inside";state.section=0;microTextureScale(false);active.setSection(0);
 const pose={position,target,near:Math.max(1e-6,.001*scale),far:110,minDistance:.03*scale,maxDistance:active.radius*scale*4};
 animatePose(position,target,.65,{pose});syncUI();
});

$("play-button").addEventListener("click", () => {
  if (navigation) return;
  if (state.view === "detail") {
    inspectionPlayChanged = true;
    state.playing = !state.playing;
    syncUI();
    return;
  }
  if (state.progress >= 1) {
    state.progress = 0;
    if (state.scenario === "virus"){if(isEntryLesson())viralEntry.seek(0);else {viral.seek?.(0);reactionFocus?.timelineChanged("replay");reactionFocus?.focus();}}
  }
  state.playing = !state.playing;
  syncUI();
});
$("speed-select").addEventListener("change", (e) => state.speed = Number(e.target.value));
$("section-range").addEventListener("input", (e) => {
  if (navigation) return;
  if (transition) {
    poseSettings(transition.destination);
    transition = null;
  }
  requestRender();
  state.section = Number(e.target.value) / 100;
  if (isEntryLesson())viralEntry.setSection(state.section);
  else if (active) active.setSection(state.section);
  else if(!uptakeControls?.section(state.section))whole.setSection(state.section);
  $("section-range").style.setProperty("--value", `${state.section * 100}%`);
  if (state.level === "surface" && state.section > 0) {
    state.level = "section";
    syncUI();
  }
});
$("time-range").addEventListener("input", (e) => {
  if (navigation || state.view === "detail") return;
  seekTeachingProgress(Number(e.target.value)/1e3);
});
$("reset-button").addEventListener("click", reset);
$("follow-button").addEventListener("click", () => {
  if (navigation || state.view !== "whole") return;
  if(state.scenario === "clearance"){uptakeControls.setLocal(!state.uptakeLocal);return;}
  if(state.scenario === "structure"){
    state.steadyOverview=!state.steadyOverview;state.playing=false;syncUI();
    $("status").textContent=state.steadyOverview?'整胞位置参考；局部教学场景已隐藏。':'局部协作演示；按步骤观察实际货物和交接。';
  } else if (state.scenario === "virus") {
    if(isEntryLesson()){reset();return;}
    state.cameraHome = false;
    const focused=reactionFocus?.isReceptor()?reactionFocus.toggleSide():reactionFocus?.focus();if(!focused)return;
    $("status").textContent = "镜头跟随实际反应对象；拖动或滚轮可随时接管视角";
    syncUI();
  } else if (state.following) {
    reset();
  } else {
    state.following = true;
    state.cameraHome = false;
    const t = whole.organelleLocations.get("phagosome").position.clone();
    controls.minDistance = 1.5;
    animatePose(t.clone().add(new THREE.Vector3(0, 0.75, 8.8)), t);
    syncUI();
    $("status").textContent = "相机正在跟随吞噬体，播放可观察其运输过程。";
  }
});
$("structure-tab").addEventListener("click",()=>switchScenario("structure"));
$("clearance-tab").addEventListener("click", () => switchScenario("clearance"));
$("virus-tab").addEventListener("click", () => switchScenario("virus"));
$("help-button").addEventListener("click", () => $("help-dialog").showModal());
$("help-close").addEventListener("click", () => $("help-dialog").close());
$("fullscreen-button").addEventListener("click", () => {
  if (document.fullscreenElement) document.exitFullscreen();
  else document.documentElement.requestFullscreen().catch(() => {
  });
});
function setQuality(quality) {
  state.quality = quality;
  cytoskeletonNetwork?.setQuality(quality==="high"?"high":"low");
  cytoplasmMotion?.setQuality(quality);
  renderer.setPixelRatio({ low: 1, balanced: 1.25, high: 1.5 }[quality]);
  composer.setPixelRatio({ low: 1, balanced: 1.25, high: 1.5 }[quality]);
  ao.enabled = quality !== "low" && !state.micro;
  $("quality-label").textContent = { low: "流畅", balanced: "均衡", high: "精细" }[quality];
  resize();
}
$("quality-button").addEventListener("click", () => setQuality({ high: "balanced", balanced: "low", low: "high" }[state.quality]));
window.addEventListener("resize", resize);
document.addEventListener("visibilitychange", () => {
  if (!document.hidden) requestRender();
});
window.addEventListener("keydown", (e) => {
  const focused = document.activeElement;
  if (focused?.tagName === "SELECT" || focused?.tagName === "TEXTAREA" || focused?.tagName === "INPUT" && focused.type !== "range") return;
  if (e.key === "Escape" && !$("help-dialog").open) {if(isEntryLesson())reset();else if(state.uptakeLocal)uptakeControls.setLocal(false);else returnWhole();}
  if (e.key.toLowerCase() === "r") reset();
  if (e.code === "Space") {
    e.preventDefault();
    $("play-button").click();
  }
});
let down = null;
renderer.domElement.addEventListener("pointerdown", (e) => {
  if (navigation) {
    down = null;
    return;
  }
  if (transition) poseSettings(transition.destination);
  transition = null;
  reactionFocus?.pointerStart();
  down = { x: e.clientX, y: e.clientY, pointerId: e.pointerId, moved: false };
});
renderer.domElement.addEventListener("pointermove", (e) => {
  if (down?.pointerId === e.pointerId && Math.hypot(e.clientX - down.x, e.clientY - down.y) > 4) {
    if(!down.moved){reactionFocus?.manualInterrupt("drag");explorationControls?.leaveSkeleton();}
    down.moved = true;
    state.cameraHome = false;
    uptakeControls?.markUserView();
  }
});
renderer.domElement.addEventListener("pointercancel", () => {
  reactionFocus?.pointerEnd();down = null;
});
renderer.domElement.addEventListener("wheel", () => {
  if (controls.enabled) {reactionFocus?.manualInterrupt("wheel");explorationControls?.leaveSkeleton();state.cameraHome = false;uptakeControls?.markUserView();}
}, { capture: true, passive: true });
renderer.domElement.addEventListener("pointerup", (e) => {
  if (!down || down.pointerId !== e.pointerId) return;
  const gesture = down;
  reactionFocus?.pointerEnd();down = null;
  if (gesture.moved || Math.hypot(e.clientX - gesture.x, e.clientY - gesture.y) > 4) {
    state.cameraHome = false;
    return;
  }
  if(isEntryLesson())return;
  if(state.view==="detail"&&active?.metadata?.secretoryDetails&&!navigation){
    const rect=renderer.domElement.getBoundingClientRect();mouse.set((e.clientX-rect.left)/rect.width*2-1,-(e.clientY-rect.top)/rect.height*2+1);raycaster.setFromCamera(mouse,camera);
    for(const hit of raycaster.intersectObject(active.group,true)){
      let shown=true;for(let node=hit.object;node;node=node.parent)if(!node.visible){shown=false;break;}if(!shown||hit.object.userData.pickThrough)continue;
      const mat=Array.isArray(hit.object.material)?hit.object.material[hit.face?.materialIndex??0]:hit.object.material;if(!mat||mat.visible===false||mat.opacity<.025||mat.clippingPlanes?.some(p=>p.distanceToPoint(hit.point)<-1e-5))continue;
      const domain=hit.object.userData.secretoryDomainByMaterial?.[hit.face?.materialIndex??0]??hit.object.userData.secretoryDomain;
      if(domain)learningControls?.focusById(domain);break;
    }return;
  }
  if (state.view !== "whole") return;
  if(state.uptakeLocal&&uptakeControls.pick(e))return;
  const rect = renderer.domElement.getBoundingClientRect();
  mouse.set((e.clientX - rect.left) / rect.width * 2 - 1, -(e.clientY - rect.top) / rect.height * 2 + 1);
  raycaster.setFromCamera(mouse, camera);
  const hits = raycaster.intersectObjects(whole.pickables, true);
  for (const hit of hits) {
    if (hit.object.userData.pickThrough) continue;
    let shown = true;
    for (let node = hit.object; node; node = node.parent) if (!node.visible) {
      shown = false;
      break;
    }
    if (!shown) continue;
    const mat = Array.isArray(hit.object.material) ? hit.object.material[hit.face?.materialIndex ?? 0] : hit.object.material;
    if(mat?.visible===false || (typeof mat?.opacity === "number"&&mat.opacity<.025))continue;
    if (mat?.clippingPlanes?.length && (mat.clipIntersection ? mat.clippingPlanes.every((p) => p.distanceToPoint(hit.point) < -1e-5) : mat.clippingPlanes.some((p) => p.distanceToPoint(hit.point) < -1e-5))) continue;
    let item = hit.object, id = hit.object.userData.organelleByMaterial?.[hit.face?.materialIndex ?? 0] ?? null;
    while (item && !id) {
      id = item.userData.organelleId;
      item = item.parent;
    }
    const compartment = whole.components.phagosome;
    if (id === 'lysosome' && compartment.fusionWall.userData.fusion.joined &&
      (hit.object === compartment.fusionWall || descendant(hit.object, compartment.dockingContents)) &&
      (!visibility || visibility.canInspect('phagosome'))) id = 'phagosome';
    if (id && catalog[id] && (!visibility||visibility.canInspect(id))) {
      viewModel(id, { hit });
      break;
    }
  }
});
function animate(now) {
  requestAnimationFrame(animate);
  const frameMs = now - last, raw = Math.min(frameMs / 1e3, 0.1), dt = state.playing && !reactionFocus?.shouldHoldTimeline() ? raw * state.speed : 0;
  last = now;
  fpsWindow.push(frameMs);
  if (fpsWindow.length > 240) fpsWindow.shift();
  if (dt > 0 && !navigation) {
    requestRender();
    if (state.view === "whole") {
      state.ambientTime += dt;
      if(state.scenario !== "structure")state.time += dt;
      if(state.scenario !== "structure"||steadyLessonActive) state.progress = Math.min(1, state.progress + dt / (state.scenario === "structure" ? steady.duration : state.scenario === "virus" ? isEntryLesson()?viralEntry.duration:64 : 48));
      if (state.progress >= 1) {
        state.playing = false;
        syncUI();
      }
      syncPhase();
    } else detailTime += dt;
  }
  if (transition) {
    requestRender();
    const a = transition;
    a.elapsed += raw;
    const t = Math.min(a.elapsed / a.duration, 1), e = t * t * (3 - 2 * t);
    controls.target.lerpVectors(a.targetFrom, a.targetTo, e);
    if (a.options.arc) {
      const rotation = new THREE.Quaternion().slerp(a.rotation, e), offset = a.offset.clone().normalize().applyQuaternion(rotation).multiplyScalar(THREE.MathUtils.lerp(a.offset.length(), a.nextOffset.length(), e));
      camera.position.copy(controls.target).add(offset);
    } else camera.position.lerpVectors(a.from, a.to, e);
    camera.near = Math.exp(THREE.MathUtils.lerp(Math.log(a.fromPose.near), Math.log(a.destination.near), e));
    camera.far = THREE.MathUtils.lerp(a.fromPose.far, a.destination.far, e);
    camera.updateProjectionMatrix();
    if (active && a.options.sectionFrom !== void 0) {
      let sectionEase = e;
      if (a.options.closeLate) sectionEase = THREE.MathUtils.smoothstep(t, 0.6, 1);
      let amount = THREE.MathUtils.lerp(a.options.sectionFrom, a.options.sectionTo, sectionEase);
      if (a.options.openDuringRetreat) amount = t < 0.6 ? THREE.MathUtils.lerp(a.options.sectionFrom, 0.8, THREE.MathUtils.smoothstep(t, 0, 0.6)) : THREE.MathUtils.lerp(0.8, a.options.sectionTo, THREE.MathUtils.smoothstep(t, 0.6, 1));
      active.setSection(amount);
    }
    if (t === 1) {
      transition = null;
      camera.position.copy(a.to);
      controls.target.copy(a.targetTo);
      poseSettings(a.destination);
      if (active && a.options.sectionTo !== void 0) active.setSection(a.options.sectionTo);
      try {
        a.options.onComplete?.();
      } catch (error) {
        navigationFailure(error);
      }
    }
  }
  if (navigation && (navigation.phase === "fade-in" || navigation.phase === "fade-out")) {
    requestRender();
    navigation.elapsed += raw;
    const t = Math.min(1, navigation.elapsed / 0.20);
    blendPass.uniforms.amount.value = t * t * (3 - 2 * t);
    if (t === 1) {
      blendPass.enabled = false;
      capturePass.finishResize();
      const complete = navigation.fadeComplete;
      navigation.fadeComplete = null;
      try {
        complete?.();
      } catch (error) {
        navigationFailure(error);
      }
    }
  }
  // New uptake paths are local representative constructions; never drive a large cargo through the intact whole membrane.
  const wp = uptakeControls?.getWholeProgress()??0.38;
  if (wp !== appliedWholeProgress) {
    whole.setProgress?.(wp);
    appliedWholeProgress = wp;
    requestRender();
  }
  if (state.scenario === "virus" && state.progress !== appliedViralProgress) {
    appliedViralProgress = state.progress;
    requestRender();
  }
  if (state.following && !transition && !navigation && state.view === "whole" && state.scenario === "clearance") {
    const target = whole.organelleLocations.get("phagosome").position, delta = target.clone().sub(controls.target).multiplyScalar(1 - Math.exp(-raw * 9));
    if (delta.lengthSq() > 1e-12) {
      camera.position.add(delta);
      controls.target.add(delta);
      requestRender();
    }
  }
  controls.update();
  if (!needsRender) {
    skippedFrames++;
    return;
  }
  // Isolated molecular lessons must not animate the hidden whole-cell atlas.
  // Absolute host time is retained, so returning to it resumes its own pose.
  if(whole.group.visible){
    whole.update(state.ambientTime, state.view === "whole" && !navigation && !state.uptakeLocal ? dt : 0);
    cytoplasmMotion?.update(state.ambientTime,state.view === "whole" && !navigation && !state.uptakeLocal ? dt : 0);
    if(cytoskeletonNetwork?.group.visible)cytoskeletonNetwork.update(state.ambientTime,navigation?0:dt);
  }
  if (state.scenario === "virus") {
    if(isEntryLesson())viralEntry.seek(state.progress);
    else {viral.setProgress(state.progress);viral.update(state.time, state.view === "whole" && !navigation ? dt : 0);}
  }
  if(!isEntryLesson())reactionFocus?.update(raw);
  updateClassroomISGWindow();
  if (state.scenario === "structure") {steady.seek(state.progress);steady.update();steadyControls?.update();}
  if (active && state.view === "detail") active.update(detailTime, navigation ? 0 : dt);
  learningControls?.update();
  updateMembraneActivityStatus();
  surfaceActivity?.updateLOD(camera,renderer.domElement.clientHeight);surfaceActivity?.update();
  const detailScale = active && state.view === "detail" ? activeScale() : 1;
  ao.kernelRadius = 0.62 * detailScale;
  ao.minDistance = 15e-4 * detailScale;
  ao.maxDistance = 0.25 * detailScale;
  ao.enabled = state.quality !== "low" && !state.micro;
  const focusEnabled=Boolean(state.userClearView)&&state.scenario!=="virus"&&isReceptorFocus()&&!navigation&&!transition&&ao.enabled;
  if(focusEnabled){camera.updateMatrixWorld();const receptor=viral.group.getObjectByName("SurfaceIFNAR1IFNAR2SchematicReceptor");const depth=-(reactionFocus?.focusPoint()??receptor.getWorldPosition(new THREE.Vector3())).applyMatrix4(camera.matrixWorldInverse).z;focusDOF.setFocus({enabled:true,cameraNear:camera.near,cameraFar:camera.far,focusDistance:Math.max(camera.near,depth),focusRange:.32,focusFalloff:.85,maxBlurCSS:5});}
  else focusDOF.setFocus({enabled:false});
  visibility?.syncMaterials();
  composer.render();
  uptakeControls?.update();
  updateCallouts();
  classroomOverlay?.update();
  contentOverlay?.update();
  renderedFrames++;
  lastRenderAt = now;
  needsRender = false;
  const afterRender = afterHandoffRender;
  afterHandoffRender = null;
  if (afterRender) afterRender();
}
switchScenario("clearance");
state.progress=0;
syncUI();
setQuality("high");
const fusionWarmup={complete:false,passes:0,milliseconds:0};
const responseWarmup={complete:false,passes:0,milliseconds:0};
async function prepareResponseRendering(){
  // First-use uploads and AO/clipping programs otherwise stall the response
  // when an actor first appears. Prepare its allocated meshes under the loader.
  const started=performance.now(),roots=scene.children.map(o=>[o,o.visible]),savedCamera=camera.clone();
  const savedProgress=viral.getDiagnostics().progress,objects=[],materials=new Map();
  viral.group.traverse(o=>{objects.push([o,o.visible,o.frustumCulled]);for(const m of Array.isArray(o.material)?o.material:[o.material])if(m&&!materials.has(m))materials.set(m,{visible:m.visible,clippingPlanes:m.clippingPlanes});});
  const product=isgPresentation.object,productMaterials=Array.isArray(product.material)?product.material:[product.material];
  const warmPlanes=[[1,0,0],[-1,0,0],[0,1,0],[0,-1,0],[0,0,1],[0,0,-1]].map(axis=>new THREE.Plane(new THREE.Vector3(...axis),100));
  try{
    for(const [o]of roots)o.visible=o.isLight===true;
    camera.position.set(0,0,24);camera.lookAt(0,0,0);camera.near=.005;camera.far=110;camera.updateProjectionMatrix();camera.updateMatrixWorld();
    for(const [i,p]of [.21,.987].entries()){
      viral.seek(p);
      viral.group.traverse(o=>{o.visible=true;o.frustumCulled=false;for(const m of Array.isArray(o.material)?o.material:[o.material])if(m)m.visible=true;});
      if(i===1)for(const m of productMaterials){m.clippingPlanes=warmPlanes;m.needsUpdate=true;}
      await renderer.compileAsync(viral.group,camera,scene);composer.render();responseWarmup.passes++;
      await new Promise(resolve=>requestAnimationFrame(resolve));
    }
    responseWarmup.complete=true;
  }finally{
    for(const [m,saved]of materials){m.visible=saved.visible;if(m.clippingPlanes!==saved.clippingPlanes){m.clippingPlanes=saved.clippingPlanes;m.needsUpdate=true;}}
    viral.seek(savedProgress);for(const [o,visible,frustumCulled]of objects){o.visible=visible;o.frustumCulled=frustumCulled;}
    for(const [o,visible]of roots)o.visible=visible;
    camera.copy(savedCamera,false);camera.updateMatrixWorld();responseWarmup.milliseconds=performance.now()-started;requestRender();
  }
}
async function prepareFusionRendering(){
  // Compile and draw both topologies while the initial loading cover is still
  // present. Shader compilation alone does not upload buffers or initialize
  // the AO/shadow variants used when the pore first becomes visible.
  const started=performance.now(),models=[viralEntry,loadDetail("snare-fusion",false)];
  const roots=scene.children.map(object=>[object,object.visible]),savedCamera=camera.clone();
  try{
    for(const model of models){
      const pose=model.getState(),objects=[],materials=new Map();
      model.group.traverse(object=>{objects.push([object,object.visible]);object.visible=true;for(const material of Array.isArray(object.material)?object.material:[object.material])if(material&&!materials.has(material)){materials.set(material,material.visible);material.visible=true;}});
      for(const [object]of roots)object.visible=object.isLight===true;
      for(let owner=model.group;owner&&owner!==scene;owner=owner.parent)owner.visible=true;
      camera.position.set(1.85,.82,4.35);camera.lookAt(0,0,0);camera.near=.012;camera.far=110;camera.updateProjectionMatrix();camera.updateMatrixWorld();
      try{
        model.seek(.9);await renderer.compileAsync(model.group,camera,scene);
        composer.render();fusionWarmup.passes++;
        model.seek(.35);composer.render();fusionWarmup.passes++;
        await new Promise(resolve=>requestAnimationFrame(resolve));
      }finally{
        model.seek(pose.progress);for(const [object,visible]of objects)object.visible=visible;for(const [material,visible]of materials)material.visible=visible;
      }
    }
    fusionWarmup.complete=true;
  }finally{
    for(const [object,visible]of roots)object.visible=visible;
    camera.copy(savedCamera,false);camera.updateMatrixWorld();
    fusionWarmup.milliseconds=performance.now()-started;requestRender();
  }
}
Promise.allSettled(textureReadiness.map((item) => item.ready)).then(async (results) => {
  const failedSources = /* @__PURE__ */ new Set();
  results.forEach((result, index) => {
    if (result.status === "rejected") {
      const item = textureReadiness[index];
      failedSources.add(item.texture.source);
      const message = "细节纹理加载失败：" + item.key;
      errors.push(message);
      console.warn(message, result.reason);
    }
  });
  if (failedSources.size) scene.traverse((object) => {
    for (const material of Array.isArray(object.material) ? object.material : [object.material]) {
      if (!material) continue;
      for (const key2 of Object.keys(material)) if (material[key2]?.isTexture && failedSources.has(material[key2].source)) {
        material[key2] = null;
        material.needsUpdate = true;
      }
    }
  });
  await prepareFusionRendering();
  await prepareResponseRendering();
  state.ready = true;
  last = performance.now();
  requestRender();
  $("loader").style.opacity = 0;
  setTimeout(() => $("loader").hidden = true, 550);
  $("status").textContent = failedSources.size ? "基础三维场景已就绪，部分艺术纹理未载入。" : `三维细胞已就绪：12种结构与${LOCAL_IDS.length}个代表性局部可探索`;
  requestAnimationFrame(animate);
});
function navigationDiagnostics() {
  const source = navigation?.source?.diagnostic ?? inspection?.source?.diagnostic ?? navigationLast.source ?? null;
  return { active: Boolean(navigation), phase: navigation?.phase ?? (inspection ? "detail-idle" : navigationLast.phase), direction: navigation?.direction ?? null, selected: navigation?.selected ?? activeId, source, matchedDetailMatrix: detailRoot.matrixWorld.toArray(), entryWhole: inspection ? { camera: inspection.entry.position.toArray(), target: inspection.entry.target.toArray(), near: inspection.entry.near, far: inspection.entry.far, minDistance: inspection.entry.minDistance, maxDistance: inspection.entry.maxDistance, section: inspection.section, progress: inspection.progress, playing: inspection.playing, cameraHome: inspection.cameraHome, aspect: inspection.aspect } : null, returnWhole: inspection?.returnWhole ?? navigationLast.returnWhole ?? null, macroProgressFrozen: Boolean(inspection), detailTime, pendingCommand: pendingCommand?.type ?? null, handoffPassesEnabled: Boolean(capturePass?.enabled || blendPass?.enabled), sectionOwnership: "Factory local planes and section bindings; factory alone maps planes by active.group.matrixWorld" };
}
window.addEventListener("pagehide", () => {
  steadyControls?.dispose();steady.dispose();exhibitionLayout?.dispose();
  learningControls?.dispose();
  cytoplasmMotion?.dispose();
  surfaceDetail?.dispose();
  classroomOverlay?.dispose();viralEntry.dispose();
  contentOverlay?.dispose();
  explorationControls?.dispose();if(cytoskeletonNetwork){whole.group.remove(cytoskeletonNetwork.group);cytoskeletonNetwork.dispose();}surfaceActivity?.dispose();reactionFocus?.dispose();focusDOF.dispose();
  capturePass?.dispose();
  blendPass?.dispose();
}, { once: true });
window.__atlas = { viralEntry,classroomOverlay,contentOverlay,steadyControls,cytoplasmMotion,cytoskeletonNetwork,explorationControls,surfaceActivity,reactionFocus,focusDOF,surfaceDetail,setSurfaceDetailMode:mode=>surfaceDetail.setMode(mode), visibility, steady, annotations, state, scene, camera, renderer, composer, controls, whole, viral, get uptake(){return uptakeControls?.model;},uptakeControls, detailRoot, detailCache, viewModel, setLevel, toggleMicro, returnWhole, reset, setQuality, requestRender, setMaterialPreset, diagnostics() {
  return { state: { ...state }, cytoplasmMotion:cytoplasmMotion?.diagnostics(),reactionFocus:reactionFocus?.diagnostics(),exploration:explorationControls?.diagnostics(),surfaceActivity:surfaceActivity?.diagnostics(),cytoskeletonNetwork:cytoskeletonNetwork?.diagnostics(),visibility:visibility?.diagnostics(), annotations: annotations?.diagnostics(), materials: { preset: materialPreset,surfaceDetail:surfaceDetail?.diagnostics(), whole: whole.group.userData.atlasMaterials, active: active?.group.userData.atlasMaterials }, depthFocus:focusDOF.diagnostics(),renderScheduling: { demandDriven: true, pending: needsRender, renderedFrames, skippedFrames, lastRenderAt }, transitioning: Boolean(transition || navigation), navigation: navigationDiagnostics(), errors: [...errors], viral: viral.getDiagnostics(), uptake:uptakeControls?.diagnostics(), render: { ...renderer.info.render }, memory: { ...renderer.info.memory }, camera: camera.position.toArray(), target: controls.target.toArray(), active: active ? { id: activeId, radius: active.radius, worldMatrix: active.group.matrixWorld.toArray(), anchors: Object.fromEntries(Object.entries(active.anchors).map(([k, v]) => [k, v.toArray()])), worldAnchors: Object.fromEntries(Object.entries(active.anchors).map(([k, v]) => [k, k.endsWith("Normal") ? v.clone().applyMatrix3(new THREE.Matrix3().getNormalMatrix(active.group.matrixWorld)).normalize().toArray() : v.clone().applyMatrix4(active.group.matrixWorld).toArray()])), stats: active.stats } : null, frameMs: fpsWindow.slice(-120) };
} };
window.__atlas.fusionWarmup=fusionWarmup;
window.__atlas.responseWarmup=responseWarmup;
