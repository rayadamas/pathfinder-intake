import { DEFAULT_ORDER } from '../config/topics.js';
import { KEYWORDS } from '../config/keywords.js';

/** A fresh intake. Everything the avatar shows is derived from this object. */
export function createState() {
  return {
    name: '',
    lead: '',            // what they opened with, in plain words
    facts: {},           // work, tenure, field, home, stay, hh[], ownGoal
    wants: [],
    blocks: [],
    quotes: [],          // { q, t } free text in their own words, with the topic
    scores: {},          // serviceKey -> points
    evidence: {},        // serviceKey -> [{ why, said }]
    covered: new Set(),  // topic keys touched
    order: [...DEFAULT_ORDER],
    topicIndex: 0,
    pending: [],         // follow-up question ids queued by a branching answer
    current: null,       // id of the question on screen
    goalPicks: null,
    priority: '',
    done: false,

    stage: 'P',          // current P.U.S.H. stage
    stageCounts: { P: 0, U: 0, S: 0, H: 0 },
    hesitations: [],     // { missing, said, at, outcome }
    asks: [],            // { q, a } questions they asked; a === null means routed to the team
    skips: [],
    whyShown: null,
    recap: 'pending',    // pending | confirmed | corrected
    corrections: [],
    nextStep: null,      // { type: 'call', when, how } | { type: 'check-in', when }
    pushContext: null    // { trigger, resume, hesitation }
  };
}

/**
 * Add points to a service and record why, along with the person's words
 * that justify it. Every recommendation the app makes traces back here.
 */
export function addEvidence(s, key, points, why, said) {
  s.scores[key] = (s.scores[key] || 0) + points;
  const list = (s.evidence[key] ||= []);
  if (why && !list.some((e) => e.why === why)) list.push({ why, said });
}

function pushUnique(arr, v) {
  if (v && !arr.includes(v)) arr.push(v);
}

/** Record a tapped option: points, facts, wants, and blocks. */
export function applyOption(s, option) {
  option.points.forEach(([k, p, why]) => addEvidence(s, k, p, why, option.label));
  if (option.facts) {
    for (const [k, v] of Object.entries(option.facts)) {
      if (k === 'hh') pushUnique((s.facts.hh ||= []), v);
      else s.facts[k] = v;
    }
  }
  pushUnique(s.wants, option.want);
  pushUnique(s.blocks, option.block);
}

/** Read signals from free text, citing the exact words as evidence. */
export function applyFreeText(s, text, where, suffix = '') {
  KEYWORDS.forEach(([re, k, p, why]) => {
    if (re.test(text)) addEvidence(s, k, p, why + suffix, text);
  });
  s.quotes.push({ q: text, t: where });
}
