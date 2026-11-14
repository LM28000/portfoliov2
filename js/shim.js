// three.js r187 : on garde la gestion des couleurs de l'époque r128 (couleurs données telles quelles, conversions faites à la main),
// et les intensités des lumières sont exprimées dans l'ancienne échelle puis converties (LUX : soleil, ciel ; LUXP : lampes ponctuelles).
if (window.THREE) window.THREE.ColorManagement.enabled = false;
window.LUX = Math.PI; window.LUXP = Math.PI * 4;
/* Petit remplaçant de DCLogic (le moteur des planches du canvas) : un état + un rendu. */
class DCLogic {
  constructor() { this.state = {}; }
  setState(patch) { Object.assign(this.state, patch); if (this._render) this._render(); }
}
