// Single source of truth for the admissions wizard's field shape —
// imported by both the final-submit endpoint (functions/api/admissions/
// apply.js) and the in-progress draft endpoint (functions/api/
// admissions/draft.js), so the two never drift into checking a value
// two different ways. Every enum here mirrors a CHECK constraint in
// sql/migrations/017-admissions-application-detail.sql and
// sql/migrations/018-admissions-wizard.sql — when a constraint changes
// there, it changes here too.

export const MAX_NAME_LENGTH = 200;
export const MAX_FREE_TEXT = 2000;

export const ENUMS = {
  purpose:            ['university', 'career', 'government', 'examination', 'business', 'personal'],
  startPreference:    ['immediately', 'within_3_months', 'within_6_months', 'undecided'],
  residencyInterest:  ['own_city', 'uk_london', 'uk_manchester', 'uk_other', 'undecided'],
  funding:            ['self', 'employer', 'family', 'scholarship', 'government', 'undecided'],
  paymentPlan:        ['level_by_level', 'instalments', 'full_pathway', 'undecided'],
  educationLevel:     ['secondary', 'undergraduate', 'postgraduate', 'doctorate', 'professional', 'other'],
  sponsorRelationship: ['employer', 'parent_or_guardian', 'other_family', 'scholarship_body', 'government', 'other'],
};

// The wizard, in the order a visitor walks it. Each step names the
// fields it collects — used by the draft endpoint to know which keys
// belong to a step (so one step's save can't silently overwrite a
// field that belongs to another), and by the frontend to render one
// step's worth of markup at a time. `review` collects nothing of its
// own; it is the step that calls the real, final POST /api/admissions/
// apply with everything gathered so far.
export const WIZARD_STEPS = [
  { key: 'identity',    fields: ['fullName', 'nationality', 'country'] },
  { key: 'contact',     fields: ['email', 'phone', 'city', 'residentialAddress'] },
  { key: 'emergency',   fields: ['emergencyContactName', 'emergencyContactRelationship', 'emergencyContactPhone'] },
  { key: 'programme',   fields: ['selfAssessedLevelId', 'purpose', 'startPreference', 'residencyInterest'] },
  { key: 'education',   fields: ['educationLevel', 'educationInstitution'] },
  { key: 'funding',     fields: ['funding', 'paymentPlan', 'sponsorName', 'sponsorRelationship'] },
  { key: 'declaration', fields: ['heardVia', 'notes', 'isAdult', 'privacyAgreed'] },
  { key: 'review',      fields: [] },
];

export const STEP_KEYS = WIZARD_STEPS.map((s) => s.key);
const FIELD_TO_STEP = new Map(
  WIZARD_STEPS.flatMap((s) => s.fields.map((f) => [f, s.key])),
);

export function stepForField(field) {
  return FIELD_TO_STEP.get(field) || null;
}

const FREE_TEXT_FIELDS = new Set([
  'city', 'heardVia', 'residentialAddress', 'emergencyContactName',
  'emergencyContactPhone', 'educationInstitution', 'sponsorName',
]);

// Lenient, per-field validation for a single step being saved
// mid-wizard: a step can be revisited and partially filled, so this
// checks only that whatever WAS supplied is well-formed — it never
// requires a field, unlike validateFullApplication() below. Returns
// { fieldName: errorMessage } for anything malformed.
export function validateStepFields(fields) {
  const errors = {};
  for (const [key, value] of Object.entries(fields || {})) {
    if (value == null || value === '') continue;
    if (key === 'email') {
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) errors.email = 'Enter a valid email address.';
      continue;
    }
    if (key === 'country' || key === 'nationality') {
      if (typeof value !== 'string' || !/^[A-Za-z]{2}$/.test(value)) {
        errors[key] = 'Must be a two-letter country code.';
      }
      continue;
    }
    if (key === 'selfAssessedLevelId') {
      const n = Number(value);
      if (!Number.isInteger(n) || n < 1 || n > 6) errors[key] = 'Invalid level.';
      continue;
    }
    if (key in ENUMS) {
      if (!ENUMS[key].includes(value)) errors[key] = 'Please choose one of the listed options.';
      continue;
    }
    if (key === 'isAdult' || key === 'privacyAgreed') {
      if (typeof value !== 'boolean') errors[key] = 'Must be true or false.';
      continue;
    }
    if (key === 'notes') {
      if (typeof value !== 'string' || value.length > MAX_FREE_TEXT) {
        errors[key] = `Please keep this under ${MAX_FREE_TEXT} characters.`;
      }
      continue;
    }
    if (key === 'fullName') {
      if (typeof value !== 'string' || !value.trim() || value.length > MAX_NAME_LENGTH) {
        errors[key] = `Full name must be 1–${MAX_NAME_LENGTH} characters.`;
      }
      continue;
    }
    if (FREE_TEXT_FIELDS.has(key)) {
      if (typeof value !== 'string' || value.length > MAX_NAME_LENGTH) {
        errors[key] = 'This answer is too long.';
      }
      continue;
    }
    if (typeof value !== 'string' || value.length > MAX_NAME_LENGTH) {
      errors[key] = 'This answer is too long.';
    }
  }
  return errors;
}
