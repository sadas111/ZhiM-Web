"use client";

import { useEffect, useMemo, useState } from "react";

export default function TechOverlay() {
  const reducedMotionQuery = useMemo(
    () =>
      typeof window === "undefined"
        ? null
        : window.matchMedia("(prefers-reduced-motion: reduce)"),
    [],
  );
  const [reduced, setReduced] = useState(false);

  useEffect(() => {
    if (!reducedMotionQuery) return;
    const onChange = () => setReduced(!!reducedMotionQuery.matches);
    onChange();
    reducedMotionQuery.addEventListener("change", onChange);
    return () => reducedMotionQuery.removeEventListener("change", onChange);
  }, [reducedMotionQuery]);

  return (
    <div
      aria-hidden="true"
      className={[
        "pointer-events-none fixed inset-0 -z-[1]",
        // Use low opacity so content remains crisp
        "opacity-[0.55] dark:opacity-[0.45]",
      ].join(" ")}
    >
      {/* Film grain / noise (CSS-only, ultra subtle) */}
      <div
        className="absolute inset-0 mix-blend-overlay"
        style={{
          backgroundImage:
            "radial-gradient(circle at 10% 20%, rgba(56,189,248,0.10) 0.5px, transparent 1px), radial-gradient(circle at 70% 60%, rgba(34,211,238,0.08) 0.5px, transparent 1px)",
          backgroundSize: "18px 18px, 22px 22px",
          backgroundPosition: "0 0, 9px 11px",
          opacity: 0.22,
        }}
      />

      {/* Scanlines */}
      <div
        className={[
          "absolute inset-0",
          reduced ? "" : "animate-[tech-scan_10s_linear_infinite]",
        ].join(" ")}
        style={{
          backgroundImage:
            "linear-gradient(to bottom, rgba(2,132,199,0.00) 0%, rgba(2,132,199,0.06) 40%, rgba(2,132,199,0.00) 80%)",
          backgroundSize: "100% 240px",
          opacity: 0.20,
        }}
      />

      {/* Diagonal light sweep */}
      <div
        className={[
          "absolute inset-0",
          reduced ? "" : "animate-[tech-sweep_14s_ease-in-out_infinite]",
        ].join(" ")}
        style={{
          backgroundImage:
            "linear-gradient(110deg, rgba(56,189,248,0) 0%, rgba(56,189,248,0.10) 35%, rgba(34,211,238,0.06) 50%, rgba(56,189,248,0) 65%)",
          transform: "translateX(-35%)",
          opacity: 0.18,
          filter: "blur(0.2px)",
        }}
      />
    </div>
  );
}

