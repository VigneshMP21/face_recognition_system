"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Search,
  Download,
  CalendarDays,
  Clock,
  CheckCircle2,
  XCircle,
  Users,
  CalendarRange,
} from "lucide-react";
import GlassCard from "@/components/ui/GlassCard";
import GradientButton from "@/components/ui/GradientButton";
import LoadingSpinner from "@/components/ui/LoadingSpinner";

interface AttendanceRecord {
  id: string;
  name: string;
  rollNumber: string;
  status: "Present" | "Absent";
  time: string | null;
}

function todayISO() {
  return new Date().toISOString().split("T")[0];
}

export default function AdminAttendancePage() {
  const [date, setDate] = useState(todayISO());
  const [records, setRecords] = useState<AttendanceRecord[]>([]);
  const [markedDates, setMarkedDates] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState<"all" | "present" | "absent">("all");

  useEffect(() => {
    fetch("/api/admin/attendance/dates")
      .then((res) => res.json())
      .then((data) => setMarkedDates(data.dates || []))
      .catch(() => {});
  }, []);

  useEffect(() => {
    setLoading(true);
    fetch(`/api/admin/attendance/by-date?date=${date}`)
      .then((res) => res.json())
      .then((data) => setRecords(data.records || []))
      .finally(() => setLoading(false));
  }, [date]);

  const presentCount = records.filter((r) => r.status === "Present").length;
  const absentCount = records.length - presentCount;

  const filtered = records.filter((r) => {
    const matchesSearch =
      r.name.toLowerCase().includes(search.toLowerCase()) ||
      r.rollNumber.toLowerCase().includes(search.toLowerCase());
    const matchesFilter =
      filter === "all" ||
      (filter === "present" && r.status === "Present") ||
      (filter === "absent" && r.status === "Absent");
    return matchesSearch && matchesFilter;
  });

  const exportCSV = () => {
    const headers = ["Roll Number", "Name", "Status", "Time"];
    const rows = filtered.map((r) => [
      r.rollNumber,
      r.name,
      r.status,
      r.time || "—",
    ]);
    const csv = [headers, ...rows]
      .map((row) => row.map((cell) => `"${cell}"`).join(","))
      .join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `attendance-${date}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const formatLongDate = (d: string) =>
    new Date(d + "T00:00:00").toLocaleDateString("en-US", {
      weekday: "long",
      month: "long",
      day: "numeric",
      year: "numeric",
    });

  return (
    <div className="max-w-6xl mx-auto">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6"
      >
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-white">
            Attendance Records
          </h1>
          <p className="text-gray-400 mt-1">
            Pick a date to view who was present or absent
          </p>
        </div>
        <GradientButton size="sm" onClick={exportCSV}>
          <Download className="w-4 h-4" />
          Export CSV
        </GradientButton>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.05 }}
        className="grid grid-cols-1 lg:grid-cols-3 gap-4 mb-6"
      >
        <GlassCard className="lg:col-span-1">
          <div className="flex items-center gap-2 mb-3">
            <CalendarRange className="w-4 h-4 text-indigo-400" />
            <h3 className="text-sm font-semibold text-white">Select Date</h3>
          </div>
          <input
            type="date"
            value={date}
            max={todayISO()}
            onChange={(e) => setDate(e.target.value)}
            className="w-full px-4 py-2.5 rounded-xl bg-white/5 border border-white/10 text-white focus:outline-none focus:border-indigo-500 [color-scheme:dark]"
          />
          <p className="text-xs text-gray-500 mt-2">{formatLongDate(date)}</p>

          {markedDates.length > 0 && (
            <div className="mt-4">
              <p className="text-[10px] uppercase tracking-wider text-gray-500 mb-2">
                Recent days with records
              </p>
              <div className="flex flex-wrap gap-1.5">
                {markedDates.slice(0, 8).map((d) => (
                  <button
                    key={d}
                    onClick={() => setDate(d)}
                    className={`px-2 py-1 rounded-lg text-[11px] font-medium transition-all ${
                      d === date
                        ? "bg-indigo-500 text-white"
                        : "bg-white/5 text-gray-400 hover:bg-white/10"
                    }`}
                  >
                    {new Date(d + "T00:00:00").toLocaleDateString("en-US", {
                      month: "short",
                      day: "numeric",
                    })}
                  </button>
                ))}
              </div>
            </div>
          )}
        </GlassCard>

        <div className="lg:col-span-2 grid grid-cols-3 gap-4">
          <GlassCard className="flex flex-col justify-center">
            <div className="flex items-center gap-2 text-gray-400 text-xs mb-1">
              <Users className="w-3.5 h-3.5" /> Total
            </div>
            <p className="text-2xl font-bold text-white">{records.length}</p>
          </GlassCard>
          <GlassCard className="flex flex-col justify-center">
            <div className="flex items-center gap-2 text-emerald-400 text-xs mb-1">
              <CheckCircle2 className="w-3.5 h-3.5" /> Present
            </div>
            <p className="text-2xl font-bold text-emerald-400">{presentCount}</p>
          </GlassCard>
          <GlassCard className="flex flex-col justify-center">
            <div className="flex items-center gap-2 text-red-400 text-xs mb-1">
              <XCircle className="w-3.5 h-3.5" /> Absent
            </div>
            <p className="text-2xl font-bold text-red-400">{absentCount}</p>
          </GlassCard>
        </div>
      </motion.div>

      <div className="flex flex-col sm:flex-row gap-3 mb-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
          <input
            type="text"
            placeholder="Search by name or roll number..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-white/5 border border-white/10 text-white placeholder-gray-500 focus:outline-none focus:border-indigo-500"
          />
        </div>
        <div className="flex gap-2">
          {(["all", "present", "absent"] as const).map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`px-4 py-2.5 rounded-xl text-sm font-medium capitalize transition-all ${
                filter === f
                  ? "bg-indigo-500 text-white"
                  : "bg-white/5 text-gray-400 hover:bg-white/10"
              }`}
            >
              {f}
            </button>
          ))}
        </div>
      </div>

      <GlassCard className="!p-0 overflow-hidden">
        {loading ? (
          <div className="p-8">
            <LoadingSpinner text="Loading records..." />
          </div>
        ) : filtered.length === 0 ? (
          <div className="p-8 text-center text-gray-400">
            <CalendarDays className="w-12 h-12 mx-auto mb-3 text-gray-600" />
            <p>No matching records for this date</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-white/5">
                  <th className="text-left p-4 text-sm font-medium text-gray-400">
                    Roll Number
                  </th>
                  <th className="text-left p-4 text-sm font-medium text-gray-400">
                    Student Name
                  </th>
                  <th className="text-center p-4 text-sm font-medium text-gray-400">
                    Status
                  </th>
                  <th className="text-left p-4 text-sm font-medium text-gray-400">
                    Time
                  </th>
                </tr>
              </thead>
              <tbody>
                <AnimatePresence mode="popLayout">
                  {filtered.map((r, i) => (
                    <motion.tr
                      key={r.id}
                      layout
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0 }}
                      transition={{ delay: i * 0.02 }}
                      className="border-b border-white/5 hover:bg-white/5 transition-colors"
                    >
                      <td className="p-4 text-sm text-gray-300 font-medium">
                        {r.rollNumber}
                      </td>
                      <td className="p-4 text-sm font-medium text-white">
                        {r.name}
                      </td>
                      <td className="p-4 text-center">
                        {r.status === "Present" ? (
                          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-emerald-500/15 text-emerald-400 border border-emerald-500/20">
                            <CheckCircle2 className="w-3.5 h-3.5" />
                            Present
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-red-500/15 text-red-400 border border-red-500/20">
                            <XCircle className="w-3.5 h-3.5" />
                            Absent
                          </span>
                        )}
                      </td>
                      <td className="p-4 text-sm text-gray-400">
                        {r.time ? (
                          <span className="flex items-center gap-1.5">
                            <Clock className="w-3.5 h-3.5 text-purple-400" />
                            {r.time}
                          </span>
                        ) : (
                          <span className="text-gray-600">—</span>
                        )}
                      </td>
                    </motion.tr>
                  ))}
                </AnimatePresence>
              </tbody>
            </table>
          </div>
        )}
      </GlassCard>
    </div>
  );
}
