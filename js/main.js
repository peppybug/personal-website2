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
