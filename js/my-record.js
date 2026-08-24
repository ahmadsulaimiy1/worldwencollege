/* AIPC — My Academic Record.
 *
 * The learner's own view of what the College holds, and the controls
 * over who else may see it. The APIs behind this — profile, shares,
 * documents — existed with no interface at all, which meant a graduate
 * could not exercise a single one of the privacy decisions the platform
 * was built to give them.
 *
 * ────────────────────────────────────────────────────────────────
 * THE RULE THAT SHAPES EVERY CONTROL HERE
 * ────────────────────────────────────────────────────────────────
 * A person deciding what to publish about themselves must be told what
 * the decision means AT THE MOMENT THEY MAKE IT, not in a policy they
 * will never open. So every switch carries its own consequence in plain
 * words, and the two that matter most say more than the others:
 *
 *   Measured study time — how long they struggled. Not part of the
 *   qualification, and the page says most graduates keep it private.
 *
 *   Share links — the page states, before they create one, that turning
 *   a section off later removes it from links already issued. That is
 *   true (the server intersects scope with current visibility) and it is
 *   the single most reassuring fact about the mechanism.
 *
 * ────────────────────────────────────────────────────────────────
 * EVERY VALUE IS SET WITH textContent
 * ────────────────────────────────────────────────────────────────
 * Names, share labels and document titles are written by people. The
 * difference between "a label with an angle bracket in it" and an attack
 * only exists if the page never gives it the chance to be the second.
 */
(function () {
  'use strict';
  var $ = function (s) { return document.querySelector(s); };

  function el(tag, cls, text) {
    var n = document.createElement(tag);
    if (cls) n.className = cls;
    if (text !== undefined && text !== null && text !== '') n.textContent = text;
    return n;
  }

  function fmtDate(iso) {
    if (!iso) return '';
    var d = new Date(iso.length === 10 ? iso + 'T00:00:00Z' : iso);
    if (isNaN(d.getTime())) return iso;
    return d.toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric', timeZone: 'UTC' });
  }

  // ---- authenticated fetch ------------------------------------------
  // A learner's own record is never public. Without a session there is
  // nothing to show, and the page says so rather than rendering an empty
  // shell that looks like a record with nothing in it.
  //
  // THIS PAGE USED TO HOLD ITS OWN TOKEN, and that was a real defect
  // rather than a stylistic one. It fetched a Clerk session token once,
  // at page load, into a shared authHeaders object and reused it for
  // every request afterwards. Clerk session tokens last about a minute.
  // js/api-auth.js exists precisely to mint a fresh one per request —
  // its own comment names this failure — and this was the single page
  // that bypassed it. The first call after sign-in worked and everything
  // later in the session was refused, which reads to a learner as their
  // record being broken rather than their session being stale.
  //
  // settle() is the only thing left of the old helper. The seam throws
  // on a non-2xx; these call sites branch on r.ok and r.status instead,
  // and that is the right shape for this page — 401 is not an error here,
  // it is the not-signed-in state and has its own copy. So the rejection
  // is converted back into a value rather than the call sites being
  // rewritten around a different control flow.
  function settle(promise) {
    return promise.then(function (data) {
      return { ok: true, status: 200, data: data || {} };
    }, function (err) {
      return { ok: false, status: (err && err.status) || 0, data: (err && err.body) || {} };
    });
  }
  var D = function () { return window.AIPC_data; };

  function state(strong, rest) {
    var box = $('#state');
    box.textContent = '';
    if (strong) box.appendChild(el('strong', null, strong + ' '));
    box.appendChild(document.createTextNode(rest || ''));
  }

  // ---- record ---------------------------------------------------------
  function renderRecord(p) {
    var t = p.transcript;
    var totals = $('#totals');
    totals.textContent = '';
    [['AIPC Credits', t.creditsAwarded], ['Qualification time', t.tqtHoursAwarded + ' h'],
      ['Levels entered', t.levelsEntered], ['Levels awarded', t.levelsAwarded]].forEach(function (pair) {
      var dl = el('dl', 'grad-total');
      dl.appendChild(el('dt', null, pair[0]));
      dl.appendChild(el('dd', null, String(pair[1])));
      totals.appendChild(dl);
    });

    var body = $('#transcript');
    body.textContent = '';
    t.entries.forEach(function (e) {
      var tr = document.createElement('tr');
      var lvl = el('td', 'grad-table__level', 'Level ' + e.roman);
      lvl.appendChild(el('span', 'grad-table__sub', e.levelName));
      tr.appendChild(lvl);
      tr.appendChild(el('td', null, e.cefr));
      tr.appendChild(el('td', null, fmtDate(e.startedAt)));
      tr.appendChild(el('td', null, e.modulesTotal ? e.modulesCompleted + ' of ' + e.modulesTotal : '—'));
      var out = el('td');
      if (e.award && e.award.standing === 'conferred') {
        out.appendChild(document.createTextNode('Awarded'
          + (e.award.honourLabel && e.award.honour !== 'pass' ? ' with ' + e.award.honourLabel : '')));
      } else if (e.award) {
        out.appendChild(document.createTextNode(
          e.award.standing === 'revoked' ? 'Award withdrawn' : 'Award superseded'));
      } else {
        out.appendChild(document.createTextNode(e.status === 'active' ? 'In progress' : 'Entered'));
      }
      tr.appendChild(out);
      body.appendChild(tr);
    });
    $('#secRecord').hidden = false;
  }

  function renderPrivacy(p) {
    var v = p.visibility;
    $('#isPublic').checked = !!v.isPublic;
    $('#showTranscript').checked = !!v.transcript;
    $('#showCompetencies').checked = !!v.competencies;
    $('#showCpd').checked = !!v.cpd;
    $('#showStudyTime').checked = !!v.studyTime;
    $('#handle').value = p.handle || '';
    $('#secPrivacy').hidden = false;
  }

  // ---- shares ---------------------------------------------------------
  function renderShares(shares) {
    var list = $('#shares');
    list.textContent = '';
    if (!shares.length) {
      list.appendChild(el('li', 'rec-empty', 'You have not shared your record with anyone.'));
    }
    shares.forEach(function (s) {
      var li = el('li', 'rec-share' + (s.active ? '' : ' is-inactive'));
      var main = el('div');
      main.appendChild(el('p', 'rec-share__label', s.label || 'Untitled link'));
      var meta = el('p', 'rec-share__meta');
      meta.appendChild(el('span', 'rec-badge ' + (s.active ? 'rec-badge--live' : 'rec-badge--ended'),
        s.active ? 'Live' : (s.revokedAt ? 'Withdrawn' : 'Expired')));
      meta.appendChild(document.createTextNode(
        'Shows ' + s.scope.join(', ')
        + ' · ' + (s.active ? 'expires ' + fmtDate(s.expiresAt) : 'ended ' + fmtDate(s.revokedAt || s.expiresAt))
        // Seeing that a link was opened is the reassurance a graduate
        // actually wants: it tells them the employer looked.
        + ' · opened ' + s.viewCount + (s.viewCount === 1 ? ' time' : ' times')));
      main.appendChild(meta);
      li.appendChild(main);

      if (s.active) {
        var btn = el('button', 'rec-revoke', 'Withdraw');
        btn.type = 'button';
        btn.setAttribute('aria-label', 'Withdraw the link "' + (s.label || 'Untitled link') + '"');
        btn.addEventListener('click', function () {
          btn.disabled = true;
          settle(D().revokeProfileShare(s.id))
            .then(loadShares);
        });
        li.appendChild(btn);
      }
      list.appendChild(li);
    });
    $('#secShares').hidden = false;
  }

  function loadShares() {
    return settle(D().profileShares()).then(function (r) {
      if (r.ok) renderShares(r.data.shares || []);
    });
  }

  // ---- documents ------------------------------------------------------
  var DOC_NAME = { transcript: 'Academic transcript', diploma_supplement: 'Diploma supplement',
    verification_statement: 'Verification statement' };

  function renderDocuments(docs) {
    var list = $('#documents');
    list.textContent = '';
    if (!docs.length) {
      list.appendChild(el('li', 'rec-empty', 'You have not issued any documents yet.'));
    }
    docs.forEach(function (d) {
      var li = el('li', 'rec-doc' + (d.status === 'issued' ? '' : ' is-inactive'));
      var main = el('div');
      main.appendChild(el('p', 'rec-doc__title', DOC_NAME[d.documentType] || d.documentType));
      var meta = el('p', 'rec-doc__meta');
      if (d.status !== 'issued') {
        meta.appendChild(el('span', 'rec-badge rec-badge--' + (d.status === 'withdrawn' ? 'withdrawn' : 'superseded'),
          d.status === 'withdrawn' ? 'Withdrawn' : 'Superseded'));
      }
      meta.appendChild(document.createTextNode(
        'Issued ' + fmtDate(d.issuedAt)
        + (d.expiresAt ? ' · valid until ' + fmtDate(d.expiresAt) : '')
        + ' · code ' + d.verificationCode));
      main.appendChild(meta);
      li.appendChild(main);

      var link = el('a', 'rec-doclink', 'Check this document');
      link.href = '/verify.html?code=' + encodeURIComponent(d.verificationCode);
      li.appendChild(link);
      list.appendChild(li);
    });
    $('#secDocuments').hidden = false;
  }

  function loadDocuments() {
    return settle(D().documents()).then(function (r) {
      if (r.ok) renderDocuments(r.data.documents || []);
    });
  }

  // ---- wiring ---------------------------------------------------------
  function wire() {
    $('#privacyForm').addEventListener('submit', function (e) {
      e.preventDefault();
      $('#handleError').textContent = '';
      $('#saved').textContent = '';
      var handle = $('#handle').value.trim();
      settle(D().saveProfile({
          handle: handle || null,
          isPublic: $('#isPublic').checked,
          transcript: $('#showTranscript').checked,
          competencies: $('#showCompetencies').checked,
          cpd: $('#showCpd').checked,
          studyTime: $('#showStudyTime').checked,
        })).then(function (r) {
        if (!r.ok) {
          $('#handleError').textContent = (r.data && r.data.message)
            || 'Those settings could not be saved.';
          return;
        }
        renderPrivacy(r.data);
        $('#saved').textContent = 'Saved. ' + ($('#isPublic').checked
          ? 'Your profile is published.'
          : 'Your profile is private.');
      });
    });

    $('#shareForm').addEventListener('submit', function (e) {
      e.preventDefault();
      var sections = [].slice.call(document.querySelectorAll('input[name="sections"]:checked'))
        .map(function (i) { return i.value; });
      settle(D().createProfileShare({
          sections: sections,
          days: Number($('#shareDays').value),
          label: $('#shareLabel').value.trim() || null,
        })).then(function (r) {
        var box = $('#newLink');
        box.textContent = '';
        box.hidden = false;
        if (!r.ok) {
          box.appendChild(el('strong', null, 'That link could not be created.'));
          box.appendChild(document.createTextNode((r.data && r.data.message) || ''));
          return;
        }
        var url = location.origin + '/graduate.html?share=' + encodeURIComponent(r.data.token);
        box.appendChild(el('strong', null, 'Copy this link now.'));
        box.appendChild(document.createTextNode(
          'The College stores only a fingerprint of it and cannot show it to you again. If you lose it, withdraw the link and make another.'));
        box.appendChild(el('code', null, url));
        loadShares();
      });
    });

    [].slice.call(document.querySelectorAll('[data-issue]')).forEach(function (btn) {
      btn.addEventListener('click', function () {
        $('#docError').textContent = '';
        btn.disabled = true;
        settle(D().issueDocument({ documentType: btn.getAttribute('data-issue') })).then(function (r) {
          btn.disabled = false;
          if (!r.ok) {
            $('#docError').textContent = (r.data && r.data.message)
              || 'That document could not be issued.';
            return;
          }
          loadDocuments();
        });
      });
    });
  }

  function load() {
    settle(D().profile()).then(function (r) {
      if (r.status === 401) {
        state('You are not signed in.',
          'Your academic record is private to you. Sign in to see it, or verify an award by its code if you are checking someone else’s.');
        return;
      }
      if (!r.ok) {
        state('Your record could not be loaded.',
          'This is a fault on our side. Please try again shortly.');
        return;
      }
      $('#state').textContent = '';
      renderRecord(r.data);
      renderPrivacy(r.data);
      wire();
      loadShares();
      loadDocuments();
    }).catch(function () {
      state('Your record could not be loaded.', 'Please try again shortly.');
    });
  }

  document.addEventListener('DOMContentLoaded', function () {
    var cfg = window.AIPC_AUTH || {};
    // With a key configured, attach the session token so the API
    // recognises the learner. Without one, the call still runs and
    // returns 401, and the page says so — which is the honest state of a
    // deployment with no auth provider rather than a blank screen.
    if (cfg.clerkPublishableKey && typeof window.AIPC_loadClerk === 'function') {
      window.AIPC_loadClerk(cfg.clerkPublishableKey, function (err, clerk) {
        if (!err && clerk && clerk.session) {
          // attach() hands the session to js/api-auth.js, which mints a
          // fresh token per request. Nothing is captured here: that is
          // the whole point of the change.
          if (window.AIPC_apiAuth) window.AIPC_apiAuth.attach(clerk);
          load();
          return;
        }
        load();
      });
      return;
    }
    load();
  });
})();
