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
  if (!expBg || !expSec) return;
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

// Engineering Sculpted 5-Stage Interactive Speedometer & Specs Showcase
(() => {
  const specsSec = document.getElementById('specs');
  const specsVideo = document.getElementById('specsVideo');
  const speedoArc = document.getElementById('speedoArc');
  const speedoNum = document.getElementById('speedoNum');
  const hpNum = document.getElementById('hpNum');
  const accelNum = document.getElementById('accelNum');
  const specHp = document.getElementById('specHp');
  const specAccel = document.getElementById('specAccel');
  const specChassis = document.getElementById('specChassis');
  const speedoTicks = document.querySelectorAll('#speedoTicks line');

  if (!specsSec || !speedoArc || !speedoNum) return;

  const ARC_LEN = 414.69; // 270 degree arc circumference (radius 88)
  const MAX_SPEED = 445;
  const MAX_HP = 1015;
  const MAX_ACCEL = 2.4;

  let currentSpeed = 0;
  let targetSpeed = 0;
  let currentHp = 0;
  let targetHp = 0;
  let currentAccel = 0;
  let targetAccel = 0;
  let currentArcOffset = ARC_LEN;
  let targetArcOffset = ARC_LEN;

  function updateScroll() {
    const rect = specsSec.getBoundingClientRect();
    const totalDist = specsSec.offsetHeight - window.innerHeight;

    if (totalDist <= 0) {
      // Small screen fallback where section is not tall enough to pin
      targetSpeed = MAX_SPEED;
      targetHp = MAX_HP;
      targetAccel = MAX_ACCEL;
      targetArcOffset = 0;
      if (specHp) specHp.classList.add('active');
      if (specAccel) specAccel.classList.add('active');
      if (specChassis) specChassis.classList.add('active');
      return;
    }

    const progress = Math.min(1, Math.max(0, -rect.top / totalDist));
// FULL BUGATTI VIDEO SCROLL SCRUBBING
if (
  specsVideo &&
  specsVideo.readyState >= 1 &&
  Number.isFinite(specsVideo.duration) &&
  specsVideo.duration > 0
) {
  const targetTime = Math.min(
    progress * specsVideo.duration,
    specsVideo.duration - 0.05
  );

  if (
    !specsVideo.seeking &&
    Math.abs(specsVideo.currentTime - targetTime) > 0.04
  ) {
    specsVideo.currentTime = targetTime;
  }
}
    // STAGE 1: Entry (progress 0.00 -> 0.12)
    // STAGE 2: Speedometer 0 -> 445 km/h & blue arc filling (progress 0.12 -> 0.48)
    const pSpeed = Math.min(1, Math.max(0, (progress - 0.12) / 0.36));
    targetSpeed = Math.round(pSpeed * MAX_SPEED);
    targetArcOffset = ARC_LEN * (1 - pSpeed);

    // Speedometer active ticks highlight
    if (speedoTicks.length > 0) {
      const activeTicksCount = Math.floor(pSpeed * speedoTicks.length);
      speedoTicks.forEach((tick, idx) => {
        tick.style.stroke = idx <= activeTicksCount ? '#38b6ff' : 'rgba(255,255,255,0.28)';
      });
    }

    // STAGE 3: Horsepower counter 0 -> 1015 HP (progress 0.48 -> 0.70)
    const pHp = Math.min(1, Math.max(0, (progress - 0.48) / 0.22));
    targetHp = Math.round(pHp * MAX_HP);
    if (specHp) specHp.classList.toggle('active', progress >= 0.44);

    // STAGE 4: Acceleration counter 0.0 -> 2.4s (progress 0.68 -> 0.86)
    const pAccel = Math.min(1, Math.max(0, (progress - 0.68) / 0.18));
    targetAccel = pAccel * MAX_ACCEL;
    if (specAccel) specAccel.classList.toggle('active', progress >= 0.66);

    // STAGE 5: Full Carbon chassis specification reveals (progress >= 0.84)
    if (specChassis) specChassis.classList.toggle('active', progress >= 0.82);
  }

  // Smooth LERP render loop for synchronized, cinematic motion without jumps
  function render() {
    const ease = 0.12;

    currentSpeed += (targetSpeed - currentSpeed) * ease;
    speedoNum.textContent = Math.round(currentSpeed);

    currentArcOffset += (targetArcOffset - currentArcOffset) * ease;
    speedoArc.style.strokeDashoffset = currentArcOffset.toFixed(2);

    if (hpNum) {
      currentHp += (targetHp - currentHp) * ease;
      const formattedHp = Math.round(currentHp);
      hpNum.textContent = formattedHp > 999 ? formattedHp.toLocaleString('en-US') : formattedHp;
    }

    if (accelNum) {
      currentAccel += (targetAccel - currentAccel) * ease;
      accelNum.textContent = currentAccel.toFixed(1);
    }

    requestAnimationFrame(render);
  }
if (specsVideo) {
  specsVideo.muted = true;
  specsVideo.playsInline = true;
  specsVideo.pause();

  specsVideo.addEventListener('loadedmetadata', () => {
    console.log('Bugatti video loaded:', specsVideo.duration);
    updateScroll();
  });

  specsVideo.addEventListener('error', () => {
    console.error('Bugatti video error:', specsVideo.error);
  });
}
  window.addEventListener('scroll', updateScroll, { passive: true });
  window.addEventListener('resize', updateScroll);
  updateScroll();
  requestAnimationFrame(render);
})();
