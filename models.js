
/* Models: 240 WebP frames controlled by scroll progress.
   Scroll down = video plays forward.
   Scroll up = video plays backward.
*/
(() => {
  const sec = document.getElementById('models');
  const canvas = document.getElementById('modelsCanvas');

  if (!sec || !canvas) return;
  if (window.matchMedia('(max-width:1000px)').matches) return;   // phones/tablets use the static layout

  const ctx = canvas.getContext('2d', { alpha: false });

  const cards = [...document.querySelectorAll('#mCards .mcard')];
  const btns = [...document.querySelectorAll('#mRail button')];

  const TOTAL_FRAMES = 240;
  const FRAME_PATH = 'public/showroom-frames/frame-';

  const frames = [];
  let loadedFrames = 0;
  let currentFrame = -1;
  let activeCard = -1;
  let animationFrame = null;

  // Load all 240 frames
  function preloadFrames() {
    for (let i = 1; i <= TOTAL_FRAMES; i++) {
      const img = new Image();

      img.src = `${FRAME_PATH}${String(i).padStart(4, '0')}.webp`;

      img.onload = () => {
        loadedFrames++;

        if (i === 1) {
          drawFrame(0);
        }

        if (loadedFrames === TOTAL_FRAMES) {
          update();
        }
      };

      img.onerror = () => {
        console.error(`Could not load showroom frame ${i}`);
      };

      frames[i - 1] = img;
    }
  }

  // Resize canvas according to screen dimensions
  function resizeCanvas() {
    const dpr = Math.min(window.devicePixelRatio || 1, 2);

    const rect = canvas.getBoundingClientRect();

    canvas.width = Math.round(rect.width * dpr);
    canvas.height = Math.round(rect.height * dpr);

    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

    drawFrame(currentFrame < 0 ? 0 : currentFrame);
  }

  // Draw a frame while preserving its aspect ratio
  function drawFrame(index) {
    if (!frames.length) return;

    index = Math.max(0, Math.min(TOTAL_FRAMES - 1, index));

    const img = frames[index];

    if (!img || !img.complete || !img.naturalWidth) return;

    const width = canvas.clientWidth;
    const height = canvas.clientHeight;

    if (!width || !height) return;

    const scale = Math.max(
      width / img.naturalWidth,
      height / img.naturalHeight
    );

    const drawWidth = img.naturalWidth * scale;
    const drawHeight = img.naturalHeight * scale;

    const x = (width - drawWidth) / 2;
    const y = (height - drawHeight) / 2;

    ctx.clearRect(0, 0, width, height);
    ctx.drawImage(img, x, y, drawWidth, drawHeight);
  }

  // Calculate section scroll progress
  function getProgress() {
    const rect = sec.getBoundingClientRect();

    const scrollDistance = Math.max(
      1,
      sec.offsetHeight - window.innerHeight
    );

    return Math.max(
      0,
      Math.min(1, -rect.top / scrollDistance)
    );
  }

  // Update active model card and navigation
  function updateActiveCard(progress) {
    const index = Math.min(
      3,
      Math.floor(progress * 4)
    );

    if (index === activeCard) return;

    activeCard = index;

    cards.forEach((card, i) => {
      card.classList.toggle('on', i === index);
    });

    btns.forEach((button, i) => {
      button.classList.toggle('on', i === index);
    });
  }

  // Update frame according to scroll position
  function update() {
    animationFrame = null;

    const progress = getProgress();

    const frameIndex = Math.round(
      progress * (TOTAL_FRAMES - 1)
    );

    if (frameIndex !== currentFrame) {
      currentFrame = frameIndex;
      drawFrame(currentFrame);
    }

    updateActiveCard(progress);
  }

  // Keep scroll rendering smooth
  function requestUpdate() {
    if (animationFrame !== null) return;

    animationFrame = requestAnimationFrame(update);
  }

  // Right-side navigation buttons
  btns.forEach(button => {
    button.addEventListener('click', () => {
      const index = Number(button.dataset.i);

      const progress = (index + 0.5) / 4;

      const scrollDistance = Math.max(
        0,
        sec.offsetHeight - window.innerHeight
      );

      const target =
        window.scrollY +
        sec.getBoundingClientRect().top +
        progress * scrollDistance;

      window.scrollTo({
        top: target,
        behavior: 'smooth'
      });
    });
  });

  window.addEventListener('scroll', requestUpdate, {
    passive: true
  });

  window.addEventListener('resize', () => {
    resizeCanvas();
    requestUpdate();
  });

  resizeCanvas();
  requestUpdate();
  // load the 240 showroom frames only when the section is about to come into view
  if ('IntersectionObserver' in window) {
    const io = new IntersectionObserver(([e]) => { if (e.isIntersecting) { io.disconnect(); preloadFrames(); } }, { rootMargin: '1500px 0px' });
    io.observe(sec);
  } else preloadFrames();
})();
