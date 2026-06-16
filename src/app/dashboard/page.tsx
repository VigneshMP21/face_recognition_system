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
} from "lucide-react";
import GlassCard from "@/components/ui/GlassCard";
import GradientButton from "@/components/ui/GradientButton";
import CameraModal from "@/components/CameraModal";
import LoadingSpinner from "@/components/ui/LoadingSpinner";

export default function DashboardHome() {
  const [cameraOpen, setCameraOpen] = useState(false);
  const [user, setUser] = useState<any>(null);
  const [todayAttendance, setTodayAttendance] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [faceRegistered, setFaceRegistered] = useState(false);
  const [noFaceError, setNoFaceError] = useState(false);

  useEffect(() => {
    fetch("/api/auth/user")
      .then((res) => res.json())
      .then((data) => {
        setUser(data.user);
        return Promise.all([
          fetch("/api/attendance/today"),
          fetch("/api/face/status"),
        ]);
      })
      .then(async ([attendanceRes, faceRes]) => {
        const attendanceData = await attendanceRes.json();
        const faceData = await faceRes.json();
        setTodayAttendance(attendanceData);
        setFaceRegistered(faceData.registered);
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

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 md:gap-4 dashboard-stats">
        <GlassCard hover className="!p-4 md:!p-6">
          <div className="stat-icon w-10 h-10 md:w-12 md:h-12 rounded-xl bg-gradient-to-br from-indigo-500/20 to-purple-500/20 flex items-center justify-center mb-0 md:mb-3">
            <CalendarDays className="w-5 h-5 md:w-6 md:h-6 text-indigo-400" />
          </div>
          <div className="stat-info">
            <p className="text-xl md:text-2xl font-bold text-white">
              {new Date().toLocaleDateString()}
            </p>
            <p className="text-xs md:text-sm text-gray-500 mt-0.5 md:mt-1">
              Today&apos;s Date
            </p>
          </div>
        </GlassCard>
        <GlassCard hover className="!p-4 md:!p-6">
          <div className="stat-icon w-10 h-10 md:w-12 md:h-12 rounded-xl bg-gradient-to-br from-purple-500/20 to-pink-500/20 flex items-center justify-center mb-0 md:mb-3">
            <Clock className="w-5 h-5 md:w-6 md:h-6 text-purple-400" />
          </div>
          <div className="stat-info">
            <p className="text-xl md:text-2xl font-bold text-white">
              {new Date().toLocaleTimeString()}
            </p>
            <p className="text-xs md:text-sm text-gray-500 mt-0.5 md:mt-1">
              Current Time
            </p>
          </div>
        </GlassCard>
        <GlassCard hover className="!p-4 md:!p-6">
          <div className="stat-icon w-10 h-10 md:w-12 md:h-12 rounded-xl bg-gradient-to-br from-cyan-500/20 to-emerald-500/20 flex items-center justify-center mb-0 md:mb-3">
            <CheckCircle2 className="w-5 h-5 md:w-6 md:h-6 text-cyan-400" />
          </div>
          <div className="stat-info">
            <p className="text-xl md:text-2xl font-bold text-white">
              {todayAttendance?.marked ? "Present" : "Not Marked"}
            </p>
            <p className="text-xs md:text-sm text-gray-500 mt-0.5 md:mt-1">
              Status
            </p>
          </div>
        </GlassCard>
      </div>

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