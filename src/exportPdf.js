import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import { PALETTE, hexToRgb } from './pdfTheme';

/**
 * Exported documents — markbook and merit list.
 *
 * They share the report card's palette and furniture (the green-to-cyan
 * spine, the period band, the motto footer), so a stack of printouts from
 * this system reads as one set rather than three unrelated documents.
 *
 * The report card itself lives in `reportCardPdf.js`: it is a designed page
 * rather than a table, and keeping it separate stops that layout from
 * bleeding into these two.
 */

const { CYAN, GREEN, GREEN_DARK, MIST, CLOUD, SLATE, INK, WHITE, RED } = PALETTE;

const accentOf = (brand) => hexToRgb(brand?.crestColour) || CYAN;

/** The vertical spine down the left edge, on every page. */
function spine(doc, accent) {
  const h = doc.internal.pageSize.getHeight();
  doc.setLineWidth(18);
  doc.setDrawColor(...GREEN);
  doc.line(14, 6, 14, 68);
  doc.setDrawColor(...accent);
  doc.line(14, 67, 14, h - 7);
  doc.setLineWidth(1);
}

/** Crest, title and the period band, matching the report card's header. */
function header(doc, title, subtitle, brand) {
  const w = doc.internal.pageSize.getWidth();
  const accent = accentOf(brand);
  let shift = 0;
  if (brand?.logo) {
    try { doc.addImage(brand.logo, 30, 18, 40, 40, undefined, 'FAST'); shift = 52; } catch { /* printed without */ }
  }

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(12);
  doc.setTextColor(...GREEN_DARK);
  doc.text((brand?.schoolName || 'School').toUpperCase(), 30 + shift, 34);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8.5);
  doc.setTextColor(...SLATE);
  const contacts = [brand?.address, brand?.phone, brand?.email].filter(Boolean).join('   ·   ');
  if (contacts) doc.text(contacts, 30 + shift, 48);

  doc.setFillColor(...accent);
  doc.rect(23, 62, w - 46, 20.4, 'F');
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10.5);
  doc.setTextColor(...WHITE);
  doc.text([title, subtitle].filter(Boolean).join('  -  ').toUpperCase(), w / 2, 76, { align: 'center' });
  doc.setTextColor(...INK);
}

/** Motto bar, colour blocks and the page number, on every page. */
function footer(doc, brand) {
  const w = doc.internal.pageSize.getWidth();
  const h = doc.internal.pageSize.getHeight();
  const accent = accentOf(brand);
  const pages = doc.internal.getNumberOfPages();

  for (let i = 1; i <= pages; i += 1) {
    doc.setPage(i);
    spine(doc, accent);

    const y = h - 24;
    doc.setFillColor(...GREEN);
    doc.rect(w - 179, y, 18, 19.2, 'F');
    doc.rect(w - 161, y, 18, 19.2, 'F');
    doc.setFillColor(...accent);
    doc.rect(w - 143, y, 133, 19.2, 'F');

    doc.setFont('helvetica', 'bolditalic');
    doc.setFontSize(7.5);
    doc.setTextColor(...WHITE);
    if (brand?.motto) doc.text(brand.motto.toUpperCase(), w - 16, y + 13, { align: 'right' });

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8);
    doc.setTextColor(...SLATE);
    doc.text(`Page ${i} of ${pages}`, 30, y + 13);
  }
}

const table = (doc, head, body, startY, opts = {}) => autoTable(doc, {
  head: [head], body, startY,
  margin: { left: 30, right: 30 },
  styles: { fontSize: 8, cellPadding: 4, overflow: 'linebreak', textColor: INK, lineColor: CLOUD, lineWidth: 0.5 },
  headStyles: { fillColor: MIST, textColor: SLATE, fontStyle: 'bold', fontSize: 7.5 },
  alternateRowStyles: { fillColor: MIST },
  ...opts,
});

/** Markbook: learners down, subjects across. Landscape — many columns. */
export function markbookPdf({ className, term, year, students, areas, scoreOf, filename, brand }) {
  const doc = new jsPDF({ orientation: 'landscape', unit: 'pt', format: 'a4' });
  header(doc, `Markbook - ${className}`, `Term ${term} · ${year}`, brand);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8.5);
  doc.setTextColor(...SLATE);
  doc.text(`${students.length} learners   ·   ${areas.length} learning areas`, 30, 98);
  doc.setTextColor(...INK);

  const head = ['Adm. No.', 'Learner', ...areas.map((a) => a.name), 'Avg'];
  const body = students.map((s) => {
    const vals = areas.map((a) => scoreOf(s.id, a.id));
    const nums = vals.filter((v) => v !== '' && v != null).map(Number);
    const avg = nums.length ? (nums.reduce((x, y) => x + y, 0) / nums.length).toFixed(1) : '—';
    return [s.admission_number || '—', `${s.last_name} ${s.first_name}`, ...vals.map((v) => ((v ?? '') === '' ? '—' : v)), avg];
  });
  table(doc, head, body, 108, {
    columnStyles: {
      0: { cellWidth: 60 },
      1: { cellWidth: 110 },
      [head.length - 1]: { fontStyle: 'bold', textColor: GREEN_DARK },
    },
  });
  footer(doc, brand);
  doc.save(`${filename}.pdf`);
}

/** Merit list: ranked averages, with the class summary above the table. */
export function meritListPdf({ className, term, year, rows, summary, areas = [], subjectSummary = [], filename, brand }) {
  const wide = areas.length > 3;
  const doc = new jsPDF({ orientation: wide ? 'landscape' : 'portrait', unit: 'pt', format: 'a4' });
  header(doc, `Merit list - ${className}`, `Term ${term} · ${year}`, brand);

  /* Summary tiles, the same shape as the report card's headline row. */
  const s = summary || {};
  const w = doc.internal.pageSize.getWidth();
  const tiles = [
    ['Ranked', String(s.ranked ?? rows.length)],
    ['Class average', s.class_average != null ? `${s.class_average.toFixed(1)}%` : '—'],
    ['Highest', s.highest != null ? `${s.highest.toFixed(1)}%` : '—'],
    ['Pass rate', s.pass_rate != null ? `${s.pass_rate.toFixed(0)}%` : '—'],
  ];
  const gap = 10;
  const tw = (w - 60 - gap * (tiles.length - 1)) / tiles.length;
  tiles.forEach(([k, v], i) => {
    const x = 30 + i * (tw + gap);
    doc.setFillColor(...MIST);
    doc.rect(x, 94, tw, 36, 'F');
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(7.5);
    doc.setTextColor(...SLATE);
    doc.text(k.toUpperCase(), x + tw / 2, 108, { align: 'center' });
    doc.setFontSize(10);
    doc.setTextColor(...GREEN_DARK);
    doc.text(v, x + tw / 2, 123, { align: 'center' });
  });
  doc.setTextColor(...INK);

  // Score and grade share a cell so the sheet stays readable across many subjects.
  const head = ['#', 'Adm. No.', 'Learner', ...areas.map((a) => a.name), 'Avg %', 'Result'];
  const body = rows.map((r) => [
    r.position, r.admission_number || '—', `${r.last_name} ${r.first_name}`,
    ...areas.map((a) => {
      const m = r.marks?.[a.id];
      return m ? `${m.score}${m.grade ? ` ${m.grade}` : ''}` : '—';
    }),
    r.average_percentage?.toFixed(1) ?? '—',
    r.is_pass ? 'Pass' : 'Below',
  ]);
  const foot = subjectSummary.length
    ? [['', '', 'Class average', ...areas.map((a) => {
      const x = subjectSummary.find((y) => y.id === a.id);
      return x?.average != null ? `${x.average.toFixed(1)}%` : '—';
    }), s.class_average != null ? s.class_average.toFixed(1) : '—', '']]
    : undefined;

  table(doc, head, body, 144, {
    foot,
    footStyles: { fillColor: MIST, textColor: GREEN_DARK, fontStyle: 'bold', fontSize: 7.5 },
    columnStyles: {
      0: { cellWidth: 24, fontStyle: 'bold' },
      1: { cellWidth: 58 },
      2: { cellWidth: 104 },
      [head.length - 2]: { fontStyle: 'bold' },
    },
    /* The result column carries the only colour in the table, so a learner
     * below the pass mark is visible without reading every row. */
    didParseCell: (data) => {
      if (data.section === 'body' && data.column.index === head.length - 1) {
        data.cell.styles.textColor = data.cell.raw === 'Pass' ? GREEN_DARK : RED;
        data.cell.styles.fontStyle = 'bold';
      }
    },
  });
  footer(doc, brand);
  doc.save(`${filename}.pdf`);
}
