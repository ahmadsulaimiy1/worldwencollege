/* WEC — My Academic Record.
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
 *
 * ────────────────────────────────────────────────────────────────
 * DATA GOES THROUGH js/portal-data.js, NOT A LOCAL FETCH HELPER
 * ────────────────────────────────────────────────────────────────
 * This page used to hand-roll its own auth (one Clerk token minted at
 * load and reused for the whole session — Clerk session tokens are
 * short-lived, and that pattern is exactly what js/api-auth.js exists to
 * prevent) and its own fetch wrapper naming endpoints directly. Both are
 * gone: js/portal-guard.js gates the page the same way every other
 * portal page does, and every read/write goes through a
 * window.WEC_LC_data operation, which mints a fresh token per request.
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
    [['WEC Credits', t.creditsAwarded], ['Qualification time', t.tqtHoursAwarded + ' h'],
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
          window.WEC_LC_data.revokeProfileShare(s.id).then(loadShares).catch(function () { btn.disabled = false; });
        });
        li.appendChild(btn);
      }
      list.appendChild(li);
    });
    $('#secShares').hidden = false;
  }

  function loadShares() {
    return window.WEC_LC_data.profileShares().then(function (data) {
      renderShares(data.shares || []);
    }).catch(function () {});
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
    return window.WEC_LC_data.documents().then(function (data) {
      renderDocuments(data.documents || []);
    }).catch(function () {});
  }

  // ---- wiring ---------------------------------------------------------
  function wire() {
    $('#privacyForm').addEventListener('submit', function (e) {
      e.preventDefault();
      $('#handleError').textContent = '';
      $('#saved').textContent = '';
      var handle = $('#handle').value.trim();
      window.WEC_LC_data.saveProfile({
        handle: handle || null,
        isPublic: $('#isPublic').checked,
        transcript: $('#showTranscript').checked,
        competencies: $('#showCompetencies').checked,
        cpd: $('#showCpd').checked,
        studyTime: $('#showStudyTime').checked,
      }).then(function (data) {
        renderPrivacy(data);
        $('#saved').textContent = 'Saved. ' + ($('#isPublic').checked
          ? 'Your profile is published.'
          : 'Your profile is private.');
      }).catch(function (err) {
        $('#handleError').textContent = (err && err.apiMessage) || 'Those settings could not be saved.';
      });
    });

    $('#shareForm').addEventListener('submit', function (e) {
      e.preventDefault();
      var sections = [].slice.call(document.querySelectorAll('input[name="sections"]:checked'))
        .map(function (i) { return i.value; });
      window.WEC_LC_data.createProfileShare({
        sections: sections,
        days: Number($('#shareDays').value),
        label: $('#shareLabel').value.trim() || null,
      }).then(function (data) {
        var box = $('#newLink');
        box.textContent = '';
        box.hidden = false;
        var url = location.origin + '/graduate.html?share=' + encodeURIComponent(data.token);
        box.appendChild(el('strong', null, 'Copy this link now.'));
        box.appendChild(document.createTextNode(
          'The College stores only a fingerprint of it and cannot show it to you again. If you lose it, withdraw the link and make another.'));
        box.appendChild(el('code', null, url));
        loadShares();
      }).catch(function (err) {
        var box = $('#newLink');
        box.textContent = '';
        box.hidden = false;
        box.appendChild(el('strong', null, 'That link could not be created.'));
        box.appendChild(document.createTextNode((err && err.apiMessage) || ''));
      });
    });

    [].slice.call(document.querySelectorAll('[data-issue]')).forEach(function (btn) {
      btn.addEventListener('click', function () {
        $('#docError').textContent = '';
        btn.disabled = true;
        window.WEC_LC_data.issueDocument({ documentType: btn.getAttribute('data-issue') })
          .then(function () {
            btn.disabled = false;
            loadDocuments();
          }).catch(function (err) {
            btn.disabled = false;
            $('#docError').textContent = (err && err.apiMessage) || 'That document could not be issued.';
          });
      });
    });
  }

  function load() {
    window.WEC_LC_data.profile().then(function (data) {
      $('#state').textContent = '';
      renderRecord(data);
      renderPrivacy(data);
      wire();
      loadShares();
      loadDocuments();
    }).catch(function (err) {
      if (err.status === 401) {
        state('You are not signed in.',
          'Your academic record is private to you. Sign in to see it, or verify an award by its code if you are checking someone else’s.');
        return;
      }
      state('Your record could not be loaded.', window.WEC_LC_data.humanError(err, 'Please try again shortly.'));
    });
  }

  document.addEventListener('DOMContentLoaded', function () {
    var guarded = window.WEC_LC_guardPortal({
      signOutRedirect: '/',
      shellSelector: '.rec-shell',
      onAuthenticated: function (clerk, done) {
        window.WEC_LC_apiAuth.attach(clerk);
        done();
        load();
      },
    });
    // No Clerk key configured: nothing gates the page, and load() runs
    // directly — the API call still goes out, still returns 401, and
    // the page says so, which is the honest state of a deployment with
    // no auth provider rather than a blank screen.
    if (!guarded) load();
  });
})();
