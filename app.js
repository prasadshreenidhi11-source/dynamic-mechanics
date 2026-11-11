/**
 * APEX - Hero Frame Scrubbing Canvas Engine
 */

window.FRAME_COUNT = 190;
window.ready = 0;

class HeroCanvas {
  constructor() {
    this.canvas = document.getElementById('frames') || document.getElementById('hero-canvas');
    if (!this.canvas) {
      console.warn('Canvas element not found in DOM.');
      return;
    }
    
    this.ctx = this.canvas.getContext('2d');
    this.ctx.imageSmoothingEnabled = true;
    this.ctx.imageSmoothingQuality = 'high';
    this.totalFrames = window.FRAME_COUNT;
    this.frames = [];
    this.imagesLoaded = 0;
    this.currentFrameIndex = 0;
    this.targetFrameIndex = 0;

    this.heroContainer = document.querySelector('.hero');
    this.engineOverlay = document.querySelector('.engine');

    this.textBlocks = {
      intro: document.getElementById('hero-text-1'),
      aero: document.getElementById('hero-text-2'),
      engine: document.getElementById('hero-text-3')
    };

    this.init();
  }

  init() {
    this.resizeCanvas();
    window.addEventListener('resize', () => this.resizeCanvas());
    this.preloadFrames();
    this.bindScroll();
    this.renderLoop();
  }

  resizeCanvas() {
    if (!this.canvas) return;
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    this.canvas.width = Math.round(window.innerWidth * dpr);
    this.canvas.height = Math.round(window.innerHeight * dpr);
  }

  preloadFrames() {
    return; // frames now come from spin.js (360 view); keep only the scroll text logic here
    for (let i = 1; i <= this.totalFrames; i++) {
      const img = new Image();
      const frameNum = String(i).padStart(4, '0');
      img.src = `frames_hd3/f_${frameNum}.webp`;
      
      img.onload = () => {
        this.imagesLoaded++;
        window.ready = this.imagesLoaded;
      };
      
      this.frames.push(img);
    }
  }

  bindScroll() {
    window.addEventListener('scroll', () => {
      if (!this.heroContainer) return;

      const rect = this.heroContainer.getBoundingClientRect();
      const totalScrollable = this.heroContainer.offsetHeight - window.innerHeight;
      const currentScroll = Math.max(0, -rect.top);

      let progress = Math.min(1, Math.max(0, currentScroll / totalScrollable));

      const frameProgress = progress;
      this.targetFrameIndex = Math.min(
        this.totalFrames - 1,
        Math.floor(frameProgress * (this.totalFrames - 1))
      );

      if (this.engineOverlay) {
        this.engineOverlay.style.opacity = 0;
        this.engineOverlay.style.display = 'none';
      }

      this.updateTextVisibility(progress);
    });
  }

  updateTextVisibility(progress) {
    if (this.textBlocks.intro) {
      this.textBlocks.intro.classList.toggle('active', progress >= 0.02 && progress < 0.35);
    }
    if (this.textBlocks.aero) {
      this.textBlocks.aero.classList.toggle('active', progress >= 0.40 && progress < 0.70);
    }
    if (this.textBlocks.engine) {
      this.textBlocks.engine.classList.toggle('active', progress >= 0.75 && progress <= 1.0);
    }
  }

  renderLoop() {
    this.currentFrameIndex += (this.targetFrameIndex - this.currentFrameIndex) * 0.15;
    const frameToDraw = Math.round(this.currentFrameIndex);

    const img = this.frames[frameToDraw];
    if (img && img.complete && img.naturalWidth !== 0) {
      this.drawFrame(img);
    }

    requestAnimationFrame(() => this.renderLoop());
  }

  drawFrame(img) {
    if (!this.ctx || !this.canvas) return;
    const cw = this.canvas.width;
    const ch = this.canvas.height;

    this.ctx.fillStyle = '#060606';
    this.ctx.fillRect(0, 0, cw, ch);

    const hRatio = cw / img.width;
    const vRatio = ch / img.height;
    const ratio = Math.max(hRatio, vRatio); // cover: fill the screen, no visible frame edges

    const dw = img.width * ratio;
    const dh = img.height * ratio;
    const dx = (cw - dw) / 2;
    const dy = (ch - dh) * 0.25; // crop mostly from the floor, keep doors in frame

    if (window.apexColorEngine && typeof window.apexColorEngine.drawWithWipe === 'function') {
      window.apexColorEngine.drawWithWipe(this.ctx, img, dx, dy, dw, dh);
    } else {
      this.ctx.drawImage(img, 0, 0, img.width, img.height, dx, dy, dw, dh);
    }
  }
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => {
    window.apexHeroCanvas = new HeroCanvas();
  });
} else {
  window.apexHeroCanvas = new HeroCanvas();
}

// APEX - Models Section Video Scroll Scrubber
(() => {
  const modelsSection = document.getElementById('models');
  const modelsVideo = document.getElementById('modelsVideo');
  const modelsContent = document.getElementById('modelsContent');

  if (!modelsSection || !modelsVideo) return;

  modelsVideo.pause();
  modelsVideo.currentTime = 0;

  function updateModelsScroll() {
    const rect = modelsSection.getBoundingClientRect();
    const sectionHeight = modelsSection.offsetHeight - window.innerHeight;
    const currentScroll = Math.max(0, -rect.top);
    
    let progress = Math.min(1, Math.max(0, currentScroll / sectionHeight));

    if (!isNaN(modelsVideo.duration) && modelsVideo.duration > 0) {
      modelsVideo.currentTime = progress * modelsVideo.duration;
    }

    if (modelsContent) {
      if (progress > 0.05 && progress < 0.85) {
        modelsContent.classList.add('active');
      } else {
        modelsContent.classList.remove('active');
      }
    }
  }

  window.addEventListener('scroll', updateModelsScroll);
  window.addEventListener('resize', updateModelsScroll);
})();

// APEX - Smooth Multi-Stage Car Reveal Canvas Frame Engine
class RevealCanvas {
  constructor() {
    this.canvas = document.getElementById('revealCanvas');
    if (!this.canvas) return;

    this.ctx = this.canvas.getContext('2d', { willReadFrequently: true });
    this.totalFrames = 150; // Set this to your exact total exported frame count
    this.frames = [];
    this.imagesLoaded = 0;
    
    this.currentFrame = 0;
    this.targetFrame = 0;
    this.ease = 0.12; // LERP smoothness factor

    this.revealSection = document.getElementById('reveal');
    this.c1 = document.getElementById('revealCopy1');
    this.c2 = document.getElementById('revealCopy2');
    this.c3 = document.getElementById('revealCopy3');

    this.init();
  }

  init() {
    this.resize();
    window.addEventListener('resize', () => this.resize());
    this.preloadFrames();
    this.bindScroll();
    this.renderLoop();
  }

  resize() {
    if (!this.canvas) return;
    this.canvas.width = window.innerWidth;
    this.canvas.height = window.innerHeight;
  }

  preloadFrames() {
    const run = () => {
      for (let i = 1; i <= this.totalFrames; i++) {
        const img = new Image();
        img.decoding = 'async';
        img.src = `reveal_frames/f_${String(i).padStart(4, '0')}.webp`;
        img.onload = () => this.imagesLoaded++;
        this.frames.push(img);
      }
    };
    if (!this.revealSection || !('IntersectionObserver' in window)) return run();
    const io = new IntersectionObserver(([e]) => { if (e.isIntersecting) { io.disconnect(); run(); } }, { rootMargin: '2500px 0px' });
    io.observe(this.revealSection);                 // fetch these only when the section is close
  }

  bindScroll() {
    window.addEventListener('scroll', () => {
      if (!this.revealSection) return;

      const rect = this.revealSection.getBoundingClientRect();
      const sectionHeight = this.revealSection.offsetHeight - window.innerHeight;
      const currentScroll = Math.max(0, -rect.top);

      let progress = Math.min(1, Math.max(0, currentScroll / sectionHeight));

      this.targetFrame = Math.min(
        this.totalFrames - 1,
        Math.floor(progress * (this.totalFrames - 1))
      );

      // Toggle text blocks smoothly based on scroll progress
      if (this.c1) this.c1.classList.toggle('active', progress >= 0.05 && progress < 0.33);
      if (this.c2) this.c2.classList.toggle('active', progress >= 0.36 && progress < 0.66);
      if (this.c3) this.c3.classList.toggle('active', progress >= 0.69 && progress < 0.95);
    }, { passive: true });
  }

  renderLoop() {
    // Smooth LERP transition between frame indexes
    this.currentFrame += (this.targetFrame - this.currentFrame) * this.ease;
    const frameToDraw = Math.round(this.currentFrame);

    const img = this.frames[frameToDraw];
    if (img && img.complete && img.naturalWidth !== 0) {
      this.drawFrame(img);
    }

    requestAnimationFrame(() => this.renderLoop());
  }

  drawFrame(img) {
    if (!this.ctx || !this.canvas) return;
    const cw = this.canvas.width;
    const ch = this.canvas.height;

    this.ctx.fillStyle = '#050505';
    this.ctx.fillRect(0, 0, cw, ch);

    const hRatio = cw / img.width;
    const vRatio = ch / img.height;
    const ratio = Math.max(hRatio, vRatio); // Cover fit

    const dw = img.width * ratio;
    const dh = img.height * ratio;
    const dx = (cw - dw) / 2;
    const dy = (ch - dh) / 2;

    this.ctx.drawImage(img, 0, 0, img.width, img.height, dx, dy, dw, dh);
  }
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => {
    window.apexRevealCanvas = new RevealCanvas();
  });
} else {
  window.apexRevealCanvas = new RevealCanvas();
}