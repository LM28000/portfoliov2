/* L'île du serveur : un îlot, une bouée jaune, et sous l'eau le village de caissons.
   « Plonger » : Elba se transforme en sous-marin (animation exportée de Blender, jouée en réglant son temps),
   descend jusqu'au village ; on tourne autour, on clique un caisson ; « Faire surface » rejoue tout à l'envers. */
const PR_FOND = { prof: -20, mue: 9, descente: 14, nfps: 24, nf: 120, swap: 0.37, noir: [0.011, 0.013, 0.015],
  ph: { plat: [0.18, 0.36], couleur: [0.42, 0.68], feux: [0.80, 0.90] } };
const PR_CAISSONS = {
  Caisson0: ['CLOUD PRIVÉ', ['Nextcloud', 'webmail', 'wiki'], 'Mes fichiers, mon agenda, mes mails et mes notes, hébergés chez moi.'],
  Caisson1: ['IA LOCALE', ['Ollama', 'n8n', 'Qdrant'], 'Des modèles de langue qui tournent sur ma machine, des automatisations et une base de recherche.'],
  Caisson2: ['MESSAGERIE', ['Matrix (Synapse)', 'Element'], 'Une messagerie chiffrée, sur mon propre serveur.'],
  Caisson3: ['ACCÈS', ['VPN Headscale', 'SSO Authelia'], "Rien n'est ouvert sur Internet : on entre par le VPN, puis par une seule connexion."],
  Caisson4: ['SUPERVISION', ['Grafana', 'Prometheus', 'Uptime Kuma'], "Des tableaux de bord et des alertes : je sais quand quelque chose ne va pas."],
  Caisson5: ['SAUVEGARDES', ['Kopia chiffré', 'dumps SQL', 'SnapRAID'], 'Une sauvegarde chiffrée chaque nuit, et des disques protégés contre la panne.'],
  Noeud: ['RÉSEAU', ['Debian 13', 'Docker', 'git'], "Le nœud central : une trentaine de services dans Docker, chacun décrit dans un fichier versionné dans git. Le gros câble part vers la Carte vivante, qui tourne ici, 24 h sur 24."]
};
Object.assign(PR_RADIO, {
  serveur: "Ici, tout se passe sous l'eau. La bouée jaune marque l'emplacement de mon serveur maison : une trentaine de services, posés sur le fond. Clique sur « Plonger » : Elba se transforme en sous-marin.",
  mue: "Préparation à la plongée : on rentre les voiles, on ferme tout… Elba devient sous-marin.",
  fond: "Bienvenue à vingt mètres : sept caissons, un par famille de services, reliés au nœud central. Le gros câble part vers la Carte vivante. Clique sur un caisson pour t'en approcher.",
  surface: "On remonte. Elba reprend sa forme de voilier."
});
Object.assign(Component.prototype, {
  srvPh(ph) { return ph === 'mue' || ph === 'plongee' || ph === 'fond' || ph === 'remonte'; },
  srvBerth() { const I = PR_ISLES.serveur; return { x: I.x - 4, z: I.z + I.rz + 16, h: Math.PI / 2 }; },
  // E : là où le sous-marin s'arrête, à -11,5 m, nez au sud ; le village est devant lui, un peu à droite
  srvEnd() { const B = this.srvBerth(); return { x: B.x + 14, y: -11.5, z: B.z + 12 }; },
  srvVC() { const E = this.srvEnd(); return { x: E.x - 7, y: PR_FOND.prof, z: E.z + 8 }; },
  // ---------- chargement (à l'approche de l'île du serveur)
  loadFond() {
    if (this.fondLoading) return; this.fondLoading = true; const T = window.THREE, L = new T.GLTFLoader(); if (T.MeshoptDecoder) L.setMeshoptDecoder(T.MeshoptDecoder);
    const B = this.srvBerth(), V = this.srvVC();
    L.load('assets/fond.glb', (g) => {
      const root = g.scene; const buoy = root.getObjectByName('MarqueSpeciale');
      if (buoy) { buoy.parent.remove(buoy); buoy.position.set(B.x - 7, 0, B.z - 1); this.scene.add(buoy); this.srvBuoy = buoy; }
      root.position.set(V.x, V.y, V.z); this.scene.add(root); this.fondG = root; root.visible = false;
      this.renduOmbres(T, root); if (buoy) this.renduOmbres(T, buoy);
      this.caps = {}; root.traverse((o) => { if (PR_CAISSONS[o.name] && !this.caps[o.name]) this.caps[o.name] = o; });
      this.buildFondFx(T);
    });
    L.load('assets/elba_sousmarin.glb', (g) => {
      const rig = g.scene; rig.visible = false; this.subRig = rig; if (this.boat) this.boat.add(rig);
      this.subMix = new T.AnimationMixer(rig); g.animations.forEach((c) => { const a = this.subMix.clipAction(c); a.play(); a.paused = false; }); this.subMix.setTime(0);
      this.subProp = rig.getObjectByName('HeliceRot'); this.subHull = rig.getObjectByName('Coque'); this.subSM = rig.getObjectByName('CoqueSousMarin'); if (this.subSM) this.subSM.visible = false;
      const mats = {}; rig.traverse((o) => { if (!o.isMesh) return; (Array.isArray(o.material) ? o.material : [o.material]).forEach((m) => { if (m && m.name) (mats[m.name] = mats[m.name] || []).push(m); }); o.castShadow = o.receiveShadow = true; });
      const keep = (m) => ({ m, c: m.color.clone(), r: m.roughness });
      this.subFondus = ['Rouf', 'Hublot', 'Bois'].flatMap((n) => (mats[n] || []).map(keep)); this.subBlanc = (mats.PontBlanc || [])[0] ? mats.PontBlanc[0].color.clone() : new T.Color(0.8, 0.8, 0.77);
      this.subNoirs = ['CoqueBleue.001', 'PontBlanc.001'].flatMap((n) => (mats[n] || []).map(keep)); this.subAF = (mats['Antifouling.001'] || []).map(keep);
      this.subHub = mats.HublotSM || []; this.subPhare = mats.PhareSM || [];
      // phare de nez (sous l'eau)
      const sp = new T.SpotLight(0xd8f2ff, 0, 45, 0.5, 0.6, 1.2); sp.position.set(4.3, 0.12, 0); const tg = new T.Object3D(); tg.position.set(12, -1.5, 0); rig.add(sp); rig.add(tg); sp.target = tg; this.subSpot = sp;
    });
  },
  // ---------- l'ambiance sous l'eau : sable et reflets, surface vue d'en dessous, rayons, poissons, bulles, lueurs
  buildFondFx(T) {
    const V = this.srvVC(), G = new T.Group(); G.visible = false; this.scene.add(G); this.fondFx = G;
    // sable
    const sg = new T.PlaneGeometry(240, 240, 80, 80); sg.rotateX(-Math.PI / 2); const pa = sg.attributes.position;
    for (let i = 0; i < pa.count; i++) { const x = pa.getX(i), z = pa.getZ(i), d = Math.hypot(x, z); pa.setY(i, (0.5 * Math.sin(x * 0.09 + z * 0.05) + 0.3 * Math.sin(z * 0.13 - x * 0.04) + 0.12 * Math.sin(x * 0.8 + z * 0.3)) * Math.min(1, Math.max(0.12, (d - 8) / 20)) - 0.1); }
    sg.computeVertexNormals(); const sand = new T.Mesh(sg, new T.MeshStandardMaterial({ color: new T.Color(0x7a7056), roughness: 1 })); sand.position.set(V.x, V.y, V.z); sand.receiveShadow = true; G.add(sand);
    // reflets du soleil sur le sable : un réseau de Voronoï, échantillonné deux fois en mouvement
    const N = 256, cv = document.createElement('canvas'); cv.width = cv.height = N; const cx = cv.getContext('2d'), im = cx.createImageData(N, N); const pts = []; let seed = 7; const rnd = () => (seed = (seed * 16807) % 2147483647) / 2147483647;
    for (let i = 0; i < 18; i++) pts.push([rnd() * N, rnd() * N]);
    for (let y = 0; y < N; y++) for (let x = 0; x < N; x++) { let d1 = 1e9, d2 = 1e9; for (const [px, py] of pts) for (let ox = -N; ox <= N; ox += N) for (let oy = -N; oy <= N; oy += N) { const d = Math.hypot(x - px - ox, y - py - oy); if (d < d1) { d2 = d1; d1 = d; } else if (d < d2) d2 = d; }
      const v = Math.max(0, 1 - (d2 - d1) / 9); const c = Math.round(255 * v * v), k = 4 * (y * N + x); im.data[k] = im.data[k + 1] = im.data[k + 2] = c; im.data[k + 3] = 255; }
    cx.putImageData(im, 0, 0); const ct = new T.CanvasTexture(cv); ct.wrapS = ct.wrapT = T.RepeatWrapping;
    const cm = new T.ShaderMaterial({ uniforms: { t: { value: 0 }, k: { value: 0.26 }, map: { value: ct } }, transparent: true, depthWrite: false, blending: T.AdditiveBlending, fog: false,
      vertexShader: 'varying vec3 vW; void main(){ vec4 w = modelMatrix*vec4(position,1.0); vW = w.xyz; gl_Position = projectionMatrix*viewMatrix*w; }',
      fragmentShader: 'uniform sampler2D map; uniform float t; uniform float k; varying vec3 vW; void main(){ vec2 p = vW.xz; float a = texture2D(map, p*0.085 + vec2(t*0.013, t*0.009)).r; float b = texture2D(map, p*0.11 + vec2(-t*0.011, t*0.015)).r; float c = min(a, b)*k*(1.0 - smoothstep(8.0, 50.0, length(vW - cameraPosition))) * smoothstep(2.0, 7.0, length(vW - cameraPosition)); gl_FragColor = vec4(vec3(0.45,0.7,0.75)*c, 1.0); }' });
    this.caustM = cm;
    const ov = new T.Mesh(sg, cm); ov.position.set(V.x, V.y + 0.04, V.z); G.add(ov);
    // la surface vue d'en dessous : plafond lumineux et ondulant
    this.underM = new T.ShaderMaterial({ side: T.BackSide, fog: false, uniforms: { t: { value: 0 } },
      vertexShader: 'varying vec3 vW; void main(){ vec4 w = modelMatrix*vec4(position,1.0); vW = w.xyz; gl_Position = projectionMatrix*viewMatrix*w; }',
      fragmentShader: 'uniform float t; varying vec3 vW; void main(){ vec3 V = normalize(vW - cameraPosition); float up = clamp(V.y, 0.0, 1.0); float r = 0.5 + 0.5*sin(vW.x*0.35 + t*0.9)*sin(vW.z*0.3 - t*0.7); vec3 deep = vec3(0.02,0.16,0.2), sky = vec3(0.55,0.8,0.85); float w = smoothstep(0.55, 0.95, up); vec3 c = mix(deep*1.4, sky, w) + vec3(0.25,0.35,0.35)*r*w*0.5; float d = length(vW.xz - cameraPosition.xz); c = mix(c, vec3(0.03,0.17,0.21), clamp(d/90.0, 0.0, 1.0)*(1.0-w*0.6)); gl_FragColor = vec4(pow(c, vec3(2.2)), 1.0);\n#include <tonemapping_fragment>\n#include <colorspace_fragment>\n}' });
    const up = new T.Mesh(new T.PlaneGeometry(700, 700), this.underM); up.rotation.x = -Math.PI / 2; up.position.set(V.x, -0.05, V.z); G.add(up);
    // rayons de soleil
    const gc = document.createElement('canvas'); gc.width = 8; gc.height = 128; const gx = gc.getContext('2d'); const gr = gx.createLinearGradient(0, 0, 0, 128); gr.addColorStop(0, 'rgba(255,255,255,0.9)'); gr.addColorStop(1, 'rgba(255,255,255,0)'); gx.fillStyle = gr; gx.fillRect(0, 0, 8, 128);
    const gt = new T.CanvasTexture(gc); this.rays = [];
    for (let i = 0; i < 14; i++) { const a = i * 2.4, d = 6 + (i * 7.3) % 26, w = 1.5 + (i % 4); const m = new T.MeshBasicMaterial({ map: gt, transparent: true, depthWrite: false, blending: T.AdditiveBlending, color: new T.Color(0.5, 0.75, 0.8), opacity: 0.12, side: T.DoubleSide, fog: true });
      const ray = new T.Group(); for (let j = 0; j < 2; j++) { const pl = new T.Mesh(new T.PlaneGeometry(w, 26), m); pl.position.y = -13; pl.rotation.y = j * Math.PI / 2; ray.add(pl); }
      ray.position.set(V.x + Math.cos(a) * d, 0, V.z + Math.sin(a) * d); ray.rotation.set(0.18, 0.3, 0.12); ray.userData.ph = i * 1.7; G.add(ray); this.rays.push(ray); }
    // poissons : deux bancs qui tournent
    const fm = new T.InstancedMesh(new T.SphereGeometry(0.12, 8, 6), new T.MeshStandardMaterial({ color: 0x8e9aa4, metalness: 0.7, roughness: 0.35 }), 70); fm.frustumCulled = false; G.add(fm); this.fish = fm;
    this.fishP = []; for (let i = 0; i < 70; i++) this.fishP.push({ s: i < 40 ? 0 : 1, a: rnd() * 0.8, r: rnd() * 2.2, y: rnd() * 1.6, o: rnd() * 6.28 });
    // bulles
    const bg = new T.BufferGeometry(), bp = new Float32Array(120 * 3); bg.setAttribute('position', new T.BufferAttribute(bp, 3)); this.bub = new T.Points(bg, new T.PointsMaterial({ color: 0xdff6ff, size: 0.12, transparent: true, opacity: 0.7, depthWrite: false })); this.bub.frustumCulled = false; G.add(this.bub); this.bubN = 0;
    // lueurs des caissons
    this.capL = []; for (const k in this.caps) { const c = this.caps[k]; c.updateMatrixWorld(true); const p = new T.Vector3(); c.getWorldPosition(p); const l = new T.PointLight(0x5fd0ff, 0, 10, 1.6); l.position.copy(p).add(new T.Vector3(0, 0.4, 0)); G.add(l); this.capL.push(l); }
  },
  // ---------- les gestes
  plonger() {
    if (!this.subRig || !this.fondG) { this.loadFond(); this.say('Un instant, je prépare la plongée…'); clearTimeout(this.plongeT); this.plongeT = setTimeout(() => this.plonger(), 800); return; }
    this.say(PR_RADIO.mue, 'LOUIS-MARIE · LE SERVEUR'); this.subT = this.subT || 0; this.subDir = 1; this.subMove = 0; this.fondFocus = null;
    this.subRig.visible = true; this.boat.children.forEach((c) => { if (c !== this.subRig) c.visible = false; });
    const b = this.b; Object.assign(this.orbW, { tx: b.x, tz: b.z, ty: 1, dist: 30, pitch: 0.22, yaw: this.orb.yaw });
    this.setState({ phase: 'mue', panel: null });
  },
  faireSurface() { this.fondFocus = null; this.subDir = -1; this.subUp = 0; this.setState({ phase: 'remonte', panel: null }); this.say(PR_RADIO.surface, 'LOUIS-MARIE · LE SERVEUR'); },
  fondFocusK(k) { const c = this.caps && this.caps[k]; if (!c) return; const p = new window.THREE.Vector3(); c.getWorldPosition(p); this.fondFocus = k;
    Object.assign(this.orbW, { tx: p.x, tz: p.z, ty: p.y + 0.4, dist: k === 'Noeud' ? 16 : 12, pitch: 0.22 });
    const [n, list, txt] = PR_CAISSONS[k]; this.setState({ panel: { kicker: k === 'Noeud' ? 'LE NŒUD CENTRAL' : 'UN CAISSON', title: n, list: list.map((x) => [x, '']), paras: [txt] } }); this.say(n + ' : ' + txt, 'LOUIS-MARIE · LE SERVEUR'); },
  fondOverview() { const V = this.srvVC(); this.fondFocus = null; Object.assign(this.orbW, { tx: V.x, tz: V.z, ty: V.y + 2, dist: 38, pitch: 0.3 }); this.setState({ panel: null }); },
  fondHit(cx, cy) { if (!this.fondG) return null; const T = window.THREE, r = this.renderer.domElement.getBoundingClientRect(), rc = new T.Raycaster(); rc.setFromCamera(new T.Vector2(((cx - r.left) / r.width) * 2 - 1, -((cy - r.top) / r.height) * 2 + 1), this.cam);
    const h = rc.intersectObject(this.fondG, true); for (const x of h) { let o = x.object; while (o && !PR_CAISSONS[o.name]) o = o.parent; if (o) return o.name; } return null; },
  // les routes : une seule courbe de Bézier chacune, nez au nord à la bouée, nez au sud au-dessus du village.
  // Le sous-marin part et arrive à vitesse nulle : son cap et son assiette ne peuvent pas sauter.
  diveCurve() { if (this.diveC) return this.diveC; const T = window.THREE, B = this.srvBerth(), E = this.srvEnd(), v = (x, y, z) => new T.Vector3(x, y, z);
    this.diveC = new T.CubicBezierCurve3(v(B.x, 0, B.z), v(B.x, -1, B.z - 15), v(E.x, E.y + 0.5, E.z - 13), v(E.x, E.y, E.z)); return this.diveC; },
  upCurve() { if (this.upC) return this.upC; const T = window.THREE, B = this.srvBerth(), E = this.srvEnd(), v = (x, y, z) => new T.Vector3(x, y, z);
    this.upC = new T.CubicBezierCurve3(v(E.x, E.y, E.z), v(E.x, E.y + 1, E.z + 13), v(B.x, -1, B.z + 15), v(B.x, 0, B.z)); return this.upC; },
  // ---------- à chaque image
  fondStep(T, t, dt, ph) {
    const I = PR_ISLES.serveur; if (!this.fondLoading && (this.isleK === 'serveur' || this.sailDest === 'serveur' || this.transitK === 'serveur' || Math.hypot(this.b.x - I.x, this.b.z - I.z) < 260)) this.loadFond();
    if (this.srvBuoy) { this.srvBuoy.position.y = 0.06 * Math.sin(t * 1.2) - 0.05; this.srvBuoy.rotation.z = 0.03 * Math.sin(t * 0.9); }
    const sub = this.srvPh(ph);
    if (!sub) { if (this.subRig && this.subRig.visible) { this.subRig.visible = false; this.subT = 0; this.subMove = 0; if (this.boat) this.boat.children.forEach((c) => { if (c !== this.subRig) c.visible = true; }); } this.eau(0); return; }
    if (!this.subRig) return;
    const ss = (a, b, x) => { x = Math.max(0, Math.min(1, (x - a) / (b - a))); return x * x * x * (x * (6 * x - 15) + 10); };
    // 1. la mue (t de 0 à 1, ou de 1 à 0 en remontant, une fois en surface)
    if (ph === 'mue') { this.subT = Math.min(1, this.subT + dt / PR_FOND.mue); if (this.subT >= 1) { this.setState({ phase: 'plongee' }); this.subMove = 0; } }
    if (ph === 'remonte' && this.subMove <= 0) { this.subT = Math.max(0, this.subT - dt / PR_FOND.mue); if (this.subT <= 0) this.surfaced(); }
    const st = this.subT; this.subMix.setTime(Math.min(st, 0.9995) * PR_FOND.nf / PR_FOND.nfps);   /* à la fin exacte, l'animation reboucle sur la première image */
    if (this.subHull) this.subHull.visible = st < PR_FOND.swap; if (this.subSM) this.subSM.visible = st >= PR_FOND.swap;
    const kp = ss(...PR_FOND.ph.plat, st), kc = ss(...PR_FOND.ph.couleur, st), kf = ss(...PR_FOND.ph.feux, st);
    this.subFondus.forEach((f) => f.m.color.copy(f.c).lerp(this.subBlanc, kp));
    const N = PR_FOND.noir; this.subNoirs.forEach((f) => { f.m.color.copy(f.c).lerp(new T.Color(N[0], N[1], N[2]), kc); f.m.roughness = f.r + (0.58 - f.r) * kc; });
    this.subAF.forEach((f) => f.m.color.copy(f.c).lerp(new T.Color(0.42, 0.07, 0.04), kc));
    this.subHub.forEach((m) => { m.emissive.setRGB(1.0, 0.72, 0.42); m.emissiveIntensity = 4 * kf; }); this.subPhare.forEach((m) => { m.emissive.setRGB(0.85, 0.95, 1.0); m.emissiveIntensity = 8 * kf; });
    // 2. la descente, le fond, la remontée : position, cap, assiette et hélice varient toujours en douceur
    const b = this.b, bo = this.boat;
    if (ph === 'plongee') { this.subMove = Math.min(1, this.subMove + dt / PR_FOND.descente); if (this.subMove >= 1) { this.setState({ phase: 'fond' }); this.fondOverview(); this.say(PR_RADIO.fond, 'LOUIS-MARIE · LE SERVEUR'); } }
    if (ph === 'remonte' && this.subUp < 1) { this.subUp = Math.min(1, this.subUp + dt / PR_FOND.descente); if (this.subUp >= 1) this.subMove = 0; }
    let C = null, u = 0, fade = 0;          // fade : 0 en surface (le bateau flotte), 1 en plongée
    if (ph === 'remonte' && this.subUp < 1) { C = this.upCurve(); u = ss(0, 1, this.subUp); fade = 1 - ss(0.85, 1, u); }
    else if (this.subMove > 0) { C = this.diveCurve(); u = ss(0, 1, this.subMove); fade = ss(0, 0.15, u); }
    this.hovA = (this.hovA || 0) + ((ph === 'fond' ? 0.25 : 0) - (this.hovA || 0)) * Math.min(1, dt * 0.8);
    if (C) { const p = C.getPointAt(u), tg = C.getTangentAt(Math.min(0.999, Math.max(0.001, u)));
      const nofl = 1 - fade, bobY = (0.05 * Math.sin(t * 1.3) - 0.05) * nofl;
      bo.position.set(p.x, p.y + bobY + this.hovA * Math.sin(t * 0.6), p.z); bo.rotation.set(0, 0, 0);
      const h = Math.atan2(-tg.z, tg.x); b.x = p.x; b.z = p.z; b.h = h;
      const want = Math.asin(Math.max(-0.4, Math.min(0.4, tg.y))) * fade; this.subPitch = (this.subPitch || 0) + (want - (this.subPitch || 0)) * Math.min(1, dt * 1.2);
      bo.rotateY(h); bo.rotateX(0.02 * Math.sin(t * 1.1) * nofl); bo.rotateZ(this.subPitch + 0.015 * Math.sin(t * 0.9) * nofl); }
    else this.subPitch = 0;
    if (ph === 'mue' || ph === 'plongee' || ph === 'remonte') Object.assign(this.orbW, { tx: bo.position.x, tz: bo.position.z, ty: bo.position.y + 1, dist: Math.max(this.orbW.dist, ph === 'mue' ? 24 : 20) });
    // hélice : elle se met à tourner à la fin de la mue, tourne pendant la plongée, ralentit au fond
    if (this.subProp) { const sp = ss(0.84, 1, st), w = C ? 7 : ph === 'fond' ? 2.5 : 7 * sp; this.propW = (this.propW || 0) + (w - (this.propW || 0)) * Math.min(1, dt * 1.2); this.propA = ((this.propA || 0) + this.propW * dt) % (Math.PI * 2000); this.subProp.rotation.x = this.propA; }
    if (this.subSpot) this.subSpot.intensity = kf * 60 * LUXP / 4 * (this.camEau || 0);
    // bulles : derrière le sous-marin pendant la plongée
    if (this.bub) { const A = this.bub.geometry.attributes.position; const moving = !!C && u > 0 && u < 1;
      for (let i = 0; i < 120; i++) { let y = A.getY(i); if (y > -0.2 || y === 0) { if (moving && Math.random() < 0.15) { const bo = this.boat.position; A.setXYZ(i, bo.x + (Math.random() - 0.5) * 2 - Math.cos(b.h) * 5, bo.y + (Math.random() - 0.5), bo.z + (Math.random() - 0.5) * 2 + Math.sin(b.h) * 5); } else A.setY(i, 0); continue; } A.setY(i, y + dt * (0.8 + (i % 5) * 0.15)); A.setX(i, A.getX(i) + Math.sin(t * 3 + i) * dt * 0.2); }
      A.needsUpdate = true; }
    // 3. sous l'eau ?
    this.eau(this.cam.position.y < -0.1 ? 1 : 0, T, t, dt);
  },
  surfaced() { const B = this.srvBerth(); this.subT = 0; this.subMove = 0; this.subRig.visible = false; this.boat.children.forEach((c) => { if (c !== this.subRig) c.visible = true; });
    Object.assign(this.b, { x: B.x, z: B.z, h: B.h, v: 0, turn: 0 }); this.flyTo('serveur'); },
  // bascule de l'ambiance : brouillard bleu-vert, ciel et mer cachés, plafond vu d'en dessous
  eau(on, T, t, dt) {
    if (!on && !this.camEau) return; this.camEau = on; const S = this.scene;
    if (this.fondFx) this.fondFx.visible = !!on; if (this.fondG) this.fondG.visible = !!on || this.srvPh(this.st().phase);
    this.sea.visible = !on; this.sky.visible = !on; if (this.stars) this.stars.visible = !on; if (this.moon) this.moon.visible = !on;
    if (!on) { S.background = null; S.fog.color.copy(this.fogDay); this.sunL.color.set(0xffe2c4); this.sunL.intensity = 1.35 * LUX; this.hemi.color.set(0xcfe0ff); this.hemi.groundColor.set(0x6b5a48); this.hemi.intensity = 0.75 * LUX * (this.hemiBase || 1); return; }
    const deep = new T.Color(0.012, 0.075, 0.095); S.background = deep; S.fog.color.copy(deep); S.fog.near = -10; S.fog.far = 58 + 8 * Math.min(1, -this.cam.position.y / 20);   /* voile dès les premiers mètres */
    this.sunL.color.setRGB(0.5, 0.82, 0.92); this.sunL.intensity = 0.55 * LUX; this.hemi.color.setRGB(0.3, 0.62, 0.72); this.hemi.groundColor.setRGB(0.04, 0.1, 0.1); this.hemi.intensity = 0.4 * LUX * (this.hemiBase || 1);
    if (this.caustM) this.caustM.uniforms.t.value = t; if (this.underM) this.underM.uniforms.t.value = t;
    if (this.rays) this.rays.forEach((r) => { r.children[0].material.opacity = (0.05 + 0.035 * Math.sin(t * 0.4 + r.userData.ph)) * Math.min(1, Math.max(0, (r.position.distanceTo(this.cam.position) - 6) / 10)); r.rotation.z = 0.12 + 0.03 * Math.sin(t * 0.3 + r.userData.ph); });
    if (this.capL) this.capL.forEach((l, i) => { l.intensity = (1.6 + 0.3 * Math.sin(t * 2 + i)) * LUXP / 4; });
    if (this.fish) { const V = this.srvVC(), m = new T.Matrix4(), q = new T.Quaternion(), e = new T.Euler(), sc = new T.Vector3(1.9, 0.7, 0.45), pos = new T.Vector3();
      this.fishP.forEach((f, i) => { const c = f.s ? { x: V.x + 6, y: V.y + 6, z: V.z - 4, R: 9, w: -0.16 } : { x: V.x - 4, y: V.y + 4, z: V.z + 5, R: 13, w: 0.12 }; const a = t * c.w + f.a + Math.sin(t * 0.5 + f.o) * 0.05;
        pos.set(c.x + Math.cos(a) * (c.R + f.r), c.y + f.y + 0.3 * Math.sin(t + f.o), c.z + Math.sin(a) * (c.R + f.r)); e.set(0, -a + (c.w > 0 ? -Math.PI / 2 : Math.PI / 2), 0); q.setFromEuler(e); m.compose(pos, q, sc); this.fish.setMatrixAt(i, m); });
      this.fish.instanceMatrix.needsUpdate = true; }
  }
});
