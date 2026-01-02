/**
 * @fileoverview DustLayer component renders a canvas-based dust particle effect.
 * <br><br>
 * This component creates a visually appealing dust effect using HTML5 canvas. <br>
 * It allows customization of particle density, size, speed, sway, color tint, and opacity.
 */

import { useEffect, useRef } from "react";

/**
 * DustLayer component renders a canvas-based dust particle effect.
 * <br><br>
 * This component creates a visually appealing dust effect using HTML5 canvas. <br>
 * It allows customization of particle density, size, speed, sway, color tint, and opacity.
 * <br><br>
 * <strong>Props:</strong> <br>
 * - density (number): Number of dust particles to render. Default is 70. <br>
 * - maxSize (number): Maximum size of dust particles in pixels. Default is 2.2. <br>
 * - minSize (number): Minimum size of dust particles in pixels. Default is 0.6. <br>
 * - speed (number): Base upward speed of dust particles. Default is 0.12. <br>
 * - sway (number): Horizontal sway amplitude of dust particles. Default is 0.35. <br>
 * - tint (string): RGB color string for dust particle color. Default is "255,255,255" (white). <br>
 * - opacity (number): Overall opacity of dust particles. Default is 0.18. <br>
 *
 * @function DustLayer
 * @param {number} [density=70] - Number of dust particles.
 * @param {number} [maxSize=2.2] - Maximum size of dust particles in pixels.
 * @param {number} [minSize=0.6] - Minimum size of dust particles in pixels.
 * @param {number} [speed=0.12] - Base upward speed of dust particles.
 * @param {number} [sway=0.35] - Horizontal sway amplitude of dust particles.
 * @param {string} [tint="255,255,255"] - RGB color string for dust particle color.
 * @param {number} [opacity=0.18] - Overall opacity of dust particles.
 * @returns {JSX.Element} The DustLayer component.
 */
export default function DustLayer({
  density = 70,           // number of particles
  maxSize = 2.2,          // px
  minSize = 0.6,          // px
  speed = 0.12,           // base upward speed
  sway = 0.35,            // horizontal sway amplitude
  tint = "255,255,255",   // RGB: white dust; try "255,215,0" for warm/gold
  opacity = 0.18,         // overall alpha for particles
} = {}) {
  const canvasRef = useRef(null);
  const rafRef = useRef(0);

  useEffect(() => {
    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d", { alpha: true, desynchronized: true });

    let w, h;

    const resizeCanvas = () => {
      const { innerWidth, innerHeight } = window;
      canvas.width = innerWidth;
      canvas.height = innerHeight;
      w = innerWidth;
      h = innerHeight;
    };

    // First correct sizing
    resizeCanvas();

    // Fix initial wrong size (THIS LINE FIXES YOUR ISSUE)
    requestAnimationFrame(resizeCanvas);

    window.addEventListener("resize", resizeCanvas);

    const particles = Array.from({ length: density }).map(() => seed());

    function seed() {
      return {
        x: Math.random() * w,
        y: Math.random() * h,
        r: Math.random() * (maxSize - minSize) + minSize,
        v: speed * (0.6 + Math.random() * 0.8),  // 60%-140% speed variance
        a: Math.random() * Math.PI * 2,          // sway phase
        s: sway * (0.6 + Math.random() * 0.8),   // sway amplitude variance
        o: opacity * (0.7 + Math.random() * 0.6) // per-dot alpha variance
      };
    }

    let last = performance.now();
    function tick(now) {
      const dt = Math.min(40, now - last); // cap dt spikes
      last = now;

      ctx.clearRect(0, 0, w, h);

      // gradient that’s a touch brighter in the center (very subtle)
      const grad = ctx.createRadialGradient(w / 2, h * 0.7, 10, w / 2, h * 0.7, Math.max(w, h));
      grad.addColorStop(0, `rgba(${tint}, ${opacity * 0.01})`);
      grad.addColorStop(1, `rgba(${tint}, 0)`);
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, w, h);

      particles.forEach(p => {
        // upward movement
        p.y -= p.v * dt * 0.06;
        // gentle horizontal sway
        p.x += Math.sin(p.a += 0.0025 * dt) * p.s;

        // wrap around
        if (p.y < -10) { p.y = h + 10; p.x = Math.random() * w; }
        if (p.x < -10) p.x = w + 10;
        if (p.x > w + 10) p.x = -10;

        ctx.beginPath();
        ctx.fillStyle = `rgba(${tint}, ${p.o})`;
        ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
        ctx.fill();
      });

      rafRef.current = requestAnimationFrame(tick);
    }

    rafRef.current = requestAnimationFrame(tick);
    window.addEventListener("resize", resizeCanvas);

    // Respect reduced-motion users
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    if (mq.matches) cancelAnimationFrame(rafRef.current);

    return () => {
      cancelAnimationFrame(rafRef.current);
      window.removeEventListener("resize", resizeCanvas);
    };
  }, [density, maxSize, minSize, speed, sway, tint, opacity]);

  return (
    <canvas
      ref={canvasRef}
      className="pointer-events-none fixed inset-0 z-0"
      style={{ width: "100%", height: "100%" }}
      aria-hidden
    />
  );
}
