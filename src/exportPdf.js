import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';

/* Ledger palette, so exported documents match the on-screen theme. */
const INK = [27, 42, 74];
const GOLD = [201, 162, 39];
const PAPER = [241, 236, 223];

function header(doc, title, subtitle) {
  doc.setFillColor(...INK);
  doc.rect(0, 0, doc.internal.pageSize.getWidth(), 64, 'F');
  doc.setTextColor(255, 255, 255);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(15);
  doc.text(title, 40, 30);
  if (subtitle) {
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(9.5);
    doc.setTextColor(200, 208, 224);
    doc.text(subtitle, 40, 47);
  }
  doc.setTextColor(0, 0, 0);
}

function footer(doc) {
  const pages = doc.internal.getNumberOfPages();
  for (let i = 1; i <= pages; i += 1) {
    doc.setPage(i);
    doc.setFontSize(8);
    doc.setTextColor(120, 130, 150);
    doc.text(
      `Page ${i} of ${pages}`,
      doc.internal.pageSize.getWidth() - 40,
      doc.internal.pageSize.getHeight() - 20,
      { align: 'right' }
    );
  }
}

const table = (doc, head, body, startY, opts = {}) => autoTable(doc, {
  head: [head], body, startY,
  margin: { left: 40, right: 40 },
  styles: { fontSize: 8.5, cellPadding: 4, overflow: 'linebreak' },
  headStyles: { fillColor: PAPER, textColor: INK, fontStyle: 'bold', fontSize: 8 },
  alternateRowStyles: { fillColor: [250, 248, 243] },
  ...opts,
});

/** Markbook: learners down, subjects across. Landscape — many columns. */
export function markbookPdf({ className, term, year, students, areas, scoreOf, filename }) {
  const doc = new jsPDF({ orientation: 'landscape', unit: 'pt', format: 'a4' });
  header(doc, `Markbook — ${className}`, `Term ${term} · ${year} · ${students.length} learners · ${areas.length} subjects`);
  const head = ['Adm. No.', 'Learner', ...areas.map((a) => a.name), 'Avg'];
  const body = students.map((s) => {
    const vals = areas.map((a) => scoreOf(s.id, a.id));
    const nums = vals.filter((v) => v !== '' && v != null).map(Number);
    const avg = nums.length ? (nums.reduce((x, y) => x + y, 0) / nums.length).toFixed(1) : '—';
    return [s.admission_number || '—', `${s.last_name} ${s.first_name}`, ...vals.map((v) => (v ?? '') === '' ? '—' : v), avg];
  });
  table(doc, head, body, 80, { columnStyles: { 0: { cellWidth: 60 }, 1: { cellWidth: 110 } } });
  footer(doc);
  doc.save(`${filename}.pdf`);
}

/** Merit list: ranked averages. */
export function meritListPdf({ className, term, year, rows, summary, areas = [], subjectSummary = [], filename }) {
  const wide = areas.length > 3;
  const doc = new jsPDF({ orientation: wide ? 'landscape' : 'portrait', unit: 'pt', format: 'a4' });
  header(doc, `Merit list — ${className}`, `Term ${term} · ${year}`);
  doc.setFontSize(9);
  doc.setTextColor(90, 100, 120);
  const s = summary || {};
  doc.text(
    [`Ranked: ${s.ranked ?? rows.length}`,
     `Class average: ${s.class_average != null ? s.class_average.toFixed(1) + '%' : '—'}`,
     `Pass rate: ${s.pass_rate != null ? s.pass_rate.toFixed(0) + '%' : '—'}`].join('     '),
    40, 82
  );
  doc.setTextColor(0, 0, 0);

  // Score and grade share a cell so the sheet stays readable across many subjects.
  const head = ['#', 'Adm. No.', 'Learner', ...areas.map((a) => a.name), 'Avg %', 'Result'];
  const body = rows.map((r) => [
    r.position, r.admission_number || '—', `${r.last_name} ${r.first_name}`,
    ...areas.map((a) => {
      const m = r.marks?.[a.id];
      return m ? `${m.score}${m.grade ? ' ' + m.grade : ''}` : '—';
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

  table(doc, head, body, 98, {
    foot,
    footStyles: { fillColor: PAPER, textColor: INK, fontStyle: 'bold', fontSize: 8 },
    columnStyles: { 0: { cellWidth: 24 }, 1: { cellWidth: 58 }, 2: { cellWidth: 104 } },
  });
  footer(doc);
  doc.save(`${filename}.pdf`);
}

/** Report cards: one page per learner. */
export function reportCardsPdf({ className, term, year, students, filename }) {
  const doc = new jsPDF({ unit: 'pt', format: 'a4' });
  students.forEach((st, i) => {
    if (i > 0) doc.addPage();
    header(doc, `${st.last_name} ${st.first_name}`,
      `${className} · Term ${term} · ${year}${st.admission_number ? ' · Adm. ' + st.admission_number : ''}`);
    if (st.marks.length) {
      table(doc,
        ['Learning area', 'Score', '%', 'Grade', 'Remarks'],
        st.marks.map((m) => [m.learning_area, `${m.score}/${m.total}`,
          m.percentage != null ? m.percentage.toFixed(1) : '—', m.grade || '—', m.remarks || '']),
        86);
    } else {
      doc.setFontSize(10);
      doc.text('No marks recorded for this period.', 40, 100);
    }
    let y = (doc.lastAutoTable?.finalY || 100) + 24;
    doc.setFont('helvetica', 'bold'); doc.setFontSize(10);
    doc.text(`Average: ${st.average_percentage != null ? st.average_percentage.toFixed(1) + '%' : '—'}`
      + (st.position ? `        Position: ${st.position} of ${students.length}` : ''), 40, y);
    doc.setFont('helvetica', 'normal'); doc.setFontSize(9);
    const c = st.comments || {};
    for (const [label, text] of [["Class teacher's comment", c.class_teacher_comment],
                                 ["Headteacher's comment", c.headteacher_comment]]) {
      y += 26;
      doc.setTextColor(...GOLD); doc.text(label, 40, y);
      doc.setTextColor(0, 0, 0);
      y += 14;
      doc.text(doc.splitTextToSize(text || '—', doc.internal.pageSize.getWidth() - 80), 40, y);
      y += 10;
    }
  });
  footer(doc);
  doc.save(`${filename}.pdf`);
}
