/**
 * Recommendation rules: how scores turn into "relevant now" and "save for later".
 *
 * Scores alone would surface whatever was mentioned most. These rules add
 * judgment: a service can be ruled out (it doesn't apply to this person) or
 * deferred (it applies, just not yet), each with a note the team can read.
 */
export const THRESHOLDS = {
  now: 4,     // minimum points to be "relevant now"
  later: 2,   // minimum points to appear in "save for later"
  maxNow: 3,
  maxLater: 4
};

export const DEFAULT_LATER_NOTE = 'Worth a follow-up once the first conversation lands';

/**
 * @param {object} s       intake state (facts, scores, ...)
 * @param {object} scores  copy of s.scores
 * @returns {{exclude: string[], later: Record<string,string>}}
 */
export function applyRules(s, scores) {
  const exclude = [];
  const later = {};
  const f = s.facts;

  // Home-based services only apply to owners.
  if (f.home !== 'Owns') exclude.push('solar', 'equity');

  // A short stay makes long-payback home projects a later conversation.
  if (scores.solar && f.stay === '1-2 yrs') later.solar = 'Revisit if their plans to stay change';

  // Ease pressure before growth.
  if ((scores.relief || 0) >= 5 && scores.invest) later.invest = 'Better once monthly pressure eases';

  if (f.ownGoal === 'someday' && scores.homebuy) later.homebuy = 'Check back as timing firms up';

  if (scores.business && f.work === 'Between roles' && (scores.relief || 0) >= 3) {
    later.business = 'After income is steady again';
  }
  return { exclude, later };
}

/** Maps the opening answer to the service it named, to show when the fuller picture disagrees. */
export const LEAD_SERVICE = {
  'money pressure': 'relief',
  'a career change': 'career',
  'building their own thing': 'business',
  'wanting a plan': 'planning'
};
