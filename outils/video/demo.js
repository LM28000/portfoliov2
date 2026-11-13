// Démo d'Insula (écran du portable, dans le studio de l'île) : curseur visible, fiche qui défile, onglets Calcul et Quartier.
const { chromium } = require("playwright");
const path = require("path");
// la page d'Insula à filmer : INSULA_DIR = dossier du dépôt d'Insula (par défaut, à côté de celui-ci)
const INSULA = process.env.INSULA_DIR || path.resolve(__dirname, "../../../immobilier-tool");
const PAGE = "file://" + encodeURI(path.join(INSULA, "essai.html"));
const W = 1280, H = 800;
const OVERLAY = () => {
  const css = `#__cur{position:fixed;left:0;top:0;width:26px;height:26px;margin:-3px 0 0 -3px;z-index:2147483647;pointer-events:none;transition:transform .08s}
  #__cur svg{filter:drop-shadow(0 2px 3px rgba(0,0,0,.45))}
  .__rip{position:fixed;width:44px;height:44px;margin:-22px 0 0 -22px;border-radius:50%;border:3px solid #FFC94A;z-index:2147483646;pointer-events:none;animation:__r .6s ease-out forwards}
  @keyframes __r{from{transform:scale(.3);opacity:1}to{transform:scale(1.6);opacity:0}}
  #__title{position:fixed;inset:0;pointer-events:none;z-index:2147483645;background:#0B1626;color:#F4EFE6;display:flex;flex-direction:column;align-items:center;justify-content:center;font-family:Georgia,serif;transition:opacity .8s}
  #__title b{font-size:64px}#__title span{margin-top:14px;font:600 20px system-ui,sans-serif;color:#7FE6FF;letter-spacing:.08em}
  #__cap{position:fixed;left:50%;bottom:26px;transform:translateX(-50%);z-index:2147483644;padding:10px 18px;border-radius:12px;background:rgba(11,22,38,.88);color:#fff;font:600 19px system-ui,sans-serif;opacity:0;transition:opacity .4s;pointer-events:none;white-space:nowrap}`;
  const add = () => {
    if (document.getElementById('__cur')) return;
    const st = document.createElement('style'); st.textContent = css; document.head.appendChild(st);
    const c = document.createElement('div'); c.id = '__cur'; c.innerHTML = '<svg width="26" height="26" viewBox="0 0 26 26"><path d="M3 2 L3 21 L8 16 L12 24 L15.5 22.5 L11.5 14.5 L18.5 14.5 Z" fill="#fff" stroke="#14253A" stroke-width="1.6" stroke-linejoin="round"/></svg>'; document.body.appendChild(c);
    const t = document.createElement('div'); t.id = '__title'; t.innerHTML = '<b>Insula</b><span>CHOISIR OÙ ACHETER, ENTRE AMIS</span>'; document.body.appendChild(t);
    const cap = document.createElement('div'); cap.id = '__cap'; document.body.appendChild(cap);
    addEventListener('mousemove', (e) => { c.style.left = e.clientX + 'px'; c.style.top = e.clientY + 'px'; }, true);
    addEventListener('mousedown', (e) => { c.style.transform = 'scale(.85)'; const r = document.createElement('div'); r.className = '__rip'; r.style.left = e.clientX + 'px'; r.style.top = e.clientY + 'px'; document.body.appendChild(r); setTimeout(() => r.remove(), 700); }, true);
    addEventListener('mouseup', () => { c.style.transform = ''; }, true);
  };
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', add); else add();
};
(async () => {
  const b = await chromium.launch();
  const ctx = await b.newContext({ viewport: { width: W, height: H }, deviceScaleFactor: 1, recordVideo: { dir: __dirname + "/out", size: { width: W, height: H } } });
  await ctx.addInitScript(OVERLAY);
  const p = await ctx.newPage();
  let mx = W / 2, my = H / 2;
  const glide = async (x, y, ms = 700) => { const steps = Math.max(8, Math.round(ms / 16)); await p.mouse.move(x, y, { steps }); mx = x; my = y; };
  const to = async (loc, ms) => { const bb = await loc.boundingBox(); await glide(bb.x + bb.width / 2, bb.y + bb.height / 2, ms); return bb; };
  const click = async (loc, ms = 700, wait = 600) => { await to(loc, ms); await p.waitForTimeout(250); await p.mouse.down(); await p.waitForTimeout(90); await p.mouse.up(); await p.waitForTimeout(wait); };
  const cap = (t) => p.evaluate((t) => { const c = document.getElementById('__cap'); if (!c) return; if (t) { c.textContent = t; c.style.opacity = 1; } else c.style.opacity = 0; }, t);
  const scrollIn = async (sel, dy, ms) => { const n = Math.round(ms / 40); for (let i = 0; i < n; i++) { await p.mouse.wheel(0, dy / n); await p.waitForTimeout(40); } };

  await p.goto(PAGE, { waitUntil: "load" });
  const vm = p.getByRole("button", { name: "Voir le marché" });
  await vm.waitFor({ state: "visible", timeout: 30000 }); await p.waitForTimeout(2500); await vm.click({ force: true });
  await p.waitForTimeout(1200);
  const pt = p.getByRole("button", { name: "Plus tard" }).locator('visible=true');
  if (await pt.count()) await pt.first().click({ force: true });
  await p.waitForTimeout(1500);
  await p.mouse.move(W * 0.62, H * 0.45);
  await p.waitForTimeout(1500);
  await p.evaluate(() => { const t = document.getElementById('__title'); t.style.opacity = 0; setTimeout(() => t.remove(), 900); });
  await p.waitForTimeout(900);

  // 1. la carte de l'Ouest
  await cap("22 villes de l'Ouest, classées selon nos critères");
  await glide(W * 0.55, H * 0.62, 900); await p.waitForTimeout(500);
  const city = p.getByText('Saint-Nazaire', { exact: true }).locator('visible=true').first();
  await to(city, 900); await p.waitForTimeout(500); await cap(null);
  await click(city, 200, 2600);
  // 2. les annonces de la ville
  await cap("Les annonces du soir, avec leur rendement sur 15 ans");
  const row = p.locator('[data-v2open^="v|"]').first();
  await to(row, 800); await p.waitForTimeout(900);
  await click(row, 200, 2200); await cap(null);
  // 3. la fiche
  await cap("La fiche d'un studio : crédit, loyer, impôts, revente");
  const fav = p.getByRole('button', { name: 'Favorable' }).locator('visible=true').first();
  if (await fav.count()) { await click(fav, 900, 1300); await click(p.getByRole('button', { name: 'Central' }).locator('visible=true').first(), 500, 900); }
  await cap(null);
  const fiche = p.locator('aside.v2fiche');
  const fb = await fiche.boundingBox(); await glide(fb.x + fb.width * 0.6, fb.y + fb.height * 0.6, 600);
  await cap("Et ce qu'il faut vérifier avant de visiter");
  await scrollIn('aside.v2fiche', 520, 2400); await p.waitForTimeout(1600);
  await cap(null);
  // 4. onglet Calcul
  const calc = p.getByRole('button', { name: 'Calcul', exact: true }).locator('visible=true').first();
  await calc.scrollIntoViewIfNeeded(); await p.waitForTimeout(300);
  await click(calc, 800, 1200);
  await cap("Le calcul, associé par associé");
  await glide(fb.x + fb.width * 0.6, fb.y + fb.height * 0.65, 500);
  await scrollIn('aside.v2fiche', 700, 2600); await p.waitForTimeout(1500); await cap(null);
  // 5. onglet Quartier
  const q = p.getByRole('button', { name: 'Quartier', exact: true }).locator('visible=true').first();
  await q.scrollIntoViewIfNeeded(); await p.waitForTimeout(300);
  await click(q, 800, 1000);
  await cap("Et le quartier : trajets, commerces, étudiants, risques");
  await glide(fb.x + fb.width * 0.6, fb.y + fb.height * 0.65, 500);
  await scrollIn('aside.v2fiche', 600, 2200); await p.waitForTimeout(2000); await cap(null);
  await p.waitForTimeout(600);
  const v = p.video(); await ctx.close(); console.log("VIDEO", await v.path()); await b.close();
})();
