/**
 * THE APPARATUS — everything the volume knows about itself.
 *
 * ────────────────────────────────────────────────────────────────────
 * WHAT THIS FILE IS FOR
 * ────────────────────────────────────────────────────────────────────
 * The indexes in indexes.mjs answer "where is the thing I need". This
 * file answers the four questions a reader asks next:
 *
 *   What does this word mean?            → the glossary
 *   What does this lesson build on?      → the cross-reference system
 *   Where else is this strand taught?    → the routes
 *   Where is this sound drilled?         → the pronunciation strand
 *
 * ────────────────────────────────────────────────────────────────────
 * THE RULE EVERY FUNCTION HERE OBEYS
 * ────────────────────────────────────────────────────────────────────
 * Nothing is invented. Every reference is EXTRACTED from text the
 * curriculum already wrote, and every extraction is countable, so a
 * claim made in the printed apparatus can be checked against the source
 * rather than believed.
 *
 * The glossary is the one place that needed care, because a definition
 * is written rather than extracted. The rule applied there: a headword
 * earns its place only if the curriculum actually uses the term, the
 * count and first use are printed beside it so the reader can verify
 * that, and the definition states what the term means IN THE FIELD —
 * never what this College does with it, which would be an institutional
 * claim wearing a lexicographer's coat.
 */

/** LEVEL.MODULE.ITEM, the house reference. */
const refOf = (lv, mod, item) => `${lv.roman}.${mod.sequence}.${item.sequence}`;

export const walk = (C) => C.levels.flatMap((lv) =>
  lv.modules.flatMap((mod) => mod.lessons.map((item) => ({ lv, mod, item, ref: refOf(lv, mod, item) }))));

const stageText = (item, icon) => {
  const s = item.stages.find((st) => st.icon === icon);
  return s ? s.parts.map((p) => p.text).join(' ').trim() : null;
};

// ─────────────────────────────────────────────────────────────────────
// 1 · THE CROSS-REFERENCE SYSTEM
// ─────────────────────────────────────────────────────────────────────

/**
 * Every teaching lesson opens with a PREREQUISITE KNOWLEDGE stage, and
 * 102 of the 114 of them name a module by number:
 *
 *   "Level II, Module 1 (past simple narration); Level I, Module 7
 *    (irregular past participles overlap partly with irregular past
 *    simple forms)."
 *
 * Those are real cross-references. They have always been in the book,
 * written as prose, which means the spiral structure of the programme
 * was present and invisible: a reader could see that THIS lesson builds
 * on Module 7, but never that Module 7 is returned to from six later
 * lessons across three levels.
 *
 * ────────────────────────────────────────────────────────────────────
 * THE SCANNER, AND THE ONE THING IT HAS TO GET RIGHT
 * ────────────────────────────────────────────────────────────────────
 * A level named once governs the modules that follow it until another
 * level is named:
 *
 *   "Level V, Module 3 (inversion for emphasis) and Module 4 (hedging)"
 *
 * The second reference is to Level V, Module 4 — not to Module 4 of the
 * lesson's own level. So the scanner carries a level context, seeded
 * with the lesson's own level and updated whenever "Level X" appears.
 * Reading each reference independently would have mis-filed 82 of the
 * 191 references in the book, all of them cross-level, which are
 * precisely the interesting ones.
 *
 * The prose is never replaced. The cross-references are printed
 * ALONGSIDE the stage, as apparatus, because the parenthetical gloss
 * the author wrote ("irregular past participles overlap partly with
 * irregular past simple forms") says more than a reference can and
 * deleting it to make room for structure would be a net loss.
 */
const REF_TOKEN = /\b(?:Level\s+(I{1,3}|IV|VI?)\b[,\s]*)?(?:(Modules?)\s+(\d{1,2})|(Lesson)\s+(\d{1,2})\.(\d{1,2}))/g;

/** Parse one passage of prose into structured references. */
export function referencesIn(text, ownLevel) {
  if (!text) return [];
  let level = ownLevel;
  const out = [];
  for (const m of text.matchAll(REF_TOKEN)) {
    if (m[1]) level = m[1];
    const after = text.slice(m.index + m[0].length);
    const gloss = after.match(/^\s*\(([^)]{2,140})\)/);
    if (m[2]) {
      out.push({ kind: 'module', level, module: Number(m[3]), item: null,
        ref: `${level}.${Number(m[3])}`, gloss: gloss ? gloss[1] : null });
    } else {
      out.push({ kind: 'item', level, module: Number(m[5]), item: Number(m[6]),
        ref: `${level}.${Number(m[5])}.${Number(m[6])}`, gloss: gloss ? gloss[1] : null });
    }
  }
  // A lesson naming the same module twice gets one reference.
  const seen = new Set();
  return out.filter((r) => (seen.has(r.ref) ? false : seen.add(r.ref)));
}

/**
 * The whole cross-reference graph.
 *
 * `forward` — what each lesson declares it builds on.
 * `back`    — for each module, the later lessons that name it. This is
 *             the direction the book could not previously show, and it
 *             is the one that demonstrates the programme spirals rather
 *             than merely asserting it.
 */
export function crossReferences(C) {
  const forward = new Map();
  const back = new Map();
  for (const { lv, mod, item, ref } of walk(C)) {
    const refs = referencesIn(stageText(item, 'prereq'), lv.roman);
    if (!refs.length) continue;
    forward.set(ref, refs);
    for (const r of refs) {
      const key = `${r.level}.${r.module}`;
      // A lesson pointing back inside its own module is a recap, not a
      // cross-reference; counting it would inflate every module's
      // return count by its own lessons and say nothing.
      if (key === `${lv.roman}.${mod.sequence}`) continue;
      if (!back.has(key)) back.set(key, []);
      back.get(key).push(ref);
    }
  }
  return { forward, back };
}

/**
 * The revision route: where each lesson's REVISION stage sends the
 * class back to.
 *
 * REVISION is a named stage in 113 of the 114 teaching lessons, and it
 * names its target in prose: "This lesson opens with the Lesson 2.1
 * floor-plan homework recap." Extracted, it becomes the one thing a
 * teacher preparing a catch-up session actually needs.
 */
export function revisionRoute(C) {
  return walk(C).map(({ lv, mod, item, ref }) => {
    const text = stageText(item, 'revision');
    if (!text) return null;
    return { ref, lv, mod, item, targets: referencesIn(text, lv.roman), text };
  }).filter(Boolean);
}

// ─────────────────────────────────────────────────────────────────────
// 2 · THE ROUTES
// ─────────────────────────────────────────────────────────────────────

/**
 * THE ROUTES, AND THE FINDING THAT REPLACED MOST OF THEM.
 *
 * ────────────────────────────────────────────────────────────────────
 * WHAT WAS BUILT FIRST, AND WHY IT WAS THROWN AWAY
 * ────────────────────────────────────────────────────────────────────
 * The first version of this section printed four routes — vocabulary,
 * communication, reading and writing, examination — as four tables of
 * lesson references. Set, they were identical. Every row of every level
 * read 1.2 1.3 · 2.2 2.3 · 3.2 3.3, four times over, across four pages.
 *
 * The reason is the best thing about this curriculum. Twelve named
 * stages occur in all 114 teaching lessons, vocabulary, listening,
 * writing and pronunciation among them, so a filter on any of those
 * strands selects the whole book. A vocabulary route through this
 * programme IS the contents list.
 *
 * That is a finding, not a defect, and printing four indistinguishable
 * tables would have buried it under apparatus. So the routes are now
 * DECLARED and then VERIFIED — the same discipline the glossary uses on
 * its headwords — and a route prints only if it actually selects a
 * proper subset. The ones that do not are reported by name, with their
 * coverage, which tells the reader far more in four lines than four
 * pages of references did.
 *
 * ────────────────────────────────────────────────────────────────────
 * WHY THERE IS NO GRAMMAR ROUTE
 * ────────────────────────────────────────────────────────────────────
 * A grammar route was asked for and is not here. The first draft of the
 * printed explanation said the curriculum names no grammar stage, which
 * was written from memory of the stage tally and was wrong: it names
 * one, GRAMMAR CONSOLIDATED ACROSS LEVEL VI, at VI.10.1. A test caught
 * it. One stage in 294 items is not a strand to filter on, and it is a
 * revision summary of what Level VI has already taught rather than a
 * place where grammar is introduced — so the conclusion holds and the
 * sentence had to change.
 *
 * `grammarStages()` finds them rather than the prose asserting a
 * number, so the claim is recomputed on every build and cannot go stale
 * if the curriculum acquires more.
 *
 * Building a real grammar route would mean reading 294 lessons and
 * deciding which of the language points they teach counts as grammar —
 * a subject-matter judgement, made by an editor, printed as though the
 * curriculum had made it. Every route here is a filter anyone can
 * re-run and check. That one would have been an opinion in the same
 * typeface, and the difference would be invisible.
 *
 * It is recorded in the Internal Editorial Bible for the Board of
 * Academic Standards and Curriculum Excellence, which is the body that
 * can make that judgement properly.
 */

/** Every stage in the programme whose name begins with GRAMMAR. */
export function grammarStages(C) {
  return walk(C).flatMap(({ item, ref }) => item.stages
    .filter((s) => s.head && /^GRAMMAR\b/i.test(s.head))
    .map((s) => ({ ref, head: s.head })));
}

/** The lessons that carry the full house structure — the population a
 *  strand route selects from. Module-overview items and assessed items
 *  are excluded because they were never meant to carry every stage, and
 *  including them would make every route look selective for the wrong
 *  reason. */
const houseLessons = (C) => walk(C).filter(({ item }) =>
  item.stages.some((s) => s.icon === 'objectives'));

/** Above this share of the house lessons, a route is the book. */
const UNIVERSAL_AT = 0.95;

export const ROUTE_SPECS = [
  { key: 'vocabulary', name: 'The vocabulary route',
    heads: /VOCAB|PHRASE|PHRASAL|COLLOCATION|DISCOURSE/,
    blurb: 'Lessons carrying a named vocabulary stage — key vocabulary, key phrases, phrasal '
      + 'verbs and collocations, discourse markers, or vocabulary reinforcement.' },
  { key: 'communication', name: 'The communication route',
    heads: /SPEAKING|LISTENING/,
    blurb: 'Lessons carrying a named speaking or listening stage: production and reception in '
      + 'real time.' },
  { key: 'literacy', name: 'The reading and writing route',
    heads: /READING ACTIVITY|WRITING TASK/,
    blurb: 'Lessons carrying a named reading or writing stage.' },
  { key: 'pronunciation', name: 'The pronunciation route',
    heads: /PRONUNCIATION/,
    blurb: 'Lessons carrying a named pronunciation stage.' },
  // Over every item, not only the house lessons. The collocation and
  // discourse-marker stages sit on the module-overview items, so a
  // route scoped to the teaching lessons selected none of them — which
  // read as "this strand does not exist" rather than "you are counting
  // in the wrong place". Caught by printing the coverage rather than
  // trusting the filter.
  { key: 'lexis', name: 'The collocation and discourse route', over: 'all',
    heads: /PHRASAL VERBS|COLLOCATIONS|DISCOURSE MARKERS/,
    blurb: 'Items that teach language as chunks rather than as words: phrasal verbs, '
      + 'collocations and the discourse markers that hold an argument together. These are set out '
      + 'in the module overviews rather than inside the teaching lessons, which is why they are '
      + 'easy to miss when reading straight through.' },
];

/**
 * Build one route, and report what share of the house lessons it takes.
 * `selective` is the flag the printer uses to decide whether the route
 * is worth a table.
 */
export function route(C, spec) {
  const pool = spec.over === 'all' ? walk(C) : houseLessons(C);
  const hits = pool.filter(({ item }) =>
    item.stages.some((s) => s.head && spec.heads.test(s.head)));
  const byLevel = new Map();
  for (const h of hits) {
    if (!byLevel.has(h.lv.roman)) byLevel.set(h.lv.roman, { lv: h.lv, mods: new Map() });
    const g = byLevel.get(h.lv.roman);
    if (!g.mods.has(h.mod.sequence)) g.mods.set(h.mod.sequence, { mod: h.mod, refs: [] });
    g.mods.get(h.mod.sequence).refs.push(`${h.mod.sequence}.${h.item.sequence}`);
  }
  const coverage = hits.length / (pool.length || 1);

  // A route whose hits all sit at the same position inside their
  // module is not a path through the lessons — it is a property of the
  // modules, and a six-row table of it prints the same reference sixty
  // times. The collocation strand is exactly that: it lives in the
  // module-overview item of 56 of the 60 modules, which is one sentence
  // and four exceptions rather than a page of references.
  const positions = new Set(hits.map((h) => h.item.sequence));
  const seen = new Set(hits.map((h) => `${h.lv.roman}.${h.mod.sequence}`));
  const missingModules = C.levels.flatMap((lv) => lv.modules
    .filter((m) => !seen.has(`${lv.roman}.${m.sequence}`))
    .map((m) => ({ ref: `${lv.roman}.${m.sequence}`, title: m.title })));

  return { ...spec, total: hits.length, pool: pool.length, coverage,
    selective: coverage < UNIVERSAL_AT,
    perModule: positions.size === 1,
    modules: seen.size, missingModules,
    levels: [...byLevel.values()].map((g) => ({ lv: g.lv, mods: [...g.mods.values()] })) };
}

/** All declared routes, split into the ones worth printing and the ones
 *  whose coverage is the finding. */
export function routes(C) {
  const all = ROUTE_SPECS.map((s) => route(C, s));
  // A route with no hits is not selective, it is broken, and printing
  // an empty table would present a filter bug as a curriculum gap.
  return { printed: all.filter((r) => r.selective && r.total > 0),
    universal: all.filter((r) => !r.selective),
    empty: all.filter((r) => r.total === 0),
    pool: houseLessons(C).length };
}

/**
 * THE REVISION ROUTE — the one a learner actually needs before a quiz.
 *
 * Grouped by module, because that is the unit an assessment covers: for
 * each module, every reference its lessons' REVISION and PREREQUISITE
 * stages send the class back to. Nothing here is chosen; it is the
 * union of what the module's own lessons already say.
 */
export function revisionByModule(C) {
  const out = [];
  for (const lv of C.levels) {
    const rows = [];
    for (const mod of lv.modules) {
      const own = `${lv.roman}.${mod.sequence}`;
      const targets = new Set();
      for (const item of mod.lessons) {
        const rv = stageText(item, 'revision');
        const pq = stageText(item, 'prereq');
        for (const r of [...referencesIn(rv, lv.roman), ...referencesIn(pq, lv.roman)]) {
          // A reference inside this module is a recap of the lesson
          // before it, which the reader is already holding. What a
          // revision route is for is everything OUTSIDE the module.
          if (`${r.level}.${r.module}` !== own) targets.add(`${r.level}.${r.module}`);
        }
      }
      const quiz = mod.lessons.find((x) => x.kind === 'quiz');
      const asg = mod.lessons.find((x) => x.kind === 'assignment');
      rows.push({ module: mod.sequence, title: mod.title,
        targets: [...targets],
        quizRef: quiz ? `${own}.${quiz.sequence}` : null,
        asgRef: asg ? `${own}.${asg.sequence}` : null });
    }
    out.push({ lv, rows });
  }
  return out;
}

// ─────────────────────────────────────────────────────────────────────
// 3 · THE PRONUNCIATION STRAND
// ─────────────────────────────────────────────────────────────────────

/**
 * PRONUNCIATION PRACTICE is a named stage in 114 lessons, with a median
 * designed timing of five minutes. Meeting it lesson by lesson, a
 * teacher has no way to see the strand — that /θ/ is introduced in the
 * second module of the first level and that connected speech is not
 * reached until the second.
 *
 * Every focus below is the curriculum's own sentence, printed whole.
 * The strand was authored; it had simply never been collected.
 */
export function pronunciationStrand(C) {
  return C.levels.map((lv) => ({
    lv,
    rows: lv.modules.flatMap((mod) => mod.lessons.map((item) => {
      const s = item.stages.find((st) => st.icon === 'pronunciation');
      if (!s) return null;
      return { ref: refOf(lv, mod, item), module: mod.sequence,
        timing: s.timing, focus: s.parts.map((p) => p.text).join(' ').trim() };
    }).filter(Boolean)),
  })).filter((g) => g.rows.length);
}

// ─────────────────────────────────────────────────────────────────────
// 4 · THE PULL QUOTES
// ─────────────────────────────────────────────────────────────────────

/**
 * EXTRACTED, NEVER WRITTEN.
 *
 * ────────────────────────────────────────────────────────────────────
 * The brief for this pass was explicit: pull quotes taken from existing
 * curriculum content, not newly written inspirational quotations. That
 * rules out the entire conventional practice of the form — an editor
 * choosing a sentence for its ring — and leaves one question worth
 * answering: does the curriculum contain sentences that stand alone?
 *
 * It does, in exactly one place. The CRITICAL THINKING / DISCUSSION
 * PROMPT stage of most lessons from Level II upward is written as a
 * quoted question put to the class:
 *
 *   "Is the fastest way to travel always the best way? What else
 *    matters besides speed?"
 *
 * Those are already quotations, already self-contained, already in the
 * curriculum's own voice, and each carries a reference so a reader can
 * find the lesson it came from. Nothing is chosen for effect: the first
 * qualifying prompt in each module is taken.
 *
 * ────────────────────────────────────────────────────────────────────
 * WHY LEVEL I HAS NONE, AND WHY THAT IS LEFT ALONE
 * ────────────────────────────────────────────────────────────────────
 * Level I's prompts are written for learners who have three hundred
 * words of English: "Look at two rooms in the picture. Which is a
 * kitchen? How do you know?" They are instructions with a question
 * inside them rather than questions, and lifting one out of its picture
 * would produce a pull quote that does not make sense on its own.
 *
 * So Level I's module openers carry no pull quote. The alternative was
 * to relax the rule until something qualified, which is how extraction
 * quietly becomes selection.
 */
export function pullQuotes(C) {
  const out = new Map();
  for (const { lv, mod, item, ref } of walk(C)) {
    const key = `${lv.roman}.${mod.sequence}`;
    if (out.has(key)) continue;
    const text = stageText(item, 'thinking');
    if (!text) continue;
    const m = text.match(/^["“]([^"“”]{80,240})["”]/);
    if (!m) continue;
    const quote = m[1].trim();
    if (!/\?$/.test(quote)) continue;
    out.set(key, { ref, quote });
  }
  return out;
}

// ─────────────────────────────────────────────────────────────────────
// 5 · THE GLOSSARY
// ─────────────────────────────────────────────────────────────────────

/**
 * THE HEADWORD LIST.
 *
 * ────────────────────────────────────────────────────────────────────
 * WHAT A DEFINITION HERE IS, AND WHAT IT IS NOT
 * ────────────────────────────────────────────────────────────────────
 * Each definition states what the term means in language teaching and
 * applied linguistics — settled meanings, the kind found in any
 * reference grammar or teacher-training handbook. That is editorial
 * work and it is legitimate.
 *
 * What none of them does is describe what THIS College does with the
 * term. "Formative assessment" is defined as formative assessment;
 * there is no sentence claiming the College's formative assessment is
 * standardised, moderated or externally validated, because no such
 * thing has been established. The line between defining a word and
 * making a claim with it is the whole of the discipline of this page.
 *
 * ────────────────────────────────────────────────────────────────────
 * EVERY HEADWORD IS VERIFIED AGAINST THE CURRICULUM
 * ────────────────────────────────────────────────────────────────────
 * A glossary of terms the book does not use is padding, and it is the
 * easiest padding in publishing to write. So `glossary()` counts every
 * headword across all 294 lesson bodies and drops any that does not
 * appear. The count and the first lesson to use it are printed beside
 * each entry, which means a reader who suspects an entry was added for
 * bulk can check it in one lookup.
 *
 * ────────────────────────────────────────────────────────────────────
 * WHY EVERY HEADWORD CARRIES AN EXPLICIT PATTERN
 * ────────────────────────────────────────────────────────────────────
 * The first version of this glossary matched each headword as a plain
 * substring, which is the obvious implementation and was wrong in a way
 * that flattered the page. "gist" scored 193 uses — every one of them
 * inside the word "reGISTer". "warrant" scored 16, mostly from
 * "warranty" in a Level II shopping module. "tone" would have counted
 * every "milestone".
 *
 * Nothing about that failure was visible in the output: it produced
 * high counts for real terms, and a high count is exactly what a reader
 * checking the glossary would take as confirmation. So every headword
 * now declares the pattern it is counted by, anchored at word
 * boundaries, and "warrant" is counted as the noun only — the sense
 * the curriculum teaches at VI.5 — rather than as the ordinary verb in
 * "more than the evidence warrants".
 */
const HEADWORDS = [
  ['CEFR band', 'Common European Framework of Reference for Languages',
    'The six-level scale (A1, A2, B1, B2, C1, C2) used across Europe and internationally to '
    + 'describe what a learner can do in a language. A band describes functional ability, not a '
    + 'mark or a grade.', 'CEFR'],
  ['accuracy', null,
    'Correctness of form — grammar, vocabulary choice, pronunciation. Habitually contrasted with '
    + 'fluency, because attention spent on one is usually taken from the other.', 'accuracy'],
  // Defined in the sense the curriculum teaches it. Anaphora has a
  // second, grammatical sense — referring back with a pronoun — and
  // defining that one instead would have produced an entry that was
  // correct in the abstract and wrong about this book: its six uses are
  // all in Level VI's rhetoric module, where it is the figure.
  ['anaphora', null,
    'The rhetorical figure of repeating the opening words of successive clauses or sentences for '
    + 'cumulative force — "we can do this; we must do this; and we will do this". A device of '
    + 'oratory rather than of grammar.', 'anaphora'],
  ['claim', null,
    'In argument, the proposition a writer or speaker is asking the audience to accept. The unit '
    + 'that evidence is offered in support of.', 'claims?'],
  ['cleft sentence', null,
    'A sentence restructured to place emphasis on one element: "It was the deadline that changed '
    + 'their minds", rather than "The deadline changed their minds."', 'cleft'],
  ['coherence', null,
    'Whether a text hangs together as a line of thought. Distinct from cohesion: a text can be '
    + 'fully cohesive, every sentence correctly linked, and still incoherent.', 'coheren(?:ce|t)'],
  ['cohesion', null,
    'The surface links that hold a text together — pronouns, connectives, repeated and substituted '
    + 'words. The machinery; coherence is the result.', 'cohesi(?:on|ve)'],
  ['collocation', null,
    'A pairing of words that habitually occur together and sound wrong apart. "Heavy rain" and '
    + '"strong coffee" are collocations; "strong rain" is understandable and not English.', 'collocations?'],
  ['concession', null,
    'Granting a point to the other side before answering it. The move that separates an argument '
    + 'from an assertion, and the reason "although" and "admittedly" are taught as argument '
    + 'language rather than as connectives.', 'concessions?'],
  ['conditional', null,
    'A structure expressing that one thing depends on another — real, hypothetical or '
    + 'counterfactual. Conventionally taught in numbered types, which are a teaching convenience '
    + 'rather than a fact about the language.', 'conditionals?'],
  ['connected speech', null,
    'What happens to words when they are spoken in sequence rather than in isolation: sounds link, '
    + 'weaken and disappear. The main reason a learner who understands every word on the page '
    + 'cannot follow the same sentence said at speed.', 'connected[- ]speech'],
  ['contraction', null,
    'A shortened form written with an apostrophe — "don\'t", "she\'ll". A register marker as much '
    + 'as an abbreviation: their absence is one of the things that makes formal writing formal.', 'contractions?'],
  ['discourse marker', null,
    'A word or phrase that signals how what follows relates to what came before — "however", "in '
    + 'other words", "mind you". It carries no propositional content and removing it changes the '
    + 'shape of an argument rather than its facts.', 'discourse markers?'],
  ['drill', null,
    'Repeated controlled practice of a single form until it is automatic. Out of fashion as a '
    + 'method and indispensable as a stage, particularly for pronunciation.', 'drill(?:s|ing|ed)?'],
  ['ellipsis', null,
    'Leaving out words recoverable from context: "Coming?" for "Are you coming?" A major source of '
    + 'difficulty in authentic listening, where speakers omit far more than writers do.', 'ellipsis'],
  ['evidence', null,
    'What is offered in support of a claim. In academic writing, its relationship to the claim has '
    + 'to be made explicit — evidence placed next to a claim does not thereby support it.', 'evidence'],
  ['extension', null,
    'A task provided for learners who finish early or want to go further. Designed to deepen '
    + 'rather than to occupy.', 'extension'],
  ['filler', null,
    'A sound or word used to hold a turn while thinking — "um", "well", "you know". Taught rather '
    + 'than corrected: a speaker with no fillers loses the floor.', 'fillers?'],
  ['fluency', null,
    'The ability to produce language at something like natural speed without disruptive pausing. '
    + 'Independent of accuracy — a speaker can be fluent and inaccurate, or accurate and halting.', 'fluency'],
  ['formative assessment', null,
    'A check on learning carried out while there is still time to act on the result. Its purpose '
    + 'is to inform the next teaching decision, not to record a grade — which is what distinguishes '
    + 'it from summative assessment.', 'formative assessment'],
  ['genre', null,
    'A recognised type of text with conventions its readers expect — the abstract, the complaint '
    + 'letter, the literature review. Writing well in a genre means meeting expectations the writer '
    + 'did not set.', 'genres?'],
  ['gerund', null,
    'The -ing form of a verb used as a noun: "Swimming is difficult." Distinguished from the '
    + 'present participle, which is the same form doing a different job.', 'gerunds?'],
  ['gist', null,
    'The overall sense of a text or a passage of speech, as opposed to its detail. Listening for '
    + 'gist and listening for detail are separate skills and are practised separately.', 'gist'],
  ['hedging', null,
    'Softening a claim to the strength the evidence actually supports — "may", "tends to", "the '
    + 'data suggest". Central to academic register, where an unhedged claim reads as '
    + 'overstatement.', 'hedg(?:e|es|ed|ing)'],
  ['idiom', null,
    'A fixed expression whose meaning cannot be worked out from its parts. Learnable only as a '
    + 'whole, which is why idiom is taught late.', 'idioms?|idiomatic'],
  ['inference', null,
    'A conclusion drawn from a text that the text does not state. The skill that separates reading '
    + 'comprehension from decoding.', 'inferences?|infer(?:red|ring)?'],
  ['intelligibility', null,
    'Whether a listener can understand a speaker. The working goal of pronunciation teaching, and '
    + 'a lower and more defensible bar than a native-speaker accent.', 'intelligibilit\\w+'],
  ['intonation', null,
    'The rise and fall of pitch across an utterance. It carries grammatical information — question '
    + 'or statement — and attitudinal information, and learners routinely transfer the patterns of '
    + 'their first language without noticing.', 'intonation'],
  ['inversion', null,
    'Reversing the normal subject–verb order, in questions and, in formal registers, for emphasis: '
    + '"Not only did the policy fail…"', 'inversion'],
  ['minimal pair', null,
    'Two words differing in exactly one sound — "ship" and "sheep". The standard diagnostic and '
    + 'practice device for a contrast a learner cannot hear.', 'minimal pairs?'],
  ['modality', null,
    'The grammar of possibility, necessity, permission and obligation — chiefly the modal verbs. '
    + 'The main resource English has for saying how certain or how committed a speaker is.', 'modality'],
  ['nominalisation', null,
    'Turning a verb or adjective into a noun: "decide" into "decision", "difficult" into '
    + '"difficulty". Dense, impersonal and characteristic of academic prose; overused, it removes '
    + 'the actor from the sentence.', 'nominalis\\w+'],
  ['paraphrase', null,
    'Restating someone else\'s meaning in one\'s own words, with the source still credited. '
    + 'Changing a few words is not paraphrase, and the distinction is where most unintentional '
    + 'plagiarism begins.', 'paraphras\\w+'],
  ['passive voice', null,
    'A construction placing the affected thing in subject position: "The samples were analysed." '
    + 'Useful when the actor is unknown, obvious or deliberately unstated; conspicuous when it is '
    + 'the last of those.', 'passive voice'],
  ['peer feedback', null,
    'Learners responding to one another\'s work against stated criteria. Its value is as much in '
    + 'the giving as the receiving: applying a criterion to someone else\'s writing is how a '
    + 'learner comes to understand it.', 'peer feedback'],
  ['phrasal verb', null,
    'A verb plus a particle whose meaning is not the sum of its parts — "put off", "bring up". '
    + 'Ubiquitous in spoken English and one of its harder features to learn.', 'phrasal verbs?'],
  ['prerequisite knowledge', null,
    'What a learner must already have secure before a lesson can do its work. Stated at the head '
    + 'of every teaching lesson in this programme, and the basis of the cross-references printed '
    + 'in this volume.', 'prerequisite'],
  ['register', null,
    'The variety of language appropriate to a situation — formal or informal, spoken or written, '
    + 'technical or general. Register errors rarely obscure meaning and reliably cause offence.', 'registers?|register-safe'],
  ['relative clause', null,
    'A clause modifying a noun, introduced by "who", "which", "that" and the like. Defining '
    + 'relative clauses identify; non-defining ones add information and take commas.', 'relative clauses?'],
  ['rebuttal', null,
    'The answer to an objection, in a structured argument. Distinct from concession, which grants '
    + 'the objection before answering it.', 'rebuttals?'],
  ['reported speech', null,
    'Conveying what someone said without quoting them, typically with tense and reference shifted. '
    + 'A grammatical operation and a rhetorical one: the reporter chooses the reporting verb.', 'reported speech'],
  ['rubric', null,
    'The instrument a piece of work is marked against: named criteria, each with a descriptor of '
    + 'what the marker is looking for. Every assessed assignment in this programme carries one, '
    + 'printed in full.', 'rubrics?'],
  ['schwa', null,
    'The unstressed central vowel /ə/ — the commonest vowel sound in English and the one most '
    + 'often replaced by a full vowel by learners, which is what makes speech sound '
    + 'syllable-timed.', 'schwa'],
  ['sentence stress', null,
    'The pattern of strong and weak syllables across a whole utterance, which in English follows '
    + 'meaning rather than word order. Getting it wrong is more damaging to intelligibility than '
    + 'getting individual sounds wrong.', 'sentence[- ]stress'],
  ['signposting', null,
    'Telling a reader or listener where an argument is going: "This section considers…", "Having '
    + 'shown that…". Explicit in academic English to a degree that surprises learners from other '
    + 'academic traditions.', 'signpost\\w*'],
  ['subjunctive', null,
    'A verb form used for what is required, proposed or hypothetical rather than stated as fact — '
    + '"the board recommend that he resign". Rare in everyday English and persistent in '
    + 'institutional writing.', 'subjunctive'],
  ['summarising', null,
    'Reducing a text to its essential content in far fewer words. Requires deciding what is '
    + 'essential, which is why it is an analytical skill rather than a mechanical one.', 'summaris\\w+'],
  ['synthesis', null,
    'Combining several sources into a single line of argument that none of them states on its own. '
    + 'The step above summary, and the one most academic writing courses are actually about.', 'synthesi[sz]\\w*'],
  ['thesis statement', null,
    'The sentence in which an essay states what it will argue. A thesis that could not be disagreed '
    + 'with is not a thesis.', 'thesis statements?'],
  ['topic sentence', null,
    'The sentence that states what a paragraph is about, conventionally its first. A reader should '
    + 'be able to follow an argument by reading topic sentences alone.', 'topic sentences?'],
  ['turn-taking', null,
    'The management of who speaks when in a conversation — holding the floor, yielding it, coming '
    + 'in. Governed by conventions that differ between languages and are rarely taught explicitly.', 'turn-taking'],
  ['warrant', null,
    'The unstated assumption connecting evidence to a claim. Most disagreements that feel '
    + 'irresolvable are disagreements about a warrant neither side has stated.', 'warrant'],
  ['word stress', null,
    'Which syllable of a word carries the main emphasis. Fixed for each English word, not '
    + 'predictable from spelling, and a misplaced stress can make a familiar word unrecognisable.', 'word[- ]stress'],
];

/**
 * The glossary, verified against the curriculum.
 *
 * Any headword the curriculum does not use is dropped rather than
 * defined, and every surviving entry carries the number of times the
 * term occurs and the first lesson that uses it.
 */
export function glossary(C) {
  // The corpus is every word of curriculum the volume prints: the
  // lesson titles and bodies, and the level records the dividers and
  // the awards table are set from. The second is there for one entry —
  // CEFR appears on every level divider and in every module eyebrow but
  // never inside a lesson body, so a lesson-only corpus would have
  // dropped the single most important term in a CEFR-aligned
  // programme while keeping fifty rarer ones.
  const corpus = [];
  for (const lv of C.levels) {
    corpus.push({ ref: `Level ${lv.roman}`, text: [lv.purpose, lv.graduateProfile, lv.awardTitle,
      lv.standing, `CEFR ${lv.cefr}`].filter(Boolean).join(' ') });
  }
  for (const { item, ref } of walk(C)) {
    corpus.push({ ref, text: `${item.title || ''} ${item.body || ''}` });
  }

  return HEADWORDS.map(([term, expansion, definition, match]) => {
    const re = new RegExp(`\\b(?:${match || term})\\b`, 'gi');
    let count = 0;
    let first = null;
    for (const { text, ref } of corpus) {
      const m = text.match(re);
      if (!m) continue;
      count += m.length;
      if (!first) first = ref;
    }
    return { term, expansion, definition, count, first };
  }).filter((e) => e.count > 0)
    .sort((a, b) => a.term.toLowerCase().localeCompare(b.term.toLowerCase(), 'en'));
}

/** Headwords proposed but not used by the curriculum — for the Bible. */
export function glossaryRejects(C) {
  const kept = new Set(glossary(C).map((e) => e.term));
  return HEADWORDS.map(([t]) => t).filter((t) => !kept.has(t));
}
