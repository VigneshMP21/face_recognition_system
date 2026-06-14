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
  Play,
} from "lucide-react";
import GlassCard from "@/components/ui/GlassCard";
import GradientButton from "@/components/ui/GradientButton";
import LoadingSpinner from "@/components/ui/LoadingSpinner";

const CAPTURE_ANGLES = ["Front", "Left", "Right", "Slight Up", "Slight Down"];

export default function FaceRegistrationPage() {
  const webcamRef = useRef<Webcam>(null);
  const scanActiveRef = useRef(false);
  const embeddingsRef = useRef<number[][]>([]);
  const captureCountRef = useRef(0);
  const [modelsLoaded, setModelsLoaded] = useState(false);
  const [loading, setLoading] = useState(true);
  const [started, setStarted] = useState(false);
  const [currentCapture, setCurrentCapture] = useState(0);
  const [registered, setRegistered] = useState(false);
  const [error, setError] = useState("");
  const [faceDetected, setFaceDetected] = useState(false);
  const [status, setStatus] = useState<"loading" | "ready" | "scanning" | "processing" | "done">("loading");

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

  const doCapture = useCallback(async () => {
    if (!webcamRef.current || !modelsLoaded) return null;
    try {
      const imageSrc = webcamRef.current.getScreenshot();
      if (!imageSrc) return null;
      const img = await faceapi.fetchImage(imageSrc);
      return await faceapi
        .detectSingleFace(img, new faceapi.TinyFaceDetectorOptions())
        .withFaceLandmarks()
        .withFaceDescriptor();
    } catch {
      return null;
    }
  }, [modelsLoaded]);

  useEffect(() => {
    if (!started || status !== "scanning") return;

    scanActiveRef.current = true;
    embeddingsRef.current = [];
    captureCountRef.current = 0;
    setCurrentCapture(0);

    const CAPTURE_GAP = 1800;
    let readyForNext = true;

    const interval = setInterval(async () => {
      if (!scanActiveRef.current || !readyForNext) return;
      readyForNext = false;

      const detection = await doCapture();
      if (detection) {
        setFaceDetected(true);
        setTimeout(() => setFaceDetected(false), 600);
        setError("");

        const descriptor = Array.from(detection.descriptor);
        embeddingsRef.current = [...embeddingsRef.current, descriptor];
        const count = captureCountRef.current + 1;
        captureCountRef.current = count;
        setCurrentCapture(count);

        if (count >= CAPTURE_ANGLES.length) {
          scanActiveRef.current = false;
          clearInterval(interval);
          setStatus("processing");

          try {
            const avg = averageEmbeddings(embeddingsRef.current);
            const res = await fetch("/api/face/register", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ embedding: avg }),
            });
            const data = await res.json();
            if (data.success) {
              setStatus("done");
              setRegistered(true);
            } else {
              setError(data.error || "Registration failed");
              setStatus("scanning");
              scanActiveRef.current = true;
            }
          } catch {
            setError("Failed to save face data");
            setStatus("scanning");
            scanActiveRef.current = true;
          }
          return;
        }

        setTimeout(() => {
          readyForNext = true;
        }, CAPTURE_GAP);
      } else {
        setError("No face detected. Position your face properly.");
        setTimeout(() => {
          readyForNext = true;
        }, 500);
      }
    }, 700);

    return () => {
      scanActiveRef.current = false;
      clearInterval(interval);
    };
  }, [started, status, doCapture]);

  function averageEmbeddings(emb: number[][]): number[] {
    const avg = new Array(emb[0].length).fill(0);
    for (const e of emb) {
      for (let i = 0; i < e.length; i++) {
        avg[i] += e[i] / emb.length;
      }
    }
    return avg;
  }

  const startCapture = () => {
    setStarted(true);
    setStatus("scanning");
  };

  const reset = () => {
    setStarted(false);
    setCurrentCapture(0);
    setRegistered(false);
    setError("");
    setFaceDetected(false);
    setStatus("ready");
  };

  if (loading) return <LoadingSpinner text="Loading face recognition models..." />;

  return (
    <div className="max-w-3xl mx-auto">
      {!started ? (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center"
        >
          <h1 className="text-2xl md:text-3xl font-bold text-white mb-2">
            Face Registration
          </h1>
          <p className="text-gray-400 mb-8">
            Register your face to use attendance features
          </p>

          <GlassCard glow="indigo" className="!p-12">
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ type: "spring", stiffness: 200, delay: 0.2 }}
              className="w-24 h-24 rounded-full bg-indigo-500/20 flex items-center justify-center mx-auto mb-6"
            >
              <ScanFace className="w-12 h-12 text-indigo-400" />
            </motion.div>

            <h2 className="text-xl font-semibold text-white mb-3">
              Ready to Register Your Face?
            </h2>
            <p className="text-gray-400 mb-6 max-w-md mx-auto">
              We'll capture your face from 5 angles to create a secure facial
              signature. Make sure you're in a well-lit area.
            </p>

            <div className="grid grid-cols-5 gap-3 max-w-sm mx-auto mb-8">
              {CAPTURE_ANGLES.map((angle, i) => (
                <div key={angle} className="text-center p-2 rounded-lg bg-white/5">
                  <div className="w-8 h-8 rounded-full bg-indigo-500/20 flex items-center justify-center mx-auto mb-1">
                    <span className="text-xs font-bold text-indigo-300">{i + 1}</span>
                  </div>
                  <span className="text-[10px] text-gray-500 leading-tight block">{angle}</span>
                </div>
              ))}
            </div>

            <GradientButton
              onClick={startCapture}
              disabled={!modelsLoaded}
              className="px-10"
            >
              <Play className="w-5 h-5" />
              Start Face Registration
            </GradientButton>
          </GlassCard>
        </motion.div>
      ) : registered ? (
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
              Successfully Added Your Face!
            </h2>
            <p className="text-gray-400 mb-6">
              Your face has been registered across all 5 angles. You can now use
              face recognition to mark attendance.
            </p>
            <GradientButton onClick={reset}>Register Again</GradientButton>
          </GlassCard>
        </motion.div>
      ) : (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <h1 className="text-2xl md:text-3xl font-bold text-white mb-2">
            Face Registration
          </h1>
          <p className="text-gray-400 mb-6">
            Position your face for{" "}
            <span className="text-indigo-400 font-semibold">
              {CAPTURE_ANGLES[currentCapture]}
            </span>
          </p>

          <GlassCard glow="indigo">
            <div className="grid md:grid-cols-2 gap-6">
              <div>
                <div className="relative rounded-2xl overflow-hidden bg-black/50 aspect-[4/3] mb-4">
                  {modelsLoaded ? (
                    <>
                      <Webcam
                        ref={webcamRef}
                        screenshotFormat="image/jpeg"
                        className="w-full h-full object-cover"
                        mirrored
                      />
                      <div
                        className={`absolute inset-0 rounded-2xl transition-all duration-300 pointer-events-none ${
                          faceDetected
                            ? "ring-4 ring-emerald-400 shadow-[0_0_30px_rgba(52,211,153,0.5)]"
                            : "ring-1 ring-white/10"
                        }`}
                      />
                      <motion.div
                        className="absolute left-4 right-4 h-0.5 bg-gradient-to-r from-transparent via-indigo-500 to-transparent"
                        animate={{ top: ["10%", "90%"] }}
                        transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
                      />
                      {faceDetected && (
                        <motion.div
                          initial={{ opacity: 0, scale: 0.8 }}
                          animate={{ opacity: 1, scale: 1 }}
                          exit={{ opacity: 0 }}
                          className="absolute top-3 right-3 bg-emerald-500/80 backdrop-blur-sm text-white text-xs font-semibold px-3 py-1.5 rounded-full flex items-center gap-1.5"
                        >
                          <CheckCircle2 className="w-3 h-3" />
                          Face Captured
                        </motion.div>
                      )}
                    </>
                  ) : (
                    <div className="flex items-center justify-center h-full">
                      <Loader2 className="w-8 h-8 animate-spin text-indigo-400" />
                    </div>
                  )}
                </div>

                {error && (
                  <motion.div
                    initial={{ opacity: 0, y: -5 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="bg-red-500/10 border border-red-500/20 rounded-xl p-3 mb-4 text-sm text-red-400 flex items-center gap-2"
                  >
                    <AlertCircle className="w-4 h-4 flex-shrink-0" />
                    {error}
                  </motion.div>
                )}

                <div className="flex items-center gap-2 text-indigo-300 text-sm font-medium">
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Scanning for face...
                </div>
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
                          {captured ? <CheckCircle2 className="w-4 h-4" /> : i + 1}
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
                    <span>
                      {currentCapture} / {CAPTURE_ANGLES.length}
                    </span>
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
        </motion.div>
      )}
    </div>
  );
}
