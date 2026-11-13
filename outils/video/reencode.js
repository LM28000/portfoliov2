const { chromium } = require("playwright");
const fs = require('fs');
const [start, end, kbps, out] = [Number(process.argv[2]), Number(process.argv[3]), Number(process.argv[4]), process.argv[5]];
(async () => { const b = await chromium.launch({ args: ['--autoplay-policy=no-user-gesture-required'] }); const p = await b.newPage();
  await p.goto("http://localhost:8766/frames.html");
  const b64 = await p.evaluate(({ start, end, kbps }) => new Promise(async (resolve) => {
    const v = document.getElementById('v'); await new Promise((r) => v.readyState >= 2 ? r() : v.addEventListener('canplay', r, { once: true }));
    const c = document.createElement('canvas'); c.width = 1280; c.height = 800; const g = c.getContext('2d');
    v.currentTime = start; await new Promise((r) => v.addEventListener('seeked', r, { once: true }));
    const st = c.captureStream(30); const mime = MediaRecorder.isTypeSupported('video/webm;codecs=vp9') ? 'video/webm;codecs=vp9' : 'video/webm;codecs=vp8';
    const rec = new MediaRecorder(st, { mimeType: mime, videoBitsPerSecond: kbps * 1000 }); const chunks = [];
    rec.ondataavailable = (e) => e.data.size && chunks.push(e.data);
    rec.onstop = async () => { const blob = new Blob(chunks, { type: 'video/webm' }); const buf = new Uint8Array(await blob.arrayBuffer()); let s = ''; for (let i = 0; i < buf.length; i += 32768) s += String.fromCharCode.apply(null, buf.subarray(i, i + 32768)); resolve(mime + '|' + btoa(s)); };
    let iv; const draw = () => { g.drawImage(v, 0, 0, 1280, 800); if (v.currentTime >= end || v.ended) { clearInterval(iv); rec.stop(); v.pause(); } };
    rec.start(1000); await v.play(); iv = setInterval(draw, 33);
  }), { start, end, kbps });
  const [mime, data] = b64.split('|'); fs.writeFileSync(out, Buffer.from(data, 'base64')); console.log(mime, fs.statSync(out).size);
  await b.close(); })();
