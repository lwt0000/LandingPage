"use client";

import { useEffect, useMemo, useState } from "react";
import Image from "next/image";
import {
  motion,
  useMotionValue,
  useReducedMotion,
  useTransform,
} from "framer-motion";
import QRCode from "qrcode";
import { RefreshCcw } from "lucide-react";
import { GithubIcon as Github, LinkedinIcon as Linkedin } from "@/components/icons/BrandIcons";
import { assets, links, profile, qrTarget } from "@/content/content";

const REST_LEN = 190; // px from anchor to card top at rest

/**
 * 2.5D badge — the graceful-degradation path (prefers-reduced-motion or no
 * WebGL). A DOM card on a stretchy strap: drop-in, drag with spring
 * snap-back, tap/button to flip. All content is real DOM (fully accessible).
 */
export function Badge2D() {
  const reducedMotion = useReducedMotion();
  const [flipped, setFlipped] = useState(false);
  const [qr, setQr] = useState<string | null>(null);

  const x = useMotionValue(0);
  const y = useMotionValue(0);

  // Strap follows the dragged card like a stretched ribbon
  const strapAngle = useTransform([x, y], ([dx, dy]: number[]) =>
    (Math.atan2(dx, REST_LEN + dy) * 180) / Math.PI * -1,
  );
  const strapLen = useTransform([x, y], ([dx, dy]: number[]) =>
    Math.max(60, Math.hypot(dx, REST_LEN + dy)),
  );
  // Card tilts subtly toward the drag direction
  const cardTilt = useTransform(x, [-200, 200], [-10, 10]);

  useEffect(() => {
    QRCode.toDataURL(qrTarget, {
      width: 360,
      margin: 1,
      color: { dark: "#0b0c10", light: "#f2f3f6" },
    })
      .then(setQr)
      .catch(() => setQr(null));
  }, []);

  const entrance = useMemo(
    () =>
      reducedMotion
        ? {}
        : {
            initial: { y: "-120vh", rotate: -8 },
            animate: { y: 0, rotate: 0 },
            transition: {
              type: "spring" as const,
              stiffness: 42,
              damping: 9, // low damping → dramatic overshoot + swing
              mass: 1.2,
              delay: 0.35,
            },
          },
    [reducedMotion],
  );

  return (
    <div className="relative flex h-[500px] w-full items-start justify-center sm:h-[600px] lg:h-[720px]">
      <motion.div {...entrance} className="relative flex flex-col items-center">
        {/* anchor point */}
        <span
          aria-hidden
          className="z-10 h-3 w-10 rounded-b-lg border border-white/20 bg-[#181b24]"
        />

        {/* strap */}
        <motion.div
          aria-hidden
          className="relative z-0 w-12 origin-top overflow-hidden border-x border-white/10"
          style={{
            height: strapLen,
            rotate: strapAngle,
            background: "linear-gradient(90deg,#161922,#242835,#161922)",
            marginTop: -2,
          }}
        >
          <div
            className="absolute inset-0 flex items-center justify-center py-2"
            style={{ writingMode: "vertical-rl" }}
          >
            <span className="whitespace-nowrap font-[family-name:var(--font-display)] text-[0.55rem] font-bold tracking-[0.3em] text-white/70">
              {Array.from({ length: 4 }).map((_, i) => (
                <span key={i}>
                  RESPAWN ENTERTAINMENT{" "}
                  <span className="text-[var(--accent-ember)]">◆</span>{" "}
                </span>
              ))}
            </span>
          </div>
        </motion.div>

        {/* card (draggable, flippable) */}
        <motion.div
          drag={!reducedMotion}
          dragSnapToOrigin
          dragElastic={0.32}
          dragTransition={{ bounceStiffness: 240, bounceDamping: 11 }}
          whileDrag={{ scale: 1.04, boxShadow: "0 40px 80px -20px rgba(0,0,0,0.9)" }}
          // touchAction none: card drags must never turn into page scrolls
          style={{ x, y, rotate: reducedMotion ? 0 : cardTilt, marginTop: -6, touchAction: "none" }}
          className="relative z-10 cursor-grab active:cursor-grabbing"
          onTap={() => setFlipped((f) => !f)}
        >
          <motion.div
            className="relative h-[385px] w-[275px] sm:h-[460px] sm:w-[328px]"
            style={{ transformStyle: "preserve-3d" }}
            animate={{ rotateY: flipped ? 180 : 0 }}
            transition={
              reducedMotion
                ? { duration: 0 }
                : { type: "spring", stiffness: 200, damping: 20 }
            }
          >
            {/* FRONT */}
            <div
              className="absolute inset-0 flex flex-col items-center rounded-3xl border border-white/15 p-5 [backface-visibility:hidden]"
              style={{
                background:
                  "linear-gradient(150deg,#14161d 0%,#0c0e13 55%,#101319 100%)",
                boxShadow:
                  "inset 0 1px 0 rgba(255,255,255,0.12), 0 30px 60px -18px rgba(0,0,0,0.85)",
              }}
            >
              <span
                aria-hidden
                className="mb-3 h-2.5 w-16 rounded-full border border-white/20 bg-black/80"
              />
              <Image
                src={assets.respawnLogo}
                alt="Respawn Entertainment"
                width={140}
                height={29}
                className="logo-on-dark mt-1 h-6 w-auto"
                unoptimized
              />
              <div className="mt-6 text-center">
                <p className="font-[family-name:var(--font-display)] text-xl font-bold sm:text-2xl">
                  {profile.name}
                </p>
                <p className="mt-1 text-[0.7rem] text-[var(--ink-dim)] sm:text-xs">
                  {profile.title}
                </p>
                <p className="mt-1.5 font-[family-name:var(--font-display)] text-[0.62rem] font-semibold uppercase tracking-[0.2em] text-[var(--accent-ember)]">
                  {profile.taglineRole}
                </p>
                <p className="mt-1.5 text-[0.62rem] text-[var(--ink-dim)]">
                  {profile.studio}
                </p>
              </div>
              <div className="my-auto w-full rounded-full border border-[var(--accent-signal)]/40 bg-[var(--accent-signal)]/10 px-3 py-1.5 text-center font-[family-name:var(--font-display)] text-[0.55rem] tracking-[0.25em] text-[#9db4f5]">
                ALL-AREA ACCESS · GAME AI · QA
              </div>
              <div className="mt-auto flex w-full items-end justify-between">
                <div className="flex gap-2">
                  <a
                    href={links.github}
                    target="_blank"
                    rel="noreferrer"
                    aria-label="GitHub — lwt0000"
                    onPointerDownCapture={(e) => e.stopPropagation()}
                    className="flex h-9 w-9 items-center justify-center rounded-lg border border-white/15 bg-white/5 text-[var(--ink)] transition-colors hover:border-white/40"
                  >
                    <Github size={16} aria-hidden />
                  </a>
                  <a
                    href={links.linkedin}
                    target="_blank"
                    rel="noreferrer"
                    aria-label="LinkedIn — Wentao Lu"
                    onPointerDownCapture={(e) => e.stopPropagation()}
                    className="flex h-9 w-9 items-center justify-center rounded-lg border border-white/15 bg-white/5 text-[var(--ink)] transition-colors hover:border-white/40"
                  >
                    <Linkedin size={16} aria-hidden />
                  </a>
                </div>
                <Image
                  src={assets.eaLogo}
                  alt="Electronic Arts"
                  width={30}
                  height={30}
                  className="h-7 w-7 opacity-90"
                  unoptimized
                />
              </div>
            </div>

            {/* BACK */}
            <div
              className="absolute inset-0 flex flex-col items-center rounded-3xl border border-white/15 p-5 [backface-visibility:hidden] [transform:rotateY(180deg)]"
              style={{
                background:
                  "linear-gradient(150deg,#101319 0%,#0c0e13 55%,#14161d 100%)",
                boxShadow:
                  "inset 0 1px 0 rgba(255,255,255,0.12), 0 30px 60px -18px rgba(0,0,0,0.85)",
              }}
            >
              <span
                aria-hidden
                className="mb-4 h-2.5 w-16 rounded-full border border-white/20 bg-black/80"
              />
              <div className="mt-2 rounded-2xl bg-[#f2f3f6] p-3">
                {qr ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={qr}
                    alt={`QR code linking to ${qrTarget}`}
                    className="h-44 w-44 sm:h-52 sm:w-52"
                  />
                ) : (
                  <a
                    href={qrTarget}
                    className="flex h-44 w-44 items-center justify-center text-center text-xs text-black sm:h-52 sm:w-52"
                  >
                    LinkedIn →
                  </a>
                )}
              </div>
              <p className="mt-4 font-[family-name:var(--font-display)] text-xs font-bold uppercase tracking-[0.4em]">
                Scan Profile
              </p>
              <p className="mt-1 text-[0.65rem] text-[var(--ink-dim)]">
                → LinkedIn · {links.websiteLabel}
              </p>
              <div className="mt-auto flex items-center gap-3 opacity-60">
                <Image
                  src={assets.respawnLogo}
                  alt=""
                  width={90}
                  height={19}
                  className="logo-on-dark h-3.5 w-auto"
                  unoptimized
                  aria-hidden
                />
                <Image
                  src={assets.eaLogo}
                  alt=""
                  width={20}
                  height={20}
                  className="h-4 w-4"
                  unoptimized
                  aria-hidden
                />
              </div>
            </div>
          </motion.div>
        </motion.div>
      </motion.div>

      {/* flip affordance — reliable tap target, also keyboard accessible */}
      <button
        onClick={() => setFlipped((f) => !f)}
        className="absolute bottom-0 left-1/2 flex -translate-x-1/2 items-center gap-2 rounded-full border border-white/15 bg-white/5 px-4 py-1.5 text-[0.65rem] uppercase tracking-[0.25em] text-[var(--ink-dim)] transition-colors hover:text-[var(--ink)]"
        aria-pressed={flipped}
      >
        <RefreshCcw size={12} aria-hidden />
        Flip badge
      </button>
    </div>
  );
}
