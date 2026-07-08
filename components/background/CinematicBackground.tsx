"use client";

import { useEffect, useRef, useState } from "react";
import { Volume2, VolumeX } from "lucide-react";
import { assets } from "@/content/content";

/**
 * Full-screen background layer behind the hero (and faintly behind the page).
 * Probes the known hero-video slots first (§4); when none load — the current
 * asset discovery found none — it renders an animated canvas: cinematic fog,
 * a slow rolling light sweep, and floating glossy shapes with parallax.
 * Never intercepts pointer events. Honors prefers-reduced-motion by
 * rendering a single static frame.
 */
export function CinematicBackground() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  // Resolved by the asset-discovery protocol: no hero video exists today, so
  // this is null and the animated canvas renders. If a video path is set in
  // content.ts, it plays — and a load error still drops back to the canvas.
  const [videoSrc, setVideoSrc] = useState<string | null>(assets.heroVideo);
  const [muted, setMuted] = useState(true);
  const videoOk = videoSrc !== null;

  const toggleSound = () => {
    const v = videoRef.current;
    if (!v) return;
    const nextMuted = !muted;
    v.muted = nextMuted;
    setMuted(nextMuted);
    // Unmuting counts as a user gesture, so playback with audio is allowed —
    // but nudge play() in case the browser paused the video earlier.
    if (!nextMuted) v.play().catch(() => {});
  };

  // Animated canvas fallback
  useEffect(() => {
    if (videoOk) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    let raf = 0;
    let running = true;
    let scrollY = 0;

    const dpr = Math.min(window.devicePixelRatio || 1, 1.5);
    const resize = () => {
      canvas.width = window.innerWidth * dpr;
      canvas.height = window.innerHeight * dpr;
    };
    resize();

    // Deterministic pseudo-random floating shards
    const shards = Array.from({ length: 14 }, (_, i) => {
      const s = Math.sin(i * 127.1) * 43758.5453;
      const r = (n: number) => {
        const v = Math.sin((i + 1) * n) * 43758.5453;
        return v - Math.floor(v);
      };
      return {
        x: r(12.9898),
        y: r(78.233),
        size: 18 + r(3.7) * 70,
        speed: 0.12 + r(9.1) * 0.3,
        phase: (s - Math.floor(s)) * Math.PI * 2,
        tilt: r(4.2) * Math.PI,
      };
    });

    const draw = (t: number) => {
      const w = canvas.width;
      const h = canvas.height;
      const time = reduced ? 0 : t / 1000;

      ctx.clearRect(0, 0, w, h);

      // Base vignette
      const base = ctx.createRadialGradient(w / 2, h * 0.42, 0, w / 2, h * 0.42, Math.max(w, h) * 0.75);
      base.addColorStop(0, "rgba(22, 26, 38, 0.9)");
      base.addColorStop(0.55, "rgba(10, 12, 18, 0.95)");
      base.addColorStop(1, "rgba(8, 9, 12, 1)");
      ctx.fillStyle = base;
      ctx.fillRect(0, 0, w, h);

      // Rolling light sweep — a slow diagonal beam
      const beamX = w * (0.5 + 0.45 * Math.sin(time * 0.11));
      const beam = ctx.createRadialGradient(beamX, h * 0.18, 0, beamX, h * 0.18, w * 0.6);
      beam.addColorStop(0, "rgba(90, 120, 220, 0.10)");
      beam.addColorStop(0.4, "rgba(60, 80, 160, 0.05)");
      beam.addColorStop(1, "rgba(0, 0, 0, 0)");
      ctx.fillStyle = beam;
      ctx.fillRect(0, 0, w, h);

      // Warm ember glow low in the frame (derived from Respawn ember)
      const ember = ctx.createRadialGradient(w * 0.22, h * 1.05, 0, w * 0.22, h * 1.05, h * 0.8);
      ember.addColorStop(0, "rgba(242, 103, 34, 0.07)");
      ember.addColorStop(1, "rgba(0, 0, 0, 0)");
      ctx.fillStyle = ember;
      ctx.fillRect(0, 0, w, h);

      // Fog bands
      for (let i = 0; i < 3; i++) {
        const fy = h * (0.3 + i * 0.25) + Math.sin(time * 0.07 + i * 2.1) * h * 0.03;
        const fog = ctx.createLinearGradient(0, fy - h * 0.12, 0, fy + h * 0.12);
        fog.addColorStop(0, "rgba(120, 130, 160, 0)");
        fog.addColorStop(0.5, `rgba(120, 130, 160, ${0.028 - i * 0.006})`);
        fog.addColorStop(1, "rgba(120, 130, 160, 0)");
        ctx.fillStyle = fog;
        ctx.fillRect(0, fy - h * 0.12, w, h * 0.24);
      }

      // Floating glossy shards with scroll parallax
      const par = scrollY * 0.06 * dpr;
      for (const sh of shards) {
        const x = sh.x * w + Math.sin(time * sh.speed + sh.phase) * 30 * dpr;
        const y = ((sh.y * h - par * sh.speed * 4) % (h + 200)) + Math.cos(time * sh.speed * 0.8 + sh.phase) * 18 * dpr;
        const s = sh.size * dpr;
        ctx.save();
        ctx.translate(x, y);
        ctx.rotate(sh.tilt + (reduced ? 0 : time * 0.03));
        const g = ctx.createLinearGradient(-s / 2, -s / 2, s / 2, s / 2);
        g.addColorStop(0, "rgba(255,255,255,0.045)");
        g.addColorStop(0.5, "rgba(255,255,255,0.012)");
        g.addColorStop(1, "rgba(255,255,255,0)");
        ctx.fillStyle = g;
        ctx.beginPath();
        ctx.roundRect(-s / 2, -s / 6, s, s / 3, s / 12);
        ctx.fill();
        ctx.strokeStyle = "rgba(255,255,255,0.05)";
        ctx.lineWidth = 1;
        ctx.stroke();
        ctx.restore();
      }
    };

    const loop = (t: number) => {
      if (!running) return;
      draw(t);
      raf = requestAnimationFrame(loop);
    };

    const onScroll = () => {
      scrollY = window.scrollY;
    };

    if (reduced) {
      draw(0); // single static cinematic frame
    } else {
      raf = requestAnimationFrame(loop);
      window.addEventListener("scroll", onScroll, { passive: true });
    }
    window.addEventListener("resize", resize);

    return () => {
      running = false;
      cancelAnimationFrame(raf);
      window.removeEventListener("resize", resize);
      window.removeEventListener("scroll", onScroll);
    };
  }, [videoOk]);

  return (
    <>
      <div aria-hidden className="pointer-events-none fixed inset-0 z-0">
        {videoOk && (
          <video
            ref={videoRef}
            muted={muted}
            loop
            playsInline
            autoPlay
            preload="metadata"
            src={videoSrc}
            className="h-full w-full object-cover opacity-60"
            onError={() => setVideoSrc(null)}
          />
        )}
        {!videoOk && (
          <canvas ref={canvasRef} className="absolute inset-0 h-full w-full" />
        )}
        {/* Readability scrims over whichever layer renders: a vertical
            gradient tames bright frames behind text, and a radial vignette
            darkens the edges so foreground glass keeps its contrast. */}
        <div className="absolute inset-0 bg-gradient-to-b from-black/50 via-black/20 to-[var(--bg)]" />
        <div className="absolute inset-0 bg-[radial-gradient(120%_90%_at_50%_15%,transparent_40%,rgba(5,6,9,0.6)_100%)]" />
      </div>

      {videoOk && (
        <button
          onClick={toggleSound}
          data-magnetic
          aria-label={muted ? "Unmute background video" : "Mute background video"}
          aria-pressed={!muted}
          title={muted ? "Unmute background video" : "Mute background video"}
          className="glass-panel fixed bottom-4 right-4 z-[70] flex h-11 items-center gap-2 rounded-full px-4 font-[family-name:var(--font-display)] text-[0.7rem] uppercase tracking-[0.22em] text-[var(--ink)] hover:border-white/30 hover:shadow-[0_0_24px_-4px_var(--glow-signal)] sm:bottom-6 sm:right-6"
          style={{ background: "var(--bg-elevated)" }}
        >
          {muted ? <VolumeX size={16} aria-hidden /> : <Volume2 size={16} aria-hidden />}
          <span className="hidden sm:inline">{muted ? "Sound" : "Mute"}</span>
          {muted && (
            <span aria-hidden className="absolute -right-0.5 -top-0.5 h-2.5 w-2.5">
              <span className="absolute inset-0 rounded-full bg-[var(--accent-ember)] opacity-75 motion-safe:animate-ping" />
              <span className="absolute inset-0 rounded-full bg-[var(--accent-ember)]" />
            </span>
          )}
        </button>
      )}
    </>
  );
}
