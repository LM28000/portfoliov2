/* L'escale d'Insula : l'immeuble du quai, son panneau « À vendre » et le studio témoin du 1er étage (assets/studio.glb).
   Comme dans la cabine, pas de fiche : on clique un objet, la caméra s'en approche, on lit ce qui est écrit dessus.
   Un seul écran, l'ordinateur : la démo tourne au repos, « Essayer Insula » ouvre la vraie app.
   Repères : Blender (x, y, z) → three (x, z, -y). Les points du studio sont donnés dans le repère de l'immeuble (3d/scripts/immeuble.py) :
   x le long de la façade, y vers l'intérieur (façade en y = 0), z depuis le sol du quai. */
const PR_BLD = { x: -38.333, y: -24.333, z: 1.45, rot: -0.7854, elba: [-55.48, -37.59] };
const PR_STU_L = { FLOOR: 3.0, CEIL: 5.7, TABLE: 3.77, RX0: -4.15, RX1: 0.85, RY0: 0.35, RY1: 4.0, BAY_A: -1.75, BAY_B: 2.4, TX: -1.75, TY: 1.2 };
const PR_STU_NAMES = { ordi: "L'ordinateur · la démo, puis l'app", annonces: 'Les annonces imprimées', carnet: 'Le carnet des amis', frigo: 'La fiche sur le frigo', cles: 'Les clés · repartir' };
const PR_STU_ICON = { ordi: '▶', annonces: '▤', carnet: '✎', frigo: '◧', cles: '⚷' };
const PR_STU_RADIO = {
  porte: "Entre, c'est ouvert. On monte au premier.",
  enter: "Fais comme chez toi. Tout ce qui est sur la table, c'est le projet : l'ordinateur, les annonces, le carnet. Et sur le frigo, le bien qu'on a préféré.",
  ordi: "Voilà l'app pour de vrai, sur l'écran : clique, fais défiler, change de ville. Rien ne casse. Recule quand tu veux.",
  annonces: "Les annonces qu'on a imprimées, avec nos notes. Insula les relève chaque soir dans les vingt-deux villes, et chiffre chacune.",
  carnet: "Le carnet du groupe : nos critères, les biens qu'on suit, et l'avis de chacun. Dans l'app, c'est l'espace « Nos biens ».",
  frigo: "La fiche du studio qu'on a préféré : le prix, le loyer, le rendement, et ce qu'il faut vérifier avant de visiter.",
  cles: "Voilà pour Insula. Prends les clés : Elba t'attend en bas, et la Carte vivante est la prochaine île.",
  app: "Alors, convaincu ? L'ordinateur reste allumé si tu veux y retourner.",
  sortie: "On redescend au quai."
};
const PR_STU_TEXT = {
  ordi: "L'ordinateur montre la démo d'Insula. En s'approchant, la vraie app s'affiche sur l'écran et se manipule directement. Bouton : ouvrir l'app dans un onglet.",
  annonces: "Trois annonces imprimées à Saint-Nazaire : 18 m², 62 000 €, 9,4 % par an sur 15 ans (annoté « celui-là ! ») ; 16 m², 55 000 €, 8,3 % (« à visiter ») ; 20 m², 64 000 €, 8 % (« bof »).",
  carnet: "Le carnet des amis. Notre projet : un studio ou un T2 meublé, près d'une fac ou d'une gare, moins de 80 000 € tout compris, rendement au-dessus de 5 %. Les biens qu'on suit : Saint-Nazaire Gavy Océanis, visité ; Saint-Nazaire Trébale, à voir ; Brest Menez Paul. On vote : Gavy Océanis.",
  frigo: "La fiche du studio de Saint-Nazaire, quartier Gavy Océanis : 62 000 €, 18 m², rendement 9,4 % par an sur 15 ans en scénario central, cash-flow de +5 € par mois, mensualité de 327 €.",
  cles: "Les clés, avec le porte-clés Insula. La baie donne sur le quai, où Elba attend."
};
// points de vue, repère de l'immeuble : [caméra, cible, haut (facultatif)]
const PR_STU_VIEWS = (() => { const L = PR_STU_L, T = L.TABLE, fl = L.FLOOR + 0.02;
  return {
    idle: [[-0.3, 3.55, L.FLOOR + 1.62], [-1.55, 0.6, L.FLOOR + 1.0]],
    ordi: [[-2.05, 1.8, T + 0.42], [-2.05, 1.03, T + 0.12]],
    annonces: [[L.TX + 0.42, L.TY + 0.32, T + 0.6], [L.TX + 0.42, L.TY - 0.02, T], [0, -1, 0]],
    carnet: [[L.TX + 0.05, L.TY + 0.34, T + 0.5], [L.TX + 0.05, L.TY + 0.2, T], [0, -1, 0]],
    frigo: [[L.RX1 - 1.25, 3.52, fl + 1.25], [L.RX1 - 0.645, 3.52, fl + 1.24]],
    cles: [[L.TX - 0.55, L.TY + 0.62, T + 0.38], [L.TX - 0.55, L.TY + 0.26, T]],
    baie: [[L.BAY_A + 0.35, 2.9, L.FLOOR + 1.68], null]
  }; })();

Object.assign(Component.prototype, {
  // repère de l'immeuble → three
  stuW(lx, ly, lz) { const c = Math.cos(PR_BLD.rot), s = Math.sin(PR_BLD.rot); const bx = PR_BLD.x + lx * c - ly * s, by = PR_BLD.y + lx * s + ly * c; return new window.THREE.Vector3(bx, PR_BLD.z + lz, -by); },
  stuDir(lx, ly, lz) { const c = Math.cos(PR_BLD.rot), s = Math.sin(PR_BLD.rot); return new window.THREE.Vector3(lx * c - ly * s, lz, -(lx * s + ly * c)).normalize(); },
  // ---------- sur le quai : deux choses à faire, le panneau et la porte
  buildQuay(T) {
    const life = new T.Group(); this.life = life; this.planLife = new T.Group(); this.scene.add(life); this.focusPts = {};
    const L = PR_STU_L, out = this.stuDir(0, -1, 0), yawOut = Math.atan2(out.x, out.z);
    const sign = this.stuW(L.BAY_A, -1.0, L.FLOOR + 0.55), door = this.stuW(L.BAY_B, 0, 1.2);
    this.focusPts.panneau = { x: sign.x, y: sign.y - 0.4, z: sign.z, d: 9, pitch: 0.16, yaw: yawOut + 0.25 };
    this.focusPts.porte = { x: door.x, y: door.y, z: door.z, d: 8, pitch: 0.12, yaw: yawOut - 0.2 };
    this.pulses = []; [['panneau', this.stuW(L.BAY_A, -2.4, 0.03), 1.3], ['porte', this.stuW(L.BAY_B, -1.4, 0.03), 1.0]].forEach(([k, p, r]) => {
      const ring = new T.Mesh(new T.RingGeometry(r, r + 0.35, 48), new T.MeshBasicMaterial({ color: 0xffc94a, transparent: true, opacity: 0.85, side: T.DoubleSide, depthWrite: false }));
      ring.rotation.x = -Math.PI / 2; ring.position.copy(p); ring.userData.place = k; life.add(ring); this.pulses.push(ring); });
    this.poi = { panneau: { n: '▤', name: 'Le panneau · À vendre' }, porte: { n: '⌂', name: 'La porte · Studio témoin, 1er étage' } };
    // lumière chaude du studio (allumée seulement quand on y est)
    this.stuLamp = new T.PointLight(0xffd2a0, 0, 7, 2); this.stuLamp.position.copy(this.stuW(-1.6, 2.1, L.FLOOR + 2.2)); this.scene.add(this.stuLamp);
    // verres : translucides
    this.island.traverse((o) => { if (o.isMesh && o.material && /VerreClair/.test(o.material.name || '')) { o.material = new T.MeshStandardMaterial({ color: 0xdfe8ee, roughness: 0.05, transparent: true, opacity: 0.18, depthWrite: false }); o.userData.mat = o.material; o.renderOrder = 3; } });
    this.buildQuayLife(T);
  },
  quayPlace(name) {
    if (/^(PanneauAVendre|PanneauDos|Attache|BalconDalle|Barreau|MainCourante|RetourGC|RetourBarreau|Console|PFDormant|PFVerre)/.test(name)) return 'panneau';
    if (/^(Porte|Plaque|Imposte|Poignee|Applique)/.test(name)) return 'porte';
    return null;
  },
  // ---------- le studio (chargé à l'arrivée au quai)
  loadStudio(done) {
    if (this.stu) { if (done) done(); return; }
    if (this.stuLoading) { if (done) this.stuWait = (this.stuWait || []).concat(done); return; }
    this.stuLoading = true; if (done) this.stuWait = [done];
    const T = window.THREE;
    new T.GLTFLoader().load('assets/studio.glb', (g) => { this.buildStudio(T, g.scene); (this.stuWait || []).forEach((f) => f()); this.stuWait = []; },
      (ev) => { if (this.st().loading && ev.total) this.setState({ loadMsg: 'le studio : ' + Math.round(100 * ev.loaded / ev.total) + ' %' }); },
      (e) => { this.stuLoading = false; this.setState({ loading: false }); this.say("Impossible d'ouvrir le studio (" + e + ')'); });
  },
  buildStudio(T, root) {
    this.scene.add(root); root.updateMatrixWorld(true);
    const find = (re) => { let r = null; root.traverse((o) => { if (!r && re.test(o.name)) r = o; }); return r; };
    root.traverse((o) => { if (!o.isMesh || !o.material) return; const n = o.material.name || '';
      if (/glass/i.test(n)) { o.material = new T.MeshStandardMaterial({ color: 0xffffff, roughness: 0.05, transparent: true, opacity: 0.2, depthWrite: false }); o.renderOrder = 3; }
      if (o.material.map) o.material.map.anisotropy = 8;
      // le papier se lit tel quel, sans reflet ni surexposition
      if (/^(Fiche|Annonce|CarnetG|CarnetD|PorteClesTxt)/.test(o.name) && o.material.map) o.material = new T.MeshBasicMaterial({ map: o.material.map, color: 0xe6e2da }); });
    // écran : l'affiche de la démo, puis la vidéo quand on est dans le studio
    const scr = find(/^PC_ecran/); const tl = new T.TextureLoader(); const poster = tl.load('assets/demo-poster.jpg'); poster.encoding = T.sRGBEncoding; poster.flipY = false;
    let corners = null;
    if (scr) { scr.material = new T.MeshBasicMaterial({ map: poster, toneMapped: false });
      // coins de l'écran dans son repère, repérés par leurs UV (glTF : (0, 0) = en haut à gauche de l'image)
      const pa = scr.geometry.attributes.position, uv = scr.geometry.attributes.uv; corners = {};
      for (let i = 0; i < pa.count; i++) { const u = uv.getX(i) > 0.5 ? 'R' : 'L', w = uv.getY(i) > 0.5 ? 'B' : 'T'; corners[w + u] = new T.Vector3(pa.getX(i), pa.getY(i), pa.getZ(i)); } }
    const web = document.createElement('div'); web.className = 'stu-web'; const frame = document.createElement('iframe'); frame.title = 'Insula, la vraie app'; frame.setAttribute('allow', 'clipboard-write'); web.appendChild(frame); this.layer.insertBefore(web, this.layer.firstChild);
    const v = document.createElement('video'); v.preload = 'none'; v.muted = true; v.loop = true; v.playsInline = true;
    v.addEventListener('playing', () => { if (!scr) return; const vt = new T.VideoTexture(v); vt.encoding = T.sRGBEncoding; vt.flipY = false; scr.material.map = vt; scr.material.needsUpdate = true; }, { once: true });
    const sheets = [0, 1, 2].map((i) => find(new RegExp('^Annonce' + i))).filter(Boolean).map((o) => ({ o, home: o.position.clone(), homeQ: o.quaternion.clone() }));
    // repères dorés au-dessus de chaque objet
    const L = PR_STU_L, spots = { ordi: [-2.05, 1.05, L.TABLE + 0.34], annonces: [L.TX + 0.4, L.TY, L.TABLE + 0.08], carnet: [L.TX + 0.05, L.TY + 0.22, L.TABLE + 0.08], frigo: [L.RX1 - 0.68, 3.52, L.FLOOR + 1.62], cles: [L.TX - 0.55, L.TY + 0.26, L.TABLE + 0.08] };
    const dots = Object.entries(spots).map(([k, p]) => { const d = new T.Mesh(new T.SphereGeometry(0.018, 14, 10), new T.MeshBasicMaterial({ color: 0xffc94a, transparent: true, depthTest: false })); d.position.copy(this.stuW(...p)); d.renderOrder = 10; d.userData.k = k; d.visible = false; this.scene.add(d); return d; });
    this.stu = { root, scr, corners, web, frame, video: v, sheets, sel: -1, dots, focus: null, look: new T.Vector3(), up: new T.Vector3(0, 1, 0), path: null, move: null, lift: 0 };
  },
  stuKind(o) {
    for (let x = o; x; x = x.parent) { const n = x.name || '';
      if (/^PC_/.test(n)) return 'ordi'; if (/^(Annonce|Surligneur)/.test(n)) return 'annonces'; if (/^Carnet/.test(n)) return 'carnet';
      if (/^(Frigo|Fiche|Aimant)/.test(n)) return 'frigo'; if (/^(Cle|PorteCles|Torus)/.test(n)) return 'cles'; if (x === this.stu.root) break; }
    return null;
  },
  stuPick(cx, cy) { const T = window.THREE, r = this.renderer.domElement.getBoundingClientRect(); const rc = new T.Raycaster(); rc.setFromCamera(new T.Vector2(((cx - r.left) / r.width) * 2 - 1, -((cy - r.top) / r.height) * 2 + 1), this.cam);
    const h = rc.intersectObject(this.stu.root, true); for (const x of h) { const k = this.stuKind(x.object); if (k) return k; if (x.distance < 3) return null; } return null; },
  // vue → { p, l, u } en coordonnées three
  stuView(k) { const T = window.THREE, v = PR_STU_VIEWS[k]; const p = this.stuW(...v[0]);
    const l = v[1] ? this.stuW(...v[1]) : new T.Vector3(PR_BLD.elba[0], 1.0, -PR_BLD.elba[1]);
    const u = v[2] ? this.stuDir(...v[2]) : new T.Vector3(0, 1, 0); return { p, l, u }; },
  // ---------- entrer : de la porte au balcon, puis par la porte-fenêtre jusque dans la pièce (sans fondu)
  enterStudio(instant) {
    const go = () => {
      const T = window.THREE, L = PR_STU_L, S = this.stu; this.focused = null; clearTimeout(this.appT);
      if ((this.night || 0) > 0.01 || this.nightTarget) this.setNightNow(0); // le studio se visite de jour
      this.cam.near = 0.03; this.cam.fov = 62; this.cam.updateProjectionMatrix(); this.seen('studio');
      const idle = this.stuView('idle');
      if (instant || this.reduced) { this.cam.position.copy(idle.p); S.look.copy(idle.l); S.up.set(0, 1, 0); S.path = null; S.move = null; }
      else { const kf = [{ p: this.cam.position.clone(), l: new T.Vector3(this.orb.tx, this.orb.ty == null ? 4 : this.orb.ty, this.orb.tz) },
        { p: this.stuW(L.BAY_B, -4.6, 1.8), l: this.stuW(L.BAY_B, 0, 1.3) },
        { p: this.stuW(L.BAY_A, -3.4, L.FLOOR + 1.8), l: this.stuW(L.BAY_A, 0, L.FLOOR + 1.3) },
        { p: this.stuW(L.BAY_A, L.RY0 + 0.3, L.FLOOR + 1.65), l: this.stuW(-1.2, 3.9, L.FLOOR + 1.3) },
        { p: this.stuW(-0.7, 2.3, L.FLOOR + 1.63), l: this.stuW(0.85, 3.3, L.FLOOR + 1.2) },
        { p: idle.p, l: idle.l }];
        S.path = { kf, curve: new T.CatmullRomCurve3(kf.map((k) => k.p), false, 'centripetal', 0.5), t: 0, dur: 5.2 }; S.move = null; }
      if (S.video && !S.video.src) S.video.src = 'assets/demo-insula.webm'; if (S.video) S.video.play().catch(() => {});
      this.setState({ phase: 'studio', stuFocus: null, focus: null, showApp: false, objText: '', loading: false });
      this.say(instant ? PR_STU_RADIO.enter : PR_STU_RADIO.porte); if (!instant) { clearTimeout(this.stuT); this.stuT = setTimeout(() => { if (this.st().phase === 'studio' && !this.st().stuFocus) this.say(PR_STU_RADIO.enter); }, 4300); }
    };
    if (this.stu) go(); else { this.setState({ loading: true, loadMsg: 'le studio…' }); this.loadStudio(go); }
  },
  leaveStudio(then) {
    const S = this.stu; if (!S) return; const T = window.THREE, L = PR_STU_L; this.stuUnfocus(true); clearTimeout(this.stuT);
    if (S.video) S.video.pause();
    const end = () => { this.cam.near = 0.3; this.cam.fov = 50; this.cam.updateProjectionMatrix(); const c = this.cam.position, O = this.orb; const tgt = this.stuW(L.BAY_A, -2, 2);
      O.tx = tgt.x; O.tz = tgt.z; O.ty = tgt.y; O.dist = Math.max(8, c.distanceTo(tgt)); O.yaw = Math.atan2(c.x - tgt.x, c.z - tgt.z); O.pitch = Math.max(0.12, Math.asin(Math.min(1, (c.y - tgt.y) / O.dist)));
      this.overview(); this.setState({ phase: 'accoste', stuFocus: null }); if (then) then(); else this.say(PR_STU_RADIO.sortie); };
    if (this.reduced) { end(); return; }
    const kf = [{ p: this.cam.position.clone(), l: S.look.clone() }, { p: this.stuW(L.BAY_A, L.RY0 + 0.4, L.FLOOR + 1.65), l: this.stuW(L.BAY_A, -3, L.FLOOR + 1.2) },
      { p: this.stuW(L.BAY_A, -3.6, L.FLOOR + 2.4), l: this.stuW(L.BAY_A, -8, 1.5) }, { p: this.stuW(L.BAY_A + 2, -16, 9), l: this.stuW(L.BAY_A, -2, 2) }];
    S.path = { kf, curve: new T.CatmullRomCurve3(kf.map((k) => k.p), false, 'centripetal', 0.5), t: 0, dur: 2.6, done: end }; S.up.set(0, 1, 0);
  },
  // ---------- s'approcher d'un objet
  stuFocus(k) {
    const S = this.stu; if (!S) return;
    if (k === 'annonces') { S.sel = (S.sel + 1) % S.sheets.length; S.lift = 0; } else S.sel = -1;
    S.focus = k; const v = k === 'ordi' && S.corners ? this.stuPcView() : this.stuView(k); S.webW = 0; S.move = { from: { p: this.cam.position.clone(), l: S.look.clone(), u: S.up.clone() }, to: v, t: this.reduced ? 1 : 0, dur: 1.1 };
    this.seen(k === 'ordi' ? 'ordi' : k); this.setState({ stuFocus: k, objText: PR_STU_TEXT[k] || '' }); this.say(PR_STU_RADIO[k], 'LOUIS-MARIE · LE STUDIO');
    if (k === 'cles') { S.move.done = () => { if (this.stu.focus !== 'cles') return; this.stu.move = { from: { p: this.cam.position.clone(), l: this.stu.look.clone(), u: this.stu.up.clone() }, to: this.stuView('baie'), t: 0, dur: 1.6 }; }; }
  },
  stuUnfocus(instant) { const S = this.stu; if (!S) return; S.focus = null; S.sel = -1; const v = this.stuView('idle');
    if (instant || this.reduced) { this.cam.position.copy(v.p); S.look.copy(v.l); S.up.set(0, 1, 0); S.move = null; } else S.move = { from: { p: this.cam.position.clone(), l: S.look.clone(), u: S.up.clone() }, to: v, t: 0, dur: 1.0 };
    this.setState({ stuFocus: null, objText: '' }); },
  // l'écran du portable : coins en coordonnées monde
  stuPc() { const S = this.stu, M = S.scr.matrixWorld, C = S.corners; S.scr.updateMatrixWorld(true); return ['TL', 'TR', 'BR', 'BL'].map((k) => C[k].clone().applyMatrix4(M)); },
  // se placer face à l'écran, assez près pour qu'il remplisse ~80 % de la vue
  stuPcView() { const T = window.THREE, [tl, tr, br, bl] = this.stuPc(), c = tl.clone().add(tr).add(br).add(bl).multiplyScalar(0.25);
    const w = tl.distanceTo(tr), h = tl.distanceTo(bl), ex = tr.clone().sub(tl).normalize(), ey = tl.clone().sub(bl).normalize(); const n = ex.clone().cross(ey).normalize();
    const vf = 50 * Math.PI / 180, asp = this.host.clientWidth / this.host.clientHeight, hf = 2 * Math.atan(Math.tan(vf / 2) * asp);
    const d = Math.max(w / (2 * 0.74 * Math.tan(hf / 2)), h / (2 * 0.74 * Math.tan(vf / 2)));
    return { p: c.clone().addScaledVector(n, d), l: c, u: ey }; },
  // la vraie app, posée en perspective sur l'écran (transformation projective CSS)
  stuScreen() {
    const S = this.stu; const on = S.focus === 'ordi' && !S.move && !S.path && this.st().phase === 'studio';
    if (!on) { if (S.web.style.display !== 'none') S.web.style.display = 'none'; return; }
    const W = this.host.clientWidth, H = this.host.clientHeight, pts = [];
    for (const p of this.stuPc()) { const v = p.clone().project(this.cam); if (v.z > 1 || v.z < -1) { S.web.style.display = 'none'; return; } pts.push([(v.x + 1) / 2 * W, (1 - v.y) / 2 * H]); }
    if (!S.webW) { const pw = Math.hypot(pts[1][0] - pts[0][0], pts[1][1] - pts[0][1]); S.webW = Math.round(Math.max(380, Math.min(1280, pw / 0.85))); S.webH = Math.round(S.webW / 1.6); S.web.style.width = S.webW + 'px'; S.web.style.height = S.webH + 'px'; }
    if (!S.frame.src) { S.frame.onload = () => { S.frameOk = true; }; S.frame.src = 'https://insula.du-cray.eu/'; clearTimeout(this.frameT);
      this.frameT = setTimeout(() => { if (!S.frameOk && this.st().stuFocus === 'ordi') this.say("L'app tarde à s'afficher ? Ouvre-la dans un onglet, avec le bouton en bas à droite."); }, 9000); }
    this.seen('app');
    const m = this.homography([[0, 0], [S.webW, 0], [S.webW, S.webH], [0, S.webH]], pts);
    S.web.style.transform = 'matrix3d(' + m.join(',') + ')'; S.web.style.display = 'block';
  },
  homography(src, dst) {
    const adj = (m) => [m[4] * m[8] - m[5] * m[7], m[2] * m[7] - m[1] * m[8], m[1] * m[5] - m[2] * m[4], m[5] * m[6] - m[3] * m[8], m[0] * m[8] - m[2] * m[6], m[2] * m[3] - m[0] * m[5], m[3] * m[7] - m[4] * m[6], m[1] * m[6] - m[0] * m[7], m[0] * m[4] - m[1] * m[3]];
    const mul = (a, b) => { const c = []; for (let i = 0; i < 3; i++) for (let j = 0; j < 3; j++) { let s = 0; for (let k = 0; k < 3; k++) s += a[3 * i + k] * b[3 * k + j]; c[3 * i + j] = s; } return c; };
    const mv = (m, v) => [m[0] * v[0] + m[1] * v[1] + m[2] * v[2], m[3] * v[0] + m[4] * v[1] + m[5] * v[2], m[6] * v[0] + m[7] * v[1] + m[8] * v[2]];
    const basis = (p) => { const m = [p[0][0], p[1][0], p[2][0], p[0][1], p[1][1], p[2][1], 1, 1, 1]; const v = mv(adj(m), [p[3][0], p[3][1], 1]); return mul(m, [v[0], 0, 0, 0, v[1], 0, 0, 0, v[2]]); };
    const t = mul(basis(dst), adj(basis(src))); for (let i = 0; i < 9; i++) t[i] /= t[8];
    return [t[0], t[3], 0, t[6], t[1], t[4], 0, t[7], 0, 0, 1, 0, t[2], t[5], 0, t[8]];
  },
  // une fois un objet choisi : on tourne autour, on s'approche ou on recule (sans sortir de la pièce)
  stuCanOrbit() { const S = this.stu; return S && S.focus && !S.path && !S.move; },
  stuInside(p) { const T = window.THREE, L = PR_STU_L, c = Math.cos(PR_BLD.rot), s = Math.sin(PR_BLD.rot); const dx = p.x - PR_BLD.x, dy = -p.z - PR_BLD.y;
    let lx = dx * c + dy * s, ly = -dx * s + dy * c, lz = p.y - PR_BLD.z; const cl = (v, a, b) => Math.max(a, Math.min(b, v));
    lx = cl(lx, L.RX0 + 0.12, L.RX1 - 0.12); ly = cl(ly, L.RY0 + 0.1, L.RY1 - 0.12); lz = cl(lz, L.FLOOR + 0.2, L.CEIL - 0.12); return this.stuW(lx, ly, lz); },
  stuOrbit(p0, dyaw, dpitch) { const S = this.stu, T = window.THREE, v = p0.clone().sub(S.look), L = v.length() || 0.5;
    const yaw = Math.atan2(v.x, v.z) - dyaw, pitch = Math.max(-0.5, Math.min(1.35, Math.asin(Math.max(-1, Math.min(1, v.y / L))) + dpitch));
    const p = S.look.clone().add(new T.Vector3(Math.sin(yaw) * Math.cos(pitch) * L, Math.sin(pitch) * L, Math.cos(yaw) * Math.cos(pitch) * L));
    this.cam.position.copy(this.stuInside(p)); S.up.set(0, 1, 0); },
  stuDolly(f) { const S = this.stu, v = this.cam.position.clone().sub(S.look), L = Math.max(0.12, Math.min(2.6, v.length() * f)); this.cam.position.copy(this.stuInside(S.look.clone().addScaledVector(v.normalize(), L))); },
  openApp() { this.seen('app'); this.setState({ showApp: true }); },
  studioClick(x, y) {
    const S = this.stu; if (!S || S.path) return; const k = this.stuPick(x, y);
    if (S.focus === 'ordi' && k === 'ordi') return;
    if (S.focus === 'annonces' && k === 'annonces') { this.stuFocus('annonces'); return; }
    if (!k) { if (S.focus) this.stuUnfocus(); return; }
    if (S.focus === k) return; this.stuFocus(k);
  },
  stuCanLook() { const S = this.stu; return S && !S.focus && !S.path && !S.move; },
  stuTurn(base, dyaw, dpitch) { const S = this.stu, T = window.THREE, d = base.clone().sub(this.cam.position), L = d.length() || 1;
    const yaw = Math.atan2(d.x, d.z) + dyaw, pitch = Math.max(-1.1, Math.min(1.1, Math.asin(Math.max(-1, Math.min(1, d.y / L))) + dpitch));
    S.look.copy(this.cam.position).add(new T.Vector3(Math.sin(yaw) * Math.cos(pitch) * L, Math.sin(pitch) * L, Math.cos(yaw) * Math.cos(pitch) * L)); },
  stuZoom(f) { this.cam.fov = Math.max(30, Math.min(70, this.cam.fov * f)); this.cam.updateProjectionMatrix(); },
  // ---------- à chaque image
  studioStep(T, t, dt) {
    const S = this.stu, cam = this.cam, ease = (x) => x < 0.5 ? 2 * x * x : 1 - Math.pow(-2 * x + 2, 2) / 2;
    if (!S) return;
    if (S.path) { const P = S.path; P.t = Math.min(1, P.t + dt / P.dur); const e = ease(P.t); cam.position.copy(P.curve.getPointAt(e));
      const n = P.kf.length - 1, f = e * n, i = Math.min(n - 1, Math.floor(f)), a = ease(f - i); S.look.copy(P.kf[i].l).lerp(P.kf[i + 1].l, a);
      cam.up.set(0, 1, 0); cam.lookAt(S.look); if (P.t >= 1) { S.path = null; if (P.done) P.done(); } }
    else if (S.move) { const M = S.move; M.t = Math.min(1, M.t + dt / M.dur); const e = ease(M.t);
      cam.position.lerpVectors(M.from.p, M.to.p, e); S.look.lerpVectors(M.from.l, M.to.l, e); S.up.lerpVectors(M.from.u, M.to.u, e).normalize(); cam.up.copy(S.up); cam.lookAt(S.look);
      if (M.t >= 1) { S.move = null; if (M.done) M.done(); } }
    else { cam.up.copy(S.up); cam.lookAt(S.look); }
    this.stuScreen();
    const fovT = S.focus ? 50 : 62; if (Math.abs(cam.fov - fovT) > 0.05 && (S.focus || S.path || S.move)) { cam.fov += (fovT - cam.fov) * Math.min(1, dt * 4); cam.updateProjectionMatrix(); }
    // l'annonce choisie se soulève vers soi
    S.lift = Math.min(1, S.lift + dt / 0.6);
    S.sheets.forEach((sh, i) => { const on = S.focus === 'annonces' && i === S.sel, e = on ? ease(S.lift) : 0; sh.o.position.copy(sh.home); sh.o.position.y += 0.1 * e; sh.o.quaternion.copy(sh.homeQ); sh.o.scale.setScalar(1 + 0.25 * e); });
    S.dots.forEach((d, i) => { d.visible = !S.focus && !S.path && this.st().phase === 'studio'; d.material.opacity = 0.55 + 0.45 * Math.sin(t * 3 + i); d.scale.setScalar(1 + 0.25 * Math.sin(t * 3 + i)); });
    // survol
    if (this.mouse && !S.path && (this.stuHov = (this.stuHov || 0) + 1) % 5 === 0) {
      const k = S.move ? null : this.stuPick(this.mouse.x, this.mouse.y), r0 = this.renderer.domElement.getBoundingClientRect(); this.renderer.domElement.style.cursor = k ? 'pointer' : 'grab';
      let label = k ? PR_STU_NAMES[k] : null; if (k === 'ordi' && S.focus === 'ordi') label = null; if (k === 'annonces' && S.focus === 'annonces') label = 'Annonce suivante';
      if (label) { this.tip.innerHTML = '<b>' + PR_STU_ICON[k] + '</b>' + label; this.tip.style.display = 'block'; this.tip.style.left = (this.mouse.x - r0.left) + 'px'; this.tip.style.top = (this.mouse.y - r0.top - 14) + 'px'; } else this.tip.style.display = 'none';
    }
  },
  studioActs(acts) {
    const s = this.st(), f = s.stuFocus;
    if (f) acts.push({ label: '← Revenir', cls: 'pr-btn2', go: () => this.stuUnfocus() });
    if (f === 'ordi') acts.push({ label: 'Ouvrir l’app dans un onglet ↗', cls: 'pr-btn2', go: () => window.open('https://insula.du-cray.eu/', '_blank', 'noopener') });
    if (f === 'annonces') acts.push({ label: '→ Annonce suivante', cls: 'pr-btn2', go: () => this.stuFocus('annonces') });
    if (f === 'cles') acts.push({ label: '⛵ Larguer les amarres · Carte vivante', cls: 'pr-btn', go: () => this.leaveStudio(() => this.sailTo('cartevivante')) });
    if (!f) { acts.push({ label: '← Redescendre au quai', cls: 'pr-btn2', go: () => this.leaveStudio() }); acts.push({ label: '⛵ Île suivante : Carte vivante', cls: 'pr-btn', go: () => this.leaveStudio(() => this.sailTo('cartevivante')) }); }
  }
});
