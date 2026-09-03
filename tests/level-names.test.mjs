// Run with: node --experimental-sqlite tests/level-names.test.mjs
//
// ONE SET OF ARABIC LEVEL NAMES, NOT TWO.
//
// The six Arabic level names are a published fact: they are on the six
// level pages, on the admissions pages and on the hub, all generated
// from `scripts/lib/arabic-kit.js`. They are now ALSO in
// `functions/_lib/academic/level-names.js`, because the kit is a
// CommonJS module in the build toolchain and no endpoint can reach it —
// which is why an Arabic learner's payment confirmation used to tell
// them, mid-sentence, that they had paid for the "English Mastery
// Programme".
//
// Two copies of a published name is exactly the drift this repository
// keeps guards for. This is that guard: the kit and the module must
// agree, name for name and ordinal for ordinal, or the build fails.
import { createRequire } from 'node:module';
import { readFileSync } from 'node:fs';
import { DatabaseSync } from 'node:sqlite';
import path from 'node:path';
import { ROOT, loadUrl } from './helpers.mjs';

const require = createRequire(import.meta.url);
const kit = require(path.join(ROOT, 'scripts/lib/arabic-kit.js'));
const { LEVEL_NAMES_AR, LEVEL_ORDINALS_AR, levelName, levelNaming } =
  await import(loadUrl('functions/_lib/academic/level-names.js'));

let pass = 0, fail = 0;
const check = (label, cond, detail) => {
  console.log((cond ? 'PASS ' : 'FAIL ') + label + (cond || detail === undefined ? '' : ` — ${detail}`));
  cond ? pass++ : fail++;
};

const db = new DatabaseSync(':memory:');
db.exec(readFileSync(path.join(ROOT, 'sql/schema.sql'), 'utf8'));
const levels = db.prepare('SELECT id, roman, name, cefr FROM programme_levels ORDER BY id').all();

check('the platform holds six programme levels', levels.length === 6, String(levels.length));

for (const lv of levels) {
  check(`Level ${lv.roman} has an Arabic name in the module`,
    Boolean(LEVEL_NAMES_AR[lv.id]), String(LEVEL_NAMES_AR[lv.id]));
  check(`...and it is the name the level pages are generated with`,
    LEVEL_NAMES_AR[lv.id] === kit.AR_LEVEL[lv.id].name,
    `${LEVEL_NAMES_AR[lv.id]} against ${kit.AR_LEVEL[lv.id].name}`);
  check(`...and the ordinal agrees too`,
    LEVEL_ORDINALS_AR[lv.id] === kit.AR_LEVEL[lv.id].ord,
    `${LEVEL_ORDINALS_AR[lv.id]} against ${kit.AR_LEVEL[lv.id].ord}`);
  check(`...and no Latin letter has leaked into the Arabic name`,
    !/[A-Za-z]/.test(LEVEL_NAMES_AR[lv.id]), LEVEL_NAMES_AR[lv.id]);
}

check('the module names no level the platform does not have',
  Object.keys(LEVEL_NAMES_AR).length === levels.length);

// The readers.
check('levelName() answers English for an English reader',
  levelName(levels[0], 'en') === levels[0].name);
check('...and Arabic for an Arabic one',
  levelName(levels[0], 'ar') === kit.AR_LEVEL[1].name, levelName(levels[0], 'ar'));
check('...and falls back to the English name for a level it does not know, rather than vanishing',
  levelName({ id: 99, name: 'Seventh Programme' }, 'ar') === 'Seventh Programme');
check('...and answers null for no level at all',
  levelName(null, 'ar') === null);

const naming = levelNaming(levels[5]);
check('levelNaming() hands a payload BOTH names, so the page chooses',
  naming.name === levels[5].name && naming.nameAr === kit.AR_LEVEL[6].name,
  `${naming.name} / ${naming.nameAr}`);
check('...with the roman numeral and the Arabic ordinal beside them',
  naming.roman === 'VI' && naming.ordinalAr === 'السادس');

console.log(`\n${pass} passed, ${fail} failed.`);
process.exit(fail ? 1 : 0);
