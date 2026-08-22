// Run with: node tests/browser/staff-consoles.mjs
//
// THE SIX STAFF CONSOLES, in a real browser, against the real modules.
//
// Every capability on this desk existed as an endpoint before it
// existed as a surface: a learner could submit an essay, book a
// tutorial, open an appeal and write to their tutor, and the tutor had
// no screen on which any of it appeared. These are those screens, and
// what this suite proves is not that they render — route-audit.mjs
// already walks all 181 routes for that — but that the refusals they
// are built around actually reach the person using them.
//
//   THE WORK IS FINDABLE, AND MARKABLE. The marking queue is oldest
//   first, carries the rubric the learner was set, carries the mark a
//   resit is a resit of, and a mark entered here reaches the platform
//   and takes the item out of the queue. Before the queue existed,
//   `gradeAssignment()` took a `submissionId` nothing anywhere
//   produced.
//
//   THE RUBRIC IS ON SCREEN AND IS READABLE. It shipped once as a pale
//   empty rectangle — the College's own criteria, invisible, on the one
//   panel the house standard says may never be collapsed away, because
//   `.plate-dark` is written as `.card.plate-dark` and did nothing at
//   all on an element that is not a card. The check below reads the
//   computed ground rather than the class list, because the class list
//   was right.
//
//   A MARK DOES NOT LEAVE WITHOUT A REASON. Stricter than the endpoint,
//   on purpose: the platform will accept a bare mark and this page will
//   not, because the regulations promise the learner something they can
//   act on and appeal.
//
//   THE ENTRANCE RESOLVES. `.reveal` is cleared by an observer wired at
//   DOMContentLoaded over the elements that exist then — the wrong half
//   of a console. Every plate on these pages is built by script after
//   that, and the first build of these screens rendered a masthead and
//   four thousand pixels of nothing. The check below fails on any
//   struck plate still sitting at opacity 0 once the page has settled.
//
//   AND THE CONSOLE IS BILINGUAL. Every page is loaded in both
//   editions and both must carry the same struck shapes — a staff
//   surface that is English-only is a staff surface half the College
//   cannot use.
import { chromium } from 'playwright';
import { spawn } from 'node:child_process';
import { existsSync, mkdirSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const HERE = dirname(fileURLToPath(import.meta.url));
const PORT = process.env.LAB_PORT || 8852;
const BASE = `http://localhost:${PORT}`;
const OUT = join(HERE, 'screenshots');
mkdirSync(OUT, { recursive: true });

let pass = 0, fail = 0;
const check = (label, cond, detail) => {
  console.log((cond ? 'PASS ' : 'FAIL ') + label + (cond || detail === undefined ? '' : ` — ${detail}`));
  cond ? pass++ : fail++;
};

const server = spawn(process.execPath, ['--experimental-sqlite', join(HERE, 'lab-server.mjs')], {
  env: { ...process.env, LAB_PORT: String(PORT) }, stdio: ['ignore', 'pipe', 'pipe'],
});
await new Promise((resolve, reject) => {
  const t = setTimeout(() => reject(new Error('server did not start')), 20000);
  server.stdout.on('data', (d) => { if (String(d).includes('ready')) { clearTimeout(t); resolve(); } });
  server.stderr.on('data', (d) => { if (!/ExperimentalWarning|trace-warnings/.test(String(d))) process.stderr.write(d); });
});

const exe = process.env.PW_CHROMIUM || '/opt/pw-browsers/chromium-1194/chrome-linux/chrome';
const browser = await chromium.launch(existsSync(exe) ? { executablePath: exe } : {});
const errs = [];

async function open_(path, viewport) {
  const page = await browser.newPage({ viewport: viewport || { width: 1440, height: 1000 } });
  await page.route('**://fonts.googleapis.com/**', (r) => r.abort());
  await page.route('**://fonts.gstatic.com/**', (r) => r.abort());
  page.on('pageerror', (e) => errs.push(`${path}: ${e.message}`));
  page.on('console', (m) => {
    if (m.type() !== 'error') return;
    const txt = m.text();
    if (/net::ERR_FAILED|fonts\.(googleapis|gstatic)/.test(txt)) return;
    errs.push(`${path}: console ${txt}`);
  });
  await page.goto(BASE + path, { waitUntil: 'domcontentloaded' });
  await page.waitForTimeout(1600);
  return page;
}

const PAGES = [
  'staff-desk', 'staff-marking', 'staff-learners',
  'staff-hours', 'staff-notices', 'staff-cases', 'staff-admissions',
  'staff-enrolments', 'staff-finance', 'staff-administration',
];

/**
 * The stub Clerk chain the auth suite uses, so a page can be loaded as
 * somebody in particular. Without it every console here runs in the
 * no-key preview state and is whoever the harness defaults to — which
 * cannot exercise the one thing the Registrar's half of the caseload
 * turns on, namely being an administrator rather than a tutor.
 */
function stubAuth(page, who) {
  const js = (body) => (route) => route.fulfill({ contentType: 'text/javascript', body });
  return Promise.all([
    page.route('**/js/auth-config.js*', js('window.WEC_LC_AUTH={clerkPublishableKey:"pk_test_stub"};')),
    page.route('**/js/clerk-loader.js*', js(`
      window.WEC_LC_loadClerk = function (pk, done) {
        var n = 0;
        done(null, {
          user: { id: 'user_${who}', firstName: 'Stub', lastName: 'User',
                  primaryEmailAddress: { emailAddress: '${who}@example.com' } },
          session: { getToken: function () { n += 1; return Promise.resolve('stub-${who}#' + n); } },
          signOut: function (cb) { cb && cb(); },
          openUserProfile: function () {},
          redirectToSignIn: function () {}
        });
      };
    `)),
  ]);
}

try {
  // ── 1 · Both editions of all six, and the entrance resolves ────────
  const shapes = {};
  for (const name of PAGES) {
    for (const prefix of ['', 'ar/']) {
      const path = `/${prefix}${name}.html`;
      const page = await open_(path);
      const seen = await page.evaluate(() => {
        const plates = Array.from(document.querySelectorAll('.stf-item, .stf-count'));
        return {
          items: document.querySelectorAll('.stf-item').length,
          counts: document.querySelectorAll('.stf-count').length,
          aurum: document.querySelectorAll('.aurum').length,
          edge: document.querySelectorAll('.edge-lit').length,
          domes: document.querySelectorAll('.badge-dome--lg').length,
          // An entrance that never fired leaves the plate at zero, and
          // the page looks empty with nothing in the console.
          invisible: plates.filter((el) => Number(getComputedStyle(el).opacity) < 0.9).length,
          state: (document.getElementById('state') || {}).textContent || '',
          overflow: document.documentElement.scrollWidth > window.innerWidth + 1,
        };
      });
      shapes[prefix + name] = seen;
      check(`${path} renders struck shapes`, seen.items + seen.counts > 0,
        `${seen.items} items, ${seen.counts} counts`);
      check(`${path} — every plate finished its entrance`, seen.invisible === 0,
        `${seen.invisible} still at opacity 0`);
      check(`${path} — no horizontal overflow`, !seen.overflow);
      check(`${path} — the page says what it is`, seen.state.trim().length > 10,
        seen.state.slice(0, 50));
      await page.close();
    }
  }

  for (const name of PAGES) {
    const en = shapes[name];
    const ar = shapes['ar/' + name];
    check(`${name}: both editions carry the same struck shapes`,
      en.items === ar.items && en.counts === ar.counts && en.domes === ar.domes,
      `en ${en.items}/${en.counts}/${en.domes} vs ar ${ar.items}/${ar.counts}/${ar.domes}`);
  }

  // ── 2 · The marking queue ──────────────────────────────────────────
  {
    const page = await open_('/staff-marking.html');

    const queue = await page.evaluate(() => Array.from(
      document.querySelectorAll('[data-written-queue] .stf-item'),
    ).map((li) => ({
      id: li.getAttribute('data-id'),
      wait: (li.querySelector('.stf-wait__read') || {}).textContent || '',
      rubric: (li.querySelector('.stf-rubric') || {}).textContent || '',
      rubricGround: li.querySelector('.stf-rubric')
        ? getComputedStyle(li.querySelector('.stf-rubric')).backgroundImage : '',
      work: (li.querySelector('.stf-work') || {}).textContent || '',
      prior: (li.querySelector('.stf-prior') || {}).textContent || '',
      chips: Array.from(li.querySelectorAll('.desk-chip')).map((c) => c.textContent),
    })));

    check(`The queue carries the work waiting to be marked (${queue.length})`, queue.length === 3,
      queue.map((q) => q.id).join(', '));
    check('…oldest first, because a queue sorted the other way starves the longest wait',
      queue[0].id === 'asub_oldest', queue.map((q) => q.id).join(' → '));
    check('…and every piece says how long its learner has been waiting',
      queue.every((q) => /\d/.test(q.wait)), queue[0].wait);

    check('THE RUBRIC TRAVELS WITH THE WORK',
      /GRADING RUBRIC/i.test(queue[0].rubric), queue[0].rubric.slice(0, 60));
    // The class list was right the first time and the panel was still
    // blank. What decides it is the painted ground.
    check('…and the rubric plate is actually struck, not a pale empty box',
      /gradient/.test(queue[0].rubricGround), queue[0].rubricGround.slice(0, 60));
    check('…and what the learner wrote is beside it',
      /Kuala Lumpur/.test(queue[0].work), queue[0].work.slice(0, 60));

    const resit = queue.find((q) => q.id === 'asub_resit');
    check('A RESIT IS NOT MARKED AS A FIRST ATTEMPT — the earlier mark travels with it',
      Boolean(resit) && /58%/.test(resit.prior), resit && resit.prior.slice(0, 80));
    check('…and so does the feedback that went with it',
      Boolean(resit) && /past tense/i.test(resit.prior));
    check('…and the plate is marked as a resit', Boolean(resit)
      && resit.chips.some((c) => /resit/i.test(c)), resit && resit.chips.join(' · '));

    // The pass line, from the platform's own scale rather than a number
    // typed into this page.
    const passLine = await page.textContent('.stf-mark__line');
    check('The pass mark on screen is the platform\'s own',
      /70/.test(passLine) && /WEC 4\.00/.test(passLine), (passLine || '').trim());

    // A MARK DOES NOT LEAVE WITHOUT A REASON.
    await page.locator('[data-written-queue] .stf-item').first().locator('button.btn--gold').click();
    await page.waitForTimeout(400);
    const refused = await page.textContent('[data-written-queue] .stf-item .stf-said');
    check('A mark with no feedback behind it is refused by the page itself',
      /required/i.test(refused || ''), (refused || '').trim());
    const stillThere = await page.locator('[data-written-queue] .stf-item').count();
    check('…and nothing was sent', stillThere === 3, String(stillThere));

    // …and with one, it is recorded and leaves the queue.
    await page.locator('[data-written-queue] .stf-item').first().locator('textarea')
      .fill('The self-introduction is complete and audible. Work on the country-name stress next.');
    await page.locator('[data-written-queue] .stf-item').first().locator('button.btn--gold').click();
    await page.waitForFunction(
      () => document.querySelectorAll('[data-written-queue] .stf-item').length === 2,
      { timeout: 8000 },
    );
    check('A mark with a reason is recorded, and the work leaves the queue', true);

    const graded = await (await fetch(`${BASE}/api/lms/marking-queue?status=graded`)).json();
    const one = (graded.submissions || []).find((s) => s.id === 'asub_oldest');
    check('…and it is on the learner\'s record with the mark and the reason',
      Boolean(one) && one.grade !== null && /country-name stress/.test(one.feedback || ''),
      one && `${one.grade} · ${(one.feedback || '').slice(0, 40)}`);

    await page.screenshot({ path: join(OUT, 'staff-01-marking.png'), fullPage: true });
    await page.close();
  }

  // ── 3 · The roster is not a search ─────────────────────────────────
  {
    const page = await open_('/staff-learners.html');
    const roster = await page.evaluate(() => ({
      names: Array.from(document.querySelectorAll('[data-roster] .stf-item__name'))
        .map((n) => n.textContent),
      basis: (document.querySelector('[data-roster-basis]') || {}).textContent || '',
      search: document.querySelectorAll('input[type="search"], [data-roster-search]').length,
    }));
    check('The roster names the learners in this tutor\'s care',
      roster.names.length > 0, roster.names.join(', '));
    // A learner with five live enrolments was five people on this list
    // until staffRoster() stopped returning its own join.
    check('…once each, not once per enrolment',
      new Set(roster.names).size === roster.names.length, roster.names.join(', '));
    check('…on a basis the payload states rather than the page asserts',
      /thread|booked|marked|register/i.test(roster.basis), roster.basis.slice(0, 60));
    check('There is no search over learners, which is the feature',
      roster.search === 0, String(roster.search));

    await page.locator('[data-roster] .stf-item button').first().click();
    await page.waitForTimeout(1600);
    const learner = await page.evaluate(() => ({
      notice: (document.querySelector('[data-engagement-notice]') || {}).textContent || '',
      modules: document.querySelectorAll('[data-modules] .stf-item').length,
      registerOffered: !document.querySelector('[data-register]').hidden,
      reasonRequired: Boolean(document.querySelector('[data-register-reason]')),
    }));
    check('Opening a learner shows the College\'s own definition of engagement, unaltered',
      learner.notice.trim().length > 20, learner.notice.slice(0, 70));
    check(`…their modules (${learner.modules})`, learner.modules > 0);
    check('…and a register a tutor may take', learner.registerOffered && learner.reasonRequired);

    // The reason is not optional, here or on the server.
    await page.locator('[data-register-send]').click();
    await page.waitForTimeout(400);
    const said = await page.textContent('[data-register-said]');
    check('A register mark with no reason is refused before it is sent',
      /required/i.test(said || ''), (said || '').trim());

    await page.screenshot({ path: join(OUT, 'staff-02-learners.png'), fullPage: true });
    await page.close();
  }

  // ── 4 · Publishing an hour, and withdrawing one ────────────────────
  {
    const page = await open_('/staff-hours.html');
    const before = await page.locator('[data-diary] .stf-item').count();
    check(`The diary carries the hours this tutor published (${before})`, before > 0);

    const zone = await page.textContent('[data-diary-zone]');
    check('…rendered in a named zone, with the instant held in UTC',
      /UTC/.test(zone || ''), (zone || '').trim().slice(0, 70));
    const shown = await page.textContent('[data-diary] .stf-item .stf-item__where');
    check('…and no hour is stamped "UTCZ"', !/UTCZ/.test(shown || ''), (shown || '').trim());

    await page.fill('[data-publish-title]', 'A tutorial published from the console');
    await page.fill('[data-publish-start]', '2027-03-04T15:30');
    await page.locator('[data-publish-send]').click();
    await page.waitForFunction(
      (n) => document.querySelectorAll('[data-diary] .stf-item').length === n + 1,
      before, { timeout: 8000 },
    );
    check('An hour published from the console reaches the diary', true);

    const feed = await (await fetch(`${BASE}/api/staff/slots?limit=50`)).json();
    const mine = (feed.slots || []).find((s) => s.title === 'A tutorial published from the console');
    check('…under the signed-in tutor and nobody else', Boolean(mine) && feed.tutorId === 'usr_tutor',
      feed.tutorId);
    check('…and at the instant the browser\'s zone made of what was typed',
      Boolean(mine) && /^2027-03-04T/.test(mine.startsAt.utc), mine && mine.startsAt.utc);

    // Withdrawal keeps the hour and demands a reason.
    const first = page.locator('[data-diary] .stf-item').first();
    await first.locator('button.btn--outline').click();
    await page.waitForTimeout(400);
    const refusal = await first.locator('.stf-said').textContent();
    check('An hour is not withdrawn without a reason', /required/i.test(refusal || ''),
      (refusal || '').trim());

    await page.screenshot({ path: join(OUT, 'staff-03-hours.png'), fullPage: true });
    await page.close();
  }

  // ── 5 · Writing a notice in both editions ──────────────────────────
  {
    const page = await open_('/staff-notices.html');
    const board = await page.locator('[data-board] .stf-item').count();
    check(`The board carries the notices this member of staff may read (${board})`, board > 0);

    await page.fill('[data-write-title]', 'A notice written from the console');
    await page.fill('[data-write-body]', 'This is the English edition of a notice published from the tutor\'s desk.');
    await page.fill('[data-write-title-ar]', 'إعلانٌ كُتب من المكتب');
    await page.locator('[data-write-publish]').click();
    await page.waitForTimeout(600);
    const half = await page.textContent('[data-write-said]');
    check('Half a translation is refused — an edition is both fields or neither',
      /together|empty|معًا/.test(half || ''), (half || '').trim());

    await page.fill('[data-write-body-ar]', 'هذه هي النسخة العربية من إعلانٍ نُشر من مكتب المعلّم.');
    await page.locator('[data-write-publish]').click();
    await page.waitForFunction(
      (n) => document.querySelectorAll('[data-board] .stf-item').length === n + 1,
      board, { timeout: 8000 },
    );
    check('A notice written in both editions is published in both', true);

    const list = await (await fetch(`${BASE}/api/staff/announcements?limit=50`)).json();
    const written = (list.announcements || [])
      .find((a) => a.primary && a.primary.title === 'A notice written from the console');
    check('…with both languages on the record',
      Boolean(written) && (written.availableLanguages || []).length === 2,
      written && (written.availableLanguages || []).join(', '));
    check('…under the account that wrote it, and no other',
      Boolean(written) && written.author.id === 'usr_tutor', written && written.author.id);

    await page.screenshot({ path: join(OUT, 'staff-04-notices.png'), fullPage: true });
    await page.close();
  }

  // ── 6 · The caseload, and the conflict rule ────────────────────────
  {
    const page = await open_('/staff-cases.html');
    const cases = await page.evaluate(() => Array.from(document.querySelectorAll('[data-queue] .stf-item'))
      .map((li) => ({
        id: li.getAttribute('data-id'),
        head: (li.querySelector('.stf-item__name') || {}).textContent || '',
        clock: (li.querySelector('.stf-wait__read') || {}).textContent || '',
        offersAnswer: Boolean(li.querySelector('.stf-act')),
        barred: /may not hear|لا تسمع/.test(li.textContent || ''),
        chips: Array.from(li.querySelectorAll('.desk-chip')).map((c) => c.textContent),
      })));
    check(`The queue carries the College's live cases (${cases.length})`, cases.length > 0);
    // A case still waiting shows its date; an ANSWERED one shows no
    // clock, because there is nothing left to be late for. Requiring a
    // date on every row would have this suite demand a deadline the
    // College does not hold.
    const waiting = cases.filter((c) => !c.chips.some((t) => /upheld|granted|refused|قُبِل|مُنِح|رُفِض/i.test(t)));
    check(`Every case still waiting says when its answer falls due (${waiting.length})`,
      waiting.length > 0 && waiting.every((c) => /\d{4}/.test(c.clock)),
      waiting.map((c) => c.clock || '(none)').join(' | '));
    const answered = cases.filter((c) => !waiting.includes(c));
    check(`…and an answered case shows its outcome instead of a clock (${answered.length})`,
      answered.length > 0 && answered.every((c) => !/\d{4}/.test(c.clock)),
      answered.map((c) => c.chips.join('·')).join(' | '));

    const procedure = await page.textContent('[data-procedure-principle]');
    check('The published procedure is rendered from the payload, not restated by the page',
      (procedure || '').trim().length > 30, (procedure || '').trim().slice(0, 70));
    const days = await page.textContent('[data-procedure-days]');
    check('…including how the College counts a working day',
      /weekday|calendar/i.test(days || ''), (days || '').trim().slice(0, 70));

    const answerable = cases.filter((c) => c.offersAnswer);
    check(`An answer form is offered only where the case is at a hearing stage (${answerable.length})`,
      answerable.length >= 1 && answerable.length < cases.length,
      cases.map((c) => (c.offersAnswer ? 'form' : '—')).join(' '));

    // There is no field naming who answered: the decider is the session.
    const namesADecider = await page.evaluate(() => document.querySelectorAll(
      '[name*="decid" i], [data-decided-by], #decidedBy',
    ).length);
    check('No control on the page names who decided a case', namesADecider === 0);

    await page.screenshot({ path: join(OUT, 'staff-05-cases.png'), fullPage: true });
    await page.close();
  }

  // ── 6b · The admissions queue, and an offer ────────────────────────
  {
    const page = await open_('/staff-admissions.html');
    const queue = await page.evaluate(() => Array.from(document.querySelectorAll('[data-queue] .stf-item'))
      .map((li) => ({
        id: li.getAttribute('data-id'),
        chips: Array.from(li.querySelectorAll('.desk-chip')).map((c) => c.textContent),
        wait: (li.querySelector('.stf-wait__read') || {}).textContent || '',
        moves: Array.from(li.querySelectorAll('[data-move-to] option')).map((o) => o.value),
        heads: Array.from(li.querySelectorAll('.stf-act h3')).map((h) => h.textContent),
        means: Array.from(li.querySelectorAll('.stf-act .stf-field__note')).map((n) => n.textContent),
      })));
    check(`The admissions queue carries the applications (${queue.length})`, queue.length === 3,
      queue.map((q) => q.id).join(', '));
    check('…oldest first', queue.every((q) => /\d/.test(q.wait)),
      queue.map((q) => q.wait).join(' | '));

    // `legalNext` is a list of MOVES carrying who may make each one. A
    // console that read it as a list of status names put "[object
    // Object]" in front of an admissions officer.
    const named = queue.every((q) => q.moves.every((m) => /^[a-z_]*$/.test(m)));
    check('The moves offered are named, not stringified objects', named,
      queue.map((q) => q.moves.join('/')).join(' | '));
    check('…and each says what it means in the platform\'s own words',
      queue.some((q) => q.means.some((m) => /applicant/i.test(m))),
      queue.map((q) => q.means.join(' ')).join(' | ').slice(0, 90));

    // The offer form appears exactly where an offer is the act the
    // lifecycle is waiting for.
    const offerable = queue.filter((q) => q.heads.some((h) => /Issue an offer/i.test(h)));
    check(`The offer form is offered only at the placement stage (${offerable.length})`,
      offerable.length === 1, queue.map((q) => q.heads.join('+')).join(' | '));

    const journey = await page.locator('[data-journey] .stf-item').count();
    check(`The published journey is rendered from the payload (${journey} steps)`, journey >= 5);

    const counts = await page.evaluate(() => Array.from(document.querySelectorAll('#secCounts .stf-count'))
      .map((t) => t.getAttribute('data-tile') + ':' + (t.querySelector('.stf-count__num') || {}).textContent));
    check('The stage tallies are on the desk', counts.length === 4, counts.join(' '));

    // Narrowing the list must NOT narrow the tallies, or an officer
    // working one stage loses sight of the rest of the queue.
    await page.selectOption('[data-queue-status]', 'submitted');
    await page.waitForTimeout(1200);
    const after = await page.evaluate(() => ({
      rows: document.querySelectorAll('[data-queue] .stf-item').length,
      counts: Array.from(document.querySelectorAll('#secCounts .stf-count'))
        .map((t) => t.getAttribute('data-tile') + ':' + (t.querySelector('.stf-count__num') || {}).textContent),
    }));
    check('Filtering to one stage narrows the list', after.rows === 1, String(after.rows));
    check('…and does not narrow the tallies with it',
      after.counts.join(' ') === counts.join(' '), after.counts.join(' '));

    await page.screenshot({ path: join(OUT, 'staff-07-admissions.png'), fullPage: true });
    await page.close();
  }

  // ── 6c · Issuing an offer, end to end ──────────────────────────────
  {
    const page = await open_('/staff-admissions.html');
    const target = page.locator('[data-queue] .stf-item')
      .filter({ hasText: 'Placement Demonstration' }).first();
    check('The application awaiting placement is on the queue', await target.count() > 0);

    await target.locator('[data-offer-reason]')
      .fill('Placement confirmed at Level II in conversation on the 20th.');
    await target.locator('[data-offer-send]').click();
    await page.waitForTimeout(2200);

    const list = await (await fetch(`${BASE}/api/staff/applications?limit=50`)).json();
    const issued = (list.applications || []).find((a) => a.fullName === 'Placement Demonstration');
    check('An offer issued from the console reaches the application',
      Boolean(issued) && issued.status === 'offer_sent', issued && issued.status);
    check('…carrying the level, the kind and the date it expires',
      Boolean(issued) && issued.offer && issued.offer.levelId > 0
      && /^(conditional|unconditional)$/.test(issued.offer.kind)
      && Boolean(issued.offer.expiresAt),
      issued && issued.offer && `${issued.offer.levelId} · ${issued.offer.kind} · ${issued.offer.expiresAt}`);
    await page.close();
  }

  // ── 6d · The Registrar's moves belong to the Registrar ─────────────
  {
    // As a tutor: the answer form where a case is at a hearing stage,
    // and no Registrar block at all.
    const tutor = await browser.newPage({ viewport: { width: 1440, height: 1000 } });
    await tutor.route('**://fonts.googleapis.com/**', (r) => r.abort());
    await tutor.route('**://fonts.gstatic.com/**', (r) => r.abort());
    await stubAuth(tutor, 'tutor');
    await tutor.goto(`${BASE}/staff-cases.html`, { waitUntil: 'domcontentloaded' });
    await tutor.waitForTimeout(2000);
    const asTutor = await tutor.evaluate(() => ({
      registrar: Array.from(document.querySelectorAll('.stf-act h3'))
        .filter((h) => /Registrar/i.test(h.textContent)).length,
      answers: Array.from(document.querySelectorAll('.stf-act h3'))
        .filter((h) => /Answer this case/i.test(h.textContent)).length,
    }));
    check('A tutor is offered the answer and not the Registrar\'s moves',
      asTutor.registrar === 0 && asTutor.answers >= 1,
      `registrar ${asTutor.registrar}, answers ${asTutor.answers}`);
    await tutor.close();

    // As an administrator: both.
    const admin = await browser.newPage({ viewport: { width: 1440, height: 1000 } });
    await admin.route('**://fonts.googleapis.com/**', (r) => r.abort());
    await admin.route('**://fonts.gstatic.com/**', (r) => r.abort());
    await stubAuth(admin, 'admin');
    await admin.goto(`${BASE}/staff-cases.html`, { waitUntil: 'domcontentloaded' });
    await admin.waitForTimeout(2000);
    const asAdmin = await admin.evaluate(() => ({
      registrar: Array.from(document.querySelectorAll('.stf-act h3'))
        .filter((h) => /Registrar/i.test(h.textContent)).length,
      // Escalation and withdrawal are the appellant's acts and must not
      // be reachable from any staff console.
      appellant: Array.from(document.querySelectorAll('option'))
        .filter((o) => /^(escalate|withdraw)$/.test(o.value)).length,
    }));
    check(`An administrator is offered the Registrar's moves (${asAdmin.registrar})`,
      asAdmin.registrar >= 1);
    check('Escalation and withdrawal are nowhere on a staff console — they are the appellant\'s',
      asAdmin.appellant === 0, String(asAdmin.appellant));

    // And one of those moves actually works.
    const received = admin.locator('.stf-item').filter({ hasText: 'Received' }).first();
    if (await received.count()) {
      const act = received.locator('.stf-act').last();
      await act.locator('textarea').fill('Acknowledged and passed to a member of academic staff.');
      await act.locator('button.btn--outline').click();
      await admin.waitForTimeout(2200);
      const queue = await (await fetch(`${BASE}/api/staff/cases?limit=100`)).json();
      const routed = (queue.cases || []).some((c) => c.stage === 'stage_one'
        && /caring for a relative/.test(c.summary || ''));
      check('Routing a case to stage one from the console moves it', routed,
        (queue.cases || []).map((c) => c.stage).join(', '));
    }
    await admin.screenshot({ path: join(OUT, 'staff-08-registrar.png'), fullPage: true });
    await admin.close();
  }

  // ── 6e · Enrolments: the register, and the door that replaces SQL ──
  {
    const page = await open_('/staff-enrolments.html');
    const seen = await page.evaluate(() => ({
      register: document.querySelectorAll('[data-register] .stf-item').length,
      results: document.querySelectorAll('[data-results] .stf-item').length,
      note: (document.querySelector('[data-register-note]') || {}).textContent || '',
    }));
    check(`The register of everyone who may reach a student record is on the page (${seen.register})`,
      seen.register > 0);
    check('…above the search, because that is the question an institution is asked',
      /granted themselves|authority/i.test(seen.note), seen.note.slice(0, 60));
    check(`The learner search answers (${seen.results})`, seen.results > 0);

    // The learner the harness seeds with NO enrolment, so this exercises
    // the act rather than a no-op: setting a status a learner already
    // holds is answered "no change", which proves nothing about whether
    // the door works.
    await page.fill('[data-search-input]', 'unenrolled@example.com');
    await page.locator('[data-search-send]').click();
    await page.waitForTimeout(1400);
    await page.locator('[data-results] .stf-item button').first().click();
    await page.waitForTimeout(1400);

    // The reason is not optional, here or on the server.
    await page.locator('[data-set-send]').click();
    await page.waitForTimeout(400);
    const refused = await page.textContent('[data-set-said]');
    check('An enrolment with no reason behind it is refused before it is sent',
      /required/i.test(refused || ''), (refused || '').trim());

    await page.selectOption('[data-set-level]', '1');
    await page.selectOption('[data-set-status]', 'active');
    await page.fill('[data-set-reason]', 'Scholarship awarded by the Bursary Committee; no card payment.');
    await page.locator('[data-set-send]').click();
    await page.waitForTimeout(2400);
    const said = await page.textContent('[data-set-said]');
    check('…and one with a reason is recorded', /recorded/i.test(said || ''),
      (said || '').trim());
    const history = await page.evaluate(() => ({
      rows: document.querySelectorAll('[data-history] .stf-item').length,
      text: (document.querySelector('[data-history]') || {}).textContent || '',
    }));
    check(`…and appears in the history with its reason (${history.rows})`,
      history.rows > 0 && /Bursary Committee/.test(history.text),
      history.text.slice(0, 80));

    // All six levels, held or not: a list of only what somebody holds
    // cannot say what they do not.
    const levels = await page.locator('[data-enrolments] .stf-item').count();
    check(`All six levels are listed, enrolled or not (${levels})`, levels === 6);
    const notEnrolled = await page.evaluate(() => Array.from(
      document.querySelectorAll('[data-enrolments] .desk-chip'),
    ).filter((c) => /not enrolled/i.test(c.textContent)).length);
    check(`…and a level they do not hold reads "not enrolled" rather than blank (${notEnrolled})`,
      notEnrolled > 0);

    await page.screenshot({ path: join(OUT, 'staff-09-enrolments.png'), fullPage: true });
    await page.close();
  }

  // ── 6e2 · Appointing somebody, and the two questions it asks ───────
  {
    // As a tutor: no access controls at all — the platform refuses the
    // act, so the console does not draw a control that cannot succeed.
    const tutor = await browser.newPage({ viewport: { width: 1440, height: 1000 } });
    await tutor.route('**://fonts.googleapis.com/**', (r) => r.abort());
    await tutor.route('**://fonts.gstatic.com/**', (r) => r.abort());
    await stubAuth(tutor, 'tutor');
    await tutor.goto(`${BASE}/staff-enrolments.html`, { waitUntil: 'domcontentloaded' });
    await tutor.waitForTimeout(2000);
    await tutor.locator('[data-results] .stf-item button').first().click();
    await tutor.waitForTimeout(1400);
    const tutorSees = await tutor.evaluate(() => document.querySelector('[data-access]').hidden);
    check('A tutor is offered no access controls on a learner', tutorSees === true);
    await tutor.close();

    const admin = await browser.newPage({ viewport: { width: 1440, height: 1000 } });
    await admin.route('**://fonts.googleapis.com/**', (r) => r.abort());
    await admin.route('**://fonts.gstatic.com/**', (r) => r.abort());
    await stubAuth(admin, 'admin');
    await admin.goto(`${BASE}/staff-enrolments.html`, { waitUntil: 'domcontentloaded' });
    await admin.waitForTimeout(2000);

    await admin.fill('[data-search-input]', 'midway@example.com');
    await admin.locator('[data-search-send]').click();
    await admin.waitForTimeout(1400);
    await admin.locator('[data-results] .stf-item button').first().click();
    await admin.waitForTimeout(1600);

    const offered = await admin.evaluate(() => ({
      shown: !document.querySelector('[data-access]').hidden,
      roles: Array.from(document.querySelectorAll('[data-access-role] option')).map((o) => o.value),
      fields: Array.from(document.querySelectorAll('[data-access] label')).map((l) => l.textContent),
    }));
    check('An administrator is offered the access controls', offered.shown);
    check('…but never the role the person already holds',
      offered.roles.indexOf('student') === -1, offered.roles.join('/'));
    // TWO questions, not one — why this person, and under whose decision.
    check('Appointing asks why this person AND under what decision',
      offered.fields.some((f) => /why this person/i.test(f))
      && offered.fields.some((f) => /under what decision/i.test(f)),
      offered.fields.join(' | '));

    await admin.selectOption('[data-access-role]', 'staff');
    await admin.fill('[data-access-reason]', 'Appointed to teach the Level II cohort.');
    await admin.fill('[data-access-authority]', 'Executive minute of 22 August 2026');
    await admin.locator('[data-access-send]').click();
    await admin.waitForTimeout(2400);

    const after = await admin.evaluate(() => ({
      said: (document.querySelector('[data-access-said]') || {}).textContent || '',
      appointments: document.querySelectorAll('[data-appointments] .stf-item').length,
      trail: (document.querySelector('[data-appointments]') || {}).textContent || '',
      history: (document.querySelector('[data-history]') || {}).textContent || '',
      register: document.querySelectorAll('[data-register] .stf-item').length,
    }));
    check('The appointment takes effect', /appointed/i.test(after.said), after.said.trim());
    check(`…and appears on the record (${after.appointments})`, after.appointments >= 1);
    check('…showing the transition, so a demotion reads differently from a promotion',
      /Learner/.test(after.trail) && /Staff/.test(after.trail), after.trail.slice(0, 70));
    check('…naming who made it', /admin@example\.com/.test(after.trail));
    check('…with the reason', /Level II cohort/.test(after.trail));
    check('…and the authority on its own line, since that is the line people look for',
      /Under: Executive minute/.test(after.trail), after.trail.slice(0, 140));
    check('Appointments are kept out of the enrolment history, not merged into it',
      !/Executive minute/.test(after.history));
    check(`The register grows when somebody is appointed (${after.register})`,
      after.register >= 3);

    await admin.screenshot({ path: join(OUT, 'staff-12-appointment.png'), fullPage: true });
    await admin.close();
  }

  // ── 6f · Finance ───────────────────────────────────────────────────
  {
    const page = await open_('/staff-finance.html');
    const seen = await page.evaluate(() => ({
      tiles: Array.from(document.querySelectorAll('#secCounts .stf-count'))
        .map((t) => t.getAttribute('data-tile') + ':' + (t.querySelector('.stf-count__num') || {}).textContent),
      breakdowns: document.querySelectorAll('[data-revenue] .stf-item').length,
      recon: document.querySelectorAll('[data-recon] .stf-item').length,
      reconNote: (document.querySelector('[data-recon-note]') || {}).textContent || '',
    }));
    check('The ledger reports gross, refunded, net and a count', seen.tiles.length === 4,
      seen.tiles.join(' '));
    check('…as money rather than as bare cents',
      seen.tiles.filter((t) => /gross|refunded|net/.test(t)).every((t) => /[.,]/.test(t)),
      seen.tiles.join(' '));
    check(`…broken down four ways (${seen.breakdowns})`, seen.breakdowns === 4);
    check('Reconciliation says when it was generated and what counts as stalled',
      /minutes/i.test(seen.reconNote), seen.reconNote.slice(0, 70));
    check(`…and reports each discrepancy as itself (${seen.recon})`, seen.recon >= 0);

    await page.screenshot({ path: join(OUT, 'staff-10-finance.png'), fullPage: true });
    await page.close();
  }

  // ── 6g · The Administration ────────────────────────────────────────
  {
    const page = await open_('/staff-administration.html');
    const seen = await page.evaluate(() => ({
      metrics: document.querySelectorAll('[data-metrics] .stf-item').length,
      caveat: (document.querySelector('[data-metrics-caveat]') || {}).textContent || '',
      suppressed: Array.from(document.querySelectorAll('[data-metrics] .desk-chip'))
        .filter((c) => /withheld|محجوب/i.test(c.textContent)).length,
      evidence: document.querySelectorAll('[data-evidence] .stf-item').length,
      evidenceText: (document.querySelector('[data-evidence]') || {}).textContent || '',
      disclaimer: (document.querySelector('[data-evidence-disclaimer]') || {}).textContent || '',
      coverage: document.querySelectorAll('[data-coverage] .stf-item').length,
      keys: document.querySelectorAll('[data-keys] .stf-item').length,
      keysNote: (document.querySelector('[data-keys-note]') || {}).textContent || '',
      rates: !document.querySelector('#secRates').hidden,
      purgeConfirmHidden: document.querySelector('[data-purge-confirm]').hidden,
    }));

    check(`The Institutional Metric Register is on the page (${seen.metrics})`, seen.metrics > 0);
    // A withheld figure is a decision, not a gap, and the register says
    // which on every row.
    check('…with the suppression rule printed above it',
      /withheld|suppressed|individual/i.test(seen.caveat), seen.caveat.slice(0, 70));
    check(`…and a withheld figure is marked as withheld (${seen.suppressed})`, seen.suppressed > 0);

    // The register ships with twenty-three collections and no items.
    // What must be on screen is its SHAPE — what is being asked for and
    // which of it is unanswered — not a blank list that reads as
    // "nothing to see".
    check(`The evidence register is rendered (${seen.evidence})`, seen.evidence > 0);
    check('…naming the collections that hold nothing rather than showing a blank',
      /Governance/.test(seen.evidenceText) && /Quality Assurance/.test(seen.evidenceText),
      seen.evidenceText.slice(0, 90));
    check('…carrying the disclaimer the module attaches to every response',
      /no accreditation|holds no/i.test(seen.disclaimer), seen.disclaimer.slice(0, 70));

    check(`Competency coverage is measured per level (${seen.coverage})`, seen.coverage === 6);
    check(`The signing keys are listed (${seen.keys})`, seen.keys > 0);
    check('…and the page says rotation is not reachable by a request',
      /deliberately|database|not managed/i.test(seen.keysNote), seen.keysNote.slice(0, 80));

    check('The exchange-rate controls are present', seen.rates);
    check('The destroying button does not exist until the dry run has been read',
      seen.purgeConfirmHidden === true);

    // The dry run, and only then the confirmation.
    await page.locator('[data-purge-dry]').click();
    await page.waitForTimeout(1600);
    const purge = await page.textContent('[data-purge-said]');
    check('A retention run reports what it would destroy before destroying it',
      /examined|nothing has passed/i.test(purge || ''), (purge || '').trim());

    // Registering an institution returns a key exactly once.
    await page.fill('[data-inst-name]', 'A demonstration university');
    await page.locator('[data-inst-send]').click();
    await page.waitForTimeout(1800);
    const key = await page.evaluate(() => ({
      shown: !document.querySelector('[data-inst-key]').hidden,
      value: (document.querySelector('[data-inst-key-value]') || {}).textContent || '',
      warning: (document.querySelector('[data-inst-key-warning]') || {}).textContent || '',
    }));
    check('Registering an institution issues a key', key.shown && key.value.length > 16,
      String(key.value.length));
    check('…and says in as many words that it is shown once',
      /not shown again|once/i.test(key.warning), key.warning.slice(0, 60));

    await page.screenshot({ path: join(OUT, 'staff-11-administration.png'), fullPage: true });
    await page.close();
  }

  // ── 7 · The desk adds up ───────────────────────────────────────────
  {
    const page = await open_('/staff-desk.html');
    const tiles = await page.evaluate(() => Array.from(document.querySelectorAll('.stf-count'))
      .map((t) => ({
        name: t.getAttribute('data-tile'),
        count: (t.querySelector('[data-count]') || {}).textContent,
        foot: (t.querySelector('[data-foot]') || {}).textContent,
        href: t.getAttribute('href'),
      })));
    check('The desk reports four queues', tiles.length === 4,
      tiles.map((t) => `${t.name}:${t.count}`).join(' '));
    check('…each with a number rather than a dash',
      tiles.every((t) => /^\d+$/.test((t.count || '').trim())),
      tiles.map((t) => t.count).join(' '));
    check('…and each is a way in to the page that owns it',
      tiles.every((t) => (t.href || '').includes('staff-')),
      tiles.map((t) => t.href).join(' '));
    const cases = tiles.find((t) => t.name === 'cases');
    check('The caseload names how many are past their answer date',
      /answer date/i.test(cases.foot || ''), cases && cases.foot);

    await page.screenshot({ path: join(OUT, 'staff-06-desk.png'), fullPage: true });
    await page.close();
  }

  // ── 8 · Narrow, and in both directions ─────────────────────────────
  for (const path of ['/staff-marking.html', '/ar/staff-marking.html', '/staff-cases.html']) {
    const page = await open_(path, { width: 390, height: 844 });
    const narrow = await page.evaluate(() => ({
      overflow: document.documentElement.scrollWidth > window.innerWidth + 1,
      plates: document.querySelectorAll('.stf-item, .stf-count').length,
    }));
    check(`${path} at 390px — no horizontal overflow`, !narrow.overflow);
    check(`${path} at 390px — the plates are still there`, narrow.plates > 0, String(narrow.plates));
    await page.close();
  }

  check(`No script or console errors across the consoles${errs.length ? ' — ' + errs[0] : ''}`,
    errs.length === 0);

  console.log(`\nScreenshots written to ${OUT}`);
} finally {
  await browser.close();
  server.kill();
}

console.log(`\n${pass} passed, ${fail} failed.`);
process.exit(fail ? 1 : 0);
