/* La cabine d'Elba (modèle Blender, assets/cabine.glb) et ses objets, sans fiche : on clique, la caméra s'approche,
   l'objet s'anime, et on lit ce qui est écrit dessus. Repère : Blender (x avant, y bâbord, z haut) → three (x, z, -y). */
const PR_BOTTLES = [
  ['Premier prix', "À l'Académie musicale de Liesse, j'ai remporté le premier prix du concours national des très jeunes altistes. Le travail qui va avec : reprendre le même passage, encore et encore, jusqu'à ce qu'il sonne juste."],
  ['Le quatuor', "J'ai été responsable du quatuor à cordes de l'Académie, et j'ai organisé des concerts et des spectacles. Mettre quatre musiciens d'accord, c'était déjà de la gestion de projet."],
  ['Dix jeunes', "J'ai encadré une équipe de dix jeunes, de 8 à 17 ans. Expliquer simplement et donner à chacun sa place : ça me sert tous les jours."],
  ['Six pattes', "À l'ESILV, j'ai conçu un robot hexapode, et construit la maquette d'un immeuble qui résiste aux séismes. Dans les deux cas, tout est une question d'équilibre."],
  ['Insula', "Insula est née d'une vraie question : acheter un appartement avec des amis. Mes meilleurs projets sont ceux dont j'ai besoin moi-même."]
];
const PR_PHOTO_BACK = ['Louis-Marie', '', "Élève-ingénieur à l'ESILV,", 'en alternance chez Devoteam', '(IA agentique & RSE).', '', 'Je construis les outils', 'qui me manquent.', '', 'Musicien (alto, violon),', 'et marin sur Elba.'];
const PR_CAB_NAMES = { carte: 'La carte · mon parcours', coffre: 'Le coffre · mon CV', livre: 'Le livre de bord · ta traversée', bouteilles: 'Les bouteilles · anecdotes', photo: 'La photo · à propos', vhf: 'La VHF · me contacter' };
const PR_CAB_ICON = { carte: '⌖', coffre: '▣', livre: '✎', bouteilles: '✉', photo: '◎', vhf: '✆' };
const PR_CAB_SEEN = { carte: 'carte', coffre: 'coffre', livre: 'recap', bouteilles: 'bouteilles', photo: 'apropos', vhf: 'contact' };
const PR_CAB_RADIO2 = {
  enter: "Bienvenue dans la cabine. Approche-toi de ce que tu veux : la carte de mon parcours, le coffre, le livre de bord, les bouteilles, la photo… et la VHF pour me laisser un message.",
  carte: "Mon parcours, de Précigné à Levallois, et le cap pour 2028.",
  coffre: "Dans le coffre, mon CV. Tu peux le télécharger.",
  livre: "Ton livre de bord : tout ce que tu as vu pendant la traversée.",
  bouteilles: "Une bouteille, un souvenir. Prends-en une autre si tu veux.",
  photo: "Retourne le cadre : quelques mots sur moi, au dos.",
  vhf: "Canal 16, je t'écoute : choisis un canal dans la radio, en bas à gauche."
};
const PR_CAB_VIEWS = { // [caméra, cible, haut]
  idle: [[-2.05, 1.42, 0.15], [1.4, 0.85, -0.15], [0, 1, 0]],
  carte: [[-1.86, 1.42, 0.715], [-1.85, 0.80, 0.716], [0, 0, -1]],
  coffre: [[1.55, 1.36, 0.36], [2.12, 0.62, 0.0], [0, 1, 0]],
  livre: [[0.16, 1.1, 0.0], [0.16, 0.76, 0.0], [-1, 0, 0]],
  bouteilles: [[-0.1, 1.45, 0.2], [-0.1, 1.3, 1.12], [0, 1, 0]],
  photo: [[0.72, 1.25, -0.6], [1.5, 1.245, -0.68], [0, 1, 0]],
  vhf: [[-1.25, 1.35, 0.42], [-2.18, 1.15, 0.72], [0, 1, 0]]
};
const PR_CV_URL = 'assets/cv-louis-marie-perret-du-cray.pdf';

Object.assign(Component.prototype, {
  cabKind(o) {
    for (let x = o; x; x = x.parent) {
      const n = x.name || ''; let m;
      if ((m = n.match(/^BouteilleGrp(\d)/))) return { k: 'bouteilles', i: +m[1] };
      if (/^(CarteParcours|PlateauCartes|TableCartes|Grp_compas|seadogs)/.test(n)) return { k: 'carte' };
      if (/^(Grp_coffre|treasure_chest|RouleauCV|Ruban)/.test(n)) return { k: 'coffre', roll: /^(RouleauCV|Ruban)/.test(n) };
      if (/^(PagesLivre|Couverture|TranchePages)/.test(n)) return { k: 'livre' };
      if (/^(Grp_cadre|hanging_picture|PhotoElba|DosPhoto)/.test(n)) return { k: 'photo' };
      if (/^(VHF|EcranVHF|Combine|Bouton|Tableau|Interrupteur)/.test(n)) return { k: 'vhf' };
    }
    return null;
  },
  // texture « papier » écrite à la main (police Caveat)
  paperTex(w, h, draw) {
    const T = window.THREE, c = document.createElement('canvas'); c.width = w; c.height = h; const g = c.getContext('2d');
    const grd = g.createRadialGradient(w / 2, h / 2, Math.min(w, h) * 0.2, w / 2, h / 2, Math.max(w, h) * 0.75); grd.addColorStop(0, '#f1e6cc'); grd.addColorStop(1, '#cdb88f'); g.fillStyle = grd; g.fillRect(0, 0, w, h);
    draw(g, w, h); const t = new T.CanvasTexture(c); t.encoding = T.sRGBEncoding; t.anisotropy = 4; return t;
  },
  wrap(g, text, maxW) { const words = text.split(' '), lines = []; let cur = ''; words.forEach((w) => { const t = cur ? cur + ' ' + w : w; if (g.measureText(t).width > maxW && cur) { lines.push(cur); cur = w; } else cur = t; }); if (cur) lines.push(cur); return lines; },
  bookSpread(n) { const t = this.bookSpread0(n); t.flipY = false; return t; },
  bookSpread0(n) {
    const v = this.visitedSet || {}; const log = [['ponton', 'Appareillé du ponton.'], ['insula', 'Accosté à Insula.'], ['cinema', 'Vu la démo au cinéma.'], ['longuevue', "Essayé l'app à la longue-vue."], ['archi', 'Visité les coulisses.'], ['cartevivante', 'Survolé la Carte vivante.'], ['serveur', 'Visité la salle des machines.'], ['cabine', 'Descendu dans la cabine.'], ['carte', 'Lu la carte du parcours.'], ['coffre', 'Ouvert le coffre.'], ['bouteilles', 'Débouché une bouteille.'], ['apropos', 'Retourné la photo.'], ['contact', 'Allumé la VHF.']].filter(([k]) => v[k] || k === 'cabine');
    return this.paperTex(2048, 1400, (g, W, H) => {
      g.fillStyle = 'rgba(0,0,0,0.12)'; g.fillRect(W / 2 - 6, 0, 12, H);
      g.strokeStyle = 'rgba(90,120,160,0.35)'; g.lineWidth = 2; for (const x0 of [110, W / 2 + 90]) for (let k = 0; k < 17; k++) { g.beginPath(); g.moveTo(x0, 300 + k * 62); g.lineTo(x0 + W / 2 - 200, 300 + k * 62); g.stroke(); }
      g.fillStyle = '#5a1d12'; g.font = 'italic 700 70px Fraunces, Georgia, serif';
      if (n === 0) {
        g.fillText('Livre de bord — Elba', 120, 160); g.fillText('Prochaines escales', W / 2 + 100, 160);
        g.fillStyle = '#23345a'; g.font = '62px Caveat, cursive';
        log.slice(0, 15).forEach(([, t], i) => g.fillText('—  ' + t, 130, 290 + i * 62));
        ['Île n° 2 — bientôt', 'Île n° 3 — bientôt', 'et la suite…'].forEach((t, i) => g.fillText('—  ' + t, W / 2 + 110, 290 + i * 124));
      } else {
        g.fillText('Le mot du skipper', 120, 160); g.fillText('Équipage', W / 2 + 100, 160);
        g.fillStyle = '#23345a'; g.font = '64px Caveat, cursive';
        const txt = "Merci d'être monté à bord. Ce site grandira île après île : reviens voir ce qui a changé, et laisse-moi un mot à la VHF si l'envie t'en prend.";
        this.wrap(g, txt, W / 2 - 260).forEach((l, i) => g.fillText(l, 130, 300 + i * 70));
        g.fillText('— Louis-Marie', 520, 300 + 6 * 70);
        ['Skipper : Louis-Marie', 'Équipier : toi', 'Bateau : Elba, Flirt de 1977', 'Port : La Rochelle'].forEach((t, i) => g.fillText(t, W / 2 + 110, 300 + i * 90));
      }
    });
  },
  loadCabin(done) {
    if (this.cabin) { if (done) done(); return; }
    if (this.cabLoading) { if (done) this.cabWait = (this.cabWait || []).concat(done); return; }
    this.cabLoading = true; if (done) this.cabWait = [done];
    const T = window.THREE; document.fonts && document.fonts.load('60px Caveat');
    new T.GLTFLoader().load('assets/cabine.glb', (g) => { this.buildCabin3d(T, g.scene); (this.cabWait || []).forEach((f) => f()); this.cabWait = []; },
      (ev) => { if (this.st().loading && ev.total) this.setState({ loadMsg: 'la cabine : ' + Math.round(100 * ev.loaded / ev.total) + ' %' }); },
      (e) => { this.cabLoading = false; this.setState({ loading: false }); this.say("Impossible d'ouvrir la cabine (" + e + ')'); });
  },
  buildCabin3d(T, root) {
    const scene = new T.Scene(); scene.background = new T.Color(0x05070c); scene.add(root);
    const cam = new T.PerspectiveCamera(62, this.host.clientWidth / this.host.clientHeight, 0.03, 40);
    const lamp = (x, y, z, c, i, d) => { const l = new T.PointLight(c, i, d || 6, 2); l.position.set(x, y, z); scene.add(l); return l; };
    const L = { table: lamp(0.05, 1.38, 0, 0xff9a4a, 1.9, 4.5), cartes: lamp(-1.6, 1.15, 0.6, 0xff9a50, 0.9, 2.2), avant: lamp(2.3, 1.2, 0, 0xff9a50, 0.6, 3), fond: lamp(-1.8, 1.6, 0, 0xffb07a, 0.35, 3.5), coffre: lamp(2.1, 0.95, 0.1, 0xffc07a, 0, 1.6) };
    scene.add(new T.HemisphereLight(0x4a62a0, 0x2a180a, 0.28)); scene.add(new T.AmbientLight(0xffd8b0, 0.07));
    const find = (re) => { let r = null; root.traverse((o) => { if (!r && re.test(o.name)) r = o; }); return r; };
    const all = (re) => { const r = []; root.traverse((o) => { if (re.test(o.name)) r.push(o); }); return r; };
    // verre des bouteilles et des fenêtres : translucide (le verre de Blender ne passe pas tel quel)
    const glass = new T.MeshStandardMaterial({ color: 0xbfe0cc, roughness: 0.06, metalness: 0.1, transparent: true, opacity: 0.32, depthWrite: false });
    root.traverse((o) => { if (o.isMesh && o.material && /VerreBouteille/.test(o.material.name || '')) { o.material = glass; o.renderOrder = 2; } });
    root.updateMatrixWorld(true);
    const box = (o) => new T.Box3().setFromObject(o);
    // couvercle du coffre : pivot sur sa charnière (arête arrière, côté +x)
    const lid = find(/^treasure_chest_lid/); let lidPivot = null;
    if (lid) { const b = box(lid); lidPivot = new T.Object3D(); lidPivot.position.set(b.max.x - 0.01, b.min.y + 0.01, (b.min.z + b.max.z) / 2); scene.add(lidPivot); lidPivot.attach(lid); }
    // cadre : pivot au centre, dos écrit à la main
    const cadre = find(/^Grp_cadre/); let framePivot = null;
    if (cadre) { const b = box(cadre); const c = b.getCenter(new T.Vector3()); framePivot = new T.Object3D(); framePivot.position.copy(c); scene.add(framePivot); framePivot.attach(cadre);
      const dims = b.getSize(new T.Vector3());
      const back = new T.Mesh(new T.PlaneGeometry(dims.z * 0.92, dims.y * 0.92), new T.MeshStandardMaterial({ roughness: 0.9, map: this.paperTex(700, 900, (g, w, h) => { g.fillStyle = '#1e2c58'; g.font = '700 64px Caveat, cursive'; g.fillText(PR_PHOTO_BACK[0], 60, 110); g.font = '50px Caveat, cursive'; PR_PHOTO_BACK.slice(1).forEach((l, i) => g.fillText(l, 60, 180 + i * 62)); }) }));
      back.name = 'DosPhoto'; back.rotation.y = Math.PI / 2; back.position.set(dims.x / 2 + 0.004, 0, 0); framePivot.add(back); this.photoBack = back; }
    // livre : pages écrites à la volée
    const pages = find(/^PagesLivre/); if (pages) { pages.material = pages.material.clone(); this.bookPage = 0; pages.material.map = this.bookSpread(0); pages.material.needsUpdate = true; }
    // bouteilles : groupes, bouchons, messages
    const bottles = []; for (let i = 0; i < 5; i++) { const g = find(new RegExp('^BouteilleGrp' + i + '$')) || find(new RegExp('^BouteilleGrp' + i)); if (g) bottles.push({ g, home: g.position.clone(), homeQ: g.quaternion.clone(), cork: g.children.find((c) => /^Bouchon/.test(c.name)) }); }
    bottles.forEach((b) => { if (b.cork) b.corkHome = b.cork.position.clone(); });
    const scrollMat = new T.MeshStandardMaterial({ roughness: 0.9, side: T.DoubleSide, transparent: true });
    const scroll = new T.Mesh(new T.PlaneGeometry(0.42, 0.56), scrollMat); scroll.visible = false; scene.add(scroll);
    // VHF : combiné et écran
    const hand = find(/^Combine/); const handHome = hand ? hand.position.clone() : null; const screen = find(/^EcranVHF/);
    const needle = find(/^seadogs_compass_needle/);
    // repères dorés au-dessus de chaque objet
    const spots = { carte: [-1.85, 0.95, 0.715], coffre: [2.1, 1.05, 0], livre: [0.16, 0.9, -0.15], bouteilles: [-0.1, 1.52, 1.12], photo: [1.5, 1.55, -0.68], vhf: [-2.2, 1.35, 0.72] };
    const dots = Object.entries(spots).map(([k, p]) => { const d = new T.Mesh(new T.SphereGeometry(0.022, 14, 10), new T.MeshBasicMaterial({ color: 0xffc94a, transparent: true })); d.position.set(...p); d.userData.k = k; scene.add(d); return d; });
    this.cabin = { scene, cam, root, L, lidPivot, framePivot, framePos: framePivot ? framePivot.position.clone() : null, pages, bottles, scroll, hand, handHome, screen, needle, dots, focus: null, sel: -1, prog: {}, camFrom: null, camT: 1 };
    const v = PR_CAB_VIEWS.idle; cam.position.set(...v[0]); cam.up.set(...v[2]); cam.lookAt(...v[1]); this.cabin.look = new T.Vector3(...v[1]);
    window.addEventListener('resize', () => { cam.aspect = this.host.clientWidth / this.host.clientHeight; cam.updateProjectionMatrix(); });
  },
  // ---------- navigation dans la cabine
  enterCabin() {
    const go = () => this.fade(() => { const C = this.cabin; C.cam.aspect = this.host.clientWidth / this.host.clientHeight; C.cam.updateProjectionMatrix(); this.cabUnfocus(true); this.seen('cabine'); this.setState({ phase: 'cabine', panel: null, loading: false }); this.say(PR_CAB_RADIO2.enter); });
    if (this.cabin) go(); else { this.setState({ loading: true, loadMsg: 'la cabine…' }); this.loadCabin(go); }
  },
  leaveCabin() { this.fade(() => { this.cabUnfocus(true); this.orbitBoat(); Object.assign(this.orb, this.orbW); this.setState({ phase: 'nuit', panel: null }); this.say("Belle nuit. Tu peux redescendre quand tu veux, ou refaire la traversée."); }); },
  cabSetView(name, instant) {
    const C = this.cabin, T = window.THREE, v = PR_CAB_VIEWS[name] || PR_CAB_VIEWS.idle;
    C.camFrom = { p: C.cam.position.clone(), l: C.look.clone(), u: C.cam.up.clone() }; C.camTo = { p: new T.Vector3(...v[0]), l: new T.Vector3(...v[1]), u: new T.Vector3(...v[2]) }; C.camT = instant ? 1 : 0;
    if (instant) { C.cam.position.copy(C.camTo.p); C.look.copy(C.camTo.l); C.cam.up.copy(C.camTo.u); }
  },
  cabFocus(k, i) {
    const C = this.cabin; if (!C) return;
    if (k === 'bouteilles') { C.sel = i == null ? (C.sel >= 0 ? (C.sel + 1) % C.bottles.length : 0) : i; C.prog.bouteilles = 0; this.cabScroll(); }
    C.focus = k; this.cabSetView(k, this.reduced); this.setState({ objText: this.cabText(k) }); this.seen(PR_CAB_SEEN[k]); this.setState({ cabFocus: k, v: Date.now() });
    if (k === 'livre' && C.pages) { C.pages.material.map = this.bookSpread(this.bookPage || 0); C.pages.material.needsUpdate = true; }
    this.say(PR_CAB_RADIO2[k], 'LOUIS-MARIE · CABINE');
  },
  cabText(k) {
    if (k === 'carte') return "Carte du parcours. 1 : 2020 à 2023, Précigné, Académie musicale de Liesse, bac mention Bien, 1er prix national des très jeunes altistes. 2 : depuis 2023, Nantes, prépa Clemenceau puis ESILV, et DeVinci Junior. 3 : depuis septembre 2025, Levallois, Devoteam Group IT, alternance en IA agentique et RSE. 4 : 2026, Insula. 5 : 2028, le diplôme d'ingénieur.";
    if (k === 'coffre') return 'Le coffre contient mon CV. Bouton : Télécharger mon CV.';
    if (k === 'livre') return 'Livre de bord : les escales de ta traversée, et le mot du skipper en tournant la page.';
    if (k === 'bouteilles') { const b = PR_BOTTLES[this.cabin.sel]; return b ? 'Message en bouteille, ' + b[0] + ' : ' + b[1] : ''; }
    if (k === 'photo') return 'Au dos de la photo : ' + PR_PHOTO_BACK.filter(Boolean).join(' ');
    if (k === 'vhf') return 'VHF, canal 16. Canaux : e-mail louis-marie@du-cray.com, LinkedIn, GitHub, dans la radio en bas à gauche.';
    return '';
  },
  cabUnfocus(instant) { const C = this.cabin; if (!C) return; C.focus = null; this.cabSetView('idle', instant || this.reduced); this.setState({ objText: '' }); this.setState({ cabFocus: null }); if (instant) { C.prog = {}; C.sel = -1; } },
  cabScroll() {
    const C = this.cabin, b = PR_BOTTLES[C.sel]; if (!b) return;
    C.scroll.material.map = this.paperTex(840, 1120, (g, w, h) => { g.fillStyle = '#4a2a16'; g.font = '700 72px Caveat, cursive'; g.fillText(b[0], 70, 130); g.font = '54px Caveat, cursive'; this.wrap(g, b[1], w - 140).forEach((l, i) => g.fillText(l, 70, 230 + i * 66)); g.font = '46px Caveat, cursive'; g.fillText('— L.-M.', w - 260, h - 90); });
    C.scroll.material.needsUpdate = true;
  },
  turnPage() { const C = this.cabin; this.bookPage = 1 - (this.bookPage || 0); if (C.pages) { C.pages.material.map = this.bookSpread(this.bookPage); C.pages.material.needsUpdate = true; } },
  cabinPick(cx, cy) {
    const T = window.THREE, C = this.cabin; if (!C) return null; const r0 = this.renderer.domElement.getBoundingClientRect(); const rc = new T.Raycaster();
    rc.setFromCamera(new T.Vector2(((cx - r0.left) / r0.width) * 2 - 1, -((cy - r0.top) / r0.height) * 2 + 1), C.cam);
    const h = rc.intersectObjects([C.root, C.lidPivot, C.framePivot, ...C.dots].filter(Boolean), true);
    for (const x of h) { if (x.object.userData.k) return { k: x.object.userData.k }; const k = this.cabKind(x.object); if (k) return k; if (!/^(Grp_|$)/.test(x.object.name)) return null; } return null;
  },
  cabinClick(cx, cy) {
    const C = this.cabin; const k = this.cabinPick(cx, cy);
    if (C && C.focus === 'coffre' && k && k.roll && (C.prog.coffre || 0) > 0.8) { window.open(PR_CV_URL, '_blank', 'noopener'); this.say("Le voilà ! Mon CV s'ouvre dans un nouvel onglet.", 'LOUIS-MARIE · CABINE'); return; }
    if (C && C.focus === 'livre' && k && k.k === 'livre') { this.turnPage(); return; }
    if (!k) { if (C && C.focus) this.cabUnfocus(); return; }
    if (C.focus === k.k && k.k !== 'bouteilles') return;
    this.cabFocus(k.k, k.i);
  },
  cabinStep(T, t, dt) {
    const C = this.cabin; if (!C) return; const ease = (x) => x < 0.5 ? 2 * x * x : 1 - Math.pow(-2 * x + 2, 2) / 2;
    // caméra
    if (C.camT < 1 && C.camFrom) { C.camT = Math.min(1, C.camT + dt / 1.1); const e = ease(C.camT); C.cam.position.lerpVectors(C.camFrom.p, C.camTo.p, e); C.look.lerpVectors(C.camFrom.l, C.camTo.l, e); C.cam.up.lerpVectors(C.camFrom.u, C.camTo.u, e).normalize(); }
    const look = C.look.clone(); if (!C.focus && C.camT >= 1 && this.mouse) { const mx = this.mouse.x / innerWidth - 0.5, my = this.mouse.y / innerHeight - 0.5; look.z += mx * 1.6; look.y -= my * 0.8; }
    C.cam.lookAt(look);
    // progressions des animations (0 → 1 quand l'objet est actif, retour sinon)
    for (const k of ['coffre', 'photo', 'vhf', 'bouteilles', 'carte']) { const on = C.focus === k && C.camT > 0.55; C.prog[k] = this.reduced ? (on ? 1 : 0) : Math.max(0, Math.min(1, (C.prog[k] || 0) + (on ? dt / 1.1 : -dt / 0.7))); }
    const P = (k) => ease(C.prog[k] || 0);
    if (C.lidPivot) { C.lidPivot.rotation.z = -1.75 * P('coffre'); C.L.coffre.intensity = 1.6 * P('coffre'); }
    if (C.framePivot) { const e = P('photo'); C.framePivot.position.copy(C.framePos).add(new T.Vector3(-0.28 * Math.min(1, e * 2), 0.02 * Math.min(1, e * 2), 0)); C.framePivot.rotation.y = Math.PI * Math.max(0, (e - 0.35) / 0.65); }
    if (C.hand && C.handHome) { const e = P('vhf'); C.hand.position.copy(C.handHome).add(new T.Vector3(0.05 * e, 0.07 * e, 0)); }
    if (C.screen) { const on = C.focus === 'vhf'; C.screen.material.emissiveIntensity = on ? (Math.sin(t * 6) > 0 ? 1.6 : 0.6) : 1; }
    if (C.needle) C.needle.rotation.y = 0.35 * Math.sin(t * 0.8) + (C.focus === 'carte' ? 0.2 * Math.sin(t * 3) : 0);
    // bouteille choisie : vient vers soi, le bouchon saute, le message se déroule
    const eb = P('bouteilles');
    C.bottles.forEach((b, i) => {
      const active = i === C.sel; const e = active ? eb : 0;
      const pres = new T.Vector3(-0.32, 1.18, 0.72);
      b.g.position.lerpVectors(b.home, pres, Math.min(1, e * 1.6)); b.g.rotation.set(0, -0.6 * e, 0.25 * e);
      if (b.cork) b.cork.position.copy(b.corkHome).add(new T.Vector3(0.12 * Math.max(0, (e - 0.55) / 0.45), 0.04 * Math.max(0, (e - 0.55) / 0.45), 0));
    });
    const es = Math.max(0, (eb - 0.6) / 0.4);
    C.scroll.visible = es > 0.01; C.scroll.position.set(-0.06, 1.36, 0.8); C.scroll.lookAt(C.cam.position); C.scroll.scale.set(1, Math.max(0.02, es), 1); C.scroll.material.opacity = Math.min(1, es * 2);
    // repères, lanterne qui vacille, roulis
    C.dots.forEach((d, i) => { d.visible = !C.focus; d.material.opacity = 0.55 + 0.45 * Math.sin(t * 3 + i); d.scale.setScalar(1 + 0.25 * Math.sin(t * 3 + i)); });
    C.L.table.intensity = 1.85 + 0.15 * Math.sin(t * 9) * Math.sin(t * 2.3);
    C.root.rotation.x = this.reduced ? 0 : 0.012 * Math.sin(t * 0.7);
    // survol
    if (this.mouse && (this.cabHov = (this.cabHov || 0) + 1) % 5 === 0) {
      const k = this.cabinPick(this.mouse.x, this.mouse.y), r0 = this.renderer.domElement.getBoundingClientRect(); this.renderer.domElement.style.cursor = k ? 'pointer' : 'default';
      let label = k ? PR_CAB_NAMES[k.k] : null; if (k && k.k === 'coffre' && C.focus === 'coffre' && k.roll) label = 'Télécharger mon CV (PDF)'; if (k && k.k === 'livre' && C.focus === 'livre') label = 'Tourner la page';
      if (k && k.k === 'bouteilles' && k.i != null) label = 'Bouteille · ' + PR_BOTTLES[k.i][0];
      if (label) { this.tip.innerHTML = '<b>' + (PR_CAB_ICON[k.k] || '•') + '</b>' + label; this.tip.style.display = 'block'; this.tip.style.left = (this.mouse.x - r0.left) + 'px'; this.tip.style.top = (this.mouse.y - r0.top - 14) + 'px'; } else this.tip.style.display = 'none';
    }
  }
});
