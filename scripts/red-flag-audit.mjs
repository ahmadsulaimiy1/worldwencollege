// scripts/red-flag-audit.mjs — the standing committees, with teeth.
//
// ─────────────────────────────────────────────────────────────────────
// WHY THIS IS CODE AND NOT A MEMO
// ─────────────────────────────────────────────────────────────────────
// A review committee that meets once produces a document that is out of
// date by the next commit. The instruction was for PERMANENT committees
// that continuously inspect the site, and the only version of that which
// survives contact with a working repository is a program: it runs, it
// reads the actual pages, it counts, and it names the file and the line.
//
// So each committee below is a function over the real page sources. It
// reports findings, each with a severity, a page, a locator and the
// evidence that produced it. Nothing here is an opinion about a page
// somebody remembers; every line of the register can be reopened at the
// file it points to.
//
// Run:  node scripts/red-flag-audit.mjs            (register to stdout)
//       node scripts/red-flag-audit.mjs --write    (also writes the docs)
//       node scripts/red-flag-audit.mjs editorial  (one committee)
//
// ─────────────────────────────────────────────────────────────────────
// WHAT THIS DELIBERATELY DOES NOT DO
// ─────────────────────────────────────────────────────────────────────
// It does not pass judgement on beauty. Elegance is not measurable and a
// script that claimed to measure it would be lying with numbers. What is
// measurable is the absence of craft: a wall of text, a page with no
// image, a heading level skipped, a sentence of sixty words, a hedge, a
// tap target too small for a thumb, the same paragraph on four pages.
// Every finding here is of that kind — a defect that can be pointed at.
// The judgement about what to make instead stays with whoever reads the
// register.
//
// The browser committees live in tests/browser/pillar-audit.mjs, which
// already opens every route at three widths in both directions. This
// file is the static half and cites that one rather than duplicating it.

import { readFileSync, readdirSync, writeFileSync, existsSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.dirname(path.dirname(fileURLToPath(import.meta.url)));
const PAGES = path.join(ROOT, 'pages');

// ─────────────────────────────────────────────────────────────────────
// THE REGISTER
// ─────────────────────────────────────────────────────────────────────
// Severity is about consequence to the reader, not about how much work
// the fix is:
//
//   BLOCKING  a reader cannot do the thing the page is for, or the page
//             tells them something untrue.
//   SEVERE    the page actively costs the institution authority — it
//             reads as unfinished, defensive, or machine-written.
//   MAJOR     the page works and reads below the standard: a wall of
//             text, a section with nothing to look at, a broken rhythm.
//   MINOR     a blemish a careful reader would notice.
const SEV = { BLOCKING: 0, SEVERE: 1, MAJOR: 2, MINOR: 3 };
const findings = [];
let committee = '';
const flag = (severity, page, what, evidence, remedy) => {
  findings.push({ committee, severity, page, what, evidence, remedy });
};

const en = readdirSync(PAGES).filter((f) => f.endsWith('.html') && !f.endsWith('.ar.html'));
const ar = readdirSync(PAGES).filter((f) => f.endsWith('.ar.html'));
const all = [...en, ...ar];
const src = new Map(all.map((f) => [f, readFileSync(path.join(PAGES, f), 'utf8')]));

const words = (s) => s.split(/\s+/).filter(Boolean).length;

/**
 * Visible prose only: markup, comments, scripts and styles removed.
 *
 * BLOCK BOUNDARIES ARE NOT WHITESPACE. Replacing every tag with a space
 * merges adjacent elements into one run, and a length committee reading
 * that run reports fiction: the Governance page was accused of a
 * 166-word sentence that was a governor's name, their doctorate, their
 * university and their term of office — four separate elements in a
 * table, joined by the stripper and then split by a full stop that
 * belonged to an abbreviation. A committee that invents its own evidence
 * is worse than no committee.
 *
 * So a closing block tag becomes a full stop where the text does not
 * already end in punctuation, which is what the element boundary
 * actually means to a reader.
 */
// BLOCK-LEVEL ONLY. <a> and <span> are inline: a link inside a sentence
// is part of it, and treating either as a boundary chops every sentence
// carrying a cross-reference into fragments — which would make the
// length committee under-report as badly as it was over-reporting.
const BLOCK = 'p|div|section|li|h[1-6]|td|th|tr|dt|dd|figcaption|blockquote|caption|summary|ul|ol|dl|table|thead|tbody|figure|aside|header|footer|nav|main';
function prose(html) {
  return html
    .replace(/<!--[\s\S]*?-->/g, ' ')
    .replace(/<(script|style|svg)\b[\s\S]*?<\/\1>/gi, ' ')
    .replace(new RegExp(`</(?:${BLOCK})>`, 'gi'), '')
    .replace(/<(?:br|hr)\s*\/?>/gi, '')
    .replace(/<[^>]+>/g, ' ')
    // A boundary that already has its own punctuation keeps it; one that
    // does not gets a full stop, because that is what the element break
    // was doing for the reader's eye.
    .replace(/\s*+\s*/g, (m, i, s) => (/[.!?:;،؛؟—–-]\s*$/.test(s.slice(Math.max(0, i - 3), i)) ? ' ' : '. '))
    .replace(/&mdash;/g, '—').replace(/&ndash;/g, '–')
    .replace(/&rsquo;/g, '’').replace(/&lsquo;/g, '‘')
    .replace(/&amp;/g, '&').replace(/&nbsp;/g, ' ')
    .replace(/&[a-z]+;/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

/**
 * Sentences, for length work. Abbreviations are not sentence ends.
 *
 * SCRIPT-AGNOSTIC, and it had to be corrected to become so. The first
 * version split on a full stop FOLLOWED BY A CAPITAL, which is a sound
 * heuristic for English and a catastrophe for Arabic: Arabic has no
 * capital letters, so no Arabic sentence ever ended, every Arabic page
 * came back as one sentence, and the committee reported a 2,601-word
 * sentence on /ar/about/ and a 1,871-word one on the Arabic Teaching
 * Practice page. Both were the whole page.
 *
 * A committee that only works in one of the College's two languages
 * would have handed back a register in which every Arabic page was the
 * worst page on the site, which is the opposite of useful — the reader
 * fixes the loudest finding first, and the loudest ones were fictional.
 * So the split is on terminal punctuation and whitespace alone, with the
 * Arabic question mark and full stop included.
 */
function sentences(text) {
  return text
    .replace(/\b(Mr|Mrs|Ms|Dr|Prof|St|No|vs|e\.g|i\.e|etc)\./g, '$1∙')
    .split(/(?<=[.!?؟۔])[\s]+/)
    .map((s) => s.replace(/∙/g, '.').trim())
    // A fragment of one or two words is a label, a folio or a stub left
    // by the block-boundary pass, not a sentence anybody wrote.
    .filter((s) => s.length > 1 && words(s) > 2);
}


// =====================================================================
// 1 · EDITORIAL EXCELLENCE COMMITTEE
// =====================================================================
// The brief: some copy still sounds machine-written, some does not flow,
// some pages are longer than the subject deserves. Those are three
// different defects and they are found three different ways.
function editorialExcellence() {
  committee = 'Editorial Excellence';

  // ── AI-SOUNDING CONSTRUCTIONS ─────────────────────────────────────
  // Not a style list. Every entry is a construction that a person
  // writing about their own institution does not reach for, and that a
  // language model reaches for constantly. The tell is not the word, it
  // is the SHAPE: the empty intensifier, the paired abstraction, the
  // "not merely X but Y" antithesis, the promise to "delve".
  const AI_SHAPES = [
    [/\bnot (?:merely|just|only) (?:a|an|the)\b[^.]{0,60}\bbut\b/gi, 'the "not merely X but Y" antithesis'],
    [/\bit(?:’|')s (?:not )?(?:worth noting|important to note)\b/gi, 'noting that something is worth noting'],
    [/\b(?:delve|dive) into\b/gi, 'delve/dive into'],
    [/\bin (?:today|the)(?:’|')?s (?:fast-paced|ever-(?:changing|evolving)|modern) world\b/gi, 'the world-is-changing opener'],
    [/\bunlock (?:your|the|their) (?:full )?potential\b/gi, 'unlock your potential'],
    [/\bembark on (?:a|your|the)\b/gi, 'embark on a journey'],
    [/\bat the (?:heart|core) of (?:this|our|the) (?:is|lies)\b/gi, 'at the heart of this lies'],
    [/\bseamless(?:ly)?\b/gi, '"seamless"'],
    [/\brobust\b/gi, '"robust"'],
    [/\bleverage[sd]?\b/gi, '"leverage" as a verb'],
    [/\bcutting[- ]edge\b/gi, '"cutting-edge"'],
    [/\bstate[- ]of[- ]the[- ]art\b/gi, '"state of the art"'],
    [/\bholistic\b/gi, '"holistic"'],
    [/\bcomprehensive (?:suite|range|array)\b/gi, 'a comprehensive suite of things'],
    [/\bwhether you(?:’|')?re\b[^.]{0,80}\bor\b/gi, 'the "whether you are X or Y" address'],
    [/\bmore than just\b/gi, 'more than just'],
    [/\btapestry\b/gi, '"tapestry"'],
    [/\btestament to\b/gi, '"a testament to"'],
    [/\bfoster(?:ing|s)? (?:a|an) (?:culture|environment|sense)\b/gi, 'fostering a culture'],
    [/\bempower(?:ing|s|ed)? (?:learners|students|you)\b/gi, 'empowering learners'],
    [/\bjourney\b/gi, '"journey" for a course of study'],
    [/\bworld[- ]class\b/gi, '"world-class" — an unbackable superlative'],
  ];
  for (const [f, body] of src) {
    const text = prose(body);
    for (const [re, name] of AI_SHAPES) {
      const hits = text.match(re);
      if (!hits) continue;
      flag(hits.length > 2 ? 'SEVERE' : 'MAJOR', f,
        `Machine register — ${name}`,
        `${hits.length}×: ${[...new Set(hits)].slice(0, 3).map((h) => `“${h.trim()}”`).join(', ')}`,
        'Rewrite in the first person of an institution describing what it does.');
    }
  }

  // ── SENTENCES NOBODY SPEAKS ───────────────────────────────────────
  // 45 words is not a rule of grammar, it is where a reader loses the
  // subject. The site's own voice runs long by design and that is part
  // of its authority; past 45 the authority becomes work.
  for (const [f, body] of src) {
    const long = sentences(prose(body)).filter((s) => words(s) > 45);
    if (!long.length) continue;
    const worst = long.reduce((a, b) => (words(b) > words(a) ? b : a));
    flag(long.length > 6 ? 'SEVERE' : 'MAJOR', f,
      `${long.length} sentence(s) over 45 words`,
      `longest is ${words(worst)}: “${worst.slice(0, 150)}…”`,
      'Split at the first conjunction that carries a new subject.');
  }

  // ── WALLS OF TEXT ─────────────────────────────────────────────────
  // A paragraph past ~110 words on a wide measure is a wall whatever it
  // says. Measured on the element, not the page, so the finding points
  // at the paragraph to break.
  for (const [f, body] of src) {
    const paras = [...body.matchAll(/<p\b[^>]*>([\s\S]*?)<\/p>/gi)]
      .map((m) => prose(m[1])).filter((t) => t.length);
    const walls = paras.filter((p) => words(p) > 110);
    if (!walls.length) continue;
    flag(walls.length > 3 ? 'SEVERE' : 'MAJOR', f,
      `${walls.length} paragraph(s) over 110 words`,
      `longest ${words(walls.reduce((a, b) => (words(b) > words(a) ? b : a)))} words`,
      'Break into two, or convert the enumeration inside it into a real list or a register.');
  }

  // ── THE SAME PARAGRAPH ON FOUR PAGES ──────────────────────────────
  // Boilerplate repeated across pages reads as a template, which is the
  // single clearest signal that nobody wrote the page. Partials are
  // excluded by construction: this reads pages/, not partials/.
  const seen = new Map();
  for (const [f, body] of src) {
    for (const m of body.matchAll(/<p\b[^>]*>([\s\S]*?)<\/p>/gi)) {
      const t = prose(m[1]);
      if (words(t) < 18) continue;
      const key = t.toLowerCase().replace(/[^a-z؀-ۿ ]/g, '');
      if (!seen.has(key)) seen.set(key, { text: t, pages: [] });
      seen.get(key).pages.push(f);
    }
  }
  // A TEMPLATE FAMILY IS NOT ACCIDENTAL DUPLICATION. The six level
  // pages are one generated series, and the paragraphs they share are
  // programme-wide facts — the instalment, how a lesson runs, that a
  // resit carries no fee. Each level page has to stand alone, because a
  // reader landing on Level IV must not have to hunt for the fee.
  //
  // This rule reported 39 findings, every one of them that series, and
  // its remedy — "write it afresh for each page" — would have produced
  // six variant statements of one fee policy. Six variants of a true
  // sentence is how a published figure drifts, which is the defect this
  // repository has paid for four times and the reason data/tuition.json
  // exists at all. So a paragraph shared ONLY within one generated
  // series is not a finding; a paragraph shared across pages that are
  // not a series still is, because that is the copy-paste this rule was
  // written to catch.
  const series = (fs) => {
    const stems = new Set(fs.map((f) => f.replace(/\.ar\.html$|\.html$/, '').replace(/-?\d+$/, '')));
    return stems.size === 1;
  };
  for (const { text, pages } of seen.values()) {
    const distinct = [...new Set(pages)];
    if (distinct.length < 3) continue;
    if (series(distinct)) continue;
    flag(distinct.length > 4 ? 'SEVERE' : 'MAJOR', distinct.join(', '),
      `One paragraph repeated verbatim on ${distinct.length} pages`,
      `“${text.slice(0, 120)}…”`,
      'Say it once where it belongs and link to it, or write it afresh for each page it appears on.');
  }

  // ── LENGTH AGAINST SUBJECT ────────────────────────────────────────
  // Not "long is bad". A page carrying 5,000 words of prose is a book
  // chapter, and a reader deciding where to spend a year's fees reads
  // the first screen and leaves. The threshold is set where the site's
  // own longest well-structured page sits, so this flags outliers
  // against the house rather than against a generic web maxim.
  const lengths = [...src].filter(([f]) => !f.endsWith('.ar.html'))
    .map(([f, b]) => [f, words(prose(b))]).sort((a, b) => b[1] - a[1]);
  // A PILLAR IS LONG ON PURPOSE. docs/information-architecture.html
  // retired thirty-seven URLs to consolidate the site into pillars, and
  // the contents rail is the answer to the length that produced — a
  // reader jumps to the leaf they came for rather than scrolling to it.
  // Flagging a pillar for being a pillar asks the site to undo a
  // deliberate architecture, so a page that carries a rail gets a
  // higher threshold. A page WITHOUT one has no such answer, and the
  // original threshold still applies to it.
  const RAIL = (b) => /data-contents="/.test(b);
  for (const [f, n] of lengths) {
    const body = src.get ? src.get(f) : (src.find((x) => x[0] === f) || [])[1];
    const floor = body && RAIL(body) ? 5600 : 3200;
    if (n < floor) continue;
    flag(n > 4500 ? 'SEVERE' : 'MAJOR', f,
      `${n} words on one page`,
      `${(n / 220).toFixed(0)} minutes of reading before the reader reaches the foot`,
      'Move a chapter to its own page, or reduce the prose to what only prose can carry '
      + 'and let a register, a table or a diagram hold the rest.');
  }
}

// =====================================================================
// 2 · INSTITUTIONAL CONFIDENCE COMMITTEE
// =====================================================================
// The standing instruction: the public site must present a complete
// institution. It must not narrate what has not been done, must not
// discuss accreditation where nothing turns on it, and must never read
// as a progress report to its own owner.
//
// This is the committee with the most to say, because the site was built
// under an earlier instruction that made disclosure a virtue in itself.
// Disclosure where a reader's money or decision turns on it stays. A
// running commentary on the institution's own unfinished business does
// not — it is an internal document leaking onto a public page.
function institutionalConfidence() {
  committee = 'Institutional Confidence';

  // ── ACCREDITATION, WHERE NOTHING TURNS ON IT ──────────────────────
  // Three pages carry it at length: the status section a reader is sent
  // to, the page where fees are paid, and the governance instrument.
  //
  // ONE MENTION IS NOT A FINDING, anywhere. A reader who asks the FAQ
  // "is it accredited?", a candidate reading the faculty register, a
  // student weighing what an award is worth — each is owed one plain
  // sentence and a link, and deleting it would be concealment rather
  // than confidence. The owner's instruction is to stop RAISING
  // accreditation where nothing turns on it, and a single answer to a
  // question the reader actually asked is not raising it. What this
  // committee is for is the page that returns to the subject two, four,
  // seven times — which is the institution volunteering its weakest
  // fact in a context that did not ask.
  const MAY_DISCUSS = new Set(['about.html', 'about.ar.html',
    'admissions-tuition.html', 'admissions-tuition.ar.html',
    'governance.html', 'governance.ar.html']);
  const ALLOWANCE = (f) => (MAY_DISCUSS.has(f) ? 4 : 1);
  for (const [f, body] of src) {
    // معتمد alone is not accreditation. It is the ordinary Arabic word
    // for "adopted" or "supported", and the bare stem made this
    // committee report seven accreditation mentions on the Arabic
    // tuition page where every one of them was a SUPPORTED CURRENCY —
    // "عملة واحدة معتمدة، وست غير معتمدة". A register that cries wolf
    // stops being read, which is the one failure an audit cannot
    // survive. So the Arabic side matches the academic collocations
    // only, and the English `accredit\w*` stem is unambiguous as it is.
    const AR_ACCREDITATION = /اعتماد\s*أكاديمي|الاعتماد\s*الأكاديمي|اعتماد[ًا]?\s*أكاديمي[ًا]?|جهة\s*اعتماد|لجنة\s*اعتماد|هيئة\s*اعتماد|شهادة\s*معتمدة|شهادات\s*معتمدة|غير\s*معتمدة\s*أكاديمي[ًا]?|لا\s*تحمل\s*(?:الكلية\s*)?(?:أي\s*)?اعتماد|بلا\s*اعتماد/g;
    const hits = [
      ...(prose(body).match(/accredit\w*/gi) || []),
      ...(prose(body).match(AR_ACCREDITATION) || []),
    ];
    if (!hits.length) continue;
    if (hits.length <= ALLOWANCE(f)) continue;
    flag(MAY_DISCUSS.has(f) ? 'MAJOR' : 'SEVERE', f,
      `Accreditation raised ${hits.length}× on a page that is not the status page`,
      `${[...new Set(hits)].slice(0, 4).join(', ')}`,
      MAY_DISCUSS.has(f)
        ? 'Reduce to one statement and link to the status section.'
        : 'Remove. Link to /about/#status where a reader needs it; say nothing where they do not.');
  }

  // ── THE PROGRESS REPORT ───────────────────────────────────────────
  // "has not yet", "does not yet", "is not running", "nobody has". Each
  // is the institution telling a prospective student about work in
  // progress. A mature college states what it does; where something is
  // provisional it says so once, in the register built for it.
  const NARRATING_INCOMPLETENESS = [
    /\b(?:has|have|had) not yet\b/gi,
    /\b(?:does|do) not yet\b/gi,
    /\bis not yet\b/gi,
    /\bnot yet (?:been|run|running|opened|applied|produced|recorded|appointed|adopted|met)\b/gi,
    /\bno(?:body|-one|\sone) has\b/gi,
    /\bhas not (?:been|obtained|appointed|opened|met|adopted|applied|produced)\b/gi,
    /\bwill be (?:added|produced|published|written) (?:later|in due course|when)\b/gi,
    /\bstill (?:to be|being) (?:written|produced|decided|built)\b/gi,
    /\bلم\s+(?:يُ|تُ|ي|ت)\w*\s+بعد\b/g,
    /\bليس\s+بعد\b/g,
  ];
  for (const [f, body] of src) {
    const text = prose(body);
    let n = 0; const samples = [];
    for (const re of NARRATING_INCOMPLETENESS) {
      const hits = text.match(re);
      if (hits) { n += hits.length; samples.push(...hits.slice(0, 2)); }
    }
    if (!n) continue;
    flag(n > 6 ? 'SEVERE' : n > 2 ? 'MAJOR' : 'MINOR', f,
      `${n} construction(s) narrating what has not happened`,
      [...new Set(samples)].slice(0, 4).map((s) => `“${s.trim()}”`).join(', '),
      'State what the College does. Where a fact bears on a decision, put it once in the '
      + 'status register and link to it.');
  }

  // ── THE OWNER'S BRIEF, VISIBLE ON THE PAGE ────────────────────────
  // The clearest instruction in the directive: the public site must not
  // read as a reply to its own commissioning. Any sentence that
  // describes the College's editorial process, its instructions to
  // itself, or what it decided not to do, belongs in docs/.
  const PROCESS_LEAK = [
    /\bthis (?:page|section|site) (?:was|has been) (?:written|prepared|revised|corrected)\b/gi,
    /\bthe (?:brief|directive|instruction) (?:asks|asked|requires|required)\b/gi,
    /\bearlier (?:draft|edition|version)\b/gi,
    /\bwe (?:were|are) (?:asked|instructed|told) to\b/gi,
    /\b(?:editorial|internal) (?:process|review|committee)\b/gi,
    /\bhas (?:not )?been reviewed by (?:anyone|nobody)\b/gi,
    /\bnothing here has been reviewed\b/gi,
    /\bwritten by (?:the )?people who\b/gi,
  ];
  for (const [f, body] of src) {
    // A REGISTER ROW IS NOT A PROCESS LEAK. "Internal Review Reports" is
    // the NAME of an evidence class in the quality register's table —
    // one of thirty-seven document types the College has to hold — and
    // naming it is the register doing its job. The rule is about prose
    // describing how a PAGE was made, so table cells are read out of it
    // before matching.
    const text = prose(body.replace(/<t[dh]\b[\s\S]*?<\/t[dh]>/gi, ' '));
    for (const re of PROCESS_LEAK) {
      const hits = text.match(re);
      if (!hits) continue;
      flag('SEVERE', f,
        'The College\'s own editorial process is on a public page',
        `${hits.length}×: ${[...new Set(hits)].slice(0, 2).map((h) => `“${h.trim()}”`).join(', ')}`,
        'Move to docs/. A reader deciding where to study is not the audience for how the '
        + 'page was made.');
    }
  }

  // ── HEDGING ───────────────────────────────────────────────────────
  // An institution that qualifies its own statements teaches the reader
  // to discount them. This is separate from truthfulness: a precise
  // claim needs no hedge, and a hedge is usually standing in for a
  // precise claim nobody made.
  const HEDGES = [
    /\b(?:we|the College) (?:believe|hope|aim|intend|expect|aspire)s? to\b/gi,
    /\b(?:should|ought to) (?:be able to|allow|enable)\b/gi,
    /\bmay (?:be|become|prove) (?:able|useful|helpful)\b/gi,
    /\bwhere possible\b/gi, /\bas far as possible\b/gi,
    /\bin (?:most|many) cases\b/gi, /\bgenerally speaking\b/gi,
    /\bwe (?:think|feel)\b/gi,
  ];
  for (const [f, body] of src) {
    const text = prose(body);
    let n = 0; const samples = [];
    for (const re of HEDGES) {
      const h = text.match(re);
      if (h) { n += h.length; samples.push(...h.slice(0, 2)); }
    }
    if (n < 2) continue;
    flag(n > 5 ? 'MAJOR' : 'MINOR', f, `${n} hedge(s)`,
      [...new Set(samples)].slice(0, 3).map((s) => `“${s.trim()}”`).join(', '),
      'Replace with the specific commitment, or delete the sentence.');
  }
}

// =====================================================================
// 3 · VISUAL STORYTELLING COMMITTEE
// =====================================================================
// A page of prose with no image is not restrained, it is unfinished —
// and the readers this College is addressing decide in the first screen.
// This counts what there is to LOOK at per thousand words.
function visualStorytelling() {
  committee = 'Visual Storytelling';

  for (const [f, body] of src) {
    const n = words(prose(body));
    if (n < 200) continue;
    const photos = (body.match(/<img\b/gi) || []).length;
    const plates = (body.match(/class="[^"]*\bplate\b/gi) || []).length;
    const diagrams = (body.match(/leaf__ornament|--leaf-plate|class="[^"]*\b(?:ascent|horarium|gauge|dial|chart)\b/gi) || []).length;
    const domes = (body.match(/badge-dome/gi) || []).length;
    const visual = photos + plates + diagrams;

    if (photos === 0 && n > 700) {
      flag(n > 2000 ? 'SEVERE' : 'MAJOR', f,
        `${n} words and no photograph`,
        `${plates} plates, ${diagrams} drawn devices, ${domes} domes — nothing photographic`,
        'Introduce one commissioned or licensed plate per major chapter. A reader scrolling '
        + 'a wall of type has nothing to rest on.');
    } else if (visual > 0 && n / visual > 900) {
      flag('MAJOR', f,
        `One visual per ${Math.round(n / visual)} words`,
        `${visual} visual element(s) across ${n} words`,
        'Aim for a visual anchor every ~500 words on a reading page.');
    }

    // Alt text that says nothing is alt text that is not there.
    for (const m of body.matchAll(/<img\b[^>]*\balt="([^"]*)"[^>]*>/gi)) {
      const alt = m[1].trim();
      if (!alt) continue; // deliberately decorative — correct
      if (words(alt) < 4 || /^(?:image|photo|picture|graphic)\b/i.test(alt)) {
        flag('MINOR', f, 'Alt text describes nothing',
          `alt="${alt}"`, 'Describe what is in the frame, for a reader who cannot see it.');
      }
    }
  }
}

// =====================================================================
// 4 · INFORMATION ARCHITECTURE COMMITTEE
// =====================================================================
function informationArchitecture() {
  committee = 'Information Architecture';

  // ── HEADING ORDER ─────────────────────────────────────────────────
  // A skipped level is a broken outline: it is how a screen reader gets
  // lost, and it is usually the symptom of a section that was pasted
  // rather than composed.
  for (const [f, body] of src) {
    const levels = [...body.matchAll(/<h([1-6])\b/gi)].map((m) => Number(m[1]));
    const skips = [];
    for (let i = 1; i < levels.length; i++) {
      if (levels[i] > levels[i - 1] + 1) skips.push(`h${levels[i - 1]}→h${levels[i]}`);
    }
    if (skips.length) {
      flag('MAJOR', f, `${skips.length} skipped heading level(s)`,
        skips.slice(0, 4).join(', '), 'Use the next level down, or promote the section.');
    }
    const h1 = levels.filter((l) => l === 1).length;
    if (h1 !== 1) {
      flag(h1 === 0 ? 'SEVERE' : 'MAJOR', f, `${h1} h1 elements`,
        `a page has exactly one subject`, 'One h1 per page; demote or promote the rest.');
    }
  }

  // ── DESTINATIONS NOTHING LINKS TO ─────────────────────────────────
  // The Library existed for weeks with nothing pointing at it, which is
  // the fault that produced scripts/build-library.mjs. This is that
  // check generalised: every served route must be reachable from at
  // least one other page.
  const manifest = JSON.parse(readFileSync(path.join(PAGES, 'manifest.json'), 'utf8'));
  const entries = Array.isArray(manifest) ? manifest : manifest.pages;
  const routes = entries.map((p) => `/${p.output.replace(/index\.html$/, '')}`);
  const linkText = [...src.values()].join('\n')
    + ['header.html', 'header.ar.html', 'footer.html', 'footer.ar.html',
      'topbar.html', 'topbar.ar.html']
      .map((p) => (existsSync(path.join(ROOT, 'partials', p))
        ? readFileSync(path.join(ROOT, 'partials', p), 'utf8') : '')).join('\n');
  for (const r of routes) {
    if (r === '/' || r === '/ar/' || r.includes('404')) continue;
    if (!linkText.includes(`href="${r}"`) && !linkText.includes(`href="${r}#`)) {
      flag('SEVERE', r, 'Route reachable only by typing the address',
        'no href to it in any page, header or footer',
        'Link it from its pillar, its nav panel, or the footer — or take it off the manifest.');
    }
  }

  // ── SECTIONS WITHOUT A CONTENTS ENTRY ─────────────────────────────
  // A long page's rail is how a reader decides whether to keep going. A
  // leaf missing from it is a chapter with no entry in the table of
  // contents.
  for (const [f, body] of src) {
    const leaves = [...body.matchAll(/<section[^>]*class="[^"]*\bleaf\b[^"]*"[^>]*>/gi)];
    if (leaves.length < 3) continue;
    const unlisted = leaves.filter((m) => !/data-contents=/.test(m[0])).length;
    if (unlisted) {
      flag('MAJOR', f, `${unlisted} of ${leaves.length} leaves absent from the contents rail`,
        'section.leaf without data-contents',
        'Give every leaf a data-contents label, or demote it below leaf rank.');
    }
  }
}

// =====================================================================
// 5 · MATERIAL LAW COMMITTEE  (CLAUDE.md §2)
// =====================================================================
// The house rule is that every major shape is a struck object. This
// counts the shapes against the marks, per page, so a flat component
// shipped beside the atelier layer is named rather than discovered a
// month later.
function materialLaw() {
  committee = 'Material Law';

  for (const [f, body] of src) {
    const cards = (body.match(/<div class="card[^"]*"/g) || []);
    if (!cards.length) continue;
    const bare = cards.filter((c) => !c.includes('aurum'));
    if (bare.length) {
      flag('MAJOR', f, `${bare.length} of ${cards.length} cards carry no travelling light`,
        'a .card without .aurum', 'Add .aurum, .edge-lit, .tilt and .reveal — CLAUDE.md §2.');
    }
    // COUNT ELEMENTS, NOT SUBSTRINGS. This counted occurrences of the
    // string "badge-dome", and every large dome contains it twice —
    // `badge-dome badge-dome--lg` — while a dark one contains it three
    // times. So a page on which EVERY dome was already the large size
    // scored 30 of 66 and was reported as two thirds undersized. All
    // twelve level pages, the accessibility page and the privacy page
    // were flagged for a defect none of them had.
    //
    // The fourth counting fault found in this file, and the lesson is
    // the same each time: an audit that reports work nobody needs to do
    // costs more than no audit, because the next real finding is read
    // as one more false alarm.
    const domeEls = (body.match(/class="[^"]*\bbadge-dome\b[^"]*"/g) || []);
    const small = domeEls.filter((c) => !/\bbadge-dome--lg\b/.test(c));
    if (domeEls.length && small.length / domeEls.length > 0.5) {
      flag('MINOR', f, `${small.length} of ${domeEls.length} domes are the small size`,
        'badge-dome without --lg',
        'A dome anchoring a card is 106px. Small icons read as an admin panel — CLAUDE.md §2.');
    }
  }

  // Unfinished work may never wear a tick — the defect that was live on
  // four pages. #i-struck is settled; #i-ring is outstanding.
  for (const [f, body] of src) {
    for (const m of body.matchAll(/<li\b[^>]*>[\s\S]{0,240}?<\/li>/gi)) {
      const li = m[0];
      if (!/#i-struck/.test(li)) continue;
      if (/\bnot (?:yet|appointed|obtained|adopted|held|awarded)\b|\bnone\b|\bno\b\s*(?:—|-)/i.test(prose(li))) {
        flag('BLOCKING', f, 'Outstanding work wearing a tick',
          `“${prose(li).slice(0, 90)}…”`,
          'Use #i-ring. CLAUDE.md §5 — nothing unfinished may wear a tick.');
      }
    }
  }
}

// =====================================================================
// 6 · TYPOGRAPHY COMMITTEE
// =====================================================================
// The static half only. Measure — line length in characters, the real
// rendered scale — is the browser committee's work; what can be read off
// the stylesheets is the shape of the system, and the shape is where a
// typographic programme is either coherent or a collection.
function typography() {
  committee = 'Typography';

  const css = readdirSync(path.join(ROOT, 'css')).filter((f) => f.endsWith('.css'));
  const sheets = new Map(css.map((f) => [f, readFileSync(path.join(ROOT, 'css', f), 'utf8')]));
  const joined = [...sheets.values()].join('\n');

  // How many distinct families are actually asked for.
  const families = new Set();
  for (const m of joined.matchAll(/font-family:\s*([^;}]+)/gi)) {
    const first = m[1].split(',')[0].trim().replace(/^["']|["']$/g, '');
    if (first && !first.startsWith('var(') && !/^(?:inherit|initial|unset)$/.test(first)) {
      families.add(first);
    }
  }
  if (families.size > 4) {
    flag('MAJOR', 'css/', `${families.size} distinct type families declared`,
      [...families].slice(0, 8).join(', '),
      'A typographic programme is two families and a monospace. More than that is a '
      + 'collection, and it is visible.');
  }

  // Hard-coded sizes outside the scale. A scale that is bypassed is not
  // a scale, and the bypasses are what make a page feel assembled.
  const hardSizes = new Set();
  for (const [f, body] of sheets) {
    for (const m of body.matchAll(/font-size:\s*(\d+(?:\.\d+)?)(px|rem)\b/gi)) {
      if (m[2] === 'px' && Number(m[1]) > 0) hardSizes.add(`${f}:${m[1]}px`);
    }
  }
  if (hardSizes.size > 12) {
    flag('MAJOR', 'css/', `${hardSizes.size} pixel font-sizes outside the fluid scale`,
      [...hardSizes].slice(0, 6).join(', '),
      'Move to clamp() steps on a named scale so the ramp holds at every viewport.');
  }

  // A body measure wider than ~78 characters is a measure a reader loses
  // their place in, whatever the face.
  const measures = [...joined.matchAll(/max-width:\s*(\d+)ch\b/gi)].map((m) => Number(m[1]));
  const wide = measures.filter((n) => n > 78);
  if (wide.length) {
    flag('MINOR', 'css/', `${wide.length} declared measure(s) over 78ch`,
      wide.join(', ') + 'ch', 'Body prose reads best between 62 and 74 characters.');
  }
}

// =====================================================================
// 7 · MOTION COMMITTEE
// =====================================================================
function motion() {
  committee = 'Motion';

  const cssFiles = readdirSync(path.join(ROOT, 'css')).filter((f) => f.endsWith('.css'));

  // Every animation needs a reduced-motion carve-out that resolves to
  // the FINISHED state — never a hidden element. CLAUDE.md §2.
  //
  // CHECKED PER FILE AND BY PRESENCE, not by keyframe name — and the
  // first version of this check is the reason for the caveat. It looked
  // for each @keyframes NAME inside the reduced-motion blocks and
  // reported six atelier animations as uncarved, when every one of them
  // is stopped correctly: the carve-out sets `animation: none` on the
  // CONSUMING selectors (.lumen::after, .aurum::after …), which is the
  // right way to write it and never repeats the keyframe's name. A
  // static check cannot map selector to animation without a cascade
  // engine, so it claims only what it can know: a file that declares
  // keyframes and contains no reduced-motion block at all has made no
  // provision anywhere. Whether a provision actually resolves to the
  // finished state is the render harness's question, not this one's.
  for (const f of cssFiles) {
    const body = readFileSync(path.join(ROOT, 'css', f), 'utf8');
    const kf = (body.match(/@keyframes\s+[A-Za-z0-9_-]+/g) || []).length;
    if (kf && !/prefers-reduced-motion/.test(body)) {
      flag('MAJOR', `css/${f}`, `${kf} keyframe animation(s) and no reduced-motion block in the file`,
        'no @media (prefers-reduced-motion: reduce) anywhere',
        'Stop each consumer at its finished state — never a hidden element. CLAUDE.md §2.');
    }
  }

  // A struck surface with no voice reads as a bug — CLAUDE.md §3.
  const sonics = existsSync(path.join(ROOT, 'js/sonics.js'))
    ? readFileSync(path.join(ROOT, 'js/sonics.js'), 'utf8') : '';
  const struck = new Set();
  for (const body of src.values()) {
    for (const m of body.matchAll(/class="([^"]*\baurum\b[^"]*)"/g)) {
      const cls = m[1].split(/\s+/).find((c) => !/^(aurum|aurum--\w+|edge-lit|edge-lit--light|tilt|reveal|gold-live|grain|guilloche|is-open)$/.test(c));
      if (cls) struck.add(cls);
    }
  }
  const silent = [...struck].filter((c) => !sonics.includes(`.${c}`));
  if (silent.length) {
    flag('MINOR', 'js/sonics.js', `${silent.length} struck component(s) absent from the sonics register`,
      silent.slice(0, 8).join(', '),
      'Add to the TAP or SEAL selector list — a silent struck surface reads as a fault. §3.');
  }

}

// =====================================================================
// 8 · BILINGUAL PARITY COMMITTEE
// =====================================================================
// Delegates the component count to scripts/parity-audit.mjs and checks
// the thing that audit cannot: that the Arabic edition is not simply
// shorter prose wearing the same structure.
function bilingualParity() {
  committee = 'Bilingual Parity';

  for (const f of en) {
    const twin = f.replace(/\.html$/, '.ar.html');
    if (!src.has(twin)) {
      flag('BLOCKING', f, 'No Arabic edition', 'CLAUDE.md §4 — they ship together',
        'Write the Arabic twin.');
      continue;
    }
    const e = words(prose(src.get(f)));
    const a = words(prose(src.get(twin)));
    // Arabic is denser than English — roughly 0.8 words for the same
    // content — so the floor is set at 0.62 to catch a genuinely thinner
    // edition rather than a well-translated one.
    if (e > 300 && a / e < 0.62) {
      flag('SEVERE', twin, `Arabic edition is ${Math.round((a / e) * 100)}% the length of its English twin`,
        `${a} words against ${e}`,
        'Translate the missing argument, do not summarise it. The Arabic reader is the one '
        + 'likeliest to be weighing this against a year of fees.');
    }
  }
}

// =====================================================================
// THE REGISTER
// =====================================================================
const COMMITTEES = {
  editorial: editorialExcellence,
  confidence: institutionalConfidence,
  visual: visualStorytelling,
  architecture: informationArchitecture,
  material: materialLaw,
  typography,
  motion,
  parity: bilingualParity,
};

const only = process.argv.slice(2).find((a) => !a.startsWith('--'));
for (const [name, fn] of Object.entries(COMMITTEES)) {
  if (only && name !== only) continue;
  fn();
}

findings.sort((a, b) => SEV[a.severity] - SEV[b.severity]
  || a.committee.localeCompare(b.committee) || String(a.page).localeCompare(String(b.page)));

const counts = findings.reduce((acc, f) => {
  acc[f.severity] = (acc[f.severity] || 0) + 1; return acc;
}, {});
const byCommittee = findings.reduce((acc, f) => {
  acc[f.committee] = (acc[f.committee] || 0) + 1; return acc;
}, {});

let out = `# The Red Flag Register

Generated by \`node scripts/red-flag-audit.mjs\`. Every line points at a
file that can be reopened. Nothing here is an opinion about a page
somebody remembers.

**${findings.length} findings** — `
  + Object.keys(SEV).filter((s) => counts[s]).map((s) => `${counts[s]} ${s.toLowerCase()}`).join(', ')
  + `

| Committee | Findings |
|---|---:|
`
  + Object.entries(byCommittee).sort((a, b) => b[1] - a[1])
    .map(([c, n]) => `| ${c} | ${n} |`).join('\n')
  + '\n';

for (const sev of Object.keys(SEV)) {
  const group = findings.filter((f) => f.severity === sev);
  if (!group.length) continue;
  out += `\n## ${sev} — ${group.length}\n`;
  let lastCommittee = '';
  for (const f of group) {
    if (f.committee !== lastCommittee) { out += `\n### ${f.committee}\n\n`; lastCommittee = f.committee; }
    out += `- **${f.page}** — ${f.what}\n  - ${f.evidence}\n  - → ${f.remedy}\n`;
  }
}

console.log(out);
if (process.argv.includes('--write')) {
  writeFileSync(path.join(ROOT, 'docs/red-flag-register.md'), out);
  writeFileSync(path.join(ROOT, 'data/red-flags.json'),
    `${JSON.stringify({ generated: findings.length, counts, byCommittee, findings }, null, 2)}\n`);
  console.error('written: docs/red-flag-register.md, data/red-flags.json');
}
