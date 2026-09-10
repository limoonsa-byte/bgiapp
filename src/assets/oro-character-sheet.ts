import c0 from "./oro-char-chunk0";
import c1 from "./oro-char-chunk1";
import c2 from "./oro-char-chunk2";
import c3 from "./oro-char-chunk3";
import c4 from "./oro-char-chunk4";
import c5 from "./oro-char-chunk5";
import c6 from "./oro-char-chunk6";
import c7 from "./oro-char-chunk7";

/** Approved ORO office-worker character sheet (384×216 WebP, transparent). */
export const ORO_CHARACTER_SHEET = `data:image/webp;base64,${c0}${c1}${c2}${c3}${c4}${c5}${c6}${c7}`;

export interface OroSpriteCrop {
  x: number;
  y: number;
  w: number;
  h: number;
}

/**
 * Crops in the approved sheet, in role order:
 * AI COO, Marketing, Content, Developer, Analyst, ERP, CAD, Reviewer.
 */
export const ORO_SPRITE_CROPS: readonly OroSpriteCrop[] = [
  { x: 34, y: 22, w: 62, h: 90 },
  { x: 110, y: 25, w: 78, h: 87 },
  { x: 198, y: 24, w: 66, h: 88 },
  { x: 284, y: 21, w: 72, h: 91 },
  { x: 35, y: 116, w: 61, h: 89 },
  { x: 121, y: 114, w: 59, h: 91 },
  { x: 193, y: 116, w: 75, h: 89 },
  { x: 284, y: 115, w: 65, h: 90 },
] as const;
