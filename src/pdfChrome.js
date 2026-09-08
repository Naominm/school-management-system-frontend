import { PALETTE, hexToRgb } from './pdfTheme';

/**
 * The furniture every printed document shares — the spine, the crest and
 * contact block, the period band, the motto footer, and the watermark.
 *
 * Kept in one module so a report card, a markbook and a merit list are
 * recognisably the same school's paperwork, and so a change to the letterhead
 * is made once rather than three times.
 */

const { CYAN, GREEN, GREEN_DARK, MIST, SLATE, INK, WHITE } = PALETTE;

/** The school's accent, falling back to the platform cyan. */
export const accentOf = (brand) => hexToRgb(brand?.crestColour || brand?.crest_colour) || CYAN;

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

/** The vertical spine down the left edge: green at the crest, accent below. */
export function spine(doc, accent) {
  const h = doc.internal.pageSize.getHeight();
  doc.setLineWidth(18);
  stroke(doc, GREEN);
  doc.line(14, 6, 14, 68);
  stroke(doc, accent);
  doc.line(14, 67, 14, h - 7);
  doc.setLineWidth(1);
}

/**
 * Crest, school name and the contact block, centred the way a letterhead is.
 * Returns the y the caller may continue from.
 */
export function letterhead(doc, brand, logo) {
  const w = doc.internal.pageSize.getWidth();
  if (logo) {
    try { doc.addImage(logo, 30, 20, 55, 55, undefined, 'FAST'); } catch { /* printed without */ }
  }
  label(doc, (brand?.schoolName || brand?.name || 'School').toUpperCase(), w / 2, 32,
    { size: 12, colour: GREEN_DARK, align: 'center' });

  const lines = [
    brand?.address && `Address: ${brand.address}`,
    brand?.phone && `Tel: ${brand.phone}`,
    brand?.email && `Email: ${brand.email}`,
  ].filter(Boolean);
  lines.forEach((line, i) => label(doc, line, w / 2, 50 + i * 16, { size: 9, align: 'center' }));
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
  box(doc, w - 179, y, 18, 19.2, GREEN);
  box(doc, w - 161, y, 18, 19.2, GREEN);
  box(doc, w - 143, y, 133, 19.2, accent);
  const motto = brand?.motto;
  if (motto) {
    label(doc, `School Motto: ${motto}`.toUpperCase(), w - 16, y + 13,
      { size: 7.5, colour: WHITE, align: 'right', style: 'bolditalic' });
  }
}

/**
 * The school crest, faint and centred, behind the content of every page.
 *
 * Drawn last so the page count is known, and at low opacity so it marks the
 * document as the school's without competing with anything on top of it.
 * jsPDF versions without GState simply skip the transparency rather than
 * stamping an opaque logo over the text.
 */
export function watermark(doc, logo) {
  if (!logo) return;
  const w = doc.internal.pageSize.getWidth();
  const h = doc.internal.pageSize.getHeight();
  const size = Math.min(w, h) * 0.55;
  const pages = doc.internal.getNumberOfPages();

  for (let i = 1; i <= pages; i += 1) {
    doc.setPage(i);
    let faded = null;
    try {
      faded = doc.GState({ opacity: 0.06 });
      doc.setGState(faded);
    } catch { faded = null; }
    // Without transparency support, a solid crest would obscure the marks.
    if (!faded) return;
    try {
      doc.addImage(logo, (w - size) / 2, (h - size) / 2, size, size, undefined, 'FAST');
    } catch { /* the document is fine without it */ }
    try { doc.setGState(doc.GState({ opacity: 1 })); } catch { /* ignore */ }
  }
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
 * Finish a document: watermark every page, number them, and put the motto
 * band on each. Called once, after all content is laid down.
 */
export function finish(doc, brand, logo) {
  const accent = accentOf(brand);
  const pages = doc.internal.getNumberOfPages();
  for (let i = 1; i <= pages; i += 1) {
    doc.setPage(i);
    spine(doc, accent);
    footerBand(doc, brand, accent);
  }
  watermark(doc, logo);
  pageNumbers(doc);
}

export { MIST, INK, SLATE, GREEN, GREEN_DARK, CYAN, WHITE };
