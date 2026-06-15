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

  const handleAttendanceSuccess = async (userData: any) => {
    const res = await fetch("/api/attendance/mark", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ userId: userData.id || user?.id }),
    });
    const data = await res.json();
    if (data.success) {
      setTodayAttendance({ marked: true, attendance: data.attendance });
    } else if (data.alreadyMarked) {
      setTodayAttendance({ marked: true });
    }
  };

  if (loading) {
    return <LoadingSpinner text="Loading dashboard..." />;
  }

  return (
    <div className="max-w-5xl mx-auto space-y-6">
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
        <h1 className="text-2xl md:text-3xl font-bold text-white">
          Welcome back, {user?.name?.split(" ")[0] || "User"}
        </h1>
        <p className="text-gray-400 mt-1">Manage your attendance</p>
      </motion.div>

      {todayAttendance?.marked ? (
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
        >
          <GlassCard glow="emerald" className="!p-8 text-center">
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ type: "spring", stiffness: 200 }}
            >
              <CheckCircle2 className="w-16 h-16 text-emerald-400 mx-auto mb-4" />
            </motion.div>
            <h2 className="text-2xl font-bold text-emerald-400 mb-2">
              Attendance Already Marked Today
            </h2>
            <p className="text-gray-400">
              You have successfully marked your attendance for today.
            </p>
            {todayAttendance.attendance && (
              <div className="flex items-center justify-center gap-6 mt-4 text-sm text-gray-500">
                <span className="flex items-center gap-1.5">
                  <CalendarDays className="w-4 h-4 text-indigo-400" />
                  {todayAttendance.attendance.attendanceDate}
                </span>
                <span className="flex items-center gap-1.5">
                  <Clock className="w-4 h-4 text-indigo-400" />
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
          <GlassCard glow="indigo" className="!p-8">
            <div className="flex flex-col md:flex-row items-center gap-6">
              <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-indigo-500/20 to-cyan-500/20 flex items-center justify-center">
                <ScanFace className="w-10 h-10 text-indigo-400" />
              </div>
              <div className="flex-1 text-center md:text-left">
                <h2 className="text-xl font-bold text-white mb-1">
                  Mark Your Attendance
                </h2>
                <p className="text-sm text-gray-400">
                  Use face recognition to mark your attendance for today
                </p>
              </div>
              <GradientButton onClick={handleMarkAttendanceClick} size="lg">
                Mark Attendance <ArrowRight className="w-5 h-5" />
              </GradientButton>
            </div>
          </GlassCard>
        </motion.div>
      )}

      <div className="grid sm:grid-cols-3 gap-4">
        <GlassCard hover>
          <CalendarDays className="w-8 h-8 text-indigo-400 mb-3" />
          <p className="text-2xl font-bold text-white">{new Date().toLocaleDateString()}</p>
          <p className="text-xs text-gray-500 mt-1">Today&apos;s Date</p>
        </GlassCard>
        <GlassCard hover>
          <Clock className="w-8 h-8 text-purple-400 mb-3" />
          <p className="text-2xl font-bold text-white">
            {new Date().toLocaleTimeString()}
          </p>
          <p className="text-xs text-gray-500 mt-1">Current Time</p>
        </GlassCard>
        <GlassCard hover>
          <CheckCircle2 className="w-8 h-8 text-cyan-400 mb-3" />
          <p className="text-2xl font-bold text-white">
            {todayAttendance?.marked ? "Present" : "Not Marked"}
          </p>
          <p className="text-xs text-gray-500 mt-1">Status</p>
        </GlassCard>
      </div>

      {/* Face Not Registered Modal */}
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
              className="glass rounded-3xl p-8 max-w-sm w-full glow text-center"
            >
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ type: "spring", stiffness: 200 }}
              >
                <AlertCircle className="w-16 h-16 text-amber-400 mx-auto mb-4" />
              </motion.div>
              <h2 className="text-xl font-bold text-amber-400 mb-2">
                Face Not Registered
              </h2>
              <p className="text-gray-400 mb-6">
                You have not completed Face Registration yet. Please register your face first before marking attendance.
              </p>
              <div className="flex gap-3">
                <GradientButton
                  onClick={() => {
                    setNoFaceError(false);
                    window.location.href = "/dashboard/face-registration";
                  }}
                  className="flex-1"
                >
                  Go to Face Registration
                </GradientButton>
                <button
                  onClick={() => setNoFaceError(false)}
                  className="px-6 py-3 rounded-xl border border-white/10 text-gray-300 hover:text-white hover:bg-white/5 transition-all"
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
