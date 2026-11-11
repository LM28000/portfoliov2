/* Branche le monde 3D (scene.js) sur la page HTML. */
(() => {
  const $ = (id) => document.getElementById(id);
  const C = new Component();
  let vals = C.renderVals();
  vals.setHost($('host')); vals.setLayer($('layer')); vals.setChart($('chart'));
  let actSig = '';
  const render = () => {
    vals = C.renderVals();
    $('hint').textContent = vals.hint;
    $('radioFrom').textContent = vals.radioFrom;
    $('radio').textContent = vals.radio;
    $('loadMsg').textContent = vals.loadMsg;
    $('loading').classList.toggle('done', !vals.loading);
    const sig = vals.actions.map((a) => a.label + '|' + a.cls).join('§');
    if (sig !== actSig) {
      actSig = sig; const nav = $('actions'); nav.innerHTML = '';
      vals.actions.forEach((a, i) => { const b = document.createElement('button'); b.className = a.cls; b.textContent = a.label; b.onclick = () => vals.actions[i] && vals.actions[i].go(); nav.appendChild(b); });
    }
    $('pads').hidden = !vals.showPads;
    const ask = $('ask'); ask.hidden = !vals.ask; if (vals.ask) { ask.style.left = vals.askX + 'px'; ask.style.top = vals.askY + 'px'; }
    $('archi').hidden = !vals.showArchi;
    const app = $('appview'); app.hidden = !vals.showApp;
    if (vals.showApp && !$('appframe').src) $('appframe').src = 'https://insula.du-cray.eu/';
  };
  C._render = render;
  $('askGo').onclick = () => vals.askGo(); $('askNo').onclick = () => vals.askNo();
  $('closeApp').onclick = () => vals.closeApp();
  document.querySelectorAll('.pr-pad').forEach((b) => {
    const k = b.dataset.pad; const on = () => (k === 'L' ? vals.padL : k === 'R' ? vals.padR : vals.padU)(); const off = () => vals.padOff();
    b.addEventListener('pointerdown', on); b.addEventListener('pointerup', off); b.addEventListener('pointerleave', off); b.addEventListener('pointercancel', off);
  });
  $('creditsBtn').onclick = () => { $('credits').hidden = false; };
  $('creditsClose').onclick = () => { $('credits').hidden = true; };
  document.addEventListener('keydown', (e) => { if (e.key === 'Escape') { if (!$('credits').hidden) $('credits').hidden = true; else if (vals.showApp) vals.closeApp(); } });
  C.componentDidMount();
  render();
})();
