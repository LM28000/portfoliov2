/* Le rendu « premium » : couleurs AgX (comme dans Blender), lumière d'environnement tirée du ciel du site,
   ombres du soleil en temps réel autour de ce qu'on regarde, et une passe de finition (occultation ambiante, léger halo).
   Deux niveaux : « haute » sur ordinateur, « simple » sur téléphone ou machine modeste (ni passe de finition, ni ombres).
   localStorage « elba-rendu » = 'haute' | 'simple' force un niveau. */
const PR_RENDU = { finition: false, exposition: 1.05, expoCabine: 0.95, env: 0.38, hemi: 0.7, ombre: 70, carteOmbre: 2048, halo: 0.22 };
Object.assign(Component.prototype, {
  renduNiveau() {
    let f = null; try { f = localStorage.getItem('elba-rendu'); } catch (e) {}
    if (f === 'haute' || f === 'simple') return f;
    const mobile = /Mobi|Android|iPhone|iPad/i.test(navigator.userAgent) || Math.min(screen.width, screen.height) < 600;
    return mobile || (navigator.hardwareConcurrency || 8) < 4 ? 'simple' : 'haute';
  },
  setupRendu(T, r, scene, cam, W, H) {
    const haute = this.renduNiveau() === 'haute'; this.rendu = { haute };
    r.toneMapping = PR_RENDU.finition ? T.AgXToneMapping : T.ACESFilmicToneMapping; r.toneMappingExposure = PR_RENDU.exposition;
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
    // passe de finition (désactivée : la mer et le ciel, en shaders maison, n'y sont pas encore adaptés)
    if (!PR_RENDU.finition) return;
    const pr = r.getPixelRatio(), rt = new T.WebGLRenderTarget(W * pr, H * pr, { type: T.HalfFloatType, samples: 4 });
    const comp = new T.EffectComposer(r, rt); const rp = new T.RenderPass(scene, cam); comp.addPass(rp);
    const ao = new T.GTAOPass(scene, cam, W, H); ao.output = T.GTAOPass.OUTPUT.Default; ao.blendIntensity = 0.85;
    ao.updateGtaoMaterial({ radius: 0.9, distanceExponent: 1.5, thickness: 2.0, scale: 1.0, samples: 16 }); ao.updatePdMaterial({ lumaPhi: 10, depthPhi: 2, normalPhi: 3, radius: 6, rings: 2, samples: 16 });
    comp.addPass(ao);
    const halo = new T.UnrealBloomPass(new T.Vector2(W, H), PR_RENDU.halo, 0.5, 0.92); comp.addPass(halo);
    comp.addPass(new T.OutputPass());
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
      // le point du sol au centre de l'écran (ou 25 m devant la caméra si on regarde l'horizon)
      const fw = new T.Vector3(); c.getWorldDirection(fw); let k = fw.y < -0.05 ? -c.position.y / fw.y : 25; k = Math.min(k, 160);
      const fx = c.position.x + fw.x * k, fz = c.position.z + fw.z * k, g = 0.5;
      s.target.position.set(Math.round(fx / g) * g, 0, Math.round(fz / g) * g); s.position.copy(s.target.position).addScaledVector(d, 400); }
  },
  renduFrame(scene, cam, expo) {
    const r = this.renderer, R = this.rendu; r.toneMappingExposure = expo;
    if (R && R.comp) { R.rp.scene = scene; R.rp.camera = cam; R.ao.enabled = scene === this.scene; R.comp.render(); } else r.render(scene, cam);
  }
});
