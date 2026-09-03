// scripts/voice-audit.mjs — find the wording that costs the College
// authority, and leave alone the wording that earns it.
//
// THE DISTINCTION THIS WHOLE FILE EXISTS TO DRAW.
//
// This site hedges constantly, and roughly half of that hedging is the
// most valuable thing on it. "No award has been conferred on anyone."
// "The Board has never met." "This is a design figure, not a
// measurement." Those are not weak sentences — they are the entire
// proposition, they are enforced by tests/published-claims.test.mjs,
// and an editor who strips them has destroyed the College's argument
// while believing they strengthened its tone.
//
// The other half protects nothing at all. "Is designed to" where the
// thing simply IS. "Aims to", "seeks to", "works towards". "May",
// "should", "can help you" where the College has decided and could
// simply say so. Softeners — "quite", "somewhat", "generally",
// "typically", "simply". Connective throat-clearing — "it is worth
// noting that", "in order to", "furthermore", "moreover". Those cost
// authority and buy nothing.
//
// So this classifies rather than counts:
//
//   DEAD      cut or rewrite. Hedges a decision the College has made.
//   MACHINE   the register of a language model rather than a college.
//   LOAD      leave alone. A disclosure that carries a real fact, and
//             usually one a guardrail test is watching.
//
// A phrase that matches DEAD *inside* a sentence that also matches LOAD
// is reported as LOAD and left, because in that position the hedge is
// doing the honest work — "the audio has not yet been produced" needs
// its "yet".
//
// USAGE
//   node scripts/voice-audit.mjs            # summary per page
//   node scripts/voice-audit.mjs --lines    # every hit with its line

import { readFileSync, readdirSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.dirname(path.dirname(fileURLToPath(import.meta.url)));
// Overridable for the same reason the red-flag auditor's is: an
// exemption list can only be trusted if something proves it exempts
// what it names and nothing else. See tests/audit-behaviour.test.mjs.
const PAGES = process.env.WEC_AUDIT_PAGES || path.join(ROOT, 'pages');
const SHOW_LINES = process.argv.includes('--lines');

// ── LOAD-BEARING: a sentence carrying one of these is left alone ──────
// These are the College's honest disclosures. Most are guarded by
// tests/published-claims.test.mjs; all of them are the reason anyone
// should believe the rest of the site.
const LOAD = [
  // THE MOTTO, RULED ON AND CLOSED. "Empowering the World Through
  // English Excellence" is the institution's own line — footer of every
  // page, the schema.org slogan, and the masthead of /about/ — and this
  // audit reported `Empowering` as machine register, correctly by its
  // own rule and wrongly as a matter of authority. It was put to the
  // owner on 18 August 2026 with two alternatives drafted in the site's
  // register, and the owner ruled that the motto stays.
  //
  // It is protected here rather than removed from MACHINE, so the
  // pattern still catches `Empowering` anywhere else it appears. Do not
  // re-raise this.
  /Empowering the World Through English Excellence/i,
  /(?<![؀-ۿݐ-ݿﭐ-﷿ﹰ-﻿])تمكين العالم من خلال التميّز/u,
  /\bno (award|cohort|student|graduate|accreditation|external examiner)/i,
  /\bhas (not|never) (been|yet)/i, /\bhave (not|never) (been|yet)/i,
  /\bnot (yet )?(adopted|appointed|approved|conferred|ratified|produced|run|taught|measured|filled|constituted|instrumented|evidenced)/i,
  /\bdesign figure\b/i, /\binterim\b/i, /\bunexercised\b/i,
  // DESIGNED, NOT MEASURED — the same distinction `design figure` above
  // protects, in its other grammatical form. The College may not say a
  // level REACHES a CEFR band: nothing internal can establish where a
  // level is pitched, and no External Examiner has been appointed. So
  // "the band it is designed to reach" is the honest verb, and cutting
  // the hedge would manufacture the exact claim the site refuses to make.
  /\bdesigned to (?:reach|build toward)\b/i,
  /\bdoes not (hold|claim|guarantee|entitle)/i,
  /\bnobody has\b/i, /\bnone (has|have|of them)\b/i,
  /\bwill (be|say|change) .{0,24}when\b/i,
  // Arabic
  /(?<![؀-ۿݐ-ݿﭐ-﷿ﹰ-﻿])لم (يُ|تُ|ي|ت)/u, /(?<![؀-ۿݐ-ݿﭐ-﷿ﹰ-﻿])لا (تحمل|توجد|يوجد|شيء)/u, /(?<![؀-ۿݐ-ݿﭐ-﷿ﹰ-﻿])مبدئي/u,
  /(?<![؀-ۿݐ-ݿﭐ-﷿ﹰ-﻿])رقم تصميم/u, /(?<![؀-ۿݐ-ݿﭐ-﷿ﹰ-﻿])لم تُمارَس/u, /(?<![؀-ۿݐ-ݿﭐ-﷿ﹰ-﻿])لم تُدرَّس/u, /(?<![؀-ۿݐ-ݿﭐ-﷿ﹰ-﻿])لم تُمنح/u,
];

// ── DEAD: hedges a decision that has actually been taken ─────────────
const DEAD = [
  [/\bis designed to\b/gi,        'is / does'],
  [/\bare designed to\b/gi,       'are / do'],
  // NOT bare `work`. "The College expects the work to be yours" is a
  // noun followed by an infinitive, and it was reported as the College
  // hedging about its own effort. Only the conjugated verb hedges.
  [/\b(aims?|seeks?|strives?|works) to\b/gi, 'does'],
  [/\bwe work to\b/gi,            'does'],
  [/\bwe (hope|believe|feel|think)\b/gi, 'state it, or cut it'],
  [/\bshould be able to\b/gi,     'can'],
  [/\bmay be able to\b/gi,        'can'],
  [/\bwill be able to\b/gi,       'can'],
  // NOT `rather`. The first cut of this list matched it as a softener
  // and reported 100+ hits, nearly all of them "rather than" — which is
  // this site's strongest device, not a weakness: "published rather
  // than smoothed", "listed rather than omitted", "named rather than
  // gestured at". Antithesis that names what the College did NOT do is
  // the opposite of hedging, and a bulk edit on that pattern would have
  // gutted the best writing on the site.
  [/\b(quite|somewhat|fairly)\s+(a |an )?\w+/gi, 'cut the softener'],
  [/\bgenerally\b/gi,             'cut, or say when'],
  [/\btypically\b/gi,             'cut, or say when'],
  [/\barguably\b/gi,              'cut'],
  // REVIEW, not cut: "nothing is recorded as simply true" means
  // "merely true", and removing the word removes the point.
  [/\bsimply\b/gi,                'REVIEW in context'],
  [/\bjust\b/gi,                  'REVIEW in context'],
  [/\bit is worth noting that\b/gi, 'cut'],
  [/\bit should be noted that\b/gi, 'cut'],
  [/\bin order to\b/gi,           'to'],
  [/\bhelps? (you )?to\b/gi,      'does'],
  [/\bcan help\b/gi,              'does'],
  [/\bstrives?\b/gi,              'does'],
  [/\bendeavours?\b/gi,           'does'],
  // Arabic
  [/(?<![؀-ۿݐ-ݿﭐ-﷿ﹰ-﻿])نسعى(?![؀-ۿݐ-ݿﭐ-﷿ﹰ-﻿])/gu,                  'قرَّرت / تفعل'],
  [/(?<![؀-ۿݐ-ݿﭐ-﷿ﹰ-﻿])نأمل(?![؀-ۿݐ-ݿﭐ-﷿ﹰ-﻿])/gu,                  'اذكرها أو احذفها'],
  [/(?<![؀-ۿݐ-ݿﭐ-﷿ﹰ-﻿])يهدف إلى(?![؀-ۿݐ-ݿﭐ-﷿ﹰ-﻿])/gu,              'يفعل'],
  [/(?<![؀-ۿݐ-ݿﭐ-﷿ﹰ-﻿])تهدف إلى(?![؀-ۿݐ-ݿﭐ-﷿ﹰ-﻿])/gu,              'تفعل'],
  [/(?<![؀-ۿݐ-ݿﭐ-﷿ﹰ-﻿])بشكل عام(?![؀-ۿݐ-ݿﭐ-﷿ﹰ-﻿])/gu,              'احذف'],
  [/(?<![؀-ۿݐ-ݿﭐ-﷿ﹰ-﻿])عادةً ما(?![؀-ۿݐ-ݿﭐ-﷿ﹰ-﻿])/gu,              'احذف أو حدّد'],
];

// ── MACHINE: the register of a model rather than of a college ────────
const MACHINE = [
  [/\bdelve\b/gi, ''], [/\brobust\b/gi, ''],
  // The VERB is machine register; the NOUN is ordinary English, and
  // the site uses it in the sentence that carries the whole argument
  // for publishing the partner bands — "the buyer with the least
  // leverage is always the one who needed the help most".
  [/\b(?:leverages|leveraged|leveraging)\b|\bto leverage\b|\bleverage (?:our|its|their|the) \w+/gi, 'use'],
  [/\bseamless(ly)?\b/gi, ''], [/\bcutting[- ]edge\b/gi, ''],
  [/\bstate[- ]of[- ]the[- ]art\b/gi, ''], [/\bworld[- ]class\b/gi, ''],
  [/\bbest[- ]in[- ]class\b/gi, ''], [/\bunlock\b/gi, ''],
  [/\bempower(s|ing)?\b/gi, ''], [/\bjourney\b/gi, ''],
  [/\bvibrant\b/gi, ''], [/\bholistic\b/gi, ''], [/\bsynerg/gi, ''],
  [/\btailored\b/gi, ''], [/\bbespoke\b/gi, ''],
  [/\bin today'?s (world|market|economy)\b/gi, ''],
  [/\bfurthermore\b/gi, ''], [/\bmoreover\b/gi, ''],
  [/\badditionally\b/gi, ''],
  // The DISCOURSE MARKER opens a clause — ", that said, ...". A
  // relative clause does not: "a front matter that said otherwise"
  // is ordinary English and was being reported as machine register.
  [/(?:^|[,;—-]\s*)that (?:being )?said\s*[,.]/gi, ''],
  [/\bat the end of the day\b/gi, ''],
  [/\bcomprehensive\b/gi, 'say the size'],
  [/\bwide range of\b/gi, 'say how many'],
  [/\bvariety of\b/gi, 'say how many'],
];

const strip = (h) => h
  .replace(/<!--[\s\S]*?-->/g, ' ')          // authoring notes are not copy
  .replace(/<script[\s\S]*?<\/script>/gi, ' ')
  .replace(/<style[\s\S]*?<\/style>/gi, ' ');

const sentences = (text) => text.split(/(?<=[.!?؟])\s+|\n/).filter((s) => s.trim());

const files = readdirSync(PAGES).filter((f) => f.endsWith('.html')).sort();
// A HEADLINE THAT CONFLATES TWO VERDICTS IS A HEADLINE NOBODY ACTS ON.
// This file already distinguishes "cut this" from "look at this" — the
// remedy column has said REVIEW IN CONTEXT since the day `simply` was
// added, because "nothing is recorded as simply true" means MERELY true
// and losing the word loses the point. The count did not distinguish
// them, so the summary reported nineteen dead hedges on a site where
// every one of the nineteen had been read and kept. A register that
// overstates is read once.
let totals = { dead: 0, review: 0, machine: 0, load: 0 };
const rows = [];

for (const f of files) {
  const raw = strip(readFileSync(path.join(PAGES, f), 'utf8'));
  // Only the visible copy: text between tags.
  const visible = raw.replace(/<[^>]+>/g, '\n');
  let dead = 0, review = 0, machine = 0, load = 0;
  const hits = [];

  for (const s of sentences(visible)) {
    const isLoad = LOAD.some((re) => re.test(s));
    if (isLoad) { load++; continue; }
    for (const [re, fix] of DEAD) {
      const m = s.match(re);
      if (!m) continue;
      // The remedy names the verdict: anything the table itself sends
      // for a reading is counted as a reading, not as a cut.
      if (/^REVIEW/.test(fix)) { review += m.length; hits.push(['REVIEW', m[0].trim(), fix, s.trim().slice(0, 96)]); }
      else { dead += m.length; hits.push(['DEAD', m[0].trim(), fix, s.trim().slice(0, 96)]); }
    }
    for (const [re, fix] of MACHINE) {
      const m = s.match(re);
      if (m) { machine += m.length; hits.push(['MACHINE', m[0].trim(), fix, s.trim().slice(0, 96)]); }
    }
  }
  totals.dead += dead; totals.review += review;
  totals.machine += machine; totals.load += load;
  if (dead || review || machine) rows.push({ f, dead, review, machine, load, hits });
}

rows.sort((a, b) => (b.dead + b.machine) - (a.dead + a.machine) || b.review - a.review);
console.log(`${'page'.padEnd(30)}${'dead'.padStart(6)}${'review'.padStart(8)}${'machine'.padStart(9)}${'protected'.padStart(11)}`);
for (const r of rows) {
  console.log(`${r.f.padEnd(30)}${String(r.dead).padStart(6)}${String(r.review).padStart(8)}${String(r.machine).padStart(9)}${String(r.load).padStart(11)}`);
  if (SHOW_LINES) for (const [kind, hit, fix, ctx] of r.hits) {
    console.log(`   ${kind.padEnd(8)} "${hit}"${fix ? ` → ${fix}` : ''}\n      ${ctx}`);
  }
}
console.log(`\n${totals.dead} dead hedges to cut · ${totals.review} to read in context · ${totals.machine} machine phrases`);
console.log(`${totals.load} sentences carry a real disclosure and are LEFT ALONE.`);
