/* Le son : voix de la VHF (filtre radio), ambiance marine générée, musique (domaine public). Démarre au premier geste. */
const PR_AUDIO = { music: { mer: 'assets/audio/musique-mer.m4a', cabine: 'assets/audio/musique-cabine.m4a' }, voix: 'assets/audio/voix/' };
const prHash = (s) => { let x = 5381; for (let i = 0; i < s.length; i++) x = ((x * 33) ^ s.charCodeAt(i)) >>> 0; return x.toString(36); };
Object.assign(Component.prototype, {
  soundOn() { try { return localStorage.getItem('elba-son') !== 'off'; } catch (e) { return true; } },
  audioInit() {
    if (this.au) return; const AC = window.AudioContext || window.webkitAudioContext; if (!AC) return;
    const ctx = new AC(), A = { ctx, buf: {}, music: {} }; this.au = A;
    A.master = ctx.createGain(); A.master.gain.value = this.soundOn() ? 1 : 0; A.master.connect(ctx.destination);
    const bus = (v) => { const g = ctx.createGain(); g.gain.value = v; g.connect(A.master); return g; };
    A.musicBus = bus(0.2); A.ambBus = bus(0.5); A.voiceBus = bus(1.1);
    // bruits de base (brun pour la mer, blanc pour le vent), en boucle
    const noise = (brown) => { const n = ctx.sampleRate * 4, b = ctx.createBuffer(1, n, ctx.sampleRate), d = b.getChannelData(0); let last = 0; for (let i = 0; i < n; i++) { const w = Math.random() * 2 - 1; if (brown) { last = (last + 0.02 * w) / 1.02; d[i] = last * 3.5; } else d[i] = w * 0.5; } return b; };
    A.brown = noise(true); A.white = noise(false);
    const loop = (b) => { const s = ctx.createBufferSource(); s.buffer = b; s.loop = true; s.start(ctx.currentTime + Math.random()); return s; };
    const lfo = (rate, depth, target, base) => { const o = ctx.createOscillator(); o.frequency.value = rate; const g = ctx.createGain(); g.gain.value = depth; o.connect(g); g.connect(target); target.value = base; o.start(); };
    // la mer : deux houles décalées
    A.waveLP = ctx.createBiquadFilter(); A.waveLP.type = 'lowpass'; A.waveLP.frequency.value = 520; A.waveG = ctx.createGain(); A.waveG.gain.value = 0; A.waveLP.connect(A.waveG); A.waveG.connect(A.ambBus);
    [[0.11, 0.5], [0.07, 0.35]].forEach(([r, d]) => { const s = loop(A.brown), g = ctx.createGain(); lfo(r, d, g.gain, 0.6); s.connect(g); g.connect(A.waveLP); });
    // le vent : bande étroite qui ondule
    const wb = ctx.createBiquadFilter(); wb.type = 'bandpass'; wb.Q.value = 0.8; lfo(0.05, 350, wb.frequency, 700); A.windG = ctx.createGain(); A.windG.gain.value = 0; const ws = loop(A.white), wg = ctx.createGain(); lfo(0.09, 0.35, wg.gain, 0.5); ws.connect(wb); wb.connect(wg); wg.connect(A.windG); A.windG.connect(A.ambBus);
    // la voix passe par un filtre « radio »
    A.vIn = ctx.createBiquadFilter(); A.vIn.type = 'highpass'; A.vIn.frequency.value = 300; const lp = ctx.createBiquadFilter(); lp.type = 'lowpass'; lp.frequency.value = 3400; const sh = ctx.createWaveShaper(); const c = new Float32Array(256); for (let i = 0; i < 256; i++) { const x = i / 128 - 1; c[i] = Math.tanh(2.2 * x) / Math.tanh(2.2); } sh.curve = c; A.vIn.connect(lp); lp.connect(sh); sh.connect(A.voiceBus);
    fetch(PR_AUDIO.voix + 'index.json').then((r) => r.json()).then((l) => { A.have = new Set(l); if (this.pendingVoice) { const t = this.pendingVoice; this.pendingVoice = null; this.speak(t); } }).catch(() => { A.have = new Set(); });
    this.audioTimer = setInterval(() => this.audioStep(), 400); this.audioStep();
  },
  load(url) { const A = this.au; if (!A.buf[url]) A.buf[url] = fetch(url).then((r) => r.arrayBuffer()).then((ab) => new Promise((ok, ko) => A.ctx.decodeAudioData(ab, ok, ko))); return A.buf[url]; },
  // petit grésillement et bip de la VHF
  squelch(at, long) { const A = this.au, ctx = A.ctx; const s = ctx.createBufferSource(); s.buffer = A.white; const f = ctx.createBiquadFilter(); f.type = 'bandpass'; f.frequency.value = 2200; f.Q.value = 0.6; const g = ctx.createGain(); g.gain.setValueAtTime(0.0001, at); g.gain.exponentialRampToValueAtTime(0.5, at + 0.02); g.gain.exponentialRampToValueAtTime(0.0001, at + (long ? 0.22 : 0.12)); s.connect(f); f.connect(g); g.connect(A.voiceBus); s.start(at, Math.random() * 3, 0.3); },
  speak(text) {
    const A = this.au; if (!A || !text || !this.soundOn()) return; if (!A.have) { this.pendingVoice = text; return; }
    const k = prHash(text); if (!A.have.has(k)) return; const ctx = A.ctx, my = (this.voiceId = (this.voiceId || 0) + 1);
    if (this.voiceSrc) { try { this.voiceSrc.stop(); } catch (e) {} this.voiceSrc = null; }
    this.load(PR_AUDIO.voix + k + '.m4a').then((b) => { if (my !== this.voiceId) return; const t = ctx.currentTime + 0.05; this.squelch(t); const s = ctx.createBufferSource(); s.buffer = b; s.connect(A.vIn); s.start(t + 0.16); this.voiceSrc = s; this.voiceEnd = t + 0.16 + b.duration;
      s.onended = () => { if (this.voiceSrc === s) { this.voiceSrc = null; this.squelch(ctx.currentTime, true); } }; }).catch(() => {});
  },
  playMusic(key) {
    const A = this.au; if (!A || A.cur === key) return; A.cur = key; const ctx = A.ctx, now = ctx.currentTime;
    Object.keys(A.music).forEach((k) => { if (k !== key) { const m = A.music[k]; m.g.gain.cancelScheduledValues(now); m.g.gain.setValueAtTime(m.g.gain.value, now); m.g.gain.linearRampToValueAtTime(0, now + 2.5); } });
    const go = (m) => { m.g.gain.cancelScheduledValues(ctx.currentTime); m.g.gain.setValueAtTime(m.g.gain.value, ctx.currentTime); m.g.gain.linearRampToValueAtTime(1, ctx.currentTime + 3); };
    if (A.music[key]) { go(A.music[key]); return; }
    this.load(PR_AUDIO.music[key]).then((b) => { if (A.music[key]) return; const s = ctx.createBufferSource(); s.buffer = b; s.loop = true; const g = ctx.createGain(); g.gain.value = 0; s.connect(g); g.connect(A.musicBus); s.start(); A.music[key] = { s, g }; if (A.cur === key) go(A.music[key]); }).catch(() => {});
  },
  audioStep() {
    const A = this.au; if (!A) return; const ph = this.st().phase, ctx = A.ctx, now = ctx.currentTime, set = (p, v) => p.setTargetAtTime(v, now, 0.8);
    const high = ph === 'archipel' || ph === 'escale', cab = ph === 'cabine';
    set(A.waveG.gain, cab ? 0.45 : high ? 0.55 : 1); set(A.windG.gain, cab ? 0 : high ? 0.9 : 0.35); set(A.waveLP.frequency, cab ? 200 : 520);
    const talking = this.voiceSrc && now < (this.voiceEnd || 0); set(A.musicBus.gain, talking ? 0.07 : 0.2); set(A.ambBus.gain, talking ? 0.25 : 0.5);
    if (this.soundOn()) this.playMusic(cab || ph === 'nuit' ? 'cabine' : 'mer');
  },
  setSound(on) { try { localStorage.setItem('elba-son', on ? 'on' : 'off'); } catch (e) {} if (this.au) { const g = this.au.master.gain; g.setTargetAtTime(on ? 1 : 0, this.au.ctx.currentTime, 0.15); if (on && this.au.ctx.state === 'suspended') this.au.ctx.resume(); } this.setState({ sound: on }); }
});
// la voix suit chaque message radio
(() => {
  const say0 = Component.prototype.say, prev0 = Component.prototype.radioPrev;
  Component.prototype.say = function (text, from, noLog) { say0.call(this, text, from, noLog); this.lastSay = { text, at: Date.now() }; if (this.au) this.speak(text); };
  Component.prototype.radioPrev = function () { prev0.call(this); const L = this.radioLog || []; if (this.au && L[this.radioIdx]) this.speak(L[this.radioIdx][0]); };
  // premier geste : on allume le son (les navigateurs l'exigent), et on dit le message en cours s'il est récent
  const start = () => { const C = window.__elba; if (!C || C.au) return; C.audioInit(); if (!C.au) return; if (C.au.ctx.state === 'suspended') C.au.ctx.resume();
    setTimeout(() => { const L = C.lastSay; if (L && Date.now() - L.at < 30000 && !C.voiceSrc) C.speak(L.text); }, 60);
    ['pointerdown', 'keydown', 'touchstart'].forEach((e) => window.removeEventListener(e, start, true)); };
  ['pointerdown', 'keydown', 'touchstart'].forEach((e) => window.addEventListener(e, start, true));
})();
