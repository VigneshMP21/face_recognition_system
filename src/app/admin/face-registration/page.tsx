"use client";

import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { ScanFace, ArrowLeft } from "lucide-react";
import GlassCard from "@/components/ui/GlassCard";
import GradientButton from "@/components/ui/GradientButton";

export default function AdminFaceRegistrationPage() {
  const router = useRouter();

  return (
    <div className="max-w-3xl mx-auto">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-center py-12"
      >
        <GlassCard glow="indigo" className="!p-12">
          <motion.div
            animate={{ scale: [1, 1.05, 1] }}
            transition={{ duration: 3, repeat: Infinity }}
          >
            <ScanFace className="w-20 h-20 text-indigo-400 mx-auto mb-6" />
          </motion.div>
          <h1 className="text-2xl font-bold text-white mb-3">
            Face Registration
          </h1>
          <p className="text-gray-400 mb-6 max-w-md mx-auto">
            Face registration is handled by students from their dashboard.
            Use this link to access the student face registration interface.
          </p>
          <GradientButton onClick={() => router.push("/dashboard/face-registration")}>
            <ArrowLeft className="w-4 h-4" />
            Go to Student Face Registration
          </GradientButton>
        </GlassCard>
      </motion.div>
    </div>
  );
}
