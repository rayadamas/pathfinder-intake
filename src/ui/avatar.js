/**
 * The team-facing avatar: a working picture of the person, rebuilt from
 * state on every update.
 */
import { el } from './dom.js';
import { SERVICES } from '../config/services.js';
import { TOPICS, TOPIC_KEYS } from '../config/topics.js';
import { STAGES } from '../config/push.js';
import { plan, leadService } from '../core/plan.js';
import { summaryLine, nextStepLine, groundingChecks } from '../core/narrative.js';

const SVG = 'http://www.w3.org/2000/svg';

function ring(s) {
  const svg = document.createElementNS(SVG, 'svg');
  svg.setAttribute('width', '84');
  svg.setAttribute('height', '84');
  svg.setAttribute('viewBox', '0 0 84 84');
  svg.setAttribute('aria-hidden', 'true');
  const cx = 42, cy = 42, r = 36, seg = 360 / TOPIC_KEYS.length, gap = 8;
  const pt = (a) => [cx + r * Math.cos((a - 90) * Math.PI / 180), cy + r * Math.sin((a - 90) * Math.PI / 180)];
  TOPIC_KEYS.forEach((k, i) => {
    const [x0, y0] = pt(i * seg + gap / 2);
    const [x1, y1] = pt((i + 1) * seg - gap / 2);
    const p = document.createElementNS(SVG, 'path');
    p.setAttribute('d', `M${x0.toFixed(2)} ${y0.toFixed(2)} A${r} ${r} 0 0 1 ${x1.toFixed(2)} ${y1.toFixed(2)}`);
    p.setAttribute('fill', 'none');
    p.setAttribute('stroke-width', '7');
    p.setAttribute('stroke-linecap', 'round');
    p.setAttribute('stroke', s.covered.has(k) ? 'var(--accent)' : 'var(--line)');
    svg.appendChild(p);
  });
  const c = document.createElementNS(SVG, 'circle');
  c.setAttribute('cx', cx); c.setAttribute('cy', cy); c.setAttribute('r', '26'); c.setAttribute('fill', 'var(--surface-2)');
  svg.appendChild(c);
  const t = document.createElementNS(SVG, 'text');
  t.setAttribute('x', cx); t.setAttribute('y', cy + 7); t.setAttribute('text-anchor', 'middle');
  t.setAttribute('fill', 'var(--ink)'); t.setAttribute('font-weight', '700'); t.setAttribute('font-size', '20');
  t.setAttribute('font-family', 'Bricolage Grotesque, system-ui, sans-serif');
  t.textContent = s.name ? s.name[0].toUpperCase() : '?';
  svg.appendChild(t);
  return svg;
}

function section(title, body) {
  const s = el('div', 'sec');
  s.appendChild(el('h3', null, title));
  s.appendChild(body);
  return s;
}

function serviceRow(s, [k, v], p, later) {
  const d = el('div', 'svc' + (later ? ' later' : ''));
  const top = el('div', 'svc-top');
  top.appendChild(el('span', 'svc-name', SERVICES[k].name));
  top.appendChild(el('span', 'svc-score', `${v} pts`));
  d.appendChild(top);
  const bar = el('div', 'bar');
  const fill = el('i');
  fill.style.width = Math.min(100, (v / p.max) * 100) + '%';
  bar.appendChild(fill);
  d.appendChild(bar);
  if (later) d.appendChild(el('div', 'note', p.notes[k]));
  const ul = el('ul', 'why');
  (s.evidence[k] || []).slice(0, later ? 1 : 3).forEach((e) => {
    const li = el('li', null, e.why);
    if (e.said) li.appendChild(el('span', 'said', ` · said “${e.said.length > 60 ? e.said.slice(0, 57) + '…' : e.said}”`));
    ul.appendChild(li);
  });
  d.appendChild(ul);
  return d;
}

/** Number of items that would be new to someone who last looked at `seen`. */
export function attentionCount(s) {
  return plan(s).now.length + s.wants.length + s.blocks.length;
}

export function renderAvatar(root, s) {
  root.replaceChildren();

  const head = el('div', 'av-head');
  head.appendChild(ring(s));
  const who = el('div');
  who.appendChild(el('p', 'av-name', s.name || 'New conversation'));
  who.appendChild(el('p', 'av-line', summaryLine(s) || 'The avatar fills in as the conversation goes. It is a working picture, not a label.'));
  head.appendChild(who);
  root.appendChild(head);

  const legend = el('div', 'legend');
  TOPIC_KEYS.forEach((k) => legend.appendChild(el('span', s.covered.has(k) ? 'on' : '', (s.covered.has(k) ? '● ' : '○ ') + TOPICS[k].label)));
  root.appendChild(legend);

  const push = el('div', 'push');
  push.setAttribute('aria-label', 'P.U.S.H. stage');
  Object.entries(STAGES).forEach(([k, v]) => {
    const c = el('div', s.stage === k ? 'on' : '');
    c.title = v.purpose;
    c.appendChild(el('b', null, k));
    c.appendChild(el('span', null, v.name));
    c.appendChild(el('em', null, `${s.stageCounts[k]} turn${s.stageCounts[k] === 1 ? '' : 's'}`));
    push.appendChild(c);
  });
  root.appendChild(push);

  const p = plan(s);
  if (p.now.length) {
    const [k] = p.now[0];
    const box = el('div', 'next');
    box.appendChild(el('span', 'eyebrow', 'Best next conversation'));
    box.appendChild(el('b', null, SERVICES[k].name));
    box.appendChild(el('p', null, (s.evidence[k] || []).slice(0, 2).map((e) => e.why).join('. ') + '.'));
    if (s.lead && leadService(s) !== k && s.covered.size >= 2) {
      box.appendChild(el('p', 'shift', `Opened with ${s.lead}. The fuller picture points to ${SERVICES[k].name.toLowerCase()} first.`));
    }
    if (s.nextStep) box.appendChild(el('p', 'shift', 'Held: ' + nextStepLine(s.nextStep)));
    root.appendChild(box);
  }

  const wants = el('div', 'tags');
  if (s.priority) wants.appendChild(el('span', 'tag', '★ ' + s.priority));
  s.wants.forEach((w) => wants.appendChild(el('span', 'tag', w)));
  root.appendChild(section('What they want', wants.children.length ? wants : el('p', 'empty', 'Not heard yet.')));

  const blocks = el('div', 'tags');
  s.blocks.forEach((b) => blocks.appendChild(el('span', 'tag block', b)));
  root.appendChild(section('What\'s in the way', s.blocks.length ? blocks : el('p', 'empty', 'Nothing named yet.')));

  const now = el('div');
  p.now.forEach((x) => now.appendChild(serviceRow(s, x, p, false)));
  root.appendChild(section('Relevant now', p.now.length ? now : el('p', 'empty', 'Still listening. No service has earned a spot yet.')));

  if (p.later.length) {
    const later = el('div');
    p.later.forEach((x) => later.appendChild(serviceRow(s, x, p, true)));
    root.appendChild(section('Save for a later follow-up', later));
  }

  if (s.hesitations.length) {
    const ul = el('ul', 'list');
    s.hesitations.forEach((h) => {
      const li = el('li');
      li.appendChild(el('span', 'pill', 'Missing ' + h.missing));
      li.appendChild(document.createTextNode(`“${h.said}”`));
      li.appendChild(el('small', null, `During ${h.at.toLowerCase()} · ${h.outcome}`));
      ul.appendChild(li);
    });
    root.appendChild(section('Hesitations · P.U.S.H.', ul));
  }

  if (s.asks.length) {
    const ul = el('ul', 'list');
    s.asks.forEach((x) => {
      const li = el('li');
      li.appendChild(el('span', x.a ? 'pill ok' : 'pill', x.a ? 'Answered' : 'For the team'));
      li.appendChild(document.createTextNode(`“${x.q}”`));
      if (x.a) li.appendChild(el('small', null, 'From approved facts, not generated'));
      ul.appendChild(li);
    });
    root.appendChild(section('Their questions', ul));
  }

  const checks = el('ul', 'checks');
  groundingChecks(s).forEach((c) => checks.appendChild(el('li', c.ok ? 'ok' : '', c.text)));
  root.appendChild(section('Grounding checks', checks));

  const f = s.facts;
  const rows = [['Work', f.work], ['Tenure', f.tenure], ['Field', f.field], ['Home', f.home], ['Staying', f.stay], ['Household', f.hh && f.hh.join(', ')]]
    .filter((r) => r[1]);
  if (s.skips.length) rows.push(['Skipped', s.skips.join(', ')]);
  if (rows.length) {
    const dl = el('dl', 'facts');
    rows.forEach(([a, b]) => { dl.appendChild(el('dt', null, a)); dl.appendChild(el('dd', null, b)); });
    root.appendChild(section('Profile', dl));
  }

  if (s.quotes.length) {
    const q = el('div');
    s.quotes.forEach((x) => q.appendChild(el('p', 'quote', `“${x.q}”`)));
    root.appendChild(section('In their words', q));
  }
}
