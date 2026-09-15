import { jsPDF } from 'jspdf';
import { PALETTE } from './pdfTheme';
import { box, label, clip, beginPage, finish } from './pdfChrome';

/**
 * Parent activation slips — cut along the dashed lines, one to a family,
 * sent home with the learner or handed over at the office.
 *
 * Each slip carries the one thing that turns the account on (the code), where
 * to use it, and which contact to type beside it. Four to a page, on the
 * school's letterhead and watermark like every other document it prints, so a
 * parent can see it came from the school.
 */

const { PETROL, GOLD, MIST, SLATE, INK } = PALETTE;
const PER_PAGE = 4;

const dateLabel = (d) => new Date(d).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });

function dashedLine(doc, x1, y, x2) {
  doc.setDrawColor(SLATE[0], SLATE[1], SLATE[2]);
  doc.setLineWidth(0.6);
  doc.setLineDashPattern([4, 3], 0);
  doc.line(x1, y, x2, y);
  doc.setLineDashPattern([], 0);
}

function slip(doc, s, { x, y, w, h, activateUrl, schoolName }) {
  const pad = 14;
  const left = x + pad;
  const right = x + w - pad;

  label(doc, 'PARENT PORTAL ACTIVATION', left, y + 14, { size: 8.5, colour: GOLD });
  label(doc, clip(doc, schoolName || '', w / 2, 8.5, 'normal'), right, y + 14, { size: 8.5, weight: 'normal', colour: SLATE, align: 'right' });

  label(doc, clip(doc, s.parent_name, w - pad * 2, 12.5, 'bold'), left, y + 31, { size: 12.5, colour: INK });
  const learners = s.learners.map((l) => [l.name, l.class_name].filter(Boolean).join(', ')).join('  ·  ');
  label(doc, clip(doc, `Parent of ${learners || '—'}`, w - pad * 2, 9, 'normal'), left, y + 45, { size: 9, weight: 'normal', colour: SLATE });

  // The code, large, in its own panel — the part a parent has to copy exactly.
  const panelY = y + 54;
  const panelW = 200;
  box(doc, left, panelY, panelW, 52, MIST);
  label(doc, 'YOUR CODE', left + 10, panelY + 15, { size: 7.5, colour: SLATE });
  doc.setFont('courier', 'bold');
  doc.setFontSize(22);
  doc.setTextColor(PETROL[0], PETROL[1], PETROL[2]);
  doc.text(s.code, left + 10, panelY + 40);
  label(doc, `Expires ${dateLabel(s.expires_at)}`, left + panelW - 8, panelY + 15, { size: 7, weight: 'normal', colour: SLATE, align: 'right' });

  // Steps beside the code.
  const stepsX = left + panelW + 16;
  const stepsW = right - stepsX;
  const signIn = s.phone || s.email;
  const steps = [
    '1. Open the parent portal at the address below',
    `2. Enter ${s.phone && s.email ? 'your phone number or email' : (s.phone ? 'your phone number' : 'your email')}${signIn ? `: ${signIn}` : ''}`,
    '3. Type the code, then choose a password',
    '4. Next time, just sign in with the same details',
  ];
  steps.forEach((t, i) => {
    label(doc, clip(doc, t, stepsW, 8.5, 'normal'), stepsX, panelY + 12 + i * 13, { size: 8.5, weight: 'normal', colour: INK });
  });

  // The address in full, on its own line: a parent types it, so none of it may be cut.
  label(doc, 'PORTAL', left, panelY + 70, { size: 7.5, colour: SLATE });
  label(doc, clip(doc, activateUrl, w - pad * 2 - 44, 10, 'bold'), left + 44, panelY + 70, { size: 10, colour: PETROL });

  label(doc, clip(doc, 'Keep this code private. Anyone with it can open your child\'s records. If it is lost or expires, ask the school office for a new one.', w - pad * 2, 7.5, 'normal'),
    left, y + h - 8, { size: 7.5, weight: 'normal', colour: SLATE, style: 'italic' });
}

/** The slips as a document, for a caller to save or inspect. */
export function buildActivationSlips({ slips, brand, activateUrl }) {
  const doc = new jsPDF({ orientation: 'portrait', unit: 'pt', format: 'a4' });
  const w = doc.internal.pageSize.getWidth();
  const h = doc.internal.pageSize.getHeight();
  const x = 34;
  const slipW = w - x - 24;

  for (let i = 0; i < slips.length; i += PER_PAGE) {
    if (i) doc.addPage();
    const top = beginPage(doc, brand, brand?.logo, 'Parent account activation slips') + 12;
    const bottom = h - 34;
    const slipH = (bottom - top) / PER_PAGE;

    slips.slice(i, i + PER_PAGE).forEach((s, j) => {
      const y = top + j * slipH;
      if (j) dashedLine(doc, x, y, x + slipW);
      slip(doc, s, { x, y: y + 4, w: slipW, h: slipH - 8, activateUrl, schoolName: brand?.schoolName });
    });
  }
  if (!slips.length) {
    beginPage(doc, brand, brand?.logo, 'Parent account activation slips');
    label(doc, 'Every parent selected has already activated their account.', w / 2, 160, { size: 11, weight: 'normal', colour: INK, align: 'center' });
  }
  finish(doc, brand);
  return doc;
}

/** Build the slips and hand them to the browser. */
export function activationSlipsPdf({ filename, ...opts }) {
  buildActivationSlips(opts).save(`${filename}.pdf`);
}
