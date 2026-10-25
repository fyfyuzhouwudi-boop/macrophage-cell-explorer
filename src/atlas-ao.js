import * as THREE from "three";
import { SSAOPass } from "three/addons/postprocessing/SSAOPass.js";
class AnatomyAOPass extends SSAOPass {
  constructor(...args) {
    super(...args);
    this.normalVariants = /* @__PURE__ */ new Map();
  }
  _overrideVisibility() {
    super._overrideVisibility();
    this.scene.traverse((o) => {
      if (!o.isMesh || !o.visible) return;
      const list = Array.isArray(o.material) ? o.material : [o.material];
      if (list.every((m) => m.userData?.excludeFromAO || (m.transmission ?? 0) > 0.15 || m.transparent && m.opacity < 0.6)) {
        o.visible = false;
        this._visibilityCache.push(o);
      }
    });
  }
  _renderOverride(renderer, overrideMaterial, target, clearColor, clearAlpha) {
    const oldColor = renderer.getClearColor(new THREE.Color()), oldAlpha = renderer.getClearAlpha(), oldAuto = renderer.autoClear, oldShadow = renderer.shadowMap.autoUpdate, background = this.scene.background, oldOverride = this.scene.overrideMaterial, swapped = [];
    const getNormal = (m) => {
      let n = this.normalVariants.get(m);
      if (!n) {
        n = new THREE.MeshNormalMaterial();
        this.normalVariants.set(m, n);
      }
      const count = n.clippingPlanes?.length ?? 0;
      n.visible = m.visible;
      n.side = m.side;
      n.flatShading = m.flatShading;
      n.clippingPlanes = m.clippingPlanes;
      n.clipIntersection = m.clipIntersection;
      n.skinning = m.skinning;
      if (count !== (m.clippingPlanes?.length ?? 0)) n.needsUpdate = true;
      return n;
    };
    try {
      this.scene.traverseVisible((o) => {
        if (o.isMesh) {
          swapped.push([o, o.material]);
          o.material = Array.isArray(o.material) ? o.material.map(getNormal) : getNormal(o.material);
        }
      });
      this.scene.background = null;
      this.scene.overrideMaterial = null;
      renderer.autoClear = false;
      renderer.shadowMap.autoUpdate = false;
      renderer.setRenderTarget(target);
      renderer.setClearColor(clearColor ?? 7829503, clearAlpha ?? 1);
      renderer.clear();
      renderer.render(this.scene, this.camera);
    } finally {
      for (const [o, m] of swapped) o.material = m;
      this.scene.background = background;
      this.scene.overrideMaterial = oldOverride;
      renderer.autoClear = oldAuto;
      renderer.shadowMap.autoUpdate = oldShadow;
      renderer.setClearColor(oldColor, oldAlpha);
    }
  }
  dispose() {
    for (const m of this.normalVariants.values()) m.dispose();
    this.normalVariants.clear();
    super.dispose();
  }
}
export {
  AnatomyAOPass
};
