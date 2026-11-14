/* Monde 3D : mer, Elba, île d'Insula. Repris du prototype du canvas (Round 11). */

const PR_TREES = [[1,18.5,-33.4,3.62,3.66,0.64],[0,50.1,-22.3,1.97,0.44,1.12],[1,-50.1,-5.9,4.25,1.4,0.65],[1,15.6,35.0,4.73,0.31,0.83],[0,-34.1,4.4,6.52,0.91,1.04],[1,38.7,-25.0,2.69,1.18,0.83],[1,-49.3,16.6,2.38,1.29,0.62],[3,22.1,-5.7,6.74,5.8,0.79],[0,-16.9,-19.7,6.38,1.53,1.25],[3,9.1,2.0,7.53,1.81,0.89],[0,-10.0,20.1,8.19,2.65,1.37],[3,7.1,22.6,8.06,2.2,0.74],[0,-0.4,23.2,8.08,5.93,1.32],[0,-3.2,12.8,8.04,1.94,1.27],[2,9.5,14.2,7.94,2.42,0.71],[0,-4.7,-26.0,4.77,1.37,1.15],[2,-26.0,18.6,7.45,5.47,0.76],[1,-51.3,-4.0,3.8,0.86,0.71],[2,-8.5,3.9,7.83,4.29,0.99],[0,-14.6,-21.1,6.18,1.46,0.99],[1,-32.6,-1.2,6.6,1.77,0.67],[1,-43.4,2.7,4.74,5.99,0.83],[1,23.3,1.2,7.27,4.65,0.86],[1,-5.3,29.0,7.48,2.51,0.76],[0,-48.5,10.5,3.42,6.18,1.0],[1,-7.3,-30.5,4.39,0.0,0.62],[0,-16.7,-37.1,2.04,0.93,1.21],[3,-30.3,-11.9,4.07,0.72,0.79],[2,-1.5,37.4,4.97,0.54,0.79],[3,-48.7,-12.3,4.05,4.35,0.79],[1,2.0,-23.1,5.86,4.33,0.74],[3,50.7,20.2,9.38,5.42,0.99],[3,24.0,-18.7,5.95,2.23,0.96],[1,-33.9,3.3,6.41,1.4,0.73],[2,43.2,23.9,10.7,1.42,0.9],[0,2.2,-11.3,7.42,4.96,1.39],[1,-3.4,-24.0,5.38,2.81,0.98],[0,55.7,-10.6,3.42,2.95,0.95],[1,-19.9,-1.4,6.86,3.01,0.94],[0,18.7,23.4,7.24,0.75,1.32],[0,-13.6,16.5,7.71,1.12,1.14],[2,35.4,-13.1,5.33,4.67,0.79],[0,11.1,-2.7,7.46,3.74,1.21],[0,-3.1,34.2,6.53,0.82,1.17],[0,18.3,2.1,7.48,5.47,1.12],[3,39.9,-22.6,2.98,3.15,0.69],[1,32.3,-13.6,5.74,0.82,0.77],[2,50.2,-11.4,3.7,5.12,0.86],[1,2.1,25.6,7.61,0.95,0.65],[0,1.3,29.2,7.54,4.87,1.2],[0,14.6,-29.7,4.09,3.26,1.06],[0,6.8,22.2,8.11,0.36,1.34],[0,-49.2,-3.7,4.2,5.73,1.28],[1,-6.9,8.8,7.62,1.25,0.84],[2,-27.3,0.6,7.29,1.56,0.8],[3,2.8,29.4,7.43,5.61,0.97],[2,-36.4,-4.1,5.98,2.78,0.65],[0,-52.3,13.3,1.89,0.97,1.35],[0,26.5,12.5,8.51,0.86,1.03],[0,-3.9,19.3,8.19,3.06,1.1],[0,60.0,26.0,1.27,6.24,1.25],[3,-11.8,-6.2,7.64,4.54,0.73],[2,-58.8,4.2,2.26,2.41,0.88],[0,2.1,-16.0,7.08,5.77,0.96],[0,-33.2,29.4,4.72,0.25,1.03],[0,34.1,-18.0,5.17,5.34,1.31],[2,21.5,34.9,3.0,5.77,0.66],[0,8.6,15.7,7.98,5.02,1.04],[3,-38.8,30.9,2.88,3.98,0.98],[3,44.4,-3.6,5.16,2.62,1.0],[0,50.8,9.5,7.04,1.5,1.16],[0,-23.0,-15.2,6.53,3.14,1.04],[2,6.2,-24.3,5.57,2.81,0.7],[2,19.4,11.7,7.81,5.58,0.82],[0,57.6,-15.0,2.17,2.15,1.39],[0,40.7,16.2,13.76,2.18,1.1],[3,-52.5,18.8,1.16,0.35,0.77],[1,20.2,-9.3,6.9,1.77,0.87],[2,-5.0,-26.8,4.62,2.29,0.6],[3,-20.9,37.9,2.92,6.06,0.7],[0,-23.3,-11.2,6.95,0.53,1.07],[0,-27.1,12.2,7.38,0.03,1.15],[0,-12.3,-35.8,2.06,3.95,1.05],[1,43.2,-27.0,1.62,2.05,0.76],[0,27.4,11.2,8.51,4.49,1.31],[1,1.6,-5.5,7.43,3.29,0.66],[0,0.5,26.2,7.87,3.67,1.31],[0,48.1,14.3,11.1,0.26,0.94],[2,16.8,35.9,3.75,3.51,0.93],[0,15.6,9.9,7.56,0.02,1.14],[1,36.4,19.4,12.36,0.58,0.96],[2,3.2,19.2,7.89,0.47,0.7],[0,-28.7,17.9,7.09,4.08,1.02],[0,-4.9,27.0,7.73,4.29,1.14],[0,32.7,9.1,9.02,0.93,0.94],[3,-30.1,19.0,6.92,0.84,0.85],[0,-2.2,-1.1,7.83,4.24,1.25],[2,-25.6,1.3,7.18,4.82,0.79],[3,60.4,3.8,3.47,5.88,0.99],[1,-59.1,-3.2,2.45,2.82,0.99],[1,54.5,-22.6,1.74,4.69,0.64],[1,-29.2,-11.0,5.44,3.19,0.93],[0,47.4,15.9,12.03,5.5,1.15],[2,-13.0,-26.7,4.93,2.55,0.87],[2,27.8,-6.6,6.41,5.28,0.73],[0,41.5,-29.7,1.19,5.66,1.26],[2,-25.7,-10.0,6.61,5.46,0.76],[3,31.3,27.7,6.35,5.24,0.64],[0,-26.2,34.1,5.15,2.74,1.39],[2,-22.6,21.4,7.59,5.1,0.95],[1,16.0,32.3,5.73,4.52,0.82],[3,-6.0,19.8,8.26,5.73,0.79],[2,6.1,-25.7,5.19,1.87,0.74],[3,-29.4,12.2,7.11,4.2,0.79],[0,-46.5,11.2,4.18,5.69,1.0],[3,-0.4,-21.9,6.1,2.83,1.0],[0,-50.1,-12.4,3.74,2.31,1.06],[0,37.9,-23.3,3.18,2.59,1.27],[2,-10.5,1.9,7.65,4.72,0.71]];
// [image, largeur, hauteur, zmin] des imposteurs (rendus Blender, marge 3 %)
const PR_TREE_IMG = [['assets/arbre_island_tree_01.webp', 4.76, 5.03, -0.02], ['assets/arbre_pine_tree_01_a.webp', 7.6, 20.37, -0.08], ['assets/arbre_pine_tree_01_b.webp', 7.22, 14.88, -0.09], ['assets/arbre_pine_tree_01_c.webp', 7.63, 17.54, -0.09]];
const PR_RADIO = {
 ponton: "Elba, Elba, ici Louis-Marie. Bienvenue à bord ! C'est toi qui barres, moi je te guide à la radio. La carte marine, en haut à droite, montre tout le voyage. Quand tu es prêt, largue les amarres.",
 mer: "Cap au nord : l'île droit devant, c'est Insula, mon premier projet. Barre avec les flèches (ou ZQSD), ou clique sur l'île : le pilote auto t'y emmène.",
 approche: "Tu vois l'immeuble blanc sur le quai, avec le panneau rouge au balcon ? C'est là. Approche doucement, je t'aide à accoster.",
 accoste: "Bien accosté ! Avec des amis, on voulait acheter un petit appartement à louer. Il fallait comparer des villes, des quartiers, des annonces. Alors j'ai construit Insula. Le studio du premier est à vendre : monte le visiter, la porte est ouverte.",
 panneau: "Studio de 18 mètres carrés, 9,4 % par an sur quinze ans, revente comprise. Ce chiffre, c'est Insula qui l'a calculé. Monte le voir : la porte est en bas, à droite.",
 archi: "Les coulisses : chaque soir, une routine relève les annonces, les fiches sont lues, le moteur fait les comptes, et rien n'est publié sans passer les tests. Une IA peut même interroger l'app.",
 plan: "Voilà l'envers du décor : le chemin de la donnée, des sources publiques jusqu'à l'app.",
 lieu: "Regarde bien, c'est ici que ça se passe."
};
const PR_CARNET = { kicker: 'CARNET DU PROJET · ÎLE N° 1', title: 'Insula',
 paras: ["Choisir où acheter, entre amis, avec les bons critères.",
  "Je voulais acheter un appartement avec des amis. Très vite, il a fallu comparer des villes, des quartiers, puis des annonces. Les sites d'annonces montrent un bien à la fois ; il nous fallait les mettre côte à côte, avec nos critères, pour décider ensemble.",
  "Alors j'ai construit l'outil qui nous manquait. Insula, en latin, c'est l'île, et aussi l'immeuble de rapport romain."],
 foot: "22 villes · ~15 sources publiques · relevé chaque soir · 15 ans de calcul" };
const B2T = (x, y, z) => [x, z, -y];
class Component extends DCLogic {
componentDidMount() { this.reduced = window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches; this.narrow = innerWidth <= 760; try { this.visitedSet = JSON.parse(localStorage.getItem('elba-escales') || '{}'); } catch (e) { this.visitedSet = {}; } this.setState({ loading: true, loadMsg: 'chargement des modèles…', phase: 'archipel', radio: '', radioFrom: 'LOUIS-MARIE', showCard: false, plan: false, auto: false }); this.say(PR_RADIO.archipel); this.init(); }
componentWillUnmount() { clearTimeout(this.retry); clearInterval(this.typer); cancelAnimationFrame(this.raf); if (this.ro) this.ro.disconnect(); if (this.kd) { window.removeEventListener('keydown', this.kd); window.removeEventListener('keyup', this.ku); } if (this.renderer) { this.renderer.dispose(); const c = this.renderer.domElement; if (c.parentNode) c.parentNode.removeChild(c); } }
st() { return this.state || {}; }
gestInsula() { try { return localStorage.getItem('elba-gestes') !== 'classique'; } catch (e) { return true; } }
say(text, from, noLog) {
 if (!noLog) { this.radioLog = (this.radioLog || []).concat([[text, from || 'LOUIS-MARIE']]).slice(-6); this.radioIdx = this.radioLog.length - 1; }
 clearInterval(this.typer); let i = 0;
 if (this.reduced) { this.setState({ radio: text, radioFrom: from || 'LOUIS-MARIE' }); return; }
 this.setState({ radio: '', radioFrom: from || 'LOUIS-MARIE' });
 this.typer = setInterval(() => { i += 2; this.setState({ radio: text.slice(0, i) }); if (i >= text.length) clearInterval(this.typer); }, 28);
}
radioPrev() { const L = this.radioLog || []; if (!L.length) return; this.radioIdx = ((this.radioIdx == null ? L.length - 1 : this.radioIdx) - 1 + L.length) % L.length; const [t, f] = L[this.radioIdx]; clearInterval(this.typer); this.setState({ radio: t, radioFrom: f + ' · ' + (this.radioIdx + 1) + '/' + L.length }); }
b64(s) { const bin = atob(s); const u = new Uint8Array(bin.length); for (let i = 0; i < bin.length; i++) u[i] = bin.charCodeAt(i); return u.buffer; }
init() {
 const T = window.THREE;
 if (!T || !T.GLTFLoader || !this.host || !this.layer) { this.retry = setTimeout(() => this.init(), 200); return; }
 const host = this.host; let W = host.clientWidth || 1440, H = host.clientHeight || 900;
 const r = new T.WebGLRenderer({ antialias: true }); r.setPixelRatio(Math.min(devicePixelRatio || 1, 2)); r.setSize(W, H);
 T.ColorManagement.enabled = false; r.outputColorSpace = T.SRGBColorSpace; r.toneMapping = T.ACESFilmicToneMapping; r.toneMappingExposure = 1.05;
 host.appendChild(r.domElement); this.renderer = r;
 const scene = new T.Scene(); this.scene = scene;
 const FOG = new T.Color(0xeed3bd).convertSRGBToLinear(); this.fogDay = FOG.clone(); scene.fog = new T.Fog(FOG, 220, 1350);
 const cam = new T.PerspectiveCamera(50, W / H, 0.3, 3000); this.cam = cam;
 // ciel d'aube
 const sky = new T.Mesh(new T.SphereGeometry(1500, 64, 32), new T.ShaderMaterial({ side: T.BackSide, depthWrite: false, fog: false,
  uniforms: { top: { value: new T.Color(0x5d86b8) }, hor: { value: new T.Color(0xf2cfb0) }, sun: { value: new T.Vector3(-0.35, 0.12, -0.93).normalize() }, glow: { value: 1 }, gain: { value: 1 } },
  vertexShader: 'varying vec3 vP; void main(){ vP = normalize(position); gl_Position = projectionMatrix * modelViewMatrix * vec4(position,1.0); }',
  fragmentShader: 'uniform vec3 top; uniform vec3 hor; uniform vec3 sun; uniform float glow; uniform float gain; varying vec3 vP; void main(){ vec3 d = normalize(vP); float h = clamp(d.y,0.0,1.0); vec3 c = mix(hor, top, pow(h,0.55)); float s = max(dot(d,sun),0.0); c += (vec3(1.0,0.8,0.6)*pow(s,300.0)*1.2 + vec3(1.0,0.65,0.45)*pow(s,12.0)*0.12)*glow; gl_FragColor = vec4(pow(c, vec3(2.2)) * gain, 1.0);\n#include <tonemapping_fragment>\n#include <colorspace_fragment>\n }' }));
 scene.add(sky); this.sky = sky;
 const hemi = new T.HemisphereLight(0xcfe0ff, 0x6b5a48, 0.75 * LUX); scene.add(hemi); this.hemi = hemi;
 const sun = new T.DirectionalLight(0xffe2c4, 1.35 * LUX); sun.position.set(-160, 120, -300); scene.add(sun); this.sunL = sun;
 // mer
 const sea = new T.Mesh(new T.PlaneGeometry(3000, 3000, 220, 220), new T.ShaderMaterial({ fog: true,
  uniforms: T.UniformsUtils.merge([T.UniformsLib.fog, { t: { value: 0 }, deep: { value: new T.Color(0x0d3a5c) }, shallow: { value: new T.Color(0x2f7f9a) }, skyc: { value: new T.Color(0xf0d2b8) }, sunDir: { value: new T.Vector3(-0.35, 0.2, -0.93).normalize() }, spec: { value: new T.Color(1.0, 0.85, 0.65) }, gain: { value: 1 } }]),
  vertexShader: 'uniform float t; varying vec3 vW; varying vec3 vN; #include <fog_pars_vertex>\n void main(){ vec3 p = position; float x = p.x, y = -p.y; float h = 0.22*sin(0.11*x+0.7*t)+0.16*sin(0.13*y*1.3+0.9*t+x*0.03)+0.08*sin(0.31*(x+y)+1.6*t); float dx = 0.22*0.11*cos(0.11*x+0.7*t)+0.16*0.03*cos(0.169*y+0.9*t+x*0.03)+0.08*0.31*cos(0.31*(x+y)+1.6*t); float dy = 0.16*0.169*cos(0.169*y+0.9*t+x*0.03)+0.08*0.31*cos(0.31*(x+y)+1.6*t); p.z += h; vec4 w = modelMatrix*vec4(p,1.0); vW = w.xyz; vN = normalize(vec3(-dx, 1.0, dy)); vec4 mvPosition = viewMatrix*w; gl_Position = projectionMatrix*mvPosition; #include <fog_vertex>\n }'.replace(/#include <fog_pars_vertex>/, '\n#include <fog_pars_vertex>').replace(/#include <fog_vertex>/, '\n#include <fog_vertex>'),
  fragmentShader: 'uniform vec3 deep; uniform vec3 shallow; uniform vec3 skyc; uniform vec3 sunDir; uniform vec3 spec; uniform float gain; varying vec3 vW; varying vec3 vN;\n#include <fog_pars_fragment>\n void main(){ vec3 V = normalize(cameraPosition - vW); float fr = pow(1.0 - max(dot(V, vN), 0.0), 3.0); vec3 c = mix(deep, shallow, 0.35) ; c = mix(c, skyc, clamp(fr*0.9,0.0,0.85)); vec3 R = reflect(-V, vN); float sp = pow(max(dot(R, sunDir), 0.0), 600.0); c += spec*sp*0.9; gl_FragColor = vec4(pow(c, vec3(2.2)) * gain, 1.0);\n#include <fog_fragment>\n#include <tonemapping_fragment>\n#include <colorspace_fragment>\n }' }));
 sea.rotation.x = -Math.PI / 2; scene.add(sea); this.sea = sea;
 // ponton de départ (planches)
 const wood = new T.MeshStandardMaterial({ color: new T.Color(0x7a5a3a).convertSRGBToLinear(), roughness: 0.9 });
 const ponton = new T.Group(); const P0 = new T.Vector3(-20, 0, 175);
 const deck = new T.Mesh(new T.BoxGeometry(2.6, 0.18, 26), wood); deck.position.set(0, 0.32, 0); ponton.add(deck);
 for (let i = -12; i <= 12; i += 3) for (const sx of [-1.25, 1.25]) { const pile = new T.Mesh(new T.CylinderGeometry(0.14, 0.14, 4, 8), wood); pile.position.set(sx, -1.4, i); ponton.add(pile); }
 for (let i = -12; i <= 12; i += 6) { const bol = new T.Mesh(new T.CylinderGeometry(0.12, 0.14, 0.35, 10), wood); bol.position.set(1.15, 0.55, i); ponton.add(bol); }
 ponton.position.copy(P0); scene.add(ponton); this.ponton = ponton;
 // arbres (imposteurs croisés)
 const tl = new T.TextureLoader(); const treeMats = PR_TREE_IMG.map((d) => { const tx = tl.load(d[0]); tx.colorSpace = T.SRGBColorSpace; return new T.MeshLambertMaterial({ map: tx, alphaTest: 0.45, side: T.DoubleSide, transparent: false }); }); this.treeMats = treeMats;
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
  loader.load('assets/ile_insula.glb', (gi) => { this.island = gi.scene; scene.add(gi.scene); this.prepIsland(T); this.bakeIsland(T); this.renduOmbres(T, scene); this.setState({ loading: false }); }, (ev) => { if (ev.total) this.setState({ loadMsg: "l'île d'Insula : " + Math.round(100 * ev.loaded / ev.total) + ' %' }); }, (e) => this.setState({ loadMsg: 'erreur île : ' + e }));
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
 r.domElement.addEventListener('pointerdown', (e) => { try { r.domElement.setPointerCapture(e.pointerId); } catch (er) {} document.body.classList.add('dragging'); down = { x: e.clientX, y: e.clientY, yaw: this.camYaw, pitch: this.camPitch, moved: false, pan: this.gestInsula() ? !(e.button === 2 || e.ctrlKey || e.shiftKey || e.altKey || e.metaKey) : (e.button === 2 || e.shiftKey), o: Object.assign({}, this.orb), cl: this.cabin ? this.cabin.look.clone() : null, cp: this.cabin ? this.cabin.cam.position.clone() : null, sl: this.stu ? this.stu.look.clone() : null, sp: this.cam.position.clone() }; if (this.orbitPh(this.st().phase)) Object.assign(this.orbW, { tx: this.orb.tx, tz: this.orb.tz, ty: this.orb.ty, yaw: this.orb.yaw, pitch: this.orb.pitch, dist: this.orb.dist }); });
 r.domElement.addEventListener('pointermove', (e) => { this.mouse = { x: e.clientX, y: e.clientY }; if (!down) return; const dx = e.clientX - down.x, dy = e.clientY - down.y; if (Math.abs(dx) + Math.abs(dy) > 5) down.moved = true;
  const phx = this.st().phase;
  if (phx === 'cabine') { if (down.moved && down.cl && this.cabCanLook()) this.cabTurn(down.cl, dx * 0.005, dy * 0.004); else if (down.moved && down.cp && this.cabCanOrbit()) this.cabOrbit(down.cp, dx * 0.006, dy * 0.004); return; }
  if (phx === 'studio') { if (down.moved && down.sl && this.stuCanLook()) this.stuTurn(down.sl, dx * 0.005, dy * 0.004); else if (down.moved && this.stuCanOrbit()) this.stuOrbit(down.sp, dx * 0.006, dy * 0.004); return; }
  if (this.orbitPh(phx)) { const o = this.orbW, O = this.orb, d0 = down.o;
   if (down.pan) { // clic droit / Maj + glisser = déplacer : le point saisi reste sous le curseur
    const rc = r.domElement.getBoundingClientRect(); const hitAt = (px, py) => { ndc.set(((px - rc.left) / rc.width) * 2 - 1, -((py - rc.top) / rc.height) * 2 + 1); ray.setFromCamera(ndc, cam); const pl = new T.Plane(new T.Vector3(0, 1, 0), -O.ty); const h = new T.Vector3(); return ray.ray.intersectPlane(pl, h) ? h : null; };
    const prev = down.last || { x: down.x, y: down.y }; const h0 = hitAt(prev.x, prev.y), h1 = hitAt(e.clientX, e.clientY); down.last = { x: e.clientX, y: e.clientY };
    if (h0 && h1) { let tx = O.tx + (h0.x - h1.x), tz = O.tz + (h0.z - h1.z); [tx, tz] = this.clampPan(tx, tz); O.tx = o.tx = tx; O.tz = o.tz = tz; this.placeCam(); }
   } else { o.yaw = O.yaw = d0.yaw - dx * 0.006; o.pitch = O.pitch = Math.max(0.12, Math.min(1.35, d0.pitch + dy * 0.004)); this.placeCam(); }
   return; }
  this.camYaw = down.yaw - dx * 0.005; this.camPitch = Math.max(0.05, Math.min(1.45, down.pitch + dy * 0.004)); });
 r.domElement.addEventListener('wheel', (e) => { e.preventDefault(); const ph = this.st().phase; const isle = this.orbitPh(ph);
  const tp = !e.ctrlKey && e.deltaMode === 0 && (Math.abs(e.deltaX) > 0.5 || (Math.abs(e.deltaY) < 40 && e.deltaY % 1 !== 0)); const ins = this.gestInsula(); const pad = !ins && tp, mul = ins && tp ? 2 : 1;
  if (ph === 'studio' && this.stuCanOrbit()) { if (pad) this.stuOrbit(this.cam.position.clone(), -e.deltaX * 0.005, -e.deltaY * 0.004); else this.stuDolly(Math.exp(Math.max(-60, Math.min(60, e.deltaMode === 1 ? e.deltaY * 16 : e.deltaY * (e.ctrlKey ? 2.5 : 1) * mul)) * 0.0015)); return; }
  if (ph === 'cabine' && this.cabCanOrbit()) { if (pad) this.cabOrbit(this.cabin.cam.position.clone(), -e.deltaX * 0.005, -e.deltaY * 0.004); else this.cabDolly(Math.exp(Math.max(-60, Math.min(60, e.deltaMode === 1 ? e.deltaY * 16 : e.deltaY * (e.ctrlKey ? 2.5 : 1) * mul)) * 0.0015)); return; }
  if (ph === 'studio') { if (!this.stuCanLook()) return; if (pad) this.stuTurn(this.stu.look.clone(), e.deltaX * 0.005, e.deltaY * 0.004); else this.stuZoom(Math.exp(Math.max(-60, Math.min(60, e.deltaMode === 1 ? e.deltaY * 16 : e.deltaY * (e.ctrlKey ? 2.5 : 1) * mul)) * 0.0015)); return; }
  if (ph === 'cabine') { if (!this.cabCanLook()) return; if (pad) this.cabTurn(this.cabin.look.clone(), e.deltaX * 0.005, e.deltaY * 0.004); else this.cabZoom(Math.exp(Math.max(-60, Math.min(60, e.deltaMode === 1 ? e.deltaY * 16 : e.deltaY * (e.ctrlKey ? 2.5 : 1) * mul)) * 0.0015)); return; }
  if (pad) { // deux doigts sur le trackpad : pivoter, comme en glissant
   const dx = e.deltaX, dy = e.deltaY;
   if (isle) { const O = this.orb, o = this.orbW; o.yaw = O.yaw = O.yaw - dx * 0.006; o.pitch = O.pitch = Math.max(0.12, Math.min(1.35, O.pitch + dy * 0.004)); this.placeCam(); }
   else { this.camYaw -= dx * 0.005; this.camPitch = Math.max(0.05, Math.min(1.45, this.camPitch + dy * 0.004)); }
   return; }
  const d = Math.max(-60, Math.min(60, e.deltaMode === 1 ? e.deltaY * 16 : e.deltaY * (e.ctrlKey ? 2.5 : 1) * mul)); const f = Math.exp(d * 0.0012);
  if (isle) { const L = this.distLim(ph); const want = this.orbW.dist * f; this.orbW.dist = Math.max(L[0], Math.min(L[1], want));
   if ((ph === 'accoste' || ph === 'escale') && want > L[1]) { this.zAcc = (this.zAcc || 0) + d; if (this.zAcc > 120) { this.zAcc = 0; this.archipel(); } } else if (ph === 'archipel' && want < L[0]) { this.zAcc = (this.zAcc || 0) - d; const k = this.islesHit(e.clientX, e.clientY); if (k && this.zAcc > 120) { this.zAcc = 0; this.visit(k); } } else this.zAcc = 0; } else this.camDist = Math.max(8, Math.min(70, this.camDist * f)); }, { passive: false });
  // pincer à deux doigts (écran tactile) : zoom, partout
 const ptrs = new Map(); let pinch = null;
 r.domElement.addEventListener('pointerdown', (e) => { ptrs.set(e.pointerId, { x: e.clientX, y: e.clientY }); if (ptrs.size === 2) { down = null; const [a, b] = [...ptrs.values()]; pinch = { a0: Math.atan2(b.y - a.y, b.x - a.x), yaw0: this.orbW.yaw, d0: Math.hypot(a.x - b.x, a.y - b.y) || 1, dist: this.orbW.dist, cam: this.camDist, fov: this.st().phase === 'studio' ? this.cam.fov : this.cabin ? this.cabin.cam.fov : 62, out: false }; } });
 r.domElement.addEventListener('pointermove', (e) => { if (!ptrs.has(e.pointerId)) return; ptrs.set(e.pointerId, { x: e.clientX, y: e.clientY }); if (!pinch || ptrs.size < 2) return;
  const [a, b] = [...ptrs.values()], k = Math.hypot(a.x - b.x, a.y - b.y) / pinch.d0, ph = this.st().phase;
  if (ph === 'studio') { if (this.stuCanOrbit()) { if (!pinch.sd) pinch.sd = this.cam.position.distanceTo(this.stu.look); this.stuDolly(pinch.sd / k / this.cam.position.distanceTo(this.stu.look)); } else if (this.stuCanLook()) { this.cam.fov = Math.max(30, Math.min(70, pinch.fov / k)); this.cam.updateProjectionMatrix(); } }
  else if (ph === 'cabine' && this.cabCanOrbit()) { if (!pinch.cd) pinch.cd = this.cabin.cam.position.distanceTo(this.cabin.look); this.cabDolly(pinch.cd / k / this.cabin.cam.position.distanceTo(this.cabin.look)); }
  else if (ph === 'cabine') { if (this.cabCanLook()) { this.cabin.cam.fov = Math.max(32, Math.min(78, pinch.fov / k)); this.cabin.cam.updateProjectionMatrix(); } }
  else if (this.orbitPh(ph)) { const L = this.distLim(ph), want = pinch.dist / k; this.orbW.dist = Math.max(L[0], Math.min(L[1], want)); if (this.gestInsula()) { this.orbW.yaw = this.orb.yaw = pinch.yaw0 + (Math.atan2(b.y - a.y, b.x - a.x) - pinch.a0); this.placeCam(); } if ((ph === 'accoste' || ph === 'escale') && want > L[1] * 1.3 && !pinch.out) { pinch.out = true; this.archipel(); } }
  else this.camDist = Math.max(8, Math.min(70, pinch.cam / k)); });
 const ptrUp = (e) => { ptrs.delete(e.pointerId); if (ptrs.size < 2) pinch = null; if (!ptrs.size) document.body.classList.remove('dragging'); };
 r.domElement.addEventListener('pointerup', ptrUp); r.domElement.addEventListener('pointercancel', ptrUp);
 r.domElement.addEventListener('pointerup', (e) => { const d = down; down = null; if (!d || d.moved) return; const ph = this.st().phase;
  if (ph === 'accoste') { const hit = this.hitPlace(e.clientX, e.clientY); if (hit) this.focus(hit); return; }
  if (ph === 'archipel') { const k = this.islesHit(e.clientX, e.clientY); if (k) this.visit(k); return; }
  if (ph === 'cabine') { this.cabinClick(e.clientX, e.clientY); return; }
  if (ph === 'studio') { this.studioClick(e.clientX, e.clientY); return; }
  if (ph !== 'mer' && ph !== 'approche' || !this.island) return;
  const other = this.islesHit(e.clientX, e.clientY); if (other && other !== 'insula') { const rc0 = r.domElement.getBoundingClientRect(); if (!this.st().auto) this.setState({ ask: { x: e.clientX - rc0.left, y: e.clientY - rc0.top, k: other } }); return; }
  const rc = r.domElement.getBoundingClientRect(); ndc.set(((e.clientX - rc.left) / rc.width) * 2 - 1, -((e.clientY - rc.top) / rc.height) * 2 + 1); ray.setFromCamera(ndc, cam);
  const hit = ray.intersectObject(this.island, true).length || ray.intersectObject(this.trees, true).length || (this.marker && ray.intersectObject(this.marker, true).length); if (hit && !this.st().auto) this.setState({ ask: { x: e.clientX - rc.left, y: e.clientY - rc.top, k: 'insula' } }); else this.setState({ ask: null }); });
 this.ro = new ResizeObserver(() => { W = host.clientWidth || W; H = host.clientHeight || H; r.setSize(W, H); this.renduTaille(W, H); cam.aspect = W / H; cam.updateProjectionMatrix(); }); this.ro.observe(host);
 // étiquettes des lieux (DOM géré à la main, mis à jour à chaque image)
 this.labels = [];
 this.tip = document.createElement('div'); this.tip.className = 'pr-lbl'; this.tip.style.display = 'none'; this.tip.style.pointerEvents = 'none'; this.layer.appendChild(this.tip);
 this.orbW = { tx: 4, tz: -2, yaw: -0.59, pitch: 0.42, dist: 165 }; this.orb = Object.assign({}, this.orbW); if (this.st().phase === 'archipel') this.archView(true);
 // carte marine
 this.chart = document.createElement('div'); this.chart.style.cssText = 'position:absolute;inset:0';
 const SC = 3.8, cx = (x) => 75 + x / SC, cy = (z) => 70 + z / SC; this.cx = cx; this.cy = cy;
 const isl = (x, z, rx, rz, c) => '<div style="position:absolute;left:' + cx(x - rx) + 'px;top:' + cy(z - rz) + 'px;width:' + (2 * rx / SC) + 'px;height:' + (2 * rz / SC) + 'px;border-radius:50%;background:' + c + ';border:1.5px solid #6E7F5C;box-sizing:border-box"></div>';
 const lab = (x, z, t) => '<span style="position:absolute;left:' + cx(x) + 'px;top:' + cy(z) + 'px;transform:translateX(-50%);font:700 7px Inter,sans-serif;color:#14253A;white-space:nowrap">' + t + '</span>';
 this.chart.innerHTML = isl(-4, -2, 72, 46, '#9FB58A') + isl(PR_ISLES.cartevivante.x, PR_ISLES.cartevivante.z, 46, 34, '#A9BD8E') + isl(PR_ISLES.serveur.x, PR_ISLES.serveur.z, 40, 30, '#AEAA98') + lab(-4, 50, '1 · INSULA') + lab(PR_ISLES.cartevivante.x, 38, '2 · CARTE') + lab(PR_ISLES.serveur.x, 10, '3 · SERVEUR') + '<div style="position:absolute;left:' + cx(-21) + 'px;top:' + cy(162) + 'px;width:2px;height:' + (26 / SC) + 'px;background:#6b4b2b"></div><svg width="150" height="150" style="position:absolute;inset:0"><polyline fill="none" stroke="#B4412E" stroke-width="1.6" stroke-dasharray="4 3" points=""/></svg>';
 this.routeLine = this.chart.querySelector('polyline');
 this.dest = document.createElement('div'); this.dest.style.cssText = 'position:absolute;width:12px;height:12px;margin:-6px 0 0 -6px;border-radius:50%;border:2px solid #B4412E;background:#FFC94A;display:none'; this.chart.appendChild(this.dest);
 this.dot = document.createElement('div'); this.dot.style.cssText = 'position:absolute;width:0;height:0;border-left:5px solid transparent;border-right:5px solid transparent;border-bottom:13px solid #B4412E;margin:-7px 0 0 -5px;transform-origin:5px 7px';
 this.chart.appendChild(this.dot); this.chartHost.appendChild(this.chart);
 this.setupRendu(T, r, scene, cam, W, H);
 this.clock = new T.Timer(); this.clock.connect(document);
 const tick = () => { this.raf = requestAnimationFrame(tick); this.clock.update(); this.step(T, Math.min(0.05, this.clock.getDelta())); this.portalPre(r); this.renduStep(); if (this.st().phase === 'cabine' && this.cabin) { r.clippingPlanes = this.portalClip && this.cabin.cam.position.x < PR_PORTAL.cab[0] + 0.02 ? this.portalClip : []; this.renduFrame(this.cabin.scene, this.cabin.cam, PR_RENDU.expoCabine); r.clippingPlanes = []; } else this.renduFrame(scene, cam, PR_RENDU.exposition); };
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
 const q = this.island.getObjectByName('Quai'); const v = new T.Vector3(); let best = -1, tip = null; const pts = new Map(); const deckPts = [];
 if (q) q.traverse((o) => { if (!o.isMesh) return; const pa = o.geometry.attributes.position; for (let i = 0; i < pa.count; i++) { v.fromBufferAttribute(pa, i).applyMatrix4(o.matrixWorld); if (v.y > 0.3 && v.y < 0.9) deckPts.push([v.x, v.z]); if (v.y < -1.5 || v.y > 2) continue; const rr = (v.x / 72) ** 2 + (v.z / 46) ** 2; if (rr > best) { best = rr; tip = v.clone(); } pts.set(Math.round(v.x * 2) + ',' + Math.round(v.z * 2), [v.x, v.z]); } });
 if (!tip) tip = new T.Vector3(-50, 0, 40);
 const o = new T.Vector2(tip.x / (72 * 72), tip.z / (46 * 46)).normalize();
 this.quaiPts = Array.from(pts.values()); this.out = o;
 // axe de la jetée (analyse en composantes principales des points proches du bout)
 const near = this.quaiPts.filter(([x, z]) => Math.hypot(x - tip.x, z - tip.z) < 18); let mx = 0, mz = 0; near.forEach(([x, z]) => { mx += x; mz += z; }); mx /= near.length || 1; mz /= near.length || 1;
 let sxx = 0, szz = 0, sxz = 0; near.forEach(([x, z]) => { sxx += (x - mx) ** 2; szz += (z - mz) ** 2; sxz += (x - mx) * (z - mz); });
 const ang = 0.5 * Math.atan2(2 * sxz, sxx - szz); let u = { x: Math.cos(ang), z: Math.sin(ang) }; if (u.x * o.x + u.z * o.y < 0) u = { x: -u.x, z: -u.z };
 let n = { x: -u.z, z: u.x }; if (n.z < 0) n = { x: -n.x, z: -n.z };
 // demi-largeur du plancher, côté où l'on accoste (seulement les planches, pas la cabane ni la cale)
 let wmax = 0.8; const deck = deckPts.length > 30 ? deckPts : near; deck.forEach(([x, z]) => { const al = (x - tip.x) * u.x + (z - tip.z) * u.z, la = (x - tip.x) * n.x + (z - tip.z) * n.z; if (al > -10 && al < 1 && la > 0) wmax = Math.max(wmax, la); }); wmax = Math.min(3, wmax);
 const ax = tip.x - u.x * 5, az = tip.z - u.z * 5, lat = wmax + 1.45; this.jetty = { u, n, wmax };
 this.D = { x: ax + n.x * lat, z: az + n.z * lat };
 // recale l'écart réel : 1,55 m entre l'axe du bateau et le bord du plancher (≈ 40 cm de coque à quai)
 for (let it = 0; it < 3; it++) { let dmin = 1e9; deck.forEach(([x, z]) => { const dd = Math.hypot(x - this.D.x, z - this.D.z); if (dd < dmin) dmin = dd; }); const corr = dmin - 1.55; this.D.x -= n.x * corr; this.D.z -= n.z * corr; }
 this.Dapp = { x: this.D.x + u.x * 16 + n.x * 0.8, z: this.D.z + u.z * 16 + n.z * 0.8 }; this.A = { x: this.D.x + u.x * 38 + n.x * 6, z: this.D.z + u.z * 38 + n.z * 6 };
 if (this.dest) { this.dest.style.left = this.cx(this.D.x) + 'px'; this.dest.style.top = this.cy(this.D.z) + 'px'; this.dest.style.display = 'block'; }
 this.buildQuay(T); this.buildMarker(T); this.buildIsles(T);
}
// hauteur du dessus de l'île (sol, quai, toits) en (x, z)
topY(x, z, only) { const rc = this.rcY || (this.rcY = new window.THREE.Raycaster()); rc.set(new window.THREE.Vector3(x, 200, z), new window.THREE.Vector3(0, -1, 0)); const h = rc.intersectObject(only || this.island, true); return h.length ? h[0].point.y : 0; }
placeOfObj(o) { for (let x = o; x && x !== this.island; x = x.parent) { if (x.userData.place) return x.userData.place; const k = this.quayPlace(x.name || ''); if (k) return k; } return null; }
hitPlace(cx, cy) { const T = window.THREE, r = this.renderer.domElement.getBoundingClientRect(); const v = new T.Vector2(((cx - r.left) / r.width) * 2 - 1, -((cy - r.top) / r.height) * 2 + 1); const rc = new T.Raycaster(); rc.setFromCamera(v, this.cam);
 const objs = [this.life, this.island]; const vis = (o) => { while (o) { if (!o.visible) return false; o = o.parent; } return true; }; const h = rc.intersectObjects(objs.filter(Boolean), true).filter((x) => vis(x.object)); for (const x of h) { let o = x.object; while (o && !o.userData.place && o.parent) { if (o.parent === this.island) break; o = o.parent; } const k = (o && o.userData.place) || this.placeOfObj(x.object); if (k) return k; if (x.object.name.startsWith('Ile')) return null; } return null; }
along(pts, seg, L, u) { let d = u * L; for (let i = 0; i < seg.length; i++) { if (d <= seg[i]) return pts[i].clone().lerp(pts[i + 1], d / seg[i]); d -= seg[i]; } return pts[pts.length - 1].clone(); }
focus(k) {
 if (k === 'porte') { this.seen('panneau'); this.enterStudio(); return; }
 const f = this.focusPts[k]; if (!f) return;
 Object.assign(this.orbW, { tx: f.x, tz: f.z, ty: f.y, yaw: f.yaw != null ? f.yaw : -0.59, pitch: f.pitch != null ? f.pitch : 0.2, dist: f.d });
 this.focused = k; this.seen(k); this.say(PR_RADIO[k], 'LOUIS-MARIE');
 this.setState({ focus: k });
}
overview() { Object.assign(this.orbW, { tx: 4, tz: -2, ty: 4, yaw: -0.59, pitch: this.st().plan ? 0.7 : 0.42, dist: 165 }); this.focused = null; this.setState({ focus: null }); }
lifeStep(T, t, dt) {
 if (!this.life) return;
 if (this.pulses) this.pulses.forEach((r, i) => { const u = (t * 0.6 + i * 0.4) % 1; r.scale.setScalar(1 + u * 0.5); r.material.opacity = 0.85 * (1 - u); r.visible = this.st().phase === 'accoste' && r.userData.place !== this.focused; });
 const ph0 = this.st().phase; if ((ph0 === 'accoste' || ph0 === 'accostage') && !this.stuLoading) this.loadStudio();
 this.quayLifeStep(T, t, dt); this.bakeStep();
 if (this.stuLamp) this.stuLamp.intensity += ((ph0 === 'studio' ? 1.1 * LUXP : 0) - this.stuLamp.intensity) * Math.min(1, dt * 3);
}

setPlan(on) {
 if (on) this.seen('archi');
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
leave() { if (this.st().phase !== 'ponton') return; this.seen('ponton'); this.camYaw = 0; this.camPitch = 0.28; this.camDist = 16; this.sailDest = 'insula'; this.b.v = 1.5; this.b.h = Math.PI / 2; this.setState({ phase: 'mer' }); this.say(PR_RADIO.mer); }
// route qui contourne l'île (ellipse 72 × 46 m) par un point de passage au large
plan(from, to, depth) {
 depth = depth || 0; const inside = (x, z) => Math.hypot(x / 72, z / 46) < 1.25;
 let cross = false; for (let i = 1; i < 20; i++) { const f = i / 20; if (inside(from.x + (to.x - from.x) * f, from.z + (to.z - from.z) * f)) { cross = true; break; } }
 if (!cross || depth > 2) return [to];
 const a1 = Math.atan2(from.z / 46, from.x / 72), a2 = Math.atan2(to.z / 46, to.x / 72); let da = a2 - a1; while (da > Math.PI) da -= 2 * Math.PI; while (da < -Math.PI) da += 2 * Math.PI;
 const am = a1 + da / 2, w = { x: Math.cos(am) * 72 * 1.55, z: Math.sin(am) * 46 * 1.55 };
 return this.plan(from, w, depth + 1).concat(this.plan(w, to, depth + 1));
}
// point de dégagement si le bateau est collé à un obstacle
escape(from) { if (this.pen(from.x, from.z) < -2.5) return null; let best = null, bp = 1e9; for (let i = 0; i < 12; i++) { const a = i * Math.PI / 6, x = from.x + Math.cos(a) * 10, z = from.z + Math.sin(a) * 10; const p = this.pen(x, z) + 0.02 * Math.hypot(x - this.A.x, z - this.A.z) / 10; if (p < bp) { bp = p; best = { x, z }; } } return best; }
// suit une courbe lissée passant par des points ; arrive (option dock) le long du quai
cruise(pts, dock, vmax) {
 const T = window.THREE; const clean = [pts[0]]; pts.slice(1).forEach((p) => { const q = clean[clean.length - 1]; if (Math.hypot(p.x - q.x, p.z - q.z) > 3) clean.push(p); });
 const curve = new T.CatmullRomCurve3(clean.map((p) => new T.Vector3(p.x, 0, p.z)), false, 'centripetal', 0.5);
 this.cruiseP = { curve, len: curve.getLength(), s: 0, v: Math.max(1, this.b.v), dock, vmax: vmax || 14 };
 this.route = clean.slice(1);
}
autopilot() {
 if (!this.A) return; this.setState({ ask: null });
 const b = { x: this.b.x, z: this.b.z }; const P = this.P0; let esc = null;
 if (Math.abs(b.x - P.x) < 12 && b.z > P.z - 16 && b.z < P.z + 16) esc = { x: b.x + (b.x >= P.x ? 3 : -3), z: P.z - 22 }; // sortir du ponton tout droit
 else esc = this.escape(b);
 const s0 = esc || b; const pts = [b].concat(esc ? [esc] : [], this.plan(s0, this.A), [this.Dapp, this.D]);
 this.cruise(pts, true); this.autoDock = true; this.sailK = null; this.sailDest = 'insula'; this.setState({ auto: true });
 this.say("Je prends la barre et je t'emmène au quai d'Insula. Regarde la carte marine : la route est en pointillés.");
}
dock() { this.autopilot(); }
leaveIsland() {
 const u = this.jetty.u, n = this.jetty.n, b = this.b; const p1 = { x: b.x + u.x * 4 + n.x * 3, z: b.z + u.z * 4 + n.z * 3 };
 this.b.v = 1; this.cruise([{ x: b.x, z: b.z }, p1, { x: this.Dapp.x + n.x * 10, z: this.Dapp.z + n.z * 10 }, { x: this.A.x + u.x * 25 + n.x * 20, z: this.A.z + u.z * 25 + n.z * 20 }], false, 7);
}
// pénétration dans un obstacle (> 0 = dedans) : île, ponton de départ, quai
pen(x, z) {
 let p = 1.1 - Math.hypot(x / 72, z / 46);
 const P = this.P0, ax = 1.95 - Math.abs(x - P.x), az = 14 - Math.abs(z - P.z); if (ax > 0 && az > 0) p = Math.max(p, Math.min(ax, az));
 if (this.quaiPts && Math.hypot(x - this.D.x, z - this.D.z) < 40) { let m = 1e9; for (const [qx, qz] of this.quaiPts) m = Math.min(m, (qx - x) ** 2 + (qz - z) ** 2); p = Math.max(p, 1.6 - Math.sqrt(m)); }
 return Math.max(p, this.islePen(x, z));
}
// on refuse seulement un pas qui s'enfonce dans l'obstacle : on peut toujours s'en dégager
blocked(x, z, ox, oz) { const pn = this.pen(x, z); return pn > 0 && pn >= this.pen(ox, oz); }
step(T, dt) {
 const s = this.st(), b = this.b, k = this.keys; const t = this.clock.getElapsed();
 this.sea.material.uniforms.t.value = t;
 const ph = s.phase;
 if (ph !== this.lastPh) { this.lastPh = ph; if (this.narrow && ph) { this.setState({ hintOn: true }); clearTimeout(this.hintT); this.hintT = setTimeout(() => this.setState({ hintOn: false }), 6000); } }
 if (this.cruiseP && (ph === 'mer' || ph === 'approche' || ph === 'accostage' || ph === 'transit')) {
  const C = this.cruiseP, rest = C.len - C.s;
  const manual = k['arrowleft'] || k['arrowright'] || k['arrowup'] || k['arrowdown'] || k['q'] || k['a'] || k['d'] || k['z'] || k['w'] || k['s'] || this.pad;
  if (manual && ph !== 'accostage' && !C.transit) { this.cruiseP = null; this.route = []; if (this.autoDock) { this.autoDock = false; this.sailK = null; this.setState({ auto: false }); this.say("D'accord, tu reprends la barre."); } }
  else {
   if (C.transit) { const vt = Math.max(2.5, C.vmax * Math.min(1, (C.s + 4) / (0.12 * C.len), Math.sqrt(rest / (0.22 * C.len)))); C.v += (vt - C.v) * Math.min(1, dt * 6); this.transitFrame(dt); } else { const bo = C.boost ? 1 : 0, vm = C.vmax * (bo ? 3.5 : 1), dec = bo ? 14 : 1.6; const vt = C.dock ? Math.max(1.8, Math.min(vm, Math.sqrt(2 * dec * rest) + 0.5)) : vm; C.v += Math.max(-(bo ? 30 : 4) * dt, Math.min((bo ? 14 : 3.2) * dt, vt - C.v)); } C.s = Math.min(C.len, C.s + C.v * dt);
   const f = C.s / C.len, pnt = C.curve.getPointAt(f), tg = C.curve.getTangentAt(Math.min(0.999, f));
   let want = Math.atan2(-tg.z, tg.x), dh = want - b.h; while (dh > Math.PI) dh -= 2 * Math.PI; while (dh < -Math.PI) dh += 2 * Math.PI;
   const rate = 0.9 + C.v * 0.05; const turn = Math.max(-rate * dt, Math.min(rate * dt, dh)); b.h += turn; b.turn += (Math.sign(dh) * Math.min(1, Math.abs(dh) * 2) - b.turn) * dt * 2;
   b.x = pnt.x; b.z = pnt.z; b.v = C.v;
   while (this.route.length > 1 && Math.hypot(this.route[0].x - b.x, this.route[0].z - b.z) < 8) this.route.shift();
   if (C.dock && rest < 45 && ph !== 'accostage' && !C.transit) { this.setState({ phase: 'accostage', auto: false }); this.say('On réduit… je te mets le long du quai.'); }
   if (C.s >= C.len - 0.05) { this.cruiseP = null; this.route = []; if (C.transit) { b.v = 0; this.transitEnd(); } else if (C.dock) { b.v = 0; this.autoDock = false; this.docked(); } else { b.v = Math.min(b.v, 4); this.setState({ auto: false }); } }
  }
 } else if (ph === 'mer' || ph === 'approche') {
  let turn = 0, thr = 0;
  if (k['arrowleft'] || k['q'] || k['a'] || this.pad === 'L') turn += 1;
  if (k['arrowright'] || k['d'] || this.pad === 'R') turn -= 1;
  if (k['arrowup'] || k['z'] || k['w'] || this.pad === 'U') thr = 1;
  if (k['arrowdown'] || k['s']) thr = -1;
  if (false) { const w = this.route[0]; const dx = w.x - b.x, dz = w.z - b.z, d = Math.hypot(dx, dz); let da = Math.atan2(-dz, dx) - b.h; while (da > Math.PI) da -= 2 * Math.PI; while (da < -Math.PI) da += 2 * Math.PI;
   turn = Math.max(-1, Math.min(1, da * 2.5)); thr = Math.abs(da) > 1.2 ? 0.35 : 1;
   if (d < (this.route.length > 1 ? 12 : 6)) { this.route.shift(); if (!this.route.length) { if (this.autoDock) this.startFinal(); else thr = 0; } } }
  const vmax = this.autoDock ? 18 : 8; b.v += (thr * vmax - b.v) * dt * (thr > 0 ? (this.autoDock ? 0.8 : 0.35) : 0.5) + (thr < 0 ? -2 * dt : 0); b.v = Math.max(0, Math.min(vmax, b.v));
  b.turn += (turn - b.turn) * dt * 3; b.h += b.turn * dt * (0.3 + b.v * 0.07);
  const nx = b.x + Math.cos(b.h) * b.v * dt, nz = b.z - Math.sin(b.h) * b.v * dt;
  if (!this.blocked(nx, nz, b.x, b.z)) { b.x = nx; b.z = nz; } else { b.v *= 0.2; }
  this.approachStep(ph, b);
 }
 if (this.boat) { const bo = this.boat; bo.position.set(b.x, 0.05 * Math.sin(t * 1.3) - 0.05, b.z); bo.rotation.set(0, 0, 0); bo.rotateY(b.h); bo.rotateX(0.14 * Math.min(1, b.v / 8) + b.turn * 0.04 + 0.02 * Math.sin(t * 1.1)); bo.rotateZ(0.015 * Math.sin(t * 0.9)); }
 // caméra : derrière le bateau ; en montant, elle regarde le bateau lui-même
 const cam = this.cam;
 if (ph === 'descente' || ph === 'montee') this.portalCam(dt);
 else if (ph === 'studio') this.studioStep(T, t, dt);
 else if (this.orbitPh(ph)) { const O = this.orb, W2 = this.orbW, k2 = this.reduced ? 1 : Math.min(1, dt * (ph === 'transit' ? 4 : 2.2)); if (W2.ty == null) W2.ty = 4; if (O.ty == null) O.ty = 4;
  for (const key of ['tx', 'tz', 'ty', 'pitch', 'dist']) O[key] += (W2[key] - O[key]) * k2; let dy = W2.yaw - O.yaw; while (dy > Math.PI) dy -= 2 * Math.PI; while (dy < -Math.PI) dy += 2 * Math.PI; O.yaw += dy * k2;
  this.placeCam(); }
 else {
  const back = this.camDist + b.v * 0.5; const a = b.h + Math.PI + this.camYaw; const pc = this.camPitch;
  const tgt = new T.Vector3(b.x + Math.cos(a) * back * Math.cos(pc), 1.5 + back * Math.sin(pc), b.z - Math.sin(a) * back * Math.cos(pc));
  if (ph === 'ponton') tgt.set(b.x + 17, 7, b.z + 20);
  const sw = this.swoop > 0; if (sw) this.swoop -= dt; cam.position.lerp(tgt, this.reduced ? 1 : Math.min(1, dt * (sw ? 1.6 : this.autoDock ? 4 : 2.5)));
  const f = Math.min(1, Math.max(0, (pc - 0.35) / 0.8));
  const ahead = new T.Vector3(b.x + Math.cos(b.h) * 8, 3, b.z - Math.sin(b.h) * 8), onBoat = new T.Vector3(b.x, 1, b.z);
  this.look = ahead.lerp(onBoat, f);
  const L = ph === 'ponton' ? new T.Vector3(b.x - 5, 2.5, b.z - 12) : this.look;
  if (sw && this.lookCur && !this.reduced) { this.lookCur.lerp(L, Math.min(1, dt * 2.2)); cam.lookAt(this.lookCur); } else cam.lookAt(L);
 }
 this.lifeStep(T, t, dt); this.isleStep(T, t, dt, ph); this.markerStep(T, t, ph); this.nightStep(T, dt); if (ph === 'cabine') this.cabinStep(T, t, dt);
 if (ph === 'accoste' && this.mouse && this.island && (this.hovT = (this.hovT || 0) + dt) > 0.08) { this.hovT = 0; const k = this.hitPlace(this.mouse.x, this.mouse.y); const r0 = this.renderer.domElement.getBoundingClientRect(); this.renderer.domElement.style.cursor = k ? 'pointer' : 'grab';
  if (k) { const pl = this.poi[k]; this.tip.innerHTML = '<b>' + pl.n + '</b>' + pl.name; this.tip.style.display = 'block'; this.tip.style.left = (this.mouse.x - r0.left) + 'px'; this.tip.style.top = (this.mouse.y - r0.top - 14) + 'px'; } else this.tip.style.display = 'none'; }
 if (!['accoste', 'mer', 'approche', 'cabine', 'studio'].includes(ph) && this.tip) this.tip.style.display = 'none';
 // étiquettes
 const show = ph === 'accoste'; const W = this.host.clientWidth, H = this.host.clientHeight;
 this.labels.forEach((L) => { if (!show) { L.el.style.display = 'none'; return; } const p = L.v.clone().project(cam); if (p.z > 1) { L.el.style.display = 'none'; return; } L.el.style.display = 'block'; L.el.style.left = ((p.x + 1) / 2 * W) + 'px'; L.el.style.top = ((1 - p.y) / 2 * H) + 'px'; });
 // carte marine : 1 px = 2,8 m ; route en pointillés
 this.dot.style.left = this.cx(b.x) + 'px'; this.dot.style.top = this.cy(b.z) + 'px'; this.dot.style.transform = 'rotate(' + (90 - b.h * 180 / Math.PI) + 'deg)';
 const rt = this.cruiseP ? [b].concat(this.route) : [];
 this.routeLine.setAttribute('points', rt.map((p) => this.cx(p.x).toFixed(1) + ',' + this.cy(p.z).toFixed(1)).join(' '));
}
placeCam() { const O = this.orb, cam = this.cam, cp = Math.cos(O.pitch); cam.position.set(O.tx + Math.sin(O.yaw) * cp * O.dist, O.ty + Math.sin(O.pitch) * O.dist, O.tz + Math.cos(O.yaw) * cp * O.dist); if (cam.position.y < 1.5) cam.position.y = 1.5; cam.lookAt(O.tx, O.ty, O.tz); }
whereAmI() { const s = this.st(), ph = s.phase; if (ph === 'cabine') return s.cabFocus ? PR_CAB_SEEN[s.cabFocus] : 'cabine'; if (ph === 'nuit') return 'nuit'; if (ph === 'studio') return 'insula'; if (ph === 'accoste') return s.plan ? 'archi' : (this.focused || 'insula'); if (ph === 'ponton') return 'ponton'; if (ph === 'escale') return this.isleK; if (ph === 'archipel') return 'archipel'; return null; }
docked() { if (this.sailK) { const k = this.sailK; this.sailK = null; const B = this.berth(k); Object.assign(this.b, { x: B.x, z: B.z, h: B.h, v: 0, turn: 0 }); this.orbFromCam(); this.flyTo(k); return; } const c = this.cam.position, O = this.orb; O.tx = this.b.x; O.tz = this.b.z; O.ty = 2; O.dist = Math.max(30, Math.hypot(c.x - this.b.x, c.z - this.b.z)); O.yaw = Math.atan2(c.x - this.b.x, c.z - this.b.z); O.pitch = 0.3; this.overview(); this.visited = true; this.seen('insula'); this.setState({ phase: 'accoste', showCard: false }); this.say(PR_RADIO.accoste); }
renderVals() {
 const s = this.st(), ph = s.phase || 'ponton', plan = !!s.plan, sel = s.sel == null ? -1 : s.sel;
 const acts = [];
 if (ph === 'archipel') { acts.push({ label: '☰ Tout voir en 1 minute', cls: 'pr-btn2', go: () => this.setState({ showText: true }) }); acts.push({ label: "⛵ Embarquer à bord d'Elba", cls: 'pr-btn', go: () => this.embark() }); }
 if (ph === 'escale') { const k = this.isleK; acts.push({ label: "← L'archipel", cls: 'pr-btn2', go: () => this.archipel() }); if (PR_ISLES[k] && PR_ISLES[k].code) acts.push({ label: 'Voir le code ↗', cls: 'pr-btn2', go: () => window.open(PR_ISLES[k].code, '_blank', 'noopener') });
  { if (k === 'cartevivante') acts.push({ label: '⛵ Île suivante : Le serveur', cls: 'pr-btn', go: () => this.sailTo('serveur') }); else acts.push({ label: '⌂ Descendre dans la cabine', cls: 'pr-btn', go: () => this.goTo('cabine') }); } }
 if (ph === 'transit') acts.push({ label: '⏭ Arriver tout de suite', cls: 'pr-btn2', go: () => this.skipTransit() });
 if (ph === 'ponton') { acts.push({ label: "← L'archipel", cls: 'pr-btn2', go: () => this.archipel() }); acts.push({ label: '⚓ Larguer les amarres', cls: 'pr-btn', go: () => this.leave() }); }
 if ((ph === 'mer' || ph === 'approche' || ph === 'accostage') && this.cruiseP && !this.cruiseP.transit && !this.cruiseP.boost) acts.push({ label: '⏩ Arriver plus vite', cls: 'pr-btn2', go: () => { if (this.cruiseP) this.cruiseP.boost = true; this.setState({ v: Date.now() }); } });
 if ((ph === 'mer' || ph === 'approche') && s.auto) acts.push({ label: 'Reprendre la barre', cls: 'pr-btn2', go: () => { this.cruiseP = null; this.route = []; this.autoDock = false; this.sailK = null; this.setState({ auto: false }); } });
 if ((ph === 'mer' || ph === 'approche') && !s.auto) acts.push({ label: "← L'archipel", cls: 'pr-btn2', go: () => this.archipel() });
 if (ph === 'mer' && !s.auto) { const d = this.sailDest || 'insula'; acts.push({ label: '⛵ Pilote auto → ' + PR_ISLES[d].name, cls: 'pr-btn', go: () => this.goSail(d) }); }
 if (ph === 'approche' && !s.auto) acts.push({ label: ('⚓ Accoster à ' + PR_ISLES[this.approachK || 'insula'].to).replace('à le ', 'au '), cls: 'pr-btn', go: () => this.finalApproach(this.approachK || 'insula') });
 if (ph === 'studio') this.studioActs(acts);
 if (ph === 'accoste') { if (s.focus && !plan) acts.push({ label: "← Vue d'ensemble", cls: 'pr-btn2', go: () => this.overview() }); if (!s.focus && !plan) acts.push({ label: "← L'archipel", cls: 'pr-btn2', go: () => this.archipel() }); if (!plan) { if (s.focus !== 'panneau') acts.push({ label: '▤ Le panneau', cls: 'pr-btn2', go: () => this.focus('panneau') }); acts.push({ label: '⌂ Monter au studio', cls: s.focus === 'panneau' ? 'pr-btn' : 'pr-btn2', go: () => this.focus('porte') }); } acts.push({ label: plan ? "Revenir à l'île" : "Voir l'architecture", cls: 'pr-btn2', go: () => this.setPlan(!plan) }); acts.push({ label: '⛵ Île suivante : Carte vivante', cls: 'pr-btn', go: () => this.sailTo('cartevivante') }); }
 if (ph === 'nuit') { acts.push({ label: "← L'archipel", cls: 'pr-btn2', go: () => this.goTo('archipel') }); acts.push({ label: '☀ Revenir au jour', cls: 'pr-btn2', go: () => this.cancelNight() }); acts.push({ label: '⌄ Descendre dans la cabine', cls: 'pr-btn', go: () => this.enterCabin() }); }
 if (ph === 'cabine') { const f = s.cabFocus;
  if (f) acts.push({ label: '← Revenir', cls: 'pr-btn2', go: () => this.cabUnfocus() });
  if (f === 'coffre') acts.push({ label: '⬇ Télécharger mon CV', cls: 'pr-btn', go: () => window.open(PR_CV_URL, '_blank', 'noopener') });
  if (f === 'livre') acts.push({ label: '↷ Tourner la page', cls: 'pr-btn2', go: () => this.turnPage() });
  if (f === 'bouteilles') acts.push({ label: '→ Bouteille suivante', cls: 'pr-btn2', go: () => this.cabFocus('bouteilles') });
  if (!f) { acts.push({ label: "← L'archipel", cls: 'pr-btn2', go: () => this.goTo('archipel') }); acts.push({ label: '⌃ Remonter sur le pont', cls: 'pr-btn2', go: () => this.leaveCabin() }); acts.push({ label: '↺ Refaire la traversée', cls: 'pr-btn', go: () => this.goTo('ponton') }); } }
 const hint = ph === 'archipel' ? (this.gestInsula() ? 'Cliquez sur une île (ou zoomez dessus) pour la survoler · glissez pour déplacer · Ctrl ou clic droit + glisser pour tourner · « Embarquer » pour barrer Elba' : 'Cliquez sur une île (ou zoomez dessus) pour la survoler · glissez pour tourner · « Embarquer » pour barrer Elba vous-même') : ph === 'escale' ? (this.gestInsula() ? "Glissez pour déplacer · Ctrl ou clic droit + glisser pour tourner · deux doigts ou molette pour zoomer · dézoomez à fond pour revoir tout l'archipel" : "Glissez pour tourner · molette pour zoomer · dézoomez à fond pour revoir tout l'archipel") : ph === 'nuit' ? 'Glissez pour regarder autour du bateau · « Descendre dans la cabine »' : ph === 'cabine' ? 'Cliquez sur un objet : la carte, le coffre, le livre, les bouteilles, la photo, la VHF · glissez pour regarder autour · Échap pour revenir' : ph === 'descente' || ph === 'montee' ? '' : ph === 'transit' ? 'Traversée express vers la destination · « Arriver tout de suite » pour sauter' : ph === 'ponton' ? 'Glissez pour regarder autour · « Larguer les amarres » pour partir' : ph === 'accoste' ? (this.gestInsula() ? "Glissez pour déplacer · Ctrl ou clic droit + glisser pour tourner · deux doigts ou molette pour zoomer (à fond : tout l'archipel) · cliquez sur le panneau ou la porte" : "Glissez pour tourner · clic droit ou Maj + glisser pour déplacer · molette pour zoomer (à fond : tout l'archipel) · cliquez sur le panneau ou la porte") : ph === 'studio' ? (this.st().stuFocus ? "Glissez pour tourner autour · deux doigts ou molette pour approcher · Échap pour revenir" : "Cliquez sur un objet : l'ordinateur, les annonces, le carnet, la fiche du frigo, les clés · glissez pour regarder autour · deux doigts pour zoomer") : 'Flèches ou ZQSD pour barrer · glissez pour tourner · deux doigts, pincez ou molette pour zoomer · cliquez sur une île pour y aller';
 let card = Object.assign({ bg: 'rgba(251,247,238,.97)', fg: '#14253A', accent: '#B4412E', try: false }, PR_CARNET);
 const touch = typeof window !== 'undefined' && ('ontouchstart' in window);
 return {
  setHost: (el) => { this.host = el; }, setLayer: (el) => { this.layer = el; }, setChart: (el) => { this.chartHost = el; },
  hint, radio: s.radio || '', radioFrom: s.radioFrom || 'LOUIS-MARIE', actions: acts,
  radioLinks: ph === 'cabine' && s.cabFocus === 'vhf' ? [['✉ louis-marie@du-cray.com', 'mailto:louis-marie@du-cray.com'], ['in · LinkedIn', 'https://www.linkedin.com/in/louismarie-perret-du-cray/'], ['⌥ GitHub', 'https://github.com/LM28000']] : [],
  cabEsc: () => { if (ph === 'cabine' && s.cabFocus) { this.cabUnfocus(); return true; } if (ph === 'studio' && s.stuFocus && !s.showApp) { this.stuUnfocus(); return true; } return false; },
  showCard: !!s.showCard && ph === 'accoste', card, closeCard: () => this.setState({ showCard: false }),
  loading: s.loading !== false, loadMsg: s.loadMsg || '',
  showPads: touch && (ph === 'mer' || ph === 'approche'),
  ask: !!s.ask && (ph === 'mer' || ph === 'approche'), askX: s.ask ? Math.min(s.ask.x, 1100) : 0, askY: s.ask ? s.ask.y : 0, askText: s.ask ? PR_ISLES[s.ask.k || 'insula'].name + ' · île n° ' + PR_ISLES[s.ask.k || 'insula'].n + ' — y aller ?' : '', askGo: () => this.goSail((s.ask && s.ask.k) || 'insula'), askNo: () => this.setState({ ask: null }),
  showApp: !!s.showApp && (ph === 'accoste' || ph === 'studio'), closeApp: () => { this.setState({ showApp: false }); if (ph === 'studio') this.say(PR_STU_RADIO.app); else this.overview(); },
  showMap: !!s.showMap, openMap: () => { this.mapOpened = true; this.setState({ showMap: true }); }, closeMap: () => this.setState({ showMap: false }), goTo: (k) => this.goTo(k), stops: PR_STOPS.map((x) => { const v = this.visitedSet || {}, here = this.whereAmI(); const parent = ['studio', 'archi'].includes(x.k) ? 'insula' : (['carte', 'coffre', 'recap', 'bouteilles', 'apropos', 'contact'].includes(x.k) ? 'cabine' : null);
   const show = !x.sub || s.showAll || !!v[parent] || here === parent || !!v[x.k]; const hh = ['studio', 'archi'].includes(here) ? 'insula' : (ph === 'cabine' ? 'cabine' : here); return Object.assign({ done: !!v[x.k], here: x.k === hh, show }, x); }),
  showText: !!s.showText, closeText: () => this.setState({ showText: false }), openText: () => this.setState({ showText: true, showMap: false }), goArch: () => this.goTo('archipel'),
  showAll: !!s.showAll, toggleAll: () => this.setState({ showAll: !s.showAll }),
  progress: PR_STOPS.filter((x) => (this.visitedSet || {})[x.k]).length + '/' + PR_STOPS.length,
  pulseChart: this.narrow && !s.showMap && !this.mapOpened, phase: ph, hintOn: !!s.hintOn, objText: s.objText || '', radioPrev: () => this.radioPrev(),
  showArchi: !!s.plan && ph === 'accoste', panel: null,
  padL: () => { this.pad = 'L'; }, padR: () => { this.pad = 'R'; }, padU: () => { this.pad = 'U'; }, padOff: () => { this.pad = null; }
 };
}
}
