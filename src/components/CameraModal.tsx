"use client";

import { useState, useRef, useCallback, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Webcam from "react-webcam";
import { X, Loader2, CheckCircle2, AlertCircle, ScanFace, XCircle } from "lucide-react";
import GradientButton from "./ui/GradientButton";
import CircularScanner from "./CircularScanner";
import * as faceapi from "face-api.js";
import { validateFaceQuality } from "@/lib/faceValidation";

/* ─────────────────────────────────────────────────────────────────
   face-api descriptors: euclidean distance — lower = more similar.
   ~0.5 is a well-tuned threshold for TinyFaceDetector.
──────────────────────────────────────────────────────────────────── */
const MATCH_THRESHOLD = 0.5;

function euclideanDistance(a: number[], b: number[]): number {
  let sum = 0;
  for (let i = 0; i < a.length; i++) { const d = a[i] - b[i]; sum += d * d; }
  return Math.sqrt(sum);
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
          return;
        }

        setFacePresent(true);

        // Run quality check on the frame
        const quality = validateFaceQuality(detection, img.width, img.height);
        if (!quality.valid) {
          setFaceQualityValid(false);
          setScanState("scanning");
          setScanMessage(quality.hint);
          return;
        }

        setFaceQualityValid(true);
        setScanMessage("Verifying face... Hold steady");

        const live     = Array.from(detection.descriptor);
        const stored   = storedEmbeddingRef.current!;
        const distance = euclideanDistance(live, stored);

        if (distance <= MATCH_THRESHOLD) {
          /* ✅ Match */
          doneRef.current = true;
          if (intervalRef.current) { clearInterval(intervalRef.current); intervalRef.current = null; }
          setScanState("matched");
          setScanMessage("Face matched! Marking attendance…");
          await markAttendance();
        } else {
          /* ❌ Face detected but does not match */
          doneRef.current = true;
          if (intervalRef.current) { clearInterval(intervalRef.current); intervalRef.current = null; }
          setScanState("no_match");
          setScanMessage("Face does not match the registered face.");
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
                  <h3 className="text-xl font-bold text-red-400 mb-2">❌ Face Not Matched</h3>
                  <p className="text-gray-400 text-sm mb-6 leading-relaxed max-w-xs mx-auto">
                    The detected face does not match your registered face.
                    Please ensure proper lighting and that your face is clearly visible, then try again.
                  </p>
                  <div className="flex gap-3">
                    <GradientButton onClick={retryScan} className="flex-1">
                      Try Again
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
