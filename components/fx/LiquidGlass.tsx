"use client";

import { useEffect } from "react";

const PANEL = ".glass-panel";
const MAGNET = "[data-magnetic]";
const MAGNET_STRENGTH = 0.16;
const MAGNET_MAX_PX = 10;

/**
 * Global liquid-glass interaction layer (renders nothing). One delegated
 * listener pair drives every panel on the page:
 *  - pointermove sets --mx/--my on the hovered .glass-panel, feeding the
 *    specular highlight in globals.css, and nudges [data-magnetic] elements
 *    a few px toward the cursor;
 *  - pointerdown spawns a light-wave ripple inside the pressed panel,
 *    clipped to its rounded corners by an injected .ripple-host.
 * Disabled entirely under prefers-reduced-motion; the specular tracking is
 * skipped on coarse pointers where there is no cursor to follow.
 */
export function LiquidGlass() {
  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const finePointer = window.matchMedia("(pointer: fine)").matches;
    let activeMagnet: HTMLElement | null = null;

    const onMove = (e: PointerEvent) => {
      const target = e.target instanceof Element ? e.target : null;
      if (!target) return;

      const panel = target.closest<HTMLElement>(PANEL);
      if (panel) {
        const r = panel.getBoundingClientRect();
        panel.style.setProperty("--mx", `${(((e.clientX - r.left) / r.width) * 100).toFixed(2)}%`);
        panel.style.setProperty("--my", `${(((e.clientY - r.top) / r.height) * 100).toFixed(2)}%`);
      }

      const magnet = target.closest<HTMLElement>(MAGNET);
      if (activeMagnet && activeMagnet !== magnet) {
        activeMagnet.style.transform = "";
      }
      if (magnet) {
        const r = magnet.getBoundingClientRect();
        const clamp = (v: number) =>
          Math.max(-MAGNET_MAX_PX, Math.min(MAGNET_MAX_PX, v * MAGNET_STRENGTH));
        const tx = clamp(e.clientX - (r.left + r.width / 2));
        const ty = clamp(e.clientY - (r.top + r.height / 2));
        magnet.style.transform = `translate(${tx.toFixed(1)}px, ${ty.toFixed(1)}px)`;
      }
      activeMagnet = magnet;
    };

    const onDown = (e: PointerEvent) => {
      const target = e.target instanceof Element ? e.target : null;
      const panel = target?.closest<HTMLElement>(PANEL);
      if (!panel) return;

      let host = panel.querySelector<HTMLElement>(":scope > .ripple-host");
      if (!host) {
        host = document.createElement("span");
        host.className = "ripple-host";
        host.setAttribute("aria-hidden", "true");
        panel.appendChild(host);
      }

      const r = panel.getBoundingClientRect();
      const size = Math.max(r.width, r.height) * 1.7;
      const ripple = document.createElement("span");
      ripple.className = "liquid-ripple";
      ripple.style.width = `${size}px`;
      ripple.style.height = `${size}px`;
      ripple.style.left = `${e.clientX - r.left - size / 2}px`;
      ripple.style.top = `${e.clientY - r.top - size / 2}px`;
      host.appendChild(ripple);
      ripple.addEventListener("animationend", () => ripple.remove(), { once: true });
    };

    if (finePointer) window.addEventListener("pointermove", onMove, { passive: true });
    window.addEventListener("pointerdown", onDown, { passive: true });
    return () => {
      window.removeEventListener("pointermove", onMove);
      window.removeEventListener("pointerdown", onDown);
    };
  }, []);

  return null;
}
