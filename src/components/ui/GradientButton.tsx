"use client";

import { motion } from "framer-motion";
import { cn } from "@/lib/utils";
import { Loader2 } from "lucide-react";

interface GradientButtonProps {
  children: React.ReactNode;
  onClick?: () => void;
  className?: string;
  disabled?: boolean;
  loading?: boolean;
  type?: "button" | "submit";
  size?: "sm" | "md" | "lg";
}

export default function GradientButton({
  children,
  onClick,
  className,
  disabled,
  loading,
  type = "button",
  size = "md",
}: GradientButtonProps) {
  const sizeClass = {
    sm: "px-4 py-2 text-sm",
    md: "px-6 py-3 text-base",
    lg: "px-8 py-4 text-lg",
  };

  return (
    <motion.button
      type={type}
      onClick={onClick}
      disabled={disabled || loading}
      whileHover={!disabled ? { scale: 1.02 } : {}}
      whileTap={!disabled ? { scale: 0.98 } : {}}
      className={cn(
        "relative overflow-hidden rounded-xl font-semibold text-white transition-all duration-300",
        "bg-gradient-to-r from-indigo-500 via-purple-500 to-cyan-500",
        "hover:shadow-lg hover:shadow-indigo-500/25",
        "disabled:opacity-50 disabled:cursor-not-allowed",
        sizeClass[size],
        className
      )}
    >
      <motion.div
        className="absolute inset-0 bg-gradient-to-r from-indigo-600 via-purple-600 to-cyan-600 opacity-0 transition-opacity duration-300"
        whileHover={{ opacity: 1 }}
      />
      <span className="relative flex items-center justify-center gap-2">
        {loading && <Loader2 className="w-4 h-4 animate-spin" />}
        {children}
      </span>
    </motion.button>
  );
}
