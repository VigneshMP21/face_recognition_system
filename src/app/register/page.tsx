"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { ScanFace, Eye, EyeOff, ArrowLeft, Loader2 } from "lucide-react";
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
        <GlassCard glow="indigo" className="!p-8">
          <div className="text-center mb-6">
            <Link href="/" className="inline-flex items-center gap-2 text-gray-400 hover:text-white mb-4 transition-colors">
              <ArrowLeft className="w-4 h-4" /> Back to Home
            </Link>
            <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-indigo-500 to-cyan-500 flex items-center justify-center mx-auto mb-4">
              <ScanFace className="w-7 h-7 text-white" />
            </div>
            <h1 className="text-2xl font-bold text-white">Create Account</h1>
            <p className="text-sm text-gray-400 mt-1">
              Register to use the Smart Attendance System
            </p>
          </div>

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
                className="absolute right-3 top-[38px] text-gray-400 hover:text-white transition-colors"
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
              className="w-full"
            >
              {loading ? "Creating Account..." : "Create Account"}
            </GradientButton>
          </form>

          <p className="text-center text-sm text-gray-400 mt-6">
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
