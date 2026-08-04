/**
 * What the IEFC is, and what the College can currently evidence about it.
 *
 * ────────────────────────────────────────────────────────────────────
 * ONE DEFINITION, SEVEN VERIFIABLE CLAIMS
 * ────────────────────────────────────────────────────────────────────
 * The Executive's definition is stored whole, because a definition
 * paraphrased differently on each page is not a definition. But it is
 * also decomposed into the seven things it asserts, because the
 * standing rule is that every public claim must be verifiable, and a
 * sentence cannot be verified as a whole.
 *
 * `state` on each claim is the honest answer, and one of the seven is
 * `not_evidenced` today: competency verification, because zero of the
 * sixty assessments are mapped to any competency.
 *
 * ────────────────────────────────────────────────────────────────────
 * THE STATES ARE NOT TAKEN ON TRUST
 * ────────────────────────────────────────────────────────────────────
 * A stored state is a claim about the platform, and claims about the
 * platform go stale. `verifiedClaims()` re-derives the two that CAN be
 * derived — the competency mapping and the signing backend — from live
 * data every time, and reports a disagreement rather than serving the
 * stored value.
 *
 * That matters in both directions. If BASCE completes the mapping and
 * nobody updates this table, the College would go on publicly
 * understating itself. If the mapping were later retired, it would go
 * on overstating.
 */

const db = (env) => env.DB;

export const CODE = 'IEFC';

/** The definition, whole and verbatim, with its claims in order. */
export async function definition(env) {
  const prog = await db(env).prepare(
    `SELECT id, code, name, statement, adopted_on AS adoptedOn, adopted_by AS adoptedBy
       FROM programme_definition WHERE code = ?`).bind(CODE).first();
  if (!prog) return null;

  const { results: claims } = await db(env).prepare(
    `SELECT code, claim, state, evidence, shortfall
       FROM programme_claims WHERE programme_id = ? ORDER BY sequence`).bind(prog.id).all();

  return { ...prog, claims };
}

/**
 * The definition with its derivable claims re-checked against live data.
 *
 * Returns each claim with `state` (stored), `observed` (derived, or null
 * where nothing can be derived) and `agrees`. An interface should serve
 * `observed` where it exists — the stored row records intent, the
 * observation records fact, and where they differ the fact wins.
 */
export async function verifiedClaims(env) {
  const def = await definition(env);
  if (!def) return null;

  // Competency verification: the mapping either exists or it does not,
  // and counting it is not a matter of opinion.
  const comp = await db(env).prepare(
    `SELECT (SELECT COUNT(*) FROM assessment_competencies) AS mapped,
            (SELECT COUNT(*) FROM learning_items WHERE kind IN ('quiz','assignment')) AS assessments,
            (SELECT COUNT(*) FROM competency_marks) AS marks`).first();

  // Verifiable credentials: 'partial' while any active signing key is
  // in development mode, per decision P2.1.
  const key = await db(env).prepare(
    "SELECT backend FROM signing_keys WHERE status = 'active' ORDER BY created_at DESC LIMIT 1").first();

  const observers = {
    COMPETENCY_VERIFICATION: () => {
      if (comp.marks > 0 && comp.mapped > 0) return 'evidenced';
      if (comp.mapped > 0) return 'partial';
      return 'not_evidenced';
    },
    VERIFIABLE_CREDENTIALS: () => (key && key.backend === 'production' ? 'evidenced' : 'partial'),
  };

  const claims = def.claims.map((c) => {
    const observe = observers[c.code];
    const observed = observe ? observe() : null;
    return { ...c, observed, agrees: observed === null || observed === c.state };
  });

  const disagreements = claims.filter((c) => !c.agrees);

  return {
    ...def,
    claims,
    // Counts over the OBSERVED state where one exists, so the summary
    // cannot be more optimistic than the platform.
    counts: countBy(claims.map((c) => c.observed || c.state)),
    disagreements,
    // The measurements behind the observations, so a reviewer can check
    // the derivation rather than the conclusion.
    measurements: {
      assessments: comp.assessments,
      assessmentsMappedToCompetencies: comp.mapped,
      competencyMarksRecorded: comp.marks,
      signingBackend: key ? key.backend : 'none',
    },
  };
}

function countBy(states) {
  const out = { evidenced: 0, partial: 0, not_evidenced: 0, governance_pending: 0 };
  for (const s of states) if (s in out) out[s]++;
  return out;
}

/**
 * The single sentence a page may publish about the qualification, and
 * the caveat it must publish with it.
 *
 * The caveat is NOT optional and is not left to the page to remember.
 * The definition asserts competency verification; while that cannot be
 * evidenced, publishing the sentence alone would be the College making
 * a claim its own data contradicts.
 */
export async function publishableStatement(env) {
  const v = await verifiedClaims(env);
  if (!v) return null;

  const unevidenced = v.claims.filter((c) => (c.observed || c.state) === 'not_evidenced');
  const partial = v.claims.filter((c) => (c.observed || c.state) === 'partial');

  return {
    statement: v.statement,
    // Named separately from the statement so an interface cannot render
    // one without noticing the other.
    caveat: unevidenced.length
      ? 'The College does not yet evidence every element of this definition. '
        + unevidenced.map((c) => c.claim).join('; ')
        + ' — see the Accreditation Evidence Centre for the current position.'
      : null,
    qualifications: partial.map((c) => ({ claim: c.claim, shortfall: c.shortfall })),
    fullyEvidenced: unevidenced.length === 0 && partial.length === 0,
  };
}
