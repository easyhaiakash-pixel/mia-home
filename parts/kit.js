// kit.js: the shared toolbox for every room and prop.
// Toon materials, the brown outline, painted canvas textures, rounded shapes, soft fake shadows, glow sprites,
// and the "static" list (furniture that never moves is merged into a few big meshes for speed).
// Rule: nothing here may use Math.random(). Use R(i) (a fixed hash) for "random" looks.
import * as THREE from '../vendor/three.module.min.js';
import { RoundedBoxGeometry } from '../vendor/RoundedBoxGeometry.js';
import { mergeGeometries } from '../vendor/BufferGeometryUtils.js';

export { THREE };
export const OUTLINE = '#6b4046';
export const TAU = Math.PI * 2;
export const R = i => { const x = Math.sin(i * 127.1 + 311.7) * 43758.5453; return x - Math.floor(x); };
export const clamp = (x, a = 0, b = 1) => Math.max(a, Math.min(b, x));
export const lerp = (a, b, k) => a + (b - a) * k;
export const smooth = x => { x = clamp(x); return x * x * (3 - 2 * x); };
export const easeIO = x => { x = clamp(x); return 0.5 - 0.5 * Math.cos(Math.PI * x); };

// ---------- soft toon ramp (4 soft steps, linear filtered = gentle, painted look) ----------
let RAMP = null;
function ramp() {
  if (RAMP) return RAMP;
  const d = new Uint8Array([150, 150, 150, 255, 196, 196, 196, 255, 232, 232, 232, 255, 255, 255, 255, 255]);
  RAMP = new THREE.DataTexture(d, 4, 1, THREE.RGBAFormat);
  RAMP.minFilter = RAMP.magFilter = THREE.LinearFilter; RAMP.generateMipmaps = false; RAMP.needsUpdate = true;
  return RAMP;
}
const MATS = new Map();
// toon(color) — same colour + options gives the same material (so merged furniture shares it)
export function toon(color, o = {}) {
  const key = color + '|' + (o.map ? o.map.uuid : '') + '|' + (o.emissive || '') + '|' + (o.ei || 0) + '|' + (o.side || 0) + '|' + (o.transparent ? o.opacity : '');
  if (MATS.has(key)) return MATS.get(key);
  const m = new THREE.MeshToonMaterial({ color, gradientMap: ramp(), map: o.map || null, side: o.side || THREE.FrontSide });
  if (o.emissive) { m.emissive = new THREE.Color(o.emissive); m.emissiveIntensity = o.ei ?? 1; }
  if (o.transparent) { m.transparent = true; m.opacity = o.opacity; m.depthWrite = false; }
  MATS.set(key, m); return m;
}
export function basic(o) { return new THREE.MeshBasicMaterial(o); }

// ---------- outline: inverted hull, pushed out a fixed number of screen pixels ----------
export const outlineUniforms = { uPx: { value: 2.6 }, uRes: { value: new THREE.Vector2(1080, 1920) }, uCol: { value: new THREE.Color(OUTLINE) } };
export function outlineMaterial() {
  return new THREE.ShaderMaterial({
    uniforms: outlineUniforms, side: THREE.BackSide,
    vertexShader: `uniform float uPx; uniform vec2 uRes;
      #include <common>
      #include <skinning_pars_vertex>
      void main(){
        vec4 mv = modelViewMatrix * vec4(position, 1.0);
        vec4 clip = projectionMatrix * mv;
        vec3 nv = normalize(normalMatrix * normal);
        vec4 nc = projectionMatrix * vec4(nv, 0.0);
        vec2 dir = nc.xy; float l = length(dir); dir = l > 1e-5 ? dir / l : vec2(0.0);
        clip.xy += dir * (uPx * 2.0 / uRes) * clip.w;
        clip.z += 0.0004 * clip.w;
        gl_Position = clip;
      }`,
    fragmentShader: `uniform vec3 uCol; void main(){ gl_FragColor = vec4(uCol, 1.0);
      #include <colorspace_fragment>
      }`,
  });
}
let OUTMAT = null;
export const outlineMat = () => (OUTMAT ||= outlineMaterial());
// give any mesh its own outline (for moving props)
export function addOutline(mesh, layers) {
  const h = new THREE.Mesh(mesh.geometry, outlineMat());
  h.name = (mesh.name || 'mesh') + ':outline'; h.renderOrder = -1;
  mesh.add(h); return h;
}

// ---------- geometry helpers ----------
export const rbox = (w, h, d, r = 0.04, seg = 3) => new RoundedBoxGeometry(w, h, d, seg, Math.min(r, w / 2 - 1e-3, h / 2 - 1e-3, d / 2 - 1e-3));
// a lathe from a profile [[r,y],...] (bottom to top); smooth rounded objects: pots, mugs, lamps, vases
export const lathe = (pts, seg = 28) => { const g = new THREE.LatheGeometry(pts.map(([r, y]) => new THREE.Vector2(Math.max(0.0001, r), y)), seg); g.computeVertexNormals(); return g; };
// soft rounded "pillow" capsule
export const capsule = (r, len, cap = 8, rad = 16) => new THREE.CapsuleGeometry(r, len, cap, rad);
export const sphere = (r, w = 20, h = 14) => new THREE.SphereGeometry(r, w, h);
// puffy extruded 2D shape (cushions, jacket, leaves, hearts)
export function puff(shape, depth, bevel, segs = 4, curveSeg = 24) {
  const g = new THREE.ExtrudeGeometry(shape, { depth, bevelEnabled: true, bevelThickness: bevel, bevelSize: bevel * 0.9, bevelSegments: segs, curveSegments: curveSeg });
  g.translate(0, 0, -depth / 2); g.computeVertexNormals(); return g;
}
export function roundRectShape(w, h, r) {
  const s = new THREE.Shape(), x = -w / 2, y = -h / 2;
  s.moveTo(x + r, y); s.lineTo(x + w - r, y); s.quadraticCurveTo(x + w, y, x + w, y + r); s.lineTo(x + w, y + h - r);
  s.quadraticCurveTo(x + w, y + h, x + w - r, y + h); s.lineTo(x + r, y + h); s.quadraticCurveTo(x, y + h, x, y + h - r);
  s.lineTo(x, y + r); s.quadraticCurveTo(x, y, x + r, y); return s;
}
export function heartShape(s) {
  const h = new THREE.Shape();
  h.moveTo(0, -s * 0.9); h.bezierCurveTo(-s * 1.5, s * 0.2, -s * 0.7, s * 1.2, 0, s * 0.4); h.bezierCurveTo(s * 0.7, s * 1.2, s * 1.5, s * 0.2, 0, -s * 0.9);
  return h;
}

// ---------- painted canvas textures ----------
export function paint(w, h, fn, o = {}) {
  const c = document.createElement('canvas'); c.width = w; c.height = h;
  const g = c.getContext('2d'); fn(g, w, h);
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = o.linear ? THREE.NoColorSpace : THREE.SRGBColorSpace;
  t.anisotropy = 4;
  if (o.repeat) { t.wrapS = t.wrapT = THREE.RepeatWrapping; t.repeat.set(o.repeat[0], o.repeat[1]); }
  t.needsUpdate = true; t.userData.canvas = c; return t;
}
export function rr2(g, x, y, w, h, r) { g.beginPath(); g.roundRect(x, y, w, h, r); }
export function heart2(g, x, y, s) { g.beginPath(); g.moveTo(x, y + s * 0.9); g.bezierCurveTo(x - s * 1.5, y - s * 0.2, x - s * 0.7, y - s * 1.2, x, y - s * 0.4); g.bezierCurveTo(x + s * 0.7, y - s * 1.2, x + s * 1.5, y - s * 0.2, x, y + s * 0.9); g.closePath(); }
export function star2(g, x, y, s) { g.beginPath(); for (let i = 0; i < 8; i++) { const a = i * Math.PI / 4 - Math.PI / 2, r = i % 2 ? s * 0.3 : s; g.lineTo(x + Math.cos(a) * r, y + Math.sin(a) * r); } g.closePath(); }

// soft round shadow blob (fake contact shadow), lies on the floor
let BLOB = null;
export function blobTex() {
  return BLOB ||= paint(128, 128, (g) => { const gr = g.createRadialGradient(64, 64, 4, 64, 64, 62); gr.addColorStop(0, 'rgba(90,40,50,0.55)'); gr.addColorStop(0.55, 'rgba(90,40,50,0.28)'); gr.addColorStop(1, 'rgba(90,40,50,0)'); g.fillStyle = gr; g.fillRect(0, 0, 128, 128); });
}
export function blob(w, d, op = 1) {
  const m = new THREE.Mesh(new THREE.PlaneGeometry(w, d), new THREE.MeshBasicMaterial({ map: blobTex(), transparent: true, depthWrite: false, opacity: op }));
  m.rotation.x = -Math.PI / 2; m.renderOrder = 1; m.name = 'blob'; return m;
}
// additive glow sprite (lamp halos, fairy bulbs, screen glow)
let GLOW = null;
export function glowTex() {
  return GLOW ||= paint(128, 128, (g) => { const gr = g.createRadialGradient(64, 64, 0, 64, 64, 64); gr.addColorStop(0, 'rgba(255,255,255,1)'); gr.addColorStop(0.18, 'rgba(255,255,255,0.55)'); gr.addColorStop(0.5, 'rgba(255,255,255,0.14)'); gr.addColorStop(1, 'rgba(255,255,255,0)'); g.fillStyle = gr; g.fillRect(0, 0, 128, 128); });
}
export function glow(color, size, op = 1) {
  const s = new THREE.Sprite(new THREE.SpriteMaterial({ map: glowTex(), color, transparent: true, opacity: op, blending: THREE.AdditiveBlending, depthWrite: false }));
  s.scale.set(size, size, 1); s.renderOrder = 5; return s;
}

// ---------- static furniture list → merged meshes ----------
export class Statics {
  constructor() { this.items = []; }
  // add(mesh, opts): mesh must already be placed (its world matrix is baked in). opts.outline=false skips the outline.
  add(obj, o = {}) {
    obj.updateMatrixWorld(true);
    obj.traverse(m => {
      if (!m.isMesh || m.name === 'blob' || m.userData.noMerge) return;
      const g = m.geometry.clone().applyMatrix4(m.matrixWorld);
      this.items.push({ g, mat: m.material, outline: o.outline !== false && m.userData.outline !== false, shadow: m.userData.noShadow ? false : o.shadow !== false });
    });
  }
  build(scene) {
    const clean = g => {
      g = g.index ? g.toNonIndexed() : g;
      const out = new THREE.BufferGeometry();
      out.setAttribute('position', g.getAttribute('position'));
      if (!g.getAttribute('normal')) g.computeVertexNormals();
      out.setAttribute('normal', g.getAttribute('normal'));
      const n = g.getAttribute('position').count;
      out.setAttribute('uv', g.getAttribute('uv') || new THREE.Float32BufferAttribute(new Float32Array(n * 2), 2));
      return out;
    };
    const groups = new Map();
    for (const it of this.items) { const k = it.mat.uuid + (it.shadow ? 's' : 'n'); if (!groups.has(k)) groups.set(k, { mat: it.mat, shadow: it.shadow, list: [] }); groups.get(k).list.push(clean(it.g)); }
    let meshes = 0;
    for (const { mat, shadow, list } of groups.values()) {
      const m = new THREE.Mesh(mergeGeometries(list), mat); m.castShadow = shadow; m.receiveShadow = true; m.name = 'static'; scene.add(m); meshes++;
    }
    const ol = this.items.filter(i => i.outline).map(i => clean(i.g));
    if (ol.length) { const h = new THREE.Mesh(mergeGeometries(ol), outlineMat()); h.name = 'static:outline'; scene.add(h); }
    this.items = [];
    return meshes;
  }
}

// helper: make a mesh placed at x,y,z with rotation
export function M(geo, mat, x = 0, y = 0, z = 0, rx = 0, ry = 0, rz = 0) {
  const m = new THREE.Mesh(geo, mat); m.position.set(x, y, z); m.rotation.set(rx, ry, rz); m.castShadow = true; m.receiveShadow = true; return m;
}
export function G(x = 0, y = 0, z = 0, ry = 0) { const g = new THREE.Group(); g.position.set(x, y, z); g.rotation.y = ry; return g; }
// shade a hex colour (k<0 darker, k>0 lighter)
export function shade(hex, k) {
  const c = new THREE.Color(hex); const t = k < 0 ? new THREE.Color(0, 0, 0) : new THREE.Color(1, 1, 1);
  return '#' + c.lerp(t, Math.abs(k)).getHexString();
}
export function blobAt(w, d, op, x, z, y = 0.004) { const b = blob(w, d, op); b.position.set(x, y, z); return b; }
