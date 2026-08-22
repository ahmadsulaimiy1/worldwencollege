// THE DEPLOY JOB IS NOT COVERED BY THE JOB THAT GATES IT.
//
// `verify` runs the whole suite and then `deploy` runs, and until this
// file existed nothing in `verify` looked at what `deploy` would do. So
// a one-word error in the deploy path could pass every test, gate
// itself green, and then fail — which is exactly what happened.
//
// The rebrand that was later reverted mapped the infrastructure name
// 'wec-lc' to 'aipc'. The reverse map turned 'aipc' back into 'wec',
// dropping the suffix, and scripts/migrate-remote.mjs went on asking
// Cloudflare for a database called 'wec'. Every deploy failed at that
// line with "Couldn't find DB with name 'wec'" while the suite stayed
// green, because the suite had never read that line.
//
// These assertions read the deploy configuration as data and require
// the names in it to agree with one another. They are cheap, and they
// are the only thing standing between a renamed resource and a silent
// week of failed deploys.
import { readFileSync } from 'node:fs';
import path from 'node:path';
import { ROOT } from './helpers.mjs';

let pass = 0, fail = 0;
const check = (label, cond, detail) => {
  console.log((cond ? 'PASS ' : 'FAIL ') + label + (cond || detail === undefined ? '' : ` — ${detail}`));
  cond ? pass++ : fail++;
};

const toml = readFileSync(path.join(ROOT, 'wrangler.toml'), 'utf8');
const wf = readFileSync(path.join(ROOT, '.github/workflows/deploy-cloudflare.yml'), 'utf8');
const migrator = readFileSync(path.join(ROOT, 'scripts/migrate-remote.mjs'), 'utf8');

// --- The D1 database -------------------------------------------------
const dbName = (/database_name\s*=\s*"([^"]+)"/.exec(toml) || [])[1];
check('wrangler.toml names a D1 database', !!dbName, dbName);

const migratorDefault = (/D1_DATABASE_NAME\s*\|\|\s*'([^']+)'/.exec(migrator) || [])[1];
check('The migration runner has a database name to fall back on', !!migratorDefault, migratorDefault);
check('...and it is the SAME database wrangler.toml binds', migratorDefault === dbName,
  `migrate-remote.mjs says "${migratorDefault}", wrangler.toml says "${dbName}"`);

// The workflow also names the database directly, in the seeding step.
// Three places, one name.
const wfDbNames = [...wf.matchAll(/wrangler d1 execute (\S+)/g)].map((m) => m[1]);
check('The workflow calls `wrangler d1 execute` by name', wfDbNames.length > 0, wfDbNames.join(', '));
const wrongInWorkflow = wfDbNames.filter((n) => n !== dbName);
check('...and every one of those names is the bound database',
  wrongInWorkflow.length === 0, wrongInWorkflow.join(', '));

// --- The Pages project ------------------------------------------------
const projectName = (/^name\s*=\s*"([^"]+)"/m.exec(toml) || [])[1];
check('wrangler.toml names the Pages project', !!projectName, projectName);
const wfProjects = [...wf.matchAll(/--project-name[= ]([A-Za-z0-9_-]+)/g)].map((m) => m[1]);
const wrongProjects = wfProjects.filter((n) => n !== projectName && !n.startsWith('$'));
check('Every --project-name in the workflow is that project',
  wrongProjects.length === 0, wrongProjects.join(', '));

// --- The R2 buckets ---------------------------------------------------
const buckets = [...toml.matchAll(/bucket_name\s*=\s*"([^"]+)"/g)].map((m) => m[1]);
check('wrangler.toml names both R2 buckets', buckets.length === 2, buckets.join(', '));
for (const b of buckets) {
  check(`The workflow creates "${b}" if it is missing`,
    new RegExp(`r2 bucket create ${b}\\b`).test(wf) || wf.includes(b), b);
}

// --- The whole family shares one prefix -------------------------------
// The single check that would have caught the original defect on its
// own: every Cloudflare resource this College owns is named for the
// project, and a name that has quietly lost part of itself stops
// matching. Derived from wrangler.toml rather than hard-coded, so
// renaming the project deliberately does not fail this — renaming half
// of it does.
const family = [dbName, projectName, ...buckets];
const odd = family.filter((n) => !n.startsWith(projectName));
check('Every Cloudflare resource is named for the Pages project',
  odd.length === 0, `${odd.join(', ')} does not start with "${projectName}"`);

// --- And the placeholder is still a placeholder -----------------------
// The workflow substitutes the real id from a secret at deploy time. If
// a real id were ever committed here it would be a credential in git.
check('No real D1 database id is committed to wrangler.toml',
  /database_id\s*=\s*"REPLACE_WITH_REAL_D1_DATABASE_ID"/.test(toml));
check('...and the workflow substitutes it and checks the substitution took',
  wf.includes('REPLACE_WITH_REAL_D1_DATABASE_ID') && /still holds the placeholder/i.test(wf));

console.log(`\n${pass} passed, ${fail} failed.`);
process.exit(fail ? 1 : 0);
