/* WEC-LC — Listening Lab
   The audio learning environment's behaviour. Real working software:
   playback, transcript synchronisation, A-B repeat, speed control,
   bookmarks, notes, voice recording via MediaRecorder, comprehension
   assessment scored server-side, and the pronunciation profile.

   TWO RENDERING MODES, and this is the central design decision:

     recorded    — media_url present. Full transport, waveform drawn
                   from decoded audio, cue highlighting driven by
                   timeupdate.
     script      — media_url null. The recording has not been made yet.
                   The transcript, cue navigation, bookmarks, notes,
                   recording and comprehension all still work; only the
                   transport is inert, and it says so plainly.

   Script mode is not a degraded fallback bolted on afterwards. It is
   the state most of the curriculum is in today, so it is the state the
   interface is designed around. When narration is dropped in later,
   the same page becomes mode one with no code change — it reads
   `isRecorded` from the API and nothing else.
*/
(function () {
  'use strict';

  var $ = function (sel, root) { return (root || document).querySelector(sel); };
  var $$ = function (sel, root) { return Array.prototype.slice.call((root || document).querySelectorAll(sel)); };

  var state = {
    item: null,          // the listening learning item
    audio: null,         // { cues, isRecorded, isSynchronised, ... }
    el: null,            // HTMLAudioElement, or null in script mode
    activeCue: -1,
    region: null,        // { startMs, endMs } for A-B repeat
    marks: [],           // bookmarked cue sequences
    takes: [],           // learner recordings
    recorder: null,
    chunks: [],
    recStart: 0,
    recTimer: null,
    meterRaf: null,
  };

  // ---- storage: notes and bookmarks survive a reload, offline ---------
  // localStorage rather than the server because a half-written note is
  // the learner's private working material, not submitted work. It also
  // means the lab keeps functioning with no network at all.
  function key(suffix) { return 'wec.lab.' + (state.item ? state.item.id : 'unknown') + '.' + suffix; }
  function load(suffix, fallback) {
    try { var v = localStorage.getItem(key(suffix)); return v === null ? fallback : JSON.parse(v); }
    catch (e) { return fallback; }
  }
  function save(suffix, value) {
    try { localStorage.setItem(key(suffix), JSON.stringify(value)); return true; }
    catch (e) { return false; }
  }

  function fmt(ms) {
    if (ms === null || ms === undefined || isNaN(ms)) return '--:--';
    var s = Math.max(0, Math.floor(ms / 1000));
    return String(Math.floor(s / 60)).padStart(2, '0') + ':' + String(s % 60).padStart(2, '0');
  }

  // ---- API ------------------------------------------------------------
  // Headers come from js/api-auth.js, which mints a fresh Clerk token
  // per request. Every endpoint this page calls is behind requireUser(),
  // so a request without that header is a guaranteed 401 — see the
  // catch in boot(), which turns it into "Sign in to open the
  // Listening Lab" rather than a broken page.
  function api(path, opts) {
    return window.WEC_LC_apiAuth.headers().then(function (headers) {
      return fetch(path, Object.assign({}, opts || {}, { headers: headers }));
    }).then(function (r) {
      return r.json().catch(function () { return {}; }).then(function (body) {
        if (!r.ok) throw Object.assign(new Error(body.message || r.statusText), { status: r.status, body: body });
        return body;
      });
    });
  }

  // ---- Waveform -------------------------------------------------------
  // Drawn from the decoded buffer when audio exists. In script mode we
  // draw the CUE STRUCTURE instead — one block per transcript segment,
  // sized by its word count. That is honest (it is derived from real
  // data, not invented amplitude) and it still gives the learner a
  // usable picture of the shape and length of what they will hear.
  function drawWave(canvas, peaks, playedFraction) {
    var dpr = window.devicePixelRatio || 1;
    var w = canvas.clientWidth, h = canvas.clientHeight;
    canvas.width = Math.max(1, Math.floor(w * dpr));
    canvas.height = Math.max(1, Math.floor(h * dpr));
    var ctx = canvas.getContext('2d');
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.clearRect(0, 0, w, h);

    var css = getComputedStyle(document.documentElement);
    var idle = css.getPropertyValue('--royal-bright').trim() || '#274B85';
    var played = css.getPropertyValue('--gold').trim() || '#C7A24A';

    var n = peaks.length;
    var barW = Math.max(1.5, (w / n) * 0.62);
    var gap = (w / n) - barW;
    var mid = h / 2;
    for (var i = 0; i < n; i++) {
      var x = i * (barW + gap);
      var amp = Math.max(0.06, peaks[i]) * (h * 0.44);
      ctx.fillStyle = (i / n) <= playedFraction ? played : idle;
      ctx.globalAlpha = (i / n) <= playedFraction ? 0.95 : 0.34;
      ctx.beginPath();
      var r = Math.min(barW / 2, 2);
      var y = mid - amp, hh = amp * 2;
      if (ctx.roundRect) { ctx.roundRect(x, y, barW, hh, r); } else { ctx.rect(x, y, barW, hh); }
      ctx.fill();
    }
    ctx.globalAlpha = 1;
  }

  function peaksFromBuffer(buffer, count) {
    var data = buffer.getChannelData(0);
    var block = Math.floor(data.length / count);
    var out = [];
    var max = 0;
    for (var i = 0; i < count; i++) {
      var sum = 0;
      for (var j = 0; j < block; j++) { var v = data[i * block + j]; sum += v * v; }
      var rms = Math.sqrt(sum / block);
      out.push(rms); if (rms > max) max = rms;
    }
    return out.map(function (v) { return max ? v / max : 0; });
  }

  function peaksFromCues(cues, count) {
    // Structural waveform: each cue contributes a run of bars whose
    // height reflects its length relative to the longest cue.
    var lens = cues.map(function (c) { return c.text.split(/\s+/).length; });
    var maxLen = Math.max.apply(null, lens.concat([1]));
    var total = lens.reduce(function (a, b) { return a + b; }, 0) || 1;
    var out = [];
    for (var i = 0; i < cues.length; i++) {
      var bars = Math.max(2, Math.round((lens[i] / total) * count));
      var base = 0.30 + 0.55 * (lens[i] / maxLen);
      for (var b = 0; b < bars; b++) {
        // gentle deterministic variation so it reads as speech, not a bar chart
        out.push(base * (0.72 + 0.28 * Math.abs(Math.sin((i + 1) * 1.7 + b * 0.9))));
      }
      out.push(0.05); // inter-cue pause
    }
    return out.slice(0, count);
  }

  // ---- Transcript synchronisation -------------------------------------
  function cueAt(ms) {
    var cues = state.audio.cues;
    for (var i = 0; i < cues.length; i++) {
      if (cues[i].startMs === null) continue;
      if (ms >= cues[i].startMs && (cues[i].endMs === null || ms < cues[i].endMs)) return i;
    }
    return -1;
  }

  function setActiveCue(idx, opts) {
    if (idx === state.activeCue) return;
    state.activeCue = idx;
    $$('.cue').forEach(function (el, i) {
      var on = i === idx;
      el.classList.toggle('is-active', on);
      el.setAttribute('aria-current', on ? 'true' : 'false');
    });
    if (idx >= 0 && (!opts || opts.scroll !== false)) {
      var el = $$('.cue')[idx];
      if (el && el.scrollIntoView) {
        var reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
        el.scrollIntoView({ block: 'nearest', behavior: reduce ? 'auto' : 'smooth' });
      }
    }
    // Live region for screen readers — announces the current line so a
    // non-sighted learner can follow the transcript position.
    var live = $('#cueLive');
    if (live && idx >= 0) live.textContent = state.audio.cues[idx].speaker + ': ' + state.audio.cues[idx].text;
  }

  /* ── THE LABORATORY, IN THE EDITION IT WAS OPENED IN ────────────────
   *
   * /ar/listening-lab.html served an Arabic page and ran an English
   * laboratory inside it: "Script mode.", "No bookmarks yet.",
   * "Recording unsupported", "Microphone permission was refused.",
   * "Uploading your take…", "Keep offline", "not attempted". Forty
   * sentences, on the surface a learner spends the most time inside.
   *
   * Same rules as the rest of the site: the page's own words are here
   * in both languages; the transcript, the pronunciation targets and
   * the questions are curriculum content and come from the platform, so
   * each takes its own direction rather than the page's. */
  var AR = document.documentElement.lang === 'ar';
  var LOCALE = AR ? 'ar' : 'en-GB';

  var T = AR ? {
    scriptModeLead: 'وضع النصّ.',
    scriptModeRest: ' لم يُسجَّل تسجيل الاستوديو لهذا الاستماع بعد، فالتشغيل غير متاح. وكلُّ ما عدا ذلك في هذه الصفحة يعمل: اقرأ النصّ، وعلِّم السطور، ودوِّن ملاحظاتك، وسجِّل صوتك وأرسله، وأجب عن أسئلة الفهم. وحين تُضاف الرواية تصير هذه الصفحة مشغّلًا كاملًا دون أن يتغيّر شيء ممّا حفظته.',
    bookmarkLine: function (n) { return 'علِّم السطر ' + n; },
    removeBookmark: 'احذف العلامة',
    noBookmarks: 'لا علامات بعد. استعمل الرايةَ على أيّ سطر لتعليمه للمراجعة.',
    noTargets: 'لا أهداف نطق لهذه المادة.',
    replayLine: 'أعد السطر الذي يختبره هذا السؤال',
    showLine: 'أظهر السطر الذي يختبره هذا السؤال',
    noTakes: 'لا تسجيلات بعد. سجّل صوتك ثم استمع إليه — تلك هي الخطوة التي تنفع.',
    dims: [['intelligibility', 'وضوح الفهم'], ['wordStress', 'نبر الكلمة'],
      ['sentenceStress', 'نبر الجملة'], ['individualSounds', 'الأصوات المفردة'], ['fluency', 'الطلاقة']],
    scriptOnly: '— نصٌّ فقط',
    setB: 'حدّد ب', clearAB: 'امسح أ–ب', setAB: 'حدّد أ–ب',
    pause: 'إيقاف مؤقّت', play: 'تشغيل',
    recUnsupported: 'التسجيل غير مدعوم',
    recUnsupportedNote: 'لا يدعم هذا المتصفّح التسجيل داخل الصفحة. سجّل بأيّ جهاز واطلب من مدرّسك رفع الملف.',
    stop: 'أوقف', record: 'سجّل',
    micRefused: 'رُفض إذن الميكروفون. امنح الإذن من إعدادات متصفّحك لتسجّل.',
    uploading: 'جارٍ رفع تسجيلك…',
    uploadingPct: function (n) { return 'جارٍ رفع تسجيلك… ' + n + '%'; },
    uploaded: function (n) { return 'رُفع التسجيل ' + n + ' وأُرسل للمراجعة. استمع إليه قبل أن تسجّل مرّة أخرى.'; },
    signInToSave: 'سجّل الدخول لحفظ هذا التسجيل. وهو ما زال قابلًا للتشغيل على هذا الجهاز حتى تُحدِّث الصفحة.',
    uploadFailed: function (m) {
      return 'تعذّر رفع التسجيل: ' + m + ' وهو ما زال قابلًا للتشغيل على هذا الجهاز حتى تُحدِّث الصفحة — اضغط «سجّل» لتعيد المحاولة.';
    },
    notUploaded: 'لم يُرفع',
    answerAllLead: 'أجب عن كل سؤال أولًا.',
    answerAllRest: function (n) { return ' بقي ' + n + ' بلا إجابة.'; },
    marking: 'جارٍ تصحيح إجاباتك…',
    passed: 'ناجح. ', notPassed: 'لم تنجح بعد. ',
    quizRest: 'استعمل روابط الإعادة للرجوع إلى السطور التي فاتتك، ثم أعد المحاولة.',
    couldNotSubmit: function (m) { return 'تعذّر الإرسال: ' + m; },
    unsaved: 'لم يُحفظ بعد…',
    savedHere: 'محفوظ على هذا الجهاز',
    couldNotSave: 'تعذّر الحفظ — التخزين غير متاح',
    notesPrivate: 'ملاحظاتك خاصّة وتبقى على هذا الجهاز',
    noOfflineStorage: 'التخزين دون اتصال غير مدعوم في هذا المتصفّح',
    nothingToDownload: 'لا شيء للتنزيل بعد — لم يُسجَّل التسجيل',
    availableOffline: 'متاح دون اتصال', notDownloaded: 'غير مُنزَّل',
    removeDownload: 'احذف التنزيل', keepOffline: 'احفظه دون اتصال',
    downloadFailed: 'فشل التنزيل — أعد المحاولة على اتصال أفضل',
    moduleShort: function (n) { return 'و' + n; },
    notAttempted: 'لم تُحاوَل',
    recordingsSuffix: function (n) { return ' — ' + n + ' تسجيل'; },
    attemptedOf: function (a, b) { return a + ' من ' + b + ' حوولت'; },
    nothingAttempted: 'لم تُحاوَل أيٌّ بعد',
    noUnit: 'لم تُحدَّد وحدة. افتح هذه الصفحة من وحدة دراسية.',
    noListening: 'لا مادة استماع في هذه الوحدة.',
    progressUnavailable: 'التقدّم غير متاح.',
    profileUnavailable: 'الملفّ غير متاح.',
    signInToOpen: 'سجّل الدخول لفتح مختبر الاستماع.',
    couldNotLoad: function (m) { return 'تعذّر تحميل هذا الاستماع: ' + m; },
    varieties: { BrE: 'إنجليزية بريطانية', AmE: 'إنجليزية أمريكية' },
    wpm: function (n) { return n + ' كلمة في الدقيقة'; },
    takeN: function (n) { return 'التسجيل ' + n; },
    newTake: 'تسجيل جديد',
    takeStates: {
      reviewed: 'رُوجع',
      uploading: 'جارٍ الرفع…',
      notUploaded: 'على هذا الجهاز فقط — غير محفوظ',
      awaiting: 'بانتظار المراجعة',
    },
    automated: 'تحليل آلي', instructor: 'المدرّس',
    fbDims: ['وضوح الفهم', 'نبر الكلمة', 'نبر الجملة', 'الأصوات', 'الطلاقة'],
    notYetAssessed: 'لم يُقيَّم بعد',
    reviewedCount: function (n) { return n + ' تسجيلًا مُراجَعًا'; },
    noneReviewed: 'لا تسجيلات مُراجَعة بعد',
    lpSummary: ['استماعات حوولت', 'متوسّط أفضل درجة', 'تسجيلات سُجِّلت'],
  } : {
    scriptModeLead: 'Script mode.',
    scriptModeRest: ' The studio recording for this listening has not been made yet, so playback is unavailable. Everything else on this page works: read the transcript, bookmark lines, take notes, record and submit your own voice, and answer the comprehension questions. When narration is added, this page becomes a full player with no change to your saved work.',
    bookmarkLine: function (n) { return 'Bookmark line ' + n; },
    removeBookmark: 'Remove bookmark',
    noBookmarks: 'No bookmarks yet. Use the flag on any line to mark it for revision.',
    noTargets: 'No pronunciation targets for this item.',
    replayLine: 'Replay the line this tests',
    showLine: 'Show the line this tests',
    noTakes: 'No recordings yet. Record yourself, then listen back — that is the step that works.',
    dims: [['intelligibility', 'Intelligibility'], ['wordStress', 'Word stress'],
      ['sentenceStress', 'Sentence stress'], ['individualSounds', 'Individual sounds'], ['fluency', 'Fluency']],
    scriptOnly: '— script only',
    setB: 'Set B', clearAB: 'Clear A–B', setAB: 'Set A–B',
    pause: 'Pause', play: 'Play',
    recUnsupported: 'Recording unsupported',
    recUnsupportedNote: 'This browser does not support in-page recording. Record with any device and ask your instructor to upload the file.',
    stop: 'Stop', record: 'Record',
    micRefused: 'Microphone permission was refused. Grant access in your browser settings to record.',
    uploading: 'Uploading your take…',
    uploadingPct: function (n) { return 'Uploading your take… ' + n + '%'; },
    uploaded: function (n) { return 'Take ' + n + ' uploaded and sent for review. Listen back before you record again.'; },
    signInToSave: 'Sign in to save this take. It is still playable on this device until you reload.',
    uploadFailed: function (m) {
      return 'Could not upload the take: ' + m + ' It is still playable on this device until you reload — press Record to try again.';
    },
    notUploaded: 'not uploaded',
    answerAllLead: 'Answer every question first.',
    answerAllRest: function (n) { return ' ' + n + ' still unanswered.'; },
    marking: 'Marking your answers…',
    passed: 'passed. ', notPassed: 'not yet passed. ',
    quizRest: 'Use the replay links to go back to the lines you missed, then try again.',
    couldNotSubmit: function (m) { return 'Could not submit: ' + m; },
    unsaved: 'unsaved…',
    savedHere: 'saved on this device',
    couldNotSave: 'could not save — storage unavailable',
    notesPrivate: 'notes are private and stay on this device',
    noOfflineStorage: 'Offline storage is not supported in this browser',
    nothingToDownload: 'Nothing to download yet — the recording has not been made',
    availableOffline: 'Available offline', notDownloaded: 'Not downloaded',
    removeDownload: 'Remove download', keepOffline: 'Keep offline',
    downloadFailed: 'Download failed — try again on a better connection',
    moduleShort: function (n) { return 'M' + n; },
    notAttempted: 'not attempted',
    recordingsSuffix: function (n) { return ' — ' + n + ' recording(s)'; },
    attemptedOf: function (a, b) { return a + ' of ' + b + ' attempted'; },
    nothingAttempted: 'nothing attempted yet',
    noUnit: 'No unit specified. Open this page from a module.',
    noListening: 'This module has no listening item.',
    progressUnavailable: 'Progress unavailable.',
    profileUnavailable: 'Profile unavailable.',
    signInToOpen: 'Sign in to open the Listening Lab.',
    couldNotLoad: function (m) { return 'Could not load this listening: ' + m; },
    varieties: { BrE: 'British English', AmE: 'American English' },
    wpm: function (n) { return n + ' words per minute'; },
    takeN: function (n) { return 'Take ' + n; },
    newTake: 'New take',
    takeStates: {
      reviewed: 'reviewed',
      uploading: 'uploading…',
      notUploaded: 'on this device only — not saved',
      awaiting: 'awaiting review',
    },
    automated: 'Automated analysis', instructor: 'Instructor',
    fbDims: ['Intelligibility', 'Word stress', 'Sentence stress', 'Sounds', 'Fluency'],
    notYetAssessed: 'not yet assessed',
    reviewedCount: function (n) { return n + ' reviewed recording' + (n === 1 ? '' : 's'); },
    noneReviewed: 'no reviewed recordings yet',
    lpSummary: ['listenings attempted', 'average best score', 'recordings made'],
  };

  // ---- Rendering -------------------------------------------------------
  function renderStatus() {
    var box = $('#labStatus');
    if (!box) return;
    if (state.audio.isRecorded) { box.hidden = true; return; }
    box.hidden = false;
    var st = $('#labStatusText');
    st.textContent = '';
    var lead = document.createElement('strong');
    lead.textContent = T.scriptModeLead;
    st.appendChild(lead);
    st.appendChild(document.createTextNode(T.scriptModeRest));
  }

  function renderTranscript() {
    var list = $('#cues');
    list.innerHTML = '';
    state.audio.cues.forEach(function (cue, i) {
      var li = document.createElement('li');
      li.className = 'cue';
      li.tabIndex = 0;
      li.setAttribute('role', 'button');
      li.setAttribute('aria-current', 'false');
      li.dataset.index = String(i);

      var sp = document.createElement('span');
      sp.className = 'cue__speaker';
      sp.textContent = cue.speaker || '';
      sp.setAttribute('dir', 'auto');

      // The transcript is the curriculum's own text and is English on
      // both editions: it is the thing being listened to. dir="auto"
      // lays it out as English inside the Arabic page rather than
      // reversing its punctuation.
      var tx = document.createElement('span');
      tx.className = 'cue__text';
      tx.textContent = cue.text;
      tx.setAttribute('dir', 'auto');

      var mk = document.createElement('button');
      mk.className = 'cue__mark';
      mk.type = 'button';
      mk.setAttribute('aria-pressed', state.marks.indexOf(cue.sequence) >= 0 ? 'true' : 'false');
      mk.setAttribute('aria-label', T.bookmarkLine(cue.sequence));
      mk.textContent = '⚑';
      mk.addEventListener('click', function (ev) { ev.stopPropagation(); toggleMark(cue.sequence, mk); });

      li.appendChild(sp); li.appendChild(tx); li.appendChild(mk);
      li.addEventListener('click', function () { seekToCue(i); });
      li.addEventListener('keydown', function (ev) {
        if (ev.key === 'Enter' || ev.key === ' ') { ev.preventDefault(); seekToCue(i); }
      });
      list.appendChild(li);
    });
  }

  function seekToCue(i) {
    var cue = state.audio.cues[i];
    setActiveCue(i);
    if (state.el && cue.startMs !== null) {
      state.el.currentTime = cue.startMs / 1000;
      if (state.el.paused) state.el.play().catch(function () {});
    }
  }

  function toggleMark(seq, btn) {
    var at = state.marks.indexOf(seq);
    if (at >= 0) state.marks.splice(at, 1); else state.marks.push(seq);
    state.marks.sort(function (a, b) { return a - b; });
    save('marks', state.marks);
    if (btn) btn.setAttribute('aria-pressed', at >= 0 ? 'false' : 'true');
    renderMarks();
  }

  function renderMarks() {
    var ul = $('#marks');
    ul.innerHTML = '';
    if (!state.marks.length) {
      var li = document.createElement('li');
      li.className = 'drop';
      li.textContent = T.noBookmarks;
      ul.appendChild(li);
      return;
    }
    state.marks.forEach(function (seq) {
      var cue = state.audio.cues.filter(function (c) { return c.sequence === seq; })[0];
      if (!cue) return;
      var li = document.createElement('li');
      var b = document.createElement('button');
      b.type = 'button';
      b.textContent = '⚑ ' + (cue.text.length > 58 ? cue.text.slice(0, 58) + '…' : cue.text);
      b.setAttribute('dir', 'auto');
      b.addEventListener('click', function () { seekToCue(state.audio.cues.indexOf(cue)); });
      var x = document.createElement('button');
      x.type = 'button'; x.className = 'drop'; x.textContent = '×';
      x.setAttribute('aria-label', T.removeBookmark);
      x.addEventListener('click', function () { toggleMark(seq); renderTranscript(); });
      li.appendChild(b); li.appendChild(x);
      ul.appendChild(li);
    });
  }

  function renderTargets(targets) {
    var box = $('#targets');
    if (!box) return;
    if (!targets || !targets.length) { box.textContent = T.noTargets; return; }
    box.innerHTML = '';
    targets.forEach(function (t) {
      var d = document.createElement('div');
      d.className = 'target';
      d.innerHTML =
        '<span class="target__focus"></span>' +
        '<p class="target__t"></p><p class="target__e"></p><p class="target__g"></p>';
      // The focus is a phonetic category name from the curriculum.
      $('.target__focus', d).textContent = t.focus.replace(/_/g, ' ');
      $('.target__focus', d).setAttribute('dir', 'auto');
      $('.target__t', d).textContent = t.target;
      $('.target__e', d).textContent = '“' + t.example + '”';
      $('.target__e', d).setAttribute('dir', 'auto');
      $('.target__t', d).setAttribute('dir', 'auto');
      $('.target__g', d).textContent = t.guidance || '';
      $('.target__g', d).setAttribute('dir', 'auto');
      box.appendChild(d);
    });
  }

  function renderQuestions(questions) {
    var box = $('#questions');
    box.innerHTML = '';
    questions.forEach(function (q, qi) {
      var wrap = document.createElement('fieldset');
      wrap.className = 'q';
      wrap.dataset.qid = q.id;
      // The question is the curriculum's English, and the number is
      // part of the same run: without dir="auto" an Arabic page pushes
      // "1." to the far end of the line, away from the question it
      // numbers.
      var lg = document.createElement('legend');
      lg.className = 'q__p';
      lg.textContent = (qi + 1) + '. ' + q.prompt;
      lg.setAttribute('dir', 'auto');
      wrap.appendChild(lg);

      var opts = document.createElement('div');
      opts.className = 'q__opts';
      q.choices.forEach(function (c, ci) {
        var lab = document.createElement('label');
        lab.className = 'opt';
        var input = document.createElement('input');
        input.type = 'radio'; input.name = q.id; input.value = String(ci);
        var span = document.createElement('span');
        span.textContent = c;
        span.setAttribute('dir', 'auto');
        lab.appendChild(input); lab.appendChild(span);
        opts.appendChild(lab);
      });
      wrap.appendChild(opts);

      // The cue anchor: replay exactly the line this question tests.
      if (q.audioCueId) {
        var idx = -1;
        state.audio.cues.forEach(function (c, i) { if (c.id === q.audioCueId) idx = i; });
        if (idx >= 0) {
          var r = document.createElement('button');
          r.type = 'button'; r.className = 'q__replay';
          r.textContent = state.audio.isRecorded ? T.replayLine : T.showLine;
          r.addEventListener('click', function () { seekToCue(idx); });
          wrap.appendChild(r);
        }
      }
      box.appendChild(wrap);
    });
  }

  function renderTakes() {
    var ul = $('#takes');
    ul.innerHTML = '';
    if (!state.takes.length) {
      var li = document.createElement('li');
      li.className = 'drop';
      li.style.color = 'var(--ink-soft)';
      li.textContent = T.noTakes;
      ul.appendChild(li);
      return;
    }
    state.takes.forEach(function (t) {
      var li = document.createElement('li');
      var n = document.createElement('span');
      // A take being uploaded has no attempt number yet — the server
      // assigns it. "Take null" would be worse than saying so.
      n.className = 'n'; n.textContent = t.attempt ? T.takeN(t.attempt) : T.newTake;
      li.appendChild(n);
      if (t.mediaUrl) {
        var a = document.createElement('audio');
        a.controls = true; a.src = t.mediaUrl; a.preload = 'none';
        li.appendChild(a);
      }
      var st = document.createElement('span');
      st.style.color = 'var(--ink-soft)'; st.style.fontSize = '.8rem';
      // Each state says exactly what is true of this take. "Not
      // uploaded" is the one that matters: the audio is playable right
      // now and will be gone on reload, and the learner has to know
      // that rather than assume it was saved.
      st.textContent = t.status === 'reviewed' ? T.takeStates.reviewed
        : t.status === 'uploading' ? T.takeStates.uploading
          : t.status === T.notUploaded ? T.takeStates.notUploaded
            : T.takeStates.awaiting;
      li.appendChild(st);

      (t.feedback || []).forEach(function (f) {
        var fb = document.createElement('div');
        fb.className = 'fb';
        var who = document.createElement('span');
        who.className = 'who';
        who.textContent = f.source === 'automated' ? T.automated : T.instructor;
        fb.appendChild(who);
        // A tutor's comment is written by a person, in whichever
        // language they teach in.
        if (f.comment) {
          var c = document.createElement('div');
          c.textContent = f.comment;
          c.setAttribute('dir', 'auto');
          fb.appendChild(c);
        }
        var dims = [[T.fbDims[0], f.intelligibility], [T.fbDims[1], f.wordStress],
                    [T.fbDims[2], f.sentenceStress], [T.fbDims[3], f.individualSounds],
                    [T.fbDims[4], f.fluency]]
                   .filter(function (d) { return d[1] !== null && d[1] !== undefined; });
        if (dims.length) {
          var s = document.createElement('div');
          s.className = 'scores';
          s.textContent = dims.map(function (d) { return d[0] + ' ' + Math.round(d[1] * 100) + '%'; }).join('   ');
          fb.appendChild(s);
        }
        li.appendChild(fb);
      });
      ul.appendChild(li);
    });
  }

  function renderProfile(p) {
    var box = $('#dims');
    box.innerHTML = '';
    var dims = T.dims;
    dims.forEach(function (d) {
      var v = p[d[0]];
      var row = document.createElement('div');
      row.className = 'dim' + (p.weakest === d[0] ? ' dim--weak' : '') + (v === null ? ' dim--none' : '');
      row.innerHTML = '<span class="dim__n"></span><span class="dim__bar"><i></i></span><span class="dim__v"></span>';
      $('.dim__n', row).textContent = d[1];
      // Not yet assessed is shown as such. A 0% bar would be a lie.
      $('.dim__v', row).textContent = v === null ? T.notYetAssessed : Math.round(v * 100) + '%';
      box.appendChild(row);
      requestAnimationFrame(function () { $('.dim__bar i', row).style.width = v === null ? '0%' : (v * 100) + '%'; });
    });
    $('#profileMeta').textContent = p.reviewedRecordings
      ? T.reviewedCount(p.reviewedRecordings)
      : T.noneReviewed;
  }

  // ---- Transport -------------------------------------------------------
  function wireTransport() {
    var play = $('#play'), back = $('#back'), fwd = $('#fwd'),
        ab = $('#ab'), loop = $('#loop'), speed = $('#speed'), time = $('#time');
    var recorded = state.audio.isRecorded;

    [play, back, fwd, ab, loop].forEach(function (b) { if (b) b.disabled = !recorded; });
    if (speed) speed.disabled = !recorded;
    if (!recorded) { time.textContent = T.scriptOnly; return; }

    play.addEventListener('click', function () {
      if (state.el.paused) state.el.play(); else state.el.pause();
    });
    back.addEventListener('click', function () { state.el.currentTime = Math.max(0, state.el.currentTime - 5); });
    fwd.addEventListener('click', function () { state.el.currentTime = state.el.currentTime + 5; });
    speed.addEventListener('change', function () { state.el.playbackRate = Number(speed.value); });

    // A-B repeat: press once to set A at the current position, again to
    // set B and start looping, a third time to clear.
    ab.addEventListener('click', function () {
      var now = state.el.currentTime * 1000;
      if (!state.region) {
        state.region = { startMs: now, endMs: null };
        ab.setAttribute('aria-pressed', 'true'); ab.textContent = T.setB;
      } else if (state.region.endMs === null) {
        state.region.endMs = Math.max(now, state.region.startMs + 400);
        ab.textContent = T.clearAB;
        drawRegion();
      } else {
        state.region = null;
        ab.setAttribute('aria-pressed', 'false'); ab.textContent = T.setAB;
        drawRegion();
      }
    });
    loop.addEventListener('click', function () {
      var on = loop.getAttribute('aria-pressed') !== 'true';
      loop.setAttribute('aria-pressed', on ? 'true' : 'false');
    });

    state.el.addEventListener('play', function () { play.textContent = T.pause; });
    state.el.addEventListener('pause', function () { play.textContent = T.play; });
    state.el.addEventListener('timeupdate', function () {
      var ms = state.el.currentTime * 1000;
      if (state.region && state.region.endMs !== null && ms >= state.region.endMs) {
        state.el.currentTime = state.region.startMs / 1000;
      }
      var idx = cueAt(ms);
      if (idx >= 0) setActiveCue(idx);
      time.textContent = fmt(ms) + ' / ' + fmt((state.el.duration || 0) * 1000);
      $('#playhead').style.left = ((state.el.currentTime / (state.el.duration || 1)) * 100) + '%';
      if (state.peaks) drawWave($('#waveCanvas'), state.peaks, state.el.currentTime / (state.el.duration || 1));
    });
    state.el.addEventListener('ended', function () {
      if (loop.getAttribute('aria-pressed') === 'true') { state.el.currentTime = 0; state.el.play(); }
    });

    $('#wave').addEventListener('click', function (ev) {
      var r = this.getBoundingClientRect();
      state.el.currentTime = ((ev.clientX - r.left) / r.width) * (state.el.duration || 0);
    });
  }

  function drawRegion() {
    var el = $('#region');
    if (!state.region || state.region.endMs === null || !state.el || !state.el.duration) { el.hidden = true; return; }
    var dur = state.el.duration * 1000;
    el.hidden = false;
    el.style.left = (state.region.startMs / dur * 100) + '%';
    el.style.width = ((state.region.endMs - state.region.startMs) / dur * 100) + '%';
  }

  // ---- Recording -------------------------------------------------------
  function wireRecorder() {
    var btn = $('#rec'), meter = $('#recMeter i'), t = $('#recTime');
    if (!navigator.mediaDevices || !window.MediaRecorder) {
      btn.disabled = true;
      btn.textContent = T.recUnsupported;
      $('#recNote').textContent = T.recUnsupportedNote;
      return;
    }
    btn.addEventListener('click', function () {
      if (state.recorder && state.recorder.state === 'recording') { stopRec(); return; }
      navigator.mediaDevices.getUserMedia({ audio: true }).then(function (stream) {
        state.chunks = [];
        state.recorder = new MediaRecorder(stream);
        state.recorder.ondataavailable = function (e) { if (e.data.size) state.chunks.push(e.data); };
        state.recorder.onstop = function () {
          stream.getTracks().forEach(function (tr) { tr.stop(); });
          var blob = new Blob(state.chunks, { type: state.recorder.mimeType || 'audio/webm' });
          submitTake(blob, Date.now() - state.recStart);
        };
        state.recorder.start();
        state.recStart = Date.now();
        btn.textContent = T.stop;
        btn.setAttribute('aria-pressed', 'true');

        // Level meter from a real analyser, so the learner can see they
        // are actually being picked up before they commit a take.
        try {
          var ctx = new (window.AudioContext || window.webkitAudioContext)();
          var src = ctx.createMediaStreamSource(stream);
          var an = ctx.createAnalyser(); an.fftSize = 512;
          src.connect(an);
          var buf = new Uint8Array(an.frequencyBinCount);
          (function tick() {
            an.getByteTimeDomainData(buf);
            var peak = 0;
            for (var i = 0; i < buf.length; i++) peak = Math.max(peak, Math.abs(buf[i] - 128) / 128);
            meter.style.width = Math.min(100, peak * 160) + '%';
            state.meterRaf = requestAnimationFrame(tick);
          })();
        } catch (e) { /* meter is a nicety; recording proceeds without it */ }

        state.recTimer = setInterval(function () { t.textContent = fmt(Date.now() - state.recStart); }, 200);
      }).catch(function () {
        $('#recNote').textContent = T.micRefused;
      });
    });

    function stopRec() {
      if (state.recorder && state.recorder.state === 'recording') state.recorder.stop();
      clearInterval(state.recTimer);
      cancelAnimationFrame(state.meterRaf);
      meter.style.width = '0%';
      btn.textContent = T.record;
      btn.setAttribute('aria-pressed', 'false');
    }
  }

  // Uploads the take in parts and only then calls it saved.
  //
  // The local object URL is still created immediately, because a learner
  // wants to hear what they just said without waiting for a network
  // round trip. But it is playback only — the take is not reported as
  // "sent for review" until the bytes are committed server-side, which
  // is the distinction the previous version could not make.
  //
  // Failure is where the care goes. A dropped upload leaves the local
  // audio playable and says the take is on this device only, rather
  // than claiming a save that did not happen. Retry resumes from the
  // parts the server already holds.
  function submitTake(blob, durationMs) {
    var localUrl = URL.createObjectURL(blob);
    var note = $('#recNote');
    var take = { attempt: null, mediaUrl: localUrl, status: 'uploading', local: true, feedback: [] };
    state.takes.unshift(take);
    renderTakes();
    note.textContent = T.uploading;

    uploadRecording(blob, durationMs, function (sent, total) {
      note.textContent = T.uploadingPct(Math.round((sent / total) * 100));
    }).then(function (res) {
      take.attempt = res.attempt;
      take.status = res.status;
      take.local = false;
      // Play back from the server from now on, so the take survives a
      // reload and plays on the learner's other devices.
      take.mediaUrl = res.mediaUrl;
      renderTakes();
      note.textContent = T.uploaded(res.attempt);
    }).catch(function (err) {
      take.status = T.notUploaded;
      renderTakes();
      note.textContent = err.status === 401 ? T.signInToSave : T.uploadFailed(err.message);
    });
  }

  // Resumable multipart upload. The server decides the part size and
  // tells us which parts it already holds, so a retry never re-sends
  // what landed.
  function uploadRecording(blob, durationMs, onProgress) {
    var recordingId, partSize;
    return api('/api/lms/recording/init', {
      method: 'POST',
      body: JSON.stringify({
        learningItemId: state.item.id,
        contentType: blob.type || 'audio/webm',
        declaredBytes: blob.size,
        durationMs: durationMs,
      }),
    }).then(function (init) {
      recordingId = init.recordingId;
      partSize = init.partSize;
      var already = {};
      (init.uploadedParts || []).forEach(function (n) { already[n] = true; });
      var total = Math.max(1, Math.ceil(blob.size / partSize));

      // Sequential, not parallel: a learner on a weak connection is
      // better served by one part at a time completing reliably than by
      // several competing for the same narrow pipe.
      var chain = Promise.resolve();
      for (var n = 1; n <= total; n++) {
        (function (part) {
          chain = chain.then(function () {
            if (already[part]) return null;
            var slice = blob.slice((part - 1) * partSize, part * partSize);
            return window.WEC_LC_apiAuth.headers({ 'Content-Type': 'application/octet-stream' })
              .then(function (headers) {
                return fetch('/api/lms/recording/part?id=' + encodeURIComponent(recordingId) + '&part=' + part, {
                  method: 'PUT', headers: headers, body: slice,
                });
              })
              .then(function (r) {
                if (!r.ok) {
                  return r.json().catch(function () { return {}; }).then(function (b) {
                    throw Object.assign(new Error(b.message || r.statusText), { status: r.status });
                  });
                }
                if (onProgress) onProgress(Math.min(blob.size, part * partSize), blob.size);
              });
          });
        })(n);
      }
      return chain;
    }).then(function () {
      return api('/api/lms/recording/complete', {
        method: 'POST',
        body: JSON.stringify({ recordingId: recordingId, durationMs: durationMs }),
      });
    });
  }

  // ---- Comprehension ---------------------------------------------------
  //
  // Bring the result into view. On a phone the result box sits below a
  // full screen of questions, so a learner tapped Submit, got a correct
  // and correctly-graded answer, and saw absolutely nothing happen —
  // found by someone using the real site on a real phone, having passed
  // every desktop test, where the box happens to be on screen already.
  //
  // `role="status"` already announced it to a screen reader. Sighted
  // mobile users got silence. An announcement only some users receive
  // is not feedback.
  function showResult() {
    var el = $('#quizResult');
    if (!el) return;
    var reduced = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    // Nearest, not centre: the last questions stay visible above the
    // result, which is what a learner wants when the message says to go
    // back to the lines they missed.
    try { el.scrollIntoView({ behavior: reduced ? 'auto' : 'smooth', block: 'nearest' }); }
    catch (e) { el.scrollIntoView(); }   // older Safari: no options object
  }

  function wireQuiz(questions) {
    $('#submitQuiz').addEventListener('click', function () {
      var answers = questions.map(function (q) {
        var picked = document.querySelector('input[name="' + q.id + '"]:checked');
        return picked ? Number(picked.value) : -1;
      });
      if (answers.indexOf(-1) >= 0) {
        var qr = $('#quizResult');
        qr.textContent = '';
        var lead0 = document.createElement('strong');
        lead0.textContent = T.answerAllLead;
        qr.appendChild(lead0);
        qr.appendChild(document.createTextNode(
          T.answerAllRest(answers.filter(function (a) { return a === -1; }).length)));
        showResult();
        return;
      }
      $('#quizResult').textContent = T.marking;
      api('/api/lms/quiz-attempt', {
        method: 'POST',
        body: JSON.stringify({ learningItemId: state.item.id, answers: answers }),
      }).then(function (res) {
        var pct = Math.round(res.score * 100);
        var qr2 = $('#quizResult');
        qr2.textContent = '';
        var score = document.createElement('strong');
        score.textContent = pct + '%';
        qr2.appendChild(score);
        qr2.appendChild(document.createTextNode(
          ' — ' + (res.passed ? T.passed : T.notPassed) + T.quizRest));
        showResult();
      }).catch(function (err) {
        $('#quizResult').textContent = T.couldNotSubmit(err.message);
        showResult();
      });
    });
  }

  // ---- Notes -----------------------------------------------------------
  function wireNotes() {
    var ta = $('#notes'), saved = $('#notesSaved'), timer = null;
    ta.value = load('notes', '');
    ta.addEventListener('input', function () {
      clearTimeout(timer);
      saved.textContent = T.unsaved;
      timer = setTimeout(function () {
        saved.textContent = save('notes', ta.value) ? T.savedHere : T.couldNotSave;
      }, 450);
    });
    saved.textContent = ta.value ? T.savedHere : T.notesPrivate;
  }

  // ---- Keyboard --------------------------------------------------------
  function wireKeys() {
    document.addEventListener('keydown', function (ev) {
      var tag = (ev.target.tagName || '').toLowerCase();
      if (tag === 'input' || tag === 'textarea' || tag === 'select') return;
      if (!state.el) return;
      if (ev.key === ' ') { ev.preventDefault(); if (state.el.paused) state.el.play(); else state.el.pause(); }
      if (ev.key === 'ArrowLeft') { ev.preventDefault(); state.el.currentTime = Math.max(0, state.el.currentTime - 5); }
      if (ev.key === 'ArrowRight') { ev.preventDefault(); state.el.currentTime += 5; }
    });
  }

  // ---- Offline download management --------------------------------------
  // Audio is the only heavy asset in the Lab, and a large share of an
  // international student body is on metered or intermittent
  // connections. So audio is NEVER cached implicitly — the learner opts
  // in per recording, and can drop it again to reclaim the space.
  function wireDownload() {
    var btn = $('#dl'), state = $('#dlState');
    if (!btn || !state) return;

    if (!('serviceWorker' in navigator)) {
      btn.disabled = true;
      state.textContent = T.noOfflineStorage;
      return;
    }

    function refresh() {
      var url = state.dataset.url;
      // Script mode: there is no file yet. Saying so is more useful than
      // a disabled button with no explanation.
      if (!url) {
        btn.disabled = true;
        state.dataset.on = 'false';
        state.textContent = T.nothingToDownload;
        return;
      }
      btn.disabled = false;
      navigator.serviceWorker.ready.then(function (reg) {
        if (!reg.active) return;
        var onMsg = function (ev) {
          if (!ev.data || ev.data.type !== 'AUDIO_STATUS') return;
          navigator.serviceWorker.removeEventListener('message', onMsg);
          var held = ev.data.urls.some(function (u) { return u.indexOf(url) >= 0 || url.indexOf(u) >= 0; });
          state.dataset.on = held ? 'true' : 'false';
          state.textContent = held ? T.availableOffline : T.notDownloaded;
          btn.setAttribute('aria-pressed', held ? 'true' : 'false');
          btn.textContent = held ? T.removeDownload : T.keepOffline;
        };
        navigator.serviceWorker.addEventListener('message', onMsg);
        reg.active.postMessage({ type: 'AUDIO_STATUS' });
      });
    }

    btn.addEventListener('click', function () {
      var url = state.dataset.url;
      if (!url) return;
      var held = btn.getAttribute('aria-pressed') === 'true';
      state.textContent = held ? 'removing…' : 'downloading…';
      navigator.serviceWorker.ready.then(function (reg) {
        var onMsg = function (ev) {
          if (!ev.data || (ev.data.type !== 'AUDIO_CACHED' && ev.data.type !== 'AUDIO_DROPPED')) return;
          navigator.serviceWorker.removeEventListener('message', onMsg);
          if (ev.data.type === 'AUDIO_CACHED' && !ev.data.ok) {
            state.textContent = T.downloadFailed;
            return;
          }
          refresh();
        };
        navigator.serviceWorker.addEventListener('message', onMsg);
        reg.active.postMessage({ type: held ? 'DROP_AUDIO' : 'CACHE_AUDIO', url: url });
      });
    });

    refresh();
  }

  // ---- Listening progress -----------------------------------------------
  function renderAnalytics(a) {
    var sum = $('#lpSummary');
    sum.innerHTML = '';
    [[a.attempted + ' / ' + a.totalListenings, T.lpSummary[0]],
     [a.averageBest === null ? '—' : Math.round(a.averageBest * 100) + '%', T.lpSummary[1]],
     [String(a.recordingsMade), T.lpSummary[2]]].forEach(function (pair) {
      var d = document.createElement('div');
      d.innerHTML = '<b></b><span></span>';
      $('b', d).textContent = pair[0];
      $('span', d).textContent = pair[1];
      sum.appendChild(d);
    });

    var box = $('#lpModules');
    box.innerHTML = '';
    a.modules.forEach(function (m) {
      var row = document.createElement('div');
      row.className = 'prog__row';
      row.innerHTML = '<span class="prog__n"></span><span class="prog__bar"><i></i></span><span class="prog__v"></span>';
      $('.prog__n', row).textContent = T.moduleShort(m.moduleSeq);
      var none = m.bestScore === null;
      $('.prog__v', row).textContent = none ? T.notAttempted : Math.round(m.bestScore * 100) + '%';
      $('.prog__v', row).dataset.none = none ? 'true' : 'false';
      row.title = m.title + (m.recordings ? T.recordingsSuffix(m.recordings) : '');
      box.appendChild(row);
      requestAnimationFrame(function () {
        $('.prog__bar i', row).style.width = none ? '0%' : (m.bestScore * 100) + '%';
      });
    });
    $('#lpMeta').textContent = a.attempted
      ? T.attemptedOf(a.attempted, a.totalListenings)
      : T.nothingAttempted;
  }

  // ---- Boot ------------------------------------------------------------
  function boot() {
    var params = new URLSearchParams(location.search);
    var unitId = params.get('unit');
    var itemId = params.get('item');
    if (!unitId) { $('#labError').textContent = T.noUnit; return; }

    // Start measuring. This is the College's measured-hours commitment
    // in practice (docs/academic-framework.md § I) — it begins the
    // moment a learner opens a module, and every session that happens
    // before it is instrumented is one the measurement can never
    // recover.
    if (window.WEC_LC_timeOnTask) window.WEC_LC_timeOnTask.start(unitId);

    api('/api/lms/unit?id=' + encodeURIComponent(unitId)).then(function (unit) {
      var item = itemId
        ? unit.items.filter(function (i) { return i.id === itemId; })[0]
        : unit.items.filter(function (i) { return i.kind === 'listening'; })[0];
      if (!item) throw new Error(T.noListening);
      var pron = unit.items.filter(function (i) { return i.kind === 'pronunciation'; })[0];

      state.item = item;
      state.audio = item.audio;
      state.marks = load('marks', []);
      state.takes = (item.myRecordings || []).map(function (r) { return r; });

      // The module's name, the listening's title and its objectives are
      // the curriculum's own English — the thing being listened to. They
      // take their own direction so an Arabic page lays them out as
      // English rather than reversing their punctuation.
      $('#labModule').textContent = unit.title;
      $('#labModule').setAttribute('dir', 'auto');
      $('#labTitle').textContent = item.title;
      $('#labTitle').setAttribute('dir', 'auto');
      $('#labVariety').textContent = T.varieties[state.audio.variety] || state.audio.variety || '';
      $('#labWpm').textContent = state.audio.targetWpm ? T.wpm(state.audio.targetWpm) : '';
      $('#labSub').textContent = (item.body || '').split('\n')[0].replace(/^LISTENING OBJECTIVES:\s*/, '');
      $('#labSub').setAttribute('dir', 'auto');

      renderStatus();
      renderTranscript();
      renderMarks();
      renderQuestions(item.questions || []);
      renderTakes();
      if (pron) {
        renderTargets(pron.targets);
        $('#pronTitle').textContent = pron.title;
        $('#pronTitle').setAttribute('dir', 'auto');
      }

      // Waveform: real peaks when there is audio, structural peaks when
      // there is only a script.
      var canvas = $('#waveCanvas');
      if (state.audio.isRecorded) {
        state.el = new Audio(state.audio.mediaUrl);
        state.el.preload = 'metadata';
        fetch(state.audio.mediaUrl).then(function (r) { return r.arrayBuffer(); })
          .then(function (buf) { return new (window.AudioContext || window.webkitAudioContext)().decodeAudioData(buf); })
          .then(function (decoded) {
            state.peaks = peaksFromBuffer(decoded, 220);
            drawWave(canvas, state.peaks, 0);
          })
          .catch(function () {
            state.peaks = peaksFromCues(state.audio.cues, 220);
            drawWave(canvas, state.peaks, 0);
          });
      } else {
        $('#wave').setAttribute('aria-disabled', 'true');
        state.peaks = peaksFromCues(state.audio.cues, 220);
        drawWave(canvas, state.peaks, 0);
        $('#playhead').hidden = true;
      }

      wireTransport(); wireRecorder(); wireNotes(); wireKeys();
      wireQuiz(item.questions || []);
      window.addEventListener('resize', function () {
        if (state.peaks) drawWave(canvas, state.peaks, state.el && state.el.duration ? state.el.currentTime / state.el.duration : 0);
      });

      // Tell the download control which file it governs (empty in script mode).
      var dlState = $('#dlState');
      if (dlState) dlState.dataset.url = state.audio.mediaUrl || '';
      wireDownload();

      var lvl = params.get('level');
      if (lvl) {
        api('/api/lms/listening-analytics?levelId=' + encodeURIComponent(lvl))
          .then(renderAnalytics)
          .catch(function () { $('#lpModules').textContent = T.progressUnavailable; });
      }
      api('/api/lms/pronunciation-profile' + (lvl ? '?levelId=' + encodeURIComponent(lvl) : ''))
        .then(renderProfile)
        .catch(function () { $('#dims').textContent = T.profileUnavailable; });

      document.body.classList.add('is-ready');
    }).catch(function (err) {
      $('#labError').textContent = err.status === 401
        ? T.signInToOpen
        : T.couldNotLoad(err.message);
    });
  }

  // Offline awareness — the lab keeps working from cached content and
  // localStorage; only submission needs the network, so we say which.
  function wireOffline() {
    function update() { document.body.classList.toggle('is-offline', !navigator.onLine); }
    window.addEventListener('online', update);
    window.addEventListener('offline', update);
    update();
  }

  // Register the offline worker. Failure is non-fatal: the Lab works
  // fully online without it, so a registration error must never block
  // the page.
  if ('serviceWorker' in navigator) {
    window.addEventListener('load', function () {
      navigator.serviceWorker.register('/sw-lab.js').catch(function () {});
    });
  }

  // Start behind the shared portal guard when a Clerk key is
  // configured, so a real session exists (and api-auth.js can mint
  // tokens from it) before the first API call. With no key — the
  // shipped default and the state the local harness runs in — the
  // guard does nothing and the page boots straight away.
  function start() {
    wireOffline();
    var guarded = window.WEC_LC_guardPortal({
      signOutRedirect: '/student-portal/',
      shellSelector: '.lab-body',
      onAuthenticated: function (clerk, done) {
        window.WEC_LC_apiAuth.attach(clerk);
        done();
        boot();
      },
      // Offline: Clerk's SDK is unreachable, so no session can be
      // established. Boot anyway — the offline worker holds this
      // learner's cached unit content, and the whole point of the
      // offline mode is that a dropped connection doesn't end the
      // lesson. Anything needing the network fails visibly, as it
      // already does when the connection drops mid-session.
      onAuthUnavailable: function () { boot(); },
    });
    if (!guarded) boot();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', start);
  } else { start(); }

  // Exposed for the browser test harness only.
  window.__lab = state;
})();
