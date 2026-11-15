// studio.js: Mia's tiny studio apartment. Small, cosy, a little messy, clearly broke, but cute.
// Room: x -2.0..2.0, z -2.4 (back wall, window) .. 2.2, height 2.7. The front door is on the right wall.
import { THREE, toon, basic, rbox, lathe, sphere, capsule, puff, roundRectShape, heartShape, M, G, glow, blob, blobAt, paint, rr2, heart2, star2, R, OUTLINE, addOutline, clamp, lerp, smooth, easeIO } from './kit.js';
import { wall, floor, ceiling, trim } from './room.js';
import { floorTex, windowView, duvetTex, woodTex, tileTex, artTex, mirrorTex, rugRoundTex, cushionTex, phoneDefaultTex } from './textures.js';
import { fairyLights, pottedPlant, mug, chair, phone as makePhone, texFromCanvas, leafGeo } from './props-common.js';

const OL = OUTLINE;
const X0 = -2.0, X1 = 2.0, Z0 = -2.4, Z1 = 2.2, HT = 2.7;

// ---------- painted studio textures ----------
const TX = {};
const rentCache = new Map();
function rentTex(text) {
  if (rentCache.has(text)) return rentCache.get(text);
  const t = paint(320, 420, (g, w, h) => {
    g.fillStyle = '#fffdf4'; g.fillRect(0, 0, w, h);
    g.strokeStyle = 'rgba(120,90,70,0.25)'; g.lineWidth = 2; for (let y = 120; y < h - 20; y += 30) { g.beginPath(); g.moveTo(24, y); g.lineTo(w - 24, y); g.stroke(); }
    g.textAlign = 'center'; g.fillStyle = '#5a3a3a'; g.font = 'bold 44px "Arial Rounded MT Bold", Arial, sans-serif'; g.fillText('RENT DUE', w / 2, 70);
    g.fillStyle = '#e0475f'; g.font = 'bold 96px "Arial Rounded MT Bold", Arial, sans-serif'; g.fillText('$900', w / 2, 175);
    const big = String(text || '3 DAYS').toUpperCase();
    g.font = `bold ${big.length > 8 ? 46 : 64}px "Arial Rounded MT Bold", Arial, sans-serif`;
    rr2(g, 26, 210, w - 52, 92, 18); g.fillStyle = '#ffe1e6'; g.fill(); g.lineWidth = 5; g.strokeStyle = '#e0475f'; g.stroke();
    g.fillStyle = '#e0475f'; g.fillText(big, w / 2, big.length > 8 ? 272 : 280);
    g.fillStyle = '#6b4046'; g.font = 'italic 28px Georgia, serif'; g.fillText('— Mr. Novak', w / 2, 360);
    g.fillStyle = 'rgba(107,64,70,0.5)'; g.font = '20px Arial'; g.fillText('Apt 4B', w / 2, 395);
  });
  rentCache.set(text, t); return t;
}
const billsTex = () => TX.bills ||= paint(400, 560, (g, w, h) => {
  g.clearRect(0, 0, w, h);
  const note = (x, y, rw, rh, rot, bg, lines, col = '#5a3a3a', size = 34, pin = '#ff6f91') => {
    g.save(); g.translate(x, y); g.rotate(rot);
    g.fillStyle = 'rgba(107,64,70,0.18)'; g.fillRect(-rw / 2 + 5, -rh / 2 + 6, rw, rh);
    g.fillStyle = bg; g.fillRect(-rw / 2, -rh / 2, rw, rh); g.lineWidth = 3; g.strokeStyle = 'rgba(107,64,70,0.55)'; g.strokeRect(-rw / 2, -rh / 2, rw, rh);
    g.textAlign = 'center'; g.fillStyle = col;
    lines.forEach(([s, sz, c], i) => { g.font = `bold ${sz || size}px "Arial Rounded MT Bold", Arial, sans-serif`; g.fillStyle = c || col; g.fillText(s, 0, -rh / 2 + 44 + i * ((sz || size) + 10)); });
    g.restore();
    g.beginPath(); g.arc(x, y - rh / 2 + 4, 11, 0, 7); g.fillStyle = pin; g.fill(); g.lineWidth = 3; g.strokeStyle = OL; g.stroke();
  };
  note(110, 110, 170, 190, -0.08, '#fff27a', [['PAY', 46, '#e0475f'], ['RENT!!', 46, '#e0475f']]);
  note(290, 120, 170, 200, 0.07, '#ffffff', [['ELECTRIC', 26], ['$84', 52, '#e0475f'], ['DUE', 22]], '#5a3a3a', 30, '#7ec8ff');
  note(110, 330, 180, 170, 0.05, '#ffd6e0', [['water', 28], ['$41', 50, '#e0475f']], '#5a3a3a', 30, '#ffc94d');
  note(300, 340, 160, 150, -0.1, '#c9f2dc', [['no more', 26], ['noodles', 26], ['pls :(', 30]], '#3f6f5a', 26, '#ff6f91');
  note(200, 480, 220, 110, 0.03, '#ffffff', [['OVERDUE', 40, '#e0475f']], '#e0475f', 40, '#b38cff');
});
const noodleTex = () => TX.noodle ||= paint(256, 128, (g, w, h) => {
  g.fillStyle = '#fff6ea'; g.fillRect(0, 0, w, h);
  g.fillStyle = '#ff7a6b'; g.fillRect(0, 18, w, 36); g.fillStyle = '#ffd25e'; g.fillRect(0, 54, w, 6);
  g.fillStyle = '#fff'; g.font = 'bold 26px "Arial Rounded MT Bold", Arial'; g.textAlign = 'center'; g.fillText('NOODLE', 64, 46); g.fillText('NOODLE', 192, 46);
  [64, 192].forEach(x => { g.beginPath(); g.arc(x, 92, 18, 0, 7); g.fillStyle = '#ffe3c2'; g.fill(); g.lineWidth = 3; g.strokeStyle = OL; g.stroke(); g.fillStyle = OL; g.beginPath(); g.arc(x - 7, 89, 2.5, 0, 7); g.arc(x + 7, 89, 2.5, 0, 7); g.fill(); g.beginPath(); g.arc(x, 96, 5, 0.1, Math.PI - 0.1); g.stroke(); });
});
const noodleLid = () => TX.lid ||= paint(128, 128, (g) => { g.fillStyle = '#ffffff'; g.beginPath(); g.arc(64, 64, 63, 0, 7); g.fill(); g.fillStyle = '#ff7a6b'; g.beginPath(); g.arc(64, 64, 44, 0, 7); g.fill(); g.fillStyle = '#fff'; g.font = 'bold 22px Arial'; g.textAlign = 'center'; g.fillText('3 MIN', 64, 72); });
const coinTex = () => TX.coin ||= paint(128, 128, (g, w, h) => { g.fillStyle = '#f2c14e'; g.fillRect(0, 0, w, h); for (let i = 0; i < 26; i++) { g.beginPath(); g.ellipse(R(i) * w, R(i + 40) * h, 12, 5, 0, 0, 7); g.fillStyle = i % 3 ? '#ffd970' : '#d9a33a'; g.fill(); g.lineWidth = 1.5; g.strokeStyle = '#b07a2a'; g.stroke(); } }, { repeat: [2, 1] });
const laptopScreen = () => TX.lap ||= paint(256, 170, (g, w, h) => {
  const gr = g.createLinearGradient(0, 0, 0, h); gr.addColorStop(0, '#ffd6e3'); gr.addColorStop(1, '#cfe6ff'); g.fillStyle = gr; g.fillRect(0, 0, w, h);
  rr2(g, 20, 20, 216, 30, 8); g.fillStyle = '#fff'; g.fill(); g.fillStyle = '#9a8090'; g.font = '16px Arial'; g.fillText('jobs near me part time', 30, 41);
  for (let i = 0; i < 3; i++) { rr2(g, 20, 62 + i * 34, 216, 26, 6); g.fillStyle = 'rgba(255,255,255,0.8)'; g.fill(); }
});
const apronTex = () => TX.apron ||= paint(256, 320, (g, w, h) => {
  g.fillStyle = '#ffc2d1'; g.fillRect(0, 0, w, h);
  g.strokeStyle = 'rgba(255,255,255,0.8)'; g.setLineDash([10, 8]); g.lineWidth = 5; rr2(g, 14, 14, w - 28, h - 28, 24); g.stroke(); g.setLineDash([]);
  rr2(g, 60, 170, 136, 90, 16); g.fillStyle = '#ffe1e8'; g.fill(); g.lineWidth = 4; g.strokeStyle = 'rgba(107,64,70,0.6)'; g.stroke();
  heart2(g, 128, 120, 26); g.fillStyle = '#ff6f91'; g.fill();
  g.fillStyle = '#6b4046'; g.font = 'bold 30px "Arial Rounded MT Bold", Arial'; g.textAlign = 'center'; g.fillText('Bloom', 128, 222);
});
const potFaceTex = () => TX.potFace ||= paint(256, 128, (g, w, h) => {
  g.fillStyle = '#f3a48a'; g.fillRect(0, 0, w, h); g.fillStyle = '#e48d74'; g.fillRect(0, 0, w, 22);
  const x = 64; g.strokeStyle = OL; g.lineWidth = 4; g.lineCap = 'round';
  g.beginPath(); g.moveTo(x - 20, 62); g.lineTo(x - 8, 66); g.moveTo(x + 20, 62); g.lineTo(x + 8, 66); g.stroke(); // sad eyes
  g.beginPath(); g.arc(x, 92, 9, Math.PI * 1.15, Math.PI * 1.85); g.stroke();
  g.fillStyle = '#8fd0ff'; g.beginPath(); g.moveTo(x - 16, 70); g.quadraticCurveTo(x - 22, 84, x - 16, 86); g.quadraticCurveTo(x - 10, 84, x - 16, 70); g.fill();
});
const hoodieTex = () => TX.hood ||= paint(128, 128, (g, w, h) => { g.fillStyle = '#c9b6ec'; g.fillRect(0, 0, w, h); g.strokeStyle = 'rgba(255,255,255,0.4)'; g.lineWidth = 4; for (let i = 0; i < 6; i++) { g.beginPath(); g.moveTo(0, i * 24 + 6); g.lineTo(w, i * 24 + 10); g.stroke(); } });
const basketTex = () => TX.basket ||= paint(256, 64, (g, w, h) => { g.fillStyle = '#e8c08f'; g.fillRect(0, 0, w, h); g.strokeStyle = '#c4925e'; g.lineWidth = 4; for (let x = 0; x < w; x += 16) { g.beginPath(); g.moveTo(x, 0); g.lineTo(x + 8, h); g.stroke(); } for (let y = 8; y < h; y += 14) { g.beginPath(); g.moveTo(0, y); g.lineTo(w, y); g.stroke(); } }, { repeat: [3, 1] });

export function buildStudio({ scene, statics: st }) {
  const objects = {};
  scene.background = new THREE.Color('#2a2d5a');
  const wstyle = { paper: '#ffe6e3', dot: '#ffc4cf', wains: '#d5efe3', wainsH: 0.85, pattern: 'dots', edge: '#f6dcd4' };
  // ---------- shell ----------
  const WIN = { u0: 1.55, u1: 2.55, y0: 1.0, y1: 2.05 }; // back wall: u from x=-2 → window x -0.45..0.55
  const winX0 = X0 + WIN.u0, winX1 = X0 + WIN.u1, winCX = (winX0 + winX1) / 2;
  scene.add(wall(st, { o: [X0, Z0], u: [1, 0], n: [0, 1], len: X1 - X0, h: HT, holes: [WIN], style: wstyle }));
  scene.add(wall(st, { o: [X0, Z1], u: [0, -1], n: [1, 0], len: Z1 - Z0, h: HT, style: wstyle }));        // left wall (bed)
  const DOOR = { u0: 0.75, u1: 1.65, y0: 0, y1: 2.08 };                                                       // right wall: u from z=-2.4 → door z 0.75-2.4.. see below
  // right wall runs from z=Z0 to Z1 along +z; u = z - Z0. Door z = -1.65..-0.75? we want door near the front: z 0.55..1.45
  DOOR.u0 = 0.55 - Z0; DOOR.u1 = 1.45 - Z0;
  scene.add(wall(st, { o: [X1, Z0], u: [0, 1], n: [-1, 0], len: Z1 - Z0, h: HT, holes: [DOOR], style: wstyle }));
  // no front wall: every camera looks into the room from the open front (like a stage set)
  scene.add(floor(X0, X1, Z0, Z1, floorTex()));
  scene.add(ceiling(X0, X1, Z0, Z1, HT));
  // skirting + rail trims (they give the nice brown ink lines at the wall bottoms)
  const trims = [[[X0, Z0 + 0.01], [X1, Z0 + 0.01], [0, 1]], [[X0 + 0.01, Z0], [X0 + 0.01, Z1], [1, 0]], [[X1 - 0.01, Z0], [X1 - 0.01, 0.55], [-1, 0]], [[X1 - 0.01, 1.45], [X1 - 0.01, Z1], [-1, 0]]];
  trims.forEach(([a, b]) => { trim(st, a, b, 0.05, 0.1, 0.02); });
  [[[X0, Z0 + 0.01], [winX0, Z0 + 0.01]], [[winX1, Z0 + 0.01], [X1, Z0 + 0.01]], [[X0 + 0.01, Z0], [X0 + 0.01, Z1]], [[X1 - 0.01, Z0], [X1 - 0.01, 0.55]], [[X1 - 0.01, 1.45], [X1 - 0.01, Z1]]].forEach(([a, b]) => trim(st, a, b, 0.86, 0.04, 0.018));

  // ---------- window (back wall) ----------
  const wf = toon('#ffffff');
  const wy0 = WIN.y0, wy1 = WIN.y1, wcy = (wy0 + wy1) / 2, ww = winX1 - winX0, wh = wy1 - wy0;
  st.add(M(rbox(ww + 0.14, 0.07, 0.08, 0.025), wf, winCX, wy1 + 0.02, Z0 + 0.02));
  st.add(M(rbox(0.07, wh + 0.1, 0.08, 0.025), wf, winX0 - 0.02, wcy, Z0 + 0.02));
  st.add(M(rbox(0.07, wh + 0.1, 0.08, 0.025), wf, winX1 + 0.02, wcy, Z0 + 0.02));
  st.add(M(rbox(0.035, wh, 0.05, 0.012), wf, winCX, wcy, Z0 - 0.04));
  st.add(M(rbox(ww, 0.035, 0.05, 0.012), wf, winCX, wcy + 0.08, Z0 - 0.04));
  st.add(M(rbox(ww + 0.24, 0.05, 0.22, 0.02), wf, winCX, wy0 - 0.01, Z0 + 0.06)); // sill
  const view = new THREE.Mesh(new THREE.PlaneGeometry(3.2, 2.6), basic({ map: windowView('night') }));
  view.position.set(winCX, wcy + 0.1, Z0 - 1.6); view.name = 'view'; scene.add(view);
  const glass = new THREE.Mesh(new THREE.PlaneGeometry(ww, wh), new THREE.MeshBasicMaterial({ color: '#dff2ff', transparent: true, opacity: 0.12, depthWrite: false }));
  glass.position.set(winCX, wcy, Z0 - 0.05); scene.add(glass);
  // curtains: two puffy wavy curtains tied to the sides + rod
  st.add(M(capsule(0.014, ww + 0.5, 4, 8), toon('#e7b98c'), winCX, wy1 + 0.14, Z0 + 0.1, 0, 0, Math.PI / 2));
  [-1, 1].forEach(s => {
    // a soft curtain: wide at the top, tied in at 60%, flaring at the bottom (drawn mirrored for each side)
    const cw = 0.3, ch = 1.3, f = (x, y) => [s * x, y], sh = new THREE.Shape();
    sh.moveTo(...f(-cw / 2, 0)); sh.lineTo(...f(cw / 2, 0));
    sh.quadraticCurveTo(...f(cw * 0.55, -ch * 0.3), ...f(cw * 0.12, -ch * 0.6));
    sh.quadraticCurveTo(...f(cw * 0.3, -ch * 0.8), ...f(cw * 0.42, -ch));
    sh.lineTo(...f(-cw * 0.5, -ch)); sh.quadraticCurveTo(...f(-cw * 0.42, -ch * 0.8), ...f(-cw * 0.2, -ch * 0.6));
    sh.quadraticCurveTo(...f(-cw * 0.5, -ch * 0.3), ...f(-cw / 2, 0));
    st.add(M(puff(sh, 0.03, 0.035, 3, 14), toon('#fff0c9'), winCX + s * (ww / 2 + 0.1), wy1 + 0.14, Z0 + 0.12));
    st.add(M(new THREE.TorusGeometry(0.05, 0.016, 8, 16), toon('#ff9fb8'), winCX + s * (ww / 2 + 0.1) + s * 0.01, wy1 + 0.14 - ch * 0.6, Z0 + 0.15));
  });
  // dead plant on the sill (prop): sad pot + drooping brown stems
  const plant = G(winX1 - 0.2, wy0 + 0.015, Z0 + 0.1); plant.name = 'deadPlant';
  const pot = M(lathe([[0.001, 0], [0.05, 0], [0.058, 0.01], [0.068, 0.1], [0.075, 0.105], [0.075, 0.12], [0.001, 0.115]], 24), toon('#ffffff', { map: potFaceTex() })); pot.rotation.y = -Math.PI / 2; plant.add(pot); addOutline(pot);
  plant.add(M(new THREE.CylinderGeometry(0.066, 0.066, 0.01, 16), toon('#7a5240'), 0, 0.115, 0));
  const stems = [];
  for (let i = 0; i < 3; i++) {
    const root = new THREE.Group(); root.position.set((i - 1) * 0.022, 0.12, (i % 2) * 0.012); root.rotation.z = (i - 1) * 0.25; plant.add(root);
    let parent = root; const segs = [];
    for (let k = 0; k < 4; k++) {
      const seg = new THREE.Group(); seg.position.y = k ? 0.05 : 0; parent.add(seg);
      const m = M(capsule(0.0045, 0.045, 3, 6), toon('#a07a52'), 0, 0.025, 0); seg.add(m); segs.push(seg); parent = seg;
    }
    const lf = new THREE.Mesh(leafGeo(0.05), toon('#c8a46a')); lf.position.y = 0.05; lf.rotation.set(0.3, 0, 0.6); parent.add(lf); addOutline(lf);
    const lf2 = new THREE.Mesh(leafGeo(0.035), toon('#b8935a')); lf2.position.y = 0.02; lf2.rotation.set(-0.3, 1.2, -0.8); segs[1].add(lf2);
    stems.push({ root, segs, dir: i === 1 ? 1 : (i - 1) });
  }
  scene.add(plant); objects.deadPlant = plant;
  // fallen dry leaves on the sill
  st.add(M(leafGeo(0.03), toon('#c8a46a'), winX1 - 0.05, wy0 + 0.03, Z0 + 0.12, -Math.PI / 2, 0, 0.4));

  // ---------- bed (left wall) ----------
  const bx = X0 + 0.5, bz = -1.38, bl = 2.0, bw = 0.96;
  const wood = toon('#f0c7a0', { map: woodTex('#f0c7a0', 'woodLight') });
  st.add(M(rbox(bw + 0.06, 0.24, bl, 0.05), wood, bx, 0.16, bz));
  [[-1, -1], [1, -1], [-1, 1], [1, 1]].forEach(([sx, sz]) => st.add(M(capsule(0.03, 0.06, 4, 8), wood, bx + sx * (bw / 2 - 0.04), 0.05, bz + sz * (bl / 2 - 0.05))));
  st.add(M(rbox(bw - 0.02, 0.2, bl - 0.04, 0.07), toon('#fffaf4'), bx, 0.36, bz));
  // headboard: pink puffy arch
  const hb = new THREE.Shape(); hb.moveTo(-bw / 2, 0); hb.lineTo(-bw / 2, 0.45); hb.quadraticCurveTo(-bw / 2, 0.75, 0, 0.78); hb.quadraticCurveTo(bw / 2, 0.75, bw / 2, 0.45); hb.lineTo(bw / 2, 0); hb.closePath();
  st.add(M(puff(hb, 0.06, 0.04, 3, 16), toon('#ffb9c9'), bx, 0.28, Z0 + 0.08));
  // blanket (pink-cream hearts), draped
  const duvet = M(rbox(bw + 0.04, 0.09, bl * 0.62, 0.04, 4), toon('#ffffff', { map: duvetTex() }), bx, 0.5, bz + bl * 0.17); st.add(duvet);
  st.add(M(rbox(0.04, 0.24, bl * 0.62, 0.02, 2), toon('#ffffff', { map: duvetTex() }), bx + bw / 2 + 0.02, 0.38, bz + bl * 0.17));
  // big plush pillow + small heart pillow
  const pil = M(puff(roundRectShape(0.62, 0.3, 0.13), 0.08, 0.06, 4, 16), toon('#fff6ee'), bx, 0.63, Z0 + 0.3, -1.15, 0, 0); st.add(pil);
  const hp = M(puff(heartShape(0.1), 0.05, 0.04, 3, 16), toon('#ff9fb8'), bx + 0.22, 0.66, Z0 + 0.48, -0.5, -0.3, 0.1); st.add(hp);
  // plush bunny on the bed
  const bun = G(bx - 0.28, 0.55, Z0 + 0.55, 0.4);
  bun.add(M(sphere(0.085), toon('#fff4fa'), 0, 0.07, 0)); bun.add(M(sphere(0.07), toon('#fff4fa'), 0, 0.19, 0.01));
  [-1, 1].forEach(s => bun.add(M(capsule(0.025, 0.09, 4, 8), toon('#ffd6e3'), s * 0.03, 0.3, 0, 0, 0, s * -0.2)));
  [-1, 1].forEach(s => bun.add(M(sphere(0.008, 6, 6), toon('#4a2e2e'), s * 0.025, 0.2, 0.07)));
  st.add(bun);
  // hoodie dropped on the bed foot (a little messy)
  const hood = M(puff(roundRectShape(0.4, 0.3, 0.12), 0.05, 0.04, 3, 12), toon('#ffffff', { map: hoodieTex() }), bx + 0.1, 0.58, bz + 0.72, -Math.PI / 2 + 0.1, 0, 0.5); st.add(hood);
  // the bunched duvet roll in FRONT of where Mia sits (foreground layer for shots where she sits in bed)
  const roll = new THREE.Group(); roll.name = 'duvetRoll';
  const rg = new THREE.CapsuleGeometry(0.11, bw - 0.16, 6, 14); rg.rotateZ(Math.PI / 2);
  const rollM = M(rg, toon('#ffffff', { map: duvetTex() }), 0, 0, 0); rollM.scale.set(1, 0.85, 1.25); roll.add(rollM); addOutline(rollM);
  roll.position.set(bx + 0.02, 0.6, -0.55); roll.rotation.y = 0.0; scene.add(roll);
  roll.traverse(o => o.layers.enable(1)); objects.duvetRoll = roll;
  scene.add(blobAt(1.3, 2.3, 0.6, bx + 0.05, bz));

  // ---------- crate nightstand + bed lamp ----------
  const cx = -0.76, cz = Z0 + 0.22;
  const crate = toon('#e7b98c', { map: woodTex('#e7b98c', 'woodCrate') });
  st.add(M(rbox(0.36, 0.44, 0.32, 0.02), crate, cx, 0.22, cz));
  st.add(M(rbox(0.3, 0.012, 0.28, 0.005), toon('#c99a6e'), cx, 0.16, cz + 0.02));
  st.add(M(rbox(0.08, 0.1, 0.06, 0.01), toon('#c7b3f0'), cx - 0.07, 0.22, cz + 0.02)); // book inside
  st.add(M(rbox(0.06, 0.12, 0.06, 0.01), toon('#9fd3c7'), cx + 0.02, 0.23, cz + 0.02));
  const lamp = G(cx + 0.04, 0.44, cz); lamp.name = 'bedLamp';
  lamp.add(M(lathe([[0.001, 0], [0.06, 0], [0.065, 0.015], [0.03, 0.03], [0.012, 0.05], [0.012, 0.2], [0.001, 0.2]], 20), toon('#fff3df')));
  const shadeGeo = lathe([[0.04, 0.2], [0.06, 0.205], [0.11, 0.3], [0.12, 0.32], [0.09, 0.355], [0.04, 0.37], [0.001, 0.372]], 24);
  const shadeMat = toon('#ffd6e3', { emissive: '#ffb37a', ei: 0 }); const shade = M(shadeGeo, shadeMat); lamp.add(shade); addOutline(shade);
  const lampLight = new THREE.PointLight('#ffb36b', 0, 4.5, 1.4); lampLight.position.set(0, 0.25, 0.12); lamp.add(lampLight);
  const lampGlow = glow('#ffd9b8', 0.2, 0.15); lampGlow.position.set(0, 0.27, 0.05); lamp.add(lampGlow);
  scene.add(lamp); objects.bedLamp = lamp;
  st.add(M(mug('#9fd3c7').children[0].geometry, toon('#9fd3c7'), cx - 0.1, 0.44, cz + 0.05));

  // ---------- fairy lights over the bed (left wall) + over the window ----------
  const fl = fairyLights([[X0 + 0.04, 1.95, Z0 + 0.1], [X0 + 0.04, 1.85, -1.4], [X0 + 0.04, 1.95, -0.3]], { sag: 0.16 });
  const fl2 = fairyLights([[winX0 - 0.2, wy1 + 0.25, Z0 + 0.06], [winX1 + 0.2, wy1 + 0.25, Z0 + 0.06]], { sag: 0.1 });
  scene.add(fl.group, fl2.group); objects.fairyLights = fl.group;
  // little polaroids pinned under the fairy lights
  const polTex = artTex('heart'), polTex2 = artTex('cloud'), polTex3 = artTex('sun');
  [[-2.1, 1.62, polTex, 0.08], [-1.4, 1.56, polTex2, -0.06], [-0.8, 1.6, polTex3, 0.1]].forEach(([z, y, t, r]) => {
    const p = G(X0 + 0.02, y, z, Math.PI / 2);
    p.add(M(rbox(0.16, 0.2, 0.012, 0.004), toon('#ffffff'), 0, 0, 0));
    const img = new THREE.Mesh(new THREE.PlaneGeometry(0.13, 0.14), toon('#ffffff', { map: t })); img.position.set(0, 0.015, 0.007); p.add(img);
    p.rotation.z = r; st.add(p);
  });

  // ---------- mini kitchen (back wall, right of the window) ----------
  const kx0 = 0.72, kx1 = 1.44, kz = Z0 + 0.3, kw = kx1 - kx0, kcx = (kx0 + kx1) / 2;
  const back = M(new THREE.PlaneGeometry(kw + 0.02, 0.62), toon('#ffffff', { map: tileTex() }), kcx, 1.2, Z0 + 0.005); back.userData.outline = false; st.add(back, { outline: false });
  st.add(M(rbox(kw, 0.84, 0.56, 0.03), toon('#bfe6d6'), kcx, 0.42, kz));
  st.add(M(rbox(kw - 0.08, 0.66, 0.02, 0.02), toon('#d2f0e3'), kcx, 0.44, kz + 0.28));
  st.add(M(sphere(0.02), toon('#ffd27a'), kcx + 0.2, 0.6, kz + 0.3));
  st.add(M(rbox(kw + 0.04, 0.05, 0.6, 0.02), toon('#fff3e6'), kcx, 0.865, kz));
  // two-ring stove
  st.add(M(rbox(0.4, 0.04, 0.32, 0.02), toon('#fffaf4'), kcx - 0.1, 0.91, kz - 0.06));
  [[-0.2, -0.06], [0.0, -0.06]].forEach(([dx, dz]) => { const r = M(new THREE.TorusGeometry(0.06, 0.012, 6, 20), toon('#5a4a5a'), kcx + dx, 0.935, kz + dz, Math.PI / 2, 0, 0); st.add(r); });
  // pot on one ring
  st.add(M(lathe([[0.001, 0], [0.08, 0], [0.085, 0.01], [0.085, 0.1], [0.09, 0.105], [0.001, 0.105]], 20), toon('#9fc9ff'), kcx - 0.2, 0.94, kz - 0.06));
  // kettle
  const ket = G(kcx + 0.24, 0.89, kz - 0.08);
  ket.add(M(lathe([[0.001, 0], [0.08, 0], [0.09, 0.03], [0.09, 0.1], [0.07, 0.16], [0.03, 0.18], [0.001, 0.19]], 22), toon('#ffb3c8')));
  ket.add(M(new THREE.TorusGeometry(0.06, 0.012, 6, 16, Math.PI), toon('#6b4046'), 0, 0.18, 0));
  ket.add(M(capsule(0.012, 0.07, 3, 6), toon('#ffb3c8'), 0.1, 0.1, 0, 0, 0, -0.8));
  st.add(ket);
  // noodle cups (stack on the counter)
  const noodleGeo = lathe([[0.001, 0], [0.042, 0], [0.055, 0.1], [0.058, 0.105], [0.001, 0.105]], 20);
  const noodleMat = toon('#ffffff', { map: noodleTex() });
  [[kcx + 0.07, 0.89, kz + 0.15], [kcx + 0.07, 0.995, kz + 0.15], [kcx - 0.04, 0.89, kz + 0.17]].forEach(([x, y, z], i) => st.add(M(noodleGeo, noodleMat, x, y, z, 0, i * 1.2, 0)));
  st.add(M(new THREE.CircleGeometry(0.056, 20), toon('#ffffff', { map: noodleLid() }), kcx + 0.07, 1.101, kz + 0.15, -Math.PI / 2, 0, 0));
  // open shelf above with jars, plates, plant
  st.add(M(rbox(kw + 0.06, 0.04, 0.22, 0.015), toon('#e7b98c'), kcx, 1.62, Z0 + 0.13));
  [[-0.24, '#ffd27a', 0.12], [-0.1, '#ff9fb8', 0.1], [0.04, '#c9f0ff', 0.14]].forEach(([dx, c, h]) => st.add(M(lathe([[0.001, 0], [0.045, 0], [0.05, 0.01], [0.05, h], [0.04, h + 0.01], [0.04, h + 0.03], [0.001, h + 0.03]], 18), toon(c), kcx + dx, 1.64, Z0 + 0.12)));
  const shelfPlant = pottedPlant({ potColor: '#fff3df', leaf: '#8fd3a8', h: 0.3, leaves: 6, r: 0.05, seed: 4 }); shelfPlant.position.set(kcx + 0.22, 1.64, Z0 + 0.12); st.add(shelfPlant);
  // LED strip under the shelf (a light you can see at night)
  const led = new THREE.Mesh(new THREE.PlaneGeometry(kw, 0.02), basic({ color: '#ffe6b0' })); led.position.set(kcx, 1.595, Z0 + 0.2); led.rotation.x = Math.PI / 2; scene.add(led);
  const ledL = new THREE.PointLight('#ffcf94', 0, 1.6, 1.5); ledL.position.set(kcx, 1.45, Z0 + 0.35); scene.add(ledL);
  // one mug
  const m1 = mug('#ff9fb8'); m1.position.set(kcx + 0.3, 0.89, kz + 0.14); m1.rotation.y = 2.2; st.add(m1);

  // ---------- tiny fridge (right corner) with bills ----------
  const fx = 1.72, fz = Z0 + 0.3;
  st.add(M(rbox(0.5, 0.92, 0.52, 0.07, 4), toon('#fff7ee'), fx, 0.46, fz));
  st.add(M(rbox(0.46, 0.01, 0.02, 0.004), toon('#e9d6cc'), fx, 0.74, fz + 0.26));
  st.add(M(capsule(0.012, 0.12, 4, 8), toon('#ffb3c8'), fx - 0.19, 0.6, fz + 0.28));
  // microwave on top
  st.add(M(rbox(0.44, 0.24, 0.32, 0.04), toon('#ffd6e3'), fx, 1.04, fz - 0.04));
  st.add(M(rbox(0.26, 0.16, 0.01, 0.02), toon('#5a4f6a'), fx - 0.05, 1.04, fz + 0.12));
  const bills = new THREE.Mesh(new THREE.PlaneGeometry(0.4, 0.56), toon('#ffffff', { map: billsTex(), transparent: true, opacity: 1 }));
  bills.material.alphaTest = 0.05; bills.material.transparent = false;
  bills.position.set(fx, 0.44, fz + 0.265); bills.name = 'fridgeBills'; scene.add(bills); objects.fridgeBills = bills;
  scene.add(blobAt(0.8, 0.7, 0.6, fx, fz + 0.05));
  scene.add(blobAt(1.0, 0.75, 0.5, kcx, kz + 0.05));

  // ---------- tiny table under the window: laptop, coin jar, noodle cup ----------
  const tx = 0.05, tz = -1.62;
  st.add(M(lathe([[0.001, 0.7], [0.34, 0.7], [0.36, 0.715], [0.36, 0.74], [0.34, 0.75], [0.001, 0.75]], 32), toon('#f6d6b0', { map: woodTex('#f6d6b0', 'woodTable') }), tx, 0, tz));
  st.add(M(capsule(0.03, 0.62, 4, 10), toon('#e7b98c'), tx, 0.36, tz));
  st.add(M(lathe([[0.001, 0], [0.2, 0], [0.18, 0.04], [0.04, 0.06], [0.001, 0.06]], 24), toon('#e7b98c'), tx, 0, tz));
  scene.add(blobAt(0.9, 0.9, 0.55, tx, tz));
  // laptop (screen faces the room)
  const lap = G(tx - 0.08, 0.75, tz - 0.05, 0.25);
  lap.add(M(rbox(0.32, 0.016, 0.22, 0.008), toon('#c9b6ec'), 0, 0.008, 0));
  const lid = G(0, 0.016, -0.11); lid.rotation.x = -0.32;
  lid.add(M(rbox(0.32, 0.21, 0.012, 0.008), toon('#c9b6ec'), 0, 0.105, 0));
  const ls = new THREE.Mesh(new THREE.PlaneGeometry(0.29, 0.18), basic({ map: laptopScreen() })); ls.position.set(0, 0.105, 0.0065); lid.add(ls);
  lap.add(lid); st.add(lap);
  // coin jar (fill 0..1)
  const jar = G(tx + 0.2, 0.75, tz + 0.05); jar.name = 'coinJar';
  const jarGlass = new THREE.Mesh(lathe([[0.001, 0], [0.055, 0], [0.06, 0.01], [0.06, 0.13], [0.045, 0.15], [0.045, 0.165], [0.001, 0.165]], 24), new THREE.MeshToonMaterial({ color: '#dff4ff', transparent: true, opacity: 0.38, depthWrite: false }));
  jar.add(jarGlass); addOutline(jarGlass);
  jar.add(M(new THREE.CylinderGeometry(0.05, 0.05, 0.02, 20), toon('#ffb3c8'), 0, 0.172, 0));
  const coins = M(new THREE.CylinderGeometry(0.052, 0.054, 1, 22), toon('#ffffff', { map: coinTex() }), 0, 0.005, 0); coins.name = 'coins'; jar.add(coins);
  const lbl = new THREE.Mesh(new THREE.PlaneGeometry(0.06, 0.04), basic({ map: paint(96, 64, (g) => { rr2(g, 2, 2, 92, 60, 10); g.fillStyle = '#fff6d8'; g.fill(); g.fillStyle = '#6b4046'; g.font = 'bold 22px Arial'; g.textAlign = 'center'; g.fillText('RENT', 48, 28); g.fillText('$$', 48, 52); }) }));
  lbl.position.set(0, 0.08, 0.061); jar.add(lbl);
  scene.add(jar); objects.coinJar = jar;
  // the noodle cup prop (with chopsticks)
  const nc = G(tx + 0.02, 0.75, tz + 0.2); nc.name = 'noodleCup';
  nc.add(M(noodleGeo, noodleMat)); nc.add(M(new THREE.CylinderGeometry(0.053, 0.053, 0.005, 20), toon('#f6d98a'), 0, 0.1, 0));
  [-1, 1].forEach(s => nc.add(M(capsule(0.004, 0.2, 3, 6), toon('#e7b98c'), s * 0.01, 0.15, 0, 0.5, 0, s * 0.1)));
  nc.traverse(o => { if (o.isMesh && o.geometry !== noodleGeo) return; }); addOutline(nc.children[0]);
  scene.add(nc); objects.noodleCup = nc;

  // ---------- chair with Mia's café apron ----------
  const ch = chair({ seat: '#ffd6e3' }); ch.position.set(0.15, 0, -1.05); ch.rotation.y = Math.PI + 0.25; st.add(ch);
  const ap = new THREE.Shape(); ap.moveTo(-0.15, 0); ap.lineTo(0.15, 0); ap.lineTo(0.2, -0.42); ap.quadraticCurveTo(0, -0.47, -0.2, -0.42); ap.closePath();
  const apron = M(puff(ap, 0.012, 0.01, 2, 10), toon('#ffffff', { map: apronTex() }), 0, 0, 0);
  const apG = G(0.15 - Math.sin(0.25) * 0.21, 0.96, -1.05 + Math.cos(0.25) * 0.215, 0.25); apG.add(apron);
  apron.material.map.repeat.set(2.5, 2.2); apron.material.map.offset.set(0.5, 1.05); apron.material.map.wrapS = apron.material.map.wrapT = THREE.RepeatWrapping;
  apG.add(M(capsule(0.006, 0.3, 3, 6), toon('#ffc2d1'), -0.15, -0.12, 0.02, 0, 0, 0.2)); apG.add(M(capsule(0.006, 0.3, 3, 6), toon('#ffc2d1'), 0.15, -0.12, 0.02, 0, 0, -0.2));
  st.add(apG);

  // ---------- rug + basket + mess ----------
  const rug = new THREE.Mesh(new THREE.CircleGeometry(0.75, 40), toon('#ffffff', { map: rugRoundTex() })); rug.rotation.x = -Math.PI / 2; rug.position.set(-0.35, 0.006, -0.25); rug.receiveShadow = true; scene.add(rug);
  const bk = G(-0.85, 0, 0.75);
  bk.add(M(lathe([[0.001, 0], [0.2, 0], [0.24, 0.32], [0.25, 0.34], [0.23, 0.34], [0.2, 0.04], [0.001, 0.04]], 26), toon('#ffffff', { map: basketTex() })));
  [['#ffd6e3', 0.05, 0.3, 0], ['#c9f0ff', -0.07, 0.32, 0.05], ['#fff27a', 0, 0.36, -0.06], ['#c9b6ec', 0.09, 0.33, -0.05]].forEach(([c, x, y, z]) => bk.add(M(sphere(0.1, 12, 10), toon(c), x, y, z)));
  st.add(bk); scene.add(blobAt(0.7, 0.7, 0.6, -0.85, 0.75));
  // sock on the floor, sneakers by the door, a book pile
  st.add(M(capsule(0.03, 0.1, 4, 8), toon('#ff9fb8'), -0.2, 0.03, 0.55, Math.PI / 2, 0.6, 0));
  [[1.72, 1.85, 0.2], [1.62, 1.95, -0.3]].forEach(([x, z, r]) => { const s = G(x, 0, z, r); s.add(M(capsule(0.05, 0.16, 4, 10), toon('#ffffff'), 0, 0.05, 0, Math.PI / 2, 0, 0)); s.add(M(rbox(0.11, 0.025, 0.27, 0.01), toon('#ff9fb8'), 0, 0.012, 0)); st.add(s); });
  [[0, '#ffd27a'], [1, '#9fd3c7'], [2, '#ff9fb8']].forEach(([i, c]) => st.add(M(rbox(0.22, 0.045, 0.16, 0.012), toon(c), -1.75, 0.025 + i * 0.047, 0.5, 0, i * 0.3, 0)));

  // ---------- front door (inside) on the right wall + rent notice ----------
  const dz0 = 0.55, dz1 = 1.45, dcz = (dz0 + dz1) / 2, dw = dz1 - dz0, dh = 2.08;
  const door = G(X1 - 0.03, 0, dcz, -Math.PI / 2); door.name = 'frontDoor';
  door.add(M(rbox(dw - 0.04, dh - 0.02, 0.05, 0.02), toon('#fff3e6'), 0, dh / 2, 0));
  [[0.48, 0.62], [1.3, 0.62]].forEach(([y, h]) => door.add(M(rbox(dw - 0.26, h, 0.02, 0.03), toon('#ffeadb'), 0, y + 0.08, 0.03)));
  door.add(M(sphere(0.035), toon('#ffd27a'), dw / 2 - 0.1, 1.02, 0.05));
  door.add(M(rbox(0.02, 0.07, 0.05, 0.008), toon('#ffd27a'), dw / 2 - 0.1, 1.02, 0.03));
  door.add(M(new THREE.TorusGeometry(0.012, 0.004, 6, 12), toon('#c9a24e'), 0, 1.6, 0.03));
  // chain lock
  door.add(M(rbox(0.06, 0.02, 0.02, 0.006), toon('#c9a24e'), dw / 2 - 0.06, 1.4, 0.035));
  st.add(door);
  // frame
  const fr = toon('#ffffff');
  st.add(M(rbox(0.07, dh + 0.06, 0.08, 0.02), fr, X1 - 0.02, dh / 2, dz0 - 0.02));
  st.add(M(rbox(0.07, dh + 0.06, 0.08, 0.02), fr, X1 - 0.02, dh / 2, dz1 + 0.02));
  st.add(M(rbox(0.08, 0.07, dw + 0.12, 0.02), fr, X1 - 0.02, dh + 0.02, dcz));
  // rent notice taped on the door (texture changes by props.rentNotice)
  const rn = G(X1 - 0.075, 1.42, dcz - 0.06, -Math.PI / 2); rn.name = 'rentNotice';
  const rnPaper = new THREE.Mesh(new THREE.PlaneGeometry(0.3, 0.39, 4, 4), toon('#ffffff', { map: rentTex('3 DAYS') }));
  { const p = rnPaper.geometry.getAttribute('position'); for (let i = 0; i < p.count; i++) { const x = p.getX(i), y = p.getY(i); p.setZ(i, 0.006 * (1 + Math.sin((y + 0.2) * 9)) * (x / 0.15) ** 2 + Math.max(0, -0.15 - y) * 0.15); } rnPaper.geometry.computeVertexNormals(); }
  rnPaper.rotation.z = 0.04; rn.add(rnPaper);
  [[-0.13, 0.18, 0.5], [0.13, 0.18, -0.5]].forEach(([x, y, r]) => { const tp = new THREE.Mesh(new THREE.PlaneGeometry(0.09, 0.03), new THREE.MeshToonMaterial({ color: '#fff4c4', transparent: true, opacity: 0.85 })); tp.position.set(x, y, 0.004); tp.rotation.z = r; rn.add(tp); });
  scene.add(rn); objects.rentNotice = rn;
  // wall sconce by the door (warm light at night)
  const scShade = M(lathe([[0.001, -0.06], [0.07, -0.06], [0.09, 0.02], [0.05, 0.08], [0.001, 0.08]], 18), toon('#fff3df', { emissive: '#ffcf94', ei: 0 })); addOutline(scShade);
  st.add(M(rbox(0.1, 0.14, 0.03, 0.015), toon('#ffd27a'), X1 - 0.02, 2.02, 0.32, 0, -Math.PI / 2, 0));
  scene.add(scShade); scShade.position.set(X1 - 0.11, 2.02, 0.32);
  const scL = new THREE.PointLight('#ffc98a', 0, 3.2, 1.4); scL.position.set(X1 - 0.3, 2.0, 0.4); scene.add(scL);
  const scGlow = glow('#ffd9b0', 0.22, 0.2); scGlow.position.set(X1 - 0.13, 2.02, 0.32); scene.add(scGlow);
  // doormat, hooks with tote bag + coat, small mirror
  const mat = new THREE.Mesh(new THREE.PlaneGeometry(0.75, 0.5), toon('#ffffff', { map: paint(256, 160, (g, w, h) => { rr2(g, 4, 4, w - 8, h - 8, 30); g.fillStyle = '#ffd6e3'; g.fill(); g.lineWidth = 6; g.strokeStyle = '#ff9fb8'; g.stroke(); g.fillStyle = '#e0647a'; g.font = 'bold 44px Arial'; g.textAlign = 'center'; g.fillText('hi :)', 128, 96); }) }));
  mat.rotation.set(-Math.PI / 2, 0, Math.PI / 2); mat.position.set(X1 - 0.5, 0.007, dcz); scene.add(mat);
  st.add(M(rbox(0.04, 0.06, 0.5, 0.015), toon('#e7b98c'), X1 - 0.03, 1.66, 0.12));
  [-0.12, 0.08, 0.28].forEach(z => st.add(M(sphere(0.022), toon('#ffd27a'), X1 - 0.07, 1.64, z)));
  const tote = G(X1 - 0.09, 1.62, -0.12, -Math.PI / 2);
  tote.add(M(puff(roundRectShape(0.28, 0.32, 0.05), 0.03, 0.02, 2, 8), toon('#fff3df'), 0, -0.24, 0));
  tote.add(M(new THREE.TorusGeometry(0.08, 0.008, 6, 16, Math.PI), toon('#fff3df'), 0, -0.08, 0.0));
  const th = new THREE.Mesh(new THREE.ShapeGeometry(heartShape(0.05)), toon('#ff9fb8')); th.position.set(0, -0.24, 0.03); tote.add(th);
  st.add(tote);
  const coat = G(X1 - 0.12, 1.62, 0.28, -Math.PI / 2);
  const cs = new THREE.Shape(); cs.moveTo(-0.1, 0); cs.lineTo(0.1, 0); cs.lineTo(0.2, -0.75); cs.quadraticCurveTo(0, -0.8, -0.2, -0.75); cs.closePath();
  coat.add(M(puff(cs, 0.06, 0.04, 3, 10), toon('#ffcf9e'), 0, 0, 0));
  st.add(coat);
  const mir = G(X1 - 0.03, 1.5, -0.75, -Math.PI / 2); mir.name = 'mirror';
  mir.add(M(new THREE.TorusGeometry(0.2, 0.03, 10, 36), toon('#ffd27a'), 0, 0, 0.01));
  st.add(mir);
  const mirGlass = new THREE.Mesh(new THREE.CircleGeometry(0.2, 32), basic({ map: mirrorTex('night') }));
  mirGlass.position.set(X1 - 0.042, 1.5, -0.75); mirGlass.rotation.y = -Math.PI / 2; scene.add(mirGlass);
  st.add(M(sphere(0.03), toon('#ff9fb8'), X1 - 0.05, 1.73, -0.75)); // bow on the mirror
  // wall art + clock above the table
  [[artTex('leaf'), -1.45, 1.75, 0.3, 0.38]].forEach(([t, x, y, w, h]) => {
    st.add(M(rbox(w + 0.05, h + 0.05, 0.03, 0.012), toon('#ffffff'), x, y, Z0 + 0.02));
    const a = new THREE.Mesh(new THREE.PlaneGeometry(w, h), toon('#ffffff', { map: t })); a.position.set(x, y, Z0 + 0.037); st.add(a, { outline: false });
  });
  // plant in the front-left corner (alive, she keeps one... well, almost)
  const bigPlant = pottedPlant({ potColor: '#fff3df', leaf: '#9ed9b4', h: 0.75, leaves: 11, r: 0.15, seed: 9 }); bigPlant.position.set(1.55, 0, -0.6); st.add(bigPlant);
  scene.add(blobAt(0.6, 0.6, 0.6, 1.55, -0.6));

  // ---------- phone (prop) ----------
  const ph = makePhone(); scene.add(ph.group); objects.phone = ph.group; objects.phoneScreen = ph.screen;
  const PH_BED = { p: new THREE.Vector3(-1.2, 0.57, -0.95), q: new THREE.Quaternion().setFromEuler(new THREE.Euler(-Math.PI / 2, 0, 0.5)) };
  const PH_CAM = new THREE.Vector3(-0.72, 1.16, 0.05);                     // studio-phone camera (start)
  const PH_HAND = { p: new THREE.Vector3(-1.02, 0.98, -0.52), q: new THREE.Quaternion() };
  { const o = new THREE.Object3D(); o.position.copy(PH_HAND.p); o.lookAt(PH_CAM); o.rotateZ(-0.06); PH_HAND.q.copy(o.quaternion); }

  // ---------- lights ----------
  const hemi = new THREE.HemisphereLight('#fff1e6', '#f2c6b0', 1.6); scene.add(hemi);
  const sun = new THREE.DirectionalLight('#ffe2bf', 2.6);
  sun.position.set(winCX + 1.0, 4.6, Z0 - 4.0); sun.target.position.set(winCX - 0.6, 0, -0.4); scene.add(sun, sun.target);
  sun.castShadow = true; sun.shadow.mapSize.set(2048, 2048); Object.assign(sun.shadow.camera, { left: -4, right: 4, top: 4, bottom: -4, near: 0.5, far: 14 }); sun.shadow.bias = -0.0004; sun.shadow.normalBias = 0.02; sun.shadow.radius = 4;
  const fill = new THREE.PointLight('#ffd9c2', 0, 7, 1.2); fill.position.set(0.8, 2.3, 1.2); scene.add(fill);
  const fairyL = new THREE.PointLight('#ffb7c9', 0, 3.2, 1.4); fairyL.position.set(X0 + 0.35, 1.7, -1.3); scene.add(fairyL);
  // window beam (soft light shaft) – day only
  const beamTex = paint(64, 256, (g, w, h) => { const gr = g.createLinearGradient(0, 0, 0, h); gr.addColorStop(0, 'rgba(255,240,210,0.55)'); gr.addColorStop(1, 'rgba(255,240,210,0)'); g.fillStyle = gr; g.fillRect(0, 0, w, h); });
  const beams = new THREE.Group();
  [-0.25, 0.1, 0.35].forEach((dx, i) => { const b = new THREE.Mesh(new THREE.PlaneGeometry(0.22 + i * 0.05, 2.4), new THREE.MeshBasicMaterial({ map: beamTex, transparent: true, opacity: 0.45, blending: THREE.AdditiveBlending, depthWrite: false, side: THREE.DoubleSide })); b.position.set(winCX + dx, 1.2, Z0 + 0.9); b.rotation.set(-0.75, 0.15, 0.08); beams.add(b); });
  scene.add(beams); beams.visible = false;

  // ---------- moods ----------
  let mood = 'night';
  function setMood(m) {
    mood = m; const night = m === 'night';
    view.material.map = windowView(m); view.material.needsUpdate = true;
    mirGlass.material.map = mirrorTex(m); mirGlass.material.needsUpdate = true;
    scene.background = new THREE.Color(night ? '#2a2d5a' : '#cdeeff');
    hemi.color.set(night ? '#8f95d8' : '#fff1e6'); hemi.groundColor.set(night ? '#5a4a78' : '#f2c6b0'); hemi.intensity = night ? 0.75 : 1.75;
    sun.color.set(night ? '#a9b6ff' : '#ffe2bf'); sun.intensity = night ? 0.7 : 2.6;
    fill.intensity = night ? 0 : 0.6;
    beams.visible = false;
  }
  function update(p, t, m) {
    const night = m === 'night';
    // bed lamp + fairy lights
    const lampOn = p.bedLamp ?? night, fairyOn = p.fairyLights ?? night;
    lampLight.intensity = lampOn ? (night ? 1.3 : 0.5) : 0; lampGlow.visible = lampOn; shadeMat.emissiveIntensity = lampOn ? 0.1 : 0;
    fl.update(t, fairyOn); fl2.update(t + 3.1, fairyOn); fairyL.intensity = fairyOn ? (night ? 0.7 : 0.15) : 0;
    ledL.intensity = night ? 0.5 : 0;
    const scOn = p.doorLamp ?? night; scL.intensity = scOn ? 1.1 : 0; scGlow.visible = scOn; scShade.material.emissiveIntensity = scOn ? 0.5 : 0; led.material.color.set(night ? '#ffe6b0' : '#f3eadf');
    // rent notice text
    const rtex = p.rentNotice instanceof HTMLCanvasElement ? texFromCanvas(p.rentNotice) : rentTex(p.rentNotice || '3 DAYS');
    if (rnPaper.material.map !== rtex) { rnPaper.material = rnPaper.material.clone(); rnPaper.material.map = rtex; }
    rn.visible = p.rentNotice !== false;
    // dead plant droop (0 sad .. 1 fully flopped)
    const dr = clamp(p.deadPlantDroop ?? 0.35);
    stems.forEach(({ root, segs, dir }, i) => { root.rotation.z = (i - 1) * (0.25 + dr * 0.5); segs.forEach((s, k) => { s.rotation.z = (dir || 0.6) * (0.12 + dr * 0.42) * (k + 1) * 0.45; s.rotation.x = dr * 0.15 * k; }); });
    // coin jar fill
    const fillK = clamp(p.coinJar ?? 0.12); coins.scale.y = Math.max(0.001, fillK * 0.12); coins.position.y = 0.006 + fillK * 0.06; coins.visible = fillK > 0.005;
    nc.visible = p.noodleCup !== false;
    bills.visible = p.fridgeBills !== false;
    roll.visible = p.duvetRoll !== false;
    // phone: on the bed (0) → in her hand in front of the studio-phone camera (1)
    const k = smooth(clamp(p.phoneLift ?? 0));
    ph.group.position.lerpVectors(PH_BED.p, PH_HAND.p, k); ph.group.position.y += Math.sin(Math.PI * k) * 0.12;
    ph.group.quaternion.slerpQuaternions(PH_BED.q, PH_HAND.q, k);
    const scr = p.phoneScreen instanceof HTMLCanvasElement ? texFromCanvas(p.phoneScreen) : phoneDefaultTex();
    if (ph.screen.material.map !== scr) { ph.screen.material.map = scr; ph.screen.material.needsUpdate = true; }
    const gl = clamp(p.phoneGlow ?? (night ? 1 : 0.8), 0, 2);
    ph.screen.material.color.setScalar(0.35 + 0.65 * Math.min(1, gl));
    ph.light.intensity = gl * (night ? 0.9 : 0.3); ph.gl.visible = gl > 0.05 && night; ph.gl.material.opacity = 0.18 * gl; ph.gl.scale.setScalar(0.32);
  }
  function look(m) {
    return m === 'night'
      ? { tint: [0.95, 0.94, 1.04], lift: [0.0, 0.0, 0.03], glow: 0.45, vig: 0.6, vigCol: [0.42, 0.38, 0.62], sat: 1.02 }
      : { tint: [1.02, 1.0, 0.97], lift: [0.02, 0.01, 0.015], glow: 0.35, vig: 0.4, vigCol: [0.86, 0.62, 0.62], sat: 1.04 };
  }

  // ---------- camera presets (one slow move each; t in seconds; len = how long the move takes) ----------
  const presets = {
    'studio-wide': { from: { p: [0.75, 1.55, 2.45], at: [-0.7, 0.78, -1.8], fov: 60 }, to: { p: [0.5, 1.52, 2.15], at: [-0.75, 0.78, -1.8] }, mia: [-1.32, 0.99, -1.0], front: true, props: {} },
    'studio-bed': { from: { p: [0.35, 1.25, 0.95], at: [-1.3, 0.92, -1.25], fov: 52 }, to: { p: [0.2, 1.22, 0.75], at: [-1.32, 0.92, -1.25] }, mia: [-1.25, 1.03, -1.05], front: true },
    'studio-phone': { from: { p: PH_CAM.toArray(), at: [-1.02, 0.98, -0.52], fov: 34 }, to: { p: [-0.79, 1.12, -0.04], at: [-1.02, 0.98, -0.52] }, mia: null, focus: [-1.02, 0.98, -0.52], props: { phoneLift: 1 } },
    'studio-door': { from: { p: [0.25, 1.5, 1.0], at: [X1, 1.3, 0.92], fov: 46 }, to: { p: [0.6, 1.47, 0.97], at: [X1, 1.33, 0.92] }, mia: { sx: 0.18, d: 1.9 }, focus: [X1 - 0.06, 1.42, 0.94] },
    'studio-window': { from: { p: [-0.45, 1.4, -0.2], at: [0.3, 1.18, -2.4], fov: 44 }, to: { p: [-0.3, 1.37, -0.42], at: [0.32, 1.16, -2.4] }, mia: { sx: 0.24, d: 1.75 }, focus: [0.35, 1.1, -2.3] },
    'studio-fridge': { from: { p: [0.75, 1.15, 0.2], at: [1.72, 0.62, -1.84], fov: 46 }, to: { p: [0.85, 1.1, -0.05], at: [1.72, 0.6, -1.84] }, mia: { sx: 0.22, d: 1.8 }, focus: [1.72, 0.5, -1.84] },
  };
  const spots = { bed: [-1.15, 1.06, -0.95], table: [0.15, 1.3, -1.0], door: [1.4, 1.45, 0.95], window: [-0.38, 1.18, -1.15], fridge: [0.95, 1.12, -1.0] };
  setMood('night');
  return { presets, setMood, update, look, objects, spots, defaults: {} };
}
