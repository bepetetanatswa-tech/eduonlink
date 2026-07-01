"use client";

import { useRef, useMemo } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import * as THREE from "three";

// Map a coordinate from the 80×80 SVG viewBox to Three.js units
function u(v: number) { return (v - 40) / 40; }
function uy(v: number) { return -(v - 40) / 40; }

const BEVEL = {
  depth: 0.18,
  bevelEnabled: true,
  bevelThickness: 0.035,
  bevelSize: 0.025,
  bevelSegments: 4,
};

function extrudeShape(pts: [number, number][]) {
  const shape = new THREE.Shape();
  shape.moveTo(u(pts[0][0]), uy(pts[0][1]));
  for (let i = 1; i < pts.length; i++) shape.lineTo(u(pts[i][0]), uy(pts[i][1]));
  shape.closePath();
  return new THREE.ExtrudeGeometry(shape, BEVEL);
}

function VoaMark() {
  const groupRef = useRef<THREE.Group>(null);

  useFrame((state) => {
    if (!groupRef.current) return;
    groupRef.current.rotation.y = state.clock.elapsedTime * 0.45;
    groupRef.current.rotation.x = Math.sin(state.clock.elapsedTime * 0.25) * 0.12;
  });

  const leftGeo  = useMemo(() => extrudeShape([[6,6],[26,6],[40,64],[32,74]]), []);
  const rightGeo = useMemo(() => extrudeShape([[54,6],[74,6],[48,74],[40,64]]), []);
  const tipGeo   = useMemo(() => extrudeShape([[32,74],[40,64],[48,74]]), []);

  const leftMat = useMemo(() => new THREE.MeshStandardMaterial({
    color: "#1A3A7C", metalness: 0.65, roughness: 0.2,
    emissive: "#0A1F54", emissiveIntensity: 0.5, side: THREE.DoubleSide,
  }), []);

  const rightMat = useMemo(() => new THREE.MeshStandardMaterial({
    color: "#4D7FFF", metalness: 0.55, roughness: 0.12,
    emissive: "#2855D0", emissiveIntensity: 0.45, side: THREE.DoubleSide,
  }), []);

  const tipMat = useMemo(() => new THREE.MeshStandardMaterial({
    color: "#F5A623", metalness: 0.85, roughness: 0.06,
    emissive: "#AA6B10", emissiveIntensity: 0.35, side: THREE.DoubleSide,
  }), []);

  const scale: [number, number, number] = [2.4, 2.4, 2.4];
  const half = -BEVEL.depth / 2;

  return (
    <group ref={groupRef} scale={scale} position={[0, 0, half]}>
      <mesh geometry={leftGeo}  material={leftMat}  />
      <mesh geometry={rightGeo} material={rightMat} />
      <mesh geometry={tipGeo}   material={tipMat}   />
    </group>
  );
}

function Particles({ count = 70 }: { count?: number }) {
  const ref = useRef<THREE.Points>(null);

  const positions = useMemo(() => {
    const arr = new Float32Array(count * 3);
    for (let i = 0; i < count; i++) {
      arr[i * 3]     = (Math.random() - 0.5) * 22;
      arr[i * 3 + 1] = (Math.random() - 0.5) * 18;
      arr[i * 3 + 2] = (Math.random() - 0.5) * 8 - 3;
    }
    return arr;
  }, [count]);

  useFrame((_, delta) => {
    if (ref.current) {
      ref.current.rotation.y += delta * 0.014;
      ref.current.rotation.x += delta * 0.005;
    }
  });

  return (
    <points ref={ref}>
      <bufferGeometry>
        <bufferAttribute attach="attributes-position" args={[positions, 3]} />
      </bufferGeometry>
      <pointsMaterial size={0.055} color="#4D7FFF" transparent opacity={0.45} sizeAttenuation />
    </points>
  );
}

function Scene() {
  return (
    <>
      <ambientLight intensity={0.2} />
      <pointLight position={[4, 6, 5]}   intensity={2.8} color="#4D7FFF" />
      <pointLight position={[-5, -3, 4]} intensity={1.4} color="#F5A623" />
      <pointLight position={[0, 8, 2]}   intensity={0.9} color="#FFFFFF" />
      <VoaMark />
      <Particles count={70} />
    </>
  );
}

export default function HeroScene() {
  return (
    <Canvas
      camera={{ position: [0, 0, 9], fov: 44 }}
      gl={{ antialias: false, alpha: true, powerPreference: "low-power" }}
      dpr={[1, 1.5]}
      style={{ background: "transparent" }}
    >
      <Scene />
    </Canvas>
  );
}
