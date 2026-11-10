// Segments below the hero: reveal on scroll, count-up numbers, engine parallax.
const io = new IntersectionObserver((entries) => {
  entries.forEach(e => {
    if (!e.isIntersecting) return;
    e.target.classList.add('in');
    const n = e.target.querySelector('[data-count]');
    if (n) countUp(n);
    io.unobserve(e.target);
  });
}, { threshold: 0.18 });
document.querySelectorAll('.reveal').forEach(el => io.observe(el));

function countUp(el) {
  const to = parseFloat(el.dataset.count), dec = +(el.dataset.dec || 0), suf = el.dataset.suffix || '';
  const t0 = performance.now(), dur = 1600;
  (function step(t) {
    const k = Math.min(1, (t - t0) / dur), e = 1 - Math.pow(1 - k, 3);
    el.textContent = (to * e).toFixed(dec) + suf;
    if (k < 1) requestAnimationFrame(step);
  })(t0);
}

// parallax on the experience background
const expBg = document.getElementById('expBg'), expSec = document.getElementById('experience');
function parallax() {
  const r = expSec.getBoundingClientRect();
  if (r.bottom < 0 || r.top > innerHeight) return;
  const k = (r.top + r.height / 2 - innerHeight / 2) / innerHeight;
  expBg.style.transform = `translateY(${k * -60}px) scale(1.08)`;
}
addEventListener('scroll', parallax, { passive: true });
parallax();

// header goes solid after the hero starts
const nav = document.getElementById('nav');
addEventListener('scroll', () => { nav.style.background = scrollY > 40 ? '#050505e6' : ''; }, { passive: true });
