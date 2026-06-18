"use client";

import { useState, Suspense } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { Eye, EyeOff, ArrowLeft } from "lucide-react";
import Link from "next/link";
import GlassCard from "@/components/ui/GlassCard";
import GradientButton from "@/components/ui/GradientButton";
import InputField from "@/components/ui/InputField";

type Stage = "email" | "otp" | "reset";

function ForgotPasswordForm() {
  const router = useRouter();
  const [stage, setStage] = useState<Stage>("email");
  const [resetEmail, setResetEmail] = useState("");
  const [otp, setOtp] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [successMsg, setSuccessMsg] = useState("");

  const handleSendOTP = async () => {
    if (!resetEmail) return setError("Email is required");
    setLoading(true);
    setError("");
    setSuccessMsg("");
    try {
      const res = await fetch("/api/auth/forgot-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: resetEmail }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Failed to send OTP");
        return;
      }
      setSuccessMsg("OTP sent to your email");
      setStage("otp");
    } catch {
      setError("Something went wrong");
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOTP = async () => {
    if (!otp || otp.length !== 6) return setError("Enter valid 6-digit OTP");
    setLoading(true);
    setError("");
    setSuccessMsg("");
    try {
      const res = await fetch("/api/auth/verify-otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: resetEmail, otp }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Invalid OTP");
        return;
      }
      setSuccessMsg("OTP verified");
      setStage("reset");
    } catch {
      setError("Something went wrong");
    } finally {
      setLoading(false);
    }
  };

  const handleResetPassword = async () => {
    if (!newPassword || newPassword.length < 6) {
      return setError("Password must be at least 6 characters");
    }
    if (newPassword !== confirmPassword) {
      return setError("Passwords do not match");
    }
    setLoading(true);
    setError("");
    setSuccessMsg("");
    try {
      const res = await fetch("/api/auth/reset-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: resetEmail, newPassword }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Failed to reset password");
        return;
      }
      setSuccessMsg("Password reset successful! Redirecting to login...");
      setTimeout(() => router.push("/login"), 2000);
    } catch {
      setError("Something went wrong");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-md"
      >
        <GlassCard glow="indigo" className="!p-6 md:!p-8 auth-card">
          <div className="text-center mb-5 md:mb-6">
            <Link
              href="/login"
              className="inline-flex items-center gap-1.5 text-gray-400 hover:text-white mb-4 md:mb-5 transition-colors text-sm"
            >
              <ArrowLeft className="w-3.5 h-3.5 md:w-4 md:h-4" />
              <span className="hidden sm:inline">Back to Login</span>
              <span className="sm:hidden">Back</span>
            </Link>
            <div className="logo-wrapper w-12 h-12 md:w-14 md:h-14 rounded-2xl bg-white/10 flex items-center justify-center mx-auto mb-3 md:mb-4 shadow-lg shadow-indigo-500/20">
              <img
                src="/smart_attendance.png"
                alt="Smart Attendance Logo"
                className="w-full h-full object-contain rounded-2xl"
              />
            </div>
            <h1 className="text-xl md:text-2xl font-bold text-white">Reset Password</h1>
            <p className="text-xs md:text-sm text-gray-400 mt-1.5">
              {stage === "email" && "Enter your email to receive an OTP"}
              {stage === "otp" && "Verify the OTP sent to your email"}
              {stage === "reset" && "Create a new password"}
            </p>
          </div>

          {successMsg && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-emerald-500/10 border border-emerald-500/20 rounded-xl p-3 mb-4 text-xs md:text-sm text-emerald-400 text-center"
            >
              {successMsg}
            </motion.div>
          )}

          {error && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-red-500/10 border border-red-500/20 rounded-xl p-3 mb-4 text-xs md:text-sm text-red-400 text-center"
            >
              {error}
            </motion.div>
          )}

          <div className="space-y-4">
            {stage === "email" && (
              <>
                <InputField
                  label="Email"
                  type="email"
                  placeholder="Enter your registered email"
                  value={resetEmail}
                  onChange={(e) => setResetEmail(e.target.value)}
                />
                <GradientButton
                  onClick={handleSendOTP}
                  loading={loading}
                  disabled={loading}
                  className="w-full shadow-lg shadow-indigo-500/20"
                >
                  {loading ? "Sending..." : "Send OTP"}
                </GradientButton>
              </>
            )}

            {stage === "otp" && (
              <>
                <div className="text-xs text-gray-400 text-center">
                  OTP sent to: <span className="text-white font-medium">{resetEmail}</span>
                </div>
                <InputField
                  label="OTP"
                  placeholder="Enter 6-digit OTP"
                  value={otp}
                  onChange={(e) => setOtp(e.target.value.replace(/\D/g, "").slice(0, 6))}
                  maxLength={6}
                />
                <GradientButton
                  onClick={handleVerifyOTP}
                  loading={loading}
                  disabled={loading}
                  className="w-full shadow-lg shadow-indigo-500/20"
                >
                  {loading ? "Verifying..." : "Verify OTP"}
                </GradientButton>
                <button
                  onClick={() => {
                    setStage("email");
                    setOtp("");
                    setError("");
                    setSuccessMsg("");
                  }}
                  className="text-xs text-gray-400 hover:text-white transition-colors w-full"
                >
                  Back to Email
                </button>
              </>
            )}

            {stage === "reset" && (
              <>
                <div className="relative">
                  <InputField
                    label="New Password"
                    type={showNewPassword ? "text" : "password"}
                    placeholder="Enter new password"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                  />
                  <button
                    type="button"
                    onClick={() => setShowNewPassword(!showNewPassword)}
                    className="absolute right-3 top-[36px] md:top-[38px] text-gray-400 hover:text-white transition-colors p-1"
                  >
                    {showNewPassword ? (
                      <EyeOff className="w-4 h-4" />
                    ) : (
                      <Eye className="w-4 h-4" />
                    )}
                  </button>
                </div>
                <InputField
                  label="Confirm Password"
                  type="password"
                  placeholder="Confirm new password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                />
                <GradientButton
                  onClick={handleResetPassword}
                  loading={loading}
                  disabled={loading}
                  className="w-full shadow-lg shadow-indigo-500/20"
                >
                  {loading ? "Resetting..." : "Reset Password"}
                </GradientButton>
                <button
                  onClick={() => {
                    setStage("otp");
                    setError("");
                    setSuccessMsg("");
                  }}
                  className="text-xs text-gray-400 hover:text-white transition-colors w-full"
                >
                  Back to OTP
                </button>
              </>
            )}
          </div>
        </GlassCard>
      </motion.div>
    </div>
  );
}

export default function ForgotPasswordPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center">
          <div className="w-8 h-8 border-4 border-indigo-500/20 border-t-indigo-500 rounded-full animate-spin" />
        </div>
      }
    >
      <ForgotPasswordForm />
    </Suspense>
  );
}
