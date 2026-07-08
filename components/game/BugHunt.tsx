"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { Bug, RotateCcw, Trophy, X } from "lucide-react";

/**
 * Bug Hunt — a site-wide mini-game that turns the portfolio's own subject
 * matter (visual bug detection) into play. Six "visual bugs" — small glitch
 * artifacts that look like rendering errors — hide inside different scenes.
 * Spotting and clicking one captures it: shard burst, synth blip, HUD count.
 * Capturing all six unlocks the "Zero Known Issues" achievement.
 * Progress persists in localStorage.
 */

interface BugSpot {
  id: string;
  section: string;
  left: string;
  top: string;
}

/** Percentage positions are relative to each scene <section> (all `relative`),
 *  chosen in padding/whitespace zones so they never cover interactive UI. */
const BUGS: BugSpot[] = [
  { id: "spawn-glitch", section: "spawn", left: "3%", top: "10%" },
  { id: "profile-glitch", section: "profile", left: "91%", top: "8%" },
  { id: "quest-glitch", section: "quest-path", left: "4%", top: "62%" },
  { id: "missions-glitch", section: "missions", left: "55%", top: "5%" },
  { id: "achievements-glitch", section: "achievements", left: "88%", top: "84%" },
  { id: "portal-glitch", section: "portal", left: "85%", top: "13%" },
];

const STORAGE_KEY = "bug-hunt-found-v1";
const SHARD_COLORS = ["#f26722", "#255af6", "#78ffbe", "#e8eaf0"];

function loadFound(): string[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    const arr = raw ? (JSON.parse(raw) as unknown) : [];
    return Array.isArray(arr) ? arr.filter((v): v is string => typeof v === "string") : [];
  } catch {
    return [];
  }
}

/** Tiny synth so captures feel arcade-like — no audio assets needed. */
function useBlip() {
  const ctxRef = useRef<AudioContext | null>(null);
  return useCallback((notes: number[], spacing = 0.09) => {
    try {
      ctxRef.current ??= new AudioContext();
      const ctx = ctxRef.current;
      void ctx.resume();
      notes.forEach((freq, i) => {
        const t = ctx.currentTime + i * spacing;
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = "square";
        osc.frequency.value = freq;
        gain.gain.setValueAtTime(0.035, t);
        gain.gain.exponentialRampToValueAtTime(0.0001, t + 0.14);
        osc.connect(gain).connect(ctx.destination);
        osc.start(t);
        osc.stop(t + 0.15);
      });
    } catch {
      /* audio is a garnish — never let it break a capture */
    }
  }, []);
}

function burstShards(x: number, y: number) {
  for (let i = 0; i < 10; i++) {
    const shard = document.createElement("span");
    shard.className = "bug-shard";
    shard.setAttribute("aria-hidden", "true");
    const angle = (i / 10) * Math.PI * 2 + Math.random() * 0.6;
    const dist = 46 + Math.random() * 46;
    shard.style.left = `${x}px`;
    shard.style.top = `${y}px`;
    shard.style.background = SHARD_COLORS[i % SHARD_COLORS.length];
    shard.style.setProperty("--dx", `${(Math.cos(angle) * dist).toFixed(0)}px`);
    shard.style.setProperty("--dy", `${(Math.sin(angle) * dist).toFixed(0)}px`);
    document.body.appendChild(shard);
    shard.addEventListener("animationend", () => shard.remove(), { once: true });
  }
}

export function BugHunt() {
  const [mounted, setMounted] = useState(false);
  const [found, setFound] = useState<string[]>([]);
  const [toast, setToast] = useState<string | null>(null);
  const [showHint, setShowHint] = useState(false);
  const [celebrate, setCelebrate] = useState(false);
  const toastTimer = useRef<number>(0);
  const blip = useBlip();
  const reducedMotion = useReducedMotion();

  useEffect(() => {
    setFound(loadFound());
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!celebrate) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setCelebrate(false);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [celebrate]);

  const capture = (bug: BugSpot, e: React.MouseEvent<HTMLButtonElement>) => {
    const next = [...found, bug.id];
    setFound(next);
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
    } catch {
      /* private mode — the hunt just won't persist */
    }
    const rect = e.currentTarget.getBoundingClientRect();
    burstShards(rect.left + rect.width / 2, rect.top + rect.height / 2);

    if (next.length === BUGS.length) {
      blip([523, 659, 784, 1047], 0.11); // completion arpeggio
      setToast(null);
      window.setTimeout(() => setCelebrate(true), 500);
    } else {
      blip([660, 990]);
      setToast(`Visual bug captured — ${next.length}/${BUGS.length}`);
      window.clearTimeout(toastTimer.current);
      toastTimer.current = window.setTimeout(() => setToast(null), 2600);
    }
  };

  const reset = () => {
    setFound([]);
    setCelebrate(false);
    try {
      localStorage.removeItem(STORAGE_KEY);
    } catch {
      /* ignore */
    }
  };

  if (!mounted) return null;
  const complete = found.length === BUGS.length;

  return (
    <>
      {/* Hidden bugs, portaled into their scenes */}
      {BUGS.filter((b) => !found.includes(b.id)).map((bug) => {
        const host = document.getElementById(bug.section);
        if (!host) return null;
        return createPortal(
          <button
            key={bug.id}
            className="bug-sprite"
            style={{ left: bug.left, top: bug.top }}
            onClick={(e) => capture(bug, e)}
            aria-label="Hidden visual bug — click to capture"
            title="That's not supposed to render like that…"
          >
            <i />
          </button>,
          host,
        );
      })}

      {/* HUD — top right, styled like the other fixed pills */}
      {/* below the FallbackNav on small screens; top corner once it's gone */}
      <div className="fixed right-4 top-14 z-[70] flex flex-col items-end gap-2 sm:right-6 lg:top-6">
        <button
          onClick={() => setShowHint((v) => !v)}
          data-magnetic
          aria-expanded={showHint}
          aria-label={`Bug hunt: ${found.length} of ${BUGS.length} visual bugs captured. ${
            showHint ? "Hide" : "Show"
          } hint`}
          className="glass-panel flex h-11 items-center gap-2 rounded-full px-4 font-[family-name:var(--font-display)] text-[0.7rem] uppercase tracking-[0.22em] text-[var(--ink)] hover:border-white/30 hover:shadow-[0_0_24px_-4px_var(--glow-ember)]"
          style={{ background: "var(--bg-elevated)" }}
        >
          <Bug
            size={16}
            aria-hidden
            className={
              complete
                ? "text-emerald-300"
                : found.length === 0
                  ? "text-[var(--accent-ember)] motion-safe:animate-pulse"
                  : "text-[var(--accent-ember)]"
            }
          />
          {complete ? "QA passed" : `${found.length}/${BUGS.length}`}
        </button>
        <AnimatePresence>
          {showHint && (
            <motion.div
              className="glass-panel w-60 rounded-2xl p-4 text-xs leading-relaxed text-[var(--ink-dim)]"
              style={{ background: "var(--bg-elevated)" }}
              initial={reducedMotion ? { opacity: 0 } : { opacity: 0, y: -8, scale: 0.96 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={reducedMotion ? { opacity: 0 } : { opacity: 0, y: -6, scale: 0.97 }}
              transition={{ type: "spring", stiffness: 380, damping: 30 }}
            >
              <p className="scene-eyebrow mb-2 !text-[0.6rem]">Side quest</p>
              {complete ? (
                <>
                  <p>
                    All {BUGS.length} visual bugs squashed. This build is certified
                    shippable.
                  </p>
                  <button
                    onClick={reset}
                    className="mt-3 inline-flex items-center gap-1.5 rounded-lg border border-white/15 px-2.5 py-1.5 text-[0.68rem] uppercase tracking-[0.15em] text-[var(--ink)] transition-colors hover:border-white/35"
                  >
                    <RotateCcw size={12} aria-hidden /> Reset hunt
                  </button>
                </>
              ) : (
                <p>
                  {BUGS.length} visual bugs are glitching somewhere on this page. Spot one, click it, ship a
                  cleaner build.
                </p>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Capture toast */}
      <AnimatePresence>
        {toast && (
          <motion.p
            role="status"
            className="glass-panel fixed bottom-20 left-1/2 z-[80] flex -translate-x-1/2 items-center gap-2 whitespace-nowrap rounded-full px-5 py-2.5 font-[family-name:var(--font-display)] text-[0.72rem] uppercase tracking-[0.2em] text-[var(--ink)]"
            style={{ background: "var(--bg-elevated)" }}
            initial={reducedMotion ? { opacity: 0 } : { opacity: 0, y: 16, scale: 0.94 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, ...(reducedMotion ? {} : { y: 10, scale: 0.96 }) }}
            transition={{ type: "spring", stiffness: 400, damping: 28 }}
          >
            <Bug size={14} aria-hidden className="text-[var(--accent-ember)]" />
            {toast}
          </motion.p>
        )}
      </AnimatePresence>

      {/* Completion achievement */}
      <AnimatePresence>
        {celebrate && (
          <motion.div
            role="dialog"
            aria-modal="true"
            aria-label="Achievement unlocked: Zero Known Issues"
            className="fixed inset-0 z-[95] flex items-center justify-center p-4"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <button
              aria-label="Close achievement"
              tabIndex={-1}
              className="absolute inset-0 cursor-default bg-black/70 backdrop-blur-sm"
              onClick={() => setCelebrate(false)}
            />
            {/* confetti */}
            <div aria-hidden className="pointer-events-none absolute inset-0 overflow-hidden">
              {Array.from({ length: 32 }, (_, i) => (
                <span
                  key={i}
                  className="confetti-piece"
                  style={{
                    left: `${(i * 3.1 + 2) % 100}%`,
                    background: SHARD_COLORS[i % SHARD_COLORS.length],
                    ["--drift" as string]: `${Math.sin(i * 2.7) * 90}px`,
                    ["--dur" as string]: `${2 + (i % 5) * 0.3}s`,
                    ["--delay" as string]: `${(i % 8) * 0.12}s`,
                  }}
                />
              ))}
            </div>
            <motion.div
              className="glass-panel relative w-full max-w-md rounded-3xl p-8 text-center"
              style={{ background: "var(--bg-elevated)" }}
              initial={reducedMotion ? { opacity: 0 } : { opacity: 0, y: 32, scale: 0.92 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={reducedMotion ? { opacity: 0 } : { opacity: 0, y: 20, scale: 0.95 }}
              transition={{ type: "spring", stiffness: 300, damping: 24 }}
            >
              <button
                onClick={() => setCelebrate(false)}
                aria-label="Close"
                className="absolute right-3 top-3 rounded-lg p-2 text-[var(--ink-dim)] transition-colors hover:bg-white/5 hover:text-[var(--ink)]"
              >
                <X size={16} />
              </button>
              <span className="mx-auto flex h-16 w-16 items-center justify-center rounded-full border border-amber-300/40 bg-amber-300/10 text-amber-200">
                <Trophy size={28} aria-hidden />
              </span>
              <p className="scene-eyebrow mt-5 !text-[0.6rem] text-amber-200/80">
                Achievement unlocked
              </p>
              <h3 className="scene-title mt-2 text-2xl">Zero Known Issues</h3>
              <p className="mt-3 text-sm leading-relaxed text-[var(--ink-dim)]">
                You found all {BUGS.length} visual bugs hidden on this page.
              </p>
              <div className="mt-6 flex justify-center gap-3">
                <button
                  onClick={() => setCelebrate(false)}
                  className="sheen glass-panel rounded-xl px-4 py-2.5 font-[family-name:var(--font-display)] text-xs uppercase tracking-[0.15em] text-[var(--ink)] hover:border-white/30"
                >
                  Keep exploring
                </button>
                <button
                  onClick={reset}
                  className="inline-flex items-center gap-1.5 rounded-xl border border-white/15 px-4 py-2.5 font-[family-name:var(--font-display)] text-xs uppercase tracking-[0.15em] text-[var(--ink-dim)] transition-colors hover:border-white/35 hover:text-[var(--ink)]"
                >
                  <RotateCcw size={13} aria-hidden /> Reset hunt
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
