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
