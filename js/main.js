// Small enhancements only: the page is complete without this file.

/* Pill nav menu */
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

/* Footer year */
const year = document.querySelector('[data-year]');
if (year) year.textContent = String(new Date().getFullYear());

/* ==========================================================================
   Motion (skipped entirely for visitors who prefer reduced motion)
   ========================================================================== */
const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
if (!reduce && 'IntersectionObserver' in window) {
  document.documentElement.classList.add('anim');

  // Wrap each section title's text so it can slide out of a mask
  document.querySelectorAll('[data-anim="title"]').forEach((h) => {
    const t = document.createElement('span'); t.className = 't';
    while (h.firstChild) t.append(h.firstChild);
    h.append(t);
  });
  // Stagger index for children
  document.querySelectorAll('[data-anim="stagger"]').forEach((g) => [...g.children].forEach((c, i) => c.style.setProperty('--i', i)));

  // Reveal on scroll, once
  const io = new IntersectionObserver((entries) => {
    entries.forEach((e) => { if (e.isIntersecting) { const t = e.target; t.classList.add('is-in'); io.unobserve(t); if (t.dataset.anim === 'stagger') setTimeout(() => t.classList.add('done'), 1600); } });
  }, { threshold: 0.15, rootMargin: '0px 0px -8% 0px' });
  document.querySelectorAll('[data-anim]').forEach((el) => io.observe(el));
  // Never leave a focused element hidden
  document.addEventListener('focusin', (e) => e.target.closest?.('[data-anim]')?.classList.add('is-in'));

  // Scroll-linked: progress line, hero drift, film still parallax
  const root = document.documentElement;
  const heroEl = document.querySelector('.hero');
  const panels = [...document.querySelectorAll('.film__panel')];
  let ticking = false;
  const frame = () => {
    ticking = false;
    const y = scrollY, vh = innerHeight;
    const max = root.scrollHeight - vh;
    root.style.setProperty('--p', max > 0 ? (y / max).toFixed(4) : 0);
    if (heroEl && y < vh * 1.2) {
      heroEl.style.setProperty('--hero-y', (y * 0.35).toFixed(1) + 'px');
      heroEl.style.setProperty('--hero-inner-y', (y * 0.15).toFixed(1) + 'px');
      heroEl.style.setProperty('--hero-o', Math.max(0, 1 - y / (vh * 0.85)).toFixed(3));
    }
    for (const p of panels) {
      const r = p.getBoundingClientRect();
      if (r.bottom < 0 || r.top > vh) continue;
      const k = (r.top + r.height / 2 - vh / 2) / vh;   // -1 .. 1 across the screen
      p.style.setProperty('--py', (k * -40).toFixed(1) + 'px');
    }
  };
  const queue = () => { if (!ticking) { ticking = true; requestAnimationFrame(frame); } };
  addEventListener('scroll', queue, { passive: true });
  addEventListener('resize', queue);
  frame();
}
