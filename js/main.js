/* Branche le monde 3D (scene.js) sur la page HTML. */
(() => {
  const $ = (id) => document.getElementById(id);
  // 1. pas de 3D possible : on montre directement la version texte, au lieu d'un chargement sans fin
  const no3d = () => { document.body.classList.add('no3d'); const n = document.querySelector('.texte-note'); if (n) n.hidden = false; };
  let gl = null; try { const cv = document.createElement('canvas'); gl = cv.getContext('webgl') || cv.getContext('experimental-webgl'); } catch (e) { gl = null; }
  if (!gl || !window.THREE) { no3d(); return; }
  window.addEventListener('error', (e) => { if (/WebGL/i.test(e.message || '')) no3d(); });
  const C = new Component();
  let vals = C.renderVals();
  vals.setHost($('host')); vals.setLayer($('layer')); vals.setChart($('chart'));
  let actSig = '';
  const render = () => {
    vals = C.renderVals();
    $('hint').textContent = vals.hint;
    $('radioFrom').textContent = vals.radioFrom;
    $('radio').textContent = vals.radio;
    const rl = vals.radioLinks.map((l) => l.join('|')).join('§'); if ($('radioLinks').dataset.sig !== rl) { $('radioLinks').dataset.sig = rl; $('radioLinks').innerHTML = ''; vals.radioLinks.forEach(([t, u]) => { const a = document.createElement('a'); a.href = u; if (!u.startsWith('mailto')) { a.target = '_blank'; a.rel = 'noopener'; } a.textContent = t; $('radioLinks').appendChild(a); }); }
    if (!window.__slow) $('loadMsg').textContent = vals.loadMsg;
    $('loading').classList.toggle('done', !vals.loading);
    document.body.className = document.body.className.replace(/\bph-\S+/g, '').trim() + ' ph-' + vals.phase;
    document.body.classList.toggle('hint-on', !!vals.hintOn);
    $('mapCount').textContent = '· ' + vals.progress; $('chartBtn').classList.toggle('pulse', !!vals.pulseChart);
    $('objText').textContent = vals.objText || '';
    const son = C.soundOn(); $('soundBtn').textContent = son ? '🔊' : '🔇'; $('soundBtn').title = son ? 'Couper le son' : 'Activer le son'; $('soundBtn').setAttribute('aria-label', $('soundBtn').title);
    const sig = vals.actions.map((a) => a.label + '|' + a.cls).join('§');
    if (sig !== actSig) {
      actSig = sig; const nav = $('actions'); nav.innerHTML = '';
      vals.actions.forEach((a, i) => { const b = document.createElement('button'); b.className = a.cls; b.textContent = a.label; b.onclick = () => vals.actions[i] && vals.actions[i].go(); nav.appendChild(b); });
    }
    $('pads').hidden = !vals.showPads;
    const ask = $('ask'); ask.hidden = !vals.ask; if (vals.ask) { ask.style.left = vals.askX + 'px'; ask.style.top = vals.askY + 'px'; }
    $('archi').hidden = !vals.showArchi;
    document.body.classList.toggle('texte-open', !!vals.showText); $('texteClose').hidden = !vals.showText;
    const app = $('appview'); app.hidden = !vals.showApp;
    if (vals.showApp && !$('appframe').src) $('appframe').src = 'https://insula.du-cray.eu/';
    $('voyage').hidden = !vals.showMap; $('chartBtn').style.visibility = vals.showMap ? 'hidden' : ''; $('mapBtn').hidden = !!vals.showMap;
    if (vals.showMap) { const sig2 = vals.stops.map((x) => x.k + (x.done ? 1 : 0) + (x.here ? 1 : 0) + (x.show ? 1 : 0)).join(); const m = $('voyMap');
      if (m.dataset.sig !== sig2) { m.dataset.sig = sig2; m.querySelectorAll('.stop').forEach((e) => e.remove());
        vals.stops.filter((x) => x.show).forEach((x) => { const bt = document.createElement('button'); bt.className = 'stop' + (x.sub ? ' sub' : '') + (x.big ? ' big' : '') + (x.done ? ' done' : '') + (x.here ? ' here' : ''); bt.style.left = x.x + '%'; bt.style.top = x.y + '%';
          bt.innerHTML = '<span class="num"></span><span><b></b><small></small></span>'; bt.querySelector('.num').textContent = x.n; bt.querySelector('b').textContent = x.t; bt.querySelector('small').textContent = x.d; bt.title = x.t + ' — ' + x.d; bt.onclick = () => vals.goTo(x.k); m.appendChild(bt); });
        const main = ['ponton', 'insula', 'cartevivante', 'serveur', 'cabine'].map((k) => vals.stops.find((x) => x.k === k)); $('voyPath').setAttribute('d', 'M ' + main.map((x) => x.x + ' ' + x.y).join(' L ')); } }
    const P = vals.panel, pe = $('panel'); pe.hidden = !P;
    if (P && pe.dataset.k !== P.title) { pe.dataset.k = P.title; $('pKicker').textContent = P.kicker; $('pTitle').textContent = P.title;
      $('pList').innerHTML = ''; (P.list || []).forEach(([h, t]) => { const li = document.createElement('li'); const b = document.createElement('b'); b.textContent = h; li.appendChild(b); li.appendChild(document.createTextNode(t)); $('pList').appendChild(li); }); $('pList').hidden = !(P.list && P.list.length);
      $('pParas').innerHTML = ''; (P.paras || []).forEach((t) => { const p = document.createElement('p'); p.textContent = t; $('pParas').appendChild(p); });
      $('pLinks').innerHTML = ''; (P.links || []).forEach(([t, u]) => { const a = document.createElement('a'); a.href = u; a.target = '_blank'; a.rel = 'noopener'; a.textContent = t + ' ↗'; $('pLinks').appendChild(a); }); }
    if (!P) pe.dataset.k = '';
  };
  C._render = render;
  $('askGo').onclick = () => vals.askGo(); $('askNo').onclick = () => vals.askNo();
  $('closeApp').onclick = () => vals.closeApp();
  document.querySelectorAll('.pr-pad').forEach((b) => {
    const k = b.dataset.pad; const on = () => (k === 'L' ? vals.padL : k === 'R' ? vals.padR : vals.padU)(); const off = () => vals.padOff();
    b.addEventListener('pointerdown', on); b.addEventListener('pointerup', off); b.addEventListener('pointerleave', off); b.addEventListener('pointercancel', off);
  });
  $('radioPrev').onclick = () => vals.radioPrev(); $('soundBtn').onclick = () => { C.setSound(!C.soundOn()); render(); };
  setTimeout(() => { if (vals.loading) { window.__slow = true; $('loadMsg').innerHTML = 'C\u2019est long… <button class="pr-btn2 sm" id="goText">Voir la version texte</button>'; const g = $('goText'); if (g) g.onclick = no3d; } }, 30000);
  $('chartBtn').onclick = () => vals.openMap(); $('mapBtn').onclick = () => vals.openMap(); $('voyClose').onclick = () => vals.closeMap(); $('voyStart').onclick = () => vals.goTo('ponton'); $('voyArch').onclick = () => vals.goArch(); $('voyText').onclick = () => vals.openText(); $('texteClose').onclick = () => vals.closeText();
  $('creditsBtn').onclick = () => { $('credits').hidden = false; };
  $('creditsClose').onclick = () => { $('credits').hidden = true; };
  document.addEventListener('keydown', (e) => { if (e.key === 'Escape') { if (vals.showText) { vals.closeText(); return; } if (vals.cabEsc && vals.cabEsc()) return; if (!$('credits').hidden) $('credits').hidden = true; else if (vals.showMap) vals.closeMap(); else if (vals.showApp) vals.closeApp(); } });
  window.__elba = C; // pour les tests
  C.componentDidMount();
  render();
})();
