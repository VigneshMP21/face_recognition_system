"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ScanFace, Menu, X } from "lucide-react";
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
          ? "bg-[#0a0a1a]/80 backdrop-blur-xl border-b border-white/5"
          : "bg-transparent"
      }`}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 md:h-20">
          <Link href="/" className="flex items-center gap-3 group">
            <motion.div
              whileHover={{ rotate: -10, scale: 1.1 }}
              className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-500 to-cyan-500 flex items-center justify-center"
            >
              <ScanFace className="w-5 h-5 text-white" />
            </motion.div>
            <div className="hidden sm:block">
              <h1 className="text-lg font-bold text-white">
                Smart<span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 to-cyan-400">Attendance</span>
              </h1>
              <p className="text-xs text-gray-500 -mt-0.5">AI Face Recognition</p>
            </div>
          </Link>

          <nav className="hidden md:flex items-center gap-4">
            <Link
              href="/login"
              className="px-5 py-2.5 text-sm font-medium text-gray-300 hover:text-white transition-colors"
            >
              Login
            </Link>
            <Link href="/register">
              <GradientButton size="sm">Get Started</GradientButton>
            </Link>
          </nav>

          <button
            onClick={() => setMobileOpen(!mobileOpen)}
            className="md:hidden p-2 text-gray-400 hover:text-white"
          >
            {mobileOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>
      </div>

      <AnimatePresence>
        {mobileOpen && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="md:hidden glass border-t border-white/10"
          >
            <div className="px-4 py-4 space-y-3">
              <Link
                href="/login"
                className="block px-4 py-3 text-gray-300 hover:text-white rounded-xl hover:bg-white/5 transition-all"
              >
                Login
              </Link>
              <Link
                href="/register"
                className="block px-4 py-3 text-center text-white rounded-xl bg-gradient-to-r from-indigo-500 to-cyan-500 font-medium"
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
