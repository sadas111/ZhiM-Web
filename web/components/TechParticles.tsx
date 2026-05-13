"use client";

import { useEffect, useMemo, useRef } from "react";

type Particle = {
  x: number;
  y: number;
  vx: number;
  vy: number;
  r: number;
};

function clamp(n: number, min: number, max: number) {
  return Math.max(min, Math.min(max, n));
}

export default function TechParticles() {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const rafRef = useRef<number | null>(null);
  const particlesRef = useRef<Particle[]>([]);
  const pointerRef = useRef<{ x: number; y: number; active: boolean }>({
    x: 0,
    y: 0,
    active: false,
  });

  const reducedMotionQuery = useMemo(
    () =>
      typeof window === "undefined"
        ? null
        : window.matchMedia("(prefers-reduced-motion: reduce)"),
    [],
  );

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const isReducedMotion = () => !!reducedMotionQuery?.matches;

    const dpr = () => Math.max(1, Math.min(2, window.devicePixelRatio || 1));
    const size = () => {
      const w = window.innerWidth;
      const h = window.innerHeight;
      const ratio = dpr();
      canvas.width = Math.floor(w * ratio);
      canvas.height = Math.floor(h * ratio);
      canvas.style.width = `${w}px`;
      canvas.style.height = `${h}px`;
      ctx.setTransform(ratio, 0, 0, ratio, 0, 0);
      return { w, h };
    };

    let { w, h } = size();

    const density = 0.000115; // particles per px^2
    const maxParticles = 210;
    const minParticles = 80;

    const createParticles = () => {
      const target = clamp(
        Math.round(w * h * density),
        minParticles,
        maxParticles,
      );
      const next: Particle[] = [];
      for (let i = 0; i < target; i++) {
        const speed = (Math.random() * 0.22 + 0.06) * (Math.random() < 0.5 ? -1 : 1);
        const speed2 = (Math.random() * 0.22 + 0.06) * (Math.random() < 0.5 ? -1 : 1);
        next.push({
          x: Math.random() * w,
          y: Math.random() * h,
          vx: speed,
          vy: speed2,
          r: Math.random() * 1.2 + 0.7,
        });
      }
      particlesRef.current = next;
    };

    createParticles();

    const getColors = () => {
      const root = document.documentElement;
      const styles = getComputedStyle(root);
      const primary = styles.getPropertyValue("--primary").trim(); // "199 92% 46%"
      const ring = styles.getPropertyValue("--ring").trim() || primary;

      const parseHsl = (raw: string) => {
        const parts = raw.split(/\s+/).filter(Boolean);
        const h = Number(parts[0] ?? 199);
        const s = parts[1] ?? "92%";
        const l = parts[2] ?? "46%";
        return `hsl(${h} ${s} ${l})`;
      };

      return {
        dot: parseHsl(primary),
        line: parseHsl(ring),
      };
    };

    let { dot, line } = getColors();
    const refreshColors = () => {
      const c = getColors();
      dot = c.dot;
      line = c.line;
    };

    const maxLinkDist = () => clamp(Math.min(w, h) * 0.17, 130, 220);
    const pointerLinkDist = () => clamp(Math.min(w, h) * 0.19, 150, 250);

    let lastT = performance.now();

    const step = (t: number) => {
      rafRef.current = requestAnimationFrame(step);
      if (isReducedMotion()) return;

      const dt = clamp((t - lastT) / 16.67, 0.5, 2);
      lastT = t;

      ctx.clearRect(0, 0, w, h);

      const parts = particlesRef.current;
      const linkDist = maxLinkDist();
      const linkDist2 = linkDist * linkDist;

      const ptr = pointerRef.current;

      // subtle fade at edges to keep center focus
      const vignette = ctx.createRadialGradient(
        w * 0.5,
        h * 0.25,
        0,
        w * 0.5,
        h * 0.4,
        Math.max(w, h),
      );
      vignette.addColorStop(0, "rgba(0,0,0,0)");
      vignette.addColorStop(1, "rgba(0,0,0,0.10)");

      // links
      ctx.lineWidth = 1;
      for (let i = 0; i < parts.length; i++) {
        const a = parts[i]!;
        for (let j = i + 1; j < parts.length; j++) {
          const b = parts[j]!;
          const dx = a.x - b.x;
          const dy = a.y - b.y;
          const d2 = dx * dx + dy * dy;
          if (d2 > linkDist2) continue;

          const alpha = (1 - d2 / linkDist2) * 0.32;
          ctx.strokeStyle = line.replace("hsl(", "hsla(").replace(")", ` / ${alpha})`);
          ctx.beginPath();
          ctx.moveTo(a.x, a.y);
          ctx.lineTo(b.x, b.y);
          ctx.stroke();
        }
      }

      // dots
      ctx.fillStyle = dot.replace("hsl(", "hsla(").replace(")", " / 0.68)");
      for (const p of parts) {
        // subtle attraction to pointer
        if (ptr.active) {
          const dxp = ptr.x - p.x;
          const dyp = ptr.y - p.y;
          const d2p = dxp * dxp + dyp * dyp;
          const maxD = pointerLinkDist();
          const maxD2 = maxD * maxD;
          if (d2p < maxD2) {
            const f = (1 - d2p / maxD2) * 0.0026;
            p.vx += dxp * f;
            p.vy += dyp * f;
          }
        }

        p.x += p.vx * dt;
        p.y += p.vy * dt;

        // damping to prevent runaway speeds
        p.vx *= 0.995;
        p.vy *= 0.995;

        if (p.x < -20) p.x = w + 20;
        else if (p.x > w + 20) p.x = -20;
        if (p.y < -20) p.y = h + 20;
        else if (p.y > h + 20) p.y = -20;

        ctx.beginPath();
        ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
        ctx.fill();
      }

      // connect pointer to nearby particles (extra "net" feel)
      if (ptr.active) {
        const d = pointerLinkDist();
        const d2 = d * d;
        ctx.lineWidth = 1;
        for (const p of parts) {
          const dx = ptr.x - p.x;
          const dy = ptr.y - p.y;
          const dist2 = dx * dx + dy * dy;
          if (dist2 > d2) continue;
          const alpha = (1 - dist2 / d2) * 0.35;
          ctx.strokeStyle = line.replace("hsl(", "hsla(").replace(")", ` / ${alpha})`);
          ctx.beginPath();
          ctx.moveTo(ptr.x, ptr.y);
          ctx.lineTo(p.x, p.y);
          ctx.stroke();
        }
      }

      ctx.fillStyle = vignette;
      ctx.fillRect(0, 0, w, h);
    };

    const onResize = () => {
      ({ w, h } = size());
      createParticles();
    };

    const onThemeChanged = () => refreshColors();
    const onPointerMove = (e: PointerEvent) => {
      pointerRef.current = { x: e.clientX, y: e.clientY, active: true };
    };
    const onPointerLeave = () => {
      pointerRef.current.active = false;
    };

    window.addEventListener("resize", onResize, { passive: true });
    window.addEventListener("pointermove", onPointerMove, { passive: true });
    window.addEventListener("pointerdown", onPointerMove, { passive: true });
    window.addEventListener("pointerleave", onPointerLeave, { passive: true });
    // Observe class changes on <html> to refresh HSL variables (dark/light)
    const mo = new MutationObserver(onThemeChanged);
    mo.observe(document.documentElement, { attributes: true, attributeFilter: ["class"] });

    rafRef.current = requestAnimationFrame(step);

    // If reduced motion, draw one static frame
    if (isReducedMotion()) {
      refreshColors();
      ctx.clearRect(0, 0, w, h);
      ctx.fillStyle = dot.replace("hsl(", "hsla(").replace(")", " / 0.3)");
      for (const p of particlesRef.current) {
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
        ctx.fill();
      }
    }

    return () => {
      window.removeEventListener("resize", onResize);
      window.removeEventListener("pointermove", onPointerMove);
      window.removeEventListener("pointerdown", onPointerMove);
      window.removeEventListener("pointerleave", onPointerLeave);
      mo.disconnect();
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <canvas
      ref={canvasRef}
      className="pointer-events-none fixed inset-0 -z-[2]"
      aria-hidden="true"
    />
  );
}

