"use client";

import { useEffect, useState } from "react";
import { scenes } from "@/content/content";
import { cn } from "@/lib/cn";

/**
 * Quest-map navigation: a vertical constellation of nodes on the right edge
 * (desktop). The active scene glows via scroll-spy. A semantic, keyboard-
 * operable <nav> underpins it — the visual treatment is purely additive.
 */
export function QuestMap() {
  const [active, setActive] = useState(scenes[0].id);

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        // Pick the most visible intersecting scene
        const visible = entries
          .filter((e) => e.isIntersecting)
          .sort((a, b) => b.intersectionRatio - a.intersectionRatio);
        if (visible[0]) setActive(visible[0].target.id);
      },
      { rootMargin: "-35% 0px -55% 0px", threshold: [0, 0.1, 0.5] },
    );
    for (const s of scenes) {
      const el = document.getElementById(s.id);
      if (el) observer.observe(el);
    }
    return () => observer.disconnect();
  }, []);

  return (
    <nav
      aria-label="Quest map — sections"
      className="fixed right-4 top-1/2 z-50 hidden -translate-y-1/2 lg:block"
    >
      <ol className="relative flex flex-col gap-1">
        {/* connecting path */}
        <span
          aria-hidden
          className="absolute left-[7px] top-3 bottom-3 w-px bg-gradient-to-b from-transparent via-white/20 to-transparent"
        />
        {scenes.map((s) => {
          const isActive = active === s.id;
          return (
            <li key={s.id}>
              <a
                href={`#${s.id}`}
                aria-current={isActive ? "true" : undefined}
                className="group flex items-center gap-3 rounded-full py-1.5 pl-0.5 pr-2"
              >
                <span
                  aria-hidden
                  className={cn(
                    "relative block h-3.5 w-3.5 rounded-full border transition-all duration-500",
                    isActive
                      ? "border-[var(--accent-ember)] bg-[var(--accent-ember)]/90 shadow-[0_0_14px_2px_var(--glow-ember)]"
                      : "border-white/30 bg-white/5 group-hover:border-white/60",
                  )}
                />
                <span
                  className={cn(
                    "font-[family-name:var(--font-display)] text-[0.68rem] uppercase tracking-[0.25em] transition-all duration-300",
                    isActive
                      ? "text-[var(--ink)] opacity-100"
                      : "text-[var(--ink-dim)] opacity-0 group-hover:opacity-100 group-focus-visible:opacity-100",
                  )}
                >
                  {s.label}
                </span>
              </a>
            </li>
          );
        })}
      </ol>
    </nav>
  );
}

/**
 * Accessible fallback navigation: a plain semantic nav at the top of the
 * document, first in tab order, always visible on mobile.
 */
export function FallbackNav() {
  return (
    <nav
      aria-label="Sections"
      className="relative z-40 mx-auto w-full max-w-6xl overflow-x-auto px-4 py-3 lg:hidden"
    >
      <ul className="flex gap-1 whitespace-nowrap">
        {scenes.map((s) => (
          <li key={s.id}>
            <a
              href={`#${s.id}`}
              className="block rounded-full px-3 py-1.5 font-[family-name:var(--font-display)] text-[0.68rem] uppercase tracking-[0.2em] text-[var(--ink-dim)] transition-colors hover:bg-white/5 hover:text-[var(--ink)]"
            >
              {s.label}
            </a>
          </li>
        ))}
      </ul>
    </nav>
  );
}
