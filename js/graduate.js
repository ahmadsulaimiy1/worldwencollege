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

  /* ── THE PAGE SPEAKS THE EDITION IT IS SERVED IN ────────────────────
   *
   * This file used to hold one set of strings, in English, and set them
   * on both editions. So /ar/graduate.html — the Arabic public record a
   * graduate hands to an employer — served an Arabic masthead and then
   * filled every line beneath it in English: "Loading this record…",
   * "Withdrawn", "Not yet assessed", "Scan to verify". Found by
   * rendering it, not by reading it.
   *
   * Two rules follow the house pattern in js/my-standing.js:
   *
   *   1. Everything the PAGE says is here, in both languages.
   *   2. Everything the RECORD says — a level's name, a rank, a
   *      distinction's kind, a framework's note — comes from the API in
   *      both languages, beside each other, and `pick()` chooses. The
   *      page never translates a published fact; it selects one.
   *
   * Where the API has no Arabic for something (a competency's name, a
   * skill descriptor — both of them rows in tables with no Arabic
   * column yet, recorded in docs/platform-capabilities.md § 11), the
   * English stands. An untranslated name is legible; a blank is not.
   */
  var AR = document.documentElement.lang === 'ar';
  var LOCALE = AR ? 'ar' : 'en-GB';

  /** English and Arabic side by side: take the reader's, fall back. */
  function pick(en, ar) { return (AR && ar) ? ar : en; }

  var SECTION_NAMES = AR ? {
    awards: 'الشهادات', transcript: 'السجل الأكاديمي',
    skills: 'ملفّ المهارات اللغوية',
    competencies: 'إطار الكفايات',
    distinctions: 'التمايز والإسهام',
    cpd: 'التطوير المهني',
    studyTime: 'زمن الدراسة المقيس',
  } : {
    awards: 'awards', transcript: 'academic transcript',
    skills: 'language skill profile',
    competencies: 'competency framework',
    distinctions: 'distinctions and contribution',
    cpd: 'professional development',
    studyTime: 'measured study time',
  };

  var T = AR ? {
    fallbackName: 'سجل خرّيج',
    titleSuffix: ' \u2014 الكلية العالمية للغة الإنجليزية',
    withdrawn: 'مسحوبة',
    superseded: 'مُستبدَلة',
    verified: 'موثّق',
    selfDeclared: 'إقرار ذاتي',
    notAssessed: 'لم يُقوَّم بعد',
    receptive: 'مهارة استقبال',
    productive: 'مهارة إنتاج',
    noCpd: 'لم يُسجَّل تطوير مهني.',
    hours: function (n) { return n + ' ساعة'; },
    level: function (a) { return 'المستوى ' + a; },
    awardFacts: function (a) {
      return [T.level(pick(a.roman, a.ordinalAr)), 'الإطار الأوروبي ' + a.cefr,
        a.credits + ' من أرصدة الكلية', a.tqtHours + ' ساعة زمنًا كليًّا للمؤهل'];
    },
    conferredOn: function (d) { return 'مُنحت في ' + d; },
    verifyPrefix: 'تحقّق من ',
    totals: ['أرصدة الكلية', 'الزمن الكلي للمؤهل', 'مستويات دخلها', 'مستويات مُنحت'],
    hoursShort: ' ساعة',
    modulesOf: function (a, b) { return a + ' من ' + b; },
    awarded: 'مُنحت',
    awardedWith: function (h) { return 'مُنحت بمرتبة ' + h; },
    awardWithdrawn: 'شهادة مسحوبة',
    awardSuperseded: 'شهادة مُستبدَلة',
    inProgress: 'قيد الدراسة',
    entered: 'دخلها',
    withdrawnReason: function (why) { return 'سبب السحب: ' + why; },
    registerNumber: 'رقم سجل الخرّيجين',
    award: 'الشهادة',
    postNominal: 'اللقب اللاحق',
    cefrLevel: 'مستوى الإطار الأوروبي',
    conferred: 'تاريخ المنح',
    standing: 'الحال',
    conferredCurrent: 'ممنوحة وقائمة',
    checkThis: 'تحقّق من هذه الشهادة',
    verifyNote: 'لكلّ أحد أن يتحقّق من هذه الشهادة في سجل الخرّيجين دون حساب. '
      + 'ويؤكّد التحقّق الشهادةَ وحالَها وتاريخ منحها، ولا يكشف عمّن سأل.',
    scanToVerify: 'امسح للتحقّق',
    withheldSentence: function (list) {
      return 'لم يشارك هذا الخرّيج ' + list + '. وغيابها هنا ليس قولًا بأن لا شيء يُعرَض.';
    },
    scopeShare: 'سجلّ شاركه الخرّيج نفسه. يعرض ما اختاره من أقسام، وله أن يسحب الرابط متى شاء.',
    scopePublic: 'سجلّ نشره الخرّيج نفسه. وكلّ شهادة فيه يمكن التحقّق منها مستقلّةً في سجل خرّيجي الكلية.',
    noneRequested: ['لم يُطلَب سجل.',
      ' افتح العنوان الذي نشره خرّيج، أو الرابط الذي أرسله إليك. ولك أيضًا أن تبحث في سجل الخرّيجين أو تتحقّق من شهادة واحدة برمزها.'],
    linkGone: ['لم يعد هذا الرابط متاحًا.',
      ' روابط المشاركة تنتهي صلاحيتها، وللخرّيج أن يسحب رابطه متى شاء. اطلب منه رابطًا جديدًا، أو تحقّق من الشهادة برمزها مباشرة.'],
    noRecord: ['لا سجلَّ منشورًا على هذا العنوان.',
      ' ينشر الخرّيجون سجلّاتهم اختيارًا، وأكثرهم لا ينشر. وسجلٌّ غير منشور ليس سجلًّا غير موثَّق — فكلّ شهادة يمكن التحقّق منها برمزها.'],
    failed: ['تعذّر تحميل السجل.',
      ' هذا خللٌ عندنا، لا قولٌ في أيّ خرّيج. أعد المحاولة بعد قليل.'],
  } : {
    fallbackName: 'Graduate record',
    titleSuffix: ' \u2014 Worldwide English College',
    withdrawn: 'Withdrawn',
    superseded: 'Superseded',
    verified: 'Verified',
    selfDeclared: 'Self-declared',
    notAssessed: 'Not yet assessed',
    receptive: 'Receptive skill',
    productive: 'Productive skill',
    noCpd: 'No professional development has been recorded.',
    hours: function (n) { return n + ' hours'; },
    level: function (a) { return 'Level ' + a; },
    awardFacts: function (a) {
      return ['Level ' + a.roman, 'CEFR ' + a.cefr,
        a.credits + ' WEC Credits', a.tqtHours + ' hours TQT'];
    },
    conferredOn: function (d) { return 'Conferred ' + d; },
    verifyPrefix: 'Verify ',
    totals: ['WEC Credits', 'Qualification time', 'Levels entered', 'Levels awarded'],
    hoursShort: ' h',
    modulesOf: function (a, b) { return a + ' of ' + b; },
    awarded: 'Awarded',
    awardedWith: function (h) { return 'Awarded with ' + h; },
    awardWithdrawn: 'Award withdrawn',
    awardSuperseded: 'Award superseded',
    inProgress: 'In progress',
    entered: 'Entered',
    withdrawnReason: function (why) { return 'Withdrawn: ' + why; },
    registerNumber: 'Graduate Register number',
    award: 'Award',
    postNominal: 'Post-nominal',
    cefrLevel: 'CEFR level',
    conferred: 'Conferred',
    standing: 'Standing',
    conferredCurrent: 'Conferred and current',
    checkThis: 'Check this award',
    verifyNote: 'Anyone may check this award against the Graduate Register '
      + 'without an account. The check confirms the award, its standing and the date it was '
      + 'conferred; it does not reveal who asked.',
    scanToVerify: 'Scan to verify',
    withheldSentence: function (list) {
      return 'This graduate has not shared their ' + list
        + '. Their absence here is not a statement that there is nothing to show.';
    },
    scopeShare: 'A record shared by the graduate. It shows the sections they chose, and the link '
      + 'can be withdrawn by them at any time.',
    scopePublic: 'A record published by the graduate. Every award listed can be checked '
      + 'independently against the College\'s Graduate Register.',
    noneRequested: ['No record requested.',
      ' Open a graduate\'s published address, or the link a graduate sent you. You can also search the Graduate Register or verify a single award by its code.'],
    linkGone: ['This link is no longer available.',
      ' Shared records expire, and a graduate can withdraw one at any time. Ask them for a new link, or verify an award directly by its code.'],
    noRecord: ['No published record at that address.',
      ' Graduates publish their record by choice, and most do not. An unpublished record is not an unverified one — any award can still be checked by its code.'],
    failed: ['The record could not be loaded.',
      ' This is a fault on our side, not a statement about any graduate. Please try again shortly.'],
  };

  /** The list separator an Arabic reader expects, and the English one. */
  function joinNames(list) {
    if (AR) return list.join('، ').replace(/، ([^،]*)$/, ' ولا $1');
    return list.join(', ').replace(/, ([^,]*)$/, ' or $1');
  }

  function fmtDate(iso) {
    if (!iso) return '';
    var d = new Date(iso.length === 10 ? iso + 'T00:00:00Z' : iso);
    if (isNaN(d.getTime())) return iso;
    try {
      return d.toLocaleDateString(LOCALE, { day: 'numeric', month: 'long', year: 'numeric', timeZone: 'UTC' });
    } catch (e) { return iso.slice(0, 10); }
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

  /* A run of text that must not be reordered by its neighbours.
   *
   * The award line is a chain of facts — a level, a CEFR band, a credit
   * count, a register code — and on the Arabic edition it is an RTL
   * paragraph carrying Latin runs. Set as one string it renders
   * "الإطار الأوروبي B1 · 20 من أرصدة الكلية", with the "B1 · 20"
   * pushed together by the bidirectional algorithm and the reader left
   * to guess which number belongs to which fact.
   *
   * <bdi> isolates each fact, so the ordering inside one never reaches
   * across the separator into the next. It costs nothing on the English
   * edition and it is the element the specification provides for
   * exactly this. */
  function bdi(text) {
    var n = document.createElement('bdi');
    n.textContent = String(text);
    return n;
  }

  /* THE GRADUATE'S OWN WORDS, IN WHATEVER LANGUAGE THEY WROTE THEM.
   *
   * A biography, an award title, a distinction — these are not the
   * page's prose and they are not necessarily the page's language. An
   * English sentence set inside an Arabic paragraph takes the
   * paragraph's base direction, which puts its full stop at the wrong
   * end and reads as a typographic error the graduate did not make.
   *
   * Two treatments, because the two cases genuinely differ:
   *
   *   prose() — a paragraph the graduate wrote. dir="auto" on the
   *     BLOCK, so the whole paragraph takes its own direction and
   *     aligns as its own language would. Anything else sets an English
   *     paragraph ragged from the wrong side.
   *
   *   named() — a title, a post-nominal, a register code: one short
   *     run inside a line that belongs to the page. The run is isolated
   *     and the block keeps the page's direction and alignment, which
   *     is exactly how /ar/study/level-3/ already sets the award title
   *     it publishes in English.
   */
  function prose(tag, cls, text) {
    var n = el(tag, cls, text);
    n.setAttribute('dir', 'auto');
    return n;
  }

  function named(tag, cls, text) {
    var n = el(tag, cls);
    if (text !== undefined && text !== null && text !== '') n.appendChild(bdi(text));
    return n;
  }

  /** A row of isolated facts, separated the way the site separates. */
  function facts(host, list) {
    list.filter(Boolean).forEach(function (f, i) {
      if (i) host.appendChild(document.createTextNode(' \u00B7 '));
      host.appendChild(bdi(f));
    });
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
      li.appendChild(named('p', 'grad-award__title', a.title));
      if (a.postNominal) li.appendChild(named('p', 'grad-award__post', a.postNominal));

      var meta = el('p', 'grad-award__meta');
      // Standing first when it is not "in good standing". A reader
      // skimming must not have to reach the end of a line to learn the
      // award was withdrawn.
      if (a.standing === 'revoked') meta.appendChild(el('span', 'grad-badge grad-badge--revoked', T.withdrawn));
      else if (a.standing === 'replaced') meta.appendChild(el('span', 'grad-badge grad-badge--replaced', T.superseded));
      if (a.honourLabel && a.honour !== 'pass') {
        // The rank is a PUBLISHED FACT with two names, both issued by
        // the register. The page picks; it does not translate.
        meta.appendChild(el('span', 'grad-badge grad-badge--honour', pick(a.honourLabel, a.honourLabelAr)));
      }
      facts(meta, T.awardFacts(a).concat(
        a.conferredOn ? [T.conferredOn(fmtDate(a.conferredOn))] : []));
      meta.appendChild(document.createTextNode(' \u00B7 '));
      // Every award on this page is checkable against the Register. A
      // profile is the graduate's own account of themselves; the link is
      // what makes it evidence.
      // The code is Latin inside an Arabic sentence: isolated, so the
      // hyphens in WEC-XXXX-XXXX-XXXXX cannot migrate.
      var link = el('a');
      link.appendChild(document.createTextNode(T.verifyPrefix));
      link.appendChild(bdi(a.verificationCode));
      link.href = (AR ? '/ar/verify.html?code=' : '/verify.html?code=') + encodeURIComponent(a.verificationCode);
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
    [[T.totals[0], t.creditsAwarded],
      [T.totals[1], t.tqtHoursAwarded + T.hoursShort],
      [T.totals[2], t.levelsEntered],
      [T.totals[3], t.levelsAwarded]].forEach(function (pair) {
      var dl = el('dl', 'grad-total');
      dl.appendChild(el('dt', null, pair[0]));
      dl.appendChild(el('dd', null, String(pair[1])));
      totals.appendChild(dl);
    });

    var body = $('#transcript');
    body.textContent = '';
    t.entries.forEach(function (e) {
      var tr = document.createElement('tr');
      var level = el('td', 'grad-table__level', T.level(pick(e.roman, e.ordinalAr)));
      level.appendChild(el('span', 'grad-table__sub', pick(e.levelName, e.levelNameAr)));
      tr.appendChild(level);
      tr.appendChild(el('td', null, e.cefr));
      tr.appendChild(el('td', null, fmtDate(e.startedAt)));
      tr.appendChild(el('td', null, e.modulesTotal ? T.modulesOf(e.modulesCompleted, e.modulesTotal) : '—'));

      var outcome = el('td');
      if (e.award && e.award.standing === 'conferred') {
        outcome.appendChild(document.createTextNode(
          e.award.honourLabel && e.award.honour !== 'pass'
            ? T.awardedWith(pick(e.award.honourLabel, e.award.honourLabelAr))
            : T.awarded));
        outcome.appendChild(el('span', 'grad-table__sub', fmtDate(e.award.conferredOn)));
      } else if (e.award) {
        // Never dropped. A transcript that quietly omitted a withdrawn
        // award would be the College concealing its own correction.
        outcome.appendChild(document.createTextNode(
          e.award.standing === 'revoked' ? T.awardWithdrawn : T.awardSuperseded));
      } else {
        outcome.appendChild(document.createTextNode(e.status === 'active' ? T.inProgress : T.entered));
      }
      tr.appendChild(outcome);
      body.appendChild(tr);
    });
    show('#secTranscript');
  }

  // --- Competencies ---------------------------------------------------
  function renderCompetencies(c) {
    var cNote = pick(c.note, c.noteAr) || '';
    $('#competencyNote').textContent = cNote;
    $('#competencyNote').hidden = !cNote;
    var list = $('#competencies');
    list.textContent = '';
    c.competencies.forEach(function (x) {
      var li = el('li', 'grad-competency');
      var main = el('div');
      main.appendChild(el('p', 'grad-competency__name', pick(x.name, x.nameAr)));
      main.appendChild(el('p', 'grad-competency__what', pick(x.description, x.descriptionAr)));
      li.appendChild(main);
      // The whole reason this branch exists. `mark === null` is not 0.
      li.appendChild(x.mark === null
        ? el('span', 'grad-competency__mark', T.notAssessed)
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
      list.appendChild(el('li', 'grad-cpd__empty', T.noCpd));
    }
    cpd.records.forEach(function (r) {
      var li = document.createElement('li');
      li.appendChild(named('p', 'grad-cpd__title', r.title));
      var meta = el('p', 'grad-cpd__meta');
      // Declared and verified must never look the same. An unverified
      // entry rendered identically would be the graduate's word set in
      // the College's typeface.
      meta.appendChild(el('span', 'grad-badge ' + (r.verified ? 'grad-badge--verified' : 'grad-badge--declared'),
        r.verified ? T.verified : T.selfDeclared));
      // A provider's name may be in either language, and the hours are
      // a Latin numeral either way: each fact stands on its own.
      facts(meta, [r.provider, r.kind, r.hours ? T.hours(r.hours) : null, fmtDate(r.completedOn)]);
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
    var sNote = pick(sk.note, sk.noteAr) || '';
    $('#skillNote').textContent = sNote;
    $('#skillNote').hidden = !sNote;
    var list = $('#skills');
    list.textContent = '';
    sk.skills.forEach(function (x) {
      var li = el('li', 'grad-skill');
      var main = el('div');
      main.appendChild(el('p', 'grad-skill__name', pick(x.name, x.nameAr)));
      main.appendChild(el('p', 'grad-skill__what', pick(x.description, x.descriptionAr)));
      main.appendChild(el('p', 'grad-skill__mode',
        x.mode === 'receptive' ? T.receptive : T.productive));
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
        li.appendChild(el('span', 'grad-skill__mark', T.notAssessed));
      } else {
        var box = el('div', 'grad-skill__value');
        box.appendChild(el('span', 'grad-skill__mark is-marked',
          pick(x.descriptor.name, x.descriptor.nameAr)));
        if (x.descriptor.description) {
          box.appendChild(el('span', 'grad-skill__band',
            pick(x.descriptor.description, x.descriptor.descriptionAr)));
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
      host.appendChild(el('h3', 'grad-dgroup', pick(group.label, group.labelAr)));
      var ul = el('ul', 'grad-distinctions');
      group.items.forEach(function (i) {
        var li = el('li', 'grad-distinction' + (i.status === 'withdrawn' ? ' is-withdrawn' : ''));
        li.appendChild(named('p', 'grad-distinction__title', i.title));
        var meta = el('p', 'grad-distinction__meta');
        if (i.status === 'withdrawn') {
          meta.appendChild(el('span', 'grad-badge grad-badge--withdrawn', T.withdrawn));
        }
        facts(meta, [i.awardedBy,
          i.level ? T.level(pick(i.level.roman, i.level.ordinalAr)) : null,
          fmtDate(i.awardedOn)]);
        li.appendChild(meta);
        if (i.summary) li.appendChild(prose('p', 'grad-distinction__what', i.summary));
        // A withdrawal without its reason invites the reader to assume
        // the worst available explanation, which is usually not the one.
        if (i.withdrawnReason) {
          var why = el('p', 'grad-distinction__why');
          why.appendChild(document.createTextNode(T.withdrawnReason('')));
          why.appendChild(bdi(i.withdrawnReason));
          li.appendChild(why);
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
      // The values are a register code, an award's formal title and a
      // post-nominal — Latin on both editions. Each takes its own
      // direction rather than the panel's.
      dl.appendChild(named('dd', cls || null, value));
    }
    fact(T.registerNumber, a.verificationCode, 'grad-facts__code');
    fact(T.award, a.title);
    fact(T.postNominal, a.postNominal);
    fact(T.cefrLevel, a.cefr);
    fact(T.conferred, fmtDate(a.conferredOn));
    fact(T.standing, T.conferredCurrent);

    // The URL a reader can type, and the URL inside the QR: the same
    // one. A QR that went somewhere the page did not name would be
    // asking for trust the panel exists to avoid needing.
    var url = location.origin + (AR ? '/ar/verify.html?code=' : '/verify.html?code=')
      + encodeURIComponent(a.verificationCode);
    // An address is Latin on both editions, and a slash is a neutral
    // character: unisolated, the Arabic around it reorders the path.
    var link = named('a', 'grad-verify__link', url.replace(/^https?:\/\//, ''));
    link.href = url;
    dl.appendChild(el('dt', null, T.checkThis));
    var dd = document.createElement('dd');
    dd.appendChild(link);
    dl.appendChild(dd);

    $('#verifyNote').textContent = T.verifyNote;

    // The QR is drawn by the server, which is where the encoder lives —
    // and it is fetched rather than assumed, so a failure leaves the
    // typed URL above rather than a broken image beside a promise.
    var box = $('#qrBox');
    fetch('/api/credentials/qr?code=' + encodeURIComponent(a.verificationCode)
      + (AR ? '&lang=ar' : ''))
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
        $('#qrCaption').textContent = T.scanToVerify;
      })
      .catch(function () { box.hidden = true; });

    show('#secVerify');
  }

  // --- Assemble -------------------------------------------------------
  function render(p) {
    // The record region is served carrying "Loading this record…" so
    // that its box exists at first paint and the page does not jump
    // when an answer arrives. The moment there IS a record, the
    // waiting message has done its work and must go.
    $('#state').textContent = '';
    $('#name').textContent = p.displayName || p.handle || T.fallbackName;
    $('#name').setAttribute('dir', 'auto');   // a graduate's name is their own
    if (p.headline) {
      $('#headline').textContent = p.headline;
      $('#headline').setAttribute('dir', 'auto');
    }
    document.title = (p.displayName || T.fallbackName) + T.titleSuffix;

    if (p.biography) {
      $('#biography').textContent = p.biography;
      $('#biography').setAttribute('dir', 'auto');
      show('#secBiography');
    }
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
      $('#withheld').textContent = T.withheldSentence(joinNames(withheld));
      show('#withheldBox');
    }

    $('#scopeNote').textContent = p.audience === 'share' ? T.scopeShare : T.scopePublic;
  }

  function load() {
    var params = new URLSearchParams(location.search);
    var handle = params.get('handle');
    var share = params.get('share');

    if (!handle && !share) {
      $('#scopeNote').textContent = '';
      state(T.noneRequested[0], T.noneRequested[1]);
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
            state(T.linkGone[0], T.linkGone[1]);
            return;
          }
          render(res.d.profile);
          return;
        }
        if (!res.ok) {
          state(T.noRecord[0], T.noRecord[1]);
          return;
        }
        render(res.d);
      })
      .catch(function () {
        $('#scopeNote').textContent = '';
        state(T.failed[0], T.failed[1]);
      });
  }

  document.addEventListener('DOMContentLoaded', load);
})();
