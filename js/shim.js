/* Petit remplaçant de DCLogic (le moteur des planches du canvas) : un état + un rendu. */
class DCLogic {
  constructor() { this.state = {}; }
  setState(patch) { Object.assign(this.state, patch); if (this._render) this._render(); }
}
