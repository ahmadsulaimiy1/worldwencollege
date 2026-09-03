/* WEC-LC — the conferral console.
 *
 * ─────────────────────────────────────────────────────────────────────
 * THE CERTIFICATE IS SHOWN BEFORE IT IS WRITTEN
 * ─────────────────────────────────────────────────────────────────────
 * `awards` stores the title, the post-nominal, the honour and the
 * citation DENORMALISED, precisely so that a certificate conferred in
 * 2027 still reads as it did on the day. The consequence for this
 * screen is that nothing on it can be corrected afterwards: a slip is
 * on somebody's certificate for ever.
 *
 * So the exact wording — every field, as the endpoint composed it from
 * `award_definitions`, the regulations and the marks — is rendered as a
 * facsimile above the act, and the only two writable controls on the
 * page are the citation and the public-roll consent. There is no field
 * for a title, a level, an honour or a credit count, because none of
 * those is a judgement a person makes at this moment.
 *
 * ─────────────────────────────────────────────────────────────────────
 * A REFUSAL IS A LIST, NOT A DISABLED BUTTON
 * ─────────────────────────────────────────────────────────────────────
 * Where an award cannot be conferred the conditions are drawn, each
 * with whose work it is, and the button is ABSENT rather than greyed.
 * A greyed control invites a Registrar to hunt for the thing that
 * ungreys it; a list of conditions tells them what would.
 *
 * ─────────────────────────────────────────────────────────────────────
 * AND WITHDRAWAL ASKS TWICE
 * ─────────────────────────────────────────────────────────────────────
 * Withdrawing an award takes a qualification back from a person and
 * publishes the fact to anybody who checks the code. The reason is
 * required by the library; the second confirmation is required here,
 * because the two acts on this page that cannot be undone should not
 * be one click apart from the ones that can.
 */
(function () {
  'use strict';

  var K = window.WEC_LC_staff;
  var AR = K.AR;
  var el = K.el;
  var $ = K.$;

  var T = AR ? {
    loading: 'جارٍ تحميل السجلّ…',
    eligibleHead: 'جاهزون للمنح',
    conditionalHead: 'ينتظرون الكلية',
    conferredHead: 'شهاداتٌ ممنوحة',
    candidateHead: 'المترشّح',
    conditionalBasis: 'هؤلاء أتمّوا كلَّ ما عليهم، وما بقي قيدٌ لم تصنعه الكليةُ بعد. وهم أوّل من تدين له الكليةُ بجواب.',
    emptyHead: 'لا أحدَ جاهزٌ للمنح الآن.',
    emptyNote: 'يظهر المترشّح هنا حين تُستوفى شروطُ مستواه كلُّها. وما ينتظر الكليةَ منها معروضٌ في القسم التالي.',
    open: 'افتح الملفّ',
    close: 'أغلق',
    level: function (r) { return 'المستوى ' + r; },
    mark: function (m) { return 'درجة المستوى ' + m + '٪'; },
    noMark: 'لا درجةَ مستوًى بعد',
    owner: { learner: 'على المتعلّم', college: 'على الكلية' },
    outstanding: 'ما بقي',
    willWrite: 'ما سيُكتب على الشهادة',
    conferredOn: 'مُنحت إلى',
    citation: 'التزكية (اختيارية)',
    citationNote: 'جملةٌ أو جملتان عن هذا الخرّيج. تُطبع على وجه الشهادة ولا تُعدَّل بعدها.',
    consent: 'يوافق الخرّيج على إدراجه في السجلّ العامّ',
    consentNote: 'دون هذه الموافقة لا يظهر الاسمُ في السجلّ المتصفَّح. ويبقى التحقّق بالرمز عاملًا في الحالين.',
    confer: 'امنح هذه الشهادة',
    conferring: 'جارٍ المنح…',
    conferred: function (c) { return 'مُنحت. رمزُ التحقّق ' + c; },
    cannot: 'لا يمكن المنح بعد',
    code: 'رمز التحقّق',
    withdraw: 'اسحب هذه الشهادة',
    withdrawConfirm: 'اسحبها نهائيًّا',
    withdrawCancel: 'تراجَع',
    withdrawWarn: 'السحبُ يسترجع مؤهّلًا من إنسان، ويُنشر لكلّ من يفحص الرمز. والسببُ يقرؤه صاحبُ الشهادة.',
    reason: 'السبب',
    withdrawing: 'جارٍ السحب…',
    verify: 'افحص',
    honour: 'المرتبة',
    credits: 'الوحدات',
    cefr: 'الإطار الأوروبي',
    postNominal: 'اللقب',
    title: 'عنوان الشهادة',
    standing: 'ما تمنحه',
    pendingHead: 'بانتظار توقيع ثانٍ',
    pendingWhy: 'الحوكمة C5: لا يُنفَّذ سحبٌ أو استبدالٌ إلا بتوقيع ضابطٍ آخر غير الذي اقترحه — لا يجوز لحسابٍ واحد أن يفعل الاثنين.',
    pendingEmpty: 'لا طلب ينتظر توقيعًا ثانيًا.',
    proposedWithdraw: function (w) { return 'اقتُرح سحبها بواسطة ' + w; },
    proposedReplace: function (w) { return 'اقتُرح استبدالها بواسطة ' + w; },
    countersign: 'وقِّع توقيعًا ثانيًا ونفِّذ',
    countersigning: 'جارٍ التنفيذ…',
    selfProposed: 'أنت من اقترح هذا — بانتظار ضابطٍ آخر',
    cancelRequest: 'ألغِ هذا الاقتراح',
    cancelling: 'جارٍ الإلغاء…',
    proposed: function (a) {
      return a === 'withdraw'
        ? 'اقتُرح السحب. لن يُنفَّذ إلا بتوقيع ضابطٍ آخر غير حسابك.'
        : 'اقتُرح الاستبدال. لن يُنفَّذ إلا بتوقيع ضابطٍ آخر غير حسابك.';
    },
  } : {
    loading: 'Loading the register…',
    eligibleHead: 'Ready to confer',
    conditionalHead: 'Waiting on the College',
    conferredHead: 'Awards held',
    candidateHead: 'The candidate',
    conditionalBasis: 'These learners have finished everything asked of them, and what remains is a record the College has not yet made. They are the first people the College owes an answer to.',
    emptyHead: 'Nobody is ready to confer.',
    emptyNote: 'A candidate appears here when every condition of their level is met. The ones held up by the College are in the next section.',
    open: 'Open the file',
    close: 'Close',
    level: function (r) { return 'Level ' + r; },
    mark: function (m) { return 'Level mark ' + m + '%'; },
    noMark: 'No level mark yet',
    owner: { learner: 'the learner’s', college: 'the College’s' },
    outstanding: 'What remains',
    willWrite: 'What will be written on the certificate',
    conferredOn: 'Conferred upon',
    citation: 'Citation (optional)',
    citationNote: 'One or two sentences about this graduate. It is printed on the face of the certificate and cannot be edited afterwards.',
    consent: 'The graduate consents to appear on the public roll',
    consentNote: 'Without this the name does not appear in the browsable register. Verification by code works either way.',
    confer: 'Confer this award',
    conferring: 'Conferring…',
    conferred: function (c) { return 'Conferred. Verification code ' + c; },
    cannot: 'This award cannot be conferred yet',
    code: 'Verification code',
    withdraw: 'Withdraw this award',
    withdrawConfirm: 'Withdraw it permanently',
    withdrawCancel: 'Cancel',
    withdrawWarn: 'Withdrawal takes a qualification back from a person and is published to anybody who checks the code. The reason is read by the holder.',
    reason: 'The reason',
    withdrawing: 'Withdrawing…',
    verify: 'Check',
    honour: 'Honour',
    credits: 'Credits',
    cefr: 'CEFR',
    postNominal: 'Post-nominal',
    title: 'Award title',
    standing: 'What it confers',
    pendingHead: 'Awaiting a second officer',
    pendingWhy: 'Governance C5: a withdrawal or replacement is not executed until a DIFFERENT officer than the one who proposed it countersigns it — one account may not do both.',
    pendingEmpty: 'No request is waiting on a countersignature.',
    proposedWithdraw: function (w) { return 'Withdrawal proposed by ' + w; },
    proposedReplace: function (w) { return 'Replacement proposed by ' + w; },
    countersign: 'Countersign and execute',
    countersigning: 'Executing…',
    selfProposed: 'You proposed this — awaiting a different officer',
    cancelRequest: 'Cancel this request',
    cancelling: 'Cancelling…',
    proposed: function (a) {
      return a === 'withdraw'
        ? 'Withdrawal proposed. It will not take effect until a different officer than your own account countersigns it.'
        : 'Replacement proposed. It will not take effect until a different officer than your own account countersigns it.';
    },
  };

  var me = null;

  function bdi(text) {
    var n = document.createElement('bdi');
    n.textContent = String(text);
    return n;
  }

  function fact(host, label, value) {
    if (value === null || value === undefined || value === '') return;
    var row = el('div', 'cnf-fact');
    row.appendChild(el('dt', null, label));
    var dd = el('dd');
    dd.appendChild(bdi(value));
    row.appendChild(dd);
    host.appendChild(row);
  }

  /* ── A ROW IN ONE OF THE THREE GROUPS ──────────────────────────── */

  function row(entry, kind) {
    var li = K.plate('li');
    li.appendChild(K.dome(kind === 'conferred' ? 'i-seal'
      : (kind === 'eligible' ? 'i-laurel' : 'i-hourglass')));

    var head = el('div', 'stf-item__head');
    var name = el('h3');
    name.appendChild(bdi(entry.name));
    head.appendChild(name);
    var chips = el('p', 'stf-item__chips');
    chips.appendChild(K.chip(T.level(K.ROMAN[entry.levelId] || entry.levelId)));
    if (entry.levelName) chips.appendChild(K.chip(entry.levelName));
    chips.appendChild(K.chip(entry.levelMark === null ? T.noMark : T.mark(entry.levelMark),
      entry.levelMark === null ? null : 'good'));
    head.appendChild(chips);
    li.appendChild(head);

    if (kind === 'conferred') {
      var got = el('p', 'stf-item__meta');
      if (entry.conferredOn) got.appendChild(el('span', null, K.when(entry.conferredOn)));
      if (entry.awardCode) {
        got.appendChild(el('span', null, ' · ' + T.code + ' '));
        var code = el('code', null, entry.awardCode);
        code.setAttribute('dir', 'ltr');
        got.appendChild(code);
      }
      li.appendChild(got);
    }

    // WHAT REMAINS, with whose work each item is. Drawn on the row
    // rather than hidden behind the file, because the whole value of
    // the middle group is being able to read it at a glance.
    //
    // NOT ON A CONFERRED ROW. The award is the fact there; the
    // conditions behind it are history, and seven lines of them under a
    // certificate already given reads as though something were still
    // wrong with it. The full set is one click away in the file.
    if (kind !== 'conferred' && entry.outstanding && entry.outstanding.length) {
      var list = el('ul', 'cnf-outstanding');
      list.setAttribute('aria-label', T.outstanding);
      entry.outstanding.forEach(function (c) {
        var item = el('li', 'cnf-outstanding__item cnf-outstanding__item--' + c.owner);
        item.appendChild(el('span', 'cnf-outstanding__owner', T.owner[c.owner] || c.owner));
        item.appendChild(bdi(c.label + ' — ' + c.detail));
        list.appendChild(item);
      });
      li.appendChild(list);
    }

    var open = el('button', 'acc-open', T.open);
    open.type = 'button';
    open.addEventListener('click', function () { loadCandidate(entry.userId, entry.levelId); });
    li.appendChild(open);
    return li;
  }

  /* ── THE FACSIMILE: exactly what will be written ───────────────── */

  function facsimile(award) {
    var box = el('section', 'cnf-facsimile');
    box.appendChild(el('h3', null, T.willWrite));

    var plate = el('div', 'cnf-plate');
    var title = el('p', 'cnf-plate__title');
    title.appendChild(bdi(award.awardTitle));
    plate.appendChild(title);
    plate.appendChild(el('p', 'cnf-plate__post', award.postNominal));
    plate.appendChild(el('p', 'cnf-plate__on', T.conferredOn));
    var holder = el('p', 'cnf-plate__holder');
    holder.appendChild(bdi(award.holderName));
    plate.appendChild(holder);
    box.appendChild(plate);

    var facts = el('dl', 'cnf-facts');
    fact(facts, T.title, award.awardTitle);
    fact(facts, T.postNominal, award.postNominal);
    fact(facts, T.cefr, award.cefr);
    fact(facts, T.honour, AR && award.honourLabelAr ? award.honourLabelAr : award.honourLabel);
    fact(facts, T.credits, award.credits);
    fact(facts, T.standing, award.standing);
    box.appendChild(facts);

    return box;
  }

  /* ── THE ACT ───────────────────────────────────────────────────── */

  function conferForm(view) {
    var form = el('form', 'cnf-form');
    form.setAttribute('novalidate', 'novalidate');

    var cLabel = el('label', 'cnf-label', T.citation);
    cLabel.setAttribute('for', 'cnfCitation');
    form.appendChild(cLabel);
    form.appendChild(el('p', 'cnf-note', T.citationNote));
    var citation = el('textarea');
    citation.id = 'cnfCitation';
    citation.rows = 3;
    citation.maxLength = 600;
    citation.setAttribute('dir', 'auto');
    form.appendChild(citation);

    var consentWrap = el('div', 'cnf-consent');
    var consent = el('input');
    consent.type = 'checkbox';
    consent.id = 'cnfConsent';
    var consentLabel = el('label', 'cnf-label', T.consent);
    consentLabel.setAttribute('for', 'cnfConsent');
    consentWrap.appendChild(consent);
    consentWrap.appendChild(consentLabel);
    form.appendChild(consentWrap);
    form.appendChild(el('p', 'cnf-note', T.consentNote));

    var go = el('button', 'btn btn--gold seal', T.confer);
    go.type = 'submit';
    form.appendChild(go);
    var says = el('p', 'cnf-says');
    says.setAttribute('aria-live', 'polite');
    form.appendChild(says);

    form.addEventListener('submit', function (e) {
      e.preventDefault();
      go.disabled = true;
      says.textContent = T.conferring;
      K.api('/api/admin/conferral?action=confer', {
        method: 'POST',
        body: JSON.stringify({
          userId: view.candidate.id,
          levelId: view.levelId,
          citation: citation.value,
          publicConsent: consent.checked,
        }),
      }).then(function (result) {
        says.textContent = T.conferred(result.award.verificationCode || result.award.code || '');
        loadCandidate(view.candidate.id, view.levelId, says.textContent);
        load();
      }).catch(function (err) {
        go.disabled = false;
        says.textContent = K.trouble(err);
      });
    });

    return form;
  }

  function withdrawForm(view) {
    var box = el('section', 'cnf-withdraw');
    box.appendChild(el('h3', null, T.withdraw));
    box.appendChild(el('p', 'cnf-note cnf-note--warn', T.withdrawWarn));

    var form = el('form', 'cnf-form');
    form.setAttribute('novalidate', 'novalidate');
    var rLabel = el('label', 'cnf-label', T.reason);
    rLabel.setAttribute('for', 'cnfReason');
    form.appendChild(rLabel);
    var reason = el('textarea');
    reason.id = 'cnfReason';
    reason.rows = 3;
    reason.required = true;
    reason.setAttribute('dir', 'auto');
    form.appendChild(reason);

    var says = el('p', 'cnf-says');
    says.setAttribute('aria-live', 'polite');

    // TWO STEPS. The confirming control does not exist in the document
    // until the first is pressed — see the head of this file.
    var start = el('button', 'btn btn--outline', T.withdraw);
    start.type = 'button';
    var confirmRow = el('div', 'cnf-confirm');
    confirmRow.hidden = true;
    var yes = el('button', 'btn btn--red', T.withdrawConfirm);
    yes.type = 'button';
    var no = el('button', 'btn btn--outline', T.withdrawCancel);
    no.type = 'button';
    confirmRow.appendChild(yes);
    confirmRow.appendChild(no);

    start.addEventListener('click', function () {
      if (!reason.value.trim()) { says.textContent = T.reason; reason.focus(); return; }
      start.hidden = true;
      confirmRow.hidden = false;
      yes.focus();
    });
    no.addEventListener('click', function () {
      confirmRow.hidden = true;
      start.hidden = false;
      start.focus();
    });
    yes.addEventListener('click', function () {
      yes.disabled = true;
      says.textContent = T.withdrawing;
      // 'action=withdraw' PROPOSES the withdrawal — it does not execute
      // it. See registry/conferral.js's head comment: governance C5
      // requires a different officer's countersignature before the
      // award is actually touched.
      K.api('/api/admin/conferral?action=withdraw', {
        method: 'POST',
        body: JSON.stringify({ awardId: view.awardId, reason: reason.value }),
      }).then(function () {
        // The note travels AS loadCandidate's argument, not as this
        // element's own textContent: loadCandidate() calls
        // drawCandidate(), which clears and rebuilds the whole host —
        // including this paragraph — so a message set on it here would
        // never be seen.
        loadCandidate(view.candidate.id, view.levelId, T.proposed('withdraw'));
        loadPending();
        load();
      }).catch(function (err) {
        yes.disabled = false;
        confirmRow.hidden = true;
        start.hidden = false;
        says.textContent = K.trouble(err);
      });
    });

    form.appendChild(start);
    form.appendChild(confirmRow);
    form.appendChild(says);
    box.appendChild(form);
    return box;
  }

  function drawCandidate(view, note) {
    var host = $('[data-candidate]');
    host.textContent = '';
    $('#secCandidate').hidden = false;
    $('[data-candidate-head]').textContent = view.candidate.name || view.candidate.id;
    $('[data-candidate-close]').textContent = T.close;

    if (note) {
      var said = el('p', 'cnf-said', note);
      said.setAttribute('role', 'status');
      host.appendChild(said);
    }

    if (view.award) host.appendChild(facsimile(view.award));

    // THE CONDITIONS, always — met and unmet. A Registrar about to
    // confer should read the whole set, not only what is missing.
    if (view.position && view.position.conditions) {
      var conds = el('section', 'cnf-conditions');
      conds.appendChild(el('h3', null, T.outstanding));
      var list = el('ul');
      view.position.conditions.forEach(function (c) {
        var li = el('li', 'cnf-condition cnf-condition--'
          + (c.met === true ? 'met' : (c.met === false ? 'unmet' : 'unknown')));
        li.appendChild(el('span', 'cnf-condition__mark',
          c.met === true ? '✓' : (c.met === false ? '✗' : '—')));
        li.appendChild(bdi(c.label + ' — ' + c.detail));
        if (c.met !== true) li.appendChild(K.chip(T.owner[c.owner] || c.owner));
        list.appendChild(li);
      });
      conds.appendChild(list);
      host.appendChild(conds);
    }

    if (view.mayConfer) {
      host.appendChild(conferForm(view));
    } else {
      // A LIST, NOT A DISABLED BUTTON. See the head of this file.
      var no = el('section', 'cnf-blocked');
      no.appendChild(el('h3', null, T.cannot));
      var ul = el('ul');
      view.blockers.forEach(function (b) {
        var li = el('li');
        li.appendChild(el('span', 'cnf-outstanding__owner', T.owner[b.owner] || b.owner));
        li.appendChild(bdi(b.detail));
        ul.appendChild(li);
      });
      no.appendChild(ul);
      host.appendChild(no);
    }

    if (view.position && view.position.state === 'conferred' && view.awardId) {
      host.appendChild(withdrawForm(view));
    }

    K.rise(host);
    $('#secCandidate').scrollIntoView({ block: 'start', behavior: 'smooth' });
  }

  function loadCandidate(userId, levelId, note) {
    K.api('/api/admin/conferral?userId=' + encodeURIComponent(userId) + '&levelId=' + encodeURIComponent(levelId))
      .then(function (view) { drawCandidate(view, note); })
      .catch(function (err) { $('#state').textContent = K.trouble(err); });
  }

  /* ── THE SECOND OFFICER'S QUEUE ───────────────────────────────────
   * Every withdrawal or replacement proposed and not yet countersigned
   * or cancelled, per governance C5 — see the head of this file and
   * registry/conferral.js. `me` (the signed-in Registrar, read once in
   * K.boot) decides which control a row offers: countersign, if this
   * account did not propose it, or cancel, if it did. Neither the
   * server nor this page ever lets one account do both. */

  function pendingRow(request) {
    var li = K.plate('li');
    li.appendChild(K.dome('i-hourglass'));

    var head = el('div', 'stf-item__head');
    var name = el('h3');
    name.appendChild(bdi(request.holderName || request.verificationCode || request.awardId));
    head.appendChild(name);
    var chips = el('p', 'stf-item__chips');
    chips.appendChild(K.chip(request.action === 'withdraw' ? T.proposedWithdraw(request.proposedByName || request.proposedByEmail)
      : T.proposedReplace(request.proposedByName || request.proposedByEmail)));
    head.appendChild(chips);
    li.appendChild(head);

    var meta = el('p', 'stf-item__meta');
    meta.appendChild(el('span', null, K.when(request.proposedAt)));
    li.appendChild(meta);

    if (request.reason) {
      var reasonP = el('p', 'cnf-note');
      reasonP.appendChild(bdi(request.reason));
      li.appendChild(reasonP);
    }

    var says = el('p', 'cnf-says');
    says.setAttribute('aria-live', 'polite');

    if (me && me.id !== request.proposedBy) {
      var go = el('button', 'btn btn--gold seal', T.countersign);
      go.type = 'button';
      go.addEventListener('click', function () {
        go.disabled = true;
        says.textContent = T.countersigning;
        K.api('/api/admin/conferral?action=countersign', {
          method: 'POST',
          body: JSON.stringify({ requestId: request.id }),
        }).then(function () {
          loadPending();
          load();
        }).catch(function (err) {
          go.disabled = false;
          says.textContent = K.trouble(err);
        });
      });
      li.appendChild(go);
    } else {
      li.appendChild(el('p', 'cnf-note', T.selfProposed));
      var cancel = el('button', 'btn btn--outline', T.cancelRequest);
      cancel.type = 'button';
      cancel.addEventListener('click', function () {
        cancel.disabled = true;
        says.textContent = T.cancelling;
        K.api('/api/admin/conferral?action=cancel_request', {
          method: 'POST',
          body: JSON.stringify({ requestId: request.id }),
        }).then(function () {
          loadPending();
        }).catch(function (err) {
          cancel.disabled = false;
          says.textContent = K.trouble(err);
        });
      });
      li.appendChild(cancel);
    }

    li.appendChild(says);
    return li;
  }

  function loadPending() {
    return K.api('/api/admin/conferral?pending=1').then(function (payload) {
      var requests = payload.requests || [];
      $('[data-pending-head]').textContent = T.pendingHead;
      $('[data-pending-why]').textContent = T.pendingWhy;

      var host = $('[data-pending]');
      host.textContent = '';
      requests.forEach(function (r) { host.appendChild(pendingRow(r)); });

      var empty = $('[data-pending-empty]');
      empty.hidden = requests.length > 0;
      if (!requests.length) $('[data-pending-empty-note]').textContent = T.pendingEmpty;

      $('#secPending').hidden = false;
      K.rise(host);
    });
  }

  /* ── LOAD ──────────────────────────────────────────────────────── */

  function fill(hostSel, entries, kind) {
    var host = $(hostSel);
    host.textContent = '';
    entries.forEach(function (e) { host.appendChild(row(e, kind)); });
  }

  function load() {
    $('#state').textContent = T.loading;
    K.api('/api/admin/conferral')
      .then(function (payload) {
        $('#state').textContent = '';

        $('[data-basis]').textContent = payload.basis;
        $('[data-conditional-basis]').textContent = T.conditionalBasis;
        $('[data-eligible-head]').textContent = T.eligibleHead;
        $('[data-conditional-head]').textContent = T.conditionalHead;
        $('[data-conferred-head]').textContent = T.conferredHead;

        fill('[data-eligible]', payload.eligible, 'eligible');
        fill('[data-conditional]', payload.conditional, 'conditional');
        fill('[data-conferred]', payload.conferred, 'conferred');

        var empty = $('[data-eligible-empty]');
        empty.hidden = payload.eligible.length > 0;
        if (!payload.eligible.length) {
          $('[data-eligible-empty-head]').textContent = T.emptyHead;
          $('[data-eligible-empty-note]').textContent = T.emptyNote;
        }

        $('#secEligible').hidden = false;
        $('#secConditional').hidden = !payload.conditional.length;
        $('#secConferred').hidden = !payload.conferred.length;

        [['eligible', payload.eligible.length], ['conditional', payload.conditional.length],
          ['conferred', payload.conferred.length]].forEach(function (pair) {
          var box = document.querySelector('[data-tile="' + pair[0] + '"]');
          if (box) box.querySelector('[data-count]').textContent = String(pair[1]);
        });
        $('#secCounts').hidden = false;

        K.rise(document.querySelector('.stf-shell'));
      })
      .catch(function (err) { $('#state').textContent = K.trouble(err); });
  }

  K.boot(function () {
    $('[data-candidate-close]').addEventListener('click', function () {
      $('#secCandidate').hidden = true;
    });
    // The account is read FIRST: pendingRow() decides whether a row
    // offers "countersign" or "cancel" by comparing it against `me`,
    // and a queue drawn before that comparison is possible would have
    // to guess.
    K.api('/api/auth/me').then(function (u) {
      me = u;
      return loadPending();
    }).catch(function (err) { $('#state').textContent = K.trouble(err); });
    load();
  });
})();
