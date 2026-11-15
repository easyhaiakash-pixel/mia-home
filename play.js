// play.js: "Mia's World", the interactive site. Walk Mia around her tiny studio and the café, use things, make choices.
// Built on the same 3D sets as the Reels (sets.js). Mia is her own 2D drawing, standing inside the 3D room.
import { createSet } from './sets.js';
import { THREE } from './parts/kit.js';
import { Actor } from './parts/actor.js';
import { drawMiaFull, drawMiaSleep, drawAdrianBack } from './parts/mia-body.js';

const $ = id => document.getElementById(id);
const glCanvas = $('gl');
const sleep = ms => new Promise(r => setTimeout(r, ms));
const lerp = (a, b, k) => a + (b - a) * k;
const clamp = (x, a, b) => Math.max(a, Math.min(b, x));

// ======================================================================= world data
// walk: bounds + blocked boxes [x0, x1, z0, z1]. hotspots: click box [cx,cy,cz, sx,sy,sz], where Mia stands, actions.
const WORLD = {
  studio: {
    bounds: [-1.85, 1.85, -2.2, 1.95], start: [0.35, 0.7],
    blocks: [[-2, -0.98, -2.4, -0.33], [-1.0, -0.52, -2.4, -1.96], [-0.4, 0.5, -2.07, -1.16], [-0.14, 0.44, -1.34, -0.76], [0.64, 2, -2.4, -1.76], [-1.17, -0.53, 0.43, 1.07], [1.28, 1.85, -0.87, -0.33]],
    cam: { dist: 3.0, h: 1.25, yaw: 0.22, clampX: [-1.75, 1.75], clampZ: [-1.2, 5] },
  },
  cafe: {
    bounds: [-3.3, 3.3, -2.88, 2.9], start: [2.7, 1.3],
    blocks: [[-3.5, 0.32, -3.5, -2.88], [-3.5, 0.27, -2.62, -1.9], [-1.27, -0.33, -1.25, 0.65], [-2.87, -1.93, -0.05, 1.85], [0.43, 1.37, 0.35, 2.25], [2.25, 3.2, -3.02, -2.08], [2.32, 2.98, -2.18, -1.55], [1.8, 2.4, -3.2, -2.58], [-3.5, -2.8, 2.05, 3], [0.5, 1.2, -3.5, -2.8], [2.8, 3.5, 2.2, 3]],
    cam: { dist: 3.5, h: 1.45, yaw: -0.1, clampX: [-3.2, 3.3], clampZ: [-1.5, 6.5] },
  },
};

// ======================================================================= game state
const S = {
  place: 'studio', mood: 'night', day: 1, rent: 3, money: 12.43, coins: 0.12, droop: 0.85, noodles: 11,
  lamp: true, holding: null, apron: false, adrian: 'away', choice: null, busy: false, t0: performance.now(),
  props: { studio: {}, cafe: {} },
};
const fmt = n => '$' + n.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
function hud() {
  $('place').innerHTML = S.place === 'studio' ? '🏠 <b>Home</b>' : '☕ <b>Bloom Café</b>';
  $('money').textContent = fmt(S.money);
  $('rent').textContent = S.rent > 1 ? `${S.rent} days` : S.rent === 1 ? '1 day!' : 'TODAY!';
  $('bMood').textContent = S.mood === 'night' ? '☀️' : '🌙';
}

// ======================================================================= sets, actors
const sets = {};
let set = null, mia, miaSleep, adrian;
let W = 0, H = 0, PR = 1;

const MIA_K = 0.62, MIA_OX = 180, MIA_OY = 158, MIA_CW = 360, MIA_CH = 650;
const MIA_M = 1.3 / 977;                            // metres per drawing unit (she is 1.3 m tall, chibi)
function makeMia(scene) {
  const a = new Actor(scene, {
    cw: MIA_CW, ch: MIA_CH, anchorPx: MIA_OY + 747 * MIA_K, heightM: MIA_CH / MIA_K * MIA_M, headM: 0.99,
    draw: (g, st) => drawMiaFull(g, MIA_OX, MIA_OY, MIA_K, st),
  });
  return a;
}
function makeSleeper(scene) {
  return new Actor(scene, { cw: 440, ch: 330, anchorPx: 318, heightM: 330 / 0.62 * MIA_M, headM: 0.5, shadow: 0.01,
    draw: (g, st) => drawMiaSleep(g, 220, 318, 0.62, st) });
}
function makeAdrian(scene) {
  return new Actor(scene, { cw: 330, ch: 460, anchorPx: 420, heightM: 460 / 0.45 * 0.00112, headM: 0.85, shadow: 0.01,
    draw: (g, st) => drawAdrianBack(g, 150, 420, 0.45, st) });
}

async function loadSet(name) {
  if (sets[name]) return sets[name];
  const c = name === 'studio' ? glCanvas : glCanvas;      // one visible canvas: each set gets its own renderer on demand
  const s = await createSet(name, { width: W || 1080, height: H || 1920, glCanvas: document.createElement('canvas') });
  s.glCanvas.style.cssText = 'position:fixed;inset:0;width:100%;height:100%;display:none';
  document.body.insertBefore(s.glCanvas, glCanvas);
  const actors = { mia: makeMia(s.scene) };
  if (name === 'studio') actors.sleeper = makeSleeper(s.scene);
  if (name === 'cafe') actors.adrian = makeAdrian(s.scene);
  sets[name] = { s, actors, grid: buildGrid(WORLD[name]), hot: buildHotspots(name) };
  s.setSize(W, H);
  return sets[name];
}
function showSet(name) {
  Object.entries(sets).forEach(([n, v]) => { v.s.glCanvas.style.display = n === name ? 'block' : 'none'; });
  const v = sets[name]; set = v.s; mia = v.actors.mia; miaSleep = v.actors.sleeper; adrian = v.actors.adrian;
  if (miaSleep) miaSleep.visible = false;
  S.place = name; hud();
}

// ======================================================================= walking (grid + A*)
const CELL = 0.1;
function buildGrid(wd) {
  const [x0, x1, z0, z1] = wd.bounds, nx = Math.round((x1 - x0) / CELL) + 1, nz = Math.round((z1 - z0) / CELL) + 1;
  const free = new Uint8Array(nx * nz);
  const pad = 0.16;
  for (let i = 0; i < nx; i++) for (let j = 0; j < nz; j++) {
    const x = x0 + i * CELL, z = z0 + j * CELL;
    free[j * nx + i] = wd.blocks.some(([a, b, c, d]) => x > a - pad && x < b + pad && z > c - pad && z < d + pad) ? 0 : 1;
  }
  return { x0, z0, nx, nz, free };
}
const cellOf = (gr, x, z) => [clamp(Math.round((x - gr.x0) / CELL), 0, gr.nx - 1), clamp(Math.round((z - gr.z0) / CELL), 0, gr.nz - 1)];
const isFree = (gr, i, j) => i >= 0 && j >= 0 && i < gr.nx && j < gr.nz && gr.free[j * gr.nx + i];
function nearestFree(gr, i, j) {
  if (isFree(gr, i, j)) return [i, j];
  for (let r = 1; r < 40; r++) for (let di = -r; di <= r; di++) for (const dj of [-r, r]) { if (isFree(gr, i + di, j + dj)) return [i + di, j + dj]; if (isFree(gr, i + dj, j + di)) return [i + dj, j + di]; }
  return [i, j];
}
function lineFree(gr, a, b) {
  const n = Math.ceil(Math.hypot(b[0] - a[0], b[1] - a[1]) / (CELL * 0.5));
  for (let k = 0; k <= n; k++) { const x = lerp(a[0], b[0], k / n), z = lerp(a[1], b[1], k / n); const [i, j] = cellOf(gr, x, z); if (!isFree(gr, i, j)) return false; }
  return true;
}
function findPath(gr, from, to) {
  const s = nearestFree(gr, ...cellOf(gr, ...from)), e = nearestFree(gr, ...cellOf(gr, ...to));
  const key = (i, j) => j * gr.nx + i, N = gr.nx * gr.nz;
  const g = new Float32Array(N).fill(1e9), came = new Int32Array(N).fill(-1), open = [[0, s[0], s[1]]], closed = new Uint8Array(N);
  g[key(...s)] = 0;
  while (open.length) {
    let bi = 0; for (let k = 1; k < open.length; k++) if (open[k][0] < open[bi][0]) bi = k;
    const [, i, j] = open.splice(bi, 1)[0]; const ck = key(i, j);
    if (closed[ck]) continue; closed[ck] = 1;
    if (i === e[0] && j === e[1]) break;
    for (let di = -1; di <= 1; di++) for (let dj = -1; dj <= 1; dj++) {
      if (!di && !dj) continue; const ni = i + di, nj = j + dj; if (!isFree(gr, ni, nj)) continue;
      if (di && dj && (!isFree(gr, i + di, j) || !isFree(gr, i, j + dj))) continue;
      const nk = key(ni, nj), ng = g[ck] + (di && dj ? 1.414 : 1);
      if (ng < g[nk]) { g[nk] = ng; came[nk] = ck; open.push([ng + Math.hypot(e[0] - ni, e[1] - nj), ni, nj]); }
    }
  }
  const pts = []; let k = key(...e);
  if (came[k] === -1 && k !== key(...s)) return [to];
  while (k !== -1) { pts.push([gr.x0 + (k % gr.nx) * CELL, gr.z0 + Math.floor(k / gr.nx) * CELL]); k = came[k]; }
  pts.reverse();
  // smooth: keep only the corners we need
  const out = []; let a = from;
  for (let q = 1; q < pts.length; q++) if (!lineFree(gr, a, pts[q])) { out.push(pts[q - 1]); a = pts[q - 1]; }
  const end = isFree(gr, ...cellOf(gr, ...to)) ? to : pts[pts.length - 1];
  out.push(end);
  return out;
}

// ======================================================================= Mia's state + animation
const M = { x: 0, z: 0, y: 0, path: [], speed: 1.15, phase: 0, pose: 'stand', face: 'neutral', hold: null, dir: 0, sit: null, sleeping: false, poseUntil: 0, talkPhase: 0, blinkAt: 2 };
function walkTo(x, z) {
  return new Promise(res => {
    M.sit = null; M.y = 0;
    M.path = findPath(sets[S.place].grid, [M.x, M.z], [x, z]); M.onArrive = res;
    if (!M.path.length) res();
  });
}
function stepMia(dt, now) {
  if (M.path.length) {
    const [tx, tz] = M.path[0], dx = tx - M.x, dz = tz - M.z, d = Math.hypot(dx, dz), st = M.speed * dt;
    if (d <= st) { M.x = tx; M.z = tz; M.path.shift(); if (!M.path.length && M.onArrive) { const f = M.onArrive; M.onArrive = null; f(); } }
    else { M.x += dx / d * st; M.z += dz / d * st; M.dir = Math.sign(dx) * Math.min(1, Math.abs(dx / d) * 1.5); }
    M.phase = (M.phase + st / 0.62) % 1;
  }
}
function miaPose(now) {
  const walking = M.path.length > 0;
  let pose = walking ? 'walk' : (M.sit ? 'sit' : (now < M.poseUntil ? M.pose : (M.talking ? 'talk' : 'stand')));
  if (!walking && M.sit && M.pose === 'phone') pose = 'sit';
  const blink = !walking && (now % 4.2) < 0.13;
  const phase = walking ? M.phase : ((now * 0.8) % 1);
  return { pose, phase: Math.round(phase * 24) / 24, face: M.face, hold: M.hold, apron: S.apron, top: S.apron ? '#ffc2d1' : '#ffc2d1', skirt: S.apron ? '#9fd3c7' : '#c9b6ec', blink, dir: Math.round(M.dir * 4) / 4, breathe: Math.round(((now * 0.35) % 1) * 12) / 12 };
}

// ======================================================================= speech + menus + choices
const bubble = $('bubble'), menu = $('menu');
let bubbleAnchor = null, menuAnchor = null, skip = null;
function project(p) {
  const v = p.clone().project(set.camera);
  return { x: (v.x * 0.5 + 0.5) * innerWidth, y: (-v.y * 0.5 + 0.5) * innerHeight, behind: v.z > 1 };
}
async function say(text, o = {}) {
  M.face = o.face || M.face; if (o.pose) { M.pose = o.pose; M.poseUntil = performance.now() / 1000 + 99; }
  if (o.hold !== undefined) M.hold = o.hold;
  M.talking = !o.pose;
  bubble.style.display = 'block'; bubbleAnchor = o.who === 'Adrian' ? 'adrian' : 'mia';
  const who = o.who || 'Mia';
  let shown = 0; const full = text;
  let done = false; skip = () => { if (shown < full.length) shown = full.length; else done = true; };
  const t0 = performance.now();
  while (!done) {
    shown = Math.max(shown, Math.min(full.length, Math.floor((performance.now() - t0) / 28)));
    bubble.innerHTML = `<span class="who">${who}</span>${full.slice(0, shown)}${shown >= full.length ? '<span class="next">tap ▸</span>' : ''}`;
    if (shown >= full.length && performance.now() - t0 > full.length * 28 + 1500 + full.length * 22) done = true;
    await sleep(30);
  }
  M.talking = false; M.poseUntil = 0; bubble.style.display = 'none'; skip = null;
}
bubble.addEventListener('pointerdown', e => { e.stopPropagation(); skip && skip(); });
function hideMenu() { menu.style.display = 'none'; menuAnchor = null; }
function showMenu(title, items, anchor) {
  menu.innerHTML = `<div class="title">${title}</div>` + items.map((it, i) => `<button data-i="${i}">${it.label}</button>`).join('') + `<button data-i="x" style="opacity:.8">✕</button>`;
  menu.style.display = 'flex'; menuAnchor = anchor;
  return new Promise(res => {
    menu.onpointerdown = e => { e.stopPropagation(); const b = e.target.closest('button'); if (!b) return; hideMenu(); res(b.dataset.i === 'x' ? null : items[+b.dataset.i]); };
  });
}
function choose(q, a, b) {
  const box = $('choice');
  box.innerHTML = `<div class="q">${q}</div><div class="cards">
    <div class="card" data-k="A" style="background:#8fc8ff"><span class="l">A</span><div class="t">${a[0]}</div><div class="s">${a[1]}</div></div>
    <div class="card" data-k="B" style="background:#ff9fc0"><span class="l">B</span><div class="t">${b[0]}</div><div class="s">${b[1]}</div></div></div>`;
  box.style.display = 'flex';
  return new Promise(res => { box.onpointerdown = e => { const c = e.target.closest('.card'); if (!c) return; e.stopPropagation(); box.style.display = 'none'; res(c.dataset.k); }; });
}
function showPhone() {
  const p = $('phone');
  p.innerHTML = `<div class="dev"><div class="scr"><div class="bar">My Bank 💗</div><div class="bal">Balance</div><div class="amt">${fmt(S.money)}</div>
    <div class="row"><span>Rent (due in ${Math.max(0, S.rent)} days)</span><span>-$900.00</span></div><div class="row"><span>Noodles × ${S.noodles}</span><span>-$${(S.noodles * 0.8).toFixed(2)}</span></div><div class="row"><span>Bus pass</span><span>-$45.00</span></div>
    <button class="btn close">Close</button></div></div>`;
  p.style.display = 'flex';
  return new Promise(res => { p.onpointerdown = e => { if (e.target.closest('.close') || e.target === p) { e.stopPropagation(); p.style.display = 'none'; res(); } }; });
}
async function fade(text, fn) {
  const f = $('fade'); f.textContent = text || ''; f.style.pointerEvents = 'auto'; f.style.opacity = 1; await sleep(650);
  await fn(); await sleep(text ? 1100 : 250); f.style.opacity = 0; f.style.pointerEvents = 'none'; await sleep(400);
}
const tween = (ms, f) => new Promise(res => { const t0 = performance.now(); const tick = () => { const k = Math.min(1, (performance.now() - t0) / ms); f(k); k < 1 ? requestAnimationFrame(tick) : res(); }; tick(); });

// ======================================================================= hotspots + actions
function buildHotspots(name) {
  const H = HOT[name](); H.forEach(h => {
    const [cx, cy, cz, sx, sy, sz] = h.box;
    h.mesh = new THREE.Mesh(new THREE.BoxGeometry(sx, sy, sz)); h.mesh.position.set(cx, cy, cz); h.mesh.updateMatrixWorld(true); h.mesh.userData.h = h;
    h.top = new THREE.Vector3(cx, cy + sy / 2 + 0.15, cz);
  });
  return H;
}
const P = () => S.props[S.place];
async function act(fn) { if (S.busy) return; S.busy = true; hideMenu(); try { await fn(); } finally { S.busy = false; M.pose = 'stand'; M.poseUntil = 0; } }

const HOT = {
  studio: () => [
    { id: 'phone', label: '📱 Phone', box: [-1.2, 0.62, -0.95, 0.3, 0.16, 0.34], stand: [-0.82, -0.75], actions: () => [
      { label: '📱 Check my bank', run: async () => { M.sit = { x: -1.12, z: -0.92, y: 0.2 }; M.hold = 'phone'; P().phoneLift = 1; M.face = 'neutral'; await sleep(300); await showPhone(); await say(S.money < 100 ? 'Twelve dollars. And forty-three cents.' : `${fmt(S.money)}... I still can't believe it.`, { face: S.money < 100 ? 'sad' : 'shock' }); if (S.money < 100) await say('Rent is nine hundred. I am... fine. Totally fine.', { face: 'teary' }); M.hold = null; P().phoneLift = 0; M.sit = null; } }] },
    { id: 'bed', label: '🛏️ Bed', box: [-1.5, 0.32, -1.4, 1.0, 0.4, 2.0], stand: [-0.82, -1.0], actions: () => [
      { label: '🛋️ Sit on the bed', run: async () => { M.sit = { x: -1.15, z: -1.05, y: 0.2 }; await say(['My bed. My office. My dining room.', 'Home sweet tiny home.', 'If I sit very still, maybe rent forgets me.'][S.day % 3], { face: 'happy' }); } },
      S.mood === 'night'
        ? { label: '😴 Go to sleep', run: sleepNight }
        : { label: '😴 Take a nap', run: async () => { await say('No naps. I have a shift soon.', { face: 'angry' }); } }] },
    { id: 'lamp', label: '💡 Lamp', box: [-0.76, 0.6, -2.2, 0.42, 0.55, 0.4], stand: [-0.7, -1.55], actions: () => [
      { label: S.lamp ? '💡 Turn lamp off' : '💡 Turn lamp on', run: async () => { S.lamp = !S.lamp; P().bedLamp = S.lamp; await say(S.lamp ? 'Cosy.' : 'Saving electricity. $84 is a lot.', { face: S.lamp ? 'happy' : 'neutral' }); } }] },
    { id: 'window', label: '🪟 Window', box: [0.05, 1.5, -2.33, 1.15, 1.15, 0.2], stand: [-0.55, -1.05], actions: () => [
      { label: '🌆 Look outside', run: async () => { await say(S.mood === 'night' ? 'All those lit windows. Everyone has a life.' : 'Sunny. The city is awake. I should be too.', { pose: 'think', face: S.mood === 'night' ? 'sad' : 'neutral' }); } },
      { label: '💧 Water the plant', run: async () => { S.droop = Math.max(0, S.droop - 0.45); P().deadPlantDroop = S.droop; await say(S.droop < 0.2 ? 'Wait... is it standing up? Don\'t give me hope like that.' : 'Drink up, little guy. We are both trying.', { face: S.droop < 0.2 ? 'shock' : 'happy' }); } }] },
    { id: 'table', label: '💻 Table', box: [0.05, 0.85, -1.62, 0.8, 0.3, 0.8], stand: [0.62, -1.15], actions: () => [
      { label: '💻 Look for jobs', run: async () => { await say('"Night shift. $9 an hour. Must love chaos."', { pose: 'think' }); await say('...Add to favourites.', { face: 'sad' }); } },
      { label: '🫙 Count my coins', run: async () => { await say(`Rent jar: ${fmt(3.4 + S.coins * 10)}. Only $${(900 - 3.4 - S.coins * 10).toFixed(2)} to go!`, { face: 'happy', pose: 'shrug' }); } },
      { label: '🍜 Eat noodles', run: async () => { S.noodles++; P().noodleCup = true; await say(`Noodles. Day ${S.noodles}. Still delicious. Still sad.`, { face: 'happy' }); } }] },
    { id: 'kitchen', label: '🍳 Mini kitchen', box: [1.08, 1.0, -2.1, 0.78, 0.45, 0.6], stand: [1.05, -1.42], actions: () => [
      { label: '🍜 Make noodles', run: async () => { await say('Boil water. Add hope. Three minutes.', { pose: 'think' }); await sleep(400); S.noodles++; await say('Chef\'s kiss. Michelin, call me.', { face: 'happy' }); } },
      { label: '🫖 Make tea', run: async () => { M.hold = 'cup'; await say('Tea fixes everything. Except money.', { face: 'happy' }); M.hold = null; } }] },
    { id: 'fridge', label: '🧊 Fridge', box: [1.72, 0.62, -2.08, 0.52, 0.95, 0.5], stand: [1.58, -1.38], actions: () => [
      { label: '🧊 Open the fridge', run: async () => { await say('One egg. Half a lemon. A lot of bills.', { face: 'sad' }); } },
      { label: '🧾 Read the bills', run: async () => { await say('Electric: $84. Water: $41. "PAY RENT!!" written by... me.', { face: 'teary' }); } }] },
    { id: 'mirror', label: '🪞 Mirror', box: [1.97, 1.5, -0.75, 0.12, 0.5, 0.5], stand: [1.55, -1.15], actions: () => [
      { label: '🪞 Look in the mirror', run: async () => { await say('Bow: cute. Necklace: Mom\'s. Bank: don\'t ask.', { pose: 'wave', face: 'happy' }); await say('You\'ve got this, Mia.', { face: 'happy' }); } }] },
    { id: 'basket', label: '🧺 Laundry', box: [-0.85, 0.25, 0.75, 0.55, 0.55, 0.55], stand: [-0.25, 0.6], actions: () => [
      { label: '🧺 Do the laundry', run: async () => { await say('Tomorrow. Tomorrow me is very strong.', { pose: 'shrug' }); } }] },
    { id: 'door', label: '🚪 Front door', box: [1.98, 1.1, 1.0, 0.14, 2.1, 0.95], stand: [1.42, 1.0], actions: () => [
      { label: '📄 Read the notice', run: async () => { await say(S.rent > 0 ? `"RENT DUE $900. ${S.rent} DAY${S.rent > 1 ? 'S' : ''}." Mr. Novak, you draw such nice letters.` : '"LAST WARNING." ...Oh no.', { face: S.rent > 1 ? 'sad' : 'teary' }); } },
      { label: '☕ Go to work', run: goToWork }] },
  ],
  cafe: () => [
    { id: 'machine', label: '☕ Coffee machine', box: [-2.45, 1.2, -3.25, 0.8, 0.6, 0.5], stand: [-2.4, -2.74], actions: () => [
      { label: '☕ Make black coffee', run: async () => { await say('Black coffee. No sugar. No milk. No words.', { pose: 'think' }); M.hold = 'cup'; await say('For the man in the corner.', { face: 'neutral' }); } }] },
    { id: 'register', label: '💳 Register', box: [-1.45, 1.15, -2.25, 0.5, 0.3, 0.45], stand: [-1.45, -2.74], actions: () => [
      { label: '💳 Work the register', run: async () => { await say('"Oat milk, extra hot, half sweet, no foam." Of course.', { face: 'angry' }); await say('Have a lovely day! ✨', { face: 'happy', pose: 'wave' }); } }] },
    { id: 'cakes', label: '🍰 Cakes', box: [-0.45, 1.3, -2.25, 0.95, 0.5, 0.6], stand: [-0.45, -1.5], actions: () => [
      { label: '🍰 Look at the cakes', run: async () => { await say('Strawberry cake. $6.50. We can look. We cannot touch.', { face: 'sad' }); } }] },
    { id: 'tips', label: '🫙 Tip jar', box: [-1.05, 1.15, -2.05, 0.22, 0.3, 0.22], stand: [-1.05, -1.5], actions: () => [
      { label: '🫙 Check the tips', run: async () => { await say('Four dollars. For six hours. Thank you, generous city.', { face: 'sad', pose: 'shrug' }); } }] },
    { id: 'adrian', label: '🖤 The quiet man', box: [2.64, 1.0, -1.87, 0.6, 1.1, 0.6], stand: [2.05, -1.55], when: () => S.adrian === 'here' || S.adrian === 'served', actions: () => [
      S.adrian === 'served'
        ? { label: '👀 Look at him', run: async () => { await say('Same table. Every day. Never says a word.', { pose: 'think' }); } }
        : M.hold === 'cup'
          ? { label: '☕ Serve his coffee', run: serveAdrian }
          : { label: '👋 Take his order', run: async () => { await say('Black coffee, right? You always...', { pose: 'talk' }); await say('...', { who: 'Adrian' }); await say('Okay! Black coffee. Coming up.', { face: 'happy' }); } }] },
    { id: 'atable', label: '☕ His table', box: [2.72, 0.85, -2.55, 0.9, 0.22, 0.9], stand: [2.06, -2.3], actions: () => [
      S.adrian === 'gone' && !S.choice
        ? { label: '🧹 Clear the table', run: clearTable }
        : { label: '🌸 Look at the flower', run: async () => { await say(S.adrian === 'away' ? 'His table. He comes every day at nine.' : 'One pink flower. He always moves it to face the window.', { pose: 'think' }); } }] },
    { id: 'window', label: '🪟 Window', box: [3.45, 1.55, -1.5, 0.15, 2.0, 3.4], stand: [2.65, -0.85], actions: () => [
      { label: '🌆 Look outside', run: async () => { await say('People with umbrellas, people with places to be.', { pose: 'think' }); } }] },
    { id: 'door', label: '🚪 Door', box: [3.45, 1.2, 1.3, 0.15, 2.3, 1.0], stand: [2.75, 1.3], actions: () => [
      { label: '🏠 Go home', run: goHome }] },
  ],
};

// ---------- bigger actions ----------
async function sleepNight() {
  M.sit = null;
  await fade('', async () => { miaSleep.visible = true; mia.visible = false; S.lamp = false; P().bedLamp = false; });
  await say('Goodnight, tiny home...', { face: 'happy' });
  await fade(`Day ${S.day + 1}`, async () => {
    S.day++; S.rent = Math.max(0, S.rent - 1); S.mood = 'day'; S.droop = Math.min(1, S.droop + 0.2);
    P().deadPlantDroop = S.droop; P().rentNotice = S.rent > 0 ? `${S.rent} DAY${S.rent > 1 ? 'S' : ''}` : 'LAST WARNING';
    miaSleep.visible = false; mia.visible = true; M.x = -0.8; M.z = -0.6; S.lamp = true; P().bedLamp = undefined; hud();
  });
  await say(S.rent > 0 ? `Morning! Rent is due in ${S.rent} day${S.rent > 1 ? 's' : ''}. Coffee shift time.` : 'Rent is due TODAY.', { face: S.rent > 1 ? 'happy' : 'shock', pose: 'wave' });
}
async function goToWork() {
  if (S.mood === 'night') { await say('The café is closed. I should sleep first.', { face: 'neutral', pose: 'shrug' }); return; }
  await say('Apron on. Smile on. Let\'s go!', { face: 'happy', pose: 'wave' });
  await fade('Bloom Café', async () => {
    await loadSet('cafe'); S.apron = true; showSet('cafe');
    M.x = 2.7; M.z = 1.3; M.hold = null; M.sit = null;
    if (!S.choice) { S.adrian = 'here'; Object.assign(S.props.cafe, { adrianCup: false, napkinNote: false, cashStack: 0, napkinOpen: 0, blackCar: undefined }); }
  });
  if (!S.choice) await say('Nine o\'clock. And there he is. Corner table.', { face: 'neutral', pose: 'think' });
}
async function goHome() {
  await fade('Home', async () => { S.apron = false; showSet('studio'); M.x = 1.42; M.z = 1.0; M.hold = null; S.mood = 'night'; hud(); });
  await say(S.choice === 'A' ? 'A thousand dollars in my apron. Who ARE you, "A"?' : 'Home. My feet hurt. My heart is... confused.', { face: 'neutral' });
}
async function serveAdrian() {
  M.hold = null; S.adrian = 'served'; Object.assign(P(), { adrianCup: 0, napkinNote: false, cashStack: 0 });
  await say('Your black coffee.', { pose: 'talk', face: 'happy' });
  await say('...', { who: 'Adrian' });
  await say('He nodded! That\'s basically a conversation.', { face: 'happy' });
  // a little later he leaves: the bell rings, a black car drives away
  setTimeout(async () => {
    while (S.busy) await sleep(300);
    S.busy = true;
    const t0 = performance.now();
    await tween(900, k => { adrian.mat.opacity = 1 - k; adrian.mat.transparent = true; });
    S.adrian = 'gone'; adrian.visible = false;
    P().doorBell = 0; const tb = performance.now();
    const ring = setInterval(() => { P().doorBell = (performance.now() - tb) / 1000; if (P().doorBell > 3) clearInterval(ring); }, 50);
    tween(5200, k => { P().blackCar = k; }).then(() => { P().blackCar = undefined; });
    await say('Wait. He left? Before I brought the bill?', { face: 'shock' });
    S.busy = false;
  }, 4500);
}
async function clearTable() {
  await say('He left before paying. Typical.', { face: 'angry' });
  await tween(900, k => { P().adrianCup = k; });
  P().napkinNote = undefined;
  await say('Under his cup...', { face: 'shock' });
  for (let i = 1; i <= 10; i++) { P().cashStack = i; await sleep(110); }
  await say('A THOUSAND DOLLARS?!', { face: 'shock', hold: null });
  // napkin note
  const c = document.createElement('canvas'); c.width = 400; c.height = 300; const g = c.getContext('2d');
  g.fillStyle = '#fffdf6'; g.fillRect(0, 0, 400, 300); g.fillStyle = '#2f2f3f'; g.font = 'italic 44px "Snell Roundhand", "Segoe Script", cursive'; g.textAlign = 'center'; g.fillText('Same time', 200, 112); g.fillText('tomorrow.', 200, 170); g.fillText('— A', 270, 240);
  P().napkinNote = c; await tween(800, k => { P().napkinOpen = k; });
  await say('And a note. "Same time tomorrow. — A"', { face: 'shock' });
  await say('And my boss is walking over...', { face: 'teary' });
  const k = await choose('What should Mia do?', ['💵 KEEP IT', 'rent paid... but who is he?'], ['🏃‍♀️ GIVE IT BACK', 'honest, but still broke']);
  S.choice = k;
  if (k === 'A') {
    M.hold = 'cash'; P().cashStack = 0; S.money += 1000; hud();
    await say('Into the apron. Nobody saw. Right? RIGHT?', { face: 'shock', hold: 'cash' });
    M.hold = null; await say('Rent: covered. Questions: so many.', { face: 'happy' });
  } else {
    M.hold = 'cash'; P().cashStack = 0;
    await walkTo(2.75, 1.3);
    await say('Sir! Wait! Your money!', { face: 'shock', pose: 'wave', hold: 'cash' });
    await say('...The black car is gone. I\'ll give it back tomorrow. Same time.', { face: 'sad' });
  }
  await say('What happens next? The Reels decide! 💗 Follow "Her Story, Your Choice".', { face: 'happy', pose: 'wave' });
}

// ======================================================================= input
const ray = new THREE.Raycaster(), ndc = new THREE.Vector2();
let drag = null, yawUser = 0, pitchUser = 0, hover = null;
function pick(cx, cy) {
  ndc.set(cx / innerWidth * 2 - 1, -(cy / innerHeight) * 2 + 1); ray.setFromCamera(ndc, set.camera);
  const hs = sets[S.place].hot.filter(h => !h.when || h.when());
  const hits = ray.intersectObjects(hs.map(h => h.mesh));
  if (hits.length) return { hot: hits[0].object.userData.h };
  const p = new THREE.Vector3(); if (ray.ray.intersectPlane(new THREE.Plane(new THREE.Vector3(0, 1, 0), 0), p)) return { floor: p };
  return null;
}
async function onTap(cx, cy) {
  if (skip) { skip(); return; }
  if (S.busy) return;
  hideMenu();
  const r = pick(cx, cy); if (!r) return;
  if (r.floor) { if (M.sit) M.sit = null; walkTo(r.floor.x, r.floor.z); showRipple(cx, cy); return; }
  const h = r.hot;
  useHot(h);
}
function useHot(h) {
  return act(async () => {
    await walkTo(...h.stand);
    const items = h.actions();
    const it = items.length === 1 ? await showMenu(h.label, items, h) : await showMenu(h.label, items, h);
    if (it) await it.run();
  });
}
function showRipple(x, y) {
  const d = document.createElement('div'); d.style.cssText = `position:fixed;left:${x - 14}px;top:${y - 14}px;width:28px;height:28px;border:3px solid #fff;border-radius:50%;z-index:4;pointer-events:none;transition:all .5s;box-shadow:0 0 0 2px #6b4046`;
  document.body.appendChild(d); requestAnimationFrame(() => { d.style.transform = 'scale(2)'; d.style.opacity = 0; }); setTimeout(() => d.remove(), 600);
}
addEventListener('pointerdown', e => { if (e.target.closest('.ui, #menu, #bubble')) return; drag = { x: e.clientX, y: e.clientY, yaw: yawUser, pitch: pitchUser, moved: false }; });
addEventListener('pointermove', e => {
  if (drag) { const dx = e.clientX - drag.x, dy = e.clientY - drag.y; if (Math.hypot(dx, dy) > 8) drag.moved = true; if (drag.moved) { yawUser = clamp(drag.yaw - dx * 0.005, -0.75, 0.75); pitchUser = clamp(drag.pitch + dy * 0.003, -0.25, 0.35); } return; }
  if (!set || e.pointerType !== 'mouse') return;
  const r = pick(e.clientX, e.clientY), tip = $('tip');
  hover = r && r.hot ? r.hot : null;
  document.body.style.cursor = hover ? 'pointer' : 'default';
  if (hover && !S.busy) { tip.style.display = 'block'; tip.style.left = e.clientX + 'px'; tip.style.top = e.clientY + 'px'; tip.textContent = hover.label; } else tip.style.display = 'none';
});
addEventListener('pointerup', e => { if (!drag) return; const d = drag; drag = null; if (!d.moved && !e.target.closest('.ui, #menu, #bubble')) onTap(e.clientX, e.clientY); });
$('bMood').onclick = async e => {
  e.stopPropagation(); if (S.busy) return;
  if (S.place === 'studio' && S.mood === 'night') { await act(async () => { await walkTo(-0.82, -1.0); await sleepNight(); }); return; }
  S.mood = S.mood === 'night' ? 'day' : 'night'; hud();
};
$('bHelp').onclick = e => { e.stopPropagation(); const h = $('hint'); h.style.opacity = 1; h.innerHTML = 'Tap the floor to walk · tap things to use them · drag to look around<br>Try: the phone on the bed, the fridge, the door (go to work!)'; setTimeout(() => h.style.opacity = 0, 6000); };

// ======================================================================= camera + loop
const cam = { p: new THREE.Vector3(), at: new THREE.Vector3(), init: false };
function updateCamera(dt) {
  const wd = WORLD[S.place].cam, portrait = innerHeight > innerWidth;
  const dist = wd.dist * (portrait ? 1.25 : 1), yaw = wd.yaw + yawUser, h = wd.h + pitchUser * 3;
  const target = new THREE.Vector3(M.x * 0.75, 0.72, M.z * 0.55 + (S.place === 'cafe' ? -0.4 : -0.3));
  const want = new THREE.Vector3(target.x + Math.sin(yaw) * dist, target.y + h, target.z + Math.cos(yaw) * dist);
  want.x = clamp(want.x, ...wd.clampX); want.z = clamp(want.z, ...wd.clampZ);
  const k = cam.init ? 1 - Math.exp(-dt * 3) : 1; cam.init = true;
  cam.p.lerp(want, k); cam.at.lerp(target, k);
  return { p: cam.p.toArray(), at: cam.at.toArray(), fov: portrait ? 62 : 46 };
}
function resize() {
  PR = Math.min(devicePixelRatio || 1, innerWidth > 900 ? 1.25 : 1.5);
  W = Math.round(innerWidth * PR); H = Math.round(innerHeight * PR);
  Object.values(sets).forEach(v => v.s.setSize(W, H));
}
addEventListener('resize', resize);

let last = performance.now();
function frame() {
  const nowMs = performance.now(), dt = Math.min(0.05, (nowMs - last) / 1000); last = nowMs; const now = nowMs / 1000;
  if (set) {
    stepMia(dt, now);
    const view = updateCamera(dt);
    const v = sets[S.place];
    const props = Object.assign({}, P(), S.place === 'studio' ? { coinJar: S.coins, deadPlantDroop: S.droop } : {});
    const night = S.mood === 'night';
    set.renderView(view, {
      t: now, mood: S.mood, props, blur: 0.18,
      focusDist: Math.max(1, Math.hypot(view.p[0] - M.x, view.p[2] - M.z)),
      beforeRender: camera => {
        const st = miaPose(now); const key = JSON.stringify(st);
        mia.setState(st, key);
        const sx = M.sit ? M.sit.x : M.x, sz = M.sit ? M.sit.z : M.z;
        mia.place(sx, M.sit ? M.sit.y : 0, sz, camera); mia.shadow.visible = !M.sit;
        mia.tint(night ? '#d9d3f2' : '#ffffff');
        if (v.actors.sleeper) { v.actors.sleeper.setState({}, 's'); v.actors.sleeper.place(-1.5, 0.5, -1.75, camera); v.actors.sleeper.tint(night ? '#cfc8ee' : '#ffffff'); }
        if (v.actors.adrian) {
          const a = v.actors.adrian; a.visible = S.adrian === 'here' || S.adrian === 'served' || (a.mat.opacity < 1 && a.mat.opacity > 0 && S.adrian !== 'away');
          if (S.adrian === 'here') { a.mat.opacity = 1; a.mat.transparent = false; }
          a.setState({ arm: true }, 'a'); a.place(2.62, 0.48, -1.85, camera); a.tint(night ? '#d9d3f2' : '#ffffff');
        }
      },
    });
    // bubble + menu follow their anchors
    if (bubble.style.display === 'block') {
      const p = bubbleAnchor === 'adrian' ? project(new THREE.Vector3(2.62, 1.5, -1.85)) : project(new THREE.Vector3(M.sit ? M.sit.x : M.x, (M.sit ? M.sit.y : 0) + 1.38, M.sit ? M.sit.z : M.z));
      bubble.style.left = clamp(p.x, 120, innerWidth - 120) + 'px'; bubble.style.top = clamp(p.y, 120, innerHeight - 20) + 'px';
    }
    if (menuAnchor) { const p = project(menuAnchor.top); menu.style.left = clamp(p.x, 110, innerWidth - 110) + 'px'; menu.style.top = clamp(p.y, 200, innerHeight - 20) + 'px'; }
  }
  requestAnimationFrame(frame);
}

// ======================================================================= start
(async () => {
  // a little Mia on the loading screen
  const lg = $('lmia').getContext('2d'); const drawL = (ph) => { lg.clearRect(0, 0, 320, 600); drawMiaFull(lg, 160, 150, 0.42, { pose: 'wave', phase: ph, face: 'happy' }); };
  let lph = 0; const lt = setInterval(() => drawL(lph += 0.04), 50);
  resize();
  await loadSet('studio'); showSet('studio');
  M.x = WORLD.studio.start[0]; M.z = WORLD.studio.start[1];
  S.props.studio.rentNotice = '3 DAYS';
  hud(); requestAnimationFrame(frame);
  $('lmsg').textContent = ''; $('start').style.display = 'block';
  window.GAME_READY = true; window.GAME = { S, M, walkTo, act, sets, onTap, HOT, use: id => useHot(sets[S.place].hot.find(h => h.id === id)) };
  const go = async () => {
    clearInterval(lt); $('loading').style.opacity = 0; setTimeout(() => $('loading').remove(), 600);
    setTimeout(() => $('hint').style.opacity = 0, 7000);
    await act(async () => { await say('Hi! I\'m Mia. Twenty-six. Waitress. Twelve dollars in the bank.', { face: 'happy', pose: 'wave' }); await say('Tap around my tiny home. Try the phone on my bed. 💗', { face: 'happy' }); });
  };
  $('start').onclick = go;
  if (new URLSearchParams(location.search).has('autostart')) go();
})();
