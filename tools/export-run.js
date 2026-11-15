// node tools/export-run.js <outDir>  → writes studio/ and cafe/ (GLB + JSON + PNGs) for the Unity project
const fs = require('fs'), path = require('path');
const p = require(require.resolve('puppeteer-core', { paths: [process.env.HOME + '/personal/Videohub'] }));
const { start } = require('../serve.js');
(async () => {
  const out = path.resolve(process.argv[2] || 'export'), page = process.argv[3] || 'tools/export.html'; const srv = await start(0); const port = srv.address().port;
  const b = await p.launch({ executablePath: '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome', headless: 'new', args: ['--enable-gpu', '--ignore-gpu-blocklist', '--use-angle=metal'] });
  const pg = await b.newPage(); pg.on('console', m => { const t = m.text(); if (!/GLTFExporter.*(not supported|Use MeshStandard)/.test(t)) console.log('[page]', t.slice(0, 300)); }); pg.on('pageerror', e => console.log('ERR', e.message));
  await pg.goto(`http://127.0.0.1:${port}/${page}`); await pg.waitForFunction('window.DONE===true', { timeout: 120000 });
  const files = await pg.evaluate(() => window.OUT || {});
  for (const [f, data] of Object.entries(files)) { const fp = path.join(out, f); fs.mkdirSync(path.dirname(fp), { recursive: true }); fs.writeFileSync(fp, Buffer.from(data, 'base64')); console.log(f, (fs.statSync(fp).size / 1024).toFixed(0) + ' KB'); }
  await b.close(); srv.close();
})();
