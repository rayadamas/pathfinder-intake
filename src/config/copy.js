/**
 * Everything the intake says outside the topic questions: acknowledgments,
 * the playback check, the next-step hold, and the goodbye.
 */
export const COPY = {
  freeTextAck: 'Thanks for putting that in your own words.',
  whyAsk: 'Why do you ask?',
  whySkip: 'You can skip it.',
  skip: 'Skip this one',

  recap: {
    label: 'U · Uncover · confirm',
    intro: 'Here\'s what I heard, so we don\'t get anything wrong:',
    empty: 'Not much yet, and that\'s okay.',
    ask: 'Did I get that right?',
    yes: 'Yes, that\'s right',
    no: 'Something\'s off',
    placeholder: 'Or tell us what to fix…'
  },
  fix: {
    ask: 'Thanks for catching it. What should we correct?',
    placeholder: 'What we got wrong…',
    done: 'Got it, we\'ve updated the picture.'
  },

  value: {
    label: 'S · Show value · from their answers only',
    none: 'We don\'t have enough yet to point you somewhere specific, and we\'d rather not guess. A short conversation would fill in the gaps.',
    tail: 'That\'s all based on your own answers. If something doesn\'t fit, the team will adjust.'
  },

  hold: {
    withService: (service) => `Want to hold 20 minutes with someone on ${service}? One conversation, one topic.`,
    withoutService: 'Want to hold 20 minutes with someone to fill in the gaps? One conversation, no offers.',
    yes: 'Yes, let\'s set it',
    later: 'Check back in a few weeks',
    no: 'I\'d rather not'
  },
  when: { ask: 'What time of day works best?', options: ['Mornings', 'Afternoons', 'Evenings'] },
  how: { ask: 'And how should we reach you to confirm?', options: ['Text', 'Call', 'Email'] },
  later: { ask: 'No problem. When should we check back?', options: ['In two weeks', 'In a month', 'In three months'] },

  faqLabel: 'P · Pacify · answered from approved facts',
  routedLabel: 'P · Pacify · routed, not guessed',

  finishCall: (name, when, how) =>
    `You're set${name ? ', ' + name : ''}. Someone will reach out by ${how ? how.toLowerCase() : 'your preferred method'} to lock in a ${when.toLowerCase()} time. One conversation, one topic.`,
  finishLater: (name, when) =>
    `Thank you${name ? ', ' + name : ''}. We'll check back ${when ? when.toLowerCase() : 'soon'}. Nothing else will land in your inbox before then.`
};
