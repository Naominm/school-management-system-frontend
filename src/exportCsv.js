/** Download rows as CSV. columns: [{key,label}] */
export function exportCsv(filename, columns, rows) {
  const esc = (s) => {
    const v = s == null ? '' : String(typeof s === 'object' ? JSON.stringify(s) : s);
    return /[",\n]/.test(v) ? `"${v.replaceAll('"', '""')}"` : v;
  };
  const lines = [
    columns.map((c) => esc(c.label)).join(','),
    ...rows.map((r) => columns.map((c) => esc(r[c.key])).join(',')),
  ];
  const blob = new Blob([lines.join('\n')], { type: 'text/csv;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url; a.download = `${filename}.csv`; a.click();
  URL.revokeObjectURL(url);
}
