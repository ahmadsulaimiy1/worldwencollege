/* WEC-LC — Finance.
 *
 * The interface for GET /api/admin/reports/revenue and
 * GET /api/admin/reports/reconciliation.
 *
 * ─────────────────────────────────────────────────────────────────────
 * ADMINISTRATOR, AND THE REFUSAL IS TOLD APART FROM THE ABSENCE
 * ─────────────────────────────────────────────────────────────────────
 * Governance decision A5: a language tutor should not be able to read
 * the institution's revenue. A tutor who opens this page meets the
 * sentence for a 403 rather than a blank set of reports, because a
 * blank page and a forbidden one look identical and only one of them
 * is worth telling somebody about.
 *
 * ─────────────────────────────────────────────────────────────────────
 * MONEY IS WHOLE CENTS AND IS PRINTED AS SUCH
 * ─────────────────────────────────────────────────────────────────────
 * The report carries USD cents as whole numbers. They are formatted
 * once, here, by the browser's own currency formatter — nothing on this
 * page divides by a hundred and rounds, which is how a ledger acquires
 * a cent that belongs to nobody.
 *
 * ─────────────────────────────────────────────────────────────────────
 * AND A DISCREPANCY IS NEVER AVERAGED
 * ─────────────────────────────────────────────────────────────────────
 * The reconciliation report is five separate questions — an unverified
 * webhook, an orphaned one, a payment stuck mid-flight, a succeeded
 * payment with no receipt — and each is rendered as itself with its own
 * count. There is no health score, because a number that averages a
 * discrepancy away is a number that hides it.
 */
(function () {
  'use strict';

  var K = window.WEC_LC_staff;
  var $ = K.$;
  var AR = K.AR;

  var T = AR ? {
    loading: 'جارٍ تحميل الدفتر…',
    ready: 'دفتر الكلّية.',
    readyRest: 'ما قُبض، وهل ما زالت القيود متوافقة.',
    revenueHead: 'ما قُبض',
    revenueNote: function (f, t) {
      if (!f && !t) return 'من أوّل قيدٍ إلى آخره. حدِّد مدّةً لتضييق ذلك.';
      return 'من ' + (f || 'أوّل قيد') + ' إلى ' + (t || 'آخر قيد') + '.';
    },
    fromLabel: 'من',
    toLabel: 'إلى',
    apply: 'طبِّق',
    gross: 'الإجمالي',
    refunded: 'المردود',
    net: 'الصافي',
    succeeded: 'دفعةٌ ناجحة',
    byStatus: 'بحسب الحال',
    byCurrency: 'بحسب العملة',
    byLevel: 'بحسب المستوى',
    byProvider: 'بحسب البوّابة',
    none: 'لا قيدَ في هذه المدّة.',
    reconHead: 'المطابقة',
    reconNote: function (m, at) {
      return 'وُلِّد هذا في ' + at + '. وتُعدّ الدفعةُ متعثّرةً إذا بقيت معلّقةً أكثر من ' + m + ' دقيقة.';
    },
    reconClear: 'لا خلافَ في القيود.',
    reconClearNote: 'كلُّ دفعةٍ ناجحةٍ لها إيصال، ولا تنبيهَ بوّابةٍ بلا توقيعٍ ولا بلا دفعةٍ خلفه، ولا دفعةَ عالقةٌ في الطريق.',
    findings: {
      unverifiedWebhooks: 'تنبيهُ بوّابةٍ لم يُتحقَّق من توقيعه',
      orphanedWebhooks: 'تنبيهُ بوّابةٍ لا دفعةَ خلفه',
      stalePayments: 'دفعةٌ عالقةٌ في الطريق',
      succeededPaymentsMissingReceipts: 'دفعةٌ ناجحةٌ بلا إيصال',
      webhookVolume: 'تنبيهاتُ البوّابات',
    },
    rows: function (n) { return n + ' قيدًا'; },
  } : {
    loading: 'Loading the ledger…',
    ready: 'The College’s ledger.',
    readyRest: 'What has been taken, and whether the records still agree.',
    revenueHead: 'What has been taken',
    revenueNote: function (f, t) {
      if (!f && !t) return 'From the first entry to the last. Name a period to narrow it.';
      return 'From ' + (f || 'the first entry') + ' to ' + (t || 'the last') + '.';
    },
    fromLabel: 'From',
    toLabel: 'To',
    apply: 'Apply',
    gross: 'Gross',
    refunded: 'Refunded',
    net: 'Net',
    succeeded: 'Payments succeeded',
    byStatus: 'By status',
    byCurrency: 'By currency',
    byLevel: 'By level',
    byProvider: 'By gateway',
    none: 'Nothing was taken in this period.',
    reconHead: 'Reconciliation',
    reconNote: function (m, at) {
      return 'Generated ' + at + '. A payment is counted stalled once it has been in flight for more than ' + m + ' minutes.';
    },
    reconClear: 'The records agree.',
    reconClearNote: 'Every succeeded payment has a receipt, no gateway notice is unsigned or unattached, and nothing is stuck in flight.',
    findings: {
      unverifiedWebhooks: 'Gateway notices with an unverified signature',
      orphanedWebhooks: 'Gateway notices with no payment behind them',
      stalePayments: 'Payments stuck in flight',
      succeededPaymentsMissingReceipts: 'Succeeded payments with no receipt',
      webhookVolume: 'Gateway notices received',
    },
    rows: function (n) { return n + (n === 1 ? ' entry' : ' entries'); },
  };

  /** Whole USD cents, formatted once. Nothing here divides and rounds. */
  function money(cents) {
    var n = Number(cents) || 0;
    try {
      return new Intl.NumberFormat(K.LOCALE, {
        style: 'currency', currency: 'USD', minimumFractionDigits: 2,
      }).format(n / 100);
    } catch (e) {
      return '$' + (n / 100).toFixed(2);
    }
  }

  function tile(name, icon, value, label) {
    var t = K.el('div', 'stf-count plate-dark card card--dark edge-lit aurum tilt gold-live reveal');
    t.setAttribute('data-tile', name);
    var sheen = K.el('span', 'tilt__sheen');
    sheen.setAttribute('aria-hidden', 'true');
    t.appendChild(sheen);
    t.appendChild(K.dome(icon, true));
    t.appendChild(K.el('p', 'stf-count__num', value));
    t.appendChild(K.el('p', 'stf-count__label', label));
    return t;
  }

  function breakdown(title, rows, format) {
    var li = K.plate('li');
    var head = K.el('div', 'stf-item__head');
    head.appendChild(K.dome('i-ledger'));
    var who = K.el('div', 'stf-item__who');
    who.appendChild(K.el('p', 'stf-item__name', title));
    who.appendChild(K.el('p', 'stf-item__where', T.rows((rows || []).length)));
    head.appendChild(who);
    li.appendChild(head);

    var panel = K.el('div', 'stf-panel');
    var box = K.el('div', 'stf-work');
    (rows || []).forEach(function (r) {
      var p = K.el('p');
      p.setAttribute('dir', 'auto');
      p.textContent = format(r);
      box.appendChild(p);
    });
    if (!(rows || []).length) box.appendChild(K.el('p', null, T.none));
    panel.appendChild(box);
    li.appendChild(panel);
    return li;
  }

  function loadRevenue() {
    var from = $('[data-from]').value;
    var to = $('[data-to]').value;
    var q = [];
    if (from) q.push('from=' + from + 'T00:00:00.000Z');
    // Inclusive of the whole closing day: a range ending "on the 4th"
    // that stopped at midnight on the 3rd would silently drop a day of
    // receipts every time somebody read it.
    if (to) q.push('to=' + to + 'T23:59:59.999Z');

    return K.api('/api/admin/reports/revenue' + (q.length ? '?' + q.join('&') : ''))
      .then(function (d) {
        var t = d.totals || {};
        var counts = $('#secCounts');
        counts.textContent = '';
        counts.appendChild(tile('gross', 'i-scales', money(t.grossUsdCents), T.gross));
        counts.appendChild(tile('refunded', 'i-ring', money(t.refundedUsdCents), T.refunded));
        counts.appendChild(tile('net', 'i-seal', money(t.netUsdCents), T.net));
        counts.appendChild(tile('count', 'i-check', String(t.succeededCount || 0), T.succeeded));
        counts.hidden = false;

        $('[data-revenue-head]').textContent = T.revenueHead;
        $('[data-revenue-note]').textContent = T.revenueNote(from, to);

        var list = $('[data-revenue]');
        list.textContent = '';
        list.appendChild(breakdown(T.byStatus, d.byStatus, function (r) {
          return (r.status || '—') + ' · ' + (r.n || r.count || 0);
        }));
        list.appendChild(breakdown(T.byCurrency, d.byCurrency, function (r) {
          return (r.currency || '—') + ' · ' + money(r.usdCents || r.amountUsdCents || 0);
        }));
        list.appendChild(breakdown(T.byLevel, d.byLevel, function (r) {
          return (r.levelId ? K.levelWord(r.levelId) : '—') + ' · ' + money(r.usdCents || r.amountUsdCents || 0);
        }));
        list.appendChild(breakdown(T.byProvider, d.byProvider, function (r) {
          return (r.provider || '—') + ' · ' + money(r.usdCents || r.amountUsdCents || 0);
        }));
        $('#secRevenue').hidden = false;
      });
  }

  function loadReconciliation() {
    return K.api('/api/admin/reports/reconciliation').then(function (d) {
      $('[data-recon-head]').textContent = T.reconHead;
      $('[data-recon-note]').textContent =
        T.reconNote(d.staleAfterMinutes, K.when(d.generatedAt, true));

      var list = $('[data-recon]');
      list.textContent = '';

      // Four findings, each as itself. `webhookVolume` is not a finding
      // — it is the denominator — so it is rendered last and never
      // counted among the discrepancies.
      var keys = ['unverifiedWebhooks', 'orphanedWebhooks', 'stalePayments',
        'succeededPaymentsMissingReceipts'];
      var found = 0;
      keys.forEach(function (k) {
        var rows = d[k] || [];
        if (!rows.length) return;
        found += rows.length;
        list.appendChild(breakdown(T.findings[k], rows, function (r) {
          return Object.keys(r).map(function (key) { return key + ': ' + r[key]; }).join(' · ');
        }));
      });
      if ((d.webhookVolume || []).length) {
        list.appendChild(breakdown(T.findings.webhookVolume, d.webhookVolume, function (r) {
          return Object.keys(r).map(function (key) { return key + ': ' + r[key]; }).join(' · ');
        }));
      }

      var clear = $('[data-recon-clear]');
      clear.hidden = found > 0;
      $('[data-recon-clear-head]').textContent = T.reconClear;
      $('[data-recon-clear-note]').textContent = T.reconClearNote;
      $('#secRecon').hidden = false;
    });
  }

  function labels() {
    $('[data-from-label]').textContent = T.fromLabel;
    $('[data-to-label]').textContent = T.toLabel;
    $('[data-apply]').textContent = T.apply;
  }

  function boot() {
    $('#state').textContent = T.loading;
    labels();
    Promise.all([loadRevenue(), loadReconciliation()]).then(function () {
      $('#state').textContent = T.ready + ' ' + T.readyRest;
    }).catch(function (e) {
      $('#state').textContent = K.trouble(e);
    });
  }

  document.addEventListener('DOMContentLoaded', function () {
    $('[data-apply]').addEventListener('click', function () {
      loadRevenue().catch(function (e) { $('#state').textContent = K.trouble(e); });
    });
  });

  K.boot(boot);
})();
