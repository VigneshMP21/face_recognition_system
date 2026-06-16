"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import {
  Users,
  CheckCircle2,
  XCircle,
  TrendingUp,
  ScanFace,
  ArrowRight,
} from "lucide-react";
import GlassCard from "@/components/ui/GlassCard";
import LoadingSpinner from "@/components/ui/LoadingSpinner";

interface DashboardStats {
  totalStudents: number;
  todayPresent: number;
  todayAbsent: number;
  attendancePercentage: number;
}

export default function AdminDashboard() {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/admin/dashboard")
      .then((res) => res.json())
      .then((data) => setStats(data))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <LoadingSpinner text="Loading dashboard..." />;
  if (!stats) return null;

  const cards = [
    {
      label: "Total Students",
      value: stats.totalStudents,
      icon: Users,
      gradient: "from-indigo-500 via-purple-500 to-pink-500",
      glow: "indigo",
    },
    {
      label: "Present Today",
      value: stats.todayPresent,
      icon: CheckCircle2,
      gradient: "from-emerald-500 via-cyan-500 to-teal-500",
      glow: "emerald",
    },
    {
      label: "Absent Today",
      value: stats.todayAbsent,
      icon: XCircle,
      gradient: "from-red-500 via-orange-500 to-amber-500",
      glow: "red",
    },
    {
      label: "Attendance %",
      value: `${stats.attendancePercentage}%`,
      icon: TrendingUp,
      gradient: "from-cyan-500 via-blue-500 to-indigo-500",
      glow: "cyan",
    },
  ];

  return (
    <div className="max-w-6xl mx-auto">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <h1 className="text-xl md:text-2xl lg:text-3xl font-bold text-white mb-1 md:mb-2">
          Admin Dashboard
        </h1>
        <p className="text-sm text-gray-400 mb-5 md:mb-6">
          Monitor attendance and manage students
        </p>
      </motion.div>

      <div className="grid grid-cols-2 md:grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4 mb-6 md:mb-8 admin-stats-grid">
        {cards.map((card, i) => (
          <motion.div
            key={card.label}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.1 }}
          >
            <GlassCard hover className="!p-4 md:!p-6">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <p className="text-xs md:text-sm text-gray-400 mb-1">
                    {card.label}
                  </p>
                  <motion.p
                    initial={{ scale: 0.5 }}
                    animate={{ scale: 1 }}
                    transition={{
                      type: "spring",
                      stiffness: 100,
                      delay: 0.3 + i * 0.1,
                    }}
                    className="text-2xl md:text-3xl font-bold text-white"
                  >
                    {card.value}
                  </motion.p>
                </div>
                <div
                  className={`w-10 h-10 md:w-12 md:h-12 rounded-xl bg-gradient-to-br ${card.gradient} flex items-center justify-center flex-shrink-0 shadow-lg`}
                >
                  <card.icon className="w-5 h-5 md:w-6 md:h-6 text-white" />
                </div>
              </div>
            </GlassCard>
          </motion.div>
        ))}
      </div>

      <div className="grid md:grid-cols-2 gap-4 md:gap-6 admin-overview">
        <GlassCard className="!p-5 md:!p-6">
          <h2 className="text-base md:text-lg font-semibold text-white mb-4 flex items-center gap-2">
            <TrendingUp className="w-4 h-4 md:w-5 md:h-5 text-indigo-400" />
            Today&apos;s Overview
          </h2>
          <div className="space-y-4">
            <div>
              <div className="flex justify-between text-xs md:text-sm mb-1.5 md:mb-2">
                <span className="text-gray-400">Present</span>
                <span className="text-emerald-400 font-medium">
                  {stats.todayPresent} / {stats.totalStudents}
                </span>
              </div>
              <div className="h-2.5 md:h-3 rounded-full bg-white/5 overflow-hidden">
                <motion.div
                  initial={{ width: 0 }}
                  animate={{
                    width: `${
                      stats.totalStudents > 0
                        ? (stats.todayPresent / stats.totalStudents) * 100
                        : 0
                    }%`,
                  }}
                  transition={{ duration: 1, delay: 0.5 }}
                  className="h-full rounded-full bg-gradient-to-r from-emerald-500 via-cyan-500 to-teal-500"
                />
              </div>
            </div>
            <div>
              <div className="flex justify-between text-xs md:text-sm mb-1.5 md:mb-2">
                <span className="text-gray-400">Absent</span>
                <span className="text-red-400 font-medium">
                  {stats.todayAbsent} / {stats.totalStudents}
                </span>
              </div>
              <div className="h-2.5 md:h-3 rounded-full bg-white/5 overflow-hidden">
                <motion.div
                  initial={{ width: 0 }}
                  animate={{
                    width: `${
                      stats.totalStudents > 0
                        ? (stats.todayAbsent / stats.totalStudents) * 100
                        : 0
                    }%`,
                  }}
                  transition={{ duration: 1, delay: 0.7 }}
                  className="h-full rounded-full bg-gradient-to-r from-red-500 via-orange-500 to-amber-500"
                />
              </div>
            </div>
          </div>
        </GlassCard>

        <GlassCard className="!p-5 md:!p-6">
          <h2 className="text-base md:text-lg font-semibold text-white mb-4 flex items-center gap-2">
            <ScanFace className="w-4 h-4 md:w-5 md:h-5 text-indigo-400" />
            Quick Actions
          </h2>
          <div className="space-y-2.5 md:space-y-3">
            <a
              href="/admin/attendance"
              className="block p-3.5 md:p-4 rounded-xl bg-white/5 hover:bg-white/10 hover:border hover:border-white/10 transition-all text-sm md:text-base text-white font-medium flex items-center justify-between group"
            >
              <span>View All Attendance Records</span>
              <ArrowRight className="w-4 h-4 text-gray-400 group-hover:text-white transition-colors" />
            </a>
            <a
              href="/admin/students"
              className="block p-3.5 md:p-4 rounded-xl bg-white/5 hover:bg-white/10 hover:border hover:border-white/10 transition-all text-sm md:text-base text-white font-medium flex items-center justify-between group"
            >
              <span>Manage Students</span>
              <ArrowRight className="w-4 h-4 text-gray-400 group-hover:text-white transition-colors" />
            </a>
          </div>
        </GlassCard>
      </div>
    </div>
  );
}