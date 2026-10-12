/**
 * A scripted person used by "Play a sample person", the tests, and the
 * screenshot script. Each question id maps to a list of answers, used in
 * order, so a question that comes up twice (after a hesitation, say) gets
 * its second answer the second time.
 *
 * Marcus exercises every guardrail: an approved-answer question, a hesitation
 * that runs the full P.U.S.H. loop, a question routed to the team, and a held
 * next step.
 */
export const SAMPLE = {
  name:  [{ text: 'Marcus' }],
  open:  [{ labels: ['Money feels tighter than it should'] }],
  g1:    [{ labels: ['More breathing room each month', 'Doing work I\'m proud of'] }],
  g2:    [{ labels: ['Doing work I\'m proud of'] }],
  w1:    [{ labels: ['Employed, working for someone'] }],
  w2:    [{ labels: ['3 to 10 years'] }],
  w3:    [{ labels: ['Maybe, if the path were clearer'] }],
  h1:    [{ text: 'Is this a sales pitch for solar?' }, { labels: ['We own'] }],
  h2:    [{ labels: ['This is home, long-term'] }],
  h3:    [{ labels: ['Energy bills keep climbing', 'Repairs or updates we keep putting off'] }],
  hh1:   [{ labels: ['A partner', 'Kids'] }],
  hh2:   [{ text: 'Less stress around money so we can actually do things with them' }],
  d1:    [{ text: 'Not sure I want to get into money stuff' }, { labels: ['Reduce the pressure', 'Build toward something new'] }],
  uncover: [{ labels: ['It\'s just a lot to think about'] }],
  resume:  [{ labels: ['Keep going'] }],
  d2:    [{ labels: ['Monthly bills', 'Surprise expenses'] }],
  d3:    [{ labels: ['Not yet'] }],
  close: [{ text: 'Does my credit score matter for any of this?' }],
  recap: [{ labels: ['Yes, that\'s right'] }],
  hold:  [{ labels: ['Yes, let\'s set it'] }],
  when:  [{ labels: ['Evenings'] }],
  how:   [{ labels: ['Text'] }]
};
