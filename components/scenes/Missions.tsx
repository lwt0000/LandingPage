"use client";

import { Crosshair } from "lucide-react";
import { SceneShell } from "@/components/SceneShell";
import { Reveal } from "@/components/fx/Reveal";
import { useInspect } from "@/components/inspect/InspectProvider";
import { projects } from "@/content/content";

/** Scene 5 — Missions: project cards in a mission-select gallery. */
export function Missions() {
  const { inspect } = useInspect();

  return (
    <SceneShell
      id="missions"
      eyebrow="Mission Select"
      title="Completed operations"
      intro="Seven missions, all debriefed. Select one to open its dossier."
      wide
    >
      <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
        {projects.map((p, i) => (
          <Reveal key={p.id} variant="rise" delay={(i % 3) * 0.1}>
            <button
              onClick={() =>
                inspect({
                  title: p.title,
                  category: `Mission Dossier · ${p.domain}`,
                  description: p.description,
                  technologies: p.technologies,
                  dates: `Status: ${p.status}`,
                })
              }
              aria-haspopup="dialog"
              data-tilt
              className="glass-panel glass-panel-hover sheen group flex h-full w-full flex-col rounded-2xl p-6 text-left"
            >
              <div className="mb-4 flex items-center justify-between">
                <Crosshair
                  size={16}
                  className="text-[var(--ink-dim)] transition-colors group-hover:text-[var(--accent-signal)]"
                  aria-hidden
                />
                <span className="rounded-full border border-emerald-400/30 bg-emerald-400/10 px-2.5 py-0.5 text-[0.62rem] uppercase tracking-[0.18em] text-emerald-300">
                  {p.status}
                </span>
              </div>
              <h3 className="font-[family-name:var(--font-display)] text-lg font-semibold leading-snug">
                {p.title}
              </h3>
              <p className="mt-1.5 text-sm italic text-[var(--ink-dim)]">
                {p.objective}
              </p>
              <p className="mt-3 line-clamp-3 text-sm leading-relaxed text-[var(--ink-dim)]">
                {p.description}
              </p>
              <div className="mt-auto flex flex-wrap gap-1.5 pt-5">
                {p.technologies.slice(0, 4).map((t) => (
                  <span
                    key={t}
                    className="rounded-md border border-white/10 bg-white/[0.03] px-2 py-0.5 font-mono text-[0.65rem] text-[var(--ink-dim)]"
                  >
                    {t}
                  </span>
                ))}
                {p.technologies.length > 4 && (
                  <span className="px-1 py-0.5 text-[0.65rem] text-[var(--ink-dim)]">
                    +{p.technologies.length - 4}
                  </span>
                )}
              </div>
            </button>
          </Reveal>
        ))}
      </div>
    </SceneShell>
  );
}
