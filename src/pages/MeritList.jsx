import { useEffect, useState } from 'react';
import { Box, Paper, Typography, TextField, MenuItem, Button, Table, TableHead, TableRow, TableCell, TableBody, Chip, Grid, Alert, TableContainer } from '@mui/material';
import api from '../api';
import GradeStamp from '../components/GradeStamp';
import { meritListPdf } from '../exportPdf';
import { exportCsv } from '../exportCsv';

function Stat({ label, value }) {
  return (
    <Paper sx={{ p: 2 }}>
      <Typography variant="overline" color="text.secondary">{label}</Typography>
      <Typography variant="h6" fontWeight={700}>{value}</Typography>
    </Paper>
  );
}

/* Mirrors the server grading_scales bands so the merit list stamps match
 * the grades stored on individual marks. */
function bandFor(pct) {
  if (pct == null || Number.isNaN(pct)) return '';
  if (pct >= 80) return 'A';
  if (pct >= 65) return 'B';
  if (pct >= 50) return 'C';
  if (pct >= 40) return 'D';
  return 'E';
}

export default function MeritList() {
  const [classes, setClasses] = useState([]);
  const [classId, setClassId] = useState('');
  const [term, setTerm] = useState(1);
  const [year, setYear] = useState(new Date().getFullYear());
  const [data, setData] = useState(null);
  const [error, setError] = useState('');

  useEffect(() => { api.get('/classes').then((r) => setClasses(r.data)).catch(() => {}); }, []);

  async function load() {
    setError('');
    try {
      const { data } = await api.get('/merit-list', { params: { class_id: classId, term, academic_year: year } });
      setData(data);
    } catch (e) { setError(e.response?.data?.error || 'Could not load merit list'); }
  }

  const fmt = (v) => (v == null ? '—' : `${Number(v).toFixed(1)}%`);
  const areas = data?.learning_areas || [];

  return (
    <Box>
      <Typography variant="h5" gutterBottom>Merit list</Typography>
      <Paper sx={{ p: 2, mb: 2, display: 'flex', gap: 2, flexWrap: 'wrap', alignItems: 'center' }}>
        <TextField select size="small" label="Class" value={classId} onChange={(e) => setClassId(e.target.value)} sx={{ minWidth: 180 }}>
          {classes.map((c) => <MenuItem key={c.id} value={c.id}>{c.name}</MenuItem>)}
        </TextField>
        <TextField size="small" label="Term" type="number" value={term} onChange={(e) => setTerm(Number(e.target.value))} sx={{ width: 100 }} />
        <TextField size="small" label="Year" type="number" value={year} onChange={(e) => setYear(Number(e.target.value))} sx={{ width: 120 }} />
        <Button variant="contained" onClick={load} disabled={!classId}>Load</Button>
        <Button variant="outlined" disabled={!data?.merit_list?.length}
          onClick={() => exportCsv(`merit-list-term${term}-${year}`,
            [{ key: 'position', label: 'Position' }, { key: 'last_name', label: 'Surname' },
             { key: 'first_name', label: 'First name' }, { key: 'admission_number', label: 'Adm No' },
             ...areas.flatMap((a) => [
               { key: `s_${a.id}`, label: `${a.name} score` },
               { key: `g_${a.id}`, label: `${a.name} grade` }]),
             { key: 'subjects', label: 'Subjects sat' },
             { key: 'average_percentage', label: 'Average %' },
             { key: 'result', label: 'Result' }],
            data.merit_list.map((r) => {
              const row = { ...r, result: r.is_pass ? 'Pass' : 'Below pass mark',
                average_percentage: r.average_percentage?.toFixed(1) ?? '' };
              for (const a of areas) {
                row[`s_${a.id}`] = r.marks?.[a.id]?.score ?? '';
                row[`g_${a.id}`] = r.marks?.[a.id]?.grade ?? '';
              }
              return row;
            }))}>
          Export CSV
        </Button>
        <Button variant="outlined" disabled={!data?.merit_list?.length}
          onClick={() => meritListPdf({
            className: classes.find((c) => String(c.id) === String(classId))?.name || 'Class',
            term, year, rows: data.merit_list, summary: data.summary, areas, subjectSummary: data.subject_summary || [],
            filename: `merit-list-term${term}-${year}`,
          })}>
          Export PDF
        </Button>
      </Paper>
      {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
      {data && (
        <>
          <Grid container spacing={2} sx={{ mb: 2 }}>
            <Grid item xs={6} md={2.4}><Stat label="Ranked" value={data.summary.ranked} /></Grid>
            <Grid item xs={6} md={2.4}><Stat label="Class average" value={fmt(data.summary.class_average)} /></Grid>
            <Grid item xs={6} md={2.4}><Stat label="Highest" value={fmt(data.summary.highest)} /></Grid>
            <Grid item xs={6} md={2.4}><Stat label="Lowest" value={fmt(data.summary.lowest)} /></Grid>
            <Grid item xs={6} md={2.4}><Stat label="Pass rate" value={fmt(data.summary.pass_rate)} /></Grid>
          </Grid>
          <TableContainer component={Paper}>
            <Table size="small">
              <TableHead>
                <TableRow>
                  <TableCell sx={{ fontWeight: 700 }}>#</TableCell>
                  <TableCell sx={{ fontWeight: 700 }}>Learner</TableCell>
                  <TableCell sx={{ fontWeight: 700 }}>Adm. No.</TableCell>
                  {areas.map((a) => (
                    <TableCell key={a.id} align="center" sx={{ fontWeight: 700, whiteSpace: 'nowrap' }}>
                      {a.name}
                    </TableCell>
                  ))}
                  <TableCell align="center" sx={{ fontWeight: 700 }}>Average</TableCell>
                  <TableCell sx={{ fontWeight: 700 }}>Result</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {data.merit_list.map((r) => (
                  <TableRow key={r.student_id} hover>
                    <TableCell>{r.position}</TableCell>
                    <TableCell>{r.last_name} {r.first_name}</TableCell>
                    <TableCell>{r.admission_number || '—'}</TableCell>
                    {areas.map((a) => {
                      const m = r.marks?.[a.id];
                      return (
                        <TableCell key={a.id} align="center">
                          {m ? (
                            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 0.75 }}>
                              <Box component="span" sx={{ fontFamily: (t) => t.typography.mono.fontFamily, fontWeight: 600 }}>
                                {m.score}
                              </Box>
                              <GradeStamp grade={m.grade} size={28} />
                            </Box>
                          ) : <Box component="span" sx={{ color: 'text.disabled' }}>—</Box>}
                        </TableCell>
                      );
                    })}
                    <TableCell align="center">
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <Box component="span" sx={{ fontFamily: (t) => t.typography.mono.fontFamily, fontWeight: 700 }}>
                          {fmt(r.average_percentage)}
                        </Box>
                        <GradeStamp grade={bandFor(r.average_percentage)} size={32} />
                      </Box>
                    </TableCell>
                    <TableCell><Chip size="small" label={r.is_pass ? 'Pass' : 'Below pass mark'} color={r.is_pass ? 'success' : 'warning'} /></TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        </>
      )}
    </Box>
  );
}
