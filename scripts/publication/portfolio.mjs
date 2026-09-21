/**
 * THE COMMERCIAL ARCHITECTURE — what WEC-LC sells, and to whom.
 *
 * ════════════════════════════════════════════════════════════════════
 * WHAT THIS REPLACES
 * ════════════════════════════════════════════════════════════════════
 * The plan used to answer "what does WEC-LC sell?" with a number of
 * hours and a price per hour. It compared a pathway against executive
 * coaching at two to six hundred dollars an hour, and it solved the
 * tariff from the cost of a teacher's time.
 *
 * Every step of that was arithmetically sound and it described the
 * wrong institution. A College that prices by the teaching hour has
 * told the market that teaching hours are what it sells, and an hour
 * of instruction is a commodity with a thousand suppliers. WEC-LC does
 * not sell hours. It admits a learner, teaches them, assesses them
 * against a published standard, examines them, confers a qualification
 * and keeps the record of it permanently. The hour is one line in a
 * service of a dozen, and the cheapest line to copy.
 *
 * So the commercial spine is rebuilt here:
 *
 *   THE VALUE ARCHITECTURE says what the tuition provides — twelve
 *     components, of which live teaching is one.
 *   THE PATHWAYS say how a learner may experience it — five routes
 *     differing in mode, intensity, flexibility and the degree of
 *     institutional attention, and NOT in the qualification.
 *   THE REGIONS say what it costs where, on evidence rather than on
 *     one global number multiplied by a guess.
 *   THE PAYERS say who buys — a learner, a family, an employer, a
 *     university, a ministry, a foundation — because the institution
 *     that only knows how to sell to individuals has given up most of
 *     its market before it starts.
 *   THE PLANS say how it is paid, because an institution that presents
 *     a decade of education as one invoice has made a good decision
 *     look like a bad one.
 *
 * ════════════════════════════════════════════════════════════════════
 * THE PRINCIPLE THAT GOVERNS ALL OF IT
 * ════════════════════════════════════════════════════════════════════
 *      ONE ACADEMIC STANDARD. MULTIPLE WAYS TO EXPERIENCE IT.
 *
 * The examination, the rubric, the second marking, the moderation, the
 * registry entry and the award are IDENTICAL on every route and in
 * every market. What a route buys is attention, flexibility and
 * service — never a better certificate. A College whose credential
 * improves with the fee has stopped being a College, and no commercial
 * advantage is worth that trade.
 *
 * `tests/portfolio.test.mjs` holds the College to it.
 */

import {
  PRODUCTS, SEGMENTS, fullCost, B, attentionHours,
} from './pricing.mjs';

const r2 = (n) => Math.round(n * 100) / 100;
const round50 = (n) => Math.round(n / 50) * 50;

// ════════════════════════════════════════════════════════════════════
// I · WHAT THE TUITION PROVIDES
// ════════════════════════════════════════════════════════════════════
/**
 * THE VALUE ARCHITECTURE.
 *
 * Twelve components, published in this order, and the order is the
 * argument: the qualification pathway comes first and the teaching
 * comes fourth, because that is the true shape of what is being
 * bought. A learner reading this should finish it knowing what their
 * tuition funds. They should not have to infer it from an hourly rate,
 * and they should never be handed the College's internal cost
 * allocation in place of an answer — what the institution SPENDS and
 * what the learner RECEIVES are two different statements, and only one
 * of them is the learner's business.
 */
export const VALUE_ARCHITECTURE = [
  { n: '01', k: 'The academic programme',
    v: 'A complete six-level pathway from A1 to C2, each level conferring its own qualification.' },
  { n: '02', k: 'The curriculum',
    v: 'The College’s own structured curriculum, learning materials and academic sequence, authored and maintained in house.' },
  { n: '03', k: 'Teaching and guided learning',
    v: 'Live instruction according to the pathway chosen, from seminar to one-to-one.' },
  { n: '04', k: 'Academic supervision',
    v: 'Progress monitored against the standard, with intervention when a learner falls behind it.' },
  { n: '05', k: 'Assessment',
    v: 'Assignments, progress assessment and formal academic evaluation throughout each level.' },
  { n: '06', k: 'Examination',
    v: 'A qualification examination at the close of every level, set against a rubric published before the work begins.' },
  { n: '07', k: 'Quality assurance',
    v: 'Independent second marking and moderation across the cohort, on every route without exception.' },
  { n: '08', k: 'Academic advising',
    v: 'Structured guidance on progression, study planning and the route through the qualification.' },
  { n: '09', k: 'The learning environment',
    v: 'The College’s digital estate: the platform, resources, media, secure assessment and the academic record.' },
  { n: '10', k: 'Student services',
    v: 'Admissions, onboarding, scheduling, examination administration and learner support.' },
  { n: '11', k: 'The qualification',
    v: 'The WEC-LC award at each level completed, conferred against the same standard on every route.' },
  { n: '12', k: 'Registry and verification',
    v: 'A permanent academic record and public verification of the credential, checkable by a stranger without an account, for as long as the College exists.' },
];

// ════════════════════════════════════════════════════════════════════
// II · THE FIVE PATHWAYS
// ════════════════════════════════════════════════════════════════════
/**
 * Five routes to one qualification.
 *
 * `spec` names the delivery specification in pricing.mjs that the
 * pathway is costed from — the teaching hours, group size, marked
 * pieces and advising that the College must actually staff. The
 * specification is what makes the price honest; it is not what the
 * price is FOR.
 *
 * Executive carries two intensities because that is how executive
 * provision is actually bought: a small cohort of peers, or privately.
 * They are one pathway with one proposition and two ways of sitting in
 * the room, not two tiers of a ladder.
 */
export const PATHWAYS = {
  independent: {
    name: 'Independent',
    designedFor: 'Self-directed learners, and learners already working in English who need the qualification rather than the classroom.',
    proposition: 'The full academic infrastructure of the College — curriculum, learning environment, assessment, examination, qualification and registry — without scheduled instruction.',
    support: 'Academic advising and assessment feedback',
    flexibility: 'Entirely self-paced',
    personalisation: 'Standard',
    spec: 'independent',
    intensities: [{ key: 'independent', name: 'Independent', spec: 'independent' }],
    adopted: true,
    /* ONE TARIFF EVERYWHERE, and deliberately. Independent is the
       College's access route: it is already adopted and published at
       the level fee in data/commercial.json, it costs almost nothing
       to deliver beyond assessment, and it is the only route the
       researched West African and Asian figures can actually reach.
       Indexing it regionally would push it below its own floor in the
       two markets it exists to serve, which is the opposite of the
       point. It is published once, in every market, at one price. */
    regional: false,
  },
  guided: {
    name: 'Guided',
    designedFor: 'Learners who want structure, a cohort and regular academic direction.',
    proposition: 'Scheduled seminar teaching in a group of fourteen, guided assignments, instructor feedback on the work that carries the level, and progress review.',
    support: 'Seminar teaching and marked work',
    flexibility: 'Scheduled, with a published timetable',
    personalisation: 'Cohort',
    spec: 'directed',
    intensities: [{ key: 'guided', name: 'Guided', spec: 'directed' }],
  },
  tutored: {
    name: 'Tutored',
    designedFor: 'Learners who want close academic support and a named person responsible for their progress.',
    proposition: 'A named instructor, individual tutorial time at every level, written feedback on every piece of produced work, and a named academic adviser.',
    support: 'Individual tutorial and full marking',
    flexibility: 'Scheduled, with individual sessions arranged',
    personalisation: 'Individual',
    spec: 'tutored',
    intensities: [{ key: 'tutored', name: 'Tutored', spec: 'tutored' }],
  },
  executive: {
    name: 'Executive',
    designedFor: 'Professionals, senior managers, entrepreneurs and public-sector officials whose English has to work in the room where decisions are made.',
    proposition: 'Instruction scheduled around professional obligations, taught by senior academic staff, directed at the English of leadership — writing, presentation, negotiation, correspondence and the conduct of meetings — inside the same qualification architecture.',
    support: 'Senior academic staff, cohort of six or private',
    flexibility: 'Scheduled to the learner',
    personalisation: 'High',
    spec: 'execCore',
    intensities: [
      { key: 'executiveCohort', name: 'Executive, in cohort', spec: 'execCore',
        note: 'A closed cohort of no more than six professionals.' },
      { key: 'executivePrivate', name: 'Executive, private', spec: 'execPremium',
        note: 'One to one throughout, with a named academic adviser and quarterly progress review.' },
    ],
  },
  bespoke: {
    name: 'Executive Bespoke',
    designedFor: 'Senior and high-profile individuals whose requirements are genuinely particular, and whose time is the binding constraint.',
    proposition: 'One to one throughout, on a programme built to the holder’s own professional field, with material authored for it, an academic adviser on standing call and scheduling that yields to the diary rather than the other way round.',
    support: 'Dedicated senior academic team',
    flexibility: 'Exceptional — scheduled entirely to the holder',
    personalisation: 'Bespoke',
    spec: 'execBespoke',
    intensities: [{ key: 'bespoke', name: 'Executive Bespoke', spec: 'execBespoke' }],
  },
};

export const PATHWAY_KEYS = Object.keys(PATHWAYS);

/** Every priced intensity across the portfolio, in ladder order. */
export const INTENSITIES = PATHWAY_KEYS.flatMap((k) =>
  PATHWAYS[k].intensities.map((i) => ({ ...i, pathway: k })));

/** The fully loaded cost of delivering one complete A1–C2 pathway on a
 *  given specification — six levels, staffed and marked. */
export const pathwayCost = (spec) =>
  Array.from({ length: B.levels }, (_, i) => fullCost(spec, i)).reduce((a, b) => a + b, 0);

// ════════════════════════════════════════════════════════════════════
// III · THE REGIONS
// ════════════════════════════════════════════════════════════════════
/**
 * A GEOGRAPHICALLY INTELLIGENT TARIFF, AND WHY IT IS NOT A GUESS.
 *
 * One global price multiplied by a feeling about a country is not a
 * regional strategy; it is a rounding error with a flag on it. The
 * index below is computed from the College's own researched
 * willingness to pay, segment by segment, weighted by the reachable
 * population of each segment — which is the only regional evidence
 * this plan actually holds.
 *
 * The reference market is the GULF, because it is the best-evidenced:
 * the British Council publishes its Saudi tariff, and the whole A2–C1
 * ladder can be computed from it. Every other region is expressed
 * relative to that.
 *
 * TWO DISCIPLINES KEEP THIS HONEST.
 *
 * First, the index NEVER sets a price below what the pathway costs to
 * deliver with its share of the institution carried. Where a region's
 * index would do that, the pathway is simply NOT OFFERED at retail in
 * that region — it is available there through a sponsor, an employer
 * or an institution, or it is not available. West Africa is the case
 * that proves it: the researched figures say plainly that no taught
 * pathway reaches it, and the answer is the Independent route and
 * sponsored cohorts, not a taught pathway sold below cost to look
 * inclusive.
 *
 * Second, a regional tariff attaches to where the learner is and who
 * is paying, and the College publishes that as a policy rather than
 * leaving it to be discovered. An institution with four prices and no
 * rule about which one applies has not built a regional architecture;
 * it has built an arbitrage.
 */
const segmentsIn = (keys) => SEGMENTS.filter((s) => keys.includes(s.key));
const weightedWtp = (keys) => {
  const set = segmentsIn(keys);
  const pop = set.reduce((t, s) => t + s.reachable, 0);
  return set.reduce((t, s) => t + s.wtpFull * s.reachable, 0) / pop;
};

export const REGIONS = {
  gulf: {
    name: 'The Gulf', short: 'Gulf',
    markets: 'Saudi Arabia, the United Arab Emirates, Qatar, Kuwait, Bahrain and Oman',
    segments: ['gccExec', 'gccProf'],
    reference: true,
    evidence: 'british_council_saudi_ladder + corporate_1to1_rates',
    standing: 'researched',
    character: 'The most evidenced market the College holds, and the one where employer and family sponsorship is ordinary rather than exceptional.',
  },
  ukEurope: {
    name: 'The United Kingdom and Europe', short: 'UK & Europe',
    markets: 'The United Kingdom, Ireland and the European Union',
    segments: ['ukeu'],
    evidence: 'uk_presessional',
    standing: 'researched',
    character: 'Anchored on university pre-sessional English, the closest credentialed comparable the College has anywhere.',
  },
  asiaRow: {
    name: 'Asia and the wider world', short: 'Asia & world',
    markets: 'South and East Asia, the Americas and markets not otherwise named',
    segments: ['row'],
    evidence: null,
    standing: 'modelled',
    character: 'No reliable published tariff was found for this group and it is not a founding market. It is scaled between the Gulf and West African findings rather than researched, and it is marked as such wherever it appears.',
  },
  westAfrica: {
    name: 'West Africa', short: 'West Africa',
    markets: 'Nigeria, Ghana and the wider West African region',
    segments: ['waf'],
    evidence: 'nigeria_published_rates',
    standing: 'researched',
    character: 'A large and genuinely ambitious market at a price level no taught pathway reaches. The College serves it through the Independent route and through sponsored and institutional cohorts, and says so rather than pretending otherwise.',
  },
};

/* The index, computed rather than chosen. */
{
  const ref = weightedWtp(REGIONS.gulf.segments);
  for (const r of Object.values(REGIONS)) {
    r.wtp = Math.round(weightedWtp(r.segments));
    r.index = r2(r.wtp / ref);
  }
}

export const REGION_KEYS = Object.keys(REGIONS);

// ════════════════════════════════════════════════════════════════════
// IV · WHO PAYS
// ════════════════════════════════════════════════════════════════════
/**
 * A PAYER IS NOT A DISCOUNT. It is a different relationship, with
 * different economics, a different sales motion and a different number
 * of learners attached to it.
 *
 * The single most important commercial fact in this plan is that
 * acquisition paid one learner at a time never amortises, and
 * acquisition paid once per agreement divides by every seat the
 * agreement carries. That is why the institutional payers below are
 * not a footnote to a retail business; they are half of the
 * institution's reach and most of its efficiency.
 *
 * `bandKey` reads the College's own published partner bands. The
 * College does not invent a discount to win an agreement; it applies
 * the band it has published, which is a different and more durable
 * thing to be able to say in a negotiation.
 */
export const PAYERS = {
  individual: {
    name: 'The learner',
    who: 'A learner enrolling on their own account.',
    seats: 1, band: null, institutional: false,
    plans: ['full', 'annual', 'level', 'instalment'],
  },
  family: {
    name: 'A family',
    who: 'A parent, relative or benefactor funding a learner’s education.',
    seats: 1, band: null, institutional: false,
    note: 'The academic relationship remains with the learner. A funder receives confirmation of enrolment and of conferral, and nothing further without the learner’s instruction.',
    plans: ['full', 'annual', 'level', 'instalment'],
  },
  corporate: {
    name: 'An employer',
    who: 'A company purchasing places for its own staff, usually against a training budget and an appraisal cycle.',
    seats: 22, band: 25, institutional: true,
    plans: ['annual', 'level', 'contract'],
  },
  institutional: {
    name: 'An institution',
    who: 'A university, school, professional body or employer federation purchasing a cohort.',
    seats: 48, band: 25, institutional: true,
    plans: ['annual', 'contract'],
  },
  sponsored: {
    name: 'A sponsor',
    who: 'A ministry, agency or foundation funding places at scale under a public or charitable mandate.',
    seats: 120, band: 100, institutional: true,
    plans: ['annual', 'contract'],
  },
  partnership: {
    name: 'A partner institution',
    who: 'A negotiated standing arrangement carrying successive cohorts rather than a single purchase.',
    seats: 64, band: 100, institutional: true,
    note: 'A partnership is an agreement to admit cohorts on published terms. It is not an accreditation, a validation or a joint award, and the College will not describe it as one.',
    plans: ['annual', 'contract'],
  },
  scholarship: {
    name: 'The College',
    who: 'A place funded by the College itself under its access commitment.',
    seats: 1, band: null, institutional: false, remission: true,
    note: 'Funded from the institution’s own resources at the published tariff, so that an access place is a real cost the College carries and not a discount it advertises.',
    plans: ['full'],
  },
};

export const PAYER_KEYS = Object.keys(PAYERS);

// ════════════════════════════════════════════════════════════════════
// V · HOW IT IS PAID
// ════════════════════════════════════════════════════════════════════
/**
 * THE INSTITUTION MUST NOT PRESENT A DECADE OF EDUCATION AS ONE
 * INVOICE.
 *
 * A complete pathway is six levels across two to three years. Quoted
 * as a single sum it reads as an extravagance; quoted as what it
 * actually is — a level at a time, or a year at a time — it reads as
 * what a serious person spends on a serious qualification. Neither
 * framing changes the money. One of them loses the enrolment.
 *
 * The loadings below are institutional practice and not promotions.
 * Settlement in full releases working capital and carries a modest
 * advantage; payment by instalment carries the administration it
 * actually costs. Both are published, both are small, and the College
 * does not discount its way to a decision.
 */
export const PLANS = {
  full: {
    name: 'In full',
    how: 'The complete pathway settled on admission.',
    adjust: -0.03, instalments: 1,
    note: 'A settlement advantage of three per cent, which is the value to the College of the working capital and not a sale.',
  },
  annual: {
    name: 'Annually',
    how: 'One payment a year for the duration of the pathway.',
    adjust: 0, instalments: 3,
  },
  level: {
    name: 'Level by level',
    how: 'One payment at the opening of each of the six levels, with no commitment beyond the level in progress.',
    adjust: 0, instalments: 6,
    note: 'Each level confers its own qualification, so a learner who stops after two has paid for two and holds two.',
  },
  instalment: {
    name: 'By instalment',
    how: 'Four instalments across each level — twenty-four across the pathway.',
    adjust: 0.04, instalments: 24,
    note: 'A four per cent administration loading, which is what the arrangement costs the College to operate.',
  },
  contract: {
    name: 'Under agreement',
    how: 'Invoiced against a signed agreement on terms negotiated with the institution.',
    adjust: 0, instalments: null,
  },
};

/** What a plan actually asks for, and when. */
export function schedule(total, planKey) {
  const p = PLANS[planKey];
  if (!p) throw new Error(`no such payment plan: ${planKey}`);
  const payable = Math.round(total * (1 + p.adjust));
  return {
    key: planKey, name: p.name, how: p.how, note: p.note || null,
    adjust: p.adjust, payable,
    instalments: p.instalments,
    each: p.instalments ? Math.round(payable / p.instalments) : null,
  };
}

// ════════════════════════════════════════════════════════════════════
// VI · THE INVESTMENT MATRIX
// ════════════════════════════════════════════════════════════════════
/**
 * THE FLOOR, AND WHY IT IS NOT THE WHOLE CONSTITUTION.
 *
 * The first cut set the floor at the multiple of delivery cost that
 * the financial constitution implies for the portfolio as a whole —
 * and it priced the Independent route out of existence, because the
 * access route carries almost no teaching cost and a portfolio
 * multiple applied to a small number is still a small number.
 *
 * That was a category error. THE CONSTITUTION BINDS THE INSTITUTION,
 * NOT EACH PRODUCT. Cross-subsidy between routes is not a leak in the
 * model; it is what allows an institution to run an access route at
 * all, and every serious College in the world does it.
 *
 * So the per-pathway floor is the narrow question — does this route
 * cover what it costs to deliver, with a real contribution on top —
 * and the constitution is tested where it belongs, across the whole
 * realised portfolio, by `meetsConstitution()` below.
 */
export const MINIMUM_CONTRIBUTION = 0.30;

export const floorFor = (spec) => round50(pathwayCost(spec) * (1 + MINIMUM_CONTRIBUTION));

/**
 * The published investment for one intensity in one region.
 * Returns `offered: false` where the regional level will not carry the
 * pathway, which is a strategic finding and not a failure.
 */
export function investment(intensityKey, regionKey, base) {
  const intensity = INTENSITIES.find((i) => i.key === intensityKey);
  if (!intensity) throw new Error(`no such pathway intensity: ${intensityKey}`);
  const region = REGIONS[regionKey];
  if (!region) throw new Error(`no such region: ${regionKey}`);
  const reference = base[intensityKey];
  if (!(reference > 0)) throw new Error(`no reference investment for ${intensityKey}`);

  const floor = floorFor(intensity.spec);
  const regional = PATHWAYS[intensity.pathway].regional !== false;
  const indexed = regional ? round50(reference * region.index) : reference;
  const offered = indexed >= floor;
  return {
    intensity: intensityKey,
    pathway: intensity.pathway,
    region: regionKey,
    reference,
    index: regional ? region.index : 1,
    regional,
    floor,
    /* Where a region cannot carry the pathway the College does not
       quote a price it would not honour. */
    published: offered ? indexed : null,
    offered,
    throughSponsor: !offered,
    cost: Math.round(pathwayCost(intensity.spec)),
  };
}

/** The whole matrix: every intensity against every region. */
export function matrix(base) {
  return INTENSITIES.map((i) => ({
    intensity: i,
    byRegion: Object.fromEntries(REGION_KEYS.map((r) => [r, investment(i.key, r, base)])),
  }));
}

/** What a region can actually be sold at retail. */
export function offeredIn(regionKey, base) {
  return INTENSITIES.filter((i) => investment(i.key, regionKey, base).offered);
}

/**
 * A seat bought through an institutional payer: the published band
 * applied to the regional tariff, and the acquisition cost divided by
 * the seats the agreement carries.
 */
export function seat(intensityKey, regionKey, payerKey, base, agreementCost = 9800) {
  const payer = PAYERS[payerKey];
  if (!payer) throw new Error(`no such payer: ${payerKey}`);
  const inv = investment(intensityKey, regionKey, base);
  if (!inv.offered && !payer.institutional) return { ...inv, payer: payerKey, seatPrice: null };
  /* A sponsored seat in a region the retail tariff cannot reach is
     priced from the FLOOR rather than from a tariff that does not
     exist there. */
  const gross = inv.offered ? inv.published : inv.floor;
  const band = payer.band ? BANDS.find((b) => payer.band >= b.from && (b.to === null || payer.band <= b.to)) : null;
  const discount = band ? band.rate : 0;
  return {
    ...inv, payer: payerKey, seats: payer.seats,
    band: payer.band, discount,
    seatPrice: round50(gross * (1 - discount)),
    acquisitionPerSeat: payer.institutional ? Math.round(agreementCost / payer.seats) : null,
  };
}

/** The College's own published partner bands. */
export const BANDS = B.partnerBands.map((b) => ({ from: b.from, to: b.to, rate: b.rate }));

// ════════════════════════════════════════════════════════════════════
// VII · WHAT THE HOUR IS FOR NOW
// ════════════════════════════════════════════════════════════════════
/**
 * The attention-hour comparison is not deleted. It was a genuine and
 * hard-won piece of work: it caught a false claim that a table of six
 * numbers had let through, and it is the only like-for-like unit
 * against which any external price can be checked at all.
 *
 * But it is a MANAGEMENT AND METHODOLOGY instrument, not a commercial
 * proposition, and it belongs in the appendix where a Board or an
 * examiner can interrogate it — never on the page a learner reads to
 * decide whether to enrol. A prospective student who is shown a rate
 * per hour has been told what to compare the College against, and it
 * is the wrong comparison.
 */
export const attentionCheck = (intensityKey, price) => {
  const i = INTENSITIES.find((x) => x.key === intensityKey);
  return { hours: attentionHours(i.spec), perHour: Math.round(price / attentionHours(i.spec)) };
};

/** The academic specification behind a pathway — published because the
 *  College publishes what it staffs, not because the hours are the
 *  product. */
export function specification(intensityKey) {
  const i = INTENSITIES.find((x) => x.key === intensityKey);
  const p = PRODUCTS[i.spec];
  return {
    name: i.name,
    contactHours: (p.individual + p.groupHours) * B.levels,
    individualHours: p.individual * B.levels,
    groupSize: p.groupSize,
    markedPieces: p.markedPieces * B.levels,
    advising: r2(p.adviser * B.levels),
    academicHours: B.totalHours,
    credits: B.totalCredits,
  };
}

// ════════════════════════════════════════════════════════════════════
// VIII · THE CONSTITUTION, TESTED WHERE IT BINDS
// ════════════════════════════════════════════════════════════════════
/**
 * A REGIONAL TARIFF CHANGES WHAT THE INSTITUTION ACTUALLY COLLECTS,
 * so the financial constitution has to be tested against what is
 * collected and not against the reference tariff.
 *
 * Two of the College's four regions index below the reference — Asia
 * and the wider world at about a third, West Africa at about a seventh
 * — which means the realised price of a pathway is lower than its
 * published Gulf tariff by however much of the intake comes from
 * those markets. A plan that solved its price in the Gulf and then
 * quietly sold a third of its places elsewhere would satisfy its
 * constitution on paper and miss it in the bank.
 *
 * `realised()` therefore computes, for each intensity, the average
 * investment the College will actually collect: every region where
 * the route is offered, weighted by the learners that region's own
 * researched willingness to pay says will convert AT THAT REGION'S
 * PRICE. No share constants are invented; the weights are the demand
 * model's own output.
 */
export function realised(base) {
  const byIntensity = {};
  for (const i of INTENSITIES) {
    let learners = 0, revenue = 0;
    const regions = {};
    for (const rk of REGION_KEYS) {
      const inv = investment(i.key, rk, base);
      if (!inv.offered) { regions[rk] = { offered: false }; continue; }
      const n = segmentsIn(REGIONS[rk].segments)
        .reduce((t, s) => t + segmentDemandOf(s, inv.published), 0);
      learners += n; revenue += n * inv.published;
      regions[rk] = { offered: true, published: inv.published, learners: Math.round(n) };
    }
    byIntensity[i.key] = {
      name: i.name, spec: i.spec,
      reference: base[i.key],
      realised: learners > 0 ? Math.round(revenue / learners) : base[i.key],
      learners: Math.round(learners),
      regions,
    };
  }
  /* Mapped back to the delivery specifications the cost and demand
     engine is keyed by, because that engine is verified and there is
     no reason to build a second one. */
  const asSpecVector = {};
  for (const i of INTENSITIES) asSpecVector[i.spec] = byIntensity[i.key].realised;
  return { byIntensity, asSpecVector };
}

/* Imported lazily through a thin wrapper so this module keeps one
   import of the pricing engine and no cycle with the allocation
   layer, which itself imports pricing. */
import { segmentDemand as _segmentDemand } from './pricing.mjs';
const segmentDemandOf = (seg, price) => _segmentDemand(seg, price).learners;

import { achieved as _achieved, SHARES, RETAINED } from './allocation.mjs';

/** The financial constitution, tested on what is collected. */
export function meetsConstitution(base, opts = {}) {
  const r = realised(base);
  const got = _achieved(r.asSpecVector, opts);
  const target = RETAINED.reduce((t, k) => t + SHARES[k], 0);
  return { ...got, target, holds: got.retainedShare >= target - 1e-9, realised: r };
}

/**
 * THE SOLVE, AND WHY IT IS A SWEEP.
 *
 * The retained share is not monotone in price: raising a tariff raises
 * revenue per learner and loses learners, and the two do not move at
 * the same rate at every point on the curve. A bisection assumes a
 * monotonicity that is not there and returns a confident wrong answer
 * — it did once, at four hundred and fifty-six thousand dollars for a
 * Bespoke pathway — so the base is swept and the CHEAPEST point that
 * satisfies the constitution is adopted.
 *
 * Cheapest, not richest, and that is a policy: where two tariffs both
 * satisfy the institution's financial law, the College charges the
 * lower one. An institution that takes the maximum its constitution
 * permits has confused a floor with an objective.
 */
export function solveBase(seed, opts = {}) {
  const { from = 0.6, to = 2.6, step = 0.02 } = opts;
  /* AN ADOPTED PRICE IS NOT A VARIABLE. Independent is published, in
     data/commercial.json, at the level fee the College already
     charges. The first solve moved it four per cent to make the
     constitution hold — which would have had the plan quietly
     reprice a fee the institution has already told the world, to
     tidy an internal ratio. Adopted routes are pinned and the solve
     works on what is genuinely unset. */
  const pinned = new Set(INTENSITIES
    .filter((i) => PATHWAYS[i.pathway].adopted).map((i) => i.key));
  const curve = [];
  let cheapest = null;
  for (let k = from; k <= to + 1e-9; k += step) {
    const base = Object.fromEntries(Object.entries(seed)
      .map(([key, v]) => [key, pinned.has(key) ? v : round50(v * k)]));
    const got = meetsConstitution(base, opts);
    const point = { k: r2(k), base, pinned: [...pinned], retainedShare: got.retainedShare, holds: got.holds };
    curve.push(point);
    if (got.holds && !cheapest) cheapest = point;
  }
  return { curve, cheapest };
}

// ════════════════════════════════════════════════════════════════════
// IX · THE REFERENCE TARIFF
// ════════════════════════════════════════════════════════════════════
/**
 * THE COMMITTED REFERENCE TARIFF — the Gulf investment for each route,
 * from which every other regional tariff and every institutional seat
 * is derived.
 *
 * It is not a preference. It is the CHEAPEST tariff at which the
 * portfolio, sold across four regions at four different price levels
 * and through six kinds of payer, still satisfies the institution's
 * financial constitution. `tests/portfolio.test.mjs` re-derives it on
 * every build, so it cannot drift away from its reason.
 *
 * Independent is not solved. It is adopted and published at the level
 * fee the College already charges, and a plan does not reprice a fee
 * the institution has already announced in order to tidy an internal
 * ratio.
 *
 * The figures moved about four per cent when regional pricing was made
 * honest. The previous tariff was solved at one global price and would
 * have collected less than it modelled as soon as a third of the
 * intake came from Asia and West Africa — 49.2 per cent retained
 * against a constitution that requires 50. That gap is the whole
 * argument for pricing by region rather than by multiplication.
 */
export const REFERENCE_TARIFF = {
  independent: 3600,
  guided: 17800,
  tutored: 29000,
  executiveCohort: 52400,
  executivePrivate: 86100,
  bespoke: 142250,
};

/** The seed the solve starts from — the tariff before regional
 *  pricing was introduced, kept so the move can be re-derived. */
export const SUPERSEDED_TARIFF = {
  independent: 3600,
  guided: 17100,
  tutored: 27900,
  executiveCohort: 50400,
  executivePrivate: 82800,
  bespoke: 136800,
};

export const TARIFF = () => matrix(REFERENCE_TARIFF);
export const STANDING = () => meetsConstitution(REFERENCE_TARIFF);

// ════════════════════════════════════════════════════════════════════
// X · WHAT A PROJECTION NEEDS TO KNOW
// ════════════════════════════════════════════════════════════════════
/**
 * THE TARIFF A SEGMENT ACTUALLY FACES.
 *
 * The demand model in pricing.mjs walks the College's market segments
 * and prices each of them at one global figure per route. That was
 * right when there was one global figure. It is now wrong in a way
 * that materially overstates the decade: a West African learner is
 * offered a Tutored pathway the College does not sell in West Africa,
 * converts against it at a price nobody there is quoted, and books
 * revenue the institution would never have collected.
 *
 * Every segment belongs to exactly one region, so the fix is a lookup
 * rather than a rewrite. This returns, for each segment, the price
 * vector that segment is genuinely quoted — keyed by the DELIVERY
 * SPECIFICATION, because that is the vocabulary the cost engine
 * speaks — with `null` against any route its region does not carry at
 * retail.
 *
 * A null is not a zero and it is not a cheap price. It means the
 * College does not sell that route there, so no demand for it is
 * booked. Those learners are reached through a sponsor, an employer or
 * an institution, or they are not reached — and the projection now
 * says so instead of quietly assuming the second-best outcome.
 */
export const SPEC_OF_INTENSITY = {
  independent: 'independent',
  guided: 'directed',
  tutored: 'tutored',
  executiveCohort: 'execCore',
  executivePrivate: 'execPremium',
  bespoke: 'execBespoke',
};

export const SEGMENT_REGION = Object.fromEntries(
  REGION_KEYS.flatMap((rk) => REGIONS[rk].segments.map((sk) => [sk, rk])),
);

export function segmentTariff(base) {
  const out = {};
  for (const [segKey, regionKey] of Object.entries(SEGMENT_REGION)) {
    const vec = {};
    for (const [intensity, spec] of Object.entries(SPEC_OF_INTENSITY)) {
      const inv = investment(intensity, regionKey, base);
      vec[spec] = inv.offered ? inv.published : null;
    }
    out[segKey] = vec;
  }
  return out;
}

/** Reachable population by region, from the segments that compose it. */
export function regionReach() {
  return Object.fromEntries(REGION_KEYS.map((rk) => [rk,
    segmentsIn(REGIONS[rk].segments).reduce((t, s) => t + s.reachable, 0)]));
}

/**
 * WHERE AN AGREEMENT IS SIGNED, AND WHAT A SEAT COSTS THERE.
 *
 * An institutional channel is not region-less. A ministry signs in one
 * country, at that country's price level, and a seat under that
 * agreement costs what the region's tariff says it costs less the
 * College's own published band.
 *
 * THE TWO CHANNELS ARE WEIGHTED DIFFERENTLY, AND THAT IS THE POINT.
 * Distributing both by reachable population put two fifths of the
 * EMPLOYER agreements in the market with the least money to fund one,
 * which is not how corporate training budgets behave. An employer
 * follows budget: weighted by population and by the region's own price
 * level, the only proxy for corporate capacity this plan holds. A
 * ministry or a foundation follows NEED: weighted by population alone,
 * which is precisely why that channel reaches markets no retail tariff
 * does.
 *
 * A region the retail tariff cannot reach is still open to a sponsor,
 * priced from the contribution floor rather than from a tariff that
 * does not exist there. That is not a loophole; it is the strategy.
 */
export function agreementPlacement(base, channels) {
  const reach = regionReach();
  const out = {};
  for (const [key, c] of Object.entries(channels)) {
    const intensity = Object.keys(SPEC_OF_INTENSITY).find((i) => SPEC_OF_INTENSITY[i] === c.spec);
    const payer = PAYERS[key] ? key : 'institutional';
    const byBudget = c.placementWeight === 'budget';
    const weight = (rk) => reach[rk] * (byBudget ? REGIONS[rk].index : 1);
    const total = REGION_KEYS.reduce((t, rk) => t + weight(rk), 0);
    out[key] = REGION_KEYS.map((rk) => {
      const s = seat(intensity, rk, payer, base, c.agreementCost);
      return {
        region: rk,
        weighting: byBudget ? 'population × price level' : 'population',
        share: weight(rk) / total,
        seatPrice: s.seatPrice,
        cacPerSeat: s.acquisitionPerSeat,
        throughSponsor: !s.offered,
      };
    });
  }
  return out;
}
