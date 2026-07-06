import Image from "next/image";
import { FileText, Mail, MapPin } from "lucide-react";
import {
  GithubIcon as Github,
  LinkedinIcon as Linkedin,
} from "@/components/icons/BrandIcons";
import { SceneShell } from "@/components/SceneShell";
import { Reveal } from "@/components/fx/Reveal";
import { assets, links, profile } from "@/content/content";

const portalButtons = [
  { label: "Personal Email", href: `mailto:${links.personalEmail}`, icon: Mail },
  { label: "Work Email", href: `mailto:${links.workEmail}`, icon: Mail },
  { label: "GitHub", href: links.github, icon: Github, external: true },
  { label: "LinkedIn", href: links.linkedin, icon: Linkedin, external: true },
  { label: "Download Resume", href: links.resume, icon: FileText, download: true },
];

/** Scene 9 — Portal: calm final contact scene. */
export function Portal() {
  return (
    <SceneShell
      id="portal"
      eyebrow="Final Portal"
      title="Open a channel"
      intro="The journey ends here — or a new one starts. Reach out through any gate."
    >
      <Reveal variant="cinematic">
        <div className="glass-panel relative overflow-hidden rounded-3xl p-8 sm:p-12">
          {/* portal glow */}
          <span
            aria-hidden
            className="absolute left-1/2 top-0 h-40 w-[130%] -translate-x-1/2 -translate-y-1/2 rounded-[100%] bg-[var(--accent-signal)]/15 blur-3xl"
          />

          <dl className="relative grid gap-x-10 gap-y-4 text-sm sm:grid-cols-2">
            {[
              { dt: "Personal", dd: links.personalEmail, href: `mailto:${links.personalEmail}` },
              { dt: "Work", dd: links.workEmail, href: `mailto:${links.workEmail}` },
              { dt: "Website", dd: links.websiteLabel, href: links.website },
              { dt: "Location", dd: profile.location },
            ].map((row) => (
              <div key={row.dt} className="flex items-baseline gap-3">
                <dt className="scene-eyebrow w-20 shrink-0 !text-[0.6rem]">{row.dt}</dt>
                <dd className="truncate">
                  {row.href ? (
                    <a
                      href={row.href}
                      {...(row.href.startsWith("http")
                        ? { target: "_blank", rel: "noreferrer" }
                        : {})}
                      className="text-[var(--ink)] underline-offset-4 transition-colors hover:text-white hover:underline"
                    >
                      {row.dd}
                    </a>
                  ) : (
                    <span className="inline-flex items-center gap-1.5 text-[var(--ink-dim)]">
                      <MapPin size={13} aria-hidden />
                      {row.dd}
                    </span>
                  )}
                </dd>
              </div>
            ))}
          </dl>

          <div className="relative mt-9 flex flex-wrap gap-3">
            {portalButtons.map(({ label, href, icon: Icon, external, download }) => (
              <a
                key={label}
                href={href}
                {...(external ? { target: "_blank", rel: "noreferrer" } : {})}
                {...(download ? { target: "_blank", rel: "noreferrer" } : {})}
                className="sheen glass-panel inline-flex items-center gap-2 rounded-xl px-4 py-2.5 font-[family-name:var(--font-display)] text-sm uppercase tracking-[0.12em] transition-colors hover:border-white/35"
              >
                <Icon size={15} aria-hidden />
                {label}
              </a>
            ))}
          </div>
        </div>
      </Reveal>

      <footer className="mt-16 flex flex-col items-center gap-4 pb-8 text-center">
        <div className="flex items-center gap-4 opacity-45">
          <Image
            src={assets.respawnLogo}
            alt="Respawn Entertainment"
            width={92}
            height={19}
            className="logo-on-dark h-4 w-auto"
            unoptimized
          />
          <span aria-hidden className="h-5 w-px bg-white/20" />
          <Image
            src={assets.eaLogo}
            alt="Electronic Arts"
            width={20}
            height={20}
            className="h-5 w-5"
            unoptimized
          />
        </div>
        <p className="text-xs text-[var(--ink-dim)]">
          © {new Date().getFullYear()} {profile.name} · Built as a playable
          portfolio · {profile.location}
        </p>
      </footer>
    </SceneShell>
  );
}
