// Mia's birthday wardrobe: clothes viewers can shop (USA + India) with our Amazon tags.
// EDIT THIS LIST to change what shows. q = what Amazon searches for. Later you can swap a search for one exact product:
// put its SiteStripe link in us: '...' / in: '...' instead of the search.
const MIA_TAGS = { us: 'onelifegifts-20', in: 'onelifegifts-21' };
const MIA_WARDROBE = [
  { e: '👗', name: 'Pink birthday dress', q: 'women pink birthday party dress' },
  { e: '🖤', name: 'Little black dress', q: 'women little black dress' },
  { e: '🌸', name: 'Floral summer dress', q: 'women floral midi dress' },
  { e: '🧥', name: 'Cosy oversized hoodie', q: 'women oversized hoodie pastel' },
  { e: '👖', name: 'High-waist jeans', q: 'women high waist jeans' },
  { e: '👟', name: 'White sneakers', q: 'women white sneakers' },
  { e: '👠', name: 'Pink heels', q: 'women pink block heels' },
  { e: '👜', name: 'Small handbag', q: 'women small crossbody bag' },
  { e: '💛', name: 'Gold heart necklace', q: 'women gold heart necklace' },
  { e: '🌙', name: 'Cute pyjama set', q: 'women satin pyjama set' },
];
(function () {
  const link = (site, it) => it[site] || (site === 'us'
    ? `https://www.amazon.com/s?k=${encodeURIComponent(it.q)}&tag=${MIA_TAGS.us}`
    : `https://www.amazon.in/s?k=${encodeURIComponent(it.q)}&tag=${MIA_TAGS.in}`);
  const list = document.getElementById('mw-list');
  MIA_WARDROBE.forEach(it => {
    const row = document.createElement('div'); row.className = 'mw-row';
    const em = document.createElement('span'); em.className = 'mw-e'; em.textContent = it.e;
    const nm = document.createElement('span'); nm.className = 'mw-n'; nm.textContent = it.name;
    row.append(em, nm);
    [['us', '🇺🇸'], ['in', '🇮🇳']].forEach(([site, flag]) => { const a = document.createElement('a'); a.className = 'mw-b ' + site; a.href = link(site, it); a.target = '_blank'; a.rel = 'noopener sponsored'; a.textContent = flag + ' Shop'; row.append(a); });
    list.append(row);
  });
  // Unity grabs the keyboard; let typing in the gift panel through
  ['keydown', 'keypress', 'keyup'].forEach(ev => window.addEventListener(ev, e => { if (e.target && e.target.closest && e.target.closest('#giftlink')) e.stopImmediatePropagation(); }, true));
  // tabs
  document.querySelectorAll('.mw-tab').forEach(b => b.onclick = () => { document.querySelectorAll('.mw-tab').forEach(x => x.classList.toggle('on', x === b)); document.querySelectorAll('.mw-pane').forEach(p => p.hidden = p.id !== b.dataset.pane); });
})();
