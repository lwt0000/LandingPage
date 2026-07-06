"use client";

import { motion, useReducedMotion } from "framer-motion";
import { Trophy } from "lucide-react";
import { SceneShell } from "@/components/SceneShell";
import { awards } from "@/content/content";

/** Scene 7 — Achievements: awards revealed as elegant "unlocked" toasts. */
export function Achievements() {
  const reducedMotion = useReducedMotion();

  return (
    <SceneShell
      id="achievements"
      eyebrow="Achievements"
      title="Unlocked"
      wide
    >
      <ul className="grid gap-4 sm:grid-cols-2">
        {awards.map((award, i) => (
          <motion.li
            key={award.id}
            initial={{ opacity: 0, x: -32, scale: 0.97 }}
            whileInView={{ opacity: 1, x: 0, scale: 1 }}
            viewport={{ once: true, margin: "-12%" }}
            transition={
              reducedMotion
                ? { duration: 0 }
                : { type: "spring", stiffness: 240, damping: 24, delay: i * 0.18 }
            }
          >
            <div className="glass-panel sheen flex items-center gap-4 rounded-2xl p-5">
              <motion.span
                aria-hidden
                className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full border border-amber-300/30 bg-amber-300/10 text-amber-200"
                initial={{ rotate: -180, scale: 0 }}
                whileInView={{ rotate: 0, scale: 1 }}
                viewport={{ once: true, margin: "-12%" }}
                transition={
                  reducedMotion
                    ? { duration: 0 }
                    : { type: "spring", stiffness: 200, damping: 15, delay: 0.15 + i * 0.18 }
                }
              >
                <Trophy size={20} />
              </motion.span>
              <div>
                <p className="scene-eyebrow !text-[0.58rem] !tracking-[0.32em] text-amber-200/70">
                  Achievement unlocked
                </p>
                <h3 className="mt-1 font-[family-name:var(--font-display)] font-semibold leading-snug">
                  {award.title}
                </h3>
              </div>
            </div>
          </motion.li>
        ))}
      </ul>
    </SceneShell>
  );
}
