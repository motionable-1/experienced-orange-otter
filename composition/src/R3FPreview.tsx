import { Canvas, useFrame } from "@react-three/fiber";
import { useEffect, useMemo, useRef } from "react";
import type { Group, Mesh, Points } from "three";
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

function ParticleField() {
  const pointsRef = useRef<Points>(null);
  const positions = useMemo(() => {
    const values = new Float32Array(210 * 3);

    for (let i = 0; i < 210; i += 1) {
      const band = i % 7;
      const row = Math.floor(i / 7);
      const angle = i * 2.399963;
      const radius = 1.1 + (band * 0.42) + ((row % 5) * 0.08);
      values[i * 3] = Math.cos(angle) * radius;
      values[i * 3 + 1] = ((row % 21) - 10) * 0.15;
      values[i * 3 + 2] = Math.sin(angle) * radius * 0.72 - 0.6;
    }

    return values;
  }, []);

  useFrame(({ clock }) => {
    const points = pointsRef.current;
    if (!points) return;

    const time = readHyperframesTime(clock.elapsedTime);
    points.rotation.set(0.1 + Math.sin(time * 0.42) * 0.05, time * 0.11, 0.08);
    points.position.set(0.28 + Math.sin(time * 0.55) * 0.08, Math.cos(time * 0.4) * 0.04, 0);
  });

  return (
    <points ref={pointsRef}>
      <bufferGeometry>
        <bufferAttribute attach="attributes-position" args={[positions, 3]} />
      </bufferGeometry>
      <pointsMaterial color="#56fff1" size={0.026} sizeAttenuation transparent opacity={0.72} />
    </points>
  );
}

function OrbitingNode({
  color,
  phase,
  radius,
  scale,
}: {
  color: string;
  phase: number;
  radius: number;
  scale: number;
}) {
  const meshRef = useRef<Mesh>(null);

  useFrame(({ clock }) => {
    const mesh = meshRef.current;
    if (!mesh) return;

    const time = readHyperframesTime(clock.elapsedTime) + phase;
    mesh.position.set(
      Math.cos(time * 0.94) * radius,
      Math.sin(time * 1.25) * 0.5,
      Math.sin(time * 0.94) * radius * 0.52,
    );
    mesh.rotation.set(time * 0.82, time * 0.48, -time * 0.58);
  });

  return (
    <mesh ref={meshRef} scale={scale}>
      <boxGeometry args={[0.44, 0.44, 0.08]} />
      <meshStandardMaterial color={color} emissive={color} emissiveIntensity={0.38} metalness={0.34} roughness={0.24} />
    </mesh>
  );
}

function MagicDepthCore() {
  const groupRef = useRef<Group>(null);
  const shellRef = useRef<Mesh>(null);
  const timeRef = useTimelineTime();

  useFrame(({ clock }) => {
    const time = readHyperframesTime(clock.elapsedTime);
    timeRef.current = time;

    const group = groupRef.current;
    if (group) {
      group.rotation.set(-0.28 + Math.sin(time * 0.55) * 0.1, time * 0.34, 0.18 + Math.sin(time * 0.36) * 0.05);
      group.position.set(0.85 + Math.sin(time * 0.45) * 0.12, Math.sin(time * 0.72) * 0.08, -0.15);
      const pulse = 1 + Math.sin(time * 2.2) * 0.035;
      group.scale.setScalar(pulse);
    }

    const shell = shellRef.current;
    if (shell) {
      shell.rotation.set(time * 0.12, -time * 0.2, time * 0.08);
    }
  });

  return (
    <group ref={groupRef}>
      <mesh ref={shellRef}>
        <icosahedronGeometry args={[1.12, 2]} />
        <meshStandardMaterial color="#142b37" emissive="#20f4ff" emissiveIntensity={0.28} metalness={0.7} roughness={0.2} transparent opacity={0.36} wireframe />
      </mesh>
      <mesh rotation={[0.42, 0.2, 0.72]}>
        <torusGeometry args={[1.52, 0.026, 18, 180]} />
        <meshStandardMaterial color="#43f7ff" emissive="#43f7ff" emissiveIntensity={0.62} metalness={0.2} roughness={0.18} />
      </mesh>
      <mesh rotation={[1.2, -0.48, -0.22]}>
        <torusGeometry args={[1.86, 0.018, 16, 180]} />
        <meshStandardMaterial color="#ff5c7b" emissive="#ff5c7b" emissiveIntensity={0.48} metalness={0.18} roughness={0.22} />
      </mesh>
      <mesh rotation={[-0.55, 0.82, 0.16]}>
        <torusGeometry args={[2.14, 0.014, 14, 180]} />
        <meshStandardMaterial color="#93ffd9" emissive="#93ffd9" emissiveIntensity={0.32} metalness={0.18} roughness={0.24} />
      </mesh>
      <OrbitingNode color="#f8fbff" phase={0.25} radius={1.9} scale={0.82} />
      <OrbitingNode color="#62fff0" phase={2.55} radius={2.22} scale={0.7} />
      <OrbitingNode color="#ff6a83" phase={4.8} radius={1.66} scale={0.64} />
    </group>
  );
}

export function R3FPreview({ onSceneReady }: PreviewProps) {
  return (
    <Canvas
      camera={{ position: [0, 0.08, 6.4], fov: 38 }}
      dpr={[1, 2]}
      gl={{ alpha: true, antialias: true, preserveDrawingBuffer: true }}
      onCreated={onSceneReady}
    >
      <ambientLight intensity={0.72} />
      <directionalLight color="#dffcff" intensity={2.4} position={[3, 4, 5]} />
      <pointLight color="#44f8ff" intensity={13} position={[-2.8, -1.1, 2.8]} />
      <pointLight color="#ff5f7d" intensity={5} position={[2.6, 1.2, 2.2]} />
      <ParticleField />
      <MagicDepthCore />
    </Canvas>
  );
}
