"use client";

export type PoseDirection = "front" | "left" | "right" | "up" | "down";

interface FacePoseIllustrationProps {
  direction: PoseDirection;
  size?: number;
  active?: boolean;
}

/* ───────────────────────────────────────────────────────────────────
   Each pose is a small SVG scene: oval head + simplified facial
   features shifted / rotated to indicate the required angle.
   The "active" prop adds an accent colour to the outline.
─────────────────────────────────────────────────────────────────── */
export default function FacePoseIllustration({
  direction,
  size = 120,
  active = false,
}: FacePoseIllustrationProps) {
  const accent = active ? "#6366f1" : "#475569";
  const faceStroke = active ? "#818cf8" : "#64748b";
  const featureFill = active ? "#a5b4fc" : "#94a3b8";
  const arrowColor = active ? "#06b6d4" : "#475569";

  /* ── FRONT ─────────────────────────────────────────────────────── */
  if (direction === "front") {
    return (
      <svg width={size} height={size} viewBox="0 0 120 120" fill="none">
        {/* Head */}
        <ellipse cx="60" cy="56" rx="34" ry="40" stroke={faceStroke} strokeWidth="2.5" fill="rgba(99,102,241,0.08)" />
        {/* Eyes */}
        <circle cx="48" cy="50" r="4" fill={featureFill} />
        <circle cx="72" cy="50" r="4" fill={featureFill} />
        {/* Nose */}
        <path d="M60 54 L56 65 Q60 68 64 65 Z" fill={featureFill} opacity="0.6" />
        {/* Mouth */}
        <path d="M50 74 Q60 81 70 74" stroke={featureFill} strokeWidth="2" strokeLinecap="round" fill="none" />
        {/* Neck */}
        <rect x="53" y="94" width="14" height="10" rx="3" fill={accent} opacity="0.3" />
        {/* Crosshair tick */}
        <circle cx="60" cy="56" r="38" stroke={accent} strokeWidth="1" strokeDasharray="4 6" opacity="0.5" />
        <line x1="60" y1="5" x2="60" y2="18" stroke={arrowColor} strokeWidth="2" strokeLinecap="round" />
        <line x1="60" y1="94" x2="60" y2="107" stroke={arrowColor} strokeWidth="2" strokeLinecap="round" />
        <line x1="5" y1="56" x2="18" y2="56" stroke={arrowColor} strokeWidth="2" strokeLinecap="round" />
        <line x1="102" y1="56" x2="115" y2="56" stroke={arrowColor} strokeWidth="2" strokeLinecap="round" />
      </svg>
    );
  }

  /* ── LEFT (face turning left, so features shift right in viewport) */
  if (direction === "left") {
    return (
      <svg width={size} height={size} viewBox="0 0 120 120" fill="none">
        {/* Head – slightly compressed horizontally */}
        <ellipse cx="65" cy="56" rx="28" ry="40" stroke={faceStroke} strokeWidth="2.5" fill="rgba(99,102,241,0.08)" />
        {/* Eyes visible (right eye prominent, left partially hidden) */}
        <circle cx="68" cy="50" r="4" fill={featureFill} />
        <circle cx="55" cy="51" r="2.5" fill={featureFill} opacity="0.4" />
        {/* Nose shifted right */}
        <path d="M63 54 L59 64 Q63 67 67 64 Z" fill={featureFill} opacity="0.6" />
        {/* Mouth */}
        <path d="M57 73 Q64 79 71 73" stroke={featureFill} strokeWidth="2" strokeLinecap="round" fill="none" />
        {/* Ear on the right (near side) */}
        <path d="M93 46 Q100 56 93 66" stroke={faceStroke} strokeWidth="2" strokeLinecap="round" fill="none" />
        {/* Arrow left */}
        <path d="M40 56 L18 56" stroke={arrowColor} strokeWidth="2.5" strokeLinecap="round" />
        <path d="M26 48 L18 56 L26 64" stroke={arrowColor} strokeWidth="2.5" strokeLinejoin="round" strokeLinecap="round" fill="none" />
      </svg>
    );
  }

  /* ── RIGHT (face turning right, features shift left in viewport) ── */
  if (direction === "right") {
    return (
      <svg width={size} height={size} viewBox="0 0 120 120" fill="none">
        <ellipse cx="55" cy="56" rx="28" ry="40" stroke={faceStroke} strokeWidth="2.5" fill="rgba(99,102,241,0.08)" />
        {/* Eyes visible (left eye prominent) */}
        <circle cx="52" cy="50" r="4" fill={featureFill} />
        <circle cx="65" cy="51" r="2.5" fill={featureFill} opacity="0.4" />
        {/* Nose shifted left */}
        <path d="M57 54 L53 64 Q57 67 61 64 Z" fill={featureFill} opacity="0.6" />
        <path d="M49 73 Q56 79 63 73" stroke={featureFill} strokeWidth="2" strokeLinecap="round" fill="none" />
        {/* Ear on the left (near side) */}
        <path d="M27 46 Q20 56 27 66" stroke={faceStroke} strokeWidth="2" strokeLinecap="round" fill="none" />
        {/* Arrow right */}
        <path d="M80 56 L102 56" stroke={arrowColor} strokeWidth="2.5" strokeLinecap="round" />
        <path d="M94 48 L102 56 L94 64" stroke={arrowColor} strokeWidth="2.5" strokeLinejoin="round" strokeLinecap="round" fill="none" />
      </svg>
    );
  }

  /* ── UP (chin raised, face tilted up) ─────────────────────────── */
  if (direction === "up") {
    return (
      <svg width={size} height={size} viewBox="0 0 120 120" fill="none">
        {/* Head shifted up slightly, ellipse taller */}
        <ellipse cx="60" cy="50" rx="34" ry="36" stroke={faceStroke} strokeWidth="2.5" fill="rgba(99,102,241,0.08)" />
        {/* Eyes angled up */}
        <ellipse cx="48" cy="44" rx="4" ry="3" fill={featureFill} />
        <ellipse cx="72" cy="44" rx="4" ry="3" fill={featureFill} />
        {/* Nose — bottom of face visible */}
        <path d="M60 50 L56 60 Q60 63 64 60 Z" fill={featureFill} opacity="0.6" />
        {/* Mouth lower on face */}
        <path d="M50 70 Q60 76 70 70" stroke={featureFill} strokeWidth="2" strokeLinecap="round" fill="none" />
        {/* Chin / neck visible more */}
        <path d="M46 83 Q60 96 74 83" stroke={faceStroke} strokeWidth="1.5" strokeLinecap="round" fill="none" opacity="0.4" />
        {/* Arrow up */}
        <path d="M60 16 L60 8" stroke={arrowColor} strokeWidth="2.5" strokeLinecap="round" />
        <path d="M52 16 L60 8 L68 16" stroke={arrowColor} strokeWidth="2.5" strokeLinejoin="round" strokeLinecap="round" fill="none" />
      </svg>
    );
  }

  /* ── DOWN (chin lowered, face tilted down) ────────────────────── */
  return (
    <svg width={size} height={size} viewBox="0 0 120 120" fill="none">
      <ellipse cx="60" cy="62" rx="34" ry="36" stroke={faceStroke} strokeWidth="2.5" fill="rgba(99,102,241,0.08)" />
      {/* Eyes angled down — more lid visible */}
      <ellipse cx="48" cy="58" rx="4" ry="3" fill={featureFill} />
      <ellipse cx="72" cy="58" rx="4" ry="3" fill={featureFill} />
      {/* Nose */}
      <path d="M60 63 L56 72 Q60 75 64 72 Z" fill={featureFill} opacity="0.6" />
      {/* Mouth higher (top of face less visible) */}
      <path d="M50 80 Q60 86 70 80" stroke={featureFill} strokeWidth="2" strokeLinecap="round" fill="none" />
      {/* Forehead visible more */}
      <path d="M38 37 Q60 28 82 37" stroke={faceStroke} strokeWidth="1.5" strokeLinecap="round" fill="none" opacity="0.4" />
      {/* Arrow down */}
      <path d="M60 104 L60 112" stroke={arrowColor} strokeWidth="2.5" strokeLinecap="round" />
      <path d="M52 104 L60 112 L68 104" stroke={arrowColor} strokeWidth="2.5" strokeLinejoin="round" strokeLinecap="round" fill="none" />
    </svg>
  );
}
