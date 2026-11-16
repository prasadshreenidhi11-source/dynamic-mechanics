// APEX - Clean Complete Loader Script with Driving Car & Diesel Engine Audio
(() => {
  if ('scrollRestoration' in history) history.scrollRestoration = 'manual';
  scrollTo(0, 0);
  const root = document.documentElement;
  const loader = document.getElementById('loader');
  const count = document.getElementById('ldCount'), bar = document.getElementById('ldBar');
  const note = document.getElementById('ldNote'), actions = document.getElementById('ldActions');
  const t0 = performance.now();
  let shown = 0, done = false;

  // --- Diesel Engine Audio Setup (Max Volume) ---
  const dieselAudio = new Audio('assets/diesel-start.mp3');
  dieselAudio.volume = 1.0;
  dieselAudio.preload = 'auto';

  // Robust audio unlock & play trigger for browser autoplay policies
  const triggerAudio = () => {
    dieselAudio.play().then(() => {
      ['pointerdown', 'keydown', 'touchstart', 'click'].forEach(evt => {
        removeEventListener(evt, triggerAudio, true);
      });
    }).catch(() => {});
  };
  ['pointerdown', 'keydown', 'touchstart', 'click'].forEach(evt => {
    addEventListener(evt, triggerAudio, true);
  });
  // Try immediate auto-play on load
  dieselAudio.play().catch(() => {});

  // --- Driving Car Preloader Setup ---
  const ldBarContainer = bar ? bar.closest('.ld-bar') || bar.parentElement : document.querySelector('.ld-bar');
  if (ldBarContainer) {
    ldBarContainer.style.position = 'relative';
    ldBarContainer.style.overflow = 'visible';
    
    if (!ldBarContainer.querySelector('.loader-driving-car')) {
      const loaderCar = document.createElement('div');
      loaderCar.className = 'loader-driving-car';
      loaderCar.innerHTML = `
        <svg viewBox="0 0 20 10" width="24" height="14" style="display:block;">
          <path d="M3 7 L6 2 L14 2 L17 7 L18 8 L2 8 Z" fill="#ffffff" />
          <circle cx="5" cy="8" r="2" fill="#111" />
          <circle cx="15" cy="8" r="2" fill="#111" />
        </svg>
      `;
      ldBarContainer.appendChild(loaderCar);
    }
  }

  const real = () => {
    const f = typeof ready === 'number' && typeof FRAME_COUNT === 'number' ? ready / FRAME_COUNT : 0;
    return Math.min(1, f);
  };
  const fontsReady = document.fonts ? document.fonts.ready : Promise.resolve();
  let fontsOk = false; fontsReady.then(() => { fontsOk = true; });

  let lastT = performance.now();
  const MIN_MS = window.APEX_FAST ? 700 : 1400;   // shortest time the loader stays up
  (function tick() {
    const now = performance.now(), dt = Math.min(250, now - lastT); lastT = now;
    const minTime = Math.min(1, (now - t0) / MIN_MS);
    const target = Math.min(real(), 0.3 + minTime * 0.7);
    shown += (target - shown) * (1 - Math.exp(-dt / 120));   // time-based easing: same speed at 17fps or 120fps
    if (target - shown < 0.002) shown = target;
    const p = Math.round(shown * 100);
    
    if (count) count.textContent = p; 
    if (bar) bar.style.transform = `scaleX(${shown})`;

    const loaderCar = ldBarContainer ? ldBarContainer.querySelector('.loader-driving-car') : null;
    if (loaderCar) {
      loaderCar.style.left = `${shown * 100}%`;
    }

    if (!done && shown >= 0.995 && fontsOk) {
      done = true;
      
      // Smoothly fade out diesel audio when preloader finishes
      let fadeInterval = setInterval(() => {
        if (dieselAudio.volume > 0.05) {
          dieselAudio.volume = Math.max(0, dieselAudio.volume - 0.05);
        } else {
          dieselAudio.pause();
          dieselAudio.currentTime = 0;
          clearInterval(fadeInterval);
        }
      }, 50);

      if (note) note.textContent = 'Ready';
      if (actions) actions.hidden = false; 
      if (loader) loader.classList.add('ready');
      const enterBtn = document.getElementById('enter');
      if (enterBtn) enterBtn.focus({ preventScroll: true });
      return;
    }
    requestAnimationFrame(tick);
  })();

  function enter(withSound) {
    dieselAudio.pause();
    dieselAudio.currentTime = 0;
    if (window.apexSound) window.apexSound.set(withSound);
    if (loader) loader.classList.add('out');
    root.classList.remove('loading');
    root.classList.add('entered');
    setTimeout(() => { if (loader) loader.remove(); }, 1200);
  }
  
  const enterBtn = document.getElementById('enter');
  const enterQuietBtn = document.getElementById('enterQuiet');
  if (enterBtn) enterBtn.addEventListener('click', () => enter(true));
  if (enterQuietBtn) enterQuietBtn.addEventListener('click', () => enter(false));

  // --- Right Progress Rail & Miniature Car ---
  const rail = document.getElementById('rail'), list = document.getElementById('railList');
  const fill = document.getElementById('railFill'), dot = document.getElementById('railDot'), pct = document.getElementById('railPct');
  
  if (dot && !dot.querySelector('.mini-car')) {
    const carEl = document.createElement('div');
    carEl.className = 'mini-car';
    carEl.innerHTML = `
      <svg viewBox="0 0 20 10" width="22" height="12">
        <path d="M3 7 L6 2 L14 2 L17 7 L18 8 L2 8 Z" fill="#ffffff" />
        <circle cx="5" cy="8" r="2" fill="#111" />
        <circle cx="15" cy="8" r="2" fill="#111" />
      </svg>
    `;
    dot.appendChild(carEl);
  }

  const sections = [['Intro', 'hero'], ['Models', 'models'], ['Performance', 'performance'], ['Experience', 'experience'], ['Contact', 'contact']]
    .map(([name, id]) => ({ name, el: document.getElementById(id) })).filter(s => s.el);
  
  const items = sections.map((s, i) => {
    const li = document.createElement('li'), b = document.createElement('button');
    b.type = 'button';
    const label = document.createElement('span'); label.textContent = s.name;
    b.append(label, document.createElement('i'));
    b.setAttribute('aria-label', `Go to ${s.name}`);
    b.addEventListener('click', () => s.el.scrollIntoView({ behavior: 'smooth' }));
    li.appendChild(b); 
    if (list) list.appendChild(li); 
    return { li, b, s };
  });

  let max = 1, pos = [];
  function measure() {
    max = Math.max(1, document.documentElement.scrollHeight - innerHeight);
    pos = sections.map(s => Math.min(1, (s.el.getBoundingClientRect().top + scrollY) / max));
    items.forEach((it, i) => { it.li.style.top = (pos[i] * 100) + '%'; });
  }

  let cur = 0, lastScrollY = scrollY;
  function update() {
    const scrollDelta = scrollY - lastScrollY;
    lastScrollY = scrollY;

    const p = Math.min(1, Math.max(0, scrollY / max));
    cur += (p - cur) * 0.14; 
    if (Math.abs(p - cur) < 0.0005) cur = p;

    if (fill) fill.style.height = (cur * 100) + '%'; 
    if (dot) dot.style.top = (cur * 100) + '%';
    if (pct) pct.textContent = Math.round(cur * 100) + '%';

    const miniCar = dot ? dot.querySelector('.mini-car') : null;
    if (miniCar) {
      if (scrollDelta > 1) {
        miniCar.classList.add('moving-down');
        miniCar.classList.remove('moving-up');
      } else if (scrollDelta < -1) {
        miniCar.classList.add('moving-up');
        miniCar.classList.remove('moving-down');
      } else {
        miniCar.classList.remove('moving-down', 'moving-up');
      }
    }

    let a = 0; pos.forEach((v, i) => { if (p >= v - 0.002) a = i; });
    items.forEach((it, i) => it.b.classList.toggle('on', i === a));
    requestAnimationFrame(update);
  }

  addEventListener('resize', measure); 
  addEventListener('load', measure);
  if (document.body) new ResizeObserver(measure).observe(document.body);
  measure(); 
  requestAnimationFrame(update);
})();