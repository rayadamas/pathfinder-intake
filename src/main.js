import { createIntake, naturalPace } from './core/engine.js';
import { plan } from './core/plan.js';
import { summaryText } from './core/narrative.js';
import { SERVICES } from './config/services.js';
import { COPY } from './config/copy.js';
import { SAMPLE } from './config/sample.js';
import { $, el, toast } from './ui/dom.js';
import { createChat } from './ui/chat.js';
import { renderAvatar, attentionCount } from './ui/avatar.js';

/*
 * URL options (handy for demos and the screenshot script):
 *   ?sample            play the sample person on load
 *   &speed=instant     no typing delay
 *   &stopAt=uncover    stop the sample when this prompt appears (id or id:n for the nth time)
 *   &view=avatar       open the avatar tab on narrow screens
 *   &labels=off        hide P.U.S.H. stage labels
 */
const params = new URLSearchParams(location.search);
const chat = createChat($('log'), $('composer'));
const avatarPane = $('avatarPane');
const layout = $('layout');
const dot = $('avDot');

let intake = null;
let seen = 0;
let sample = null; // { script, stopAt, instant }

function start({ withSample = false } = {}) {
  intake?.dispose();
  chat.clear();
  seen = 0;
  dot.hidden = true;
  document.documentElement.dataset.state = 'running';

  const instant = params.get('speed') === 'instant';
  sample = withSample ? { script: structuredClone(SAMPLE), stopAt: parseStop(params.get('stopAt')), seen: {}, instant } : null;
  const pace = sample ? (instant ? () => 0 : () => 260) : naturalPace;

  intake = createIntake({
    pace,
    onMessage: chat.message,
    onTyping: chat.typing,
    onUpdate: update,
    onPrompt: prompt,
    onDone: done
  });
  intake.start();
}

function update(s) {
  renderAvatar(avatarPane, s);
  const n = attentionCount(s);
  if (layout.dataset.view === 'chat' && n > seen) {
    dot.hidden = false;
    dot.textContent = n - seen;
  }
}

function prompt(p) {
  chat.prompt(p, {
    answer: (a) => intake.answer(a),
    whyAsk: () => intake.whyAsk(),
    whyLabel: COPY.whyAsk,
    skipLabel: COPY.skip,
    noFocus: !!sample
  });
  if (sample) playSampleStep(p.id);
}

function done(s) {
  const p = plan(s);
  const first = p.now[0];
  chat.card({
    eyebrow: 'Team view',
    title: first ? `Start with ${SERVICES[first[0]].name.toLowerCase()}` : 'Keep the conversation open',
    body: first
      ? `Then ${p.now.slice(1).map(([k]) => SERVICES[k].name.toLowerCase()).join(' and ') || 'nothing else yet'}.` +
        (p.later.length ? ` Hold ${p.later.map(([k]) => SERVICES[k].name.toLowerCase()).join(', ')} for later.` : '')
      : 'Not enough signal to recommend a service yet.'
  });
  chat.actionsRow([
    { text: 'Copy summary for the team', primary: true, onClick: () => copySummary(s) },
    { text: 'Start a new intake', onClick: () => start() }
  ]);
  sample = null;
  document.documentElement.dataset.state = 'ready';
}

async function copySummary(s) {
  const text = summaryText(s);
  try {
    await navigator.clipboard.writeText(text);
    toast('Summary copied');
  } catch {
    const ta = el('textarea', 'fallback-copy');
    ta.value = text;
    ta.setAttribute('aria-label', 'Team summary');
    chat.composer.appendChild(ta);
    ta.select();
    toast('Select and copy the text below');
  }
}

/* ---------- sample person ---------- */
function parseStop(v) {
  if (!v) return null;
  const [id, n] = v.split(':');
  return { id, n: Number(n) || 1 };
}

function playSampleStep(id) {
  const run = intake;
  sample.seen[id] = (sample.seen[id] || 0) + 1;
  if (sample.stopAt && sample.stopAt.id === id && sample.stopAt.n === sample.seen[id]) {
    sample = null;
    document.documentElement.dataset.state = 'ready';
    return;
  }
  const next = sample.script[id]?.shift();
  if (!next) { sample = null; return; }
  setTimeout(() => {
    if (run !== intake) return;
    intake.answer({ labels: next.labels || [], text: next.text || '' });
  }, sample.instant ? 0 : 700);
}

/* ---------- chrome ---------- */
function view(v) {
  layout.dataset.view = v;
  $('tabChat').setAttribute('aria-selected', String(v === 'chat'));
  $('tabAvatar').setAttribute('aria-selected', String(v === 'avatar'));
  if (v === 'avatar' && intake) {
    seen = attentionCount(intake.state);
    dot.hidden = true;
  }
}

$('tabChat').onclick = () => view('chat');
$('tabAvatar').onclick = () => view('avatar');
$('resetBtn').onclick = () => start();
$('sampleBtn').onclick = () => start({ withSample: true });
$('labelsBtn').onclick = (e) => {
  const on = $('app').classList.toggle('show-labels');
  e.currentTarget.setAttribute('aria-pressed', String(on));
};

if (params.get('labels') === 'off') {
  $('app').classList.remove('show-labels');
  $('labelsBtn').setAttribute('aria-pressed', 'false');
}
if (params.get('view') === 'avatar') view('avatar');
if (params.get('speed') === 'instant') document.documentElement.classList.add('instant');
start({ withSample: params.has('sample') });
