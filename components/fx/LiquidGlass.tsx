"use client";

import { useEffect } from "react";

const PANEL = ".glass-panel";
const TILT = "[data-tilt]";
const MAGNET = "[data-magnetic]";

const MAGNET_STRENGTH = 0.16;
const MAGNET_MAX_PX = 10;
const TILT_MAX_DEG = 6;
const LIFT_PX = 5;

/** Exponential smoothing factor — frame-rate independent spring feel. */
const ease = (dt: number, speed: number) => 1 - Math.exp(-dt * speed);

interface Springs {
  el: HTMLElement;
  isPanel: boolean;
  hasTilt: boolean;
  hasMagnet: boolean;
  hovered: boolean;
  pressed: boolean;
  /* [current, target] pairs */
  mx: [number, number];
  my: [number, number];
  rx: [number, number];
  ry: [number, number];
  tx: [number, number];
  ty: [number, number];
  lift: [number, number];
  press: [number, number];
}

/**
 * Global liquid-glass motion engine (renders nothing). One set of delegated
 * pointer listeners feeds per-element springs, integrated in a single rAF
 * loop that only runs while something is moving — this is what makes every
 * surface feel fluid instead of snapping:
 *  - .glass-panel: --mx/--my springs drive the specular highlight in CSS,
 *    and pointerdown spawns a light-wave ripple clipped to the panel.
 *  - [data-tilt]: cursor-tracked 3D tilt + hover lift + press compression.
 *  - [data-magnetic]: drifts toward the cursor, springs back on release.
 *  - every pointerdown emits a subtle expanding click-wave ring on the page.
 * Fully disabled under prefers-reduced-motion; cursor tracking is skipped on
 * coarse pointers (ripples still fire on tap).
 */
export function LiquidGlass() {
  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const finePointer = window.matchMedia("(pointer: fine)").matches;

    const entries = new Map<HTMLElement, Springs>();
    let raf = 0;
    let last = 0;

    const track = (el: HTMLElement): Springs => {
      let s = entries.get(el);
      if (!s) {
        s = {
          el,
          isPanel: el.matches(PANEL),
          hasTilt: el.matches(TILT),
          hasMagnet: el.matches(MAGNET),
          hovered: false,
          pressed: false,
          mx: [50, 50],
          my: [30, 30],
          rx: [0, 0],
          ry: [0, 0],
          tx: [0, 0],
          ty: [0, 0],
          lift: [0, 0],
          press: [0, 0],
        };
        entries.set(el, s);
      }
      return s;
    };

    const startLoop = () => {
      if (!raf) {
        last = performance.now();
        raf = requestAnimationFrame(step);
      }
    };

    const step = (now: number) => {
      const dt = Math.min(0.05, (now - last) / 1000);
      last = now;
      let active = false;

      for (const s of entries.values()) {
        let moving = false;
        const advance = (pair: [number, number], speed: number, eps: number) => {
          pair[0] += (pair[1] - pair[0]) * ease(dt, speed);
          if (Math.abs(pair[1] - pair[0]) > eps) moving = true;
          else pair[0] = pair[1];
        };

        advance(s.mx, 16, 0.05);
        advance(s.my, 16, 0.05);
        advance(s.rx, 11, 0.01);
        advance(s.ry, 11, 0.01);
        advance(s.tx, 13, 0.05);
        advance(s.ty, 13, 0.05);
        advance(s.lift, 11, 0.005);
        advance(s.press, 22, 0.005);

        if (s.isPanel) {
          s.el.style.setProperty("--mx", `${s.mx[0].toFixed(2)}%`);
          s.el.style.setProperty("--my", `${s.my[0].toFixed(2)}%`);
        }
        if (s.hasTilt || s.hasMagnet) {
          const scale = 1 + 0.012 * s.lift[0] - 0.02 * s.press[0];
          const idle =
            !moving &&
            !s.hovered &&
            Math.abs(s.rx[0]) < 0.01 &&
            Math.abs(s.tx[0]) < 0.05 &&
            s.lift[0] < 0.005;
          s.el.style.transform = idle
            ? ""
            : `perspective(900px) translate3d(${s.tx[0].toFixed(2)}px, ${(
                s.ty[0] - LIFT_PX * s.lift[0]
              ).toFixed(2)}px, 0) rotateX(${s.rx[0].toFixed(2)}deg) rotateY(${s.ry[0].toFixed(
                2,
              )}deg) scale(${scale.toFixed(4)})`;
        }

        if (moving || s.hovered || s.pressed) active = true;
        else if (!s.isPanel) entries.delete(s.el); // panels keep their last --mx/--my
      }

      raf = active ? requestAnimationFrame(step) : 0;
    };

    const onMove = (e: PointerEvent) => {
      const target = e.target instanceof Element ? e.target : null;
      if (!target) return;

      const panel = target.closest<HTMLElement>(PANEL);
      const tilt = target.closest<HTMLElement>(TILT);
      const magnet = target.closest<HTMLElement>(MAGNET);

      // Elements the pointer has left this frame spring back home.
      for (const s of entries.values()) {
        if (s.el !== panel && s.el !== tilt && s.el !== magnet && s.hovered) {
          s.hovered = false;
          s.pressed = false;
          s.rx[1] = s.ry[1] = s.tx[1] = s.ty[1] = 0;
          s.lift[1] = s.press[1] = 0;
        }
      }

      if (panel) {
        const s = track(panel);
        const r = panel.getBoundingClientRect();
        s.hovered = true;
        s.mx[1] = ((e.clientX - r.left) / r.width) * 100;
        s.my[1] = ((e.clientY - r.top) / r.height) * 100;
      }
      if (tilt) {
        const s = track(tilt);
        const r = tilt.getBoundingClientRect();
        const px = (e.clientX - r.left) / r.width - 0.5;
        const py = (e.clientY - r.top) / r.height - 0.5;
        s.hovered = true;
        s.rx[1] = -py * TILT_MAX_DEG * 2;
        s.ry[1] = px * TILT_MAX_DEG * 2;
        s.lift[1] = 1;
      }
      if (magnet) {
        const s = track(magnet);
        const r = magnet.getBoundingClientRect();
        const clamp = (v: number) =>
          Math.max(-MAGNET_MAX_PX, Math.min(MAGNET_MAX_PX, v * MAGNET_STRENGTH));
        s.hovered = true;
        s.tx[1] = clamp(e.clientX - (r.left + r.width / 2));
        s.ty[1] = clamp(e.clientY - (r.top + r.height / 2));
      }
      if (panel || tilt || magnet || entries.size) startLoop();
    };

    const setPressed = (target: Element | null, pressed: boolean) => {
      const el = target?.closest<HTMLElement>(`${TILT}, ${MAGNET}`);
      if (!el) return;
      const s = track(el);
      s.pressed = pressed;
      s.press[1] = pressed ? 1 : 0;
      startLoop();
    };

    const onDown = (e: PointerEvent) => {
      const target = e.target instanceof Element ? e.target : null;
      setPressed(target, true);

      // Panel ripple — a light wave spreading through the glass
      const panel = target?.closest<HTMLElement>(PANEL);
      if (panel) {
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
      }

      // Page-level click wave — the whole surface feels liquid
      const wave = document.createElement("span");
      wave.className = "click-wave";
      wave.setAttribute("aria-hidden", "true");
      wave.style.left = `${e.clientX}px`;
      wave.style.top = `${e.clientY}px`;
      document.body.appendChild(wave);
      wave.addEventListener("animationend", () => wave.remove(), { once: true });
    };

    const onUp = (e: PointerEvent) => {
      setPressed(e.target instanceof Element ? e.target : null, false);
    };

    if (finePointer) window.addEventListener("pointermove", onMove, { passive: true });
    window.addEventListener("pointerdown", onDown, { passive: true });
    window.addEventListener("pointerup", onUp, { passive: true });
    window.addEventListener("pointercancel", onUp, { passive: true });
    return () => {
      window.removeEventListener("pointermove", onMove);
      window.removeEventListener("pointerdown", onDown);
      window.removeEventListener("pointerup", onUp);
      window.removeEventListener("pointercancel", onUp);
      cancelAnimationFrame(raf);
    };
  }, []);

  return null;
}
