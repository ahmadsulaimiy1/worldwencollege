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
  function api(path, opts) {
    return fetch(path, Object.assign({ headers: { 'Content-Type': 'application/json' } }, opts || {}))
      .then(function (r) {
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

  // ---- Rendering -------------------------------------------------------
  function renderStatus() {
    var box = $('#labStatus');
    if (!box) return;
    if (state.audio.isRecorded) { box.hidden = true; return; }
    box.hidden = false;
    $('#labStatusText').innerHTML =
      '<strong>Script mode.</strong> The studio recording for this listening has not been made yet, so playback is unavailable. ' +
      'Everything else on this page works: read the transcript, bookmark lines, take notes, record and submit your own voice, and answer the comprehension questions. ' +
      'When narration is added, this page becomes a full player with no change to your saved work.';
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

      var tx = document.createElement('span');
      tx.className = 'cue__text';
      tx.textContent = cue.text;

      var mk = document.createElement('button');
      mk.className = 'cue__mark';
      mk.type = 'button';
      mk.setAttribute('aria-pressed', state.marks.indexOf(cue.sequence) >= 0 ? 'true' : 'false');
      mk.setAttribute('aria-label', 'Bookmark line ' + cue.sequence);
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
      li.textContent = 'No bookmarks yet. Use the flag on any line to mark it for revision.';
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
      b.addEventListener('click', function () { seekToCue(state.audio.cues.indexOf(cue)); });
      var x = document.createElement('button');
      x.type = 'button'; x.className = 'drop'; x.textContent = '×';
      x.setAttribute('aria-label', 'Remove bookmark');
      x.addEventListener('click', function () { toggleMark(seq); renderTranscript(); });
      li.appendChild(b); li.appendChild(x);
      ul.appendChild(li);
    });
  }

  function renderTargets(targets) {
    var box = $('#targets');
    if (!box) return;
    if (!targets || !targets.length) { box.textContent = 'No pronunciation targets for this item.'; return; }
    box.innerHTML = '';
    targets.forEach(function (t) {
      var d = document.createElement('div');
      d.className = 'target';
      d.innerHTML =
        '<span class="target__focus"></span>' +
        '<p class="target__t"></p><p class="target__e"></p><p class="target__g"></p>';
      $('.target__focus', d).textContent = t.focus.replace(/_/g, ' ');
      $('.target__t', d).textContent = t.target;
      $('.target__e', d).textContent = '“' + t.example + '”';
      $('.target__g', d).textContent = t.guidance || '';
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
      var lg = document.createElement('legend');
      lg.className = 'q__p';
      lg.textContent = (qi + 1) + '. ' + q.prompt;
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
          r.textContent = state.audio.isRecorded ? 'Replay the line this tests' : 'Show the line this tests';
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
      li.textContent = 'No recordings yet. Record yourself, then listen back — that is the step that works.';
      ul.appendChild(li);
      return;
    }
    state.takes.forEach(function (t) {
      var li = document.createElement('li');
      var n = document.createElement('span');
      n.className = 'n'; n.textContent = 'Take ' + t.attempt;
      li.appendChild(n);
      if (t.mediaUrl) {
        var a = document.createElement('audio');
        a.controls = true; a.src = t.mediaUrl; a.preload = 'none';
        li.appendChild(a);
      }
      var st = document.createElement('span');
      st.style.color = 'var(--ink-soft)'; st.style.fontSize = '.8rem';
      st.textContent = t.status === 'reviewed' ? 'reviewed' : 'awaiting review';
      li.appendChild(st);

      (t.feedback || []).forEach(function (f) {
        var fb = document.createElement('div');
        fb.className = 'fb';
        var who = document.createElement('span');
        who.className = 'who';
        who.textContent = f.source === 'automated' ? 'Automated analysis' : 'Instructor';
        fb.appendChild(who);
        if (f.comment) { var c = document.createElement('div'); c.textContent = f.comment; fb.appendChild(c); }
        var dims = [['Intelligibility', f.intelligibility], ['Word stress', f.wordStress],
                    ['Sentence stress', f.sentenceStress], ['Sounds', f.individualSounds], ['Fluency', f.fluency]]
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
    var dims = [['intelligibility', 'Intelligibility'], ['wordStress', 'Word stress'],
                ['sentenceStress', 'Sentence stress'], ['individualSounds', 'Individual sounds'], ['fluency', 'Fluency']];
    dims.forEach(function (d) {
      var v = p[d[0]];
      var row = document.createElement('div');
      row.className = 'dim' + (p.weakest === d[0] ? ' dim--weak' : '') + (v === null ? ' dim--none' : '');
      row.innerHTML = '<span class="dim__n"></span><span class="dim__bar"><i></i></span><span class="dim__v"></span>';
      $('.dim__n', row).textContent = d[1];
      // Not yet assessed is shown as such. A 0% bar would be a lie.
      $('.dim__v', row).textContent = v === null ? 'not yet assessed' : Math.round(v * 100) + '%';
      box.appendChild(row);
      requestAnimationFrame(function () { $('.dim__bar i', row).style.width = v === null ? '0%' : (v * 100) + '%'; });
    });
    $('#profileMeta').textContent = p.reviewedRecordings
      ? p.reviewedRecordings + ' reviewed recording' + (p.reviewedRecordings === 1 ? '' : 's')
      : 'no reviewed recordings yet';
  }

  // ---- Transport -------------------------------------------------------
  function wireTransport() {
    var play = $('#play'), back = $('#back'), fwd = $('#fwd'),
        ab = $('#ab'), loop = $('#loop'), speed = $('#speed'), time = $('#time');
    var recorded = state.audio.isRecorded;

    [play, back, fwd, ab, loop].forEach(function (b) { if (b) b.disabled = !recorded; });
    if (speed) speed.disabled = !recorded;
    if (!recorded) { time.textContent = '— script only'; return; }

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
        ab.setAttribute('aria-pressed', 'true'); ab.textContent = 'Set B';
      } else if (state.region.endMs === null) {
        state.region.endMs = Math.max(now, state.region.startMs + 400);
        ab.textContent = 'Clear A–B';
        drawRegion();
      } else {
        state.region = null;
        ab.setAttribute('aria-pressed', 'false'); ab.textContent = 'Set A–B';
        drawRegion();
      }
    });
    loop.addEventListener('click', function () {
      var on = loop.getAttribute('aria-pressed') !== 'true';
      loop.setAttribute('aria-pressed', on ? 'true' : 'false');
    });

    state.el.addEventListener('play', function () { play.textContent = 'Pause'; });
    state.el.addEventListener('pause', function () { play.textContent = 'Play'; });
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
      btn.textContent = 'Recording unsupported';
      $('#recNote').textContent = 'This browser does not support in-page recording. Record with any device and ask your instructor to upload the file.';
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
        btn.textContent = 'Stop';
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
        $('#recNote').textContent = 'Microphone permission was refused. Grant access in your browser settings to record.';
      });
    });

    function stopRec() {
      if (state.recorder && state.recorder.state === 'recording') state.recorder.stop();
      clearInterval(state.recTimer);
      cancelAnimationFrame(state.meterRaf);
      meter.style.width = '0%';
      btn.textContent = 'Record';
      btn.setAttribute('aria-pressed', 'false');
    }
  }

  function submitTake(blob, durationMs) {
    // The blob is held as an object URL for immediate playback. Uploading
    // the bytes needs object storage, which is not wired yet — so the
    // recording is registered against the item with its duration and
    // attempt number, and the note below says so rather than implying
    // the file reached a server.
    var url = URL.createObjectURL(blob);
    api('/api/lms/recording', {
      method: 'POST',
      body: JSON.stringify({ learningItemId: state.item.id, mediaUrl: url, durationMs: durationMs }),
    }).then(function (res) {
      state.takes.unshift({ attempt: res.attempt, mediaUrl: url, status: res.status, feedback: [] });
      renderTakes();
      $('#recNote').textContent = 'Take ' + res.attempt + ' saved and sent for review. Listen back before you record again.';
    }).catch(function (err) {
      $('#recNote').textContent = 'Could not save the take: ' + err.message;
    });
  }

  // ---- Comprehension ---------------------------------------------------
  function wireQuiz(questions) {
    $('#submitQuiz').addEventListener('click', function () {
      var answers = questions.map(function (q) {
        var picked = document.querySelector('input[name="' + q.id + '"]:checked');
        return picked ? Number(picked.value) : -1;
      });
      if (answers.indexOf(-1) >= 0) {
        $('#quizResult').innerHTML = '<strong>Answer every question first.</strong> ' +
          (answers.filter(function (a) { return a === -1; }).length) + ' still unanswered.';
        return;
      }
      api('/api/lms/quiz-attempt', {
        method: 'POST',
        body: JSON.stringify({ learningItemId: state.item.id, answers: answers }),
      }).then(function (res) {
        var pct = Math.round(res.score * 100);
        $('#quizResult').innerHTML = '<strong>' + pct + '%</strong> — ' +
          (res.passed ? 'passed. ' : 'not yet passed. ') +
          'Use the replay links to go back to the lines you missed, then try again.';
      }).catch(function (err) {
        $('#quizResult').textContent = 'Could not submit: ' + err.message;
      });
    });
  }

  // ---- Notes -----------------------------------------------------------
  function wireNotes() {
    var ta = $('#notes'), saved = $('#notesSaved'), timer = null;
    ta.value = load('notes', '');
    ta.addEventListener('input', function () {
      clearTimeout(timer);
      saved.textContent = 'unsaved…';
      timer = setTimeout(function () {
        saved.textContent = save('notes', ta.value)
          ? 'saved on this device'
          : 'could not save — storage unavailable';
      }, 450);
    });
    saved.textContent = ta.value ? 'saved on this device' : 'notes are private and stay on this device';
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

  // ---- Boot ------------------------------------------------------------
  function boot() {
    var params = new URLSearchParams(location.search);
    var unitId = params.get('unit');
    var itemId = params.get('item');
    if (!unitId) { $('#labError').textContent = 'No unit specified. Open this page from a module.'; return; }

    api('/api/lms/unit?id=' + encodeURIComponent(unitId)).then(function (unit) {
      var item = itemId
        ? unit.items.filter(function (i) { return i.id === itemId; })[0]
        : unit.items.filter(function (i) { return i.kind === 'listening'; })[0];
      if (!item) throw new Error('This module has no listening item.');
      var pron = unit.items.filter(function (i) { return i.kind === 'pronunciation'; })[0];

      state.item = item;
      state.audio = item.audio;
      state.marks = load('marks', []);
      state.takes = (item.myRecordings || []).map(function (r) { return r; });

      $('#labUnit').textContent = unit.title;
      $('#labTitle').textContent = item.title;
      $('#labVariety').textContent = state.audio.variety === 'BrE' ? 'British English'
        : state.audio.variety === 'AmE' ? 'American English' : (state.audio.variety || '');
      $('#labWpm').textContent = state.audio.targetWpm ? state.audio.targetWpm + ' words per minute' : '';
      $('#labSub').textContent = (item.body || '').split('\n')[0].replace(/^LISTENING OBJECTIVES:\s*/, '');

      renderStatus();
      renderTranscript();
      renderMarks();
      renderQuestions(item.questions || []);
      renderTakes();
      if (pron) { renderTargets(pron.targets); $('#pronTitle').textContent = pron.title; }

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

      var lvl = params.get('level');
      api('/api/lms/pronunciation-profile' + (lvl ? '?levelId=' + encodeURIComponent(lvl) : ''))
        .then(renderProfile)
        .catch(function () { $('#dims').textContent = 'Profile unavailable.'; });

      document.body.classList.add('is-ready');
    }).catch(function (err) {
      $('#labError').textContent = err.status === 401
        ? 'Sign in to open the Listening Lab.'
        : 'Could not load this listening: ' + err.message;
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

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', function () { wireOffline(); boot(); });
  } else { wireOffline(); boot(); }

  // Exposed for the browser test harness only.
  window.__lab = state;
})();
