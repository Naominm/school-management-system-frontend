import { useEffect, useState } from 'react';
import {
  Box, Paper, Typography, Grid, Button, Chip, TextField, Alert, LinearProgress,
  Dialog, DialogTitle, DialogContent, DialogActions, Stack, Divider,
} from '@mui/material';
import LockIcon from '@mui/icons-material/Lock';
import LockOpenIcon from '@mui/icons-material/LockOpen';
import AddIcon from '@mui/icons-material/Add';
import api from '../api';

const blank = { name: '', code: '', motto: '', crest_colour: '#C9A227' };
const blankAdmin = { full_name: '', email: '', password: '', position: '' };

export default function PlatformConsole() {
  const [schools, setSchools] = useState([]);
  const [busy, setBusy] = useState(true);
  const [error, setError] = useState('');
  const [ok, setOk] = useState('');
  const [newSchool, setNewSchool] = useState(blank);
  const [lockFor, setLockFor] = useState(null);
  const [lockReason, setLockReason] = useState('');
  const [adminFor, setAdminFor] = useState(null);
  const [admin, setAdmin] = useState(blankAdmin);

  async function load() {
    setBusy(true); setError('');
    try { setSchools((await api.get('/platform/schools')).data); }
    catch (e) { setError(e.response?.data?.error || 'Could not load schools'); }
    finally { setBusy(false); }
  }
  useEffect(() => { load(); }, []);

  async function createSchool(e) {
    e.preventDefault();
    try {
      await api.post('/platform/schools', newSchool);
      setNewSchool(blank); setOk('School created'); load();
    } catch (e) { setError(e.response?.data?.error || 'Could not create school'); }
  }

  async function submitLock() {
    try {
      await api.post(`/platform/schools/${lockFor.id}/lock`, { lock_reason: lockReason });
      setLockFor(null); setLockReason(''); setOk('School locked'); load();
    } catch (e) { setError(e.response?.data?.error || 'Could not lock school'); }
  }

  async function unlock(s) {
    try { await api.post(`/platform/schools/${s.id}/unlock`); setOk(`${s.name} unlocked`); load(); }
    catch (e) { setError(e.response?.data?.error || 'Could not unlock school'); }
  }

  async function createAdmin(e) {
    e.preventDefault();
    try {
      await api.post(`/platform/schools/${adminFor.id}/admin`, admin);
      setAdminFor(null); setAdmin(blankAdmin); setOk('Administrator created'); load();
    } catch (e) { setError(e.response?.data?.error || 'Could not create administrator'); }
  }

  return (
    <Box>
      <Typography variant="h5" gutterBottom>Platform console</Typography>
      <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
        Every school on the platform. Locking a school blocks sign-in for all of its staff,
        parents and learners; records are kept intact.
      </Typography>

      {error && <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError('')}>{error}</Alert>}
      {ok && <Alert severity="success" sx={{ mb: 2 }} onClose={() => setOk('')}>{ok}</Alert>}
      {busy && <LinearProgress sx={{ mb: 2 }} />}

      <Paper component="form" onSubmit={createSchool} sx={{ p: 2, mb: 3 }}>
        <Typography variant="subtitle2" gutterBottom>Add a school</Typography>
        <Stack direction={{ xs: 'column', md: 'row' }} spacing={2} alignItems={{ md: 'center' }}>
          <TextField size="small" label="Name" required sx={{ flex: 2 }}
            value={newSchool.name} onChange={(e) => setNewSchool({ ...newSchool, name: e.target.value })} />
          <TextField size="small" label="Code" required sx={{ width: 120 }}
            value={newSchool.code} onChange={(e) => setNewSchool({ ...newSchool, code: e.target.value })} />
          <TextField size="small" label="Motto" sx={{ flex: 2 }}
            value={newSchool.motto} onChange={(e) => setNewSchool({ ...newSchool, motto: e.target.value })} />
          <TextField size="small" label="Crest colour" sx={{ width: 140 }}
            value={newSchool.crest_colour} onChange={(e) => setNewSchool({ ...newSchool, crest_colour: e.target.value })} />
          <Button type="submit" variant="contained" startIcon={<AddIcon />}>Create</Button>
        </Stack>
      </Paper>

      <Grid container spacing={2}>
        {schools.map((s) => (
          <Grid item xs={12} md={6} lg={4} key={s.id}>
            <Paper sx={{ p: 2, height: '100%', display: 'flex', flexDirection: 'column', gap: 1.5,
                         borderTop: '4px solid', borderTopColor: s.locked ? 'error.main' : (s.crest_colour || 'primary.main') }}>
              <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 1.5 }}>
                <Box sx={{ width: 40, height: 40, borderRadius: '10px', flexShrink: 0,
                           bgcolor: s.crest_colour || 'primary.main', color: '#fff',
                           display: 'flex', alignItems: 'center', justifyContent: 'center',
                           fontFamily: 'Fraunces, Georgia, serif', fontWeight: 700 }}>
                  {s.code}
                </Box>
                <Box sx={{ flex: 1, minWidth: 0 }}>
                  <Typography variant="subtitle1" noWrap>{s.name}</Typography>
                  <Typography variant="caption" color="text.secondary"
                    sx={{ fontFamily: (t) => t.typography.mono.fontFamily }}>{s.code}</Typography>
                </Box>
                <Chip size="small" label={s.locked ? 'Locked' : 'Open'} color={s.locked ? 'error' : 'success'} />
              </Box>

              <Divider />
              <Stack direction="row" spacing={2} justifyContent="space-around" sx={{ py: 0.5 }}>
                {[['Students', s.stats.students], ['Teachers', s.stats.teachers],
                  ['Classes', s.stats.classes], ['Marks', s.stats.marks_this_period]].map(([label, n]) => (
                  <Box key={label} sx={{ textAlign: 'center' }}>
                    <Typography variant="h6">{n}</Typography>
                    <Typography variant="caption" color="text.secondary">{label}</Typography>
                  </Box>
                ))}
              </Stack>

              {s.locked && s.lock_reason && <Alert severity="error" sx={{ py: 0 }}>{s.lock_reason}</Alert>}

              <Stack direction="row" spacing={1} sx={{ mt: 'auto', flexWrap: 'wrap', gap: 1 }}>
                {s.locked
                  ? <Button size="small" color="success" startIcon={<LockOpenIcon />} onClick={() => unlock(s)}>Unlock</Button>
                  : <Button size="small" color="error" startIcon={<LockIcon />} onClick={() => { setLockFor(s); setLockReason(''); }}>Lock</Button>}
                <Button size="small" onClick={() => { setAdminFor(s); setAdmin(blankAdmin); }}>Add administrator</Button>
              </Stack>
            </Paper>
          </Grid>
        ))}
      </Grid>

      {!busy && !schools.length && (
        <Alert severity="info">No schools yet — create the first one above.</Alert>
      )}

      <Dialog open={!!lockFor} onClose={() => setLockFor(null)} fullWidth maxWidth="sm">
        <DialogTitle>Lock {lockFor?.name}?</DialogTitle>
        <DialogContent>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
            Everyone at this school will be refused sign-in until you unlock it. Records are kept.
            The reason below is shown to them.
          </Typography>
          <TextField autoFocus fullWidth required size="small" label="Reason shown at sign-in"
            value={lockReason} onChange={(e) => setLockReason(e.target.value)} />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setLockFor(null)}>Cancel</Button>
          <Button color="error" variant="contained" disabled={!lockReason.trim()} onClick={submitLock}>Lock school</Button>
        </DialogActions>
      </Dialog>

      <Dialog open={!!adminFor} onClose={() => setAdminFor(null)} fullWidth maxWidth="sm">
        <DialogTitle>Administrator for {adminFor?.name}</DialogTitle>
        <Box component="form" onSubmit={createAdmin}>
          <DialogContent>
            <Stack spacing={2} sx={{ mt: 1 }}>
              <TextField size="small" label="Full name" required value={admin.full_name}
                onChange={(e) => setAdmin({ ...admin, full_name: e.target.value })} />
              <TextField size="small" label="Email" type="email" required value={admin.email}
                onChange={(e) => setAdmin({ ...admin, email: e.target.value })} />
              <TextField size="small" label="Password" type="password" required value={admin.password}
                onChange={(e) => setAdmin({ ...admin, password: e.target.value })}
                helperText="At least 8 characters" />
              <TextField size="small" label="Position" value={admin.position}
                onChange={(e) => setAdmin({ ...admin, position: e.target.value })}
                placeholder="Head of School" />
            </Stack>
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setAdminFor(null)}>Cancel</Button>
            <Button type="submit" variant="contained">Create administrator</Button>
          </DialogActions>
        </Box>
      </Dialog>
    </Box>
  );
}
