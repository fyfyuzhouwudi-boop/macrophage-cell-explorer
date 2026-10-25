let nextAnnotationId = 0;
const normalize = (value) => ({ view: value?.view === "detail" ? "detail" : "whole", selected: value?.selected ?? null, connectedER: Boolean(value?.connectedER), scenario: value?.scenario === "structure" ? "structure" : value?.scenario === "virus" ? "virus" : "clearance" });
const contextKey = (context) => [context.view, context.selected, context.connectedER, context.scenario].join(":");
const words = (value) => Array.isArray(value) ? value.filter(Boolean).join("；") : typeof value === "string" ? value : "";
function createAtlasAnnotations({ sidebar, footer, guides = {}, scenarios = {}, canShowPart = () => true, onInspect = () => {
}, onChange = () => {
} } = {}) {
  if (!sidebar?.ownerDocument || !footer?.append) throw new TypeError("Annotations require sidebar and footer DOM elements");
  const doc = sidebar.ownerDocument, unique = ++nextAnnotationId;
  const journey = sidebar.querySelector("#journey-panel"), detail = sidebar.querySelector("#detail-panel");
  if (!journey || !detail) throw new Error("Annotation panels require journey-panel and detail-panel");
  let context = normalize(), visible = true, note = null, chipKey = "", disposed = false;
  const bindings = /* @__PURE__ */ new Map();
  function element(tag, className, text) {
    const node = doc.createElement(tag);
    if (className) node.className = className;
    if (text !== void 0) node.textContent = String(text);
    return node;
  }
  const panel = element("section", "atlas-note-panel");
  panel.hidden = true;
  const headingRow = element("div", "atlas-note-heading");
  const title = element("h2", "atlas-note-title");
  title.id = "atlas-note-title-" + unique;
  panel.setAttribute("aria-labelledby", title.id);
  const closeButton = element("button", "atlas-note-close", "关闭");
  closeButton.type = "button";
  closeButton.setAttribute("aria-label", "关闭结构注释");
  headingRow.append(title, closeButton);
  const body = element("div", "atlas-note-body"), inspectButton = element("button", "atlas-note-inspect", "放大观察");
  inspectButton.type = "button";
  panel.append(headingRow, body, inspectButton);
  sidebar.insertBefore(panel, journey);
  const chips = element("div", "atlas-feature-chips");
  chips.hidden = true;
  chips.setAttribute("role", "group");
  chips.setAttribute("aria-label", "可见结构说明");
  detail.append(chips);
  const toggle = element("button", "atlas-annotations-toggle", "隐藏注释");
  toggle.type = "button";
  toggle.setAttribute("aria-pressed", "true");
  toggle.setAttribute("aria-label", "显示结构注释");
  footer.append(toggle);
  function partAllowed(id) { return !id || Boolean(canShowPart(id)); }
  function available(feature, forChip = false, id = context.selected) {
    if (feature?.visible !== true || !partAllowed(id)) return false;
    if (Array.isArray(feature.parts) && !feature.parts.every(partAllowed)) return false;
    const views = Array.isArray(feature.views) && feature.views.length ? feature.views : ["ordinary"];
    if (context.view === "detail") return views.includes(context.connectedER ? "connection" : "ordinary") || !context.connectedER && views.includes("detail");
    if (forChip) return false;
    return views.includes("whole") || context.scenario === "clearance" && views.includes("clearance");
  }
  function sourcesFor(host, sources) {
    const valid = (Array.isArray(sources) ? sources : []).filter((source) => typeof source?.url === "string" && /^https?:\/\//i.test(source.url));
    if (!valid.length) return;
    const section = element("div", "atlas-note-sources");
    section.append(element("p", "atlas-note-label", "资料来源"));
    for (const source of valid) {
      const link = element("a", "", source.title || source.url);
      link.href = source.url;
      link.target = "_blank";
      link.rel = "noopener noreferrer";
      section.append(link);
    }
    host.append(section);
  }
  function paragraph(label, text) {
    if (!text) return;
    const p = element("p");
    if (label) p.append(element("strong", "", label + "："));
    p.append(doc.createTextNode(String(text)));
    body.append(p);
  }
  function renderNote() {
    body.replaceChildren();
    if (!note) return;
    if (note.kind === "scenario") {
      const guide2 = scenarios[context.scenario], step = guide2?.steps?.[note.index];
      title.textContent = step?.title || (context.scenario === "virus" ? "病毒应答" : "颗粒旅程");
      paragraph("", step?.desc || step?.function || guide2?.summary);
      paragraph("位置", step?.location);
      paragraph("协作", words(step?.partners));
      paragraph("", step?.note);
      sourcesFor(body, step?.sources?.length ? step.sources : guide2?.sources);
      inspectButton.hidden = true;
      return;
    }
    const guide = guides[note.id], feature = note.featureIndex === null ? null : guide.features[note.featureIndex];
    title.textContent = feature?.name || guide.title || note.id;
    paragraph("功能", feature?.function || guide.function);
    paragraph(feature?.location ? "位置" : feature ? "所属结构位置" : "位置", feature?.location || guide.location);
    const ownPartners = feature?.partners && words(feature.partners);
    paragraph(ownPartners ? "协作" : feature ? "所属结构协作" : "协作", ownPartners || words(guide.partners));
    paragraph("", feature?.note || guide.note);
    sourcesFor(body, feature?.sources?.length ? feature.sources : guide.sources);
    inspectButton.hidden = context.view !== "whole";
    inspectButton.textContent = "放大观察" + (guide.title || "");
  }
  function renderChips() {
    const guide = guides[context.selected];
    // The presentation mask can change without changing the navigation context.
    const availability = (guide?.features ?? []).map(feature => available(feature, true) ? 1 : 0).join("");
    const key = contextKey(context) + ":" + availability;
    if (key !== chipKey) {
      chipKey = key;
      chips.replaceChildren();
      if (context.view === "detail" && guide) guide.features?.forEach((feature, featureIndex) => {
        if (!available(feature, true)) return;
        const button = element("button", "atlas-feature-chip", feature.name);
        button.type = "button";
        button.setAttribute("aria-label", "了解" + feature.name);
        button.addEventListener("click", () => open({ id: context.selected, featureIndex }));
        chips.append(button);
      });
    }
    chips.hidden = !visible || context.view !== "detail" || !chips.children.length;
  }
  function render() {
    const showing = visible && Boolean(note);
    sidebar.classList.toggle("atlas-note-open", showing);
    panel.hidden = !showing;
    journey.hidden = showing || context.view === "detail";
    detail.hidden = showing || context.view !== "detail";
    toggle.hidden = false;
    toggle.textContent = visible ? "隐藏注释" : "显示注释";
    toggle.setAttribute("aria-pressed", String(visible));
    for (const { button } of bindings.values()) {
      if (visible) button.removeAttribute("data-atlas-annotation-hidden");
      else button.setAttribute("data-atlas-annotation-hidden", "true");
    }
    renderChips();
  }
  function notify() {
    onChange();
  }
  function closeInternal() {
    const hadNote = Boolean(note);
    note = null;
    render();
    return hadNote;
  }
  function close() {
    if (disposed) return false;
    const changed = closeInternal();
    if (changed) notify();
    return changed;
  }
  function open({ id, featureIndex = null } = {}) {
    if (disposed || !guides[id] || !partAllowed(id) || context.view === "detail" && id !== context.selected) return false;
    const guide = guides[id];
    if (featureIndex !== null && (!Number.isInteger(featureIndex) || !available(guide.features?.[featureIndex], false, id))) return false;
    if (note?.kind === "structure" && note.id === id && note.featureIndex === featureIndex && note.context === contextKey(context)) return close();
    visible = true;
    note = { kind: "structure", id, featureIndex, context: contextKey(context) };
    renderNote();
    render();
    notify();
    closeButton.focus({ preventScroll: true });
    return true;
  }
  function openScenario({ index = null } = {}) {
    if (disposed || context.view !== "whole" || !scenarios[context.scenario]) return false;
    if (note?.kind === "scenario" && note.index === index && note.context === contextKey(context)) return close();
    if (index !== null && (!Number.isInteger(index) || !scenarios[context.scenario].steps?.[index])) return false;
    visible = true;
    note = { kind: "scenario", index, context: contextKey(context) };
    renderNote();
    render();
    notify();
    closeButton.focus({ preventScroll: true });
    return true;
  }
  function update(next) {
    if (disposed) return;
    const normalized = normalize(next), changed = contextKey(normalized) !== contextKey(context);
    context = normalized;
    if (changed || note?.kind === "structure" && (!partAllowed(note.id) || note.featureIndex !== null && !available(guides[note.id]?.features?.[note.featureIndex], false, note.id))) note = null;
    render();
  }
  function setVisible(value) {
    if (disposed) return;
    const next = Boolean(value), changed = next !== visible;
    visible = next;
    if (!visible) note = null;
    render();
    if (changed) notify();
  }
  function bindLabel(button, config = {}) {
    if (!button?.addEventListener) throw new TypeError("Annotation label must be a button-like element");
    if (bindings.has(button)) {
      bindings.get(button).config = { ...config };
      return;
    }
    const binding = { button, config: { ...config }, down: null, suppressUntil: 0 };
    function move(event) {
      if (binding.down && event.pointerId === binding.down.id && Math.hypot(event.clientX - binding.down.x, event.clientY - binding.down.y) > 4) binding.down.dragged = true;
    }
    function up(event) {
      if (!binding.down || event.pointerId !== binding.down.id) return;
      move(event);
      if (binding.down.dragged || event.type === "pointercancel") binding.suppressUntil = Date.now() + 500;
      binding.down = null;
      doc.removeEventListener("pointermove", move, true);
      doc.removeEventListener("pointerup", up, true);
      doc.removeEventListener("pointercancel", up, true);
    }
    function down(event) {
      if (event.button !== void 0 && event.button !== 0) return;
      binding.down = { id: event.pointerId, x: event.clientX, y: event.clientY, dragged: false };
      doc.addEventListener("pointermove", move, true);
      doc.addEventListener("pointerup", up, true);
      doc.addEventListener("pointercancel", up, true);
    }
    function click(event) {
      event.preventDefault();
      event.stopPropagation();
      event.stopImmediatePropagation();
      if (!visible || event.detail !== 0 && Date.now() < binding.suppressUntil) return;
      const value = binding.config;
      if (value.scenarioIndex !== void 0) openScenario({ index: value.scenarioIndex });
      else open({ id: value.id, featureIndex: value.featureIndex ?? null });
    }
    binding.cleanup = () => {
      button.removeEventListener("pointerdown", down, true);
      button.removeEventListener("click", click, true);
      doc.removeEventListener("pointermove", move, true);
      doc.removeEventListener("pointerup", up, true);
      doc.removeEventListener("pointercancel", up, true);
      button.removeAttribute("data-atlas-annotation-hidden");
    };
    button.setAttribute("data-atlas-annotation-label", "true");
    button.addEventListener("pointerdown", down, true);
    button.addEventListener("click", click, true);
    bindings.set(button, binding);
    render();
  }
  closeButton.addEventListener("click", close);
  inspectButton.addEventListener("click", () => {
    if (!note || note.kind !== "structure" || context.view !== "whole") return;
    const id = note.id;
    closeInternal();
    notify();
    onInspect(id);
  });
  toggle.addEventListener("click", () => setVisible(!visible));
  panel.addEventListener("keydown", (event) => {
    if (event.key === "Escape") {
      event.preventDefault();
      event.stopPropagation();
      close();
    }
  });
  render();
  return {
    update,
    open,
    openScenario,
    close,
    bindLabel,
    setVisible,
    get visible() {
      return visible;
    },
    diagnostics() {
      return { visible, context: { ...context }, note: note ? { ...note } : null, noteOpen: visible && Boolean(note), featureChips: [...chips.children].map((node) => node.textContent), boundLabels: bindings.size, sidebarOnly: true };
    },
    dispose() {
      if (disposed) return;
      closeInternal();
      for (const binding of bindings.values()) binding.cleanup();
      bindings.clear();
      panel.remove();
      chips.remove();
      toggle.remove();
      sidebar.classList.remove("atlas-note-open");
      disposed = true;
    }
  };
}
export {
  createAtlasAnnotations
};
