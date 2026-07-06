"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { X, ExternalLink } from "lucide-react";

/** One reusable inspection panel shared by projects, publications, experience, and skills. */
export interface InspectItem {
  title: string;
  category: string;
  description: string;
  technologies?: string[];
  tags?: string[];
  dates?: string;
  links?: { label: string; href: string }[];
}

interface InspectContextValue {
  inspect: (item: InspectItem) => void;
}

const InspectContext = createContext<InspectContextValue | null>(null);

export function useInspect(): InspectContextValue {
  const ctx = useContext(InspectContext);
  if (!ctx) throw new Error("useInspect must be used within InspectProvider");
  return ctx;
}

export function InspectProvider({ children }: { children: ReactNode }) {
  const [item, setItem] = useState<InspectItem | null>(null);
  const closeButtonRef = useRef<HTMLButtonElement>(null);
  const lastFocusedRef = useRef<HTMLElement | null>(null);
  const reducedMotion = useReducedMotion();

  const inspect = useCallback((next: InspectItem) => {
    lastFocusedRef.current = document.activeElement as HTMLElement | null;
    setItem(next);
  }, []);

  const close = useCallback(() => {
    setItem(null);
    lastFocusedRef.current?.focus();
  }, []);

  useEffect(() => {
    if (!item) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") close();
    };
    window.addEventListener("keydown", onKey);
    closeButtonRef.current?.focus();
    document.body.style.overflow = "hidden";
    return () => {
      window.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [item, close]);

  return (
    <InspectContext.Provider value={{ inspect }}>
      {children}
      <AnimatePresence>
        {item && (
          <motion.div
            className="fixed inset-0 z-[90] flex items-end justify-center p-4 sm:items-center"
            role="dialog"
            aria-modal="true"
            aria-label={`Inspect: ${item.title}`}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: reducedMotion ? 0 : 0.2 }}
          >
            <button
              aria-label="Close inspect panel"
              className="absolute inset-0 cursor-default bg-black/70 backdrop-blur-sm"
              onClick={close}
              tabIndex={-1}
            />
            <motion.div
              className="glass-panel relative w-full max-w-xl rounded-2xl p-6 sm:p-8"
              initial={
                reducedMotion
                  ? { opacity: 0 }
                  : { opacity: 0, y: 40, scale: 0.96, rotateX: 6 }
              }
              animate={{ opacity: 1, y: 0, scale: 1, rotateX: 0 }}
              exit={
                reducedMotion
                  ? { opacity: 0 }
                  : { opacity: 0, y: 24, scale: 0.97 }
              }
              transition={{ type: "spring", stiffness: 320, damping: 28 }}
              style={{ transformPerspective: 900, background: "var(--bg-elevated)" }}
            >
              <div className="mb-1 flex items-start justify-between gap-4">
                <p className="scene-eyebrow">{item.category}</p>
                <button
                  ref={closeButtonRef}
                  onClick={close}
                  aria-label="Close"
                  className="-mr-2 -mt-2 rounded-lg p-2 text-[var(--ink-dim)] transition-colors hover:bg-white/5 hover:text-[var(--ink)]"
                >
                  <X size={18} />
                </button>
              </div>
              <h3 className="scene-title text-xl text-balance sm:text-2xl">
                {item.title}
              </h3>
              {item.dates && (
                <p className="mt-1 text-sm text-[var(--ink-dim)]">{item.dates}</p>
              )}
              <p className="mt-4 leading-relaxed text-[var(--ink-dim)]">
                {item.description}
              </p>
              {item.technologies && item.technologies.length > 0 && (
                <div className="mt-5">
                  <p className="scene-eyebrow mb-2 !text-[0.62rem]">Technologies</p>
                  <div className="flex flex-wrap gap-2">
                    {item.technologies.map((t) => (
                      <span
                        key={t}
                        className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs text-[var(--ink)]"
                      >
                        {t}
                      </span>
                    ))}
                  </div>
                </div>
              )}
              {item.tags && item.tags.length > 0 && (
                <div className="mt-4 flex flex-wrap gap-2">
                  {item.tags.map((t) => (
                    <span
                      key={t}
                      className="text-xs tracking-wide text-[var(--ink-dim)] before:mr-1 before:content-['#']"
                    >
                      {t}
                    </span>
                  ))}
                </div>
              )}
              {item.links && item.links.length > 0 && (
                <div className="mt-6 flex flex-wrap gap-3">
                  {item.links.map((l) => (
                    <a
                      key={l.href}
                      href={l.href}
                      target="_blank"
                      rel="noreferrer"
                      className="inline-flex items-center gap-1.5 rounded-lg border border-white/15 px-3 py-1.5 text-sm transition-colors hover:border-white/35 hover:bg-white/5"
                    >
                      {l.label}
                      <ExternalLink size={13} aria-hidden />
                    </a>
                  ))}
                </div>
              )}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </InspectContext.Provider>
  );
}
