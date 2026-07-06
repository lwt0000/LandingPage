import { GraduationCap } from "lucide-react";
import { SceneShell } from "@/components/SceneShell";
import { Reveal } from "@/components/fx/Reveal";
import { education } from "@/content/content";

/** Scene 8 — Origin: two cinematic education cards. */
export function Origin() {
  return (
    <SceneShell
      id="origin"
      eyebrow="Origin Story"
      title="Where the build began"
      wide
    >
      <div className="grid gap-6 md:grid-cols-2">
        {education.map((edu, i) => (
          <Reveal key={edu.id} variant={i === 0 ? "left" : "right"} delay={i * 0.15}>
            <article className="glass-panel glass-panel-hover sheen relative h-full overflow-hidden rounded-2xl p-7 sm:p-9">
              <span
                aria-hidden
                className="absolute -right-8 -top-8 h-32 w-32 rounded-full bg-[var(--accent-signal)]/10 blur-2xl"
              />
              <GraduationCap size={22} className="text-[var(--ink-dim)]" aria-hidden />
              <p className="scene-eyebrow mt-5 !text-[0.6rem]">{edu.period}</p>
              <h3 className="scene-title mt-2 text-xl sm:text-2xl">{edu.degree}</h3>
              <p className="mt-1 text-sm text-[var(--ink-dim)]">{edu.school}</p>
              <div className="mt-5 space-y-2 text-sm text-[var(--ink-dim)]">
                <p>{edu.focus}</p>
                <p className="font-[family-name:var(--font-display)] text-base font-semibold text-[var(--ink)]">
                  {edu.gpa}
                </p>
                {edu.distinction && (
                  <p className="text-amber-200/80">{edu.distinction}</p>
                )}
              </div>
            </article>
          </Reveal>
        ))}
      </div>
    </SceneShell>
  );
}
