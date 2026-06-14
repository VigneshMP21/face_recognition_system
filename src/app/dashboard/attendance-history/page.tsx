"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import {
  CalendarDays,
  Clock,
  CheckCircle2,
  Search,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import GlassCard from "@/components/ui/GlassCard";
import LoadingSpinner from "@/components/ui/LoadingSpinner";

interface AttendanceRecord {
  id: string;
  attendanceDate: string;
  attendanceTime: string;
}

export default function AttendanceHistoryPage() {
  const [records, setRecords] = useState<AttendanceRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [search, setSearch] = useState("");
  const limit = 10;

  useEffect(() => {
    setLoading(true);
    const params = new URLSearchParams({
      page: page.toString(),
      limit: limit.toString(),
      search,
    });
    fetch(`/api/attendance/history?${params}`)
      .then((res) => res.json())
      .then((data) => {
        setRecords(data.records);
        setTotalPages(data.pagination.totalPages);
      })
      .finally(() => setLoading(false));
  }, [page, search]);

  return (
    <div className="max-w-5xl mx-auto">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6"
      >
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-white">
            Attendance History
          </h1>
          <p className="text-gray-400 mt-1">View your attendance records</p>
        </div>
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
          <input
            type="text"
            placeholder="Search..."
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(1);
            }}
            className="pl-10 pr-4 py-2.5 rounded-xl bg-white/5 border border-white/10 text-white placeholder-gray-500 focus:outline-none focus:border-indigo-500 w-full sm:w-64"
          />
        </div>
      </motion.div>

      <GlassCard className="!p-0 overflow-hidden">
        {loading ? (
          <div className="p-8">
            <LoadingSpinner text="Loading records..." />
          </div>
        ) : records.length === 0 ? (
          <div className="p-8 text-center text-gray-400">
            <CalendarDays className="w-12 h-12 mx-auto mb-3 text-gray-600" />
            <p>No attendance records found</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-white/5">
                  <th className="text-left p-4 text-sm font-medium text-gray-400">#</th>
                  <th className="text-left p-4 text-sm font-medium text-gray-400">Date</th>
                  <th className="text-left p-4 text-sm font-medium text-gray-400">Time</th>
                  <th className="text-left p-4 text-sm font-medium text-gray-400">Status</th>
                </tr>
              </thead>
              <tbody>
                {records.map((record, i) => (
                  <motion.tr
                    key={record.id}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: i * 0.03 }}
                    className="border-b border-white/5 hover:bg-white/5 transition-colors"
                  >
                    <td className="p-4 text-sm text-gray-400">
                      {(page - 1) * limit + i + 1}
                    </td>
                    <td className="p-4">
                      <span className="flex items-center gap-2 text-sm text-white">
                        <CalendarDays className="w-4 h-4 text-indigo-400" />
                        {new Date(record.attendanceDate).toLocaleDateString("en-US", {
                          year: "numeric",
                          month: "short",
                          day: "numeric",
                        })}
                      </span>
                    </td>
                    <td className="p-4">
                      <span className="flex items-center gap-2 text-sm text-white">
                        <Clock className="w-4 h-4 text-purple-400" />
                        {record.attendanceTime}
                      </span>
                    </td>
                    <td className="p-4">
                      <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                        <CheckCircle2 className="w-3 h-3" />
                        Present
                      </span>
                    </td>
                  </motion.tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {totalPages > 1 && (
          <div className="flex items-center justify-between p-4 border-t border-white/5">
            <p className="text-sm text-gray-500">
              Page {page} of {totalPages}
            </p>
            <div className="flex gap-2">
              <button
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page === 1}
                className="p-2 rounded-lg hover:bg-white/5 text-gray-400 hover:text-white disabled:opacity-30 disabled:cursor-not-allowed transition-all"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <button
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                disabled={page === totalPages}
                className="p-2 rounded-lg hover:bg-white/5 text-gray-400 hover:text-white disabled:opacity-30 disabled:cursor-not-allowed transition-all"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}
      </GlassCard>
    </div>
  );
}
