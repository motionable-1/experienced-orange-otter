import { Canvas, useFrame } from "@react-three/fiber";
import { useEffect, useRef } from "react";
import type { Group, Mesh } from "three";
import { readHyperframesTime, subscribeHyperframesSeek } from "./timeline";

type PreviewProps = {
  onSceneReady: () => void;
};

function useTimelineTime() {
  const timeRef = useRef(0);

  useEffect(
    () =>
      subscribeHyperframesSeek((time) => {
        timeRef.current = time;
      }),
    [],
  );

  return timeRef;
}

function OrbitingChip({
  color,
  phase,
  radius,
}: {
  color: string;
  phase: number;
  radius: number;
}) {
  const meshRef = useRef<Mesh>(null);

  useFrame(({ clock }) => {
    const mesh = meshRef.current;
    if (!mesh) return;

    const time = readHyperframesTime(clock.elapsedTime) + phase;
    mesh.position.set(
      Math.cos(time * 0.82) * radius,
      Math.sin(time * 1.08) * 0.32,
      Math.sin(time * 0.82) * radius * 0.42,
    );
    mesh.rotation.set(time * 0.9, time * 0.55, time * 0.72);
  });

  return (
    <mesh ref={meshRef}>
      <boxGeometry args={[0.2, 0.2, 0.07]} />
      <meshStandardMaterial color={color} metalness={0.45} roughness={0.3} />
    </mesh>
  );
}

function KineticMark() {
  const groupRef = useRef<Group>(null);
  const timeRef = useTimelineTime();

  useFrame(({ clock }) => {
    const group = groupRef.current;
    if (!group) return;

    const time = readHyperframesTime(clock.elapsedTime);
    timeRef.current = time;
    group.rotation.set(-0.38 + Math.sin(time * 0.8) * 0.14, time * 0.36, 0.22);
    group.position.set(1.28, Math.sin(time * 0.9) * 0.08, 0);
  });

  return (
    <group ref={groupRef}>
      <mesh>
        <icosahedronGeometry args={[0.96, 4]} />
        <meshStandardMaterial color="#f2c572" metalness={0.62} roughness={0.28} />
      </mesh>
      <mesh rotation={[0.4, 0.2, 0.72]}>
        <torusGeometry args={[1.32, 0.03, 18, 160]} />
        <meshStandardMaterial color="#70d6c8" metalness={0.2} roughness={0.22} />
      </mesh>
      <mesh rotation={[1.1, -0.44, -0.28]}>
        <torusGeometry args={[1.56, 0.022, 16, 160]} />
        <meshStandardMaterial color="#ff6b5f" metalness={0.18} roughness={0.25} />
      </mesh>
      <OrbitingChip color="#f8efe1" phase={0.2} radius={1.72} />
      <OrbitingChip color="#70d6c8" phase={2.4} radius={1.98} />
      <OrbitingChip color="#ff6b5f" phase={4.6} radius={1.62} />
    </group>
  );
}

export function R3FPreview({ onSceneReady }: PreviewProps) {
  return (
    <Canvas
      camera={{ position: [0, 0.1, 6.2], fov: 38 }}
      dpr={[1, 2]}
      gl={{ alpha: true, antialias: true, preserveDrawingBuffer: true }}
      onCreated={onSceneReady}
    >
      <ambientLight intensity={0.82} />
      <directionalLight color="#ffe3a3" intensity={2.8} position={[3, 4, 5]} />
      <pointLight color="#70d6c8" intensity={12} position={[-3.2, -1.1, 2.4]} />
      <KineticMark />
    </Canvas>
  );
}
