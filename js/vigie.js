/* L'île de Vigie : une plateforme de lancement en mer, sa tour et la fusée « ARCHIPEL » (assets/vigie.glb, voir outils/3d/scripts/vigie_plateforme.py).
   « Embarquer dans la fusée » : l'ascenseur monte à la capsule, le bras se retire, compte à rebours, décollage (flamme, fumée sur l'eau),
   montée continue pendant que le ciel passe au bleu nuit de l'espace, séparation du premier étage. En orbite, la caméra entre dans la capsule
   et regarde la Terre : c'est la première image du film de Vigie (assets/vigie.mp4, filmé image par image dans la vraie app),
   posée derrière la scène 3D (devenue transparente) et calée sur la caméra ; quand la vue s'aligne, l'image s'élargit et le film démarre.
   « Rentrer sur Terre » : rentrée dans l'atmosphère, parachutes, amerrissage près de la plateforme. La caméra reste libre ; les consignes sont données une fois. */
const PR_VG = { navy: [14, 18, 27],                          // le fond du film (sRGB)
  globe: { cx: 958 / 1920, cy: 540 / 1080, r: 471 / 1080 },   // la Terre dans la première image du film (centre, rayon, en fraction de l'image)
  film: 'assets/vigie.mp4', ratio: 16 / 9,
  tour: 6, compte: 3.2, sep: 9, orbite: 13,                    // durées : ascenseur ; allumage → décollage ; séparation et orbite (s après le décollage)
  scenes: [[2, "La France rejoue sa journée du samedi 14 novembre : chaque trait est un train, à sa place et à l'heure."], [10.2, "Un clic sur un TGV : sa fiche s'ouvre, avec son trajet, ses gares et son retard."],
    [14.5, "Paris en 3D : les métros, les RER, et un clic sur une rame de RER B."], [26, "Roissy : un avion cargo en approche, suivi par la caméra à son altitude."],
    [41, "Le Pas-de-Calais : un porte-conteneurs en route au large de Calais, avec sa fiche."], [57, "La population, carreau par carreau, d'après l'INSEE."], [65.5, "Retour en orbite : les satellites. Un clic sur l'ISS, et son orbite se trace."]] };
Object.assign(PR_RADIO, {
  vgTour: "On monte ! L'ascenseur file en haut de la tour, jusqu'à la capsule.",
  vgCompte: "Bras d'accès rentré. Compte à rebours : trois… deux… un…",
  vgDecollage: 'Décollage !',
  vgSep: 'Séparation du premier étage. Le ciel devient noir.',
  vgOrbite: "Nous sommes en orbite. Regarde la Terre par le hublot : ce que tu vas voir, c'est la vraie Vigie, filmée image par image avec les données enregistrées par mon serveur.",
  vgFin: "Et aussi, dans Vigie : la pluie et le vent, les alertes météo, la qualité de l'air, les séismes, les incendies, les crues et les marées, la production d'électricité, les bornes de recharge, les prix des carburants, les vélos en libre-service, le trafic, les accidents de la route, les photos aériennes d'autrefois, les monuments, les élections et l'immobilier.",
  vgRetour: 'On rentre. Bouclier thermique en avant…',
  vgPara: 'Parachutes ouverts.',
  vgAmerri: "Amerrissage ! Bienvenue à la maison. Elba t'attend au ponton."
});
Object.assign(Component.prototype, {
  vgPh(ph) { return ph === 'vgTour' || ph === 'vgVol' || ph === 'vgOrbite' || ph === 'vgRetour'; },
  vgO() { const I = PR_ISLES.cartevivante; return { x: I.x, z: I.z }; },
  vgBerth() { const O = this.vgO(); return { x: O.x - 10, z: O.z + 20.6, h: 0 }; },               // le long du ponton, au sud, nez à l'est
  vgApp(B) { return [{ x: B.x - 42, z: B.z + 9 }, { x: B.x - 17, z: B.z + 0.5 }]; },               // on arrive par l'ouest
  vgPen(x, z) { const O = this.vgO(), lx = x - O.x, lz = z - O.z; let p = -1e9;                     // flotteurs et pont, ponton
    for (const [x0, x1, z0, z1] of [[-31, 31, -16, 16], [-19, -1, 16, 19.0]]) p = Math.max(p, Math.min(lx - x0, x1 - lx, lz - z0, z1 - lz) + 1.4); return p; },
  // ---------- chargement : la plateforme dès le départ (on la voit de l'archipel)
  loadVigie() {
    if (this.vgLoading) return; this.vgLoading = true; const T = window.THREE, L = new T.GLTFLoader(), O = this.vgO();
    L.load('assets/vigie.glb', (g) => { const root = g.scene; root.position.set(O.x, 0, O.z); const G = this.isleG && this.isleG.cartevivante; (G || this.scene).add(root); this.vgRoot = root; this.renduOmbres(T, root);
      const n = (k) => root.getObjectByName(k); this.vgN = { fus: n('Fusee'), e1: n('Etage1'), e2: n('Etage2'), cap: n('Capsule'), para: n('Parachutes'), bras: n('Bras'), asc: n('Ascenseur') };
      this.vgInit = {}; for (const k in this.vgN) { const o = this.vgN[k]; if (o) this.vgInit[k] = { parent: o.parent, p: o.position.clone(), q: o.quaternion.clone(), s: o.scale.clone() }; }
      if (this.vgN.para) this.vgN.para.visible = false;
      root.traverse((o) => { if (o.isMesh && o.material && /^Feu|^Hublot/.test(o.material.name || '')) o.material.toneMapped = true; });
      this.vgBuildFx(T); });
  },
  vgBuildFx(T) {
    // flammes : trois cônes additifs sous le premier étage, un plus petit et bleuté sous le deuxième
    const cone = (r, h, c, op) => { const g = new T.ConeGeometry(r, h, 24, 1, true); g.rotateX(Math.PI); g.translate(0, -h / 2, 0);
      return new T.Mesh(g, new T.MeshBasicMaterial({ color: new T.Color(...c), transparent: true, opacity: op, blending: T.AdditiveBlending, depthWrite: false, side: T.DoubleSide, fog: false })); };
    const f1 = new T.Group(); [[0.9, 7, [3, 2.6, 1.8], 0.9], [1.5, 12, [2.4, 1.1, 0.3], 0.55], [2.2, 18, [1.3, 0.35, 0.06], 0.32]].forEach((a) => f1.add(cone(...a))); f1.position.y = -1.3; f1.visible = false; this.vgN.e1.add(f1); this.vgF1 = f1;
    const f2 = new T.Group(); [[0.45, 4, [2.2, 2.4, 3], 0.85], [0.9, 8, [0.6, 0.9, 2.2], 0.45]].forEach((a) => f2.add(cone(...a))); f2.position.y = -1.8; f2.visible = false; this.vgN.e2.add(f2); this.vgF2 = f2;
    this.vgFL = new T.PointLight(0xffa860, 0, 140, 1.4); this.scene.add(this.vgFL);
    // fumée et embruns : des boules qui gonflent, portées par le vent du jet
    const N = 240; this.vgSmoke = new T.InstancedMesh(new T.IcosahedronGeometry(1, 2), new T.MeshLambertMaterial({ color: 0xe4e2de }), N); this.vgSmoke.frustumCulled = false; this.vgSmoke.count = 0; this.scene.add(this.vgSmoke);
    this.vgP = []; for (let i = 0; i < N; i++) this.vgP.push({ on: false, p: new T.Vector3(), v: new T.Vector3(), s: 1, s1: 6, age: 0, life: 8 });
    // plasma de la rentrée
    const gc = document.createElement('canvas'); gc.width = gc.height = 128; const gx = gc.getContext('2d'), gr = gx.createRadialGradient(64, 64, 0, 64, 64, 64); gr.addColorStop(0, 'rgba(255,255,255,1)'); gr.addColorStop(0.25, 'rgba(255,220,170,0.85)'); gr.addColorStop(0.6, 'rgba(255,140,60,0.3)'); gr.addColorStop(1, 'rgba(255,90,20,0)'); gx.fillStyle = gr; gx.fillRect(0, 0, 128, 128);
    const gt = new T.CanvasTexture(gc), spr = (c) => new T.Sprite(new T.SpriteMaterial({ map: gt, color: new T.Color(...c), transparent: true, opacity: 0, blending: T.AdditiveBlending, depthWrite: false, fog: false }));
    this.vgPlasma = new T.Group(); this.vgPlasma.visible = false; this.scene.add(this.vgPlasma);   /* lueur sous le bouclier, et un sillage au-dessus */
    this.vgGlow = [spr([2.4, 1.3, 0.6]), spr([1.8, 0.7, 0.25]), spr([1.4, 0.45, 0.15])]; this.vgGlow.forEach((g) => this.vgPlasma.add(g));
    // étoiles, sur toute la sphère (celles de la nuit ne couvrent que le ciel)
    const n = 1800, pos = new Float32Array(n * 3); for (let i = 0; i < n; i++) { const u = Math.random() * 2 - 1, a = Math.random() * Math.PI * 2, r = Math.sqrt(1 - u * u); pos[3 * i] = Math.cos(a) * r * 1300; pos[3 * i + 1] = u * 1300; pos[3 * i + 2] = Math.sin(a) * r * 1300; }
    const sg = new T.BufferGeometry(); sg.setAttribute('position', new T.BufferAttribute(pos, 3)); this.vgStars = new T.Points(sg, new T.PointsMaterial({ color: 0xffffff, size: 1.5, sizeAttenuation: false, transparent: true, opacity: 0, fog: false, depthWrite: false })); this.vgStars.visible = false; this.scene.add(this.vgStars);
    // le bleu nuit du film, rendu à l'identique malgré le tone mapping (couleur linéaire telle que ACES puis sRGB redonnent le fond du film)
    const L = this.vgNavyLin(); this.vgNavyL = new T.Color(L[0], L[1], L[2]); this.vgNavyC = new T.Color(Math.pow(L[0], 1 / 2.2), Math.pow(L[1], 1 / 2.2), Math.pow(L[2], 1 / 2.2));
  },
  vgNavyLin() {
    const want = PR_VG.navy.map((v) => { const c = v / 255; return c <= 0.04045 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4); }), e = PR_RENDU.exposition / 0.6;
    const IN = [[0.59719, 0.35458, 0.04823], [0.07600, 0.90834, 0.01566], [0.02840, 0.13383, 0.83777]], OUT = [[1.60475, -0.53108, -0.07367], [-0.10208, 1.10813, -0.00605], [-0.00327, -0.07276, 1.07602]];
    const mul = (M, v) => M.map((r) => r[0] * v[0] + r[1] * v[1] + r[2] * v[2]), fit = (v) => (v * (v + 0.0245786) - 0.000090537) / (v * (0.983729 * v + 0.4329510) + 0.238081);
    const f = (L) => mul(OUT, mul(IN, L.map((x) => x * e)).map(fit)).map((x) => Math.min(1, Math.max(1e-7, x)));
    let L = want.slice(); for (let i = 0; i < 80; i++) { const o = f(L); L = L.map((x, j) => Math.max(1e-7, x * Math.pow(want[j] / o[j], 0.7))); }
    return L;
  },
  // le film : derrière la scène 3D ; on le cale sur la caméra, puis il s'élargit en plein cadre
  vgVideo() {
    if (this.vgVid) return this.vgVid; const v = document.createElement('video'); v.src = PR_VG.film; v.muted = true; v.playsInline = true; v.preload = 'none'; v.setAttribute('aria-label', 'Le film de Vigie : la France rejouée, trains, avions, bateaux et leurs fiches');
    v.style.cssText = 'position:absolute;left:0;top:0;z-index:0;pointer-events:none;transform-origin:0 0;opacity:0;display:none;will-change:transform';
    const cv = this.renderer.domElement; cv.style.position = 'relative'; cv.style.zIndex = '1'; this.host.style.isolation = 'isolate'; this.host.insertBefore(v, cv);   /* l'empilement reste dans la scène : l'interface passe toujours devant */
    v.addEventListener('ended', () => { this.vgFilmFin = true; this.say(PR_RADIO.vgFin, 'LOUIS-MARIE · VIGIE'); this.setState({ vgFin: true }); });
    this.vgVid = v; return v;
  },
  // ---------- les gestes
  vgEmbarquer() {
    if (!this.vgN || !this.vgSmoke) { this.loadVigie(); this.say('Un instant, je prépare la fusée…'); clearTimeout(this.vgT0); this.vgT0 = setTimeout(() => this.vgEmbarquer(), 800); return; }
    this.vgReset(); this.setNightNow(0); const v = this.vgVideo(); v.preload = 'auto'; try { v.load(); } catch (e) {}
    this.vg = { t: 0, sep: false, cues: {} }; this.vgFilmFin = false; this.vgActive = true; this.seen('cartevivante');
    const P = this.vgPad(); Object.assign(this.orbW, { yaw: -0.6, pitch: 0.2, dist: 40 }); this.vgTarget(P.x, P.y + 4, P.z, true);
    this.setState({ phase: 'vgTour', vgFin: false, panel: null }); this.say(PR_RADIO.vgTour, 'LOUIS-MARIE · VIGIE');
  },
  vgPasser() {   // aller tout de suite en orbite
    const ph = this.st().phase; if (ph !== 'vgTour' && ph !== 'vgVol') return; if (ph === 'vgTour') this.vgStartVol();
    this.vg.t = PR_VG.compte + PR_VG.orbite - 0.01; this.vg.skip = true;
  },
  vgRentrer() { if (this.st().phase !== 'vgOrbite' || !this.vg) return; this.vg.rentre = 0; this.vg.l0 = this.vg.film ? 1 : (this.vg.lock || 0); const v = this.vgVid; if (v) v.pause(); this.setState({ vgFin: false }); this.say(PR_RADIO.vgRetour, 'LOUIS-MARIE · VIGIE'); },
  vgRevoir() { const v = this.vgVid; if (!v) return; this.vgFilmFin = false; this.vgSceneI = -1; v.currentTime = 0; v.play().catch(() => {}); this.setState({ vgFin: false }); },
  vgPad() { const O = this.vgO(); return { x: O.x + 14, y: 14.6, z: O.z }; },
  vgTarget(x, y, z, soft) { const O = this.orb, W = this.orbW; W.tx = x; W.ty = y; W.tz = z; if (!soft) { O.tx = x; O.ty = y; O.tz = z; this.placeCam(); } },   /* replacée tout de suite : à grande vitesse, une image de retard suffit à sortir l'objet du cadre */
  vgCue(k, o) { if (!this.vg.cues[k]) { this.vg.cues[k] = 1; Object.assign(this.orbW, o); } },
  vgStartVol() { this.vg.t = 0; this.vg.cues = {}; this.setState({ phase: 'vgVol' }); this.say(PR_RADIO.vgCompte, 'LOUIS-MARIE · VIGIE'); },
  // tout remettre sur le pas de tir (fusée neuve)
  vgReset() {
    if (!this.vgN || !this.vgInit) return;
    for (const k in this.vgInit) { const o = this.vgN[k], I = this.vgInit[k]; if (!o) continue; if (o.parent !== I.parent) I.parent.add(o); o.position.copy(I.p); o.quaternion.copy(I.q); o.scale.copy(I.s); o.visible = true; }
    if (this.vgN.para) this.vgN.para.visible = false; if (this.vgF1) this.vgF1.visible = false; if (this.vgF2) this.vgF2.visible = false; if (this.vgN.cap) this.vgN.cap.traverse((o) => { o.visible = true; }); if (this.vgN.para) this.vgN.para.visible = false;
  },
  // ---------- à chaque image
  vgStep(T, t, dt, ph) {
    if (!this.vgLoading && this.isleG) this.loadVigie();
    if (!this.vgN) return;
    this.vgSmokeStep(T, dt);
    if (!this.vgPh(ph)) { if (this.vgActive) this.vgCleanup(); this.vgFloat(t); return; }
    const ss = (a, b, x) => { x = Math.max(0, Math.min(1, (x - a) / (b - a))); return x * x * (3 - 2 * x); };
    const V = this.vg, N = this.vgN, P = this.vgPad(); V.t += dt;
    let alt = 0;
    if (ph === 'vgTour') {   // l'ascenseur monte le long de la tour ; la caméra le suit
      const k = ss(0.6, PR_VG.tour - 0.8, V.t), y = this.vgInit.asc.p.y + (59 - this.vgInit.asc.p.y) * k; N.asc.position.y = y;
      this.vgTarget(P.x, 4 + y * 0.92, P.z + 4, true);
      this.vgCue('tour', { yaw: -0.75, pitch: 0.18, dist: 46 });
      if (V.t > PR_VG.tour) this.vgStartVol();
    }
    if (ph === 'vgVol') {
      const tau = V.t - PR_VG.compte, I = this.vgInit;
      N.bras.quaternion.copy(I.bras.q); N.bras.rotateY(-1.45 * ss(0.2, 2.2, V.t));       /* le bras s'écarte */
      N.asc.position.y = I.asc.p.y + (59 - I.asc.p.y) * (1 - ss(1.5, 6, V.t));                                                /* l'ascenseur redescend */
      const ign = ss(-0.7, 0, tau);                                                                                               // allumage
      const h = tau > 0 ? 3 * tau * tau + 0.12 * Math.pow(tau, 4) : 0, vel = tau > 0 ? 6 * tau + 0.48 * Math.pow(tau, 3) : 0;
      const tilt = 0.4 * ss(250, 3500, h); N.fus.position.set(I.fus.p.x + h * tilt * 0.45, I.fus.p.y + h, I.fus.p.z); N.fus.quaternion.copy(I.fus.q); N.fus.rotateZ(-tilt);
      alt = I.fus.p.y + h;
      if (tau > -0.05 && !V.dit) { V.dit = true; this.say(PR_RADIO.vgDecollage, 'LOUIS-MARIE · VIGIE'); }
      // flamme
      const fl = V.sep ? this.vgF2 : this.vgF1; if (this.vgF1) this.vgF1.visible = !V.sep && ign > 0.01; if (this.vgF2) this.vgF2.visible = V.sep;
      if (fl && fl.visible) { const k = V.sep ? 1 : ign * (1 + 0.25 * ss(0, 3, tau)); fl.scale.set(k * (0.95 + 0.08 * Math.sin(t * 47)), k * (0.9 + 0.15 * Math.sin(t * 31 + 1)), k * (0.95 + 0.08 * Math.cos(t * 43))); }
      const wp = new T.Vector3(); (V.sep ? N.e2 : N.e1).getWorldPosition(wp); this.vgFL.position.copy(wp).y -= 4; this.vgFL.intensity = V.sep ? 0 : ign * 900 * LUXP / 4 * (1 - ss(60, 400, h));
      // fumée : du carneau vers l'est et sur l'eau, puis autour du pas de tir au décollage, puis une traînée
      if (tau > -0.6 && tau < 5) { this.vgEmit(T, dt * 40, () => ({ p: [P.x + 5.6, 11.5, P.z + (Math.random() - 0.5) * 4], v: [18 + Math.random() * 14, -3 + Math.random() * 4, (Math.random() - 0.5) * 16], s: 1.8, s1: 6 + Math.random() * 5, life: 7 + Math.random() * 4 }));
        if (tau > 0 && tau < 2.5) this.vgEmit(T, dt * 28, () => { const a = Math.random() * Math.PI * 2; return { p: [P.x + Math.cos(a) * 3, P.y + 0.5, P.z + Math.sin(a) * 3], v: [Math.cos(a) * 9, 1 + Math.random() * 2, Math.sin(a) * 9], s: 1.5, s1: 4 + Math.random() * 3, life: 6 + Math.random() * 3 }; }); }
      if (tau > 0.4 && h < 700 && !V.sep) this.vgEmit(T, dt * 22, () => ({ p: [wp.x + (Math.random() - 0.5), wp.y - 6 - Math.random() * 6, wp.z + (Math.random() - 0.5)], v: [(Math.random() - 0.5) * 2, -6, (Math.random() - 0.5) * 2], s: 1.4, s1: 4 + h / 120, life: 5 + Math.random() * 2 }));
      // séparation du premier étage
      if (tau > PR_VG.sep && !V.sep) { V.sep = true; this.scene.attach(N.e1); V.e1v = new T.Vector3(Math.sin(tilt), Math.cos(tilt), 0).multiplyScalar(vel * 0.82); V.e1t = 0; this.say(PR_RADIO.vgSep, 'LOUIS-MARIE · VIGIE'); }
      if (V.sep && N.e1.parent === this.scene) { V.e1t += dt; V.e1v.y -= 40 * dt; N.e1.position.addScaledVector(V.e1v, dt); N.e1.rotateX(dt * 0.35); N.e1.rotateZ(dt * 0.2); if (V.e1t > 9) N.e1.visible = false; }
      // la caméra : d'abord le pas de tir, puis elle suit la fusée (cible imposée, angle et recul libres)
      const cg = new T.Vector3(); (V.sep ? N.e2 : N.fus).getWorldPosition(cg); const up = V.sep ? 7 : 26; cg.y += up * Math.cos(tilt); cg.x += up * Math.sin(tilt);
      const kf = ss(0.3, 2.6, tau), tx = P.x + (cg.x - P.x) * kf, ty = (P.y + 26) + (cg.y - P.y - 26) * kf, tz = P.z + (cg.z - P.z) * kf; this.vgTarget(tx, ty, tz, tau < 0.3);
      this.vgCue('compte', { yaw: -0.7, pitch: 0.16, dist: 120 });
      if (tau > 2.2) this.vgCue('suit', { dist: 75, pitch: 0.2 });
      if (tau > 6) this.vgCue('haut', { dist: 55, pitch: 0.32 });
      if (V.sep) this.vgCue('sep', { dist: 58, pitch: 0.45, yaw: this.orbW.yaw + 0.5 });
      if (tau > PR_VG.orbite) this.vgEnterOrbit(T);
    }
    if (ph === 'vgOrbite') alt = this.vgOrbitStep(T, t, dt);
    if (ph === 'vgRetour') alt = this.vgRetourStep(T, t, dt);
    if (ph === 'vgTour') alt = 0;
    this.vgSpace(T, ph === 'vgOrbite' && !V.rentreSky ? 1 : ss(200, 2400, alt), ph);
  },
  // le ciel, la brume et la mer virent au bleu nuit du film à mesure qu'on monte ; le ciel suit la caméra
  vgSpace(T, k, ph) {
    if (!this.nightCols) this.ensureNight(); const L = this.nightCols, U = this.sky.material.uniforms, S = this.sea.material.uniforms, c = this.cam.position;
    this.sky.position.copy(c); this.vgStars.position.copy(c);
    const k1 = Math.min(1, k / 0.55), e1 = k1 * k1 * (3 - 2 * k1), k2 = Math.max(0, Math.min(1, (k - 0.35) / 0.65)), e2 = k2 * k2 * (3 - 2 * k2), deep = this.vgDeep || (this.vgDeep = new T.Color(0x2a5288));
    U.top.value.copy(L.top[0]).lerp(deep, e1).lerp(this.vgNavyC, e2); U.hor.value.copy(L.hor[0]).lerp(L.top[0], e1).lerp(this.vgNavyC, e2); U.glow.value = 1 - e1;
    const h = U.hor.value; if (k > 0) this.scene.fog.color.setRGB(Math.pow(h.r, 2.2), Math.pow(h.g, 2.2), Math.pow(h.b, 2.2)); else this.scene.fog.color.copy(this.fogDay); S.skyc.value.copy(L.skyc[0]).lerp(h, Math.min(1, k * 2));
    this.vgStars.visible = k > 0.3; this.vgStars.material.opacity = Math.max(0, (k - 0.3) / 0.7) * (1 - (this.vg && this.vg.lockE || 0)) * (this.vgStarsK == null ? 1 : this.vgStarsK);
    // en orbite : plus de ciel ni de mer ; la scène devient transparente sur le fond du film
    const orb = ph === 'vgOrbite' && !(this.vg && this.vg.rentreSky); this.sky.visible = !orb; this.sea.visible = !orb && c.y < 2600;
    if (orb !== !!this.vgDirect) { this.vgDirect = orb; this.renderer.setClearColor(0x000000, orb ? 0 : 1); this.host.style.background = orb ? 'rgb(' + PR_VG.navy.join(',') + ')' : ''; }
  },
  vgCleanup() {
    this.vgActive = false; this.vgDirect = false; this.renderer.setClearColor(0x000000, 1); this.host.style.background = '';
    this.sky.position.set(0, 0, 0); this.sky.visible = true; this.sea.visible = true; if (this.vgStars) this.vgStars.visible = false; if (this.vgPlasma) this.vgPlasma.visible = false; if (this.vgFL) this.vgFL.intensity = 0;
    if (this.nightCols) { const L = this.nightCols, U = this.sky.material.uniforms; U.top.value.copy(L.top[0]); U.hor.value.copy(L.hor[0]); U.glow.value = 1; this.scene.fog.color.copy(this.fogDay); this.sea.material.uniforms.skyc.value.copy(L.skyc[0]); }
    if (this.vgVid) { this.vgVid.pause(); this.vgVid.style.display = 'none'; this.vgVid.style.opacity = 0; }
    if (!this.vg || !this.vg.amerri) this.vgReset();
  },
  // ---------- l'orbite : la capsule se sépare, la caméra entre dedans et regarde la Terre ; le film prend le relais
  vgEnterOrbit(T) {
    const V = this.vg, N = this.vgN; V.o = 0; V.lock = 0; V.lockE = 0; V.film = false; V.cues = {}; this.vgSceneI = -1;
    if (!V.sep) { V.sep = true; this.scene.attach(N.e1); } N.e1.visible = false;   /* le premier étage est loin : il ne reste pas sous la capsule */
    if (this.vgF1) this.vgF1.visible = false; if (this.vgF2) this.vgF2.visible = false; this.vgFL.intensity = 0;
    this.scene.attach(N.cap); this.scene.attach(N.e2); N.cap.quaternion.identity(); V.e2v = new T.Vector3(-4.5, -1.5, 4);   /* le deuxième étage s'écarte de côté, hors de l'axe du hublot */
    const cp = new T.Vector3(); N.cap.getWorldPosition(cp); V.capP = cp.clone();
    V.dirG = new T.Vector3(0.3, -0.95, -0.1).normalize(); V.G = cp.clone().addScaledVector(V.dirG, 1000); V.Rg = 340;   // la Terre, sous la capsule
    const yaw = Math.atan2(-V.dirG.x, -V.dirG.z); V.yawG = yaw; V.pitchG = Math.asin(-V.dirG.y);
    Object.assign(this.orbW, { yaw: yaw + 0.9, pitch: 0.55, dist: 24 }); this.vgTarget(cp.x, cp.y + 1.5, cp.z);
    const v = this.vgVideo(); v.style.display = 'block'; v.style.opacity = 1; if (v.readyState < 1) { v.preload = 'auto'; try { v.load(); } catch (e) {} }
    try { v.currentTime = 0; } catch (e) {} v.pause();
    this.setState({ phase: 'vgOrbite', vgFin: false }); this.say(PR_RADIO.vgOrbite, 'LOUIS-MARIE · VIGIE');
  },
  vgOrbitStep(T, t, dt) {
    const V = this.vg, N = this.vgN, ss = (a, b, x) => { x = Math.max(0, Math.min(1, (x - a) / (b - a))); return x * x * (3 - 2 * x); }; V.o += dt;
    const cp = V.capP; N.cap.position.copy(cp); N.cap.rotation.set(0.04 * Math.sin(t * 0.3), t * 0.02, 0.03 * Math.cos(t * 0.25));
    if (N.e2.visible) { N.e2.position.addScaledVector(V.e2v, dt); N.e2.rotateZ(dt * 0.08); if (V.o > 4 || this.orb.dist < 8) N.e2.visible = false; }   /* parti avant qu'on regarde la Terre */
    this.vgTarget(cp.x, cp.y + 1.5, cp.z);
    const vid = this.vgVid, ready = vid && vid.readyState >= 2;
    // rentrer : le film revient à la Terre, l'image se recale sur la caméra, on ressort de la capsule
    if (V.rentre != null) { V.rentre += dt; const r = V.rentre;
      if (r < 0.6 && V.film) vid.style.opacity = String(1 - r / 0.6);
      if (r >= 0.6 && V.film) { V.film = false; try { vid.currentTime = 0; } catch (e) {} }
      if (r >= 0.6) { vid.style.opacity = String(Math.min(1, (r - 0.6) / 0.5)); V.lock = Math.max(0, Math.min(V.l0, 1 - (r - 1.1) / 2.2)); }
      if (r > 1.6) this.vgCue('sortie', { dist: 26, pitch: 0.7, yaw: V.yawG + 0.9 });
      if (r > 3.6) this.vgStartRetour(T);
    } else {
      if (V.o > 3.2) this.vgCue('hublot', { yaw: V.yawG, pitch: V.pitchG, dist: 1.6 });
      if (!V.film && V.o > 4.6 && this.orb.dist < 4) V.lock = ready ? Math.min(1, V.lock + dt / 2.4) : V.lock;
      if (V.o > 4.6 && !ready && !V.attente && V.o > 8) { V.attente = true; this.say('Le film arrive… (chargement)', 'LOUIS-MARIE · VIGIE'); }
      if (!V.film && V.lock >= 1) { V.film = true; vid.play().catch(() => {}); }
      if (V.film && vid && !vid.paused) { const s = vid.currentTime, sc = PR_VG.scenes; let i = -1; for (let j = 0; j < sc.length; j++) if (s >= sc[j][0]) i = j; if (i !== this.vgSceneI && i >= 0) { this.vgSceneI = i; this.say(sc[i][1], 'LOUIS-MARIE · VIGIE'); } }
    }
    // la capsule disparaît quand on est dedans
    N.cap.visible = this.orb.dist > 3.2;
    // la Terre : la première image du film, calée sur la caméra (position, taille), découpée en disque ; puis plein cadre
    V.lockE = ss(0, 1, V.lock); this.vgPlaceFilm(T, V);
    return 4000;
  },
  vgPlaceFilm(T, V) {
    const vid = this.vgVid; if (!vid) return; const W = this.host.clientWidth, H = this.host.clientHeight, cam = this.cam;
    const top = 58, bot = W < 700 ? 170 : 128, Vw = Math.min(W - 32, (H - top - bot) * PR_VG.ratio), Vh = Vw / PR_VG.ratio, gx = PR_VG.globe.cx * Vw, gy = PR_VG.globe.cy * Vh, gr = PR_VG.globe.r * Vh;
    if (vid.style.width !== Vw + 'px') { vid.style.width = Vw + 'px'; vid.style.height = Vh + 'px'; }
    const p = V.G.clone().project(cam), d = cam.position.distanceTo(V.G), rpx = V.Rg / d * (H / 2) / Math.tan(cam.fov * Math.PI / 360);
    const behind = p.z > 1; let sx = (p.x + 1) / 2 * W, sy = (1 - p.y) / 2 * H, s = rpx / gr; if (behind) { sx = -1e4; sy = -1e4; }
    const e = V.lockE, fx = (W - Vw) / 2 + gx, fy = top + (H - top - bot - Vh) / 2 + gy;   // plein cadre : l'image entière, entre le haut de l'écran et la radio
    sx += (fx - sx) * e; sy += (fy - sy) * e; s += (1 - s) * e;
    vid.style.transform = 'translate(' + (sx - s * gx).toFixed(2) + 'px,' + (sy - s * gy).toFixed(2) + 'px) scale(' + s.toFixed(5) + ')';
    const rm = gr * 1.022 + e * e * Math.hypot(Vw, Vh), m = 'radial-gradient(circle ' + rm.toFixed(1) + 'px at ' + gx.toFixed(1) + 'px ' + gy.toFixed(1) + 'px, #000 ' + (rm - 3).toFixed(1) + 'px, transparent ' + rm.toFixed(1) + 'px)';
    vid.style.webkitMaskImage = m; vid.style.maskImage = m;
  },
  // ---------- la rentrée : plasma, parachutes, amerrissage près de la plateforme
  vgStartRetour(T) {
    const V = this.vg, N = this.vgN, O = this.vgO(); V.r = 0; V.cues = {}; V.rentreSky = true; V.para = false; V.amerri = false; V.vy = 0;
    V.S = new T.Vector3(O.x - 46, 0, O.z + 46); V.P0 = V.capP.clone(); N.cap.visible = true; N.e2.visible = false;
    this.setState({ phase: 'vgRetour' }); Object.assign(this.orbW, { dist: 30, pitch: 0.25 });
  },
  vgRetourStep(T, t, dt) {
    const V = this.vg, N = this.vgN, ss = (a, b, x) => { x = Math.max(0, Math.min(1, (x - a) / (b - a))); return x * x * (3 - 2 * x); }; V.r += dt; const r = V.r;
    const cap = N.cap; let h;
    if (!V.para) { const u = Math.min(1, r / 5), e = 0.9 * (3 * u * u - 2 * u * u * u) + 0.1 * u; h = V.P0.y + (300 - V.P0.y) * e; V.vy = (V.P0.y - 300) / 5 * (0.9 * 6 * u * (1 - u) + 0.1); const kx = ss(0, 5, r);   /* l'atmosphère freine la capsule avant les parachutes */
      cap.position.set(V.P0.x + (V.S.x - V.P0.x) * kx, h, V.P0.z + (V.S.z - V.P0.z) * kx); if (r >= 5) { V.para = true; V.pr = 0; N.para.visible = true; this.say(PR_RADIO.vgPara, 'LOUIS-MARIE · VIGIE'); } }
    else if (!V.amerri) { V.pr += dt; const vt = cap.position.y > 50 ? 48 : 15; V.vy += (vt - V.vy) * Math.min(1, dt * 2.5); cap.position.y = Math.max(0, cap.position.y - V.vy * dt); cap.position.x = V.S.x; cap.position.z = V.S.z;
      const k = ss(0, 1.6, V.pr), o = k * (1 + 0.12 * Math.sin(k * Math.PI)); N.para.scale.set(Math.max(0.03, o), Math.max(0.03, o), Math.max(0.03, o));
      if (cap.position.y <= 0.01) { V.amerri = true; V.at = 0; this.say(PR_RADIO.vgAmerri, 'LOUIS-MARIE · VIGIE');
        this.vgEmit(T, 46, () => { const a = Math.random() * Math.PI * 2, s = 3 + Math.random() * 7; return { p: [V.S.x + Math.cos(a) * 1.5, 0.3, V.S.z + Math.sin(a) * 1.5], v: [Math.cos(a) * s, 7 + Math.random() * 9, Math.sin(a) * s], s: 0.35, s1: 0.9, life: 0.9 + Math.random() * 0.6, g: 24 }; }); } }
    h = cap.position.y;
    if (V.amerri) { V.at += dt; const k = ss(0.2, 2.2, V.at); N.para.scale.set(1 - 0.6 * k, Math.max(0.03, 1 - k), 1 - 0.6 * k); N.para.position.y = this.vgInit.para.p.y - 8 * k; if (V.at > 2.4) N.para.visible = false; this.vgFloat(t);
      if (V.at > 4) this.vgFini(); }
    else { cap.rotation.set(0.05 * Math.sin(t * 1.3), t * 0.1, 0.05 * Math.cos(t * 1.1)); }
    // plasma au plus fort de la rentrée
    const pl = ss(3800, 2600, h) * ss(700, 1500, h) * (V.para ? 0 : 1); this.vgPlasma.visible = pl > 0.01; this.vgPlasma.position.copy(cap.position); const fl = 0.85 + 0.15 * Math.sin(t * 25), G = this.vgGlow;
    G[0].position.set(0, -0.6, 0); G[0].scale.set(7 * fl, 4.5 * fl, 1); G[1].position.set(0, 1.5, 0); G[1].scale.set(9, 9 * fl, 1); G[2].position.set(0, 9, 0); G[2].scale.set(6, 22 + 3 * Math.sin(t * 13), 1); G.forEach((g, i) => { g.material.opacity = pl * [1, 0.8, 0.6][i]; });
    // la Terre du film s'efface ; le ciel revient
    const vid = this.vgVid; if (vid) { const o = 1 - ss(0, 1.4, r); vid.style.opacity = String(o); if (o <= 0) vid.style.display = 'none'; else { V.Rg *= 1 + dt * 0.6; this.vgPlaceFilm(T, V); } }
    // caméra : cible imposée sur la capsule, consignes une fois
    this.vgTarget(cap.position.x, cap.position.y + (V.para ? 6 : 1), cap.position.z);
    if (V.para) this.vgCue('para', { dist: 48, pitch: 0.22 });
    if (V.para && h < 120) this.vgCue('mer', { dist: 70, pitch: 0.24, yaw: Math.atan2(V.S.x - this.vgO().x, V.S.z - this.vgO().z) + 0.5 });
    return h;
  },
  vgFloat(t) { const V = this.vg; if (!V || !V.amerri || !this.vgN) return; const c = this.vgN.cap; c.position.set(V.S.x, -0.7 + 0.12 * Math.sin(t * 1.2), V.S.z); c.rotation.set(0.05 * Math.sin(t * 0.9), 0.3, 0.06 * Math.cos(t * 1.1)); },
  vgFini() { this.vgActive = true; this.flyTo('cartevivante', true); this.say("Bienvenue à la maison ! La capsule flotte près de la plateforme, et Elba t'attend au ponton.", 'LOUIS-MARIE · VIGIE'); },
  // fumée et embruns : n nouvelles boules (fraction cumulée d'une image à l'autre), puis elles gonflent, ralentissent, se posent sur l'eau et s'effacent
  vgEmit(T, n, gen) { this.vgAcc = (this.vgAcc || 0) + n; while (this.vgAcc >= 1) { this.vgAcc -= 1; const q = this.vgP.find((x) => !x.on); if (!q) return; const o = gen();
    q.on = true; q.p.set(...o.p); q.v.set(...o.v); q.s0 = o.s; q.s1 = o.s1; q.age = 0; q.life = o.life; q.g = o.g || 0; q.rot = Math.random() * 6; } },
  vgSmokeStep(T, dt) {
    if (!this.vgSmoke) return; const m = this.vgM || (this.vgM = new T.Matrix4()), q = new T.Quaternion(), sc = new T.Vector3(), e = new T.Euler(); let n = 0;
    for (const x of this.vgP) { if (!x.on) continue; x.age += dt; if (x.age > x.life) { x.on = false; continue; }
      const k = x.age / x.life, drag = Math.exp(-dt * (x.g ? 0.4 : 0.9)); x.v.multiplyScalar(drag); x.v.y -= x.g * dt; x.p.addScaledVector(x.v, dt);
      const s = (x.s0 + (x.s1 - x.s0) * (1 - Math.pow(1 - k, 2.2))) * (k > 0.8 ? 1 - (k - 0.8) / 0.2 : 1); if (x.p.y < s * 0.35) { x.p.y = s * 0.35; x.v.y = Math.max(0, x.v.y); }
      e.set(x.rot, x.rot * 0.7, 0); q.setFromEuler(e); sc.set(s, s * 0.85, s); m.compose(x.p, q, sc); this.vgSmoke.setMatrixAt(n++, m); }
    this.vgSmoke.count = n; this.vgSmoke.instanceMatrix.needsUpdate = true; }
});
