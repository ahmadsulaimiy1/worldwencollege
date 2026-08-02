/* WEC-LC — Instructor pronunciation review workspace.

   Scores a learner recording against the SPECIFIC drill targets they
   were working on, which the queue supplies with each item. Reviewing
   pronunciation without seeing the target is guessing, so the targets
   are not optional context here — they are rendered above the scoring
   controls and cannot be collapsed away.

   The five sub-scores map exactly to pronunciation_feedback's columns
   and to the dimensions the learner sees in their own profile, so a
   reviewer and a learner are always looking at the same axes.
*/
(function () {
  'use strict';
  var $ = function (s, r) { return (r || document).querySelector(s); };

  var DIMS = [
    ['intelligibility', 'Intelligibility', 'Could a listener who does not know the script understand it?'],
    ['wordStress', 'Word stress', 'Stress on the right syllable of individual words.'],
    ['sentenceStress', 'Sentence stress', 'The right words emphasised across the sentence.'],
    ['individualSounds', 'Individual sounds', 'The specific phonemes this module drills.'],
    ['fluency', 'Fluency', 'Pace and pausing, not speed.'],
  ];

  // Headers come from js/api-auth.js — see the note there. The review
  // queue is staff-only, so this page needs both a valid token (401)
  // and a staff role (403); load() distinguishes the two for the
  // reviewer.
  function api(path, opts) {
    return window.WEC_LC_apiAuth.headers().then(function (headers) {
      return fetch(path, Object.assign({}, opts || {}, { headers: headers }));
    }).then(function (r) {
      return r.json().catch(function () { return {}; }).then(function (b) {
        if (!r.ok) throw Object.assign(new Error(b.message || r.statusText), { status: r.status });
        return b;
      });
    });
  }

  function fmt(ms) {
    if (!ms) return '—';
    var s = Math.round(ms / 1000);
    return Math.floor(s / 60) + ':' + String(s % 60).padStart(2, '0');
  }
  function ago(iso) {
    var d = (Date.now() - new Date(iso).getTime()) / 86400000;
    if (d < 1) return 'today';
    if (d < 2) return 'yesterday';
    return Math.floor(d) + ' days ago';
  }

  function card(rec) {
    var el = document.createElement('article');
    el.className = 'lab-card';
    el.style.marginBottom = '1.1rem';
    el.dataset.id = rec.id;

    var head = document.createElement('div');
    head.className = 'lab-card__head';
    head.innerHTML = '<h3 class="lab-card__title"></h3><span class="lab-card__meta"></span>';
    $('.lab-card__title', head).textContent = rec.unitTitle + ' — ' + rec.itemTitle;
    $('.lab-card__meta', head).textContent =
      'Level ' + rec.levelId + ' · take ' + rec.attempt +
      (rec.priorAttempts ? ' (of ' + (rec.priorAttempts + 1) + ')' : '') +
      ' · ' + fmt(rec.durationMs) + ' · submitted ' + ago(rec.submittedAt);
    el.appendChild(head);

    var body = document.createElement('div');
    body.className = 'lab-card__body';

    if (rec.mediaUrl) {
      var a = document.createElement('audio');
      a.controls = true; a.src = rec.mediaUrl; a.preload = 'none';
      a.style.width = '100%';
      body.appendChild(a);
    } else {
      var n = document.createElement('p');
      n.className = 'lab-note';
      n.textContent = 'No playable audio is attached to this submission.';
      body.appendChild(n);
    }

    if (rec.targets && rec.targets.length) {
      var t = document.createElement('div');
      t.style.margin = '.9rem 0';
      t.innerHTML = '<p class="lab-card__meta" style="margin:0 0 .4rem">Drilling against</p>';
      rec.targets.forEach(function (tg) {
        var d = document.createElement('div');
        d.className = 'target';
        d.style.padding = '.5rem 0';
        d.innerHTML = '<span class="target__focus"></span><p class="target__t"></p><p class="target__e"></p>';
        $('.target__focus', d).textContent = tg.focus.replace(/_/g, ' ');
        $('.target__t', d).textContent = tg.target;
        $('.target__e', d).textContent = '“' + tg.example + '”';
        t.appendChild(d);
      });
      body.appendChild(t);
    }

    var grid = document.createElement('div');
    grid.className = 'dims';
    grid.style.margin = '.9rem 0';
    DIMS.forEach(function (d) {
      var row = document.createElement('div');
      row.className = 'dim';
      row.style.gridTemplateColumns = '9.5rem 1fr 3rem';
      var id = 'sc_' + rec.id + '_' + d[0];
      row.innerHTML =
        '<label class="dim__n" for="' + id + '"></label>' +
        '<input type="range" min="0" max="100" step="5" value="70" id="' + id + '" data-dim="' + d[0] + '" style="width:100%">' +
        '<span class="dim__v">70%</span>';
      $('.dim__n', row).textContent = d[1];
      $('.dim__n', row).title = d[2];
      var range = $('input', row);
      range.addEventListener('input', function () { $('.dim__v', row).textContent = range.value + '%'; });
      grid.appendChild(row);
    });
    body.appendChild(grid);

    var ta = document.createElement('textarea');
    ta.placeholder = 'Spoken feedback is stronger than written, but write the one thing they should change before the next take.';
    ta.style.cssText = 'width:100%;min-height:78px;font:400 .9rem/1.6 var(--font-body);border:1px solid var(--line);border-radius:9px;padding:.7rem .8rem;background:var(--paper)';
    body.appendChild(ta);

    var row = document.createElement('div');
    row.style.cssText = 'display:flex;gap:.6rem;align-items:center;margin-top:.7rem;flex-wrap:wrap';
    var send = document.createElement('button');
    send.className = 'tbtn tbtn--primary'; send.type = 'button'; send.textContent = 'Send feedback';
    var status = document.createElement('span');
    status.className = 'notes__saved';
    row.appendChild(send); row.appendChild(status);
    body.appendChild(row);

    send.addEventListener('click', function () {
      var scores = {};
      Array.prototype.forEach.call(grid.querySelectorAll('input[data-dim]'), function (i) {
        scores[i.dataset.dim] = Number(i.value) / 100;
      });
      send.disabled = true; status.textContent = 'sending…';
      api('/api/lms/recording-review', {
        method: 'POST',
        body: JSON.stringify({ recordingId: rec.id, comment: ta.value || null, scores: scores }),
      }).then(function () {
        el.style.transition = 'opacity .3s var(--ease-premium), transform .3s var(--ease-premium)';
        el.style.opacity = '0'; el.style.transform = 'translateY(-6px)';
        setTimeout(function () { el.remove(); tick(-1); }, 320);
      }).catch(function (e) {
        send.disabled = false;
        status.textContent = 'could not send: ' + e.message;
      });
    });

    el.appendChild(body);
    return el;
  }

  var remaining = 0;
  function tick(delta) {
    remaining += delta;
    $('#qCount').textContent = remaining === 0 ? 'queue clear' : remaining + ' awaiting review';
    if (remaining === 0 && !$('#queue').children.length) {
      $('#queue').innerHTML = '<p class="lab-note">Nothing awaiting review. When a learner records, it appears here oldest first.</p>';
    }
  }

  function skeleton(n) {
    var out = '';
    for (var i = 0; i < n; i++) {
      out += '<div class="lab-skel" style="height:170px;margin-bottom:1.1rem"></div>';
    }
    return out;
  }

  function load() {
    var lv = $('#levelFilter').value;
    $('#queue').innerHTML = skeleton(3);
    api('/api/lms/review-queue' + (lv ? '?levelId=' + lv : ''))
      .then(function (rows) {
        $('#queue').innerHTML = '';
        remaining = 0;
        rows.forEach(function (r) { $('#queue').appendChild(card(r)); });
        tick(rows.length);
      })
      .catch(function (e) {
        $('#queue').innerHTML = '';
        $('#qError').textContent = e.status === 403
          ? 'This workspace is for teaching staff. Your account does not have access.'
          : 'Could not load the queue: ' + e.message;
      });
  }

  function offline() {
    var u = function () { document.body.classList.toggle('is-offline', !navigator.onLine); };
    window.addEventListener('online', u); window.addEventListener('offline', u); u();
  }

  document.addEventListener('DOMContentLoaded', function () {
    offline();
    $('#levelFilter').addEventListener('change', load);
    // Same guard-then-load sequence as the Listening Lab — see the note
    // at the bottom of js/listening-lab.js.
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
