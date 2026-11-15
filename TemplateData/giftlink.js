// "Gift Mia anything" (copied from Athena's Home src/giftlink.js, 2026-11-15): paste any Amazon link -> our affiliate link.
// Works in the browser only (no server). Reads the 10-letter product code (ASIN) from the link
// and builds a clean link with our tag. amazon.com -> US tag, amazon.in -> India tag.
const TAGS = { 'amazon.com': 'onelifegifts-20', 'amazon.in': 'onelifegifts-21' };
const SHORT = /(^|\.)(amzn\.to|amzn\.in|amzn\.eu|amzn\.asia|a\.co|link\.amazon|amzlinks\.in|amzlink\.to)$/i;
const $ = (id) => document.getElementById(id);
// the short-link opener runs on the Vercel copy of the site (api/resolve.js); the GitHub copy calls it there
const API = 'https://athenas-home.vercel.app'; // the short-link opener lives on the Athena's Home Vercel site
export const isShort = (raw) => { const m = String(raw || '').match(/https?:\/\/\S+/i); try { return SHORT.test(new URL(m ? m[0] : 'https://' + String(raw).trim()).hostname.replace(/^www\./, '')); } catch (e) { return false; } };

async function resolveAndMake(raw) {
  if (!isShort(raw)) return makeLink(raw);
  const m = String(raw).match(/https?:\/\/\S+/i), short = m ? m[0] : 'https://' + String(raw).trim();
  try {
    const r = await fetch(`${API}/api/resolve?u=${encodeURIComponent(short)}`);
    const j = await r.json();
    if (j.url) return makeLink(j.url);
  } catch (e) { }
  return { err: "We couldn't open that short link. Open it, then copy the long link from the top of the browser and paste it here." };
}

export function makeLink(raw) {
  let s = (raw || '').trim();
  const m = s.match(/https?:\/\/\S+/i); if (m) s = m[0];          // pasted text may have words around the link
  if (!/^https?:\/\//i.test(s)) s = 'https://' + s;
  let u; try { u = new URL(s); } catch (e) { return { err: "That doesn't look like a link. Copy the Amazon link and paste it here." }; }
  const host = u.hostname.toLowerCase().replace(/^(www|m|smile)\./, '');
  if (SHORT.test(host)) return { err: "That's a short link. Open it first, then copy the long link from the top of the browser and paste it here." };
  const site = host === 'amazon.com' ? 'amazon.com' : host === 'amazon.in' ? 'amazon.in' : null;
  if (!site) return { err: /amazon\./.test(host) ? 'Only amazon.com (USA and world) and amazon.in (India) links work here.' : 'Please paste a link from amazon.com or amazon.in.' };
  const path = decodeURIComponent(u.pathname);
  const a = path.match(/\/(?:dp|gp\/product|gp\/aw\/d|exec\/obidos\/ASIN|o\/ASIN|d)\/([A-Z0-9]{10})(?:[/?]|$)/i) || [null, u.searchParams.get('asin')];
  const asin = a[1] && /^[A-Z0-9]{10}$/i.test(a[1]) ? a[1].toUpperCase() : null;
  if (!asin) return { err: "We couldn't find the product in that link. Open the product page itself and copy its link." };
  return { site, asin, url: `https://www.${site}/dp/${asin}/?tag=${TAGS[site]}` };
}

let busy = 0;
async function go(raw) {
  const n = ++busy, err = $('gl-err');
  if (isShort(raw)) { $('gl-out').hidden = true; err.hidden = false; err.textContent = '⏳ Opening the short link…'; }
  const r = await resolveAndMake(raw);
  if (n === busy) show(r);
}
function show(r) {
  const out = $('gl-out'), err = $('gl-err');
  err.hidden = !r.err; err.textContent = r.err || '';
  out.hidden = !!r.err;
  if (r.err) return;
  $('gl-flag').textContent = r.site === 'amazon.in' ? '🇮🇳 amazon.in' : '🇺🇸 amazon.com';
  $('gl-url').textContent = r.url;
  $('gl-buy').href = r.url;
}

export function initGiftLink() {
  const sheet = $('giftlink'); if (!sheet) return;
  const open = () => { document.querySelectorAll('.sheet').forEach((s) => (s.hidden = true)); sheet.hidden = false; $('gl-in').focus({ preventScroll: true }); };
  $('gl-open').addEventListener('click', open);
  sheet.querySelector('[data-close]').addEventListener('click', () => (sheet.hidden = true));
  $('gl-go').addEventListener('click', () => go($('gl-in').value));
  $('gl-in').addEventListener('keydown', (e) => { if (e.key === 'Enter') go($('gl-in').value); });
  $('gl-in').addEventListener('paste', () => setTimeout(() => go($('gl-in').value), 0));
  $('gl-paste').addEventListener('click', async () => {
    try { const v = await navigator.clipboard.readText(); $('gl-in').value = v; go(v); }
    catch (e) { $('gl-in').focus(); }
  });
  $('gl-copy').addEventListener('click', async () => {
    const b = $('gl-copy');
    try { await navigator.clipboard.writeText($('gl-url').textContent); b.textContent = 'Copied ✓'; }
    catch (e) { b.textContent = 'Press and hold the link to copy'; }
    setTimeout(() => (b.textContent = '📋 Copy link'), 1800);
  });
  if (/[?&#]gift(link)?\b/.test(location.search + location.hash)) open();   // athena-home/?gift opens it straight away
}
