"use client";

import { useEffect, useMemo, useState } from "react";

export default function ZhiMaiMark() {
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
      className="pointer-events-none fixed inset-0 -z-[1] select-none"
    >
      {/* Watermark text */}
      <div
        className="absolute right-10 bottom-10"
        style={{
          opacity: 0.035,
          filter: "blur(0.2px)",
          maskImage:
            "radial-gradient(circle at 100% 100%, black 0%, transparent 70%)",
        }}
      >
        <div
          className="font-extrabold text-foreground/70"
          style={{
            fontSize: "clamp(26px, 3.8vw, 44px)",
            letterSpacing: "0.35em",
          }}
        >
          智脉
        </div>
      </div>

      {/* Neural / circuit paths (SVG) */}
      <svg
        className="absolute inset-0 h-full w-full"
        viewBox="0 0 1200 700"
        preserveAspectRatio="xMidYMid slice"
        style={{ opacity: 0.28 }}
      >
        <defs>
          <linearGradient id="zm-line" x1="0" y1="0" x2="1" y2="0">
            <stop offset="0%" stopColor="rgba(56,189,248,0.0)" />
            <stop offset="35%" stopColor="rgba(56,189,248,0.35)" />
            <stop offset="65%" stopColor="rgba(34,211,238,0.25)" />
            <stop offset="100%" stopColor="rgba(56,189,248,0.0)" />
          </linearGradient>
          <filter id="zm-soft">
            <feGaussianBlur stdDeviation="0.6" />
          </filter>
        </defs>

        {/* Static faint network */}
        <g stroke="rgba(2,132,199,0.12)" strokeWidth="1" fill="none">
          <path d="M80 420 C 220 360, 260 520, 420 470 S 680 420, 860 300 S 1050 210, 1180 260" />
          <path d="M140 520 C 320 440, 360 620, 520 560 S 740 520, 900 380 S 1050 280, 1180 320" />
          <path d="M60 300 C 220 240, 280 360, 420 320 S 650 260, 820 180 S 1040 120, 1180 160" />
          <path d="M120 220 C 260 160, 340 240, 480 220 S 720 200, 880 120 S 1040 60, 1180 80" />
        </g>

        {/* Animated pulse along a main path */}
        <g filter="url(#zm-soft)">
          <path
            id="zm-main"
            d="M70 470 C 260 400, 310 560, 500 500 S 760 430, 940 310 S 1090 240, 1200 280"
            stroke="url(#zm-line)"
            strokeWidth="2"
            fill="none"
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeDasharray="10 10"
            className={reduced ? "" : "zm-dash"}
          />

          {/* moving dot */}
          <circle r="3.2" fill="rgba(56,189,248,0.55)">
            <animateMotion
              dur={reduced ? "0s" : "6.8s"}
              repeatCount={reduced ? 0 : "indefinite"}
              keyTimes="0;1"
              keySplines="0.4 0 0.2 1"
              calcMode="spline"
            >
              <mpath href="#zm-main" />
            </animateMotion>
          </circle>
        </g>

        {/* Nodes */}
        <g fill="rgba(56,189,248,0.22)">
          <circle cx="420" cy="470" r="2.2" />
          <circle cx="520" cy="560" r="2.2" />
          <circle cx="740" cy="520" r="2.2" />
          <circle cx="880" cy="120" r="2.2" />
          <circle cx="860" cy="300" r="2.2" />
          <circle cx="260" cy="520" r="2.2" />
        </g>
      </svg>
    </div>
  );
}

