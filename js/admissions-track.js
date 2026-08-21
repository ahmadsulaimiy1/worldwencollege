/* WEC-LC — Track your application.

   The interface for GET /api/admissions/track and for the applicant's
   half of POST /api/admissions/offer. Both take an application
   reference as a bearer credential and neither takes a session, because
   an account is created at enrolment rather than at application and the
   College's own /admissions/ page has published that the reference "is
   the only key to your record, and it is deliberately the only key".

   ─────────────────────────────────────────────────────────────────────
   FOUR RULES, AND THE PAGE IS MOSTLY THEM
   ─────────────────────────────────────────────────────────────────────

   1. THE REFERENCE NEVER TOUCHES HISTORY, STORAGE OR A LOG. It goes in
      the request body or the query and nowhere else: no history.replaceState,
      no localStorage, no ?ref= left in the address bar after a lookup.
      A bearer credential in a URL is a bearer credential in a browser
      history, in a shared screenshot and in every proxy between here and
      there. The one place it is written back is the input the applicant
      typed it into.

   2. EVERY ANSWER IS AN ANSWER. A closed application, a lapsed offer and
      a declined one are true replies to a fair question and are rendered
      as findings, not as failures. Only an unknown reference goes to the
      form's error slot, and it gets the endpoint's own words — which are
      deliberately identical for "no such application" and "malformed",
      so this page must not helpfully distinguish them.

   3. NOTHING IS INTERPOLATED. Every value reaches the page through
      textContent. The payload carries no name and no email address by
      design, but it does carry free text a person typed into a `reason`,
      and the difference between that and an attack only exists if the
      page never builds HTML from it.

   4. THE ANSWER BUTTONS DISABLE ON THE WAY OUT AND STAY DISABLED ON THE
      WAY BACK. Accepting an offer twice is refused by the server, but a
      second click that produces a second refusal reads as the first one
      having failed, and an applicant who thinks their acceptance failed
      emails Admissions about it.

   Requires nothing but the DOM. No auth, no Clerk, no api-auth.
*/
(function () {
  'use strict';

  var $ = function (s) { return document.querySelector(s); };
  var AR = document.documentElement.lang === 'ar';
  var LOCALE = AR ? 'ar' : 'en-GB';

  var T = AR ? {
    tracking: 'جارٍ التتبّع…',
    track: 'تتبّع',
    needRef: 'أدخِل رقم طلبك. وهو يبدأ بـ app_ وقد أُرسل إليك كتابةً حين أرسلت النموذج.',
    failed: 'تعذّر إتمام التتبّع. أعد المحاولة بعد قليل، فإن تكرّر فاكتب إلى القبول.',
    you: 'أنت',
    college: 'الكلية',
    platform: 'النظام',
    nobody: 'لا أحد',
    stageOf: function (n, of) { return 'المرحلة ' + n + ' من ' + of; },
    closedStage: 'هذا الطلب مغلق',
    closedTitle: 'طلب مغلق',
    submitted: 'أرسلتَ النموذج',
    unrecorded: 'تاريخ غير مسجَّل',
    conditional: 'عرض مشروط',
    unconditional: 'عرض غير مشروط',
    accepting: 'جارٍ القبول…',
    declining: 'جارٍ الرفض…',
    accepted: 'قبلتَ هذا العرض. وما يأتي بعدُ مذكور أعلاه.',
    declined: 'رفضتَ هذا العرض، وأُغلق هذا الطلب. وبابُ التقدّم من جديد مفتوح لك في أي وقت.',
    lapsed: 'انقضى موعد الردّ على هذا العرض. اكتب إلى القبول إن كنت لا تزال تريد مكانًا؛ فانقضاء الموعد لا يمنعك من التقدّم ثانية.',
    withdrawn: 'سُحب هذا العرض.',
    answeredAlready: 'أُجيب عن هذا العرض.',
    levelWord: function (n) { return 'المستوى ' + n; },
    standing: {
      issued: 'مفتوح لردّك',
      accepted: 'قبلتَه',
      declined: 'رفضتَه',
      lapsed: 'انقضى موعده',
      withdrawn: 'سحبته الكلية',
    },
  } : {
    tracking: 'Tracking…',
    track: 'Track',
    needRef: 'Enter your application reference. It begins with app_ and was sent to you in writing when you submitted the form.',
    failed: 'The lookup could not be completed. Try again shortly, and if it keeps happening write to Admissions.',
    you: 'you',
    college: 'the College',
    platform: 'the platform',
    nobody: 'nobody',
    stageOf: function (n, of) { return 'Stage ' + n + ' of ' + of; },
    closedStage: 'This application is closed',
    closedTitle: 'A closed application',
    submitted: 'You submitted the form',
    unrecorded: 'an unrecorded date',
    conditional: 'A conditional offer',
    unconditional: 'An unconditional offer',
    accepting: 'Accepting…',
    declining: 'Declining…',
    accepted: 'You accepted this offer. What follows is set out above.',
    declined: 'You declined this offer and this application is closed. Applying again is open to you at any time.',
    lapsed: 'The date for answering this offer has passed. Write to Admissions if you still want a place — a lapsed offer does not stop you applying again.',
    withdrawn: 'This offer was withdrawn.',
    answeredAlready: 'This offer has been answered.',
    levelWord: function (n) { return 'Level ' + n; },
    standing: {
      issued: 'Open for your answer',
      accepted: 'Accepted by you',
      declined: 'Declined by you',
      lapsed: 'The date to answer has passed',
      withdrawn: 'Withdrawn by the College',
    },
  };

  var ROMAN = ['', 'I', 'II', 'III', 'IV', 'V', 'VI'];

  /* The party words the endpoint returns are English tokens — 'you',
     'the College', 'the platform', 'nobody' — because they are the
     payload's vocabulary and not its prose. Translating them here rather
     than at the endpoint keeps one API answering both editions. */
  var PARTY = {
    'you': T.you,
    'the College': T.college,
    'the platform': T.platform,
    'nobody': T.nobody,
  };
  function party(word) { return PARTY[word] || word; }

  function fmtDate(iso) {
    if (!iso) return T.unrecorded;
    var d = new Date(iso.length === 10 ? iso + 'T00:00:00Z' : iso);
    if (isNaN(d.getTime())) return iso;
    return d.toLocaleDateString(LOCALE, { day: 'numeric', month: 'long', year: 'numeric', timeZone: 'UTC' });
  }
  function fmtDateTime(iso) {
    if (!iso) return T.unrecorded;
    var d = new Date(iso);
    if (isNaN(d.getTime())) return iso;
    return d.toLocaleDateString(LOCALE, { day: 'numeric', month: 'long', year: 'numeric', timeZone: 'UTC' })
      + ' · ' + d.toLocaleTimeString(LOCALE, { hour: '2-digit', minute: '2-digit', timeZone: 'UTC', hour12: false }) + ' UTC';
  }

  /* The reference as the applicant is likely to have it: pasted out of
     an email with a trailing full stop, retyped in capitals, or wrapped
     in the spaces a mail client added. The server is tolerant of none of
     that — it compares in constant time against the stored value — so
     the tolerance belongs here, before the credential is spent. */
  var UUID_REF = /^app_[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
  function tidy(raw) {
    var v = String(raw || '').trim()
      .replace(/[\s.,;:'"<>()\[\]]+$/g, '')
      .replace(/^[\s'"<(\[]+/g, '')
      .replace(/\s+/g, '');
    /* CASE FOLDED ONLY WHERE IT IS LOSSLESS. newId() is a prefix plus
       crypto.randomUUID(), which is lowercase hex, so a reference
       retyped or auto-capitalised in capitals is the same reference and
       the page can say so honestly. It is NOT folded on anything that is
       not that shape: the platform's own REFERENCE_SHAPE allows
       [A-Za-z0-9_-]{16,64}, and lowercasing a mixed-case identifier
       would silently destroy a credential to keep a promise about
       capitals. The promise is kept where it is true and nowhere else. */
    return UUID_REF.test(v) ? v.toLowerCase() : v;
  }

  /* THE MESSAGE, NEVER THE ERROR CLASS. functions/_lib/db.js answers
     `{ error, message }` where `error` is the exception's NAME —
     "AuthError", "ValidationError" — and `message` is the sentence a
     person was meant to read. Reaching for `error` first put the string
     "AuthError" in front of an applicant whose reference was mistyped,
     which was caught only by rendering the page. */
  function reasonFrom(body) {
    if (!body) return T.failed;
    if (typeof body.message === 'string' && body.message.trim()) return body.message;
    // A bare class name is not a sentence and must not be shown as one.
    if (typeof body.error === 'string' && /\s/.test(body.error)) return body.error;
    return T.failed;
  }

  var els = {};
  var current = null;   // the last successful payload
  var lastRef = null;   // kept in memory only — never stored, never in the URL

  document.addEventListener('DOMContentLoaded', function () {
    els.form = $('#trackForm');
    if (!els.form) return;
    els.input = $('#ref');
    els.submit = els.form.querySelector('.vfy-submit');
    els.error = $('#refError');
    els.result = $('#result');

    els.form.addEventListener('submit', function (e) {
      e.preventDefault();
      lookup(tidy(els.input.value));
    });

    var accept = $('#btnAccept');
    var decline = $('#btnDecline');
    if (accept) accept.addEventListener('click', function () { answer('accept'); });
    if (decline) decline.addEventListener('click', function () { answer('decline'); });

    /* A reference arriving in the address bar — from the confirmation
       email, most likely — is honoured once and then REMOVED from the
       URL before anything else happens, so a back button, a bookmark or
       a screenshot does not carry a credential. */
    var fromUrl = new URLSearchParams(window.location.search).get('ref');
    if (fromUrl) {
      history.replaceState(null, '', window.location.pathname + window.location.hash);
      els.input.value = tidy(fromUrl);
      lookup(tidy(fromUrl));
    }
  });

  function busy(on, label) {
    els.submit.setAttribute('aria-busy', on ? 'true' : 'false');
    els.submit.disabled = !!on;
    els.submit.textContent = on ? (label || T.tracking) : T.track;
  }

  function fail(message) {
    els.error.textContent = message;
    els.result.hidden = true;
  }

  function lookup(ref) {
    els.error.textContent = '';
    if (!ref) { fail(T.needRef); els.input.focus(); return; }

    busy(true);
    fetch('/api/admissions/track?ref=' + encodeURIComponent(ref), {
      headers: { Accept: 'application/json' },
    }).then(function (res) {
      return res.json().then(function (body) { return { ok: res.ok, body: body }; });
    }).then(function (r) {
      busy(false);
      if (!r.ok) {
        // The endpoint's own words. It answers a wrong reference and a
        // malformed one identically on purpose, and a page that guessed
        // which had happened would undo that.
        fail(reasonFrom(r.body));
        return;
      }
      lastRef = ref;
      render(r.body);
    }).catch(function () {
      busy(false);
      fail(T.failed);
    });
  }

  // ── Rendering ──────────────────────────────────────────────────────

  function render(data) {
    current = data;
    els.error.textContent = '';
    els.result.hidden = false;

    renderRail(data.journey || []);
    renderHead(data);
    renderOutstanding(data.outstanding || []);
    renderOffer(data);
    renderTimeline(data.timeline || []);

    var next = data.next || {};
    $('#nextWhat').textContent = next.what
      ? (next.what + (next.who ? ' (' + party(next.who) + ')' : ''))
      : '';

    els.result.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }

  function renderRail(journey) {
    var rail = $('#rail');
    rail.textContent = '';
    journey.forEach(function (stage) {
      var li = document.createElement('li');
      li.className = 'trk-stage trk-stage--' + (stage.state || 'ahead');

      var disc = document.createElement('span');
      disc.className = 'trk-stage__disc';
      disc.textContent = ROMAN[stage.number] || String(stage.number);
      li.appendChild(disc);

      var wrap = document.createElement('span');
      var name = document.createElement('span');
      name.className = 'trk-stage__name';
      name.textContent = stage.title;
      wrap.appendChild(name);

      var who = document.createElement('span');
      who.className = 'trk-stage__who';
      who.textContent = stage.who || '';
      wrap.appendChild(who);
      li.appendChild(wrap);

      // Said in words as well as in the disc, because the state of a
      // stage must not depend on a colour or a scale.
      if (stage.state === 'current') li.setAttribute('aria-current', 'step');
      rail.appendChild(li);
    });
  }

  function renderHead(data) {
    var stage = data.stage;
    $('#stageLabel').textContent = stage
      ? T.stageOf(stage.number, stage.of)
      : T.closedStage;
    $('#stageTitle').textContent = stage ? stage.title : T.closedTitle;

    var full = (data.journey || []).find(function (s) { return s.state === 'current'; });
    $('#stageWhat').textContent = full ? (full.what || '') : '';

    $('#fRef').textContent = data.reference || '—';
    $('#fSubmitted').textContent = fmtDate(data.submittedAt);
    $('#fUpdated').textContent = fmtDate(data.updatedAt);
    $('#fWho').textContent = data.next && data.next.who ? party(data.next.who) : party('nobody');
  }

  function renderOutstanding(items) {
    var sec = $('#secOutstanding');
    var list = $('#outstanding');
    list.textContent = '';
    if (!items.length) { sec.hidden = true; return; }
    sec.hidden = false;

    items.forEach(function (item) {
      var li = document.createElement('li');
      // The English token is the selector hook AND the payload's own
      // vocabulary; the visible word is translated. Styling on the
      // untranslated value keeps one stylesheet serving both editions.
      li.setAttribute('data-who', item.who);

      var who = document.createElement('span');
      who.className = 'trk-owed__who';
      who.textContent = party(item.who);
      li.appendChild(who);

      var body = document.createElement('div');
      var what = document.createElement('p');
      what.className = 'trk-owed__what';
      what.textContent = item.what;
      body.appendChild(what);

      if (item.by) {
        var by = document.createElement('p');
        by.className = 'trk-owed__note';
        by.textContent = (AR ? 'آخر موعد: ' : 'By ') + fmtDate(item.by);
        body.appendChild(by);
      }
      if (item.note) {
        var note = document.createElement('p');
        note.className = 'trk-owed__note';
        note.textContent = item.note;
        body.appendChild(note);
      }
      li.appendChild(body);
      list.appendChild(li);
    });
  }

  function renderOffer(data) {
    var sec = $('#secOffer');
    var offer = data.offer;
    if (!offer) { sec.hidden = true; return; }
    sec.hidden = false;

    $('#offerKind').textContent = offer.kind === 'conditional' ? T.conditional : T.unconditional;
    $('#offerLevel').textContent = offer.levelId
      ? T.levelWord(ROMAN[offer.levelId] || offer.levelId)
      : '—';
    $('#offerIssued').textContent = fmtDate(offer.issuedAt);
    $('#offerExpires').textContent = fmtDate(offer.expiresAt);
    /* The stored word is `issued`, `accepted`, `lapsed`. Those are the
       platform's vocabulary and not a sentence anybody is owed; an
       applicant reading "issued" beside "Standing" learns nothing. An
       unmapped value falls through to itself rather than to a blank,
       because a status this page has not been taught is still a fact. */
    $('#offerStatus').textContent = T.standing[offer.status] || offer.status;

    var cond = $('#offerConditions');
    if (offer.conditions) { cond.hidden = false; cond.textContent = offer.conditions; }
    else { cond.hidden = true; cond.textContent = ''; }

    var answer = $('#offerAnswer');
    var closed = $('#offerClosed');
    $('#answerError').textContent = '';

    if (offer.acceptable) {
      answer.hidden = false;
      closed.hidden = true;
      $('#btnAccept').disabled = false;
      $('#btnDecline').disabled = false;
      return;
    }

    // Not answerable. Which is never silence: an offer that lapsed, one
    // that was declined and one that was withdrawn are three different
    // facts and an applicant is owed the one that applies to them.
    answer.hidden = true;
    closed.hidden = false;
    closed.textContent =
      offer.status === 'accepted' ? T.accepted
      : offer.status === 'declined' ? T.declined
      : offer.status === 'lapsed' || data.offerLapsed ? T.lapsed
      : offer.status === 'withdrawn' ? (T.withdrawn + (offer.withdrawnReason ? ' ' + offer.withdrawnReason : ''))
      : T.answeredAlready;
  }

  function renderTimeline(entries) {
    var list = $('#timeline');
    list.textContent = '';
    entries.forEach(function (e) {
      var li = document.createElement('li');

      var when = document.createElement('span');
      when.className = 'trk-timeline__when';
      when.textContent = fmtDateTime(e.at);
      li.appendChild(when);

      var what = document.createElement('p');
      what.className = 'trk-timeline__what';
      what.textContent = (e.to === 'submitted' && !e.from)
        ? T.submitted
        : (AR ? 'انتقل إلى: ' : 'Moved to ') + e.to + ' — ' + party(e.by);
      li.appendChild(what);

      if (e.note) {
        var note = document.createElement('p');
        note.className = 'trk-timeline__note';
        note.textContent = e.note;
        li.appendChild(note);
      }
      list.appendChild(li);
    });
  }

  // ── Answering an offer ─────────────────────────────────────────────

  function answer(action) {
    if (!lastRef || !current) return;
    var accept = $('#btnAccept');
    var decline = $('#btnDecline');
    var err = $('#answerError');
    err.textContent = '';

    // Both buttons, not just the one pressed. The other is a different
    // irreversible act on the same offer and must not stay live while
    // this one is in flight.
    accept.disabled = true;
    decline.disabled = true;
    var pressed = action === 'accept' ? accept : decline;
    var wasLabel = pressed.textContent;
    pressed.textContent = action === 'accept' ? T.accepting : T.declining;

    fetch('/api/admissions/offer?action=' + encodeURIComponent(action), {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
      body: JSON.stringify({
        reference: lastRef,
        reason: ($('#answerReason').value || '').trim() || null,
      }),
    }).then(function (res) {
      return res.json().then(function (body) { return { ok: res.ok, body: body }; });
    }).then(function (r) {
      if (!r.ok) {
        pressed.textContent = wasLabel;
        accept.disabled = false;
        decline.disabled = false;
        err.textContent = reasonFrom(r.body);
        return;
      }
      // Re-read rather than patch the page from the response. The act
      // moves the application's status, its outstanding list and its
      // timeline, and a page that updated only the offer card would show
      // an accepted offer beside a stage that had not moved.
      pressed.textContent = wasLabel;
      lookup(lastRef);
    }).catch(function () {
      pressed.textContent = wasLabel;
      accept.disabled = false;
      decline.disabled = false;
      err.textContent = T.failed;
    });
  }
})();
