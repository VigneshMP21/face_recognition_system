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
  Activity,
  Calendar,
  Clock,
  Target,
  Zap,
} from "lucide-react";
import GlassCard from "@/components/ui/GlassCard";
import LoadingSpinner from "@/components/ui/LoadingSpinner";
import {
  WeeklyAttendanceChart,
  DayOfWeekChart,
  AttendanceDistribution,
  MonthlyTrendChart,
} from "@/components/charts";

interface DashboardStats {
  totalStudents: number;
  todayPresent: number;
  todayAbsent: number;
  attendancePercentage: number;
}

interface AnalyticsData {
  weeklyData: Array<{
    date: string;
    present: number;
    absent: number;
    percentage: number;
  }>;
  monthlyChartData: Array<{
    week: string;
    attendance: number;
  }>;
  dayOfWeekChartData: Array<{
    day: string;
    fullDay: string;
    attendance: number;
    students: number;
  }>;
  activityData: Array<{
    id: string;
    studentName: string;
    status: string;
    date: string;
    time: string;
  }>;
  totalStudents: number;
}

export default function AdminDashboard() {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [analytics, setAnalytics] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      fetch("/api/admin/dashboard").then((res) => res.json()),
      fetch("/api/admin/analytics").then((res) => res.json()),
    ])
      .then(([statsData, analyticsData]) => {
        setStats(statsData);
        setAnalytics(analyticsData);
      })
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

  // Calculate weekly average
  const weeklyAvg = analytics?.weeklyData?.length
    ? Math.round(
        analytics.weeklyData.reduce((sum, d) => sum + d.percentage, 0) /
          analytics.weeklyData.length
      )
    : 0;

  // Best day of week
  const bestDay =
    analytics?.dayOfWeekChartData?.length
      ? analytics.dayOfWeekChartData.reduce((best, current) =>
          current.attendance > best.attendance ? current : best
        )
      : null;

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

      {/* Stats Cards */}
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

      {/* Quick Stats Row */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <GlassCard className="!p-4 md:!p-5">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-violet-500 to-purple-600 flex items-center justify-center">
              <Target className="w-5 h-5 text-white" />
            </div>
            <div>
              <p className="text-xs text-gray-400">Weekly Average</p>
              <p className="text-lg font-bold text-white">{weeklyAvg}%</p>
            </div>
          </div>
        </GlassCard>
        <GlassCard className="!p-4 md:!p-5">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-amber-500 to-orange-600 flex items-center justify-center">
              <Calendar className="w-5 h-5 text-white" />
            </div>
            <div>
              <p className="text-xs text-gray-400">Best Day</p>
              <p className="text-lg font-bold text-white">
                {bestDay?.fullDay || "N/A"}
              </p>
            </div>
          </div>
        </GlassCard>
        <GlassCard className="!p-4 md:!p-5">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-cyan-500 to-blue-600 flex items-center justify-center">
              <Zap className="w-5 h-5 text-white" />
            </div>
            <div>
              <p className="text-xs text-gray-400">This Week</p>
              <p className="text-lg font-bold text-white">
                {analytics?.weeklyData?.[6]?.percentage || 0}%
              </p>
            </div>
          </div>
        </GlassCard>
      </div>

      {/* Charts Grid */}
      <div className="grid md:grid-cols-2 gap-4 md:gap-6 mb-6">
        {/* Weekly Attendance Chart */}
        <GlassCard className="!p-5 md:!p-6">
          <h2 className="text-base md:text-lg font-semibold text-white mb-4 flex items-center gap-2">
            <TrendingUp className="w-4 h-4 md:w-5 md:h-5 text-indigo-400" />
            Weekly Attendance Trend
          </h2>
          {analytics?.weeklyData && (
            <WeeklyAttendanceChart data={analytics.weeklyData} />
          )}
        </GlassCard>

        {/* Day of Week Chart */}
        <GlassCard className="!p-5 md:!p-6">
          <h2 className="text-base md:text-lg font-semibold text-white mb-4 flex items-center gap-2">
            <Calendar className="w-4 h-4 md:w-5 md:h-5 text-violet-400" />
            Attendance by Day of Week
          </h2>
          {analytics?.dayOfWeekChartData && (
            <DayOfWeekChart data={analytics.dayOfWeekChartData} />
          )}
        </GlassCard>

        {/* Monthly Trend Chart */}
        <GlassCard className="!p-5 md:!p-6">
          <h2 className="text-base md:text-lg font-semibold text-white mb-4 flex items-center gap-2">
            <Activity className="w-4 h-4 md:w-5 md:h-5 text-purple-400" />
            Monthly Attendance Trend
          </h2>
          {analytics?.monthlyChartData && (
            <MonthlyTrendChart data={analytics.monthlyChartData} />
          )}
        </GlassCard>

        {/* Today's Distribution */}
        <GlassCard className="!p-5 md:!p-6">
          <h2 className="text-base md:text-lg font-semibold text-white mb-4 flex items-center gap-2">
            <Target className="w-4 h-4 md:w-5 md:h-5 text-emerald-400" />
            Today&apos;s Distribution
          </h2>
          <AttendanceDistribution
            present={stats.todayPresent}
            absent={stats.todayAbsent}
          />
        </GlassCard>
      </div>

      {/* Recent Activity & Quick Actions */}
      <div className="grid md:grid-cols-2 gap-4 md:gap-6">
        {/* Recent Activity */}
        <GlassCard className="!p-5 md:!p-6">
          <h2 className="text-base md:text-lg font-semibold text-white mb-4 flex items-center gap-2">
            <Clock className="w-4 h-4 md:w-5 md:h-5 text-cyan-400" />
            Recent Activity
          </h2>
          <div className="space-y-3 max-h-64 overflow-y-auto">
            {analytics?.activityData?.map((activity) => (
              <div
                key={activity.id}
                className="flex items-center justify-between p-3 rounded-lg bg-white/5 hover:bg-white/10 transition-colors"
              >
                <div className="flex items-center gap-3">
                  <div
                    className={`w-8 h-8 rounded-full flex items-center justify-center ${
                      activity.status === "present"
                        ? "bg-emerald-500/20 text-emerald-400"
                        : "bg-red-500/20 text-red-400"
                    }`}
                  >
                    {activity.status === "present" ? (
                      <CheckCircle2 className="w-4 h-4" />
                    ) : (
                      <XCircle className="w-4 h-4" />
                    )}
                  </div>
                  <div>
                    <p className="text-sm text-white font-medium">
                      {activity.studentName}
                    </p>
                    <p className="text-xs text-gray-500">{activity.date}</p>
                  </div>
                </div>
                <div className="text-right">
                  <p
                    className={`text-xs font-medium ${
                      activity.status === "present"
                        ? "text-emerald-400"
                        : "text-red-400"
                    }`}
                  >
                    {activity.status === "present" ? "Present" : "Absent"}
                  </p>
                  <p className="text-xs text-gray-500">{activity.time}</p>
                </div>
              </div>
            ))}
            {(!analytics?.activityData || analytics.activityData.length === 0) && (
              <p className="text-gray-500 text-sm text-center py-4">
                No recent activity
              </p>
            )}
          </div>
        </GlassCard>

        {/* Quick Actions */}
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
            <a
              href="/admin/face-registration"
              className="block p-3.5 md:p-4 rounded-xl bg-white/5 hover:bg-white/10 hover:border hover:border-white/10 transition-all text-sm md:text-base text-white font-medium flex items-center justify-between group"
            >
              <span>Face Registration</span>
              <ArrowRight className="w-4 h-4 text-gray-400 group-hover:text-white transition-colors" />
            </a>
            <a
              href="/admin/profile"
              className="block p-3.5 md:p-4 rounded-xl bg-white/5 hover:bg-white/10 hover:border hover:border-white/10 transition-all text-sm md:text-base text-white font-medium flex items-center justify-between group"
            >
              <span>Admin Profile</span>
              <ArrowRight className="w-4 h-4 text-gray-400 group-hover:text-white transition-colors" />
            </a>
          </div>
        </GlassCard>
      </div>
    </div>
  );
}