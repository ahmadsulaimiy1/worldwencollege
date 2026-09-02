// tests/library-access.test.mjs — the open level, and the rule that
// governs everything after it.
//
// ─────────────────────────────────────────────────────────────────────
// THE POLICY THIS HOLDS
// ─────────────────────────────────────────────────────────────────────
// The owner's instruction, in three parts: Level I is the open level and
// downloads freely; Levels II–VI are shown, explained and previewed but
// ship with enrolment or the independent route's access step; and a
// candidate who does not enrol can still buy that access, sit the same
// examination and take the same award.
//
// The first two parts are a publishing decision about files, and a
// publishing decision about files is the kind that rots quietly. A
// volume marked `enrolled` that still has a public URL is not gated, it
// is merely described as gated — which is worse than not claiming it,
// because a reader who finds the file stops believing the page.
//
// ─────────────────────────────────────────────────────────────────────
// AND THE PROMISE THAT CONSTRAINS IT
// ─────────────────────────────────────────────────────────────────────
// Nothing already published may be withdrawn by this policy. The rule
// was written before the volumes it governs exist — the same order the
// curriculum was written in — and the page says so. If a future edit
// flips a published volume to `enrolled`, that is a withdrawal, and it
// needs the owner's decision rather than a passing build. So this file
// pins the count of open volumes to what is published today and fails
// loudly if it drops.

import { readFileSync, existsSync } from 'node:fs';
import path from 'node:path';
import { ROOT } from './helpers.mjs';

let pass = 0, fail = 0;
const check = (label, cond, detail) => {
  console.log((cond ? 'PASS ' : 'FAIL ') + label + (cond || detail === undefined ? '' : ` — ${detail}`));
  cond ? pass++ : fail++;
};

const lib = JSON.parse(readFileSync(path.join(ROOT, 'data/library.json'), 'utf8'));
const redirects = readFileSync(path.join(ROOT, '_redirects'), 'utf8');
const en = readFileSync(path.join(ROOT, 'pages/press-library.html'), 'utf8').replace(/\s+/g, ' ');
const ar = readFileSync(path.join(ROOT, 'pages/press-library.ar.html'), 'utf8').replace(/\s+/g, ' ');

// ── 1 · EVERY VOLUME DECLARES A TIER ─────────────────────────────────
const TIERS = new Set(['open', 'enrolled']);
const untiered = lib.volumes.filter((v) => !TIERS.has(v.access));
check(`Every volume declares an access tier — ${lib.volumes.length} volumes`,
  untiered.length === 0, untiered.map((v) => v.slug).join(', '));

check('The register counts the tiers and they sum to the whole',
  lib.open + lib.enrolled === lib.total, `${lib.open} + ${lib.enrolled} ≠ ${lib.total}`);

// ── 2 · A GATED VOLUME HAS NO PUBLIC URL ─────────────────────────────
// The mechanism, checked now so that it works on the day it first
// matters rather than being discovered not to.
const gated = lib.volumes.filter((v) => v.access === 'enrolled');
const leaked = gated.filter((v) => redirects.includes(v.href) || en.includes(v.href));
check(`No gated volume has a public URL — ${gated.length} gated`,
  leaked.length === 0, leaked.map((v) => v.slug).join(', '));

// A check that has never failed has never been shown to work — the
// College publishes that principle on its own Governance page. So the
// rule is exercised against a volume that does not exist.
{
  // Borrow the URL of a volume that IS served, so the assertion proves
  // the sweep can see a public URL at all. Using an oversize volume's
  // href would have proved the opposite — it has no URL by construction,
  // which is how the first cut of this check passed by accident.
  const servedVolume = lib.volumes.find((v) => !v.oversize && v.access === 'open');
  const wouldCatch = redirects.includes(servedVolume.href) || en.includes(servedVolume.href);
  check(`...and the sweep does catch a gated volume that kept its URL — via ${servedVolume.slug}`,
    wouldCatch === true);
}

// ── 3 · NOTHING PUBLISHED IS WITHDRAWN ───────────────────────────────
// Sixteen volumes are published and every one of them is open. This is a
// ratchet in the reader's favour: it may rise, and a fall means a volume
// somebody could download yesterday is gone today.
const OPEN_FLOOR = 16;
check(`No published volume has been withdrawn — ${lib.open} open, floor ${OPEN_FLOOR}`,
  lib.open >= OPEN_FLOOR,
  'a volume that was downloadable is not any more; that is the owner\'s decision, not a build\'s');

// ── 4 · THE PAGE STATES THE POLICY, IN BOTH LANGUAGES ────────────────
for (const [label, body, openLevel, rule, kept] of [
  ['English', en, /Level I is the open level/i,
    /ship with <strong>enrolment or the independent route/i,
    /Nothing already published is withdrawn/i],
  ['Arabic', ar, /المستوى الأول هو المستوى المفتوح/,
    /الالتحاق أو مع خطوة الوصول في المسار المستقل/,
    /لا يُسحب شيء نُشر من قبل/],
]) {
  check(`${label}: the page names Level I as the open level`, openLevel.test(body));
  check(`${label}: ...states the rule for Levels II–VI`, rule.test(body));
  check(`${label}: ...and promises that nothing published is withdrawn`, kept.test(body));
}

// ── 5 · THE OPEN LEVEL IS ACTUALLY OPEN ──────────────────────────────
// Naming Level I as the open level while its own volumes are gated would
// be the single most damaging version of this policy.
const LEVEL_I = ['student-workbook-level-1', 'teachers-companion-level-1'];
for (const slug of LEVEL_I) {
  const v = lib.volumes.find((x) => x.slug === slug);
  check(`${slug} is in the register`, Boolean(v));
  if (v) check(`...and is open, because Level I is the open level`, v.access === 'open', v.access);
}

// ── 6 · AND THE CRITERIA STAY OPEN TO EVERYONE ───────────────────────
// A candidate is entitled to read what they will be judged against
// before deciding to pay. Gating the Assessment Handbook would make the
// rest of the Library decorative.
for (const slug of ['assessment-handbook', 'flagship-curriculum', 'programme-architecture', 'pronunciation-handbook']) {
  const v = lib.volumes.find((x) => x.slug === slug);
  check(`${slug} stays open to anyone`, Boolean(v) && v.access === 'open', v && v.access);
}

check('The Library page is built in both editions',
  existsSync(path.join(ROOT, 'press/library/index.html'))
  && existsSync(path.join(ROOT, 'ar/press/library/index.html')));

console.log(`\n${pass} passed, ${fail} failed.`);
process.exit(fail ? 1 : 0);
