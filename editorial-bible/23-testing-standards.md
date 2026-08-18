# Volume 23 — Testing Standards

*The operational form of `SEB §3.1`. Every rule here was bought with a
defect that a green suite failed to catch.*

---

## §23.1 The permanent principle `[OBSERVED]`

> **Never trust an implementation merely because it passes tests.
> Continuously verify that the tests themselves measure the complete
> behaviour they claim to guarantee.** (`WEC-EP §1`)

## §23.2 Every subsystem meets the real producer of its inputs `[OBSERVED]`

> A test that supplies its own inputs can only ever discover what its
> author already imagined. (`WEC-EP §2`)

**Binding:** every subsystem has **at least one** test driven by the real
producer of its inputs — a real browser, a real encoder, a real
signature, a real payload — not by inputs the test invented.

The register that proves the rule, reproduced because each row is a
different way to be wrong:

| Defect | Why the tests missed it | What found it |
|---|---|---|
| The client sent **no `Authorization` header** — every request would have 401'd in production | The harness hard-coded a user id and never read request headers. **The harness was easier than production exactly where production has a check** | A harness that was made to require auth |
| The content-type allow-list rejected **every recording any real browser produces** (`audio/webm;codecs=opus`) | 62 unit tests picked their own tidy `audio/webm`. **No browser ever says that** | A real `MediaRecorder` on a real Chromium with a fake microphone |
| An unknown key id was rejected without refetching the key set — **the identity provider rotating keys would sign out every user** for up to ten minutes | Nothing exercised verification past the 401 boundary at all | Real RSA keypairs and real signatures, including forgery and algorithm confusion |
| On a phone, submitting a quiz produced **no visible response** — graded correctly, rendered below the fold | Every browser test ran at 1440px | A person using the real site on a real phone |
| Enrolments had **no uniqueness constraint** | Nothing ever enrolled the same person twice | Enrolling the first real learner by hand |
| Every 403 was mapped to one message, so a staff member was told they were **not staff** when they were | Two different refusals share one status code | A browser test of the admin page, on its first run |
| 1,029 checks passed on a site that **scrolled 330px sideways on every phone** | Every check was a check on *text* — does this string appear, does this token exist. **Not one opened a viewport** | Opening a viewport |

## §23.3 A stand-in is no more permissive than the thing it stands in for `[OBSERVED]`

`WEC-EP §2`. The estate's object-store shim rejects part gaps and
undersized non-final parts **because the real store does**. A shim that
accepts anything tests nothing where it matters.

**Binding.** Every mock, fake, shim and scripted provider enforces the
real system's constraints — its validation, its error shapes, its status
codes, its rate limits. Where it cannot, the difference is a comment in
the shim.

## §23.4 An assertion that can pass for the wrong reason is worse than none `[OBSERVED]`

`WEC-EP §2`: "the audio can be fetched back from the server" passed while
nothing had reached the server, because a `blob:` URL fetches fine from
inside the page.

**Binding.** Guard an assertion on the specific condition it claims, not
on a proxy for it. Where a proxy is unavoidable, assert the negative case
too — prove the test can fail.

## §23.5 The layers, and what each is for `[RULED — confidence High]`

| Layer | Subject | Substitutes | Must include |
|---|---|---|---|
| **Unit** | One module's logic | Clock, randomness, sinks — injected, never patched globally | The failure paths, not only the happy one |
| **Integration** | One adapter against a **scripted provider** | Only the network | Real request construction and real response handling, including the provider's actual error shapes |
| **Contract** | Our understanding of a provider | The provider, from **captured real payloads** | A recorded real response, refreshed on a cadence |
| **End-to-end** | The whole system across its real transport | Nothing | The protocol handshake, one read, one refused write, one audit record |
| **Rendered** | Layout, contrast, motion, RTL | Nothing — a real engine | Every supported viewport, in every language |
| **Health** | A deployed environment | Nothing | One authenticated read per dependency |

## §23.6 The rendered gate `[OBSERVED]`

`SEB §6.1.2`. A real browser, at **320, 360, 375, 390, 414 and 768 px**,
on every page, in every language, asserting no horizontal scroll, nothing
hidden on the inline axis, and 44×44px targets.

Plus the measured gates the estate already enforces: **computed contrast
from the shipped stylesheet**, and **rendered-pixel colour proportion in
all four modes a reader can arrive in** — system-light, system-dark,
chose-light, chose-dark.

> **A visual claim that is not measured in a renderer is not a claim this
> institution makes.** (`AMC-EB §48.3`)

## §23.7 Tests are written against behaviour, not implementation `[RULED — confidence High]`

A test that breaks when a function is renamed but not when its behaviour
changes is worse than absent: it costs maintenance and buys nothing. Test
the observable contract — the returned value, the emitted record, the
refused write.

## §23.8 Never weaken a test to make it pass `[OBSERVED]`

`SEB §27.1`. Skipping, quarantining, widening a tolerance, or deleting an
assertion to get green is forbidden. **"Flaky" is a diagnosis only when
the job died before any test body ran** — checkout, dependency install, a
lost runner. Everything else is root-caused.

## §23.9 Every safeguard is tested on the path where it fires `[OBSERVED]`

`SHRS approval-workflow-architecture §7` names the property that mattered
in its own unit test, and it is the model:

> The separation-of-duties check refuses a self-approval **and —
> critically — the real side effect never runs when it does**, i.e. the
> safeguard fires *before* any state changes, not just before the response
> is returned.

**Binding.** For every guard: one test that it refuses, and one that
**nothing happened** when it refused.

## §23.10 What cannot be tested here is named, not assumed `[OBSERVED]`

`WEC-EP §3` keeps an honest register of every place the code has never met
its real producer, with what would close each one. `SHRS` does the same
about its database: "no live database in this sandbox — whoever holds the
production database should run that sequence once before relying on it for
a real certificate."

**Binding.** A test suite ships with a register of what it does **not**
cover and what would close each gap. **"Nothing here is a reason not to
ship a preview. It is a list of the things that must not be described as
verified"** (`WEC-EP §3`).

## §23.11 Determinism `[RULED — confidence High]`

Injected clocks, injected randomness, no global patching, no shared
mutable state between test files, no ordering dependence, no network
unless the layer is defined as needing it. A test that fails once in fifty
runs is a defect in the test or in the code, and it is investigated as
one.

## §23.12 The suite is fast enough to be run `[RULED — confidence High]`

Unit and integration layers run in seconds and run on every commit. The
rendered gate is slower, needs a browser binary, and runs on every release
— **and that cost is the correct price** (`AMC-EB §48.4`): "the
alternative — the one we paid — is a site that reports 1,029 passing
checks to its own Founder while being unusable on the device its students
hold."
