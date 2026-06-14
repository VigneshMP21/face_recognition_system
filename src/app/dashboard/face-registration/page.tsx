"use client";

import { useState, useRef, useCallback, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Webcam from "react-webcam";
import * as faceapi from "face-api.js";
import {
  Camera,
  CheckCircle2,
  Loader2,
  AlertCircle,
  ScanFace,
  ChevronRight,
} from "lucide-react";
import GlassCard from "@/components/ui/GlassCard";
import GradientButton from "@/components/ui/GradientButton";
import LoadingSpinner from "@/components/ui/LoadingSpinner";

const CAPTURE_ANGLES = ["Front", "Left", "Right", "Slight Up", "Slight Down"];

export default function FaceRegistrationPage() {
  const webcamRef = useRef<Webcam>(null);
  const [modelsLoaded, setModelsLoaded] = useState(false);
  const [loading, setLoading] = useState(true);
  const [capturing, setCapturing] = useState(false);
  const [currentCapture, setCurrentCapture] = useState(0);
  const [embeddings, setEmbeddings] = useState<number[][]>([]);
  const [registered, setRegistered] = useState(false);
  const [error, setError] = useState("");
  const [status, setStatus] = useState<"loading" | "ready" | "capturing" | "processing" | "done">("loading");

  useEffect(() => {
    async function init() {
      try {
        await Promise.all([
          faceapi.nets.tinyFaceDetector.loadFromUri("/models"),
          faceapi.nets.faceLandmark68Net.loadFromUri("/models"),
          faceapi.nets.faceRecognitionNet.loadFromUri("/models"),
        ]);
        setModelsLoaded(true);
        setStatus("ready");
      } catch (err) {
        setError("Failed to load face recognition models");
        console.error(err);
      } finally {
        setLoading(false);
      }
    }
    init();
  }, []);

  const capture = useCallback(async () => {
    if (!webcamRef.current || capturing || !modelsLoaded) return;
    setCapturing(true);
    setStatus("capturing");

    try {
      const imageSrc = webcamRef.current.getScreenshot();
      if (!imageSrc) throw new Error("Failed to capture image");

      const img = await faceapi.fetchImage(imageSrc);
      const detection = await faceapi
        .detectSingleFace(img, new faceapi.TinyFaceDetectorOptions())
        .withFaceLandmarks()
        .withFaceDescriptor();

      if (!detection) {
        setError("No face detected. Please position your face properly and try again.");
        setCapturing(false);
        return;
      }

      const descriptor = Array.from(detection.descriptor);
      setEmbeddings((prev) => [...prev, descriptor]);
      setError("");

      if (currentCapture + 1 >= CAPTURE_ANGLES.length) {
        setStatus("processing");
        const avgEmbedding = averageEmbeddings([...embeddings, descriptor]);
        const res = await fetch("/api/face/register", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ embedding: avgEmbedding }),
        });
        const data = await res.json();
        if (data.success) {
          setStatus("done");
          setRegistered(true);
        } else {
          setError(data.error || "Registration failed");
          setStatus("ready");
        }
      } else {
        setCurrentCapture((prev) => prev + 1);
        setCapturing(false);
        return;
      }
    } catch (err: any) {
      setError(err.message || "Capture failed");
    }
    setCapturing(false);
  }, [capturing, modelsLoaded, currentCapture, embeddings]);

  function averageEmbeddings(emb: number[][]): number[] {
    const avg = new Array(emb[0].length).fill(0);
    for (const e of emb) {
      for (let i = 0; i < e.length; i++) {
        avg[i] += e[i] / emb.length;
      }
    }
    return avg;
  }

  const reset = () => {
    setCurrentCapture(0);
    setEmbeddings([]);
    setRegistered(false);
    setError("");
    setStatus("ready");
  };

  if (loading) return <LoadingSpinner text="Loading face recognition models..." />;

  return (
    <div className="max-w-3xl mx-auto">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <h1 className="text-2xl md:text-3xl font-bold text-white mb-2">
          Face Registration
        </h1>
        <p className="text-gray-400 mb-6">
          Register your face to use attendance features
        </p>
      </motion.div>

      {registered ? (
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
        >
          <GlassCard glow="cyan" className="!p-10 text-center">
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ type: "spring", stiffness: 200 }}
            >
              <CheckCircle2 className="w-20 h-20 text-emerald-400 mx-auto mb-4" />
            </motion.div>
            <h2 className="text-2xl font-bold text-emerald-400 mb-2">
              Face Registered Successfully!
            </h2>
            <p className="text-gray-400 mb-6">
              Your face has been registered. You can now use face recognition to mark attendance.
            </p>
            <GradientButton onClick={reset}>Register Again</GradientButton>
          </GlassCard>
        </motion.div>
      ) : (
        <GlassCard glow="indigo">
          <div className="grid md:grid-cols-2 gap-6">
            <div>
              <div className="relative rounded-2xl overflow-hidden bg-black/50 aspect-[4/3] mb-4">
                {modelsLoaded ? (
                  <Webcam
                    ref={webcamRef}
                    screenshotFormat="image/jpeg"
                    className="w-full h-full object-cover"
                    mirrored
                  />
                ) : (
                  <div className="flex items-center justify-center h-full">
                    <Loader2 className="w-8 h-8 animate-spin text-indigo-400" />
                  </div>
                )}
                <motion.div
                  className="absolute left-4 right-4 h-0.5 bg-gradient-to-r from-transparent via-indigo-500 to-transparent"
                  animate={{ top: ["10%", "90%"] }}
                  transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
                />
              </div>

              {error && (
                <div className="bg-red-500/10 border border-red-500/20 rounded-xl p-3 mb-4 text-sm text-red-400 flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 flex-shrink-0" />
                  {error}
                </div>
              )}

              <GradientButton
                onClick={capture}
                loading={capturing}
                disabled={!modelsLoaded || capturing || status === "processing"}
                className="w-full"
              >
                {status === "processing"
                  ? "Processing..."
                  : capturing
                  ? "Capturing..."
                  : `Capture ${CAPTURE_ANGLES[currentCapture]}`}
              </GradientButton>
            </div>

            <div>
              <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                <ScanFace className="w-5 h-5 text-indigo-400" />
                Capture Progress
              </h3>
              <div className="space-y-3">
                {CAPTURE_ANGLES.map((angle, i) => {
                  const captured = i < currentCapture;
                  const active = i === currentCapture;
                  return (
                    <motion.div
                      key={angle}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: i * 0.1 }}
                      className={`flex items-center gap-3 p-3 rounded-xl transition-all ${
                        captured
                          ? "bg-emerald-500/10 border border-emerald-500/20"
                          : active
                          ? "bg-indigo-500/10 border border-indigo-500/20"
                          : "bg-white/5 border border-white/5"
                      }`}
                    >
                      <div
                        className={`w-8 h-8 rounded-lg flex items-center justify-center text-sm font-bold ${
                          captured
                            ? "bg-emerald-500 text-white"
                            : active
                            ? "bg-indigo-500 text-white"
                            : "bg-white/10 text-gray-500"
                        }`}
                      >
                        {captured ? (
                          <CheckCircle2 className="w-4 h-4" />
                        ) : (
                          i + 1
                        )}
                      </div>
                      <span
                        className={`text-sm font-medium ${
                          captured
                            ? "text-emerald-300"
                            : active
                            ? "text-white"
                            : "text-gray-500"
                        }`}
                      >
                        {angle}
                      </span>
                      {captured && (
                        <ChevronRight className="w-4 h-4 text-emerald-400 ml-auto" />
                      )}
                    </motion.div>
                  );
                })}
              </div>

              <div className="mt-6">
                <div className="flex items-center justify-between text-sm text-gray-400 mb-2">
                  <span>Overall Progress</span>
                  <span>{currentCapture} / {CAPTURE_ANGLES.length}</span>
                </div>
                <div className="h-2 rounded-full bg-white/5 overflow-hidden">
                  <motion.div
                    className="h-full bg-gradient-to-r from-indigo-500 to-cyan-500 rounded-full"
                    initial={{ width: 0 }}
                    animate={{
                      width: `${(currentCapture / CAPTURE_ANGLES.length) * 100}%`,
                    }}
                    transition={{ duration: 0.5 }}
                  />
                </div>
              </div>
            </div>
          </div>
        </GlassCard>
      )}
    </div>
  );
}
