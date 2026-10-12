import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createIntake } from '../src/core/engine.js';
import { plan } from '../src/core/plan.js';
import { SAMPLE } from '../src/config/sample.js';

/** Drive the engine headlessly with a scripted person. */
async function run(script, { stopAt } = {}) {
  const messages = [];
  const prompts = [];
  const queue = structuredClone(script);
  let intake;
  let resolveDone;
  const finished = new Promise((r) => { resolveDone = r; });

  intake = createIntake({
    pace: () => 0,
    onMessage: (m) => messages.push(m),
    onDone: () => resolveDone('done'),
    onPrompt: (p) => {
      prompts.push(p);
      if (p.id === stopAt) return resolveDone('stopped');
      const next = queue[p.id]?.shift();
      if (!next) return resolveDone('ran out at ' + p.id);
      setImmediate(() => intake.answer(next));
    }
  });
  intake.start();
  const how = await finished;
  return { s: intake.state, messages, prompts, how };
}

test('the sample person completes the whole intake', async () => {
  const { s, how } = await run(SAMPLE);
  assert.equal(how, 'done');
  assert.equal(s.done, true);
  assert.equal(s.name, 'Marcus');
  assert.deepEqual(s.nextStep, { type: 'call', when: 'Evenings', how: 'Text' });
  assert.equal(s.recap, 'confirmed');
});

test('every topic is covered and the opening line does not decide the order alone', async () => {
  const { s } = await run(SAMPLE);
  assert.deepEqual([...s.covered].sort(), ['direction', 'goals', 'home', 'household', 'work']);
  assert.equal(s.lead, 'money pressure');
});

test('a hesitation runs Pacify, Uncover, Show value, Hold in order', async () => {
  const { s, messages } = await run(SAMPLE);
  assert.equal(s.hesitations.length, 1);
  const h = s.hesitations[0];
  assert.equal(h.missing, 'Emotion');
  assert.equal(h.said, 'Not sure I want to get into money stuff');
  assert.equal(h.outcome, 'kept going');

  const start = messages.findIndex((m) => m.role === 'user' && m.text === h.said);
  const stages = messages.slice(start + 1).filter((m) => m.role === 'bot' && m.stage).slice(0, 4).map((m) => m.stage);
  assert.deepEqual(stages, ['P', 'U', 'S', 'H']);
});

test('approved questions are answered; everything else is routed, never guessed', async () => {
  const { s } = await run(SAMPLE);
  const pitch = s.asks.find((x) => /sales pitch/.test(x.q));
  assert.equal(pitch.faq, 'pitch');
  const credit = s.asks.find((x) => /credit score/.test(x.q));
  assert.equal(credit.a, null, 'an unmatched question must not get an answer');
});

test('every recommendation carries the words that justify it', async () => {
  const { s } = await run(SAMPLE);
  for (const [k] of [...plan(s).now, ...plan(s).later]) {
    assert.ok(s.evidence[k].length > 0, `${k} has evidence`);
    s.evidence[k].forEach((e) => assert.ok(e.said, `${k}: "${e.why}" cites what was said`));
  }
});

test('the show-value line only quotes things the person actually said', async () => {
  const { messages } = await run(SAMPLE);
  const userWords = new Set(messages.filter((m) => m.role === 'user').flatMap((m) => m.text.split(' · ')));
  const value = messages.find((m) => m.role === 'bot' && m.text.startsWith('Here\'s why we\'d start'));
  const quoted = [...value.text.matchAll(/"([^"]+)"/g)].map((x) => x[1]);
  assert.ok(quoted.length > 0);
  quoted.forEach((q) => assert.ok(userWords.has(q), `"${q}" was said by the person`));
});

test('the playback is confirmed before any value is shown', async () => {
  const { messages } = await run(SAMPLE);
  const recap = messages.findIndex((m) => m.text?.startsWith('Here\'s what I heard'));
  const value = messages.findIndex((m) => m.text?.startsWith('Here\'s why we\'d start'));
  const yes = messages.findIndex((m) => m.role === 'user' && m.text === 'Yes, that\'s right');
  assert.ok(recap > -1 && recap < yes && yes < value);
});

test('a correction during playback updates the picture', async () => {
  const script = { ...structuredClone(SAMPLE), recap: [{ text: 'Actually we are behind on a car loan too' }] };
  const { s } = await run(script);
  assert.equal(s.recap, 'corrected');
  assert.ok(s.evidence.relief.some((e) => e.said === 'Actually we are behind on a car loan too'));
});

test('declining the next step still holds one', async () => {
  const script = {
    ...structuredClone(SAMPLE),
    hold: [{ labels: ['I\'d rather not'] }],
    uncover: [...SAMPLE.uncover, { labels: ['It\'s not a priority right now'] }],
    resume: [...SAMPLE.resume, { labels: ['Just check back later'] }],
    later: [{ labels: ['In a month'] }]
  };
  const { s, how } = await run(script);
  assert.equal(how, 'done');
  assert.deepEqual(s.nextStep, { type: 'check-in', when: 'In a month' });
  assert.equal(s.hesitations.at(-1).missing, 'Urgency');
});

test('"Why do you ask?" explains, then offers a skip', async () => {
  const prompts = [];
  let intake;
  const reached = new Promise((done) => {
    let asked = false;
    intake = createIntake({
      pace: () => 0,
      onPrompt: (p) => {
        prompts.push(p);
        if (p.id === 'name') setImmediate(() => intake.answer({ text: 'Ana' }));
        else if (p.id === 'open') setImmediate(() => intake.answer({ labels: ['Honestly, a little of everything'] }));
        else if (p.id === 'g1' && !asked) { asked = true; setImmediate(() => intake.whyAsk()); }
        else if (p.id === 'g1') done(p);
      }
    });
  });
  intake.start();
  const p = await reached;
  assert.equal(p.canAskWhy, false);
  assert.equal(p.canSkip, true);
});
