/**
 * The conversation engine. No DOM: it emits messages and prompts through
 * callbacks and takes answers back, so the browser UI, the tests, and the
 * screenshot script all drive the same code.
 *
 *   const intake = createIntake({ onMessage, onPrompt, onTyping, onUpdate, onDone, pace });
 *   await intake.start();
 *   await intake.answer({ labels: ['We own'] });   // or { text }, or { skipped: true }
 *   await intake.whyAsk();
 *   intake.dispose();
 */
import { QUESTIONS, opt } from '../config/questions.js';
import { TOPICS } from '../config/topics.js';
import { STAGES, PACIFY, UNCOVER, HOLD_AFTER_HESITATION } from '../config/push.js';
import { ROUTED_TO_TEAM } from '../config/faq.js';
import { COPY } from '../config/copy.js';
import { createState, applyOption, applyFreeText } from './state.js';
import { classify, findFaq, guessMissing } from './classify.js';
import { recapText, valueText, showValueFor, holdPrompt } from './narrative.js';

const noop = () => {};
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
export const naturalPace = (text) => 480 + Math.min(text.length * 6, 700);

export function createIntake({
  onMessage = noop,   // ({ role: 'bot'|'user', kind, text, stage, label, title, body })
  onPrompt = noop,    // ({ id, options, multi, input, placeholder, hint, skip, canAskWhy, canSkip })
  onTyping = noop,    // (bool)
  onUpdate = noop,    // (state)
  onDone = noop,      // (state)
  pace = naturalPace  // (text) -> ms to "type"
} = {}) {
  const s = createState();
  let disposed = false;
  let current = null; // { id, def, options }

  /* Control prompts: the playback check, next-step hold, and the P.U.S.H. loop. */
  const CONTROL = {
    recap: {
      stage: 'U', label: COPY.recap.label, input: true, noIntercept: true, placeholder: COPY.recap.placeholder,
      text: () => recapText(s),
      options: [opt(COPY.recap.yes), opt(COPY.recap.no)],
      handle: async (a) => {
        if (a.text) { correct(a.text); return showValue(); }
        if (a.opts[0]?.label === COPY.recap.yes) { s.recap = 'confirmed'; update(); return showValue(); }
        return ask('fix');
      }
    },
    fix: {
      stage: 'U', input: true, noIntercept: true, placeholder: COPY.fix.placeholder,
      text: () => COPY.fix.ask,
      handle: async (a) => {
        if (a.text) correct(a.text); else s.recap = 'confirmed';
        return showValue();
      }
    },
    hold: {
      stage: 'H',
      text: () => holdPrompt(s),
      options: [opt(COPY.hold.yes), opt(COPY.hold.later), opt(COPY.hold.no)],
      handle: async (a) => {
        const l = a.opts[0]?.label;
        if (l === COPY.hold.yes) return ask('when');
        if (l === COPY.hold.later) return ask('later');
        return hesitate(a.text || l || COPY.hold.no, 'hold');
      }
    },
    when: {
      stage: 'H', text: () => COPY.when.ask, options: COPY.when.options.map((l) => opt(l)),
      handle: async (a) => { s.nextStep = { type: 'call', when: a.opts[0]?.label || a.text }; return ask('how'); }
    },
    how: {
      stage: 'H', text: () => COPY.how.ask, options: COPY.how.options.map((l) => opt(l)),
      handle: async (a) => { s.nextStep.how = a.opts[0]?.label || a.text; return finish(); }
    },
    later: {
      stage: 'H', text: () => COPY.later.ask, options: COPY.later.options.map((l) => opt(l)),
      handle: async (a) => { s.nextStep = { type: 'check-in', when: a.opts[0]?.label || a.text }; return finish(); }
    },

    // P.U.S.H.: Uncover what's missing
    uncover: {
      stage: 'U', input: true, noIntercept: true, placeholder: UNCOVER.placeholder,
      text: () => UNCOVER.ask,
      options: UNCOVER.options.map((o) => opt(o.label, [], { missing: o.missing })),
      handle: async (a) => {
        const missing = a.opts[0]?.missing || guessMissing(a.text);
        const ctx = s.pushContext;
        ctx.hesitation = { missing, said: ctx.trigger, at: where(ctx.resume), outcome: 'in progress' };
        s.hesitations.push(ctx.hesitation);
        update();
        // P.U.S.H.: Show value, tied to their own words
        if (!(await say(showValueFor(missing, s), { stage: 'S' }))) return;
        return ask('resume');
      }
    },
    // P.U.S.H.: Hold the next step
    resume: {
      stage: 'H',
      text: () => holdSet().ask,
      options: () => holdSet().options.map((o) => opt(o.label, [], { go: o.go, outcome: o.outcome })),
      handle: async (a) => {
        const choice = a.opts[0] || holdSet().options[0];
        const ctx = s.pushContext;
        if (ctx.hesitation) ctx.hesitation.outcome = choice.outcome;
        update();
        if (choice.go === 'resume') return ask(ctx.resume);
        if (choice.go === 'skip') {
          s.current = ctx.resume;
          return advance(QUESTIONS[ctx.resume], { opts: [], text: '', skipped: true });
        }
        return ask(choice.go);
      }
    }
  };

  const def = (id) => QUESTIONS[id] || CONTROL[id];
  const holdSet = () => s.pushContext?.resume === 'hold' ? HOLD_AFTER_HESITATION.atNextStep : HOLD_AFTER_HESITATION.midIntake;
  const where = (id) => QUESTIONS[id]?.topic ? TOPICS[QUESTIONS[id].topic].label : (id === 'hold' ? 'Next step' : 'Opening');
  const optionsFor = (d) => (typeof d.options === 'function' ? d.options(s) : d.options) || [];
  const update = () => onUpdate(s);

  async function say(text, { kind = 'bot', stage = null, label = null } = {}) {
    onTyping(true);
    const ms = pace(text);
    if (ms > 0) await sleep(ms);
    onTyping(false);
    if (disposed) return false;
    if (stage) { s.stage = stage; s.stageCounts[stage]++; }
    onMessage({ role: 'bot', kind, text, stage, label: stage ? (label || `${stage} · ${STAGES[stage].name}`) : null });
    update();
    return true;
  }

  async function ask(id, { silent = false } = {}) {
    const d = def(id);
    s.current = id;
    if (!silent && !(await say(d.text(s), { kind: d.lead ? 'lead' : 'bot', stage: d.stage || 'U', label: d.label }))) return;
    if (disposed) return;
    const options = optionsFor(d);
    current = { id, def: d, options };
    onPrompt({
      id,
      options: options.map((o) => o.label),
      multi: !!d.multi,
      input: !!d.input,
      placeholder: d.placeholder || '',
      hint: d.hint || (d.multi ? 'Pick as many as fit, then continue.' : ''),
      skip: d.skip || '',
      canAskWhy: !!d.topic && s.whyShown !== id,
      canSkip: !!d.topic && s.whyShown === id
    });
  }

  async function answer({ labels = [], text = '', skipped = false } = {}) {
    if (!current || disposed) return;
    const { id, def: d, options } = current;
    current = null;
    const opts = labels.map((l) => options.find((o) => o.label === l)).filter(Boolean);
    text = (text || '').trim();
    const a = { opts, text, skipped };

    const shown = [...opts.map((o) => o.label), text].filter(Boolean).join(' · ') || (skipped ? (d.skip || COPY.skip) : '');
    if (shown) onMessage({ role: 'user', text: shown });

    // Guardrails run before an answer is recorded.
    if (text && !opts.length && !d.noIntercept) {
      const kind = classify(text);
      if (kind === 'objection') return hesitate(text, id);
      if (kind === 'question') return answerQuestion(text, id);
    }
    if (d.handle) return d.handle(a);

    if (skipped && d.topic) s.skips.push(TOPICS[d.topic].label);
    opts.forEach((o) => applyOption(s, o));
    if (text) {
      if (d.onText) d.onText(text, s);
      else applyFreeText(s, text, d.topic ? TOPICS[d.topic].label : (id === 'open' ? 'Opening' : 'Closing'));
    }
    if (d.after) d.after(a, s);
    if (d.topic) s.covered.add(d.topic);
    update();

    const ack = d.ack && !skipped ? d.ack(a, s) : null;
    const freeAck = text && !d.onText && id !== 'close' ? COPY.freeTextAck : null;
    if (ack || freeAck) { if (!(await say(ack || freeAck, { stage: 'P' }))) return; }
    return advance(d, a);
  }

  async function advance(d, a) {
    let next = d.next ? d.next(a, s) : null;
    if (Array.isArray(next)) { s.pending.unshift(...next.slice(1)); next = next[0]; }
    if (!next && s.pending.length) next = s.pending.shift();
    if (next) return ask(next);
    if (s.current === 'close') return ask('recap');
    if (s.topicIndex < s.order.length) {
      const t = s.order[s.topicIndex++];
      if (!(await say(TOPICS[t].bridge, { kind: 'bridge' }))) return;
      return ask(TOPICS[t].entry);
    }
    return ask('close');
  }

  /** They asked us something. Answer only from approved facts; otherwise route it. */
  async function answerQuestion(text, resumeId) {
    const hit = findFaq(text);
    s.asks.push({ q: text, a: hit ? hit.answer : null, faq: hit ? hit.id : null });
    const ok = await say(hit ? hit.answer : ROUTED_TO_TEAM, { stage: 'P', label: hit ? COPY.faqLabel : COPY.routedLabel });
    if (!ok) return;
    return ask(resumeId);
  }

  /** P.U.S.H.: Pacify, then Uncover. Show value and Hold follow in the control prompts. */
  async function hesitate(trigger, resumeId) {
    s.pushContext = { trigger, resume: resumeId, hesitation: null };
    const line = PACIFY.find((p) => p.match.test(trigger)).line;
    if (!(await say(line, { stage: 'P' }))) return;
    return ask('uncover');
  }

  async function whyAsk() {
    if (!current || disposed || !current.def.topic) return;
    const { id, def: d } = current;
    current = null;
    onMessage({ role: 'user', text: COPY.whyAsk });
    s.whyShown = id;
    if (!(await say(`${TOPICS[d.topic].why} ${COPY.whySkip}`, { stage: 'P' }))) return;
    return ask(id, { silent: true });
  }

  function correct(text) {
    s.corrections.push(text);
    s.recap = 'corrected';
    applyFreeText(s, text, 'Correction', ' (correction)');
    update();
  }

  async function showValue() {
    if (s.recap === 'corrected' && !(await say(COPY.fix.done, { stage: 'P' }))) return;
    if (!(await say(valueText(s), { stage: 'S', label: COPY.value.label }))) return;
    return ask('hold');
  }

  async function finish() {
    s.done = true;
    const n = s.nextStep;
    const bye = n?.type === 'call' ? COPY.finishCall(s.name, n.when, n.how) : COPY.finishLater(s.name, n?.when);
    if (!(await say(bye, { stage: 'H' }))) return;
    onDone(s);
  }

  return {
    state: s,
    start: () => { update(); return ask('name'); },
    answer,
    whyAsk,
    dispose: () => { disposed = true; current = null; },
    get prompt() { return current ? current.id : null; }
  };
}
