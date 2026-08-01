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
  document.querySelectorAll('.accordion__q').forEach(function (btn) {
    btn.addEventListener('click', function () {
      var item = btn.closest('.accordion__item');
      var answer = item.querySelector('.accordion__a');
      var isOpen = item.classList.contains('is-open');
      item.parentElement.querySelectorAll('.accordion__item.is-open').forEach(function (openItem) {
        if (openItem !== item) {
          openItem.classList.remove('is-open');
          openItem.querySelector('.accordion__a').style.maxHeight = null;
        }
      });
      if (isOpen) {
        item.classList.remove('is-open');
        answer.style.maxHeight = null;
      } else {
        item.classList.add('is-open');
        answer.style.maxHeight = answer.scrollHeight + 'px';
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
  // to a fake "submitted" confirmation.
  document.querySelectorAll('[data-mailto-form]').forEach(function (form) {
    form.addEventListener('submit', function (e) {
      e.preventDefault();
      var to = form.getAttribute('data-mailto-to') || 'admissions@wec-lc.org';
      var name = form.querySelector('[name="name"]');
      var email = form.querySelector('[name="email"]');
      var topic = form.querySelector('[name="topic"]');
      var message = form.querySelector('[name="message"]');
      var subject = 'Website Enquiry' + (topic && topic.value ? ' — ' + topic.value : '');
      var bodyLines = [
        name && name.value ? 'Name: ' + name.value : '',
        email && email.value ? 'Email: ' + email.value : '',
        '',
        message ? message.value : ''
      ];
      var mailto = 'mailto:' + encodeURIComponent(to) +
        '?subject=' + encodeURIComponent(subject) +
        '&body=' + encodeURIComponent(bodyLines.join('\n'));
      window.location.href = mailto;
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
