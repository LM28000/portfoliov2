// Vérifications rapides du site, sans dépendance (lancées par GitHub Actions à chaque envoi).
// Usage : node outils/verifier.cjs   (code de sortie 1 si une vérification échoue)
const fs = require('fs'), path = require('path'), { execFileSync } = require('child_process');
const ROOT = path.resolve(__dirname, '..');
const rel = (p) => path.relative(ROOT, p);
let errors = 0, warnings = 0;
const ok = (m) => console.log('  ✓ ' + m);
const ko = (m) => { errors++; console.log('  ✗ ' + m); };
const warn = (m) => { warnings++; console.log('  ! ' + m); };
const read = (p) => fs.readFileSync(path.join(ROOT, p), 'utf8');
const exists = (p) => fs.existsSync(path.join(ROOT, p));

console.log('1. Syntaxe JavaScript');
const jsFiles = fs.readdirSync(path.join(ROOT, 'js')).filter((f) => f.endsWith('.js')).map((f) => 'js/' + f);
for (const f of jsFiles) {
  try { execFileSync(process.execPath, ['--check', path.join(ROOT, f)], { stdio: 'pipe' }); ok(f); }
  catch (e) { ko(f + ' : ' + String(e.stderr || e.message).split('\n').slice(0, 4).join(' ')); }
}

console.log('2. Page : scripts, styles et version');
const html = read('index.html');
const refs = [...html.matchAll(/(?:src|href)="([^"#:]+?)(?:\?v=([^"]+))?"/g)];
const versions = new Set();
for (const [, p, v] of refs) {
  if (/^(https?:|mailto:|#)/.test(p) || p === '/') continue;
  if (v) versions.add(v);
  exists(p) ? ok(p + (v ? ' (v=' + v + ')' : '')) : ko('fichier manquant : ' + p);
}
const local = [...html.matchAll(/<script src="(js\/[^"?]+)(\?v=[^"]*)?"/g)];
for (const [, p, v] of local) if (!v) warn(p + ' sans ?v= : le navigateur peut garder une ancienne version en cache');
if (versions.size > 1) ko('plusieurs numéros de version dans index.html : ' + [...versions].join(', ')); else if (versions.size) ok('une seule version : v=' + [...versions][0]);
for (const f of jsFiles) if (!html.includes('src="' + f)) warn(f + " n'est pas chargé par index.html");

console.log('3. Fichiers cités par le code');
const cited = new Set();
for (const f of jsFiles.concat(['index.html'])) for (const m of read(f).matchAll(/['"(](assets\/[A-Za-z0-9_./-]+\.[a-z0-9]{2,5})['")]/g)) cited.add(m[1]);
for (const p of [...cited].sort()) exists(p) ? ok(p) : ko('cité mais absent : ' + p);
for (const i of [1, 2]) { const p = 'assets/carte-vivante-' + i + '.jpg'; exists(p) ? ok(p) : ko('absent : ' + p); }

console.log('4. Voix de la VHF');
const vdir = 'assets/audio/voix/';
let keys = [];
try { keys = JSON.parse(read(vdir + 'index.json')); ok('index.json : ' + keys.length + ' phrases'); } catch (e) { ko('index.json illisible : ' + e.message); }
const clips = fs.readdirSync(path.join(ROOT, vdir)).filter((f) => f.endsWith('.m4a')).map((f) => f.slice(0, -4));
const missing = keys.filter((k) => !clips.includes(k)), orphans = clips.filter((k) => !keys.includes(k));
missing.length ? ko('clips annoncés mais absents : ' + missing.join(', ')) : ok('chaque phrase a son clip');
orphans.length ? warn('clips orphelins (à supprimer) : ' + orphans.join(', ')) : ok('aucun clip orphelin');

console.log('5. Poids');
let total = 0;
const walk = (d) => fs.readdirSync(d, { withFileTypes: true }).forEach((e) => { const p = path.join(d, e.name); if (e.isDirectory()) walk(p); else { const s = fs.statSync(p).size; total += s; if (s > 15e6) ko(rel(p) + ' dépasse 15 Mo (' + (s / 1e6).toFixed(1) + ' Mo)'); else if (s > 6e6) warn(rel(p) + ' : ' + (s / 1e6).toFixed(1) + ' Mo'); } });
walk(path.join(ROOT, 'assets'));
const first = ['assets/elba.glb', 'assets/ile_insula.glb'].reduce((a, p) => a + fs.statSync(path.join(ROOT, p)).size, 0);
ok('assets : ' + (total / 1e6).toFixed(1) + ' Mo au total ; au premier affichage (Elba + île) : ' + (first / 1e6).toFixed(1) + ' Mo');
if (first > 8e6) warn('le premier affichage dépasse 8 Mo');

console.log('6. Rien de personnel ni de local dans les fichiers suivis');
let tracked = [];
try { tracked = execFileSync('git', ['ls-files'], { cwd: ROOT, encoding: 'utf8' }).split('\n').filter(Boolean); } catch (e) { warn('git indisponible : vérification sautée'); }
const textExt = /\.(js|cjs|mjs|py|html|css|md|json|txt|yml|yaml)$/;
let leaks = 0;
for (const f of tracked.filter((f) => textExt.test(f) && f !== 'outils/verifier.cjs' && !f.startsWith('vendor/'))) { // vendor/ : bibliothèques tierces minifiées
  const s = read(f);
  if (/\/Users\/[^/\s"']+/.test(s)) { ko(f + ' contient un chemin local (/Users/…)'); leaks++; }
  if (/(\+33|0)[67](?:[ .-]?\d{2}){4}/.test(s)) { ko(f + ' contient un numéro de téléphone'); leaks++; }
}
if (!leaks) ok(tracked.length + ' fichiers suivis vérifiés');

console.log('\n' + (errors ? errors + ' erreur(s)' : 'Tout est bon') + (warnings ? ', ' + warnings + ' avertissement(s)' : '') + '.');
process.exit(errors ? 1 : 0);
