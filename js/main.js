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

/* ---------- Scroll down, climb up: the wall slides down past the climber ---------- */
const climb = document.querySelector('.climb');
const sections = [...document.querySelectorAll('section[data-alt]')];
const CLIMBER_Y = .62;          // the climber holds this height on screen
let WH = 0, maxScroll = 1;      // wall height in px, page scroll range
const wallShift = (s) => -(WH - innerHeight) * (1 - s / maxScroll);   // wall y offset at scroll s

/* ---------- The wall ---------- */
const wall = document.querySelector('.wall');
const art = document.querySelector('.wall__art');
const climber = document.querySelector('.climber');
let route = [], peak = [0, 0], baseY = 0, wallLeft = 0;

function drawWall() {
  const W = wall.clientWidth, vh = innerHeight;
  maxScroll = Math.max(1, root.scrollHeight - vh);
  WH = Math.round(vh + maxScroll * .55);
  const H = WH;
  art.style.height = H + 'px';
  wallLeft = wall.getBoundingClientRect().left;
  art.setAttribute('viewBox', `0 0 ${W} ${H}`);
  art.replaceChildren();
  const r = rng(7);
  const peakY = vh * CLIMBER_Y - 4;                       // reached exactly at the bottom of the page
  peak = [W * .52, peakY];
  baseY = H - Math.min(90, vh * .1);
  // the wall height that sits at the climber when a section is centred on screen
  const atClimber = (sec) => { const sc = Math.min(maxScroll, Math.max(0, sec.offsetTop + sec.offsetHeight / 2 - vh / 2)); return vh * CLIMBER_Y - wallShift(sc); };
  const taper = vh * .9;

  // rock colour by height: warm sandstone low, granite higher, pale and cold near the top
  const STOPS = [[0, '#D9DCE3'], [.16, '#A9A4AC'], [.45, '#8E8288'], [.72, '#BC8259'], [1, '#D49761']];
  const hexRgb = (h) => [1, 3, 5].map((i) => parseInt(h.slice(i, i + 2), 16));
  const mix = (c1, c2, t) => c1.map((v, i) => Math.round(v + (c2[i] - v) * t));
  const rgb = (c) => `rgb(${c.join(',')})`;
  const INK = [28, 20, 16], LIGHT = [255, 240, 220];
  const tone = (y) => {
    const t = Math.min(1, Math.max(0, (y - peakY) / (H - peakY)));
    for (let i = 0; i < STOPS.length - 1; i++) if (t <= STOPS[i + 1][0]) return mix(hexRgb(STOPS[i][1]), hexRgb(STOPS[i + 1][1]), (t - STOPS[i][0]) / (STOPS[i + 1][0] - STOPS[i][0]));
    return hexRgb(STOPS[STOPS.length - 1][1]);
  };

  // silhouette of the face
  const edge = []; for (let y = H + 40; y > peakY + taper; y -= 110) edge.push([W * (.08 + r() * .18), y]);
  const edgeAt = (y) => { for (let i = 0; i < edge.length - 1; i++) { const a = edge[i], b = edge[i + 1]; if (y <= a[1] && y >= b[1]) return a[0] + (b[0] - a[0]) * (a[1] - y) / (a[1] - b[1]); } return y > peakY + taper ? edge[0][0] : peak[0] - (peak[0] - edge[edge.length - 1][0]) * (y - peakY) / taper; };
  const rightAt = (y) => y < peakY + taper * .7 ? peak[0] + (W + 30 - peak[0]) * (y - peakY) / (taper * .7) : W + 30;
  const left = [...edge];
  for (let k = 1; k <= 5; k++) { const y = peakY + taper * (1 - k / 6); left.push([edgeAt(y) + (r() - .5) * 16, y]); }
  const rightTop = [[peak[0] + W * .14, peakY + taper * .22], [peak[0] + W * .3, peakY + taper * .46], [W + 30, peakY + taper * .7]];
  const outline = [[W + 30, H + 40], ...left, peak, ...rightTop];
  const defs = el('defs', {}, art);
  el('polygon', { points: pts(outline) }, el('clipPath', { id: 'face' }, defs));
  el('polygon', { fill: rgb(tone(H * .6)), points: pts(outline) }, art);
  const slabs = el('g', { 'clip-path': 'url(#face)' }, art);

  // the face is built from tiers of slabs: lit left plane, shaded right plane,
  // a dark undercut under every tier, ink on every edge
  let ty = peakY + 30;
  while (ty < H) {
    const th = 120 + r() * 110, y0 = ty, y1 = ty + th, mid = (y0 + y1) / 2;
    const e = edgeAt(mid) - 40, R = rightAt(mid) + 10;
    const n = Math.max(2, Math.round((R - e) / (110 + r() * 60)));
    let xt = e, xb = e - 10 - r() * 20;
    const base = tone(mid);
    for (let i = 0; i < n; i++) {
      const wt = (R - e) / n * (.75 + r() * .5), wb = wt * (.85 + r() * .35);
      const x2t = i === n - 1 ? R : xt + wt, x2b = i === n - 1 ? R + 10 : xb + wb;
      const j0 = (r() - .5) * 18, j1 = (r() - .5) * 18;
      const lit = mix(base, LIGHT, .12 + r() * .1), dark = mix(base, INK, .26 + r() * .1);
      const split = .55 + r() * .2;
      const mt = xt + (x2t - xt) * split, mb = xb + (x2b - xb) * (split + .12);
      el('polygon', { class: 'w-slab', fill: rgb(lit), points: pts([[xt, y0 + j0], [x2t, y0 + j1], [x2b, y1], [xb, y1]]) }, slabs);
      el('polygon', { fill: rgb(dark), points: pts([[mt, y0 + (j0 + j1) / 2], [x2t, y0 + j1], [x2b, y1], [mb, y1]]) }, slabs);
      el('polygon', { class: 'w-slab-edge', points: pts([[xt, y0 + j0], [x2t, y0 + j1], [x2b, y1], [xb, y1]]) }, slabs);
      // a crack down the lit face now and then
      if (r() < .35) { let cx = xt + (mt - xt) * (.3 + r() * .4), d = `M${f(cx)} ${f(y0 + 10)}`; for (let k = 1; k <= 3; k++) { cx += (r() - .5) * 14; d += ` L${f(cx)} ${f(y0 + 10 + (th - 20) * k / 3)}`; } el('path', { class: 'w-crack', d }, slabs); }
      xt = x2t; xb = x2b;
    }
    el('polygon', { fill: rgb(mix(base, INK, .55)), points: pts([[e - 40, y1 - 2], [R + 40, y1 - 2], [R + 40, y1 + 7], [e - 40, y1 + 9]]) }, slabs);
    // snow settles on the tier tops near the summit
    if (y0 < peakY + vh * 1.1) {
      for (let x = e; x < R; x += 50 + r() * 70) {
        const w = 40 + r() * 70;
        el('path', { class: 'w-snow', d: `M${f(x)} ${f(y0 + 2)} Q${f(x + w / 2)} ${f(y0 - 12 - r() * 6)} ${f(x + w)} ${f(y0 + 2)} L${f(x + w * .8)} ${f(y0 + 10)} L${f(x + w * .55)} ${f(y0 + 6)} L${f(x + w * .3)} ${f(y0 + 13)} Z` }, slabs);
      }
    }
    ty = y1 + 8;
  }
  // summit cap
  el('polygon', { class: 'w-snow', points: pts([peak, [peak[0] + W * .1, peakY + 64], [peak[0] + 34, peakY + 52], [peak[0] + 8, peakY + 82], [peak[0] - 26, peakY + 50], [peak[0] - W * .09, peakY + 60]]) }, art);
  el('polygon', { class: 'w-rock', fill: 'none', points: pts(outline) }, art);

  // base camp ground
  el('polygon', { class: 'w-ledge', fill: '#8A6A48', points: pts([[-W * .35, H + 40], [-W * .12, baseY + 40], [W * .1, baseY + 4], [W + 30, baseY - 6], [W + 30, H + 40]]) }, art);
  for (let k = 0; k < 7; k++) { const x = W * (.08 + r() * .86), yy = baseY + 18 + r() * 36, w = 14 + r() * 22; el('polygon', { class: 'w-stone', points: pts([[x, yy], [x + w * .4, yy - w * .45], [x + w, yy - w * .2], [x + w * .9, yy + 4], [x + w * .1, yy + 4]]) }, art); }
  tent(W * .58, baseY - 2, 1.15); tent(W * .82, baseY - 4, .9);

  // ledges at each camp: a proper shelf with its underside in shadow
  const camps = sections.slice(1, -1).map((sec) => atClimber(sec) + 10);
  for (const y of camps) {
    const e = edgeAt(y), w = Math.min(W * .62, 250), c = tone(y);
    el('polygon', { class: 'w-ledge', fill: rgb(mix(c, INK, .5)), points: pts([[e - 46, y + 10], [e + w + 14, y + 10], [e + w * .55, y + 46], [e - 20, y + 34]]) }, art);
    el('polygon', { class: 'w-ledge', fill: rgb(mix(c, LIGHT, .25)), points: pts([[e - 50, y], [e + w, y - 3], [e + w + 14, y + 10], [e - 46, y + 12]]) }, art);
    tent(e + w * .55, y, .8);
  }

  // the route: from base camp up to the peak, through the camp ledges
  const startY = Math.min(baseY - 40, vh * CLIMBER_Y - wallShift(0) + 6);
  route = [[W * .5, startY]];
  let y = startY;
  const stops = [...camps].sort((a, b) => b - a);
  while (y > peakY + 140) {
    y -= 130 + r() * 70;
    const next = stops.find((cy) => cy < route[route.length - 1][1] && cy >= y);
    if (next) { const e = edgeAt(next); route.push([e + Math.min(W * .62, 250) * .2, next - 6]); y = next - 6; continue; }
    if (y <= peakY + 140) break;
    const e = edgeAt(y); route.push([e + (W * .88 - e) * (.3 + r() * .5), y]);
  }
  route.push([peak[0] - 6, peakY + 6]);
  // the rope sags a little between bolts
  let d = `M${f(route[0][0])} ${f(route[0][1])}`;
  for (let i = 1; i < route.length; i++) { const [ax, ay] = route[i - 1], [bx, by] = route[i]; d += ` Q${f((ax + bx) / 2 + 6)} ${f((ay + by) / 2 + 16)} ${f(bx)} ${f(by)}`; }
  el('path', { class: 'w-rope-shadow', d }, art);
  el('path', { class: 'w-rope', d }, art);
  for (const [x, yy] of route.slice(1, -1)) {
    el('path', { class: 'w-bolt', d: `M${f(x - 5)} ${f(yy - 6)} h10 v8 a5 5 0 0 1 -10 0 z` }, art);
    el('circle', { class: 'w-bolt-hole', cx: f(x), cy: f(yy + 2), r: 2 }, art);
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
    .sort((a, b) => a.y - b.y);           // base camp at the top of the page, summit at the bottom
}
function altitudeAt(y) {
  if (y <= anchors[0].y) return BASE;
  for (let i = 0; i < anchors.length - 1; i++) {
    const a = anchors[i], b = anchors[i + 1];
    if (y <= b.y) return a.alt + (b.alt - a.alt) * (y - a.y) / Math.max(1, b.y - a.y);
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
  let here = anchors[0]?.id; for (const a of anchors) if (y >= a.y - vh * .3) here = a.id;
  navLinks.forEach((l) => { if (l.getAttribute('href') === '#' + here) l.setAttribute('aria-current', 'location'); else l.removeAttribute('aria-current'); });

  // the wall slides down as you scroll; the climber holds a fixed height on screen
  const shift = wallShift(Math.min(maxScroll, Math.max(0, y)));
  art.style.transform = `translate3d(0, ${shift.toFixed(1)}px, 0)`;
  if (route.length) {
    const cw = climber.clientWidth, ch = climber.clientHeight;
    const docY = vh * CLIMBER_Y - shift;                     // wall height at the climber
    let cx, cy, top = false;
    if (docY >= route[0][1]) { cx = route[0][0]; cy = route[0][1] + shift; }                       // at the foot of the route
    else if (docY <= peak[1] + 6) { cx = peak[0] - 6; cy = peak[1] + shift - ch * .42; top = true; }  // on the summit
    else { cx = routeXAt(docY); cy = vh * CLIMBER_Y; }
    climber.style.setProperty('--cx', (wallLeft + cx - cw / 2).toFixed(1) + 'px');
    climber.style.setProperty('--cy', (cy - ch / 2).toFixed(1) + 'px');
    climber.classList.toggle('top', top);
    climber.classList.toggle('pose-b', !reduce && !top && Math.floor(docY / 64) % 2 === 1);
    climber.classList.add('is-ready');
  }
}
const queue = () => { if (!ticking) { ticking = true; requestAnimationFrame(frame); } };
function layout() { drawWall(); measure(); queue(); }
addEventListener('scroll', queue, { passive: true });
let rt; addEventListener('resize', () => { clearTimeout(rt); rt = setTimeout(layout, 120); });
addEventListener('load', layout);
new ResizeObserver(() => { clearTimeout(rt); rt = setTimeout(layout, 60); }).observe(climb);
layout();

/* ---------- Footer year ---------- */
const year = document.querySelector('[data-year]');
if (year) year.textContent = String(new Date().getFullYear());
