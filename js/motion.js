/* =====================================================================
   MOTION
   ---------------------------------------------------------------------
   The eight behaviours the flagship layer needs, and nothing else.

   The governing rule for this file is that motion is used to show
   structure — that a chapter has begun, that a figure is being
   counted, that the header has detached from the hero — and never to
   show that the site can animate. Anything that would still be moving
   thirty seconds after a reader stopped scrolling does not belong
   here, with one deliberate exception (the plate drift, which is slow
   enough to be ambient rather than tracked, and lives in CSS).

   REDUCED MOTION. css/brand.css carries the carve-out for everything
   animated in CSS. This file carries the carve-out for everything
   animated in JS, and the two must agree: when the query matches, each
   behaviour below either resolves immediately to its finished state or
   does not run. Never a hidden element, never a half-typed word.

   Written to match js/site.js: one IIFE, no dependencies, no build
   step, and every listener passive where it can be.
   ===================================================================== */
(function () {
  'use strict';

  var reduceMotion = window.matchMedia
    ? window.matchMedia('(prefers-reduced-motion: reduce)')
    : { matches: false, addEventListener: null };

  var prefersReduced = function () { return Boolean(reduceMotion.matches); };
  var supportsIO = 'IntersectionObserver' in window;

  /* Shared observer factory: reveal once, then stop watching. Every
     entrance behaviour here is one-shot — an element that re-animates
     each time it scrolls back into view turns a long page into a
     flickering one. */
  function observeOnce(elements, onEnter, threshold) {
    if (!elements.length) return;
    if (!supportsIO) {
      elements.forEach(onEnter);
      return;
    }
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (!entry.isIntersecting) return;
        io.unobserve(entry.target);
        onEnter(entry.target);
      });
    }, { threshold: threshold == null ? 0.25 : threshold, rootMargin: '0px 0px -8% 0px' });
    elements.forEach(function (el) { io.observe(el); });
  }

  function toArray(selector, root) {
    return Array.prototype.slice.call((root || document).querySelectorAll(selector));
  }

  /* -------------------------------------------------------------------
     1 · HEADER CONDENSE
     -------------------------------------------------------------------
     Adds .is-condensed once the reader has left the top of the page.
     The threshold is deliberately not zero: a header that changes state
     on the first pixel of scroll flickers when a trackpad overscrolls
     back to the top, so there is a band of hysteresis between the on
     and off thresholds.
     ------------------------------------------------------------------- */
  (function headerCondense() {
    var header = document.querySelector('.site-header');
    if (!header) return;
    var root = document.documentElement;

    var ON = 90;   // condense past this
    var OFF = 40;  // expand again only below this
    var condensed = false;
    var ticking = false;

    function apply() {
      ticking = false;
      var y = window.pageYOffset || document.documentElement.scrollTop;
      if (!condensed && y > ON) {
        condensed = true;
        header.classList.add('is-condensed');
      } else if (condensed && y < OFF) {
        condensed = false;
        header.classList.remove('is-condensed');
      }
      // --header-h used to be set only inside THE CONTENTS RAIL below,
      // which bails out on any page without one — roughly forty pages
      // short of every page. css/brand.css's full-screen .nav-mobile
      // needs this on every page it opens on, so it is measured here
      // instead: unconditionally, and on the same schedule that
      // already tracks the condense transition, so a drawer opened
      // after scrolling sits against the header's CURRENT height, not
      // its height at rest.
      root.style.setProperty('--header-h', header.offsetHeight + 'px');
    }
    function onScroll() {
      if (ticking) return;
      ticking = true;
      window.requestAnimationFrame(apply);
    }

    window.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('resize', onScroll, { passive: true });
    apply(); // a reload part-way down the page must start in the right state
  })();

  /* -------------------------------------------------------------------
     1b · THE CONTENTS RAIL
     -------------------------------------------------------------------
     Two jobs, and the first one matters even to a reader who never
     scrolls.

     THE OFFSET. The site header is sticky and the rail hangs beneath
     it, so every anchor on the page has to be scrolled clear of both or
     a deep link from the mega menu drops the reader into the middle of
     the section BEFORE the one they asked for. css/pages.css does the
     work through --header-h and --contents-h; this measures them. It
     has to be measured rather than hard-coded because the header
     condenses on scroll — 88px at rest, ~70 once moving — and a fixed
     offset would be wrong in one state or the other.

     THE CURRENT SECTION. Marked with aria-current so it is announced
     rather than merely coloured. An IntersectionObserver with a top
     margin equal to the chrome, so "current" means the section behind
     the rail, not one hidden underneath it.

     Both degrade cleanly: the CSS fallbacks put the rail in the right
     place with no script at all, and the rail is a plain list of
     in-page links, which is a working table of contents on its own.
     ------------------------------------------------------------------- */
  (function contentsRail() {
    var rail = document.querySelector('.contents');
    if (!rail) return;
    var header = document.querySelector('.site-header');
    var root = document.documentElement;

    var list = rail.querySelector('.contents__list');

    function measure() {
      if (header) root.style.setProperty('--header-h', header.offsetHeight + 'px');
      root.style.setProperty('--contents-h', rail.offsetHeight + 'px');
      // A rail whose last item is sliced off at the viewport edge reads
      // as a rendering fault, not as something you can scroll. The fade
      // is applied only when there is genuinely more to see, so a rail
      // that fits is not given a gradient over a perfectly good label.
      if (list) rail.classList.toggle('contents--scrollable', list.scrollWidth > list.clientWidth + 1);
    }
    measure();
    window.addEventListener('resize', measure, { passive: true });
    // The header changes height when it condenses, and a transition
    // means the new height is not readable on the same frame.
    if (header && window.ResizeObserver) new ResizeObserver(measure).observe(header);

    var links = [].slice.call(rail.querySelectorAll('a[href^="#"]'));
    if (!links.length || !window.IntersectionObserver) return;

    var byId = {};
    var targets = [];
    links.forEach(function (a) {
      var el = document.getElementById(a.getAttribute('href').slice(1));
      if (!el) return;                       // a rail entry with no section
      byId[el.id] = a;
      targets.push(el);
    });

    var visible = {};
    function mark() {
      // The topmost section still on screen. Reading order, not
      // intersection ratio: a short section fully visible under a long
      // one should not steal the mark from the one being read.
      var current = null;
      for (var i = 0; i < targets.length; i++) {
        if (visible[targets[i].id]) { current = targets[i].id; break; }
      }
      links.forEach(function (a) { a.removeAttribute('aria-current'); });
      if (!current || !byId[current]) return;
      var active = byId[current];
      active.setAttribute('aria-current', 'true');
      keepInView(active);
    }

    // ON A PHONE THE MARK IS USELESS IF IT IS OFF SCREEN.
    // The rail scrolls horizontally, so by the fourth section the
    // highlighted item has left the visible strip and the reader is
    // shown a rail that appears to have nothing selected. Centring the
    // active item is what makes the rail tell them where they are.
    //
    // scrollLeft is set directly rather than calling scrollIntoView,
    // which is entitled to scroll ANCESTORS as well — and an in-page
    // navigation that scrolls the page while you read is worse than one
    // that does nothing.
    function keepInView(a) {
      if (!list || list.scrollWidth <= list.clientWidth + 1) return;
      var want = a.offsetLeft - (list.clientWidth - a.offsetWidth) / 2;
      var max = list.scrollWidth - list.clientWidth;
      want = Math.max(0, Math.min(want, max));
      if (Math.abs(want - list.scrollLeft) < 4) return;
      if (list.scrollTo) list.scrollTo({ left: want, behavior: prefersReduced() ? 'auto' : 'smooth' });
      else list.scrollLeft = want;
    }

    // The band the observer treats as "on screen": everything below the
    // chrome, and above the lower 55% of the viewport. Without the
    // bottom margin the section entering from the bottom of a tall
    // screen would take the mark from the one being read.
    var chrome = (header ? header.offsetHeight : 88) + rail.offsetHeight;
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) { visible[e.target.id] = e.isIntersecting; });
      mark();
    }, { rootMargin: '-' + (chrome + 8) + 'px 0px -55% 0px' });
    targets.forEach(function (t) { io.observe(t); });
  })();

  /* -------------------------------------------------------------------
     2 · SPLIT-TEXT RISE
     -------------------------------------------------------------------
     Wraps each word of a [data-split] element in a mask so the words
     rise into place in sequence.

     ACCESSIBILITY. Splitting text into per-word spans is exactly the
     transformation that makes a screen reader announce a headline one
     word at a time, and makes it unselectable as a sentence. So the
     original text is preserved verbatim in an aria-label on the
     element, the generated spans are hidden from the accessibility
     tree, and a normal space is kept between words so copy-and-paste
     still yields a sentence.
     ------------------------------------------------------------------- */
  (function splitText() {
    var targets = toArray('[data-split]');
    if (!targets.length) return;

    targets.forEach(function (el) {
      var text = el.textContent.replace(/\s+/g, ' ').trim();
      if (!text) return;

      el.setAttribute('aria-label', text);
      el.textContent = '';

      var line = document.createElement('span');
      line.className = 'split-line';
      line.setAttribute('aria-hidden', 'true');

      text.split(' ').forEach(function (word, i) {
        var span = document.createElement('span');
        span.className = 'split-word';
        span.style.setProperty('--i', String(i));
        span.textContent = word;
        line.appendChild(span);
        // A real space between the spans, not a margin: this is what
        // keeps the copied text readable.
        line.appendChild(document.createTextNode(' '));
      });

      el.appendChild(line);

      if (prefersReduced()) {
        line.classList.add('is-visible');
        return;
      }
      observeOnce([line], function (target) { target.classList.add('is-visible'); }, 0.2);
    });
  })();

  /* -------------------------------------------------------------------
     2b · THE TYPEWRITER
     -------------------------------------------------------------------
     A line that types itself, for the two or three places on this site
     where the sentence IS the event — the homepage's opening claim, the
     covenant, a chapter that turns on one assertion.

     IT IS NOT A DECORATION AND IT IS RATIONED. A page where several
     headings type themselves is a page nobody can skim, and skimming is
     what a reader does first. `.typeset` is applied by hand, never by a
     rule, and tests/motion-budget.test.mjs holds the count.

     THREE THINGS THAT MAKE IT SAFE, and each of them is the difference
     between an effect and a fault:

     1 · THE TEXT IS ALWAYS IN THE DOM. The element keeps its full text
         in an aria-label and the typing happens in an aria-hidden span,
         so a screen reader reads the finished sentence at once and
         never hears it assembled one character at a time.

     2 · THE BOX NEVER MOVES. The finished text is measured first and
         held as a min-height, so the paragraph below does not walk up
         the page while the line types. Layout shift caused by an
         entrance effect is the most expensive kind: it happens exactly
         when the reader is deciding whether to stay.

     3 · REDUCED MOTION RESOLVES TO THE FINISHED STATE, not to a hidden
         one and not to a half-typed one (CLAUDE.md §2).
     ------------------------------------------------------------------- */
  (function typewriter() {
    var els = toArray('.typeset');
    if (!els.length) return;

    els.forEach(function (el) {
      var text = (el.textContent || '').replace(/\s+/g, ' ').trim();
      if (!text) return;

      el.setAttribute('aria-label', text);

      // Measured before anything is emptied: the height the finished
      // line occupies is the height the box keeps for the whole effect.
      var box = el.getBoundingClientRect();
      if (box.height) el.style.minHeight = Math.ceil(box.height) + 'px';

      if (prefersReduced()) return;   // the text is already correct

      var ink = document.createElement('span');
      ink.setAttribute('aria-hidden', 'true');
      ink.className = 'typeset__ink';
      el.textContent = '';
      el.appendChild(ink);

      var i = 0;
      var timer = null;

      function type() {
        // A little faster than a person and a little uneven, because a
        // metronome reads as a loading bar. The jitter is deterministic
        // per index rather than random, so the same line types the same
        // way twice — a caption that stutters differently on every
        // reload reads as a fault.
        ink.textContent = text.slice(0, i);
        i += 1;
        if (i > text.length) {
          el.classList.add('is-typed');
          window.clearTimeout(timer);
          return;
        }
        var ch = text.charAt(i - 1);
        var pause = ch === '.' || ch === '?' || ch === '!' ? 220
          : ch === ',' || ch === ';' ? 120
            : 18 + ((i * 7) % 22);
        timer = window.setTimeout(type, pause);
      }

      observeOnce([el], function () { type(); }, 0.4);
    });
  })();

  /* -------------------------------------------------------------------
     3 · DRAWN RULES AND 8 · FOIL / WAX SEAL
     -------------------------------------------------------------------
     All three are the same mechanism — add .is-visible on entry — and
     all three resolve immediately under reduced motion, where the CSS
     already pins them to their finished state.
     ------------------------------------------------------------------- */
  (function entranceClasses() {
    var els = toArray('.rule-draw, .foil, .wax-seal');
    if (!els.length) return;
    if (prefersReduced()) {
      els.forEach(function (el) { el.classList.add('is-visible'); });
      return;
    }
    observeOnce(els, function (el) { el.classList.add('is-visible'); }, 0.3);
  })();

  /* -------------------------------------------------------------------
     4 · STAT COUNT-UP
     -------------------------------------------------------------------
     Counts to data-count-to, preserving whatever prefix/suffix the
     authored text carries (so "100%" counts and keeps its per-cent
     sign, and "1,200" keeps its thousands separator).

     The element's authored text is the source of truth for formatting
     and is restored exactly at the end of the run, so the final DOM is
     identical whether the animation ran, was interrupted, or never
     started. That property is what makes this safe to skip entirely
     under reduced motion.
     ------------------------------------------------------------------- */
  (function counters() {
    var els = toArray('[data-count-to]');
    if (!els.length) return;

    // Reserve the final width before counting, or every card shifts
    // sideways as the digits grow.
    els.forEach(function (el) {
      el.style.display = 'inline-block';
      el.style.minWidth = el.getBoundingClientRect().width + 'px';
    });

    if (prefersReduced()) return; // the authored text is already correct

    var DURATION = 1500;
    // easeOutExpo: fast off the mark, a long settle. A linear counter
    // reads as a loading spinner; this reads as a figure arriving.
    function ease(t) { return t === 1 ? 1 : 1 - Math.pow(2, -10 * t); }

    function run(el) {
      var target = parseFloat(el.getAttribute('data-count-to'));
      if (!isFinite(target)) return;

      var final = el.textContent;
      var match = final.match(/-?[\d.,]+/);
      if (!match) return;
      var before = final.slice(0, match.index);
      var after = final.slice(match.index + match[0].length);
      var grouped = match[0].indexOf(',') !== -1;
      var decimals = (match[0].split('.')[1] || '').length;

      var start = null;
      function frame(now) {
        if (start === null) start = now;
        var t = Math.min((now - start) / DURATION, 1);
        var value = target * ease(t);
        var shown = decimals ? value.toFixed(decimals) : String(Math.round(value));
        if (grouped) shown = shown.replace(/\B(?=(\d{3})+(?!\d))/g, ',');
        el.textContent = before + shown + after;
        if (t < 1) {
          window.requestAnimationFrame(frame);
        } else {
          el.textContent = final; // restore the authored string exactly
        }
      }
      el.textContent = before + (decimals ? (0).toFixed(decimals) : '0') + after;
      window.requestAnimationFrame(frame);
    }

    observeOnce(els, run, 0.6);
  })();

  /* -------------------------------------------------------------------
     5 · TYPEWRITER
     -------------------------------------------------------------------
     Never the h1 — a headline that types itself delays the one sentence
     every visitor is there to read, and shifts layout while they read
     it. Everything below a headline is fair game, and the page now
     carries several: the hero's promise, the standard the College marks
     against, the closing line before the application.

     The phrases come from data-typeline (pipe-separated). Each host
     reserves the width of its own longest phrase before anything types,
     so the line below it never moves. A host may set its own pace with
     data-typespeed="slow" where the phrase is long enough that the
     default rate reads as hurried.

     ONE TIMER PER HOST, and it only runs while the host is on screen.
     A typewriter on the closing section that types continuously from
     first paint has burned an hour of someone's battery arguing with
     itself off-screen. IntersectionObserver gates every one of them.
     ------------------------------------------------------------------- */
  (function typewriter() {
    var hosts = toArray('[data-typeline]');
    if (!hosts.length) return;

    hosts.forEach(function (host) {
      var phrases = (host.getAttribute('data-typeline') || '')
        .split('|')
        .map(function (s) { return s.trim(); })
        .filter(Boolean);
      if (!phrases.length) return;

      var out = document.createElement('span');
      out.className = 'typeline__out';
      var caret = document.createElement('span');
      caret.className = 'typeline__caret';
      caret.setAttribute('aria-hidden', 'true');

      host.classList.add('typeline');
      host.textContent = '';
      host.appendChild(out);
      host.appendChild(caret);

      // A screen reader should get the whole set once, as a static
      // phrase, rather than a character-by-character live region.
      host.setAttribute('aria-label', phrases.join(', '));
      out.setAttribute('aria-hidden', 'true');

      // Reserve the width of the longest phrase so the caret does not
      // drag the layout back and forth as phrases change length.
      var longest = phrases.reduce(function (a, b) { return b.length > a.length ? b : a; }, '');
      out.textContent = longest;
      host.style.minWidth = out.getBoundingClientRect().width + 'px';
      out.textContent = '';

      if (prefersReduced()) {
        out.textContent = phrases[0];
        caret.style.animation = 'none';
        return;
      }

      var slow = host.getAttribute('data-typespeed') === 'slow';
      var TYPE = slow ? 116 : 78, ERASE = slow ? 46 : 34;
      var HOLD = slow ? 3000 : 2100, BETWEEN = 420;
      var pi = 0, ci = 0, erasing = false;
      var timer = null, live = false, started = false;

      function schedule(ms) {
        window.clearTimeout(timer);
        timer = window.setTimeout(tick, ms);
      }

      function tick() {
        if (!live) return;
        var phrase = phrases[pi];
        if (!erasing) {
          ci++;
          out.textContent = phrase.slice(0, ci);
          if (ci === phrase.length) { erasing = true; schedule(HOLD); return; }
          schedule(TYPE);
        } else {
          ci--;
          out.textContent = phrase.slice(0, ci);
          if (ci === 0) {
            erasing = false;
            pi = (pi + 1) % phrases.length;
            schedule(BETWEEN);
            return;
          }
          schedule(ERASE);
        }
      }

      function setLive(on) {
        if (on === live) return;
        live = on;
        if (on) { schedule(started ? 240 : 700); started = true; }
        else window.clearTimeout(timer);
      }

      if ('IntersectionObserver' in window) {
        new IntersectionObserver(function (entries) {
          entries.forEach(function (e) { setLive(e.isIntersecting); });
        }, { rootMargin: '0px 0px -10% 0px' }).observe(host);
      } else {
        setLive(true);
      }

      // A tab in the background should not be typing either.
      document.addEventListener('visibilitychange', function () {
        if (document.hidden) window.clearTimeout(timer);
        else if (live) schedule(BETWEEN);
      });
    });
  })();

  /* -------------------------------------------------------------------
     6 · CHAPTER RAIL
     -------------------------------------------------------------------
     Built from the page rather than hand-authored: every section
     carrying data-chapter contributes a dot. That way the rail cannot
     drift out of step with the page's actual chapters, which is the
     failure mode of every hand-written page index.

     The rail also inverts itself over light chapters — a gold dot on
     cream is invisible, and a rail you cannot see is worse than no
     rail, because the space is still reserved for it.
     ------------------------------------------------------------------- */
  (function chapterRail() {
    var sections = toArray('[data-chapter]');
    if (sections.length < 3) return; // not enough chapters to be worth a rail

    var nav = document.createElement('nav');
    nav.className = 'chapter-rail';
    nav.setAttribute('aria-label', 'Chapters');

    var list = document.createElement('ul');
    list.className = 'chapter-rail';
    list.setAttribute('aria-label', 'Chapters');
    list.style.position = 'static';
    list.style.transform = 'none';

    var links = sections.map(function (section, i) {
      if (!section.id) section.id = 'chapter-' + (i + 1);
      var li = document.createElement('li');
      var a = document.createElement('a');
      a.className = 'chapter-rail__link';
      a.href = '#' + section.id;

      var dot = document.createElement('span');
      dot.className = 'chapter-rail__dot';
      dot.setAttribute('aria-hidden', 'true');

      var label = document.createElement('span');
      label.className = 'chapter-rail__label';
      label.textContent = section.getAttribute('data-chapter');

      a.appendChild(dot);
      a.appendChild(label);
      li.appendChild(a);
      list.appendChild(li);
      return a;
    });

    // The <ul> carries the layout; the <nav> carries the fixed
    // positioning. Two elements rather than one so the list keeps its
    // list semantics without also being a positioned box.
    nav.appendChild(list);
    document.body.appendChild(nav);

    var current = -1;
    var ticking = false;

    function update() {
      ticking = false;
      var mid = window.innerHeight * 0.42;
      var active = 0;
      for (var i = 0; i < sections.length; i++) {
        if (sections[i].getBoundingClientRect().top <= mid) active = i;
      }
      if (active !== current) {
        current = active;
        links.forEach(function (a, i) {
          a.classList.toggle('is-current', i === active);
          if (i === active) {
            a.setAttribute('aria-current', 'true');
          } else {
            a.removeAttribute('aria-current');
          }
        });
        // Invert over light grounds. The section declares its own
        // brightness rather than the rail sampling a computed colour,
        // because a computed background is `rgba(0,0,0,0)` on any
        // section whose colour comes from a gradient or a parent.
        var section = sections[active];
        var isLight = /section--(light|paper|warm|cream|pearl)/.test(section.className);
        nav.classList.toggle('is-on-light', isLight);
      }
    }
    function onScroll() {
      if (ticking) return;
      ticking = true;
      window.requestAnimationFrame(update);
    }

    window.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('resize', onScroll, { passive: true });
    update();
  })();

  /* -------------------------------------------------------------------
     7 · SCROLL REVEAL
     -------------------------------------------------------------------
     A fade-and-rise for list items and cards as their chapter arrives —
     structure appearing as you scroll, not decoration for its own sake.

     Every other one-shot entrance above hides its element with a static
     CSS rule keyed on the class alone, which is safe for the specific
     decorative marks it is used for (a rule, a foil sweep) but not for
     real content: if JS never runs at all, that content would stay
     invisible forever. So this one works the other way round — the
     hidden state is written here, in script, and ONLY once this
     function has actually executed. No JS, or JS that throws before
     reaching this line, leaves every .reveal element exactly as
     authored: fully visible. That is also why this runs after, not
     before, the reduced-motion check: nothing is hidden that a user
     who asked for less motion has to wait to see.
     ------------------------------------------------------------------- */
  (function reveal() {
    var els = toArray('.reveal');
    if (!els.length || prefersReduced()) return;

    els.forEach(function (el) {
      el.style.opacity = '0';
      el.style.transform = 'translateY(18px)';
      el.style.transition = 'opacity .7s var(--ease-premium), transform .7s var(--ease-premium)';
    });

    // Threshold 0, not 0.2. intersectionRatio is a fraction of the
    // ELEMENT, so anything taller than five viewports can never reach
    // 0.2 and never rises — which is exactly what happened to two
    // .leaf__body sections on /academics/ at 390px wide (ratios 0.194
    // and 0.185). observeOnce already carries a -8% bottom rootMargin,
    // so the entrance still waits for the element to be properly in
    // view rather than firing on the first pixel. See the same
    // correction in js/site.js.
    observeOnce(els, function (el) {
      el.style.opacity = '';
      el.style.transform = '';
    }, 0);
  })();

  /* -------------------------------------------------------------------
     8 · PARALLAX VISTA
     -------------------------------------------------------------------
     The one full-bleed photograph on the page drifts against the
     scroll rather than sitting fixed to it — the depth cue a widescreen
     shot needs to read as a place rather than as a poster. Tied
     directly to scroll position (not time), so it is motion that shows
     where the reader is on the page, which is exactly the standard the
     rest of this file holds itself to.

     The image is oversized and inset by -10% in CSS specifically so
     this range of movement never uncovers an edge. No JS, and the
     image sits still at its authored position — full frame, nothing
     missing — which is why the transform is written here rather than
     as a CSS animation with a JS-only pause.
     ------------------------------------------------------------------- */
  (function parallaxVista() {
    var els = toArray('.parallax');
    if (!els.length || prefersReduced()) return;

    var ticking = false;
    function apply() {
      ticking = false;
      els.forEach(function (el) {
        var r = el.getBoundingClientRect();
        var vh = window.innerHeight || document.documentElement.clientHeight;
        var centre = r.top + r.height / 2;
        var progress = (centre - vh / 2) / (vh / 2 + r.height / 2);
        progress = Math.max(-1, Math.min(1, progress));
        el.style.transform = 'translate3d(0,' + (progress * -26).toFixed(1) + 'px,0)';
      });
    }
    function onScroll() {
      if (ticking) return;
      ticking = true;
      window.requestAnimationFrame(apply);
    }
    window.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('resize', onScroll, { passive: true });
    apply();
  })();

  /* -------------------------------------------------------------------
     9 · THE CLICK LIGHT
     -------------------------------------------------------------------
     A ring of light struck from the exact point a reader presses, on
     the cards this page already invites a press on — js/sonics.js
     answers the same press with a sound; this is its visual twin.
     One-shot and removed on its own animationend, so nothing here
     accumulates in the DOM or keeps moving after the reader stops
     touching the page, which is the same discipline every other
     entrance in this file holds itself to.
     ------------------------------------------------------------------- */
  (function clickLight() {
    if (prefersReduced()) return;
    var SEL = '.audience, .region, .case, .principle, [data-section="academics"] .card, [data-section="study"] .card';

    document.addEventListener('pointerdown', function (e) {
      var host = e.target instanceof Element ? e.target.closest(SEL) : null;
      if (!host) return;
      var r = host.getBoundingClientRect();
      var ring = document.createElement('span');
      ring.className = 'click-ring';
      ring.setAttribute('aria-hidden', 'true');
      ring.style.left = (e.clientX - r.left) + 'px';
      ring.style.top = (e.clientY - r.top) + 'px';
      host.appendChild(ring);
      ring.addEventListener('animationend', function () { ring.remove(); });
    }, { passive: true });
  })();
})();
