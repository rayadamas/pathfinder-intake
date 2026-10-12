/**
 * Every sentence the app builds about a person is assembled here, and only
 * from state: their taps, their typed words, and approved copy. Nothing in
 * this file invents a fact.
 */
import { SERVICES } from '../config/services.js';
import { SHOW_VALUE } from '../config/push.js';
import { COPY } from '../config/copy.js';
import { plan } from './plan.js';

const lower = (k) => SERVICES[k].name.toLowerCase();

export function summaryLine(s) {
  const f = s.facts;
  const bits = [];
  if (f.work) bits.push(f.work + (f.tenure ? ', ' + f.tenure : ''));
  if (f.home) bits.push(f.home === 'Owns' ? 'Owns' + (f.stay ? ', staying ' + f.stay.toLowerCase() : '') : f.home);
  if (f.hh) bits.push(f.hh.join(', '));
  return bits.join(' · ');
}

/** The playback the person confirms before any value is shown. */
export function recapText(s) {
  const lines = [COPY.recap.intro];
  const line = summaryLine(s);
  if (line) lines.push('• ' + line);
  if (s.priority) lines.push('• Biggest difference right now: ' + s.priority);
  if (s.wants.length) lines.push('• You want: ' + s.wants.join('; '));
  if (s.blocks.length) lines.push('• In the way: ' + s.blocks.join('; '));
  if (lines.length === 1) lines.push('• ' + COPY.recap.empty);
  lines.push(COPY.recap.ask);
  return lines.join('\n');
}

/** Show value: why we'd start where we would, quoting their own answers. */
export function valueText(s) {
  const p = plan(s);
  if (!p.now.length) return COPY.value.none;
  const [k] = p.now[0];
  const said = [...new Set((s.evidence[k] || []).map((e) => e.said).filter(Boolean))].slice(0, 2);
  let t = `Here's why we'd start with ${lower(k)}: you told us ${said.map((x) => `"${x}"`).join(' and ')}.`;
  if (p.now[1]) {
    const [k2] = p.now[1];
    const e2 = (s.evidence[k2] || []).find((e) => e.said);
    if (e2) t += ` After that, ${lower(k2)}, because you said "${e2.said}".`;
  }
  return `${t} ${COPY.value.tail}`;
}

/** Show value after a hesitation: approved reassurance plus one line in their words. */
export function showValueFor(missing, s) {
  const want = s.priority || s.wants[0];
  const block = s.blocks[0];
  let tie = '';
  if (missing === 'Urgency' && block) tie = ` You did mention "${block.toLowerCase()}", so we'd rather that not sit without a plan.`;
  else if (want) tie = ` The only reason to keep going is what you told us you want: "${want}".`;
  return SHOW_VALUE[missing] + tie;
}

export function holdPrompt(s) {
  const p = plan(s);
  return p.now.length ? COPY.hold.withService(lower(p.now[0][0])) : COPY.hold.withoutService;
}

export function nextStepLine(n) {
  if (!n) return '';
  return n.type === 'call'
    ? `20-minute call · ${n.when}${n.how ? ' · confirm by ' + n.how.toLowerCase() : ''}`
    : `Check back ${n.when.toLowerCase()}`;
}

/** Plain-text handoff for the team, with evidence for every recommendation. */
export function summaryText(s) {
  const p = plan(s);
  const L = [`Intake summary: ${s.name || 'Unnamed'}`];
  const line = summaryLine(s);
  if (line) L.push(line);
  if (s.lead) L.push(`Opened with: ${s.lead}`);
  if (s.priority) L.push(`Top priority: ${s.priority}`);
  if (s.wants.length) L.push(`Wants: ${s.wants.join('; ')}`);
  if (s.blocks.length) L.push(`In the way: ${s.blocks.join('; ')}`);
  if (p.now.length) {
    L.push('Relevant now: ' + p.now.map(([k]) =>
      `${SERVICES[k].name} (evidence: ${(s.evidence[k] || []).slice(0, 2).map((e) => `"${e.said}"`).join(', ')})`).join('; '));
  }
  if (p.later.length) L.push('Later follow-up: ' + p.later.map(([k]) => `${SERVICES[k].name} (${p.notes[k]})`).join('; '));
  if (s.hesitations.length) {
    L.push('Hesitations (P.U.S.H.): ' + s.hesitations.map((h) => `missing ${h.missing}, said "${h.said}", ${h.outcome}`).join('; '));
  }
  const open = s.asks.filter((x) => !x.a);
  if (open.length) L.push('Questions for the team: ' + open.map((x) => `"${x.q}"`).join(' '));
  L.push(`Playback: ${s.recap}${s.corrections.length ? ' (' + s.corrections.map((c) => `"${c}"`).join(' ') + ')' : ''}`);
  if (s.nextStep) L.push(`Next step: ${nextStepLine(s.nextStep)}`);
  if (s.quotes.length) L.push('In their words: ' + s.quotes.map((q) => `"${q.q}"`).join(' '));
  return L.join('\n');
}

/** The grounding checklist shown to the team. */
export function groundingChecks(s) {
  const keys = Object.keys(s.scores);
  const allCited = keys.length > 0 && keys.every((k) => (s.evidence[k] || []).every((e) => e.said));
  const open = s.asks.filter((x) => !x.a).length;
  return [
    { ok: allCited, text: 'Every recommendation cites what they said' },
    { ok: open === 0, text: open ? `${open} open question${open > 1 ? 's' : ''} routed to the team, not guessed` : 'No unanswered questions' },
    { ok: s.recap !== 'pending', text: { pending: 'Playback not confirmed yet', confirmed: 'They confirmed the playback', corrected: 'They corrected the playback; picture updated' }[s.recap] },
    { ok: !!s.nextStep, text: s.nextStep ? 'Next step held' : 'No next step held yet' }
  ];
}
