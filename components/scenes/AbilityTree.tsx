"use client";

import { useEffect, useRef } from "react";
import { useReducedMotion } from "framer-motion";
import { SceneShell } from "@/components/SceneShell";
import { useInspect } from "@/components/inspect/InspectProvider";
import { skillBranches } from "@/content/content";

/**
 * Scene 6 — Ability Tree: an interactive 3D skill sphere. Each branch
 * clusters on one face of a unit sphere (tetrahedral centers); nodes stay
 * real DOM buttons projected to screen space every frame, with SVG lines
 * drawn through the same projection, so the chips keep their glass styling
 * and accessibility. Drag (mouse or touch) spins the sphere with inertia;
 * it also idles in a slow rotation. On small screens the chips shrink and
 * touch-action stays pan-y (horizontal drags spin, vertical swipes scroll);
 * the branch cards below repeat the nodes as easier tap targets.
 */

interface SphereNode {
  id: string;
  name: string;
  blurb: string;
  branchName: string;
  /** Position on the unit sphere. */
  pos: readonly [number, number, number];
}

// ---------- static 3D layout ----------

/** Tetrahedral cluster centers — one per branch, maximally spread. */
const TETRA: [number, number, number][] = (
  [
    [1, 1, 1],
    [1, -1, -1],
    [-1, 1, -1],
    [-1, -1, 1],
  ] as const
).map(([x, y, z]) => {
  const l = Math.hypot(x, y, z);
  return [x / l, y / l, z / l];
});

/** Orthonormal tangent basis (u, v) at a point c on the unit sphere. */
function tangentBasis(c: [number, number, number]) {
  const a: [number, number, number] = Math.abs(c[1]) < 0.9 ? [0, 1, 0] : [1, 0, 0];
  let u: [number, number, number] = [
    c[1] * a[2] - c[2] * a[1],
    c[2] * a[0] - c[0] * a[2],
    c[0] * a[1] - c[1] * a[0],
  ];
  const ul = Math.hypot(...u);
  u = [u[0] / ul, u[1] / ul, u[2] / ul];
  const v: [number, number, number] = [
    c[1] * u[2] - c[2] * u[1],
    c[2] * u[0] - c[0] * u[2],
    c[0] * u[1] - c[1] * u[0],
  ];
  return [u, v] as const;
}

const GOLDEN_ANGLE = Math.PI * (3 - Math.sqrt(5));
const CLUSTER_SPREAD = 0.85; // max angular radius of a branch cluster (rad)

/** Sunflower-pack each branch's nodes inside a spherical cap around its center. */
const sphereNodes: SphereNode[] = skillBranches.flatMap((branch, bi) => {
  const c = TETRA[bi];
  const [u, v] = tangentBasis(c);
  const n = branch.nodes.length;
  return branch.nodes.map((node, k) => {
    const alpha = CLUSTER_SPREAD * Math.sqrt((k + 0.5) / n);
    const theta = k * GOLDEN_ANGLE + bi * 1.7; // per-branch phase de-syncs the spirals
    const ca = Math.cos(alpha);
    const sa = Math.sin(alpha);
    const tx = Math.cos(theta);
    const ty = Math.sin(theta);
    return {
      id: node.id,
      name: node.name,
      blurb: node.blurb,
      branchName: branch.name,
      pos: [
        c[0] * ca + (u[0] * tx + v[0] * ty) * sa,
        c[1] * ca + (u[1] * tx + v[1] * ty) * sa,
        c[2] * ca + (u[2] * tx + v[2] * ty) * sa,
      ] as const,
    };
  });
});

/** Edges as node indices; -1 is the core at the sphere's center. */
const edges: [number, number][] = [];
{
  let offset = 0;
  for (const branch of skillBranches) {
    let prev = -1;
    for (let k = 0; k < branch.nodes.length; k++) {
      edges.push([prev, offset + k]);
      prev = offset + k;
    }
    offset += branch.nodes.length;
  }
}

// ---------- projection ----------

const ASPECT = 7 / 5; // matches the container's aspect-[7/5]
const RY = 36; // sphere radius in % of container height
const RX = RY / ASPECT; // same radius in % of container width
const PERSP = 3.2; // camera distance in sphere radii
const DRAG_RAD_PER_PX = 0.005;
const IDLE_SPIN_RAD_S = 0.1;
const PITCH_LIMIT = 1.2;
const DRAG_THRESHOLD_PX = 6;

interface Projected {
  X: number; // % of width
  Y: number; // % of height
  z: number; // rotated depth, -1 (back) .. 1 (front)
  s: number; // perspective scale
}

function project(yaw: number, pitch: number): Projected[] {
  const cy = Math.cos(yaw);
  const sy = Math.sin(yaw);
  const cp = Math.cos(pitch);
  const sp = Math.sin(pitch);
  return sphereNodes.map(({ pos: [x, y, z] }) => {
    const x1 = x * cy + z * sy;
    const z1 = -x * sy + z * cy;
    const y1 = y * cp - z1 * sp;
    const z2 = y * sp + z1 * cp;
    const s = PERSP / (PERSP - z2);
    return { X: 50 + x1 * RX * s, Y: 50 - y1 * RY * s, z: z2, s };
  });
}

const CORE: Projected = { X: 50, Y: 50, z: 0, s: 1 };
const INITIAL_YAW = 0.5;
const INITIAL_PITCH = -0.22;
const initialProj = project(INITIAL_YAW, INITIAL_PITCH);

const formatNumber = (value: number, precision: number) =>
  value
    .toFixed(precision)
    .replace(/\.?0+$/, "");

const formatPercent = (value: number) => `${formatNumber(value, 4)}%`;
const formatScale = (value: number) => formatNumber(value, 5);
const formatOpacity = (value: number) => formatNumber(value, 6);

const nodeDepthStyle = (p: Projected): React.CSSProperties => ({
  left: formatPercent(p.X),
  top: formatPercent(p.Y),
  transform: `translate(-50%, -50%) scale(${formatScale(p.s)})`,
  opacity: formatOpacity(0.35 + 0.65 * (p.z + 1) / 2),
  zIndex: String(100 + Math.round(p.z * 50)),
});

const edgeOpacity = (a: Projected, b: Projected) =>
  0.08 + 0.16 * ((a.z + b.z) / 2 + 1) / 2;

const clamp = (v: number, min: number, max: number) =>
  Math.min(max, Math.max(min, v));

export function AbilityTree() {
  const { inspect } = useInspect();
  const reducedMotion = useReducedMotion();

  const nodeEls = useRef<(HTMLButtonElement | null)[]>([]);
  const lineEls = useRef<(SVGLineElement | null)[]>([]);

  // Rotation state lives in refs — the rAF loop writes styles directly,
  // so dragging never re-renders React.
  const rot = useRef({ yaw: INITIAL_YAW, pitch: INITIAL_PITCH, vYaw: 0, vPitch: 0 });
  const drag = useRef<{
    id: number;
    lastX: number;
    lastY: number;
    lastT: number;
    startX: number;
    startY: number;
    moved: boolean;
  } | null>(null);
  const suppressClick = useRef(false);

  useEffect(() => {
    let raf = 0;
    let last = performance.now();
    const tick = (now: number) => {
      const dt = Math.min(0.05, (now - last) / 1000);
      last = now;
      const r = rot.current;
      if (!drag.current?.moved) {
        // inertia + gentle idle spin
        r.yaw += r.vYaw * dt;
        r.pitch = clamp(r.pitch + r.vPitch * dt, -PITCH_LIMIT, PITCH_LIMIT);
        const decay = Math.exp(-dt * 2.5);
        r.vYaw *= decay;
        r.vPitch *= decay;
        if (!reducedMotion) r.yaw += IDLE_SPIN_RAD_S * dt;
      }
      const proj = project(r.yaw, r.pitch);
      proj.forEach((p, i) => {
        const el = nodeEls.current[i];
        if (!el) return;
        const st = nodeDepthStyle(p);
        el.style.left = st.left as string;
        el.style.top = st.top as string;
        el.style.transform = st.transform as string;
        el.style.opacity = String(st.opacity);
        el.style.zIndex = String(st.zIndex);
      });
      edges.forEach(([a, b], i) => {
        const el = lineEls.current[i];
        if (!el) return;
        const pa = a < 0 ? CORE : proj[a];
        const pb = proj[b];
        el.setAttribute("x1", pa.X.toFixed(2));
        el.setAttribute("y1", pa.Y.toFixed(2));
        el.setAttribute("x2", pb.X.toFixed(2));
        el.setAttribute("y2", pb.Y.toFixed(2));
        el.style.opacity = edgeOpacity(pa, pb).toFixed(3);
      });
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [reducedMotion]);

  const onPointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!e.isPrimary) return;
    drag.current = {
      id: e.pointerId,
      lastX: e.clientX,
      lastY: e.clientY,
      lastT: e.timeStamp,
      startX: e.clientX,
      startY: e.clientY,
      moved: false,
    };
    rot.current.vYaw = 0;
    rot.current.vPitch = 0;
  };

  const onPointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    const d = drag.current;
    if (!d || e.pointerId !== d.id) return;
    if (!d.moved && Math.hypot(e.clientX - d.startX, e.clientY - d.startY) > DRAG_THRESHOLD_PX) {
      d.moved = true;
      // Capture only once it's a real drag so plain taps still click nodes.
      try {
        e.currentTarget.setPointerCapture(e.pointerId);
      } catch {
        /* pointer already gone */
      }
    }
    if (!d.moved) return;
    const dx = e.clientX - d.lastX;
    const dy = e.clientY - d.lastY;
    const dt = Math.max(1, e.timeStamp - d.lastT) / 1000;
    const r = rot.current;
    r.yaw += dx * DRAG_RAD_PER_PX;
    r.pitch = clamp(r.pitch - dy * DRAG_RAD_PER_PX, -PITCH_LIMIT, PITCH_LIMIT);
    // Smoothed release velocity for inertia
    r.vYaw = 0.7 * r.vYaw + 0.3 * ((dx * DRAG_RAD_PER_PX) / dt);
    r.vPitch = 0.7 * r.vPitch + 0.3 * ((-dy * DRAG_RAD_PER_PX) / dt);
    d.lastX = e.clientX;
    d.lastY = e.clientY;
    d.lastT = e.timeStamp;
  };

  const endDrag = (e: React.PointerEvent<HTMLDivElement>) => {
    const d = drag.current;
    if (!d || e.pointerId !== d.id) return;
    if (d.moved) suppressClick.current = true;
    drag.current = null;
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
      intro="Four branches on one sphere. Drag to spin it; select a node to read its description."
      wide
    >
      <div
        className="relative mx-auto aspect-[7/5] w-full max-w-4xl cursor-grab touch-pan-y select-none active:cursor-grabbing sm:touch-none"
        aria-label="3D skill sphere — drag to rotate"
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={endDrag}
        onPointerCancel={endDrag}
        onClickCapture={onClickCapture}
      >
        <svg
          aria-hidden
          className="absolute inset-0 h-full w-full"
          viewBox="0 0 100 100"
          preserveAspectRatio="none"
        >
          {edges.map(([a, b], i) => {
            const pa = a < 0 ? CORE : initialProj[a];
            const pb = initialProj[b];
            return (
              <line
                key={`${a}-${b}`}
                ref={(el) => {
                  lineEls.current[i] = el;
                }}
                x1={pa.X.toFixed(2)}
                y1={pa.Y.toFixed(2)}
                x2={pb.X.toFixed(2)}
                y2={pb.Y.toFixed(2)}
                stroke="white"
                strokeWidth={1}
                vectorEffect="non-scaling-stroke"
                style={{ opacity: formatOpacity(edgeOpacity(pa, pb)) }}
              />
            );
          })}
        </svg>

        {/* core — the sphere's center, so it never moves under rotation */}
        <span
          className="absolute -translate-x-1/2 -translate-y-1/2 rounded-full border border-[var(--accent-ember)]/40 bg-[var(--bg-elevated)] px-2 py-0.5 font-[family-name:var(--font-display)] text-[0.5rem] uppercase tracking-[0.3em] text-[var(--accent-ember)] shadow-[0_0_24px_var(--glow-ember)] sm:px-3 sm:py-1 sm:text-[0.6rem]"
          style={{ left: "50%", top: "50%", zIndex: 100 }}
          aria-hidden
        >
          Core
        </span>

        {sphereNodes.map((node, i) => (
          <button
            key={node.id}
            ref={(el) => {
              nodeEls.current[i] = el;
            }}
            onClick={() => openNode(node)}
            aria-haspopup="dialog"
            className="group absolute rounded-full"
            style={nodeDepthStyle(initialProj[i])}
          >
            <span className="flex items-center gap-1 whitespace-nowrap rounded-full border border-white/15 bg-[var(--bg-elevated)]/90 px-2 py-0.5 text-[0.55rem] text-[var(--ink)] backdrop-blur transition-[transform,box-shadow,border-color] duration-300 group-hover:scale-110 group-hover:border-white/40 group-hover:shadow-[0_0_18px_-2px_var(--glow-signal)] sm:gap-1.5 sm:px-2.5 sm:py-1 sm:text-[0.7rem]">
              <span
                aria-hidden
                className="h-1 w-1 shrink-0 rounded-full bg-white/50 transition-colors group-hover:bg-[var(--accent-signal)] sm:h-1.5 sm:w-1.5"
              />
              {node.name}
            </span>
          </button>
        ))}
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
