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
  FileSpreadsheet,
  TrendingUp,
  PieChart,
} from "lucide-react";
import GlassCard from "@/components/ui/GlassCard";
import GradientButton from "@/components/ui/GradientButton";
import LoadingSpinner from "@/components/ui/LoadingSpinner";
import {
  PieChart as RechartsPieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
} from "recharts";

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
  const totalCount = records.length;
  const attendanceRate = totalCount > 0 ? Math.round((presentCount / totalCount) * 100) : 0;

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

  // Chart data
  const pieChartData = [
    { name: "Present", value: presentCount, color: "#10b981" },
    { name: "Absent", value: absentCount, color: "#ef4444" },
  ];

  const statusBarData = [
    { name: "Present", count: presentCount, fill: "#10b981" },
    { name: "Absent", count: absentCount, fill: "#ef4444" },
  ];

  const formatLongDate = (d: string) =>
    new Date(d + "T00:00:00").toLocaleDateString("en-US", {
      weekday: "long",
      month: "long",
      day: "numeric",
      year: "numeric",
    });

  const exportCSV = () => {
    const present = filtered.filter((r) => r.status === "Present").length;
    const absent = filtered.length - present;
    const rate = filtered.length
      ? Math.round((present / filtered.length) * 100)
      : 0;

    const rowsHtml = filtered
      .map((r, i) => {
        const zebra = i % 2 === 0 ? "#ffffff" : "#f8fafc";
        const isPresent = r.status === "Present";
        const statusBg = isPresent ? "#d1fae5" : "#fee2e2";
        const statusColor = isPresent ? "#059669" : "#dc2626";
        return `
          <tr style="background:${zebra};">
            <td style="padding:12px 16px;border:1px solid #e2e8f0;font-weight:600;color:#1e293b;">${r.rollNumber}</td>
            <td style="padding:12px 16px;border:1px solid #e2e8f0;color:#334155;font-weight:500;">${r.name}</td>
            <td style="padding:12px 16px;border:1px solid #e2e8f0;text-align:center;">
              <span style="display:inline-block;padding:4px 14px;border-radius:20px;background:${statusBg};color:${statusColor};font-weight:700;font-size:12px;text-transform:uppercase;">${r.status}</span>
            </td>
            <td style="padding:12px 16px;border:1px solid #e2e8f0;color:#64748b;font-weight:500;">${r.time || "—"}</td>
          </tr>`;
      })
      .join("");

    const html = `
      <html xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:x="urn:schemas-microsoft-com:office:excel" xmlns="http://www.w3.org/TR/REC-html40">
      <head><meta charset="utf-8" /></head>
      <body style="font-family:Segoe UI, Arial, sans-serif;background:#f1f5f9;">
        <div style="max-width:900px;margin:0 auto;background:#ffffff;border-radius:12px;overflow:hidden;box-shadow:0 4px 20px rgba(0,0,0,0.08);">
          <!-- Header -->
          <div style="background:linear-gradient(135deg,#6366f1,#8b5cf6,#06b6d4);padding:28px 24px;">
            <div style="display:flex;align-items:center;gap:12px;">
              <div style="width:48px;height:48px;background:rgba(255,255,255,0.2);border-radius:12px;display:flex;align-items:center;justify-content:center;">
                <span style="font-size:24px;">📋</span>
              </div>
              <div>
                <div style="font-size:22px;font-weight:800;color:#ffffff;">SMART ATTENDANCE REPORT</div>
                <div style="font-size:13px;color:rgba(255,255,255,0.85);margin-top:2px;">${formatLongDate(date)}</div>
              </div>
            </div>
          </div>

          <!-- Summary Stats -->
          <table style="border-collapse:collapse;width:100%;margin-top:0;">
            <tr>
              <td style="padding:20px 24px;background:#f8fafc;border-bottom:2px solid #e2e8f0;">
                <div style="display:flex;align-items:center;gap:10px;">
                  <div style="width:40px;height:40px;background:linear-gradient(135deg,#6366f1,#8b5cf6);border-radius:10px;display:flex;align-items:center;justify-content:center;">
                    <span style="font-size:18px;">👥</span>
                  </div>
                  <div>
                    <div style="font-size:11px;color:#64748b;text-transform:uppercase;font-weight:600;">Total Students</div>
                    <div style="font-size:24px;font-bold;color:#1e293b;">${filtered.length}</div>
                  </div>
                </div>
              </td>
              <td style="padding:20px 24px;background:#f0fdf4;border-bottom:2px solid #bbf7d0;">
                <div style="display:flex;align-items:center;gap:10px;">
                  <div style="width:40px;height:40px;background:linear-gradient(135deg,#10b981,#34d399);border-radius:10px;display:flex;align-items:center;justify-content:center;">
                    <span style="font-size:18px;">✅</span>
                  </div>
                  <div>
                    <div style="font-size:11px;color:#047857;text-transform:uppercase;font-weight:600;">Present</div>
                    <div style="font-size:24px;font-bold;color:#15803d;">${present}</div>
                  </div>
                </div>
              </td>
              <td style="padding:20px 24px;background:#fef2f2;border-bottom:2px solid #fecaca;">
                <div style="display:flex;align-items:center;gap:10px;">
                  <div style="width:40px;height:40px;background:linear-gradient(135deg,#ef4444,#f87171);border-radius:10px;display:flex;align-items:center;justify-content:center;">
                    <span style="font-size:18px;">❌</span>
                  </div>
                  <div>
                    <div style="font-size:11px;color:#b91c1c;text-transform:uppercase;font-weight:600;">Absent</div>
                    <div style="font-size:24px;font-bold;color:#dc2626;">${absent}</div>
                  </div>
                </div>
              </td>
              <td style="padding:20px 24px;background:#fffbeb;border-bottom:2px solid #fed7aa;">
                <div style="display:flex;align-items:center;gap:10px;">
                  <div style="width:40px;height:40px;background:linear-gradient(135deg,#f59e0b,#fbbf24);border-radius:10px;display:flex;align-items:center;justify-content:center;">
                    <span style="font-size:18px;">📊</span>
                  </div>
                  <div>
                    <div style="font-size:11px;color:#b45309;text-transform:uppercase;font-weight:600;">Attendance Rate</div>
                    <div style="font-size:24px;font-bold;color:#d97706;">${rate}%</div>
                  </div>
                </div>
              </td>
            </tr>
          </table>

          <!-- Table -->
          <table style="border-collapse:collapse;width:100%;">
            <tr>
              <th style="padding:14px 16px;background:#1e293b;color:#ffffff;text-align:left;border:1px solid #0f172a;font-size:12px;text-transform:uppercase;letter-spacing:0.5px;">Roll Number</th>
              <th style="padding:14px 16px;background:#1e293b;color:#ffffff;text-align:left;border:1px solid #0f172a;font-size:12px;text-transform:uppercase;letter-spacing:0.5px;">Student Name</th>
              <th style="padding:14px 16px;background:#1e293b;color:#ffffff;text-align:center;border:1px solid #0f172a;font-size:12px;text-transform:uppercase;letter-spacing:0.5px;">Status</th>
              <th style="padding:14px 16px;background:#1e293b;color:#ffffff;text-align:left;border:1px solid #0f172a;font-size:12px;text-transform:uppercase;letter-spacing:0.5px;">Time</th>
            </tr>
            ${rowsHtml}
          </table>

          <!-- Footer -->
          <div style="padding:16px 24px;background:#f8fafc;border-top:1px solid #e2e8f0;text-align:center;">
            <p style="font-size:11px;color:#94a3b8;margin:0;">
              Generated by <strong>Smart Attendance System</strong> on ${new Date().toLocaleString()}
            </p>
          </div>
        </div>
      </body>
      </html>`;

    const blob = new Blob([html], { type: "application/vnd.ms-excel" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `Smart_Attendance_Report_${date}.xls`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="max-w-6xl mx-auto px-3 md:px-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6"
      >
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-white flex items-center gap-3">
            <FileSpreadsheet className="w-7 h-7 text-indigo-400" />
            Attendance Records
          </h1>
          <p className="text-gray-400 mt-1">
            Pick a date to view who was present or absent
          </p>
        </div>
        <GradientButton size="sm" onClick={exportCSV}>
          <Download className="w-4 h-4" />
          Export Report
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
            <div className="flex items-center gap-2 text-indigo-400 text-xs mb-1">
              <Users className="w-3.5 h-3.5" /> Total
            </div>
            <p className="text-2xl font-bold text-white">{totalCount}</p>
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

      {/* Table Header */}
      <div className="mb-3 px-1 flex items-center justify-between">
        <h2 className="text-lg font-semibold text-white flex items-center gap-2">
          <TrendingUp className="w-5 h-5 text-indigo-400" />
          Attendance Report
        </h2>
        <span className="text-sm text-gray-400">
          {filtered.length} record{filtered.length !== 1 ? "s" : ""} found
        </span>
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
                <tr className="bg-gradient-to-r from-indigo-600 to-purple-600">
                  <th className="text-left p-4 text-sm font-bold text-white">
                    Roll Number
                  </th>
                  <th className="text-left p-4 text-sm font-bold text-white">
                    Student Name
                  </th>
                  <th className="text-center p-4 text-sm font-bold text-white">
                    Status
                  </th>
                  <th className="text-left p-4 text-sm font-bold text-white">
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

      {/* Analysis Charts Section */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="mt-8"
      >
        <h2 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
          <PieChart className="w-5 h-5 text-indigo-400" />
          Analysis & Insights
        </h2>

        <div className="grid md:grid-cols-2 gap-6">
          {/* Pie Chart */}
          <GlassCard className="!p-5 md:!p-6">
            <h3 className="text-base font-semibold text-white mb-4 flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-indigo-400"></span>
              Attendance Distribution
            </h3>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <RechartsPieChart>
                  <Pie
                    data={pieChartData}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={90}
                    paddingAngle={5}
                    dataKey="value"
                    label={({ name, percent }) => `${name} ${((percent || 0) * 100).toFixed(0)}%`}
                    labelLine={false}
                  >
                    {pieChartData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "#1e293b",
                      border: "1px solid #334155",
                      borderRadius: "8px",
                    }}
                    labelStyle={{ color: "#fff" }}
                  />
                </RechartsPieChart>
              </ResponsiveContainer>
            </div>
            <div className="flex justify-center gap-6 mt-2">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-emerald-500"></div>
                <span className="text-sm text-gray-400">Present ({presentCount})</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-red-500"></div>
                <span className="text-sm text-gray-400">Absent ({absentCount})</span>
              </div>
            </div>
          </GlassCard>

          {/* Bar Chart */}
          <GlassCard className="!p-5 md:!p-6">
            <h3 className="text-base font-semibold text-white mb-4 flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-purple-400"></span>
              Attendance Overview
            </h3>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={statusBarData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" vertical={false} />
                  <XAxis
                    dataKey="name"
                    tick={{ fill: "#9ca3af", fontSize: 12 }}
                    axisLine={{ stroke: "rgba(255,255,255,0.1)" }}
                    tickLine={false}
                  />
                  <YAxis
                    tick={{ fill: "#9ca3af", fontSize: 12 }}
                    axisLine={{ stroke: "rgba(255,255,255,0.1)" }}
                    tickLine={false}
                  />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "#1e293b",
                      border: "1px solid #334155",
                      borderRadius: "8px",
                    }}
                    labelStyle={{ color: "#fff" }}
                  />
                  <Bar dataKey="count" radius={[6, 6, 0, 0]} name="Count">
                    {statusBarData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.fill} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
            <div className="text-center mt-2">
              <span className="text-lg font-bold text-indigo-400">{attendanceRate}%</span>
              <span className="text-sm text-gray-400 ml-2">Attendance Rate</span>
            </div>
          </GlassCard>
        </div>
      </motion.div>
    </div>
  );
}