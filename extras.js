/* Extras: config-driven footer, working enquiry form, model request links, intro fade, lazy specs video. */
(() => {
  /* the 2.7 MB specs video only starts downloading when the section is near */
  const sv = document.getElementById('specsVideo');
  if (sv && sv.dataset.src) {
    const start = () => { sv.src = sv.dataset.src; sv.load(); };
    if ('IntersectionObserver' in window) {
      const io = new IntersectionObserver(([e]) => { if (e.isIntersecting) { io.disconnect(); start(); } }, { rootMargin: '2000px 0px' });
      io.observe(sv);
    } else start();
  }
  const cfg = window.APEX_CONFIG || {};

  /* footer contact: only show real details */
  const fc = document.getElementById('footContact');
  if (fc && (cfg.email || cfg.phone)) {
    fc.innerHTML = '';
    if (cfg.email) { const a = document.createElement('a'); a.href = 'mailto:' + cfg.email; a.textContent = cfg.email; fc.appendChild(a); }
    if (cfg.phone) { const a = document.createElement('a'); a.href = 'tel:' + cfg.phone.replace(/[^+\d]/g, ''); a.textContent = cfg.phone; fc.appendChild(a); }
  }

  /* hero intro fades once the visitor scrolls */
  const intro = document.getElementById('h2Intro');
  if (intro) {
    const upd = () => intro.classList.toggle('gone', scrollY > innerHeight * 0.12);
    addEventListener('scroll', upd, { passive: true }); upd();
  }

  /* "Request this model" pre-fills the form */
  const model = document.getElementById('enqModel');
  const status = document.getElementById('formStatus');
  document.querySelectorAll('.mst-link').forEach(a => a.addEventListener('click', () => {
    if (model) model.value = a.dataset.model || '';
    if (status && a.dataset.model) { status.className = 'form-status'; status.textContent = 'Enquiring about: ' + a.dataset.model; }
  }));

  /* enquiry form: validation + real submit when an endpoint is configured */
  const form = document.getElementById('enquiryForm');
  if (!form) return;
  const say = (msg, cls) => { status.className = 'form-status ' + (cls || ''); status.textContent = msg; };
  form.addEventListener('submit', async e => {
    e.preventDefault();
    const name = form.elements.name, email = form.elements.email;
    const okName = name.value.trim().length >= 2;
    const okMail = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email.value.trim());
    name.setAttribute('aria-invalid', String(!okName));
    email.setAttribute('aria-invalid', String(!okMail));
    if (!okName || !okMail) { say(!okName ? 'Please enter your name.' : 'Please enter a valid email address.', 'err'); (okName ? email : name).focus(); return; }
    const btn = form.querySelector('button[type=submit]');
    if (!cfg.formEndpoint) { say('Demo mode: no form endpoint is set yet, so nothing was sent. Add one in site-config.js.', 'err'); return; }
    btn.disabled = true; say('Sending...');
    try {
      const res = await fetch(cfg.formEndpoint, { method: 'POST', headers: { 'Content-Type': 'application/json', Accept: 'application/json' }, body: JSON.stringify(Object.fromEntries(new FormData(form))) });
      if (!res.ok) throw new Error(res.status);
      say('Thank you. Your request has been received.', 'ok'); form.reset();
    } catch (err) { say('Sorry, that did not send. Please try again.', 'err'); }
    btn.disabled = false;
  });
})();
