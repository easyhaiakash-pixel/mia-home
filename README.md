# Mia's 3D sets (three.js)

The two sets for the "Her Story, Your Choice" Reels:
1. **studio**: Mia's tiny studio apartment (bed, mini kitchen, fridge with bills, window with the dead plant, front door with the rent notice).
2. **cafe**: "Bloom Café" (counter, coffee machine, cake display, tables, Adrian's window table, the street with the black car).

Everything is drawn in code: no downloaded models. Soft toon look with thin brown outlines, background blur, glow and vignette.
Mia is **not** in 3D. The film draws her (`drawMia`) on top.

## Look at it
```
node serve.js        → open http://127.0.0.1:7811/viewer.html
```
Buttons: set, shot, day/night, play the camera move (0–3 s), Mia on/off, blur on/off, Mia's face.

## Use it in a film
```js
const { createSet } = await import('../../../her-story/home-3d/sets.js');   // path from your film folder
const set = await createSet('studio', { width: 1080, height: 1920 });          // or 'cafe'. Do this once, then window.READY = true

// in renderOut(t): one picture = a pure function of these inputs
set.render({ shot: 'studio-wide', t: tInShot, mood: 'night', focus: 'subject', props: { bedLamp: true } });
g.drawImage(set.canvas, 0, 0);                       // 1) the room
const s = set.subjectSpot('studio-wide', tInShot);    // 2) Mia
drawMia(g, s.x, s.y, s.scale, { mood: 'sad' });
g.drawImage(set.front, 0, 0);                        // 3) things in front of Mia (bed blanket, café counter); empty in other shots
```
- `focus`: `'subject'` (background soft), `'all'` (sharp), `'soft'` (everything blurred, for the A/B choice cards).
- `s.bottom` = where Mia's shoulders end. Shots are set up so her shoulders run off the bottom of the frame, or hide behind `set.front`.
- `set.project([x,y,z], shot, t)` → screen point (for other characters). Named places: `set.spots` (e.g. `adrianChair`, `counter`, `door`).
- `set.screenRect('rentNotice', shot, t)` → box on screen (to highlight a prop). `set.quad('phone', shot, t)` → the 4 screen corners of the phone screen (or `'napkinNote'`), to draw sharp text on top.
- `set.dispose()` when done.

## Shots (each = one slow camera move over 3 s)
| Set | Shots |
|---|---|
| studio | `studio-wide`, `studio-bed`, `studio-phone`, `studio-door`, `studio-window`, `studio-fridge` |
| cafe | `cafe-wide`, `cafe-counter`, `cafe-corner`, `cafe-table-close`, `cafe-window-street` |

## Props (`props: {...}` in `render`)
**Studio**
| Prop | Value |
|---|---|
| `rentNotice` | text (`'3 DAYS'`, `'2 DAYS'`, `'LAST WARNING'`), a canvas, or `false` to hide |
| `deadPlantDroop` | 0 (sad) … 1 (fully flopped) |
| `phoneLift` | 0 = lying on the bed … 1 = in her hand (default 1 in `studio-phone`) |
| `phoneScreen` | a canvas (bank app, messages...). `phoneGlow` 0–2 |
| `coinJar` | fill 0–1 |
| `bedLamp`, `fairyLights`, `doorLamp` | true/false (default: on at night) |
| `noodleCup`, `fridgeBills`, `duvetRoll` | false hides them |

**Café**
| Prop | Value |
|---|---|
| `adrianCup` | 0 on the saucer … 1 lifted (`false` hides) |
| `napkinOpen` | 0 folded … 1 open. `napkinNote` = a canvas with the handwriting |
| `cashStack` | 0–10 bills (fanned out when more than 1) |
| `doorBell` | seconds since the bell rang (it swings and settles) |
| `blackCar` | 0 … 1 = drives past outside (leave out = no car) |
| `tipJar` | fill 0–1 |
| `fairyLights` | true/false |

## Checks
```
node make-plates.js          → checks/NN-<shot>-<mood>.png (+ -mia), checks/move-<shot>.png (t = 0, 1.5, 3), checks/report.txt
node make-plates.js part1    → checks/p01-shot-01.png … 14 (every shot of scripts/S1-P01-twelve-dollars.md)
node make-plates.js snap studio studio-wide night 1.5   → checks/snap.png (quick look)
```
Overview pictures: `checks/00-all-shots-with-mia.png`, `checks/00-part1-all-shots.png`.
Uses VideoHub's puppeteer-core and Google Chrome. Mia's drawing is copied from `../art/character-design/mia.js` into `vendor/mia.js` each run.

## Add a shot, prop or set
- **Shot:** add a line to `presets` at the bottom of `parts/studio.js` or `parts/cafe.js`:
  `from` / `to` = camera position `p`, look-at point `at`, lens `fov`. `mia: { sx: 0.3, d: 1.8 }` = Mia's place
  (sx = across the screen 0–1, d = how far from the camera in metres), or `mia: [x, y, z]` + `front: true` when she stands behind something.
- **Prop:** build it in the set file, `scene.add` it (not `st.add`, which freezes furniture for speed), put it in `objects`, move it in `update(p, t)`.
  Only use `t` and the props: no `Math.random`, no clock.
- **New set:** copy `parts/cafe.js`, rename the builder, add it to `BUILDERS` in `sets.js`.

## Files
| File | What |
|---|---|
| `sets.js` | the module (`createSet`) |
| `parts/kit.js` | toon materials, outlines, shapes, fake shadows, glows, merged furniture |
| `parts/post.js` | blur (depth of field), glow, colour mood, vignette |
| `parts/room.js` | walls with windows/doors, wallpaper, floor, trims |
| `parts/textures.js`, `parts/props-common.js` | painted textures, plants, chairs, mugs, lamps, fairy lights, phone |
| `parts/studio.js`, `parts/cafe.js` | the two sets + their camera shots |
| `viewer.html`, `serve.js`, `make-plates.js` | viewer + checks |
| `vendor/` | three.js (r17x, MIT) + a copy of `mia.js` |
