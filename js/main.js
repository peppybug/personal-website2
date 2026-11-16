// Page scripts on top of the kit (system.js, motion.js and layout.js handle the nav,
// hovers, presses, focus and the hero's entrance). This file runs only the two scroll
// scenes the brief asks for and the ember layer, and only with motion allowed.
const root = document.documentElement;
const motion = () => root.classList.contains('motion');

/* ---------- Scroll scenes: progress 0 -> 1 through each scene's own section ---------- */
const scenes = [...document.querySelectorAll('[data-scene]')].map((el) => ({
  el, name: el.dataset.scene, top: 0, height: 0, active: false, beat: -1,
  stage: el.querySelector('.obs__stage, .tour__stage'),
}));
const measure = () => scenes.forEach((s) => { s.top = s.el.getBoundingClientRect().top + scrollY; s.height = s.el.offsetHeight; });

let ticking = false;
function update() {
  ticking = false;
  if (!motion()) return;
  const vh = innerHeight;
  for (const s of scenes) {
    if (!s.active || !s.stage) continue;
    const p = Math.min(1, Math.max(0, (scrollY - s.top) / Math.max(1, s.height - vh)));
    if (s.name === 'obsession') s.stage.style.setProperty('--p', p.toFixed(4));
    if (s.name === 'tour') {
      const beat = Math.min(3, Math.floor(p * 4.0001));
      if (beat !== s.beat) {
        s.beat = beat;
        s.stage.dataset.beat = String(beat);
        s.stage.classList.remove('hit'); void s.stage.offsetWidth; s.stage.classList.add('hit');
      }
    }
  }
}
const queue = () => { if (!ticking) { ticking = true; requestAnimationFrame(update); } };
const io = new IntersectionObserver((entries) => {
  entries.forEach((e) => { const s = scenes.find((x) => x.el === e.target); if (s) s.active = e.isIntersecting; });
  queue();
});
scenes.forEach((s) => io.observe(s.el));
addEventListener('scroll', queue, { passive: true });
addEventListener('resize', () => { measure(); queue(); });
addEventListener('load', () => { measure(); queue(); });
new ResizeObserver(() => { measure(); queue(); }).observe(document.body);
measure();

/* ---------- House of the Dragon: ember field ---------- */
const hotd = document.querySelector('[data-ember-scene]');
const canvas = hotd?.querySelector('.hotd__embers');
if (hotd && canvas && motion()) {
  const ctx = canvas.getContext('2d');
  let embers = [], w = 0, h = 0, raf = 0, visible = false;
  const spawn = (initial) => ({ x: Math.random() * w, y: initial ? Math.random() * h : h + 10, r: 0.6 + Math.random() * 1.8,
    vy: 0.25 + Math.random() * 0.8, drift: Math.random() * Math.PI * 2, sway: 0.3 + Math.random() * 0.7, life: 0.5 + Math.random() * 0.5, hue: 18 + Math.random() * 26 });
  const resize = () => {
    const dpr = Math.min(devicePixelRatio || 1, 2);
    w = hotd.clientWidth; h = hotd.clientHeight;
    canvas.width = Math.round(w * dpr); canvas.height = Math.round(h * dpr);
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    embers = Array.from({ length: Math.min(90, Math.round((w * h) / 11000)) }, () => spawn(true));
  };
  const frame = (t) => {
    ctx.clearRect(0, 0, w, h);
    ctx.globalCompositeOperation = 'lighter';
    for (const e of embers) {
      e.y -= e.vy; e.drift += 0.012; e.x += Math.sin(e.drift) * e.sway * 0.4;
      const a = Math.max(0, Math.min(1, e.y / (h * 0.85)) * e.life * (0.75 + 0.25 * Math.sin(t * 0.006 + e.drift * 3)));
      ctx.fillStyle = `hsla(${e.hue},100%,60%,${a * 0.18})`; ctx.beginPath(); ctx.arc(e.x, e.y, e.r * 4, 0, 7); ctx.fill();
      ctx.fillStyle = `hsla(${e.hue + 10},100%,75%,${a})`; ctx.beginPath(); ctx.arc(e.x, e.y, e.r, 0, 7); ctx.fill();
      if (e.y < -10 || (a <= 0.01 && e.y < h * 0.2)) Object.assign(e, spawn(false));
    }
    raf = requestAnimationFrame(frame);
  };
  const start = () => { if (!raf && visible && !document.hidden) raf = requestAnimationFrame(frame); };
  const stop = () => { cancelAnimationFrame(raf); raf = 0; };
  new IntersectionObserver(([e]) => { visible = e.isIntersecting; if (visible) hotd.classList.add('is-lit'); visible ? start() : stop(); }, { threshold: 0.15 }).observe(hotd);
  new ResizeObserver(resize).observe(hotd);
  document.addEventListener('visibilitychange', () => (document.hidden ? stop() : start()));
  resize();
}

/* ---------- Footer year ---------- */
const year = document.querySelector('[data-year]');
if (year) year.textContent = String(new Date().getFullYear());
