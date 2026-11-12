/* Fin du parcours : repère d'île en mer, tombée de la nuit, cabine d'Elba (à propos, livre de bord, VHF). */
const PR_CABIN = {
  apropos: {
    kicker: 'À PROPOS · LA PHOTO', title: 'Louis-Marie Perret du Cray',
    paras: [
      "Étudiant ingénieur à l'ESILV, en alternance chez Devoteam, dans l'équipe IA de la DSI du groupe.",
      "J'aime comprendre comment les choses marchent, puis construire l'outil qui manque. Insula en est un : il est né d'une vraie question, acheter un appartement entre amis.",
      "Quand je ne suis pas devant un écran, je navigue sur Elba, un Flirt de 1977. C'est lui qui t'a porté jusqu'ici."
    ],
    links: [['GitHub', 'https://github.com/LM28000'], ['LinkedIn', 'https://www.linkedin.com/in/louismarie-perret-du-cray/']]
  },
  recap: {
    kicker: 'LIVRE DE BORD · TA TRAVERSÉE', title: 'Récap du voyage',
    list: [
      ['Départ', 'Le ponton, à bord d’Elba.'],
      ['Escale n° 1 · Insula', 'Choisir où acheter, entre amis : 22 villes, les annonces du soir, 15 ans de calcul. Démo au cinéma, app dans la longue-vue.'],
      ['Prochaines escales', 'D’autres îles arrivent : chacune sera un projet.']
    ],
    paras: ['Le CV complet (PDF) arrive bientôt ici.'],
    links: [['Essayer Insula', 'https://insula.du-cray.eu/'], ['Le code d’Insula', 'https://github.com/LM28000/immobilier-tool']]
  },
  contact: {
    kicker: 'VHF · CANAL 16', title: 'Me laisser un message',
    paras: ["Une question, une idée, un projet à faire naviguer ? Le plus simple, c'est de m'écrire sur LinkedIn."],
    links: [['Écrire sur LinkedIn', 'https://www.linkedin.com/in/louismarie-perret-du-cray/'], ['Mon GitHub', 'https://github.com/LM28000']]
  }
};
const PR_CABIN_RADIO = {
  enter: "Bienvenue dans la cabine. La photo, c'est un peu moi ; le livre de bord, c'est ta traversée ; et la VHF, c'est pour me laisser un message.",
  apropos: "Voilà qui tient la barre de ce site.",
  recap: "Ton livre de bord : d'où tu es parti, où tu as fait escale.",
  contact: "Canal 16, je t'écoute. Laisse-moi un message, je te réponds."
};

const PR_STOPS = [
  { k: 'insula', n: '1', t: 'Insula', d: 'Choisir où acheter, entre amis', x: 50, y: 13, big: true },
  { k: 'cinema', n: '1a', t: 'Le cinéma', d: 'La démo, en une minute', x: 37, y: 31, sub: true },
  { k: 'longuevue', n: '1b', t: 'La longue-vue', d: 'Essayer l\u2019app pour de vrai', x: 63, y: 31, sub: true },
  { k: 'archi', n: '1c', t: 'Les coulisses', d: 'L\u2019architecture', x: 50, y: 44, sub: true },
  { k: 'cartevivante', n: '2', t: 'Carte vivante', d: 'La France en direct', x: 15, y: 18, big: true },
  { k: 'serveur', n: '3', t: 'Le serveur', d: 'Mon serveur maison', x: 85, y: 18, big: true },
  { k: 'ponton', n: '⚓', t: 'Le ponton', d: 'Embarquer, barrer Elba', x: 14, y: 72 },
  { k: 'nuit', n: '☾', t: 'La nuit tombe', d: 'Fin de la traversée', x: 40, y: 72 },
  { k: 'cabine', n: '⌂', t: 'La cabine', d: 'Qui je suis · CV · contact', x: 70, y: 72, big: true },
  { k: 'carte', n: 'a', t: 'La carte', d: 'Mon parcours', x: 10, y: 90, sub: true },
  { k: 'coffre', n: 'b', t: 'Le coffre', d: 'Mon CV', x: 26, y: 90, sub: true },
  { k: 'recap', n: 'c', t: 'Le livre', d: 'Ta traversée', x: 42, y: 90, sub: true },
  { k: 'bouteilles', n: 'd', t: 'Bouteilles', d: 'Anecdotes', x: 58, y: 90, sub: true },
  { k: 'apropos', n: 'e', t: 'La photo', d: 'À propos', x: 74, y: 90, sub: true },
  { k: 'contact', n: 'f', t: 'La VHF', d: 'Me contacter', x: 90, y: 90, sub: true }
];
Object.assign(Component.prototype, {
  seen(k) { this.visitedSet = this.visitedSet || {}; if (!this.visitedSet[k]) { this.visitedSet[k] = true; try { localStorage.setItem('elba-escales', JSON.stringify(this.visitedSet)); } catch (e) {} this.setState({ v: Date.now() }); } },
  // ---------- repère au-dessus de l'île, visible en mer
  buildMarker(T) {
    const c = document.createElement('canvas'); c.width = 640; c.height = 170; const g = c.getContext('2d');
    g.fillStyle = 'rgba(11,22,38,0.88)'; g.beginPath(); g.roundRect ? g.roundRect(4, 4, 632, 130, 26) : g.rect(4, 4, 632, 130); g.fill();
    g.beginPath(); g.moveTo(300, 134); g.lineTo(320, 166); g.lineTo(340, 134); g.fill();
    g.fillStyle = '#FFC94A'; g.font = '700 30px JetBrains Mono, monospace'; g.fillText('ÎLE N° 1', 34, 50);
    g.fillStyle = '#FFFFFF'; g.font = '700 46px Fraunces, Georgia, serif'; g.fillText('Insula', 200, 54);
    g.fillStyle = '#7FE6FF'; g.font = '600 28px Inter, sans-serif'; g.fillText('⛵ cliquer pour y aller', 34, 108);
    const sp = new T.Sprite(new T.SpriteMaterial({ map: new T.CanvasTexture(c), depthTest: false, transparent: true })); sp.renderOrder = 30;
    sp.scale.set(30, 30 * 170 / 640, 1); sp.position.set(4, 42, -2); this.scene.add(sp); this.marker = sp;
  },
  markerStep(T, t, ph) {
    if (!this.marker) return; const atSea = ph === 'ponton' || ph === 'mer' || ph === 'approche';
    this.marker.visible = atSea && !this.cruiseP && !this.st().auto;
    const k = 1 + 0.05 * Math.sin(t * 3); this.marker.scale.set(30 * k, 30 * k * 170 / 640, 1);
    if ((ph === 'mer' || ph === 'approche') && this.mouse && this.island && (this.seaHov = (this.seaHov || 0) + 1) % 6 === 0) {
      const r0 = this.renderer.domElement.getBoundingClientRect(); const rc = new T.Raycaster(); rc.setFromCamera(new T.Vector2(((this.mouse.x - r0.left) / r0.width) * 2 - 1, -((this.mouse.y - r0.top) / r0.height) * 2 + 1), this.cam);
      const hit = rc.intersectObject(this.island, true).length || (this.marker.visible && rc.intersectObject(this.marker).length);
      this.renderer.domElement.style.cursor = hit && !this.st().auto ? 'pointer' : 'grab';
      if (hit && !this.st().auto) { this.tip.innerHTML = '<b>⛵</b>Insula · y aller'; this.tip.style.display = 'block'; this.tip.style.left = (this.mouse.x - r0.left) + 'px'; this.tip.style.top = (this.mouse.y - r0.top - 14) + 'px'; } else this.tip.style.display = 'none';
    }
  },
  // ---------- tombée de la nuit
  ensureNight() {
    const T = window.THREE; if (this.stars) return;
    const n = 1400, pos = new Float32Array(n * 3); for (let i = 0; i < n; i++) { const u = Math.random(), v = Math.random() * 0.95 + 0.05; const th = 2 * Math.PI * u, y = v; const rr = Math.sqrt(1 - y * y); pos[3 * i] = Math.cos(th) * rr * 1350; pos[3 * i + 1] = y * 1350; pos[3 * i + 2] = Math.sin(th) * rr * 1350; }
    const g = new T.BufferGeometry(); g.setAttribute('position', new T.BufferAttribute(pos, 3));
    this.stars = new T.Points(g, new T.PointsMaterial({ color: 0xffffff, size: 1.6, sizeAttenuation: false, transparent: true, opacity: 0, fog: false, depthWrite: false })); this.scene.add(this.stars);
    const mc = document.createElement('canvas'); mc.width = mc.height = 128; const mg = mc.getContext('2d'); const gr = mg.createRadialGradient(64, 64, 10, 64, 64, 64); gr.addColorStop(0, 'rgba(255,250,235,1)'); gr.addColorStop(0.32, 'rgba(255,250,235,1)'); gr.addColorStop(0.36, 'rgba(200,215,255,0.35)'); gr.addColorStop(1, 'rgba(200,215,255,0)'); mg.fillStyle = gr; mg.fillRect(0, 0, 128, 128);
    this.moon = new T.Sprite(new T.SpriteMaterial({ map: new T.CanvasTexture(mc), transparent: true, opacity: 0, fog: false, depthWrite: false })); this.moon.position.set(-420, 520, -1100); this.moon.scale.set(150, 150, 1); this.scene.add(this.moon);
    this.boatLamp = new T.PointLight(0xffb36b, 0, 14, 2); this.scene.add(this.boatLamp);
    this.boatWin = []; if (this.boat) this.boat.traverse((o) => { if (o.isMesh && o.material && /^Hublot/.test(o.material.name || '')) { o.material = o.material.clone(); o.material.emissive = new T.Color(0xffa64d); o.material.emissiveIntensity = 0; this.boatWin.push(o.material); } });
    const C = (h) => new T.Color(h); this.nightCols = { top: [C(0x5d86b8), C(0x050a18)], hor: [C(0xf2cfb0), C(0x1b2c4e)], fog: [this.fogDay.clone(), C(0x0a1426).convertSRGBToLinear()], deep: [C(0x0d3a5c), C(0x020c18)], shallow: [C(0x2f7f9a), C(0x0a2236)], skyc: [C(0xf0d2b8), C(0x1d2d4a)], spec: [C(0xffd9a6), C(0x9fb8ff)], hemi: [C(0xcfe0ff), C(0x41598c)], sun: [C(0xffe2c4), C(0x9fb4ff)] };
  },
  // nuit instantanée (0 = jour, 1 = nuit), pour les sauts de la carte du voyage
  setNightNow(v) { this.ensureNight(); this.nightTarget = v; this.night = v === 1 ? 0.999 : 0.001; this.nightStep(window.THREE, 1); this.night = v; },
  // caméra en orbite autour du bateau, placée sur son trois-quarts arrière tribord
  orbitBoat(dist, pitch) { const b = this.b, c = this.cam.position, O = this.orb;
    const fx = Math.cos(b.h), fz = -Math.sin(b.h), rx = Math.sin(b.h), rz = Math.cos(b.h); const dx = rx - fx * 0.75, dz = rz - fz * 0.75; const yaw = Math.atan2(dx, dz);
    O.tx = b.x; O.tz = b.z; O.ty = 1.8; O.dist = Math.min(60, Math.max(18, Math.hypot(c.x - b.x, c.z - b.z))); O.yaw = Math.atan2(c.x - b.x, c.z - b.z); O.pitch = 0.3;
    Object.assign(this.orbW, { tx: b.x, tz: b.z, ty: 1.8, yaw, pitch: pitch || 0.16, dist: dist || 19 }); },
  startNight() {
    this.ensureNight(); const ph = this.st().phase; this.prevPhase = ph === 'accoste' ? 'accoste' : 'mer';
    this.cruiseP = null; this.route = []; this.autoDock = false; this.orbitBoat();
    this.seen('nuit'); this.nightTarget = 1; this.setState({ phase: 'nuit', auto: false, focus: null, showApp: false, ask: null });
    this.say("Le soleil se couche, on rentre. Descends dans la cabine : je t'y attends. (Tu peux aussi annuler et repartir.)"); this.loadCabin();
  },
  cancelNight() {
    this.nightTarget = 0; const back = this.prevPhase || 'accoste'; this.setState({ phase: back });
    if (back === 'accoste') { this.overview(); this.say("Pas encore sommeil ? L'île est à toi."); } else this.say('On repart ! Le soleil remonte.');
  },
  // ---------- carte du voyage : tous les lieux, le parcours suggéré, et un saut vers n'importe lequel
  goTo(k) {
    this.setState({ showMap: false });
    this.fade(() => {
      const st = this.st(); if (st.plan) this.setPlan(false); this.cruiseP = null; this.route = []; this.autoDock = false; this.focused = null; clearTimeout(this.appT);
      this.setState({ showApp: false, panel: null, ask: null, focus: null, auto: false });
      const atQuay = () => { const u = this.jetty.u; this.b.x = this.D.x; this.b.z = this.D.z; this.b.h = Math.atan2(u.z, -u.x); this.b.v = 0; this.b.turn = 0; };
      if (k === 'archipel') { this.archipel(true); return; }
      if (k === 'cartevivante' || k === 'serveur') { this.setNightNow(0); this.flyTo(k); Object.assign(this.orb, this.orbW); return; }
      if (k === 'ponton') { this.setNightNow(0); Object.assign(this.b, { x: this.P0.x + 3.0, z: this.P0.z - 4, h: Math.PI / 2, v: 0, turn: 0 }); this.camYaw = 0; this.camPitch = 0.28; this.setState({ phase: 'ponton' }); this.say(PR_RADIO.ponton); return; }
      if (['insula', 'cinema', 'longuevue', 'archi'].includes(k)) { this.setNightNow(0); atQuay(); this.docked(); if (k === 'cinema' || k === 'longuevue') this.focus(k); if (k === 'archi') this.setPlan(true); return; }
      this.setNightNow(1); atQuay(); this.prevPhase = 'accoste';
      if (k === 'nuit') { this.orbitBoat(); this.setState({ phase: 'nuit' }); this.say("La nuit est tombée sur Insula. Descends dans la cabine quand tu veux."); return; }
      const obj = { carte: 'carte', coffre: 'coffre', recap: 'livre', bouteilles: 'bouteilles', apropos: 'photo', contact: 'vhf' }[k];
      const inCab = () => { const C = this.cabin; C.cam.aspect = this.host.clientWidth / this.host.clientHeight; C.cam.updateProjectionMatrix(); this.cabUnfocus(true); this.seen('cabine'); this.setState({ phase: 'cabine', panel: null, loading: false }); if (obj) setTimeout(() => this.cabFocus(obj), 250); else this.say(PR_CAB_RADIO2.enter); };
      if (this.cabin) inCab(); else { this.setState({ loading: true, loadMsg: 'la cabine…' }); this.loadCabin(inCab); }
    });
  },
  nightStep(T, dt) {
    if (this.nightTarget == null) return; const n0 = this.night || 0; const n = n0 + Math.max(-dt / 4, Math.min(dt / 4, this.nightTarget - n0)); if (n === n0 && n0 > 0.999) return; this.night = n;
    const L = this.nightCols, e = n * n * (3 - 2 * n), mix = (k, out) => out.copy(L[k][0]).lerp(L[k][1], e);
    const U = this.sky.material.uniforms; mix('top', U.top.value); mix('hor', U.hor.value); U.glow.value = 1 - e;
    const S = this.sea.material.uniforms; mix('deep', S.deep.value); mix('shallow', S.shallow.value); mix('skyc', S.skyc.value); mix('spec', S.spec.value);
    S.sunDir.value.set(-0.35, 0.42 * e + 0.2 * (1 - e), -0.93).normalize();
    mix('fog', this.scene.fog.color); mix('hemi', this.hemi.color); this.hemi.intensity = 0.75 - 0.5 * e; mix('sun', this.sunL.color); this.sunL.intensity = 1.35 - 1.0 * e;
    this.stars.material.opacity = Math.max(0, e * 1.2 - 0.2); this.moon.material.opacity = e;
    this.boatLamp.intensity = 1.6 * e; this.boatLamp.position.set(this.b.x, 1.8, this.b.z); this.boatWin.forEach((m) => { m.emissiveIntensity = 1.8 * e; });
    if (this.boat) this.boat.traverse((o) => { if (o.isMesh && o.material && /^feu/.test(o.material.name || '')) o.material.emissiveIntensity = 2 + 4 * e; });
  },
  fade(onMid) {
    if (!this.fader) { this.fader = document.createElement('div'); this.fader.style.cssText = 'position:absolute;inset:0;background:#000;opacity:0;transition:opacity .6s;pointer-events:none;z-index:4'; this.layer.appendChild(this.fader); }
    this.fader.style.opacity = 1; setTimeout(() => { onMid(); setTimeout(() => { this.fader.style.opacity = 0; }, 120); }, 650);
  },
});
