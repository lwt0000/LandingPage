import { SceneShell } from "@/components/SceneShell";
import { Reveal } from "@/components/fx/Reveal";
import { profile } from "@/content/content";

/** Scene 2 — Profile: character intro with cinematic text reveal. */
export function Profile() {
  return (
    <SceneShell
      id="profile"
      eyebrow="Character Profile"
      title="The player behind the badge"
    >
      <div className="grid gap-10 lg:grid-cols-[1.4fr_1fr]">
        <Reveal variant="rise" delay={0.1}>
          <p className="text-lg leading-relaxed text-[var(--ink)] sm:text-xl sm:leading-relaxed">
            {profile.about}
          </p>
          <p className="mt-6 flex items-center gap-2 text-sm text-[var(--ink-dim)]">
            <span
              aria-hidden
              className="inline-block h-2 w-2 rounded-full bg-[var(--accent-ember)] shadow-[0_0_10px_var(--glow-ember)]"
            />
            Currently stationed in {profile.location}
          </p>
        </Reveal>
        <Reveal variant="right" delay={0.25}>
          <div className="glass-panel rounded-2xl p-6">
            <p className="scene-eyebrow mb-4 !text-[0.62rem]">Loadout</p>
            <ul className="flex flex-wrap gap-2" aria-label="Profile highlights">
              {profile.aboutHighlights.map((h) => (
                <li
                  key={h}
                  className="rounded-full border border-white/10 bg-white/[0.04] px-3 py-1.5 text-xs text-[var(--ink)] transition-all duration-300 hover:scale-[1.06] hover:border-white/30 hover:bg-white/[0.09] hover:shadow-[0_0_18px_-6px_var(--glow-signal)]"
                >
                  {h}
                </li>
              ))}
            </ul>
          </div>
        </Reveal>
      </div>
    </SceneShell>
  );
}
