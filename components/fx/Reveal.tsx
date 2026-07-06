"use client";

import { useEffect, useRef, type ReactNode } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { cn } from "@/lib/cn";

if (typeof window !== "undefined") {
  gsap.registerPlugin(ScrollTrigger);
}

type RevealVariant = "rise" | "fade" | "cinematic" | "left" | "right";

const FROM: Record<RevealVariant, gsap.TweenVars> = {
  rise: { y: 48, opacity: 0 },
  fade: { opacity: 0 },
  cinematic: { y: 60, opacity: 0, scale: 0.97, filter: "blur(8px)" },
  left: { x: -60, opacity: 0 },
  right: { x: 60, opacity: 0 },
};

/**
 * GSAP ScrollTrigger reveal wrapper. Children start hidden and animate in
 * when scrolled into view. With prefers-reduced-motion, content renders
 * immediately with no animation.
 */
export function Reveal({
  children,
  variant = "rise",
  delay = 0,
  duration = 1,
  className,
  as: Tag = "div",
}: {
  children: ReactNode;
  variant?: RevealVariant;
  delay?: number;
  duration?: number;
  className?: string;
  as?: "div" | "section" | "li" | "span" | "h2" | "p";
}) {
  const ref = useRef<HTMLElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    const ctx = gsap.context(() => {
      gsap.fromTo(el, FROM[variant], {
        y: 0,
        x: 0,
        opacity: 1,
        scale: 1,
        filter: "blur(0px)",
        duration,
        delay,
        ease: "power3.out",
        scrollTrigger: {
          trigger: el,
          start: "top 85%",
          toggleActions: "play none none none",
        },
      });
    });
    return () => ctx.revert();
  }, [variant, delay, duration]);

  // Start visible (reduced-motion / no-JS safe); GSAP sets the "from" state itself.
  return (
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    <Tag ref={ref as any} className={cn(className)}>
      {children}
    </Tag>
  );
}

/** Scroll-linked parallax: element drifts vertically as it moves through the viewport. */
export function Parallax({
  children,
  speed = 0.15,
  className,
}: {
  children: ReactNode;
  speed?: number;
  className?: string;
}) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    const ctx = gsap.context(() => {
      gsap.fromTo(
        el,
        { y: () => speed * 220 },
        {
          y: () => speed * -220,
          ease: "none",
          scrollTrigger: {
            trigger: el,
            start: "top bottom",
            end: "bottom top",
            scrub: 0.8,
          },
        },
      );
    });
    return () => ctx.revert();
  }, [speed]);

  return (
    <div ref={ref} className={className}>
      {children}
    </div>
  );
}
