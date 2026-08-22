/* WEC-LC — My Academic Record.
 *
 * The learner's own view of what the College holds, and the controls
 * over who else may see it. The APIs behind this — profile, shares,
 * documents — existed with no interface at all, which meant a graduate
 * could not exercise a single one of the privacy decisions the platform
 * was built to give them.
 *
 * ────────────────────────────────────────────────────────────────
 * THE RULE THAT SHAPES EVERY CONTROL HERE
 * ────────────────────────────────────────────────────────────────
 * A person deciding what to publish about themselves must be told what
 * the decision means AT THE MOMENT THEY MAKE IT, not in a policy they
 * will never open. So every switch carries its own consequence in plain
 * words, and the two that matter most say more than the others:
 *
 *   Measured study time — how long they struggled. Not part of the
 *   qualification, and the page says most graduates keep it private.
 *
 *   Share links — the page states, before they create one, that turning
 *   a section off later removes it from links already issued. That is
 *   true (the server intersects scope with current visibility) and it is
 *   the single most reassuring fact about the mechanism.
 *
 * ────────────────────────────────────────────────────────────────
 * EVERY VALUE IS SET WITH textContent
 * ────────────────────────────────────────────────────────────────
 * Names, share labels and document titles are written by people. The
 * difference between "a label with an angle bracket in it" and an attack
 * only exists if the page never gives it the chance to be the second.
 */
(function () {
  'use strict';
  var $ = function (s) { return document.querySelector(s); };

  /* ── THE LEARNER'S OWN RECORD, IN THE LEARNER'S OWN EDITION ─────────
   *
   * /ar/my-record.html served an Arabic page and filled it in English:
   * "Level III", "Awarded with Distinction", "Live", "Withdraw",
   * "Copy this link now." A page where a person decides what to publish
   * about themselves is the last page on the site that may ask them to
   * read a second language to understand the consequence.
   *
   * Same two rules as the credential pages: what the PAGE says is here
   * in both languages; what the RECORD says arrives in both and pick()
   * selects. */
  var AR = document.documentElement.lang === 'ar';
  var LOCALE = AR ? 'ar' : 'en-GB';
  var VERIFY_PATH = AR ? '/ar/verify.html?code=' : '/verify.html?code=';
  var SHARE_PATH = AR ? '/ar/graduate.html?share=' : '/graduate.html?share=';

  function pick(en, ar) { return (AR && ar) ? ar : en; }

  var SECTION_NAMES = AR ? {
    awards: 'الشهادات', transcript: 'السجل الأكاديمي',
    skills: 'ملفّ المهارات اللغوية', competencies: 'إطار الكفايات',
    distinctions: 'التمايز والإسهام', cpd: 'التطوير المهني',
    studyTime: 'زمن الدراسة المقيس',
  } : {
    awards: 'awards', transcript: 'academic transcript',
    skills: 'language skill profile', competencies: 'competency framework',
    distinctions: 'distinctions and contribution', cpd: 'professional development',
    studyTime: 'measured study time',
  };

  var T = AR ? {
    totals: ['أرصدة الكلية', 'الزمن الكلي للمؤهل', 'مستويات دخلها', 'مستويات مُنحت'],
    hoursShort: ' ساعة',
    level: function (a) { return 'المستوى ' + a; },
    modulesOf: function (a, b) { return a + ' من ' + b; },
    awarded: 'مُنحت',
    awardedWith: function (h) { return 'مُنحت بمرتبة ' + h; },
    awardWithdrawn: 'شهادة مسحوبة',
    awardSuperseded: 'شهادة مُستبدَلة',
    inProgress: 'قيد الدراسة',
    entered: 'دخلها',
    noShares: 'لم تشارك سجلّك مع أحد.',
    untitledLink: 'رابط بلا تسمية',
    live: 'قائم', withdrawnBadge: 'مسحوب', expired: 'منتهٍ',
    shows: function (list) { return 'يعرض ' + list; },
    expiresOn: function (d) { return 'ينتهي في ' + d; },
    endedOn: function (d) { return 'انتهى في ' + d; },
    opened: function (n) {
      return n === 0 ? 'لم يُفتح بعد' : (n === 1 ? 'فُتح مرّة' : 'فُتح ' + n + ' مرّة');
    },
    withdraw: 'اسحب',
    withdrawAria: function (label) { return 'اسحب الرابط «' + label + '»'; },
    docNames: {
      transcript: 'كشف الدرجات',
      diploma_supplement: 'ملحق الشهادة',
      verification_statement: 'إفادة تحقّق',
    },
    noDocs: 'لم تُصدر أي وثيقة بعد.',
    docWithdrawn: 'مسحوبة', docSuperseded: 'مُستبدَلة',
    issuedOn: function (d) { return 'صدرت في ' + d; },
    validUntil: function (d) { return 'سارية حتى ' + d; },
    codeIs: function (c) { return 'الرمز ' + c; },
    checkDoc: 'تحقّق من هذه الوثيقة',
    notSaved: 'تعذّر حفظ هذه الإعدادات.',
    savedPublic: 'حُفظ. ملفّك منشور.',
    savedPrivate: 'حُفظ. ملفّك خاصّ.',
    linkFailed: 'تعذّر إنشاء هذا الرابط.',
    copyNow: 'انسخ هذا الرابط الآن.',
    copyNowRest: 'لا تحفظ الكلية منه إلا بصمة، ولا تستطيع عرضه عليك مرّة أخرى. فإن ضاع منك فاسحب الرابط وأنشئ غيره.',
    docFailed: 'تعذّر إصدار هذه الوثيقة.',
    signedOut: 'لست مسجَّل الدخول.',
    signedOutRest: 'سجلّك الأكاديمي خاصٌّ بك. سجّل الدخول لتراه، أو تحقّق من شهادة برمزها إن كنت تتحقّق من سجلّ غيرك.',
    failed: 'تعذّر تحميل سجلّك.',
    failedRest: 'هذا خلل عندنا. أعد المحاولة بعد قليل.',
    failedShort: 'أعد المحاولة بعد قليل.',
  } : {
    totals: ['WEC Credits', 'Qualification time', 'Levels entered', 'Levels awarded'],
    hoursShort: ' h',
    level: function (a) { return 'Level ' + a; },
    modulesOf: function (a, b) { return a + ' of ' + b; },
    awarded: 'Awarded',
    awardedWith: function (h) { return 'Awarded with ' + h; },
    awardWithdrawn: 'Award withdrawn',
    awardSuperseded: 'Award superseded',
    inProgress: 'In progress',
    entered: 'Entered',
    noShares: 'You have not shared your record with anyone.',
    untitledLink: 'Untitled link',
    live: 'Live', withdrawnBadge: 'Withdrawn', expired: 'Expired',
    shows: function (list) { return 'Shows ' + list; },
    expiresOn: function (d) { return 'expires ' + d; },
    endedOn: function (d) { return 'ended ' + d; },
    opened: function (n) { return 'opened ' + n + (n === 1 ? ' time' : ' times'); },
    withdraw: 'Withdraw',
    withdrawAria: function (label) { return 'Withdraw the link "' + label + '"'; },
    docNames: {
      transcript: 'Academic transcript',
      diploma_supplement: 'Diploma supplement',
      verification_statement: 'Verification statement',
    },
    noDocs: 'You have not issued any documents yet.',
    docWithdrawn: 'Withdrawn', docSuperseded: 'Superseded',
    issuedOn: function (d) { return 'Issued ' + d; },
    validUntil: function (d) { return 'valid until ' + d; },
    codeIs: function (c) { return 'code ' + c; },
    checkDoc: 'Check this document',
    notSaved: 'Those settings could not be saved.',
    savedPublic: 'Saved. Your profile is published.',
    savedPrivate: 'Saved. Your profile is private.',
    linkFailed: 'That link could not be created.',
    copyNow: 'Copy this link now.',
    copyNowRest: 'The College stores only a fingerprint of it and cannot show it to you again. If you lose it, withdraw the link and make another.',
    docFailed: 'That document could not be issued.',
    signedOut: 'You are not signed in.',
    signedOutRest: 'Your academic record is private to you. Sign in to see it, or verify an award by its code if you are checking someone else\u2019s.',
    failed: 'Your record could not be loaded.',
    failedRest: 'This is a fault on our side. Please try again shortly.',
    failedShort: 'Please try again shortly.',
  };

  /** The list separator each language expects. */
  function joinNames(list) {
    return AR ? list.join('، ') : list.join(', ');
  }

  function el(tag, cls, text) {
    var n = document.createElement(tag);
    if (cls) n.className = cls;
    if (text !== undefined && text !== null && text !== '') n.textContent = text;
    return n;
  }

  /* A run that must not be reordered by the language around it — a
     share label a learner typed, a register code, an address. */
  function bdi(text) {
    var n = document.createElement('bdi');
    n.textContent = String(text);
    return n;
  }

  function named(tag, cls, text) {
    var n = el(tag, cls);
    if (text !== undefined && text !== null && text !== '') n.appendChild(bdi(text));
    return n;
  }

  /** A row of isolated facts, separated the way the site separates. */
  function facts(host, list) {
    list.filter(Boolean).forEach(function (f, i) {
      if (i) host.appendChild(document.createTextNode(' \u00B7 '));
      host.appendChild(bdi(f));
    });
  }

  function fmtDate(iso) {
    if (!iso) return '';
    var d = new Date(iso.length === 10 ? iso + 'T00:00:00Z' : iso);
    if (isNaN(d.getTime())) return iso;
    try {
      return d.toLocaleDateString(LOCALE, { day: 'numeric', month: 'long', year: 'numeric', timeZone: 'UTC' });
    } catch (e) { return iso.slice(0, 10); }
  }

  // ---- authenticated fetch ------------------------------------------
  // A learner's own record is never public. Without a session there is
  // nothing to show, and the page says so rather than rendering an empty
  // shell that looks like a record with nothing in it.
  var authHeaders = {};

  function api(path, opts) {
    var o = opts || {};
    o.headers = Object.assign({ Accept: 'application/json' }, authHeaders, o.headers || {});
    if (o.body) o.headers['Content-Type'] = 'application/json';
    return fetch(path, o).then(function (r) {
      return r.json().then(function (d) { return { ok: r.ok, status: r.status, data: d }; });
    });
  }

  function state(strong, rest) {
    var box = $('#state');
    box.textContent = '';
    if (strong) box.appendChild(el('strong', null, strong + ' '));
    box.appendChild(document.createTextNode(rest || ''));
  }

  // ---- record ---------------------------------------------------------
  function renderRecord(p) {
    var t = p.transcript;
    var totals = $('#totals');
    totals.textContent = '';
    [[T.totals[0], t.creditsAwarded], [T.totals[1], t.tqtHoursAwarded + T.hoursShort],
      [T.totals[2], t.levelsEntered], [T.totals[3], t.levelsAwarded]].forEach(function (pair) {
      var dl = el('dl', 'grad-total');
      dl.appendChild(el('dt', null, pair[0]));
      dl.appendChild(el('dd', null, String(pair[1])));
      totals.appendChild(dl);
    });

    var body = $('#transcript');
    body.textContent = '';
    t.entries.forEach(function (e) {
      var tr = document.createElement('tr');
      var lvl = el('td', 'grad-table__level', T.level(pick(e.roman, e.ordinalAr)));
      lvl.appendChild(el('span', 'grad-table__sub', pick(e.levelName, e.levelNameAr)));
      tr.appendChild(lvl);
      tr.appendChild(el('td', null, e.cefr));
      tr.appendChild(el('td', null, fmtDate(e.startedAt)));
      tr.appendChild(el('td', null, e.modulesTotal ? T.modulesOf(e.modulesCompleted, e.modulesTotal) : '—'));
      var out = el('td');
      if (e.award && e.award.standing === 'conferred') {
        out.appendChild(document.createTextNode(
          e.award.honourLabel && e.award.honour !== 'pass'
            ? T.awardedWith(pick(e.award.honourLabel, e.award.honourLabelAr))
            : T.awarded));
      } else if (e.award) {
        out.appendChild(document.createTextNode(
          e.award.standing === 'revoked' ? T.awardWithdrawn : T.awardSuperseded));
      } else {
        out.appendChild(document.createTextNode(e.status === 'active' ? T.inProgress : T.entered));
      }
      tr.appendChild(out);
      body.appendChild(tr);
    });
    $('#secRecord').hidden = false;
  }

  function renderPrivacy(p) {
    var v = p.visibility;
    $('#isPublic').checked = !!v.isPublic;
    $('#showTranscript').checked = !!v.transcript;
    $('#showCompetencies').checked = !!v.competencies;
    $('#showCpd').checked = !!v.cpd;
    $('#showStudyTime').checked = !!v.studyTime;
    $('#handle').value = p.handle || '';
    $('#secPrivacy').hidden = false;
  }

  // ---- shares ---------------------------------------------------------
  function renderShares(shares) {
    var list = $('#shares');
    list.textContent = '';
    if (!shares.length) {
      list.appendChild(el('li', 'rec-empty', T.noShares));
    }
    shares.forEach(function (s) {
      var li = el('li', 'rec-share' + (s.active ? '' : ' is-inactive'));
      var main = el('div');
      // The label is whatever the learner typed, in whatever script.
      main.appendChild(named('p', 'rec-share__label', s.label || T.untitledLink));
      var meta = el('p', 'rec-share__meta');
      meta.appendChild(el('span', 'rec-badge ' + (s.active ? 'rec-badge--live' : 'rec-badge--ended'),
        s.active ? T.live : (s.revokedAt ? T.withdrawnBadge : T.expired)));
      // Seeing that a link was opened is the reassurance a graduate
      // actually wants: it tells them the employer looked.
      facts(meta, [
        T.shows(joinNames(s.scope.map(function (k) { return SECTION_NAMES[k] || k; }))),
        s.active ? T.expiresOn(fmtDate(s.expiresAt))
          : T.endedOn(fmtDate(s.revokedAt || s.expiresAt)),
        T.opened(s.viewCount),
      ]);
      main.appendChild(meta);
      li.appendChild(main);

      if (s.active) {
        var btn = el('button', 'rec-revoke', T.withdraw);
        btn.type = 'button';
        btn.setAttribute('aria-label', T.withdrawAria(s.label || T.untitledLink));
        btn.addEventListener('click', function () {
          btn.disabled = true;
          api('/api/student/profile-shares?id=' + encodeURIComponent(s.id), { method: 'DELETE' })
            .then(loadShares);
        });
        li.appendChild(btn);
      }
      list.appendChild(li);
    });
    $('#secShares').hidden = false;
  }

  function loadShares() {
    return api('/api/student/profile-shares').then(function (r) {
      if (r.ok) renderShares(r.data.shares || []);
    });
  }

  // ---- documents ------------------------------------------------------
  var DOC_NAME = T.docNames;

  function renderDocuments(docs) {
    var list = $('#documents');
    list.textContent = '';
    if (!docs.length) {
      list.appendChild(el('li', 'rec-empty', T.noDocs));
    }
    docs.forEach(function (d) {
      var li = el('li', 'rec-doc' + (d.status === 'issued' ? '' : ' is-inactive'));
      var main = el('div');
      main.appendChild(el('p', 'rec-doc__title', DOC_NAME[d.documentType] || d.documentType));
      var meta = el('p', 'rec-doc__meta');
      if (d.status !== 'issued') {
        meta.appendChild(el('span', 'rec-badge rec-badge--' + (d.status === 'withdrawn' ? 'withdrawn' : 'superseded'),
          d.status === 'withdrawn' ? T.docWithdrawn : T.docSuperseded));
      }
      facts(meta, [
        T.issuedOn(fmtDate(d.issuedAt)),
        d.expiresAt ? T.validUntil(fmtDate(d.expiresAt)) : null,
        T.codeIs(d.verificationCode),
      ]);
      main.appendChild(meta);
      li.appendChild(main);

      var link = el('a', 'rec-doclink', T.checkDoc);
      link.href = VERIFY_PATH + encodeURIComponent(d.verificationCode);
      li.appendChild(link);
      list.appendChild(li);
    });
    $('#secDocuments').hidden = false;
  }

  function loadDocuments() {
    return api('/api/student/documents').then(function (r) {
      if (r.ok) renderDocuments(r.data.documents || []);
    });
  }

  // ---- wiring ---------------------------------------------------------
  function wire() {
    $('#privacyForm').addEventListener('submit', function (e) {
      e.preventDefault();
      $('#handleError').textContent = '';
      $('#saved').textContent = '';
      var handle = $('#handle').value.trim();
      api('/api/student/profile', {
        method: 'PATCH',
        body: JSON.stringify({
          handle: handle || null,
          isPublic: $('#isPublic').checked,
          transcript: $('#showTranscript').checked,
          competencies: $('#showCompetencies').checked,
          cpd: $('#showCpd').checked,
          studyTime: $('#showStudyTime').checked,
        }),
      }).then(function (r) {
        if (!r.ok) {
          $('#handleError').textContent = (r.data && r.data.message) || T.notSaved;
          return;
        }
        renderPrivacy(r.data);
        $('#saved').textContent = $('#isPublic').checked ? T.savedPublic : T.savedPrivate;
      });
    });

    $('#shareForm').addEventListener('submit', function (e) {
      e.preventDefault();
      var sections = [].slice.call(document.querySelectorAll('input[name="sections"]:checked'))
        .map(function (i) { return i.value; });
      api('/api/student/profile-shares', {
        method: 'POST',
        body: JSON.stringify({
          sections: sections,
          days: Number($('#shareDays').value),
          label: $('#shareLabel').value.trim() || null,
        }),
      }).then(function (r) {
        var box = $('#newLink');
        box.textContent = '';
        box.hidden = false;
        if (!r.ok) {
          box.appendChild(el('strong', null, T.linkFailed));
          box.appendChild(document.createTextNode((r.data && r.data.message) || ''));
          return;
        }
        // The link a learner hands to an employer opens in the edition
        // the learner is working in.
        var url = location.origin + SHARE_PATH + encodeURIComponent(r.data.token);
        box.appendChild(el('strong', null, T.copyNow));
        box.appendChild(document.createTextNode(T.copyNowRest));
        box.appendChild(named('code', null, url));
        loadShares();
      });
    });

    [].slice.call(document.querySelectorAll('[data-issue]')).forEach(function (btn) {
      btn.addEventListener('click', function () {
        $('#docError').textContent = '';
        btn.disabled = true;
        api('/api/student/documents', {
          method: 'POST',
          body: JSON.stringify({ documentType: btn.getAttribute('data-issue') }),
        }).then(function (r) {
          btn.disabled = false;
          if (!r.ok) {
            $('#docError').textContent = (r.data && r.data.message) || T.docFailed;
            return;
          }
          loadDocuments();
        });
      });
    });
  }

  function load() {
    api('/api/student/profile').then(function (r) {
      if (r.status === 401) {
        state(T.signedOut, T.signedOutRest);
        return;
      }
      if (!r.ok) {
        state(T.failed, T.failedRest);
        return;
      }
      $('#state').textContent = '';
      renderRecord(r.data);
      renderPrivacy(r.data);
      wire();
      loadShares();
      loadDocuments();
    }).catch(function () {
      state(T.failed, T.failedShort);
    });
  }

  document.addEventListener('DOMContentLoaded', function () {
    var cfg = window.WEC_LC_AUTH || {};
    // With a key configured, attach the session token so the API
    // recognises the learner. Without one, the call still runs and
    // returns 401, and the page says so — which is the honest state of a
    // deployment with no auth provider rather than a blank screen.
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
