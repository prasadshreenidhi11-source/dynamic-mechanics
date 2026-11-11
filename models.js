/* Models: one wide frame with all four cars. Scrolling moves the camera from the full row to each car in turn,
   and that car's label arrives when the camera does. The picture is untouched (no filters, no overlays, no canvas). */
(() => {
  const sec = document.getElementById('models');
  const box = document.getElementById('mBox');
  if (!sec || !box) return;
  const cards = [...document.querySelectorAll('#mCards .mcard')];
  const btns = [...document.querySelectorAll('#mRail button')];

  // camera stops: centre of the shot (fractions of the picture) and zoom. Stop 0 is the whole row, 1-4 are the cars.
  const STOPS = [
    { cx: 0.50, cy: 0.435, k: 1.05 },   // all four cars
    { cx: 0.20, cy: 0.60,  k: 2.4 },    // 01 red
    { cx: 0.40, cy: 0.60,  k: 2.4 },    // 02 orange
    { cx: 0.62, cy: 0.60,  k: 2.4 },    // 03 blue
    { cx: 0.86, cy: 0.60,  k: 2.4 },    // 04 black
  ];
  const N = STOPS.length;                       // 5 stops across the section
  const smooth = t => { t = Math.min(1, Math.max(0, t)); return t * t * (3 - 2 * t); };
  const progress = () => {
    const r = sec.getBoundingClientRect();
    return Math.min(1, Math.max(0, -r.top / Math.max(1, sec.offsetHeight - innerHeight)));
  };

  // scroll progress -> camera position (0 = whole row, 1..4 = car). Each stop holds for a while, then glides on.
  function camPos(p) {
    const s = p * N;
    let pos = 0;
    for (let k = 0; k < N - 1; k++) pos += smooth((s - (k + 0.7)) / 0.6);
    return pos;
  }

  let W = 0, H = 0, active = -1;
  function size() {
    const vw = innerWidth, vh = innerHeight;
    W = Math.max(vw, vh * 16 / 9); H = Math.max(vh, vw * 9 / 16);
    box.style.width = W + 'px'; box.style.height = H + 'px';
  }
  function apply() {
    const pos = camPos(progress());
    const i = Math.min(N - 2, Math.floor(pos)), f = pos - i;
    const a = STOPS[i], b = STOPS[i + 1];
    const lerp = (x, y) => x + (y - x) * f;
    const k = lerp(a.k, b.k), cx = lerp(a.cx, b.cx), cy = lerp(a.cy, b.cy);
    const fw = innerWidth / (k * W), fh = innerHeight / (k * H);
    const u0 = Math.min(1 - fw, Math.max(0, cx - fw / 2)), v0 = Math.min(1 - fh, Math.max(0, cy - fh / 2));
    box.style.transform = `translate3d(${-k * u0 * W}px, ${-k * v0 * H}px, 0) scale(${k})`;

    // the label belongs to the car the camera has arrived at
    const near = Math.round(pos), arrived = Math.abs(pos - near) < 0.06 && near >= 1 ? near - 1 : -1;
    if (arrived !== active) {
      active = arrived;
      cards.forEach((c, n) => c.classList.toggle('on', n === arrived));
      btns.forEach((b, n) => b.classList.toggle('on', n === arrived));
    }
  }

  addEventListener('scroll', apply, { passive: true });
  addEventListener('resize', () => { size(); apply(); });

  btns.forEach(b => b.addEventListener('click', () => {
    const i = +b.dataset.i;                       // 0..3 -> car stop 1..4, held at the middle of its plateau
    const p = (i + 1.5) / N;
    scrollTo({ top: sec.offsetTop + p * (sec.offsetHeight - innerHeight), behavior: 'smooth' });
  }));

  box.style.transformOrigin = '0 0';
  size(); apply();
})();
