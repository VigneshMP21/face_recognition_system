"use client";

import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Mail,
  Phone,
  GraduationCap,
  Shield,
  CalendarDays,
  Camera,
  Edit3,
  Save,
  X,
  Check,
  User,
  Loader2,
  Star,
} from "lucide-react";
import LoadingSpinner from "@/components/ui/LoadingSpinner";

export default function AdminProfilePage() {
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [saveError, setSaveError] = useState("");
  const [profileImage, setProfileImage] = useState<string | null>(null);
  const [editForm, setEditForm] = useState({ name: "", mobile: "" });
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    fetch("/api/auth/user")
      .then((res) => res.json())
      .then((data) => {
        setUser(data.user);
        setEditForm({ name: data.user.name, mobile: data.user.mobile });
        // Load profile image from localStorage
        const savedImage = localStorage.getItem(`profile_image_${data.user.id}`);
        if (savedImage) setProfileImage(savedImage);
      })
      .finally(() => setLoading(false));
  }, []);

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onloadend = () => {
      const base64 = reader.result as string;
      setProfileImage(base64);
      if (user) localStorage.setItem(`profile_image_${user.id}`, base64);
    };
    reader.readAsDataURL(file);
  };

  const handleSave = async () => {
    setSaving(true);
    setSaveError("");
    try {
      const res = await fetch("/api/auth/user", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: editForm.name, mobile: editForm.mobile }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to save");
      setUser((prev: any) => ({ ...prev, name: data.user.name, mobile: data.user.mobile }));
      setEditing(false);
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 3000);
    } catch (err: any) {
      setSaveError(err.message);
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <LoadingSpinner text="Loading profile..." />;
  if (!user) return null;

  const initials = user.name
    .split(" ")
    .map((n: string) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);

  return (
    <div className="max-w-4xl mx-auto px-3 md:px-4">
      {/* Page Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-8"
      >
        <h1 className="text-3xl md:text-4xl font-bold text-white">Admin Profile</h1>
        <p className="text-gray-400 mt-1">Manage your account information</p>
      </motion.div>

      {/* Success Toast */}
      <AnimatePresence>
        {saveSuccess && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="mb-4 flex items-center gap-2 px-4 py-3 rounded-xl bg-emerald-500/20 border border-emerald-500/30 text-emerald-400"
          >
            <Check className="w-4 h-4" />
            <span className="text-sm font-medium">Profile updated successfully!</span>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column — Avatar Card */}
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.1 }}
          className="lg:col-span-1"
        >
          <div className="relative rounded-2xl overflow-hidden border border-white/10"
            style={{ background: "rgba(255,255,255,0.03)" }}>
            {/* Banner */}
            <div className="h-28 bg-gradient-to-br from-indigo-600 via-purple-600 to-cyan-500 relative">
              <div className="absolute inset-0 opacity-30"
                style={{ backgroundImage: "radial-gradient(circle at 20% 50%, rgba(99,102,241,0.4) 0%, transparent 60%), radial-gradient(circle at 80% 20%, rgba(6,182,212,0.4) 0%, transparent 60%)" }} />
            </div>

            {/* Avatar */}
            <div className="flex flex-col items-center pb-6 px-6">
              <div className="relative -mt-12 mb-4">
                <div className="w-24 h-24 rounded-full border-4 border-[#0f0f1a] overflow-hidden">
                  {profileImage ? (
                    <img src={profileImage} alt="Profile" className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full bg-gradient-to-br from-indigo-500 to-cyan-500 flex items-center justify-center">
                      <span className="text-2xl font-bold text-white">{initials}</span>
                    </div>
                  )}
                </div>
                <button
                  onClick={() => fileInputRef.current?.click()}
                  className="absolute bottom-0 right-0 w-8 h-8 rounded-full bg-indigo-500 hover:bg-indigo-400 flex items-center justify-center border-2 border-[#0f0f1a] transition-all hover:scale-110"
                >
                  <Camera className="w-3.5 h-3.5 text-white" />
                </button>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={handleImageUpload}
                />
              </div>

              <h2 className="text-xl font-bold text-white text-center">{user.name}</h2>
              <div className="flex items-center gap-2 mt-2">
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-indigo-500/20 border border-indigo-500/30 text-indigo-300 capitalize">
                  <Shield className="w-3 h-3" />
                  {user.role}
                </span>
              </div>

              <div className="w-full mt-5 pt-5 border-t border-white/5 space-y-3 text-sm">
                <div className="flex items-center gap-3 text-gray-400">
                  <GraduationCap className="w-4 h-4 text-indigo-400 flex-shrink-0" />
                  <span className="text-white font-medium">{user.rollNumber}</span>
                </div>
                <div className="flex items-center gap-3 text-gray-400">
                  <CalendarDays className="w-4 h-4 text-amber-400 flex-shrink-0" />
                  <span>
                    {new Date(user.createdAt).toLocaleDateString("en-US", {
                      month: "short",
                      year: "numeric",
                    })}
                  </span>
                </div>
              </div>

              <p className="text-xs text-gray-600 mt-4 text-center">
                Click the camera icon to update photo
              </p>
            </div>
          </div>
        </motion.div>

        {/* Right Column — Info + Edit */}
        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.15 }}
          className="lg:col-span-2 space-y-6"
        >
          {/* Personal Information Card */}
          <div className="rounded-2xl border border-white/10 overflow-hidden"
            style={{ background: "rgba(255,255,255,0.03)" }}>
            <div className="flex items-center justify-between px-6 py-4 border-b border-white/5">
              <div className="flex items-center gap-2">
                <User className="w-4 h-4 text-indigo-400" />
                <h3 className="text-sm font-semibold text-white">Personal Information</h3>
              </div>
              {!editing ? (
                <button
                  onClick={() => { setEditing(true); setSaveError(""); }}
                  className="flex items-center gap-2 px-4 py-1.5 rounded-lg bg-indigo-500/10 hover:bg-indigo-500/20 border border-indigo-500/20 text-indigo-400 text-xs font-medium transition-all"
                >
                  <Edit3 className="w-3.5 h-3.5" />
                  Edit Profile
                </button>
              ) : (
                <div className="flex gap-2">
                  <button
                    onClick={() => { setEditing(false); setEditForm({ name: user.name, mobile: user.mobile }); setSaveError(""); }}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-gray-400 text-xs font-medium transition-all"
                  >
                    <X className="w-3.5 h-3.5" />
                    Cancel
                  </button>
                  <button
                    onClick={handleSave}
                    disabled={saving}
                    className="flex items-center gap-1.5 px-4 py-1.5 rounded-lg bg-indigo-500 hover:bg-indigo-400 text-white text-xs font-medium transition-all disabled:opacity-50"
                  >
                    {saving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Save className="w-3.5 h-3.5" />}
                    {saving ? "Saving..." : "Save Changes"}
                  </button>
                </div>
              )}
            </div>

            <div className="p-6 grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Name */}
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-gray-500 uppercase tracking-wider">Full Name</label>
                {editing ? (
                  <input
                    type="text"
                    value={editForm.name}
                    onChange={(e) => setEditForm((f) => ({ ...f, name: e.target.value }))}
                    className="w-full px-4 py-2.5 rounded-xl bg-white/5 border border-indigo-500/40 text-white text-sm focus:outline-none focus:border-indigo-400 transition-all"
                  />
                ) : (
                  <div className="flex items-center gap-3 px-4 py-2.5 rounded-xl bg-white/5">
                    <User className="w-4 h-4 text-indigo-400 flex-shrink-0" />
                    <span className="text-white text-sm font-medium">{user.name}</span>
                  </div>
                )}
              </div>

              {/* Mobile */}
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-gray-500 uppercase tracking-wider">Mobile Number</label>
                {editing ? (
                  <input
                    type="tel"
                    value={editForm.mobile}
                    onChange={(e) => setEditForm((f) => ({ ...f, mobile: e.target.value }))}
                    className="w-full px-4 py-2.5 rounded-xl bg-white/5 border border-indigo-500/40 text-white text-sm focus:outline-none focus:border-indigo-400 transition-all"
                  />
                ) : (
                  <div className="flex items-center gap-3 px-4 py-2.5 rounded-xl bg-white/5">
                    <Phone className="w-4 h-4 text-cyan-400 flex-shrink-0" />
                    <span className="text-white text-sm font-medium">{user.mobile}</span>
                  </div>
                )}
              </div>

              {/* Email — read-only */}
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-gray-500 uppercase tracking-wider">Email Address</label>
                <div className="flex items-center gap-3 px-4 py-2.5 rounded-xl bg-white/5">
                  <Mail className="w-4 h-4 text-purple-400 flex-shrink-0" />
                  <span className="text-white text-sm font-medium">{user.email}</span>
                </div>
              </div>

              {/* Roll Number — read-only */}
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-gray-500 uppercase tracking-wider">Roll Number</label>
                <div className="flex items-center gap-3 px-4 py-2.5 rounded-xl bg-white/5">
                  <GraduationCap className="w-4 h-4 text-indigo-400 flex-shrink-0" />
                  <span className="text-white text-sm font-medium">{user.rollNumber}</span>
                </div>
              </div>
            </div>

            {saveError && (
              <div className="mx-6 mb-4 px-4 py-2.5 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-sm">
                {saveError}
              </div>
            )}
          </div>

          {/* Account Details Card */}
          <div className="rounded-2xl border border-white/10 overflow-hidden"
            style={{ background: "rgba(255,255,255,0.03)" }}>
            <div className="flex items-center gap-2 px-6 py-4 border-b border-white/5">
              <Star className="w-4 h-4 text-amber-400" />
              <h3 className="text-sm font-semibold text-white">Account Details</h3>
            </div>
            <div className="p-6 grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="text-center p-4 rounded-xl bg-indigo-500/10 border border-indigo-500/20">
                <p className="text-xs text-gray-500 mb-1">Role</p>
                <p className="text-indigo-300 font-semibold capitalize">{user.role}</p>
              </div>
              <div className="text-center p-4 rounded-xl bg-purple-500/10 border border-purple-500/20">
                <p className="text-xs text-gray-500 mb-1">Member Since</p>
                <p className="text-purple-300 font-semibold text-sm">
                  {new Date(user.createdAt).toLocaleDateString("en-US", { month: "short", year: "numeric" })}
                </p>
              </div>
              <div className="text-center p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/20">
                <p className="text-xs text-gray-500 mb-1">Status</p>
                <p className="text-emerald-300 font-semibold">Active</p>
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
