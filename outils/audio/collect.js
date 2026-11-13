// rassemble toutes les phrases prononcées par la VHF
const fs = require('fs'), vm = require('vm'), dir = process.argv[2];
const src = ['js/scene.js', 'js/cabin.js', 'js/cabin3d.js', 'js/archipel.js', 'js/studio.js'].map((f) => fs.readFileSync(dir + '/' + f, 'utf8'));
const ctx = { window: {}, document: {}, DCLogic: class {}, console };
vm.createContext(ctx); vm.runInContext(src.join('\n') + '\n;this.R = { PR_RADIO, PR_CAB_RADIO2, PR_ISLES, PR_STU_RADIO };', ctx);
const R = ctx.R, T = new Set();
Object.values(R.PR_RADIO).forEach((t) => T.add(t)); Object.values(R.PR_CAB_RADIO2).forEach((t) => typeof t === 'string' && T.add(t));
Object.values(R.PR_STU_RADIO).forEach((t) => T.add(t));
['cartevivante', 'serveur'].forEach((k) => T.add('Cap sur ' + R.PR_ISLES[k].to + ' ! Je tiens la barre, regarde la route en pointillés sur la carte marine.'));
const all = src.join('\n'); for (const m of all.matchAll(/say\((["'])((?:\\.|(?!\1).)*)\1\s*[,)]/g)) T.add(m[2].replace(/\\'/g, "'"));
const h = (s) => { let x = 5381; for (let i = 0; i < s.length; i++) x = ((x * 33) ^ s.charCodeAt(i)) >>> 0; return x.toString(36); };
const out = {}; [...T].forEach((t) => { out[h(t)] = t; });
fs.writeFileSync(process.argv[3], JSON.stringify(out, null, 1)); console.log(Object.keys(out).length, 'phrases');
