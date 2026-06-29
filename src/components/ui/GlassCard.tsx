"use client";

import { motion } from "framer-motion";
import { cn } from "@/lib/utils";
import { ReactNode } from "react";

interface GlassCardProps {
  children: ReactNode;
  className?: string;
  variant?: "default" | "blue" | "gold";
  hover?: boolean;
  delay?: number;
}

export default function GlassCard({
  children,
  className,
  variant = "default",
  hover = true,
  delay = 0,
}: GlassCardProps) {
  const variants = {
    default: "glass",
    blue: "glass-blue",
    gold: "glass-gold",
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-50px" }}
      transition={{ duration: 0.6, delay, ease: "easeOut" }}
      whileHover={hover ? { y: -6, transition: { duration: 0.2 } } : undefined}
      className={cn(
        variants[variant],
        "rounded-2xl p-6 shadow-card relative overflow-hidden group",
        className
      )}
    >
      <div className="absolute inset-0 bg-card-shine opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none" />
      {children}
    </motion.div>
  );
}
