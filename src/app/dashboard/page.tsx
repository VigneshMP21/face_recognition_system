"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  ScanFace,
  CheckCircle2,
  Clock,
  CalendarDays,
  ArrowRight,
  AlertCircle,
  Activity,
  Target,
  Calendar,
  TrendingUp,
} from "lucide-react";
import GlassCard from "@/components/ui/GlassCard";
import GradientButton from "@/components/ui/GradientButton";
import CameraModal from "@/components/CameraModal";
import LoadingSpinner from "@/components/ui/LoadingSpinner";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from "recharts";

export default function DashboardHome() {
  const [cameraOpen, setCameraOpen] = useState(false);
  const [user, setUser] = useState<any>(null);
  const [todayAttendance, setTodayAttendance] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [faceRegistered, setFaceRegistered] = useState(false);
  const [noFaceError, setNoFaceError] = useState(false);
  const [analytics, setAnalytics] = useState<any>(null);

  useEffect(() => {
    fetch("/api/auth/user")
      .then((res) => res.json())
      .then((data) => {
        setUser(data.user);
        return Promise.all([
          fetch("/api/attendance/today"),
          fetch("/api/face/status"),
          fetch("/api/student/analytics"),
        ]);
      })
      .then(async ([attendanceRes, faceRes, analyticsRes]) => {
        const attendanceData = await attendanceRes.json();
        const faceData = await faceRes.json();
        const analyticsData = await analyticsRes.json();
        setTodayAttendance(attendanceData);
        setFaceRegistered(faceData.registered);
        setAnalytics(analyticsData);
      })
      .finally(() => setLoading(false));
  }, []);

  const handleMarkAttendanceClick = () => {
    if (!faceRegistered) {
      setNoFaceError(true);
      return;
    }
    setCameraOpen(true);
  };

  const handleAttendanceSuccess = (userData: any) => {
    if (userData?.alreadyMarked) {
      setTodayAttendance({ marked: true });
    } else {
      setTodayAttendance({ marked: true, attendance: userData });
    }
    setCameraOpen(false);
  };

  // Chart data
  const chartData = analytics?.weeklyData || [];
  const presentCount = analytics?.presentDays || 0;
  const absentCount = (analytics?.totalDays || 30) - presentCount;
  const attendanceRate = analytics?.attendanceRate || 0;

  if (loading) {
    return <LoadingSpinner text="Loading dashboard..." />;
  }

  return (
    <div className="max-w-5xl mx-auto space-y-4 md:space-y-6 dashboard-container">
      <CameraModal
        open={cameraOpen}
        onClose={() => setCameraOpen(false)}
        mode="attendance"
        onSuccess={handleAttendanceSuccess}
      />

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <h1 className="text-xl md:text-2xl lg:text-3xl font-bold text-white dashboard-header">
          Welcome back, {user?.name?.split(" ")[0] || "User"}
        </h1>
        <p className="text-sm text-gray-400 mt-1">Manage your attendance</p>
      </motion.div>

      {todayAttendance?.marked ? (
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
        >
          <GlassCard glow="emerald" className="!p-6 md:!p-8 text-center">
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ type: "spring", stiffness: 200 }}
            >
              <CheckCircle2 className="w-12 h-12 md:w-14 md:h-14 lg:w-16 lg:h-16 text-emerald-400 mx-auto mb-3 md:mb-4" />
            </motion.div>
            <h2 className="text-lg md:text-xl lg:text-2xl font-bold text-emerald-400 mb-2">
              Attendance Already Marked Today
            </h2>
            <p className="text-sm text-gray-400">
              You have successfully marked your attendance for today.
            </p>
            {todayAttendance.attendance && (
              <div className="flex flex-wrap items-center justify-center gap-3 md:gap-6 mt-4 text-xs md:text-sm text-gray-500">
                <span className="flex items-center gap-1.5">
                  <CalendarDays className="w-3.5 h-3.5 md:w-4 md:h-4 text-indigo-400" />
                  {todayAttendance.attendance.attendanceDate}
                </span>
                <span className="flex items-center gap-1.5">
                  <Clock className="w-3.5 h-3.5 md:w-4 md:h-4 text-indigo-400" />
                  {todayAttendance.attendance.attendanceTime}
                </span>
              </div>
            )}
          </GlassCard>
        </motion.div>
      ) : (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <GlassCard glow="indigo" className="!p-5 md:!p-8">
            <div className="flex flex-col md:flex-row items-center gap-4 md:gap-6">
              <div className="w-16 h-16 md:w-20 md:h-20 rounded-2xl bg-gradient-to-br from-indigo-500/20 via-purple-500/20 to-cyan-500/20 flex items-center justify-center flex-shrink-0 shadow-lg shadow-indigo-500/10">
                <ScanFace className="w-8 h-8 md:w-10 md:h-10 text-indigo-400" />
              </div>
              <div className="flex-1 text-center md:text-left">
                <h2 className="text-lg md:text-xl font-bold text-white mb-1">
                  Mark Your Attendance
                </h2>
                <p className="text-xs md:text-sm text-gray-400">
                  Use face recognition to mark your attendance for today
                </p>
              </div>
              <GradientButton
                onClick={handleMarkAttendanceClick}
                size="lg"
                className="shadow-lg shadow-indigo-500/25 w-full md:w-auto"
              >
                <span className="hidden sm:inline">Mark Attendance</span>
                <span className="sm:hidden">Mark</span>
                <ArrowRight className="w-4 h-4 md:w-5 md:h-5" />
              </GradientButton>
            </div>
          </GlassCard>
        </motion.div>
      )}

      {/* Quick Stats Row */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4">
        <GlassCard className="!p-4 md:!p-5">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center">
              <Calendar className="w-5 h-5 text-white" />
            </div>
            <div>
              <p className="text-xs text-gray-400">Today</p>
              <p className="text-lg font-bold text-white">
                {new Date().toLocaleDateString("en-US", { month: "short", day: "numeric" })}
              </p>
            </div>
          </div>
        </GlassCard>
        <GlassCard className="!p-4 md:!p-5">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-purple-500 to-pink-600 flex items-center justify-center">
              <Clock className="w-5 h-5 text-white" />
            </div>
            <div>
              <p className="text-xs text-gray-400">Time</p>
              <p className="text-lg font-bold text-white">
                {new Date().toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" })}
              </p>
            </div>
          </div>
        </GlassCard>
        <GlassCard className="!p-4 md:!p-5">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-emerald-500 to-cyan-600 flex items-center justify-center">
              <CheckCircle2 className="w-5 h-5 text-white" />
            </div>
            <div>
              <p className="text-xs text-gray-400">Status</p>
              <p className="text-lg font-bold text-white">
                {todayAttendance?.marked ? "Present" : "Not Marked"}
              </p>
            </div>
          </div>
        </GlassCard>
        <GlassCard className="!p-4 md:!p-5">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-amber-500 to-orange-600 flex items-center justify-center">
              <Target className="w-5 h-5 text-white" />
            </div>
            <div>
              <p className="text-xs text-gray-400">Attendance</p>
              <p className="text-lg font-bold text-white">{attendanceRate}%</p>
            </div>
          </div>
        </GlassCard>
      </div>

      {/* Charts Section */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
      >
        <h2 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
          <Activity className="w-5 h-5 text-indigo-400" />
          Weekly Attendance
        </h2>

        <div className="grid md:grid-cols-2 gap-4 md:gap-6">
          {/* Weekly Bar Chart */}
          <GlassCard className="!p-5 md:!p-6">
            <h3 className="text-base font-semibold text-white mb-4 flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-emerald-400" />
              Last 7 Days
            </h3>
            <div className="h-52">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" vertical={false} />
                  <XAxis
                    dataKey="date"
                    tick={{ fill: "#9ca3af", fontSize: 12 }}
                    axisLine={{ stroke: "rgba(255,255,255,0.1)" }}
                    tickLine={false}
                  />
                  <YAxis
                    tick={{ fill: "#9ca3af", fontSize: 12 }}
                    axisLine={{ stroke: "rgba(255,255,255,0.1)" }}
                    tickLine={false}
                    domain={[0, 1]}
                    tickFormatter={(value) => (value === 1 ? "P" : value === 0 ? "A" : "")}
                  />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "#1e293b",
                      border: "1px solid #334155",
                      borderRadius: "8px",
                    }}
                    labelStyle={{ color: "#fff" }}
                    formatter={(value) => [
                      value === 1 ? "Present" : "Absent",
                      "Status",
                    ]}
                  />
                  <Bar dataKey="value" radius={[4, 4, 0, 0]} name="Status">
                    {chartData.map((entry: any, index: number) => (
                      <Cell
                        key={`cell-${index}`}
                        fill={entry.value === 1 ? "#10b981" : "#ef4444"}
                      />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </GlassCard>

          {/* Stats Overview */}
          <GlassCard className="!p-5 md:!p-6">
            <h3 className="text-base font-semibold text-white mb-4 flex items-center gap-2">
              <Target className="w-4 h-4 text-purple-400" />
              This Month
            </h3>
            <div className="space-y-4">
              <div className="p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/20">
                <div className="flex items-center justify-between">
                  <span className="text-gray-400 text-sm">Present Days</span>
                  <span className="text-emerald-400 font-bold text-xl">{presentCount}</span>
                </div>
                <div className="mt-2 h-2 bg-white/10 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-emerald-500 to-cyan-500 rounded-full"
                    style={{ width: `${attendanceRate}%` }}
                  />
                </div>
              </div>
              <div className="p-4 rounded-xl bg-red-500/10 border border-red-500/20">
                <div className="flex items-center justify-between">
                  <span className="text-gray-400 text-sm">Absent Days</span>
                  <span className="text-red-400 font-bold text-xl">{absentCount}</span>
                </div>
                <div className="mt-2 h-2 bg-white/10 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-red-500 to-orange-500 rounded-full"
                    style={{ width: `${100 - attendanceRate}%` }}
                  />
                </div>
              </div>
              <div className="p-4 rounded-xl bg-indigo-500/10 border border-indigo-500/20">
                <div className="flex items-center justify-between">
                  <span className="text-gray-400 text-sm">Attendance Rate</span>
                  <span className="text-indigo-400 font-bold text-xl">{attendanceRate}%</span>
                </div>
              </div>
              <div className="p-4 rounded-xl bg-purple-500/10 border border-purple-500/20">
                <div className="flex items-center justify-between">
                  <span className="text-gray-400 text-sm">Total Records</span>
                  <span className="text-purple-400 font-bold text-xl">{analytics?.totalRecords || 0}</span>
                </div>
              </div>
            </div>
          </GlassCard>
        </div>
      </motion.div>

      {/* Recent History */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
      >
        <GlassCard className="!p-5 md:!p-6">
          <h3 className="text-base font-semibold text-white mb-4 flex items-center gap-2">
            <Clock className="w-4 h-4 text-cyan-400" />
            Recent Attendance History
          </h3>
          <div className="space-y-2">
            {analytics?.historyData?.length > 0 ? (
              analytics.historyData.map((record: any) => (
                <div
                  key={record.id}
                  className="flex items-center justify-between p-3 rounded-lg bg-white/5 hover:bg-white/10 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-emerald-500/20 flex items-center justify-center">
                      <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                    </div>
                    <div>
                      <p className="text-sm text-white font-medium">{record.date}</p>
                      <p className="text-xs text-gray-500">{record.time}</p>
                    </div>
                  </div>
                  <span className="text-xs font-medium text-emerald-400">Present</span>
                </div>
              ))
            ) : (
              <p className="text-gray-500 text-sm text-center py-4">No attendance records yet</p>
            )}
          </div>
        </GlassCard>
      </motion.div>

      <AnimatePresence>
        {noFaceError && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm"
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="glass rounded-2xl md:rounded-3xl p-6 md:p-8 max-w-sm w-full glow text-center"
            >
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ type: "spring", stiffness: 200 }}
              >
                <AlertCircle className="w-12 h-12 md:w-14 md:h-14 text-amber-400 mx-auto mb-3 md:mb-4" />
              </motion.div>
              <h2 className="text-lg md:text-xl font-bold text-amber-400 mb-2">
                Face Not Registered
              </h2>
              <p className="text-xs md:text-sm text-gray-400 mb-5 md:mb-6">
                You have not completed Face Registration yet. Please register your
                face first before marking attendance.
              </p>
              <div className="flex flex-col sm:flex-row gap-3 modal-actions">
                <GradientButton
                  onClick={() => {
                    setNoFaceError(false);
                    window.location.href = "/dashboard/face-registration";
                  }}
                  className="flex-1 shadow-lg shadow-indigo-500/20"
                >
                  Go to Face Registration
                </GradientButton>
                <button
                  onClick={() => setNoFaceError(false)}
                  className="px-5 py-3 md:px-6 md:py-3 rounded-xl border border-white/10 text-gray-300 hover:text-white hover:bg-white/10 transition-all text-sm md:text-base"
                >
                  Cancel
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}