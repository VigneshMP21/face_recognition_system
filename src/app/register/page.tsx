"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { Eye, EyeOff, ArrowLeft, Loader2 } from "lucide-react";
import Link from "next/link";
import GlassCard from "@/components/ui/GlassCard";
import GradientButton from "@/components/ui/GradientButton";
import InputField from "@/components/ui/InputField";

const registerSchema = z
  .object({
    name: z.string().min(2, "Name must be at least 2 characters"),
    rollNumber: z.string().min(1, "Roll Number is required"),
    email: z.string().email("Invalid email address"),
    mobile: z
      .string()
      .min(10, "Mobile number must be at least 10 digits")
      .max(15, "Invalid mobile number"),
    password: z.string().min(6, "Password must be at least 6 characters"),
    confirmPassword: z.string(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords do not match",
    path: ["confirmPassword"],
  });

type RegisterForm = z.infer<typeof registerSchema>;

export default function RegisterPage() {
  const router = useRouter();
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<RegisterForm>({
    resolver: zodResolver(registerSchema),
  });

  const onSubmit = async (data: RegisterForm) => {
    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      const result = await res.json();
      if (!res.ok) {
        setError(result.error || "Registration failed");
        return;
      }
      router.push("/login?registered=true");
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
            <h1 className="text-xl md:text-2xl font-bold text-white">Create Account</h1>
            <p className="text-xs md:text-sm text-gray-400 mt-1.5">
              Register to use the Smart Attendance System
            </p>
          </div>

          {error && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-red-500/10 border border-red-500/20 rounded-xl p-3 mb-4 text-xs md:text-sm text-red-400 text-center"
            >
              {error}
            </motion.div>
          )}

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-3 md:space-y-4 auth-form">
            <InputField
              label="Full Name"
              placeholder="Enter your full name"
              {...register("name")}
              error={errors.name?.message}
            />
            <InputField
              label="Roll Number"
              placeholder="Enter your roll number"
              {...register("rollNumber")}
              error={errors.rollNumber?.message}
            />
            <InputField
              label="Email Address"
              type="email"
              placeholder="Enter your email"
              {...register("email")}
              error={errors.email?.message}
            />
            <InputField
              label="Mobile Number"
              type="tel"
              placeholder="Enter your mobile number"
              {...register("mobile")}
              error={errors.mobile?.message}
            />
            <div className="relative">
              <InputField
                label="Password"
                type={showPassword ? "text" : "password"}
                placeholder="Create a password"
                {...register("password")}
                error={errors.password?.message}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-[36px] md:top-[38px] text-gray-400 hover:text-white transition-colors p-1"
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
            <InputField
              label="Confirm Password"
              type="password"
              placeholder="Confirm your password"
              {...register("confirmPassword")}
              error={errors.confirmPassword?.message}
            />
            <GradientButton
              type="submit"
              loading={loading}
              disabled={loading}
              className="w-full shadow-lg shadow-indigo-500/20"
            >
              {loading ? "Creating Account..." : "Create Account"}
            </GradientButton>
          </form>

          <p className="text-center text-xs md:text-sm text-gray-400 mt-5 md:mt-6">
            Already have an account?{" "}
            <Link
              href="/login"
              className="text-indigo-400 hover:text-indigo-300 transition-colors font-medium"
            >
              Sign In
            </Link>
          </p>
        </GlassCard>
      </motion.div>
    </div>
  );
}