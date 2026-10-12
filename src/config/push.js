/**
 * P.U.S.H. objection framework
 *
 *   P  Pacify          lower resistance; acknowledge without getting defensive
 *   U  Uncover         ask what's really behind it; find the missing ingredient
 *   S  Show value      connect back to their own problem, outcome, or cost of waiting
 *   H  Hold next step  protect the next action so the conversation doesn't disappear
 *
 * Every bot turn is tagged with one of these stages. When a person hesitates,
 * the engine runs all four in order before returning to the intake.
 */
export const STAGES = {
  P: { name: 'Pacify',         purpose: 'Lower resistance' },
  U: { name: 'Uncover',        purpose: 'Find what\'s missing' },
  S: { name: 'Show value',     purpose: 'Tie it to their words' },
  H: { name: 'Hold next step', purpose: 'Protect the next action' }
};

/** Free-text that reads as hesitation rather than an answer. */
export const OBJECTION_PATTERN =
  /not interested|just looking|no time|don'?t have time|can'?t afford|too expensive|don'?t trust|scam|sales ?pitch|selling me|rather not|none of your business|why do you need|not sure i want|don'?t want to (get into|talk|share)|leave me alone|not comfortable/i;

/** Pacify: the first line back. First match wins; the last entry is the default. */
export const PACIFY = [
  { match: /afford|expensive|cost/i, line: 'Totally fair, and nobody is asking you to spend anything here.' },
  { match: /time|busy/i,             line: 'Understood, your time matters. We can keep this quick.' },
  { match: /.*/,                     line: 'That\'s completely fair. You don\'t owe us anything here.' }
];

/** Uncover: what is missing. Each option maps to one missing ingredient. */
export const UNCOVER = {
  ask: 'So we get this right, which is closest to what\'s behind that?',
  placeholder: 'Or in your words…',
  options: [
    { label: 'I\'m not sure I can trust this yet', missing: 'Trust' },
    { label: 'It\'s not a priority right now',     missing: 'Urgency' },
    { label: 'I don\'t think I need anything',     missing: 'Need' },
    { label: 'It\'s just a lot to think about',    missing: 'Emotion' }
  ],
  /** Used when they answer in their own words instead of picking. */
  hints: [
    { match: /trust|scam|know you|legit|private/i, missing: 'Trust' },
    { match: /later|busy|time|not now|priority/i,  missing: 'Urgency' },
    { match: /need|fine|okay|good already/i,       missing: 'Need' }
  ],
  fallback: 'Emotion'
};

/**
 * Show value: the opening sentence for each missing ingredient. The engine
 * appends one line that quotes the person's own answers (never invented).
 */
export const SHOW_VALUE = {
  Trust:   'That\'s fair. Nothing you share here is sold, and nothing gets offered in this conversation. Your answers go to one person on our team.',
  Urgency: 'Makes sense. We can keep this short.',
  Need:    'You may be right, and if nothing here helps, we\'ll say so.',
  Emotion: 'It is a lot. We\'ll take it one small piece at a time, and you can skip anything.'
};

/** Hold: where to go after a hesitation. */
export const HOLD_AFTER_HESITATION = {
  midIntake: {
    ask: 'Want to keep going, or pick this up another time?',
    options: [
      { label: 'Keep going',          go: 'resume', outcome: 'kept going' },
      { label: 'Skip that question',  go: 'skip',   outcome: 'skipped the question' },
      { label: 'Pick this up later',  go: 'later',  outcome: 'asked to check back' }
    ]
  },
  atNextStep: {
    ask: 'Would a short conversation still be useful, or should we check back later?',
    options: [
      { label: 'Okay, let\'s set it',    go: 'when',  outcome: 'held a call' },
      { label: 'Just check back later',  go: 'later', outcome: 'asked to check back' }
    ]
  }
};
