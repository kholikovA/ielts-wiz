// Dependency-free confetti burst for a celebration-worthy result. Spawns a
// short-lived, full-screen, pointer-events-none canvas, rains physics-driven
// paper, then removes itself. No-ops where canvas/RAF aren't available (jsdom).

const COLORS = ['#7c3aed', '#9333ea', '#22c55e', '#fcd34d', '#38bdf8', '#f472b6', '#ffffff'];

export function fireConfetti({ count = 140, durationMs = 2600 } = {}) {
  try {
    if (typeof document === 'undefined' || typeof requestAnimationFrame !== 'function') return;
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext && canvas.getContext('2d');
    if (!ctx) return; // jsdom / unsupported

    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    const resize = () => {
      canvas.width = window.innerWidth * dpr;
      canvas.height = window.innerHeight * dpr;
    };
    resize();
    Object.assign(canvas.style, {
      position: 'fixed', inset: '0', width: '100%', height: '100%',
      pointerEvents: 'none', zIndex: '90',
    });
    document.body.appendChild(canvas);
    ctx.scale(dpr, dpr);

    const W = () => window.innerWidth;
    const H = () => window.innerHeight;
    // Two bursts from the lower corners, angled inward and up — reads as a pop.
    const rand = (a, b) => a + Math.random() * (b - a);
    const make = (originX, dir) => ({
      x: originX, y: H() * 0.62,
      vx: dir * rand(4, 13), vy: rand(-17, -9),
      g: rand(0.28, 0.42), drag: 0.985,
      size: rand(6, 11), rot: rand(0, Math.PI * 2), vr: rand(-0.25, 0.25),
      color: COLORS[(Math.random() * COLORS.length) | 0],
      flip: rand(0, Math.PI * 2), vf: rand(0.1, 0.3),
    });
    const parts = [];
    for (let i = 0; i < count; i++) parts.push(make(i % 2 ? W() * 0.85 : W() * 0.15, i % 2 ? -1 : 1));

    const start = performance.now();
    const tick = (now) => {
      const elapsed = now - start;
      ctx.clearRect(0, 0, W(), H());
      const fade = Math.max(0, 1 - Math.max(0, elapsed - durationMs * 0.55) / (durationMs * 0.45));
      ctx.globalAlpha = fade;
      for (const p of parts) {
        p.vx *= p.drag; p.vy = p.vy * p.drag + p.g;
        p.x += p.vx; p.y += p.vy; p.rot += p.vr; p.flip += p.vf;
        ctx.save();
        ctx.translate(p.x, p.y);
        ctx.rotate(p.rot);
        ctx.scale(1, Math.cos(p.flip)); // flutter
        ctx.fillStyle = p.color;
        ctx.fillRect(-p.size / 2, -p.size / 2, p.size, p.size * 0.62);
        ctx.restore();
      }
      if (elapsed < durationMs) {
        requestAnimationFrame(tick);
      } else {
        canvas.remove();
        window.removeEventListener('resize', resize);
      }
    };
    window.addEventListener('resize', resize);
    requestAnimationFrame(tick);
  } catch { /* never let a cosmetic effect break the page */ }
}
