"use client";

import { useState, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { motion } from "framer-motion";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { ScanFace, Eye, EyeOff, ArrowLeft } from "lucide-react";
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
        <GlassCard glow="indigo" className="!p-8">
          <div className="text-center mb-6">
            <Link
              href="/"
              className="inline-flex items-center gap-2 text-gray-400 hover:text-white mb-4 transition-colors"
            >
              <ArrowLeft className="w-4 h-4" /> Back to Home
            </Link>
            <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-indigo-500 to-cyan-500 flex items-center justify-center mx-auto mb-4">
              <ScanFace className="w-7 h-7 text-white" />
            </div>
            <h1 className="text-2xl font-bold text-white">Welcome Back</h1>
            <p className="text-sm text-gray-400 mt-1">
              Sign in to your account
            </p>
          </div>

          {successMsg && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-emerald-500/10 border border-emerald-500/20 rounded-xl p-3 mb-4 text-sm text-emerald-400 text-center"
            >
              {successMsg}
            </motion.div>
          )}

          {error && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-red-500/10 border border-red-500/20 rounded-xl p-3 mb-4 text-sm text-red-400 text-center"
            >
              {error}
            </motion.div>
          )}

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
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
                className="absolute right-3 top-[38px] text-gray-400 hover:text-white transition-colors"
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
              className="w-full"
            >
              {loading ? "Signing In..." : "Sign In"}
            </GradientButton>
          </form>

          <p className="text-center text-sm text-gray-400 mt-6">
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
