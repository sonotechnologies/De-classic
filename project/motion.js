// De Classic motion: data-anim="wipe|rise|settle", data-delay, data-sticker, data-reveal, data-lights
(function () {
  if (window.__dcMotion) return; window.__dcMotion = true;
  const seen = new WeakSet();
  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const mobile = () => innerWidth < 760;
  const ease = 'cubic-bezier(.2,.8,.2,1)';
  const fade = (el, d) => el.animate([{ opacity: 0 }, { opacity: 1 }], { duration: 200, delay: d, easing: 'ease-out', fill: 'backwards' });
  const io = new IntersectionObserver((entries) => {
    entries.forEach((e) => {
      if (!e.isIntersecting) return;
      const el = e.target; io.unobserve(el);
      if (el.hasAttribute('data-sticker')) {
        if (reduce) return fade(el, 0);
        const t = getComputedStyle(el).transform; const end = t === 'none' ? 'none' : t;
        el.animate([{ transform: 'scale(0) rotate(-60deg)' }, { transform: end }], { duration: 380, delay: 120, easing: 'cubic-bezier(.3,1.4,.5,1)', fill: 'backwards' });
      } else if (el.hasAttribute('data-block')) {
        el.animate([{ transform: 'translateY(96px)' }, { transform: 'none' }], { duration: 400, easing: ease });
        el.style.transform = '';
      } else if (el.hasAttribute('data-reveal')) {
        if (reduce) return fade(el, 0);
        el.animate([{ opacity: 0, transform: 'translateY(32px)' }, { opacity: 1, transform: 'none' }], { duration: 400, easing: ease, fill: 'backwards' });
      }
    });
  }, { threshold: 0.15 });
  const lightsIO = new IntersectionObserver((entries) => {
    entries.forEach((e) => {
      if (e.intersectionRatio < 0.3) return;
      const el = e.target; lightsIO.unobserve(el);
      el.style.backgroundColor = ''; [...el.children].forEach((c) => (c.style.visibility = ''));
    });
  }, { threshold: [0, 0.3] });
  function scan() {
    document.querySelectorAll('[data-anim],[data-sticker],[data-reveal],[data-lights],[data-block]').forEach((el) => {
      if (seen.has(el)) return; seen.add(el);
      const d = +(el.getAttribute('data-delay') || 0);
      const kind = el.getAttribute('data-anim');
      if (kind) {
        if (reduce) return fade(el, d);
        if (kind === 'wipe') el.animate([{ clipPath: 'inset(0 0 100% 0)' }, { clipPath: 'inset(0 0 0 0)' }], { duration: 400, delay: d, easing: ease, fill: 'backwards' });
        else if (mobile()) return;
        else if (kind === 'rise') el.animate([{ opacity: 0, transform: 'translateY(0.5em)' }, { opacity: 1, transform: 'none' }], { duration: 360, delay: d, easing: ease, fill: 'backwards' });
        else if (kind === 'settle') el.animate([{ opacity: 0, transform: 'translateY(40px)' }, { opacity: 1, transform: 'none' }], { duration: 400, delay: d, easing: ease, fill: 'backwards' });
        return;
      }
      if (el.hasAttribute('data-sticker')) return io.observe(el);
      if (el.hasAttribute('data-reveal')) { if (!mobile()) io.observe(el); return; }
      if (el.hasAttribute('data-block')) {
        if (reduce || mobile() || el.getBoundingClientRect().top < innerHeight) return;
        el.style.position = el.style.position || 'relative'; el.style.zIndex = el.style.zIndex || '2';
        el.style.transform = 'translateY(96px)'; io.observe(el); return;
      }
      if (el.hasAttribute('data-lights') && !reduce && !mobile()) {
        const r = el.getBoundingClientRect(); if (r.top < innerHeight * 0.7) return;
        el.style.backgroundColor = '#FFFFFF'; [...el.children].forEach((c) => (c.style.visibility = 'hidden'));
        lightsIO.observe(el);
      }
    });
  }
  let q = 0; const schedule = () => { if (!q) q = requestAnimationFrame(() => { q = 0; scan(); }); };
  new MutationObserver(schedule).observe(document.documentElement, { childList: true, subtree: true });
  schedule();
})();
