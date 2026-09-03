/* WEC-LC — My Hours.
 *
 * The interface for GET / POST /api/staff/slots.
 *
 * ─────────────────────────────────────────────────────────────────────
 * THE TUTOR IS THE SESSION
 * ─────────────────────────────────────────────────────────────────────
 * There is no field on this page naming whose diary an hour goes into.
 * The endpoint has no such parameter either, and the reason is the same
 * in both places: a member of staff publishing hours into a colleague's
 * diary would put a stranger's name over an appointment a learner then
 * books.
 *
 * ─────────────────────────────────────────────────────────────────────
 * A LOCAL TIME IS NOT AN INSTANT
 * ─────────────────────────────────────────────────────────────────────
 * `datetime-local` gives a wall-clock reading with no zone on it. Sent
 * as typed it would mean whatever the server decided it meant. So this
 * page converts it to an instant through the browser's own zone before
 * sending, and prints the zone it used underneath the field, so the
 * tutor can see which four o'clock they just published.
 *
 * The diary comes back rendered in the zone the platform holds for the
 * tutor, which is not necessarily the browser's; that zone is named
 * above the list rather than assumed to match.
 *
 * ─────────────────────────────────────────────────────────────────────
 * AND WITHDRAWAL IS NOT DELETION
 * ─────────────────────────────────────────────────────────────────────
 * Withdrawing an hour keeps it, carrying the moment and the reason, and
 * releases every learner in it with that same reason on their record.
 * So the reason is required by the form, and the form says how many
 * people will read it before it is written — a learner shown
 * "cancelled" with no hand on it cannot tell whether they did it
 * themselves.
 */
(function () {
  'use strict';

  var K = window.WEC_LC_staff;
  var $ = K.$;
  var AR = K.AR;

  var KINDS = AR ? [
    ['tutorial', 'حصّة إفرادية'],
    ['office_hour', 'ساعة مكتبيّة'],
    ['oral_defence', 'مناقشة شفويّة'],
    ['workshop', 'ورشة'],
  ] : [
    ['tutorial', 'Tutorial'],
    ['office_hour', 'Office hour'],
    ['oral_defence', 'Oral defence'],
    ['workshop', 'Workshop'],
  ];

  var T = AR ? {
    loading: 'جارٍ تحميل دفترك…',
    ready: 'دفترك.',
    readyRest: 'ما فتحتَه من ساعاتٍ للحجز، ومَن فيها.',
    publishHead: 'انشر ساعة',
    publishWhy: 'الساعةُ تُنشَر باسمك أنت لا باسم غيرك؛ ولا حقلَ في هذه الصفحة يسمّي زميلًا. وما تنشره يظهر للمتعلّمين في جدولهم فورًا.',
    titleLabel: 'عنوان الساعة',
    kindLabel: 'نوعها',
    kindNote: 'يُعرَض النوعُ على المتعلّم كما هو، فاختر ما يصف اللقاء لا ما يصف نيّتك منه.',
    startLabel: 'متى تبدأ',
    zoneNote: function (z) { return 'يُقرأ ما تكتبه بتوقيت متصفّحك (' + z + ')، ويُحفَظ لحظةً بالتوقيت العالميّ.'; },
    minutesLabel: 'المدّة بالدقائق',
    capacityLabel: 'عدد المقاعد',
    capacityNote: 'مقعدٌ واحدٌ يجعلها حصّةً إفرادية. وما زاد يجعلها مجلسًا، ويرى فيه كلُّ متعلّمٍ أنّ معه غيره.',
    levelLabel: 'المستوى',
    levelNote: 'اترك «كلُّ المستويات» إن كانت الساعة مفتوحةً لمن شاء. وتحديدُ المستوى يُظهرها لأهله دون غيرهم.',
    allLevels: 'كلُّ المستويات',
    publish: 'انشر الساعة',
    publishing: 'جارٍ النشر…',
    published: 'نُشرت.',
    needTitle: 'العنوان مطلوب.',
    needStart: 'وقتُ البدء مطلوب.',
    diaryHead: 'دفترك',
    pastLabel: 'المدى',
    pastOptions: [['false', 'ما هو قادم'], ['true', 'كلُّ شيءٍ بما مضى']],
    zoneLine: function (z, src) {
      return 'مواقيتُ هذا الدفتر معروضةٌ بتوقيت ' + z + (src ? ' (' + src + ')' : '') + '، والأصلُ محفوظٌ بالتوقيت العالميّ.';
    },
    diaryEmpty: 'لا ساعةَ في دفترك.',
    diaryEmptyNote: 'انشر واحدةً من النموذج أعلاه، تظهر هنا ويراها المتعلّمون في جدولهم.',
    countPublished: 'ساعةٌ منشورة',
    countOpen: 'ما زالت مفتوحة',
    countTaken: 'مقعدٌ محجوز',
    places: function (b, c) { return b + ' من ' + c + ' مقعدًا'; },
    nobody: 'لم يحجز أحدٌ بعد',
    withdrawn: 'مسحوبة',
    withdrawnOn: function (d) { return 'سُحبت في ' + d; },
    who: 'مَن حجز',
    noteFrom: 'ما كتبه المتعلّم: ',
    withdrawHead: 'اسحب هذه الساعة',
    withdrawWhy: function (n) {
      return n === 0
        ? 'لم يحجز أحدٌ بعد، والسببُ مع ذلك مطلوبٌ ويبقى على السجلّ.'
        : 'سيُبلَّغ ' + n + ' من المتعلّمين بهذا السبب بعينه، ويُفكُّ حجزُهم به. اكتب ما تقوله لهم لا ما تقوله لنفسك.';
    },
    reasonLabel: 'السبب',
    withdraw: 'اسحبها',
    withdrawing: 'جارٍ السحب…',
    withdrawn2: 'سُحبت.',
    needReason: 'السبب مطلوب.',
  } : {
    loading: 'Loading your diary…',
    ready: 'Your diary.',
    readyRest: 'The hours you have opened for booking, and who is in them.',
    publishHead: 'Publish an hour',
    publishWhy: 'An hour is published under your name and nobody else’s — there is no field on this page naming a colleague. What you publish appears in your learners’ timetables immediately.',
    titleLabel: 'What the hour is called',
    kindLabel: 'What kind of hour',
    kindNote: 'The kind is shown to the learner as it stands, so choose what describes the meeting rather than what describes your intention for it.',
    startLabel: 'When it starts',
    zoneNote: function (z) { return 'What you type is read in your browser’s zone (' + z + ') and stored as an instant in UTC.'; },
    minutesLabel: 'How long, in minutes',
    capacityLabel: 'How many places',
    capacityNote: 'One place makes it a tutorial. More makes it a room, and every learner in it can see they are not alone.',
    levelLabel: 'Level',
    levelNote: 'Leave it at all levels for an hour open to anyone. Naming a level shows it to that level and to nobody else.',
    allLevels: 'All levels',
    publish: 'Publish the hour',
    publishing: 'Publishing…',
    published: 'Published.',
    needTitle: 'A title is required.',
    needStart: 'A start time is required.',
    diaryHead: 'Your diary',
    pastLabel: 'Showing',
    pastOptions: [['false', 'What is still to come'], ['true', 'Everything, including past']],
    zoneLine: function (z, src) {
      return 'This diary is rendered in ' + z + (src ? ' (' + src + ')' : '') + '. The instants themselves are held in UTC.';
    },
    diaryEmpty: 'There is nothing in your diary.',
    diaryEmptyNote: 'Publish one above and it appears here, and in your learners’ timetables.',
    countPublished: 'Hours published',
    countOpen: 'Still open',
    countTaken: 'Places taken',
    places: function (b, c) { return b + ' of ' + c + ' places'; },
    nobody: 'Nobody has booked yet',
    withdrawn: 'Withdrawn',
    withdrawnOn: function (d) { return 'Withdrawn on ' + d; },
    who: 'Who is booked',
    noteFrom: 'The learner wrote: ',
    withdrawHead: 'Withdraw this hour',
    withdrawWhy: function (n) {
      return n === 0
        ? 'Nobody has booked yet. A reason is still required and still stays on the record.'
        : n + ' learner' + (n === 1 ? '' : 's') + ' holding a place will be released with this exact reason on their own record. Write what you would say to them, not what you would note to yourself.';
    },
    reasonLabel: 'Reason',
    withdraw: 'Withdraw it',
    withdrawing: 'Withdrawing…',
    withdrawn2: 'Withdrawn.',
    needReason: 'A reason is required.',
  };

  /**
   * The offset, said the way a person says it. renderInstant() spells
   * UTC itself as the ISO-8601 'Z', which concatenated onto the word
   * gives "UTCZ" — printed on every hour in the diary until it was
   * rendered and read. Everything else is an offset and is printed as
   * one.
   */
  function offsetWord(offset) {
    if (!offset || offset === 'Z' || offset === '+00:00') return 'UTC';
    return 'UTC' + offset;
  }

  var browserZone = (function () {
    try { return Intl.DateTimeFormat().resolvedOptions().timeZone || 'UTC'; }
    catch (e) { return 'UTC'; }
  })();

  /* ── THE DIARY ─────────────────────────────────────────────────────── */

  function slotItem(s) {
    var li = K.plate('li');
    li.setAttribute('data-id', s.id);

    var head = K.el('div', 'stf-item__head');
    head.appendChild(K.dome(s.status === 'cancelled' ? 'i-ring' : 'i-clocktower'));
    var who = K.el('div', 'stf-item__who');
    who.appendChild(K.el('p', 'stf-item__name', s.title || s.kindLabel || ''));

    var at = s.startsAt ? s.startsAt.utc : null;
    var end = s.endsAt ? s.endsAt.utc : null;
    who.appendChild(K.el('p', 'stf-item__where',
      K.when(at) + (at ? ' · ' + K.clock(at) : '')
      + (end ? '–' + K.clock(end) : '')
      + (s.startsAt ? ' · ' + offsetWord(s.startsAt.offset) : '')));

    var marks = K.el('div', 'stf-item__marks');
    if (s.kindLabel) marks.appendChild(K.chip(s.kindLabel));
    if (s.levelId) marks.appendChild(K.chip(K.levelWord(s.levelId)));
    if (s.unitTitle) marks.appendChild(K.chip(s.unitTitle));
    marks.appendChild(K.chip(
      s.booked ? T.places(s.booked, s.capacity) : T.nobody,
      s.booked ? 'pinned' : 'muted',
    ));
    if (s.status === 'cancelled') marks.appendChild(K.chip(T.withdrawn, 'closed'));
    who.appendChild(marks);
    head.appendChild(who);
    li.appendChild(head);

    if (s.status === 'cancelled') {
      var w = K.el('div', 'stf-prior');
      w.appendChild(K.el('p', 'stf-panel__label', T.withdrawnOn(K.when(s.cancelledAt ? s.cancelledAt.utc : null))));
      var reason = K.el('p');
      reason.setAttribute('dir', 'auto');
      reason.textContent = s.cancelledReason || '';
      w.appendChild(reason);
      li.appendChild(w);
      return li;
    }

    var live = (s.bookings || []).filter(function (b) {
      return b.status !== 'cancelled_by_learner' && b.status !== 'cancelled_by_tutor';
    });

    if (live.length) {
      var panel = K.el('div', 'stf-panel');
      panel.appendChild(K.el('p', 'stf-panel__label', T.who));
      var box = K.el('div', 'stf-work');
      live.forEach(function (b) {
        var p = K.el('p');
        p.setAttribute('dir', 'auto');
        p.textContent = ((b.learner && (b.learner.preferredName || b.learner.email)) || '')
          + (b.note ? ' — ' + T.noteFrom + b.note : '');
        box.appendChild(p);
      });
      panel.appendChild(box);
      li.appendChild(panel);
    }

    li.appendChild(withdrawAct(s, li, live.length));
    return li;
  }

  function withdrawAct(s, li, holders) {
    var act = K.el('div', 'stf-act');
    act.appendChild(K.el('h3', null, T.withdrawHead));
    act.appendChild(K.el('p', 'stf-field__note', T.withdrawWhy(holders)));

    var field = K.el('div', 'stf-field');
    var lab = K.el('label', null, T.reasonLabel);
    lab.setAttribute('for', 'wr_' + s.id);
    field.appendChild(lab);
    var ta = K.el('textarea');
    ta.id = 'wr_' + s.id;
    ta.setAttribute('dir', 'auto');
    field.appendChild(ta);
    act.appendChild(field);

    var buttons = K.el('div', 'stf-buttons');
    var btn = K.el('button', 'btn btn--outline', T.withdraw);
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
      btn.disabled = true;
      said.removeAttribute('data-tone');
      said.textContent = T.withdrawing;
      K.api('/api/staff/slots', {
        method: 'POST',
        body: JSON.stringify({ action: 'withdraw', slotId: s.id, reason: ta.value.trim() }),
      }).then(function () {
        said.setAttribute('data-tone', 'good');
        said.textContent = T.withdrawn2;
        K.withdraw(li, loadDiary);
      }).catch(function (e) {
        btn.disabled = false;
        said.setAttribute('data-tone', 'bad');
        said.textContent = K.trouble(e);
      });
    });

    return act;
  }

  function loadDiary() {
    var past = $('[data-diary-past]').value === 'true';
    return K.api('/api/staff/slots?limit=50' + (past ? '&includePast=true' : '')).then(function (d) {
      var list = $('[data-diary]');
      list.textContent = '';
      (d.slots || []).forEach(function (s) { list.appendChild(slotItem(s)); });

      var empty = $('[data-diary-empty]');
      empty.hidden = (d.slots || []).length > 0;
      $('[data-diary-empty-head]').textContent = T.diaryEmpty;
      $('[data-diary-empty-note]').textContent = T.diaryEmptyNote;

      var zone = d.zone || {};
      $('[data-diary-zone]').textContent = T.zoneLine(zone.timeZone || 'UTC', zone.source || '');

      var c = d.counts || {};
      set('published', c.slots, T.countPublished);
      set('open', c.open, T.countOpen);
      set('taken', c.placesTaken, T.countTaken);
      $('#secCounts').hidden = false;
      $('#secDiary').hidden = false;
    });
  }

  function set(name, n, label) {
    var t = $('[data-tile="' + name + '"]');
    if (!t) return;
    t.querySelector('[data-count]').textContent = String(n === undefined || n === null ? 0 : n);
    t.querySelector('[data-label]').textContent = label;
  }

  /* ── PUBLISHING ────────────────────────────────────────────────────── */

  /**
   * A wall-clock reading becomes an instant. `new Date('2026-09-01T16:00')`
   * is interpreted in the browser's own zone, which is the zone the tutor
   * typed in — and is exactly why the field says which zone that is.
   */
  function instantFrom(local) {
    if (!local) return null;
    var d = new Date(local);
    return isNaN(d.getTime()) ? null : d.toISOString();
  }

  function publish() {
    var said = $('[data-publish-said]');
    var title = $('[data-publish-title]').value.trim();
    var startsAt = instantFrom($('[data-publish-start]').value);

    if (!title) {
      said.setAttribute('data-tone', 'bad');
      said.textContent = T.needTitle;
      $('[data-publish-title]').focus();
      return;
    }
    if (!startsAt) {
      said.setAttribute('data-tone', 'bad');
      said.textContent = T.needStart;
      $('[data-publish-start]').focus();
      return;
    }

    var level = $('[data-publish-level]').value;
    var btn = $('[data-publish-send]');
    btn.disabled = true;
    said.removeAttribute('data-tone');
    said.textContent = T.publishing;

    K.api('/api/staff/slots', {
      method: 'POST',
      body: JSON.stringify({
        action: 'publish',
        title: title,
        kind: $('[data-publish-kind]').value,
        startsAt: startsAt,
        durationMinutes: Number($('[data-publish-minutes]').value) || 30,
        capacity: Number($('[data-publish-capacity]').value) || 1,
        levelId: level ? Number(level) : null,
      }),
    }).then(function () {
      btn.disabled = false;
      said.setAttribute('data-tone', 'good');
      said.textContent = T.published;
      $('[data-publish-title]').value = '';
      return loadDiary();
    }).catch(function (e) {
      btn.disabled = false;
      said.setAttribute('data-tone', 'bad');
      // A field-level refusal is more useful than the sentence alone.
      said.textContent = e.fields
        ? K.trouble(e) + ' — ' + Object.keys(e.fields).map(function (k) {
          return k + ': ' + e.fields[k];
        }).join('; ')
        : K.trouble(e);
    });
  }

  function labels() {
    $('[data-publish-head]').textContent = T.publishHead;
    $('[data-publish-why]').textContent = T.publishWhy;
    $('[data-publish-title-label]').textContent = T.titleLabel;
    $('[data-publish-kind-label]').textContent = T.kindLabel;
    $('[data-publish-kind-note]').textContent = T.kindNote;
    $('[data-publish-start-label]').textContent = T.startLabel;
    $('[data-publish-zone]').textContent = T.zoneNote(browserZone);
    $('[data-publish-minutes-label]').textContent = T.minutesLabel;
    $('[data-publish-capacity-label]').textContent = T.capacityLabel;
    $('[data-publish-capacity-note]').textContent = T.capacityNote;
    $('[data-publish-level-label]').textContent = T.levelLabel;
    $('[data-publish-level-note]').textContent = T.levelNote;
    $('[data-publish-send]').textContent = T.publish;
    $('[data-diary-head]').textContent = T.diaryHead;
    $('[data-diary-past-label]').textContent = T.pastLabel;
    K.fillOptions($('[data-publish-kind]'), KINDS);
    K.fillLevels($('[data-publish-level]'), T.allLevels);
    K.fillOptions($('[data-diary-past]'), T.pastOptions);
  }

  function load() {
    $('#state').textContent = T.loading;
    labels();
    $('#secPublish').hidden = false;
    loadDiary().then(function () {
      $('#state').textContent = T.ready + ' ' + T.readyRest;
    }).catch(function (e) {
      $('#state').textContent = K.trouble(e);
      // The form still stands: a tutor whose diary failed to load can
      // still publish, and hiding the form would make one failure look
      // like two.
    });
  }

  document.addEventListener('DOMContentLoaded', function () {
    $('[data-publish-send]').addEventListener('click', publish);
    $('[data-diary-past]').addEventListener('change', function () {
      loadDiary().catch(function (e) { $('#state').textContent = K.trouble(e); });
    });
  });

  K.boot(load);
})();
