/* WEC-LC — My Account, the learner's statement of account.
 *
 * The interface for GET /api/student/finance and GET /api/student/invoice.
 * Both existed from the foundation pass with nothing calling them, which
 * is recorded as the FIRST item of the interface backlog in
 * docs/platform-capabilities.md § 11: a learner who wanted to know what
 * they owed had to ask a person.
 *
 * ─────────────────────────────────────────────────────────────────────
 * WHAT THIS PAGE REFUSES TO DO
 * ─────────────────────────────────────────────────────────────────────
 *
 * IT NEVER COMPUTES A FIGURE. Every amount rendered here is a string the
 * endpoint produced, because functions/_lib/student/finance.js is where
 * money arithmetic lives and doing any of it twice is how two numbers
 * that must agree begin to disagree. The page does not add, does not
 * convert, does not round, and does not sum a column — where a total is
 * shown it is the total the endpoint returned. `presentAmount()` even
 * throws rather than render a fractional cent; a page that quietly did
 * its own arithmetic would step around that guard.
 *
 * IT NEVER SHOWS THE LEDGER FIGURE ALONE WHERE THE LEARNER'S OWN IS
 * KNOWN, and never the learner's alone. `amount.learner` is null unless
 * the platform genuinely holds a rate, and when it is present it carries
 * `rateAsOf` on the figure itself — which is rendered beside it rather
 * than in a header, because a figure lifted into a screenshot loses its
 * header and must not lose the date on which it was true.
 *
 * IT NEVER SWALLOWS AN IMBALANCE. `reconciliation.balances` and an
 * invoice's `matchesChargedAmount` are the endpoint saying whether its
 * own arithmetic holds. If either is false the page says so, loudly,
 * rather than picking whichever figure looks tidier — that would be the
 * interface deciding a question about somebody's money.
 *
 * IT NEVER PRINTS A LETTERHEAD. The College's billing entity, registered
 * address and tax registration are recorded nowhere in the schema. The
 * endpoint deliberately returns no issuer block, and inventing one here
 * would be inventing a legal entity.
 *
 * Every value reaches the page through textContent.
 */
(function () {
  'use strict';

  var $ = function (s, r) { return (r || document).querySelector(s); };
  var AR = document.documentElement.lang === 'ar';
  var LOCALE = AR ? 'ar' : 'en-GB';

  var T = AR ? {
    loading: 'جارٍ تحميل حسابك…',
    signedOut: 'لست مسجَّل الدخول.',
    signedOutRest: 'كشف حسابك خاصٌّ بك. سجّل الدخول لتراه.',
    failed: 'تعذّر تحميل حسابك.',
    failedRest: 'هذا خللٌ عندنا. أعد المحاولة بعد قليل.',
    states: {
      nothing_assessed: 'لم يُقدَّر عليك شيء بعد',
      settled: 'حسابك مسوّى',
      outstanding: 'المستحقّ عليك',
      in_credit: 'لك رصيدٌ دائن',
    },
    notes: {
      nothing_assessed: 'لا رسوم على هذا الحساب بعد. ويبدأ التقدير عند قيدك في مستوى أو في البرنامج كلّه.',
      settled: 'لا شيء مستحقّ. وكل ما قُدِّر عليك قد سُدِّد.',
      outstanding: 'هذا ما بقي بعد كل ما قُدِّر وأُعفي وسُدِّد واستُرِدّ.',
      in_credit: 'دفعتَ أكثر مما قُدِّر عليك. اكتب إلى مكتب المسجّل وسيُسوَّى ذلك.',
    },
    terms: {
      assessed: 'المقدَّر عليك',
      relief: 'الإعفاء',
      paid: 'المسدَّد',
      refunded: 'المستردّ',
      outstanding: 'الرصيد',
    },
    rateAsOf: function (d) { return 'بسعر ' + d; },
    scope: {
      none: 'لم تُقدَّر رسوم على هذا الحساب بعد.',
      by_level: 'قُدِّرت الرسوم مستوىً مستوى.',
      full_programme: 'قُدِّرت الرسوم على البرنامج كلّه دفعةً واحدة.',
    },
    noLedger: 'لم تُسجَّل على هذا الحساب دفعةٌ بعد.',
    receipt: 'إيصال',
    noReceipt: '—',
    openInvoice: 'افتح الفاتورة',
    held: 'ممنوحة، ولم تُطبَّق بعد',
    remitted: 'المحسوم',
    approvedBy: function (role) { return 'اعتمدها: ' + role; },
    noAuthority: 'لم تُسجَّل جهة الاعتماد على هذه المنحة.',
    instalment: function (n, of) { return 'القسط ' + n + ' من ' + of; },
    instalmentToward: function (name) { return 'قسط من ' + name; },
    fxNote: function (units, cur, date) {
      return 'مبالغ ' + cur + ' محوَّلة بسعر ' + units + ' للدولار، وهو السعر بتاريخ ' + date + '.';
    },
    noDueDate: 'لا تاريخ استحقاق منشور',
    planLevel: function (name) { return name; },
    planProgramme: 'البرنامج كلّه',
    paidCount: function (a, b) { return a + ' من ' + b + ' مسدَّد'; },
    invoiceTitle: 'الفاتورة',
    total: 'المجموع',
    source: 'المصدر',
    owedOnThis: 'الباقي على هذه الفاتورة',
    charged: function (text, cur) { return 'ما خُصم فعلًا: ' + text + ' (' + cur + ')'; },
    mismatch: 'صافي هذه الفاتورة لا يطابق المبلغ المسجَّل على الدفعة. أبلِغ مكتب المسجّل بهذا الرقم المرجعي؛ فهذا خللٌ في سجل الكلية لا في حسابك.',
    imbalance: 'لا تستقيم حدود هذا الحساب. أبلِغ مكتب المسجّل؛ فالخلل عند الكلية، ولا يُطلب منك تسوية رقمٍ لا تستقيم به المعادلة.',
    identity: 'الرصيد = المقدَّر − الإعفاء − المسدَّد + المستردّ',
    unpaid: 'غير مسدَّد',
    kinds: {
      level_tuition: 'رسوم مستوى',
      full_programme_tuition: 'رسوم البرنامج كاملًا',
      level: 'مستوى',
      full_programme: 'البرنامج كلّه',
      instalment: 'قسط',
    },
    statuses: {
      succeeded: 'مسدَّد', confirmed: 'مسدَّد', pending: 'قيد المعالجة',
      failed: 'أخفق', refunded: 'مستردّ', cancelled: 'ملغى',
    },
  } : {
    loading: 'Loading your account…',
    signedOut: 'You are not signed in.',
    signedOutRest: 'Your statement of account is private to you. Sign in to see it.',
    failed: 'Your account could not be loaded.',
    failedRest: 'This is a fault on our side. Please try again shortly.',
    states: {
      nothing_assessed: 'Nothing has been assessed yet',
      settled: 'Your account is settled',
      outstanding: 'Outstanding',
      in_credit: 'Your account is in credit',
    },
    notes: {
      nothing_assessed: 'No tuition has been assessed against this account. Assessment begins when you are enrolled at a level or for the whole programme.',
      settled: 'Nothing is owed. Everything assessed against this account has been paid.',
      outstanding: 'This is what remains after everything assessed, remitted, paid and refunded.',
      in_credit: 'You have paid more than has been assessed. Write to the Registry and it will be put right.',
    },
    terms: {
      assessed: 'Assessed',
      relief: 'Relief granted',
      paid: 'Paid',
      refunded: 'Refunded',
      outstanding: 'Outstanding',
    },
    rateAsOf: function (d) { return 'at the rate of ' + d; },
    scope: {
      none: 'No tuition has been assessed against this account yet.',
      by_level: 'Tuition is assessed level by level.',
      full_programme: 'Tuition is assessed for the whole programme in one.',
    },
    noLedger: 'No payment has been recorded against this account yet.',
    receipt: 'Receipt',
    noReceipt: '—',
    openInvoice: 'Open the invoice',
    held: 'Held, not yet applied',
    remitted: 'Remitted',
    approvedBy: function (role) { return 'Approved by the ' + role; },
    noAuthority: 'No approving authority is recorded against this award.',
    instalment: function (n, of) { return 'Instalment ' + n + ' of ' + of; },
    instalmentToward: function (name) { return 'Instalment towards ' + name; },
    fxNote: function (units, cur, date) {
      return cur + ' figures are converted at ' + units + ' to the dollar, the rate as of ' + date + '.';
    },
    noDueDate: 'no published due date',
    planLevel: function (name) { return name; },
    planProgramme: 'The full programme',
    paidCount: function (a, b) { return a + ' of ' + b + ' paid'; },
    invoiceTitle: 'Invoice',
    total: 'Total',
    source: 'Source',
    owedOnThis: 'Still owed on this invoice',
    charged: function (text, cur) { return 'Actually charged: ' + text + ' (' + cur + ')'; },
    mismatch: 'This invoice’s net does not match the amount recorded on the payment. Report this reference to the Registry — it is a fault in the College’s ledger, not in your account.',
    imbalance: 'The terms of this account do not add up. Report it to the Registry: the fault is the College’s, and you are not asked to settle a figure whose arithmetic does not hold.',
    identity: 'outstanding = assessed − relief − paid + refunded',
    unpaid: 'Unpaid',
    kinds: {
      level_tuition: 'Level tuition',
      full_programme_tuition: 'Full programme tuition',
      level: 'A level',
      full_programme: 'The full programme',
      instalment: 'An instalment',
    },
    statuses: {
      succeeded: 'Paid', confirmed: 'Paid', pending: 'In progress',
      failed: 'Failed', refunded: 'Refunded', cancelled: 'Cancelled',
    },
  };

  /* A PROVENANCE CITATION, NOT A SENTENCE.
     `basis` is uniformly a column name or a file path — "programme_levels.price_usd_cents",
     "instalment_plans.total_amount_usd_cents, divided by … computeInstalmentAmounts()".
     Rendered as prose under a line description it reads as a broken
     sentence and looks like a leaked internal, which is how it first
     rendered here. Rendered as what it IS — the record the figure came
     from, cited — it is the strongest thing on the page: an institution
     showing where every number originates. Monospace, labelled, quiet. */
  function sourceInto(node, basis) {
    if (!basis) return node;
    var wrap = el('p', 'acc-source');
    wrap.appendChild(el('span', 'acc-source__label', T.source));
    wrap.appendChild(el('code', 'acc-source__ref', basis));
    node.appendChild(wrap);
    return node;
  }

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
    return d.toLocaleDateString(LOCALE, { day: 'numeric', month: 'long', year: 'numeric', timeZone: 'UTC' });
  }

  /* One money value, as the endpoint produced it. `.ledger.text` always
     exists; `.learner` exists only where the platform holds a rate. The
     second is appended in its own element rather than concatenated, so a
     table cell can lay the two out on two lines without this function
     knowing anything about layout. */
  function moneyInto(node, amount, opts) {
    if (!amount) { node.textContent = '—'; return node; }
    var withRate = !opts || opts.rate !== false;
    node.appendChild(el('span', 'acc-money__ledger', amount.ledger.text));
    if (amount.learner) {
      var alt = el('span', 'acc-money__learner',
        amount.learner.text
        + (withRate && amount.learner.rateAsOf ? ' · ' + T.rateAsOf(fmtDate(amount.learner.rateAsOf)) : ''));
      alt.style.display = 'block';
      alt.style.fontWeight = '400';
      alt.style.fontSize = '.82em';
      alt.style.opacity = '.72';
      node.appendChild(alt);
    }
    return node;
  }

  var authHeaders = {};
  function api(path) {
    return fetch(path, { headers: Object.assign({ Accept: 'application/json' }, authHeaders) })
      .then(function (r) {
        return r.json().then(function (d) { return { ok: r.ok, status: r.status, data: d }; });
      });
  }

  function state(strong, rest) {
    var box = $('#state');
    box.textContent = '';
    if (strong) box.appendChild(el('strong', null, strong + ' '));
    box.appendChild(document.createTextNode(rest || ''));
  }

  // ── The balance, and the workings under it ─────────────────────────
  function renderBalance(f) {
    var sec = $('#secBalance');
    sec.hidden = false;
    var b = f.balance;

    $('[data-balance-state]').textContent = T.states[b.state] || b.state;
    $('[data-balance-figure]').textContent = b.outstanding.ledger.text;

    var local = $('[data-balance-local]');
    if (b.outstanding.learner) {
      local.hidden = false;
      local.textContent = b.outstanding.learner.text
        + (b.outstanding.learner.rateAsOf ? ' · ' + T.rateAsOf(fmtDate(b.outstanding.learner.rateAsOf)) : '');
    } else {
      local.hidden = true;
    }
    $('[data-balance-note]').textContent = T.notes[b.state] || '';

    // The five terms, in the endpoint's own order, with the operator
    // that joins each to the one before it. The operators come from the
    // identity string rather than from an assumption here.
    var list = $('[data-reconciliation]');
    list.textContent = '';
    [['', 'assessed', b.assessed], ['−', 'relief', b.relief],
      ['−', 'paid', b.paid], ['+', 'refunded', b.refunded]].forEach(function (row) {
      var li = el('li');
      li.appendChild(el('span', 'acc-sum__op', row[0]));
      li.appendChild(el('span', 'acc-sum__term', T.terms[row[1]]));
      // No rate date on these five: the headline figure two lines above
      // carries it, and any screenshot that includes a term includes the
      // headline. Repeating one date five times is noise, and noise is
      // how a reader stops reading a figure carefully.
      li.appendChild(moneyInto(el('span', 'acc-sum__value'), row[2], { rate: false }));
      list.appendChild(li);
    });
    var total = el('li');
    total.setAttribute('data-total', '');
    total.appendChild(el('span', 'acc-sum__op', '='));
    total.appendChild(el('span', 'acc-sum__term', T.terms.outstanding));
    total.appendChild(moneyInto(el('span', 'acc-sum__value'), b.outstanding, { rate: false }));
    list.appendChild(total);

    $('[data-identity]').textContent = T.identity;

    // The endpoint's own verdict on its own arithmetic. Never softened.
    var warn = $('[data-imbalance]');
    warn.hidden = f.reconciliation.balances !== false;
    if (!warn.hidden) warn.textContent = T.imbalance;
  }

  // ── What was assessed ──────────────────────────────────────────────
  function renderTuition(f) {
    var sec = $('#secTuition');
    var body = $('[data-tuition]');
    body.textContent = '';
    $('[data-tuition-scope]').textContent = T.scope[f.tuition.scope] || '';
    if (!f.tuition.components.length) {
      // Not hidden: "nothing assessed" is an answer, and a learner who
      // has enrolled and been charged nothing yet is entitled to read it
      // rather than meet a missing section.
      sec.hidden = f.tuition.scope === 'none' ? false : true;
      if (!sec.hidden) $('[data-tuition-scope]').textContent = T.scope.none;
      return;
    }
    sec.hidden = false;
    f.tuition.components.forEach(function (c) {
      var tr = el('tr');
      tr.appendChild(el('td', null, c.description || T.kinds[c.kind] || c.kind));
      tr.appendChild(sourceInto(el('td'), c.basis));
      tr.appendChild(moneyInto(el('td', 'acc-num'), c.gross, { rate: false }));
      body.appendChild(tr);
    });
  }

  // ── Relief ─────────────────────────────────────────────────────────
  function renderRelief(f) {
    var sec = $('#secRelief');
    var list = $('[data-relief]');
    list.textContent = '';
    var rows = (f.relief.scholarships || []).concat(f.relief.promoCodes || []);
    if (!rows.length) { sec.hidden = true; return; }
    sec.hidden = false;

    (f.relief.scholarships || []).forEach(function (s) {
      var li = el('li');
      li.setAttribute('data-applied', s.applied ? 'true' : 'false');
      var head = el('div', 'acc-relief__head');
      head.appendChild(el('span', 'acc-relief__name',
        s.percent != null ? s.percent + '% scholarship' : 'Scholarship'));
      if (!s.applied) head.appendChild(el('span', 'acc-pill', T.held));
      head.appendChild(moneyInto(el('span', 'acc-relief__value'), s.remitted, { rate: false }));
      li.appendChild(head);
      // The authority, or the absence of one said plainly. `approved_by`
      // has no foreign key and no date, so a role is all the platform
      // can honestly publish and a name is never invented.
      li.appendChild(el('p', 'acc-relief__note',
        s.authority && s.authority.recorded && s.authority.approvedByRole
          ? T.approvedBy(s.authority.approvedByRole)
          : T.noAuthority));
      if (s.notes) li.appendChild(el('p', 'acc-relief__note', s.notes));
      list.appendChild(li);
    });

    (f.relief.promoCodes || []).forEach(function (p) {
      var li = el('li');
      li.setAttribute('data-applied', 'true');
      var head = el('div', 'acc-relief__head');
      head.appendChild(el('span', 'acc-relief__name', p.code));
      head.appendChild(moneyInto(el('span', 'acc-relief__value'), p.remitted, { rate: false }));
      li.appendChild(head);
      list.appendChild(li);
    });
  }

  // ── The ledger ─────────────────────────────────────────────────────
  function renderLedger(f) {
    var sec = $('#secLedger');
    sec.hidden = false;
    var body = $('[data-ledger]');
    body.textContent = '';
    var empty = $('[data-ledger-empty]');

    if (!f.payments.length) {
      empty.hidden = false;
      empty.textContent = T.noLedger;
      return;
    }
    empty.hidden = true;

    f.payments.forEach(function (p) {
      var tr = el('tr');
      tr.setAttribute('data-invoice', p.id);

      tr.appendChild(el('td', null, fmtDate(p.confirmedAt || p.createdAt)));

      var what = el('td');
      // A button, not a click handler on the row alone: an invoice must
      // be reachable from the keyboard, and a <tr> is not focusable.
      // Kind FIRST where the kind changes what the figure means. An
      // instalment labelled only with its level reads as the whole
      // level's fee, and $791.67 beside "Upper Intermediate Programme"
      // is a learner concluding the College has mispriced their level.
      var label = p.kind === 'instalment'
        ? (p.levelName ? T.instalmentToward(p.levelName) : T.kinds.instalment)
        : (p.levelName || T.kinds[p.kind] || p.kind);
      var open = el('button', 'acc-open', label);
      open.type = 'button';
      open.setAttribute('data-open-invoice', p.id);
      open.setAttribute('aria-label', T.openInvoice + ' — ' + p.id);
      what.appendChild(open);
      tr.appendChild(what);

      var pill = el('span', 'acc-pill acc-pill--'
        + (p.received ? 'received' : p.status === 'failed' ? 'failed' : 'pending'),
        T.statuses[p.status] || p.status);
      var stCell = el('td'); stCell.appendChild(pill);
      // A failure reason is the difference between "it failed" and
      // knowing whether to try the same card again.
      if (p.failureReason) stCell.appendChild(el('p', 'acc-relief__note', p.failureReason));
      tr.appendChild(stCell);

      tr.appendChild(moneyInto(el('td', 'acc-num'), p.amount, { rate: false }));
      tr.appendChild(el('td', null, p.receiptNumber || T.noReceipt));
      body.appendChild(tr);
    });

    // The rate, ONCE, under the table it governs. It used to ride on
    // every converted figure, which put four identical dates in one
    // column — and a column of repeated dates is how a reader stops
    // reading the figures beside them. The one place it stays on the
    // figure itself is the headline balance, which is the figure that
    // gets screenshotted on its own.
    var fx = f.presentation && f.presentation.learnerCurrency;
    if (fx && fx.rate) {
      var note = el('p', 'acc-block__note',
        T.fxNote(fx.rate.unitsPerUsd, fx.code, fmtDate(fx.rate.asOf)));
      note.setAttribute('data-fx', '');
      $('#secLedger').appendChild(note);
    }

    body.addEventListener('click', function (e) {
      var btn = e.target.closest('[data-open-invoice]');
      var row = e.target.closest('[data-invoice]');
      var id = btn ? btn.getAttribute('data-open-invoice') : (row ? row.getAttribute('data-invoice') : null);
      if (id) openInvoice(id);
    });
  }

  // ── Instalments ────────────────────────────────────────────────────
  function renderInstalments(f) {
    var sec = $('#secInstalments');
    var host = $('[data-instalments]');
    host.textContent = '';
    if (!f.instalments.length) { sec.hidden = true; return; }
    sec.hidden = false;

    f.instalments.forEach(function (plan) {
      var box = el('div', 'acc-plan');
      var head = el('div', 'acc-plan__head');
      head.appendChild(el('span', 'acc-plan__name',
        plan.scope === 'full_programme' ? T.planProgramme : T.planLevel(plan.levelName || '')));
      head.appendChild(el('span', 'acc-plan__count', T.paidCount(plan.paidCount, plan.instalmentCount)));
      head.appendChild(moneyInto(el('span', 'acc-plan__total'), plan.total, { rate: false }));
      box.appendChild(head);

      var steps = el('ol', 'acc-steps');
      plan.schedule.forEach(function (s) {
        var li = el('li');
        li.setAttribute('data-state', s.state);
        li.appendChild(el('span', 'acc-steps__n', T.instalment(s.number, plan.instalmentCount)));
        var amt = el('span', 'acc-steps__amt');
        moneyInto(amt, s.amount, { rate: false });
        li.appendChild(amt);
        // `dueOn` is always null: instalment_plans carries no due date
        // and no adopted cadence, so no date is published. Saying that
        // is honest; printing a date would be a deadline the College
        // never set.
        li.appendChild(el('span', 'acc-steps__when',
          s.paidOn ? fmtDate(s.paidOn) : (s.dueOn ? fmtDate(s.dueOn) : T.noDueDate)));
        steps.appendChild(li);
      });
      box.appendChild(steps);
      host.appendChild(box);
    });
  }

  // ── One invoice ────────────────────────────────────────────────────
  function openInvoice(id) {
    api('/api/student/invoice?id=' + encodeURIComponent(id)).then(function (r) {
      if (!r.ok) return;
      var d = r.data;
      var sec = $('#secInvoice');
      sec.hidden = false;

      $('[data-invoice-kind]').textContent = T.kinds[d.invoice.kind] || d.invoice.kind;
      $('[data-invoice-title]').textContent = T.invoiceTitle;
      $('[data-invoice-ref]').textContent = d.invoice.id;
      $('[data-invoice-issued]').textContent = fmtDate(d.invoice.issuedOn);
      $('[data-invoice-settled]').textContent = d.invoice.settledOn ? fmtDate(d.invoice.settledOn) : T.unpaid;
      $('[data-invoice-receipt]').textContent = d.invoice.receiptNumber || T.noReceipt;

      var body = $('[data-invoice-lines]');
      body.textContent = '';
      d.lines.forEach(function (line) {
        var tr = el('tr');
        var td = el('td');
        td.appendChild(el('span', null, line.description));
        sourceInto(td, line.basis);
        if (line.authority) td.appendChild(el('p', 'acc-relief__note', line.authority));
        tr.appendChild(td);
        tr.appendChild(moneyInto(el('td', 'acc-num'), line.gross, { rate: false }));
        tr.appendChild(moneyInto(el('td', 'acc-num'), line.relief, { rate: false }));
        tr.appendChild(moneyInto(el('td', 'acc-num'), line.net, { rate: false }));
        body.appendChild(tr);
      });
      // TWO ROWS, not one. The columns are headed Gross / Relief / Net,
      // so the total row must carry the NET in the net column. Putting
      // `outstanding` there instead printed $791.67 net against $0.00 in
      // a column headed Net on a settled invoice — a figure that
      // contradicted its own heading. What is still owed on the invoice
      // is a different quantity and gets its own line.
      var totals = el('tr');
      totals.appendChild(el('td', null, T.total));
      totals.appendChild(moneyInto(el('td', 'acc-num'), d.totals.gross, { rate: false }));
      totals.appendChild(moneyInto(el('td', 'acc-num'), d.totals.relief, { rate: false }));
      totals.appendChild(moneyInto(el('td', 'acc-num'), d.totals.net, { rate: false }));
      body.appendChild(totals);

      var owed = el('tr');
      owed.appendChild(el('td', null, T.owedOnThis));
      owed.appendChild(el('td', 'acc-num', ''));
      owed.appendChild(el('td', 'acc-num', ''));
      owed.appendChild(moneyInto(el('td', 'acc-num'), d.totals.outstanding, { rate: false }));
      body.appendChild(owed);

      // What the gateway actually took, in the currency it took it in.
      // A recorded fact, never re-converted.
      $('[data-invoice-charged]').textContent = d.charged
        ? T.charged(d.charged.text, d.charged.currency) : '';

      var mm = $('[data-invoice-mismatch]');
      mm.hidden = d.reconciliation.matchesChargedAmount !== false;
      if (!mm.hidden) mm.textContent = T.mismatch;

      sec.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
      $('[data-invoice-close]').focus();
    });
  }

  function load() {
    api('/api/student/finance').then(function (r) {
      if (r.status === 401) { state(T.signedOut, T.signedOutRest); return; }
      if (!r.ok) { state(T.failed, T.failedRest); return; }
      $('#state').textContent = '';
      $('#scope').hidden = false;
      renderBalance(r.data);
      renderTuition(r.data);
      renderRelief(r.data);
      renderLedger(r.data);
      renderInstalments(r.data);
    }).catch(function () {
      state(T.failed, T.failedRest);
    });
  }

  document.addEventListener('DOMContentLoaded', function () {
    var close = $('[data-invoice-close]');
    if (close) {
      close.addEventListener('click', function () { $('#secInvoice').hidden = true; });
    }
    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape' && !$('#secInvoice').hidden) $('#secInvoice').hidden = true;
    });

    var cfg = window.WEC_LC_AUTH || {};
    if (cfg.clerkPublishableKey && typeof window.WEC_LC_loadClerk === 'function') {
      window.WEC_LC_loadClerk(cfg.clerkPublishableKey, function (err, clerk) {
        if (!err && clerk && clerk.session) {
          clerk.session.getToken().then(function (tok) {
            if (tok) authHeaders.Authorization = 'Bearer ' + tok;
            load();
          }).catch(load);
          return;
        }
        load();
      });
      return;
    }
    load();
  });
})();
