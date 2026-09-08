import { PALETTE, hexToRgb } from './pdfTheme';

/**
 * The furniture every printed document shares — the spine, the crest and
 * contact block, the period band, the motto footer, and the watermark.
 *
 * Kept in one module so a report card, a markbook and a merit list are
 * recognisably the same school's paperwork, and so a change to the letterhead
 * is made once rather than three times.
 */

const { PETROL, PETROL_DEEP, GOLD, MIST, SLATE, INK, WHITE } = PALETTE;

/**
 * The accent for title bands and the spine: the school's own crest colour
 * when it has set one, otherwise the platform petrol. A school keeps its
 * colour; the gold, the neutrals and the band ramp stay constant so a
 * document is legible whatever accent it wears.
 */
export const accentOf = (brand) => hexToRgb(brand?.crestColour || brand?.crest_colour) || PETROL;

const fill = (doc, c) => doc.setFillColor(c[0], c[1], c[2]);
const ink = (doc, c) => doc.setTextColor(c[0], c[1], c[2]);
const stroke = (doc, c) => doc.setDrawColor(c[0], c[1], c[2]);

export function box(doc, x, y, w, h, colour) {
  fill(doc, colour);
  doc.rect(x, y, w, h, 'F');
}

export function label(doc, text, x, y, { size = 8, weight = 'bold', colour = INK, align = 'left', style } = {}) {
  doc.setFont('helvetica', style || weight);
  doc.setFontSize(size);
  ink(doc, colour);
  doc.text(String(text ?? ''), x, y, { align });
}

/** Truncate to fit a column, so long text never runs into the next one. */
export function clip(doc, text, width, size, weight = 'normal') {
  doc.setFont('helvetica', weight);
  doc.setFontSize(size);
  const s = String(text ?? '');
  if (doc.getTextWidth(s) <= width) return s;
  let out = s;
  while (out.length > 1 && doc.getTextWidth(`${out}…`) > width) out = out.slice(0, -1);
  return `${out}…`;
}

/* ── Page furniture ────────────────────────────────────────────────────── */

/** The vertical spine down the left edge: gold at the crest, accent below. */
export function spine(doc, accent) {
  const h = doc.internal.pageSize.getHeight();
  doc.setLineWidth(18);
  stroke(doc, GOLD);
  doc.line(14, 6, 14, 68);
  stroke(doc, accent);
  doc.line(14, 67, 14, h - 7);
  doc.setLineWidth(1);
}

/**
 * The letterhead: crest centred at the very top, the school beneath it, then
 * the contacts on one line.
 *
 * Centring the crest leaves both flanks of the page free — which is what lets
 * the chart sit on one side of the learner block and the photograph on the
 * other. The contacts run as a single line rather than three so the whole
 * head still finishes where it always did, and nothing below has to move.
 *
 * Returns the y the caller may continue from.
 */
export function letterhead(doc, brand, logo) {
  const w = doc.internal.pageSize.getWidth();
  const crest = 42;
  if (logo) {
    try { doc.addImage(logo, (w - crest) / 2, 10, crest, crest, undefined, 'FAST'); } catch { /* printed without */ }
  }
  label(doc, (brand?.schoolName || brand?.name || 'School').toUpperCase(), w / 2, logo ? 66 : 40,
    { size: 12, colour: PETROL, align: 'center' });

  const contacts = [
    brand?.address && `Address: ${brand.address}`,
    brand?.phone && `Tel: ${brand.phone}`,
    brand?.email && `Email: ${brand.email}`,
  ].filter(Boolean).join('   ·   ');
  if (contacts) {
    label(doc, clip(doc, contacts, w - 80, 8.5, 'normal'), w / 2, logo ? 80 : 56,
      { size: 8.5, weight: 'normal', colour: SLATE, align: 'center' });
  }
  return 90.5;
}

/** The accent band naming what this document is. */
export function titleBand(doc, title, accent, y = 90.5) {
  const w = doc.internal.pageSize.getWidth();
  box(doc, 23, y, w - 46, 20.4, accent);
  label(doc, String(title).toUpperCase(), w / 2, y + 14, { size: 10.5, colour: WHITE, align: 'center' });
  return y + 20.4;
}

/** Motto bar and colour blocks along the bottom edge of the current page. */
export function footerBand(doc, brand, accent) {
  const w = doc.internal.pageSize.getWidth();
  const h = doc.internal.pageSize.getHeight();
  const y = h - 24;
  box(doc, w - 179, y, 18, 19.2, GOLD);
  box(doc, w - 161, y, 18, 19.2, GOLD);
  box(doc, w - 143, y, 133, 19.2, accent);
  const motto = brand?.motto;
  if (motto) {
    label(doc, `School Motto: ${motto}`.toUpperCase(), w - 16, y + 13,
      { size: 7.5, colour: WHITE, align: 'right', style: 'bolditalic' });
  }
}

/**
 * The school crest, faint and centred, as the background of the current page.
 *
 * Drawn *before* the page's content, so the marks sit on top of it rather
 * than the crest sitting over the marks — which is what a watermark is. That
 * means each page stamps its own, rather than a pass over the document at the
 * end, and every caller has to open a page through `beginPage`.
 *
 * A crest with no transparency — a JPEG, typically — arrives as a solid
 * rectangle, so the opacity has to be low enough that its background does not
 * read as a grey box and high enough to be visible at all. jsPDF builds
 * without GState cannot fade an image, and stamping it opaque would bury the
 * page, so those skip it.
 */
export function watermark(doc, logo, { opacity = 0.1, scale = 0.62 } = {}) {
  if (!logo) return;
  const w = doc.internal.pageSize.getWidth();
  const h = doc.internal.pageSize.getHeight();
  const size = Math.min(w, h) * scale;

  let faded = null;
  try {
    faded = doc.GState({ opacity });
    doc.setGState(faded);
  } catch { return; }

  try {
    doc.addImage(logo, (w - size) / 2, (h - size) / 2, size, size, undefined, 'FAST');
  } catch { /* the document is fine without it */ }
  try { doc.setGState(doc.GState({ opacity: 1 })); } catch { /* ignore */ }
}

/**
 * Open a page: the watermark underneath, then the letterhead and title band
 * on top of it. Every document starts each of its pages here, so no page ends
 * up without the school's mark.
 */
export function beginPage(doc, brand, logo, title) {
  watermark(doc, logo);
  letterhead(doc, brand, logo);
  return titleBand(doc, title, accentOf(brand));
}

/** Page numbers, drawn across every page once the count is known. */
export function pageNumbers(doc) {
  const h = doc.internal.pageSize.getHeight();
  const pages = doc.internal.getNumberOfPages();
  for (let i = 1; i <= pages; i += 1) {
    doc.setPage(i);
    label(doc, `Page ${i} of ${pages}`, 30, h - 11, { size: 7.5, weight: 'normal', colour: SLATE });
  }
}

/**
 * Finish a document: the spine and motto band on every page, then page
 * numbers once the count is known. The watermark is not done here — it is
 * laid down by `beginPage`, underneath the content rather than over it.
 */
export function finish(doc, brand) {
  const accent = accentOf(brand);
  const pages = doc.internal.getNumberOfPages();
  for (let i = 1; i <= pages; i += 1) {
    doc.setPage(i);
    spine(doc, accent);
    footerBand(doc, brand, accent);
  }
  pageNumbers(doc);
}

export { MIST, INK, SLATE, GOLD, PETROL, PETROL_DEEP, WHITE };
