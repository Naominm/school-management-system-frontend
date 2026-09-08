/**
 * The printed palette.
 *
 * Petrol and gold: the school's own colours rather than the reference card's
 * green and cyan. Petrol carries the structure — title bands, the spine, the
 * QR — and gold marks achievement, so the documents read as an academic
 * record rather than as an application.
 *
 * The band ramp descends gold → teal → ochre → clay. Every one of them is
 * dark enough to hold its own against white, which the colours it replaces
 * were not: the old green sat at 2.78:1 and was also what the QR was drawn
 * in, where a phone camera wants a genuinely dark module.
 *
 * Contrast on white, all measured:
 *   petrol 12.16   clay 7.03   teal 5.91   ochre 4.08   gold 3.62
 *
 * Shared by every exported document, and mirrored by the on-screen theme, so
 * a colour is defined once and a page and the document it produces match.
 */
export const PALETTE = {
  PETROL: [2, 59, 74],        // #023B4A  structure, QR, headline figures
  PETROL_DEEP: [1, 43, 55],   // #012B37  the deep end of the spine
  GOLD: [176, 125, 26],       // #B07D1A  exceeding expectations
  TEAL: [15, 110, 126],       // #0F6E7E  meeting expectations
  OCHRE: [193, 101, 26],      // #C1651A  approaching expectations
  CLAY: [163, 46, 46],        // #A32E2E  below expectations
  MIST: [245, 247, 250],      // #F5F7FA  table fills
  CLOUD: [228, 229, 231],     // #E4E5E7  rules
  SLATE: [129, 129, 129],     // #818181  labels
  INK: [19, 19, 19],          // #131313  body text
  WHITE: [255, 255, 255],
};

/** The colour a performance band prints in. */
export const BAND_COLOURS = {
  EE: PALETTE.GOLD,
  ME: PALETTE.TEAL,
  AE: PALETTE.OCHRE,
  BE: PALETTE.CLAY,
};

/** '#2BAADE' → [43, 170, 222]. Null for anything that is not a hex colour. */
export function hexToRgb(hex) {
  const m = /^#([0-9a-f]{6})$/i.exec(String(hex || '').trim());
  if (!m) return null;
  const n = parseInt(m[1], 16);
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
}

/** [2, 59, 74] → '#023b4a', for the few callers that need a CSS colour. */
export const rgbToHex = (c) => `#${c.map((v) => v.toString(16).padStart(2, '0')).join('')}`;
