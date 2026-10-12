/**
 * The services a conversation can point toward.
 *
 * Keys are referenced by questions.js, keywords.js and rules.js. Rename,
 * add or remove services here, then update those files to match.
 */
export const SERVICES = {
  relief:   { name: 'Cash-flow relief',   summary: 'Lower the monthly pressure: debt, bills, payment timing.' },
  career:   { name: 'Career growth',      summary: 'A clearer path, a better role, or a new field.' },
  business: { name: 'Business support',   summary: 'Steadier revenue and simpler systems for owners.' },
  solar:    { name: 'Solar support',      summary: 'Energy-cost help for owners who plan to stay.' },
  equity:   { name: 'Home equity',        summary: 'Put the house to work for repairs or restructuring.' },
  homebuy:  { name: 'Home-buying prep',   summary: 'Get ready to own.' },
  planning: { name: 'Financial planning', summary: 'One plan across every goal.' },
  invest:   { name: 'Investments',        summary: 'Grow what they set aside.' },
  protect:  { name: 'Protection',         summary: 'Cover the people who count on them.' }
};
