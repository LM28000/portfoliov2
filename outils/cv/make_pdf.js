// Usage (depuis outils/) : npm run cv  ->  ../assets/cv-louis-marie-perret-du-cray.pdf
const { chromium } = require('playwright');
(async () => { const b = await chromium.launch(); const p = await b.newPage();
  await p.goto('file://' + __dirname + '/cv.html', { waitUntil: 'networkidle' }); await p.waitForTimeout(800);
  await p.pdf({ path: process.argv[2], format: 'A4', printBackground: true, margin: { top: 0, bottom: 0, left: 0, right: 0 } });
  await p.setViewportSize({ width: 794, height: 1123 }); await p.screenshot({ path: __dirname + '/cv_apercu.png', fullPage: true });
  await b.close(); })();
