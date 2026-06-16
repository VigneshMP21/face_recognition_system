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
    indigo: "hover:shadow-[0_0_30px_rgba(99,102,241,0.25)] hover:border-indigo-500/30",
    purple: "hover:shadow-[0_0_30px_rgba(139,92,246,0.25)] hover:border-purple-500/30",
    cyan: "hover:shadow-[0_0_30px_rgba(6,182,212,0.25)] hover:border-cyan-500/30",
    emerald: "hover:shadow-[0_0_30px_rgba(16,185,129,0.25)] hover:border-emerald-500/30",
    red: "hover:shadow-[0_0_30px_rgba(239,68,68,0.25)] hover:border-red-500/30",
    none: "",
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className={cn(
        "glass rounded-xl md:rounded-2xl p-4 md:p-6 transition-all duration-300",
        hover && "card-lift-enhanced cursor-pointer",
        glowClass[glow],
        className
      )}
    >
      {children}
    </motion.div>
  );
}