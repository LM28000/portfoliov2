// Parcours complet dans un vrai navigateur (Chrome, rendu WebGL logiciel) : archipel, gestes, Insula, studio, cabine.
// Usage (depuis outils/) : npm run parcours [-- URL]   (par défaut http://localhost:8000/, servir le site avec « python3 -m http.server »)
// Les captures vont dans outils/tests/captures/. Code de sortie 1 si une étape échoue.
const { chromium } = require('playwright');
const fs = require('fs'), path = require('path');
const URL = process.argv[2] || 'http://localhost:8000/';
const OUT = path.join(__dirname, 'captures'); fs.mkdirSync(OUT, { recursive: true });
let fails = 0;
const check = (cond, msg) => { console.log((cond ? '  ✓ ' : '  ✗ ') + msg); if (!cond) fails++; };

(async () => {
  const b = await chromium.launch({ channel: process.env.PW_CHANNEL || undefined, args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--autoplay-policy=no-user-gesture-required'] });
  const p = await b.newPage({ viewport: { width: 1280, height: 800 } });
  // rendu logiciel (sans carte graphique) : niveau « simple », sinon tout est trop lent ; PW_RENDU=haute pour tester le niveau complet
  await p.addInitScript((n) => { try { localStorage.setItem('elba-rendu', n); } catch (e) {} }, process.env.PW_RENDU || 'simple');
  const errs = []; p.on('pageerror', (e) => errs.push(e.message)); p.on('console', (m) => { if (m.type() === 'error' && !/favicon|net::ERR/.test(m.text())) errs.push(m.text()); });
  await p.goto(URL, { waitUntil: 'load' });
  await p.waitForFunction(() => window.__elba && window.__elba.island && window.__elba.st().loading === false, null, { timeout: 180000 });
  const E = (f, a) => p.evaluate(f, a);
  const st = () => E(() => { const C = window.__elba, s = C.st(); return { ph: s.phase, f: s.focus, sf: s.stuFocus, acts: C.renderVals().actions.map((a) => a.label) }; });
  const shot = async (n, w) => { await p.waitForTimeout(w || 1500); await p.screenshot({ path: path.join(OUT, n + '.png') }); };
  const orb = () => E(() => { const o = window.__elba.orbW; return { tx: o.tx, tz: o.tz, yaw: o.yaw, dist: o.dist }; });

  console.log('Archipel');
  await shot('01-archipel', 3000); check((await st()).ph === 'archipel', "arrivée sur l'archipel");
  const lbl = await E(() => { const e = Object.values(window.__elba.isleLbl).find((x) => x.style.display !== 'none'); if (!e) return null; const r = e.getBoundingClientRect(); return [r.left + r.width / 2, r.top + r.height / 2]; });
  if (lbl) { const y0 = (await orb()).yaw; await p.keyboard.down('Control'); await p.mouse.move(lbl[0] - 300, lbl[1] + 100); await p.mouse.down(); for (let i = 1; i <= 30; i++) await p.mouse.move(lbl[0] - 300 + i * 20, lbl[1] + 100 - i * 3); await p.mouse.up(); await p.keyboard.up('Control');
    check(Math.abs((await orb()).yaw - y0) > 3, 'une rotation passe à travers une étiquette d’île sans être bloquée'); }

  console.log('Insula : le quai');
  await E(() => window.__elba.goTo('insula')); await p.waitForTimeout(12000);
  let s = await st(); check(s.ph === 'accoste', 'accosté à Insula'); check(s.acts.includes('⌂ Monter au studio'), 'bouton « Monter au studio »'); await shot('02-quai');
  const drag = async (mods) => { for (const m of mods) await p.keyboard.down(m); await p.mouse.move(500, 450); await p.mouse.down(); for (let i = 1; i <= 10; i++) await p.mouse.move(500 + i * 15, 450 + i * 4); await p.mouse.up(); for (const m of mods) await p.keyboard.up(m); await p.waitForTimeout(300); };
  let a = await orb(); await drag([]); let c = await orb();
  check(Math.hypot(c.tx - a.tx, c.tz - a.tz) > 1 && Math.abs(c.yaw - a.yaw) < 0.01, 'glisser = déplacer (sans tourner)');
  a = c; await drag(['Control']); c = await orb(); check(Math.abs(c.yaw - a.yaw) > 0.1 && Math.hypot(c.tx - a.tx, c.tz - a.tz) < 0.01, 'Ctrl + glisser = tourner (sans déplacer)');
  a = c; await p.mouse.move(640, 400); for (let i = 0; i < 20; i++) await p.mouse.wheel(0.4, 6.5); await p.waitForTimeout(300); c = await orb(); check(c.dist > a.dist && Math.abs(c.yaw - a.yaw) < 0.01, 'deux doigts = zoomer');
  await E(() => window.__elba.focus('panneau')); await shot('03-panneau', 3500); check((await st()).f === 'panneau', 'le panneau À VENDRE');

  console.log('Insula : le studio');
  await E(() => window.__elba.focus('porte')); await p.waitForFunction(() => window.__elba.stu && !window.__elba.stu.path && window.__elba.st().phase === 'studio', null, { timeout: 60000 });
  await shot('04-studio'); check((await st()).ph === 'studio', 'entrée dans le studio par la porte-fenêtre');
  for (const k of ['annonces', 'carnet', 'frigo']) { await E((k) => window.__elba.stuFocus(k), k); await shot('05-' + k, 2500); check((await st()).sf === k, 'objet : ' + k); }
  await E(() => window.__elba.stuFocus('ordi')); await p.waitForTimeout(6000); await shot('06-ordinateur');
  const web = await E(() => { const w = window.__elba.stu.web; return { on: w.style.display === 'block', src: w.querySelector('iframe').src, tf: w.style.transform }; });
  check(web.on && /insula\.du-cray\.eu/.test(web.src) && web.tf.startsWith('matrix3d'), "la vraie app est posée sur l'écran du portable");
  const p0 = await E(() => window.__elba.cam.position.toArray()); await p.mouse.move(60, 400); await p.mouse.down(); for (let i = 1; i <= 12; i++) await p.mouse.move(60 + i * 8, 400); await p.mouse.up();
  const p1 = await E(() => window.__elba.cam.position.toArray()); check(Math.hypot(p1[0] - p0[0], p1[2] - p0[2]) > 0.02, "on peut tourner autour d'un objet choisi");
  await E(() => window.__elba.stuFocus('cles')); await shot('07-cles', 4500); check((await st()).acts.some((l) => /Larguer les amarres/.test(l)), 'les clés proposent de repartir');
  await E(() => window.__elba.leaveStudio()); await p.waitForFunction(() => window.__elba.st().phase === 'accoste', null, { timeout: 40000 }).catch(() => {}); check((await st()).ph === 'accoste', 'retour sur le quai');

  console.log('La cabine');
  await E(() => window.__elba.goTo('cabine')); await p.waitForFunction(() => window.__elba.st().phase === 'cabine', null, { timeout: 60000 }).catch(() => {}); await shot('08-cabine', 3000); check((await st()).ph === 'cabine', 'descente dans la cabine');
  await E(() => window.__elba.goTo('studio')); await p.waitForTimeout(12000); check((await st()).ph === 'studio', 'retour au studio par la carte du voyage');
  check(await E(() => (window.__elba.night || 0) < 0.05), 'le studio se visite de jour');

  check(errs.length === 0, 'aucune erreur dans la console' + (errs.length ? ' : ' + errs.slice(0, 3).join(' | ') : ''));
  await b.close();
  console.log('\n' + (fails ? fails + ' étape(s) en échec' : 'Parcours complet réussi') + ' · captures dans ' + path.relative(process.cwd(), OUT));
  process.exit(fails ? 1 : 0);
})().catch((e) => { console.error('ÉCHEC', e.message); process.exit(1); });
