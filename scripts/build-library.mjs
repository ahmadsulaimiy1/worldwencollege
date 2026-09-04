// scripts/build-library.mjs — put the College's own books in reach.
//
// ─────────────────────────────────────────────────────────────────────
// THE FAULT THIS EXISTS TO CORRECT
// ─────────────────────────────────────────────────────────────────────
// WEC Press has produced sixteen typeset volumes — a complete
// curriculum in two editions, an assessment handbook, a pronunciation
// handbook, listening scripts, a student workbook, a teacher's
// companion, the programme architecture, the publishing constitution,
// the canon index, the editorial bible, production specifications.
// Seventy-five megabytes of finished academic work.
//
// Not one of them was reachable. No page on the site linked a single
// PDF, and .github/workflows/deploy-cloudflare.yml carried the line
//
//     --exclude='publication/'
//
// with the comment "not linked from any page, so publication/ is
// excluded above" — a self-sealing argument: nothing linked them, so
// they were not deployed, so nothing could link them.
//
// A college whose library exists only on the build machine has no
// library. This script gives every volume a clean, citable URL and
// generates the register that the Library page and the tests read.
//
// ─────────────────────────────────────────────────────────────────────
// WHY REDIRECTS AND NOT COPIES
// ─────────────────────────────────────────────────────────────────────
// The obvious approach is to copy publication/*.pdf into library/ under
// tidy slugs. That doubles seventy-five megabytes inside the git
// history for a naming convenience, and every rebuild of a volume then
// has to remember to re-copy it or the served file goes stale — the
// exact class of drift that cost this repository six level pages.
//
// So the files stay where the publication pipeline writes them, and
// _redirects maps a clean slug onto each one:
//
//     /library/complete-curriculum.pdf  →  /publication/IEFC%20Complete%20…
//
// The citable URL is stable, the served bytes are never duplicated, and
// a rebuilt volume is live the moment it is rebuilt.
//
// ─────────────────────────────────────────────────────────────────────
// THE 25 MiB WALL, STATED RATHER THAN WORKED AROUND
// ─────────────────────────────────────────────────────────────────────
// Cloudflare Pages refuses any single file over 25 MiB. Two volumes
// exceed it — the Complete Curriculum at 26.6 MB and its Student
// Edition at 25.5 MB — because both carry every plate of a six-level
// curriculum in one binding.
//
// That is a hosting limit, not a decision about openness, and the
// Library says so in those words. Both are supplied in full on request,
// and the material in them is downloadable here in three other forms
// that fit: the Flagship Curriculum, the Programme Architecture, and
// the per-level volumes. `oversize` marks them so the page can state
// the reason next to the volume rather than in a footnote.

import { readFileSync, writeFileSync, existsSync, statSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { emitPage, reportEmit } from './lib/emit-page.js';
// The licence on the page and the licence printed inside the volumes are
// the same instrument, read from one file, in both languages. See
// scripts/publication/rights.mjs.
import {
  SUMMARY, GRANTED, RESERVED, CHANNEL, TRACEABLE, NO_LOCK,
  SUMMARY_AR, GRANTED_AR, RESERVED_AR, CHANNEL_AR, TRACEABLE_AR, NO_LOCK_AR,
} from './publication/rights.mjs';

const ROOT = path.dirname(path.dirname(fileURLToPath(import.meta.url)));
const PUB = path.join(ROOT, 'publication');

// Cloudflare Pages' hard per-file ceiling.
const MAX_BYTES = 25 * 1024 * 1024;

// ── WHAT THE DEPLOY WILL ACTUALLY HOLD ───────────────────────────────
// A volume can be perfectly small and still be unservable, because the
// repository deliberately does not carry it. The Student Edition is
// ignored as a 25 MB near-duplicate of a book already in the history,
// and .gitignore says so with the command that rebuilds it.
//
// This generator did not know that. It measured both Student Edition
// files off the disk of whoever had built them, found the cover artwork
// to be half a megabyte, and wrote it a download URL — a public link,
// on the Library page, to a file no deployment has ever contained. The
// main volume escaped only because it is over the size ceiling and was
// caught by the other rule.
//
// So exclusion is read from .gitignore, where the decision actually
// lives, rather than listed again here where the two could drift.
const GITIGNORE = readFileSync(path.join(ROOT, '.gitignore'), 'utf8');
const notCommitted = (file) => GITIGNORE.includes(`publication/${file}`);

// ── THE REGISTER ─────────────────────────────────────────────────────
// One row per volume the Press has actually produced. `collection`
// groups them the way a reader looks for them, not the way the build
// happens to order them. `audience` is who the volume is FOR, which is
// the question a visitor is actually asking.
const VOLUMES = [
  // ── The curriculum ────────────────────────────────────────────────
  { slug: 'complete-curriculum', file: 'IEFC Complete Curriculum.pdf',
    title: 'IEFC Complete Curriculum',
    collection: 'The Curriculum', audience: 'Institutional',
    note: 'Every lesson of all six levels, with objectives, prerequisites, staged timings and the assessment each one is built toward. The reference edition.',
    note_ar: 'كل درس في المستويات الستة، بأهدافه ومتطلباته السابقة وتوقيت مراحله والتقييم الذي بُني نحوه. النسخة المرجعية.' },
  { slug: 'complete-curriculum-student', file: 'IEFC Complete Curriculum (Student Edition).pdf',
    title: 'IEFC Complete Curriculum — Student Edition',
    collection: 'The Curriculum', audience: 'Students',
    note: 'The same curriculum, set for a reader working through it rather than auditing it: the internal apparatus removed, the learning path kept.',
    note_ar: 'المنهج نفسه، مصفوف لقارئ يعمل فيه لا لمراجع يدقّقه: الأدوات الداخلية محذوفة، ومسار التعلّم كامل.' },
  { slug: 'flagship-curriculum', file: 'IEFC Flagship Curriculum.pdf',
    title: 'IEFC Flagship Curriculum',
    collection: 'The Curriculum', audience: 'Everyone',
    note: 'The programme in brief — the six levels, their CEFR alignment, credits, hours and awards. The volume to read first, and the smallest.',
    note_ar: 'البرنامج موجزًا — المستويات الستة، ومقابلها في الإطار الأوروبي، والأرصدة والساعات والشهادات. المجلد الذي يُقرأ أولًا، وأصغرها.' },
  { slug: 'programme-architecture', file: 'IEFC Programme Architecture (Institutional Edition).pdf',
    title: 'IEFC Programme Architecture — Institutional Edition',
    collection: 'The Curriculum', audience: 'Institutional',
    note: 'How the programme is constructed: the credit framework, the competency framework, and the lesson-to-outcome-to-assessment mapping, some still interim.',
    note_ar: 'كيف بُني البرنامج: إطار الأرصدة، وإطار الكفايات، والربط من الدرس إلى الناتج إلى التقييم، وحيث يكون الربط مؤقتًا فهو مُعلَن كذلك.' },

  // ── Teaching and assessment ───────────────────────────────────────
  { slug: 'assessment-handbook', file: 'IEFC Assessment Handbook.pdf',
    title: 'IEFC Assessment Handbook',
    collection: 'Teaching and Assessment', audience: 'Teachers and examiners',
    note: 'Every rubric, every pass criterion, every skill floor, and the marking standard applied to it — published in full, because an unreadable criterion is not one.',
    note_ar: 'كل معيار تصحيح، وكل شرط نجاح، وكل حدٍّ أدنى للمهارة، والمستوى الذي يُطبَّق عليه كلٌّ منها. منشورة كاملة، لأن شرطًا لا يستطيع المرشح قراءته ليس شرطًا.' },
  { slug: 'teachers-companion-level-1', file: "IEFC Level I Teacher's Companion.pdf",
    title: "IEFC Level I Teacher's Companion",
    collection: 'Teaching and Assessment', audience: 'Teachers',
    note: 'For each Level I lesson: what commonly goes wrong, why, a second explanation, and what to do for the learner who is behind or finished early.',
    note_ar: 'لكل درس من دروس المستوى الأول: ما يُخطئ فيه المتعلمون عادةً، ولماذا، وطريقة ثانية للشرح، وما يُفعَل مع من تأخّر ومع من أنهى مبكرًا.' },
  { slug: 'pronunciation-handbook', file: 'IEFC Pronunciation Handbook.pdf',
    title: 'IEFC Pronunciation Handbook',
    collection: 'Teaching and Assessment', audience: 'Students and teachers',
    note: 'The pronunciation targets by name, level by level, with what each one is and how it is marked. The reference behind every recording in the Listening Lab.',
    note_ar: 'أهداف النطق بأسمائها، مستوًى بعد مستوى، مع بيان كل هدف وكيف يُصحَّح. المرجع الذي تقوم عليه كل تسجيلة في معمل الاستماع.' },
  { slug: 'listening-scripts', file: 'IEFC Listening Scripts.pdf',
    title: 'IEFC Listening Scripts',
    collection: 'Teaching and Assessment', audience: 'Teachers',
    note: 'All 60 listening sets in full script, speakers marked, features targeted. Published as scripts; the recorded audio needs voices and a studio.',
    note_ar: 'مجموعات الاستماع الستون بنصوصها الكاملة، مع تحديد المتحدثين والسمات التي تستهدفها كل مجموعة. تُنشر نصوصًا؛ أما الصوت المسجَّل فيحتاج أصواتًا واستوديو.' },

  // ── Student material ──────────────────────────────────────────────
  { slug: 'student-workbook-level-1', file: 'IEFC Level I Student Workbook.pdf',
    title: 'IEFC Level I Student Workbook',
    collection: 'Student Material', audience: 'Students',
    note: 'The Level I exercises as a printable book, for a learner who wants the work away from a screen. Free to download, print and photocopy.',
    note_ar: 'تمارين المستوى الأول كتابًا قابلًا للطباعة، لمن يريد العمل بعيدًا عن الشاشة. حرّ التنزيل والطباعة والنسخ.' },

  // ── The Press itself ──────────────────────────────────────────────
  { slug: 'publishing-constitution', file: 'WEC Press — The Publishing Constitution.pdf',
    title: 'WEC Press — The Publishing Constitution',
    collection: 'The Press', audience: 'Institutional',
    note: 'What the Press may publish, who may review it, and the separations it holds — author is never reviewer. The instrument the imprint is bound by.',
    note_ar: 'ما يجوز للمطبعة نشره، ومن يجوز له مراجعته، والفصل الذي تحفظه — فالمؤلف لا يكون المراجع أبدًا. وهي الصك الذي تُلزَم به الدار.' },
  { slug: 'canon-index', file: 'WEC Canon Index.pdf',
    title: 'WEC Canon Index',
    collection: 'The Press', audience: 'Institutional',
    note: 'Every volume the Press has produced or planned, what each requires, and whether the material exists — computed against the record, not typed.',
    note_ar: 'كل مجلد أنتجته المطبعة أو خطّطت له، وما يتطلبه كل واحد، وهل توجد مادته. محسوب من السجل الأكاديمي لا مكتوب باليد.' },
  { slug: 'editorial-bible', file: 'IEFC Internal Editorial Bible.pdf',
    title: 'IEFC Internal Editorial Bible',
    collection: 'The Press', audience: 'Institutional',
    note: 'The house standard every volume is set to: orthography, terminology, citation, and the rules that keep twelve books reading as one press.',
    note_ar: 'المعيار الذي يُصفّ عليه كل مجلد: الإملاء والمصطلح والإحالة، والقواعد التي تجعل اثني عشر كتابًا تُقرأ كمطبعة واحدة.' },
  { slug: 'production-specifications', file: 'IEFC Production Specifications.pdf',
    title: 'IEFC Production Specifications',
    collection: 'The Press', audience: 'Institutional',
    note: 'Trim sizes, margins, type sizes, paper and binding for each format. Published so that anyone can reproduce a volume to the same specification.',
    note_ar: 'مقاسات القطع والهوامش وأحجام الحروف والورق والتجليد لكل صيغة. منشورة كي يستطيع أي أحد أن يُنتج مجلدًا بالمواصفة نفسها.' },

  // ── Cover artwork ─────────────────────────────────────────────────
  { slug: 'cover-artwork-curriculum', file: 'IEFC Cover Artwork.pdf',
    title: 'IEFC Complete Curriculum — Cover Artwork',
    collection: 'Cover Artwork', audience: 'Institutional',
    note: 'Print-ready cover, supplied so a licensed reprint carries the correct one.',
    note_ar: 'غلاف جاهز للطبع، مُتاح كي تحمل أي إعادة طبع مرخَّصة الغلاف الصحيح.' },
  { slug: 'cover-artwork-curriculum-student', file: 'IEFC Complete Curriculum (Student Edition) — Cover Artwork.pdf',
    title: 'IEFC Complete Curriculum, Student Edition — Cover Artwork',
    collection: 'Cover Artwork', audience: 'Institutional',
    note: 'Print-ready cover for the Student Edition.',
    note_ar: 'غلاف جاهز للطبع لنسخة الطالب.' },
  { slug: 'cover-artwork-architecture', file: 'IEFC Programme Architecture (Institutional Edition) — Cover Artwork.pdf',
    title: 'IEFC Programme Architecture — Cover Artwork',
    collection: 'Cover Artwork', audience: 'Institutional',
    note: 'Print-ready cover for the Institutional Edition.',
    note_ar: 'غلاف جاهز للطبع للنسخة المؤسسية.' },
];

// ── MEASURE, NEVER ASSERT ────────────────────────────────────────────
// Sizes are read off the files. A published figure that was typed is a
// figure that goes stale on the next rebuild, and a download size is
// exactly the kind of small claim nobody ever re-checks.

/**
 * THE EXTENT, COUNTED TWO WAYS.
 *
 * A publication page that says "443 pages" is making a claim, and the
 * cover generator derives the drawn spine width from the same number —
 * so a wrong count would show up as a book of the wrong thickness on a
 * shelf, which is exactly the kind of small wrongness nobody can name
 * but everybody sees.
 *
 * So it is counted twice, by two independent structures inside the PDF,
 * and disagreement is a hard error rather than a preference:
 *
 *   1. the page tree root's own /Count, which is what a reader uses;
 *   2. the number of /Type /Page objects actually in the file.
 *
 * These agreed to the page on all sixteen volumes the first time they
 * were run, which is what makes them worth keeping: a check that has
 * never disagreed is a check that will tell you the truth on the day
 * something breaks.
 */
function extentOf(file) {
  const raw = readFileSync(file).toString('latin1');
  const declared = Math.max(0, ...[...raw.matchAll(/\/Type\s*\/Pages\b[^>]*?\/Count\s+(\d+)/g)]
    .map((m) => Number(m[1])));
  const counted = (raw.match(/\/Type\s*\/Page(?![s])/g) || []).length;
  if (!declared || !counted) {
    throw new Error(`build-library: could not count the pages of "${path.basename(file)}". `
      + 'The extent is published and the spine width is drawn from it, so a volume whose '
      + 'page count cannot be read may not be registered.');
  }
  if (declared !== counted) {
    throw new Error(`build-library: "${path.basename(file)}" declares ${declared} pages in its `
      + `page tree but contains ${counted} page objects. One of them is wrong and the register `
      + 'will not guess which.');
  }
  return counted;
}
const rows = [];
const missing = [];
// The last register, used only to carry forward the size of a volume
// this checkout deliberately does not hold. Without it the generator
// could be run only on a machine that had built the ignored volumes,
// which is how the wrong redirect got written in the first place.
const PREVIOUS = (() => {
  const f = path.join(ROOT, 'data/library.json');
  if (!existsSync(f)) return new Map();
  try {
    const prev = JSON.parse(readFileSync(f, 'utf8'));
    return new Map((prev.volumes || []).map((r) => [r.file, r]));
  } catch { return new Map(); }
})();

for (const v of VOLUMES) {
  const full = path.join(PUB, v.file);
  const excluded = notCommitted(v.file);
  if (!existsSync(full)) {
    // A volume that is simply absent is still a hard error. One the
    // repository has decided not to carry is not: its size is taken
    // from the register it was measured into.
    if (!excluded) { missing.push(v.file); continue; }
    const was = PREVIOUS.get(v.file);
    if (!was) {
      throw new Error(`build-library: "${v.file}" is excluded by .gitignore and has never been `
        + 'measured into data/library.json, so its size cannot be stated. Build it once on a '
        + 'machine that can, and commit the register.');
    }
    rows.push({
      ...v,
      bytes: was.bytes,
      // DERIVED HERE, NEVER CARRIED. `mb` is nothing but a rendering of
      // `bytes`, and carrying the two forward as independent values let
      // them drift apart and then preserved the drift for ever: the two
      // excluded volumes reached the register saying 26,847,354 bytes
      // and "25.5 MB" — figures that describe different files, one of
      // them printed on the download button a reader presses. The
      // measured branch below has always computed it this way; this is
      // the same line, so the two branches can no longer disagree.
      mb: (was.bytes / 1048576).toFixed(1),
      extent: was.extent,
      oversize: was.bytes > MAX_BYTES,
      excluded: true,
      access: v.access || 'open',
      href: `/library/${v.slug}.pdf`,
      source: `/publication/${encodeURIComponent(v.file)}`,
    });
    continue;
  }
  const bytes = statSync(full).size;
  rows.push({
    ...v,
    bytes,
    mb: (bytes / 1048576).toFixed(1),
    extent: extentOf(full),
    oversize: bytes > MAX_BYTES,
    excluded,
    // THE ACCESS TIER. `open` is the default and is what every volume
    // published to date carries, because nothing already downloadable is
    // withdrawn by this policy — see the note above the register.
    access: v.access || 'open',
    href: `/library/${v.slug}.pdf`,
    source: `/publication/${encodeURIComponent(v.file)}`,
  });
}

if (missing.length) {
  throw new Error(
    `build-library: ${missing.length} registered volume(s) are not in publication/:\n  `
    + missing.join('\n  ')
    + '\nEither the volume has not been built or the register names it wrongly. '
    + 'A Library that lists a book it cannot serve is worse than one that lists fewer.');
}

// ── THE REGISTER, WRITTEN OUT ────────────────────────────────────────
// data/library.json is what pages/press-library.html and
// tests/library.test.mjs both read, so the page, the redirects and the
// tests cannot disagree about what the College publishes.
// A GATED VOLUME GETS NO PUBLIC URL. `served` is what the _redirects
// block maps and what the page offers as a download, so an `enrolled`
// volume is absent from both by construction rather than by a check
// somebody has to remember to run. No security theatre is claimed: the
// page says plainly that access comes with enrolment, not that the file
// is locked.
// `excluded` joins `oversize` here for the same reason: a URL the
// deploy cannot honour is worse than no URL, and the page has always
// had a way to say so.
const served = rows.filter((r) => !r.oversize && !r.excluded && r.access === 'open');
const out = {
  _: [
    'GENERATED by scripts/build-library.mjs — do not edit by hand.',
    'Sizes AND page counts are measured from publication/, never typed.',
    'extent: the page count, counted twice inside the PDF by two',
    'independent structures, which must agree. The drawn spine width on',
    'each cover in assets/covers/ is derived from it.',
    'oversize: true means the file exceeds the 25 MiB Cloudflare Pages',
    'per-file limit and cannot be served from this host. That is a',
    'hosting constraint and the Library says so in those words.',
    '',
    "access: 'open' means anyone may download it, with no account and no",
    "enrolment. 'enrolled' means the volume ships with enrolment or with",
    'the independent route\'s access step. Every volume published to date',
    'teaching volumes for Levels II-VI as the Press produces them.',
    '',
    'The enrolled tier is BUILT and shown — a volume marked `enrolled`',
    'gets the same publication page, the same specification and the',
    'same sample pages, and only the download becomes an invitation to',
    'enrol. What it does not do is take back a volume that was already',
    'open. tests/library.test.mjs holds a floor at the number of open',
    'volumes and fails the build if it drops, because withdrawing a',
    'published book is the owner\'s decision and not a build\'s. The',
    'tier therefore binds the per-level teaching volumes for Levels II',
    'to VI as the Press produces them, exactly as the Library page',
    'has said since before the machinery existed.',
  ],
  generated_from: 'publication/',
  max_bytes: MAX_BYTES,
  total: rows.length,
  downloadable: served.length,
  open: rows.filter((r) => r.access === 'open').length,
  enrolled: rows.filter((r) => r.access === 'enrolled').length,
  total_bytes: rows.reduce((n, r) => n + r.bytes, 0),
  collections: [...new Set(rows.map((r) => r.collection))],
  volumes: rows,
};
writeFileSync(path.join(ROOT, 'data', 'library.json'), JSON.stringify(out, null, 2) + '\n');

// ── THE CLEAN URLS ───────────────────────────────────────────────────
const OPEN = '# >>> GENERATED FROM scripts/build-library.mjs — DO NOT EDIT BY HAND';
const CLOSE = '# <<< END LIBRARY';
const width = Math.max(...served.map((r) => r.href.length));
const block = `${OPEN}
#
# The Library's citable URLs. Each one maps a stable slug onto the file
# the publication pipeline writes, so a volume rebuilt under its own
# name is live immediately and no PDF is duplicated into this repo.
#
# 200 rather than 301: the slug IS the address the College publishes and
# prints. A redirect would make the ugly path the real one.
#
${served.map((r) => `${r.href.padEnd(width)}  ${r.source}  200`).join('\n')}
${CLOSE}`;

const FILE = path.join(ROOT, '_redirects');
let text = readFileSync(FILE, 'utf8');
if (text.includes(OPEN)) {
  const start = text.indexOf(OPEN);
  const end = text.indexOf(CLOSE) + CLOSE.length;
  if (end < start) throw new Error('_redirects: the library markers are out of order.');
  text = text.slice(0, start) + block + text.slice(end);
} else {
  text = `${text.trimEnd()}\n\n${block}\n`;
}
writeFileSync(FILE, text);

const oversize = rows.filter((r) => r.oversize);
console.log(`library: ${served.length} of ${rows.length} volumes served, `
  + `${(out.total_bytes / 1048576).toFixed(0)} MB registered.`);
for (const r of oversize) {
  console.log(`  over 25 MiB, on request only: ${r.title} (${r.mb} MB)`);
}

// ─────────────────────────────────────────────────────────────────────
// THE LIBRARY PAGE, IN BOTH LANGUAGES
// ─────────────────────────────────────────────────────────────────────
// Generated from the register above rather than hand-written, for the
// reason recorded in tests/level-generators.test.mjs: a page listing
// sixteen files, their sizes and their URLs is a page that will drift
// from the files the moment anybody rebuilds a volume. The prose is
// authored — in the register — and the assembly is not.

const LANG = {
  en: {
    dir: 'ltr', base: '',
    eyebrow: 'WEC Press &middot; The Library',
    h1: 'Read the whole of it before you pay for any of it.',
    stake: 'Most institutions publish a prospectus and keep the curriculum. <strong>This College publishes the curriculum</strong> &mdash; every lesson, every rubric, every pass mark, every pronunciation target &mdash; as typeset volumes you can download now, without an account and without asking.',
    lede: 'Fourteen volumes of the College&rsquo;s own academic work, free to download, print and quote. No registration, no email address, no account. The <a href="#licence">licence</a> is one page and grants all of that outright.',
    facts: [['Volumes', 'V'], ['Downloadable', 'D'], ['Free', 'Always'], ['Account needed', 'None']],
    leafLabel: 'The Library',
    rubric: 'What the College has produced, and where to get it.',
    h2: 'The volumes, by collection.',
    lede2: 'Grouped the way a reader looks for them. Every size is measured from the file, not typed.',
    audience: 'For',
    download: 'Download',
    onRequest: 'On request',
    overNote: 'Over the 25&nbsp;MB limit this host accepts for a single file. That is a hosting constraint and nothing else: the volume is supplied in full on request, and the same material is downloadable above in the Flagship Curriculum and the Programme Architecture.',
    citeLabel: 'How to cite, and what you may do with these',
    cite: 'Cite as <em>WorldWide English College</em>, WEC Press, with the volume title and the edition year. Every page of every volume prints its title, the College&rsquo;s name and its edition mark, so a quotation can be traced to the page it came from &mdash; the full terms are in <a href="#licence">The Licence</a> below. Every volume is authored inside the College and has not yet been read by a qualified reader from outside it &mdash; <a href="/press/#review">On review</a> sets out what that means, and offers a copy to anyone willing to change it.',
    ctaH2: 'The curriculum is open. The programme is the part you enrol in.',
    ctaA: ['/academics/#levels', 'The Six Levels'],
    ctaB: ['/admissions/tuition/#ladder', 'What It Costs'],
    accessLabel: 'Access',
    accessRubric: 'One level open to anyone, and what enrolment adds to it.',
    accessH2: 'Level I is the open level.',
    accessLede: 'The College\u2019s proof is that you can read a whole level before paying anything. Level I is open in full \u2014 its curriculum, its workbook, its teaching companion \u2014 to anyone, with no account and no enrolment. So are the reference volumes any candidate is entitled to read before deciding: the Flagship Curriculum, the Programme Architecture, the Assessment Handbook and the Pronunciation Handbook.',
    accessRule: 'The rule, stated before it binds anything',
    accessRuleP: 'The per-level teaching volumes for Levels\u00a0II to\u00a0VI ship with <strong>enrolment or the independent route\u2019s access step</strong> as the Press produces them. That is a publishing decision, not a lock: the levels are shown, explained and previewed here in full, and the criteria they are assessed against stay open to everyone in the Assessment Handbook.',
    accessKept: 'What this does not do',
    accessKeptP: '<strong>Nothing already published is withdrawn.</strong> Every volume in the catalogue below is open today and stays open. The rule is written now, before the volumes it governs exist, for the same reason the curriculum was written before it was taught \u2014 a policy announced after the fact is indistinguishable from one invented to justify it.',
    onRequestCta: 'Request a volume',
    excludedNote: 'Not kept in the published file set, so it is not offered here as a direct download. Supplied in full on request.',
    // The volumes are English documents in both editions, so the
    // English page needs no marker and the Arabic page needs one.
    enNote: '',
  },
  ar: {
    dir: 'rtl', base: '/ar',
    eyebrow: 'مطبعة الكلية &middot; المكتبة',
    h1: 'اقرأه كله قبل أن تدفع في أيٍّ منه.',
    stake: 'تنشر أكثر المؤسسات كُتيّبًا تعريفيًا وتحتفظ بالمنهج. <strong>وهذه الكلية تنشر المنهج</strong> &mdash; كل درس، وكل معيار تصحيح، وكل درجة نجاح، وكل هدف نطق &mdash; مجلداتٍ مركَّبة تستطيع تنزيلها الآن، بلا حساب وبلا استئذان.',
    lede: 'أربعة عشر مجلدًا من العمل الأكاديمي للكلية، حرةَ التنزيل والطباعة والاقتباس. لا تسجيل، ولا بريد إلكتروني، ولا حساب. و<a href="#licence">الرخصة</a> صفحة واحدة تُبيح ذلك كله صراحةً.',
    facts: [['المجلدات', 'V'], ['قابلة للتنزيل', 'D'], ['التكلفة', 'مجانًا'], ['الحساب', 'غير مطلوب']],
    leafLabel: 'المكتبة',
    rubric: 'ما أنتجته الكلية، ومن أين تحصل عليه.',
    h2: 'المجلدات، بحسب المجموعة.',
    lede2: 'مجموعة بالطريقة التي يبحث بها القارئ عنها. وكل حجم مقيس من الملف لا مكتوب باليد.',
    audience: 'لِمَن',
    download: 'تنزيل',
    onRequest: 'بالطلب',
    overNote: 'يتجاوز حدَّ الـ25&nbsp;ميجابايت الذي يقبله هذا المستضيف للملف الواحد. وهذا قيد استضافة لا غير: يُسلَّم المجلد كاملًا بالطلب، والمادة نفسها قابلة للتنزيل أعلاه في المنهج الموجز وفي بنية البرنامج.',
    citeLabel: 'كيف تُستشهد، وما يُباح لك بها',
    cite: 'استشهد بها بوصفها من إصدار <em>الكلية العالمية للغة الإنجليزية</em>، مطبعة الكلية، مع عنوان المجلد وسنة الطبعة. وتطبع كل صفحة في كل مجلد عنوانَه واسمَ الكلية وعلامةَ طبعته، فيمكن تتبُّع الاقتباس إلى صفحته التي جاء منها &mdash; والشروط كاملة في <a href="#licence">الرخصة</a> أدناه. وكل مجلد مؤلَّف داخل الكلية ولم يقرأه بعد قارئ مؤهَّل من خارجها &mdash; و<a href="/ar/press/#review">عن المراجعة</a> يبيّن ما يعنيه ذلك، ويعرض نسخة على كل من يستعد لتغييره.',
    ctaH2: 'المنهج مفتوح. والبرنامج هو ما تلتحق به.',
    ctaA: ['/ar/academics/#levels', 'المستويات الستة'],
    ctaB: ['/ar/admissions/tuition/#ladder', 'ما تكلفته'],
    accessLabel: 'الوصول',
    accessRubric: 'مستوى واحد مفتوح للجميع، وما يضيفه الالتحاق إليه.',
    accessH2: 'المستوى الأول هو المستوى المفتوح.',
    accessLede: 'برهان الكلية أنك تستطيع قراءة مستوى كامل قبل أن تدفع شيئًا. فالمستوى الأول مفتوح بتمامه \u2014 منهجه وكتاب تدريباته ودليل مدرّسه \u2014 لأي أحد، بلا حساب وبلا التحاق، ومعه المجلدات المرجعية التي من حق كل مرشح أن يقرأها قبل أن يقرر: المنهج الموجز، وبنية البرنامج، ودليل التقييم، ودليل النطق.',
    accessRule: 'القاعدة، تُذكر قبل أن تُلزِم شيئًا',
    accessRuleP: 'مجلدات التدريس الخاصة بالمستويات من <strong>الثاني إلى السادس</strong> تُسلَّم مع <strong>الالتحاق أو مع خطوة الوصول في المسار المستقل</strong>، كلما أنتجتها المطبعة. وهذا قرار نشر لا قفل: فالمستويات معروضة هنا ومشروحة ومُعايَنة كاملةً، والمعايير التي تُقيَّم بها تبقى مفتوحة للجميع في دليل التقييم.',
    accessKept: 'وما لا تفعله هذه القاعدة',
    accessKeptP: '<strong>لا يُسحب شيء نُشر من قبل.</strong> فكل مجلد في الفهرس أدناه مفتوح اليوم ويبقى مفتوحًا. وتُكتب القاعدة الآن، قبل وجود المجلدات التي تحكمها، للسبب نفسه الذي كُتب به المنهج قبل أن يُدرَّس \u2014 فالسياسة التي تُعلَن بعد الواقعة لا تُميَّز عن سياسة اخترعت لتبريرها.',
    onRequestCta: 'اطلب مجلدًا',
    excludedNote: 'غير محفوظ في مجموعة الملفات المنشورة، فلا يُعرض هنا للتنزيل المباشر. ويُسلَّم كاملًا بالطلب.',
    // tests/bilingual-links.test.mjs: a crossing into English is marked
    // in its own anchor text, never in a footnote, because a reader
    // scanning a list of downloads reads the link.
    enNote: ' (بالإنجليزية)',
  },
};

// The Arabic titles and notes live beside the English ones so a
// translator edits one file, not two — and so a volume can never appear
// in one edition and not the other.
const AR = {
  'The Curriculum': 'المنهج', 'Teaching and Assessment': 'التدريس والتقييم',
  'Student Material': 'مادة الطالب', 'The Press': 'المطبعة', 'Cover Artwork': 'أعمال الأغلفة',
  Institutional: 'المؤسسات', Students: 'الطلاب', Everyone: 'الجميع',
  Teachers: 'المدرّسون', 'Teachers and examiners': 'المدرّسون والممتحنون',
  'Students and teachers': 'الطلاب والمدرّسون',
};

const GROUND = ['section--light grain', 'section--paper grain', 'section--dark grain aurora',
  'section--light grain', 'section--paper grain'];
// LEAF I IS ACCESS. The catalogue collections take II onward, and the
// Citation and Licence leaves take the two after them. The page carried
// two leaves numbered I for exactly one build; a numbered document with
// a repeated numeral is the one ornament that actively misinforms.
const ROMAN = ['II', 'III', 'IV', 'V', 'VI'];
const ARNUM = ['٢', '٣', '٤', '٥', '٦'];
const PLATE = ['library-plate.svg', 'award-standard.svg', 'authority-chain.svg',
  'competency-wheel.svg', 'crest-plate.svg'];
// Columns by volume count, so no collection ends on an orphaned card.
// Four volumes in a three-column grid render 3 + 1, which puts one book
// alone on a second row and reads as emphasis rather than as a list —
// the same fault the tuition ladder had, and the same fix: state the
// columns instead of letting them be inferred. Never a remainder of 1.
const COLS = { 1: 2, 2: 2, 3: 3, 4: 2, 5: 3, 6: 3, 7: 4, 8: 4 };

const SLUG = {
  'The Curriculum': 'curriculum', 'Teaching and Assessment': 'teaching',
  'Student Material': 'student-material', 'The Press': 'the-press',
  'Cover Artwork': 'cover-artwork',
};
const ICON = { 'The Curriculum': 'i-columns', 'Teaching and Assessment': 'i-scales',
  'Student Material': 'i-book', 'The Press': 'i-portico', 'Cover Artwork': 'i-crest' };

// ── THE LICENCE ──────────────────────────────────────────────────────
// The seventh leaf, and the one the Library was missing. The page has
// always said "free to download, print and quote"; what it never said
// was where that generosity stops, which left the College's own
// curriculum published with no stated term on it at all.
//
// Set from scripts/publication/rights.mjs — the same constants the
// printed volumes carry — so the licence a reader accepts on the website
// and the licence printed inside the file cannot drift apart. Both
// editions read from that one source, in their own language.
//
// The two lists are deliberately asymmetric in length and that is the
// argument: six things granted outright, and a short reserved set that
// every line of shares one property — it substitutes for the College
// rather than examining it.
function licenceLeaf(lang) {
  const ar = lang === 'ar';
  const T = ar
    ? { num: '٨', label: 'الرخصة', contents: 'الرخصة',
      h2: 'ما يُباح لك بهذه المجلدات، والقليل المحفوظ.',
      lede: SUMMARY_AR,
      grantedH: 'مُباح، دون استئذان ودون شروط',
      reservedH: 'محفوظ للكلية',
      channelH: 'السؤال هو الطريق الأقصر',
      traceH: 'قابلية التتبُّع', noLockH: 'ما لا تدّعيه الكلية',
      channel: CHANNEL_AR, trace: TRACEABLE_AR, noLock: NO_LOCK_AR,
      granted: GRANTED_AR, reserved: RESERVED_AR }
    : { num: 'VIII', label: 'The Licence', contents: 'The Licence',
      h2: 'What you may do with these volumes, and the little that is reserved.',
      lede: SUMMARY,
      grantedH: 'Granted, without asking and without conditions',
      reservedH: 'Reserved to the College',
      channelH: 'Asking is the short route',
      traceH: 'Traceability', noLockH: 'What the College does not claim',
      channel: CHANNEL, trace: TRACEABLE, noLock: NO_LOCK,
      granted: GRANTED, reserved: RESERVED };

  // The register, not two cards — because this is the object the site
  // already has for exactly this shape: two columns recording two
  // DIFFERENT states, each with its own mark. A granted permission takes
  // #i-struck, the settled mark; a reserved one takes #i-lock, which is
  // held rather than absent. Giving both the same tick would say the two
  // columns mean the same thing, which is the defect css/pillar.css
  // records the register as having been built to correct.
  const col = (open, icon, head, items) => `        <div class="register__col${
    open ? ' register__col--open' : ''} reveal edge-lit edge-lit--light aurum">
          <div class="register__head">
            <svg class="icon" aria-hidden="true"><use href="#${icon}"/></svg>
            <h3>${head}</h3>
            <span class="register__count">${items.length}</span>
          </div>
          <ul class="register__list register__list--${open ? 'open' : 'held'}">
${items.map((i) => `            <li><svg class="icon" aria-hidden="true"><use href="#${icon}"/></svg><span>${i}</span></li>`).join('\n')}
          </ul>
        </div>`;

  const plate = (icon, head, body) => `        <div class="card reveal tilt edge-lit edge-lit--light aurum">
          <span class="tilt__sheen" aria-hidden="true"></span>
          <span class="badge-dome badge-dome--lg gold-live"><svg class="icon" aria-hidden="true"><use href="#${icon}"/></svg></span>
          <h3>${head}</h3>
          <p>${body}</p>
        </div>`;

  // A PAPER GROUND, NOT A DARK ONE. The register is a light-ground
  // object — css/pillar.css gives .register__col a translucent white
  // fill and an ink rule — and on the navy leaf it first shipped on, the
  // plate fills read as smudges, the entry count numerals were bronze on
  // navy and effectively invisible, and the two head marks disappeared.
  // The rule in CLAUDE.md §2 is to use the atelier layer rather than
  // build a variant beside it, so the leaf moves to the material the
  // component was cut for instead of the component being re-cut.
  return `<section class="leaf section--paper grain" id="licence" data-contents="${T.contents}">
  <span class="leaf__ornament" aria-hidden="true" style="--leaf-plate:url(/assets/art/authority-chain.svg)"></span>
  <div class="container leaf__grid">
    <div class="leaf__margin">
      <span class="leaf__num foil">${T.num}</span>
      <span class="leaf__label">${T.label}</span>
    </div>
    <div class="leaf__body reveal">
      <div class="section-head">
        <h2>${T.h2}</h2>
        <p class="lede">${T.lede}</p>
      </div>

      <div class="register">
${col(false, 'i-struck', T.grantedH, T.granted)}

${col(true, 'i-lock', T.reservedH, T.reserved)}
      </div>

      <div class="callout reveal">
        <span class="callout__label">${T.channelH}</span>
        <p>${T.channel}</p>
      </div>

      <div class="grid grid--2">
${plate('i-countermark', T.traceH, T.trace)}
${plate('i-ring', T.noLockH, T.noLock)}
      </div>
    </div>
  </div>
</section>`;
}

function page(lang) {
  const L = LANG[lang];
  const ar = lang === 'ar';
  const tr = (s) => (ar ? (AR[s] || s) : s);
  const facts = L.facts.map(([dt, dd]) => {
    const v = dd === 'V' ? String(rows.length) : dd === 'D' ? String(served.length) : dd;
    return `      <div class="masthead__fact"><dt>${dt}</dt><dd>${v}</dd></div>`;
  }).join('\n');

  const leaves = out.collections.map((coll, i) => {
    const vols = rows.filter((r) => r.collection === coll);
    const dark = GROUND[i % GROUND.length].includes('--dark');
    const cards = vols.map((r) => {
      const dl = (r.oversize || r.excluded)
        ? `<a class="btn btn--outline magnetic" href="mailto:info@worldwencollege.co.uk?subject=${encodeURIComponent(r.title)}">${L.onRequestCta}</a>`
        : `<a class="btn btn--gold magnetic aurum aurum--twin" href="${r.href}" download>${L.download} &middot; ${r.mb}&nbsp;MB${L.enNote}</a>`;
      const note = ar ? (r.note_ar || r.note) : r.note;
      return `      <div class="card${dark ? ' card--dark' : ''} reveal tilt edge-lit${dark ? '' : ' edge-lit--light'} aurum">
        <span class="tilt__sheen" aria-hidden="true"></span>
        <span class="badge-dome${dark ? ' badge-dome--dark' : ''} badge-dome--lg gold-live"><svg class="icon" aria-hidden="true"><use href="#${ICON[coll] || 'i-book'}"/></svg></span>
        <span class="card__num">${L.audience} ${tr(r.audience).toLowerCase()}</span>
        <h3>${r.title}</h3>
        <p>${note}</p>${r.oversize ? `\n        <p class="form-note">${L.overNote}</p>` : r.excluded ? `\n        <p class="form-note">${L.excludedNote}</p>` : ''}
        <div class="btn-row">${dl}</div>
      </div>`;
    }).join('\n');
    const anchor = SLUG[coll] || `collection-${i + 1}`;
    return `<section class="leaf ${GROUND[i % GROUND.length]}" id="${anchor}" data-contents="${tr(coll)}">
  <span class="leaf__ornament" aria-hidden="true" style="--leaf-plate:url(/assets/art/${PLATE[i % PLATE.length]})"></span>
  <div class="container leaf__grid">
    <div class="leaf__margin">
      <span class="leaf__num foil">${ar ? ARNUM[i] : ROMAN[i]}</span>
      <span class="leaf__label">${tr(coll)}</span>
    </div>
    <div class="leaf__body reveal">
      <div class="section-head">
      <h2>${tr(coll)}</h2>
    </div>
    <div class="grid grid--${COLS[vols.length] || 3}">
${cards}
    </div>
  </div>
  </div>
</section>`;
  }).join('\n\n');

  return `<!--
  THE LIBRARY — GENERATED by scripts/build-library.mjs. Do not edit.
  Every volume, size and URL comes from data/library.json, which is
  measured from publication/. Edit the register in the script.
-->
<section class="page-hero masthead guilloche grain">
  <canvas class="constellation" aria-hidden="true"></canvas>
  <img class="masthead__plate" src="/assets/art/library-plate.svg" alt="" aria-hidden="true" width="320" height="400" data-depth="0.05">
  <div class="container masthead__inner">
    <p class="masthead__rule" aria-hidden="true"><svg class="icon" aria-hidden="true"><use href="#i-book"/></svg></p>

    <p class="masthead__eyebrow">${L.eyebrow}</p>
    <h1>${L.h1}</h1>
    <p class="masthead__stake">${L.stake}</p>
    <p class="lede">${L.lede}</p>

    <dl class="masthead__facts">
${facts}
    </dl>
    <p class="masthead__rule masthead__rule--foot" aria-hidden="true"><svg class="icon" aria-hidden="true"><use href="#i-laurel"/></svg></p>
  </div>
</section>

<section class="leaf section--paper grain" id="access" data-contents="${L.accessLabel}">
  <span class="leaf__ornament" aria-hidden="true" style="--leaf-plate:url(/assets/art/portico.svg)"></span>
  <div class="container leaf__grid">
    <div class="leaf__margin">
      <span class="leaf__num foil">${ar ? '\u0661' : 'I'}</span>
      <span class="leaf__label">${L.accessLabel}</span>
      <p class="leaf__rubric">${L.accessRubric}</p>
    </div>
    <div class="leaf__body reveal">
      <div class="section-head">
        <h2>${L.accessH2}</h2>
        <p class="lede">${L.accessLede}</p>
      </div>
      <div class="callout">
        <span class="callout__label">${L.accessRule}</span>
        <p>${L.accessRuleP}</p>
      </div>
      <div class="callout">
        <span class="callout__label">${L.accessKept}</span>
        <p>${L.accessKeptP}</p>
      </div>
    </div>
  </div>
</section>

${leaves}

<section class="leaf section--light grain" id="citation" data-contents="${ar ? 'الاستشهاد' : 'Citation'}">
  <span class="leaf__ornament" aria-hidden="true" style="--leaf-plate:url(/assets/art/portico.svg)"></span>
  <div class="container leaf__grid">
    <div class="leaf__margin">
      <span class="leaf__num foil">${ar ? '٧' : 'VII'}</span>
      <span class="leaf__label">${ar ? 'الاستشهاد والاستعمال' : 'Citation and Use'}</span>
    </div>
    <div class="leaf__body reveal">
      <div class="callout">
        <span class="callout__label">${L.citeLabel}</span>
        <p>${L.cite}</p>
      </div>
    </div>
  </div>
</section>

${licenceLeaf(lang)}

<section class="section--dark cta-band">
  <div class="container reveal">
    <h2>${L.ctaH2}</h2>
    <div class="btn-row u-center">
      <a href="${L.ctaA[0]}" class="btn btn--gold magnetic aurum aurum--twin">${L.ctaA[1]}</a>
      <a href="${L.ctaB[0]}" class="btn btn--outline magnetic">${L.ctaB[1]}</a>
    </div>
  </div>
</section>
`;
}

/* --registry-only: REFRESH THE MEASUREMENTS WITHOUT TOUCHING THE PAGES.
   This script does two jobs — it re-measures the volumes into
   data/library.json, and it re-scaffolds the two Library pages. They
   used to be inseparable, which meant that refreshing a stale byte
   count required WEC_REGENERATE=1, which meant reaching for the one
   flag that discards hand-edited pages in order to do the safest thing
   in the file. That is a trap, and it caught somebody: ten volumes had
   recorded sizes describing files that no longer existed, and the
   obvious way to fix them published 345 lines of scaffold over the
   presentation-page work on /press/library/.

   The measurement is the part that goes stale on every re-print. The
   pages are the part a person has edited since. Separating them means
   the routine job no longer runs through the destructive one. */
const REGISTRY_ONLY = process.argv.includes('--registry-only');

const emitted = REGISTRY_ONLY ? [] : [['press-library.html', page('en')], ['press-library.ar.html', page('ar')]]
  .map(([file, body]) => {
    const target = path.join(ROOT, 'pages', file);
    return { file: target, result: emitPage(target, body) };
  });

if (REGISTRY_ONLY) {
  console.log('build-library: --registry-only — data/library.json refreshed, pages untouched.');
}

// ── THE MANIFEST ENTRIES ─────────────────────────────────────────────
const MAN = path.join(ROOT, 'pages', 'manifest.json');
const manifest = JSON.parse(readFileSync(MAN, 'utf8'));
const entries = Array.isArray(manifest) ? manifest : manifest.pages;
const ENTRIES = [
  { slug: 'press-library', output: 'press/library/index.html',
    title: 'The Library &mdash; WEC Press',
    description: `${served.length} volumes of the College's own curriculum, assessment and teaching work, free to download without an account.`,
    contentFile: 'press-library.html', lang: 'en', dir: 'ltr',
    altHref: '/ar/press/library/', extraCss: ['/css/pillar.css', '/css/press.css'], contents: true },
  { slug: 'press-library-ar', output: 'ar/press/library/index.html',
    title: 'المكتبة — مطبعة الكلية',
    description: `${served.length} مجلدًا من منهج الكلية وتقييمها وعملها التدريسي، حرةَ التنزيل بلا حساب.`,
    contentFile: 'press-library.ar.html', lang: 'ar', dir: 'rtl',
    altHref: '/press/library/', extraCss: ['/css/pillar.css', '/css/press.css'], contents: true },
];
for (const e of ENTRIES) {
  const i = entries.findIndex((x) => x.slug === e.slug);
  if (i >= 0) entries[i] = { ...entries[i], ...e }; else entries.push(e);
}
writeFileSync(MAN, JSON.stringify(manifest, null, 2) + '\n');
reportEmit('build-library.mjs', emitted);
console.log('library: manifest updated for pages/press-library{,.ar}.html.');
