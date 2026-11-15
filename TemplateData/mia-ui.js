// The page around the Unity game: HUD, speech bubble, menus, phone, A/B choice, fades.
// Unity calls MiaUI.call({op, ...}); the page answers with SendMessage('Game', 'OnUI', text).
(function () {
  const $ = id => document.getElementById(id);
  let unity = null, readyGame = false, loaded = false;
  const send = m => { if (unity) unity.SendMessage('Game', 'OnUI', m); };
  const bubble = () => $('bubble'), menu = () => $('menu');
  let typing = null, anchor = { x: .5, y: .3, mx: .5, my: .3 };
  const clamp = (v, a, b) => Math.max(a, Math.min(b, v));

  function place() {
    const b = bubble(), m = menu();
    if (b.style.display === 'block') { b.style.left = clamp(anchor.x * innerWidth, 130, innerWidth - 130) + 'px'; b.style.top = clamp(anchor.y * innerHeight, 120, innerHeight - 20) + 'px'; }
    if (m.style.display === 'flex') { m.style.left = clamp(anchor.mx * innerWidth, 110, innerWidth - 110) + 'px'; m.style.top = clamp(anchor.my * innerHeight, m.offsetHeight + 60, innerHeight - 10) + 'px'; }
  }

  // ---- speech bubble with typewriter; tap = finish text, tap again = next
  function say(o) {
    const b = bubble(), full = o.text, who = o.who || 'Mia';
    let shown = 0; const t0 = performance.now(); let done = false;
    if (typing) clearInterval(typing.iv);
    b.style.display = 'block';
    const draw = () => { b.innerHTML = `<span class="who">${who}</span>${full.slice(0, shown)}${shown >= full.length ? '<span class="next">tap ▸</span>' : ''}`; place(); };
    const finish = () => { if (done) return; done = true; clearInterval(iv); typing = null; b.style.display = 'none'; send('sayDone'); };
    const iv = setInterval(() => {
      shown = Math.max(shown, Math.min(full.length, Math.floor((performance.now() - t0) / 28)));
      draw();
      if (shown >= full.length && performance.now() - t0 > full.length * 50 + 1600) finish();
    }, 30);
    typing = { iv, skip: () => { if (shown < full.length) { shown = full.length; draw(); } else finish(); } };
    draw();
  }
  function skip() { if (typing) typing.skip(); }

  function showMenu(o) {
    const m = menu();
    m.innerHTML = `<div class="title">${o.title}</div>` + o.items.map((t, i) => `<button data-i="${i}">${t}</button>`).join('') + `<button data-i="x" style="opacity:.8">✕</button>`;
    m.style.display = 'flex'; place();
    m.onpointerdown = e => { e.stopPropagation(); const b = e.target.closest('button'); if (!b) return; m.style.display = 'none'; send('menu:' + b.dataset.i); };
  }
  function choice(o) {
    const box = $('choice');
    box.innerHTML = `<div class="q">${o.q}</div><div class="cards">
      <div class="card" data-k="A" style="background:#8fc8ff"><span class="l">A</span><div class="t">${o.a[0]}</div><div class="s">${o.a[1]}</div></div>
      <div class="card" data-k="B" style="background:#ff9fc0"><span class="l">B</span><div class="t">${o.b[0]}</div><div class="s">${o.b[1]}</div></div></div>`;
    box.style.display = 'flex';
    box.onpointerdown = e => { const c = e.target.closest('.card'); if (!c) return; e.stopPropagation(); box.style.display = 'none'; window.va && va('event', { name: 'choice', data: { pick: c.dataset.k } }); send('choice:' + c.dataset.k); };
  }
  function phone(o) {
    const p = $('phone');
    p.innerHTML = `<div class="dev"><div class="scr"><div class="bar">My Bank 💗</div><div class="bal">Balance</div><div class="amt">${o.money}</div>
      <div class="row"><span>Rent (due in ${o.rent} days)</span><span>-$900.00</span></div><div class="row"><span>Noodles × ${o.noodles}</span><span>-$${(o.noodles * 0.8).toFixed(2)}</span></div><div class="row"><span>Bus pass</span><span>-$45.00</span></div>
      <button class="btn close">Close</button></div></div>`;
    p.style.display = 'flex';
    p.onpointerdown = e => { if (e.target.closest('.close') || e.target === p) { e.stopPropagation(); p.style.display = 'none'; send('phoneDone'); } };
  }
  function hud(o) {
    $('place').innerHTML = o.place === 'cafe' ? '☕ <b>Bloom Café</b>' : '🏠 <b>Home</b>';
    $('money').textContent = o.money; $('rent').textContent = o.rent;
    $('bMood').textContent = o.mood === 'night' ? '😴' : '🌙';
    $('bMood').title = o.mood === 'night' ? 'Sleep till morning' : 'Night';
  }
  function fade(o) {
    const f = $('fade');
    if (o.on) { f.textContent = o.text || ''; f.style.pointerEvents = 'auto'; f.style.opacity = 1; }
    else { f.style.opacity = 0; f.style.pointerEvents = 'none'; }
  }

  function startScreen() {
    if (!readyGame || !loaded) return;
    $('lmsg').textContent = 'Mia is waiting for you.'; $('bar').style.display = 'none';
    const s = $('start'); s.style.display = 'inline-block';
    s.onclick = () => { $('loading').style.opacity = 0; setTimeout(() => $('loading').style.display = 'none', 600); send('start'); setTimeout(() => $('hint').style.opacity = 0, 9000); };
  }

  window.MiaUI = {
    progress(p) { $('bar').firstElementChild.style.width = Math.round(p * 100) + '%'; },
    attach(u) { unity = u; window.miaUnity = u; loaded = true; startScreen(); },
    error(e) { $('lmsg').textContent = 'Could not load: ' + e; console.error(e); },
    call(o) {
      switch (o.op) {
        case 'ready': readyGame = true; startScreen(); break;
        case 'hud': hud(o); break;
        case 'say': say(o); break;
        case 'skip': skip(); break;
        case 'menu': showMenu(o); break;
        case 'hideMenu': menu().style.display = 'none'; break;
        case 'choice': choice(o); break;
        case 'phone': phone(o); break;
        case 'fade': fade(o); break;
        case 'anchor': anchor = o; place(); break;
        case 'tip': { const t = $('tip'); if (!o.text) t.style.display = 'none'; else { t.textContent = o.text; t.style.display = 'block'; t.style.left = o.x * innerWidth + 'px'; t.style.top = o.y * innerHeight + 'px'; } break; }
        case 'cursor': document.getElementById('unity-canvas').style.cursor = o.pointer ? 'pointer' : 'default'; break;
        case 'ripple': { const r = $('ripple'); r.style.left = o.x * innerWidth + 'px'; r.style.top = o.y * innerHeight + 'px'; r.classList.remove('go'); void r.offsetWidth; r.classList.add('go'); break; }
        case 'state': console.log('MIA STATE', JSON.stringify(o)); window.miaState = o; break;
      }
    },
  };
  addEventListener('DOMContentLoaded', () => {
    bubble().addEventListener('pointerdown', e => { e.stopPropagation(); skip(); });
    $('bMood').onclick = () => send('mood');
    $('bHelp').onclick = () => { const h = $('hint'); h.style.opacity = 1; h.textContent = 'Tap the floor to walk · tap things (bed, phone, lamp, door…) to use them · drag to turn the camera'; setTimeout(() => h.style.opacity = 0, 6000); };
  });
})();
