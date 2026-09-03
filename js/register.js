/* WEC — The Graduate Register, browsable.

   Public, no sign-in, same as verification. The register is the College's
   roll of award holders and there is no version of it that is worth
   publishing behind a login.

   Two things this file is careful about.

   1. EVERY VALUE IS SET WITH textContent, NEVER innerHTML. Holder names
      come from the register, and the register's names come from
      certificates, which are typed by people. A name containing an angle
      bracket is a data-entry oddity, not an attack — but the difference
      between those two only exists if the page never gives it the
      chance to be one.

   2. THE EMPTY REGISTER IS A STATE, NOT AN ERROR. Until the first
      conferral this page always renders empty, and that is the state
      most visitors will ever see. It says so in words. A spinner that
      never resolves, or a bare "0 results", would read as a broken page
      on the College's own roll. */
(function () {
  'use strict';
  var $ = function (s) { return document.querySelector(s); };

  /* ── THE ROLL IS PUBLISHED IN BOTH EDITIONS ─────────────────────────
   *
   * It was not. /ar/register.html served an Arabic page and then filled
   * it with "Level III · CEFR B1 · Conferred 22 August 2026" and
   * "Verify this award", under Arabic headings — a roll of Arabic names
   * against English programmes.
   *
   * Same two rules as the rest of the site: what the PAGE says is here
   * in both languages; what the REGISTER says arrives in both and
   * pick() selects. */
  var AR = document.documentElement.lang === 'ar';
  var LOCALE = AR ? 'ar' : 'en-GB';
  var VERIFY_PATH = AR ? '/ar/verify.html?code=' : '/verify.html?code=';

  function pick(en, ar) { return (AR && ar) ? ar : en; }

  var T = AR ? {
    theRegister: 'السجل',
    listed: function (n) {
      return n === 1 ? 'شهادة واحدة مقيَّدة' : n + ' شهادة مقيَّدة';
    },
    level: function (a) { return 'المستوى ' + a; },
    cefr: function (c) { return 'الإطار الأوروبي ' + c; },
    conferred: function (d) { return 'مُنحت في ' + d; },
    verifyThis: 'تحقّق من هذه الشهادة',
    showingFirst: function (n) {
      return 'يُعرض أول ' + n + '. ضيّق البحث بالاسم أو بالشهادة لترى ما بعدها.';
    },
    noMatch: 'لا شهادة مقيَّدة تطابق هذا البحث.',
    noMatchRest: 'وليس كلُّ خرّيج يأذن بالظهور هنا. والشهادة غير المقيَّدة يمكن التحقّق منها برمزها في صفحة التحقّق من الشهادات.',
    noneYet: 'لم تُمنح شهادات بعد.',
    noneYetRest: 'يُنشر السجل قبل أول منحٍ ليكون التحقّق قائمًا من الشهادة الأولى لا بعدها. وسيمتلئ بمنح الشهادات.',
    unreachable: 'تعذّر بلوغ السجل.',
    unreachableRest: 'هذا خلل عندنا، لا قولٌ في أيّ شهادة. أعد المحاولة بعد قليل، أو تحقّق من شهادة بعينها برمزها.',
  } : {
    theRegister: 'The register',
    listed: function (n) { return n === 1 ? '1 award listed' : n + ' awards listed'; },
    level: function (a) { return 'Level ' + a; },
    cefr: function (c) { return 'CEFR ' + c; },
    conferred: function (d) { return 'Conferred ' + d; },
    verifyThis: 'Verify this award',
    showingFirst: function (n) {
      return 'Showing the first ' + n + '. Narrow the search by name or by award to see further entries.';
    },
    noMatch: 'No listed award matches that search.',
    noMatchRest: 'Not every graduate consents to appear here. An award that is not listed can still be checked by its code at Award Verification.',
    noneYet: 'No awards have yet been conferred.',
    noneYetRest: 'The Register is published in advance of the first conferral so that verification exists from the first award rather than after it. It will fill as awards are made.',
    unreachable: 'The Register could not be reached.',
    unreachableRest: 'This is a fault on our side, not a statement about any award. Please try again shortly, or check a specific award by its code.',
  };

  function fmtDate(iso) {
    if (!iso) return '';
    var d = new Date(iso.length === 10 ? iso + 'T00:00:00Z' : iso);
    if (isNaN(d.getTime())) return iso;
    try {
      return d.toLocaleDateString(LOCALE, { day: 'numeric', month: 'long', year: 'numeric', timeZone: 'UTC' });
    } catch (e) { return iso.slice(0, 10); }
  }

  function el(tag, cls, text) {
    var n = document.createElement(tag);
    if (cls) n.className = cls;
    if (text !== undefined && text !== null) n.textContent = text;
    return n;
  }

  /* A run of Latin inside an Arabic line — a name, an award's official
     title, a register code — isolated so the algorithm cannot drag a
     hyphen or a full stop to the wrong end of it. */
  function bdi(text) {
    var n = document.createElement('bdi');
    n.textContent = String(text);
    return n;
  }

  /** A block whose contents are one isolated run. */
  function named(tag, cls, text) {
    var n = el(tag, cls);
    if (text !== undefined && text !== null && text !== '') n.appendChild(bdi(text));
    return n;
  }

  function entryNode(e) {
    var li = el('li', 'reg-entry');

    var main = el('div');
    // A graduate's name is their own and is in whatever script they
    // wrote it in; the award's official title is published in English
    // on both editions by the College's own ruling. Both isolated.
    var name = named('p', 'reg-entry__name', e.holderName);
    if (e.postNominal) name.appendChild(named('span', 'reg-entry__post', e.postNominal));
    main.appendChild(name);
    main.appendChild(named('p', 'reg-entry__award', e.awardTitle));

    var meta = el('p', 'reg-entry__meta');
    // Honour first: it is the distinction the graduate earned, and
    // burying it after the date would make the roll read as a list of
    // dates that happen to have people attached.
    if (e.honourLabel && e.honour !== 'pass') {
      meta.appendChild(el('span', 'reg-entry__honour', pick(e.honourLabel, e.honourLabelAr)));
      meta.appendChild(document.createTextNode(' '));
    }
    // Each fact isolated from its neighbours, so "الإطار الأوروبي B1"
    // and the date beside it cannot be read as one run.
    [T.level(pick(e.roman, e.ordinalAr)),
      e.cefr ? T.cefr(e.cefr) : null,
      e.conferredOn ? T.conferred(fmtDate(e.conferredOn)) : null,
    ].filter(Boolean).forEach(function (f, i) {
      if (i) meta.appendChild(document.createTextNode(' \u00B7 '));
      meta.appendChild(bdi(f));
    });
    main.appendChild(meta);
    li.appendChild(main);

    var check = el('div', 'reg-entry__check');
    var a = el('a', null, T.verifyThis);
    a.href = VERIFY_PATH + encodeURIComponent(e.verificationCode);
    check.appendChild(a);
    check.appendChild(named('span', 'reg-entry__code', e.verificationCode));
    li.appendChild(check);

    return li;
  }

  /* THE PLATE THE REGISTER SPEAKS FROM.
     `.state-plate` and the atelier classes are what every other surface
     on this site that says something while nothing is on screen wears —
     see css/brand.css. This one is public and it is what a visitor sees
     before the first conferral, so it matters most here. */
  function statePlate(head, rest) {
    var p = el('p', 'reg-empty state-plate edge-lit edge-lit--light aurum');
    p.appendChild(el('strong', null, head));
    p.appendChild(document.createTextNode(rest));
    return p;
  }

  /* AND IT IS A SIBLING OF THE LIST, NOT A CHILD OF IT.
     It used to be appended into the <ol>, where a <p> is not permitted
     content: the register announced itself as a list of no items and
     then carried, inside that list, a paragraph belonging to no item.
     A sentence about a list belongs beside it — in the same aria-live
     region, which is the <section> both of them sit in. */
  function speak(node) {
    var list = $('#list');
    list.textContent = '';
    list.hidden = true;
    var old = $('#empty');
    if (old) old.parentNode.removeChild(old);
    node.id = 'empty';
    list.parentNode.insertBefore(node, list.nextSibling);
  }

  function silence() {
    var old = $('#empty');
    if (old) old.parentNode.removeChild(old);
    $('#list').hidden = false;
  }

  function render(data, filtered) {
    var list = $('#list');
    list.textContent = '';
    var entries = (data && data.entries) || [];

    if (!entries.length) {
      $('#count').textContent = T.theRegister;
      speak(statePlate(filtered ? T.noMatch : T.noneYet,
        filtered ? T.noMatchRest : T.noneYetRest));
      $('#more').hidden = true;
      return;
    }

    silence();
    $('#count').textContent = T.listed(entries.length);
    entries.forEach(function (e) { list.appendChild(entryNode(e)); });

    // Said plainly rather than left to be discovered. A silently
    // truncated register is one a visitor draws a false conclusion from
    // — "they only have 200 graduates" — and never learns otherwise.
    $('#more').hidden = !data.truncated;
    if (data.truncated) {
      $('#more').textContent = T.showingFirst(data.limit);
    }
  }

  function load() {
    var q = $('#q').value.trim();
    var level = $('#level').value;
    var filtered = !!(q || level);

    var params = new URLSearchParams();
    if (q) params.set('q', q);
    if (level) params.set('level', level);

    $('#results').setAttribute('aria-busy', 'true');
    fetch('/api/register' + (params.toString() ? '?' + params : ''), {
      headers: { Accept: 'application/json' },
    })
      .then(function (r) { return r.json(); })
      .then(function (d) { render(d, filtered); })
      .catch(function () {
        $('#count').textContent = T.theRegister;
        speak(statePlate(T.unreachable, T.unreachableRest));
        $('#more').hidden = true;
      })
      .then(function () { $('#results').setAttribute('aria-busy', 'false'); });
  }

  document.addEventListener('DOMContentLoaded', function () {
    $('#registerForm').addEventListener('submit', function (e) { e.preventDefault(); load(); });
    // Changing the award filter searches immediately. Requiring a second
    // click on "Search" after an explicit choice is a step that exists
    // only to satisfy the form, not the person using it.
    $('#level').addEventListener('change', load);

    var preset = new URLSearchParams(location.search).get('level');
    if (/^[1-6]$/.test(preset || '')) $('#level').value = preset;
    load();
  });
})();
