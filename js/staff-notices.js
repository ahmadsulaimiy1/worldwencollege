/* WEC-LC — Notices and correspondence.
 *
 * The interface for GET / POST / PATCH / DELETE
 * /api/staff/announcements, and for GET /api/messages plus
 * GET / POST /api/messages/{thread}.
 *
 * ─────────────────────────────────────────────────────────────────────
 * THE FORM TAKES BOTH EDITIONS AT ONCE
 * ─────────────────────────────────────────────────────────────────────
 * A notice may be published in one language or two. Asking for the
 * translation as a second act guarantees it is the act that gets
 * skipped, so both fields are on one form and the second is sent as
 * `translation` when it is filled in. Where a reader's language is not
 * among the editions the College says so; it never shows an Arabic
 * notice under an English heading.
 *
 * ─────────────────────────────────────────────────────────────────────
 * PUBLISHED IS NOT A DRAFT WITH A FLAG ON IT
 * ─────────────────────────────────────────────────────────────────────
 * Once a notice is published, its audience is frozen — the endpoint
 * refuses to re-scope it, because the table keeps no update trail and a
 * silent re-scope would be a rewrite of what the College told the room.
 * This page therefore offers amendment of the WORDS on a published
 * notice and not of its audience, so the refusal is visible in the
 * interface rather than met as a 422.
 *
 * ─────────────────────────────────────────────────────────────────────
 * AND WITHDRAWAL IS AN ACT WITH A REASON, NOT A DELETE
 * ─────────────────────────────────────────────────────────────────────
 * The notice, its publication date and its read receipts all survive.
 * The reason is required and stays on the record: what the College said
 * and then took back is precisely what a reviewer asks about.
 *
 * ─────────────────────────────────────────────────────────────────────
 * REACH, NOT "VIEWS"
 * ─────────────────────────────────────────────────────────────────────
 * How many people have read a notice is a fact about the notice. Who
 * has NOT read it is a fact about named learners, is not the board's to
 * publish, and is not on this page because it is not in the payload.
 */
(function () {
  'use strict';

  var K = window.WEC_LC_staff;
  var $ = K.$;
  var AR = K.AR;

  var T = AR ? {
    loading: 'جارٍ تحميل اللوحة…',
    ready: 'لوحةُ الإعلانات ومراسلاتك.',
    readyRest: 'ما تقوله الكلّيةُ لمتعلّميك، وما قالوه لك.',
    writeHead: 'اكتب إعلانًا',
    writeWhy: 'يُنشَر الإعلانُ باسم الحساب الذي أنت فيه، ولا حقلَ يسمّي غيرَك. واكتب النسختين إن استطعت: فالمتعلّمُ الذي ليست لغتُه من لغتَي الإعلان يُقال له ذلك، ولا يُعرَض عليه إعلانٌ بلغةٍ لا يقرؤها تحت عنوانٍ بلغةٍ يقرؤها.',
    scopeLabel: 'إلى مَن',
    scopeNote: 'إعلانُ المؤسّسة يبلغ كلَّ متعلّمٍ في الكلّية. وإعلانُ المستوى يبلغ أهلَه وحدَهم.',
    scopes: [['level', 'إلى مستوًى بعينه'], ['institution', 'إلى الكلّية كلِّها']],
    levelLabel: 'المستوى',
    titleLabel: 'العنوان (بالإنجليزية)',
    bodyLabel: 'النصّ (بالإنجليزية)',
    titleArLabel: 'العنوان (بالعربية)',
    bodyArLabel: 'النصّ (بالعربية)',
    translationNote: 'اترك الحقلين العربيّين فارغين لتنشر بالإنجليزية وحدَها. وإن كتبتَ أحدَهما فاكتب الآخر: نصفُ نسخةٍ ليس نسخة.',
    publish: 'انشره الآن',
    draft: 'احفظه مسوّدة',
    publishing: 'جارٍ الحفظ…',
    publishedOk: 'نُشر.',
    draftedOk: 'حُفظ مسوّدة.',
    needTitle: 'العنوان مطلوب.',
    needBody: 'النصّ مطلوب.',
    needBothAr: 'اكتب العنوانَ والنصَّ بالعربية معًا، أو اترك الحقلين فارغين.',
    boardHead: 'اللوحة',
    statusLabel: 'المعروض',
    statuses: [['', 'كلُّ شيء'], ['published', 'المنشور'], ['draft', 'المسوّدات'], ['withdrawn', 'المسحوب']],
    boardEmpty: 'لا إعلانَ على اللوحة.',
    boardEmptyNote: 'ما تكتبه أعلاه يظهر هنا، وما نشره غيرُك ممّا لك أن تقرأه يظهر معه.',
    basisOwn: 'ترى هنا ما نشرتَه أنت وما وُجِّه إلى الكلّية أو إلى مستوًى بعينه. أمّا الإعلانُ الموجَّه إلى متعلّمٍ واحدٍ فرسالةٌ خاصّة، ولا يُقرأ إلّا لكاتبه أو لإدارةٍ.',
    scopeWord: { institution: 'إلى الكلّية كلِّها', level: 'إلى مستوًى', learner: 'إلى متعلّمٍ بعينه' },
    statusWord: { published: 'منشور', draft: 'مسوّدة', withdrawn: 'مسحوب' },
    pinned: 'مثبَّت',
    readBy: function (n) { return n === 0 ? 'لم يقرأه أحدٌ بعد' : 'قرأه ' + n; },
    editions: function (a) { return 'النسخ: ' + a.join(' · '); },
    publishedOn: function (d) { return 'نُشر في ' + d; },
    withdrawnOn: function (d) { return 'سُحب في ' + d; },
    amendHead: 'عدِّل نصَّه',
    amendWhy: 'يُعدَّل اللفظُ لا الجمهور: جمهورُ الإعلان المنشور مثبَّت، لأنّ إعادةَ توجيه ما قيل للناس جميعًا إلى واحدٍ منهم تغييرٌ لا أثرَ له في السجلّ.',
    amend: 'احفظ التعديل',
    amended: 'عُدِّل.',
    withdrawHead: 'اسحبه',
    withdrawWhy: 'لا يُحذف شيء. يبقى الإعلانُ وتاريخُ نشره ومَن قرأه، ويُقيَّد السببُ معها. والسببُ مطلوب.',
    reasonLabel: 'السبب',
    withdraw: 'اسحبه',
    withdrawing: 'جارٍ السحب…',
    withdrawnOk: 'سُحب.',
    needReason: 'السبب مطلوب.',
    threadsHead: 'مراسلاتك',
    threadsNote: 'لا يُقرأ الخيطُ إلّا لمن هو طرفٌ فيه؛ والصفحةُ لا تختار ذلك، بل قاعدةُ البيانات: الخيطُ الذي لم تُضَف إليه لا يُقرأ لك أصلًا.',
    threadsEmpty: 'لا خيطَ مفتوحٌ معك.',
    threadsEmptyNote: 'ما يكتبه إليك متعلّموك يظهر هنا، وما تفتحه أنت من سجلِّ المتعلّم يظهر معه.',
    unreadN: function (n) { return n + ' غير مقروء'; },
    replyLabel: 'ردُّك',
    reply: 'أرسل',
    replying: 'جارٍ الإرسال…',
    replied: 'أُرسل.',
    needReply: 'اكتب شيئًا قبل الإرسال.',
    openThread: 'افتح الخيط',
    withdrawnMsg: '(سُحبت هذه الرسالة)',
    you: 'أنت',
  } : {
    loading: 'Loading the board…',
    ready: 'The notice board, and your correspondence.',
    readyRest: 'What the College is saying to your learners, and what they have said to you.',
    writeHead: 'Write a notice',
    writeWhy: 'A notice is published under the account you are signed in as, and there is no field naming anybody else. Write both editions where you can: a learner whose language is not among a notice’s editions is told so, and is never shown a notice in a language they do not read under a heading in one they do.',
    scopeLabel: 'Who it is addressed to',
    scopeNote: 'An institution notice reaches every learner in the College. A level notice reaches that level and nobody else.',
    scopes: [['level', 'One level'], ['institution', 'The whole College']],
    levelLabel: 'Level',
    titleLabel: 'Title (English)',
    bodyLabel: 'The notice (English)',
    titleArLabel: 'Title (Arabic)',
    bodyArLabel: 'The notice (Arabic)',
    translationNote: 'Leave both Arabic fields empty to publish in English alone. If you write one of them, write the other — half an edition is not an edition.',
    publish: 'Publish it now',
    draft: 'Save as a draft',
    publishing: 'Saving…',
    publishedOk: 'Published.',
    draftedOk: 'Saved as a draft.',
    needTitle: 'A title is required.',
    needBody: 'The notice itself is required.',
    needBothAr: 'Write the Arabic title and body together, or leave both empty.',
    boardHead: 'The board',
    statusLabel: 'Showing',
    statuses: [['', 'Everything'], ['published', 'Published'], ['draft', 'Drafts'], ['withdrawn', 'Withdrawn']],
    boardEmpty: 'There is nothing on the board.',
    boardEmptyNote: 'What you write above appears here, alongside what colleagues have addressed to the College or to a level.',
    basisOwn: 'You see the notices you wrote, and every notice addressed to the College or to a level. A notice addressed to a single learner is a private letter and is read only by its author or by an administrator.',
    scopeWord: { institution: 'The whole College', level: 'One level', learner: 'One learner' },
    statusWord: { published: 'Published', draft: 'Draft', withdrawn: 'Withdrawn' },
    pinned: 'Pinned',
    readBy: function (n) { return n === 0 ? 'Nobody has read it yet' : 'Read by ' + n; },
    editions: function (a) { return 'Editions: ' + a.join(' · '); },
    publishedOn: function (d) { return 'Published ' + d; },
    withdrawnOn: function (d) { return 'Withdrawn ' + d; },
    amendHead: 'Amend the wording',
    amendWhy: 'The words may be amended; the audience of a published notice may not. Re-scoping what the College told a room down to one person would be a rewrite with nothing on the record to show it happened.',
    amend: 'Save the amendment',
    amended: 'Amended.',
    withdrawHead: 'Withdraw it',
    withdrawWhy: 'Nothing is deleted. The notice, the date it was published and everyone who read it all survive, and the reason is recorded beside them. A reason is required.',
    reasonLabel: 'Reason',
    withdraw: 'Withdraw it',
    withdrawing: 'Withdrawing…',
    withdrawnOk: 'Withdrawn.',
    needReason: 'A reason is required.',
    threadsHead: 'Your correspondence',
    threadsNote: 'A thread is readable only by the people in it, and that is not this page’s choice: a thread you were never added to is not read out of the database on your request at all.',
    threadsEmpty: 'No thread is open with you.',
    threadsEmptyNote: 'What your learners write to you appears here, along with any thread you open from a learner’s record.',
    unreadN: function (n) { return n + ' unread'; },
    replyLabel: 'Your reply',
    reply: 'Send',
    replying: 'Sending…',
    replied: 'Sent.',
    needReply: 'Write something before sending.',
    openThread: 'Open the thread',
    withdrawnMsg: '(This message was withdrawn.)',
    you: 'You',
  };

  /* ── WRITING ONE ───────────────────────────────────────────────────── */

  function scopeChanged() {
    $('[data-write-level-field]').hidden = $('[data-write-scope]').value !== 'level';
  }

  function compose(status) {
    var said = $('[data-write-said]');
    var title = $('[data-write-title]').value.trim();
    var body = $('[data-write-body]').value.trim();
    var titleAr = $('[data-write-title-ar]').value.trim();
    var bodyAr = $('[data-write-body-ar]').value.trim();

    if (!title) { fail(said, T.needTitle, $('[data-write-title]')); return; }
    if (!body) { fail(said, T.needBody, $('[data-write-body]')); return; }
    if (Boolean(titleAr) !== Boolean(bodyAr)) {
      fail(said, T.needBothAr, titleAr ? $('[data-write-body-ar]') : $('[data-write-title-ar]'));
      return;
    }

    var scope = $('[data-write-scope]').value;
    var payload = {
      audienceScope: scope,
      language: 'en',
      title: title,
      body: body,
      status: status,
    };
    if (scope === 'level') payload.levelId = Number($('[data-write-level]').value) || 1;
    if (titleAr) payload.translation = { language: 'ar', title: titleAr, body: bodyAr };

    var btns = [$('[data-write-publish]'), $('[data-write-draft]')];
    btns.forEach(function (b) { b.disabled = true; });
    said.removeAttribute('data-tone');
    said.textContent = T.publishing;

    K.api('/api/staff/announcements', { method: 'POST', body: JSON.stringify(payload) })
      .then(function () {
        btns.forEach(function (b) { b.disabled = false; });
        said.setAttribute('data-tone', 'good');
        said.textContent = status === 'published' ? T.publishedOk : T.draftedOk;
        ['[data-write-title]', '[data-write-body]', '[data-write-title-ar]', '[data-write-body-ar]']
          .forEach(function (s) { $(s).value = ''; });
        return loadBoard();
      })
      .catch(function (e) {
        btns.forEach(function (b) { b.disabled = false; });
        said.setAttribute('data-tone', 'bad');
        said.textContent = detail(e);
      });
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

  /* ── THE BOARD ─────────────────────────────────────────────────────── */

  function noticeItem(a) {
    var li = K.plate('li');
    li.setAttribute('data-id', a.id);

    var head = K.el('div', 'stf-item__head');
    head.appendChild(K.dome(a.status === 'withdrawn' ? 'i-ring' : 'i-scroll'));
    var who = K.el('div', 'stf-item__who');
    who.appendChild(K.el('p', 'stf-item__name', (a.primary && a.primary.title) || ''));
    who.appendChild(K.el('p', 'stf-item__where',
      (a.author && (a.author.name || a.author.email)) || ''));

    var marks = K.el('div', 'stf-item__marks');
    marks.appendChild(K.chip(T.statusWord[a.status] || a.status,
      a.status === 'published' ? 'answered' : (a.status === 'withdrawn' ? 'closed' : 'muted')));
    marks.appendChild(K.chip((T.scopeWord[a.audience && a.audience.scope]
      || (a.audience && a.audience.scope) || '')
      + (a.audience && a.audience.levelId ? ' · ' + K.levelWord(a.audience.levelId) : '')));
    if (a.pinned) marks.appendChild(K.chip(T.pinned, 'pinned'));
    marks.appendChild(K.chip(T.readBy(a.readCount || 0)));
    if (a.availableLanguages) marks.appendChild(K.chip(T.editions(a.availableLanguages)));
    who.appendChild(marks);
    head.appendChild(who);
    li.appendChild(head);

    var panel = K.el('div', 'stf-panel');
    var box = K.el('div', 'stf-work');
    K.prose(box, a.primary && a.primary.body);
    if (a.translation) {
      var rule = K.el('p', 'stf-panel__label', a.translation.language);
      box.appendChild(rule);
      var second = K.el('div');
      K.prose(second, a.translation.body);
      while (second.firstChild) box.appendChild(second.firstChild);
    }
    panel.appendChild(box);
    li.appendChild(panel);

    var dates = K.el('p', 'stf-item__where');
    dates.textContent = [
      a.publishedAt ? T.publishedOn(K.when(a.publishedAt)) : '',
      a.withdrawnAt ? T.withdrawnOn(K.when(a.withdrawnAt)) : '',
    ].filter(Boolean).join(' · ');
    li.appendChild(dates);

    if (a.status === 'withdrawn') {
      var w = K.el('div', 'stf-prior');
      var reason = K.el('p');
      reason.setAttribute('dir', 'auto');
      reason.textContent = a.withdrawnReason || '';
      w.appendChild(reason);
      li.appendChild(w);
      return li;
    }

    li.appendChild(amendAct(a));
    li.appendChild(withdrawAct(a, li));
    return li;
  }

  function amendAct(a) {
    var act = K.el('div', 'stf-act');
    act.appendChild(K.el('h3', null, T.amendHead));
    act.appendChild(K.el('p', 'stf-field__note', T.amendWhy));

    var tf = K.el('div', 'stf-field');
    var tl = K.el('label', null, T.titleLabel);
    tl.setAttribute('for', 'at_' + a.id);
    tf.appendChild(tl);
    var ti = K.el('input');
    ti.type = 'text'; ti.id = 'at_' + a.id; ti.setAttribute('dir', 'auto');
    ti.value = (a.primary && a.primary.title) || '';
    tf.appendChild(ti);
    act.appendChild(tf);

    var bf = K.el('div', 'stf-field');
    var bl = K.el('label', null, T.bodyLabel);
    bl.setAttribute('for', 'ab_' + a.id);
    bf.appendChild(bl);
    var bi = K.el('textarea');
    bi.id = 'ab_' + a.id; bi.setAttribute('dir', 'auto');
    bi.value = (a.primary && a.primary.body) || '';
    bf.appendChild(bi);
    act.appendChild(bf);

    var buttons = K.el('div', 'stf-buttons');
    var btn = K.el('button', 'btn btn--outline', T.amend);
    btn.type = 'button';
    var said = K.el('span', 'stf-said');
    said.setAttribute('aria-live', 'polite');
    buttons.appendChild(btn);
    buttons.appendChild(said);
    act.appendChild(buttons);

    btn.addEventListener('click', function () {
      if (!ti.value.trim()) { fail(said, T.needTitle, ti); return; }
      if (!bi.value.trim()) { fail(said, T.needBody, bi); return; }
      btn.disabled = true;
      said.removeAttribute('data-tone');
      said.textContent = T.publishing;
      K.api('/api/staff/announcements?id=' + encodeURIComponent(a.id), {
        method: 'PATCH',
        body: JSON.stringify({
          language: (a.primary && a.primary.language) || 'en',
          title: ti.value.trim(),
          body: bi.value.trim(),
        }),
      }).then(function () {
        said.setAttribute('data-tone', 'good');
        said.textContent = T.amended;
        return loadBoard();
      }).catch(function (e) {
        btn.disabled = false;
        said.setAttribute('data-tone', 'bad');
        said.textContent = detail(e);
      });
    });

    return act;
  }

  function withdrawAct(a, li) {
    var act = K.el('div', 'stf-act');
    act.appendChild(K.el('h3', null, T.withdrawHead));
    act.appendChild(K.el('p', 'stf-field__note', T.withdrawWhy));

    var field = K.el('div', 'stf-field');
    var lab = K.el('label', null, T.reasonLabel);
    lab.setAttribute('for', 'wr_' + a.id);
    field.appendChild(lab);
    var ta = K.el('textarea');
    ta.id = 'wr_' + a.id;
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
      if (!ta.value.trim()) { fail(said, T.needReason, ta); return; }
      btn.disabled = true;
      said.removeAttribute('data-tone');
      said.textContent = T.withdrawing;
      K.api('/api/staff/announcements?id=' + encodeURIComponent(a.id), {
        method: 'DELETE',
        body: JSON.stringify({ reason: ta.value.trim() }),
      }).then(function () {
        said.setAttribute('data-tone', 'good');
        said.textContent = T.withdrawnOk;
        K.withdraw(li, loadBoard);
      }).catch(function (e) {
        btn.disabled = false;
        said.setAttribute('data-tone', 'bad');
        said.textContent = detail(e);
      });
    });

    return act;
  }

  function loadBoard() {
    var status = $('[data-board-status]').value;
    return K.api('/api/staff/announcements?limit=50' + (status ? '&status=' + status : ''))
      .then(function (d) {
        $('[data-board-basis]').textContent = T.basisOwn;
        var list = $('[data-board]');
        list.textContent = '';
        (d.announcements || []).forEach(function (a) { list.appendChild(noticeItem(a)); });
        var empty = $('[data-board-empty]');
        empty.hidden = (d.announcements || []).length > 0;
        $('[data-board-empty-head]').textContent = T.boardEmpty;
        $('[data-board-empty-note]').textContent = T.boardEmptyNote;
        $('#secBoard').hidden = false;
      });
  }

  /* ── CORRESPONDENCE ────────────────────────────────────────────────── */

  function threadItem(t) {
    var li = K.plate('li');
    li.setAttribute('data-id', t.id);

    var head = K.el('div', 'stf-item__head');
    head.appendChild(K.dome('i-envelope'));
    var who = K.el('div', 'stf-item__who');
    who.appendChild(K.el('p', 'stf-item__name', t.subject || ''));
    who.appendChild(K.el('p', 'stf-item__where',
      (t.participants || []).map(function (p) { return p.name || p.party || ''; })
        .filter(Boolean).join(' · ')));

    var marks = K.el('div', 'stf-item__marks');
    if (t.levelId) marks.appendChild(K.chip(K.levelWord(t.levelId)));
    if (t.unitTitle) marks.appendChild(K.chip(t.unitTitle));
    if (t.unread) marks.appendChild(K.chip(T.unreadN(t.unread), 'unread'));
    marks.appendChild(K.chip(K.when(t.lastMessageAt, true)));
    who.appendChild(marks);
    head.appendChild(who);
    li.appendChild(head);

    var panel = K.el('div', 'stf-panel');
    var body = K.el('div', 'stf-work');
    body.textContent = '';
    panel.appendChild(body);
    li.appendChild(panel);

    var buttons = K.el('div', 'stf-buttons');
    var btn = K.el('button', 'btn btn--outline', T.openThread);
    btn.type = 'button';
    var said = K.el('span', 'stf-said');
    said.setAttribute('aria-live', 'polite');
    buttons.appendChild(btn);
    buttons.appendChild(said);
    li.appendChild(buttons);

    btn.addEventListener('click', function () {
      btn.disabled = true;
      // Reading a thread IS a write: the server moves this member of
      // staff's watermark to the last message it actually returned. So
      // the thread is fetched when it is opened and never on page load,
      // which would mark every conversation read the moment the console
      // was left on a screen.
      K.api('/api/messages/' + encodeURIComponent(t.id)).then(function (d) {
        btn.remove();
        renderMessages(body, d);
        li.appendChild(replyAct(t, body));
      }).catch(function (e) {
        btn.disabled = false;
        said.setAttribute('data-tone', 'bad');
        said.textContent = K.trouble(e);
      });
    });

    return li;
  }

  function renderMessages(box, d) {
    box.textContent = '';
    (d.messages || []).forEach(function (m) {
      var head = K.el('p', 'stf-panel__label',
        ((m.sender && (m.sender.isYou ? T.you : (m.sender.name || m.sender.party))) || '')
        + ' · ' + K.when(m.sentAt, true));
      box.appendChild(head);
      var p = K.el('p');
      p.setAttribute('dir', 'auto');
      p.textContent = m.withdrawn ? T.withdrawnMsg : (m.body || '');
      box.appendChild(p);
    });
  }

  function replyAct(t, box) {
    var act = K.el('div', 'stf-act');
    var field = K.el('div', 'stf-field');
    var lab = K.el('label', null, T.replyLabel);
    lab.setAttribute('for', 'rp_' + t.id);
    field.appendChild(lab);
    var ta = K.el('textarea');
    ta.id = 'rp_' + t.id;
    ta.setAttribute('dir', 'auto');
    field.appendChild(ta);
    act.appendChild(field);

    var buttons = K.el('div', 'stf-buttons');
    var btn = K.el('button', 'btn btn--gold', T.reply);
    btn.type = 'button';
    var said = K.el('span', 'stf-said');
    said.setAttribute('aria-live', 'polite');
    buttons.appendChild(btn);
    buttons.appendChild(said);
    act.appendChild(buttons);

    btn.addEventListener('click', function () {
      if (!ta.value.trim()) { fail(said, T.needReply, ta); return; }
      btn.disabled = true;
      said.removeAttribute('data-tone');
      said.textContent = T.replying;
      K.api('/api/messages/' + encodeURIComponent(t.id), {
        method: 'POST',
        body: JSON.stringify({ body: ta.value.trim() }),
      }).then(function () {
        btn.disabled = false;
        ta.value = '';
        said.setAttribute('data-tone', 'good');
        said.textContent = T.replied;
        return K.api('/api/messages/' + encodeURIComponent(t.id)).then(function (d) {
          renderMessages(box, d);
        });
      }).catch(function (e) {
        btn.disabled = false;
        said.setAttribute('data-tone', 'bad');
        said.textContent = detail(e);
      });
    });

    return act;
  }

  function loadThreads() {
    return K.api('/api/messages?limit=50').then(function (d) {
      $('[data-threads-note]').textContent = T.threadsNote;
      var list = $('[data-threads]');
      list.textContent = '';
      (d.threads || []).forEach(function (t) { list.appendChild(threadItem(t)); });
      var empty = $('[data-threads-empty]');
      empty.hidden = (d.threads || []).length > 0;
      $('[data-threads-empty-head]').textContent = T.threadsEmpty;
      $('[data-threads-empty-note]').textContent = T.threadsEmptyNote;
      $('#secThreads').hidden = false;
    });
  }

  /* ── BOOT ──────────────────────────────────────────────────────────── */

  function labels() {
    $('[data-write-head]').textContent = T.writeHead;
    $('[data-write-why]').textContent = T.writeWhy;
    $('[data-write-scope-label]').textContent = T.scopeLabel;
    $('[data-write-scope-note]').textContent = T.scopeNote;
    $('[data-write-level-label]').textContent = T.levelLabel;
    $('[data-write-title-label]').textContent = T.titleLabel;
    $('[data-write-body-label]').textContent = T.bodyLabel;
    $('[data-write-title-ar-label]').textContent = T.titleArLabel;
    $('[data-write-body-ar-label]').textContent = T.bodyArLabel;
    $('[data-write-translation-note]').textContent = T.translationNote;
    $('[data-write-publish]').textContent = T.publish;
    $('[data-write-draft]').textContent = T.draft;
    $('[data-board-head]').textContent = T.boardHead;
    $('[data-board-status-label]').textContent = T.statusLabel;
    $('[data-threads-head]').textContent = T.threadsHead;
    K.fillOptions($('[data-write-scope]'), T.scopes);
    K.fillOptions($('[data-board-status]'), T.statuses);
    // The level list here carries no "all levels" entry: a level notice
    // must name one, and an empty option would be an audience.
    var sel = $('[data-write-level]');
    if (!sel.options.length) {
      for (var i = 1; i <= 6; i++) {
        var o = K.el('option', null, K.levelWord(i));
        o.value = String(i);
        sel.appendChild(o);
      }
    }
    scopeChanged();
  }

  function load() {
    $('#state').textContent = T.loading;
    labels();
    $('#secWrite').hidden = false;
    Promise.all([loadBoard(), loadThreads()]).then(function () {
      $('#state').textContent = T.ready + ' ' + T.readyRest;
    }).catch(function (e) {
      $('#state').textContent = K.trouble(e);
    });
  }

  document.addEventListener('DOMContentLoaded', function () {
    $('[data-write-scope]').addEventListener('change', scopeChanged);
    $('[data-write-publish]').addEventListener('click', function () { compose('published'); });
    $('[data-write-draft]').addEventListener('click', function () { compose('draft'); });
    $('[data-board-status]').addEventListener('change', function () {
      loadBoard().catch(function (e) { $('#state').textContent = K.trouble(e); });
    });
  });

  K.boot(load);
})();
