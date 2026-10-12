# Customizing Pathfinder

All of your content lives in `src/config/`. Run `npm test` after any change. The tests play the sample person through the whole intake and check that every guard still holds.

## Rewrite the approved answers

Open `src/config/faq.js`. Each entry has an `id`, a `match` pattern, and the exact `answer` text:

```js
{
  id: 'cost',
  match: /cost|price|fee|charge|free|pay for/i,
  answer: 'The first conversation is free. After that, pricing depends on the service, and we confirm it in writing before any work starts.'
}
```

Keep answers short and factual. If you can't answer a question without hedging, leave it out of this list. It will then go to your team instead of getting a weak answer.

## Add a question

Questions belong to a topic and are linked by `next`. To ask renters how long their lease runs, add the question:

```js
lease: {
  topic: 'home',
  text: () => 'How long is your current lease?',
  options: [
    opt('Month to month', [['homebuy', 1, 'Flexible on timing']], { facts: { lease: 'Month to month' } }),
    opt('Six months or less'),
    opt('A year or more')
  ]
}
```

Then route to it from `h1`:

```js
next: (a, s) => s.facts.home === 'Owns' ? 'h2' : s.facts.home === 'Rents' ? 'lease' : null
```

Each entry in `points` is `[serviceKey, points, reason]`. The reason is what the team sees, and the option's label is automatically stored as the evidence.

## Add a service

1. Add it to `src/config/services.js`.
2. Award it points from options in `questions.js`, and from keywords in `keywords.js` if free text should count.
3. If it only applies to some people, add a rule in `src/config/rules.js`:

```js
if (f.work !== 'Self-employed') exclude.push('payroll');
```

## Defer instead of exclude

Use `later` when a service is relevant but the timing is wrong. The note appears on the team view:

```js
if (scores.invest && f.work === 'Between roles') later.invest = 'Once income is steady';
```

## Tune P.U.S.H.

`src/config/push.js` holds:

- `OBJECTION_PATTERN`: what counts as hesitation
- `PACIFY`: the first line back, matched on what they said
- `UNCOVER.options`: the four "what's behind that" choices
- `SHOW_VALUE`: the reassurance for each missing ingredient. The engine adds one line quoting the person's own goal or obstacle.
- `HOLD_AFTER_HESITATION`: the options for what happens next

## Change the sample person

`src/config/sample.js` maps question ids to answers, used in order. If you add or rename questions, update it so `npm test` and `npm run screenshots` still run all the way through.
