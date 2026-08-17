/* AIPC — The Graduate Register, browsable.

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

  function fmtDate(iso) {
    if (!iso) return '';
    var d = new Date(iso.length === 10 ? iso + 'T00:00:00Z' : iso);
    if (isNaN(d.getTime())) return iso;
    return d.toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric', timeZone: 'UTC' });
  }

  function el(tag, cls, text) {
    var n = document.createElement(tag);
    if (cls) n.className = cls;
    if (text !== undefined && text !== null) n.textContent = text;
    return n;
  }

  function entryNode(e) {
    var li = el('li', 'reg-entry');

    var main = el('div');
    var name = el('p', 'reg-entry__name', e.holderName);
    if (e.postNominal) name.appendChild(el('span', 'reg-entry__post', e.postNominal));
    main.appendChild(name);
    main.appendChild(el('p', 'reg-entry__award', e.awardTitle));

    var meta = el('p', 'reg-entry__meta');
    // Honour first: it is the distinction the graduate earned, and
    // burying it after the date would make the roll read as a list of
    // dates that happen to have people attached.
    if (e.honourLabel && e.honour !== 'pass') {
      meta.appendChild(el('span', 'reg-entry__honour', e.honourLabel));
      meta.appendChild(document.createTextNode(' '));
    }
    meta.appendChild(document.createTextNode(
      'Level ' + e.roman + (e.cefr ? ' · CEFR ' + e.cefr : '')
      + (e.conferredOn ? ' · Conferred ' + fmtDate(e.conferredOn) : '')));
    main.appendChild(meta);
    li.appendChild(main);

    var check = el('div', 'reg-entry__check');
    var a = el('a', null, 'Verify this award');
    a.href = '/verify.html?code=' + encodeURIComponent(e.verificationCode);
    check.appendChild(a);
    check.appendChild(el('span', 'reg-entry__code', e.verificationCode));
    li.appendChild(check);

    return li;
  }

  function emptyNode(filtered) {
    var p = el('p', 'reg-empty');
    p.appendChild(el('strong', null,
      filtered ? 'No listed award matches that search.' : 'No awards have yet been conferred.'));
    p.appendChild(document.createTextNode(filtered
      ? 'Not every graduate consents to appear here. An award that is not listed can still be checked by its code at Award Verification.'
      : 'The Register is published in advance of the first conferral so that verification exists from the first award rather than after it. It will fill as awards are made.'));
    return p;
  }

  function render(data, filtered) {
    var list = $('#list');
    list.textContent = '';
    var entries = (data && data.entries) || [];

    if (!entries.length) {
      $('#count').textContent = 'The register';
      list.appendChild(emptyNode(filtered));
      $('#more').hidden = true;
      return;
    }

    $('#count').textContent = entries.length === 1
      ? '1 award listed'
      : entries.length + ' awards listed';
    entries.forEach(function (e) { list.appendChild(entryNode(e)); });

    // Said plainly rather than left to be discovered. A silently
    // truncated register is one a visitor draws a false conclusion from
    // — "they only have 200 graduates" — and never learns otherwise.
    $('#more').hidden = !data.truncated;
    if (data.truncated) {
      $('#more').textContent = 'Showing the first ' + data.limit
        + '. Narrow the search by name or by award to see further entries.';
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
        $('#list').textContent = '';
        $('#count').textContent = 'The register';
        var p = el('p', 'reg-empty');
        p.appendChild(el('strong', null, 'The Register could not be reached.'));
        p.appendChild(document.createTextNode(
          'This is a fault on our side, not a statement about any award. Please try again shortly, or check a specific award by its code.'));
        $('#list').appendChild(p);
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
