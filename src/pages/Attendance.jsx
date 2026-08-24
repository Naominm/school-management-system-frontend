import { useEffect, useState } from 'react';
import { Box, Paper, Typography, TextField, MenuItem, Button, Table, TableHead, TableRow, TableCell, TableBody, ToggleButtonGroup, ToggleButton, Alert, TableContainer } from '@mui/material';
import api from '../api';

const STATUSES = ['present', 'absent', 'late', 'excused'];

export default function Attendance() {
  const [classes, setClasses] = useState([]);
  const [classId, setClassId] = useState('');
  const [date, setDate] = useState(new Date().toISOString().slice(0, 10));
  const [students, setStudents] = useState([]);
  const [statuses, setStatuses] = useState({});
  const [msg, setMsg] = useState(null);

  useEffect(() => { api.get('/classes').then((r) => setClasses(r.data)).catch(() => {}); }, []);

  async function loadRoll() {
    const { data } = await api.get('/students');
    const roll = data.filter((s) => s.class_id === Number(classId) && s.active);
    setStudents(roll);
    setStatuses(Object.fromEntries(roll.map((s) => [s.id, 'present'])));
  }

  async function save() {
    try {
      const records = students.map((s) => ({ student_id: s.id, status: statuses[s.id] }));
      await api.post('/attendance/bulk', { date, records });
      setMsg({ sev: 'success', text: `Attendance recorded for ${records.length} learners.` });
    } catch (e) {
      setMsg({ sev: 'error', text: e.response?.data?.error || 'Could not record attendance' });
    }
  }

  return (
    <Box>
      <Typography variant="h5" gutterBottom>Attendance</Typography>
      <Paper sx={{ p: 2, mb: 2, display: 'flex', gap: 2, flexWrap: 'wrap', alignItems: 'center' }}>
        <TextField select size="small" label="Class" value={classId} onChange={(e) => setClassId(e.target.value)} sx={{ minWidth: 180 }}>
          {classes.map((c) => <MenuItem key={c.id} value={c.id}>{c.name}</MenuItem>)}
        </TextField>
        <TextField size="small" type="date" label="Date" value={date} onChange={(e) => setDate(e.target.value)} InputLabelProps={{ shrink: true }} />
        <Button variant="outlined" onClick={loadRoll} disabled={!classId}>Load roll</Button>
        <Button variant="contained" onClick={save} disabled={!students.length}>Save attendance</Button>
      </Paper>
      {msg && <Alert severity={msg.sev} sx={{ mb: 2 }} onClose={() => setMsg(null)}>{msg.text}</Alert>}
      {!!students.length && (
        <TableContainer component={Paper}>
          <Table size="small">
            <TableHead>
              <TableRow>
                <TableCell sx={{ fontWeight: 700 }}>Learner</TableCell>
                <TableCell sx={{ fontWeight: 700 }}>Status</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {students.map((s) => (
                <TableRow key={s.id} hover>
                  <TableCell>{s.last_name} {s.first_name} <Typography component="span" variant="caption" color="text.secondary">({s.admission_number || 'no adm.'})</Typography></TableCell>
                  <TableCell>
                    <ToggleButtonGroup
                      exclusive size="small" value={statuses[s.id]}
                      onChange={(_, v) => v && setStatuses((st) => ({ ...st, [s.id]: v }))}
                    >
                      {STATUSES.map((x) => <ToggleButton key={x} value={x} sx={{ textTransform: 'capitalize' }}>{x}</ToggleButton>)}
                    </ToggleButtonGroup>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      )}
    </Box>
  );
}
