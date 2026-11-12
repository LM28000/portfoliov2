/* Descendre dans la cabine sans fondu : l'ouverture de la descente est un « portail » qui montre la vraie cabine.
   La caméra plonge dans l'ouverture ; quand elle la remplit, on passe dans la cabine exactement à la même image. */
const PR_PORTAL = {
  ext: [-0.95, 0.9, 0], // centre de l'ouverture, dans le repère du bateau (face arrière du rouf)
  w: 0.56, h: 0.42,
  cab: [-2.3, 1.45, 0], // le même point dans la cabine : l'ouverture de la cloison, après l'échelle (masquée pendant le passage)
  s: 1.2, // la cabine est un peu « plus grande dedans »
  stop: 0.33 // distance à l'ouverture où elle remplit l'écran : on bascule là
};
Object.assign(Component.prototype, {
  buildPortal() {
    if (this.portal || !this.boat) return; const T = window.THREE;
    const mat = new T.ShaderMaterial({ uniforms: { map: { value: null }, res: { value: new T.Vector2(1, 1) }, live: { value: 0 }, glow: { value: 0 } },
      vertexShader: 'void main(){ gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }',
      fragmentShader: 'uniform sampler2D map; uniform vec2 res; uniform float live; uniform float glow; void main(){ vec3 c = live > 0.5 ? texture2D(map, gl_FragCoord.xy / res).rgb : vec3(0.09, 0.055, 0.03) * (0.5 + 1.5 * glow); gl_FragColor = linearToOutputTexel(vec4(c, 1.0)); }' });
    const m = new T.Mesh(new T.PlaneGeometry(PR_PORTAL.w, PR_PORTAL.h), mat); m.position.set(...PR_PORTAL.ext); m.rotation.y = -Math.PI / 2; m.name = 'Descente';
    // encadrement en bois
    const fr = new T.Mesh(new T.PlaneGeometry(PR_PORTAL.w + 0.08, PR_PORTAL.h + 0.06), new T.MeshStandardMaterial({ color: 0x6b3f1d, roughness: 0.7 })); fr.position.set(PR_PORTAL.ext[0] + 0.004, PR_PORTAL.ext[1], 0); fr.rotation.y = -Math.PI / 2;
    this.boat.add(fr); this.boat.add(m); this.portal = m;
    this.portalCamV = new T.PerspectiveCamera(50, 1, 0.03, 40); this.portalClip = [new T.Plane(new T.Vector3(1, 0, 0), -PR_PORTAL.cab[0] + 0.005)];
  },
  // repères : bateau (monde) ↔ cabine
  toCab(p) { const T = window.THREE, P = PR_PORTAL, l = this.boat.worldToLocal(p.clone()); return new T.Vector3(P.cab[0] + (l.x - P.ext[0]) * P.s, P.cab[1] + (l.y - P.ext[1]) * P.s, P.cab[2] + (l.z - P.ext[2]) * P.s); },
  fromCab(p) { const P = PR_PORTAL; return this.boat.localToWorld(new window.THREE.Vector3(P.ext[0] + (p.x - P.cab[0]) / P.s, P.ext[1] + (p.y - P.cab[1]) / P.s, P.ext[2] + (p.z - P.cab[2]) / P.s)); },
  boatQ() { return this.boat.getWorldQuaternion(new window.THREE.Quaternion()); },
  // rendu de la cabine dans l'ouverture (seulement pendant la plongée)
  portalPre(r) {
    if (!this.portal) { this.buildPortal(); if (!this.portal) return; } const U = this.portal.material.uniforms; U.glow.value = this.night || 0; const ph = this.st().phase;
    const live = (ph === 'descente' || ph === 'montee') && this.cabin; U.live.value = live ? 1 : 0; if (!live) return;
    const T = window.THREE, sz = r.getDrawingBufferSize(new T.Vector2()); if (!this.portalRT || this.portalRT.width !== sz.x || this.portalRT.height !== sz.y) { if (this.portalRT) this.portalRT.dispose(); this.portalRT = new T.WebGLRenderTarget(sz.x, sz.y); }
    U.map.value = this.portalRT.texture; U.res.value.copy(sz);
    const v = this.portalCamV, c = this.cam; v.fov = c.fov; v.aspect = c.aspect; v.updateProjectionMatrix(); v.position.copy(this.toCab(c.position)); v.quaternion.copy(this.boatQ().invert().multiply(c.quaternion));
    const ex = r.toneMappingExposure; r.toneMappingExposure = 0.95; r.clippingPlanes = this.portalClip; r.setRenderTarget(this.portalRT); r.render(this.cabin.scene, v); r.setRenderTarget(null); r.clippingPlanes = []; r.toneMappingExposure = ex;
  },
  // pose de la caméra juste devant l'ouverture, regardant dedans
  portalPose() { const T = window.THREE, P = PR_PORTAL; const p = this.boat.localToWorld(new T.Vector3(P.ext[0] - P.stop, P.ext[1], P.ext[2]));
    const m = new T.Matrix4().lookAt(new T.Vector3(0, 0, 0), new T.Vector3(1, 0, 0), new T.Vector3(0, 1, 0)); const ql = new T.Quaternion().setFromRotationMatrix(m); // caméra regardant +x (repère bateau)
    return { p, q: this.boatQ().multiply(ql) }; },
  // animation de la caméra principale (plongée ou remontée), dans le repère du bateau pour suivre la houle
  portalCam(dt) {
    const A = this.pAnim; if (!A) return; const T = window.THREE; A.t = Math.min(1, A.t + dt / A.dur); const e = A.t < 0.5 ? 2 * A.t * A.t : 1 - Math.pow(-2 * A.t + 2, 2) / 2;
    const L = (v) => this.boat.localToWorld(v.clone()); const p0 = L(A.p0), pm = L(A.pm), p1 = L(A.p1), u = 1 - e;
    this.cam.position.set(u * u * p0.x + 2 * u * e * pm.x + e * e * p1.x, u * u * p0.y + 2 * u * e * pm.y + e * e * p1.y, u * u * p0.z + 2 * u * e * pm.z + e * e * p1.z);
    const bq = this.boatQ(); this.cam.quaternion.copy(bq.clone().multiply(A.q0)).slerp(bq.clone().multiply(A.q1), A.rot ? A.rot(e) : e);
    if (A.t >= 1) { const f = A.done; this.pAnim = null; if (f) f(); }
  },
  // ---------- descendre
  descend(obj) {
    const st = this.st(); if (st.phase === 'cabine' || st.phase === 'descente') return;
    if (!this.cabin) { this.setState({ loading: true, loadMsg: 'la cabine…' }); this.loadCabin(() => { this.setState({ loading: false }); this.descend(obj); }); return; }
    this.buildPortal(); const T = window.THREE, P = PR_PORTAL, ph = st.phase;
    if (st.plan) this.setPlan(false); this.cruiseP = null; this.route = []; this.autoDock = false; this.focused = null; this.b.v = 0;
    if (ph !== 'nuit') { this.ensureNight(); this.prevPhase = ph === 'accoste' || ph === 'escale' ? ph : 'mer'; this.nightIsle = this.isleK; this.nightTarget = 1; }
    const inv = this.boatQ().invert(), p0 = this.boat.worldToLocal(this.cam.position.clone()), q0 = inv.clone().multiply(this.cam.quaternion), E = this.portalPose();
    const p1 = this.boat.worldToLocal(E.p.clone()), q1 = inv.clone().multiply(E.q);
    // arrivée bien dans l'axe : le point de contrôle est derrière l'ouverture, à sa hauteur
    const pm = new T.Vector3(P.ext[0] - 1.6, P.ext[1] + 0.9, P.ext[2]); // par-dessus la barre, sous la bôme
    const far = p0.distanceTo(p1); this.pAnim = { t: 0, dur: Math.max(1.6, Math.min(2.6, 1.2 + far / 25)), p0, pm, p1, q0, q1, rot: (e) => Math.min(1, e * 1.25), done: () => this.inCabin(obj) };
    this.setState({ phase: 'descente', focus: null, showApp: false, showCard: false, ask: null, auto: false, panel: null, showMap: false });
  },
  inCabin(obj) {
    const C = this.cabin, T = window.THREE, cam = this.cam; this.setNightNow(1);
    C.cam.aspect = this.host.clientWidth / this.host.clientHeight; C.cam.fov = cam.fov; C.cam.updateProjectionMatrix();
    const p = this.toCab(cam.position), q = this.boatQ().invert().multiply(cam.quaternion), fw = new T.Vector3(0, 0, -1).applyQuaternion(q);
    C.cam.position.copy(p); C.cam.quaternion.copy(q); C.cam.up.set(0, 1, 0); C.look.copy(p).addScaledVector(fw, 2); C.focus = null; C.prog = {}; C.sel = -1;
    this.seen('cabine'); this.setState({ phase: 'cabine', panel: null, loading: false, objText: '', cabFocus: null });
    // on s'avance dans la cabine en passant devant la table à cartes et la VHF
    const v = PR_CAB_VIEWS.idle; C.camFrom = { p: p.clone(), l: C.look.clone(), u: new T.Vector3(0, 1, 0), mid: { at: 0.5, p: new T.Vector3(-1.35, 1.6, -0.3), l: new T.Vector3(-2.0, 0.95, 0.7) } }; C.camTo = { p: new T.Vector3(...v[0]), l: new T.Vector3(...v[1]), u: new T.Vector3(...v[2]) };
    C.camT = 0; C.camDur = 4.2; C.fov0 = cam.fov; C.fov1 = 62;
    C.camDone = () => { if (obj) this.cabFocus(obj); else this.say(PR_CAB_RADIO2.enter); };
  },
  // ---------- remonter : on recule jusqu'à l'ouverture, on ressort, la caméra s'éloigne
  ascend() {
    const C = this.cabin; if (!C || this.st().phase !== 'cabine') return; this.buildPortal(); const T = window.THREE;
    C.focus = null; this.setState({ objText: '', cabFocus: null, panel: null }); C.prog = {}; C.sel = -1;
    const E = this.portalPose(), pc = this.toCab(E.p);
    C.camFrom = { p: C.cam.position.clone(), l: C.look.clone(), u: C.cam.up.clone() }; C.camTo = { p: pc, l: pc.clone().add(new T.Vector3(2, 0, 0)), u: new T.Vector3(0, 1, 0) };
    C.camT = 0; C.camDur = 1.8; C.fov0 = C.cam.fov; C.fov1 = this.cam.fov;
    C.camDone = () => {
      const inv = this.boatQ().invert(); this.orbitBoat(); Object.assign(this.orb, this.orbW); const O = this.orb, cp = Math.cos(O.pitch);
      const end = new T.Vector3(O.tx + Math.sin(O.yaw) * cp * O.dist, O.ty + Math.sin(O.pitch) * O.dist, O.tz + Math.cos(O.yaw) * cp * O.dist);
      const m = new T.Matrix4().lookAt(end, new T.Vector3(O.tx, O.ty, O.tz), new T.Vector3(0, 1, 0)); const qEnd = new T.Quaternion().setFromRotationMatrix(m);
      const p0 = this.boat.worldToLocal(E.p.clone()), p1 = this.boat.worldToLocal(end.clone()); const pm = new T.Vector3(PR_PORTAL.ext[0] - 3, PR_PORTAL.ext[1] + 1.2, 0);
      this.cam.position.copy(E.p); this.cam.quaternion.copy(E.q);
      this.pAnim = { t: 0, dur: 2.2, p0, pm, p1, q0: inv.clone().multiply(E.q), q1: inv.clone().multiply(qEnd), done: () => { this.setState({ phase: 'nuit' }); this.say('Belle nuit. Tu peux redescendre quand tu veux, ou refaire la traversée.'); } };
      this.setState({ phase: 'montee' });
    };
  }
});
