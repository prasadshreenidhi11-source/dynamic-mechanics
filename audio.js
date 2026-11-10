// Generated ambience (WebAudio, no files). On by default; follows scroll progress.
// Browsers only allow sound after a click / key / tap, so it starts on the first one.
(() => {
  const btn = document.getElementById('sound'), label = document.getElementById('soundLabel');
  const hero = document.getElementById('hero');
  let wanted = true;                                   // default ON
  try { if (localStorage.getItem('apex-sound') === 'off') wanted = false; } catch (e) {}

  let ac, master, filt, droneGain, whooshGain, whooshFilt, started = false;

  function build() {
    ac = new (window.AudioContext || window.webkitAudioContext)();
    master = ac.createGain(); master.gain.value = 0; master.connect(ac.destination);

    filt = ac.createBiquadFilter(); filt.type = 'lowpass'; filt.frequency.value = 260; filt.Q.value = 6;
    droneGain = ac.createGain(); droneGain.gain.value = 0.5;
    filt.connect(droneGain); droneGain.connect(master);

    // detuned low pad: A1 + fifth + octave
    [[55, 'sawtooth', -6], [55.4, 'sawtooth', 5], [82.4, 'triangle', 0], [110, 'sine', 3]].forEach(([f, type, det]) => {
      const o = ac.createOscillator(); o.type = type; o.frequency.value = f; o.detune.value = det;
      const g = ac.createGain(); g.gain.value = type === 'sine' ? 0.5 : 0.22;
      o.connect(g); g.connect(filt); o.start();
    });
    // slow breathing on the filter
    const lfo = ac.createOscillator(), lg = ac.createGain();
    lfo.frequency.value = 0.07; lg.gain.value = 90; lfo.connect(lg); lg.connect(filt.frequency); lfo.start();

    // air / whoosh layer (looped noise)
    const buf = ac.createBuffer(1, ac.sampleRate * 2, ac.sampleRate), d = buf.getChannelData(0);
    for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1;
    const n = ac.createBufferSource(); n.buffer = buf; n.loop = true;
    whooshFilt = ac.createBiquadFilter(); whooshFilt.type = 'bandpass'; whooshFilt.frequency.value = 500; whooshFilt.Q.value = 0.8;
    whooshGain = ac.createGain(); whooshGain.gain.value = 0;
    n.connect(whooshFilt); whooshFilt.connect(whooshGain); whooshGain.connect(master); n.start();
    started = true;
  }

  const clamp = (v, a = 0, b = 1) => Math.min(b, Math.max(a, v));
  let lastP = 0, lastY = scrollY, vel = 0;

  function update() {
    if (started) {
      const r = hero.getBoundingClientRect();
      const p = clamp(-r.top / (r.height - innerHeight));
      vel += (Math.abs(scrollY - lastY) - vel) * 0.15; lastY = scrollY;
      const t = ac.currentTime;
      // drone opens up as the car opens up
      filt.frequency.setTargetAtTime(220 + p * 900, t, 0.25);
      droneGain.gain.setTargetAtTime(0.45 + p * 0.25, t, 0.4);
      // whoosh follows scroll speed, brightest while the doors move
      const door = Math.sin(clamp((p - 0.25) / 0.45) * Math.PI);
      whooshGain.gain.setTargetAtTime(clamp(vel / 60) * 0.18 * (0.35 + door), t, 0.12);
      whooshFilt.frequency.setTargetAtTime(350 + door * 1400, t, 0.2);
      lastP = p;
    }
    requestAnimationFrame(update);
  }

  function apply() {
    btn.setAttribute('aria-pressed', String(wanted));
    btn.setAttribute('aria-label', wanted ? 'Sound on. Click to mute' : 'Sound off. Click to turn on');
    label.textContent = wanted ? 'Sound on' : 'Sound off';
    if (!started) return;
    if (wanted && ac.state === 'suspended') ac.resume();
    master.gain.cancelScheduledValues(ac.currentTime);
    master.gain.setTargetAtTime(wanted ? 0.28 : 0, ac.currentTime, 0.5);   // fade, never cut
  }

  function start() {
    if (!wanted) return;
    if (!started) build();
    if (ac.state === 'suspended') ac.resume();
    apply();
  }

  btn.addEventListener('click', e => {
    e.stopPropagation();
    wanted = !wanted;
    try { localStorage.setItem('apex-sound', wanted ? 'on' : 'off'); } catch (err) {}
    if (wanted && !started) build();
    apply();
  });

  // first allowed gesture starts the sound (wheel-scrolling alone is not an allowed gesture)
  window.apexSound = { set(on) { wanted = on; try { localStorage.setItem('apex-sound', on ? 'on' : 'off'); } catch (e) {} if (on && !started) build(); apply(); } };
  const unlock = (ev) => { if (ev && ev.target && ev.target.closest && ev.target.closest('[data-nosound]')) return; start(); ['pointerdown', 'keydown', 'touchend'].forEach(ev => removeEventListener(ev, unlock, true)); };
  ['pointerdown', 'keydown', 'touchend'].forEach(ev => addEventListener(ev, unlock, true));
  try { start(); } catch (e) {}                         // works at once if the browser already allows it

  apply();
  requestAnimationFrame(update);
})();
