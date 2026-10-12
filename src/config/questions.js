/**
 * The intake's questions.
 *
 * Each question:
 *   text(s)         what the bot says; s is the intake state
 *   topic           which topic it belongs to (enables "Why do you ask?" and skipping)
 *   options         list (or function of state) of answer options, built with opt()
 *   multi           allow several options
 *   input           allow a free-text answer
 *   next(a, s)      the next question id, an array of ids, or null to move to the next topic
 *   after(a, s)     side effects after the answer is recorded
 *   ack(a, s)       optional one-line acknowledgment
 *   noIntercept     free text here is never treated as a question or objection
 *
 * Each option:
 *   label                 what the person taps
 *   points                [[serviceKey, points, reason], ...]
 *   facts                 profile facts to set ({ hh } accumulates into a list)
 *   want / block          adds to "What they want" / "What's in the way"
 */
export const opt = (label, points = [], extra = {}) => ({ label, points, ...extra });

export const QUESTIONS = {
  name: {
    stage: 'P',
    text: () => 'Hi there. Before anything else, what should we call you?',
    input: true,
    placeholder: 'First name is plenty',
    skip: 'Rather not say',
    noIntercept: true,
    onText: (t, s) => { s.name = t.trim().split(/\s+/)[0].slice(0, 24); },
    next: () => 'open'
  },

  open: {
    lead: true,
    text: (s) => `${s.name ? 'Good to meet you, ' + s.name + '. ' : ''}We help people improve their bottom line and move toward the life they want. Tell us a little about where you are today and what you want to change.`,
    hint: 'Tap one that fits, or say it your way.',
    input: true,
    placeholder: 'In your own words…',
    options: [
      opt('Money feels tighter than it should', [['relief', 1, 'Opened with money pressure']], { lead: 'money pressure', order: ['goals', 'work', 'home', 'household', 'direction'] }),
      opt('I\'m thinking about a career change', [['career', 1, 'Opened with a career change']], { lead: 'a career change', order: ['work', 'goals', 'household', 'home', 'direction'] }),
      opt('We\'re settling into (or out of) a home', [], { lead: 'a home decision', order: ['home', 'household', 'goals', 'work', 'direction'] }),
      opt('I want to build something of my own', [['business', 1, 'Opened with building something']], { lead: 'building their own thing', order: ['work', 'goals', 'household', 'home', 'direction'] }),
      opt('Doing okay, I want a real plan', [['planning', 1, 'Opened wanting a plan']], { lead: 'wanting a plan', order: ['goals', 'household', 'work', 'home', 'direction'] }),
      opt('Honestly, a little of everything', [], { lead: 'a little of everything' })
    ],
    after: (a, s) => {
      const pick = a.opts[0];
      if (pick && pick.order) s.order = pick.order;
      s.lead = pick ? pick.lead : (a.text ? 'their own words' : '');
    },
    ack: (a) => a.opts[0]
      ? 'Thanks for sharing that. We\'ll get there, and we\'d like the fuller picture first, so none of this is a pitch.'
      : 'Thank you, that\'s a real starting point. A few easy questions to fill in the picture.'
  },

  /* ---------- Work ---------- */
  w1: {
    topic: 'work',
    text: () => 'What does your work look like these days?',
    input: true,
    placeholder: 'Or describe it…',
    options: [
      opt('Employed, working for someone', [], { facts: { work: 'Employed' } }),
      opt('Self-employed or running a business', [['business', 2, 'Runs their own business']], { facts: { work: 'Self-employed' } }),
      opt('A job plus something on the side', [['business', 1, 'Has side income worth building on']], { facts: { work: 'Job + side work' } }),
      opt('Between things right now', [['career', 3, 'Currently between roles'], ['relief', 1, 'Income is in transition']], { facts: { work: 'Between roles' } }),
      opt('Retired or winding down', [['planning', 2, 'In or near retirement']], { facts: { work: 'Retired / winding down' } })
    ],
    next: (a, s) => {
      const w = s.facts.work || '';
      const t = a.text.toLowerCase();
      if (w === 'Self-employed' || /self|own business|freelanc|contract/.test(t)) return 's2';
      if (w === 'Between roles' || /laid off|unemploy|between|looking/.test(t)) return 'b2';
      if (w.startsWith('Retired') || /retire/.test(t)) return 'r2';
      if (a.skipped) return null;
      return 'w2';
    }
  },
  w2: {
    topic: 'work',
    text: () => 'How long have you been in this role?',
    options: [
      opt('Less than a year', [], { facts: { tenure: '< 1 yr' } }),
      opt('1 to 3 years', [], { facts: { tenure: '1-3 yrs' } }),
      opt('3 to 10 years', [], { facts: { tenure: '3-10 yrs' } }),
      opt('More than 10 years', [], { facts: { tenure: '10+ yrs' } })
    ],
    next: () => 'w3'
  },
  w3: {
    topic: 'work',
    text: () => 'Is this an industry you want to stay in?',
    input: true,
    placeholder: 'Or tell us more…',
    options: [
      opt('Yes, and I want to grow in it', [['career', 2, 'Wants to grow in their current field']], { facts: { field: 'Staying, wants to grow' }, want: 'Grow in current field' }),
      opt('Maybe, if the path were clearer', [['career', 3, 'Path forward in their field feels unclear']], { facts: { field: 'Unsure, path unclear' }, block: 'No clear path in current role' }),
      opt('I\'m ready for something different', [['career', 4, 'Ready to change industries']], { facts: { field: 'Ready to switch' }, want: 'Move into a new field' }),
      opt('It pays the bills, and that\'s fine', [], { facts: { field: 'Content, work is a means' } })
    ],
    ack: (a) => a.opts[0]?.label.startsWith('I\'m ready') ? 'Good to know. Plenty of people make that move mid-career.' : null
  },
  s2: {
    topic: 'work',
    text: () => 'How long have you been running it?',
    options: [
      opt('Just getting started', [['business', 2, 'Early-stage business']], { facts: { tenure: 'Early stage' } }),
      opt('1 to 3 years', [], { facts: { tenure: '1-3 yrs' } }),
      opt('3+ years and steady', [['invest', 1, 'Established, steady business']], { facts: { tenure: '3+ yrs, steady' } }),
      opt('3+ years, but uneven', [['business', 2, 'Established but uneven revenue'], ['relief', 1, 'Revenue swings']], { facts: { tenure: '3+ yrs, uneven' }, block: 'Uneven revenue' })
    ],
    next: () => 's3'
  },
  s3: {
    topic: 'work',
    multi: true,
    text: () => 'What would help the business most right now? Pick any.',
    options: [
      opt('More customers', [['business', 2, 'Wants more customers']]),
      opt('Steadier cash flow', [['business', 2, 'Cash flow is uneven'], ['relief', 1, 'Cash flow is uneven']], { block: 'Irregular cash flow' }),
      opt('Getting time back', [['business', 1, 'Stretched thin on time']], { block: 'Stretched thin on time' }),
      opt('Separating business and personal money', [['planning', 3, 'Business and personal money are mixed']])
    ]
  },
  b2: {
    topic: 'work',
    text: () => 'What would a real step forward look like for you?',
    input: true,
    placeholder: 'Or describe it…',
    options: [
      opt('Same field, better role', [['career', 2, 'Wants a better role in the same field']], { want: 'A better role in their field' }),
      opt('A new field entirely', [['career', 3, 'Wants a new field']], { want: 'Move into a new field' }),
      opt('Starting something of my own', [['business', 3, 'Wants to start their own thing']], { want: 'Start their own thing' }),
      opt('Anything steady for now', [['relief', 2, 'Needs steady income soon']], { block: 'No steady income yet' })
    ]
  },
  r2: {
    topic: 'work',
    multi: true,
    text: () => 'What matters most in this chapter? Pick any.',
    options: [
      opt('Making savings last', [['planning', 2, 'Wants savings to last'], ['invest', 2, 'Wants savings to last']], { want: 'Make savings last' }),
      opt('Keeping costs down', [['relief', 2, 'Watching fixed costs']]),
      opt('Helping family', [['protect', 2, 'Wants to help family'], ['planning', 1, 'Wants to help family']], { want: 'Help family' }),
      opt('Staying active and useful', [['career', 1, 'Open to part-time or purpose work']])
    ]
  },

  /* ---------- Home ---------- */
  h1: {
    topic: 'home',
    text: () => 'Tell us about home. Do you own, rent, or something else?',
    options: [
      opt('We own', [], { facts: { home: 'Owns' } }),
      opt('We rent', [], { facts: { home: 'Rents' } }),
      opt('Living with family', [], { facts: { home: 'With family' } }),
      opt('It\'s complicated', [], { facts: { home: 'Complicated' } })
    ],
    next: (a, s) => s.facts.home === 'Owns' ? 'h2' : (!s.facts.home || s.facts.home === 'Complicated' ? null : 'h2r')
  },
  h2: {
    topic: 'home',
    text: () => 'How long do you expect to stay there?',
    options: [
      opt('A year or two', [], { facts: { stay: '1-2 yrs' } }),
      opt('2 to 5 years', [['equity', 1, 'Some runway in the home']], { facts: { stay: '2-5 yrs' } }),
      opt('5 to 10 years', [['solar', 1, 'Plans to stay 5+ years'], ['equity', 1, 'Long runway in the home']], { facts: { stay: '5-10 yrs' } }),
      opt('This is home, long-term', [['solar', 2, 'Plans to stay long-term'], ['equity', 1, 'Long runway in the home']], { facts: { stay: 'Long-term' } })
    ],
    ack: (a) => /long-term|5 to 10/.test(a.opts[0]?.label || '') ? 'Staying put opens up some good options.' : null,
    next: () => 'h3'
  },
  h3: {
    topic: 'home',
    multi: true,
    text: () => 'What\'s on your mind about the house? Pick any.',
    options: [
      opt('Energy bills keep climbing', [['solar', 3, 'Energy bills are climbing'], ['relief', 1, 'Energy bills are climbing']], { block: 'Rising energy bills' }),
      opt('Repairs or updates we keep putting off', [['equity', 3, 'Putting off repairs or upgrades']], { block: 'Deferred home repairs' }),
      opt('The mortgage payment', [['relief', 2, 'Mortgage payment feels heavy'], ['equity', 1, 'Could restructure around the mortgage']], { block: 'Heavy mortgage payment' }),
      opt('It\'s the wrong size for us now', [['planning', 1, 'Home no longer fits']], { want: 'A home that fits' }),
      opt('Nothing pressing', [])
    ]
  },
  h2r: {
    topic: 'home',
    text: () => 'Is owning a home part of the picture?',
    options: [
      opt('Yes, within a few years', [['homebuy', 4, 'Wants to buy within a few years'], ['planning', 1, 'Saving toward a home']], { want: 'Own a home' }),
      opt('Someday, not soon', [['homebuy', 2, 'Wants to own someday']], { facts: { ownGoal: 'someday' } }),
      opt('Not really, and that\'s fine', [])
    ]
  },

  /* ---------- Household ---------- */
  hh1: {
    topic: 'household',
    multi: true,
    text: () => 'Who\'s under your roof, or counting on you? Pick any.',
    options: [
      opt('Just me', [], { facts: { hh: 'Just me' } }),
      opt('A partner', [['protect', 1, 'Shares finances with a partner']], { facts: { hh: 'Partner' } }),
      opt('Kids', [['protect', 2, 'Kids at home'], ['planning', 1, 'Planning around kids']], { facts: { hh: 'Kids' } }),
      opt('Parents or relatives', [['protect', 2, 'Supports relatives at home']], { facts: { hh: 'Relatives' } }),
      opt('Someone I help from afar', [['relief', 1, 'Sends support outside the home'], ['protect', 1, 'Someone counts on them']], { facts: { hh: 'Supports someone' } })
    ],
    next: (a) => a.opts.some((x) => x.label === 'Kids') ? 'hh2' : null
  },
  hh2: {
    topic: 'household',
    text: () => 'What do you want most for them in the next few years?',
    input: true,
    placeholder: 'Or say it your way…',
    options: [
      opt('Stability, fewer surprises', [['protect', 1, 'Wants stability for the kids'], ['relief', 1, 'Wants fewer surprises']]),
      opt('Saving for school', [['planning', 2, 'Saving for education'], ['invest', 2, 'Saving for education']], { want: 'Save for the kids\' education' }),
      opt('More time with them', [['career', 1, 'Wants more time with family']], { want: 'More time with family' }),
      opt('More room to grow, literally', [['equity', 1, 'Needs more space'], ['homebuy', 1, 'Needs more space']], { want: 'More space' })
    ]
  },

  /* ---------- Goals ---------- */
  g1: {
    topic: 'goals',
    multi: true,
    text: (s) => `Picture life one to three years from now${s.name ? ', ' + s.name : ''}. What's different? Pick any, or say it in your own words.`,
    input: true,
    placeholder: 'In your own words…',
    options: [
      opt('More breathing room each month', [['relief', 2, 'Wants more monthly breathing room']], { want: 'More breathing room each month' }),
      opt('Doing work I\'m proud of', [['career', 2, 'Wants work they\'re proud of']], { want: 'Work they\'re proud of' }),
      opt('A home that\'s ours, or better', [['homebuy', 1, 'Home is part of the vision'], ['equity', 1, 'Home is part of the vision']], { want: 'Own or improve their home' }),
      opt('Something built for the kids', [['planning', 2, 'Wants to build for the kids'], ['invest', 1, 'Wants to build for the kids']], { want: 'Build something for the kids' }),
      opt('Freedom to travel or slow down', [['planning', 2, 'Wants freedom to slow down'], ['invest', 2, 'Wants freedom to slow down']], { want: 'Freedom to travel or slow down' }),
      opt('My own thing, up and running', [['business', 3, 'Wants their own business running']], { want: 'Their own business, running' })
    ],
    after: (a, s) => { s.goalPicks = a.opts; },
    next: (a) => a.skipped ? null : 'g2'
  },
  g2: {
    topic: 'goals',
    input: true,
    placeholder: 'The one thing…',
    text: (s) => (s.goalPicks || []).length > 1
      ? 'Of those, which would make the biggest difference right now?'
      : 'What would make the biggest difference right now?',
    // Built from their own g1 picks, so the follow-up uses their words.
    options: (s) => (s.goalPicks || []).length > 1
      ? s.goalPicks.map((x) => opt(x.label, x.points.map(([k]) => [k, 2, 'Named it as their top priority'])))
      : [],
    after: (a, s) => {
      if (a.opts[0]) s.priority = a.opts[0].label;
      else if (a.text) s.priority = a.text;
    }
  },

  /* ---------- Direction ---------- */
  d1: {
    topic: 'direction',
    multi: true,
    text: () => 'When you think about money, which of these feels closest? Pick any.',
    input: true,
    placeholder: 'Or say it your way…',
    options: [
      opt('Reduce the pressure', [['relief', 2, 'Wants to reduce money pressure']]),
      opt('Create more income', [['career', 1, 'Wants more income'], ['business', 1, 'Wants more income']], { want: 'More income' }),
      opt('Protect what I have', [['protect', 2, 'Wants to protect what they have'], ['planning', 1, 'Wants to protect what they have']]),
      opt('Build toward something new', [['invest', 2, 'Wants to build toward something'], ['planning', 1, 'Wants to build toward something']])
    ],
    next: (a) => {
      const has = (l) => a.opts.some((x) => x.label === l);
      const q = [];
      if (has('Reduce the pressure')) q.push('d2');
      if (has('Build toward something new')) q.push('d3');
      return q.length ? q : null;
    }
  },
  d2: {
    topic: 'direction',
    multi: true,
    text: () => 'Where does most of that pressure come from? Pick any.',
    options: [
      opt('Debt payments', [['relief', 3, 'Carrying debt payments']], { block: 'Debt payments' }),
      opt('Monthly bills', [['relief', 1, 'Monthly bills are heavy'], ['solar', 1, 'Monthly bills are heavy']], { block: 'Heavy monthly bills' }),
      opt('Income that swings month to month', [['planning', 2, 'Income swings month to month'], ['business', 1, 'Income swings month to month']], { block: 'Unpredictable income' }),
      opt('Surprise expenses', [['planning', 2, 'No cushion for surprises'], ['protect', 1, 'No cushion for surprises']], { block: 'No cushion for surprises' })
    ]
  },
  d3: {
    topic: 'direction',
    text: () => 'Have you started saving or investing toward it?',
    options: [
      opt('Not yet', [['planning', 2, 'Hasn\'t started saving toward goals']]),
      opt('A little, not sure it\'s right', [['invest', 2, 'Wants a second look at what they have']]),
      opt('Yes, and I\'d like a second opinion', [['invest', 3, 'Actively investing, wants a second opinion']])
    ]
  },

  /* ---------- Close ---------- */
  close: {
    text: () => 'That\'s most of the picture. Anything else we should know, or anything you\'d rather we not bring up?',
    input: true,
    placeholder: 'Optional…',
    noIntercept: true,
    options: [opt('That covers it')],
    after: (a, s) => { if (a.text && /\?\s*$/.test(a.text)) s.asks.push({ q: a.text, a: null }); }
  }
};
