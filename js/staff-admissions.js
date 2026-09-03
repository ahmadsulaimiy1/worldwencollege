/* WEC-LC — Admissions.
 *
 * The interface for GET / PATCH /api/staff/applications and for
 * POST /api/admissions/offer.
 *
 * ─────────────────────────────────────────────────────────────────────
 * THE CONTROLS ARE BUILT FROM `legalNext`
 * ─────────────────────────────────────────────────────────────────────
 * Every row carries the moves the lifecycle actually permits from where
 * that application stands, and the buttons are rendered from it. This
 * file contains no table of transitions and no branch deciding what an
 * officer may do — a console that keeps its own copy of the machine
 * eventually disagrees with the server, and the disagreement always
 * surfaces as a refusal in front of somebody with an applicant waiting.
 *
 * The one move that is NOT a button is `offer_sent`, because an
 * application reaches it only by an offer being written. The endpoint
 * refuses it and says so; this page offers the offer form instead,
 * which is the act the refusal is pointing at.
 *
 * ─────────────────────────────────────────────────────────────────────
 * THE REASON IS THE APPLICANT'S TO READ
 * ─────────────────────────────────────────────────────────────────────
 * There is no internal-note column on the events table. Every reason
 * entered here appears on the applicant's own tracking page, and the
 * form says so above the field rather than leaving it to be found out
 * by somebody who wrote something they would not have said aloud.
 *
 * ─────────────────────────────────────────────────────────────────────
 * AND AN OFFER NAMES A LEVEL, A KIND AND A DATE
 * ─────────────────────────────────────────────────────────────────────
 * A conditional offer states its conditions — a condition nobody wrote
 * down is one the applicant cannot meet — and an unconditional one
 * carries none. The endpoint refuses either mistake rather than
 * quietly picking; this form mirrors the same rule so the refusal is
 * rare rather than routine.
 */
(function () {
  'use strict';

  var K = window.WEC_LC_staff;
  var $ = K.$;
  var AR = K.AR;

  var T = AR ? {
    loading: 'جارٍ تحميل طابور القبول…',
    ready: 'طابور القبول.',
    readyRest: 'بترتيب ورود الطلبات، لا بترتيب أحدثها.',
    journeyHead: 'الطريق المنشور',
    journeyNote: 'هذه ألفاظُ الكلّية نفسها كما يقرؤها صاحبُ الطلب على صفحة القبول، مأخوذةٌ من المنصّة لا مُعادةً في هذه الصفحة، فما تراه ههنا هو ما يراه هناك.',
    queueHead: 'الطلبات',
    statusLabel: 'المرحلة',
    allStatuses: 'كلُّ المراحل القائمة',
    statuses: {
      submitted: 'وردت', placement_pending: 'بانتظار التنسيب', offer_sent: 'أُرسل العرض',
      accepted: 'قُبِل', enrolled: 'سُجِّل', withdrawn: 'انسحب', rejected: 'رُفض',
    },
    queueEmpty: 'لا طلبَ في هذه المرحلة.',
    queueEmptyNote: 'ما يَرِد من طلباتٍ يظهر هنا، الأقدمُ أوّلًا.',
    waited: function (n) { return n === 0 ? 'وردت اليوم' : 'انتظرت ' + n + ' يومًا'; },
    from: function (c) { return 'من ' + c; },
    selfLevel: function (r) { return 'قدّر نفسه في ' + r; },
    placedAt: function (r) { return 'نُسِّب في ' + r; },
    lastEvent: function (d, f, t) { return 'آخرُ حركة: ' + d + ' · من ' + f + ' إلى ' + t; },
    noEvent: 'لم تجرِ عليه حركةٌ بعد.',
    noteWas: 'ما كُتب: ',
    actHead: 'حرِّك هذا الطلب',
    actWhy: 'يُقرأ سببُك على صفحة تتبّع صاحب الطلب بلفظه. ولا حقلَ للملاحظات الداخلية في هذه المنصّة، فاكتب ما تقوله له لا ما تقوله عنه.',
    toLabel: 'إلى',
    reasonLabel: 'السبب',
    placementLabel: 'مستوى التنسيب',
    noPlacement: 'لا تغيير',
    move: 'حرِّكه',
    moving: 'جارٍ التحريك…',
    moved: 'حُرِّك.',
    needReason: 'السبب مطلوب.',
    offerHead: 'أصدِر عرضًا',
    offerWhy: 'يُصدَر العرضُ باسم الموظّف الموقّع، ويحمل المستوى المؤكَّد وتاريخَ انتهائه. ولا يُصدَر عرضان قائمان لطلبٍ واحد.',
    offerLevel: 'المستوى المعروض',
    offerKind: 'نوع العرض',
    kinds: [['unconditional', 'غير مشروط'], ['conditional', 'مشروط']],
    offerConditions: 'الشروط',
    offerConditionsNote: 'العرضُ المشروط يذكر شروطَه؛ فالشرطُ الذي لم يُكتب لا يستطيع صاحبُ الطلب استيفاءه. ويُترك هذا الحقل فارغًا في العرض غير المشروط.',
    offerExpiry: 'ينتهي في',
    issue: 'أصدِر العرض',
    issuing: 'جارٍ الإصدار…',
    issued: 'صدر العرض.',
    needLevel: 'اختر المستوى.',
    needExpiry: 'تاريخ الانتهاء مطلوب.',
    needConditions: 'اكتب شروط العرض المشروط.',
    liveOffer: function (k, d) { return 'عرضٌ قائم (' + k + ') ينتهي في ' + d; },
    offerExpired: 'انتهى العرض',
  } : {
    loading: 'Loading the admissions queue…',
    ready: 'The admissions queue.',
    readyRest: 'In the order people asked, not in the order they arrived last.',
    journeyHead: 'The published journey',
    journeyNote: 'These are the College’s own words, as an applicant reads them on the admissions page — taken from the platform rather than restated here, so what you read is what they read.',
    queueHead: 'Applications',
    statusLabel: 'Stage',
    allStatuses: 'Every live stage',
    statuses: {
      submitted: 'Submitted', placement_pending: 'Awaiting placement', offer_sent: 'Offer sent',
      accepted: 'Accepted', enrolled: 'Enrolled', withdrawn: 'Withdrawn', rejected: 'Not offered',
    },
    queueEmpty: 'No application is at this stage.',
    queueEmptyNote: 'What arrives next appears here, oldest first.',
    waited: function (n) { return n === 0 ? 'Arrived today' : 'Waiting ' + n + (n === 1 ? ' day' : ' days'); },
    from: function (c) { return 'From ' + c; },
    selfLevel: function (r) { return 'Self-assessed at ' + r; },
    placedAt: function (r) { return 'Placed at ' + r; },
    lastEvent: function (d, f, t) { return 'Last moved ' + d + ' · ' + f + ' → ' + t; },
    noEvent: 'Nothing has happened to it yet.',
    noteWas: 'What was written: ',
    actHead: 'Move this application',
    actWhy: 'Your reason is read on the applicant’s own tracking page, in the words you write. There is no internal-note field anywhere in this platform, so write what you would say to them rather than what you would note about them.',
    toLabel: 'To',
    reasonLabel: 'Reason',
    placementLabel: 'Placement level',
    noPlacement: 'Leave unchanged',
    move: 'Move it',
    moving: 'Moving…',
    moved: 'Moved.',
    needReason: 'A reason is required.',
    offerHead: 'Issue an offer',
    offerWhy: 'An offer is issued under the name of the officer signing it, and carries the confirmed level and the date it expires. There is never more than one live offer on an application.',
    offerLevel: 'The level offered',
    offerKind: 'Kind of offer',
    kinds: [['unconditional', 'Unconditional'], ['conditional', 'Conditional']],
    offerConditions: 'Conditions',
    offerConditionsNote: 'A conditional offer states its conditions — a condition nobody wrote down is one the applicant cannot meet. Leave this empty on an unconditional offer.',
    offerExpiry: 'Expires on',
    issue: 'Issue the offer',
    issuing: 'Issuing…',
    issued: 'Offer issued.',
    needLevel: 'Choose the level.',
    needExpiry: 'An expiry date is required.',
    needConditions: 'Write the conditions of a conditional offer.',
    liveOffer: function (k, d) { return 'Live offer (' + k + ') expiring ' + d; },
    offerExpired: 'Offer expired',
  };

  var machine = null;

  function statusWord(s) { return T.statuses[s] || s || ''; }

  /* ── THE COUNTS ────────────────────────────────────────────────────── */

  /* Four stages, and no more: the closed ones are a fact about the past
     and belong on a report rather than on the desk somebody is working.
     The tallies come from the endpoint measured WITHOUT the status
     filter, so narrowing the list does not blind the officer to the
     rest of the queue. */
  var TILES = [
    ['submitted', 'i-envelope'],
    ['placement_pending', 'i-compass'],
    ['offer_sent', 'i-seal'],
    ['accepted', 'i-check'],
  ];

  function renderCounts(byStatus) {
    var box = $('#secCounts');
    box.textContent = '';
    TILES.forEach(function (pair) {
      var tile = K.el('div', 'stf-count plate-dark card card--dark edge-lit aurum tilt gold-live reveal');
      tile.setAttribute('data-tile', pair[0]);
      var sheen = K.el('span', 'tilt__sheen');
      sheen.setAttribute('aria-hidden', 'true');
      tile.appendChild(sheen);
      tile.appendChild(K.dome(pair[1], true));
      tile.appendChild(K.el('p', 'stf-count__num', String((byStatus && byStatus[pair[0]]) || 0)));
      tile.appendChild(K.el('p', 'stf-count__label', statusWord(pair[0])));
      box.appendChild(tile);
    });
    box.hidden = false;
  }

  /* ── THE JOURNEY ───────────────────────────────────────────────────── */

  function renderJourney(journey) {
    $('[data-journey-head]').textContent = T.journeyHead;
    $('[data-journey-note]').textContent = T.journeyNote;
    var list = $('[data-journey]');
    list.textContent = '';
    (journey || []).forEach(function (step) {
      var li = K.plate('li');
      var head = K.el('div', 'stf-item__head');
      head.appendChild(K.dome('i-passport'));
      var who = K.el('div', 'stf-item__who');
      who.appendChild(K.el('p', 'stf-item__name', step.number + ' · ' + step.title));
      who.appendChild(K.el('p', 'stf-item__where', step.who || ''));
      var marks = K.el('div', 'stf-item__marks');
      (step.states || []).forEach(function (s) { marks.appendChild(K.chip(statusWord(s))); });
      who.appendChild(marks);
      head.appendChild(who);
      li.appendChild(head);
      var panel = K.el('div', 'stf-panel');
      var body = K.el('div', 'stf-work');
      K.prose(body, step.what);
      panel.appendChild(body);
      li.appendChild(panel);
      list.appendChild(li);
    });
    $('#secJourney').hidden = false;
  }

  /* ── ONE APPLICATION ───────────────────────────────────────────────── */

  function applicationItem(a) {
    var li = K.plate('li');
    li.setAttribute('data-id', a.id);

    var head = K.el('div', 'stf-item__head');
    head.appendChild(K.dome(a.offer ? 'i-seal' : 'i-envelope'));
    var who = K.el('div', 'stf-item__who');
    who.appendChild(K.el('p', 'stf-item__name', a.fullName || a.email || a.id));
    who.appendChild(K.el('p', 'stf-item__where',
      [a.id, a.email, a.country ? T.from(a.country) : ''].filter(Boolean).join(' · ')));

    var marks = K.el('div', 'stf-item__marks');
    marks.appendChild(K.chip(statusWord(a.status), 'pinned'));
    if (a.placementLevelId) marks.appendChild(K.chip(T.placedAt(K.levelWord(a.placementLevelId))));
    else if (a.selfAssessedLevelId) {
      marks.appendChild(K.chip(T.selfLevel(K.levelWord(a.selfAssessedLevelId)), 'muted'));
    }
    if (a.offer) {
      marks.appendChild(K.chip(
        a.offer.expired ? T.offerExpired : T.liveOffer(a.offer.kind, K.when(a.offer.expiresAt)),
        a.offer.expired ? 'closed' : 'answered',
      ));
    }
    who.appendChild(marks);
    head.appendChild(who);
    li.appendChild(head);

    // The wait is drawn only where the COLLEGE owes the next move. At
    // `offer_sent` the ball is with the applicant and at `accepted` the
    // question is answered, so a bar counting days there would read as
    // the College being late for something it is not late for.
    //
    // And no undertaking is claimed on this bar. The College publishes
    // its admissions intervals on /admissions/; a console carrying its
    // own copy of that number is a second source of truth about a
    // promise. The days are a fact and are stated; the promise is not
    // restated here.
    if (a.status === 'submitted' || a.status === 'placement_pending') {
      li.appendChild(K.wait(a.daysWaiting, Infinity));
    } else {
      li.appendChild(K.el('p', 'stf-wait__read', T.waited(a.daysWaiting)));
    }

    // What last happened to it, and who wrote what.
    var trail = K.el('div', 'stf-prior');
    if (a.lastEvent) {
      trail.appendChild(K.el('p', 'stf-panel__label',
        T.lastEvent(K.when(a.lastEvent.at), statusWord(a.lastEvent.from), statusWord(a.lastEvent.to))));
      if (a.lastEvent.note) {
        var note = K.el('p');
        note.setAttribute('dir', 'auto');
        note.textContent = T.noteWas + a.lastEvent.note;
        trail.appendChild(note);
      }
    } else {
      trail.appendChild(K.el('p', null, T.noEvent));
    }
    li.appendChild(trail);

    // `legalNext` is a list of MOVES, not a list of status names: each
    // carries who may make it and what it means. Two filters, and both
    // matter. A move an applicant alone may make is not this console's
    // to offer — it belongs to the person answering their own offer —
    // and `offer_sent` is not reachable by a status change at all,
    // because an application arrives there only by an offer being
    // written. The endpoint refuses it and says so; this page offers
    // the offer form instead, which is what the refusal points at.
    var moves = (a.legalNext || []).filter(function (m) {
      return m.to !== 'offer_sent' && (m.by || []).indexOf('staff') !== -1;
    });
    if (moves.length) li.appendChild(moveAct(a, li, moves));
    if ((a.legalNext || []).some(function (m) { return m.to === 'offer_sent'; })) {
      li.appendChild(offerAct(a, li));
    }

    return li;
  }

  function moveAct(a, li, moves) {
    var act = K.el('div', 'stf-act');
    act.appendChild(K.el('h3', null, T.actHead));
    act.appendChild(K.el('p', 'stf-field__note', T.actWhy));

    var tf = K.el('div', 'stf-field');
    var tl = K.el('label', null, T.toLabel);
    tl.setAttribute('for', 'to_' + a.id);
    tf.appendChild(tl);
    var to = K.el('select');
    to.id = 'to_' + a.id;
    to.setAttribute('data-move-to', '');
    moves.forEach(function (m) {
      var o = K.el('option', null, statusWord(m.to));
      o.value = m.to;
      to.appendChild(o);
    });
    tf.appendChild(to);
    // What the move MEANS, in the platform's own words rather than this
    // page's gloss on a status name. "withdrawn" reads as an act of the
    // College until the sentence beside it says the applicant is not
    // proceeding.
    var means = K.el('p', 'stf-field__note');
    tf.appendChild(means);
    act.appendChild(tf);

    function sayMeans() {
      var m = moves.filter(function (x) { return x.to === to.value; })[0];
      means.textContent = m ? (m.means || '') : '';
    }
    to.addEventListener('change', sayMeans);
    sayMeans();

    // The placement level, offered only where the move is the one that
    // records it. A level field on "withdrawn" is a field that invites
    // a number nobody reads.
    var pf = K.el('div', 'stf-field');
    var pl = K.el('label', null, T.placementLabel);
    pl.setAttribute('for', 'pl_' + a.id);
    pf.appendChild(pl);
    var level = K.el('select');
    level.id = 'pl_' + a.id;
    K.fillLevels(level, T.noPlacement);
    pf.appendChild(level);
    act.appendChild(pf);

    function placementVisible() {
      pf.hidden = to.value !== 'placement_pending';
    }
    to.addEventListener('change', placementVisible);
    placementVisible();

    var rf = K.el('div', 'stf-field');
    var rl = K.el('label', null, T.reasonLabel);
    rl.setAttribute('for', 'rs_' + a.id);
    rf.appendChild(rl);
    var ta = K.el('textarea');
    ta.id = 'rs_' + a.id;
    ta.setAttribute('dir', 'auto');
    rf.appendChild(ta);
    act.appendChild(rf);

    var buttons = K.el('div', 'stf-buttons');
    var btn = K.el('button', 'btn btn--gold', T.move);
    btn.type = 'button';
    var said = K.el('span', 'stf-said');
    said.setAttribute('aria-live', 'polite');
    buttons.appendChild(btn);
    buttons.appendChild(said);
    act.appendChild(buttons);

    btn.addEventListener('click', function () {
      if (!ta.value.trim()) {
        said.setAttribute('data-tone', 'bad');
        said.textContent = T.needReason;
        ta.focus();
        return;
      }
      var body = { applicationId: a.id, to: to.value, reason: ta.value.trim() };
      if (to.value === 'placement_pending' && level.value) {
        body.placementLevelId = Number(level.value);
      }
      btn.disabled = true;
      said.removeAttribute('data-tone');
      said.textContent = T.moving;
      K.api('/api/staff/applications', { method: 'PATCH', body: JSON.stringify(body) })
        .then(function () {
          said.setAttribute('data-tone', 'good');
          said.textContent = T.moved;
          K.withdraw(li, load);
        })
        .catch(function (e) {
          btn.disabled = false;
          said.setAttribute('data-tone', 'bad');
          said.textContent = detail(e);
        });
    });

    return act;
  }

  function offerAct(a, li) {
    var act = K.el('div', 'stf-act');
    act.appendChild(K.el('h3', null, T.offerHead));
    act.appendChild(K.el('p', 'stf-field__note', T.offerWhy));

    var lf = K.el('div', 'stf-field');
    var ll = K.el('label', null, T.offerLevel);
    ll.setAttribute('for', 'ol_' + a.id);
    lf.appendChild(ll);
    var level = K.el('select');
    level.id = 'ol_' + a.id;
    for (var i = 1; i <= 6; i++) {
      var o = K.el('option', null, K.levelWord(i));
      o.value = String(i);
      if (i === (a.placementLevelId || a.selfAssessedLevelId)) o.selected = true;
      level.appendChild(o);
    }
    lf.appendChild(level);
    act.appendChild(lf);

    var kf = K.el('div', 'stf-field');
    var kl = K.el('label', null, T.offerKind);
    kl.setAttribute('for', 'ok_' + a.id);
    kf.appendChild(kl);
    var kind = K.el('select');
    kind.id = 'ok_' + a.id;
    kind.setAttribute('data-offer-kind', '');
    K.fillOptions(kind, T.kinds);
    kf.appendChild(kind);
    act.appendChild(kf);

    var cf = K.el('div', 'stf-field');
    var cl = K.el('label', null, T.offerConditions);
    cl.setAttribute('for', 'oc_' + a.id);
    cf.appendChild(cl);
    var conditions = K.el('textarea');
    conditions.id = 'oc_' + a.id;
    conditions.setAttribute('dir', 'auto');
    cf.appendChild(conditions);
    cf.appendChild(K.el('p', 'stf-field__note', T.offerConditionsNote));
    act.appendChild(cf);

    function conditionsVisible() { cf.hidden = kind.value !== 'conditional'; }
    kind.addEventListener('change', conditionsVisible);
    conditionsVisible();

    var ef = K.el('div', 'stf-field');
    var el2 = K.el('label', null, T.offerExpiry);
    el2.setAttribute('for', 'oe_' + a.id);
    ef.appendChild(el2);
    var expiry = K.el('input');
    expiry.type = 'date';
    expiry.id = 'oe_' + a.id;
    expiry.setAttribute('data-offer-expiry', '');
    // Four weeks out: long enough to answer, short enough that the
    // College is not holding a place open for a year. The endpoint has
    // its own bounds and refuses anything outside them.
    expiry.value = new Date(Date.now() + 28 * 86400000).toISOString().slice(0, 10);
    ef.appendChild(expiry);
    act.appendChild(ef);

    var rf = K.el('div', 'stf-field');
    var rl = K.el('label', null, T.reasonLabel);
    rl.setAttribute('for', 'or_' + a.id);
    rf.appendChild(rl);
    var reason = K.el('textarea');
    reason.id = 'or_' + a.id;
    reason.setAttribute('data-offer-reason', '');
    reason.setAttribute('dir', 'auto');
    rf.appendChild(reason);
    act.appendChild(rf);

    var buttons = K.el('div', 'stf-buttons');
    var btn = K.el('button', 'btn btn--gold aurum', T.issue);
    btn.setAttribute('data-offer-send', '');
    btn.type = 'button';
    var said = K.el('span', 'stf-said');
    said.setAttribute('aria-live', 'polite');
    buttons.appendChild(btn);
    buttons.appendChild(said);
    act.appendChild(buttons);

    btn.addEventListener('click', function () {
      if (!level.value) { fail(said, T.needLevel, level); return; }
      if (!expiry.value) { fail(said, T.needExpiry, expiry); return; }
      if (kind.value === 'conditional' && !conditions.value.trim()) {
        fail(said, T.needConditions, conditions);
        return;
      }
      btn.disabled = true;
      said.removeAttribute('data-tone');
      said.textContent = T.issuing;
      K.api('/api/admissions/offer', {
        method: 'POST',
        body: JSON.stringify({
          applicationId: a.id,
          levelId: Number(level.value),
          kind: kind.value,
          conditions: kind.value === 'conditional' ? conditions.value.trim() : null,
          // The end of the chosen day rather than its first instant: an
          // offer expiring "on the 4th" that dies at midnight the night
          // before gives the applicant a day less than it says.
          expiresAt: expiry.value + 'T23:59:59.999Z',
          reason: reason.value.trim() || null,
        }),
      }).then(function () {
        said.setAttribute('data-tone', 'good');
        said.textContent = T.issued;
        K.withdraw(li, load);
      }).catch(function (e) {
        btn.disabled = false;
        said.setAttribute('data-tone', 'bad');
        said.textContent = detail(e);
      });
    });

    return act;
  }

  function fail(said, message, focus) {
    said.setAttribute('data-tone', 'bad');
    said.textContent = message;
    if (focus) focus.focus();
  }

  function detail(e) {
    if (!e.fields) return K.trouble(e);
    return K.trouble(e) + ' — ' + Object.keys(e.fields).map(function (k) {
      return k + ': ' + e.fields[k];
    }).join('; ');
  }

  /* ── THE QUEUE ─────────────────────────────────────────────────────── */

  function load() {
    var status = $('[data-queue-status]').value;
    return K.api('/api/staff/applications?limit=50' + (status ? '&status=' + status : ''))
      .then(function (d) {
        machine = d.machine || machine;
        renderCounts(d.byStatus);
        if (machine && machine.journey) renderJourney(machine.journey);

        $('[data-queue-head]').textContent = T.queueHead;
        var list = $('[data-queue]');
        list.textContent = '';
        (d.applications || []).forEach(function (a) { list.appendChild(applicationItem(a)); });

        var empty = $('[data-queue-empty]');
        empty.hidden = (d.applications || []).length > 0;
        $('[data-queue-empty-head]').textContent = T.queueEmpty;
        $('[data-queue-empty-note]').textContent = T.queueEmptyNote;
        $('#secQueue').hidden = false;
      });
  }

  function labels() {
    $('[data-queue-status-label]').textContent = T.statusLabel;
    var sel = $('[data-queue-status]');
    if (!sel.options.length) {
      K.fillOptions(sel, [['', T.allStatuses]].concat(
        ['submitted', 'placement_pending', 'offer_sent', 'accepted', 'enrolled', 'withdrawn', 'rejected']
          .map(function (s) { return [s, statusWord(s)]; }),
      ));
    }
  }

  function boot() {
    $('#state').textContent = T.loading;
    labels();
    load().then(function () {
      $('#state').textContent = T.ready + ' ' + T.readyRest;
    }).catch(function (e) {
      $('#state').textContent = K.trouble(e);
    });
  }

  document.addEventListener('DOMContentLoaded', function () {
    $('[data-queue-status]').addEventListener('change', function () {
      load().catch(function (e) { $('#state').textContent = K.trouble(e); });
    });
  });

  K.boot(boot);
})();
