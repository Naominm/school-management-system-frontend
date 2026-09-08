/**
 * Formatting shared by the report card on screen and the one on paper, so a
 * subject is abbreviated the same way and a band reads the same in both.
 */

/**
 * A short code for a chart axis: 'Integrated Science' → 'INT'.
 *
 * Three letters from the first word, which is what distinguishes subjects in
 * practice — initials would collapse "Creative Arts" and "Christian Religious
 * Education" to two letters each and lose the difference.
 */
export function subjectCode(name) {
  const words = String(name || '').replace(/[^A-Za-z ]+/g, ' ').trim().split(/\s+/).filter(Boolean);
  if (!words.length) return '—';
  let out = words[0].slice(0, 3);
  for (let i = 1; out.length < 3 && i < words.length; i += 1) out += words[i].slice(0, 3 - out.length);
  return out.toUpperCase();
}

/** 'EE1' → 'EE'. The performance family a grade belongs to. */
export const bandKey = (grade) => String(grade || '').slice(0, 2).toUpperCase();

/**
 * A band's percentage range as it is printed: '73-84', not '73-85'.
 *
 * Bands are stored with fractional upper bounds (84.99) so they tile the
 * scale without gaps; rounding those to the nearest whole number would print
 * each band overlapping the next one up.
 */
export const rangeLabel = (min, max) => `${Math.ceil(min)}-${Math.floor(max)}`;
