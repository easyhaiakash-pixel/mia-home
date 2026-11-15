// actor.js: a flat cartoon character (drawn on a small canvas) standing in the 3D room.
// It always turns to face the camera (only around the vertical axis), sits in depth correctly (things in front hide it),
// and has a soft shadow at its feet.
import { THREE, blobAt } from './kit.js';

export class Actor {
  // o: { cw, ch (canvas px), unitScale (drawing units → px), origin:[ox,oy] px of drawing (0,0), anchorPx: y px of the feet,
  //      heightM: world height of the whole canvas, draw(g, state) }
  constructor(scene, o) {
    this.o = o;
    this.canvas = document.createElement('canvas'); this.canvas.width = o.cw; this.canvas.height = o.ch;
    this.g = this.canvas.getContext('2d');
    this.tex = new THREE.CanvasTexture(this.canvas); this.tex.colorSpace = THREE.SRGBColorSpace; this.tex.anisotropy = 4;
    const m = o.heightM / o.ch, w = o.cw * m, h = o.ch * m;
    const geo = new THREE.PlaneGeometry(w, h); geo.translate(0, h / 2 - (o.ch - o.anchorPx) * m, 0);
    this.mat = new THREE.MeshBasicMaterial({ map: this.tex, transparent: false, alphaTest: 0.5, side: THREE.DoubleSide, toneMapped: false });
    this.mesh = new THREE.Mesh(geo, this.mat); this.mesh.renderOrder = 2;
    this.group = new THREE.Group(); this.group.add(this.mesh);
    this.shadow = blobAt(0.62 * (o.shadow || 1), 0.42 * (o.shadow || 1), 0.75, 0, 0); this.group.add(this.shadow); this.shadow.position.y = 0.006;
    scene.add(this.group);
    this.key = '';
  }
  setState(state, key) {
    if (key === this.key) return;
    this.key = key;
    const g = this.g; g.clearRect(0, 0, this.o.cw, this.o.ch);
    this.o.draw(g, state);
    this.tex.needsUpdate = true;
  }
  place(x, y, z, camera, floorY = 0) {
    this.group.position.set(x, 0, z);
    this.mesh.position.y = y;
    this.shadow.position.y = floorY + 0.006;
    const dx = camera.position.x - x, dz = camera.position.z - z;
    this.mesh.rotation.y = Math.atan2(dx, dz);
  }
  tint(hex) { this.mat.color.set(hex); }
  set visible(v) { this.group.visible = v; }
  get visible() { return this.group.visible; }
  headPoint(scale = 1) { return this.group.position.clone().add(new THREE.Vector3(0, this.mesh.position.y + this.o.headM * scale, 0)); }
}
