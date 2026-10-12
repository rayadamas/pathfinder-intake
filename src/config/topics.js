/**
 * Topics are the broad areas the intake covers. Each one has an entry
 * question (in questions.js), a short bridge line shown when the
 * conversation moves into it, and a plain answer to "Why do you ask?".
 */
export const TOPICS = {
  work: {
    label: 'Work',
    entry: 'w1',
    bridge: 'Work and career',
    why: 'Work shapes most of what\'s possible, so it helps us point you to the right people instead of guessing.'
  },
  home: {
    label: 'Home',
    entry: 'h1',
    bridge: 'Home and stability',
    why: 'Some options only make sense for owners, or for people planning to stay put. We\'d rather ask than assume.'
  },
  household: {
    label: 'Household',
    entry: 'hh1',
    bridge: 'Who is in the picture',
    why: 'Who counts on you changes what planning and protecting mean for you. No names or details needed.'
  },
  goals: {
    label: 'Goals',
    entry: 'g1',
    bridge: 'Where you are headed',
    why: 'We start with where you want to go and work backward from there. There are no wrong answers.'
  },
  direction: {
    label: 'Direction',
    entry: 'd1',
    bridge: 'Last stretch, no numbers needed',
    why: 'It tells us which kind of help to lead with. We won\'t ask for account numbers or balances.'
  }
};

export const TOPIC_KEYS = Object.keys(TOPICS);

/** Used when the opening answer doesn't set its own order. Money comes last on purpose. */
export const DEFAULT_ORDER = ['goals', 'work', 'home', 'household', 'direction'];
