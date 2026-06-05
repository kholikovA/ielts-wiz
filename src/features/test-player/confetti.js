// Branded confetti celebration — a faithful port of the standalone-HTML test
// pages' launchConfetti(): on-brand pieces (wizard hats, wands, sparkles, dots),
// a full-width gentle staggered rain in IELTS-Wiz purples + gold. Self-clearing.
// Fired for band 7.0+ on a full test (see ResultsScreen). No-ops in jsdom.

function confSparkle(ctx, r) {
  ctx.beginPath();
  ctx.moveTo(0, -r);
  ctx.quadraticCurveTo(r * 0.2, -r * 0.2, r, 0);
  ctx.quadraticCurveTo(r * 0.2, r * 0.2, 0, r);
  ctx.quadraticCurveTo(-r * 0.2, r * 0.2, -r, 0);
  ctx.quadraticCurveTo(-r * 0.2, -r * 0.2, 0, -r);
  ctx.closePath();
  ctx.fill();
}

function confDrawPiece(ctx, p) {
  const s = p.size;
  ctx.fillStyle = p.color;
  switch (p.shape) {
    case 'hat': // wizard hat: cone + brim
      ctx.beginPath();
      ctx.moveTo(0, -s * 0.9); ctx.lineTo(s * 0.5, s * 0.4); ctx.lineTo(-s * 0.5, s * 0.4);
      ctx.closePath(); ctx.fill();
      ctx.fillRect(-s * 0.72, s * 0.36, s * 1.44, s * 0.26);
      break;
    case 'wand': // stick + gold star tip
      ctx.fillRect(-s * 0.1, -s * 0.15, s * 0.2, s * 1.05);
      ctx.fillStyle = '#fcd34d';
      ctx.save(); ctx.translate(0, -s * 0.5); confSparkle(ctx, s * 0.5); ctx.restore();
      break;
    case 'sparkle':
      confSparkle(ctx, s * 0.9);
      break;
    case 'dot':
      ctx.beginPath(); ctx.arc(0, 0, s * 0.42, 0, Math.PI * 2); ctx.fill();
      break;
    default: // rect
      ctx.fillRect(-s / 2, -s / 3, s, s / 1.6);
  }
}

function confPickShape() {
  const r = Math.random();
  if (r < 0.30) return 'sparkle';
  if (r < 0.55) return 'hat';
  if (r < 0.75) return 'wand';
  if (r < 0.90) return 'dot';
  return 'rect';
}

export function fireConfetti() {
  try {
    if (typeof document === 'undefined' || typeof requestAnimationFrame !== 'function') return;
    if (typeof window !== 'undefined' && window.matchMedia &&
        window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

    const canvas = document.createElement('canvas');
    canvas.style.cssText = 'position:fixed;inset:0;pointer-events:none;z-index:9999;';
    const dpr = window.devicePixelRatio || 1;
    canvas.width = window.innerWidth * dpr;
    canvas.height = window.innerHeight * dpr;
    canvas.style.width = window.innerWidth + 'px';
    canvas.style.height = window.innerHeight + 'px';
    const ctx = canvas.getContext && canvas.getContext('2d');
    if (!ctx) return; // jsdom / unsupported
    document.body.appendChild(canvas);
    ctx.scale(dpr, dpr);

    // On-brand palette: purples, gold, light.
    const COLORS = ['#7c3aed', '#9333ea', '#a855f7', '#6d28d9', '#c4b5fd', '#fcd34d', '#fbbf24', '#ffffff'];
    const W = window.innerWidth;
    const H = window.innerHeight;
    const particles = [];

    // Full-width gentle rain of branded pieces, drifting down slowly.
    const TOTAL = 113;
    function spawnOne() {
      particles.push({
        x: Math.random() * W,
        y: -20 - Math.random() * 200, // staggered above the viewport
        vx: (Math.random() - 0.5) * 1.2,
        vy: 0.75 + Math.random() * 0.9,
        size: 10 + Math.random() * 12,
        color: COLORS[(Math.random() * COLORS.length) | 0],
        rot: Math.random() * Math.PI * 2,
        vrot: (Math.random() - 0.5) * 0.08,
        shape: confPickShape(),
        sway: Math.random() * Math.PI * 2,
        swaySpeed: 0.02 + Math.random() * 0.03,
      });
    }
    // Stagger spawns so they cascade down the screen.
    let spawned = 0;
    const spawnInterval = setInterval(() => {
      const batch = 6;
      for (let i = 0; i < batch && spawned < TOTAL; i++) { spawnOne(); spawned++; }
      if (spawned >= TOTAL) clearInterval(spawnInterval);
    }, 50);

    const gravity = 0.025; // gentle fall
    let frame = 0;
    function tick() {
      frame++;
      ctx.clearRect(0, 0, W, H);
      for (let i = particles.length - 1; i >= 0; i--) {
        const p = particles[i];
        p.vy += gravity;
        p.sway += p.swaySpeed;
        p.x += p.vx + Math.sin(p.sway) * 0.6; // gentle horizontal drift
        p.y += p.vy;
        p.rot += p.vrot;
        if (p.y > H + 30) { particles.splice(i, 1); continue; }
        // Fade-out only near the bottom of the screen.
        const alpha = p.y > H - 80 ? Math.max(0, (H - p.y) / 80) : 1;
        ctx.save();
        ctx.globalAlpha = alpha;
        ctx.translate(p.x, p.y);
        ctx.rotate(p.rot);
        confDrawPiece(ctx, p);
        ctx.restore();
      }
      if ((particles.length > 0 || spawned < TOTAL) && frame < 2400) {
        requestAnimationFrame(tick);
      } else {
        canvas.remove();
        clearInterval(spawnInterval);
      }
    }
    requestAnimationFrame(tick);
  } catch { /* never let a cosmetic effect break the page */ }
}
