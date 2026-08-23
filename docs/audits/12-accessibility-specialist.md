# Audit 12 — An accessibility specialist

**Who I am.** I audit digital services against WCAG 2.2 AA for public
bodies and universities. I was asked to look at this without a formal
engagement, so this is a review and not an audit report — a distinction
the College itself is careful about, which is where I want to start.

---

## The claim, and why it is the right one

`/support/accessibility/` **claims no conformance level.**

It states what was built deliberately, what is known to be untested, and
what the College will do on request. It does not display a WCAG AA
badge.

This is the correct behaviour and it is rare. The overwhelming majority
of accessibility statements I read claim a conformance level nobody
audited, which is both a false statement and — in the jurisdictions that
regulate it — an actionable one. A smaller, true offer beats a
conformance badge, and the College reached that conclusion on its own.

---

## What I checked, and what holds

I ran the site through the checks I would start any engagement with.

**Structure.** One `h1` per page. A skip link that becomes visible on
focus and names what it skips to. A `<main>` landmark on every page.
These are the three things that fail most often and all three hold.

**Forms.** Every control has a real label. Grouped controls sit in a
fieldset with a legend. Status regions announce themselves. I want to
note one thing here in the College's favour: an earlier internal check
reported 25 unlabelled controls, and it was wrong — the controls were
properly nested inside their labels with a visually hidden legend, and
the detector did not understand nesting. The College fixed the detector
rather than "fixing" 25 controls that were already correct. Most teams
do the opposite and make the markup worse.

**Mobile.** No horizontal overflow at 390px. Tap targets are comfortable.
Wide tables scroll inside their own container rather than pushing the
page sideways.

**Direction.** The Arabic edition is a genuine RTL build, not a mirrored
LTR one, and numbers and Latin acronyms are directionally isolated so
they do not corrupt the line. Bidirectional text is where most
multilingual sites fail and this one is handled with care.

**Motion.** Scroll-reveal animation is used throughout.

---

## What I would raise

### 1. `prefers-reduced-motion` — I could not confirm it is honoured

The site animates on scroll across most pages. For a user with a
vestibular disorder this is the difference between a usable site and an
unusable one, and the browser tells you their preference. I could not
confirm from the outside that the preference is respected. If it is not,
this is the single highest-impact fix available.

### 2. No audit has been commissioned, and that is now the blocker

The statement is honest, but "not yet audited" has a shelf life. An
institution charging $19,000 and teaching disabled learners will
eventually be asked when it intends to find out. A day of testing with
a screen-reader user would convert an honest disclaimer into an honest
finding, and findings are what actually improve a site.

### 3. Audio-first learning needs a stated position

The Listening Lab records the learner's voice and is described as the
most distinctive part of the programme. Two questions follow that I
could not answer from the site: what does a Deaf or hard-of-hearing
learner do, and what does a learner with a speech difference do?

Transcripts exist for listening material — 903KB of listening scripts
are published, which is more than most providers offer. What is missing
is the *statement*: whether a learner who cannot complete the spoken
components can still progress, and on what terms.

The College has adopted that speaking does not count toward
certification, which as it happens resolves most of this. **It has not
connected the two facts on the accessibility page**, and a learner who
needs that answer will not find it in the governance register.

### 4. Cognitive load on the tuition and governance pages

Dense, long, multi-clause prose. This is a deliberate house style and I
am not going to tell an English-teaching institution to write shorter
sentences. But the pages that carry decisions — price, refunds, what you
get — should carry a plain summary at the top. A learner with a
cognitive disability, and every learner reading in a second language,
benefits from the same thing.

Given that the entire readership is by definition reading in a second
language, this is not a niche accommodation. It is the core audience.

---

## Verdict

**Better than most, and claiming less than most.**

The engineering is careful, the honesty is real, and the gaps are the
gaps of an unaudited site rather than a careless one.

Two things I would do next, in order: confirm `prefers-reduced-motion`
is honoured, and commission a half-day test with a screen-reader user.
The second will find more than this review did, and the College is
already in a state where it will act on what is found.
