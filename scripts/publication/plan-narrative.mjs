/**
 * THE AUTHORED NARRATIVE — the parts of the plan that are judgements
 * rather than computations.
 *
 * These lived inside render-masterplan.mjs, which was fine while there
 * was one renderer. There are now two, and a risk register that exists
 * in one file and is retyped in the other is a risk register that will
 * disagree with itself by the third revision. Both read this.
 *
 * Everything here is AUTHORED. It is not computed from the model and it
 * is not read from the College's record; it is management's judgement,
 * and it is separated from the engine for exactly that reason.
 */

/** Twenty risks, each with an early warning somebody can actually
 *  observe. A register of generic risks is one nobody reads twice. */
export const RISKS = [
  ['Enrolment', 'Acquisition cost rises faster than modelled as the Gulf market matures', 'Medium', 'High', 'Cost per enrolled learner exceeds plan for two consecutive quarters', 'Shift budget weight to sponsored cohorts, where one negotiation carries 25–99 learners at a published band rather than one at a time', 'Marketing and Partnerships Lead'],
  ['Concentration', 'Gulf revenue share becomes a dependency rather than a strength', 'Medium', 'High', 'Any single market exceeds 45 per cent of net tuition', 'The market sequence exists for this reason; Europe opens in Year 2 and Asia in Year 4 specifically to dilute it', 'Chief Executive'],
  ['Academic capacity', 'Instructors cannot be recruited at the pace enrolment demands', 'Medium', 'High', 'Learner-to-instructor ratio exceeds the published teaching allocation for one term', 'The model already refuses to enrol beyond capacity; the operational control is a standing recruitment pipeline and a four-month hiring lead', 'Director of Academic Standards'],
  ['Academic quality', 'Second-marking divergence rises as the marking body grows', 'Medium', 'High', 'Marker agreement falls below 85 per cent, or reconciliations exceed 8 per cent of scripts', 'Every marker is already shown their own agreement and every divergence; the escalation is moderation committee review of that marker\'s batch', 'Director of Academic Standards'],
  ['Regulatory', 'A jurisdiction restricts the marketing of unaccredited qualifications', 'Medium', 'Medium', 'Regulatory correspondence, or a platform advertising rejection citing accreditation', 'The College already states plainly that it holds no third-party accreditation; nothing published needs withdrawal', 'Finance and Compliance Officer'],
  ['Reputational', 'A credential is questioned and verification does not satisfy the questioner', 'Low', 'High', 'A verification enquiry escalates to a complaint', 'Every award is signed, hash-chained and publicly checkable without an account; a superseded award still resolves and names its successor', 'Registrar'],
  ['Retention', 'Continuation between levels falls below the modelled rate', 'Medium', 'High', 'Any level\'s continuation falls 5 points below plan for two cohorts', 'Continuation is the single most valuable variable in the model; from Year 4 retention spending outperforms acquisition spending and the budget should move', 'Chief Executive'],
  ['Technology', 'Platform outage during an examination window', 'Low', 'High', 'Any unplanned outage exceeding 15 minutes in a sitting window', 'Sittings carry a published resume allowance; the architecture is serverless with no single origin to lose', 'Platform Engineer'],
  ['Cybersecurity', 'Learner records or examination papers are exposed', 'Low', 'Severe', 'Any unauthorised access attempt against the registry or paper store', 'Papers are versioned and released by act; records are access-controlled per learner; signing keys are held separately from the record store', 'Platform Engineer'],
  ['Payments', 'A gateway suspends the account or holds settlement', 'Medium', 'High', 'Settlement delayed beyond contracted terms, or a rising chargeback rate', 'Four gateways are implemented and routed by country; no single processor carries the institution', 'Finance and Compliance Officer'],
  ['Foreign exchange', 'Currency movement erodes the value of non-USD collections', 'Medium', 'Medium', 'Any currency moves more than 10 per cent against USD within a quarter', 'The tariff is USD-denominated and rates are refreshed against a recorded source rather than assumed', 'Finance and Compliance Officer'],
  ['Key person', 'The institution depends on individuals who have not been replaced', 'High', 'High', 'Any published office remains unfilled after two recruitment rounds', 'Named in the plan rather than hidden: the governance offices are defined and empty, and the platform refuses to publish a person into an office they have not accepted', 'Board of Governors'],
  ['Academic authority', 'The standards board cannot reach quorum and competency mappings stay interim', 'High', 'High', 'Board of Academic Standards membership remains at zero', 'This is the single gate standing between the College and its first conferral; it is an appointment, not an engineering task', 'Board of Governors'],
  ['External validation', 'No External Examiner is appointed, and accreditation cannot be pursued', 'High', 'High', 'The post remains unfilled into Year 2', 'The remit is published and the evidence the post would examine is already produced by the platform; the gap is a person', 'Board of Governors'],
  ['Refunds', 'Refund rate exceeds the modelled level after a cohort\'s first assessment', 'Low', 'Medium', 'Refunds exceed 4 per cent of gross tuition in any quarter', 'The fourteen-day window is deliberately generous and its cost is modelled; a rise signals a placement problem rather than a policy problem', 'Registrar'],
  ['Partner concentration', 'A single sponsoring institution becomes a material share of enrolment', 'Medium', 'Medium', 'Any one sponsor exceeds 12 per cent of active learners', 'Bands are published rather than negotiated, so no sponsor holds pricing leverage; the exposure is volume, not price', 'Marketing and Partnerships Lead'],
  ['Cost inflation', 'Instructor compensation rises faster than the tariff', 'Medium', 'Medium', 'Loaded instructor cost rises more than 8 per cent in a year', 'The tariff is reviewed annually against the teaching allocation, and the allocation is published rather than implied', 'Chief Executive'],
  ['Content currency', 'The curriculum ages without a revision cycle', 'Medium', 'Medium', 'Any level goes three years without substantive revision', 'Institutional development is funded as a share of net tuition rather than from surplus, precisely so it is not the line cut first', 'Director of Academic Standards'],
  ['Expansion', 'A market opens before the institution can serve it', 'Medium', 'Medium', 'Enquiries from an unopened market exceed 10 per cent of total', 'The sequence is deliberate and the capacity gate is enforced in the model itself; demand ahead of capacity is recorded as turned away rather than booked', 'Chief Executive'],
  ['Liquidity', 'A year of falling enrolment meets a cost base that does not fall with it', 'Low', 'High', 'Reserve coverage falls below six months of operating cost', 'The reserve target is stated in months of cost rather than as a share of revenue, because a share-of-revenue reserve shrinks exactly when it is needed', 'Board of Governors'],
];

export const RISK_COLUMNS = ['Domain', 'Risk', 'Likelihood', 'Impact', 'Early warning', 'Response', 'Owner'];

/** Who decides what, and the separations that protect a learner. */
export const GOVERNANCE = [
  ['Tuition and the published tariff', 'Board of Governors', 'College Executive', 'Annual, against the teaching allocation'],
  ['Fee remission and hardship awards', 'Academic Senate', 'Registrar', 'Each round, against published criteria'],
  ['Partner and sponsor bands', 'Board of Governors', 'Marketing and Partnerships Lead', 'Published; not negotiable case by case'],
  ['New qualifications and levels', 'Academic Senate', 'Board of Academic Standards', 'On proposal'],
  ['Examination papers and rubrics', 'Board of Academic Standards', 'Registrar', 'Each sitting, published before the work'],
  ['Conferral of an award', 'Registrar', 'Academic Senate', 'On eligibility, with no override'],
  ['Withdrawal or replacement of an award', 'Registrar', 'Board of Governors', 'On reasoned application'],
  ['Annual budget and acquisition spend', 'Board of Governors', 'Chief Executive', 'Annual'],
  ['Material technology expenditure', 'College Executive', 'Board of Governors above threshold', 'On proposal'],
  ['Instructor compensation and establishment', 'College Executive', 'Board of Governors', 'Annual'],
  ['Appointment of the External Examiner', 'Board of Governors', 'Academic Senate', 'On vacancy'],
  ['International partnerships', 'Board of Governors', 'Academic Senate for academic terms', 'On proposal'],
  ['Reserve policy and drawdown', 'Board of Governors', '—', 'Annual, and on any drawdown'],
];

export const GOVERNANCE_COLUMNS = ['Decision', 'Decided by', 'Advised or executed by', 'Cycle'];

/**
 * THE FIVE PHASES. The narrative is authored; the figures beside each
 * are named rather than embedded, so a renderer supplies them from the
 * model and neither document can quote a phase figure the engine does
 * not produce.
 */
export const PHASES = [
  { numeral: 'I', name: 'Foundation', years: '1–2', yearIndex: 1,
    text: 'Open the Gulf and West Africa. Appoint the academic offices. Publish the first examination papers and confer the first awards. Prove the qualification end to end before spending to be known.',
    gate: 'A full level examined end to end, every script second-marked, and the first awards on a register a stranger can check.',
    observed: 'The award register carries conferrals, and the assessment record carries a second mark against every script behind them.',
    ifNot: 'Europe does not open. The Foundation year runs again on the two markets already open, and nothing is added to the prospectus meanwhile.' },
  { numeral: 'II', name: 'Validation', years: '3–4', yearIndex: 3,
    text: 'Europe opens. Break-even is cleared and the reserve begins. Continuation, not acquisition, becomes the measure that matters. The External Examiner confirms the standard against published rubrics.',
    gate: 'Cumulative position above nil, the reserve open, and an External Examiner appointed and reporting against rubrics published before the work.',
    observed: 'The cumulative surplus line crosses nil; the examiner’s report exists and is dated after the sitting it examined.',
    ifNot: 'Asia is deferred and acquisition holds at the Foundation level. On the Conservative case the crossing arrives two years later and Phase III waits for it: the gate is the event, not the calendar.' },
  { numeral: 'III', name: 'Scale', years: '5–7', yearIndex: 6,
    text: 'Asia opens. Sponsored cohorts become a material and deliberate share of enrolment — one negotiation carrying a cohort at a published band rather than learners acquired one at a time. The establishment is fully staffed and the institution stops depending on any one person.',
    gate: 'The establishment staffed to what the timetable requires, and no single academic office load-bearing on one person.',
    observed: 'Instructors in post against the establishment the specification computes; every academic office with a named holder and a deputy.',
    ifNot: 'Admissions are capped at what the College can teach — which is how the model already behaves: it turns learners away and records the number.' },
  { numeral: 'IV', name: 'Maturity', years: '8–9', yearIndex: 8,
    text: 'Reserve builds toward its target in months of operating cost. Accreditation is pursued with a completed cohort and an examiner’s confirmation behind it, not before.',
    gate: 'The reserve at its target in months of operating cost, and a completed cohort with an examiner’s confirmation to put behind an application.',
    observed: 'Reserve against the target the policy computes each year; the cohort and the confirmation exist or they do not.',
    ifNot: 'No application is made. An institution that applies on a prospectus has told the assessor what it thinks of the standard.' },
  { numeral: 'V', name: 'Standing', years: '10', yearIndex: 9,
    text: 'The institution is self-funding, externally examined, internationally enrolled, and holds a register of awards a stranger can check without an account.',
    gate: 'Nothing follows, so nothing is gated. What is stated is what must remain true.',
    observed: 'Self-funding; externally examined; no market above the concentration limit; every award on a public register.',
    ifNot: 'A year in which any of the four stops being true is treated as a phase reversal, not a variance.' },
];

export const PHASE_COLUMNS = ['Phase', 'What must be true to leave it', 'How it is observed', 'If it is not'];

/**
 * WHAT THE COLLEGE WILL NOT DO, WHICH IS THE OTHER HALF OF A STRATEGY.
 *
 * A ten-year plan that lists only what an institution intends has
 * described an appetite. These are the positions the rest of this
 * publication commits to in passing — in the tariff, in the honesty
 * register, in the governance schedule, in the capacity model —
 * collected in one place so that a reader can see them as a set and
 * hold the College to them.
 *
 * Every one of them is already enforced somewhere: by a published
 * band, by a build that fails, or by a model that refuses to book the
 * enrolment. None of them is an aspiration.
 */
export const EXCLUSIONS = [
  ['Award a qualification it cannot second-mark',
    'Second marking and moderation apply to every script on every route in every market. It is the one measure with no target, because the target is all of them.',
    'Assessment Integrity Committee'],
  ['Discount below a published band to win an agreement',
    'The partner bands are published and are applied as published. A College that invents a discount in a negotiation has told the buyer its price was never a price.',
    'Board of Governors'],
  ['Describe a partnership as an accreditation',
    'A partnership is an agreement to admit cohorts on published terms. It is not a validation, a recognition or a joint award, in either language the College publishes in.',
    'Board of Governors'],
  ['Open a market it has not researched',
    'Asia and the wider world open last for a stated reason: the College holds no direct published evidence there and will not spend to be known in a market it has not studied.',
    'Chief Executive'],
  ['Admit beyond what it can teach',
    'The projection turns learners away when the establishment cannot reach them and records the number. Last year’s cohort is timetabled before this year’s admission.',
    'Director of Academic Standards'],
  ['Publish a person into an office they have not accepted',
    'An office may be defined and unfilled, and the plan says so. A holder and an appointment date travel together or neither is published; the build fails otherwise.',
    'Registrar'],
  ['Let a commercial relationship reach an academic decision',
    'No commercial authority here can alter an assessment outcome. A sponsor buys places on the published specification, not an opinion about how the work is marked.',
    'Academic Senate'],
  ['Publish a figure the record cannot source',
    'Every numeral here comes from a file recording who attested it and when. A number typed confidently into a paragraph fails the build — a duller mechanism than integrity, and a more reliable one.',
    'College Executive'],
];

export const EXCLUSION_COLUMNS = ['The College will not', 'Why, and what enforces it', 'Held by'];
