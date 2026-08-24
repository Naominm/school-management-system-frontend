import { useEffect, useState } from 'react';
import { Box, Paper, Typography, TextField, MenuItem, Button, Table, TableHead, TableRow, TableCell, TableBody, Alert, Divider, TableContainer } from '@mui/material';
import api from '../api';
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

  return (
    <Box>
      <Typography variant="h5" gutterBottom>Report cards</Typography>
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
                    <TableCell>{m.grade || '—'}</TableCell>
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
