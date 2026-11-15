/* L'île du serveur : une base flottante (station océanographique) avec son bassin, et au fond un manège de caissons.
   « Plonger » : dans le bassin, Elba se transforme en sous-marin (animation exportée de Blender, jouée en réglant son temps),
   plonge par le fond du bassin et rejoint le manège. On fait tourner le manège : le caisson qui arrive devant s'ouvre,
   ses câbles s'allument vers les caissons qu'il dessert. « Faire surface » ramène Elba au bassin, puis la mue se rejoue à l'envers. */
const PR_FOND = { prof: -20, mue: 9, descente: 15, nfps: 24, nf: 120, swap: 0.37, noir: [0.011, 0.013, 0.015],
  ph: { plat: [0.18, 0.36], couleur: [0.42, 0.68], feux: [0.80, 0.90] } };
// les caissons, dans l'ordre du manège ; liens : les caissons (et « N », le nœud central) que ses câbles desservent
const PR_CAISSONS = [
  { n: 'ACCÈS', s: ['Headscale', 'Authentik', 'Vaultwarden'], t: "Headscale, mon VPN. Authentik donne une connexion unique à Nextcloud, Matrix et Portainer. Vaultwarden garde les mots de passe.", liens: [1, 'N'] },
  { n: 'CLOUD ET MESSAGERIE', s: ['Nextcloud', 'Matrix'], t: 'Mes fichiers et ma messagerie, hébergés chez moi, derrière la connexion unique.', liens: [] },
  { n: 'IA LOCALE', s: ['Ollama'], t: 'Des modèles de langue qui tournent sur ma machine.', liens: [] },
  { n: 'SUPERVISION', s: ['Grafana', 'Uptime Kuma', 'Scrutiny', 'Dozzle'], t: 'Uptime Kuma surveille tous les services. Grafana pour les tableaux de bord, Scrutiny pour la santé des disques, Dozzle pour les journaux.', liens: [0, 1, 2, 4, 'N'] },
  { n: 'SAUVEGARDES', s: ['Kopia'], t: 'Kopia sauvegarde toutes les données Docker.', liens: [0, 1, 2, 3, 'N'] }
];
const PR_ROLES = { Headscale: ['VPN', 'Mon VPN : on entre par lui.'], Authentik: ['connexion unique', 'Une seule connexion pour Nextcloud, Matrix et Portainer.'], Vaultwarden: ['mots de passe', 'Le coffre à mots de passe, chez moi.'],
  Nextcloud: ['cloud privé', 'Mes fichiers, derrière la connexion unique.'], Matrix: ['messagerie', 'Ma messagerie, derrière la connexion unique.'], Ollama: ['IA locale', 'Des modèles de langue qui tournent sur ma machine.'],
  Grafana: ['tableaux de bord', "Les tableaux de bord de la machine."], 'Uptime Kuma': ['disponibilité', 'Surveille tous les services.'], Scrutiny: ['santé des disques', 'Suit la santé de chaque disque.'], Dozzle: ['journaux', 'Les journaux de tous les conteneurs, en direct.'],
  Kopia: ['sauvegardes', 'Sauvegarde toutes les données Docker.'] };
const PR_NOEUD = { n: 'PILOTAGE', s: ['Portainer', 'Docker', 'git'], t: 'Le nœud central : Portainer pilote tous les conteneurs. Chaque service est décrit dans un fichier versionné dans git.' };
Object.assign(PR_RADIO, {
  serveur: "Bienvenue à la base. Mon serveur maison est en dessous : ses services tournent dans un manège de caissons, au fond. Clique sur « Plonger » : Elba se transforme en sous-marin dans le bassin.",
  mue: "On rentre les voiles, on ferme tout… Elba devient sous-marin.",
  fond: "Bienvenue au fond. Fais tourner le manège avec les flèches : le caisson qui arrive devant s'ouvre et montre les services qu'il contient. Les câbles qui s'allument montrent ce qu'il dessert.",
  surface: "On remonte au bassin. Elba reprend sa forme de voilier."
});
Object.assign(Component.prototype, {
  srvPh(ph) { return ph === 'mue' || ph === 'plongee' || ph === 'fond' || ph === 'remonte'; },
  srvBO() { const I = PR_ISLES.serveur; return { x: I.x, z: I.z }; },                                  // centre du bassin
  srvBerth() { const O = this.srvBO(); return { x: O.x - 2, z: O.z, h: 0 }; },                          // dans le bassin, nez vers le bloc nord
  srvApp(B) { return [{ x: B.x - 60, z: B.z }, { x: B.x - 26, z: B.z }]; },                            // on entre par l'ouverture du bassin
  srvVC() { const O = this.srvBO(); return { x: O.x + 4, y: PR_FOND.prof, z: O.z + 20 }; },             // centre du manège
  srvEnd() { const V = this.srvVC(); return { x: V.x + 18, y: -10, z: V.z + 1 }; },                    // le sous-marin en attente, sur le côté du manège, hors du champ principal
  // la base : ses coques, son bloc nord (pour les collisions de la barre à la main)
  basePen(x, z) { const O = this.srvBO(), lx = x - O.x, lz = z - O.z, m = 1.4; let p = -1e9;
    for (const [x0, x1, z0, z1] of [[-26, 26, -15, -7], [-26, 26, 7, 15], [16, 26, -15, 15]]) p = Math.max(p, Math.min(lx - x0, x1 - lx, lz - z0, z1 - lz) + m); return p; },
  // ---------- chargement : la base dès le départ (on la voit de l'archipel), le reste à l'approche
  loadBase() {
    if (this.baseLoading) return; this.baseLoading = true; const T = window.THREE, L = new T.GLTFLoader(), O = this.srvBO();
    L.load('assets/base.glb', (g) => { const b = g.scene; b.position.set(O.x, 0, O.z); const G = this.isleG && this.isleG.serveur; (G || this.scene).add(b); this.baseG = b; this.renduOmbres(T, b);
      b.traverse((o) => { if (o.isMesh && o.material && /^Projo|^FeuRouge|^FeuVert/.test(o.material.name || '')) o.material.toneMapped = true; }); });
  },
  loadFond() {
    if (this.fondLoading) return; this.fondLoading = true; const T = window.THREE, L = new T.GLTFLoader(); if (T.MeshoptDecoder) L.setMeshoptDecoder(T.MeshoptDecoder);
    const V = this.srvVC();
    L.load('assets/manege.glb', (g) => {
      const root = g.scene; root.position.set(V.x, V.y, V.z); root.rotation.y = Math.PI;   /* le caisson de devant regarde la base (au nord) */ this.scene.add(root); this.fondG = root; root.visible = false; this.renduOmbres(T, root);
      this.manT = root.getObjectByName('Tournant'); this.manCap = []; this.manRid = []; this.manReg = []; this.manLia = [];
      for (let i = 0; i < 5; i++) { const c = root.getObjectByName('Caisson' + i); this.manCap.push(c); let rid = null, reg = null; c.children.forEach((o) => { if (/^Rideau/.test(o.name)) rid = o; if (/^Reglette/.test(o.name)) reg = o; });
        this.manRid.push(rid); if (reg && reg.isMesh) { reg.material = reg.material.clone(); reg.material.emissive.setRGB(0.9, 0.95, 1); } this.manReg.push(reg);
        const li = root.getObjectByName('Liaison' + i); if (li && li.isMesh) { li.material = li.material.clone(); li.material.emissive = new T.Color(0.3, 0.85, 1); li.material.emissiveIntensity = 0; } this.manLia.push(li); }
      this.manCour = null; root.traverse((o) => { if (o.isMesh && o.material && o.material.name === 'Couronne' && !this.manCour) { o.material = o.material.clone(); this.manCour = o.material; o.material.userData.e0 = o.material.emissiveIntensity || 1; } });
      this.manLed = []; root.traverse((o) => { if (o.isMesh && o.material && /^Led/.test(o.material.name) && !this.manLed.includes(o.material)) this.manLed.push(o.material); });
      this.manIdx = 0; this.manA = 0; this.manOpen = [0, 0, 0, 0, 0]; this.manNode = false;
      // lumière de l'intérieur du caisson de devant, et impulsions le long des câbles
      this.manLight = new T.PointLight(0xdbeaff, 0, 10, 1); this.manLight.position.set(V.x, V.y + 2.7, V.z - 9.0); this.scene.add(this.manLight);
      this.manGlow = []; for (let i = 0; i < 5; i++) { const l = new T.PointLight(0x55d0ff, 0, 7, 1.2); root.add(l); this.manGlow.push(l); }   /* lueur des caissons desservis */
      const pm = new T.MeshBasicMaterial({ color: new T.Color(0.55, 1.0, 1.0), toneMapped: false, fog: false });   /* lumineuses : le brouillard ne les éteint pas */ this.manPul = [];
      for (let i = 0; i < 30; i++) { const s = new T.Mesh(new T.SphereGeometry(0.26, 12, 8), pm); s.visible = false; root.add(s); this.manPul.push(s); }
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
      const sp = new T.SpotLight(0xd8f2ff, 0, 45, 0.5, 0.6, 1.2); sp.position.set(4.3, 0.12, 0); const tg = new T.Object3D(); tg.position.set(12, -1.5, 0); rig.add(sp); rig.add(tg); sp.target = tg; this.subSpot = sp;
    });
  },
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
  },
  // ---------- les gestes
  // ---------- les gestes
  plonger() {
    if (!this.subRig || !this.fondG) { this.loadFond(); this.say('Un instant, je prépare la plongée…'); clearTimeout(this.plongeT); this.plongeT = setTimeout(() => this.plonger(), 800); return; }
    this.say(PR_RADIO.mue, 'LOUIS-MARIE · LE SERVEUR'); this.subT = this.subT || 0; this.subDir = 1; this.subMove = 0; this.manNode = false;
    this.subRig.visible = true; this.boat.children.forEach((c) => { if (c !== this.subRig) c.visible = false; });
    const b = this.b; Object.assign(this.orbW, { tx: b.x, tz: b.z, ty: 1, dist: 32, pitch: 0.5, yaw: -Math.PI / 2 + 0.35 });   // de haut, depuis l'entrée du bassin
    this.setState({ phase: 'mue', panel: null });
  },
  faireSurface() { this.manNode = false; this.subDir = -1; this.subUp = 0; this.setState({ phase: 'remonte', panel: null }); this.say(PR_RADIO.surface, 'LOUIS-MARIE · LE SERVEUR'); },
  // le manège : un cran à gauche ou à droite, ou directement un caisson
  manGo(i) { if (!this.manCap) return; this.manIdx = ((i % 5) + 5) % 5; this.manNode = false; this.camKey = null; },
  manStep(d) { this.manGo((this.manIdx || 0) + d); },
  manNodeOn() { this.manNode = true; const P = PR_NOEUD, V = this.srvVC(); Object.assign(this.orbW, { tx: V.x, tz: V.z, ty: V.y + 4, dist: 26, pitch: 0.35 }); this.say(P.n + ' : ' + P.t, 'LOUIS-MARIE · LE NŒUD CENTRAL'); },
  fondOverview() { const V = this.srvVC(); Object.assign(this.orbW, { tx: V.x, tz: V.z - 9.4, ty: V.y + 2.4, dist: 15, pitch: 0.24, yaw: Math.PI + 0.22 }); },
  fondHit(cx, cy) { if (!this.fondG) return null; const T = window.THREE, r = this.renderer.domElement.getBoundingClientRect(), rc = new T.Raycaster(); rc.setFromCamera(new T.Vector2(((cx - r.left) / r.width) * 2 - 1, -((cy - r.top) / r.height) * 2 + 1), this.cam);
    const h = rc.intersectObject(this.fondG, true); for (const x of h) { let o = x.object; while (o && o !== this.fondG) { const m = /^Caisson(\d)$/.exec(o.name); if (m) return +m[1]; if (/^(Tour|DomeTour|PlaqueTour|GravureTour|HublotTour)/.test(o.name)) return 'N'; o = o.parent; } } return null; },
  fondClick(cx, cy) { const k = this.fondHit(cx, cy); if (k === 'N') this.manNodeOn(); else if (k != null) this.manGo(k); },
  // le manège à chaque image : on ferme, on tourne, on s'arrête, on ouvre ; les câbles du caisson ouvert s'allument
  manStepFrame(T, t, dt, ph) {
    if (!this.manT) return; const ss = (a, b, x) => { x = Math.max(0, Math.min(1, (x - a) / (b - a))); return x * x * x * (x * (6 * x - 15) + 10); };
    const tau = Math.PI * 2, want = -this.manIdx * tau / 5; let d = want - this.manA; while (d > Math.PI) d -= tau; while (d < -Math.PI) d += tau;
    const closed = this.manOpen.every((k, i) => i === this.manIdx || k < 0.02);
    if (closed && Math.abs(d) > 1e-4) { const v = Math.sign(d) * Math.min(Math.abs(d), dt * (0.25 + Math.abs(d) * 1.6)); this.manA += v; }   // ralentit en arrivant au cran
    this.manT.rotation.y = this.manA;
    const front = Math.abs(d) < 0.01 && ph === 'fond';
    for (let i = 0; i < 5; i++) { const tgt = front && i === this.manIdx && !this.manNode ? 1 : 0; this.manOpen[i] += Math.max(-dt / 0.9, Math.min(dt / 1.3, tgt - this.manOpen[i]));
      const k = ss(0, 1, this.manOpen[i]); if (this.manRid[i]) this.manRid[i].rotation.x = -118 * Math.PI / 180 * k; if (this.manReg[i]) this.manReg[i].material.emissiveIntensity = 6 * k; }
    const ko = ss(0, 1, this.manOpen[this.manIdx]); this.manLight.intensity = ko * 14 * LUXP / 4 * (this.camEau || 0);
    // fiche du caisson ouvert
    const P = PR_CAISSONS[this.manIdx], panelK = ko > 0.6 ? this.manIdx : null;
    if (!this.manNode && this.panelK !== panelK) { this.panelK = panelK; this.tiroirSel = null; if (panelK != null) this.say(P.n + ' : ' + P.t, 'LOUIS-MARIE · CAISSON ' + (panelK + 1) + ' / 5'); }
    // la caméra entre dans le caisson ouvert, et recule quand le manège tourne
    if (ph === 'fond' && !this.manNode) { const inn = ko > 0.25, key = (inn ? 'in' : 'out') + this.manIdx;
      if (this.camKey !== key) { this.camKey = key; const V = this.srvVC(); Object.assign(this.orbW, inn ? { tx: V.x, tz: V.z - 9.0, ty: V.y + 2.35, dist: 6.2, pitch: 0.1 } : { tx: V.x, tz: V.z - 9.4, ty: V.y + 2.4, dist: 15, pitch: 0.24 }); } }   /* une consigne par changement : la caméra reste libre */
    this.tiroirsStep(T, ph === 'fond' && !this.manNode && ko > 0.7 ? this.manIdx : null, dt);
    if (this.manNode) this.panelK = 'N';
    // câbles et impulsions : depuis le caisson ouvert vers le nœud, puis vers les caissons desservis
    const src = this.manNode ? 'N' : this.manIdx, liens = this.manNode ? [0, 1, 2, 3, 4] : P.liens, kl = this.manNode ? 1 : ko;
    for (let i = 0; i < 5; i++) { const on = (i === src && liens.length) || liens.includes(i); if (this.manLia[i]) this.manLia[i].material.emissiveIntensity += ((on ? 3.2 * kl : 0) - this.manLia[i].material.emissiveIntensity) * Math.min(1, dt * 4); }
    const ang = (i) => -Math.PI / 2 + i * tau / 5, R0 = 9.4 - 1.7, R1 = 2.4, y = 1.05, pt = (i, r) => { const a = ang(i); return new T.Vector3(Math.cos(a) * r, y, -Math.sin(a) * r); };
    // les impulsions passent par le haut, là où on les voit : montée le long de la suspente, la couronne, descente sur le caisson desservi
    const tg = liens.filter((x) => x !== 'N'); let n = 0; const RC = 9.4, yc = 6.4, yt = 4.1;
    const arc = (a0, a1, f) => { let d2 = a1 - a0; while (d2 > Math.PI) d2 -= tau; while (d2 < -Math.PI) d2 += tau; const a = a0 + d2 * f; return new T.Vector3(Math.cos(a) * RC, yc, -Math.sin(a) * RC); };
    if (kl > 0.3 && liens.length) tg.forEach((j, q) => { for (let m = 0; m < 3 && n < this.manPul.length; m++) { const s = (t * 0.32 + m / 3 + q * 0.11) % 1, p = this.manPul[n++]; p.visible = true;
        const a0 = src === 'N' ? ang(j) : ang(src), a1 = ang(j); let v3;
        if (s < 0.18) { v3 = new T.Vector3(Math.cos(a0) * RC, yt + (yc - yt) * s / 0.18, -Math.sin(a0) * RC); if (src === 'N') v3 = new T.Vector3(Math.cos(a0) * 2.2 * (1 - s / 0.18) + Math.cos(a0) * RC * s / 0.18, 7.0 - 0.6 * s / 0.18, -Math.sin(a0) * (2.2 * (1 - s / 0.18) + RC * s / 0.18)); }
        else if (s < 0.82) v3 = arc(a0, a1, (s - 0.18) / 0.64);
        else v3 = new T.Vector3(Math.cos(a1) * RC, yc - (yc - yt) * (s - 0.82) / 0.18, -Math.sin(a1) * RC);
        p.position.copy(v3).applyAxisAngle(new T.Vector3(0, 1, 0), this.manA); p.scale.setScalar(0.8 + 0.5 * kl); } });
    if (this.manCour) this.manCour.emissiveIntensity = this.manCour.userData.e0 * (1 + 3 * (liens.length ? kl : 0));
    for (; n < this.manPul.length; n++) this.manPul[n].visible = false;
    if (this.manGlow) this.manGlow.forEach((l, i) => { const on = tg.includes(i) && kl > 0.3; l.position.copy(pt(i, 9.4)).setY(2.4).applyAxisAngle(new T.Vector3(0, 1, 0), this.manA); l.intensity += ((on ? (2.2 + 0.6 * Math.sin(t * 3 + i)) * LUXP / 4 * (this.camEau || 0) : 0) - l.intensity) * Math.min(1, dt * 4); });
    if (this.manLed) this.manLed.forEach((m, i) => { m.emissiveIntensity = (Math.sin(t * (3 + i) + i) > -0.6 ? 1 : 0.15) * (m.userData.e0 || (m.userData.e0 = m.emissiveIntensity || 1)); });
  },
  // étiquettes nettes accrochées aux tiroirs du caisson ouvert ; un clic fait coulisser le tiroir et dit ce que j'ai configuré
  tiroirsStep(T, idx, dt) {
    if (!this.tirLbl) this.tirLbl = [];
    if (idx == null) { this.tirLbl.forEach((e) => { e.el.style.display = 'none'; }); this.tirLblIdx = null; this.tiroirPull(T, null, dt); return; }
    const P = PR_CAISSONS[idx], n = P.s.length, cap = this.manCap[idx];
    if (this.tirLblIdx !== idx) { this.tirLblIdx = idx; this.tirLbl.forEach((e) => e.el.remove()); this.tirLbl = [];
      const w = Math.min(1.5, (7 - 1.6) / n - 0.15);
      P.s.forEach((sv, j) => { const x = -(n - 1) * (w + 0.15) / 2 + j * (w + 0.15); const el = document.createElement('button'); el.className = 'tiroir-lbl'; const R = PR_ROLES[sv] || [sv, ''];
        el.innerHTML = '<b></b><small></small><span></span>'; el.querySelector('b').textContent = sv; el.querySelector('small').textContent = R[0]; el.querySelector('span').textContent = R[1];
        el.onclick = (e) => { e.stopPropagation(); this.tiroirSel = this.tiroirSel === j ? null : j; this.say(sv + ' : ' + R[1], 'LOUIS-MARIE · ' + P.n); };
        el.addEventListener('wheel', (e) => { e.preventDefault(); this.renderer.domElement.dispatchEvent(new WheelEvent('wheel', e)); }, { passive: false });
        this.layer.appendChild(el); this.tirLbl.push({ el, x, j }); }); }
    const Wd = this.host.clientWidth, Hd = this.host.clientHeight, v = new T.Vector3();
    this.tirLbl.forEach((L) => { v.set(L.x, 0.62, -0.25 - (this.tiroirSel === L.j ? 0.35 : 0)); cap.localToWorld(v); v.project(this.cam);
      if (v.z > 1) { L.el.style.display = 'none'; return; } L.el.style.display = 'block'; L.el.style.left = ((v.x + 1) / 2 * Wd) + 'px'; L.el.style.top = ((1 - v.y) / 2 * Hd) + 'px'; L.el.classList.toggle('sel', this.tiroirSel === L.j); });
    this.tiroirPull(T, this.tiroirSel != null ? { cap, x: this.tirLbl[this.tiroirSel] ? this.tirLbl[this.tiroirSel].x : 0, w: Math.min(1.5, (7 - 1.6) / n - 0.15) } : null, dt);
  },
  // le tiroir choisi sort de 35 cm (rangée du haut : tiroir, étiquette, nom, voyant, poignée)
  tiroirPull(T, S, dt) {
    if (!this.manCap) return; const k0 = this.pullK || 0; this.pullK = k0 + ((S ? 1 : 0) - k0) * Math.min(1, dt * 5);
    if (S && (!this.pullObjs || this.pullCap !== S.cap || this.pullX !== S.x)) { if (this.pullObjs) this.pullObjs.forEach(([o, z0]) => { o.position.z = z0; });
      this.pullCap = S.cap; this.pullX = S.x; this.pullK = 0; this.pullObjs = [];
      S.cap.children.forEach((o) => { const p = o.position; if (Math.abs(p.x - S.x) < S.w / 2 + 0.05 && p.y > 0.12 && p.y < 0.8 && p.z > -0.62 && p.z < -0.15 && /^(Tiroir|Etiquette|Nom|Led|Poignee)/.test(o.name)) this.pullObjs.push([o, p.z]); }); }
    if (this.pullObjs) this.pullObjs.forEach(([o, z0]) => { o.position.z = z0 + 0.35 * this.pullK; });
    if (!S && this.pullK < 0.01 && this.pullObjs) { this.pullObjs.forEach(([o, z0]) => { o.position.z = z0; }); this.pullObjs = null; }
  },
  // les routes, toutes faites de courbes de Bézier : le sous-marin part et arrive à vitesse nulle, son cap et son assiette ne sautent pas.
  // Plongée : tout droit dans le bassin, on descend par le fond du bassin, on passe sous la coque et on vient se ranger à gauche du manège, nez à l'est.
  diveCurve() { if (this.diveC) return this.diveC; const T = window.THREE, B = this.srvBerth(), E = this.srvEnd(), v = (x, y, z) => new T.Vector3(x, y, z), M = v(B.x + 12, -8, B.z);
    const P = new T.CurvePath(); P.add(new T.CubicBezierCurve3(v(B.x, 0, B.z), v(B.x + 7, -0.3, B.z), v(B.x + 11, -3, B.z), M));
    P.add(new T.CubicBezierCurve3(M, v(M.x + 1.6, -10.5, M.z), v(E.x - 7, E.y, E.z), v(E.x, E.y, E.z))); this.diveC = P; return P; },
  // Remontée : on file vers l'est au-dessus du manège, on revient sous le bloc nord, et on remonte dans le bassin, nez vers la sortie.
  upCurve() { if (this.upC) return this.upC; const T = window.THREE, B = this.srvBerth(), E = this.srvEnd(), O = this.srvBO(), v = (x, y, z) => new T.Vector3(x, y, z), N = v(O.x + 24, -8, O.z);
    const P = new T.CurvePath(); P.add(new T.CubicBezierCurve3(v(E.x, E.y, E.z), v(E.x + 14, E.y + 0.5, E.z), v(N.x + 10, N.y, N.z), N));
    P.add(new T.CubicBezierCurve3(N, v(N.x - 8, N.y, N.z), v(B.x + 10, -1.5, B.z), v(B.x, 0, B.z))); this.upC = P; return P; },
  fondStep(T, t, dt, ph) {
    const I = PR_ISLES.serveur; if (!this.baseLoading && this.isleG) this.loadBase();
    if (!this.fondLoading && (this.isleK === 'serveur' || this.sailDest === 'serveur' || this.transitK === 'serveur' || Math.hypot(this.b.x - I.x, this.b.z - I.z) < 260)) this.loadFond();
    const sub = this.srvPh(ph);
    if (!sub) { if (this.subRig && this.subRig.visible) { this.subRig.visible = false; this.subT = 0; this.subMove = 0; if (this.boat) this.boat.children.forEach((c) => { if (c !== this.subRig) c.visible = true; }); } this.eau(0); return; }
    if (!this.subRig) return;
    this.manStepFrame(T, t, dt, ph);
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
    if (C) { u = Math.min(0.9999, Math.max(0, u));   /* une courbe en deux tronçons ne renvoie rien à 1 exactement (arrondi) */
      const p = C.getPointAt(u), tg = C.getTangentAt(Math.min(0.999, Math.max(0.001, u)));
      const nofl = 1 - fade, bobY = (0.05 * Math.sin(t * 1.3) - 0.05) * nofl;
      bo.position.set(p.x, p.y + bobY + this.hovA * Math.sin(t * 0.6), p.z); bo.rotation.set(0, 0, 0);
      // le cap suit la trajectoire en douceur (et ne bouge pas quand on descend presque à la verticale)
      const hz = Math.hypot(tg.x, tg.z); let h = b.h; if (hz > 0.05) { let dh = Math.atan2(-tg.z, tg.x) - h; while (dh > Math.PI) dh -= 2 * Math.PI; while (dh < -Math.PI) dh += 2 * Math.PI; h += dh * Math.min(1, dt * 4 * Math.min(1, hz / 0.3)); }
      b.x = p.x; b.z = p.z; b.h = h;
      const want = Math.asin(Math.max(-0.4, Math.min(0.4, tg.y))) * fade; this.subPitch = (this.subPitch || 0) + (want - (this.subPitch || 0)) * Math.min(1, dt * 1.2);
      bo.rotateY(h); bo.rotateX(0.02 * Math.sin(t * 1.1) * nofl); bo.rotateZ(this.subPitch + 0.015 * Math.sin(t * 0.9) * nofl); }
    else this.subPitch = (this.subPitch || 0) * Math.max(0, 1 - dt * 2);
    if (ph === 'mue' || (ph === 'plongee' && this.subMove < 1) || ph === 'remonte') Object.assign(this.orbW, { tx: bo.position.x, tz: bo.position.z, ty: bo.position.y + 1 });   /* la cible suit le sous-marin (arrivé au fond, le manège prend la main) ; angle et distance restent libres */
    // la caméra ne passe jamais derrière la base : à la fin de la mue elle descend à l'entrée du bassin (côté large, entre les deux étraves),
    // passe sous l'eau et regarde le sous-marin sortir du bassin par en dessous ; puis elle tourne vers le manège en le suivant
    // (des consignes données une seule fois : la caméra s'y rend en douceur, et reste libre entre deux)
    const cue = (k, o) => { if (!this.camCues) this.camCues = {}; if (!this.camCues[k]) { this.camCues[k] = 1; Object.assign(this.orbW, o); } };
    if (ph === 'mue' && st > 0.72) cue('mue-bas', { yaw: -Math.PI / 2, pitch: 0.1, dist: 24 });
    if (ph === 'plongee' && this.subMove > 0.02) cue('sous-bassin', { yaw: -Math.PI / 2, pitch: -0.32, dist: 24 });
    if (ph === 'plongee' && this.subMove > 0.5) cue('vers-manege', { yaw: Math.PI + 0.22, pitch: 0.24, dist: 18 });
    // la remontée, en miroir : on suit le sous-marin, on le regarde remonter dans le bassin par en dessous, on ressort de l'eau à l'entrée du bassin
    if (ph === 'remonte' && this.subUp > 0.01) cue('rem-suivi', { dist: 22, pitch: 0.2 });
    if (ph === 'remonte' && this.subUp > 0.6) cue('rem-sous-bassin', { yaw: -Math.PI / 2, pitch: -0.3, dist: 24 });
    if (ph === 'remonte' && this.subUp > 0.95) cue('rem-surface', { yaw: -Math.PI / 2, pitch: 0.14, dist: 24 });
    if (ph === 'remonte' && this.subUp >= 1 && st < 0.8) cue('rem-haut', { pitch: 0.48, dist: 30 });
    if (ph === 'fond' || ph === 'escale') this.camCues = null;
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
  surfaced() { this.subT = 0; this.subMove = 0; this.subRig.visible = false; this.boat.children.forEach((c) => { if (c !== this.subRig) c.visible = true; });
    const B = this.srvBerth(); Object.assign(this.b, { x: B.x, z: B.z, v: 0, turn: 0 }); this.flyTo('serveur', true); },
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
      this.fishP.forEach((f, i) => { const c = f.s ? { x: V.x + 4, y: V.y + 10, z: V.z - 6, R: 18, w: -0.12 } : { x: V.x - 6, y: V.y + 8.5, z: V.z + 4, R: 22, w: 0.09 }; const a = t * c.w + f.a + Math.sin(t * 0.5 + f.o) * 0.05;
        pos.set(c.x + Math.cos(a) * (c.R + f.r), c.y + f.y + 0.3 * Math.sin(t + f.o), c.z + Math.sin(a) * (c.R + f.r)); e.set(0, -a + (c.w > 0 ? -Math.PI / 2 : Math.PI / 2), 0); q.setFromEuler(e); m.compose(pos, q, sc); this.fish.setMatrixAt(i, m); });
      this.fish.instanceMatrix.needsUpdate = true; }
  }
});
