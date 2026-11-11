/**
 * APEX - Right-to-Left Canvas Clipping Wipe Color Engine
 */
(() => {
  const COLORS = [
    { name: 'Sun Yellow',    f: [0, 1, 1, 1],          ui: '#f5c400', sw: '#f5c400' },
    { name: 'Rosso Red',     f: [-50, 1.2, .95, 1.02], ui: '#ff3b3b', sw: '#d7191f' },
    { name: 'Arancio',       f: [-20, 1.1, 1, 1],      ui: '#ff8a1f', sw: '#ff7a1a' },
    { name: 'Verde',         f: [80, 1, .92, 1.02],    ui: '#34d27b', sw: '#22b862' },
    { name: 'Blu Electric',  f: [172, 1.15, .95, 1.02],ui: '#4c8dff', sw: '#2f6bff' },
    { name: 'Viola',         f: [-128, 1.05, .95, 1.02],ui: '#a874ff', sw: '#8a4dff' },
    { name: 'Silver',        f: [0, 0, 1.3, 1],        ui: '#dfe3ea', sw: '#cfd4dc' },
    { name: 'Nero',          f: [0, 0, .58, 1.12],     ui: '#c9ccd2', sw: '#1b1b1d' },
  ];

  const root = document.documentElement;
  const wrap = document.getElementById('paintSwatches');
  const nameEl = document.getElementById('paintName');
  
  let idx = 0;
  try { 
    const s = parseInt(localStorage.getItem('apex-color'), 10); 
    if (s >= 0 && s < COLORS.length) idx = s; 
  } catch (e) {}

  let transitionProgress = 1.0;
  let isTransitioning = false;
  let targetIdx = idx;
  const wipeSpeed = 0.035; // Speed of right-to-left sweep

  const cssFilter = f => `hue-rotate(${f[0]}deg) saturate(${f[1]}) brightness(${f[2]}) contrast(${f[3]})`;

  function apply(i, save) {
    if (idx === i && !isTransitioning) return;
    
    targetIdx = i;
    transitionProgress = 0.0; // Start wipe from right (0) to left (1)
    isTransitioning = true;

    const c = COLORS[i];
    root.style.setProperty('--gold', c.ui);
    if (nameEl) nameEl.textContent = c.name;

    if (wrap) {
      [...wrap.children].forEach((wrapper, k) => { 
        const b = wrapper.querySelector('.swatch');
        if (b) b.setAttribute('aria-pressed', String(k === i)); 
      });
    }

    if (save) { 
      try { localStorage.setItem('apex-color', String(i)); } catch (e) {} 
    }
  }

  if (wrap) {
    wrap.innerHTML = '';

    COLORS.forEach((c, i) => {
      const wrapper = document.createElement('div');
      wrapper.className = 'swatch-wrapper';

      const b = document.createElement('button');
      b.type = 'button'; 
      b.className = 'swatch'; 
      b.style.setProperty('--c', c.sw);
      b.setAttribute('aria-label', c.name);
      b.setAttribute('aria-pressed', String(i === idx));

      const label = document.createElement('div');
      label.className = 'swatch-label';
      label.textContent = c.name;

      b.addEventListener('click', () => apply(i, true));
      b.addEventListener('mouseenter', () => { if (nameEl) nameEl.textContent = c.name; });
      b.addEventListener('mouseleave', () => { if (nameEl) nameEl.textContent = COLORS[targetIdx].name; });

      wrapper.appendChild(b);
      wrapper.appendChild(label);
      wrap.appendChild(wrapper);
    });
  }

  idx = targetIdx;
  root.style.setProperty('--tint', cssFilter(COLORS[idx].f));
  root.style.setProperty('--gold', COLORS[idx].ui);
  if (nameEl) nameEl.textContent = COLORS[idx].name;

  // Colour picker lives in the hero only
  const paint = document.getElementById('paint');
  const hero = document.getElementById('hero');
  if (paint && hero && 'IntersectionObserver' in window) {
    new IntersectionObserver(([e]) => paint.classList.toggle('away', !e.isIntersecting)).observe(hero);
  }

  window.apexColorEngine = {
    drawWithWipe(ctx, img, dx, dy, dw, dh, advance = true) {
      if (isTransitioning && advance) {
        transitionProgress += wipeSpeed;
        if (transitionProgress >= 1.0) {
          transitionProgress = 1.0;
          idx = targetIdx;
          isTransitioning = false;
          root.style.setProperty('--tint', cssFilter(COLORS[idx].f));
        }
      }

      // 1. Draw base frame (Current Color)
      ctx.save();
      ctx.filter = idx === 0 ? 'none' : cssFilter(COLORS[idx].f); // original Flow colours, untouched
      ctx.drawImage(img, 0, 0, img.width, img.height, dx, dy, dw, dh);
      ctx.restore();

      // 2. If transitioning, clip and draw target color sweeping from right to left
      if (isTransitioning) {
        const wipeWidth = dw * transitionProgress;
        const wipeX = dx + dw - wipeWidth;

        ctx.save();
        ctx.beginPath();
        ctx.rect(wipeX, dy, wipeWidth, dh);
        ctx.clip();

        ctx.filter = targetIdx === 0 ? 'none' : cssFilter(COLORS[targetIdx].f);
        ctx.drawImage(img, 0, 0, img.width, img.height, dx, dy, dw, dh);
        ctx.restore();
      }
    }
  };
})();