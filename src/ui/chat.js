import { el } from './dom.js';

/** Renders the message log and the answer composer. Holds no intake logic. */
export function createChat(log, composer) {
  let typingEl = null;
  const scroll = () => { log.scrollTop = log.scrollHeight; };

  function message(m) {
    if (m.role === 'user') {
      log.appendChild(el('div', 'msg me', m.text));
    } else {
      const cls = { lead: 'bot lead', bridge: 'bot bridge' }[m.kind] || 'bot';
      const b = el('div', 'msg ' + cls, m.text);
      if (m.label) b.dataset.label = m.label;
      log.appendChild(b);
    }
    scroll();
  }

  function typing(on) {
    if (on && !typingEl) {
      typingEl = el('div', 'msg bot typing');
      typingEl.innerHTML = '<i></i><i></i><i></i>';
      typingEl.setAttribute('aria-label', 'Typing');
      log.appendChild(typingEl);
      scroll();
    } else if (!on && typingEl) {
      typingEl.remove();
      typingEl = null;
    }
    if (on) busy();
  }

  function card({ eyebrow, title, body }) {
    const c = el('div', 'done-card');
    c.appendChild(el('span', 'eyebrow', eyebrow));
    c.appendChild(el('b', null, title));
    if (body) c.appendChild(el('p', null, body));
    log.appendChild(c);
    scroll();
  }

  function busy() {
    composer.setAttribute('aria-busy', 'true');
  }

  /**
   * @param p        prompt from the engine
   * @param actions  { answer(a), whyAsk(), whyLabel, skipLabel }
   */
  function prompt(p, actions) {
    composer.replaceChildren();
    composer.removeAttribute('aria-busy');
    composer.dataset.prompt = p.id;
    const selected = new Set();

    if (p.hint) composer.appendChild(el('div', 'hint', p.hint));

    if (p.options.length) {
      const chips = el('div', 'chips');
      p.options.forEach((label, i) => {
        const b = el('button', 'chip', label);
        b.type = 'button';
        b.id = `chip-${p.id}-${i}`;
        if (p.multi) b.setAttribute('aria-pressed', 'false');
        b.onclick = () => {
          if (!p.multi) return submit({ labels: [label] });
          selected.has(label) ? selected.delete(label) : selected.add(label);
          b.setAttribute('aria-pressed', String(selected.has(label)));
          sync();
        };
        chips.appendChild(b);
      });
      composer.appendChild(chips);
    }

    let input = null;
    const send = el('button', 'send', p.multi ? 'Continue' : 'Send');
    send.type = 'button';
    send.id = 'send';
    if (p.input || p.multi) {
      const row = el('div', 'row');
      if (p.input) {
        input = el('input');
        input.id = 'free-text';
        input.type = 'text';
        input.autocomplete = 'off';
        input.placeholder = p.placeholder || 'Type here…';
        input.setAttribute('aria-label', 'Your answer');
        input.oninput = sync;
        input.onkeydown = (e) => { if (e.key === 'Enter') { e.preventDefault(); go(); } };
        row.appendChild(input);
      }
      row.appendChild(send);
      composer.appendChild(row);
    }
    send.onclick = go;

    const aux = el('div', 'aux');
    const link = (text, fn) => { const b = el('button', 'link', text); b.type = 'button'; b.onclick = fn; aux.appendChild(b); };
    if (p.skip) link(p.skip, () => submit({ skipped: true }));
    if (p.canAskWhy) link(actions.whyLabel, () => { busy(); actions.whyAsk(); });
    if (p.canSkip) link(actions.skipLabel, () => submit({ skipped: true }));
    if (aux.children.length) composer.appendChild(aux);

    sync();
    if (input && matchMedia('(pointer: fine)').matches && !actions.noFocus) input.focus();

    function sync() { send.disabled = !(selected.size || (input && input.value.trim())); }
    function go() {
      if (send.disabled) return;
      // Keep the on-screen order of picks.
      submit({ labels: p.options.filter((l) => selected.has(l)), text: input ? input.value : '' });
    }
    function submit(a) { busy(); actions.answer(a); }
  }

  function actionsRow(buttons) {
    composer.replaceChildren();
    composer.removeAttribute('aria-busy');
    delete composer.dataset.prompt;
    const row = el('div', 'row');
    buttons.forEach(({ text, primary, onClick }) => {
      const b = el('button', 'btn' + (primary ? ' primary' : ''), text);
      b.type = 'button';
      b.onclick = onClick;
      row.appendChild(b);
    });
    composer.appendChild(row);
    return row;
  }

  function clear() {
    log.replaceChildren();
    composer.replaceChildren();
    typingEl = null;
  }

  return { message, typing, prompt, card, actionsRow, clear, composer };
}
