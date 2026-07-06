"use client";

import { useEffect, useRef, useState } from "react";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { Backpack, FileText, Globe, Mail, X } from "lucide-react";
import {
  GithubIcon as Github,
  LinkedinIcon as Linkedin,
} from "@/components/icons/BrandIcons";
import { inventoryLinks, type LinkKind } from "@/content/content";

type IconComponent = React.ComponentType<{
  size?: number;
  className?: string;
  "aria-hidden"?: boolean;
}>;

const ICONS: Record<LinkKind, IconComponent> = {
  resume: FileText,
  github: Github,
  linkedin: Linkedin,
  email: Mail,
  website: Globe,
};

/**
 * Resume Inventory: a floating quick-access drawer (bottom-left) holding
 * resume, GitHub, LinkedIn, both emails, and the website — reachable from
 * anywhere on the page.
 */
export function Inventory() {
  const [open, setOpen] = useState(false);
  const panelRef = useRef<HTMLDivElement>(null);
  const reducedMotion = useReducedMotion();

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    const onClick = (e: MouseEvent) => {
      if (panelRef.current && !panelRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    window.addEventListener("keydown", onKey);
    window.addEventListener("pointerdown", onClick);
    return () => {
      window.removeEventListener("keydown", onKey);
      window.removeEventListener("pointerdown", onClick);
    };
  }, [open]);

  return (
    <div ref={panelRef} className="fixed bottom-4 left-4 z-[70] sm:bottom-6 sm:left-6">
      <AnimatePresence>
        {open && (
          <motion.div
            role="menu"
            aria-label="Inventory quick access"
            className="glass-panel absolute bottom-14 left-0 w-64 rounded-2xl p-2"
            style={{ background: "var(--bg-elevated)" }}
            initial={reducedMotion ? { opacity: 0 } : { opacity: 0, y: 16, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={reducedMotion ? { opacity: 0 } : { opacity: 0, y: 12, scale: 0.96 }}
            transition={{ type: "spring", stiffness: 380, damping: 30 }}
          >
            <p className="scene-eyebrow px-3 pb-1 pt-2 !text-[0.6rem]">Inventory</p>
            <ul>
              {inventoryLinks.map((l) => {
                const Icon = ICONS[l.kind];
                const external = l.href.startsWith("http");
                return (
                  <li key={l.href + l.label}>
                    <a
                      role="menuitem"
                      href={l.href}
                      {...(external ? { target: "_blank", rel: "noreferrer" } : {})}
                      className="flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm text-[var(--ink)] transition-colors hover:bg-white/5"
                    >
                      <Icon size={16} className="shrink-0 text-[var(--ink-dim)]" aria-hidden />
                      <span className="truncate">{l.label}</span>
                    </a>
                  </li>
                );
              })}
            </ul>
          </motion.div>
        )}
      </AnimatePresence>
      <button
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        aria-label={open ? "Close inventory" : "Open inventory — resume and links"}
        className="glass-panel flex h-11 items-center gap-2 rounded-full px-4 font-[family-name:var(--font-display)] text-[0.7rem] uppercase tracking-[0.22em] text-[var(--ink)] transition-all hover:border-white/30 hover:shadow-[0_0_24px_-4px_var(--glow-ember)]"
        style={{ background: "var(--bg-elevated)" }}
      >
        {open ? <X size={16} aria-hidden /> : <Backpack size={16} aria-hidden />}
        Inventory
      </button>
    </div>
  );
}
