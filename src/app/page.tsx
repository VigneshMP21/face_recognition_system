"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import {
  Shield,
  Zap,
  Brain,
  Users,
  CheckCircle2,
  ArrowRight,
  ScanLine,
} from "lucide-react";
import Header from "@/components/Header";
import ScannerAnimation from "@/components/ScannerAnimation";
import CameraModal from "@/components/CameraModal";
import GlassCard from "@/components/ui/GlassCard";
import GradientButton from "@/components/ui/GradientButton";

const features = [
  {
    icon: Brain,
    title: "AI-Powered Recognition",
    desc: "Advanced facial recognition using deep learning models for accurate identification.",
  },
  {
    icon: Zap,
    title: "Real-Time Processing",
    desc: "Instant face detection and attendance marking with zero latency.",
  },
  {
    icon: Shield,
    title: "Secure & Private",
    desc: "End-to-end encrypted data with secure storage and privacy-first architecture.",
  },
  {
    icon: Users,
    title: "Multi-User Support",
    desc: "Supports students, teachers, and administrators with role-based access.",
  },
];

const stats = [
  { value: "99.9%", label: "Accuracy Rate" },
  { value: "<1s", label: "Processing Time" },
  { value: "10K+", label: "Users Trust Us" },
  { value: "24/7", label: "Availability" },
];

export default function LandingPage() {
  const [cameraOpen, setCameraOpen] = useState(false);

  return (
    <>
      <Header />
      <CameraModal
        open={cameraOpen}
        onClose={() => setCameraOpen(false)}
        mode="attendance"
      />

      <section className="min-h-screen flex items-center justify-center pt-24 pb-16 px-4">
        <div className="max-w-7xl mx-auto grid lg:grid-cols-2 gap-12 items-center">
          <motion.div
            initial={{ opacity: 0, x: -30 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.8 }}
            className="text-center lg:text-left"
          >
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-full glass text-sm text-indigo-300 mb-6"
            >
              <ScanLine className="w-4 h-4" />
              Next-Gen Attendance System
            </motion.div>

            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold leading-tight mb-6">
              Smart Attendance System
              <br />
              <span className="gradient-text">using AI Face Recognition</span>
            </h1>

            <p className="text-lg text-gray-400 max-w-xl mb-8 lg:mx-0 mx-auto">
              Revolutionize your attendance management with cutting-edge facial
              recognition technology. Fast, accurate, and completely contactless.
            </p>

            <div className="flex flex-col sm:flex-row gap-4 justify-center lg:justify-start">
              <GradientButton
                size="lg"
                onClick={() => setCameraOpen(true)}
              >
                Start Face Recognition
                <ArrowRight className="w-5 h-5" />
              </GradientButton>
              <a
                href="/register"
                className="px-8 py-4 rounded-xl border border-white/10 text-gray-300 hover:text-white hover:bg-white/5 transition-all text-center"
              >
                Learn More
              </a>
            </div>

            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.8 }}
              className="flex items-center gap-4 mt-8 justify-center lg:justify-start text-sm text-gray-500"
            >
              <span className="flex items-center gap-1">
                <CheckCircle2 className="w-4 h-4 text-emerald-400" /> No Contact
              </span>
              <span className="flex items-center gap-1">
                <CheckCircle2 className="w-4 h-4 text-emerald-400" /> Instant
              </span>
              <span className="flex items-center gap-1">
                <CheckCircle2 className="w-4 h-4 text-emerald-400" /> Secure
              </span>
            </motion.div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, x: 30 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.8, delay: 0.2 }}
          >
            <ScannerAnimation />
          </motion.div>
        </div>
      </section>

      <section className="py-16 px-4">
        <div className="max-w-7xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-8"
          >
            {stats.map((stat, i) => (
              <GlassCard key={i} className="text-center !p-6" hover>
                <motion.p
                  initial={{ opacity: 0, scale: 0.5 }}
                  whileInView={{ opacity: 1, scale: 1 }}
                  viewport={{ once: true }}
                  transition={{ delay: i * 0.1 }}
                  className="text-3xl md:text-4xl font-bold gradient-text mb-1"
                >
                  {stat.value}
                </motion.p>
                <p className="text-sm text-gray-400">{stat.label}</p>
              </GlassCard>
            ))}
          </motion.div>
        </div>
      </section>

      <section className="py-16 px-4" id="features">
        <div className="max-w-7xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-12"
          >
            <h2 className="text-3xl md:text-4xl font-bold mb-4">
              Why Choose Our{" "}
              <span className="gradient-text">Smart System</span>
            </h2>
            <p className="text-gray-400 max-w-2xl mx-auto">
              Built with cutting-edge technology to provide the best attendance
              management experience.
            </p>
          </motion.div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {features.map((feature, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1 }}
              >
                <GlassCard hover glow="indigo">
                  <feature.icon className="w-10 h-10 text-indigo-400 mb-4" />
                  <h3 className="text-lg font-semibold text-white mb-2">
                    {feature.title}
                  </h3>
                  <p className="text-sm text-gray-400">{feature.desc}</p>
                </GlassCard>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      <section className="py-20 px-4 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-radial from-indigo-500/10 to-transparent" />
        <div className="max-w-4xl mx-auto text-center relative">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
          >
            <h2 className="text-3xl md:text-4xl font-bold mb-4">
              Ready to Get Started?
            </h2>
            <p className="text-gray-400 mb-8 max-w-xl mx-auto">
              Join thousands of institutions using AI-powered attendance
              management.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <a href="/register">
                <GradientButton size="lg">
                  Register Now <ArrowRight className="w-5 h-5" />
                </GradientButton>
              </a>
              <a href="/login">
                <button className="px-8 py-4 rounded-xl border border-white/10 text-gray-300 hover:text-white hover:bg-white/5 transition-all">
                  Sign In
                </button>
              </a>
            </div>
          </motion.div>
        </div>
      </section>

      <footer className="border-t border-white/5 py-8 px-4">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4 text-sm text-gray-500">
          <p>© 2026 Smart Attendance System. All rights reserved.</p>
          <p>Powered by AI Face Recognition Technology</p>
        </div>
      </footer>
    </>
  );
}
