import * as faceapi from "face-api.js";
import { PoseDirection } from "@/components/FacePoseIllustration";

export const MIN_CONFIDENCE = 0.65;

export interface HeadPose {
  yaw: number;
  pitch: number;
}

export interface QualityResult {
  valid: boolean;
  hint: string;
}

export const POSES: { label: string; direction: PoseDirection; instruction: string }[] = [
  { label: "Front Face",   direction: "front", instruction: "Please look straight at the camera." },
  { label: "Left Face",    direction: "left",  instruction: "Please turn your face to the left." },
  { label: "Right Face",   direction: "right", instruction: "Please turn your face to the right." },
  { label: "Slight Up",    direction: "up",    instruction: "Please tilt your face slightly upward." },
  { label: "Slight Down",  direction: "down",  instruction: "Please tilt your face slightly downward." },
];

/**
 * Head-pose estimation from 68-point landmarks
 * Yaw: nose-tip horizontal offset relative to jaw width.
 *      Negative -> user turned head LEFT.
 *      Positive -> user turned head RIGHT.
 * Pitch: ratio of (nose-bottom-to-eye) / (chin-to-eye) span.
 *        Lower -> tilted UP. Higher -> tilted DOWN.
 */
export function estimateHeadPose(landmarks: faceapi.FaceLandmarks68): HeadPose {
  const pts = landmarks.positions;

  const noseTip  = pts[30];
  const leftJaw  = pts[0];
  const rightJaw = pts[16];
  const leftDist  = noseTip.x - leftJaw.x;
  const rightDist = rightJaw.x - noseTip.x;
  const yaw = (rightDist - leftDist) / (rightDist + leftDist);

  const eyeY       = (pts[36].y + pts[39].y + pts[42].y + pts[45].y) / 4;
  const noseBottomY = pts[33].y;
  const chinY       = pts[8].y;
  const pitch = (noseBottomY - eyeY) / (chinY - eyeY);

  return { yaw, pitch };
}

/**
 * Checks whether the estimated pose matches the requirement of the current capture step
 */
export function isPoseCorrectForStep({ yaw, pitch }: HeadPose, step: number): boolean {
  switch (step) {
    case 0: return Math.abs(yaw) < 0.10 && pitch > 0.38 && pitch < 0.56;
    case 1: return yaw < -0.12;
    case 2: return yaw > 0.12;
    case 3: return pitch < 0.40 && Math.abs(yaw) < 0.20;
    case 4: return pitch > 0.55 && Math.abs(yaw) < 0.20;
    default: return false;
  }
}

/**
 * Returns a contextual hint to help the user adjust their face pose
 */
export function getPoseHint({ yaw, pitch }: HeadPose, step: number): string {
  switch (step) {
    case 0:
      if (Math.abs(yaw) >= 0.10)  return "Your face is turned — please look straight ahead.";
      if (pitch <= 0.38)          return "Your face is tilted up — please look straight ahead.";
      if (pitch >= 0.56)          return "Your face is tilted down — please look straight ahead.";
      break;
    case 1: if (yaw >= -0.12)     return "Please turn your face further to the left."; break;
    case 2: if (yaw <= 0.12)      return "Please turn your face further to the right."; break;
    case 3:
      if (pitch >= 0.40)          return "Please tilt your face upward a bit more.";
      if (Math.abs(yaw) >= 0.20)  return "Keep your face centered — just tilt upward.";
      break;
    case 4:
      if (pitch <= 0.55)          return "Please tilt your face downward a bit more.";
      if (Math.abs(yaw) >= 0.20)  return "Keep your face centered — just tilt downward.";
      break;
  }
  return POSES[step].instruction;
}

/**
 * Validates basic face characteristics: confidence, size, centering, bounding box margins, sharpness
 */
export function validateFaceQuality(
  det: faceapi.WithFaceDescriptor<faceapi.WithFaceLandmarks<faceapi.WithFaceDetection<{}>>>,
  imgW: number,
  imgH: number,
): QualityResult {
  const box   = det.detection.box;
  const score = det.detection.score;
  const pts   = det.landmarks.positions;

  // 1 ─ Detection confidence
  if (score < MIN_CONFIDENCE) {
    return { valid: false, hint: "Face not clearly visible. Improve lighting or remove obstructions." };
  }

  // 2 ─ Face size relative to frame (too small / too large)
  const fwRatio = box.width / imgW;
  const fhRatio = box.height / imgH;
  if (fwRatio < 0.18 || fhRatio < 0.18) {
    return { valid: false, hint: "Move closer to the camera." };
  }
  if (fwRatio > 0.80 || fhRatio > 0.90) {
    return { valid: false, hint: "Move further from the camera." };
  }

  // 3 ─ Face centering (allow generous margin for turned/tilted poses)
  const cx = (box.x + box.width / 2) / imgW;
  const cy = (box.y + box.height / 2) / imgH;
  if (Math.abs(cx - 0.5) > 0.30) {
    return { valid: false, hint: "Center your face inside the scanner." };
  }
  if (Math.abs(cy - 0.5) > 0.30) {
    return { valid: false, hint: "Center your face inside the scanner." };
  }

  // 4 ─ Face partially outside frame
  const margin = 8;
  if (box.x < -margin || box.y < -margin ||
      box.x + box.width > imgW + margin ||
      box.y + box.height > imgH + margin) {
    return { valid: false, hint: "Keep your entire face inside the frame." };
  }

  // 5 ─ Inter-eye distance (sharpness / size proxy)
  const iod = Math.hypot(pts[45].x - pts[36].x, pts[45].y - pts[36].y);
  if (iod < 30) {
    return { valid: false, hint: "Face too small or blurry. Move closer." };
  }

  // 6 ─ Landmark spread (face-height sanity; too small → unreliable)
  const faceH = Math.abs(pts[8].y - pts[24].y);
  if (faceH < 40) {
    return { valid: false, hint: "Face too small. Move closer to the camera." };
  }

  return { valid: true, hint: "" };
}

function getDistance(pt1: faceapi.Point, pt2: faceapi.Point): number {
  return Math.hypot(pt1.x - pt2.x, pt1.y - pt2.y);
}

export function computeEAR(eyePoints: faceapi.Point[]): number {
  const vertical1 = getDistance(eyePoints[1], eyePoints[5]);
  const vertical2 = getDistance(eyePoints[2], eyePoints[4]);
  const horizontal = getDistance(eyePoints[0], eyePoints[3]);
  return (vertical1 + vertical2) / (2.0 * horizontal);
}

export function checkEyesOpen(landmarks: faceapi.FaceLandmarks68): { open: boolean; ear: number } {
  const pts = landmarks.positions;
  const leftEye = pts.slice(36, 42);
  const rightEye = pts.slice(42, 48);
  const leftEAR = computeEAR(leftEye);
  const rightEAR = computeEAR(rightEye);
  const avgEAR = (leftEAR + rightEAR) / 2;
  return { open: avgEAR >= 0.20, ear: avgEAR };
}

