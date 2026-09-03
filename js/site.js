(function () {

  // A JS-specified `behavior: 'smooth'` overrides CSS
  // `scroll-behavior: auto`, so the reduced-motion carve-out in
  // brand.css does NOT cover these calls. Checked here as well.
  function scrollPref() {
    return (window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches)
      ? 'auto' : 'smooth';
  }

  // Footer year
  document.querySelectorAll('[data-year]').forEach(function (el) {
    el.textContent = new Date().getFullYear();
  });

  // Mobile nav toggle. The drawer is now a full-screen room (see
  // css/brand.css .nav-mobile) rather than a small panel in normal
  // flow, so the page behind it must stop scrolling too — otherwise
  // the drawer's own scroll and the page's fight each other, and a
  // reader who closes it finds themselves somewhere they never
  // scrolled to. Escape closes it as well: a full-screen surface is a
  // modal in every way that matters, and a modal that only Backspace
  // or a re-tap of a small corner button can dismiss is not one.
  var toggle = document.querySelector('.nav__toggle');
  var header = document.querySelector('.site-header');
  function setNavOpen(open) {
    header.classList.toggle('is-open', open);
    toggle.setAttribute('aria-expanded', open ? 'true' : 'false');
    document.body.classList.toggle('nav-open', open);
  }
  if (toggle && header) {
    toggle.addEventListener('click', function () {
      setNavOpen(!header.classList.contains('is-open'));
    });
    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape' && header.classList.contains('is-open')) setNavOpen(false);
    });
  }

  // The quicknav strip's last tile opens the same drawer the hamburger
  // does, rather than linking anywhere — it is the strip's "see
  // everything" escape hatch, not a page.
  var quicknavFull = document.querySelector('[data-quicknav-full]');
  if (quicknavFull && header) {
    quicknavFull.addEventListener('click', function () { setNavOpen(true); });
  }

  // Desktop nav dropdown: the submenu itself is shown/hidden by CSS
  // (:hover/:focus-within on .nav__item--has-menu — see css/brand.css),
  // not JS, so aria-expanded on the trigger link needs a matching pair
  // of listeners to stay truthful about whether the menu is actually
  // visible right now, since a screen reader has no way to observe the
  // CSS state on its own.
  document.querySelectorAll('.nav__item--has-menu > a[aria-haspopup]').forEach(function (trigger) {
    var item = trigger.parentElement;
    function open() { trigger.setAttribute('aria-expanded', 'true'); }
    function close() { trigger.setAttribute('aria-expanded', 'false'); }
    item.addEventListener('mouseenter', open);
    item.addEventListener('mouseleave', close);
    item.addEventListener('focusin', open);
    item.addEventListener('focusout', function (e) {
      if (!item.contains(e.relatedTarget)) close();
    });
  });

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

  // Scroll reveal — css/brand.css's .reveal/.is-visible pair (with its
  // own prefers-reduced-motion carve-out) is applied automatically to
  // every common content-block component below, so every page —
  // current and future — inherits the same considered entrance with
  // no markup changes required. An explicit class="reveal" elsewhere
  // in the HTML still works exactly as before; this only adds more
  // elements to the set already being observed.
  // Deliberately excludes interactive elements like .accordion__item —
  // reveal fades from opacity:0, and a focusable/clickable control
  // sitting briefly invisible before IntersectionObserver fires is an
  // avoidable interaction risk this selector list simply doesn't take
  // on. Everything here is non-interactive display content.
  var AUTO_REVEAL_SELECTOR = '.card, .stat-row__item, .pull-quote, .callout';
  var autoRevealEls = document.querySelectorAll(AUTO_REVEAL_SELECTOR);
  autoRevealEls.forEach(function (el) { el.classList.add('reveal'); });

  // Elements sharing a parent (a grid of cards, a row of stats) get a
  // small staggered delay so they cascade in rather than arriving
  // simultaneously — capped at 6 steps so a long list's last item
  // isn't left waiting nearly a second before it even starts.
  var revealGroups = new Map();
  autoRevealEls.forEach(function (el) {
    var parent = el.parentElement;
    if (!parent) return;
    if (!revealGroups.has(parent)) revealGroups.set(parent, []);
    revealGroups.get(parent).push(el);
  });
  revealGroups.forEach(function (siblings) {
    siblings.forEach(function (el, i) {
      el.style.setProperty('--reveal-delay', (Math.min(i, 6) * 0.08) + 's');
    });
  });

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
  function hideFormStatus(form) {
    var status = form.querySelector('[data-form-status]');
    if (status) status.className = 'form-status';
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
      var index = parseInt(checked.value, 10);
      var level = levels[index];
      if (!level) return;
      var text = template
        .replace('{roman}', level.roman)
        .replace('{name}', level.name)
        .replace('{cefr}', level.cefr);
      resultText.textContent = text;
      resultBox.hidden = false;
      resultBox.scrollIntoView({ behavior: scrollPref(), block: 'nearest' });

      // Hand the result to the application form below (same page) and
      // persist it, so a level chosen here still shows up on the
      // application form even if the visitor leaves and comes back —
      // see the [data-admissions-form] handler.
      var suggestion = { levelId: index + 1, roman: level.roman, name: level.name, cefr: level.cefr, text: text };
      try { sessionStorage.setItem('wec-lc-suggested-level', JSON.stringify(suggestion)); } catch (err) { /* storage unavailable — degrade silently */ }
      document.dispatchEvent(new CustomEvent('wec:level-suggested', { detail: suggestion }));
    });
  });

  // Admissions application form — tries the real API
  // (functions/api/admissions/apply.js) first, and falls back to the
  // existing mailto pattern automatically if that API isn't reachable
  // (which it won't be until hosting/D1 are live — see
  // docs/technical-architecture.md). Same interface either way, so
  // going live later needs no frontend change: the API path just
  // starts succeeding instead of falling through.
  document.querySelectorAll('[data-admissions-form]').forEach(function (form) {
    var endpoint = form.getAttribute('data-endpoint') || '/api/admissions/apply';
    var fallbackEmail = form.getAttribute('data-fallback-email') || 'info@worldwencollege.co.uk';
    var storageKey = form.getAttribute('data-storage-key') || 'wec-lc-admissions-draft';
    var nameField = form.querySelector('[name="fullName"]');
    var emailField = form.querySelector('[name="email"]');
    var countryField = form.querySelector('[name="country"]');
    var submitBtn = form.querySelector('[data-submit-btn]');
    var btnLabel = form.querySelector('[data-btn-label]');
    var levelSummary = form.querySelector('[data-level-summary]');
    var levelSummaryText = form.querySelector('[data-level-summary-text]');
    var defaultLabel = btnLabel ? btnLabel.textContent : 'Submit Application';
    var suggestedLevelId = null;

    var text = {
      loading: form.getAttribute('data-loading-text') || 'Submitting…',
      fieldError: form.getAttribute('data-error-text') || 'Please fix the highlighted fields below.',
      success: form.getAttribute('data-success-text') || 'Application received — we’ll be in touch soon.',
      fallback: form.getAttribute('data-fallback-text') || 'We couldn’t reach our online application system, so we’ve opened your email app with your details ready to send — please hit send to complete your application.',
      retry: form.getAttribute('data-retry-label') || 'Try Again',
    };

    // --- Draft persistence (requirement: don't lose data on failure) ---
    function saveDraft() {
      try {
        sessionStorage.setItem(storageKey, JSON.stringify(collectFields()));
      } catch (err) { /* storage unavailable (private browsing etc.) — degrade silently */ }
    }
    function restoreDraft() {
      try {
        var raw = sessionStorage.getItem(storageKey);
        if (!raw) return;
        var draft = JSON.parse(raw);
        // Restored by name, so a draft covers every question the form
        // asks. A long form the applicant has to retype after one
        // mistyped email is a form they abandon instead.
        Object.keys(draft).forEach(function (key) {
          var el = form.querySelector('[name="' + key + '"]');
          if (!el || draft[key] === '' || draft[key] == null) return;
          if (el.type === 'checkbox') { el.checked = !!draft[key]; return; }
          if (el.type === 'radio') {
            var picked = form.querySelector('[name="' + key + '"][value="' + draft[key] + '"]');
            if (picked) picked.checked = true;
            return;
          }
          el.value = draft[key];
        });
      } catch (err) { /* corrupt/unavailable draft — start clean, not fatal */ }
    }
    function clearDraft() {
      try { sessionStorage.removeItem(storageKey); } catch (err) { /* no-op */ }
    }
    restoreDraft();
    [nameField, emailField, countryField].forEach(function (field) {
      field.addEventListener('input', saveDraft);
      field.addEventListener('change', saveDraft);
    });

    // --- Suggested level, from the self-assessment quiz above ---
    function applySuggestion(detail) {
      suggestedLevelId = detail.levelId;
      if (levelSummaryText) levelSummaryText.textContent = form.getAttribute('data-level-summary-template')
        ? form.getAttribute('data-level-summary-template').replace('{text}', detail.text)
        : ('Suggested starting level: ' + detail.text);
      if (levelSummary) levelSummary.hidden = false;
    }
    document.addEventListener('wec:level-suggested', function (e) { applySuggestion(e.detail); });
    try {
      var stored = sessionStorage.getItem('wec-lc-suggested-level');
      if (stored) applySuggestion(JSON.parse(stored));
    } catch (err) { /* no stored suggestion — the quiz is optional, form works without it */ }

    // --- Validation (mirrors functions/api/admissions/apply.js's own checks,
    //     so a visitor sees the same rule client-side and server-side) ---
    function validate() {
      var ok = true;
      if (!nameField.value.trim()) { setFieldInvalid(nameField); ok = false; } else { setFieldValid(nameField); }
      if (!EMAIL_RE.test(emailField.value.trim())) { setFieldInvalid(emailField); ok = false; } else { setFieldValid(emailField); }
      if (!countryField.value) { setFieldInvalid(countryField); ok = false; } else { setFieldValid(countryField); }
      return ok;
    }
    [nameField, emailField, countryField].forEach(function (field) {
      field.addEventListener('input', function () {
        var ok = field === emailField ? EMAIL_RE.test(field.value.trim()) : Boolean(field.value.trim());
        if (ok) setFieldValid(field);
      });
    });

    function setLoading(isLoading) {
      submitBtn.disabled = isLoading;
      [nameField, emailField, countryField].forEach(function (f) { f.disabled = isLoading; });
      if (btnLabel) btnLabel.textContent = isLoading ? text.loading : defaultLabel;
      submitBtn.classList.toggle('btn--loading', isLoading);
    }

    // EVERY NAMED CONTROL, COLLECTED ONCE.
    //
    // The payload, the saved draft and the email fallback each used to
    // name fullName, email and country by hand. That is fine for three
    // fields and a silent data-loss bug for four: adding a question to
    // the form would have posted markup the applicant filled in and a
    // payload that never carried it, and nothing anywhere would have
    // said so. The applicant would believe they had told us.
    //
    // So the form is read, not enumerated. Add a control with a `name`
    // and it flows to the API, the draft and the fallback email without
    // touching this file — which is the only arrangement in which a
    // form and its transport cannot drift apart.
    //
    // Unticked checkboxes are false rather than absent, because "did
    // not consent" and "was not asked" are different facts.
    function collectFields() {
      var out = {};
      form.querySelectorAll('[name]').forEach(function (el) {
        var key = el.getAttribute('name');
        if (!key || el.disabled) return;
        if (el.type === 'checkbox') { out[key] = el.checked; return; }
        if (el.type === 'radio') { if (el.checked) out[key] = el.value; return; }
        out[key] = typeof el.value === 'string' ? el.value.trim() : el.value;
      });
      return out;
    }

    // The human-readable label for a control's current value — the text
    // of a chosen <option>, not its code. An email to Admissions saying
    // "Country: AE" is a worse email than one saying "United Arab
    // Emirates", and the fallback exists to be read by a person.
    function labelFor(el) {
      if (el.tagName === 'SELECT') {
        var opt = el.options[el.selectedIndex];
        return opt ? opt.text : el.value;
      }
      if (el.type === 'checkbox') return el.checked ? 'Yes' : 'No';
      return el.value.trim();
    }

    function buildMailtoFallback() {
      var subject = 'IEFC Application — ' + nameField.value.trim();
      var lines = [];
      form.querySelectorAll('[name]').forEach(function (el) {
        if (el.disabled) return;
        if (el.type === 'radio' && !el.checked) return;
        var value = labelFor(el);
        if (!value) return;
        // The label the applicant read, so the email reads the way the
        // form did rather than in field names.
        var lab = form.querySelector('label[for="' + el.id + '"]');
        var name = lab ? lab.textContent.replace(/\s+/g, ' ').trim() : el.getAttribute('name');
        lines.push(name + ': ' + value);
      });
      if (suggestedLevelId) {
        lines.push('Self-assessed starting level: ' + (levelSummaryText ? levelSummaryText.textContent : suggestedLevelId));
      }
      lines.push('', '(Sent automatically because the online application system was unreachable.)');
      return 'mailto:' + encodeURIComponent(fallbackEmail) +
        '?subject=' + encodeURIComponent(subject) + '&body=' + encodeURIComponent(lines.join('\n'));
    }

    async function submitToApi(payload) {
      var controller = new AbortController();
      var timeout = window.setTimeout(function () { controller.abort(); }, 8000);
      try {
        var resp = await fetch(endpoint, {
          method: 'POST',
          headers: { 'content-type': 'application/json' },
          body: JSON.stringify(payload),
          signal: controller.signal,
        });
        window.clearTimeout(timeout);

        if (resp.status === 422) {
          var errBody = await resp.json().catch(function () { return null; });
          return { outcome: 'validation-error', fields: errBody && errBody.fields };
        }
        if (!resp.ok) return { outcome: 'unavailable' }; // 404 (not deployed yet), 5xx, etc.

        var data = await resp.json().catch(function () { return null; });
        if (!data || !data.applicationId) return { outcome: 'unavailable' }; // malformed 2xx — treat as untrustworthy, not a crash
        return { outcome: 'success', applicationId: data.applicationId };
      } catch (err) {
        window.clearTimeout(timeout);
        return { outcome: 'unavailable' }; // network error, timeout, CORS, or no Functions runtime deployed yet
      }
    }

    form.addEventListener('submit', async function (e) {
      e.preventDefault();
      if (!validate()) {
        var firstInvalid = form.querySelector('.field.is-invalid input, .field.is-invalid select');
        if (firstInvalid) firstInvalid.focus();
        showFormStatus(form, 'error', text.fieldError);
        return;
      }

      setLoading(true);
      hideFormStatus(form); // clear any previous status while we try

      var payload = collectFields();
      payload.selfAssessedLevelId = suggestedLevelId;
      var result = await submitToApi(payload);

      setLoading(false);

      if (result.outcome === 'success') {
        clearDraft();
        showFormStatus(form, 'success', text.success + (result.applicationId ? ' (Reference: ' + result.applicationId + ')' : ''));
        form.reset();
        if (levelSummary) levelSummary.hidden = true;
        [nameField, emailField, countryField].forEach(function (f) { f.disabled = true; });
        submitBtn.disabled = true;
        if (btnLabel) btnLabel.textContent = defaultLabel;
        return;
      }

      if (result.outcome === 'validation-error') {
        if (result.fields) {
          Object.keys(result.fields).forEach(function (name) {
            var field = form.querySelector('[name="' + name + '"]');
            if (field) setFieldInvalid(field);
          });
        }
        showFormStatus(form, 'error', text.fieldError);
        return; // draft preserved, form re-enabled by setLoading(false) above — retry in place
      }

      // outcome === 'unavailable' — the documented fallback path. Not
      // styled as a full success: the email still needs the visitor
      // to actually hit send.
      showFormStatus(form, 'info', text.fallback);
      if (btnLabel) btnLabel.textContent = text.retry; // next click retries the API, not a second mailto
      window.setTimeout(function () { window.location.href = buildMailtoFallback(); }, 500);
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
