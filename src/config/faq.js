/**
 * APPROVED ANSWERS: PLACEHOLDERS, REWRITE BEFORE REAL USE
 * -------------------------------------------------------
 * These are the only questions the intake will answer directly. Anything a
 * person asks that doesn't match one of these patterns is NOT answered: it is
 * logged as "For the team" so a human gives a real answer.
 *
 * That is the point of this file. The bot never generates facts about your
 * business. It either repeats an answer your team wrote and approved, or it
 * says it won't guess.
 *
 * The five entries below are illustrative. They show the shape and tone, and
 * they make the demo work, but they are not true for your organization until
 * someone with authority rewrites and signs off on them. Keep each answer
 * short, factual, and free of promises you can't keep.
 *
 * Fields:
 *   id      stable identifier, used in tests and the team summary
 *   match   RegExp tested against the person's message
 *   answer  the exact text shown to the person
 */
export const FAQ = [
  {
    id: 'cost',
    match: /cost|price|fee|charge|free|pay for/i,
    answer: 'This conversation is free. Pricing depends on the service, so the team will give you real numbers directly rather than us guessing here.'
  },
  {
    id: 'pitch',
    match: /sell|pitch|sales|solar|push(ing)? me/i,
    answer: 'No pitch here. We ask about your goals first, and we only suggest something if your own answers point to it.'
  },
  {
    id: 'privacy',
    match: /who (sees|will see|gets)|private|share|my data|my info|information/i,
    answer: 'Your answers go to our team only, so one person can prepare a focused conversation with you.'
  },
  {
    id: 'length',
    match: /how long|minutes|take long/i,
    answer: 'About five minutes. You can skip any question.'
  },
  {
    id: 'about',
    match: /what is this|who are you|what do you (do|help)/i,
    answer: 'We help people improve their bottom line and move toward the life they want: career, home, money, and planning.'
  }
];

/** Shown when a question doesn't match any approved answer. */
export const ROUTED_TO_TEAM =
  'Good question, and I don\'t want to guess at it. I\'ve passed it to the team so you get a straight answer.';
