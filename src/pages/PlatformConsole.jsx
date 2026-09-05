import { useEffect, useState } from 'react';
import {
  Box, Paper, Typography, Grid, Button, Chip, TextField, Alert, LinearProgress,
  Dialog, DialogTitle, DialogContent, DialogActions, Stack, Divider,
} from '@mui/material';
import LockIcon from '@mui/icons-material/Lock';
import LockOpenIcon from '@mui/icons-material/LockOpen';
import AddIcon from '@mui/icons-material/Add';
import EditIcon from '@mui/icons-material/Edit';
import DeleteForeverIcon from '@mui/icons-material/DeleteForever';
import api from '../api';
import BrandingEditor from '../components/BrandingEditor';

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
  const [editFor, setEditFor] = useState(null);
  const [brandFor, setBrandFor] = useState(null);
  const [editForm, setEditForm] = useState(blank);
  const [deleteFor, setDeleteFor] = useState(null);
  const [impact, setImpact] = useState(null);
  const [confirmCode, setConfirmCode] = useState('');

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

  function openEdit(s) {
    setEditFor(s);
    setEditForm({ name: s.name, code: s.code, motto: s.motto || '', crest_colour: s.crest_colour || '#C9A227' });
  }

  async function saveEdit(e) {
    e.preventDefault();
    try {
      await api.put(`/platform/schools/${editFor.id}`, editForm);
      setEditFor(null); setOk('School updated'); load();
    } catch (e) { setError(e.response?.data?.error || 'Could not update school'); }
  }

  /* Deleting cascades across every school-owned table, so show exactly what
   * would go before asking the administrator to type the code. */
  async function openDelete(s) {
    setDeleteFor(s); setImpact(null); setConfirmCode('');
    try { setImpact((await api.get(`/platform/schools/${s.id}/impact`)).data.impact); }
    catch { setImpact(null); }
  }

  async function confirmDelete() {
    try {
      const { data } = await api.delete(`/platform/schools/${deleteFor.id}`, { data: { confirm: confirmCode } });
      setDeleteFor(null);
      setOk(`${data.school.name} deleted — removed ${data.removed.students} students, ${data.removed.users} accounts, ${data.removed.marks} marks`);
      load();
    } catch (e) { setError(e.response?.data?.error || 'Could not delete school'); }
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
                <Button size="small" startIcon={<EditIcon />} onClick={() => openEdit(s)}>Edit</Button>
                <Button size="small" onClick={() => setBrandFor(s)}>Logo &amp; colour</Button>
                <Button size="small" color="error" startIcon={<DeleteForeverIcon />} onClick={() => openDelete(s)}>Delete</Button>
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
      <Dialog open={!!brandFor} onClose={() => setBrandFor(null)} fullWidth maxWidth="sm">
        <DialogTitle>Branding — {brandFor?.name}</DialogTitle>
        <DialogContent>
          {brandFor && (
            <Box sx={{ pt: 1 }}>
              <BrandingEditor school={brandFor} onSaved={() => { load(); setBrandFor(null); }} />
            </Box>
          )}
        </DialogContent>
        <DialogActions><Button onClick={() => setBrandFor(null)}>Close</Button></DialogActions>
      </Dialog>

      <Dialog open={!!editFor} onClose={() => setEditFor(null)} fullWidth maxWidth="sm">
        <DialogTitle>Edit {editFor?.name}</DialogTitle>
        <Box component="form" onSubmit={saveEdit}>
          <DialogContent>
            <Stack spacing={2} sx={{ mt: 1 }}>
              <TextField size="small" label="Name" required value={editForm.name}
                onChange={(e) => setEditForm({ ...editForm, name: e.target.value })} />
              <TextField size="small" label="Code" required value={editForm.code}
                onChange={(e) => setEditForm({ ...editForm, code: e.target.value })}
                helperText="Shown on the sign-in picker and on school cards" />
              <TextField size="small" label="Motto" value={editForm.motto}
                onChange={(e) => setEditForm({ ...editForm, motto: e.target.value })} />
              <Stack direction="row" spacing={2} alignItems="center">
                <TextField size="small" label="Crest colour" sx={{ flex: 1 }} value={editForm.crest_colour}
                  onChange={(e) => setEditForm({ ...editForm, crest_colour: e.target.value })}
                  helperText="Hex, e.g. #C9A227" />
                <input type="color" aria-label="Pick crest colour"
                  value={/^#[0-9a-fA-F]{6}$/.test(editForm.crest_colour) ? editForm.crest_colour : '#C9A227'}
                  onChange={(e) => setEditForm({ ...editForm, crest_colour: e.target.value })}
                  style={{ width: 48, height: 40, border: 'none', background: 'none', cursor: 'pointer' }} />
                <Box sx={{ width: 44, height: 44, borderRadius: '10px', flexShrink: 0,
                           bgcolor: /^#[0-9a-fA-F]{6}$/.test(editForm.crest_colour) ? editForm.crest_colour : 'primary.main',
                           color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center',
                           fontFamily: 'Fraunces, Georgia, serif', fontWeight: 700 }}>
                  {editForm.code || '—'}
                </Box>
              </Stack>
            </Stack>
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setEditFor(null)}>Cancel</Button>
            <Button type="submit" variant="contained">Save changes</Button>
          </DialogActions>
        </Box>
      </Dialog>

      <Dialog open={!!deleteFor} onClose={() => setDeleteFor(null)} fullWidth maxWidth="sm">
        <DialogTitle sx={{ color: 'error.main' }}>Delete {deleteFor?.name}?</DialogTitle>
        <DialogContent>
          <Alert severity="error" sx={{ mb: 2 }}>
            This permanently removes the school and everything belonging to it. It cannot be undone.
          </Alert>
          {impact ? (
            <>
              <Typography variant="subtitle2" gutterBottom>This will delete:</Typography>
              <Stack direction="row" spacing={1} sx={{ flexWrap: 'wrap', gap: 1, mb: 2 }}>
                {[['students', impact.students], ['staff & parent accounts', impact.users],
                  ['classes', impact.classes], ['marks', impact.marks],
                  ['attendance records', impact.attendance], ['fee records', impact.fees]]
                  .map(([label, n]) => (
                    <Chip key={label} size="small" color={n ? 'error' : 'default'}
                          label={`${n} ${label}`} variant={n ? 'filled' : 'outlined'} />
                  ))}
              </Stack>
            </>
          ) : <LinearProgress sx={{ mb: 2 }} />}
          <Typography variant="body2" sx={{ mb: 1 }}>
            Type <strong>{deleteFor?.code}</strong> to confirm.
          </Typography>
          <TextField autoFocus fullWidth size="small" value={confirmCode}
            onChange={(e) => setConfirmCode(e.target.value)} placeholder={deleteFor?.code} />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteFor(null)}>Cancel</Button>
          <Button color="error" variant="contained" onClick={confirmDelete}
            disabled={confirmCode.trim().toLowerCase() !== String(deleteFor?.code || '').toLowerCase()}>
            Delete permanently
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
