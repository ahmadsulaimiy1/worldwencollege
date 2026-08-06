// WEC Press — the constitution, the catalogue and the house identity.
//
// THE ASSERTION THIS FILE EXISTS FOR:
//
//   A publishing standards document must not be able to claim more
//   authority than it has, and a ten-year catalogue must not be able to
//   claim more material than exists.
//
// Both documents fail in the same way, and it is a quiet failure. The
// constitution says a rule is ENFORCED and names a test; two years
// later the test has been renamed and the clause is a decoration that
// reads like a guarantee. The catalogue says a title is DERIVABLE; the
// curriculum strand it was derived from was never finished, and nobody
// notices until an editor is three weeks into producing a book that has
// no content behind it.
//
// So the checks below are mostly about the RELATIONSHIP between a claim
// and its evidence, not about the values:
//
//   · a clause may only say ENFORCED if it names a test file that is
//     on disk, and may only name a test file if it says ENFORCED;
//   · a title may only say PUBLISHED if it names a build script that
//     exists and an artefact that is either committed or documented as
//     built on demand;
//   · the difference between DERIVABLE and REQUIRES AUTHORING is
//     recomputed here from a deliberately emptied inventory, so a
//     status that had been hard-coded would show up as one that does
//     not move when the material disappears.
//
// And the house identity is checked as measurement rather than taste: a
// series colour that cannot be told apart from the ground it is printed
// on is a defect that would ship on every title in that series.
import { existsSync, readFileSync } from 'node:fs';
import { ROOT, loadUrl } from './helpers.mjs';

const press = await import(loadUrl('scripts/publication/press.mjs'));
const cat = await import(loadUrl('scripts/publication/catalogue.mjs'));
const house = await import(loadUrl('scripts/publication/house.mjs'));

const { CONSTITUTIONS, CLAUSES, FORCE, forceCount, contrastEvidence } = press;
const { STATUS, TITLES, WAVES, FAMILIES_IN_USE, inventory, catalogue, resolve } = cat;

let pass = 0, fail = 0;
const check = (label, cond, detail) => {
  console.log((cond ? 'PASS ' : 'FAIL ') + label + (cond || detail === undefined ? '' : ` — ${detail}`));
  cond ? pass++ : fail++;
};

// ── 1 · The constitution binds only as far as it can ─────────────────

check('23 constitutions, numbered 1 to 23 without a gap or a repeat',
  CONSTITUTIONS.length === 23
  && CONSTITUTIONS.every((s, i) => s.n === i + 1)
  && new Set(CONSTITUTIONS.map((s) => s.name)).size === 23,
  CONSTITUTIONS.map((s) => s.n).join(','));

check('every constitution states a purpose and carries at least two clauses',
  CONSTITUTIONS.every((s) => s.purpose && s.purpose.length > 12 && s.clauses.length >= 2),
  CONSTITUTIONS.filter((s) => !s.purpose || s.purpose.length <= 12 || s.clauses.length < 2)
    .map((s) => `§${s.n}`).join(','));

check('every clause declares one of the four forces',
  CLAUSES.every((c) => Object.values(FORCE).includes(c.force)),
  CLAUSES.filter((c) => !Object.values(FORCE).includes(c.force)).length + ' unknown');

const enforced = CLAUSES.filter((c) => c.force === FORCE.ENFORCED);
const missingTest = enforced.filter((c) => !c.by || !existsSync(`${ROOT}/${c.by}`));
check('every ENFORCED clause names a test file that exists',
  enforced.length > 0 && missingTest.length === 0,
  missingTest.map((c) => c.by || `§${c.section} names none`).join(' · '));

const strayTest = CLAUSES.filter((c) => c.by && c.force !== FORCE.ENFORCED);
check('only ENFORCED clauses name a test',
  strayTest.length === 0,
  strayTest.map((c) => `§${c.section} ${c.force}`).join(' · '));

// A constitution where everything is enforced is lying about what
// software can check; one where nothing is, is a wish. Both bounds.
check('the enforced proportion is neither nought nor everything',
  forceCount(FORCE.ENFORCED) > 5 && forceCount(FORCE.ENFORCED) < CLAUSES.length * 0.6,
  `${forceCount(FORCE.ENFORCED)} of ${CLAUSES.length}`);

check('the forces sum to the clause count',
  Object.values(FORCE).reduce((n, f) => n + forceCount(f), 0) === CLAUSES.length);

// The clauses that name the institution's position must keep saying it.
const allRules = CLAUSES.map((c) => c.rule).join(' ');
check('§1 states the imprint has no legal personality, staff, prefix or distribution',
  /no separate legal personality/.test(allRules) && /no ISBN\s*\n?\s*publisher prefix/.test(allRules.replace(/\s+/g, ' ')),
  'the position statement has been softened or removed');

// The first version of this check searched for "is accredited" and
// flagged the clause that PROHIBITS the claim. It now looks for the
// affirmative forms only.
check('no clause claims accreditation, recognition or an assigned identifier',
  !/accredited by\s+[A-Z]|recognised by\s+[A-Z]|ISBN\s*97[89]|ISSN\s*\d/.test(allRules),
  (allRules.match(/accredited by\s+[A-Z]\w+|ISBN\s*97[89][\d-]*/g) || []).join(' · '));

// ── 2 · The colour clauses are recomputed, not restated ──────────────

const ev = contrastEvidence();
check('the contrast evidence is recomputed and every pairing is measured',
  ev.length >= 6 && ev.every((r) => typeof r.ratio === 'number' && r.ratio > 0),
  JSON.stringify(ev.map((r) => r.ratio)));

check('body ink on text paper clears 4.5 : 1',
  ev.filter((r) => /Warm Charcoal/.test(r.label)).every((r) => r.ratio >= 4.5),
  ev.filter((r) => /Warm Charcoal/.test(r.label)).map((r) => r.ratio).join(','));

check('each level ink clears 4.5 : 1 on its own wash',
  ev.filter((r) => /Level/.test(r.label)).length >= 2
  && ev.filter((r) => /Level/.test(r.label)).every((r) => r.ratio >= 4.5),
  ev.filter((r) => /Level/.test(r.label)).map((r) => `${r.label} ${r.ratio}`).join(' · '));

// ── 3 · The catalogue cannot claim more than exists ──────────────────

const INV = inventory();
const ROWS = catalogue(INV);

check('every title has a unique number and belongs to a declared series',
  new Set(TITLES.map((t) => t.n)).size === TITLES.length
  && TITLES.every((t) => FAMILIES_IN_USE.includes(t.family)),
  TITLES.length + ' titles');

check('every title states a readership and what it would be made from',
  TITLES.every((t) => t.audience && t.audience.length > 8 && t.source && t.source.length > 30),
  TITLES.filter((t) => !t.source || t.source.length <= 30).map((t) => t.n).join(','));

check('every title carries evidence: an artefact, a governance blocker, or a measured need',
  TITLES.every((t) => t.artefact || t.governance || t.needs.length > 0),
  TITLES.filter((t) => !t.artefact && !t.governance && !t.needs.length).map((t) => t.n).join(','));

const pkg = JSON.parse(readFileSync(`${ROOT}/package.json`, 'utf8'));
const published = ROWS.filter((r) => r.status === STATUS.PUBLISHED);
check('every published title names a build script that exists in package.json',
  published.length > 0 && published.every((r) => r.build && pkg.scripts[r.build]),
  published.filter((r) => !r.build || !pkg.scripts[r.build]).map((r) => r.build || r.n).join(' · '));

// Naming a script that exists is not enough: the Editorial Bible and
// the Production Specifications both named `publication`, which builds
// neither of them. So the script's renderers are read and asked whether
// they write the file the title claims.
const writesIt = (r) => {
  const cmd = pkg.scripts[r.build] || '';
  const renderers = cmd.match(/scripts\/[\w/-]+\.mjs/g) || [];
  // Edition suffixes are composed at render time — "(Large Print)" is
  // appended by a flag, not written into the filename — so the stem
  // before the first parenthesis is what a renderer can be expected to
  // contain.
  const base = r.artefact.replace(/^.*\//, '').replace(/\.[a-z]+$/, '').split(' (')[0].trim();
  return renderers.some((f) => existsSync(`${ROOT}/${f}`)
    && readFileSync(`${ROOT}/${f}`, 'utf8').includes(base));
};
const wrongScript = published.filter((r) => r.build && pkg.scripts[r.build] && !writesIt(r));
check('the named build script is the one that actually writes the artefact',
  wrongScript.length === 0,
  wrongScript.map((r) => `${r.artefact} ← npm run ${r.build}`).join(' · '));

const missingArtefact = published.filter((r) => !r.onDemand && !existsSync(`${ROOT}/${r.artefact}`));
check('every committed artefact is on disk; the rest declare that they are built on demand',
  missingArtefact.length === 0,
  missingArtefact.map((r) => r.artefact).join(' · '));

check('every measured need points at a key the inventory actually reports',
  TITLES.every((t) => t.needs.every((n) => Object.prototype.hasOwnProperty.call(INV, n.key))),
  TITLES.flatMap((t) => t.needs.filter((n) => !(n.key in INV)).map((n) => n.key)).join(' · '));

// ── 4 · The status is derived, and the way to prove it is to remove
//        the material and watch the statuses move ─────────────────────

const EMPTY = Object.fromEntries(Object.keys(INV).map((k) => [k, 0]));
const starved = TITLES.map((t) => resolve(t, EMPTY));
const derivable = ROWS.filter((r) => r.status === STATUS.DERIVABLE);
const survived = derivable.filter((r) =>
  starved.find((s) => s.n === r.n).status === STATUS.DERIVABLE);
check('with the inventory emptied, no derivable title stays derivable',
  derivable.length > 0 && survived.length === 0,
  survived.map((r) => r.n).join(',') + ' did not move — status is not computed');

check('a title short of material states the deficit as a number',
  ROWS.filter((r) => r.status === STATUS.AUTHORING)
    .every((r) => r.short.length > 0 && r.short.every((s) => s.deficit > 0)),
  ROWS.filter((r) => r.status === STATUS.AUTHORING && !r.short.length).map((r) => r.n).join(','));

check('a governance blocker names what the decision is, not merely that there is one',
  ROWS.filter((r) => r.status === STATUS.GOVERNANCE)
    .every((r) => r.governance && r.governance.length > 60),
  ROWS.filter((r) => r.status === STATUS.GOVERNANCE && (r.governance || '').length <= 60)
    .map((r) => r.n).join(','));

check('all four statuses are represented; the catalogue is not uniformly optimistic',
  [STATUS.PUBLISHED, STATUS.DERIVABLE, STATUS.AUTHORING, STATUS.GOVERNANCE]
    .every((s) => ROWS.some((r) => r.status === s)),
  ROWS.map((r) => r.status).join(','));

check('a published title sits in the first wave and a governance title never does',
  published.every((r) => r.wave === 1)
  && ROWS.filter((r) => r.status === STATUS.GOVERNANCE).every((r) => r.wave >= 2),
  ROWS.filter((r) => r.status === STATUS.GOVERNANCE && r.wave < 2).map((r) => r.n).join(','));

check('every wave carries at least one title',
  WAVES.every((w) => ROWS.some((r) => r.wave === w.n)),
  WAVES.filter((w) => !ROWS.some((r) => r.wave === w.n)).map((w) => w.n).join(','));

// ── 5 · The inventory is measured, including its zeroes ──────────────

const { buildCurriculum } = await import(loadUrl('scripts/publication/curriculum.mjs'));
const C = buildCurriculum();
check('the inventory agrees with the curriculum model it is measured from',
  INV.modules === C.totals.modules && INV.items === C.totals.lessons
  && INV.questions === C.totals.questions,
  `${INV.modules}/${INV.items}/${INV.questions}`);

check('the audio position is counted as scripts and recordings separately',
  INV.listeningScripts > 0 && INV.audioCues > INV.listeningScripts && INV.recordedAudio === 0,
  `${INV.listeningScripts} scripts · ${INV.audioCues} cues · ${INV.recordedAudio} recorded`);

check('the cross-references are counted once, not once per direction',
  INV.crossRefs > 100 && INV.crossRefs < 250, String(INV.crossRefs));

check('the institutional zeroes are still zero, and are still measured',
  INV.assessmentsMapped === 0 && INV.appointedMembers === 0
  && INV.electedOfficers === 0 && INV.awardsIssued === 0,
  `${INV.assessmentsMapped}/${INV.appointedMembers}/${INV.electedOfficers}/${INV.awardsIssued}`);

// A loose keyword sweep once reported thirty business-English lessons
// and would have marked a business series ready to publish.
check('a subject appearing inside general English is not counted as a programme',
  INV.businessModules < 5 && INV.executiveModules < 5 && INV.youngLearnerModules === 0,
  `${INV.businessModules}/${INV.executiveModules}/${INV.youngLearnerModules}`);

// ── 6 · The house identity, as measurement ───────────────────────────

// seriesColours() throws on a violation rather than returning a bad
// assignment, which is right for the build and wrong for a test report:
// a thrown error prints a stack trace instead of naming the defect.
let colours = [], colourError = null;
try { colours = house.familyColours(); } catch (e) { colourError = e.message; }
check('the series colour assignment is valid', colourError === null, colourError);
check('every family in the catalogue has a colour, and no colour serves two families',
  colours.length === FAMILIES_IN_USE.length
  && new Set(colours.map((c) => c.token)).size === colours.length,
  colours.map((c) => c.token).join(','));

check('the house ground is not used as a family colour',
  colours.every((c) => c.token !== 'midnightNavy'));

check('every family colour reaches 3 : 1 on the ground it is printed on',
  colours.every((c) => c.ratio >= 3 && ['paper', 'navy'].includes(c.ground)),
  colours.filter((c) => c.ratio < 3).map((c) => `${c.family} ${c.ratio}`).join(' · '));

check('the four formats are distinct trims and each says why it exists',
  new Set(house.FORMATS.map((f) => `${f.w}x${f.h}`)).size === house.FORMATS.length
  && house.FORMATS.every((f) => f.why.length > 40));

check('the flagship format is the trim the flagship was actually produced at',
  house.formatFor('flagship').w === 210 && house.formatFor('flagship').h === 297);

check('no format is set to a measure beyond the ceiling',
  house.FORMATS.every((f) =>
    house.marginsFor(f.key, 300).measureChars <= house.MARGINS.maxMeasureChars),
  house.FORMATS.map((f) => `${f.key} ${house.marginsFor(f.key, 300).measureChars}`).join(' · '));

check('the gutter grows with extent rather than staying nominal',
  house.marginsFor('flagship', 500).gutter > house.marginsFor('flagship', 100).gutter,
  `${house.marginsFor('flagship', 100).gutter} → ${house.marginsFor('flagship', 500).gutter}`);

const spines = [64, 160, 320, 441].map(house.spineFor);
check('spine width rises with extent and each width states what it can carry',
  spines.every((s, i) => i === 0 || s.mm > spines[i - 1].mm)
  && spines.every((s) => s.carries.length > 20),
  spines.map((s) => `${s.pages}pp ${s.mm}mm`).join(' · '));

// spineWidth() floors at 6 mm, so a 40-page book reports 6 mm and not
// 2.3 mm. The band table has to describe the floored value or it
// describes a surface the binder will never produce.
check('a narrow spine floors at 6 mm and omits the crest at that width',
  house.spineFor(40).mm === 6 && /crest omitted/i.test(house.spineFor(40).carries),
  `${house.spineFor(40).mm} mm — ${house.spineFor(40).carries}`);

check('the under-6 mm band describes a book with no spine rather than type on one',
  /no spine|saddle/i.test(house.SPINE_RULES[0].name + house.SPINE_RULES[0].carries),
  house.SPINE_RULES[0].name);

const evidence = house.houseEvidence();
check('the house evidence recomputes rather than restating',
  evidence.colours.length === FAMILIES_IN_USE.length && evidence.levelBars === 6
  && evidence.spines.length === 4);

// ── 7 · The legacy layer: families, maturity, readiness ──────────────

const legacy = await import(loadUrl('scripts/publication/legacy.mjs'));
const {
  FAMILIES, MATURITY, MATURITY_MEANS, READINESS, REVIEWS, READINESS_EXCEPTIONS,
  ecosystem, familyTable, readinessOf, revisionHistory, maturityOf, citation, cataloguing,
  relatives,
} = legacy;

const ECO = ecosystem(INV);

check('every title belongs to a defined family',
  TITLES.every((t) => FAMILIES.some((f) => f.key === t.family)),
  TITLES.filter((t) => !FAMILIES.some((f) => f.key === t.family))
    .map((t) => `${t.n}: ${t.family}`).join(' · '));

check('every defined family carries at least one title — none is aspirational',
  familyTable(ECO).every((f) => f.titles.length > 0),
  familyTable(ECO).filter((f) => !f.titles.length).map((f) => f.key).join(' · '));

check('every family states a purpose and a readership',
  FAMILIES.every((f) => f.purpose.length > 30 && f.readership.length > 10));

check('no publication exists in isolation',
  TITLES.every((t) => relatives(t).length > 0),
  TITLES.filter((t) => !relatives(t).length).map((t) => t.n).join(','));

// Maturity is derived, and the derivation is exercised with inputs the
// Press does not currently have — otherwise the only branch ever run is
// the one that returns "first edition".
const asPublished = { artefact: 'publication/x.pdf', status: STATUS.PUBLISHED, build: 'x' };
check('maturity rises only with recorded reviews and further editions',
  maturityOf(asPublished, { revisions: [], reviews: [] }) === MATURITY.FIRST
  && maturityOf(asPublished, { revisions: [], reviews: [{ artefact: 'publication/x.pdf' }] })
    === MATURITY.REVIEWED
  && maturityOf(asPublished, {
    revisions: [{ edition: 1 }, { edition: 2 }], reviews: [{ artefact: 'publication/x.pdf' }],
  }) === MATURITY.MATURE
  && maturityOf({ status: STATUS.DERIVABLE, build: null }, {}) === MATURITY.CONCEPT
  && maturityOf({ status: STATUS.DERIVABLE, build: 'x' }, {}) === MATURITY.DEVELOPMENT);

check('no publication claims a maturity above first edition while no review is recorded',
  REVIEWS.length === 0
    ? ECO.every((r) => [MATURITY.CONCEPT, MATURITY.DEVELOPMENT, MATURITY.FIRST]
      .includes(r.maturity))
    : true,
  ECO.filter((r) => ![MATURITY.CONCEPT, MATURITY.DEVELOPMENT, MATURITY.FIRST].includes(r.maturity))
    .map((r) => r.n).join(','));

check('every maturity status is explained rather than left as a label',
  MATURITY_MEANS.length === Object.keys(MATURITY).length
  && MATURITY_MEANS.every(([, meaning]) => meaning.length > 40));

// Revision history is derived from the repository, not kept by hand.
const hist = revisionHistory('publication/IEFC Complete Curriculum.pdf');
check('the revision history is derived from the source repository',
  hist.available && hist.rows.length > 0
  && hist.rows.every((r) => /^\d{4}-\d{2}-\d{2}$/.test(r.date) && r.subject.length > 3),
  hist.available ? `${hist.total} revisions since ${hist.issued}` : hist.why);

check('a publication with no artefact reports why rather than an empty history',
  revisionHistory(null).available === false && revisionHistory(null).why.length > 20);

// The citation and cataloguing apparatus.
const cite = citation({ title: 'T', edition: 'First', year: 2026, documentId: 'ABCD' });
check('the citation names the corporate author, edition, place, publisher and document',
  /Worldwide English College\./.test(cite.note) && /First edition/.test(cite.note)
  && /London: Worldwide English College Press, 2026/.test(cite.note)
  && /Document ID ABCD/.test(cite.note), cite.note);

const cip = cataloguing({ title: 'T', family: 'WEC Governance Series', edition: 'First',
  year: 2026, pages: 40, audience: 'A', subjects: ['S'],
  registrations: [{ field: 'ISBN', value: 'Not assigned', authority: 'International ISBN Agency' }] });
check('the cataloguing data names an unheld identifier and the authority that issues it',
  cip.some(([k, v]) => k === 'ISBN' && /Not assigned/.test(v) && /ISBN Agency/.test(v)),
  JSON.stringify(cip.find(([k]) => k === 'ISBN')));

// The nine properties, probed across every issued artefact.
const probed = ECO.filter((r) => r.artefact).map((r) => ({
  name: r.edition || r.name, artefact: r.artefact, readiness: readinessOf(r.artefact, r.htmlSource),
}));

check('every issued artefact is probed against all nine properties',
  probed.length >= 8 && probed.every((p) => p.readiness.length === READINESS.length),
  `${probed.length} artefacts`);

check('a non-PDF artefact reports what cannot be established rather than reporting failure',
  probed.filter((p) => /\.docx$/.test(p.artefact))
    .every((p) => p.readiness.every((r) => r.result === null)),
  'a DOCX was probed with PDF instruments and reported false');

const failures = probed.flatMap((p) => p.readiness
  .filter((r) => r.result === false).map((r) => ({ artefact: p.artefact, key: r.key })));
const declared = (f) => READINESS_EXCEPTIONS.some((e) =>
  e.artefact === f.artefact && e.properties.includes(f.key));
check('every readiness failure is a declared exception, with a reason',
  failures.every(declared),
  failures.filter((f) => !declared(f)).map((f) => `${f.artefact} ${f.key}`).join(' · '));

// The half that stops the exception list silting up.
const stale = READINESS_EXCEPTIONS.flatMap((e) => e.properties
  .filter((k) => !failures.some((f) => f.artefact === e.artefact && f.key === k))
  .map((k) => `${e.artefact} ${k}`));
check('no declared exception has quietly started passing',
  stale.length === 0,
  stale.join(' · ') + ' — the exception should be removed');

check('every exception explains itself well enough for a stranger to act on',
  READINESS_EXCEPTIONS.every((e) => e.why.length > 120));

check('the artefacts that carry the apparatus carry all of it',
  probed.filter((p) => !READINESS_EXCEPTIONS.some((e) => e.artefact === p.artefact)
    && p.readiness.some((r) => r.result === true))
    .every((p) => p.readiness.every((r) => r.result !== false)),
  probed.filter((p) => p.readiness.some((r) => r.result === false))
    .map((p) => p.name).join(' · '));

// ── 8 · The canon: divisions, relationships, duplication, ranking ────

const canon = await import(loadUrl('scripts/publication/canon.mjs'));
const {
  DIVISIONS, SLATE, DUPLICATIONS, RESOLUTION, CRITERIA, IMPACT,
  canonIndex, ranking, unplaced,
} = canon;

const IDX = canonIndex(INV);

check('five divisions, each stating a purpose and the reader it is for',
  DIVISIONS.length === 5
  && DIVISIONS.every((d) => d.purpose.length > 40 && d.reader.length > 5));

check('every catalogue title is placed in a division — none exists in isolation',
  unplaced().length === 0,
  unplaced().map((t) => `${t.n} ${t.name}`).join(' · '));

check('every division carries titles',
  DIVISIONS.every((d) => IDX.some((r) => r.division === d.n && r.status)),
  DIVISIONS.filter((d) => !IDX.some((r) => r.division === d.n && r.status))
    .map((d) => d.n).join(','));

check('every canon slot either maps to a title or is resolved as a duplicate',
  SLATE.every((x) => x.n || DUPLICATIONS.some((d) => d.slot === x.slot)),
  SLATE.filter((x) => !x.n && !DUPLICATIONS.some((d) => d.slot === x.slot))
    .map((x) => x.slot).join(' · '));

// The relationships are the point of the canon: they must resolve.
const nums = new Set(TITLES.map((t) => t.n));
const badRel = SLATE.flatMap((x) => [...x.before, ...x.with, ...x.after]
  .filter((n) => !nums.has(n)).map((n) => `${x.slot} → ${n}`));
check('every stated relationship points at a title that exists',
  badRel.length === 0, badRel.join(' · '));

const selfRel = SLATE.filter((x) => x.n
  && [...x.before, ...x.with, ...x.after].includes(x.n));
check('no title is its own prerequisite, companion or sequel',
  selfRel.length === 0, selfRel.map((x) => x.slot).join(' · '));

check('every placed title states what to read before, alongside or after it',
  SLATE.filter((x) => x.n)
    .every((x) => x.before.length + x.with.length + x.after.length > 0),
  SLATE.filter((x) => x.n && !(x.before.length + x.with.length + x.after.length))
    .map((x) => x.slot).join(' · '));

// The duplication rule, applied to the canon slate itself.
check('every overlap is resolved by justifying, referencing or removing it',
  DUPLICATIONS.length > 0
  && DUPLICATIONS.every((d) => Object.values(RESOLUTION).includes(d.resolution)
    && d.why.length > 80 && d.into.length > 0),
  DUPLICATIONS.filter((d) => d.why.length <= 80).map((d) => d.slot).join(' · '));

check('a resolved overlap folds into titles that exist',
  DUPLICATIONS.every((d) => d.into.every((n) => nums.has(n))),
  DUPLICATIONS.flatMap((d) => d.into.filter((n) => !nums.has(n))).join(' · '));

check('the register uses more than one resolution — it has decided, not just justified',
  new Set(DUPLICATIONS.map((d) => d.resolution)).size >= 2,
  [...new Set(DUPLICATIONS.map((d) => d.resolution))].join(' · '));

// The ranking must cover every derivable title and be ordered by score.
const RANK = ranking(ROWS);
check('every derivable title is scored for educational impact',
  RANK.length > 0 && RANK.every((r) => typeof r.score === 'number' && r.why.length > 40),
  RANK.filter((r) => r.score === null).map((r) => r.n).join(','));

check('the publishing order is the score order, not the catalogue order',
  RANK.every((r, i) => i === 0 || RANK[i - 1].score >= r.score),
  RANK.map((r) => r.score).join(' '));

check('the criteria are weighted and each declares its scale',
  CRITERIA.every((c) => c.weight >= 1 && c.scale.includes('5 =')),
  CRITERIA.map((c) => c.name).join(' · '));

check('no title is scored twice, and no score sits outside the declared scale',
  new Set(IMPACT.map((i) => i.n)).size === IMPACT.length
  && IMPACT.every((i) => CRITERIA.every((c) => i[c.key] >= 1 && i[c.key] <= 5)),
  IMPACT.filter((i) => CRITERIA.some((c) => i[c.key] < 1 || i[c.key] > 5))
    .map((i) => i.n).join(','));

// A tie must be broken by a declared rule rather than by array order.
const tied = RANK.filter((r, i) => i > 0 && RANK[i - 1].score === r.score);
check('a tie in the ranking is broken by what the title unblocks',
  tied.every((r) => {
    const prev = RANK[RANK.indexOf(r) - 1];
    return (prev.scores?.unblocks ?? 0) >= (r.scores?.unblocks ?? 0);
  }),
  tied.map((r) => r.name).join(' · '));

check('the canon index records everything the directive requires of each entry',
  IDX.filter((r) => r.status).every((r) => r.division && r.title && r.family && r.audience
    && r.status && r.maturity && r.derivedFrom),
  IDX.filter((r) => r.status && !(r.family && r.audience && r.derivedFrom))
    .map((r) => r.slot).join(' · '));

// ── 9 · The volume itself ────────────────────────────────────────────

const VOLUME = `${ROOT}/publication/WEC Press — The Publishing Constitution.pdf`;
if (existsSync(VOLUME)) {
  const raw = readFileSync(VOLUME).toString('latin1');
  const pageCount = (raw.match(/\/Type\s*\/Page(?![s])/g) || []).length;
  check('the rendered volume has a plausible extent', pageCount >= 25 && pageCount <= 120,
    `${pageCount} pages`);
  check('the volume is tagged and carries a document outline',
    /\/StructTreeRoot/.test(raw) && /\/Outlines/.test(raw));
} else {
  check('the volume has been rendered', false, 'run: npm run press');
}

console.log(`\n${pass} passed, ${fail} failed`);
process.exit(fail ? 1 : 0);
