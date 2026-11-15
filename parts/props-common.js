// props-common.js: small things used in more than one set: fairy lights, plants, mugs, chairs, phone, pendant lamps, text cards.
import { THREE, toon, basic, rbox, lathe, sphere, capsule, puff, roundRectShape, heartShape, M, G, glow, paint, rr2, heart2, star2, R, OUTLINE, addOutline } from './kit.js';

// ---------- fairy lights: wire + bulbs along a sagging line; twinkle is a pure function of t ----------
// pts: list of [x,y,z] anchor points; between anchors the wire sags by `sag`
export function fairyLights(pts, { sag = 0.12, every = 0.11, colors = ['#fff1b0', '#ffc2d6', '#ffe08a', '#c9f0ff', '#ffd1a8'] } = {}) {
  const group = new THREE.Group(); group.name = 'fairyLights';
  const path = [];
  for (let i = 0; i < pts.length - 1; i++) {
    const a = new THREE.Vector3(...pts[i]), b = new THREE.Vector3(...pts[i + 1]);
    const n = Math.max(6, Math.round(a.distanceTo(b) / 0.04));
    for (let k = 0; k <= n; k++) { if (i > 0 && k === 0) continue; const f = k / n; const p = a.clone().lerp(b, f); p.y -= Math.sin(Math.PI * f) * sag; path.push(p); }
  }
  const curve = new THREE.CatmullRomCurve3(path);
  const wire = new THREE.Mesh(new THREE.TubeGeometry(curve, path.length * 2, 0.005, 5, false), toon('#7a5a4a'));
  group.add(wire);
  const len = curve.getLength(), count = Math.floor(len / every);
  const bulbGeo = sphere(0.02, 10, 8); bulbGeo.scale(1, 1.3, 1);
  const bulbs = new THREE.InstancedMesh(bulbGeo, new THREE.MeshBasicMaterial({ color: '#ffffff', toneMapped: false }), count);
  const m4 = new THREE.Matrix4(), base = [], glows = [];
  for (let i = 0; i < count; i++) {
    const p = curve.getPointAt((i + 0.5) / count); p.y -= 0.022;
    m4.makeTranslation(p.x, p.y, p.z); bulbs.setMatrixAt(i, m4);
    const c = new THREE.Color(colors[i % colors.length]); base.push(c); bulbs.setColorAt(i, c);
    const gl = glow(colors[i % colors.length], 0.2, 0.7); gl.position.copy(p); group.add(gl); glows.push(gl);
  }
  group.add(bulbs);
  const tmp = new THREE.Color();
  return {
    group, count,
    update(t, on) {
      for (let i = 0; i < count; i++) {
        const tw = on ? 0.62 + 0.38 * (0.5 + 0.5 * Math.sin(t * (1.6 + R(i) * 1.8) + i * 2.3)) : 0;
        tmp.copy(base[i]).multiplyScalar(on ? 0.35 + tw * 0.9 : 0.55); bulbs.setColorAt(i, on ? tmp : tmp.lerp(new THREE.Color('#e8dcd0'), 0.5));
        glows[i].visible = on; glows[i].material.opacity = 0.35 + 0.5 * tw; glows[i].scale.setScalar(0.16 + 0.08 * tw);
      }
      bulbs.instanceColor.needsUpdate = true;
    },
  };
}

// ---------- plants ----------
const LEAF = (() => { const s = new THREE.Shape(); s.moveTo(0, 0); s.bezierCurveTo(0.6, 0.35, 0.55, 1.0, 0, 1.25); s.bezierCurveTo(-0.55, 1.0, -0.6, 0.35, 0, 0); return s; })();
export function leafGeo(size) { const g = puff(LEAF, 0.02, 0.012, 2, 10); g.scale(size, size, size); return g; }
export function pottedPlant({ potColor = '#ffb59e', leaf = '#8fd3a8', h = 0.5, leaves = 9, r = 0.16, seed = 1, face = false } = {}) {
  const g = new THREE.Group();
  const pot = M(lathe([[0.001, 0], [r * 0.78, 0], [r * 0.85, 0.02], [r, r * 1.3], [r * 1.08, r * 1.36], [r * 1.08, r * 1.5], [r * 0.95, r * 1.52], [0.001, r * 1.4]]), toon(potColor));
  g.add(pot);
  const soil = M(new THREE.CylinderGeometry(r * 0.93, r * 0.93, 0.01, 20), toon('#8a5a44'), 0, r * 1.45, 0); g.add(soil);
  const lg = leafGeo(h * 0.42), lm = toon(leaf), lm2 = toon(new THREE.Color(leaf).offsetHSL(0.02, 0, -0.07).getStyle());
  for (let i = 0; i < leaves; i++) {
    const a = i / leaves * Math.PI * 2 + R(seed + i) * 0.5, tilt = 0.35 + R(seed * 3 + i) * 0.55;
    const l = new THREE.Mesh(lg, i % 2 ? lm : lm2); l.castShadow = true;
    l.position.set(0, r * 1.45, 0); l.rotation.set(0, a, 0); l.rotateX(-tilt); l.scale.setScalar(0.75 + R(seed + i * 7) * 0.45);
    g.add(l);
  }
  return g;
}

// ---------- mug ----------
export function mug(color = '#ff9fb8', r = 0.042, h = 0.09, tex = null) {
  const g = new THREE.Group();
  g.add(M(lathe([[0.001, 0], [r * 0.9, 0], [r, 0.01], [r, h], [r * 0.9, h], [r * 0.88, h * 0.25], [0.001, h * 0.25]]), toon(color, tex ? { map: tex } : {})));
  const handle = M(new THREE.TorusGeometry(h * 0.27, 0.009, 8, 16, Math.PI * 1.2), toon(color), r * 1.02, h * 0.55, 0, 0, 0, -Math.PI * 0.6); g.add(handle);
  return g;
}

// ---------- simple wooden chair (cute rounded) ----------
export function chair({ wood = '#e7b98c', seat = '#ffc9d6', back = true } = {}) {
  const g = new THREE.Group(), w = toon(wood);
  [[-0.17, -0.17], [0.17, -0.17], [-0.17, 0.17], [0.17, 0.17]].forEach(([x, z]) => g.add(M(capsule(0.02, 0.4, 4, 8), w, x, 0.22, z)));
  g.add(M(rbox(0.44, 0.06, 0.42, 0.025), w, 0, 0.45, 0));
  g.add(M(rbox(0.42, 0.05, 0.4, 0.025), toon(seat), 0, 0.5, 0));
  if (back) { g.add(M(capsule(0.02, 0.45, 4, 8), w, -0.18, 0.72, -0.19)); g.add(M(capsule(0.02, 0.45, 4, 8), w, 0.18, 0.72, -0.19)); g.add(M(rbox(0.42, 0.16, 0.04, 0.02), w, 0, 0.92, -0.19)); }
  return g;
}

// ---------- pendant lamp (dome) with on/off: returns { group, set(on, k) } ----------
export function pendant({ color = '#ffd0dc', cord = 0.7, r = 0.18, light = '#ffcf94', intensity = 3.2, dist = 4 } = {}) {
  const g = new THREE.Group();
  g.add(M(new THREE.CylinderGeometry(0.006, 0.006, cord, 6), toon('#7a5a4a'), 0, -cord / 2, 0));
  const shade = M(lathe([[0.02, 0.02], [r * 0.25, 0.01], [r * 0.7, -0.06], [r, -0.16], [r * 1.02, -0.18], [0.001, -0.17]]), toon(color)); shade.position.y = -cord; g.add(shade);
  const bulb = new THREE.Mesh(sphere(0.045, 12, 10), basic({ color: '#fff3d6' })); bulb.position.y = -cord - 0.16; g.add(bulb);
  const L = new THREE.PointLight(light, intensity, dist, 1.6); L.position.y = -cord - 0.25; g.add(L);
  const gl = glow(light, 0.9, 0.55); gl.position.y = -cord - 0.18; g.add(gl);
  return { group: g, set(on, k = 1) { L.intensity = on ? intensity * k : 0; gl.visible = on; bulb.material.color.set(on ? '#fff3d6' : '#d9cfc4'); } };
}

// ---------- phone (pink case) with a screen that takes any canvas ----------
export function phone() {
  const g = new THREE.Group(); g.name = 'phone';
  const body = M(rbox(0.078, 0.158, 0.012, 0.011, 3), toon('#ffb3c8')); g.add(body);
  addOutline(body);
  const scrGeo = new THREE.PlaneGeometry(0.068, 0.146);
  const screen = new THREE.Mesh(scrGeo, new THREE.MeshBasicMaterial({ color: '#ffffff', toneMapped: false })); screen.position.z = 0.0064; screen.name = 'phoneScreen'; g.add(screen);
  const cam = M(sphere(0.006, 8, 6), toon('#3a3550'), -0.026, 0.06, -0.007); g.add(cam);
  const light = new THREE.PointLight('#cfe0ff', 0, 1.6, 1.6); light.position.z = 0.12; g.add(light);
  const gl = glow('#cfe6ff', 0.5, 0.5); gl.position.z = 0.01; g.add(gl);
  return { group: g, screen, light, gl };
}

// ---------- a canvas texture cache for film-supplied canvases ----------
const CT = new WeakMap();
export function texFromCanvas(c) {
  let t = CT.get(c); if (!t) { t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; CT.set(c, t); }
  t.needsUpdate = true; return t;
}
export const OL = OUTLINE;
export { rr2, heart2, star2, paint };
