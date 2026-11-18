// The wall: draws the rock face, moves the climber and recolours the sky by altitude.
// The page is complete and readable without this file.
const root = document.documentElement;
const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
const NS = 'http://www.w3.org/2000/svg';
root.classList.add('wall-mode');

/* ---------- Route menu ---------- */
const toggle = document.querySelector('.topbar__toggle');
const nav = document.getElementById('route-nav');
const setOpen = (open) => { toggle.setAttribute('aria-expanded', String(open)); nav.classList.toggle('is-open', open); };
toggle?.addEventListener('click', () => setOpen(toggle.getAttribute('aria-expanded') !== 'true'));
nav?.addEventListener('click', (e) => { if (e.target.closest('a')) setOpen(false); });
document.addEventListener('keydown', (e) => { if (e.key === 'Escape' && nav?.classList.contains('is-open')) { setOpen(false); toggle.focus(); } });

/* ---------- Helpers ---------- */
const rng = (seed) => () => ((seed = (seed * 16807) % 2147483647) / 2147483647);
const f = (n) => Math.round(n * 10) / 10;
const pts = (a) => a.map(([x, y]) => `${f(x)},${f(y)}`).join(' ');
const smooth = (x) => { x = Math.min(1, Math.max(0, x)); return x * x * (3 - 2 * x); };
const el = (tag, attrs, parent) => { const n = document.createElementNS(NS, tag); for (const k in attrs) n.setAttribute(k, attrs[k]); parent?.append(n); return n; };

/* ---------- Distant ranges (drawn once) ---------- */
function drawRange(svg, base, amp, n, seed, cls, snow) {
  const r = rng(seed), P = [];
  for (let i = 0; i <= n; i++) P.push([i * 1600 / n + (i && i < n ? (r() - .5) * 60 : 0), base - (i % 2 ? amp * (.6 + r() * .4) : amp * r() * .3)]);
  el('path', { class: cls, d: `M0 400 L${pts(P).replace(/ /g, ' L')} L1600 400 Z` }, svg);
  for (let i = 1; i < P.length - 1; i++) {
    const [x, y] = P[i]; if (i % 2 === 0) continue;
    el('path', { class: 'r-shade', d: `M${f(x)} ${f(y)} L${f(P[i + 1][0])} ${f(P[i + 1][1])} L${f(P[i + 1][0])} 400 L${f(x + 30)} 400 Z` }, svg);
    if (snow) el('path', { class: 'r-snow', d: `M${f(x)} ${f(y)} L${f(x + 34)} ${f(y + 30)} L${f(x + 14)} ${f(y + 24)} L${f(x)} ${f(y + 36)} L${f(x - 14)} ${f(y + 22)} L${f(x - 30)} ${f(y + 28)} Z` }, svg);
  }
}
drawRange(document.querySelector('.sky__range--far'), 260, 190, 12, 11, 'r-far', true);
drawRange(document.querySelector('.sky__range--near'), 330, 140, 9, 29, 'r-near', false);

/* ---------- The climb runs upward: start at the foot of the wall ---------- */
const climb = document.querySelector('.climb');
const sections = [...document.querySelectorAll('section[data-alt]')];
let stickBottom = !location.hash;
if ('scrollRestoration' in history) history.scrollRestoration = 'manual';
const toBottom = () => { if (stickBottom) scrollTo(0, root.scrollHeight); };
['wheel', 'touchstart', 'keydown', 'mousedown'].forEach((t) => addEventListener(t, () => { stickBottom = false; }, { once: true, passive: true }));

/* ---------- The wall ---------- */
const wall = document.querySelector('.wall');
const art = document.querySelector('.wall__art');
const climber = document.querySelector('.climber');
let route = [], peak = [0, 0], baseY = 0, wallLeft = 0;

function drawWall() {
  const W = wall.clientWidth, H = climb.offsetHeight, vh = innerHeight;
  wallLeft = wall.getBoundingClientRect().left + scrollX;
  art.setAttribute('viewBox', `0 0 ${W} ${H}`);
  art.replaceChildren();
  const r = rng(7);
  const summit = document.getElementById('summit'), base = document.getElementById('base');
  const peakY = summit.offsetTop + summit.offsetHeight * .64;
  peak = [W * .52, peakY];
  baseY = base.offsetTop + base.offsetHeight - Math.min(90, vh * .1);
  const taper = vh * .9;

  // rock colour by height: warm sandstone low, granite higher, snow at the top
  const defs = el('defs', {}, art);
  const g = el('linearGradient', { id: 'rock', x1: 0, y1: peakY, x2: 0, y2: H, gradientUnits: 'userSpaceOnUse' }, defs);
  [[0, '#E9ECF1'], [.14, '#B9B6BC'], [.42, '#938C93'], [.7, '#C38A60'], [1, '#D99E66']].forEach(([o, c]) => el('stop', { offset: o, 'stop-color': c }, g));

  // left edge of the face
  const edge = []; for (let y = H + 40; y > peakY + taper; y -= 90) edge.push([W * (.06 + r() * .22), y]);
  const edgeAt = (y) => { for (let i = 0; i < edge.length - 1; i++) { const a = edge[i], b = edge[i + 1]; if (y <= a[1] && y >= b[1]) return a[0] + (b[0] - a[0]) * (a[1] - y) / (a[1] - b[1]); } return y > peakY + taper ? edge[0][0] : peak[0] - (peak[0] - edge[edge.length - 1][0]) * (y - peakY) / taper; };
  const rightAt = (y) => y < peakY + taper * .7 ? peak[0] + (W + 30 - peak[0]) * (y - peakY) / (taper * .7) : W;
  const left = [...edge];
  for (let k = 1; k <= 4; k++) { const y = peakY + taper * (1 - k / 5); left.push([edgeAt(y) + (r() - .5) * 20, y]); }
  const rightTop = [[peak[0] + W * .12, peakY + taper * .25], [peak[0] + W * .26, peakY + taper * .45], [W + 30, peakY + taper * .7]];
  const outline = [[W + 30, H + 40], ...left, peak, ...rightTop];
  el('polygon', { class: 'w-rock', fill: 'url(#rock)', points: pts(outline) }, art);

  // facets and shadow planes
  for (let y = peakY + 120; y < H; y += 110 + r() * 60) {
    const e = edgeAt(y), R = rightAt(y) - 30; if (R - e < 80) continue;
    const x = e + (R - e) * (.1 + r() * .55), h = 70 + r() * 110, d = 26 + r() * 56;
    el('polygon', { class: 'w-face w-shade', points: pts([[x, y], [x + d, y + h * .45], [x + d * .35, y + h], [x - d * .2, y + h * .55]]) }, art);
    el('polygon', { class: 'w-face w-shade', points: pts([[e, y - 40], [e + 26 + r() * 30, y], [e + 10, y + 70]]) }, art);
  }
  // cracks
  for (let y = peakY + 200; y < H; y += 260 + r() * 200) {
    const R = rightAt(y) - 30; if (R - edgeAt(y) < 80) continue;
    let x = edgeAt(y) + (R - edgeAt(y)) * (.2 + r() * .6), d = `M${f(x)} ${f(y)}`;
    for (let k = 0; k < 4; k++) { x += (r() - .5) * 40; d += ` L${f(x)} ${f(y + (k + 1) * 34)}`; }
    el('path', { class: 'w-crack', d }, art);
  }
  // snow near the top
  for (let y = peakY + 60; y < peakY + vh * 1.4; y += 70 + r() * 60) {
    const e = edgeAt(y) + 12, w = 30 + r() * 60, R = rightAt(y) - 12 - w; if (R - e < 10) continue;
    const x = e + (R - e) * r();
    el('polygon', { class: 'w-snow', points: pts([[x, y], [x + w * .6, y - 8], [x + w, y + 6], [x + w * .5, y + 14 + r() * 10], [x + w * .1, y + 10]]) }, art);
  }
  el('polygon', { class: 'w-snow', points: pts([peak, [peak[0] + W * .1, peakY + 70], [peak[0] + 30, peakY + 58], [peak[0], peakY + 86], [peak[0] - 30, peakY + 52], [peak[0] - W * .09, peakY + 66]]) }, art);

  // base camp ground
  el('polygon', { class: 'w-ledge', fill: '#8A6A48', points: pts([[-W * .35, H + 40], [-W * .12, baseY + 40], [W * .1, baseY + 4], [W + 30, baseY - 6], [W + 30, H + 40]]) }, art);
  for (let k = 0; k < 9; k++) { const x = W * (.05 + r() * .9), yy = baseY + 16 + r() * 40; el('ellipse', { class: 'w-hold', cx: f(x), cy: f(yy), rx: f(8 + r() * 14), ry: f(4 + r() * 5) }, art); }
  tent(W * .58, baseY - 2, 1.15); tent(W * .82, baseY - 4, .9);

  // ledges at each camp
  const camps = sections.slice(1, -1).map((s) => s.offsetTop + s.offsetHeight * .6);
  for (const y of camps) {
    const e = edgeAt(y), w = Math.min(W * .62, 240);
    el('polygon', { class: 'w-ledge', fill: 'url(#rock)', points: pts([[e - 40, y], [e + w, y - 2], [e + w + 10, y + 14], [e + w * .4, y + 38], [e - 26, y + 24]]) }, art);
    el('polygon', { class: 'w-face w-shade', points: pts([[e + w * .4, y + 38], [e + w + 10, y + 14], [e + w * .6, y + 18]]) }, art);
    tent(e + w * .5, y, .8);
  }

  // the route: from base camp up to the peak, through the camp ledges
  route = [[W * .5, baseY - 40]];
  let y = baseY - 40;
  const stops = [...camps].sort((a, b) => b - a);
  while (y > peakY + 140) {
    y -= 120 + r() * 70;
    const next = stops.find((c) => c < route[route.length - 1][1] && c >= y);
    if (next) { const e = edgeAt(next); route.push([e + Math.min(W * .62, 240) * .2, next - 6]); y = next - 6; continue; }
    if (y <= peakY + 140) break;
    const e = edgeAt(y); route.push([e + (W * .9 - e) * (.25 + r() * .6), y]);
  }
  route.push([peak[0] - 6, peakY + 6]);
  const d = 'M' + route.map(([x, yy]) => `${f(x)} ${f(yy)}`).join(' L');
  el('path', { class: 'w-rope-shadow', d }, art);
  el('path', { class: 'w-rope', d }, art);
  for (const [x, yy] of route.slice(1, -1)) {
    el('circle', { class: 'w-piton', cx: f(x), cy: f(yy), r: 5 }, art);
    for (let k = 0; k < 2; k++) el('ellipse', { class: 'w-hold', cx: f(x + (r() - .5) * 90), cy: f(yy + 30 + r() * 60), rx: f(6 + r() * 6), ry: f(4 + r() * 3) }, art);
  }
  // flag on the summit
  el('line', { class: 'w-flag-pole', x1: f(peak[0] + 14), y1: f(peakY + 2), x2: f(peak[0] + 14), y2: f(peakY - 92) }, art);
  el('path', { class: 'w-flag', d: `M${f(peak[0] + 15)} ${f(peakY - 90)} C${f(peak[0] + 40)} ${f(peakY - 98)} ${f(peak[0] + 52)} ${f(peakY - 80)} ${f(peak[0] + 76)} ${f(peakY - 88)} L${f(peak[0] + 76)} ${f(peakY - 56)} C${f(peak[0] + 52)} ${f(peakY - 48)} ${f(peak[0] + 40)} ${f(peakY - 66)} ${f(peak[0] + 15)} ${f(peakY - 58)} Z` }, art);

  function tent(x, gy, s) {
    el('polygon', { class: 'w-tent', points: pts([[x - 30 * s, gy], [x, gy - 34 * s], [x + 30 * s, gy]]) }, art);
    el('polygon', { class: 'w-tent-door', points: pts([[x - 7 * s, gy], [x, gy - 16 * s], [x + 7 * s, gy]]) }, art);
  }
}

/* ---------- Sky colours by altitude ---------- */
const KEYS = [
  { at: 0, c: { sky1: '#7FB3C8', sky2: '#F2D3A4', sky3: '#EBA36C', far: '#9DA8BE', near: '#6E7891', cloud: '#FFF6E8', sun: '#FFE2A6' } },
  { at: .45, c: { sky1: '#3E79B0', sky2: '#9CC4E0', sky3: '#DCEAF1', far: '#B4C2D6', near: '#7F8FA9', cloud: '#FFFFFF', sun: '#FFF4D6' } },
  { at: .8, c: { sky1: '#4C3C8C', sky2: '#E2788A', sky3: '#F7B267', far: '#8A6E9A', near: '#5F4C7A', cloud: '#FFD7C2', sun: '#FFC27A' } },
  { at: 1, c: { sky1: '#0F0C2E', sky2: '#3B2E74', sky3: '#8A3F66', far: '#3E3466', near: '#2A2350', cloud: '#B9A7D6', sun: '#FFB36B' } },
];
const hex = (s) => [1, 3, 5].map((i) => parseInt(s.slice(i, i + 2), 16));
const PK = KEYS.map((k) => ({ at: k.at, c: Object.fromEntries(Object.entries(k.c).map(([n, v]) => [n, hex(v)])) }));
function paint(p) {
  let i = 0; while (i < PK.length - 2 && p > PK[i + 1].at) i++;
  const a = PK[i], b = PK[i + 1], t = smooth((p - a.at) / (b.at - a.at));
  for (const n in a.c) root.style.setProperty('--' + n, `rgb(${a.c[n].map((v, j) => Math.round(v + (b.c[n][j] - v) * t)).join(',')})`);
}

/* ---------- Altitude, climber and parallax ---------- */
const BASE = 5364, TOP = 8849;
const altOut = document.querySelector('[data-alt-out]');
const navLinks = [...document.querySelectorAll('.topbar__nav a')];
let anchors = [];
function measure() {
  const vh = innerHeight, max = Math.max(1, root.scrollHeight - vh);
  anchors = sections.map((s) => ({ id: s.id, alt: +s.dataset.alt, y: Math.min(max, Math.max(0, s.offsetTop + s.offsetHeight / 2 - vh / 2)) }))
    .sort((a, b) => b.y - a.y);           // from the foot of the page (base) up to the summit
}
function altitudeAt(y) {
  if (y >= anchors[0].y) return BASE;
  for (let i = 0; i < anchors.length - 1; i++) {
    const a = anchors[i], b = anchors[i + 1];
    if (y >= b.y) return a.alt + (b.alt - a.alt) * (a.y - y) / Math.max(1, a.y - b.y);
  }
  return TOP;
}
function routeXAt(y) {
  for (let i = 0; i < route.length - 1; i++) { const a = route[i], b = route[i + 1]; if (y <= a[1] && y >= b[1]) return a[0] + (b[0] - a[0]) * (a[1] - y) / Math.max(1, a[1] - b[1]); }
  return null;
}
let ticking = false;
function frame() {
  ticking = false;
  const vh = innerHeight, y = scrollY;
  const alt = altitudeAt(y), p = (alt - BASE) / (TOP - BASE);
  paint(p);
  root.style.setProperty('--stars', smooth((p - .82) / .16).toFixed(3));
  root.style.setProperty('--clouds-o', (1 - smooth((p - .7) / .25)).toFixed(3));
  if (!reduce) {
    root.style.setProperty('--range-y', (p * vh * .5).toFixed(1) + 'px');
    root.style.setProperty('--cloud-y', (p * vh * .35).toFixed(1) + 'px');
    root.style.setProperty('--sun-y', (Math.sin(Math.PI * p) * vh * .25).toFixed(1) + 'px');
  }
  if (altOut) altOut.textContent = Math.round(alt).toLocaleString('en-US');
  let here = anchors[0]?.id; for (const a of anchors) if (y <= a.y + 2) here = a.id;
  navLinks.forEach((l) => { if (l.getAttribute('href') === '#' + here) l.setAttribute('aria-current', 'location'); else l.removeAttribute('aria-current'); });

  // the climber holds a fixed height on screen while the wall slides past
  if (route.length) {
    const cw = climber.clientWidth, ch = climber.clientHeight;
    const docY = y + vh * .62 - climb.offsetTop;
    let cx, cy, top = false;
    if (docY >= route[0][1]) { cx = route[0][0]; cy = route[0][1] - y + climb.offsetTop; }          // waiting at base camp
    else if (docY <= peak[1] + 6) { cx = peak[0] - 6; cy = peak[1] - y + climb.offsetTop - ch * .42; top = true; }  // on the summit
    else { cx = routeXAt(docY); cy = vh * .62; }
    climber.style.setProperty('--cx', (wallLeft - scrollX + cx - cw / 2).toFixed(1) + 'px');
    climber.style.setProperty('--cy', (cy - ch / 2).toFixed(1) + 'px');
    climber.classList.toggle('top', top);
    climber.classList.toggle('pose-b', !reduce && !top && Math.floor(docY / 64) % 2 === 1);
    climber.classList.add('is-ready');
  }
}
const queue = () => { if (!ticking) { ticking = true; requestAnimationFrame(frame); } };
function layout() { drawWall(); measure(); toBottom(); queue(); }
addEventListener('scroll', queue, { passive: true });
let rt; addEventListener('resize', () => { clearTimeout(rt); rt = setTimeout(layout, 120); });
addEventListener('load', layout);
new ResizeObserver(() => { clearTimeout(rt); rt = setTimeout(layout, 60); }).observe(climb);
layout();

/* ---------- Footer year ---------- */
const year = document.querySelector('[data-year]');
if (year) year.textContent = String(new Date().getFullYear());
