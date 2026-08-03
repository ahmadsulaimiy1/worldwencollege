/* WEC-LC — Award Verification.

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
        return 'This award was withdrawn by Worldwide English College on '
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
    drawQr($('#qr'), link);

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

  /* QR rendering is DESIGNED AND NOT YET IMPLEMENTED, and the page says
     so rather than showing a placeholder.

     Two honest reasons it is not here yet. A QR image fetched from a
     third-party service would tell that service which awards are being
     checked — exactly the information this portal promises not to
     collect, so that route is closed permanently rather than
     temporarily. And a locally-drawn encoder could be written, but it
     could not be VERIFIED from the environment this was built in: there
     is no way to scan the output and confirm it decodes. An unscannable
     QR printed on a certificate is worse than none, because the failure
     appears years later, in someone else's hands.

     What a QR would encode is the permalink, which is shown in full
     immediately below it. Nothing is lost but a convenience, and the
     convenience returns when it can be tested on real devices. */
  function drawQr(host) {
    host.hidden = true;
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
    fetch('/api/verify/' + encodeURIComponent(raw) + (via === 'qr' ? '?via=qr' : ''), {
      headers: { Accept: 'application/json' },
    })
      .then(function (r) { return r.json(); })
      .then(show)
      .catch(function () {
        $('#result').hidden = true;
        $('#codeError').textContent = 'The Register could not be reached. This is a fault on our side — please try again shortly.';
      })
      .then(function () { btn.removeAttribute('aria-busy'); });
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
