/* WEC-LC — the identity card, and every file the College has given you.
 *
 * ─────────────────────────────────────────────────────────────────────
 * THE PAGE ISSUES NOTHING, AND SAYS SO
 * ─────────────────────────────────────────────────────────────────────
 * Every shelf below is a POINTER at the surface that owns its subject.
 * There is no "issue a transcript" control here, deliberately: issuance
 * lives on /my-record.html where what a transcript contains is set out,
 * and a second implementation of it would eventually disagree with the
 * first about what a transcript says.
 *
 * The consequence for this file is that it renders links and counts and
 * never a form. Where a shelf is empty it says what would fill it and
 * where that happens, because an empty shelf with no sentence under it
 * reads as a page that failed to load.
 *
 * ─────────────────────────────────────────────────────────────────────
 * AND THE CARD CLAIMS EXACTLY WHAT THE COLLEGE CLAIMS
 * ─────────────────────────────────────────────────────────────────────
 * The identity block prints the name the College holds, since when, and
 * against which enrolment — with the published sentence from
 * /students/examinations/ § II beside it, and the plain statement that
 * this is not a government document. Both are the endpoint's own
 * strings. A card that quietly dropped the caveat would be a card
 * inviting somebody to present it as identification.
 */
(function () {
  'use strict';

  var K = window.WEC_LC_staff;
  var AR = K.AR;
  var el = K.el;
  var $ = K.$;

  var T = AR ? {
    loading: 'جارٍ تحميل ملفّاتك…',
    identityHead: 'كيف تحملك الكلية',
    shelvesHead: 'ما أعطتك الكلية',
    basis: 'كلُّ رفٍّ هنا يشير إلى الصفحة التي تملك موضوعه. ولا يُصدَر شيءٌ من هذه الصفحة.',
    nameHeld: 'الاسم الذي تحمله الكلية',
    nameOnAward: 'الاسم على الشهادة',
    nameDiffers: 'صُحِّح اسمُك بعد منح هذه الشهادة. ويبقى الشكلُ الأوّل في السجلّ فتظلّ الشهادةُ القديمةُ قابلةً للتحقّق، ويُعاد إصدارُ الشهادة بالصيغة المصحّحة مجّانًا.',
    email: 'البريد على الحساب',
    heldSince: 'محمولةٌ منذ',
    currentLevel: 'المستوى الحالي',
    noLevel: 'لا تسجيلَ قائمًا الآن.',
    enrolments: 'تسجيلاتك',
    notGovernment: 'تنبيه',
    shelf: {
      certificates: { title: 'الشهادات', empty: 'لم تُمنح لك شهادةٌ بعد.', icon: 'i-laurel' },
      documents: { title: 'الوثائق الصادرة', empty: 'لم تُصدِر وثيقةً بعد. تُصدَر من صفحة سجلّي، وهي مجّانية ولا حدَّ لعددها.', icon: 'i-scroll' },
      finance: { title: 'الفواتير والإيصالات', empty: 'لا مدفوعاتٍ على سجلّك بعد.', icon: 'i-ledger' },
      library: { title: 'المكتبة', empty: '', icon: 'i-book' },
    },
    libraryOpen: 'يفتح تسجيلُك الجزءَ المقيَّد من المكتبة إضافةً إلى مجلّداتها المفتوحة للجميع.',
    libraryLocked: 'المجلّداتُ المفتوحةُ متاحةٌ للجميع. ويفتح التسجيلُ ما سواها.',
    receipts: function (n) { return n === 1 ? 'وإيصالٌ واحد' : 'و' + n + ' إيصالات'; },
    issuable: 'ما يمكن إصدارُه',
    open: 'افتح',
    count: function (n) { return n === 0 ? 'لا شيء' : (n === 1 ? 'عنصرٌ واحد' : n + ' عناصر'); },
    unknownCount: 'انظر الفهرس',
    docType: {
      transcript: 'كشف الدرجات',
      diploma_supplement: 'ملحق الشهادة',
      verification_statement: 'بيان التحقّق',
    },
    status: { issued: 'صادرة', superseded: 'محلٌّ محلَّها', withdrawn: 'مسحوبة' },
  } : {
    loading: 'Loading your files…',
    identityHead: 'How the College holds you',
    shelvesHead: 'What the College has given you',
    basis: 'Each shelf points at the page that owns its subject. Nothing is issued from this page.',
    nameHeld: 'The name the College holds',
    nameOnAward: 'The name on your certificate',
    nameDiffers: 'Your name was corrected after this certificate was conferred. The earlier form is kept on the record so the older certificate still verifies, and the certificate is reissued in the corrected form at no charge.',
    email: 'The address on the account',
    heldSince: 'Held since',
    currentLevel: 'Current level',
    noLevel: 'No live enrolment.',
    enrolments: 'Your enrolments',
    notGovernment: 'Note',
    shelf: {
      certificates: { title: 'Certificates', empty: 'No award has been conferred on you yet.', icon: 'i-laurel' },
      documents: { title: 'Issued documents', empty: 'You have issued no documents yet. They are issued from My Record, free and as often as you need.', icon: 'i-scroll' },
      finance: { title: 'Invoices and receipts', empty: 'No payments on your record yet.', icon: 'i-ledger' },
      library: { title: 'The Library', empty: '', icon: 'i-book' },
    },
    libraryOpen: 'Your enrolment opens the enrolment-locked half of the Library as well as the volumes open to everybody.',
    libraryLocked: 'The open volumes are available to anybody. Enrolment opens the rest.',
    receipts: function (n) { return n === 1 ? 'and 1 receipt' : 'and ' + n + ' receipts'; },
    issuable: 'What can be issued',
    open: 'Open',
    count: function (n) { return n === 0 ? 'Nothing yet' : (n === 1 ? '1 item' : n + ' items'); },
    unknownCount: 'See the catalogue',
    docType: {
      transcript: 'Transcript',
      diploma_supplement: 'Diploma supplement',
      verification_statement: 'Verification statement',
    },
    status: { issued: 'Issued', superseded: 'Superseded', withdrawn: 'Withdrawn' },
  };

  function bdi(text) {
    var n = document.createElement('bdi');
    n.textContent = String(text);
    return n;
  }

  function fact(host, label, value, extraClass) {
    if (value === null || value === undefined || value === '') return;
    var row = el('div', 'dl-fact' + (extraClass ? ' ' + extraClass : ''));
    row.appendChild(el('dt', null, label));
    var dd = el('dd');
    dd.appendChild(bdi(value));
    row.appendChild(dd);
    host.appendChild(row);
  }

  /* ── THE IDENTITY CARD ─────────────────────────────────────────── */

  function identityCard(id) {
    var card = el('article', 'dl-id card edge-lit edge-lit--light aurum aurum--hover tilt gold-live reveal');
    var sheen = el('span', 'tilt__sheen');
    sheen.setAttribute('aria-hidden', 'true');
    card.appendChild(sheen);

    var head = el('div', 'dl-id__head');
    head.appendChild(K.dome('i-passport'));
    var names = el('div', 'dl-id__names');
    var name = el('p', 'dl-id__name');
    name.appendChild(bdi(id.name || '—'));
    names.appendChild(name);
    if (id.currentLevel) {
      names.appendChild(el('p', 'dl-id__level',
        (AR ? 'المستوى ' : 'Level ') + id.currentLevel.roman + ' · ' + id.currentLevel.name
        + ' · ' + id.currentLevel.cefr));
    } else {
      names.appendChild(el('p', 'dl-id__level', T.noLevel));
    }
    head.appendChild(names);
    card.appendChild(head);

    var facts = el('dl', 'dl-id__facts');
    fact(facts, T.nameHeld, id.name);
    // BOTH FORMS, and only where they differ. Equal strings shown twice
    // would read as the College holding two names for one person.
    if (id.nameDiffers) fact(facts, T.nameOnAward, id.nameOnAward, 'dl-fact--flag');
    fact(facts, T.email, id.email);
    fact(facts, T.heldSince, K.when(id.heldSince));
    card.appendChild(facts);

    if (id.nameDiffers) {
      card.appendChild(el('p', 'dl-id__differs', T.nameDiffers));
    }

    // Every enrolment, in order, with its state — the record the
    // identity is held against.
    if (id.enrolments && id.enrolments.length) {
      var list = el('ul', 'dl-enrolments');
      list.setAttribute('aria-label', T.enrolments);
      id.enrolments.forEach(function (e) {
        var li = el('li');
        li.appendChild(bdi((AR ? 'المستوى ' : 'Level ') + e.roman + ' · ' + e.name));
        li.appendChild(K.chip(e.status, e.status === 'active' ? 'good' : null));
        list.appendChild(li);
      });
      card.appendChild(list);
    }

    // THE PUBLISHED SENTENCE, and the caveat. Both the endpoint's own
    // strings; see the head of this file for why neither is optional.
    var said = el('blockquote', 'dl-id__statement');
    said.appendChild(el('p', null, id.statement));
    var cite = el('p', 'dl-id__source');
    var link = el('a', null, AR ? 'لائحة الامتحانات · الهويّة' : 'The examination regulations · Identity');
    link.href = id.source;
    cite.appendChild(link);
    said.appendChild(cite);
    card.appendChild(said);

    var caveat = el('p', 'dl-id__caveat');
    caveat.appendChild(el('strong', null, T.notGovernment + ' · '));
    caveat.appendChild(document.createTextNode(id.caveat));
    card.appendChild(caveat);

    return card;
  }

  /* ── A SHELF ───────────────────────────────────────────────────── */

  function shelfCard(shelf) {
    var meta = T.shelf[shelf.id] || { title: shelf.id, empty: '', icon: 'i-book' };
    var card = el('article', 'dl-shelf card edge-lit edge-lit--light aurum aurum--hover tilt gold-live reveal');
    var sheen = el('span', 'tilt__sheen');
    sheen.setAttribute('aria-hidden', 'true');
    card.appendChild(sheen);
    card.appendChild(K.dome(meta.icon));

    card.appendChild(el('h3', null, meta.title));

    var count = el('p', 'dl-shelf__count',
      shelf.count === null ? T.unknownCount : T.count(shelf.count));
    if (shelf.id === 'finance' && shelf.receipts) {
      count.appendChild(document.createTextNode(' · ' + T.receipts(shelf.receipts)));
    }
    card.appendChild(count);

    if (shelf.id === 'library') {
      card.appendChild(el('p', 'dl-shelf__note', shelf.enrolled ? T.libraryOpen : T.libraryLocked));
    } else if (!shelf.count) {
      // Named rather than blank. See the head of this file.
      card.appendChild(el('p', 'dl-shelf__note', meta.empty));
    }

    if (shelf.items && shelf.items.length) {
      var list = el('ul', 'dl-items');
      shelf.items.slice(0, 6).forEach(function (item) {
        var li = el('li');
        var title = AR && item.titleAr ? item.titleAr : item.title;
        var label = T.docType[title] || title;
        li.appendChild(bdi(label));
        var sub = AR && item.subtitleAr ? item.subtitleAr : item.subtitle;
        if (sub) li.appendChild(K.chip(T.status[sub] || sub));
        if (item.at) li.appendChild(el('span', 'dl-items__at', K.when(item.at)));
        if (item.code) {
          var code = el('code', null, item.code);
          code.setAttribute('dir', 'ltr');
          li.appendChild(code);
        }
        list.appendChild(li);
      });
      card.appendChild(list);
      if (shelf.items.length > 6) {
        card.appendChild(el('p', 'dl-shelf__more',
          AR ? 'والبقيّةُ على الصفحة نفسها.' : 'The rest are on the page itself.'));
      }
    }

    if (shelf.issuable) {
      var iss = el('p', 'dl-shelf__issuable');
      iss.appendChild(el('span', 'dl-shelf__issuable-label', T.issuable + ': '));
      iss.appendChild(document.createTextNode(
        shelf.issuable.map(function (k) { return T.docType[k] || k; }).join(' · ')));
      card.appendChild(iss);
    }

    // .btn--outline, NOT .btn--ghost. See css/brand.css: ghost is a
    // dark-ground control and measures 1.54:1 on a paper card.
    var go = el('a', 'btn btn--outline', T.open + ' ' + meta.title);
    go.href = shelf.route;
    card.appendChild(go);
    return card;
  }

  function load() {
    $('#state').textContent = T.loading;
    K.api('/api/student/downloads' + (AR ? '?lang=ar' : ''))
      .then(function (payload) {
        $('#state').textContent = '';

        var idHost = $('[data-identity]');
        idHost.textContent = '';
        idHost.appendChild(identityCard(payload.identity));
        $('[data-identity-head]').textContent = T.identityHead;
        $('#secIdentity').hidden = false;

        var host = $('[data-shelves]');
        host.textContent = '';
        payload.shelves.forEach(function (s) { host.appendChild(shelfCard(s)); });
        $('[data-shelves-head]').textContent = T.shelvesHead;
        $('[data-shelves-basis]').textContent = T.basis;
        $('#secShelves').hidden = false;

        K.rise(document.querySelector('.stf-shell'));
      })
      .catch(function (err) { $('#state').textContent = K.trouble(err); });
  }

  K.boot(load);
})();
