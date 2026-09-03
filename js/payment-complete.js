/* WEC-LC — the screen a gateway returns a learner to.
 *
 * The interface for GET /api/payments/verify and
 * POST /api/enrolment/confirm. Both existed from the foundation pass;
 * the page they were written for did not, so `create-checkout.js` sent
 * every paying learner to a 404 and the enrolment this page is
 * supposed to ask for was never asked for.
 *
 * ─────────────────────────────────────────────────────────────────────
 * WHAT THIS PAGE REFUSES TO DO
 * ─────────────────────────────────────────────────────────────────────
 *
 * IT NEVER DECIDES WHAT HAPPENED. `standing` is one of five values that
 * functions/_lib/payments/confirmation.js works out from six payment
 * statuses, an optional receipt and an optional enrolment. Repeating
 * that reasoning here would put it in two editions of a page and let
 * the Arabic and the English disagree about whether somebody had paid.
 *
 * IT NEVER OFFERS AN ACT THAT WOULD BE REFUSED. The confirm button is
 * drawn only where `mayConfirmEnrolment` is true, which the endpoint
 * sets only where POST /api/enrolment/confirm would actually grant it.
 *
 * IT NEVER RE-CONVERTS THE FIGURE. `charged.text` is the amount that
 * reached the card, in the currency it was taken in, formatted by the
 * same function the statement of account uses. The ledger figure sits
 * under it. Neither is computed here.
 *
 * IT NEVER POLLS FOREVER. A charge sitting with a gateway is polled for
 * ninety seconds and then the page says plainly that the College is
 * still waiting, that nothing has been lost, and what reference to
 * quote. A spinner that never stops is a page pretending it knows
 * something it does not.
 *
 * Every value reaches the page through textContent.
 */
(function () {
  'use strict';

  var $ = function (s, r) { return (r || document).querySelector(s); };
  var AR = document.documentElement.lang === 'ar';
  var LOCALE = AR ? 'ar' : 'en-GB';
  var HOME = AR ? '/ar' : '';

  /* Ninety seconds at three-second intervals. A card authorisation that
     has not reached us in a minute and a half is not going to be
     resolved by the reader sitting here, and telling them so is more
     useful than a spinner. */
  var POLL_MS = 3000;
  var POLL_LIMIT = 30;

  /* A level, named for THIS reader. `programme_levels` holds one string
     and it is English; the endpoint hands back `nameAr` beside it so the
     page can choose, which is what stops an Arabic sentence ending in
     "English Mastery Programme". */
  function named(level) {
    if (!level) return '';
    return (AR && level.nameAr) ? level.nameAr : level.name;
  }

  var T = AR ? {
    loading: 'جارٍ البحث عن دفعتك…',
    signedOut: 'لست مسجَّل الدخول.',
    signedOutRest: 'سجلُّ دفعاتك خاصٌّ بك. سجّل الدخول لتراه.',
    failed: 'تعذّر قراءة هذه الدفعة.',
    failedRest: 'هذا خللٌ عندنا. أعد المحاولة بعد قليل، والرقم المرجعيُّ في عنوان الصفحة.',
    none: 'لم تُسجَّل على حسابك دفعةٌ بعد.',
    noneRest: 'وحين تدفع أوّل مرّة، تُفتح هذه الصفحة على تلك الدفعة.',
    standing: {
      awaiting_gateway: 'قيد المعالجة لدى المصرف',
      received: 'استُلم المبلغ',
      enrolled: 'استُلم المبلغ، وفُتح مستواك',
      failed: 'لم يتمّ الخصم',
      returned: 'رُدَّ المبلغ',
    },
    headline: {
      awaiting_gateway: 'دفعتُك ما تزال عند بوّابة الدفع.',
      received: 'وصلَنا المبلغ، وبقي أن يُفتح مستواك.',
      enrolled: 'تمّ الأمر. مستواك مفتوحٌ لك.',
      failed: 'لم يمرّ هذا الخصم، ولم يُؤخذ منك شيء.',
      returned: 'رُدَّت هذه الدفعة إليك كاملةً أو بعضًا.',
    },
    what: {
      level: function (name) { return 'عن ' + name + '.'; },
      full: 'عن البرنامج كلِّه، بمستوياته الستّة.',
      instalment: function (name) { return 'قسطٌ من ' + name + '.'; },
      instalmentPlain: 'قسطٌ من رسوم مستوًى.',
    },
    instalment: function (nth, of, left) {
      return 'القسط ' + nth + ' من ' + of + '، وبقي ' + left + '.';
    },
    instalmentPending: function (of) {
      return 'قسطٌ من ' + of + '، ويأخذ رقمه حين ينفذ الخصم.';
    },
    ledger: function (text) { return 'وهو ' + text + ' في سجلّ الكلّية.'; },
    opensNothing: '—',
    unpaidReceipt: 'يُصدَر عند نفاذ الخصم',
    wait: 'ما زلنا ننتظر جواب بوّابة الدفع. لا يُخصم منك شيءٌ مرّتين، ولا يضيع شيءٌ إن أغلقت هذه الصفحة: يظهر الخصم في كشف حسابك حين يصلنا.',
    waitTimeout: 'لم يصلنا جوابُ البوّابة بعدُ. اذكر الرقم المرجعيّ أعلاه لمكتب المسجّل إن لم تجد الدفعة في كشف حسابك خلال ساعة؛ ولا يُطلب منك دفعُها ثانيةً.',
    confirm: function (name) { return 'افتح ' + name; },
    confirmPlain: 'افتح مستواي',
    confirmFailed: 'تعذّر فتح المستوى الآن. اذكر الرقم المرجعيّ لمكتب المسجّل، ولا تُعِد الدفع.',
    failedNext: 'يمكنك المحاولة من كشف حسابك ببطاقةٍ أخرى، أو الكتابة إلى مكتب المسجّل.',
  } : {
    loading: 'Looking up your payment…',
    signedOut: 'You are not signed in.',
    signedOutRest: 'Your record of payments is private to you. Sign in to see it.',
    failed: 'This payment could not be read.',
    failedRest: 'This is a fault on our side. Try again shortly — the reference is in the address of this page.',
    none: 'No payment has been recorded on your account yet.',
    noneRest: 'When you make one, this page opens on it.',
    standing: {
      awaiting_gateway: 'With your bank',
      received: 'Received',
      enrolled: 'Received, and your level is open',
      failed: 'Not taken',
      returned: 'Returned to you',
    },
    headline: {
      awaiting_gateway: 'Your payment is still with the gateway.',
      received: 'The money has reached us. Your level is the next step.',
      enrolled: 'That is done. Your level is open.',
      failed: 'This charge did not go through, and nothing was taken.',
      returned: 'This payment has been returned to you, in whole or in part.',
    },
    what: {
      level: function (name) { return 'For ' + name + '.'; },
      full: 'For the whole programme — all six levels.',
      instalment: function (name) { return 'An instalment towards ' + name + '.'; },
      instalmentPlain: 'An instalment towards a level’s fee.',
    },
    instalment: function (nth, of, left) {
      return 'Instalment ' + nth + ' of ' + of + ' — ' + left + ' still to come.';
    },
    instalmentPending: function (of) {
      return 'One of ' + of + ' instalments. It takes its number when the charge clears.';
    },
    ledger: function (text) { return 'That is ' + text + ' in the College’s ledger.'; },
    opensNothing: '—',
    unpaidReceipt: 'Issued when the charge clears',
    wait: 'We are still waiting on the gateway. Nothing is charged twice and nothing is lost if you close this page: the charge appears on your statement of account as soon as it reaches us.',
    waitTimeout: 'The gateway has not answered yet. If the payment is not on your statement of account within the hour, quote the reference above to the Registry — you will not be asked to pay it again.',
    confirm: function (name) { return 'Open ' + name; },
    confirmPlain: 'Open my level',
    confirmFailed: 'The level could not be opened just now. Quote the reference to the Registry rather than paying again.',
    failedNext: 'You can try again from your statement of account with another card, or write to the Registry.',
  };

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
    return d.toLocaleDateString(LOCALE, {
      day: 'numeric', month: 'long', year: 'numeric', timeZone: 'UTC',
    });
  }

  var authHeaders = {};
  function api(path, opts) {
    var init = opts || {};
    init.headers = Object.assign({ Accept: 'application/json' }, authHeaders, init.headers || {});
    return fetch(path, init).then(function (r) {
      return r.json().then(function (d) { return { ok: r.ok, status: r.status, data: d }; })
        .catch(function () { return { ok: r.ok, status: r.status, data: {} }; });
    });
  }

  function state(strong, rest) {
    var box = $('#state');
    box.textContent = '';
    if (strong) box.appendChild(el('strong', null, strong + ' '));
    box.appendChild(document.createTextNode(rest || ''));
  }

  /* The reference the gateway put on the address. `payment` is the name
     create-checkout.js uses; `id` is accepted too because that is the
     name the endpoint takes and somebody will paste one. */
  function reference() {
    var q = new URLSearchParams(window.location.search);
    return q.get('payment') || q.get('id') || '';
  }

  var polls = 0;
  /* The payment being shown. Reached from a statement of account there
     is no reference on the address at all, and the confirm route takes
     one — so the id the endpoint answered with is what is posted back,
     never the query string. */
  var current = null;

  function render(p) {
    current = p;
    $('#state').textContent = '';
    $('#scope').hidden = false;
    $('#secPayment').hidden = false;
    $('#secActs').hidden = false;

    $('[data-standing]').textContent = T.standing[p.standing] || p.standing;
    $('[data-headline]').textContent = T.headline[p.standing] || '';
    $('[data-charged]').textContent = p.charged.text;

    // The ledger figure only where it is a DIFFERENT figure. Printing
    // "$3,166.67 — that is $3,166.67 in the College's ledger" is noise,
    // and noise is how a reader stops reading a figure carefully.
    var led = $('[data-ledger]');
    if (p.charged.currency !== p.ledgerAmount.ledger.currency) {
      led.hidden = false;
      led.textContent = T.ledger(p.ledgerAmount.ledger.text);
    } else {
      led.hidden = true;
    }

    $('[data-what]').textContent = p.kind === 'full_programme'
      ? T.what.full
      : p.kind === 'instalment'
        ? (p.level ? T.what.instalment(named(p.level)) : T.what.instalmentPlain)
        : (p.level ? T.what.level(named(p.level)) : '');

    var inst = $('[data-instalment]');
    if (p.instalment) {
      inst.hidden = false;
      inst.textContent = p.instalment.number
        ? T.instalment(p.instalment.number, p.instalment.of, p.instalment.remainingCount)
        : T.instalmentPending(p.instalment.of);
    } else {
      inst.hidden = true;
    }

    $('[data-fact-ref]').textContent = p.id;
    $('[data-fact-when]').textContent = fmtDate(p.confirmedAt || p.createdAt);
    $('[data-fact-receipt]').textContent = p.receipt ? p.receipt.number : T.unpaidReceipt;
    $('[data-fact-opens]').textContent = p.opens ? named(p.opens) : T.opensNothing;

    var reason = $('[data-reason]');
    if (p.standing === 'failed') {
      reason.hidden = false;
      reason.textContent = (p.failureReason ? p.failureReason + ' ' : '') + T.failedNext;
    } else {
      reason.hidden = true;
    }

    // ── What can be done from here ────────────────────────────────
    var wait = $('[data-wait]');
    var buttons = $('[data-buttons]');
    var confirm = $('[data-confirm]');
    var programme = $('[data-go-programme]');

    if (p.standing === 'awaiting_gateway') {
      wait.hidden = false;
      wait.textContent = polls >= POLL_LIMIT ? T.waitTimeout : T.wait;
    } else {
      wait.hidden = true;
    }

    buttons.hidden = false;
    confirm.hidden = !p.mayConfirmEnrolment;
    if (p.mayConfirmEnrolment) {
      confirm.textContent = p.opens ? T.confirm(named(p.opens)) : T.confirmPlain;
    }
    programme.hidden = p.standing !== 'enrolled';
  }

  function load() {
    var ref = reference();
    return api('/api/payments/verify' + (ref ? '?id=' + encodeURIComponent(ref) : ''))
      .then(function (r) {
        if (r.status === 401) { state(T.signedOut, T.signedOutRest); return 'auth'; }
        if (r.status === 404) { state(T.none, T.noneRest); return 'none'; }
        if (!r.ok) { state(T.failed, T.failedRest); return 'fail'; }
        render(r.data);
        return r.data;
      });
  }

  function poll() {
    if (polls >= POLL_LIMIT) return;
    polls += 1;
    window.setTimeout(function () {
      load().then(function (p) {
        if (p && p.standing === 'awaiting_gateway') poll();
      });
    }, POLL_MS);
  }

  function confirmEnrolment() {
    var btn = $('[data-confirm]');
    var err = $('[data-act-error]');
    err.hidden = true;
    btn.disabled = true;
    api('/api/enrolment/confirm', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ paymentId: current ? current.id : reference() }),
    }).then(function (r) {
      btn.disabled = false;
      if (!r.ok) {
        err.hidden = false;
        // The endpoint's own sentence first — `error` is the class name
        // of the exception, never anything to show a person.
        err.textContent = (r.data && r.data.message) || T.confirmFailed;
        return;
      }
      load();
    }).catch(function () {
      btn.disabled = false;
      err.hidden = false;
      err.textContent = T.confirmFailed;
    });
  }

  document.addEventListener('DOMContentLoaded', function () {
    $('[data-confirm]').addEventListener('click', confirmEnrolment);
    // The programme link is language-aware in the markup; the account
    // link too. Nothing is rewritten here.
    var go = $('[data-go-account]');
    if (go) go.setAttribute('href', HOME + '/my-account.html');

    var boot = function () {
      state(T.loading, '');
      load().then(function (p) {
        if (p && p.standing === 'awaiting_gateway') poll();
      });
    };

    var cfg = window.WEC_LC_AUTH || {};
    if (cfg.clerkPublishableKey && typeof window.WEC_LC_loadClerk === 'function') {
      window.WEC_LC_loadClerk(cfg.clerkPublishableKey, function (err, clerk) {
        if (!err && clerk && clerk.session) {
          clerk.session.getToken().then(function (tok) {
            if (tok) authHeaders.Authorization = 'Bearer ' + tok;
            boot();
          }).catch(boot);
          return;
        }
        boot();
      });
      return;
    }
    boot();
  });
})();
