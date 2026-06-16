"use client";

import { useState, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { motion } from "framer-motion";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { Eye, EyeOff, ArrowLeft } from "lucide-react";
import Link from "next/link";
import GlassCard from "@/components/ui/GlassCard";
import GradientButton from "@/components/ui/GradientButton";
import InputField from "@/components/ui/InputField";

const loginSchema = z.object({
  identifier: z.string().min(1, "Email or Roll Number is required"),
  password: z.string().min(1, "Password is required"),
});

type LoginForm = z.infer<typeof loginSchema>;

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [successMsg, setSuccessMsg] = useState("");

  useEffect(() => {
    if (searchParams.get("registered") === "true") {
      setSuccessMsg("Account created successfully! Please sign in.");
    }
  }, [searchParams]);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginForm>({
    resolver: zodResolver(loginSchema),
  });

  const onSubmit = async (data: LoginForm) => {
    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      const result = await res.json();
      if (!res.ok) {
        setError(result.error || "Invalid credentials");
        return;
      }
      if (result.user.role === "admin") {
        router.push("/admin");
      } else {
        router.push("/dashboard");
      }
    } catch {
      setError("Something went wrong. Please try again.");
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
              href="/"
              className="inline-flex items-center gap-1.5 text-gray-400 hover:text-white mb-4 md:mb-5 transition-colors text-sm"
            >
              <ArrowLeft className="w-3.5 h-3.5 md:w-4 md:h-4" />
              <span className="hidden sm:inline">Back to Home</span>
              <span className="sm:hidden">Back</span>
            </Link>
            <div className="logo-wrapper w-12 h-12 md:w-14 md:h-14 rounded-2xl bg-white/10 flex items-center justify-center mx-auto mb-3 md:mb-4 shadow-lg shadow-indigo-500/20">
              <img
                src="/smart_attendance.png"
                alt="Smart Attendance Logo"
                className="w-full h-full object-contain rounded-2xl"
              />
            </div>
            <h1 className="text-xl md:text-2xl font-bold text-white">Welcome Back</h1>
            <p className="text-xs md:text-sm text-gray-400 mt-1.5">
              Sign in to your account
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

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-3.5 md:space-y-4 auth-form">
            <InputField
              label="Email or Roll Number"
              placeholder="Enter email or roll number"
              {...register("identifier")}
              error={errors.identifier?.message}
            />
            <div className="relative">
              <InputField
                label="Password"
                type={showPassword ? "text" : "password"}
                placeholder="Enter your password"
                {...register("password")}
                error={errors.password?.message}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-[36px] md:top-[38px] text-gray-400 hover:text-white transition-colors p-1"
              >
                {showPassword ? (
                  <EyeOff className="w-4 h-4" />
                ) : (
                  <Eye className="w-4 h-4" />
                )}
              </button>
            </div>
            <GradientButton
              type="submit"
              loading={loading}
              disabled={loading}
              className="w-full shadow-lg shadow-indigo-500/20"
            >
              {loading ? "Signing In..." : "Sign In"}
            </GradientButton>
          </form>

          <p className="text-center text-xs md:text-sm text-gray-400 mt-5 md:mt-6">
            Don&apos;t have an account?{" "}
            <Link
              href="/register"
              className="text-indigo-400 hover:text-indigo-300 transition-colors font-medium"
            >
              Create one
            </Link>
          </p>
        </GlassCard>
      </motion.div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center"><div className="w-8 h-8 border-4 border-indigo-500/20 border-t-indigo-500 rounded-full animate-spin" /></div>}>
      <LoginForm />
    </Suspense>
  );
}