// LMS integration boundary — deliberately a contract, not an
// implementation. Decision #6 (buy-and-wrap) is provisionally
// accepted, but *which* LMS (Thinkific, LearnWorlds, a Moodle
// instance, etc.) is not chosen, and every real LMS's actual API
// shape differs enough that writing an adapter now would mean
// guessing field names the way the Opay adapter had to — except with
// nothing to verify against later, since there's no chosen vendor's
// docs to check it against. That's the line between "provisional
// assumption, keep building" and "fabricating an integration."
//
// What's real here: the calls this platform WILL need to make, based
// on what the enrolment flow (functions/api/enrolment/confirm.js)
// requires regardless of which LMS is chosen. Once a vendor is picked,
// implementing this interface against their real API is a bounded,
// well-scoped task — not a platform redesign.

export class LmsProviderInterface {
  // Called once from enrolment/confirm.js after a payment succeeds.
  // Must be idempotent — a webhook can retry.
  async enrolStudent(_params, _env) {
    // params: { userId, email, name, levelId, levelName }
    // returns: { lmsUserId, lmsCourseAccessUrl }
    throw new Error('No LMS vendor selected yet — see this file\'s header comment.');
  }

  // Called by a student-facing "resume learning" action once a real
  // Student Portal exists — currently there's nothing to call this
  // from, since /student-portal/preview/ has no live account to link.
  async getSsoLaunchUrl(_params, _env) {
    // params: { lmsUserId, courseId }
    // returns: { launchUrl } — typically a signed, time-limited SSO link
    throw new Error('No LMS vendor selected yet.');
  }

  // For the (not yet built) competency-tracking layer described in
  // docs/dashboard-design-system.md — pulling real progress data to
  // replace the Student Portal preview's demo stepper/stat-tiles.
  async getProgress(_params, _env) {
    // params: { lmsUserId, courseId }
    // returns: { unitsCompleted, totalUnits, attendancePercent, ... }
    throw new Error('No LMS vendor selected yet.');
  }
}
