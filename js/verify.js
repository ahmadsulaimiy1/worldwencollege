/* WEC — Award Verification.

   Opened most often by a stranger: an employer, an admissions officer, a
   registrar, arriving from a QR code on a printed certificate. They have
   never seen the College before and will spend about eight seconds
   deciding whether this page is real.

   So three rules govern everything here:

   1. NO SIGN-IN, EVER. A credential that makes the checker register is
      one nobody checks. The endpoint is public and no identifying
      information about the checker is sent or stored.

   2. EVERY ANSWER IS AN ANSWER. "Withdrawn" and "no such code" are not
      errors — they are true replies to a fair question, and they are
      presented as findings rather than as failures. A page that looked
      broken when an award had been withdrawn would let a revoked
      certificate pass as merely unlucky.

   3. NEVER COLOUR ALONE. The standing is spelled out in words inside the
      band. Roughly one man in twelve cannot rely on the colour, and this
      card is routinely photographed, printed and photocopied.
*/
(function () {
  'use strict';
  var $ = function (s) { return document.querySelector(s); };

  /* ── THIS PAGE SPEAKS THE EDITION IT IS SERVED IN ───────────────────
   *
   * It did not. /ar/verify.html served an Arabic form and an Arabic card
   * and then filled both with English: "Verified — award in good
   * standing", "Level III — Intermediate Programme", seven paragraphs
   * about hash chains, and "Enter the verification code printed on the
   * certificate." This is the page an Arabic employer reaches from a QR
   * code on a printed certificate, with about eight seconds to decide
   * whether the College is real.
   *
   * The same two rules as everywhere else on this site:
   *
   *   1. What the PAGE says is here, in both languages.
   *   2. What the REGISTER says arrives in both languages —
   *      `honourLabelAr`, `level.nameAr`, `labelAr`, `statementAr` — and
   *      pick() selects. The page never translates a published fact.
   */
  var AR = document.documentElement.lang === 'ar';
  var LOCALE = AR ? 'ar' : 'en-GB';
  var VERIFY_PATH = AR ? '/ar/verify.html?code=' : '/verify.html?code=';

  function pick(en, ar) { return (AR && ar) ? ar : en; }

  /* Isolate a value dropped into a sentence, in plain text: U+2068 FIRST
     STRONG ISOLATE … U+2069 POP DIRECTIONAL ISOLATE, which is what <bdi>
     compiles to. A withdrawal reason is written by a person and may be
     in either language; unisolated, an English reason inside an Arabic
     sentence puts its own full stop at the wrong end. The register
     composes its sentences the same way — see
     functions/_lib/registry/institutional-verification.js. */
  function iso(v) { return '\u2068' + v + '\u2069'; }

  var T = AR ? {
    noDate: 'تاريخ غير مسجَّل',
    hours: function (n) { return n + ' ساعة'; },
    level: function (a) { return 'المستوى ' + a.ord + ' — ' + a.name; },
    notVerified: 'تعذّر التحقّق من هذا الرمز. راجعه في الشهادة.',
    enterCode: 'أدخل رمز التحقّق المطبوع على الشهادة.',
    unreachable: 'تعذّر بلوغ السجل. هذا خلل عندنا — أعد المحاولة بعد قليل.',
    states: {
      verified: 'مُتحقَّق منه',
      failed: 'غير متحقَّق منه',
      not_applicable: 'لا ينطبق',
      unavailable: 'تعذّر فحصه',
      development: 'توقيع تطويري',
    },
    meaningTitle: function (d) {
      return ' (' + iso(d.postNominal) + ' \u00B7 الإطار الأوروبي ' + d.cefr + ')';
    },
    // The College's own published ruling, on every Arabic level page:
    // the award's official title is published in English and explained
    // in Arabic beside it, because translating the title would create a
    // second award nobody defined and nobody can confer. The same
    // reasoning governs the definition below it, which is transcribed
    // verbatim from the award architecture.
    definitionNote: 'عنوان الشهادة الرسمي وتعريفها منشوران بالإنجليزية، لأنّ ترجمتهما '
      + 'تُنشئ شهادةً ثانية لم يعرّفها أحد. وشرح الشهادة بالعربية منشور في صفحة مستواها.',
    definitionLink: 'اقرأ شرح هذا المستوى بالعربية',
  } : {
    noDate: 'an unrecorded date',
    hours: function (n) { return n + ' hours'; },
    level: function (a) { return 'Level ' + a.ord + ' — ' + a.name; },
    notVerified: 'That code could not be verified. Check it against the certificate.',
    enterCode: 'Enter the verification code printed on the certificate.',
    unreachable: 'The Register could not be reached. This is a fault on our side — please try again shortly.',
    states: {
      verified: 'Verified',
      failed: 'Not verified',
      not_applicable: 'Not applicable',
      unavailable: 'Could not be checked',
      development: 'Development signature',
    },
    meaningTitle: function (d) {
      return ' (' + iso(d.postNominal) + ' \u00B7 CEFR ' + d.cefr + ')';
    },
    definitionNote: null,
    definitionLink: null,
  };

  var STANDING = {
    valid: {
      cls: 'is-valid',
      label: 'Verified — award in good standing',
      labelAr: 'مُتحقَّق منها — شهادة قائمة',
      alert: null,
    },
    revoked: {
      cls: 'is-revoked',
      label: 'Withdrawn — this award is no longer held',
      labelAr: 'مسحوبة — لم تعد هذه الشهادة قائمة',
      alert: function (a) {
        if (AR) {
          return 'سحبت الكلية العالمية للغة الإنجليزية هذه الشهادة في '
            + iso(fmtDate(a.revokedAt)) + '.'
            + (a.revokedReason ? ' والسبب المقيَّد: ' + iso(a.revokedReason) : '')
            + ' فلا يُعتمد عليها.';
        }
        return 'This award was withdrawn by Worldwide English College on '
          + iso(fmtDate(a.revokedAt)) + '.'
          + (a.revokedReason ? ' Reason recorded: ' + iso(a.revokedReason) : '')
          + ' It should not be relied upon.';
      },
    },
    replaced: {
      cls: 'is-replaced',
      label: 'Superseded — a corrected certificate has been issued',
      labelAr: 'مُستبدَلة — صدرت شهادة مصوَّبة',
      alert: function (a) {
        if (AR) {
          return 'استُبدلت هذه الشهادة بأخرى مصوَّبة'
            + (a.revokedAt ? ' في ' + iso(fmtDate(a.revokedAt)) : '') + '.'
            + (a.replacementCode
              ? ' والسجل القائم هو ' + iso(a.replacementCode) + '.'
              : ' والسجل القائم عند الكلية.');
        }
        return 'This certificate has been replaced by a corrected one'
          + (a.revokedAt ? ' on ' + iso(fmtDate(a.revokedAt)) : '') + '.'
          + (a.replacementCode
            ? ' The current record is ' + iso(a.replacementCode) + '.'
            : ' The College holds the current record.');
      },
    },
  };

  // Every value that reaches this page goes through textContent. A
  // verification page renders a stranger's name and a College's own
  // statements side by side, and the difference between "a name with an
  // angle bracket in it" and an attack only exists if the page never
  // gives it the chance to be the second.
  function el(tag, cls, text) {
    var n = document.createElement(tag);
    if (cls) n.className = cls;
    if (text !== undefined && text !== null && text !== '') n.textContent = text;
    return n;
  }

  /* A run of Latin text that must not be reordered by the Arabic around
     it — a register code, an award's official title, an address. */
  function bdi(text) {
    var n = document.createElement('bdi');
    n.textContent = String(text);
    return n;
  }

  /** Replace an element's text with one isolated run. */
  function setIsolated(sel, text) {
    var n = $(sel);
    n.textContent = '';
    if (text !== undefined && text !== null && text !== '') n.appendChild(bdi(text));
  }

  /* A block of the award's own English definition, on either edition.
     On the Arabic one it is marked as English so a screen reader
     announces it in the right voice and the bidirectional algorithm
     lays it out as English rather than as a run inside Arabic. */
  function englishBlock(sel, text) {
    var n = $(sel);
    n.textContent = text || '';
    if (AR) { n.setAttribute('lang', 'en'); n.setAttribute('dir', 'ltr'); }
  }

  /* Said once, above the definition, and only on the Arabic edition:
     why this part of the page is in English, and where the College's
     Arabic account of the same award is published. */
  function noteTheEnglish(levelId) {
    var host = $('#meaningNote');
    if (!host) return;
    host.textContent = '';
    if (!AR || !T.definitionNote) { host.hidden = true; return; }
    host.appendChild(document.createTextNode(T.definitionNote));
    if (levelId) {
      host.appendChild(document.createTextNode(' '));
      var a = document.createElement('a');
      a.href = '/ar/study/level-' + levelId + '/';
      a.textContent = T.definitionLink;
      host.appendChild(a);
    }
    host.hidden = false;
  }

  function fmtDate(iso) {
    if (!iso) return T.noDate;
    var d = new Date(iso.length === 10 ? iso + 'T00:00:00Z' : iso);
    if (isNaN(d.getTime())) return iso;
    try {
      return d.toLocaleDateString(LOCALE, { day: 'numeric', month: 'long', year: 'numeric', timeZone: 'UTC' });
    } catch (e) { return iso.slice(0, 10); }
  }

  function show(result) {
    var a = result.award;
    var card = $('#card');
    var standing = STANDING[result.outcome];

    if (!a || !standing) {
      // Not found or malformed. Reported in the form's own error slot
      // rather than as an empty card: there is no record to display, and
      // a blank card would imply there is one but that something failed.
      $('#result').hidden = true;
      $('#codeError').textContent = result.message || T.notVerified;
      return;
    }

    $('#codeError').textContent = '';
    card.className = 'vfy-card ' + standing.cls;
    $('#status').textContent = pick(standing.label, standing.labelAr);

    // A graduate's name and the award's official title are not the
    // page's language and may not be either edition's: isolated, and
    // given their own direction, so an Arabic card cannot land an
    // English full stop at the wrong end of a name.
    $('#holder').textContent = a.holderName;
    $('#holder').setAttribute('dir', 'auto');
    setIsolated('#awardTitle', a.awardTitle);
    setIsolated('#postNominal', a.postNominal || '');

    $('#fLevel').textContent = T.level({
      ord: pick(a.level.roman, a.level.ordinalAr),
      name: pick(a.level.name, a.level.nameAr),
    });
    $('#fCefr').textContent = a.cefr;
    $('#fHonour').textContent = pick(a.honourLabel, a.honourLabelAr);
    $('#fCredits').textContent = a.credits;
    $('#fTqt').textContent = T.hours(a.tqtHours);
    $('#fDate').textContent = fmtDate(a.conferredOn);

    var cite = $('#citation');
    cite.hidden = !a.citation;
    cite.textContent = a.citation || '';
    cite.setAttribute('dir', 'auto');

    var alert = $('#alert');
    if (standing.alert) {
      alert.hidden = false;
      alert.className = 'vfy-alert' + (result.outcome === 'replaced' ? ' is-replaced' : '');
      alert.textContent = standing.alert(a);
    } else {
      alert.hidden = true;
    }

    setIsolated('#codeOut', a.verificationCode);
    // The digest is shown truncated. In full it is unreadable noise on a
    // card; truncated it is enough for someone who has been given the
    // record to compare, and the full value is in the API for anyone
    // who actually needs it.
    setIsolated('#digest', (a.digest || '').slice(0, 16) + '…');

    // The permalink is the edition the reader is in. The QR below it is
    // NOT: a printed certificate carries one code for the life of the
    // award, and a code that resolved differently depending on who drew
    // the image would be two credentials wearing one number. Only the
    // label a screen reader announces follows the reader.
    var link = location.origin + VERIFY_PATH + encodeURIComponent(a.verificationCode);
    $('#permalink').href = link;
    setIsolated('#permalink', link);
    drawQr($('#qr'), a.verificationCode);

    $('#result').hidden = false;
    // Move focus to the result rather than scrolling silently: a screen
    // reader user who submitted the form has to be told something
    // happened, and aria-live alone would read the card out of order.
    $('#status').setAttribute('tabindex', '-1');
    $('#status').focus({ preventScroll: true });
    $('#result').scrollIntoView({
      behavior: window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth',
      block: 'nearest',
    });
  }

  /* The QR, fetched from the College's own encoder.
     Written as a stub for a long time because a QR that does not scan
     fails in front of an employer holding a phone. It is real now:
     functions/_lib/registry/qr.js is verified against jsQR — an
     independently written decoder — across every version and
     error-correction level, so this draws a code that has been proven
     to read rather than one that merely looks like one.

     Fetched rather than assumed. If the request fails the box stays
     hidden and the permalink below carries the same record, which is
     the state this page shipped in for months and is still correct. */
  function drawQr(host, code) {
    if (!code) { host.hidden = true; return; }
    fetch('/api/credentials/qr?code=' + encodeURIComponent(code) + (AR ? '&lang=ar' : ''))
      .then(function (r) { return r.ok ? r.text() : Promise.reject(new Error(String(r.status))); })
      .then(function (svg) {
        // Parsed as a document, not assigned as markup: a future change
        // to that endpoint must not become a script-injection route
        // into the page an employer is reading.
        var doc = new DOMParser().parseFromString(svg, 'image/svg+xml');
        if (doc.querySelector('parsererror')
            || doc.documentElement.nodeName.toLowerCase() !== 'svg') { host.hidden = true; return; }
        host.textContent = '';
        host.appendChild(document.importNode(doc.documentElement, true));
        host.hidden = false;
      })
      .catch(function () { host.hidden = true; });
  }

  function submit(e) {
    if (e) e.preventDefault();
    var raw = $('#code').value.trim();
    if (!raw) {
      $('#codeError').textContent = T.enterCode;
      $('#code').focus();
      return;
    }
    var btn = $('.vfy-submit');
    btn.setAttribute('aria-busy', 'true');
    $('#codeError').textContent = '';

    var via = new URLSearchParams(location.search).get('via');
    // The institutional endpoint answers across all three layers AND
    // carries the certificate view the card already renders, so one
    // request serves both. Verification is a single act; two requests
    // could report two different standings if a withdrawal landed
    // between them.
    fetch('/api/verify/institutional/' + encodeURIComponent(raw) + (via === 'qr' ? '?via=qr' : ''), {
      headers: { Accept: 'application/json' },
    })
      .then(function (r) { return r.json(); })
      .then(function (d) {
        // The card speaks the older shape. Adapting here rather than
        // rewriting it keeps thirty-nine assertions about the card
        // meaningful and testing the same thing they always did.
        show({ outcome: d.outcome, award: d.award, message: d.message, signature: null });
        renderLayers(d);
      })
      .catch(function () {
        $('#result').hidden = true;
        $('#codeError').textContent = T.unreachable;
      })
      .then(function () { btn.removeAttribute('aria-busy'); });
  }

  // --- The three layers ------------------------------------------------
  // Rendered as three separate lists, never merged and never scored
  // against each other. A verifier reading "6 of 7 passed" learns
  // nothing; a verifier reading "identity verified, integrity verified,
  // standing WITHDRAWN" knows exactly what they are holding.
  var STATE_LABEL = T.states;

  function renderChecks(hostId, checks) {
    var host = $(hostId);
    host.textContent = '';
    checks.forEach(function (c) {
      var li = el('li', 'vfy-check vfy-check--' + c.state);
      var head = el('div', 'vfy-check__head');
      head.appendChild(el('span', 'vfy-check__label', pick(c.label, c.labelAr)));
      head.appendChild(el('span', 'vfy-check__state', STATE_LABEL[c.state] || c.state));
      li.appendChild(head);
      // Every status carries its explanation with it, so a verifier
      // never has to guess what was and was not checked.
      li.appendChild(el('p', 'vfy-check__what', pick(c.statement, c.statementAr)));
      // The detail is usually a code, a count or a key id — isolated,
      // because a hyphenated Latin token in an Arabic line reorders.
      if (c.detail) {
        var d = el('p', 'vfy-check__detail');
        d.appendChild(bdi(pick(c.detail, c.detailAr)));
        li.appendChild(d);
      }
      host.appendChild(li);
    });
  }

  function renderLayers(d) {
    if (!d || !d.layers) { $('#layers').hidden = true; $('#meaning').hidden = true; return; }

    $('#summaryHeadline').textContent = pick(d.summary.headline, d.summary.headlineAr);
    // Coloured from the machine answer, never from the sentence. This
    // used to compare the headline against the literal string
    // "Verified", which silently painted every Arabic verification as a
    // warning the moment the headline was translated.
    $('#summaryHeadline').className = 'is-' + (d.summary.verdict === 'verified' ? 'ok' : 'warn');
    $('#summaryStatement').textContent = pick(d.summary.statement, d.summary.statementAr);
    renderChecks('#checksIdentity', d.layers.identity);
    renderChecks('#checksIntegrity', d.layers.integrity);
    renderChecks('#checksStanding', d.layers.standing);
    $('#layers').hidden = false;

    if (d.definition) {
      var mt = $('#mTitle');
      mt.textContent = '';
      mt.appendChild(bdi(d.definition.officialTitle));
      mt.appendChild(document.createTextNode(T.meaningTitle(d.definition)));
      // THE DEFINITION IS ENGLISH ON BOTH EDITIONS, AND SAYS SO.
      //
      // It is transcribed verbatim from docs/iefc-award-architecture.md
      // and docs/curriculum-framework.md, and tests/award-definitions
      // fails the build if a word of it drifts. Translating it here
      // would create a second authoritative text that no document
      // governs — the same reason /ar/study/level-3/ publishes the
      // award's title in English and explains it in Arabic beside it,
      // rather than translating it. So on the Arabic edition it is
      // marked as English, and the reader is sent to the Arabic account
      // of the level, which the College does publish.
      englishBlock('#mStanding', d.definition.standing);
      englishBlock('#mPurpose', d.definition.academicPurpose);
      englishBlock('#mProfile', d.definition.graduateProfile);
      englishBlock('#mOutcomes', d.definition.learningOutcomes);
      noteTheEnglish(d.award && d.award.level ? d.award.level.id : null);
      $('#meaning').hidden = false;
    } else {
      $('#meaning').hidden = true;
    }
  }

  document.addEventListener('DOMContentLoaded', function () {
    $('#verifyForm').addEventListener('submit', submit);

    // A code in the URL verifies immediately. This is the QR path: a
    // scan should show the record, not a form the scanner has to fill in
    // from the certificate they are holding.
    var prefill = new URLSearchParams(location.search).get('code');
    if (prefill) { $('#code').value = prefill; submit(); }
  });
})();
