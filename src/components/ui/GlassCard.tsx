"use client";

import { motion } from "framer-motion";
import { cn } from "@/lib/utils";

interface GlassCardProps {
  children: React.ReactNode;
  className?: string;
  glow?: "indigo" | "purple" | "cyan" | "emerald" | "red" | "none";
  hover?: boolean;
}

export default function GlassCard({
  children,
  className,
  glow = "none",
  hover = false,
}: GlassCardProps) {
  const glowClass = {
    indigo: "hover:shadow-[0_0_30px_rgba(99,102,241,0.2)]",
    purple: "hover:shadow-[0_0_30px_rgba(139,92,246,0.2)]",
    cyan: "hover:shadow-[0_0_30px_rgba(6,182,212,0.2)]",
    emerald: "hover:shadow-[0_0_30px_rgba(16,185,129,0.2)]",
    red: "hover:shadow-[0_0_30px_rgba(239,68,68,0.2)]",
    none: "",
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className={cn(
        "glass rounded-2xl p-6 transition-all duration-300",
        hover && "card-lift",
        glowClass[glow],
        className
      )}
    >
      {children}
    </motion.div>
  );
}
