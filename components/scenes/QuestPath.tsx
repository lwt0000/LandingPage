"use client";

import Image from "next/image";
import { CheckCircle2, Compass } from "lucide-react";
import { SceneShell } from "@/components/SceneShell";
import { Reveal } from "@/components/fx/Reveal";
import { useInspect } from "@/components/inspect/InspectProvider";
import { assets, experience } from "@/content/content";
import { cn } from "@/lib/cn";

/** Scene 3 — Quest Path: campaign timeline of roles as unlocked checkpoints. */
export function QuestPath() {
  const { inspect } = useInspect();

  return (
    <SceneShell
      id="quest-path"
      eyebrow="Quest Path"
      title="Campaign checkpoints"
      intro="Every role unlocked along the way — several ran concurrently, as any good side quest does."
      wide
    >
      <ol className="relative ml-3 space-y-10 border-l border-white/10 sm:ml-6">
        {experience.map((role, i) => (
          <Reveal key={role.id} as="li" variant={i % 2 ? "right" : "left"} delay={i * 0.08}>
            <div className="relative pl-8 sm:pl-12">
              {/* checkpoint node */}
              <span
                aria-hidden
                className={cn(
                  "absolute -left-[9px] top-6 flex h-[18px] w-[18px] items-center justify-center rounded-full border",
                  role.current
                    ? "border-[var(--accent-ember)] bg-[var(--accent-ember)]/20 shadow-[0_0_18px_2px_var(--glow-ember)]"
                    : "border-white/30 bg-[var(--bg-elevated)]",
                )}
              >
                <span
                  className={cn(
                    "h-1.5 w-1.5 rounded-full",
                    role.current ? "bg-[var(--accent-ember)]" : "bg-white/40",
                  )}
                />
              </span>

              <button
                onClick={() =>
                  inspect({
                    title: role.role,
                    category: `Quest Checkpoint · ${role.org}`,
                    description: [role.summary, ...role.details].join(" "),
                    tags: role.tags,
                    dates: role.period,
                  })
                }
                data-tilt
                className="glass-panel glass-panel-hover sheen block w-full rounded-2xl p-6 text-left sm:p-8"
                aria-haspopup="dialog"
              >
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <p className="scene-eyebrow !text-[0.6rem]">
                      {role.period}
                      {role.current && (
                        <span className="ml-3 rounded-full border border-[var(--accent-ember)]/50 px-2 py-0.5 text-[0.58rem] text-[var(--accent-ember)]">
                          Active Quest
                        </span>
                      )}
                    </p>
                    <h3 className="scene-title mt-2 text-xl sm:text-2xl">{role.role}</h3>
                    <p className="mt-1 text-sm text-[var(--ink-dim)]">{role.org}</p>
                  </div>
                  {role.orgBadges.length > 0 && (
                    <span className="flex flex-wrap items-center gap-2">
                      {role.orgBadges.map((badge) =>
                        badge === "respawn-ea" ? (
                          <span
                            key={badge}
                            className="glass-panel flex items-center gap-2.5 rounded-xl px-3 py-2"
                          >
                            <Image
                              src={assets.respawnLogo}
                              alt="Respawn Entertainment"
                              width={80}
                              height={17}
                              className="logo-on-dark h-3.5 w-auto"
                              unoptimized
                            />
                            <span aria-hidden className="h-4 w-px bg-white/15" />
                            <Image
                              src={assets.eaLogo}
                              alt="Electronic Arts"
                              width={18}
                              height={18}
                              className="h-4 w-4"
                              unoptimized
                            />
                          </span>
                        ) : (
                          <span
                            key={badge}
                            className="glass-panel flex items-center rounded-xl px-3 py-2"
                          >
                            <Image
                              src={assets.uaLogo}
                              alt="University of Alberta"
                              width={80}
                              height={22}
                              className="logo-on-dark h-3.5 w-auto"
                              unoptimized
                            />
                          </span>
                        ),
                      )}
                    </span>
                  )}
                </div>
                <p className="mt-4 leading-relaxed text-[var(--ink-dim)]">{role.summary}</p>
                <ul className="mt-3 space-y-1.5">
                  {role.details.map((d) => (
                    <li key={d} className="flex gap-2 text-sm text-[var(--ink-dim)]">
                      <CheckCircle2
                        size={15}
                        className="mt-0.5 shrink-0 text-white/30"
                        aria-hidden
                      />
                      {d}
                    </li>
                  ))}
                </ul>
                <p className="mt-4 inline-flex items-center gap-1.5 text-xs uppercase tracking-[0.2em] text-[var(--ink-dim)]">
                  <Compass size={13} aria-hidden /> Inspect checkpoint
                </p>
              </button>
            </div>
          </Reveal>
        ))}
      </ol>
    </SceneShell>
  );
}
