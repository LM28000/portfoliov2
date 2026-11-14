/* L'archipel : vue aérienne d'arrivée, une île par projet (Insula, Carte vivante, le serveur), survol au clic. */
const PR_ISLES = {
  insula: { n: 1, name: 'Insula', to: 'Insula', line: 'Choisir où acheter, entre amis', x: 4, z: -2, top: 40 },
  cartevivante: { n: 2, name: 'Carte vivante', to: 'la Carte vivante', line: 'La France en direct : trains, avions, météo', x: -190, z: 0, rx: 46, rz: 34, h: 8, s: 1.3, top: 34,
    view: { ty: 8, yaw: 0.12, pitch: 0.5, dist: 95 }, code: 'https://github.com/LM28000/openstreetmap' },
  serveur: { n: 3, name: 'Le serveur', to: 'le serveur', line: 'Mon serveur maison : une trentaine de services', x: 190, z: -24, rx: 40, rz: 30, h: 10, s: 4.1, top: 36,
    view: { ty: 8, yaw: -0.08, pitch: 0.2, dist: 44 } }
};
Object.assign(PR_RADIO, {
  approche2: "Tu vois le petit ponton, au sud de l'île ? Approche doucement, je t'aide à accoster.",
  archipel: "Ici Louis-Marie, bienvenue ! Voici l'archipel : chaque île est un de mes projets. Clique sur une île pour la survoler. Ou embarque à bord d'Elba : tu barres, et je te guide à la radio.",
  cartevivante: "La Carte vivante : la France en 3D et en temps réel. On voit les trains voiture par voiture, les avions, les bateaux, la météo, l'énergie, les séismes. Une frise remonte sept jours en arrière, et tout est rejoué. Derrière, il y a un serveur en Rust qui archive le temps réel, et un site en TypeScript (MapLibre, deck.gl). Elle tourne en permanence sur mon serveur maison, l'île d'en face.",
  serveur: "La salle des machines : un serveur chez moi, sous Debian, avec une trentaine de services dans Docker. Chacun est décrit dans un fichier versionné dans git. Il y a un cloud privé, une IA locale, une messagerie, un VPN, de la supervision, et des sauvegardes chiffrées chaque nuit. C'est lui qui fait tourner la Carte vivante."
});
const PR_SRV_ROWS = [['CLOUD PRIVÉ', 'Nextcloud · webmail · wiki'], ['IA LOCALE', 'Ollama · n8n · Qdrant'], ['MESSAGERIE', 'Matrix (Synapse, Element)'], ['ACCÈS', 'VPN Headscale · SSO Authelia'], ['SUPERVISION', 'Grafana · Prometheus · Uptime Kuma'], ['SAUVEGARDES', 'Kopia chiffré · dumps SQL · SnapRAID'], ['CARTE VIVANTE', 'tourne ici, 24 h sur 24']];
Object.assign(Component.prototype, {
  orbitPh(ph) { return ph === 'accoste' || ph === 'nuit' || ph === 'archipel' || ph === 'escale' || ph === 'transit'; },
  // limite du déplacement (clic droit) selon l'endroit
  clampPan(tx, tz) { const ph = this.st().phase; let c = { x: 0, z: 0, rx: 85, rz: 55 };
    if (ph === 'archipel') c = { x: 0, z: 10, rx: 380, rz: 260 }; else if (ph === 'escale') { const I = PR_ISLES[this.isleK]; c = { x: I.x, z: I.z, rx: 80, rz: 60 }; }
    const rr = Math.hypot((tx - c.x) / c.rx, (tz - c.z) / c.rz); if (rr > 1) { tx = c.x + (tx - c.x) / rr; tz = c.z + (tz - c.z) / rr; } return [tx, tz]; },
  distLim(ph) { return ph === 'archipel' ? [300, 1300] : ph === 'escale' ? [18, 260] : [10, 220]; },
  isleH(I, x, z) { const lx = x - I.x, lz = z - I.z, r = Math.hypot(lx / I.rx, lz / I.rz); const n = Math.sin(lx * 0.11 + I.s) * Math.cos(lz * 0.13 + I.s * 2) * 0.6 + Math.sin(lx * 0.05 - lz * 0.07 + I.s) * 0.4;
    if (r >= 1) return 0.6 - (r - 1) * 16; let y = I.h * Math.pow(1 - r * r, 0.7) * (0.82 + 0.18 * n) + 0.6; const flat = I.h * 0.72; if (r < 0.42) y = flat + (y - flat) * Math.pow(r / 0.42, 3) * 0.2; return y; },
  buildIsles(T) {
    this.isleG = {}; const tl = new T.TextureLoader();
    const sand = new T.Color(0xcdb994), grass = new T.Color(0x6f8a4a), grass2 = new T.Color(0x8c9a58), rock = new T.Color(0x857b70);
    const wood = new T.MeshStandardMaterial({ color: new T.Color(0x3b2a1c).convertSRGBToLinear(), roughness: 0.8 });
    ['cartevivante', 'serveur'].forEach((k) => {
      const I = PR_ISLES[k]; const g = new T.Group(); g.userData.isle = k; this.isleG[k] = g; this.scene.add(g);
      const geo = new T.PlaneGeometry(I.rx * 2.5, I.rz * 2.5, 90, 70); geo.rotateX(-Math.PI / 2); const pa = geo.attributes.position;
      for (let i = 0; i < pa.count; i++) pa.setY(i, this.isleH(I, I.x + pa.getX(i), I.z + pa.getZ(i)));
      geo.computeVertexNormals(); const nor = geo.attributes.normal, col = new Float32Array(pa.count * 3), c = new T.Color();
      for (let i = 0; i < pa.count; i++) { const y = pa.getY(i), ny = nor.getY(i); if (y < 1.1) c.copy(sand); else c.copy(grass).lerp(grass2, Math.min(1, Math.max(0, (y - 3) / 8))); if (k === 'serveur') c.lerp(rock, 0.35); if (ny < 0.75) c.lerp(rock, Math.min(1, (0.75 - ny) * 4)); c.convertSRGBToLinear(); col[3 * i] = c.r; col[3 * i + 1] = c.g; col[3 * i + 2] = c.b; }
      geo.setAttribute('color', new T.BufferAttribute(col, 3));
      const land = new T.Mesh(geo, new T.MeshStandardMaterial({ vertexColors: true, roughness: 0.95 })); land.position.set(I.x, 0, I.z); g.add(land);
      // quelques pins, loin du centre
      if (this.treeMats) { let seed = I.s * 1000; const rnd = () => { seed = (seed * 9301 + 49297) % 233280; return seed / 233280; };
        for (let i = 0; i < 26; i++) { const a = rnd() * Math.PI * 2, r = 0.5 + rnd() * 0.36; const x = I.x + Math.cos(a) * I.rx * r, z = I.z + Math.sin(a) * I.rz * r; if (Math.sin(a) > (k === 'serveur' ? -0.1 : 0.35)) continue; const kk = 1 + Math.floor(rnd() * 3), [, w, h, z0] = PR_TREE_IMG[kk], s = 0.55 + rnd() * 0.35, y = this.isleH(I, x, z);
          for (let j = 0; j < 2; j++) { const m = new T.Mesh(new T.PlaneGeometry(w, h), this.treeMats[kk]); m.position.set(x, y + (z0 + h / 2) * s, z); m.scale.setScalar(s); m.rotation.y = a + j * Math.PI / 2; g.add(m); } } }
      const top = this.isleH(I, I.x, I.z);
      if (k === 'cartevivante') {
        // grand écran incliné : la vraie carte, deux vues qui alternent
        const W = 36, H = W / 1.6; const scr = new T.Group(); scr.position.set(I.x, top + 1.5, I.z - 2); scr.rotation.x = -0.55;
        this.cvTex = [1, 2].map((n) => { const t = tl.load('assets/carte-vivante-' + n + '.jpg'); t.colorSpace = T.SRGBColorSpace; t.anisotropy = 4; return t; });
        const fr = new T.Mesh(new T.BoxGeometry(W + 1, H + 1, 0.5), new T.MeshStandardMaterial({ color: 0x151a22, roughness: 0.5 })); fr.position.y = H / 2; scr.add(fr);
        const pl = new T.Mesh(new T.PlaneGeometry(W, H), new T.MeshBasicMaterial({ map: this.cvTex[0], toneMapped: false })); pl.position.set(0, H / 2, 0.27); scr.add(pl); this.cvScreen = pl; g.add(scr);
        for (const sx of [-W / 2 + 2, W / 2 - 2]) { const post = new T.Mesh(new T.BoxGeometry(0.6, 9, 0.6), wood); post.position.set(I.x + sx, top + 3, I.z - 2 - 6); g.add(post); }
        // une voie ferrée en boucle et un train qui y roule
        const pts = []; for (let i = 0; i < 64; i++) { const a = i / 64 * Math.PI * 2, x = I.x + Math.cos(a) * I.rx * 0.66, z = I.z + Math.sin(a) * I.rz * 0.64; pts.push(new T.Vector3(x, this.isleH(I, x, z) + 0.4, z)); }
        const curve = new T.CatmullRomCurve3(pts, true, 'centripetal'); this.cvRail = curve;
        g.add(new T.Mesh(new T.TubeGeometry(curve, 256, 0.45, 5, true), new T.MeshStandardMaterial({ color: 0x4a3c30, roughness: 0.9 })));
        const white = new T.MeshStandardMaterial({ color: 0xf2f2f0, roughness: 0.5 }), red = new T.MeshStandardMaterial({ color: new T.Color(0xb4412e).convertSRGBToLinear(), roughness: 0.5 });
        this.cvTrain = []; for (let i = 0; i < 5; i++) { const car = new T.Group(); const body = new T.Mesh(new T.BoxGeometry(2.6, 2.4, 6.2), i === 0 ? red : white); body.position.y = 1.5; car.add(body); const stripe = new T.Mesh(new T.BoxGeometry(2.65, 0.5, 6.25), i === 0 ? white : red); stripe.position.y = 1.1; car.add(stripe); g.add(car); this.cvTrain.push(car); }
        // un avion qui tourne au-dessus
        const plane = new T.Group(); const fus = new T.Mesh(new T.CylinderGeometry(0.7, 0.5, 9, 10), white); fus.rotation.x = Math.PI / 2; plane.add(fus); const wing = new T.Mesh(new T.BoxGeometry(11, 0.2, 1.8), white); plane.add(wing); const tail = new T.Mesh(new T.BoxGeometry(0.2, 2, 1.4), red); tail.position.set(0, 1, -4); plane.add(tail); g.add(plane); this.cvPlane = plane;
      } else {
        // la salle des machines : un bâtiment, sa façade-baie, ses voyants
        const bw = 26, bh = 12, bd = 14, by = top; const conc = new T.MeshStandardMaterial({ color: new T.Color(0xb9b6ae).convertSRGBToLinear(), roughness: 0.9 });
        const bld = new T.Mesh(new T.BoxGeometry(bw, bh, bd), conc); bld.position.set(I.x, by + bh / 2, I.z - 3); g.add(bld);
        const base = new T.Mesh(new T.BoxGeometry(bw + 6, 1.2, bd + 8), new T.MeshStandardMaterial({ color: new T.Color(0x8f8a80).convertSRGBToLinear(), roughness: 1 })); base.position.set(I.x, by, I.z - 1); g.add(base);
        for (let i = 0; i < 4; i++) { const ac = new T.Mesh(new T.BoxGeometry(3.2, 1.6, 3.2), new T.MeshStandardMaterial({ color: 0x8d9096, metalness: 0.4, roughness: 0.5 })); ac.position.set(I.x - 8 + i * 5.3, by + bh + 0.8, I.z - 6); g.add(ac); }
        const cv = document.createElement('canvas'); cv.width = 1040; cv.height = 400; const x = cv.getContext('2d');
        x.fillStyle = '#0d131c'; x.fillRect(0, 0, 1040, 400); x.fillStyle = '#FFC94A'; x.font = '700 30px JetBrains Mono, monospace'; x.fillText('LA SALLE DES MACHINES', 34, 52);
        x.fillStyle = '#9fb0c4'; x.font = '400 22px Inter, sans-serif'; x.fillText('Debian 13 · Xeon 6 cœurs · 8 disques · ~30 services Docker, versionnés dans git', 34, 380);
        this.srvLeds = [];
        PR_SRV_ROWS.forEach(([a, b], i) => { const y = 92 + i * 40; x.fillStyle = '#1a2330'; x.fillRect(24, y - 28, 992, 34); x.fillStyle = '#7FE6FF'; x.font = '700 22px JetBrains Mono, monospace'; x.fillText(a, 40, y); x.fillStyle = '#F4EFE6'; x.font = '600 23px Inter, sans-serif'; x.fillText(b, 300, y);
          for (let j = 0; j < 5; j++) { const lx = 860 + j * 30, ly = y - 11; x.fillStyle = '#05080c'; x.beginPath(); x.arc(lx, ly, 8, 0, 7); x.fill(); this.srvLeds.push([lx, ly]); } });
        const tex = new T.CanvasTexture(cv); tex.colorSpace = T.SRGBColorSpace; tex.anisotropy = 4;
        const face = new T.Mesh(new T.PlaneGeometry(bw - 1, (bw - 1) * 400 / 1040), new T.MeshBasicMaterial({ map: tex, toneMapped: false })); const fz = I.z - 3 + bd / 2 + 0.03, fy = by + bh / 2 + 0.3; face.position.set(I.x, fy, fz); g.add(face);
        const fw = bw - 1, fh = fw * 400 / 1040; const im = new T.InstancedMesh(new T.CircleGeometry(fw / 1040 * 8, 10), new T.MeshBasicMaterial({ toneMapped: false }), this.srvLeds.length); const m4 = new T.Matrix4();
        this.srvLeds.forEach(([lx, ly], i) => { m4.makeTranslation(I.x + (lx / 1040 - 0.5) * fw, fy + (0.5 - ly / 400) * fh, fz + 0.02); im.setMatrixAt(i, m4); im.setColorAt(i, new T.Color(0x39ff7a)); });
        g.add(im); this.srvIM = im;
        const mast = new T.Mesh(new T.CylinderGeometry(0.15, 0.3, 14, 6), new T.MeshStandardMaterial({ color: 0xdddddd, metalness: 0.6 })); mast.position.set(I.x + 10, by + bh + 7, I.z - 8); g.add(mast);
        this.srvBeacon = new T.Mesh(new T.SphereGeometry(0.6, 12, 8), new T.MeshBasicMaterial({ color: 0xff3a2a, toneMapped: false })); this.srvBeacon.position.set(I.x + 10, by + bh + 14.3, I.z - 8); g.add(this.srvBeacon);
      }
      const pier = new T.Mesh(new T.BoxGeometry(3, 0.4, 18), wood); pier.position.set(I.x - 6, 0.55, I.z + I.rz + 3); g.add(pier);
      for (let i = -1; i <= 2; i++) for (const sx of [-1.3, 1.3]) { const pile = new T.Mesh(new T.CylinderGeometry(0.14, 0.14, 4, 8), wood); pile.position.set(I.x - 6 + sx, -1.4, I.z + I.rz + 3 + i * 4); g.add(pile); }
    });
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
  berth(k) { const I = PR_ISLES[k]; return { x: I.x - 6 + 3.2, z: I.z + I.rz + 6, h: Math.PI / 2 }; },
  berthed(k) { if (!PR_ISLES[k] || !PR_ISLES[k].rx) return false; const B = this.berth(k); return Math.hypot(this.b.x - B.x, this.b.z - B.z) < 6; },
  // le pilote auto emmène Elba jusqu'au ponton de l'île suivante
  // la même règle partout : le pilote auto emmène Elba à l'île choisie
  goSail(k) { if (k === 'insula') this.autopilot(); else this.sailTo(k); },
  // à l'approche d'une île barrée à la main, on propose d'accoster
  approachStep(ph, b) { if (!this.A) return; const pts = { insula: this.A }; ['cartevivante', 'serveur'].forEach((k) => { const B = this.berth(k); pts[k] = { x: B.x, z: B.z + 24 }; });
    const best = this.sailDest || 'insula', bd = Math.hypot(b.x - pts[best].x, b.z - pts[best].z);
    if (ph === 'mer' && bd < 45) { this.approachK = best; this.setState({ phase: 'approche' }); this.say(best === 'insula' ? PR_RADIO.approche : PR_RADIO.approche2); }
    else if (ph === 'approche' && (bd > 60 || best !== this.approachK)) this.setState({ phase: 'mer' }); },
  // accoster depuis l'approche : on part d'où l'on est, sans revenir au point d'approche (plus de demi-tour)
  finalApproach(k) {
    const b = this.b, here = { x: b.x, z: b.z }; let T, pre;
    if (k === 'insula') { T = this.D; pre = [this.A, this.Dapp]; } else { T = this.berth(k); pre = [{ x: T.x, z: T.z + 24 }, { x: T.x, z: T.z + 9 }]; }
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
    else if (at === 'cartevivante' || at === 'serveur') { s0 = { x: b.x, z: b.z + 22 }; pts.push(s0); }
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
    else { T = this.berth(k); pre = [{ x: T.x, z: T.z + 24 }]; }
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
    else if (st.phase === 'escale') { s0 = { x: b.x, z: b.z + 22 }; pts.push(s0); }
    else { const P = this.P0; let e = null; if (Math.abs(b.x - P.x) < 12 && b.z > P.z - 16 && b.z < P.z + 16) e = { x: b.x + (b.x >= P.x ? 3 : -3), z: P.z - 22 }; else e = this.escape(b); if (e) { pts.push(e); s0 = e; } }
    const app = { x: B.x, z: B.z + 24 }; this.plan(s0, app).forEach((p) => pts.push(p)); pts.push(B);
    this.b.v = 1; this.cruise(pts, true, 17); this.autoDock = true; this.sailK = k; this.sailDest = k; this.isleK = null;
    this.setState({ phase: 'mer', auto: true, focus: null, showApp: false, showCard: false, ask: null });
    this.say('Cap sur ' + PR_ISLES[k].to + ' ! Je tiens la barre, regarde la route en pointillés sur la carte marine.');
  },
  flyTo(k) {
    if (k === 'insula') { if (!this.D) return; this.setState({ showMap: false }); const u = this.jetty.u; Object.assign(this.b, { x: this.D.x, z: this.D.z, h: Math.atan2(u.z, -u.x), v: 0, turn: 0 }); this.cruiseP = null; this.route = []; this.isleK = null;
      this.overview(); this.visited = true; this.seen('insula'); this.setState({ phase: 'accoste', showCard: false }); this.say(PR_RADIO.accoste); return; }
    const I = PR_ISLES[k]; if (!I) return; this.isleK = k; this.seen(k); const B = this.berth(k); Object.assign(this.b, { x: B.x, z: B.z, h: B.h, v: 0, turn: 0 }); this.cruiseP = null; this.route = []; this.sailK = null; this.autoDock = false; const v = I.view, narrow = this.host.clientWidth < this.host.clientHeight;
    Object.assign(this.orbW, { tx: I.x, tz: I.z, ty: v.ty, yaw: v.yaw, pitch: v.pitch, dist: v.dist * (narrow ? 1.7 : 1) });
    this.setState({ phase: 'escale', showMap: false, ask: null, auto: false }); this.say(PR_RADIO[k], 'LOUIS-MARIE · ' + I.name.toUpperCase());
  },
  // embarquer : la caméra plonge de l'archipel vers le ponton
  embark() { if (this.boatAt() !== 'ponton') { this.transit('ponton'); return; } this.setNightNow(0); Object.assign(this.b, { x: this.P0.x + 3.0, z: this.P0.z - 4, h: Math.PI / 2, v: 0, turn: 0 }); this.cruiseP = null; this.route = []; this.isleK = null;
    this.lookCur = new window.THREE.Vector3(this.orb.tx, this.orb.ty, this.orb.tz); this.swoop = 2.2; this.camYaw = 0; this.camPitch = 0.28; this.seen('ponton'); this.setState({ phase: 'ponton', showMap: false }); this.say(PR_RADIO.ponton); },
  islesHit(cx, cy) { const T = window.THREE, r = this.renderer.domElement.getBoundingClientRect(); const rc = new T.Raycaster(); rc.setFromCamera(new T.Vector2(((cx - r.left) / r.width) * 2 - 1, -((cy - r.top) / r.height) * 2 + 1), this.cam);
    if (this.island && (rc.intersectObject(this.island, true).length || rc.intersectObject(this.trees, true).length)) return 'insula';
    for (const k in this.isleG || {}) if (rc.intersectObject(this.isleG[k], true).length) return k; return null; },
  islePen(x, z) { let p = -1e9; ['cartevivante', 'serveur'].forEach((k) => { const I = PR_ISLES[k]; p = Math.max(p, 1.1 - Math.hypot((x - I.x) / I.rx, (z - I.z) / I.rz)); }); return p; },
  isleStep(T, t, dt, ph) {
    this.transitFx(T, ph);
    if (!this.isleG) return;
    // brume repoussée vue de haut
    const far = ph === 'archipel' ? 3000 : (this.st().plan ? 2600 : 1350), near = ph === 'archipel' ? 500 : 220; const F = this.scene.fog; F.far += (far - F.far) * Math.min(1, dt * 2); F.near += (near - F.near) * Math.min(1, dt * 2);
    if (this.cvRail && this.cvTrain) { const u0 = (t * 0.035) % 1; this.cvTrain.forEach((car, i) => { const u = (u0 - i * 0.0215 + 1) % 1; const p = this.cvRail.getPointAt(u), tg = this.cvRail.getTangentAt(u); car.position.copy(p); car.rotation.set(0, Math.atan2(tg.x, tg.z), 0); }); }
    if (this.cvPlane) { const I = PR_ISLES.cartevivante, a = t * 0.18; this.cvPlane.position.set(I.x + Math.cos(a) * 52, 34 + 2 * Math.sin(t * 0.5), I.z + Math.sin(a) * 40); this.cvPlane.rotation.set(0, -a, 0.35); }
    if (this.cvScreen) { const i = Math.floor(t / 7) % 2; if (this.cvScreen.material.map !== this.cvTex[i]) { this.cvScreen.material.map = this.cvTex[i]; this.cvScreen.material.needsUpdate = true; } }
    if (this.srvIM && (this.ledT = (this.ledT || 0) + dt) > 0.18) { this.ledT = 0; const c = new T.Color(); for (let i = 0; i < this.srvLeds.length; i++) { const on = Math.random() > (i % 5 === 0 ? 0.05 : 0.45); c.set(on ? (i % 5 === 4 ? 0xffc94a : 0x39ff7a) : 0x0c2414); this.srvIM.setColorAt(i, c); } this.srvIM.instanceColor.needsUpdate = true; }
    if (this.srvBeacon) this.srvBeacon.visible = (t % 1.6) < 0.5;
    // étiquettes
    const W = this.host.clientWidth, H = this.host.clientHeight, show = ph === 'archipel';
    for (const k in this.isleLbl) { const el = this.isleLbl[k], I = PR_ISLES[k]; if (!show) { el.style.display = 'none'; continue; } const p = new T.Vector3(I.x, I.top, I.z).project(this.cam); if (p.z > 1) { el.style.display = 'none'; continue; } el.style.display = 'block'; el.style.left = ((p.x + 1) / 2 * W) + 'px'; el.style.top = ((1 - p.y) / 2 * H) + 'px'; el.classList.toggle('done', !!(this.visitedSet || {})[k]); }
    if (ph === 'archipel' && this.mouse && (this.archHov = (this.archHov || 0) + dt) > 0.1) { this.archHov = 0; const k = this.islesHit(this.mouse.x, this.mouse.y); this.renderer.domElement.style.cursor = k ? 'pointer' : 'grab'; for (const kk in this.isleLbl) this.isleLbl[kk].classList.toggle('hov', kk === k); }
  }
});
