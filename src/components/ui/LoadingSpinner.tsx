"use client";

import { motion } from "framer-motion";

export default function LoadingSpinner({ text }: { text?: string }) {
  return (
    <div className="flex flex-col items-center justify-center gap-4 py-12">
      <motion.div
        className="w-10 h-10 md:w-12 md:h-12 border-3 md:border-4 border-indigo-500/20 border-t-indigo-500 rounded-full"
        animate={{ rotate: 360 }}
        transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
      />
      {text && (
        <p className="text-gray-400 text-xs md:text-sm loading-text">{text}</p>
      )}
    </div>
  );
}