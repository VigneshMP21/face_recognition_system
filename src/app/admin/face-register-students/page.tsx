"use client";

import { useState, useEffect, useCallback } from "react";
import { motion } from "framer-motion";
import {
  Search,
  ScanFace,
  CheckCircle2,
  XCircle,
  Users,
} from "lucide-react";
import GlassCard from "@/components/ui/GlassCard";
import LoadingSpinner from "@/components/ui/LoadingSpinner";

interface FaceStudent {
  id: string;
  name: string;
  rollNumber: string;
  faceRegistered: boolean;
}

export default function FaceRegisterStudentsPage() {
  const [students, setStudents] = useState<FaceStudent[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState<"all" | "registered" | "pending">("all");

  const fetchStudents = useCallback(() => {
    setLoading(true);
    fetch("/api/admin/face-register-students")
      .then((res) => res.json())
      .then((data) => setStudents(data.students || []))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    fetchStudents();
  }, [fetchStudents]);

  const filtered = students.filter((s) => {
    const matchesSearch =
      s.name.toLowerCase().includes(search.toLowerCase()) ||
      s.rollNumber.toLowerCase().includes(search.toLowerCase());
    const matchesFilter =
      filter === "all" ||
      (filter === "registered" && s.faceRegistered) ||
      (filter === "pending" && !s.faceRegistered);
    return matchesSearch && matchesFilter;
  });

  const registeredCount = students.filter((s) => s.faceRegistered).length;
  const pendingCount = students.length - registeredCount;

  return (
    <div className="max-w-6xl mx-auto px-3 md:px-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-6"
      >
        <h1 className="text-2xl md:text-3xl font-bold text-white">
          Face Registration Status
        </h1>
        <p className="text-gray-400 mt-1">
          Track which students have completed their face registration
        </p>
      </motion.div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
        {[
          {
            label: "Total Students",
            value: students.length,
            icon: Users,
            color: "from-indigo-500 to-purple-500",
          },
          {
            label: "Registered",
            value: registeredCount,
            icon: CheckCircle2,
            color: "from-emerald-500 to-teal-500",
          },
          {
            label: "Pending",
            value: pendingCount,
            icon: XCircle,
            color: "from-amber-500 to-orange-500",
          },
        ].map((stat, i) => (
          <motion.div
            key={stat.label}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.05 }}
          >
            <GlassCard>
              <div className="flex items-center gap-4">
                <div
                  className={`w-12 h-12 rounded-xl bg-gradient-to-br ${stat.color} flex items-center justify-center`}
                >
                  <stat.icon className="w-6 h-6 text-white" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-white">{stat.value}</p>
                  <p className="text-sm text-gray-400">{stat.label}</p>
                </div>
              </div>
            </GlassCard>
          </motion.div>
        ))}
      </div>

      {/* Controls */}
      <div className="flex flex-col sm:flex-row gap-3 mb-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
          <input
            type="text"
            placeholder="Search by name or roll number..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-10 pr-4 py-2.5 rounded-xl bg-white/5 border border-white/10 text-white placeholder-gray-500 focus:outline-none focus:border-indigo-500 w-full"
          />
        </div>
        <div className="flex gap-2">
          {(["all", "registered", "pending"] as const).map((f) => (
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
            <LoadingSpinner text="Loading students..." />
          </div>
        ) : filtered.length === 0 ? (
          <div className="p-8 text-center text-gray-400">
            <ScanFace className="w-12 h-12 mx-auto mb-3 text-gray-600" />
            <p>No students found</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-white/5">
                  <th className="text-left p-4 text-sm font-medium text-gray-400">
                    Name
                  </th>
                  <th className="text-left p-4 text-sm font-medium text-gray-400">
                    Roll Number
                  </th>
                  <th className="text-center p-4 text-sm font-medium text-gray-400">
                    Face Status
                  </th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((student, i) => (
                  <motion.tr
                    key={student.id}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: i * 0.03 }}
                    className="border-b border-white/5 hover:bg-white/5 transition-colors"
                  >
                    <td className="p-4">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-indigo-500 to-purple-500 flex items-center justify-center text-xs font-bold text-white">
                          {student.name
                            .split(" ")
                            .map((n) => n[0])
                            .join("")
                            .toUpperCase()
                            .slice(0, 2)}
                        </div>
                        <span className="text-sm font-medium text-white">
                          {student.name}
                        </span>
                      </div>
                    </td>
                    <td className="p-4 text-sm text-gray-300">
                      {student.rollNumber}
                    </td>
                    <td className="p-4 text-center">
                      {student.faceRegistered ? (
                        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium bg-emerald-500/15 text-emerald-400">
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          Registered
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium bg-amber-500/15 text-amber-400">
                          <XCircle className="w-3.5 h-3.5" />
                          Pending
                        </span>
                      )}
                    </td>
                  </motion.tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </GlassCard>
    </div>
  );
}
