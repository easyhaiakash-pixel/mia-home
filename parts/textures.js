// textures.js: every painted picture in the flat (wood, wallpaper, rugs, sheets, window views, the wedding photo...).
// All painted by code on small canvases. No downloads. No Math.random (R(i) only).
import { paint, rr2, heart2, star2, R, OUTLINE } from './kit.js';

const OL = OUTLINE;
const T = {};
const once = (k, f) => T[k] ||= f();

export const floorTex = () => once('floor', () => paint(512, 512, (g, w, h) => {
  const cols = ['#f3cfa6', '#efc59a', '#f6d6b0', '#ecc095'];
  for (let r = 0; r < 8; r++) {
    const y = r * 64, off = (r % 2) * 180 + R(r) * 80;
    for (let k = -1; k < 3; k++) {
      const x = off + k * 256; g.fillStyle = cols[(r + k + 4) % 4]; g.fillRect(x, y, 256, 64);
      g.strokeStyle = 'rgba(160,100,70,0.12)'; g.lineWidth = 2;
      for (let s = 0; s < 3; s++) { g.beginPath(); const yy = y + 14 + s * 16 + R(r * 7 + k + s) * 6; g.moveTo(x + 10, yy); g.bezierCurveTo(x + 90, yy - 4, x + 160, yy + 5, x + 246, yy); g.stroke(); }
      g.fillStyle = 'rgba(140,80,60,0.28)'; g.fillRect(x, y, 3, 64);
    }
    g.fillStyle = 'rgba(140,80,60,0.25)'; g.fillRect(0, y, w, 3);
    g.fillStyle = 'rgba(255,255,255,0.18)'; g.fillRect(0, y + 3, w, 3);
  }
}, { repeat: [3, 3] }));

// wallpaper: warm peach with tiny white stars and dots (like the One Life nursery)
export const wallTex = (base = '#ffe7d9', dot = '#ffcdb8', key = 'wall') => once(key, () => paint(256, 256, (g, w, h) => {
  g.fillStyle = base; g.fillRect(0, 0, w, h);
  for (let r = 0; r < 4; r++) for (let c = 0; c < 4; c++) {
    const x = 32 + c * 64 + (r % 2) * 32, y = 32 + r * 64;
    if ((r + c) % 3 === 0) { star2(g, x, y, 9); g.fillStyle = 'rgba(255,255,255,0.85)'; g.fill(); }
    else { g.beginPath(); g.arc(x, y, 4, 0, 7); g.fillStyle = dot; g.fill(); }
  }
}, { repeat: [6, 3] }));

export const wainscotTex = (base = '#cfeedd', key = 'wains') => once(key, () => paint(256, 128, (g, w, h) => {
  g.fillStyle = base; g.fillRect(0, 0, w, h);
  g.strokeStyle = 'rgba(255,255,255,0.75)'; g.lineWidth = 6; rr2(g, 22, 18, 212, 92, 14); g.stroke();
  g.strokeStyle = 'rgba(80,140,120,0.18)'; g.lineWidth = 3; rr2(g, 26, 22, 204, 86, 12); g.stroke();
}, { repeat: [10, 1] }));

export const woodTex = (base = '#e7b98c', key = 'wood') => once(key, () => paint(256, 256, (g, w, h) => {
  g.fillStyle = base; g.fillRect(0, 0, w, h);
  for (let i = 0; i < 14; i++) { g.strokeStyle = `rgba(150,90,60,${0.07 + R(i) * 0.08})`; g.lineWidth = 2 + R(i + 9) * 2; g.beginPath(); const y = i * 19 + R(i) * 8; g.moveTo(0, y); g.bezierCurveTo(80, y + 6, 170, y - 6, 256, y + 3); g.stroke(); }
}));

// round pink rug with a dashed white ring (One Life ref)
export const rugRoundTex = () => once('rugRound', () => paint(512, 512, (g) => {
  g.fillStyle = '#f9b9c8'; g.beginPath(); g.arc(256, 256, 252, 0, 7); g.fill();
  g.fillStyle = '#fcd0da'; g.beginPath(); g.arc(256, 256, 200, 0, 7); g.fill();
  g.setLineDash([22, 16]); g.lineWidth = 8; g.strokeStyle = '#fff'; g.beginPath(); g.arc(256, 256, 226, 0, 7); g.stroke(); g.setLineDash([]);
  for (let i = 0; i < 10; i++) { const a = i / 10 * Math.PI * 2; heart2(g, 256 + Math.cos(a) * 150, 256 + Math.sin(a) * 150, 13); g.fillStyle = 'rgba(255,255,255,0.75)'; g.fill(); }
  g.beginPath(); g.arc(256, 256, 70, 0, 7); g.fillStyle = 'rgba(255,255,255,0.35)'; g.fill();
}));
// long hall runner / bedroom rug
export const rugStripeTex = (a = '#bfe3f2', b = '#fff6ec', key = 'rugStripe') => once(key, () => paint(256, 512, (g, w, h) => {
  g.fillStyle = b; g.fillRect(0, 0, w, h);
  for (let y = 0; y < h; y += 64) { g.fillStyle = a; g.fillRect(0, y + 8, w, 26); }
  g.strokeStyle = 'rgba(255,255,255,0.9)'; g.setLineDash([14, 10]); g.lineWidth = 5; rr2(g, 14, 14, w - 28, h - 28, 20); g.stroke(); g.setLineDash([]);
  for (let i = 0; i < 6; i++) { g.fillStyle = '#ffb3c6'; heart2(g, w / 2, 50 + i * 84, 10); g.fill(); }
}));

// bed sheets: pink + cream gingham with little hearts
export const duvetTex = () => once('duvet', () => paint(512, 512, (g, w, h) => {
  g.fillStyle = '#fff1ec'; g.fillRect(0, 0, w, h);
  g.fillStyle = 'rgba(255,170,190,0.30)'; for (let i = 0; i < 8; i++) { g.fillRect(i * 64 + 16, 0, 32, h); g.fillRect(0, i * 64 + 16, w, 32); }
  for (let r = 0; r < 8; r++) for (let c = 0; c < 8; c++) if ((r + c) % 2 === 0) { heart2(g, c * 64 + 32, r * 64 + 32, 9); g.fillStyle = '#ff9fb8'; g.fill(); }
}));
export const throwTex = () => once('throw', () => paint(256, 256, (g, w, h) => {
  g.fillStyle = '#fff3df'; g.fillRect(0, 0, w, h);
  [['#ffc9d6', 20], ['#ffe08f', 80], ['#ffc9d6', 140], ['#b9e6d3', 200]].forEach(([c, y]) => { g.fillStyle = c; g.fillRect(0, y, w, 22); });
  g.strokeStyle = 'rgba(160,110,90,0.25)'; g.lineWidth = 2; for (let x = 4; x < w; x += 8) { g.beginPath(); g.moveTo(x, 0); g.lineTo(x, h); g.stroke(); }
}));
export const cushionTex = (base, deco, key) => once(key, () => paint(256, 256, (g, w, h) => {
  g.fillStyle = base; g.fillRect(0, 0, w, h);
  heart2(g, 128, 128, 46); g.fillStyle = deco; g.fill();
  for (let i = 0; i < 6; i++) { star2(g, 30 + R(i) * 200, 30 + R(i + 20) * 200, 8); g.fillStyle = 'rgba(255,255,255,0.8)'; g.fill(); }
}));

// the window view: city at night or a soft day sky
export function windowView(mood) {
  return once('view' + mood, () => paint(512, 512, (g, w, h) => {
    const night = mood === 'night';
    const sky = g.createLinearGradient(0, 0, 0, h);
    if (night) { sky.addColorStop(0, '#2a3270'); sky.addColorStop(0.55, '#5a5fa8'); sky.addColorStop(1, '#a487c4'); }
    else { sky.addColorStop(0, '#9fd8ff'); sky.addColorStop(0.6, '#cdeeff'); sky.addColorStop(1, '#ffe6d6'); }
    g.fillStyle = sky; g.fillRect(0, 0, w, h);
    if (night) {
      for (let i = 0; i < 40; i++) { const x = R(i) * w, y = R(i + 50) * h * 0.5, s = 2 + R(i + 9) * 4; star2(g, x, y, s); g.fillStyle = 'rgba(255,250,220,0.9)'; g.fill(); }
      g.beginPath(); g.arc(380, 90, 34, 0, 7); g.fillStyle = '#fff4c8'; g.fill(); g.beginPath(); g.arc(394, 82, 30, 0, 7); g.fillStyle = '#2f3876'; g.fill();
    } else {
      [[110, 110, 50], [360, 70, 40], [280, 170, 34]].forEach(([x, y, s]) => { g.fillStyle = 'rgba(255,255,255,0.95)'; g.beginPath(); g.arc(x - s * 0.7, y, s * 0.5, 0, 7); g.arc(x - s * 0.15, y - s * 0.38, s * 0.6, 0, 7); g.arc(x + s * 0.55, y - s * 0.05, s * 0.5, 0, 7); g.rect(x - s * 0.7, y - 4, s * 1.3, s * 0.5); g.fill(); });
    }
    // two rows of rounded buildings
    for (let row = 0; row < 2; row++) {
      let x = -20 + row * 40;
      for (let i = 0; x < w; i++) {
        const k = row * 50 + i, bw = 60 + R(k) * 60, bh = (row ? 170 : 250) + R(k + 3) * 110, y = h - bh;
        const c = night ? (row ? ['#3d3f7e', '#45438a', '#4b4790'] : ['#575aa0', '#605fae', '#6a62b0'])[i % 3] : (row ? ['#ffd6c9', '#d7ecff', '#ffe9b8'] : ['#ffc2cf', '#c9e8dc', '#e6d6ff'])[i % 3];
        rr2(g, x, y, bw, bh + 20, 12); g.fillStyle = c; g.fill(); g.lineWidth = 3; g.strokeStyle = night ? 'rgba(20,20,60,0.5)' : 'rgba(107,64,70,0.35)'; g.stroke();
        for (let wy = y + 16; wy < h - 10; wy += 26) for (let wx = x + 10; wx < x + bw - 16; wx += 20) {
          const on = R(k * 31 + wx * 0.7 + wy * 1.3) > (night ? 0.45 : 2);
          rr2(g, wx, wy, 11, 14, 3); g.fillStyle = night ? (on ? (R(wx + wy) > 0.5 ? '#ffd27a' : '#ffb98a') : 'rgba(30,30,70,0.6)') : 'rgba(255,255,255,0.7)'; g.fill();
        }
        x += bw + 6;
      }
    }
  }));
}

// wedding photo: Mia (from mia.js) + Ryan, drawn simply, happy, hearts
export const weddingTex = () => once('wedding', () => paint(512, 640, (g, w, h) => {
  const bg = g.createLinearGradient(0, 0, 0, h); bg.addColorStop(0, '#ffe3ec'); bg.addColorStop(1, '#ffd0c2'); g.fillStyle = bg; g.fillRect(0, 0, w, h);
  for (let i = 0; i < 14; i++) { heart2(g, R(i) * w, R(i + 3) * h * 0.6, 8 + R(i + 7) * 10); g.fillStyle = 'rgba(255,255,255,0.7)'; g.fill(); }
  // arch of flowers
  for (let i = 0; i <= 16; i++) { const a = Math.PI + i / 16 * Math.PI, x = 256 + Math.cos(a) * 210, y = 380 + Math.sin(a) * 260; g.beginPath(); g.arc(x, y, 18, 0, 7); g.fillStyle = ['#ff9fb8', '#fff', '#ffd27a'][i % 3]; g.fill(); g.lineWidth = 3; g.strokeStyle = OL; g.stroke(); }
  // Ryan (simple: neat hair, smile, dark suit)
  const rx = 330, ry = 330;
  g.lineWidth = 6; g.strokeStyle = OL; g.lineJoin = 'round';
  g.beginPath(); g.moveTo(rx - 95, h); g.quadraticCurveTo(rx - 90, ry + 120, rx, ry + 105); g.quadraticCurveTo(rx + 90, ry + 120, rx + 95, h); g.closePath(); g.fillStyle = '#3f4f80'; g.fill(); g.stroke();
  g.beginPath(); g.moveTo(rx - 22, ry + 108); g.lineTo(rx, ry + 170); g.lineTo(rx + 22, ry + 108); g.closePath(); g.fillStyle = '#fff'; g.fill(); g.stroke();
  g.beginPath(); g.moveTo(rx - 12, ry + 122); g.lineTo(rx + 12, ry + 122); g.lineTo(rx, ry + 136); g.closePath(); g.fillStyle = '#e0647a'; g.fill();
  g.beginPath(); g.ellipse(rx, ry, 86, 92, 0, 0, 7); g.fillStyle = '#ffe6d6'; g.fill(); g.stroke();
  g.beginPath(); g.ellipse(rx, ry - 52, 92, 52, 0, Math.PI, 0); g.quadraticCurveTo(rx + 60, ry - 50, rx - 10, ry - 62); g.quadraticCurveTo(rx - 70, ry - 40, rx - 92, ry - 52); g.closePath(); g.fillStyle = '#4a3226'; g.fill(); g.stroke();
  g.lineWidth = 7; [-1, 1].forEach(d => { g.beginPath(); g.arc(rx + d * 32, ry + 12, 14, Math.PI * 1.1, Math.PI * 1.9); g.stroke(); });
  g.beginPath(); g.arc(rx, ry + 38, 20, 0.15 * Math.PI, 0.85 * Math.PI); g.stroke();
  [-1, 1].forEach(d => { g.beginPath(); g.arc(rx + d * 54, ry + 38, 14, 0, 7); g.fillStyle = 'rgba(255,135,155,0.4)'; g.fill(); });
  // Mia (her own drawing code, happy, with a little veil)
  if (window.drawMia) {
    g.save();
    g.beginPath(); g.moveTo(80, 220); g.quadraticCurveTo(40, 450, 60, h); g.lineTo(260, h); g.quadraticCurveTo(250, 420, 230, 220); g.closePath(); g.fillStyle = 'rgba(255,255,255,0.75)'; g.fill(); g.lineWidth = 4; g.strokeStyle = 'rgba(107,64,70,0.5)'; g.stroke();
    window.drawMia(g, 180, 350, 0.62, { mood: 'happy', top: '#ffffff' });
    g.restore();
  } else { g.beginPath(); g.arc(180, 350, 90, 0, 7); g.fillStyle = '#ffe6d6'; g.fill(); }
  heart2(g, 256, 250, 26); g.fillStyle = '#ff6f91'; g.fill(); g.lineWidth = 4; g.strokeStyle = OL; g.stroke();
}));

export const bookTex = () => once('books', () => paint(512, 128, (g, w, h) => {
  g.fillStyle = 'rgba(0,0,0,0)'; g.clearRect(0, 0, w, h);
  let x = 0; const cs = ['#ff9fb8', '#ffd27a', '#9fd3c7', '#c7b3f0', '#8fc8ff', '#ffb38a', '#f6f0e6'];
  for (let i = 0; x < w; i++) {
    const bw = 22 + R(i) * 22, bh = 80 + R(i + 5) * 46; rr2(g, x, h - bh, bw, bh, 5); g.fillStyle = cs[i % cs.length]; g.fill(); g.lineWidth = 3; g.strokeStyle = OL; g.stroke();
    g.fillStyle = 'rgba(255,255,255,0.6)'; g.fillRect(x + 4, h - bh + 14, bw - 8, 5); g.fillRect(x + 4, h - 22, bw - 8, 5); x += bw + 2;
  }
}));

export const tileTex = () => once('tiles', () => paint(256, 256, (g, w, h) => {
  g.fillStyle = '#fff8f0'; g.fillRect(0, 0, w, h);
  for (let r = 0; r < 4; r++) for (let c = 0; c < 4; c++) { rr2(g, c * 64 + 3, r * 64 + 3, 58, 58, 10); g.fillStyle = (r + c) % 2 ? '#ffe9ef' : '#e4f6ef'; g.fill(); g.lineWidth = 2; g.strokeStyle = 'rgba(107,64,70,0.18)'; g.stroke(); }
}, { repeat: [6, 2] }));

// fridge door: photos + magnets + a little drawing (transparent canvas)
export const fridgeDecal = () => once('fridge', () => paint(256, 512, (g, w, h) => {
  g.clearRect(0, 0, w, h);
  const pics = [[30, 40, 90, 110, -0.12, '#ffd0dc'], [140, 60, 86, 100, 0.1, '#cdeeff'], [60, 200, 100, 80, 0.05, '#fff1b8']];
  pics.forEach(([x, y, pw, ph, a, c], i) => {
    g.save(); g.translate(x + pw / 2, y + ph / 2); g.rotate(a);
    g.fillStyle = '#fff'; g.fillRect(-pw / 2, -ph / 2, pw, ph); g.lineWidth = 3; g.strokeStyle = OL; g.strokeRect(-pw / 2, -ph / 2, pw, ph);
    g.fillStyle = c; g.fillRect(-pw / 2 + 8, -ph / 2 + 8, pw - 16, ph - 28);
    g.fillStyle = '#ffe3d3'; g.beginPath(); g.arc(-10, -6, 12, 0, 7); g.arc(14, -4, 11, 0, 7); g.fill(); g.strokeStyle = OL; g.lineWidth = 2; g.stroke();
    heart2(g, 2, -26, 7); g.fillStyle = '#ff6f91'; g.fill();
    g.restore();
    g.beginPath(); g.arc(x + pw / 2, y - 2, 9, 0, 7); g.fillStyle = ['#ff6f91', '#7ec8ff', '#ffc94d'][i]; g.fill(); g.lineWidth = 3; g.strokeStyle = OL; g.stroke();
  });
  // magnets: heart, star, flower
  heart2(g, 200, 220, 16); g.fillStyle = '#ff8fab'; g.fill(); g.lineWidth = 3; g.strokeStyle = OL; g.stroke();
  star2(g, 52, 330, 18); g.fillStyle = '#ffd25e'; g.fill(); g.stroke();
  // shopping note
  g.save(); g.translate(170, 360); g.rotate(-0.06); g.fillStyle = '#fff7c9'; g.fillRect(-46, -50, 92, 100); g.strokeStyle = OL; g.lineWidth = 3; g.strokeRect(-46, -50, 92, 100);
  g.strokeStyle = 'rgba(107,64,70,0.6)'; g.lineWidth = 3; for (let i = 0; i < 4; i++) { g.beginPath(); g.moveTo(-34, -28 + i * 20); g.lineTo(18 + R(i) * 14, -28 + i * 20); g.stroke(); } g.restore();
}));

export const tvTex = (on) => once('tv' + on, () => paint(256, 160, (g, w, h) => {
  if (!on) { const gr = g.createLinearGradient(0, 0, w, h); gr.addColorStop(0, '#3a3550'); gr.addColorStop(0.5, '#2a2640'); gr.addColorStop(1, '#3d3654'); g.fillStyle = gr; g.fillRect(0, 0, w, h); g.fillStyle = 'rgba(255,255,255,0.08)'; g.beginPath(); g.moveTo(20, 0); g.lineTo(90, 0); g.lineTo(40, h); g.lineTo(-30, h); g.fill(); return; }
  const gr = g.createLinearGradient(0, 0, 0, h); gr.addColorStop(0, '#9fd8ff'); gr.addColorStop(1, '#c9f0ff'); g.fillStyle = gr; g.fillRect(0, 0, w, h);
  g.fillStyle = '#a8e6b8'; g.beginPath(); g.ellipse(70, h + 30, 140, 80, 0, 0, 7); g.fill(); g.fillStyle = '#8fd8a5'; g.beginPath(); g.ellipse(210, h + 40, 120, 80, 0, 0, 7); g.fill();
  g.fillStyle = '#fff'; g.beginPath(); g.arc(70, 40, 16, 0, 7); g.arc(90, 34, 20, 0, 7); g.arc(112, 42, 15, 0, 7); g.fill();
  g.fillStyle = '#ffe07a'; g.beginPath(); g.arc(200, 38, 18, 0, 7); g.fill();
}));

export const clockTex = () => once('clock', () => paint(256, 256, (g) => {
  g.fillStyle = '#fffaf2'; g.beginPath(); g.arc(128, 128, 124, 0, 7); g.fill();
  for (let i = 0; i < 12; i++) { const a = i / 12 * Math.PI * 2; g.beginPath(); g.arc(128 + Math.cos(a) * 96, 128 + Math.sin(a) * 96, i % 3 ? 5 : 9, 0, 7); g.fillStyle = i % 3 ? '#e6b7a6' : '#ff8fab'; g.fill(); }
  g.strokeStyle = OL; g.lineCap = 'round'; g.lineWidth = 10; g.beginPath(); g.moveTo(128, 128); g.lineTo(128 + 50, 128 - 20); g.stroke();
  g.lineWidth = 7; g.beginPath(); g.moveTo(128, 128); g.lineTo(128 - 18, 128 - 78); g.stroke();
  g.beginPath(); g.arc(128, 128, 10, 0, 7); g.fillStyle = OL; g.fill();
}));

// little framed art for walls: a cloud, a heart, a sun
export const artTex = (kind) => once('art' + kind, () => paint(256, 320, (g, w, h) => {
  const bgs = { cloud: '#cfeaff', heart: '#ffe1ea', sun: '#fff1c4', leaf: '#d8f2e3' };
  g.fillStyle = bgs[kind]; g.fillRect(0, 0, w, h);
  g.lineWidth = 6; g.strokeStyle = OL; g.lineJoin = 'round';
  if (kind === 'cloud') { g.fillStyle = '#fff'; g.beginPath(); g.arc(90, 170, 40, 0, 7); g.arc(140, 140, 52, 0, 7); g.arc(180, 175, 38, 0, 7); g.fill(); g.beginPath(); g.arc(120, 222, 9, 0, 7); g.arc(160, 236, 9, 0, 7); g.fillStyle = '#8fc8ff'; g.fill(); }
  if (kind === 'heart') { heart2(g, 128, 170, 60); g.fillStyle = '#ff8fab'; g.fill(); g.stroke(); star2(g, 70, 80, 14); g.fillStyle = '#fff'; g.fill(); }
  if (kind === 'sun') { for (let i = 0; i < 10; i++) { const a = i / 10 * Math.PI * 2; g.beginPath(); g.moveTo(128 + Math.cos(a) * 64, 160 + Math.sin(a) * 64); g.lineTo(128 + Math.cos(a) * 92, 160 + Math.sin(a) * 92); g.strokeStyle = '#ffb84d'; g.lineWidth = 10; g.stroke(); } g.beginPath(); g.arc(128, 160, 52, 0, 7); g.fillStyle = '#ffcf4d'; g.fill(); g.strokeStyle = OL; g.lineWidth = 6; g.stroke(); }
  if (kind === 'leaf') { g.beginPath(); g.ellipse(128, 160, 50, 96, 0.4, 0, 7); g.fillStyle = '#8fd3a8'; g.fill(); g.stroke(); g.beginPath(); g.moveTo(90, 250); g.quadraticCurveTo(128, 160, 170, 70); g.stroke(); }
}));

export const doormatTex = () => once('mat', () => paint(256, 160, (g, w, h) => {
  rr2(g, 4, 4, w - 8, h - 8, 26); g.fillStyle = '#e9b97f'; g.fill(); g.lineWidth = 6; g.strokeStyle = '#c98f55'; g.stroke();
  g.font = 'bold 54px sans-serif'; g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillStyle = '#8a4f3a'; g.fillText('HOME', 128, 84);
  heart2(g, 40, 80, 14); g.fillStyle = '#ff8fab'; g.fill(); heart2(g, 216, 80, 14); g.fill();
}));

export const mirrorTex = (mood) => once('mirror' + mood, () => paint(256, 256, (g, w, h) => {
  const gr = g.createLinearGradient(0, 0, w, h);
  if (mood === 'night') { gr.addColorStop(0, '#9fa8d8'); gr.addColorStop(1, '#6f78b8'); } else { gr.addColorStop(0, '#e9f6ff'); gr.addColorStop(1, '#bfe0f5'); }
  g.fillStyle = gr; g.fillRect(0, 0, w, h);
  g.fillStyle = 'rgba(255,255,255,0.55)'; g.beginPath(); g.moveTo(40, 200); g.lineTo(120, 40); g.lineTo(150, 40); g.lineTo(70, 200); g.fill();
  g.beginPath(); g.moveTo(100, 220); g.lineTo(170, 80); g.lineTo(184, 80); g.lineTo(114, 220); g.fill();
}));

export const bathSignTex = () => once('bathSign', () => paint(256, 256, (g) => {
  rr2(g, 8, 8, 240, 240, 60); g.fillStyle = '#fff'; g.fill(); g.lineWidth = 8; g.strokeStyle = OL; g.stroke();
  // little bathtub with bubbles
  g.beginPath(); g.moveTo(52, 130); g.lineTo(204, 130); g.quadraticCurveTo(200, 196, 128, 196); g.quadraticCurveTo(56, 196, 52, 130); g.closePath(); g.fillStyle = '#8fd0ff'; g.fill(); g.lineWidth = 7; g.stroke();
  [[90, 108, 18], [124, 96, 22], [160, 110, 16], [140, 70, 10]].forEach(([x, y, r]) => { g.beginPath(); g.arc(x, y, r, 0, 7); g.fillStyle = '#e8f6ff'; g.fill(); g.lineWidth = 4; g.stroke(); });
}));

// default phone screen (locked screen: wallpaper + clock); films pass their own canvas instead
export const phoneDefaultTex = () => once('phone', () => paint(256, 512, (g, w, h) => {
  const gr = g.createLinearGradient(0, 0, 0, h); gr.addColorStop(0, '#2c3a7a'); gr.addColorStop(1, '#8a5fb0'); g.fillStyle = gr; g.fillRect(0, 0, w, h);
  g.fillStyle = '#fff'; g.font = 'bold 72px sans-serif'; g.textAlign = 'center'; g.fillText('11:47', 128, 150);
  g.font = '22px sans-serif'; g.fillText('Thursday', 128, 186);
  rr2(g, 20, 250, 216, 74, 18); g.fillStyle = 'rgba(255,255,255,0.88)'; g.fill();
  g.fillStyle = '#333'; g.textAlign = 'left'; g.font = 'bold 22px sans-serif'; g.fillText('C 💋', 36, 280); g.font = '20px sans-serif'; g.fillText('Miss you already ❤️', 36, 308);
}));
