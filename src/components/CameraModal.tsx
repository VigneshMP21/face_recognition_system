"use client";

import { useState, useRef, useCallback, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Webcam from "react-webcam";
import { X, Camera, Loader2, CheckCircle2, AlertCircle, ScanFace } from "lucide-react";
import GradientButton from "./ui/GradientButton";
import * as faceapi from "face-api.js";

interface CameraModalProps {
  open: boolean;
  onClose: () => void;
  mode: "attendance" | "register";
  onSuccess?: (data: any) => void;
  onError?: (error: string) => void;
}

// face-api descriptors are matched with euclidean distance.
// Lower distance = more similar. ~0.5 is a common threshold.
const MATCH_THRESHOLD = 0.5;

function euclideanDistance(a: number[], b: number[]): number {
  let sum = 0;
  for (let i = 0; i < a.length; i++) {
    const d = a[i] - b[i];
    sum += d * d;
  }
  return Math.sqrt(sum);
}

type ScanState =
  | "loading" // loading models / embedding
  | "scanning" // looking for a face
  | "detected" // face found, not yet matched
  | "matched" // face matched -> marking
  | "success" // attendance marked
  | "already" // already marked today
  | "error"; // some failure

export default function CameraModal({
  open,
  onClose,
  mode,
  onSuccess,
  onError,
}: CameraModalProps) {
  const webcamRef = useRef<Webcam>(null);
  const [modelsLoaded, setModelsLoaded] = useState(false);

  // ---- register mode state (manual capture) ----
  const [loading, setLoading] = useState(false);
  const [capturing, setCapturing] = useState(false);
  const [result, setResult] = useState<{
    success?: boolean;
    message?: string;
    data?: any;
  } | null>(null);

  // ---- attendance mode state (automatic scanning) ----
  const [scanState, setScanState] = useState<ScanState>("loading");
  const [scanMessage, setScanMessage] = useState("Loading face recognition...");
  const [matchedUser, setMatchedUser] = useState<any>(null);
  const storedEmbeddingRef = useRef<number[] | null>(null);
  const busyRef = useRef(false); // prevents concurrent detections
  const doneRef = useRef(false); // stops loop after success/already
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Reset everything when the modal closes.
  useEffect(() => {
    if (!open) {
      setResult(null);
      setCapturing(false);
      setLoading(false);
      setScanState("loading");
      setScanMessage("Loading face recognition...");
      setMatchedUser(null);
      storedEmbeddingRef.current = null;
      busyRef.current = false;
      doneRef.current = false;
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    }
  }, [open]);

  // Load models when the modal opens.
  useEffect(() => {
    async function loadModels() {
      try {
        await Promise.all([
          faceapi.nets.tinyFaceDetector.loadFromUri("https://justadudewhohacks.github.io/face-api.js/models"),
          faceapi.nets.faceLandmark68Net.loadFromUri("https://justadudewhohacks.github.io/face-api.js/models"),
          faceapi.nets.faceRecognitionNet.loadFromUri("https://justadudewhohacks.github.io/face-api.js/models"),
        ]);
        setModelsLoaded(true);
      } catch (err) {
        console.error("Failed to load face-api models:", err);
        if (mode === "attendance") {
          setScanState("error");
          setScanMessage("Failed to load face recognition models.");
        }
      }
    }
    if (open && !modelsLoaded) {
      loadModels();
    }
  }, [open, modelsLoaded, mode]);

  // Attendance mode: fetch the logged-in user's stored embedding.
  useEffect(() => {
    if (!open || mode !== "attendance" || !modelsLoaded) return;

    let cancelled = false;
    async function loadEmbedding() {
      try {
        const res = await fetch("/api/face/embedding");
        const data = await res.json();
        if (cancelled) return;

        if (!data.registered || !data.embedding || data.embedding.length === 0) {
          setScanState("error");
          setScanMessage("No registered face found. Please register your face first.");
          return;
        }
        storedEmbeddingRef.current = data.embedding;
        setScanState("scanning");
        setScanMessage("Position your face in the frame");
      } catch {
        if (cancelled) return;
        setScanState("error");
        setScanMessage("Could not load your face data. Try again.");
      }
    }
    loadEmbedding();
    return () => {
      cancelled = true;
    };
  }, [open, mode, modelsLoaded]);

  const markAttendance = useCallback(
    async (userId?: string) => {
      try {
        const res = await fetch("/api/attendance/mark", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ userId }),
        });
        const data = await res.json();

        if (data.success) {
          setMatchedUser(data.user);
          setScanState("success");
          setScanMessage("Attendance marked successfully!");
          if (onSuccess) onSuccess(data.user || data);
        } else if (data.alreadyMarked) {
          setScanState("already");
          setScanMessage("You have already marked attendance today.");
          if (onSuccess) onSuccess({ alreadyMarked: true });
        } else {
          setScanState("error");
          setScanMessage(data.error || "Failed to mark attendance.");
          if (onError) onError(data.error || "Failed to mark attendance");
        }
      } catch {
        setScanState("error");
        setScanMessage("Failed to mark attendance.");
        if (onError) onError("Failed to mark attendance");
      }
    },
    [onSuccess, onError]
  );

  // Attendance mode: continuous detection + matching loop.
  useEffect(() => {
    if (!open || mode !== "attendance" || !modelsLoaded) return;
    if (scanState !== "scanning" && scanState !== "detected") return;
    if (!storedEmbeddingRef.current) return;

    doneRef.current = false;

    const tick = async () => {
      if (busyRef.current || doneRef.current) return;
      if (!webcamRef.current) return;
      busyRef.current = true;
      try {
        const imageSrc = webcamRef.current.getScreenshot();
        if (!imageSrc) return;

        const img = await faceapi.fetchImage(imageSrc);
        const detection = await faceapi
          .detectSingleFace(img, new faceapi.TinyFaceDetectorOptions())
          .withFaceLandmarks()
          .withFaceDescriptor();

        if (doneRef.current) return;

        if (!detection) {
          setScanState("scanning");
          setScanMessage("No face detected. Position your face in the frame.");
          return;
        }

        const live = Array.from(detection.descriptor);
        const stored = storedEmbeddingRef.current!;
        const distance = euclideanDistance(live, stored);

        if (distance <= MATCH_THRESHOLD) {
          // Match! Stop scanning and mark attendance.
          doneRef.current = true;
          if (intervalRef.current) {
            clearInterval(intervalRef.current);
            intervalRef.current = null;
          }
          setScanState("matched");
          setScanMessage("Face matched! Marking attendance...");
          await markAttendance();
        } else {
          setScanState("detected");
          setScanMessage("Face detected — verifying identity...");
        }
      } catch {
        // Ignore per-frame errors and keep scanning.
      } finally {
        busyRef.current = false;
      }
    };

    intervalRef.current = setInterval(tick, 700);
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    };
  }, [open, mode, modelsLoaded, scanState, markAttendance]);

  // Register mode: manual capture.
  const capture = useCallback(async () => {
    if (!webcamRef.current || capturing) return;
    setCapturing(true);
    setLoading(true);

    try {
      const imageSrc = webcamRef.current.getScreenshot();
      if (!imageSrc) {
        throw new Error("Failed to capture image");
      }

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
    } catch (err: any) {
      setResult({ success: false, message: err.message || "Something went wrong" });
      if (onError) onError(err.message);
    } finally {
      setLoading(false);
      setCapturing(false);
    }
  }, [capturing, onSuccess, onError]);

  const resetRegister = () => {
    setResult(null);
    setCapturing(false);
    setLoading(false);
  };

  const retryScan = () => {
    setMatchedUser(null);
    doneRef.current = false;
    busyRef.current = false;
    setScanState("scanning");
    setScanMessage("Position your face in the frame");
  };

  // Border color reflects the current scan state.
  const borderColor =
    scanState === "matched" || scanState === "success"
      ? "border-emerald-500"
      : scanState === "detected"
      ? "border-amber-400"
      : scanState === "error" || scanState === "already"
      ? "border-red-500"
      : "border-indigo-500/40";

  const showScannerLine = scanState === "scanning" || scanState === "detected";

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
                      <GradientButton onClick={resetRegister}>Retry</GradientButton>
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
