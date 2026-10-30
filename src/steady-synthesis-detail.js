// A local teaching reconstruction, informed by structural work rather than an
// atomistic or macrophage-specific EM segmentation. All motion is seekable.
import { addRibosomeDomains, addSec61Domains } from './protein-surface-detail.js';
export function buildSynthesisLesson(g, ctx) {
  const { THREE, V, clamp, ease, material, mesh, ball, rod, connect, tube,
    guideRoute, label, focus, getProgress } = ctx;
  const blue = 0x7398a0, pink = 0xbd847c, amber = 0xbe893d;
  const erMat = material(blue), erInner = material(0xa3bab8);
  const golgiMat = material(pink), golgiInner = material(0xd0a199);
  const purple = material(0x856b91), smallPurple = material(0xa48aaa);
  const cargoMat = material(amber), green = material(0x5f8c72);
  const coatMat = material(0xd0ac6a), innerCoatMat = material(0x8d986e);
  const local = { step: 0, u: 0, micro: null };
  const scratch = V(), axis = V(1, 0, 0);

  // Thick, curved sac: front wall has an observation cut. Its inner and outer
  // faces are separate meshes, joined by a broad cut edge, not transparent.
  function sac(parent, name, pos, halfWidth, halfHeight, depth, outerMat, innerMat, bow = 0) {
    const group = new THREE.Group(); group.name = name; group.position.copy(pos); parent.add(group);
    const n = 56, m = 16, wall = .035;
    function surface(inset) {
      const p = [], ix = [];
      // Use a proper rear half of an ellipsoid, with theta in the XY section
      // and radial depth, to avoid a coplanar paper-thin tray.
      for (let j = 0; j <= m; j++) {
        const zt = j / m, radial = Math.sqrt(Math.max(0, 1 - zt * zt));
        for (let i = 0; i <= n; i++) {
          const theta = 2 * Math.PI * i / n;
          const x = (halfWidth - inset) * Math.cos(theta) * radial;
          const softFold = .009 * Math.sin(x * 8) * Math.sin(zt * Math.PI) * Math.cos(theta * 2);
          p.push(x, (halfHeight - inset * .5) * Math.sin(theta) * radial + bow * (x * x / (halfWidth * halfWidth) - 1) + softFold, -(depth - inset) * zt);
        }
      }
      for (let j = 0; j < m; j++) for (let i = 0; i < n; i++) {
        const a = j * (n + 1) + i, b = a + n + 1;
        ix.push(a, b, a + 1, a + 1, b, b + 1);
      }
      const geo = new THREE.BufferGeometry(); geo.setAttribute('position', new THREE.Float32BufferAttribute(p, 3)); geo.setIndex(ix); geo.computeVertexNormals(); return geo;
    }
    const outside = mesh(group, name + 'OuterMembrane', surface(0), outerMat);
    const inside = mesh(group, name + 'LuminalMembraneFace', surface(wall), innerMat);
    outside.userData.compartmentBoundary = inside.userData.compartmentBoundary = true;
    outside.userData.observationCut = inside.userData.observationCut = true;
    const edge = [], edgeIndex = [];
    for (let i = 0; i <= n; i++) {
      const a = i / n * Math.PI * 2;
      for (const inset of [0, wall]) {
        const x = (halfWidth - inset) * Math.cos(a);
        edge.push(x, (halfHeight - inset * .5) * Math.sin(a) + bow * (x * x / (halfWidth * halfWidth) - 1), .003);
      }
      if (i < n) { const k = i * 2; edgeIndex.push(k, k + 1, k + 2, k + 2, k + 1, k + 3); }
    }
    const geo = new THREE.BufferGeometry(); geo.setAttribute('position', new THREE.Float32BufferAttribute(edge, 3)); geo.setIndex(edgeIndex); geo.computeVertexNormals();
    mesh(group, name + 'ObservationCutEdge', geo, outerMat).userData.observationCut = true;
    return group;
  }

  function ribosome(parent, name, at, scale = 1) {
    const group = new THREE.Group(); group.name = name; group.position.copy(at); group.scale.setScalar(scale); parent.add(group);
    addRibosomeDomains(group, name, purple, smallPurple, { active: name === 'ActiveRibosome80S' });
    return group;
  }
  function protein(parent, name, size = 1) {
    const group = new THREE.Group(); group.name = name; parent.add(group); group.scale.setScalar(size);
    const domains = [];
    for (let i = 0; i < 8; i++) {
      const object = ball(group, name + 'ProteinDomain' + i, .07 + (i % 3) * .012, cargoMat,
        V(Math.sin(i * 1.7) * .11, (i - 3.5) * .05, Math.cos(i * 1.31) * .065));
      domains.push(object);
    }
    return { group, domains };
  }
  function vesicle(parent, name, color = blue, radius = .34) {
    const group = new THREE.Group(); group.name = name; parent.add(group);
    const shellMat = material(color), lumenMat = material(color); lumenMat.color.lerp(new THREE.Color(0xd9dfd7), .32);
    // Both front and cap boundaries remain opaque; the missing front half is
    // explicitly a section, not a transparent biological membrane.
    const outer = mesh(group, name + 'CutawayMembrane', new THREE.SphereGeometry(radius, 40, 24, Math.PI, Math.PI), shellMat);
    mesh(group, name + 'InnerMembraneFace', new THREE.SphereGeometry(radius - .028, 40, 24, Math.PI, Math.PI), lumenMat);
    mesh(group, name + 'CutEdge', new THREE.TorusGeometry(radius - .014, .014, 6, 48), shellMat);
    outer.userData.compartmentBoundary = true; outer.userData.observationCut = true;
    group.userData.transportVesicle = true; return group;
  }
  function hollowNeck(parent, name, a, b, radius, mat) {
    const group = new THREE.Group(); group.name = name; parent.add(group);
    group.position.copy(a).add(b).multiplyScalar(.5);
    const outer = mesh(group, name + 'Outer', new THREE.CylinderGeometry(radius, radius, 1, 24, 1, true), mat);
    const inner = mesh(group, name + 'Inner', new THREE.CylinderGeometry(radius - .025, radius - .025, 1, 24, 1, true), erInner);
    const localA = a.clone().sub(group.position), localB = b.clone().sub(group.position);
    connect(outer, localA, localB); connect(inner, localA, localB); return group;
  }

  const er = new THREE.Group(); er.name = 'SteadyRERLocalExcerpt'; er.position.set(-2.9, .25, 0); g.add(er);
  for (let i = 0; i < 3; i++) {
    sac(er, 'RERCisterna' + i, V(0, (i - 1) * .49, -.07 * i), .86, i === 2 ? .205 : .135, .44, erMat, erInner, .095);
    for (let k = 0; k < 5; k++) ribosome(er, 'CytosolicBoundRibosome_' + i + '_' + k, V(-.64 + .31 * k, (i - 1) * .49 + .132, -.12 - .045 * (k % 2)), .65);
  }
  tube(er, 'SmoothERConnectedTubularExcerpt', [V(-.65, -.57, -.17), V(-.85, -.91, -.24), V(-.41, -1.03, -.29), V(-.11, -.87, -.36)], .067, erMat);
  const activeRibo = ribosome(er, 'ActiveRibosome80S', V(-.17, .62, -.26), 1.35);
  const translocon = new THREE.Group(); translocon.name = 'Sec61TransloconSchematic'; translocon.position.set(-.17, .62, -.26); er.add(translocon);
  const transloconMat = material(0x597d79);
  addSec61Domains(translocon, 'Sec61', transloconMat, material(0x78958a));
  const mRNA = tube(activeRibo, 'mRNAAlongSmallSubunit', [V(-.28, .2, .04), V(-.09, .23, .11), V(.1, .2, .12), V(.3, .16, .08)], .018, material(0x708c73));
  const erProtein = protein(er, 'NewSecretoryProteinInER', .64); erProtein.group.position.set(-.17, .39, -.245);
  const peptide = [];
  for (let i = 0; i < 20; i++) peptide.push(ball(er, 'NascentSecretoryPeptideSegment' + i, .027, cargoMat));
  const folded = erProtein.domains.map(object => object.position.clone());

  const golgi = new THREE.Group(); golgi.name = 'SteadyGolgiLocalExcerpt'; golgi.position.set(.02, .14, 0); g.add(golgi);
  const cisternae = [];
  for (let i = 0; i < 5; i++) {
    const outer = material(new THREE.Color(blue).lerp(new THREE.Color(pink), i / 4));
    const inner = outer.clone(); inner.color.lerp(new THREE.Color(0xe7d2bd), .35);
    cisternae.push(sac(golgi, 'GolgiProcessingCisterna' + i, V(0, .67 - .335 * i, -.09 * i), .77 + .07 * Math.sin(i), .112, .49, outer, inner, .12 + i * .018));
  }
  const transNetwork = new THREE.Group(); transNetwork.name = 'TransGolgiSortingTubules'; golgi.add(transNetwork);
  tube(transNetwork, 'TGNExitTubuleA', [V(.62, -.78, -.3), V(.97, -.76, -.22), V(1.01, -.46, -.18)], .064, golgiMat);
  tube(transNetwork, 'TGNExitTubuleB', [V(-.52, -.82, -.25), V(-.82, -.98, -.24), V(-.58, -1.13, -.18)], .06, golgiMat);
  const golgiProtein = protein(golgi, 'SameSecretoryCargoInGolgi', .6); golgiProtein.group.position.set(0, -.1, .12);
  // The selected cisterna is brought forward as a processing section. Its
  // changing identity represents maturation, not a protein crossing intact sacs.
  const processingMat = golgiMat.clone();
  const processing = sac(golgi, 'SelectedGolgiProcessingSection', V(0, -.05, .13), .73, .205, .27, processingMat, golgiInner, .06);
  const glycan = new THREE.Group(); glycan.name = 'SelectedCargoGlycanProcessingSymbols'; golgiProtein.group.add(glycan);
  const glycanNodes = [];
  for (let i = 0; i < 5; i++) {
    const a = V(.12 + .055 * i, .12 + .055 * i, .04), node = ball(glycan, 'GlycanResidueSymbol' + i, .036, green, a);
    glycanNodes.push(node);
    if (i > 0) rod(glycan, 'GlycanLinkSymbol' + i, V(.12 + .055 * (i - 1), .12 + .055 * (i - 1), .04), a, .012, green);
  }
  const enzyme = new THREE.Group(); enzyme.name = 'GolgiLuminalGlycanProcessingEnzyme'; enzyme.position.set(.39, .12, .22); golgi.add(enzyme);
  rod(enzyme, 'GolgiEnzymeMembraneAnchor', V(0, .06, 0), V(0, -.12, 0), .029, green);
  ball(enzyme, 'GolgiLuminalCatalyticDomain', .105, green, V(0, -.21, .01), V(.8, 1.1, .8));

  const transit = vesicle(g, 'TrackedSecretoryCarrier'), payload = protein(transit, 'PersistentSecretoryCargo', .68);
  payload.group.position.set(0, 0, -.07);
  const erNeck = hollowNeck(g, 'ERExitBudMembraneNeck', V(-2.06, .74, -.08), V(-1.75, .74, -.08), .13, erMat);
  const coat = new THREE.Group(); coat.name = 'COPIITwoLayerCoatSchematic'; transit.add(coat);
  const innerCoat = [], outerCoat = [];
  for (let i = 0; i < 12; i++) {
    const a = i / 12 * Math.PI * 2;
    innerCoat.push(ball(coat, 'Sar1Sec23Sec24InnerCoatUnit' + i, .052, innerCoatMat, V(Math.cos(a) * .365, Math.sin(a) * .365, -.01), V(1.15, .75, .8)));
    const b = a + Math.PI / 3;
    outerCoat.push(rod(coat, 'Sec13Sec31OuterCoatStrut' + i, V(Math.cos(a) * .43, Math.sin(a) * .43, -.03), V(Math.cos(b) * .43, Math.sin(b) * .43, -.03), .022, coatMat));
  }
  const tgnBudNeck = hollowNeck(g, 'TGNExitBudMembraneNeck', V(.78, -.57, -.12), V(1.03, -.57, -.12), .13, golgiMat);
  const firstRoute = guideRoute(g, 'ERToGolgiSequenceGuide', [V(-2.13, -.84, .1), V(-1.55, -1.13, .15), V(-.94, -.85, .1)], blue);
  const secondRoute = guideRoute(g, 'GolgiToSurfaceSequenceGuide', [V(1.15, -1.04, .1), V(2, -1.16, .15), V(2.84, -.75, .1)], pink);

  // The release patch has a real animated hole. Lipid membrane surfaces remain
  // opaque; the cargo can leave only after the fusion pore becomes wide enough.
  const surface = new THREE.Group(); surface.name = 'SteadySurfaceDeliveryMembrane'; surface.position.set(3.25, .18, 0); g.add(surface);
  const panelMat = material(0x91aaa1), innerPanelMat = material(0xb1bcb0);
  const panelSegments = 64, panelRadial = 6;
  function annulus(name, dx, mat) {
    const values = new Float32Array((panelSegments + 1) * (panelRadial + 1) * 3), indices = [];
    for (let j = 0; j < panelRadial; j++) for (let i = 0; i < panelSegments; i++) {
      const a = j * (panelSegments + 1) + i, b = a + panelSegments + 1;
      indices.push(a, a + 1, b, a + 1, b + 1, b);
    }
    const geo = new THREE.BufferGeometry(); geo.setAttribute('position', new THREE.BufferAttribute(values, 3).setUsage(THREE.DynamicDrawUsage)); geo.setIndex(indices);
    const object = mesh(surface, name, geo, mat); object.position.x = dx; object.frustumCulled = false;
    return object;
  }
  const panelA = annulus('SurfaceCytoplasmicLeafletWithFusionAperture', -.026, panelMat), panelB = annulus('SurfaceExtracellularLeafletWithFusionAperture', .026, innerPanelMat);
  function shapePanel(object, pore) {
    const attr = object.geometry.attributes.position;
    for (let j = 0; j <= panelRadial; j++) for (let i = 0; i <= panelSegments; i++) {
      const a = i / panelSegments * Math.PI * 2, r = pore + (1.04 - pore) * j / panelRadial;
      const depth = pore + (1.04 * .58 - pore) * j / panelRadial;
      attr.setXYZ(j * (panelSegments + 1) + i, .015 * Math.sin(a * 3) * j / panelRadial, r * Math.cos(a), depth * Math.sin(a));
    }
    attr.needsUpdate = true; object.geometry.computeVertexNormals();
  }
  // A rim across the two leaflets makes the pore boundary visible in section.
  const poreRim = mesh(surface, 'ContinuousFusionPoreLipidRim', new THREE.TorusGeometry(1, .028, 8, 48), panelMat); poreRim.rotation.y = Math.PI / 2;
  const docked = vesicle(g, 'DockedSecretoryVesicleBeforeFusion', pink, .36);
  const dockedPayload = protein(docked, 'DockedSecretoryProtein', .65); dockedPayload.group.position.z = -.07;
  const released = protein(g, 'ReleasedSecretoryCargo', .65); released.group.position.set(3.72, .18, -.06);
  const fusionShell = new THREE.Group(); fusionShell.name = 'FusedOmegaProfileMembrane'; g.add(fusionShell);
  const fusionSegments = 36, fusionRings = 18;
  function omega(name, radius, mat) {
    const positions = new Float32Array((fusionSegments + 1) * (fusionRings + 1) * 3), indices = [];
    for (let j = 0; j < fusionRings; j++) for (let i = 0; i < fusionSegments; i++) {
      const a = j * (fusionSegments + 1) + i, b = a + fusionSegments + 1;
      indices.push(a, b, a + 1, a + 1, b, b + 1);
    }
    const geo = new THREE.BufferGeometry(); geo.setAttribute('position', new THREE.BufferAttribute(positions, 3).setUsage(THREE.DynamicDrawUsage)); geo.setIndex(indices);
    const object = mesh(fusionShell, name, geo, mat); object.userData.radius = radius; object.frustumCulled = false; return object;
  }
  const omegaA = omega('FusedVesicleOuterMembrane', .36, golgiMat), omegaB = omega('FusedVesicleLuminalMembrane', .331, golgiInner);
  function shapeOmega(object, aperture) {
    const radius = object.userData.radius, theta0 = Math.asin(clamp(aperture / .36, 0, .96));
    const centerX = 3.25 - .36 * Math.cos(theta0), attr = object.geometry.attributes.position;
    for (let j = 0; j <= fusionRings; j++) for (let i = 0; i <= fusionSegments; i++) {
      const t = theta0 + (Math.PI - theta0) * j / fusionRings, a = Math.PI * i / fusionSegments;
      attr.setXYZ(j * (fusionSegments + 1) + i, centerX + radius * Math.cos(t), .18 + radius * Math.sin(t) * Math.cos(a), -radius * Math.sin(t) * Math.sin(a));
    }
    attr.needsUpdate = true; object.geometry.computeVertexNormals();
  }
  const snare = new THREE.Group(); snare.name = 'GenericTransSNAREZipperingCue'; g.add(snare);
  const snareRods = [];
  for (let i = 0; i < 4; i++) snareRods.push(rod(snare, 'CoarseSNAREHelix' + i, V(), axis, .019, i < 2 ? green : purple));
  const snareBase = V(3.21, -.21, .19), snareVesicle = V(2.93, -.16, .19);
  // Rotate the complete fusion scene, including both bilayers and the cargo
  // path, so the pore can be seen obliquely. Never rotate only its illustration
  // while leaving an untransformed cargo to appear to penetrate the membrane.
  const fusionPresentation = new THREE.Group(); fusionPresentation.name = 'SteadySecretoryFusionPresentation'; g.add(fusionPresentation);
  const fusionFrame = new THREE.Group(); fusionFrame.name = 'FusionAssemblyCoordinateFrame'; fusionFrame.position.set(-3.25, -.18, 0); fusionPresentation.add(fusionFrame);
  for (const actor of [surface, docked, released.group, fusionShell, snare]) fusionFrame.add(actor);
  fusionPresentation.rotation.y = -.65;
  const motionStages = [
    [{ title: '肽链通过 Sec61 进入 ER 腔', description: '看橙色新生链沿核糖体出口进入膜蛋白通道；紫色两叶表示核糖体大小亚基。' }, { title: '腔内链折叠成可辨认的货物', description: '橙色链收拢成同一件分泌货物；折叠动作是放大的教学示意。' }],
    [{ title: '内外两层 COPII 衣被逐步募集', description: '橄榄色内层与金色支架依次出现，包在膜的胞质侧；货物留在膜腔内。' }, { title: '出芽颈部收窄', description: '连接 ER 与芽体的膜颈变细；这里压缩表达膜形变与断颈，不指定唯一分子切断机制。' }, { title: '断颈后载体离开，衣被开始卸下', description: '芽体成为独立载体，金色衣被松脱；货物仍被膜包裹。' }, { title: '向 cis 侧交接', description: '此后在下一步显示进入 Golgi 的状态；ERGIC 与这次靶膜融合在本段省略。' }],
    [{ title: '在腔内接触加工酶', description: '选定货物位于突出的加工剖面中；绿色酶的催化部分伸入腔内。' }, { title: '糖链标记改变，准备后续分选', description: '绿色小分支表达所选糖蛋白的糖链加工，层叠扁囊由 cis 向 trans 显示不同身份。' }],
    [{ title: '从反面网络形成输出载体', description: '货物位于反面网络输出芽内，膜颈收窄后离开；此处没有错误地套用 COPII 衣被。' }, { title: '同一件货物随膜性载体移动', description: '可见橙色货物与包裹它的膜一起移动；虚线箭头只标示目的地。' }, { title: '在细胞表面附近待交付', description: '运输结束于膜的胞质侧；闭合载体没有穿过表面膜。' }],
    [{ title: '膜间 SNARE 结合并靠拢', description: '绿色与紫色短杆表示通用 SNARE 装配原理，使两张膜靠近；未指定巨噬细胞的唯一 SNARE 组合。' }, { title: '融合孔打开', description: '表面膜中央出现真实开口，与后方 Ω 形膜轮廓相接；切口只用于观察腔内。' }, { title: '孔扩大后，货物通过孔释放', description: '橙色货物经过开放孔到达胞外；膜腔与胞外连通，而不是穿透完整磷脂层。' }, { title: '保留释放后的 Ω 形膜轮廓', description: '货物已经到达胞外；为看清拓扑保留融合孔，后续膜回平与 SNARE 回收在此省略。' }]
  ];

  function setProteinTransform(object, at, scale = 1) { object.position.copy(at); object.scale.setScalar(scale); }
  function update(p) {
    const step = Math.min(4, Math.floor(p * 5)), u = clamp(p * 5 - step, 0, 1);
    local.step = step; local.u = u;
    const inER = step === 0, inGolgi = step === 2, exporting = step === 1, outbound = step === 3, secretion = step === 4;
    // The active excerpt is larger than its retained pathway context. This is
    // a stage layout, fixed throughout each action, rather than a breathing
    // organelle or an autonomous camera move.
    er.position.set(inER ? -2.4 : secretion ? -3.05 : inGolgi ? -3.25 : -2.9, inER ? 0 : secretion ? .05 : .25, secretion ? -.25 : 0);
    er.scale.setScalar(inER ? 1.6 : inGolgi || secretion ? .75 : 1);
    er.rotation.y = inER ? -.19 : 0;
    golgi.position.set(inER ? .55 : inGolgi ? -.4 : secretion ? -.55 : .02, inER ? -.05 : .14, inER || secretion ? -.35 : 0);
    golgi.scale.setScalar(inGolgi ? 1.55 : inER || secretion ? .75 : 1);
    golgi.rotation.y = inGolgi ? .12 : 0;
    fusionPresentation.position.set(secretion ? 2.66 : 3.25, .18, secretion ? .1 : 0);
    fusionPresentation.scale.setScalar(secretion ? 1.55 : 1);
    erProtein.group.visible = inER; peptide.forEach((o, i) => {
      o.visible = inER && u < .67 && i < Math.floor(4 + u * 25);
      const f = i / 19;
      o.position.set(-.17 + .045 * Math.sin(f * 8), .68 - .4 * f, -.25 + .035 * Math.cos(f * 7));
    });
    erProtein.domains.forEach((o, i) => {
      o.visible = u >= .56;
      const f = ease((u - .56) / .35), extendedY = .12 - i * .045;
      o.position.set(folded[i].x * f, extendedY * (1 - f) + folded[i].y * f, folded[i].z * f);
    });
    setProteinTransform(erProtein.group, scratch.set(-.17 + .15 * ease((u - .62) / .38), .39, -.245), .64);
    activeRibo.rotation.z = inER ? .025 * Math.sin(u * 12) : 0; mRNA.position.x = inER ? -.07 * u : 0;
    translocon.scale.setScalar(inER ? 1.08 : 1);
    processing.visible = inGolgi; enzyme.visible = inGolgi; golgiProtein.group.visible = inGolgi;
    // Mature the selected section in place. There is no visible cargo path
    // through complete intervening cisternal membranes.
    processing.children[0].material.color.copy(erMat.color).lerp(golgiMat.color, ease(u));
    enzyme.rotation.z = inGolgi ? -.14 * Math.sin(u * Math.PI * 2) : 0;
    glycan.children.forEach((o, i) => { o.visible = inGolgi && i < 2 + Math.floor(u * 8); });
    golgiProtein.group.rotation.y = inGolgi ? .15 * Math.sin(u * Math.PI) : 0;
    transit.visible = exporting || outbound;
    erNeck.visible = exporting && u < .43;
    tgnBudNeck.visible = outbound && u < .26;
    const departure = ease((u - .43) / .57), secretoryDeparture = ease((u - .26) / .74);
    const erNeckWidth = exporting ? Math.max(.06, 1 - ease((u - .2) / .23)) : 1;
    const tgnNeckWidth = outbound ? Math.max(.06, 1 - ease(u / .26)) : 1;
    erNeck.scale.set(1, erNeckWidth, erNeckWidth);
    tgnBudNeck.scale.set(1, tgnNeckWidth, tgnNeckWidth);
    if (exporting) {
      transit.position.set(-1.7 + .62 * departure, .74 - .12 * Math.sin(departure * Math.PI), .02);
      transit.scale.setScalar(.65 + .35 * ease(u / .25));
    } else {
      transit.position.set(1.12 + 1.62 * secretoryDeparture, -.57 + .75 * secretoryDeparture, .02);
      transit.scale.setScalar(.72 + .28 * ease(u / .2));
    }
    const vesicleOuter = transit.getObjectByName('TrackedSecretoryCarrierCutawayMembrane');
    vesicleOuter.material.color.setHex(exporting ? blue : pink);
    coat.visible = exporting && u < .74;
    innerCoat.forEach((o, i) => { o.visible = u > .03 + i * .009; });
    outerCoat.forEach((o, i) => { o.visible = u > .15 + i * .012; });
    coat.scale.setScalar(1 + .22 * ease((u - .57) / .17));
    firstRoute.visible = exporting; secondRoute.visible = outbound;
    const aperture = secretion ? .25 * ease((u - .24) / .35) : 0;
    shapePanel(panelA, aperture); shapePanel(panelB, aperture);
    poreRim.visible = aperture > .012; poreRim.scale.set(aperture, aperture, 1); // torus local XY, then rotate into YZ.
    docked.visible = secretion && u < .24;
    docked.position.set(2.74 + .15 * ease(u / .24), .18, .02);
    fusionShell.visible = secretion && u >= .24;
    shapeOmega(omegaA, aperture); shapeOmega(omegaB, aperture);
    released.group.visible = secretion && u >= .24;
    released.group.position.set(2.89 + .91 * ease((u - .42) / .42), .18, -.06);
    // Cargo moves through the opened aperture after its radius exceeds the
    // compact protein's teaching size; never through a closed complete wall.
    snare.visible = secretion && u < .58;
    snareRods.forEach((o, i) => {
      const zip = ease(u / .42), side = (i - 1.5) * .039;
      const a = scratch.set(snareBase.x, snareBase.y + side, snareBase.z + .01 * i);
      const b = V(snareVesicle.x + .18 * zip, snareVesicle.y + side * (1 - .8 * zip), snareVesicle.z + .01 * i);
      connect(o, a, b);
    });
    const phase = inER ? u < .56 ? 0 : 1 : exporting ? u < .2 ? 0 : u < .43 ? 1 : u < .74 ? 2 : 3 : inGolgi ? u < .45 ? 0 : 1 : outbound ? u < .26 ? 0 : u < .82 ? 1 : 2 : u < .24 ? 0 : u < .42 ? 1 : u < .84 ? 2 : 3;
    local.micro = motionStages[step][phase];
  }

  focus('er', () => er.getWorldPosition(V())); focus('golgi', () => golgi.getWorldPosition(V()));
  focus('surface', () => surface.getWorldPosition(V())); focus('carrier', () => transit.position.clone());
  label('rer', '粗面 ER · 膜腔与核糖体', '蓝灰扁囊内是 ER 腔；核糖体在胞质侧，大小亚基与 Sec61 膜通道相接。下方短管表示无核糖体的相连 ER 管段。', () => er.localToWorld(V(-.02, .73, .13)), '#6893a1');
  label('golgi', 'Golgi · cis → trans', '上方偏蓝灰是 cis 接收侧，下方偏粉是 trans 输出侧；突出的剖面展示选定腔内货物的加工，不表示穿透完整扁囊膜。', () => golgi.localToWorld(V(0, .73, .12)), '#b47f75');
  label('surface', '表面膜 · 胞质侧 / 胞外侧', '双层膜在释放步骤打开融合孔；胞内载体腔通过孔与胞外连通。整个释放局部斜置展示，使膜叶和孔边都能看清。', () => surface.localToWorld(V(0, .69, .12)), '#789a94');
  label('secretory-cargo', '橙色 · 同一类分泌糖蛋白货物', '追踪橙色折叠链，而不是把衣被、酶或磷酸盐误认成货物；绿色分支是其糖链加工符号。', () => {
    const step = local.step, actor = step === 0 ? erProtein.group : step === 2 ? golgiProtein.group : step === 4 ? local.u < .24 ? dockedPayload.group : released.group : payload.group;
    return actor.getWorldPosition(V()).add(V(0, 0, .17));
  }, '#ae7e38');
  label('sec61-machinery', 'Sec61 · 十跨膜螺旋通道', '深绿十螺旋表示 Sec61α，浅绿为 β/γ 辅助拓扑；可见中央通路与 TM2/TM7 侧向缝。所选分泌肽链走中央通路进入 ER 腔，侧门不在此演示为均匀扩张。形体为结构关系粗化，并非原子拟合。', () => translocon.getWorldPosition(V()).add(V(.08, .08, .13)), '#648b70', () => local.step === 0);
  label('copii-machinery', 'COPII · 内外两层衣被', '橄榄色是 Sar1–Sec23/24 内层的粗化符号；金色支架是 Sec13/31 外层。两层均在胞质侧，货物在膜腔内。', () => transit.getWorldPosition(V()).add(V(0, .32, .1)), '#a58b4e', () => local.step === 1 && local.u < .74);
  label('golgi-enzyme', '腔内糖链加工酶', '绿色催化部分朝向 Golgi 腔，作用于所选糖蛋白；绿色分支是糖链符号，不表示此刻所有残基都只被添加。', () => enzyme.getWorldPosition(V()), '#648b70', () => local.step === 2);
  label('fusion-machinery', 'SNARE 装配 / 融合孔', '短杆提示通用 SNARE 装配，后续开放的孔将载体腔与胞外连通。本图不把神经元实验中的特定蛋白组合当成巨噬细胞的唯一组合。', () => surface.localToWorld(V(-.02, 0, .13)), '#648b70', () => local.step === 4);

  update(0);
  return {
    update,
    motion: () => local.micro,
    diagnostics: () => ({ type: 'DetailedSecretoryPathwayTableau', stage: local.step, progressWithinStage: local.u,
      currentMotion: local.micro?.title, thickOpaqueCisternae: true, twoSubunitRibosomes: true, nativeSec61Inspired: true,
      ribosomeDomainEnvelopes: true, ribosomeIsRibonucleoprotein: true, sec61AlphaTransmembraneHelices: 10,
      staticProteinPartsMerged: true,
      coatLayersSeparated: true, carrierLeavesAfterNeckScission: true, realAnimatedFusionAperture: true,
      activeStageLayout: true, fusionAssemblyCoordinateFrame: 'FusionAssemblyCoordinateFrame', fusionAssemblyObliqueAngle: -.65,
      cargoCrossesCompleteMembrane: false, golgiProcessingNotMembranePenetration: true,
      noGeometriesAllocatedDuringUpdate: true, notAtomistic: true, macrophageSpecificEMSegmentation: false })
  };
}
