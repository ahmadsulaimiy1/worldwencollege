(function () {
  // Footer year
  document.querySelectorAll('[data-year]').forEach(function (el) {
    el.textContent = new Date().getFullYear();
  });

  // Mobile nav toggle
  var toggle = document.querySelector('.nav__toggle');
  var header = document.querySelector('.site-header');
  if (toggle && header) {
    toggle.addEventListener('click', function () {
      var open = header.classList.toggle('is-open');
      toggle.setAttribute('aria-expanded', open ? 'true' : 'false');
    });
  }

  // Accordion (FAQ / policy style)
  document.querySelectorAll('.accordion__q').forEach(function (btn, i) {
    // Wire ARIA relationships programmatically so every accordion instance
    // gets correct semantics without hand-authoring ids per FAQ item.
    var item = btn.closest('.accordion__item');
    var answer = item.querySelector('.accordion__a');
    var answerId = answer.id || 'accordion-panel-' + i + '-' + Math.random().toString(36).slice(2, 7);
    answer.id = answerId;
    btn.setAttribute('aria-expanded', 'false');
    btn.setAttribute('aria-controls', answerId);
    answer.setAttribute('role', 'region');

    btn.addEventListener('click', function () {
      var isOpen = item.classList.contains('is-open');
      item.parentElement.querySelectorAll('.accordion__item.is-open').forEach(function (openItem) {
        if (openItem !== item) {
          openItem.classList.remove('is-open');
          openItem.querySelector('.accordion__a').style.maxHeight = null;
          openItem.querySelector('.accordion__q').setAttribute('aria-expanded', 'false');
        }
      });
      if (isOpen) {
        item.classList.remove('is-open');
        answer.style.maxHeight = null;
        btn.setAttribute('aria-expanded', 'false');
      } else {
        item.classList.add('is-open');
        answer.style.maxHeight = answer.scrollHeight + 'px';
        btn.setAttribute('aria-expanded', 'true');
      }
    });
  });

  // Scroll reveal
  var reveals = document.querySelectorAll('.reveal');
  if ('IntersectionObserver' in window && reveals.length) {
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) {
          entry.target.classList.add('is-visible');
          io.unobserve(entry.target);
        }
      });
    }, { threshold: 0.15 });
    reveals.forEach(function (el) { io.observe(el); });
  } else {
    reveals.forEach(function (el) { el.classList.add('is-visible'); });
  }

  // Contact form — opens the visitor's email client with a pre-filled
  // message. No backend exists yet, so this is the honest alternative
  // to a fake "submitted" confirmation. Validates inline first so a
  // visitor never gets bounced to their email app over a typo'd address.
  var EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

  function setFieldValid(field) {
    if (field) field.closest('.field').classList.remove('is-invalid');
  }
  function setFieldInvalid(field) {
    if (field) field.closest('.field').classList.add('is-invalid');
  }
  function showFormStatus(form, kind, text) {
    var status = form.querySelector('[data-form-status]');
    if (!status) return;
    status.textContent = text;
    status.className = 'form-status is-visible form-status--' + kind;
  }

  document.querySelectorAll('[data-mailto-form]').forEach(function (form) {
    var nameField = form.querySelector('[name="name"]');
    var emailField = form.querySelector('[name="email"]');
    var messageField = form.querySelector('[name="message"]');

    // Clear a field's error state as soon as the visitor fixes it —
    // don't make them re-submit to find out it's valid now.
    [nameField, emailField, messageField].forEach(function (field) {
      if (!field) return;
      field.addEventListener('input', function () {
        var ok = field === emailField ? EMAIL_RE.test(field.value.trim()) : field.value.trim().length > 0;
        if (ok) setFieldValid(field);
      });
    });

    form.addEventListener('submit', function (e) {
      e.preventDefault();
      var valid = true;
      if (!nameField || !nameField.value.trim()) { setFieldInvalid(nameField); valid = false; } else { setFieldValid(nameField); }
      if (!emailField || !EMAIL_RE.test(emailField.value.trim())) { setFieldInvalid(emailField); valid = false; } else { setFieldValid(emailField); }
      if (!messageField || !messageField.value.trim()) { setFieldInvalid(messageField); valid = false; } else { setFieldValid(messageField); }

      if (!valid) {
        var firstInvalid = form.querySelector('.field.is-invalid input, .field.is-invalid textarea');
        if (firstInvalid) firstInvalid.focus();
        showFormStatus(form, 'error', form.getAttribute('data-error-text') || 'Please fix the highlighted fields below.');
        return;
      }

      var to = form.getAttribute('data-mailto-to') || 'info@worldwencollege.co.uk';
      var topic = form.querySelector('[name="topic"]');
      var subject = 'Website Enquiry' + (topic && topic.value ? ' — ' + topic.value : '');
      var bodyLines = [
        'Name: ' + nameField.value.trim(),
        'Email: ' + emailField.value.trim(),
        '',
        messageField.value.trim()
      ];
      var mailto = 'mailto:' + encodeURIComponent(to) +
        '?subject=' + encodeURIComponent(subject) +
        '&body=' + encodeURIComponent(bodyLines.join('\n'));

      showFormStatus(form, 'success', form.getAttribute('data-success-text') || 'Opening your email app with your message ready to send…');
      window.setTimeout(function () { window.location.href = mailto; }, 400);
    });
  });

  // Level self-assessment (client-side only — a guide, not the real placement test)
  document.querySelectorAll('[data-level-quiz]').forEach(function (form) {
    var levels, template;
    try {
      levels = JSON.parse(form.getAttribute('data-levels') || '[]');
    } catch (e) {
      levels = [];
    }
    template = form.getAttribute('data-result-template') || '{roman} — {name} ({cefr})';

    form.addEventListener('submit', function (e) {
      e.preventDefault();
      var checked = form.querySelector('input[name="level-quiz"]:checked');
      var resultBox = form.querySelector('[data-level-quiz-result]');
      var resultText = form.querySelector('[data-level-quiz-text]');
      if (!checked || !resultBox || !resultText) return;
      var level = levels[parseInt(checked.value, 10)];
      if (!level) return;
      var text = template
        .replace('{roman}', level.roman)
        .replace('{name}', level.name)
        .replace('{cefr}', level.cefr);
      resultText.textContent = text;
      resultBox.hidden = false;
      resultBox.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    });
  });

  // Portal preview form (no backend yet — informative only)
  var portalForm = document.querySelector('[data-portal-form]');
  if (portalForm) {
    portalForm.addEventListener('submit', function (e) {
      e.preventDefault();
      var note = portalForm.querySelector('[data-portal-note]');
      if (note) {
        note.textContent = note.getAttribute('data-success-text') || 'Thank you — the Student Portal is launching soon. We will email you the moment your account is ready.';
      }
    });
  }
})();
