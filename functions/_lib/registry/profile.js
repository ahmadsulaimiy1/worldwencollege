/* The graduate's permanent academic identity.
 *
 * Three readers, one source of truth:
 *
 *   THE GRADUATE       sees everything the College holds about them.
 *   A SHARE RECIPIENT  sees the slice the graduate agreed to, until the
 *                      link expires or is withdrawn.
 *   THE PUBLIC         sees what the graduate published, and nothing
 *                      else — not even that the rest exists.
 *
 * The scoping is done ONCE, here, by `project()`. Every caller goes
 * through it. The alternative — each endpoint deciding what to strip —
 * is how a field ends up published because one of four handlers forgot,
 * and the forgetting is invisible until somebody notices their marks on
 * the internet.
 *
 * ON WHAT IS NOT HERE. The transcript reports credits, qualification
 * time and awards, because those are recorded. It does not report
 * competency attainment, because no competency has been marked: the
 * mapping from assessment to competency is academic work that has not
 * been done (see competencyCoverage() and governance A6d). The profile
 * says so rather than showing an empty chart that reads as "scored
 * zero", and it does not silently omit the section, which would read as
 * "this graduate has no competencies".
 */
import { db, NotFoundError, ValidationError } from '../db.js';
import { awardHistory } from './awards.js';

const HANDLE_RE = /^[a-z0-9][a-z0-9-]{2,30}[a-z0-9]$/;

/** Sections a graduate can publish or share, and what each discloses. */
export const SECTIONS = ['awards', 'transcript', 'competencies', 'cpd', 'studyTime'];

const FLAG_FOR = {
  transcript: 'show_transcript',
  competencies: 'show_competencies',
  cpd: 'show_cpd',
  studyTime: 'show_study_time',
};

function newId(prefix) {
  return `${prefix}_${crypto.randomUUID()}`;
}

async function sha256Hex(text) {
  const buf = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(text));
  return [...new Uint8Array(buf)].map((b) => b.toString(16).padStart(2, '0')).join('');
}

/**
 * Fetch or create the profile row.
 *
 * Created on demand and PRIVATE in every field. A profile that sprang
 * into existence public would publish people who had not yet been asked.
 */
export async function getOrCreateProfile(env, { userId }) {
  const existing = await db(env).prepare('SELECT * FROM graduate_profiles WHERE user_id = ?')
    .bind(userId).first();
  if (existing) return existing;

  const user = await db(env).prepare('SELECT id FROM users WHERE id = ?').bind(userId).first();
  if (!user) throw new NotFoundError('Unknown person.');

  await db(env).prepare('INSERT INTO graduate_profiles (user_id) VALUES (?)').bind(userId).run();
  return db(env).prepare('SELECT * FROM graduate_profiles WHERE user_id = ?').bind(userId).first();
}

export async function updateProfile(env, { userId, changes = {} }) {
  await getOrCreateProfile(env, { userId });

  const sets = [], binds = [];
  const text = { displayName: 'display_name', biography: 'biography', headline: 'headline', countryCode: 'country_code' };
  for (const [key, col] of Object.entries(text)) {
    if (changes[key] === undefined) continue;
    sets.push(`${col} = ?`);
    binds.push(changes[key] === null ? null : String(changes[key]).trim().slice(0, 2000));
  }

  if (changes.handle !== undefined) {
    const h = changes.handle === null ? null : String(changes.handle).trim().toLowerCase();
    if (h !== null && !HANDLE_RE.test(h)) {
      throw new ValidationError(
        'A profile address may use lower-case letters, numbers and hyphens, and must be 4 to 32 characters.',
        { handle: 'Invalid' },
      );
    }
    if (h !== null) {
      const taken = await db(env)
        .prepare('SELECT user_id FROM graduate_profiles WHERE handle = ? AND user_id != ?')
        .bind(h, userId).first();
      if (taken) throw new ValidationError('That profile address is already taken.', { handle: 'Taken' });
    }
    sets.push('handle = ?'); binds.push(h);
  }

  const flags = { isPublic: 'is_public', ...FLAG_FOR };
  for (const [key, col] of Object.entries(flags)) {
    if (changes[key] === undefined) continue;
    sets.push(`${col} = ?`); binds.push(changes[key] ? 1 : 0);
  }

  if (!sets.length) return getOrCreateProfile(env, { userId });

  sets.push('updated_at = ?');
  binds.push(new Date().toISOString(), userId);
  await db(env).prepare(`UPDATE graduate_profiles SET ${sets.join(', ')} WHERE user_id = ?`).bind(...binds).run();
  return db(env).prepare('SELECT * FROM graduate_profiles WHERE user_id = ?').bind(userId).first();
}

/**
 * The academic transcript — every level entered, what came of it.
 *
 * Built from enrolments rather than from awards, so a level attempted
 * and not completed still appears. A transcript that showed only
 * successes would be a list of achievements, which is a different
 * document and a less trustworthy one.
 */
export async function transcript(env, { userId }) {
  const { results: rows } = await db(env)
    .prepare(`SELECT e.level_id AS levelId, e.status, e.started_at AS startedAt, e.completed_at AS completedAt,
                     l.roman, l.name AS levelName, l.cefr, l.duration_months AS durationMonths
                FROM enrolments e JOIN programme_levels l ON l.id = e.level_id
               WHERE e.user_id = ?
               ORDER BY e.level_id ASC`)
    .bind(userId).all();

  const history = await awardHistory(env, { userId });
  const awardByLevel = new Map(history.awards.map((a) => [a.level.id, a]));

  const { results: units } = await db(env)
    .prepare(`SELECT c.level_id AS levelId,
                     COUNT(*) AS total,
                     SUM(CASE WHEN p.status = 'completed' THEN 1 ELSE 0 END) AS completed
                FROM units u
                JOIN courses c ON c.id = u.course_id
                LEFT JOIN unit_progress p ON p.unit_id = u.id AND p.user_id = ?
               GROUP BY c.level_id`)
    .bind(userId).all();
  const unitsByLevel = new Map(units.map((u) => [u.levelId, u]));

  const entries = rows.map((r) => {
    const award = awardByLevel.get(r.levelId) || null;
    const u = unitsByLevel.get(r.levelId);
    return {
      levelId: r.levelId,
      roman: r.roman,
      levelName: r.levelName,
      cefr: r.cefr,
      status: r.status,
      startedAt: r.startedAt,
      completedAt: r.completedAt,
      modulesCompleted: u ? (u.completed || 0) : 0,
      modulesTotal: u ? u.total : 0,
      award: award ? {
        title: award.awardTitle,
        postNominal: award.postNominal,
        honour: award.honour,
        honourLabel: award.honourLabel,
        credits: award.credits,
        tqtHours: award.tqtHours,
        conferredOn: award.conferredOn,
        verificationCode: award.verificationCode,
        standing: award.status,
      } : null,
    };
  });

  return {
    entries,
    // Totalled from LIVE awards only. A withdrawn award's credits are
    // not credits the graduate holds, and a total that silently included
    // them would be the one number on the document that was false.
    creditsAwarded: history.creditsTotal,
    tqtHoursAwarded: history.tqtHoursTotal,
    highestAward: history.highest,
    levelsEntered: entries.length,
    levelsAwarded: entries.filter((e) => e.award && e.award.standing === 'conferred').length,
  };
}

/**
 * Measured study time, from the time-on-task instrument.
 *
 * Reported separately from TQT and never conflated with it. TQT is the
 * College's design figure for the qualification; this is what one person
 * actually did. Presenting a learner's own hours as their qualification
 * time would mean a fast learner held a smaller qualification.
 */
export async function studyTime(env, { userId }) {
  const { results } = await db(env)
    .prepare(`SELECT c.level_id AS levelId, SUM(t.seconds) AS seconds
                FROM time_on_task t
                JOIN units u ON u.id = t.unit_id
                JOIN courses c ON c.id = u.course_id
               WHERE t.user_id = ?
               GROUP BY c.level_id ORDER BY c.level_id`)
    .bind(userId).all();
  const byLevel = results.map((r) => ({ levelId: r.levelId, hours: Math.round((r.seconds || 0) / 360) / 10 }));
  return {
    byLevel,
    totalHours: Math.round(byLevel.reduce((n, l) => n + l.hours, 0) * 10) / 10,
    measuredFrom: 'time-on-task instrumentation',
  };
}

/**
 * Competency attainment — and, until the curriculum is mapped, the
 * honest report that there is none.
 *
 * `state` is the important field. 'unmapped' is not an error and not an
 * empty result: it says the College has not yet mapped its assessments
 * to its own competency framework, which is true, checkable, and
 * something a reviewer should be told plainly rather than left to infer
 * from a chart of zeroes.
 */
export async function competencyAttainment(env, { userId }) {
  const { results: competencies } = await db(env)
    .prepare('SELECT id, code, name, description FROM competencies ORDER BY sequence').all();

  const { results: marks } = await db(env)
    .prepare(`SELECT m.competency_id AS competencyId, AVG(m.mark) AS mark, COUNT(*) AS assessments
                FROM competency_marks m
                JOIN assignment_submissions s ON s.id = m.submission_id
               WHERE s.user_id = ?
               GROUP BY m.competency_id`)
    .bind(userId).all();
  const byCompetency = new Map(marks.map((m) => [m.competencyId, m]));

  const mapped = await db(env)
    .prepare('SELECT COUNT(*) AS n FROM assessment_competencies').first();

  return {
    state: marks.length ? 'assessed' : (mapped.n ? 'not_yet_assessed' : 'unmapped'),
    note: marks.length
      ? null
      : (mapped.n
        ? 'This graduate has not yet been assessed against the competency framework.'
        : 'The College has not yet mapped its assessments to the competency framework, so no competency attainment can be reported for anyone. This is a known gap, recorded as governance item A6d.'),
    competencies: competencies.map((c) => {
      const m = byCompetency.get(c.id);
      return {
        code: c.code,
        name: c.name,
        description: c.description,
        mark: m ? Math.round(m.mark * 100) / 100 : null,
        assessments: m ? m.assessments : 0,
      };
    }),
  };
}

/**
 * Does the curriculum satisfy the framework's own rule?
 *
 *   "every assessment maps to at least one competency, and every
 *    competency is assessed at least three times per level"
 *                            — docs/academic-framework.md IV
 *
 * This is an institutional quality instrument, not a learner feature. It
 * exists so the answer to "show me competency 5 is assessed three times
 * at Level IV" is a query rather than an opinion — and so that while the
 * answer is "it is not", that fact is visible to the College rather than
 * only to whoever eventually audits it.
 */
export async function competencyCoverage(env, { minPerLevel = 3 } = {}) {
  const { results: levels } = await db(env)
    .prepare('SELECT id, roman, name FROM programme_levels ORDER BY id').all();
  const { results: competencies } = await db(env)
    .prepare('SELECT id, code, name FROM competencies ORDER BY sequence').all();

  const { results: counts } = await db(env)
    .prepare(`SELECT c.level_id AS levelId, ac.competency_id AS competencyId, COUNT(*) AS n
                FROM assessment_competencies ac
                JOIN learning_items i ON i.id = ac.learning_item_id
                JOIN units u ON u.id = i.unit_id
                JOIN courses c ON c.id = u.course_id
               GROUP BY c.level_id, ac.competency_id`).all();
  const key = (l, c) => `${l}::${c}`;
  const byPair = new Map(counts.map((r) => [key(r.levelId, r.competencyId), r.n]));

  const { results: assessments } = await db(env)
    .prepare(`SELECT c.level_id AS levelId, COUNT(*) AS total,
                     SUM(CASE WHEN ac.learning_item_id IS NULL THEN 0 ELSE 1 END) AS mapped
                FROM learning_items i
                JOIN units u ON u.id = i.unit_id
                JOIN courses c ON c.id = u.course_id
                LEFT JOIN (SELECT DISTINCT learning_item_id FROM assessment_competencies) ac
                       ON ac.learning_item_id = i.id
               WHERE i.kind IN ('assignment','quiz')
               GROUP BY c.level_id`).all();
  const assessByLevel = new Map(assessments.map((a) => [a.levelId, a]));

  const rows = [];
  let shortfalls = 0;
  for (const l of levels) {
    const a = assessByLevel.get(l.id) || { total: 0, mapped: 0 };
    const perCompetency = competencies.map((c) => {
      const n = byPair.get(key(l.id, c.id)) || 0;
      if (n < minPerLevel) shortfalls++;
      return { code: c.code, name: c.name, assessments: n, meetsRule: n >= minPerLevel };
    });
    rows.push({
      levelId: l.id, roman: l.roman, levelName: l.name,
      assessmentsTotal: a.total, assessmentsMapped: a.mapped || 0,
      assessmentsUnmapped: a.total - (a.mapped || 0),
      perCompetency,
    });
  }

  const totalAssessments = rows.reduce((n, r) => n + r.assessmentsTotal, 0);
  const totalMapped = rows.reduce((n, r) => n + r.assessmentsMapped, 0);

  return {
    rule: `Every assessment maps to at least one competency; every competency is assessed at least ${minPerLevel} times per level.`,
    source: 'docs/academic-framework.md § IV',
    minPerLevel,
    compliant: shortfalls === 0 && totalAssessments > 0 && totalMapped === totalAssessments,
    totalAssessments,
    totalMapped,
    shortfalls,
    levels: rows,
  };
}

/** CPD, with self-declared and College-verified entries distinguished. */
export async function cpdHistory(env, { userId }) {
  const { results } = await db(env)
    .prepare(`SELECT id, title, provider, kind, hours, completed_on AS completedOn,
                     evidence_url AS evidenceUrl, verified_at AS verifiedAt
                FROM cpd_records WHERE user_id = ? ORDER BY completed_on DESC`)
    .bind(userId).all();
  return {
    records: results.map((r) => ({ ...r, verified: !!r.verifiedAt })),
    totalHours: Math.round(results.reduce((n, r) => n + (r.hours || 0), 0) * 10) / 10,
    verifiedHours: Math.round(results.filter((r) => r.verifiedAt)
      .reduce((n, r) => n + (r.hours || 0), 0) * 10) / 10,
  };
}

/**
 * Assemble the whole record, then hand it to `project()` to be cut down
 * to what this particular reader may see.
 *
 * Assembling first and scoping second is deliberate. The alternative —
 * fetching only the permitted sections — spreads the permission rules
 * across five queries, and a rule expressed in five places is a rule
 * with five chances to be wrong.
 */
export async function fullProfile(env, { userId }) {
  const profile = await getOrCreateProfile(env, { userId });
  const [tr, time, comp, cpd] = await Promise.all([
    transcript(env, { userId }),
    studyTime(env, { userId }),
    competencyAttainment(env, { userId }),
    cpdHistory(env, { userId }),
  ]);
  return {
    handle: profile.handle,
    displayName: profile.display_name,
    headline: profile.headline,
    biography: profile.biography,
    countryCode: profile.country_code,
    visibility: {
      isPublic: !!profile.is_public,
      transcript: !!profile.show_transcript,
      competencies: !!profile.show_competencies,
      cpd: !!profile.show_cpd,
      studyTime: !!profile.show_study_time,
    },
    awards: tr.entries.filter((e) => e.award).map((e) => ({ ...e.award, roman: e.roman, levelName: e.levelName, cefr: e.cefr })),
    transcript: tr,
    competencies: comp,
    cpd,
    studyTime: time,
  };
}

/**
 * Cut a full profile down to one reader's view.
 *
 * `audience` is 'self' | 'share' | 'public'. For 'share', `scope` is the
 * set of sections the graduate agreed to when they created the link —
 * and it is intersected with their current visibility settings, never
 * unioned. Turning a section private must take it out of every link
 * already issued; a share that outlived the consent behind it is exactly
 * the failure this whole mechanism exists to prevent.
 */
export function project(full, { audience, scope = [] }) {
  if (audience === 'self') return full;

  const allowed = new Set(
    audience === 'public'
      ? SECTIONS.filter((s) => s === 'awards' || full.visibility[s])
      : scope.filter((s) => s === 'awards' || full.visibility[s]),
  );

  const out = {
    audience,
    handle: full.handle,
    displayName: full.displayName,
    headline: full.headline,
    biography: full.biography,
    countryCode: full.countryCode,
    // Named so the reader knows the record may continue past what they
    // are seeing. Silence would let an employer conclude a graduate has
    // no CPD when they simply did not share it.
    sectionsShared: [...allowed],
    sectionsWithheld: SECTIONS.filter((s) => !allowed.has(s)),
  };
  if (allowed.has('awards')) out.awards = full.awards;
  if (allowed.has('transcript')) out.transcript = full.transcript;
  if (allowed.has('competencies')) out.competencies = full.competencies;
  if (allowed.has('cpd')) out.cpd = full.cpd;
  if (allowed.has('studyTime')) out.studyTime = full.studyTime;
  return out;
}

/**
 * Issue a share link.
 *
 * Returns the token ONCE, in the clear. It is never stored that way and
 * cannot be shown again — the College keeps only its hash, so a database
 * disclosure does not become a disclosure of live access to every
 * graduate's record.
 */
export async function createShare(env, { userId, sections = ['awards'], days = 30, label = null, now = Date.now() }) {
  const scope = [...new Set(sections)].filter((s) => SECTIONS.includes(s));
  if (!scope.length) throw new ValidationError('A share must include at least one section.', { sections: 'Required' });

  const window = Number(days);
  if (!Number.isFinite(window) || window < 1 || window > 365) {
    throw new ValidationError('A share link lasts between 1 and 365 days.', { days: 'Out of range' });
  }
  await getOrCreateProfile(env, { userId });

  const token = [...crypto.getRandomValues(new Uint8Array(24))]
    .map((b) => b.toString(16).padStart(2, '0')).join('');
  const id = newId('shr');
  await db(env)
    .prepare(`INSERT INTO profile_shares (id, user_id, token_hash, label, scope_json, expires_at)
              VALUES (?,?,?,?,?,?)`)
    .bind(id, userId, await sha256Hex(token), label,
      JSON.stringify(scope), new Date(now + window * 86400000).toISOString())
    .run();
  return { id, token, scope, expiresAt: new Date(now + window * 86400000).toISOString() };
}

export async function revokeShare(env, { userId, shareId, now = Date.now() }) {
  const row = await db(env).prepare('SELECT id, user_id, revoked_at FROM profile_shares WHERE id = ?')
    .bind(shareId).first();
  // Same answer for "not yours" as for "does not exist". Distinguishing
  // them would let anyone enumerate which share ids are real.
  if (!row || row.user_id !== userId) throw new NotFoundError('No such share link.');
  if (row.revoked_at) return { shareId, revoked: true, changed: false };
  await db(env).prepare('UPDATE profile_shares SET revoked_at = ? WHERE id = ?')
    .bind(new Date(now).toISOString(), shareId).run();
  return { shareId, revoked: true, changed: true };
}

export async function listShares(env, { userId }) {
  const { results } = await db(env)
    .prepare(`SELECT id, label, scope_json AS scopeJson, expires_at AS expiresAt,
                     revoked_at AS revokedAt, view_count AS viewCount,
                     last_viewed_at AS lastViewedAt, created_at AS createdAt
                FROM profile_shares WHERE user_id = ? ORDER BY created_at DESC`)
    .bind(userId).all();
  const now = Date.now();
  // token_hash is not selected. A graduate reviewing their own links has
  // no use for it, and putting it in a response is how it ends up in a
  // log.
  return results.map((r) => ({
    id: r.id, label: r.label, scope: JSON.parse(r.scopeJson),
    expiresAt: r.expiresAt, revokedAt: r.revokedAt,
    viewCount: r.viewCount, lastViewedAt: r.lastViewedAt, createdAt: r.createdAt,
    active: !r.revokedAt && Date.parse(r.expiresAt) > now,
  }));
}

/** Resolve a share token to the record slice it was issued for. */
export async function viewShare(env, { token, now = Date.now() }) {
  const row = await db(env)
    .prepare('SELECT * FROM profile_shares WHERE token_hash = ?')
    .bind(await sha256Hex(String(token || ''))).first();

  // One answer for every failure. "Expired" and "withdrawn" and "never
  // existed" are the same reply, because telling a holder which one it
  // was tells them whether the graduate revoked it — which is between
  // the graduate and their own decision.
  if (!row || row.revoked_at || Date.parse(row.expires_at) <= now) {
    return { ok: false, reason: 'This link is no longer available.' };
  }

  await db(env)
    .prepare('UPDATE profile_shares SET view_count = view_count + 1, last_viewed_at = ? WHERE id = ?')
    .bind(new Date(now).toISOString(), row.id).run();

  const full = await fullProfile(env, { userId: row.user_id });
  return {
    ok: true,
    profile: project(full, { audience: 'share', scope: JSON.parse(row.scope_json) }),
    expiresAt: row.expires_at,
  };
}

/** A published profile, by its public address. */
export async function publicProfile(env, { handle }) {
  const row = await db(env)
    .prepare('SELECT user_id FROM graduate_profiles WHERE handle = ? AND is_public = 1')
    .bind(String(handle || '').toLowerCase()).first();
  if (!row) throw new NotFoundError('No published profile at that address.');
  return project(await fullProfile(env, { userId: row.user_id }), { audience: 'public' });
}
