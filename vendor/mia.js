// MIA — main character of "Her Story, Your Choice" (2026-11-15, v2 "cuter").
// Code-drawn in the One Life cute style: pastel colours, thin warm-brown outlines, big glossy eyes, blush.
// drawMia(g, x, y, scale, opts) draws her head and shoulders. Face centre = (x, y). At scale 1 the head is ~320 px wide.
// opts: { mood: 'neutral' | 'happy' | 'sad' | 'teary' | 'angry' | 'shock', tear: bool, top: blouse colour, bow: bool (default true) }
(function () {
  'use strict';
  const TAU = Math.PI * 2;
  const MIA = {
    outline: '#6b4046',
    skin: ['#fff3ea', '#ffe0cf'],
    hair: ['#5e3729', '#33201b'],
    hairShine: 'rgba(255,225,210,0.38)',
    eyes: ['#2b1a17', '#5e3b2d', '#c28a5c'],
    mouth: '#e0647a',
    blush: 'rgba(255,135,155,0.5)',
    gold: '#f2c14e',
    bow: '#ff8fb4',
    top: '#ffc2d1',
  };
  window.MIA_COLORS = MIA;

  function drawMia(g, x, y, s, o = {}) {
    const OL = MIA.outline, mood = o.mood || 'neutral', showBow = o.bow !== false;
    const lin = (x0, y0, x1, y1, st) => { const gr = g.createLinearGradient(x0, y0, x1, y1); st.forEach(([k, c]) => gr.addColorStop(k, c)); return gr; };
    const fin = (fill, lw = 7) => { if (fill) { g.fillStyle = fill; g.fill(); } if (lw) { g.lineWidth = lw; g.strokeStyle = OL; g.lineJoin = 'round'; g.lineCap = 'round'; g.stroke(); } };
    const el = (cx, cy, rx, ry, r = 0) => { g.beginPath(); g.ellipse(cx, cy, Math.max(0.1, rx), Math.max(0.1, ry), r, 0, TAU); };
    g.save(); g.translate(x, y); g.scale(s, s);

    // ---- back hair (soft, falls past the shoulders, wavy ends) ----
    g.beginPath();
    g.moveTo(0, -200);
    g.bezierCurveTo(158, -204, 214, -104, 202, 14);
    g.bezierCurveTo(196, 112, 238, 172, 214, 252);
    g.bezierCurveTo(200, 304, 146, 318, 112, 288);
    g.bezierCurveTo(96, 208, 62, 176, 0, 174);
    g.bezierCurveTo(-62, 176, -96, 208, -112, 288);
    g.bezierCurveTo(-146, 318, -200, 304, -214, 252);
    g.bezierCurveTo(-238, 172, -196, 112, -202, 14);
    g.bezierCurveTo(-214, -104, -158, -204, 0, -200);
    g.closePath(); fin(lin(0, -200, 0, 310, [[0, MIA.hair[0]], [1, MIA.hair[1]]]));

    // ---- shoulders + blouse ----
    const top = o.top || MIA.top;
    g.beginPath(); g.moveTo(-40, 178); g.quadraticCurveTo(-170, 214, -198, 350); g.lineTo(198, 350); g.quadraticCurveTo(170, 214, 40, 178); g.closePath();
    fin(lin(0, 180, 0, 350, [[0, top], [1, shade(top, -0.1)]]));
    // round collar
    [-1, 1].forEach(d => { g.beginPath(); g.moveTo(0, 214); g.quadraticCurveTo(d * 40, 236, d * 74, 206); g.quadraticCurveTo(d * 70, 184, d * 38, 182); g.closePath(); fin('#fff', 6); });
    // neck
    g.beginPath(); g.moveTo(-32, 120); g.lineTo(-34, 186); g.quadraticCurveTo(0, 218, 34, 186); g.lineTo(32, 120); g.closePath(); fin(lin(0, 120, 0, 210, [[0, '#ffd6c3'], [1, MIA.skin[0]]]));
    g.beginPath(); g.moveTo(-32, 146); g.quadraticCurveTo(0, 168, 32, 146); g.lineTo(32, 128); g.lineTo(-32, 128); g.closePath(); g.fillStyle = 'rgba(214,140,120,0.3)'; g.fill();
    // gold heart necklace (her mark — every part)
    g.beginPath(); g.moveTo(-30, 176); g.quadraticCurveTo(0, 206, 30, 176); g.lineWidth = 3.5; g.strokeStyle = '#c99a2e'; g.stroke();
    heart(g, 0, 206, 12); fin(MIA.gold, 4);
    el(-4, 201, 3, 3); g.fillStyle = '#fff6d8'; g.fill();

    // ---- face: round, soft little chin ----
    g.beginPath();
    g.moveTo(-158, -24);
    g.bezierCurveTo(-162, 96, -82, 160, 0, 162);
    g.bezierCurveTo(82, 160, 162, 96, 158, -24);
    g.bezierCurveTo(156, -168, -156, -168, -158, -24);
    g.closePath(); fin(lin(-150, -160, 150, 162, [[0, MIA.skin[0]], [0.65, '#ffe9dc'], [1, MIA.skin[1]]]));

    // blush (big, soft, with little lines) — clipped to the face so it never stains the hair
    g.save();
    g.beginPath(); g.moveTo(-158, -24); g.bezierCurveTo(-162, 96, -82, 160, 0, 162); g.bezierCurveTo(82, 160, 162, 96, 158, -24); g.bezierCurveTo(156, -168, -156, -168, -158, -24); g.closePath(); g.clip();
    [[-98, 100], [98, 100]].forEach(([bx, by]) => { const gr = g.createRadialGradient(bx, by, 2, bx, by, 50); gr.addColorStop(0, MIA.blush); gr.addColorStop(1, 'rgba(255,135,155,0)'); g.fillStyle = gr; g.fillRect(bx - 55, by - 55, 110, 110); });
    if (mood !== 'angry') [[-98, 100], [98, 100]].forEach(([bx, by]) => { g.strokeStyle = 'rgba(214,90,110,0.55)'; g.lineWidth = 3.5; [-12, 0, 12].forEach(d => { g.beginPath(); g.moveTo(bx + d - 3, by + 7); g.lineTo(bx + d + 5, by - 6); g.stroke(); }); });
    g.restore();

    // ---- eyes: big, low, glossy ----
    const eyeY = 46, RX = 41, RY = 49;
    [[-1, -64], [1, 64]].forEach(([side, ex]) => {
      if (mood === 'happy') {
        g.strokeStyle = OL; g.lineWidth = 10; g.lineCap = 'round';
        g.beginPath(); g.arc(ex, eyeY + 20, 34, Math.PI * 1.15, Math.PI * 1.85); g.stroke();
        g.lineWidth = 7; g.beginPath(); g.moveTo(ex + side * 32, eyeY + 2); g.lineTo(ex + side * 46, eyeY - 8); g.stroke();
        return;
      }
      const big = mood === 'shock' ? 1.08 : 1;
      const lid = mood === 'sad' ? eyeY - 20 : null;
      g.save();
      if (lid !== null) { g.beginPath(); g.moveTo(ex - 70, lid + 6); g.quadraticCurveTo(ex, lid - 8, ex + 70, lid + 6); g.lineTo(ex + 70, eyeY + 80); g.lineTo(ex - 70, eyeY + 80); g.closePath(); g.clip(); }
      // iris
      el(ex, eyeY, RX * big, RY * big); g.fillStyle = lin(0, eyeY - RY, 0, eyeY + RY, [[0, MIA.eyes[0]], [0.5, MIA.eyes[1]], [1, MIA.eyes[2]]]); g.fill();
      g.lineWidth = 5; g.strokeStyle = OL; g.stroke();
      // pupil
      el(ex, eyeY + 2, RX * 0.45, RY * 0.48); g.fillStyle = 'rgba(30,15,12,0.55)'; g.fill();
      // lower glow (pinkish)
      el(ex, eyeY + RY * 0.55, RX * 0.7, RY * 0.32); g.fillStyle = 'rgba(255,190,170,0.45)'; g.fill();
      // highlights
      g.fillStyle = '#fff';
      el(ex - 13, eyeY - (lid !== null ? 4 : 18), mood === 'shock' ? 10 : 15, mood === 'shock' ? 11 : 18); g.fill();
      el(ex + 16, eyeY + 18, 7, 8); g.fill();
      el(ex - 4, eyeY + 26, 4, 4); g.fill();
      if (lid === null) { star4(g, ex + 17, eyeY - 22, 9); g.fill(); }
      // teary: wet shine along the bottom
      if (mood === 'teary') {
        g.strokeStyle = 'rgba(255,255,255,0.9)'; g.lineWidth = 5; g.beginPath(); g.arc(ex, eyeY - 4, RY * 0.95, Math.PI * 0.2, Math.PI * 0.8); g.stroke();
        el(ex, eyeY + RY - 3, RX * 0.8, 6); g.fillStyle = 'rgba(190,230,255,0.6)'; g.fill();
      }
      g.restore();
      // lashes
      g.strokeStyle = OL; g.lineWidth = 10; g.lineCap = 'round';
      if (lid !== null) {
        g.beginPath(); g.moveTo(ex - 44, lid + 6); g.quadraticCurveTo(ex, lid - 8, ex + 44, lid + 6); g.stroke();
        g.lineWidth = 7; g.beginPath(); g.moveTo(ex + side * 44, lid + 6); g.quadraticCurveTo(ex + side * 54, lid + 2, ex + side * 60, lid - 8); g.stroke();
      } else {
        g.beginPath(); g.arc(ex, eyeY + 6, RY + 2, Math.PI * 1.14, Math.PI * 1.86); g.stroke();
        g.lineWidth = 7;
        g.beginPath(); g.moveTo(ex + side * 44, eyeY - 14); g.quadraticCurveTo(ex + side * 56, eyeY - 22, ex + side * 62, eyeY - 34); g.stroke();
        g.beginPath(); g.moveTo(ex + side * 34, eyeY - 34); g.lineTo(ex + side * 42, eyeY - 47); g.stroke();
      }
      g.lineWidth = 3; g.globalAlpha = 0.55; g.beginPath(); g.arc(ex, eyeY - 6, RY - 2, Math.PI * 0.34, Math.PI * 0.66); g.stroke(); g.globalAlpha = 1;
    });

    // ---- eyebrows: short and soft ----
    g.strokeStyle = MIA.hair[0]; g.lineWidth = 6; g.lineCap = 'round';
    [[-1, -64], [1, 64]].forEach(([side, ex]) => {
      let inner = -24, outer = -22;
      if (mood === 'sad' || mood === 'teary') { inner = -34; outer = -18; }
      if (mood === 'angry') { inner = -12; outer = -30; }
      if (mood === 'shock') { inner = -36; outer = -34; }
      if (mood === 'happy') { inner = -28; outer = -26; }
      g.beginPath(); g.moveTo(ex - side * 22, inner); g.quadraticCurveTo(ex, Math.min(inner, outer) - 6, ex + side * 22, outer); g.stroke();
    });

    // ---- tiny nose ----
    el(0, 96, 6, 4); g.fillStyle = 'rgba(230,140,130,0.8)'; g.fill();

    // ---- tiny mouth ----
    if (mood === 'happy') {
      g.beginPath(); g.moveTo(-20, 116); g.quadraticCurveTo(0, 122, 20, 116); g.quadraticCurveTo(16, 140, 0, 141); g.quadraticCurveTo(-16, 140, -20, 116); g.closePath(); fin('#c84a62', 5);
      g.save(); g.clip(); el(0, 142, 13, 9); g.fillStyle = '#ff9fb0'; g.fill(); g.restore();
    } else if (mood === 'shock') {
      el(0, 126, 10, 13); fin('#b23e58', 5);
    } else if (mood === 'angry') {
      g.beginPath(); g.moveTo(-16, 126); g.quadraticCurveTo(0, 118, 16, 126); g.lineWidth = 6; g.strokeStyle = OL; g.stroke();
    } else if (mood === 'teary') {
      // little wobbly pout
      g.beginPath(); g.moveTo(-14, 124); g.quadraticCurveTo(-7, 116, 0, 122); g.quadraticCurveTo(7, 116, 14, 124); g.lineWidth = 6; g.strokeStyle = OL; g.stroke();
    } else if (mood === 'sad') {
      g.beginPath(); g.moveTo(-14, 126); g.quadraticCurveTo(0, 116, 14, 126); g.lineWidth = 6; g.strokeStyle = OL; g.stroke();
    } else {
      // soft little smile
      g.beginPath(); g.moveTo(-14, 116); g.quadraticCurveTo(0, 130, 14, 116); g.quadraticCurveTo(0, 124, -14, 116); g.closePath(); fin(MIA.mouth, 5);
    }

    // ---- tear ----
    if (o.tear) {
      const tx = -86, ty = 90;
      g.beginPath(); g.moveTo(tx, ty); g.bezierCurveTo(tx - 15, ty + 28, tx - 11, ty + 50, tx + 2, ty + 50); g.bezierCurveTo(tx + 15, ty + 50, tx + 16, ty + 28, tx, ty); g.closePath();
      g.fillStyle = lin(0, ty, 0, ty + 50, [[0, 'rgba(205,238,255,0.97)'], [1, 'rgba(140,200,255,0.97)']]); g.fill(); g.lineWidth = 3.5; g.strokeStyle = '#5a8fc4'; g.stroke();
      el(tx - 3, ty + 36, 3.5, 6); g.fillStyle = '#fff'; g.fill();
    }

    // ---- front hair: side part + swept bangs ----
    g.beginPath();
    g.moveTo(-164, 16);
    g.bezierCurveTo(-184, -150, -40, -220, 40, -194);
    g.bezierCurveTo(146, -174, 190, -92, 164, 24);
    g.bezierCurveTo(156, -24, 134, -58, 102, -72);
    g.bezierCurveTo(76, -40, 34, -32, -8, -42);
    g.bezierCurveTo(-46, -52, -72, -74, -88, -106);
    g.bezierCurveTo(-108, -70, -132, -32, -164, 16);
    g.closePath(); fin(lin(0, -220, 0, 20, [[0, MIA.hair[0]], [1, shade(MIA.hair[0], -0.1)]]));
    g.strokeStyle = 'rgba(30,15,12,0.4)'; g.lineWidth = 3.5;
    [[-62, -148, -22, -62], [8, -168, 40, -60], [72, -146, 112, -72], [-116, -104, -136, -26]].forEach(([a, b, c, d]) => { g.beginPath(); g.moveTo(a, b); g.quadraticCurveTo((a + c) / 2 + 12, (b + d) / 2, c, d); g.stroke(); });
    // glossy hair shine band
    g.strokeStyle = MIA.hairShine; g.lineWidth = 16; g.lineCap = 'round';
    g.beginPath(); g.arc(0, -36, 150, Math.PI * 1.28, Math.PI * 1.5); g.stroke();
    g.beginPath(); g.arc(0, -36, 150, Math.PI * 1.56, Math.PI * 1.66); g.stroke();

    // side locks over the shoulders (wavy, curl at the end)
    [-1, 1].forEach(side => {
      g.beginPath();
      g.moveTo(side * 156, -14);
      g.bezierCurveTo(side * 184, 60, side * 156, 120, side * 182, 188);
      g.bezierCurveTo(side * 200, 236, side * 180, 276, side * 150, 286);
      g.bezierCurveTo(side * 160, 260, side * 152, 238, side * 138, 218);
      g.bezierCurveTo(side * 120, 168, side * 144, 108, side * 132, 40);
      g.bezierCurveTo(side * 128, 10, side * 138, -6, side * 156, -14);
      g.closePath(); fin(lin(0, -14, 0, 286, [[0, MIA.hair[0]], [1, MIA.hair[1]]]), 7);
      g.strokeStyle = MIA.hairShine; g.lineWidth = 7; g.beginPath(); g.moveTo(side * 156, 40); g.quadraticCurveTo(side * 166, 120, side * 160, 188); g.stroke();
    });

    // ---- pink bow clip (cute mark) ----
    if (showBow) {
      g.save(); g.translate(112, -128); g.rotate(0.35);
      [-1, 1].forEach(d => { g.beginPath(); g.moveTo(0, 0); g.bezierCurveTo(d * 30, -42, d * 70, -30, d * 62, 4); g.bezierCurveTo(d * 58, 34, d * 26, 30, 0, 0); g.closePath(); fin(MIA.bow, 6); g.beginPath(); g.moveTo(d * 12, -4); g.quadraticCurveTo(d * 34, -18, d * 46, -6); g.strokeStyle = 'rgba(255,255,255,0.7)'; g.lineWidth = 4; g.stroke(); });
      el(0, 0, 14, 14); fin('#ff6f9a', 6);
      g.restore();
    }

    g.restore();
  }

  function heart(g, x, y, s) { g.beginPath(); g.moveTo(x, y + s * 0.9); g.bezierCurveTo(x - s * 1.5, y - s * 0.2, x - s * 0.7, y - s * 1.2, x, y - s * 0.4); g.bezierCurveTo(x + s * 0.7, y - s * 1.2, x + s * 1.5, y - s * 0.2, x, y + s * 0.9); g.closePath(); }
  function star4(g, x, y, s) { g.beginPath(); for (let i = 0; i < 8; i++) { const a = i * Math.PI / 4 - Math.PI / 2, r = i % 2 ? s * 0.3 : s; g.lineTo(x + Math.cos(a) * r, y + Math.sin(a) * r); } g.closePath(); }
  function shade(hex, k) {
    const n = parseInt(hex.slice(1), 16); const r = n >> 16, gg = (n >> 8) & 255, b = n & 255;
    const f = v => Math.round(k < 0 ? v * (1 + k) : v + (255 - v) * k);
    return '#' + [f(r), f(gg), f(b)].map(v => Math.max(0, Math.min(255, v)).toString(16).padStart(2, '0')).join('');
  }
  window.drawMia = drawMia; window.miaHeart = heart; window.miaStar4 = star4;
})();
