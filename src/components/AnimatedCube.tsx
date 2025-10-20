"use client";

import React, { useRef } from "react";
import { useGSAP } from "@gsap/react";
import { setupGSAP, gsap } from "@/lib/gsap";

type Props = {
  size?: number;
  className?: string;
};

export default function AnimatedCube({ size = 128, className }: Props) {
  const wrapRef = useRef<HTMLDivElement | null>(null);

  useGSAP(
    () => {
      setupGSAP();
      const wrap = wrapRef.current!;
      const cube = wrap.querySelector(".cube-group") as SVGGraphicsElement | null;
      const shadow = wrap.querySelector(".cube-shadow") as SVGGraphicsElement | null;

      gsap.set(wrap, { y: 0, scaleX: 1, scaleY: 1 });
      if (shadow) gsap.set(shadow, { scaleX: 1, opacity: 0.22, transformOrigin: "64px 100px" });
      if (cube) gsap.set(cube, { rotation: 0, svgOrigin: "64 72" });

      const tl = gsap.timeline({ repeat: -1, repeatDelay: 0.4 });
      tl.to(wrap, { y: -14, duration: 0.35, ease: "power2.out" })
        .to(shadow, { scaleX: 0.75, opacity: 0.28, duration: 0.35, ease: "power2.out" }, "<")
        .to(wrap, { y: 0, duration: 0.45, ease: "bounce.out" })
        .to(shadow, { scaleX: 1, opacity: 0.18, duration: 0.45, ease: "bounce.out" }, "<")
        .to(cube, { rotation: -6, duration: 0.22, ease: "sine.inOut" }, "-=0.2")
        .to(cube, { rotation: 5, duration: 0.22, ease: "sine.inOut" })
        .to(cube, { rotation: 0, duration: 0.2, ease: "sine.out" });
    },
    { scope: wrapRef }
  );

  return (
    <div ref={wrapRef} className={className} style={{ width: size, height: size }}>
      <svg
        width={size}
        height={size}
        viewBox="0 0 128 128"
        role="img"
        aria-label="Animated cube"
      >
        {/* Shadow */}
        <ellipse className="cube-shadow" cx="64" cy="104" rx="26" ry="8" fill="#0ea5e9" opacity="0.18" />

        {/* Cube group */}
        <g className="cube-group">
          <defs>
            <linearGradient id="faceLeft" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#0369a1" />
              <stop offset="100%" stopColor="#0ea5e9" />
            </linearGradient>
            <linearGradient id="faceRight" x1="100%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor="#0284c7" />
              <stop offset="100%" stopColor="#38bdf8" />
            </linearGradient>
            <linearGradient id="faceTop" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="#7dd3fc" />
              <stop offset="100%" stopColor="#22d3ee" />
            </linearGradient>
          </defs>

          {/* Top face */}
          <polygon
            points="64,34 92,45 64,56 36,45"
            fill="url(#faceTop)"
            stroke="#38bdf8"
            strokeWidth="2"
          />

          {/* Right face */}
          <polygon
            points="92,45 64,56 64,90 92,79"
            fill="url(#faceRight)"
            stroke="#38bdf8"
            strokeWidth="2"
          />

          {/* Left face */}
          <polygon
            points="36,45 64,56 64,90 36,79"
            fill="url(#faceLeft)"
            stroke="#38bdf8"
            strokeWidth="2"
          />

          {/* Edge accents for lucide-like style */}
          <polyline points="36,45 64,56 92,45" fill="none" stroke="#0ea5e9" strokeWidth="2" opacity="0.9" />
          <polyline points="36,79 64,90 92,79" fill="none" stroke="#0ea5e9" strokeWidth="2" opacity="0.75" />
        </g>
      </svg>
    </div>
  );
}

