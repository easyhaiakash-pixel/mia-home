// post.js: the "camera lens" pass after the 3D render.
// 1) soft background blur (depth of field): sharp at the subject distance, softer the further away,
// 2) a little glow around bright lights (lamps, fairy lights, screens), 3) colour mood, 4) gentle vignette.
// Everything is a pure function of the inputs (no noise, no time).
import { THREE } from './kit.js';

const VS = `varying vec2 vUv; void main(){ vUv = uv; gl_Position = vec4(position.xy, 0.0, 1.0); }`;

const BLUR_FS = `uniform sampler2D tSrc; uniform vec2 uDir; varying vec2 vUv;
void main(){
  vec4 c = texture2D(tSrc, vUv) * 0.2270270270;
  c += texture2D(tSrc, vUv + uDir * 1.3846153846) * 0.3162162162;
  c += texture2D(tSrc, vUv - uDir * 1.3846153846) * 0.3162162162;
  c += texture2D(tSrc, vUv + uDir * 3.2307692308) * 0.0702702703;
  c += texture2D(tSrc, vUv - uDir * 3.2307692308) * 0.0702702703;
  gl_FragColor = c;
}`;
const COPY_FS = `uniform sampler2D tSrc; uniform vec2 uTexel; varying vec2 vUv;
void main(){
  vec4 c = texture2D(tSrc, vUv + uTexel * vec2(-0.5,-0.5)) + texture2D(tSrc, vUv + uTexel * vec2(0.5,-0.5))
         + texture2D(tSrc, vUv + uTexel * vec2(-0.5,0.5)) + texture2D(tSrc, vUv + uTexel * vec2(0.5,0.5));
  gl_FragColor = c * 0.25;
}`;
const COMP_FS = `uniform sampler2D tColor; uniform sampler2D tDepth; uniform sampler2D tHalf; uniform sampler2D tQuarter; uniform sampler2D tGlow;
uniform float uNear; uniform float uFar; uniform float uFocus; uniform float uBlur; uniform float uFront;
uniform vec3 uTint; uniform vec3 uLift; uniform float uGlow; uniform float uVig; uniform vec3 uVigCol; uniform float uSat;
varying vec2 vUv;
float lin(float d){ float z = d * 2.0 - 1.0; return (2.0 * uNear * uFar) / (uFar + uNear - z * (uFar - uNear)); }
void main(){
  vec4 sharp = texture2D(tColor, vUv);
  vec3 col = sharp.rgb;
  float a = sharp.a;
  if (uFront < 0.5) {
    float dz = lin(texture2D(tDepth, vUv).x);
    float back = clamp((dz - uFocus) / (uFocus * 1.1 + 1.2), 0.0, 1.0);
    float frontB = clamp((uFocus - dz) / (uFocus * 0.7), 0.0, 1.0) * 0.5;
    float coc = clamp(max(back, frontB) * uBlur, 0.0, 1.0);
    vec3 h = texture2D(tHalf, vUv).rgb, q = texture2D(tQuarter, vUv).rgb;
    col = coc < 0.4 ? mix(col, h, smoothstep(0.0, 0.4, coc)) : mix(h, q, smoothstep(0.4, 1.0, coc));
    vec3 gl = texture2D(tGlow, vUv).rgb;
    float glL = dot(gl, vec3(0.299, 0.587, 0.114)); col += gl * smoothstep(0.86, 1.05, glL) * uGlow;
  }
  // colour mood
  col = col * uTint + uLift * (1.0 - col);
  float l = dot(col, vec3(0.299, 0.587, 0.114));
  col = mix(vec3(l), col, uSat);
  // soft highlight roll-off (keeps pastel, no harsh white)
  col = col / (1.0 + max(col - 0.85, 0.0) * 1.6);
  // vignette
  vec2 p = vUv - 0.5; p.x *= 0.75;
  float v = smoothstep(0.32, 0.78, length(p));
  col = mix(col, col * uVigCol, v * uVig);
  gl_FragColor = vec4(col * (uFront > 0.5 ? a : 1.0), uFront > 0.5 ? a : 1.0);
  #include <colorspace_fragment>
}`;

export class Post {
  constructor(renderer, w, h) {
    this.r = renderer; this.w = w; this.h = h;
    const opt = { type: THREE.HalfFloatType, colorSpace: THREE.LinearSRGBColorSpace };
    this.main = new THREE.WebGLRenderTarget(w, h, { ...opt, samples: 4, depthTexture: new THREE.DepthTexture(w, h) });
    this.main.depthTexture.type = THREE.UnsignedIntType;
    this.front = new THREE.WebGLRenderTarget(w, h, { ...opt, samples: 4 });
    this.half = new THREE.WebGLRenderTarget(w >> 1, h >> 1, opt);
    this.halfB = new THREE.WebGLRenderTarget(w >> 1, h >> 1, opt);
    this.q = new THREE.WebGLRenderTarget(w >> 2, h >> 2, opt);
    this.qB = new THREE.WebGLRenderTarget(w >> 2, h >> 2, opt);
    this.e = new THREE.WebGLRenderTarget(w >> 3, h >> 3, opt);
    this.eB = new THREE.WebGLRenderTarget(w >> 3, h >> 3, opt);
    this.cam = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1);
    this.quad = new THREE.Mesh(new THREE.PlaneGeometry(2, 2));
    this.sc = new THREE.Scene(); this.sc.add(this.quad);
    this.blurM = new THREE.ShaderMaterial({ uniforms: { tSrc: { value: null }, uDir: { value: new THREE.Vector2() } }, vertexShader: VS, fragmentShader: BLUR_FS, depthTest: false, depthWrite: false });
    this.copyM = new THREE.ShaderMaterial({ uniforms: { tSrc: { value: null }, uTexel: { value: new THREE.Vector2() } }, vertexShader: VS, fragmentShader: COPY_FS, depthTest: false, depthWrite: false });
    this.compM = new THREE.ShaderMaterial({
      uniforms: {
        tColor: { value: null }, tDepth: { value: this.main.depthTexture }, tHalf: { value: this.half.texture }, tQuarter: { value: this.q.texture }, tGlow: { value: this.e.texture },
        uNear: { value: 0.05 }, uFar: { value: 60 }, uFocus: { value: 3 }, uBlur: { value: 1 }, uFront: { value: 0 },
        uTint: { value: new THREE.Vector3(1, 1, 1) }, uLift: { value: new THREE.Vector3(0, 0, 0) }, uGlow: { value: 0.8 }, uVig: { value: 0.5 }, uVigCol: { value: new THREE.Vector3(0.6, 0.45, 0.5) }, uSat: { value: 1 },
      }, vertexShader: VS, fragmentShader: COMP_FS, depthTest: false, depthWrite: false, transparent: false,
    });
  }
  pass(mat, target) { this.quad.material = mat; this.r.setRenderTarget(target); this.r.render(this.sc, this.cam); }
  down(src, dst, sw, sh) { this.copyM.uniforms.tSrc.value = src.texture; this.copyM.uniforms.uTexel.value.set(1 / sw, 1 / sh); this.pass(this.copyM, dst); }
  blur(a, b, w, h, k = 1) {
    const u = this.blurM.uniforms;
    u.tSrc.value = a.texture; u.uDir.value.set(k / w, 0); this.pass(this.blurM, b);
    u.tSrc.value = b.texture; u.uDir.value.set(0, k / h); this.pass(this.blurM, a);
  }
  // look = { tint:[r,g,b], lift:[r,g,b], glow, vig, vigCol:[..], sat }
  render(scene, camera, o) {
    const { w, h } = this, r = this.r;
    r.setRenderTarget(this.main); r.setClearColor(0x000000, 1); r.clear(); r.render(scene, camera);
    // blur pyramid
    this.down(this.main, this.half, w, h); this.blur(this.half, this.halfB, w >> 1, h >> 1, 1.0);
    this.down(this.half, this.q, w >> 1, h >> 1); this.blur(this.q, this.qB, w >> 2, h >> 2, 1.6); this.blur(this.q, this.qB, w >> 2, h >> 2, 2.6);
    this.down(this.q, this.e, w >> 2, h >> 2); this.blur(this.e, this.eB, w >> 3, h >> 3, 1.5); this.blur(this.e, this.eB, w >> 3, h >> 3, 2.5);
    const u = this.compM.uniforms, L = o.look;
    u.tColor.value = this.main.texture; u.uFront.value = 0;
    u.uNear.value = camera.near; u.uFar.value = camera.far; u.uFocus.value = o.focusDist; u.uBlur.value = o.blur;
    u.uTint.value.set(...L.tint); u.uLift.value.set(...L.lift); u.uGlow.value = L.glow; u.uVig.value = L.vig; u.uVigCol.value.set(...L.vigCol); u.uSat.value = L.sat;
    this.pass(this.compM, null);
  }
  // foreground layer (objects in front of Mia), transparent around them, no blur
  renderFront(scene, camera) {
    const r = this.r;
    const bg = scene.background; scene.background = null;
    r.setRenderTarget(this.front); r.setClearColor(0x000000, 0); r.clear(); r.render(scene, camera);
    scene.background = bg;
    const u = this.compM.uniforms; u.tColor.value = this.front.texture; u.uFront.value = 1;
    r.setClearColor(0x000000, 0); r.setRenderTarget(null); r.clear();
    this.pass(this.compM, null);
    u.tColor.value = this.main.texture; u.uFront.value = 0;
  }
  dispose() { [this.main, this.front, this.half, this.halfB, this.q, this.qB, this.e, this.eB].forEach(t => t.dispose()); this.blurM.dispose(); this.copyM.dispose(); this.compM.dispose(); this.quad.geometry.dispose(); }
}
