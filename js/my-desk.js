/* WEC-LC — My Desk.
 *
 * The interface for GET / POST /api/announcements, GET / POST
 * /api/messages and GET / POST /api/messages/{thread}. Items 8 and 9 of
 * the interface backlog. Until this file existed the Registrar could
 * address a learner and the learner had nowhere to be addressed.
 *
 * ─────────────────────────────────────────────────────────────────────
 * A RECEIPT IS WRITTEN WHEN A NOTICE IS OPENED, NEVER WHEN IT ARRIVES
 * ─────────────────────────────────────────────────────────────────────
 * The bodies are collapsed and POST /api/announcements is called on the
 * act of opening one. A page that marked the whole feed read on load
 * would leave a learner with a clear badge and an unread notice about
 * their fees, which is worse than no badge at all — and it would put
 * the College on record as having been read when it had not been.
 *
 * Dismissing is the SECOND act and the server keeps it separate, so
 * this page does too: a notice you have read stays here until you put
 * it away, and putting it away does not erase it.
 *
 * ─────────────────────────────────────────────────────────────────────
 * EVERY COUNT ON THIS PAGE IS THE SERVER'S
 * ─────────────────────────────────────────────────────────────────────
 * `unread` on both endpoints is a separate statement over the same
 * predicate as the list and is deliberately NOT capped by `limit`. The
 * page never decrements it locally after an act: it re-reads. A badge
 * kept in a variable is a badge that drifts from the record the first
 * time two tabs are open.
 *
 * ─────────────────────────────────────────────────────────────────────
 * THE RECIPIENTS ARE THE SERVER'S LIST
 * ─────────────────────────────────────────────────────────────────────
 * `canOpen` names what may be addressed and how many people stand
 * behind each desk. The page offers exactly that and nothing else. A
 * compose box that offered every level and discovered by refusal which
 * ones have a tutor behind them would make the College look broken at
 * the one moment a learner is asking it for help.
 *
 * Every value reaches the page through textContent. `format` on both
 * payloads is text/plain, and this file is what honours it.
 */
(function () {
  'use strict';

  var $ = function (s, r) { return (r || document).querySelector(s); };
  var AR = document.documentElement.lang === 'ar';
  var LOCALE = AR ? 'ar' : 'en-GB';
  var TZ = (function () {
    try { return Intl.DateTimeFormat().resolvedOptions().timeZone || 'UTC'; }
    catch (e) { return 'UTC'; }
  }());

  var T = AR ? {
    loading: 'جارٍ تحميل مكتبك…',
    signedOut: 'لست مسجَّل الدخول.',
    signedOutRest: 'مراسلاتك خاصّةٌ بك. سجّل الدخول لتراها.',
    failed: 'تعذّر تحميل مكتبك.',
    failedRest: 'هذا خللٌ عندنا. أعد المحاولة بعد قليل.',
    ready: 'مكتبك.',
    readyRest: 'ما وُجِّه إليك، وما أنت طرفٌ فيه.',
    noticesUnread: 'إعلانات غير مقروءة',
    threadsUnread: 'رسائل غير مقروءة',
    noNotices: 'لا إعلاناتٍ موجَّهةً إليك الآن. وحين توجَّه الكلّية إعلانًا إلى مستواك أو إليك وحدك يظهر هنا.',
    noThreads: 'لا محادثاتٍ مفتوحةً لك. اكتب إلى مدرّسي مستواك أو إلى مكتب المسجِّل متى شئت.',
    pinned: 'مثبَّت',
    unread: 'غير مقروء',
    institution: 'إلى الكلّية كلّها',
    toLevel: function (r, n) { return 'إلى المستوى ' + r + (n ? ' — ' + n : ''); },
    toYou: 'إليك وحدك',
    by: function (n) { return 'من ' + n; },
    byCollege: 'من الكلّية',
    open: 'افتح',
    close: 'أغلِق',
    dismiss: 'اصرِفه',
    dismissed: 'مصروف',
    showDismissed: function (n) { return 'أظهِر ما صرفتَه (' + n + ')'; },
    hideDismissed: 'أخفِ ما صرفتَه',
    fallbackEn: 'هذا الإعلان منشور باللغة الإنجليزية فقط.',
    fallbackAr: 'هذا الإعلان منشور باللغة العربية فقط.',
    statuses: { open: 'مفتوحة', answered: 'أُجيبت', closed: 'مغلقة' },
    parties: { learner: 'متعلّم', tutor: 'مدرّس', registrar: 'المسجِّل' },
    you: 'أنت',
    youCap: 'أنت',
    scopeLevel: function (r, n) { return 'المستوى ' + r + (n ? ' — ' + n : ''); },
    scopeUnit: function (t) { return 'الوحدة: ' + t; },
    messages: function (n) { return n === 1 ? 'رسالة واحدة' : n + ' رسائل'; },
    unreadN: function (n) { return n + ' غير مقروءة'; },
    allowance: function (o, l) { return 'فتحتَ ' + o + ' من ' + l + ' محادثاتٍ جديدةٍ في الأربع والعشرين ساعة الماضية. والردُّ في محادثةٍ قائمةٍ غير محدود.'; },
    allowanceSpent: function (at) { return 'بلغتَ حدَّ المحادثات الجديدة. والردُّ في محادثةٍ قائمةٍ غير محدود، وتُفتَح محادثةٌ جديدةٌ ابتداءً من ' + at + '.'; },
    cannotOpen: 'يُفتَح خطُّ المراسلة عند تسجيلك في مستوى. وحتّى ذلك الحين يجيب مكتب القبول عن السؤال.',
    tutorsOf: function (r, n) { return 'مدرّسو المستوى ' + r + (n ? ' — ' + n : ''); },
    registrarOf: function (r) { return 'مكتب المسجِّل (المستوى ' + r + ')'; },
    reachable: function (n) { return n === 1 ? 'شخصٌ واحدٌ على هذا المكتب' : n + ' أشخاصٍ على هذا المكتب'; },
    needSubject: 'الموضوع مطلوب.',
    needBody: 'الرسالة مطلوبة.',
    sending: 'جارٍ الإرسال…',
    sent: 'أُرسلت.',
    charsLeft: function (n) { return 'بقي ' + n + ' حرفًا.'; },
    withdrawn: 'سُحبت هذه الرسالة.',
    withdrawnFor: function (r) { return 'سُحبت هذه الرسالة: ' + r; },
    truncated: 'هذه المحادثة أطول ممّا يُعرَض؛ وأقدمُ رسائلها ليست في هذه الصفحة.',
    tzNote: function (z) { return 'الأوقات في هذه الصفحة معروضةٌ بتوقيت جهازك: ' + z + '.'; },
    loadFailed: 'تعذّرت قراءة هذه المحادثة.',
  } : {
    loading: 'Loading your desk…',
    signedOut: 'You are not signed in.',
    signedOutRest: 'Your correspondence is private to you. Sign in to see it.',
    failed: 'Your desk could not be loaded.',
    failedRest: 'This is a fault on our side. Please try again shortly.',
    ready: 'Your desk.',
    readyRest: 'What was addressed to you, and what you are party to.',
    noticesUnread: 'Notices unread',
    threadsUnread: 'Messages unread',
    noNotices: 'Nothing is addressed to you at present. A notice to your level, or to you alone, appears here when the College issues one.',
    noThreads: 'You have no open conversations. Write to the tutors of your level, or to the Registrar’s desk, whenever you need to.',
    pinned: 'Pinned',
    unread: 'Unread',
    institution: 'To the whole College',
    toLevel: function (r, n) { return 'To Level ' + r + (n ? ' — ' + n : ''); },
    toYou: 'To you alone',
    by: function (n) { return 'from ' + n; },
    byCollege: 'from the College',
    open: 'Open',
    close: 'Close',
    dismiss: 'Put it away',
    dismissed: 'Put away',
    showDismissed: function (n) { return 'Show what you have put away (' + n + ')'; },
    hideDismissed: 'Hide what you have put away',
    fallbackEn: 'This notice is published in English only.',
    fallbackAr: 'This notice is published in Arabic only.',
    statuses: { open: 'Open', answered: 'Answered', closed: 'Closed' },
    parties: { learner: 'Learner', tutor: 'Tutor', registrar: 'Registrar' },
    you: 'you',
    youCap: 'You',
    scopeLevel: function (r, n) { return 'Level ' + r + (n ? ' — ' + n : ''); },
    scopeUnit: function (t) { return 'Module: ' + t; },
    messages: function (n) { return n === 1 ? '1 message' : n + ' messages'; },
    unreadN: function (n) { return n + ' unread'; },
    allowance: function (o, l) { return 'You have opened ' + o + ' of ' + l + ' new conversations in the last 24 hours. Replying in a conversation you already have is not limited.'; },
    allowanceSpent: function (at) { return 'You have reached the limit on new conversations. Replying in one you already have is not limited, and the next new conversation may be opened from ' + at + '.'; },
    cannotOpen: 'The line opens when you are enrolled on a level. Until then the Admissions office answers.',
    tutorsOf: function (r, n) { return 'The tutors of Level ' + r + (n ? ' — ' + n : ''); },
    registrarOf: function (r) { return 'The Registrar’s desk (Level ' + r + ')'; },
    reachable: function (n) { return n === 1 ? '1 person stands behind this desk' : n + ' people stand behind this desk'; },
    needSubject: 'A subject is required.',
    needBody: 'A message is required.',
    sending: 'Sending…',
    sent: 'Sent.',
    charsLeft: function (n) { return n + ' characters left.'; },
    withdrawn: 'This message was withdrawn.',
    withdrawnFor: function (r) { return 'This message was withdrawn: ' + r; },
    truncated: 'This conversation is longer than the page shows; its oldest messages are not on this page.',
    tzNote: function (z) { return 'Times on this page are shown in your device’s time zone, ' + z + '.'; },
    loadFailed: 'That conversation could not be read.',
  };

  function el(tag, cls, text) {
    var n = document.createElement(tag);
    if (cls) n.className = cls;
    if (text !== undefined && text !== null && text !== '') n.textContent = text;
    return n;
  }

  function icon(id) {
    var svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    svg.setAttribute('class', 'icon');
    svg.setAttribute('aria-hidden', 'true');
    var use = document.createElementNS('http://www.w3.org/2000/svg', 'use');
    use.setAttribute('href', '#' + id);
    svg.appendChild(use);
    return svg;
  }

  /* A stored instant is UTC and carries no zone of its own on these
     payloads, so it is rendered in the reader's device zone and the page
     names that zone once rather than per row. Silence about which clock
     a time is on is the fault my-week.js exists to avoid. */
  function when(iso, withTime) {
    if (!iso) return '';
    var d = new Date(iso);
    if (isNaN(d.getTime())) return String(iso);
    var opts = { day: 'numeric', month: 'long', year: 'numeric' };
    if (withTime) { opts.hour = '2-digit'; opts.minute = '2-digit'; }
    return d.toLocaleString(LOCALE, opts);
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

  /* errorResponse() puts the CLASS NAME in `error` and the sentence in
     `message`. A page that reads `error` first shows a learner the word
     "AuthError", which is a fault report addressed to the wrong person. */
  function reasonFrom(body, fallback) {
    if (!body) return fallback;
    if (typeof body.message === 'string' && body.message.trim()) return body.message;
    if (typeof body.error === 'string' && /\s/.test(body.error)) return body.error;
    return fallback;
  }

  var language = AR ? 'ar' : 'en';
  var showDismissed = false;
  var openThreadId = null;
  var canOpen = [];

  /* ── NOTICES ─────────────────────────────────────────────────────── */

  function audienceLabel(a) {
    if (!a) return '';
    if (a.scope === 'institution') return T.institution;
    if (a.scope === 'learner') return T.toYou;
    return T.toLevel(a.levelRoman || '', a.levelName || '');
  }

  function noticeItem(n) {
    var li = el('li', 'desk-notice card edge-lit edge-lit--light aurum aurum--hover tilt gold-live');
    li.appendChild(el('span', 'tilt__sheen'));
    li.lastChild.setAttribute('aria-hidden', 'true');
    li.setAttribute('data-read', n.read ? 'yes' : 'no');
    li.setAttribute('data-put-away', n.dismissedAt ? 'yes' : 'no');

    var marks = el('p', 'desk-notice__marks');
    if (n.pinned) {
      var pin = el('span', 'desk-chip desk-chip--pinned');
      pin.appendChild(icon('i-seal'));
      pin.appendChild(document.createTextNode(T.pinned));
      marks.appendChild(pin);
    }
    if (!n.read) marks.appendChild(el('span', 'desk-chip desk-chip--unread', T.unread));
    marks.appendChild(el('span', 'desk-chip', audienceLabel(n.audience)));
    if (n.dismissedAt) marks.appendChild(el('span', 'desk-chip desk-chip--muted', T.dismissed));
    li.appendChild(marks);

    var h = el('h3', 'desk-notice__title', n.title || '');
    li.appendChild(h);

    var meta = el('p', 'desk-notice__meta');
    meta.appendChild(document.createTextNode(
      (n.author && n.author.name ? T.by(n.author.name) : T.byCollege) + ' · ' + when(n.publishFrom, false),
    ));
    li.appendChild(meta);

    if (n.fallback) {
      li.appendChild(el('p', 'desk-notice__edition',
        n.language === 'ar' ? T.fallbackAr : T.fallbackEn));
    }

    var body = el('div', 'desk-notice__body');
    body.hidden = true;
    body.setAttribute('dir', n.direction || (n.language === 'ar' ? 'rtl' : 'ltr'));
    body.setAttribute('lang', n.language || 'en');
    // text/plain. Paragraph breaks are the author's blank lines and
    // nothing else in the string is markup, by the endpoint's own
    // declared format.
    String(n.body || '').split(/\n{2,}/).forEach(function (para) {
      if (para.trim()) body.appendChild(el('p', null, para.trim()));
    });
    li.appendChild(body);

    var row = el('div', 'desk-notice__row');
    var toggle = el('button', 'btn btn--outline magnetic', T.open);
    toggle.type = 'button';
    toggle.addEventListener('click', function () {
      var opening = body.hidden;
      body.hidden = !opening;
      toggle.textContent = opening ? T.close : T.open;
      // The receipt is the act of opening, and only the first one needs
      // to travel. read_at is written once by the server and never moved.
      if (opening && !n.read) {
        n.read = true;
        li.setAttribute('data-read', 'yes');
        // The mark goes with the state it describes. Leaving "UNREAD"
        // on a notice the learner is reading is the page contradicting
        // itself in the one place it is being looked at.
        var mark = li.querySelector('.desk-chip--unread');
        if (mark) mark.remove();
        api('/api/announcements', {
          method: 'POST',
          body: JSON.stringify({ announcementId: n.id }),
        }).then(function (r) { if (r.ok) applyNoticeCount(r.data); });
      }
    });
    row.appendChild(toggle);

    if (!n.dismissedAt) {
      var away = el('button', 'btn btn--outline magnetic', T.dismiss);
      away.type = 'button';
      away.addEventListener('click', function () {
        away.disabled = true;
        api('/api/announcements', {
          method: 'POST',
          body: JSON.stringify({ announcementId: n.id, dismissed: true }),
        }).then(function (r) {
          if (r.ok) { applyNoticeCount(r.data); loadNotices(); } else { away.disabled = false; }
        });
      });
      row.appendChild(away);
    }
    li.appendChild(row);
    return li;
  }

  function applyNoticeCount(data) {
    if (!data || typeof data.unread !== 'number') return;
    $('[data-count-notices]').textContent = String(data.unread);
  }

  function renderNotices(feed) {
    $('#secNotices').hidden = false;
    $('[data-count-notices]').textContent = String(feed.unread || 0);

    var list = $('[data-notices]');
    list.textContent = '';
    var all = feed.announcements || [];
    var away = all.filter(function (n) { return n.dismissedAt; });
    var shown = showDismissed ? all : all.filter(function (n) { return !n.dismissedAt; });

    shown.forEach(function (n) { list.appendChild(noticeItem(n)); });

    var empty = $('[data-notices-empty]');
    empty.textContent = '';
    empty.hidden = shown.length > 0;
    if (!shown.length) empty.appendChild(document.createTextNode(T.noNotices));

    var existing = $('[data-away-toggle]');
    if (existing) existing.remove();
    if (away.length) {
      var t = el('button', 'desk-away btn btn--outline magnetic',
        showDismissed ? T.hideDismissed : T.showDismissed(away.length));
      t.type = 'button';
      t.setAttribute('data-away-toggle', '');
      t.addEventListener('click', function () {
        showDismissed = !showDismissed;
        renderNotices(feed);
      });
      $('#secNotices').appendChild(t);
    }
  }

  /* ── CORRESPONDENCE ──────────────────────────────────────────────── */

  function scopeLine(t) {
    if (t.scope === 'module' && t.unitTitle) return T.scopeUnit(t.unitTitle);
    return T.scopeLevel(t.levelRoman || '', t.levelName || '');
  }

  function partyNames(participants) {
    return (participants || []).map(function (p) {
      var name = p.isYou ? T.youCap : (p.name || T.parties[p.party] || '');
      return name + ' (' + (T.parties[p.party] || p.party) + ')';
    }).join(' · ');
  }

  function threadItem(t) {
    var li = el('li', 'desk-thread-row card edge-lit edge-lit--light aurum aurum--hover tilt gold-live');
    li.appendChild(el('span', 'tilt__sheen'));
    li.lastChild.setAttribute('aria-hidden', 'true');
    li.setAttribute('data-status', t.status);

    var marks = el('p', 'desk-thread-row__marks');
    marks.appendChild(el('span', 'desk-chip desk-chip--' + t.status, T.statuses[t.status] || t.status));
    if (t.unread) marks.appendChild(el('span', 'desk-chip desk-chip--unread', T.unreadN(t.unread)));
    marks.appendChild(el('span', 'desk-chip', scopeLine(t)));
    li.appendChild(marks);

    var btn = el('button', 'desk-thread-row__open', t.subject || '');
    btn.type = 'button';
    btn.addEventListener('click', function () { openThread(t.id); });
    li.appendChild(btn);

    li.appendChild(el('p', 'desk-thread-row__parties', partyNames(t.participants)));
    if (t.preview) li.appendChild(el('p', 'desk-thread-row__preview', t.preview));
    li.appendChild(el('p', 'desk-thread-row__meta',
      T.messages(t.messageCount || 0) + ' · ' + when(t.lastMessageAt, true)));
    return li;
  }

  function renderThreads(data) {
    $('#secThreads').hidden = false;
    $('[data-count-threads]').textContent = String(data.unread || 0);
    canOpen = data.canOpen || [];

    var list = $('[data-threads]');
    list.textContent = '';
    (data.threads || []).forEach(function (t) { list.appendChild(threadItem(t)); });

    var empty = $('[data-threads-empty]');
    empty.hidden = (data.threads || []).length > 0;
    empty.textContent = (data.threads || []).length ? '' : T.noThreads;

    var a = data.allowance || {};
    var note = $('[data-allowance]');
    if (canOpen.length === 0) {
      note.textContent = T.cannotOpen;
      $('[data-compose-open]').hidden = true;
    } else {
      $('[data-compose-open]').hidden = false;
      note.textContent = a.remaining > 0
        ? T.allowance(a.opened || 0, a.limit || 0)
        : T.allowanceSpent(when(a.nextAt, true));
    }
    buildRecipients();
  }

  function recipientLabel(o) {
    if (o.recipient === 'registrar') return T.registrarOf(o.levelRoman || '');
    if (o.recipient === 'tutors') return T.tutorsOf(o.levelRoman || '', o.levelName || '');
    return o.recipient;
  }

  function buildRecipients() {
    var sel = $('[data-recipient]');
    sel.textContent = '';
    canOpen.forEach(function (o, i) {
      var opt = el('option', null, recipientLabel(o));
      opt.value = String(i);
      sel.appendChild(opt);
    });
    noteRecipient();
  }

  function noteRecipient() {
    var sel = $('[data-recipient]');
    var o = canOpen[Number(sel.value) || 0];
    $('[data-recipient-note]').textContent = o && typeof o.reachable === 'number'
      ? T.reachable(o.reachable) : '';
  }

  function messageItem(m) {
    var li = el('li', 'desk-message');
    li.setAttribute('data-mine', m.sender && m.sender.isYou ? 'yes' : 'no');
    var head = el('p', 'desk-message__head');
    var who = m.sender && m.sender.isYou
      ? T.youCap
      : ((m.sender && m.sender.name) || (m.sender && T.parties[m.sender.party]) || '');
    head.appendChild(el('span', 'desk-message__who', who));
    head.appendChild(el('span', 'desk-message__party',
      (m.sender && T.parties[m.sender.party]) || ''));
    head.appendChild(el('span', 'desk-message__at', when(m.sentAt, true)));
    li.appendChild(head);

    if (m.withdrawn) {
      li.appendChild(el('p', 'desk-message__withdrawn',
        m.withdrawnReason ? T.withdrawnFor(m.withdrawnReason) : T.withdrawn));
      return li;
    }
    String(m.body || '').split(/\n{2,}/).forEach(function (para) {
      if (para.trim()) li.appendChild(el('p', 'desk-message__body', para.trim()));
    });
    return li;
  }

  function openThread(id) {
    openThreadId = id;
    var sec = $('#secThread');
    sec.hidden = false;
    $('[data-thread-error]').textContent = '';
    api('/api/messages/' + encodeURIComponent(id)).then(function (r) {
      if (!r.ok) {
        $('[data-thread-error]').textContent = reasonFrom(r.data, T.loadFailed);
        return;
      }
      var d = r.data;
      var t = d.thread || {};
      $('[data-thread-scope]').textContent = scopeLine(t) + ' · ' + (T.statuses[t.status] || t.status);
      $('[data-thread-subject]').textContent = t.subject || '';
      $('[data-thread-parties]').textContent = partyNames(t.participants);

      var trunc = $('[data-thread-truncated]');
      trunc.hidden = !d.truncated;
      trunc.textContent = d.truncated ? T.truncated : '';

      var list = $('[data-messages]');
      list.textContent = '';
      (d.messages || []).forEach(function (m) { list.appendChild(messageItem(m)); });

      $('[data-reply]').hidden = !t.mayReply;
      var refusal = $('[data-reply-refusal]');
      refusal.hidden = !t.replyRefusal;
      refusal.textContent = t.replyRefusal || '';
      $('[data-reply-body]').value = '';

      sec.scrollIntoView({ behavior: 'smooth', block: 'start' });
      // The badge moved on the server when the watermark moved. Re-read
      // it rather than subtracting here, so two tabs cannot disagree.
      loadThreads();
    });
  }

  function sendReply() {
    var box = $('[data-reply-body]');
    var text = (box.value || '').trim();
    var err = $('[data-thread-error]');
    err.textContent = '';
    if (!text) { err.textContent = T.needBody; return; }
    var btn = $('[data-reply-send]');
    btn.disabled = true;
    btn.textContent = T.sending;
    api('/api/messages/' + encodeURIComponent(openThreadId), {
      method: 'POST', body: JSON.stringify({ body: text }),
    }).then(function (r) {
      btn.disabled = false;
      btn.textContent = AR ? 'أرسِل الردّ' : 'Send the reply';
      if (!r.ok) { err.textContent = reasonFrom(r.data, T.failed); return; }
      box.value = '';
      openThread(openThreadId);
    });
  }

  function sendNew() {
    var err = $('[data-compose-error]');
    err.textContent = '';
    var o = canOpen[Number($('[data-recipient]').value) || 0];
    var subject = ($('[data-subject]').value || '').trim();
    var text = ($('[data-body]').value || '').trim();
    if (!subject) { err.textContent = T.needSubject; return; }
    if (!text) { err.textContent = T.needBody; return; }
    if (!o) { err.textContent = T.cannotOpen; return; }

    // `scope` is the server's word for what the thread hangs on, and
    // `canOpen` already carries it. The page passes it back rather than
    // deciding, so a module-scoped desk offered later needs no edit here.
    var payload = {
      recipient: o.recipient, scope: o.scope || 'level', subject: subject, body: text,
    };
    if (payload.scope === 'module') payload.unitId = o.unitId;
    else payload.levelId = o.levelId;

    var btn = $('[data-compose-send]');
    btn.disabled = true;
    btn.textContent = T.sending;
    api('/api/messages', { method: 'POST', body: JSON.stringify(payload) })
      .then(function (r) {
        btn.disabled = false;
        btn.textContent = AR ? 'أرسِل' : 'Send';
        if (!r.ok) { err.textContent = reasonFrom(r.data, T.failed); return; }
        $('[data-subject]').value = '';
        $('[data-body]').value = '';
        $('#secCompose').hidden = true;
        loadThreads();
        // openThread() on the server returns the whole thread it just
        // opened, not an id beside it, so the new conversation is shown
        // straight away rather than left for the learner to find.
        if (r.data && r.data.thread && r.data.thread.id) openThread(r.data.thread.id);
      });
  }

  /* ── LOADING ─────────────────────────────────────────────────────── */

  function loadNotices() {
    return api('/api/announcements?language=' + language).then(function (r) {
      if (r.status === 401) return 'auth';
      if (!r.ok) return 'fail';
      renderNotices(r.data);
      return 'ok';
    });
  }

  function loadThreads() {
    return api('/api/messages').then(function (r) {
      if (r.status === 401) return 'auth';
      if (!r.ok) return 'fail';
      renderThreads(r.data);
      return 'ok';
    });
  }

  function load() {
    state(T.loading, '');
    Promise.all([loadNotices(), loadThreads()]).then(function (out) {
      if (out.indexOf('auth') !== -1) {
        state(T.signedOut, T.signedOutRest);
        return;
      }
      if (out.indexOf('fail') !== -1) {
        state(T.failed, T.failedRest);
        return;
      }
      state(T.ready, T.readyRest);
      $('#secCounts').hidden = false;
      var scope = $('#scope');
      scope.hidden = false;
      if (!scope.getAttribute('data-tz')) {
        scope.setAttribute('data-tz', TZ);
        scope.appendChild(document.createTextNode(' ' + T.tzNote(TZ)));
      }
    });
  }

  document.addEventListener('DOMContentLoaded', function () {
    var lang = $('[data-lang]');
    if (lang) {
      lang.value = language;
      lang.addEventListener('change', function () {
        language = lang.value === 'ar' ? 'ar' : 'en';
        loadNotices();
      });
    }

    $('[data-compose-open]').addEventListener('click', function () {
      $('#secCompose').hidden = false;
      $('[data-subject]').focus();
    });
    $('[data-compose-close]').addEventListener('click', function () {
      $('#secCompose').hidden = true;
    });
    $('[data-thread-close]').addEventListener('click', function () {
      $('#secThread').hidden = true;
      openThreadId = null;
    });
    $('[data-recipient]').addEventListener('change', noteRecipient);
    $('[data-compose-send]').addEventListener('click', sendNew);
    $('[data-reply-send]').addEventListener('click', sendReply);

    var body = $('[data-body]');
    var count = $('[data-body-count]');
    var tick = function () { count.textContent = T.charsLeft(5000 - (body.value || '').length); };
    body.addEventListener('input', tick);
    tick();

    document.addEventListener('keydown', function (ev) {
      if (ev.key !== 'Escape') return;
      $('#secCompose').hidden = true;
      $('#secThread').hidden = true;
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
