// Small self-contained canvas confetti burst — no new dependency (Phase B of
// the engagement/delight work). Purely decorative: `pointer-events-none` and
// `aria-hidden` so it can never block a click or intercept focus (the
// existing Playwright completion-flow e2e must keep working through it).
// Respects `prefers-reduced-motion`: renders nothing when the OS/browser
// requests reduced motion — the accompanying toast message alone carries the
// celebration then, matching this app's existing motion-safe: convention.

import { useEffect, useRef } from 'react';

import { prefersReducedMotion } from '../../lib/motion';

const COLORS = ['#6366f1', '#22c55e', '#f59e0b', '#ec4899', '#06b6d4'];
const PARTICLE_COUNT = 60;
const DURATION_MS = 1100;

interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  rotation: number;
  spin: number;
  size: number;
  color: string;
}

/** One-shot confetti burst from the top of the viewport. Unmount to clear. */
export function Confetti() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    if (prefersReducedMotion()) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const dpr = window.devicePixelRatio || 1;
    const width = window.innerWidth;
    const height = window.innerHeight;
    canvas.width = width * dpr;
    canvas.height = height * dpr;
    ctx.scale(dpr, dpr);

    const particles: Particle[] = Array.from({ length: PARTICLE_COUNT }, () => ({
      x: width / 2 + (Math.random() - 0.5) * width * 0.4,
      y: height * 0.15,
      vx: (Math.random() - 0.5) * 6,
      vy: Math.random() * -4 - 2,
      rotation: Math.random() * Math.PI * 2,
      spin: (Math.random() - 0.5) * 0.3,
      size: Math.random() * 5 + 4,
      color: COLORS[Math.floor(Math.random() * COLORS.length)] as string,
    }));

    const start = performance.now();
    let frame = 0;

    function tick(now: number) {
      const elapsed = now - start;
      ctx!.clearRect(0, 0, width, height);
      for (const p of particles) {
        p.vy += 0.15; // gravity
        p.x += p.vx;
        p.y += p.vy;
        p.rotation += p.spin;
        const fade = Math.max(0, 1 - elapsed / DURATION_MS);
        ctx!.save();
        ctx!.globalAlpha = fade;
        ctx!.translate(p.x, p.y);
        ctx!.rotate(p.rotation);
        ctx!.fillStyle = p.color;
        ctx!.fillRect(-p.size / 2, -p.size / 2, p.size, p.size * 0.6);
        ctx!.restore();
      }
      if (elapsed < DURATION_MS) {
        frame = requestAnimationFrame(tick);
      }
    }
    frame = requestAnimationFrame(tick);

    return () => cancelAnimationFrame(frame);
  }, []);

  if (prefersReducedMotion()) return null;

  return (
    <canvas
      ref={canvasRef}
      aria-hidden="true"
      className="pointer-events-none fixed inset-0 z-[60]"
      style={{ width: '100vw', height: '100vh' }}
    />
  );
}
