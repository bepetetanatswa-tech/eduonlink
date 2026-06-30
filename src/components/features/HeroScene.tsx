"use client";

import { useRef, useMemo } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import * as THREE from "three";

function Particles({ count = 90 }: { count?: number }) {
  const ref = useRef<THREE.Points>(null);

  const positions = useMemo(() => {
    const arr = new Float32Array(count * 3);
    for (let i = 0; i < count; i++) {
      arr[i * 3]     = (Math.random() - 0.5) * 22;
      arr[i * 3 + 1] = (Math.random() - 0.5) * 18;
      arr[i * 3 + 2] = (Math.random() - 0.5) * 8 - 2;
    }
    return arr;
  }, [count]);

  useFrame((_, delta) => {
    if (ref.current) {
      ref.current.rotation.y += delta * 0.018;
      ref.current.rotation.x += delta * 0.006;
    }
  });

  return (
    <points ref={ref}>
      <bufferGeometry>
        <bufferAttribute attach="attributes-position" args={[positions, 3]} />
      </bufferGeometry>
      <pointsMaterial
        size={0.06}
        color="#4D7FFF"
        transparent
        opacity={0.55}
        sizeAttenuation
      />
    </points>
  );
}

function FloatingBook({
  position,
  rotationOffset,
  speed,
}: {
  position: [number, number, number];
  rotationOffset: number;
  speed: number;
}) {
  const ref = useRef<THREE.Mesh>(null);
  const initY = position[1];

  useFrame((state) => {
    if (!ref.current) return;
    ref.current.rotation.x += 0.004;
    ref.current.rotation.y += 0.006;
    ref.current.position.y =
      initY + Math.sin(state.clock.elapsedTime * speed + rotationOffset) * 0.28;
  });

  return (
    <mesh ref={ref} position={position} castShadow>
      <boxGeometry args={[0.38, 0.52, 0.07]} />
      <meshStandardMaterial
        color="#4D7FFF"
        emissive="#162754"
        metalness={0.2}
        roughness={0.6}
        transparent
        opacity={0.72}
      />
    </mesh>
  );
}

function FloatingGem({
  position,
  rotationOffset,
  speed,
}: {
  position: [number, number, number];
  rotationOffset: number;
  speed: number;
}) {
  const ref = useRef<THREE.Mesh>(null);
  const initY = position[1];

  useFrame((state) => {
    if (!ref.current) return;
    ref.current.rotation.x += 0.007;
    ref.current.rotation.z += 0.005;
    ref.current.position.y =
      initY + Math.sin(state.clock.elapsedTime * speed + rotationOffset) * 0.22;
  });

  return (
    <mesh ref={ref} position={position}>
      <octahedronGeometry args={[0.28, 0]} />
      <meshStandardMaterial
        color="#00E5A3"
        emissive="#003d2c"
        metalness={0.4}
        roughness={0.4}
        transparent
        opacity={0.65}
      />
    </mesh>
  );
}

function FloatingRing({
  position,
  rotationOffset,
  speed,
}: {
  position: [number, number, number];
  rotationOffset: number;
  speed: number;
}) {
  const ref = useRef<THREE.Mesh>(null);
  const initY = position[1];

  useFrame((state) => {
    if (!ref.current) return;
    ref.current.rotation.x = state.clock.elapsedTime * 0.4 + rotationOffset;
    ref.current.rotation.y = state.clock.elapsedTime * 0.2;
    ref.current.position.y =
      initY + Math.cos(state.clock.elapsedTime * speed + rotationOffset) * 0.2;
  });

  return (
    <mesh ref={ref} position={position}>
      <torusGeometry args={[0.32, 0.06, 8, 24]} />
      <meshStandardMaterial
        color="#F5A623"
        emissive="#3d2800"
        metalness={0.5}
        roughness={0.4}
        transparent
        opacity={0.6}
      />
    </mesh>
  );
}

function Scene() {
  return (
    <>
      <ambientLight intensity={0.25} />
      <pointLight position={[5, 6, 4]} intensity={1.2} color="#4D7FFF" />
      <pointLight position={[-6, -4, 3]} intensity={0.7} color="#00E5A3" />
      <pointLight position={[0, 8, -2]} intensity={0.4} color="#F5A623" />

      <Particles count={90} />

      <FloatingBook position={[-4.5, 0.8, -1.5]}  rotationOffset={0}        speed={0.55} />
      <FloatingBook position={[4.2, -0.6, -2.5]}   rotationOffset={1.2}      speed={0.42} />
      <FloatingBook position={[-2.2, -1.8, -2.0]}  rotationOffset={2.4}      speed={0.68} />

      <FloatingGem position={[3.0, 1.6, -1.8]}    rotationOffset={0.6}      speed={0.5}  />
      <FloatingGem position={[-3.8, -1.2, -3.0]}  rotationOffset={3.0}      speed={0.38} />

      <FloatingRing position={[1.8, 2.0, -2.2]}   rotationOffset={0.3}      speed={0.45} />
      <FloatingRing position={[-1.5, -2.2, -1.8]} rotationOffset={1.8}      speed={0.6}  />
    </>
  );
}

export default function HeroScene() {
  return (
    <Canvas
      camera={{ position: [0, 0, 9], fov: 44 }}
      gl={{
        antialias: false,
        alpha: true,
        powerPreference: "low-power",
      }}
      dpr={[1, 1.5]}
      style={{ background: "transparent" }}
    >
      <Scene />
    </Canvas>
  );
}
