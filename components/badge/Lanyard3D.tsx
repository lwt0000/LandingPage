"use client";

/**
 * The signature 3D badge: the documented Three.js/Rapier lanyard
 * (BADGE_BOUNCING_ANIMATION.md). A GLB card (card + clip + clamp meshes)
 * hangs from a rope of Rapier rigid bodies joined by rope/spherical joints;
 * a MeshLine strap with a branded fabric texture is drawn through the body
 * positions each frame. Drag makes the card kinematic; release hands it
 * back to physics for the bounce. Tap flips to the QR back; the GitHub /
 * LinkedIn chips on the front are UV-region link hotspots.
 */
import * as THREE from "three";
import { Suspense, useEffect, useMemo, useRef, useState } from "react";
import { Canvas, extend, useFrame, useThree, type ThreeElement } from "@react-three/fiber";
import { Environment, Lightformer, useGLTF } from "@react-three/drei";
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
import { assets } from "@/content/content";
import { getGlbBadgeArt, type GlbBadgeArt } from "./badgeTextures";

extend({ MeshLineGeometry, MeshLineMaterial });

declare module "@react-three/fiber" {
  interface ThreeElements {
    meshLineGeometry: ThreeElement<typeof MeshLineGeometry>;
    meshLineMaterial: ThreeElement<typeof MeshLineMaterial>;
  }
}

useGLTF.preload(assets.cardModel);

const TAP_THRESHOLD_PX = 8;

interface CardGLB {
  nodes: {
    card: THREE.Mesh;
    clip: THREE.Mesh;
    clamp: THREE.Mesh;
  };
  materials: {
    base: THREE.MeshStandardMaterial;
    metal: THREE.MeshStandardMaterial;
  };
}

export function Lanyard3D() {
  // Remounting the Canvas restores the badge to its spawn state.
  const [resetKey, setResetKey] = useState(0);
  const [isMobile] = useState(
    () => typeof window !== "undefined" && window.innerWidth < 640,
  );

  return (
    <div className="relative h-[500px] w-full sm:h-[600px] lg:h-[720px]">
      <Canvas
        key={resetKey}
        camera={{ position: [0, 0, 13], fov: 25 }}
        dpr={[1, isMobile ? 4 : 2]}
        gl={{ alpha: true, antialias: true }}
        // pan-y keeps page scrolling alive on touch; taps + horizontal drags
        // reach the card
        style={{ touchAction: "pan-y", background: "transparent" }}
        aria-label="Interactive 3D badge on a lanyard — drag to swing, tap to flip"
        role="img"
      >
        <CameraRig />
        <ambientLight intensity={Math.PI} />
        <Suspense fallback={null}>
          <Physics gravity={[0, -40, 0]} timeStep={isMobile ? 1 / 30 : 1 / 60}>
            <Band isMobile={isMobile} />
          </Physics>
          <Environment blur={0.75}>
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
    camera.position.z = width < 500 ? 11.5 : 8.5;
    camera.updateProjectionMatrix();
  }, [camera, width]);
  return null;
}

function Band(props: { isMobile: boolean; maxSpeed?: number; minSpeed?: number }) {
  const [art, setArt] = useState<GlbBadgeArt | null>(null);

  useEffect(() => {
    let mounted = true;
    void getGlbBadgeArt().then((nextArt) => {
      if (mounted) setArt(nextArt);
    });
    return () => {
      mounted = false;
    };
  }, []);

  if (!art) return null;

  return <BandPhysics {...props} art={art} />;
}

function BandPhysics({
  art,
  isMobile,
  maxSpeed = 50,
  minSpeed = 0,
}: {
  art: GlbBadgeArt;
  isMobile: boolean;
  maxSpeed?: number;
  minSpeed?: number;
}) {
  const { nodes, materials } = useGLTF(assets.cardModel) as unknown as CardGLB;
  const gl = useThree((s) => s.gl);

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
  // Smoothed strap positions for j1/j2 (the template's `lerped` vectors)
  const lerped = useRef<{ j1: THREE.Vector3 | null; j2: THREE.Vector3 | null }>({
    j1: null,
    j2: null,
  });

  const [curve] = useState(
    () =>
      new THREE.CatmullRomCurve3(
        [new THREE.Vector3(), new THREE.Vector3(), new THREE.Vector3(), new THREE.Vector3()],
        false,
        "chordal",
      ),
  );
  const [dragged, setDragged] = useState<THREE.Vector3 | false>(false);
  const [hovered, setHovered] = useState(false);
  const [flipped, setFlipped] = useState(false);
  const downPos = useRef<{ x: number; y: number } | null>(null);
  const touchOnCard = useRef(false);

  // touch-action: pan-y on the canvas keeps the page scrollable, but it also
  // let vertical card drags turn into page scrolls. Block native scrolling
  // only for touches that begin on the card: pointerdown (which raycasts the
  // card and sets the flag) fires before the compatibility touchstart event.
  useEffect(() => {
    const el = gl.domElement;
    const block = (e: TouchEvent) => {
      if (touchOnCard.current && e.cancelable) e.preventDefault();
    };
    el.addEventListener("touchstart", block, { passive: false });
    el.addEventListener("touchmove", block, { passive: false });
    return () => {
      el.removeEventListener("touchstart", block);
      el.removeEventListener("touchmove", block);
    };
  }, [gl]);

  const { cardTex, bandTex } = useMemo(() => {
    // Requesting more anisotropy than the GPU supports is an invalid-value
    // error that leaves the texture with none at all — mobile GPUs often cap
    // at 8 or don't support it, which is part of the mobile blurriness.
    const aniso = Math.min(16, gl.capabilities.getMaxAnisotropy());
    const cardT = new THREE.CanvasTexture(art.atlas);
    cardT.flipY = false; // atlas is painted in glTF UV space (v origin at top)
    cardT.colorSpace = THREE.SRGBColorSpace;
    cardT.anisotropy = aniso;
    const bandT = new THREE.CanvasTexture(art.band);
    bandT.colorSpace = THREE.SRGBColorSpace;
    bandT.anisotropy = aniso;
    bandT.wrapS = bandT.wrapT = THREE.RepeatWrapping;
    return { cardTex: cardT, bandTex: bandT };
  }, [art, gl]);

  // Imperative — MeshLineMaterial's constructor typing demands a resolution,
  // which doesn't fit the declarative args/props split.
  const bandMaterial = useMemo(() => {
    const m = new MeshLineMaterial({
      color: new THREE.Color("white"),
      resolution: new THREE.Vector2(1000, isMobile ? 2000 : 1000),
      useMap: 1,
      map: bandTex,
      repeat: new THREE.Vector2(-4, 1),
      lineWidth: 1,
    });
    m.depthTest = false;
    return m;
  }, [bandTex, isMobile]);

  useRopeJoint(fixed, j1, [[0, 0, 0], [0, 0, 0], 1]);
  useRopeJoint(j1, j2, [[0, 0, 0], [0, 0, 0], 1]);
  useRopeJoint(j2, j3, [[0, 0, 0], [0, 0, 0], 1]);
  // the badge hangs from a point above its center — this offset drives the swing
  useSphericalJoint(j3, card, [[0, 0, 0], [0, 1.45, 0]]);

  useEffect(() => {
    if (hovered) {
      document.body.style.cursor = dragged ? "grabbing" : "grab";
      return () => {
        document.body.style.cursor = "auto";
      };
    }
  }, [hovered, dragged]);

  const openIfLinkRegion = (uv: THREE.Vector2 | undefined) => {
    // Hotspots live on the front face only (left half of the atlas), so a
    // flipped card — whose raycast hits the back face (u > 0.5) — never matches.
    if (uv && !flipped) {
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
      // Smooth j1/j2 so the visible strap lags the physics slightly, then
      // catches up faster the further it falls behind (the template's feel).
      if (!lerped.current.j1) lerped.current.j1 = new THREE.Vector3().copy(j1.current.translation());
      if (!lerped.current.j2) lerped.current.j2 = new THREE.Vector3().copy(j2.current.translation());
      for (const [ref, l] of [
        [j1, lerped.current.j1],
        [j2, lerped.current.j2],
      ] as const) {
        const t = ref.current.translation();
        const clampedDistance = Math.max(0.1, Math.min(1, l.distanceTo(t)));
        // cap the factor at 1 — a slow frame (large delta) must never extrapolate
        l.lerp(t, Math.min(1, delta * (minSpeed + clampedDistance * (maxSpeed - minSpeed))));
      }
      curve.points[0].copy(j3.current.translation());
      curve.points[1].copy(lerped.current.j2);
      curve.points[2].copy(lerped.current.j1);
      curve.points[3].copy(fixed.current.translation());
      band.current.geometry.setPoints(curve.getPoints(isMobile ? 16 : 32));
      // Weak restoring force around Y so the card faces the camera again
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
    type: "dynamic" as const,
    canSleep: true,
    colliders: false as const,
    angularDamping: 4,
    linearDamping: 4,
  };

  return (
    <>
      {/* The bodies start as a horizontal chain; gravity + the joints produce
          the drop → overshoot → swing → settle entrance. */}
      <group position={[0, 4, 0]}>
        <RigidBody ref={fixed} {...segmentProps} type="fixed" />
        <RigidBody position={[0.5, 0, 0]} ref={j1} {...segmentProps}>
          <BallCollider args={[0.1]} />
        </RigidBody>
        <RigidBody position={[1, 0, 0]} ref={j2} {...segmentProps}>
          <BallCollider args={[0.1]} />
        </RigidBody>
        <RigidBody position={[1.5, 0, 0]} ref={j3} {...segmentProps}>
          <BallCollider args={[0.1]} />
        </RigidBody>
        <RigidBody
          position={[2, 0, 0]}
          ref={card}
          {...segmentProps}
          type={dragged ? "kinematicPosition" : "dynamic"}
        >
          <CuboidCollider args={[0.8, 1.125, 0.01]} />
          <group
            scale={2.25}
            position={[0, -1.2, -0.05]}
            onPointerOver={() => setHovered(true)}
            onPointerOut={() => setHovered(false)}
            onPointerDown={(e) => {
              (e.target as Element).setPointerCapture(e.pointerId);
              touchOnCard.current = true;
              downPos.current = { x: e.clientX, y: e.clientY };
              if (card.current) {
                setDragged(
                  new THREE.Vector3().copy(e.point).sub(vec.copy(card.current.translation())),
                );
              }
            }}
            onPointerUp={(e) => {
              (e.target as Element).releasePointerCapture(e.pointerId);
              touchOnCard.current = false;
              setDragged(false);
              // Tap (below drag threshold) → link hotspot or flip
              if (downPos.current) {
                const dx = e.clientX - downPos.current.x;
                const dy = e.clientY - downPos.current.y;
                if (Math.hypot(dx, dy) < TAP_THRESHOLD_PX) {
                  const consumed = openIfLinkRegion(e.uv);
                  if (!consumed) setFlipped((f) => !f);
                }
                downPos.current = null;
              }
            }}
            onPointerCancel={() => {
              touchOnCard.current = false;
              downPos.current = null;
              setDragged(false);
            }}
          >
            {/* the card slab flips; the clip/clamp stay put on the strap */}
            <group ref={flipGroup}>
              <mesh geometry={nodes.card.geometry}>
                <meshPhysicalMaterial
                  map={cardTex}
                  transparent
                  opacity={1.8}
                  depthWrite={false}
                  clearcoat={1}
                  clearcoatRoughness={0.05}
                  roughness={0.08}
                  metalness={0}
                  transmission={isMobile ? 0.18 : 0.38}
                  thickness={0.35}
                  ior={1.45}
                  reflectivity={0.85}
                />
              </mesh>
            </group>
            <mesh geometry={nodes.clip.geometry} material={materials.metal} material-roughness={0.3} />
            <mesh geometry={nodes.clamp.geometry} material={materials.metal} />
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
              new THREE.Vector3(0, 4, 0),
              new THREE.Vector3(0, 2.7, 0),
              new THREE.Vector3(0, 1.4, 0),
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
