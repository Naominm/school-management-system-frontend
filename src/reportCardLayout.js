import { PALETTE, BAND_COLOURS, hexToRgb } from './pdfTheme';
import { subjectCode, rangeLabel } from './reportFormat';
import { box, label, clip, beginPage, finish } from './pdfChrome';

/**
 * The printed CBC report card.
 *
 * One learner per A4 page, laid out the way a Kenyan competency-based card
 * reads: crest and contacts, the period band, the learner beside their photo
 * and a chart of their subjects, the headline tiles, the learning-areas
 * table, strand averages, both remarks with signatures, the grade
 * descriptors, and a QR that opens the learner's record.
 *
 * Everything past the marks is optional. No photo prints initials, no
 * signature prints a ruled line, no CBC points drops the points tiles — a
 * school gets a complete card on day one and a richer one as it fills its
 * details in.
 */

const W = 595.28;
const M = 30;                    // content margin
const RIGHT = W - M;             // right edge of the content band
const CW = RIGHT - M;            // content width
const FOOTER_TOP = 810;          // nothing may be drawn below this

const { PETROL, GOLD, TEAL, CLAY, MIST, CLOUD, SLATE, INK } = PALETTE;

/* Column proportions of the learning-areas table, from the reference card. */
const COLS = [0.2006, 0.0774, 0.056, 0.0774, 0.4315, 0.1568];

/* ── Small drawing helpers ─────────────────────────────────────────────── */

const fill = (doc, c) => doc.setFillColor(c[0], c[1], c[2]);
const ink = (doc, c) => doc.setTextColor(c[0], c[1], c[2]);
const stroke = (doc, c) => doc.setDrawColor(c[0], c[1], c[2]);

/* ── Page furniture ────────────────────────────────────────────────────── */

/* ── Learner block ─────────────────────────────────────────────────────── */

/* The learner block runs chart | identity | photograph, left to right. */
const PHOTO = 90;
const PHOTO_X = RIGHT - PHOTO;          // the photograph sits on the right
/* The chart is inset from the margin, not flush with it: its y axis is
 * labelled to the left of the plot, and at the page margin those labels
 * would run into the spine. */
const CHART_X = 44;
const CHART_W = 236;
const ID_X = CHART_X + CHART_W + 14;    // the learner between them
const ID_W = PHOTO_X - ID_X - 12;

/** Passport photo, or the learner's initials when none is on file. */
function photoFrame(doc, student, photo, accent) {
  const x = PHOTO_X;
  const y = 116.4;
  const s = PHOTO;
  if (photo) {
    try {
      doc.addImage(photo, x, y, s, s, undefined, 'FAST');
      stroke(doc, CLOUD);
      doc.rect(x, y, s, s);
      return;
    } catch { /* fall through to initials */ }
  }
  box(doc, x, y, s, s, MIST);
  stroke(doc, CLOUD);
  doc.rect(x, y, s, s);
  const initials = `${student.first_name?.[0] || ''}${student.last_name?.[0] || ''}`.toUpperCase();
  label(doc, initials || '—', x + s / 2, y + s / 2 + 9, { size: 26, colour: accent, align: 'center' });
}

function learnerIdentity(doc, student, term, year) {
  const x = ID_X;
  /* The name wraps rather than clipping — a learner's own name is the one
   * thing on the card that must not be cut short to fit. */
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(11);
  const name = doc.splitTextToSize(`${student.first_name} ${student.last_name}`.toUpperCase(), ID_W).slice(0, 2);
  name.forEach((line, i) => label(doc, line, x, 130 + i * 13, { size: 11 }));

  const rows = [
    ['ADMNO', student.admission_number || '—'],
    ['GRADE', student.class_name || '—'],
    ['TERM', `${term}  ${year}`],
  ];
  if (student.position) rows.push(['POSITION', `${student.position} of ${student.position_of}`]);

  const top = 130 + name.length * 13 + 8;
  rows.forEach(([k, v], i) => {
    const y = top + i * 14;
    label(doc, `${k}:`, x, y, { size: 8.5, colour: PETROL });
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8.5);
    const w = doc.getTextWidth(`${k}: `);
    label(doc, clip(doc, v, ID_W - w, 8.5), x + w, y, { size: 8.5, weight: 'normal' });
  });
}

/**
 * Two series over the learning areas: this learner as columns, the class
 * average as a line across them.
 *
 * A mark on its own says how the learner did. Against the class it says
 * something a table cannot — whether a low score is this learner or a hard
 * subject, and where they are pulling ahead of their peers. The y axis is
 * banded by performance level, so the chart is read in the same terms as
 * the grades beside it.
 */
function subjectChart(doc, marks, scale, x, y, w, h, learnerName) {
  if (!marks.length) return;
  const base = y + h - 11;             // baseline, leaving room for the codes
  const top = y + 13;                  // and for the legend above
  const plot = base - top;
  const at = (pct) => base - (Math.max(0, Math.min(100, pct)) / 100) * plot;

  /* Gridlines at the band boundaries, so a column can be read off as a
   * performance level rather than a percentage. */
  stroke(doc, CLOUD);
  doc.setLineWidth(0.4);
  const ticks = bandTicks(scale);
  for (const t of ticks) {
    doc.line(x, at(t.at), x + w, at(t.at));
    label(doc, t.label, x - 3, at(t.at) + 2, { size: 5, weight: 'normal', colour: SLATE, align: 'right' });
  }

  const slot = w / marks.length;
  const barW = Math.min(13, slot * 0.5);

  marks.forEach((m, i) => {
    const cx = x + slot * i + slot / 2;
    const yTop = at(m.percentage ?? 0);
    box(doc, cx - barW / 2, yTop, barW, base - yTop, bandColour(m.band));
    label(doc, subjectCode(m.learning_area), cx, base + 7.5, { size: 5.2, colour: SLATE, align: 'center' });
  });

  /* The class average, drawn over the columns as a connected line. */
  const avg = marks.map((m, i) => (m.class_average == null ? null : {
    x: x + slot * i + slot / 2, y: at(m.class_average),
  }));
  stroke(doc, PETROL);
  doc.setLineWidth(0.9);
  for (let i = 1; i < avg.length; i += 1) {
    if (avg[i - 1] && avg[i]) doc.line(avg[i - 1].x, avg[i - 1].y, avg[i].x, avg[i].y);
  }
  fill(doc, PETROL);
  for (const p of avg) if (p) doc.circle(p.x, p.y, 1.4, 'F');

  stroke(doc, SLATE);
  doc.setLineWidth(0.7);
  doc.line(x, base, x + w, base);
  doc.setLineWidth(1);

  /* Legend: which series is the learner, which is the class. */
  const hasAvg = avg.some(Boolean);
  box(doc, x, y + 2, 7, 6, GOLD);
  label(doc, clip(doc, learnerName, 90, 5.5, 'bold'), x + 10, y + 7, { size: 5.5, colour: SLATE });
  if (hasAvg) {
    const lx = x + 108;
    stroke(doc, PETROL);
    doc.setLineWidth(0.9);
    doc.line(lx, y + 5, lx + 7, y + 5);
    fill(doc, PETROL);
    doc.circle(lx + 3.5, y + 5, 1.4, 'F');
    label(doc, 'Class average', lx + 10, y + 7, { size: 5.5, colour: SLATE });
    doc.setLineWidth(1);
  }
}

/**
 * Where to rule the chart's y axis. The school's own bands when it has them,
 * so the gridlines mean something; plain quarters otherwise.
 */
function bandTicks(scale) {
  const bands = (scale || []).filter((g) => g.min_percentage > 0);
  if (bands.length >= 3 && bands.length <= 8) {
    return bands.map((g) => ({ at: g.min_percentage, label: g.grade }));
  }
  return [25, 50, 75, 100].map((v) => ({ at: v, label: String(v) }));
}

const bandColour = (band) => BAND_COLOURS[band] || SLATE;

/* ── Headline tiles ────────────────────────────────────────────────────── */

function tiles(doc, student, y) {
  const items = [
    ['Performance Level', student.performance_level
      ? `${student.performance_level.grade} (${student.performance_level.band})` : '—'],
    ['Total Marks', student.total_marks?.out_of
      ? `${round(student.total_marks.scored)}/${round(student.total_marks.out_of)}` : '—'],
    student.total_points
      ? ['Total Points', `${student.total_points.scored}/${student.total_points.out_of}`]
      : ['Average', student.average_percentage != null ? `${student.average_percentage.toFixed(1)}%` : '—'],
    student.mean_points != null
      ? ['Mean Points', String(student.mean_points)]
      : ['Position', student.position ? `${student.position} of ${student.position_of}` : '—'],
  ];
  const gap = 10;
  const w = (CW - gap * (items.length - 1)) / items.length;
  items.forEach(([k, v], i) => {
    const x = M + i * (w + gap);
    box(doc, x, y, w, 40.2, MIST);
    label(doc, k, x + w / 2, y + 16, { size: 8, colour: SLATE, align: 'center' });
    label(doc, v, x + w / 2, y + 31, { size: 10, align: 'center', colour: PETROL });
  });
  return y + 40.2;
}

const round = (n) => (n == null ? '—' : Math.round(n));

/* ── Learning areas table ──────────────────────────────────────────────── */

function marksTable(doc, marks, y) {
  const heads = ['LEARNING AREAS', 'MARKS', 'DEV.', 'GRADE', 'COMMENT', 'TEACHER'];
  const widths = COLS.map((f) => f * CW);
  const xs = widths.reduce((acc, w) => [...acc, acc.at(-1) + w], [M]);

  const headH = 22.6;
  box(doc, M, y, CW, headH, MIST);
  heads.forEach((h, i) => {
    const centred = i > 0 && i < 4;
    label(doc, h, centred ? xs[i] + widths[i] / 2 : xs[i] + 5, y + 14.5,
      { size: 7.5, colour: SLATE, align: centred ? 'center' : 'left' });
  });

  let ry = y + headH;
  const rowH = marks.length > 12 ? 13 : 16;

  if (!marks.length) {
    label(doc, 'No marks recorded for this period.', M + 5, ry + 12, { size: 8, weight: 'normal', colour: SLATE });
    return ry + 24;
  }

  marks.forEach((m, i) => {
    if (i % 2 === 1) box(doc, M, ry, CW, rowH, MIST);
    const ty = ry + rowH / 2 + 2.6;
    const size = rowH > 14 ? 7.5 : 7;

    label(doc, clip(doc, m.learning_area, widths[0] - 10, size), xs[0] + 5, ty, { size, weight: 'normal' });
    label(doc, m.percentage != null ? `${m.percentage.toFixed(0)}%` : '—', xs[1] + widths[1] / 2, ty,
      { size, weight: 'normal', align: 'center' });

    // Movement carries its own colour: green up, red down, grey unchanged.
    const dev = m.dev;
    label(doc, dev == null ? '—' : `${dev > 0 ? '+' : ''}${dev.toFixed(0)}`, xs[2] + widths[2] / 2, ty,
      { size, weight: 'normal', align: 'center', colour: dev == null || Math.abs(dev) < 0.5 ? SLATE : (dev > 0 ? TEAL : CLAY) });

    label(doc, m.grade || '—', xs[3] + widths[3] / 2, ty, { size, align: 'center', colour: bandColour(m.band) });
    label(doc, clip(doc, m.remarks, widths[4] - 10, size), xs[4] + 5, ty, { size, weight: 'normal' });
    label(doc, clip(doc, m.teacher || '—', widths[5] - 10, size), xs[5] + 5, ty, { size, weight: 'normal', colour: SLATE });

    ry += rowH;
  });

  stroke(doc, CLOUD);
  doc.rect(M, y, CW, ry - y);
  return ry;
}

/* ── Strand averages ───────────────────────────────────────────────────── */

function strandRow(doc, groups, y) {
  if (!groups.length) return y;
  const gap = 8;
  const w = (CW - gap * (groups.length - 1)) / groups.length;
  groups.forEach((g, i) => {
    const x = M + i * (w + gap);
    box(doc, x, y, w, 32, MIST);
    label(doc, clip(doc, g.group.toUpperCase(), w - 10, 7.5, 'bold'), x + w / 2, y + 13, { size: 7.5, align: 'center' });
    label(doc, g.average != null ? g.average.toFixed(1) : '—', x + w / 2, y + 26, { size: 9, align: 'center', colour: PETROL });
  });
  return y + 32;
}

/* ── Remarks and signatures ────────────────────────────────────────────── */

function remarks(doc, student, signatures, y) {
  const gap = 12;
  const w = (CW - gap) / 2;
  const blocks = [
    ['Class Teacher Remarks', student.class_teacher, student.comments?.class_teacher_comment],
    ['Principal Remarks', student.headteacher, student.comments?.headteacher_comment],
  ];

  let deepest = y;
  blocks.forEach(([title, staff, text], i) => {
    const x = M + i * (w + gap);
    box(doc, x, y, w, 20.6, MIST);
    label(doc, [title, staff?.name].filter(Boolean).join(': '), x + 5, y + 14, { size: 8.5 });

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8);
    ink(doc, INK);
    const body = doc.splitTextToSize(text || 'No remark recorded for this period.', w - 10);
    const shown = body.slice(0, 5);
    doc.text(shown, x + 5, y + 34);

    // Signature sits under the remark: the image when one is on file, a ruled
    // line to sign by hand when not.
    const sy = y + 34 + shown.length * 10 + 12;
    label(doc, 'Signature:', x + 5, sy, { size: 8.5, weight: 'normal', colour: SLATE });
    const sig = staff?.id ? signatures.get(staff.id) : null;
    if (sig) {
      try { doc.addImage(sig, x + 55, sy - 14, 70, 20, undefined, 'FAST'); } catch { /* line instead */ }
    } else {
      stroke(doc, CLOUD);
      doc.line(x + 55, sy, x + Math.min(w - 5, 165), sy);
    }
    deepest = Math.max(deepest, sy + 8);
  });
  return deepest;
}

/* ── Grade descriptors ─────────────────────────────────────────────────── */

/**
 * The scale this card was marked against, printed so a parent can read the
 * card without knowing the school's banding by heart. Built from the
 * school's own grading_scales, so a school on a lettered scale gets its own
 * letters rather than CBC bands it does not use.
 */
/** Rows the descriptor table will occupy, for the overflow test above. */
function descriptorsHeight(scale) {
  if (!scale.length) return 0;
  const rows = 3 + (scale.some((g) => g.points > 0) ? 1 : 0);   // level, performance, [points], range
  return 8 + rows * 19;
}

function descriptors(doc, scale, bands, y) {
  if (!scale.length) return y;

  label(doc, 'GRADE DESCRIPTORS', M, y, { size: 8.5, colour: PETROL });
  y += 8;

  const labelW = 112;
  const cellW = (CW - labelW) / scale.length;
  const rowH = 19;

  // Band header spans the grades that belong to it, when the scale is CBC.
  const families = bands
    .map((b) => ({ ...b, span: scale.filter((g) => b.grades.includes(g.grade)).length }))
    .filter((b) => b.span > 0);

  const rows = [
    ['Level', families.length
      ? families.map((b) => ({ text: b.label, span: b.span }))
      : scale.map((g) => ({ text: g.remark || g.grade, span: 1 }))],
    ['Performance', scale.map((g) => ({ text: g.grade, span: 1 }))],
    ...(scale.some((g) => g.points > 0) ? [['Points', scale.map((g) => ({ text: String(g.points), span: 1 }))]] : []),
    ['Range (%)', scale.map((g) => ({ text: rangeLabel(g.min_percentage, g.max_percentage), span: 1 }))],
  ];

  rows.forEach(([name, cells], r) => {
    const ry = y + r * rowH;
    box(doc, M, ry, labelW, rowH, MIST);
    label(doc, name, M + 5, ry + 13, { size: 8 });
    let cx = M + labelW;
    cells.forEach((c) => {
      const cw = cellW * c.span;
      stroke(doc, CLOUD);
      doc.rect(cx, ry, cw, rowH);
      label(doc, clip(doc, c.text, cw - 4, 7, 'normal'), cx + cw / 2, ry + 13,
        { size: 7, weight: 'normal', align: 'center' });
      cx += cw;
    });
  });
  return y + rows.length * rowH;
}

/* ── Verification ──────────────────────────────────────────────────────── */

function verification(doc, student, qr, y) {
  if (qr) {
    try { doc.addImage(qr, M, y, 44, 44, undefined, 'FAST'); } catch { /* code alone */ }
  }
  const x = M + 55;
  label(doc, `Verification Code: ${student.verification_code}`, x, y + 14, { size: 8 });
  label(doc, 'Scan to open this learner’s record.', x, y + 27,
    { size: 7.5, weight: 'normal', colour: SLATE });
  if (student.admission_number) {
    label(doc, `Admission number: ${student.admission_number}`, x, y + 38,
      { size: 7.5, weight: 'normal', colour: SLATE });
  }
}

/* ── Page assembly ─────────────────────────────────────────────────────── */

/**
 * Draw one learner's card onto the current page.
 *
 * `assets` holds the images already fetched and converted: `logo`, and maps
 * of `photos`, `signatures` and `qrs` keyed the way `loadAssets` builds them.
 * Any of them may be missing — each section falls back on its own.
 */
export function drawReportCard(doc, { card, student, assets = {} }) {
  const school = card.school || {};
  const accent = hexToRgb(school.crest_colour) || PETROL;
  const period = ['Academic Report Form', student.class_name, `Term ${card.term}`, `(${card.academic_year})`]
    .filter(Boolean).join('  -  ');

  beginPage(doc, school, assets.logo, period);

  photoFrame(doc, student, assets.photos?.get(student.id), accent);
  learnerIdentity(doc, student, card.term, card.academic_year);
  subjectChart(doc, student.marks, card.grading_scale, CHART_X, 114, CHART_W, 96,
    `${student.first_name} ${student.last_name}`);

  let y = tiles(doc, student, 219.3);
  y = marksTable(doc, student.marks, y + 14);
  y = strandRow(doc, student.group_averages, y + 12);
  y = remarks(doc, student, assets.signatures || new Map(), y + 14);

  /* A class with many learning areas can run the table past the point where
   * the descriptors and the QR still fit. Rather than let them collide with
   * the footer, carry them onto a second page for that learner. */
  const tail = descriptorsHeight(card.grading_scale || []) + 74;
  if (y + tail > FOOTER_TOP) {
    doc.addPage();
    beginPage(doc, school, assets.logo, `${period}  (continued)`);
    y = 130;
  }

  y = descriptors(doc, card.grading_scale || [], card.bands || [], y + 16);
  verification(doc, student, assets.qrs?.get(student.id), y + 14);
}

/**
 * One page per learner, in the order the server returned them, then the
 * shared finish: spine, motto band, watermark and page numbers on every page.
 */
export function drawReportCards(doc, card, assets) {
  card.students.forEach((student, i) => {
    if (i > 0) doc.addPage();
    drawReportCard(doc, { card, student, assets });
  });
  finish(doc, { ...(card.school || {}), schoolName: card.school?.name });
}
