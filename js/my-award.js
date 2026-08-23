/* WEC-LC — the learner's own certificates.
 *
 * ─────────────────────────────────────────────────────────────────────
 * EVERY WORD ON THE FACE OF A CERTIFICATE IS THE REGISTER'S
 * ─────────────────────────────────────────────────────────────────────
 * The award title, the post-nominal, the honour, the citation, the
 * level and the date are read from `awards`, which stores them
 * DENORMALISED on purpose: the schema's own note says a certificate
 * conferred in 2027 must still read as it did on the day, whatever the
 * programme is renamed to afterwards. This file therefore prints what
 * the row says and composes nothing. A page that rebuilt an award title
 * from a level id would silently rewrite old certificates every time
 * the College renamed a level.
 *
 * ─────────────────────────────────────────────────────────────────────
 * THE SIGNATURE IS SHOWN, OR ITS ABSENCE IS
 * ─────────────────────────────────────────────────────────────────────
 * A certificate that asserted "cryptographically signed" without naming
 * the key would be a certificate vouching for itself. Where a signature
 * exists the key id and the moment are printed; where it does not — an
 * award conferred before the signing layer — the page says UNSIGNED and
 * says what that means, which is what /verify/ says about the same
 * record. A missing signature is not a failed one.
 *
 * ─────────────────────────────────────────────────────────────────────
 * AND A REVOKED AWARD IS DRAWN, NOT HIDDEN
 * ─────────────────────────────────────────────────────────────────────
 * The register keeps revoked and replaced awards and verification
 * reports them truthfully, so this page does too, with the reason and
 * the date. A portal that quietly dropped a withdrawn award from the
 * holder's own view would leave them to discover it from a stranger.
 */
(function () {
  'use strict';

  var K = window.WEC_LC_staff;
  var AR = K.AR;
  var el = K.el;
  var $ = K.$;

  var T = AR ? {
    loading: 'جارٍ تحميل شهاداتك…',
    awardsHead: 'شهاداتك',
    termsHead: 'ما هذه الشهادة',
    awardsLabel: 'الشهادات الممنوحة',
    creditsLabel: 'الوحدات المعتمدة',
    hours: function (n) { return n + ' ساعة تعلّم إجمالية'; },
    of: function (n) { return 'من ستّ شهادات في البرنامج'; },
    conferred: function (d) { return 'مُنحت في ' + d; },
    level: function (r, n) { return 'المستوى ' + r + ' — ' + n; },
    cefr: 'الإطار الأوروبي المرجعي',
    honour: 'المرتبة',
    credits: 'الوحدات',
    code: 'رمز التحقّق',
    codeNote: 'اكتب هذا الرمز في بوّابة التحقّق، أو امسح الرمز المربّع. ولا يحتاج من يتحقّق إلى حساب.',
    signature: 'التوقيع',
    signedBy: function (kid, at) { return 'مُوقَّعة بالمفتاح ' + kid + ' في ' + at; },
    unsigned: 'غير موقَّعة',
    unsignedNote: 'مُنحت هذه الشهادة قبل طبقة التوقيع. وغيابُ التوقيع ليس توقيعًا فاشلًا: القيدُ في السجلّ قائمٌ ويتحقّق منه كما هو.',
    modeDev: 'مفتاح تطوير',
    modeManaged: 'مفتاح مُدار',
    revoked: 'مسحوبة',
    revokedOn: function (d) { return 'سُحبت في ' + d; },
    replaced: function (c) { return 'حلّ محلّها الرمز ' + c; },
    verify: 'تحقّق من هذه الشهادة',
    print: 'اطبع هذه الشهادة',
    seal: 'ختم الكلية',
    noneHead: 'لم تُمنح لك شهادةٌ بعد.',
    qrAlt: function (c) { return 'رمز مربّع يفتح صفحة التحقّق من الشهادة ' + c; },
  } : {
    loading: 'Loading your awards…',
    awardsHead: 'Your certificates',
    termsHead: 'What this certificate is',
    awardsLabel: 'Awards conferred',
    creditsLabel: 'Credits held',
    hours: function (n) { return n + ' total qualification hours'; },
    of: function () { return 'of six awards in the programme'; },
    conferred: function (d) { return 'Conferred ' + d; },
    level: function (r, n) { return 'Level ' + r + ' — ' + n; },
    cefr: 'Common European Framework',
    honour: 'Honour',
    credits: 'Credits',
    code: 'Verification code',
    codeNote: 'Type this code into the verification portal, or scan the square. Whoever checks it needs no account.',
    signature: 'Signature',
    signedBy: function (kid, at) { return 'Signed with key ' + kid + ' on ' + at; },
    unsigned: 'Unsigned',
    unsignedNote: 'This award was conferred before the signing layer. A missing signature is not a failed one: the register entry stands and verifies as it is.',
    modeDev: 'development key',
    modeManaged: 'managed key',
    revoked: 'Withdrawn',
    revokedOn: function (d) { return 'Withdrawn on ' + d; },
    replaced: function (c) { return 'Replaced by code ' + c; },
    verify: 'Check this certificate',
    print: 'Print this certificate',
    seal: 'The seal of the College',
    noneHead: 'No award has been conferred on you yet.',
    qrAlt: function (c) { return 'A square code opening the verification page for certificate ' + c; },
  };

  /** An <svg><use> mark from the site sprite, at certificate size. */
  function mark(id, cls) {
    var svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    svg.setAttribute('class', cls || 'awd-mark');
    svg.setAttribute('aria-hidden', 'true');
    var use = document.createElementNS('http://www.w3.org/2000/svg', 'use');
    use.setAttribute('href', '#' + id);
    svg.appendChild(use);
    return svg;
  }

  function line(host, label, value) {
    if (value === null || value === undefined || value === '') return;
    var row = el('div', 'awd-line');
    row.appendChild(el('dt', null, label));
    var dd = el('dd');
    // <bdi> because a level name, an honour or a holder's name may be
    // in the other script from the sentence around it, and an isolated
    // run is the only way a mixed line reads correctly in both.
    var b = document.createElement('bdi');
    b.textContent = String(value);
    dd.appendChild(b);
    row.appendChild(dd);
    host.appendChild(row);
  }

  function certificate(a) {
    var card = el('article',
      'awd card edge-lit edge-lit--light aurum aurum--hover tilt gold-live reveal'
      + (a.status === 'conferred' ? '' : ' awd--withdrawn'));
    var sheen = el('span', 'tilt__sheen');
    sheen.setAttribute('aria-hidden', 'true');
    card.appendChild(sheen);

    // ── THE HEAD: the crest, and the College's own name ──────────────
    var head = el('div', 'awd__head');
    head.appendChild(mark('i-crest', 'awd-crest'));
    head.appendChild(el('p', 'awd__college', AR
      ? 'الكلية العالمية للغة الإنجليزية · حرم لندن'
      : 'WorldWide English College · London Campus'));
    card.appendChild(head);

    // ── THE AWARD, as the register holds it ──────────────────────────
    var title = el('h3', 'awd__title');
    var tb = document.createElement('bdi');
    tb.textContent = a.awardTitle;
    title.appendChild(tb);
    card.appendChild(title);

    if (a.postNominal) card.appendChild(el('p', 'awd__post', a.postNominal));

    card.appendChild(el('p', 'awd__conferredOn',
      AR ? 'مُنحت إلى' : 'Conferred upon'));

    var holder = el('p', 'awd__holder');
    var hb = document.createElement('bdi');
    hb.textContent = a.holderName;
    holder.appendChild(hb);
    card.appendChild(holder);

    if (a.citation) {
      var cite = el('p', 'awd__citation', a.citation);
      cite.setAttribute('dir', 'auto');
      card.appendChild(cite);
    }

    // ── THE FACTS ────────────────────────────────────────────────────
    var facts = el('dl', 'awd__facts');
    line(facts, AR ? 'المستوى' : 'Level',
      T.level(AR && a.level.ordinalAr ? a.level.ordinalAr : a.level.roman,
        AR && a.level.nameAr ? a.level.nameAr : a.level.name));
    line(facts, T.cefr, a.cefr);
    line(facts, T.honour, AR && a.honourLabelAr ? a.honourLabelAr : a.honourLabel);
    line(facts, T.credits, a.credits);
    line(facts, AR ? 'تاريخ المنح' : 'Date', K.when(a.conferredOn));
    card.appendChild(facts);

    // ── WITHDRAWN, IF IT IS ──────────────────────────────────────────
    if (a.status !== 'conferred') {
      var warn = el('div', 'awd__withdrawn');
      warn.appendChild(K.chip(T.revoked, 'warn'));
      if (a.revokedAt) warn.appendChild(el('p', null, T.revokedOn(K.when(a.revokedAt))));
      if (a.revokedReason) {
        var why = el('p', null, a.revokedReason);
        why.setAttribute('dir', 'auto');
        warn.appendChild(why);
      }
      if (a.replacementCode) warn.appendChild(el('p', null, T.replaced(a.replacementCode)));
      card.appendChild(warn);
    }

    // ── THE FOOT: the seal, the code and its square ──────────────────
    var foot = el('div', 'awd__foot');

    var sealBox = el('div', 'awd__seal');
    sealBox.appendChild(mark('i-seal', 'awd-seal'));
    sealBox.appendChild(el('p', 'awd__seal-label', T.seal));
    foot.appendChild(sealBox);

    var codeBox = el('div', 'awd__code');
    codeBox.appendChild(el('p', 'awd__code-label', T.code));
    var code = el('p', 'awd__code-value', a.verificationCode);
    // ALWAYS LTR. A verification code is a code; mirrored in an RTL run
    // it is a code somebody types back wrong.
    code.setAttribute('dir', 'ltr');
    codeBox.appendChild(code);
    codeBox.appendChild(el('p', 'awd__code-note', T.codeNote));

    var sig = el('p', 'awd__sig');
    if (a.signature) {
      sig.textContent = T.signedBy(a.signature.kid, K.when(a.signature.signedAt));
      sig.appendChild(document.createTextNode(' · '));
      sig.appendChild(el('span', 'awd__sig-mode',
        a.signature.mode === 'development' ? T.modeDev : T.modeManaged));
    } else {
      // Named as unsigned, with what that means. See the head of this
      // file: a missing signature is not a failed one.
      sig.classList.add('awd__sig--none');
      sig.textContent = T.unsigned + ' · ' + T.unsignedNote;
    }
    codeBox.appendChild(sig);
    foot.appendChild(codeBox);

    // The QR is an <img> against the public endpoint rather than an
    // inline SVG built here: it is the same image /verify/ and the
    // printed copy use, from one generator, so a scanned certificate
    // and a scanned screen cannot disagree.
    var qr = el('img', 'awd__qr');
    qr.src = a.qrPath;
    qr.width = 132;
    qr.height = 132;
    qr.loading = 'lazy';
    qr.alt = T.qrAlt(a.verificationCode);
    foot.appendChild(qr);

    card.appendChild(foot);

    // ── WHAT A HOLDER DOES WITH IT ───────────────────────────────────
    var acts = el('div', 'awd__acts');
    var verify = el('a', 'btn btn--ghost', T.verify);
    verify.href = a.verifyPath;
    acts.appendChild(verify);

    var print = el('button', 'btn btn--gold chime', T.print);
    print.type = 'button';
    print.addEventListener('click', function () {
      // ONE CERTIFICATE TO A PAGE. CSS cannot compare one element's
      // attribute against another's, so the choice is made here and
      // expressed as a class: css/award.css hides every .awd while
      // body carries data-printing, and shows the one wearing
      // .awd--printing. Cleared on afterprint so the screen returns to
      // itself whether the dialogue was accepted or cancelled.
      document.body.setAttribute('data-printing', a.verificationCode);
      card.classList.add('awd--printing');
      var clear = function () {
        document.body.removeAttribute('data-printing');
        card.classList.remove('awd--printing');
        window.removeEventListener('afterprint', clear);
      };
      window.addEventListener('afterprint', clear);
      window.print();
      // Safari fires no afterprint in some versions; the timeout is the
      // floor under that rather than the mechanism.
      window.setTimeout(clear, 4000);
    });
    acts.appendChild(print);
    card.appendChild(acts);

    card.setAttribute('data-code', a.verificationCode);
    return card;
  }

  function termsCard(sentence, i) {
    var card = el('article', 'card tilt gold-live edge-lit edge-lit--light aurum aurum--hover reveal');
    var sheen = el('span', 'tilt__sheen');
    sheen.setAttribute('aria-hidden', 'true');
    card.appendChild(sheen);
    card.appendChild(K.dome(['i-seal', 'i-key', 'i-globe', 'i-book'][i % 4]));
    card.appendChild(el('p', null, sentence));
    return card;
  }

  function load() {
    $('#state').textContent = T.loading;
    K.api('/api/student/awards' + (AR ? '?lang=ar' : ''))
      .then(function (payload) {
        // Cleared on the success path: a state line still saying
        // "loading" under a rendered page is the commonest way a
        // finished screen reads as a broken one.
        $('#state').textContent = '';

        var live = payload.awards.filter(function (a) { return a.status === 'conferred'; });

        var host = $('[data-awards]');
        host.textContent = '';
        payload.awards.forEach(function (a) { host.appendChild(certificate(a)); });
        $('#secAwards').hidden = !payload.awards.length;
        $('[data-awards-head]').textContent = T.awardsHead;

        $('#secNone').hidden = payload.awards.length > 0;
        if (!payload.awards.length) {
          $('[data-none-head]').textContent = T.noneHead;
          $('[data-none-note]').textContent = payload.conferredBy;
          $('[data-none-link]').setAttribute('href', payload.standingPath);
        }

        var tiles = {
          awards: { n: live.length, label: T.awardsLabel, foot: T.of(live.length) },
          credits: { n: payload.creditsTotal, label: T.creditsLabel, foot: T.hours(payload.tqtHoursTotal) },
        };
        Object.keys(tiles).forEach(function (k) {
          var box = document.querySelector('[data-tile="' + k + '"]');
          if (!box) return;
          box.querySelector('[data-count]').textContent = String(tiles[k].n);
          box.querySelector('[data-label]').textContent = tiles[k].label;
          box.querySelector('[data-foot]').textContent = tiles[k].foot;
        });
        $('#secTotals').hidden = false;

        var terms = $('[data-terms]');
        terms.textContent = '';
        payload.terms.statements.forEach(function (s, i) { terms.appendChild(termsCard(s, i)); });
        $('[data-terms-head]').textContent = T.termsHead;
        $('#secTerms').hidden = false;

        K.rise(document.querySelector('.stf-shell'));
      })
      .catch(function (err) { $('#state').textContent = K.trouble(err); });
  }

  K.boot(load);
})();
