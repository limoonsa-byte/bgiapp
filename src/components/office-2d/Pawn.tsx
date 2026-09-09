import { memo, type CSSProperties } from "react";
import type { PawnAppearance } from "@/lib/avatar-generator";

export type PawnPose = "stand" | "sit" | "walk";
export type PawnMotion = "none" | "typing" | "talking" | "shaking";

type FantasyClass = "knight" | "ranger" | "mage" | "healer" | "engineer";

interface PawnProps {
  appearance: PawnAppearance;
  pose: PawnPose;
  motion?: PawnMotion;
  /** 1 = facing right/front, -1 = mirrored (walking left) */
  facing?: 1 | -1;
  /** Ghost rendering for placeholders / unconfirmed agents */
  ghost?: boolean;
}

const OUTLINE = "rgba(35, 25, 20, 0.42)";

function shade(hex: string, factor: number): string {
  const r = Math.round(parseInt(hex.slice(1, 3), 16) * factor);
  const g = Math.round(parseInt(hex.slice(3, 5), 16) * factor);
  const b = Math.round(parseInt(hex.slice(5, 7), 16) * factor);
  return `rgb(${r},${g},${b})`;
}

function fantasyClass(appearance: PawnAppearance): FantasyClass {
  switch (appearance.hairStyle) {
    case "short": return "knight";
    case "spiky": return "ranger";
    case "side-part": return "mage";
    case "curly": return "healer";
    case "buzz": return "engineer";
  }
}

/**
 * Cute fantasy-RPG chibi pawn.
 * Keeps the original Pawn API so the real OpenClaw movement/status pipeline remains intact.
 */
export const Pawn = memo(function Pawn({
  appearance,
  pose,
  motion = "none",
  facing = 1,
  ghost = false,
}: PawnProps) {
  const isWalking = pose === "walk";
  const isTyping = motion === "typing" && pose === "sit";
  const isTalking = motion === "talking";
  const isShaking = motion === "shaking";
  const klass = fantasyClass(appearance);

  const skin = ghost ? "#9ca3af" : appearance.skinColor;
  const hair = ghost ? "#6b7280" : appearance.hairColor;
  const shirt = ghost ? "#9ca3af" : appearance.shirtColor;
  const pants = ghost ? "#6b7280" : appearance.pantsColor;
  const shoes = ghost ? "#4b5563" : appearance.shoeColor;
  const sleeve = shade(shirt, 0.82);
  const trim = ghost ? "#9ca3af" : classAccent(klass, shirt);

  const bodyStyle: CSSProperties | undefined = isShaking
    ? {
        animation: "pawn-shake 0.45s linear infinite",
        transformBox: "fill-box",
        transformOrigin: "center",
      }
    : !isWalking
      ? {
          animation: "pawn-breathe 3.2s ease-in-out infinite",
          transformBox: "fill-box",
          transformOrigin: "center bottom",
        }
      : undefined;

  return (
    <g>
      <ellipse cx={0} cy={18.5} rx={12.5} ry={3.3} fill="rgba(0,0,0,0.18)" />
      <g style={bodyStyle}>
        <g transform={facing === -1 ? "scale(-1, 1)" : undefined}>
          <Cape klass={klass} color={shirt} trim={trim} walking={isWalking} ghost={ghost} />

          <Leg side={-1} pose={pose} walking={isWalking} pants={pants} shoes={shoes} />
          <Leg side={1} pose={pose} walking={isWalking} pants={pants} shoes={shoes} />

          <g
            style={
              !isWalking && !isShaking
                ? {
                    animation: "pawn-breathe 3.2s ease-in-out infinite",
                    transformBox: "fill-box",
                    transformOrigin: "center bottom",
                  }
                : undefined
            }
          >
            <path d="M -9 -10 Q -8 -13 0 -13 Q 8 -13 9 -10 L 8 5 Q 0 8 -8 5 Z" fill={shirt} stroke={OUTLINE} strokeWidth={1} />
            <path d="M -4 -11 L 0 -7 L 4 -11" fill="none" stroke={trim} strokeWidth={1.4} />
            <rect x={-8} y={2.5} width={16} height={2.2} rx={1.1} fill={trim} opacity={0.9} />
            <circle cx={0} cy={3.6} r={1.7} fill="#f8d36a" stroke={OUTLINE} strokeWidth={0.5} />
          </g>

          <Arm side={-1} walking={isWalking} typing={isTyping} sleeve={sleeve} skin={skin} />
          <Arm side={1} walking={isWalking} typing={isTyping} sleeve={sleeve} skin={skin} />
          <Accessory klass={klass} trim={trim} walking={isWalking} typing={isTyping} />

          <g>
            <circle cx={0} cy={-20} r={10} fill={skin} stroke={OUTLINE} strokeWidth={1} />
            <Ears klass={klass} skin={skin} />
            <Hair style={appearance.hairStyle} color={hair} />
            <Headgear klass={klass} color={shirt} trim={trim} />
            <g
              style={{
                animation: "pawn-blink 4.2s ease-in-out infinite",
                transformBox: "fill-box",
                transformOrigin: "center",
              }}
            >
              <Eyes style={appearance.eyeStyle} />
            </g>
            <circle cx={-5.3} cy={-15.9} r={1.4} fill="#f39aa6" opacity={0.42} />
            <circle cx={5.3} cy={-15.9} r={1.4} fill="#f39aa6" opacity={0.42} />
            {isTalking ? (
              <ellipse
                cx={0}
                cy={-14.8}
                rx={2}
                ry={1.7}
                fill="#7c2d12"
                style={{
                  animation: "pawn-mouth-talk 0.35s ease-in-out infinite",
                  transformBox: "fill-box",
                  transformOrigin: "center",
                }}
              />
            ) : (
              <path d="M -2 -15 Q 0 -13.3 2 -15" fill="none" stroke="#7c2d12" strokeWidth={1} strokeLinecap="round" />
            )}
          </g>
        </g>
      </g>
    </g>
  );
});

function classAccent(klass: FantasyClass, shirt: string): string {
  switch (klass) {
    case "knight": return "#d8e5f3";
    case "ranger": return "#d6c37a";
    case "mage": return "#9be2ff";
    case "healer": return "#ffe18b";
    case "engineer": return "#ffbb62";
    default: return shade(shirt, 1.1);
  }
}

function Cape({
  klass,
  color,
  trim,
  walking,
  ghost,
}: {
  klass: FantasyClass;
  color: string;
  trim: string;
  walking: boolean;
  ghost: boolean;
}) {
  if (klass === "engineer") return null;
  const cape = klass === "knight" ? "#516a8d" : klass === "ranger" ? "#507a55" : shade(color, 0.72);
  return (
    <g
      opacity={ghost ? 0.45 : 0.95}
      style={walking ? { animation: "pawn-swing 0.5s ease-in-out infinite alternate", transformBox: "fill-box", transformOrigin: "center top" } : undefined}
    >
      <path d="M -8 -10 Q 0 -13 8 -10 L 11 8 Q 0 13 -11 8 Z" fill={cape} stroke={OUTLINE} strokeWidth={0.8} />
      <path d="M -7 -8 Q 0 -10 7 -8" fill="none" stroke={trim} strokeWidth={1.2} opacity={0.9} />
    </g>
  );
}

function Leg({ side, pose, walking, pants, shoes }: { side: -1 | 1; pose: PawnPose; walking: boolean; pants: string; shoes: string }) {
  const hipX = side * 3.8;
  const legH = pose === "sit" ? 6.5 : 11.5;
  const shoeY = pose === "sit" ? 4.5 : 9;
  return (
    <g transform={`translate(${hipX}, 4)`}>
      <g
        style={
          walking
            ? { animation: "pawn-swing 0.46s ease-in-out infinite alternate", animationDelay: side === 1 ? "-0.46s" : "0s", transformBox: "fill-box", transformOrigin: "center top" }
            : undefined
        }
      >
        <rect x={-2.6} y={-1} width={5.2} height={legH} rx={2.4} fill={pants} stroke={OUTLINE} strokeWidth={0.8} />
        <rect x={-3.3} y={shoeY} width={6.6} height={4.5} rx={2} fill={shoes} stroke={OUTLINE} strokeWidth={0.45} />
      </g>
    </g>
  );
}

function Arm({ side, walking, typing, sleeve, skin }: { side: -1 | 1; walking: boolean; typing: boolean; sleeve: string; skin: string }) {
  const shoulderX = side * 9;
  const baseRotate = typing ? side * -30 : 0;
  let animStyle: CSSProperties | undefined;
  if (walking) {
    animStyle = { animation: "pawn-swing 0.46s ease-in-out infinite alternate", animationDelay: side === 1 ? "0s" : "-0.46s", transformBox: "fill-box", transformOrigin: "center top" };
  } else if (typing) {
    animStyle = { animation: "pawn-type 0.28s ease-in-out infinite", animationDelay: side === 1 ? "-0.14s" : "0s", transformBox: "fill-box", transformOrigin: "center top" };
  }
  return (
    <g transform={`translate(${shoulderX}, -8) rotate(${baseRotate})`}>
      <g style={animStyle}>
        <rect x={-2.2} y={-1} width={4.4} height={9} rx={2.1} fill={sleeve} stroke={OUTLINE} strokeWidth={0.8} />
        <circle cx={0} cy={8.9} r={2.45} fill={skin} stroke={OUTLINE} strokeWidth={0.7} />
      </g>
    </g>
  );
}

function Ears({ klass, skin }: { klass: FantasyClass; skin: string }) {
  if (klass !== "ranger" && klass !== "healer") return null;
  return <g fill={skin} stroke={OUTLINE} strokeWidth={0.8}><path d="M -9 -22 L -14 -25 L -9 -17 Z" /><path d="M 9 -22 L 14 -25 L 9 -17 Z" /></g>;
}

function Headgear({ klass, color, trim }: { klass: FantasyClass; color: string; trim: string }) {
  switch (klass) {
    case "knight":
      return <g><path d="M -10 -23 Q -9 -31 0 -32 Q 9 -31 10 -23 L 8 -20 Q 0 -24 -8 -20 Z" fill="#b8c5d8" stroke={OUTLINE} strokeWidth={0.9} opacity={0.94} /><path d="M 0 -33 L 2 -38 L 4 -32" fill={trim} stroke={OUTLINE} strokeWidth={0.6} /></g>;
    case "mage":
      return <g><path d="M -11 -26 L 2 -39 L 7 -27 Q 11 -25 12 -22 Q 0 -18 -12 -22 Q -12 -24 -11 -26 Z" fill={shade(color, 0.78)} stroke={OUTLINE} strokeWidth={0.9} /><circle cx={1} cy={-31} r={1.5} fill={trim} /></g>;
    case "healer":
      return <g><path d="M -9 -26 Q 0 -32 9 -26" fill="none" stroke="#fff5d7" strokeWidth={3} strokeLinecap="round" /><circle cx={0} cy={-31} r={2.3} fill={trim} stroke={OUTLINE} strokeWidth={0.5} /></g>;
    case "engineer":
      return <g><rect x={-9} y={-28} width={18} height={4.5} rx={2.2} fill="#4b5563" /><circle cx={-4.2} cy={-26} r={3} fill="#80d9ff" stroke={OUTLINE} strokeWidth={0.7} /><circle cx={4.2} cy={-26} r={3} fill="#80d9ff" stroke={OUTLINE} strokeWidth={0.7} /></g>;
    case "ranger":
      return <path d="M -9 -25 Q 0 -29 9 -25" fill="none" stroke={trim} strokeWidth={2.1} strokeLinecap="round" />;
  }
}

function Accessory({ klass, trim, walking, typing }: { klass: FantasyClass; trim: string; walking: boolean; typing: boolean }) {
  const style: CSSProperties | undefined = walking ? { animation: "pawn-swing 0.5s ease-in-out infinite alternate", transformBox: "fill-box", transformOrigin: "center bottom" } : undefined;
  if (typing) return null;
  switch (klass) {
    case "knight":
      return <g style={style}><ellipse cx={-11.5} cy={-2} rx={4.4} ry={6.5} fill="#7d8ea8" stroke={OUTLINE} strokeWidth={0.8} /><path d="M -11.5 -6 L -8 -2 L -11.5 3 L -15 -2 Z" fill={trim} opacity={0.9} /></g>;
    case "ranger":
      return <g style={style}><path d="M 11 -11 Q 17 0 11 11" fill="none" stroke="#765336" strokeWidth={1.8} /><line x1={11} y1={-10} x2={11} y2={10} stroke="#ddd6c4" strokeWidth={0.7} /></g>;
    case "mage":
      return <g style={style}><line x1={12} y1={-13} x2={12} y2={12} stroke="#6d5036" strokeWidth={2} /><circle cx={12} cy={-15} r={3.5} fill={trim} stroke={OUTLINE} strokeWidth={0.7} /><circle cx={12} cy={-15} r={1.4} fill="#fff" opacity={0.75} /></g>;
    case "healer":
      return <g style={style}><line x1={12} y1={-11} x2={12} y2={12} stroke="#806540" strokeWidth={2} /><circle cx={12} cy={-14} r={4} fill="#fff2b6" stroke={OUTLINE} strokeWidth={0.7} /><path d="M 10 -14 H 14 M 12 -16 V -12" stroke="#e3a72f" strokeWidth={1.1} /></g>;
    case "engineer":
      return <g style={style}><path d="M 11 -7 L 14 -10 L 16 -8 L 13 -5 L 17 7 L 14 8 L 10 -4 Z" fill={trim} stroke={OUTLINE} strokeWidth={0.7} /><circle cx={15.3} cy={8} r={1.8} fill="#596273" /></g>;
  }
}

function Hair({ style, color }: { style: PawnAppearance["hairStyle"]; color: string }) {
  switch (style) {
    case "short": return <path d="M -9 -21 Q -9 -30 0 -30 Q 9 -30 9 -21 Q 4 -25 0 -25 Q -4 -25 -9 -21 Z" fill={color} />;
    case "spiky": return <g fill={color}><path d="M -9 -21 Q -9 -29 0 -29 Q 9 -29 9 -21 Q 4 -24 0 -24 Q -4 -24 -9 -21 Z" /><polygon points="-7,-27 -6,-33 -3,-28" /><polygon points="-2,-29 0,-35 2,-29" /><polygon points="3,-28 6,-33 7,-27" /></g>;
    case "side-part": return <g fill={color}><path d="M -9 -20 Q -9 -30 -1 -30 Q 9 -30 9 -20 Q 6 -26 2 -26 Q -4 -26 -9 -20 Z" /><path d="M 4 -29 Q 10 -27 9 -21 L 6 -24 Z" /></g>;
    case "curly": return <g fill={color}><circle cx={-6} cy={-25} r={3.8} /><circle cx={0} cy={-28} r={4} /><circle cx={6} cy={-25} r={3.8} /><circle cx={-8.5} cy={-20.5} r={2.8} /><circle cx={8.5} cy={-20.5} r={2.8} /></g>;
    case "buzz": return <path d="M -8.5 -22 Q -8 -29 0 -29 Q 8 -29 8.5 -22 Q 4 -25 0 -25 Q -4 -25 -8.5 -22 Z" fill={color} opacity={0.75} />;
  }
}

function Eyes({ style }: { style: PawnAppearance["eyeStyle"] }) {
  const ey = -20.5;
  const gap = 3.7;
  switch (style) {
    case "dot": return <g><circle cx={-gap} cy={ey} r={1.45} fill="#1f2937" /><circle cx={gap} cy={ey} r={1.45} fill="#1f2937" /></g>;
    case "line": return <g stroke="#1f2937" strokeWidth={1.2} strokeLinecap="round"><line x1={-gap - 1.7} y1={ey} x2={-gap + 1.7} y2={ey} /><line x1={gap - 1.7} y1={ey} x2={gap + 1.7} y2={ey} /></g>;
    case "wide": return <g><ellipse cx={-gap} cy={ey} rx={2.1} ry={2.4} fill="#fff" stroke="#1f2937" strokeWidth={0.6} /><circle cx={-gap} cy={ey + 0.35} r={1.05} fill="#1f2937" /><ellipse cx={gap} cy={ey} rx={2.1} ry={2.4} fill="#fff" stroke="#1f2937" strokeWidth={0.6} /><circle cx={gap} cy={ey + 0.35} r={1.05} fill="#1f2937" /></g>;
  }
}
