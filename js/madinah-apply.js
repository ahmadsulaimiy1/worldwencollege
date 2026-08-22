/* ═══════════════════════════════════════════════════════════════════
   THE FORM OF APPLICATION
   ═══════════════════════════════════════════════════════════════════

   What stood in its place was a list of six things an applicant should
   write in an email, and a mailto: link. That is not an admission
   process; it is an instruction to invent one. This composes the
   application instead — and composes it in front of the applicant, so
   what the Registry will receive is on screen before it is sent.

   NOTHING LEAVES THE DEVICE. There is no server behind this site and no
   third-party form service in it. The application is assembled here, in
   the browser, and handed to the applicant's own mail client, clipboard
   or printer. That is the same doctrine the rest of the site keeps: a
   reader can see the whole of what is being done with what they typed.

   WHY NOT A FORM SERVICE. Posting to one would work today and would put
   every applicant's prior study, telephone number and request for
   financial support through a company the College has not chosen, named
   or told anyone about. When the Registry has its own endpoint, one
   function below changes and everything else stands.

   The form is authored in both trees with the same ids and the same
   data-label attributes, so this file carries no English in it beyond
   the words the applicant never sees. The visible strings come from
   data attributes on the form, which each tree writes in its own
   language.
   ═══════════════════════════════════════════════════════════════════ */
(function () {
  'use strict';

  var form = document.getElementById('apply-form');
  if (!form) return;

  var preview = form.parentNode.querySelector('[data-apply-preview]');
  var status = document.getElementById('apply-status');
  var isAr = (document.documentElement.getAttribute('lang') || '').indexOf('ar') === 0;

  var T = isAr ? {
    empty: 'املأ النموذج ليُكتب الطلب هنا كما سيصل إلى شؤون الطلاب.',
    missing: 'يلزم إتمام هذه الحقول: ',
    copied: 'نُسخ الطلب. الصقه في رسالة إلى شؤون الطلاب.',
    copyFail: 'تعذّر النسخ. حدِّد النص في اللوح وانسخه يدويًا.',
    opened: 'فُتح بريدك برسالة الطلب. راجعها ثم أرسلها.',
    subject: 'طلب التحاق',
    heading: 'طلب التحاق بكلية المدينة العالمية',
    submitted: 'حُرِّر في',
    yes: 'نعم', no: 'لا'
  } : {
    empty: 'Fill in the form and the application is composed here, exactly as it will be sent.',
    missing: 'Still to complete: ',
    copied: 'The application is copied. Paste it into a message to the Registry.',
    copyFail: 'Could not copy. Select the text in the sheet and copy it by hand.',
    opened: 'Your mail programme has opened with the application in it. Read it, then send it.',
    subject: 'Application for admission',
    heading: 'APPLICATION FOR ADMISSION — AL-MADINAH INTERNATIONAL COLLEGE',
    submitted: 'Composed',
    yes: 'Yes', no: 'No'
  };

  function fields() {
    return Array.prototype.slice.call(form.querySelectorAll('[data-label]'));
  }

  function valueOf(el) {
    if (el.type === 'checkbox') return el.checked ? T.yes : '';
    return (el.value || '').trim();
  }

  /* The composed application. Plain text on purpose: it has to survive
     being pasted into any mail client, printed, or read aloud down a
     telephone by a registrar. */
  function compose() {
    var lines = [T.heading, ''];
    var group = null;
    fields().forEach(function (el) {
      var set = el.closest('fieldset');
      var legend = set && set.querySelector('.r-apply__legend');
      var name = legend ? legend.textContent.trim() : '';
      if (name && name !== group) {
        group = name;
        lines.push('', name.toUpperCase(), '');
      }
      var v = valueOf(el);
      if (!v) return;
      lines.push(el.getAttribute('data-label') + ': ' + v);
    });
    lines.push('', T.submitted + ': ' + new Date().toISOString().slice(0, 10));
    return lines.join('\n').replace(/\n{3,}/g, '\n\n');
  }

  function required() {
    return fields().filter(function (el) { return el.required && !valueOf(el); });
  }

  function say(msg, kind) {
    if (!status) return;
    status.textContent = msg;
    status.hidden = !msg;
    status.className = 'form-status' + (kind ? ' form-status--' + kind : '');
  }

  function anyFilled() {
    return fields().some(function (el) { return valueOf(el); });
  }

  function render() {
    if (!preview) return;
    preview.textContent = anyFilled() ? compose() : T.empty;
  }

  form.addEventListener('input', render);
  form.addEventListener('change', render);

  /* The one function that changes when the Registry has an endpoint of
     its own: today it hands the composed text to the applicant's mail
     client; tomorrow it posts the same text and reports the reply. */
  function deliver(text) {
    var to = 'registry@al-madinahcollege.com';
    window.location.href = 'mailto:' + to +
      '?subject=' + encodeURIComponent(T.subject) +
      '&body=' + encodeURIComponent(text);
  }

  form.addEventListener('submit', function (e) {
    e.preventDefault();
    var missing = required();
    if (missing.length) {
      var names = missing.map(function (el) { return el.getAttribute('data-label'); });
      say(T.missing + names.join(isAr ? '، ' : ', '), 'error');
      missing[0].focus();
      return;
    }
    say(T.opened, 'success');
    deliver(compose());
  });

  var copyBtn = form.querySelector('[data-apply-copy]');
  if (copyBtn) {
    copyBtn.addEventListener('click', function () {
      var text = compose();
      function fallback() {
        try {
          var ta = document.createElement('textarea');
          ta.value = text; ta.setAttribute('readonly', '');
          ta.style.position = 'fixed'; ta.style.top = '-1000px';
          document.body.appendChild(ta); ta.select();
          var ok = document.execCommand('copy');
          document.body.removeChild(ta);
          say(ok ? T.copied : T.copyFail, ok ? 'success' : 'error');
        } catch (err) { say(T.copyFail, 'error'); }
      }
      if (navigator.clipboard && navigator.clipboard.writeText) {
        navigator.clipboard.writeText(text)
          .then(function () { say(T.copied, 'success'); })
          .catch(fallback);
      } else fallback();
    });
  }

  var printBtn = form.querySelector('[data-apply-print]');
  if (printBtn) {
    printBtn.addEventListener('click', function () {
      render();
      window.print();
    });
  }

  render();
})();
