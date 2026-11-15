// mia-body.js: full-body Mia for the interactive site. Her head + shoulders are her official drawing (window.drawMia
// from vendor/mia.js); this adds the body, arms, skirt, legs and shoes, with poses: stand, walk, sit, wave, talk, think,
// shrug, carry (tray), phone, lie (sleep). Units: same as drawMia (face centre = 0,0; head ~320 wide).
// Feet are at y = FEET_Y when standing. Pure drawing: same inputs = same picture.
export const FEET_Y = 735;
export const TOP_Y = -215;
const OL = '#6b4046';
const SKIN = '#ffe6d6', SKIN2 = '#ffd8c4';

function fin(g, fill, lw = 7) { if (fill) { g.fillStyle = fill; g.fill(); } if (lw) { g.lineWidth = lw; g.strokeStyle = OL; g.lineJoin = 'round'; g.lineCap = 'round'; g.stroke(); } }
function el(g, x, y, rx, ry, r = 0) { g.beginPath(); g.ellipse(x, y, Math.max(0.1, rx), Math.max(0.1, ry), r, 0, Math.PI * 2); }
function shade(hex, k) { const n = parseInt(hex.slice(1), 16); const f = v => Math.round(k < 0 ? v * (1 + k) : v + (255 - v) * k); return '#' + [n >> 16, (n >> 8) & 255, n & 255].map(v => Math.max(0, Math.min(255, f(v))).toString(16).padStart(2, '0')).join(''); }

// a limb = capsule from (x0,y0) to (x1,y1)
function limb(g, x0, y0, x1, y1, w, fill) {
  const a = Math.atan2(y1 - y0, x1 - x0), l = Math.hypot(x1 - x0, y1 - y0);
  g.save(); g.translate(x0, y0); g.rotate(a);
  g.beginPath(); g.roundRect(-w / 2, -w / 2, l + w, w, w / 2); fin(g, fill, 6); g.restore();
}
function arm(g, side, th, phi, o) {
  // upper arm angle th, forearm angle phi (0 = hanging down, + = out to this side / up)
  const sx = side * 168, sy = 262, L1 = 118, L2 = 104;
  const ex = sx + side * Math.sin(th) * L1, ey = sy + Math.cos(th) * L1;
  const hx = ex + side * Math.sin(phi) * L2, hy = ey + Math.cos(phi) * L2;
  limb(g, ex, ey, hx, hy, 46, SKIN);                          // forearm
  limb(g, sx, sy, ex, ey, 62, o.top);                         // sleeve
  el(g, sx + side * 4, sy + 6, 46, 40); fin(g, o.top, 6);      // puff
  g.strokeStyle = 'rgba(107,64,70,0.35)'; g.lineWidth = 3; g.beginPath(); g.moveTo(sx - 20, sy + 30); g.quadraticCurveTo(sx, sy + 40, sx + 20, sy + 30); g.stroke();
  el(g, hx, hy, 27, 27); fin(g, SKIN, 6);                      // hand
  return { hx, hy };
}

// o: { pose, phase (0..1 walk cycle), face, tear, top, skirt, apron, blink, breathe (0..1), hold: 'phone'|'tray'|'cup'|null }
export function drawMiaFull(g, x, y, s, o = {}) {
  const pose = o.pose || 'stand', top = o.top || '#ffc2d1', skirt = o.skirt || '#c9b6ec', ph = (o.phase || 0) * Math.PI * 2;
  const walk = pose === 'walk', sit = pose === 'sit';
  g.save(); g.translate(x, y); g.scale(s, s);
  const bob = walk ? -Math.abs(Math.sin(ph)) * 16 : (o.breathe ? Math.sin(o.breathe * Math.PI * 2) * 3 : 0);
  const lean = walk ? (o.dir || 0) * 0.05 : 0;
  g.translate(0, bob); g.rotate(lean);
  const opt = { top };

  // ---------- legs + shoes ----------
  const hipY = 520;
  const legs = [[-1, walk ? Math.sin(ph) : 0], [1, walk ? -Math.sin(ph) : 0]];
  legs.forEach(([side, sw]) => {
    const hx = side * 48;
    let fx = side * 56 + sw * 34, fy = sit ? 650 : FEET_Y - 30 - Math.max(0, -sw) * 26;
    if (sit) fx = side * 62 + Math.sin(ph * 0.5 + side) * 0;
    limb(g, hx, hipY, fx, fy, 62, SKIN);
    // sock
    g.save(); g.beginPath(); g.rect(fx - 40, fy - 36, 80, 40); g.clip(); limb(g, hx, hipY, fx, fy, 62, "#fff7f2"); g.restore();
    el(g, fx + side * 6, fy + 16, 44, 26); fin(g, '#ff8fab', 6);       // round shoe
    el(g, fx + side * 2, fy + 8, 16, 6); g.fillStyle = 'rgba(255,255,255,0.6)'; g.fill();
  });

  // ---------- back arm sway (drawn first for the arm swinging back) ----------
  // ---------- head + shoulders (her official drawing) ----------
  if (window.drawMia) window.drawMia(g, 0, 0, 1, { mood: o.face || 'neutral', tear: !!o.tear, top });
  // blink: lids over the eyes
  if (o.blink && o.face !== 'happy') {
    [-64, 64].forEach(ex => {
      el(g, ex, 44, 50, 58); g.fillStyle = '#ffeee4'; g.fill();
      g.strokeStyle = OL; g.lineWidth = 9; g.lineCap = 'round'; g.beginPath(); g.arc(ex, 30, 38, Math.PI * 0.2, Math.PI * 0.8); g.stroke();
    });
  }

  // ---------- lower body: blouse to the waist, skirt ----------
  g.beginPath(); g.moveTo(-197, 344); g.quadraticCurveTo(-170, 400, -122, 432); g.lineTo(122, 432); g.quadraticCurveTo(170, 400, 197, 344); g.closePath();
  g.fillStyle = shade(top, -0.1); g.fill();
  g.lineWidth = 7; g.strokeStyle = OL; g.lineJoin = 'round';
  g.beginPath(); g.moveTo(-198, 340); g.quadraticCurveTo(-170, 400, -122, 432); g.moveTo(198, 340); g.quadraticCurveTo(170, 400, 122, 432); g.stroke();
  // skirt (A-line, scalloped hem), swishes when walking
  const sw = walk ? Math.sin(ph) * 10 : 0, hem = sit ? 560 : 590;
  g.beginPath(); g.moveTo(-124, 420); g.lineTo(124, 420);
  g.quadraticCurveTo(160 + sw, 500, 186 + sw, hem);
  for (let i = 0; i < 6; i++) { const xa = 186 + sw - (i + 1) * (372 / 6); g.quadraticCurveTo(xa + 372 / 12, hem + 22, xa, hem); }
  g.quadraticCurveTo(-160 + sw, 500, -124, 420); g.closePath(); fin(g, skirt, 7);
  g.fillStyle = 'rgba(255,255,255,0.25)'; g.beginPath(); g.moveTo(-60, 440); g.quadraticCurveTo(-70, 520, -90, 570); g.lineTo(-70, 572); g.quadraticCurveTo(-48, 520, -44, 440); g.fill();
  // waist band + bow
  g.beginPath(); g.roundRect(-126, 410, 252, 28, 12); fin(g, shade(skirt, -0.12), 6);
  // apron (café)
  if (o.apron) {
    g.beginPath(); g.moveTo(-96, 300); g.lineTo(96, 300); g.lineTo(104, 430); g.quadraticCurveTo(128, 520, 120, 600); g.quadraticCurveTo(0, 620, -120, 600); g.quadraticCurveTo(-128, 520, -104, 430); g.closePath(); fin(g, '#ffffff', 6);
    g.beginPath(); g.roundRect(-58, 470, 116, 70, 14); fin(g, '#ffe1e8', 4);
    window.miaHeart && (window.miaHeart(g, 0, 380, 22), fin(g, '#ff6f91', 4));
    g.fillStyle = OL; g.font = 'bold 30px "Arial Rounded MT Bold", Arial'; g.textAlign = 'center'; g.fillText('Bloom', 0, 515);
  }

  // ---------- arms by pose ----------
  const w = Math.sin(ph), k1 = Math.sin((o.phase || 0) * Math.PI * 4), k2 = Math.sin((o.phase || 0) * Math.PI * 2);
  let L = [0.15, 0.08], Rr = [0.15, 0.08];   // [upper arm, forearm] angles for the left / right arm
  if (walk) { L = [0.15 + w * 0.3, 0.05 + w * 0.3]; Rr = [0.15 - w * 0.3, 0.05 - w * 0.3]; }
  if (pose === 'wave') Rr = [2.3, 2.95 + k1 * 0.3];
  if (pose === 'talk') { Rr = [0.5, 1.4 + k2 * 0.25]; L = [0.2, 0.1]; }
  if (pose === 'think') Rr = [0.35, -2.6];
  if (pose === 'shrug') { L = [0.9, 2.3]; Rr = [0.9, 2.3]; }
  if (pose === 'phone' || o.hold === 'phone') { L = [0.3, -2.0]; Rr = [0.3, -2.0]; }
  if (o.hold === 'tray') Rr = [0.5, 1.6];
  if (o.hold === 'cup' || o.hold === 'cash') Rr = [0.3, -1.5];
  if (sit && !o.hold) { L = [0.3, -1.0]; Rr = [0.3, -1.0]; }
  const handL = arm(g, -1, L[0], L[1], opt);
  const handR = arm(g, 1, Rr[0], Rr[1], opt);
  // held things
  if (o.hold === 'phone') { g.save(); g.translate((handL.hx + handR.hx) / 2, Math.min(handL.hy, handR.hy) - 10); g.rotate(-0.08); g.beginPath(); g.roundRect(-40, -70, 80, 140, 14); fin(g, '#ffb3c8', 6); g.beginPath(); g.roundRect(-32, -60, 64, 120, 8); g.fillStyle = '#cfe6ff'; g.fill(); g.restore(); }
  if (o.hold === 'tray') { g.save(); g.translate(handR.hx + 10, handR.hy - 18); g.beginPath(); g.ellipse(0, 0, 110, 24, 0, 0, Math.PI * 2); fin(g, '#e7b98c', 6); g.beginPath(); g.roundRect(-30, -64, 52, 56, 10); fin(g, '#ffffff', 6); g.beginPath(); g.ellipse(-4, -62, 24, 8, 0, 0, Math.PI * 2); g.fillStyle = '#3b2420'; g.fill(); g.restore(); }
  if (o.hold === 'cup') { g.save(); g.translate(handR.hx, handR.hy - 34); g.beginPath(); g.roundRect(-30, -40, 60, 64, 12); fin(g, '#ffffff', 6); g.restore(); }
  if (o.hold === 'cash') { g.save(); g.translate(handR.hx - 20, handR.hy - 30); for (let i = 0; i < 5; i++) { g.save(); g.rotate(-0.5 + i * 0.22); g.beginPath(); g.roundRect(-20, -90, 40, 96, 6); fin(g, '#cdeccf', 4); g.restore(); } g.restore(); }
  g.restore();
}

// lying down (sleeping): drawn as the standing drawing rotated by the actor; here only a helper for "zzz"
export function drawZzz(g, x, y, s, t) {
  g.save(); g.translate(x, y); g.scale(s, s);
  for (let i = 0; i < 3; i++) { const k = (t * 0.6 + i / 3) % 1; g.globalAlpha = Math.sin(k * Math.PI); g.font = `bold ${40 + i * 16}px "Arial Rounded MT Bold", Arial`; g.fillStyle = '#ffffff'; g.strokeStyle = OL; g.lineWidth = 6; g.strokeText('z', i * 46 + k * 30, -k * 140); g.fillText('z', i * 46 + k * 30, -k * 140); }
  g.restore();
}

// sleeping in bed: head on the pillow (eyes closed), the blanket over her. Anchor = blanket bottom centre at y = 0.
export function drawMiaSleep(g, x, y, s, o = {}) {
  g.save(); g.translate(x, y); g.scale(s, s);
  g.save(); g.translate(-20, -330); g.rotate(-0.22);
  if (window.drawMia) window.drawMia(g, 0, 0, 1, { mood: 'neutral', top: o.top || '#ffc2d1' });
  [-64, 64].forEach(ex => { el(g, ex, 44, 50, 58); g.fillStyle = '#ffeee4'; g.fill(); g.strokeStyle = OL; g.lineWidth = 9; g.lineCap = 'round'; g.beginPath(); g.arc(ex, 30, 38, Math.PI * 0.2, Math.PI * 0.8); g.stroke(); });
  g.restore();
  // blanket hump
  g.beginPath(); g.moveTo(-330, 0); g.quadraticCurveTo(-330, -230, -120, -250); g.quadraticCurveTo(80, -270, 200, -200); g.quadraticCurveTo(330, -150, 330, 0); g.closePath();
  const gr = g.createLinearGradient(0, -260, 0, 0); gr.addColorStop(0, '#fff1ec'); gr.addColorStop(1, '#ffd6e0'); g.fillStyle = gr; g.fill(); g.lineWidth = 8; g.strokeStyle = OL; g.stroke();
  for (let i = 0; i < 7; i++) { window.miaHeart && (window.miaHeart(g, -240 + i * 80, -120 + (i % 2) * 50, 14), g.fillStyle = '#ff9fb8', g.fill()); }
  g.beginPath(); g.moveTo(-300, -200); g.quadraticCurveTo(0, -150, 300, -170); g.lineWidth = 6; g.strokeStyle = 'rgba(107,64,70,0.4)'; g.stroke();
  g.restore();
}

// Adrian from behind, sitting: long black coat, neat dark hair. Anchor = seat (0,0). Face never shown.
export function drawAdrianBack(g, x, y, s, o = {}) {
  g.save(); g.translate(x, y); g.scale(s, s);
  // coat body (sitting: wide at the bottom)
  g.beginPath(); g.moveTo(-150, -520); g.quadraticCurveTo(-210, -500, -220, -380); g.lineTo(-240, 40); g.quadraticCurveTo(0, 70, 240, 40); g.lineTo(220, -380); g.quadraticCurveTo(210, -500, 150, -520); g.closePath();
  fin(g, '#2b2a36', 8);
  g.strokeStyle = 'rgba(255,255,255,0.12)'; g.lineWidth = 10; g.beginPath(); g.moveTo(0, -500); g.lineTo(0, 40); g.stroke();
  g.beginPath(); g.moveTo(-150, -260); g.quadraticCurveTo(0, -240, 150, -260); g.strokeStyle = 'rgba(0,0,0,0.25)'; g.lineWidth = 6; g.stroke();
  // collar
  g.beginPath(); g.moveTo(-110, -540); g.quadraticCurveTo(0, -500, 110, -540); g.lineTo(130, -480); g.quadraticCurveTo(0, -450, -130, -480); g.closePath(); fin(g, '#35343f', 7);
  // neck + back of head
  g.beginPath(); g.roundRect(-46, -600, 92, 80, 30); fin(g, '#ffd9c6', 6);
  el(g, 0, -720, 150, 160); fin(g, '#2a1d1a', 8);
  el(g, -150, -700, 22, 34); fin(g, '#ffd9c6', 6); el(g, 150, -700, 22, 34); fin(g, '#ffd9c6', 6);
  el(g, 0, -720, 150, 160); g.fillStyle = '#2a1d1a'; g.fill();
  g.strokeStyle = 'rgba(255,255,255,0.18)'; g.lineWidth = 14; g.beginPath(); g.arc(-10, -740, 110, Math.PI * 1.2, Math.PI * 1.55); g.stroke();
  g.strokeStyle = 'rgba(0,0,0,0.35)'; g.lineWidth = 4; [[-60, -840, -40, -600], [10, -870, 20, -590], [70, -840, 60, -600]].forEach(([a, b, c, d]) => { g.beginPath(); g.moveTo(a, b); g.quadraticCurveTo((a + c) / 2 - 10, (b + d) / 2, c, d); g.stroke(); });
  // arm on the table (one sleeve visible) + gold watch
  if (o.arm !== false) { g.beginPath(); g.roundRect(150, -300, 150, 70, 34); fin(g, '#2b2a36', 7); el(g, 310, -265, 30, 28); fin(g, '#ffd9c6', 6); g.beginPath(); g.roundRect(268, -290, 20, 52, 6); fin(g, '#f2c14e', 4); }
  g.restore();
}
