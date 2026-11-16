/* L'archipel : vue aérienne d'arrivée, une île par projet (Insula, Vigie, le serveur), survol au clic. */
const PR_ISLES = {
  insula: { n: 1, name: 'Insula', to: 'Insula', line: 'Choisir où acheter, entre amis', x: 4, z: -2, top: 40 },
  cartevivante: { n: 2, name: 'Vigie', to: 'Vigie', line: 'La France en direct : trains, avions, bateaux', x: -190, z: 0, rx: 31, rz: 19, top: 72,   /* une plateforme de lancement (vigie.js) */
    view: { ty: 24, yaw: -0.62, pitch: 0.3, dist: 135 }, code: 'https://github.com/LM28000/vigie' },
  serveur: { n: 3, name: 'Le serveur', to: 'le serveur', line: 'Mon serveur maison, sous une base flottante', x: 190, z: -24, rx: 26, rz: 15, h: 5, s: 4.1, top: 28,
    view: { ty: 4, yaw: -1.0, pitch: 0.38, dist: 80 } }
};
Object.assign(PR_RADIO, {
  approche2: "Tu vois le ponton, au pied de la plateforme ? Approche doucement, je t'aide à accoster.",
  archipel: "Ici Louis-Marie, bienvenue ! Voici l'archipel : chaque île est un de mes projets. Clique sur une île pour la survoler. Ou embarque à bord d'Elba : tu barres, et je te guide à la radio.",
  cartevivante: "Vigie : la France en 3D et en temps réel. On y voit les trains voiture par voiture, les avions, les bateaux, la météo, l'énergie, les séismes. Une frise remonte sept jours en arrière, et tout est rejoué. Derrière, un serveur en Rust archive le temps réel, et le site est en TypeScript (MapLibre, deck.gl). Elle tourne sur mon serveur maison, l'île d'en face. Embarque dans la fusée : en orbite, tu verras la vraie Vigie.",
  serveur: "La salle des machines : un serveur chez moi, sous Debian, avec une trentaine de services dans Docker. Chacun est décrit dans un fichier versionné dans git. Il y a un cloud privé, une IA locale, une messagerie, un VPN, de la supervision, et des sauvegardes chiffrées chaque nuit. C'est lui qui fait tourner Vigie."
});
Object.assign(Component.prototype, {
  orbitPh(ph) { return ph === 'accoste' || ph === 'nuit' || ph === 'archipel' || ph === 'escale' || ph === 'transit' || this.srvPh(ph) || this.vgPh(ph); },
  // limite du déplacement (clic droit) selon l'endroit
  clampPan(tx, tz) { const ph = this.st().phase; let c = { x: 0, z: 0, rx: 85, rz: 55 };
    if (ph === 'archipel') c = { x: 0, z: 10, rx: 380, rz: 260 }; else if (ph === 'escale') { const I = PR_ISLES[this.isleK]; c = { x: I.x, z: I.z, rx: 80, rz: 60 }; } else if (this.srvPh(ph)) { const V = this.srvVC(); c = { x: V.x, z: V.z - 10, rx: 45, rz: 45 }; } else if (this.vgPh(ph)) c = { x: this.orbW.tx, z: this.orbW.tz, rx: 80, rz: 80 };
    const rr = Math.hypot((tx - c.x) / c.rx, (tz - c.z) / c.rz); if (rr > 1) { tx = c.x + (tx - c.x) / rr; tz = c.z + (tz - c.z) / rr; } return [tx, tz]; },
  distLim(ph) { return ph === 'archipel' ? [300, 1300] : ph === 'escale' ? [18, 260] : this.srvPh(ph) ? [8, 70] : this.vgPh(ph) ? [1.2, 420] : [10, 220]; },
  buildIsles(T) {
    this.isleG = {};
    ['cartevivante', 'serveur'].forEach((k) => { const g = new T.Group(); g.userData.isle = k; this.isleG[k] = g; this.scene.add(g); });   /* la plateforme arrive par loadVigie (vigie.js), la base par loadBase (fond.js) */
    // étiquettes des îles (vue de l'archipel)
    this.isleLbl = {}; Object.keys(PR_ISLES).forEach((k) => { const I = PR_ISLES[k]; const el = document.createElement('button'); el.className = 'isle-lbl'; el.innerHTML = '<span class="il-k"></span><b></b><small></small><span class="il-go">survoler →</span>';
      el.querySelector('.il-k').textContent = 'PROJET ' + I.n; el.querySelector('b').textContent = I.name; el.querySelector('small').textContent = I.line; el.onclick = () => this.visit(k); el.addEventListener('wheel', (e) => { e.preventDefault(); this.renderer.domElement.dispatchEvent(new WheelEvent('wheel', e)); }, { passive: false }); el.style.display = 'none'; this.layer.appendChild(el); this.isleLbl[k] = el; });
  },
  archView(instant) { const asp = (this.host && this.host.clientWidth / Math.max(1, this.host.clientHeight)) || 1.6, t25 = Math.tan(25 * Math.PI / 180);
    if (asp < 0.9) Object.assign(this.orbW, { tx: 70, tz: 10, ty: 0, yaw: Math.PI / 2, pitch: 1.1, dist: Math.min(1300, Math.max(720, 170 / (t25 * asp))) }); // téléphone : les îles l'une sous l'autre
    else Object.assign(this.orbW, { tx: 0, tz: 8, ty: 0, yaw: 0, pitch: 0.75, dist: Math.min(1300, Math.max(400, 270 / (t25 * asp))) });
    if (instant) Object.assign(this.orb, this.orbW); },
  archipel(instant) { const st = this.st(); if (st.plan) this.setPlan(false); this.cruiseP = null; this.route = []; this.autoDock = false; this.focused = null; this.isleK = null;
    if (this.nightTarget) this.setNightNow(0); this.sailK = null;
    if (!instant && !this.orbitPh(st.phase)) this.orbFromCam();
    this.archView(instant); this.setState({ phase: 'archipel', focus: null, showApp: false, ask: null, auto: false }); this.say(PR_RADIO.archipel); },
  // l'orbite repart de la caméra actuelle (pas de saut)
  orbFromCam() { const O = this.orb, c = this.cam.position; O.tx = this.look ? this.look.x : this.b.x; O.tz = this.look ? this.look.z : this.b.z; O.ty = 0; O.dist = Math.max(5, Math.hypot(c.x - O.tx, c.y, c.z - O.tz)); O.yaw = Math.atan2(c.x - O.tx, c.z - O.tz); O.pitch = Math.asin(Math.min(1, c.y / O.dist)); },
  berth(k) { if (k === 'serveur') return this.srvBerth(); if (k === 'cartevivante') return this.vgBerth(); const I = PR_ISLES[k]; return { x: I.x - 6 + 3.2, z: I.z + I.rz + 6, h: Math.PI / 2 }; },
  berthed(k) { if (!PR_ISLES[k] || !PR_ISLES[k].rx) return false; const B = this.berth(k); return Math.hypot(this.b.x - B.x, this.b.z - B.z) < 6; },
  // le pilote auto emmène Elba jusqu'au ponton de l'île suivante
  // la même règle partout : le pilote auto emmène Elba à l'île choisie
  isleApp(k, B) { return k === 'serveur' ? this.srvApp(B) : k === 'cartevivante' ? this.vgApp(B) : [{ x: B.x, z: B.z + 24 }]; },
  goSail(k) { if (k === 'insula') this.autopilot(); else this.sailTo(k); },
  // à l'approche d'une île barrée à la main, on propose d'accoster
  approachStep(ph, b) { if (!this.A) return; const pts = { insula: this.A }; ['cartevivante', 'serveur'].forEach((k) => { const B = this.berth(k); const ap = this.isleApp(k, B); pts[k] = ap[ap.length - 1]; });
    const best = this.sailDest || 'insula', bd = Math.hypot(b.x - pts[best].x, b.z - pts[best].z);
    if (ph === 'mer' && bd < 45) { this.approachK = best; this.setState({ phase: 'approche' }); this.say(best === 'insula' ? PR_RADIO.approche : PR_RADIO.approche2); }
    else if (ph === 'approche' && (bd > 60 || best !== this.approachK)) this.setState({ phase: 'mer' }); },
  // accoster depuis l'approche : on part d'où l'on est, sans revenir au point d'approche (plus de demi-tour)
  finalApproach(k) {
    const b = this.b, here = { x: b.x, z: b.z }; let T, pre;
    if (k === 'insula') { T = this.D; pre = [this.A, this.Dapp]; } else { T = this.berth(k); pre = this.isleApp(k, T); }
    const dT = Math.hypot(T.x - b.x, T.z - b.z), L = Math.max(3, Math.min(8, dT / 4)), lead = { x: b.x + Math.cos(b.h) * L, z: b.z - Math.sin(b.h) * L };
    const ahead = pre.filter((p) => Math.hypot(p.x - T.x, p.z - T.z) < dT - 6);
    const pts = [here, lead]; let s0 = lead; ahead.forEach((p) => { this.plan(s0, p).forEach((q) => pts.push(q)); s0 = p; }); pts.push(T);
    this.b.v = Math.max(this.b.v, 1); this.cruise(pts, true, k === 'insula' ? 10 : 12); this.autoDock = true; this.sailK = k === 'insula' ? null : k; this.sailDest = k; this.isleK = null;
    this.setState({ phase: 'mer', auto: true, ask: null }); this.say('Je prends la barre pour la manœuvre, on accoste.');
  },
  // ---------- traversée express : vue de dessus, Elba file vers sa destination (pas de fondu au noir)
  // où est Elba ? 'insula' (au quai), 'ponton', une île amarrée, ou null (en mer)
  boatAt() { const b = this.b; if (this.D && Math.hypot(b.x - this.D.x, b.z - this.D.z) < 6) return 'insula'; if (this.P0 && Math.hypot(b.x - this.P0.x - 3, b.z - this.P0.z + 4) < 6) return 'ponton'; return ['cartevivante', 'serveur'].find((k) => this.berthed(k)) || null; },
  // points pour quitter proprement l'endroit où l'on est
  departPts() { const b = { x: this.b.x, z: this.b.z }, pts = [b], at = this.boatAt(); let s0 = b;
    if (at === 'insula' && this.jetty) { const u = this.jetty.u, n = this.jetty.n; pts.push({ x: b.x + u.x * 4 + n.x * 3, z: b.z + u.z * 4 + n.z * 3 }); s0 = { x: this.Dapp.x + n.x * 10, z: this.Dapp.z + n.z * 10 }; pts.push(s0); }
    else if (at === 'serveur') { if (Math.cos(this.b.h) > 0) [[6, -2.5], [3, -5], [-3, -4]].forEach(([dx, dz]) => pts.push({ x: b.x + dx, z: b.z + dz }));   /* demi-tour dans le bassin */
      s0 = { x: b.x - 34, z: this.srvBerth().z }; pts.push({ x: b.x - 14, z: s0.z }); pts.push(s0); }
    else if (at === 'cartevivante') { pts.push({ x: b.x + 12, z: b.z + 2 }); s0 = { x: b.x + 30, z: b.z + 20 }; pts.push(s0); }   /* on longe le ponton vers l'est, puis on s'écarte */
    else { const P = this.P0; let e = null; if (Math.abs(b.x - P.x) < 12 && b.z > P.z - 16 && b.z < P.z + 16) e = { x: b.x + (b.x >= P.x ? 3 : -3), z: P.z - 22 }; else e = this.escape(b); if (e) { pts.push(e); s0 = e; } }
    return { pts, s0 }; },
  // aller voir un lieu : si Elba y est déjà, la caméra y vole ; sinon traversée express
  visit(k, then) { const at = this.boatAt();
    if (at === k) { if (k === 'ponton') this.embark(); else this.flyTo(k); if (then) then(); return; }
    this.transit(k, then); },
  transit(k, then) {
    const st = this.st(); if (st.plan) this.setPlan(false); this.focused = null; clearTimeout(this.appT); if (this.tip) this.tip.style.display = 'none';
    if (!this.orbitPh(st.phase)) this.orbFromCam(); if (this.nightTarget) this.nightTarget = 0;
    const { pts, s0 } = this.departPts(); let T, pre;
    if (k === 'insula') { T = { x: this.D.x, z: this.D.z }; pre = [this.A, this.Dapp]; }
    else if (k === 'ponton') { T = { x: this.P0.x + 3, z: this.P0.z - 4 }; pre = [{ x: T.x + 4, z: T.z + 26 }, { x: T.x, z: T.z + 10 }]; }
    else { T = this.berth(k); pre = this.isleApp(k, T); }
    let a = s0; pre.forEach((p) => { this.plan(a, p).forEach((q) => pts.push(q)); a = p; }); pts.push(T);
    this.cruise(pts, true, 30); const C = this.cruiseP; C.transit = true; C.vmax = Math.max(60, Math.min(240, C.len / 2)); C.v = 4;
    if (this.wake) { this.wake.userData.n = 0; this.wake.geometry.setDrawRange(0, 0); } this.transitK = k; this.transitThen = then || null; this.transitT = T; this.autoDock = true; this.sailK = null; this.sailDest = k === 'ponton' ? 'insula' : k; this.isleK = null;
    this.orbW.pitch = Math.max(0.95, this.orb.pitch); this.transitFrame(1);
    this.setState({ phase: 'transit', auto: true, focus: null, showApp: false, showCard: false, showMap: false, panel: null, ask: null });
    const I = PR_ISLES[k]; this.say(k === 'ponton' ? 'Retour au ponton, je fais vite !' : 'Cap sur ' + I.to + ', à toute vitesse !');
  },
  // la caméra cadre Elba et sa destination, et se rapproche à mesure
  transitFrame(dt) { const b = this.b, T = this.transitT; if (!T) return; const d = Math.hypot(T.x - b.x, T.z - b.z);
    const narrow = this.host.clientWidth < this.host.clientHeight; const f = Math.min(narrow ? 0.12 : 0.5, Math.max(0, (d - 40) / 400)); if (narrow && d > 25) this.orbW.yaw = Math.atan2(-(T.x - b.x), -(T.z - b.z)); Object.assign(this.orbW, { tx: b.x + (T.x - b.x) * f, tz: b.z + (T.z - b.z) * f, ty: 0, dist: Math.max(75, Math.min(300, d * (narrow ? 0.9 : 0.6) + 60)), pitch: 0.95 }); },
  transitEnd() { const k = this.transitK, then = this.transitThen; this.transitK = null; this.transitThen = null; this.transitT = null; this.autoDock = false; this.setNightNow(0);
    if (k === 'ponton') { Object.assign(this.b, { h: Math.PI / 2, v: 0, turn: 0 }); this.lookCur = new window.THREE.Vector3(this.orb.tx, this.orb.ty, this.orb.tz); this.swoop = 2.2; this.camYaw = 0; this.camPitch = 0.28; this.seen('ponton'); this.setState({ phase: 'ponton', auto: false }); this.say(PR_RADIO.ponton); }
    else { if (k !== 'insula') { const B = this.berth(k); Object.assign(this.b, { x: B.x, z: B.z, h: B.h, v: 0, turn: 0 }); } this.flyTo(k); this.setState({ auto: false }); }
    if (then) then(); },
  // pendant la traversée : un sillage d'écume et une étiquette « Elba » pour suivre le bateau de haut
  transitFx(T, ph) { const on = ph === 'transit', b = this.b;
    if (!this.wake) { const N = 160, pos = new Float32Array(N * 3); const g = new T.BufferGeometry(); g.setAttribute('position', new T.BufferAttribute(pos, 3)); g.setDrawRange(0, 0);
      this.wake = new T.Line(g, new T.LineBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0.85 })); this.wake.frustumCulled = false; this.wake.userData.n = 0; this.scene.add(this.wake);
      this.pin = document.createElement('div'); this.pin.className = 'boat-pin'; this.pin.textContent = '⛵ Elba'; this.pin.style.display = 'none'; this.layer.appendChild(this.pin); }
    const W = this.wake, g = W.geometry, A = g.attributes.position;
    if (!on) { if (W.material.opacity > 0.01) W.material.opacity *= 0.93; else { W.visible = false; W.userData.n = 0; } this.pin.style.display = 'none'; return; }
    W.visible = true; W.material.opacity = 0.85; let n = W.userData.n; const lx = n ? A.array[(n - 1) * 3] : 1e9, lz = n ? A.array[(n - 1) * 3 + 2] : 1e9;
    if (Math.hypot(b.x - lx, b.z - lz) > 2.5) { if (n >= 160) { A.array.copyWithin(0, 3); n = 159; } A.array.set([b.x, 0.3, b.z], n * 3); W.userData.n = ++n; A.needsUpdate = true; g.setDrawRange(0, n); }
    const p = new T.Vector3(b.x, 4, b.z).project(this.cam); if (p.z > 1) { this.pin.style.display = 'none'; return; }
    this.pin.style.display = 'block'; this.pin.style.left = ((p.x + 1) / 2 * this.host.clientWidth) + 'px'; this.pin.style.top = ((1 - p.y) / 2 * this.host.clientHeight) + 'px'; },
  skipTransit() { const C = this.cruiseP; if (!C || !C.transit) return; const T = this.transitT; this.cruiseP = null; this.route = []; Object.assign(this.b, { x: T.x, z: T.z, v: 0 }); this.transitEnd(); },
  sailTo(k) {
    if (k === 'insula') { this.autopilot(); return; }
    const st = this.st(); if (st.plan) this.setPlan(false); this.focused = null; clearTimeout(this.appT);
    const b = { x: this.b.x, z: this.b.z }, B = this.berth(k), pts = [b]; let s0 = b;
    if (st.phase === 'accoste' && this.jetty) { const u = this.jetty.u, n = this.jetty.n; pts.push({ x: b.x + u.x * 4 + n.x * 3, z: b.z + u.z * 4 + n.z * 3 }); s0 = { x: this.Dapp.x + n.x * 10, z: this.Dapp.z + n.z * 10 }; pts.push(s0); }
    else if (st.phase === 'escale' && (this.isleK === 'serveur' || this.isleK === 'cartevivante')) { const d = this.departPts(); pts.length = 0; d.pts.forEach((p) => pts.push(p)); s0 = d.s0; }
    else if (st.phase === 'escale') { s0 = { x: b.x, z: b.z + 22 }; pts.push(s0); }
    else { const P = this.P0; let e = null; if (Math.abs(b.x - P.x) < 12 && b.z > P.z - 16 && b.z < P.z + 16) e = { x: b.x + (b.x >= P.x ? 3 : -3), z: P.z - 22 }; else e = this.escape(b); if (e) { pts.push(e); s0 = e; } }
    const app = this.isleApp(k, B); let a0 = s0; app.forEach((ap) => { this.plan(a0, ap).forEach((p) => pts.push(p)); a0 = ap; }); pts.push(B);
    this.b.v = 1; this.cruise(pts, true, 17); this.autoDock = true; this.sailK = k; this.sailDest = k; this.isleK = null;
    this.setState({ phase: 'mer', auto: true, focus: null, showApp: false, showCard: false, ask: null });
    this.say('Cap sur ' + PR_ISLES[k].to + ' ! Je tiens la barre, regarde la route en pointillés sur la carte marine.');
  },
  flyTo(k, keepH) {
    if (k === 'insula') { if (!this.D) return; this.setState({ showMap: false }); const u = this.jetty.u; Object.assign(this.b, { x: this.D.x, z: this.D.z, h: Math.atan2(u.z, -u.x), v: 0, turn: 0 }); this.cruiseP = null; this.route = []; this.isleK = null;
      this.overview(); this.visited = true; this.seen('insula'); this.setState({ phase: 'accoste', showCard: false }); this.say(PR_RADIO.accoste); return; }
    const I = PR_ISLES[k]; if (!I) return; this.isleK = k; this.seen(k); const B = this.berth(k); Object.assign(this.b, { x: B.x, z: B.z, h: keepH ? this.b.h : B.h, v: 0, turn: 0 }); this.cruiseP = null; this.route = []; this.sailK = null; this.autoDock = false; const v = I.view, narrow = this.host.clientWidth < this.host.clientHeight;
    Object.assign(this.orbW, { tx: I.x + (v.dx || 0), tz: I.z + (v.dz || 0), ty: v.ty, yaw: v.yaw, pitch: v.pitch, dist: v.dist * (narrow ? 1.7 : 1) });
    this.setState({ phase: 'escale', showMap: false, ask: null, auto: false }); this.say(PR_RADIO[k], 'LOUIS-MARIE · ' + I.name.toUpperCase());
  },
  // embarquer : la caméra plonge de l'archipel vers le ponton
  embark() { if (this.boatAt() !== 'ponton') { this.transit('ponton'); return; } this.setNightNow(0); Object.assign(this.b, { x: this.P0.x + 3.0, z: this.P0.z - 4, h: Math.PI / 2, v: 0, turn: 0 }); this.cruiseP = null; this.route = []; this.isleK = null;
    this.lookCur = new window.THREE.Vector3(this.orb.tx, this.orb.ty, this.orb.tz); this.swoop = 2.2; this.camYaw = 0; this.camPitch = 0.28; this.seen('ponton'); this.setState({ phase: 'ponton', showMap: false }); this.say(PR_RADIO.ponton); },
  islesHit(cx, cy) { const T = window.THREE, r = this.renderer.domElement.getBoundingClientRect(); const rc = new T.Raycaster(); rc.setFromCamera(new T.Vector2(((cx - r.left) / r.width) * 2 - 1, -((cy - r.top) / r.height) * 2 + 1), this.cam);
    if (this.island && (rc.intersectObject(this.island, true).length || rc.intersectObject(this.trees, true).length)) return 'insula';
    for (const k in this.isleG || {}) if (rc.intersectObject(this.isleG[k], true).length) return k; return null; },
  islePen(x, z) { return Math.max(this.vgPen(x, z), this.basePen(x, z)); },
  isleStep(T, t, dt, ph) {
    this.transitFx(T, ph);
    if (!this.isleG) return;
    // brume repoussée vue de haut
    const far = ph === 'archipel' ? 3000 : (this.st().plan ? 2600 : 1350), near = ph === 'archipel' ? 500 : 220; const F = this.scene.fog; F.far += (far - F.far) * Math.min(1, dt * 2); F.near += (near - F.near) * Math.min(1, dt * 2);
    // étiquettes
    const W = this.host.clientWidth, H = this.host.clientHeight, show = ph === 'archipel';
    for (const k in this.isleLbl) { const el = this.isleLbl[k], I = PR_ISLES[k]; if (!show) { el.style.display = 'none'; continue; } const p = new T.Vector3(I.x, I.top, I.z).project(this.cam); if (p.z > 1) { el.style.display = 'none'; continue; } el.style.display = 'block'; el.style.left = ((p.x + 1) / 2 * W) + 'px'; el.style.top = ((1 - p.y) / 2 * H) + 'px'; el.classList.toggle('done', !!(this.visitedSet || {})[k]); }
    if (ph === 'archipel' && this.mouse && (this.archHov = (this.archHov || 0) + dt) > 0.1) { this.archHov = 0; const k = this.islesHit(this.mouse.x, this.mouse.y); this.renderer.domElement.style.cursor = k ? 'pointer' : 'grab'; for (const kk in this.isleLbl) this.isleLbl[kk].classList.toggle('hov', kk === k); }
  }
});
