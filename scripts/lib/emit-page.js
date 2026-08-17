/**
 * THE PAGE GUARD — a generator can no longer destroy an edited page.
 *
 * ────────────────────────────────────────────────────────────────────
 * WHY THIS FILE EXISTS
 * ────────────────────────────────────────────────────────────────────
 * Nine generators in this directory author pages into pages/ and every
 * one of them ended its run with a bare fs.writeFileSync. That is
 * correct on the day a generator is written and wrong on every day
 * after it, because CLAUDE.md §4 makes pages/*.html the SOURCE: prose
 * is edited there, by hand, in both languages, session after session.
 *
 * The two facts together are a loaded gun. `npm run arabic` re-runs
 * scripts/build-arabic.js over twelve Arabic pages that have drifted
 * 4,389 lines from what that generator produces — every one of those
 * lines a published sentence somebody wrote and checked in a browser —
 * and it would have overwritten all of them without printing a word.
 * Nothing in the repository stopped it and nothing warned about it. The
 * only reason it had not already happened is that nobody had typed the
 * command.
 *
 * ────────────────────────────────────────────────────────────────────
 * PROVENANCE, NOT A BLANKET REFUSAL
 * ────────────────────────────────────────────────────────────────────
 * "Never overwrite" would be wrong too. The level generators genuinely
 * own their pages: they render sixty modules out of the curriculum data
 * and are re-run precisely so a data change reaches the page. Blocking
 * them would push everyone straight to an override flag, and a flag
 * everybody types is not a guard.
 *
 * So the guard asks a narrower question — *is this page still exactly
 * what the generator last wrote?* — and answers it from a digest
 * ledger, pages/.generated.json, keyed by file name:
 *
 *   page matches the ledger    the generator still owns it   → write
 *   page differs from the      a human has edited it since   → refuse
 *     ledger, or is unknown
 *   page does not exist        nothing to lose               → write
 *
 * A generator that owns its output therefore behaves exactly as it did
 * before, and a generator whose prose has been superseded by hand goes
 * quiet the moment the first edit lands. Which of the nine is which
 * stops being something anyone has to remember.
 *
 * ────────────────────────────────────────────────────────────────────
 * WHICH SIDE WINS WHEN THEY DISAGREE
 * ────────────────────────────────────────────────────────────────────
 * A diverged generator holds a snapshot of prose as it stood when the
 * generator was last touched. The page holds prose as it stands now,
 * edited to the house standard and verified by rendering. The page is
 * later and better, so the page wins and the generator's copy is the
 * stale one — which makes that generator a scaffold: how the page came
 * into existence, and no longer how it is maintained.
 *
 * ────────────────────────────────────────────────────────────────────
 * THE OVERRIDE
 * ────────────────────────────────────────────────────────────────────
 * WEC_REGENERATE=1 writes anyway and re-stamps the ledger. It exists so
 * that a deliberate re-scaffold is possible, and so that seeding the
 * ledger for a generator that does own its pages is one command rather
 * than a deletion. It has to be typed, which is the point: the
 * destructive behaviour is available and it is never the default.
 */

const crypto = require('node:crypto');
const fs = require('node:fs');
const path = require('node:path');

// WEC_PAGE_LEDGER redirects the ledger, which is how tests/generator-guard
// exercises the four outcomes against a scratch directory instead of
// stamping the real one. Nothing in the build sets it.
const LEDGER = process.env.WEC_PAGE_LEDGER
  || path.join(__dirname, '..', '..', 'pages', '.generated.json');

const OVERRIDE = process.env.WEC_REGENERATE === '1';

// Whitespace-only differences are not an edit anybody made on purpose;
// they are a trailing newline or an editor's indentation. Comparing on
// a normalised form keeps the guard from crying wolf, while any real
// change of words still counts as divergence.
const norm = (s) => s.replace(/\r\n/g, '\n').replace(/[ \t]+$/gm, '').trim();
const digest = (s) => crypto.createHash('sha256').update(norm(s)).digest('hex').slice(0, 32);

function readLedger() {
  try {
    return JSON.parse(fs.readFileSync(LEDGER, 'utf8'));
  } catch {
    return {};
  }
}

let ledger = readLedger();
let ledgerDirty = false;

/**
 * Write a generated page, unless a human has edited it since the
 * generator last wrote it.
 *
 * @param {string} file  absolute path of the page to write
 * @param {string} body  the generated body (a trailing newline is added)
 * @returns {'created'|'unchanged'|'regenerated'|'refused'|'overwritten'}
 */
function emitPage(file, body) {
  const next = body.endsWith('\n') ? body : `${body}\n`;
  const key = path.basename(file);
  const stamp = () => { ledger[key] = digest(next); ledgerDirty = true; };

  if (!fs.existsSync(file)) {
    fs.mkdirSync(path.dirname(file), { recursive: true });
    fs.writeFileSync(file, next);
    stamp();
    return 'created';
  }

  const current = fs.readFileSync(file, 'utf8');
  const currentDigest = digest(current);

  if (currentDigest === digest(next)) { stamp(); return 'unchanged'; }

  if (ledger[key] === currentDigest) {
    // Byte-for-byte what this generator last produced: nobody has
    // touched it, so the generator is still its author.
    fs.writeFileSync(file, next);
    stamp();
    return 'regenerated';
  }

  if (OVERRIDE) {
    fs.writeFileSync(file, next);
    stamp();
    return 'overwritten';
  }
  return 'refused';
}

/**
 * Report what a run did and flush the ledger. A refusal is the guard
 * working rather than the build failing, so it prints as an instruction
 * and the process still exits 0.
 *
 * @param {string} generator name to print (e.g. 'build-arabic.js')
 * @param {Array<{file: string, result: string}>} results
 */
function reportEmit(generator, results) {
  if (ledgerDirty) {
    // Re-read first: two generators in one `npm run` sequence both
    // stamp this file, and the second must not drop the first's keys.
    ledger = { ...readLedger(), ...ledger };
    const ordered = Object.fromEntries(Object.keys(ledger).sort().map((k) => [k, ledger[k]]));
    fs.writeFileSync(LEDGER, `${JSON.stringify(ordered, null, 2)}\n`);
    ledgerDirty = false;
  }

  const by = (r) => results.filter((x) => x.result === r).map((x) => path.basename(x.file));
  const created = by('created');
  const written = by('regenerated');
  const refused = by('refused');
  const forced = by('overwritten');
  const same = by('unchanged').length;

  if (created.length) console.log(`${generator}: wrote ${created.length} new page(s): ${created.join(', ')}`);
  if (written.length) console.log(`${generator}: regenerated ${written.length} page(s) it owns: ${written.join(', ')}`);
  if (forced.length) console.log(`${generator}: WEC_REGENERATE=1 — overwrote ${forced.length} edited page(s): ${forced.join(', ')}`);
  if (same) console.log(`${generator}: ${same} page(s) already match the generator.`);
  if (refused.length) {
    console.log(`${generator}: left ${refused.length} hand-edited page(s) untouched —`);
    for (const f of refused) console.log(`  pages/${f}`);
    console.log('  These have been edited since the generator last authored them, so the page is');
    console.log('  the source of record and the generator holds the stale copy. Edit the page.');
    console.log(`  To overwrite deliberately: WEC_REGENERATE=1 node scripts/${generator}`);
  }
  return {
    created: created.length, regenerated: written.length, refused: refused.length,
    unchanged: same, overwritten: forced.length,
  };
}

module.exports = { emitPage, reportEmit, OVERRIDE, LEDGER };
