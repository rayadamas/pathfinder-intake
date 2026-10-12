import { test } from 'node:test';
import assert from 'node:assert/strict';
import { classify, guessMissing, findFaq } from '../src/core/classify.js';
import { plan } from '../src/core/plan.js';
import { createState, addEvidence } from '../src/core/state.js';
import { FAQ } from '../src/config/faq.js';

test('classify separates answers, questions, and objections', () => {
  assert.equal(classify('We bought the house in 2019'), 'answer');
  assert.equal(classify('How long does this take?'), 'question');
  assert.equal(classify('Is this a sales pitch?'), 'question', 'approved answer beats objection');
  assert.equal(classify('I\'m just looking'), 'objection');
  assert.equal(classify('Not interested in being sold to'), 'objection');
  assert.equal(classify('what would that even look like for us'), 'question');
});

test('findFaq returns an approved answer or nothing', () => {
  assert.equal(findFaq('What does it cost?').id, 'cost');
  assert.equal(findFaq('What is the capital of Peru?'), null);
});

test('every FAQ entry has an id, a pattern, and an answer', () => {
  FAQ.forEach((f) => {
    assert.ok(f.id && f.match instanceof RegExp && f.answer.length > 0);
  });
});

test('guessMissing maps free text to the missing ingredient', () => {
  assert.equal(guessMissing('I don\'t really know you guys'), 'Trust');
  assert.equal(guessMissing('Maybe later, I\'m busy'), 'Urgency');
  assert.equal(guessMissing('We\'re fine'), 'Need');
  assert.equal(guessMissing('ugh'), 'Emotion');
});

test('home services are ruled out for renters', () => {
  const s = createState();
  s.facts.home = 'Rents';
  addEvidence(s, 'solar', 6, 'Brought up energy costs', 'electric bill');
  addEvidence(s, 'career', 5, 'Wants a new field', 'A new field entirely');
  const p = plan(s);
  assert.deepEqual(p.now.map(([k]) => k), ['career']);
  assert.ok(!p.later.some(([k]) => k === 'solar'));
});

test('growth waits while pressure is high', () => {
  const s = createState();
  addEvidence(s, 'relief', 7, 'Carrying debt payments', 'Debt payments');
  addEvidence(s, 'invest', 5, 'Wants to build toward something', 'Build toward something new');
  const p = plan(s);
  assert.deepEqual(p.now.map(([k]) => k), ['relief']);
  assert.equal(p.notes.invest, 'Better once monthly pressure eases');
});
