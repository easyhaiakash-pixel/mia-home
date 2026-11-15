// sets.js: Mia's 3D sets for "Her Story, Your Choice" (three.js, no build step).
//
//   import { createSet } from './home-3d/sets.js';
//   const set = await createSet('studio', { width: 1080, height: 1920 });   // or 'cafe'
//   set.render({ shot: 'studio-wide', t: 1.2, mood: 'night', focus: 'subject', props: { bedLamp: true } });
//   ctx.drawImage(set.canvas, 0, 0);            // the room (behind Mia)
//   const s = set.subjectSpot('studio-wide', 1.2); drawMia(ctx, s.x, s.y, s.scale, {...});
//   ctx.drawImage(set.front, 0, 0);             // things in FRONT of Mia (only some shots have them; else empty)
//
// Every frame is a pure function of (shot, t, mood, focus, props). No clock, no Math.random.
import { THREE, Statics, outlineUniforms, easeIO, clamp, lerp } from './parts/kit.js';
import { Post } from './parts/post.js';
import { buildStudio } from './parts/studio.js';
import { buildCafe } from './parts/cafe.js';

const BUILDERS = { studio: buildStudio, cafe: buildCafe };
// Mia's drawing (mia.js): face centre = (x, y); at scale 1 her head is ~320 px wide and her shoulders end 350 px below.
const MIA_HEAD_PX = 320, MIA_BOTTOM_PX = 350;

export const SET_NAMES = Object.keys(BUILDERS);

export async function createSet(name, opts = {}) {
  const W = opts.width || 1080, H = opts.height || 1920;
  if (!BUILDERS[name]) throw new Error(`createSet: unknown set "${name}" (use ${SET_NAMES.join(' or ')})`);
  const glCanvas = opts.glCanvas || document.createElement('canvas');
  glCanvas.width = W; glCanvas.height = H;
  const renderer = new THREE.WebGLRenderer({ canvas: glCanvas, antialias: false, alpha: true, premultipliedAlpha: true, preserveDrawingBuffer: true, powerPreference: 'high-performance' });
  renderer.setPixelRatio(1); renderer.setSize(W, H, false);
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.toneMapping = THREE.NoToneMapping;
  renderer.shadowMap.enabled = true; renderer.shadowMap.type = THREE.PCFSoftShadowMap; renderer.shadowMap.autoUpdate = false;
  outlineUniforms.uRes.value.set(W, H); outlineUniforms.uPx.value = 2.6 * W / 1080;

  const scene = new THREE.Scene();
  const statics = new Statics();
  const camera = new THREE.PerspectiveCamera(50, W / H, 0.05, 60);
  const set = BUILDERS[name]({ THREE, scene, statics, W, H });
  statics.build(scene);
  scene.traverse(o => { if (o.isLight) o.layers.enable(1); });
  const post = new Post(renderer, W, H);

  // 2D output canvases (what the film draws)
  const mk = () => { const c = document.createElement('canvas'); c.width = W; c.height = H; return c; };
  const back = mk(), front = mk();
  const bctx = back.getContext('2d'), fctx = front.getContext('2d');

  const tmpA = new THREE.Vector3(), tmpB = new THREE.Vector3();
  function pose(shot, t = 0) {
    const P = set.presets[shot];
    if (!P) throw new Error(`unknown shot "${shot}" for set "${name}". Shots: ${Object.keys(set.presets).join(', ')}`);
    const k = easeIO(clamp(t / (P.len || 3)));
    tmpA.fromArray(P.from.p).lerp(tmpB.fromArray(P.to.p), k);
    camera.position.copy(tmpA);
    const at = new THREE.Vector3().fromArray(P.from.at).lerp(new THREE.Vector3().fromArray(P.to.at), k);
    camera.fov = lerp(P.from.fov, P.to.fov ?? P.from.fov, k);
    camera.up.set(0, 1, 0); camera.lookAt(at);
    if (P.roll) camera.rotateZ(lerp(P.roll[0], P.roll[1], k));
    camera.updateProjectionMatrix(); camera.updateMatrixWorld(true);
    return P;
  }
  function project(p, shot, t = 0) {
    if (shot) pose(shot, t);
    const v = new THREE.Vector3().fromArray(p);
    const depth = -v.clone().applyMatrix4(camera.matrixWorldInverse).z;
    v.project(camera);
    return { x: (v.x * 0.5 + 0.5) * W, y: (-v.y * 0.5 + 0.5) * H, depth };
  }
  const focalPx = () => (H / 2) / Math.tan(THREE.MathUtils.degToRad(camera.fov) / 2);

  const miaCache = {};
  function miaWorld(shot) {
    if (miaCache[shot]) return miaCache[shot];
    const P = set.presets[shot]; let w;
    if (Array.isArray(P.mia)) w = new THREE.Vector3().fromArray(P.mia);
    else {
      pose(shot, (P.len || 3) / 2);   // anchor at the middle of the move, so she drifts only a little each way
      const d = P.mia.d, scale = (P.miaW || 0.42) * focalPx() / d / MIA_HEAD_PX;
      const sy = H + (P.mia.pad ?? 40) - MIA_BOTTOM_PX * scale, sx = P.mia.sx * W;
      const ndc = new THREE.Vector3(sx / W * 2 - 1, -(sy / H * 2 - 1), 0.5).unproject(camera);
      const dir = ndc.sub(camera.position).normalize();
      const fwd = new THREE.Vector3(); camera.getWorldDirection(fwd);
      w = camera.position.clone().add(dir.multiplyScalar(d / dir.dot(fwd)));
    }
    return (miaCache[shot] = w);
  }
  let lastMood = null;
  const api = {
    name, canvas: back, front, glCanvas, three: THREE, scene, camera,
    objects: set.objects,            // the named props (three.js objects) for films that want to do more
    shots: Object.keys(set.presets),
    spots: set.spots || {},          // named world spots (x,y,z) for other characters: use set.project()
    hasFront: shot => !!set.presets[shot]?.front,
    render(o = {}) {
      const shot = o.shot || api.shots[0], t = +o.t || 0, mood = o.mood === 'day' ? 'day' : 'night';
      const P = pose(shot, t);
      if (mood !== lastMood) { set.setMood(mood); lastMood = mood; }
      const props = Object.assign({}, set.defaults || {}, P.props || {}, o.props || {});
      set.update(props, t, mood, shot);
      scene.updateMatrixWorld(true);
      // focus: Mia's face (or the preset's focus point), measured along the view direction
      const fp = P.focus ? new THREE.Vector3().fromArray(P.focus) : P.mia ? miaWorld(shot).clone() : new THREE.Vector3().fromArray(P.to.at);
      pose(shot, t);
      const focusDist = Math.max(0.2, -fp.applyMatrix4(camera.matrixWorldInverse).z);
      camera.layers.set(0);
      renderer.shadowMap.needsUpdate = true;
      const blur = o.focus === 'all' ? 0 : (o.focus === 'soft' ? 2.2 : (P.blur ?? 1));
      post.render(scene, camera, { focusDist, blur, look: set.look(mood, props) });
      bctx.clearRect(0, 0, W, H); bctx.drawImage(glCanvas, 0, 0);
      fctx.clearRect(0, 0, W, H);
      if (P.front) {
        camera.layers.set(1);
        post.renderFront(scene, camera);
        fctx.drawImage(glCanvas, 0, 0);
        camera.layers.set(0);
      }
      return api;
    },
    // where to draw Mia: { x, y, scale } for drawMia(ctx, x, y, scale). bottom = where her shoulders end.
    subjectSpot(shot, t = 0) {
      const P = set.presets[shot];
      if (!P || !P.mia) return null;
      const w = miaWorld(shot);
      pose(shot, t);
      const s = project(w.toArray());
      const scale = (P.miaW || 0.42) * focalPx() / s.depth / MIA_HEAD_PX;
      return { x: s.x, y: s.y, scale, bottom: s.y + MIA_BOTTOM_PX * scale, depth: s.depth, front: !!P.front };
    },
    // any world point → screen (for other characters, highlights, crisp text over a prop)
    project(p, shot, t = 0) { return project(p, shot, t); },
    // screen box of a named prop (e.g. 'phone', 'rentNotice') at this shot/time — after a render() with the same props
    screenRect(objName, shot, t = 0) {
      const o = set.objects[objName]; if (!o) return null;
      pose(shot, t); o.updateMatrixWorld(true);
      const box = new THREE.Box3().setFromObject(o); const pts = [];
      for (let i = 0; i < 8; i++) pts.push(new THREE.Vector3(i & 1 ? box.max.x : box.min.x, i & 2 ? box.max.y : box.min.y, i & 4 ? box.max.z : box.min.z));
      const sp = pts.map(p => project(p.toArray()));
      const xs = sp.map(p => p.x), ys = sp.map(p => p.y);
      return { x: Math.min(...xs), y: Math.min(...ys), w: Math.max(...xs) - Math.min(...xs), h: Math.max(...ys) - Math.min(...ys) };
    },
    // the phone / napkin screen corners on screen (to draw crisp text in 2D instead of a texture)
    quad(objName, shot, t = 0) {
      const o = set.objects[objName + 'Screen'] || set.objects[objName]; if (!o || !o.geometry) return null;
      pose(shot, t); o.updateMatrixWorld(true);
      o.geometry.computeBoundingBox(); const b = o.geometry.boundingBox;
      return [[b.min.x, b.max.y], [b.max.x, b.max.y], [b.max.x, b.min.y], [b.min.x, b.min.y]].map(([x, y]) => project(new THREE.Vector3(x, y, b.max.z).applyMatrix4(o.matrixWorld).toArray()));
    },
    info: () => ({ calls: renderer.info.render.calls, triangles: renderer.info.render.triangles, textures: renderer.info.memory.textures }),
    dispose() {
      post.dispose();
      scene.traverse(o => { if (o.geometry) o.geometry.dispose(); const m = o.material; (Array.isArray(m) ? m : m ? [m] : []).forEach(mm => { for (const k in mm) if (mm[k] && mm[k].isTexture) mm[k].dispose(); mm.dispose(); }); });
      renderer.dispose(); renderer.forceContextLoss?.();
    },
  };
  return api;
}
