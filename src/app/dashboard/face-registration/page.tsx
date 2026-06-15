"use client";

import { useState, useRef, useCallback, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Webcam from "react-webcam";
import * as faceapi from "face-api.js";
import {
  CheckCircle2,
  Loader2,
  AlertCircle,
  ScanFace,
  ChevronRight,
  Lightbulb,
  Eye,
  Glasses,
  Camera,
  Move,
  Play,
  RefreshCw,
} from "lucide-react";
import GlassCard from "@/components/ui/GlassCard";
import GradientButton from "@/components/ui/GradientButton";
import LoadingSpinner from "@/components/ui/LoadingSpinner";
import CircularScanner from "@/components/CircularScanner";
import FacePoseIllustration, { PoseDirection } from "@/components/FacePoseIllustration";

/* ── Pose configuration ──────────────────────────────────────────── */
const POSES: { label: string; direction: PoseDirection; instruction: string }[] = [
  { label: "Front Face",   direction: "front", instruction: "Please look straight at the camera." },
  { label: "Left Face",    direction: "left",  instruction: "Please turn your face to the left." },
  { label: "Right Face",   direction: "right", instruction: "Please turn your face to the right." },
  { label: "Slight Up",    direction: "up",    instruction: "Please tilt your face slightly upward." },
  { label: "Slight Down",  direction: "down",  instruction: "Please tilt your face slightly downward." },
];

/* ── Tutorial tips ───────────────────────────────────────────────── */
const TIPS = [
  { icon: Lightbulb, text: "Ensure you are in a well-lit area — avoid strong back-lighting." },
  { icon: Eye,       text: "Keep your face fully visible inside the circular frame." },
  { icon: Glasses,   text: "Remove sunglasses, masks, or any face coverings." },
  { icon: Camera,    text: "Hold your device steady during each capture." },
  { icon: Move,      text: "Follow the on-screen pose guide for each of the 5 angles." },
];

/* ═══════════════════════════════════════════════════════════════════
   HEAD-POSE ESTIMATION FROM 68-POINT LANDMARKS
   ─────────────────────────────────────────────────────────────────
   We estimate yaw (left/right rotation) and pitch (up/down tilt)
   from the 2D landmark positions on the UNMIRRORED webcam frame.

   Yaw:
     - Nose tip (pt 30) position relative to face width (pts 0–16).
     - Negative → user turned head to THEIR LEFT.
     - Positive → user turned head to THEIR RIGHT.

   Pitch:
     - Ratio of (nose-bottom to eye) vs (chin to eye) vertical span.
     - Lower ratio → tilted UP.  Higher ratio → tilted DOWN.
═════════════════════════════════════════════════════════════════════ */
interface HeadPose { yaw: number; pitch: number }

function estimateHeadPose(landmarks: faceapi.FaceLandmarks68): HeadPose {
  const pts = landmarks.positions;

  // ── Yaw ──
  const noseTip = pts[30];
  const leftJaw = pts[0];   // subject's right jaw → left of unmirrored image
  const rightJaw = pts[16]; // subject's left jaw  → right of unmirrored image
  const leftDist  = noseTip.x - leftJaw.x;
  const rightDist = rightJaw.x - noseTip.x;
  const yaw = (rightDist - leftDist) / (rightDist + leftDist);

  // ── Pitch ──
  const eyeY =
    (pts[36].y + pts[39].y + pts[42].y + pts[45].y) / 4; // eye corner avg
  const noseBottomY = pts[33].y; // bottom of nose
  const chinY = pts[8].y;        // chin
  const pitch = (noseBottomY - eyeY) / (chinY - eyeY);

  return { yaw, pitch };
}

/* ── Pose thresholds ─────────────────────────────────────────────
   Tunable per-step thresholds. Values were calibrated for typical
   laptop/phone webcams at ~50 cm distance.
──────────────────────────────────────────────────────────────────── */
function isPoseCorrectForStep(
  { yaw, pitch }: HeadPose,
  stepIndex: number
): boolean {
  switch (stepIndex) {
    case 0: // Front Face
      return Math.abs(yaw) < 0.10 && pitch > 0.38 && pitch < 0.56;
    case 1: // Left Face  (user turns their head LEFT → yaw < 0)
      return yaw < -0.12;
    case 2: // Right Face (user turns their head RIGHT → yaw > 0)
      return yaw > 0.12;
    case 3: // Slight Up  (pitch drops when tilting up)
      return pitch < 0.40 && Math.abs(yaw) < 0.20;
    case 4: // Slight Down (pitch rises when tilting down)
      return pitch > 0.55 && Math.abs(yaw) < 0.20;
    default:
      return false;
  }
}

/* ── Build a contextual hint based on current pose vs required pose */
function getPoseHint(
  { yaw, pitch }: HeadPose,
  stepIndex: number
): string {
  const pose = POSES[stepIndex];
  switch (stepIndex) {
    case 0:
      if (Math.abs(yaw) >= 0.10)
        return "Your face is turned to the side — please look straight ahead.";
      if (pitch <= 0.38)
        return "Your face is tilted too far up — please look straight ahead.";
      if (pitch >= 0.56)
        return "Your face is tilted too far down — please look straight ahead.";
      break;
    case 1:
      if (yaw >= -0.12)
        return "Please turn your face more to the left.";
      break;
    case 2:
      if (yaw <= 0.12)
        return "Please turn your face more to the right.";
      break;
    case 3:
      if (pitch >= 0.40)
        return "Please tilt your face upward a bit more.";
      if (Math.abs(yaw) >= 0.20)
        return "Keep your face centered — just tilt upward.";
      break;
    case 4:
      if (pitch <= 0.55)
        return "Please tilt your face downward a bit more.";
      if (Math.abs(yaw) >= 0.20)
        return "Keep your face centered — just tilt downward.";
      break;
  }
  return pose.instruction;
}

/* ═══════════════════════════════════════════════════════════════════
   AUDIO BEEP  (Web Audio API — no external files)
═════════════════════════════════════════════════════════════════════ */
function playBeep() {
  try {
    const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
    if (!AudioCtx) return;
    const ctx  = new AudioCtx();
    const osc  = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.type = "sine";
    // Quick ascending two-tone: D5 → A5
    osc.frequency.setValueAtTime(587, ctx.currentTime);
    osc.frequency.setValueAtTime(880, ctx.currentTime + 0.07);
    gain.gain.setValueAtTime(0.22, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.22);
    osc.start(ctx.currentTime);
    osc.stop(ctx.currentTime + 0.22);
    setTimeout(() => ctx.close(), 500);
  } catch {
    // Audio not available — silently fail
  }
}

/* ── Flow stages ─────────────────────────────────────────────────── */
type Stage = "idle" | "tutorial" | "scanning" | "processing" | "done";

/* ═══════════════════════════════════════════════════════════════════
   COMPONENT
═════════════════════════════════════════════════════════════════════ */
export default function FaceRegistrationPage() {
  const webcamRef         = useRef<Webcam>(null);
  const scanActiveRef     = useRef(false);
  const embeddingsRef     = useRef<number[][]>([]);
  const captureCountRef   = useRef(0);
  const captureFlashTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const [stage, setStage]                   = useState<Stage>("idle");
  const [modelsLoaded, setModelsLoaded]     = useState(false);
  const [loading, setLoading]               = useState(true);
  const [currentCapture, setCurrentCapture] = useState(0);
  const [poseCorrect, setPoseCorrect]       = useState(false);
  const [facePresent, setFacePresent]       = useState(false);
  const [showFlash, setShowFlash]           = useState(false);
  const [error, setError]                   = useState("");
  const [poseHint, setPoseHint]             = useState("");
  const [alreadyRegistered, setAlreadyRegistered] = useState(false);

  /* ── Load models + check registration status ─────────────────── */
  useEffect(() => {
    async function init() {
      try {
        try {
          const statusRes  = await fetch("/api/face/status");
          const statusData = await statusRes.json();
          if (statusData.registered) setAlreadyRegistered(true);
        } catch { /* non-fatal */ }

        await Promise.all([
          faceapi.nets.tinyFaceDetector.loadFromUri("https://justadudewhohacks.github.io/face-api.js/models"),
          faceapi.nets.faceLandmark68Net.loadFromUri("https://justadudewhohacks.github.io/face-api.js/models"),
          faceapi.nets.faceRecognitionNet.loadFromUri("https://justadudewhohacks.github.io/face-api.js/models"),
        ]);
        setModelsLoaded(true);
      } catch {
        setError("Failed to load face recognition models. Please refresh.");
      } finally {
        setLoading(false);
      }
    }
    init();
  }, []);

  /* ── Single-frame face detection ─────────────────────────────── */
  const doDetect = useCallback(async () => {
    if (!webcamRef.current || !modelsLoaded) return null;
    try {
      const imageSrc = webcamRef.current.getScreenshot();
      if (!imageSrc) return null;
      const img = await faceapi.fetchImage(imageSrc);
      return await faceapi
        .detectSingleFace(img, new faceapi.TinyFaceDetectorOptions())
        .withFaceLandmarks()
        .withFaceDescriptor();
    } catch { return null; }
  }, [modelsLoaded]);

  /* ══════════════════════════════════════════════════════════════
     SCANNING LOOP — with strict per-step pose validation
  ═══════════════════════════════════════════════════════════════ */
  useEffect(() => {
    if (stage !== "scanning") return;

    scanActiveRef.current   = true;
    embeddingsRef.current   = [];
    captureCountRef.current = 0;
    setCurrentCapture(0);
    setPoseCorrect(false);
    setFacePresent(false);
    setError("");
    setPoseHint("");

    const CAPTURE_GAP = 1800; // ms pause between captures
    let readyForNext  = true;

    const interval = setInterval(async () => {
      if (!scanActiveRef.current || !readyForNext) return;
      readyForNext = false;

      const detection = await doDetect();

      if (!scanActiveRef.current) return; // stopped while awaiting

      if (!detection) {
        /* ─── No face at all ─── */
        setFacePresent(false);
        setPoseCorrect(false);
        setPoseHint("");
        setError("No face detected — position your face inside the circle.");
        setTimeout(() => { readyForNext = true; }, 400);
        return;
      }

      /* ─── Face found — estimate head pose ─── */
      setFacePresent(true);
      setError("");

      const currentStep = captureCountRef.current;
      const pose = estimateHeadPose(detection.landmarks);
      const correct = isPoseCorrectForStep(pose, currentStep);

      if (!correct) {
        /* Pose doesn't match — show hint, keep scanning */
        setPoseCorrect(false);
        setPoseHint(getPoseHint(pose, currentStep));
        setTimeout(() => { readyForNext = true; }, 300); // recheck quickly
        return;
      }

      /* ─── Correct pose! Capture this frame ─── */
      setPoseCorrect(true);
      setPoseHint("");

      // Flash + beep
      setShowFlash(true);
      playBeep();
      if (captureFlashTimer.current) clearTimeout(captureFlashTimer.current);
      captureFlashTimer.current = setTimeout(() => setShowFlash(false), 600);

      const descriptor = Array.from(detection.descriptor);
      embeddingsRef.current = [...embeddingsRef.current, descriptor];
      const count = captureCountRef.current + 1;
      captureCountRef.current = count;
      setCurrentCapture(count);

      if (count >= POSES.length) {
        /* ── All 5 poses captured — save ── */
        scanActiveRef.current = false;
        clearInterval(interval);
        setStage("processing");

        try {
          const avg = averageEmbeddings(embeddingsRef.current);
          const res = await fetch("/api/face/register", {
            method:  "POST",
            headers: { "Content-Type": "application/json" },
            body:    JSON.stringify({ embedding: avg }),
          });
          const data = await res.json();
          if (data.success) {
            setStage("done");
          } else {
            setError(data.error || "Registration failed. Please try again.");
            setStage("scanning");
            scanActiveRef.current = true;
          }
        } catch {
          setError("Failed to save face data. Please try again.");
          setStage("scanning");
          scanActiveRef.current = true;
        }
        return;
      }

      /* Reset pose flags for the NEXT step, pause before re-scanning */
      setPoseCorrect(false);
      setTimeout(() => { readyForNext = true; }, CAPTURE_GAP);
    }, 600);

    return () => {
      scanActiveRef.current = false;
      clearInterval(interval);
    };
  }, [stage, doDetect]);

  /* ── Helpers ─────────────────────────────────────────────────── */
  function averageEmbeddings(emb: number[][]): number[] {
    const avg = new Array(emb[0].length).fill(0);
    for (const e of emb)
      for (let i = 0; i < e.length; i++) avg[i] += e[i] / emb.length;
    return avg;
  }

  const goToTutorial = () => { setError(""); setStage("tutorial"); };
  const startCapture = () => { setError(""); setStage("scanning"); };
  const reset = () => {
    setStage("idle");
    setCurrentCapture(0);
    setPoseCorrect(false);
    setFacePresent(false);
    setError("");
    setPoseHint("");
    setAlreadyRegistered(true);
  };

  /* ── Loading screen ──────────────────────────────────────────── */
  if (loading) return <LoadingSpinner text="Loading face recognition models..." />;

  /* ── Current pose helper (clamped to valid index) ────────────── */
  const ci = Math.min(currentCapture, POSES.length - 1);

  return (
    <div className="max-w-3xl mx-auto">
      <AnimatePresence mode="wait">

        {/* ════════════════════════════════════════════════════════
            STAGE: idle  (already registered / fresh start)
        ════════════════════════════════════════════════════════ */}
        {stage === "idle" && (
          <motion.div
            key="idle"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="text-center"
          >
            <h1 className="text-2xl md:text-3xl font-bold text-white mb-2">Face Registration</h1>
            <p className="text-gray-400 mb-8">Register your face to use attendance features</p>

            {error && <ErrorBanner message={error} />}

            {alreadyRegistered ? (
              <GlassCard glow="cyan" className="!p-12">
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ type: "spring", stiffness: 200, delay: 0.2 }}
                  className="w-24 h-24 rounded-full bg-emerald-500/20 flex items-center justify-center mx-auto mb-6"
                >
                  <CheckCircle2 className="w-12 h-12 text-emerald-400" />
                </motion.div>
                <h2 className="text-2xl font-bold text-emerald-400 mb-3">✅ Face Registered</h2>
                <p className="text-gray-400 mb-8 max-w-md mx-auto">
                  Your face is already registered. You can now mark attendance. If your appearance has
                  changed, re-register to update your facial signature.
                </p>
                <GradientButton onClick={goToTutorial} disabled={!modelsLoaded} className="px-10">
                  <RefreshCw className="w-5 h-5" />
                  Re-register Face
                </GradientButton>
              </GlassCard>
            ) : (
              <GlassCard glow="indigo" className="!p-12">
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ type: "spring", stiffness: 200, delay: 0.2 }}
                  className="w-24 h-24 rounded-full bg-indigo-500/20 flex items-center justify-center mx-auto mb-6"
                >
                  <ScanFace className="w-12 h-12 text-indigo-400" />
                </motion.div>
                <h2 className="text-xl font-semibold text-white mb-3">Ready to Register Your Face?</h2>
                <p className="text-gray-400 mb-8 max-w-md mx-auto">
                  We'll capture your face from 5 different angles to create a secure facial signature.
                </p>
                <GradientButton
                  onClick={goToTutorial}
                  disabled={!modelsLoaded}
                  loading={!modelsLoaded && !error}
                  className="px-10"
                >
                  <Play className="w-5 h-5" />
                  {!modelsLoaded && !error ? "Loading models…" : "Start Face Registration"}
                </GradientButton>
              </GlassCard>
            )}
          </motion.div>
        )}

        {/* ════════════════════════════════════════════════════════
            STAGE: tutorial
        ════════════════════════════════════════════════════════ */}
        {stage === "tutorial" && (
          <motion.div
            key="tutorial"
            initial={{ opacity: 0, x: 40 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -40 }}
          >
            <h1 className="text-2xl md:text-3xl font-bold text-white mb-1 text-center">
              Before We Begin
            </h1>
            <p className="text-gray-400 text-center mb-8">
              Follow these tips for the best registration result
            </p>

            <GlassCard glow="indigo" className="!p-8 mb-6">
              <div className="space-y-4">
                {TIPS.map(({ icon: Icon, text }, i) => (
                  <motion.div
                    key={i}
                    initial={{ opacity: 0, x: -16 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: i * 0.08 }}
                    className="flex items-start gap-4 p-3 rounded-xl bg-white/5 border border-white/5"
                  >
                    <div className="w-9 h-9 rounded-lg bg-indigo-500/20 flex items-center justify-center flex-shrink-0 mt-0.5">
                      <Icon className="w-4 h-4 text-indigo-400" />
                    </div>
                    <p className="text-sm text-gray-300 leading-relaxed">{text}</p>
                  </motion.div>
                ))}
              </div>
            </GlassCard>

            {/* Pose preview strip */}
            <GlassCard className="!p-6 mb-8">
              <p className="text-sm font-medium text-gray-400 mb-4 text-center">5 Capture Angles</p>
              <div className="flex justify-center gap-4 flex-wrap">
                {POSES.map((p, i) => (
                  <motion.div
                    key={p.label}
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: 0.4 + i * 0.08 }}
                    className="flex flex-col items-center gap-2"
                  >
                    <div className="w-14 h-14 rounded-full bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center">
                      <FacePoseIllustration direction={p.direction} size={44} />
                    </div>
                    <span className="text-[10px] text-gray-500 font-medium text-center leading-tight w-14">{p.label}</span>
                    <span className="w-5 h-5 rounded-full bg-indigo-500/20 text-indigo-300 text-[10px] font-bold flex items-center justify-center">{i + 1}</span>
                  </motion.div>
                ))}
              </div>
            </GlassCard>

            <div className="flex gap-3 justify-center">
              <button
                onClick={() => setStage("idle")}
                className="px-6 py-3 rounded-xl border border-white/10 text-gray-300 hover:text-white hover:bg-white/5 transition-all text-sm"
              >
                ← Back
              </button>
              <GradientButton onClick={startCapture} className="px-12">
                <Camera className="w-5 h-5" />
                Start Capture
              </GradientButton>
            </div>
          </motion.div>
        )}

        {/* ════════════════════════════════════════════════════════
            STAGE: scanning  (per-pose with strict validation)
        ════════════════════════════════════════════════════════ */}
        {stage === "scanning" && (
          <motion.div
            key="scanning"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
          >
            <h1 className="text-2xl md:text-3xl font-bold text-white mb-1 text-center">
              Face Registration
            </h1>
            <p className="text-gray-400 text-center mb-6">
              Capture{" "}
              <span className="text-indigo-400 font-semibold">
                {currentCapture + 1} of {POSES.length}
              </span>
              {" "}— {POSES[ci].label}
            </p>

            <div className="flex flex-col items-center gap-8">
              {/* ── Pose guide card ── */}
              <AnimatePresence mode="wait">
                <motion.div
                  key={currentCapture}
                  initial={{ opacity: 0, scale: 0.9, y: 10 }}
                  animate={{ opacity: 1, scale: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.9, y: -10 }}
                  transition={{ duration: 0.3 }}
                  className="flex flex-col items-center gap-3 p-5 rounded-2xl border border-indigo-500/20 bg-indigo-500/5 backdrop-blur-sm w-full max-w-xs text-center"
                >
                  <div className="w-24 h-24 rounded-full bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center">
                    <FacePoseIllustration
                      direction={POSES[ci].direction}
                      size={72}
                      active
                    />
                  </div>
                  <div>
                    <p className="font-semibold text-white text-sm">
                      {POSES[ci].label}
                    </p>
                    <p className="text-gray-400 text-xs mt-1 leading-relaxed">
                      {POSES[ci].instruction}
                    </p>
                  </div>
                </motion.div>
              </AnimatePresence>

              {/* ── Circular scanner ── */}
              <div className="relative" style={{ marginBottom: 48 }}>
                <CircularScanner faceDetected={poseCorrect} size={320} showCaptureFlash={showFlash}>
                  <Webcam
                    ref={webcamRef}
                    screenshotFormat="image/jpeg"
                    className="w-full h-full object-cover"
                    mirrored
                    style={{ borderRadius: "50%" }}
                  />
                </CircularScanner>
              </div>

              {/* ── Pose hint / error ── */}
              {error && <ErrorBanner message={error} />}
              {!error && poseHint && facePresent && !poseCorrect && (
                <motion.div
                  key={poseHint}
                  initial={{ opacity: 0, y: -4 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="flex items-center gap-2 bg-amber-500/10 border border-amber-500/20 rounded-xl p-3 text-sm text-amber-400 w-full max-w-sm mx-auto text-center"
                >
                  <AlertCircle className="w-4 h-4 flex-shrink-0" />
                  {poseHint}
                </motion.div>
              )}

              {/* ── Status text ── */}
              <div className="flex items-center gap-2 text-sm">
                {poseCorrect ? (
                  <>
                    <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                    <span className="text-emerald-400 font-medium">Pose matched — captured ✓</span>
                  </>
                ) : facePresent ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin text-amber-400" />
                    <span className="text-amber-400">Face detected — adjust your pose</span>
                  </>
                ) : (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin text-indigo-400" />
                    <span className="text-gray-400">Scanning for face…</span>
                  </>
                )}
              </div>

              {/* ── Progress dots ── */}
              <div className="flex items-center gap-2 mt-2">
                {POSES.map((_, i) => {
                  const done   = i < currentCapture;
                  const active = i === currentCapture;
                  return (
                    <motion.div
                      key={i}
                      animate={active ? { scale: [1, 1.3, 1] } : {}}
                      transition={{ duration: 0.8, repeat: Infinity }}
                      className={`rounded-full transition-all duration-300 ${
                        done   ? "w-3 h-3 bg-emerald-400"   :
                        active ? "w-4 h-4 bg-indigo-400"    :
                                 "w-2.5 h-2.5 bg-white/20"
                      }`}
                    />
                  );
                })}
              </div>

              {/* ── Progress bar ── */}
              <div className="w-full max-w-xs">
                <div className="flex justify-between text-xs text-gray-500 mb-1.5">
                  <span>Progress</span>
                  <span>{currentCapture} / {POSES.length}</span>
                </div>
                <div className="h-1.5 rounded-full bg-white/5 overflow-hidden">
                  <motion.div
                    className="h-full bg-gradient-to-r from-indigo-500 to-cyan-400 rounded-full"
                    animate={{ width: `${(currentCapture / POSES.length) * 100}%` }}
                    transition={{ duration: 0.5 }}
                  />
                </div>
              </div>

              {/* ── Step list ── */}
              <GlassCard className="!p-4 w-full max-w-xs">
                <div className="space-y-2">
                  {POSES.map((pose, i) => {
                    const done   = i < currentCapture;
                    const active = i === currentCapture;
                    return (
                      <div
                        key={pose.label}
                        className={`flex items-center gap-3 px-3 py-2 rounded-lg transition-all ${
                          done   ? "bg-emerald-500/10 border border-emerald-500/20" :
                          active ? "bg-indigo-500/10 border border-indigo-500/20"   :
                                   "bg-white/3 border border-white/5"
                        }`}
                      >
                        <div
                          className={`w-7 h-7 rounded-md flex items-center justify-center text-xs font-bold flex-shrink-0 ${
                            done   ? "bg-emerald-500 text-white"  :
                            active ? "bg-indigo-500 text-white"   :
                                     "bg-white/10 text-gray-500"
                          }`}
                        >
                          {done ? <CheckCircle2 className="w-3.5 h-3.5" /> : i + 1}
                        </div>
                        <span
                          className={`text-xs font-medium ${
                            done   ? "text-emerald-300" :
                            active ? "text-white"        :
                                     "text-gray-500"
                          }`}
                        >
                          {pose.label}
                        </span>
                        {done && <ChevronRight className="w-3.5 h-3.5 text-emerald-400 ml-auto" />}
                      </div>
                    );
                  })}
                </div>
              </GlassCard>
            </div>
          </motion.div>
        )}

        {/* ════════════════════════════════════════════════════════
            STAGE: processing
        ════════════════════════════════════════════════════════ */}
        {stage === "processing" && (
          <motion.div
            key="processing"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="flex flex-col items-center justify-center gap-6 py-24"
          >
            <motion.div
              className="w-20 h-20 rounded-full bg-indigo-500/20 flex items-center justify-center"
              animate={{ scale: [1, 1.1, 1] }}
              transition={{ duration: 1.2, repeat: Infinity }}
            >
              <Loader2 className="w-10 h-10 animate-spin text-indigo-400" />
            </motion.div>
            <p className="text-white font-semibold">Saving your facial signature…</p>
            <p className="text-gray-500 text-sm">Please wait a moment</p>
          </motion.div>
        )}

        {/* ════════════════════════════════════════════════════════
            STAGE: done  (success)
        ════════════════════════════════════════════════════════ */}
        {stage === "done" && (
          <motion.div
            key="done"
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0 }}
          >
            <GlassCard glow="cyan" className="!p-12 text-center">
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ type: "spring", stiffness: 200, delay: 0.1 }}
                className="w-24 h-24 rounded-full bg-emerald-500/20 flex items-center justify-center mx-auto mb-6"
              >
                <CheckCircle2 className="w-12 h-12 text-emerald-400" />
              </motion.div>

              <motion.h2
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.25 }}
                className="text-2xl font-bold text-emerald-400 mb-3"
              >
                ✅ Face Registration Completed Successfully
              </motion.h2>
              <motion.p
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.35 }}
                className="text-gray-400 mb-8 max-w-sm mx-auto"
              >
                Your face has been captured from all 5 angles and saved securely.
                You can now use face recognition to mark attendance.
              </motion.p>

              <div className="flex gap-3 justify-center flex-wrap">
                <GradientButton onClick={reset}>
                  <RefreshCw className="w-4 h-4" />
                  Register Again
                </GradientButton>
                <a
                  href="/dashboard"
                  className="px-6 py-3 rounded-xl border border-white/10 text-gray-300 hover:text-white hover:bg-white/5 transition-all text-sm font-medium"
                >
                  Go to Dashboard
                </a>
              </div>
            </GlassCard>
          </motion.div>
        )}

      </AnimatePresence>
    </div>
  );
}

/* ── Error banner sub-component ──────────────────────────────────── */
function ErrorBanner({ message }: { message: string }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: -5 }}
      animate={{ opacity: 1, y: 0 }}
      className="flex items-center gap-2 bg-red-500/10 border border-red-500/20 rounded-xl p-3 mb-4 text-sm text-red-400 w-full max-w-md mx-auto"
    >
      <AlertCircle className="w-4 h-4 flex-shrink-0" />
      {message}
    </motion.div>
  );
}
