"use client";

import { Canvas, useFrame, type ThreeElements } from "@react-three/fiber";
import { OrbitControls, Sparkles } from "@react-three/drei";
import { useEffect, useMemo, useRef, useState } from "react";
import * as THREE from "three";

/**
 * Reassembles the Aster token icon out of its own parts: a base disc, a
 * ring of beveled bezel panels with glowing light bars, four pinwheel
 * blades and a center diamond, each flying in from a scattered start pose
 * and snapping into place.
 */

const BASE_RADIUS = 2.56;
const BEZEL_COUNT = 9;
const BEZEL_GAP_RATIO = 0.3;

function easeOutBack(x: number) {
  const c1 = 1.70158;
  const c3 = c1 + 1;
  const t = x - 1;
  return 1 + c3 * t * t * t + c1 * t * t;
}

function easeOutCubic(x: number) {
  const t = x - 1;
  return 1 + t * t * t;
}

function clamp01(x: number) {
  return Math.min(1, Math.max(0, x));
}

/** Deterministic mulberry32 PRNG — same seed always produces the same sequence, so
 *  the "scattered" start poses stay stable across re-renders without calling the
 *  impure `Math.random` during render. */
function createRng(seed: number): () => number {
  let state = seed >>> 0;
  return () => {
    state = (state + 0x6d2b79f5) | 0;
    let t = Math.imul(state ^ (state >>> 15), 1 | state);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

type PieceSpec = {
  finalPos: THREE.Vector3;
  finalRot: THREE.Euler;
  startPos: THREE.Vector3;
  startRot: THREE.Euler;
  delay: number;
  duration: number;
  spin: THREE.Vector3;
};

function scatterFrom(direction: THREE.Vector3, spread: number, rng: () => number): THREE.Vector3 {
  const dir = direction.clone();
  if (dir.lengthSq() < 0.0001) {
    dir.set(rng() - 0.5, rng() - 0.5, rng() - 0.5);
  }
  dir.normalize();
  const jitter = new THREE.Vector3(
    (rng() - 0.5) * spread * 0.6,
    (rng() - 0.5) * spread * 0.6,
    (rng() - 0.5) * spread * 0.6,
  );
  return dir.multiplyScalar(spread + rng() * spread * 0.6).add(jitter);
}

function useGlowTexture() {
  return useMemo(() => {
    const size = 256;
    const canvas = document.createElement("canvas");
    canvas.width = size;
    canvas.height = size;
    const ctx = canvas.getContext("2d");
    if (ctx) {
      const gradient = ctx.createRadialGradient(
        size / 2,
        size / 2,
        0,
        size / 2,
        size / 2,
        size / 2,
      );
      gradient.addColorStop(0, "rgba(125,211,252,0.85)");
      gradient.addColorStop(0.4, "rgba(59,130,246,0.35)");
      gradient.addColorStop(1, "rgba(10,15,35,0)");
      ctx.fillStyle = gradient;
      ctx.fillRect(0, 0, size, size);
    }
    const texture = new THREE.CanvasTexture(canvas);
    texture.needsUpdate = true;
    return texture;
  }, []);
}

function GlowHalo() {
  const texture = useGlowTexture();
  const ref = useRef<THREE.Mesh>(null);
  useFrame(({ clock }) => {
    if (!ref.current) return;
    const pulse = 1 + Math.sin(clock.elapsedTime * 0.9) * 0.06;
    ref.current.scale.setScalar(6.2 * pulse);
  });
  return (
    <mesh ref={ref} position={[0, 0, -1.2]}>
      <planeGeometry args={[1, 1]} />
      <meshBasicMaterial
        map={texture}
        transparent
        depthWrite={false}
        blending={THREE.AdditiveBlending}
      />
    </mesh>
  );
}

function useBladeGeometries() {
  return useMemo(() => {
    const extrude = (shape: THREE.Shape) =>
      new THREE.ExtrudeGeometry(shape, {
        depth: 0.16,
        bevelEnabled: true,
        bevelThickness: 0.045,
        bevelSize: 0.035,
        bevelSegments: 3,
        curveSegments: 8,
      });

    const light = new THREE.Shape();
    light.moveTo(0.07, 0.07);
    light.lineTo(0.98, 0.34);
    light.lineTo(0.8, 1.0);
    light.closePath();

    const dark = new THREE.Shape();
    dark.moveTo(0.07, 0.07);
    dark.lineTo(0.8, 1.0);
    dark.lineTo(0.3, 1.1);
    dark.lineTo(0.13, 0.56);
    dark.closePath();

    return { light: extrude(light), dark: extrude(dark) };
  }, []);
}

function makeArcGeometry(innerR: number, outerR: number, span: number, depth: number) {
  const shape = new THREE.Shape();
  const segs = 20;
  for (let i = 0; i <= segs; i++) {
    const a = -span / 2 + (span * i) / segs;
    const x = Math.cos(a) * outerR;
    const y = Math.sin(a) * outerR;
    if (i === 0) shape.moveTo(x, y);
    else shape.lineTo(x, y);
  }
  for (let i = segs; i >= 0; i--) {
    const a = -span / 2 + (span * i) / segs;
    shape.lineTo(Math.cos(a) * innerR, Math.sin(a) * innerR);
  }
  shape.closePath();
  return new THREE.ExtrudeGeometry(shape, {
    depth,
    bevelEnabled: true,
    bevelThickness: 0.025,
    bevelSize: 0.02,
    bevelSegments: 2,
    curveSegments: 10,
  });
}

function useBezelGeometries() {
  return useMemo(() => {
    const angleSpan = ((Math.PI * 2) / BEZEL_COUNT) * (1 - BEZEL_GAP_RATIO);
    const panel = makeArcGeometry(2.14, 2.56, angleSpan, 0.24);
    const bar = makeArcGeometry(2.27, 2.44, angleSpan * 0.5, 0.05);
    return { panel, bar, angleSpan };
  }, []);
}

function AnimatedPiece({
  spec,
  startTime,
  children,
  material,
  outline = false,
  outlineColor = "#bfe3ff",
}: {
  spec: PieceSpec;
  startTime: React.MutableRefObject<number>;
  children: React.ReactNode;
  material: ThreeElements["meshStandardMaterial"];
  outline?: boolean;
  outlineColor?: string;
}) {
  const meshRef = useRef<THREE.Mesh>(null);
  const matRef = useRef<THREE.MeshStandardMaterial>(null);
  const outlineMatRef = useRef<THREE.LineBasicMaterial>(null);
  const [edges, setEdges] = useState<THREE.EdgesGeometry | null>(null);

  useEffect(() => {
    if (outline && meshRef.current?.geometry) {
      setEdges(new THREE.EdgesGeometry(meshRef.current.geometry, 20));
    }
  }, [outline, children]);

  useFrame(({ clock }) => {
    const mesh = meshRef.current;
    const mat = matRef.current;
    if (!mesh || !mat) return;
    const t = clock.elapsedTime - startTime.current;
    const local = clamp01((t - spec.delay) / spec.duration);
    const eased = easeOutBack(local);
    const easedRot = easeOutCubic(local);

    mesh.position.lerpVectors(spec.startPos, spec.finalPos, eased);

    mesh.rotation.set(
      spec.finalRot.x + spec.spin.x * (1 - easedRot),
      spec.finalRot.y + spec.spin.y * (1 - easedRot),
      spec.finalRot.z + spec.spin.z * (1 - easedRot),
    );

    const scale = THREE.MathUtils.clamp(0.25 + 0.75 * eased, 0, 1.15);
    mesh.scale.setScalar(scale);

    const opacity = clamp01(local < 0.001 ? 0 : Math.max(local * 3, eased));
    mat.opacity = opacity;
    if (outlineMatRef.current) outlineMatRef.current.opacity = opacity * 0.9;

    const settleGlow = local > 0.97 ? Math.sin(clock.elapsedTime * 2.4) * 0.15 + 0.15 : 0;
    mat.emissiveIntensity = (mat.userData.baseEmissive ?? 0.35) + settleGlow;
  });

  return (
    <mesh ref={meshRef} castShadow receiveShadow>
      {children}
      <meshStandardMaterial
        ref={(node) => {
          matRef.current = node;
          if (node) node.userData.baseEmissive = material.emissiveIntensity ?? 0.35;
        }}
        transparent
        opacity={0}
        {...material}
      />
      {outline && edges && (
        <lineSegments geometry={edges}>
          <lineBasicMaterial ref={outlineMatRef} color={outlineColor} transparent opacity={0} />
        </lineSegments>
      )}
    </mesh>
  );
}

function CoinRig({ startTime }: { startTime: React.MutableRefObject<number> }) {
  const groupRef = useRef<THREE.Group>(null);
  const bladeGeometry = useBladeGeometries();
  const bezel = useBezelGeometries();

  const basePiece = useMemo<PieceSpec>(() => {
    const finalPos = new THREE.Vector3(0, 0, -0.1);
    return {
      finalPos,
      finalRot: new THREE.Euler(Math.PI / 2, 0, 0),
      startPos: new THREE.Vector3(0, 0, -3.5),
      startRot: new THREE.Euler(Math.PI / 2, 0, 0),
      delay: 0,
      duration: 0.5,
      spin: new THREE.Vector3(0, 0, 0),
    };
  }, []);

  const groovePiece = useMemo<PieceSpec>(() => {
    return {
      finalPos: new THREE.Vector3(0, 0, 0.01),
      finalRot: new THREE.Euler(0, 0, 0),
      startPos: new THREE.Vector3(0, 0, 0.01),
      startRot: new THREE.Euler(0, 0, 0),
      delay: 0.35,
      duration: 0.4,
      spin: new THREE.Vector3(0, 0, 0),
    };
  }, []);

  const bezelPieces = useMemo<{ panel: PieceSpec; bar: PieceSpec }[]>(() => {
    const rng = createRng(1337);
    return Array.from({ length: BEZEL_COUNT }, (_, i) => {
      const angle = (i / BEZEL_COUNT) * Math.PI * 2;
      const dir = new THREE.Vector3(Math.cos(angle), Math.sin(angle), 0.2);
      const startRot = new THREE.Euler(rng() * Math.PI, rng() * Math.PI, rng() * Math.PI);
      const spin = new THREE.Vector3(
        (rng() - 0.5) * Math.PI * 3,
        (rng() - 0.5) * Math.PI * 3,
        (rng() - 0.5) * Math.PI * 3,
      );
      const delay = 0.12 + (i / BEZEL_COUNT) * 0.5 + rng() * 0.08;
      return {
        panel: {
          finalPos: new THREE.Vector3(0, 0, 0),
          finalRot: new THREE.Euler(0, 0, angle),
          startPos: scatterFrom(dir, 3.6, rng),
          startRot,
          delay,
          duration: 0.5 + rng() * 0.15,
          spin,
        },
        bar: {
          finalPos: new THREE.Vector3(0, 0, 0.19),
          finalRot: new THREE.Euler(0, 0, angle),
          startPos: scatterFrom(dir, 3.9, rng).setZ(0.19),
          startRot,
          delay: delay + 0.08,
          duration: 0.4,
          spin,
        },
      };
    });
  }, []);

  const bladePieces = useMemo<PieceSpec[]>(() => {
    const rng = createRng(4242);
    return Array.from({ length: 4 }, (_, i) => {
      const angle = (i / 4) * Math.PI * 2;
      const finalPos = new THREE.Vector3(0, 0, 0.07 + (i % 2 === 0 ? 0.012 : -0.012));
      const finalRot = new THREE.Euler(0, 0, angle);
      return {
        finalPos,
        finalRot,
        startPos: scatterFrom(new THREE.Vector3(Math.cos(angle), Math.sin(angle), 0.5), 4.4, rng),
        startRot: new THREE.Euler(rng() * Math.PI, rng() * Math.PI, rng() * Math.PI),
        delay: 0.58 + i * 0.09,
        duration: 0.6,
        spin: new THREE.Vector3(
          (rng() - 0.5) * Math.PI * 4,
          (rng() - 0.5) * Math.PI * 4,
          Math.PI * (rng() > 0.5 ? 2 : -2),
        ),
      };
    });
  }, []);

  const diamondPiece = useMemo<PieceSpec>(() => {
    const finalPos = new THREE.Vector3(0, 0, 0.2);
    return {
      finalPos,
      finalRot: new THREE.Euler(Math.PI / 4, Math.PI / 4, 0),
      startPos: new THREE.Vector3(0, 0, 3.8),
      startRot: new THREE.Euler(0, 0, 0),
      delay: 1.08,
      duration: 0.45,
      spin: new THREE.Vector3(Math.PI * 6, Math.PI * 4, 0),
    };
  }, []);

  useFrame(({ clock }) => {
    const group = groupRef.current;
    if (!group) return;
    group.rotation.y = Math.sin(clock.elapsedTime * 0.22) * 0.45;
    group.rotation.x = Math.sin(clock.elapsedTime * 0.17 + 1.4) * 0.12;
  });

  return (
    <group ref={groupRef}>
      <GlowHalo />

      <AnimatedPiece
        spec={basePiece}
        startTime={startTime}
        material={{
          color: "#0a1a38",
          metalness: 0.7,
          roughness: 0.4,
          emissive: "#0f2a52",
          emissiveIntensity: 0.2,
        }}
      >
        <cylinderGeometry args={[BASE_RADIUS, BASE_RADIUS, 0.18, 64]} />
      </AnimatedPiece>

      <AnimatedPiece
        spec={groovePiece}
        startTime={startTime}
        material={{
          color: "#bfe3ff",
          metalness: 0.2,
          roughness: 0.1,
          emissive: "#7dd3fc",
          emissiveIntensity: 1.2,
        }}
      >
        <torusGeometry args={[2.02, 0.014, 8, 96]} />
      </AnimatedPiece>

      {bezelPieces.map((pair, i) => (
        <group key={`bezel-${i}`}>
          <AnimatedPiece
            spec={pair.panel}
            startTime={startTime}
            outline
            material={{
              color: "#16295a",
              metalness: 0.85,
              roughness: 0.28,
              emissive: "#2f5fd6",
              emissiveIntensity: 0.22,
            }}
          >
            <primitive object={bezel.panel} attach="geometry" />
          </AnimatedPiece>
          <AnimatedPiece
            spec={pair.bar}
            startTime={startTime}
            material={{
              color: "#d9f0ff",
              metalness: 0.1,
              roughness: 0.1,
              emissive: "#8fd8ff",
              emissiveIntensity: 1.4,
            }}
          >
            <primitive object={bezel.bar} attach="geometry" />
          </AnimatedPiece>
        </group>
      ))}

      {bladePieces.map((spec, i) => (
        <group key={`blade-${i}`}>
          <AnimatedPiece
            spec={spec}
            startTime={startTime}
            outline
            material={{
              color: "#4f8be0",
              metalness: 0.7,
              roughness: 0.15,
              emissive: "#6fb3ff",
              emissiveIntensity: 0.55,
            }}
          >
            <primitive object={bladeGeometry.light} attach="geometry" />
          </AnimatedPiece>
          <AnimatedPiece
            spec={spec}
            startTime={startTime}
            outline
            material={{
              color: "#0f2049",
              metalness: 0.85,
              roughness: 0.26,
              emissive: "#2955a8",
              emissiveIntensity: 0.28,
            }}
          >
            <primitive object={bladeGeometry.dark} attach="geometry" />
          </AnimatedPiece>
        </group>
      ))}

      <AnimatedPiece
        spec={diamondPiece}
        startTime={startTime}
        outline
        outlineColor="#eaf6ff"
        material={{
          color: "#bfe0ff",
          metalness: 0.4,
          roughness: 0.12,
          emissive: "#7dd3fc",
          emissiveIntensity: 0.65,
        }}
      >
        <octahedronGeometry args={[0.34, 0]} />
      </AnimatedPiece>
    </group>
  );
}

export function CoinAssemblyScene({
  className,
  autoLoop = true,
  loopEvery = 6.5,
  replayToken = 0,
}: {
  className?: string;
  autoLoop?: boolean;
  loopEvery?: number;
  replayToken?: number;
}) {
  const startTime = useRef(0);
  const [ready, setReady] = useState(false);

  return (
    <div className={className}>
      <Canvas
        camera={{ position: [0, 0, 8.6], fov: 42 }}
        dpr={[1, 2]}
        onCreated={({ clock }) => {
          startTime.current = clock.elapsedTime;
          setReady(true);
        }}
      >
        <color attach="background" args={["#050b17"]} />
        <ambientLight intensity={0.3} color="#3a5fc9" />
        <directionalLight position={[3, 4, 5]} intensity={1.5} color="#eaf3ff" />
        <pointLight position={[-3, -2, 3]} intensity={2.4} color="#3b82f6" />
        <pointLight position={[0, 0, 4]} intensity={1.3} color="#7dd3fc" />
        <pointLight position={[2, -3, -2]} intensity={1.1} color="#1c3f9c" />

        {ready && <CoinRig startTime={startTime} />}

        <Sparkles count={40} scale={7} size={2} speed={0.3} color="#7dd3fc" opacity={0.5} />

        <LoopController
          startTimeRef={startTime}
          autoLoop={autoLoop}
          loopEvery={loopEvery}
          replayToken={replayToken}
        />

        <OrbitControls
          enablePan={false}
          enableZoom={false}
          minPolarAngle={Math.PI / 2.6}
          maxPolarAngle={Math.PI / 1.6}
        />
      </Canvas>
    </div>
  );
}

function LoopController({
  startTimeRef,
  autoLoop,
  loopEvery,
  replayToken,
}: {
  startTimeRef: React.MutableRefObject<number>;
  autoLoop: boolean;
  loopEvery: number;
  replayToken: number;
}) {
  const lastToken = useRef(replayToken);

  useFrame(({ clock }) => {
    if (lastToken.current !== replayToken) {
      lastToken.current = replayToken;
      startTimeRef.current = clock.elapsedTime;
      return;
    }
    if (autoLoop && clock.elapsedTime - startTimeRef.current > loopEvery) {
      startTimeRef.current = clock.elapsedTime;
    }
  });

  return null;
}

export default CoinAssemblyScene;
