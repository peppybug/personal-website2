// Small page behaviour: the phone menu, the endless photo reel and the year.
const toggle = document.querySelector('.nav__toggle');
const links = document.getElementById('nav-links');
const setOpen = (open) => { toggle.setAttribute('aria-expanded', String(open)); links.classList.toggle('is-open', open); };
toggle?.addEventListener('click', () => setOpen(toggle.getAttribute('aria-expanded') !== 'true'));
links?.addEventListener('click', (e) => { if (e.target.closest('a')) setOpen(false); });
addEventListener('keydown', (e) => { if (e.key === 'Escape') setOpen(false); });

// The reel drifts by half its width, so a hidden copy of the list makes the loop seamless.
const list = document.querySelector('.reel__list');
if (list && !matchMedia('(prefers-reduced-motion: reduce)').matches) {
  const copy = list.cloneNode(true);
  copy.setAttribute('aria-hidden', 'true');
  copy.querySelectorAll('img').forEach((img) => { img.alt = ''; });
  list.after(copy);
}

const year = document.querySelector('[data-year]');
if (year) year.textContent = new Date().getFullYear();

/* ---------- Scroll animations ----------
   Everything is visible without this script and for anyone who prefers reduced motion.
   Reveals play once as each piece arrives; a few effects follow the scroll position
   through CSS variables (--p: 0→1 across the viewport, --e: 0→1 while it arrives). */
const still = matchMedia('(prefers-reduced-motion: reduce)').matches;
if (!still) {
  const root = document.documentElement;

  // split a heading into words (and icon tiles) so each can move on its own
  const split = (el) => {
    let i = 0; const words = [];
    const walk = (parent) => { for (const node of [...parent.childNodes]) {
      if (node.nodeType === 3) {
        const frag = document.createDocumentFragment();
        node.textContent.split(/( )/).forEach((part) => {
          if (part === ' ' || part === '') { frag.append(part); return; }
          const w = document.createElement('span'); w.className = 'w'; w.textContent = part; w.style.setProperty('--i', i++); words.push(w); frag.append(w);
        });
        node.replaceWith(frag);
      } else if (node.classList.contains('line')) { walk(node); }
      else if (!node.classList.contains('sr-only')) { node.classList.add('w'); node.style.setProperty('--i', i++); words.push(node); }
    } };
    walk(el);
    el.classList.add('split');
    return words;
  };
  const hero = document.querySelector('.hero__title');
  if (hero) split(hero);
  const close = document.querySelector('.close__title');
  const closeWords = close ? split(close) : [];

  // reveal once on arrival, with a stagger inside lists
  const reveal = [
    ['.block__title, .grok__title', 'reveal reveal--mask'],
    ['.grok__copy > p, .grok__meta, .paper, .map, .close__links, .block__head > .pill', 'reveal'],
    ['.roles > li, .films > .film, .projects > li', 'reveal', 1],
    ['.countries > li', 'reveal reveal--chip', 1],
  ];
  // masked titles have no visible area until they reveal, so their parent is watched instead
  const waiting = new Map();
  const io = new IntersectionObserver((entries) => {
    for (const en of entries) if (en.isIntersecting) { (waiting.get(en.target) || []).forEach((el) => el.classList.add('in')); waiting.delete(en.target); io.unobserve(en.target); }
  }, { rootMargin: '0px 0px -8% 0px', threshold: .12 });
  const watch = (el, target) => { if (!waiting.has(target)) { waiting.set(target, []); io.observe(target); } waiting.get(target).push(el); };
  for (const [sel, cls, stagger] of reveal) {
    document.querySelectorAll(sel).forEach((el) => {
      el.classList.add(...cls.split(' '));
      if (stagger) el.style.setProperty('--d', [...el.parentElement.children].indexOf(el));
      watch(el, cls.includes('mask') ? el.parentElement : el);
    });
  }

  // scroll-linked pieces
  const tracked = [...document.querySelectorAll('.reel, .grok, .film__frame, .project__shot, .close__title')];
  const nav = document.querySelector('.nav');
  let queued = false;
  const clamp = (v) => Math.min(1, Math.max(0, v));
  const tick = () => {
    queued = false;
    const vh = innerHeight;
    for (const el of tracked) {
      const r = el.getBoundingClientRect();
      if (r.bottom < -200 || r.top > vh + 200) continue;
      el.style.setProperty('--p', clamp((vh - r.top) / (vh + r.height)).toFixed(4));
      el.style.setProperty('--e', clamp((vh - r.top) / (vh * .55)).toFixed(4));
      if (el === close) {
        // light the closing line word by word as it rises up the screen
        const t = clamp((vh * .9 - r.top) / (vh * .5)) * (closeWords.length + 1);
        closeWords.forEach((w, i) => w.style.setProperty('--lit', clamp(t - i).toFixed(3)));
      }
    }
    nav?.classList.toggle('is-scrolled', scrollY > 8);
  };
  const queue = () => { if (!queued) { queued = true; requestAnimationFrame(tick); } };
  addEventListener('scroll', queue, { passive: true });
  addEventListener('resize', queue);
  root.classList.add('motion');
  tick();
}
