"use client";

import { useEffect, useRef, ReactNode } from "react";
import { motion, AnimatePresence } from "framer-motion";

interface CircularScannerProps {
  /** Whether a face is physically detected in the frame */
  faceDetected: boolean;
  /** Whether the face is validly positioned (centered, correct pose, etc.) */
  isValid?: boolean;
  /** The webcam (or any content) to render inside the circle */
  children: ReactNode;
  /** Diameter in px. Defaults to 320 */
  size?: number;
  /** Show a flash overlay (play once when a capture fires) */
  showCaptureFlash?: boolean;
  /** Extra className on the outer wrapper */
  className?: string;
}

export default function CircularScanner({
  faceDetected,
  isValid,
  children,
  size = 320,
  showCaptureFlash = false,
  className = "",
}: CircularScannerProps) {
  const flashKey = useRef(0);

  // Bump flash key every time showCaptureFlash toggles true so AnimatePresence re-mounts it.
  if (showCaptureFlash) flashKey.current += 1;

  const borderActive = isValid !== undefined ? isValid : faceDetected;
  const ringClass = borderActive ? "scanner-ring-green" : "scanner-ring-red";

  return (
    <div
      className={`relative flex-shrink-0 ${className}`}
      style={{ width: size, height: size }}
    >
      {/* ── Outer decorative spinning ring ─────────────────────── */}
      <motion.div
        className="absolute inset-0 rounded-full pointer-events-none"
        style={{
          background: borderActive
            ? "conic-gradient(from 0deg, transparent 60%, rgba(52,211,153,0.4) 100%)"
            : "conic-gradient(from 0deg, transparent 60%, rgba(239,68,68,0.4) 100%)",
        }}
        animate={{ rotate: 360 }}
        transition={{ duration: 3, repeat: Infinity, ease: "linear" }}
      />

      {/* ── Second decorative spinning ring (opposite direction) ── */}
      <motion.div
        className="absolute rounded-full pointer-events-none"
        style={{
          inset: 4,
          background: borderActive
            ? "conic-gradient(from 180deg, transparent 70%, rgba(52,211,153,0.25) 100%)"
            : "conic-gradient(from 180deg, transparent 70%, rgba(239,68,68,0.25) 100%)",
        }}
        animate={{ rotate: -360 }}
        transition={{ duration: 5, repeat: Infinity, ease: "linear" }}
      />

      {/* ── Main circular viewport ─────────────────────────────── */}
      <div
        className={`absolute rounded-full overflow-hidden bg-black/70 ${ringClass}`}
        style={{ inset: 8 }}
      >
        {/* Webcam / children fills the circle */}
        <div className="w-full h-full relative overflow-hidden rounded-full">
          {children}

          {/* Sweeping scan line */}
          <div className="scanner-sweep-line" />

          {/* Capture flash overlay */}
          <AnimatePresence>
            {showCaptureFlash && (
              <motion.div
                key={`flash-${flashKey.current}`}
                className="scanner-capture-flash"
                initial={{ opacity: 0 }}
                animate={{ opacity: 0.7 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.5 }}
              />
            )}
          </AnimatePresence>
        </div>
      </div>

      {/* ── Corner bracket marks (premium look) ───────────────── */}
      {(["tl", "tr", "bl", "br"] as const).map((corner) => (
        <CornerBracket key={corner} corner={corner} active={borderActive} />
      ))}

      {/* ── Status dot (bottom-centre) ─────────────────────────── */}
      <div
        className="absolute left-1/2 -translate-x-1/2 flex items-center gap-1.5 px-3 py-1 rounded-full backdrop-blur-sm"
        style={{ bottom: -32 }}
      >
        <motion.div
          className={`w-2 h-2 rounded-full ${faceDetected ? "bg-emerald-400" : "bg-red-400"}`}
          animate={{ scale: [1, 1.4, 1], opacity: [1, 0.6, 1] }}
          transition={{ duration: 1.2, repeat: Infinity }}
        />
        <span className={`text-xs font-semibold ${faceDetected ? "text-emerald-400" : "text-red-400"}`}>
          {faceDetected ? "Face Detected" : "No Face"}
        </span>
      </div>
    </div>
  );
}

/* ── Corner bracket helper ───────────────────────────────────────── */
type Corner = "tl" | "tr" | "bl" | "br";

function CornerBracket({ corner, active }: { corner: Corner; active: boolean }) {
  const color = active ? "rgb(52,211,153)" : "rgb(239,68,68)";
  const size = 20;
  const thickness = 3;
  const offset = 6; // distance from outer edge of the ring

  const styles: Record<Corner, React.CSSProperties> = {
    tl: { top: offset, left: offset },
    tr: { top: offset, right: offset },
    bl: { bottom: offset, left: offset },
    br: { bottom: offset, right: offset },
  };

  const borders: Record<Corner, React.CSSProperties> = {
    tl: { borderTop: `${thickness}px solid`, borderLeft: `${thickness}px solid`, borderRadius: "4px 0 0 0" },
    tr: { borderTop: `${thickness}px solid`, borderRight: `${thickness}px solid`, borderRadius: "0 4px 0 0" },
    bl: { borderBottom: `${thickness}px solid`, borderLeft: `${thickness}px solid`, borderRadius: "0 0 0 4px" },
    br: { borderBottom: `${thickness}px solid`, borderRight: `${thickness}px solid`, borderRadius: "0 0 4px 0" },
  };

  return (
    <div
      className="absolute pointer-events-none transition-colors duration-400"
      style={{
        ...styles[corner],
        ...borders[corner],
        width: size,
        height: size,
        borderColor: color,
        opacity: 0.8,
      }}
    />
  );
}
