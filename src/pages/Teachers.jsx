import { useEffect, useState } from 'react';
import { Box, Paper, Typography, Button, Table, TableHead, TableRow, TableCell, TableBody, Dialog, DialogTitle, DialogContent, DialogActions, TextField, MenuItem, Chip, Alert, TableContainer, IconButton } from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import LinkIcon from '@mui/icons-material/AddLink';
import { exportCsv } from '../exportCsv';
import api from '../api';
import { useAuth } from '../auth';

const TYPES = ['subject_teacher', 'class_teacher', 'both', 'general'];

export default function Teachers() {
  const { user } = useAuth();
  const isAdmin = user?.role === 'admin';
  const [rows, setRows] = useState([]);
  const [classes, setClasses] = useState([]);
  const [areas, setAreas] = useState([]);
  const [creating, setCreating] = useState(null);
  const [assigning, setAssigning] = useState(null); // { teacher, kind: 'class'|'subject' }
  const [assignForm, setAssignForm] = useState({ class_id: '', learning_area_id: '', role: 'teacher' });
  const [error, setError] = useState('');

  async function load() {
    const [t, c, a] = await Promise.all([
      api.get('/teachers'),
      api.get('/classes').catch(() => ({ data: [] })),
      api.get('/learning-areas').catch(() => ({ data: [] })),
    ]);
    setRows(t.data); setClasses(c.data); setAreas(a.data);
  }
  useEffect(() => { load().catch((e) => setError(e.response?.data?.error || 'Could not load teachers')); }, []);

  async function createTeacher() {
    try {
      await api.post('/teachers', creating);
      setCreating(null); load();
    } catch (e) { setError(e.response?.data?.error || 'Could not create teacher'); }
  }

  async function submitAssign() {
    try {
      const { teacher, kind } = assigning;
      if (kind === 'class') await api.post(`/teachers/${teacher.id}/assign-class`, { class_id: assignForm.class_id, role: assignForm.role });
      else await api.post(`/teachers/${teacher.id}/assign-subject`, { class_id: assignForm.class_id, learning_area_id: assignForm.learning_area_id });
      setAssigning(null); setAssignForm({ class_id: '', learning_area_id: '', role: 'teacher' });
    } catch (e) { setError(e.response?.data?.error || 'Assignment failed'); }
  }

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2, flexWrap: 'wrap', gap: 1 }}>
        <Typography variant="h5">Teachers</Typography>
        <Box sx={{ display: 'flex', gap: 1 }}>
          <Button variant="outlined" onClick={() => exportCsv('teachers', [
            { key: 'full_name', label: 'Name' }, { key: 'email', label: 'Email' },
            { key: 'employee_number', label: 'Employee No' }, { key: 'teacher_type', label: 'Type' },
            { key: 'phone', label: 'Phone' }, { key: 'specialization', label: 'Specialization' },
          ], rows)}>Export CSV</Button>
          {isAdmin && (
            <Button variant="contained" startIcon={<AddIcon />} onClick={() => setCreating({ teacher_type: 'subject_teacher' })}>
              New teacher
            </Button>
          )}
        </Box>
      </Box>
      {error && <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError('')}>{error}</Alert>}
      <TableContainer component={Paper}>
        <Table size="small">
          <TableHead>
            <TableRow>
              {['Name', 'Email', 'Employee No', 'Type', 'Specialization', 'Status', ''].map((h) => (
                <TableCell key={h} sx={{ fontWeight: 700 }}>{h}</TableCell>
              ))}
            </TableRow>
          </TableHead>
          <TableBody>
            {rows.map((t) => (
              <TableRow key={t.id} hover>
                <TableCell>{t.full_name}</TableCell>
                <TableCell>{t.email}</TableCell>
                <TableCell>{t.employee_number || '—'}</TableCell>
                <TableCell><Chip size="small" label={(t.teacher_type || 'general').replaceAll('_', ' ')} /></TableCell>
                <TableCell>{t.specialization || '—'}</TableCell>
                <TableCell><Chip size="small" label={t.active ? 'Active' : 'Inactive'} color={t.active ? 'success' : 'default'} /></TableCell>
                <TableCell align="right" sx={{ whiteSpace: 'nowrap' }}>
                  {isAdmin && (
                    <>
                      <Button size="small" startIcon={<LinkIcon />} onClick={() => setAssigning({ teacher: t, kind: 'class' })}>Class</Button>
                      <Button size="small" startIcon={<LinkIcon />} onClick={() => setAssigning({ teacher: t, kind: 'subject' })}>Subject</Button>
                    </>
                  )}
                </TableCell>
              </TableRow>
            ))}
            {!rows.length && <TableRow><TableCell colSpan={7}><Typography color="text.secondary" sx={{ py: 2, textAlign: 'center' }}>No teachers yet.</Typography></TableCell></TableRow>}
          </TableBody>
        </Table>
      </TableContainer>

      <Dialog open={!!creating} onClose={() => setCreating(null)} fullWidth maxWidth="sm">
        <DialogTitle>New teacher</DialogTitle>
        <DialogContent dividers>
          {creating && (
            <>
              <TextField label="Full name" fullWidth margin="dense" required onChange={(e) => setCreating((c) => ({ ...c, full_name: e.target.value }))} />
              <TextField label="Email" type="email" fullWidth margin="dense" required onChange={(e) => setCreating((c) => ({ ...c, email: e.target.value }))} />
              <TextField label="Temporary password" type="password" fullWidth margin="dense" required onChange={(e) => setCreating((c) => ({ ...c, password: e.target.value }))} />
              <TextField label="Employee number" fullWidth margin="dense" onChange={(e) => setCreating((c) => ({ ...c, employee_number: e.target.value }))} />
              <TextField select label="Teacher type" fullWidth margin="dense" value={creating.teacher_type} onChange={(e) => setCreating((c) => ({ ...c, teacher_type: e.target.value }))}>
                {TYPES.map((t) => <MenuItem key={t} value={t}>{t.replaceAll('_', ' ')}</MenuItem>)}
              </TextField>
              <TextField label="Phone" fullWidth margin="dense" onChange={(e) => setCreating((c) => ({ ...c, phone: e.target.value }))} />
              <TextField label="Specialization" fullWidth margin="dense" onChange={(e) => setCreating((c) => ({ ...c, specialization: e.target.value }))} />
            </>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setCreating(null)}>Cancel</Button>
          <Button variant="contained" onClick={createTeacher}>Create</Button>
        </DialogActions>
      </Dialog>

      <Dialog open={!!assigning} onClose={() => setAssigning(null)} fullWidth maxWidth="xs">
        <DialogTitle>
          {assigning?.kind === 'class' ? 'Assign class' : 'Assign subject'} — {assigning?.teacher.full_name}
        </DialogTitle>
        <DialogContent dividers>
          <TextField select label="Class" fullWidth margin="dense" value={assignForm.class_id} onChange={(e) => setAssignForm((f) => ({ ...f, class_id: e.target.value }))}>
            {classes.map((c) => <MenuItem key={c.id} value={c.id}>{c.name}</MenuItem>)}
          </TextField>
          {assigning?.kind === 'class' ? (
            <TextField select label="Role in class" fullWidth margin="dense" value={assignForm.role} onChange={(e) => setAssignForm((f) => ({ ...f, role: e.target.value }))}>
              <MenuItem value="teacher">Teacher</MenuItem>
              <MenuItem value="class_teacher">Class teacher</MenuItem>
            </TextField>
          ) : (
            <TextField select label="Learning area" fullWidth margin="dense" value={assignForm.learning_area_id} onChange={(e) => setAssignForm((f) => ({ ...f, learning_area_id: e.target.value }))}>
              {areas.map((a) => <MenuItem key={a.id} value={a.id}>{a.name}</MenuItem>)}
            </TextField>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setAssigning(null)}>Cancel</Button>
          <Button variant="contained" onClick={submitAssign} disabled={!assignForm.class_id || (assigning?.kind === 'subject' && !assignForm.learning_area_id)}>Assign</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
