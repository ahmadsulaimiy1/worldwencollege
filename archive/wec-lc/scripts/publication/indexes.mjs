/**
 * THE INDEXES.
 *
 * ────────────────────────────────────────────────────────────────────
 * WHY AN INDEX IS THE MOST VALUABLE PAGE IN A REFERENCE BOOK
 * ────────────────────────────────────────────────────────────────────
 * A contents list answers "what is in this book, in order". An index
 * answers "where is the thing I need", which is the question a teacher
 * actually arrives with. It is also the clearest single signal that a
 * volume is a reference work rather than a brochure: brochures do not
 * have indexes, because nobody looks anything up in them.
 *
 * ────────────────────────────────────────────────────────────────────
 * INDEXED BY REFERENCE, NOT BY PAGE
 * ────────────────────────────────────────────────────────────────────
 * Entries point to a lesson reference — I.1.2, IV.7.3 — rather than a
 * page number. That is not a compromise, it is the better choice here:
 *
 *   A page number is invalidated by any reflow. Add one paragraph to
 *     Level II and every page reference after it is wrong, silently.
 *   A lesson reference is stable across editions, across the print and
 *     editable editions, and across the platform, where the same
 *     numbering is used.
 *   The reader is looking for a LESSON, not a sheet of paper.
 *
 * Scholarly reference works index by section number for exactly these
 * reasons. This does the same.
 *
 * ────────────────────────────────────────────────────────────────────
 * EVERY ENTRY IS EXTRACTED, NONE IS AUTHORED
 * ────────────────────────────────────────────────────────────────────
 * Nothing here is a term someone thought ought to be in the curriculum.
 * Subject entries come from the titles the curriculum gives its own
 * lessons; lexical entries come from the words the curriculum itself
 * quotes in its vocabulary stages. If a term is in the index, the
 * curriculum put it there.
 */

/** The house reference for an item: LEVEL.MODULE.ITEM. */
export const refOf = (lv, mod, item) => `${lv.roman}.${mod.sequence}.${item.sequence}`;

/** Words too common to be useful as an index head. */
const STOP = new Set(['the', 'a', 'an', 'and', 'or', 'of', 'to', 'in', 'on', 'at', 'for', 'with',
  'your', 'you', 'my', 'this', 'that', 'it', 'is', 'are', 'was', 'were', 'be', 'as', 'by', 'from',
  'more', 'other', 'their', 'its', 'his', 'her', 'i', 'we', 'they', 'not', 'no', 'do', 'does',
  'module', 'lesson', 'quiz', 'assignment', 'review', 'overview', 'part', 'key', 'consolidation',
  // Added after reading the first generated index: these appeared as
  // heads with long reference runs and told the reader nothing. An index
  // entry that matches half the book is worse than no entry, because it
  // costs a line and a lookup to discover that.
  'about', 'according', 'activities', 'activity', 'practice', 'using', 'used', 'into', 'through',
  'what', 'when', 'where', 'which', 'while', 'have', 'has', 'had', 'can', 'will', 'would',
  'there', 'here', 'them', 'then', 'than', 'some', 'much', 'many', 'very', 'just', 'also',
  'first', 'second', 'third', 'one', 'two', 'three', 'four', 'five', 'six']);

const walk = (C) => C.levels.flatMap((lv) =>
  lv.modules.flatMap((mod) => mod.lessons.map((item) => ({ lv, mod, item }))));

/**
 * Strip the administrative prefix from a lesson title.
 *
 * Titles are stored as "Lesson 4.1 — In My View... — Structured Opinion
 * Language". The reference is already carried by the index entry, so
 * repeating it inside the term wastes the line and sorts everything
 * under L.
 */
export function topicOf(title) {
  return String(title)
    .replace(/^\s*(?:Module\s+\d+\s+)?(?:Lesson|Quiz|Speaking\s+Assignment|Writing\s+Assignment|Assignment)\s*\d*(?:\.\d+)?\s*[-—–:]*\s*/i, '')
    .replace(/^\s*Module\s+\d+\s*[-—–:]\s*/i, '')
    .replace(/\s*[-—–]{1,2}\s*/g, ' — ')
    .trim();
}

/**
 * THE SUBJECT INDEX.
 *
 * Built from the significant words of every item title, so a reader
 * looking for "directions" or "negotiation" finds every lesson that
 * names it. Multi-word phrases are kept whole where the title provides
 * them; single words are the fallback.
 */
export function subjectIndex(C) {
  const map = new Map();
  const add = (term, ref) => {
    const key = term.toLowerCase();
    if (!map.has(key)) map.set(key, { term, refs: new Set() });
    map.get(key).refs.add(ref);
  };

  for (const { lv, mod, item } of walk(C)) {
    const ref = refOf(lv, mod, item);
    const topic = topicOf(item.title);
    if (!topic) continue;

    // Each em-dash-separated clause of a title is its own subject.
    for (const clause of topic.split(' — ')) {
      const clean = clause.replace(/[?!.]+$/, '').trim();
      if (!clean) continue;
      const words = clean.split(/[\s/&,]+/).filter(Boolean);
      // Short, meaningful clauses index whole; long ones index by their
      // significant words, or the index fills with sentences.
      if (words.length <= 4 && words.some((w) => !STOP.has(w.toLowerCase()))) {
        add(clean, ref);
      }
      for (const w of words) {
        const lw = w.toLowerCase().replace(/[^a-z-]/g, '');
        if (lw.length > 3 && !STOP.has(lw)) add(w.replace(/[^A-Za-z-]/g, ''), ref);
      }
    }
    // The module itself is a subject.
    const mt = topicOf(mod.title);
    if (mt) add(mt, ref);
  }

  return finish(map, 2, 20);
}

/**
 * THE LEXICAL INDEX — vocabulary, phrases and collocations.
 *
 * Taken from the terms the curriculum itself puts in quotation marks
 * inside its vocabulary stages: KEY VOCABULARY, KEY PHRASES, PHRASAL
 * VERBS & COLLOCATIONS, DISCOURSE MARKERS and VOCABULARY REINFORCEMENT.
 *
 * A learner revising for an assessment currently has no way to find
 * where a word was introduced. This is that way.
 */
export function lexicalIndex(C) {
  const map = new Map();
  const VOCAB = /VOCAB|PHRASE|PHRASAL|COLLOCATION|DISCOURSE/i;

  for (const { lv, mod, item } of walk(C)) {
    const ref = refOf(lv, mod, item);
    for (const stage of item.stages) {
      if (!stage.head || !VOCAB.test(stage.head)) continue;
      const text = stage.parts.map((p) => p.text).join(' ');
      // DOUBLE quotation marks only.
      //
      // Including the apostrophe as a delimiter looked harmless and was
      // not: an apostrophe inside a word pairs with the next quotation
      // mark anywhere downstream, so the extractor returned fragments
      // like "almost always means STAFF ATTRITION (" as vocabulary. The
      // curriculum quotes its lexical items in double quotes; single
      // quotes in this text are possessives and contractions.
      for (const m of text.matchAll(/["“]([^"“”]{2,44})["”]/g)) {
        const term = m[1].trim().replace(/\s+/g, ' ');
        // Reject sentences and fragments: a lexical entry is a word, a
        // phrase or a chunk, not a line of instruction.
        if (term.split(' ').length > 6) continue;
        if (/[.;:,]$/.test(term)) continue;
        if (/[()[\]]/.test(term) && !/^\[?[a-z ]+\]?$/i.test(term)) continue;
        if (/[A-Z]{3,}/.test(term)) continue;
        if (!/^[a-z]/i.test(term)) continue;
        const key = term.toLowerCase();
        if (!map.has(key)) map.set(key, { term, refs: new Set() });
        map.get(key).refs.add(ref);
      }
    }
  }
  // One reference is the normal case for a vocabulary term: it is
  // taught once, and the reader wants to know where.
  return finish(map, 1);
}

/**
 * THE ASSESSMENT INDEX — where every assessed item lives.
 *
 * 120 assessments across the programme. A marker planning a term needs
 * them as a list, not scattered through 487 pages.
 */
export function assessmentIndex(C) {
  return C.levels.map((lv) => ({
    lv,
    rows: lv.modules.map((mod) => {
      const quiz = mod.lessons.find((x) => x.kind === 'quiz');
      const asg = mod.lessons.find((x) => x.kind === 'assignment');
      return {
        module: mod.sequence,
        title: topicOf(mod.title),
        quizRef: quiz ? refOf(lv, mod, quiz) : null,
        questions: quiz ? quiz.questions.length : 0,
        asgRef: asg ? refOf(lv, mod, asg) : null,
      };
    }),
  }));
}

/**
 * Sort, de-duplicate and drop entries too thin to be worth a line.
 *
 * The threshold differs by index, and getting it wrong once already
 * hollowed one of them out. A SUBJECT appearing in a single lesson is
 * usually a title fragment, so subjects need two or more references
 * before they earn a line. A VOCABULARY term appearing in a single
 * lesson is the normal case and precisely what the reader is looking
 * up — applying the same threshold there cut the lexical index from
 * several hundred entries to twenty-six and made it useless.
 */
function finish(map, minRefs = 2, maxRefs = Infinity) {
  return [...map.values()]
    .map((e) => ({ term: e.term.replace(/^[^A-Za-z0-9]+/, '').trim(), refs: [...e.refs].sort(cmpRef) }))
    // An entry matching a large fraction of the book is worse than no
    // entry: it costs a line to print and a lookup to discover it says
    // nothing. "Module Overview & Key Phrases" is a title repeated in
    // all sixty modules, and as an index head it pointed everywhere.
    .filter((e) => e.term.length > 1 && e.refs.length >= minRefs && e.refs.length <= maxRefs)
    .sort((a, b) => a.term.toLowerCase().localeCompare(b.term.toLowerCase(), 'en'));
}

const ROMAN_ORDER = { I: 1, II: 2, III: 3, IV: 4, V: 5, VI: 6 };
function cmpRef(a, b) {
  const pa = a.split('.'); const pb = b.split('.');
  return (ROMAN_ORDER[pa[0]] - ROMAN_ORDER[pb[0]])
    || (Number(pa[1]) - Number(pb[1])) || (Number(pa[2]) - Number(pb[2]));
}

/** Group an index into alphabetical sections for setting. */
export function alphabetise(entries) {
  const groups = new Map();
  for (const e of entries) {
    const letter = e.term[0].toUpperCase().match(/[A-Z]/) ? e.term[0].toUpperCase() : '#';
    if (!groups.has(letter)) groups.set(letter, []);
    groups.get(letter).push(e);
  }
  return [...groups.entries()].sort((a, b) => a[0].localeCompare(b[0]));
}
