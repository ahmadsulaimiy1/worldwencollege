/* AIPC — Award Verification.

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

  var STANDING = {
    valid: {
      cls: 'is-valid',
      label: 'Verified — award in good standing',
      alert: null,
    },
    revoked: {
      cls: 'is-revoked',
      label: 'Withdrawn — this award is no longer held',
      alert: function (a) {
        return 'This award was withdrawn by Albalagh International Premium College on '
          + fmtDate(a.revokedAt) + '.'
          + (a.revokedReason ? ' Reason recorded: ' + a.revokedReason : '')
          + ' It should not be relied upon.';
      },
    },
    replaced: {
      cls: 'is-replaced',
      label: 'Superseded — a corrected certificate has been issued',
      alert: function (a) {
        return 'This certificate has been replaced by a corrected one'
          + (a.revokedAt ? ' on ' + fmtDate(a.revokedAt) : '') + '.'
          + (a.replacementCode
            ? ' The current record is ' + a.replacementCode + '.'
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

  function fmtDate(iso) {
    if (!iso) return 'an unrecorded date';
    var d = new Date(iso.length === 10 ? iso + 'T00:00:00Z' : iso);
    if (isNaN(d.getTime())) return iso;
    return d.toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric', timeZone: 'UTC' });
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
      $('#codeError').textContent = result.message
        || 'That code could not be verified. Check it against the certificate.';
      return;
    }

    $('#codeError').textContent = '';
    card.className = 'vfy-card ' + standing.cls;
    $('#status').textContent = standing.label;

    $('#holder').textContent = a.holderName;
    $('#awardTitle').textContent = a.awardTitle;
    $('#postNominal').textContent = a.postNominal || '';

    $('#fLevel').textContent = 'Level ' + a.level.roman + ' — ' + a.level.name;
    $('#fCefr').textContent = a.cefr;
    $('#fHonour').textContent = a.honourLabel;
    $('#fCredits').textContent = a.credits;
    $('#fTqt').textContent = a.tqtHours + ' hours';
    $('#fDate').textContent = fmtDate(a.conferredOn);

    var cite = $('#citation');
    cite.hidden = !a.citation;
    cite.textContent = a.citation || '';

    var alert = $('#alert');
    if (standing.alert) {
      alert.hidden = false;
      alert.className = 'vfy-alert' + (result.outcome === 'replaced' ? ' is-replaced' : '');
      alert.textContent = standing.alert(a);
    } else {
      alert.hidden = true;
    }

    $('#codeOut').textContent = a.verificationCode;
    // The digest is shown truncated. In full it is unreadable noise on a
    // card; truncated it is enough for someone who has been given the
    // record to compare, and the full value is in the API for anyone
    // who actually needs it.
    $('#digest').textContent = (a.digest || '').slice(0, 16) + '…';

    var link = location.origin + '/verify.html?code=' + encodeURIComponent(a.verificationCode);
    $('#permalink').href = link;
    $('#permalink').textContent = link;
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
    fetch('/api/credentials/qr?code=' + encodeURIComponent(code))
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
      $('#codeError').textContent = 'Enter the verification code printed on the certificate.';
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
        $('#codeError').textContent = 'The Register could not be reached. This is a fault on our side — please try again shortly.';
      })
      .then(function () { btn.removeAttribute('aria-busy'); });
  }

  // --- The three layers ------------------------------------------------
  // Rendered as three separate lists, never merged and never scored
  // against each other. A verifier reading "6 of 7 passed" learns
  // nothing; a verifier reading "identity verified, integrity verified,
  // standing WITHDRAWN" knows exactly what they are holding.
  var STATE_LABEL = {
    verified: 'Verified',
    failed: 'Not verified',
    not_applicable: 'Not applicable',
    unavailable: 'Could not be checked',
    development: 'Development signature',
  };

  function renderChecks(hostId, checks) {
    var host = $(hostId);
    host.textContent = '';
    checks.forEach(function (c) {
      var li = el('li', 'vfy-check vfy-check--' + c.state);
      var head = el('div', 'vfy-check__head');
      head.appendChild(el('span', 'vfy-check__label', c.label));
      head.appendChild(el('span', 'vfy-check__state', STATE_LABEL[c.state] || c.state));
      li.appendChild(head);
      // Every status carries its explanation with it, so a verifier
      // never has to guess what was and was not checked.
      li.appendChild(el('p', 'vfy-check__what', c.statement));
      if (c.detail) li.appendChild(el('p', 'vfy-check__detail', c.detail));
      host.appendChild(li);
    });
  }

  function renderLayers(d) {
    if (!d || !d.layers) { $('#layers').hidden = true; $('#meaning').hidden = true; return; }

    $('#summaryHeadline').textContent = d.summary.headline;
    $('#summaryHeadline').className = 'is-' + (d.summary.headline === 'Verified' ? 'ok' : 'warn');
    $('#summaryStatement').textContent = d.summary.statement;
    renderChecks('#checksIdentity', d.layers.identity);
    renderChecks('#checksIntegrity', d.layers.integrity);
    renderChecks('#checksStanding', d.layers.standing);
    $('#layers').hidden = false;

    if (d.definition) {
      $('#mTitle').textContent = d.definition.officialTitle
        + ' (' + d.definition.postNominal + ' \u00B7 CEFR ' + d.definition.cefr + ')';
      $('#mStanding').textContent = d.definition.standing;
      $('#mPurpose').textContent = d.definition.academicPurpose;
      $('#mProfile').textContent = d.definition.graduateProfile;
      $('#mOutcomes').textContent = d.definition.learningOutcomes;
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
