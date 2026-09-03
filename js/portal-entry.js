/* WEC — the route from the Student Portal page into the portal.
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
 * With no Clerk key configured — the shipped default — this does
 * NOTHING. The page stays exactly as authored: an honest description of
 * a portal opening with the founding cohort. No signed-out visitor is
 * shown a door they cannot open.
 *
 * With a key and a live session, the page leads with the learner's own
 * programme, because that is what they came for. The early-access and
 * preview routes remain for everybody else.
 */
(function () {
  'use strict';

  var cfg = window.WEC_LC_AUTH || {};
  if (!cfg.clerkPublishableKey) return;      // design-preview state: unchanged

  if (typeof window.WEC_LC_loadClerk !== 'function') return;

  window.WEC_LC_loadClerk(cfg.clerkPublishableKey, function (err, clerk) {
    // An unreachable auth provider must not degrade the page. A visitor
    // who is offline still gets the description and the apply route;
    // they simply do not get the shortcut.
    if (err || !clerk || !clerk.user) return;

    var host = document.getElementById('portalEntry');
    if (!host) return;

    // Every string comes from the host element. The script holds no
    // English of its own, so the Arabic page is a translation rather
    // than a second copy of this file — and a page that forgets to
    // supply the wording renders nothing instead of rendering English
    // into an Arabic layout.
    var t = host.dataset;
    if (!t.lede || !t.go || !t.record) return;

    var name = clerk.user.firstName || '';
    var greeting = name && t.welcome
      ? t.welcome.replace('{name}', name)
      : (t.welcomeAnon || '');

    host.textContent = '';
    host.hidden = false;

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
    go.href = '/my-programme.html';
    go.textContent = t.go;
    row.appendChild(go);

    var rec = document.createElement('a');
    rec.className = 'btn btn--ghost';
    rec.href = '/my-record.html';
    rec.textContent = t.record;
    row.appendChild(rec);

    host.appendChild(row);

    // Moved to the top of the page rather than left where it was
    // authored. A learner who is already enrolled should not have to
    // scroll past an invitation to apply.
    var main = document.getElementById('main') || document.body;
    if (main.firstChild) main.insertBefore(host, main.firstChild);
  });
})();
