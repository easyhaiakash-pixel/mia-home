// make-plates.js: renders check pictures of every camera preset with headless Chrome.
//   node make-plates.js                 → checks/NN-<shot>-<mood>.png (+ -mia version), move frames, speed + same-picture tests
//   node make-plates.js part1           → checks/p01-shot-XX.png (every shot of scripts/S1-P01-twelve-dollars.md)
//   node make-plates.js snap <set> <shot> <mood> [t]   → checks/snap.png (quick look while working)
'use strict';
const fs = require('fs'), path = require('path'), os = require('os');
const { start } = require('./serve.js');
function load(name) {
  for (const d of [__dirname, process.env.VIDEOHUB_DIR, path.join(os.homedir(), 'personal/Videohub')].filter(Boolean)) { try { return require(require.resolve(name, { paths: [d] })); } catch (e) { } }
  console.error('puppeteer-core not found (it ships with VideoHub in ~/personal/Videohub).'); process.exit(2);
}
const puppeteer = load('puppeteer-core');
const CHROME = process.env.CHROME || ['/Applications/Google Chrome.app/Contents/MacOS/Google Chrome', '/Applications/Microsoft Edge.app/Contents/MacOS/Microsoft Edge', '/usr/bin/google-chrome'].find(f => fs.existsSync(f));
const OUT = path.join(__dirname, 'checks');
const MIA_SRC = path.join(__dirname, '../art/character-design/mia.js');

// Part 1 shots (scripts/S1-P01-twelve-dollars.md): set, preset, mood, face, props, t
const PART1 = [
  { n: 1, set: 'studio', shot: 'studio-phone', mood: 'night', props: { phoneScreen: 'bank' }, t: 1.2 },
  { n: 2, set: 'studio', shot: 'studio-door', mood: 'night', props: { rentNotice: '3 DAYS' }, t: 1.5, mia: false },
  { n: 3, set: 'studio', shot: 'studio-wide', mood: 'night', face: 'sad', props: { noodleCup: true }, t: 1.5, top: '#ffc2d1' },
  { n: 4, set: 'studio', shot: 'studio-window', mood: 'night', face: 'sad', props: { deadPlantDroop: 0.9 }, t: 1.5 },
  { n: 5, set: 'cafe', shot: 'cafe-wide', mood: 'day', face: 'neutral', props: {}, t: 1.2 },
  { n: 6, set: 'cafe', shot: 'cafe-corner', mood: 'day', face: 'neutral', props: { adrian: true }, t: 1.0 },
  { n: 7, set: 'cafe', shot: 'cafe-corner', mood: 'day', face: 'neutral', props: { adrian: true }, t: 2.6 },
  { n: 8, set: 'cafe', shot: 'cafe-corner', mood: 'day', face: 'neutral', props: { adrian: false, napkinOpen: 0 }, t: 1.5 },
  { n: 9, set: 'cafe', shot: 'cafe-table-close', mood: 'day', face: 'neutral', props: { adrianCup: 0.8, napkinOpen: 0, cashStack: 1 }, t: 1.2 },
  { n: 10, set: 'cafe', shot: 'cafe-table-close', mood: 'day', face: 'shock', props: { adrianCup: 1, napkinOpen: 0, cashStack: 10 }, t: 2.0 },
  { n: 11, set: 'cafe', shot: 'cafe-table-close', mood: 'day', face: 'shock', props: { adrianCup: 1, napkinOpen: 1, napkinNote: 'note', cashStack: 10 }, t: 2.5, mia: false },
  { n: 12, set: 'cafe', shot: 'cafe-wide', mood: 'day', face: 'shock', props: { blackCar: 0.55 }, t: 2.0 },
  { n: 13, set: 'cafe', shot: 'cafe-wide', mood: 'day', face: 'shock', props: { blackCar: 0.8 }, t: 2.5, focus: 'soft', mia: false },
  { n: 14, set: 'cafe', shot: 'cafe-corner', mood: 'day', face: 'shock', props: { adrian: false, cashStack: 10 }, t: 3.0 },
];

(async () => {
  const mode = process.argv[2] || 'all';
  fs.mkdirSync(OUT, { recursive: true });
  if (fs.existsSync(MIA_SRC)) fs.copyFileSync(MIA_SRC, path.join(__dirname, 'vendor/mia.js'));
  const srv = await start(0), port = srv.address().port;
  const br = await puppeteer.launch({ executablePath: CHROME, headless: 'new', args: ['--allow-file-access-from-files', '--force-device-scale-factor=1', '--hide-scrollbars', '--enable-gpu', '--ignore-gpu-blocklist', '--use-angle=metal'] });
  const page = await br.newPage();
  page.on('console', m => { if (/error|warn/i.test(m.type())) console.log('[page]', m.text()); });
  page.on('pageerror', e => console.log('[page error]', e.message));
  await page.setViewport({ width: 1400, height: 1000 });
  await page.goto(`http://127.0.0.1:${port}/viewer.html`);
  await page.waitForFunction('window.READY === true', { timeout: 60000 });
  const shoot = async (o, file) => {
    const r = await page.evaluate(async (o) => {
      const p = { ...(o.props || {}) };
      if (p.phoneScreen === 'bank') p.phoneScreen = DEMO.bank;
      if (p.napkinNote === 'note') p.napkinNote = DEMO.note;
      const r = await HS.draw({ ...o, props: p });
      return { ...r, png: HS.png() };
    }, o);
    fs.writeFileSync(path.join(OUT, file), Buffer.from(r.png.split(',')[1], 'base64'));
    return r;
  };
  const report = [];
  if (mode === 'snap') {
    const [, , , set, shot, mood = 'night', t = '0'] = process.argv;
    const r = await shoot({ set, shot, mood, t: +t, focus: process.env.FOCUS, mia: process.env.MIA !== '0', face: process.env.FACE || 'neutral' }, process.env.OUTFILE || 'snap.png');
    console.log(shot, `${r.ms.toFixed(0)} ms`, JSON.stringify(r.spot), JSON.stringify(r.info));
  } else if (mode === 'part1') {
    for (const s of PART1) {
      const r = await shoot({ ...s, mia: s.mia !== false, face: s.face || 'neutral' }, `p01-shot-${String(s.n).padStart(2, '0')}.png`);
      console.log(`shot ${s.n}: ${s.shot} ${r.ms.toFixed(0)} ms`);
    }
  } else {
    let n = 1;
    for (const set of ['studio', 'cafe']) {
      const shots = await page.evaluate(s => HS.shots(s), set);
      for (const shot of shots) for (const mood of ['night', 'day']) {
        const base = `${String(n).padStart(2, '0')}-${shot}-${mood}`;
        await shoot({ set, shot, mood, t: 0, mia: false }, `${base}.png`);
        const r = await shoot({ set, shot, mood, t: 1.5, mia: true }, `${base}-mia.png`);
        report.push(`${base}: ${r.ms.toFixed(0)} ms`);
        n++;
      }
      // camera move: t = 0, 1.5, 3 side by side is made below with ffmpeg-free stitching in the page
      for (const shot of shots) {
        const strip = await page.evaluate(async (set, shot) => {
          const c = document.createElement('canvas'); c.width = 1080 * 3 / 3; c.height = 1920 / 3; const g = c.getContext('2d');
          for (let i = 0; i < 3; i++) { await HS.draw({ set, shot, mood: 'night', t: i * 1.5, mia: true }); g.drawImage(document.getElementById('out'), i * 360, 0, 360, 640); }
          return c.toDataURL('image/png');
        }, set, shot);
        fs.writeFileSync(path.join(OUT, `move-${shot}.png`), Buffer.from(strip.split(',')[1], 'base64'));
      }
    }
    // same input twice → same picture?
    const a = await shoot({ set: 'studio', shot: 'studio-wide', mood: 'night', t: 1.3, mia: true }, 'same-a.png');
    const b = await shoot({ set: 'cafe', shot: 'cafe-wide', mood: 'day', t: 0.4, mia: true }, 'same-tmp.png');
    const c = await shoot({ set: 'studio', shot: 'studio-wide', mood: 'night', t: 1.3, mia: true }, 'same-b.png');
    const same = fs.readFileSync(path.join(OUT, 'same-a.png')).equals(fs.readFileSync(path.join(OUT, 'same-b.png')));
    fs.unlinkSync(path.join(OUT, 'same-tmp.png'));
    report.push(`same input twice gives the same picture: ${same ? 'YES' : 'NO'}`);
    // speed: 20 frames of a moving shot
    const speed = await page.evaluate(async () => { const out = []; for (const [set, shot] of [['studio', 'studio-wide'], ['cafe', 'cafe-wide']]) { const ts = []; for (let i = 0; i < 20; i++) { const r = await HS.draw({ set, shot, mood: 'night', t: i * 0.15 }); ts.push(r.ms); } ts.sort((a, b) => a - b); out.push(`${shot}: median ${ts[10].toFixed(0)} ms, worst ${ts[19].toFixed(0)} ms`); } return out; });
    report.push(...speed);
    fs.writeFileSync(path.join(OUT, 'report.txt'), report.join('\n') + '\n');
    console.log(report.join('\n'));
  }
  await br.close(); srv.close();
})().catch(e => { console.error(e); process.exit(1); });
