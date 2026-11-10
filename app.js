// Scroll-scrubbed hero: scroll position -> video frame (drawn on canvas).
const FRAME_COUNT = 190;               // frames extracted from video/hero.mp4 at 24fps
const frameSrc = i => `frames_hd3/f_${String(i).padStart(4, '0')}.webp`;

const hero = document.getElementById('hero');
const canvas = document.getElementById('frames');
const ctx = canvas.getContext('2d');
const engine = document.getElementById('engine');
const bar = document.getElementById('bar');
const pct = document.getElementById('pct');
const hint = document.getElementById('hint');
const copy = [1, 2, 3].map(n => document.getElementById('c' + n));

const images = new Array(FRAME_COUNT);
let current = -1, target = 0, smooth = 0, ready = 0;

const clamp = (v, a = 0, b = 1) => Math.min(b, Math.max(a, v));
const ease = t => t * t * (3 - 2 * t);
// window helper: 0 before a, 1 on b..c, 0 after d
const win = (p, a, b, c, d) => ease(clamp((p - a) / (b - a))) * (1 - ease(clamp((p - c) / (d - c))));

function resize() {
  const dpr = Math.min(devicePixelRatio || 1, 2);
  canvas.width = innerWidth * dpr; canvas.height = innerHeight * dpr;
  ctx.imageSmoothingEnabled = true; ctx.imageSmoothingQuality = 'high';
  current = -1; draw(Math.round(smooth * (FRAME_COUNT - 1)));
}

function draw(i) {
  const img = images[i];
  if (!img || !img.complete || i === current) return;
  current = i;
  const cw = canvas.width, ch = canvas.height;
  const s = Math.max(cw / img.naturalWidth, ch / img.naturalHeight);
  const w = img.naturalWidth * s, h = img.naturalHeight * s;
  ctx.drawImage(img, (cw - w) / 2, (ch - h) / 2, w, h);
}

function load() {
  // first frame first, then the rest
  for (let i = 0; i < FRAME_COUNT; i++) {
    const im = new Image();
    im.decoding = 'async';
    im.onload = () => { ready++; if (i === 0) draw(0); };
    im.src = frameSrc(i + 1);
    images[i] = im;
  }
}

function onScroll() {
  const r = hero.getBoundingClientRect();
  target = clamp(-r.top / (r.height - innerHeight));
}

function tick() {
  smooth += (target - smooth) * 0.12;            // eased follow, no snapping
  if (Math.abs(target - smooth) < 0.0004) smooth = target;
  const p = smooth;

  // video plays across the first 82% of scroll, engine takes the rest
  draw(Math.round(clamp(p / 0.82) * (FRAME_COUNT - 1)));

  const e = ease(clamp((p - 0.74) / 0.2));
  engine.style.opacity = e;
  engine.style.transform = `scale(${1.06 - 0.06 * e})`;

  const o = [win(p, -1, 0, 0.14, 0.26), win(p, 0.3, 0.42, 0.6, 0.72), win(p, 0.8, 0.9, 1.1, 1.2)];
  copy.forEach((el, k) => { el.style.opacity = o[k]; el.style.transform = `translateY(${(1 - o[k]) * 24}px)`; });

  bar.style.setProperty('--p', (p * 100).toFixed(1) + '%');
  pct.textContent = Math.round(p * 100) + '%';
  hint.style.opacity = p > 0.03 ? 0 : 1;
  requestAnimationFrame(tick);
}

addEventListener('scroll', onScroll, { passive: true });
addEventListener('resize', resize);
resize(); load(); onScroll(); requestAnimationFrame(tick);
