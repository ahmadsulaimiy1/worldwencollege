/**
 * THE GATES, TESTED BY MAKING THEM FAIL.
 *
 * This is the file that makes the other three gates worth having.
 *
 * A gate that has never been watched to fail is a gate nobody knows
 * works. Every one of these scanners would pass a clean tree silently if
 * its regular expression were subtly wrong — and a green tick on a check
 * that cannot fail is worse than no check at all, because it stops people
 * looking.
 *
 * Each case copies `src/` to a temporary tree, injects exactly ONE defect
 * — the real defect the gate was written for, in the form it actually
 * arrives in — and asserts the gate exits non-zero and names it.
 */

import { test } from 'node:test';
import assert from 'node:assert/strict';
import { execFile } from 'node:child_process';
import { promisify } from 'node:util';
import { cp, mkdtemp, readFile, rm, writeFile } from 'node:fs/promises';
import { join } from 'node:path';
import { tmpdir } from 'node:os';

const run = promisify(execFile);
const here = new URL('..', import.meta.url).pathname;

/**
 * Run a gate against a copy of `src/` carrying one injected defect.
 *
 * @param {string} gate     the gate's filename
 * @param {string} file     the stylesheet to damage
 * @param {(css: string) => string} damage
 */
async function withDefect(gate, file, damage) {
  const dir = await mkdtemp(join(tmpdir(), 'sx-gate-'));
  try {
    await cp(join(here, 'src'), join(dir, 'src'), { recursive: true });
    const path = join(dir, 'src', file);
    const before = await readFile(path, 'utf8');
    const after = damage(before);
    // If the injection did not land, the test would "pass" for a gate
    // that never saw a defect. That is the failure mode this whole file
    // exists to prevent, so it is checked here too.
    assert.notEqual(after, before, `the defect was not injected into ${file} — the target text has changed`);
    await writeFile(path, after, 'utf8');
    try {
      const { stdout } = await run(process.execPath, [join(here, 'gates', gate)], {
        env: { ...process.env, SX_ROOT: dir },
      });
      return { failed: false, output: stdout };
    } catch (e) {
      return { failed: true, output: `${e.stdout ?? ''}${e.stderr ?? ''}` };
    }
  } finally {
    await rm(dir, { recursive: true, force: true });
  }
}

/** The same, with no defect — the control. */
async function clean(gate) {
  const dir = await mkdtemp(join(tmpdir(), 'sx-gate-'));
  try {
    await cp(join(here, 'src'), join(dir, 'src'), { recursive: true });
    await run(process.execPath, [join(here, 'gates', gate)], { env: { ...process.env, SX_ROOT: dir } });
    return true;
  } catch (e) {
    throw new Error(`the gate failed on an UNDAMAGED tree:\n${e.stdout ?? ''}${e.stderr ?? ''}`);
  } finally {
    await rm(dir, { recursive: true, force: true });
  }
}

/* ── The controls. Every gate passes the real source. ───────────────── */

for (const gate of ['tokens.mjs', 'beat.mjs', 'contrast.mjs']) {
  test(`${gate} passes the undamaged tree`, async () => {
    assert.equal(await clean(gate), true);
  });
}

/* ── tokens ─────────────────────────────────────────────────────────── */

test('tokens: catches an ad-hoc hex colour', async () => {
  const r = await withDefect('tokens.mjs', 'components.css', (css) =>
    css.replace('.sx-control--quiet { color: var(--sx-fg-quiet); }', '.sx-control--quiet { color: #7a7a7a; }'));
  assert.equal(r.failed, true, 'a stray hex passed the tokens gate');
  assert.match(r.output, /ad-hoc colour/);
});

test('tokens: catches a named CSS colour', async () => {
  const r = await withDefect('tokens.mjs', 'components.css', (css) =>
    css.replace('.sx-index__match { color: var(--sx-aurum-lit); }', '.sx-index__match { color: gold; }'));
  assert.equal(r.failed, true);
  assert.match(r.output, /ad-hoc colour/);
});

test('tokens: catches a pigment used where a signal ROLE belongs', async () => {
  const r = await withDefect('tokens.mjs', 'components.css', (css) =>
    css.replace('var(--sx-signal-attention)', 'var(--sx-carnelian)'));
  assert.equal(r.failed, true, 'the pigment/role distinction is not enforced');
  assert.match(r.output, /is a pigment, not a role/);
});

test('tokens: catches an ad-hoc z-index', async () => {
  const r = await withDefect('tokens.mjs', 'components.css', (css) =>
    css.replace('z-index: var(--sx-z-crown);', 'z-index: 9999;'));
  assert.equal(r.failed, true);
  assert.match(r.output, /ad-hoc z-index/);
});

test('tokens: catches the auto-fit track that overflows a phone', async () => {
  const r = await withDefect('tokens.mjs', 'components.css', (css) =>
    css.replace('repeat(auto-fit, minmax(min(18em, 100%), 1fr))', 'repeat(auto-fit, minmax(18em, 1fr))'));
  assert.equal(r.failed, true, 'the auto-fit trap is not enforced');
  assert.match(r.output, /overflows any container narrower than/);
});

test('tokens: catches a dangling custom property', async () => {
  const r = await withDefect('tokens.mjs', 'components.css', (css) =>
    css.replace('var(--sx-space-lg)', 'var(--sx-space-huge)'));
  assert.equal(r.failed, true, 'a typo in a custom property passed silently — exactly the bug the check exists for');
  assert.match(r.output, /neither a token nor a declared @runtime input/);
});

test('tokens: catches a runtime input used without a fallback', async () => {
  const r = await withDefect('tokens.mjs', 'instruments.css', (css) =>
    css.replace('var(--sx-bar, 0%)', 'var(--sx-bar)'));
  assert.equal(r.failed, true);
  assert.match(r.output, /runtime input used without a fallback/);
});

/* ── beat ───────────────────────────────────────────────────────────── */

test('beat: catches a duration off the beat', async () => {
  const r = await withDefect('beat.mjs', 'components.css', (css) =>
    css.replace('transition: opacity var(--sx-beat-2) var(--sx-sovereign);', 'transition: opacity 250ms var(--sx-sovereign);'));
  assert.equal(r.failed, true, '250ms passed a gate whose whole job is to refuse it');
  assert.match(r.output, /not a multiple of the 30ms tick|raw duration/);
});

test('beat: catches a browser default curve', async () => {
  const r = await withDefect('beat.mjs', 'components.css', (css) =>
    css.replace('transition: background-color var(--sx-beat-4) var(--sx-sovereign);', 'transition: background-color var(--sx-beat-4) ease-in-out;'));
  assert.equal(r.failed, true);
  assert.match(r.output, /browser default easing/);
});

test('beat: an exemption must name THIS gate, not just any gate', async () => {
  const r = await withDefect('beat.mjs', 'components.css', (css) =>
    css.replace(
      '.sx-quad__cell:hover { background: color-mix(in oklab, var(--sx-fg) 4%, transparent); }',
      '/* sx-gate-allow: tokens — wrong gate named */\n.sx-quad__cell { transition: all 333ms ease; }',
    ));
  assert.equal(r.failed, true, 'an exemption for one gate silenced another');
});

test('beat: a correctly named exemption is honoured, and reported', async () => {
  const r = await withDefect('beat.mjs', 'components.css', (css) =>
    css.replace(
      '.sx-quad__cell:hover { background: color-mix(in oklab, var(--sx-fg) 4%, transparent); }',
      '/* sx-gate-allow: beat — a deliberate, argued exception */\n.sx-quad__cell { transition: all 333ms ease; }',
    ));
  assert.equal(r.failed, false, 'a correctly named exemption was not honoured');
  assert.match(r.output, /exempt/, 'the exemption was honoured SILENTLY — that is how a gate becomes decorative');
  assert.match(r.output, /a deliberate, argued exception/, 'the reason was not printed');
});

/* ── contrast ───────────────────────────────────────────────────────── */

test('contrast: catches a foreground that fails AA on its own ground', async () => {
  const r = await withDefect('contrast.mjs', 'tokens.css', (css) =>
    css.replace('--sx-fg-quiet:      #A8A69F;', '--sx-fg-quiet:      #3A3A38;'));
  assert.equal(r.failed, true, 'unreadable body-adjacent text passed the contrast gate');
  assert.match(r.output, /is below 4.5:1/);
});

test('contrast: catches the defect it was written for — an invisible focus ring', async () => {
  const r = await withDefect('contrast.mjs', 'tokens.css', (css) =>
    css.replace('--sx-signal-interactive: var(--sx-lapis-lit);', '--sx-signal-interactive: var(--sx-lapis);'));
  assert.equal(r.failed, true, 'the 2.29:1 focus ring would ship again');
  assert.match(r.output, /signal-interactive/);
});

test('contrast: catches gold restored as type on paper', async () => {
  const r = await withDefect('contrast.mjs', 'tokens.css', (css) =>
    css.replace('  --sx-metal-text: var(--sx-brass-deep);', '  --sx-metal-text: var(--sx-aurum);'));
  assert.equal(r.failed, true, 'gold as type on paper passed — SEB §30.7 rule 1 is not enforced');
  assert.match(r.output, /gold is not type on paper|is below 4.5:1/);
});

test('contrast: catches the boundary token drifting back into the rule', async () => {
  const r = await withDefect('contrast.mjs', 'tokens.css', (css) =>
    css.replace('  --sx-boundary:      #59617B;', '  --sx-boundary:      var(--sx-slate);'));
  assert.equal(r.failed, true, 'a control boundary below 3:1 passed SC 1.4.11');
  assert.match(r.output, /is below 3:1/);
});
