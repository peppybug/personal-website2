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
