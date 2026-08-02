# WEC-LC — Audio Platform Architecture & Extension Points

*How the Listening Lab is built, and how each named future capability
attaches to it without redesign. Companion to
`docs/lms-architecture.md` § The audio layer.*

---

## 1. What exists today

| Layer | Where | State |
|---|---|---|
| Schema | `sql/schema.sql` — `audio_assets`, `audio_cues`, `pronunciation_targets`, `learner_recordings`, `pronunciation_feedback` | complete |
| Logic | `functions/_lib/lms/content.js` | complete |
| API | `functions/api/lms/{audio,recording,recording-review,review-queue,listening-analytics,pronunciation-profile}.js` | complete |
| Learner UI | `listening-lab.html`, `js/listening-lab.js`, `css/listening-lab.css` | complete |
| Staff UI | `instructor-review.html`, `js/instructor-review.js` | complete |
| Offline | `sw-lab.js` | complete |
| Content | 60 listening scripts, 497 cues, 240 questions, 180 targets | complete |
| **Recordings** | — | **not produced** |

The last row is the only gap, and it is a studio task, not an
engineering one.

---

## 2. The three decisions everything else rests on

**(a) The script is the asset; the recording is an attachment.**
`audio_assets.transcript` is `NOT NULL`; `media_url`, `duration_ms` and
every cue timing are nullable. A listening lesson is therefore complete
and teachable the moment it is written. Adding narration later is:

```sql
UPDATE audio_assets SET media_url = ?, duration_ms = ? WHERE id = ?;
UPDATE audio_cues   SET start_ms = ?, end_ms = ?       WHERE id = ?;
```

No schema change, no code change, no content change. `getAudioAsset()`
computes `isRecorded` and `isSynchronised` from those columns, and the
Lab switches from script mode to full playback by reading those two
booleans. This is the single most important property of the design and
every extension below preserves it.

**(b) Assessment reuses one scoring path.** A listening item carries its
own `quiz_questions`, so `submitQuizAttempt()` grades listening with no
second implementation. Anything that needs scoring — a certification
paper, a placement test — should reuse it rather than fork it.

**(c) Feedback has a `source` column from day one.**
`pronunciation_feedback.source ∈ {instructor, automated}` with a
nullable `reviewer_id`. Automated analysis writes *alongside* human
review, never instead of it. That single column is what makes the whole
AI roadmap additive.

---

## 3. Extension points, per named capability

Each entry states the attachment point, what is needed, and honestly
whether the existing schema suffices.

### 3.1 AI pronunciation assessment
**Attaches to:** `pronunciation_feedback` with `source='automated'`.
**Needed:** a scoring service and a queue worker; nothing else.
`reviewRecording()` already accepts `source: 'automated'` with a null
reviewer and validates the five sub-scores. The learner UI already
labels automated feedback distinctly from instructor feedback.
**Schema change: none.**

The one design rule to hold: automated scores must never overwrite or
suppress an instructor row. Both are rows; a learner sees both; a
disagreement between them is information, not a conflict to resolve.

### 3.2 Instructor annotation on waveform / transcript
**Attaches to:** a new `feedback_anchors` table —
`(id, feedback_id, audio_cue_id, start_ms, end_ms, note)`.
**Why it is not a schema change to existing tables:** `audio_cues`
already gives every transcript segment a stable id, and
`quiz_questions.audio_cue_id` already proves the anchoring pattern
works end to end (the Lab's "replay the line this tests" uses it).
An annotation is the same idea pointed at a feedback row instead of a
question.
**Schema change: one additive table.** No existing column moves.

### 3.3 Conversational speaking practice
**Attaches to:** `learner_recordings` (turn) + `audio_assets` (prompt).
A conversation is a sequence of prompt/response pairs, which is what
these two tables already hold. What is genuinely missing is a
`conversation_sessions` table to group turns and hold the branching
state.
**Schema change: one additive table plus a nullable `session_id` on
`learner_recordings`.** Honest note: turn-taking latency and
barge-in are hard *product* problems that no schema solves.

### 3.4 Live speaking rooms
**Attaches to:** the existing `live_sessions` table, which already
carries `level_id`, `unit_id`, host, time and `join_url`.
**Needed:** a real-time provider. `docs/lms-architecture.md` records the
decision to use external join-links rather than custom WebRTC, and that
still holds — a speaking room is a `live_sessions` row with a different
`join_url`.
**Schema change: none** for scheduling. Recording a room for later
review would reuse `audio_assets` with `kind='listening'`.

### 3.5 Peer speaking review
**Attaches to:** `pronunciation_feedback`.
**Needed:** `source='peer'` added to the CHECK constraint, and an
authorisation rule deciding who may review whom.
**Schema change: one CHECK constraint widened.** The five sub-scores,
the optional spoken-feedback asset and the rendering all work as-is.
The hard part is policy, not structure: peer feedback needs moderation
before it reaches a learner, which is what `instructor-review.html`'s
queue pattern is already shaped for.

### 3.6 Certification speaking examinations
**Attaches to:** `learning_items` (`kind='pronunciation'`), scored
through `pronunciation_feedback`, gated by `unit_progress`.
**Needed:** an exam-session concept (fixed prompts, one attempt,
timed) and a second-marker rule. The `attempt` column on
`learner_recordings` already models attempt limits; enforcing "one" is
a policy check, not a new table.
**Schema change: likely one `exam_sessions` table.** The
double-marking requirement is satisfied by two `pronunciation_feedback`
rows with different `reviewer_id`s — the model already permits it.

### 3.7 Multilingual interface
**Attaches to:** the UI layer only. Curriculum content stays in English
by definition — it is an English course.
**Needed:** extraction of UI strings from `listening-lab.html` and
`js/listening-lab.js`, plus `users.preferred_language`, which
**already exists** and is already returned by `/api/auth/me`.
**Schema change: none.** Honest note: the Lab's current markup has
strings inline, so this is real front-end work; `dir="ltr"` is already
explicit on both pages, which is the part that is expensive to
retrofit later.

---

## 4. What the architecture deliberately does not yet do

Stated so these are visible gaps rather than assumed capabilities.

- **Object storage for learner recordings.** Takes are held as blob
  object URLs in the browser and registered server-side with their
  duration and attempt number. The bytes do not reach a server. The Lab
  says "saved and sent for review" only after the row is created, and
  the instructor queue shows the item — but on a different device the
  audio will not play. **This is the largest remaining gap in the audio
  platform** and it blocks 3.1, 3.5 and 3.6 in production.
- **Background sync of offline submissions.** `sw-lab.js` deliberately
  never caches mutations. A queued-submission outbox needs durable
  storage and conflict rules; a half-built version would silently drop
  a learner's work. The Lab reports offline state instead.
- **Cue timings.** No recording exists, so no cue is timed. The
  synchronisation engine is written and drives highlighting from
  `timeupdate`; it has been exercised against seeded cue data but not
  against real timed audio.
- **Automated speech scoring.** The `source` column exists; no scorer
  does.

---

## 5. Rules for anyone extending this

1. **Never make `media_url` required.** The entire design rests on a
   script being usable without a recording.
2. **Never overwrite feedback.** Add rows. A learner's fifth take
   sitting beside their first is the product.
3. **Never cache a mutation.** A cached success for an ungraded
   submission is a lie the learner acts on.
4. **Never report an unassessed dimension as zero.** `null` and `0`
   are different facts; the profile and the progress panel both
   already distinguish them.
5. **Reuse `submitQuizAttempt()`.** One scoring path, server-side,
   answer key never sent to a client.
6. **Keep the reduced-motion still state explicit.** Every animated
   element has a defined resting appearance so nothing depends on a
   transition having run.

---

## 6. Verification

`tests/browser/listening-lab.mjs` — 40 assertions, run against real
seeded curriculum through the real `content.js`. Covers both rendering
modes, transcript interaction, persistence across reload, server-side
grading with no answer-key leakage, the progress panel's null handling,
download management in script mode, the instructor queue, and a real
review clearing an item. Screenshots are written to
`tests/browser/screenshots/` for human review.

`tests/curriculum-consistency.test.mjs` covers the content side —
including that every audio asset has a real transcript and a consistent
recording state, so a URL without a duration cannot be committed.
