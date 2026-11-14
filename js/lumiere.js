/* Éclairage figé de l'île d'Insula : la lumière du soleil et du ciel (ombres, rebonds) est calculée dans Blender
   (outils/3d/scripts/cuire_ile.py) et enregistrée dans deux textures. Le terrain la lit par son seul jeu d'UV,
   les autres surfaces fixes par leur deuxième jeu. Ces maillages passent en matériau « basique » :
   couleur × lumière figée × teinte, sans calcul en temps réel. La nuit, la lumière figée baisse ;
   les lampes, lanternes et petits objets du quai gardent leur rendu en temps réel. */
const PR_CUIT = { actif: false, ECHELLE: 4.0, FORCE: 0.82, NUIT: 0.12, TEINTE: [1.0, 0.92, 0.82], sol: 'ile_lumiere_sol', quai: 'ile_lumiere_quai' };   // textures (assets/<nom>.jpg) produites par cuire_ile.py, publiées seulement si actif
Object.assign(Component.prototype, {
  bakeIsland(T) {
    if (!PR_CUIT.actif) return;     // remplacé sur l'île par les ombres en temps réel (js/rendu.js) ; gardé pour les intérieurs
    // seules les surfaces marquées « cuit » dans Blender (propriété exportée) ; le terrain n'a qu'un jeu d'UV
    const cuit = (o) => { for (let x = o; x; x = x.parent) if (x.userData && x.userData.cuit) return x.userData.cuit; return null; };
    const uvOf = (o) => { const c = cuit(o); if (!c) return -1; return c === 'sol' ? (o.geometry.attributes.uv ? 0 : -1) : (o.geometry.attributes.uv1 ? 1 : -1); };
    let n = 0; this.island.traverse((o) => { if (o.isMesh && uvOf(o) >= 0) n++; }); if (!n) return;
    const tl = new T.TextureLoader(), load = (f, ch) => { const t = tl.load('assets/' + f + '.jpg'); t.colorSpace = T.SRGBColorSpace; t.flipY = false; t.channel = ch; t.anisotropy = 4; return t; };
    const sol = load(PR_CUIT.sol, 0), quai = load(PR_CUIT.quai, 1), tint = new T.Color(...PR_CUIT.TEINTE), K = PR_CUIT.ECHELLE * PR_CUIT.FORCE * Math.PI;
    this.baked = [];
    this.island.traverse((o) => {
      if (!o.isMesh || uvOf(o) < 0) return; const m0 = o.material;
      const m = new T.MeshBasicMaterial({ map: m0.map || null, color: (m0.color ? m0.color.clone() : new T.Color(1, 1, 1)).multiply(tint), vertexColors: !!m0.vertexColors,
        lightMap: uvOf(o) === 0 ? sol : quai, lightMapIntensity: K, transparent: m0.transparent, opacity: m0.opacity, side: m0.side, alphaTest: m0.alphaTest });
      m.name = m0.name; o.material = m; o.userData.mat = m; this.baked.push(m);
    });
    this.bakedK = K;
  },
  bakeStep() {
    if (!this.baked) return; const n = this.night || 0, e = n * n * (3 - 2 * n), k = this.bakedK * (1 - (1 - PR_CUIT.NUIT) * e);
    if (this.baked[0].lightMapIntensity !== k) this.baked.forEach((m) => { m.lightMapIntensity = k; });
  }
});
