"use client";

import { useEffect, useRef } from "react";

const INTERACTIVE =
  "a, button, [role='button'], [data-magnetic], [data-tilt], .glass-panel, canvas, input, textarea";

/**
 * Liquid cursor: an ember dot rides the native cursor while a soft glass
 * ring springs after it, swelling over interactive elements and tightening
 * while pressed. Purely additive — the native cursor stays, so grab/pointer
 * cursors from the badge and links still read. Fine pointers only; renders
 * nothing under reduced motion or on touch devices.
 */
export function LiquidCursor() {
  const ringRef = useRef<HTMLDivElement>(null);
  const dotRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    if (!window.matchMedia("(pointer: fine)").matches) return;
    const ring = ringRef.current;
    const dot = dotRef.current;
    if (!ring || !dot) return;

    let tx = window.innerWidth / 2;
    let ty = window.innerHeight / 2;
    let x = tx;
    let y = ty;
    let scaleTarget = 1;
    let scale = 1;
    let shown = false;
    let pressed = false;
    let raf = 0;
    let last = 0;

    const step = (now: number) => {
      const dt = Math.min(0.05, (now - last) / 1000);
      last = now;
      x += (tx - x) * (1 - Math.exp(-dt * 14));
      y += (ty - y) * (1 - Math.exp(-dt * 14));
      const s = pressed ? scaleTarget * 0.72 : scaleTarget;
      scale += (s - scale) * (1 - Math.exp(-dt * 12));
      ring.style.transform = `translate3d(${x.toFixed(1)}px, ${y.toFixed(1)}px, 0) scale(${scale.toFixed(3)})`;
      dot.style.transform = `translate3d(${tx.toFixed(1)}px, ${ty.toFixed(1)}px, 0)`;
      raf = requestAnimationFrame(step);
    };

    const onMove = (e: PointerEvent) => {
      tx = e.clientX;
      ty = e.clientY;
      if (!shown) {
        shown = true;
        x = tx;
        y = ty;
        ring.style.opacity = "1";
        dot.style.opacity = "1";
        last = performance.now();
        raf = requestAnimationFrame(step);
      }
      const el = e.target instanceof Element ? e.target : null;
      scaleTarget = el?.closest(INTERACTIVE) ? 1.7 : 1;
    };

    const onDown = () => {
      pressed = true;
    };
    const onUp = () => {
      pressed = false;
    };
    const onLeave = () => {
      ring.style.opacity = "0";
      dot.style.opacity = "0";
    };
    const onEnter = () => {
      if (shown) {
        ring.style.opacity = "1";
        dot.style.opacity = "1";
      }
    };

    window.addEventListener("pointermove", onMove, { passive: true });
    window.addEventListener("pointerdown", onDown, { passive: true });
    window.addEventListener("pointerup", onUp, { passive: true });
    document.documentElement.addEventListener("pointerleave", onLeave);
    document.documentElement.addEventListener("pointerenter", onEnter);
    return () => {
      window.removeEventListener("pointermove", onMove);
      window.removeEventListener("pointerdown", onDown);
      window.removeEventListener("pointerup", onUp);
      document.documentElement.removeEventListener("pointerleave", onLeave);
      document.documentElement.removeEventListener("pointerenter", onEnter);
      cancelAnimationFrame(raf);
    };
  }, []);

  return (
    <>
      <div ref={ringRef} aria-hidden className="cursor-ring" />
      <div ref={dotRef} aria-hidden className="cursor-dot" />
    </>
  );
}
