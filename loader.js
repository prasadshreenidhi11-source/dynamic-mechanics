// Smart loader (tracks real frame loading) + right-side progress rail.
(() => {
  if ('scrollRestoration' in history) history.scrollRestoration = 'manual';   // always start at the top
  scrollTo(0, 0);
  const root = document.documentElement;
  const loader = document.getElementById('loader');
  const count = document.getElementById('ldCount'), bar = document.getElementById('ldBar');
  const note = document.getElementById('ldNote'), actions = document.getElementById('ldActions');
  const t0 = performance.now();
  let shown = 0, done = false;

  // real progress = decoded hero frames (app.js) + fonts
  const real = () => {
    const f = typeof ready === 'number' && typeof FRAME_COUNT === 'number' ? ready / FRAME_COUNT : 0;
    return Math.min(1, f);
  };
  const fontsReady = document.fonts ? document.fonts.ready : Promise.resolve();
  let fontsOk = false; fontsReady.then(() => { fontsOk = true; });

  (function tick() {
    const minTime = Math.min(1, (performance.now() - t0) / 1400);        // never flash past
    const target = Math.min(real(), 0.3 + minTime * 0.7);
    shown += (target - shown) * 0.08;                                    // eased counter
    if (target - shown < 0.002) shown = target;
    const p = Math.round(shown * 100);
    count.textContent = p; bar.style.transform = `scaleX(${shown})`;
    if (!done && shown >= 0.995 && fontsOk) {
      done = true;
      note.textContent = 'Ready';
      actions.hidden = false; loader.classList.add('ready');
      document.getElementById('enter').focus({ preventScroll: true });
      return;
    }
    requestAnimationFrame(tick);
  })();

  function enter(withSound) {
    if (window.apexSound) window.apexSound.set(withSound);
    loader.classList.add('out');
    root.classList.remove('loading');
    root.classList.add('entered');
    setTimeout(() => loader.remove(), 1200);
  }
  document.getElementById('enter').addEventListener('click', () => enter(true));
  document.getElementById('enterQuiet').addEventListener('click', () => enter(false));

  // ---------- right rail ----------
  const rail = document.getElementById('rail'), list = document.getElementById('railList');
  const fill = document.getElementById('railFill'), dot = document.getElementById('railDot'), pct = document.getElementById('railPct');
  const sections = [['Intro', 'hero'], ['Models', 'models'], ['Performance', 'performance'], ['Experience', 'experience'], ['Contact', 'contact']]
    .map(([name, id]) => ({ name, el: document.getElementById(id) })).filter(s => s.el);
  const items = sections.map((s, i) => {
    const li = document.createElement('li'), b = document.createElement('button');
    b.type = 'button';
    const label = document.createElement('span'); label.textContent = s.name;
    b.append(label, document.createElement('i'));
    b.setAttribute('aria-label', `Go to ${s.name}`);
    b.addEventListener('click', () => s.el.scrollIntoView({ behavior: 'smooth' }));
    li.appendChild(b); list.appendChild(li); return { li, b, s };
  });

  let max = 1, pos = [];
  function measure() {
    max = Math.max(1, document.documentElement.scrollHeight - innerHeight);
    pos = sections.map(s => Math.min(1, (s.el.getBoundingClientRect().top + scrollY) / max));
    items.forEach((it, i) => { it.li.style.top = (pos[i] * 100) + '%'; });
  }
  let cur = 0;
  function update() {
    const p = Math.min(1, Math.max(0, scrollY / max));
    cur += (p - cur) * 0.14; if (Math.abs(p - cur) < 0.0005) cur = p;       // eased follow
    fill.style.height = (cur * 100) + '%'; dot.style.top = (cur * 100) + '%';
    pct.textContent = Math.round(cur * 100) + '%';
    let a = 0; pos.forEach((v, i) => { if (p >= v - 0.002) a = i; });
    items.forEach((it, i) => it.b.classList.toggle('on', i === a));
    requestAnimationFrame(update);
  }
  addEventListener('resize', measure); addEventListener('load', measure);
  new ResizeObserver(measure).observe(document.body);
  measure(); requestAnimationFrame(update);
})();
