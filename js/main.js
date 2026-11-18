// Expedition catalog: scroll position -> altitude -> the lit counter and the inked route.
// The page is complete and readable without this file.
const root = document.documentElement;

/* ---------- Index menu (small screens) ---------- */
const toggle = document.querySelector('.masthead__toggle');
const nav = document.getElementById('index-nav');
const setOpen = (open) => { toggle.setAttribute('aria-expanded', String(open)); nav.classList.toggle('is-open', open); };
toggle?.addEventListener('click', () => setOpen(toggle.getAttribute('aria-expanded') !== 'true'));
nav?.addEventListener('click', (e) => { if (e.target.closest('a')) setOpen(false); });
document.addEventListener('keydown', (e) => { if (e.key === 'Escape' && nav?.classList.contains('is-open')) { setOpen(false); toggle.focus(); } });

/* ---------- The lit counter: one column of 0-9 per digit, rolled into place ---------- */
const counter = document.querySelector('[data-counter]');
const altText = document.querySelector('[data-alt-text]');
let cols = [];
if (counter) {
  // 4 digits with a thousands separator: d,ddd
  for (let i = 0; i < 4; i++) {
    if (i === 1) { const s = document.createElement('span'); s.className = 'counter__sep'; s.textContent = ','; counter.append(s); }
    const d = document.createElement('span'); d.className = 'counter__d';
    const col = document.createElement('span'); col.className = 'counter__col';
    for (let n = 0; n <= 9; n++) { const s = document.createElement('span'); s.textContent = n; col.append(s); }
    d.append(col); counter.append(d); cols.push(col);
  }
}
let shown = -1;
function setCounter(alt) {
  const v = Math.round(alt);
  if (v === shown) return; shown = v;
  String(v).padStart(4, '0').split('').forEach((ch, i) => { cols[i].style.transform = `translateY(${-Number(ch)}em)`; });
  if (altText) altText.textContent = `Altitude ${v.toLocaleString('en-US')} m`;
}

/* ---------- Altitude from scroll ---------- */
const BASE = 5364, TOP = 8849;
const sections = [...document.querySelectorAll('[data-alt]')];
const campLinks = [...document.querySelectorAll('[data-camp]')];
let anchors = [];
function measure() {
  const vh = innerHeight, max = Math.max(1, root.scrollHeight - vh);
  anchors = sections.map((s, i) => ({
    id: s.id, alt: +s.dataset.alt,
    y: i === 0 ? 0 : i === sections.length - 1 ? max : Math.min(max, Math.max(0, s.offsetTop - vh * .4)),
  }));
}
function altitudeAt(y) {
  for (let i = 0; i < anchors.length - 1; i++) {
    const a = anchors[i], b = anchors[i + 1];
    if (y <= b.y) return a.alt + (b.alt - a.alt) * Math.max(0, (y - a.y) / Math.max(1, b.y - a.y));
  }
  return TOP;
}
let ticking = false;
function frame() {
  ticking = false;
  const alt = altitudeAt(scrollY);
  setCounter(alt);
  root.style.setProperty('--p', ((alt - BASE) / (TOP - BASE)).toFixed(4));
  let here = null;
  for (const a of anchors) if (alt >= a.alt - 1) here = a.id;
  campLinks.forEach((l) => {
    const on = l.dataset.camp === here;
    l.classList.toggle('is-here', on);
    if (on) l.setAttribute('aria-current', 'location'); else l.removeAttribute('aria-current');
  });
}
const queue = () => { if (!ticking) { ticking = true; requestAnimationFrame(frame); } };
addEventListener('scroll', queue, { passive: true });
addEventListener('resize', () => { measure(); queue(); });
addEventListener('load', () => { measure(); queue(); });
new ResizeObserver(() => { measure(); queue(); }).observe(document.body);
measure(); frame();

/* ---------- Colophon year ---------- */
const year = document.querySelector('[data-year]');
if (year) year.textContent = String(new Date().getFullYear());
