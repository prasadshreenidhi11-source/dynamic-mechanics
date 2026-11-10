// Car colour picker: a smooth hue/tint on the hero (the scene is neutral black/grey,
// so only the yellow body and its glow change). The site accent follows the choice.
(() => {
  // f = [hue-rotate deg, saturate, brightness, contrast]; same four functions in every
  // entry so the browser can animate between them.
  const COLORS = [
    { name: 'Sun Yellow',   f: [0, 1, 1, 1],        ui: '#f5c400', sw: '#f5c400' },
    { name: 'Rosso Red',    f: [-50, 1.2, .95, 1.02], ui: '#ff3b3b', sw: '#d7191f' },
    { name: 'Arancio',      f: [-20, 1.1, 1, 1],    ui: '#ff8a1f', sw: '#ff7a1a' },
    { name: 'Verde',        f: [80, 1, .92, 1.02],  ui: '#34d27b', sw: '#22b862' },
    { name: 'Blu Electric', f: [172, 1.15, .95, 1.02], ui: '#4c8dff', sw: '#2f6bff' },
    { name: 'Viola',        f: [-128, 1.05, .95, 1.02], ui: '#a874ff', sw: '#8a4dff' },
    { name: 'Silver',       f: [0, 0, 1.3, 1],      ui: '#dfe3ea', sw: '#cfd4dc' },
    { name: 'Nero',         f: [0, 0, .58, 1.12],   ui: '#c9ccd2', sw: '#1b1b1d' },
  ];
  const root = document.documentElement;
  const wrap = document.getElementById('paintSwatches'), nameEl = document.getElementById('paintName');
  let idx = 0;
  try { const s = parseInt(localStorage.getItem('apex-color'), 10); if (s >= 0 && s < COLORS.length) idx = s; } catch (e) {}

  const css = f => `hue-rotate(${f[0]}deg) saturate(${f[1]}) brightness(${f[2]}) contrast(${f[3]})`;

  function apply(i, save) {
    idx = i; const c = COLORS[i];
    root.style.setProperty('--tint', css(c.f));
    root.style.setProperty('--gold', c.ui);
    nameEl.textContent = c.name;
    [...wrap.children].forEach((b, k) => { b.setAttribute('aria-pressed', String(k === i)); });
    if (save) { try { localStorage.setItem('apex-color', String(i)); } catch (e) {} }
  }

  COLORS.forEach((c, i) => {
    const b = document.createElement('button');
    b.type = 'button'; b.className = 'swatch'; b.style.setProperty('--c', c.sw);
    b.setAttribute('aria-label', c.name);
    b.addEventListener('click', () => apply(i, true));
    b.addEventListener('mouseenter', () => { nameEl.textContent = c.name; });
    b.addEventListener('mouseleave', () => { nameEl.textContent = COLORS[idx].name; });
    wrap.appendChild(b);
  });
  apply(idx, false);
})();
