import { THRESHOLDS, DEFAULT_LATER_NOTE, applyRules, LEAD_SERVICE } from '../config/rules.js';

/**
 * Turn scores into a recommendation: what's relevant now, what to save for
 * later, and why. Pure function of state.
 *
 * @returns {{ now: [string, number][], later: [string, number][], notes: Record<string,string>, max: number }}
 */
export function plan(s) {
  const scores = { ...s.scores };
  const { exclude, later: deferred } = applyRules(s, scores);
  exclude.forEach((k) => delete scores[k]);

  const ranked = Object.entries(scores).filter(([, v]) => v > 0).sort((a, b) => b[1] - a[1]);
  const now = ranked
    .filter(([k, v]) => v >= THRESHOLDS.now && !(k in deferred))
    .slice(0, THRESHOLDS.maxNow);
  const later = ranked
    .filter(([k, v]) => !now.some(([n]) => n === k) && (v >= THRESHOLDS.later || k in deferred))
    .slice(0, THRESHOLDS.maxLater);

  const notes = {};
  later.forEach(([k]) => { notes[k] = deferred[k] || DEFAULT_LATER_NOTE; });

  return { now, later, notes, max: Math.max(10, ...ranked.map(([, v]) => v)) };
}

/** The service their opening line pointed at, if any. */
export function leadService(s) {
  return LEAD_SERVICE[s.lead] || null;
}
