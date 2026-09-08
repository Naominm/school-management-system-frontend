import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import { PALETTE } from './pdfTheme';
import { accentOf, box, label, letterhead, titleBand, finish } from './pdfChrome';
import { bandKey } from './reportFormat';

/**
 * The class-level documents — the markbook and the merit list.
 *
 * Both are letterheaded the same way as a report card: crest and contacts,
 * the accent title band, the motto footer, the crest watermarked faintly
 * behind every page. A parent handed a report card and a head handed a
 * markbook should be looking at the same school's paperwork.
 *
 * The report card itself lives in `reportCardLayout.js`: it is a designed
 * page rather than a table, and keeping it separate stops that layout from
 * bleeding into these two.
 */

const { GREEN, GREEN_DARK, MIST, CLOUD, SLATE, INK, RED, AMBER, CYAN } = PALETTE;

/* A grade's colour, so a sheet of numbers still reads at a glance. */
const BAND_COLOURS = { EE: GREEN, ME: CYAN, AE: AMBER, BE: RED };
const bandColour = (grade) => BAND_COLOURS[bandKey(grade)] || null;

/** The summary row of tiles that opens both documents. */
function tiles(doc, items, y) {
  const w = doc.internal.pageSize.getWidth();
  const gap = 10;
  const tw = (w - 60 - gap * (items.length - 1)) / items.length;
  items.forEach(([k, v, colour], i) => {
    const x = 30 + i * (tw + gap);
    box(doc, x, y, tw, 36, MIST);
    label(doc, String(k).toUpperCase(), x + tw / 2, y + 14, { size: 7, colour: SLATE, align: 'center' });
    label(doc, v, x + tw / 2, y + 29, { size: 11, colour: colour || GREEN_DARK, align: 'center' });
  });
  return y + 36;
}

const table = (doc, head, body, startY, opts = {}) => autoTable(doc, {
  head: [head], body, startY,
  margin: { left: 30, right: 30 },
  styles: {
    fontSize: 8, cellPadding: 4, overflow: 'linebreak',
    textColor: INK, lineColor: CLOUD, lineWidth: 0.5,
  },
  headStyles: { fillColor: MIST, textColor: SLATE, fontStyle: 'bold', fontSize: 7.5 },
  alternateRowStyles: { fillColor: MIST },
  // The watermark is drawn last, so table fills must not be opaque over it.
  ...opts,
});

/* ── Markbook ──────────────────────────────────────────────────────────── */

/**
 * Learners down, learning areas across — the sheet a class teacher works
 * from. Landscape, because a class sits nine or more subjects.
 *
 * Each score is tinted by its performance band and each column footed with
 * its class average, so the sheet answers the two questions it is opened
 * for: who needs attention, and which subject is carrying or costing the
 * class.
 */
export function buildMarkbook({ className, term, year, students, areas, scoreOf, gradeOf, brand }) {
  const doc = new jsPDF({ orientation: 'landscape', unit: 'pt', format: 'a4' });
  const accent = accentOf(brand);

  letterhead(doc, brand, brand?.logo);
  titleBand(doc, `Markbook  -  ${className}  -  Term ${term}  -  (${year})`, accent);

  /* Per-learner averages, and per-subject averages for the footer row. */
  const rows = students.map((s) => {
    const vals = areas.map((a) => scoreOf(s.id, a.id));
    const nums = vals.filter((v) => v !== '' && v != null).map(Number).filter((n) => !Number.isNaN(n));
    return {
      student: s,
      vals,
      average: nums.length ? nums.reduce((x, y) => x + y, 0) / nums.length : null,
    };
  });
  const columnAverage = areas.map((_, i) => {
    const nums = rows
      .map((r) => r.vals[i])
      .filter((v) => v !== '' && v != null)
      .map(Number)
      .filter((n) => !Number.isNaN(n));
    return nums.length ? nums.reduce((x, y) => x + y, 0) / nums.length : null;
  });
  const classAverage = (() => {
    const nums = rows.map((r) => r.average).filter((v) => v != null);
    return nums.length ? nums.reduce((x, y) => x + y, 0) / nums.length : null;
  })();
  const graded = rows.filter((r) => r.average != null).length;

  const y = tiles(doc, [
    ['Learners', String(students.length)],
    ['Learning areas', String(areas.length)],
    ['Marks recorded', `${graded}/${students.length}`],
    ['Class average', classAverage != null ? `${classAverage.toFixed(1)}%` : '—'],
  ], 94);

  const head = ['Adm. No.', 'Learner', ...areas.map((a) => a.name), 'Avg'];
  const body = rows.map((r) => [
    r.student.admission_number || '—',
    `${r.student.last_name} ${r.student.first_name}`,
    ...r.vals.map((v) => ((v ?? '') === '' ? '—' : v)),
    r.average != null ? r.average.toFixed(1) : '—',
  ]);
  const foot = [[
    '', 'Class average',
    ...columnAverage.map((v) => (v != null ? v.toFixed(1) : '—')),
    classAverage != null ? classAverage.toFixed(1) : '—',
  ]];

  table(doc, head, body, y + 14, {
    foot,
    footStyles: { fillColor: MIST, textColor: GREEN_DARK, fontStyle: 'bold', fontSize: 7.5 },
    columnStyles: {
      0: { cellWidth: 58 },
      1: { cellWidth: 108, fontStyle: 'bold' },
      [head.length - 1]: { cellWidth: 34, fontStyle: 'bold', textColor: GREEN_DARK },
    },
    /* Tint each score by the band it falls in — the sheet is read by
     * scanning for colour, not by reading every number. */
    didParseCell: (data) => {
      const first = 2;
      const last = head.length - 2;
      if (data.section !== 'body' || data.column.index < first || data.column.index > last) return;
      const area = areas[data.column.index - first];
      const learner = students[data.row.index];
      const grade = gradeOf?.(learner?.id, area?.id);
      const colour = grade ? bandColour(grade) : null;
      if (colour) {
        data.cell.styles.textColor = colour;
        data.cell.styles.fontStyle = 'bold';
      }
      data.cell.styles.halign = 'center';
    },
  });

  finish(doc, brand, brand?.logo);
  return doc;
}

/** Build the markbook and hand it to the browser. */
export function markbookPdf({ filename, ...opts }) {
  buildMarkbook(opts).save(`${filename}.pdf`);
}

/* ── Merit list ────────────────────────────────────────────────────────── */

/** Ranked class averages, with the class summary above the table. */
export function buildMeritList({ className, term, year, rows, summary, areas = [], subjectSummary = [], brand }) {
  const wide = areas.length > 3;
  const doc = new jsPDF({ orientation: wide ? 'landscape' : 'portrait', unit: 'pt', format: 'a4' });
  const accent = accentOf(brand);

  letterhead(doc, brand, brand?.logo);
  titleBand(doc, `Merit list  -  ${className}  -  Term ${term}  -  (${year})`, accent);

  const s = summary || {};
  const y = tiles(doc, [
    ['Ranked', String(s.ranked ?? rows.length)],
    ['Class average', s.class_average != null ? `${s.class_average.toFixed(1)}%` : '—'],
    ['Highest', s.highest != null ? `${s.highest.toFixed(1)}%` : '—'],
    ['Lowest', s.lowest != null ? `${s.lowest.toFixed(1)}%` : '—'],
    ['Pass rate', s.pass_rate != null ? `${s.pass_rate.toFixed(0)}%` : '—'],
  ], 94);

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
      const x = subjectSummary.find((y2) => y2.id === a.id);
      return x?.average != null ? `${x.average.toFixed(1)}%` : '—';
    }), s.class_average != null ? s.class_average.toFixed(1) : '—', '']]
    : undefined;

  table(doc, head, body, y + 14, {
    foot,
    footStyles: { fillColor: MIST, textColor: GREEN_DARK, fontStyle: 'bold', fontSize: 7.5 },
    columnStyles: {
      0: { cellWidth: 24, fontStyle: 'bold', halign: 'center' },
      1: { cellWidth: 58 },
      2: { cellWidth: 104, fontStyle: 'bold' },
      [head.length - 2]: { fontStyle: 'bold', halign: 'center' },
    },
    /* The top three carry a medal tint, and the result column the only other
     * colour — so rank and risk both read without scanning every row. */
    didParseCell: (data) => {
      if (data.section !== 'body') return;
      if (data.column.index === 0 && data.row.index < 3) {
        data.cell.styles.textColor = GREEN_DARK;
      }
      if (data.column.index === head.length - 1) {
        data.cell.styles.textColor = data.cell.raw === 'Pass' ? GREEN_DARK : RED;
        data.cell.styles.fontStyle = 'bold';
      }
    },
  });

  finish(doc, brand, brand?.logo);
  return doc;
}

/** Build the merit list and hand it to the browser. */
export function meritListPdf({ filename, ...opts }) {
  buildMeritList(opts).save(`${filename}.pdf`);
}
