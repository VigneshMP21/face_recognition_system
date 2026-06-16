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
import {
  POSES,
  estimateHeadPose,
  isPoseCorrectForStep,
  getPoseHint,
  validateFaceQuality,
} from "@/lib/faceValidation";

/* ── Tutorial tips ───────────────────────────────────────────────── */
const TIPS = [
  { icon: Lightbulb, text: "Ensure you are in a well-lit area — avoid strong back-lighting." },
  { icon: Eye,       text: "Keep your face fully visible inside the circular frame." },
  { icon: Glasses,   text: "Remove sunglasses, masks, or any face coverings." },
  { icon: Camera,    text: "Hold your device steady during each capture." },
  { icon: Move,      text: "Follow the on-screen pose guide for each of the 5 angles." },
];

/* ═══════════════════════════════════════════════════════════════════
   CONSTANTS
   ───────────────────────────────────────────────────────────────── */
/** Number of consecutive "all-good" frames required before capture */
const REQUIRED_STABLE_FRAMES = 3;
/** ms to wait between scans during stability accumulation */
const SCAN_INTERVAL_MS = 500;
/** ms pause after a successful capture before scanning the next pose */
const CAPTURE_GAP_MS = 1800;


/* ═══════════════════════════════════════════════════════════════════
   AUDIO BEEP (Web Audio API)
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
    osc.frequency.setValueAtTime(587, ctx.currentTime);       // D5
    osc.frequency.setValueAtTime(880, ctx.currentTime + 0.07); // A5
    gain.gain.setValueAtTime(0.22, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.22);
    osc.start(ctx.currentTime);
    osc.stop(ctx.currentTime + 0.22);
    setTimeout(() => ctx.close(), 500);
  } catch { /* silently fail */ }
}

/* ── Flow stages ─────────────────────────────────────────────────── */
type Stage = "idle" | "tutorial" | "scanning" | "processing" | "done";

/* ═══════════════════════════════════════════════════════════════════
   COMPONENT
═════════════════════════════════════════════════════════════════════ */
export default function FaceRegistrationPage() {
  const webcamRef          = useRef<Webcam>(null);
  const scanActiveRef      = useRef(false);
  const embeddingsRef      = useRef<number[][]>([]);
  const captureCountRef    = useRef(0);
  const consecutiveGoodRef = useRef(0);
  const captureFlashTimer  = useRef<ReturnType<typeof setTimeout> | null>(null);

  const [stage, setStage]                   = useState<Stage>("idle");
  const [modelsLoaded, setModelsLoaded]     = useState(false);
  const [loading, setLoading]               = useState(true);
  const [currentCapture, setCurrentCapture] = useState(0);
  const [poseCorrect, setPoseCorrect]       = useState(false);
  const [facePresent, setFacePresent]       = useState(false);
  const [showFlash, setShowFlash]           = useState(false);
  const [justCaptured, setJustCaptured]     = useState(false);
  const [stabilityProgress, setStabilityProgress] = useState(0);
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

  /* ── Single-frame detection (returns image dims too) ─────────── */
  const doDetect = useCallback(async () => {
    if (!webcamRef.current || !modelsLoaded) return null;
    try {
      const imageSrc = webcamRef.current.getScreenshot();
      if (!imageSrc) return null;
      const img = await faceapi.fetchImage(imageSrc);
      const det = await faceapi
        .detectSingleFace(img, new faceapi.TinyFaceDetectorOptions({ scoreThreshold: 0.5 }))
        .withFaceLandmarks()
        .withFaceDescriptor();
      if (!det) return null;
      return { det, imgW: img.width, imgH: img.height };
    } catch { return null; }
  }, [modelsLoaded]);

  /* ══════════════════════════════════════════════════════════════
     SCANNING LOOP
     ────────────────────────────────────────────────────────────
     For every frame:
       1. Detect face → if none → red border
       2. Quality check → if fail → red border + hint
       3. Pose check   → if fail → red border + hint
       4. All pass      → green border, increment stability counter
       5. Stability counter reaches REQUIRED → CAPTURE (beep + flash)
  ═══════════════════════════════════════════════════════════════ */
  useEffect(() => {
    if (stage !== "scanning") return;

    scanActiveRef.current      = true;
    embeddingsRef.current      = [];
    captureCountRef.current    = 0;
    consecutiveGoodRef.current = 0;
    setCurrentCapture(0);
    setPoseCorrect(false);
    setFacePresent(false);
    setStabilityProgress(0);
    setJustCaptured(false);
    setError("");
    setPoseHint("");

    let readyForNext = true;

    const interval = setInterval(async () => {
      if (!scanActiveRef.current || !readyForNext) return;
      readyForNext = false;

      /* ─── Step 1: Detect ─── */
      const result = await doDetect();

      if (!scanActiveRef.current) return;

      if (!result) {
        consecutiveGoodRef.current = 0;
        setFacePresent(false);
        setPoseCorrect(false);
        setStabilityProgress(0);
        setJustCaptured(false);
        setPoseHint("");
        setError("No face detected — position your face inside the circle.");
        setTimeout(() => { readyForNext = true; }, 400);
        return;
      }

      setFacePresent(true);
      setError("");

      const currentStep = captureCountRef.current;

      /* ─── Step 2: Quality check ─── */
      const quality = validateFaceQuality(result.det, result.imgW, result.imgH);
      if (!quality.valid) {
        consecutiveGoodRef.current = 0;
        setPoseCorrect(false);
        setStabilityProgress(0);
        setJustCaptured(false);
        setPoseHint(quality.hint);
        setTimeout(() => { readyForNext = true; }, 300);
        return;
      }

      /* ─── Step 3: Pose check ─── */
      const pose = estimateHeadPose(result.det.landmarks);
      const correct = isPoseCorrectForStep(pose, currentStep);
      if (!correct) {
        consecutiveGoodRef.current = 0;
        setPoseCorrect(false);
        setStabilityProgress(0);
        setJustCaptured(false);
        setPoseHint(getPoseHint(pose, currentStep));
        setTimeout(() => { readyForNext = true; }, 300);
        return;
      }

      /* ─── Step 4: All checks pass → green border ─── */
      setPoseCorrect(true);
      setPoseHint("");
      setJustCaptured(false);
      consecutiveGoodRef.current += 1;
      setStabilityProgress(consecutiveGoodRef.current);

      if (consecutiveGoodRef.current < REQUIRED_STABLE_FRAMES) {
        /* Still accumulating stability — recheck on next interval tick */
        readyForNext = true;
        return;
      }

      /* ═══════════════════════════════════════════════════════════
         Step 5: STABLE + VALID → CAPTURE
      ═══════════════════════════════════════════════════════════ */
      consecutiveGoodRef.current = 0;
      setStabilityProgress(0);
      setJustCaptured(true);

      // Flash + beep
      setShowFlash(true);
      playBeep();
      if (captureFlashTimer.current) clearTimeout(captureFlashTimer.current);
      captureFlashTimer.current = setTimeout(() => setShowFlash(false), 600);

      // Save embedding
      const descriptor = Array.from(result.det.descriptor);
      embeddingsRef.current = [...embeddingsRef.current, descriptor];
      const count = captureCountRef.current + 1;
      captureCountRef.current = count;
      setCurrentCapture(count);

      if (count >= POSES.length) {
        /* ── All 5 poses captured — save to server ── */
        scanActiveRef.current = false;
        clearInterval(interval);

        // Keep green border visible during processing
        setTimeout(() => setStage("processing"), 600);

        try {
          const avg = averageEmbeddings(embeddingsRef.current);
          const res = await fetch("/api/face/register", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ embedding: avg }),
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

      /* ── Pause with green border, then reset for next pose ── */
      setTimeout(() => {
        setPoseCorrect(false);
        setJustCaptured(false);
        setStabilityProgress(0);
        readyForNext = true;
      }, CAPTURE_GAP_MS);
    }, SCAN_INTERVAL_MS);

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
    setStabilityProgress(0);
    setJustCaptured(false);
    setError("");
    setPoseHint("");
    setAlreadyRegistered(true);
  };

  if (loading) return <LoadingSpinner text="Loading face recognition models..." />;

  const ci = Math.min(currentCapture, POSES.length - 1);

  return (
    <div className="max-w-3xl mx-auto px-3 md:px-4">
      <AnimatePresence mode="wait">

        {/* ════════════════════════════════════════════════════════
            STAGE: idle
        ════════════════════════════════════════════════════════ */}
        {stage === "idle" && (
          <motion.div
            key="idle"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="text-center"
          >
            <h1 className="text-xl md:text-2xl lg:text-3xl font-bold text-white mb-2">Face Registration</h1>
            <p className="text-sm md:text-base text-gray-400 mb-6 md:mb-8">Register your face to use attendance features</p>

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
            STAGE: scanning  (with quality + pose + stability)
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

            <div className="flex flex-col items-center gap-6">
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
                    <FacePoseIllustration direction={POSES[ci].direction} size={72} active />
                  </div>
                  <div>
                    <p className="font-semibold text-white text-sm">{POSES[ci].label}</p>
                    <p className="text-gray-400 text-xs mt-1 leading-relaxed">{POSES[ci].instruction}</p>
                  </div>
                </motion.div>
              </AnimatePresence>

              {/* ── Circular scanner ── */}
              <div className="relative" style={{ marginBottom: 48 }}>
                <CircularScanner faceDetected={facePresent} isValid={poseCorrect} size={320} showCaptureFlash={showFlash}>
                  <Webcam
                    ref={webcamRef}
                    screenshotFormat="image/jpeg"
                    className="w-full h-full object-cover"
                    mirrored
                    style={{ borderRadius: "50%" }}
                  />
                </CircularScanner>
              </div>

              {/* ── Hint / Error banners ── */}
              {error && <ErrorBanner message={error} />}
              {!error && poseHint && facePresent && !poseCorrect && (
                <motion.div
                  key={poseHint}
                  initial={{ opacity: 0, y: -4 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="flex items-center gap-2 bg-amber-500/10 border border-amber-500/20 rounded-xl p-3 text-sm text-amber-400 w-full max-w-sm mx-auto"
                >
                  <AlertCircle className="w-4 h-4 flex-shrink-0" />
                  {poseHint}
                </motion.div>
              )}

              {/* ── Stability progress dots ── */}
              {poseCorrect && !justCaptured && stabilityProgress > 0 && stabilityProgress < REQUIRED_STABLE_FRAMES && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="flex items-center gap-2"
                >
                  {Array.from({ length: REQUIRED_STABLE_FRAMES }).map((_, i) => (
                    <motion.div
                      key={i}
                      initial={{ scale: 0.6 }}
                      animate={{
                        scale: i < stabilityProgress ? 1.15 : 0.8,
                        backgroundColor: i < stabilityProgress ? "rgb(52,211,153)" : "rgba(255,255,255,0.12)",
                      }}
                      transition={{ duration: 0.25 }}
                      className="w-2.5 h-2.5 rounded-full"
                    />
                  ))}
                  <span className="text-xs text-emerald-300 ml-1 font-medium">Hold steady…</span>
                </motion.div>
              )}

              {/* ── Status text ── */}
              <div className="flex items-center gap-2 text-sm">
                {justCaptured ? (
                  <>
                    <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                    <span className="text-emerald-400 font-medium">Captured ✓ — moving to next pose…</span>
                  </>
                ) : poseCorrect ? (
                  <>
                    <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                    <span className="text-emerald-400 font-medium">Pose correct — hold steady</span>
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
              <div className="flex items-center gap-2 mt-1">
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
                            active ? "text-white"       :
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
            STAGE: done
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
