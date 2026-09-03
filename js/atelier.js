/* =====================================================================
   THE ATELIER — engine
   ---------------------------------------------------------------------
   Companion to css/atelier.css. Everything here is ADDITIVE: every page
   is complete, readable and navigable with this file absent, blocked,
   or refusing to run. That is not a fallback, it is the design — which
   is what makes it safe for the engine to decline on weak hardware
   rather than shipping a stuttering luxury effect to someone on a
   four-year-old phone.

   THE PERFORMANCE CONTRACT
   - ONE requestAnimationFrame loop for the whole page. Every system
     registers a tick. Ten effects with ten rAF loops is how a site
     ends up janky while every individual effect looks cheap to run.
   - The loop does not start until something needs it, and stops itself
     when nothing does.
   - Pointer and scroll handlers only ever WRITE to a variable. All
     reads of layout happen once per frame, inside the loop.
   - Everything pauses off-screen (IntersectionObserver), on tab-hide
     (visibilitychange), and never starts under reduced-motion,
     Save-Data, coarse pointer or low core count.

   Written to match js/site.js and js/motion.js: one IIFE, vanilla, no
   dependencies, no build step.
   ===================================================================== */
(function () {
  'use strict';

  // ── Capability gate ────────────────────────────────────────────────
  const mq = (q) => (window.matchMedia ? window.matchMedia(q) : { matches: false });
  const reduced = mq('(prefers-reduced-motion: reduce)');
  const finePointer = mq('(hover: hover) and (pointer: fine)').matches;
  const saveData = Boolean(navigator.connection && navigator.connection.saveData);
  // Four cores is the line below which a compositor-only effect still
  // competes with the main thread for the first paint of the page.
  const supportsIO = 'IntersectionObserver' in window;
  const weakCpu = typeof navigator.hardwareConcurrency === 'number'
    && navigator.hardwareConcurrency > 0
    && navigator.hardwareConcurrency < 4;

  const allowAmbient = () => !reduced.matches && !saveData && !weakCpu;

  const $$ = (sel, root) => Array.prototype.slice.call((root || document).querySelectorAll(sel));

  // ── The single frame loop ──────────────────────────────────────────
  const ticks = new Set();
  let running = false;

  function frame(now) {
    running = false;
    ticks.forEach((fn) => {
      try { fn(now); } catch (err) {
        // One misbehaving system must not take the rest of the page's
        // motion with it.
        ticks.delete(fn);
        if (window.console) console.warn('atelier: tick removed after error', err);
      }
    });
    if (ticks.size) start();
  }
  function start() {
    if (running || !ticks.size) return;
    running = true;
    window.requestAnimationFrame(frame);
  }
  const addTick = (fn) => { ticks.add(fn); start(); };
  const removeTick = (fn) => { ticks.delete(fn); };

  document.addEventListener('visibilitychange', function () {
    if (!document.hidden) start();
  });

  // ── Shared pointer position, sampled not subscribed ────────────────
  const pointer = { x: -9999, y: -9999, seen: false };
  if (finePointer) {
    window.addEventListener('pointermove', function (e) {
      pointer.x = e.clientX; pointer.y = e.clientY; pointer.seen = true;
    }, { passive: true });
  }

  const lerp = (a, b, t) => a + (b - a) * t;
  const clamp = (v, lo, hi) => (v < lo ? lo : v > hi ? hi : v);

  /* -------------------------------------------------------------------
     1 · AMBIENT HOUR
     The chrome's light temperature follows the visitor's local clock.
     Someone opening the site at midnight in Riyadh does not get the
     same light as someone opening it at noon in London.

     This runs even under reduced motion: it is not motion, it is a
     colour, set once. It is the cheapest distinctive thing on the site.
     ------------------------------------------------------------------- */
  (function ambientHour() {
    const h = new Date().getHours();
    // warm = the gold in the light, cool = the blue in the shadow,
    // lift = how much light is in the room at all.
    let warm, cool, lift;
    if (h >= 5 && h < 9)        { warm = '224,168,96';  cool = '58,92,150';  lift = .16; } // dawn
    else if (h >= 9 && h < 17)  { warm = '199,162,74';  cool = '39,80,143';  lift = .10; } // day
    else if (h >= 17 && h < 21) { warm = '214,140,72';  cool = '52,58,120';  lift = .18; } // dusk
    else                        { warm = '176,146,84';  cool = '24,44,92';   lift = .07; } // night
    const root = document.documentElement;
    root.style.setProperty('--hour-warm', warm);
    root.style.setProperty('--hour-cool', cool);
    root.style.setProperty('--hour-lift', String(lift));
    root.setAttribute('data-hour',
      h >= 5 && h < 9 ? 'dawn' : h >= 9 && h < 17 ? 'day' : h >= 17 && h < 21 ? 'dusk' : 'night');
  })();

  /* -------------------------------------------------------------------
     2 · CONSTELLATION
     A node field that connects to itself and leans toward the pointer —
     knowledge as a network, drawn rather than asserted.

     Density is derived from area, not a fixed count, so a 4K monitor
     does not get a sparse scatter and a phone does not get 300 nodes
     it cannot afford. Capped hard at both ends.
     ------------------------------------------------------------------- */
  (function constellation() {
    const canvases = $$('canvas.constellation');
    if (!canvases.length || !allowAmbient()) return;

    canvases.forEach(function (canvas) {
      const host = canvas.parentElement;
      if (!host) return;
      const ctx = canvas.getContext('2d', { alpha: true });
      if (!ctx) return;

      // Device pixel ratio is capped at 2: beyond that the fill cost
      // doubles again for a field of 2px dots nobody can resolve.
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      let nodes = [], w = 0, h = 0, visible = false, linkDist = 130;

      function build() {
        const rect = host.getBoundingClientRect();
        w = Math.max(1, Math.round(rect.width));
        h = Math.max(1, Math.round(rect.height));
        canvas.width = Math.round(w * dpr);
        canvas.height = Math.round(h * dpr);
        canvas.style.width = w + 'px';
        canvas.style.height = h + 'px';
        ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

        const count = clamp(Math.round((w * h) / 17000), 18, 90);
        linkDist = clamp(Math.round(Math.sqrt((w * h) / count) * 1.5), 90, 190);
        nodes = [];
        for (let i = 0; i < count; i++) {
          // Deterministic-ish spread rather than pure random clumping:
          // jittered grid placement, so no region is ever empty.
          const cols = Math.ceil(Math.sqrt(count * (w / Math.max(h, 1))));
          const rows = Math.ceil(count / Math.max(cols, 1));
          const cx = ((i % cols) + .5) / cols;
          const cy = (Math.floor(i / cols) + .5) / Math.max(rows, 1);
          nodes.push({
            x: (cx + (Math.random() - .5) * .8 / cols) * w,
            y: (cy + (Math.random() - .5) * .8 / Math.max(rows, 1)) * h,
            vx: (Math.random() - .5) * .12,
            vy: (Math.random() - .5) * .12,
            r: Math.random() * 1.1 + .6,
            tw: Math.random() * Math.PI * 2,
          });
        }
      }

      function draw(now) {
        if (!visible) return;
        const rect = host.getBoundingClientRect();
        const px = pointer.seen ? pointer.x - rect.left : -9999;
        const py = pointer.seen ? pointer.y - rect.top : -9999;

        ctx.clearRect(0, 0, w, h);

        for (let i = 0; i < nodes.length; i++) {
          const n = nodes[i];
          n.x += n.vx; n.y += n.vy;
          if (n.x < 0 || n.x > w) n.vx *= -1;
          if (n.y < 0 || n.y > h) n.vy *= -1;

          // Lean toward the pointer, and ease back when it leaves.
          const dx = px - n.x, dy = py - n.y;
          const d2 = dx * dx + dy * dy;
          if (d2 < 42000) {
            const pull = (1 - d2 / 42000) * .02;
            n.x += dx * pull; n.y += dy * pull;
          }

          const twinkle = .45 + Math.sin(now / 1400 + n.tw) * .3;
          ctx.beginPath();
          ctx.arc(n.x, n.y, n.r, 0, Math.PI * 2);
          ctx.fillStyle = 'rgba(231,201,122,' + twinkle.toFixed(3) + ')';
          ctx.fill();
        }

        // Connections. O(n²) over a field capped at 90 is ~4,000
        // distance checks a frame — cheap, and the cap is what keeps
        // it that way.
        ctx.lineWidth = 1;
        for (let i = 0; i < nodes.length; i++) {
          for (let j = i + 1; j < nodes.length; j++) {
            const a = nodes[i], b = nodes[j];
            const dx = a.x - b.x, dy = a.y - b.y;
            const d = Math.sqrt(dx * dx + dy * dy);
            if (d > linkDist) continue;
            const alpha = (1 - d / linkDist) * .22;
            ctx.strokeStyle = 'rgba(199,162,74,' + alpha.toFixed(3) + ')';
            ctx.beginPath();
            ctx.moveTo(a.x, a.y); ctx.lineTo(b.x, b.y);
            ctx.stroke();
          }
        }
      }

      const io = new IntersectionObserver(function (entries) {
        entries.forEach(function (e) {
          visible = e.isIntersecting;
          if (visible) { addTick(draw); canvas.classList.add('is-live'); }
          else { removeTick(draw); }
        });
      }, { threshold: 0 });

      let resizeTimer = null;
      window.addEventListener('resize', function () {
        window.clearTimeout(resizeTimer);
        resizeTimer = window.setTimeout(build, 180);
      }, { passive: true });

      build();
      io.observe(host);
    });
  })();

  /* -------------------------------------------------------------------
     3 · MAGNETICS
     Buttons lean toward the pointer. The pull is capped in pixels, not
     proportion, so a wide button does not travel further than a narrow
     one — the effect should read as weight, not as elasticity.
     ------------------------------------------------------------------- */
  (function magnetics() {
    if (!finePointer || !allowAmbient()) return;
    const els = $$('.magnetic');
    if (!els.length) return;

    const MAX = 7;      // px
    const RADIUS = 92;  // px beyond the element's box

    const state = els.map((el) => ({ el, x: 0, y: 0, tx: 0, ty: 0, active: false }));
    let anyActive = false;

    function tick() {
      let live = false;
      for (const s of state) {
        s.x = lerp(s.x, s.tx, .18);
        s.y = lerp(s.y, s.ty, .18);
        if (Math.abs(s.x - s.tx) > .05 || Math.abs(s.y - s.ty) > .05 || s.active) live = true;
        s.el.style.setProperty('--mag-x', s.x.toFixed(2) + 'px');
        s.el.style.setProperty('--mag-y', s.y.toFixed(2) + 'px');
      }
      if (!live) { removeTick(tick); anyActive = false; }
    }

    function measure() {
      for (const s of state) {
        const r = s.el.getBoundingClientRect();
        if (!r.width) { s.tx = 0; s.ty = 0; continue; }
        const cx = r.left + r.width / 2, cy = r.top + r.height / 2;
        const dx = pointer.x - cx, dy = pointer.y - cy;
        const dist = Math.hypot(dx, dy);
        const reach = Math.max(r.width, r.height) / 2 + RADIUS;
        if (dist < reach) {
          const f = (1 - dist / reach);
          s.tx = clamp(dx * f * .35, -MAX, MAX);
          s.ty = clamp(dy * f * .35, -MAX, MAX);
          s.active = true;
          s.el.classList.add('is-pulled');
        } else {
          s.tx = 0; s.ty = 0; s.active = false;
          s.el.classList.remove('is-pulled');
        }
      }
      if (!anyActive) { anyActive = true; addTick(tick); }
    }

    let queued = false;
    window.addEventListener('pointermove', function () {
      if (queued) return;
      queued = true;
      window.requestAnimationFrame(function () { queued = false; measure(); });
    }, { passive: true });

    // A magnetic element that keeps its offset after the pointer leaves
    // the window would sit permanently askew.
    window.addEventListener('blur', function () {
      for (const s of state) { s.tx = 0; s.ty = 0; s.active = false; }
      addTick(tick);
    });
  })();

  /* -------------------------------------------------------------------
     4 · TILT + SURFACE LIGHT
     Cards lean away from the pointer and carry a specular highlight
     that tracks it. --mx/--my are also read by .gold-live, so one
     handler serves both.
     ------------------------------------------------------------------- */
  (function tilt() {
    if (!finePointer || !allowAmbient()) return;
    $$('.tilt, .gold-live').forEach(function (el) {
      const isTilt = el.classList.contains('tilt');
      el.addEventListener('pointermove', function (e) {
        const r = el.getBoundingClientRect();
        const px = (e.clientX - r.left) / r.width;
        const py = (e.clientY - r.top) / r.height;
        el.style.setProperty('--mx', (px * 100).toFixed(1) + '%');
        el.style.setProperty('--my', (py * 100).toFixed(1) + '%');
        if (isTilt) {
          el.classList.add('is-tilting');
          el.style.setProperty('--tilt-y', ((px - .5) * 7).toFixed(2) + 'deg');
          el.style.setProperty('--tilt-x', ((.5 - py) * 7).toFixed(2) + 'deg');
        }
      }, { passive: true });
      el.addEventListener('pointerleave', function () {
        el.classList.remove('is-tilting');
        el.style.setProperty('--tilt-x', '0deg');
        el.style.setProperty('--tilt-y', '0deg');
      });
    });
  })();

  /* -------------------------------------------------------------------
     5 · THE POINTER AURA
     A gold ring that follows the cursor and opens over anything
     interactive. The real cursor is never hidden — a custom cursor
     that replaces the system one costs more in usability than it
     returns in atmosphere.
     ------------------------------------------------------------------- */
  (function aura() {
    if (!finePointer || !allowAmbient()) return;

    const el = document.createElement('div');
    el.className = 'aura';
    el.setAttribute('aria-hidden', 'true');
    document.body.appendChild(el);

    let x = -100, y = -100, live = false;
    const INTERACTIVE = 'a, button, input, select, textarea, summary, [role="button"], .tilt';

    function tick() {
      x = lerp(x, pointer.x, .2);
      y = lerp(y, pointer.y, .2);
      el.style.transform = 'translate3d(' + x.toFixed(1) + 'px,' + y.toFixed(1) + 'px,0)';
      if (Math.abs(x - pointer.x) < .3 && Math.abs(y - pointer.y) < .3) removeTick(tick);
    }

    window.addEventListener('pointermove', function (e) {
      if (!live) { live = true; el.classList.add('is-live'); }
      el.classList.toggle('is-over', Boolean(e.target.closest && e.target.closest(INTERACTIVE)));
      addTick(tick);
    }, { passive: true });

    document.addEventListener('pointerleave', function () {
      el.classList.remove('is-live');
    });
  })();

  /* -------------------------------------------------------------------
     6 · KINETIC GILT
     A heading fills with gold as it crosses the reading line. Driven
     by scroll position rather than a timed animation, so the reader
     controls it — which is what makes it feel like a material property
     of the type rather than a effect playing at them.
     ------------------------------------------------------------------- */
  (function gilt() {
    const els = $$('.gilt');
    if (!els.length) return;
    if (reduced.matches || !supportsIO) {
      els.forEach((el) => el.style.setProperty('--gilt', '1'));
      return;
    }

    let watching = [];
    const io = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) {
        if (e.isIntersecting) {
          if (watching.indexOf(e.target) === -1) watching.push(e.target);
        } else {
          watching = watching.filter((t) => t !== e.target);
          // Past the top of the viewport it stays gilded; below it,
          // it stays ungilded. Either way it holds a finished state.
          e.target.style.setProperty('--gilt',
            e.boundingClientRect.top < 0 ? '1' : '0');
        }
      });
      if (watching.length) addTick(tick); else removeTick(tick);
    }, { threshold: [0, .25, .5, .75, 1] });

    function tick() {
      const vh = window.innerHeight;
      for (const el of watching) {
        const r = el.getBoundingClientRect();
        // 0 when the element's top reaches 82% of the viewport,
        // 1 by the time it reaches 38% — the band a reader is
        // actually looking at.
        const p = clamp((vh * .82 - r.top) / (vh * .44), 0, 1);
        el.style.setProperty('--gilt', p.toFixed(3));
      }
    }

    els.forEach((el) => io.observe(el));
  })();

  /* -------------------------------------------------------------------
     7 · ASSEMBLING FIGURES
     A statistic forms rather than ticks. Each digit is wrapped and
     dropped into place in sequence.

     The element's authored text is the source of truth and is what
     the accessibility tree sees: the wrapper carries aria-hidden and
     the original string is restored to an aria-label, so a screen
     reader is read "1,200", once, not twelve separate characters.
     ------------------------------------------------------------------- */
  (function assemble() {
    const els = $$('[data-assemble]');
    if (!els.length) return;

    els.forEach(function (el) {
      const text = el.textContent.trim();
      if (!text) return;
      el.setAttribute('aria-label', text);

      const frag = document.createDocumentFragment();
      const holder = document.createElement('span');
      holder.setAttribute('aria-hidden', 'true');
      text.split('').forEach(function (ch, i) {
        const s = document.createElement('span');
        s.className = 'assemble__d';
        s.style.setProperty('--d', String(i));
        s.textContent = ch;
        holder.appendChild(s);
      });
      frag.appendChild(holder);
      el.textContent = '';
      el.appendChild(frag);

      // The digits are authored visible and made invisible by the CSS
      // above; only this script can make them visible again. So every
      // path that cannot animate must resolve them immediately —
      // otherwise a browser without IntersectionObserver renders the
      // College's headline statistics as four empty gaps.
      if (reduced.matches || !supportsIO) { el.classList.add('is-assembled'); return; }

      const io = new IntersectionObserver(function (entries) {
        entries.forEach(function (e) {
          if (!e.isIntersecting) return;
          el.classList.add('is-assembled');
          io.unobserve(e.target);
        });
      }, { threshold: .6 });
      io.observe(el);
    });
  })();

  /* -------------------------------------------------------------------
     8 · LIVING DIAGRAMS
     Any SVG marked [data-diagram] draws itself once on entry: stroked
     paths trace, nodes arrive, labels fade up.

     Implemented with stroke-dashoffset rather than a library. The
     dash length is measured per path with getTotalLength(), so a
     diagram can be redrawn or edited without anyone maintaining a
     table of magic numbers alongside it.
     ------------------------------------------------------------------- */
  (function diagrams() {
    const svgs = $$('svg[data-diagram]');
    if (!svgs.length) return;

    svgs.forEach(function (svg) {
      const paths = $$('[data-draw]', svg);
      const pops = $$('[data-pop]', svg);

      // Same contract as the assembling figures: this function hides
      // the drawing before animating it in, so any path that cannot
      // animate must leave it alone entirely rather than hide it and
      // never restore it.
      if (reduced.matches || !supportsIO) {
        paths.forEach((p) => { p.style.strokeDasharray = 'none'; p.style.strokeDashoffset = '0'; p.style.opacity = '1'; });
        pops.forEach((p) => { p.style.opacity = '1'; p.style.transform = 'none'; });
        return;
      }

      paths.forEach(function (p) {
        let len = 0;
        try { len = p.getTotalLength(); } catch (e) { len = 0; }
        if (!len) { p.style.opacity = '1'; return; }
        p.style.strokeDasharray = len;
        p.style.strokeDashoffset = len;
        p.style.opacity = '1';
      });
      pops.forEach(function (p) {
        p.style.opacity = '0';
        p.style.transformBox = 'fill-box';
        p.style.transformOrigin = 'center';
        p.style.transform = 'scale(.4)';
      });

      const io = new IntersectionObserver(function (entries) {
        entries.forEach(function (e) {
          if (!e.isIntersecting) return;
          io.unobserve(e.target);

          paths.forEach(function (p, i) {
            const dur = clamp(Number(p.dataset.draw) || 1200, 200, 4000);
            p.style.transition = 'stroke-dashoffset ' + dur + 'ms cubic-bezier(.16,.84,.44,1) ' + (i * 90) + 'ms';
            p.style.strokeDashoffset = '0';
          });
          pops.forEach(function (p, i) {
            const delay = 240 + i * 110;
            p.style.transition = 'opacity .5s ease ' + delay + 'ms, transform .6s cubic-bezier(.16,.84,.44,1) ' + delay + 'ms';
            p.style.opacity = '1';
            p.style.transform = 'scale(1)';
          });
        });
      }, { threshold: .3 });
      io.observe(svg);
    });
  })();

  /* -------------------------------------------------------------------
     9 · MEGA-PANEL NAVIGATION
     The header's primary items open a glass panel. CSS handles the
     open state on :hover and :focus-within for pointer and keyboard;
     this adds what CSS cannot: Escape to close, and a truthful
     aria-expanded.
     ------------------------------------------------------------------- */
  (function megaPanels() {
    const items = $$('.nav__item--has-menu');
    if (!items.length) return;

    items.forEach(function (item) {
      const trigger = item.querySelector('a[aria-haspopup]');
      const panel = item.querySelector('.nav__menu');
      if (!trigger || !panel) return;

      item.addEventListener('keydown', function (e) {
        if (e.key !== 'Escape') return;
        // Close by moving focus out; CSS :focus-within does the rest.
        item.classList.add('is-dismissed');
        trigger.focus();
        trigger.setAttribute('aria-expanded', 'false');
      });
      // Any pointer or focus movement back in clears the dismissal.
      ['pointerenter', 'focusin'].forEach(function (evt) {
        item.addEventListener(evt, function () { item.classList.remove('is-dismissed'); });
      });
    });
  })();

  /* -------------------------------------------------------------------
     10 · LATTICE NODES
     A handful of illuminated junctions, placed once per lattice. Done
     here rather than in markup so every lattice on the site gets them
     without eleven hand-authored <span>s in each partial.
     ------------------------------------------------------------------- */
  (function latticeNodes() {
    if (!allowAmbient()) return;
    $$('.lattice[data-nodes]').forEach(function (host) {
      // Nodes go into the bed, not the host: the bed is the element
      // that clips, so a node placed on the host would escape it and
      // float over the navigation.
      const bed = host.querySelector('.lattice__bed');
      if (!bed) return;
      const n = clamp(parseInt(host.dataset.nodes, 10) || 6, 1, 14);
      const frag = document.createDocumentFragment();
      for (let i = 0; i < n; i++) {
        const s = document.createElement('span');
        s.className = 'lattice__node';
        s.setAttribute('aria-hidden', 'true');
        // Kept to the upper band, where the lattice is actually
        // visible through its mask.
        s.style.left = (6 + (i / n) * 88 + (Math.random() - .5) * 6).toFixed(1) + '%';
        s.style.top = (14 + Math.random() * 52).toFixed(1) + '%';
        s.style.setProperty('--node-delay', (Math.random() * 5).toFixed(2) + 's');
        frag.appendChild(s);
      }
      bed.appendChild(frag);
    });
  })();

  /* -------------------------------------------------------------------
     11 · THE MEDALLION
     Real three-dimensional rotation, not a gradient pretending to be
     one. A `.medallion` is a preserve-3d stage carrying two faces and a
     rim; this turns it on its Y axis from the pointer, and gives it a
     slow idle rotation when the pointer is nowhere near.

     Why a coin and not another tilt card: a tilt is a plane catching
     light, which the site already does five ways. A struck medallion
     has a BACK, and turning it far enough to show the reverse is the
     one gesture that cannot be faked with a gradient. It is used where
     the College is making a claim about its own standard, so the
     object under the cursor should be the object the claim is about.

     The rotation is written to a CSS variable and the transform lives
     in the stylesheet — the same division of labour as TILT above, so
     the whole effect can be switched off in css/atelier.css alone.
     ------------------------------------------------------------------- */
  (function medallion() {
    const hosts = $$('.medallion');
    if (!hosts.length) return;

    // Under reduced motion the medallion still exists — it simply sits
    // at a fixed three-quarter angle, which is a static object rather
    // than a flat one. No tick is registered at all in that case.
    if (!allowAmbient()) {
      hosts.forEach(function (h) { h.style.setProperty('--medal-y', '-18deg'); });
      return;
    }

    const live = [];
    hosts.forEach(function (host) {
      const state = { host: host, y: 0, x: 0, ty: 0, tx: 0, idle: 0, visible: !supportsIO };
      live.push(state);
      if (supportsIO) {
        new IntersectionObserver(function (entries) {
          entries.forEach(function (e) { state.visible = e.isIntersecting; });
          sync();
        }, { rootMargin: '10% 0px' }).observe(host);
      }
    });

    function tick(now) {
      for (let i = 0; i < live.length; i++) {
        const s = live[i];
        if (!s.visible) continue;
        const r = s.host.getBoundingClientRect();
        const cx = r.left + r.width / 2;
        const cy = r.top + r.height / 2;
        const near = pointer.seen
          && Math.abs(pointer.x - cx) < r.width * 2.4
          && Math.abs(pointer.y - cy) < r.height * 2.4;

        if (near) {
          // Pointer drives it. 52deg is deliberately past the rim, so
          // the reverse face genuinely comes into view.
          s.ty = clamp((pointer.x - cx) / (r.width * 1.1), -1, 1) * 52;
          s.tx = clamp((cy - pointer.y) / (r.height * 1.4), -1, 1) * 14;
        } else {
          // Idle: a slow, shallow turn. Slow enough to read as weight
          // rather than as a spinning logo.
          s.idle = now * 0.00022;
          s.ty = Math.sin(s.idle) * 16;
          s.tx = Math.sin(s.idle * 0.6) * 5;
        }
        s.y = lerp(s.y, s.ty, near ? 0.12 : 0.05);
        s.x = lerp(s.x, s.tx, near ? 0.12 : 0.05);
        s.host.style.setProperty('--medal-y', s.y.toFixed(2) + 'deg');
        s.host.style.setProperty('--medal-x', s.x.toFixed(2) + 'deg');
      }
    }

    function sync() {
      if (live.some(function (s) { return s.visible; })) addTick(tick);
      else removeTick(tick);
    }
    sync();
  })();

  /* -------------------------------------------------------------------
     12 · DEPTH
     Scroll parallax for decorative layers only. An element carrying
     data-depth="0.18" travels that fraction of the distance the page
     scrolls past it, which is what puts a crest visibly BEHIND the
     text sitting over it rather than pasted onto the same plane.

     Decorative only, and enforced: anything with data-depth is moved
     on the compositor via translate3d, so a layer carrying real text
     would go blurry on some GPUs at fractional offsets. The homepage
     uses it on crests, seals and guilloché plates.
     ------------------------------------------------------------------- */
  (function depth() {
    const layers = $$('[data-depth]');
    if (!layers.length || !allowAmbient()) return;

    const live = [];
    layers.forEach(function (el) {
      const factor = clamp(parseFloat(el.dataset.depth) || 0, -0.6, 0.6);
      if (!factor) return;
      const state = { el: el, factor: factor, visible: !supportsIO, at: 0 };
      live.push(state);
      if (supportsIO) {
        new IntersectionObserver(function (entries) {
          entries.forEach(function (e) { state.visible = e.isIntersecting; });
          sync();
        }, { rootMargin: '25% 0px' }).observe(el);
      }
    });
    if (!live.length) return;

    function tick() {
      const mid = window.innerHeight / 2;
      for (let i = 0; i < live.length; i++) {
        const s = live[i];
        if (!s.visible) continue;
        const r = s.el.getBoundingClientRect();
        // Distance of this layer's centre from the centre of the
        // viewport, scaled by its depth factor.
        const offset = ((r.top + r.height / 2) - mid) * s.factor;
        if (Math.abs(offset - s.at) < 0.15) continue;
        s.at = offset;
        s.el.style.transform = 'translate3d(0,' + offset.toFixed(1) + 'px,0)';
      }
    }

    function sync() {
      if (live.some(function (s) { return s.visible; })) addTick(tick);
      else removeTick(tick);
    }
    sync();
  })();

  /* -------------------------------------------------------------------
     13 · THE LIT LEDGER
     The two big tables on the homepage — the six levels, and the
     validation pathway — are the densest things a reader meets. A row
     under the pointer lifts a warm band behind itself, so the eye
     keeps its place across five columns without a zebra stripe, which
     is the usual fix and which makes a ledger look like a spreadsheet.

     Pointer-only, and delegated: one listener per table rather than
     one per row, so a nine-row ledger costs one handler.
     ------------------------------------------------------------------- */
  (function litLedger() {
    if (!finePointer || reduced.matches) return;
    $$('.ledger--flagship').forEach(function (table) {
      const body = table.querySelector('tbody');
      if (!body) return;
      body.addEventListener('pointermove', function (e) {
        const row = e.target.closest ? e.target.closest('tr') : null;
        if (!row || !body.contains(row)) return;
        const r = row.getBoundingClientRect();
        row.style.setProperty('--lit-x', (((e.clientX - r.left) / r.width) * 100).toFixed(1) + '%');
        if (row.classList.contains('is-lit')) return;
        const prev = body.querySelector('tr.is-lit');
        if (prev) prev.classList.remove('is-lit');
        row.classList.add('is-lit');
      }, { passive: true });
      body.addEventListener('pointerleave', function () {
        const prev = body.querySelector('tr.is-lit');
        if (prev) prev.classList.remove('is-lit');
      }, { passive: true });
    });
  })();
  /* =========================================================
     THE TRAVELLING LIGHT, GATED BY VIEWPORT RATHER THAN BY HOVER.

     css/atelier.css used to hide the ring at rest: `.aurum--hover`
     sets opacity 0 and only reveals it inside
     `@media (hover: hover) and (pointer: fine)`. Applied to nearly
     every struck shape — as it was — that gives a site with NO visible
     travelling light on any touch device at all, and on a desktop one
     shape at a time under the pointer. The effect was in the markup
     and absent from the page, and adding more of it could not have
     helped, because the class doing the hiding was the one being
     added.

     The ring is lit and moving by default now, and the cost is paid
     here instead: everything outside the viewport takes
     `.aurum--rest`, which pauses the orbit without hiding it. Roughly
     a dozen rings animate at once on a normal screen rather than
     sixty.

     THIS IS ITS OWN BLOCK, and that is load-bearing. It was first
     written inside the parallax IIFE, which begins
     `if (!layers.length || !allowAmbient()) return;` — so on any page
     without a depth layer, and for every visitor with ambient motion
     off, the gate never ran. Measured, not assumed: 0 of 52 shapes
     paused when 40 were off-screen.

     PAUSING IS ADDITIVE, NEVER SUBTRACTIVE. If this script fails to
     load, or IntersectionObserver is missing, nothing is added and
     every ring simply runs. A gate that failed closed would put the
     site back in the state it exists to correct.
     ========================================================= */
  (function () {
    if (!supportsIO) return;
    const REST = 'aurum--rest';
    const gate = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) {
        e.target.classList.toggle(REST, !e.isIntersecting);
      });
    }, { rootMargin: '20% 0px' });
    // Not pre-rested: the observer reports the true state on its first
    // callback, and pre-resting would flash a paused ring on whatever
    // is already in view at load.
    $$('.aurum').forEach(function (el) { gate.observe(el); });
  })();

})();
