import { memo, type CSSProperties } from "react";
import { ORO_CHARACTER_SHEET, ORO_SPRITE_CROPS } from "@/assets/oro-character-sheet";
import type { PawnAppearance } from "@/lib/avatar-generator";

export type PawnPose = "stand" | "sit" | "walk";
export type PawnMotion = "none" | "typing" | "talking" | "shaking";

interface PawnProps {
  appearance: PawnAppearance;
  pose: PawnPose;
  motion?: PawnMotion;
  /** 1 = facing right/front, -1 = mirrored. AgentAvatar normally handles walk direction. */
  facing?: 1 | -1;
  /** Ghost rendering for placeholders / unconfirmed agents. */
  ghost?: boolean;
}

/**
 * Approved ORO office-worker skin.
 *
 * Important: this component intentionally keeps the original Pawn API and anchor.
 * Positioning, path movement, desk/meeting placement, status events, selection,
 * speech/tool/error emotes and click behavior continue to be controlled by
 * AgentAvatar and the existing OpenClaw Office stores.
 */
export const Pawn = memo(function Pawn({
  appearance,
  pose,
  motion = "none",
  facing = 1,
  ghost = false,
}: PawnProps) {
  const crop = ORO_SPRITE_CROPS[appearance.spriteIndex % ORO_SPRITE_CROPS.length];
  const isWalking = pose === "walk";
  const isSitting = pose === "sit";

  // Keep the character's feet on the same y≈18 anchor used by the original Pawn.
  // Seated characters are simply rendered a little smaller so desks still occlude naturally.
  const displayWidth = isSitting ? 44 : 54;
  const displayHeight = isSitting ? 47 : 58;
  const displayY = 18 - displayHeight;

  let spriteStyle: CSSProperties = {
    imageRendering: "pixelated",
    opacity: ghost ? 0.45 : 1,
    filter: ghost ? "grayscale(1) saturate(0.25)" : undefined,
    transformBox: "fill-box",
    transformOrigin: "center bottom",
  };

  // Reuse the original motion keyframes without touching movement/path logic.
  if (motion === "shaking") {
    spriteStyle = { ...spriteStyle, animation: "pawn-shake 0.45s linear infinite" };
  } else if (!isWalking && motion === "typing") {
    spriteStyle = { ...spriteStyle, animation: "pawn-type 0.28s ease-in-out infinite" };
  } else if (!isWalking && motion === "talking") {
    spriteStyle = { ...spriteStyle, animation: "pawn-breathe 0.9s ease-in-out infinite" };
  } else if (!isWalking) {
    spriteStyle = { ...spriteStyle, animation: "pawn-breathe 3.2s ease-in-out infinite" };
  }

  return (
    <g transform={facing === -1 ? "scale(-1, 1)" : undefined}>
      <ellipse cx={0} cy={17.5} rx={11.5} ry={3} fill="rgba(0,0,0,0.18)" />
      <svg
        x={-displayWidth / 2}
        y={displayY}
        width={displayWidth}
        height={displayHeight}
        viewBox={`${crop.x} ${crop.y} ${crop.w} ${crop.h}`}
        preserveAspectRatio="xMidYMax meet"
        style={spriteStyle}
      >
        <image
          href={ORO_CHARACTER_SHEET}
          x={0}
          y={0}
          width={384}
          height={216}
          preserveAspectRatio="none"
          style={{ imageRendering: "pixelated" }}
        />
      </svg>
    </g>
  );
});
