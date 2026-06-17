"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Menu, X, ScanFace } from "lucide-react";
import Link from "next/link";
import GradientButton from "./ui/GradientButton";

export default function Header() {
  const [scrolled, setScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener("scroll", onScroll);
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <header
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
        scrolled
          ? "bg-[#0a0a1a]/90 backdrop-blur-xl border-b border-white/5 shadow-lg shadow-black/20"
          : "bg-transparent"
      }`}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 md:h-20">
          <Link href="/" className="flex items-center gap-3 group">
            <motion.div
              whileHover={{ rotate: -10, scale: 1.1 }}
              whileTap={{ scale: 0.95 }}
              className="w-10 h-10 md:w-12 md:h-12 rounded-xl md:rounded-2xl overflow-hidden flex items-center justify-center shadow-lg shadow-indigo-500/20"
            >
              <img
                src="/smart_attendance.png"
                alt="Smart Attendance Logo"
                className="w-full h-full object-contain bg-white/10"
              />
            </motion.div>
            <div className="block">
              <h1 className="text-lg md:text-xl font-bold text-white">
                Smart
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 via-purple-400 to-cyan-400">
                  Attendance
                </span>
              </h1>
              <p className="text-xs text-gray-500 -mt-0.5">AI Face Recognition</p>
            </div>
          </Link>

          <nav className="hidden md:flex items-center gap-2 lg:gap-4">
            <Link
              href="/login"
              className="px-4 lg:px-5 py-2.5 text-sm font-medium text-gray-300 hover:text-white transition-all hover:bg-white/5 rounded-xl"
            >
              Login
            </Link>
            <Link href="/register">
              <GradientButton size="sm" className="shadow-lg shadow-indigo-500/25">
                Get Started
              </GradientButton>
            </Link>
          </nav>

          <button
            onClick={() => setMobileOpen(!mobileOpen)}
            className="md:hidden p-2 text-gray-400 hover:text-white hover:bg-white/10 rounded-xl transition-all touch-target flex items-center justify-center"
            aria-label="Toggle menu"
          >
            {mobileOpen ? (
              <X className="w-6 h-6" />
            ) : (
              <Menu className="w-6 h-6" />
            )}
          </button>
        </div>
      </div>

      <AnimatePresence>
        {mobileOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="md:hidden glass border-t border-white/10 overflow-hidden"
          >
            <div className="px-4 py-4 space-y-2">
              <Link
                href="/login"
                onClick={() => setMobileOpen(false)}
                className="block px-4 py-3 text-gray-300 hover:text-white hover:bg-white/10 rounded-xl transition-all font-medium"
              >
                Login
              </Link>
              <Link
                href="/register"
                onClick={() => setMobileOpen(false)}
                className="block px-4 py-3 text-center text-white rounded-xl bg-gradient-to-r from-indigo-500 via-purple-500 to-cyan-500 font-medium shadow-lg shadow-indigo-500/25 hover:shadow-xl transition-all"
              >
                Get Started
              </Link>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  );
}