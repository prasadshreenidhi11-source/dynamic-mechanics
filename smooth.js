/* Smooth, inertial scrolling: wheel input is eased so even a fast flick glides to a stop. */
(() => {
  if (matchMedia('(prefers-reduced-motion: reduce)').matches) return;
  if (!matchMedia('(pointer: fine)').matches) return;          // touch devices keep their native momentum
  const root = document.documentElement;
  const max = () => Math.max(0, root.scrollHeight - innerHeight);
  const clamp = v => Math.min(max(), Math.max(0, v));
  let target = scrollY, current = scrollY, raf = 0;
  const EASE = 0.085;                                           // lower = longer glide

  function step() {
    current += (target - current) * EASE;
    if (Math.abs(target - current) < 0.3) current = target;
    scrollTo({ top: current, behavior: 'instant' });
    raf = current === target ? 0 : requestAnimationFrame(step);
  }
  const go = v => { target = clamp(v); if (!raf) { current = scrollY; raf = requestAnimationFrame(step); } };

  addEventListener('wheel', e => {
    if (e.ctrlKey || e.defaultPrevented) return;                // pinch-zoom and handled events pass through
    e.preventDefault();
    const dy = e.deltaMode === 1 ? e.deltaY * 32 : e.deltaMode === 2 ? e.deltaY * innerHeight : e.deltaY;
    go((raf ? target : scrollY) + dy);
  }, { passive: false });

  // scrollbar drag, keyboard and script-driven scrolls: stay in sync instead of fighting them
  addEventListener('scroll', () => { if (!raf) { target = current = scrollY; } }, { passive: true });

  // in-page links glide too
  document.addEventListener('click', e => {
    const a = e.target.closest && e.target.closest('a[href^="#"]');
    if (!a || a.getAttribute('href') === '#') return;
    const el = document.querySelector(a.getAttribute('href'));
    if (!el) return;
    e.preventDefault();
    go(el.getBoundingClientRect().top + scrollY);
  });
})();
