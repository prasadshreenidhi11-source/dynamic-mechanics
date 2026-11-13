/* Hero technical callouts: lines anchor to car parts, cards reveal with scroll */
(() => {
  const layer = document.getElementById('techlayer');
  const hero = document.getElementById('hero');
  const svg = document.getElementById('techLines');
  if (!layer || !hero || !svg) return;
  const items = [...layer.querySelectorAll('.tech')];
  const NS = 'http://www.w3.org/2000/svg';
  const lines = items.map(() => {
    const l = document.createElementNS(NS, 'line');
    l.setAttribute('pathLength', '1');
    svg.appendChild(l);
    return l;
  });

  function layout() {
    const lr = layer.getBoundingClientRect();
    svg.setAttribute('viewBox', `0 0 ${lr.width} ${lr.height}`);
    items.forEach((it, i) => {
      const d = it.querySelector('.tdot').getBoundingClientRect();
      const c = it.querySelector('.tcard').getBoundingClientRect();
      const x1 = d.left + d.width / 2 - lr.left, y1 = d.top + d.height / 2 - lr.top;
      // end on the card edge nearest the dot
      const cx = c.left - lr.left, cy = c.top - lr.top;
      const x2 = Math.min(Math.max(x1, cx), cx + c.width);
      const y2 = Math.min(Math.max(y1, cy), cy + c.height);
      const l = lines[i];
      l.setAttribute('x1', x1); l.setAttribute('y1', y1);
      l.setAttribute('x2', x2); l.setAttribute('y2', y2);
    });
  }

  function update() {
    const rect = hero.getBoundingClientRect();
    const total = hero.offsetHeight - window.innerHeight;
    const p = Math.min(1, Math.max(0, -rect.top / total));
    items.forEach((it, i) => {
      const on = p >= parseFloat(it.dataset.th) && (!window.apexSpin || window.apexSpin.staticOk());
      it.classList.toggle('on', on);
      lines[i].classList.toggle('on', on);
    });
  }

  window.addEventListener('resize', () => { layout(); update(); });
  window.addEventListener('scroll', update, { passive: true });
  setInterval(update, 120);                       // also follows the car while it is being turned
  layout(); update();
  setTimeout(layout, 600);
})();
