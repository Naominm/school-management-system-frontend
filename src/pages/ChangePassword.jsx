import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Box, Paper, Typography, TextField, Button, Alert } from '@mui/material';
import api from '../api';
import { useAuth } from '../auth';

export default function ChangePassword() {
  const { user, refreshUser } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({ current_password: '', new_password: '', confirm: '' });
  const [msg, setMsg] = useState(null);
  const [busy, setBusy] = useState(false);
  const mismatch = form.confirm && form.confirm !== form.new_password;
  const owed = !!user?.must_change_password;

  async function submit(e) {
    e.preventDefault();
    setBusy(true);
    try {
      await api.post('/auth/change-password', form);
      setForm({ current_password: '', new_password: '', confirm: '' });
      /* Re-read the account before moving on: the server has just cleared
       * must_change_password, and the copy in the browser still says it is
       * owed — which is what holds this person on this form. */
      const fresh = await refreshUser().catch(() => null);
      setMsg({ sev: 'success', text: 'Password updated.' });
      if (owed && !fresh?.must_change_password) {
        navigate(fresh?.role === 'super_admin' ? '/platform' : '/', { replace: true });
      }
    } catch (err) {
      setMsg({ sev: 'error', text: err.response?.data?.error || 'Could not update password' });
    } finally {
      setBusy(false);
    }
  }

  return (
    <Box>
      <Typography variant="h5" gutterBottom>Change password</Typography>
      <Paper sx={{ p: 3, maxWidth: 480 }}>
        {owed && !msg && (
          <Alert severity="info" sx={{ mb: 2 }}>
            Your account was set up with a temporary password. Choose your own to continue.
          </Alert>
        )}
        {msg && <Alert severity={msg.sev} sx={{ mb: 2 }} onClose={() => setMsg(null)}>{msg.text}</Alert>}
        <form onSubmit={submit}>
          <TextField label="Current password" type="password" fullWidth margin="normal" required
            value={form.current_password} onChange={(e) => setForm((f) => ({ ...f, current_password: e.target.value }))} />
          <TextField label="New password (min 8 characters)" type="password" fullWidth margin="normal" required
            value={form.new_password} onChange={(e) => setForm((f) => ({ ...f, new_password: e.target.value }))} />
          <TextField label="Confirm new password" type="password" fullWidth margin="normal" required
            error={!!mismatch} helperText={mismatch ? 'Passwords do not match' : ' '}
            value={form.confirm} onChange={(e) => setForm((f) => ({ ...f, confirm: e.target.value }))} />
          <Button type="submit" variant="contained" disabled={busy || !!mismatch || form.new_password.length < 8}>
            {busy ? 'Updating…' : 'Update password'}
          </Button>
        </form>
      </Paper>
    </Box>
  );
}
