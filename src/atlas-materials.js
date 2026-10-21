const VERSION = 1;
const MARKER = "atlasMaterialPreset";
const FIELDS = ["roughness", "metalness", "envMapIntensity", "bumpScale", "clearcoat", "clearcoatRoughness", "specularIntensity"];
const clamp = (x, lo, hi) => Math.max(lo, Math.min(hi, x));
const rules = (roughnessFloor, coatFactor, coatRoughnessFloor, envFactor, envCap, bumpFactor, bumpCap, specularFactor) => Object.freeze({ roughnessFloor, coatFactor, coatRoughnessFloor, envFactor, envCap, bumpFactor, bumpCap, specularFactor });
const ATLAS_MATERIAL_PRESETS = Object.freeze({
  conservative: Object.freeze({
    film: rules(0.18, 0.8, 0.16, 0.9, 1.15, 0.75, 0.015, 0.9),
    membrane: rules(0.4, 0.65, 0.3, 0.95, 0.9, 0.65, 0.012, 0.95),
    protein: rules(0.61, 0.22, 0.4, 0.9, 0.8, 0.75, 6e-3, 0.82),
    lipidHead: rules(0.45, 0.45, 0.38, 0.93, 0.85, 0.7, 3e-3, 0.85),
    lipidTail: rules(0.62, 0.2, 0.4, 0.9, 0.8, 0.7, 2e-3, 0.85),
    cytoplasm: rules(0.65, 0.3, 0.4, 0.95, 0.85, 0.65, 7e-3, 0.9),
    cargo: rules(0.76, 0.8, 0.45, 0.95, 0.85, 0.9, 0.035, 0.9)
  }),
  soft: Object.freeze({
    film: rules(null, 0.68, 0.2, 0.85, 1.05, 0.65, 0.012, 0.85),
    membrane: rules(0.46, 0.45, 0.36, 0.92, 0.85, 0.55, 0.01, 0.9),
    protein: rules(0.69, 0.1, 0.48, 0.85, 0.75, 0.6, 5e-3, 0.74),
    lipidHead: rules(0.51, 0.28, 0.44, 0.88, 0.8, 0.6, 25e-4, 0.8),
    lipidTail: rules(0.68, 0.12, 0.48, 0.85, 0.75, 0.6, 2e-3, 0.8),
    cytoplasm: rules(0.69, 0.2, 0.46, 0.92, 0.8, 0.55, 6e-3, 0.85),
    cargo: rules(0.78, 0.65, 0.48, 0.92, 0.8, 0.85, 0.032, 0.85)
  })
});
const ATLAS_LIGHTING_NOTES = Object.freeze([
  "Compare conservative against the existing lights/exposure first; do not confound material and lighting changes.",
  "If white spots remain, test a 10% lower directional key and a slightly stronger broad fill at the same exposure, one change at a time.",
  "Keep neutral broad environment illumination and warm/cool separation; do not darken the cavity or increase AO/bump to manufacture detail.",
  "Numeric roughness/coat changes cannot remove faceted silhouettes or supply missing organic geometry."
]);
function isPBR(material) {
  return Boolean(material && (material.isMeshStandardMaterial || material.isMeshPhysicalMaterial));
}
function roleFor(object, material) {
  const explicit = object.userData?.atlasMaterialRole ?? material.userData?.atlasMaterialRole;
  if (explicit && Object.hasOwn(ATLAS_MATERIAL_PRESETS.conservative, explicit)) return explicit;
  const name = object.name ?? "";
  if ((material.transmission ?? 0) > 0) return "film";
  if (material.transparent && (/FaintCompleteMembraneOutline|IrregularViralEnvelope|SingleMembrane/.test(name) || object.userData?.organelleId === "membrane" && !object.isInstancedMesh && !/Channel|Glycocalyx/.test(name))) return "film";
  if (name === "AmberCytoplasmBackVolume") return "cytoplasm";
  if (/PhagosomeParticleBody|PhagosomeParticulateFragments|IrregularEngulfedCargo|Degradation|Debris|Fragment/.test(name)) return "cargo";
  if (/TwoPhospholipidHeadLeaflets/.test(name)) return "lipidHead";
  if (/HydrophobicFattyAcidTails/.test(name)) return "lipidTail";
  if (/NPC|Ribosom|Chromatin|Nucleol|Protein|Enzyme|Hydrolase|RNA|Polypeptide|Protofilament|Actin|Motor|Crowding|MolecularDrift|Granule|LumenCargo/.test(name)) return "protein";
  if (/Membrane|Cisterna|Reticulum|IntralumenalVesicleInnerFace|TransportCargoVesicle|BatchedStaticgolgi/.test(name) || object.userData?.shell) return "membrane";
  if (object.userData?.organelleId === "golgi" && !object.isInstancedMesh) return "membrane";
  return "protein";
}
function collect(root) {
  if (!root || typeof root.traverse !== "function") throw new TypeError("Atlas material root must be an Object3D-like group");
  const usage = /* @__PURE__ */ new Map();
  root.traverse((object) => {
    if (!object.isMesh) return;
    for (const material of Array.isArray(object.material) ? object.material : [object.material]) {
      if (!isPBR(material)) continue;
      let entry = usage.get(material);
      if (!entry) {
        entry = { roles: /* @__PURE__ */ new Set(), names: /* @__PURE__ */ new Set() };
        usage.set(material, entry);
      }
      entry.roles.add(roleFor(object, material));
      if (object.name) entry.names.add(object.name);
    }
  });
  return usage;
}
const ROLE_PRIORITY = ["film", "cytoplasm", "membrane", "lipidHead", "lipidTail", "cargo", "protein"];
function chooseRole(roles) {
  return ROLE_PRIORITY.find((role) => roles.has(role)) ?? "protein";
}
function snapshot(material) {
  const baseline = {};
  for (const field of FIELDS) if (Number.isFinite(material[field])) baseline[field] = material[field];
  return baseline;
}
function valuesFor(baseline, rule) {
  const next = { ...baseline };
  if (Number.isFinite(baseline.roughness) && rule.roughnessFloor !== null) next.roughness = clamp(Math.max(baseline.roughness, rule.roughnessFloor), 0, 1);
  if (Number.isFinite(baseline.metalness)) next.metalness = Math.min(baseline.metalness, 5e-3);
  if (Number.isFinite(baseline.envMapIntensity)) next.envMapIntensity = Math.min(baseline.envMapIntensity * rule.envFactor, rule.envCap);
  if (Number.isFinite(baseline.bumpScale)) next.bumpScale = Math.sign(baseline.bumpScale) * Math.min(Math.abs(baseline.bumpScale) * rule.bumpFactor, rule.bumpCap);
  if (Number.isFinite(baseline.clearcoat) && baseline.clearcoat > 0) {
    next.clearcoat = Math.max(1e-3, baseline.clearcoat * rule.coatFactor);
    if (Number.isFinite(baseline.clearcoatRoughness)) next.clearcoatRoughness = Math.max(baseline.clearcoatRoughness, rule.coatRoughnessFloor);
  }
  if (Number.isFinite(baseline.specularIntensity)) next.specularIntensity = baseline.specularIntensity * rule.specularFactor;
  return next;
}
function applyAtlasMaterials(root, { preset = "conservative" } = {}) {
  const settings = ATLAS_MATERIAL_PRESETS[preset];
  if (!settings) throw new RangeError("Unknown Atlas material preset: " + preset);
  const usage = collect(root), roles = {}, mixedRoleMaterials = [];
  let changedMaterials = 0, changedFields = 0;
  for (const [material, entry] of usage) {
    material.userData ??= {};
    // Stage-1 membranes own their calibrated thin-interface PBR values.
    if (material.userData.membraneStaticV1) continue;
    const old = material.userData[MARKER];
    const baseline = old?.version === VERSION && old.baseline ? old.baseline : snapshot(material);
    const role = chooseRole(entry.roles), next = valuesFor(baseline, settings[role]);
    let changed = false;
    for (const [field, value] of Object.entries(next)) if (material[field] !== value) {
      material[field] = value;
      changed = true;
      changedFields++;
    }
    if (changed) changedMaterials++;
    material.userData[MARKER] = { version: VERSION, applied: true, preset, role, baseline };
    roles[role] = (roles[role] ?? 0) + 1;
    if (entry.roles.size > 1) mixedRoleMaterials.push({ uuid: material.uuid, role, uses: [...entry.roles], names: [...entry.names].slice(0, 5) });
  }
  const summary = { version: VERSION, preset, inspectedMaterials: usage.size, changedMaterials, changedFields, roles, mixedRoleMaterials };
  root.userData ??= {};
  root.userData.atlasMaterials = summary;
  return summary;
}
function restoreAtlasMaterials(root) {
  const usage = collect(root);
  let restoredMaterials = 0;
  for (const [material] of usage) {
    const saved = material.userData?.[MARKER];
    if (!saved?.baseline || saved.version !== VERSION) continue;
    for (const [field, value] of Object.entries(saved.baseline)) material[field] = value;
    saved.applied = false;
    saved.preset = null;
    restoredMaterials++;
  }
  if (root.userData) root.userData.atlasMaterials = { version: VERSION, preset: null, restoredMaterials };
  return { version: VERSION, restoredMaterials };
}
export {
  ATLAS_LIGHTING_NOTES,
  ATLAS_MATERIAL_PRESETS,
  applyAtlasMaterials,
  restoreAtlasMaterials
};
