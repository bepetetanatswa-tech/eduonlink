"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";

interface FloatingShape {
  id: number;
  x: number;
  y: number;
  size: number;
  type: "book" | "diamond" | "hex" | "circle" | "star";
  color: "blue" | "gold";
  delay: number;
  duration: number;
  rotate: number;
}

const BookIcon = ({ color, size }: { color: string; size: number }) => (
  <svg width={size} height={size} viewBox="0 0 40 40" fill="none">
    <rect x="8" y="4" width="18" height="32" rx="2" fill={color} opacity="0.15" />
    <rect x="8" y="4" width="18" height="32" rx="2" stroke={color} strokeWidth="1.5" />
    <rect x="14" y="4" width="12" height="32" rx="1" fill={color} opacity="0.08" />
    <line x1="12" y1="12" x2="22" y2="12" stroke={color} strokeWidth="1" opacity="0.6" />
    <line x1="12" y1="16" x2="22" y2="16" stroke={color} strokeWidth="1" opacity="0.6" />
    <line x1="12" y1="20" x2="18" y2="20" stroke={color} strokeWidth="1" opacity="0.6" />
  </svg>
);

const DiamondIcon = ({ color, size }: { color: string; size: number }) => (
  <svg width={size} height={size} viewBox="0 0 40 40" fill="none">
    <polygon
      points="20,4 36,20 20,36 4,20"
      fill={color}
      opacity="0.1"
      stroke={color}
      strokeWidth="1.5"
    />
    <polygon points="20,10 30,20 20,30 10,20" fill={color} opacity="0.08" />
  </svg>
);

const HexIcon = ({ color, size }: { color: string; size: number }) => (
  <svg width={size} height={size} viewBox="0 0 40 40" fill="none">
    <polygon
      points="20,3 34,11 34,29 20,37 6,29 6,11"
      fill={color}
      opacity="0.08"
      stroke={color}
      strokeWidth="1.5"
    />
    <polygon
      points="20,10 28,15 28,25 20,30 12,25 12,15"
      fill={color}
      opacity="0.06"
      stroke={color}
      strokeWidth="1"
      strokeDasharray="3 2"
    />
  </svg>
);

const StarIcon = ({ color, size }: { color: string; size: number }) => (
  <svg width={size} height={size} viewBox="0 0 40 40" fill="none">
    <polygon
      points="20,3 23.5,14 35,14 25.5,21 29,32 20,25 11,32 14.5,21 5,14 16.5,14"
      fill={color}
      opacity="0.15"
      stroke={color}
      strokeWidth="1"
    />
  </svg>
);

const CircleIcon = ({ color, size }: { color: string; size: number }) => (
  <svg width={size} height={size} viewBox="0 0 40 40" fill="none">
    <circle cx="20" cy="20" r="15" fill={color} opacity="0.08" stroke={color} strokeWidth="1.5" />
    <circle cx="20" cy="20" r="8" fill={color} opacity="0.06" stroke={color} strokeWidth="1" strokeDasharray="4 2" />
    <circle cx="20" cy="20" r="2" fill={color} opacity="0.5" />
  </svg>
);

export default function FloatingElements() {
  const [shapes, setShapes] = useState<FloatingShape[]>([]);

  useEffect(() => {
    const types: FloatingShape["type"][] = ["book", "diamond", "hex", "circle", "star"];
    const colors: FloatingShape["color"][] = ["blue", "blue", "gold", "blue", "gold"];

    const generated: FloatingShape[] = Array.from({ length: 18 }, (_, i) => ({
      id: i,
      x: 5 + Math.random() * 90,
      y: 5 + Math.random() * 90,
      size: 24 + Math.random() * 32,
      type: types[i % types.length],
      color: colors[i % colors.length],
      delay: Math.random() * 4,
      duration: 5 + Math.random() * 6,
      rotate: Math.random() * 360,
    }));
    setShapes(generated);
  }, []);

  const colorMap = {
    blue: "#00D4FF",
    gold: "#FFD700",
  };

  const renderShape = (shape: FloatingShape) => {
    const color = colorMap[shape.color];
    switch (shape.type) {
      case "book": return <BookIcon color={color} size={shape.size} />;
      case "diamond": return <DiamondIcon color={color} size={shape.size} />;
      case "hex": return <HexIcon color={color} size={shape.size} />;
      case "star": return <StarIcon color={color} size={shape.size} />;
      case "circle": return <CircleIcon color={color} size={shape.size} />;
    }
  };

  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none">
      {shapes.map((shape) => (
        <motion.div
          key={shape.id}
          className="absolute"
          style={{ left: `${shape.x}%`, top: `${shape.y}%`, rotate: shape.rotate }}
          animate={{
            y: [0, -20, 0],
            rotate: [shape.rotate, shape.rotate + 10, shape.rotate - 5, shape.rotate],
            opacity: [0.4, 0.8, 0.4],
          }}
          transition={{
            duration: shape.duration,
            delay: shape.delay,
            repeat: Infinity,
            ease: "easeInOut",
          }}
        >
          {renderShape(shape)}
        </motion.div>
      ))}
    </div>
  );
}
