/* fliesen.js
   Mobile Nav (Burger + Overlay) – wie Startseite/Waschbecken
*/
(() => {
  const btn = document.getElementById('navToggle');
  const overlay = document.getElementById('navOverlay');
  const closeBtn = document.getElementById('navClose');
  const drawer = overlay?.querySelector('.navDrawer');

  if (!btn || !overlay || !drawer) return;

  function openNav(){
    overlay.classList.add('is-open');
    overlay.setAttribute('aria-hidden', 'false');
    btn.setAttribute('aria-expanded', 'true');
    document.documentElement.style.overflow = 'hidden';
    document.body.style.overflow = 'hidden';
  }

  function closeNav(){
    overlay.classList.remove('is-open');
    overlay.setAttribute('aria-hidden', 'true');
    btn.setAttribute('aria-expanded', 'false');
    document.documentElement.style.overflow = '';
    document.body.style.overflow = '';
  }

  btn.addEventListener('click', () => {
    overlay.classList.contains('is-open') ? closeNav() : openNav();
  });

  closeBtn?.addEventListener('click', closeNav);

  overlay.addEventListener('click', (e) => {
    if (e.target === overlay) closeNav();
  });

  overlay.querySelectorAll('a').forEach(a => {
    a.addEventListener('click', closeNav);
  });

  window.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && overlay.classList.contains('is-open')) closeNav();
  });
})();
