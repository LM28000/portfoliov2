/* La vie du quai d'Insula : des mouettes (deux posées sur les lampadaires, quatre qui tournent au-dessus du port),
   la fumée de la cheminée, la bouée de chenal qui tangue, et les lampadaires qui s'allument à la tombée de la nuit.
   Les objets fixes (terrasse, vélos, hortensias, casiers…) sont dans ile_insula.glb (3d/scripts/quai_vie.py). */
Object.assign(Component.prototype, {
  buildQuayLife(T) {
    const Q = { gulls: [], puffs: [], lamps: [], buoy: null };
    // lanternes des lampadaires (matériau « VieLanterne »)
    this.island.traverse((o) => { if (o.isMesh && /^VieLanterne/.test((o.material && o.material.name) || '') && !Q.lamps.includes(o.material)) { o.material.emissive = new T.Color(0xffa040); Q.lamps.push(o.material); } });
    // une flaque de lumière chaude sous chaque lanterne (ajoutées dès le départ, éteintes : pas de recompilation des shaders à la nuit)
    Q.pools = [0, 1, 2].map((k) => { const v = this.island.getObjectByName('Vie_LanterneVerre_' + k); if (!v) return null; const w = new T.Vector3(); v.getWorldPosition(w); v.geometry.computeBoundingBox(); v.geometry.boundingBox.getCenter(w); v.localToWorld(w);
      const l = new T.PointLight(0xffa755, 0, 9, 1.2); l.position.copy(w); this.life.add(l); return l; }).filter(Boolean);
    Q.buoy = this.island.getObjectByName('Vie_BoueeMer'); if (Q.buoy) Q.buoy.userData.y0 = Q.buoy.position.y;
    // mouettes : corps, tête, deux ailes articulées à l'épaule
    const white = new T.MeshLambertMaterial({ color: 0xf4f4f0 }), grey = new T.MeshLambertMaterial({ color: 0xaab2ba, side: T.DoubleSide }), beak = new T.MeshLambertMaterial({ color: 0xe8b23a });
    const wingG = new T.BufferGeometry(); wingG.setAttribute('position', new T.Float32BufferAttribute([0, 0, -0.09, 0, 0, 0.1, 0.62, 0, 0.02, 0, 0, 0.1, 0.62, 0, 0.02, 0.4, 0, 0.12], 3)); wingG.computeVertexNormals();
    const bodyG = new T.SphereGeometry(0.1, 10, 8), headG = new T.SphereGeometry(0.06, 8, 6), beakG = new T.ConeGeometry(0.018, 0.07, 6), tailG = new T.ConeGeometry(0.06, 0.16, 4);
    const gull = () => { const g = new T.Group(), body = new T.Mesh(bodyG, white); body.scale.set(1, 0.9, 2.1); g.add(body);
      const head = new T.Mesh(headG, white); head.position.set(0, 0.07, 0.22); g.add(head); const b = new T.Mesh(beakG, beak); b.rotation.x = Math.PI / 2; b.position.set(0, 0.06, 0.3); g.add(b);
      const tail = new T.Mesh(tailG, grey); tail.rotation.x = -Math.PI / 2; tail.position.set(0, 0.01, -0.26); tail.scale.set(1, 1, 0.25); g.add(tail);
      const wl = new T.Group(), wr = new T.Group(); const ml = new T.Mesh(wingG, grey), mr = new T.Mesh(wingG, grey); mr.scale.x = -1; wl.add(ml); wr.add(mr);
      wl.position.set(0.05, 0.04, 0.02); wr.position.set(-0.05, 0.04, 0.02); g.add(wl, wr); g.userData = { wl, wr, head }; g.scale.setScalar(1.5); this.life.add(g); return g; };
    // posées sur le perchoir de deux lampadaires
    ['Vie_LampPerche_1', 'Vie_LampPerche_2'].forEach((n, i) => { const p = this.island.getObjectByName(n); if (!p) return; const w = new T.Vector3(); p.getWorldPosition(w);
      const g = gull(); g.position.set(w.x, w.y + 0.2, w.z); g.rotation.y = i ? 2.2 : -0.6; g.userData.wl.rotation.z = g.userData.wr.rotation.z = 0; g.userData.wl.scale.setScalar(0.42); g.userData.wr.scale.setScalar(0.42);
      g.userData.wl.rotation.y = 1.25; g.userData.wr.rotation.y = -1.25; g.userData.perch = { yaw: g.rotation.y, ph: i * 3.1 }; Q.gulls.push(g); });
    // en vol, en cercles au-dessus du port
    const c = this.stuW(0, -9, 0);
    for (let i = 0; i < 4; i++) { const g = gull(); g.userData.fly = { cx: c.x + (i - 1.5) * 5, cz: c.z + (i % 2 ? 4 : -3), r: 9 + i * 4.5, h: 9 + i * 2.2, w: (0.16 + i * 0.035) * (i % 2 ? 1 : -1), a: i * 1.7, flap: i * 0.9 }; Q.gulls.push(g); }
    // fumée de la cheminée de gauche : des bouffées qui montent, grossissent et s'effacent
    const cv = document.createElement('canvas'); cv.width = cv.height = 64; const x = cv.getContext('2d'); const gr = x.createRadialGradient(32, 32, 2, 32, 32, 31);
    gr.addColorStop(0, 'rgba(235,235,235,0.9)'); gr.addColorStop(0.5, 'rgba(220,220,222,0.35)'); gr.addColorStop(1, 'rgba(210,210,215,0)'); x.fillStyle = gr; x.fillRect(0, 0, 64, 64);
    const tex = new T.CanvasTexture(cv); Q.chimney = this.stuW(-4.25, 4, 13.15);
    for (let i = 0; i < 14; i++) { const s = new T.Sprite(new T.SpriteMaterial({ map: tex, transparent: true, depthWrite: false, opacity: 0 })); s.userData.u = i / 14; this.life.add(s); Q.puffs.push(s); }
    this.quay = Q;
  },
  quayLifeStep(T, t, dt) {
    const Q = this.quay; if (!Q) return; const n = this.night || 0, e = n * n * (3 - 2 * n);
    Q.lamps.forEach((m) => { m.emissiveIntensity = 1.3 * e; }); Q.pools.forEach((l) => { l.intensity = 1.5 * e; });
    if (Q.buoy) { const b = Q.buoy; b.position.y = b.userData.y0 + 0.12 * Math.sin(t * 1.25); b.rotation.x = 0.07 * Math.sin(t * 0.9 + 1); b.rotation.z = 0.06 * Math.sin(t * 1.1); }
    Q.gulls.forEach((g) => { const u = g.userData;
      if (u.perch) { const k = Math.sin(t * 0.35 + u.ph); g.rotation.y = u.perch.yaw + (k > 0.6 ? 0.9 : k < -0.7 ? -0.7 : 0); u.head.position.y = 0.07 + 0.012 * Math.max(0, Math.sin(t * 2.4 + u.ph)); return; }
      const f = u.fly; f.a += f.w * dt; const r = f.r + 2 * Math.sin(t * 0.13 + f.flap);
      g.position.set(f.cx + Math.cos(f.a) * r, f.h + 1.2 * Math.sin(t * 0.4 + f.flap), f.cz + Math.sin(f.a) * r);
      g.rotation.set(0, -f.a + (f.w > 0 ? 0 : Math.PI), (f.w > 0 ? 1 : -1) * 0.32);
      const flapping = Math.sin(t * 0.3 + f.flap * 2) > 0.35; const wa = flapping ? 0.55 * Math.sin(t * 9 + f.flap) : 0.12 + 0.04 * Math.sin(t * 2);
      u.wl.rotation.z = wa; u.wr.rotation.z = -wa; });
    Q.puffs.forEach((s) => { const u = (s.userData.u + t * 0.07) % 1; const p = Q.chimney;
      s.position.set(p.x + u * 3.2 + 0.25 * Math.sin(t * 0.5 + s.userData.u * 9), p.y + u * 5, p.z + u * 1.6); s.scale.setScalar(0.6 + u * 2.6);
      s.material.opacity = 0.42 * Math.min(1, u * 6) * (1 - u) * (1 - 0.4 * e); });
  }
});
