/* Monde 3D : mer, Elba, île d'Insula. Repris du prototype du canvas (Round 11). */

const PR_TREES = [[1,-31.3,5.8,6.66,2.16,0.8],[0,-52.2,0.9,3.37,0.95,1.28],[0,-1.4,-36.0,2.51,3.6,1.28],[1,-53.8,15.8,1.29,5.16,1.0],[0,-4.7,-26.0,4.77,1.37,1.15],[2,-26.0,18.6,7.45,5.47,0.76],[1,-51.3,-4.0,3.8,0.86,0.71],[0,-33.0,-32.6,2.33,1.47,1.02],[2,36.5,-8.4,5.8,3.02,0.76],[0,59.3,-4.6,3.4,0.33,1.07],[0,-48.8,-10.7,4.18,1.31,0.94],[2,55.7,8.0,4.58,5.33,0.65],[2,60.4,-2.7,3.49,0.91,0.72],[1,55.3,-10.8,3.39,4.76,0.97],[0,-24.7,11.2,7.49,1.64,1.25],[0,-16.3,-26.0,5.31,4.89,1.17],[3,-33.4,1.4,6.44,6.21,0.89],[3,-37.5,8.2,6.18,5.88,0.78],[1,-36.2,9.7,6.24,3.01,0.94],[2,-50.8,12.6,2.38,4.71,0.91],[3,-2.7,-25.1,5.23,5.94,0.63],[2,-57.8,7.1,1.77,0.92,0.92],[1,19.2,-11.7,6.71,0.13,0.82],[0,-48.6,19.5,2.51,5.47,1.12],[3,39.9,-22.6,2.98,3.15,0.69],[1,-45.2,-27.2,1.82,2.76,0.61],[2,36.6,-25.6,2.9,0.76,0.85],[1,-53.6,14.3,1.5,4.93,0.82],[0,-48.2,4.7,4.04,0.27,1.0],[0,-49.2,-3.7,4.2,5.73,1.28],[3,54.0,15.6,7.3,5.61,0.97],[2,-36.4,-4.1,5.98,2.78,0.65],[0,-52.3,-20.3,2.14,1.9,1.01],[3,-46.2,21.7,2.84,5.54,0.66],[0,57.2,-21.9,1.11,3.06,1.1],[0,60.0,26.0,1.27,6.24,1.25],[3,-17.6,-31.9,3.37,3.48,0.61],[3,-7.3,-37.7,1.86,1.86,0.81]];
// [image, largeur, hauteur, zmin] des imposteurs (rendus Blender, marge 3 %)
const PR_TREE_IMG = [['assets/arbre_island_tree_01.webp', 4.76, 5.03, -0.02], ['assets/arbre_pine_tree_01_a.webp', 7.6, 20.37, -0.08], ['assets/arbre_pine_tree_01_b.webp', 7.22, 14.88, -0.09], ['assets/arbre_pine_tree_01_c.webp', 7.63, 17.54, -0.09]];
// lieux de l'île (repère Blender x, y, z)
const PR_PLACES = [
 { k: 'quai', n: 1, name: 'Le quai', p: [-56, -42, 6], title: 'Le quai · les sources',
   story: ["Ici arrive tout ce qui nourrit Insula : une quinzaine de sources publiques — ventes réelles, quartiers, DPE, copropriétés, risques, transports, commerces — et les annonces du jour."],
   tech: ["DVF (DGFiP) · IRIS et urbanisme (IGN) · DPE (ADEME) · Insee · RNIC (Anah) · Géorisques · DGAC (bruit) · GTFS · SNCF · OpenStreetMap · SIES · Sitadel · cadastre · zonage TLV.", "Une vingtaine de scripts Python, un par source ; chaque fichier garde sa licence."] },
 { k: 'entrepot', n: 2, name: "L'entrepôt", p: [-30, -16, 14], title: "L'entrepôt · le relevé du soir",
   story: ["Chaque soir, une routine relève les nouvelles annonces dans les 22 villes et lit la fiche complète de chacune : description, photos, charges, étage, DPE."],
   tech: ["releve-du-jour.json → fiches.py todo → fiches-bienici.js (150 par soir) → maj_annonces.py → fiches.py merge → build.py (refuse une page cassée) → supabase_annonces.py push.", "Publication par sync.sh (launchd) : rien ne part si un test échoue."] },
 { k: 'atelier', n: 3, name: "L'atelier", p: [-8, -4, 18], title: "L'atelier · le calcul",
   story: ["Le moteur fait les comptes : crédit, charges, impôts du meublé, revente dans quinze ans. Au bout, un seul chiffre : le rendement réel de notre apport."],
   tech: ["Mensualité, assurance, notaire · LMNP réel ou micro, amortissements · loyer plafonné en zone tendue · interdiction de louer selon le DPE · revente selon la tendance de la ville · TRI sur 15 ans en 3 scénarios.", "Vérifié par tests/unit.js à chaque envoi."] },
 { k: 'insula', n: 4, name: "L'insula", p: [14, 2, 27], title: "L'insula · l'app", try: true,
   story: ["Le cœur : une carte des 22 villes qui descend jusqu'aux quartiers, puis aux annonces, puis aux immeubles en 3D. Et pour chaque bien, une fiche qui dit tout — et ce qu'il faut vérifier avant de visiter."],
   tech: ["Refonte v3 : Explorer · Nos biens · Projet · Réglages. MapLibre GL, JavaScript sans framework, une page assemblée par build.py, installable et hors ligne (service worker)."] },
 { k: 'village', n: 5, name: 'Le village', p: [44, 24, 12], title: 'Le village · 22 villes',
   story: ["Vingt-deux maisons, une par ville comparée, de l'Ouest de la France. Même règle pour toutes : quand une donnée manque, l'app le dit."],
   tech: ["« Une seule règle par donnée, la même pour toutes les villes. » Donnée absente : le bien prend le quartier, le quartier prend la ville. Aucune exception par ville dans le code."] },
 { k: 'commune', n: 6, name: 'La maison commune', p: [2, 20, 18], title: 'La maison commune · entre associés',
   story: ["Nos biens : la liste commune des associés, avec nos avis, nos visites, nos offres. Et la situation de chacun (impôts, autres crédits), pour que le calcul soit le nôtre."],
   tech: ["Supabase : tables « Nos biens », « annonces », « retours » ; vue en lecture seule annonces_publiques.", "Code de groupe après le « # » du lien : jamais envoyé au serveur ; la base n'en garde que l'empreinte."] },
 { k: 'antenne', n: 7, name: "L'antenne", p: [42, 18, 42], title: "L'antenne · parler à une IA",
   story: ["On peut aussi poser ses questions à une IA : « quoi de neuf à Tours ? », et elle répond avec le calcul et les liens des annonces."],
   tech: ["Serveur MCP (Node) : 10 outils — classement_villes, quartiers, annonces, fiche_annonce, nouveautes, simuler_bien, nos_biens, ajouter_bien, changer_statut, reglages. Même moteur de calcul que la page."] }
];
// ce que chaque lieu montre sur l'île (jour) et son cartouche (plan)
const PR_VIS = {
 quai: { radio: "Le quai : ici arrivent les données. Chaque caisse, c'est une source publique — ventes réelles, quartiers, DPE, transports — plus les annonces du jour.", cart: ['1 · LE QUAI · SOURCES', 'DVF · IGN IRIS · ADEME DPE', 'Insee · RNIC · Géorisques', 'GTFS · SNCF · OSM · SIES', '~20 scripts Python'] },
 entrepot: { radio: "L'entrepôt : chaque soir, une routine relève les nouvelles annonces des 22 villes et lit leur fiche complète. Regarde les caisses qui montent du quai.", cart: ['2 · RELEVÉ DU SOIR', 'routine Claude · 22 villes', 'fiches.py → maj_annonces.py', '150 fiches / soir max', 'build.py refuse une page cassée'] },
 atelier: { radio: "L'atelier fait les comptes : crédit, impôts du meublé, revente dans quinze ans. Au tableau, la fiche d'un vrai studio à Tours.", cart: ['3 · MOTEUR DE CALCUL', 'crédit · LMNP · zone tendue', 'DPE · revente à 15 ans', 'TRI en 3 scénarios', 'tests/unit.js'] },
 insula: { radio: "L'insula, c'est l'app. Sur l'écran : de la carte jusqu'à la fiche d'un bien. Et tu peux l'essayer pour de vrai avec la longue-vue, en bas à droite.", cart: ['4 · L’APP (v3)', 'Explorer · Nos biens', 'Projet · Réglages', 'MapLibre GL · JS sans framework', 'PWA hors ligne'] },
 village: { radio: "Le village : vingt-deux maisons pour vingt-deux villes de l'Ouest. Sur le panneau, la carte qui les compare.", cart: ['5 · 22 VILLES', 'une règle par donnée', 'la même pour toutes', 'donnée absente → niveau au-dessus', 'Playwright : 55 tests e2e'] },
 commune: { radio: "La maison commune, c'est entre associés : la liste de nos biens, nos avis, nos visites, et la situation de chacun pour que le calcul soit le nôtre.", cart: ['6 · BASE PARTAGÉE', 'Supabase (Postgres)', 'vue annonces_publiques', 'code de groupe après « # »', 'jamais envoyé au serveur'] },
 antenne: { radio: "L'antenne parle aux IA : on demande « quoi de neuf à Tours ? » et on reçoit le calcul et les liens des annonces.", cart: ['7 · SERVEUR MCP', '10 outils (Node)', 'fiche_annonce · nouveautes', 'simuler_bien · nos_biens…', 'même moteur que la page'] }
};
const PR_RADIO = {
 ponton: "Elba, Elba, ici Louis-Marie. Bienvenue à bord ! C'est toi qui barres, moi je te guide à la radio. Quand tu es prêt, largue les amarres.",
 mer: "Cap au nord : l'île droit devant, c'est Insula, mon premier projet. Barre avec les flèches (ou ZQSD), ou clique sur l'eau pour y aller.",
 approche: "Tu vois le quai, sur la gauche de l'île ? Approche doucement, je t'aide à accoster.",
 accoste: "Bien accosté ! Je voulais acheter un appartement avec des amis : il fallait comparer des villes, des quartiers, des annonces, avec des critères qui comptent vraiment. Alors j'ai construit Insula. Va voir la démo au cinéma en plein air, puis essaie l'app avec la longue-vue.",
 cinema: "Installe-toi : en une minute, tu vois comment on passe de la carte des villes à la fiche d'un studio, avec son vrai rendement sur quinze ans.",
 longuevue: "Regarde dans la longue-vue : c'est l'app pour de vrai. Tu peux t'en servir, rien ne casse. Reviens sur l'île quand tu veux.",
 archi: "Les coulisses : chaque soir, une routine relève les annonces, les fiches sont lues, le moteur fait les comptes, et rien n'est publié sans passer les tests. Une IA peut même interroger l'app.",
 plan: "Voilà l'envers du décor : chaque bâtiment est une brique du système, et les points lumineux suivent le trajet de la donnée. Clique sur un cartouche.",
 lieu: "Regarde bien, c'est ici que ça se passe."
};
const PR_CARNET = { kicker: 'CARNET DU PROJET · ÎLE N° 1', title: 'Insula',
 paras: ["Choisir où acheter, entre amis, avec les bons critères.",
  "Je voulais acheter un appartement avec des amis. Très vite, il a fallu comparer des villes, des quartiers, puis des annonces. Les sites d'annonces montrent un bien à la fois ; il nous fallait les mettre côte à côte, avec nos critères, pour décider ensemble.",
  "Alors j'ai construit l'outil qui nous manquait. Insula, en latin, c'est l'île, et aussi l'immeuble de rapport romain."],
 foot: "22 villes · ~15 sources publiques · relevé chaque soir · 15 ans de calcul" };
const B2T = (x, y, z) => [x, z, -y];
class Component extends DCLogic {
componentDidMount() { this.setState({ loading: true, loadMsg: 'chargement des modèles…', phase: 'ponton', radio: '', radioFrom: 'LOUIS-MARIE', showCard: false, plan: false, auto: false }); this.say(PR_RADIO.ponton); this.init(); }
componentWillUnmount() { clearTimeout(this.retry); clearInterval(this.typer); cancelAnimationFrame(this.raf); if (this.ro) this.ro.disconnect(); if (this.kd) { window.removeEventListener('keydown', this.kd); window.removeEventListener('keyup', this.ku); } if (this.renderer) { this.renderer.dispose(); const c = this.renderer.domElement; if (c.parentNode) c.parentNode.removeChild(c); } }
st() { return this.state || {}; }
say(text, from) {
 clearInterval(this.typer); let i = 0; this.setState({ radio: '', radioFrom: from || 'LOUIS-MARIE' });
 this.typer = setInterval(() => { i += 2; this.setState({ radio: text.slice(0, i) }); if (i >= text.length) clearInterval(this.typer); }, 28);
}
b64(s) { const bin = atob(s); const u = new Uint8Array(bin.length); for (let i = 0; i < bin.length; i++) u[i] = bin.charCodeAt(i); return u.buffer; }
init() {
 const T = window.THREE;
 if (!T || !T.GLTFLoader || !this.host || !this.layer) { this.retry = setTimeout(() => this.init(), 200); return; }
 const host = this.host; let W = host.clientWidth || 1440, H = host.clientHeight || 900;
 const r = new T.WebGLRenderer({ antialias: true }); r.setPixelRatio(Math.min(devicePixelRatio || 1, 2)); r.setSize(W, H);
 r.outputEncoding = T.sRGBEncoding; r.toneMapping = T.ACESFilmicToneMapping; r.toneMappingExposure = 1.05;
 host.appendChild(r.domElement); this.renderer = r;
 const scene = new T.Scene(); this.scene = scene;
 const FOG = new T.Color(0xeed3bd).convertSRGBToLinear(); this.fogDay = FOG.clone(); scene.fog = new T.Fog(FOG, 220, 1350);
 const cam = new T.PerspectiveCamera(50, W / H, 0.3, 3000); this.cam = cam;
 // ciel d'aube
 const sky = new T.Mesh(new T.SphereGeometry(1500, 64, 32), new T.ShaderMaterial({ side: T.BackSide, depthWrite: false, fog: false,
  uniforms: { top: { value: new T.Color(0x5d86b8) }, hor: { value: new T.Color(0xf2cfb0) }, sun: { value: new T.Vector3(-0.35, 0.12, -0.93).normalize() } },
  vertexShader: 'varying vec3 vP; void main(){ vP = normalize(position); gl_Position = projectionMatrix * modelViewMatrix * vec4(position,1.0); }',
  fragmentShader: 'uniform vec3 top; uniform vec3 hor; uniform vec3 sun; varying vec3 vP; void main(){ vec3 d = normalize(vP); float h = clamp(d.y,0.0,1.0); vec3 c = mix(hor, top, pow(h,0.55)); float s = max(dot(d,sun),0.0); c += vec3(1.0,0.8,0.6)*pow(s,300.0)*1.2 + vec3(1.0,0.65,0.45)*pow(s,12.0)*0.12; gl_FragColor = vec4(c,1.0); }' }));
 scene.add(sky); this.sky = sky;
 scene.add(new T.HemisphereLight(0xcfe0ff, 0x6b5a48, 0.75));
 const sun = new T.DirectionalLight(0xffe2c4, 1.35); sun.position.set(-160, 120, -300); scene.add(sun);
 // mer
 const sea = new T.Mesh(new T.PlaneGeometry(3000, 3000, 220, 220), new T.ShaderMaterial({ fog: true,
  uniforms: T.UniformsUtils.merge([T.UniformsLib.fog, { t: { value: 0 }, deep: { value: new T.Color(0x0d3a5c) }, shallow: { value: new T.Color(0x2f7f9a) }, skyc: { value: new T.Color(0xf0d2b8) }, sunDir: { value: new T.Vector3(-0.35, 0.2, -0.93).normalize() } }]),
  vertexShader: 'uniform float t; varying vec3 vW; varying vec3 vN; #include <fog_pars_vertex>\n void main(){ vec3 p = position; float x = p.x, y = -p.y; float h = 0.22*sin(0.11*x+0.7*t)+0.16*sin(0.13*y*1.3+0.9*t+x*0.03)+0.08*sin(0.31*(x+y)+1.6*t); float dx = 0.22*0.11*cos(0.11*x+0.7*t)+0.16*0.03*cos(0.169*y+0.9*t+x*0.03)+0.08*0.31*cos(0.31*(x+y)+1.6*t); float dy = 0.16*0.169*cos(0.169*y+0.9*t+x*0.03)+0.08*0.31*cos(0.31*(x+y)+1.6*t); p.z += h; vec4 w = modelMatrix*vec4(p,1.0); vW = w.xyz; vN = normalize(vec3(-dx, 1.0, dy)); vec4 mvPosition = viewMatrix*w; gl_Position = projectionMatrix*mvPosition; #include <fog_vertex>\n }'.replace(/#include <fog_pars_vertex>/, '\n#include <fog_pars_vertex>').replace(/#include <fog_vertex>/, '\n#include <fog_vertex>'),
  fragmentShader: 'uniform vec3 deep; uniform vec3 shallow; uniform vec3 skyc; uniform vec3 sunDir; varying vec3 vW; varying vec3 vN;\n#include <fog_pars_fragment>\n void main(){ vec3 V = normalize(cameraPosition - vW); float fr = pow(1.0 - max(dot(V, vN), 0.0), 3.0); vec3 c = mix(deep, shallow, 0.35) ; c = mix(c, skyc, clamp(fr*0.9,0.0,0.85)); vec3 R = reflect(-V, vN); float sp = pow(max(dot(R, sunDir), 0.0), 600.0); c += vec3(1.0,0.85,0.65)*sp*0.9; gl_FragColor = vec4(c, 1.0);\n#include <fog_fragment>\n }' }));
 sea.rotation.x = -Math.PI / 2; scene.add(sea); this.sea = sea;
 // ponton de départ (planches)
 const wood = new T.MeshStandardMaterial({ color: new T.Color(0x7a5a3a).convertSRGBToLinear(), roughness: 0.9 });
 const ponton = new T.Group(); const P0 = new T.Vector3(-20, 0, 175);
 const deck = new T.Mesh(new T.BoxGeometry(2.6, 0.18, 26), wood); deck.position.set(0, 0.32, 0); ponton.add(deck);
 for (let i = -12; i <= 12; i += 3) for (const sx of [-1.25, 1.25]) { const pile = new T.Mesh(new T.CylinderGeometry(0.14, 0.14, 4, 8), wood); pile.position.set(sx, -1.4, i); ponton.add(pile); }
 for (let i = -12; i <= 12; i += 6) { const bol = new T.Mesh(new T.CylinderGeometry(0.12, 0.14, 0.35, 10), wood); bol.position.set(1.15, 0.55, i); ponton.add(bol); }
 ponton.position.copy(P0); scene.add(ponton); this.ponton = ponton;
 // arbres (imposteurs croisés)
 const tl = new T.TextureLoader(); const treeMats = PR_TREE_IMG.map((d) => { const tx = tl.load(d[0]); tx.encoding = T.sRGBEncoding; return new T.MeshLambertMaterial({ map: tx, alphaTest: 0.45, side: T.DoubleSide, transparent: false }); });
 const trees = new T.Group();
 PR_TREES.forEach(([k, x, y, z, rot, s]) => { const [img, w, h, z0] = PR_TREE_IMG[k]; const hh = Math.max(h, w) * 1.03, ww = h >= w ? hh * (w / h) * 1.0 : hh; const g = new T.PlaneGeometry(ww, h >= w ? hh : hh * h / w);
  for (let a = 0; a < 2; a++) { const m = new T.Mesh(g, treeMats[k]); const [tx, ty, tz] = B2T(x, y, z); m.position.set(tx, ty + (z0 + h / 2) * s, tz); m.scale.setScalar(s); m.rotation.y = rot + a * Math.PI / 2; trees.add(m); } });
 scene.add(trees); this.trees = trees;
 // chargement des modèles
 const loader = new T.GLTFLoader();
 loader.load('assets/elba.glb', (g) => {
  const boat = new T.Group(); const m = g.scene; boat.add(m); scene.add(boat); this.boat = boat;
  m.traverse((o) => { if (o.isMesh && o.material && o.material.name && o.material.name.startsWith('feu')) o.material.emissiveIntensity = 2; });
  this.setState({ loadMsg: "l'île d'Insula…" });
  loader.load('assets/ile_insula.glb', (gi) => { this.island = gi.scene; scene.add(gi.scene); this.prepIsland(T); this.setState({ loading: false }); }, (ev) => { if (ev.total) this.setState({ loadMsg: "l'île d'Insula : " + Math.round(100 * ev.loaded / ev.total) + ' %' }); }, (e) => this.setState({ loadMsg: 'erreur île : ' + e }));
 }, undefined, (e) => this.setState({ loadMsg: 'erreur bateau : ' + e }));
 // état du bateau
 this.P0 = P0; this.b = { x: P0.x + 3.0, z: P0.z - 4, h: Math.PI / 2, v: 0, turn: 0, thr: 0, auto: null }; this.route = []; this.path = null; this.camDist = 16;
 this.keys = {}; this.camYaw = 0; this.camPitch = 0.28;
 this.kd = (e) => { this.keys[e.key.toLowerCase()] = true; if (['arrowup', 'arrowdown', 'arrowleft', 'arrowright'].includes(e.key.toLowerCase())) e.preventDefault(); if (this.st().phase === 'ponton' && ['arrowup', 'z', 'w'].includes(e.key.toLowerCase())) this.leave(); };
 this.ku = (e) => { this.keys[e.key.toLowerCase()] = false; };
 window.addEventListener('keydown', this.kd); window.addEventListener('keyup', this.ku);
 // clic sur l'eau = cap ; glisser = tourner la vue
 const ray = new T.Raycaster(), ndc = new T.Vector2(), plane = new T.Plane(new T.Vector3(0, 1, 0), 0);
 let down = null;
 r.domElement.addEventListener('contextmenu', (e) => e.preventDefault());
 r.domElement.addEventListener('pointerdown', (e) => { down = { x: e.clientX, y: e.clientY, yaw: this.camYaw, pitch: this.camPitch, moved: false, pan: e.button === 2 || e.shiftKey, o: Object.assign({}, this.orbW) }; });
 r.domElement.addEventListener('pointermove', (e) => { this.mouse = { x: e.clientX, y: e.clientY }; if (!down) return; const dx = e.clientX - down.x, dy = e.clientY - down.y; if (Math.abs(dx) + Math.abs(dy) > 5) down.moved = true;
  if (this.st().phase === 'accoste') { const o = this.orbW, d0 = down.o; if (down.pan) { const k = d0.dist * 0.0016, cy = Math.cos(d0.yaw), sy = Math.sin(d0.yaw); let tx = d0.tx - (dx * cy - dy * sy) * k, tz = d0.tz - (-dx * sy - dy * cy) * k; const rr = Math.hypot(tx / 80, tz / 52); if (rr > 1) { tx /= rr; tz /= rr; } o.tx = tx; o.tz = tz; } else { o.yaw = d0.yaw - dx * 0.006; o.pitch = Math.max(0.3, Math.min(1.35, d0.pitch + dy * 0.004)); } return; }
  this.camYaw = down.yaw - dx * 0.005; this.camPitch = Math.max(0.05, Math.min(1.45, down.pitch + dy * 0.004)); });
 r.domElement.addEventListener('wheel', (e) => { e.preventDefault(); const dy = Math.max(-60, Math.min(60, e.deltaMode === 1 ? e.deltaY * 16 : e.deltaY)); const f = Math.exp(dy * 0.0012); if (this.st().phase === 'accoste') this.orbW.dist = Math.max(22, Math.min(220, this.orbW.dist * f)); else this.camDist = Math.max(8, Math.min(70, this.camDist * f)); }, { passive: false });
 r.domElement.addEventListener('pointerup', (e) => { const d = down; down = null; if (!d || d.moved) return; const ph = this.st().phase;
  if (ph === 'accoste') { const hit = this.hitPlace(e.clientX, e.clientY); if (hit) this.focus(hit); return; }
  if (ph !== 'mer' && ph !== 'approche' || !this.island) return;
  const rc = r.domElement.getBoundingClientRect(); ndc.set(((e.clientX - rc.left) / rc.width) * 2 - 1, -((e.clientY - rc.top) / rc.height) * 2 + 1); ray.setFromCamera(ndc, cam);
  const hit = ray.intersectObject(this.island, true).length || ray.intersectObject(this.trees, true).length; if (hit && !this.st().auto) this.setState({ ask: { x: e.clientX - rc.left, y: e.clientY - rc.top } }); else this.setState({ ask: null }); });
 this.ro = new ResizeObserver(() => { W = host.clientWidth || W; H = host.clientHeight || H; r.setSize(W, H); cam.aspect = W / H; cam.updateProjectionMatrix(); }); this.ro.observe(host);
 // étiquettes des lieux (DOM géré à la main, mis à jour à chaque image)
 this.labels = [];
 this.tip = document.createElement('div'); this.tip.className = 'pr-lbl'; this.tip.style.display = 'none'; this.tip.style.pointerEvents = 'none'; this.layer.appendChild(this.tip);
 this.orbW = { tx: 4, tz: -2, yaw: -0.59, pitch: 0.42, dist: 165 }; this.orb = Object.assign({}, this.orbW);
 // carte marine
 this.chart = document.createElement('div'); this.chart.style.cssText = 'position:absolute;inset:0';
 const cx = (x) => 75 + x / 2.8, cy = (z) => 62 + z / 2.8; this.cx = cx; this.cy = cy;
 this.chart.innerHTML = '<div style="position:absolute;left:' + (cx(-72)) + 'px;top:' + (cy(-46)) + 'px;width:' + (144 / 2.8) + 'px;height:' + (92 / 2.8) + 'px;border-radius:50%;background:#9FB58A;border:1.5px solid #6E7F5C;box-sizing:border-box"></div><span style="position:absolute;left:' + (cx(-18)) + 'px;top:' + (cy(-6)) + 'px;font:700 8px Inter,sans-serif;color:#14253A">INSULA</span><div style="position:absolute;left:' + cx(-21) + 'px;top:' + cy(162) + 'px;width:2px;height:' + (26 / 2.8) + 'px;background:#6b4b2b"></div><svg width="150" height="150" style="position:absolute;inset:0"><polyline fill="none" stroke="#B4412E" stroke-width="1.6" stroke-dasharray="4 3" points=""/></svg>';
 this.routeLine = this.chart.querySelector('polyline');
 this.dest = document.createElement('div'); this.dest.style.cssText = 'position:absolute;width:12px;height:12px;margin:-6px 0 0 -6px;border-radius:50%;border:2px solid #B4412E;background:#FFC94A;display:none'; this.chart.appendChild(this.dest);
 this.dot = document.createElement('div'); this.dot.style.cssText = 'position:absolute;width:0;height:0;border-left:5px solid transparent;border-right:5px solid transparent;border-bottom:13px solid #B4412E;margin:-7px 0 0 -5px;transform-origin:5px 7px';
 this.chart.appendChild(this.dot); this.chartHost.appendChild(this.chart);
 this.clock = new T.Clock();
 const tick = () => { this.raf = requestAnimationFrame(tick); this.step(T, Math.min(0.05, this.clock.getDelta())); r.render(scene, cam); };
 tick();
}
prepIsland(T) {
 this.island.traverse((o) => {
  if (!o.isMesh) return;
  if (o.name.startsWith('Ile')) {
   const g = o.geometry, pos = g.attributes.position; g.computeVertexNormals(); const nor = g.attributes.normal; const col = new Float32Array(pos.count * 3); const c = new T.Color();
   const sand = new T.Color(0xcdb994), grass = new T.Color(0x6f8a4a), grass2 = new T.Color(0x8c9a58), rock = new T.Color(0x857b70);
   for (let i = 0; i < pos.count; i++) { const y = pos.getY(i), ny = nor.getY(i); if (y < 1.0) c.copy(sand); else c.copy(grass).lerp(grass2, Math.min(1, Math.max(0, (y - 4) / 10))); if (ny < 0.72) c.lerp(rock, Math.min(1, (0.72 - ny) * 4)); c.convertSRGBToLinear(); col[3 * i] = c.r; col[3 * i + 1] = c.g; col[3 * i + 2] = c.b; }
   g.setAttribute('color', new T.BufferAttribute(col, 3)); o.material = new T.MeshStandardMaterial({ vertexColors: true, roughness: 0.95 });
  }
  if (o.material && o.material.map) o.material.map.anisotropy = 4;
  o.userData.mat = o.material;
 });
 // quai : son bout côté large (le plus loin du centre de l'île) et des points pour les collisions
 this.island.updateMatrixWorld(true);
 const q = this.island.getObjectByName('Quai'); const v = new T.Vector3(); let best = -1, tip = null; const pts = new Map();
 if (q) q.traverse((o) => { if (!o.isMesh) return; const pa = o.geometry.attributes.position; for (let i = 0; i < pa.count; i++) { v.fromBufferAttribute(pa, i).applyMatrix4(o.matrixWorld); if (v.y < -1.5 || v.y > 4) continue; const rr = (v.x / 72) ** 2 + (v.z / 46) ** 2; if (rr > best) { best = rr; tip = v.clone(); } pts.set(Math.round(v.x * 2) + ',' + Math.round(v.z * 2), [v.x, v.z]); } });
 if (!tip) tip = new T.Vector3(-50, 0, 40);
 const o = new T.Vector2(tip.x / (72 * 72), tip.z / (46 * 46)).normalize();
 this.quaiPts = Array.from(pts.values()); this.out = o;
 this.D = { x: tip.x + o.x * 4.5, z: tip.z + o.y * 4.5 }; this.A = { x: tip.x + o.x * 32, z: tip.z + o.y * 32 };
 if (this.dest) { this.dest.style.left = this.cx(this.D.x) + 'px'; this.dest.style.top = this.cy(this.D.z) + 'px'; this.dest.style.display = 'block'; }
 this.buildLife(T);
}
// hauteur du dessus de l'île (sol, quai, toits) en (x, z)
topY(x, z, only) { const rc = this.rcY || (this.rcY = new window.THREE.Raycaster()); rc.set(new window.THREE.Vector3(x, 200, z), new window.THREE.Vector3(0, -1, 0)); const h = rc.intersectObject(only || this.island, true); return h.length ? h[0].point.y : 0; }
placeOfObj(o) { while (o && o.parent && o.parent !== this.island) o = o.parent; const n = (o && o.name) || ''; if (o && o.userData.place) return o.userData.place;
 if (n.startsWith('MaisonCommune') || n.startsWith('Drapeau') || n.startsWith('Cylinder')) return 'commune'; if (n.startsWith('Maison')) return 'village'; if (n.startsWith('Quai')) return 'quai'; if (n.startsWith('Entrepot')) return 'entrepot'; if (n.startsWith('Atelier')) return 'atelier'; if (n.startsWith('Insula') || n.startsWith('Place')) return 'insula'; if (n.startsWith('Antenne') || n.startsWith('Sphere')) return 'antenne'; return null; }
hitPlace(cx, cy) { const T = window.THREE, r = this.renderer.domElement.getBoundingClientRect(); const v = new T.Vector2(((cx - r.left) / r.width) * 2 - 1, -((cy - r.top) / r.height) * 2 + 1); const rc = new T.Raycaster(); rc.setFromCamera(v, this.cam);
 const objs = [this.life]; const vis = (o) => { while (o) { if (!o.visible) return false; o = o.parent; } return true; }; const h = rc.intersectObjects(objs.filter(Boolean), true).filter((x) => vis(x.object)); for (const x of h) { let o = x.object; while (o && !o.userData.place && o.parent) { if (o.parent === this.island) break; o = o.parent; } const k = (o && o.userData.place) || this.placeOfObj(x.object); if (k) return k; if (x.object.name.startsWith('Ile')) return null; } return null; }
buildLife(T) {
 const life = new T.Group(); this.life = life; this.planLife = new T.Group(); this.scene.add(life);
 const P = {}; PR_PLACES.forEach((pl) => { const [x, y, z] = B2T(...pl.p); P[pl.k] = { x, z, y, g: this.topY(x, z) }; }); this.P = P;
 const dir = new T.Vector2(-0.56, 0.83), sideV = new T.Vector2(0.83, 0.56); const face = Math.atan2(dir.x, dir.y);
 const wood = new T.MeshStandardMaterial({ color: new T.Color(0x3b2a1c).convertSRGBToLinear(), roughness: 0.8 });
 const tl = new T.TextureLoader(); this.focusPts = {};
 const clearTrees = (x, z, r) => this.trees.children.forEach((m) => { if (Math.hypot(m.position.x - x, m.position.z - z) < r) m.visible = false; });
 // --- cinéma en plein air : grand écran, bancs, faisceau du projecteur
 const W0 = 20, H0 = W0 / 1.6, lift = 2.5;
 const cx = P.insula.x + dir.x * 8 + sideV.x * 14, cz = P.insula.z + dir.y * 8 + sideV.y * 14, cg = this.topY(cx, cz);
 const cin = new T.Group(); cin.position.set(cx, cg, cz); cin.rotation.y = face; cin.userData.place = 'cinema';
 const fr = new T.Mesh(new T.BoxGeometry(W0 + 0.8, H0 + 0.8, 0.3), new T.MeshStandardMaterial({ color: 0x111111, roughness: 0.6 })); fr.position.y = lift + H0 / 2; cin.add(fr);
 for (const sx of [-W0 / 2 + 1, 0, W0 / 2 - 1]) { const post = new T.Mesh(new T.BoxGeometry(0.35, lift + H0, 0.35), wood); post.position.set(sx, (lift + H0) / 2 - 0.6, -0.4); cin.add(post); }
 const poster = tl.load('assets/demo-poster.jpg'); poster.encoding = T.sRGBEncoding;
 const scr = new T.Mesh(new T.PlaneGeometry(W0, H0), new T.MeshBasicMaterial({ map: poster, toneMapped: false })); scr.position.set(0, lift + H0 / 2, 0.17); cin.add(scr);
 const v = document.createElement('video'); v.src = 'assets/demo-insula.webm'; v.muted = true; v.loop = true; v.playsInline = true; this.video = v;
 v.addEventListener('playing', () => { const vt = new T.VideoTexture(v); vt.encoding = T.sRGBEncoding; scr.material.map = vt; scr.material.needsUpdate = true; }, { once: true });
 life.add(cin); clearTrees(cx, cz, W0 * 0.8);
 // bancs face à l'écran
 for (let row = 0; row < 4; row++) for (const lat of [-5.5, 0, 5.5]) { const d = 9 + row * 3.2; const x = cx + dir.x * d + sideV.x * lat, z = cz + dir.y * d + sideV.y * lat; const g = this.topY(x, z); const bn = new T.Mesh(new T.BoxGeometry(4.2, 0.5, 0.8), wood); bn.position.set(x, g + 0.45, z); bn.rotation.y = face; bn.userData.place = 'cinema'; life.add(bn); clearTrees(x, z, 3); }
 // faisceau
 const px = cx + dir.x * 24, pz = cz + dir.y * 24, pg = this.topY(px, pz) + 5; const proj = new T.Mesh(new T.BoxGeometry(1.2, 1, 1.6), new T.MeshStandardMaterial({ color: 0x222222 })); proj.position.set(px, pg, pz); proj.rotation.y = face; life.add(proj);
 const from = new T.Vector3(px, pg, pz), to = new T.Vector3(cx, cg + lift + H0 / 2, cz); const len = from.distanceTo(to);
 const beam = new T.Mesh(new T.CylinderGeometry(W0 * 0.42, 0.4, len, 4, 1, true), new T.MeshBasicMaterial({ color: 0xfff1c9, transparent: true, opacity: 0.07, depthWrite: false, side: T.DoubleSide, blending: T.AdditiveBlending }));
 beam.position.copy(from.clone().lerp(to, 0.5)); beam.quaternion.setFromUnitVectors(new T.Vector3(0, -1, 0), to.clone().sub(from).normalize()); beam.rotateY(Math.PI / 4); life.add(beam); this.beam = beam;
 this.focusPts.cinema = { x: cx, y: cg + lift + H0 / 2, z: cz, d: 30, pitch: 0.12 };
 // --- longue-vue : sur la hauteur près du quai, tournée vers l'insula
 const o = this.out, tip = { x: this.D.x - o.x * 4.5, z: this.D.z - o.y * 4.5 }; const lx = tip.x - o.x * 22 + o.y * 7, lz = tip.z - o.y * 22 - o.x * 7, lg = this.topY(lx, lz);
 const lv = new T.Group(); lv.position.set(lx, lg, lz); lv.userData.place = 'longuevue';
 const brass = new T.MeshStandardMaterial({ color: new T.Color(0xb58a3a).convertSRGBToLinear(), metalness: 0.8, roughness: 0.35 });
 for (let i = 0; i < 3; i++) { const a = i * 2.094; const leg = new T.Mesh(new T.CylinderGeometry(0.06, 0.08, 1.9, 6), wood); leg.position.set(Math.cos(a) * 0.45, 0.85, Math.sin(a) * 0.45); leg.rotation.set(Math.sin(a) * 0.28, 0, -Math.cos(a) * 0.28); lv.add(leg); }
 const tube = new T.Mesh(new T.CylinderGeometry(0.16, 0.26, 2.2, 16), brass); tube.position.y = 1.95; tube.rotation.z = Math.PI / 2 - 0.12; const yawTo = Math.atan2(-(P.insula.z - lz), P.insula.x - lx); const tg = new T.Group(); tg.add(tube); tg.rotation.y = yawTo; lv.add(tg);
 const lens = new T.Mesh(new T.CircleGeometry(0.24, 20), new T.MeshBasicMaterial({ color: 0x7fe6ff })); lens.position.set(1.1, 2.08, 0); lens.rotation.y = Math.PI / 2; tg.add(lens);
 lv.scale.setScalar(1.6); life.add(lv); clearTrees(lx, lz, 4);
 this.focusPts.longuevue = { x: lx, y: lg + 3, z: lz, d: 11, pitch: 0.22, yaw: Math.atan2(-(P.insula.x - lx), -(P.insula.z - lz)) };
 // repères qui pulsent : les deux choses à faire ici
 this.pulses = []; [['cinema', cx + dir.x * 6, cz + dir.y * 6, 4], ['longuevue', lx, lz, 2.6]].forEach(([k, x, z, r]) => { const ring = new T.Mesh(new T.RingGeometry(r, r + 0.6, 48), new T.MeshBasicMaterial({ color: 0xffc94a, transparent: true, opacity: 0.85, side: T.DoubleSide, depthWrite: false })); ring.rotation.x = -Math.PI / 2; ring.position.set(x, this.topY(x, z) + 0.2, z); ring.userData.place = k; life.add(ring); this.pulses.push(ring); });
 this.poi = { cinema: { n: '▶', name: 'Cinéma en plein air · la démo' }, longuevue: { n: '◉', name: 'Longue-vue · essayer Insula' } };
}
along(pts, seg, L, u) { let d = u * L; for (let i = 0; i < seg.length; i++) { if (d <= seg[i]) return pts[i].clone().lerp(pts[i + 1], d / seg[i]); d -= seg[i]; } return pts[pts.length - 1].clone(); }
focus(k) {
 const f = this.focusPts[k]; if (!f) return;
 Object.assign(this.orbW, { tx: f.x, tz: f.z, ty: f.y, yaw: f.yaw != null ? f.yaw : -0.59, pitch: f.pitch != null ? f.pitch : 0.2, dist: f.d });
 this.focused = k; this.say(PR_RADIO[k], 'LOUIS-MARIE');
 if (k === 'cinema' && this.video) this.video.play().catch(() => {});
 this.setState({ focus: k });
 if (k === 'longuevue') { clearTimeout(this.appT); this.appT = setTimeout(() => this.setState({ showApp: true }), 1400); }
}
overview() { Object.assign(this.orbW, { tx: 4, tz: -2, ty: 4, yaw: -0.59, pitch: this.st().plan ? 0.7 : 0.42, dist: 165 }); this.focused = null; this.setState({ focus: null }); }
lifeStep(T, t, dt) {
 if (!this.life) return;
 if (this.pulses) this.pulses.forEach((r, i) => { const u = (t * 0.6 + i * 0.4) % 1; r.scale.setScalar(1 + u * 0.5); r.material.opacity = 0.85 * (1 - u); r.visible = this.st().phase === 'accoste' && r.userData.place !== this.focused; });
 if (this.beam) this.beam.material.opacity = 0.06 + 0.02 * Math.sin(t * 7) * Math.sin(t * 2.3);
}

setPlan(on) {
 const T = window.THREE; if (!this.island) return;
 if (on && !this.planMat) { this.planMat = new T.MeshBasicMaterial({ color: new T.Color(0x184e8e).convertSRGBToLinear(), polygonOffset: true, polygonOffsetFactor: 1, polygonOffsetUnits: 1 }); this.lineMat = new T.LineBasicMaterial({ color: 0xffffff }); this.edges = new T.Group();
  this.island.updateMatrixWorld(true);
  this.island.traverse((o) => { if (!o.isMesh) return; const e = new T.LineSegments(new T.EdgesGeometry(o.geometry, o.name.startsWith('Ile') ? 50 : 28), this.lineMat); e.matrixAutoUpdate = false; e.matrix.copy(o.matrixWorld); this.edges.add(e); });
  this.scene.add(this.edges); const gc = new T.Color(0x3a78c0).convertSRGBToLinear(); this.grid = new T.GridHelper(700, 70, gc, gc); this.grid.position.y = -2.9; this.scene.add(this.grid); }
 this.island.traverse((o) => { if (o.isMesh) o.material = on ? this.planMat : o.userData.mat; });
 if (this.edges) this.edges.visible = on; if (this.grid) this.grid.visible = on;
 this.sea.visible = !on; this.trees.visible = !on; this.sky.visible = !on; this.ponton.visible = !on; if (this.boat) this.boat.visible = !on;
 this.scene.background = on ? new T.Color(0x0d3b7a) : null; this.scene.fog.color.copy(on ? new T.Color(0x0d3b7a).convertSRGBToLinear() : this.fogDay); this.scene.fog.far = on ? 2600 : 1350;
 if (this.life) this.life.visible = !on;
 this.setState({ plan: on }); this.layer.classList.toggle('pr-plan', on); this.focused = null; Object.assign(this.orbW, { tx: 4, tz: on ? 30 : -2, ty: 4, yaw: -0.59, pitch: on ? 0.95 : 0.42, dist: on ? 230 : 165 }); if (on) this.say(PR_RADIO.archi, 'LES COULISSES');
}
leave() { if (this.st().phase !== 'ponton') return; this.b.v = 1.5; this.b.h = Math.PI / 2; this.setState({ phase: 'mer' }); this.say(PR_RADIO.mer); }
// route qui contourne l'île (ellipse 72 × 46 m) par un point de passage au large
plan(from, to, depth) {
 depth = depth || 0; const inside = (x, z) => Math.hypot(x / 72, z / 46) < 1.25;
 let cross = false; for (let i = 1; i < 20; i++) { const f = i / 20; if (inside(from.x + (to.x - from.x) * f, from.z + (to.z - from.z) * f)) { cross = true; break; } }
 if (!cross || depth > 2) return [to];
 const a1 = Math.atan2(from.z / 46, from.x / 72), a2 = Math.atan2(to.z / 46, to.x / 72); let da = a2 - a1; while (da > Math.PI) da -= 2 * Math.PI; while (da < -Math.PI) da += 2 * Math.PI;
 const am = a1 + da / 2, w = { x: Math.cos(am) * 72 * 1.55, z: Math.sin(am) * 46 * 1.55 };
 return this.plan(from, w, depth + 1).concat(this.plan(w, to, depth + 1));
}
autopilot() { if (!this.A) return; this.setState({ ask: null }); const near = Math.hypot(this.b.x - this.P0.x, this.b.z - this.P0.z) < 30; const start = near ? { x: this.b.x, z: this.P0.z - 24 } : null; this.route = (start ? [start] : []).concat(this.plan(start || this.b, this.A)); this.autoDock = true; this.setState({ auto: true }); this.say("Je prends la barre et je t'emmène au quai d'Insula. Regarde la carte marine : la route est en pointillés."); }
dock() { if (!this.A) return; const d = Math.hypot(this.b.x - this.A.x, this.b.z - this.A.z); if (d > 40) { this.autopilot(); return; } this.route = []; this.startFinal(); }
startFinal() {
 const b = this.b, D = this.D, o = this.out; const f = { x: Math.cos(b.h), z: -Math.sin(b.h) }; const dd = Math.hypot(D.x - b.x, D.z - b.z);
 const P = [{ x: b.x, z: b.z }, { x: b.x + f.x * Math.min(12, dd / 3), z: b.z + f.z * Math.min(12, dd / 3) }, { x: D.x + o.x * 14, z: D.z + o.y * 14 }, { x: D.x, z: D.z }];
 const at = (t) => { const u = 1 - t; return { x: u * u * u * P[0].x + 3 * u * u * t * P[1].x + 3 * u * t * t * P[2].x + t * t * t * P[3].x, z: u * u * u * P[0].z + 3 * u * u * t * P[1].z + 3 * u * t * t * P[2].z + t * t * t * P[3].z }; };
 let len = 0, prev = at(0); for (let i = 1; i <= 30; i++) { const c = at(i / 30); len += Math.hypot(c.x - prev.x, c.z - prev.z); prev = c; }
 this.path = { at, len: Math.max(len, 1), t: 0 }; this.autoDock = false; this.setState({ phase: 'accostage', auto: false }); this.say('On réduit… je te mets le long du quai.');
}
// pénétration dans un obstacle (> 0 = dedans) : île, ponton de départ, quai
pen(x, z) {
 let p = 1.1 - Math.hypot(x / 72, z / 46);
 const P = this.P0, ax = 1.95 - Math.abs(x - P.x), az = 14 - Math.abs(z - P.z); if (ax > 0 && az > 0) p = Math.max(p, Math.min(ax, az));
 if (this.quaiPts && Math.hypot(x - this.D.x, z - this.D.z) < 40) { let m = 1e9; for (const [qx, qz] of this.quaiPts) m = Math.min(m, (qx - x) ** 2 + (qz - z) ** 2); p = Math.max(p, 1.6 - Math.sqrt(m)); }
 return p;
}
// on refuse seulement un pas qui s'enfonce dans l'obstacle : on peut toujours s'en dégager
blocked(x, z, ox, oz) { const pn = this.pen(x, z); return pn > 0 && pn >= this.pen(ox, oz); }
pick(i) { this.setState({ showCard: true, sel: i }); if (!this.st().plan) this.say(PR_PLACES[i].story[0], 'LOUIS-MARIE · ' + PR_PLACES[i].name.toUpperCase()); }
step(T, dt) {
 const s = this.st(), b = this.b, k = this.keys; const t = this.clock.elapsedTime;
 this.sea.material.uniforms.t.value = t;
 const ph = s.phase;
 if (ph === 'accostage' && this.path) {
  const P = this.path; const speed = Math.max(2.5, 9 * (1 - P.t)); P.t = Math.min(1, P.t + speed * dt / P.len);
  const c = P.at(P.t), c2 = P.at(Math.min(1, P.t + 0.01)); if (P.t < 0.995) b.h = Math.atan2(-(c2.z - c.z), c2.x - c.x);
  b.x = c.x; b.z = c.z; b.v = speed; b.turn *= 0.9;
  if (P.t >= 1) { this.path = null; b.v = 0; this.docked(); }
 } else if (ph === 'mer' || ph === 'approche') {
  let turn = 0, thr = 0;
  if (k['arrowleft'] || k['q'] || k['a'] || this.pad === 'L') turn += 1;
  if (k['arrowright'] || k['d'] || this.pad === 'R') turn -= 1;
  if (k['arrowup'] || k['z'] || k['w'] || this.pad === 'U') thr = 1;
  if (k['arrowdown'] || k['s']) thr = -1;
  if ((turn || thr) && this.route.length) { this.route = []; if (this.autoDock) { this.autoDock = false; this.setState({ auto: false }); this.say("D'accord, tu reprends la barre."); } }
  if (this.route.length) { const w = this.route[0]; const dx = w.x - b.x, dz = w.z - b.z, d = Math.hypot(dx, dz); let da = Math.atan2(-dz, dx) - b.h; while (da > Math.PI) da -= 2 * Math.PI; while (da < -Math.PI) da += 2 * Math.PI;
   turn = Math.max(-1, Math.min(1, da * 2.5)); thr = Math.abs(da) > 1.2 ? 0.35 : 1;
   if (d < (this.route.length > 1 ? 12 : 6)) { this.route.shift(); if (!this.route.length) { if (this.autoDock) this.startFinal(); else thr = 0; } } }
  const vmax = this.autoDock ? 18 : 8; b.v += (thr * vmax - b.v) * dt * (thr > 0 ? (this.autoDock ? 0.8 : 0.35) : 0.5) + (thr < 0 ? -2 * dt : 0); b.v = Math.max(0, Math.min(vmax, b.v));
  b.turn += (turn - b.turn) * dt * 3; b.h += b.turn * dt * (0.3 + b.v * 0.07);
  const nx = b.x + Math.cos(b.h) * b.v * dt, nz = b.z - Math.sin(b.h) * b.v * dt;
  if (!this.blocked(nx, nz, b.x, b.z)) { b.x = nx; b.z = nz; } else { b.v *= 0.2; }
  if (this.A) { const dq = Math.hypot(b.x - this.A.x, b.z - this.A.z); if (ph === 'mer' && dq < 45) { this.setState({ phase: 'approche' }); if (!this.autoDock) this.say(PR_RADIO.approche); } if (ph === 'approche' && dq > 60) this.setState({ phase: 'mer' }); }
 }
 if (this.boat) { const bo = this.boat; bo.position.set(b.x, 0.05 * Math.sin(t * 1.3) - 0.05, b.z); bo.rotation.set(0, 0, 0); bo.rotateY(b.h); bo.rotateX(-0.12 * (b.v / 7) - b.turn * 0.06 + 0.02 * Math.sin(t * 1.1)); bo.rotateZ(0.015 * Math.sin(t * 0.9)); }
 // caméra : derrière le bateau ; en montant, elle regarde le bateau lui-même
 const cam = this.cam;
 if (ph === 'accoste') { const O = this.orb, W2 = this.orbW, k2 = Math.min(1, dt * 2.2); if (W2.ty == null) W2.ty = 4; if (O.ty == null) O.ty = 4;
  for (const key of ['tx', 'tz', 'ty', 'pitch', 'dist']) O[key] += (W2[key] - O[key]) * k2; let dy = W2.yaw - O.yaw; while (dy > Math.PI) dy -= 2 * Math.PI; while (dy < -Math.PI) dy += 2 * Math.PI; O.yaw += dy * k2;
  const cp = Math.cos(O.pitch); cam.position.set(O.tx + Math.sin(O.yaw) * cp * O.dist, O.ty + Math.sin(O.pitch) * O.dist, O.tz + Math.cos(O.yaw) * cp * O.dist); if (cam.position.y < 2) cam.position.y = 2; cam.lookAt(O.tx, O.ty, O.tz); }
 else {
  const back = this.camDist + b.v * 0.5; const a = b.h + Math.PI + this.camYaw; const pc = this.camPitch;
  const tgt = new T.Vector3(b.x + Math.cos(a) * back * Math.cos(pc), 1.5 + back * Math.sin(pc), b.z - Math.sin(a) * back * Math.cos(pc));
  if (ph === 'ponton') tgt.set(b.x + 17, 7, b.z + 20);
  cam.position.lerp(tgt, Math.min(1, dt * (this.autoDock ? 4 : 2.5)));
  const f = Math.min(1, Math.max(0, (pc - 0.35) / 0.8));
  const ahead = new T.Vector3(b.x + Math.cos(b.h) * 8, 3, b.z - Math.sin(b.h) * 8), onBoat = new T.Vector3(b.x, 1, b.z);
  this.look = ahead.lerp(onBoat, f);
  cam.lookAt(ph === 'ponton' ? new T.Vector3(b.x - 5, 2.5, b.z - 12) : this.look);
 }
 this.lifeStep(T, t, dt);
 if (ph === 'accoste' && this.mouse && this.island && (this.hovT = (this.hovT || 0) + dt) > 0.08) { this.hovT = 0; const k = this.hitPlace(this.mouse.x, this.mouse.y); const r0 = this.renderer.domElement.getBoundingClientRect(); this.renderer.domElement.style.cursor = k ? 'pointer' : 'grab';
  if (k) { const pl = this.poi[k]; this.tip.innerHTML = '<b>' + pl.n + '</b>' + pl.name; this.tip.style.display = 'block'; this.tip.style.left = (this.mouse.x - r0.left) + 'px'; this.tip.style.top = (this.mouse.y - r0.top - 14) + 'px'; } else this.tip.style.display = 'none'; }
 if (ph !== 'accoste' && this.tip) this.tip.style.display = 'none';
 // étiquettes
 const show = ph === 'accoste'; const W = this.host.clientWidth, H = this.host.clientHeight;
 this.labels.forEach((L) => { if (!show) { L.el.style.display = 'none'; return; } const p = L.v.clone().project(cam); if (p.z > 1) { L.el.style.display = 'none'; return; } L.el.style.display = 'block'; L.el.style.left = ((p.x + 1) / 2 * W) + 'px'; L.el.style.top = ((1 - p.y) / 2 * H) + 'px'; });
 // carte marine : 1 px = 2,8 m ; route en pointillés
 this.dot.style.left = this.cx(b.x) + 'px'; this.dot.style.top = this.cy(b.z) + 'px'; this.dot.style.transform = 'rotate(' + (90 - b.h * 180 / Math.PI) + 'deg)';
 const rt = this.route.length ? [b].concat(this.route) : (this.path ? [b, this.D] : []);
 if (this.autoDock && this.route.length && this.D) rt.push(this.D);
 this.routeLine.setAttribute('points', rt.map((p) => this.cx(p.x).toFixed(1) + ',' + this.cy(p.z).toFixed(1)).join(' '));
}
docked() { const c = this.cam.position, O = this.orb; O.tx = this.b.x; O.tz = this.b.z; O.ty = 2; O.dist = Math.max(30, Math.hypot(c.x - this.b.x, c.z - this.b.z)); O.yaw = Math.atan2(c.x - this.b.x, c.z - this.b.z); O.pitch = 0.3; this.overview(); this.setState({ phase: 'accoste', showCard: false }); this.say(PR_RADIO.accoste); if (this.video) this.video.play().catch(() => {}); }
renderVals() {
 const s = this.st(), ph = s.phase || 'ponton', plan = !!s.plan, sel = s.sel == null ? -1 : s.sel;
 const acts = [];
 if (ph === 'ponton') acts.push({ label: 'Larguer les amarres ⚓', cls: 'pr-btn', go: () => this.leave() });
 if ((ph === 'mer' || ph === 'approche') && s.auto) acts.push({ label: 'Reprendre la barre', cls: 'pr-btn2', go: () => { this.route = []; this.autoDock = false; this.setState({ auto: false }); } });
 if (ph === 'mer' && !s.auto) acts.push({ label: 'Pilote auto → Insula', cls: 'pr-btn', go: () => this.autopilot() });
 if (ph === 'approche' && !s.auto) acts.push({ label: 'Accoster', cls: 'pr-btn', go: () => this.dock() });
 if (ph === 'accoste') { if (s.focus && !plan) acts.push({ label: "← Vue d'ensemble", cls: 'pr-btn2', go: () => this.overview() }); if (!plan) { acts.push({ label: '▶ Cinéma', cls: 'pr-btn2', go: () => this.focus('cinema') }); acts.push({ label: '◉ Longue-vue', cls: 'pr-btn2', go: () => this.focus('longuevue') }); } acts.push({ label: plan ? "Revenir à l'île" : "Voir l'architecture", cls: 'pr-btn2', go: () => this.setPlan(!plan) }); acts.push({ label: 'Reprendre la mer', cls: 'pr-btn', go: () => { if (plan) this.setPlan(false); this.focused = null; this.b.h = Math.atan2(-this.out.y, this.out.x); this.b.v = 2; this.setState({ phase: 'mer', showCard: false, auto: false, focus: null, showApp: false }); this.say('Bon vent ! Les autres îles arrivent bientôt.'); } }); }
 const hint = ph === 'ponton' ? 'Glissez pour regarder autour · « Larguer les amarres » pour partir' : ph === 'accoste' ? "Glissez pour tourner autour de l'île · clic droit ou Maj + glisser pour la déplacer · molette pour zoomer · cliquez sur le cinéma ou la longue-vue" : 'Flèches ou ZQSD pour barrer · glisser pour tourner la vue, molette pour zoomer · cliquez sur une île pour y aller en pilote auto';
 let card = Object.assign({ bg: 'rgba(251,247,238,.97)', fg: '#14253A', accent: '#B4412E', try: false }, PR_CARNET);
 if (sel >= 0) { const pl = PR_PLACES[sel]; card = { bg: plan ? 'rgba(13,59,122,.96)' : 'rgba(251,247,238,.97)', fg: plan ? '#FFFFFF' : '#14253A', accent: plan ? '#FFC94A' : '#B4412E', kicker: (plan ? 'MODE PLAN · BRIQUE ' : 'LIEU ') + pl.n, title: pl.title, paras: plan ? pl.tech : pl.story, try: !!pl.try, foot: plan ? 'Détail technique' : 'Passez en mode plan pour le détail technique.' }; }
 else if (plan) card = Object.assign({}, card, { bg: 'rgba(13,59,122,.96)', fg: '#FFFFFF', accent: '#FFC94A', kicker: 'MODE PLAN', title: 'Le trajet de la donnée', paras: ['Quai (sources) → entrepôt (relevé du soir) → atelier (calcul) → insula (app) → maison commune (base partagée). L\'antenne branche le tout sur une IA.', 'Cliquez sur un numéro pour le détail de chaque brique.'], foot: 'JavaScript · MapLibre · Python · Supabase · Playwright · GitHub Pages · MCP' });
 const touch = typeof window !== 'undefined' && ('ontouchstart' in window);
 return {
  setHost: (el) => { this.host = el; }, setLayer: (el) => { this.layer = el; }, setChart: (el) => { this.chartHost = el; },
  hint, radio: s.radio || '', radioFrom: s.radioFrom || 'LOUIS-MARIE', actions: acts,
  showCard: !!s.showCard && ph === 'accoste', card, closeCard: () => this.setState({ showCard: false }),
  loading: s.loading !== false, loadMsg: s.loadMsg || '',
  showPads: touch && (ph === 'mer' || ph === 'approche'),
  ask: !!s.ask && (ph === 'mer' || ph === 'approche'), askX: s.ask ? Math.min(s.ask.x, 1100) : 0, askY: s.ask ? s.ask.y : 0, askGo: () => this.autopilot(), askNo: () => this.setState({ ask: null }),
  showApp: !!s.showApp && ph === 'accoste', closeApp: () => { this.setState({ showApp: false }); this.overview(); this.say("Alors, convaincu ? Tu peux y retourner quand tu veux avec la longue-vue."); },
  showArchi: !!s.plan && ph === 'accoste',
  padL: () => { this.pad = 'L'; }, padR: () => { this.pad = 'R'; }, padU: () => { this.pad = 'U'; }, padOff: () => { this.pad = null; }
 };
}
}
