/* WEC — External Examiner pass list.

   "Sit at the board that approves results, and confirm or decline to
   confirm the pass list" (docs/appointment-briefs.md). This page shows
   exactly the marks on record — nothing calculated beyond what
   functions/_lib/registry/pass-list.js's evidenceFor() actually
   computes — and records a decision. It does not confer anything: that
   is a separate act, by a separate person, once this decision exists.
   See that file's header comment for why the two are kept apart.
*/
(function () {
  'use strict';
  var $ = function (s, r) { return (r || document).querySelector(s); };

  var HONOUR_LABEL = { pass: 'Pass', merit: 'Merit' };

  function pct(n) { return n == null ? '—' : Math.round(n) + '%'; }

  function marksTable(marks) {
    if (!marks.length) return '<p class="lab-note">No quiz or assignment items exist for this level yet.</p>';
    var rows = marks.map(function (m) {
      return '<tr><td>Unit ' + m.unitSequence + '</td><td>' + esc(m.title) + '</td><td>' + m.kind + '</td>' +
        '<td>' + (m.graded ? pct(m.score * 100) : 'not yet graded') + '</td></tr>';
    }).join('');
    return '<div style="overflow-x:auto"><table style="width:100%;border-collapse:collapse;font-size:.86rem">' +
      '<thead><tr style="text-align:left;color:var(--ink-soft)"><th>Unit</th><th>Item</th><th>Kind</th><th>Mark</th></tr></thead>' +
      '<tbody>' + rows + '</tbody></table></div>';
  }

  function esc(s) {
    var d = document.createElement('div'); d.textContent = s == null ? '' : String(s); return d.innerHTML;
  }

  function evidenceBlock(ev) {
    var el = document.createElement('div');
    el.style.cssText = 'margin-top:1rem;padding-top:1rem;border-top:1px solid var(--line)';

    var summary = document.createElement('p');
    summary.style.cssText = 'font-weight:600;margin:0 0 .6rem';
    summary.textContent = ev.overallPct == null
      ? 'No graded marks exist for this level yet.'
      : 'Overall ' + pct(ev.overallPct) + ' · lowest single mark ' + pct(ev.floorPct) +
        ' · ' + (ev.calculatedHonour ? HONOUR_LABEL[ev.calculatedHonour] : 'below the adopted pass standard (70% overall, no mark below 50%)');
    el.appendChild(summary);

    var marksWrap = document.createElement('div');
    marksWrap.innerHTML = marksTable(ev.marks);
    el.appendChild(marksWrap);

    // Governance A6d: the competency mapping is commissioned, not
    // finished. Shown here exactly as the graduate's own profile shows
    // it — honestly, not hidden — see docs/governance-decisions.md.
    var cc = ev.competencyCoverage;
    var note = document.createElement('p');
    note.className = 'lab-note';
    note.style.marginTop = '.8rem';
    note.textContent = cc && cc.assessmentsUnmapped === 0 && cc.perCompetency.every(function (c) { return c.meetsRule; })
      ? 'Competency mapping for this level meets the Academic Framework’s own rule.'
      : 'Competency mapping for this level is incomplete (' + (cc ? cc.assessmentsUnmapped : '?') +
        ' of ' + (cc ? cc.assessmentsTotal : '?') + ' assessments unmapped) — commissioned under governance A6d, not yet finished. The marks above are real; the competency-level breakdown is not yet available.';
    el.appendChild(note);

    if (ev.decisionHistory && ev.decisionHistory.length) {
      var hist = document.createElement('p');
      hist.className = 'lab-note';
      hist.style.marginTop = '.5rem';
      hist.textContent = ev.decisionHistory.map(function (d) {
        return d.decision + ' by ' + d.examinerEmail + ' on ' + d.createdAt.slice(0, 10) +
          (d.superseded ? ' (superseded)' : d.conferredAwardId ? ' (conferred)' : '');
      }).join(' · ');
      el.appendChild(hist);
    }

    var form = document.createElement('div');
    form.style.cssText = 'display:flex;gap:.6rem;align-items:flex-start;margin-top:.9rem;flex-wrap:wrap';
    var ta = document.createElement('textarea');
    ta.placeholder = 'Notes for the record (optional).';
    ta.style.cssText = 'flex:1 1 16rem;min-height:60px;font:400 .88rem/1.5 var(--font-body);border:1px solid var(--line);border-radius:8px;padding:.6rem .7rem;background:var(--paper)';
    form.appendChild(ta);

    var btns = document.createElement('div');
    btns.style.cssText = 'display:flex;gap:.5rem;flex-direction:column';
    var confirmBtn = document.createElement('button');
    confirmBtn.className = 'tbtn tbtn--primary'; confirmBtn.type = 'button'; confirmBtn.textContent = 'Confirm';
    var declineBtn = document.createElement('button');
    declineBtn.className = 'tbtn'; declineBtn.type = 'button'; declineBtn.textContent = 'Decline';
    var status = document.createElement('span');
    status.className = 'notes__saved';
    btns.appendChild(confirmBtn); btns.appendChild(declineBtn); btns.appendChild(status);
    form.appendChild(btns);
    el.appendChild(form);

    function decide(decision, userId, levelId, cardEl) {
      confirmBtn.disabled = true; declineBtn.disabled = true;
      status.textContent = 'sending…';
      window.WEC_LC_data.examinerDecision({
        userId: userId, levelId: levelId, decision: decision, notes: ta.value || null,
      }).then(function () {
        cardEl.style.transition = 'opacity .3s var(--ease-premium)';
        cardEl.style.opacity = '0';
        setTimeout(function () { cardEl.remove(); tick(-1); }, 300);
      }).catch(function (e) {
        confirmBtn.disabled = false; declineBtn.disabled = false;
        status.textContent = window.WEC_LC_data.humanError(e, 'That decision could not be sent.');
      });
    }

    el._wire = function (userId, levelId, cardEl) {
      confirmBtn.addEventListener('click', function () { decide('confirmed', userId, levelId, cardEl); });
      declineBtn.addEventListener('click', function () { decide('declined', userId, levelId, cardEl); });
    };
    return el;
  }

  function card(row) {
    var el = document.createElement('article');
    el.className = 'lab-card';
    el.style.marginBottom = '1.1rem';

    var head = document.createElement('div');
    head.className = 'lab-card__head';
    head.innerHTML = '<h3 class="lab-card__title"></h3><span class="lab-card__meta"></span>';
    $('.lab-card__title', head).textContent = (row.preferredName || row.email);
    $('.lab-card__meta', head).textContent =
      'Level ' + row.roman + ' — ' + row.levelName + ' · ' + row.completedCount + ' of ' + row.totalCount + ' units';
    el.appendChild(head);

    var body = document.createElement('div');
    body.className = 'lab-card__body';

    if (row.pendingDecision) {
      var p = document.createElement('p');
      p.className = 'lab-note';
      p.textContent = 'Already ' + row.pendingDecision.decision + ' on ' + row.pendingDecision.createdAt.slice(0, 10) +
        (row.pendingDecision.decision === 'confirmed' ? ' — awaiting conferral.' : ' — a new decision below will supersede it.');
      body.appendChild(p);
    }

    var reviewBtn = document.createElement('button');
    reviewBtn.className = 'tbtn tbtn--primary'; reviewBtn.type = 'button';
    reviewBtn.textContent = 'Review the evidence';
    body.appendChild(reviewBtn);

    reviewBtn.addEventListener('click', function () {
      reviewBtn.disabled = true; reviewBtn.textContent = 'Loading…';
      window.WEC_LC_data.examinerEvidence(row.userId, row.levelId).then(function (ev) {
        reviewBtn.remove();
        var block = evidenceBlock(ev);
        body.appendChild(block);
        block._wire(row.userId, row.levelId, el);
      }).catch(function (e) {
        reviewBtn.disabled = false; reviewBtn.textContent = 'Review the evidence';
        var err = document.createElement('p');
        err.style.color = 'var(--red)';
        err.textContent = window.WEC_LC_data.humanError(e, 'The evidence could not be loaded.');
        body.appendChild(err);
      });
    });

    el.appendChild(body);
    return el;
  }

  var remaining = 0;
  function tick(delta) {
    remaining += delta;
    $('#qCount').textContent = remaining === 0 ? 'list clear' : remaining + ' awaiting a decision';
    if (remaining === 0 && !$('#queue').children.length) {
      $('#queue').innerHTML = '<p class="lab-note">Nobody is currently awaiting a decision. When a learner finishes a level, they appear here.</p>';
    }
  }

  function skeleton(n) {
    var out = '';
    for (var i = 0; i < n; i++) out += '<div class="lab-skel" style="height:90px;margin-bottom:1.1rem"></div>';
    return out;
  }

  function load() {
    $('#queue').innerHTML = skeleton(2);
    window.WEC_LC_data.examinerQueue()
      .then(function (result) {
        $('#queue').innerHTML = '';
        remaining = 0;
        result.entries.forEach(function (r) { $('#queue').appendChild(card(r)); });
        tick(result.entries.length);
      })
      .catch(function (e) {
        $('#queue').innerHTML = '';
        $('#qError').textContent = e.status === 403
          ? 'This page is for the College’s External Examiner. Your account does not have access.'
          : window.WEC_LC_data.humanError(e, 'The pass list could not be loaded.');
      });
  }

  function offline() {
    var u = function () { document.body.classList.toggle('is-offline', !navigator.onLine); };
    window.addEventListener('online', u); window.addEventListener('offline', u); u();
  }

  document.addEventListener('DOMContentLoaded', function () {
    offline();
    var guarded = window.WEC_LC_guardPortal({
      signOutRedirect: '/',
      shellSelector: '.lab-body',
      onAuthenticated: function (clerk, done) {
        window.WEC_LC_apiAuth.attach(clerk);
        done();
        load();
      },
    });
    if (!guarded) load();
  });
})();
