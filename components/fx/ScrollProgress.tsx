"use client";

import { useEffect, useRef } from "react";

/**
 * Journey progress: a thin ember→signal gradient bar along the top edge that
 * fills as the page is explored — a quiet HUD element that makes scrolling
 * feel like advancing through the game. rAF-throttled; static under
 * prefers-reduced-motion (it still fills, just without the glow pulse).
 */
export function ScrollProgress() {
  const barRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const bar = barRef.current;
    if (!bar) return;
    let raf = 0;

    const update = () => {
      raf = 0;
      const max = document.documentElement.scrollHeight - window.innerHeight;
      const p = max > 0 ? Math.min(1, window.scrollY / max) : 0;
      bar.style.transform = `scaleX(${p.toFixed(4)})`;
    };
    const onScroll = () => {
      if (!raf) raf = requestAnimationFrame(update);
    };

    update();
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll);
    return () => {
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
      cancelAnimationFrame(raf);
    };
  }, []);

  return (
    <div aria-hidden className="pointer-events-none fixed inset-x-0 top-0 z-[75] h-[2px]">
      <div
        ref={barRef}
        className="h-full w-full origin-left bg-gradient-to-r from-[var(--accent-ember)] via-[#f2a03a] to-[var(--accent-signal)] shadow-[0_0_12px_var(--glow-ember)]"
        style={{ transform: "scaleX(0)" }}
      />
    </div>
  );
}
