/* Le rendu « premium » : lumière d'environnement tirée du ciel du site,
   ombres du soleil en temps réel autour de ce qu'on regarde, et une passe de finition (occultation ambiante, léger halo).
   Deux niveaux : « haute » sur ordinateur, « simple » sur téléphone ou machine modeste (ni passe de finition, ni ombres).
   localStorage « elba-rendu » = 'haute' | 'simple' force un niveau. */
const PR_RENDU = { finition: /[?&]finition=1/.test(location.search),   /* désactivée par défaut (clignotements noirs à corriger) ; ?finition=1 pour l'essayer */
  exposition: 1.05, expoCabine: 0.95, env: 0.38, hemi: 0.7, ombre: 60, ombreMax: 420, carteOmbre: 2048, halo: 0.12, haloSeuil: 2.2 };
Object.assign(Component.prototype, {
  renduNiveau() {
    let f = null; try { f = localStorage.getItem('elba-rendu'); } catch (e) {}
    if (f === 'haute' || f === 'simple') return f;
    const mobile = /Mobi|Android|iPhone|iPad/i.test(navigator.userAgent) || Math.min(screen.width, screen.height) < 600;
    return mobile || (navigator.hardwareConcurrency || 8) < 4 ? 'simple' : 'haute';
  },
  setupRendu(T, r, scene, cam, W, H) {
    const haute = this.renduNiveau() === 'haute'; this.rendu = { haute };
    r.toneMapping = T.ACESFilmicToneMapping; r.toneMappingExposure = PR_RENDU.exposition;
    // lumière d'environnement : le ciel du site, capturé en carte de réflexion (refaite quand la nuit tombe)
    this.pmrem = new T.PMREMGenerator(r); this.envScene = new T.Scene();
    const skyCopy = new T.Mesh(this.sky.geometry, this.sky.material); skyCopy.scale.copy(this.sky.scale); this.envScene.add(skyCopy);
    this.renduEnv(); scene.environmentIntensity = PR_RENDU.env;
    if (this.hemi) { this.hemiBase = PR_RENDU.hemi; this.hemi.intensity *= PR_RENDU.hemi; }
    if (!haute) return;
    // ombres du soleil : une boîte de PR_RENDU.ombre m qui suit le point regardé
    r.shadowMap.enabled = true; r.shadowMap.type = T.PCFShadowMap;
    const s = this.sunL; s.castShadow = true; s.shadow.mapSize.set(PR_RENDU.carteOmbre, PR_RENDU.carteOmbre);
    const c = s.shadow.camera, h = PR_RENDU.ombre / 2; c.left = -h; c.right = h; c.top = h; c.bottom = -h; c.near = 1; c.far = 900; c.updateProjectionMatrix();
    s.shadow.bias = -0.0004; s.shadow.normalBias = 0.04; s.shadow.radius = 3; scene.add(s.target); this.sunDir = s.position.clone().normalize();
    // passe de finition : occultation ambiante (dehors seulement) et léger halo sur les lumières vives
    if (!PR_RENDU.finition) return;
    // essais : ?finition=1 puis &ao=0 (sans occultation), &halo=0 (sans halo), &smaa=0 (sans lissage), &msaa=1 (ancien lissage), &flottant=0 (tampon 8 bits)
    const sans = (k) => new RegExp('[?&]' + k + '=0').test(location.search);
    const pr = r.getPixelRatio(), rt = new T.WebGLRenderTarget(W * pr, H * pr, { type: sans('flottant') ? T.UnsignedByteType : T.HalfFloatType, samples: /[?&]msaa=1/.test(location.search) ? 4 : 0 });   /* pas de MSAA : avec le halo, il fait clignoter l'écran en noir dans Chrome ; lissage SMAA à la fin */
    const comp = new T.EffectComposer(r, rt); const rp = new T.RenderPass(scene, cam); comp.addPass(rp);
    const ao = new T.GTAOPass(scene, cam, W, H); ao.output = T.GTAOPass.OUTPUT.Default; ao.blendIntensity = 0.85;
    ao.updateGtaoMaterial({ radius: 0.6, distanceExponent: 1.0, thickness: 1.0, scale: 1.0, samples: 16, distanceFallOff: 1.0 }); ao.updatePdMaterial({ lumaPhi: 10, depthPhi: 2, normalPhi: 3, radius: 6, rings: 2, samples: 16 });
    // l'occultation ignore aussi les sprites (fumée), le transparent (verres, anneaux), le ciel et la mer
    ao._overrideVisibility = function () { const cache = this._visibilityCache; this.scene.traverse((o) => { if (!o.visible) return; const m = o.material;
      if (o.isPoints || o.isLine || o.isLine2 || o.isSprite || (o.isMesh && m && ((m.transparent && !m.alphaTest) || m.isShaderMaterial))) { o.visible = false; cache.push(o); } }); };
    if (!sans('ao')) comp.addPass(ao); else ao.enabled = false;
    const halo = new T.UnrealBloomPass(new T.Vector2(W, H), PR_RENDU.halo, 0.35, PR_RENDU.haloSeuil); if (!sans('halo')) comp.addPass(halo); else halo.enabled = false;
    comp.addPass(new T.OutputPass());
    if (!sans('smaa')) comp.addPass(new T.SMAAPass(W * pr, H * pr));
    Object.assign(this.rendu, { comp, rp, ao, halo });
  },
  renduEnv() {
    if (this.envRT) this.envRT.dispose();
    this.envRT = this.pmrem.fromScene(this.envScene, 0, 1, 2000); this.scene.environment = this.envRT.texture;
  },
  renduOmbres(T, obj) {
    if (!this.rendu || !this.rendu.haute) return;
    obj.traverse((o) => { if (!o.isMesh || !o.material || o.material.isShaderMaterial || o === this.sea || o === this.sky) return;
      const m = o.material; if (m.transparent && !m.alphaTest) return; o.castShadow = true; o.receiveShadow = true; });
  },
  renduTaille(W, H) { if (this.rendu && this.rendu.comp) { this.rendu.comp.setSize(W, H); this.rendu.ao.setSize(W, H); this.rendu.halo.setSize(W, H); } },
  // à chaque image : l'ombre suit le point regardé ; la carte d'environnement suit la nuit
  renduStep(dt) {
    const R = this.rendu; if (!R) return;
    const n = this.night || 0; if (Math.abs(n - (this.envNight == null ? -1 : this.envNight)) > 0.04) { this.envNight = n; this.renduEnv(); }
    if (R.haute && this.sunL) { const T = window.THREE, s = this.sunL, c = this.cam, d = this.sunDir;
      // centre de la boîte d'ombre : le point autour duquel la caméra tourne (îles, archipel),
      // sinon le point du sol au centre de l'écran (ou 25 m devant si on regarde l'horizon)
      let fx, fz, dist; const O = this.orb;
      if (O && this.orbitPh(this.st().phase)) { fx = O.tx; fz = O.tz; dist = O.dist; }
      else { const fw = new T.Vector3(); c.getWorldDirection(fw); let k = fw.y < -0.05 ? -c.position.y / fw.y : 25; k = Math.min(k, 160); fx = c.position.x + fw.x * k; fz = c.position.z + fw.z * k; dist = k; }
      // la boîte grandit avec le recul (par paliers, pour ne pas recalculer à chaque image) : de 60 m à toute l'île, puis l'archipel
      let size = 60; while (size < Math.min(PR_RENDU.ombreMax, dist * 1.6)) size *= 1.5;
      const cs = s.shadow.camera; if (cs.right * 2 !== size) { cs.left = cs.bottom = -size / 2; cs.right = cs.top = size / 2; cs.updateProjectionMatrix(); }
      const g = size / PR_RENDU.carteOmbre * 2;                       // aligné sur les texels : pas de scintillement en se déplaçant
      s.target.position.set(Math.round(fx / g) * g, 0, Math.round(fz / g) * g); s.position.copy(s.target.position).addScaledVector(d, 400); }
  },
  renduFrame(scene, cam, expo) {
    const r = this.renderer, R = this.rendu; r.toneMappingExposure = expo;
    if (R && R.comp) { R.rp.scene = scene; R.rp.camera = cam; const dehors = scene === this.scene && this.st().phase !== 'studio'; if (R.comp.passes.includes(R.ao)) R.ao.enabled = dehors; if (R.comp.passes.includes(R.halo)) R.halo.enabled = this.st().phase !== 'studio'; /* intérieurs : profondeur trop étirée (3 cm à 3 km) */ R.comp.render(); } else r.render(scene, cam);
  }
});
