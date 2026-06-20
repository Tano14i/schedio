/* ── Sampietrino — main.js ──────────────────────────────
   Smooth scroll · Custom cursor · Nav on scroll · Reveals
   ─────────────────────────────────────────────────────── */

/* Custom cursor */
(function initCursor() {
  if (window.matchMedia('(hover: none)').matches) return;

  const cursor = document.createElement('div');
  cursor.className = 'cursor';
  const ring = document.createElement('div');
  ring.className = 'cursor-ring';
  document.body.appendChild(cursor);
  document.body.appendChild(ring);

  let mx = -100, my = -100;
  let rx = -100, ry = -100;

  document.addEventListener('mousemove', e => {
    mx = e.clientX;
    my = e.clientY;
  });

  function tick() {
    rx += (mx - rx) * 0.12;
    ry += (my - ry) * 0.12;

    cursor.style.left = mx + 'px';
    cursor.style.top  = my + 'px';
    ring.style.left   = rx + 'px';
    ring.style.top    = ry + 'px';

    requestAnimationFrame(tick);
  }
  tick();
})();

/* Nav scroll behaviour */
(function initNav() {
  const nav = document.querySelector('.nav');
  if (!nav) return;

  function update() {
    if (window.scrollY > 60) {
      nav.classList.add('nav--scrolled');
    } else {
      nav.classList.remove('nav--scrolled');
    }
  }

  window.addEventListener('scroll', update, { passive: true });
  update();
})();

/* Scroll reveal — IntersectionObserver */
(function initReveal() {
  const els = document.querySelectorAll('[data-reveal]');
  if (!els.length) return;

  const io = new IntersectionObserver(entries => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add('revealed');
        io.unobserve(entry.target);
      }
    });
  }, { threshold: 0.12, rootMargin: '0px 0px -40px 0px' });

  els.forEach(el => io.observe(el));
})();

/* Smooth scroll for anchor links */
document.querySelectorAll('a[href^="#"]').forEach(link => {
  link.addEventListener('click', e => {
    const target = document.querySelector(link.getAttribute('href'));
    if (!target) return;
    e.preventDefault();
    target.scrollIntoView({ behavior: 'smooth', block: 'start' });
  });
});

/* Details/accordion animation */
document.querySelectorAll('.details').forEach(details => {
  const summary = details.querySelector('.details__summary');
  if (!summary) return;
  summary.addEventListener('click', () => {});
});

/* Remo popup */
(function initRemoPopup() {
  const popup = document.getElementById('remo-popup');
  const closeBtn = document.getElementById('remo-popup-close');
  if (!popup) return;

  if (sessionStorage.getItem('remo-seen')) return;

  setTimeout(() => {
    popup.classList.add('is-visible');
  }, 2800);

  function dismiss() {
    popup.classList.remove('is-visible');
    setTimeout(() => popup.classList.add('is-gone'), 450);
    sessionStorage.setItem('remo-seen', '1');
  }

  closeBtn.addEventListener('click', dismiss);

  popup.querySelector('.remo-popup__cta')?.addEventListener('click', () => {
    sessionStorage.setItem('remo-seen', '1');
  });
})();
