"use client";

/**
 * The signature 3D badge: a real WebGL card hanging from a physics rope.
 * Mirrors the v0 "IRL event lanyard" interaction — Rapier rigid-body rope
 * segments joined by rope/spherical joints, a MeshLine strap with repeating
 * RESPAWN ENTERTAINMENT fabric texture, drag with inertia, drop-in entrance
 * with overshoot, and tap-to-flip with UV-region link hotspots.
 */
import * as THREE from "three";
import { Suspense, use, useEffect, useMemo, useRef, useState } from "react";
import { Canvas, extend, useFrame, useThree, type ThreeElement } from "@react-three/fiber";
import { Environment, Lightformer } from "@react-three/drei";
import {
  BallCollider,
  CuboidCollider,
  Physics,
  RigidBody,
  useRopeJoint,
  useSphericalJoint,
  type RapierRigidBody,
} from "@react-three/rapier";
import { MeshLineGeometry, MeshLineMaterial } from "meshline";
import { RotateCcw } from "lucide-react";
import { getBadgeArt, type BadgeArt } from "./badgeTextures";

extend({ MeshLineGeometry, MeshLineMaterial });

declare module "@react-three/fiber" {
  interface ThreeElements {
    meshLineGeometry: ThreeElement<typeof MeshLineGeometry>;
    meshLineMaterial: ThreeElement<typeof MeshLineMaterial>;
  }
}

const CARD_W3 = 1.6;
const CARD_H3 = 2.25;
const TAP_THRESHOLD_PX = 8;

export function Lanyard3D() {
  // Remounting the Canvas restores the badge to its spawn state.
  const [resetKey, setResetKey] = useState(0);

  return (
    <div className="relative h-[500px] w-full sm:h-[600px] lg:h-[720px]">
      <Canvas
        key={resetKey}
        camera={{ position: [0, 0, 11], fov: 25 }}
        dpr={[1, 1.5]}
        gl={{ alpha: true, antialias: true }}
        // pan-y keeps page scrolling alive on touch; taps + horizontal drags
        // reach the card (mobile gets the simplified drag, per spec)
        style={{ touchAction: "pan-y", background: "transparent" }}
        aria-label="Interactive 3D badge on a lanyard — drag to swing, tap to flip"
        role="img"
      >
        <CameraRig />
        <ambientLight intensity={Math.PI} />
        <Suspense fallback={null}>
          <Physics gravity={[0, -40, 0]} timeStep={1 / 60}>
            <Band />
          </Physics>
          <Environment>
            <Lightformer intensity={2} color="white" position={[0, -1, 5]} rotation={[0, 0, Math.PI / 3]} scale={[100, 0.1, 1]} />
            <Lightformer intensity={3} color="white" position={[-1, -1, 1]} rotation={[0, 0, Math.PI / 3]} scale={[100, 0.1, 1]} />
            <Lightformer intensity={3} color="white" position={[1, 1, 1]} rotation={[0, 0, Math.PI / 3]} scale={[100, 0.1, 1]} />
            <Lightformer intensity={6} color="white" position={[-10, 0, 14]} rotation={[0, Math.PI / 2, Math.PI / 3]} scale={[100, 10, 1]} />
          </Environment>
        </Suspense>
      </Canvas>
      <button
        onClick={() => setResetKey((k) => k + 1)}
        className="absolute bottom-0 left-1/2 flex -translate-x-1/2 items-center gap-2 rounded-full border border-white/15 bg-white/5 px-4 py-1.5 text-[0.65rem] uppercase tracking-[0.25em] text-[var(--ink-dim)] backdrop-blur transition-colors hover:text-[var(--ink)]"
      >
        <RotateCcw size={12} aria-hidden />
        Reset badge
      </button>
      <p className="sr-only">
        Badge front: Respawn logo, Wentao Lu, Software Development Engineer,
        Respawn Studios @ Electronic Arts, AI &amp; QA Researcher, GitHub and
        LinkedIn links. Back: QR code to LinkedIn — scan profile.
      </p>
    </div>
  );
}

/** Pull the camera back on narrow canvases so the swing stays in frame. */
function CameraRig() {
  const camera = useThree((s) => s.camera);
  const width = useThree((s) => s.size.width);
  useEffect(() => {
    camera.position.z = width < 500 ? 14.5 : 11;
    camera.updateProjectionMatrix();
  }, [camera, width]);
  return null;
}

function Band({ maxSpeed = 50, minSpeed = 10 }) {
  const art = use(getBadgeArt());

  const band = useRef<THREE.Mesh<MeshLineGeometry, MeshLineMaterial>>(null);
  // null! — the joint hooks require non-nullable refs; bodies exist on mount
  const fixed = useRef<RapierRigidBody>(null!);
  const j1 = useRef<RapierRigidBody>(null!);
  const j2 = useRef<RapierRigidBody>(null!);
  const j3 = useRef<RapierRigidBody>(null!);
  const card = useRef<RapierRigidBody>(null!);
  const flipGroup = useRef<THREE.Group>(null);

  const vec = useMemo(() => new THREE.Vector3(), []);
  const ang = useMemo(() => new THREE.Vector3(), []);
  const rot = useMemo(() => new THREE.Vector3(), []);
  const dir = useMemo(() => new THREE.Vector3(), []);
  const lerped = useRef<{
    j1: THREE.Vector3 | null;
    j2: THREE.Vector3 | null;
    j3: THREE.Vector3 | null;
  }>({ j1: null, j2: null, j3: null });
  const quat = useMemo(() => new THREE.Quaternion(), []);
  const clampPoint = useMemo(() => new THREE.Vector3(), []);

  const [curve] = useState(
    () =>
      new THREE.CatmullRomCurve3(
        [
          new THREE.Vector3(),
          new THREE.Vector3(),
          new THREE.Vector3(),
          new THREE.Vector3(),
          new THREE.Vector3(),
        ],
        false,
        "chordal",
      ),
  );
  const [dragged, setDragged] = useState<THREE.Vector3 | false>(false);
  const [hovered, setHovered] = useState(false);
  const [flipped, setFlipped] = useState(false);
  const downPos = useRef<{ x: number; y: number } | null>(null);
  const { size } = useThree();

  const { frontMats, bandTex } = useMemo(() => {
    const mk = (canvas: HTMLCanvasElement) => {
      const t = new THREE.CanvasTexture(canvas);
      t.colorSpace = THREE.SRGBColorSpace;
      t.anisotropy = 16;
      return t;
    };
    const frontTex = mk(art.front);
    const backTex = mk(art.back);
    const bandT = mk(art.band);
    bandT.wrapS = bandT.wrapT = THREE.RepeatWrapping;

    const face = (map: THREE.Texture) =>
      new THREE.MeshPhysicalMaterial({
        map,
        clearcoat: 1,
        clearcoatRoughness: 0.15,
        roughness: 0.35,
        metalness: 0.15,
      });
    const edge = new THREE.MeshStandardMaterial({
      color: "#181b22",
      roughness: 0.5,
      metalness: 0.6,
    });
    // box faces: +x, -x, +y, -y, +z (front), -z (back)
    const mats = [edge, edge, edge, edge, face(frontTex), face(backTex)];
    return { frontMats: mats, bandTex: bandT };
  }, [art]);

  const bandMaterial = useMemo(() => {
    const m = new MeshLineMaterial({
      color: new THREE.Color("white"),
      resolution: new THREE.Vector2(size.width, size.height),
      useMap: 1,
      map: bandTex,
      repeat: new THREE.Vector2(-4, 1),
      lineWidth: 1,
    });
    m.depthTest = false;
    m.transparent = true;
    return m;
  }, [bandTex, size.width, size.height]);

  useRopeJoint(fixed, j1, [[0, 0, 0], [0, 0, 0], 1]);
  useRopeJoint(j1, j2, [[0, 0, 0], [0, 0, 0], 1]);
  useRopeJoint(j2, j3, [[0, 0, 0], [0, 0, 0], 1]);
  // card anchor sits just above the card's top edge (at the clamp)
  useSphericalJoint(j3, card, [[0, 0, 0], [0, CARD_H3 / 2 + 0.12, 0]]);

  useEffect(() => {
    if (hovered) {
      document.body.style.cursor = dragged ? "grabbing" : "grab";
      return () => {
        document.body.style.cursor = "auto";
      };
    }
  }, [hovered, dragged]);

  const openIfLinkRegion = (uv: THREE.Vector2 | undefined, materialIndex: number) => {
    // Front face only, and only while the front is showing
    if (uv && materialIndex === 4 && !flipped) {
      for (const r of art.frontRegions) {
        if (uv.x >= r.u0 && uv.x <= r.u1 && uv.y >= r.v0 && uv.y <= r.v1) {
          window.open(r.href, "_blank", "noopener,noreferrer");
          return true;
        }
      }
    }
    return false;
  };

  useFrame((state, delta) => {
    if (dragged && card.current) {
      vec.set(state.pointer.x, state.pointer.y, 0.5).unproject(state.camera);
      dir.copy(vec).sub(state.camera.position).normalize();
      vec.add(dir.multiplyScalar(state.camera.position.length()));
      [card, j1, j2, j3, fixed].forEach((ref) => ref.current?.wakeUp());
      card.current.setNextKinematicTranslation({
        x: vec.x - dragged.x,
        y: vec.y - dragged.y,
        z: vec.z - dragged.z,
      });
    }
    if (fixed.current && j1.current && j2.current && j3.current && card.current && band.current) {
      // Smooth the rope joints to avoid jitter when over-pulling
      if (!lerped.current.j1) lerped.current.j1 = new THREE.Vector3().copy(j1.current.translation());
      if (!lerped.current.j2) lerped.current.j2 = new THREE.Vector3().copy(j2.current.translation());
      if (!lerped.current.j3) lerped.current.j3 = new THREE.Vector3().copy(j3.current.translation());
      for (const [ref, l] of [
        [j1, lerped.current.j1],
        [j2, lerped.current.j2],
        [j3, lerped.current.j3],
      ] as const) {
        const t = ref.current!.translation();
        const clamped = Math.max(0.1, Math.min(1, l.distanceTo(t)));
        // cap the factor at 1 — a slow frame (large delta) must never extrapolate
        l.lerp(t, Math.min(1, delta * (minSpeed + clamped * (maxSpeed - minSpeed))));
      }
      // Pin the strap end to the clamp on the card itself so the connection
      // never flickers — j3 alone bounces around the joint every frame.
      const cardRot = card.current.rotation();
      quat.set(cardRot.x, cardRot.y, cardRot.z, cardRot.w);
      const cardPos = card.current.translation();
      clampPoint
        .set(0, CARD_H3 / 2 + 0.18, 0)
        .applyQuaternion(quat)
        .add(vec.set(cardPos.x, cardPos.y, cardPos.z));
      curve.points[0].copy(clampPoint);
      curve.points[1].copy(lerped.current.j3);
      // chordal Catmull-Rom NaNs on coincident points — keep p1 off p0
      if (curve.points[1].distanceTo(curve.points[0]) < 0.05) {
        curve.points[1].y = curve.points[0].y + 0.05;
      }
      curve.points[2].copy(lerped.current.j2);
      curve.points[3].copy(lerped.current.j1);
      curve.points[4].copy(fixed.current.translation());
      band.current.geometry.setPoints(curve.getPoints(32));
      // Ease the card back to face the camera
      ang.copy(card.current.angvel());
      rot.copy(card.current.rotation());
      card.current.setAngvel({ x: ang.x, y: ang.y - rot.y * 0.25, z: ang.z }, false);
    }
    // Spring the flip rotation
    if (flipGroup.current) {
      flipGroup.current.rotation.y = THREE.MathUtils.damp(
        flipGroup.current.rotation.y,
        flipped ? Math.PI : 0,
        8,
        delta,
      );
    }
  });

  const segmentProps = {
    canSleep: true,
    colliders: false as const,
    angularDamping: 2,
    linearDamping: 2,
  };

  return (
    <>
      {/* Anchor sits top-center; the card spawns level with it so gravity
          produces the drop → overshoot → swing → settle entrance. */}
      <group position={[0, 3.6, 0]}>
        <RigidBody ref={fixed} type="fixed" {...segmentProps} />
        <RigidBody position={[0.5, 0, 0]} ref={j1} {...segmentProps} type="dynamic">
          <BallCollider args={[0.1]} />
        </RigidBody>
        <RigidBody position={[1, 0, 0]} ref={j2} {...segmentProps} type="dynamic">
          <BallCollider args={[0.1]} />
        </RigidBody>
        <RigidBody position={[1.5, 0, 0]} ref={j3} {...segmentProps} type="dynamic">
          <BallCollider args={[0.1]} />
        </RigidBody>
        <RigidBody
          position={[2, 0, 0]}
          ref={card}
          {...segmentProps}
          type={dragged ? "kinematicPosition" : "dynamic"}
        >
          <CuboidCollider args={[CARD_W3 / 2, CARD_H3 / 2, 0.02]} />
          <group
            onPointerOver={() => setHovered(true)}
            onPointerOut={() => setHovered(false)}
            onPointerDown={(e) => {
              (e.target as Element).setPointerCapture(e.pointerId);
              downPos.current = { x: e.clientX, y: e.clientY };
              if (card.current) {
                setDragged(
                  new THREE.Vector3().copy(e.point).sub(vec.copy(card.current.translation())),
                );
              }
            }}
            onPointerUp={(e) => {
              (e.target as Element).releasePointerCapture(e.pointerId);
              setDragged(false);
              // Tap (below drag threshold) → link hotspot or flip
              if (downPos.current) {
                const dx = e.clientX - downPos.current.x;
                const dy = e.clientY - downPos.current.y;
                if (Math.hypot(dx, dy) < TAP_THRESHOLD_PX) {
                  const consumed = openIfLinkRegion(e.uv, e.face?.materialIndex ?? 4);
                  if (!consumed) setFlipped((f) => !f);
                }
                downPos.current = null;
              }
            }}
          >
            <group ref={flipGroup}>
              {/* the card slab */}
              <mesh material={frontMats}>
                <boxGeometry args={[CARD_W3, CARD_H3, 0.04]} />
              </mesh>
            </group>
            {/* metal clamp — outside the flip group (the strap side doesn't
                spin), pieces overlap into each other so no faces are ever
                coplanar (coplanar contact z-fights and flickers) */}
            <group>
              <mesh position={[0, CARD_H3 / 2 + 0.06, 0]}>
                <boxGeometry args={[0.46, 0.2, 0.09]} />
                <meshStandardMaterial color="#b9bec9" metalness={0.65} roughness={0.35} />
              </mesh>
              <mesh position={[0, CARD_H3 / 2 + 0.19, 0]}>
                <cylinderGeometry args={[0.045, 0.045, 0.18, 16]} />
                <meshStandardMaterial color="#b9bec9" metalness={0.65} roughness={0.35} />
              </mesh>
            </group>
          </group>
        </RigidBody>
      </group>
      {/* the strap */}
      {/* frustumCulled off + no raycast: the line is regenerated every frame,
          so three must never compute a bounding sphere from empty geometry */}
      <mesh
        ref={(m: THREE.Mesh<MeshLineGeometry, MeshLineMaterial> | null) => {
          band.current = m;
          // distinct seed points — identical points make the chordal curve NaN
          if (m)
            m.geometry.setPoints([
              new THREE.Vector3(0, 3.6, 0),
              new THREE.Vector3(0, 2.4, 0),
              new THREE.Vector3(0, 1.2, 0),
              new THREE.Vector3(0, 0, 0),
            ]);
        }}
        frustumCulled={false}
        raycast={() => null}
      >
        <meshLineGeometry />
        <primitive object={bandMaterial} attach="material" />
      </mesh>
    </>
  );
}
