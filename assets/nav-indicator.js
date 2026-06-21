/* =====================================================================
   nav-indicator.js — shared header nav marker (strip + dot)
   blueprint-rebuild-v2 amendment. One behaviour on every page, every mode:
   - The dot is always visible under the active item — a primary-nav link OR
     the header-left "О проекте" (About) link.
   - The hairline strip is hidden at rest and FLASHES once (fade in → out) on a
     selection change, marking the current item. (chrome.css owns the opacity:
     .nav-strip{opacity:0!important} + .nav-strip.nav-flash{opacity:1!important}.)
   - Positions IMMEDIATELY on DOMContentLoaded (no fonts.ready wait) to avoid the
     load-time delay; repositions on fonts.ready + resize for pixel accuracy.
   Replaces every page's former inline nav-indicator script.
   ===================================================================== */
(function () {
  'use strict';

  function init() {
    var nav = document.querySelector('.primary-nav');
    if (!nav) return;
    /* The strip/dot live INSIDE primary-nav on private pages but are siblings
       in header-inner on public/About pages — search the whole header. */
    var strip = document.querySelector('.nav-strip');
    var dot = document.querySelector('.nav-dot');
    if (!strip || !dot) return;

    var headerInner = document.querySelector('.header-inner');
    var aboutLink = document.querySelector('.header-about');
    var navLinks = Array.prototype.slice.call(nav.querySelectorAll('.nav-link'));
    var allLinks = aboutLink ? [aboutLink].concat(navLinks) : navLinks;
    if (!allLinks.length) return;

    /* The dot's resting vertical position, as an offset above the header-inner
       bottom edge (matches the About item). Anchoring every non-home dot to
       header-inner keeps them on one baseline regardless of whether the strip's
       offset parent is header-inner (public/About) or primary-nav (private). */
    var DOT_BASELINE = 17;

    function isHome(l) { return l.classList.contains('nav-link-home'); }

    function activeLink() {
      if (aboutLink && aboutLink.getAttribute('aria-current') === 'page') return aboutLink;
      return nav.querySelector('.nav-link[aria-current="page"]');
    }

    /* Position relative to the strip's own offset parent so the marker lands
       correctly under primary-nav links AND the header-left About link
       (which sits to the left → negative offset). */
    function moveTo(link) {
      var op = strip.offsetParent || nav;
      var opRect = op.getBoundingClientRect();
      var r = link.getBoundingClientRect();
      var left = Math.round(r.left - opRect.left);
      var width = Math.round(r.width);
      strip.style.left = left + 'px';
      strip.style.width = width + 'px';
      dot.style.left = (left + Math.round(width / 2)) + 'px';
      var hBottom = (headerInner || op).getBoundingClientRect().bottom;
      dot.style.bottom = isHome(link)
        ? Math.round(opRect.bottom - r.bottom - 3.5) + 'px'
        : Math.round(opRect.bottom - (hBottom - DOT_BASELINE)) + 'px';
      /* Anchor the strip vertically to header-inner too, so it aligns with the
         dot on every page (the dot sits in the strip's masked gap) instead of
         drifting to the offset parent's CSS bottom (which differs by family). */
      strip.style.bottom = Math.round(opRect.bottom - (hBottom - (DOT_BASELINE + 3))) + 'px';
    }

    function placeDot(link, instant) {
      if (!link) { dot.style.opacity = '0'; return; }
      if (instant) {
        var t = dot.style.transition;
        dot.style.transition = 'none';
        moveTo(link);
        void dot.offsetWidth;
        dot.style.transition = t;
      } else {
        moveTo(link);
      }
      dot.style.opacity = '1';   // dot is always visible for the active item
    }

    var flashTimer;
    function flashStrip(link) {
      if (!link || isHome(link)) return;       // the Home badge carries no strip
      clearTimeout(flashTimer);
      strip.classList.add('nav-flash');        // fade in (chrome.css)
      flashTimer = setTimeout(function () {
        strip.classList.remove('nav-flash');   // hold, then fade out
      }, 1000);
    }

    /* Immediate placement + flash — no fonts.ready delay. */
    var active = activeLink();
    placeDot(active, true);
    flashStrip(active);

    /* Re-measure once fonts settle (widths shift) and on resize. */
    if (document.fonts && document.fonts.ready) {
      document.fonts.ready.then(function () { placeDot(activeLink(), true); });
    }
    window.addEventListener('resize', function () { placeDot(activeLink(), true); });

    /* Click: update selection (preserves stub suppression). Real links navigate. */
    allLinks.forEach(function (link) {
      link.addEventListener('click', function (e) {
        if (link.dataset.stub) e.preventDefault();
        allLinks.forEach(function (l) { l.removeAttribute('aria-current'); });
        link.setAttribute('aria-current', 'page');
        placeDot(link, false);
        flashStrip(link);
      });
    });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
