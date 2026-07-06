"use client";

import { useRef } from "react";
import {
  motion,
  useMotionValue,
  useReducedMotion,
  useSpring,
} from "framer-motion";
import { SceneShell } from "@/components/SceneShell";
import { useInspect } from "@/components/inspect/InspectProvider";
import { skillBranches } from "@/content/content";

/**
 * Scene 6 — Ability Tree: a constellation, not a grid. Nodes are real
 * buttons positioned in a shared percentage space; an SVG layer underneath
 * draws connecting lines that trace themselves on scroll-in. On small
 * screens the constellation hides and the branch cards below carry the
 * same nodes as tappable chips.
 */

interface LayoutNode {
  x: number;
  y: number;
  branchIndex: number;
  id: string;
  name: string;
  blurb: string;
  branchName: string;
}

const CENTER = { x: 50, y: 50 };

// Staggered quadrant grid: three columns per branch, rows stepping away from
// the core, odd rows offset — constellation feel with guaranteed spacing.
const layout: LayoutNode[] = skillBranches.flatMap((branch, bi) => {
  const right = bi % 2 === 1;
  const bottom = bi >= 2;
  const baseX = right ? 73 : 27;
  const rowStep = bottom ? 12 : -12;
  const startY = bottom ? 66 : 34;
  return branch.nodes.map((node, ni) => {
    const row = Math.floor(ni / 3);
    const col = ni % 3;
    // odd rows shift away from the center line so long chips never collide
    const stagger = row % 2 === 1 ? (right ? 6 : -6) : 0;
    return {
      x: baseX + (col - 1) * 16 + stagger,
      y: startY + row * rowStep,
      branchIndex: bi,
      id: node.id,
      name: node.name,
      blurb: node.blurb,
      branchName: branch.name,
    };
  });
});

const edges: { x1: number; y1: number; x2: number; y2: number; key: string }[] = [];
for (let bi = 0; bi < skillBranches.length; bi++) {
  const nodes = layout.filter((n) => n.branchIndex === bi);
  let prev = CENTER;
  for (const node of nodes) {
    edges.push({ x1: prev.x, y1: prev.y, x2: node.x, y2: node.y, key: `${bi}-${node.id}` });
    prev = node;
  }
}

const clamp = (v: number, min: number, max: number) =>
  Math.min(max, Math.max(min, v));

/** Drag sensitivity (degrees per pixel) and rotation limits for the orbit. */
const ORBIT_SENSITIVITY = 0.35;
const ORBIT_MAX_X = 40;
const ORBIT_MAX_Y = 55;
const DRAG_THRESHOLD_PX = 6;

export function AbilityTree() {
  const { inspect } = useInspect();
  const reducedMotion = useReducedMotion();

  // Click-and-drag orbit: the whole constellation plane rotates in 3D.
  // Raw values track the pointer; springs smooth the visible rotation.
  const rotXRaw = useMotionValue(0);
  const rotYRaw = useMotionValue(0);
  const rotXSpring = useSpring(rotXRaw, { stiffness: 180, damping: 24, mass: 0.6 });
  const rotYSpring = useSpring(rotYRaw, { stiffness: 180, damping: 24, mass: 0.6 });
  const rotateX = reducedMotion ? rotXRaw : rotXSpring;
  const rotateY = reducedMotion ? rotYRaw : rotYSpring;

  const orbit = useRef<{
    id: number;
    startX: number;
    startY: number;
    baseX: number;
    baseY: number;
    moved: boolean;
  } | null>(null);
  const suppressClick = useRef(false);

  const onPointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!e.isPrimary) return;
    orbit.current = {
      id: e.pointerId,
      startX: e.clientX,
      startY: e.clientY,
      baseX: rotXRaw.get(),
      baseY: rotYRaw.get(),
      moved: false,
    };
  };

  const onPointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    const o = orbit.current;
    if (!o || e.pointerId !== o.id) return;
    const dx = e.clientX - o.startX;
    const dy = e.clientY - o.startY;
    if (!o.moved && Math.hypot(dx, dy) > DRAG_THRESHOLD_PX) {
      o.moved = true;
      // Capture only once it's a real drag so plain taps still click nodes.
      try {
        e.currentTarget.setPointerCapture(e.pointerId);
      } catch {
        /* pointer already gone */
      }
    }
    if (o.moved) {
      rotYRaw.set(clamp(o.baseY + dx * ORBIT_SENSITIVITY, -ORBIT_MAX_Y, ORBIT_MAX_Y));
      rotXRaw.set(clamp(o.baseX - dy * ORBIT_SENSITIVITY, -ORBIT_MAX_X, ORBIT_MAX_X));
    }
  };

  const endOrbit = (e: React.PointerEvent<HTMLDivElement>) => {
    const o = orbit.current;
    if (!o || e.pointerId !== o.id) return;
    if (o.moved) suppressClick.current = true;
    orbit.current = null;
  };

  const onClickCapture = (e: React.MouseEvent<HTMLDivElement>) => {
    // A drag just ended — swallow the click so nodes don't open.
    if (suppressClick.current) {
      suppressClick.current = false;
      e.preventDefault();
      e.stopPropagation();
    }
  };

  const openNode = (node: { name: string; blurb: string; branchName: string }) =>
    inspect({
      title: node.name,
      category: `Ability · ${node.branchName}`,
      description: node.blurb,
      tags: [node.branchName],
    });

  return (
    <SceneShell
      id="ability-tree"
      eyebrow="Ability Tree"
      title="Skill constellation"
      intro="Four branches, one build. Select a node to read its description."
      wide
    >
      <div
        className="relative mx-auto hidden aspect-[7/5] w-full max-w-4xl cursor-grab touch-none select-none active:cursor-grabbing sm:block"
        style={{ perspective: 1100 }}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={endOrbit}
        onPointerCancel={endOrbit}
        onClickCapture={onClickCapture}
      >
        <motion.div
          className="absolute inset-0"
          style={{ rotateX, rotateY, transformStyle: "preserve-3d" }}
        >
        <svg
          aria-hidden
          className="absolute inset-0 h-full w-full"
          viewBox="0 0 100 100"
          preserveAspectRatio="none"
        >
          {edges.map((e, i) => (
            <motion.line
              key={e.key}
              x1={e.x1}
              y1={e.y1}
              x2={e.x2}
              y2={e.y2}
              stroke="rgba(255,255,255,0.16)"
              strokeWidth={1}
              vectorEffect="non-scaling-stroke"
              initial={{ pathLength: 0, opacity: 0 }}
              whileInView={{ pathLength: 1, opacity: 1 }}
              viewport={{ once: true, margin: "-15%" }}
              transition={
                reducedMotion
                  ? { duration: 0 }
                  : { duration: 0.8, delay: i * 0.04, ease: "easeOut" }
              }
            />
          ))}
        </svg>

        {/* core */}
        <span
          className="absolute -translate-x-1/2 -translate-y-1/2 rounded-full border border-[var(--accent-ember)]/40 bg-[var(--bg-elevated)] px-3 py-1 font-[family-name:var(--font-display)] text-[0.6rem] uppercase tracking-[0.3em] text-[var(--accent-ember)] shadow-[0_0_24px_var(--glow-ember)]"
          style={{ left: "50%", top: "50%" }}
          aria-hidden
        >
          Core
        </span>

        {layout.map((node, i) => (
          <motion.button
            key={node.id}
            onClick={() => openNode(node)}
            aria-haspopup="dialog"
            className="group absolute -translate-x-1/2 -translate-y-1/2 rounded-full"
            style={{ left: `${node.x}%`, top: `${node.y}%` }}
            initial={{ opacity: 0, scale: 0.4 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true, margin: "-15%" }}
            transition={
              reducedMotion
                ? { duration: 0 }
                : { type: "spring", stiffness: 260, damping: 18, delay: 0.12 + i * 0.03 }
            }
            {...(reducedMotion ? {} : { whileHover: { scale: 1.12 } })}
          >
            <span className="flex items-center gap-1.5 whitespace-nowrap rounded-full border border-white/15 bg-[var(--bg-elevated)]/90 px-2.5 py-1 text-[0.7rem] text-[var(--ink)] backdrop-blur transition-shadow duration-500 group-hover:border-white/40 group-hover:shadow-[0_0_18px_-2px_var(--glow-signal)]">
              <span
                aria-hidden
                className="h-1.5 w-1.5 shrink-0 rounded-full bg-white/50 transition-colors group-hover:bg-[var(--accent-signal)]"
              />
              {node.name}
            </span>
          </motion.button>
        ))}
        </motion.div>
      </div>

      {/* branch cards: legend on desktop, the full tree on mobile */}
      <div className="mt-4 grid gap-3 sm:mt-10 sm:grid-cols-2 lg:grid-cols-4">
        {skillBranches.map((b) => (
          <div key={b.id} className="glass-panel rounded-xl p-4">
            <h3 className="font-[family-name:var(--font-display)] text-sm font-semibold">
              {b.name}
            </h3>
            <p className="mt-1 text-xs leading-relaxed text-[var(--ink-dim)]">{b.blurb}</p>
            <div className="mt-3 flex flex-wrap gap-1.5 sm:hidden">
              {b.nodes.map((n) => (
                <button
                  key={n.id}
                  onClick={() => openNode({ ...n, branchName: b.name })}
                  aria-haspopup="dialog"
                  className="rounded-full border border-white/10 bg-white/[0.04] px-2.5 py-1 text-[0.68rem] text-[var(--ink)]"
                >
                  {n.name}
                </button>
              ))}
            </div>
          </div>
        ))}
      </div>
    </SceneShell>
  );
}
