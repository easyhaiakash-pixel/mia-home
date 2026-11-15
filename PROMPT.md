# Build Mia's 3D sets (three.js): her tiny studio + the café, for the "Her Story, Your Choice" Reels

Read this whole file before you start. The owner is not a developer, so make every decision yourself and write simple English in all notes. **Do not post or publish anything.**

## 1. What this is for
"Her Story, Your Choice" is a daily cartoon drama on Instagram (vertical Reels, 1080×1920, under 60 s). The main character **Mia** (26) is **single, works as a waitress, and is broke**. Most of Season 1 happens in two places:
1. **Mia's tiny studio apartment** (where she lives alone)
2. **The café** where she works (where the mysterious rich customer sits every day)

You are building these two **sets** in three.js, reused in every episode. The characters are **not** 3D. They are flat 2D cartoon drawings (`drawMia` in `~/personal/her-story/art/character-design/mia.js`) painted **on top of** your 3D frames. So the sets must look great **behind** a 2D character, with a softly blurred background and a clear floor spot where she stands.

## 2. Read first
- `~/personal/her-story/SERIES_BIBLE.md`: the series, cast and places
- `~/personal/her-story/scripts/S1-P01-twelve-dollars.md`: Part 1 script. **Every shot in it must be possible with your camera presets.**
- `~/personal/her-story/art/character-design/02-mia-character-sheet-cute.png`: Mia's look. Your colours must sit well next to her.
- `~/personal/one-life/STYLE.md` ("Style test 2") and `~/personal/one-life/style-tests/02-day1-cute-style.png`: **the look to match**
- `~/personal/videohub-workspace/films/one-life-day2/film.js`: how our films work (canvas, `renderOut(t)` = a pure function of time, `VH_SCENES`, render with `render.js`)
- The VideoHub skill (load it) for how films are previewed and rendered

## 3. Look (strict)
- **Soft kawaii style:** pastel colours, rounded furniture, thin warm-brown outlines (`#6b4046`, inverted-hull or edge pass, about 2–3 px at 1080 wide), toon/gradient shading, soft fake shadows.
- **Draw every object in code** (three.js geometry + materials + small canvas textures you paint yourself). **Never** use downloaded kit models (Kenney, Poly Pizza, Sketchfab and so on). Nothing may look grey, blocky or "programmer art".
- **Depth of field / soft background blur** behind the subject spot (like One Life: background clearly soft, subject area sharp), plus a gentle vignette.
- **Two lighting moods** per set, switchable per shot:
  - `day`: warm sunlight through the windows, pink-peach tones
  - `night`: cool blue window light, warm lamp pools, a string of fairy lights glowing
- Light must come from things you can see (window, lamp, phone screen, café pendant lights).

## 4. Set A: Mia's tiny studio apartment
**Small, cosy, a little messy, clearly on a tight budget, but cute** (she makes the most of it):
- Single bed against the wall with a pink-cream blanket and a big plush pillow
- Mini kitchen: two-ring stove, kettle, **instant noodle cups**, one mug, a tiny fridge covered in **bills and sticky notes** ("PAY RENT!!", "electric $84")
- One window with city lights at night and a **small dead plant** on the sill (Part 1 joke)
- Cheap fairy lights over the bed, a small mirror, a chair with her **café apron** hanging on it
- Front door (inside view) with a **rent notice** taped on it
- A tiny table with a laptop and a jar of coins

## 5. Set B: the café ("Bloom Café")
**Bright, busy, pretty** (pastel pink + mint + warm wood):
- Counter with a coffee machine, cake display, tip jar, menu board
- Tables and chairs; customers are simple flat 2D silhouettes added by the film (leave room for them)
- **Adrian's corner table** by the big window: two chairs, a small vase with one flower, street outside (a black car can drive past)
- Front door with a bell
- Pendant lights, plants, a "Bloom Café" sign in the window (drawn in code)

## 6. Props that must exist as separate objects (the films animate or highlight them)
**Studio:** `rentNotice` (texture can change: "3 DAYS", "2 DAYS", "LAST WARNING"), `deadPlant` (can droop more), `phone` (screen texture set by the film, glows), `noodleCup`, `fridgeBills`, `coinJar` (fill level 0–1), `bedLamp` (on/off), `fairyLights` (twinkle, as a function of time, never random)
**Café:** `adrianCup` (can be lifted), `napkinNote` (can unfold; texture set by the film), `cashStack` (fan of $100 bills, 0–10 bills showing), `doorBell` (swings), `blackCar` (drives past outside; position 0–1), `tipJar`

## 7. API the films will use
Make one ES module, `sets.js`, with no build step needed:

```js
const set = await createSet('studio', { width: 1080, height: 1920 });   // or 'cafe'
// draw one frame. MUST be a pure function of its inputs (same input = same picture)
set.render({
  shot: 'cafe-table-close', // a camera preset name (below)
  t: 3.2,                   // seconds since the shot started (slow camera moves, fairy lights, car)
  mood: 'day',              // 'day' | 'night'
  focus: 'subject',         // 'subject' (blur background) | 'all' (sharp)
  props: { cashStack: 10, napkinOpen: 1, blackCar: 0.4 }
});
set.canvas;                    // the WebGL canvas; the film draws it with ctx.drawImage(set.canvas, 0, 0)
set.subjectSpot('cafe-wide');  // { x, y, scale } in 1080×1920 screen space: where to draw Mia
set.dispose();
```
- **Deterministic:** no `Math.random()` at render time, no clock. Time only from `t`.
- **Each camera preset** = start pose + end pose + one slow smooth move over the shot (no jumps, nothing appears or disappears mid-shot).

## 8. Camera presets (vertical 9:16). Name them exactly like this.
| Preset | Set | What we see | Part 1 |
|---|---|---|---|
| `studio-wide` | studio | Whole studio, bed, mini kitchen, window | |
| `studio-bed` | studio | Medium on the bed (Mia sits on the edge) | |
| `studio-phone` | studio | Very close on the phone screen (fills about 40% of the frame) | yes |
| `studio-door` | studio | Inside of the front door with the rent notice | yes |
| `studio-window` | studio | Window, city lights, the dead plant; Mia's spot beside it | yes |
| `studio-fridge` | studio | Fridge covered in bills | |
| `cafe-wide` | café | The whole café, counter and tables, Mia's spot in the middle | yes |
| `cafe-counter` | café | Behind the counter, coffee machine, staff tip jar | yes |
| `cafe-corner` | café | Adrian's corner table by the window (his spot + Mia's spot) | yes |
| `cafe-table-close` | café | Very close on his table top: cup, napkin, cash | yes |
| `cafe-window-street` | café | Looking out of the window at the street (black car at a red light) | yes |

Each preset also returns its `subjectSpot` (where Mia's feet or face go), so she always stands on the floor at the right size.

## 9. Viewer + plates (for checking without a film)
- `viewer.html`: set switch (studio/café), buttons for every preset, a day/night toggle, a "play shot" button (plays `t` from 0 to 3 s), and a **Mia overlay toggle** that draws `drawMia` at `subjectSpot`, so we can judge how she sits in the set.
- `make-plates.js` (puppeteer + headless Chrome, like `render.js` in the films): writes a PNG of every preset × mood at 1080×1920, with and without Mia, into `checks/`.

## 10. Speed
- Renders a frame in under 150 ms in headless Chrome at 1080×1920 (the film renderer captures frame by frame).
- Merge static furniture; keep textures small (512 px is plenty for most things).

## 11. Folder
Everything in `~/personal/her-story/home-3d/`:
```
home-3d/
  PROMPT.md          (this file)
  README.md          (what it is, how to use it in a film, how to add a set or prop)
  sets.js            (the module)
  parts/             (rooms + props, one file each)
  viewer.html
  make-plates.js
  checks/            (numbered PNGs)
```

## 12. Checks before you say "done"
1. Run `make-plates.js`. Look at **every** plate with Mia on top: does it look like the same cute world as `02-day1-cute-style.png` and Mia's sheet? Is she the right size, standing on the floor, sharp against a softly blurred background? Does the studio read as "small and broke but cute", and the café as "bright and busy"? Redraw anything plain, grey or blocky.
2. Check at least 3 frames of each preset's camera move (t = 0, 1.5, 3). The move must be slow and smooth, with nothing appearing or disappearing mid-shot.
3. Render the same preset twice with the same input: the PNGs must be identical (deterministic).
4. Part 1 test: make every shot in `scripts/S1-P01-twelve-dollars.md` as a plate (mood and props as the script says), save them as `checks/p01-shot-XX.png`, and open them.
5. Open the check images so the owner can see them (images only, never open text files).

When everything passes, write a short report in simple English: what was built, the check image paths, and anything the owner must decide.
