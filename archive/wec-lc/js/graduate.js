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
    skills: 'language skill profile',
    competencies: 'competency framework',
    distinctions: 'distinctions and contribution',
    cpd: 'professional development',
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


  // --- Language skills -------------------------------------------------
  // CEFR is defined skill by skill, so this is the section an employer
  // reads first. It is also the section most likely to invite a
  // fabrication: four plausible bars would look far better than the
  // truth, which is that the curriculum is not yet mapped.
  function renderSkills(sk) {
    $('#skillNote').textContent = sk.note || '';
    $('#skillNote').hidden = !sk.note;
    var list = $('#skills');
    list.textContent = '';
    sk.skills.forEach(function (x) {
      var li = el('li', 'grad-skill');
      var main = el('div');
      main.appendChild(el('p', 'grad-skill__name', x.name));
      main.appendChild(el('p', 'grad-skill__what', x.description));
      main.appendChild(el('p', 'grad-skill__mode',
        x.mode === 'receptive' ? 'Receptive skill' : 'Productive skill'));
      li.appendChild(main);
      // Descriptors, never percentages — the Executive decision, and the
      // reason there is no bar to draw. "Writing: 82%" claims a
      // precision no rubric supports and invites comparisons between
      // graduates that the marks cannot bear.
      //
      // A null descriptor is not the lowest band. "Emerging" is a
      // judgement somebody made; a graduate nobody assessed has not been
      // judged to be emerging.
      if (!x.descriptor) {
        li.appendChild(el('span', 'grad-skill__mark', 'Not yet assessed'));
      } else {
        var box = el('div', 'grad-skill__value');
        box.appendChild(el('span', 'grad-skill__mark is-marked', x.descriptor.name));
        if (x.descriptor.description) {
          box.appendChild(el('span', 'grad-skill__band', x.descriptor.description));
        }
        li.appendChild(box);
      }
      list.appendChild(li);
    });
    show('#secSkills');
  }

  // --- Distinctions ----------------------------------------------------
  function renderDistinctions(d) {
    var host = $('#distinctions');
    host.textContent = '';
    if (!d.byKind || !d.byKind.length) return;   // nothing approved: no empty section
    d.byKind.forEach(function (group) {
      host.appendChild(el('h3', 'grad-dgroup', group.label));
      var ul = el('ul', 'grad-distinctions');
      group.items.forEach(function (i) {
        var li = el('li', 'grad-distinction' + (i.status === 'withdrawn' ? ' is-withdrawn' : ''));
        li.appendChild(el('p', 'grad-distinction__title', i.title));
        var meta = el('p', 'grad-distinction__meta');
        if (i.status === 'withdrawn') {
          meta.appendChild(el('span', 'grad-badge grad-badge--withdrawn', 'Withdrawn'));
        }
        meta.appendChild(document.createTextNode(
          [i.awardedBy, i.level ? 'Level ' + i.level.roman : null, fmtDate(i.awardedOn)]
            .filter(Boolean).join(' \u00B7 ')));
        li.appendChild(meta);
        if (i.summary) li.appendChild(el('p', 'grad-distinction__what', i.summary));
        // A withdrawal without its reason invites the reader to assume
        // the worst available explanation, which is usually not the one.
        if (i.withdrawnReason) {
          li.appendChild(el('p', 'grad-distinction__why', 'Withdrawn: ' + i.withdrawnReason));
        }
        ul.appendChild(li);
      });
      host.appendChild(ul);
    });
    show('#secDistinctions');
  }

  // --- Verification ----------------------------------------------------
  // What separates a credential from a web page: everything here is
  // checkable by the reader without taking the College's word for it.
  function renderVerification(p) {
    var awards = (p.awards || []).filter(function (a) { return a.standing === 'conferred'; });
    if (!awards.length) return;                  // nothing to verify: no panel
    // The most senior live award is the one a reader checks first.
    var a = awards[awards.length - 1];

    var dl = $('#verifyFacts');
    dl.textContent = '';
    function fact(term, value, cls) {
      dl.appendChild(el('dt', null, term));
      dl.appendChild(el('dd', cls || null, value));
    }
    fact('Graduate Register number', a.verificationCode, 'grad-facts__code');
    fact('Award', a.title);
    fact('Post-nominal', a.postNominal);
    fact('CEFR level', a.cefr);
    fact('Conferred', fmtDate(a.conferredOn));
    fact('Standing', 'Conferred and current');

    // The URL a reader can type, and the URL inside the QR: the same
    // one. A QR that went somewhere the page did not name would be
    // asking for trust the panel exists to avoid needing.
    var url = location.origin + '/verify.html?code=' + encodeURIComponent(a.verificationCode);
    var link = el('a', 'grad-verify__link', url.replace(/^https?:\/\//, ''));
    link.href = url;
    dl.appendChild(el('dt', null, 'Check this award'));
    var dd = document.createElement('dd');
    dd.appendChild(link);
    dl.appendChild(dd);

    $('#verifyNote').textContent = 'Anyone may check this award against the Graduate Register '
      + 'without an account. The check confirms the award, its standing and the date it was conferred; '
      + 'it does not reveal who asked.';

    // The QR is drawn by the server, which is where the encoder lives —
    // and it is fetched rather than assumed, so a failure leaves the
    // typed URL above rather than a broken image beside a promise.
    var box = $('#qrBox');
    fetch('/api/credentials/qr?code=' + encodeURIComponent(a.verificationCode))
      .then(function (r) { return r.ok ? r.text() : Promise.reject(new Error(String(r.status))); })
      .then(function (svg) {
        var host = $('#qr');
        host.textContent = '';
        // Parsed, not assigned: the response is the College's own SVG,
        // and parsing it as a document rather than as markup inside this
        // page keeps a future change to that endpoint from becoming a
        // script-injection route.
        var doc = new DOMParser().parseFromString(svg, 'image/svg+xml');
        if (doc.querySelector('parsererror') || !doc.documentElement
            || doc.documentElement.nodeName.toLowerCase() !== 'svg') {
          box.hidden = true;
          return;
        }
        host.appendChild(document.importNode(doc.documentElement, true));
        $('#qrCaption').textContent = 'Scan to verify';
      })
      .catch(function () { box.hidden = true; });

    show('#secVerify');
  }

  // --- Assemble -------------------------------------------------------
  function render(p) {
    $('#name').textContent = p.displayName || p.handle || 'Graduate record';
    if (p.headline) { $('#headline').textContent = p.headline; }
    document.title = (p.displayName || 'Graduate record') + ' | Worldwide English College';

    if (p.biography) { $('#biography').textContent = p.biography; show('#secBiography'); }
    if (p.awards) renderAwards(p.awards);
    if (p.awards) renderVerification(p);
    if (p.transcript) renderTranscript(p.transcript);
    if (p.skills) renderSkills(p.skills);
    if (p.competencies) renderCompetencies(p.competencies);
    if (p.distinctions) renderDistinctions(p.distinctions);
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
