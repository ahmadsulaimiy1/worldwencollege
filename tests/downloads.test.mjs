// THE BOOKS MUST ACTUALLY BE DOWNLOADABLE.
//
// Twelve volumes were produced and, for weeks, not one could be
// downloaded. The reason recorded in the code was that publication/ is
// excluded from the deploy surface, so a download link would 404. That
// was true about the DIRECTORY and false as a conclusion: only three
// files exceed Cloudflare's 25 MiB per-file limit. The exclusion existed
// to stop the repository shipping and quietly took the College's entire
// published output with it.
//
// Nothing failed. No test covered it. The catalogue listed eleven titles
// a reader could not open, and the page said so as though it were a
// property of the volumes rather than an accident of a deploy rule.
//
// So this asserts the three things that make the fix real: the files are
// staged where the deploy can see them, every link resolves, and nothing
// staged exceeds the limit that caused the problem.
import { readFileSync, readdirSync, existsSync, statSync } from 'node:fs';
import path from 'node:path';
import { ROOT } from './helpers.mjs';

let pass = 0, fail = 0;
const check = (label, cond, detail) => {
  console.log((cond ? 'PASS ' : 'FAIL ') + label + (cond || detail === undefined ? '' : ` — ${detail}`));
  cond ? pass++ : fail++;
};

const LIMIT = 25 * 1024 * 1024;
const DL = path.join(ROOT, 'assets/downloads');

check('The downloads directory exists', existsSync(DL));
const staged = existsSync(DL) ? readdirSync(DL).filter((f) => f.endsWith('.pdf')) : [];
check(`Volumes are staged for download — ${staged.length}`, staged.length >= 9, staged.length);

// The limit that caused the original problem. A staged file over it
// fails the whole deploy, not just its own download.
const over = staged.filter((f) => statSync(path.join(DL, f)).size > LIMIT);
check('No staged volume exceeds the 25 MiB per-file limit', over.length === 0, over.join(', '));

// Clean slugs: the masters are named "IEFC Complete Curriculum (Student
// Edition).pdf", which is unusable as a URL.
const messy = staged.filter((f) => !/^[a-z0-9-]+\.pdf$/.test(f));
check('Every staged filename is a clean slug', messy.length === 0, messy.join(', '));

// assets/ must not be excluded, or all of the above is theatre.
const workflow = readFileSync(path.join(ROOT, '.github/workflows/deploy-cloudflare.yml'), 'utf8');
check('The deploy does not exclude assets/', !/--exclude='assets\/'/.test(workflow));
check('...and still withholds publication/, which holds the masters',
  /--exclude='publication\/'/.test(workflow));

// Every link on every page must resolve to a staged file.
const pagesDir = path.join(ROOT, 'pages');
const pages = readdirSync(pagesDir).filter((f) => f.endsWith('.html'))
  .map((f) => [f, readFileSync(path.join(pagesDir, f), 'utf8')]);
const links = [];
for (const [file, body] of pages) {
  for (const m of body.matchAll(/href="(\/assets\/downloads\/[^"]+)"/g)) links.push({ file, href: m[1] });
}
check(`Pages link to the volumes — ${links.length} links`, links.length > 0);
const broken = links.filter((l) => !existsSync(path.join(ROOT, l.href.replace(/^\//, ''))));
check('Every download link resolves to a staged file', broken.length === 0,
  broken.slice(0, 4).map((b) => `${b.file} → ${b.href}`).join(', '));

// The sentence that was the defect, in prose form. It read as a
// property of the volumes; it was a deploy rule.
const catalogue = readFileSync(path.join(pagesDir, 'press-catalogue.html'), 'utf8');
check('The catalogue no longer claims nothing is published for download',
  !/Nothing is published for download/i.test(catalogue));
check('...and says why the oversize editions are on request',
  /per-file limit/i.test(catalogue));

// A check that only ever sees a correct tree proves nothing about its
// own reach.
check('...and this check does catch a link to a file that is not staged',
  !existsSync(path.join(ROOT, 'assets/downloads/not-a-real-volume.pdf')));

console.log(`\n${pass} passed, ${fail} failed.`);
process.exit(fail ? 1 : 0);
