"use client";

import { BookMarked, ScanSearch } from "lucide-react";
import { SceneShell } from "@/components/SceneShell";
import { Reveal } from "@/components/fx/Reveal";
import { useInspect } from "@/components/inspect/InspectProvider";
import { publications } from "@/content/content";

/** Scene 4 — Archive: publications as collectible research artifacts. */
export function Archive() {
  const { inspect } = useInspect();

  return (
    <SceneShell
      id="archive"
      eyebrow="Research Archive"
      title="Collected artifacts"
      intro="Peer-reviewed research recovered from the field — each one a study in teaching machines to find what human eyes miss."
      wide
    >
      <div className="grid gap-6 md:grid-cols-3">
        {publications.map((pub, i) => (
          <Reveal key={pub.id} variant="rise" delay={i * 0.12}>
            <button
              onClick={() =>
                inspect({
                  title: pub.title,
                  category: `Artifact · ${pub.venue}`,
                  description: `${pub.authors}.${pub.collaboration ? ` ${pub.collaboration}.` : ""}`,
                  tags: pub.tags,
                })
              }
              aria-haspopup="dialog"
              className="glass-panel glass-panel-hover sheen group flex h-full w-full flex-col rounded-2xl p-6 text-left"
            >
              <div className="mb-5 flex items-center justify-between">
                <span className="flex h-10 w-10 items-center justify-center rounded-xl border border-white/10 bg-white/[0.04] text-[var(--ink-dim)] transition-colors group-hover:text-[var(--accent-ember)]">
                  <BookMarked size={18} aria-hidden />
                </span>
                <span className="scene-eyebrow !text-[0.6rem] !tracking-[0.3em]">
                  {pub.venue}
                </span>
              </div>
              <h3 className="font-[family-name:var(--font-display)] font-semibold leading-snug text-[var(--ink)]">
                {pub.title}
              </h3>
              <p className="mt-3 text-xs leading-relaxed text-[var(--ink-dim)]">
                {pub.authors}
              </p>
              {pub.collaboration && (
                <p className="mt-2 text-xs italic text-[var(--ink-dim)]">
                  {pub.collaboration}
                </p>
              )}
              <div className="mt-auto pt-5">
                <div className="flex flex-wrap gap-1.5">
                  {pub.tags.map((t) => (
                    <span
                      key={t}
                      className="rounded-full border border-white/10 px-2 py-0.5 text-[0.65rem] text-[var(--ink-dim)]"
                    >
                      {t}
                    </span>
                  ))}
                </div>
                <p className="mt-4 inline-flex items-center gap-1.5 text-[0.65rem] uppercase tracking-[0.2em] text-[var(--ink-dim)] opacity-70 transition-opacity group-hover:opacity-100">
                  <ScanSearch size={13} aria-hidden /> Inspect artifact
                </p>
              </div>
            </button>
          </Reveal>
        ))}
      </div>
    </SceneShell>
  );
}
