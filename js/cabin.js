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
  { k: 'ponton', n: '1', t: 'Le ponton', d: 'Le départ, à bord d’Elba', x: 12, y: 84 },
  { k: 'insula', n: '2', t: 'Insula', d: 'Île n° 1 · choisir où acheter, entre amis', x: 40, y: 34, big: true },
  { k: 'cinema', n: '2a', t: 'Le cinéma', d: 'La démo, en une minute', x: 56, y: 18, sub: true },
  { k: 'longuevue', n: '2b', t: 'La longue-vue', d: 'Essayer l’app pour de vrai', x: 25, y: 16, sub: true },
  { k: 'archi', n: '2c', t: 'Les coulisses', d: 'L’architecture', x: 60, y: 46, sub: true },
  { k: 'nuit', n: '3', t: 'La nuit tombe', d: 'Fin de la traversée', x: 78, y: 60 },
  { k: 'cabine', n: '4', t: 'La cabine', d: 'À bord, à la lanterne', x: 82, y: 76, big: true },
  { k: 'apropos', n: '4a', t: 'À propos', d: 'La photo', x: 62, y: 86, sub: true },
  { k: 'recap', n: '4b', t: 'Livre de bord', d: 'Récap du voyage', x: 74, y: 93, sub: true },
  { k: 'contact', n: '4c', t: 'La VHF', d: 'Me laisser un message', x: 90, y: 93, sub: true }
];
Object.assign(Component.prototype, {
  seen(k) { this.visitedSet = this.visitedSet || {}; if (!this.visitedSet[k]) { this.visitedSet[k] = true; this.setState({ v: Date.now() }); } },
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
    this.say("Le soleil se couche, on rentre. Descends dans la cabine : je t'y attends. (Tu peux aussi annuler et repartir.)");
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
      if (k === 'ponton') { this.setNightNow(0); Object.assign(this.b, { x: this.P0.x + 3.0, z: this.P0.z - 4, h: Math.PI / 2, v: 0, turn: 0 }); this.camYaw = 0; this.camPitch = 0.28; this.setState({ phase: 'ponton' }); this.say(PR_RADIO.ponton); return; }
      if (['insula', 'cinema', 'longuevue', 'archi'].includes(k)) { this.setNightNow(0); atQuay(); this.docked(); if (k === 'cinema' || k === 'longuevue') this.focus(k); if (k === 'archi') this.setPlan(true); return; }
      this.setNightNow(1); atQuay(); this.prevPhase = 'accoste';
      if (k === 'nuit') { this.orbitBoat(); this.setState({ phase: 'nuit' }); this.say("La nuit est tombée sur Insula. Descends dans la cabine quand tu veux."); return; }
      if (!this.cabin) this.buildCabin(window.THREE); this.cabin.cam.aspect = this.host.clientWidth / this.host.clientHeight; this.cabin.cam.updateProjectionMatrix();
      const panel = ['apropos', 'recap', 'contact'].includes(k) ? k : null; this.setState({ phase: 'cabine', panel }); this.say(panel ? PR_CABIN_RADIO[panel] : PR_CABIN_RADIO.enter, 'LOUIS-MARIE · CABINE');
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
  // ---------- la cabine
  buildCabin(T) {
    const scene = new T.Scene(); scene.background = new T.Color(0x07101e); scene.fog = new T.Fog(0x120b06, 4, 12);
    const cam = new T.PerspectiveCamera(62, this.host.clientWidth / this.host.clientHeight, 0.05, 50);
    const room = new T.Group(); scene.add(room);
    const lin = (h) => new T.Color(h).convertSRGBToLinear();
    const planks = (base, line, n) => { const c = document.createElement('canvas'); c.width = 256; c.height = 256; const g = c.getContext('2d'); g.fillStyle = base; g.fillRect(0, 0, 256, 256); for (let i = 0; i < n; i++) { g.fillStyle = i % 2 ? 'rgba(0,0,0,0.07)' : 'rgba(255,255,255,0.04)'; g.fillRect(0, i * 256 / n, 256, 256 / n); g.fillStyle = line; g.fillRect(0, i * 256 / n, 256, 2); } const t = new T.CanvasTexture(c); t.encoding = T.sRGBEncoding; t.wrapS = t.wrapT = T.RepeatWrapping; return t; };
    const teak = new T.MeshStandardMaterial({ map: planks('#7a4a26', '#3a2210', 8), roughness: 0.7 });
    const teakDark = new T.MeshStandardMaterial({ color: lin(0x4a2c16), roughness: 0.6 });
    const floorT = planks('#6b4022', '#2e1a0b', 10); floorT.repeat.set(2, 1);
    const cream = new T.MeshStandardMaterial({ color: lin(0xe9e1cf), roughness: 0.9 });
    const cushion = new T.MeshStandardMaterial({ color: lin(0x1f4f9a), roughness: 0.95 });
    const box = (w, h, d, m, x, y, z) => { const o = new T.Mesh(new T.BoxGeometry(w, h, d), m); o.position.set(x, y, z); room.add(o); return o; };
    const Lx = 4.4, Wz = 2.5, Hy = 1.95;
    const floor = new T.Mesh(new T.PlaneGeometry(Lx, Wz), new T.MeshStandardMaterial({ map: floorT, roughness: 0.6 })); floor.rotation.x = -Math.PI / 2; room.add(floor);
    const ceil = new T.Mesh(new T.PlaneGeometry(Lx, Wz), cream); ceil.rotation.x = Math.PI / 2; ceil.position.y = Hy; room.add(ceil);
    for (let i = -2; i <= 2; i++) box(0.08, 0.07, Wz, teakDark, i * 0.9, Hy - 0.04, 0);
    for (const sz of [-1, 1]) { const w = new T.Mesh(new T.PlaneGeometry(Lx, Hy), teak); w.position.set(0, Hy / 2, sz * Wz / 2); w.rotation.y = sz > 0 ? Math.PI : 0; room.add(w); }
    const front = new T.Mesh(new T.PlaneGeometry(Wz, Hy), teak); front.position.set(Lx / 2, Hy / 2, 0); front.rotation.y = -Math.PI / 2; room.add(front);
    box(0.02, 1.45, 0.7, new T.MeshStandardMaterial({ color: 0x0c0806 }), Lx / 2 - 0.02, 0.8, 0);
    const back = new T.Mesh(new T.PlaneGeometry(Wz, Hy), teak); back.position.set(-Lx / 2, Hy / 2, 0); back.rotation.y = Math.PI / 2; room.add(back);
    for (let i = 0; i < 3; i++) box(0.32, 0.05, 0.62, teakDark, -Lx / 2 + 0.25 + i * 0.12, 0.3 + i * 0.42, 0);
    // couchettes
    for (const sz of [-1, 1]) { box(2.9, 0.42, 0.66, teakDark, 0.15, 0.21, sz * 0.9); box(2.85, 0.14, 0.62, cushion, 0.15, 0.49, sz * 0.9); box(2.85, 0.42, 0.12, cushion, 0.15, 0.78, sz * 1.17); }
    // table
    box(1.2, 0.05, 0.62, teakDark, 0.35, 0.74, 0); box(0.1, 0.72, 0.1, teakDark, 0.35, 0.36, 0);
    // hublots (clair de lune)
    for (const sz of [-1, 1]) for (const x of [-0.6, 0.9]) { const h = new T.Mesh(new T.CircleGeometry(0.16, 24), new T.MeshBasicMaterial({ color: 0x3a5a9a })); h.scale.set(1.6, 1, 1); h.position.set(x, 1.45, sz * (Wz / 2 - 0.01)); h.rotation.y = sz > 0 ? Math.PI : 0; room.add(h); const rim = new T.Mesh(new T.RingGeometry(0.16, 0.2, 24), new T.MeshStandardMaterial({ color: 0xb58a3a, metalness: 0.8, roughness: 0.3 })); rim.scale.set(1.6, 1, 1); rim.position.copy(h.position); rim.position.z -= sz * 0.005; rim.rotation.y = h.rotation.y; room.add(rim); }
    // lanterne
    const lamp = new T.Mesh(new T.SphereGeometry(0.07, 16, 12), new T.MeshBasicMaterial({ color: 0xffd08a })); lamp.position.set(0.35, 1.55, 0); room.add(lamp);
    box(0.01, 0.35, 0.01, teakDark, 0.35, 1.78, 0);
    const light = new T.PointLight(0xffb36b, 2.2, 7, 1.6); light.position.copy(lamp.position); room.add(light); this.cabinLight = light;
    scene.add(new T.HemisphereLight(0x5a78b8, 0x2a1608, 0.35));
    const moonL = new T.DirectionalLight(0x8fa8ff, 0.25); moonL.position.set(0, 2, -3); scene.add(moonL);
    // objets cliquables
    const clickables = [];
    const tl = new T.TextureLoader(); const canvasTex = (w, h, draw) => { const c = document.createElement('canvas'); c.width = w; c.height = h; draw(c.getContext('2d'), w, h); const t = new T.CanvasTexture(c); t.encoding = T.sRGBEncoding; return t; };
    // 1. la photo (à propos), sur la cloison tribord
    const photo = new T.Group(); photo.userData.k = 'apropos';
    const fr = new T.Mesh(new T.BoxGeometry(0.62, 0.46, 0.03), teakDark); photo.add(fr);
    const ptex = tl.load('assets/og.jpg'); ptex.encoding = T.sRGBEncoding;
    const pic = new T.Mesh(new T.PlaneGeometry(0.54, 0.31), new T.MeshStandardMaterial({ map: ptex, roughness: 0.5 })); pic.position.set(0, 0.03, 0.017); photo.add(pic);
    const cap = new T.Mesh(new T.PlaneGeometry(0.54, 0.06), new T.MeshBasicMaterial({ map: canvasTex(512, 56, (g) => { g.fillStyle = '#efe6d2'; g.fillRect(0, 0, 512, 56); g.fillStyle = '#3a2210'; g.font = 'italic 30px Georgia, serif'; g.fillText('Elba · LR · et son skipper', 18, 38); }) })); cap.position.set(0, -0.17, 0.017); photo.add(cap);
    photo.position.set(0.2, 1.3, Wz / 2 - 0.03); photo.rotation.y = Math.PI; room.add(photo); clickables.push(photo);
    // 2. le livre de bord (récap), ouvert sur la table
    const book = new T.Group(); book.userData.k = 'recap';
    const cover = new T.Mesh(new T.BoxGeometry(0.46, 0.012, 0.32), new T.MeshStandardMaterial({ color: lin(0x6b1d14), roughness: 0.6 })); book.add(cover);
    const pagesTex = canvasTex(512, 360, (g, w, h) => { g.fillStyle = '#f3ead5'; g.fillRect(0, 0, w, h); g.fillStyle = '#c9b892'; g.fillRect(w / 2 - 1, 0, 2, h); g.fillStyle = '#6b1d14'; g.font = '700 26px Georgia, serif'; g.fillText('Livre de bord', 30, 50); g.fillStyle = '#3a3226'; g.font = 'italic 19px Georgia, serif'; ['Départ : le ponton', 'Escale : Insula', 'Vent : léger', 'Mer : belle'].forEach((l, i) => g.fillText(l, 30, 100 + i * 34)); g.fillText('Prochaines îles…', w / 2 + 24, 100); for (let i = 0; i < 7; i++) { g.fillStyle = 'rgba(80,60,40,0.18)'; g.fillRect(w / 2 + 24, 140 + i * 28, 200, 2); } });
    const pages = new T.Mesh(new T.PlaneGeometry(0.44, 0.3), new T.MeshStandardMaterial({ map: pagesTex, roughness: 0.9 })); pages.rotation.x = -Math.PI / 2; pages.position.y = 0.008; book.add(pages);
    book.position.set(0.35, 0.775, 0); book.rotation.y = Math.PI / 2 + 0.15; room.add(book); clickables.push(book);
    // 3. la VHF (contact), au-dessus de la table à cartes bâbord
    box(0.34, 0.04, 0.22, teakDark, Lx / 2 - 0.13, 1.1, -0.72);
    const vhf = new T.Group(); vhf.userData.k = 'contact';
    const body = new T.Mesh(new T.BoxGeometry(0.34, 0.13, 0.14), new T.MeshStandardMaterial({ color: 0x15171a, roughness: 0.5 })); vhf.add(body);
    const scr = new T.Mesh(new T.PlaneGeometry(0.14, 0.06), new T.MeshBasicMaterial({ map: canvasTex(140, 60, (g) => { g.fillStyle = '#7dffb0'; g.fillRect(0, 0, 140, 60); g.fillStyle = '#0b2a18'; g.font = '700 40px JetBrains Mono, monospace'; g.fillText('16', 46, 44); g.font = '700 12px monospace'; g.fillText('CH', 10, 20); }) })); scr.position.set(-0.06, 0.01, 0.071); vhf.add(scr);
    for (let i = 0; i < 2; i++) { const kb = new T.Mesh(new T.CylinderGeometry(0.022, 0.022, 0.02, 16), new T.MeshStandardMaterial({ color: 0x333333 })); kb.rotation.x = Math.PI / 2; kb.position.set(0.08 + i * 0.06, 0, 0.075); vhf.add(kb); }
    const led = new T.Mesh(new T.SphereGeometry(0.008, 8, 6), new T.MeshBasicMaterial({ color: 0xff3b2f })); led.position.set(0.14, 0.045, 0.072); vhf.add(led); this.vhfLed = led;
    const hand = new T.Mesh(new T.BoxGeometry(0.06, 0.16, 0.035), new T.MeshStandardMaterial({ color: 0x15171a })); hand.position.set(0.24, -0.02, 0.02); vhf.add(hand);
    const vl = new T.PointLight(0x7dffb0, 0.4, 1.2); vl.position.set(-0.06, 0, 0.2); vhf.add(vl);
    vhf.position.set(Lx / 2 - 0.1, 1.2, -0.72); vhf.rotation.y = -Math.PI / 2; room.add(vhf); clickables.push(vhf);
    // repères dorés au-dessus des objets cliquables
    const dots = clickables.map((o) => { const d = new T.Mesh(new T.SphereGeometry(0.025, 12, 8), new T.MeshBasicMaterial({ color: 0xffc94a, transparent: true })); room.add(d); return { d, o }; });
    this.cabin = { scene, cam, room, clickables, dots, look: new T.Vector3(1.2, 0.95, 0) };
    window.addEventListener('resize', () => { cam.aspect = this.host.clientWidth / this.host.clientHeight; cam.updateProjectionMatrix(); });
  },
  fade(onMid) {
    if (!this.fader) { this.fader = document.createElement('div'); this.fader.style.cssText = 'position:absolute;inset:0;background:#000;opacity:0;transition:opacity .6s;pointer-events:none;z-index:4'; this.layer.appendChild(this.fader); }
    this.fader.style.opacity = 1; setTimeout(() => { onMid(); setTimeout(() => { this.fader.style.opacity = 0; }, 120); }, 650);
  },
  enterCabin() {
    const T = window.THREE; if (!this.cabin) this.buildCabin(T);
    this.fade(() => { this.cabin.cam.aspect = this.host.clientWidth / this.host.clientHeight; this.cabin.cam.updateProjectionMatrix(); this.seen('cabine'); this.setState({ phase: 'cabine', panel: null }); this.say(PR_CABIN_RADIO.enter); });
  },
  leaveCabin() { this.fade(() => { this.setState({ phase: 'nuit', panel: null }); this.say("Belle nuit. Tu peux redescendre quand tu veux, ou refaire la traversée."); }); },
  cabinPick(cx, cy) {
    const T = window.THREE, C = this.cabin, r0 = this.renderer.domElement.getBoundingClientRect(); const rc = new T.Raycaster();
    rc.setFromCamera(new T.Vector2(((cx - r0.left) / r0.width) * 2 - 1, -((cy - r0.top) / r0.height) * 2 + 1), C.cam);
    const h = rc.intersectObjects(C.clickables, true); if (!h.length) return null; let o = h[0].object; while (o && !o.userData.k) o = o.parent; return o ? o.userData.k : null;
  },
  cabinClick(cx, cy) { const k = this.cabinPick(cx, cy); if (!k) return; this.seen(k); this.setState({ panel: k }); this.say(PR_CABIN_RADIO[k], 'LOUIS-MARIE · CABINE'); },
  cabinStep(T, t, dt) {
    const C = this.cabin; if (!C) return;
    C.room.rotation.x = 0.025 * Math.sin(t * 0.7); C.room.rotation.z = 0.012 * Math.sin(t * 0.5);
    const mx = this.mouse ? (this.mouse.x / innerWidth - 0.5) : 0, my = this.mouse ? (this.mouse.y / innerHeight - 0.5) : 0;
    C.cam.position.set(-1.75, 1.42, 0.05); const look = C.look.clone(); look.z += mx * 2.2; look.y -= my * 1.0; C.cam.lookAt(look);
    this.cabinLight.intensity = 2.1 + 0.15 * Math.sin(t * 9) * Math.sin(t * 2.3);
    this.vhfLed.visible = Math.sin(t * 4) > 0;
    C.dots.forEach(({ d, o }, i) => { const p = new T.Vector3(); o.getWorldPosition(p); C.room.worldToLocal(p); d.position.set(p.x, p.y + 0.3 + 0.03 * Math.sin(t * 3 + i), p.z); d.material.opacity = 0.6 + 0.4 * Math.sin(t * 3 + i); });
    if (this.mouse && (this.cabHov = (this.cabHov || 0) + 1) % 5 === 0) {
      const k = this.cabinPick(this.mouse.x, this.mouse.y), r0 = this.renderer.domElement.getBoundingClientRect(); this.renderer.domElement.style.cursor = k ? 'pointer' : 'default';
      const names = { apropos: 'La photo · à propos', recap: 'Le livre de bord · récap', contact: 'La VHF · me contacter' };
      if (k) { this.tip.innerHTML = '<b>' + (k === 'contact' ? '✆' : k === 'recap' ? '✎' : '◎') + '</b>' + names[k]; this.tip.style.display = 'block'; this.tip.style.left = (this.mouse.x - r0.left) + 'px'; this.tip.style.top = (this.mouse.y - r0.top - 14) + 'px'; } else this.tip.style.display = 'none';
    }
  }
});
