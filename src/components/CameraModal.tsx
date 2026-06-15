"use client";

import { useState, useRef, useCallback, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Webcam from "react-webcam";
import { X, Loader2, CheckCircle2, AlertCircle, ScanFace, XCircle } from "lucide-react";
import GradientButton from "./ui/GradientButton";
import CircularScanner from "./CircularScanner";
import * as faceapi from "face-api.js";
import { validateFaceQuality, estimateHeadPose, checkEyesOpen } from "@/lib/faceValidation";

/* ─────────────────────────────────────────────────────────────────
   face-api descriptors: euclidean distance — lower = more similar.
   ~0.5 is a well-tuned threshold for TinyFaceDetector.
──────────────────────────────────────────────────────────────────── */
const MATCH_THRESHOLD = 0.48;

function euclideanDistance(a: number[], b: number[]): number {
  let sum = 0;
  for (let i = 0; i < a.length; i++) { const d = a[i] - b[i]; sum += d * d; }
  return Math.sqrt(sum);
}

function averageEmbeddings(emb: number[][]): number[] {
  const avg = new Array(emb[0].length).fill(0);
  for (const e of emb)
    for (let i = 0; i < e.length; i++) avg[i] += e[i] / emb.length;
  return avg;
}

type ScanState =
  | "loading"   // loading models / stored embedding
  | "scanning"  // looking for a face
  | "detected"  // face found, not yet matched
  | "matched"   // face matched → marking attendance
  | "success"   // attendance marked ✓
  | "already"   // already marked today
  | "no_match"  // face detected but does NOT match
  | "error";    // some failure

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
  const webcamRef          = useRef<Webcam>(null);
  const [modelsLoaded, setModelsLoaded] = useState(false);
  const [scanState, setScanState]       = useState<ScanState>("loading");
  const [scanMessage, setScanMessage]   = useState("Loading face recognition…");
  const [matchedUser, setMatchedUser]   = useState<any>(null);
  const storedEmbeddingRef = useRef<number[] | null>(null);
  const busyRef            = useRef(false);
  const doneRef            = useRef(false);
  const intervalRef        = useRef<ReturnType<typeof setInterval> | null>(null);
  const [facePresent, setFacePresent]           = useState(false);
  const [faceQualityValid, setFaceQualityValid] = useState(false);

  const [timeLeft, setTimeLeft]                   = useState(60);
  const [stabilityProgress, setStabilityProgress] = useState(0);
  const [failureTitle, setFailureTitle]           = useState("");
  const [failureMessage, setFailureMessage]       = useState("");

  const stabilityDescriptorsRef = useRef<number[][]>([]);
  const scanStartTimeRef        = useRef<number | null>(null);

  /* ── Scan state & start time initializer ─────────────────── */
  useEffect(() => {
    if (scanState === "scanning") {
      scanStartTimeRef.current = Date.now();
      stabilityDescriptorsRef.current = [];
      setStabilityProgress(0);
      setTimeLeft(60);
      setFailureTitle("");
      setFailureMessage("");
    }
  }, [scanState]);

  /* ── Scanner countdown timer ────────────────────────────────── */
  useEffect(() => {
    if (scanState !== "scanning") {
      return;
    }
    const interval = setInterval(() => {
      if (!scanStartTimeRef.current) return;
      const elapsed = Math.floor((Date.now() - scanStartTimeRef.current) / 1000);
      const remaining = Math.max(0, 60 - elapsed);
      setTimeLeft(remaining);
      if (remaining === 0) {
        clearInterval(interval);
      }
    }, 1000);
    return () => clearInterval(interval);
  }, [scanState]);

  /* ── Reset on close ──────────────────────────────────────────── */
  useEffect(() => {
    if (!open) {
      setScanState("loading");
      setScanMessage("Loading face recognition…");
      setMatchedUser(null);
      storedEmbeddingRef.current = null;
      busyRef.current  = false;
      doneRef.current  = false;
      setFacePresent(false);
      setFaceQualityValid(false);
      setTimeLeft(60);
      setStabilityProgress(0);
      stabilityDescriptorsRef.current = [];
      scanStartTimeRef.current = null;
      setFailureTitle("");
      setFailureMessage("");
      if (intervalRef.current) { clearInterval(intervalRef.current); intervalRef.current = null; }
    }
  }, [open]);


  /* ── Load face-api models ────────────────────────────────────── */
  useEffect(() => {
    async function loadModels() {
      try {
        await Promise.all([
          faceapi.nets.tinyFaceDetector.loadFromUri("https://justadudewhohacks.github.io/face-api.js/models"),
          faceapi.nets.faceLandmark68Net.loadFromUri("https://justadudewhohacks.github.io/face-api.js/models"),
          faceapi.nets.faceRecognitionNet.loadFromUri("https://justadudewhohacks.github.io/face-api.js/models"),
        ]);
        setModelsLoaded(true);
      } catch {
        if (mode === "attendance") {
          setScanState("error");
          setScanMessage("Failed to load face recognition models.");
        }
      }
    }
    if (open && !modelsLoaded) loadModels();
  }, [open, modelsLoaded, mode]);

  /* ── Attendance: fetch stored embedding ──────────────────────── */
  useEffect(() => {
    if (!open || mode !== "attendance" || !modelsLoaded) return;
    let cancelled = false;

    async function loadEmbedding() {
      try {
        const res  = await fetch("/api/face/embedding");
        const data = await res.json();
        if (cancelled) return;
        if (!data.registered || !data.embedding || data.embedding.length === 0) {
          setScanState("error");
          setScanMessage("No registered face found. Please register your face first.");
          return;
        }
        storedEmbeddingRef.current = data.embedding;
        setScanState("scanning");
        setScanMessage("Position your face inside the circle");
      } catch {
        if (cancelled) return;
        setScanState("error");
        setScanMessage("Could not load your face data. Try again.");
      }
    }
    loadEmbedding();
    return () => { cancelled = true; };
  }, [open, mode, modelsLoaded]);

  /* ── Mark attendance API call ────────────────────────────────── */
  const markAttendance = useCallback(async () => {
    try {
      const res  = await fetch("/api/attendance/mark", {
        method:  "POST",
        headers: { "Content-Type": "application/json" },
        body:    JSON.stringify({}),
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
  }, [onSuccess, onError]);

  /* ── Attendance scanning loop ────────────────────────────────── */
  const hadFaceAttemptsRef = useRef(false);

  useEffect(() => {
    if (!open || mode !== "attendance" || !modelsLoaded) return;
    if (scanState !== "scanning") return;
    if (!storedEmbeddingRef.current) return;

    doneRef.current = false;
    hadFaceAttemptsRef.current = false;

    const tick = async () => {
      if (busyRef.current || doneRef.current) return;
      if (!webcamRef.current) return;
      busyRef.current = true;

      try {
        // Check timeout
        if (scanStartTimeRef.current) {
          const elapsed = (Date.now() - scanStartTimeRef.current) / 1000;
          if (elapsed >= 60) {
            doneRef.current = true;
            if (intervalRef.current) { clearInterval(intervalRef.current); intervalRef.current = null; }
            setFailureTitle("Face Not Recognized");
            if (hadFaceAttemptsRef.current) {
              setFailureMessage("The detected face does not belong to the registered account. Please try again.");
            } else {
              setFailureMessage("No valid registered face could be verified within the allotted time. Please try again.");
            }
            setScanState("no_match");
            return;
          }
        }

        const imageSrc = webcamRef.current.getScreenshot();
        if (!imageSrc) return;

        const img       = await faceapi.fetchImage(imageSrc);
        const detection = await faceapi
          .detectSingleFace(img, new faceapi.TinyFaceDetectorOptions())
          .withFaceLandmarks()
          .withFaceDescriptor();

        if (doneRef.current) return;

        if (!detection) {
          setFacePresent(false);
          setFaceQualityValid(false);
          setScanState("scanning");
          setScanMessage("No face detected — position your face inside the circle.");
          // Reset stability on face loss
          stabilityDescriptorsRef.current = [];
          setStabilityProgress(0);
          return;
        }

        setFacePresent(true);

        // 1 ─ Run quality check on the frame
        const quality = validateFaceQuality(detection, img.width, img.height);
        if (!quality.valid) {
          setFaceQualityValid(false);
          setScanState("scanning");
          setScanMessage(quality.hint);
          stabilityDescriptorsRef.current = [];
          setStabilityProgress(0);
          return;
        }

        // 2 ─ Eyes-open validation
        const eyeCheck = checkEyesOpen(detection.landmarks);
        if (!eyeCheck.open) {
          setFaceQualityValid(false);
          setScanState("scanning");
          setScanMessage("Please keep your eyes open and look directly at the camera.");
          stabilityDescriptorsRef.current = [];
          setStabilityProgress(0);
          return;
        }

        // 3 ─ Stable head position / pose verification (must look straight)
        const pose = estimateHeadPose(detection.landmarks);
        const isFront = Math.abs(pose.yaw) < 0.15 && pose.pitch > 0.35 && pose.pitch < 0.58;
        if (!isFront) {
          setFaceQualityValid(false);
          setScanState("scanning");
          setScanMessage("Please look directly at the camera.");
          stabilityDescriptorsRef.current = [];
          setStabilityProgress(0);
          return;
        }

        // All checks pass: accumulate stability
        setFaceQualityValid(true);
        setScanMessage("Verifying face... Hold steady");

        stabilityDescriptorsRef.current.push(Array.from(detection.descriptor));
        const currentCount = stabilityDescriptorsRef.current.length;
        setStabilityProgress(currentCount);

        if (currentCount < 3) {
          return;
        }

        // Average collected descriptors
        const avgEmbedding = averageEmbeddings(stabilityDescriptorsRef.current);
        const stored   = storedEmbeddingRef.current!;
        const distance = euclideanDistance(avgEmbedding, stored);

        // Reset stability counter after check
        stabilityDescriptorsRef.current = [];
        setStabilityProgress(0);

        if (distance <= MATCH_THRESHOLD) {
          /* ✅ Match */
          doneRef.current = true;
          if (intervalRef.current) { clearInterval(intervalRef.current); intervalRef.current = null; }
          setScanState("matched");
          setScanMessage("Face matched! Marking attendance…");
          await markAttendance();
        } else {
          /* ❌ Face detected but does not match */
          hadFaceAttemptsRef.current = true;
          setScanMessage("Face not recognized — please look directly at the camera.");
          setFaceQualityValid(false);
        }
      } catch {
        /* ignore per-frame errors */
      } finally {
        busyRef.current = false;
      }
    };

    intervalRef.current = setInterval(tick, 500);
    return () => {
      if (intervalRef.current) { clearInterval(intervalRef.current); intervalRef.current = null; }
    };
  }, [open, mode, modelsLoaded, scanState, markAttendance]);

  /* ── Retry scan ──────────────────────────────────────────────── */
  const retryScan = () => {
    setMatchedUser(null);
    doneRef.current  = false;
    busyRef.current  = false;
    setFacePresent(false);
    setFaceQualityValid(false);
    setScanState("scanning");
    setScanMessage("Position your face inside the circle");
  };

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-md"
        >
          <motion.div
            initial={{ scale: 0.88, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.88, opacity: 0 }}
            transition={{ type: "spring", stiffness: 260, damping: 24 }}
            className="glass rounded-3xl p-6 w-full max-w-sm glow relative"
          >
            {/* Header */}
            <div className="flex items-center justify-between mb-5">
              <h2 className="text-lg font-semibold text-white flex items-center gap-2">
                <ScanFace className="w-5 h-5 text-indigo-400" />
                Face Verification
              </h2>
              <button
                onClick={onClose}
                className="p-1.5 rounded-lg hover:bg-white/5 text-gray-400 hover:text-white transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* ════════════════════════════════════════════════════
                SUCCESS state
            ════════════════════════════════════════════════════ */}
            <AnimatePresence mode="wait">
              {(scanState === "success" || scanState === "already") && (
                <motion.div
                  key="success"
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0 }}
                  className="text-center py-6"
                >
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ type: "spring", stiffness: 200 }}
                  >
                    <CheckCircle2 className="w-16 h-16 text-emerald-400 mx-auto mb-4" />
                  </motion.div>
                  <h3 className="text-xl font-bold text-emerald-400 mb-2">
                    {scanState === "already" ? "Already Marked" : "Attendance Marked! ✅"}
                  </h3>
                  {matchedUser && (
                    <div className="mb-4 text-sm text-gray-300 space-y-0.5">
                      <p className="font-semibold text-white text-base">{matchedUser.name}</p>
                      {matchedUser.rollNumber && <p>Roll No: {matchedUser.rollNumber}</p>}
                    </div>
                  )}
                  <p className="text-gray-400 text-sm mb-6">{scanMessage}</p>
                  <GradientButton onClick={onClose} className="w-full">
                    Done
                  </GradientButton>
                </motion.div>
              )}

              {/* ════════════════════════════════════════════════════
                  NO_MATCH modal
              ════════════════════════════════════════════════════ */}
              {scanState === "no_match" && (
                <motion.div
                  key="no_match"
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0 }}
                  className="text-center py-6"
                >
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ type: "spring", stiffness: 200 }}
                    className="w-20 h-20 rounded-full bg-red-500/15 flex items-center justify-center mx-auto mb-4"
                  >
                    <XCircle className="w-10 h-10 text-red-400" />
                  </motion.div>
                  <h3 className="text-xl font-bold text-red-400 mb-2">❌ {failureTitle || "Face Not Recognized"}</h3>
                  <p className="text-gray-400 text-sm mb-6 leading-relaxed max-w-xs mx-auto">
                    {failureMessage || "The detected face does not match the registered face. Please try again."}
                  </p>
                  <div className="flex gap-3">
                    <GradientButton onClick={retryScan} className="flex-1">
                      Retry
                    </GradientButton>
                    <button
                      onClick={onClose}
                      className="px-5 py-3 rounded-xl border border-white/10 text-gray-300 hover:text-white hover:bg-white/5 transition-all text-sm"
                    >
                      Cancel
                    </button>
                  </div>
                </motion.div>
              )}

              {/* ════════════════════════════════════════════════════
                  ERROR state
              ════════════════════════════════════════════════════ */}
              {scanState === "error" && (
                <motion.div
                  key="error"
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0 }}
                  className="text-center py-6"
                >
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ type: "spring", stiffness: 200 }}
                  >
                    <AlertCircle className="w-16 h-16 text-amber-400 mx-auto mb-4" />
                  </motion.div>
                  <h3 className="text-xl font-bold text-amber-400 mb-2">Something went wrong</h3>
                  <p className="text-gray-400 text-sm mb-6">{scanMessage}</p>
                  <div className="flex gap-3">
                    <GradientButton onClick={retryScan} className="flex-1">
                      Retry
                    </GradientButton>
                    <button
                      onClick={onClose}
                      className="px-5 py-3 rounded-xl border border-white/10 text-gray-300 hover:text-white hover:bg-white/5 transition-all text-sm"
                    >
                      Cancel
                    </button>
                  </div>
                </motion.div>
              )}

              {/* ════════════════════════════════════════════════════
                  SCANNING / LOADING — circular scanner view
              ════════════════════════════════════════════════════ */}
              {(scanState === "loading" || scanState === "scanning" || scanState === "detected" || scanState === "matched") && (
                <motion.div
                  key="scanner"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="flex flex-col items-center gap-5"
                >
                  {scanState === "loading" ? (
                    /* Loading spinner before models/embedding ready */
                    <div
                      className="rounded-full bg-black/70 border-[10px] border-indigo-500/30 flex items-center justify-center"
                      style={{ width: 296, height: 296 }}
                    >
                      <div className="text-center">
                        <Loader2 className="w-10 h-10 animate-spin text-indigo-400 mx-auto mb-2" />
                        <p className="text-xs text-gray-400 px-4 text-center">{scanMessage}</p>
                      </div>
                    </div>
                  ) : (
                    /* Circular scanner with live webcam */
                    <div style={{ marginBottom: 40 }}>
                      <CircularScanner faceDetected={facePresent} isValid={faceQualityValid} size={296}>
                        <Webcam
                          ref={webcamRef}
                          screenshotFormat="image/jpeg"
                          className="w-full h-full object-cover"
                          mirrored
                          style={{ borderRadius: "50%" }}
                        />
                      </CircularScanner>
                    </div>
                  )}

                  {/* Status message */}
                  <div className="text-center px-2">
                    <p className={`text-sm font-medium ${
                      scanState === "matched"
                        ? "text-emerald-400"
                        : faceQualityValid
                        ? "text-emerald-400"
                        : facePresent
                        ? "text-amber-400"
                        : "text-gray-300"
                    }`}>
                      {scanMessage}
                    </p>
                  </div>

                  {/* Stability progress dots */}
                  {faceQualityValid && stabilityProgress > 0 && stabilityProgress < 3 && (
                    <motion.div
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      className="flex items-center gap-2 mt-1"
                    >
                      {Array.from({ length: 3 }).map((_, i) => (
                        <motion.div
                          key={i}
                          initial={{ scale: 0.6 }}
                          animate={{
                            scale: i < stabilityProgress ? 1.15 : 0.8,
                            backgroundColor: i < stabilityProgress ? "rgb(52,211,153)" : "rgba(255,255,255,0.12)",
                          }}
                          transition={{ duration: 0.25 }}
                          className="w-2 h-2 rounded-full"
                        />
                      ))}
                      <span className="text-[11px] text-emerald-300 ml-1 font-medium">Analyzing face... Hold steady</span>
                    </motion.div>
                  )}

                  {/* Countdown Timer Badge */}
                  {scanState === "scanning" && timeLeft !== null && (
                    <div className="text-xs bg-white/5 border border-white/10 px-2.5 py-1 rounded-full text-gray-400 flex items-center gap-1.5 mt-1">
                      <span className="w-1.5 h-1.5 rounded-full bg-indigo-400 animate-pulse" />
                      Time Remaining: <span className="font-semibold text-white">{timeLeft}s</span>
                    </div>
                  )}

                  {/* Matching / processing indicator */}
                  {scanState === "matched" && (
                    <div className="flex items-center gap-2 text-sm text-indigo-300">
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Marking attendance…
                    </div>
                  )}

                  {/* Tip */}
                  {(scanState === "scanning" || scanState === "detected") && (
                    <p className="text-xs text-gray-500 text-center max-w-[220px]">
                      Hold your face steady inside the circle. Capture is automatic.
                    </p>
                  )}
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
