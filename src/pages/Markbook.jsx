import { useEffect, useState } from 'react';
import { Box, Paper, Typography, TextField, MenuItem, Button, Table, TableHead, TableRow, TableCell, TableBody, LinearProgress, Alert, TableContainer } from '@mui/material';
import api from '../api';

export default function Markbook() {
  const [classes, setClasses] = useState([]);
  const [classId, setClassId] = useState('');
  const [term, setTerm] = useState(1);
  const [year, setYear] = useState(new Date().getFullYear());
  const [grid, setGrid] = useState(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => { api.get('/classes').then((r) => setClasses(r.data)).catch(() => {}); }, []);

  async function load() {
    if (!classId) return;
    setBusy(true); setError('');
    try {
      const { data } = await api.get('/markbook', { params: { class_id: classId, term, academic_year: year } });
      setGrid(data);
    } catch (e) { setError(e.response?.data?.error || 'Could not load markbook'); }
    finally { setBusy(false); }
  }

  const markFor = (sid, laid) => grid?.marks.find((m) => m.student_id === sid && m.learning_area_id === laid);

  async function saveMark(sid, laid, score) {
    if (score === '' || score == null) return;
    try {
      await api.post('/marks', { student_id: sid, learning_area_id: laid, score: Number(score), total: 100, term, academic_year: year });
      load();
    } catch (e) { setError(e.response?.data?.error || 'Could not save mark'); }
  }

  return (
    <Box>
      <Typography variant="h5" gutterBottom>Markbook</Typography>
      <Paper sx={{ p: 2, mb: 2, display: 'flex', gap: 2, flexWrap: 'wrap', alignItems: 'center' }}>
        <TextField select size="small" label="Class" value={classId} onChange={(e) => setClassId(e.target.value)} sx={{ minWidth: 180 }}>
          {classes.map((c) => <MenuItem key={c.id} value={c.id}>{c.name}</MenuItem>)}
        </TextField>
        <TextField size="small" label="Term" type="number" value={term} onChange={(e) => setTerm(Number(e.target.value))} sx={{ width: 100 }} />
        <TextField size="small" label="Year" type="number" value={year} onChange={(e) => setYear(Number(e.target.value))} sx={{ width: 120 }} />
        <Button variant="contained" onClick={load} disabled={!classId || busy}>Load</Button>
      </Paper>
      {error && <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError('')}>{error}</Alert>}
      {busy && <LinearProgress />}
      {grid && !busy && (
        <TableContainer component={Paper}>
          <Table size="small" stickyHeader>
            <TableHead>
              <TableRow>
                <TableCell sx={{ fontWeight: 700 }}>Learner</TableCell>
                {grid.learning_areas.map((la) => <TableCell key={la.id} sx={{ fontWeight: 700 }}>{la.name}</TableCell>)}
              </TableRow>
            </TableHead>
            <TableBody>
              {grid.students.map((s) => (
                <TableRow key={s.id} hover>
                  <TableCell sx={{ whiteSpace: 'nowrap' }}>{s.last_name} {s.first_name}</TableCell>
                  {grid.learning_areas.map((la) => {
                    const m = markFor(s.id, la.id);
                    return (
                      <TableCell key={la.id}>
                        <TextField
                          size="small" type="number" sx={{ width: 84 }}
                          defaultValue={m ? m.score : ''}
                          placeholder="—"
                          onBlur={(e) => saveMark(s.id, la.id, e.target.value)}
                          inputProps={{ min: 0, max: 100 }}
                        />
                      </TableCell>
                    );
                  })}
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      )}
      {grid && !grid.learning_areas.length && (
        <Alert severity="info" sx={{ mt: 2 }}>This class has no learning areas assigned yet — assign them under Class learning areas.</Alert>
      )}
    </Box>
  );
}
