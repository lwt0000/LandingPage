import type { ReactNode } from "react";
import { cn } from "@/lib/cn";
import { Reveal } from "@/components/fx/Reveal";

/**
 * Shared scene wrapper: semantic <section> with id (scroll-spy target),
 * eyebrow, cinematic title, and consistent rhythm between scenes.
 */
export function SceneShell({
  id,
  eyebrow,
  title,
  intro,
  children,
  className,
  wide = false,
}: {
  id: string;
  eyebrow: string;
  title: string;
  intro?: string;
  children: ReactNode;
  className?: string;
  wide?: boolean;
}) {
  return (
    <section
      id={id}
      aria-label={title}
      className={cn("relative scroll-mt-16 px-4 py-28 sm:px-8 sm:py-36", className)}
    >
      <div className={cn("mx-auto", wide ? "max-w-7xl" : "max-w-5xl")}>
        <Reveal variant="cinematic">
          <p className="scene-eyebrow">{eyebrow}</p>
          <h2 className="scene-title mt-3 text-4xl text-balance sm:text-6xl">
            {title}
          </h2>
          {intro && (
            <p className="mt-4 max-w-2xl leading-relaxed text-[var(--ink-dim)]">
              {intro}
            </p>
          )}
        </Reveal>
        <div className="mt-12 sm:mt-16">{children}</div>
      </div>
    </section>
  );
}
