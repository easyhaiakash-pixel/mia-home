// room.js: walls (with window/door holes), painted wallpaper + wainscot, floor, ceiling, trims.
// Each wall gets ONE painted texture over its whole length, so the pattern runs on around holes.
import { THREE, paint, rbox, toon, M, R, star2, heart2, rr2 } from './kit.js';

// paint a wall: wallpaper on top, panelled wainscot below, skirting shadow
export function wallTexture(len, h, s) {
  const PX = 180, w = Math.min(1024, Math.round(len * PX)), hh = Math.round(h * PX);
  return paint(w, hh, (g) => {
    const sx = w / len, wy = hh - s.wainsH * PX;
    g.fillStyle = s.paper; g.fillRect(0, 0, w, hh);
    // pattern
    const step = 0.32 * sx;
    for (let r = 0, y = step * 0.5; y < wy; r++, y += step * 0.9) for (let c = 0, x = (r % 2) * step * 0.5; x < w + step; c++, x += step) {
      const k = r * 37 + c;
      if (s.pattern === 'stripes') continue;
      if (s.pattern === 'hearts' && k % 3 === 0) { heart2(g, x, y, 6); g.fillStyle = s.dot; g.fill(); }
      else if (k % 3 === 0) { star2(g, x, y, 7); g.fillStyle = 'rgba(255,255,255,0.9)'; g.fill(); }
      else { g.beginPath(); g.arc(x, y, 3.2, 0, 7); g.fillStyle = s.dot; g.fill(); }
    }
    if (s.pattern === 'stripes') for (let x = 0; x < w; x += 0.22 * sx) { g.fillStyle = s.dot; g.fillRect(x, 0, 0.09 * sx, wy); }
    // soft light gradient at the top (painted ambient)
    const gr = g.createLinearGradient(0, 0, 0, wy); gr.addColorStop(0, 'rgba(255,255,255,0.18)'); gr.addColorStop(1, 'rgba(255,255,255,0)'); g.fillStyle = gr; g.fillRect(0, 0, w, wy);
    // wainscot
    g.fillStyle = s.wains; g.fillRect(0, wy, w, hh - wy);
    const pw = 0.62 * sx;
    for (let x = 0.06 * sx; x < w - 0.1 * sx; x += pw) {
      rr2(g, x + 6, wy + 0.1 * PX, pw - 12, hh - wy - 0.24 * PX, 10); g.lineWidth = 5; g.strokeStyle = 'rgba(255,255,255,0.7)'; g.stroke();
      rr2(g, x + 10, wy + 0.1 * PX + 4, pw - 20, hh - wy - 0.24 * PX - 8, 8); g.lineWidth = 2; g.strokeStyle = 'rgba(70,90,80,0.15)'; g.stroke();
    }
    // contact shadow at floor + under the rail
    const sh = g.createLinearGradient(0, hh - 0.25 * PX, 0, hh); sh.addColorStop(0, 'rgba(110,60,60,0)'); sh.addColorStop(1, 'rgba(110,60,60,0.22)'); g.fillStyle = sh; g.fillRect(0, hh - 0.25 * PX, w, 0.25 * PX);
    const sh2 = g.createLinearGradient(0, wy - 0.1 * PX, 0, wy); sh2.addColorStop(0, 'rgba(110,60,60,0)'); sh2.addColorStop(1, 'rgba(110,60,60,0.10)'); g.fillStyle = sh2; g.fillRect(0, wy - 0.1 * PX, w, 0.1 * PX);
  });
}

// wall(statics, { o:[x,z], u:[ux,uz] (along), len, h, holes:[{u0,u1,y0,y1}], style, thick })
// The inner face looks along n = (-uz, ux) rotated: we pass the inward normal explicitly as n:[nx,nz].
export function wall(st, w) {
  const thick = w.thick || 0.14, len = w.len, h = w.h;
  const tex = wallTexture(len, h, w.style);
  const mat = toon('#ffffff', { map: tex });
  const edge = toon(w.style.edge || '#f3d2c8');
  // split into rectangles that avoid the holes
  const holes = (w.holes || []).slice().sort((a, b) => a.u0 - b.u0);
  const rects = []; let u = 0;
  for (const H of holes) {
    if (H.u0 > u) rects.push([u, H.u0, 0, h]);
    if (H.y0 > 0) rects.push([H.u0, H.u1, 0, H.y0]);
    if (H.y1 < h) rects.push([H.u0, H.u1, H.y1, h]);
    u = H.u1;
  }
  if (u < len) rects.push([u, len, 0, h]);
  const basis = new THREE.Matrix4().makeBasis(new THREE.Vector3(w.u[0], 0, w.u[1]), new THREE.Vector3(0, 1, 0), new THREE.Vector3(w.n[0], 0, w.n[1]));
  basis.setPosition(w.o[0], 0, w.o[1]);
  const group = new THREE.Group();
  for (const [a, b, y0, y1] of rects) {
    if (b - a < 1e-3 || y1 - y0 < 1e-3) continue;
    const g = new THREE.BoxGeometry(b - a, y1 - y0, thick);
    g.translate((a + b) / 2, (y0 + y1) / 2, -thick / 2);
    const p = g.getAttribute('position'), n = g.getAttribute('normal'), uv = g.getAttribute('uv');
    for (let i = 0; i < p.count; i++) uv.setXY(i, p.getX(i) / len, p.getY(i) / h);
    // inner face (normal +z) gets the painted texture; other faces plain
    const inner = [], other = [];
    g.clearGroups();
    // BoxGeometry face order: +x,-x,+y,-y,+z,-z (6 index ranges of 6)
    for (let f = 0; f < 6; f++) g.addGroup(f * 6, 6, f === 4 ? 0 : 1);
    const m = new THREE.Mesh(g, [mat, edge]);
    m.applyMatrix4(basis); m.receiveShadow = true; m.castShadow = true;
    group.add(m);
  }
  // multi-material meshes are not merged; walls stay as a few meshes
  group.traverse(m => { if (m.isMesh) m.userData.noMerge = true; });
  return group;
}

export function floor(x0, x1, z0, z1, tex, color = '#ffffff') {
  const w = x1 - x0, d = z1 - z0;
  const t = tex.clone(); t.needsUpdate = true; t.repeat.set(w / 1.4, d / 1.4); t.wrapS = t.wrapT = THREE.RepeatWrapping;
  const m = new THREE.Mesh(new THREE.PlaneGeometry(w, d), toon(color, { map: t }));
  m.rotation.x = -Math.PI / 2; m.position.set((x0 + x1) / 2, 0, (z0 + z1) / 2); m.receiveShadow = true; m.userData.noMerge = true; m.name = 'floor';
  return m;
}
export function ceiling(x0, x1, z0, z1, h, color = '#fff6ee') {
  const m = new THREE.Mesh(new THREE.PlaneGeometry(x1 - x0, z1 - z0), toon(color));
  m.rotation.x = Math.PI / 2; m.position.set((x0 + x1) / 2, h, (z0 + z1) / 2); m.userData.noMerge = true; return m;
}
// white trim strip (skirting / rail / frame) along a wall: from (x,z) to (x2,z2) at height y, sticking out `out` from the wall
export function trim(st, a, b, y, hgt, out, n, color = '#ffffff') {
  const dx = b[0] - a[0], dz = b[1] - a[1], len = Math.hypot(dx, dz);
  const m = M(rbox(len, hgt, out * 2, Math.min(hgt, out) * 0.45, 2), toon(color), (a[0] + b[0]) / 2, y, (a[1] + b[1]) / 2, 0, -Math.atan2(dz, dx), 0);
  st.add(m); return m;
}
