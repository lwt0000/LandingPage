"use client";

import dynamic from "next/dynamic";
import Image from "next/image";
import { motion, useReducedMotion } from "framer-motion";
import { ArrowDown, FileText, FolderOpen, Send } from "lucide-react";
import { assets, links, profile } from "@/content/content";

// The badge (WebGL + physics) loads client-side only, after the shell paints.
const BadgeRig = dynamic(
  () => import("@/components/badge/BadgeRig").then((m) => m.BadgeRig),
  { ssr: false, loading: () => <BadgeSlot /> },
);

function BadgeSlot() {
  return (
    <div
      aria-hidden
      className="h-[500px] w-full sm:h-[600px] lg:h-[720px]"
    />
  );
}

const heroButtons = [
  { label: "Start Journey", href: "#profile", icon: ArrowDown, primary: true },
  { label: "View Resume", href: links.resume, icon: FileText, primary: false },
  { label: "Explore Work", href: "#missions", icon: FolderOpen, primary: false },
  { label: "Contact", href: "#portal", icon: Send, primary: false },
];

/** Scene 1 — Spawn: cinematic opening with the physics badge as centerpiece. */
export function Spawn() {
  const reducedMotion = useReducedMotion();
  // Always render initial/animate so SSR and client markup agree; reduced
  // motion zeroes the duration instead (conditional props would hydrate to a
  // permanently-hidden state).
  const enter = (delay: number) => ({
    initial: { opacity: 0, y: 28 },
    animate: { opacity: 1, y: 0 },
    transition: reducedMotion
      ? { duration: 0 }
      : { duration: 0.9, delay, ease: [0.22, 1, 0.36, 1] as const },
  });

  return (
    <section
      id="spawn"
      aria-label="Spawn — introduction"
      className="relative flex min-h-svh scroll-mt-16 flex-col justify-center overflow-hidden px-4 pt-10 sm:px-8"
    >
      <div className="mx-auto grid w-full max-w-7xl items-center gap-4 lg:grid-cols-[1.05fr_0.95fr]">
        {/* Badge first in DOM on mobile so the signature moment leads */}
        <div className="order-1 lg:order-2">
          <BadgeRig />
        </div>

        <div className="order-2 pb-16 lg:order-1 lg:pb-0">
          <motion.p {...enter(0.15)} className="scene-eyebrow flex items-center gap-3">
            <Image
              src={assets.respawnLogo}
              alt=""
              width={92}
              height={19}
              className="logo-on-dark h-4 w-auto opacity-70"
              unoptimized
              aria-hidden
            />
            <span>{profile.studio}</span>
          </motion.p>

          <motion.h1
            {...enter(0.3)}
            className="scene-title mt-5 text-6xl leading-[0.95] sm:text-8xl"
          >
            {profile.name}
          </motion.h1>

          <motion.p
            {...enter(0.45)}
            className="mt-4 font-[family-name:var(--font-display)] text-xl text-[var(--ink)] sm:text-2xl"
          >
            {profile.title}
            <span className="mx-3 text-[var(--ink-dim)]" aria-hidden>
              ◆
            </span>
            {profile.taglineRole}
          </motion.p>

          <motion.p
            {...enter(0.6)}
            className="mt-5 max-w-xl text-lg leading-relaxed text-[var(--ink-dim)]"
          >
            {profile.heroSubtitle}
          </motion.p>

          <motion.div {...enter(0.75)} className="mt-9 flex flex-wrap gap-3">
            {heroButtons.map(({ label, href, icon: Icon, primary }) => (
              <a
                key={label}
                href={href}
                {...(href.endsWith(".pdf")
                  ? { target: "_blank", rel: "noreferrer" }
                  : {})}
                className={
                  primary
                    ? "sheen inline-flex items-center gap-2 rounded-xl bg-[var(--ink)] px-5 py-3 font-[family-name:var(--font-display)] text-sm font-semibold uppercase tracking-[0.14em] text-[#0b0c10] transition-transform hover:scale-[1.03]"
                    : "sheen glass-panel inline-flex items-center gap-2 rounded-xl px-5 py-3 font-[family-name:var(--font-display)] text-sm uppercase tracking-[0.14em] text-[var(--ink)] transition-colors hover:border-white/30"
                }
              >
                <Icon size={15} aria-hidden />
                {label}
              </a>
            ))}
          </motion.div>
        </div>
      </div>

      <motion.a
        href="#profile"
        aria-label="Scroll to Profile"
        className="absolute bottom-6 left-1/2 hidden -translate-x-1/2 text-[var(--ink-dim)] transition-colors hover:text-[var(--ink)] lg:block"
        {...(reducedMotion
          ? {}
          : {
              animate: { y: [0, 8, 0] },
              transition: { repeat: Infinity, duration: 2.2, ease: "easeInOut" },
            })}
      >
        <ArrowDown size={20} aria-hidden />
      </motion.a>
    </section>
  );
}
