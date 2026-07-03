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

// Rotate a point around a center, matching SVG's rotate(deg cx cy) semantics —
// used so the pencil geometry is derived from the same coordinates as the
// flat SVG mark (VoaLogoMark.tsx), just pre-rotated before extrusion.
function rotatePt([x, y]: [number, number], deg: number, [cx, cy]: [number, number]): [number, number] {
  const rad = (deg * Math.PI) / 180;
  const dx = x - cx;
  const dy = y - cy;
  return [
    cx + dx * Math.cos(rad) - dy * Math.sin(rad),
    cy + dx * Math.sin(rad) + dy * Math.cos(rad),
  ];
}

function EduMark() {
  const groupRef = useRef<THREE.Group>(null);

  useFrame((state) => {
    if (!groupRef.current) return;
    groupRef.current.rotation.y = state.clock.elapsedTime * 0.45;
    groupRef.current.rotation.x = Math.sin(state.clock.elapsedTime * 0.25) * 0.12;
  });

  // Geometry mirrors the 2D "E" + pencil logo mark exactly (VoaLogoMark.tsx)
  const spineGeo  = useMemo(() => extrudeShape([[34.5,10.5],[45.5,10.5],[45.5,70.5],[34.5,70.5]]), []);
  const topBarGeo = useMemo(() => extrudeShape([[34.5,10.5],[69.5,10.5],[69.5,21.5],[34.5,21.5]]), []);
  const midBarGeo = useMemo(() => extrudeShape([[34.5,35],[61.5,35],[61.5,46],[34.5,46]]), []);
  const botBarGeo = useMemo(() => extrudeShape([[34.5,59.5],[69.5,59.5],[69.5,70.5],[34.5,70.5]]), []);

  const pivot: [number, number] = [17, 46];
  const rot = (pts: [number, number][]) => pts.map((p) => rotatePt(p, -28, pivot));
  const eraserGeo    = useMemo(() => extrudeShape(rot([[13,18],[21,18],[21,27],[13,27]])), []);
  const ferruleGeo   = useMemo(() => extrudeShape(rot([[13,26],[21,26],[21,30],[13,30]])), []);
  const bodyGeo      = useMemo(() => extrudeShape(rot([[13,29],[21,29],[21,64],[13,64]])), []);
  const woodTipGeo   = useMemo(() => extrudeShape(rot([[13,64],[21,64],[17,75]])), []);
  const graphiteGeo  = useMemo(() => extrudeShape(rot([[15.3,69],[18.7,69],[17,75]])), []);

  const eMat = useMemo(() => new THREE.MeshStandardMaterial({
    color: "#2855D0", metalness: 0.55, roughness: 0.15,
    emissive: "#0D1E4A", emissiveIntensity: 0.4, side: THREE.DoubleSide,
  }), []);

  const eraserMat = useMemo(() => new THREE.MeshStandardMaterial({
    color: "#FFB84D", metalness: 0.2, roughness: 0.5, side: THREE.DoubleSide,
  }), []);

  const ferruleMat = useMemo(() => new THREE.MeshStandardMaterial({
    color: "#C7CDDA", metalness: 0.85, roughness: 0.15, side: THREE.DoubleSide,
  }), []);

  const bodyMat = useMemo(() => new THREE.MeshStandardMaterial({
    color: "#F5A623", metalness: 0.5, roughness: 0.25,
    emissive: "#AA6B10", emissiveIntensity: 0.3, side: THREE.DoubleSide,
  }), []);

  const woodMat = useMemo(() => new THREE.MeshStandardMaterial({
    color: "#E8C89A", metalness: 0.1, roughness: 0.6, side: THREE.DoubleSide,
  }), []);

  const graphiteMat = useMemo(() => new THREE.MeshStandardMaterial({
    color: "#1A3A7C", metalness: 0.6, roughness: 0.2,
    emissive: "#0A1F54", emissiveIntensity: 0.4, side: THREE.DoubleSide,
  }), []);

  const scale: [number, number, number] = [2.4, 2.4, 2.4];
  const half = -BEVEL.depth / 2;

  return (
    <group ref={groupRef} scale={scale} position={[0, 0, half]}>
      <mesh geometry={spineGeo}  material={eMat} />
      <mesh geometry={topBarGeo} material={eMat} />
      <mesh geometry={midBarGeo} material={eMat} />
      <mesh geometry={botBarGeo} material={eMat} />

      <mesh geometry={eraserGeo}   material={eraserMat} />
      <mesh geometry={ferruleGeo}  material={ferruleMat} />
      <mesh geometry={bodyGeo}     material={bodyMat} />
      <mesh geometry={woodTipGeo}  material={woodMat} />
      <mesh geometry={graphiteGeo} material={graphiteMat} />
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
      <EduMark />
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
