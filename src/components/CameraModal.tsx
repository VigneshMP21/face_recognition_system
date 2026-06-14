"use client";

import { useState, useRef, useCallback, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Webcam from "react-webcam";
import { X, Camera, Loader2, CheckCircle2, AlertCircle } from "lucide-react";
import GradientButton from "./ui/GradientButton";
import * as faceapi from "face-api.js";

interface CameraModalProps {
  open: boolean;
  onClose: () => void;
  mode: "attendance" | "register";
  onSuccess?: (data: any) => void;
  onError?: (error: string) => void;
}

export default function CameraModal({
  open,
  onClose,
  mode,
  onSuccess,
  onError,
}: CameraModalProps) {
  const webcamRef = useRef<Webcam>(null);
  const [loading, setLoading] = useState(false);
  const [modelsLoaded, setModelsLoaded] = useState(false);
  const [capturing, setCapturing] = useState(false);
  const [result, setResult] = useState<{
    success?: boolean;
    message?: string;
    data?: any;
  } | null>(null);

  useEffect(() => {
    if (!open) {
      setResult(null);
      setCapturing(false);
    }
  }, [open]);

  useEffect(() => {
    async function loadModels() {
      try {
        await Promise.all([
          faceapi.nets.tinyFaceDetector.loadFromUri("/models"),
          faceapi.nets.faceLandmark68Net.loadFromUri("/models"),
          faceapi.nets.faceRecognitionNet.loadFromUri("/models"),
        ]);
        setModelsLoaded(true);
      } catch (err) {
        console.error("Failed to load face-api models:", err);
      }
    }
    if (open && !modelsLoaded) {
      loadModels();
    }
  }, [open, modelsLoaded]);

  const capture = useCallback(async () => {
    if (!webcamRef.current || capturing) return;
    setCapturing(true);
    setLoading(true);

    try {
      const imageSrc = webcamRef.current.getScreenshot();
      if (!imageSrc) {
        throw new Error("Failed to capture image");
      }

      if (mode === "attendance") {
        const res = await fetch("/api/face/recognize", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ image: imageSrc }),
        });
        const data = await res.json();
        if (data.success) {
          setResult({ success: true, message: "Face Recognized", data: data.user });
          if (onSuccess) onSuccess(data.user);
        } else {
          setResult({ success: false, message: data.error || "Face Not Recognized" });
          if (onError) onError(data.error || "Face Not Recognized");
        }
      } else if (mode === "register") {
        const img = await faceapi.fetchImage(imageSrc);
        const detection = await faceapi
          .detectSingleFace(img, new faceapi.TinyFaceDetectorOptions())
          .withFaceLandmarks()
          .withFaceDescriptor();

        if (!detection) {
          setResult({ success: false, message: "No face detected. Please try again." });
          if (onError) onError("No face detected");
          return;
        }

        const descriptor = Array.from(detection.descriptor);
        const res = await fetch("/api/face/register", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ embedding: descriptor }),
        });
        const data = await res.json();
        if (data.success) {
          setResult({ success: true, message: "Face Registered Successfully!" });
          if (onSuccess) onSuccess(data);
        } else {
          setResult({ success: false, message: data.error || "Registration failed" });
          if (onError) onError(data.error || "Registration failed");
        }
      }
    } catch (err: any) {
      setResult({ success: false, message: err.message || "Something went wrong" });
      if (onError) onError(err.message);
    } finally {
      setLoading(false);
      setCapturing(false);
    }
  }, [capturing, mode, onSuccess, onError]);

  const reset = () => {
    setResult(null);
    setCapturing(false);
    setLoading(false);
  };

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm"
        >
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.9, opacity: 0 }}
            className="glass rounded-3xl p-6 max-w-md w-full glow"
          >
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-white flex items-center gap-2">
                <Camera className="w-5 h-5 text-indigo-400" />
                {mode === "attendance" ? "Face Recognition" : "Face Registration"}
              </h2>
              <button
                onClick={onClose}
                className="p-1.5 rounded-lg hover:bg-white/5 text-gray-400 hover:text-white transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {result ? (
              <div className="text-center py-8">
                {result.success ? (
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ type: "spring", stiffness: 200 }}
                  >
                    <CheckCircle2 className="w-16 h-16 text-emerald-400 mx-auto mb-4" />
                    <h3 className="text-xl font-bold text-emerald-400 mb-2">
                      {result.message}
                    </h3>
                    {result.data && (
                      <div className="text-gray-300 space-y-1">
                        <p className="text-lg font-semibold text-white">
                          Welcome, {result.data.name}
                        </p>
                        <p className="text-sm">Roll No: {result.data.rollNumber}</p>
                        <p className="text-xs text-gray-500 mt-2">
                          Attendance Successfully Marked
                        </p>
                      </div>
                    )}
                    <GradientButton onClick={onClose} className="mt-6">
                      Close
                    </GradientButton>
                  </motion.div>
                ) : (
                  <div>
                    <motion.div
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      transition={{ type: "spring", stiffness: 200 }}
                    >
                      <AlertCircle className="w-16 h-16 text-red-400 mx-auto mb-4" />
                      <h3 className="text-xl font-bold text-red-400 mb-2">
                        {result.message}
                      </h3>
                    </motion.div>
                    <div className="flex gap-3 justify-center mt-6">
                      <GradientButton onClick={reset}>Retry</GradientButton>
                      <button
                        onClick={onClose}
                        className="px-6 py-3 rounded-xl border border-white/10 text-gray-300 hover:text-white hover:bg-white/5 transition-all"
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div>
                <div className="relative rounded-2xl overflow-hidden bg-black/50 mb-4 aspect-[4/3]">
                  {modelsLoaded ? (
                    <Webcam
                      ref={webcamRef}
                      screenshotFormat="image/jpeg"
                      className="w-full h-full object-cover"
                      mirrored
                    />
                  ) : (
                    <div className="flex items-center justify-center h-full">
                      <div className="text-center">
                        <Loader2 className="w-8 h-8 animate-spin text-indigo-400 mx-auto mb-2" />
                        <p className="text-sm text-gray-400">Loading camera...</p>
                      </div>
                    </div>
                  )}
                  <div className="absolute inset-0 border-2 border-indigo-500/30 rounded-2xl pointer-events-none" />
                  <motion.div
                    className="absolute left-4 right-4 h-0.5 bg-gradient-to-r from-transparent via-indigo-500 to-transparent"
                    animate={{ top: ["10%", "90%"] }}
                    transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
                  />
                </div>

                <p className="text-sm text-gray-400 text-center mb-4">
                  Position your face in the center and click capture
                </p>

                <GradientButton
                  onClick={capture}
                  loading={loading}
                  disabled={!modelsLoaded || capturing}
                  className="w-full"
                >
                  {loading ? "Processing..." : "Capture Face"}
                </GradientButton>
              </div>
            )}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
