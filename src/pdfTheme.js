/**
 * The printed palette.
 *
 * Taken from the report card and shared by every exported document, so a
 * colour is defined once and a stack of printouts reads as one set. Kept in
 * its own module so the report card and the tabular exports can both use it
 * without importing each other.
 */
export const PALETTE = {
  CYAN: [43, 170, 222],
  CYAN_DARK: [29, 140, 186],
  GREEN: [40, 178, 75],
  GREEN_DARK: [52, 131, 58],
  MIST: [245, 247, 250],
  CLOUD: [228, 229, 231],
  SLATE: [129, 129, 129],
  INK: [19, 19, 19],
  RED: [192, 57, 43],
  AMBER: [199, 119, 0],
  WHITE: [255, 255, 255],
};

/** '#2BAADE' → [43, 170, 222]. Null for anything that is not a hex colour. */
export function hexToRgb(hex) {
  const m = /^#([0-9a-f]{6})$/i.exec(String(hex || '').trim());
  if (!m) return null;
  const n = parseInt(m[1], 16);
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
}
