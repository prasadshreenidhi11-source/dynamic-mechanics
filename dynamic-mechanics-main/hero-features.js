/* Hero extras: angle presets, live spec counters, colour + configure chip, mouse tilt */
(() => {
  const hero = document.getElementById('hero');
  const stage = hero && hero.querySelector('.stage');
  if (!stage) return;
  const clamp = (v, a = 0, b = 1) => Math.min(b, Math.max(a, v));
  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;

  // 1. angle presets
  const presets = [...document.querySelectorAll('#presets button')];
  presets.forEach(b => b.addEventListener('click', () => window.apexSpin && window.apexSpin.goTo(+b.dataset.f)));

  // 4. live spec counters follow scroll
  const nums = [...document.querySelectorAll('#heroSpecs b')];
  const progress = () => {
    const r = hero.getBoundingClientRect();
    return clamp(-r.top / Math.max(1, hero.offsetHeight - innerHeight));
  };

  // 5. colour + configure chip, carried into the enquiry form
  const nameEl = document.getElementById('paintName'), cfgText = document.getElementById('cfgText');
  const enq = document.getElementById('enqColour');
  const syncColour = () => {
    const n = (nameEl && nameEl.textContent.trim()) || 'Sun Yellow';
    if (cfgText) cfgText.textContent = n;
    if (enq) enq.value = n;
  };
  const sw = document.getElementById('paintSwatches');
  if (sw) sw.addEventListener('click', () => setTimeout(syncColour, 60));
  syncColour();

  // 6. gentle mouse tilt on the car and its labels
  const cv = document.getElementById('spinCanvas'), layer = document.getElementById('spinLayer');
  let tx = 0, ty = 0, cx = 0, cy = 0;
  if (!reduce && matchMedia('(pointer: fine)').matches) {
    stage.addEventListener('pointermove', e => { tx = (e.clientX / innerWidth - .5) * 2; ty = (e.clientY / innerHeight - .5) * 2; });
    stage.addEventListener('pointerleave', () => { tx = 0; ty = 0; });
  }

  function tick() {
    const p = progress();
    const k = clamp(p * 4);                                            // counters finish by 25% scroll
    nums.forEach(n => {
      const v = (+n.dataset.to) * k, d = +n.dataset.dec || 0;
      n.textContent = d ? v.toFixed(d) : Math.round(v);
    });
    if (window.apexSpin) {
      const f = window.apexSpin.frame(), N = window.apexSpin.N;
      presets.forEach(b => {
        let d = Math.abs(f - +b.dataset.f); d = Math.min(d, N - d);
        b.classList.toggle('on', d < 22);
      });
    }
    cx += (tx - cx) * 0.06; cy += (ty - cy) * 0.06;
    const px = Math.round(cx * -5), py = Math.round(cy * -3);   // whole pixels, no scaling: the picture is never resampled
    window.apexTilt = { x: px, y: py };
    const tl = document.getElementById('techlayer');
    if (layer) layer.style.translate = `${px}px ${py}px`;
    if (tl) tl.style.translate = `${px}px ${py}px`;
    requestAnimationFrame(tick);
  }
  requestAnimationFrame(tick);
})();
