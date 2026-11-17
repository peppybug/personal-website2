// The climb: scroll position -> altitude -> scene. The page is complete without this file.
const root = document.documentElement;
const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;

/* ---------- Pill nav menu ---------- */
const toggle = document.querySelector('.pill-nav__toggle');
const menu = document.getElementById('menu');
const setOpen = (open) => {
  toggle.setAttribute('aria-expanded', String(open));
  toggle.setAttribute('aria-label', open ? 'Close menu' : 'Open menu');
  menu.classList.toggle('is-open', open);
  if (open) menu.querySelector('a')?.focus();
};
toggle?.addEventListener('click', () => setOpen(toggle.getAttribute('aria-expanded') !== 'true'));
menu?.addEventListener('click', (e) => { if (e.target.closest('a')) setOpen(false); });
document.addEventListener('keydown', (e) => { if (e.key === 'Escape' && menu?.classList.contains('is-open')) { setOpen(false); toggle.focus(); } });
document.addEventListener('click', (e) => { if (menu?.classList.contains('is-open') && !e.target.closest('.pill-nav')) setOpen(false); });

/* ---------- Colour keyframes: base camp afternoon -> cold high day -> summit sunrise ---------- */
const KEYS = [
  { at: 0, c: { sky1: '#8FB7C9', sky2: '#F1CF9A', sky3: '#F2A66B', far: '#A7AFC0', 'far-s': '#848EA3', 'far-w': '#F6EFE4', 'far-ws': '#D4D8E4', mid: '#6A7488', 'mid-s': '#4F5970', 'mid-w': '#E9E4DC', near: '#33433F', 'near-s': '#24312E', pine: '#1E2E28', 'pine-s': '#15211C', cloud: '#FFFFFF', haze: 'rgba(241,207,154,.55)', sun: '#FFE3A8' } },
  { at: .5, c: { sky1: '#2C5C8F', sky2: '#8DB6D9', sky3: '#D6E6EF', far: '#BAC6D8', 'far-s': '#8E9DB6', 'far-w': '#FFFFFF', 'far-ws': '#DCE3EE', mid: '#75859F', 'mid-s': '#586984', 'mid-w': '#F2F5FA', near: '#3D4B5C', 'near-s': '#2C3847', pine: '#26323F', 'pine-s': '#1B2430', cloud: '#FFFFFF', haze: 'rgba(214,230,239,.6)', sun: '#FFF6DC' } },
  { at: 1, c: { sky1: '#120D3A', sky2: '#5B3FB0', sky3: '#F5A25F', far: '#6D6A9E', 'far-s': '#4F4B82', 'far-w': '#D9D3F0', 'far-ws': '#B3ABDA', mid: '#4B4580', 'mid-s': '#37326A', 'mid-w': '#C8C0EA', near: '#2B2858', 'near-s': '#1F1D45', pine: '#1A1840', 'pine-s': '#121030', cloud: '#E9DDF5', haze: 'rgba(245,162,95,.4)', sun: '#FFC27A' } },
];
const parse = (s) => s.startsWith('#')
  ? [parseInt(s.slice(1, 3), 16), parseInt(s.slice(3, 5), 16), parseInt(s.slice(5, 7), 16), 1]
  : s.match(/[\d.]+/g).map(Number);
const PARSED = KEYS.map((k) => ({ at: k.at, c: Object.fromEntries(Object.entries(k.c).map(([n, v]) => [n, parse(v)])) }));
function paint(p) {
  let i = 0; while (i < PARSED.length - 2 && p > PARSED[i + 1].at) i++;
  const a = PARSED[i], b = PARSED[i + 1];
  const t = Math.min(1, Math.max(0, (p - a.at) / (b.at - a.at)));
  for (const n in a.c) {
    const x = a.c[n], y = b.c[n];
    const v = x.map((c, j) => c + (y[j] - c) * t);
    root.style.setProperty('--' + n, `rgba(${v[0] | 0},${v[1] | 0},${v[2] | 0},${v[3].toFixed(2)})`);
  }
}

/* ---------- Altitude from scroll ---------- */
const BASE = 5364, TOP = 8849;
const sections = [...document.querySelectorAll('[data-alt]')];
const campLinks = [...document.querySelectorAll('[data-camp]')];
const readout = document.querySelector('[data-alt-readout]');
let anchors = [];
function measure() {
  const vh = innerHeight, max = root.scrollHeight - vh;
  anchors = sections.map((s, i) => {
    const y = i === 0 ? 0 : i === sections.length - 1 ? max : Math.max(0, s.offsetTop - vh * .45);
    return { y: Math.min(y, max), alt: +s.dataset.alt, id: s.id };
  });
}
function altitudeAt(y) {
  for (let i = 0; i < anchors.length - 1; i++) {
    const a = anchors[i], b = anchors[i + 1];
    if (y <= b.y) return a.alt + (b.alt - a.alt) * Math.max(0, (y - a.y) / Math.max(1, b.y - a.y));
  }
  return TOP;
}
const smooth = (x) => { x = Math.min(1, Math.max(0, x)); return x * x * (3 - 2 * x); };

let snowLevel = 0;
function frame() {
  ticking = false;
  const alt = altitudeAt(scrollY);
  const p = (alt - BASE) / (TOP - BASE);
  paint(p);
  root.style.setProperty('--p', p.toFixed(4));
  if (readout) readout.textContent = Math.round(alt).toLocaleString('en-US');
  let here = null;
  for (const l of campLinks) {
    const a = anchors.find((x) => x.id === l.dataset.camp);
    const passed = a && alt >= a.alt - 1;
    l.classList.toggle('is-passed', !!passed);
    if (passed && (!here || a.alt > here.a)) here = { l, a: a.alt };
  }
  campLinks.forEach((l) => l.classList.toggle('is-here', here?.l === l));

  root.style.setProperty('--stars', smooth((p - .72) / .22).toFixed(3));
  snowLevel = reduce ? 0 : smooth((p - .25) / .25) * (1 - smooth((p - .88) / .1));
  root.style.setProperty('--snow', snowLevel.toFixed(3));
  root.style.setProperty('--birds', (1 - smooth(p / .12)).toFixed(3));
  root.style.setProperty('--clouds-o', (1 - smooth((p - .55) / .25)).toFixed(3));
  const sea = smooth((p - .5) / .35);
  // passing through the cloud layer: a soft white-out around Camp III
  root.style.setProperty('--fog', (Math.exp(-((p - .55) ** 2) / .006) * .75).toFixed(3));
  if (!reduce) {
    root.style.setProperty('--y-far', (p * 75).toFixed(2) + 'vh');
    root.style.setProperty('--y-mid', (p * 110).toFixed(2) + 'vh');
    root.style.setProperty('--y-near', (p * 150).toFixed(2) + 'vh');
    root.style.setProperty('--y-fg', (p * 200).toFixed(2) + 'vh');
    root.style.setProperty('--y-clouds', (p * 120).toFixed(2) + 'vh');
    root.style.setProperty('--y-sea', (60 * (1 - sea)).toFixed(2) + 'vh');
    // the sun dips behind the range mid-climb and rises again at the summit
    root.style.setProperty('--sun-x', (Math.sin(Math.PI * p) * 12).toFixed(2) + 'vw');
    root.style.setProperty('--sun-y', (Math.sin(Math.PI * p) * 40).toFixed(2) + 'vh');
  } else {
    // no parallax: the scene fades from valley to cloud sea instead
    const fadeOut = (1 - smooth((p - .3) / .4)).toFixed(3);
    document.querySelectorAll('.layer--far,.layer--mid,.layer--near,.layer--fg,.haze').forEach((el) => (el.style.opacity = fadeOut));
    root.style.setProperty('--y-sea', '0vh');
    document.querySelector('.layer--sea').style.opacity = sea.toFixed(3);
  }
}
let ticking = false;
const queue = () => { if (!ticking) { ticking = true; requestAnimationFrame(frame); } };
addEventListener('scroll', queue, { passive: true });
addEventListener('resize', () => { measure(); queue(); });
addEventListener('load', () => { measure(); queue(); });
new ResizeObserver(() => { measure(); queue(); }).observe(document.body);
measure(); frame();

/* ---------- Snow at altitude ---------- */
const canvas = document.querySelector('.snow');
if (canvas && !reduce) {
  const ctx = canvas.getContext('2d');
  let w = 0, h = 0, flakes = [];
  const resize = () => {
    const dpr = Math.min(devicePixelRatio || 1, 2);
    w = innerWidth; h = innerHeight; canvas.width = w * dpr; canvas.height = h * dpr; ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    flakes = Array.from({ length: Math.round(w * h / 9000) }, () => ({ x: Math.random() * w, y: Math.random() * h, r: .6 + Math.random() * 2.2, s: .4 + Math.random() * 1.2, d: Math.random() * 6 }));
  };
  resize(); addEventListener('resize', resize);
  let last = 0;
  const tick = (t) => {
    requestAnimationFrame(tick);
    if (snowLevel < .02 || document.hidden) { if (last) { ctx.clearRect(0, 0, w, h); last = 0; } return; }
    last = t; ctx.clearRect(0, 0, w, h); ctx.fillStyle = 'rgba(255,255,255,.9)';
    const n = Math.round(flakes.length * snowLevel);
    for (let i = 0; i < n; i++) {
      const f = flakes[i];
      f.y += f.s; f.x += Math.sin(t / 1200 + f.d) * .5 - .3;
      if (f.y > h + 5) { f.y = -5; f.x = Math.random() * w; } if (f.x < -5) f.x = w + 5;
      ctx.beginPath(); ctx.arc(f.x, f.y, f.r, 0, 6.283); ctx.fill();
    }
  };
  requestAnimationFrame(tick);
}

/* ---------- Reveals ---------- */
if (!reduce && 'IntersectionObserver' in window) {
  root.classList.add('anim');
  document.querySelectorAll('[data-anim="stagger"]').forEach((g) => [...g.children].forEach((c, i) => c.style.setProperty('--i', i)));
  const io = new IntersectionObserver((entries) => {
    entries.forEach((e) => {
      if (!e.isIntersecting) return;
      const t = e.target; t.classList.add('is-in'); io.unobserve(t);
      if (t.dataset.anim === 'stagger') setTimeout(() => t.classList.add('done'), 1800);
    });
  }, { threshold: 0.15, rootMargin: '0px 0px -8% 0px' });
  document.querySelectorAll('[data-anim]').forEach((el) => io.observe(el));
  document.addEventListener('focusin', (e) => e.target.closest?.('[data-anim]')?.classList.add('is-in'));
}

/* ---------- Footer year ---------- */
const year = document.querySelector('[data-year]');
if (year) year.textContent = String(new Date().getFullYear());
