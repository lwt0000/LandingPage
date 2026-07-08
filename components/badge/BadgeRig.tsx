"use client";

import { useEffect, useState } from "react";
import dynamic from "next/dynamic";
import { Badge2D } from "./Badge2D";

// Defer the three/rapier bundle until we know this device gets the 3D badge.
const Lanyard3D = dynamic(
  () => import("./Lanyard3D").then((m) => m.Lanyard3D),
  {
    ssr: false,
    loading: () => (
      <div aria-hidden className="h-[500px] w-full sm:h-[600px] lg:h-[720px]" />
    ),
  },
);

function supportsWebGL(): boolean {
  try {
    const canvas = document.createElement("canvas");
    return Boolean(
      window.WebGLRenderingContext &&
        (canvas.getContext("webgl2") || canvas.getContext("webgl")),
    );
  } catch {
    return false;
  }
}

/**
 * Feature gate for the hero badge. Default experience: the 3D physics
 * lanyard. Falls back to the 2.5D Framer Motion badge only for
 * prefers-reduced-motion, missing WebGL, or very low-memory devices.
 */
export function BadgeRig() {
  const [mode, setMode] = useState<"3d" | "2d" | null>(null);

  useEffect(() => {
    const decide = () => {
      const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
      const lowPower =
        "deviceMemory" in navigator &&
        (navigator as Navigator & { deviceMemory?: number }).deviceMemory! <= 2;
      setMode(reduced || lowPower || !supportsWebGL() ? "2d" : "3d");
    };
    // Defer the heavy 3D init (Rapier WASM, shader compile, atlas texture
    // upload) into idle time so it can't hitch the hero text entrance that
    // plays during the first second.
    if (typeof window.requestIdleCallback === "function") {
      const id = window.requestIdleCallback(decide, { timeout: 800 });
      return () => window.cancelIdleCallback(id);
    }
    const id = window.setTimeout(decide, 300);
    return () => window.clearTimeout(id);
  }, []);

  if (mode === null) {
    return (
      <div aria-hidden className="h-[500px] w-full sm:h-[600px] lg:h-[720px]" />
    );
  }
  return mode === "3d" ? <Lanyard3D /> : <Badge2D />;
}
