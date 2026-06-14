"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import {
  Mail,
  Phone,
  GraduationCap,
  Shield,
  CalendarDays,
} from "lucide-react";
import GlassCard from "@/components/ui/GlassCard";
import LoadingSpinner from "@/components/ui/LoadingSpinner";

export default function AdminProfilePage() {
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/auth/user")
      .then((res) => res.json())
      .then((data) => setUser(data.user))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <LoadingSpinner text="Loading profile..." />;
  if (!user) return null;

  return (
    <div className="max-w-3xl mx-auto">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <h1 className="text-2xl md:text-3xl font-bold text-white mb-6">
          Admin Profile
        </h1>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
      >
        <GlassCard glow="indigo" className="!p-0 overflow-hidden">
          <div className="bg-gradient-to-r from-indigo-500/20 via-purple-500/20 to-cyan-500/20 p-8 text-center">
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ type: "spring", stiffness: 200, delay: 0.2 }}
              className="w-20 h-20 rounded-2xl bg-gradient-to-br from-indigo-500 to-cyan-500 flex items-center justify-center mx-auto mb-4"
            >
              <span className="text-3xl font-bold text-white">
                {user.name
                  .split(" ")
                  .map((n: string) => n[0])
                  .join("")
                  .toUpperCase()
                  .slice(0, 2)}
              </span>
            </motion.div>
            <h2 className="text-2xl font-bold text-white">{user.name}</h2>
            <p className="text-indigo-300 text-sm mt-1 capitalize">{user.role}</p>
          </div>

          <div className="p-6 space-y-4">
            <div className="flex items-center gap-4 p-4 rounded-xl bg-white/5">
              <GraduationCap className="w-5 h-5 text-indigo-400" />
              <div>
                <p className="text-xs text-gray-500">Roll Number</p>
                <p className="text-white font-medium">{user.rollNumber}</p>
              </div>
            </div>
            <div className="flex items-center gap-4 p-4 rounded-xl bg-white/5">
              <Mail className="w-5 h-5 text-purple-400" />
              <div>
                <p className="text-xs text-gray-500">Email</p>
                <p className="text-white font-medium">{user.email}</p>
              </div>
            </div>
            <div className="flex items-center gap-4 p-4 rounded-xl bg-white/5">
              <Phone className="w-5 h-5 text-cyan-400" />
              <div>
                <p className="text-xs text-gray-500">Mobile</p>
                <p className="text-white font-medium">{user.mobile}</p>
              </div>
            </div>
            <div className="flex items-center gap-4 p-4 rounded-xl bg-white/5">
              <Shield className="w-5 h-5 text-emerald-400" />
              <div>
                <p className="text-xs text-gray-500">Role</p>
                <p className="text-white font-medium capitalize">{user.role}</p>
              </div>
            </div>
            <div className="flex items-center gap-4 p-4 rounded-xl bg-white/5">
              <CalendarDays className="w-5 h-5 text-amber-400" />
              <div>
                <p className="text-xs text-gray-500">Member Since</p>
                <p className="text-white font-medium">
                  {new Date(user.createdAt).toLocaleDateString("en-US", {
                    year: "numeric",
                    month: "long",
                    day: "numeric",
                  })}
                </p>
              </div>
            </div>
          </div>
        </GlassCard>
      </motion.div>
    </div>
  );
}
