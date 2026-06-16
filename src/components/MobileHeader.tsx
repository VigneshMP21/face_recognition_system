"use client";

import { Menu } from "lucide-react";

interface MobileHeaderProps {
  /** Called when the sidebar toggle button is pressed. */
  onToggleSidebar: () => void;
}

/**
 * Mobile-only top header (visible below 480px).
 * Left  : Logo + "Smart Attendance" name.
 * Right : Sidebar toggle button.
 */
export default function MobileHeader({ onToggleSidebar }: MobileHeaderProps) {
  return (
    <header className="mobile-header fixed top-0 left-0 right-0 z-40 flex items-center justify-between h-16 px-4 bg-[#0a0a1a]/90 backdrop-blur-xl border-b border-white/10 shadow-lg shadow-black/20">
      {/* Left: Logo + Name */}
      <div className="flex items-center gap-3 min-w-0">
        <div className="w-11 h-11 rounded-2xl overflow-hidden flex items-center justify-center flex-shrink-0 shadow-lg shadow-indigo-500/20 bg-white/10">
          <img
            src="/smart_attendance.png"
            alt="Smart Attendance Logo"
            className="w-full h-full object-contain"
          />
        </div>
        <span className="text-lg font-bold text-white truncate">
          Smart
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 via-purple-400 to-cyan-400">
            Attendance
          </span>
        </span>
      </div>

      {/* Right: Sidebar toggle */}
      <button
        onClick={onToggleSidebar}
        className="p-2 rounded-xl text-gray-300 hover:text-white hover:bg-white/10 transition-all flex-shrink-0 touch-target flex items-center justify-center"
        aria-label="Open menu"
      >
        <Menu className="w-6 h-6" />
      </button>
    </header>
  );
}
