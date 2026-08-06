/**
 * THE LEARNER EXPERIENCE CONSTITUTION — coverage, not count.
 *
 * ────────────────────────────────────────────────────────────────────
 * WHY A PUBLICATION COUNT IS THE WRONG METRIC
 * ────────────────────────────────────────────────────────────────────
 * Twelve titles is a number that only goes up, and it goes up whether
 * or not a single learner is better served. A press optimising for it
 * publishes a Marking Guide, a Rubric Handbook and an Assessment
 * Handbook, and reports three books where a teacher has one problem.
 *
 * Coverage cannot be gamed that way. It asks a different question of
 * every one of the 114 teaching lessons: is the resource a learner
 * needs for THIS lesson actually in a publication they can hold? A new
 * volume that repeats an existing one moves the count and not the
 * coverage. A volume that reaches a strand nobody has printed moves the
 * coverage a long way.
 *
 * ────────────────────────────────────────────────────────────────────
 * THE DISTINCTION THAT MAKES THIS HONEST
 * ────────────────────────────────────────────────────────────────────
 * Two different things are measured for every resource, and collapsing
 * them would flatter the institution badly:
 *
 *   MATERIAL COVERAGE — the content exists in the academic database.
 *   PUBLISHED COVERAGE — the content exists AND a publication that has
 *     actually been issued carries it.
 *
 * The gap between the two is the Press's own backlog, stated as a
 * number rather than as an intention. Vocabulary support has material
 * coverage of 100 % and published coverage of nought: every lesson has
 * a vocabulary stage, and no published volume gathers them. That single
 * pair of numbers is worth more than a catalogue count.
 *
 * ────────────────────────────────────────────────────────────────────
 * WHAT THIS FILE IS NOT ALLOWED TO DO
 * ────────────────────────────────────────────────────────────────────
 * It may not invent a resource type the curriculum does not have in
 * order to score better on it, and it may not mark a lesson as covered
 * because a publication *could* carry it. Every cell is computed from
 * the lesson's own stages and the status of a named publication.
 *
 * Two of the sixteen resource types come out at or near nought. They
 * are kept rather than dropped, because a matrix that only lists what
 * an institution is good at is a marketing document.
 *
 * ────────────────────────────────────────────────────────────────────
 * WHAT COVERAGE DOES NOT MEASURE, AND THE PUBLICATION THAT PROVED IT
 * ────────────────────────────────────────────────────────────────────
 * Coverage measures AVAILABILITY: is the resource in a volume a reader
 * can open. It does not measure USABILITY: whether they can find it in
 * time to use it.
 *
 * The Assessment Handbook demonstrated the difference on the day it was
 * published. It ranked first for educational impact and moved published
 * coverage by nought points, because every rubric it prints was already
 * available — inside the 443-page Teacher's Edition, one rubric per
 * lesson, sixty places. Availability was complete. Consistency was
 * impossible, which is why the book was worth publishing.
 *
 * The two instruments are kept separate rather than reconciled. A
 * coverage figure that rose whenever a book was published would be a
 * publication count wearing a percentage sign, and the impact ranking
 * already measures what coverage cannot.
 */
import { buildCurriculum } from './curriculum.mjs';
import { walk } from './apparatus.mjs';
import { STATUS, TITLES, inventory, catalogue } from './catalogue.mjs';

// ─────────────────────────────────────────────────────────────────────
// 1 · THE SIXTEEN RESOURCES
// ─────────────────────────────────────────────────────────────────────

const has = (item, icon) => item.stages.some((s) => s.icon === icon);

/**
 * `material` decides whether the content exists for one lesson.
 * `carriedBy` names the publications that would put it in a reader's
 * hands; a resource is PUBLISHED for that lesson only if one of them
 * has actually been issued.
 */
export const RESOURCES = [
  { key: 'coursebook', name: 'Coursebook', carriedBy: [2, 1],
    what: 'The lesson itself, as the learner reads it.',
    material: () => true },
  { key: 'workbook', name: 'Workbook', carriedBy: [6],
    what: 'Practice the learner does without a teacher present.',
    material: (i) => has(i, 'guided') && has(i, 'homework') },
  { key: 'teacher', name: 'Teacher guidance', carriedBy: [1],
    what: 'Objectives, prerequisites and stage timings for the person teaching it.',
    material: (i) => has(i, 'objectives') && has(i, 'prereq') },
  { key: 'activity', name: 'Classroom activity', carriedBy: [50, 1],
    what: 'Something to do in the room: warm-up, guided practice, speaking task.',
    material: (i) => has(i, 'warmup') || has(i, 'guided') },
  { key: 'listening', name: 'Listening script', carriedBy: [10],
    what: 'A script the class can hear, since no recording exists.',
    material: (i, ctx) => has(i, 'listening') && ctx.moduleHasListening },
  { key: 'pronunciation', name: 'Pronunciation support', carriedBy: [12],
    what: 'Targets, examples and guidance for the sounds this lesson teaches.',
    material: (i, ctx) => has(i, 'pronunciation') && ctx.moduleHasPronTargets },
  { key: 'vocabulary', name: 'Vocabulary support', carriedBy: [7],
    what: 'The lexis taught, and where it is recycled.',
    material: (i) => has(i, 'vocabulary') },
  { key: 'grammar', name: 'Grammar reference', carriedBy: [13],
    what: 'The structure presented, explained outside the lesson that presents it.',
    material: (i) => has(i, 'present') },
  { key: 'assessment', name: 'Assessment', carriedBy: [8, 1],
    what: 'A quiz and an assignment the lesson leads to.',
    material: (i, ctx) => ctx.moduleHasQuiz && ctx.moduleHasAssignment },
  { key: 'rubric', name: 'Rubric', carriedBy: [8, 1],
    what: 'The criteria the assignment is marked against.',
    material: (i, ctx) => ctx.moduleHasRubric },
  { key: 'answers', name: 'Answer key', carriedBy: [1],
    what: 'The correct answers, in the teacher’s edition only.',
    material: (i, ctx) => ctx.moduleHasAnswers },
  { key: 'extension', name: 'Extension activity', carriedBy: [6, 50],
    what: 'Work for a learner who finishes early or wants more.',
    material: (i) => has(i, 'extension') },
  { key: 'digital', name: 'Digital resource', carriedBy: [40, 39],
    what: 'The lesson served by the learning platform rather than on paper.',
    material: () => true },
  { key: 'qr', name: 'QR resource', carriedBy: [],
    what: 'A scannable link from the printed page to something live.',
    // Nought. The verification QR exists and is real, but it belongs to
    // an award, not to a lesson. No lesson in this curriculum carries a
    // code, and inventing one to fill this row would be the exact
    // failure this matrix exists to catch.
    material: () => false },
  { key: 'professional', name: 'Professional application', carriedBy: [46],
    what: 'How this lesson is used in working life.',
    material: (i, ctx) => ctx.professionalModule },
  { key: 'revision', name: 'Revision resource', carriedBy: [47, 21],
    what: 'Where the lesson sends the class back to, for revision.',
    material: (i) => has(i, 'revision') },
];

// ─────────────────────────────────────────────────────────────────────
// 2 · THE MATRIX
// ─────────────────────────────────────────────────────────────────────

const PROFESSIONAL = /Work|Career|Negotiation|Professional Advocacy/i;

/** Every teaching lesson, with the context its resources depend on. */
function lessons(C) {
  return walk(C)
    .filter(({ item }) => item.stages.some((s) => s.icon === 'objectives'))
    .map(({ lv, mod, item, ref }) => {
      const kinds = new Set(mod.lessons.map((x) => x.kind));
      const quiz = mod.lessons.find((x) => x.kind === 'quiz');
      const assignment = mod.lessons.find((x) => x.kind === 'assignment');
      return {
        ref,
        roman: lv.roman,
        module: mod.sequence,
        title: item.title,
        item,
        ctx: {
          moduleHasQuiz: kinds.has('quiz'),
          moduleHasAssignment: kinds.has('assignment'),
          moduleHasRubric: !!assignment
            && assignment.stages.some((s) => s.icon === 'rubric'),
          moduleHasAnswers: !!quiz && quiz.questions.length > 0
            && quiz.questions.every((q) => Number.isInteger(q.correctIndex)),
          moduleHasListening: mod.lessons.some((x) =>
            x.stages.some((s) => s.icon === 'listening')),
          moduleHasPronTargets: mod.lessons.some((x) =>
            x.stages.some((s) => s.icon === 'pronunciation')),
          professionalModule: PROFESSIONAL.test(mod.title),
        },
      };
    });
}

/**
 * The resource matrix. One row per lesson, one cell per resource, each
 * cell recording both whether the material exists and whether a reader
 * can hold it.
 */
export function matrix(C = buildCurriculum(), rows = catalogue()) {
  const status = new Map(rows.map((r) => [r.n, r.status]));
  const issued = (ns) => ns.some((n) => status.get(n) === STATUS.PUBLISHED);
  const planned = (ns) => ns.some((n) => status.get(n) === STATUS.DERIVABLE);

  return lessons(C).map((l) => ({
    ...l,
    cells: RESOURCES.map((r) => {
      const material = !!r.material(l.item, l.ctx);
      return {
        key: r.key,
        material,
        published: material && issued(r.carriedBy),
        derivable: material && !issued(r.carriedBy) && planned(r.carriedBy),
      };
    }),
  }));
}

const pct = (n, of) => (of ? Math.round((n / of) * 100) : 0);

/** Coverage per resource, across every lesson. */
export function byResource(M = matrix()) {
  return RESOURCES.map((r, i) => {
    const cells = M.map((l) => l.cells[i]);
    const material = cells.filter((c) => c.material).length;
    const published = cells.filter((c) => c.published).length;
    return {
      ...r,
      lessons: M.length,
      material,
      published,
      derivable: cells.filter((c) => c.derivable).length,
      materialPct: pct(material, M.length),
      publishedPct: pct(published, M.length),
      // The Press's own backlog for this resource, in lessons.
      backlog: material - published,
    };
  });
}

/** Coverage per level, so a thin level cannot hide inside an average. */
export function byLevel(M = matrix()) {
  const romans = [...new Set(M.map((l) => l.roman))];
  return romans.map((roman) => {
    const rows = M.filter((l) => l.roman === roman);
    const cells = rows.flatMap((l) => l.cells);
    return {
      roman,
      lessons: rows.length,
      materialPct: pct(cells.filter((c) => c.material).length, cells.length),
      publishedPct: pct(cells.filter((c) => c.published).length, cells.length),
    };
  });
}

/** A lesson with no unpublished resource is fully served today. */
export function fullyServed(M = matrix()) {
  return M.filter((l) => l.cells.every((c) => !c.material || c.published));
}

// ─────────────────────────────────────────────────────────────────────
// 3 · THE LEARNING JOURNEY
// ─────────────────────────────────────────────────────────────────────

/**
 * The eight questions, each answered by named publications rather than
 * by prose. A question whose answer contains no issued publication is a
 * canonical gap, and it is computed, not judged.
 */
export const JOURNEY = [
  { who: 'Learner', when: 'Before learning',
    need: 'What the level covers, what is expected, and what to have ready.',
    served: [2, 24, 48] },
  { who: 'Learner', when: 'While learning',
    need: 'The lesson, the practice, the lexis, the sounds and the structures.',
    served: [2, 6, 7, 12, 13, 40] },
  { who: 'Learner', when: 'After learning',
    need: 'Revision, extension and a way to check understanding before assessment.',
    served: [47, 6, 48, 21] },
  { who: 'Teacher', when: 'Before teaching',
    need: 'The objectives, the prerequisites, the timings and a plan.',
    served: [1, 49, 21] },
  { who: 'Teacher', when: 'While teaching',
    need: 'Activities, listening scripts, pronunciation guidance and answers to hand.',
    served: [1, 50, 10, 12] },
  { who: 'Assessor', when: 'While assessing',
    need: 'The assignment, the rubric, the criteria and the marking standard.',
    served: [8, 1, 18] },
  { who: 'Graduate', when: 'After graduation',
    need: 'What the award is, what it says, and how to use the post-nominal.',
    served: [58, 22, 27] },
  { who: 'Employer', when: 'During verification',
    need: 'What the award means and how to check that a claim to it is genuine.',
    served: [22, 3, 58] },
];

export function journey(rows = catalogue()) {
  const byN = new Map(rows.map((r) => [r.n, r]));
  return JOURNEY.map((j) => {
    const titles = j.served.map((n) => byN.get(n)).filter(Boolean);
    const issued = titles.filter((t) => t.status === STATUS.PUBLISHED);
    const derivable = titles.filter((t) => t.status === STATUS.DERIVABLE);
    return {
      ...j,
      titles,
      issued,
      derivable,
      blocked: titles.filter((t) => t.status === STATUS.AUTHORING
        || t.status === STATUS.GOVERNANCE),
      // Served today means at least one issued publication answers it.
      servedToday: issued.length > 0,
      complete: titles.length > 0 && titles.every((t) => t.status === STATUS.PUBLISHED),
    };
  });
}

// ─────────────────────────────────────────────────────────────────────
// 4 · CANONICAL GAPS
// ─────────────────────────────────────────────────────────────────────

/**
 * Every place the canon does not reach, computed rather than compiled
 * by hand. Three kinds, and the third is the one a publisher is most
 * likely to miss: a publication can be finished and still not work,
 * because the volumes it tells the reader to read next do not exist.
 */
export function gaps(C = buildCurriculum(), rows = catalogue()) {
  const M = matrix(C, rows);
  const res = byResource(M);
  const jr = journey(rows);
  const out = [];

  for (const r of res) {
    if (r.material === 0) {
      out.push({
        kind: 'Material', resource: r.name,
        detail: `No lesson in the curriculum carries this resource. ${r.what}`,
        lessons: 0, owner: 'Academic authoring',
      });
    } else if (r.published === 0) {
      out.push({
        kind: 'Unpublished', resource: r.name,
        detail: `${r.material} of ${r.lessons} lessons have the material and no issued `
          + 'publication carries it.',
        lessons: r.material, owner: 'Editorial',
      });
    } else if (r.backlog > 0) {
      out.push({
        kind: 'Partial', resource: r.name,
        detail: `${r.published} of ${r.material} lessons are served by an issued publication.`,
        lessons: r.backlog, owner: 'Editorial',
      });
    }
  }

  for (const j of jr) {
    if (!j.servedToday) {
      out.push({
        kind: 'Journey', resource: `${j.who} · ${j.when}`,
        detail: `${j.need} No issued publication answers this.`,
        lessons: null,
        owner: j.blocked.length ? 'Academic authoring or governance' : 'Editorial',
      });
    }
  }

  return out;
}

// ─────────────────────────────────────────────────────────────────────
// 5 · CANON COMPLETION
// ─────────────────────────────────────────────────────────────────────

/**
 * A publication is not finished because its pages are complete.
 *
 * Every title tells its reader what to read before it, alongside it and
 * after it. If those volumes do not exist, the publication is a book
 * with working pages and broken instructions — and this is the check
 * that catches it, because nothing else would: the pages proof
 * perfectly.
 */
export function completion(slate, rows = catalogue()) {
  const status = new Map(rows.map((r) => [r.n, r.status]));
  const name = new Map(rows.map((r) => [r.n, r.name]));
  return slate.filter((x) => x.n && status.get(x.n) === STATUS.PUBLISHED).map((x) => {
    // A title may appear as both a companion and a sequel; counting
    // it twice would report the same broken instruction twice.
    const deps = [...new Set([...x.before, ...x.with, ...x.after])];
    const unmet = deps.filter((n) => status.get(n) !== STATUS.PUBLISHED);
    return {
      n: x.n,
      name: name.get(x.n),
      slot: x.slot,
      deps: deps.length,
      unmet: unmet.map((n) => ({ n, name: name.get(n), status: status.get(n) })),
      complete: unmet.length === 0,
    };
  });
}

// ─────────────────────────────────────────────────────────────────────
// 6 · EDUCATIONAL INTEGRITY
// ─────────────────────────────────────────────────────────────────────

/**
 * The rule against publishing to enlarge the catalogue, applied to the
 * Press's own decisions and recorded where a reader can check them.
 *
 * These are judgements, not measurements, and they are written as
 * judgements. What makes them accountable is that each names the
 * educational problem the publication solves: a title that cannot name
 * one has failed the test regardless of how good it looks.
 */
export const INTEGRITY = [
  { title: 'The IEFC Listening Scripts', problem: 'A listening lesson cannot be run: 60 scripts '
      + 'exist and no recording does.', verdict: 'Necessary' },
  { title: 'The IEFC Pronunciation Handbook', problem: 'The pronunciation strand can only be '
      + 'seen by opening 114 lessons one at a time.', verdict: 'Necessary' },
  { title: 'The Canon Index', problem: 'A reader holding one volume cannot tell what to read '
      + 'next, and an editor cannot tell what is missing.', verdict: 'Necessary' },
  { title: 'A separate Coverage Report', problem: 'None. The coverage dashboard belongs in the '
      + 'Canon Index, beside the titles it measures. A second volume would be a publication '
      + 'created to enlarge the catalogue, which is the thing this constitution forbids.',
  verdict: 'Not published' },
  { title: 'The Teacher’s Edition', problem: 'Solves several: the coursebook, the answer keys, '
      + 'the teaching guide and the apparatus. Split by READERSHIP into three editions rather '
      + 'than by problem, because a teacher needs all four in one volume and a learner must not '
      + 'have the second.', verdict: 'Split by readership' },
];

/** The whole picture, for the index that prints it. */
export function dashboard(C = buildCurriculum(), rows = catalogue()) {
  const M = matrix(C, rows);
  const res = byResource(M);
  const cells = M.flatMap((l) => l.cells);
  return {
    lessons: M.length,
    resources: RESOURCES.length,
    materialPct: pct(cells.filter((c) => c.material).length, cells.length),
    publishedPct: pct(cells.filter((c) => c.published).length, cells.length),
    fullyServed: fullyServed(M).length,
    byResource: res,
    byLevel: byLevel(M),
    journey: journey(rows),
    gaps: gaps(C, rows),
  };
}

void TITLES; void inventory;
