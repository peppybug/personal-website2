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
  const edge = []; for (let y = H + 40, k = 0; y > peakY + taper; y -= 34 + r() * 40, k++) edge.push([W * (.1 + .07 * Math.sin(y / 260) + r() * .07), y]);
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

  // The face is a jittered mesh of rock facets. Each facet gets a height, and the
  // fold between facets is shaded by a light from the upper left, posterised into
  // flat comic tones. Buttresses run up the wall, strata tilt the slabs, ink only
  // goes on the creases, and snow settles on faces that look upward near the top.
  const CELL = Math.max(58, Math.min(80, W / 8));
  const gx0 = -70, gy0 = peakY - 40;
  const cols = Math.ceil((W + 140) / CELL) + 1, rows = Math.ceil((H + 60 - gy0) / CELL) + 1;
  const ribW = W * (.2 + r() * .06), ribPh = r() * 6;
  const height = (x, y) => {
    const wob = 46 * Math.sin(y / 330 + ribPh) + 20 * Math.sin(y / 97);
    const rib = 70 * Math.abs(Math.sin(((x + wob) / ribW) * Math.PI));      // buttresses and gullies
    const strata = 34 * (((y + x * .22) / (150 + 40 * Math.sin(x / 260))) % 1); // tilted bedding
    return rib + strata;
  };
  const P = [];
  for (let j = 0; j < rows; j++) {
    const row = [];
    for (let i = 0; i < cols; i++) {
      const edgeX = i === 0 || i === cols - 1, edgeY = j === 0 || j === rows - 1;
      const x = gx0 + i * CELL + (edgeX ? 0 : (r() - .5) * CELL * .7);
      const y = gy0 + j * CELL + (edgeY ? 0 : (r() - .5) * CELL * .7);
      row.push([x, y, height(x, y) + (r() - .5) * 16]);
    }
    P.push(row);
  }
  const L = (() => { const v = [-.55, -.62, .56], m = Math.hypot(...v); return v.map((c) => c / m); })();
  const SNOW_LIT = [247, 243, 238], SNOW_SH = [190, 202, 220];
  const edges = new Map();
  const facet = (ia, ib, ic) => {
    const [a, b, c] = [ia, ib, ic].map(([i, j]) => P[j][i]);
    const u = [b[0] - a[0], b[1] - a[1], b[2] - a[2]], v = [c[0] - a[0], c[1] - a[1], c[2] - a[2]];
    let n = [u[1] * v[2] - u[2] * v[1], u[2] * v[0] - u[0] * v[2], u[0] * v[1] - u[1] * v[0]];
    if (n[2] < 0) n = n.map((q) => -q);
    const m = Math.hypot(...n); n = n.map((q) => q / m);
    const lum = Math.max(0, n[0] * L[0] + n[1] * L[1] + n[2] * L[2]);
    const s = Math.round(Math.min(1, Math.max(0, (lum - .45) / .5)) * 4) / 4;  // four flat tones
    const cy = (a[1] + b[1] + c[1]) / 3, base = tone(cy);
    const snowZone = 1 - (cy - peakY) / (vh * 1.6);
    const cx = (a[0] + b[0] + c[0]) / 3;
    const patch = Math.sin(cx / 85 + 2 * Math.sin(cy / 150)) * Math.cos(cy / 110 + cx / 310);   // smooth snowfields
    const gully = 1 - Math.abs(Math.sin(((cx + 46 * Math.sin(cy / 330 + ribPh) + 20 * Math.sin(cy / 97)) / ribW) * Math.PI));
    const snowy = snowZone > 0 && snowZone * 1.25 + patch * .35 + gully * .35 + (-n[1] > .1 ? .15 : -.2) > .85;
    const col = snowy ? mix(SNOW_SH, SNOW_LIT, Math.min(1, s + .25)) : mix(mix(base, INK, .36), mix(base, LIGHT, .3), s);
    el('polygon', { class: 'w-facet', fill: rgb(col), stroke: rgb(col), points: pts([a, b, c]) }, slabs);
    for (const [p, q] of [[ia, ib], [ib, ic], [ic, ia]]) {
      const k = [p, q].map(([i, j]) => j * cols + i).sort((x, y) => x - y).join('-');
      const e = edges.get(k); const val = s + (snowy ? 2 : 0);
      if (e) e.push(val); else edges.set(k, [val, p, q]);
    }
  };
  for (let j = 0; j < rows - 1; j++) for (let i = 0; i < cols - 1; i++) {
    if (r() < .5) { facet([i, j], [i + 1, j], [i + 1, j + 1]); facet([i, j], [i + 1, j + 1], [i, j + 1]); }
    else { facet([i, j], [i + 1, j], [i, j + 1]); facet([i + 1, j], [i + 1, j + 1], [i, j + 1]); }
  }
  // ink on the folds: strong where the light changes a lot, fine where it changes a little
  let strong = '', fine = '';
  for (const [s1, p, q, s2] of edges.values()) {
    if (s2 === undefined) continue;
    const d = Math.abs(s1 - s2), [a, b] = [p, q].map(([i, j]) => P[j][i]);
    const seg = `M${f(a[0])} ${f(a[1])}L${f(b[0])} ${f(b[1])}`;
    if (d >= .75) strong += seg; else if (d >= .5) fine += seg;
  }
  el('path', { class: 'w-fold-fine', d: fine }, slabs);
  el('path', { class: 'w-fold', d: strong }, slabs);
  // a few long cracks that ignore the facets
  for (let k = 0; k < Math.round(H / 420); k++) {
    let cx = W * (.2 + r() * .7), cy = peakY + vh * .4 + r() * (H - peakY - vh * .4), d = `M${f(cx)} ${f(cy)}`;
    const len = 4 + Math.floor(r() * 4);
    for (let s = 0; s < len; s++) { cx += (r() - .5) * 26; cy += 22 + r() * 26; d += ` L${f(cx)} ${f(cy)}`; }
    el('path', { class: 'w-crack', d }, slabs);
  }
  el('polygon', { class: 'w-rock', fill: 'none', points: pts(outline) }, art);

  // base camp ground
  el('polygon', { class: 'w-ledge', fill: '#8A6A48', points: pts([[-W * .35, H + 40], [-W * .12, baseY + 40], [W * .1, baseY + 4], [W + 30, baseY - 6], [W + 30, H + 40]]) }, art);
  for (let k = 0; k < 7; k++) { const x = W * (.08 + r() * .86), yy = baseY + 18 + r() * 36, w = 14 + r() * 22; el('polygon', { class: 'w-stone', points: pts([[x, yy], [x + w * .4, yy - w * .45], [x + w, yy - w * .2], [x + w * .9, yy + 4], [x + w * .1, yy + 4]]) }, art); }
  tent(W * .36, baseY + 1, 1.9); tent(W * .74, baseY - 5, 1.5);

  // ledges at each camp: a proper shelf with its underside in shadow
  const camps = sections.slice(1, -1).map((sec) => atClimber(sec) + 10);
  for (const y of camps) {
    const e = edgeAt(y), w = Math.min(W * .7, 300), c = tone(y);
    el('polygon', { class: 'w-ledge', fill: rgb(mix(c, INK, .5)), points: pts([[e - 46, y + 10], [e + w + 14, y + 10], [e + w * .55, y + 46], [e - 20, y + 34]]) }, art);
    el('polygon', { class: 'w-ledge', fill: rgb(mix(c, LIGHT, .25)), points: pts([[e - 50, y], [e + w, y - 3], [e + w + 14, y + 10], [e - 46, y + 12]]) }, art);
    tent(e + w * .64, y, 1.5);
  }

  // the route: from base camp up to the peak, through the camp ledges
  const startY = Math.min(baseY - 40, vh * CLIMBER_Y - wallShift(0) + 6);
  route = [[W * .5, startY]];
  let y = startY;
  const stops = [...camps].sort((a, b) => b - a);
  while (y > peakY + 140) {
    y -= 130 + r() * 70;
    const next = stops.find((cy) => cy < route[route.length - 1][1] && cy >= y);
    if (next) { const e = edgeAt(next); route.push([e + Math.min(W * .7, 300) * .18, next - 6]); y = next - 6; continue; }
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
    // a ridge tent seen from three quarters: lit front, shaded side, open door, guy lines
    const t = el('g', { class: 'w-tent-g' }, art);
    const fx = x - 10 * s, apex = [fx, gy - 34 * s], back = [x + 30 * s, gy - 30 * s];
    el('path', { class: 'w-guy', d: `M${f(apex[0])} ${f(apex[1])} L${f(fx - 44 * s)} ${f(gy)} M${f(back[0])} ${f(back[1])} L${f(back[0] + 30 * s)} ${f(gy)}` }, t);
    el('polygon', { class: 'w-tent-side', points: pts([apex, back, [x + 52 * s, gy], [fx + 26 * s, gy]]) }, t);
    el('polygon', { class: 'w-tent', points: pts([[fx - 26 * s, gy], apex, [fx + 26 * s, gy]]) }, t);
    el('polygon', { class: 'w-tent-door', points: pts([[fx - 10 * s, gy], [fx, gy - 22 * s], [fx + 10 * s, gy]]) }, t);
    el('line', { class: 'w-tent-seam', x1: f(fx + 6 * s), y1: f(gy - 28 * s), x2: f(x + 40 * s), y2: f(gy - 6 * s) }, t);
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
    else if (docY <= peak[1] + 6) { cx = peak[0] - 6; cy = peak[1] + shift - ch * .35; top = true; }  // on the summit
    else { cx = routeXAt(docY); cy = vh * CLIMBER_Y; }
    climber.style.setProperty('--cx', (wallLeft + cx - cw / 2).toFixed(1) + 'px');
    climber.style.setProperty('--cy', (cy - ch / 2).toFixed(1) + 'px');
    climber.classList.toggle('top', top);
    if (!top) pose(reduce ? 0 : (route[0][1] - docY) / (cw / 60) / CYCLE);
    else torso.removeAttribute('transform');
    climber.classList.add('is-ready');
  }
}
/* ---------- Climbing cycle ----------
   Each hand and foot grips a hold that stays put on the rock, so while it grips it slides
   down relative to the body as he rises. One limb moves at a time, in the diagonal order
   climbers use (right hand, left foot, left hand, right foot); elbows and knees are
   solved with two-bone IK and bend outward. Units are the climber's viewBox units. */
const SVGNS = 'http://www.w3.org/2000/svg';
const GRIP = .75, REACH = 20, CYCLE = REACH / GRIP;
const climbG = climber.querySelector('.cl-climb'), torso = climber.querySelector('.cl-torso');
const mk = (tag, cls, parent) => { const n = document.createElementNS(SVGNS, tag); n.setAttribute('class', cls); parent.appendChild(n); return n; };
const LIMBS = [
  { leg: true, side: -1, root: [-4.5, 9], a: 14, b: 15, top: 18, x: -10, off: .25 },
  { leg: true, side: 1, root: [4.5, 9], a: 14, b: 15, top: 18, x: 9.5, off: .75 },
  { leg: false, side: 1, root: [8, -12], a: 14, b: 14, top: -40, x: 13.5, off: 0 },
  { leg: false, side: -1, root: [-8, -12], a: 14, b: 14, top: -40, x: -14, off: .5 },
].map((l) => {
  l.o = mk('path', 'cl-o', climbG); l.p = mk('path', l.leg ? 'cl-pants' : 'cl-sleeve', climbG);
  if (l.leg) { l.end = mk('path', 'cl-boot', climbG); l.end.setAttribute('d', 'M-5 -2 h8 a2.5 2.5 0 0 1 2.5 2.5 v1.5 h-12 v-1.5 a2.5 2.5 0 0 1 1.5 -2.5 z'); }
  else { l.end = mk('circle', 'cl-glove', climbG); l.end.setAttribute('r', '3.2'); }
  return l;
});
climbG.append(...LIMBS.filter((l) => !l.leg).flatMap((l) => [l.o, l.p, l.end]));   // arms over legs
const holdX = (l, i) => l.x + 3.2 * Math.sin(i * 2.39 + l.off * 9) * l.side;
function ik(S, E, a, b, side) {
  let dx = E[0] - S[0], dy = E[1] - S[1], d = Math.hypot(dx, dy) || .01;
  const max = a + b - .4;
  if (d > max) { E = [S[0] + dx / d * max, S[1] + dy / d * max]; dx = E[0] - S[0]; dy = E[1] - S[1]; d = max; }
  d = Math.max(d, Math.abs(a - b) + .5);
  const ang = Math.atan2(dy, dx), al = Math.acos(Math.min(1, (a * a + d * d - b * b) / (2 * a * d)));
  const j1 = [S[0] + a * Math.cos(ang + al), S[1] + a * Math.sin(ang + al)], j2 = [S[0] + a * Math.cos(ang - al), S[1] + a * Math.sin(ang - al)];
  // knees bend outward; elbows hang down and out, as when pulling on a hold
  const pick = side === 0 ? (j1[1] > j2[1] ? j1 : j2) : ((j1[0] - j2[0]) * side > 0 ? j1 : j2);
  return [pick, E];
}
function pose(p) {
  // the weight shifts toward the side whose hand is gripping, with a small bob from each push
  const bx = 1.6 * Math.sin(2 * Math.PI * p), by = 1.1 * Math.sin(4 * Math.PI * p);
  torso.setAttribute('transform', `translate(${bx.toFixed(2)} ${by.toFixed(2)}) rotate(${(bx * 1.4).toFixed(2)} 0 0)`);
  for (const l of LIMBS) {
    const ph = p + l.off, i = Math.floor(ph), q = ph - i;
    let x, y;
    if (q < GRIP) { x = holdX(l, i); y = l.top + REACH * (q / GRIP); }                   // gripping: hold slides down
    else { const m = (q - GRIP) / (1 - GRIP), e = m * m * (3 - 2 * m);                    // moving up to the next hold
      x = holdX(l, i) + (holdX(l, i + 1) - holdX(l, i)) * e + l.side * 3.5 * Math.sin(Math.PI * m);
      y = l.top + REACH - REACH * e - (l.leg ? 0 : 2.5 * Math.sin(Math.PI * m)); }
    const S = [l.root[0] + bx, l.root[1] + by], [J, E] = ik(S, [x, y], l.a, l.b, l.leg ? l.side : 0);
    const d = `M${S[0].toFixed(2)} ${S[1].toFixed(2)} L${J[0].toFixed(2)} ${J[1].toFixed(2)} L${E[0].toFixed(2)} ${E[1].toFixed(2)}`;
    l.o.setAttribute('d', d); l.p.setAttribute('d', d);
    if (l.leg) l.end.setAttribute('transform', `translate(${E[0].toFixed(2)} ${(E[1] + 1).toFixed(2)})`);
    else { l.end.setAttribute('cx', E[0].toFixed(2)); l.end.setAttribute('cy', (E[1] - 1).toFixed(2)); }
  }
}
pose(0);

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
