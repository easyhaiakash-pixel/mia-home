// cafe.js: "Bloom Café" where Mia works. Bright, busy, pretty: pastel pink + mint + warm wood.
// Room: x -3.5..3.5, z -3.5 (back wall, counters) .. 3.0 (open front), height 3.0.
// The street is outside the big window on the right wall (x = 3.5). Adrian's table is in the back-right window corner.
import { THREE, toon, basic, rbox, lathe, sphere, capsule, puff, roundRectShape, heartShape, M, G, glow, blobAt, paint, rr2, heart2, star2, R, OUTLINE, addOutline, clamp, lerp, smooth } from './kit.js';
import { wall, floor, ceiling, trim } from './room.js';
import { woodTex, artTex } from './textures.js';
import { fairyLights, pottedPlant, mug, chair, pendant, texFromCanvas, leafGeo } from './props-common.js';

const OL = OUTLINE;
const X0 = -3.5, X1 = 3.5, Z0 = -3.5, Z1 = 3.0, HT = 3.0;
const TX = {};
const F = '"Arial Rounded MT Bold", Arial, sans-serif';

// ---------- painted café textures ----------
const checkerTex = () => TX.checker ||= paint(256, 256, (g, w, h) => {
  for (let r = 0; r < 4; r++) for (let c = 0; c < 4; c++) { g.fillStyle = (r + c) % 2 ? '#ffe3e8' : '#fff8f1'; g.fillRect(c * 64, r * 64, 64, 64); }
  g.strokeStyle = 'rgba(180,120,120,0.18)'; g.lineWidth = 2; for (let i = 0; i <= 4; i++) { g.beginPath(); g.moveTo(i * 64, 0); g.lineTo(i * 64, h); g.moveTo(0, i * 64); g.lineTo(w, i * 64); g.stroke(); }
}, { repeat: [1, 1] });
const menuTex = () => TX.menu ||= paint(512, 340, (g, w, h) => {
  rr2(g, 0, 0, w, h, 26); g.fillStyle = '#4c5a58'; g.fill();
  g.fillStyle = '#fff6ec'; g.textAlign = 'center'; g.font = `bold 46px ${F}`; g.fillText('MENU', w / 2, 62);
  heart2(g, w / 2 - 92, 46, 12); g.fillStyle = '#ff9fb8'; g.fill(); heart2(g, w / 2 + 92, 46, 12); g.fill();
  const items = [['Latte', '4.50'], ['Black coffee', '3.00'], ['Matcha', '5.00'], ['Strawberry cake', '6.50'], ['Croissant', '3.50']];
  g.font = `28px ${F}`;
  items.forEach(([a, b], i) => { g.textAlign = 'left'; g.fillStyle = ['#ffd6e0', '#fff6ec', '#c9f2dc', '#ffd6e0', '#fff1b8'][i]; g.fillText(a, 50, 116 + i * 46); g.textAlign = 'right'; g.fillText('$' + b, w - 50, 116 + i * 46); });
  g.strokeStyle = 'rgba(255,255,255,0.35)'; g.setLineDash([6, 8]); g.lineWidth = 3; rr2(g, 16, 16, w - 32, h - 32, 18); g.stroke();
});
const signTex = () => TX.sign ||= paint(512, 256, (g, w, h) => {
  g.clearRect(0, 0, w, h);
  g.textAlign = 'center'; g.lineJoin = 'round';
  g.font = `bold 84px ${F}`; g.lineWidth = 14; g.strokeStyle = '#fff'; g.strokeText('Bloom Café', w / 2, 120); g.fillStyle = '#ff6f91'; g.fillText('Bloom Café', w / 2, 120);
  g.font = `bold 30px ${F}`; g.lineWidth = 8; g.strokeText('coffee · cake · love', w / 2, 175); g.fillStyle = '#5aa88a'; g.fillText('coffee · cake · love', w / 2, 175);
  [[70, 60], [442, 60]].forEach(([x, y]) => { for (let i = 0; i < 5; i++) { const a = i / 5 * Math.PI * 2; g.beginPath(); g.arc(x + Math.cos(a) * 16, y + Math.sin(a) * 16, 13, 0, 7); g.fillStyle = '#ffb3c8'; g.fill(); } g.beginPath(); g.arc(x, y, 9, 0, 7); g.fillStyle = '#ffd25e'; g.fill(); });
});
const facadeTex = (night) => TX['fac' + night] ||= paint(1024, 512, (g, w, h) => {
  g.fillStyle = night ? '#3c3f7c' : '#bfe6ff'; g.fillRect(0, 0, w, h);
  const shops = night ? ['#5a5aa0', '#6a5f9e', '#4f6390', '#6c5a94'] : ['#ffd0dc', '#d4f0e2', '#fff0c4', '#e2d6ff'];
  const aw = ['#ff8fab', '#7fcfb0', '#ffc94d', '#a98be8'];
  let x = 0;
  for (let i = 0; x < w; i++) {
    const bw = 200 + R(i) * 80, top = 40 + R(i + 9) * 80;
    rr2(g, x, top, bw, h - top + 20, 14); g.fillStyle = shops[i % 4]; g.fill(); g.lineWidth = 4; g.strokeStyle = 'rgba(107,64,70,0.45)'; g.stroke();
    for (let r = 0; r < 3; r++) for (let c = 0; c < 3; c++) { rr2(g, x + 24 + c * (bw - 48) / 3, top + 24 + r * 58, (bw - 48) / 3 - 14, 40, 6); g.fillStyle = night ? (R(i * 9 + r * 3 + c) > 0.4 ? '#ffd27a' : '#2e3166') : 'rgba(255,255,255,0.85)'; g.fill(); }
    // shop window + awning
    rr2(g, x + 20, h - 150, bw - 40, 130, 8); g.fillStyle = night ? '#ffcf8a' : '#e9f6ff'; g.fill(); g.stroke();
    g.fillStyle = aw[i % 4]; g.beginPath(); g.moveTo(x + 10, h - 170); g.lineTo(x + bw - 10, h - 170); g.lineTo(x + bw - 2, h - 140); g.lineTo(x + 2, h - 140); g.closePath(); g.fill(); g.stroke();
    for (let s = 0; s < 6; s++) { g.fillStyle = 'rgba(255,255,255,0.7)'; g.fillRect(x + 14 + s * (bw - 28) / 6, h - 168, (bw - 28) / 12, 26); }
    x += bw + 10;
  }
});
const roadTex = () => TX.road ||= paint(256, 512, (g, w, h) => {
  g.fillStyle = '#8c8aa6'; g.fillRect(0, 0, w, h);
  for (let i = 0; i < 60; i++) { g.fillStyle = `rgba(255,255,255,${0.04 + R(i) * 0.05})`; g.beginPath(); g.arc(R(i) * w, R(i + 7) * h, 3 + R(i + 3) * 6, 0, 7); g.fill(); }
  g.fillStyle = '#fff3c4'; for (let y = 20; y < h; y += 128) g.fillRect(w / 2 - 6, y, 12, 70);
}, { repeat: [1, 6] });
const paveTex = () => TX.pave ||= paint(256, 256, (g, w, h) => { g.fillStyle = '#f2dcd6'; g.fillRect(0, 0, w, h); g.strokeStyle = 'rgba(150,100,100,0.25)'; g.lineWidth = 3; for (let i = 0; i <= 4; i++) { g.beginPath(); g.moveTo(i * 64, 0); g.lineTo(i * 64, h); g.moveTo(0, i * 64); g.lineTo(w, i * 64); g.stroke(); } }, { repeat: [2, 12] });
const billTex = () => TX.bill ||= paint(256, 112, (g, w, h) => {
  rr2(g, 2, 2, w - 4, h - 4, 8); g.fillStyle = '#cdeccf'; g.fill(); g.lineWidth = 4; g.strokeStyle = '#4f8a5e'; g.stroke();
  rr2(g, 12, 12, w - 24, h - 24, 6); g.lineWidth = 2; g.stroke();
  g.beginPath(); g.ellipse(w / 2, h / 2, 26, 32, 0, 0, 7); g.fillStyle = '#a9d8b0'; g.fill(); g.stroke();
  g.fillStyle = '#3f7a4e'; g.font = `bold 34px ${F}`; g.textAlign = 'left'; g.fillText('100', 20, 46); g.textAlign = 'right'; g.fillText('100', w - 20, h - 18);
});
const napkinTex = () => TX.napkin ||= paint(256, 192, (g, w, h) => { g.fillStyle = '#fffdf6'; g.fillRect(0, 0, w, h); g.strokeStyle = 'rgba(220,180,170,0.6)'; g.lineWidth = 3; g.strokeRect(10, 10, w - 20, h - 20); heart2(g, w - 30, 30, 9); g.fillStyle = '#ffb3c8'; g.fill(); });
const tipTex = () => TX.tip ||= paint(128, 64, (g) => { rr2(g, 2, 2, 124, 60, 12); g.fillStyle = '#fff6d8'; g.fill(); g.lineWidth = 3; g.strokeStyle = OL; g.stroke(); g.fillStyle = '#e0647a'; g.font = `bold 30px ${F}`; g.textAlign = 'center'; g.fillText('TIPS', 64, 31); g.font = `20px ${F}`; g.fillText('thank u ♡', 64, 54); });
const counterFront = () => TX.cfront ||= paint(512, 256, (g, w, h) => {
  g.fillStyle = '#ffc9d6'; g.fillRect(0, 0, w, h);
  for (let x = 0; x < w; x += 32) { g.fillStyle = x % 64 ? '#ffd6e0' : '#ffc0cf'; g.fillRect(x, 0, 32, h); g.fillStyle = 'rgba(107,64,70,0.12)'; g.fillRect(x, 0, 2, h); }
  g.fillStyle = 'rgba(255,255,255,0.35)'; g.fillRect(0, 0, w, 14);
}, { repeat: [3, 1] });
const awningTex = () => TX.awning ||= paint(256, 64, (g, w, h) => { for (let x = 0; x < w; x += 32) { g.fillStyle = (x / 32) % 2 ? '#ffffff' : '#ff9fb8'; g.fillRect(x, 0, 32, h); } }, { repeat: [6, 1] });

export function buildCafe({ scene, statics: st }) {
  const objects = {};
  const wstyle = { paper: '#ffe9ec', dot: '#ffd3dc', wains: '#c9ecdc', wainsH: 1.0, pattern: 'stripes', edge: '#f6dcd4' };
  const wstyleSide = { ...wstyle, pattern: 'hearts', dot: '#ffc2cf' };
  // ---------- shell ----------
  const WIN = { u0: 0.25, u1: 3.75, y0: 0.5, y1: 2.6 };    // right wall, u = z - Z0  → window z -3.25..0.25
  const DOOR = { u0: 4.3, u1: 5.3, y0: 0, y1: 2.35 };       // door z 0.8..1.8
  scene.add(wall(st, { o: [X0, Z0], u: [1, 0], n: [0, 1], len: X1 - X0, h: HT, style: wstyle }));
  scene.add(wall(st, { o: [X0, Z1], u: [0, -1], n: [1, 0], len: Z1 - Z0, h: HT, style: wstyleSide }));
  scene.add(wall(st, { o: [X1, Z0], u: [0, 1], n: [-1, 0], len: Z1 - Z0, h: HT, holes: [WIN, DOOR], style: wstyleSide }));
  scene.add(floor(X0, X1, Z0, Z1, checkerTex()));
  scene.add(ceiling(X0, X1, Z0, Z1, HT, '#fff8f1'));
  [[[X0, Z0 + 0.01], [X1, Z0 + 0.01]], [[X0 + 0.01, Z0], [X0 + 0.01, Z1]], [[X1 - 0.01, 0.25], [X1 - 0.01, 0.8]], [[X1 - 0.01, 1.8], [X1 - 0.01, Z1]]].forEach(([a, b]) => trim(st, a, b, 0.05, 0.1, 0.02));
  [[[X0, Z0 + 0.01], [X1, Z0 + 0.01]], [[X0 + 0.01, Z0], [X0 + 0.01, Z1]]].forEach(([a, b]) => trim(st, a, b, 1.0, 0.045, 0.02));

  // ---------- big window + glass + sign ----------
  const wz0 = Z0 + WIN.u0, wz1 = Z0 + WIN.u1, wcz = (wz0 + wz1) / 2, wl = wz1 - wz0, wy0 = WIN.y0, wy1 = WIN.y1, wh = wy1 - wy0;
  const wf = toon('#ffffff');
  st.add(M(rbox(0.1, 0.08, wl + 0.16, 0.03), wf, X1 - 0.02, wy1 + 0.03, wcz));
  st.add(M(rbox(0.14, 0.08, wl + 0.2, 0.03), wf, X1 - 0.02, wy0 - 0.02, wcz));
  [wz0 - 0.03, wcz - wl / 6, wcz + wl / 6, wz1 + 0.03].forEach(z => st.add(M(rbox(0.1, wh, 0.06, 0.02), wf, X1 - 0.02, (wy0 + wy1) / 2, z)));
  st.add(M(rbox(0.06, 0.04, wl, 0.015), wf, X1 - 0.03, wy1 - 0.45, wcz));
  const glass = new THREE.Mesh(new THREE.PlaneGeometry(wl, wh), new THREE.MeshBasicMaterial({ color: '#e6f6ff', transparent: true, opacity: 0.1, depthWrite: false }));
  glass.position.set(X1 - 0.04, (wy0 + wy1) / 2, wcz); glass.rotation.y = -Math.PI / 2; scene.add(glass);
  const sign = new THREE.Mesh(new THREE.PlaneGeometry(1.0, 0.5), new THREE.MeshBasicMaterial({ map: signTex(), transparent: true, depthWrite: false }));
  sign.position.set(X1 - 0.06, 1.98, wcz); sign.rotation.y = -Math.PI / 2; scene.add(sign);
  // awning outside (stripes peek over the window top)
  const awn = M(rbox(0.7, 0.05, wl + 1.0, 0.02), toon('#ffffff', { map: awningTex() }), X1 + 0.4, wy1 + 0.25, wcz, 0, 0, -0.35); st.add(awn);
  // window seat plants
  const wp = pottedPlant({ potColor: '#ffffff', leaf: '#8fd3a8', h: 0.35, leaves: 7, r: 0.07, seed: 21 }); wp.position.set(X1 - 0.12, wy0, wcz + 0.9); st.add(wp);

  // ---------- door with bell ----------
  const dz0 = Z0 + DOOR.u0, dz1 = Z0 + DOOR.u1, dcz = (dz0 + dz1) / 2, dw = dz1 - dz0, dh = DOOR.y1;
  st.add(M(rbox(0.08, dh + 0.06, 0.09, 0.02), toon('#7fcfb0'), X1 - 0.02, dh / 2, dz0 - 0.03));
  st.add(M(rbox(0.08, dh + 0.06, 0.09, 0.02), toon('#7fcfb0'), X1 - 0.02, dh / 2, dz1 + 0.03));
  st.add(M(rbox(0.09, 0.08, dw + 0.15, 0.02), toon('#7fcfb0'), X1 - 0.02, dh + 0.02, dcz));
  const door = G(X1 - 0.03, 0, dcz, -Math.PI / 2); door.name = 'cafeDoor';
  door.add(M(rbox(dw - 0.04, 0.4, 0.05, 0.02), toon('#a8e0c9'), 0, 0.2, 0));
  door.add(M(rbox(dw - 0.04, 0.12, 0.05, 0.02), toon('#a8e0c9'), 0, dh - 0.07, 0));
  [-1, 1].forEach(s => door.add(M(rbox(0.1, dh, 0.05, 0.02), toon('#a8e0c9'), s * (dw / 2 - 0.07), dh / 2, 0)));
  const dg = new THREE.Mesh(new THREE.PlaneGeometry(dw - 0.2, dh - 0.55), new THREE.MeshBasicMaterial({ color: '#d8f0ff', transparent: true, opacity: 0.22, depthWrite: false })); dg.position.set(0, 0.4 + (dh - 0.55) / 2, 0); door.add(dg);
  door.add(M(capsule(0.012, 0.3, 4, 8), toon('#ffd27a'), -dw / 2 + 0.16, 1.1, 0.05));
  const openSign = new THREE.Mesh(new THREE.PlaneGeometry(0.34, 0.2), basic({ map: paint(170, 100, (g) => { rr2(g, 4, 4, 162, 92, 16); g.fillStyle = '#fff'; g.fill(); g.lineWidth = 5; g.strokeStyle = OL; g.stroke(); g.fillStyle = '#ff6f91'; g.font = `bold 40px ${F}`; g.textAlign = 'center'; g.fillText('OPEN', 85, 64); }) }));
  openSign.position.set(0, 1.55, 0.03); door.add(openSign);
  st.add(door);
  // the bell (swings when props.doorBell > 0: seconds since it rang)
  const bell = G(X1 - 0.12, dh + 0.02, dz0 + 0.12); bell.name = 'doorBell';
  bell.add(M(capsule(0.004, 0.06, 3, 6), toon('#c9a24e'), 0, -0.035, 0));
  const bellBody = M(lathe([[0.001, -0.12], [0.05, -0.12], [0.045, -0.1], [0.03, -0.06], [0.022, -0.075 + 0.0], [0.02, -0.06], [0.001, -0.055]], 18), toon('#ffd25e')); bell.add(bellBody); addOutline(bellBody);
  bell.add(M(sphere(0.012), toon('#c9a24e'), 0, -0.125, 0));
  st.add(M(rbox(0.12, 0.02, 0.02, 0.006), toon('#c9a24e'), X1 - 0.07, dh + 0.02, dz0 + 0.12, 0, Math.PI / 2, 0));
  scene.add(bell); objects.doorBell = bell;

  // ---------- back counter (barista bench) with the coffee machine ----------
  const bcx0 = X0 + 0.1, bcx1 = 0.3, bcl = bcx1 - bcx0, bcc = (bcx0 + bcx1) / 2, bz = Z0 + 0.3;
  st.add(M(rbox(bcl, 0.92, 0.58, 0.03), toon('#bfe6d6'), bcc, 0.46, bz));
  for (let i = 0; i < 6; i++) { const x = bcx0 + 0.3 + i * (bcl - 0.6) / 5; st.add(M(rbox(bcl / 6 - 0.08, 0.7, 0.02, 0.02), toon('#d2f0e3'), x, 0.46, bz + 0.29)); st.add(M(sphere(0.022), toon('#ffd27a'), x + bcl / 12 - 0.08, 0.6, bz + 0.31)); }
  st.add(M(rbox(bcl + 0.04, 0.05, 0.62, 0.02), toon('#f6d6b0', { map: woodTex('#f6d6b0', 'woodTop') }), bcc, 0.945, bz));
  // coffee machine (pastel mint body, gold knobs, two spouts)
  const cm = G(-2.45, 0.97, bz - 0.05);
  cm.add(M(rbox(0.72, 0.5, 0.46, 0.08), toon('#a8e0c9'), 0, 0.25, 0));
  cm.add(M(rbox(0.74, 0.08, 0.48, 0.04), toon('#fff3e6'), 0, 0.52, 0));
  [-0.18, 0.18].forEach(x => { cm.add(M(lathe([[0.001, 0], [0.05, 0], [0.055, 0.03], [0.035, 0.06], [0.001, 0.06]], 16), toon('#e9e3ef'), x, 0.18, 0.27, Math.PI, 0, 0)); cm.add(M(capsule(0.012, 0.1, 3, 6), toon('#6b4046'), x, 0.2, 0.36, Math.PI / 2, 0, 0)); cm.add(mug('#ffffff', 0.032, 0.06)); cm.children[cm.children.length - 1].position.set(x, 0.0, 0.27); });
  [-0.25, 0, 0.25].forEach(x => cm.add(M(sphere(0.025), toon('#ffd27a'), x, 0.42, 0.24)));
  cm.add(M(new THREE.CircleGeometry(0.06, 20), toon('#ffffff'), 0, 0.36, 0.232));
  cm.add(M(lathe([[0.001, 0], [0.06, 0], [0.06, 0.2], [0.09, 0.32], [0.001, 0.33]], 18), toon('#ffb3c8'), 0.5, 0, -0.05)); // grinder
  st.add(cm);
  // cups stacked, syrup bottles, jars
  for (let i = 0; i < 4; i++) st.add(M(lathe([[0.001, 0], [0.035, 0], [0.045, 0.07], [0.001, 0.07]], 14), toon('#ffffff'), -1.85, 0.97 + i * 0.05, bz));
  ['#ff9fb8', '#ffd27a', '#c7b3f0', '#9fd3c7'].forEach((c, i) => st.add(M(lathe([[0.001, 0], [0.035, 0], [0.035, 0.18], [0.015, 0.24], [0.015, 0.28], [0.001, 0.28]], 12), toon(c), -1.4 + i * 0.1, 0.97, bz - 0.1)));
  // shelves above the back counter with cups, jars and plants
  [1.65, 2.1].forEach((y, r) => {
    st.add(M(rbox(2.6, 0.04, 0.24, 0.015), toon('#e7b98c'), -2.0, y, Z0 + 0.14));
    for (let i = 0; i < 7; i++) {
      const x = -3.1 + i * 0.36;
      if ((i + r) % 3 === 0) { const p = pottedPlant({ potColor: '#fff3df', leaf: '#8fd3a8', h: 0.26, leaves: 6, r: 0.05, seed: i + r * 9 }); p.position.set(x, y + 0.02, Z0 + 0.13); st.add(p); }
      else st.add(M(lathe([[0.001, 0], [0.05, 0], [0.055, 0.09], [0.05, 0.1], [0.001, 0.1]], 14), toon(['#ff9fb8', '#ffffff', '#c9f0ff', '#ffd27a'][(i + r) % 4]), x, y + 0.02, Z0 + 0.13));
    }
  });
  // menu board
  const menu = new THREE.Mesh(new THREE.PlaneGeometry(1.3, 0.86), toon('#ffffff', { map: menuTex() })); menu.position.set(-0.55, 1.95, Z0 + 0.02); scene.add(menu);
  st.add(M(rbox(1.38, 0.94, 0.03, 0.03), toon('#e7b98c'), -0.55, 1.95, Z0 + 0.005));
  // garland of flowers along the back wall top
  for (let i = 0; i < 26; i++) { const x = X0 + 0.2 + i * 0.26, y = 2.65 - Math.sin((i % 6) / 6 * Math.PI) * 0.12; st.add(M(sphere(0.05, 10, 8), toon(['#ffb3c8', '#ffffff', '#ffd25e', '#c9f0dc'][i % 4]), x, y, Z0 + 0.06)); }

  // ---------- front counter (pink, wood top) with register, cake display, tip jar ----------
  const fc = new THREE.Group(); fc.name = 'frontCounter';
  const fcx0 = X0 + 0.15, fcx1 = 0.2, fcl = fcx1 - fcx0, fcc = (fcx0 + fcx1) / 2, fz = -2.25;
  fc.add(M(rbox(fcl, 1.0, 0.62, 0.04), toon('#ffffff', { map: counterFront() }), fcc, 0.5, fz));
  fc.add(M(rbox(fcl + 0.08, 0.06, 0.7, 0.025), toon('#f6d6b0', { map: woodTex('#f6d6b0', 'woodTop') }), fcc, 1.03, fz));
  fc.add(M(rbox(fcl, 0.08, 0.04, 0.02), toon('#ffffff'), fcc, 0.05, fz + 0.31));
  // register
  const reg = G(-1.45, 1.06, fz - 0.05, 0.2);
  reg.add(M(rbox(0.32, 0.12, 0.26, 0.03), toon('#c7b3f0'), 0, 0.06, 0)); reg.add(M(rbox(0.26, 0.16, 0.03, 0.02), toon('#e9e3ff'), 0, 0.2, -0.08, -0.4, 0, 0)); reg.add(M(rbox(0.24, 0.02, 0.12, 0.008), toon('#ffffff'), 0, 0.125, 0.05));
  fc.add(reg);
  // cake display: glass box with three cakes
  const cd = G(-0.45, 1.06, fz);
  cd.add(M(rbox(0.9, 0.04, 0.56, 0.015), toon('#ffffff'), 0, 0.02, 0));
  const cdGlass = new THREE.Mesh(rbox(0.9, 0.44, 0.56, 0.05), new THREE.MeshToonMaterial({ color: '#e6f6ff', transparent: true, opacity: 0.25, depthWrite: false })); cdGlass.position.y = 0.26; cd.add(cdGlass); addOutline(cdGlass);
  const cake = (x, c1, c2, h = 0.13) => { const ck = G(x, 0.04, 0); ck.add(M(lathe([[0.001, 0], [0.11, 0], [0.11, h], [0.1, h + 0.015], [0.001, h + 0.015]], 22), toon(c1))); for (let i = 0; i < 8; i++) { const a = i / 8 * Math.PI * 2; ck.add(M(sphere(0.022, 8, 6), toon(c2), Math.cos(a) * 0.085, h + 0.015, Math.sin(a) * 0.085)); } ck.add(M(sphere(0.03, 10, 8), toon('#ff5a7a'), 0, h + 0.04, 0)); return ck; };
  cd.add(cake(-0.27, '#fff3e6', '#ffffff')); cd.add(cake(0, '#ffc2d1', '#fff6ec', 0.15)); cd.add(cake(0.27, '#c9f0dc', '#ffffff', 0.11));
  fc.add(cd);
  // tip jar (prop)
  const tip = G(-1.05, 1.06, fz + 0.2); tip.name = 'tipJar';
  const tg = new THREE.Mesh(lathe([[0.001, 0], [0.06, 0], [0.065, 0.01], [0.065, 0.15], [0.055, 0.17], [0.001, 0.17]], 20), new THREE.MeshToonMaterial({ color: '#e6f6ff', transparent: true, opacity: 0.35, depthWrite: false })); tip.add(tg); addOutline(tg);
  const tipCash = M(new THREE.CylinderGeometry(0.055, 0.058, 1, 18), toon('#cdeccf'), 0, 0.01, 0); tip.add(tipCash);
  const tl = new THREE.Mesh(new THREE.PlaneGeometry(0.11, 0.055), basic({ map: tipTex() })); tl.position.set(0, 0.1, 0.066); tip.add(tl);
  fc.add(tip); objects.tipJar = tip;
  // croissants on a plate + flowers
  const pl = G(-2.4, 1.06, fz + 0.05); pl.add(M(new THREE.CylinderGeometry(0.16, 0.12, 0.02, 24), toon('#ffffff'), 0, 0.01, 0));
  for (let i = 0; i < 3; i++) { const c = M(capsule(0.035, 0.09, 4, 10), toon('#f2b766'), -0.06 + i * 0.06, 0.05, (i % 2) * 0.04 - 0.02, 0, i, Math.PI / 2); c.scale.set(1, 1, 0.8); pl.add(c); }
  fc.add(pl);
  const vase = G(-3.0, 1.06, fz); vase.add(M(lathe([[0.001, 0], [0.05, 0], [0.06, 0.08], [0.03, 0.16], [0.035, 0.2], [0.001, 0.2]], 16), toon('#c9f0ff')));
  for (let i = 0; i < 5; i++) { const a = i / 5 * Math.PI * 2; vase.add(M(capsule(0.005, 0.18, 3, 4), toon('#7fbf8f'), Math.cos(a) * 0.03, 0.27, Math.sin(a) * 0.03, Math.sin(a) * 0.3, 0, -Math.cos(a) * 0.3)); vase.add(M(sphere(0.04, 10, 8), toon(['#ffb3c8', '#ffffff', '#ffd25e', '#ff8fab', '#fff0c9'][i]), Math.cos(a) * 0.08, 0.37, Math.sin(a) * 0.08)); }
  fc.add(vase);
  { const ms = []; fc.traverse(o => { if (o.isMesh) ms.push(o); }); ms.forEach(o => { o.castShadow = o.receiveShadow = true; o.layers.enable(1); if (!o.material.transparent && o.material.type !== 'MeshBasicMaterial' && !o.name.endsWith(':outline') && !o.children.some(c => c.name.endsWith(':outline'))) { const h = addOutline(o); h.layers.enable(1); } else o.children.forEach(c => c.layers.enable(1)); }); }
  scene.add(fc); objects.frontCounter = fc;
  scene.add(blobAt(fcl + 0.4, 1.0, 0.45, fcc, fz));

  // ---------- tables + chairs ----------
  const table = (x, z, r = 0.38, top = '#fff8f1') => {
    const t = G(x, 0, z);
    t.add(M(lathe([[0.001, 0.73], [r, 0.73], [r + 0.02, 0.745], [r + 0.02, 0.765], [r, 0.78], [0.001, 0.78]], 32), toon(top)));
    t.add(M(capsule(0.03, 0.64, 4, 10), toon('#e7b98c'), 0, 0.37, 0));
    t.add(M(lathe([[0.001, 0], [0.22, 0], [0.2, 0.04], [0.05, 0.06], [0.001, 0.06]], 24), toon('#e7b98c')));
    return t;
  };
  const tables = [[-0.8, -0.3, '#ffe3e8'], [-2.4, 0.9, '#e4f6ef'], [0.9, 1.3, '#fff3d6']];
  tables.forEach(([x, z, c], i) => {
    st.add(table(x, z, 0.36, c)); scene.add(blobAt(1.2, 1.2, 0.45, x, z));
    [[0, 0.62, Math.PI], [0, -0.62, 0]].forEach(([dx, dz, ry], k) => { const ch = chair({ seat: ['#ffc9d6', '#c9f0dc', '#fff0c9', '#e2d6ff'][(i + k) % 4] }); ch.position.set(x + dx, 0, z + dz); ch.rotation.y = ry + (R(i * 3 + k) - 0.5) * 0.4; st.add(ch); });
    // a cup + plate on each table
    const m = mug(['#ffffff', '#ffb3c8', '#c9f0ff', '#ffd27a'][i], 0.04, 0.08); m.position.set(x + 0.12, 0.78, z - 0.05); m.rotation.y = i; st.add(m);
    st.add(M(new THREE.CylinderGeometry(0.11, 0.09, 0.015, 20), toon('#ffffff'), x - 0.1, 0.787, z + 0.08));
  });

  // ---------- Adrian's corner table (by the window) ----------
  const AX = 2.72, AZ = -2.55;
  const at = new THREE.Group(); at.name = 'adrianTable';
  at.add(table(AX, AZ, 0.4, '#fffaf4'));
  const aCh1 = chair({ seat: '#d9d2e9' }); aCh1.position.set(AX - 0.08, 0, AZ + 0.68); aCh1.rotation.y = Math.PI - 0.25; at.add(aCh1);   // his chair (camera side, faces the window corner)
  const aCh2 = chair({ seat: '#ffc9d6' }); aCh2.position.set(AX - 0.62, 0, AZ - 0.32); aCh2.rotation.y = Math.PI / 2 + 0.3; at.add(aCh2);
  st.add(at); scene.add(blobAt(1.3, 1.3, 0.5, AX, AZ));
  // vase with one flower
  const ov = G(AX + 0.16, 0.78, AZ - 0.14);
  ov.add(M(lathe([[0.001, 0], [0.03, 0], [0.035, 0.05], [0.015, 0.11], [0.02, 0.13], [0.001, 0.13]], 16), toon('#dff4ff')));
  ov.add(M(capsule(0.004, 0.16, 3, 4), toon('#7fbf8f'), 0, 0.2, 0, 0, 0, 0.1));
  for (let i = 0; i < 5; i++) { const a = i / 5 * Math.PI * 2; ov.add(M(sphere(0.022, 8, 6), toon('#ff8fab'), -0.01 + Math.cos(a) * 0.024, 0.29, Math.sin(a) * 0.024)); }
  ov.add(M(sphere(0.016, 8, 6), toon('#ffd25e'), -0.01, 0.295, 0));
  st.add(ov);
  // the napkin note (folded → open); film can pass its own canvas in props.napkinNote
  const nap = G(AX - 0.05, 0.782, AZ + 0.08, -0.6); nap.name = 'napkinNote';
  const napMat = toon('#ffffff', { map: napkinTex() });
  const napBase = new THREE.Mesh(new THREE.PlaneGeometry(0.2, 0.15), napMat); napBase.rotation.x = -Math.PI / 2; nap.add(napBase);
  const hinge = G(0, 0.002, -0.075); nap.add(hinge);
  const napFlap = new THREE.Mesh(new THREE.PlaneGeometry(0.2, 0.15), toon('#fffdf6', { side: THREE.DoubleSide })); napFlap.rotation.x = -Math.PI / 2; napFlap.position.z = 0.075; hinge.add(napFlap);
  const napNote = new THREE.Mesh(new THREE.PlaneGeometry(0.2, 0.15), new THREE.MeshBasicMaterial({ color: '#ffffff', transparent: true })); napNote.rotation.x = -Math.PI / 2; napNote.position.y = 0.0015; napNote.name = 'napkinNoteScreen'; nap.add(napNote);
  scene.add(nap); objects.napkinNote = nap; objects.napkinNoteScreen = napNote;
  // the cup (black coffee on a saucer; lifts up)
  const cup = G(AX - 0.05, 0.782, AZ + 0.08); cup.name = 'adrianCup';
  const saucer = M(lathe([[0.001, 0], [0.07, 0], [0.085, 0.012], [0.08, 0.016], [0.001, 0.008]], 24), toon('#ffffff')); cup.add(saucer); addOutline(saucer);
  const cupG = G(0, 0.012, 0); cup.add(cupG);
  const cupBody = M(lathe([[0.001, 0], [0.03, 0], [0.045, 0.02], [0.048, 0.07], [0.044, 0.07], [0.042, 0.03], [0.001, 0.025]], 24), toon('#ffffff')); cupG.add(cupBody); addOutline(cupBody);
  cupG.add(M(new THREE.CircleGeometry(0.043, 22), toon('#3b2420'), 0, 0.062, 0, -Math.PI / 2, 0, 0));
  const cupH = M(new THREE.TorusGeometry(0.022, 0.006, 6, 14, Math.PI * 1.3), toon('#ffffff'), 0.05, 0.04, 0, 0, 0, -Math.PI * 0.65); cupG.add(cupH);
  cupG.add(M(capsule(0.003, 0.08, 3, 4), toon('#d9d4dd'), 0.055, 0.008, 0.02, Math.PI / 2, 0, 0.4));
  scene.add(cup); objects.adrianCup = cup;
  // the cash: fan of ten $100 bills (0–10 showing)
  const cash = G(AX + 0.03, 0.785, AZ + 0.24, -0.6); cash.name = 'cashStack';
  const billGeo = new THREE.BoxGeometry(0.156, 0.0012, 0.068); const billMat = toon('#ffffff', { map: billTex() });
  const bills = [];
  for (let i = 0; i < 10; i++) { const b = new THREE.Mesh(billGeo, billMat); b.castShadow = true; cash.add(b); bills.push(b); }
  scene.add(cash); objects.cashStack = cash;
  // little spots of sun on his table? no: real shadows from the window do that.

  // ---------- plants, pendants, wall art, hanging plants ----------
  [[X0 + 0.35, 2.4, 1.05, 31], [0.85, -3.15, 0.9, 32], [X1 - 0.35, 2.55, 0.95, 33]].forEach(([x, z, h, s]) => { const p = pottedPlant({ potColor: '#fff3df', leaf: '#8fd3a8', h, leaves: 12, r: 0.18, seed: s }); p.position.set(x, 0, z); st.add(p); scene.add(blobAt(0.8, 0.8, 0.5, x, z)); });
  [[-3.48, 1.7, -1.0, 'cloud'], [-3.48, 1.75, 0.3, 'heart'], [-3.48, 1.65, 1.5, 'sun']].forEach(([x, y, z, k]) => {
    st.add(M(rbox(0.03, 0.52, 0.42, 0.012), toon('#ffffff'), x + 0.01, y, z));
    const a = new THREE.Mesh(new THREE.PlaneGeometry(0.36, 0.46), toon('#ffffff', { map: artTex(k) })); a.position.set(x + 0.03, y, z); a.rotation.y = Math.PI / 2; st.add(a, { outline: false });
  });
  const lamps = [];
  [[-2.6, -2.25], [-1.6, -2.25], [-0.6, -2.25]].forEach(([x, z]) => { const p = pendant({ color: '#ffd0dc', cord: 0.65, r: 0.16, intensity: 1.6, dist: 3.2 }); p.group.position.set(x, HT, z); scene.add(p.group); lamps.push(p); });
  tables.forEach(([x, z]) => { const p = pendant({ color: '#ffe0e6', cord: 0.95, r: 0.2, intensity: 1.4, dist: 3 }); p.group.position.set(x, HT, z); scene.add(p.group); lamps.push(p); });
  { const p = pendant({ color: '#fff0c9', cord: 0.95, r: 0.2, intensity: 1.4, dist: 3 }); p.group.position.set(AX, HT, AZ); scene.add(p.group); lamps.push(p); }
  [[-3.0, 0.2], [2.9, 0.7], [3.0, -1.6]].forEach(([x, z], i) => { const hp = G(x, HT - 0.75, z); hp.add(M(lathe([[0.001, 0], [0.1, 0.02], [0.13, 0.14], [0.001, 0.14]], 16), toon('#ffffff'))); for (let k = 0; k < 7; k++) { const l = new THREE.Mesh(leafGeo(0.16), toon('#8fd3a8')); l.position.set(0, 0.06, 0); l.rotation.set(Math.PI - 0.6 + R(k) * 0.4, k / 7 * Math.PI * 2, 0); hp.add(l); } hp.add(M(new THREE.CylinderGeometry(0.004, 0.004, 0.75, 4), toon('#7a5a4a'), 0, 0.5, 0)); st.add(hp); });
  // fairy lights along the window top
  const fl = fairyLights([[X1 - 0.08, wy1 + 0.18, wz0], [X1 - 0.08, wy1 + 0.18, wz1]], { sag: 0.18, every: 0.13 });
  scene.add(fl.group); objects.fairyLights = fl.group;

  // ---------- outside: sidewalk, road, trees, lamps, shops across the street ----------
  const out = new THREE.Group();
  const side = new THREE.Mesh(new THREE.PlaneGeometry(2.6, 40), toon('#ffffff', { map: paveTex() })); side.rotation.x = -Math.PI / 2; side.position.set(X1 + 1.3, -0.01, -2); side.receiveShadow = true; out.add(side);
  const road = new THREE.Mesh(new THREE.PlaneGeometry(4.6, 40), toon('#ffffff', { map: roadTex() })); road.rotation.x = -Math.PI / 2; road.position.set(X1 + 4.9, -0.03, -2); road.receiveShadow = true; out.add(road);
  const side2 = new THREE.Mesh(new THREE.PlaneGeometry(2.4, 40), toon('#ffffff', { map: paveTex() })); side2.rotation.x = -Math.PI / 2; side2.position.set(X1 + 8.4, -0.01, -2); out.add(side2);
  out.add(M(rbox(0.16, 0.12, 40, 0.03), toon('#e9d6d0'), X1 + 2.6, 0.02, -2));
  const facade = new THREE.Mesh(new THREE.PlaneGeometry(40, 9), basic({ map: facadeTex(false), color: '#d9d2e6' })); facade.position.set(X1 + 9.6, 4.0, -2); facade.rotation.y = -Math.PI / 2; out.add(facade);
  for (let i = 0; i < 6; i++) {
    const z = -10.9 + i * 4.2;
    const tr = G(X1 + 2.2, 0, z); tr.add(M(capsule(0.06, 1.6, 4, 8), toon('#c98f6a'), 0, 0.85, 0));
    [[0, 2.2, 0, 0.55], [0.3, 1.95, 0.2, 0.42], [-0.3, 2.0, -0.15, 0.45], [0, 2.55, 0.1, 0.4]].forEach(([x, y, zz, r], k) => tr.add(M(sphere(r, 16, 12), toon(k % 2 ? '#9ed9b4' : '#8fd3a8'), x, y, zz)));
    out.add(tr);
    if (i % 2) { const lp = G(X1 + 2.45, 0, z + 2.1); lp.add(M(capsule(0.035, 2.6, 4, 8), toon('#6a6f9e'), 0, 1.35, 0)); lp.add(M(sphere(0.13, 14, 10), basic({ color: '#fff3c4' }), 0, 2.75, 0)); out.add(lp); }
  }
  st.add(out);
  // street-lamp glows + light (night)
  const streetGlows = [];
  for (let i = 0; i < 3; i++) { const g2 = glow('#ffe2a8', 1.2, 0.6); g2.position.set(X1 + 2.45, 2.75, -12 + (i * 2 + 1) * 4.2 + 2.1); scene.add(g2); streetGlows.push(g2); }
  const streetL = new THREE.PointLight('#ffd9a0', 0, 8, 1.2); streetL.position.set(X1 + 2.4, 2.6, -1.0); scene.add(streetL);

  // ---------- the black car (drives past: props.blackCar 0 → 1) ----------
  const car = G(X1 + 5.9, 0, 0); car.name = 'blackCar';
  const body = toon('#2b2a36'), glassM = toon('#7f8fc4'), chrome = toon('#d9d4dd');
  car.add(M(rbox(1.75, 0.5, 4.2, 0.22, 4), body, 0, 0.5, 0));
  car.add(M(rbox(1.55, 0.5, 2.3, 0.25, 4), body, 0, 0.95, -0.15));
  car.add(M(rbox(1.58, 0.36, 2.0, 0.16, 3), glassM, 0, 0.98, -0.15));
  [[-1, 1.35], [1, 1.35], [-1, -1.35], [1, -1.35]].forEach(([s, z]) => { const w = M(new THREE.CylinderGeometry(0.34, 0.34, 0.26, 20), toon('#1d1c24'), s * 0.82, 0.34, z, 0, 0, Math.PI / 2); car.add(w); car.add(M(new THREE.CylinderGeometry(0.16, 0.16, 0.28, 16), chrome, s * 0.83, 0.34, z, 0, 0, Math.PI / 2)); });
  [-0.6, 0.6].forEach(x => { car.add(M(sphere(0.11, 12, 8), basic({ color: '#fff6d0' }), x, 0.58, -2.08)); car.add(M(sphere(0.09, 12, 8), basic({ color: '#ff6f7a' }), x, 0.6, 2.08)); });
  car.add(M(rbox(1.2, 0.08, 0.06, 0.03), chrome, 0, 0.42, -2.1));
  { const ms = []; car.traverse(o => { if (o.isMesh && o.material.type !== 'MeshBasicMaterial') ms.push(o); }); ms.forEach(o => addOutline(o)); }
  scene.add(car); objects.blackCar = car;
  const carShadow = blobAt(2.4, 4.8, 0.7, X1 + 5.9, 0); scene.add(carShadow);

  // ---------- lights ----------
  const hemi = new THREE.HemisphereLight('#fff4ee', '#f7d2c6', 1.8); scene.add(hemi);
  const sun = new THREE.DirectionalLight('#ffe6c4', 2.4);
  sun.position.set(X1 + 4.5, 10, 0.5); sun.target.position.set(-0.5, 0, -1.4); scene.add(sun, sun.target);
  sun.castShadow = true; sun.shadow.mapSize.set(2048, 2048); Object.assign(sun.shadow.camera, { left: -7, right: 7, top: 7, bottom: -7, near: 1, far: 26 }); sun.shadow.bias = -0.0004; sun.shadow.normalBias = 0.03; sun.shadow.radius = 3;
  const fill = new THREE.PointLight('#ffe2d6', 0, 9, 1.0); fill.position.set(-1.5, 2.6, 2.2); scene.add(fill);

  function setMood(m) {
    const night = m === 'night';
    scene.background = new THREE.Color(night ? '#2c2f66' : '#bfe6ff');
    facade.material.map = facadeTex(night); facade.material.needsUpdate = true;
    hemi.color.set(night ? '#9aa0e0' : '#fff4ee'); hemi.groundColor.set(night ? '#5a4a78' : '#f7d2c6'); hemi.intensity = night ? 0.8 : 1.45;
    sun.color.set(night ? '#9fb0ff' : '#ffe6c4'); sun.intensity = night ? 0.5 : 1.7;
    fill.intensity = night ? 0.25 : 0.3;
    lamps.forEach(l => l.set(true, night ? 1 : 0.15));
    streetGlows.forEach(g2 => { g2.visible = night; }); streetL.intensity = night ? 1.5 : 0;
  }
  function update(p, t, m) {
    const night = m === 'night';
    fl.update(t, p.fairyLights ?? true);
    // bell: props.doorBell = seconds since it rang (or false). Swing fades out.
    const bt = typeof p.doorBell === 'number' ? Math.max(0, p.doorBell) : -1;
    bell.rotation.x = bt >= 0 ? Math.sin(bt * 14) * 0.6 * Math.exp(-bt * 2.2) : 0;
    // cup: 0 on the saucer → 1 lifted up and to the side
    const k = smooth(clamp(p.adrianCup ?? 0));
    cupG.position.set(0.0 + k * 0.04, 0.012 + k * 0.13, -k * 0.05); cupG.rotation.z = -k * 0.25;
    saucer.position.set(0, 0, 0); cup.position.set(AX - 0.05 + k * 0.16, 0.782, AZ + 0.08 - k * 0.06);
    cup.visible = p.adrianCup !== false;
    // napkin: 0 folded → 1 open; note texture on the inside
    const n = smooth(clamp(p.napkinOpen ?? 0));
    hinge.rotation.x = -n * Math.PI * 0.97;
    napNote.visible = n > 0.5; napNote.material.opacity = smooth((n - 0.5) * 2);
    if (p.napkinNote instanceof HTMLCanvasElement) { const tx = texFromCanvas(p.napkinNote); if (napNote.material.map !== tx) { napNote.material.map = tx; napNote.material.needsUpdate = true; } }
    nap.visible = p.napkinNote !== false;
    // cash fan (0..10 bills); fanned when there are many
    const c = clamp(Math.round(p.cashStack ?? 0), 0, 10), spread = c > 1 ? 1.0 : 0;
    bills.forEach((b, i) => { b.visible = i < c; const a = (i - (c - 1) / 2) * 0.13 * spread; b.position.set(Math.sin(a) * 0.06, 0.0012 * i, -Math.cos(a) * 0.06 + 0.06); b.rotation.y = a; });
    // tip jar fill
    const tf = clamp(p.tipJar ?? 0.2); tipCash.scale.y = Math.max(0.001, tf * 0.14); tipCash.position.y = 0.006 + tf * 0.07; tipCash.visible = tf > 0.01;
    // black car: 0 = far right of the window view (behind), 1 = gone to the left; drives along -z
    const cp = p.blackCar === undefined || p.blackCar === false ? -1 : clamp(p.blackCar);
    car.visible = cp >= 0; carShadow.visible = cp >= 0;
    const cz = lerp(9, -14, Math.max(0, cp)); car.position.z = cz; carShadow.position.z = cz;
  }
  function look(m) {
    return m === 'night'
      ? { tint: [0.95, 0.94, 1.04], lift: [0.0, 0.0, 0.03], glow: 0.45, vig: 0.55, vigCol: [0.42, 0.38, 0.62], sat: 1.02 }
      : { tint: [1.02, 1.0, 0.98], lift: [0.02, 0.012, 0.015], glow: 0.3, vig: 0.35, vigCol: [0.86, 0.64, 0.64], sat: 1.05 };
  }

  const presets = {
    'cafe-wide': { from: { p: [-2.6, 1.95, 3.7], at: [1.9, 0.6, -2.3], fov: 56 }, to: { p: [-2.42, 1.93, 3.55], at: [1.95, 0.6, -2.3] }, mia: { sx: 0.5, d: 2.1 }, blur: 0.65 },
    'cafe-counter': { from: { p: [-1.25, 1.55, 0.2], at: [-2.05, 1.25, -3.4], fov: 50 }, to: { p: [-1.4, 1.52, -0.05], at: [-2.1, 1.25, -3.4] }, mia: [-1.85, 1.45, -2.88], front: true },
    'cafe-corner': { from: { p: [1.15, 1.45, -0.25], at: [2.72, 0.9, -2.5], fov: 46 }, to: { p: [1.4, 1.4, -0.55], at: [2.72, 0.88, -2.5] }, mia: { sx: 0.22, d: 1.9 }, focus: [2.7, 0.85, -2.5] },
    'cafe-table-close': { from: { p: [2.22, 1.42, -1.68], at: [2.72, 0.78, -2.4], fov: 42 }, to: { p: [2.31, 1.34, -1.82], at: [2.72, 0.78, -2.4] }, mia: { sx: 0.2, d: 3.0 }, focus: [2.67, 0.79, -2.47], props: {} },
    'cafe-window-street': { from: { p: [1.55, 1.5, -1.45], at: [9, 1.45, -1.5], fov: 56 }, to: { p: [1.75, 1.48, -1.5], at: [9, 1.45, -1.6] }, mia: { sx: 0.22, d: 2.2 }, focus: [X1 + 5.9, 1, -1.5] },
  };
  const spots = { adrianChair: [AX - 0.08, 1.3, AZ + 0.68], adrianFace: [AX - 0.05, 1.42, AZ + 0.6], counter: [-1.85, 1.45, -2.88], tableA: [-0.8, 1.2, -0.3], tableB: [-2.4, 1.2, 0.9], tableC: [0.9, 1.2, 1.3], door: [X1 - 0.6, 1.5, 1.3], aisle: [0.2, 1.45, 0.4] };
  setMood('day');
  return { presets, setMood, update, look, objects, spots, defaults: {} };
}
