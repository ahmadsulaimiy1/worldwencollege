/* WEC-LC — the route from the Student Portal page into the portal.
 *
 * ────────────────────────────────────────────────────────────────
 * THE PROBLEM THIS EXISTS FOR
 * ────────────────────────────────────────────────────────────────
 * `/student-portal/` is the page the site's own navigation and footer
 * send every learner to. It describes the portal, says it is "launching
 * with our founding cohort", and offers early access and a design
 * preview.
 *
 * Meanwhile `/my-programme.html` — the learner's actual programme, built
 * against real enrolments, real modules and real progress — was reachable
 * from nowhere in the site. Not from the navigation, not from the footer,
 * not from this page.
 *
 * So an enrolled learner clicking "Student Portal" arrived at a page
 * telling them the portal was coming soon, with no way to reach the one
 * they were already enrolled in. The site understated what the College
 * had actually built, which is an unusual direction for a marketing page
 * to be wrong in and no less wrong for it.
 *
 * ────────────────────────────────────────────────────────────────
 * WHAT IT DOES, AND WHAT IT DELIBERATELY DOES NOT
 * ────────────────────────────────────────────────────────────────
 * With no Clerk key configured — the shipped default in this
 * repository — this does NOTHING. The page stays exactly as authored:
 * an honest description of a portal opening with the founding cohort.
 * No signed-out visitor is shown a door they cannot open.
 *
 * ────────────────────────────────────────────────────────────────
 * THREE STATES, AND SILENCE IS NOT ONE OF THEM
 * ────────────────────────────────────────────────────────────────
 * The first version had two: a session, or nothing. Everything else —
 * a key configured but the provider unreachable, a key configured and
 * nobody signed in — fell through the same `return` and left the page
 * looking exactly as it does when no key is set at all.
 *
 * That is how the live site came to tell every enrolled learner the
 * portal was "opening on invitation" while the real reason they could
 * not get in was that five DNS records had never been added. The
 * Frontend API host in the publishable key, clerk.worldwencollege.co.uk,
 * answers NXDOMAIN, so js/clerk-loader.js cannot fetch the SDK, so this
 * file received an error and said nothing about it. A silent failure on
 * the one page a returning student goes to is worse than a broken
 * button: a broken button can be reported.
 *
 * So, with a key configured:
 *
 *   the provider is unreachable  → say so, and give a route to a human
 *   reachable, nobody signed in  → offer Sign in
 *   reachable, session live      → lead with the learner's programme
 *
 * Every string still comes from the host element's dataset, so the
 * Arabic page carries its own wording and this file knows no language.
 */
(function () {
  'use strict';

  var cfg = window.WEC_LC_AUTH || {};
  if (!cfg.clerkPublishableKey) return;      // design-preview state: unchanged

  if (typeof window.WEC_LC_loadClerk !== 'function') return;

  var host = document.getElementById('portalEntry');
  if (!host) return;

  /** Empty the panel, show it, and move it above the page's own copy. */
  function open_() {
    host.textContent = '';
    host.hidden = false;
    var main = document.getElementById('main') || document.body;
    if (main.firstChild && host.parentNode !== main) main.insertBefore(host, main.firstChild);
    return host;
  }
  function line(cls, text) {
    var el = document.createElement('p');
    el.className = cls;
    el.textContent = text;
    host.appendChild(el);
    return el;
  }

  window.WEC_LC_loadClerk(cfg.clerkPublishableKey, function (err, clerk) {
    var t = host.dataset;

    // STATE ONE — the provider cannot be reached. Say it, name what a
    // reader can do about it, and do not pretend the portal is merely
    // "coming soon".
    if (err || !clerk) {
      if (!t.downTitle || !t.downBody || !t.contact) return;
      open_();
      host.classList.add('portal-entry--down');
      line('portal-entry__welcome', t.downTitle);
      line('portal-entry__lede', t.downBody);
      var drow = document.createElement('div');
      drow.className = 'btn-row';
      var write = document.createElement('a');
      write.className = 'btn btn--outline';
      write.href = t.contactHref || '/contact/';
      write.textContent = t.contact;
      drow.appendChild(write);
      host.appendChild(drow);
      return;
    }

    // STATE TWO — reachable, and nobody is signed in. A returning
    // learner gets the door rather than a description of the door.
    if (!clerk.user) {
      if (!t.signinTitle || !t.signin) return;
      open_();
      line('portal-entry__welcome', t.signinTitle);
      if (t.signinBody) line('portal-entry__lede', t.signinBody);
      var srow = document.createElement('div');
      srow.className = 'btn-row';
      var inBtn = document.createElement('button');
      inBtn.type = 'button';
      inBtn.className = 'btn btn--gold';
      inBtn.textContent = t.signin;
      inBtn.addEventListener('click', function () {
        // openSignIn is the hosted component; where it is unavailable
        // the account portal is the documented fallback and needs no
        // component mounted.
        if (typeof clerk.openSignIn === 'function') clerk.openSignIn({});
        else if (clerk.buildSignInUrl) window.location.href = clerk.buildSignInUrl();
      });
      srow.appendChild(inBtn);
      host.appendChild(srow);
      return;
    }

    // STATE THREE — a live session.

    // Every string comes from the host element. The script holds no
    // English of its own, so the Arabic page is a translation rather
    // than a second copy of this file — and a page that forgets to
    // supply the wording renders nothing instead of rendering English
    // into an Arabic layout.
    if (!t.lede || !t.go || !t.record) return;

    var name = clerk.user.firstName || '';
    var greeting = name && t.welcome
      ? t.welcome.replace('{name}', name)
      : (t.welcomeAnon || '');

    open_();

    if (greeting) {
      var h = document.createElement('p');
      h.className = 'portal-entry__welcome';
      h.textContent = greeting;
      host.appendChild(h);
    }

    var p = document.createElement('p');
    p.className = 'portal-entry__lede';
    p.textContent = t.lede;
    host.appendChild(p);

    var row = document.createElement('div');
    row.className = 'btn-row';

    var go = document.createElement('a');
    go.className = 'btn btn--gold';
    go.href = t.goHref || '/my-programme.html';
    go.textContent = t.go;
    row.appendChild(go);

    var rec = document.createElement('a');
    rec.className = 'btn btn--ghost';
    rec.href = t.recordHref || '/my-record.html';
    rec.textContent = t.record;
    row.appendChild(rec);

    host.appendChild(row);
  });
})();
