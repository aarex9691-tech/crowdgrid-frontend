// Pointer-driven 3D tilt: writes --rx / --ry (degrees) on the element, eased with requestAnimationFrame.
// Does nothing for touch-only devices or when the visitor asks for reduced motion (CSS keeps a gentle sway instead).
export function attachTilt(el, { max = 6, maxX = max / 2 } = {}) {
  if (!el || typeof window === 'undefined') return () => {};
  const fine = window.matchMedia?.('(hover: hover) and (pointer: fine)').matches;
  const calm = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
  if (!fine || calm) return () => {};

  let raf = 0;
  let tx = 0, ty = 0, cx = 0, cy = 0;
  const step = () => {
    cx += (tx - cx) * 0.12;
    cy += (ty - cy) * 0.12;
    el.style.setProperty('--ry', `${cx.toFixed(2)}deg`);
    el.style.setProperty('--rx', `${cy.toFixed(2)}deg`);
    raf = Math.abs(tx - cx) + Math.abs(ty - cy) > 0.02 ? requestAnimationFrame(step) : 0;
  };
  const kick = () => { if (!raf) raf = requestAnimationFrame(step); };
  const move = (e) => {
    const r = el.getBoundingClientRect();
    tx = ((e.clientX - r.left) / r.width - 0.5) * 2 * max;
    ty = -((e.clientY - r.top) / r.height - 0.5) * 2 * maxX;
    el.dataset.tilting = '1';
    kick();
  };
  const leave = () => { tx = 0; ty = 0; delete el.dataset.tilting; kick(); };
  el.addEventListener('pointermove', move);
  el.addEventListener('pointerleave', leave);
  return () => {
    el.removeEventListener('pointermove', move);
    el.removeEventListener('pointerleave', leave);
    if (raf) cancelAnimationFrame(raf);
  };
}

/** Pause CSS animations inside `el` while it is off screen (saves battery on phones). */
export function pauseOffscreen(el) {
  if (!el || typeof IntersectionObserver === 'undefined') return () => {};
  const io = new IntersectionObserver(([entry]) => { el.dataset.offscreen = entry.isIntersecting ? '0' : '1'; }, { rootMargin: '80px' });
  io.observe(el);
  return () => io.disconnect();
}
