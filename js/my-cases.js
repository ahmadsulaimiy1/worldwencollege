/* WEC-LC — My Cases.
 *
 * The interface for GET / POST /api/student/cases. Item 10 of the
 * interface backlog: "An appeal, complaint, withdrawal, deferral or
 * transfer — opening one, reading its stage and its clock, escalating
 * it, withdrawing it."
 *
 * ─────────────────────────────────────────────────────────────────────
 * THE PROCEDURE IS THE ENDPOINT'S, NOT THE PAGE'S
 * ─────────────────────────────────────────────────────────────────────
 * Every sentence of the ladder — who hears each stage, how many working
 * days it takes, what the College publishes about it — is rendered from
 * `procedure` on the payload. The module's own note gives the reason:
 * the published words travel with the case so that "the interface the
 * learner reads and the rule the server enforces are the same text",
 * and any drift is a drift a reader can see.
 *
 * That is why this file contains no stage names, no intervals and no
 * quotations from Decision E2. Where the College publishes NO interval —
 * stage three has none — the payload sends null and the page says what
 * the College holds itself to instead. It never prints a number the
 * College has not adopted.
 *
 * ─────────────────────────────────────────────────────────────────────
 * THE CLOCK IS SHOWN RUNNING
 * ─────────────────────────────────────────────────────────────────────
 * `clock` carries the date an answer is owed, whether it has passed, and
 * the working days left. All three are rendered, and an overdue case
 * says so plainly rather than in a colour a reader has to interpret. A
 * deadline nobody can see is not a deadline.
 *
 * ─────────────────────────────────────────────────────────────────────
 * THE TRAIL IS RENDERED WHOLE
 * ─────────────────────────────────────────────────────────────────────
 * E2 is a claim about OFFICES: at every stage the decision passes to
 * somebody who was not part of the last one. The learner's payload
 * carries the post that acted and never a staff member's account id,
 * and this page prints every entry — which is what turns that claim
 * into something a learner can check.
 *
 * Every value reaches the page through textContent.
 */
(function () {
  'use strict';

  var $ = function (s, r) { return (r || document).querySelector(s); };
  var AR = document.documentElement.lang === 'ar';
  var LOCALE = AR ? 'ar' : 'en-GB';

  var T = AR ? {
    loading: 'جارٍ تحميل قضاياك…',
    signedOut: 'لست مسجَّل الدخول.',
    signedOutRest: 'قضاياك خاصّةٌ بك. سجّل الدخول لتراها.',
    failed: 'تعذّر تحميل قضاياك.',
    failedRest: 'هذا خللٌ عندنا. أعد المحاولة بعد قليل.',
    ready: 'قضاياك.',
    readyRest: 'ما طلبتَ من الكلّية أن تجيب عنه، وأين بلغ.',
    none: 'لا قضيّةَ لك مفتوحةً ولا مقضيّة. والإجراء أعلاه قائمٌ متى احتجتَ إليه.',
    stageNames: {
      stage_one: 'المرحلة الأولى', stage_two: 'المرحلة الثانية', stage_three: 'المرحلة الثالثة',
      received: 'وردت', awaiting_information: 'بانتظار بيان', determined: 'مقضيّة', closed: 'مغلقة',
    },
    kinds: {
      appeal: 'تظلُّم', complaint: 'شكوى', withdrawal: 'انسحاب',
      deferral: 'تأجيل', transfer: 'انتقال',
    },
    kindNotes: {
      appeal: 'قرارٌ تراه خطأً وتطلب النظر فيه من جديد.',
      complaint: 'أمرٌ جرى على غير ما ينبغي وتطلب من الكلّية إصلاحه.',
      withdrawal: 'أن تقف عن الدراسة وتغلق تسجيلك.',
      deferral: 'وقفةٌ إلى اثني عشر شهرًا، تُمنح على الطلب بلا مستندٍ ولا رسمٍ ولا سبب.',
      transfer: 'انتقالٌ من مستواك إلى غيره.',
    },
    matters: {
      academic: 'أكاديمي', conduct: 'سلوك', welfare: 'رعاية',
      fair_treatment: 'إنصاف', administrative: 'إداري',
    },
    matterNote: 'يوجّه هذا الحقلُ المرحلةَ الثالثة: الأمر الأكاديمي إلى أمين الشؤون الأكاديمية، وما سواه إلى أمين الأخلاقيات والقيم المؤسسية.',
    outcomes: {
      upheld: 'قُبِل', partly_upheld: 'قُبِل جزئيًّا', not_upheld: 'لم يُقبَل',
      granted: 'مُنِح', refused: 'رُفِض',
      substituted: 'حلَّ المجلسُ الأكاديمي قرارَه محلَّه',
      returned_for_fresh_assessment: 'أُعيد لتقييمٍ جديدٍ من مصحّحٍ آخر',
      withdrawn_by_learner: 'سحبها المتعلّم',
    },
    heardBy: 'يسمعها: ',
    workingDays: function (n) { return n + ' أيّام عملٍ للجواب'; },
    noInterval: function (n) { return 'لا مدّةَ منشورة. وتُلزِم الكلّيةُ نفسَها بـ ' + n + ' يومَ عمل، وهي أطولُ مدّةٍ تنشرها.'; },
    due: function (d) { return 'يُستحقّ الجواب في ' + d; },
    overdue: function (d) { return 'كان الجوابُ مستحقًّا في ' + d + '، وقد فات.'; },
    remaining: function (n) { return n === 1 ? 'بقي يومُ عملٍ واحد' : 'بقي ' + n + ' أيّام عمل'; },
    basisPublished: 'المدّة منشورة.',
    basisSelf: 'لا مدّةَ منشورةً لهذه المرحلة؛ وهذه مدّةٌ تُلزم الكلّيةُ بها نفسَها.',
    stopped: 'الساعة موقوفةٌ: القضيّة بانتظار بيانٍ منك.',
    noClock: 'لا جوابَ مستحقٌّ الآن.',
    answerHead: 'الجواب',
    decidedAt: function (s, d) { return 'قُضي في ' + s + ' بتاريخ ' + d; },
    consequences: 'ما يترتّب على هذا الجواب',
    applied: 'نُفِّذ',
    blocked: 'لم يُنفَّذ بعد',
    requires: 'ويقتضي:',
    trail: 'سِجلُّ القضيّة',
    trailNote: 'كلُّ قيدٍ هنا سببٌ أبداه صاحبُه لتحريك القضيّة، وهو محفوظٌ بالألفاظ التي كُتب بها. أمّا الإجراء المنشور أعلاه فمنشورٌ بالعربية والإنجليزية معًا.',
    posts: {
      appellant: 'صاحب التظلّم',
      registrar: 'المسجِّل',
      academic_staff_senior_to_decision_maker: 'عضو هيئةٍ أكاديميّةٍ أعلى من صاحب القرار',
      academic_senate: 'المجلس الأكاديمي',
      governor_academic_affairs: 'أمين الشؤون الأكاديمية',
      governor_ethics_and_institutional_values: 'أمين الأخلاقيات والقيم المؤسسية',
    },
    escalateWhy: function (s) { return 'لم تحسم المرحلةُ الحاليّة الأمر؟ لك أن ترفعها إلى ' + s + '. وأنت مَن يقرّر ذلك لا الكلّية. والسبب مطلوبٌ ويُقرأ في المرحلة التالية: فتغيُّرُ مرحلةٍ بلا بيانٍ هو تحريكُ ملفٍّ صمتًا، وذلك ما وُضع الإجراء لمنعه.'; },
    withdrawWhy: 'سحبُ القضيّة يغلقها ويبقى على السجلّ. والسبب مطلوبٌ ويُسجَّل باسمك.',
    formWhy: 'ما تكتبه هنا يصل إلى مكتب المسجِّل ويبدأ الساعة المنشورة. ولا رسمَ على شيءٍ من هذا، ولا يُطلَب منك مستند.',
    needSummary: 'السطر الواحد مطلوب.',
    needDetail: 'التفصيل مطلوب.',
    needReason: 'السبب مطلوب.',
    sending: 'جارٍ الإرسال…',
    charsLeft: function (n) { return 'بقي ' + n + ' حرفًا.'; },
    anyLevel: 'لا يخصّ مستوًى بعينه',
    level: function (r, n) { return 'المستوى ' + r + (n ? ' — ' + n : ''); },
    opened: function (d) { return 'فُتحت في ' + d; },
    reference: 'المرجع',
    loadFailed: 'تعذّرت قراءة هذه القضيّة.',
    openBtn: 'افتح القضيّة',
    escalateBtn: 'ارفعها إلى المرحلة التالية',
    withdrawBtn: 'اسحب القضيّة',
  } : {
    loading: 'Loading your cases…',
    signedOut: 'You are not signed in.',
    signedOutRest: 'Your cases are private to you. Sign in to see them.',
    failed: 'Your cases could not be loaded.',
    failedRest: 'This is a fault on our side. Please try again shortly.',
    ready: 'Your cases.',
    readyRest: 'What you have asked the College to answer, and where it has reached.',
    none: 'You have no case open and none determined. The procedure above stands whenever you need it.',
    stageNames: {
      stage_one: 'Stage one', stage_two: 'Stage two', stage_three: 'Stage three',
      received: 'Received', awaiting_information: 'Awaiting information',
      determined: 'Determined', closed: 'Closed',
    },
    kinds: {
      appeal: 'Appeal', complaint: 'Complaint', withdrawal: 'Withdrawal',
      deferral: 'Deferral', transfer: 'Transfer',
    },
    kindNotes: {
      appeal: 'A decision you believe is wrong, and you are asking for it to be looked at again.',
      complaint: 'Something that went wrong, and you are asking the College to put it right.',
      withdrawal: 'Stopping your studies and closing your enrolment.',
      deferral: 'A pause of up to twelve months, granted on request without documents, a fee or a reason.',
      transfer: 'Moving from your level to another.',
    },
    matters: {
      academic: 'Academic', conduct: 'Conduct', welfare: 'Welfare',
      fair_treatment: 'Fair treatment', administrative: 'Administrative',
    },
    matterNote: 'This routes stage three: an academic matter goes to the Governor for Academic Affairs, anything else to the Governor for Ethics and Institutional Values.',
    outcomes: {
      upheld: 'Upheld', partly_upheld: 'Partly upheld', not_upheld: 'Not upheld',
      granted: 'Granted', refused: 'Refused',
      substituted: 'The Senate substituted its own decision',
      returned_for_fresh_assessment: 'Returned for fresh assessment by a different marker',
      withdrawn_by_learner: 'Withdrawn by you',
    },
    heardBy: 'Heard by: ',
    workingDays: function (n) { return n + ' working days to answer'; },
    noInterval: function (n) { return 'No interval published. The College holds itself to ' + n + ' working days, which is the longest interval it does publish.'; },
    due: function (d) { return 'An answer is owed by ' + d; },
    overdue: function (d) { return 'An answer was owed by ' + d + ', and that day has passed.'; },
    remaining: function (n) { return n === 1 ? '1 working day left' : n + ' working days left'; },
    basisPublished: 'The interval is published.',
    basisSelf: 'No interval is published for this stage; this is one the College holds itself to.',
    stopped: 'The clock is stopped: the case is waiting on information from you.',
    noClock: 'No answer is owed at present.',
    answerHead: 'The answer',
    decidedAt: function (s, d) { return 'Determined at ' + s + ' on ' + d; },
    consequences: 'What this answer sets in motion',
    applied: 'Done',
    blocked: 'Not yet done',
    requires: 'It requires:',
    trail: 'The record of this case',
    trailNote: 'Each entry is the reason somebody gave for moving the case, kept in the words it was written in. The published procedure above is published in both languages.',
    posts: {
      appellant: 'You',
      registrar: 'The Registrar',
      academic_staff_senior_to_decision_maker: 'A member of academic staff senior to the decision-maker',
      academic_senate: 'The Academic Senate',
      governor_academic_affairs: 'The Governor for Academic Affairs',
      governor_ethics_and_institutional_values: 'The Governor for Ethics and Institutional Values',
    },
    escalateWhy: function (s) { return 'If this stage has not resolved it, you may take it to ' + s + '. That is your decision to make, not the College’s. A reason is required and it is read at the next stage: a stage change with no note is a file moved in silence, which is what the procedure exists to prevent.'; },
    withdrawWhy: 'Withdrawing closes the case and stays on the record. A reason is required and it is recorded as yours.',
    formWhy: 'What you write here reaches the Registrar’s desk and starts the published clock. None of it carries a fee, and no document is asked of you.',
    needSummary: 'The one-line summary is required.',
    needDetail: 'The detail is required.',
    needReason: 'A reason is required.',
    sending: 'Sending…',
    charsLeft: function (n) { return n + ' characters left.'; },
    anyLevel: 'Not about a particular level',
    level: function (r, n) { return 'Level ' + r + (n ? ' — ' + n : ''); },
    opened: function (d) { return 'Opened ' + d; },
    reference: 'Reference',
    loadFailed: 'That case could not be read.',
    openBtn: 'Open the case',
    escalateBtn: 'Take it to the next stage',
    withdrawBtn: 'Withdraw the case',
  };

  function el(tag, cls, text) {
    var n = document.createElement(tag);
    if (cls) n.className = cls;
    if (text !== undefined && text !== null && text !== '') n.textContent = text;
    return n;
  }

  function when(iso) {
    if (!iso) return '';
    var d = new Date(iso);
    if (isNaN(d.getTime())) return String(iso);
    return d.toLocaleDateString(LOCALE, { day: 'numeric', month: 'long', year: 'numeric' });
  }

  var authHeaders = {};

  function api(path, opts) {
    var o = opts || {};
    o.headers = Object.assign({ Accept: 'application/json' }, authHeaders, o.headers || {});
    if (o.body) o.headers['Content-Type'] = 'application/json';
    return fetch(path, o).then(function (r) {
      return r.json().then(function (d) { return { ok: r.ok, status: r.status, data: d }; },
        function () { return { ok: r.ok, status: r.status, data: null }; });
    });
  }

  function state(strong, rest) {
    var box = $('#state');
    box.textContent = '';
    if (strong) box.appendChild(el('strong', null, strong + ' '));
    box.appendChild(document.createTextNode(rest || ''));
  }

  /* errorResponse() puts the class NAME in `error` and the sentence in
     `message`. A learner refused a case must read the College's reason,
     not the name of a JavaScript class. */
  function reasonFrom(body, fallback) {
    if (!body) return fallback;
    if (typeof body.message === 'string' && body.message.trim()) return body.message;
    if (typeof body.error === 'string' && /\s/.test(body.error)) return body.error;
    return fallback;
  }

  var stageName = function (s) { return T.stageNames[s] || s || ''; };
  var kindName = function (k) { return T.kinds[k] || k || ''; };
  var matterName = function (m) { return T.matters[m] || m || ''; };
  var outcomeName = function (o) { return T.outcomes[o] || o || ''; };
  var postName = function (p) { return T.posts[p] || p || ''; };

  var openCaseId = null;
  var levels = [];

  /* ── THE LADDER ──────────────────────────────────────────────────── */

  function ladderItem(st, i) {
    var li = el('li', 'cse-rung card edge-lit edge-lit--light aurum aurum--hover tilt gold-live');
    li.appendChild(el('span', 'tilt__sheen'));
    li.lastChild.setAttribute('aria-hidden', 'true');

    var head = el('p', 'cse-rung__head');
    head.appendChild(el('span', 'cse-rung__num', String(i + 1)));
    head.appendChild(el('span', 'cse-rung__name', stageName(st.stage)));
    li.appendChild(head);

    // The interval, or the absence of one said out loud. A stage with no
    // published interval must not silently borrow the neighbouring one's.
    li.appendChild(el('p', 'cse-rung__days',
      typeof st.workingDays === 'number'
        ? T.workingDays(st.workingDays)
        : T.noInterval(ladderSelfBinding)));

    // Stage three routes by the matter of the case, so on a list that
    // spans several matters the payload names BOTH posts rather than
    // choosing one. Both are printed.
    var heard = st.heardBy
      || [st.heardByAcademic, st.heardByOther].filter(Boolean).join(' · ');
    if (heard) li.appendChild(el('p', 'cse-rung__heard', T.heardBy + heard));
    if (st.published) li.appendChild(el('p', 'cse-rung__text', st.published));
    return li;
  }

  var ladderSelfBinding = 20;

  function renderProcedure(p) {
    if (!p) return;
    ladderSelfBinding = p.selfBindingWorkingDays || ladderSelfBinding;
    $('#secPrinciple').hidden = false;
    $('[data-instrument]').textContent = p.instrument || '';
    $('[data-principle]').textContent = p.principle || '';

    $('#secLadder').hidden = false;
    var list = $('[data-ladder]');
    list.textContent = '';
    (p.stages || []).forEach(function (st, i) { list.appendChild(ladderItem(st, i)); });
    $('[data-acknowledgement]').textContent = p.acknowledgement || '';
    $('[data-external]').textContent = p.externalReview || '';
  }

  /* ── THE LIST ────────────────────────────────────────────────────── */

  function caseRow(c) {
    var li = el('li', 'cse-row card edge-lit edge-lit--light aurum aurum--hover tilt gold-live');
    li.appendChild(el('span', 'tilt__sheen'));
    li.lastChild.setAttribute('aria-hidden', 'true');
    li.setAttribute('data-stage', c.stage);
    li.setAttribute('data-overdue', c.overdue ? 'yes' : 'no');

    var marks = el('p', 'cse-row__marks');
    marks.appendChild(el('span', 'cse-chip cse-chip--kind', kindName(c.kind)));
    marks.appendChild(el('span', 'cse-chip', matterName(c.matter)));
    marks.appendChild(el('span', 'cse-chip cse-chip--stage', stageName(c.stage)));
    if (c.outcome) marks.appendChild(el('span', 'cse-chip cse-chip--outcome', outcomeName(c.outcome)));
    if (c.overdue) marks.appendChild(el('span', 'cse-chip cse-chip--overdue', T.overdue(when(c.answerDue))));
    li.appendChild(marks);

    var btn = el('button', 'cse-row__open', c.summary || '');
    btn.type = 'button';
    btn.addEventListener('click', function () { openCase(c.reference); });
    li.appendChild(btn);

    var meta = el('p', 'cse-row__meta');
    meta.appendChild(el('span', 'cse-row__ref', c.reference || ''));
    meta.appendChild(document.createTextNode(' · ' + T.opened(when(c.openedAt))));
    if (c.answerDue && !c.overdue) {
      meta.appendChild(document.createTextNode(' · ' + T.due(when(c.answerDue))));
    }
    li.appendChild(meta);
    return li;
  }

  function renderList(d) {
    $('#secCases').hidden = false;
    var list = $('[data-cases]');
    list.textContent = '';
    (d.cases || []).forEach(function (c) { list.appendChild(caseRow(c)); });
    var empty = $('[data-cases-empty]');
    empty.hidden = (d.cases || []).length > 0;
    empty.textContent = (d.cases || []).length ? '' : T.none;

    buildForm(d.kinds || [], d.matters || []);
  }

  /* ── THE FORM ────────────────────────────────────────────────────── */

  function buildForm(kinds, matters) {
    $('[data-form-why]').textContent = T.formWhy;
    var k = $('[data-kind]');
    if (!k.options.length) {
      kinds.forEach(function (v) {
        var o = el('option', null, kindName(v)); o.value = v; k.appendChild(o);
      });
    }
    var m = $('[data-matter]');
    if (!m.options.length) {
      matters.forEach(function (v) {
        var o = el('option', null, matterName(v)); o.value = v; m.appendChild(o);
      });
      $('[data-matter-note]').textContent = T.matterNote;
    }
    noteKind();
  }

  function noteKind() {
    var v = $('[data-kind]').value;
    $('[data-kind-note]').textContent = T.kindNotes[v] || '';
  }

  function buildLevels() {
    var sel = $('[data-level]');
    sel.textContent = '';
    var none = el('option', null, T.anyLevel);
    none.value = '';
    sel.appendChild(none);
    levels.forEach(function (l) {
      var o = el('option', null, T.level(l.roman || '', l.name || ''));
      o.value = String(l.levelId);
      sel.appendChild(o);
    });
  }

  /* ── ONE CASE ────────────────────────────────────────────────────── */

  function paragraphsInto(node, text) {
    node.textContent = '';
    String(text || '').split(/\n{2,}/).forEach(function (p) {
      if (p.trim()) node.appendChild(el('p', null, p.trim()));
    });
  }

  function renderClock(c) {
    var box = $('[data-clock]');
    var k = c.clock || {};
    box.hidden = false;
    // The stage in the eyebrow and the hearer under it. `heard_by_role`
    // is the College's whole published sentence about who hears a
    // stage — set in tracked capitals beside the stage name it ran to
    // two lines of shouting.
    $('[data-clock-stage]').textContent = stageName(c.stage);
    var heard = c.heardBy || c.heardByRole;
    $('[data-clock-heard]').textContent = heard ? T.heardBy + heard : '';

    var due = $('[data-clock-due]');
    if (k.stopped) { due.textContent = T.stopped; }
    else if (!k.answerDue) { due.textContent = T.noClock; }
    else if (k.overdue) { due.textContent = T.overdue(when(k.answerDue)); }
    else {
      due.textContent = T.due(when(k.answerDue))
        + (typeof k.workingDaysRemaining === 'number' ? ' · ' + T.remaining(k.workingDaysRemaining) : '');
    }
    box.setAttribute('data-overdue', k.overdue ? 'yes' : 'no');

    // `published` and `college_self_binding` are different claims and the
    // page never lets one wear the other's clothes.
    $('[data-clock-basis]').textContent = k.basis === 'published'
      ? T.basisPublished
      : (k.basis === 'college_self_binding' ? T.basisSelf : '');
  }

  function trailItem(e) {
    var li = el('li', 'cse-trail__item');
    var head = el('p', 'cse-trail__head');
    head.appendChild(el('span', 'cse-trail__to',
      (e.fromStage ? stageName(e.fromStage) + ' → ' : '') + stageName(e.toStage)));
    head.appendChild(el('span', 'cse-trail__post', postName(e.actorRole)));
    head.appendChild(el('span', 'cse-trail__at', when(e.at)));
    li.appendChild(head);
    if (e.note) li.appendChild(el('p', 'cse-trail__note', e.note));
    if (e.answerDueAfter) {
      li.appendChild(el('p', 'cse-trail__due', T.due(when(e.answerDueAfter))));
    }
    return li;
  }

  function renderCase(c) {
    var sec = $('#secCase');
    sec.hidden = false;
    openCaseId = c.reference || c.id;

    $('[data-case-ref]').textContent = T.reference + ' ' + (c.reference || '');
    $('[data-case-summary]').textContent = c.summary || '';
    $('[data-case-kind]').textContent = kindName(c.kind) + ' · ' + matterName(c.matter)
      + (c.levelId ? ' · ' + levelLabel(c.levelId) : '');

    renderClock(c);
    paragraphsInto($('[data-case-detail]'), c.detail);

    var ans = $('[data-answer]');
    if (c.answer) {
      ans.hidden = false;
      $('[data-answer-outcome]').textContent = T.answerHead + ' — ' + outcomeName(c.answer.outcome);
      paragraphsInto($('[data-answer-decision]'), c.answer.decision);
      $('[data-answer-meta]').textContent = c.answer.decidedAtStage
        ? T.decidedAt(stageName(c.answer.decidedAtStage), when(c.answer.decidedOn))
        : when(c.answer.decidedOn);
    } else {
      ans.hidden = true;
    }

    var cons = $('[data-consequences]');
    var list = $('[data-consequences-list]');
    list.textContent = '';
    if ((c.consequences || []).length) {
      cons.hidden = false;
      $('[data-consequences-head]').textContent = T.consequences;
      c.consequences.forEach(function (x) {
        var li = el('li', 'cse-consequence');
        li.setAttribute('data-applied', x.applied ? 'yes' : 'no');
        li.appendChild(el('p', 'cse-consequence__head',
          (x.applied ? T.applied : T.blocked) + ' · ' + (x.intent || x.domain || '')));
        if (x.published) li.appendChild(el('p', 'cse-consequence__published', x.published));
        if ((x.requires || []).length) {
          li.appendChild(el('p', 'cse-consequence__requires', T.requires));
          var ul = el('ul', 'cse-consequence__list');
          x.requires.forEach(function (r) { ul.appendChild(el('li', null, r)); });
          li.appendChild(ul);
        }
        list.appendChild(li);
      });
    } else {
      cons.hidden = true;
    }

    $('[data-trail-head]').textContent = T.trail;
    $('[data-trail-note]').textContent = T.trailNote;
    var trail = $('[data-trail]');
    trail.textContent = '';
    (c.trail || []).forEach(function (e) { trail.appendChild(trailItem(e)); });

    var esc = $('[data-escalate]');
    esc.hidden = !c.mayEscalate;
    if (c.mayEscalate) {
      $('[data-escalate-why]').textContent = T.escalateWhy(stageName(c.escalatesTo));
      $('[data-escalate-note]').value = '';
    }
    var wd = $('[data-withdraw]');
    wd.hidden = !c.mayWithdraw;
    if (c.mayWithdraw) {
      $('[data-withdraw-why]').textContent = T.withdrawWhy;
      $('[data-withdraw-reason]').value = '';
    }
    $('[data-case-error]').textContent = '';
    sec.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }

  function levelLabel(id) {
    var l = levels.find(function (x) { return x.levelId === id; });
    return l ? T.level(l.roman || '', l.name || '') : '';
  }

  function openCase(ref) {
    $('[data-case-error]').textContent = '';
    api('/api/student/cases?case=' + encodeURIComponent(ref)
      + '&language=' + (AR ? 'ar' : 'en')).then(function (r) {
      if (!r.ok) {
        $('#secCase').hidden = false;
        $('[data-case-error]').textContent = reasonFrom(r.data, T.loadFailed);
        return;
      }
      renderCase(r.data);
    });
  }

  /* ── THE THREE ACTS ──────────────────────────────────────────────── */

  function act(payload, btn, label, errBox) {
    var box = $(errBox);
    box.textContent = '';
    btn.disabled = true;
    var was = btn.textContent;
    btn.textContent = T.sending;
    return api('/api/student/cases', { method: 'POST', body: JSON.stringify(payload) })
      .then(function (r) {
        btn.disabled = false;
        btn.textContent = label || was;
        if (!r.ok) { box.textContent = reasonFrom(r.data, T.failed); return null; }
        return r.data;
      });
  }

  function openNew() {
    var err = $('[data-form-error]');
    err.textContent = '';
    var summary = ($('[data-summary]').value || '').trim();
    var detail = ($('[data-detail]').value || '').trim();
    if (!summary) { err.textContent = T.needSummary; return; }
    if (!detail) { err.textContent = T.needDetail; return; }

    var payload = {
      action: 'open',
      kind: $('[data-kind]').value,
      matter: $('[data-matter]').value,
      summary: summary,
      detail: detail,
    };
    var lvl = $('[data-level]').value;
    if (lvl) payload.levelId = Number(lvl);

    act(payload, $('[data-form-send]'), T.openBtn, '[data-form-error]').then(function (d) {
      if (!d) return;
      $('[data-summary]').value = '';
      $('[data-detail]').value = '';
      $('#secForm').hidden = true;
      load();
      renderCase(d);
    });
  }

  function escalate() {
    var note = ($('[data-escalate-note]').value || '').trim();
    // REQUIRED, and refused here rather than sent to be refused — not to
    // spare the round trip but so the learner reads the reason FOR the
    // requirement at the moment they meet it. Migration 020 states it of
    // every stage change: one with no note is the institution moving a
    // person's case without saying why, and the learner's own move is
    // held to the same rule as the College's.
    if (!note) { $('[data-case-error]').textContent = T.needReason; return; }
    act({ action: 'escalate', case: openCaseId, note: note },
      $('[data-escalate-send]'), T.escalateBtn, '[data-case-error]').then(function (d) {
      if (!d) return;
      renderCase(d);
      load();
    });
  }

  function withdraw() {
    var reason = ($('[data-withdraw-reason]').value || '').trim();
    if (!reason) { $('[data-case-error]').textContent = T.needReason; return; }
    act({ action: 'withdraw', case: openCaseId, reason: reason },
      $('[data-withdraw-send]'), T.withdrawBtn, '[data-case-error]').then(function (d) {
      if (!d) return;
      renderCase(d);
      load();
    });
  }

  /* ── LOADING ─────────────────────────────────────────────────────── */

  function load() {
    return api('/api/student/cases?language=' + (AR ? 'ar' : 'en')).then(function (r) {
      if (r.status === 401) return 'auth';
      if (!r.ok) return 'fail';
      renderProcedure(r.data.procedure);
      renderList(r.data);
      return 'ok';
    });
  }

  /* The levels a case may be filed against are the learner's OWN, read
     from the standing endpoint rather than from a list of six the page
     could have typed. A form offering a level nobody is enrolled on is a
     form that discovers by refusal what it should have known. */
  function loadLevels() {
    return api('/api/student/standing').then(function (r) {
      if (r.ok && r.data && Array.isArray(r.data.levels)) {
        levels = r.data.levels.map(function (l) {
          return { levelId: l.levelId, roman: l.roman, name: l.name };
        });
      }
      buildLevels();
    }, function () { buildLevels(); });
  }

  document.addEventListener('DOMContentLoaded', function () {
    $('[data-open-form]').addEventListener('click', function () {
      $('#secForm').hidden = false;
      $('[data-summary]').focus();
    });
    $('[data-form-close]').addEventListener('click', function () { $('#secForm').hidden = true; });
    $('[data-case-close]').addEventListener('click', function () {
      $('#secCase').hidden = true;
      openCaseId = null;
    });
    $('[data-kind]').addEventListener('change', noteKind);
    $('[data-form-send]').addEventListener('click', openNew);
    $('[data-escalate-send]').addEventListener('click', escalate);
    $('[data-withdraw-send]').addEventListener('click', withdraw);

    var summary = $('[data-summary]');
    var detail = $('[data-detail]');
    var tickS = function () { $('[data-summary-count]').textContent = T.charsLeft(200 - (summary.value || '').length); };
    var tickD = function () { $('[data-detail-count]').textContent = T.charsLeft(8000 - (detail.value || '').length); };
    summary.addEventListener('input', tickS);
    detail.addEventListener('input', tickD);
    tickS(); tickD();

    document.addEventListener('keydown', function (ev) {
      if (ev.key !== 'Escape') return;
      $('#secForm').hidden = true;
      $('#secCase').hidden = true;
    });

    var boot = function () {
      state(T.loading, '');
      Promise.all([load(), loadLevels()]).then(function (out) {
        if (out[0] === 'auth') { state(T.signedOut, T.signedOutRest); return; }
        if (out[0] === 'fail') { state(T.failed, T.failedRest); return; }
        state(T.ready, T.readyRest);
        $('#scope').hidden = false;
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
