"use client";

import { motion } from "framer-motion";
import { ScanFace, Camera, Sparkles } from "lucide-react";

export default function ScannerAnimation() {
  return (
    <div className="relative w-72 h-72 md:w-80 md:h-80 mx-auto">
      <motion.div
        className="absolute inset-0 rounded-full bg-gradient-to-r from-indigo-500/20 via-purple-500/20 to-cyan-500/20 blur-3xl"
        animate={{ scale: [1, 1.2, 1] }}
        transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
      />

      <motion.div
        className="absolute inset-4 rounded-full bg-gradient-to-r from-indigo-500/10 to-cyan-500/10 blur-2xl"
        animate={{ scale: [1, 1.1, 1] }}
        transition={{ duration: 3, repeat: Infinity, ease: "easeInOut", delay: 0.5 }}
      />

      <div className="relative w-full h-full flex items-center justify-center">
        <div className="glass rounded-2xl w-56 h-56 md:w-64 md:h-64 flex flex-col items-center justify-center gap-4 glow relative overflow-hidden">
          <motion.div
            className="absolute inset-0 bg-gradient-to-b from-transparent via-indigo-500/10 to-transparent"
            animate={{ y: ["-100%", "100%"] }}
            transition={{ duration: 2.5, repeat: Infinity, ease: "linear" }}
          />

          <motion.div
            animate={{ scale: [1, 1.05, 1] }}
            transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
          >
            <div className="relative">
              <div className="w-20 h-20 md:w-24 md:h-24 rounded-2xl border-2 border-indigo-500/50 flex items-center justify-center">
                <ScanFace className="w-10 h-10 md:w-12 md:h-12 text-indigo-400" />
              </div>
              <motion.div
                className="absolute -top-1 -right-1"
                animate={{ scale: [1, 1.3, 1], opacity: [0.5, 1, 0.5] }}
                transition={{ duration: 2, repeat: Infinity }}
              >
                <Sparkles className="w-4 h-4 text-cyan-400" />
              </motion.div>
              <motion.div
                className="absolute -bottom-1 -left-1"
                animate={{ scale: [1, 1.3, 1], opacity: [0.5, 1, 0.5] }}
                transition={{ duration: 2, repeat: Infinity, delay: 0.7 }}
              >
                <Sparkles className="w-3 h-3 text-purple-400" />
              </motion.div>
            </div>
          </motion.div>

          <div className="relative z-10 text-center">
            <motion.p
              className="text-sm text-gray-400"
              animate={{ opacity: [0.5, 1, 0.5] }}
              transition={{ duration: 2, repeat: Infinity }}
            >
              Scanning...
            </motion.p>
            <div className="flex gap-1 mt-2 justify-center">
              {[0, 1, 2].map((i) => (
                <motion.div
                  key={i}
                  className="w-2 h-2 rounded-full bg-indigo-500"
                  animate={{ opacity: [0.3, 1, 0.3] }}
                  transition={{ duration: 1.5, repeat: Infinity, delay: i * 0.3 }}
                />
              ))}
            </div>
          </div>

          <div className="absolute bottom-4 left-4 right-4 h-0.5 bg-gradient-to-r from-transparent via-indigo-500 to-transparent rounded-full" />
          <motion.div
            className="absolute top-4 left-4 right-4 h-0.5 bg-gradient-to-r from-transparent via-cyan-500 to-transparent rounded-full"
            animate={{ opacity: [0.3, 0.8, 0.3] }}
            transition={{ duration: 2, repeat: Infinity }}
          />
        </div>
      </div>

      {[-1, 1].map((dir, i) => (
        <motion.div
          key={i}
          className="absolute top-1/2 -translate-y-1/2 w-3 h-3"
          style={{ [dir === -1 ? "left" : "right"]: "-6px" }}
          animate={{ x: [0, dir * 5, 0] }}
          transition={{ duration: 3, repeat: Infinity, delay: i * 0.5 }}
        >
          <Camera className={`w-4 h-4 ${dir === -1 ? "text-indigo-400" : "text-cyan-400"}`} />
        </motion.div>
      ))}
    </div>
  );
}
