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

// APEX - Smooth Multi-Stage Car Reveal Canvas Frame Engine & Interactive Hotspots
class RevealCanvas {
  constructor() {
    this.canvas = document.getElementById('revealCanvas');
    if (!this.canvas) return;

    this.ctx = this.canvas.getContext('2d', { willReadFrequently: true });
    this.totalFrames = 240; // 240 high-definition WebP frames extracted from reveal.mp4
    this.frames = [];
    this.imagesLoaded = 0;
    
    this.currentFrame = 0;
    this.targetFrame = 0;
    this.ease = 0.085; // Numeric scrub smoothing for silky, cinematic catch-up

    this.revealSection = document.getElementById('reveal');
    this.c1 = document.getElementById('revealCopy1');
    this.c2 = document.getElementById('revealCopy2');
    this.c3 = document.getElementById('revealCopy3');
    this.hotspotsLayer = document.getElementById('revealHotspots');
    this.highlightsLayer = document.getElementById('revealHighlights');

    // Hotspot Modal elements
    this.panel = document.getElementById('revealPanel');
    this.rpTitle = document.getElementById('rpTitle');
    this.rpCategory = document.getElementById('rpCategory');
    this.rpBody = document.getElementById('rpBody');
    this.rpClose = document.getElementById('rpClose');
    this.rpBackdrop = document.getElementById('rpBackdrop');
    this.rpNext = document.getElementById('rpNext');
    this.activeHotspotKey = null;

    this.hotspotData = {
      engine: {
        category: 'Powertrain Engineering',
        title: 'AMG 6.0L Twin-Turbo V12',
        body: `
          <p>Handcrafted exclusively for Pagani by Mercedes-AMG in Affalterbach, this bespoke 60° dry-sump V12 generates over <strong>840 HP</strong> and an astounding <strong>1,100 Nm</strong> of torque available from 2,800 to 5,900 rpm.</p>
          <ul>
            <li><strong>Aspiration:</strong> Bespoke twin turbochargers with integrated liquid intercoolers.</li>
            <li><strong>Exhaust:</strong> Titanium quad-pipe central exhaust system with ceramic thermal coating.</li>
            <li><strong>Power Delivery:</strong> Instantaneous throttle response with unrelenting linear acceleration through 7-speed transversal automated transmission.</li>
          </ul>
        `
      },
      seats: {
        category: 'Cockpit & Ergonomics',
        title: 'Interior & Leather Sport Seats',
        body: `
          <p>The monocoque bucket seats combine autoclave-cured Carbo-Titanium frames with hand-selected vegetable-tanned leather, hand-stitched by master artisans in San Cesario sul Panaro.</p>
          <ul>
            <li><strong>Construction:</strong> Ultra-rigid lightweight shell offering supreme lateral bolster support under multi-G cornering.</li>
            <li><strong>Artistry:</strong> Exposed mechanical adjustment linkages milled from solid blocks of aeronautical aluminum and titanium.</li>
            <li><strong>Comfort:</strong> Four-point competition harnesses integrated seamlessly with touring-grade anatomical lumbar padding.</li>
          </ul>
        `
      },
      tyres: {
        category: 'Chassis Dynamics',
        title: 'Pirelli P Zero Corsa HP',
        body: `
          <p>Custom-developed specifically for Pagani's chassis geometry, featuring asymmetric tread patterns engineered to harness brutal longitudinal acceleration and extraordinary lateral grip.</p>
          <ul>
            <li><strong>Dimensions:</strong> 265/35 R20 front and 325/30 R21 rear bespoke compound tyres.</li>
            <li><strong>Tread Compound:</strong> High-grip motorsport polymer matrix maximizing mechanical keying into track and tarmac surfaces.</li>
            <li><strong>Handling:</strong> Immediate turn-in response with progressive breakaway characteristics near extreme limits.</li>
          </ul>
        `
      },
      brakes: {
        category: 'Deceleration System',
        title: 'Brembo Carbon-Ceramic Matrix',
        body: `
          <p>Engineered to deliver fade-free stopping power under relentless high-speed track abuse, transferring thermal energy efficiently through ventilated, cross-drilled CCM rotors.</p>
          <ul>
            <li><strong>Calipers:</strong> Monobloc 6-piston front and 4-piston rear calipers sculpted from aerospace-grade aluminum.</li>
            <li><strong>Rotors:</strong> 398 mm front and 380 mm rear carbon-ceramic composite discs with integrated directional cooling ducts.</li>
            <li><strong>Heat Management:</strong> Operational endurance exceeding 1,000°C with near-instantaneous pedal feedback.</li>
          </ul>
        `
      },
      colour: {
        category: 'Aesthetic Craftsmanship',
        title: 'Exposed Carbo-Triax & Clear Lacquer',
        body: `
          <p>The exterior finish showcases Pagani’s legendary exposed weave: interwoven carbon-fiber and titanium (Carbo-Titanium HP62 G2) protected under seven coats of deep optical clear coat.</p>
          <ul>
            <li><strong>Weave Alignment:</strong> Perfectly symmetrical herringbone chevron bookmatching across all body shut-lines and seams.</li>
            <li><strong>Finish Quality:</strong> Hand-polished mirror finish offering deep holographic depth under varying lighting angles.</li>
            <li><strong>Protection:</strong> Advanced UV-filtering nano-ceramic clear layer shielding raw composite strands from sun degradation.</li>
          </ul>
        `
      },
      bodytype: {
        category: 'Active Aerodynamics',
        title: 'Active Aero Carbon Monocoque',
        body: `
          <p>Sculpted purely by airflow requirements, the silhouette integrates active aerodynamic flaps front and rear that operate autonomously to balance downforce, drag, and air-braking.</p>
          <ul>
            <li><strong>Downforce Balance:</strong> Dynamic continuous flap angle regulation dictated by yaw angle, steering input, and speed.</li>
            <li><strong>Air Management:</strong> Integrated roof snorkel feeding cold ram-air directly into the twin-turbo intake plenum.</li>
            <li><strong>Structure:</strong> Carbo-Titanium monocoque structure delivering extraordinary torsional rigidity at a dry weight of barely 1,280 kg.</li>
          </ul>
        `
      }
    };

    this.hotspotKeys = Object.keys(this.hotspotData);

    this.init();
  }

  init() {
    this.resize();
    window.addEventListener('resize', () => this.resize());
    this.preloadFrames();
    this.bindScroll();
    this.bindHotspots();
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
    io.observe(this.revealSection);
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

      // Three-stage reveal typography orchestration:
      // Stage 1 (0.04 - 0.32): Initial reveal & mysterious awakening
      if (this.c1) this.c1.classList.toggle('active', progress >= 0.04 && progress < 0.32);

      // Stage 2 (0.35 - 0.65): Uncloaking and architecture
      if (this.c2) this.c2.classList.toggle('active', progress >= 0.35 && progress < 0.65);

      // Stage 3 (0.68 - 0.98): Full reveal & interactive hotspots unlocked
      const stage3Active = progress >= 0.68 && progress <= 1.0;
      if (this.c3) this.c3.classList.toggle('active', stage3Active);

      // Hotspots visible and clickable during Stage 3
      if (this.hotspotsLayer) {
        this.hotspotsLayer.classList.toggle('visible', progress >= 0.72);
      }
    }, { passive: true });
  }

  bindHotspots() {
    if (!this.hotspotsLayer) return;

    const buttons = this.hotspotsLayer.querySelectorAll('.r-hotspot');
    buttons.forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        const target = btn.dataset.target;
        this.openHotspot(target);
      });
    });

    if (this.rpClose) {
      this.rpClose.addEventListener('click', () => this.closeHotspot());
    }

    if (this.rpBackdrop) {
      this.rpBackdrop.addEventListener('click', () => this.closeHotspot());
    }

    if (this.rpNext) {
      this.rpNext.addEventListener('click', () => {
        if (!this.activeHotspotKey) return;
        const curIdx = this.hotspotKeys.indexOf(this.activeHotspotKey);
        const nextIdx = (curIdx + 1) % this.hotspotKeys.length;
        this.openHotspot(this.hotspotKeys[nextIdx]);
      });
    }

    // Keyboard escape to close
    window.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && this.panel && this.panel.classList.contains('open')) {
        this.closeHotspot();
      }
    });
  }

  openHotspot(key) {
    const data = this.hotspotData[key];
    if (!data) return;

    this.activeHotspotKey = key;

    // Highlight the active button
    const buttons = this.hotspotsLayer.querySelectorAll('.r-hotspot');
    buttons.forEach(btn => btn.classList.toggle('active', btn.dataset.target === key));

    // Highlight the component spotlight overlay
    if (this.highlightsLayer) {
      const highlights = this.highlightsLayer.querySelectorAll('.comp-highlight');
      highlights.forEach(hl => hl.classList.toggle('active', hl.dataset.highlight === key));
    }

    // Populate panel content
    if (this.rpTitle) this.rpTitle.textContent = data.title;
    if (this.rpCategory) this.rpCategory.textContent = data.category;
    if (this.rpBody) this.rpBody.innerHTML = data.body;

    // Show modal panel
    if (this.panel) {
      this.panel.classList.add('open');
      this.panel.setAttribute('aria-hidden', 'false');
    }
  }

  closeHotspot() {
    this.activeHotspotKey = null;

    if (this.hotspotsLayer) {
      const buttons = this.hotspotsLayer.querySelectorAll('.r-hotspot');
      buttons.forEach(btn => btn.classList.remove('active'));
    }

    if (this.highlightsLayer) {
      const highlights = this.highlightsLayer.querySelectorAll('.comp-highlight');
      highlights.forEach(hl => hl.classList.remove('active'));
    }

    if (this.panel) {
      this.panel.classList.remove('open');
      this.panel.setAttribute('aria-hidden', 'true');
    }
  }

  renderLoop() {
    // Smooth LERP transition between frame indexes: avoids skipping and provides silky catch-up
    this.currentFrame += (this.targetFrame - this.currentFrame) * this.ease;
    const frameToDraw = Math.min(this.totalFrames - 1, Math.max(0, Math.round(this.currentFrame)));

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
    const ratio = Math.max(hRatio, vRatio); // Cover fit to fill screen

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