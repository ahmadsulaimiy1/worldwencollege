/* =====================================================================
   THE DOCK.

   Opens the four plates, and — the part that matters — knows when to get
   out of the way.

   A floating control is a promise that it will never be the thing
   standing between a reader and what they came for. Two rules keep it:

     1. It retires while the footer is on screen. The footer carries the
        College's own closing actions, and a floating seal hovering over
        them is a control competing with the thing it exists to serve.
     2. It closes on Escape, on outward click, and on following any plate.

   No library, no dependency, and it does nothing at all if the markup is
   absent — the partial is optional and the pages must not care.
   ===================================================================== */
(function () {
  'use strict';

  var dock = document.querySelector('[data-dock]');
  if (!dock) return;

  var toggle = dock.querySelector('[data-dock-toggle]');
  var stack = dock.querySelector('[data-dock-stack]');
  if (!toggle || !stack) return;

  function setOpen(open) {
    dock.classList.toggle('is-open', open);
    toggle.setAttribute('aria-expanded', String(open));
    if (open) {
      stack.hidden = false;
    } else {
      /* Hidden only AFTER the closing transition, or the plates vanish
         instead of withdrawing. 260ms matches the CSS. */
      window.setTimeout(function () {
        if (!dock.classList.contains('is-open')) stack.hidden = true;
      }, 260);
    }
  }

  toggle.addEventListener('click', function () {
    setOpen(!dock.classList.contains('is-open'));
  });

  /* On a pointer device the dock opens on approach — a reader who has
     moved to the corner has already asked for it. On touch it does not,
     because there is no hover and an accidental open would cover content. */
  if (window.matchMedia && window.matchMedia('(hover: hover) and (pointer: fine)').matches) {
    dock.addEventListener('mouseenter', function () { setOpen(true); });
    dock.addEventListener('mouseleave', function () { setOpen(false); });
  }

  document.addEventListener('click', function (e) {
    if (!dock.contains(e.target)) setOpen(false);
  });
  document.addEventListener('keydown', function (e) {
    if (e.key === 'Escape') setOpen(false);
  });
  stack.addEventListener('click', function (e) {
    if (e.target.closest('a')) setOpen(false);
  });

  /* Retire over the footer. */
  var footer = document.querySelector('.site-footer');
  if (footer && window.IntersectionObserver) {
    new IntersectionObserver(function (entries) {
      entries.forEach(function (en) {
        dock.classList.toggle('is-retired', en.isIntersecting);
        if (en.isIntersecting) setOpen(false);
      });
    }, { rootMargin: '0px 0px -40% 0px' }).observe(footer);
  }
})();
