"use client";

import { useState } from "react";
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

      <section className="min-h-screen flex items-center justify-center pt-20 md:pt-24 pb-12 md:pb-16 px-3 md:px-4">
        <div className="max-w-7xl mx-auto grid lg:grid-cols-2 gap-8 md:gap-12 items-center">
          <motion.div
            initial={{ opacity: 0, x: -30 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.8 }}
            className="text-center lg:text-left order-2 lg:order-1"
          >
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="inline-flex items-center gap-2 px-3 py-1.5 md:px-4 md:py-2 rounded-full glass text-xs md:text-sm text-indigo-300 mb-4 md:mb-6"
            >
              <ScanLine className="w-3 h-3 md:w-4 md:h-4" />
              <span className="hidden sm:inline">Next-Gen Attendance System</span>
              <span className="sm:hidden">AI Face Recognition</span>
            </motion.div>

            <h1 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl xl:text-6xl font-bold leading-tight mb-4 md:mb-6">
              Smart Attendance
              <br />
              <span className="gradient-text text-2xl sm:text-3xl md:text-4xl lg:text-5xl">
                using AI Face Recognition
              </span>
            </h1>

            <p className="text-sm md:text-base lg:text-lg text-gray-400 max-w-xl mb-6 md:mb-8 lg:mx-0 mx-auto">
              Revolutionize your attendance management with cutting-edge facial
              recognition technology. Fast, accurate, and completely contactless.
            </p>

            <div className="flex flex-col sm:flex-row gap-3 md:gap-4 justify-center lg:justify-start landing-buttons">
              <GradientButton
                size="lg"
                onClick={() => setCameraOpen(true)}
                className="shadow-lg shadow-indigo-500/25"
              >
                Start Face Recognition
                <ArrowRight className="w-4 h-4 md:w-5 md:h-5" />
              </GradientButton>
              <a
                href="/register"
                className="px-6 py-3 md:px-8 md:py-4 rounded-xl border border-white/10 text-gray-300 hover:text-white hover:bg-white/10 hover:border-white/20 transition-all text-center text-sm md:text-base font-medium"
              >
                Learn More
              </a>
            </div>

            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.8 }}
              className="flex items-center gap-3 md:gap-4 mt-6 md:mt-8 justify-center lg:justify-start text-xs md:text-sm text-gray-500 flex-wrap"
            >
              <span className="flex items-center gap-1.5">
                <CheckCircle2 className="w-3.5 h-3.5 md:w-4 md:h-4 text-emerald-400" /> No Contact
              </span>
              <span className="flex items-center gap-1.5">
                <CheckCircle2 className="w-3.5 h-3.5 md:w-4 md:h-4 text-emerald-400" /> Instant
              </span>
              <span className="flex items-center gap-1.5">
                <CheckCircle2 className="w-3.5 h-3.5 md:w-4 md:h-4 text-emerald-400" /> Secure
              </span>
            </motion.div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, x: 30 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.8, delay: 0.2 }}
            className="order-1 lg:order-2 flex justify-center"
          >
            <div className="w-full max-w-sm md:max-w-md lg:max-w-full">
              <ScannerAnimation />
            </div>
          </motion.div>
        </div>
      </section>

      <section className="py-12 md:py-16 px-3 md:px-4">
        <div className="max-w-7xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4 lg:gap-8 stats-grid"
          >
            {stats.map((stat, i) => (
              <GlassCard key={i} className="text-center !p-4 md:!p-6" hover>
                <motion.p
                  initial={{ opacity: 0, scale: 0.5 }}
                  whileInView={{ opacity: 1, scale: 1 }}
                  viewport={{ once: true }}
                  transition={{ delay: i * 0.1 }}
                  className="text-2xl md:text-3xl lg:text-4xl font-bold gradient-text mb-1"
                >
                  {stat.value}
                </motion.p>
                <p className="text-xs md:text-sm text-gray-400">{stat.label}</p>
              </GlassCard>
            ))}
          </motion.div>
        </div>
      </section>

      <section className="py-12 md:py-16 px-3 md:px-4" id="features">
        <div className="max-w-7xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-8 md:mb-12"
          >
            <h2 className="text-2xl md:text-3xl lg:text-4xl font-bold mb-3 md:mb-4">
              Why Choose Our{" "}
              <span className="gradient-text">Smart System</span>
            </h2>
            <p className="text-sm md:text-base text-gray-400 max-w-2xl mx-auto px-2">
              Built with cutting-edge technology to provide the best attendance
              management experience.
            </p>
          </motion.div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6 features-grid">
            {features.map((feature, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1 }}
              >
                <GlassCard hover glow="indigo" className="h-full">
                  <div className="icon-wrapper w-10 h-10 md:w-12 md:h-12 rounded-xl bg-gradient-to-br from-indigo-500/20 to-purple-500/20 flex items-center justify-center mb-3 md:mb-4">
                    <feature.icon className="w-5 h-5 md:w-6 md:h-6 text-indigo-400" />
                  </div>
                  <h3 className="text-base md:text-lg font-semibold text-white mb-2">
                    {feature.title}
                  </h3>
                  <p className="text-xs md:text-sm text-gray-400">{feature.desc}</p>
                </GlassCard>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      <section className="py-16 md:py-20 px-3 md:px-4 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-radial from-indigo-500/10 to-transparent" />
        <div className="max-w-4xl mx-auto text-center relative">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
          >
            <h2 className="text-2xl md:text-3xl lg:text-4xl font-bold mb-3 md:mb-4">
              Ready to Get Started?
            </h2>
            <p className="text-sm md:text-base text-gray-400 mb-6 md:mb-8 max-w-xl mx-auto px-2">
              Join thousands of institutions using AI-powered attendance
              management.
            </p>
            <div className="flex flex-col sm:flex-row gap-3 md:gap-4 justify-center">
              <a href="/register">
                <GradientButton size="lg" className="shadow-lg shadow-indigo-500/25">
                  Register Now <ArrowRight className="w-4 h-4 md:w-5 md:h-5" />
                </GradientButton>
              </a>
              <a href="/login">
                <button className="px-6 py-3 md:px-8 md:py-4 rounded-xl border border-white/10 text-gray-300 hover:text-white hover:bg-white/10 hover:border-white/20 transition-all text-sm md:text-base font-medium">
                  Sign In
                </button>
              </a>
            </div>
          </motion.div>
        </div>
      </section>

      <footer className="border-t border-white/5 py-6 md:py-8 px-3 md:px-4">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-3 md:gap-4 text-xs md:text-sm text-gray-500 footer-content">
          <p>© 2026 Smart Attendance System. All rights reserved.</p>
          <p>Powered by AI Face Recognition Technology</p>
        </div>
      </footer>
    </>
  );
}