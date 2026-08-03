/* WEC-LC — the graduate record.
 *
 * One page, two ways in:
 *
 *   /graduate.html?handle=<address>   a published profile
 *   /graduate.html?share=<token>      a link the graduate sent someone
 *
 * Both are public and neither requires an account, for the same reason
 * verification does not: the reader is an employer or a registrar, and a
 * record they must register to read is a record they will not read.
 *
 * TWO RULES GOVERN EVERYTHING HERE.
 *
 * 1. SILENCE IS NOT NEUTRAL. A section that is absent reads as a section
 *    that is empty — "this graduate has no professional development" —
 *    which is a claim the page has no business making. Anything withheld
 *    is NAMED as withheld.
 *
 * 2. A ZERO IS NOT AN ABSENCE, AND AN ABSENCE IS NOT A ZERO. An
 *    unassessed competency is written "not yet assessed", never rendered
 *    as an empty bar or a 0, because a reader will read a 0 as a mark.
 */
(function () {
  'use strict';
  var $ = function (s) { return document.querySelector(s); };

  var SECTION_NAMES = {
    awards: 'awards', transcript: 'academic transcript',
    competencies: 'competency framework', cpd: 'professional development',
    studyTime: 'measured study time',
  };

  function fmtDate(iso) {
    if (!iso) return '';
    var d = new Date(iso.length === 10 ? iso + 'T00:00:00Z' : iso);
    if (isNaN(d.getTime())) return iso;
    return d.toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric', timeZone: 'UTC' });
  }

  // Every value that reaches the page goes through textContent. Names,
  // biographies and CPD titles are written by people, and the difference
  // between "a name with an angle bracket in it" and "an attack" only
  // exists if the page never gives it the chance to be the second.
  function el(tag, cls, text) {
    var n = document.createElement(tag);
    if (cls) n.className = cls;
    if (text !== undefined && text !== null && text !== '') n.textContent = text;
    return n;
  }

  function show(id) { $(id).hidden = false; }

  function state(strongText, rest) {
    var box = $('#state');
    box.textContent = '';
    box.appendChild(el('strong', null, strongText));
    box.appendChild(document.createTextNode(rest));
  }

  // --- Awards ---------------------------------------------------------
  function renderAwards(awards) {
    var list = $('#awards');
    list.textContent = '';
    awards.forEach(function (a) {
      var li = el('li', 'grad-award'
        + (a.standing === 'revoked' ? ' is-revoked' : a.standing === 'replaced' ? ' is-replaced' : ''));
      li.appendChild(el('p', 'grad-award__title', a.title));
      if (a.postNominal) li.appendChild(el('p', 'grad-award__post', a.postNominal));

      var meta = el('p', 'grad-award__meta');
      // Standing first when it is not "in good standing". A reader
      // skimming must not have to reach the end of a line to learn the
      // award was withdrawn.
      if (a.standing === 'revoked') meta.appendChild(el('span', 'grad-badge grad-badge--revoked', 'Withdrawn'));
      else if (a.standing === 'replaced') meta.appendChild(el('span', 'grad-badge grad-badge--replaced', 'Superseded'));
      if (a.honourLabel && a.honour !== 'pass') {
        meta.appendChild(el('span', 'grad-badge grad-badge--honour', a.honourLabel));
      }
      meta.appendChild(document.createTextNode(
        'Level ' + a.roman + ' · CEFR ' + a.cefr
        + ' · ' + a.credits + ' WEC Credits · ' + a.tqtHours + ' hours TQT'
        + (a.conferredOn ? ' · Conferred ' + fmtDate(a.conferredOn) : '') + ' · '));
      // Every award on this page is checkable against the Register. A
      // profile is the graduate's own account of themselves; the link is
      // what makes it evidence.
      var link = el('a', null, 'Verify ' + a.verificationCode);
      link.href = '/verify.html?code=' + encodeURIComponent(a.verificationCode);
      meta.appendChild(link);
      li.appendChild(meta);
      list.appendChild(li);
    });
    show('#secAwards');
  }

  // --- Transcript -----------------------------------------------------
  function renderTranscript(t) {
    var totals = $('#totals');
    totals.textContent = '';
    [['WEC Credits', t.creditsAwarded],
      ['Qualification time', t.tqtHoursAwarded + ' h'],
      ['Levels entered', t.levelsEntered],
      ['Levels awarded', t.levelsAwarded]].forEach(function (pair) {
      var dl = el('dl', 'grad-total');
      dl.appendChild(el('dt', null, pair[0]));
      dl.appendChild(el('dd', null, String(pair[1])));
      totals.appendChild(dl);
    });

    var body = $('#transcript');
    body.textContent = '';
    t.entries.forEach(function (e) {
      var tr = document.createElement('tr');
      var level = el('td', 'grad-table__level', 'Level ' + e.roman);
      level.appendChild(el('span', 'grad-table__sub', e.levelName));
      tr.appendChild(level);
      tr.appendChild(el('td', null, e.cefr));
      tr.appendChild(el('td', null, fmtDate(e.startedAt)));
      tr.appendChild(el('td', null, e.modulesTotal ? e.modulesCompleted + ' of ' + e.modulesTotal : '—'));

      var outcome = el('td');
      if (e.award && e.award.standing === 'conferred') {
        outcome.appendChild(document.createTextNode(
          'Awarded' + (e.award.honourLabel && e.award.honour !== 'pass' ? ' with ' + e.award.honourLabel : '')));
        outcome.appendChild(el('span', 'grad-table__sub', fmtDate(e.award.conferredOn)));
      } else if (e.award) {
        // Never dropped. A transcript that quietly omitted a withdrawn
        // award would be the College concealing its own correction.
        outcome.appendChild(document.createTextNode(
          e.award.standing === 'revoked' ? 'Award withdrawn' : 'Award superseded'));
      } else {
        outcome.appendChild(document.createTextNode(e.status === 'active' ? 'In progress' : 'Entered'));
      }
      tr.appendChild(outcome);
      body.appendChild(tr);
    });
    show('#secTranscript');
  }

  // --- Competencies ---------------------------------------------------
  function renderCompetencies(c) {
    $('#competencyNote').textContent = c.note || '';
    $('#competencyNote').hidden = !c.note;
    var list = $('#competencies');
    list.textContent = '';
    c.competencies.forEach(function (x) {
      var li = el('li', 'grad-competency');
      var main = el('div');
      main.appendChild(el('p', 'grad-competency__name', x.name));
      main.appendChild(el('p', 'grad-competency__what', x.description));
      li.appendChild(main);
      // The whole reason this branch exists. `mark === null` is not 0.
      li.appendChild(x.mark === null
        ? el('span', 'grad-competency__mark', 'Not yet assessed')
        : el('span', 'grad-competency__mark is-marked', String(Math.round(x.mark * 100)) + '%'));
      list.appendChild(li);
    });
    show('#secCompetencies');
  }

  // --- CPD ------------------------------------------------------------
  function renderCpd(cpd) {
    var list = $('#cpd');
    list.textContent = '';
    if (!cpd.records.length) {
      list.appendChild(el('li', 'grad-cpd__empty', 'No professional development has been recorded.'));
    }
    cpd.records.forEach(function (r) {
      var li = document.createElement('li');
      li.appendChild(el('p', 'grad-cpd__title', r.title));
      var meta = el('p', 'grad-cpd__meta');
      // Declared and verified must never look the same. An unverified
      // entry rendered identically would be the graduate's word set in
      // the College's typeface.
      meta.appendChild(el('span', 'grad-badge ' + (r.verified ? 'grad-badge--verified' : 'grad-badge--declared'),
        r.verified ? 'Verified' : 'Self-declared'));
      meta.appendChild(document.createTextNode(
        [r.provider, r.kind, r.hours ? r.hours + ' hours' : null, fmtDate(r.completedOn)]
          .filter(Boolean).join(' · ')));
      li.appendChild(meta);
      list.appendChild(li);
    });
    show('#secCpd');
  }

  // --- Assemble -------------------------------------------------------
  function render(p) {
    $('#name').textContent = p.displayName || p.handle || 'Graduate record';
    if (p.headline) { $('#headline').textContent = p.headline; }
    document.title = (p.displayName || 'Graduate record') + ' | Worldwide English College';

    if (p.biography) { $('#biography').textContent = p.biography; show('#secBiography'); }
    if (p.awards) renderAwards(p.awards);
    if (p.transcript) renderTranscript(p.transcript);
    if (p.competencies) renderCompetencies(p.competencies);
    if (p.cpd) renderCpd(p.cpd);
    if (p.studyTime) {
      var h = $('#studyTime');
      h.textContent = p.studyTime.totalHours + ' hours';
      h.appendChild(el('small', null, 'Measured by the platform while this graduate was working.'));
      show('#secStudyTime');
    }

    var withheld = (p.sectionsWithheld || []).map(function (s) { return SECTION_NAMES[s] || s; });
    if (withheld.length) {
      $('#withheld').textContent = 'This graduate has not shared their '
        + withheld.join(', ').replace(/, ([^,]*)$/, ' or $1')
        + '. Their absence here is not a statement that there is nothing to show.';
      show('#withheldBox');
    }

    $('#scopeNote').textContent = p.audience === 'share'
      ? 'A record shared by the graduate. It shows the sections they chose, and the link can be withdrawn by them at any time.'
      : 'A record published by the graduate. Every award listed can be checked independently against the College\'s Graduate Register.';
  }

  function load() {
    var params = new URLSearchParams(location.search);
    var handle = params.get('handle');
    var share = params.get('share');

    if (!handle && !share) {
      $('#scopeNote').textContent = '';
      state('No record requested.',
        ' Open a graduate\'s published address, or the link a graduate sent you. You can also search the Graduate Register or verify a single award by its code.');
      return;
    }

    var url = share
      ? '/api/share/' + encodeURIComponent(share)
      : '/api/graduate/' + encodeURIComponent(handle);

    fetch(url, { headers: { Accept: 'application/json' } })
      .then(function (r) { return r.json().then(function (d) { return { ok: r.ok, d: d }; }); })
      .then(function (res) {
        $('#scopeNote').textContent = '';
        if (share) {
          // A withdrawn link and an expired one give the same answer,
          // deliberately — telling the holder which would tell them
          // whether the graduate revoked it.
          if (!res.d.ok) {
            state('This link is no longer available.',
              ' Shared records expire, and a graduate can withdraw one at any time. Ask them for a new link, or verify an award directly by its code.');
            return;
          }
          render(res.d.profile);
          return;
        }
        if (!res.ok) {
          state('No published record at that address.',
            ' Graduates publish their record by choice, and most do not. An unpublished record is not an unverified one — any award can still be checked by its code.');
          return;
        }
        render(res.d);
      })
      .catch(function () {
        $('#scopeNote').textContent = '';
        state('The record could not be loaded.',
          ' This is a fault on our side, not a statement about any graduate. Please try again shortly.');
      });
  }

  document.addEventListener('DOMContentLoaded', load);
})();
