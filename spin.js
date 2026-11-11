/* Hero: scroll takes the car from closed to open (frames_hd3). Once open, the user drags it through a full 360 (frames_360_ll). */
(() => {
  const sec = document.getElementById('hero');
  const cv = document.getElementById('spinCanvas');
  if (!sec || !cv) return;
  const stage = sec.querySelector('.stage');
  const layer = document.getElementById('spinLayer');
  const svg = document.getElementById('spinLines');
  const hint = document.getElementById('hint');
  const bar = document.getElementById('spinLoadBar');
  const loadEl = document.getElementById('spinLoad');
  const ctx = cv.getContext('2d');
  const pad = (i, n) => String(i + 1).padStart(n, '0');

  const OPEN_AT = 0.9;                       // scroll progress where the car is fully open and rotation unlocks
  const A = makeSet(190, i => `frames_hd3/f_${pad(i, 4)}.webp`, 24);        // closed -> open
  const B = makeSet(380, i => `frames_360_ll/t_${pad(i, 4)}.webp`, 30);     // open car, full turn
  window.FRAME_COUNT = A.N + B.N; window.ready = 0;                          // the loader reads these

  let loaded = 0, started = false;
  let pos = 0, vel = 0, dragging = false, lastX = 0, visible = false, target = null, mode = 'scrub';

  /* ---- frame sets: keep compressed files in memory, decode a window around the current frame ---- */
  function makeSet(N, url, WIN) {
    const blobs = new Array(N), bmp = new Map(), pending = new Set();
    return {
      N, blobs, url,
      decode(c) {
        for (let d = -WIN; d <= WIN; d++) {
          const i = ((c + d) % N + N) % N;
          if (bmp.has(i) || pending.has(i) || !blobs[i]) continue;
          pending.add(i);
          createImageBitmap(blobs[i]).then(b => { pending.delete(i); bmp.set(i, b); }).catch(() => pending.delete(i));
        }
        for (const [i, b] of bmp) {
          let d = Math.abs(i - c); d = Math.min(d, N - d);
          if (d > WIN + 20) { b.close(); bmp.delete(i); }
        }
      },
      get(i) { return bmp.get(i); },
      nearest(i) {
        for (let d = 0; d < 40; d++) { const a = bmp.get(((i - d) % N + N) % N) || bmp.get((i + d) % N); if (a) return a; }
        return null;
      },
    };
  }

  function load() {
    if (started) return; started = true;
    const jobs = [];
    for (let i = 0; i < A.N; i++) jobs.push([A, i]);
    for (let i = 0; i < B.N; i++) jobs.push([B, i]);        // the opening sequence loads first
    let next = 0;
    const worker = async () => {
      while (next < jobs.length) {
        const [s, i] = jobs[next++];
        try { s.blobs[i] = await (await fetch(s.url(i))).blob(); } catch (e) {}
        loaded++; window.ready = loaded; bar.style.width = (loaded / jobs.length * 100) + '%';
        if (loaded === jobs.length) loadEl.classList.add('done');
      }
    };
    for (let k = 0; k < 6; k++) worker();
  }
  new IntersectionObserver(([e]) => { if (e.isIntersecting) load(); }, { rootMargin: '1200px 0px' }).observe(sec);
  new IntersectionObserver(([e]) => { visible = e.isIntersecting; }, { threshold: 0.02 }).observe(sec);

  /* ---- labels that belong to the rotating view (shown by angle) ---- */
  const techs = [...layer.querySelectorAll('.stech')];
  const NS = 'http://www.w3.org/2000/svg';
  const lines = techs.map(() => { const l = document.createElementNS(NS, 'line'); l.setAttribute('pathLength', '1'); svg.appendChild(l); return l; });
  function size() {
    const dpr = Math.min(devicePixelRatio || 1, 2);
    cv.width = Math.round(stage.clientWidth * dpr);
    cv.height = Math.round(stage.clientHeight * dpr);
    layoutLines();
  }
  function layoutLines() {
    const lr = layer.getBoundingClientRect();
    svg.setAttribute('viewBox', `0 0 ${lr.width} ${lr.height}`);
    techs.forEach((t, i) => {
      const d = t.querySelector('.tdot').getBoundingClientRect();
      const c = t.querySelector('.tcard').getBoundingClientRect();
      const x1 = d.left + d.width / 2 - lr.left, y1 = d.top + d.height / 2 - lr.top;
      const cx = c.left - lr.left, cy = c.top - lr.top, l = lines[i];
      l.setAttribute('x1', x1); l.setAttribute('y1', y1);
      l.setAttribute('x2', Math.min(Math.max(x1, cx), cx + c.width));
      l.setAttribute('y2', Math.min(Math.max(y1, cy), cy + c.height));
    });
  }
  addEventListener('resize', size);

  /* ---- drawing ---- */
  function draw(img) {
    if (!img) return;
    const cw = cv.width, ch = cv.height, r = Math.max(cw / img.width, ch / img.height);   // cover
    const dw = img.width * r, dh = img.height * r, tl = window.apexTilt || { x: 0, y: 0 }, dpr = cv.width / stage.clientWidth;
    const dx = Math.round((cw - dw) / 2 + tl.x * dpr), dy = Math.round((ch - dh) * 0.25 + tl.y * dpr);
    const eng = window.apexColorEngine;
    if (eng && eng.drawWithWipe) eng.drawWithWipe(ctx, img, dx, dy, dw, dh, true);
    else ctx.drawImage(img, dx, dy, dw, dh);
  }
  const progress = () => {
    const rect = sec.getBoundingClientRect();
    return Math.min(1, Math.max(0, -rect.top / Math.max(1, sec.offsetHeight - innerHeight)));
  };
  const wrapB = v => ((v % B.N) + B.N) % B.N;
  const distToPose = () => { const f = wrapB(pos); return Math.min(f, B.N - f); };

  const api = window.apexSpin = {
    N: B.N, speed: 0,
    frame() { return wrapB(pos); },
    staticOk() { return mode === 'scrub' || distToPose() < 8; },   // the closed-to-open labels fit only the starting pose
    goTo(f) {
      if (progress() < OPEN_AT) {                                  // open the car first, then turn
        scrollTo({ top: sec.offsetTop + (OPEN_AT + 0.02) * (sec.offsetHeight - innerHeight), behavior: 'smooth' });
        setTimeout(() => { target = f; vel = 0; }, 1100);
      } else { target = f; vel = 0; }
    },
  };
  let lastPos = 0;

  function render() {
    const p = progress();
    mode = p >= OPEN_AT ? 'rotate' : 'scrub';
    let img;
    if (mode === 'scrub') {
      pos = 0; vel = 0; target = null;                              // coming back up re-closes the car at the starting pose
      const i = Math.min(A.N - 1, Math.round(p / OPEN_AT * (A.N - 1)));
      A.decode(i);
      if (p > 0.6) B.decode(0);                                     // have the rotation frames ready before the car is open
      img = A.get(i) || A.nearest(i);
    } else {
      const i = Math.round(wrapB(pos)) % B.N;
      B.decode(i);
      img = B.get(i) || B.nearest(i);
    }
    if (img) {                                                      // never clear to black while a frame is still decoding
      ctx.fillStyle = '#060606'; ctx.fillRect(0, 0, cv.width, cv.height);
      ctx.imageSmoothingEnabled = true; ctx.imageSmoothingQuality = 'high';
      draw(img);
    }
    api.speed += (Math.abs(pos - lastPos) - api.speed) * 0.2; lastPos = pos;
    techs.forEach((el, n) => {
      const on = mode === 'rotate' && wrapB(pos) >= +el.dataset.from && wrapB(pos) <= +el.dataset.to;
      el.classList.toggle('on', on); lines[n].classList.toggle('on', on);
    });
    if (hint) hint.textContent = mode === 'rotate' ? 'Drag to rotate' : 'Scroll';
  }

  /* ---- drag to rotate (only once the car is open) ---- */
  stage.addEventListener('pointerdown', e => {
    if (e.button > 0 || mode !== 'rotate' || e.target.closest('.presets,.cfg,.specs')) return;
    target = null; dragging = true; lastX = e.clientX; vel = 0;
    try { stage.setPointerCapture(e.pointerId); } catch (err) {}
    stage.classList.add('grab');
  });
  stage.addEventListener('pointermove', e => {
    if (!dragging) return;
    const dx = e.clientX - lastX; lastX = e.clientX;
    const d = dx / stage.clientWidth * B.N * 0.9;
    pos -= d; vel = -d;
  });
  const up = () => { dragging = false; stage.classList.remove('grab'); };
  stage.addEventListener('pointerup', up); stage.addEventListener('pointercancel', up);

  function tick() {
    if (visible) {
      if (mode === 'rotate' && !dragging) {
        if (target !== null) {
          const diff = (((target - pos + B.N / 2) % B.N) + B.N) % B.N - B.N / 2;
          if (Math.abs(diff) < 0.3) target = null; else pos += diff * 0.07;
        }
        vel *= 0.94; pos += vel;                                    // inertia only, no auto-rotate
      }
      render();
    }
    requestAnimationFrame(tick);
  }
  size(); setTimeout(layoutLines, 600);
  requestAnimationFrame(tick);
})();
