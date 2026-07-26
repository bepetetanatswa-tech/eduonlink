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

const SETTLE_DURATION = 1.1; // seconds — one deliberate load-in, then the mark holds still
const START_Y = -0.62;
const REST_Y = -0.14;
const START_X = 0.35;
const REST_X = 0.05;

function easeOutExpo(t: number) {
  return t >= 1 ? 1 : 1 - Math.pow(2, -10 * t);
}

// Settles into its resting angle once on mount, then stops updating entirely —
// this is the hero's one deliberate motion moment, not a perpetual spin.
function EduMark({ reducedMotion }: { reducedMotion: boolean }) {
  const groupRef = useRef<THREE.Group>(null);
  const elapsed = useRef(0);
  const settled = useRef(reducedMotion);

  useFrame((_, delta) => {
    if (!groupRef.current) return;
    if (settled.current) return;
    elapsed.current += delta;
    const t = easeOutExpo(Math.min(elapsed.current / SETTLE_DURATION, 1));
    groupRef.current.rotation.y = START_Y + (REST_Y - START_Y) * t;
    groupRef.current.rotation.x = START_X + (REST_X - START_X) * t;
    if (t >= 1) settled.current = true;
  });

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

  // Msasa copper — the "E", front face
  const eMat = useMemo(() => new THREE.MeshStandardMaterial({
    color: "#B1502B", metalness: 0.35, roughness: 0.4, side: THREE.DoubleSide,
  }), []);

  const eraserMat = useMemo(() => new THREE.MeshStandardMaterial({
    color: "#E3E2D4", metalness: 0.1, roughness: 0.55, side: THREE.DoubleSide,
  }), []);

  const ferruleMat = useMemo(() => new THREE.MeshStandardMaterial({
    color: "#8D9689", metalness: 0.7, roughness: 0.25, side: THREE.DoubleSide,
  }), []);

  // Granite gold — pencil body
  const bodyMat = useMemo(() => new THREE.MeshStandardMaterial({
    color: "#A9873F", metalness: 0.3, roughness: 0.45, side: THREE.DoubleSide,
  }), []);

  const woodMat = useMemo(() => new THREE.MeshStandardMaterial({
    color: "#CCD0C0", metalness: 0.1, roughness: 0.6, side: THREE.DoubleSide,
  }), []);

  // Chalk ink — graphite tip
  const graphiteMat = useMemo(() => new THREE.MeshStandardMaterial({
    color: "#1C2620", metalness: 0.2, roughness: 0.5, side: THREE.DoubleSide,
  }), []);

  const scale: [number, number, number] = [2.4, 2.4, 2.4];
  const half = -BEVEL.depth / 2;

  return (
    <group ref={groupRef} rotation={[START_X, START_Y, 0]} scale={scale} position={[0, 0, half]}>
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

function Scene({ reducedMotion }: { reducedMotion: boolean }) {
  return (
    <>
      <ambientLight intensity={0.65} />
      <pointLight position={[4, 6, 5]}   intensity={1.4} color="#F2EEE3" />
      <pointLight position={[-5, -3, 4]} intensity={0.6} color="#A9873F" />
      <pointLight position={[0, 8, 2]}   intensity={0.5} color="#FFFFFF" />
      <EduMark reducedMotion={reducedMotion} />
    </>
  );
}

export default function HeroScene() {
  const reducedMotion =
    typeof window !== "undefined" && window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  return (
    <Canvas
      camera={{ position: [0, 0, 9], fov: 44 }}
      gl={{ antialias: false, alpha: true, powerPreference: "low-power" }}
      dpr={[1, 1.5]}
      style={{ background: "transparent" }}
    >
      <Scene reducedMotion={reducedMotion} />
    </Canvas>
  );
}
