# Badge Bouncing Animation

This project builds the bouncing badge as a real-time 3D physics scene, not as a CSS/keyframe animation. The core implementation lives in:

- `components/ui/lanyard.tsx` - Three.js scene, Rapier physics, lanyard strap, draggable badge.
- `components/lanyard-with-controls.tsx` - passes a generated card texture into the 3D badge.
- `components/card-template.tsx` - renders the personalized card texture into an offscreen canvas.
- `public/card.glb` - 3D model containing the badge, clip, and clamp meshes.
- `components/ui/lanyard.png` - strap texture.

## Dependencies

Install the same rendering and physics stack in the target project:

```bash
pnpm add three @react-three/fiber @react-three/drei @react-three/rapier meshline clsx
```

For TypeScript projects, also use:

```bash
pnpm add -D @types/three
```

If the target project uses Next.js or another SSR framework, the lanyard component must be client-only because it touches `window`, WebGL, pointer events, and Rapier.

```tsx
'use client';
```

## Scene Structure

The lanyard is rendered inside a React Three Fiber `<Canvas>`.

Important setup from `components/ui/lanyard.tsx`:

```tsx
<Canvas
  camera={{ position, fov }}
  dpr={[1, isMobile ? 1.5 : 2]}
  gl={{ alpha: transparent, preserveDrawingBuffer: true }}
>
  <ambientLight intensity={Math.PI} />
  <Physics gravity={gravity} timeStep={isMobile ? 1 / 30 : 1 / 60}>
    <Band isMobile={isMobile} cardTextureUrl={cardTextureUrl} />
  </Physics>
  <Environment blur={0.75}>
    {/* Lightformers */}
  </Environment>
</Canvas>
```

Default physics gravity is stronger than normal Earth gravity:

```ts
gravity = [0, -40, 0]
```

That high downward force makes the badge feel weighty and makes the strap snap back visibly after dragging.

## Physics Model

The effect is made from five Rapier rigid bodies:

| Body | Type | Purpose |
| --- | --- | --- |
| `fixed` | fixed | Invisible anchor point at the top of the lanyard. |
| `j1` | dynamic | First rope segment particle. |
| `j2` | dynamic | Second rope segment particle. |
| `j3` | dynamic | Third rope segment particle, connected to the badge. |
| `card` | dynamic or kinematic | The physical badge body. Becomes kinematic while dragged. |

All dynamic segment bodies share these tuning values:

```ts
const segmentProps = {
  type: 'dynamic',
  canSleep: true,
  colliders: false,
  angularDamping: 4,
  linearDamping: 4,
}
```

The damping is important. Without it, the badge keeps swinging too long. With damping `4`, the motion still bounces but settles quickly.

The bodies start in a horizontal chain inside a group placed at `[0, 4, 0]`:

```tsx
<group position={[0, 4, 0]}>
  <RigidBody ref={fixed} type="fixed" />
  <RigidBody ref={j1} position={[0.5, 0, 0]} />
  <RigidBody ref={j2} position={[1, 0, 0]} />
  <RigidBody ref={j3} position={[1.5, 0, 0]} />
  <RigidBody ref={card} position={[2, 0, 0]} />
</group>
```

Gravity pulls the dynamic bodies downward, while the joints constrain their distances. That creates the hanging, bouncing behavior.

## Joints

The strap uses three rope joints and one spherical joint:

```ts
useRopeJoint(fixed, j1, [[0, 0, 0], [0, 0, 0], 1])
useRopeJoint(j1, j2, [[0, 0, 0], [0, 0, 0], 1])
useRopeJoint(j2, j3, [[0, 0, 0], [0, 0, 0], 1])

useSphericalJoint(j3, card, [
  [0, 0, 0],
  [0, 1.45, 0],
])
```

The rope joints keep each segment no more than `1` world unit apart. This makes a lightweight chain.

The spherical joint connects the final strap particle to the card at an offset of `[0, 1.45, 0]`, so the badge hangs from a point above its center instead of from its middle. This offset is what makes the card swing and rotate naturally.

## Colliders

The intermediate rope bodies use small ball colliders:

```tsx
<BallCollider args={[0.1]} />
```

The badge uses a thin cuboid collider:

```tsx
<CuboidCollider args={[0.8, 1.125, 0.01]} />
```

Those cuboid values are half-extents, so the physical badge is roughly `1.6 x 2.25 x 0.02` world units.

## Dragging

Dragging works by temporarily changing the card rigid body from dynamic to kinematic:

```tsx
type={dragged ? 'kinematicPosition' : 'dynamic'}
```

When the pointer goes down, the code stores the offset between the pointer hit point and the card body's current translation:

```ts
drag(new THREE.Vector3().copy(e.point).sub(vec.copy(card.current.translation())))
```

On each frame while dragging:

1. Convert the 2D pointer position into a 3D world-space point.
2. Wake all sleeping physics bodies.
3. Move the kinematic badge to the pointer target minus the stored grab offset.

```ts
vec.set(state.pointer.x, state.pointer.y, 0.5).unproject(state.camera)
dir.copy(vec).sub(state.camera.position).normalize()
vec.add(dir.multiplyScalar(state.camera.position.length()))

;[card, j1, j2, j3, fixed].forEach((ref) => ref.current?.wakeUp())

card.current?.setNextKinematicTranslation({
  x: vec.x - dragged.x,
  y: vec.y - dragged.y,
  z: vec.z - dragged.z,
})
```

When the pointer is released, `dragged` becomes `false`, the card switches back to `dynamic`, and Rapier takes over again. The rope joints and gravity create the bounce-back.

## Strap Rendering

The strap is not rendered from physics colliders. It is a visual `meshline` curve drawn through the physics body positions.

The code creates a four-point Catmull-Rom curve:

```ts
const curve = new THREE.CatmullRomCurve3([
  new THREE.Vector3(),
  new THREE.Vector3(),
  new THREE.Vector3(),
  new THREE.Vector3(),
])

curve.curveType = 'chordal'
```

Every frame, the curve points are updated from the physics bodies:

```ts
curve.points[0].copy(j3.current.translation())
curve.points[1].copy(j2.current.lerped)
curve.points[2].copy(j1.current.lerped)
curve.points[3].copy(fixed.current.translation())

band.current.geometry.setPoints(curve.getPoints(isMobile ? 16 : 32))
```

Notice that `j1` and `j2` use a smoothed `lerped` position instead of the raw physics translation:

```ts
if (!ref.current.lerped) {
  ref.current.lerped = new THREE.Vector3().copy(ref.current.translation())
}

const clampedDistance = Math.max(
  0.1,
  Math.min(1, ref.current.lerped.distanceTo(ref.current.translation()))
)

ref.current.lerped.lerp(
  ref.current.translation(),
  delta * (minSpeed + clampedDistance * (maxSpeed - minSpeed))
)
```

This is a key part of the feel. The visible strap lags behind the actual physics bodies slightly, then catches up faster when the distance is larger. With the defaults:

```ts
minSpeed = 0
maxSpeed = 50
```

The result is a soft elastic strap without needing a more complex rope mesh simulation.

The strap material uses the lanyard texture:

```tsx
<meshLineMaterial
  color="white"
  depthTest={false}
  resolution={isMobile ? [1000, 2000] : [1000, 1000]}
  useMap
  map={texture}
  repeat={[-4, 1]}
  lineWidth={1}
/>
```

`texture.wrapS = texture.wrapT = THREE.RepeatWrapping` lets the texture tile along the line.

## Badge Rotation Stabilization

The card gets a small corrective angular velocity every frame:

```ts
ang.copy(card.current.angvel())
rot.copy(card.current.rotation())
card.current.setAngvel({
  x: ang.x,
  y: ang.y - rot.y * 0.25,
  z: ang.z,
})
```

This acts like a weak restoring force around the Y axis. It keeps the card from spinning sideways forever and helps it face the camera after motion settles.

## Card Model And Texture

The 3D model is loaded from:

```ts
const cardGLB = '/card.glb'
const { nodes, materials } = useGLTF(cardGLB)
```

It expects these mesh names in the GLB:

- `nodes.card.geometry`
- `nodes.clip.geometry`
- `nodes.clamp.geometry`
- `materials.base.map`
- `materials.metal`

The rendered card mesh uses either the GLB's built-in base material map or a generated texture:

```tsx
<meshPhysicalMaterial
  map={cardTextureUrl && customCardTexture ? customCardTexture : materials.base.map}
  map-anisotropy={16}
  clearcoat={isMobile ? 0 : 1}
  clearcoatRoughness={0.15}
  roughness={0.9}
  metalness={0.8}
/>
```

If you want static badges in another project, you can skip the custom texture path and bake your design directly into the GLB material or use a normal image URL.

If you want personalized badges, copy the `CardTemplate` pattern:

1. Create an offscreen canvas.
2. Draw the base card image.
3. Draw user text.
4. Convert it to a PNG data URL with `canvas.toDataURL("image/png")`.
5. Load that data URL into a Three.js texture.
6. Pass that texture into the card material.

## Minimum Porting Checklist

Copy these assets:

- `public/card.glb`
- `components/ui/lanyard.png`
- Any card base images if you need dynamic badge textures.

Port these implementation pieces:

- The client-only `Lanyard` component.
- The `Band` component with Rapier bodies, joints, drag handling, and `useFrame`.
- The `extend({ MeshLineGeometry, MeshLineMaterial })` call.
- The CSS/container rule that gives the canvas a real height, such as `h-screen` or `aspect-square`.

Keep these default tuning values first:

```ts
gravity = [0, -40, 0]
timeStep = desktop ? 1 / 60 : 1 / 30
linearDamping = 4
angularDamping = 4
ropeLength = 1
sphericalJointCardOffset = [0, 1.45, 0]
strapMinSpeed = 0
strapMaxSpeed = 50
cardColliderHalfExtents = [0.8, 1.125, 0.01]
```

After it works, tune only one value at a time.

## Tuning Guide

| Goal | Change |
| --- | --- |
| More dramatic bounce | Increase gravity magnitude, lower damping slightly, or increase drag distance. |
| Less chaotic motion | Increase `linearDamping` and `angularDamping`. |
| Longer strap | Add more bodies/joints or increase rope joint length. |
| Softer-looking strap | Lower `maxSpeed` so the visual curve catches up more slowly. |
| Snappier strap | Raise `maxSpeed`. |
| Badge faces camera more strongly | Increase the `rot.y * 0.25` correction factor. |
| Badge spins more freely | Lower or remove the Y-axis angular velocity correction. |
| Better mobile performance | Use `timeStep={1 / 30}`, lower DPR, and use fewer curve points. |

## Common Pitfalls

- The canvas parent must have a real height. A zero-height parent makes the scene appear blank.
- `@react-three/rapier` must run client-side.
- The GLB must expose the same mesh/material names, or the code needs to be updated for your model.
- Do not replace the rope joints with visual-only lines. The bounce comes from Rapier constraints.
- The badge must become kinematic during drag. Directly setting translation on a dynamic body fights the physics solver.
- If custom textures look upside down, set `loadedTexture.flipY = false`.
- If custom texture colors look wrong, set `loadedTexture.colorSpace = THREE.SRGBColorSpace`.

