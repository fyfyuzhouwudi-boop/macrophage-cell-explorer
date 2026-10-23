// Presentation visibility only. Does not remove biological geometry or alter model clocks.
export const VISIBILITY_GROUPS = Object.freeze([
  { id: 'boundary', label: '边界与支架', keys: ['membrane', 'membrane-proteins', 'cytoskeleton', 'microtubules', 'actin', 'intermediate-filaments', 'cytoplasm'] },
  { id: 'information', label: '遗传与合成', keys: ['nucleus', 'pore', 'er', 'ribosome'] },
  { id: 'processing', label: '分选与处理', keys: ['golgi', 'transport-vesicles', 'endosome', 'phagosome', 'lysosome'] },
  { id: 'metabolism', label: '能量与氧化代谢', keys: ['mitochondria', 'peroxisome'] },
  { id: 'coordinates', label: '分子与膜局部实例', keys: ['tubulin-structure', 'ribosome-structure', 'membrane-patch', 'surface-patch', 'microvilli', 'snare-fusion', 'ha-fusion'] },
  { id: 'collaboration', label: '功能关系', keys: ['collaboration'] },
  { id: 'scenario', label: '摄取与应答', keys: ['uptake-particles','uptake-ligands','uptake-receptors','viral-particles'] }
]);
export const VISIBILITY_PARTS = Object.freeze({
  membrane: { label: '细胞膜', owner: 'membrane' },
  'membrane-proteins': { label: '膜蛋白（局部示意）', scope: '膜/内质网局部及既有线粒体 MAVS、细胞表面 IFNAR 示意；附属信号随对应受体上下文隐藏，不代表均跨膜或均为通道' },
  cytoskeleton: { label: '细胞骨架', owner: 'cytoskeleton' },
  microtubules: { label: '微管', owner: 'cytoskeleton', requires: ['cytoskeleton'] },
  actin: { label: '肌动蛋白', owner: 'cytoskeleton', requires: ['cytoskeleton'], scope: '含骨架与表面局部的肌动蛋白芯；随细胞骨架隐藏，不把局部膜壁归为骨架' },
  'intermediate-filaments':{label:'中间丝（vimentin样示意）',owner:'cytoskeleton',requires:['cytoskeleton'],scope:'核周与胞质支撑段；为形态教学，非巨噬细胞实测纤维地图'},
  cytoplasm: { label: '胞质背景、通用分子与信号示意', scope: '背景及既有胞质信号示意，不是独立细胞器或某一种蛋白身份' },
  nucleus: { label: '细胞核', owner: 'nucleus' },
  pore: { label: '核孔复合体', owner: 'pore', requires: ['nucleus'] },
  er: { label: '内质网', owner: 'er' },
  ribosome: { label: '核糖体', owner: 'ribosome' },
  golgi: { label: '高尔基体', owner: 'golgi' },
  'transport-vesicles': { label: '运输/分泌囊泡', scope: '不含吞噬体或腔内小泡（ILV）' },
  endosome: { label: '内体', owner: 'endosome' },
  phagosome: { label: '吞噬体', owner: 'phagosome' },
  lysosome: { label: '溶酶体', owner: 'lysosome' },
  mitochondria: { label: '线粒体', owner: 'mitochondria' },
  peroxisome: { label: '过氧化物酶体', owner: 'peroxisome' },
  'tubulin-structure': { label: '微管蛋白坐标实例', inspectable: true, scope: '独立来源结构，不增加细胞器种类', requires: ['cytoskeleton', 'microtubules'] },
  'ribosome-structure': { label: '核糖体坐标实例', inspectable: true, scope: '独立来源结构，不增加细胞器种类', requires: ['ribosome'] },
  'membrane-patch': { label: '柔软膜褶皱局部', inspectable: true, scope: '内质网膜局部示意；程序化，非实测电镜/原子模型', requires: ['er'] },
  'snare-fusion': {label:'SNARE 囊泡融合实例',inspectable:true,scope:'晚期内体/溶酶体膜融合的独立教学局部'},
  'ha-fusion': {label:'流感 HA 包膜融合实例',inspectable:true,scope:'低 pH 条件下的独立病毒包膜融合局部；不等于宿主细胞有效感染'},
  'surface-patch': { label: '微绒毛与膜活动局部', inspectable: true, scope: '细胞表面代表膜局部；教学形态，不增加细胞器或冒称整胞所有突起为微绒毛', requires: ['membrane'] },
  microvilli: { label: '局部膜突起（整片控制）', scope: '连续局部膜壁无法只隐突起，因此控制整个表面膜片及其芯/符号；不控制整胞伪足、膜褶皱或内质网', requires: ['surface-patch', 'membrane'] },
  collaboration: { label: '稳态协作指示', scope: '方向/关系示意，不是实体管道' },
  'uptake-particles': {label:'吞噬颗粒与IgG标记',scope:'本教学案例的非病毒可降解大颗粒'},
  'uptake-ligands': {label:'可溶糖蛋白配体',scope:'配体留在内吞系统处理，不随受体回到表面'},
  'uptake-receptors': {label:'FcγR / 甘露糖受体示意',scope:'不同案例中的膜受体，位置与膜侧向为教学表达'},
  'viral-particles': { label: '病毒示意颗粒/组分', scope: '仅既有剧情的示意颗粒及其组分；摄取不等于有效感染；不包括宿主 IFN 或宿主信号蛋白' }
});
const IDS = new Set(Object.keys(VISIBILITY_PARTS));
const CELLS = new Set(Object.values(VISIBILITY_PARTS).map(x => x.owner).filter(Boolean));
const INSPECTABLE = new Set([...CELLS, ...Object.keys(VISIBILITY_PARTS).filter(k => VISIBILITY_PARTS[k].inspectable)]);
const canonical = key => key === 'membraneProteins' ? 'membrane-proteins' : key;
const NUCLEAR_ENVELOPE = 'PerforatedDoubleNuclearMembrane';
const FUSION_ENVELOPE = 'ClosedContinuousPhagolysosomeFusionMembrane';
const CROWDS = new Set(['AmberCytoplasmBackVolume', 'PrescribedCytoplasmicMolecularDrift', 'CorticalMolecularCrowding']);
const NPC = 'ThirtyTwoEightFoldNPCAssemblies';
const BOUND_RIBOSOMES = /CytosolicBoundRibosomes|ContinuumERBoundRibosomes/;
const MICRO_DETAIL = /ThirteenProtofilamentHollowMicrotubule|MotorProteinHead|MotorProteinStalk/;
const SURFACE_PATCH_KEYS = Object.freeze({ microvilli: ['surface-patch', 'microvilli'], actin: ['surface-patch', 'microvilli', 'actin'], 'membrane-proteins': ['surface-patch', 'microvilli', 'membrane-proteins'] });
const GATE = Symbol('atlasVisibilityGate');
function isRenderable(o) { return o?.isMesh || o?.isLine || o?.isPoints || o?.isSprite; }
function anyAncestor(o, test, stop) { for (let p = o; p && p !== stop; p = p.parent) if (test(p)) return true; return false; }
function validateKeys(keys) { for (const key of keys) if (!IDS.has(key)) throw new RangeError('Unknown visibility key: ' + key); }

// Getter is deliberately separate from the author's visible flag. Animation setters retain control.
export function installVisibilityGate(target, allowed, { base = () => true } = {}) {
  if (target[GATE]) throw new Error('Object already has an atlas visibility gate');
  const descriptor = Object.getOwnPropertyDescriptor(target, 'visible');
  if (descriptor && !descriptor.configurable) throw new Error('visible must be configurable');
  let authored = target.visible !== false, active = true;
  const token = {};
  Object.defineProperty(target, GATE, { value: token, configurable: true });
  Object.defineProperty(target, 'visible', { configurable: true, enumerable: descriptor?.enumerable ?? true,
    get: () => authored && base() && (!active || allowed()), set: value => { authored = Boolean(value); }
  });
  return { get authored() { return authored; }, dispose() {
    if (!active) return;
    active = false;
    if (target[GATE] !== token) return;
    delete target[GATE];
    if (descriptor && ('get' in descriptor || 'set' in descriptor)) Object.defineProperty(target, 'visible', descriptor);
    else Object.defineProperty(target, 'visible', { ...(descriptor ?? { writable: true, configurable: true, enumerable: true }), value: authored });
  } };
}

export function createAtlasVisibility({ container = null, whole = null, onBeforeHide = async () => {}, onChange = () => {}, onError = () => {} } = {}) {
  let hidden = new Set(), context = { view: 'whole', selected: null, connectedER: false }, disposed = false, busy = false, pending = Promise.resolve();
  const records = new Map(), domains = new Map(), details = new Map(), scenarios = new Map(), inputs = new Map(), groupInputs = new Map(), issues = [];
  let panel = null, restoreButton = null, status = null;
  const allows = (key, mask = hidden) => !mask.has(key) && (VISIBILITY_PARTS[key]?.requires ?? []).every(k => !mask.has(k));
  const all = keys => keys.every(key => allows(key));
  const canInspectMask = (id, mask = hidden) => INSPECTABLE.has(id) && allows(id, mask) && (id !== 'cytoskeleton' || allows('microtubules', mask) || allows('actin', mask) || allows('intermediate-filaments', mask)) && (id !== 'surface-patch' || allows('microvilli', mask));
  const canShowMask = (id, mask = hidden) => IDS.has(id) && allows(id, mask) && (!['cytoskeleton', 'surface-patch'].includes(id) || canInspectMask(id, mask));
  function bind(object, keys, scope, predicate = null) {
    if (!isRenderable(object)) return;
    validateKeys(keys);
    const previous = records.get(object);
    if (previous) return;
    const gate = installVisibilityGate(object, () => (predicate ? predicate() : all(keys)) && closeupAllows(object,keys,scope));
    records.set(object, { object, keys: [...keys], scope, gate });
  }
  function closeupAllows(object,keys,scope){
    if(context.skeletonFocus){
      if(scope==="whole")return keys.includes("cytoskeleton");
      if(scope==="scenario:cytoskeleton-network")return keys.includes(context.skeletonFocus==="mtoc"?"microtubules":context.skeletonFocus);
    }
    if(scope!=="whole"||!context.reactionCloseup)return true;
    if(keys.includes("cytoskeleton")||keys.includes("transport-vesicles"))return false;
    const key=context.reactionKey??"";
    if(/MAVS|IRF3|STAT|nuclear-transcription|cytosolic-recognition|secretory-carrier/.test(key)&&keys.includes("er")&&object.name!==NUCLEAR_ENVELOPE)return false;
    if(key==="nuclear-transcription"&&keys.includes("nucleus")&&object.name!==NUCLEAR_ENVELOPE&&object.name!==NPC)return false;
    return true;
  }
  function bindDomains(object, mapping, scope) {
    if (domains.has(object)) return;
    const original = object.material, sources = Array.isArray(original) ? original : [original], clones = [];
    const bindings = sources.map((source, index) => {
      const key = mapping[index];
      if (!key) return null;
      validateKeys([key]);
      const clone = source.clone();
      clone.name = (source.name || object.name) + ':visibility:' + key;
      clone.onBeforeCompile = source.onBeforeCompile;
      clone.customProgramCacheKey = source.customProgramCacheKey;
      // Factory replaces the clippingPlanes ARRAY at each setSection. Keep live ownership there.
      Object.defineProperty(clone, 'clippingPlanes', { configurable: true, enumerable: true, get: () => source.clippingPlanes });
      const gate = installVisibilityGate(clone, () => allows(key)&&!(scope==="whole"&&context.reactionCloseup&&key==="er"), { base: () => source.visible !== false });
      clones.push(clone);
      return { key, source, clone, gate, sourceVersion: source.version };
    });
    object.material = Array.isArray(original) ? sources.map((source, i) => bindings[i]?.clone ?? source) : bindings[0]?.clone ?? original;
    domains.set(object, { object, scope, original, bindings: bindings.filter(Boolean), clones });
    bind(object, [...new Set(Object.values(mapping))], scope, () => Object.values(mapping).some(key => allows(key)));
  }
  function classifyNucleus(root, scope) {
    root?.traverse(object => {
      if (!isRenderable(object)) return;
      if (object.name === NUCLEAR_ENVELOPE && Array.isArray(object.material) && [3, 4].includes(object.material.length)) bindDomains(object, object.userData.organelleByMaterial ?? { 0: 'nucleus', 1: 'er', 2: 'er' }, scope);
      else if (object.name === NPC) bind(object, ['nucleus', 'pore'], scope);
      else if (BOUND_RIBOSOMES.test(object.name)) bind(object, ['er', 'ribosome'], scope);
      else bind(object, ['nucleus'], scope);
    });
  }
  function removeRecord(record) { record.gate.dispose(); records.delete(record.object); }
  function removeDomain(item) {
    item.object.material = item.original;
    for (const b of item.bindings) b.gate.dispose();
    for (const m of item.clones) m.dispose();
    domains.delete(item.object);
  }
  function refreshWhole() {
    if (!whole?.group || disposed) return;
    const members = new Set(); whole.group.traverse(o => members.add(o));
    for (const r of records.values()) if (r.scope === 'whole' && !members.has(r.object)) removeRecord(r);
    for (const d of domains.values()) if (d.scope === 'whole' && !members.has(d.object)) removeDomain(d);
    const nr = whole.components?.nucleus?.component?.group;
    classifyNucleus(nr, 'whole');
    for (const placed of whole.components?.mitochondria ?? []) placed.holder?.traverse(o => bind(o, ['mitochondria'], 'whole'));
    whole.group.traverse(object => {
      if (!isRenderable(object) || records.has(object)) return;
      if (object.name === FUSION_ENVELOPE) { bindDomains(object, { 0: 'phagosome', 1: 'lysosome' }, 'whole'); return; }
      if (object.name === 'HydrolasesEnteringClosedPhagolysosome') { bind(object, ['phagosome', 'lysosome'], 'whole'); return; }
      if (CROWDS.has(object.name)) { bind(object, ['cytoplasm'], 'whole',()=>all(['cytoplasm'])&&!context.reactionCloseup&&!(context.surfaceReceptorFocus&&object.name!=='AmberCytoplasmBackVolume')); return; }
      if (object.userData?.componentKey === 'transport-vesicles' || /GolgiTransportVesicle/.test(object.name)) { bind(object, ['golgi', 'transport-vesicles'], 'whole'); return; }
      if (anyAncestor(object, p => p.name === 'ConnectedERBoundRibosomes', whole.group)) { bind(object, ['er', 'ribosome'], 'whole'); return; }
      const id = object.userData?.organelleId;
      if (id === 'cytoskeleton') {
        const key = object.userData.componentKey;
        if (key === 'microtubules' || key === 'actin') bind(object, ['cytoskeleton', key], 'whole');
        else { bind(object, ['cytoskeleton'], 'whole'); if (!issues.includes('Unclassified whole cytoskeleton batch')) issues.push('Unclassified whole cytoskeleton batch'); }
      } else if (IDS.has(id)) bind(object, [id], 'whole');
      else if (object.name) issues.push('Unbound whole renderable: ' + object.name);
    });
    renderUI();
  }
  function registerDetail(model, { id, connectedER = false } = {}) {
    if (disposed) throw new Error('Visibility controller disposed');
    if (!model?.group || !INSPECTABLE.has(id)) throw new TypeError('A detail model and known component id are required');
    if (details.has(model)) return;
    if (id === 'surface-patch') {
      let renderables = 0, membraneWalls = 0;
      model.group.traverse(object => {
        if (!isRenderable(object)) return;
        renderables++;
        const key = object.userData?.componentKey;
        if (!Object.hasOwn(SURFACE_PATCH_KEYS, key) || object.userData?.organelleId !== 'surface-patch') {
          const problem = 'Unclassified surface-patch renderable: ' + (object.name || object.uuid) + ' [' + String(key) + ']';
          issues.push(problem); throw new RangeError(problem);
        }
        if (key === 'microvilli') membraneWalls++;
      });
      if (!renderables || !membraneWalls) throw new TypeError('Surface patch must expose its actual continuous membrane wall');
    }
    details.set(model, { id, connectedER });
    const scope = 'detail:' + id + (connectedER ? ':connection' : ':ordinary');
    if (connectedER) classifyNucleus(model.group, scope);
    else model.group.traverse(object => {
      if (!isRenderable(object)) return;
      if (id === 'surface-patch') {
        bind(object, SURFACE_PATCH_KEYS[object.userData.componentKey], scope);
      } else if (id === 'membrane-patch') {
        bind(object, /^GenericTransmembranePositionSymbol[12]$/.test(object.name) ? ['membrane-patch', 'membrane-proteins'] : ['membrane-patch'], scope);
      } else if (id === 'golgi' && /GolgiTransportVesicle/.test(object.name)) {
        bind(object, ['golgi', 'transport-vesicles'], scope);
      } else if (id === 'cytoskeleton' && /TransportCargoVesicle/.test(object.name)) {
        bind(object, ['cytoskeleton', 'microtubules', 'transport-vesicles'], scope);
      } else if (id === 'cytoskeleton') {
        bind(object, ['cytoskeleton', object.name === 'ActinHelicalMonomer' ? 'actin' : MICRO_DETAIL.test(object.name) ? 'microtubules' : 'cytoskeleton'], scope);
      } else if (id === 'membrane') {
        const isChannel = anyAncestor(object, p => p.userData?.componentKey === 'membrane-proteins' || p.children?.some(c => c.name === 'MembraneChannelHelix'), model.group);
        bind(object, isChannel ? ['membrane', 'membrane-proteins'] : ['membrane'], scope);
      } else if (id === 'er') bind(object, BOUND_RIBOSOMES.test(object.name) ? ['er', 'ribosome'] : ['er'], scope);
      else if (id === 'nucleus' && object.name === NPC) bind(object, ['nucleus', 'pore'], scope);
      else bind(object, [id], scope);
    });
    syncMaterials();
    renderUI();
  }
  function registerExternal(root, { key } = {}) {
    key = canonical(key); validateKeys([key]);
    if (disposed) throw new Error('Visibility controller disposed');
    if (!root || typeof root !== 'object') throw new TypeError('External Object3D root required');
    if (records.has(root)) return;
    records.set(root, { object: root, keys: [key], scope: 'external:' + key, gate: installVisibilityGate(root, () => allows(key)) });
    renderUI();
  }
  function registerScenario(model, { id = 'virus' } = {}) {
    if (disposed) throw new Error('Visibility controller disposed');
    if (!model?.group || typeof model.getVisibilityBindings !== 'function' || typeof model.getObjectVisibilityDependencies !== 'function' || typeof model.getLabelVisibilityDependencies !== 'function') throw new TypeError('Scenario model must expose explicit object and label visibility dependencies');
    if (scenarios.has(model)) return;
    const bindings = model.getVisibilityBindings();
    const renderables = new Set();
    model.group.traverse(object => { if (isRenderable(object)) renderables.add(object); });
    const bound = new Set();
    for (const entry of bindings) {
      if (!renderables.has(entry.object) || !Array.isArray(entry.dependencies)) throw new TypeError('Scenario visibility binding must refer to its own renderable');
      validateKeys(entry.dependencies); bound.add(entry.object);
    }
    if (bound.size !== renderables.size) throw new Error('Every scenario renderable needs an explicit semantic visibility binding');
    for (const entry of bindings) {
      const dependencies = () => {
        const keys = model.getObjectVisibilityDependencies(entry.object);
        if (!Array.isArray(keys)) return null;
        validateKeys(keys);
        return keys;
      };
      bind(entry.object, entry.dependencies, 'scenario:' + id, () => {
        const keys = dependencies(); return keys != null && all(keys);
      });
      records.get(entry.object).dependencies = dependencies;
      records.get(entry.object).role = entry.role;
    }
    scenarios.set(model, { id, objects: bound.size });
    renderUI();
  }
  function canShowScenarioLabel(key, model = null) {
    if (disposed) return false;
    const candidates = model ? (scenarios.has(model) ? [model] : []) : [...scenarios.keys()];
    for (const candidate of candidates) {
      const keys = candidate.getLabelVisibilityDependencies(key);
      if (keys == null) continue;
      if (!Array.isArray(keys)) throw new TypeError('Scenario label dependencies must be an array');
      validateKeys(keys); return all(keys);
    }
    return false;
  }
  function syncMaterials() {
    for (const d of domains.values()) for (const b of d.bindings) if (b.sourceVersion !== b.source.version) {
      b.sourceVersion = b.source.version;
      b.clone.needsUpdate = true;
    }
  }
  function renderUI() {
    if (!panel || disposed) return;
    for (const [key, item] of inputs) {
      item.input.checked = hidden.has(key);
      item.input.disabled = busy;
      const inherited = !hidden.has(key) && !allows(key);
      item.label.classList.toggle('visibility-inherited', inherited);
      item.input.setAttribute('aria-describedby', item.hint.id);
      item.hint.textContent = inherited ? '随所属部分隐藏' : VISIBILITY_PARTS[key].scope ?? '';
    }
    for (const [id, input] of groupInputs) {
      const keys = VISIBILITY_GROUPS.find(x => x.id === id).keys, count = keys.filter(key => hidden.has(key)).length;
      input.checked = count === keys.length;
      input.indeterminate = count > 0 && count < keys.length;
      input.disabled = busy;
    }
    restoreButton.disabled = busy || hidden.size === 0;
    status.textContent = busy ? '正在返回整胞后应用隐藏…' : hidden.size ? '已隐藏 ' + hidden.size + ' 项；仅影响展示' : '全部显示';
    panel.setAttribute('aria-busy', String(busy));
  }
  function transaction(updates, reason) {
    validateKeys(updates.map(x => x[0]));
    const execute = async () => {
      if (disposed) throw new Error('Visibility controller disposed');
      const changes = updates.filter(([key, value]) => hidden.has(key) !== value);
      if (!changes.length) return false;
      const next = new Set(hidden);
      for (const [key, value] of changes) value ? next.add(key) : next.delete(key);
      const hiding = changes.filter(([, value]) => value).map(([key]) => key);
      const affectedIds = [...new Set(hiding.map(key => VISIBILITY_PARTS[key].owner).filter(Boolean))];
      busy = true; renderUI();
      try {
        if (hiding.length) await onBeforeHide({ keys: hiding, affectedIds, reason, context: { ...context }, hidesCurrent: context.selected != null && !canInspectMask(context.selected, next), canInspectAfter: id => canInspectMask(id, next), canShowAfter: id => canShowMask(id, next) });
        if (disposed) throw new Error('Visibility controller disposed before commit');
        hidden = next;
        onChange({ reason, hidden: [...hidden], changedKeys: changes.map(x => x[0]) });
        return true;
      } finally { busy = false; renderUI(); }
    };
    const result = pending.then(execute, execute);
    pending = result.catch(error => { onError(error); });
    return result;
  }
  function setHidden(key, value) { return transaction([[canonical(key), Boolean(value)]], 'component'); }
  function setGroupHidden(groupId, value) {
    const group = VISIBILITY_GROUPS.find(x => x.id === groupId);
    if (!group) throw new RangeError('Unknown visibility group: ' + groupId);
    return transaction(group.keys.map(key => [key, Boolean(value)]), 'group');
  }
  function restoreAll() { return transaction([...IDS].map(key => [key, false]), 'restore-all'); }
  function setContext(next = {}) { context = { ...context, ...next }; renderUI(); }
  function createUI() {
    if (!container) return;
    const doc = container.ownerDocument;
    const make = (tag, cls, text) => { const el = doc.createElement(tag); if (cls) el.className = cls; if (text) el.textContent = text; return el; };
    panel = make('section', 'atlas-visibility');
    const header = make('div', 'visibility-header'), title = make('h3', '', '显示哪些部分');
    restoreButton = make('button', 'visibility-restore', '恢复全部'); restoreButton.type = 'button';
    restoreButton.addEventListener('click', () => { restoreAll().catch(() => {}); });
    header.append(title, restoreButton); panel.append(header, make('p', 'visibility-help', '勾选以隐藏；取消勾选以显示。'));
    for (const group of VISIBILITY_GROUPS) {
      const field = make('fieldset', 'visibility-group'), legend = make('legend'), groupLabel = make('label', 'visibility-group-label'), groupInput = make('input');
      groupInput.type = 'checkbox'; groupInput.setAttribute('aria-label', '隐藏整组：' + group.label);
      groupInput.addEventListener('change', () => { setGroupHidden(group.id, groupInput.checked).catch(() => {}); });
      groupLabel.append(groupInput, make('span', '', group.label)); legend.append(groupLabel); field.append(legend); groupInputs.set(group.id, groupInput);
      for (const key of group.keys) {
        const part = VISIBILITY_PARTS[key], label = make('label', 'visibility-item' + (part.requires ? ' visibility-subpart' : '')), input = make('input'), text = make('span', 'visibility-item-text', part.label), hint = make('small', 'visibility-scope');
        input.type = 'checkbox'; input.setAttribute('aria-label', '隐藏' + part.label); hint.id = 'atlas-visibility-scope-' + key;
        input.addEventListener('change', () => { setHidden(key, input.checked).catch(() => {}); });
        text.append(hint); label.append(input, text); field.append(label); inputs.set(key, { input, label, hint });
      }
      panel.append(field);
    }
    status = make('p', 'visibility-status'); status.setAttribute('role', 'status'); status.setAttribute('aria-live', 'polite'); panel.append(status); container.append(panel);
    renderUI();
  }
  function diagnostics() {
    return { hidden: [...hidden], effectiveHidden: [...IDS].filter(key => !allows(key)), context: { ...context }, busy, disposed, objects: records.size, domainMeshes: domains.size, clonedDomainMaterials: [...domains.values()].reduce((n,d) => n+d.clones.length, 0), detailModels: details.size, scenarioModels: scenarios.size, scenarioBindings: [...records.values()].filter(r => r.scope.startsWith('scenario:')).map(r => ({ name: r.object.name, role: r.role, keys: [...(r.dependencies?.() ?? r.keys)] })), issues: [...new Set(issues)], groups: VISIBILITY_GROUPS.map(g => ({ id: g.id, checked: g.keys.every(k => hidden.has(k)), indeterminate: g.keys.some(k => hidden.has(k)) && !g.keys.every(k => hidden.has(k)) })), wholeComponentKeys: [...new Set([...records.values()].filter(r => r.scope === 'whole').flatMap(r => r.keys))] };
  }
  function dispose() {
    if (disposed) return;
    disposed = true;
    for (const r of records.values()) r.gate.dispose(); records.clear();
    for (const d of [...domains.values()]) removeDomain(d);
    details.clear(); scenarios.clear(); panel?.remove(); inputs.clear(); groupInputs.clear();
  }
  refreshWhole(); createUI();
  return { registerDetail, registerExternal, registerScenario, canShowScenarioLabel, refreshWhole, syncMaterials, setContext, setHidden, setGroupHidden, restoreAll, isHidden: key => hidden.has(canonical(key)), isEffectivelyHidden: key => IDS.has(canonical(key)) && !allows(canonical(key)), canInspect: id => canInspectMask(id), canShowLabel: id => canShowMask(id), diagnostics, dispose };
}
