# Volume 35 — The Design Language Initiative

*The permanent programme. Volumes 30 and 34 are what the language **is**;
this volume is how it **stays alive** — how a pattern earns admission, how
a lesson becomes a rule, and how the language is worth more in ten years
than it is today.*

---

## §35.1 The objective

> **Years from now, a person should see a screenshot with the logo
> removed and recognise it as a StromeX product.**

That is the whole programme, stated as a test. It is gate G4
(`SEB §30.17`), and everything below exists to make it pass more strongly
each year rather than more weakly.

**The failure mode this volume prevents** is the ordinary one: a design
system is written, admired, and then diverges project by project until it
describes nothing. Divergence does not happen by decision. It happens by
one reasonable exception at a time.

## §35.2 The living-constitution rule

**Every completed project improves the language, or it has taken from the
ecosystem without giving back.**

Step 9 of the project-start protocol (`MC §6`) is binding: on completion,
every project produces

1. **the patterns it invented**, proposed to the canon;
2. **the lessons it learned**, proposed as amendments;
3. **the exceptions it had to make**, each with the reason — because an
   exception nobody recorded becomes the next project's precedent;
4. **an explicit statement where it proposes nothing**, and why.

The fourth is not a formality. A project that invented nothing and learned
nothing has either been trivial or has not been examined.

## §35.3 How a pattern is admitted to the canon

The canon is closed (`SEB §30.10`). Admission is deliberate.

| Gate | Test |
|---|---|
| **1 · Necessity** | Which existing component was tried, and why did it fail? "It would be nice" is not a failure |
| **2 · Replacement** | What convention does this replace? A component that replaces nothing is decoration (`SEB §34.1`) |
| **3 · Twice** | Has it been needed by **two independent projects**? One project's need is a local variant, not a canon entry |
| **4 · Contract** | All eight parts of `SEB §34.1`, complete. Nine states, RTL, print, motion on the beat, accessible contract |
| **5 · Language** | Does it obey one light source, one movement, the Register and the Quire? A component that needs its own rules is not in this language |
| **6 · Removal** | With the mark removed, does it still read as ours? |

Passing all six: added to the canon, implemented in
`stromex/design-system/`, and recorded in Volume 25.

Failing gate 3 only: shipped as a **project variant**, named for its
project, and reviewed again when a second project needs it.

Failing anything else: rejected, **with the reason recorded** — so the
argument is won once (`SEB §27`).

## §35.4 Retirement

A component leaves the canon when it has not been used by any project for
two review cycles, or when a stronger component subsumes it.

**Retirement is announced, never silent.** The entry stays in the canon,
struck through, with the date, the reason and its replacement — because
the argument for it will be made again by someone who does not know it was
already had.

## §35.5 The research programme

Continuous, not occasional. Each strand has a question it is trying to
answer, because research without a question produces a reading list.

| Strand | The standing question |
|---|---|
| **Enterprise UX** | Where do administrators actually lose time, and which of those losses is a design failure rather than a process one? |
| **Educational technology** | What do learners abandon, and at which step? |
| **Accessibility** | What do assistive-technology users encounter in *our* surfaces that automated checks do not catch? |
| **Interaction design** | Which of our signature patterns (`SEB §34.14`) do people actually notice, and which are we congratulating ourselves over? |
| **Visual systems** | What is becoming a convention that we should now reject (`SEB §29.6`)? |
| **Motion systems** | Is the Chronograph's 240ms beat right for every surface class, or right for the ceremonial ones and slow for the administrative ones? |
| **Performance engineering** | What is the real experience on a three-year-old Android on 3G, measured rather than assumed? |
| **Cognitive psychology** | Where is our information density above what a person can hold, and where is it below what they want? |
| **Information architecture** | Which of our labels do people read differently from how we meant them? |
| **Human–computer interaction** | What are we asking people to remember that the system could remember for them? |

**Each strand reports once per cycle**, with findings, not with a summary
of what it read. A strand with nothing to report says so.

**The council is consulted per strand** (`SEB §32`) — for prior art, for
the counter-position, and for what the field already knows that we do not.

## §35.6 The review cycle

| Cadence | |
|---|---|
| **Per project, at completion** | The `SEB §35.2` contribution. Non-optional |
| **Quarterly** | Canon review: admissions, variants awaiting a second project, retirements. Accessibility audit, both languages, every surface class. The rendered gates re-run against every shipped product |
| **Annually** | Full review of Volumes 30, 34 and 35. The removal test (G4) run with real readers, not with us. The Anti-Generic Register re-examined: what became a convention this year? |
| **On any Founder direction** | Immediately, with the amendment recorded and reasoned |

## §35.7 Measurement — because a design language that is only asserted is a mood board

Machine-checked, every build:

- **Contrast** computed from the shipped stylesheet, every ground, every
  register.
- **Colour proportion** measured in rendered pixels, in all four modes a
  reader can arrive in.
- **Motion** — every duration a Chronograph multiple, every easing one of
  the four authored curves. A build with an off-beat animation fails.
- **Tokens only.** An ad-hoc colour, spacing or radius value in a
  stylesheet fails the build.
- **Canon only.** A section not built from `SEB §30.10` fails gate G1.
- **The responsive gate** — a real browser at eight widths, every page,
  every language.

Measured with people, per cycle:

- **The removal test (G4)** with ten readers who do not work here.
- **The persona walkthrough (G5)**, recorded *gets / doesn't get /
  verdict*.
- **One session with an assistive-technology user per surface class**,
  which is currently the largest open item in the whole programme
  (`SEB §34.18`).

## §35.8 Versioning the language

`MAJOR.MINOR.PATCH`, and the asymmetry is deliberate:

| | |
|---|---|
| **MAJOR** | A token's meaning changes; a component leaves the canon; a signature pattern changes. **Every product must migrate**, on a stated schedule |
| **MINOR** | A component is admitted; a token is added; a variant is promoted. **Products adopt at their next release** |
| **PATCH** | A value is corrected; a bug is fixed. **Products adopt immediately** |

**Tightening is MINOR; loosening is MAJOR.** Making the language stricter
is safe. Making it permissive is how it stops being a language.

**No product runs more than one MAJOR behind.** A product two majors
behind is no longer part of the ecosystem, and gate G4 will show it.

## §35.9 The asset

Stated plainly, because it is the reason this volume exists at all.

The design language is intended to become **one of StromeX's most valuable
intellectual assets** — the thing that makes the fortieth product cheaper
and better than the fourth, and the thing a person recognises before they
read a word.

That value is created by **consistency compounding**, and it is destroyed
by exceptions compounding. Every article in this volume is a mechanism for
the first and against the second.

## §35.10 What this programme has not yet done

Named, not implied:

- **No product has yet been built entirely in this language.** Volumes 30
  and 34 are `Designed`; `stromex/design-system/` is the first
  implementation, and until a real product ships on it the language is
  specified rather than proven.
- **The removal test has never been run with real readers.** It is a gate
  with no results.
- **No assistive-technology user has used any of it.**
- **The Chronograph's 240ms beat is an authored judgement, not a measured
  one.** It should be tested against reaction-time data and against the
  administrative surfaces, where it may be too slow.
