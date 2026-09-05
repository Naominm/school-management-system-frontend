import { useEffect, useState } from 'react';
import { Box, Paper, Typography, TextField, MenuItem, Button, Table, TableHead, TableRow, TableCell, TableBody, Alert, Divider, TableContainer } from '@mui/material';
import api from '../api';
import { useBranding, logoDataUrl } from '../branding';
import SchoolHeader from '../components/SchoolHeader';
import { exportCsv } from '../exportCsv';
import { reportCardsPdf } from '../exportPdf';
import GradeStamp from '../components/GradeStamp';
import { useAuth } from '../auth';

export default function ReportCard() {
  const { user } = useAuth();
  const staff = ['admin', 'teacher'].includes(user?.role);
  const [students, setStudents] = useState([]);
  const [studentId, setStudentId] = useState('');
  const [term, setTerm] = useState(1);
  const [year, setYear] = useState(new Date().getFullYear());
  const [report, setReport] = useState(null);
  const [error, setError] = useState('');
  const [comment, setComment] = useState('');

  useEffect(() => {
    if (staff) api.get('/students').then((r) => setStudents(r.data)).catch(() => {});
  }, [staff]);

  async function load(id = studentId) {
    setError('');
    try {
      const { data } = await api.get(`/report-card/${id}`, { params: { term, academic_year: year } });
      setReport(data);
      setComment(data.comments?.class_teacher_comment || '');
    } catch (e) { setError(e.response?.data?.error || 'Could not load report card'); }
  }

  async function saveComment() {
    try {
      await api.post(`/report-card/${studentId}/comments`, { term, academic_year: year, class_teacher_comment: comment });
      load();
    } catch (e) { setError(e.response?.data?.error || 'Could not save comment'); }
  }

  const pct = (m) => ((m.score / m.total) * 100).toFixed(1);
  const [classId, setClassId] = useState('');
  const [classes, setClasses] = useState([]);
  const [bulkBusy, setBulkBusy] = useState(false);
  const { branding, logoUrl } = useBranding();

  useEffect(() => {
    if (!staff) return;
    api.get('/classes').then((r) => setClasses(r.data)).catch(() => {});
  }, [staff]);

  const className = () => classes.find((c) => String(c.id) === String(classId))?.name || 'Class';

  /* One request for the whole class, rather than one per learner. */
  async function fetchClassCards() {
    const { data } = await api.get('/report-cards', { params: { class_id: classId, term, academic_year: year } });
    return data;
  }

  async function exportClassPdf() {
    setBulkBusy(true); setError('');
    try {
      const d = await fetchClassCards();
      if (!d.students.length) { setError('That class has no learners.'); return; }
      const brand = { logo: await logoDataUrl(logoUrl), schoolName: branding?.name };
      reportCardsPdf({ className: d.class.name, term, year, students: d.students,
        filename: `report-cards-${d.class.name.replace(/[^\w-]+/g, '_')}-T${term}-${year}`, brand });
    } catch (e) { setError(e.response?.data?.error || 'Could not export report cards'); }
    finally { setBulkBusy(false); }
  }

  async function exportClassCsv() {
    setBulkBusy(true); setError('');
    try {
      const d = await fetchClassCards();
      if (!d.students.length) { setError('That class has no learners.'); return; }
      // One row per learner per subject — the shape spreadsheets expect.
      const rows = [];
      for (const st of d.students) {
        if (!st.marks.length) {
          rows.push({ adm: st.admission_number || '', name: `${st.last_name} ${st.first_name}`,
            subject: '', score: '', total: '', percentage: '', grade: '',
            average: st.average_percentage?.toFixed(1) ?? '', position: st.position ?? '' });
          continue;
        }
        for (const m of st.marks) {
          rows.push({ adm: st.admission_number || '', name: `${st.last_name} ${st.first_name}`,
            subject: m.learning_area, score: m.score, total: m.total,
            percentage: m.percentage?.toFixed(1) ?? '', grade: m.grade || '',
            average: st.average_percentage?.toFixed(1) ?? '', position: st.position ?? '' });
        }
      }
      exportCsv(`report-cards-${d.class.name.replace(/[^\w-]+/g, '_')}-T${term}-${year}`, [
        { key: 'adm', label: 'Admission No.' }, { key: 'name', label: 'Learner' },
        { key: 'subject', label: 'Learning area' }, { key: 'score', label: 'Score' },
        { key: 'total', label: 'Out of' }, { key: 'percentage', label: '%' },
        { key: 'grade', label: 'Grade' }, { key: 'average', label: 'Learner average %' },
        { key: 'position', label: 'Position' },
      ], rows);
    } catch (e) { setError(e.response?.data?.error || 'Could not export report cards'); }
    finally { setBulkBusy(false); }
  }

  return (
    <Box>
      <SchoolHeader title="Report cards" />
      <Paper sx={{ p: 2, mb: 2, display: 'flex', gap: 2, flexWrap: 'wrap', alignItems: 'center' }}>
        {staff && (
          <TextField select size="small" label="Learner" value={studentId} onChange={(e) => setStudentId(e.target.value)} sx={{ minWidth: 220 }}>
            {students.map((s) => <MenuItem key={s.id} value={s.id}>{s.last_name} {s.first_name}</MenuItem>)}
          </TextField>
        )}
        <TextField size="small" label="Term" type="number" value={term} onChange={(e) => setTerm(Number(e.target.value))} sx={{ width: 100 }} />
        <TextField size="small" label="Year" type="number" value={year} onChange={(e) => setYear(Number(e.target.value))} sx={{ width: 120 }} />
        <Button variant="contained" onClick={() => load()} disabled={staff && !studentId}>Load</Button>
      </Paper>
      {staff && (
        <Paper sx={{ p: 2, mb: 2, display: 'flex', gap: 2, flexWrap: 'wrap', alignItems: 'center' }}>
          <Typography variant="body2" sx={{ fontWeight: 600 }}>Whole class</Typography>
          <TextField select size="small" label="Class" value={classId}
            onChange={(e) => setClassId(e.target.value)} sx={{ minWidth: 200 }}>
            {classes.map((c) => <MenuItem key={c.id} value={c.id}>{c.name}</MenuItem>)}
          </TextField>
          <Button variant="outlined" disabled={!classId || bulkBusy} onClick={exportClassPdf}>
            {bulkBusy ? 'Preparing…' : 'Export all as PDF'}
          </Button>
          <Button variant="outlined" disabled={!classId || bulkBusy} onClick={exportClassCsv}>
            Export all as CSV
          </Button>
          <Typography variant="caption" color="text.secondary">
            One page per learner, for Term {term} {year}.
          </Typography>
        </Paper>
      )}
      {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
      {report && (
        <Paper sx={{ p: 3 }}>
          <Typography variant="h6">{report.student.last_name} {report.student.first_name}</Typography>
          <Typography variant="body2" color="text.secondary" gutterBottom>
            {report.student.class_name || 'No class'} · Adm. {report.student.admission_number || '—'} · Term {term}, {year}
            {report.average_percentage != null && ` · Average ${report.average_percentage.toFixed(1)}%`}
          </Typography>
          <TableContainer>
            <Table size="small">
              <TableHead>
                <TableRow>
                  <TableCell sx={{ fontWeight: 700 }}>Learning area</TableCell>
                  <TableCell sx={{ fontWeight: 700 }}>Score</TableCell>
                  <TableCell sx={{ fontWeight: 700 }}>%</TableCell>
                  <TableCell sx={{ fontWeight: 700 }}>Grade</TableCell>
                  <TableCell sx={{ fontWeight: 700 }}>Remarks</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {report.marks.map((m) => (
                  <TableRow key={m.id}>
                    <TableCell>{m.learning_area}</TableCell>
                    <TableCell>{m.score}/{m.total}</TableCell>
                    <TableCell>{pct(m)}</TableCell>
                    <TableCell><GradeStamp grade={m.grade} size={34} /></TableCell>
                    <TableCell>{m.remarks || '—'}</TableCell>
                  </TableRow>
                ))}
                {!report.marks.length && <TableRow><TableCell colSpan={5}><Typography color="text.secondary" sx={{ py: 1 }}>No marks recorded for this period.</Typography></TableCell></TableRow>}
              </TableBody>
            </Table>
          </TableContainer>
          <Divider sx={{ my: 2 }} />
          <Typography variant="subtitle2" gutterBottom>Class teacher's comment</Typography>
          {staff ? (
            <Box sx={{ display: 'flex', gap: 2, alignItems: 'flex-start', flexWrap: 'wrap' }}>
              <TextField fullWidth multiline minRows={2} value={comment} onChange={(e) => setComment(e.target.value)} sx={{ maxWidth: 640 }} />
              <Button variant="outlined" onClick={saveComment}>Save comment</Button>
            </Box>
          ) : (
            <Typography>{report.comments?.class_teacher_comment || 'No comment yet.'}</Typography>
          )}
        </Paper>
      )}
    </Box>
  );
}
