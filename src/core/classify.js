import { FAQ } from '../config/faq.js';
import { OBJECTION_PATTERN, UNCOVER } from '../config/push.js';

const QUESTION_START = /^(what|how|why|who|when|where|is|are|does|do you|can you|could|will|would|should)\b/i;

/**
 * Decide what a free-text message is before treating it as an answer.
 *
 *   'question'   they asked us something: answer from FAQ or route to the team
 *   'objection'  they're hesitating: run P.U.S.H.
 *   'answer'     a normal answer to the question on screen
 *
 * A question that matches an approved answer wins over an objection, so
 * "Is this a sales pitch?" gets a straight answer instead of a pivot.
 */
export function classify(text) {
  const t = text.trim();
  const endsWithQ = /\?\s*$/.test(t);
  if (endsWithQ && findFaq(t)) return 'question';
  if (OBJECTION_PATTERN.test(t)) return 'objection';
  if (endsWithQ || (QUESTION_START.test(t) && t.split(/\s+/).length > 2)) return 'question';
  return 'answer';
}

/** The approved answer for a question, or null. Never generates text. */
export function findFaq(text) {
  return FAQ.find((f) => f.match.test(text)) || null;
}

/** Which ingredient (Trust, Urgency, Need, Emotion) free text points to. */
export function guessMissing(text = '') {
  const hit = UNCOVER.hints.find((h) => h.match.test(text));
  return hit ? hit.missing : UNCOVER.fallback;
}
