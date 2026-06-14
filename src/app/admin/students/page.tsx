"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import {
  Search,
  ChevronLeft,
  ChevronRight,
  Mail,
  Phone,
  GraduationCap,
  CalendarDays,
} from "lucide-react";
import GlassCard from "@/components/ui/GlassCard";
import LoadingSpinner from "@/components/ui/LoadingSpinner";

interface Student {
  id: string;
  name: string;
  rollNumber: string;
  email: string;
  mobile: string;
  role: string;
  createdAt: string;
}

export default function AdminStudentsPage() {
  const [students, setStudents] = useState<Student[]>([]);
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
    fetch(`/api/students?${params}`)
      .then((res) => res.json())
      .then((data) => {
        setStudents(data.students);
        setTotalPages(data.pagination.totalPages);
      })
      .finally(() => setLoading(false));
  }, [page, search]);

  return (
    <div className="max-w-6xl mx-auto">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6"
      >
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-white">
            Student Management
          </h1>
          <p className="text-gray-400 mt-1">
            View and manage all registered students
          </p>
        </div>
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
          <input
            type="text"
            placeholder="Search by name or roll number..."
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(1);
            }}
            className="pl-10 pr-4 py-2.5 rounded-xl bg-white/5 border border-white/10 text-white placeholder-gray-500 focus:outline-none focus:border-indigo-500 w-full sm:w-72"
          />
        </div>
      </motion.div>

      <GlassCard className="!p-0 overflow-hidden">
        {loading ? (
          <div className="p-8">
            <LoadingSpinner text="Loading students..." />
          </div>
        ) : students.length === 0 ? (
          <div className="p-8 text-center text-gray-400">
            <GraduationCap className="w-12 h-12 mx-auto mb-3 text-gray-600" />
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
                  <th className="text-left p-4 text-sm font-medium text-gray-400 hidden md:table-cell">
                    Email
                  </th>
                  <th className="text-left p-4 text-sm font-medium text-gray-400 hidden lg:table-cell">
                    Mobile
                  </th>
                  <th className="text-left p-4 text-sm font-medium text-gray-400 hidden lg:table-cell">
                    Joined
                  </th>
                </tr>
              </thead>
              <tbody>
                {students.map((student, i) => (
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
                    <td className="p-4 text-sm text-gray-400 hidden md:table-cell">
                      <span className="flex items-center gap-1.5">
                        <Mail className="w-3.5 h-3.5 text-purple-400" />
                        {student.email}
                      </span>
                    </td>
                    <td className="p-4 text-sm text-gray-400 hidden lg:table-cell">
                      <span className="flex items-center gap-1.5">
                        <Phone className="w-3.5 h-3.5 text-cyan-400" />
                        {student.mobile}
                      </span>
                    </td>
                    <td className="p-4 text-sm text-gray-400 hidden lg:table-cell">
                      <span className="flex items-center gap-1.5">
                        <CalendarDays className="w-3.5 h-3.5 text-amber-400" />
                        {new Date(student.createdAt).toLocaleDateString()}
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
