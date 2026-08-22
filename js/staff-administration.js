/* WEC-LC — The Administration.
 *
 * The interface for the College's own instruments:
 *   GET  /api/admin/institutional-metrics
 *   GET  /api/admin/evidence
 *   GET  /api/admin/quality/competency-coverage
 *   GET  /api/admin/signing-keys
 *   GET  /POST /api/admin/institutions
 *   POST /api/admin/currency/set-rate  ·  /refresh-rates
 *   POST /api/admin/recordings/purge
 *
 * ─────────────────────────────────────────────────────────────────────
 * EACH BLOCK STANDS OR FAILS ALONE
 * ─────────────────────────────────────────────────────────────────────
 * Three of these are staff-readable and four are administrator-only, so
 * a tutor opening this page legitimately meets a mixture. Every block
 * is loaded independently and hidden if its endpoint refuses — a page
 * that showed nothing because one of seven reads returned 403 would
 * make a permission boundary look like an outage.
 *
 * ─────────────────────────────────────────────────────────────────────
 * A SUPPRESSED FIGURE IS NOT A MISSING ONE
 * ─────────────────────────────────────────────────────────────────────
 * The metric register distinguishes `measured`, `insufficient_data` and
 * `suppressed`, and the third of those is a decision rather than a gap:
 * a rate over a cohort small enough to identify somebody is withheld,
 * not rounded. All three are rendered as themselves, with the register's
 * own caveat printed above them.
 *
 * ─────────────────────────────────────────────────────────────────────
 * THE KEY IS SHOWN ONCE
 * ─────────────────────────────────────────────────────────────────────
 * A newly issued institution key exists in readable form for exactly
 * one response; it is stored as a hash and cannot be shown again. The
 * page says so beside it, before the person closes the tab.
 *
 * ─────────────────────────────────────────────────────────────────────
 * AND A PURGE ASKS TWICE
 * ─────────────────────────────────────────────────────────────────────
 * The retention run is a dry run first and always: it reports what
 * WOULD be destroyed, and only then offers the button that destroys it.
 * The confirming button does not exist in the page until the dry run
 * has been read.
 */
(function () {
  'use strict';

  var K = window.WEC_LC_staff;
  var $ = K.$;
  var AR = K.AR;

  var T = AR ? {
    loading: 'جارٍ تحميل الآلات…',
    ready: 'آلاتُ الكلّية.',
    readyRest: 'ما تقيسه على نفسها، وما تستطيع إثباته، وما توقّع به.',
    metricsHead: 'سِجلُّ المؤشّرات المؤسّسيّة',
    states: { measured: 'مقيس', insufficient_data: 'لا بياناتٍ تكفي', suppressed: 'محجوب' },
    closesWith: 'يُغلقه: ',
    evidenceHead: 'سِجلُّ الأدلّة',
    evidenceStateLabel: 'الحال',
    evidenceAll: 'كلُّ الأحوال',
    evidenceStates: [
      ['', 'كلُّ الأحوال'], ['evidenced', 'مُثبَت'], ['partial', 'جزئيّ'],
      ['planned', 'مخطَّط'], ['not_started', 'لم يُبدأ'],
    ],
    evidenceShape: function (t, c) {
      return 'في السِّجلّ ' + t + ' بندًا عبر ' + c + ' مجموعة.';
    },
    evidenceEmptyCollections: 'مجموعاتٌ لا بندَ فيها بعد',
    evidenceEmptyNote: 'يُذكَر ما لا بندَ فيه بالاسم لا بالفراغ: المجموعةُ الخاليةُ سؤالٌ لم يُجَب عنه بعد، والفراغُ لا يقول ذلك.',
    coverageHead: 'تغطية الكفايات',
    coverageMet: 'مستوفًى',
    coverageShort: 'ناقص',
    assessments: function (n, m) { return n + ' تقويمًا، منها ' + m + ' مرتبطٌ بكفاية'; },
    keysHead: 'مفاتيح التوقيع',
    keysNote: 'يُقرأ السِّجلُّ ههنا ولا يُدار: إبطالُ مفتاحٍ يُبطل كلَّ شهادةٍ وقّعها، وذاك فعلٌ يُجرى قصدًا على قاعدة البيانات لا بطلبٍ من متصفّح.',
    keyActive: 'قائم',
    signedN: function (n) { return n + ' توقيعًا'; },
    instHead: 'المؤسّسات المستعلِمة',
    instAddHead: 'سجِّل مؤسّسة',
    instAddWhy: 'مَنحُ مؤسّسةٍ استعلامًا آليًّا عن سجلّ الخرّيجين قرارٌ مؤسّسيٌّ لا تدريسيّ. ويظهر المفتاحُ مرّةً واحدةً ولا يُعرَض ثانيةً؛ فهو محفوظٌ بصمةً لا نصًّا.',
    instName: 'اسم المؤسّسة',
    instKind: 'نوعها',
    instKinds: [['university', 'جامعة'], ['employer', 'جهة عمل'], ['government', 'جهة حكوميّة'], ['other', 'أخرى']],
    instLimit: 'الحدُّ اليوميّ',
    instLimitNote: 'أكبرُ عددٍ من الاستعلامات في أربعٍ وعشرين ساعة. والحدُّ يجعل الاستعلامَ الآليَّ مرئيًّا ومحدودًا.',
    instAdd: 'سجِّلها',
    instAdding: 'جارٍ التسجيل…',
    instAdded: 'سُجِّلت.',
    instNeedName: 'الاسم مطلوب.',
    instKeyLabel: 'المفتاح، ويُعرَض مرّةً واحدة',
    instKeyWarning: 'انسخه الآن. لا يُعرَض ثانيةً، ولا يمكن استرجاعه؛ وإن ضاع فالسبيلُ تسجيلُ مفتاحٍ جديد.',
    instActivityNote: 'ما استعلمته المؤسّساتُ المسجَّلة، أحدثُه أوّلًا. والاستعلامُ الآليُّ مقيَّدٌ باسم صاحبه، بخلاف تحقُّقِ صاحب العمل من رمزٍ ناوله إيّاه خرّيج.',
    outcomes: { verified: 'تحقَّق', not_found: 'غير موجود', rate_limited: 'جاوز الحدّ', unauthorised: 'غير مأذون' },
    ratesHead: 'أسعار الصرف',
    ratesWhy: 'يغيّر هذا ما يُطالَب به المتعلّم. وسعرُ السياسة الثابت اختيارُ الكلّية ألّا تُعوِّم رسمَ تلك العملة مع سوق الصرف، وهو خيارٌ مؤسّسيٌّ مشروع.',
    ratesCode: 'رمز العملة',
    ratesRate: 'كم منها للدولار الواحد',
    ratesRateNote: 'رقمٌ موجب. وهو عددُ وحدات هذه العملة مقابل دولارٍ واحد.',
    ratesActivate: 'هل تُفتَح عند الدفع',
    ratesActivateOptions: [['false', 'لا — اضبط السعر ولا تفتحها'], ['true', 'نعم — اضبطه وافتحها']],
    ratesActivateNote: 'الفتحُ خطوةٌ منفصلةٌ عن الضبط قصدًا، حتّى يُهيَّأ السعرُ قبل أن تُعرَض العملةُ على أحد.',
    ratesSet: 'اضبط السعر',
    ratesRefresh: 'حدِّثه من التغذية الحيّة',
    ratesWorking: 'جارٍ التنفيذ…',
    ratesDone: 'نُفِّذ.',
    ratesNeedCode: 'رمز العملة مطلوب.',
    ratesNeedRate: 'السعر مطلوب.',
    purgeHead: 'مدّة الحفظ',
    purgeWhy: 'يُتلِف هذا تسجيلاتِ المتعلّمين التي انقضت مدّةُ حفظها. ويبدأ دائمًا بتجربةٍ تقول ما سيُتلَف، ولا يظهر زرُّ الإتلاف قبل قراءتها.',
    purgeDry: 'أرِني ما سيُتلَف',
    purgeConfirm: 'أتلِفها',
    purgeWorking: 'جارٍ الفحص…',
    purgeDone: function (n) { return 'أُتلِف ' + n + '.'; },
    purgeExamined: function (n, p) { return 'فُحص ' + n + '، وسيُتلَف منها ' + p + '.'; },
    purgeNothing: 'لا تسجيلَ انقضت مدّتُه.',
  } : {
    loading: 'Loading the instruments…',
    ready: 'The College’s instruments.',
    readyRest: 'What it measures about itself, what it can evidence, and what it signs with.',
    metricsHead: 'The Institutional Metric Register',
    states: { measured: 'Measured', insufficient_data: 'Not enough data', suppressed: 'Withheld' },
    closesWith: 'Closed by: ',
    evidenceHead: 'The evidence register',
    evidenceStateLabel: 'State',
    evidenceAll: 'Every state',
    evidenceStates: [
      ['', 'Every state'], ['evidenced', 'Evidenced'], ['partial', 'Partial'],
      ['planned', 'Planned'], ['not_started', 'Not started'],
    ],
    evidenceShape: function (t, c) {
      return 'The register holds ' + t + (t === 1 ? ' item' : ' items') + ' across ' + c + ' collections.';
    },
    evidenceEmptyCollections: 'Collections holding nothing yet',
    evidenceEmptyNote: 'What holds nothing is named rather than left blank: an empty collection is a question the College has not answered yet, and a blank does not say that.',
    coverageHead: 'Competency coverage',
    coverageMet: 'Met',
    coverageShort: 'Short',
    assessments: function (n, m) { return n + ' assessments, ' + m + ' mapped to a competency'; },
    keysHead: 'Signing keys',
    keysNote: 'The register is read here and not managed here: revoking a key invalidates every credential it ever signed, and that is an act run deliberately against the database rather than reachable by a request.',
    keyActive: 'Active',
    signedN: function (n) { return n + (n === 1 ? ' signature' : ' signatures'); },
    instHead: 'Verifying institutions',
    instAddHead: 'Register an institution',
    instAddWhy: 'Granting an institution bulk automated access to graduate records is an institutional decision, not a teaching one. The key is shown once and never again — it is stored as a hash, not as text.',
    instName: 'The institution’s name',
    instKind: 'Kind',
    instKinds: [['university', 'University'], ['employer', 'Employer'], ['government', 'Government'], ['other', 'Other']],
    instLimit: 'Daily limit',
    instLimitNote: 'The most queries it may make in twenty-four hours. The limit is what keeps automated verification visible and bounded.',
    instAdd: 'Register it',
    instAdding: 'Registering…',
    instAdded: 'Registered.',
    instNeedName: 'A name is required.',
    instKeyLabel: 'The key, shown once',
    instKeyWarning: 'Copy it now. It is not shown again and cannot be recovered — a lost key is replaced by registering a new one.',
    instActivityNote: 'What the registered institutions have queried, most recent first. Automated verification is attributed to the institution making it, unlike an employer checking a code a graduate handed them.',
    outcomes: { verified: 'Verified', not_found: 'Not found', rate_limited: 'Over its limit', unauthorised: 'Not authorised' },
    ratesHead: 'Exchange rates',
    ratesWhy: 'This changes what a learner is charged. A policy-fixed rate is the College choosing not to float that currency’s tuition with the daily market — a legitimate institutional choice.',
    ratesCode: 'Currency code',
    ratesRate: 'How many of it to one US dollar',
    ratesRateNote: 'A positive number: how much of this currency one US dollar buys. (The word the currency layer uses for this is retired from published pages — it means three different things elsewhere in this institution.)',
    ratesActivate: 'Offer it at checkout',
    ratesActivateOptions: [['false', 'No — set the rate and leave it closed'], ['true', 'Yes — set it and open it']],
    ratesActivateNote: 'Opening a currency is a separate step from pricing it, deliberately, so a rate can be staged before anyone is offered it.',
    ratesSet: 'Set the rate',
    ratesRefresh: 'Refresh from the live feed',
    ratesWorking: 'Working…',
    ratesDone: 'Done.',
    ratesNeedCode: 'A currency code is required.',
    ratesNeedRate: 'A rate is required.',
    purgeHead: 'Retention',
    purgeWhy: 'This destroys learner recordings whose retention period has run out. It always begins with a dry run saying what would go, and the destroying button does not appear until that has been read.',
    purgeDry: 'Show me what would go',
    purgeConfirm: 'Destroy them',
    purgeWorking: 'Working…',
    purgeDone: function (n) { return n + ' destroyed.'; },
    purgeExamined: function (n, p) { return n + ' examined; ' + p + ' would be destroyed.'; },
    purgeNothing: 'Nothing has passed its retention period.',
  };

  function detail(e) {
    if (!e.fields) return K.trouble(e);
    return K.trouble(e) + ' — ' + Object.keys(e.fields).map(function (k) {
      return k + ': ' + e.fields[k];
    }).join('; ');
  }

  /** A value object rendered as a line of readings rather than JSON. */
  function readings(value) {
    if (value === null || value === undefined) return '';
    if (typeof value !== 'object') return String(value);
    return Object.keys(value).map(function (k) {
      var v = value[k];
      return k + ': ' + (v && typeof v === 'object' ? JSON.stringify(v) : String(v));
    }).join(' · ');
  }

  /* ── THE METRIC REGISTER ───────────────────────────────────────────── */

  function loadMetrics() {
    return K.api('/api/admin/institutional-metrics').then(function (d) {
      $('[data-metrics-head]').textContent = T.metricsHead;
      $('[data-metrics-caveat]').textContent = d.caveat || '';

      var summary = $('[data-metrics-summary]');
      summary.textContent = '';
      ['measured', 'insufficient_data', 'suppressed'].forEach(function (state) {
        var tile = K.el('div', 'stf-count plate-dark card card--dark edge-lit aurum tilt gold-live reveal');
        tile.setAttribute('data-tile', state);
        var sheen = K.el('span', 'tilt__sheen');
        sheen.setAttribute('aria-hidden', 'true');
        tile.appendChild(sheen);
        tile.appendChild(K.dome(state === 'measured' ? 'i-struck' : 'i-ring', true));
        tile.appendChild(K.el('p', 'stf-count__num', String((d.summary && d.summary[state]) || 0)));
        tile.appendChild(K.el('p', 'stf-count__label', T.states[state]));
        summary.appendChild(tile);
      });

      var list = $('[data-metrics]');
      list.textContent = '';
      (d.metrics || []).forEach(function (m) {
        var li = K.plate('li');
        var head = K.el('div', 'stf-item__head');
        head.appendChild(K.dome(m.state === 'measured' ? 'i-struck' : 'i-ring'));
        var who = K.el('div', 'stf-item__who');
        who.appendChild(K.el('p', 'stf-item__name', m.name || m.id));
        who.appendChild(K.el('p', 'stf-item__where', m.question || ''));
        var marks = K.el('div', 'stf-item__marks');
        marks.appendChild(K.chip(T.states[m.state] || m.state,
          m.state === 'measured' ? 'answered' : (m.state === 'suppressed' ? 'pinned' : 'muted')));
        who.appendChild(marks);
        head.appendChild(who);
        li.appendChild(head);

        var panel = K.el('div', 'stf-panel');
        var box = K.el('div', 'stf-work');
        if (m.value) box.appendChild(K.el('p', null, readings(m.value)));
        if (m.closes) box.appendChild(K.el('p', null, T.closesWith + m.closes));
        if (m.requires) box.appendChild(K.el('p', null, m.requires));
        if (!box.childNodes.length) box.appendChild(K.el('p', null, '—'));
        panel.appendChild(box);
        li.appendChild(panel);
        list.appendChild(li);
      });
      $('#secMetrics').hidden = false;
    }).catch(function () { $('#secMetrics').hidden = true; });
  }

  /* ── THE EVIDENCE REGISTER ─────────────────────────────────────────── */

  function loadEvidence() {
    var state = $('[data-evidence-state]').value;
    return K.api('/api/admin/evidence' + (state ? '?state=' + state : '')).then(function (d) {
      $('[data-evidence-head]').textContent = T.evidenceHead;
      $('[data-evidence-disclaimer]').textContent = d.disclaimer || '';
      var list = $('[data-evidence]');
      list.textContent = '';

      // THE SHAPE OF THE REGISTER, ALWAYS — including when it is empty.
      // It ships with twenty-three collections and no items, and a
      // console that rendered that as a blank list would be reporting
      // "nothing to see" where the truth is "twenty-three questions,
      // none of them answered yet". The collections holding nothing are
      // named, because naming them is the whole content of an empty
      // register.
      var summary = d.summary || {};
      if (typeof summary.total === 'number') {
        var shape = K.plate('li');
        var shead = K.el('div', 'stf-item__head');
        shead.appendChild(K.dome(summary.total ? 'i-struck' : 'i-ring'));
        var swho = K.el('div', 'stf-item__who');
        swho.appendChild(K.el('p', 'stf-item__name',
          T.evidenceShape(summary.total, summary.collections || 0)));
        var smarks = K.el('div', 'stf-item__marks');
        if (summary.evidenced) smarks.appendChild(K.chip(String(summary.evidenced), 'answered'));
        if (summary.overdueReviews) smarks.appendChild(K.chip(String(summary.overdueReviews), 'unread'));
        swho.appendChild(smarks);
        shead.appendChild(swho);
        shape.appendChild(shead);

        var empties = summary.collectionsWithNoItems || [];
        if (empties.length) {
          var panel = K.el('div', 'stf-panel');
          panel.appendChild(K.el('p', 'stf-panel__label', T.evidenceEmptyCollections));
          var box = K.el('div', 'stf-work');
          empties.forEach(function (name) { box.appendChild(K.el('p', null, name)); });
          panel.appendChild(box);
          shape.appendChild(panel);
          shape.appendChild(K.el('p', 'stf-field__note', T.evidenceEmptyNote));
        }
        list.appendChild(shape);
      }

      (d.items || []).forEach(function (i) {
        var li = K.plate('li');
        var head = K.el('div', 'stf-item__head');
        head.appendChild(K.dome(i.state === 'evidenced' ? 'i-struck' : 'i-ring'));
        var who = K.el('div', 'stf-item__who');
        who.appendChild(K.el('p', 'stf-item__name', i.title || i.reference || ''));
        who.appendChild(K.el('p', 'stf-item__where', i.reference || ''));
        var marks = K.el('div', 'stf-item__marks');
        if (i.state) marks.appendChild(K.chip(i.state, i.state === 'evidenced' ? 'answered' : 'muted'));
        if (i.reviewStatus) {
          marks.appendChild(K.chip(i.reviewStatus,
            i.reviewStatus === 'overdue' ? 'unread' : null));
        }
        who.appendChild(marks);
        head.appendChild(who);
        li.appendChild(head);
        if (i.statement) {
          var panel = K.el('div', 'stf-panel');
          var box = K.el('div', 'stf-work');
          K.prose(box, i.statement);
          panel.appendChild(box);
          li.appendChild(panel);
        }
        list.appendChild(li);
      });
      $('#secEvidence').hidden = false;
    }).catch(function () { $('#secEvidence').hidden = true; });
  }

  /* ── COMPETENCY COVERAGE ───────────────────────────────────────────── */

  function loadCoverage() {
    return K.api('/api/admin/quality/competency-coverage').then(function (d) {
      $('[data-coverage-head]').textContent = T.coverageHead;
      $('[data-coverage-rule]').textContent = (d.rule || '') + (d.source ? ' — ' + d.source : '');
      var list = $('[data-coverage]');
      list.textContent = '';
      (d.levels || []).forEach(function (l) {
        var li = K.plate('li');
        var head = K.el('div', 'stf-item__head');
        var short = (l.perCompetency || []).filter(function (c) { return !c.meetsRule; }).length;
        head.appendChild(K.dome(short ? 'i-ring' : 'i-struck'));
        var who = K.el('div', 'stf-item__who');
        who.appendChild(K.el('p', 'stf-item__name', K.levelWord(l.levelId) + ' · ' + (l.levelName || '')));
        who.appendChild(K.el('p', 'stf-item__where',
          T.assessments(l.assessmentsTotal || 0, l.assessmentsMapped || 0)));
        var marks = K.el('div', 'stf-item__marks');
        (l.perCompetency || []).forEach(function (c) {
          marks.appendChild(K.chip(c.name + ' · ' + c.assessments,
            c.meetsRule ? 'answered' : 'unread'));
        });
        who.appendChild(marks);
        head.appendChild(who);
        li.appendChild(head);
        list.appendChild(li);
      });
      $('#secCoverage').hidden = false;
    }).catch(function () { $('#secCoverage').hidden = true; });
  }

  /* ── SIGNING KEYS ──────────────────────────────────────────────────── */

  function loadKeys() {
    return K.api('/api/admin/signing-keys').then(function (d) {
      $('[data-keys-head]').textContent = T.keysHead;
      $('[data-keys-note]').textContent = T.keysNote + (d.notice ? ' ' + d.notice : '');
      var list = $('[data-keys]');
      list.textContent = '';
      (d.keys || []).forEach(function (k) {
        var li = K.plate('li');
        var head = K.el('div', 'stf-item__head');
        head.appendChild(K.dome('i-key'));
        var who = K.el('div', 'stf-item__who');
        who.appendChild(K.el('p', 'stf-item__name', k.kid || ''));
        who.appendChild(K.el('p', 'stf-item__where',
          [k.alg, k.kty, k.crv].filter(Boolean).join(' · ')));
        var marks = K.el('div', 'stf-item__marks');
        marks.appendChild(K.chip(T.keyActive, 'answered'));
        if (d.mode) marks.appendChild(K.chip(d.mode));
        who.appendChild(marks);
        head.appendChild(who);
        li.appendChild(head);
        list.appendChild(li);
      });
      if (typeof d.count === 'number') {
        list.appendChild(K.el('p', 'stf-field__note', T.signedN(d.count)));
      }
      $('#secKeys').hidden = false;
    }).catch(function () { $('#secKeys').hidden = true; });
  }

  /* ── VERIFYING INSTITUTIONS ────────────────────────────────────────── */

  function loadInstitutions() {
    return K.api('/api/admin/institutions').then(function (d) {
      $('[data-inst-head]').textContent = T.instHead;
      $('[data-inst-add-head]').textContent = T.instAddHead;
      $('[data-inst-add-why]').textContent = T.instAddWhy;
      $('[data-inst-name-label]').textContent = T.instName;
      $('[data-inst-kind-label]').textContent = T.instKind;
      $('[data-inst-limit-label]').textContent = T.instLimit;
      $('[data-inst-limit-note]').textContent = T.instLimitNote;
      $('[data-inst-send]').textContent = T.instAdd;
      $('[data-inst-activity-note]').textContent = T.instActivityNote;
      K.fillOptions($('[data-inst-kind]'), T.instKinds);

      var list = $('[data-inst-activity]');
      list.textContent = '';
      (d.checks || []).forEach(function (c) {
        var li = K.plate('li');
        var head = K.el('div', 'stf-item__head');
        head.appendChild(K.dome(c.outcome === 'verified' ? 'i-struck' : 'i-ring'));
        var who = K.el('div', 'stf-item__who');
        who.appendChild(K.el('p', 'stf-item__name', c.institutionName || c.institutionId || ''));
        who.appendChild(K.el('p', 'stf-item__where', K.when(c.checkedAt, true)));
        var marks = K.el('div', 'stf-item__marks');
        marks.appendChild(K.chip(T.outcomes[c.outcome] || c.outcome,
          c.outcome === 'verified' ? 'answered' : 'muted'));
        if (c.kind) marks.appendChild(K.chip(c.kind));
        who.appendChild(marks);
        head.appendChild(who);
        li.appendChild(head);
        list.appendChild(li);
      });
      $('#secInstitutions').hidden = false;
    }).catch(function () { $('#secInstitutions').hidden = true; });
  }

  function registerInstitution() {
    var said = $('[data-inst-said]');
    var name = $('[data-inst-name]').value.trim();
    if (!name) {
      said.setAttribute('data-tone', 'bad');
      said.textContent = T.instNeedName;
      $('[data-inst-name]').focus();
      return;
    }
    var btn = $('[data-inst-send]');
    btn.disabled = true;
    said.removeAttribute('data-tone');
    said.textContent = T.instAdding;
    K.api('/api/admin/institutions', {
      method: 'POST',
      body: JSON.stringify({
        name: name,
        kind: $('[data-inst-kind]').value,
        dailyLimit: Number($('[data-inst-limit]').value) || 500,
      }),
    }).then(function (r) {
      btn.disabled = false;
      said.setAttribute('data-tone', 'good');
      said.textContent = T.instAdded;
      $('[data-inst-name]').value = '';
      // The one moment this value exists in readable form.
      var box = $('[data-inst-key]');
      $('[data-inst-key-label]').textContent = T.instKeyLabel;
      $('[data-inst-key-value]').textContent = r.apiKey || '';
      $('[data-inst-key-warning]').textContent = T.instKeyWarning;
      box.hidden = false;
      return loadInstitutions();
    }).catch(function (e) {
      btn.disabled = false;
      said.setAttribute('data-tone', 'bad');
      said.textContent = detail(e);
    });
  }

  /* ── EXCHANGE RATES ────────────────────────────────────────────────── */

  function ratesLabels() {
    $('[data-rates-head]').textContent = T.ratesHead;
    $('[data-rates-why]').textContent = T.ratesWhy;
    $('[data-rates-code-label]').textContent = T.ratesCode;
    $('[data-rates-rate-label]').textContent = T.ratesRate;
    $('[data-rates-rate-note]').textContent = T.ratesRateNote;
    $('[data-rates-activate-label]').textContent = T.ratesActivate;
    $('[data-rates-activate-note]').textContent = T.ratesActivateNote;
    $('[data-rates-set]').textContent = T.ratesSet;
    $('[data-rates-refresh]').textContent = T.ratesRefresh;
    K.fillOptions($('[data-rates-activate]'), T.ratesActivateOptions);
    $('#secRates').hidden = false;
  }

  function setRate() {
    var said = $('[data-rates-said]');
    var code = $('[data-rates-code]').value.trim().toUpperCase();
    var rate = Number($('[data-rates-rate]').value);
    if (!code) { said.setAttribute('data-tone', 'bad'); said.textContent = T.ratesNeedCode; return; }
    if (!rate) { said.setAttribute('data-tone', 'bad'); said.textContent = T.ratesNeedRate; return; }
    said.removeAttribute('data-tone');
    said.textContent = T.ratesWorking;
    K.api('/api/admin/currency/set-rate', {
      method: 'POST',
      body: JSON.stringify({
        code: code, rateToUsd: rate,
        activate: $('[data-rates-activate]').value === 'true',
      }),
    }).then(function (r) {
      said.setAttribute('data-tone', 'good');
      said.textContent = T.ratesDone + ' ' + readings(r);
    }).catch(function (e) {
      said.setAttribute('data-tone', 'bad');
      said.textContent = detail(e);
    });
  }

  function refreshRates() {
    var said = $('[data-rates-said]');
    var code = $('[data-rates-code]').value.trim().toUpperCase();
    if (!code) { said.setAttribute('data-tone', 'bad'); said.textContent = T.ratesNeedCode; return; }
    said.removeAttribute('data-tone');
    said.textContent = T.ratesWorking;
    K.api('/api/admin/currency/refresh-rates', {
      method: 'POST', body: JSON.stringify({ codes: [code] }),
    }).then(function (r) {
      said.setAttribute('data-tone', 'good');
      // Including whatever the feed did NOT cover: a code the provider
      // does not carry comes back named rather than as a fabricated
      // rate, and printing that is the whole value of the answer.
      said.textContent = T.ratesDone + ' ' + readings(r);
    }).catch(function (e) {
      said.setAttribute('data-tone', 'bad');
      said.textContent = detail(e);
    });
  }

  /* ── RETENTION ─────────────────────────────────────────────────────── */

  function purge(confirm) {
    var said = $('[data-purge-said]');
    said.removeAttribute('data-tone');
    said.textContent = T.purgeWorking;
    return K.api('/api/admin/recordings/purge', {
      method: 'POST', body: JSON.stringify({ confirm: confirm === true, limit: 200 }),
    }).then(function (r) {
      var list = $('[data-purge-result]');
      list.textContent = '';
      (r.ids || []).forEach(function (id) {
        list.appendChild(K.el('p', 'stf-field__note', id));
      });
      if (r.dryRun) {
        said.textContent = r.examined
          ? T.purgeExamined(r.examined, (r.ids || []).length)
          : T.purgeNothing;
        // The destroying button exists only after the dry run has been
        // read, and only when there is something to destroy.
        $('[data-purge-confirm]').hidden = !r.examined;
      } else {
        said.setAttribute('data-tone', 'good');
        said.textContent = T.purgeDone(r.purged || 0);
        $('[data-purge-confirm]').hidden = true;
      }
    }).catch(function (e) {
      said.setAttribute('data-tone', 'bad');
      said.textContent = detail(e);
    });
  }

  /* ── BOOT ──────────────────────────────────────────────────────────── */

  function boot() {
    $('#state').textContent = T.loading;
    $('[data-evidence-state-label]').textContent = T.evidenceStateLabel;
    K.fillOptions($('[data-evidence-state]'), T.evidenceStates);
    $('[data-purge-head]').textContent = T.purgeHead;
    $('[data-purge-why]').textContent = T.purgeWhy;
    $('[data-purge-dry]').textContent = T.purgeDry;
    $('[data-purge-confirm]').textContent = T.purgeConfirm;
    ratesLabels();
    $('#secRetention').hidden = false;

    // Each block stands or falls alone: a 403 on one instrument must
    // not blank the six a tutor is entitled to read.
    Promise.all([
      loadMetrics(), loadEvidence(), loadCoverage(),
      loadKeys(), loadInstitutions(),
    ]).then(function () {
      $('#state').textContent = T.ready + ' ' + T.readyRest;
    });
  }

  document.addEventListener('DOMContentLoaded', function () {
    $('[data-evidence-state]').addEventListener('change', function () { loadEvidence(); });
    $('[data-inst-send]').addEventListener('click', registerInstitution);
    $('[data-rates-set]').addEventListener('click', setRate);
    $('[data-rates-refresh]').addEventListener('click', refreshRates);
    $('[data-purge-dry]').addEventListener('click', function () { purge(false); });
    $('[data-purge-confirm]').addEventListener('click', function () { purge(true); });
  });

  K.boot(boot);
})();
